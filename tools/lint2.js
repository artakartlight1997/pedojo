/* ===== tools/lint2.js — v2 コンテンツの品質ゲート（blueprint/08 §6） =====
   使い方: node tools/lint2.js   → 最終行 "lint2 clean" で合格 */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, body: {} };
global.location = { hash: '' };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js'); load('assets/loader2.js');
load('assets/store.js'); load('assets/engine.js'); load('assets/exercise.js');
function loadIf(p) { if (fs.existsSync(p)) load(p); }
for (const u of DOJO.v2Files()) loadIf(u);

const errors = [], warns = [];
const foreign = /[Ѐ-ӿ가-힯À-ÖØ-öø-ÿĀ-ɏ]|[组变说们电买卖场读习证实资评价视频讲两见时对开关问经济书发计划为头规继续单总论个选无这长]/;
function textCheck(id, label, s) {
  if (typeof s !== 'string') return;
  const m = s.match(new RegExp('.{0,10}' + foreign.source + '+.{0,10}'));
  if (m) errors.push(id + ' 非日本語文字 (' + label + '): ' + m[0]);
}
function walk(id, label, v) {
  if (typeof v === 'string') textCheck(id, label, v);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(id, label + '[' + i + ']', x));
  else if (v && typeof v === 'object') Object.keys(v).forEach(k => walk(id, label + '.' + k, v[k]));
}

/* ---- 講義 ---- */
const lecs = Object.values(DOJO.LECTURES2);
lecs.forEach(l => {
  if (l.missing.length) errors.push(l.id + ' 講義の節が欠落: ' + l.missing.join(','));
  if (!DOJO.chapterById(l.chapter)) errors.push(l.id + ' 不明な章 ' + l.chapter);
  if (!l.skills || !l.skills.length) errors.push(l.id + ' skills 無し');
  (l.skills || []).forEach(k => { if (!DOJO.SKILLMAP[k]) errors.push(l.id + ' 不明なスキル ' + k); });
  const body = ['what', 'output', 'model', 'kata', 'pitfalls', 'next'].map(k => l.sections[k] || '').join('');
  if (body.length < 1800) warns.push(l.id + ' 講義本文が短い (' + body.length + '字)');
  if (body.length > 9000) warns.push(l.id + ' 講義本文が長い (' + body.length + '字)');
  const terms = l.sections.terms;
  if (Array.isArray(terms) && terms.length > 10) warns.push(l.id + ' §6 用語が10語超 (' + terms.length + ')');
  walk(l.id, 'lecture', l.sections);
});

/* ---- 演習 ---- */
const qs = DOJO.allQuestions2();
let solv = 0;
const typeCount = {};
qs.forEach(q => {
  typeCount[q.type] = (typeCount[q.type] || 0) + 1;
  if (!DOJO.QTYPES[q.type]) errors.push(q.id + ' 不明な型 ' + q.type);
  if (!q.skills || !q.skills.length) errors.push(q.id + ' skills 無し');
  (q.skills || []).forEach(k => { if (!DOJO.SKILLMAP[k]) errors.push(q.id + ' 不明なスキル ' + k); });
  const exp = q.exp || q.why || q.rationale || '';
  if (q.type === 13 || q.type === 14) {
    if (!q.choices || q.choices.length !== 4) errors.push(q.id + ' 4択でない');
    else {
      const L = q.choices.map(c => c.length), s = [...L].sort((a, b) => b - a);
      if (L[q.a] === s[0] && s[0] > s[1] * 1.10) { solv++; errors.push(q.id + ' 正解が長さで分かる (SOLV)'); }
      if (q.a !== 0) warns.push(q.id + ' a!=0（規約は正解を先頭に）');
    }
    if (exp.length < 60) errors.push(q.id + ' 解説が短い');
  }
  if (q.type === 11) { if (!q.answer || typeof q.answer.value !== 'number') errors.push(q.id + ' answer.value 無し'); if (!/検算/.test(exp)) errors.push(q.id + ' 計算問題に「検算」が無い'); }
  if (q.type === 9) { if (!q.answer) errors.push(q.id + ' answer 無し'); if (!/検算/.test(exp)) errors.push(q.id + ' リターン分解に「検算」が無い'); }
  if (q.type === 8) { if (typeof q.baseRate !== 'number') errors.push(q.id + ' baseRate 無し'); }
  if (q.type === 2) { if (!q.vignette || !q.hypothesis || !q.newFact || !q.expert) errors.push(q.id + ' 確信度更新の要素欠落'); }
  if (q.type === 3) { if (!q.items || !q.expertOrder || q.items.length !== q.expertOrder.length) errors.push(q.id + ' 並べ替えの items/expertOrder 不整合'); if (!q.rationale) errors.push(q.id + ' rationale 無し'); }
  if (q.type === 10) { if (!q.items || !q.order || q.items.length !== q.order.length) errors.push(q.id + ' 順序の items/order 不整合'); }
  if (q.type === 4) { if (!q.model || !q.bugs || !q.bugs.length) errors.push(q.id + ' model/bugs 無し'); q.bugs && q.bugs.forEach(b => { if (!q.model[b.row]) errors.push(q.id + ' bugs.row 範囲外'); }); }
  if (q.type === 5) { if (!q.candidates || q.candidates.length < 3 || q.best == null) errors.push(q.id + ' candidates/best 無し'); }
  if (DOJO.GENERATIVE_TYPES[q.type]) { if (!q.rubric || !DOJO.RUBRICS[q.rubric]) errors.push(q.id + ' 生成型にルーブリック無し/不明: ' + q.rubric); if (!q.exemplar) errors.push(q.id + ' 模範(exemplar)無し'); }
  walk(q.id, 'q', q);
});
const total = qs.length;
const t14 = typeCount[14] || 0;
if (total && t14 / total > 0.10) warns.push('用語確認4択が10%超 (' + t14 + '/' + total + ')');

/* ---- ケース ---- */
Object.values(DOJO.CASES).forEach(cs => {
  if (!cs.title) errors.push(cs.id + ' title 無し');
  if (!cs.situation.length) errors.push(cs.id + ' situation 無し');
  if (!cs.tasks.length) errors.push(cs.id + ' tasks 無し');
  cs.tasks.forEach(t => {
    if (!t.id || !t.deliverable || !t.brief) errors.push(cs.id + '#' + (t.id || '?') + ' 課題の要素欠落');
    if (!t.rubric || !DOJO.RUBRICS[t.rubric]) errors.push(cs.id + '#' + t.id + ' ルーブリック無し/不明: ' + t.rubric);
    if (!t.pro || !t.pro.text) errors.push(cs.id + '#' + t.id + ' プロの成果物無し');
    if (!t.skills || !t.skills.length) errors.push(cs.id + '#' + t.id + ' skills 無し');
    (t.lectures || []).forEach(lid => { if (!DOJO.LECTURES2[lid]) warns.push(cs.id + '#' + t.id + ' 参照講義が未作成: ' + lid); });
  });
  if (cs.id.indexOf('spine/') === 0 && cs.chapter !== 'ch00' && !cs.newInfo.length) warns.push(cs.id + ' 新情報の投下が無い');
  walk(cs.id, 'case', cs);
});
Object.values(DOJO.RUBRICS).forEach(r => { r.criteria.forEach(c => { ['analyst', 'associate', 'vp'].forEach(b => { if (!c.bands[b]) errors.push(r.id + ' バンド欠落 ' + c.name + '/' + b); }); }); walk(r.id, 'rubric', r); });
if (DOJO.COMPANY) walk('company', 'company', DOJO.COMPANY);

/* ---- 集計 ---- */
const perCh = DOJO.CHAPTERS.map(c => {
  const row = [c.id];
  [1, 2, 3].forEach(l => { row.push('講' + DOJO.lecturesOf(c.id, l).length + '/演' + DOJO.questionsOf2(c.id, l).length); });
  const cs = DOJO.caseById(c.caseId);
  row.push(cs ? '課題' + [1, 2, 3].map(l => cs.tasks.filter(t => (t.lap || 1) === l).length).join('/') : '課題-');
  return row.join('  ');
});
console.log('v2: lectures=' + lecs.length + ' questions=' + total + ' cases=' + Object.keys(DOJO.CASES).length + ' rubrics=' + Object.keys(DOJO.RUBRICS).length);
console.log(perCh.join('\n'));
const dist = Object.keys(typeCount).sort((a, b) => a - b).map(t => 'T' + t + ':' + typeCount[t]).join(' ');
console.log('type distribution: ' + dist);
console.log('SOLV=' + solv);
if (warns.length) console.log('WARN (' + warns.length + '):\n' + warns.slice(0, 30).join('\n') + (warns.length > 30 ? '\n...' : ''));
if (errors.length) { console.log('ERRORS (' + errors.length + '):\n' + errors.slice(0, 60).join('\n')); process.exit(1); }
console.log('lint2 clean');
