/**
 * 生成图片类静态资源（用本机 Chrome 渲染，零依赖）
 *
 *   node scripts/assets.mjs
 *
 * 产出：
 *   public/og.png                 1200×630 社交分享图
 *   public/apple-touch-icon.png   180×180  iOS 主屏图标
 *
 * 设计走的是站内同一套视觉（Swiss 网格 + 硬边框 + 等宽标签），
 * 所以分享到社交平台时是一眼能认出来的同一套东西。
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');
const PORT = Number(process.env.ASSETS_PORT || 9224);

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => fs.existsSync(p));

const get = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d)); }).on('error', rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'site.config.json'), 'utf8'));
const count = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')).length;
const N = {
  tools: count('tools.json'),
  prompts: count('prompts.json'),
  glossary: count('glossary.json'),
  learn: count('learn.json'),
};

const FONTS = fs.existsSync(path.join(OUT, 'fonts'))
  ? fs.readdirSync(path.join(OUT, 'fonts'))
      .filter((f) => f.endsWith('.woff2'))
      .map((f) => {
        const m = f.match(/ibm-plex-(\w+)-latin-(\d+)-normal/);
        return `@font-face{font-family:'Plex ${m[1][0].toUpperCase() + m[1].slice(1)}';src:url('data:font/woff2;base64,${fs.readFileSync(path.join(OUT, 'fonts', f)).toString('base64')}') format('woff2');font-weight:${m[2]};}`;
      })
      .join('\n')
  : '';

/* 1200×630 社交分享图 */
const ogHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#f3f1ea;color:#0e0e0c;
  font-family:'Plex Sans',system-ui,sans-serif;
  background-image:linear-gradient(rgba(14,14,12,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(14,14,12,.055) 1px,transparent 1px);
  background-size:40px 40px;position:relative}
.mono{font-family:'Plex Mono',monospace}
.frame{position:absolute;inset:36px;border:1.5px solid #0e0e0c;display:flex;flex-direction:column;padding:44px 48px}
.top{display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:14px}
.mark{width:52px;height:52px;background:#ff3b00;border:1.5px solid #0e0e0c;display:grid;place-items:center;color:#fff;font-family:'Plex Mono',monospace;font-size:30px;font-weight:600}
.brand{font-size:26px;font-weight:700;letter-spacing:-.03em;line-height:1.05}
.brand small{display:block;font-family:'Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.24em;color:#78776d}
.kicker{font-family:'Plex Mono',monospace;font-size:12px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;background:#ff3b00;color:#fff;border:1.5px solid #0e0e0c;padding:6px 12px}
h1{margin-top:auto;font-size:78px;font-weight:700;letter-spacing:-.05em;line-height:1.02}
h1 .hl{color:transparent;-webkit-text-stroke:3px #ff3b00}
h1 .u{background:linear-gradient(to top,#ff3b00 0 .13em,transparent .13em)}
.sub{margin-top:20px;font-size:21px;color:#3f3f39;max-width:820px;line-height:1.5}
.bottom{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;border-top:1.5px solid #0e0e0c;padding-top:20px}
.stats{display:flex;gap:38px}
.stat b{display:block;font-family:'Plex Serif',serif;font-size:36px;font-weight:600;line-height:1;letter-spacing:-.02em}
.stat span{font-family:'Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#78776d}
.domain{font-family:'Plex Mono',monospace;font-size:13px;letter-spacing:.1em;color:#78776d}
</style></head><body>
<div class="frame">
  <div class="top">
    <div class="logo">
      <span class="mark">象</span>
      <span class="brand">${site.brand.name}<small>${site.brand.nameEn}</small></span>
    </div>
    <span class="kicker">AI Directory</span>
  </div>
  <h1>收录 AI 世界的<span class="hl">一切</span><br><span class="u">工具 / 提示词 / 资讯 / 知识</span></h1>
  <p class="sub">${site.brand.description}</p>
  <div class="bottom">
    <div class="stats">
      <div class="stat"><b>${N.tools}</b><span>工具</span></div>
      <div class="stat"><b>${N.prompts}</b><span>提示词</span></div>
      <div class="stat"><b>${N.glossary}</b><span>术语</span></div>
      <div class="stat"><b>${N.learn}</b><span>学习资源</span></div>
    </div>
    <span class="domain">${(site.baseUrl || 'example.com').replace(/^https?:\/\//, '')}</span>
  </div>
</div>
</body></html>`;

/* 180×180 图标 */
const iconHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${FONTS}
*{margin:0;padding:0;box-sizing:border-box}
body{width:180px;height:180px;overflow:hidden}
.wrap{width:180px;height:180px;background:#ff3b00;display:grid;place-items:center;position:relative;
  background-image:linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px);
  background-size:20px 20px}
.t{font-family:'Plex Mono',monospace;font-size:104px;font-weight:600;color:#fff;line-height:1;letter-spacing:-.06em}
</style></head><body><div class="wrap"><span class="t">象</span></div></body></html>`;

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

async function shoot(c, html, w, h, out) {
  const url = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await c.send('Page.navigate', { url });
  await sleep(1400); // 等字体解码
  const cap = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(out, Buffer.from(cap.data, 'base64'));
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`  ✓ ${path.relative(ROOT, out).replace(/\\/g, '/')}  ${w}×${h}  ${kb} KB`);
}

async function main() {
  if (!CHROME) { console.error('  未找到 Chrome/Edge，无法生成图片资源'); process.exit(1); }
  try { await get(`http://127.0.0.1:${PORT}/json/version`); }
  catch {
    spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-first-run',
      '--user-data-dir=' + path.join(process.env.TEMP || '/tmp', 'aiwx-assets'), 'about:blank'],
      { detached: true, stdio: 'ignore' }).unref();
  }
  for (let i = 0; i < 40; i++) { try { await get(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(250); } }

  const list = JSON.parse(await get(`http://127.0.0.1:${PORT}/json/list`));
  const page = list.find((t) => t.type === 'page') || JSON.parse(await get(`http://127.0.0.1:${PORT}/json/new?about:blank`));
  const c = await cdp(page.webSocketDebuggerUrl);
  await c.send('Page.enable');

  console.log('');
  console.log('  生成图片资源');
  console.log('  ' + '─'.repeat(44));
  await shoot(c, ogHtml, 1200, 630, path.join(OUT, 'og.png'));
  await shoot(c, iconHtml, 180, 180, path.join(OUT, 'apple-touch-icon.png'));
  console.log('');
  c.close();
}

main().catch((e) => { console.error('  生成失败：', e.message); process.exit(1); });
