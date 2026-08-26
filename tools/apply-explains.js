#!/usr/bin/env node
// 修正済みの解説(<prefix>-fixed.json)を js/terms-data.js に反映する。
//   node tools/apply-explains.js m3 m7 --dir <ディレクトリ> [--dry]
// 変更するのは explain のみ。id/question/choices/answerIndex は一切触らない。
// 1つでも基準を外れたら何も書き込まずに中断する。
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..') + '/';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const di = args.indexOf('--dir');
const DIR = (di >= 0 ? args[di + 1] : '.') + '/';
const PREFIXES = args.filter(a => !a.startsWith('--') && a !== args[di + 1]);

const src = fs.readFileSync(R + 'js/terms-data.js', 'utf8');
const em = src.match(/var TERM_QUESTIONS = (\[[\s\S]*\]);\s*$/m);
const all = JSON.parse(em[1]);
const byId = new Map(all.map(q => [q.id, q]));

function keys(s) { return [...new Set((s.match(/[一-龥ァ-ヴー]{3,}/g) || []))]; }
function covered(q, i, explain) {
  const ks = keys(q.choices[i]);
  const n = ks.filter(k => explain.includes(k)).length;
  return ks.length ? n / ks.length >= 0.25 : true;
}

const errors = [];
const pending = [];
const missingFiles = [];

for (const p of PREFIXES) {
  const f = DIR + p + '-fixed.json';
  if (!fs.existsSync(f)) { missingFiles.push(p); continue; }
  let list;
  try { list = JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch (e) { errors.push(p + ': JSONとして読めません — ' + e.message); continue; }
  if (!Array.isArray(list)) { errors.push(p + ': 配列ではありません'); continue; }

  let nBad = 0;
  for (const item of list) {
    const E = m => { if (nBad++ < 5) errors.push(p + ': ' + m); };
    const q = byId.get(item.id);
    if (!q) { E('存在しないid ' + item.id); continue; }
    if (!item.id.startsWith(p)) { E('プレフィックス不一致 ' + item.id); continue; }
    const ex = item.explain;
    if (typeof ex !== 'string' || !ex.trim()) { E('explainが空 @' + item.id); continue; }
    // 選択肢を位置番号で参照していないこと(出題時に並び替わるため)
    if (/選択肢\s*[0-4０-４]|[1-4]番目の選択肢|[ABCD]の選択肢/.test(ex)) { E('位置番号での参照 @' + item.id); continue; }
    // 元の問題に手が入っていないこと
    if (item.question && item.question !== q.question) { E('questionが変更されている @' + item.id); continue; }
    if (item.choices && JSON.stringify(item.choices) !== JSON.stringify(q.choices)) { E('choicesが変更されている @' + item.id); continue; }
    if (item.answerIndex !== undefined && item.answerIndex !== q.answerIndex) { E('answerIndexが変更されている @' + item.id); continue; }
    // 誤答3つすべてに内容で言及していること
    const un = [0, 1, 2, 3].filter(i => i !== q.answerIndex && !covered(q, i, ex));
    if (un.length) { E('誤答への言及不足 @' + item.id + ' (' + un.length + '件)'); continue; }
    if (ex.length < 120) { E('解説が短すぎる ' + ex.length + '字 @' + item.id); continue; }
    if (ex.length > 700) { E('解説が長すぎる ' + ex.length + '字 @' + item.id); continue; }
    pending.push([q, ex]);
  }
  if (nBad > 5) errors.push(p + ': ほか ' + (nBad - 5) + ' 件');
  console.log(p + ': ' + list.length + '件中 ' + (list.length - nBad) + '件が基準を満たす');
}

if (missingFiles.length) console.log('\n未完了(ファイルなし): ' + missingFiles.join(', '));
if (errors.length) {
  console.log('\n--- 不合格 ---');
  for (const e of errors.slice(0, 40)) console.log('  ' + e);
  console.log('\n何も書き込まずに中断します。');
  process.exit(1);
}
if (!pending.length) { console.log('\n反映対象がありません。'); process.exit(0); }
if (DRY) { console.log('\n[dry] ' + pending.length + '問の解説を反映できます。'); process.exit(0); }

for (const [q, ex] of pending) q.explain = ex;

function keysOf(s) { return keys(s); }
let ok = 0;
for (const q of all) {
  const n = [0, 1, 2, 3].filter(i => i !== q.answerIndex && covered(q, i, q.explain)).length;
  if (n === 3) ok++;
}
const header = src.slice(0, em.index);
fs.writeFileSync(R + 'js/terms-data.js', header + 'var TERM_QUESTIONS = ' + JSON.stringify(all, null, 2) + ';\n');
console.log('\n' + pending.length + '問の解説を差し替えました(全' + all.length + '問)');
console.log('誤答3つすべてに言及している問題: ' + ok + ' / ' + all.length + ' (' + (ok / all.length * 100).toFixed(1) + '%)');
