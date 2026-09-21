import { termSlug } from '../src/lib/utils.mjs';
import fs from 'node:fs';
const g = JSON.parse(fs.readFileSync('data/glossary.json', 'utf8'));
const by = {};
g.forEach((x) => { const s = termSlug(x); (by[s] = by[s] || []).push(x.term); });
const dup = Object.entries(by).filter(([, v]) => v.length > 1);
console.log('slug 撞车:', dup.length ? dup.map(([s, v]) => s + ' ← ' + v.join(' / ')).join(' | ') : '无 ✓');
console.log('词条', g.length, '| 唯一 slug', Object.keys(by).length);
