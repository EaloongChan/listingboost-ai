/**
 * 体积与性能预算检查（零依赖）
 *
 *   node scripts/perf.mjs
 *
 * 站点的「重量」只有两个地方真正影响体验：首屏要下载的 CSS/JS，以及最大页面的 HTML。
 * 这个脚本把它们量出来，并给出预算告警——避免内容一直加、体积悄悄失控。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');

/** 预算（gzip 后 KB）。超了就提醒，不阻断。 */
const BUDGET = {
  'assets/main.css': 24,
  'assets/app.js': 16,
  'index.html': 24,
  'prompts/index.html': 60,
  // 236 张卡片 + 每张一条编辑点评；这是本站最有价值的一页，允许它重一些
  'tools/index.html': 52,
  'en/tools/index.html': 58,
  'en/models/index.html': 24,
  'en/index.html': 26,
  'news/live/index.html': 40,
};

if (!fs.existsSync(DIST)) { console.error('  dist/ 不存在，请先构建'); process.exit(1); }

const gz = (file) => zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length;
const raw = (file) => fs.statSync(file).size;
const kb = (n) => n / 1024;
const fmt = (n) => `${kb(n).toFixed(1)} KB`;

const walk = (dir, prefix = '') => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out;
};

const files = walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
const assets = files.filter((f) => /\.(css|js|woff2|png|svg)$/.test(f));

/* ---------- 关键资源 ---------- */
console.log('');
console.log('  体积检查');
console.log('  ' + '─'.repeat(62));
console.log('  关键资源（首屏必下）');
const criticalRaw = raw(path.join(DIST, 'assets/main.css')) + raw(path.join(DIST, 'assets/app.js'));
let budgetHit = 0;

for (const f of ['assets/main.css', 'assets/app.js', 'assets/print.css']) {
  const p = path.join(DIST, f);
  if (!fs.existsSync(p)) continue;
  const g = gz(p);
  const budget = BUDGET[f];
  const over = budget && kb(g) > budget;
  if (over) budgetHit++;
  console.log(`    ${f.padEnd(22)} ${fmt(raw(p)).padStart(9)} → ${fmt(g).padStart(9)}${budget ? `  (预算 ${budget}KB)${over ? '  ✗ 超了' : '  ✓'}` : ''}`);
}
console.log(`    ${'首屏 CSS+JS 合计'.padEnd(20)} ${fmt(criticalRaw).padStart(9)} → ${fmt(gz(path.join(DIST, 'assets/main.css')) + gz(path.join(DIST, 'assets/app.js'))).padStart(9)}`);

/* ---------- 最大的页面 ---------- */
console.log('');
console.log('  最大的 8 个页面');
const sizeOf = html
  .map((f) => ({ f, g: gz(path.join(DIST, f)) }))
  .sort((a, b) => b.g - a.g)
  .slice(0, 8);
for (const { f, g } of sizeOf) {
  const budget = BUDGET[f];
  const over = budget && kb(g) > budget;
  if (over) budgetHit++;
  console.log(`    ${f.padEnd(30)} ${fmt(raw(path.join(DIST, f))).padStart(9)} → ${fmt(g).padStart(9)}${over ? `  ✗ 超预算 ${budget}KB` : ''}`);
}

/* ---------- 汇总 ---------- */
const totalRaw = html.reduce((s, f) => s + raw(path.join(DIST, f)), 0);
const totalGz = html.reduce((s, f) => s + gz(path.join(DIST, f)), 0);
const assetGz = assets.reduce((s, f) => s + gz(path.join(DIST, f)), 0);
const avg = totalGz / Math.max(1, html.length);

console.log('');
console.log('  ' + '─'.repeat(62));
console.log(`  页面        ${html.length} 个，HTML 合计 ${fmt(totalRaw)} → gzip ${fmt(totalGz)}`);
console.log(`  资源        ${assets.length} 个，gzip 合计 ${fmt(assetGz)}`);
console.log(`  单页均值    ${fmt(avg)}（gzip 后）`);
console.log(`  整站产物    ${fmt(files.reduce((s, f) => s + raw(path.join(DIST, f)), 0))}`);

if (budgetHit) {
  console.log('');
  console.log(`  ! ${budgetHit} 项超出预算。要么优化，要么把预算调高——但要知道自己在付出什么代价。`);
}
console.log('');
