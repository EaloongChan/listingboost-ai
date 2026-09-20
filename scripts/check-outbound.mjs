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
const TIMEOUT = 15000;
const DELAY = 200; // 对目标站点客气一点

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));

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

  for (let i = 0; i < all.length; i++) {
    const it = all[i];
    const r = await probe(it.url);
    const ok = r.status && r.status >= 200 && r.status < 400;

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

  if (DRY) {
    console.log('');
    console.log('  --dry：未写入 data/outbound-health.json');
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
