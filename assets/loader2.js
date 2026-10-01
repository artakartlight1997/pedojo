/* ===== loader2.js — v2 コンテンツ（工程講義・演習・ケース・ルーブリック）の登録と読み込み =====
   設計：blueprint/08_実装方針.md §3
   v1 の loader.js（DOJO.lecture / DOJO.quiz / DOJO.glossary）はそのまま残し、v2 は別の入口を持つ。 */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};

  DOJO.LECTURES2 = {};   // id -> lecture object
  DOJO.BANK2 = {};       // "chNN-lK" -> [item]
  DOJO.CASES = {};       // "spine/ch02" | "branch-A" -> case object
  DOJO.RUBRICS = {};     // id -> rubric
  DOJO.COMPANY = null;   // 通しケースの会社設定

  var SECTION_KEYS = ['what', 'output', 'model', 'kata', 'pitfalls', 'terms', 'next'];
  DOJO.LECTURE_SECTIONS = [
    { key: 'what',     no: '§1', title: 'この工程は何か' },
    { key: 'output',   no: '§2', title: '成果物と評価基準' },
    { key: 'model',    no: '§3', title: 'プロの手本' },
    { key: 'kata',     no: '§4', title: '型（手順）' },
    { key: 'pitfalls', no: '§5', title: '落とし穴' },
    { key: 'terms',    no: '§6', title: 'その場の用語' },
    { key: 'next',     no: '§7', title: '次にやること' }
  ];

  /** 工程講義の登録（固定7節） */
  DOJO.lecture2 = function (obj) {
    if (!obj || !obj.id) throw new Error('lecture2: id が必要');
    obj.sections = obj.sections || {};
    obj.missing = SECTION_KEYS.filter(function (k) { return !obj.sections[k]; });
    obj.lap = obj.lap || 1;
    DOJO.LECTURES2[obj.id] = obj;
  };
  DOJO.lecturesOf = function (chapterId, lap) {
    return Object.keys(DOJO.LECTURES2).map(function (k) { return DOJO.LECTURES2[k]; })
      .filter(function (l) { return l.chapter === chapterId && (!lap || l.lap === parseInt(lap, 10)); })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0) || a.id.localeCompare(b.id); });
  };

  /** 問題型の定義（06_問題と演習の設計.md §2） */
  DOJO.QTYPES = {
    1:  { name: 'ケース設問',        judge: 5 },
    2:  { name: '確信度更新',        judge: 5 },
    3:  { name: '優先順位の並べ替え', judge: 4 },
    4:  { name: 'モデルの誤り発見',  judge: 4 },
    5:  { name: '最初に確認する数字', judge: 4 },
    6:  { name: 'ICの質問を書く',    judge: 4 },
    7:  { name: 'プレモーテム',      judge: 4 },
    8:  { name: '基準率・外部視点',  judge: 3 },
    9:  { name: 'リターン分解',      judge: 3 },
    10: { name: '順序・プロセス',    judge: 2 },
    11: { name: '紙計算',            judge: 2 },
    12: { name: 'メモの赤入れ',      judge: 3 },
    13: { name: '場面判断',          judge: 3 },
    14: { name: '用語確認',          judge: 1 }
  };
  DOJO.GENERATIVE_TYPES = { 6: 1, 7: 1, 12: 1, 1: 1 };

  /** v2 演習の登録: DOJO.quiz2('ch02', 1, [...]) */
  DOJO.quiz2 = function (chapterId, lap, arr) {
    var key = chapterId + '-l' + lap;
    var base = DOJO.BANK2[key] || (DOJO.BANK2[key] = []);
    for (var i = 0; i < arr.length; i++) {
      var q = arr[i];
      q.chapter = chapterId; q.lap = parseInt(lap, 10);
      q.type = parseInt(q.type, 10) || 13;
      if (!q.id) q.id = key + '-' + String(base.length + 1).padStart(3, '0');
      q.v2 = true;
      base.push(q);
    }
  };
  DOJO.questionsOf2 = function (chapterId, lap) {
    return (DOJO.BANK2[chapterId + '-l' + lap] || []).slice();
  };
  DOJO.allQuestions2 = function () {
    var out = [];
    Object.keys(DOJO.BANK2).forEach(function (k) { out = out.concat(DOJO.BANK2[k]); });
    return out;
  };
  DOJO.questionById2 = function (id) {
    var all = DOJO.allQuestions2();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  };
  /** v2 の固定セット（進捗の単位）。混合出題は exercise.js の buildMixed で別に作る */
  DOJO.setsFor2 = function (chapterId, lap) {
    var list = DOJO.questionsOf2(chapterId, lap);
    var out = [];
    for (var i = 0; i < list.length; i += DOJO.SET_SIZE) {
      out.push({ i: out.length, qids: list.slice(i, i + DOJO.SET_SIZE).map(function (q) { return q.id; }) });
    }
    if (out.length >= 2 && out[out.length - 1].qids.length < 3) {
      var last = out.pop();
      out[out.length - 1].qids = out[out.length - 1].qids.concat(last.qids);
    }
    return out;
  };

  /** ケース章の登録 */
  DOJO.caseChapter = function (obj) {
    if (!obj || !obj.id) throw new Error('caseChapter: id が必要');
    obj.tasks = obj.tasks || [];
    obj.situation = obj.situation || [];
    obj.newInfo = obj.newInfo || [];
    DOJO.CASES[obj.id] = obj;
  };
  DOJO.caseById = function (id) { return DOJO.CASES[id] || null; };
  /** 2周目・3周目の課題・資料・新情報を既存ケースに追記する（別ファイルから）。
      situation の各資料と newInfo には lap を付けると、その周でだけ表示される。 */
  DOJO.caseAppend = function (obj) {
    var cs = DOJO.CASES[obj.id];
    if (!cs) { DOJO.CASES[obj.id] = cs = { id: obj.id, chapter: obj.chapter, title: obj.title || obj.id, tasks: [], situation: [], newInfo: [] }; }
    (obj.situation || []).forEach(function (d) { if (!d.lap) d.lap = obj.lap || 2; cs.situation.push(d); });
    (obj.tasks || []).forEach(function (t) { if (!t.lap) t.lap = obj.lap || 2; cs.tasks.push(t); });
    (obj.newInfo || []).forEach(function (n) { if (!n.lap) n.lap = obj.lap || 2; cs.newInfo.push(n); });
    if (obj.intro) { cs.introByLap = cs.introByLap || {}; cs.introByLap[obj.lap || 2] = obj.intro; }
    if (obj.trap) { cs.trapByLap = cs.trapByLap || {}; cs.trapByLap[obj.lap || 2] = obj.trap; }
    if (obj.openIssue) { cs.openIssueByLap = cs.openIssueByLap || {}; cs.openIssueByLap[obj.lap || 2] = obj.openIssue; }
    if (obj.calibration) { cs.calibrationByLap = cs.calibrationByLap || {}; cs.calibrationByLap[obj.lap || 2] = obj.calibration; }
  };
  DOJO.company = function (obj) { DOJO.COMPANY = obj; };

  /** ルーブリックの登録 */
  DOJO.rubric = function (obj) {
    if (!obj || !obj.id) throw new Error('rubric: id が必要');
    obj.total = obj.total || obj.criteria.reduce(function (s, c) { return s + (c.pts || 0); }, 0);
    obj.pass = obj.pass || { associate: Math.round(obj.total * 0.6), vp: Math.round(obj.total * 0.8) };
    DOJO.RUBRICS[obj.id] = obj;
  };
  DOJO.BAND_WEIGHT = { analyst: 0.4, associate: 0.7, vp: 1.0 };
  DOJO.BAND_NAME = { analyst: 'アナリスト', associate: 'アソシエイト', vp: 'VP' };
  DOJO.scoreRubric = function (rubricId, grades, deductions) {
    var r = DOJO.RUBRICS[rubricId];
    if (!r) return null;
    var pts = 0;
    r.criteria.forEach(function (c, i) {
      var b = grades && grades[i];
      if (b && DOJO.BAND_WEIGHT[b] != null) pts += c.pts * DOJO.BAND_WEIGHT[b];
    });
    (r.deductions || []).forEach(function (d, i) {
      if (deductions && deductions[i]) pts += d.pts;   // pts は負数
    });
    pts = Math.max(0, Math.round(pts));
    var band = pts >= r.pass.vp ? 'vp' : pts >= r.pass.associate ? 'associate' : 'analyst';
    return { pts: pts, total: r.total, band: band };
  };

  /** v2 ファイル一覧（file:// でも動くよう、ディレクトリ列挙ではなく規約で決める） */
  DOJO.v2Files = function () {
    var urls = ['data/rubrics.js', 'data/cases/spine/company.js'];
    DOJO.CHAPTERS.forEach(function (c) {
      DOJO.LAPS2.forEach(function (l) {
        urls.push('data/lectures2/' + c.id + '-l' + l.id + '.js');
        urls.push('data/quiz2/' + c.id + '-l' + l.id + '.js');
      });
      urls.push('data/cases/spine/' + c.id + '.js');
      urls.push('data/cases/spine/' + c.id + '-l2.js');
      urls.push('data/cases/spine/' + c.id + '-l3.js');
    });
    DOJO.BRANCHES.forEach(function (b) { urls.push('data/cases/' + b.id + '.js'); });
    return urls;
  };
})(window);

/* ===== v1問題の v2 タグ付け（data/v1map.js を tools/migrate-v1.js が生成） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO;
  var TOPIC_DOMAIN = { pe: 'G', process: 'D', acct: 'A', fa: 'A', val: 'A', lbo: 'A', debt: 'C', mezz: 'C', synd: 'C', struct: 'C', tax: 'C',
    legal: 'D', spa: 'D', bizdd: 'B', fdd: 'B', vc: 'F', exit: 'F', fund: 'G', people: 'E', ops: 'E', network: 'E',
    craft: 'G', assoc: 'G', sassoc: 'G', vp: 'G', dir: 'G', ed: 'G' };
  DOJO.applyV1Map = function () {
    var map = DOJO.V1MAP; if (!map) return 0;
    var n = 0;
    DOJO.allQuestions().forEach(function (q) {
      var r = map[q.id]; if (!r) return;
      q.type = r.type; q.chapter = r.ch; q.lap = r.lap; q.v1 = true; q.use = r.use; q.calc = !!r.calc;
      q.skills = [(TOPIC_DOMAIN[q.topic] || 'G') + r.lap];
      n++;
    });
    return n;
  };
  /** 章×周に紐づく v1 問題（出題対象のみ） */
  DOJO.v1QuestionsOf = function (ch, lap) {
    lap = parseInt(lap, 10);
    return DOJO.allQuestions().filter(function (q) { return q.v1 && q.use && q.chapter === ch && q.lap === lap; });
  };
  var _byId2 = DOJO.questionById2;
  DOJO.questionById2 = function (id) { return _byId2(id) || DOJO.questionById(id); };
})(window);
