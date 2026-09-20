import { esc, jsonEmbed } from './utils.mjs';
import { icon, iconSprite } from './icons.mjs';

/** og:locale 要写成 zh_CN / en_US 这种带地区的格式，光写 en 不规范 */
const ogLocale = (lang) => ({ 'zh-CN': 'zh_CN', zh: 'zh_CN', en: 'en_US', 'en-US': 'en_US' }[lang] || lang);

/**
 * 页面外壳
 *
 * 注意顺序：icon() 会把用到的图标名登记到 icons.mjs 的 used 集合里，
 * 而 sprite 必须在任何 <use> 之前出现。所以这里先把 header / footer 的
 * HTML 拼出来（顺便登记它们的图标），最后再插 sprite 到 <body> 开头。
 *
 * @param {object} o
 * @param {object} o.site      站点配置
 * @param {string} o.title     页面标题
 * @param {string} o.description
 * @param {string} o.path      当前路径，如 /tools/
 * @param {string} o.body      body 内部 HTML
 * @param {string} [o.head]    额外 <head> 内容
 * @param {string} [o.scripts] 额外脚本
 * @param {object} [o.jsonld]  结构化数据（对象或数组）
 * @param {object} [o.pageType] og:type
 * @param {string} [o.ogImage] 社交分享图
 * @param {string} [o.lang]    页面语言，默认取站点 locale
 */
export function layout(o) {
  const {
    site, title, description = '', path = '/', body = '',
    head = '', scripts = '', jsonld = null, pageType = 'website', ogImage = '',
    lang = '',
    navItems = null,
    footerLinks = null,
    altPath = '',
    altLang = '',
    altLabel = '',
    searchHref = '/search/',
    searchLabel = '全站搜索',
    searchText = '搜索',
    hideSearch = false,
    themeLabel = '切换深浅主题',
    menuLabel = '打开菜单',
    brandHref = '/',
    brandDesc = '',
    brandName = '',
    brandSlogan = '',
    robots = '',
  } = o;

  const bName = brandName || site.brand.name;
  const fullTitle = title ? `${title} · ${bName}` : `${bName} · ${brandSlogan || site.brand.slogan}`;
  const desc = description || site.brand.description;
  const base = (site.baseUrl || '').replace(/\/$/, '');
  const canonical = base ? base + path : path;
  const theme = site.theme?.default || 'light';
  const og = ogImage || (base ? `${base}/og.png` : '/og.png');
  const pageLang = lang || site.locale || 'zh-CN';
  const canonicalFor = (p) => (base ? base + p : p);

  const navList = navItems || site.nav || [];
  const nav = navList
    .map((n) => {
      const active = path === n.href || (n.href !== '/' && path.startsWith(n.href));
      return `<a href="${esc(n.href)}"${active ? ' class="active"' : ''}${active ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`;
    })
    .join('');

  const footLinks = footerLinks || site.footer?.links || [];
  const footHtml = footLinks
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
    .join('');

  const ldArray = jsonld ? (Array.isArray(jsonld) ? jsonld : [jsonld]) : [];
  const structured = ldArray
    .map((d) => `<script type="application/ld+json">${jsonEmbed(d)}</script>`)
    .join('\n');

  // --- 先拼 header / footer（这一步会登记它们的图标） ---
  const logoMark = `<span class="logo-mark" aria-hidden="true">${esc(site.brand.logoText || '象')}</span>`;
  const logoText = site.brand.forceText === false ? ''
    : `<span class="logo-text"><span>${esc(site.brand.name)}</span><small>${esc(site.brand.nameEn || '')}</small></span>`;

  const header = `<header class="header">
  <div class="container header-inner">
    <a class="logo" href="${esc(brandHref)}" aria-label="${esc(site.brand.name)}">
      ${logoMark}${logoText}
    </a>
    <nav class="nav" id="nav" aria-label="主导航">${nav}</nav>
    <div class="header-actions">
      ${hideSearch ? '' : `<a class="quick-search" href="${esc(searchHref)}" aria-label="${esc(searchLabel)}">
        ${icon('search', 14)}<span>${esc(searchText)}</span><kbd>/</kbd>
      </a>`}
      ${altPath ? `<a class="icon-btn lang-btn" href="${esc(altPath)}" hreflang="${esc(altLang)}" lang="${esc(altLang)}" aria-label="${esc(altLabel || 'Switch language')}" title="${esc(altLabel || 'Switch language')}">${icon('globe', 16)}</a>` : ''}
      <button class="icon-btn" id="themeBtn" aria-label="${esc(themeLabel)}" title="${esc(themeLabel)}">
        <span class="ic-sun">${icon('sun', 16)}</span>
        <span class="ic-moon" style="display:none">${icon('moon', 16)}</span>
      </button>
      <button class="icon-btn menu-btn" id="menuBtn" aria-label="${esc(menuLabel)}" aria-expanded="false" aria-controls="nav">${icon('menu', 18)}</button>
    </div>
  </div>
</header>`;

  const footer = `<footer class="footer">
  <div class="container">
    <div class="footer-inner">
      <div class="footer-brand">
        <a class="logo" href="${esc(brandHref)}">${logoMark}${logoText}</a>
        <p>${esc(brandDesc || site.brand.description)}</p>
      </div>
      <h2 class="sr-only">${esc(site.footer?.navTitle || '站内导航')}</h2>
      <div class="footer-links">
        <div class="footer-col">
          <h3>${esc(site.footer?.browseTitle || '')}</h3>
          ${navList.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('')}
        </div>
        <div class="footer-col">
          <h3>${esc(site.footer?.moreTitle || '')}</h3>
          ${footHtml}
          <a href="/glossary/">AI 术语表</a>
          <a href="/feed.xml">RSS 订阅</a>
        </div>
        <div class="footer-col">
          <h3>${esc(site.footer?.dataTitle || '')}</h3>
          <a href="/api/index.json">全站数据</a>
          <a href="/api/tools.json">工具数据</a>
          <a href="/api/prompts.json">提示词数据</a>
          <a href="/api/search.json">搜索索引</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>${esc(site.footer?.copyright || '')}</span>
      <span>${site.footer?.icp ? esc(site.footer.icp) + ' · ' : ''}${esc(site.footer?.note || '数据以 JSON 开放，可自由取用')}</span>
    </div>
  </div>
</footer>`;

  // 到这里本页所有图标都已登记，可以安全生成 sprite
  const sprite = iconSprite();

  return `<!DOCTYPE html>
<html lang="${esc(pageLang)}" data-theme="${esc(theme)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#f3f1ea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d0d0b" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
${robots ? `<meta name="robots" content="${esc(robots)}">` : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(site.brand.name)}" href="/feed.xml">
/* hreflang 三件套，顺序与语义都不能错：
     · 自身语言 → 指向本页 canonical
     · 另一语言 → 指向对应版本
     · x-default → 指向默认版本（我们把中文当默认）
   踩过的坑：第二行原本写的是「另一个语言」，而不是「自身语言」，导致中文页输出两条
   hreflang="en"（一条对、一条指向自己），且完全没有 zh-CN，524 个页面全部受影响。
   links.mjs 里加了断言守卫，改这里务必跑一遍。 */
${altPath ? `<link rel="alternate" hreflang="${esc(pageLang)}" href="${esc(canonical)}">
<link rel="alternate" hreflang="${esc(altLang)}" href="${esc(canonicalFor(altPath))}">
<link rel="alternate" hreflang="x-default" href="${esc(pageLang.startsWith('en') ? canonicalFor(altPath) : canonical)}">` : ''}
<meta property="og:type" content="${esc(pageType)}">
<meta property="og:site_name" content="${esc(site.brand.name)}">
<meta property="og:locale" content="${esc(ogLocale(pageLang))}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(og)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/ibm-plex-sans-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/ibm-plex-mono-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/main.css">
<link rel="stylesheet" href="/assets/print.css" media="print">
<script>
(function(){try{
var q=new URLSearchParams(location.search).get('theme');
var t=(q==='dark'||q==='light')?q:localStorage.getItem('aiwx-theme');
if(t!=="dark"&&t!=="light"){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':${JSON.stringify(theme)}}
document.documentElement.setAttribute('data-theme',t);
if(q==='dark'||q==='light'){try{localStorage.setItem('aiwx-theme',t)}catch(e){}}
}catch(e){}})();
</script>
${head}
${structured}
</head>
<body>

${sprite}

<a href="#main" class="skip-link">${esc(site.skipLabel || '跳到主要内容')}</a>

${header}

<main class="main" id="main">
${body}
</main>

${footer}

<script src="/assets/app.js" defer></script>
${scripts}
</body>
</html>`;
}
