import fs from 'node:fs';

const en = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const pr = JSON.parse(fs.readFileSync('data/prompts.json', 'utf8'));
const byId = Object.fromEntries(pr.map((p) => [p.id, p]));

const problems = [];
let n = 0;

for (const [id, e] of Object.entries(en)) {
  const p = byId[id];
  if (!p) { problems.push(`提示词不存在：${id}`); continue; }

  for (const k of ['title', 'desc', 'prompt', 'tips']) {
    if (!e[k] || !String(e[k]).trim()) problems.push(`${id}: 缺 ${k}`);
  }

  // 变量必须一一对应：英文 prompt 里的 {{x}} 要和中文的变量清单对得上
  const enVars = e.vars || [];
  if (!enVars.length) problems.push(`${id}: 没有声明变量`);
  for (const v of enVars) {
    if (!String(e.prompt).includes('{{' + v + '}}')) problems.push(`${id}: 变量 {{${v}}} 没出现在英文 prompt 里`);
  }

  // 英文内容不该有中文
  const all = [e.title, e.desc, e.prompt, e.tips, ...(e.vars || [])].join(' ');
  const cjk = (all.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (cjk > 2) problems.push(`${id}: 英文内容里残留 ${cjk} 个中文字符`);
}

if (problems.length) {
  console.log('✗ 校验不通过：');
  problems.forEach((x) => console.log('  ' + x));
  process.exit(1);
}

for (const [id, e] of Object.entries(en)) { byId[id].en = e; n++; }

fs.writeFileSync('data/prompts.json', JSON.stringify(pr, null, 2) + '\n', 'utf8');
fs.unlinkSync(process.argv[2]);
console.log(`✓ 已写入 ${n} 条英文提示词`);
console.log(`  提示词总数 ${pr.length}，其中有英文版的 ${pr.filter((p) => p.en).length} 条`);
