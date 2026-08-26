#!/usr/bin/env node
// 解説の「誤答3つへの言及」が不足している問題を、プレフィックス単位で書き出す。
//   node tools/export-explains.js m3 m7 --out <ディレクトリ>
// 書き出したファイルを執筆担当が修正し、tools/apply-explains.js で戻す。
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..') + '/';

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
const OUT = (oi >= 0 ? args[oi + 1] : '.') + '/';
const PREFIXES = args.slice(0, oi >= 0 ? oi : args.length);
if (!PREFIXES.length) { console.error('プレフィックスを指定してください'); process.exit(1); }

const q = JSON.parse(fs.readFileSync(R + 'js/terms-data.js', 'utf8')
  .match(/var TERM_QUESTIONS = (\[[\s\S]*\]);\s*$/m)[1]);

function keys(s) { return [...new Set((s.match(/[一-龥ァ-ヴー]{3,}/g) || []))]; }
function covered(x, i) {
  const ks = keys(x.choices[i]);
  const n = ks.filter(k => x.explain.includes(k)).length;
  return ks.length ? n / ks.length >= 0.25 : false;
}
function prefixOf(id) { return id.replace(/-?\d+$/, ''); }

for (const p of PREFIXES) {
  const list = q.filter(x => prefixOf(x.id) === p);
  if (!list.length) { console.log(p + ': 該当なし'); continue; }
  const bad = list.filter(x => [0, 1, 2, 3].filter(i => i !== x.answerIndex && !covered(x, i)).length > 0);
  const payload = bad.map(x => ({
    id: x.id, level: x.level, category: x.category,
    question: x.question, choices: x.choices, answerIndex: x.answerIndex,
    explain: x.explain,
    // どの誤答への言及が不足しているか(0始まりの位置。解説本文では位置を使わないこと)
    missing: [0, 1, 2, 3].filter(i => i !== x.answerIndex && !covered(x, i)).map(i => x.choices[i]),
  }));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(OUT + p + '.json', JSON.stringify(payload, null, 2));
  console.log(p + ': ' + bad.length + ' / ' + list.length + ' 問を書き出し -> ' + OUT + p + '.json');
}
