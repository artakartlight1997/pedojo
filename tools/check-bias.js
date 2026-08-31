#!/usr/bin/env node
// 選択肢の文字数バランスを、出題時に実際に使えるフィルタ単位で検査する。
//   node tools/check-bias.js [--min <件数>] [--csv]
// 全体で25%に収まっていても、レベルやカテゴリで絞ると偏っていることがある。
// ユーザーが絞れるのはレベルとカテゴリなので、その単位で見るのが正しい。
const fs = require('fs');
const path = require('path');
const R = path.resolve(__dirname, '..') + '/';

const args = process.argv.slice(2);
const mi = args.indexOf('--min');
const MIN = mi >= 0 ? Number(args[mi + 1]) : 20;  // これ未満は偶然の振れが大きいので参考扱い
const CSV = args.includes('--csv');

const q = JSON.parse(fs.readFileSync(R + 'js/terms-data.js', 'utf8')
  .match(/var TERM_QUESTIONS = (\[[\s\S]*\]);\s*$/m)[1]);

// 「常に最長(最短)を選ぶ」戦略の期待正答率。同点はランダム選択として計上する。
function strat(list, mode) {
  let s = 0;
  for (const x of list) {
    const L = x.choices.map(c => c.length);
    const v = mode === 'long' ? Math.max(...L) : Math.min(...L);
    const t = L.filter(y => y === v).length;
    if (L[x.answerIndex] === v) s += 1 / t;
  }
  return list.length ? s / list.length * 100 : 0;
}
const LO_MIN = 20, LO_MAX = 32, SH_MIN = 15;
const judge = (lo, sh) => (lo < LO_MIN || lo > LO_MAX || sh < SH_MIN) ? 'NG' : 'OK';

function group(keyFn) {
  const m = {};
  for (const x of q) (m[keyFn(x)] = m[keyFn(x)] || []).push(x);
  return m;
}

function report(title, groups) {
  const rows = Object.entries(groups)
    .map(([k, l]) => ({ k, n: l.length, lo: strat(l, 'long'), sh: strat(l, 'short') }))
    .sort((a, b) => a.sh - b.sh);
  const big = rows.filter(r => r.n >= MIN);
  const ng = big.filter(r => judge(r.lo, r.sh) === 'NG');
  console.log('\n=== ' + title + ' (' + MIN + '問以上を判定対象) ===');
  for (const r of rows) {
    const tag = r.n < MIN ? '   ' : judge(r.lo, r.sh) + ' ';
    console.log(tag + r.k.slice(0, 34).padEnd(36) +
      String(r.n).padStart(5) + '問  最長 ' + r.lo.toFixed(1).padStart(5) +
      '%  最短 ' + r.sh.toFixed(1).padStart(5) + '%');
  }
  console.log('判定対象 ' + big.length + '件中 ' + ng.length + '件が基準外');
  return ng;
}

console.log('全' + q.length + '問  最長 ' + strat(q, 'long').toFixed(1) +
            '%  最短 ' + strat(q, 'short').toFixed(1) + '%  (ランダム期待値25%)');
console.log('合格ライン: 最長 ' + LO_MIN + '〜' + LO_MAX + '% / 最短 ' + SH_MIN + '%以上');

const ngLevel = report('レベル別', group(x => x.level));
const ngCat = report('カテゴリ別', group(x => x.category));

if (CSV) {
  const out = R + 'bias-report.csv';
  const lines = ['単位,名前,問題数,最長戦略,最短戦略,判定'];
  for (const [t, g] of [['level', group(x => x.level)], ['category', group(x => x.category)]])
    for (const [k, l] of Object.entries(g)) {
      const lo = strat(l, 'long'), sh = strat(l, 'short');
      lines.push([t, '"' + k + '"', l.length, lo.toFixed(1), sh.toFixed(1),
                  l.length >= MIN ? judge(lo, sh) : '-'].join(','));
    }
  fs.writeFileSync(out, lines.join('\n') + '\n');
  console.log('\n' + out + ' に書き出しました');
}

process.exit(ngLevel.length + ngCat.length ? 1 : 0);
