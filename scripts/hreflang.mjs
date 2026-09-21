/**
 * 双语 hreflang 一致性审计。
 *
 * 背景：hreflang 只在页面显式给了 altPath 时才输出（layout.mjs）。
 * 英文版是分批加的，所以「英文页存在但中文页没指过去」这种漏配很容易出现 ——
 * 后果是 Google 可能把两个语言版本当成重复内容，而不是同一页的两种语言。
 *
 * 这里不猜规则，直接拿 dist 里的实际情况对：英文页声明了 zh-CN 指向谁，
 * 那个中文页就必须反过来声明 en 指回来。单向 = 漏配。
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, out);
    else if (e.name === 'index.html') out.push(f.replace(/\\/g, '/'));
  }
  return out;
}

const pages = walk(DIST);
const info = {};
for (const f of pages) {
  const h = fs.readFileSync(f, 'utf8');
  const alts = {};
  for (const m of h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)) alts[m[1]] = m[2];
  info[f] = { alts, url: '/' + f.replace(/^dist\//, '').replace(/index\.html$/, '') };
}

const urls = Object.fromEntries(Object.values(info).map((v) => [v.url, v]));
const oneWay = [];
const both = [];

for (const [f, v] of Object.entries(info)) {
  const isEn = v.url.startsWith('/en/');
  if (isEn) {
    const zhUrl = v.alts['zh-CN'];
    if (!zhUrl) continue;
    const zhPath = new URL(zhUrl).pathname;
    const zh = urls[zhPath];
    if (!zh) { oneWay.push(`${v.url}  →  ${zhPath}（对端不存在）`); continue; }
    if (!zh.alts.en) oneWay.push(`${v.url}  →  ${zhPath}（中文页没有指回来）`);
    else both.push(v.url);
  }
}

console.log('英文页声明了 zh-CN 的:', Object.values(info).filter((v) => v.url.startsWith('/en/') && v.alts['zh-CN']).length);
console.log('其中中文页正确指回的:', both.length);
console.log();
if (oneWay.length) {
  console.log('✗ 单向 hreflang（' + oneWay.length + ' 处）:');
  oneWay.forEach((x) => console.log('  ' + x));
} else console.log('✓ 所有声明了 zh-CN 的英文页，中文页都指回来了');
// 反向也查：英文页没有 zh-CN 的（英文有、中文没配）
const enNoZh = Object.values(info).filter((v) => v.url.startsWith('/en/') && !v.alts['zh-CN'] && !v.url.includes('/en/api/'));
console.log();
console.log('英文页没有 zh-CN 声明的:', enNoZh.length, '（' + enNoZh.slice(0, 6).map((v) => v.url).join(', ') + (enNoZh.length > 6 ? ', …' : '') + '）');

/* 单向 hreflang 必须让整条 verify 失败，不能只打印一行字。
   Google 对单向 hreflang 的处理是**整条忽略**，等于两个语言版本被当成重复内容 ——
   这是静默失效，只在 CI 输出里躺着是拦不住的。 */
if (oneWay.length) process.exit(1);
