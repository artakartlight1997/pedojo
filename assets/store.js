/* ===== store.js — 進捗の永続化・間隔反復（SRS） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var KEY = 'pedojo.v1';

  var DEFAULT = {
    q: {},        // qid -> {n,c,w,box,due,last,flag}
    lec: {},      // "topic-lv" -> {read:ts}
    sessions: [], // 学習履歴
    daily: {},    // "YYYY-MM-DD" -> {n:回答数, c:正答数, lec:読了数}
    streak: { cur: 0, best: 0, last: '' },
    settings: { theme: 'light', shuffle: true, goal: 20, showTimer: false }
  };

  var S = null;

  function load() {
    if (S) return S;
    try {
      var raw = localStorage.getItem(KEY);
      S = raw ? Object.assign({}, DEFAULT, JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULT));
      S.settings = Object.assign({}, DEFAULT.settings, S.settings || {});
    } catch (e) {
      S = JSON.parse(JSON.stringify(DEFAULT));
    }
    return S;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { /* quota */ }
  }

  // Leitner: box 0..5 / 復習間隔（日）
  var INTERVAL = [0, 1, 3, 7, 21, 60];

  function dkey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  /* ===== 段位（10段階） ===== */
  var RANKS = [
    { id: 0, name: '入門',     need: 0,    label: '道場に入ったばかり。まずはPE概論・初級から。' },
    { id: 1, name: '白帯',     need: 25,   label: '共通言語を覚え始めた。用語が「聞き取れる」段階。' },
    { id: 2, name: '黄帯',     need: 60,   label: '基礎が固まってきた。会議の議論についていける。' },
    { id: 3, name: '橙帯',     need: 110,  label: '初級を横断できる。指示された作業の意味が分かる。' },
    { id: 4, name: '緑帯',     need: 180,  label: '実務の入口。モデルとDDの構造が見えている。' },
    { id: 5, name: '青帯',     need: 260,  label: '担当者水準。自分で論点を立てられる。' },
    { id: 6, name: '茶帯',     need: 350,  label: 'ディールを主担当で回せる水準。' },
    { id: 7, name: '黒帯',     need: 450,  label: '専門家と対等に議論できる。ICで発言できる。' },
    { id: 8, name: '師範代',   need: 560,  label: 'ストラクチャーを設計し、判断を主導できる。' },
    { id: 9, name: '師範',     need: 680,  label: '現場・人・関係まで含めて、投資を完遂できる。' }
  ];

  var Store = {
    get state() { return load(); },
    save: save,

    reset: function () { S = JSON.parse(JSON.stringify(DEFAULT)); save(); },

    settings: function (patch) {
      var s = load();
      if (patch) { Object.assign(s.settings, patch); save(); }
      return s.settings;
    },

    rec: function (qid) {
      var s = load();
      return s.q[qid] || null;
    },

    /** 段位（習得数＋正答率で決まる） */
    rank: function () {
      var o = this.overall();
      var acc = o.acc === null ? 0 : o.acc;
      // 正答率が低いと段位が伸びない（実力の裏付け）
      var score = Math.round(o.mastered * Math.min(1.2, 0.6 + acc * 0.6));
      var cur = RANKS[0], next = RANKS[1];
      for (var i = 0; i < RANKS.length; i++) {
        if (score >= RANKS[i].need) { cur = RANKS[i]; next = RANKS[i + 1] || null; }
      }
      return {
        score: score, cur: cur, next: next,
        toNext: next ? Math.max(0, next.need - score) : 0,
        pct: next ? Math.min(1, (score - cur.need) / (next.need - cur.need)) : 1,
        all: RANKS
      };
    },

    /** 今日の記録 */
    today: function () {
      var s = load(), k = dkey();
      return s.daily[k] || { n: 0, c: 0, lec: 0 };
    },
    goal: function (v) {
      var s = load();
      if (typeof v === 'number') { s.settings.goal = Math.max(1, v); save(); }
      return s.settings.goal || 20;
    },
    /** 連続学習日数 */
    streakInfo: function () {
      var s = load(), k = dkey();
      var st = s.streak || { cur: 0, best: 0, last: '' };
      // 直近が昨日でも今日でもなければ、表示上は途切れている
      var alive = st.last === k || (st.last && daysBetween(st.last, k) === 1);
      return { cur: alive ? st.cur : 0, best: st.best, last: st.last, doneToday: st.last === k };
    },
    /** 直近N日のヒートマップ用データ */
    calendar: function (days) {
      var s = load(), out = [], d = new Date();
      d.setDate(d.getDate() - (days - 1));
      for (var i = 0; i < days; i++) {
        var k = dkey(d);
        out.push({ key: k, date: new Date(d), n: (s.daily[k] || {}).n || 0 });
        d.setDate(d.getDate() + 1);
      }
      return out;
    },
    /** 学習ルート上の各項目の状態を返す */
    pathStatus: function () {
      var self = this;
      return DOJO.pathItems().map(function (it) {
        var m = self.mastery(it.topic.id, it.lv);
        var read = self.isRead(it.topic.id, it.lv);
        var qn = DOJO.questionsOf(it.topic.id, it.lv).length;
        // 修了＝座学を読み、その水準の問題の6割以上を1回以上正解している
        var done = read && qn > 0 && m.mastered >= Math.ceil(qn * 0.6);
        var started = read || m.seen > 0;
        return Object.assign({}, it, { read: read, m: m, qn: qn, done: done, started: started });
      });
    },
    /** ルート上で「次にやるべき1件」 */
    nextOnPath: function () {
      var st = this.pathStatus();
      for (var i = 0; i < st.length; i++) {
        if (!st[i].ready) continue;              // 座学が未執筆の項目は飛ばす
        if (!st[i].done) return st[i];
      }
      return null;
    },
    /** 周回ごとの到達率 */
    lapProgress: function () {
      var st = this.pathStatus();
      return DOJO.LAPS.map(function (lap) {
        var items = st.filter(function (x) { return x.lv === lap.lv && x.ready; });
        var done = items.filter(function (x) { return x.done; }).length;
        return { lap: lap, total: items.length, done: done, pct: items.length ? done / items.length : 0 };
      });
    },

    /** 次にやるべきこと（モチベーション設計の中核） */
    nextActions: function () {
      var acts = [], o = this.overall();
      var due = this.dueQuestions().length;
      var t = this.today(), goal = this.goal();

      if (due > 0) {
        acts.push({ pri: 1, icon: '⟳', title: '復習箱を空にする', sub: '期限到来 ' + due + '問。ここを潰すのが最短の上達。', go: '#/review' });
      }
      if (t.n < goal) {
        acts.push({ pri: 2, icon: '◎', title: '今日の目標まであと ' + (goal - t.n) + '問', sub: '実戦ドリルで一気に片付ける。', go: '#/drill' });
      }
      // 学習ルート上の「次の1件」（順序が意味を持つので、ここが最優先の学習動線）
      var nx = this.nextOnPath();
      if (nx) {
        var lvName = DOJO.levelById(nx.lv).name;
        if (!nx.read) {
          acts.push({ pri: 0, icon: '路', title: 'ルートの次：' + nx.stage.short + '／' + nx.topic.short + '・' + lvName,
            sub: nx.stage.q + ' — まず座学を読む。', go: '#/lecture/' + nx.topic.id + '/' + nx.lv });
        } else {
          acts.push({ pri: 3, icon: '路', title: 'ルートの次：' + nx.topic.short + '・' + lvName + ' のクイズ',
            sub: '座学は読了。あと ' + Math.max(0, Math.ceil(nx.qn * 0.6) - nx.m.mastered) + '問の正解で修了。', go: '#/quiz/' + nx.topic.id + '/' + nx.lv });
        }
      }
      // 最も弱いトピック
      var weak = DOJO.weakTopics()[0];
      if (weak) {
        acts.push({ pri: 4, icon: '△', title: '弱点：' + weak.topic.short + '・' + weak.level.name,
          sub: '正答率 ' + Math.round(weak.m.acc * 100) + '%。座学に戻って解き直す。', go: '#/quiz/' + weak.topic.id + '/' + weak.level.id });
      }
      if (o.seen >= 60 && o.acc !== null && o.acc >= 0.75) {
        acts.push({ pri: 5, icon: '試', title: '模擬IC試験で実力を測る', sub: '通算正答率 ' + Math.round(o.acc * 100) + '%。試験モードで通しの判断力を確認。', go: '#/exam' });
      }
      return acts.sort(function (a, b) { return a.pri - b.pri; }).slice(0, 4);
    },

    /** 回答を記録し、SRS・日次記録・ストリークを更新 */
    answer: function (qid, correct) {
      var s = load();
      var k = dkey();
      var d = s.daily[k] || (s.daily[k] = { n: 0, c: 0, lec: 0 });
      d.n++; if (correct) d.c++;
      var st = s.streak || (s.streak = { cur: 0, best: 0, last: '' });
      if (st.last !== k) {
        st.cur = (st.last && daysBetween(st.last, k) === 1) ? st.cur + 1 : 1;
        st.last = k;
        if (st.cur > st.best) st.best = st.cur;
      }
      var r = s.q[qid] || { n: 0, c: 0, w: 0, box: 0, due: 0, last: 0, flag: false };
      r.n++;
      if (correct) { r.c++; r.box = Math.min(5, r.box + 1); }
      else { r.w++; r.box = Math.max(0, r.box - 2); }
      r.last = Date.now();
      r.due = Date.now() + INTERVAL[r.box] * 86400000;
      s.q[qid] = r;
      save();
      return r;
    },

    toggleFlag: function (qid) {
      var s = load();
      var r = s.q[qid] || { n: 0, c: 0, w: 0, box: 0, due: 0, last: 0, flag: false };
      r.flag = !r.flag;
      s.q[qid] = r; save();
      return r.flag;
    },

    markRead: function (topic, lv) {
      var s = load();
      if (!s.lec[topic + '-' + lv]) {
        var k = dkey();
        var d = s.daily[k] || (s.daily[k] = { n: 0, c: 0, lec: 0 });
        d.lec++;
      }
      s.lec[topic + '-' + lv] = { read: Date.now() };
      save();
    },
    readCount: function () { return Object.keys(load().lec).length; },
    lectureTotal: function () {
      var n = 0;
      DOJO.TOPICS.forEach(function (t) {
        DOJO.LEVELS.forEach(function (l) { if (DOJO.LECTURES[t.id] && DOJO.LECTURES[t.id][l.id]) n++; });
      });
      return n;
    },
    isRead: function (topic, lv) { return !!load().lec[topic + '-' + lv]; },

    logSession: function (o) {
      var s = load();
      s.sessions.unshift(Object.assign({ ts: Date.now() }, o));
      s.sessions = s.sessions.slice(0, 300);
      save();
    },

    /** 復習箱：間違えた / 期限到来 / フラグ付き */
    dueQuestions: function () {
      var s = load(), now = Date.now(), out = [];
      DOJO.allQuestions().forEach(function (q) {
        var r = s.q[q.id];
        if (!r) return;
        if (r.flag || (r.w > 0 && r.box < 4 && r.due <= now) || (r.n > 0 && r.box <= 2 && r.due <= now)) out.push(q);
      });
      return out;
    },
    wrongQuestions: function () {
      var s = load();
      return DOJO.allQuestions().filter(function (q) { var r = s.q[q.id]; return r && r.w > 0 && r.box < 5; });
    },
    flaggedQuestions: function () {
      var s = load();
      return DOJO.allQuestions().filter(function (q) { var r = s.q[q.id]; return r && r.flag; });
    },
    unseenQuestions: function (list) {
      var s = load();
      return list.filter(function (q) { return !s.q[q.id]; });
    },

    /** トピック×レベルの習熟度 0-1（box>=3 を習得とみなす） */
    mastery: function (topic, lv) {
      var s = load(), list = DOJO.questionsOf(topic, lv);
      if (!list.length) return { total: 0, seen: 0, mastered: 0, pct: 0, acc: null };
      var seen = 0, mastered = 0, c = 0, n = 0;
      list.forEach(function (q) {
        var r = s.q[q.id];
        if (r) { seen++; n += r.n; c += r.c; if (r.box >= 3) mastered++; }
      });
      return {
        total: list.length, seen: seen, mastered: mastered,
        pct: mastered / list.length,
        acc: n ? c / n : null
      };
    },

    overall: function () {
      var s = load(), all = DOJO.allQuestions();
      var seen = 0, mastered = 0, n = 0, c = 0;
      all.forEach(function (q) {
        var r = s.q[q.id];
        if (r) { seen++; n += r.n; c += r.c; if (r.box >= 3) mastered++; }
      });
      return { total: all.length, seen: seen, mastered: mastered, attempts: n, correct: c, acc: n ? c / n : null };
    },

    exportJSON: function () { return JSON.stringify(load(), null, 2); },
    importJSON: function (txt) {
      var o = JSON.parse(txt);
      S = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), o);
      save(); return true;
    }
  };

  DOJO.Store = Store;
})(window);
