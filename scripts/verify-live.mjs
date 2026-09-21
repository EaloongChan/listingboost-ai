/**
 * 线上站点验证（零依赖，只发 HTTP 请求）
 *
 *   node scripts/verify-live.mjs
 *   node scripts/verify-live.mjs --base https://www.ealoongchan.top
 *
 * 部署完之后跑这个，确认线上真的是我们要的东西：
 * 域名跳转、canonical、sitemap、404、重定向、字体、关键页面、安全响应头。
 * 本地构建通过了不等于线上部署对了——构建配置、重定向规则、缓存都可能出岔子。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return (i !== -1 ? process.argv[i + 1] : '') || 'https://www.ealoongchan.top';
})().replace(/\/$/, '');

/* 解析 dist/assets 里的真实文件名要用到（产物带内容哈希，名字不能写死） */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const UA = 'Mozilla/5.0 (compatible; AIWanxiangDeployCheck/1.0)';

const results = [];
const ok = (name, detail = '') => results.push({ pass: true, name, detail });
const bad = (name, detail = '') => results.push({ pass: false, name, detail });

async function req(path, opts = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeout || 20000);
  try {
    const res = await fetch(BASE + path, {
      redirect: 'manual',
      headers: { 'User-Agent': UA, ...(opts.headers || {}) },
      signal: ctl.signal,
    });
    const body = opts.head ? '' : await res.text();
    return { status: res.status, headers: res.headers, body };
  } finally {
    clearTimeout(timer);
  }
}

const line = (s = '') => console.log(s);

async function main() {
  line('');
  line(`  线上验证  ${BASE}`);
  line('  ' + '─'.repeat(62));

  /* ---------- 1. 首页 ---------- */
  try {
    const r = await req('/');
    if (r.status !== 200) {
      bad('首页返回 200', `实际 ${r.status}`);
    } else {
      const title = (r.body.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
      if (/万象/.test(title)) ok('首页已是新站', `title「${title.slice(0, 40)}」`);
      else bad('首页仍是旧站', `title「${title.slice(0, 60)}」——Vercel 可能还在跑 next build`);

      const canon = (r.body.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
      if (canon === `${BASE}/`) ok('canonical 指向 www 域名', canon);
      else bad('canonical 不对', `实际「${canon}」`);

      const h = r.headers;
      const sec = ['x-content-type-options', 'referrer-policy', 'x-frame-options']
        .filter((k) => h.get(k));
      if (sec.length >= 2) ok('安全响应头已生效', sec.join(', '));
      else bad('安全响应头缺失', `只有 ${sec.join(', ') || '无'}——vercel.json 的 headers 可能没读到`);
    }
  } catch (e) {
    bad('首页请求失败', e.message);
  }

  /* ---------- 2. 爬虫产物 ---------- */
  for (const [path, name, test] of [
    ['/robots.txt', 'robots.txt', (b) => /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/.test(b)],
    ['/sitemap.xml', 'sitemap.xml', (b) => b.includes('<urlset') && b.includes(`${BASE}/tools/`)],
    ['/feed.xml', 'RSS feed', (b) => b.includes('<rss') && b.includes('<item>')],
    ['/api/index.json', '开放数据 API', (b) => { try { return !!JSON.parse(b).counts; } catch { return false; } }],
  ]) {
    try {
      const r = await req(path);
      if (r.status === 200 && test(r.body)) ok(name, `${(r.body.length / 1024).toFixed(1)} KB`);
      else if (r.status !== 200) bad(name, `HTTP ${r.status}`);
      else bad(name, '内容不符合预期');
    } catch (e) {
      bad(name, e.message);
    }
  }

  /* ---------- 3. 关键页面 ---------- */
  const pages = [
    ['/tools/', '工具库', /tool-card/],
    ['/playbooks/', '场景手册', /playbook-card/],
    ['/prompts/', '提示词库', /prompt-card/],
    ['/models/', '模型库', /model-card/],
    ['/compare/', '工具对比', /cmpRoot/],
    ['/saved/', '我的收藏', /savedRoot/],
    ['/news/live/', '实时动态', /live-item/],
    // 之前这里写的是 /null|./，它匹配任何字符串 —— 等于没检查。改成真实标记。
    ['/glossary/', '术语表', /gloss-item/],
    ['/en/', '英文版首页', /Browse|tools/i],
    ['/en/tools/', '英文工具库', /tool-card/],
    ['/en/prompts/', '英文提示词库', /prompt-card/],
    ['/en/playbooks/', '英文场景手册', /playbook-card/],
    ['/en/glossary/', '英文术语表', /gloss-item/],
    ['/en/search/', '英文全站搜索', /__AIWX_INDEX__/],
    ['/tools/coding/cursor/', '工具详情页', /SoftwareApplication/],
    ['/en/tools/chat/chatgpt/', '英文工具详情页', /SoftwareApplication/],
  ];
  for (const [path, name, test] of pages) {
    try {
      const r = await req(path);
      const size = (r.body.length / 1024).toFixed(0);
      if (r.status !== 200) bad(`${name} ${path}`, `HTTP ${r.status}`);
      else if (!test.test(r.body)) bad(`${name} ${path}`, `内容不符合预期（${size} KB）`);
      else ok(`${name} ${path}`, `${size} KB`);
    } catch (e) {
      bad(`${name} ${path}`, e.message);
    }
  }

  /* ---------- 4. 静态资源 ----------
     资源名带内容哈希（main.9958cf8.css），**不能写死 /assets/main.css** ——
     以前这里就是写死的，于是这条检查恒为 404，等于"线上资源是否部署成功"从来没被验证过。
     和 perf.mjs 当年踩的是同一个坑：产物命名规则变了，写死名字的脚本静默失效。
     现在从本地 dist/assets 解析真实文件名；解析不到就直接失败（说明该同步本脚本了）。 */
  const ASSET_DIR = path.join(ROOT, 'dist', 'assets');
  const assetFiles = fs.existsSync(ASSET_DIR) ? fs.readdirSync(ASSET_DIR) : [];
  const resolveAsset = (base, ext) => {
    const hit = assetFiles.find((n) => n === `${base}.${ext}` || new RegExp(`^${base}\\.[0-9a-f]{7,}\\.${ext}$`).test(n));
    return hit ? `/assets/${hit}` : null;
  };
  const assets = [
    [resolveAsset('main', 'css'), '样式表'],
    [resolveAsset('app', 'js'), '前端脚本'],
    [resolveAsset('search', 'js'), '搜索脚本（按需加载）'],
    [resolveAsset('card-svg', 'js'), '卡片图标碎片（按需加载）'],
    ['/fonts/ibm-plex-sans-latin-400-normal.woff2', '自托管字体'],
    ['/og.png', '社交分享图'],
  ];
  for (const [path_, name] of assets) {
    if (!path_) { bad(name, '本地 dist/assets 里找不到对应产物（构建过了吗 / 命名规则变了？）'); continue; }
    try {
      const r = await req(path_, { head: true });
      if (r.status === 200) ok(name, `${path_.split('/').pop()} · ${(r.headers.get('content-type') || '').trim()}`);
      else bad(name, `HTTP ${r.status}  ${path_}`);
    } catch (e) {
      bad(name, e.message);
    }
  }

  /* ---------- 5. 跳转与 404 ---------- */
  try {
    const r = await req('/tools');
    const loc = r.headers.get('location') || '';
    if ([301, 308].includes(r.status) && loc.includes('/tools/')) ok('无斜杠 URL 正确跳转', `${r.status} → ${loc}`);
    else bad('无斜杠 URL 跳转异常', `${r.status} ${loc}`);
  } catch (e) {
    bad('无斜杠 URL 跳转', e.message);
  }

  try {
    const r = await req('/this-page-does-not-exist-12345/');
    if (r.status === 404) ok('不存在的页面返回 404', '而非 200 软 404');
    else bad('404 处理异常', `返回 ${r.status}`);
  } catch (e) {
    bad('404 检查', e.message);
  }

  /* ---------- 6. 裸域跳 www ---------- */
  try {
    const apex = BASE.replace('//www.', '//');
    if (apex !== BASE) {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 15000);
      const res = await fetch(apex + '/', { redirect: 'manual', headers: { 'User-Agent': UA }, signal: ctl.signal });
      clearTimeout(t);
      const loc = res.headers.get('location') || '';
      if ([301, 302, 307, 308].includes(res.status) && loc.includes('www.')) ok('裸域跳到 www', `${res.status} → ${loc}`);
      else if (res.status === 200) ok('裸域直接可用', '没有跳转（也可以，但 canonical 要一致）');
      else bad('裸域行为异常', `${res.status} ${loc}`);
    }
  } catch (e) {
    bad('裸域检查', e.message);
  }

  /* ---------- 汇总 ---------- */
  const pass = results.filter((r) => r.pass).length;
  const fail = results.length - pass;
  line('');
  results.forEach((r) => line(`  ${r.pass ? '✓' : '✗'} ${r.name.padEnd(26)} ${r.detail}`));
  line('');
  line('  ' + '─'.repeat(62));
  line(`  通过 ${pass} / ${results.length}`);
  if (fail) {
    line('');
    line('  排查顺序建议：');
    line('    1. 首页还是旧站 → Vercel 项目 Settings 里把 Framework Preset 改成 Other');
    line('    2. 页面 404 一片 → 检查 outputDirectory 是不是 dist');
    line('    3. 只有部分页面 404 → 构建可能失败，去 Deployments 看构建日志');
    line('');
  }
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('  验证失败：', e.message);
  process.exit(1);
});
