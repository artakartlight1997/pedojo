/* progress.js — 目標（tools/targets.json）と実績を突き合わせ、残数と作業キューを出す
   使い方:
     node tools/progress.js            残数の一覧（Markdown表）
     node tools/progress.js queue 20   次にやるべきファイルを不足の多い順に20件
     node tools/progress.js md         NOTES.md に貼る形式で出力
*/
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {} };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js');
for (const f of fs.readdirSync('data/lectures')) load('data/lectures/' + f);
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);

const T = JSON.parse(fs.readFileSync('tools/targets.json', 'utf8'));
const LV = ['b', 'i', 'a', 'p'];
const mode = process.argv[2] || 'table';

const rows = [];
let gotTot = 0, tgtTot = 0;
const lvGot = { b: 0, i: 0, a: 0, p: 0 }, lvTgt = { b: 0, i: 0, a: 0, p: 0 };

DOJO.TOPICS.forEach(t => {
  const tier = T.assign[t.id];
  if (!tier) { console.error('!! targets.json に ' + t.id + ' の割当がありません'); return; }
  const tg = T.tiers[tier];
  const r = { id: t.id, name: t.short || t.name, tier: tier, lv: {} };
  LV.forEach(l => {
    const got = DOJO.questionsOf(t.id, l).length;
    const tgt = tg[l];
    const lec = ((DOJO.LECTURES[t.id] || {})[l] || '').length;
    r.lv[l] = { got: got, tgt: tgt, lack: Math.max(0, tgt - got), lec: lec };
    gotTot += got; tgtTot += tgt; lvGot[l] += got; lvTgt[l] += tgt;
  });
  rows.push(r);
});

function bar(p) { const n = Math.round(p * 20); return '█'.repeat(n) + '░'.repeat(20 - n); }

if (mode === 'queue') {
  const k = Number(process.argv[3] || 20);
  const jobs = [];
  rows.forEach(r => LV.forEach(l => {
    if (r.lv[l].lack > 0) jobs.push({ file: 'data/quiz/' + r.id + '-' + l + '.js', lack: r.lv[l].lack, got: r.lv[l].got, tgt: r.lv[l].tgt, lec: r.lv[l].lec, topic: r.name, lv: l });
  }));
  jobs.sort((a, b) => (a.got - b.got) || (b.lack - a.lack));   // 未着手を最優先、次に不足の大きい順
  console.log('残 ' + (tgtTot - gotTot) + ' 問 / 作業ファイル ' + jobs.length + ' 本');
  console.log('（座学が未執筆の場合は「座学なし」と表示。座学を先に書くこと）\n');
  jobs.slice(0, k).forEach((j, i) => {
    console.log(String(i + 1).padStart(3) + '. ' + j.file.padEnd(28) +
      ' 現' + String(j.got).padStart(3) + ' / 目標' + String(j.tgt).padStart(3) +
      ' → 不足 ' + String(j.lack).padStart(3) +
      (j.lec ? '' : '   ★座学なし'));
  });
  process.exit(0);
}

const head = '| トピック | 区分 | 初級 | 中級 | 上級 | 実践 | 計 | 達成率 |';
const sep = '|---|---|---|---|---|---|---|---|';
const out = [head, sep];
rows.forEach(r => {
  const cells = LV.map(l => r.lv[l].got + '/' + r.lv[l].tgt + (r.lv[l].lec ? '' : ' ※'));
  const g = LV.reduce((s, l) => s + r.lv[l].got, 0);
  const t = LV.reduce((s, l) => s + r.lv[l].tgt, 0);
  out.push('| ' + r.name + ' | ' + r.tier + ' | ' + cells.join(' | ') + ' | ' + g + '/' + t + ' | ' + Math.round(100 * g / t) + '% |');
});
out.push('| **合計** | | ' + LV.map(l => '**' + lvGot[l] + '/' + lvTgt[l] + '**').join(' | ') +
  ' | **' + gotTot + '/' + tgtTot + '** | **' + Math.round(100 * gotTot / tgtTot) + '%** |');

console.log(out.join('\n'));
console.log('\n※ = そのレベルの座学が未執筆');
console.log('\n進捗 ' + bar(gotTot / tgtTot) + '  ' + gotTot + ' / ' + tgtTot + ' 問（残 ' + (tgtTot - gotTot) + ' 問）');
let lecCnt = 0, lecChars = 0;
DOJO.TOPICS.forEach(t => LV.forEach(l => { const s = (DOJO.LECTURES[t.id] || {})[l]; if (s) { lecCnt++; lecChars += s.length; } }));
console.log('座学 ' + lecCnt + ' / ' + (DOJO.TOPICS.length * LV.length) + ' ページ、' + lecChars.toLocaleString() + ' 字');
