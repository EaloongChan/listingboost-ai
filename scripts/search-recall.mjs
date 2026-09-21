/**
 * 搜索召回测试（Chrome DevTools Protocol，零依赖）
 *
 *   node scripts/search-recall.mjs          跑全部用例
 *   node scripts/search-recall.mjs --en     只跑英文
 *   node scripts/search-recall.mjs --dump   每个查询把前 8 条结果打出来（调词表时用）
 *
 * 为什么要驱动真实浏览器而不是在 Node 里重写一遍打分：
 *   重写就等于养第二套逻辑 —— 测试通过不代表线上通过。
 *   这里读的是真实页面 DOM，用的就是站点实际的分词、词表和排序。
 *
 * 用例怎么写：
 *   q      用户真的会这么搜的说法（口语优先，不要照抄站内标题）
 *   expect 期望命中 id 或 detail 路径的子串，取「或」关系——
 *          只要有一个出现在前 N 条就算通过（人工判断用户能否找到答案）
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.RECALL_PORT || 9231);
const SERVE = process.env.RECALL_SERVE || 'http://127.0.0.1:4173';
const TOP_N = 8;
const ONLY = process.argv.includes('--en') ? 'en' : '';
const DUMP = process.argv.includes('--dump');

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  return null;
}

const get = (url) =>
  new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });

/** 极简 CDP 客户端（只用到 Runtime.evaluate / Page.navigate）
    必须连 **页面级** 的 webSocketDebuggerUrl（/json/list 里 type=page 的那条），
    连 /json/version 那条浏览器级的话，Runtime.* 会报 "wasn't found"。
    send 在 CDP 返回 error 时直接 reject——静默吞掉错误会让「全站 ✗」看起来像召回差。 */
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve());
    ws.addEventListener('error', (e) => reject(e));
  });
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(`${msg.error.message} (${msg.error.code})`)) : res(msg.result);
    }
  });
  function send(method, params = {}) {
    const myId = ++id;
    return new Promise((res, rej) => {
      pending.set(myId, { res, rej });
      ws.send(JSON.stringify({ id: myId, method, params }));
    });
  }
  return { ready, send, close: () => ws.close() };
}

async function waitForChrome(tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const list = JSON.parse(await get(`http://127.0.0.1:${PORT}/json/list`));
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Chrome 页面级 target 未就绪');
}

/* ---------------- 用例 ----------------
   写法上刻意用「用户口语」而不是站内词汇，这样才能测出词表的作用。 */
const CASES = [
  // 中文：场景意图
  { q: '怎么写周报', expect: ['pb-weekly-report'] },
  { q: '做PPT', expect: ['pb-ppt-from-zero', 'gamma'] },
  { q: '开会记录整理', expect: ['pb-meeting-minutes', 'tingwu'] },
  { q: '本地跑模型', expect: ['pb-local-model', 'ollama'] },
  { q: '论文读不懂', expect: ['pb-lit-review', 'pb-read-long-doc'] },
  { q: '把文章改成小红书', expect: ['pb-repurpose-content'] },
  { q: '减肥', expect: [] }, // 陷阱用例：不该给出结果也不该崩
  { q: '免费画图的', expect: ['pb-image-gen', 'flux', 'midjourney'] },
  { q: '给视频加字幕', expect: ['pb-video-localize', 'pb-podcast-produce'] },
  { q: 'Excel 表格合并', expect: ['pb-messy-spreadsheets'] },
  { q: '学写代码', expect: ['pb-learn-programming'] },
  // 简历：站内其实没有「写简历」手册（这是内容缺口，不是检索问题），
  // 最接近的答案是模拟面试提示词。断言它出现，等于把这个缺口固化成可观测行为。
  { q: '简历', expect: ['p-interview', 'pb-takeover-codebase'] },
  { q: 'AI 帮我刷题备考', expect: ['pb-exam-prep'] },
  // 中文：工具名/品牌别名
  { q: 'openai 的对话工具', expect: ['chatgpt'] },
  { q: '阿里的模型', expect: ['qwen'] },
  { q: '国产 免费 聊天', expect: ['deepseek', 'qwen-chat', 'doubao'] },
  { q: '语音转文字', expect: ['tingwu', 'whisper'] },
  { q: '扣图', expect: ['removebg'] },
  { q: 'ai 生成视频', expect: ['kling', 'pb-ai-video'] },
  { q: '翻译工具', expect: ['deepl'] },
  // 中文：术语与提示词
  { q: '什么叫 prompt', expect: ['glossary'] },
  { q: 'mcp 是什么', expect: ['glossary'] },
  // 定义类查询要出「答案卡」：断言写法 answer:XXX，测的是卡片本身有没有答对
  { q: '幻觉是什么', expect: ['answer:幻觉'] },
  // 用户输入的是缩写 RAG，答案卡的标题是正式名「检索增强生成」—— 这正是期望的行为
  { q: '什么是 rag', expect: ['answer:检索增强生成'] },
  { q: 'token 是什么意思', expect: ['answer:Token'] },
  // 英文
  { lang: 'en', q: 'run models locally', expect: ['ollama', 'pb-local-model'] },
  { lang: 'en', q: 'meeting notes', expect: ['tingwu', 'pb-meeting-minutes'] },
  { lang: 'en', q: 'free ai chat', expect: ['chatgpt', 'deepseek'] },
  { lang: 'en', q: 'generate images', expect: ['flux', 'midjourney', 'pb-image-gen'] },
  { lang: 'en', q: 'turn long article into social posts', expect: ['pb-repurpose-content'] },
  { lang: 'en', q: 'write weekly report', expect: ['pb-weekly-report'] },
  { lang: 'en', q: 'notes app with ai', expect: ['notion-ai'] },
  { lang: 'en', q: 'what is a token', expect: ['answer:Token'] },
  { lang: 'en', q: 'what is rag', expect: ['answer:Retrieval-Augmented Generation', 'answer:RAG'] },
];

/* 在真实页面上执行一次查询并返回结果 */
const EVAL = (q) => `(function(){
  var el = document.getElementById('globalSearch');
  if (!el) return { error: '找不到输入框' };
  el.value = ${JSON.stringify(q)};
  el.dispatchEvent(new Event('input', { bubbles: true }));
  var list = document.getElementById('searchResults');
  if (!list) return { error: '找不到结果容器' };
  var arts = Array.from(list.querySelectorAll('article'));
  var countEl = document.querySelector('[data-count]') || null;
  /* 答案卡（.answer-card，定义类查询才有）不是 <article>，要单独取。
     断言写法用 "answer:术语名"，这样能明确测到「答案卡出现了且答对了」，
     而不是「这条术语恰好在结果列表里」。 */
  var ac = document.querySelector('.answer-card');
  var answer = null;
  if (ac) {
    var rels = Array.from(ac.querySelectorAll('.answer-rel a')).map(function (a) { return a.getAttribute('href'); });
    answer = {
      term: ((ac.querySelector('.answer-term') || {}).textContent || '').trim(),
      href: (ac.querySelector('a.btn') || {}).getAttribute ? ac.querySelector('a.btn').getAttribute('href') : '',
      rels: rels,
    };
  }
  return {
    count: arts.length,
    countText: countEl ? countEl.textContent.trim() : '',
    answer: answer ? 'answer:' + answer.term + ' :: ' + answer.href + ' :: ' + answer.rels.join(' ') : '',
    items: arts.slice(0, ${TOP_N}).map(function (a) {
      var link = a.querySelector('h3 a');
      return {
        title: (a.querySelector('h3') || {}).textContent || '',
        href: link ? link.getAttribute('href') : '',
      };
    }).map(function (x) { return x.title.trim() + ' :: ' + x.href; })
  };
})()`;

async function run() {
  const chrome = findChrome();
  if (!chrome) { console.error('  ✗ 找不到本机 Chrome'); process.exit(2); }

  const proc = spawn(chrome, [
    '--headless=new', `--remote-debugging-port=${PORT}`, '--no-first-run',
    '--disable-gpu', '--no-default-browser-check',
    // 用系统临时目录：别把 Chrome 的 profile 造在项目里（会变成一个几百 MB 的脏目录）
    '--user-data-dir=' + path.join(os.tmpdir(), 'aiwx-recall-profile'),
    'about:blank',
  ], { stdio: 'ignore', detached: false });

  let failed = 0;
  let passed = 0;
  const failures = [];
  try {
    const wsUrl = await waitForChrome();
    const c = cdp(wsUrl);
    await c.ready;
    await c.send('Runtime.enable');

    for (const lang of ['zh', 'en']) {
      if (ONLY && ONLY !== lang) continue;
      const page = lang === 'en' ? '/en/search/' : '/search/';
      await c.send('Page.enable');
      await c.send('Page.navigate', { url: SERVE + page });
      await new Promise((r) => setTimeout(r, 1200));

      const cases = CASES.filter((x) => (x.lang || 'zh') === lang);
      console.log(`\n  ${lang === 'en' ? '英文搜索页 /en/search/' : '中文搜索页 /search/'}  共 ${cases.length} 例`);
      console.log('  ' + '─'.repeat(66));

      for (const cs of cases) {
        const r = await c.send('Runtime.evaluate', { expression: EVAL(cs.q), returnByValue: true });
        const got = r.result?.value || {};
        if (got.error) { console.log(`  ✗ ${cs.q} → ${got.error}`); failed++; failures.push(cs.q); continue; }

        const hay = (got.items || []).join(' | ') + ' | ' + (got.answer || '');
        let ok;
        if (!cs.expect.length) ok = got.count === 0;          // 陷阱用例：期望零结果
        else ok = cs.expect.some((e) => hay.includes(e));

        if (ok) { passed++; console.log(`  ✓ ${cs.q.padEnd(30)} ${got.count} 条`); }
        else {
          failed++;
          failures.push(cs.q);
          console.log(`  ✗ ${cs.q.padEnd(30)} ${got.count} 条  期望命中其一: ${cs.expect.join(' / ')}`);
          (got.items || []).slice(0, 5).forEach((x) => console.log('        ' + x));
        }
        if (DUMP) (got.items || []).forEach((x) => console.log('        ' + x));
      }
    }
    c.close();
  } finally {
    proc.kill();
  }

  console.log('\n  ' + '─'.repeat(66));
  console.log(`  通过 ${passed} / ${passed + failed}`);
  if (failures.length) console.log('  未通过：' + failures.join('、'));
  console.log('');
  process.exit(failed ? 1 : 0);
}

run().catch((e) => { console.error('  ✗', e.message); process.exit(2); });
