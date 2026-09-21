/**
 * 数据自检
 *   node scripts/check.mjs
 * 检查重复 id、未知分类、缺失字段、URL 格式、可能的占位内容。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '..', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

const errors = [];
const warns = [];
const ok = [];

const cat = read('categories.json');
const toolCats = new Set(cat.toolCategories.map((c) => c.id));
const promptCats = new Set(cat.promptCategories.map((c) => c.id));
const topics = new Set(cat.newsTopics.map((t) => t.id));
const tracks = new Set(cat.learnTracks.map((t) => t.id));

function dupes(arr, label) {
  const seen = new Map();
  for (const x of arr) {
    const k = x.id || x.term;
    if (seen.has(k)) errors.push(`${label}: id 重复 → ${k}`);
    seen.set(k, true);
  }
  if (arr.length) ok.push(`${label}: ${arr.length} 条，id 唯一`);
}

function need(obj, fields, label) {
  for (const f of fields) {
    const v = obj[f];
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) {
      errors.push(`${label}: 缺少字段 ${f}`);
    }
  }
}

function urlCheck(u, label) {
  if (!u) return;
  if (!/^https?:\/\/.+/.test(u)) errors.push(`${label}: URL 格式可疑 → ${u}`);
}

/* ---- tools ---- */
const tools = read('tools.json');
dupes(tools, 'tools');
const PRICING = new Set(['free', 'freemium', 'paid', 'open']);
for (const t of tools) {
  const L = `tools/${t.id}`;
  need(t, ['id', 'name', 'url', 'cat', 'desc', 'pricing'], L);
  urlCheck(t.url, L);
  if (t.cat && !toolCats.has(t.cat)) errors.push(`${L}: 未知分类 ${t.cat}`);
  if (t.pricing && !PRICING.has(t.pricing)) errors.push(`${L}: 未知价格模式 ${t.pricing}`);
  if (t.desc && t.desc.length > 70) warns.push(`${L}: 描述偏长（${t.desc.length} 字），首页卡片可能截断`);
}

/* ---- prompts ---- */
const prompts = read('prompts.json');
dupes(prompts, 'prompts');
for (const p of prompts) {
  const L = `prompts/${p.id}`;
  need(p, ['id', 'title', 'cat', 'desc', 'prompt'], L);
  if (p.cat && !promptCats.has(p.cat)) errors.push(`${L}: 未知分类 ${p.cat}`);
  if (p.prompt && !/\{\{[^}]+\}\}/.test(p.prompt) && (p.vars || []).length) {
    warns.push(`${L}: 声明了变量但没有在正文里出现 {{变量}}`);
  }
}

/* ---- news ---- */
const news = read('news.json');
dupes(news.items, 'news.items');
for (const n of news.items) {
  const L = `news/${n.id}`;
  need(n, ['id', 'title', 'topic', 'date', 'summary', 'body'], L);
  if (n.topic && !topics.has(n.topic)) errors.push(`${L}: 未知主题 ${n.topic}`);
  if (n.date && !/^\d{4}-\d{2}(-\d{2})?$/.test(n.date)) errors.push(`${L}: 日期格式应为 YYYY-MM-DD`);
}
if (!news.sources?.length) errors.push('news: sources 为空');
else ok.push(`news: ${news.items.length} 篇解读 + ${news.sources.length} 个信息源 + ${news.milestones.length} 个里程碑`);

/* ---- learn ---- */
const learn = read('learn.json');
dupes(learn, 'learn');
for (const l of learn) {
  const L = `learn/${l.id}`;
  need(l, ['id', 'title', 'track', 'url', 'desc', 'type'], L);
  urlCheck(l.url, L);
  if (l.track && !tracks.has(l.track)) errors.push(`${L}: 未知学习路径 ${l.track}`);
}

/* ---- glossary ---- */
const glossary = read('glossary.json');
{
  const seen = new Map();
  for (const g of glossary) {
    if (seen.has(g.term)) errors.push(`glossary: 术语重复 → ${g.term}`);
    seen.set(g.term, true);
    need(g, ['term', 'cat', 'def'], `glossary/${g.term}`);
  }
  ok.push(`glossary: ${glossary.length} 条术语，term 唯一`);
}

/* ---- 编辑点评覆盖率 ----
   caveat（什么时候别选它）是本站相对普通工具导航的核心差异，属于「编辑价值」而非元数据。
   新加工具时不要漏，这里会点名。 */
{
  const missing = tools.filter((t) => !t.caveat || t.caveat.length < 12);
  if (missing.length) {
    warns.push(`tools: ${missing.length} 个工具缺少编辑点评 caveat → ${missing.map((t) => t.name).slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''}`);
  } else {
    const lens = tools.map((t) => t.caveat.length);
    ok.push(`tools: ${tools.length} 个工具全部有编辑点评（平均 ${Math.round(lens.reduce((a, b) => a + b, 0) / lens.length)} 字）`);
  }
  const generic = tools.filter((t) => t.caveat && /^(注意|暂无|待补充)/.test(t.caveat));
  if (generic.length) warns.push(`tools: ${generic.length} 个工具的点评像是占位内容`);
}

/* ---- playbooks / models（v3 新模块） ---- */
const toolIds = new Set(tools.map((t) => t.id));
const promptIds = new Set(prompts.map((p) => p.id));
const playbookIds = new Set();

{
  const fp = path.join(DATA, 'playbooks.json');
  if (!fs.existsSync(fp)) {
    errors.push('playbooks.json 不存在');
  } else {
    const pb = read('playbooks.json');
    const groups = new Set((pb.groups || []).map((g) => g.id));
    if (!pb.groups?.length) errors.push('playbooks: groups 为空');
    if (!pb.items?.length) errors.push('playbooks: items 为空');

    const seen = new Set();
    for (const it of pb.items) {
      const L = `playbooks/${it.id}`;
      if (seen.has(it.id)) errors.push(`${L}: id 重复`);
      seen.add(it.id);
      playbookIds.add(it.id);
      need(it, ['id', 'title', 'group', 'problem', 'time'], L);
      if (it.group && !groups.has(it.group)) errors.push(`${L}: 未知分组 ${it.group}`);
      if (!Array.isArray(it.steps) || it.steps.length < 2) errors.push(`${L}: steps 至少要有 2 步`);

      // 交叉引用校验：引用了不存在的工具/提示词是这类数据最容易出的错
      const checkRefs = (ids, kind, where) => {
        for (const id of ids || []) {
          const pool = kind === '工具' ? toolIds : promptIds;
          if (!pool.has(id)) errors.push(`${L}${where}: 引用了不存在的${kind} → ${id}`);
        }
      };
      checkRefs(it.tools, '工具', '');
      checkRefs(it.prompts, '提示词', '');
      (it.steps || []).forEach((s, i) => {
        checkRefs(s.tools, '工具', ` 第${i + 1}步`);
        checkRefs(s.prompts, '提示词', ` 第${i + 1}步`);
      });
      if (!(it.warnings || []).length) warns.push(`${L}: 没有注意事项，场景手册的价值一半在「避坑」`);
    }
    const gCount = new Set(pb.items.map((x) => x.group));
    if (gCount.size !== groups.size) {
      const used = new Set(pb.items.map((x) => x.group));
      const empty = [...groups].filter((g) => !used.has(g));
      if (empty.length) warns.push(`playbooks: 分组 ${empty.join(',')} 下没有任何场景`);
    }
    ok.push(`playbooks: ${pb.items.length} 个场景 / ${groups.size} 个分组，交叉引用全部有效`);
  }
}

{
  const fp = path.join(DATA, 'models.json');
  if (!fs.existsSync(fp)) {
    errors.push('models.json 不存在');
  } else {
    const mm = read('models.json');
    const kinds = new Set((mm.kinds || []).map((k) => k.id));
    const tiers = new Set(Object.keys(mm.tiers || {}));
    if (!kinds.size) errors.push('models: kinds 为空');
    const seen = new Set();
    for (const m of mm.items) {
      const L = `models/${m.id}`;
      if (seen.has(m.id)) errors.push(`${L}: id 重复`);
      seen.add(m.id);
      need(m, ['id', 'name', 'vendor', 'kind', 'tier', 'strengths', 'useFor', 'url'], L);
      if (m.kind && !kinds.has(m.kind)) errors.push(`${L}: 未知类型 ${m.kind}`);
      if (m.tier && !tiers.has(m.tier)) errors.push(`${L}: 未知档位 ${m.tier}`);
      urlCheck(m.url, L);
      if (!(m.cautions || []).length) warns.push(`${L}: 没有写注意事项`);
    }
    ok.push(`models: ${mm.items.length} 个模型家族 / ${kinds.size} 个类型`);
  }
}

/* ---- Windows 批处理健康检查 ----
   .bat 有三个隐形杀手，任何一个都会让用户双击后看到一堆乱码报错：
     1. 含非 ASCII 字节 → cmd 用系统 OEM 代码页(GBK)解析，乱码会被当命令执行
     2. 有 UTF-8 BOM   → 首行变成 "\xEF\xBB\xBF@echo off"，直接报错
     3. 只有 LF 换行    → goto :LABEL 跳转可能失效（cmd 按字节扫描标签）
   保持纯 ASCII + 无 BOM + CRLF 才安全。 */
{
  const root = path.resolve(__dirname, '..');
  const bats = fs.readdirSync(root).filter((f) => f.toLowerCase().endsWith('.bat'));
  for (const f of bats) {
    const buf = fs.readFileSync(path.join(root, f));
    const s = buf.toString('latin1');
    const bad = [];
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) bad.push('有 UTF-8 BOM');
    const nonAscii = [...buf].filter((x) => x > 127).length;
    if (nonAscii) bad.push(`含 ${nonAscii} 个非 ASCII 字节（cmd 会解析成乱码）`);
    const bareLf = (s.match(/(?<!\r)\n/g) || []).length;
    if (bareLf) bad.push(`有 ${bareLf} 处裸 LF 换行（应为 CRLF）`);
    if (bad.length) errors.push(`${f}: ${bad.join('；')}`);
    else ok.push(`${f}: 纯 ASCII + 无 BOM + CRLF，可安全双击`);
  }
  if (!bats.length) warns.push('没有找到任何 .bat 启动脚本');
}

/* ---- 分类 id 撞车守卫 ----
   工具分类与提示词分类是两套独立的分类体系，但共用同一批 id 命名空间。
   历史上踩过坑：合并成一个 map 时提示词分类会覆盖工具分类，
   导致工具卡显示错误分类名（写作办公 → 写作文案）、配色被换、选型提示丢失。
   下面这条检查会在「撞车且内容不一致」时直接报错。 */
{
  const tm = new Map(cat.toolCategories.map((c) => [c.id, c]));
  const pm = new Map(cat.promptCategories.map((c) => [c.id, c]));
  const collisions = [...tm.keys()].filter((id) => pm.has(id));
  const risky = collisions.filter((id) => {
    const a = tm.get(id), b = pm.get(id);
    return a.name !== b.name || a.accent !== b.accent;
  });
  if (risky.length) {
    // 这是已知且已处理的情况（build.mjs 用 toolCatMap / promptCatMap 分开映射），
    // 所以只提醒不报错。但如果有人把它们合并回一个 map，selftest 的
    // 「工具详情页：分类选型提示不为空」用例会失败。
    warns.push(
      `categories: ${risky.join(', ')} 在两套分类里同名不同值 —— ` +
      '必须分别映射（toolCatMap / promptCatMap），不可合并为一个 map',
    );
    ok.push(`categories: 两套分类 id 撞车已隔离处理（${collisions.join(', ')}）`);
  } else if (collisions.length) {
    ok.push(`categories: ${collisions.length} 个 id 在两套分类中重复但内容一致（${collisions.join(', ')}）`);
  } else {
    ok.push('categories: 两套分类 id 无冲突');
  }
}

/* ---- 实时动态数据（feed.json + feeds.json） ---- */
{
  const fp = path.join(DATA, 'feeds.json');
  const fdp = path.join(DATA, 'feed.json');

  if (!fs.existsSync(fp)) {
    errors.push('feeds.json 不存在');
  } else {
    const fc = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const enabled = fc.sources.filter((s) => s.enabled !== false);
    const seen = new Set();
    for (const s of fc.sources) {
      const L = `feeds/${s.id}`;
      if (!s.id) { errors.push('feeds: 有源缺少 id'); continue; }
      if (seen.has(s.id)) errors.push(`${L}: id 重复`);
      seen.add(s.id);
      need(s, ['id', 'name', 'url', 'lang', 'topic'], L);
      urlCheck(s.url, L);
      if (s.topic && !topics.has(s.topic)) errors.push(`${L}: 未知主题 ${s.topic}`);
      if (s.enabled === false && !s.note) warns.push(`${L}: 已禁用但没有写 note 说明原因`);
    }
    ok.push(`feeds: ${enabled.length} 个启用源 / ${fc.sources.length} 个配置（${fc.sources.filter((s) => s.enabled === false).length} 个已禁用）`);
    if (enabled.length < 8) warns.push(`feeds: 启用的源只剩 ${enabled.length} 个，实时动态会显得很单薄`);
  }

  if (!fs.existsSync(fdp)) {
    warns.push('feed.json 不存在 —— 实时动态区块不会生成（跑 node scripts/fetch-news.mjs 即可）');
  } else {
    const fd = JSON.parse(fs.readFileSync(fdp, 'utf8'));
    if (!fd.items?.length) {
      errors.push('feed.json: items 为空');
    } else {
      const badLink = fd.items.filter((it) => !/^https?:\/\//.test(it.link || '')).length;
      const badTitle = fd.items.filter((it) => !it.title || it.title.length < 4).length;
      // 只看真正的 HTML 标签，别把 ">100x faster" 这类正常数学符号算进去
      const TAG = /<\/?[a-zA-Z][^>]*>/;
      const withHtml = fd.items.filter((it) => TAG.test(it.title || '') || TAG.test(it.summary || '')).length;
      if (badLink) errors.push(`feed.json: ${badLink} 条链接不合法`);
      if (badTitle) errors.push(`feed.json: ${badTitle} 条标题过短或缺失`);
      if (withHtml) warns.push(`feed.json: ${withHtml} 条内容里残留 HTML 标签（解析器可能没洗干净）`);

      const ageH = (Date.now() - new Date(fd.updatedAt).getTime()) / 3600000;
      const okSources = (fd.sources || []).filter((s) => s.ok).length;
      if (ageH > 72) warns.push(`feed.json: 数据已过期 ${Math.round(ageH)} 小时，建议跑一次 fetch-news`);
      const failed = (fd.sources || []).filter((s) => !s.ok);
      if (failed.length) warns.push(`feed.json: ${failed.length} 个源上次抓取失败（${failed.map((s) => s.name).join(', ')}）`);
      ok.push(`feed.json: ${fd.items.length} 条动态 / ${okSources} 个源成功 / 数据龄 ${ageH < 1 ? '<1' : Math.round(ageH)} 小时`);
    }
  }
}

/* ---- 脚本语法预检 ----
   改脚本时最容易犯的错是括号/数组没闭合，而这类错误要等到真的跑起来才暴露。
   这里用 node --check 静态扫一遍，毫秒级，能在构建之前拦住。
   （真实案例：编辑 CHANGELOG 时旧条目残留在了数组闭合之后，构建直接 SyntaxError。） */
{
  const root = path.resolve(__dirname, '..');
  const files = [];
  const collect = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) collect(full);
      else if (e.name.endsWith('.mjs') || e.name.endsWith('.js')) files.push(full);
    }
  };
  collect(path.join(root, 'scripts'));
  collect(path.join(root, 'src'));

  const bad = [];
  for (const f of files) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) {
      const msg = (r.stderr || '').split('\n').find((l) => /SyntaxError|Error/.test(l)) || '语法错误';
      bad.push(`${path.relative(root, f).replace(/\\/g, '/')}: ${msg.trim()}`);
    }
  }
  if (bad.length) bad.forEach((b) => errors.push(`语法 ${b}`));
  else ok.push(`脚本语法: ${files.length} 个文件全部通过 node --check`);
}


    /* 模型条的完整度：时效标注 + 官方模型列表链接。
       这两个字段是「读者能不能自己核对时效」的关键，不能漏。 */
    const noLatest = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA,'models.json'),'utf8')).items.filter(x=>!x.latest||!x.latest.asOf); } catch { return []; } })();
    const noListUrl = (() => { try { return JSON.parse(fs.readFileSync(path.join(DATA,'models.json'),'utf8')).items.filter(x=>!x.modelsUrl); } catch { return []; } })();
    if (noLatest.length) errors.push(`models: ${noLatest.length} 个模型缺时效标注（latest.asOf）→ ${noLatest.map(x=>x.id).join(', ')}`);
    if (noListUrl.length) errors.push(`models: ${noListUrl.length} 个模型缺官方模型列表链接（modelsUrl）→ ${noListUrl.map(x=>x.id).join(', ')}`);

/* ---- 英文版覆盖率 ----
   英文版范围刻意收窄到工具库 + 模型库，所以这里只校验这两块。
   新增工具/模型时如果漏了英文，英文版会出现中英混杂的卡片。 */
{
  const ip = path.join(DATA, 'i18n.json');
  if (!fs.existsSync(ip)) {
    warns.push('i18n.json 不存在，英文版无法生成');
  } else {
    const i18n = JSON.parse(fs.readFileSync(ip, 'utf8'));
    const en = i18n.en || {};

    // 分类名 / 类型名 / 档位名是否齐全
    const missCat = cat.toolCategories.filter((c) => !en[`cat.${c.id}`]).map((c) => c.id);
    const missKind = (() => {
      try {
        const mm = JSON.parse(fs.readFileSync(path.join(DATA, 'models.json'), 'utf8'));
        return mm.kinds.filter((k) => !en[`kind.${k.id}`]).map((k) => k.id);
      } catch { return []; }
    })();
    const missTier = (() => {
      try {
        const mm = JSON.parse(fs.readFileSync(path.join(DATA, 'models.json'), 'utf8'));
        return Object.keys(mm.tiers || {}).filter((k) => !en[`tier.${k}`]);
      } catch { return []; }
    })();
    if (missCat.length) warns.push(`i18n: 分类缺英文名 → ${missCat.join(', ')}`);
    if (missKind.length) warns.push(`i18n: 模型类型缺英文名 → ${missKind.join(', ')}`);
    if (missTier.length) warns.push(`i18n: 模型档位缺英文名 → ${missTier.join(', ')}`);

    // 工具 / 模型的英文内容
    const missTool = tools.filter((t) => !t.descEn || !t.caveatEn).map((t) => t.id);
    if (missTool.length) {
      warns.push(`tools: ${missTool.length} 个工具缺英文 descEn/caveatEn → ${missTool.slice(0, 6).join(', ')}${missTool.length > 6 ? ' …' : ''}`);
    }
    let missModel = [];
    try {
      const mm = JSON.parse(fs.readFileSync(path.join(DATA, 'models.json'), 'utf8'));
      missModel = mm.items.filter((m) => !m.strengthsEn || !m.useForEn).map((m) => m.id);
    } catch { /* 已在别处报错 */ }
    if (missModel.length) warns.push(`models: ${missModel.length} 个模型缺英文内容 → ${missModel.join(', ')}`);

    if (!missTool.length && !missModel.length && !missCat.length) {
      ok.push(`英文版: ${cat.toolCategories.length} 个分类 + ${tools.length} 个工具 + ${(() => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'models.json'), 'utf8')).items.length; } catch { return 0; } })()} 个模型的英文内容齐全`);
    }
  }
}

/* ---- vercel.json 字段白名单校验 ----
   踩过一次：在 redirects 里写了个 `comment` 字段（本意是留说明），
   Vercel 校验很严，不认识这个字段就直接拒绝部署 —— 而且部署失败后
   线上继续服务上一次成功的版本，从页面上完全看不出来，白推了两轮。
   所以这里在本地就把不认识的字段拦下来。 */
{
  const vp = path.join(__dirname, '..', 'vercel.json');
  if (!fs.existsSync(vp)) {
    warns.push('vercel.json 不存在，Vercel 会按框架特征自行构建');
  } else {
    const TOP = new Set(['$schema', 'buildCommand', 'devCommand', 'installCommand', 'outputDirectory',
      'framework', 'regions', 'functions', 'redirects', 'rewrites', 'cleanUrls', 'trailingSlash',
      'headers', 'crons', 'git', 'ignoreCommand', 'public', 'images', 'routes', 'builds', 'github']);
    const REDIRECT = new Set(['source', 'destination', 'permanent', 'statusCode', 'has', 'missing', 'caseSensitive', 'preserveQueryParams']);
    const HEADER = new Set(['source', 'headers', 'has', 'missing']);
    const HEADER_ITEM = new Set(['key', 'value']);
    const COND = new Set(['type', 'key', 'value']);

    const bad = [];
    const checkKeys = (obj, allowed, where) => {
      for (const k of Object.keys(obj || {})) {
        if (!allowed.has(k)) bad.push(`${where} 里的未知字段「${k}」（Vercel 会因此拒绝部署）`);
      }
    };

    try {
      const v = JSON.parse(fs.readFileSync(vp, 'utf8'));
      checkKeys(v, TOP, 'vercel.json');
      (v.redirects || []).forEach((r, i) => {
        checkKeys(r, REDIRECT, `redirects[${i}]`);
        (r.has || []).forEach((h, j) => checkKeys(h, COND, `redirects[${i}].has[${j}]`));
        (r.missing || []).forEach((h, j) => checkKeys(h, COND, `redirects[${i}].missing[${j}]`));
      });
      (v.headers || []).forEach((h, i) => {
        checkKeys(h, HEADER, `headers[${i}]`);
        (h.headers || []).forEach((x, j) => checkKeys(x, HEADER_ITEM, `headers[${i}].headers[${j}]`));
      });
      // framework 为 null 时必须是显式 null（写成 "" 会让 Vercel 按空字符串处理）
      if ('framework' in v && v.framework !== null && typeof v.framework !== 'string') {
        bad.push('vercel.json: framework 只能是字符串或 null');
      }
    } catch (e) {
      bad.push(`vercel.json 不是合法 JSON：${e.message}`);
    }

    if (bad.length) bad.forEach((b) => errors.push(b));
    else ok.push('vercel.json: 字段全部在 Vercel 白名单内');
  }
}

/* ---- 输出 ---- */
const line = '─'.repeat(52);
console.log('');
console.log('  AI 万象 · 数据自检');
console.log('  ' + line);
for (const s of ok) console.log('  ✓ ' + s);
if (warns.length) {
  console.log('');
  for (const w of warns) console.log('  ! ' + w);
}
if (errors.length) {
  console.log('');
  for (const e of errors) console.log('  ✗ ' + e);
  console.log('  ' + line);
  console.log(`  发现 ${errors.length} 个错误，${warns.length} 个提醒`);
  console.log('');
  process.exit(1);
}
console.log('  ' + line);
console.log(`  通过（${warns.length} 个提醒）`);
console.log('');
