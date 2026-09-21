/**
 * 资讯源抓取（零依赖）
 *
 *   node scripts/fetch-news.mjs            抓取全部启用的源，写入 data/feed.json
 *   node scripts/fetch-news.mjs --only arxiv-ai,openai
 *   node scripts/fetch-news.mjs --dry      只打印不写文件
 *
 * 设计原则：
 *   1. 抓取与构建**解耦**。build.mjs 只读 data/feed.json，没有它也能正常构建。
 *      这样构建永远不依赖网络——网络挂了照样能发布，只是没有实时动态。
 *   2. 单个源失败不影响整体。失败信息记进 sources[].error，在页面上如实展示。
 *   3. 只做 RSS/Atom 解析，不引入任何依赖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const UA = 'Mozilla/5.0 (compatible; AIWanxiangBot/1.0; +https://github.com/) static-site-feed-reader';
const TIMEOUT = 15000;
const DELAY = 350; // 源之间礼貌间隔

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- HTML / XML 清洗 ---------------- */

/** 去掉 CDATA 包装 */
const unwrap = (s = '') =>
  s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();

/** 解码常见实体（含数字实体） */
function decode(s = '') {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…',
    mdash: '—', ndash: '–', middot: '·', laquo: '«', raquo: '»',
  };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const c = parseInt(h, 16);
      return Number.isFinite(c) && c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : '';
    })
    .replace(/&#(\d+);/g, (_, d) => {
      const c = parseInt(d, 10);
      return Number.isFinite(c) && c > 0 && c <= 0x10ffff ? String.fromCodePoint(c) : '';
    })
    .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

/** 把一段富文本变成纯文本摘要
 *
 * 注意顺序：必须先解码实体再剥标签，而且要循环两轮。
 * 反例（踩过）：有些源把 HTML 转义成 &lt;p&gt; 塞进 XML，
 * 如果先剥标签（此时还没解码，剥不到）再解码，就会还原出真标签留在摘要里。
 */
function toText(html = '', limit = 180) {
  let s = unwrap(html);
  for (let i = 0; i < 3; i++) {
    const before = s;
    s = decode(s);
    s = s
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<[^>]*>/g, '');
    if (s === before) break; // 已经稳定，不必再循环
  }
  s = s.replace(/\s+/g, ' ').trim();
  if (s.length <= limit) return s;
  // 尽量在句末截断
  const cut = s.slice(0, limit);
  const p = Math.max(
    cut.lastIndexOf('。'), cut.lastIndexOf('.'), cut.lastIndexOf('！'),
    cut.lastIndexOf('!'), cut.lastIndexOf('？'), cut.lastIndexOf('?'),
  );
  return (p > limit * 0.6 ? cut.slice(0, p + 1) : cut) + '…';
}

/* ---------------- RSS / Atom 解析 ---------------- */

const pick = (block, names) => {
  for (const n of names) {
    const re = new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i');
    const m = block.match(re);
    if (m && m[1].trim()) return m[1];
  }
  return '';
};

const pickAttr = (block, name, attr = 'href') => {
  const re = new RegExp(`<${name}[^>]*\\s${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : '';
};

function parseFeed(xml) {
  const head = xml.slice(0, 3000);
  const isAtom = /<feed[\s>]/i.test(head) && !/<rss[\s>]/i.test(head);
  const tagName = isAtom ? 'entry' : 'item';
  const blocks = [...xml.matchAll(new RegExp(`<${tagName}[\\s>][\\s\\S]*?</${tagName}>`, 'gi'))].map((m) => m[0]);

  const items = [];
  for (const b of blocks) {
    let title = toText(pick(b, ['title']), 200);
    if (!title) continue;

    // 链接：Atom 用 <link href>，RSS 用 <link>文本
    let link = '';
    const hrefAll = [...b.matchAll(/<link[^>]*\shref\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
    if (hrefAll.length) {
      // Atom 可能有多个 link，优先 rel="alternate" 或没有 rel 的
      const alt = b.match(/<link[^>]*rel\s*=\s*["']alternate["'][^>]*\shref\s*=\s*["']([^"']+)["']/i);
      link = alt ? alt[1] : hrefAll[0];
    } else {
      link = unwrap(pick(b, ['link', 'guid']));
    }
    link = decode(link).trim();

    const dateRaw = toText(pick(b, ['pubDate', 'published', 'updated', 'dc:date', 'date']), 80);
    const t = new Date(dateRaw);
    const date = Number.isNaN(+t) ? null : t.toISOString();

    const desc = toText(pick(b, ['description', 'summary', 'content:encoded', 'content']), 190);

    items.push({ title, link, date, summary: desc });
  }
  return items;
}

/* ---------------- 抓取 ---------------- */

async function fetchOne(src) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
      signal: ctl.signal,
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    if (!/<(rss|feed|channel)[\s>]/i.test(xml.slice(0, 4000))) throw new Error('返回的不是 RSS/Atom');
    const items = parseFeed(xml);
    if (!items.length) throw new Error('解析出 0 条内容');
    return { ok: true, items };
  } catch (e) {
    const msg = e.name === 'AbortError' ? `超时（>${TIMEOUT / 1000}s）` : e.message;
    return { ok: false, error: msg, items: [] };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.join(DATA, 'feeds.json'), 'utf8'));
  const onlyArg = process.argv.find((a) => a.startsWith('--only'));
  const only = onlyArg ? (process.argv[process.argv.indexOf(onlyArg) + 1] || '').split(',').filter(Boolean) : null;
  const dry = process.argv.includes('--dry');
  const force = process.argv.includes('--force'); // 强制覆盖（抓到的量骤降但确认没问题时用）

  const list = cfg.sources.filter((s) => s.enabled !== false && (!only || only.includes(s.id)));

  console.log('');
  console.log(`  抓取资讯源  ${list.length} 个${only ? `（限定 ${only.join(', ')}）` : ''}`);
  console.log('  ' + '─'.repeat(60));

  const results = [];
  const all = [];

  for (const src of list) {
    const r = await fetchOne(src);
    if (r.ok) {
      const kept = r.items
        .filter((it) => it.link)
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, cfg.maxPerSource || 12);
      kept.forEach((it) => all.push({ ...it, source: src.name, sourceId: src.id, lang: src.lang, topic: src.topic }));
      results.push({ id: src.id, name: src.name, ok: true, count: kept.length });
      console.log(`  ✓ ${src.name.padEnd(20)} ${String(kept.length).padStart(3)} 条`);
    } else {
      results.push({ id: src.id, name: src.name, ok: false, count: 0, error: r.error });
      console.log(`  ✗ ${src.name.padEnd(20)} ${r.error}`);
    }
    await sleep(DELAY);
  }

  /* 去重：按链接规范化 + 标题完全一致 */
  const seenLink = new Set();
  const seenTitle = new Set();
  const norm = (u) => String(u || '')
    .replace(/^https?:\/\//, '').replace(/^www\./, '')
    .replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase();

  const items = [];
  for (const it of all.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))) {
    const lk = norm(it.link);
    const tk = it.title.replace(/\s+/g, '').toLowerCase();
    if (!lk || seenLink.has(lk) || seenTitle.has(tk)) continue;
    seenLink.add(lk);
    seenTitle.add(tk);
    items.push(it);
    if (items.length >= (cfg.maxTotal || 140)) break;
  }

  const okCount = results.filter((r) => r.ok).length;
  const out = {
    updatedAt: new Date().toISOString(),
    sources: results,
    stats: { total: items.length, ok: okCount, failed: results.length - okCount },
    items,
  };

  console.log('  ' + '─'.repeat(60));
  console.log(`  成功 ${okCount}/${results.length} 个源  去重后共 ${items.length} 条`);

  /* ---------- 保护：抓不到东西时不要覆盖已有的好数据 ----------
     踩过一次：某次抓取只拿到 0 条（网络或源的问题），脚本照样把 feed.json 覆盖成空的，
     把之前 140 条有效数据抹掉了，而且构建照常通过、检查才发现。
     这和「外链检查用部分结果覆盖完整结果」是同一类错误：**破坏性写入没有前置判断**。

     规则：只有拿到东西才写。拿到 0 条就直接退出并保留原文件，
     同时用退出码 2 让上游（工作流 / 定时任务）知道这次没成功。 */
  const prevPath = path.join(DATA, 'feed.json');
  let prevCount = 0;
  try { prevCount = (JSON.parse(fs.readFileSync(prevPath, 'utf8')).items || []).length; } catch { /* 文件不存在或坏了 */ }

  /* 保护 0：--only 是「单独验证某个源」的安全模式，默认不该动 feed.json。
     只抓 1 个源却写盘，会把其余 17 个源的数据整体抹掉——即使总量守卫没触发
     （比如源数少、或 maxTotal 尚未填满），这也是一次破坏性写入。 */
  if (only && !force && !dry && only.length < cfg.sources.filter((s) => s.enabled !== false).length) {
    console.error('');
    console.error(`  --only 只抓了 ${only.length} 个源，**不覆盖** data/feed.json（这是验证模式）。`);
    console.error(`    要真的写入请跑全量抓取，或加 --force 明确表示「就是要用这 ${items.length} 条覆盖」。`);
    console.error('');
    process.exit(2);
  }

  if (!items.length) {
    console.error('');
    console.error('  ✗ 这次一条都没抓到，**不覆盖** data/feed.json。');
    if (prevCount) console.error(`    保留了原有的 ${prevCount} 条数据。`);
    console.error('    排查：网络是否可用、各源是否改了地址（见上面的逐源结果）。');
    console.error('    想看看抓到什么可以加 --dry（只打印不写盘）。');
    console.error('');
    process.exit(2);
  }

  // 抓到的量骤降也要警惕：可能大部分源都挂了，写进去会悄悄丢内容
  // --only 是「只测某几个源」的用法，条数天然就少，不适用降幅保护
  if (!only && prevCount >= 20 && items.length < prevCount * 0.4) {
    console.error('');
    console.error(`  ! 这次只抓到 ${items.length} 条，而原有 ${prevCount} 条 —— 降幅超过六成，**不覆盖**。`);
    console.error(`    成功源 ${okCount}/${results.length}。如果确认是这个量没问题，加 --force 强制写入。`);
    console.error('');
    if (!force) process.exit(2);
  }

  if (dry) {
    console.log('  --dry：未写入文件');
    console.log('');
    return;
  }
  fs.writeFileSync(prevPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`  已写入 data/feed.json`);
  console.log('');
}

main().catch((e) => {
  console.error('  抓取失败：', e.message);
  process.exit(1);
});
