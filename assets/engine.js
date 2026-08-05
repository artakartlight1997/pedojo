/* ===== engine.js — 出題エンジン（セッション管理・採点・選択肢シャッフル） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * 出題セッション
   * opts: {questions:[], mode:'study'|'drill'|'exam'|'review', title, topic, lv,
   *        shuffleQ:bool, shuffleC:bool, limit:number, instant:bool}
   */
  function Session(opts) {
    var qs = opts.questions.slice();
    if (opts.shuffleQ !== false) qs = shuffle(qs);
    if (opts.limit) qs = qs.slice(0, opts.limit);

    this.opts = opts;
    this.mode = opts.mode || 'drill';
    this.title = opts.title || 'ドリル';
    this.items = qs.map(function (q) {
      var order = q.choices.map(function (_, i) { return i; });
      if (opts.shuffleC !== false && !q.noshuffle) order = shuffle(order);
      return { q: q, order: order, picked: null, correct: null, revealed: false };
    });
    this.idx = 0;
    this.startedAt = Date.now();
    this.finished = false;
  }

  Session.prototype = {
    get cur() { return this.items[this.idx]; },
    get total() { return this.items.length; },
    get answered() { return this.items.filter(function (it) { return it.picked !== null; }).length; },
    get correctCount() { return this.items.filter(function (it) { return it.correct === true; }).length; },
    get wrongItems() { return this.items.filter(function (it) { return it.correct === false; }); },

    /** displayIndex（表示順のインデックス）で回答 */
    pick: function (displayIndex) {
      var it = this.cur;
      if (it.revealed) return it;
      var origIndex = it.order[displayIndex];
      it.picked = displayIndex;
      it.pickedOrig = origIndex;
      it.correct = (origIndex === it.q.a);
      it.revealed = true;
      DOJO.Store.answer(it.q.id, it.correct);
      return it;
    },

    correctDisplayIndex: function (it) {
      return it.order.indexOf(it.q.a);
    },

    next: function () {
      if (this.idx < this.items.length - 1) { this.idx++; return true; }
      this.finished = true; return false;
    },
    prev: function () {
      if (this.idx > 0) { this.idx--; return true; }
      return false;
    },
    goto: function (i) {
      if (i >= 0 && i < this.items.length) { this.idx = i; return true; }
      return false;
    },
    finish: function () {
      this.finished = true;
      DOJO.Store.logSession({
        mode: this.mode, title: this.title,
        topic: this.opts.topic || null, lv: this.opts.lv || null,
        total: this.total, correct: this.correctCount,
        sec: Math.round((Date.now() - this.startedAt) / 1000)
      });
    },
    /** 間違えた問題だけで再構成 */
    retryWrong: function () {
      var qs = this.wrongItems.map(function (it) { return it.q; });
      return new Session(Object.assign({}, this.opts, { questions: qs, title: this.title + '（誤答再挑戦）' }));
    }
  };

  /** 模擬IC試験の問題セット構築：全トピックから重み付きで抽出 */
  function buildExam(levels, count, topicIds) {
    var pool = [];
    (topicIds && topicIds.length ? topicIds : DOJO.TOPICS.map(function (t) { return t.id; }))
      .forEach(function (tid) {
        levels.forEach(function (lv) { pool = pool.concat(DOJO.questionsOf(tid, lv)); });
      });
    return shuffle(pool).slice(0, count);
  }

  /** 弱点抽出：正答率が低い / 未着手が多いトピック順 */
  function weakTopics() {
    var out = [];
    DOJO.TOPICS.forEach(function (t) {
      DOJO.LEVELS.forEach(function (l) {
        var m = DOJO.Store.mastery(t.id, l.id);
        if (!m.total) return;
        out.push({ topic: t, level: l, m: m, score: (m.acc === null ? -1 : m.acc) });
      });
    });
    return out.filter(function (x) { return x.m.seen >= 3 && x.score >= 0; })
      .sort(function (a, b) { return a.score - b.score; });
  }

  DOJO.Session = Session;
  DOJO.buildExam = buildExam;
  DOJO.weakTopics = weakTopics;
  DOJO.shuffle = shuffle;
})(window);
