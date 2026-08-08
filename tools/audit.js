/* audit.js — 問題品質の客観監査（数値で出す） */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js');
load('data/glossary.js');
for (const f of fs.readdirSync('data/lectures')) load('data/lectures/' + f);
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);

const isNum = q => q.choices.every(c => /^[\d,.\s%〜~\-+xX×倍億万千円年か月日以上未満約]+$/.test(c));
const all = DOJO.allQuestions();
const n = all.length;
const pct = (x) => (100 * x / n).toFixed(1) + '%';
const stats = (arr) => {
  const s = arr.slice().sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))];
  return { min: s[0], p25: q(.25), med: q(.5), p75: q(.75), max: s[s.length - 1], mean: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) };
};

// --- 指標 ---
const expLen = all.map(q => q.exp.length);
const hasNum = all.filter(q => /[0-9]{2,}|[0-9]+(\.[0-9]+)?%|[0-9]+(\.[0-9]+)?x|[0-9]+倍/.test(q.exp)).length;
const hasCalc = all.filter(q => /```/.test(q.exp)).length;          // 計算過程ブロック
const hasTable = all.filter(q => /\n\|.*\|/.test(q.exp)).length;
const hasStruct = all.filter(q => /(\n[-・]|\n[0-9]+\.)/.test(q.exp)).length; // 箇条書き
const hasWhy = all.filter(q => /(なぜ|理由|ため|背景|論点|実務)/.test(q.exp)).length;
// 相互参照。strict＝「第N講」という正式な講番号での参照。
// broad＝「◯◯編を参照」のような、講名での参照も含む（どちらも実際に他講へ送っている）
const xrefStrict = /第[0-9]+講/;
const xrefBroad = /(第[0-9]+講|[^。\n]{2,10}編(を参照|を参照してください|で詳述|参照))/;
const hasXrefStrict = all.filter(q => xrefStrict.test(q.exp)).length;
const hasXref = all.filter(q => xrefBroad.test(q.exp)).length;

// 誤答つぶし。strict＝誤答の文言そのものがexpに現れる。
// broad＝「選択肢B は〜」のように選択肢を名指しして否定している場合も含む
const distractorStrict = q => {
  const wrong = q.choices.filter((_, i) => i !== q.a);
  return wrong.some(w => { const key = w.replace(/[（）()、。]/g, '').slice(0, 8); return key.length > 3 && q.exp.indexOf(key) >= 0; });
};
const distractorBroad = q => distractorStrict(q) || /選択肢\s*[A-DＡ-Ｄ]/.test(q.exp);
const hasDistractorStrict = all.filter(distractorStrict).length;
const hasDistractorExp = all.filter(distractorBroad).length;

// 「長い方が正解」ゲームの検査
let longestIsCorrect = 0, exploitable = 0, homog = 0, correctLenRatio = [], nonNum = 0;
all.forEach(q => {
  if (isNum(q)) return; nonNum++;
  const L = q.choices.map(c => c.length);
  const sorted = L.slice().sort((a, b) => b - a);
  if (L[q.a] === sorted[0]) longestIsCorrect++;
  // 悪用可能＝正解が単独最長で、かつ2位より10%以上長い
  if (L[q.a] === sorted[0] && L[q.a] > sorted[1] * 1.10) exploitable++;
  if (sorted[0] / sorted[sorted.length - 1] <= 1.35) homog++;   // 長さの均質性
  const others = L.filter((_, i) => i !== q.a);
  correctLenRatio.push(L[q.a] / (others.reduce((a, b) => a + b, 0) / others.length));
});

// 重複検査
const stem = new Map(), dupStem = [];
all.forEach(q => { const k = q.q.replace(/\s/g, ''); if (stem.has(k)) dupStem.push(q.id + ' == ' + stem.get(k)); else stem.set(k, q.id); });
// 正解文言の重複（同一トピック内で同じ正解＝実質同じ問題）
const ansKey = new Map(), dupAns = [];
all.forEach(q => { const k = q.topic + '|' + q.choices[q.a].replace(/\s/g, ''); if (ansKey.has(k)) dupAns.push(q.id + ' == ' + ansKey.get(k)); else ansKey.set(k, q.id); });

// タグ（概念）カバレッジ
const tagSet = new Set(); all.forEach(q => (q.tags || []).forEach(t => tagSet.add(q.topic + ':' + t)));
const noTag = all.filter(q => !q.tags || !q.tags.length).length;

// 選択肢数
const cc = {}; all.forEach(q => { cc[q.choices.length] = (cc[q.choices.length] || 0) + 1; });

console.log('==================================================');
console.log(' 問題品質 監査レポート   出題数 ' + n + ' 問');
console.log('==================================================');
console.log('\n[1] 解説の分量（文字数）');
const es = stats(expLen);
console.log(`  最小 ${es.min} / 25% ${es.p25} / 中央 ${es.med} / 75% ${es.p75} / 最大 ${es.max} / 平均 ${es.mean}`);
console.log(`  300字以上: ${pct(expLen.filter(x => x >= 300).length)}   500字以上: ${pct(expLen.filter(x => x >= 500).length)}   1000字以上: ${pct(expLen.filter(x => x >= 1000).length)}`);
console.log(`  解説の総文字数: ${expLen.reduce((a, b) => a + b, 0).toLocaleString()} 字`);

console.log('\n[2] 解説の中身（何が書かれているか）');
console.log(`  具体的な数値を含む          : ${hasNum} 問 (${pct(hasNum)})`);
console.log(`  計算過程のブロックを含む    : ${hasCalc} 問 (${pct(hasCalc)})`);
console.log(`  比較表を含む                : ${hasTable} 問 (${pct(hasTable)})`);
console.log(`  箇条書きで構造化されている  : ${hasStruct} 問 (${pct(hasStruct)})`);
console.log(`  「なぜ／実務上の意味」を書く: ${hasWhy} 問 (${pct(hasWhy)})`);
console.log(`  他講への相互参照            : ${hasXref} 問 (${pct(hasXref)})   うち「第N講」表記 ${hasXrefStrict} 問`);
console.log(`  誤答選択肢に言及して潰す    : ${hasDistractorExp} 問 (${pct(hasDistractorExp)})   うち誤答の文言を再掲 ${hasDistractorStrict} 問`);

console.log('\n[3] 選択肢の作り（当て推量で解けないか）');
console.log('  選択肢数の分布: ' + JSON.stringify(cc));
console.log(`  文章選択肢の問題: ${nonNum} 問（数値のみの選択肢は長さで判別できないため除外）`);
console.log(`  ★選択肢長が均質（最長÷最短 ≤ 1.35）: ${(100*homog/nonNum).toFixed(1)}%`);
console.log(`  ★「長い方が正解」で解ける問題（正解が単独最長かつ2位より10%以上長い）: ${exploitable} 問 (${(100*exploitable/nonNum).toFixed(1)}%)`);
console.log(`  （参考）正解が最長タイを含む: ${longestIsCorrect} 問 (${(100*longestIsCorrect/nonNum).toFixed(1)}%)`);
const cs = stats(correctLenRatio.map(x => Math.round(x * 100)));
console.log(`  正解長 ÷ 誤答平均長 (×100): 中央 ${cs.med} / 平均 ${cs.mean}  ← 100 に近いほど長さで見抜けない`);

console.log('\n[4] 重複・使い回し');
console.log(`  問題文が完全一致する重複 : ${dupStem.length} 件`);
console.log(`  同一トピック内で正解文言が一致: ${dupAns.length} 件`);
if (dupStem.length) console.log('   ' + dupStem.slice(0, 10).join('\n   '));
if (dupAns.length) console.log('   ' + dupAns.slice(0, 10).join('\n   '));

console.log('\n[5] 概念カバレッジ');
console.log(`  タグ（トピック×概念）のユニーク数: ${tagSet.size}`);
console.log(`  タグ未設定の問題: ${noTag} 問`);

console.log('\n[6] トピック×レベル 出題数');
const hdr = ['topic   '].concat(DOJO.LEVELS.map(l => l.id.padStart(4))).join(' ') + '   tot';
console.log(hdr);
let gt = 0;
DOJO.TOPICS.forEach(t => {
  const c = DOJO.LEVELS.map(l => DOJO.questionsOf(t.id, l.id).length);
  const s = c.reduce((a, b) => a + b, 0); gt += s;
  console.log(t.id.padEnd(8) + ' ' + c.map(x => String(x).padStart(4)).join(' ') + '   ' + String(s).padStart(4));
});
const lvTot = DOJO.LEVELS.map(l => all.filter(q => q.lv === l.id).length);
console.log('LEVEL計  ' + lvTot.map(x => String(x).padStart(4)).join(' ') + '   ' + String(gt).padStart(4));

console.log('\n[7] 座学');
let lc = 0, cnt = 0;
DOJO.TOPICS.forEach(t => DOJO.LEVELS.forEach(l => { const s = (DOJO.LECTURES[t.id] || {})[l.id]; if (s) { lc += s.length; cnt++; } }));
console.log(`  座学ページ数: ${cnt} / ${DOJO.TOPICS.length * DOJO.LEVELS.length}   総文字数: ${lc.toLocaleString()} 字`);

// ランダム抽出（seed固定）でサンプル出力
if (process.argv[2] === 'sample') {
  let seed = 20260806;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const k = Number(process.argv[3] || 5);
  console.log('\n[8] 無作為抽出サンプル（seed固定・作為なし）');
  for (let j = 0; j < k; j++) {
    const q = all[Math.floor(rnd() * all.length)];
    console.log('\n----- ' + q.id + ' -----');
    console.log('Q: ' + q.q);
    q.choices.forEach((c, i) => console.log((i === q.a ? ' ○ ' : '   ') + c));
    console.log('解説: ' + q.exp);
  }
}
