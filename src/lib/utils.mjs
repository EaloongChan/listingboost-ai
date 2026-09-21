/** 通用工具函数 */

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** 用于 <script> 内嵌 JSON，需转义 </script 与行分隔符 */
export function jsonEmbed(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// 柔版印刷平面色盘（与 data/categories.json 的 accent 保持一致）
const PALETTE = [
  '#1B4DFF', '#00875A', '#FF3B00', '#7C3AED', '#0E7490',
  '#E5337B', '#B45309', '#4F46E5', '#F5A524', '#0F766E',
  '#A21CAF', '#57534E',
];

/** 由字符串稳定地推导一个颜色 */
export function hashColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/* ---------------- 颜色与对比度 ----------------
   全部按 WCAG 相对亮度计算。这里的函数承载了整个站点的可读性，
   改动前请先跑 node scripts/a11y.mjs。 */

const toLin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const parseHex = (hex) => {
  const h = String(hex).replace('#', '');
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const toHex = ([r, g, b]) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

const relLum = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);

/** 两个颜色的对比度（1~21） */
export function contrastRatio(a, b) {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return 1;
  const l1 = relLum(ca);
  const l2 = relLum(cb);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const INK = '#0e0e0c';   // 浅色主题下的最深文字色
const WHITE = '#ffffff';

/**
 * 给定背景色，返回在其上对比度更高的文字颜色。
 *
 * 两个容易写错的地方：
 *   1. 方向。要比的是「文字放在这个背景上」的对比度，
 *      即 contrast(bg, WHITE) 与 contrast(bg, INK) 谁大，而不是「这个色当文字用」。
 *   2. 阈值不是「看起来差不多」的 0.45。解 (L+0.05)/0.05 = 1.05/(L+0.05) 得 L = 0.1791，
 *      此时黑白效果相同。用 0.45 会让 #FF3B00 这类中亮度色配上白字，实际只有 3.7:1（不达标）。
 */
export function readableOn(hex = '#000000') {
  const c = parseHex(hex);
  if (!c) return WHITE;
  const withWhite = contrastRatio(hex, WHITE);
  const withInk = contrastRatio(hex, INK);
  return withWhite >= withInk ? WHITE : INK;
}

/** 把颜色朝某个方向混合，返回新色 */
function mix(hex, toward, t) {
  const c = parseHex(hex);
  const d = parseHex(toward);
  if (!c || !d) return hex;
  return toHex(c.map((v, i) => v + (d[i] - v) * t));
}

/**
 * 把前景色调整到在给定背景上达到目标对比度。
 * 用于「用分类色当文字色」的场景——原始分类色作文字几乎都不达标。
 */
export function ensureContrast(hex, bg, target = 4.5) {
  if (contrastRatio(hex, bg) >= target) return hex;
  const toward = relLum(parseHex(bg) || [255, 255, 255]) > 0.5 ? '#000000' : '#ffffff';
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(hex, toward, t);
    if (contrastRatio(c, bg) >= target) return c;
  }
  return toward;
}

/**
 * 把背景色调整到与给定前景色达到目标对比度（用于头像色块等）。
 * 前景是浅色就把背景压暗，前景是深色就把背景提亮——方向不能反。
 */
export function ensureBgContrast(hex, fg, target = 4.5) {
  if (contrastRatio(hex, fg) >= target) return hex;
  const toward = fg === WHITE ? '#000000' : '#ffffff';
  for (let t = 0.05; t <= 0.9; t += 0.05) {
    const c = mix(hex, toward, t);
    if (contrastRatio(c, fg) >= target) return c;
  }
  return mix(hex, toward, 0.9);
}

/** 由分类色生成 avatar / 图标块的内联样式（背景与前景都保证达标） */
export function accentStyle(hex = '#7c5cff') {
  const fg = readableOn(hex);
  // 若原始色配这个前景色仍不达标，就微调背景而不是换前景（换前景会翻转明暗关系）
  const bg = ensureBgContrast(hex, fg, 4.5);
  return `--c:${bg};--c-fg:${fg}`;
}

/**
 * 分类色当作「文字色」用时（标签、步骤引用等）的内联样式。
 * 同一个 HTML 要同时服务深浅两套主题，所以两套值都算出来交给 CSS 选。
 *
 * 关键：底色不能按纯白/纯黑算，要按该主题里**对比最不利的那个表面色**算：
 *   浅色主题最不利的是 --surface-2 #eae7de（比白色深，深色文字在上面更难读）
 *   深色主题最不利的是 --surface-2 #1f1f1a（比页面底色浅，浅色文字在上面更难读）
 * 按纯白算会得到「刚好达标」的值，放到实际底色上就差一点点（实测 4.43 而需要 4.5）。
 */
const WORST_LIGHT_SURFACE = '#eae7de';
const WORST_DARK_SURFACE = '#1f1f1a';

export function accentTextStyle(hex = '#7c5cff') {
  const light = ensureContrast(hex, WORST_LIGHT_SURFACE, 4.5);
  const dark = ensureContrast(hex, WORST_DARK_SURFACE, 4.5);
  return `--t-l:${light};--t-d:${dark}`;
}

/** 取首字母/首字作为头像文字 */
export function initials(name = '') {
  const s = String(name).trim();
  if (!s) return '?';
  const m = s.match(/[A-Za-z][A-Za-z0-9]*/g);
  if (m && m.length) {
    if (m.length >= 2) return (m[0][0] + m[1][0]).toUpperCase();
    return m[0].slice(0, 2).toUpperCase();
  }
  return s.slice(0, 2);
}

export function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  if (!m) return y;
  if (!d) return `${y}年${Number(m)}月`;
  return `${y}-${m}-${d}`;
}

export function fmtDateCN(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-');
  if (!m) return `${y} 年`;
  if (!d) return `${y} 年 ${Number(m)} 月`;
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

export function relDate(iso, now = new Date()) {
  if (!iso) return '';
  const t = new Date(iso + (iso.length === 7 ? '-01' : '') + 'T00:00:00');
  if (Number.isNaN(+t)) return iso;
  const days = Math.floor((now - t) / 86400000);
  if (days < 0) return '即将';
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export function groupBy(arr, key) {
  return arr.reduce((acc, it) => {
    const k = typeof key === 'function' ? key(it) : it[key];
    (acc[k] ||= []).push(it);
    return acc;
  }, {});
}

export function countBy(arr, key) {
  const out = {};
  for (const it of arr) {
    const k = typeof key === 'function' ? key(it) : it[key];
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export function uniq(arr) {
  return [...new Set(arr)];
}

/** 把 {{变量}} 换成带高亮的 span，用于展示 */
export function highlightVars(text) {
  return esc(text).replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, v) => {
    return `<span class="var-hl">{{${esc(v)}}}</span>`;
  });
}

/** 把 {{变量}} 替换成实际值 */
export function fillVars(text, values = {}) {
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, k) => {
    const v = values[k.trim()];
    return v == null ? `{{${k}}}` : String(v);
  });
}

/** 生成 URL 友好的 slug */
export function slug(s = '') {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-');
}

export function readingTime(text = '') {
  const n = String(text).length;
  return Math.max(1, Math.round(n / 400));
}

export function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

/**
 * 术语锚点的 slug。
 *
 * 踩过一次：目标锚点用 `en || term` 算 slug，而引用处用词条名算 ——
 * 「LoRA」的 en 是「Low-Rank Adaptation」，两边算出的 slug 不同，
 * 于是链到了不存在的锚点，13 条链接静默失效。
 * **算 slug 的规则只能有一份**，所以抽到这里共用。
 */
export function termSlug(g) {
  const s = String((g && (g.en || g.term)) || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || 'term';
}

/**
 * 术语「名字 → slug」表，统一在这里构造。
 *
 * 为什么不是简单地把 term 映射一遍：`related` 字段里出现的是**人写的关联词**，
 * 有的是词条中文名，有的是英文名（RAG / Embedding / Agent），有的是缩写（MCP / ToT）。
 * 只按 term 建表，这些就会退化成不可点的纯标签。
 * 三个命名空间已核对无碰撞（2026-09-21），且优先级 term > en > abbr：
 * 先出现的先占位，避免别名把真正的词条名挤掉。
 */
export function buildGlossSlugMap(glossary) {
  const map = {};
  const put = (key, slug) => {
    if (key && !(key in map)) map[key] = slug;
  };
  for (const g of glossary) put(g.term, termSlug(g));
  for (const g of glossary) put(g.en, termSlug(g));
  for (const g of glossary) put(g.abbr, termSlug(g));
  return map;
}
