import fs from 'node:fs';

let p = fs.readFileSync('src/lib/pages.mjs', 'utf8');
let e = fs.readFileSync('src/lib/pages-en.mjs', 'utf8');
let n = 0;

/* ---------- 1. 中文工具分类页 ----------
   原标题只是「X 分类下的 N 个工具 + 一句 desc」，信息量太低。
   现在加上：这些工具解决什么、每个条目都有什么、以及要点摘句。 */
const zhCatOld = '? `「${activeName}」分类下的 ${list.length} 个 AI 工具。${(toolCatMap[activeCat] || {}).desc || \\'\\'}`';
const zhCatNew = `? \`\${activeName}类 AI 工具共 \${list.length} 个：\${(toolCatMap[activeCat] || {}).desc || ''}。每个都标注了价格、是否国内可直连，并写了「什么时候别用」的编辑点评。\${(() => { const g = (toolCatMap[activeCat] || {}).guide || ''; const cut = g.split('。')[0]; return cut ? '选型要点：' + cut + '。' : ''; })()}\``;
if (p.includes(zhCatOld)) { p = p.replace(zhCatOld, zhCatNew); n++; }
else console.log('✗ 中文分类页未匹配');

/* ---------- 2. 中文模型类型页 ---------- */
const zhKindOld = '? `「${activeName}」类的 ${list.length} 个模型家族对比。`';
const zhKindNew = `? \`\${activeName}方向的 \${list.length} 个模型家族对比：每个都标注了是否开源、国内能否直连、最强的地方和要注意的坑，并附官方模型列表链接。只对比稳定的维度，不含几个月就过期的参数。\``;
if (p.includes(zhKindOld)) { p = p.replace(zhKindOld, zhKindNew); n++; }
else console.log('✗ 中文模型类型页未匹配');

/* ---------- 3. 场景手册详情页 ----------
   原来直接用 problem 当描述，只有「问题」没有「能得到什么」。
   补上：几步、多久、产出什么。 */
const pbOld = '    description: pb.problem,';
const pbNew = `    description: \`\${pb.problem} 共 \${(pb.steps || []).length} 步，预计 \${pb.time}。\${pb.spec ? '产出：' + pb.spec.output : ''}\`,`;
if (p.includes(pbOld)) { p = p.replace(pbOld, pbNew); n++; }
else console.log('✗ 手册页描述未匹配');

/* ---------- 4. 英文工具分类页 ----------
   原来是 "13 tools in 3D modelling." —— 24 个字符，几乎等于没有。 */
const enCatOld = '? `${list.length} tools in ${catName(cat.id)}.`';
const enCatNew = `? \`\${list.length} AI tools for \${catName(cat.id).toLowerCase()}: \${(ctx.categories.toolCategories.find((x) => x.id === cat.id) || {}).descEn || ''} Each entry notes pricing, China accessibility and when not to use it.\``;
if (e.includes(enCatOld)) { e = e.replace(enCatOld, enCatNew); n++; }
else console.log('✗ 英文分类页未匹配');

/* ---------- 5. 英文模型类型页 ---------- */
const enKindOld = 'const desc = kind ? `${list.length} model families in ${kindName(kind.id)}.` : en[\'models.desc\'];';
const enKindNew = `const desc = kind ? \`\${list.length} model families for \${kindName(kind.id).toLowerCase()} compared on stable dimensions: biggest strengths, what to watch, open or closed, and China accessibility. A verification month is shown on every entry, with a link to the official model list.\` : en['models.desc'];`;
if (e.includes(enKindOld)) { e = e.replace(enKindOld, enKindNew); n++; }
else console.log('✗ 英文模型类型页未匹配');

fs.writeFileSync('src/lib/pages.mjs', p, 'utf8');
fs.writeFileSync('src/lib/pages-en.mjs', e, 'utf8');
console.log(`已改 ${n} / 5 处`);
