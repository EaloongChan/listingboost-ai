/**
 * 场景手册质量体检（零依赖）
 *
 *   node scripts/audit-playbooks.mjs
 *
 * ChatGPT 的审查里给了一张 10 分评分卡，说「判断一篇手册是不是假装有用有客观标准」：
 *   1. 有明确输入 / 完成标准 / 约束条件       2 分
 *   2. 有真实失败模式，而不是泛泛「注意核对」   2 分
 *   3. 解释了工具 A 胜过 B 的条件            2 分
 *   4. 给出了「不该用 AI」的边界              2 分
 *   5. 含可验证产物或样例                    2 分
 *
 * 这个脚本用可自动判定的信号去近似打分，把低于 7 分的挑出来人工重写。
 * 它不是完美的评委，但能避免「凭感觉觉得都挺好」。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'playbooks.json'), 'utf8'));
const toolMap = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'tools.json'), 'utf8')).map((t) => [t.id, t]));

/** 泛泛而谈的失败描述，出现这些说明没写出真实失败模式 */
const GENERIC = [
  '注意核对', '仔细检查', '确保准确', '注意质量', '多加小心', '要认真',
  '注意一下', '细心', '谨慎使用', '需要注意', '可能会出错',
];

/** 表达取舍 / 对比的措辞 */
const TRADEOFF = [
  '按需要选', '按阶段选', '按粒度选', '按目标选', '分工', '按场景选', '怎么选', '选：', '判断标准是',
  '而不是', '优于', '胜过', '不如', '代价是', '差别', '区别是', '比…更', '更好', '更强', '更稳',
  '反而', '差别很大', '怎么选', '取舍', '两者不同', '不同命', '比同类', '靠前', '弱项', '强项',
];

/** 「不该用」的措辞 */
const NOT_AI = [
  '专业人士', '交给专业', '自己核对', '回到原文', '不能直接采信', '别指望', '没有意义',
  '不划算', '走不通', '优先用', '搜索工具核实', '不要问模型', '不适合提供事实', '别把',
  '不该用', '不要用', '别用', '用脚本', '人工', '手工', '没必要', '不需要 AI',
  '用现成', '用模板', '不值得', '直接看', '自己看', '如实', '别做',
];

const has = (text, words) => words.some((w) => text.includes(w));

/** 「按 XX 选」这类句式统一识别，避免每换一个词就要改词表 */
const hasTradeoffStyle = (text) => /按[^，。；]{1,6}选/.test(text) || /判断标准是/.test(text) || /分工是/.test(text);

const results = [];
for (const p of pb.items) {
  const text = [
    p.problem || '',
    ...(p.steps || []).map((s) => s.text || ''),
    ...(p.warnings || []),
    ...(p.spec ? Object.values(p.spec) : []),
  ].join('\n');

  const score = {};
  const notes = [];

  // 1. 输入 / 完成标准 / 约束（2 分）
  if (p.spec) {
    const lens = [p.spec.input, p.spec.output, p.spec.fail, p.spec.alt].map((x) => (x || '').length);
    score.spec = lens.every((n) => n >= 10) ? 2 : lens.filter((n) => n >= 10).length >= 2 ? 1 : 0;
    if (score.spec < 2) notes.push('验收区有一行内容太短');
  } else {
    score.spec = 0;
    notes.push('缺验收区');
  }

  // 2. 真实失败模式（2 分）
  const warns = p.warnings || [];
  const generic = warns.filter((w) => has(w, GENERIC) && w.length < 40).length;
  const specific = warns.filter((w) => w.length >= 30).length;
  score.fail = warns.length >= 3 && specific >= 2 && generic === 0 ? 2
    : warns.length >= 2 && specific >= 1 ? 1 : 0;
  if (score.fail < 2) notes.push(`避坑条目偏少或偏泛（共 ${warns.length} 条，其中具体描述 ${specific} 条）`);

  // 3. 工具取舍（2 分）
  const tradeoff = (p.steps || []).filter((s) => has(s.text || '', TRADEOFF) || hasTradeoffStyle(s.text || '')).length;
  score.tradeoff = tradeoff >= 2 ? 2 : tradeoff === 1 ? 1 : 0;
  if (score.tradeoff < 2) notes.push('很少解释工具之间的取舍条件');

  // 4. 不该用 AI 的边界（2 分）
  const hasBoundaryStyle = (t) => /不用(做|走|折腾)/.test(t) || /直接用/.test(t) || /别(.{0,4})做/.test(t) || /不需要/.test(t);
  const notAi = [p.spec?.alt || '', ...warns].filter((t) => has(t, NOT_AI) || hasBoundaryStyle(t)).length;
  score.boundary = notAi >= 2 ? 2 : notAi === 1 ? 1 : 0;
  if (score.boundary < 2) notes.push('「什么时候别用 AI」说得不够明确');

  // 5. 可验证产物（2 分）
  const outLen = (p.spec?.output || '').length;
  score.output = outLen >= 20 ? 2 : outLen >= 10 ? 1 : 0;
  if (score.output < 2) notes.push('产出描述不够具体，难以验证');

  const total = Object.values(score).reduce((a, b) => a + b, 0);
  results.push({ id: p.id, title: p.title, total, score, notes, steps: (p.steps || []).length, tools: (p.tools || []).length });
}

results.sort((a, b) => a.total - b.total);

const AS_JSON = process.argv.includes('--json');

const line = '─'.repeat(64);
if (AS_JSON) { console.log(JSON.stringify(results.map((r) => ({ id: r.id, total: r.total })))); process.exit(0); }
console.log('');
console.log('  场景手册质量体检（满分 10）');
console.log('  ' + line);
console.log(`  共 ${results.length} 篇`);

const dist = {};
results.forEach((r) => { dist[r.total] = (dist[r.total] || 0) + 1; });
console.log('  分布: ' + Object.keys(dist).sort((a, b) => b - a).map((k) => `${k}分 ${dist[k]}篇`).join('  |  '));

const low = results.filter((r) => r.total < 7);
console.log('');
if (!low.length) {
  console.log('  ✓ 全部达到 7 分以上');
} else {
  console.log(`  ✗ 低于 7 分的有 ${low.length} 篇，建议重写：`);
  console.log('  ' + line);
  low.forEach((r) => {
    console.log('');
    console.log(`  ${r.total}/10  ${r.title}`);
    console.log(`        ${r.id}  ·  ${r.steps} 步  ·  ${r.tools} 个工具`);
    r.notes.forEach((n) => console.log(`        · ${n}`));
  });
}

console.log('');
console.log('  ' + line);
console.log('  分数构成: 输入产出 / 失败模式 / 工具取舍 / AI 边界 / 可验证产出');
console.log('');
