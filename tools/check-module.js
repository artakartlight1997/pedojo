#!/usr/bin/env node
// 1モジュール単体の機械検証。build-wave.js と同じ基準。
//   node check.js <key>   (このディレクトリの <key>.html / <key>.json を検証)
// 全項目パスするまで提出しないこと。
const fs = require('fs');
const path = require('path');
const R = '/home/user/pedojo/';
const di = process.argv.indexOf('--dir');
const W = (di >= 0 ? process.argv[di + 1] : process.cwd()) + '/';
const key = process.argv[2];
// 使い方: node tools/check-module.js <key> --dir <出力ディレクトリ>
if (!key) { console.error('usage: node check.js <key>'); process.exit(2); }

const plan = JSON.parse(fs.readFileSync(R + 'content-plan.json', 'utf8'));
const m = plan.modules.find(x => x.key === key);
if (!m) { console.error('content-plan.json に ' + key + ' がありません'); process.exit(2); }

function strat(list, mode) {
  let s = 0;
  for (const q of list) {
    const L = q.choices.map(c => c.length);
    const v = mode === 'long' ? Math.max(...L) : Math.min(...L);
    const t = L.filter(x => x === v).length;
    if (L[q.answerIndex] === v) s += 1 / t;
  }
  return list.length ? s / list.length * 100 : 0;
}
function keys(s) { return [...new Set((s.match(/[一-龥ァ-ヴー]{3,}/g) || []))]; }
function coversDistractors(q) {
  let hit = 0;
  for (let i = 0; i < 4; i++) {
    if (i === q.answerIndex) continue;
    const ks = keys(q.choices[i]);
    const n = ks.filter(k => q.explain.includes(k)).length;
    if (ks.length && n / ks.length >= 0.25) hit++;
  }
  return hit === 3;
}
function norm(s) { return s.replace(/[\s、。,.?？!！「」『』()()・:：;；]/g, ''); }
function bg(s) { const t = norm(s), r = new Set(); for (let i = 0; i < t.length - 1; i++) r.add(t.slice(i, i + 2)); return r; }
function jac(a, b) { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); }

const src = fs.readFileSync(R + 'js/terms-data.js', 'utf8');
const em = src.match(/var TERM_QUESTIONS = (\[[\s\S]*\]);\s*$/m);
const existing = JSON.parse(em[1]);
const ids = new Set(existing.map(q => q.id));

const errors = [];
const E = msg => errors.push(msg);

// --- HTML ---
let html;
try { html = fs.readFileSync(W + key + '.html', 'utf8').trim().replace(/^```html\s*/, '').replace(/```\s*$/, '').trim(); }
catch (e) { E('HTMLファイルなし'); html = ''; }
if (html) {
  if (!html.startsWith('<section class="study-section" id="' + m.id + '">')) E('sectionの開始タグが不正(id=' + m.id + ' であること)');
  if (!html.endsWith('</section>')) E('</section>で終わっていない');
  for (const t of ['section', 'article', 'p', 'li', 'ol', 'ul', 'h3', 'div', 'strong', 'table', 'figure', 'svg']) {
    const o = (html.match(new RegExp('<' + t + '[ >]', 'g')) || []).length;
    const c = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) E('タグ不一致 <' + t + '> 開始' + o + '/終了' + c);
  }
  if (/&lt;\/?(section|article|div|h[23]|ol|ul|li|strong|p)[ &>]/.test(html)) E('構造タグがエスケープされたまま');
  if (/#[0-9a-fA-F]{3,6}\b/.test(html)) E('SVG/スタイルに色コード直書きがある(CSS変数を使う)');
  const arts = (html.match(/<article/g) || []).length;
  if (arts < m.articles) E('記事数 ' + arts + ' < 予定 ' + m.articles);
  for (const [cls, label] of [['callout-metaphor', 'たとえるなら'], ['callout-pitfall', '落とし穴'], ['class="example"', '具体例']]) {
    const n = (html.match(new RegExp(cls, 'g')) || []).length;
    if (n < arts) E(label + 'が ' + n + '個 < 記事数 ' + arts);
  }
}

// --- JSON ---
let qs = [];
try {
  qs = JSON.parse(fs.readFileSync(W + key + '.json', 'utf8').trim().replace(/^```json\s*/, '').replace(/```\s*$/, '').trim());
} catch (e) { E('JSONが壊れているか存在しない: ' + e.message.slice(0, 80)); }

if (qs.length && qs.length !== m.quizzes) E('問題数 ' + qs.length + ' != 予定 ' + m.quizzes);
const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
qs.forEach((q, i) => {
  const want = m.prefix + '-' + String(i + 1).padStart(3, '0');
  if (q.id !== want) E('id不一致 ' + q.id + ' (期待 ' + want + ')');
  if (ids.has(q.id)) E('id重複 ' + q.id);
  if (q.level !== m.level) E('level不一致 @' + q.id);
  if (q.category !== m.category) E('category不一致 @' + q.id + ' (期待 ' + m.category + ')');
  if (!q.question || !q.explain) E('欠損フィールド @' + q.id);
  if (!Array.isArray(q.choices) || q.choices.length !== 4) E('choices!=4 @' + q.id);
  else {
    if (new Set(q.choices).size !== 4) E('選択肢が重複 @' + q.id);
    if (q.choices.some(c => !c || !c.trim())) E('空の選択肢 @' + q.id);
    const L = q.choices.map(c => c.length), mx = Math.max(...L), mn = Math.min(...L);
    if ((mx - mn) / mx > 0.30) E('長さ差30%超 @' + q.id + ' (' + L.join(',') + ')');
  }
  if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) E('answerIndex不正 @' + q.id);
  else dist[q.answerIndex]++;
  if (/選択肢\s*[0-4０-４]|[0-4]番目の選択肢/.test(q.explain)) E('解説が位置番号を参照 @' + q.id);
  if (q.explain && (q.explain.length < 150 || q.explain.length > 320)) E('解説の長さ ' + q.explain.length + '字 (150〜320) @' + q.id);
  if (!coversDistractors(q)) E('誤答3つに言及していない @' + q.id);
});
if (qs.length) {
  const lo = strat(qs, 'long'), sh = strat(qs, 'short');
  if (lo < 20 || lo > 32) E('最長戦略 ' + lo.toFixed(1) + '% (合格20〜32)');
  if (sh < 15) E('最短戦略 ' + sh.toFixed(1) + '% (合格15以上)');
  const lim = Math.max(2, Math.round(m.quizzes * 0.15));
  if (!Object.values(dist).every(v => Math.abs(v - m.quizzes / 4) <= lim)) E('正解位置の偏り ' + JSON.stringify(dist));
  console.log('最長戦略 ' + lo.toFixed(1) + '%  最短戦略 ' + sh.toFixed(1) + '%  正解位置 ' + JSON.stringify(dist));

  // 既存バンクとの実質重複
  const P = existing.map(q => ({ id: q.id, qb: bg(q.question), ab: bg(q.choices[q.answerIndex]) }));
  for (const q of qs) {
    const qb = bg(q.question), ab = bg(q.choices[q.answerIndex]);
    for (const p of P) {
      const s1 = jac(qb, p.qb); if (s1 < 0.60) continue;
      const s2 = jac(ab, p.ab);
      if (s1 >= 0.85 || s2 >= 0.50) E('既存問題と実質重複 ' + q.id + ' <-> ' + p.id + ' (問' + s1.toFixed(2) + ' 正解' + s2.toFixed(2) + ')');
    }
  }
  // モジュール内の実質重複
  const Q = qs.map(q => ({ id: q.id, qb: bg(q.question), ab: bg(q.choices[q.answerIndex]) }));
  for (let i = 0; i < Q.length; i++) for (let j = i + 1; j < Q.length; j++) {
    const s1 = jac(Q[i].qb, Q[j].qb); if (s1 < 0.60) continue;
    const s2 = jac(Q[i].ab, Q[j].ab);
    if (s1 >= 0.85 || s2 >= 0.50) E('モジュール内で実質重複 ' + Q[i].id + ' <-> ' + Q[j].id);
  }
}

if (errors.length) {
  console.log('NG ' + key + ' — ' + errors.length + '件');
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
}
console.log('OK ' + key + '  記事' + (html.match(/<article/g) || []).length + '本 / ' + qs.length + '問  すべての機械検査に合格');
