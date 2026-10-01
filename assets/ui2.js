/* ===== ui2.js — v2「投資プロへの道」の画面（道・章・工程講義・演習・ケース・スキルマップ・ジャーナル） =====
   設計：blueprint/08_実装方針.md §4 */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};
  var UI = DOJO.UI;
  var app = null;
  function el(id) { return document.getElementById(id); }
  function esc(s) { return MD.esc(s == null ? '' : s); }
  function pct(x) { return Math.round((x || 0) * 100) + '%'; }
  function on(sel, ev, fn, root) { (root || app).querySelectorAll(sel).forEach(function (n) { n.addEventListener(ev, fn); }); }
  function go(h) { location.hash = h; }
  function caseHash(cid, lap) { return '#/case/' + cid.replace('/', '~') + '/' + (lap || 1); }
  function lapChip(lap) { var l = DOJO.lapById(lap); return l ? '<span class="badge lap' + l.id + '">' + l.name + '・' + esc(l.role) + '</span>' : ''; }
  function skillChips(skills) {
    return (skills || []).map(function (k) {
      var s = DOJO.SKILLMAP[k]; if (!s) return '';
      return '<span class="pill skill" title="' + esc(s.name) + '">' + esc(DOJO.SKILL_DOMAINS[s.domain]) + ' ' + k + '</span>';
    }).join('');
  }
  var _init = UI.init;
  UI.init = function (root) { app = root; _init(root); };

  /* ===================== ホーム（v2） ===================== */
  UI.homeV1 = UI.home;
  UI.home = function () {
    var S = DOJO.Store;
    var st = S.streakInfo(), t = S.today(), goal = S.goal();
    var road = S.roadStatus();
    var ready = road.filter(function (x) { return x.ready; });
    var done = ready.filter(function (x) { return x.done; }).length;
    var nx = S.nextOnRoad();
    var skills = S.skillStatus();
    var passed = Object.keys(skills).filter(function (k) { return skills[k] === 'passed'; }).length;
    var gap = S.calibrationGap();
    var sess = S.getSession2();
    var sessLive = sess && sess.items && sess.items.some(function (x) { return !x.answered; });
    var h = '';

    var primary = null;
    if (sessLive) {
      var dn = sess.items.filter(function (x) { return x.answered; }).length;
      primary = { go: '#/ex/resume', label: '▶ 解きかけの演習を再開', title: esc(sess.title || '演習'), sub: dn + ' / ' + sess.items.length + ' 問まで解答済み。' };
    } else if (nx) {
      var ni = S.nextInChapter(nx.ch, nx.lap);
      var goH = '#/ch/' + nx.ch + '/' + nx.lap;
      if (ni) {
        if (ni.kind === 'lecture') goH = '#/lec2/' + ni.id;
        else if (ni.kind === 'set') goH = '#/ex/' + nx.ch + '/' + nx.lap + '/' + ni.i;
        else if (ni.kind === 'task' || ni.kind === 'journal') goH = caseHash(nx.chapter.caseId, nx.lap);
      }
      primary = { go: goH, label: ni ? '▶ ' + esc(ni.title) : '章を開く',
        title: esc(nx.lapObj.name + '「' + nx.lapObj.short + '」　第' + nx.chapter.n + '章 ' + nx.chapter.name),
        sub: esc(nx.chapter.q) };
    } else {
      primary = { go: '#/road', label: '道を見る', title: '道はすべて修了しています', sub: '枝ケースと混合ドリルで仕上げを。' };
    }
    h += '<div class="card hero-cta"><div class="hc-kicker">いま、ここ</div>'
      + '<div class="hc-title">' + primary.title + '</div><div class="hc-sub">' + primary.sub + '</div>'
      + '<button class="btn primary xl" data-go="' + primary.go + '">' + primary.label + '</button>'
      + '<div class="hc-alt"><a href="#/road">道（学習ルート）全体を見る →</a></div></div>';

    h += '<div class="card hero"><div class="hero-stats wide">'
      + '<div class="hs"><div class="v">' + done + '<small>/' + ready.length + '</small></div><div class="l">章の修了（周×章）</div></div>'
      + '<div class="hs"><div class="v">' + passed + '<small>/' + Object.keys(skills).length + '</small></div><div class="l">スキルマップ 合格セル</div></div>'
      + '<div class="hs"><div class="v">' + (gap.recentAvg === null ? '—' : gap.recentAvg.toFixed(2)) + '</div><div class="l">校正ギャップ（直近5件）</div></div>'
      + '<div class="hs"><div class="v">' + t.n + '<small>/' + goal + '</small></div><div class="l">今日の演習</div></div>'
      + '<div class="hs"><div class="v">' + st.cur + '<small>日</small></div><div class="l">連続学習' + (st.best > st.cur ? '（最長 ' + st.best + '）' : '') + '</div></div>'
      + '</div></div>';

    h += '<div class="card"><h3 style="margin-top:0">この道場の歩き方</h3><ol>'
      + '<li><b>道は12章×3周。</b>章＝投資プロセスの一工程。1周目は「作れる」、2周目は「設計し回せる」、3周目は「判断し責任を負う」。</li>'
      + '<li><b>各章は、工程講義（プロの手本）→ 演習セット → ケース課題（成果物を作る）→ 判断ジャーナル。</b>順に進めば「何のために」が途切れません。</li>'
      + '<li><b>ケース課題は、自分で作ってから、自己採点して、初めてプロの成果物が開きます。</b>先に見ると訓練になりません。</li>'
      + '<li><b>進捗は問題数ではなく、成果物の合格バンドとスキルマップのセルで測ります。</b>校正ギャップ（自己採点と模範の差）が縮めば、判断が育っています。</li>'
      + '</ol><div class="small muted">旧版（27トピック×4レベル・4,300問）は<a href="#/library">資料庫</a>から参照できます。</div></div>';

    var cal = S.calendar(70);
    h += '<div class="card"><div class="spread"><h3 style="margin:0">学習カレンダー</h3><span class="muted small">直近10週間</span></div><div class="cal">'
      + cal.map(function (d) { var lvl = d.n === 0 ? 0 : d.n < 5 ? 1 : d.n < 15 ? 2 : d.n < 30 ? 3 : 4; return '<i class="c' + lvl + '" title="' + d.key + '：' + d.n + '問"></i>'; }).join('')
      + '</div></div>';
    app.innerHTML = h;
  };

  /* ===================== 道（学習ルート） ===================== */
  UI.road = function () {
    var S = DOJO.Store, road = S.roadStatus(), nx = S.nextOnRoad();
    var h = '<div class="card"><h1>道 — 投資プロへの一本道</h1>'
      + '<p class="lead">横に12章（投資プロセスの工程）、縦に3周（職位の視点）。<b>1周目で全章を薄く通し</b>、同じ案件「信州精機」を2周目・3周目で厚くします。'
      + '各章は「工程講義 → 演習セット → ケース課題 → 判断ジャーナル」。● 修了　◐ 着手中　○ 未着手　－ 準備中</p>';
    DOJO.LAPS2.forEach(function (lap) {
      var items = road.filter(function (x) { return x.lap === lap.id; });
      var ready = items.filter(function (x) { return x.ready; });
      var done = ready.filter(function (x) { return x.done; }).length;
      var hours = DOJO.CHAPTERS.reduce(function (s, c) { return s + (c.hours[lap.id] || 0); }, 0);
      h += '<div class="lapblock"><div class="spread"><div>' + lapChip(lap.id) + ' <b>' + esc(lap.short) + '</b> <span class="small muted">約' + hours + '時間</span></div>'
        + '<span class="small">修了 ' + done + ' / ' + ready.length + '</span></div>'
        + '<div class="small muted" style="margin:4px 0 8px">' + esc(lap.desc) + '</div><div class="roadrow">';
      items.forEach(function (x) {
        var mark = !x.ready ? '－' : x.done ? '●' : x.started ? '◐' : '○';
        var here = nx && nx.ch === x.ch && nx.lap === x.lap;
        h += '<a class="roadcell' + (x.done ? ' done' : x.started ? ' part' : '') + (here ? ' here' : '') + (!x.ready ? ' na' : '') + '" href="#/ch/' + x.ch + '/' + lap.id + '">'
          + '<div class="rc-no">' + mark + ' 第' + x.chapter.n + '章</div><div class="rc-name">' + esc(x.chapter.name) + '</div>'
          + '<div class="rc-st small">' + (x.ready ? ('講' + x.lecRead + '/' + x.lectures + '・演' + x.ss.cleared + '/' + x.ss.total + '・課' + x.tasksDone + '/' + x.tasks) : '準備中') + '</div></a>';
      });
      h += '</div></div>';
    });
    h += '</div>';
    h += '<div class="card"><h2 style="margin-top:0">枝ケース</h2><p class="small muted">背骨（信州精機）で身につけた型を、別の案件型に転用する短いケース。2周目にA〜D、3周目にE〜H。</p><div class="grid g2">';
    DOJO.BRANCHES.forEach(function (b) {
      var cs = DOJO.caseById(b.id);
      h += '<div class="tcard' + (cs ? '' : ' na') + '"' + (cs ? ' data-go="' + caseHash(b.id, b.lap) + '" style="cursor:pointer"' : '') + '>'
        + '<div class="t"><span class="badge">枝' + b.letter + '</span> ' + esc(b.name) + ' ' + lapChip(b.lap) + '</div><div class="d">' + esc(b.desc) + (cs ? '' : '<br><span class="muted">準備中</span>') + '</div></div>';
    });
    h += '</div></div>';
    app.innerHTML = h;
  };

  /* ===================== 章 ===================== */
  UI.chapter = function (chId, lap) {
    var c = DOJO.chapterById(chId); lap = parseInt(lap, 10) || 1;
    if (!c) return UI.notfound();
    var S = DOJO.Store, st = S.chapterStatus(chId, lap), lapObj = DOJO.lapById(lap);
    var lecs = DOJO.lecturesOf(chId, lap);
    var cs = c.caseId ? DOJO.caseById(c.caseId) : null;
    var tasks = cs ? cs.tasks.filter(function (t) { return (t.lap || 1) === lap; }) : [];
    var idx = DOJO.CHAPTERS.indexOf(c), prevC = DOJO.CHAPTERS[idx - 1], nextC = DOJO.CHAPTERS[idx + 1];
    var ni = S.nextInChapter(chId, lap);

    var h = '<div class="card"><div class="spread"><div>' + lapChip(lap) + ' <span class="muted small">第' + c.n + '章</span>'
      + '<h1 style="margin:2px 0 0">' + esc(c.name) + '</h1><p class="lead" style="margin:4px 0 0">' + esc(c.q) + '</p></div>'
      + '<div class="row">' + DOJO.LAPS2.map(function (l) { return '<button class="btn sm' + (l.id === lap ? ' primary' : '') + '" data-go="#/ch/' + chId + '/' + l.id + '">' + l.name + '</button>'; }).join('') + '</div></div>'
      + '<div class="small" style="margin-top:10px"><b>到達目標：</b>' + esc(c.goal) + '</div>'
      + '<div style="margin-top:6px">' + skillChips(c.skills) + '</div>'
      + '<div class="small muted" style="margin-top:6px">この周の所要目安：約' + (c.hours[lap] || 0) + '時間　｜　講義 ' + st.lecRead + '/' + st.lectures + '　演習セット合格 ' + st.ss.cleared + '/' + st.ss.total + '　ケース課題 ' + st.tasksDone + '/' + st.tasks + (tasks.length ? '　ジャーナル ' + (st.journalDone ? '✓' : '未') : '') + '</div>';
    if (ni) {
      var goH = ni.kind === 'lecture' ? '#/lec2/' + ni.id : ni.kind === 'set' ? '#/ex/' + chId + '/' + lap + '/' + ni.i : caseHash(c.caseId, lap);
      h += '<div class="act" style="margin-top:12px"><div class="act-ic">▶</div><div class="act-b"><b>次にやること：' + esc(ni.title) + '</b><div class="small muted">順に進めば迷いません。</div></div><a class="act-go" href="' + goH + '">開く →</a></div>';
    } else if (st.done) {
      h += '<div class="verdict ok" style="margin-top:12px">この章のこの周は修了。' + (nextC ? '次は第' + nextC.n + '章「' + esc(nextC.name) + '」へ。' : '次の周へ。') + '</div>';
    }
    h += '</div>';

    // ① 工程講義
    h += '<div class="card"><h2 style="margin-top:0">① 工程講義 <span class="small muted">プロの手本を見る（各15分）</span></h2>';
    if (!lecs.length) h += '<p class="empty">この周の講義は準備中です。</p>';
    else h += '<div class="leclist">' + lecs.map(function (l, i) {
      var read = S.isRead2(l.id);
      return '<a class="lecrow' + (read ? ' read' : '') + '" href="#/lec2/' + l.id + '"><span class="lr-no">' + (read ? '✓' : (i + 1)) + '</span><span class="lr-t"><b>' + esc(l.title) + '</b>'
        + '<span class="small muted">' + (l.minutes || 15) + '分　' + skillChips(l.skills) + '</span></span><span class="act-go">→</span></a>';
    }).join('') + '</div>';
    h += '</div>';

    // ② 演習セット
    var libN = DOJO.v1QuestionsOf ? DOJO.v1QuestionsOf(chId, lap).length : 0;
    h += '<div class="card"><div class="spread"><h2 style="margin:0">② 演習セット <span class="small muted">10問・80%で合格</span></h2><div class="row">'
      + (st.ss.total ? '<button class="btn sm" data-go="#/ex/' + chId + '/' + lap + '/mix">混合ドリル（既習章と混ぜて10問）</button>' : '')
      + (libN ? '<button class="btn sm" data-go="#/ex/' + chId + '/' + lap + '/lib">資料庫ドリル（旧版の関連問題 ' + libN + '問から10問）</button>' : '') + '</div></div>';
    if (!st.ss.total) h += '<p class="empty">この周の演習は準備中です。</p>';
    else {
      h += '<div class="setgrid" style="margin-top:10px">' + st.ss.sets.map(function (x) {
        var label = x.state === 'clear' ? '合格 ' + pct(x.rec.best) : x.state === 'tried' ? '最高 ' + pct(x.rec.best) : x.state === 'part' ? '解きかけ' : '未着手';
        return '<a class="setcard ' + x.state + '" href="#/ex/' + chId + '/' + lap + '/' + x.i + '"><div class="sc-no">' + (x.state === 'clear' ? '★ ' : '') + 'セット' + (x.i + 1) + '</div><div class="sc-n">' + x.n + '問</div><div class="sc-st">' + label + '</div></a>';
      }).join('') + '</div>';
    }
    h += '</div>';

    // ③ ケース章
    h += '<div class="card"><h2 style="margin-top:0">③ ケース課題 <span class="small muted">成果物を作る → 自己採点 → プロの成果物と比べる</span></h2>';
    if (!cs || !tasks.length) h += '<p class="empty">この周のケース課題は準備中です。</p>';
    else {
      h += '<div class="small" style="margin-bottom:8px"><b>' + esc(cs.title || cs.id) + '</b></div><table class="data"><thead><tr><th>課題</th><th>成果物</th><th>目安</th><th>状態</th></tr></thead><tbody>';
      tasks.forEach(function (t) {
        var d = S.deliverable(cs.id + '#' + t.id);
        var stt = !d ? '<span class="muted">未着手</span>' : !d.selfBand ? '下書き保存' : '<span class="band ' + d.selfBand + '">' + DOJO.BAND_NAME[d.selfBand] + 'バンド</span>' + (d.modelBand ? ' <span class="small muted">（模範 ' + DOJO.BAND_NAME[d.modelBand] + '）</span>' : '');
        h += '<tr><td>' + esc(t.title || t.deliverable) + '</td><td>' + esc(t.deliverable) + '</td><td>' + (t.minutes || '—') + '分</td><td>' + stt + '</td></tr>';
      });
      h += '</tbody></table><div class="row" style="margin-top:10px"><button class="btn primary" data-go="' + caseHash(cs.id, lap) + '">ケースを開く →</button></div>';
    }
    h += '</div>';

    // ④ ジャーナル
    if (tasks.length) {
      h += '<div class="card"><h2 style="margin-top:0">④ 判断ジャーナル</h2><p class="small muted">この章で何を決め、何を見落とし、次に何を変えるか。ケースの末尾で書けます。' + (st.journalDone ? ' <b>✓ 記録済み</b>' : '') + '</p>'
        + '<div class="row"><button class="btn sm" data-go="#/journal">ジャーナル一覧</button></div></div>';
    }
    h += '<div class="card"><div class="spread"><div class="row">'
      + (prevC ? '<button class="btn sm" data-go="#/ch/' + prevC.id + '/' + lap + '">← 第' + prevC.n + '章 ' + esc(prevC.name) + '</button>' : '')
      + (nextC ? '<button class="btn sm" data-go="#/ch/' + nextC.id + '/' + lap + '">第' + nextC.n + '章 ' + esc(nextC.name) + ' →</button>' : '')
      + '</div><button class="btn sm" data-go="#/road">道へ戻る</button></div></div>';
    app.innerHTML = h;
  };

  /* ===================== 工程講義 ===================== */
  UI.lecture2 = function (id) {
    var l = DOJO.LECTURES2[id];
    if (!l) return UI.notfound();
    var c = DOJO.chapterById(l.chapter), S = DOJO.Store;
    var lecs = DOJO.lecturesOf(l.chapter, l.lap), i = lecs.indexOf(l);
    var prevL = lecs[i - 1], nextL = lecs[i + 1];
    var h = '<div class="card"><div class="spread"><div>' + lapChip(l.lap) + ' <span class="muted small">第' + c.n + '章 ' + esc(c.name) + '　講義 ' + (i + 1) + '/' + lecs.length + '</span>'
      + '<h1 style="margin:2px 0 0">' + esc(l.title) + '</h1><div style="margin-top:6px">' + skillChips(l.skills) + ' <span class="small muted">約' + (l.minutes || 15) + '分</span></div></div>'
      + '<button class="btn sm" data-go="#/ch/' + l.chapter + '/' + l.lap + '">← 章へ</button></div></div>';
    h += '<div class="lecwrap"><div class="card prose lec2" id="lecBody">';
    DOJO.LECTURE_SECTIONS.forEach(function (sct) {
      var body = l.sections[sct.key];
      h += '<section class="lsec lsec-' + sct.key + '" id="s-' + sct.key + '"><h2><span class="sno">' + sct.no + '</span> ' + esc(sct.title) + '</h2>';
      if (!body) h += '<p class="empty small">（この節は準備中）</p>';
      else if (Array.isArray(body)) h += '<ul class="terms">' + body.map(function (t) { return '<li><b>' + esc(t.term) + '</b>' + (t.en ? ' <span class="muted small">' + esc(t.en) + '</span>' : '') + '：' + MD.inline(t.def || '') + '</li>'; }).join('') + '</ul>';
      else h += MD.render(body);
      h += '</section>';
    });
    h += '</div><div class="toc card" style="padding:12px 14px"><div class="small muted" style="font-weight:700;margin-bottom:6px">目次</div>'
      + DOJO.LECTURE_SECTIONS.map(function (s) { return '<a href="#s-' + s.key + '" data-anchor="s-' + s.key + '">' + s.no + ' ' + esc(s.title) + '</a>'; }).join('') + '</div></div>';
    var read = S.isRead2(id);
    var ss = S.setSummary2(l.chapter, l.lap);
    h += '<div class="card"><div class="spread"><div class="row">'
      + (prevL ? '<button class="btn sm" data-go="#/lec2/' + prevL.id + '">← ' + esc(prevL.title) + '</button>' : '')
      + (nextL ? '<button class="btn sm" data-go="#/lec2/' + nextL.id + '">' + esc(nextL.title) + ' →</button>' : '') + '</div>'
      + '<div class="row"><button class="btn" id="markRead2"' + (read ? ' disabled' : '') + '>' + (read ? '読了 ✓' : '読了にする') + '</button>'
      + (nextL ? '<button class="btn primary" id="readNext">読了して次の講義へ →</button>'
        : (ss.total ? '<button class="btn primary" id="readNext">読了して演習セット' + ((ss.next ? ss.next.i : 0) + 1) + 'へ →</button>' : '<button class="btn primary" id="readNext">読了して章へ →</button>'))
      + '</div></div></div>';
    app.innerHTML = h;
    UI.linkTerms(el('lecBody'));
    on('[data-anchor]', 'click', function (e) { e.preventDefault(); var n = el(e.currentTarget.dataset.anchor); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el('markRead2').addEventListener('click', function () { S.markRead2(id); this.textContent = '読了 ✓'; this.disabled = true; });
    el('readNext').addEventListener('click', function () {
      S.markRead2(id);
      if (nextL) go('#/lec2/' + nextL.id);
      else if (ss.total) go('#/ex/' + l.chapter + '/' + l.lap + '/' + (ss.next ? ss.next.i : 0));
      else go('#/ch/' + l.chapter + '/' + l.lap);
    });
    window.scrollTo(0, 0);
  };

  /* ===================== 演習（14型） ===================== */
  function typeBadge(q) { var t = DOJO.QTYPES[q.type]; return '<span class="badge type">' + esc(t ? t.name : '問題') + '</span>'; }

  function renderItemBody(it) {
    var q = it.q, st = it.st, h = '';
    switch (q.type) {
      case 13: case 14: case 5: {
        var arr = q.type === 5 ? q.candidates : q.choices;
        var ans = q.type === 5 ? q.best : q.a;
        h += '<div class="qtext">' + MD.inline(q.q) + '</div>';
        if (q.type === 5 && q.summary) h += '<div class="doc small">' + MD.render(q.summary) + '</div>';
        h += '<div class="choices">';
        st.order.forEach(function (oi, di) {
          var cls = 'choice';
          if (it.answered) { if (oi === ans) cls += ' ok'; else if (it.detail && it.detail.pickedOrig === oi) cls += ' ng'; }
          h += '<button class="' + cls + '" data-pick="' + di + '"' + (it.answered ? ' disabled' : '') + '><span class="k">' + 'ABCDEFG'[di] + '</span><span>' + MD.inline(arr[oi]) + '</span></button>';
        });
        h += '</div>';
        break;
      }
      case 11: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div>';
        h += '<div class="row"><input type="number" step="any" id="numIn" class="numin" placeholder="数値"' + (it.answered ? ' value="' + esc(it.input) + '" disabled' : '') + '>'
          + '<span class="muted">' + esc(q.answer.unit || '') + '</span>' + (it.answered ? '' : '<button class="btn primary" id="submitBtn">答える</button>') + '</div>';
        if (it.answered) h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">' + (it.correct ? '正解' : '不正解') + '　正答 ' + esc(q.answer.value) + esc(q.answer.unit || '') + (q.answer.tol ? '（許容 ±' + q.answer.tol + '）' : '') + '</div>';
        break;
      }
      case 9: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div><div class="numgrid">';
        Object.keys(q.answer).forEach(function (k) {
          var a = q.answer[k];
          h += '<label>' + esc(a.label || k) + '<input type="number" step="any" data-k="' + k + '"' + (it.answered ? ' value="' + esc(it.input && it.input[k]) + '" disabled' : '') + '>'
            + (it.answered ? '<span class="' + (it.detail[k].ok ? 'okc' : 'ngc') + '">正答 ' + esc(a.value) + '</span>' : '') + '</label>';
        });
        h += '</div>' + (it.answered ? '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">' + (it.correct ? '全項目正解' : '一部不正解') + '</div>' : '<div class="row"><button class="btn primary" id="submitBtn">答える</button></div>');
        break;
      }
      case 8: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div>';
        if (q.claim) h += '<div class="doc"><b>主張：</b>' + MD.inline(q.claim) + '</div>';
        h += '<div class="row"><input type="number" min="0" max="100" id="numIn" class="numin" placeholder="確率（%）"' + (it.answered ? ' value="' + esc(it.input) + '" disabled' : '') + '><span class="muted">%</span>' + (it.answered ? '' : '<button class="btn primary" id="submitBtn">答える</button>') + '</div>';
        if (it.answered) h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">基準率（外部視点） ' + Math.round(it.detail.base) + '%　あなた ' + esc(it.detail.p) + '%　差 ' + Math.round(Math.abs(it.detail.p - it.detail.base)) + 'ポイント</div>';
        break;
      }
      case 2: {
        h += '<div class="doc"><div class="small muted">状況</div>' + MD.render(q.vignette) + '</div>'
          + '<div class="doc"><div class="small muted">あなたの仮説</div>' + MD.inline(q.hypothesis) + '</div>'
          + '<div class="doc newfact"><div class="small muted">新しい事実</div>' + MD.inline(q.newFact) + '</div>'
          + '<div class="qtext">この事実は、仮説への確信をどう動かすか？</div><div class="concord">';
        [-2, -1, 0, 1, 2].forEach(function (k) {
          var lab = { '-2': '大きく弱める', '-1': '弱める', '0': '変えない', '1': '強める', '2': '大きく強める' }[String(k)];
          var cls = 'sc';
          if (it.answered) { if (String(k) === String(it.detail.mode)) cls += ' ok'; if (k === it.detail.pick && String(k) !== String(it.detail.mode)) cls += ' ng'; }
          h += '<button class="' + cls + '" data-sc="' + k + '"' + (it.answered ? ' disabled' : '') + '><b>' + (k > 0 ? '+' : '') + k + '</b><span>' + lab + '</span>'
            + (it.answered ? '<i class="bar"><b style="width:' + Math.round(((q.expert || {})[String(k)] || 0) / Math.max.apply(null, Object.keys(q.expert || {}).map(function (x) { return q.expert[x]; }).concat([1])) * 100) + '%"></b></i>' : '') + '</button>';
        });
        h += '</div>' + (it.answered ? '<div class="small muted">棒は専門家パネルの回答分布。多数と一致なら正解扱い（自分の判断を専門家の分布と照らす訓練）。</div>' : '');
        break;
      }
      case 3: case 10: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div><div class="small muted">項目を、あなたが考える順にタップしてください（タップした順が回答順）。</div><div class="ordering">';
        var picked = st.picked || [];
        st.order.forEach(function (oi) {
          var pos = picked.indexOf(oi);
          var exp = q.expertOrder || q.order;
          var cls = 'ord' + (pos >= 0 ? ' picked' : '');
          if (it.answered) { var ep = exp.indexOf(oi), up = (it.input || []).indexOf(oi); cls += (ep === up ? ' ok' : ' ng'); }
          h += '<button class="' + cls + '" data-ord="' + oi + '"' + (it.answered ? ' disabled' : '') + '><span class="k">' + (pos >= 0 ? (pos + 1) : '・') + '</span><span>' + MD.inline(q.items[oi]) + '</span>'
            + (it.answered ? '<span class="expno">専門家：' + ((q.expertOrder || q.order).indexOf(oi) + 1) + '</span>' : '') + '</button>';
        });
        h += '</div>';
        if (!it.answered) h += '<div class="row"><button class="btn primary" id="submitBtn"' + (picked.length === q.items.length ? '' : ' disabled') + '>この順で答える</button><button class="btn sm" id="clearOrd">やり直す</button></div>';
        else h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">' + (q.type === 10 ? (it.correct ? '順序どおり' : '順序が違う') : (it.correct ? '専門家の優先順位とほぼ一致' : '専門家の優先順位と乖離')) + '　一致 ' + it.detail.matched + '/' + it.detail.n + '</div>'
          + (q.rationale ? '<div class="doc"><div class="small muted">専門家の順序の理由</div>' + MD.render(q.rationale) + '</div>' : '');
        break;
      }
      case 4: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div><div class="small muted">おかしい行をすべてタップしてから「答える」。</div><table class="model">';
        q.model.forEach(function (r, ri) {
          var sel = (st.selected || []).indexOf(ri) >= 0;
          var isBug = q.bugs.some(function (b) { return b.row === ri; });
          var cls = (sel ? 'sel' : '') + (it.answered ? (isBug ? ' bug' : (sel ? ' wrongpick' : '')) : '');
          h += '<tr class="' + cls + '" data-row="' + ri + '"><td class="lbl">' + MD.inline(r.label) + '</td><td class="val">' + esc(r.value) + '</td>' + (r.note ? '<td class="note small">' + MD.inline(r.note) + '</td>' : '<td></td>') + '</tr>';
        });
        h += '</table>';
        if (!it.answered) h += '<div class="row"><button class="btn primary" id="submitBtn">答える</button></div>';
        else {
          h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">' + (it.correct ? '誤りを全て特定' : '的中 ' + it.detail.hit + '　見逃し ' + it.detail.miss + '　誤指摘 ' + it.detail.extra) + '</div>';
          h += '<div class="doc"><div class="small muted">誤りと直し方</div><ul>' + q.bugs.map(function (b) { return '<li><b>' + MD.inline(q.model[b.row].label) + '</b>：' + MD.inline(b.fix) + (b.why ? '<br><span class="small muted">' + MD.inline(b.why) + '</span>' : '') + '</li>'; }).join('') + '</ul></div>';
        }
        break;
      }
      case 6: case 7: case 12: case 1: {
        h += '<div class="qtext">' + MD.inline(q.q) + '</div>';
        if (q.material) h += '<div class="doc"><div class="small muted">材料</div>' + MD.render(q.material) + '</div>';
        if (q.prompt) h += '<div class="small" style="margin:6px 0"><b>課題：</b>' + MD.inline(q.prompt) + '</div>';
        if (!it.answered) {
          h += '<textarea id="genText" class="deliverable" rows="6" placeholder="ここに書く。書いてから採点する。">' + esc(st.draft || '') + '</textarea>';
          if (!st.phase) h += '<div class="row"><button class="btn primary" id="submitBtn">書き終えた → 自己採点へ</button></div>';
          else {
            h += '<div class="doc"><div class="small muted">模範（VPバンドの水準）</div>' + MD.render(q.exemplar || '') + '</div>';
            if (q.rubric && DOJO.RUBRICS[q.rubric]) {
              var r = DOJO.RUBRICS[q.rubric];
              h += '<div class="small muted">ルーブリック「' + esc(r.name) + '」の観点：' + r.criteria.map(function (c) { return esc(c.name); }).join('・') + '</div>';
            }
            h += '<div class="small" style="margin-top:8px"><b>自分の答えはどのバンドか？</b>（模範と比べて正直に）</div><div class="row bands">'
              + ['analyst', 'associate', 'vp'].map(function (b) { return '<button class="btn band ' + b + '" data-band="' + b + '">' + DOJO.BAND_NAME[b] + 'バンド</button>'; }).join('') + '</div>';
          }
        } else {
          h += '<div class="doc"><div class="small muted">あなたの答え</div><pre class="plain">' + esc(it.detail.text || '') + '</pre></div>'
            + '<div class="doc"><div class="small muted">模範（VPバンドの水準）</div>' + MD.render(q.exemplar || '') + '</div>'
            + '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">自己採点：' + DOJO.BAND_NAME[it.detail.band] + 'バンド</div>';
        }
        break;
      }
    }
    return h;
  }

  function renderExercise() {
    var s = DOJO.current2;
    if (!s) return UI.home();
    if (s.finished) return renderExerciseResult();
    var it = s.cur, q = it.q, S = DOJO.Store;
    var c = DOJO.chapterById(q.chapter);
    var h = '<div class="card"><div class="qhead"><div class="qmeta">' + lapChip(q.lap) + '<span class="badge">第' + (c ? c.n : '?') + '章 ' + esc(c ? c.name : q.chapter) + '</span>' + typeBadge(q) + skillChips(q.skills) + '</div>'
      + '<div class="qmeta"><span class="muted small">' + (s.idx + 1) + ' / ' + s.total + '　正答 ' + s.correctCount + '</span><button class="btn sm" id="quitBtn" title="進捗は保存されます">中断（保存）</button></div></div>'
      + '<div class="progressline"><i style="width:' + (s.idx / s.total * 100) + '%"></i></div>';
    h += renderItemBody(it);
    if (it.answered) {
      if (q.type === 13 || q.type === 14 || q.type === 5) h += '<div class="verdict ' + (it.correct ? 'ok' : 'ng') + '">' + (it.correct ? '正解' : '不正解') + '</div>';
      var expText = q.exp || q.why || '';
      if (expText) h += '<div class="exp"><h5>解説</h5><div class="body">' + MD.render(expText) + '</div></div>';
      h += '<div class="row" style="margin-top:14px">' + (s.idx > 0 ? '<button class="btn sm" id="prevBtn">← 前へ</button>' : '')
        + '<button class="btn primary" id="nextBtn">' + (s.idx === s.total - 1 ? '結果を見る' : '次の問題 →') + '</button></div>';
    }
    h += '</div>';
    h += '<div class="card"><div class="small muted" style="margin-bottom:6px">進捗</div><div class="row" style="gap:4px">' + s.items.map(function (x, i) {
      var col = x.correct === true ? 'var(--ok)' : x.answered ? 'var(--ng)' : 'var(--panel-2)';
      return '<button class="btn sm" data-jump="' + i + '" style="min-width:30px;padding:3px 6px;background:' + col + ';color:' + (x.answered ? '#fff' : 'var(--ink-2)') + ';' + (i === s.idx ? 'outline:2px solid var(--accent);' : '') + '">' + (i + 1) + '</button>';
    }).join('') + '</div></div>';
    app.innerHTML = h;
    app.querySelectorAll('.exp .body, .doc').forEach(function (n) { UI.linkTerms(n); });

    function persist() { S.saveSession2(s.snapshot()); }
    persist();
    function submit(input) { s.submit(input); persist(); renderExercise(); }

    on('[data-pick]', 'click', function (e) { submit(parseInt(e.currentTarget.dataset.pick, 10)); });
    on('[data-sc]', 'click', function (e) { submit(parseInt(e.currentTarget.dataset.sc, 10)); });
    on('[data-ord]', 'click', function (e) {
      if (it.answered) return;
      var oi = parseInt(e.currentTarget.dataset.ord, 10);
      it.st.picked = it.st.picked || [];
      var p = it.st.picked.indexOf(oi);
      if (p >= 0) it.st.picked.splice(p, 1); else it.st.picked.push(oi);
      persist(); renderExercise();
    });
    var co = el('clearOrd'); if (co) co.addEventListener('click', function () { it.st.picked = []; persist(); renderExercise(); });
    on('tr[data-row]', 'click', function (e) {
      if (it.answered) return;
      var ri = parseInt(e.currentTarget.dataset.row, 10);
      it.st.selected = it.st.selected || [];
      var p = it.st.selected.indexOf(ri);
      if (p >= 0) it.st.selected.splice(p, 1); else it.st.selected.push(ri);
      persist(); renderExercise();
    });
    var sb = el('submitBtn');
    if (sb) sb.addEventListener('click', function () {
      if (q.type === 11 || q.type === 8) { var v = el('numIn').value; if (v === '') return; submit(v); }
      else if (q.type === 9) { var o = {}; app.querySelectorAll('.numgrid input').forEach(function (n) { o[n.dataset.k] = n.value; }); submit(o); }
      else if (q.type === 3 || q.type === 10) { submit((it.st.picked || []).slice()); }
      else if (q.type === 4) { submit((it.st.selected || []).slice()); }
      else if (DOJO.GENERATIVE_TYPES[q.type]) { it.st.draft = (el('genText') || {}).value || ''; it.st.phase = 'grade'; persist(); renderExercise(); }
    });
    var gt = el('genText'); if (gt) gt.addEventListener('input', function () { it.st.draft = gt.value; });
    on('[data-band]', 'click', function (e) { submit({ text: it.st.draft || (el('genText') || {}).value || '', band: e.currentTarget.dataset.band }); });
    on('[data-jump]', 'click', function (e) { s.goto(parseInt(e.currentTarget.dataset.jump, 10)); persist(); renderExercise(); });
    var nb = el('nextBtn'); if (nb) nb.addEventListener('click', function () { if (!s.next()) s.finish(); else persist(); renderExercise(); });
    var pb = el('prevBtn'); if (pb) pb.addEventListener('click', function () { s.prev(); persist(); renderExercise(); });
    var qb = el('quitBtn'); if (qb) qb.addEventListener('click', function () { persist(); DOJO.current2 = null; go(s.opts.ch ? '#/ch/' + s.opts.ch + '/' + s.opts.lap : '#/'); });
    window.scrollTo(0, 0);
  }

  function renderExerciseResult() {
    var s = DOJO.current2, S = DOJO.Store;
    var acc = s.total ? s.correctCount / s.total : 0, wrong = s.wrongItems;
    var isSet = s.mode === 'set' && s.opts.ch && typeof s.opts.set === 'number';
    S.clearSession2();
    var passed = false, ss = null;
    if (isSet && s.answered === s.total) { S.recordSet2(s.opts.ch, s.opts.lap, s.opts.set, s.correctCount, s.total); passed = acc >= S.PASS; ss = S.setSummary2(s.opts.ch, s.opts.lap); }
    else if (isSet) ss = S.setSummary2(s.opts.ch, s.opts.lap);
    var h = '<div class="card"><h1>' + esc(s.title) + '　結果</h1>';
    if (isSet && s.answered === s.total) h += '<div class="verdict ' + (passed ? 'ok' : 'ng') + '">' + (passed ? '★ 合格（' + pct(acc) + '）' : '不合格（' + pct(acc) + ' / 合格80%）') + '</div>';
    h += '<div class="grid g4"><div class="stat"><div class="v">' + s.correctCount + ' / ' + s.total + '</div><div class="l">正答</div></div>'
      + '<div class="stat"><div class="v">' + pct(acc) + '</div><div class="l">正答率</div></div><div class="stat"><div class="v">' + wrong.length + '</div><div class="l">誤答</div></div>'
      + '<div class="stat"><div class="v">' + Math.round((Date.now() - s.startedAt) / 60000) + '分</div><div class="l">所要</div></div></div>';
    h += '<p class="lead" style="margin-top:14px">' + (passed ? '合格。誤答の解説を読んでから次へ。' : isSet ? '誤答の解説を読み、講義の§4型を見直してから同じセットをもう一度。' : '誤答を潰すのが最短の上達。') + '</p><div class="row">';
    if (isSet) {
      if (passed && ss && ss.next) h += '<button class="btn primary" data-go="#/ex/' + s.opts.ch + '/' + s.opts.lap + '/' + ss.next.i + '">次へ：セット' + (ss.next.i + 1) + ' →</button>';
      else if (passed) h += '<button class="btn primary" data-go="#/ch/' + s.opts.ch + '/' + s.opts.lap + '">全セット合格。章に戻ってケース課題へ →</button>';
      else h += (wrong.length ? '<button class="btn primary" id="retryWrong">誤答' + wrong.length + '問を解き直す</button>' : '') + '<button class="btn" id="againBtn">同じセットをもう一度</button>';
      h += '<button class="btn" data-go="#/ch/' + s.opts.ch + '/' + s.opts.lap + '">章へ</button>';
    } else {
      h += (wrong.length ? '<button class="btn primary" id="retryWrong">誤答' + wrong.length + '問を解き直す</button>' : '') + (s.opts.ch ? '<button class="btn" data-go="#/ch/' + s.opts.ch + '/' + s.opts.lap + '">章へ</button>' : '<button class="btn" data-go="#/road">道へ</button>');
    }
    h += '</div></div>';
    if (wrong.length) {
      h += '<div class="card"><h3>誤答の復習</h3>' + wrong.map(function (it) {
        return '<div style="border-top:1px solid var(--line);padding:12px 0">' + typeBadge(it.q) + ' <b>' + MD.inline(it.q.q || it.q.hypothesis || '') + '</b>'
          + '<div class="exp"><div class="body">' + MD.render(it.q.exp || it.q.why || it.q.rationale || '') + '</div></div></div>';
      }).join('') + '</div>';
    }
    app.innerHTML = h;
    var rw = el('retryWrong'); if (rw) rw.addEventListener('click', function () { DOJO.current2 = DOJO.current2.retryWrong(); renderExercise(); });
    var ag = el('againBtn'); if (ag) ag.addEventListener('click', function () { DOJO.current2 = new DOJO.Session2(DOJO.current2.opts); renderExercise(); });
    window.scrollTo(0, 0);
  }

  UI.exercise = function (ch, lap, which) {
    lap = parseInt(lap, 10) || 1;
    var S = DOJO.Store, c = DOJO.chapterById(ch);
    if (which === 'resume') {
      var snap = S.getSession2(); var rs = snap ? DOJO.Session2.restore(snap) : null;
      if (!rs) { app.innerHTML = '<div class="card"><p class="empty">再開できる演習はありません。</p><button class="btn" data-go="#/">ホームへ</button></div>'; return; }
      for (var i = 0; i < rs.items.length; i++) if (!rs.items[i].answered) { rs.idx = i; break; }
      DOJO.current2 = rs; renderExercise(); return;
    }
    if (!c) return UI.notfound();
    var title = '第' + c.n + '章 ' + c.name + '・' + DOJO.lapById(lap).name;
    if (which === 'lib') {
      var ql = DOJO.buildLibrary(ch, lap);
      if (!ql.length) { app.innerHTML = '<div class="card"><p class="empty">この章に紐づく資料庫の問題はありません。</p><button class="btn" data-go="#/ch/' + ch + '/' + lap + '">章へ</button></div>'; return; }
      DOJO.current2 = new DOJO.Session2({ questions: ql, mode: 'lib', ch: ch, lap: lap, title: title + '　資料庫ドリル', shuffleQ: false });
      renderExercise(); return;
    }
    if (which === 'mix') {
      var qs = DOJO.buildMixed(ch, lap);
      if (!qs.length) { app.innerHTML = '<div class="card"><p class="empty">この章の演習は準備中です。</p><button class="btn" data-go="#/ch/' + ch + '/' + lap + '">章へ</button></div>'; return; }
      DOJO.current2 = new DOJO.Session2({ questions: qs, mode: 'mix', ch: ch, lap: lap, title: title + '　混合ドリル', shuffleQ: false });
      renderExercise(); return;
    }
    var setIdx = parseInt(which, 10); if (isNaN(setIdx)) setIdx = 0;
    var sets = DOJO.setsFor2(ch, lap), st = sets[setIdx];
    if (!st) { app.innerHTML = '<div class="card"><p class="empty">この章の演習は準備中です。</p><button class="btn" data-go="#/ch/' + ch + '/' + lap + '">章へ</button></div>'; return; }
    var snap2 = S.getSession2();
    if (snap2 && snap2.mode === 'set' && snap2.ch === ch && snap2.lap === lap && snap2.set === setIdx) {
      var restored = DOJO.Session2.restore(snap2);
      if (restored && !restored.items.every(function (x) { return x.answered; })) {
        for (var j = 0; j < restored.items.length; j++) if (!restored.items[j].answered) { restored.idx = j; break; }
        DOJO.current2 = restored; renderExercise(); return;
      }
    }
    var qs2 = st.qids.map(function (id) { return DOJO.questionById2(id); }).filter(Boolean);
    DOJO.current2 = new DOJO.Session2({ questions: qs2, mode: 'set', ch: ch, lap: lap, set: setIdx, title: title + '　セット' + (setIdx + 1), shuffleQ: false });
    renderExercise();
  };
  UI.renderExercise = renderExercise;

  /* ===================== ケース ===================== */
  UI.cases = function () {
    var S = DOJO.Store;
    var h = '<div class="card"><h1>ケース — 一本の案件を自分で運ぶ</h1><p class="lead">背骨は通しケース「信州精機」（事業承継×製造業）。第1章ソーシングから第11章事後検証まで、各章で成果物を作り、自己採点し、プロの成果物と比べ、判断ジャーナルに残します。枝ケースで型を別の案件型に転用します。</p>';
    if (DOJO.COMPANY) h += '<div class="row"><button class="btn" data-go="#/company">会社設定を読む（信州精機）</button></div>';
    h += '</div><div class="card"><h2 style="margin-top:0">通しケース「信州精機」</h2><table class="data"><thead><tr><th>章</th><th>ケース章</th><th>1周目</th><th>2周目</th><th>3周目</th></tr></thead><tbody>';
    DOJO.CHAPTERS.forEach(function (c) {
      var cs = c.caseId ? DOJO.caseById(c.caseId) : null;
      h += '<tr><td>第' + c.n + '章 ' + esc(c.name) + '</td><td>' + (cs ? esc(cs.title || '') : '<span class="muted">準備中</span>') + '</td>';
      [1, 2, 3].forEach(function (lap) {
        if (!cs) { h += '<td class="muted">－</td>'; return; }
        var tasks = cs.tasks.filter(function (t) { return (t.lap || 1) === lap; });
        if (!tasks.length) { h += '<td class="muted">－</td>'; return; }
        var done = tasks.filter(function (t) { var d = S.deliverable(cs.id + '#' + t.id); return d && d.selfBand; }).length;
        h += '<td><a href="' + caseHash(cs.id, lap) + '">' + (done === tasks.length ? '●' : done ? '◐' : '○') + ' ' + done + '/' + tasks.length + '</a></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    h += '<div class="card"><h2 style="margin-top:0">枝ケース</h2><div class="grid g2">' + DOJO.BRANCHES.map(function (b) {
      var cs = DOJO.caseById(b.id);
      var tasks = cs ? cs.tasks : [];
      var done = tasks.filter(function (t) { var d = S.deliverable(b.id + '#' + t.id); return d && d.selfBand; }).length;
      return '<div class="tcard' + (cs ? '' : ' na') + '"' + (cs ? ' data-go="' + caseHash(b.id, b.lap) + '" style="cursor:pointer"' : '') + '><div class="t"><span class="badge">枝' + b.letter + '</span> ' + esc(b.name) + ' ' + lapChip(b.lap) + '</div><div class="d">' + esc(b.desc) + '</div><div class="small muted">' + (cs ? '課題 ' + done + '/' + tasks.length : '準備中') + '</div></div>';
    }).join('') + '</div></div>';
    app.innerHTML = h;
  };

  UI.company = function () {
    var co = DOJO.COMPANY;
    if (!co) return UI.notfound();
    var h = '<div class="card"><h1>' + esc(co.name) + '</h1><p class="lead">' + esc(co.tagline || '') + '</p></div>';
    h += '<div class="card prose" id="coBody">' + MD.render(co.body || '') + '</div>';
    if (co.people) h += '<div class="card"><h2 style="margin-top:0">登場人物</h2><table class="data"><thead><tr><th>人物</th><th>立場</th><th>人柄・論点</th></tr></thead><tbody>' + co.people.map(function (p) { return '<tr><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.role) + '</td><td class="small">' + MD.inline(p.note) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    if (co.financials) h += '<div class="card prose">' + MD.render(co.financials) + '</div>';
    h += '<div class="card"><button class="btn" data-go="#/cases">← ケース一覧</button></div>';
    app.innerHTML = h;
    UI.linkTerms(el('coBody'));
  };

  function rubricForm(rubric, saved) {
    var h = '<div class="rubric"><div class="small muted">ルーブリック「' + esc(rubric.name) + '」。各観点で自分の成果物がどのバンドかを選ぶ。正直に——ギャップを知ることが訓練。</div><table class="data rub"><thead><tr><th>観点</th><th>配点</th><th>アナリスト</th><th>アソシエイト</th><th>VP</th></tr></thead><tbody>';
    rubric.criteria.forEach(function (c, i) {
      var g = saved && saved.grades ? saved.grades[i] : null;
      h += '<tr><td><b>' + esc(c.name) + '</b></td><td>' + c.pts + '</td>' + ['analyst', 'associate', 'vp'].map(function (b) {
        return '<td class="small"><button class="bandpick' + (g === b ? ' on' : '') + '" data-grade="' + b + '" data-crit="' + i + '">' + MD.inline(c.bands[b] || '') + '</button></td>';
      }).join('') + '</tr>';
    });
    h += '</tbody></table>';
    if (rubric.deductions && rubric.deductions.length) {
      h += '<div class="small" style="margin-top:8px"><b>減点項目（当てはまるものにチェック）</b></div>' + rubric.deductions.map(function (d, i) {
        var on = saved && saved.deductions && saved.deductions[i];
        return '<label class="small ded"><input type="checkbox" data-ded="' + i + '"' + (on ? ' checked' : '') + '> ' + esc(d.cond) + '（' + d.pts + '）</label>';
      }).join('');
    }
    h += '<div class="row" style="margin-top:10px"><button class="btn primary" data-finishgrade="1">採点を確定して、プロの成果物を開く</button><span class="small muted" id="rubScore"></span></div></div>';
    return h;
  }

  UI.caseView = function (cidRaw, lap) {
    var cid = (cidRaw || '').replace('~', '/'); lap = parseInt(lap, 10) || 1;
    var cs = DOJO.caseById(cid);
    if (!cs) return UI.notfound();
    var S = DOJO.Store, c = cs.chapter ? DOJO.chapterById(cs.chapter) : null, br = DOJO.branchById(cid);
    S.markCaseOpened(cid, lap);
    var tasks = cs.tasks.filter(function (t) { return (t.lap || 1) === lap; });
    var lapObj = DOJO.lapById(lap);
    var allGraded = tasks.length > 0 && tasks.every(function (t) { var d = S.deliverable(cid + '#' + t.id); return d && d.selfBand; });

    var h = '<div class="card"><div class="spread"><div>' + lapChip(lap) + (c ? ' <span class="muted small">第' + c.n + '章 ' + esc(c.name) + '</span>' : br ? ' <span class="muted small">枝' + br.letter + '</span>' : '')
      + '<h1 style="margin:2px 0 0">' + esc(cs.title || cid) + '</h1>' + (cs.subtitle ? '<p class="lead" style="margin:4px 0 0">' + esc(cs.subtitle) + '</p>' : '') + '</div>'
      + '<div class="row">' + [1, 2, 3].filter(function (l) { return cs.tasks.some(function (t) { return (t.lap || 1) === l; }); }).map(function (l) { return '<button class="btn sm' + (l === lap ? ' primary' : '') + '" data-go="' + caseHash(cid, l) + '">' + l + '周目</button>'; }).join('')
      + (c ? '<button class="btn sm" data-go="#/ch/' + c.id + '/' + lap + '">← 章へ</button>' : '<button class="btn sm" data-go="#/cases">← ケース一覧</button>') + '</div></div>'
      + (cs.intro ? '<div class="prose small" style="margin-top:8px">' + MD.render(cs.intro) + '</div>' : '')
      + (DOJO.COMPANY && cs.id.indexOf('spine/') === 0 ? '<div class="small muted">会社の全体像は <a href="#/company">会社設定（信州精機）</a>。</div>' : '') + '</div>';

    // ① 状況の提示
    if (cs.situation.length) {
      h += '<div class="card"><h2 style="margin-top:0">① 状況の提示 <span class="small muted">いま手元にある資料（実物として読む）</span></h2><div class="doctabs">'
        + cs.situation.map(function (d, i) { return '<button class="doctab' + (i === 0 ? ' on' : '') + '" data-doc="' + i + '">' + esc(d.type ? d.type + '：' : '') + esc(d.title) + '</button>'; }).join('') + '</div>'
        + cs.situation.map(function (d, i) { return '<div class="doc docbody prose" data-docbody="' + i + '"' + (i === 0 ? '' : ' hidden') + '>' + MD.render(d.body) + '</div>'; }).join('') + '</div>';
    }
    // 校正
    if (cs.calibration) {
      var cal = S.calib(cid).filter(function (x) { return x.point === 'lap' + lap; })[0];
      h += '<div class="card"><h2 style="margin-top:0">校正の記録 <span class="small muted">結果と比較するために、今の確信を数字で残す</span></h2><div class="small">' + MD.inline(cs.calibration.ask) + '</div>'
        + '<div class="row" style="margin-top:8px"><input type="number" min="0" max="100" id="calibIn" class="numin" value="' + (cal ? cal.p : '') + '" placeholder="0〜100"><span class="muted">%</span><button class="btn sm" id="calibSave">記録</button>'
        + (cal ? '<span class="small muted">記録済み：' + cal.p + '%</span>' : '') + '</div></div>';
    }
    // ② 任務
    h += '<div class="card"><h2 style="margin-top:0">② あなたの任務 <span class="small muted">' + esc(lapObj.role) + 'として</span></h2>';
    if (!tasks.length) h += '<p class="empty">この周の課題は準備中です。</p>';
    tasks.forEach(function (t, ti) {
      var key = cid + '#' + t.id, d = S.deliverable(key), rub = t.rubric ? DOJO.RUBRICS[t.rubric] : null;
      h += '<div class="task" data-task="' + t.id + '"><div class="spread"><div><span class="badge">課題' + (ti + 1) + '</span> <b>' + esc(t.title || t.deliverable) + '</b> <span class="small muted">' + (t.minutes ? '目安' + t.minutes + '分　' : '') + skillChips(t.skills) + '</span></div>'
        + (d && d.selfBand ? '<span class="band ' + d.selfBand + '">自己採点：' + DOJO.BAND_NAME[d.selfBand] + 'バンド</span>' : '') + '</div>'
        + '<div class="prose small" style="margin:6px 0">' + MD.render(t.brief || '') + '</div>'
        + (t.lectures && t.lectures.length ? '<div class="small muted">参照講義：' + t.lectures.map(function (lid) { var L = DOJO.LECTURES2[lid]; return L ? '<a href="#/lec2/' + lid + '">' + esc(L.title) + '</a>' : esc(lid); }).join('・') + '</div>' : '');
      // ④ 作業
      h += '<div class="small" style="margin-top:8px"><b>作業</b>' + (t.template ? '<span class="muted">（テンプレートを埋める形で書いてよい）</span>' : '') + '</div>'
        + '<textarea class="deliverable" data-key="' + key + '" rows="10" placeholder="' + esc(t.placeholder || 'ここに成果物を書く') + '">' + esc(d && d.text != null ? d.text : (t.template || '')) + '</textarea>'
        + '<div class="row"><button class="btn" data-save="' + key + '">下書きを保存</button>'
        + (rub && !(d && d.selfBand) ? '<button class="btn primary" data-startgrade="' + key + '">書き終えた → 自己採点へ</button>' : '')
        + '<span class="small muted" data-savemsg="' + key + '">' + (d && d.at ? '保存 ' + new Date(d.at).toLocaleString('ja-JP') : '') + '</span></div>';
      // ⑥ 自己採点
      if (rub && d && d.grading && !d.selfBand) h += '<div data-rubwrap="' + key + '">' + rubricForm(rub, d) + '</div>';
      // ⑤ プロの成果物（自己採点後）
      if (d && d.selfBand) {
        var sc = DOJO.scoreRubric(t.rubric, d.grades, d.deductions);
        h += '<div class="pro-output"><div class="spread"><h3 style="margin:0">⑤ プロの成果物と思考過程</h3><span class="small">自己採点 ' + (sc ? sc.pts + '/' + sc.total : '') + '　<span class="band ' + d.selfBand + '">' + DOJO.BAND_NAME[d.selfBand] + '</span>'
          + (d.modelBand ? '　模範判定 <span class="band ' + d.modelBand + '">' + DOJO.BAND_NAME[d.modelBand] + '</span>' : '') + '</span></div>'
          + (t.pro ? '<div class="doc prose"><div class="small muted">プロの成果物</div>' + MD.render(t.pro.text || '') + '</div>' + (t.pro.thinking ? '<div class="doc prose thinking"><div class="small muted">プロの思考過程</div>' + MD.render(t.pro.thinking) + '</div>' : '') : '<p class="empty small">（プロの成果物は準備中）</p>')
          + (!d.modelBand ? '<div class="small" style="margin-top:8px"><b>比べた上で、自分の成果物を改めて判定すると？</b>（これが「模範判定」として記録され、自己採点との差が校正ギャップになります）</div><div class="row bands">' + ['analyst', 'associate', 'vp'].map(function (b) { return '<button class="btn band ' + b + '" data-model="' + key + '" data-mband="' + b + '">' + DOJO.BAND_NAME[b] + '</button>'; }).join('') + '</div>' : '')
          + '</div>';
      }
      h += '</div>';
    });
    h += '</div>';

    // ⑧ 新情報の投下（全課題採点後）
    if (cs.newInfo.length) {
      h += '<div class="card' + (allGraded ? '' : ' locked') + '"><h2 style="margin-top:0">⑧ 新情報の投下 <span class="small muted">次章へ進む前に。確信は上がるか、下がるか</span></h2>';
      if (!allGraded) h += '<p class="small muted">課題をすべて自己採点すると開きます。</p>';
      else cs.newInfo.forEach(function (ni, i) {
        var pick = S.newInfoPick(cid, i);
        h += '<div class="doc newfact"><div class="small muted">新しい事実</div>' + MD.render(ni.fact) + (ni.question ? '<div class="small" style="margin-top:6px"><b>' + MD.inline(ni.question) + '</b></div>' : '') + '<div class="concord">'
          + [-2, -1, 0, 1, 2].map(function (k) {
            var lab = { '-2': '大きく弱める', '-1': '弱める', '0': '変えない', '1': '強める', '2': '大きく強める' }[String(k)];
            var cls = 'sc' + (pick !== null && pick === k ? ' picked' : '') + (pick !== null && ni.expert != null && k === ni.expert ? ' ok' : '');
            return '<button class="' + cls + '" data-ni="' + i + '" data-ni-pick="' + k + '"' + (pick !== null ? ' disabled' : '') + '><b>' + (k > 0 ? '+' : '') + k + '</b><span>' + lab + '</span></button>';
          }).join('') + '</div>' + (pick !== null && ni.exp ? '<div class="small" style="margin-top:6px">' + MD.render(ni.exp) + '</div>' : '') + '</div>';
      });
      h += '</div>';
    }
    // 罠と答えのない論点（全課題採点後）
    if (allGraded && (cs.trap || cs.openIssue)) {
      h += '<div class="card"><h2 style="margin-top:0">この章に埋めてあったもの</h2>'
        + (cs.trap ? '<div class="small"><b>罠：</b><ul>' + cs.trap.map(function (x) { return '<li>' + MD.inline(x) + '</li>'; }).join('') + '</ul></div>' : '')
        + (cs.openIssue ? '<div class="small"><b>答えのない論点：</b><ul>' + cs.openIssue.map(function (x) { return '<li>' + MD.inline(x) + '</li>'; }).join('') + '</ul></div>' : '') + '</div>';
    }
    // ⑦ 判断ジャーナル
    if (tasks.length) {
      var existing = S.journal().filter(function (j) { return j.caseId === cid && j.lap === lap; })[0];
      h += '<div class="card"><h2 style="margin-top:0">⑦ 判断ジャーナル <span class="small muted">5項目・3分。蓄積が「自分の失敗チェックリスト」になる</span></h2>'
        + (existing ? '<div class="verdict ok">記録済み（' + new Date(existing.at).toLocaleString('ja-JP') + '）。追記すると上書きされます。</div>' : '')
        + '<label class="jl">① 判断：この章で何を・なぜ決めたか（3行）<textarea id="jDecision" rows="3">' + esc(existing ? existing.decision : '') + '</textarea></label>'
        + '<label class="jl">② 確信度：この案件を最終的に推薦する確率（%）<input type="number" id="jConf" min="0" max="100" value="' + esc(existing ? existing.confidence : '') + '"></label>'
        + '<label class="jl">③ 見落とし：プロの成果物と比べて欠けていたもの<textarea id="jMissed" rows="2">' + esc(existing ? existing.missed : '') + '</textarea></label>'
        + '<label class="jl">④ 学び：次に同じ型の案件で変えること（1行）<input type="text" id="jLesson" value="' + esc(existing ? existing.lesson : '') + '"></label>'
        + '<div class="row"><button class="btn primary" id="jSave">ジャーナルを保存</button>' + (c ? '<button class="btn" data-go="#/ch/' + c.id + '/' + lap + '">章へ戻る</button>' : '') + '</div></div>';
    }
    app.innerHTML = h;
    app.querySelectorAll('.docbody, .prose').forEach(function (n) { UI.linkTerms(n); });

    on('.doctab', 'click', function (e) {
      var i = e.currentTarget.dataset.doc;
      app.querySelectorAll('.doctab').forEach(function (n) { n.classList.toggle('on', n.dataset.doc === i); });
      app.querySelectorAll('[data-docbody]').forEach(function (n) { n.hidden = n.dataset.docbody !== i; });
    });
    var cb = el('calibSave'); if (cb) cb.addEventListener('click', function () {
      var v = parseFloat(el('calibIn').value); if (isNaN(v)) return;
      S.addCalib({ caseId: cid, point: 'lap' + lap, p: v }); UI.caseView(cidRaw, lap);
    });
    function saveText(key) {
      var ta = app.querySelector('textarea.deliverable[data-key="' + key + '"]');
      S.saveDeliverable(key, { text: ta ? ta.value : '' });
      var m = app.querySelector('[data-savemsg="' + key + '"]'); if (m) m.textContent = '保存 ' + new Date().toLocaleTimeString('ja-JP');
    }
    on('[data-save]', 'click', function (e) { saveText(e.currentTarget.dataset.save); });
    on('[data-startgrade]', 'click', function (e) { var k = e.currentTarget.dataset.startgrade; saveText(k); S.saveDeliverable(k, { grading: true }); UI.caseView(cidRaw, lap); window.scrollTo(0, 0); });
    // 採点フォーム
    app.querySelectorAll('[data-rubwrap]').forEach(function (wrap) {
      var key = wrap.dataset.rubwrap, task = tasks.filter(function (t) { return cid + '#' + t.id === key; })[0], rub = DOJO.RUBRICS[task.rubric];
      var d = S.deliverable(key) || {}; var grades = (d.grades || []).slice(), deds = (d.deductions || []).slice();
      function upd() {
        var sc = DOJO.scoreRubric(task.rubric, grades, deds);
        var m = wrap.querySelector('#rubScore'); if (m && sc) m.textContent = '現在 ' + sc.pts + '/' + sc.total + '点 → ' + DOJO.BAND_NAME[sc.band] + 'バンド';
      }
      wrap.querySelectorAll('[data-grade]').forEach(function (b) {
        b.addEventListener('click', function () {
          var ci = parseInt(b.dataset.crit, 10); grades[ci] = b.dataset.grade;
          wrap.querySelectorAll('[data-crit="' + ci + '"]').forEach(function (x) { x.classList.toggle('on', x === b); });
          S.saveDeliverable(key, { grades: grades }); upd();
        });
      });
      wrap.querySelectorAll('[data-ded]').forEach(function (cbx) { cbx.addEventListener('change', function () { deds[parseInt(cbx.dataset.ded, 10)] = cbx.checked; S.saveDeliverable(key, { deductions: deds }); upd(); }); });
      wrap.querySelector('[data-finishgrade]').addEventListener('click', function () {
        if (rub.criteria.some(function (_, i) { return !grades[i]; })) { alert('すべての観点でバンドを選んでください。'); return; }
        var sc = DOJO.scoreRubric(task.rubric, grades, deds);
        S.saveDeliverable(key, { grades: grades, deductions: deds, selfBand: sc.band, selfPts: sc.pts, grading: false });
        UI.caseView(cidRaw, lap);
        var node = app.querySelector('[data-task="' + task.id + '"] .pro-output'); if (node) node.scrollIntoView({ behavior: 'smooth' });
      });
      upd();
    });
    on('[data-model]', 'click', function (e) {
      var k = e.currentTarget.dataset.model, b = e.currentTarget.dataset.mband;
      S.saveDeliverable(k, { modelBand: b }); UI.caseView(cidRaw, lap);
    });
    on('[data-ni-pick]', 'click', function (e) {
      S.markNewInfo(cid, parseInt(e.currentTarget.dataset.ni, 10), parseInt(e.currentTarget.dataset.niPick, 10)); UI.caseView(cidRaw, lap);
    });
    var js = el('jSave'); if (js) js.addEventListener('click', function () {
      var entry = { caseId: cid, chapter: cs.chapter || null, lap: lap, decision: el('jDecision').value, confidence: el('jConf').value, missed: el('jMissed').value, lesson: el('jLesson').value };
      if (!entry.decision.trim() && !entry.lesson.trim()) { alert('①か④のどちらかは書いてください。'); return; }
      var v = S.v2(); v.journal = v.journal.filter(function (j) { return !(j.caseId === cid && j.lap === lap); });
      S.addJournal(entry); UI.caseView(cidRaw, lap); window.scrollTo(0, document.body.scrollHeight);
    });
  };

  /* ===================== スキルマップ ===================== */
  UI.skills = function () {
    var st = DOJO.Store.skillStatus();
    var h = '<div class="card"><h1>スキルマップ</h1><p class="lead">7領域 × 3周。進捗は問題数ではなく、このセルで測ります。<br>○ 未着手　◔ 講義で手本を見た　◑ 成果物を作った　● 成果物がアソシエイトバンド以上</p>'
      + '<table class="data skillgrid"><thead><tr><th>領域</th>' + DOJO.LAPS2.map(function (l) { return '<th>' + l.name + '「' + l.short + '」</th>'; }).join('') + '</tr></thead><tbody>';
    Object.keys(DOJO.SKILL_DOMAINS).forEach(function (dk) {
      h += '<tr><td><b>' + dk + '</b> ' + esc(DOJO.SKILL_DOMAINS[dk]) + '</td>';
      [1, 2, 3].forEach(function (lap) {
        var k = dk + lap, s = DOJO.SKILLMAP[k], v = st[k];
        var mark = v === 'passed' ? '●' : v === 'done' ? '◑' : v === 'seen' ? '◔' : '○';
        h += '<td class="skillcell ' + v + '"><div class="sk-mark">' + mark + ' ' + k + '</div><div class="small">' + esc(s.name) + '</div></td>';
      });
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    app.innerHTML = h;
  };

  /* ===================== ジャーナル ===================== */
  UI.journal = function () {
    var S = DOJO.Store, js = S.journal(), gap = S.calibrationGap(), fc = S.failureChecklist(), cal = S.calib();
    var h = '<div class="card"><h1>判断ジャーナル</h1><p class="lead">プロセスと結果を分けて記録する。見落としは次の案件のチェック項目になる。</p>'
      + '<div class="grid g3"><div class="stat"><div class="v">' + js.length + '</div><div class="l">記録数</div></div>'
      + '<div class="stat"><div class="v">' + (gap.avg === null ? '—' : gap.avg.toFixed(2)) + '</div><div class="l">校正ギャップ平均（0が理想）</div></div>'
      + '<div class="stat"><div class="v">' + (gap.recentAvg === null ? '—' : gap.recentAvg.toFixed(2)) + '</div><div class="l">直近5件</div></div></div></div>';
    if (gap.series.length) h += '<div class="card"><h3 style="margin-top:0">校正ギャップの推移 <span class="small muted">自己採点バンドと模範判定の差（0・1・2）</span></h3><div class="gapbars">' + gap.series.map(function (g) { return '<i class="g' + g.gap + '" title="' + new Date(g.at).toLocaleDateString('ja-JP') + '：差' + g.gap + '"></i>'; }).join('') + '</div></div>';
    h += '<div class="card"><h3 style="margin-top:0">自分の失敗チェックリスト <span class="small muted">ジャーナル④「次に変えること」の集約</span></h3>' + (fc.length ? '<ul class="check">' + fc.map(function (x) { var c = DOJO.chapterById(x.chapter); return '<li>☐ ' + esc(x.text) + ' <span class="small muted">（' + (c ? '第' + c.n + '章' : '') + ' ' + x.lap + '周目）</span></li>'; }).join('') + '</ul>' : '<p class="empty small">まだありません。ケース課題の末尾で書けます。</p>') + '</div>';
    if (cal.length) h += '<div class="card"><h3 style="margin-top:0">確信度の記録</h3><table class="data"><thead><tr><th>ケース</th><th>時点</th><th>確率</th></tr></thead><tbody>' + cal.slice(-30).map(function (x) { return '<tr><td>' + esc(x.caseId) + '</td><td>' + esc(x.point) + '</td><td>' + esc(x.p) + '%' + (x.base != null ? ' <span class="small muted">（基準率 ' + Math.round(x.base) + '%）</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<div class="card"><h3 style="margin-top:0">記録</h3>' + (js.length ? js.map(function (j) {
      var c = j.chapter ? DOJO.chapterById(j.chapter) : null;
      return '<div class="jentry"><div class="small muted">' + new Date(j.at).toLocaleString('ja-JP') + '　' + (c ? '第' + c.n + '章 ' + esc(c.name) : esc(j.caseId || '')) + '　' + j.lap + '周目' + (j.confidence !== '' && j.confidence != null ? '　確信 ' + esc(j.confidence) + '%' : '') + '</div>'
        + (j.decision ? '<div><b>判断：</b>' + esc(j.decision) + '</div>' : '') + (j.missed ? '<div><b>見落とし：</b>' + esc(j.missed) + '</div>' : '') + (j.lesson ? '<div><b>次に変える：</b>' + esc(j.lesson) + '</div>' : '') + '</div>';
    }).join('') : '<p class="empty small">まだ記録がありません。</p>') + '</div>';
    app.innerHTML = h;
  };

  /* ===================== 資料庫（v1） ===================== */
  UI.library = function () {
    var h = '<div class="card"><h1>資料庫（旧カリキュラム）</h1><p class="lead">27トピック×4レベルの座学と問題。<b>学習の本線は「道」</b>ですが、工程の途中で基礎知識を深く確認したい時の索引として使えます。</p>'
      + '<div class="row"><button class="btn" data-go="#/curriculum">トピック一覧</button><button class="btn" data-go="#/path">旧・学習ルート</button><button class="btn" data-go="#/drill">実戦ドリル（旧）</button><button class="btn" data-go="#/exam">模擬IC試験（旧）</button></div></div>';
    app.innerHTML = h;
  };
})(window);
