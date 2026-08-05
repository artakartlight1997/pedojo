/* ===== store.js — 進捗の永続化・間隔反復（SRS） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var KEY = 'pedojo.v1';

  var DEFAULT = {
    q: {},        // qid -> {n,c,w,box,due,last,flag}
    lec: {},      // "topic-lv" -> {read:ts, sec:{}}
    sessions: [], // 学習履歴
    settings: { theme: 'light', shuffle: true, showTimer: false, hardMode: false }
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

    /** 回答を記録し SRS を更新 */
    answer: function (qid, correct) {
      var s = load();
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
      s.lec[topic + '-' + lv] = { read: Date.now() };
      save();
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
