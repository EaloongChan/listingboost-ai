/**
 * 主动推送 URL 给百度（零依赖）
 *
 *   BAIDU_TOKEN=xxx node scripts/push-search.mjs           增量推送（推荐）
 *   BAIDU_TOKEN=xxx node scripts/push-search.mjs --seed    首次播种：推核心页面
 *   BAIDU_TOKEN=xxx node scripts/push-search.mjs --dry     只列出要推什么，不真推
 *   node scripts/push-search.mjs --list                    没有 token 也能看清单
 *
 * 为什么需要它：新站如果只靠百度自己发现，收录周期可能长达数周。
 * 主动推送是「发布即通知」，这是新站抢收录最直接的杠杆。
 *
 * 两条纪律（百度明确说过，违反会降配额甚至收回权限）：
 *   1. **不要重复推旧链接** —— 用 data/pushed-urls.json 记录已推过的，只推新增
 *   2. **不要一次推全站** —— 新站配额很小，优先推首页、栏目页和新内容
 *
 * token 从环境变量读，不写进代码。本地跑临时给，线上跑放在 GitHub Secrets。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE = path.join(ROOT, 'data', 'pushed-urls.json');
const SITE = process.env.SITE_HOST || 'www.ealoongchan.top';
const TOKEN = process.env.BAIDU_TOKEN || '';
const API = `https://ziyuan.baidu.com/linksubmit/api/urls?site=${SITE}&token=${TOKEN}`;

const SEED = process.argv.includes('--seed');
const DRY = process.argv.includes('--dry') || process.argv.includes('--list');
const LIST_ONLY = process.argv.includes('--list');

/** 单次推送上限。新站配额小，宁少勿滥。 */
const MAX_PER_RUN = Number(process.env.PUSH_LIMIT || 80);

const line = (s = '') => console.log(s);

function readState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE, 'utf8'));
    return { pushed: new Set(s.pushed || []), lastRun: s.lastRun || '' };
  } catch {
    return { pushed: new Set(), lastRun: '' };
  }
}

function writeState(set) {
  const arr = [...set];
  fs.writeFileSync(STATE, JSON.stringify({ lastRun: new Date().toISOString(), pushed: arr }, null, 2) + '\n', 'utf8');
}

/** 从 sitemap 里取全部 URL */
function readSitemap() {
  const p = path.join(ROOT, 'dist', 'sitemap.xml');
  if (!fs.existsSync(p)) {
    line('  ✗ dist/sitemap.xml 不存在，先跑 node scripts/build.mjs');
    process.exit(1);
  }
  const xml = fs.readFileSync(p, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/**
 * 优先级：新站先把「值得先被收录」的页面推出去。
 * 工具详情页有 236 个，全推会瞬间烧光配额，所以只在播种时挑一部分。
 */
function prioritize(urls, seedMode) {
  const home = [];
  const sections = [];
  const categories = [];
  const content = [];

  for (const u of urls) {
    const p = new URL(u).pathname;
    if (p === '/') home.push(u);
    else if (/^\/(tools|playbooks|prompts|models|news|learn|glossary|compare|about)\/$/.test(p)) sections.push(u);
    else if (/^\/(tools\/[a-z0-9-]+\/|models\/[a-z]+\/|prompts\/[a-z]+\/|playbooks\/[a-z]+\/|learn\/[a-z]+\/)$/.test(p)) categories.push(u);
    else if (/^\/(playbooks|news)\/[a-z0-9-]+\/$/.test(p)) content.push(u); // 长文与解读，最值得收录
    else if (/^\/tools\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(p)) content.push(u);
    else content.push(u);
  }
  if (!seedMode) return [...home, ...sections, ...categories, ...content];
  // 播种：首页 + 栏目 + 分类 + 前 40 条内容，控制在配额内
  return [...home, ...sections, ...categories, ...content.slice(0, 40)];
}

async function main() {
  line('');
  line('  推送给百度');
  line('  ' + '─'.repeat(60));

  const all = readSitemap();
  const state = readState();

  // 英文版暂不推百度（百度对英文内容兴趣低，优先把配额给中文页面）
  const zh = all.filter((u) => !new URL(u).pathname.startsWith('/en/'));

  const ordered = prioritize(zh, SEED);
  const fresh = ordered.filter((u) => !state.pushed.has(u));
  const batch = fresh.slice(0, MAX_PER_RUN);

  line(`  sitemap 共        ${all.length} 条（中文 ${zh.length}）`);
  line(`  已推过            ${state.pushed.size} 条`);
  line(`  本次待推          ${fresh.length} 条，本次实际推 ${batch.length} 条（上限 ${MAX_PER_RUN}）`);
  if (state.lastRun) line(`  上次推送          ${state.lastRun.slice(0, 16).replace('T', ' ')}`);
  line('');

  if (!batch.length) {
    line('  没有新 URL 需要推。');
    line('');
    return;
  }

  if (DRY) {
    line('  本次会推这些（前 15 条）：');
    batch.slice(0, 15).forEach((u) => line(`    ${u}`));
    if (batch.length > 15) line(`    … 还有 ${batch.length - 15} 条`);
    line('');
    if (LIST_ONLY) {
      line('  （--list 只列清单，不推送）');
      line('');
      return;
    }
    line('  （--dry 只列清单，不推送）');
    line('');
    return;
  }

  if (!TOKEN) {
    line('  ✗ 没有 BAIDU_TOKEN，跳过推送。');
    line('');
    line('  怎么拿到 token：');
    line('    1. 打开 https://ziyuan.baidu.com 注册并登录');
    line('    2. 用户中心 → 站点管理 → 添加网站，填 ' + SITE);
    line('    3. 验证方式选「文件验证」或「HTML 标签验证」（两种我都能配合）');
    line('    4. 验证通过后进「普通收录 → API 提交」，复制 token');
    line('    5. 本地跑：BAIDU_TOKEN=你的token node scripts/push-search.mjs --seed');
    line('       线上跑：把 token 加到 GitHub 仓库的 Secrets，名字叫 BAIDU_TOKEN');
    line('');
    process.exitCode = 0; // 没 token 不算失败，别让流水线红掉
    return;
  }

  line('  正在推送……');
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: batch.join('\n'),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* 百度有时返回非 JSON */ }

    if (data && typeof data.success === 'number') {
      line(`  ✓ 成功 ${data.success} 条，剩余配额 ${data.remain}`);
      if (data.not_same_site && data.not_same_site.length) line(`  ! ${data.not_same_site.length} 条域名不匹配，已忽略`);
      if (data.not_valid && data.not_valid.length) line(`  ! ${data.not_valid.length} 条格式不合法，已忽略`);

      // 只把成功推出去的记进状态，避免浪费额度
      const okCount = data.success;
      batch.slice(0, okCount).forEach((u) => state.pushed.add(u));
      writeState(state.pushed);
      line(`  已记录到 data/pushed-urls.json，下次不会再推这些`);
    } else if (data && data.error) {
      line(`  ✗ 百度返回错误：${data.error}${data.message ? ' / ' + data.message : ''}`);
      if (/token/i.test(String(data.error))) line('     token 不对，回搜索资源平台重新复制一次');
      process.exitCode = 1;
    } else {
      line(`  ? 返回内容无法解析：${text.slice(0, 200)}`);
      process.exitCode = 1;
    }
  } catch (e) {
    line(`  ✗ 推送失败：${e.message}`);
    process.exitCode = 1;
  }
  line('');
}

main().catch((e) => {
  console.error('  推送脚本出错：', e.message);
  process.exit(1);
});
