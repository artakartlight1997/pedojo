/* ===== store.js — 進捗の永続化・間隔反復（SRS） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var KEY = 'pedojo.v1';

  var DEFAULT = {
    q: {},        // qid -> {n,c,w,box,due,last,flag}
    lec: {},      // "topic-lv" -> {read:ts}
    sessions: [], // 学習履歴
    sets: {},     // "topic-lv-setIdx" -> {best:正答率0-1, tries, last:ts}
    session: null,// 解きかけのセッション（Session.snapshot）。終了で消える
    daily: {},    // "YYYY-MM-DD" -> {n:回答数, c:正答数, lec:読了数}
    streak: { cur: 0, best: 0, last: '' },
    settings: { theme: 'light', shuffle: true, goal: 20, showTimer: false }
  };

  var S = null;

  function load() {
    if (S) return S;
    var raw = null;
    try {
      raw = DOJO.Persist ? DOJO.Persist.readSync() : JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) { raw = null; }
    try {
      S = raw ? Object.assign({}, DEFAULT, raw) : JSON.parse(JSON.stringify(DEFAULT));
      S.settings = Object.assign({}, DEFAULT.settings, S.settings || {});
    } catch (e) {
      S = JSON.parse(JSON.stringify(DEFAULT));
    }
    return S;
  }
  /** 状態を外部から差し替える（バックアップからの復元・起動時の復旧で使う） */
  function adopt(obj) {
    S = Object.assign({}, DEFAULT, obj || {});
    S.settings = Object.assign({}, DEFAULT.settings, S.settings || {});
    return S;
  }
  function save() {
    var st = load();
    if (DOJO.Persist) DOJO.Persist.write(st);
    else { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
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

  /* ===== 段位＝職位（10段階）
     この道場の段位はPEファンドの職位に対応させている。
     修了時の到達目標：「ディレクターに勝てる」＝ ED 以上。 ===== */
  var RANKS = [
    { id: 0, name: '入門',            need: 0,    label: '道場に入った。まず入門段（PE概論・プロの作法）の座学から。' },
    { id: 1, name: 'アナリスト',      need: 30,   label: '用語が聞き取れる。会議の議事録が書ける。' },
    { id: 2, name: 'アソシエイト',    need: 80,   label: '指示された分析を、一人で最後まで回せる。' },
    { id: 3, name: 'シニアアソシエイト', need: 160, label: 'モデルとDDを主担当で回せる。専門家に指示が出せる。' },
    { id: 4, name: 'VP',              need: 280,  label: '案件全体を設計し、交渉の前線に立てる。' },
    { id: 5, name: 'シニアVP',        need: 450,  label: '複数案件を並行して統率し、後進を育てられる。' },
    { id: 6, name: 'ディレクター',    need: 700,  label: '案件の生殺与奪を判断できる。ICで「詰める側」に回る。' },
    { id: 7, name: 'ED',              need: 1000, label: 'ソーシングからEXITまで、ファンドの看板を背負える。ここで「ディレクターに勝てる」。' },
    { id: 8, name: 'パートナー',      need: 1400, label: 'ファンドレイズとLP対応まで含め、ファンド経営を担える。' },
    { id: 9, name: '道場主',          need: 2000, label: '全問制覇の先。M&Aを一人で最初から最後まで完遂できる。' }
  ];

  var Store = {
    get state() { return load(); },
    save: save,
    adopt: function (obj) { adopt(obj); save(); },

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

    /* ===== 解きかけセッション（途中再開） ===== */
    saveSession: function (snap) { var s = load(); s.session = snap; save(); },
    clearSession: function () { var s = load(); s.session = null; save(); },
    getSession: function () { return load().session || null; },

    /* ===== 10問セットの記録 =====
       セットを最後まで解き切ると記録される。合格＝正答率80%以上 */
    PASS: 0.8,
    recordSet: function (topic, lv, i, correct, total) {
      if (topic == null || i == null) return;
      var s = load();
      var k = topic + '-' + lv + '-' + i;
      var r = s.sets[k] || { best: 0, tries: 0, last: 0 };
      r.tries++;
      r.best = Math.max(r.best, total ? correct / total : 0);
      r.last = Date.now();
      s.sets[k] = r; save();
      return r;
    },
    setRec: function (topic, lv, i) { return load().sets[topic + '-' + lv + '-' + i] || null; },
    /** トピック×レベルのセット一覧と状態。
        state: 'clear'(合格) / 'tried'(解いたが80%未満) / 'part'(解きかけ) / 'todo' */
    setSummary: function (topic, lv) {
      var s = load();
      var sess = s.session;
      var sets = DOJO.setsFor(topic, lv);
      var per = sets.map(function (st) {
        var rec = s.sets[topic + '-' + lv + '-' + st.i];
        var attempted = st.qids.filter(function (id) { return !!s.q[id]; }).length;
        var inSession = !!(sess && sess.topic === topic && sess.lv === lv && sess.set === st.i);
        var state = 'todo';
        if (rec && rec.best >= Store.PASS) state = 'clear';
        else if (rec) state = 'tried';
        else if (inSession || attempted > 0) state = 'part';
        return { i: st.i, qids: st.qids, n: st.qids.length, rec: rec || null,
                 attempted: attempted, inSession: inSession, state: state };
      });
      var cleared = per.filter(function (x) { return x.state === 'clear'; }).length;
      return { sets: per, total: per.length, cleared: cleared,
               next: per.filter(function (x) { return x.state !== 'clear'; })[0] || null };
    },
    /** 道場全体のセット制覇状況 */
    conquest: function () {
      var totalSets = 0, cleared = 0, totalQ = 0, attemptedQ = 0;
      var s = load();
      DOJO.TOPICS.forEach(function (t) {
        DOJO.LEVELS.forEach(function (l) {
          var sets = DOJO.setsFor(t.id, l.id);
          if (!sets.length) return;
          totalSets += sets.length;
          sets.forEach(function (st) {
            var rec = s.sets[t.id + '-' + l.id + '-' + st.i];
            if (rec && rec.best >= Store.PASS) cleared++;
          });
        });
      });
      DOJO.allQuestions().forEach(function (q) { totalQ++; if (s.q[q.id]) attemptedQ++; });
      return { totalSets: totalSets, clearedSets: cleared,
               totalQ: totalQ, attemptedQ: attemptedQ };
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
        var ss = self.setSummary(it.topic.id, it.lv);
        // 修了＝座学を読み、全セットを合格（80%以上）している
        var done = read && ss.total > 0 && ss.cleared === ss.total;
        var started = read || m.seen > 0;
        return Object.assign({}, it, { read: read, m: m, qn: qn, ss: ss, done: done, started: started });
      });
    },
    /** ルート上で「次にやるべき1件」（未修了の最初の項目と、その中の次のセット） */
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

    /** 次にやるべきこと（モチベーション設計の中核）。
        最優先は常に「解きかけの続き」→「ルートの次の1セット」 */
    nextActions: function () {
      var acts = [], o = this.overall();
      var due = this.dueQuestions().length;
      var t = this.today(), goal = this.goal();

      // 0. 解きかけがあれば、何よりもまず続きから
      var sess = this.getSession();
      if (sess && sess.items) {
        var doneN = sess.items.filter(function (x) { return x.revealed; }).length;
        if (doneN < sess.items.length) {
          var go = (sess.mode === 'set' && sess.topic)
            ? '#/quiz/' + sess.topic + '/' + sess.lv + '/' + sess.set
            : '#/resume';
          acts.push({ pri: 0, icon: '▶', title: '続きから再開：' + (sess.title || 'セッション'),
            sub: doneN + ' / ' + sess.items.length + ' 問まで解答済み。ここから再開。', go: go });
        }
      }
      // 1. 学習ルート上の「次の1セット」（順序が意味を持つので、これが学習の本線）
      var nx = this.nextOnPath();
      if (nx) {
        var lvName = DOJO.levelById(nx.lv).name;
        if (!nx.read) {
          acts.push({ pri: 1, icon: '路', title: 'ルートの次：' + nx.stage.short + '／' + nx.topic.short + '・' + lvName + ' の座学',
            sub: nx.stage.q, go: '#/lecture/' + nx.topic.id + '/' + nx.lv });
        } else if (nx.ss.next) {
          acts.push({ pri: 1, icon: '路', title: 'ルートの次：' + nx.topic.short + '・' + lvName + '　セット' + (nx.ss.next.i + 1),
            sub: nx.ss.next.n + '問・約10分。合格 ' + nx.ss.cleared + ' / ' + nx.ss.total + ' セット。',
            go: '#/quiz/' + nx.topic.id + '/' + nx.lv + '/' + nx.ss.next.i });
        }
      }
      // 2. 復習箱
      if (due > 0) {
        acts.push({ pri: 2, icon: '⟳', title: '復習箱を空にする', sub: '期限到来 ' + due + '問。ここを潰すのが最短の上達。', go: '#/review' });
      }
      // 3. 今日の目標
      if (t.n < goal) {
        acts.push({ pri: 3, icon: '◎', title: '今日の目標まであと ' + (goal - t.n) + '問', sub: 'ルートの次のセットを解けばそのまま進む。', go: nx ? '#/quiz/' + nx.topic.id + '/' + nx.lv : '#/drill' });
      }
      // 4. 弱点
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
      if (!o || typeof o !== 'object' || !('q' in o)) throw new Error('進捗データの形式ではありません');
      adopt(o); save(); return true;
    }
  };

  DOJO.Store = Store;
})(window);
