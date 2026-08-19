/* terms.js — 用語カバレッジの監査
   コンテンツ（座学・問題解説）に登場する専門語のうち、
   用語集に載っていないものを頻度順に列挙する。
   使い方: node tools/terms.js [表示件数=60]                                 */
const fs = require('fs');

global.DOJO = {
  LECTURES: {}, BANK: {}, GLOSSARY: [],
  lecture: (t, o) => { global.DOJO.LECTURES[t] = Object.assign(global.DOJO.LECTURES[t] || {}, o); },
  quiz: (t, l, a) => { (global.DOJO.BANK[t + '-' + l] = global.DOJO.BANK[t + '-' + l] || []).push(...a); },
  glossary: (a) => { global.DOJO.GLOSSARY.push(...a); }
};
const load = p => eval(fs.readFileSync(p, 'utf8'));
load('data/glossary.js');
for (const f of fs.readdirSync('data/lectures')) load('data/lectures/' + f);
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);

// 用語集に載っている語（別名も展開）
const known = new Set();
for (const e of DOJO.GLOSSARY) {
  known.add(e.term);
  const m = e.term.match(/^([^（(]{2,30})（/);
  if (m) known.add(m[1]);
  const head = (m ? m[1] : e.term);
  if (head.indexOf('/') > 0) head.split('/').forEach(w => { w = w.trim(); if (w.length >= 2) known.add(w); });
  if (e.en) known.add(e.en);
}

// 本文の収集
let text = '';
for (const t of Object.keys(DOJO.LECTURES)) for (const k of Object.keys(DOJO.LECTURES[t])) text += DOJO.LECTURES[t][k] + '\n';
for (const k of Object.keys(DOJO.BANK)) for (const q of DOJO.BANK[k]) text += q.q + '\n' + q.exp + '\n' + q.choices.join('\n') + '\n';

// 候補語の抽出：
//  a) {{kw}} マーカー
//  b) **強調** されたカタカナ・英字語
//  c) 「」内の用語らしき語
const freq = {};
function bump(w) {
  w = w.trim().replace(/[（(].*$/, '').replace(/[。、．，]$/, '');
  if (w.length < 3 || w.length > 24) return;
  if (/^[0-9０-９\s]+$/.test(w)) return;
  if (!/^[A-Za-zＡ-Ｚァ-ヴー・&/\s]+$|^[A-Za-z][A-Za-z0-9&/\-\s]*$/.test(w)) {
    // 漢字混じりは「〜法」「〜条項」「〜税制」「〜基準」「〜勘定」「〜義務」等の型のみ拾う
    if (!/(法|条項|税制|基準|勘定|義務|方式|原則|比率|倍率|報酬|試験|契約|保険|債務|資産|価値|利益|費用|収益|取引|市場)$/.test(w)) return;
  }
  freq[w] = (freq[w] || 0) + 1;
}
for (const m of text.matchAll(/\{\{([^}]{2,24})\}\}/g)) bump(m[1]);
for (const m of text.matchAll(/\*\*([^*\n]{3,24})\*\*/g)) bump(m[1]);
for (const m of text.matchAll(/「([^」\n]{3,20})」/g)) bump(m[1]);
for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9&]{2,}(?:[ \-/][A-Za-z0-9&]{2,}){0,3}/g)) bump(m[0]);

// 既知語・一般語を除外
const stop = /^(ただし|つまり|なぜ|例えば|ポイント|注意|重要|まとめ|チェック|よくある|この|その|あなた|それぞれ|すべて|ここ|どちら|見送り|問題|解説|正解|誤答|選択肢|以下|以上|場合|とき|こと|もの|ため)/;
const miss = Object.entries(freq)
  .filter(([w]) => !known.has(w) && !stop.test(w))
  .filter(([w]) => ![...known].some(k => k.startsWith(w) || w.startsWith(k.replace(/（.*/, ''))))
  .sort((a, b) => b[1] - a[1]);

const N = parseInt(process.argv[2] || '60', 10);
console.log('用語集: ' + DOJO.GLOSSARY.length + ' 語 / 未収録の頻出候補（上位' + N + '）\n');
for (const [w, n] of miss.slice(0, N)) console.log(String(n).padStart(4), w);
console.log('\n候補総数:', miss.length);
