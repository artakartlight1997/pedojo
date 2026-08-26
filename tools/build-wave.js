#!/usr/bin/env node
// 座学モジュールの1波分を検証してサイトに取り込む。
//   node tools/build-wave.js [--dir <出力ディレクトリ>] [--dry] [--skip n043,n045]
// content-plan.json の status:"pending" のうち、HTML/JSONが揃っているものだけを対象にする。
// 1つでも品質基準を外れたら、何も書き込まずに中断する。
const fs = require('fs');
const path = require('path');

const R = path.resolve(__dirname, '..') + '/';
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const di = args.indexOf('--dir');
const W = (di >= 0 ? args[di + 1] : '/tmp/claude-0/-home-user-pedojo/893b4741-54cb-5437-b3b9-b8d49a7fe4a8/scratchpad/w') + '/';

const plan = JSON.parse(fs.readFileSync(R + 'content-plan.json', 'utf8'));

// ---------- 指標 ----------
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

// ---------- 既存バンク ----------
const src = fs.readFileSync(R + 'js/terms-data.js', 'utf8');
const em = src.match(/var TERM_QUESTIONS = (\[[\s\S]*\]);\s*$/m);
if (!em) throw new Error('TERM_QUESTIONS が見つかりません');
const existing = JSON.parse(em[1]);
const ids = new Set(existing.map(q => q.id));

const si = args.indexOf('--skip');
const SKIP = new Set(si >= 0 ? (args[si + 1] || '').split(',').map(s => s.trim()).filter(Boolean) : []);

const ready = plan.modules.filter(m =>
  m.status === 'pending' && !SKIP.has(m.key) &&
  fs.existsSync(W + m.key + '.html') && fs.existsSync(W + m.key + '.json'));
if (SKIP.size) console.log('今回は除外: ' + [...SKIP].join(', ') + '\n');

if (!ready.length) { console.log('取り込める完成モジュールがありません。'); process.exit(0); }

const errors = [];
const parsed = {};
const added = [];

for (const m of ready) {
  const E = msg => errors.push(m.key + ': ' + msg);
  let html = fs.readFileSync(W + m.key + '.html', 'utf8').trim()
    .replace(/^```html\s*/, '').replace(/```\s*$/, '').trim();
  if (html.includes('&lt;section')) {
    html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
  }

  // --- HTML ---
  if (!html.startsWith('<section class="study-section" id="' + m.id + '">')) E('sectionの開始タグが不正');
  if (!html.endsWith('</section>')) E('</section>で終わっていない');
  for (const t of ['section', 'article', 'p', 'li', 'ol', 'h3', 'div', 'strong']) {
    const o = (html.match(new RegExp('<' + t + '[ >]', 'g')) || []).length;
    const c = (html.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) E('タグ不一致 <' + t + '> ' + o + '/' + c);
  }
  if (/&lt;\/?(section|article|div|h[23]|ol|ul|li|strong|p)[ &>]/.test(html)) E('構造タグがエスケープされたまま');
  if (/&amp;amp;|<\/jli>|<\/pli>|<\/il>/.test(html)) E('二重エスケープまたは閉じタグの誤り');
  const arts = (html.match(/<article/g) || []).length;
  if (arts < m.articles) E('記事数 ' + arts + ' < 予定 ' + m.articles);
  for (const [cls, label] of [['callout-metaphor', 'たとえるなら'], ['callout-pitfall', '落とし穴'], ['class="example"', '具体例']]) {
    const n = (html.match(new RegExp(cls.replace(/"/g, '"'), 'g')) || []).length;
    if (n < arts) E(label + 'が ' + n + '個 < 記事数 ' + arts);
  }

  // --- JSON ---
  let qs;
  try {
    qs = JSON.parse(fs.readFileSync(W + m.key + '.json', 'utf8').trim()
      .replace(/^```json\s*/, '').replace(/```\s*$/, '').trim());
  } catch (e) { E('JSONが壊れています: ' + e.message.slice(0, 60)); qs = []; }

  if (qs.length !== m.quizzes) E('問題数 ' + qs.length + ' != 予定 ' + m.quizzes);
  const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
  let wide = 0, noCover = [], posRef = [];
  qs.forEach((q, i) => {
    const want = m.prefix + '-' + String(i + 1).padStart(3, '0');
    if (q.id !== want) E('id不一致 ' + q.id + ' (期待 ' + want + ')');
    if (ids.has(q.id)) E('id重複 ' + q.id);
    if (q.level !== m.level) E('level不一致 @' + q.id);
    if (q.category !== m.category) E('category不一致 @' + q.id);
    if (!q.question || !q.explain) E('欠損フィールド @' + q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 4) E('choices!=4 @' + q.id);
    else {
      if (new Set(q.choices).size !== 4) E('選択肢が重複 @' + q.id);
      if (q.choices.some(c => !c || !c.trim())) E('空の選択肢 @' + q.id);
      const L = q.choices.map(c => c.length), mx = Math.max(...L), mn = Math.min(...L);
      if ((mx - mn) / mx > 0.30) wide++;
    }
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3) E('answerIndex不正 @' + q.id);
    else dist[q.answerIndex]++;
    if (/選択肢\s*[0-4０-４]|[0-4]番目の選択肢/.test(q.explain)) posRef.push(q.id);
    if (!coversDistractors(q)) noCover.push(q.id);
    ids.add(q.id);
  });
  const lo = strat(qs, 'long'), sh = strat(qs, 'short');
  if (lo < 20 || lo > 32) E('最長戦略 ' + lo.toFixed(1) + '% (合格20〜32)');
  if (sh < 15) E('最短戦略 ' + sh.toFixed(1) + '% (合格15以上)');
  if (wide) E('長さ差30%超 ' + wide + '件');
  if (noCover.length) E('誤答3つに言及していない ' + noCover.length + '件: ' + noCover.slice(0, 5).join(','));
  if (posRef.length) E('解説が位置番号を参照 ' + posRef.length + '件');
  const lim = Math.max(2, Math.round(m.quizzes * 0.15));
  if (!Object.values(dist).every(v => Math.abs(v - m.quizzes / 4) <= lim)) E('正解位置の偏り ' + JSON.stringify(dist));

  parsed[m.key] = { html, qs };
  added.push(...qs);
  console.log((errors.some(e => e.startsWith(m.key + ':')) ? 'NG  ' : 'OK  ') +
    m.key + '  ' + String(arts).padStart(3) + '記事 ' + String(qs.length).padStart(3) + '問  最長 ' +
    lo.toFixed(1) + '%  最短 ' + sh.toFixed(1) + '%  ' + m.title);
}

// --- 実質重複 ---
const all = existing.concat(added);
const P = all.map(q => ({ id: q.id, qb: bg(q.question), ab: bg(q.choices[q.answerIndex]) }));
const newIds = new Set(added.map(q => q.id));
for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
  const qs2 = jac(P[i].qb, P[j].qb); if (qs2 < 0.60) continue;
  const as = jac(P[i].ab, P[j].ab);
  if (qs2 < 0.85 && as < 0.50) continue;
  if (newIds.has(P[i].id) || newIds.has(P[j].id))
    errors.push('実質重複: ' + P[i].id + ' <-> ' + P[j].id + ' (問' + qs2.toFixed(2) + ' 正解' + as.toFixed(2) + ')');
}

if (errors.length) {
  console.log('\n--- 不合格 ' + errors.length + '件。何も書き込まずに中断します ---');
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
}
if (DRY) { console.log('\n--dry のため書き込みませんでした。' + ready.length + 'モジュール / ' + added.length + '問が取り込み可能です。'); process.exit(0); }

// --- 挿入 ---
const byPage = {};
for (const m of ready) (byPage[m.page] = byPage[m.page] || []).push(m);
for (const [page, mods] of Object.entries(byPage)) {
  const marker = plan.pages.find(p => p.file === page).marker;
  const mk = '<!-- STUDY_CONTENT_' + marker + '_END -->';
  let doc = fs.readFileSync(R + page, 'utf8');
  const at = doc.indexOf(mk);
  if (at < 0) throw new Error(page + ': 挿入マーカーが見つかりません');
  doc = doc.slice(0, at) + mods.map(m => parsed[m.key].html).join('\n\n') + '\n\n' + doc.slice(at);
  fs.writeFileSync(R + page, doc);
  console.log('挿入 ' + page + ' に ' + mods.length + 'モジュール');
}

// --- クイズをマージ ---
const header = `/*
 * 投資プロ5000本ノック — 用語・シナリオ問題バンク(TERM_QUESTIONS) 計 ${all.length} 問。
 * 座学の各記事に紐づけて作成し、計算問題ジェネレーター(calc-generators.js)と
 * 組み合わせて5000本ノックの出題プールを構成する。
 *
 * 品質基準(tools/build-wave.js が機械検査):
 *  - 誤答は「内容を理解していない人が本気で選びうるもの」
 *  - 選択肢4つの文字数差は最長の30%以内
 *  - 「最長の選択肢を選ぶだけ」「最短の選択肢を選ぶだけ」の期待正答率が
 *    4択のランダム期待値(25%)から乖離しない(同点はランダム選択として計上)
 *  - 解説は誤答3つすべてについて「なぜ違うのか」に言及する
 *  - 解説は選択肢を位置番号で参照しない(並び替えで壊れるため)
 */
var TERM_QUESTIONS = ${JSON.stringify(all, null, 2)};
`;
fs.writeFileSync(R + 'js/terms-data.js', header);

// --- 進捗を更新 ---
for (const m of ready) plan.modules.find(x => x.key === m.key).status = 'done';
fs.writeFileSync(R + 'content-plan.json', JSON.stringify(plan, null, 2));

const done = plan.modules.filter(m => m.status === 'done').length;
console.log('\nクイズ: ' + existing.length + ' -> ' + all.length + ' 問 (+' + added.length + ')');
console.log('全体の最長戦略 ' + strat(all, 'long').toFixed(1) + '%  最短戦略 ' + strat(all, 'short').toFixed(1) + '%');
console.log('計画の進捗: ' + done + ' / ' + plan.modules.length + ' モジュール完了');
