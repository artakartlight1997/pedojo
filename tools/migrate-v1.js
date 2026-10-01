/* ===== tools/migrate-v1.js — v1問題（27トピック×4レベル）を v2 の章・周・型にタグ付けする =====
   設計：blueprint/08_実装方針.md §5
   出力：data/v1map.js（DOJO.V1MAP = { qid: {ch, lap, type, use} }）
   - type: 11（計算）／13（場面判断）／14（用語・知識）
   - use : true＝「道」の演習（資料庫ドリル）として出題対象、false＝用語集の例文として保持（出題しない）
   原則：既存問題は削除しない。出題対象から外すだけ。 */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, body: {} };
global.location = { hash: '' };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js'); load('assets/loader2.js');
for (const f of fs.readdirSync('data/quiz')) load('data/quiz/' + f);

/* トピック→章（04_カリキュラム設計.md §10 再配置表） */
const TOPIC_CH = {
  pe: ['ch00', 'ch11'], process: ['ch02', 'ch03', 'ch06', 'ch07', 'ch01'], acct: ['ch04', 'ch02'], fa: ['ch04', 'ch05', 'ch02'],
  val: ['ch02', 'ch05'], lbo: ['ch05', 'ch03', 'ch00'], debt: ['ch05', 'ch09'], mezz: ['ch05'], synd: ['ch05'],
  struct: ['ch05'], tax: ['ch05'], legal: ['ch06', 'ch07'], spa: ['ch06'], bizdd: ['ch04'], fdd: ['ch04'],
  vc: ['ch08', 'ch09'], exit: ['ch10'], fund: ['ch11'], people: ['ch04', 'ch08'], ops: ['ch04'], network: ['ch01'],
  craft: ['ch00', 'ch07'], assoc: ['ch00'], sassoc: ['ch04'], vp: ['ch06'], dir: ['ch03'], ed: ['ch11']
};
/* 章を細かく振り分けるためのキーワード（問題文に含まれれば優先） */
const KW = [
  [/ソーシング|紹介|地銀|仲介|NDA|秘密保持|初回面談|手紙|関係/, 'ch01'],
  [/ティーザー|IM|スクリーニング|見送|倍率|コンプス|類似会社|目線|紙LBO/, 'ch02'],
  [/一次入札|意向表明|投資仮説|LOI|プロセスレター|日程|スケジュール|簡易/, 'ch03'],
  [/DD|デューデリ|QoE|Q&A|面談|視察|工場|ヒアリング|インタビュー|データルーム|VDR|正常化|調整後|運転資本|ネットデット/, 'ch04'],
  [/LBOモデル|デットスケジュール|タームシート|コベナンツ|シニア|メザニン|シンジケ|レバレッジ|ストラクチャ|SPC|税務|税制|欠損金|感応度|リターン|IRR|MOIC/, 'ch05'],
  [/ICメモ|投資委員会|IC|SPA|表明保証|補償|価格調整|ロックドボックス|完成勘定|W&I|MAC|最終入札|契約/, 'ch06'],
  [/クロージング|CP|前提条件|資金決済|サイニング|届出|独禁|外為|登記/, 'ch07'],
  [/100日|PMI|KPI|マネジメントインタビュー|経営陣|全社説明|初動/, 'ch08'],
  [/モニタリング|月次|取締役会|ボルトオン|追加買収|ウェーバー|期中|保有/, 'ch09'],
  [/exit|EXIT|売却|IPO|セカンダリー|買い手|VDD|デュアル|継続ファンド/, 'ch10'],
  [/LP|ファンド|キャリー|ウォーターフォール|管理報酬|事後|ポストモーテム|振り返り|検証/, 'ch11']
];
const LV_LAP = { b: 1, i: 2, a: 3, p: null };   // p は内容で決める

function classify(q) {
  const s = q.q + ' ' + (q.stem || '');
  let type = 13;
  if (/【計算】|いくらか|求めよ|計算せよ|何倍|何%|何億|何円/.test(s)) type = 11;
  else if (/とは何か|とは|の説明として|正しい記述|意味するもの|何と呼ぶ|呼ばれる|定義/.test(s) && !/場面|場合|局面|任された|になった|受けた|判明|提示|あなた/.test(s)) type = 14;
  else if (/場面|場合|局面|任された|になった|受けた|判明|提示|あなた|べきか|対応|実務/.test(s)) type = 13;
  else type = 14;
  let ch = null;
  for (const [re, c] of KW) { if (re.test(s)) { ch = c; break; } }
  if (!ch) ch = TOPIC_CH[q.topic] ? TOPIC_CH[q.topic][0] : 'ch00';
  // 職務編は周の視点そのもの
  let lap = LV_LAP[q.lv];
  if (q.topic === 'assoc') lap = 1; else if (q.topic === 'sassoc' || q.topic === 'vp') lap = 2; else if (q.topic === 'dir' || q.topic === 'ed') lap = 3;
  if (lap === null) lap = /ディレクター|パートナー|IC|LP|撤退|損切|降りる|決断/.test(s) ? 3 : /VP|設計|交渉|統括|主筆|専門家|部下/.test(s) ? 2 : 1;
  return { ch, lap, type };
}

const all = DOJO.allQuestions();
const map = {}; const cnt = { 11: 0, 13: 0, 14: 0 }; const perCh = {}; let use = 0;
const CAP14 = 500;   // 用語確認4択の出題上限（06 §3）
// 用語問題は「初級かつ解説が長い（丁寧）」ものを優先して残す
const t14 = [];
all.forEach(q => {
  const c = classify(q);
  // v1問題は4択で正解がa（index）。v2側では type13/14/11 の4択として扱う（11も4択のまま）
  const rec = { ch: c.ch, lap: c.lap, type: c.type === 11 ? 13 : c.type, calc: c.type === 11, use: true };
  map[q.id] = rec;
  cnt[c.type]++;
  if (c.type === 14) t14.push({ id: q.id, score: (q.exp || '').length + (q.lv === 'b' ? 200 : 0) });
});
t14.sort((a, b) => b.score - a.score);
t14.forEach((x, i) => { if (i >= CAP14) map[x.id].use = false; });
Object.keys(map).forEach(id => { if (map[id].use) use++; const k = map[id].ch + '-l' + map[id].lap; perCh[k] = (perCh[k] || 0) + (map[id].use ? 1 : 0); });

const out = '/* ===== data/v1map.js — v1問題の v2 タグ（tools/migrate-v1.js が生成。手で編集しない） =====\n'
  + '   {qid: {ch, lap, type(13|14), calc, use}} — use=false は出題対象外（用語集の例文として保持） */\n'
  + 'window.DOJO = window.DOJO || {};\nDOJO.V1MAP = ' + JSON.stringify(map) + ';\n';
fs.writeFileSync('data/v1map.js', out);
console.log('v1 questions:', all.length, '| 計算:', cnt[11], '場面判断:', cnt[13], '用語・知識:', cnt[14], '| 出題対象:', use, '| 用語の出題外:', all.length - use);
console.log(Object.keys(perCh).sort().map(k => k + ':' + perCh[k]).join('  '));
