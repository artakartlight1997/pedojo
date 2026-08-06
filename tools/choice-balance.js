/* dump.js — 選択肢の長さが不均衡な問題だけを抜き出す */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js');
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);

const want = process.argv[2] || '';        // topic-lv 前方一致
const isNum = q => q.choices.every(c => /^[\d,.\s%〜~\-+xX×倍億万千円年か月日以上未満約]+$/.test(c));
const all = DOJO.allQuestions().filter(q => q.id.indexOf(want) === 0 && !isNum(q));
let out = [], bad = 0;
all.forEach(q => {
  const L = q.choices.map(c => c.length);
  const cl = L[q.a];
  const sorted = L.slice().sort((a, b) => b - a);
  const tooShort = sorted[0] / sorted[sorted.length - 1] > 1.35;
  const longest = cl === sorted[0] && cl > sorted[1] * 1.10;
  if (!tooShort && !longest) return;
  bad++;
  out.push(q.id + ' |正解' + cl + '字|' + (longest ? '★正解が突出して長い' : '') + (tooShort ? '長さが不均質' : '') + ' ' + q.q);
  q.choices.forEach((c, i) => out.push('  ' + (i === q.a ? '○' : ' ') + i + '/' + L[i] + ' ' + c));
});
console.log(out.join('\n'));
console.log('\n--- 要修正 ' + bad + ' 問 / ' + all.length + ' 問中 ---');
