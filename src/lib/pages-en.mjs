/**
 * 英文版页面
 *
 * 范围刻意收窄：只覆盖「查询型」内容（工具库 + 模型库）。
 * 场景手册 / 提示词 / 资讯 / 学习资源是长篇中文内容，不做翻译，
 * 在关于页里明确说明——两套长期并行维护的翻译成本远高于它能带来的价值。
 */
import { esc, jsonEmbed, initials, accentStyle, hashColor, accentTextStyle } from './utils.mjs';
import { pageHead, crumbs, toolCard, modelCard, catCard, playbookCard, PRICING } from './components.mjs';
import { EN, pick, tagList } from './labels.mjs';
import { vendorEn, modelNameEn, toolNameEn } from './i18n-en-maps.mjs';
import { layout } from './layout.mjs';
import { icon } from './icons.mjs';
import { breadcrumbLd, siteLd, shead } from './pages.mjs';

/** 英文版导航 */
/** 二级章节头（h2）。注意 pageHead 渲染的是 h1，只能用于页面主标题 */
const sec = (title, sub = '', href = '', more = '') => `<div class="section-head">
  <div class="sh-main">
    <div>
      <h2>${esc(title)}</h2>
      ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}
    </div>
  </div>
  ${href ? `<a class="section-more" href="${esc(href)}">${esc(more)} →</a>` : ''}
</div>`;

/* 英文站的场景分组名。中文分组名不能直接出现在英文页面上。 */
const GROUP_EN = {
  office: 'Office & admin',
  content: 'Content',
  media: 'Media production',
  code: 'Engineering',
  learn: 'Learning & research',
  data: 'Data',
  growth: 'Growth',
};
const enGroupMap = (groups) => Object.fromEntries(
  groups.map((g) => [g.id, { ...g, name: GROUP_EN[g.id] || g.name }]),
);
/** 只有翻译好的手册才进英文站 —— 英文页上出现中文比缺内容更糟 */
const enReady = (ctx) => ctx.playbooks.items.filter((p) => p.en && p.en.steps && p.en.steps.length);

const enNav = [
  { label: 'Playbooks', href: '/en/playbooks/' },
  { label: 'Tools', href: '/en/tools/' },
  { label: 'Models', href: '/en/models/' },
  { label: 'About', href: '/en/about/' },
];

const enFooter = [
  { label: '中文版', href: '/' },
  { label: 'Open data', href: '/api/index.json' },
  { label: 'RSS (Chinese)', href: '/feed.xml' },
];

/** 分类 / 类型名的英文表 */
function nameMaps(i18n) {
  const en = i18n.en;
  const catName = (id) => en[`cat.${id}`] || id;
  const kindName = (id) => en[`kind.${id}`] || id;
  return { catName, kindName };
}

/** 英文版工具卡：把分类名换成英文后再交给通用组件 */
function ecard(t, i18n, extra = {}) {
  const { catName } = nameMaps(i18n);
  // 中文工具名要换成英文写法，否则英文站上会露出「豆包」「通义千问」
  const tEn = { ...t, name: toolNameEn(t.name) };
  return toolCard(tEn, { [t.cat]: { name: catName(t.cat), accent: hashColor(t.cat) }, ...extra }, EN);
}

/** 英文版模型卡 */
function mcard(m, i18n, kindMap) {
  // 英文站显示英文厂商名与模型名，否则会露出「腾讯」「通义万相」
  const mEn = { ...m, vendor: vendorEn(m.vendor), name: modelNameEn(m.name) };
  const { kindName } = nameMaps(i18n);
  return modelCard(mEn, { ...kindMap, [m.kind]: { ...(kindMap[m.kind] || {}), name: kindName(m.kind) } }, i18n.en, EN);
}

const shell = (o) =>
  layout({
    siteTagline: o.tagline,
    ...o,
    lang: 'en',
    navItems: enNav,
    footerLinks: enFooter,
    altLang: 'zh-CN',
    altLabel: 'Switch to Chinese',
    navLabel: 'Main navigation',
    skipLabel: 'Skip to content',
    footerCopyright: '© 2026 AI Wanxiang — an AI tools and models directory',
    footerLicense: 'Data is published as JSON under an open licence',
    footerNavTitle: 'Site navigation',
    footerMore: [{ label: '中文版', href: '/' }, { label: 'RSS (Chinese)', href: '/feed.xml' }],
    footerData: [
      { label: 'Open data', href: '/api/index.json' },
      { label: 'Tools JSON', href: '/api/tools.json' },
      { label: 'Search index', href: '/api/search.json' },
    ],
    crumbLabel: 'Breadcrumb',
    hideSearch: true,
    brandName: 'AI Wanxiang',
    brandSlogan: o.siteTagline || 'AI Tools & Models Directory',
    themeLabel: 'Toggle light/dark theme',
    menuLabel: 'Open menu',
    brandHref: '/en/',
    brandDesc: o.brandDesc,
  });

/* ---------------- 首页 ---------------- */
export function enHome(ctx, i18n) {
  const { site, tools, models, categories } = ctx;
  const en = i18n.en;
  const { catName, kindName } = nameMaps(i18n);
  const hot = tools.filter((t) => t.hot).slice(0, 8);
  const newest = [...tools].sort((a, b) => String(b.added || '').localeCompare(String(a.added || ''))).slice(0, 4);
  const body = `
<section class="hero">
  <div class="container hero-inner">
    <div class="hero-kicker">
      <span class="kicker-box">● Directory</span>
      <span class="kicker-plain">${tools.length} tools · ${models.items.length} model families · updated ${esc(ctx.updatedAt)}</span>
    </div>
    <h1>Not just <span class="hl">what to use</span><br>but when <em>not</em> to use it</h1>
    <p class="lead">${esc(en['siteDesc'])}</p>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <a class="btn btn-primary" href="/en/tools/">Browse ${tools.length} tools</a>
      <a class="btn" href="/en/models/">Compare models</a>
      <a class="btn btn-ghost" href="/">中文版</a>
    </div>
    <div class="stats reveal">
      <div class="stat"><b>${tools.length}</b><span>Tools</span></div>
      <div class="stat"><b>${models.items.length}</b><span>Model families</span></div>
      <div class="stat"><b>${categories.toolCategories.length}</b><span>Categories</span></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sec('Browse by category', "Every tool carries an editor's note on when not to use it — the part most directories leave out.")}
    <div class="grid grid-4">
      ${categories.toolCategories
        .map((c) => catCard({ ...c, name: catName(c.id, EN) }, tools.filter((t) => t.cat === c.id).length, `/en/tools/${c.id}/`, EN))
        .join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sec('Popular picks', '', '/en/tools/', 'All tools')}
    <div class="grid">${hot.map((t) => ecard(t, i18n)).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sec('Recently added', '', '/en/tools/', 'All tools')}
    <div class="grid">${newest.map((t) => ecard(t, i18n)).join('')}</div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sec('Model library', en['models.note'], '/en/models/', 'All models')}
    <div class="grid grid-6">
      ${models.kinds.map((k) => catCard({ ...k, name: kindName(k.id, EN) }, models.items.filter((m) => m.kind === k.id).length, `/en/models/${k.id}/`, EN)).join('')}
    </div>
  </div>
</section>`;

  return shell({
    site, path: '/en/', title: '', description: en['siteDesc'], body,
    altPath: '/', brandDesc: en['siteDesc'],
    jsonld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: en.siteName, inLanguage: 'en', description: en.siteDesc }],
  });
}

/* ---------------- 工具列表 ---------------- */
export function enTools(ctx, i18n, { activeCat = '' } = {}) {
  const { site, tools, categories } = ctx;
  const en = i18n.en;
  const { catName } = nameMaps(i18n);
  const list = activeCat ? tools.filter((t) => t.cat === activeCat) : tools;
  const cat = categories.toolCategories.find((c) => c.id === activeCat);

  const seg = [`<button data-facet="cat" data-value="all"${!activeCat ? ' class="on"' : ''}>All</button>`]
    .concat(categories.toolCategories.map((c) => `<button data-facet="cat" data-value="${esc(c.id)}"${activeCat === c.id ? ' class="on"' : ''}>${esc(catName(c.id))}</button>`))
    .join('');

  const title = cat ? catName(cat.id) : en['tools.title'];
  const desc = cat
    ? `${list.length} AI tools for ${catName(cat.id).toLowerCase()}: ${(ctx.categories.toolCategories.find((x) => x.id === cat.id) || {}).descEn || ''} Each entry notes pricing, China accessibility, an editor's note on when not to use it, and a side-by-side comparison within the category.`
    : en['tools.desc'];

  const crumbItems = cat
    ? [{ label: 'Home', href: '/en/' }, { label: 'Tools', href: '/en/tools/' }, { label: catName(cat.id) }]
    : [{ label: 'Home', href: '/en/' }, { label: 'Tools' }];

  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
${pageHead(title, desc, `<div class="ph-meta"><span class="label">Tools <b style="color:var(--fg)">${list.length}</b></span></div>`, 'TOOLS')}
<div data-filter-root>
  <div class="toolbar">
    <div class="container">
      <div class="toolbar-row">
        <div class="filter-wrap">
          <span class="f-icon" aria-hidden="true">${'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'}</span>
          <input class="filter-input" type="search" data-query placeholder="${esc(en['search.placeholder'])}" aria-label="Filter tools">
        </div>
        <button class="btn btn-sm" type="button" data-toggle="cn" aria-pressed="false">${esc(en['filter.onlyDirect'])}</button>
        <button class="btn btn-sm btn-ghost" data-reset>Reset</button>
      </div>
      <div class="toolbar-row"><div class="seg" style="flex:1">${seg}</div></div>
    </div>
  </div>
  <div class="container">
    <div class="result-count" data-count></div>
    <h2 class="sr-only">Tool list</h2>
    <div class="grid" data-list>${list.map((t) => ecard(t, i18n)).join('')}</div>
    <div class="hidden" data-empty>${'<div class="empty"><p>No matches</p><p class="label" style="margin-top:8px">Try another keyword or category.</p></div>'}</div>
  </div>
</div>`;

  return shell({
    site,
    path: activeCat ? `/en/tools/${activeCat}/` : '/en/tools/',
    title, description: desc, body, brandDesc: en['siteDesc'],
    altPath: activeCat ? `/tools/${activeCat}/` : '/tools/',
    jsonld: [
      breadcrumbLd(site, crumbItems),
      { '@context': 'https://schema.org', '@type': 'ItemList', name: title, numberOfItems: list.length, itemListElement: list.slice(0, 40).map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, description: pick(t, 'desc', EN) })) },
    ],
  });
}

/* ---------------- 工具详情 ---------------- */
export function enToolDetail(ctx, i18n, t) {
  const { site, tools } = ctx;
  const en = i18n.en;
  const { catName } = nameMaps(i18n);
  const c = hashColor(t.cat);
  const toolCat = (ctx.categories?.toolCategories || []).find((x) => x.id === t.cat) || {};
  const siblings = tools.filter((x) => x.cat === t.cat && x.id !== t.id);
  const compare = [t, ...siblings].slice(0, 12);

  const crumbItems = [
    { label: 'Home', href: '/en/' },
    { label: 'Tools', href: '/en/tools/' },
    { label: catName(t.cat), href: `/en/tools/${t.cat}/` },
    { label: t.name },
  ];

  const badges = [
    t.official ? `<span class="badge-pill" style="color:var(--fg-2)">${EN.official}</span>` : '',
    t._new ? `<span class="badge-pill badge-new">NEW</span>` : '',
    t.hot ? `<span class="badge-pill badge-hot">${EN.hot}</span>` : '',
    `<span class="badge-pill ${EN.pricingCls[t.pricing] || 'badge-free'}">${EN.pricing[t.pricing] || t.pricing}</span>`,
    t.cn ? `<span class="badge-pill badge-cn">${EN.directAccess}</span>` : `<span class="badge-pill" style="color:var(--fg-3)">${EN.proxyAccess}</span>`,
  ].filter(Boolean).join('');

  const facts = [
    ['Category', catName(t.cat)],
    ['Pricing', EN.pricing[t.pricing] || t.pricing],
    ['Access from China', t.cn ? 'Yes, directly' : 'Needs a VPN'],
    ['Official product', t.official ? 'Yes' : 'Third party / community'],
    ['Added', t.added || '—'],
  ];

  const rows = compare.map((x) => {
    const cur = x.id === t.id;
    return `<tr class="${cur ? 'is-current' : ''}">
      <td><a href="/en/tools/${esc(x.cat)}/${esc(x.id)}/">${esc(toolNameEn(x.name))}</a>${cur ? `<span class="tag" style="margin-left:6px">current</span>` : ''}</td>
      <td>${esc(EN.pricing[x.pricing] || x.pricing)}</td>
      <td>${x.cn ? 'Direct' : '—'}</td>
      <td>${x.official ? 'Official' : '—'}</td>
      <td>${x.hot ? 'Popular' : '—'}</td>
      <td><a href="${esc(x.url)}" target="_blank" rel="noopener nofollow" class="table-link" aria-label="Visit ${esc(toolNameEn(x.name))}">↗</a></td>
    </tr>`;
  }).join('');

  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
<div class="container">
  <div class="tool-hero">
    <span class="avatar avatar-lg" style="${accentStyle(c)}" aria-hidden="true">${esc(initials(t.name))}</span>
    <div class="tool-hero-main">
      <div class="label label-accent" style="margin-bottom:8px">${esc(catName(t.cat))}</div>
      <h1>${esc(t.name)}</h1>
      <p>${esc(pick(t, 'desc', EN))}</p>
      <div class="row" style="gap:6px;margin-top:14px">${badges}</div>
      <div class="row" style="gap:5px;margin-top:10px">${tagList(t.tags, EN).map((g) => `<span class="tag">${esc(g)}</span>`).join('')}</div>
    </div>
    <div class="tool-hero-act">
      <a class="btn btn-primary" href="${esc(t.url)}" target="_blank" rel="noopener nofollow">Visit website ↗</a>
      <a class="btn" href="/en/tools/${esc(t.cat)}/">More in ${esc(catName(t.cat))}</a>
    </div>
  </div>
</div>

${pick(t, 'caveat', EN) ? `<section class="section" style="padding-top:30px;padding-bottom:0">
  <div class="container">
    <div class="caveat-box">
      <div class="cb-head">⚠ <span>${esc(EN.editorNote)} · ${esc(EN.whenNotToUse)}</span></div>
      <p>${esc(pick(t, 'caveat', EN))}</p>
    </div>
  </div>
</section>` : ''}

${pick(toolCat, 'guide', EN) ? `<section class="section" style="padding-top:30px;padding-bottom:0">
  <div class="container">
    ${shead('01', 'How to choose in this category', esc(catName(t.cat)))}
    <div class="card" style="padding:22px 24px;border-left:3px solid ${esc(c)}">
      <p style="font-size:.94rem;color:var(--fg-2);line-height:1.85;margin:0">${esc(pick(toolCat, 'guide', EN)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>
    </div>
  </div>
</section>` : ''}

<section class="section" style="padding-top:34px">
  <div class="container">
    ${sec('Compare with others in this category', `All ${compare.length} tools above are from the same category.`)}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Tool</th><th>Pricing</th><th>China</th><th>Official</th><th>Popular</th><th>Site</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    ${sec('Basic info')}
    <div class="fact-grid">
      ${facts.map(([k, v]) => `<div class="fact"><span class="label">${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    </div>
  </div>
</section>

${siblings.length ? `<section class="section">
  <div class="container">
    ${sec(`More in ${catName(t.cat)}`, '', `/en/tools/${esc(t.cat)}/`, 'View all')}
    <div class="grid">${siblings.slice(0, 8).map((x) => ecard(x, i18n)).join('')}</div>
  </div>
</section>` : ''}`;

  return shell({
    site,
    path: `/en/tools/${t.cat}/${t.id}/`,
    title: `${t.name} · ${catName(t.cat)}`,
    description: pick(t, 'desc', EN),
    pageType: 'article',
    body,
    brandDesc: en['siteDesc'],
    altPath: `/tools/${t.cat}/${t.id}/`,
    jsonld: [
      breadcrumbLd(site, crumbItems),
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: t.name, description: pick(t, 'desc', EN), url: t.url,
        applicationCategory: catName(t.cat), operatingSystem: 'Web', inLanguage: 'en',
        ...(t.pricing === 'free' || t.pricing === 'open' ? { offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {}),
      },
    ],
  });
}

/* ---------------- 模型库 ---------------- */
export function enModels(ctx, i18n, { activeKind = '' } = {}) {
  const { site, models } = ctx;
  const en = i18n.en;
  const { kindName } = nameMaps(i18n);
  const list = activeKind ? models.items.filter((m) => m.kind === activeKind) : models.items;
  const kind = models.kinds.find((k) => k.id === activeKind);

  const counts = {};
  for (const m of models.items) counts[m.kind] = (counts[m.kind] || 0) + 1;

  const seg = [`<button data-facet="kind" data-value="all"${!activeKind ? ' class="on"' : ''}>All</button>`]
    .concat(models.kinds.map((k) => `<button data-facet="kind" data-value="${esc(k.id)}"${activeKind === k.id ? ' class="on"' : ''}>${esc(kindName(k.id))}</button>`))
    .join('');

  const title = kind ? kindName(kind.id) : en['models.title'];
  const desc = kind ? `${list.length} model families for ${kindName(kind.id).toLowerCase()} compared on stable dimensions: biggest strengths, what to watch, open or closed, and China accessibility. Every entry shows a verification month and links to the official model list.` : en['models.desc'];

  const crumbItems = kind
    ? [{ label: 'Home', href: '/en/' }, { label: 'Models', href: '/en/models/' }, { label: kindName(kind.id) }]
    : [{ label: 'Home', href: '/en/' }, { label: 'Models' }];

  const kindMap = Object.fromEntries(models.kinds.map((k) => [k.id, k]));

  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
${pageHead(title, desc, '', 'MODELS')}
<section class="section" style="padding-top:0">
  <div class="container">
    <div class="card" style="padding:18px 22px;border-left:3px solid var(--accent);max-width:880px">
      <div class="label label-accent" style="margin-bottom:8px">Read this first</div>
      <p style="font-size:.89rem;color:var(--fg-2);line-height:1.75;margin:0">${esc(en['models.note'])}</p>
    </div>
  </div>
</section>
<div data-filter-root>
  <div class="toolbar">
    <div class="container">
      <div class="toolbar-row">
        <div class="filter-wrap">
          <span class="f-icon" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
          <input class="filter-input" type="search" data-query placeholder="Search model families or vendors…" aria-label="Filter models">
        </div>
        <button class="btn btn-sm" type="button" data-toggle="open" aria-pressed="false">${esc(en['filter.onlyOpen'])}</button>
        <button class="btn btn-sm" type="button" data-toggle="cn" aria-pressed="false">${esc(en['filter.onlyDirect'])}</button>
        <button class="btn btn-sm btn-ghost" data-reset>Reset</button>
      </div>
      <div class="toolbar-row"><div class="seg" style="flex:1">${seg}</div></div>
    </div>
  </div>
  <div class="container">
    <div class="result-count" data-count></div>
    <h2 class="sr-only">Model list</h2>
    <div class="grid" data-list>${list.map((m) => mcard(m, i18n, kindMap)).join('')}</div>
    <div class="hidden" data-empty><div class="empty"><p>No matches</p></div></div>
  </div>
</div>`;

  return shell({
    site,
    path: activeKind ? `/en/models/${activeKind}/` : '/en/models/',
    title, description: desc, body, brandDesc: en['siteDesc'],
    altPath: activeKind ? `/models/${activeKind}/` : '/models/',
    jsonld: [
      breadcrumbLd(site, crumbItems),
      { '@context': 'https://schema.org', '@type': 'ItemList', name: title, numberOfItems: list.length, itemListElement: list.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: `${modelNameEn(m.name)} (${vendorEn(m.vendor)})`, description: (m.strengthsEn || m.strengths || []).join('; ') })) },
    ],
  });
}

/* ---------------- 关于 ---------------- */
export function enAbout(ctx, i18n) {
  const { site, tools, models } = ctx;
  const en = i18n.en;
  const crumbItems = [{ label: 'Home', href: '/en/' }, { label: 'About' }];
  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
${pageHead('About', '', '', 'ABOUT')}
<section class="section" style="padding-top:0">
  <div class="container container-narrow">
    <div class="card" style="padding:28px">
      <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:10px">${esc(en['about.scopeTitle'])}</h2>
      <p style="color:var(--fg-2);line-height:1.85;margin:0 0 22px">${esc(en['about.scope'])}</p>
      <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:10px">What we cover</h2>
      <p style="color:var(--fg-2);line-height:1.85;margin:0 0 22px">
        ${tools.length} AI tools across ${ctx.categories.toolCategories.length} categories, and ${models.items.length} model families.
        Every tool has an editor's note on when <em>not</em> to use it, because the failure modes matter more than the feature list.
      </p>
      <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:10px">On the missing spec sheets</h2>
      <p style="color:var(--fg-2);line-height:1.85;margin:0 0 22px">
        You won't find context-window sizes or per-token prices here. That data goes stale within months and then
        actively misleads. We compare the dimensions that stay stable and link each entry to its official docs.
      </p>
      <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:10px">Source &amp; license</h2>
      <p style="color:var(--fg-2);line-height:1.85;margin:0">
        All data on this site is public. Take it, remix it, build on it — no permission needed.
        Machine-readable at <a href="/api/index.json" style="color:var(--accent-text)">/api/index.json</a>.
      </p>
    </div>
  </div>
</section>
<section class="section">
  <div class="container container-narrow">
    <div class="card" style="padding:26px;border-left:3px solid var(--accent)">
      <div class="label label-accent" style="margin-bottom:10px">Looking for the rest?</div>
      <p style="color:var(--fg-2);line-height:1.8;margin:0 0 16px">
        The Chinese version carries substantially more: 30 step-by-step playbooks, 74 prompt templates,
        93 glossary terms, 45 learning resources and a live news feed.
      </p>
      <a class="btn btn-primary" href="/">View the Chinese version →</a>
    </div>
  </div>
</section>`;

  return shell({
    site, path: '/en/about/', title: 'About', description: en['about.scope'], body,
    brandDesc: en['siteDesc'], altPath: '/about/',
    jsonld: breadcrumbLd(site, crumbItems),
  });
}


/* ============================ 场景手册（英文） ============================ */
/* 英文版的覆盖面比中文窄：只收录已翻译的手册。
   没翻译的不出现，而不是回退显示中文。 */

export function enPlaybooks(ctx, i18n) {
  const en = i18n.en;
  const { site, playbooks } = ctx;
  const groups = enGroupMap(playbooks.groups);
  const list = enReady(ctx);
  const crumbItems = [{ label: 'Home', href: '/en/' }, { label: 'Playbooks' }];

  const byGroup = playbooks.groups
    .map((g) => ({ g, items: list.filter((p) => p.group === g.id) }))
    .filter((x) => x.items.length);

  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
${pageHead(
  'Playbooks',
  `${list.length} end-to-end workflows for doing real work with AI. Each states its input, its expected output, what counts as failure, and — the part most guides skip — when you should not use AI at all.`,
  '', 'PLAYBOOKS / Workflows', 'Workflow list',
)}
${byGroup.map(({ g, items }) => `<section class="section">
  <div class="container">
    ${shead('', GROUP_EN[g.id] || g.name, `${items.length} workflows`)}
    <div class="grid">${items.map((p) => playbookCard(p, groups, '/en/playbooks/', EN)).join('')}</div>
  </div>
</section>`).join('')}`;

  return shell({
    site,
    path: '/en/playbooks/',
    title: 'AI playbooks: end-to-end workflows',
    description: `${list.length} end-to-end AI workflows. Each one states its input, expected output, what counts as failure, and when you should not use AI at all.`,
    body,
    brandDesc: en['siteDesc'],
    altPath: '/playbooks/',
    jsonld: [
      breadcrumbLd(site, crumbItems),
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'AI playbooks', numberOfItems: list.length, inLanguage: 'en',
        itemListElement: list.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.en.title, url: `/en/playbooks/${p.id}/`,
        })),
      },
    ],
  });
}

export function enPlaybookDetail(ctx, i18n, pb) {
  const en = i18n.en;
  const { site, toolMap, promptMap } = ctx;
  const groups = enGroupMap(ctx.playbooks.groups);
  const g = groups[pb.group] || { name: pb.group, accent: '#1B4DFF', icon: 'target' };
  const e = pb.en;

  const others = ctx.playbooks.items.filter((x) => x.id !== pb.id && x.group === pb.group && x.en && x.en.steps).slice(0, 2);
  const fallback = enReady(ctx).filter((x) => x.id !== pb.id && x.group !== pb.group).slice(0, Math.max(0, 3 - others.length));
  const more = [...others, ...fallback].slice(0, 3);

  const crumbItems = [
    { label: 'Home', href: '/en/' },
    { label: 'Playbooks', href: '/en/playbooks/' },
    { label: e.title },
  ];

  /* 工具链到英文工具页；提示词只有中文版，所以显式标 · zh，不假装它是英文的 */
  const toolChip = (id) => {
    const t = toolMap[id];
    if (!t) return '';
    return `<a class="tag accent" href="/en/tools/${esc(t.cat)}/${esc(t.id)}/" style="${accentTextStyle(g.accent)}">${esc(toolNameEn(t.name))}${icon('arrow-up-right', 10)}</a>`;
  };
  const promptChip = (id) => {
    const p = promptMap[id];
    if (!p) return '';
    return `<a class="tag accent" href="/prompts/${esc(p.cat)}/#${esc(p.id)}" style="${accentTextStyle(g.accent)}" title="Prompt template (Chinese only)">${icon('spark', 10)} ${esc(p.title)} <span style="opacity:.65">· zh</span></a>`;
  };

  const steps = (e.steps || []).map((text, i) => {
    const zh = (pb.steps || [])[i] || {};
    return `<div class="step">
      <div class="step-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="step-body">
        <p>${esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>
        ${(zh.tools || []).length || (zh.prompts || []).length
          ? `<div class="step-refs">${(zh.tools || []).map(toolChip).join('')}${(zh.prompts || []).map(promptChip).join('')}</div>`
          : ''}
      </div>
    </div>`;
  }).join('');

  const specBlock = e.spec ? `<section class="section" style="padding-top:0">
  <div class="container container-narrow">
    <div class="pb-spec">
      <div class="pbs-head">What you should end up with</div>
      <dl>
        <div><dt>Input</dt><dd>${esc(e.spec.input)}</dd></div>
        <div><dt>Output</dt><dd>${esc(e.spec.output)}</dd></div>
        <div><dt>Counts as failure</dt><dd>${esc(e.spec.fail)}</dd></div>
        <div><dt>When not to use AI</dt><dd>${esc(e.spec.alt)}</dd></div>
      </dl>
    </div>
  </div>
</section>` : '';

  const warnBlock = (e.warnings || []).length ? `<section class="section" style="background:var(--surface-2)">
  <div class="container container-narrow">
    ${shead('02', 'What goes wrong', 'Failure modes we actually hit, not generic advice')}
    <ul class="warn-list">
      ${e.warnings.map((w) => `<li>${icon('alert', 14)}<span>${esc(w).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</span></li>`).join('')}
    </ul>
  </div>
</section>` : '';

  const tools = (pb.tools || []).map((id) => toolMap[id]).filter(Boolean);

  const body = `
${crumbs(crumbItems, 'Breadcrumb')}
<div class="container container-narrow">
  <header class="article-head">
    <div class="news-meta">
      <span class="tag accent" style="${accentTextStyle(g.accent)}">${esc(g.name)}</span>
      <span>About ${esc(e.time)}</span>
      <span class="dot-sep">/</span>
      <span>${esc(e.level || '')}</span>
      <span class="dot-sep">/</span>
      <span>${(e.steps || []).length} steps</span>
    </div>
    <h1>${esc(e.title)}</h1>
    <p style="color:var(--fg-2);font-size:1rem;line-height:1.75;max-width:66ch">${esc(e.problem)}</p>
  </header>
</div>

${specBlock}

<section class="section" style="padding-top:34px">
  <div class="container container-narrow">
    ${shead('01', 'The process', 'In order, with the tools for each step')}
    <div class="steps">${steps}</div>
  </div>
</section>

${warnBlock}

${tools.length ? `<section class="section">
  <div class="container">
    ${shead('03', 'Tools used here', '', '/en/tools/', 'All tools')}
    <div class="grid">${tools.slice(0, 8).map((t) => ecard(t, i18n)).join('')}</div>
  </div>
</section>` : ''}

${more.length ? `<section class="section">
  <div class="container">
    ${shead('04', 'Other playbooks', '', '/en/playbooks/', 'All playbooks')}
    <div class="grid">${more.map((p) => playbookCard(p, groups, '/en/playbooks/', EN)).join('')}</div>
  </div>
</section>` : ''}`;

  return shell({
    site,
    path: `/en/playbooks/${pb.id}/`,
    title: `${e.title} · Playbook`,
    description: `${e.problem} ${(e.steps || []).length} steps, about ${e.time}.${e.spec ? ' Output: ' + e.spec.output : ''}`,
    pageType: 'article',
    body,
    brandDesc: en['siteDesc'],
    altPath: `/playbooks/${pb.id}/`,
    jsonld: [
      breadcrumbLd(site, crumbItems),
      {
        '@context': 'https://schema.org', '@type': 'HowTo',
        name: e.title,
        description: `${e.problem}${e.spec ? ' Output: ' + e.spec.output : ''}`,
        totalTime: e.time, inLanguage: 'en',
        step: (e.steps || []).map((text, i) => ({
          '@type': 'HowToStep', position: i + 1, text: text.replace(/\*\*/g, ''),
        })),
      },
    ],
  });
}
