/**
 * 新增条目脚手架
 *   node scripts/new.mjs tool    "名称"
 *   node scripts/new.mjs prompt  "标题"
 *   node scripts/new.mjs news    "标题"
 *   node scripts/new.mjs learn   "标题"
 *   node scripts/new.mjs gloss   "术语"
 * 会在对应 data/*.json 追加一条带占位值的记录，随后自行编辑补全。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '..', 'data');

const kind = process.argv[2];
const name = process.argv.slice(3).join(' ').trim() || '未命名';

const stamp = new Date().toISOString().slice(0, 10);

const TPL = {
  tool: {
    file: 'tools.json',
    make: (n) => ({
      id: n.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
      name: n, url: 'https://', cat: 'chat',
      desc: '一句话说明它是干什么的、有什么特别之处。',
      tags: ['标签1', '标签2'], pricing: 'freemium', cn: false, hot: false, official: true, added: stamp,
    }),
  },
  prompt: {
    file: 'prompts.json',
    make: (n) => ({
      id: 'p-' + n.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
      title: n, cat: 'work', desc: '一句话说明这条提示词解决什么问题。',
      tags: ['标签1'], model: ['GPT', 'Claude'], hot: false, vars: ['变量1'],
      prompt: '角色：你是……\n\n任务：……\n\n要求：\n1. \n2. \n\n变量：{{变量1}}',
      tips: '使用这条提示词时最需要注意的一点。',
    }),
  },
  news: {
    file: 'news.json',
    make: (n) => ({
      id: 'n-' + n.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
      title: n, topic: 'guide', date: stamp, source: 'AI 万象 · 精选解读',
      summary: '一句话概括这篇内容。', tags: ['标签1'],
      body: ['第一段。', '第二段。', '第三段。'],
    }),
  },
  learn: {
    file: 'learn.json',
    make: (n) => ({
      id: 'l-' + n.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-'),
      title: n, track: 'basic', type: 'course', level: '入门', lang: '中文', free: true,
      url: 'https://', source: '来源机构', desc: '一句话说明这份材料好在哪里。', tags: ['标签1'],
    }),
  },
  gloss: {
    file: 'glossary.json',
    make: (n) => ({ term: n, abbr: '', en: '', cat: '基础概念', def: '用大白话解释这个词。', related: [] }),
  },
};

if (!TPL[kind]) {
  console.error('  用法：node scripts/new.mjs <tool|prompt|news|learn|gloss> "名称"');
  process.exit(1);
}

const { file, make } = TPL[kind];
const p = path.join(DATA, file);
const raw = JSON.parse(fs.readFileSync(p, 'utf8'));

if (Array.isArray(raw)) {
  raw.push(make(name));
  fs.writeFileSync(p, JSON.stringify(raw, null, 2) + '\n', 'utf8');
} else {
  raw.items.push(make(name));
  fs.writeFileSync(p, JSON.stringify(raw, null, 2) + '\n', 'utf8');
}

console.log(`  ✓ 已在 data/${file} 追加一条「${name}」，请编辑补全后再构建。`);
