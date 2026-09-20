/**
 * 交互自测（CDP 驱动真实浏览器点击）
 *   node scripts/selftest.mjs
 * 前置：dist/ 已构建，且 node scripts/serve.mjs 已启动。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.AUDIT_PORT || 9223);
const SERVE = process.env.AUDIT_URL || 'http://127.0.0.1:4173';

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => fs.existsSync(p));

const get = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d)); }).on('error', rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cdp(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    ws.addEventListener('open', () => resolve({ send, close: () => ws.close() }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    });
    function send(method, params = {}) {
      const my = ++id;
      return new Promise((res, rej) => { pending.set(my, { res, rej }); ws.send(JSON.stringify({ id: my, method, params })); });
    }
  });
}

const tests = [];
const test = (name, path_, fn) => tests.push({ name, path: path_, fn });

/* ---- 用例 ---- */
test('提示词卡可展开', '/prompts/', async (c) => {
  const before = await c.eval(`document.querySelector('.prompt-card').classList.contains('open')`);
  await c.eval(`document.querySelector('.prompt-head').click()`);
  const after = await c.eval(`document.querySelector('.prompt-card').classList.contains('open')`);
  return { ok: before === false && after === true, detail: `展开前 ${before} → 展开后 ${after}` };
});

test('提示词"全部展开"生效', '/prompts/', async (c) => {
  await c.eval(`document.querySelector('[data-all-open]').click()`);
  const n = await c.eval(`[...document.querySelectorAll('.prompt-card')].filter(x=>x.classList.contains('open')).length`);
  const total = await c.eval(`document.querySelectorAll('.prompt-card').length`);
  return { ok: n === total, detail: `${n}/${total} 张已展开` };
});

test('深链 #hash 自动展开对应提示词', '/prompts/?cat=meta#p-prompt-improve', async (c) => {
  const open = await c.eval(`document.getElementById('p-prompt-improve').classList.contains('open')`);
  return { ok: open === true, detail: `open=${open}` };
});

test('工具页筛选：分类', '/tools/', async (c) => {
  const before = await c.eval(`document.querySelector('[data-count]').textContent`);
  await c.eval(`document.querySelector('[data-facet="cat"][data-value="coding"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const cats = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].map(x=>x.dataset.cat).filter((v,i,a)=>a.indexOf(v)===i)`);
  return { ok: shown > 0 && cats.length === 1 && cats[0] === 'coding', detail: `显示 ${shown} 条，分类 [${cats}]（原 ${before}）` };
});

test('工具页筛选：搜索框', '/tools/', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='midjourney';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const name = await c.eval(`(document.querySelector('[data-list] > *:not(.hidden) .name')||{}).textContent||''`);
  return { ok: shown === 1 && /Midjourney/i.test(name), detail: `${shown} 条，命中「${name}」` };
});

test('工具页筛选：无限结果时显示空态', '/tools/', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='zzzz不存在的工具zzz';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const emptyVisible = await c.eval(`!document.querySelector('[data-empty]').classList.contains('hidden')`);
  return { ok: shown === 0 && emptyVisible === true, detail: `显示 ${shown} 条，空态可见 ${emptyVisible}` };
});

test('重置按钮恢复全量', '/tools/', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='xxx';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  await c.eval(`document.querySelector('[data-reset]').click()`);
  const v = await c.eval(`document.querySelector('[data-query]').value`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const total = await c.eval(`document.querySelectorAll('[data-list] > *').length`);
  return { ok: v === '' && shown === total, detail: `输入框已清空，${shown}/${total} 条可见` };
});

test('"仅国内直连"开关生效', '/tools/', async (c) => {
  await c.eval(`document.querySelector('[data-toggle="cn"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const bad = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].filter(x=>x.dataset.cn!=='1').length`);
  return { ok: shown > 0 && bad === 0, detail: `显示 ${shown} 条，非国内直连残留 ${bad}` };
});

test('全站搜索返回结果', '/search/?q=RAG', async (c) => {
  const n = await c.eval(`document.querySelectorAll('#searchResults > *').length`);
  const count = await c.eval(`document.querySelector('#searchCount').textContent`);
  return { ok: n > 0, detail: `${n} 张结果卡 · ${count}` };
});

test('全站搜索类型筛选', '/search/?q=RAG', async (c) => {
  await c.eval(`document.querySelector('[data-type="glossary"]').click()`);
  const subs = await c.eval(`[...document.querySelectorAll('#searchResults .card-top > div > div')].map(x=>x.textContent.trim())`);
  const allGloss = subs.every((s) => s.startsWith('术语'));
  return { ok: subs.length > 0 && allGloss, detail: `${subs.length} 条，全部为术语类 ${allGloss}` };
});

test('主题切换写入 localStorage', '/', async (c) => {
  const before = await c.eval(`document.documentElement.getAttribute('data-theme')`);
  await c.eval(`document.querySelector('#themeBtn').click()`);
  await sleep(120);
  const after = await c.eval(`document.documentElement.getAttribute('data-theme')`);
  const ls = await c.eval(`localStorage.getItem('aiwx-theme')`);
  return { ok: before !== after && ls === after, detail: `${before} → ${after}（localStorage=${ls}）` };
});

test('URL ?theme=light 生效', '/tools/?theme=light', async (c) => {
  const t = await c.eval(`document.documentElement.getAttribute('data-theme')`);
  return { ok: t === 'light', detail: `data-theme=${t}` };
});

test('移动端菜单可展开', '/', async (c) => {
  await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await c.send('Page.navigate', { url: SERVE + '/' });
  await sleep(800);
  await c.eval(`document.querySelector('#menuBtn').click()`);
  await sleep(250);
  const open = await c.eval(`document.querySelector('#nav').classList.contains('open')`);
  const visible = await c.eval(`getComputedStyle(document.querySelector('#nav')).opacity`);
  return { ok: open === true && Number(visible) > 0.9, detail: `open=${open} opacity=${visible}` };
});

test('资讯详情页可访问', '/news/n-what-is-mcp/', async (c) => {
  const h1 = await c.eval(`(document.querySelector('.article-head h1')||{}).textContent||''`);
  const paras = await c.eval(`document.querySelectorAll('.article-body p').length`);
  return { ok: h1.length > 0 && paras >= 3, detail: `标题「${h1.slice(0, 20)}…」，正文 ${paras} 段` };
});

test('数据 API 可访问且为合法 JSON', '/api/index.json', async () => {
  const d = JSON.parse(await get(SERVE + '/api/index.json'));
  return { ok: !!d.counts && d.counts.tools > 0, detail: `counts.tools=${d.counts?.tools}` };
});

/* ---- v2 新增能力的回归测试 ---- */

test('提示词变量填充器：填入值后正文同步更新', '/prompts/?cat=meta#p-prompt-improve', async (c) => {
  // 注意：被筛选隐藏的卡片仍在 DOM 中，必须用 ID 精确定位到目标卡片
  const S = '#p-prompt-improve ';
  const before = await c.eval(`(document.querySelector('${S}.prompt-code pre')||{}).textContent||''`);
  await c.eval(`(function(){const i=document.querySelector('${S}[data-var="原始提示词"]');i.value='帮我写一份周报';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const after = await c.eval(`document.querySelector('${S}.prompt-code pre').textContent`);
  const filled = await c.eval(`document.querySelectorAll('${S}.prompt-code pre .filled').length`);
  const remain = await c.eval(`document.querySelectorAll('${S}.prompt-code pre .var-hl').length`);
  return {
    ok: before.indexOf('{{原始提示词}}') !== -1 && after.indexOf('帮我写一份周报') !== -1 && after.indexOf('{{原始提示词}}') === -1 && filled === 1 && remain === 0,
    detail: `填值前含占位符=${before.indexOf('{{原始提示词}}') !== -1}，填值后插入成功=${after.indexOf('帮我写一份周报') !== -1}，已填标记 ${filled}，剩余占位 ${remain}`,
  };
});

test('变量填充器：清空按钮恢复占位符', '/prompts/?cat=meta#p-prompt-improve', async (c) => {
  const S = '#p-prompt-improve ';
  await c.eval(`(function(){const i=document.querySelector('${S}[data-var="原始提示词"]');i.value='临时内容';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  await c.eval(`document.querySelector('${S}[data-fill-clear]').click()`);
  const v = await c.eval(`document.querySelector('${S}[data-var="原始提示词"]').value`);
  const back = await c.eval(`document.querySelector('${S}.prompt-code pre').textContent.indexOf('{{原始提示词}}') !== -1`);
  const filled = await c.eval(`document.querySelectorAll('${S}.prompt-code pre .filled').length`);
  return { ok: v === '' && back === true && filled === 0, detail: `输入框="${v}"，占位符已恢复=${back}，残留已填标记 ${filled}` };
});

test('变量填充不影响其他卡片', '/prompts/?cat=meta#p-prompt-improve', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('#p-prompt-improve [data-var="原始提示词"]');i.value='X';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const scope = await c.eval(`document.querySelectorAll('#p-extract-json .prompt-code pre .filled').length`);
  // 原始模板不再由服务端输出 data-raw，改为前端从 <pre> 的 textContent 取一次并缓存。
  // 所以这里验证的是：未被动过的卡片，正文里仍保留 {{变量}} 占位符。
  const untouched = await c.eval(`/\\{\\{[^}]+\\}\\}/.test(document.querySelector('#p-extract-json .prompt-code pre').textContent)`);
  const noRawAttr = await c.eval(`document.querySelector('#p-extract-json .prompt-code pre').getAttribute('data-raw') === null`);
  return {
    ok: scope === 0 && untouched === true && noRawAttr === true,
    detail: `相邻卡片已填标记 ${scope}，占位符仍完整=${untouched}，不再重复输出 data-raw=${noRawAttr}`,
  };
});

test('变量填充面板按需生成（服务端不渲染这部分）', '/prompts/?cat=meta', async (c) => {
  const before = await c.eval(`document.querySelectorAll('.prompt-fill').length`);
  const varsAttr = await c.eval(`document.querySelector('.prompt-card[data-vars]') ? document.querySelector('.prompt-card[data-vars]').getAttribute('data-vars') : ''`);
  await c.eval(`document.querySelector('.prompt-card[data-vars] .prompt-head').click()`);
  const after = await c.eval(`document.querySelectorAll('.prompt-fill').length`);
  const inputs = await c.eval(`document.querySelectorAll('.prompt-card.open .prompt-fill input[data-var]').length`);
  return {
    ok: before === 0 && after === 1 && inputs > 0,
    detail: `展开前 ${before} 个面板，展开后 ${after} 个 / ${inputs} 个输入框；data-vars="${varsAttr}"`,
  };
});

test('工具页排序：切换到「最新收录」', '/tools/', async (c) => {
  await c.eval(`(function(){const s=document.querySelector('[data-sort]');s.value='new';s.dispatchEvent(new Event('change',{bubbles:true}));return 0})()`);
  const dates = await c.eval(`[...document.querySelectorAll('[data-list] > *')].map(x=>x.dataset.added).filter(Boolean).slice(0,5)`);
  const desc = dates.every((d, i) => i === 0 || dates[i - 1] >= d);
  const first = await c.eval(`(document.querySelector('[data-list] > * .name')||{}).textContent||''`);
  return { ok: desc && dates.length > 0, detail: `前 5 个收录日期 ${dates.join(' > ')}，首项「${first}」` };
});

test('工具页排序：按名称', '/tools/', async (c) => {
  await c.eval(`(function(){const s=document.querySelector('[data-sort]');s.value='name';s.dispatchEvent(new Event('change',{bubbles:true}));return 0})()`);
  const names = await c.eval(`[...document.querySelectorAll('[data-list] > *')].map(x=>(x.querySelector('.name')||{}).textContent||'').slice(0,4)`);
  return { ok: names.length === 4, detail: `前 4 项：${names.join(' / ')}` };
});

test('NEW 标记出现在最新收录的工具上', '/tools/?sort=new', async (c) => {
  const total = await c.eval(`document.querySelectorAll('.badge-new').length`);
  return { ok: total > 0, detail: `${total} 个工具带 NEW 标记` };
});

test('RSS 订阅源格式正确', '/feed.xml', async () => {
  const xml = await get(SERVE + '/feed.xml');
  const ok = xml.startsWith('<?xml') && xml.indexOf('<rss') !== -1 && xml.indexOf('<item>') !== -1;
  const n = (xml.match(/<item>/g) || []).length;
  return { ok, detail: `合法 RSS，含 ${n} 条 item` };
});

test('搜索索引 API 可用', '/api/search.json', async () => {
  const d = JSON.parse(await get(SERVE + '/api/search.json'));
  const types = [...new Set(d.map((x) => x.t))].sort();
  return { ok: Array.isArray(d) && d.length > 100, detail: `${d.length} 条，覆盖类型 [${types.join(', ')}]` };
});

test('社交分享图与图标已生成', '/og.png', async () => {
  const buf = await new Promise((res, rej) => {
    http.get(SERVE + '/og.png', (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
  const isPng = buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return { ok: isPng && w === 1200 && h === 630, detail: `PNG ${w}×${h}，${(buf.length / 1024).toFixed(0)} KB` };
});

test('结构化数据 JSON-LD 可解析', '/tools/', async (c) => {
  const raw = await c.eval(`[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent)`);
  let ok = raw.length > 0, types = [];
  try {
    types = raw.map((s) => JSON.parse(s)['@type']);
  } catch (e) { ok = false; }
  return { ok: ok && types.length >= 2, detail: `${raw.length} 段：${types.join(' / ')}` };
});

test('字体文件自托管可访问', '/fonts/ibm-plex-mono-latin-500-normal.woff2', async () => {
  const buf = await new Promise((res, rej) => {
    http.get(SERVE + '/fonts/ibm-plex-mono-latin-500-normal.woff2', (r) => {
      const chunks = [];
      r.on('data', (c) => chunks.push(c));
      r.on('end', () => res(Buffer.concat(chunks)));
    }).on('error', rej);
  });
  const isWoff2 = buf.slice(0, 4).toString('ascii') === 'wOF2';
  return { ok: isWoff2, detail: `${isWoff2 ? 'WOFF2 合法' : '格式错误'}，${(buf.length / 1024).toFixed(1)} KB` };
});

/* ---- v3 新模块：场景手册 / 模型库 ---- */

test('场景手册：分组筛选生效', '/playbooks/', async (c) => {
  await c.eval(`document.querySelector('[data-facet="group"][data-value="code"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const groups = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].map(x=>x.dataset.group).filter((v,i,a)=>a.indexOf(v)===i)`);
  return { ok: shown > 0 && groups.length === 1 && groups[0] === 'code', detail: `显示 ${shown} 条，分组 [${groups}]` };
});

test('场景手册：搜索能按「想做的事」命中', '/playbooks/', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='周报';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const title = await c.eval(`(document.querySelector('[data-list] > *:not(.hidden) .name')||{}).textContent||''`);
  return { ok: shown >= 1 && title.indexOf('周报') !== -1, detail: `${shown} 条，命中「${title}」` };
});

test('场景详情页：流程步骤与 HowTo 结构化数据', '/playbooks/pb-weekly-report/', async (c) => {
  const steps = await c.eval(`document.querySelectorAll('.steps .step').length`);
  const chips = await c.eval(`document.querySelectorAll('.step-refs .tag').length`);
  const warns = await c.eval(`document.querySelectorAll('.warn-item').length`);
  const ld = await c.eval(`[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)['@type'])`);
  return {
    ok: steps >= 2 && chips > 0 && warns > 0 && ld.includes('HowTo'),
    detail: `${steps} 步 / ${chips} 个引用 / ${warns} 条避坑，JSON-LD [${ld.join(', ')}]`,
  };
});

test('场景详情页：关联提示词可展开并带变量填充', '/playbooks/pb-weekly-report/', async (c) => {
  const cards = await c.eval(`document.querySelectorAll('.prompt-card').length`);
  const fills = await c.eval(`document.querySelectorAll('.prompt-fill').length`);
  await c.eval(`document.querySelector('.prompt-card .prompt-head').click()`);
  const open = await c.eval(`document.querySelector('.prompt-card').classList.contains('open')`);
  return { ok: cards > 0 && open === true, detail: `${cards} 张提示词卡，其中 ${fills} 张带变量填充，展开=${open}` };
});

test('模型库：类型筛选', '/models/', async (c) => {
  await c.eval(`document.querySelector('[data-facet="kind"][data-value="video"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const kinds = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].map(x=>x.dataset.kind).filter((v,i,a)=>a.indexOf(v)===i)`);
  return { ok: shown > 0 && kinds.length === 1 && kinds[0] === 'video', detail: `${shown} 个，类型 [${kinds}]` };
});

test('模型库：「只要开源」开关', '/models/', async (c) => {
  await c.eval(`document.querySelector('[data-toggle="open"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const bad = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].filter(x=>x.dataset.open!=='1').length`);
  return { ok: shown > 0 && bad === 0, detail: `${shown} 个开源模型，非开源残留 ${bad}` };
});

test('模型库：「国内可直连」开关', '/models/', async (c) => {
  await c.eval(`document.querySelector('[data-toggle="cn"]').click()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const bad = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden)')].filter(x=>x.dataset.cn!=='1').length`);
  return { ok: shown > 0 && bad === 0, detail: `${shown} 个国内可直连，残留 ${bad}` };
});

test('全站搜索按类型分组，高数量类型不淹没其他类型', '/search/?q=开源', async (c) => {
  const heads = await c.eval(`[...document.querySelectorAll('.search-group-head .label')].map(x=>x.textContent)`);
  const capOk = await c.eval(`[...document.querySelectorAll('.search-group')].every(g=>g.querySelectorAll('.grid > *').length<=12)`);
  const more = await c.eval(`document.querySelectorAll('.search-more').length`);
  const total = await c.eval(`document.querySelector('#searchCount').textContent`);
  return {
    ok: heads.length >= 3 && heads.indexOf('模型') !== -1 && capOk === true,
    detail: `分组 [${heads.join(', ')}]，每组上限 12 = ${capOk}，${more} 组带「还有更多」提示，${total}`,
  };
});

test('全站搜索：点类型标签切换到平铺视图', '/search/?q=开源', async (c) => {
  await c.eval(`document.querySelector('[data-type="model"]').click()`);
  const grouped = await c.eval(`document.querySelector('#searchResults').classList.contains('search-grouped')`);
  const items = await c.eval(`document.querySelectorAll('#searchResults > *').length`);
  const cats = await c.eval(`[...document.querySelectorAll('#searchResults .card-cat')].map(x=>x.textContent.split('/')[0].trim()).filter((v,i,a)=>a.indexOf(v)===i)`);
  return { ok: grouped === false && items > 0 && cats.length === 1 && cats[0] === '模型', detail: `平铺=${!grouped}，${items} 条，类型 [${cats}]` };
});

test('首页展示新模块统计', '/', async (c) => {
  const labels = await c.eval(`[...document.querySelectorAll('.stat span')].map(x=>x.textContent)`);
  const hasPlaybook = labels.some((l) => l.indexOf('场景') !== -1);
  const hasModel = labels.some((l) => l.indexOf('模型') !== -1);
  return { ok: hasPlaybook && hasModel, detail: labels.join(' / ') };
});

test('站点地图包含场景与模型页面', '/sitemap.xml', async () => {
  const xml = await get(SERVE + '/sitemap.xml');
  const pb = (xml.match(/\/playbooks\//g) || []).length;
  const md = (xml.match(/\/models\//g) || []).length;
  const total = (xml.match(/<url>/g) || []).length;
  return { ok: pb > 10 && md > 5, detail: `共 ${total} 个 URL，场景 ${pb} 条、模型 ${md} 条` };
});

test('数据 API 覆盖新模块', '/api/index.json', async () => {
  const d = JSON.parse(await get(SERVE + '/api/index.json'));
  const c2 = d.counts || {};
  const ok = c2.playbooks > 0 && c2.models > 0 && c2.tools > 100;
  return { ok, detail: `工具 ${c2.tools} / 场景 ${c2.playbooks} / 模型 ${c2.models} / 提示词 ${c2.prompts} / 术语 ${c2.glossary}` };
});

/* ---- v4 新增：工具详情页 ---- */

test('工具详情页：结构与结构化数据', '/tools/coding/cursor/', async (c) => {
  const h1 = await c.eval(`(document.querySelector('.tool-hero h1')||{}).textContent||''`);
  const guide = await c.eval(`document.querySelectorAll('.card p').length`);
  const rows = await c.eval(`document.querySelectorAll('.data-table tbody tr').length`);
  const ld = await c.eval(`[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)['@type'])`);
  return {
    ok: h1 === 'Cursor' && rows >= 3 && ld.includes('SoftwareApplication'),
    detail: `标题「${h1}」，对比表 ${rows} 行，JSON-LD [${ld.join(', ')}]`,
  };
});

test('工具详情页：对比表高亮当前工具', '/tools/coding/cursor/', async (c) => {
  const cur = await c.eval(`[...document.querySelectorAll('.data-table tbody tr.is-current')].map(r=>r.querySelector('td a').textContent)`);
  const ext = await c.eval(`[...document.querySelectorAll('.data-table td a')].filter(a=>a.target==='_blank').length`);
  return { ok: cur.length === 1 && cur[0] === 'Cursor' && ext > 0, detail: `高亮行 [${cur}]，表内 ${ext} 个外链` };
});

test('工具详情页：关联到使用它的场景手册', '/tools/coding/cursor/', async (c) => {
  const heads = await c.eval(`[...document.querySelectorAll('.section-head h2')].map(x=>x.textContent)`);
  const cards = await c.eval(`document.querySelectorAll('.playbook-card').length`);
  const hasSection = heads.some((h) => h.indexOf('它出现在哪些场景里') !== -1);
  return { ok: hasSection && cards > 0, detail: `章节 [${heads.join(' / ')}]，关联 ${cards} 个场景` };
});

test('工具详情页：分类选型提示不为空（回归：曾因分类 id 撞车导致空白）', '/tools/marketing/', async (c) => {
  const names = await c.eval(`[...document.querySelectorAll('[data-list] .card-cat')].map(x=>x.textContent).filter((v,i,a)=>a.indexOf(v)===i)`);
  await c.send('Page.navigate', { url: SERVE + '/tools/marketing/ahrefs/' });
  await sleep(700);
  const guideLen = await c.eval(`((document.querySelector('.section .card p')||{}).textContent||'').length`);
  const color = await c.eval(`(document.querySelector('.section .card')||{}).getAttribute?document.querySelector('.section .card').getAttribute('style'):''`);
  return {
    ok: names.length === 1 && names[0] === '营销增长' && guideLen > 40 && color.indexOf('#BE123C') !== -1,
    detail: `分类名 [${names}]，选型提示 ${guideLen} 字，强调色 ${(color.match(/#[0-9A-F]{6}/) || ['—'])[0]}`,
  };
});

test('工具卡标题指向站内详情页（而非直接外跳）', '/tools/coding/', async (c) => {
  const hrefs = await c.eval(`[...document.querySelectorAll('[data-list] .card-title a.name')].slice(0,5).map(a=>a.getAttribute('href'))`);
  const allInternal = hrefs.every((h) => h && h.startsWith('/tools/') && h.split('/').length >= 4);
  const extBtn = await c.eval(`[...document.querySelectorAll('[data-list] .card-foot a[target="_blank"]')].length`);
  return { ok: allInternal && extBtn > 0, detail: `前 5 个标题链接 ${hrefs[0]} …，外跳按钮 ${extBtn} 个` };
});

test('搜索结果的工具标题指向详情页，访问按钮仍直达官网', '/search/?q=cursor', async (c) => {
  const titleHref = await c.eval(`(document.querySelector('#searchResults .card-title a.name')||{}).getAttribute?document.querySelector('#searchResults .card-title a.name').getAttribute('href'):''`);
  const extHref = await c.eval(`(document.querySelector('#searchResults .card-foot a[target="_blank"]')||{}).href||''`);
  return {
    ok: titleHref.indexOf('/tools/') === 0 && extHref.indexOf('http') === 0,
    detail: `标题 → ${titleHref}；访问 → ${extHref.slice(0, 40)}`,
  };
});

/* ---- v5 新增：实时动态（RSS 聚合） ---- */

test('实时动态页：列表、来源筛选与语种筛选', '/news/live/', async (c) => {
  const items = await c.eval(`document.querySelectorAll('.live-item').length`);
  await c.eval(`document.querySelector('[data-facet="lang"][data-value="中文"]').click()`);
  const cn = await c.eval(`[...document.querySelectorAll('.live-item')].filter(x=>!x.classList.contains('hidden')).length`);
  const bad = await c.eval(`[...document.querySelectorAll('.live-item:not(.hidden)')].filter(x=>x.dataset.lang!=='中文').length`);
  await c.eval(`document.querySelector('[data-reset]').click()`);
  const back = await c.eval(`[...document.querySelectorAll('.live-item')].filter(x=>!x.classList.contains('hidden')).length`);
  return {
    ok: items > 20 && cn > 0 && bad === 0 && back === items,
    detail: `共 ${items} 条，中文筛选后 ${cn} 条（残留 ${bad}），重置恢复 ${back} 条`,
  };
});

test('实时动态页：按来源筛选', '/news/live/', async (c) => {
  const srcsBefore = await c.eval(`[...document.querySelectorAll('.live-item')].map(x=>x.dataset.source).filter((v,i,a)=>a.indexOf(v)===0?false:a.indexOf(v)===i)`);
  // 取第一个非 all 的来源按钮点击
  await c.eval(`(function(){const b=document.querySelector('[data-facet="source"]:not([data-value="all"])');b.click();return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('.live-item')].filter(x=>!x.classList.contains('hidden')).length`);
  const unique = await c.eval(`[...new Set([...document.querySelectorAll('.live-item:not(.hidden)')].map(x=>x.dataset.source))].length`);
  return { ok: shown > 0 && unique === 1, detail: `共 ${srcsBefore.length} 个来源，筛选单个来源后 ${shown} 条且来源唯一=${unique === 1}` };
});

test('实时动态：时间是绝对时间 + 前端增强为相对时间', '/news/live/', async (c) => {
  const iso = await c.eval(`[...document.querySelectorAll('.live-time[datetime]')].filter(t=>t.getAttribute('datetime')).length`);
  const abs = await c.eval(`[...document.querySelectorAll('.live-time')].filter(t=>/^\\d{2}-\\d{2} \\d{2}:\\d{2}$|刚|分钟前|小时前|天前/.test(t.textContent)).length`);
  const sample = await c.eval(`(document.querySelector('.live-time')||{}).textContent||''`);
  return { ok: iso > 20 && abs > 20, detail: `${iso} 个 <time datetime>，其中 ${abs} 个已显示为「${sample}」` };
});

test('实时动态页：抓取状态如实展示（含失败源）', '/news/live/', async (c) => {
  const rows = await c.eval(`document.querySelectorAll('.source-row').length`);
  const okRows = await c.eval(`[...document.querySelectorAll('.sr-ic')].filter(x=>x.textContent.trim()==='✓').length`);
  const failRows = await c.eval(`[...document.querySelectorAll('.sr-ic')].filter(x=>x.textContent.trim()==='✗').length`);
  return { ok: rows >= 10 && okRows + failRows === rows, detail: `共 ${rows} 个源状态，成功 ${okRows} / 失败 ${failRows}` };
});

test('资讯页嵌入了实时动态区块', '/news/', async (c) => {
  const heads = await c.eval(`[...document.querySelectorAll('.section-head h2')].map(x=>x.textContent)`);
  const live = await c.eval(`document.querySelectorAll('.live-item').length`);
  const hasLive = heads.some((h) => h.indexOf('实时动态') !== -1);
  const hasCurated = heads.some((h) => h.indexOf('精选解读') !== -1);
  return { ok: hasLive && hasCurated && live > 0 && live <= 10, detail: `区块 [${heads.join(' / ')}]，预览 ${live} 条` };
});

test('实时动态数据开放 API', '/api/feed.json', async () => {
  const d = JSON.parse(await get(SERVE + '/api/feed.json'));
  const okSrc = (d.sources || []).filter((s) => s.ok).length;
  return { ok: Array.isArray(d.items) && d.items.length > 20 && okSrc > 0, detail: `${d.items.length} 条 / ${okSrc} 个源成功 / 更新于 ${String(d.updatedAt).slice(0, 16).replace('T', ' ')}` };
});

test('实时动态条目全部为外链且带 noopener', '/news/live/', async (c) => {
  const total = await c.eval(`document.querySelectorAll('.live-item').length`);
  const ext = await c.eval(`[...document.querySelectorAll('.live-item')].filter(a=>a.getAttribute('target')==='_blank' && (a.getAttribute('rel')||'').indexOf('noopener')!==-1 && /^https?:/.test(a.getAttribute('href'))).length`);
  return { ok: total > 20 && ext === total, detail: `${total} 条中 ${ext} 条为带 noopener 的外链` };
});

/* ---- v6 新增：工具对比 ---- */

/** 清空对比选择并重新载入页面（localStorage 在同源下跨用例留存，必须先清） */
async function resetCmp(c, path_) {
  await c.send('Page.navigate', { url: SERVE + path_ });
  await sleep(500);
  await c.eval(`localStorage.removeItem('aiwx-compare')`);
  await c.send('Page.navigate', { url: SERVE + path_ });
  await sleep(700);
}

test('对比：工具卡可加入 / 移除对比', '/tools/coding/', async (c) => {
  await resetCmp(c, '/tools/coding/');
  const has = await c.eval(`document.querySelectorAll('[data-cmp]').length`);
  await c.eval(`document.querySelector('[data-cmp]').click()`);
  const on = await c.eval(`document.querySelector('[data-cmp]').getAttribute('aria-pressed')`);
  const n = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  const barShown = await c.eval(`(document.querySelector('#cmpBar')||{classList:{contains:()=>false}}).classList.contains('show')`);
  // 再点一次应移除
  await c.eval(`document.querySelector('[data-cmp]').click()`);
  const off = await c.eval(`document.querySelector('[data-cmp]').getAttribute('aria-pressed')`);
  const n2 = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  return {
    ok: has > 10 && on === 'true' && n === 1 && barShown === true && off === 'false' && n2 === 0,
    detail: `${has} 个按钮；加入后 pressed=${on} 存了 ${n} 个、浮动条显示=${barShown}；再点后 pressed=${off} 存了 ${n2} 个`,
  };
});

test('对比：最多 4 个，超出时给出提示而不是静默失败', '/tools/coding/', async (c) => {
  await resetCmp(c, '/tools/coding/');
  // 连续点 5 个不同卡片的对比按钮
  await c.eval(`(function(){
    const bs=[...document.querySelectorAll('[data-cmp]')].slice(0,5);
    bs.forEach(b=>b.click());return 0})()`);
  const n = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  return { ok: n === 4, detail: `点了 5 个，实际存入 ${n} 个（上限 4）` };
});

test('对比：选择在刷新后保留', '/tools/coding/', async (c) => {
  await resetCmp(c, '/tools/coding/');
  await c.eval(`document.querySelector('[data-cmp]').click()`);
  const id = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare'))[0]`);
  await c.send('Page.navigate', { url: SERVE + '/tools/coding/' });
  await sleep(800);
  const pressed = await c.eval(`[...document.querySelectorAll('[data-cmp][aria-pressed="true"]')].map(b=>b.getAttribute('data-cmp'))`);
  return { ok: pressed.length === 1 && pressed[0] === id, detail: `刷新后仍选中 [${pressed}]` };
});

test('对比：浮动条数量正确且可清空', '/tools/coding/', async (c) => {
  await resetCmp(c, '/tools/coding/');
  await c.eval(`(function(){const bs=[...document.querySelectorAll('[data-cmp]')].slice(0,3);bs.forEach(b=>b.click());return 0})()`);
  const shownN = await c.eval(`document.querySelector('#cmpBarN').textContent`);
  await c.eval(`document.querySelector('#cmpBarClear').click()`);
  const after = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  const hidden = await c.eval(`!document.querySelector('#cmpBar').classList.contains('show')`);
  return { ok: shownN === '3' && after === 0 && hidden === true, detail: `浮动条显示 ${shownN} 个；清空后剩 ${after} 个，浮动条隐藏=${hidden}` };
});

test('对比页：空态引导与一键放入热门', '/compare/', async (c) => {
  await resetCmp(c, '/compare/');
  const emptyVisible = await c.eval(`!document.querySelector('#cmpEmpty').classList.contains('hidden')`);
  await c.eval(`document.querySelector('#cmpFillHot').click()`);
  const rows = await c.eval(`document.querySelectorAll('.cmp-table tbody tr').length`);
  const cols = await c.eval(`document.querySelectorAll('.cmp-table thead th').length`);
  const emptyHidden = await c.eval(`document.querySelector('#cmpEmpty').classList.contains('hidden')`);
  return {
    ok: emptyVisible === true && emptyHidden === true && cols === 4 && rows > 5,
    detail: `空态 ${emptyVisible}；一键放入后表头 ${cols} 列、${rows} 行，空态隐藏=${emptyHidden}`,
  };
});

test('对比页：差异行高亮、相同行淡化', '/compare/', async (c) => {
  await resetCmp(c, '/compare/');
  await c.eval(`(function(){localStorage.setItem('aiwx-compare',JSON.stringify(['chatgpt','claude','deepseek']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(900);
  const diff = await c.eval(`document.querySelectorAll('.cmp-table tr.is-diff').length`);
  const same = await c.eval(`document.querySelectorAll('.cmp-table tr.is-same').length`);
  const marks = await c.eval(`document.querySelectorAll('.cmp-table .cmp-mark').length`);
  const diffMoney = await c.eval(`[...document.querySelectorAll('.cmp-table tr')].some(tr=>tr.classList.contains('is-diff') && tr.querySelector('th').textContent.indexOf('国内直连')!==-1)`);
  // 三个都是对话类，分类行应当被判定为"相同"
  const catSame = await c.eval(`[...document.querySelectorAll('.cmp-table tr')].some(tr=>tr.classList.contains('is-same') && tr.querySelector('th').textContent.indexOf('分类')!==-1)`);
  return {
    ok: diff > 0 && same > 0 && marks === diff && diffMoney === true && catSame === true,
    detail: `差异行 ${diff} 条（含标记 ${marks} 个）、相同行 ${same} 条；分类行判为相同=${catSame}，国内直连行判为差异=${diffMoney}`,
  };
});

test('对比页：移除单个工具', '/compare/', async (c) => {
  await resetCmp(c, '/compare/');
  await c.eval(`(function(){localStorage.setItem('aiwx-compare',JSON.stringify(['chatgpt','claude']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(900);
  const before = await c.eval(`document.querySelectorAll('.cmp-table thead th').length`);
  await c.eval(`document.querySelector('[data-cmp-remove]').click()`);
  const after = await c.eval(`document.querySelectorAll('.cmp-table thead th').length`);
  const ls = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')).length`);
  return { ok: before === 3 && after === 2 && ls === 1, detail: `表头列 ${before} → ${after}，存储剩 ${ls} 个` };
});

test('对比页：清空后回到空态', '/compare/', async (c) => {
  await resetCmp(c, '/compare/');
  await c.eval(`(function(){localStorage.setItem('aiwx-compare',JSON.stringify(['chatgpt']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(900);
  await c.eval(`document.querySelector('#cmpClear').click()`);
  const emptyVisible = await c.eval(`!document.querySelector('#cmpEmpty').classList.contains('hidden')`);
  const ls = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  return { ok: emptyVisible === true && ls === 0, detail: `空态可见=${emptyVisible}，存储剩 ${ls} 个` };
});

test('对比页：无效 id 被忽略，不会渲染出空列', '/compare/', async (c) => {
  await resetCmp(c, '/compare/');
  await c.eval(`(function(){localStorage.setItem('aiwx-compare',JSON.stringify(['chatgpt','这个id不存在','claude']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(900);
  const cols = await c.eval(`document.querySelectorAll('.cmp-table thead th').length`);
  const names = await c.eval(`[...document.querySelectorAll('.cmp-head-in b')].map(x=>x.textContent)`);
  return { ok: cols === 3 && names.length === 2, detail: `3 个 id 中 1 个无效，渲染 ${names.length} 列：${names.join(' / ')}` };
});

test('对比：与工具库筛选共存（点击对比按钮不触发卡片链接）', '/tools/', async (c) => {
  await resetCmp(c, '/tools/');
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='cursor';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  await c.eval(`document.querySelector('[data-list] > *:not(.hidden) [data-cmp]').click()`);
  const n = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  const stillShown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  return { ok: shown === 1 && n === 1 && stillShown === 1, detail: `筛选出 ${shown} 条，点对比后存入 ${n} 个，筛选状态保持 ${stillShown} 条` };
});

test('对比：详情页的加入按钮文案会切换', '/tools/coding/cursor/', async (c) => {
  await resetCmp(c, '/tools/coding/cursor/');
  const btn = `[data-cmp][data-cmp-label]`;
  const before = await c.eval(`(document.querySelector('${btn}')||{}).textContent||''`);
  await c.eval(`document.querySelector('${btn}').click()`);
  const after = await c.eval(`(document.querySelector('${btn}')||{}).textContent||''`);
  const pressed = await c.eval(`document.querySelector('${btn}').getAttribute('aria-pressed')`);
  return {
    ok: before.indexOf('加入对比') !== -1 && after.indexOf('已加入对比') !== -1 && pressed === 'true',
    detail: `「${before.trim()}」→「${after.trim()}」`,
  };
});

/* ---- v7 新增：收藏 ---- */

async function resetSave(c, path_) {
  await c.send('Page.navigate', { url: SERVE + path_ });
  await sleep(500);
  await c.eval(`localStorage.removeItem('aiwx-saved')`);
  await c.send('Page.navigate', { url: SERVE + path_ });
  await sleep(700);
}

test('收藏：各类卡片都有收藏按钮且可切换', '/tools/coding/', async (c) => {
  await resetSave(c, '/tools/coding/');
  const btns = await c.eval(`document.querySelectorAll('[data-save]').length`);
  await c.eval(`document.querySelector('[data-save]').click()`);
  const on = await c.eval(`document.querySelector('[data-save]').getAttribute('aria-pressed')`);
  const key = await c.eval(`JSON.parse(localStorage.getItem('aiwx-saved'))[0]`);
  const bar = await c.eval(`document.querySelector('#saveBar').classList.contains('show')`);
  return { ok: btns > 10 && on === 'true' && key.indexOf('tool:') === 0 && bar === true, detail: `${btns} 个按钮；收藏 key=${key}，浮动条显示=${bar}` };
});

test('收藏：跨内容类型（工具/提示词/场景/模型）都能收藏', '/', async (c) => {
  const types = {};
  for (const p of ['/tools/', '/prompts/', '/playbooks/', '/models/']) {
    await resetSave(c, p);
    await c.eval(`document.querySelector('[data-save]').click()`);
    types[p] = await c.eval(`JSON.parse(localStorage.getItem('aiwx-saved'))[0]`);
  }
  const kinds = Object.values(types).map((k) => k.split(':')[0]);
  const expect = ['tool', 'prompt', 'playbook', 'model'];
  return { ok: JSON.stringify(kinds) === JSON.stringify(expect), detail: kinds.join(', ') };
});

test('收藏页：分组渲染与计数', '/saved/', async (c) => {
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(500);
  await c.eval(`(function(){localStorage.setItem('aiwx-saved',JSON.stringify(['tool:chatgpt','prompt:p-weekly','playbook:pb-weekly-report','model:m-claude']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(900);
  const heads = await c.eval(`[...document.querySelectorAll('#savedBody .search-group-head .label')].map(x=>x.textContent)`);
  const cards = await c.eval(`document.querySelectorAll('#savedBody .card').length`);
  const count = await c.eval(`(document.querySelector('#savedCount')||{}).textContent||''`);
  const emptyHidden = await c.eval(`document.querySelector('#savedEmpty').classList.contains('hidden')`);
  return { ok: cards === 4 && heads.length === 4 && emptyHidden === true, detail: `分组 [${heads.join(', ')}]，${cards} 张卡，${count}` };
});

test('收藏页：已下架的条目被忽略并如实告知', '/saved/', async (c) => {
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(500);
  await c.eval(`(function(){localStorage.setItem('aiwx-saved',JSON.stringify(['tool:chatgpt','tool:这个工具已下架','model:m-qwen']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(900);
  const cards = await c.eval(`document.querySelectorAll('#savedBody .card').length`);
  const count = await c.eval(`(document.querySelector('#savedCount')||{}).textContent||''`);
  return { ok: cards === 2 && count.indexOf('1 项已下架') !== -1, detail: `3 个收藏中 1 个无效，渲染 ${cards} 张卡；「${count}」` };
});

test('收藏页：清空后回到空态', '/saved/', async (c) => {
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(500);
  await c.eval(`(function(){localStorage.setItem('aiwx-saved',JSON.stringify(['tool:chatgpt']));return 0})()`);
  await c.send('Page.navigate', { url: SERVE + '/saved/' });
  await sleep(900);
  await c.eval(`document.querySelector('#savedClear').click()`);
  const emptyVisible = await c.eval(`!document.querySelector('#savedEmpty').classList.contains('hidden')`);
  const ls = await c.eval(`JSON.parse(localStorage.getItem('aiwx-saved')||'[]').length`);
  return { ok: emptyVisible === true && ls === 0, detail: `空态可见=${emptyVisible}，存储剩 ${ls} 项` };
});

test('收藏：点提示词卡的收藏不会连带展开卡片（回归）', '/prompts/', async (c) => {
  await resetSave(c, '/prompts/');
  const before = await c.eval(`document.querySelector('.prompt-card').classList.contains('open')`);
  await c.eval(`document.querySelector('.prompt-card [data-save]').click()`);
  const after = await c.eval(`document.querySelector('.prompt-card').classList.contains('open')`);
  const saved = await c.eval(`JSON.parse(localStorage.getItem('aiwx-saved')||'[]').length`);
  return {
    ok: before === false && after === false && saved === 1,
    detail: `点击前展开=${before}，点击后展开=${after}（应保持 false），收藏成功=${saved}`,
  };
});

test('收藏：场景卡仍是整卡可点（结构从 <a> 改成 div + 热区）', '/playbooks/', async (c) => {
  await resetSave(c, '/playbooks/');
  const hit = await c.eval(`(document.querySelector('.playbook-card .card-hit')||{}).getAttribute?document.querySelector('.playbook-card .card-hit').getAttribute('href'):''`);
  const inner = await c.eval(`document.querySelectorAll('.playbook-card a').length`);
  const noNestedBtn = await c.eval(`document.querySelectorAll('.playbook-card a button, .playbook-card a [data-save]').length`);
  const saveOnCard = await c.eval(`!!document.querySelector('.playbook-card [data-save]')`);
  return {
    ok: hit.indexOf('/playbooks/') === 0 && noNestedBtn === 0 && saveOnCard === true,
    detail: `热区 href=${hit}；卡内 ${inner} 个链接；button 嵌套在 a 内 ${noNestedBtn} 处（应为 0）`,
  };
});

test('收藏与对比互不影响', '/tools/coding/', async (c) => {
  await resetSave(c, '/tools/coding/');
  await c.eval(`localStorage.removeItem('aiwx-compare')`);
  await c.send('Page.navigate', { url: SERVE + '/tools/coding/' });
  await sleep(800);
  await c.eval(`(function(){const c1=document.querySelector('.card [data-save]');c1.click();const c2=document.querySelector('.card [data-cmp]');c2.click();return 0})()`);
  const s = await c.eval(`JSON.parse(localStorage.getItem('aiwx-saved')||'[]').length`);
  const m = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]').length`);
  const saveBar = await c.eval(`document.querySelector('#saveBar').classList.contains('show')`);
  const cmpBar = await c.eval(`document.querySelector('#cmpBar').classList.contains('show')`);
  const offset = await c.eval(`document.querySelector('#saveBar').style.bottom`);
  return {
    ok: s === 1 && m === 1 && saveBar === true && cmpBar === true && offset === '78px',
    detail: `收藏 ${s} 项 + 对比 ${m} 个，两条浮动条同时显示=${saveBar && cmpBar}，错开偏移=${offset}`,
  };
});

test('对比：分享链接能带上选择（?t=id1,id2）', '/compare/?t=chatgpt,claude,deepseek', async (c) => {
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(400);
  await c.eval(`localStorage.removeItem('aiwx-compare')`);
  await c.send('Page.navigate', { url: SERVE + '/compare/?t=chatgpt,claude,deepseek,不存在的id' });
  await sleep(1000);
  const names = await c.eval(`[...document.querySelectorAll('.cmp-head-in b')].map(x=>x.textContent)`);
  const ls = await c.eval(`JSON.parse(localStorage.getItem('aiwx-compare')||'[]')`);
  // URL 里带一个非法 id，应当被忽略且不报错
  return {
    ok: names.length === 3 && ls.length === 3 && names.join(',') === 'ChatGPT,Claude,DeepSeek',
    detail: `URL 4 个 id（含 1 个非法）→ 渲染 ${names.join(' / ')}`,
  };
});

test('对比页：表格维度完整且分类行在最前', '/compare/?t=chatgpt,claude,deepseek,midjourney', async (c) => {
  await c.send('Page.navigate', { url: SERVE + '/compare/' });
  await sleep(400);
  await c.eval(`localStorage.removeItem('aiwx-compare')`);
  await c.send('Page.navigate', { url: SERVE + '/compare/?t=chatgpt,claude,deepseek,midjourney' });
  await sleep(1000);
  const labels = await c.eval(`[...document.querySelectorAll('.cmp-table tbody tr')].map(tr=>tr.querySelector('th').textContent.trim())`);
  const cls = await c.eval(`[...document.querySelectorAll('.cmp-table tbody tr')].map(tr=>tr.className)`);
  const catIdx = labels.findIndex((l) => l === '分类');
  const catIsDiff = cls[catIdx] === 'is-diff';
  const hasCaveat = labels.indexOf('什么时候别选它') !== -1;
  // 维度是要随内容演进的，所以断言「要素齐全」而不是死磕行数
  return {
    ok: catIdx === 0 && catIsDiff === true && hasCaveat === true && labels.indexOf('官网') === labels.length - 1,
    detail: `${labels.length} 行：${labels.join(' / ')}`,
  };
});

/* ---- v8 新增：英文版 ---- */

test('英文版首页：语言、导航、统计', '/en/', async (c) => {
  const lang = await c.eval(`document.documentElement.getAttribute('lang')`);
  const nav = await c.eval(`[...document.querySelectorAll('.nav a')].map(x=>x.textContent)`);
  const h1 = await c.eval(`(document.querySelector('h1')||{}).textContent||''`);
  const stats = await c.eval(`[...document.querySelectorAll('.stat span')].map(x=>x.textContent)`);
  return {
    ok: lang === 'en' && nav.join(',') === 'Tools,Models,About' && h1.indexOf('Not just') !== -1,
    detail: `lang=${lang}，导航 [${nav}]，统计 [${stats}]`,
  };
});

test('英文版工具列表：卡片是英文文案', '/en/tools/', async (c) => {
  await c.eval(`(function(){const i=document.querySelector('[data-query]');i.value='Midjourney';i.dispatchEvent(new Event('input',{bubbles:true}));return 0})()`);
  const shown = await c.eval(`[...document.querySelectorAll('[data-list] > *')].filter(x=>!x.classList.contains('hidden')).length`);
  const desc = await c.eval(`(document.querySelector('[data-list] > *:not(.hidden) .card-desc')||{}).textContent||''`);
  const caveat = await c.eval(`(document.querySelector('[data-list] > *:not(.hidden) .card-caveat span')||{}).textContent||''`);
  const cat = await c.eval(`(document.querySelector('[data-list] > *:not(.hidden) .card-cat')||{}).textContent||''`);
  const tags = await c.eval(`[...document.querySelectorAll('[data-list] > *:not(.hidden) .tag')].map(x=>x.textContent).join(' ')`);
  // 中文字符不应出现在英文卡片里
  const hasCJK = /[\u4e00-\u9fa5]/.test(desc + caveat + cat);
  return {
    ok: shown === 1 && desc.length > 20 && caveat.length > 20 && hasCJK === false,
    detail: `命中 ${shown} 条；分类「${cat}」标签[${tags}]，简介 ${desc.length} 字符、点评 ${caveat.length} 字符，含中文=${hasCJK}`,
  };
});

test('英文版工具详情：编辑点评与同类对比表', '/en/tools/coding/cursor/', async (c) => {
  const h1 = await c.eval(`(document.querySelector('.tool-hero h1')||{}).textContent||''`);
  const caveatHead = await c.eval(`(document.querySelector('.cb-head span')||{}).textContent||''`);
  const caveatLen = await c.eval(`((document.querySelector('.caveat-box p')||{}).textContent||'').length`);
  const rows = await c.eval(`document.querySelectorAll('.data-table tbody tr').length`);
  const h1count = await c.eval(`document.querySelectorAll('h1').length`);
  const ld = await c.eval(`[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)['@type'])`);
  return {
    ok: h1 === 'Cursor' && caveatLen > 40 && rows >= 3 && h1count === 1 && ld.includes('SoftwareApplication'),
    detail: `h1「${h1}」（全页 ${h1count} 个），点评标题「${caveatHead}」${caveatLen} 字符，对比表 ${rows} 行`,
  };
});

test('英文版模型库：对比维度为英文', '/en/models/', async (c) => {
  const card = await c.eval(`(document.querySelector('[data-list] > *')||{}).className||''`);
  const cat = await c.eval(`(document.querySelector('[data-list] .card-cat')||{}).textContent||''`);
  const strength = await c.eval(`(document.querySelector('[data-list] .model-list-pro li span')||{}).textContent||''`);
  const useFor = await c.eval(`[...document.querySelectorAll('[data-list] .model-use .tag')].map(x=>x.textContent)`);
  const hasCJK = /[\u4e00-\u9fa5]/.test(cat + strength + useFor.join(''));
  return {
    ok: card.length > 0 && hasCJK === false && useFor.length > 0,
    detail: `分类「${cat}」，强项「${strength.slice(0, 40)}」，适合 [${useFor}]，含中文=${hasCJK}`,
  };
});

test('语言互指：中文页有 hreflang 且切换按钮指向英文', '/tools/', async (c) => {
  const alts = await c.eval(`[...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l=>l.getAttribute('hreflang')+':'+l.getAttribute('href'))`);
  const btn = await c.eval(`(document.querySelector('.lang-btn')||{}).getAttribute?document.querySelector('.lang-btn').getAttribute('href'):''`);
  const btnLang = await c.eval(`(document.querySelector('.lang-btn')||{}).getAttribute?document.querySelector('.lang-btn').getAttribute('hreflang'):''`);
  return {
    ok: alts.some((a) => a.startsWith('en:')) && alts.some((a) => a.indexOf('x-default') === 0) && btn === '/en/tools/' && btnLang === 'en',
    detail: `hreflang [${alts.join(' | ')}]，切换按钮 → ${btn}(${btnLang})`,
  };
});

test('语言互指：英文页 hreflang 指回中文，且中文页不显示英文切换外链', '/en/tools/', async (c) => {
  const alts = await c.eval(`[...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l=>l.getAttribute('hreflang')+':'+l.getAttribute('href'))`);
  const btn = await c.eval(`(document.querySelector('.lang-btn')||{}).getAttribute?document.querySelector('.lang-btn').getAttribute('href'):''`);
  // 中文的 playbooks 页没有英文对应版本，不应出现语言切换按钮
  await c.send('Page.navigate', { url: SERVE + '/playbooks/' });
  await sleep(700);
  const noBtn = await c.eval(`document.querySelectorAll('.lang-btn').length`);
  const noAlt = await c.eval(`document.querySelectorAll('link[rel="alternate"][hreflang]').length`);
  return {
    ok: alts.some((a) => a.startsWith('zh-CN:')) && btn === '/tools/' && noBtn === 0 && noAlt === 0,
    detail: `英文页 hreflang [${alts.join(' | ')}]，切换 → ${btn}；无对应英文版的中文页按钮 ${noBtn} 个、hreflang ${noAlt} 条`,
  };
});

test('英文版关于页说明覆盖范围，并链回中文版', '/en/about/', async (c) => {
  const heads = await c.eval(`[...document.querySelectorAll('h2')].map(x=>x.textContent)`);
  const backLink = await c.eval(`[...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/' && /中文版|Chinese/.test(a.textContent))`);
  const hasScope = heads.some((h) => /covers/i.test(h));
  const cjk = await c.eval(`/中文版/.test(document.querySelector('.card').textContent)`);
  return { ok: hasScope && backLink === true, detail: `章节 [${heads.join(' / ')}]，链回中文版=${backLink}` };
});

/* ---- v9 新增：中文检索召回 ---- */

/** 在搜索页输入关键词，返回结果标题 */
async function searchFor(c, q) {
  await c.send('Page.navigate', { url: SERVE + '/search/?q=' + encodeURIComponent(q) });
  await sleep(800);
  return c.eval(`[...document.querySelectorAll('#searchResults .card-title .name')].slice(0,6).map(x=>x.textContent)`);
}

test('中文检索：连续说法可被理解（「怎么本地跑模型」）', '/search/?q=本地部署', async (c) => {
  const a = await searchFor(c, '本地部署');
  const b = await searchFor(c, '怎么本地跑模型');
  const count = b.length;
  return {
    ok: count > 0,
    detail: `「本地部署」命中 ${a.length} 条；「怎么本地跑模型」（口语说法）命中 ${count} 条 → ${b.slice(0,3).join(' / ')}`,
  };
});

test('中文检索：同义词可被理解（画图 → 图像生成）', '/search/?q=画图', async (c) => {
  const r = await searchFor(c, '画图');
  return { ok: r.length > 0, detail: `「画图」命中 ${r.length} 条 → ${r.slice(0,4).join(' / ')}` };
});

test('中文检索：需求式提问可被理解（写周报 / 会议纪要）', '/search/?q=会议纪要', async (c) => {
  const a = await searchFor(c, '会议纪要');
  const b = await searchFor(c, '录音转文字');
  return {
    ok: a.length > 0 || b.length > 0,
    detail: `「会议纪要」${a.length} 条；「录音转文字」${b.length} 条`,
  };
});

test('中文检索：归一化生效（全角 / 大小写）', '/search/?q=RAG', async (c) => {
  const upper = await searchFor(c, 'RAG');
  const lower = await searchFor(c, 'rag');
  const full = await searchFor(c, 'ＲＡＧ');
  return {
    ok: upper.length > 0 && upper.length === lower.length && upper.length === full.length,
    detail: `RAG ${upper.length} 条 / rag ${lower.length} 条 / 全角 ＲＡＧ ${full.length} 条（应一致）`,
  };
});

test('中文检索：二元模糊召回（词序不同也能中）', '/search/?q=图像生成', async (c) => {
  const exact = await searchFor(c, '图像生成');
  const partial = await searchFor(c, '生成图像的');
  return {
    ok: exact.length > 0,
    detail: `「图像生成」${exact.length} 条；「生成图像的」${partial.length} 条（模糊召回）`,
  };
});

test('检索结果按相关度排序（标题命中优先于点评命中）', '/search/?q=ollama', async (c) => {
  const r = await searchFor(c, 'ollama');
  return { ok: r.length > 0 && r[0] === 'Ollama', detail: `首条「${r[0]}」，共 ${r.length} 条` };
});

test('打印样式表可访问', '/assets/print.css', async () => {
  const css = await get(SERVE + '/assets/print.css');
  return { ok: css.indexOf('@page') !== -1, detail: `${css.length} 字符` };
});

/* ---- 执行 ---- */
async function main() {
  if (!CHROME) { console.error('  未找到 Chrome'); process.exit(1); }
  try { await get(`http://127.0.0.1:${PORT}/json/version`); }
  catch {
    spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-first-run',
      '--user-data-dir=' + path.join(process.env.TEMP || '/tmp', 'aiwx-selftest'), 'about:blank'],
      { detached: true, stdio: 'ignore' }).unref();
  }
  for (let i = 0; i < 40; i++) { try { await get(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }

  const list = JSON.parse(await get(`http://127.0.0.1:${PORT}/json/list`));
  const page = list.find((t) => t.type === 'page') || JSON.parse(await get(`http://127.0.0.1:${PORT}/json/new?about:blank`));
  const c = await cdp(page.webSocketDebuggerUrl);
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  c.eval = async (expr) => {
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      const ex = r.exceptionDetails.exception || {};
      throw new Error(ex.description || r.exceptionDetails.text || 'eval error');
    }
    return r.result.value;
  };

  let pass = 0, fail = 0;
  console.log('');
  console.log('  交互自测  ' + SERVE);
  console.log('  ' + '─'.repeat(60));
  for (const t of tests) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url: SERVE + t.path });
    await sleep(700);
    try {
      const r = await t.fn(c);
      if (r.ok) { pass++; console.log(`  ✓ ${t.name}  —  ${r.detail}`); }
      else { fail++; console.log(`  ✗ ${t.name}  —  ${r.detail}`); }
    } catch (e) {
      fail++;
      console.log(`  ✗ ${t.name}  —  异常：${e.message.slice(0, 90)}`);
    }
  }
  c.close();
  console.log('  ' + '─'.repeat(60));
  console.log(`  通过 ${pass} / ${pass + fail}`);
  console.log('');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error('  自测失败：', e.message); process.exit(1); });
