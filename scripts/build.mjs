/**
 * AI 万象 — 静态站生成器（零依赖）
 *
 *   node scripts/build.mjs            构建到 dist/
 *   node scripts/build.mjs --watch    监听 data/ 与 src/ 变化自动重建
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  homePage, toolsPage, promptsPage, newsPage, newsDetailPage,
  learnPage, glossaryPage, searchPage, aboutPage, changelogPage, notFoundPage,
  playbooksPage, playbookDetailPage, modelsPage, toolDetailPage, liveNewsPage, comparePage, savedPage,
} from '../src/lib/pages.mjs';
import { enHome, enTools, enToolDetail, enModels, enAbout } from '../src/lib/pages-en.mjs';
import { EN } from '../src/lib/labels.mjs';
import { countBy, esc } from '../src/lib/utils.mjs';
import { resetIcons } from '../src/lib/icons.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const DIST = path.join(ROOT, 'dist');
const SRC = path.join(ROOT, 'src');

const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

/**
 * 本次构建实际写出的文件集合。
 * 不再用 fs.rmSync 整树删除——在 Windows 上删 300+ 文件要 15 秒以上，占构建时间的一大半。
 * 改成「覆盖写入 + 收尾时只清理多余文件」，多出来的删除量通常只有个位数，毫秒级。
 */
const written = new Set();

function write(rel, content) {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content, 'utf8');
  written.add(path.resolve(out));
  return out;
}

function copyDir(from, to) {
  if (!fs.existsSync(from)) return 0;
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const d = path.join(to, entry.name);
    if (entry.isDirectory()) n += copyDir(s, d);
    else {
      fs.copyFileSync(s, d);
      written.add(path.resolve(d));
      n++;
    }
  }
  return n;
}

/** 清理这一轮没有写出、但 dist 里还留着的文件，并删掉空目录 */
function pruneStale() {
  const removed = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
      } else if (!written.has(path.resolve(full))) {
        fs.unlinkSync(full);
        removed.push(path.relative(DIST, full).replace(/\\/g, '/'));
      }
    }
  };
  if (fs.existsSync(DIST)) walk(DIST);
  return removed;
}

const today = () => new Date().toISOString().slice(0, 10);

const CHANGELOG = [
  { date: '2026-09-20', tag: 'NEW', title: '新增英文版（工具库 + 模型库）', desc: '236 个工具的英文简介与编辑点评、40 个模型家族的英文对比、15 个分类与 7 个类型的英文名、207 条标签字典。带 hreflang 互指与语言切换。刻意不翻译场景手册 / 提示词 / 资讯 / 学习资源——两套长期并行维护的长文翻译成本远高于收益，关于页里说清了范围。' },
  { date: '2026-09-20', tag: 'CONTENT', title: '236 个工具全部补上「编辑点评」', desc: '每个工具一句「什么时候别选它」，平均 30 字，说的是它真实的短板而不是功能罗列。这是本站相对普通工具导航最核心的差异，已进入对比表维度与搜索索引，并成为新增工具的必填项（check 会点名）。' },
  { date: '2026-09-20', tag: 'A11Y', title: '无障碍问题从 161 处修到 0', desc: '深度与浅色双主题、中英文页面全部通过。修的关键问题：强调色当文字/按钮底色时对比度只有 3.2~3.7（不达标），拆成装饰/文字/底色三个变体；卡片标题与表格链接的点击区域不足 24px；英文页详情页出现多个 h1；提示词卡内的收藏按钮会连带展开卡片。' },
  { date: '2026-09-20', tag: 'QA', title: '新增无障碍审计与体积预算', desc: 'a11y.mjs 检查对比度、可访问名称、标题层级、点击区域、重复 id 等，跑真实浏览器、覆盖深浅双主题；perf.mjs 给关键资源与最大页面设了 gzip 预算，防止内容一直加而体积悄悄失控。' },
  { date: '2026-09-20', tag: 'PERF', title: '长列表渲染优化', desc: '工具库一次渲染 236 张卡片，用 content-visibility: auto 让浏览器跳视口外的布局与绘制，纯 CSS、不影响功能与 SEO。当前首屏 CSS+JS 共 22.3KB（gzip），单页均值 7.4KB。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增「工具对比」', desc: '从工具库任意挑 4 个以内并排比较，差异维度自动高亮、相同维度淡化。支持分享链接（/compare/?t=id1,id2）、复制为可粘贴到文档的表格。选择存在浏览器本机，不上传。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增「我的收藏」', desc: '工具、提示词、场景、模型、学习资源都能收藏，汇总在 /saved/ 按类型分组。跨内容类型共用一个清单；数据里已下架的收藏会被自动忽略并如实告知少了几项。' },
  { date: '2026-09-20', tag: 'QA', title: '新增游离属性检查', desc: '把 <a> 改写为 <div> 时容易把 data-* 属性留在标签外变成游离文本——后果是筛选、搜索静默失效（不报错，只是不工作）。links.mjs 现在会扫这类问题；已反向验证能抓到。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增「实时动态」：聚合 18 个资讯源', desc: '从 12 个中文源与 8 个英文源自动抓取最新内容（当前 140 条），带来源与语种筛选、相对时间显示、抓取状态如实展示。抓取与构建完全解耦——没有抓取数据时站点照常构建，只是不显示该区块。' },
  { date: '2026-09-20', tag: 'AUTO', title: '每日自动抓取', desc: '已配置每天 9:00 自动抓取并重建。源失效会自动标注原因并尝试替换，不会静默消失。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增 236 个工具详情页', desc: '每个工具一个独立页面：该分类的选型要点、同分类横向对比表（并高亮当前工具）、它出现在哪些场景手册里、基本信息与同类工具。刻意不做「复制官网简介」那种薄内容页。' },
  { date: '2026-09-20', tag: 'FIX', title: '修复分类 id 撞车导致的显示错误', desc: '工具分类与提示词分类共用同一批 id（coding/writing/design/data/marketing），合并成一个映射时提示词分类会覆盖工具分类——导致写作类工具显示成「写作文案」、营销类配色被换、详情页选型提示空白。已拆为 toolCatMap / promptCatMap 两套独立映射，并加了守卫与回归测试。' },
  { date: '2026-09-20', tag: 'FIX', title: '修复 RSS 摘要残留 HTML 标签', desc: '抓取器原先「先剥标签再解码实体」，遇到把 HTML 转义后塞进 XML 的源（如 IT 之家）就会还原出真标签。改为解码与剥标签循环两轮，残留从 35 条降到 0。' },
  { date: '2026-09-20', tag: 'PERF', title: '构建提速 3 倍（24s → 8s）', desc: '定位到 fs.rmSync 递归删除 dist 在 Windows 上要 15.5 秒，占构建时间六成以上。改为「覆盖写入 + 收尾只清理多余文件」，删除量从 369 个降到 0-3 个。' },
  { date: '2026-09-20', tag: 'QA', title: '新增内部链接自动检查', desc: '扫全部页面的站内链接与锚点，验证都能落到真实文件。上线前跑一次即可，比人工点是唯一可行的办法。首跑即发现关于页丢失了 #links 锚点。' },
  { date: '2026-09-20', tag: 'CONTENT', title: '场景手册扩至 30 篇', desc: '新增整理混乱表格、方案立项、多平台内容改写、播客制作、视频本地化、老项目补文档、上线前检查、学编程、技术分享、数据看板、用户反馈挖掘、发布会物料、内容矩阵等 14 篇。' },
  { date: '2026-09-20', tag: 'CONTENT', title: '内容大规模扩充（3 倍）', desc: '工具 77 → 236（新增营销增长、会议协作、教育学习三个分类）、提示词 28 → 74、术语 40 → 93、学习资源 20 → 45、精选解读 9 → 18。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增「场景手册」', desc: '按「我想做某件事」组织的完整流程，每篇含流程步骤、配套工具、关联提示词和避坑清单。这是本站相对普通工具导航的核心差异。' },
  { date: '2026-09-20', tag: 'NEW', title: '新增「模型库」', desc: '40 个模型家族按「最强的地方 / 主要注意 / 适合什么」对比。刻意不写版本号与具体参数——那类信息几个月就过期，需要精确数据请点官方链接。' },
  { date: '2026-09-20', tag: 'VISUAL v2', title: '视觉体系重构', desc: '换成 Swiss 编辑网格 + 新粗野主义：栅格纸底纹、硬边框实心投影、等宽字体承担标签层、单一朱红强调色。字体改为自托管 IBM Plex 三体，不再依赖任何第三方 CDN。' },
  { date: '2026-09-20', tag: 'INIT', title: '站点首次成型', desc: '完成工具库、提示词库、术语表、学习资源、资讯解读五大模块，以及全站搜索与深浅主题。' },
];

export function build({ quiet = false } = {}) {
  const t0 = Date.now();
  written.clear();
  fs.mkdirSync(DIST, { recursive: true });

  /* ---------- 1. 载入数据 ---------- */
  const site = readJSON('site.config.json');
  const categories = readJSON('categories.json');
  const tools = readJSON('tools.json');
  const prompts = readJSON('prompts.json');
  const news = readJSON('news.json');
  const learn = readJSON('learn.json');
  const glossary = readJSON('glossary.json');
  const playbooks = readJSON('playbooks.json');
  const models = readJSON('models.json');
  const i18n = readJSON('i18n.json');
  // 标签字典挂到英文标签表上，供卡片渲染时翻译受控词表
  EN.tagDict = readJSON('tags-en.json');

  // 实时动态是可选的：抓取与构建解耦，没有 feed.json 也能正常构建（只是没有实时区块）
  let feed = null;
  const feedPath = path.join(DATA, 'feed.json');
  if (fs.existsSync(feedPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
      // 丢弃没有链接或标题的脏数据，并设上限，避免把页面撑爆
      raw.items = (raw.items || []).filter((it) => it && it.title && /^https?:\/\//.test(it.link || '')).slice(0, 200);
      if (raw.items.length) feed = raw;
    } catch (e) {
      console.warn(`  ! data/feed.json 解析失败，跳过实时动态：${e.message}`);
    }
  }
  const FEED_HOURS = 24;

  // 两套分类体系有 id 撞车（coding/writing/design/data/marketing），必须分开映射，
  // 否则提示词分类会覆盖工具分类，导致工具卡显示错误分类名与配色
  const toolCatMap = Object.fromEntries(categories.toolCategories.map((c) => [c.id, c]));
  const promptCatMap = Object.fromEntries(categories.promptCategories.map((c) => [c.id, c]));
  const topicMap = Object.fromEntries(categories.newsTopics.map((t) => [t.id, t]));
  const trackMap = Object.fromEntries(categories.learnTracks.map((t) => [t.id, t]));
  const groupMap = Object.fromEntries(playbooks.groups.map((g) => [g.id, g]));
  const kindMap = Object.fromEntries(models.kinds.map((k) => [k.id, k]));
  const toolMap = Object.fromEntries(tools.map((t) => [t.id, t]));
  const promptMap = Object.fromEntries(prompts.map((p) => [p.id, p]));

  const counts = {
    tools: tools.length,
    prompts: prompts.length,
    learn: learn.length,
    glossary: glossary.length,
    news: news.items.length,
    playbooks: playbooks.items.length,
    models: models.items.length,
    live: feed ? feed.items.length : 0,
    toolsByCat: countBy(tools, 'cat'),
    promptsByCat: countBy(prompts, 'cat'),
    learnByTrack: countBy(learn, 'track'),
    playbooksByGroup: countBy(playbooks.items, 'group'),
  };
  counts.total = counts.tools + counts.prompts + counts.glossary + counts.learn
    + counts.news + counts.playbooks + counts.models;

  /* ---------- 2. 派生字段 ---------- */
  // NEW 标记：最近收录的一小批（按 added 倒序取前 8），避免同月大规模入库时徽章泛滥
  const NEW_COUNT = 8;
  const byAdded = [...tools]
    .filter((t) => t.added)
    .sort((a, b) => String(b.added).localeCompare(String(a.added)) || String(a.id).localeCompare(String(b.id)));
  const newIds = new Set(byAdded.slice(0, NEW_COUNT).map((t) => t.id));
  for (const t of tools) t._new = newIds.has(t.id);

  // 全站搜索索引（页面内嵌 + 开放 API 共用一份）
  const searchIndex = [];
  for (const t of tools) {
    searchIndex.push({
      t: 'tool', id: t.id, title: t.name, sub: (toolCatMap[t.cat] || {}).name || '',
      desc: t.desc, caveat: t.caveat || '', url: t.url, detail: `/tools/${t.cat}/${t.id}/`,
      tags: t.tags || [], ext: true, hot: !!t.hot,
    });
  }
  for (const p of prompts) {
    searchIndex.push({ t: 'prompt', id: p.id, title: p.title, sub: (promptCatMap[p.cat] || {}).name || '', desc: p.desc, url: `/prompts/${encodeURIComponent(p.cat)}/#${p.id}`, tags: p.tags || [], hot: !!p.hot });
  }
  for (const l of learn) {
    searchIndex.push({ t: 'learn', id: l.id, title: l.title, sub: (trackMap[l.track] || {}).name || '', desc: l.desc, url: l.url, tags: l.tags || [], ext: true });
  }
  for (const g of glossary) {
    searchIndex.push({ t: 'glossary', id: g.term, title: g.term, sub: g.cat, desc: g.def, url: `/glossary/?q=${encodeURIComponent(g.term)}`, tags: g.abbr ? [g.abbr] : [] });
  }
  for (const n of news.items) {
    searchIndex.push({ t: 'news', id: n.id, title: n.title, sub: (topicMap[n.topic] || {}).name || '', desc: n.summary, url: `/news/${n.id}/`, tags: n.tags || [] });
  }
  for (const p of playbooks.items) {
    searchIndex.push({
      t: 'playbook', id: p.id, title: p.title, sub: (groupMap[p.group] || {}).name || '',
      desc: p.problem, url: `/playbooks/${p.id}/`,
      tags: [p.time, p.level].filter(Boolean),
    });
  }
  for (const m of models.items) {
    searchIndex.push({
      t: 'model', id: m.id, title: m.name, sub: m.vendor,
      desc: (m.strengths || []).join('；'), url: `/models/${m.kind}/`,
      tags: [m.vendor, (kindMap[m.kind] || {}).name, m.open ? '开源' : '闭源'].filter(Boolean),
    });
  }

  const updatedAt = today();
  const ctx = {
    site, categories, tools, prompts, news, learn, glossary, playbooks, models, i18n, feed, feedHours: FEED_HOURS,
    toolCatMap, promptCatMap, topicMap, trackMap, groupMap, kindMap, toolMap, promptMap,
    counts, changelog: CHANGELOG,
    searchIndex, updatedAt,
  };

  /* ---------- 3. 生成页面 ---------- */
  const manifest = [];
  const emit = (rel, htmlOrThunk, meta = {}) => {
    // 传函数时：先重置图标集合再渲染，保证 sprite 只含本页用到的图标
    const html = typeof htmlOrThunk === 'function'
      ? (resetIcons(), htmlOrThunk())
      : htmlOrThunk;
    write(rel, html);
    manifest.push({ url: '/' + rel.replace(/index\.html$/, ''), title: meta.title || '', type: meta.type || 'page', lastmod: updatedAt });
  };

  emit('index.html', () => homePage(ctx), { title: site.brand.name, type: 'home' });
  emit('playbooks/index.html', () => playbooksPage(ctx), { title: '场景手册', type: 'playbooks' });
  emit('tools/index.html', () => toolsPage(ctx), { title: 'AI 工具库', type: 'tools' });
  emit('prompts/index.html', () => promptsPage(ctx), { title: '提示词库', type: 'prompts' });
  emit('models/index.html', () => modelsPage(ctx), { title: '模型库', type: 'models' });
  emit('news/index.html', () => newsPage(ctx), { title: 'AI 资讯与解读', type: 'news' });
  if (feed) {
    emit('news/live/index.html', () => liveNewsPage(ctx), { title: '实时动态', type: 'news-live' });
  }
  emit('learn/index.html', () => learnPage(ctx), { title: '学习资源', type: 'learn' });
  emit('glossary/index.html', () => glossaryPage(ctx), { title: 'AI 术语表', type: 'glossary' });
  emit('compare/index.html', () => comparePage(ctx), { title: '工具对比', type: 'compare' });
  emit('saved/index.html', () => savedPage(ctx), { title: '我的收藏', type: 'saved' });
  emit('search/index.html', () => searchPage(ctx), { title: '全站搜索', type: 'search' });
  emit('about/index.html', () => aboutPage(ctx), { title: '关于', type: 'about' });
  emit('changelog/index.html', () => changelogPage(ctx), { title: '更新日志', type: 'changelog' });
  emit('404.html', () => notFoundPage(ctx), { title: '404', type: '404' });

  for (const g of playbooks.groups) {
    emit(`playbooks/${g.id}/index.html`, () => playbooksPage(ctx, { activeGroup: g.id }), { title: `${g.name} · 场景手册`, type: 'playbooks-group' });
  }
  for (const p of playbooks.items) {
    emit(`playbooks/${p.id}/index.html`, () => playbookDetailPage(ctx, p), { title: p.title, type: 'playbook-detail' });
  }
  for (const k of models.kinds) {
    emit(`models/${k.id}/index.html`, () => modelsPage(ctx, { activeKind: k.id }), { title: `${k.name}模型 · 模型库`, type: 'models-kind' });
  }

  /* ---------- 英文版 ----------
     范围刻意收窄：只覆盖「查询型」内容（工具库 + 模型库）。
     场景手册 / 提示词 / 资讯 / 学习资源是长篇中文内容，不做翻译——
     两套长期并行维护的翻译成本远高于它能带来的价值。 */
  emit('en/index.html', () => enHome(ctx, i18n), { title: i18n.en.siteTagline, type: 'home' });
  emit('en/tools/index.html', () => enTools(ctx, i18n), { title: i18n.en['tools.title'], type: 'tools' });
  emit('en/models/index.html', () => enModels(ctx, i18n), { title: i18n.en['models.title'], type: 'models' });
  emit('en/about/index.html', () => enAbout(ctx, i18n), { title: 'About', type: 'about' });
  for (const c of categories.toolCategories) {
    emit(`en/tools/${c.id}/index.html`, () => enTools(ctx, i18n, { activeCat: c.id }), { title: `${i18n.en['cat.' + c.id] || c.id} · AI Tools`, type: 'tools-cat' });
  }
  for (const t of tools) {
    emit(`en/tools/${t.cat}/${t.id}/index.html`, () => enToolDetail(ctx, i18n, t), { title: `${t.name} · AI Tools`, type: 'tool-detail' });
  }
  for (const k of models.kinds) {
    emit(`en/models/${k.id}/index.html`, () => enModels(ctx, i18n, { activeKind: k.id }), { title: `${i18n.en['kind.' + k.id] || k.id} · Models`, type: 'models-kind' });
  }

  for (const c of categories.toolCategories) {
    emit(`tools/${c.id}/index.html`, () => toolsPage(ctx, { activeCat: c.id }), { title: `${c.name} · AI 工具`, type: 'tools-cat' });
  }
  // 工具详情页：同类对比 + 出现在哪些场景里（不做「复制官网简介」那种薄内容）
  for (const t of tools) {
    emit(`tools/${t.cat}/${t.id}/index.html`, () => toolDetailPage(ctx, t), { title: `${t.name} · ${(toolCatMap[t.cat] || {}).name}`, type: 'tool-detail' });
  }
  for (const c of categories.promptCategories) {
    emit(`prompts/${c.id}/index.html`, () => promptsPage(ctx, { activeCat: c.id }), { title: `${c.name} · 提示词`, type: 'prompts-cat' });
  }
  for (const t of categories.learnTracks) {
    emit(`learn/${t.id}/index.html`, () => learnPage(ctx, { activeTrack: t.id }), { title: `${t.name} · 学习资源`, type: 'learn-track' });
  }
  for (const n of news.items) {
    emit(`news/${n.id}/index.html`, () => newsDetailPage(ctx, n), { title: n.title, type: 'news-detail' });
  }

  /* ---------- 4. 静态资源 ---------- */
  write('assets/main.css', fs.readFileSync(path.join(SRC, 'styles', 'main.css'), 'utf8'));
  write('assets/print.css', fs.readFileSync(path.join(SRC, 'styles', 'print.css'), 'utf8'));
  write('assets/app.js', fs.readFileSync(path.join(SRC, 'scripts', 'app.js'), 'utf8'));
  copyDir(path.join(ROOT, 'public'), DIST);

  /* ---------- 5. 开放数据 ---------- */
  const api = {
    'index.json': {
      site: { name: site.brand.name, nameEn: site.brand.nameEn, slogan: site.brand.slogan, description: site.brand.description },
      updatedAt,
      counts,
      categories,
    },
    'tools.json': tools.map(({ _new, ...rest }) => rest),
    'prompts.json': prompts,
    'news.json': news,
    'learn.json': learn,
    'glossary.json': glossary,
    'playbooks.json': playbooks,
    'models.json': models,
    'search.json': searchIndex,
    ...(feed ? { 'feed.json': feed } : {}),
  };
  for (const [f, v] of Object.entries(api)) write(`api/${f}`, JSON.stringify(v, null, 2));

  /* ---------- 6. RSS ---------- */
  const base = (site.baseUrl || 'https://example.com').replace(/\/$/, '');
  const rssItems = [...news.items]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((n) => `    <item>
      <title>${esc(n.title)}</title>
      <link>${base}/news/${n.id}/</link>
      <guid isPermaLink="true">${base}/news/${n.id}/</guid>
      <description>${esc(n.summary)}</description>
      <pubDate>${new Date(n.date + 'T09:00:00+08:00').toUTCString()}</pubDate>
    </item>`)
    .join('\n');

  write('feed.xml', `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.brand.name)} · 资讯与解读</title>
    <link>${base}/news/</link>
    <description>${esc(site.brand.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>
`);

  /* ---------- 7. SEO ---------- */
  const urls = manifest
    .filter((m) => m.type !== '404')
    .map((m) => `  <url>\n    <loc>${base}${m.url}</loc>\n    <lastmod>${m.lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${m.type === 'home' ? '1.0' : m.type.includes('-detail') || m.type === 'about' ? '0.6' : '0.8'}</priority>\n  </url>`)
    .join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);

  /* ---------- 8. 部署配置 ---------- */
  write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
`);
  write('vercel.json', JSON.stringify({
    headers: [
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ] },
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/api/(.*)', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
    ],
  }, null, 2) + '\n');
  write('_redirects', `# Netlify: 旧链接兼容（如未来调整 URL 结构，在这里加 301）\n`);

  /* ---------- 9. 清理与报告 ---------- */
  const stale = pruneStale();
  const ms = Date.now() - t0;
  if (!quiet) {
    console.log('');
    console.log('  AI 万象 · 构建完成');
    console.log('  ' + '─'.repeat(48));
    console.log(`  页面        ${manifest.length} 个`);
    console.log(`  场景手册    ${counts.playbooks}  （${playbooks.groups.length} 个分组）`);
    console.log(`  工具        ${counts.tools}  （NEW 标记 ${tools.filter((t) => t._new).length}）`);
    console.log(`  提示词      ${counts.prompts}`);
    console.log(`  模型        ${counts.models}  （${models.kinds.length} 个类型）`);
    console.log(`  术语        ${counts.glossary}`);
    console.log(`  学习资源    ${counts.learn}`);
    console.log(`  资讯        ${counts.news}`);
    console.log(`  英文版      ${manifest.filter((m) => m.url.startsWith("/en/")).length} 页（工具库 + 模型库）`);
    console.log(`  实时动态    ${feed ? `${counts.live} 条（${feed.sources.filter((x) => x.ok).length}/${feed.sources.length} 源，抓取于 ${feed.updatedAt.slice(0, 16).replace('T', ' ')}）` : '无（未跑 fetch-news）'}`);
    console.log(`  搜索索引    ${searchIndex.length} 条`);
    console.log('  ' + '─'.repeat(48));
    console.log(`  附带产物    sitemap.xml / robots.txt / feed.xml / api/ / _headers / vercel.json`);
    console.log(`  清理陈旧    ${stale.length} 个文件${stale.length ? '（' + stale.slice(0, 3).join(', ') + (stale.length > 3 ? ' …' : '') + '）' : ''}`);
    console.log(`  输出目录    dist/  （共 ${written.size} 个文件）`);
    console.log(`  耗时        ${ms}ms`);
    console.log('');
  }
  return { manifest, counts, ms, stale };
}

/* ---------- watch ---------- */
const isMain = process.argv[1] && process.argv[1].endsWith('build.mjs');
if (isMain) {
  build();
  if (process.argv.includes('--watch')) {
    let timer = null;
    const rebuild = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try { build({ quiet: true }); console.log(`  [${new Date().toLocaleTimeString()}] 已重建`); }
        catch (e) { console.error('  构建失败：', e.message); }
      }, 120);
    };
    for (const dir of [DATA, SRC]) {
      if (fs.existsSync(dir)) fs.watch(dir, { recursive: true }, rebuild);
    }
    console.log('  监听 data/ 与 src/ 变化中… (Ctrl+C 退出)');
  }
}
