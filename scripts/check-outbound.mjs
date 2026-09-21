/**
 * 外链健康检查（零依赖）
 *
 *   node scripts/check-outbound.mjs            检查并写入 data/outbound-health.json
 *   node scripts/check-outbound.mjs --dry      只检查不写文件
 *   node scripts/check-outbound.mjs --only tools
 *   node scripts/check-outbound.mjs --limit 30 只查前 N 个（快速冒烟）
 *
 * 为什么需要它：目录站最容易腐烂的地方就是外链。工具改域名、停售、被收购是常态，
 * 而我们全站有 1000+ 个外链，人工点不过来。
 *
 * 纪律（避免误杀）：
 *   · 连续两次失败才标记「待核验」，一次失败可能只是网络抖动
 *   · 不自动删除任何条目 —— 只报告，人工决定
 *   · 每周跑一次，不是每次构建都跑（省时间也省对方的服务器）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE = path.join(ROOT, 'data', 'outbound-health.json');
const DRY = process.argv.includes('--dry');
const onlyArg = process.argv.indexOf('--only');
const ONLY = onlyArg !== -1 ? process.argv[onlyArg + 1] : '';
const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : 0;

const UA = 'Mozilla/5.0 (compatible; AIWanxiangLinkCheck/1.0)';
const TIMEOUT = Number(process.env.LINK_TIMEOUT || 6000);
const DELAY = 120; // 对目标站点客气一点

/* 熔断一：连续这么多次「网络层失败」就认为本机网络不可用，直接停下。
   踩过一次：网络很差时每个链接都要等满超时，300 个链接跑了 15 分钟还没完，
   而且结论毫无价值（全是超时）。检查开始前先判断前置条件是否成立。 */
const BREAKER = 12;

/* 熔断二：总时间预算。网络半通不通时（部分成功会重置上面的连续计数），
   上面那个熔断不会触发，还是会一路磨下去。所以再加一道硬天花板：
   超时就停下，把已经查到的部分如实报告为「部分结果」。 */
const MAX_MS = Number(process.env.LINK_MAX_MS || 240000); // 默认 4 分钟

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

/** 网络层失败（不是对方返回 4xx，而是根本没连上） */
const isNetworkError = (r) => !!r.error && !/^HTTP /.test(r.error);

/* ---------- 收集要检查的 URL ---------- */
function collect() {
  const groups = [];

  const tools = read('tools.json');
  groups.push({
    name: '工具官网',
    items: tools.map((t) => ({ id: t.id, name: t.name, url: t.url, kind: 'tool' })),
  });

  const learn = read('learn.json');
  groups.push({
    name: '学习资源',
    items: learn.map((l) => ({ id: l.id, name: l.title, url: l.url, kind: 'learn' })),
  });

  const news = read('news.json');
  groups.push({
    name: '资讯信息源',
    items: (news.sources || []).map((s, i) => ({ id: `news-${i}`, name: s.name, url: s.url, kind: 'news-source' })),
  });

  const feeds = read('feeds.json');
  groups.push({
    name: '实时动态源',
    items: (feeds.sources || []).filter((s) => s.enabled !== false).map((s) => ({ id: s.id, name: s.name, url: s.url, kind: 'feed' })),
  });

  return ONLY ? groups.filter((g) => g.name.includes(ONLY) || g.items.some((i) => i.kind === ONLY)) : groups;
}

/* ---------- 检查单个 URL ---------- */
async function probe(url) {
  /** HEAD 优先，很多站点不支持就用 GET 兜底 */
  const attempt = async (method) => {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT);
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
        signal: ctl.signal,
      });
      // 有些站点对 HEAD 返回 405/403，但那不代表链接坏了，交给上层判断
      if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 501)) return null;
      return { status: res.status, finalUrl: res.url || url };
    } catch (e) {
      return { error: e.name === 'AbortError' ? '超时' : e.message };
    } finally {
      clearTimeout(timer);
    }
  };

  let r = await attempt('HEAD');
  if (r === null) r = await attempt('GET');
  if (!r || (r.error && r.error !== '超时')) {
    // HEAD 直接抛错的话，再用 GET 试一次
    const g = await attempt('GET');
    if (g && !g.error) r = g;
  }
  return r || { error: '未知失败' };
}

/* ---------- 主流程 ---------- */
async function main() {
  const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : { checkedAt: '', items: {} };
  const prev = state.items || {};

  const groups = collect();
  let all = groups.flatMap((g) => g.items);
  if (LIMIT) all = all.slice(0, LIMIT);

  console.log('');
  console.log('  外链健康检查');
  console.log('  ' + '─'.repeat(60));
  console.log(`  共 ${all.length} 个链接${ONLY ? `（限定 ${ONLY}）` : ''}`);
  if (state.checkedAt) console.log(`  上次检查 ${String(state.checkedAt).slice(0, 16).replace('T', ' ')}`);
  console.log('');

  const next = {};
  const okList = [];
  const softFail = [];   // 第一次失败
  const hardFail = [];   // 连续两次失败 → 待核验
  const moved = [];      // 有效但有跳转
  let netErrors = 0;     // 连续网络层失败计数，用于熔断
  const t0 = Date.now();
  let timedOut = false;

  for (let i = 0; i < all.length; i++) {
    // ---- 熔断二：总时间预算 ----
    if (Date.now() - t0 > MAX_MS) {
      timedOut = true;
      console.log('');
      console.log(`  ! 已用满 ${Math.round(MAX_MS / 1000)} 秒时间预算，停在 ${i} / ${all.length}。`);
      console.log('    下面是**部分结果**。要完整的就放到 GitHub Actions 上跑（那边网络通畅），');
      console.log('    或本地用 --limit N 只抽查一部分。');
      break;
    }

    const it = all[i];
    const r = await probe(it.url);
    const ok = r.status && r.status >= 200 && r.status < 400;

    // ---- 熔断判断 ----
    if (isNetworkError(r)) {
      netErrors++;
      if (netErrors >= BREAKER) {
        console.log('');
        console.log('  ' + '─'.repeat(60));
        console.log(`  ✗ 连续 ${BREAKER} 个链接都是网络层失败（不是对方返回错误，是根本连不上）。`);
        console.log('    本机网络当前访问外网不可用，继续跑下去只会耗时间而且结论没有意义。');
        console.log(`    已检查 ${i + 1} / ${all.length}，结果未写入（避免用错误数据覆盖上次的好结果）。`);
        console.log('');
        console.log('    这个检查本来就设计成在 GitHub Actions 上跑（那边网络通畅，结果才可信）：');
        console.log('    https://github.com/EaloongChan/listingboost-ai/actions');
        console.log('');
        process.exit(2);
      }
    } else {
      netErrors = 0; // 只要有一个请求成功过（哪怕对方 404），就重置计数
    }

    next[it.id] = {
      name: it.name,
      url: it.url,
      status: ok ? r.status : 0,
      finalUrl: r.finalUrl || it.url,
      error: r.error || '',
      checkedAt: new Date().toISOString(),
      failCount: ok ? 0 : (prev[it.id]?.failCount || 0) + 1,
    };

    if (ok) {
      okList.push(it);
      if (r.finalUrl && r.finalUrl !== it.url && r.finalUrl.replace(/\/$/, '') !== it.url.replace(/\/$/, '')) {
        moved.push({ ...it, to: r.finalUrl });
      }
    } else if (next[it.id].failCount >= 2) {
      hardFail.push({ ...it, err: r.error || `HTTP ${r.status}` });
    } else {
      softFail.push({ ...it, err: r.error || `HTTP ${r.status}` });
    }

    if ((i + 1) % 25 === 0) process.stdout.write(`    …已检查 ${i + 1}/${all.length}\n`);
    await sleep(DELAY);
  }

  /* ---------- 报告 ---------- */
  console.log('');
  console.log('  ' + '─'.repeat(60));
  console.log(`  正常            ${okList.length}`);
  console.log(`  首次失败        ${softFail.length}${softFail.length ? '（可能只是抖动，下次复查）' : ''}`);
  console.log(`  连续失败待核验   ${hardFail.length}${hardFail.length ? '  ← 需要人工确认' : ''}`);
  console.log(`  跳到别处        ${moved.length}${moved.length ? '（建议更新数据里的 URL）' : ''}`);

  if (hardFail.length) {
    console.log('');
    console.log('  连续两次失败，建议人工确认：');
    hardFail.slice(0, 30).forEach((x) => console.log(`    ${x.name.padEnd(22)} ${x.err.padEnd(12)} ${x.url}`));
    if (hardFail.length > 30) console.log(`    … 还有 ${hardFail.length - 30} 个`);
  }
  if (moved.length) {
    console.log('');
    console.log('  有跳转（可能已改域名）：');
    moved.slice(0, 20).forEach((x) => console.log(`    ${x.name.padEnd(22)} → ${x.to}`));
    if (moved.length > 20) console.log(`    … 还有 ${moved.length - 20} 个`);
  }

  if (DRY || timedOut) {
    console.log('');
    console.log(DRY ? '  --dry：未写入 data/outbound-health.json' : '  部分结果未写盘（不覆盖上次的完整结果）');
    console.log('');
    return;
  }

  fs.writeFileSync(STATE, JSON.stringify({ checkedAt: new Date().toISOString(), items: next }, null, 2) + '\n', 'utf8');
  console.log('');
  console.log('  已写入 data/outbound-health.json');
  console.log('');
}

main().catch((e) => {
  console.error('  检查失败：', e.message);
  process.exit(1);
});
