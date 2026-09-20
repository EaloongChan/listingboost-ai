/**
 * 内部链接检查（零依赖，直接扫 dist/，不依赖服务器）
 *
 *   node scripts/links.mjs
 *
 * 检查 dist 下所有 HTML 里的站内链接与资源引用是否都能落到真实文件：
 *   - <a href="/xxx">
 *   - <link href="/xxx">、<script src>、<img src>
 *   - srcset
 * 同时统计锚点（#hash）指向的 id 是否存在。
 *
 * 339 个页面靠人点是不可能覆盖的，这类检查必须自动化。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(DIST)) {
  console.error('  dist/ 不存在，请先构建');
  process.exit(1);
}

/* ---------- 收集所有 HTML ---------- */
const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) htmlFiles.push(full);
  }
})(DIST);

/* ---------- 建立「已存在的路径」索引 ---------- */
const exists = new Set();
(function walk(dir, prefix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + '/' + e.name;
    if (e.isDirectory()) {
      exists.add(rel);            // 目录本身（用于 /tools/ 这类）
      walk(path.join(dir, e.name), rel);
    } else {
      exists.add(rel);
      if (e.name === 'index.html') exists.add(rel.replace(/\/index\.html$/, '')); // 目录式 URL
    }
  }
})(DIST, '');

const ATTR = /\b(href|src)\s*=\s*"([^"]+)"/g;

const missing = new Map();   // 目标 → 引用它的页面集合
const badAnchors = new Map();
const external = new Set();

function note(map, key, from) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(path.relative(DIST, from).replace(/\\/g, '/'));
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  let m;
  ATTR.lastIndex = 0;
  while ((m = ATTR.exec(html))) {
    const raw = m[2];

    // 跳过外部、协议、内联、data:
    if (/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(raw)) {
      if (/^https?:/i.test(raw)) external.add(raw.split('#')[0]);
      continue;
    }
    if (!raw.startsWith('/')) continue; // 相对路径（当前不使用）

    let [p, hash] = raw.split('#');
    p = p.split('?')[0];
    if (p === '') continue;

    // 归一化：根路径与尾部斜杠
    //   '/'  → ''（walk 时把 index.html 也注册成了去尾的目录路径）
    //   '/tools/' → '/tools'
    const bare = p === '/' ? '' : p.replace(/\/$/, '');
    if (!exists.has(bare) && !exists.has(p) && !exists.has(p + 'index.html')) {
      note(missing, raw, file);
      continue;
    }

    // 锚点检查：只查站内 HTML 页面里的 #id
    if (hash) {
      const target = p.endsWith('/') || !path.extname(p) ? path.join(DIST, p, 'index.html') : path.join(DIST, p);
      const alt = path.join(DIST, bare + ".html");
      const real = fs.existsSync(target) ? target : fs.existsSync(alt) ? alt : null;
      if (real && real.endsWith('.html')) {
        const th = fs.readFileSync(real, 'utf8');
        if (!new RegExp(`id=["']${hash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(th)) {
          note(badAnchors, `${p}#${hash}`, file);
        }
      }
    }
  }
}

/* ---------- 游离属性检查 ----------
   把 <a> 改写成 <div> 时很容易只替换了标签名，把原本挂在开标签上的
   属性（data-*、class 等）留在了后面，变成一段游离的文本节点：
       <a class="card-hit" href="..."></a>
         data-name="..."        ← 这些不再属于任何元素
         data-group="...">
   后果是筛选、搜索等依赖这些属性的功能静默失效（不会报错，只是不工作）。
   HTML 里合法的换行后跟的都是 `<`，所以「`>` + 换行 + 缩进 + 标识符="」基本可以断定是游离属性。 */
const ORPHAN = />[ \t]*\r?\n[ \t]{2,}[a-zA-Z][a-zA-Z0-9_-]*\s*=\s*"/g;
const orphans = new Map();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const hits = html.match(ORPHAN);
  if (hits) {
    const rel = path.relative(DIST, file).replace(/\\/g, '/');
    orphans.set(rel, [...new Set(hits.map((h) => h.trim()))].slice(0, 3));
  }
}

/* ---------- 输出 ---------- */
const line = '─'.repeat(56);
console.log('');
console.log('  内部链接检查');
console.log('  ' + line);
console.log(`  扫描页面    ${htmlFiles.length} 个`);
console.log(`  已有路径    ${exists.size} 个`);
console.log(`  外链        ${external.size} 个（不检查可达性，避免依赖网络）`);

let problems = 0;

if (missing.size) {
  problems += missing.size;
  console.log('');
  console.log(`  ✗ 失效的内部链接 ${missing.size} 个：`);
  [...missing.entries()].slice(0, 40).forEach(([t, froms]) => {
    const list = [...froms];
    console.log(`      ${t}`);
    console.log(`        被 ${list.length} 个页面引用，例如 ${list[0]}`);
  });
  if (missing.size > 40) console.log(`      … 还有 ${missing.size - 40} 个`);
} else {
  console.log(`  ✓ 内部链接全部有效`);
}

if (badAnchors.size) {
  problems += badAnchors.size;
  console.log('');
  console.log(`  ✗ 失效的锚点 ${badAnchors.size} 个：`);
  [...badAnchors.entries()].slice(0, 20).forEach(([t, froms]) => {
    console.log(`      ${t}   ← ${[...froms][0]}`);
  });
} else {
  console.log(`  ✓ 锚点全部有效`);
}

if (orphans.size) {
  problems += orphans.size;
  console.log('');
  console.log(`  ✗ 游离属性（属性脱离了元素，相关功能会静默失效）${orphans.size} 个页面：`);
  [...orphans.entries()].slice(0, 10).forEach(([f, hits]) => {
    console.log(`      ${f}`);
    hits.forEach((h) => console.log(`        ${h.replace(/\s+/g, ' ').slice(0, 60)}`));
  });
} else {
  console.log(`  ✓ 没有游离属性`);
}

console.log('  ' + line);
console.log(problems ? `  发现 ${problems} 个问题` : '  全部通过');
console.log('');
process.exit(problems ? 1 : 0);
