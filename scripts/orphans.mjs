/**
 * 内链可达性审计（孤儿页检测）。
 *
 * 为什么单独做一个脚本：links.mjs 查的是「链出去的地址存不存在」（断链）；
 * 这里查的是反过来 —— **有没有任何页面链到它**（孤儿）。
 * 孤儿页不会报错，也能通过 sitemap 被发现，但内部权重传不进去，
 * 而且新页面上线时最容易漏挂入口 —— 尤其是分批加内容的时候
 * （比如英文站的东西是一批批翻译出来的，很容易翻译完忘了加链接）。
 *
 * 判定口径：
 *   · 只看 <a href> 的站内链接，不数 sitemap（sitemap 是被动发现，不算内链）
 *   · 首页、导航、页脚在每个页面上都有，所以它们天然不是孤儿
 *   · noindex 的页面单独标注：它们不需要排名，孤儿无所谓，但值得知道
 *   · 入口只有「导航/页脚」的页面会标出来 —— 那是全站链接，权重等于没有
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const BASE = (process.env.SITE_BASE || 'https://www.ealoongchan.top').replace(/\/$/, '');

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name).replace(/\\/g, '/');
    if (e.isDirectory()) walk(f, out);
    else if (e.name.endsWith('.html')) out.push(f);
  }
  return out;
}

const files = walk(DIST);
const pageUrl = (f) =>
  f === DIST + '/index.html' ? '/' : '/' + f.slice(DIST.length + 1).replace(/index\.html$/, '');

const pages = new Map();
for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  /* 语言切换按钮要排除掉。
     它是一个「指向另一个语言版本」的链接，不算编辑意义上的内链 ——
     如果不排除，中文提示词分类页会被判定为「有入链」，但实际上
     全站没有任何页面在正文里链到它，它仍然是事实上的孤岛。
     第一次跑这个审计就被它骗过去了（只报了 4 个孤儿页）。 */
  html = html.replace(/<a class="icon-btn lang-btn"[\s\S]*?<\/a>/g, '');
  const url = pageUrl(f);
  const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);
  const internal = hrefs
    .filter((h) => h.startsWith('/') || h.startsWith(BASE))
    .map((h) => (h.startsWith(BASE) ? h.slice(BASE.length) || '/' : h))
    .map((h) => h.split('#')[0].split('?')[0])
    .filter((h) => h && !/\.(png|jpg|svg|ico|css|js|json|xml|txt|webp|woff2?)$/i.test(h));
  pages.set(url, {
    file: f,
    hrefs: internal,
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
    en: url.startsWith('/en/'),
  });
}

// 全站导航/页脚链接（几乎每页都有）—— 只靠这些链接进来的页面要单独标出来
const COUNT = pages.size;
const inbound = new Map();
for (const [, p] of pages) {
  for (const h of new Set(p.hrefs)) {
    if (!inbound.has(h)) inbound.set(h, new Set());
    inbound.get(h).add(p.file);
  }
}

const orphans = [];
const weak = [];
for (const [url, p] of pages) {
  if (url === '/404.html' || url === '/404/') continue;
  const from = inbound.get(url);
  const n = from ? from.size : 0;
  if (n === 0) orphans.push({ url, noindex: p.noindex, en: p.en });
  else if (n <= 2) weak.push({ url, n, noindex: p.noindex, en: p.en });
}

orphans.sort((a, b) => a.url.localeCompare(b.url));
weak.sort((a, b) => a.n - b.n || a.url.localeCompare(b.url));

const line = (x) => `  ${x.url}${x.noindex ? '  [noindex]' : ''}`;

console.log(`页面总数      ${COUNT}`);
console.log(`有入链的页面  ${COUNT - orphans.length}`);
console.log();

if (orphans.length) {
  const real = orphans.filter((x) => !x.noindex);
  console.log(`✗ 孤儿页（没有任何内链指向）${orphans.length} 个，其中需要排名的 ${real.length} 个：`);
  orphans.forEach((x) => console.log(line(x)));
} else {
  console.log('✓ 没有孤儿页');
}

console.log();
if (weak.length) {
  console.log(`! 入链极少（≤2 个来源，基本等于没有内链权重）${weak.length} 个：`);
  weak.slice(0, 20).forEach((x) => console.log(`  ${x.n}  ← ${x.url}${x.noindex ? '  [noindex]' : ''}`));
  if (weak.length > 20) console.log(`  …还有 ${weak.length - 20} 个`);
} else {
  console.log('✓ 没有入链极少的页面');
}

/* 分语言看一遍：英文站的孤儿页最值得关注，因为它是一批批加出来的 */
const enOrphan = orphans.filter((x) => x.en && !x.noindex);
console.log();
console.log(`英文站孤儿页：${enOrphan.length}${enOrphan.length ? ' → ' + enOrphan.map((x) => x.url).join(', ') : ''}`);

if (orphans.filter((x) => !x.noindex).length) process.exit(1);
