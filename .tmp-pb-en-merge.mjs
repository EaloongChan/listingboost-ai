import fs from 'node:fs';

const en = JSON.parse(fs.readFileSync('.tmp-pb-en1.json', 'utf8'));
const pb = JSON.parse(fs.readFileSync('data/playbooks.json', 'utf8'));
const byId = Object.fromEntries(pb.items.map((p) => [p.id, p]));

const problems = [];
let n = 0;

for (const [id, e] of Object.entries(en)) {
  const p = byId[id];
  if (!p) { problems.push(`手册不存在：${id}`); continue; }

  // 步骤数必须严格一致，否则英文版会和中文版错位
  const zhSteps = (p.steps || []).length;
  const enSteps = (e.steps || []).length;
  if (zhSteps !== enSteps) problems.push(`${id}: 步骤数不一致 中文 ${zhSteps} vs 英文 ${enSteps}`);

  // spec 四个字段必须齐全
  const specKeys = ['input', 'output', 'fail', 'alt'];
  const missing = specKeys.filter((k) => !e.spec || !e.spec[k]);
  if (missing.length) problems.push(`${id}: spec 缺 ${missing.join(', ')}`);

  // 警告条数
  const zhWarn = (p.warnings || []).length;
  const enWarn = (e.warnings || []).length;
  if (zhWarn && enWarn !== zhWarn) problems.push(`${id}: 警告条数不一致 中文 ${zhWarn} vs 英文 ${enWarn}`);

  // 英文里不该残留大量中文
  const allText = [e.title, e.problem, ...(e.steps || []), ...(e.warnings || []), ...Object.values(e.spec || {})].join(' ');
  const cjk = (allText.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (cjk > 4) problems.push(`${id}: 英文内容里残留 ${cjk} 个中文字符`);
}

if (problems.length) {
  console.log('✗ 校验不通过：');
  problems.forEach((x) => console.log('  ' + x));
  process.exit(1);
}

for (const [id, e] of Object.entries(en)) {
  byId[id].en = e;
  n++;
}

fs.writeFileSync('data/playbooks.json', JSON.stringify(pb, null, 2) + '\n', 'utf8');
fs.unlinkSync('.tmp-pb-en1.json');
console.log(`✓ 校验通过，已写入 ${n} 篇英文版`);
console.log(`  手册总数 ${pb.items.length}，其中 ${pb.items.filter((p) => p.en).length} 篇有英文版`);
