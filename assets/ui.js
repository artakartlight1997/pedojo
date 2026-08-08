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

  /* ===================== ホーム（ダッシュボード） ===================== */
  function ring(pctVal, label, sub) {
    var r = 34, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, pctVal));
    return '<div class="ring"><svg viewBox="0 0 80 80" width="80" height="80">'
      + '<circle cx="40" cy="40" r="' + r + '" class="rbg"></circle>'
      + '<circle cx="40" cy="40" r="' + r + '" class="rfg" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>'
      + '</svg><div class="rtxt"><b>' + label + '</b><span>' + sub + '</span></div></div>';
  }

  UI.home = function () {
    var S = DOJO.Store;
    var o = S.overall(), rk = S.rank(), st = S.streakInfo(), t = S.today(), goal = S.goal();
    var due = S.dueQuestions().length;
    var acts = S.nextActions();
    var lecTotal = S.lectureTotal(), lecRead = S.readCount();

    var h = '';
    // ヒーロー：段位・ストリーク・今日
    h += '<div class="card hero">'
      + '<div class="hero-rank">'
      + '<div class="rank-badge">' + esc(rk.cur.name) + '</div>'
      + '<div class="rank-body"><div class="rank-title">現在の段位：<b>' + esc(rk.cur.name) + '</b>'
      + (rk.next ? ' <span class="muted small">→ 次は ' + esc(rk.next.name) + '（あと ' + rk.toNext + '）</span>' : ' <span class="muted small">最高位</span>') + '</div>'
      + '<div class="small muted">' + esc(rk.cur.label) + '</div>'
      + '<div class="bar" style="margin-top:8px"><i style="width:' + Math.round(rk.pct * 100) + '%"></i></div></div>'
      + '</div>'
      + '<div class="hero-stats">'
      + ring(goal ? t.n / goal : 0, t.n + '/' + goal, '今日')
      + '<div class="hs"><div class="v">' + st.cur + '<small>日</small></div><div class="l">連続学習' + (st.best > st.cur ? '（最長 ' + st.best + '）' : '') + '</div></div>'
      + '<div class="hs"><div class="v">' + due + '</div><div class="l">復習待ち</div></div>'
      + '<div class="hs"><div class="v">' + (o.acc === null ? '—' : pct(o.acc)) + '</div><div class="l">通算正答率</div></div>'
      + '</div></div>';

    // 次の一手
    h += '<div class="card"><div class="spread"><h3 style="margin:0">次の一手</h3>'
      + '<span class="muted small">迷ったら上から順に</span></div><div class="acts">';
    if (!acts.length) {
      h += '<div class="empty">今日やるべきことは終わっています。よくやりました。</div>';
    }
    acts.forEach(function (a) {
      h += '<button class="act" data-go="' + a.go + '"><span class="act-ic">' + esc(a.icon) + '</span>'
        + '<span class="act-b"><b>' + esc(a.title) + '</b><span>' + esc(a.sub) + '</span></span><span class="act-go">→</span></button>';
    });
    h += '</div></div>';

    // 学習カレンダー
    var cal = S.calendar(70);
    h += '<div class="card"><div class="spread"><h3 style="margin:0">学習カレンダー</h3>'
      + '<span class="muted small">直近10週間・1マス＝1日</span></div><div class="cal">'
      + cal.map(function (d) {
        var lvl = d.n === 0 ? 0 : d.n < 5 ? 1 : d.n < 15 ? 2 : d.n < 30 ? 3 : 4;
        return '<i class="c' + lvl + '" title="' + d.key + '：' + d.n + '問"></i>';
      }).join('') + '</div>'
      + '<div class="small muted" style="margin-top:8px">'
      + '毎日20問でも、1年で7,300問。<b>間を空けないことだけ</b>が効きます。</div></div>';

    // 全体進捗
    h += '<div class="grid g4">'
      + '<div class="stat"><div class="v">' + o.mastered + ' <small>/' + o.total + '</small></div><div class="l">習得（Box3+）</div></div>'
      + '<div class="stat"><div class="v">' + o.seen + '</div><div class="l">着手済み</div></div>'
      + '<div class="stat"><div class="v">' + lecRead + ' <small>/' + lecTotal + '</small></div><div class="l">座学 読了</div></div>'
      + '<div class="stat"><div class="v">' + o.attempts + '</div><div class="l">延べ解答数</div></div>'
      + '</div>';

    // はじめての人向け
    if (o.seen === 0) {
      h += '<div class="card"><h1>PEファンド道場</h1>'
        + '<p class="lead">白紙の状態から、投資委員会で自分の言葉で発言できる投資プロフェッショナルまで。'
        + DOJO.TOPICS.length + 'トピック × 4レベル（初級・中級・上級・<b>実践</b>）で徹底的に回す道場です。</p>'
        + '<div class="row"><button class="btn primary" data-go="#/lecture/pe/b">第一講（PE概論・初級）から始める</button>'
        + '<button class="btn" data-go="#/curriculum">カリキュラムを見る</button></div></div>';
    }

    h += '<div class="card"><h3>この道場の使い方</h3>'
      + '<ol>'
      + '<li><b>座学 → クイズ → 誤答の解説</b>を1セットとして回す。正答率85%を超えるまで同じ講を繰り返す。</li>'
      + '<li><b>「実践」レベルを飛ばさない。</b>教科書の知識だけでは現場で通用しません。'
      + '設備投資サイクルの読み方、人柄の見抜き方、銀行との距離の取り方——ここに現場の差が出ます。</li>'
      + '<li><b>毎日、復習箱をゼロにする。</b>間隔反復（1→3→7→21→60日）で長期記憶に落とす。</li>'
      + '<li><b>上級・実践は横断で解く。</b>模擬IC試験でトピック混在の出題を受け、「何の論点か」を自分で判別する訓練を。</li>'
      + '</ol></div>';

    app.innerHTML = h;
  };

  /* ===================== カリキュラム ===================== */
  /* ===================== 学習ルート ===================== */
  UI.path = function () {
    var S = DOJO.Store;
    var st = S.pathStatus();
    var laps = S.lapProgress();
    var nx = S.nextOnPath();

    var h = '<div class="card"><h1>学習ルート</h1>'
      + '<p class="lead">投資プロセスを<b>遂行する順序</b>で並べた道順です。'
      + '「案件がどこから来て → いくらなら買えて → どう調べて → どう買って → どう契約して → どう育てて → どう出るか」。'
      + 'この順に学ぶと、ばらばらの知識が一本の線になります。</p>'
      + '<div class="callout"><div class="ct">周回で深める</div>'
      + '<p>縦（1トピックを初級→上級まで）ではなく、<b>横（全段の初級を一周）</b>から入ります。'
      + '1周目で仕事の全体像がつながり、2周目以降で各段を深く掘ります。</p></div>';

    // 周回の進捗
    h += '<div class="grid g2" style="margin-top:14px">';
    laps.forEach(function (lp) {
      h += '<div style="border:1px solid var(--line);border-radius:8px;padding:12px 14px">'
        + lvBadge(lp.lap.lv) + ' <b>' + esc(lp.lap.name) + '</b> <span class="small muted">' + esc(lp.lap.tag) + '</span>'
        + '<div class="small muted" style="margin-top:6px">' + esc(lp.lap.desc) + '</div>'
        + '<div class="bar" style="margin-top:8px"><i style="width:' + Math.round(lp.pct * 100) + '%"></i></div>'
        + '<div class="small" style="margin-top:4px">修了 ' + lp.done + ' / ' + lp.total + '</div></div>';
    });
    h += '</div></div>';

    if (nx) {
      h += '<div class="card"><h2>いま、ここ</h2>'
        + '<div class="act"><div class="act-ic">路</div><div class="act-b">'
        + '<b>' + esc(nx.stage.name) + '　' + esc(nx.topic.name) + '・' + esc(DOJO.levelById(nx.lv).name) + '</b>'
        + '<div class="small muted">' + esc(nx.stage.q) + '</div></div>'
        + '<a class="act-go" href="#/' + (nx.read ? 'quiz' : 'lecture') + '/' + nx.topic.id + '/' + nx.lv + '">'
        + (nx.read ? 'クイズへ' : '座学を読む') + '</a></div></div>';
    }

    // 段ごとの一覧（1周目の順序で表示。各行に4レベルの状態）
    h += '<div class="card"><h2>段（ステージ）と到達目標</h2>'
      + '<p class="small muted">各行の4つの印は 初級／中級／上級／実践。'
      + '● 修了　◐ 着手中　○ 未着手　－ 準備中（コンテンツ未作成）</p></div>';

    DOJO.STAGES.forEach(function (sg) {
      var items = st.filter(function (x) { return x.stage.id === sg.id; });
      var ready = items.filter(function (x) { return x.ready; });
      var done = ready.filter(function (x) { return x.done; }).length;
      h += '<div class="card">'
        + '<h2>' + esc(sg.name) + (sg.optional ? ' <span class="badge">任意・随時</span>' : '') + '</h2>'
        + '<p class="lead" style="margin-top:-4px">' + esc(sg.q) + '</p>'
        + '<div class="small" style="margin:8px 0"><b>到達目標：</b>' + esc(sg.goal) + '</div>'
        + '<div class="small muted">' + MD.inline(sg.why) + '</div>'
        + (sg.goFirst ? '<div class="callout field"><div class="ct">読む順の例外</div><p>' + esc(sg.goFirst) + '</p></div>' : '')
        + '<div class="bar" style="margin:10px 0 6px"><i style="width:' + (ready.length ? Math.round(done / ready.length * 100) : 0) + '%"></i></div>'
        + '<table><thead><tr><th>トピック</th><th>初級</th><th>中級</th><th>上級</th><th>実践</th><th>問題数</th></tr></thead><tbody>';
      sg.topics.forEach(function (tid) {
        var t = DOJO.topicById(tid);
        if (!t) return;
        var cells = DOJO.LEVELS.map(function (l) {
          var x = items.filter(function (y) { return y.topic.id === tid && y.lv === l.id; })[0];
          if (!x || !x.ready) return '<td class="muted">－</td>';
          var mark = x.done ? '●' : (x.started ? '◐' : '○');
          return '<td><a href="#/' + (x.read ? 'quiz' : 'lecture') + '/' + tid + '/' + l.id + '">' + mark + '</a></td>';
        }).join('');
        var qn = DOJO.LEVELS.reduce(function (s, l) { return s + countOf(tid, l.id); }, 0);
        h += '<tr><td><a href="#/topic/' + tid + '">' + esc(t.name) + '</a></td>' + cells + '<td>' + qn + '</td></tr>';
      });
      h += '</tbody></table></div>';
    });

    app.innerHTML = h;
  };

  UI.curriculum = function () {
    var h = '<div class="card"><h1>カリキュラム</h1>'
      + '<p class="lead">' + DOJO.TOPICS.length + 'トピック × ' + DOJO.LEVELS.length + 'レベル。'
      + '順番に迷ったら <a href="#/path">学習ルート</a> を見てください。'
      + '各トピックは「座学」と「理解度クイズ」で構成されています。</p>';
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
      { id: 'a', name: '投資委員会試験', lv: ['i', 'a'], n: 100, pass: 0.75, desc: '中級＋上級。会計・税務・ストラクチャー・法務の判断論点。IC で発言する水準。' },
      { id: 'p', name: '現場判断試験', lv: ['p'], n: 60, pass: 0.75, desc: '実践レベルのみ。人・現場・関係構築・修羅場対応。教科書に答えのない判断を問う。' },
      { id: 'x', name: '道場総覧（フル）', lv: ['b', 'i', 'a', 'p'], n: 150, pass: 0.75, desc: '全レベル混在。仕上げの総点検。' }
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
    var rk = DOJO.Store.rank(), stk = DOJO.Store.streakInfo();
    var h = '<div class="card"><h1>進捗</h1>'
      + '<div class="hero-rank" style="margin-bottom:14px">'
      + '<div class="rank-badge">' + esc(rk.cur.name) + '</div>'
      + '<div class="rank-body"><div class="rank-title"><b>' + esc(rk.cur.name) + '</b>'
      + (rk.next ? ' <span class="muted small">→ ' + esc(rk.next.name) + ' まであと ' + rk.toNext + '</span>' : '') + '</div>'
      + '<div class="small muted">' + esc(rk.cur.label) + '</div>'
      + '<div class="bar" style="margin-top:8px"><i style="width:' + Math.round(rk.pct * 100) + '%"></i></div>'
      + '<div class="small muted" style="margin-top:6px">連続学習 ' + stk.cur + '日（最長 ' + stk.best + '日）</div></div></div>'
      + '<div class="grid g4">'
      + '<div class="stat"><div class="v">' + o.seen + ' / ' + o.total + '</div><div class="l">着手</div></div>'
      + '<div class="stat"><div class="v">' + o.mastered + '</div><div class="l">習得（Box3+）</div></div>'
      + '<div class="stat"><div class="v">' + o.attempts + '</div><div class="l">延べ解答数</div></div>'
      + '<div class="stat"><div class="v">' + (o.acc === null ? '—' : pct(o.acc)) + '</div><div class="l">通算正答率</div></div>'
      + '</div></div>';

    var cal2 = DOJO.Store.calendar(140);
    h += '<div class="card"><h3>学習カレンダー（直近20週）</h3><div class="cal">'
      + cal2.map(function (d) {
        var lvl = d.n === 0 ? 0 : d.n < 5 ? 1 : d.n < 15 ? 2 : d.n < 30 ? 3 : 4;
        return '<i class="c' + lvl + '" title="' + d.key + '：' + d.n + '問"></i>';
      }).join('') + '</div></div>';

    h += '<div class="card"><h3>段位一覧</h3><table class="data"><thead><tr><th>段位</th><th>必要スコア</th><th>到達水準</th></tr></thead><tbody>'
      + rk.all.map(function (r) {
        return '<tr' + (r.id === rk.cur.id ? ' style="background:var(--panel-2);font-weight:700"' : '') + '>'
          + '<td>' + esc(r.name) + '</td><td>' + r.need + '</td><td class="small">' + esc(r.label) + '</td></tr>';
      }).join('') + '</tbody></table>'
      + '<div class="small muted" style="margin-top:8px">スコア = 習得数（Box3以上）× 正答率による係数。'
      + '<b>数をこなすだけでは上がりません。</b>正答率の裏付けが要ります。</div></div>';

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

    h += '<div class="card"><h3>1日の目標</h3>'
      + '<div class="row"><span class="muted small">1日に解く問題数の目標：</span>'
      + '<select id="goalSel">' + [10, 20, 30, 50, 80].map(function (n) {
        return '<option value="' + n + '"' + (n === DOJO.Store.goal() ? ' selected' : '') + '>' + n + '問</option>';
      }).join('') + '</select>'
      + '<span class="muted small">達成するとホームのリングが埋まります。</span></div></div>';

    var P = DOJO.Persist, ps = P ? P.status() : { ls: 'unknown', idb: 'unknown', file: 'off', lastSaved: null };
    function badge(v) {
      var map = { ok: ['保存中', 'ok'], ng: ['エラー', 'ng'], na: ['非対応', 'na'], on: ['自動保存中', 'ok'],
                  off: ['未設定', 'na'], 'need-permission': ['要再許可', 'ng'], unknown: ['—', 'na'] };
      var m = map[v] || ['—', 'na'];
      return '<div class="v ' + m[1] + '">' + m[0] + '</div>';
    }

    h += '<div class="card"><h3>進捗の保存</h3>'
      + '<p class="small muted">進捗が消えたら道場は成立しません。保存は多層にしてあります。'
      + '<b>端末を移す・ブラウザを変える・データを消す可能性がある場合は、必ずバックアップを取ってください。</b></p>'
      + '<div class="savegrid">'
      + '<div class="savecell"><div class="k">① localStorage（主）</div>' + badge(ps.ls) + '</div>'
      + '<div class="savecell"><div class="k">② IndexedDB（副・自動復元用）</div>' + badge(ps.idb) + '</div>'
      + '<div class="savecell"><div class="k">③ 進捗ファイル（自動保存）</div>' + badge(ps.file) + '</div>'
      + '<div class="savecell"><div class="k">最終保存</div><div class="v">'
      + (ps.lastSaved ? new Date(ps.lastSaved).toLocaleString('ja-JP') : '—') + '</div></div>'
      + '</div>';

    if (ps.lastError) {
      h += '<div class="callout warn"><div class="ct">保存エラー</div><p class="small">' + esc(ps.lastError) + '</p></div>';
    }

    h += '<div class="callout"><div class="ct">おすすめ：進捗ファイルへの自動保存</div>'
      + '<p class="small">保存先のファイルを一度選ぶと、以後は回答するたびに<b>そのファイルへ自動で書き込まれます</b>。'
      + 'ブラウザのデータを消しても、そのファイルから復元できます。'
      + (P && P.canFile ? '' : '<br><b>このブラウザは未対応です</b>（Chrome / Edge のデスクトップ版で利用できます）。'
        + '代わりに、下の「バックアップを保存」を定期的に使ってください。')
      + '</p></div>';

    h += '<div class="row" style="margin-top:10px">'
      + (P && P.canFile ? '<button class="btn" id="fileBtn">進捗ファイルを選んで自動保存を有効にする</button>' : '')
      + '<button class="btn" id="dlBtn">バックアップを保存（.json）</button>'
      + '<button class="btn" id="upBtn">バックアップから復元</button>'
      + '<input type="file" id="upInput" accept="application/json,.json" style="display:none">'
      + '</div>'
      + '<div class="dropzone" id="dropZone">ここに進捗ファイル（.json）をドラッグ＆ドロップしても復元できます</div>';

    h += '<details style="margin-top:12px"><summary class="small muted">テキストで入出力する（旧方式）</summary>'
      + '<div class="row" style="margin-top:8px"><button class="btn" id="expBtn">テキストで出力</button>'
      + '<button class="btn" id="impBtn">テキストから取込</button></div>'
      + '<textarea id="ioArea" style="width:100%;height:120px;margin-top:10px;display:none;font-family:var(--mono);font-size:11px"></textarea>'
      + '</details>';

    h += '<div class="row" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px">'
      + '<button class="btn" id="resetBtn">進捗をリセット</button>'
      + '<span class="small muted">取り消せません。先にバックアップを保存してください。</span></div>'
      + '</div>';

    app.innerHTML = h;

    var gs = el('goalSel');
    if (gs) gs.addEventListener('change', function (e) { DOJO.Store.goal(parseInt(e.target.value, 10)); });

    function restoreFrom(file) {
      if (!file) return;
      DOJO.Persist.restoreFile(file).then(function (obj) {
        DOJO.Store.adopt(obj);
        alert('復元しました。');
        UI.progress();
        if (DOJO.renderSaveBanner) DOJO.renderSaveBanner();
      }).catch(function (e) { alert('復元できませんでした：' + e.message); });
    }

    if (el('fileBtn')) el('fileBtn').addEventListener('click', function () {
      DOJO.Persist.enableFile(DOJO.Store.state)
        .then(function () { alert('自動保存を有効にしました。以後、回答のたびにこのファイルへ保存されます。'); UI.progress(); })
        .catch(function (e) { if (e && e.name !== 'AbortError') alert('設定できませんでした：' + e.message); });
    });
    el('dlBtn').addEventListener('click', function () {
      var name = DOJO.Persist.download(DOJO.Store.state);
      alert('バックアップを保存しました：' + name);
      if (DOJO.renderSaveBanner) DOJO.renderSaveBanner();
    });
    el('upBtn').addEventListener('click', function () { el('upInput').click(); });
    el('upInput').addEventListener('change', function (e) { restoreFrom(e.target.files[0]); });

    var dz = el('dropZone');
    ['dragenter', 'dragover'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('over'); });
    });
    dz.addEventListener('drop', function (e) { restoreFrom(e.dataTransfer.files[0]); });

    el('expBtn').addEventListener('click', function () {
      var a = el('ioArea'); a.style.display = 'block'; a.value = DOJO.Store.exportJSON(); a.select();
    });
    el('impBtn').addEventListener('click', function () {
      var a = el('ioArea');
      if (a.style.display === 'none') { a.style.display = 'block'; a.value = ''; a.placeholder = 'ここにJSONを貼り付けて、もう一度このボタンを押す'; return; }
      try { DOJO.Store.importJSON(a.value); alert('取り込みました'); UI.progress(); }
      catch (e) { alert('取り込めませんでした：' + e.message); }
    });
    el('resetBtn').addEventListener('click', function () {
      if (!confirm('すべての学習進捗を削除します。よろしいですか？')) return;
      if (!confirm('取り消せません。本当に削除しますか？')) return;
      DOJO.Store.reset(); UI.progress();
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
