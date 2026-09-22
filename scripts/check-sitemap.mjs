/**
 * sitemap 全量可达性检查（零依赖）
 *
 *   node scripts/check-sitemap.mjs                      检查线上（默认 baseUrl）
 *   node scripts/check-sitemap.mjs --base http://127.0.0.1:4173   检查本地构建
 *   node scripts/check-sitemap.mjs --sample 50          只抽查前 50 条
 *   node scripts/check-sitemap.mjs --canonical          额外核对 canonical 是否自指（抽样，慢）
 *
 * 为什么需要它：sitemap 是我们主动交给搜索引擎的"承诺清单"。
 * Google 会照着它逐条抓；里面只要有 404，Search Console 就会累积「无法抓取」，
 * 既浪费抓取预算也降低信任。而**sitemap 是构建产物，页面改名/删条目时最容易对不上**，
 * 偏偏这种事不会让构建失败。
 *
 * 检查两件事：
 *   1. 可达性：每条 URL 都要 200（HEAD 拿不到再 GET 复验，和 check-outbound 一个道理）
 *   2. canonical 自指：页面声明的 canonical 必须是它自己，不是别的页
 *      （canonical 指错 = 告诉 Google「别收录我，去收录那个」）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP = path.join(ROOT, 'dist', 'sitemap.xml');

const argOf = (name, dflt) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : dflt;
};
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'site.config.json'), 'utf8'));
const BASE = (argOf('--base', cfg.baseUrl) || '').replace(/\/$/, '');
const SAMPLE = Number(argOf('--sample', 0)) || 0;
const CHECK_CANON = process.argv.includes('--canonical');
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);
const UA = 'Mozilla/5.0 (compatible; AIWanxiangSitemapCheck/1.0)';

if (!fs.existsSync(SITEMAP)) {
  console.error('  ✗ 找不到 dist/sitemap.xml，先跑 node scripts/build.mjs');
  process.exit(1);
}
const xml = fs.readFileSync(SITEMAP, 'utf8');
let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (SAMPLE) urls = urls.slice(0, SAMPLE);
// 本地检查时把线上域名换成 base
const local = (u) => (BASE === cfg.baseUrl.replace(/\/$/, '') ? u : u.replace(cfg.baseUrl.replace(/\/$/, ''), BASE));

console.log('');
console.log('  sitemap 可达性检查');
console.log('  ' + '─'.repeat(60));
console.log(`  清单      ${urls.length} 条${SAMPLE ? `（抽样前 ${SAMPLE} 条）` : ''}`);
console.log(`  目标      ${BASE}`);
console.log(`  并发      ${CONCURRENCY}`);
console.log('');

async function fetchOnce(url, method) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { method, headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctl.signal });
    return { status: res.status };
  } finally { clearTimeout(timer); }
}

/** HEAD 优先，拿不到结论就 GET 复验（403/405/501 这些不代表页面不存在） */
async function reach(url) {
  try {
    const h = await fetchOnce(url, 'HEAD');
    if (h.status === 200) return { ok: true, status: 200 };
    if ([403, 405, 501].includes(h.status)) {
      const g = await fetchOnce(url, 'GET');
      return g.status === 200 ? { ok: true, status: 'HEAD ' + h.status + ' → GET 200' } : { ok: false, status: g.status };
    }
    const g = await fetchOnce(url, 'GET');   // 404/5xx 也复验一次，排除偶发
    return g.status === 200 ? { ok: true, status: h.status + ' → GET 200（偶发）' } : { ok: false, status: g.status };
  } catch (e) {
    try {
      const g = await fetchOnce(url, 'GET');
      return g.status === 200 ? { ok: true, status: '超时后 GET 200' } : { ok: false, status: g.status };
    } catch (e2) {
      return { ok: false, status: 'ERR ' + (e2.message || '').slice(0, 40) };
    }
  }
}

const results = new Array(urls.length);
let cursor = 0;
let done = 0;
async function worker() {
  while (cursor < urls.length) {
    const i = cursor++;
    results[i] = { url: urls[i], ...(await reach(local(urls[i]))) };
    done++;
    if (done % 100 === 0) process.stdout.write(`  … 已检查 ${done}/${urls.length}\r`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
process.stdout.write(' '.repeat(40) + '\r');

const bad = results.filter((r) => !r.ok);
const flaky = results.filter((r) => r.ok && String(r.status).includes('→'));

console.log(`  200       ${results.length - bad.length} / ${results.length}`);
if (flaky.length) {
  console.log(`  复验通过  ${flaky.length} 条（HEAD 没结论，GET 是好的）`);
}
if (bad.length) {
  console.log('');
  console.log(`  ✗ ${bad.length} 条有问题：`);
  bad.slice(0, 25).forEach((r) => console.log(`    ${String(r.status).padEnd(22)} ${r.url.replace(BASE, '')}`));
  if (bad.length > 25) console.log(`    … 还有 ${bad.length - 25} 条`);
  console.log('');
  console.log('  这些 URL 交出去只会变成 Search Console 里的「无法抓取」。');
  console.log('  多半是页面改过名/删过，但 sitemap 是构建产物 —— 重新构建前先看数据源。');
}

/* ---------- canonical 自指抽查 ---------- */
if (CHECK_CANON) {
  const picks = [];
  const step = Math.max(1, Math.floor(urls.length / 25));
  for (let i = 0; i < urls.length; i += step) picks.push(local(urls[i]));
  let wrong = 0;
  for (const u of picks) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': UA } });
      const html = await res.text();
      const can = (html.match(/<link rel="canonical" href="([^"]+)"/) || [, ''])[1];
      const expected = u.split('#')[0];
      if (can.replace(/\/$/, '') !== expected.replace(/\/$/, '')) {
        wrong++;
        console.log(`  ✗ canonical 不是自指：${u.replace(BASE, '')} → ${can || '（没有）'}`);
      }
    } catch { /* 可达性已经查过 */ }
  }
  console.log('');
  console.log(`  canonical 抽查 ${picks.length} 条，指错 ${wrong} 条`);
}

console.log('');
process.exitCode = bad.length ? 1 : 0;
