/* ===== ui.js — 画面描画 ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var UI = DOJO.UI = {};
  var app = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) { return MD.esc(s); }
  function pct(x) { return Math.round((x || 0) * 100) + '%'; }
  function on(sel, ev, fn, root) {
    (root || app).querySelectorAll(sel).forEach(function (n) { n.addEventListener(ev, fn); });
  }
  function go(hash) { location.hash = hash; }
  UI.go = go;

  function lvBadge(lv) {
    var l = DOJO.levelById(lv);
    return '<span class="badge ' + l.badge + '">' + l.name + '</span>';
  }
  function countOf(t, l) { return DOJO.questionsOf(t, l).length; }

  /* ===================== ホーム ===================== */
  UI.home = function () {
    var o = DOJO.Store.overall();
    var due = DOJO.Store.dueQuestions().length;
    var wrong = DOJO.Store.wrongQuestions().length;
    var weak = DOJO.weakTopics().slice(0, 3);

    var h = '';
    h += '<div class="card">';
    h += '<h1>PEファンド道場</h1>';
    h += '<p class="lead">白紙の状態から、投資委員会で自分の言葉で発言できる投資プロフェッショナルまで。'
      + '座学 → 理解度クイズ → 誤答の反復、を' + DOJO.TOPICS.length + 'トピック×3レベルで徹底的に回す道場です。</p>';
    h += '<div class="row">'
      + '<button class="btn primary" data-go="#/curriculum">カリキュラムを見る</button>'
      + (o.seen === 0
        ? '<button class="btn" data-go="#/lecture/pe/b">まず第一講（PE概論・初級）から始める</button>'
        : '<button class="btn" data-go="#/review">復習箱（' + due + '問）</button>')
      + '<button class="btn" data-go="#/drill">実戦ドリルを組む</button>'
      + '<button class="btn" data-go="#/exam">模擬IC試験</button>'
      + '</div></div>';

    h += '<div class="grid g4">';
    h += '<div class="stat"><div class="v">' + o.total + '</div><div class="l">収録問題数</div></div>';
    h += '<div class="stat"><div class="v">' + o.seen + '</div><div class="l">着手済み</div></div>';
    h += '<div class="stat"><div class="v">' + o.mastered + '</div><div class="l">習得（Box3+）</div></div>';
    h += '<div class="stat"><div class="v">' + (o.acc === null ? '—' : pct(o.acc)) + '</div><div class="l">通算正答率</div></div>';
    h += '</div>';

    if (due || wrong) {
      h += '<div class="card"><div class="spread"><div><b>復習が溜まっています。</b> '
        + '<span class="muted small">期限到来 ' + due + '問 / 誤答歴あり ' + wrong + '問。'
        + '道場は「間違えた問題を潰す」ことでしか強くなりません。</span></div>'
        + '<div class="row"><button class="btn primary" data-go="#/review">復習箱へ</button></div></div></div>';
    }
    if (weak.length) {
      h += '<div class="card"><h3>いま弱いところ</h3><table class="data"><tbody>';
      weak.forEach(function (w) {
        h += '<tr><td>' + lvBadge(w.level.id) + ' ' + esc(w.topic.name) + '</td>'
          + '<td class="muted">正答率 ' + pct(w.m.acc) + '（' + w.m.seen + '/' + w.m.total + '問着手）</td>'
          + '<td style="text-align:right">'
          + '<button class="btn sm" data-go="#/lecture/' + w.topic.id + '/' + w.level.id + '">座学</button> '
          + '<button class="btn sm" data-go="#/quiz/' + w.topic.id + '/' + w.level.id + '">再挑戦</button></td></tr>';
      });
      h += '</tbody></table></div>';
    }

    h += '<div class="card"><h3>この道場の使い方（推奨ルート）</h3>'
      + '<ol>'
      + '<li><b>初級を全トピック通す。</b>「PE概論 → 投資プロセス → 財務会計 → 財務分析 → バリュエーション → …」の順。'
      + '各トピックで<b>座学を読む → クイズを解く → 誤答の解説を読む</b>。正答率85%を超えるまで同じレベルを回す。</li>'
      + '<li><b>中級は「手を動かす」順。</b>LBOモデル・財務DD・タームシート・SPAを重点的に。'
      + 'ここは自分でExcelを開いて再現しながら解くと定着が段違いになります。</li>'
      + '<li><b>上級は横断で解く。</b>ストラクチャー・税務・会計・契約は相互に絡みます。'
      + '模擬IC試験モードでトピック混在の出題を受け、「どの論点か」を自分で判別する訓練を。</li>'
      + '<li><b>毎日、復習箱をゼロにする。</b>間隔反復（1日→3日→7日→21日→60日）で長期記憶に落とします。</li>'
      + '</ol></div>';

    app.innerHTML = h;
  };

  /* ===================== カリキュラム ===================== */
  UI.curriculum = function () {
    var h = '<div class="card"><h1>カリキュラム</h1>'
      + '<p class="lead">' + DOJO.TOPICS.length + 'トピック × 3レベル。'
      + 'どこからでも入れますが、初学者は上から順に。各トピックは「座学」と「理解度クイズ」で構成されています。</p>';
    h += '<div class="grid g3">';
    DOJO.LEVELS.forEach(function (l) {
      h += '<div style="border:1px solid var(--line);border-radius:8px;padding:12px 14px">'
        + lvBadge(l.id) + ' <b>' + esc(l.name) + '</b>'
        + '<div class="small muted" style="margin-top:6px">' + esc(l.tagline) + '</div>'
        + '<div class="small" style="margin-top:8px"><b>到達目標：</b>' + esc(l.goal) + '</div></div>';
    });
    h += '</div></div>';

    h += '<div class="grid g2">';
    DOJO.TOPICS.forEach(function (t, i) {
      var tot = 0, mas = 0;
      DOJO.LEVELS.forEach(function (l) { var m = DOJO.Store.mastery(t.id, l.id); tot += m.total; mas += m.mastered; });
      h += '<div class="tcard" data-go="#/topic/' + t.id + '" style="cursor:pointer">'
        + '<div class="t"><span class="badge">第' + (i + 1) + '講</span> ' + esc(t.name) + '</div>'
        + '<div class="d">' + esc(t.desc) + '</div>'
        + '<div class="m">' + DOJO.LEVELS.map(function (l) {
          return '<span class="badge ' + l.badge + '">' + l.name + ' ' + countOf(t.id, l.id) + '問</span>';
        }).join('') + '</div>'
        + '<div class="bar"><i style="width:' + (tot ? Math.round(mas / tot * 100) : 0) + '%"></i></div>'
        + '</div>';
    });
    h += '</div>';
    app.innerHTML = h;
  };

  /* ===================== トピック詳細 ===================== */
  UI.topic = function (tid) {
    var t = DOJO.topicById(tid);
    if (!t) return UI.notfound();
    var h = '<div class="card"><div class="spread"><h1 style="margin:0">' + esc(t.name) + '</h1>'
      + '<button class="btn sm" data-go="#/curriculum">← カリキュラム</button></div>'
      + '<p class="lead">' + esc(t.desc) + '</p>'
      + '<div>' + t.keys.map(function (k) { return '<span class="pill">' + esc(k) + '</span>'; }).join('') + '</div></div>';

    DOJO.LEVELS.forEach(function (l) {
      var m = DOJO.Store.mastery(t.id, l.id);
      var hasLec = DOJO.LECTURES[t.id] && DOJO.LECTURES[t.id][l.id];
      h += '<div class="card"><div class="spread">'
        + '<div>' + lvBadge(l.id) + ' <b style="font-size:16px">' + esc(t.short) + '・' + l.name + '</b>'
        + '<div class="small muted" style="margin-top:4px">' + esc(l.tagline) + '</div></div>'
        + '<div class="row">'
        + (hasLec ? '<button class="btn" data-go="#/lecture/' + t.id + '/' + l.id + '">座学を読む'
          + (DOJO.Store.isRead(t.id, l.id) ? ' ✓' : '') + '</button>' : '')
        + (m.total ? '<button class="btn primary" data-go="#/quiz/' + t.id + '/' + l.id + '">クイズ ' + m.total + '問</button>' : '<span class="muted small">準備中</span>')
        + '</div></div>';
      if (m.total) {
        h += '<div class="bar"><i style="width:' + Math.round(m.pct * 100) + '%"></i></div>'
          + '<div class="small muted" style="margin-top:6px">着手 ' + m.seen + '/' + m.total
          + '　習得 ' + m.mastered + '　正答率 ' + (m.acc === null ? '—' : pct(m.acc)) + '</div>';
      }
      h += '</div>';
    });
    app.innerHTML = h;
  };

  /* ===================== 座学 ===================== */
  UI.lecture = function (tid, lv) {
    var t = DOJO.topicById(tid), l = DOJO.levelById(lv);
    if (!t || !l) return UI.notfound();
    var src = (DOJO.LECTURES[tid] || {})[lv];
    if (!src) {
      app.innerHTML = '<div class="card"><h1>' + esc(t.name) + '・' + l.name + '</h1>'
        + '<p class="empty">この講の座学は準備中です。</p>'
        + '<button class="btn" data-go="#/topic/' + tid + '">← ' + esc(t.short) + '</button></div>';
      return;
    }
    var ol = MD.outline(src);
    var idx = DOJO.TOPICS.indexOf(t);
    var prevT = DOJO.TOPICS[idx - 1], nextT = DOJO.TOPICS[idx + 1];

    var h = '<div class="card"><div class="spread">'
      + '<div>' + lvBadge(lv) + ' <span class="muted small">第' + (idx + 1) + '講</span>'
      + '<h1 style="margin:2px 0 0">' + esc(t.name) + '</h1></div>'
      + '<div class="row">'
      + DOJO.LEVELS.map(function (x) {
        return '<button class="btn sm' + (x.id === lv ? ' primary' : '') + '" data-go="#/lecture/' + tid + '/' + x.id + '">' + x.name + '</button>';
      }).join('')
      + '<button class="btn sm primary" data-go="#/quiz/' + tid + '/' + lv + '">理解度クイズ →</button>'
      + '</div></div></div>';

    h += '<div class="lecwrap"><div class="card prose" id="lecBody">' + MD.render(src) + '</div>';
    h += '<div class="toc card" style="padding:12px 14px"><div class="small muted" style="font-weight:700;margin-bottom:6px">目次</div>'
      + ol.map(function (o) { return '<a href="#h-' + MD.slug(o.text) + '" class="' + (o.lv === 3 ? 'lv3' : '') + '" data-anchor="' + esc(o.id) + '">' + esc(o.text) + '</a>'; }).join('')
      + '</div></div>';

    h += '<div class="card"><div class="spread">'
      + '<div class="row">'
      + (prevT ? '<button class="btn sm" data-go="#/lecture/' + prevT.id + '/' + lv + '">← ' + esc(prevT.short) + '</button>' : '')
      + (nextT ? '<button class="btn sm" data-go="#/lecture/' + nextT.id + '/' + lv + '">' + esc(nextT.short) + ' →</button>' : '')
      + '</div>'
      + '<div class="row"><button class="btn" id="markRead">読了にする</button>'
      + '<button class="btn primary" data-go="#/quiz/' + tid + '/' + lv + '">理解度クイズ（' + countOf(tid, lv) + '問）</button></div>'
      + '</div></div>';

    app.innerHTML = h;
    on('[data-anchor]', 'click', function (e) {
      e.preventDefault();
      var n = document.getElementById(e.currentTarget.dataset.anchor);
      if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    var mr = el('markRead');
    if (mr) mr.addEventListener('click', function () {
      DOJO.Store.markRead(tid, lv); mr.textContent = '読了 ✓'; mr.disabled = true;
    });
    window.scrollTo(0, 0);
  };

  /* ===================== クイズ ===================== */
  function renderQuiz() {
    var s = DOJO.current;
    if (!s) return UI.home();
    if (s.finished) return renderResult();
    var it = s.cur, q = it.q;
    var t = DOJO.topicById(q.topic);
    var rec = DOJO.Store.rec(q.id);

    var h = '<div class="card">';
    h += '<div class="qhead"><div class="qmeta">'
      + lvBadge(q.lv)
      + '<span class="badge">' + esc(t ? t.short : q.topic) + '</span>'
      + (q.tags || []).slice(0, 3).map(function (x) { return '<span class="pill">' + esc(x) + '</span>'; }).join('')
      + (rec ? '<span class="pill">Box' + rec.box + ' / ' + rec.c + '○' + rec.w + '×</span>' : '')
      + '</div>'
      + '<div class="qmeta"><span class="muted small">' + (s.idx + 1) + ' / ' + s.total + '　正答 ' + s.correctCount + '</span>'
      + '<button class="btn sm" id="flagBtn">' + (rec && rec.flag ? '★ 付箋' : '☆ 付箋') + '</button>'
      + '<button class="btn sm" id="quitBtn">終了</button></div></div>';
    h += '<div class="progressline"><i style="width:' + ((s.idx) / s.total * 100) + '%"></i></div>';

    h += '<div class="qtext">' + (q.stem ? '<span class="stem">' + MD.inline(q.stem) + '</span>' : '') + MD.inline(q.q) + '</div>';

    h += '<div class="choices">';
    it.order.forEach(function (origIdx, di) {
      var cls = 'choice';
      if (it.revealed) {
        if (origIdx === q.a) cls += ' ok';
        else if (di === it.picked) cls += ' ng';
      }
      h += '<button class="' + cls + '" data-pick="' + di + '"' + (it.revealed ? ' disabled' : '') + '>'
        + '<span class="k">' + 'ABCDEFG'[di] + '</span><span>' + MD.inline(q.choices[origIdx]) + '</span></button>';
    });
    h += '</div>';

    if (it.revealed) {
      h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">'
        + (it.correct ? '正解' : '不正解　—　正解は ' + 'ABCDEFG'[s.correctDisplayIndex(it)]) + '</div>';
      h += '<div class="exp"><h5>解説</h5><div class="body">' + MD.render(q.exp || '') + '</div>';
      if (q.ref) h += '<div class="small muted" style="margin-top:8px">参照：' + MD.inline(q.ref) + '</div>';
      h += '<div class="row" style="margin-top:10px">'
        + '<button class="btn sm" data-go="#/lecture/' + q.topic + '/' + q.lv + '">この論点の座学へ</button>'
        + '</div></div>';
      h += '<div class="row" style="margin-top:14px">'
        + (s.idx > 0 ? '<button class="btn sm" id="prevBtn">← 前へ</button>' : '')
        + '<button class="btn primary" id="nextBtn">' + (s.idx === s.total - 1 ? '結果を見る' : '次の問題 →') + '</button>'
        + '<span class="muted small"><kbd>Enter</kbd> で次へ / <kbd>1-6</kbd> で選択</span>'
        + '</div>';
    } else {
      h += '<div class="row" style="margin-top:14px"><span class="muted small">'
        + '<kbd>1</kbd>〜<kbd>6</kbd> キーでも解答できます。まず自分の頭で答えを作ってから選ぶこと。</span></div>';
    }
    h += '</div>';

    // ナビゲーション（解答済み一覧）
    h += '<div class="card"><div class="small muted" style="margin-bottom:6px">進捗</div><div class="row" style="gap:4px">';
    s.items.forEach(function (x, i) {
      var col = x.correct === true ? 'var(--ok)' : x.correct === false ? 'var(--ng)' : 'var(--panel-2)';
      h += '<button class="btn sm" data-jump="' + i + '" title="Q' + (i + 1) + '" style="min-width:30px;padding:3px 6px;'
        + 'background:' + col + ';color:' + (x.correct === null ? 'var(--ink-2)' : '#fff') + ';'
        + (i === s.idx ? 'outline:2px solid var(--accent);' : '') + '">' + (i + 1) + '</button>';
    });
    h += '</div></div>';

    app.innerHTML = h;

    on('[data-pick]', 'click', function (e) {
      s.pick(parseInt(e.currentTarget.dataset.pick, 10));
      renderQuiz();
    });
    on('[data-jump]', 'click', function (e) { s.goto(parseInt(e.currentTarget.dataset.jump, 10)); renderQuiz(); });
    var nb = el('nextBtn'); if (nb) nb.addEventListener('click', function () {
      if (!s.next()) { s.finish(); }
      renderQuiz();
    });
    var pb = el('prevBtn'); if (pb) pb.addEventListener('click', function () { s.prev(); renderQuiz(); });
    var fb = el('flagBtn'); if (fb) fb.addEventListener('click', function () { DOJO.Store.toggleFlag(q.id); renderQuiz(); });
    var qb = el('quitBtn'); if (qb) qb.addEventListener('click', function () { s.finish(); renderQuiz(); });
    window.scrollTo(0, 0);
  }

  function renderResult() {
    var s = DOJO.current;
    var acc = s.total ? s.correctCount / s.total : 0;
    var wrong = s.wrongItems;
    var msg = acc >= 0.9 ? '合格ライン突破。次のレベルへ進んで構いません。'
      : acc >= 0.75 ? 'あと一歩。誤答を潰してから次へ。'
        : acc >= 0.5 ? '座学に戻ってください。用語の理解が曖昧なまま先に進むと必ず詰まります。'
          : 'このレベルはまだ早い。座学を最初から読み直しましょう。';

    var h = '<div class="card"><h1>結果</h1>'
      + '<div class="grid g4">'
      + '<div class="stat"><div class="v">' + s.correctCount + ' / ' + s.total + '</div><div class="l">正答</div></div>'
      + '<div class="stat"><div class="v">' + pct(acc) + '</div><div class="l">正答率</div></div>'
      + '<div class="stat"><div class="v">' + wrong.length + '</div><div class="l">誤答</div></div>'
      + '<div class="stat"><div class="v">' + Math.round((Date.now() - s.startedAt) / 60000) + '分</div><div class="l">所要</div></div>'
      + '</div>'
      + '<p class="lead" style="margin-top:14px">' + esc(msg) + '</p>'
      + '<div class="row">'
      + (wrong.length ? '<button class="btn primary" id="retryWrong">誤答' + wrong.length + '問を解き直す</button>' : '')
      + '<button class="btn" id="againBtn">同じ設定でもう一度</button>'
      + (s.opts.topic ? '<button class="btn" data-go="#/lecture/' + s.opts.topic + '/' + s.opts.lv + '">座学に戻る</button>' : '')
      + '<button class="btn" data-go="#/curriculum">カリキュラムへ</button>'
      + '</div></div>';

    if (wrong.length) {
      h += '<div class="card"><h3>誤答の復習</h3>';
      wrong.forEach(function (it) {
        h += '<div style="border-top:1px solid var(--line);padding:14px 0">'
          + '<div class="qmeta" style="margin-bottom:6px">' + lvBadge(it.q.lv)
          + '<span class="badge">' + esc((DOJO.topicById(it.q.topic) || {}).short || '') + '</span></div>'
          + '<div style="font-weight:600">' + MD.inline(it.q.q) + '</div>'
          + '<div class="small" style="margin:6px 0"><span style="color:var(--ng)">あなた：'
          + MD.inline(it.q.choices[it.pickedOrig]) + '</span><br>'
          + '<span style="color:var(--ok)">正解：' + MD.inline(it.q.choices[it.q.a]) + '</span></div>'
          + '<div class="exp"><div class="body">' + MD.render(it.q.exp || '') + '</div></div></div>';
      });
      h += '</div>';
    }
    app.innerHTML = h;
    var rw = el('retryWrong'); if (rw) rw.addEventListener('click', function () {
      DOJO.current = DOJO.current.retryWrong(); renderQuiz();
    });
    var ag = el('againBtn'); if (ag) ag.addEventListener('click', function () {
      DOJO.current = new DOJO.Session(DOJO.current.opts); renderQuiz();
    });
    window.scrollTo(0, 0);
  }
  UI.renderQuiz = renderQuiz;

  UI.quiz = function (tid, lv) {
    var list = DOJO.questionsOf(tid, lv);
    var t = DOJO.topicById(tid);
    if (!list.length) {
      app.innerHTML = '<div class="card"><p class="empty">この講のクイズは準備中です。</p>'
        + '<button class="btn" data-go="#/topic/' + tid + '">← 戻る</button></div>';
      return;
    }
    DOJO.current = new DOJO.Session({
      questions: list, mode: 'study', topic: tid, lv: lv,
      title: (t ? t.short : tid) + '・' + DOJO.levelById(lv).name,
      shuffleQ: false, shuffleC: true
    });
    renderQuiz();
  };

  /* ===================== 実戦ドリル ===================== */
  UI.drill = function () {
    var h = '<div class="card"><h1>実戦ドリル</h1>'
      + '<p class="lead">トピックとレベルを自由に組み合わせて出題します。'
      + '複数トピックを混ぜると「何の論点か」を自分で判別する訓練になります。</p>';
    h += '<h3>レベル</h3><div class="row" id="lvSel">'
      + DOJO.LEVELS.map(function (l) { return '<button class="pill' + (l.id === 'b' ? ' on' : '') + '" data-lv="' + l.id + '">' + l.name + '</button>'; }).join('')
      + '</div>';
    h += '<h3>トピック</h3><div class="row" id="tpSel">'
      + '<button class="pill on" data-tp="*">全部</button>'
      + DOJO.TOPICS.map(function (t) { return '<button class="pill" data-tp="' + t.id + '">' + esc(t.short) + '</button>'; }).join('')
      + '</div>';
    h += '<h3>出題範囲</h3><div class="row" id="scopeSel">'
      + '<button class="pill on" data-sc="all">すべて</button>'
      + '<button class="pill" data-sc="unseen">未着手のみ</button>'
      + '<button class="pill" data-sc="wrong">誤答歴ありのみ</button>'
      + '<button class="pill" data-sc="flag">付箋のみ</button>'
      + '</div>';
    h += '<h3>問題数</h3><div class="row"><select id="cntSel">'
      + [10, 20, 30, 50, 100, 200].map(function (n) { return '<option value="' + n + '"' + (n === 20 ? ' selected' : '') + '>' + n + '問</option>'; }).join('')
      + '<option value="0">制限なし</option></select>'
      + '<span class="muted small">選択肢は毎回シャッフルされます</span></div>';
    h += '<div class="row" style="margin-top:18px"><button class="btn primary" id="startDrill">開始</button>'
      + '<span class="muted small" id="poolInfo"></span></div>';
    h += '</div>';
    app.innerHTML = h;

    var sel = { lv: { b: true, i: false, a: false }, tp: '*', tps: {}, sc: 'all' };

    function pool() {
      var lvs = Object.keys(sel.lv).filter(function (k) { return sel.lv[k]; });
      var tids = sel.tp === '*' ? DOJO.TOPICS.map(function (t) { return t.id; }) : Object.keys(sel.tps).filter(function (k) { return sel.tps[k]; });
      var list = [];
      tids.forEach(function (tid) { lvs.forEach(function (lv) { list = list.concat(DOJO.questionsOf(tid, lv)); }); });
      if (sel.sc === 'unseen') list = DOJO.Store.unseenQuestions(list);
      if (sel.sc === 'wrong') { var w = {}; DOJO.Store.wrongQuestions().forEach(function (q) { w[q.id] = 1; }); list = list.filter(function (q) { return w[q.id]; }); }
      if (sel.sc === 'flag') { var f = {}; DOJO.Store.flaggedQuestions().forEach(function (q) { f[q.id] = 1; }); list = list.filter(function (q) { return f[q.id]; }); }
      return list;
    }
    function refresh() {
      var n = pool().length;
      el('poolInfo').textContent = '該当 ' + n + '問';
      el('startDrill').disabled = n === 0;
    }
    on('#lvSel .pill', 'click', function (e) {
      var k = e.currentTarget.dataset.lv; sel.lv[k] = !sel.lv[k];
      e.currentTarget.classList.toggle('on', sel.lv[k]); refresh();
    });
    on('#tpSel .pill', 'click', function (e) {
      var k = e.currentTarget.dataset.tp;
      if (k === '*') {
        sel.tp = '*'; sel.tps = {};
        app.querySelectorAll('#tpSel .pill').forEach(function (n) { n.classList.toggle('on', n.dataset.tp === '*'); });
      } else {
        sel.tp = 'sel'; sel.tps[k] = !sel.tps[k];
        e.currentTarget.classList.toggle('on', sel.tps[k]);
        app.querySelector('#tpSel .pill[data-tp="*"]').classList.remove('on');
        if (!Object.keys(sel.tps).some(function (x) { return sel.tps[x]; })) {
          sel.tp = '*'; app.querySelector('#tpSel .pill[data-tp="*"]').classList.add('on');
        }
      }
      refresh();
    });
    on('#scopeSel .pill', 'click', function (e) {
      sel.sc = e.currentTarget.dataset.sc;
      app.querySelectorAll('#scopeSel .pill').forEach(function (n) { n.classList.toggle('on', n === e.currentTarget); });
      refresh();
    });
    el('startDrill').addEventListener('click', function () {
      var list = pool(), n = parseInt(el('cntSel').value, 10);
      DOJO.current = new DOJO.Session({
        questions: list, mode: 'drill', title: '実戦ドリル',
        limit: n || 0, shuffleQ: true, shuffleC: true
      });
      renderQuiz();
    });
    refresh();
  };

  /* ===================== 復習箱 ===================== */
  UI.review = function () {
    var due = DOJO.Store.dueQuestions();
    var wrong = DOJO.Store.wrongQuestions();
    var flag = DOJO.Store.flaggedQuestions();
    var h = '<div class="card"><h1>復習箱</h1>'
      + '<p class="lead">間隔反復（Leitner方式）。正解すると次の復習まで 1→3→7→21→60日 と間隔が伸び、'
      + '間違えると箱が2つ戻ります。<b>ここを毎日ゼロにするのが道場の作法です。</b></p>'
      + '<div class="grid g3">'
      + '<div class="stat"><div class="v">' + due.length + '</div><div class="l">今日やるべき問題</div></div>'
      + '<div class="stat"><div class="v">' + wrong.length + '</div><div class="l">誤答歴あり（未習得）</div></div>'
      + '<div class="stat"><div class="v">' + flag.length + '</div><div class="l">付箋</div></div>'
      + '</div>'
      + '<div class="row" style="margin-top:16px">'
      + (due.length ? '<button class="btn primary" data-rev="due">期限到来を解く（' + due.length + '）</button>' : '')
      + (wrong.length ? '<button class="btn" data-rev="wrong">誤答を全部解く（' + wrong.length + '）</button>' : '')
      + (flag.length ? '<button class="btn" data-rev="flag">付箋を解く（' + flag.length + '）</button>' : '')
      + '</div>';
    if (!due.length && !wrong.length && !flag.length) {
      h += '<p class="empty">まだ復習対象がありません。まずはクイズを解いてください。</p>';
    }
    h += '</div>';

    if (wrong.length) {
      h += '<div class="card"><h3>誤答が多いトピック</h3><table class="data"><thead><tr>'
        + '<th>トピック</th><th>レベル</th><th>誤答数</th><th></th></tr></thead><tbody>';
      var agg = {};
      wrong.forEach(function (q) { var k = q.topic + '-' + q.lv; agg[k] = (agg[k] || 0) + 1; });
      Object.keys(agg).sort(function (a, b) { return agg[b] - agg[a]; }).slice(0, 12).forEach(function (k) {
        var p = k.split('-');
        h += '<tr><td>' + esc((DOJO.topicById(p[0]) || {}).name || p[0]) + '</td><td>' + lvBadge(p[1]) + '</td>'
          + '<td>' + agg[k] + '</td><td style="text-align:right">'
          + '<button class="btn sm" data-go="#/lecture/' + p[0] + '/' + p[1] + '">座学</button></td></tr>';
      });
      h += '</tbody></table></div>';
    }
    app.innerHTML = h;
    on('[data-rev]', 'click', function (e) {
      var k = e.currentTarget.dataset.rev;
      var list = k === 'due' ? due : k === 'wrong' ? wrong : flag;
      DOJO.current = new DOJO.Session({ questions: list, mode: 'review', title: '復習箱', shuffleQ: true, shuffleC: true });
      renderQuiz();
    });
  };

  /* ===================== 模擬IC試験 ===================== */
  UI.exam = function () {
    var presets = [
      { id: 'b', name: '新人卒業試験', lv: ['b'], n: 60, pass: 0.8, desc: '初級全トピック混在。ここを80%取れないうちはディールに入っても議論についていけません。' },
      { id: 'i', name: 'アソシエイト実務試験', lv: ['b', 'i'], n: 80, pass: 0.8, desc: '初級＋中級。モデル・DD・タームシート・契約の実務論点を混在出題。' },
      { id: 'a', name: '投資committee 試験', lv: ['i', 'a'], n: 100, pass: 0.75, desc: '中級＋上級。会計・税務・ストラクチャー・法務の判断論点。IC で発言する水準。' },
      { id: 'x', name: '道場総覧（フル）', lv: ['b', 'i', 'a'], n: 150, pass: 0.75, desc: '全レベル混在。仕上げの総点検。' }
    ];
    var h = '<div class="card"><h1>模擬IC試験</h1>'
      + '<p class="lead">トピック混在・ランダム出題。解説は最後にまとめて確認します（本番同様、途中で答え合わせをしない訓練）。</p></div>';
    h += '<div class="grid g2">';
    presets.forEach(function (p) {
      h += '<div class="card"><div class="spread"><b style="font-size:16px">' + esc(p.name) + '</b>'
        + '<span class="badge">' + p.n + '問 / 合格 ' + pct(p.pass) + '</span></div>'
        + '<p class="small muted">' + esc(p.desc) + '</p>'
        + '<button class="btn primary" data-exam="' + p.id + '">受験する</button></div>';
    });
    h += '</div>';
    app.innerHTML = h;
    on('[data-exam]', 'click', function (e) {
      var p = presets.filter(function (x) { return x.id === e.currentTarget.dataset.exam; })[0];
      var qs = DOJO.buildExam(p.lv, p.n);
      if (!qs.length) return;
      DOJO.current = new DOJO.Session({ questions: qs, mode: 'exam', title: p.name, shuffleQ: true, shuffleC: true });
      renderQuiz();
    });
  };

  /* ===================== 用語集 ===================== */
  UI.glossary = function () {
    var terms = (DOJO.GLOSSARY || []).slice().sort(function (a, b) {
      return (a.read || a.term).localeCompare(b.read || b.term, 'ja');
    });
    var h = '<div class="card"><h1>用語集</h1>'
      + '<p class="lead">' + terms.length + '語収録。会議で飛び交う言葉を、聞いた瞬間に意味が浮かぶまで。</p>'
      + '<input type="text" id="gloq" placeholder="用語を検索（日本語・英語どちらでも）" style="width:100%;margin-bottom:8px"></div>';
    h += '<div class="card" id="glist"></div>';
    app.innerHTML = h;

    function draw(q) {
      q = (q || '').toLowerCase();
      var list = terms.filter(function (t) {
        return !q || (t.term + ' ' + (t.en || '') + ' ' + (t.read || '') + ' ' + t.def).toLowerCase().indexOf(q) >= 0;
      });
      el('glist').innerHTML = list.length ? list.map(function (t) {
        return '<div style="border-bottom:1px solid var(--line);padding:11px 0">'
          + '<div><b>' + esc(t.term) + '</b>' + (t.en ? ' <span class="muted small">' + esc(t.en) + '</span>' : '')
          + ' ' + (t.topic ? '<span class="pill">' + esc((DOJO.topicById(t.topic) || {}).short || t.topic) + '</span>' : '') + '</div>'
          + '<div class="small" style="margin-top:3px">' + MD.inline(t.def) + '</div></div>';
      }).join('') : '<p class="empty">該当なし</p>';
    }
    el('gloq').addEventListener('input', function (e) { draw(e.target.value); });
    draw('');
  };

  /* ===================== 進捗 ===================== */
  UI.progress = function () {
    var o = DOJO.Store.overall();
    var st = DOJO.Store.state;
    var h = '<div class="card"><h1>進捗</h1><div class="grid g4">'
      + '<div class="stat"><div class="v">' + o.seen + ' / ' + o.total + '</div><div class="l">着手</div></div>'
      + '<div class="stat"><div class="v">' + o.mastered + '</div><div class="l">習得（Box3+）</div></div>'
      + '<div class="stat"><div class="v">' + o.attempts + '</div><div class="l">延べ解答数</div></div>'
      + '<div class="stat"><div class="v">' + (o.acc === null ? '—' : pct(o.acc)) + '</div><div class="l">通算正答率</div></div>'
      + '</div></div>';

    h += '<div class="card"><h3>トピック別 習熟マップ</h3><table class="data"><thead><tr><th>トピック</th>'
      + DOJO.LEVELS.map(function (l) { return '<th>' + l.name + '</th>'; }).join('') + '</tr></thead><tbody>';
    DOJO.TOPICS.forEach(function (t) {
      h += '<tr><td><a href="#/topic/' + t.id + '">' + esc(t.name) + '</a></td>';
      DOJO.LEVELS.forEach(function (l) {
        var m = DOJO.Store.mastery(t.id, l.id);
        if (!m.total) { h += '<td class="muted">—</td>'; return; }
        h += '<td><div class="small">' + m.mastered + '/' + m.total + '　' + (m.acc === null ? '' : pct(m.acc)) + '</div>'
          + '<div class="bar" style="margin-top:2px"><i style="width:' + Math.round(m.pct * 100) + '%"></i></div></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';

    if (st.sessions.length) {
      h += '<div class="card"><h3>学習履歴</h3><table class="data"><thead><tr><th>日時</th><th>内容</th><th>成績</th></tr></thead><tbody>';
      st.sessions.slice(0, 30).forEach(function (s) {
        var d = new Date(s.ts);
        h += '<tr><td class="small">' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate()
          + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</td>'
          + '<td>' + esc(s.title || s.mode) + '</td>'
          + '<td>' + s.correct + '/' + s.total + '（' + pct(s.total ? s.correct / s.total : 0) + '）</td></tr>';
      });
      h += '</tbody></table></div>';
    }

    h += '<div class="card"><h3>データ管理</h3>'
      + '<p class="small muted">進捗はこのブラウザの localStorage に保存されます。端末を移す場合はエクスポートしてください。</p>'
      + '<div class="row"><button class="btn" id="expBtn">エクスポート</button>'
      + '<button class="btn" id="impBtn">インポート</button>'
      + '<button class="btn" id="resetBtn">進捗をリセット</button></div>'
      + '<textarea id="ioArea" style="width:100%;height:120px;margin-top:10px;display:none;font-family:var(--mono);font-size:11px"></textarea>'
      + '</div>';
    app.innerHTML = h;

    el('expBtn').addEventListener('click', function () {
      var a = el('ioArea'); a.style.display = 'block'; a.value = DOJO.Store.exportJSON(); a.select();
    });
    el('impBtn').addEventListener('click', function () {
      var a = el('ioArea');
      if (a.style.display === 'none') { a.style.display = 'block'; a.value = ''; a.placeholder = 'ここにJSONを貼り付けて、もう一度インポートを押す'; return; }
      try { DOJO.Store.importJSON(a.value); alert('インポートしました'); UI.progress(); }
      catch (e) { alert('JSONの形式が不正です'); }
    });
    el('resetBtn').addEventListener('click', function () {
      if (confirm('すべての学習進捗を削除します。よろしいですか？')) { DOJO.Store.reset(); UI.progress(); }
    });
  };

  /* ===================== 検索 ===================== */
  UI.search = function (q) {
    q = (q || '').trim();
    var h = '<div class="card"><h1>検索：' + esc(q) + '</h1>';
    if (!q) { app.innerHTML = h + '<p class="empty">検索語を入力してください</p></div>'; return; }
    var lq = q.toLowerCase();

    // 座学ヒット
    var lecHits = [];
    DOJO.TOPICS.forEach(function (t) {
      var L = DOJO.LECTURES[t.id] || {};
      DOJO.LEVELS.forEach(function (l) {
        var src = L[l.id]; if (!src) return;
        var pos = src.toLowerCase().indexOf(lq);
        if (pos >= 0) {
          var n = (src.toLowerCase().match(new RegExp(lq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
          lecHits.push({ t: t, l: l, n: n, snip: src.slice(Math.max(0, pos - 60), pos + 120) });
        }
      });
    });
    // 問題ヒット
    var qHits = DOJO.allQuestions().filter(function (x) {
      return (x.q + ' ' + (x.stem || '') + ' ' + x.choices.join(' ') + ' ' + (x.exp || '') + ' ' + (x.tags || []).join(' ')).toLowerCase().indexOf(lq) >= 0;
    });
    // 用語ヒット
    var gHits = (DOJO.GLOSSARY || []).filter(function (t) {
      return (t.term + ' ' + (t.en || '') + ' ' + t.def).toLowerCase().indexOf(lq) >= 0;
    });

    h += '<p class="lead">座学 ' + lecHits.length + '件 / 問題 ' + qHits.length + '件 / 用語 ' + gHits.length + '件</p></div>';

    if (gHits.length) {
      h += '<div class="card"><h3>用語</h3>' + gHits.slice(0, 15).map(function (t) {
        return '<div style="border-bottom:1px solid var(--line);padding:8px 0"><b>' + esc(t.term) + '</b>'
          + '<div class="small">' + MD.inline(t.def) + '</div></div>';
      }).join('') + '</div>';
    }
    if (lecHits.length) {
      h += '<div class="card"><h3>座学</h3>' + lecHits.map(function (x) {
        return '<div style="border-bottom:1px solid var(--line);padding:9px 0">'
          + lvBadge(x.l.id) + ' <a href="#/lecture/' + x.t.id + '/' + x.l.id + '">' + esc(x.t.name) + '</a> '
          + '<span class="muted small">' + x.n + '箇所</span>'
          + '<div class="small muted">…' + esc(x.snip.replace(/\n/g, ' ')) + '…</div></div>';
      }).join('') + '</div>';
    }
    if (qHits.length) {
      h += '<div class="card"><div class="spread"><h3 style="margin:0">問題（' + qHits.length + '）</h3>'
        + '<button class="btn sm primary" id="drillHits">ヒットした問題を解く</button></div>';
      h += qHits.slice(0, 40).map(function (x) {
        return '<div style="border-bottom:1px solid var(--line);padding:9px 0">' + lvBadge(x.lv)
          + ' <span class="badge">' + esc((DOJO.topicById(x.topic) || {}).short || '') + '</span> '
          + '<span class="small">' + MD.inline(x.q.slice(0, 120)) + '</span></div>';
      }).join('');
      if (qHits.length > 40) h += '<p class="small muted">ほか ' + (qHits.length - 40) + '件</p>';
      h += '</div>';
    }
    app.innerHTML = h;
    var db = el('drillHits');
    if (db) db.addEventListener('click', function () {
      DOJO.current = new DOJO.Session({ questions: qHits, mode: 'drill', title: '検索「' + q + '」', shuffleQ: true, shuffleC: true });
      renderQuiz();
    });
  };

  UI.notfound = function () {
    app.innerHTML = '<div class="card"><p class="empty">ページが見つかりません</p>'
      + '<div style="text-align:center"><button class="btn" data-go="#/">ホームへ</button></div></div>';
  };

  UI.init = function (root) { app = root; };
  UI.delegate = function () {
    app.addEventListener('click', function (e) {
      var n = e.target.closest('[data-go]');
      if (n) { e.preventDefault(); go(n.dataset.go); }
    });
  };
})(window);
