/* ===== exercise.js — v2 演習エンジン（14の問題型の採点・セッション・混合出題） =====
   設計：blueprint/06_問題と演習の設計.md
   型: 2確信度更新 3並べ替え(専門家比較) 4モデル誤り発見 5最初に確認する数字 6ICの質問 7プレモーテム
       8基準率 9リターン分解 10順序 11紙計算 12メモ赤入れ 13場面判断4択 14用語4択 1ケース設問(生成) */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var shuffle = DOJO.shuffle;

  function near(x, v, tol) {
    if (x === null || x === undefined || isNaN(x)) return false;
    if (tol == null) tol = Math.max(Math.abs(v) * 0.005, 0.01);
    return Math.abs(x - v) <= tol;
  }

  function initState(q) {
    var st = {};
    if (q.type === 13 || q.type === 14) {
      st.order = q.choices.map(function (_, i) { return i; });
      if (!q.noshuffle) st.order = shuffle(st.order);
    } else if (q.type === 5) {
      st.order = shuffle(q.candidates.map(function (_, i) { return i; }));
    } else if (q.type === 3 || q.type === 10) {
      st.order = shuffle(q.items.map(function (_, i) { return i; }));
      st.picked = [];              // 選んだ順（orig index）
    } else if (q.type === 4) {
      st.selected = [];
    }
    return st;
  }

  /** 採点。input の形は型ごと。戻り {correct, score, detail} */
  function grade(q, st, input) {
    var t = q.type, n;
    switch (t) {
      case 13: case 14: {
        var orig = st.order[input];
        return { correct: orig === q.a, score: orig === q.a ? 1 : 0, detail: { pickedOrig: orig } };
      }
      case 5: {
        var o5 = st.order[input];
        return { correct: o5 === q.best, score: o5 === q.best ? 1 : 0, detail: { pickedOrig: o5 } };
      }
      case 11: {
        var x = parseFloat(input);
        var ok = near(x, q.answer.value, q.answer.tol);
        return { correct: ok, score: ok ? 1 : 0, detail: { x: x } };
      }
      case 9: {
        var keys = Object.keys(q.answer), allOk = true, det = {};
        keys.forEach(function (k) {
          var v = parseFloat(input[k]);
          var okk = near(v, q.answer[k].value, q.answer[k].tol);
          det[k] = { x: v, ok: okk }; if (!okk) allOk = false;
        });
        return { correct: allOk, score: keys.filter(function (k) { return det[k].ok; }).length / keys.length, detail: det };
      }
      case 8: {
        var p = parseFloat(input), base = q.baseRate * 100;
        var tol8 = q.tol != null ? q.tol : 15;
        var ok8 = Math.abs(p - base) <= tol8;
        return { correct: ok8, score: ok8 ? 1 : Math.max(0, 1 - Math.abs(p - base) / 50), detail: { p: p, base: base } };
      }
      case 2: {
        var k2 = String(parseInt(input, 10));
        var dist = q.expert || {};
        var mx = Math.max.apply(null, Object.keys(dist).map(function (k) { return dist[k] || 0; }).concat([1]));
        var sc = (dist[k2] || 0) / mx;
        return { correct: sc >= 0.5, score: sc, detail: { pick: parseInt(k2, 10), mode: Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a]; })[0] } };
      }
      case 3: case 10: {
        var exp = q.expertOrder || q.order;   // orig indices in correct order
        n = exp.length;
        var matched = 0;
        for (var i = 0; i < n; i++) if (input[i] === exp[i]) matched++;
        var ok3 = (t === 10) ? matched === n : (matched >= n - 2 && input[0] === exp[0]);
        return { correct: ok3, score: matched / n, detail: { matched: matched, n: n } };
      }
      case 4: {
        var bugRows = q.bugs.map(function (b) { return b.row; }).sort();
        var sel = (input || []).slice().sort();
        var same = bugRows.length === sel.length && bugRows.every(function (r, i) { return r === sel[i]; });
        var hit = sel.filter(function (r) { return bugRows.indexOf(r) >= 0; }).length;
        return { correct: same, score: bugRows.length ? Math.max(0, (hit - (sel.length - hit)) / bugRows.length) : 0, detail: { hit: hit, miss: bugRows.length - hit, extra: sel.length - hit } };
      }
      case 6: case 7: case 12: case 1: {
        var band = input && input.band;
        var good = band === 'vp' || band === 'associate';
        return { correct: good, score: band === 'vp' ? 1 : band === 'associate' ? 0.7 : 0.4, detail: { band: band, text: input && input.text } };
      }
    }
    return { correct: false, score: 0, detail: {} };
  }

  /** 演習セッション */
  function Session2(opts) {
    var qs = opts.questions.slice();
    if (opts.shuffleQ) qs = shuffle(qs);
    if (opts.limit) qs = qs.slice(0, opts.limit);
    this.opts = opts;
    this.mode = opts.mode || 'set';
    this.title = opts.title || '演習';
    this.items = qs.map(function (q) { return { q: q, st: initState(q), answered: false, correct: null, score: 0, detail: null, input: null }; });
    this.idx = 0; this.startedAt = Date.now(); this.finished = false;
  }
  Session2.restore = function (snap) {
    if (!snap || !snap.items || !snap.items.length) return null;
    var qs = [];
    for (var i = 0; i < snap.items.length; i++) {
      var q = DOJO.questionById2(snap.items[i].id);
      if (!q) return null;
      qs.push(q);
    }
    var s = new Session2({ questions: qs, mode: snap.mode, title: snap.title, ch: snap.ch, lap: snap.lap, set: snap.set, shuffleQ: false });
    s.items.forEach(function (it, i) {
      var si = snap.items[i];
      if (si.st) it.st = si.st;
      it.answered = si.answered; it.correct = si.correct; it.score = si.score || 0; it.detail = si.detail; it.input = si.input;
    });
    s.idx = Math.min(snap.idx || 0, s.items.length - 1);
    s.startedAt = snap.startedAt || Date.now();
    return s;
  };
  Session2.prototype = {
    get cur() { return this.items[this.idx]; },
    get total() { return this.items.length; },
    get answered() { return this.items.filter(function (it) { return it.answered; }).length; },
    get correctCount() { return this.items.filter(function (it) { return it.correct === true; }).length; },
    get wrongItems() { return this.items.filter(function (it) { return it.answered && !it.correct; }); },
    submit: function (input) {
      var it = this.cur;
      if (it.answered) return it;
      var r = grade(it.q, it.st, input);
      it.answered = true; it.correct = r.correct; it.score = r.score; it.detail = r.detail; it.input = input;
      DOJO.Store.answer(it.q.id, r.correct);
      if (it.q.type === 8 && DOJO.Store.addCalib) {
        DOJO.Store.addCalib({ caseId: 'q:' + it.q.id, point: 'baseRate', p: r.detail.p, base: r.detail.base });
      }
      return it;
    },
    next: function () { if (this.idx < this.items.length - 1) { this.idx++; return true; } this.finished = true; return false; },
    prev: function () { if (this.idx > 0) { this.idx--; return true; } return false; },
    goto: function (i) { if (i >= 0 && i < this.items.length) { this.idx = i; return true; } return false; },
    finish: function () {
      this.finished = true;
      DOJO.Store.logSession({ mode: 'v2-' + this.mode, title: this.title, topic: this.opts.ch || null, lv: this.opts.lap || null,
        total: this.total, correct: this.correctCount, sec: Math.round((Date.now() - this.startedAt) / 1000) });
    },
    retryWrong: function () {
      var qs = this.wrongItems.map(function (it) { return it.q; });
      return new Session2(Object.assign({}, this.opts, { questions: qs, title: this.title + '（誤答再挑戦）', set: null, mode: 'retry' }));
    },
    snapshot: function () {
      return { v: 2, mode: this.mode, title: this.title, ch: this.opts.ch || null, lap: this.opts.lap || null,
        set: (typeof this.opts.set === 'number') ? this.opts.set : null, idx: this.idx, startedAt: this.startedAt,
        items: this.items.map(function (it) {
          return { id: it.q.id, st: it.st, answered: it.answered, correct: it.correct, score: it.score, detail: it.detail, input: it.input };
        }) };
    }
  };

  /** 混合出題（06 §7）：今の章6割＋既習章4割、型比率を固定 */
  var MIX_PLAN = [
    { types: [14], n: 1 }, { types: [11, 9], n: 2 }, { types: [13, 5], n: 3 },
    { types: [3, 10, 2, 4], n: 2 }, { types: [6, 7, 12, 1, 8], n: 1 }, { types: null, n: 1, review: true }
  ];
  function buildMixed(ch, lap, size) {
    size = size || DOJO.SET_SIZE;
    lap = parseInt(lap, 10);
    var cur = DOJO.questionsOf2(ch, lap);
    var chIdx = DOJO.CHAPTERS.map(function (c) { return c.id; }).indexOf(ch);
    var prior = [];
    DOJO.CHAPTERS.slice(0, Math.max(0, chIdx)).forEach(function (c) { prior = prior.concat(DOJO.questionsOf2(c.id, lap)); });
    var s = DOJO.Store.state;
    var used = {}, out = [];
    function take(pool, types, k) {
      var cand = shuffle(pool.filter(function (q) { return !used[q.id] && (!types || types.indexOf(q.type) >= 0); }));
      cand.slice(0, k).forEach(function (q) { used[q.id] = 1; out.push(q); });
      return cand.length >= k ? 0 : k - cand.length;
    }
    MIX_PLAN.forEach(function (p) {
      var k = p.n;
      if (p.review) {
        var due = cur.concat(prior).filter(function (q) { var r = s.q[q.id]; return r && r.w > 0 && !used[q.id]; });
        k = take(due, null, k); if (!k) return;
      }
      var nCur = Math.round(k * 0.6), nPri = k - nCur;
      var rest = take(cur, p.types, nCur);
      rest += take(prior, p.types, nPri);
      if (rest) rest = take(cur, p.types, rest);
      if (rest) rest = take(prior, p.types, rest);
    });
    if (out.length < size) take(cur.concat(prior), null, size - out.length);
    return shuffle(out).slice(0, size);
  }

  /** v2 の復習対象（誤答・期限到来・付箋） */
  function dueQuestions2() {
    var s = DOJO.Store.state, now = Date.now(), out = [];
    DOJO.allQuestions2().forEach(function (q) {
      var r = s.q[q.id]; if (!r) return;
      if (r.flag || (r.w > 0 && r.box < 4 && r.due <= now) || (r.n > 0 && r.box <= 2 && r.due <= now)) out.push(q);
    });
    return out;
  }

  DOJO.Session2 = Session2;
  DOJO.grade2 = grade;
  DOJO.buildMixed = buildMixed;
  DOJO.dueQuestions2 = dueQuestions2;
})(window);
