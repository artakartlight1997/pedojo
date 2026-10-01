/* ===== tools/progress2.js — v2 の測定値（コミットの「測定値」行に使う） =====
   使い方: node tools/progress2.js
   出力: 講義／演習／ケース／ルーブリック／型分布と配分達成度（06 §3）／章×周の完成度／v1接続 */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, body: {} };
global.location = { hash: '' };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
function loadIf(p) { if (fs.existsSync(p)) load(p); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js'); load('assets/loader2.js');
load('assets/store.js'); load('assets/engine.js'); load('assets/exercise.js');
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);
for (const u of DOJO.v2Files()) loadIf(u);
loadIf('data/v1map.js');
if (DOJO.applyV1Map) DOJO.applyV1Map();

const lecs = Object.values(DOJO.LECTURES2);
const qs = DOJO.allQuestions2();
const v1 = DOJO.allQuestions();
const v1use = v1.filter(q => q.v1 && q.use);
const cases = Object.values(DOJO.CASES);
const tasks = cases.reduce((s, c) => s + c.tasks.length, 0);
const lecChars = lecs.reduce((s, l) => s + ['what', 'output', 'model', 'kata', 'pitfalls', 'next'].reduce((a, k) => a + (l.sections[k] || '').length, 0), 0);

/* 型分布（v2固有）と、v1出題対象を含めた「道」の母集団 */
const tc = {}; qs.forEach(q => { tc[q.type] = (tc[q.type] || 0) + 1; });
const tcAll = Object.assign({}, tc); v1use.forEach(q => { tcAll[q.type] = (tcAll[q.type] || 0) + 1; });
const total = qs.length + v1use.length;
/* 06 §3 の配分目標（5,000問ベース） */
const groups = [
  { name: '用語確認4択(14)', types: [14], target: 500 },
  { name: '紙計算・数値・順序(9,10,11)', types: [9, 10, 11], target: 1250 },
  { name: '場面判断・最初の数字(13,5)', types: [13, 5], target: 1250 },
  { name: '並べ替え・確信度・誤り発見(2,3,4)', types: [2, 3, 4], target: 1000 },
  { name: '生成型・基準率(6,7,8,12)', types: [6, 7, 8, 8, 12], target: 750 },
  { name: 'ケース設問(1)', types: [1], target: 250 }
];
console.log('=== v2 測定値 ===');
console.log('工程講義 ' + lecs.length + '本（本文 ' + lecChars.toLocaleString() + '字）／v2演習 ' + qs.length + '問／ケース ' + cases.length + '（課題 ' + tasks + '）／ルーブリック ' + Object.keys(DOJO.RUBRICS).length + '本');
console.log('道の演習母集団: v2 ' + qs.length + ' + v1出題対象 ' + v1use.length + ' = ' + total + '問（v1全体 ' + v1.length + '、用語出題外 ' + (v1.length - v1use.length) + '）');
console.log('--- 配分（道の母集団 vs 06 §3 目標） ---');
groups.forEach(g => {
  const n = [...new Set(g.types)].reduce((s, t) => s + (tcAll[t] || 0), 0);
  const n2 = [...new Set(g.types)].reduce((s, t) => s + (tc[t] || 0), 0);
  console.log(g.name.padEnd(28) + String(n).padStart(5) + ' / ' + g.target + '  (' + Math.round(n / g.target * 100) + '%)  うちv2固有 ' + n2);
});
console.log('--- 章×周（講/演/課題） ---');
DOJO.CHAPTERS.forEach(c => {
  const cs = DOJO.caseById(c.caseId);
  const row = [1, 2, 3].map(l => '講' + DOJO.lecturesOf(c.id, l).length + '/演' + DOJO.questionsOf2(c.id, l).length + '/課' + (cs ? cs.tasks.filter(t => (t.lap || 1) === l).length : 0));
  console.log(c.id + '  ' + row.join('  '));
});
console.log('枝ケース: ' + DOJO.BRANCHES.map(b => b.letter + (DOJO.caseById(b.id) ? '●' : '○')).join(' '));
