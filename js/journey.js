/*
 * 投資プロ5000本ノック — ラーニングジャーニー
 * ------------------------------------------------------------
 * 座学ページを「短い記事を1本ずつ読む → そのモジュールのクイズを解く →
 * 次のモジュールへ」というステップ式に変換する。
 *
 * - 進捗(読んだ記事・クイズの成績・モジュール完了)は localStorage に保存
 * - クイズ問題(js/terms-data.js 約6.7MB)はクイズ開始時に遅延読み込み
 * - 「一気読みモード」に切り替えると従来どおり全文+目次を表示
 * - インラインクイズの回答は quiz.html と同じ通算5000本ノックに加算される
 */
(function () {
  "use strict";

  var PAGE = (location.pathname.split("/").pop() || "index.html");
  var STORE_KEY = "journey_v1";
  var MODE_KEY = "journey-mode"; // "journey" | "classic"
  var GLOBAL_KEY = "toshipro5000_progress_v2";

  // ---------- 旧来モジュール(nXXX以外)のセクションid → クイズの対応表 ----------
  // n001〜のモジュールは id からプレフィックス一致で自動対応するため、ここには載せない。
  var LEGACY_MAP = {
    // 初級
    "module-pe-basics": { cats: ["PEファンドとは何か / GP・LPの関係"] },
    "module-career": { cats: ["PEファームの組織とキャリアパス"] },
    "module-financials": { cats: ["財務3表の読み方"] },
    "module-valuation": { cats: ["企業価値評価の基礎"] },
    "module-lbo": { cats: ["LBOモデルの基礎"] },
    "module-process": { cats: ["投資プロセス全体像"] },
    "module-tax-practice": { cats: ["税務実務"] },
    "module-lender-comms": { cats: ["レンダー実務"] },
    "module-ic-memo": { cats: ["ICメモ作成実務"] },
    "module-succession-sme": { cats: ["事業承継案件"] },
    "module-valuation-practice": { cats: ["バリュエーション実務"] },
    // 中級
    "module-dd": { cats: ["デューデリジェンス"] },
    "module-structure": { cats: ["買収ストラクチャー"] },
    "module-financing": { cats: ["資金調達とレンダー"] },
    "module-covenants": { cats: ["コベナンツ"] },
    "module-sha": { cats: ["株主間契約(SHA)"] },
    "module-financial-analysis": { cats: ["財務分析"] },
    "module-spa": { cats: ["SPA"] },
    "module-deal-execution": { cats: ["案件エグゼキューション実務"] },
    "module-negotiation": { cats: ["交渉・ステークホルダー実務"] },
    "module-modeling-practice": { cats: ["モデリング実践"] },
    "module-legal-contract": { cats: ["契約実務"] },
    // 上級
    "module-lbo-advanced": { cats: ["LBOモデルの応用論点"] },
    "module-waterfall-carry": { cats: ["リターンのウォーターフォールとキャリー(成功報酬)の仕組み"] },
    "module-value-creation": { cats: ["バリューアップ(価値創造)戦略"] },
    "module-exit-strategy": { cats: ["Exit戦略の全体像"] },
    "module-ic-director": { cats: ["投資委員会(IC)資料の作り方とディレクターの役割"] },
    "module-fund-level": { cats: ["ファンドレベルの視点(ディレクター/パートナーが持つべき視座)"] },
    "module-macro-risk": { cats: ["市況・マクロとリスク管理"] },
    "module-applied-judgment": { cats: ["応用投資判断"] },
    "module-lp-fund-ops": { cats: ["ファンド運営・LP対応"] },
    "module-deal-types": { cats: ["投資形態"] },
    // 専門モジュール
    "module-accounting-basics": { cats: ["資産・負債・純資産", "株式", "減価償却", "繰越欠損金", "総まとめ"] },
    "module-valuation-ratios": { cats: ["PER", "PBR", "ROE", "ROIC", "EPSと配当利回り", "指標活用の落とし穴"] },
    "module-dd-deep-dive": { cats: ["財務DD", "税務DD", "法務DD", "ビジネスDD", "ITDD", "ESG DD", "人事DD", "DD統合"] },
    "module-thesis-ic": { cats: ["投資テーマ策定", "投資委員会実践"] },
    "module-fundraising": { cats: ["ファンドレイズ実務"] },
    "module-case-studies": { cats: ["RJRナビスコ", "トイザらス", "ヒルトン・ワールドワイド", "デル非公開化", "エナジー・フューチャー・ホールディングス", "総合失敗パターン(合成事例)"] },
    "module-sales-intro": { cats: ["初回アプローチ・信頼構築"] },
    "module-sales-negotiation": { cats: ["価格・条件交渉"] },
    "module-sales-psychology": { cats: ["オーナー心理・エモーショナルバリア"] },
    "module-sales-process": { cats: ["プロセス管理・クロージング"] },
    "module-pmi-100day": { cats: ["PMI・100日プラン"] },
    "module-portfolio-monitoring": { cats: ["モニタリング・ボード運営"] },
    "module-sector-lens": { cats: ["セクター分析"] },
    "module-turnaround": { cats: ["事業再生実務"] }
  };

  // ---------- 座学に対応する記事がない「演習ノック」(クイズのみのユニット) ----------
  var DRILLS = {
    "study-beginner.html": [
      { id: "drill-e01", title: "演習ノック:PEの基礎知識", cats: ["PEの基礎知識"] },
      { id: "drill-e02", title: "演習ノック:財務3表の実践", cats: ["財務3表の実践"] },
      { id: "drill-e03", title: "演習ノック:企業価値評価とLBO", cats: ["企業価値評価とLBO"] },
      { id: "drill-e04", title: "演習ノック:投資プロセス実践", cats: ["投資プロセス実践"] },
      { id: "drill-m8a", title: "演習ノック:ソーシング・初期検討", cats: ["投資プロセス:ソーシング・初期検討"] },
      { id: "drill-m8b", title: "演習ノック:LOI・デューデリジェンス", cats: ["投資プロセス:LOI・デューデリジェンス"] },
      { id: "drill-m8c", title: "演習ノック:投資委員会・クロージング", cats: ["投資プロセス:投資委員会・クロージング"] },
      { id: "drill-m8d", title: "演習ノック:バリューアップ・Exit", cats: ["投資プロセス:バリューアップ・Exit"] },
      { id: "drill-e05", title: "演習ノック:税務実務の応用", cats: ["税務実務の応用"] },
      { id: "drill-e06", title: "演習ノック:レンダー・ICメモ実践", cats: ["レンダー・ICメモ実践"] },
      { id: "drill-g-b", title: "総仕上げ:用語集ノック(初級)", cats: ["用語集"], qlevel: "初級" }
    ],
    "study-intermediate.html": [
      { id: "drill-e07", title: "演習ノック:DD・ストラクチャー実践", cats: ["DD・ストラクチャー実践"] },
      { id: "drill-e08", title: "演習ノック:資金調達・コベナンツ実践", cats: ["資金調達・コベナンツ実践"] },
      { id: "drill-e09", title: "演習ノック:契約・財務分析実践", cats: ["契約・財務分析実践"] },
      { id: "drill-e10", title: "演習ノック:案件execution・交渉実践", cats: ["案件execution・交渉実践"] },
      { id: "drill-g-i", title: "総仕上げ:用語集ノック(中級)", cats: ["用語集"], qlevel: "中級" }
    ],
    "study-advanced.html": [
      { id: "drill-g-a", title: "総仕上げ:用語集ノック(上級)", cats: ["用語集"], qlevel: "上級" }
    ]
  };

  // ---------- 永続化 ----------

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.pages) return parsed;
      }
    } catch (e) { /* 破損時は初期化 */ }
    return { pages: {} };
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* 保存不可でも動作継続 */ }
  }
  var store = loadStore();

  function pageState() {
    if (!store.pages[PAGE]) store.pages[PAGE] = { units: {} };
    return store.pages[PAGE];
  }
  function unitState(id) {
    var p = pageState();
    if (!p.units[id]) p.units[id] = { r: 0, qi: 0, qc: 0, qt: 0, done: 0 };
    return p.units[id];
  }

  function loadMode() {
    try { return localStorage.getItem(MODE_KEY) === "classic" ? "classic" : "journey"; } catch (e) { return "journey"; }
  }
  function saveMode(m) {
    try { localStorage.setItem(MODE_KEY, m); } catch (e) { /* noop */ }
  }

  // quiz.html と共通の通算5000本ノックカウンター
  function bumpGlobalProgress(isCorrect) {
    var g;
    try { g = JSON.parse(localStorage.getItem(GLOBAL_KEY) || "null"); } catch (e) { g = null; }
    if (!g || typeof g !== "object") g = {};
    g.count = (g.count || 0) + 1;
    g.correct = (g.correct || 0) + (isCorrect ? 1 : 0);
    if (isCorrect) {
      g.streak = (g.streak || 0) + 1;
      g.maxStreak = Math.max(g.maxStreak || 0, g.streak);
    } else {
      g.streak = 0;
    }
    if (!g.byLevel) g.byLevel = {};
    try { localStorage.setItem(GLOBAL_KEY, JSON.stringify(g)); } catch (e) { /* noop */ }
  }

  // ---------- クイズデータの遅延読み込み ----------

  var termsLoading = false;
  var termsCallbacks = [];
  function ensureTerms(cb) {
    if (typeof window.TERM_QUESTIONS !== "undefined") { cb(true); return; }
    termsCallbacks.push(cb);
    if (termsLoading) return;
    termsLoading = true;
    var s = document.createElement("script");
    s.src = "js/terms-data.js";
    s.onload = function () {
      var ok = typeof window.TERM_QUESTIONS !== "undefined";
      termsCallbacks.forEach(function (fn) { fn(ok); });
      termsCallbacks = [];
    };
    s.onerror = function () {
      termsLoading = false;
      termsCallbacks.forEach(function (fn) { fn(false); });
      termsCallbacks = [];
    };
    document.head.appendChild(s);
  }

  function unitQuestions(unit) {
    var all = window.TERM_QUESTIONS || [];
    var qs;
    if (unit.pfx) {
      qs = all.filter(function (q) { return q.id.indexOf(unit.pfx) === 0; });
    } else if (unit.cats) {
      qs = all.filter(function (q) {
        return unit.cats.indexOf(q.category) >= 0 && (!unit.qlevel || q.level === unit.qlevel);
      });
    } else {
      qs = [];
    }
    return qs.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  }

  // ---------- DOMユーティリティ ----------

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  // ---------- ユニットの組み立て ----------

  // 長い記事を、スマホでも1〜2画面で読み切れる長さに分割する。
  // 記事のブロック要素(p, callout, example等)単位で切り、続きの記事には
  // 「(続き)」付きの見出しを与える。一気読みモードでは続き見出しをCSSで隠す。
  var SPLIT_THRESHOLD = 1400; // これを超える記事は分割する
  var CHUNK_TARGET = 900;     // 1ステップの目安文字数
  var CHUNK_MIN_TAIL = 350;   // 末尾チャンクがこれ未満なら前のチャンクへ併合

  function splitLongArticles(root) {
    var articles = root.querySelectorAll(".study-section > article");
    Array.prototype.forEach.call(articles, function (art) {
      var text = art.textContent || "";
      if (text.length <= SPLIT_THRESHOLD) return;
      var h3 = art.querySelector("h3");
      var blocks = Array.prototype.slice.call(art.children).filter(function (c) { return c !== h3; });
      if (blocks.length < 2) return;

      // ブロックを文字数でチャンクに分ける
      var chunks = [];
      var cur = [];
      var curLen = 0;
      blocks.forEach(function (b) {
        var len = (b.textContent || "").length;
        if (cur.length && curLen + len > CHUNK_TARGET) {
          chunks.push(cur);
          cur = [];
          curLen = 0;
        }
        cur.push(b);
        curLen += len;
      });
      if (cur.length) {
        if (chunks.length && curLen < CHUNK_MIN_TAIL) {
          chunks[chunks.length - 1] = chunks[chunks.length - 1].concat(cur);
        } else {
          chunks.push(cur);
        }
      }
      if (chunks.length < 2) return;

      // 2つ目以降のチャンクを「(続き)」記事として元記事の後ろに挿入する
      var title = h3 ? h3.textContent.trim() : "";
      var after = art;
      chunks.slice(1).forEach(function (chunk) {
        var cont = document.createElement("article");
        cont.className = "lesson lesson-cont";
        if (title) {
          var ch = document.createElement("h3");
          ch.className = "cont";
          ch.textContent = title + "(続き)";
          cont.appendChild(ch);
        }
        chunk.forEach(function (b) { cont.appendChild(b); });
        after.parentNode.insertBefore(cont, after.nextSibling);
        after = cont;
      });
    });
  }

  // section の子要素を「記事ステップ」に分解する。
  // article が1ステップ、article 以外の要素(導入文・まとめ等)は直後の article に付く。
  function buildSteps(section) {
    var steps = [];
    var buffer = [];
    var children = Array.prototype.slice.call(section.children);
    children.forEach(function (child) {
      if (child.tagName === "H2") return;
      if (child.tagName === "ARTICLE") {
        steps.push(buffer.concat([child]));
        buffer = [];
      } else {
        buffer.push(child);
      }
    });
    if (buffer.length) {
      if (steps.length) steps[steps.length - 1] = steps[steps.length - 1].concat(buffer);
      else if (buffer.some(function (b) { return !/^(P)$/.test(b.tagName) || b.textContent.trim(); })) steps.push(buffer);
    }
    return steps;
  }

  function buildUnits() {
    var sections = document.querySelectorAll(".study-main .study-section");
    var units = [];
    Array.prototype.forEach.call(sections, function (sec) {
      var h2 = sec.querySelector("h2");
      var title = h2 ? h2.textContent.replace(/^モジュール\d+[:：]\s*/, "").trim() : sec.id;
      var unit = { id: sec.id, title: title, section: sec, steps: buildSteps(sec) };
      var m = sec.id.match(/^module-(n\d{3})$/);
      if (m) {
        unit.pfx = m[1] + "-";
      } else if (LEGACY_MAP[sec.id]) {
        unit.cats = LEGACY_MAP[sec.id].cats;
        unit.qlevel = LEGACY_MAP[sec.id].qlevel;
      }
      units.push(unit);
    });
    (DRILLS[PAGE] || []).forEach(function (d) {
      units.push({ id: d.id, title: d.title, section: null, steps: [], cats: d.cats, qlevel: d.qlevel, drill: true });
    });
    return units;
  }

  function hasQuiz(unit) { return !!(unit.pfx || unit.cats); }

  function unitStatus(unit) {
    var s = unitState(unit.id);
    if (s.done) return "done";
    if (s.r > 0 || s.qi > 0) return "active";
    return "todo";
  }

  // ---------- 画面切り替え ----------

  var units = [];
  var mode = loadMode();
  var view = { unit: null, step: 0, stage: "read" }; // stage: "read" | "quiz"
  var dom = {};

  function saveSummary() {
    var doneCount = units.filter(function (u) { return unitState(u.id).done; }).length;
    pageState().summary = { done: doneCount, total: units.length };
    saveStore();
  }

  function showClassic() {
    mode = "classic";
    saveMode(mode);
    document.body.classList.remove("journey-active");
    dom.map.hidden = true;
    dom.unitView.hidden = true;
    units.forEach(function (u) {
      if (!u.section) return;
      u.section.hidden = false;
      u.section.querySelectorAll(":scope > *").forEach(function (c) { c.hidden = false; });
    });
    renderBar();
  }

  function showJourney() {
    mode = "journey";
    saveMode(mode);
    document.body.classList.add("journey-active");
    units.forEach(function (u) { if (u.section) u.section.hidden = true; });
    showMap();
  }

  function showMap() {
    view.unit = null;
    dom.unitView.hidden = true;
    dom.unitView.innerHTML = "";
    units.forEach(function (u) { if (u.section) u.section.hidden = true; });
    renderMap();
    dom.map.hidden = false;
    renderBar();
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    window.scrollTo(0, 0);
  }

  function openUnit(unit, stage) {
    view.unit = unit;
    var s = unitState(unit.id);
    view.step = Math.min(s.r, Math.max(0, unit.steps.length - 1));
    view.stage = "read";
    if (stage === "quiz" || unit.steps.length === 0) view.stage = "quiz";
    if (view.stage === "quiz" && !hasQuiz(unit)) view.stage = "read";
    dom.map.hidden = true;
    units.forEach(function (u) { if (u.section) u.section.hidden = u !== unit; });
    renderUnit();
    scrollToContent();
  }

  function scrollToContent() {
    // ページ最上部(サイトナビ)ではなく、学習コンテンツの先頭へ戻す
    if (!dom.unitView || dom.unitView.hidden) { window.scrollTo(0, 0); return; }
    var top = dom.unitView.getBoundingClientRect().top + (window.pageYOffset || 0) - 64;
    window.scrollTo(0, Math.max(0, top));
  }

  // ---------- 進捗バー ----------

  function renderBar() {
    var doneCount = units.filter(function (u) { return unitState(u.id).done; }).length;
    var pct = units.length ? Math.round((doneCount / units.length) * 100) : 0;
    dom.barFill.style.width = pct + "%";
    dom.barText.textContent = "モジュール完了 " + doneCount + " / " + units.length + " (" + pct + "%)";
    dom.modeJourney.classList.toggle("active", mode === "journey");
    dom.modeClassic.classList.toggle("active", mode === "classic");
  }

  // ---------- ジャーニーマップ ----------

  function renderMap() {
    dom.map.innerHTML = "";
    var intro = el("p", "jmap-lead",
      "1モジュール = 短い記事を数本 + 確認クイズ。読み終わるとすぐ、そのモジュールのクイズが始まります。途中でやめても続きから再開できます。");
    dom.map.appendChild(intro);

    units.forEach(function (u, idx) {
      var s = unitState(u.id);
      var status = unitStatus(u);
      var item = el("div", "jmap-item jmap-" + status);

      var num = el("span", "jmap-num", status === "done" ? "✓" : String(idx + 1));
      item.appendChild(num);

      var body = el("div", "jmap-body");
      var t = el("div", "jmap-title", u.title);
      body.appendChild(t);

      var metaParts = [];
      if (u.steps.length) metaParts.push("読むステップ" + u.steps.length);
      if (hasQuiz(u)) metaParts.push(u.drill ? "クイズのみ" : "確認クイズ");
      var progressParts = [];
      if (u.steps.length && s.r > 0) progressParts.push("読了 " + Math.min(s.r, u.steps.length) + "/" + u.steps.length);
      if (s.qt > 0 && (s.qi > 0 || s.done)) progressParts.push("クイズ " + Math.min(s.qi, s.qt) + "/" + s.qt + " (正解" + s.qc + ")");
      var meta = el("div", "jmap-meta", metaParts.join(" ・ ") + (progressParts.length ? " ｜ " + progressParts.join(" ・ ") : ""));
      body.appendChild(meta);
      item.appendChild(body);

      var actions = el("div", "jmap-actions");
      var mainBtn = el("button", "btn btn-primary jmap-btn",
        status === "done" ? "復習する" : status === "active" ? "つづきから" : "はじめる");
      mainBtn.type = "button";
      mainBtn.addEventListener("click", function () { openUnit(u); });
      actions.appendChild(mainBtn);
      if (hasQuiz(u) && u.steps.length) {
        var qBtn = el("button", "btn jmap-btn jmap-btn-sub", "クイズへ");
        qBtn.type = "button";
        qBtn.addEventListener("click", function () { openUnit(u, "quiz"); });
        actions.appendChild(qBtn);
      }
      item.appendChild(actions);
      dom.map.appendChild(item);
    });
  }

  // ---------- ユニット表示(記事のページング) ----------

  function renderUnit() {
    var u = view.unit;
    if (!u) return;
    dom.unitView.innerHTML = "";
    dom.unitView.hidden = false;

    var crumb = el("div", "junit-crumb");
    var back = el("a", "junit-back", "← ジャーニーマップに戻る");
    back.href = "javascript:void(0)";
    back.addEventListener("click", showMap);
    crumb.appendChild(back);
    dom.unitView.appendChild(crumb);

    if (view.stage === "quiz") {
      if (u.section) u.section.hidden = true;
      renderQuiz();
      return;
    }

    // 記事ステージ:現在のステップの要素だけ表示する
    if (u.section) {
      u.section.hidden = false;
      var current = u.steps[view.step] || [];
      var children = Array.prototype.slice.call(u.section.children);
      children.forEach(function (c) {
        if (c.tagName === "H2") { c.hidden = false; return; }
        c.hidden = current.indexOf(c) < 0;
      });
    }

    var nav = el("div", "junit-nav");

    var prev = el("button", "btn junit-nav-btn", "← 戻る");
    prev.type = "button";
    prev.disabled = view.step === 0;
    prev.addEventListener("click", function () {
      if (view.step > 0) { view.step -= 1; renderUnit(); scrollToContent(); }
    });
    nav.appendChild(prev);

    var mid = el("div", "junit-nav-mid");
    mid.appendChild(el("span", "junit-nav-label", "ステップ " + (view.step + 1) + " / " + u.steps.length));
    var mini = el("div", "jminibar");
    var miniFill = el("div", "jminibar-fill");
    miniFill.style.width = (u.steps.length ? Math.round(((view.step + 1) / u.steps.length) * 100) : 0) + "%";
    mini.appendChild(miniFill);
    mid.appendChild(mini);
    nav.appendChild(mid);

    var isLast = view.step >= u.steps.length - 1;
    var next = el("button", "btn btn-primary junit-nav-btn",
      !isLast ? "次へ →" : hasQuiz(u) ? "確認クイズへ →" : "モジュール完了 ✓");
    next.type = "button";
    next.addEventListener("click", function () {
      var s = unitState(u.id);
      s.r = Math.max(s.r, view.step + 1);
      if (!isLast) {
        view.step += 1;
        saveSummary();
        renderUnit();
        scrollToContent();
      } else if (hasQuiz(u)) {
        view.stage = "quiz";
        saveSummary();
        renderUnit();
        scrollToContent();
      } else {
        s.done = 1;
        saveSummary();
        showMap();
      }
    });
    nav.appendChild(next);

    dom.unitView.appendChild(nav);
  }

  // ---------- インラインクイズ ----------

  function renderQuiz() {
    var u = view.unit;
    var wrap = el("div", "jquiz");
    var head = el("h2", "jquiz-title", u.title + " — 確認クイズ");
    wrap.appendChild(head);
    var body = el("div", "jquiz-body", "問題データを読み込んでいます…(初回のみ数秒かかります)");
    wrap.appendChild(body);
    dom.unitView.appendChild(wrap);

    ensureTerms(function (ok) {
      if (view.unit !== u || view.stage !== "quiz") return;
      if (!ok) {
        body.textContent = "問題データを読み込めませんでした。通信環境を確認して再読み込みしてください。";
        return;
      }
      var questions = unitQuestions(u);
      var s = unitState(u.id);
      s.qt = questions.length;
      if (questions.length === 0) {
        body.textContent = "このモジュールのクイズは準備中です。";
        var doneBtn = el("button", "btn btn-primary", "モジュール完了にする ✓");
        doneBtn.type = "button";
        doneBtn.addEventListener("click", function () { s.done = 1; saveSummary(); showMap(); });
        body.appendChild(document.createElement("br"));
        body.appendChild(doneBtn);
        return;
      }
      if (s.qi >= questions.length) { s.qi = 0; s.qc = 0; } // 復習は最初から
      runQuiz(u, questions, body);
    });
  }

  function runQuiz(u, questions, container) {
    var s = unitState(u.id);
    var answered = false;

    function finish() {
      container.innerHTML = "";
      s.done = 1;
      saveSummary();
      var doneBox = el("div", "jquiz-done");
      doneBox.appendChild(el("p", "jquiz-done-head", "🎉 モジュール完了!"));
      doneBox.appendChild(el("p", "jquiz-done-score",
        "成績:" + s.qc + " / " + questions.length + " 問正解 (" + Math.round((s.qc / questions.length) * 100) + "%)"));
      var actions = el("div", "jquiz-done-actions");
      var idx = units.indexOf(u);
      var nextUnit = idx >= 0 && idx + 1 < units.length ? units[idx + 1] : null;
      if (nextUnit) {
        var nextBtn = el("button", "btn btn-primary", "次のモジュールへ →");
        nextBtn.type = "button";
        nextBtn.addEventListener("click", function () { openUnit(nextUnit); });
        actions.appendChild(nextBtn);
      }
      var mapBtn = el("button", "btn jmap-btn-sub", "ジャーニーマップへ");
      mapBtn.type = "button";
      mapBtn.addEventListener("click", showMap);
      actions.appendChild(mapBtn);
      doneBox.appendChild(actions);
      container.appendChild(doneBox);
      renderBar();
    }

    function show() {
      if (s.qi >= questions.length) { finish(); return; }
      answered = false;
      var q = questions[s.qi];
      container.innerHTML = "";

      var card = el("div", "quiz-card jquiz-card");

      var meta = el("div", "quiz-meta");
      var left = el("div", "quiz-meta-left");
      var lv = el("span", "badge badge-level badge-level-" + q.level, q.level);
      left.appendChild(lv);
      left.appendChild(el("span", "badge", q.category));
      meta.appendChild(left);
      meta.appendChild(el("span", "serial", "問 " + (s.qi + 1) + " / " + questions.length));
      card.appendChild(meta);

      var mini = el("div", "jminibar");
      var miniFill = el("div", "jminibar-fill");
      miniFill.style.width = Math.round((s.qi / questions.length) * 100) + "%";
      mini.appendChild(miniFill);
      card.appendChild(mini);

      var qt = el("p", "question-text", q.question);
      card.appendChild(qt);

      var choices = el("div", "choices");
      q.choices.forEach(function (text, i) {
        var b = el("button", "choice-btn", text);
        b.type = "button";
        b.addEventListener("click", function () { answer(i, choices, q, card); });
        choices.appendChild(b);
      });
      card.appendChild(choices);
      container.appendChild(card);
      container.dataset.choices = "1";
      container._choices = choices;
      container._answer = function (i) {
        var b = choices.children[i];
        if (b && !answered) b.click();
      };
      container._next = null;
    }

    function answer(i, choices, q, card) {
      if (answered) return;
      answered = true;
      var isCorrect = i === q.answerIndex;
      if (isCorrect) s.qc += 1;
      bumpGlobalProgress(isCorrect);

      Array.prototype.forEach.call(choices.children, function (b, j) {
        b.disabled = true;
        if (j === q.answerIndex) b.classList.add("correct");
        else if (j === i) b.classList.add("wrong");
      });

      var fb = el("div", "feedback");
      var head = el("p", "feedback-headline " + (isCorrect ? "correct" : "wrong"), isCorrect ? "◯ 正解!" : "✕ 不正解");
      fb.appendChild(head);
      fb.appendChild(el("p", "feedback-explain", q.explain));
      var next = el("button", "btn btn-primary", s.qi + 1 >= questions.length ? "結果を見る →" : "次の問題へ →");
      next.type = "button";
      next.addEventListener("click", function () {
        s.qi += 1;
        saveSummary();
        show();
        scrollToContent();
      });
      fb.appendChild(next);
      card.appendChild(fb);
      container._next = next;
      saveSummary();
    }

    quizKeyTarget = container;
    show();
  }

  // キーボード操作(1〜4で回答、Enterで次へ)
  var quizKeyTarget = null;
  document.addEventListener("keydown", function (e) {
    if (mode !== "journey" || view.stage !== "quiz" || !quizKeyTarget || !quizKeyTarget.isConnected) return;
    if (["1", "2", "3", "4"].includes(e.key) && quizKeyTarget._answer) {
      quizKeyTarget._answer(Number(e.key) - 1);
    } else if (e.key === "Enter" && quizKeyTarget._next) {
      quizKeyTarget._next.click();
    }
  });

  // ---------- 一覧ページ(path-card)への進捗表示 ----------

  function annotateCards() {
    var cards = document.querySelectorAll("a.path-card");
    if (!cards.length) return;
    Array.prototype.forEach.call(cards, function (card) {
      var href = (card.getAttribute("href") || "").split("#")[0];
      var p = store.pages[href];
      if (!p || !p.summary || !p.summary.total) return;
      var sum = p.summary;
      var pct = Math.round((sum.done / sum.total) * 100);
      var box = el("div", "path-progress");
      var bar = el("div", "jminibar");
      var fill = el("div", "jminibar-fill");
      fill.style.width = pct + "%";
      bar.appendChild(fill);
      box.appendChild(bar);
      box.appendChild(el("span", "path-progress-text",
        (pct >= 100 ? "✓ 全モジュール完了" : "進捗 " + sum.done + "/" + sum.total + " モジュール") ));
      card.appendChild(box);
    });
  }

  // ---------- 初期化 ----------

  function init() {
    var studyMain = document.querySelector(".study-main");
    var sections = document.querySelectorAll(".study-main .study-section");

    if (!studyMain || sections.length === 0) {
      annotateCards();
      return;
    }

    splitLongArticles(studyMain);
    units = buildUnits();
    if (!units.length) return;

    // ヘッダー(進捗バー+モード切替)
    var bar = el("div", "journey-bar");
    var barTop = el("div", "journey-bar-top");
    dom.barText = el("span", "journey-bar-text", "");
    barTop.appendChild(dom.barText);
    var toggle = el("div", "journey-toggle");
    dom.modeJourney = el("button", "journey-toggle-btn", "ステップ学習");
    dom.modeJourney.type = "button";
    dom.modeJourney.addEventListener("click", function () { if (mode !== "journey") showJourney(); });
    dom.modeClassic = el("button", "journey-toggle-btn", "一気読み");
    dom.modeClassic.type = "button";
    dom.modeClassic.addEventListener("click", function () { if (mode !== "classic") showClassic(); });
    toggle.appendChild(dom.modeJourney);
    toggle.appendChild(dom.modeClassic);
    barTop.appendChild(toggle);
    bar.appendChild(barTop);
    var barTrack = el("div", "jminibar journey-bar-track");
    dom.barFill = el("div", "jminibar-fill");
    barTrack.appendChild(dom.barFill);
    bar.appendChild(barTrack);

    var layout = document.querySelector(".study-layout");
    layout.parentNode.insertBefore(bar, layout);

    dom.map = el("div", "jmap");
    dom.map.hidden = true;
    dom.unitView = el("div", "junit");
    dom.unitView.hidden = true;
    studyMain.insertBefore(dom.unitView, studyMain.firstChild);
    studyMain.insertBefore(dom.map, studyMain.firstChild);

    saveSummary();

    // #module-xxx で直接開かれたら、そのユニットをステップ学習で開く
    var hashUnit = null;
    if (location.hash) {
      var hid = decodeURIComponent(location.hash.slice(1));
      hashUnit = units.filter(function (u) { return u.id === hid; })[0] || null;
    }

    if (mode === "classic") {
      showClassic();
    } else {
      document.body.classList.add("journey-active");
      units.forEach(function (u) { if (u.section) u.section.hidden = true; });
      if (hashUnit) openUnit(hashUnit); else showMap();
      renderBar();
    }

    window.addEventListener("hashchange", function () {
      if (mode !== "journey" || !location.hash) return;
      var hid = decodeURIComponent(location.hash.slice(1));
      var target = units.filter(function (u) { return u.id === hid; })[0];
      if (target) openUnit(target);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
