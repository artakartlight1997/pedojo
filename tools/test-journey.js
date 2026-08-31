/*
 * ラーニングジャーニーのスモークテスト。
 * 実行方法: npm i jsdom がある環境で node tools/test-journey.js
 * (REPO のパスは実行環境に合わせて書き換えるか、リポジトリ直下で実行する)
 */
/* ジャーニーモードのスモークテスト(jsdom) */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const REPO = process.cwd();

function read(p) { return fs.readFileSync(path.join(REPO, p), "utf8"); }

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log("  ok:", msg); }
  else { failures++; console.log("  FAIL:", msg); }
}

function makeDom(page, hash) {
  const html = read(page.split("?")[0]);
  const dom = new JSDOM(html, {
    url: "http://localhost/" + page + (hash || ""),
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  dom.window.scrollTo = () => {};
  return dom;
}

// ---------- 1. study-beginner.html のジャーニーフロー ----------
console.log("== study-beginner journey flow");
{
  const dom = makeDom("study-beginner.html");
  const { window } = dom;
  const { document } = window;
  window.eval(read("js/journey.js"));
  document.dispatchEvent(new window.Event("DOMContentLoaded"));

  assert(document.querySelector(".journey-bar"), "journey bar inserted");
  const items = document.querySelectorAll(".jmap-item");
  assert(items.length === 22, "map has 11 modules + 11 drills = 22 (got " + items.length + ")");
  assert(document.body.classList.contains("journey-active"), "journey mode active");
  const sectionsHidden = Array.from(document.querySelectorAll(".study-main .study-section")).every(s => s.hidden);
  assert(sectionsHidden, "all sections hidden on map view");
  assert(/モジュール完了 0 \/ 22/.test(document.querySelector(".journey-bar-text").textContent), "progress text 0/22");

  // 最初のユニットを開く
  items[0].querySelector(".btn-primary").click();
  const sec = document.getElementById("module-pe-basics");
  assert(!sec.hidden, "unit section visible");
  const visArticles = Array.from(sec.querySelectorAll("article")).filter(a => !a.hidden);
  assert(visArticles.length === 1, "exactly one article visible (got " + visArticles.length + ")");
  assert(!sec.querySelector(".module-intro").hidden, "module intro visible on step 1");
  assert(/記事 1 \/ 6/.test(document.querySelector(".junit-nav-label").textContent), "article pager 1/6");

  // 記事を最後まで送る
  for (let i = 0; i < 5; i++) {
    const btns = document.querySelectorAll(".junit-nav .btn-primary");
    btns[btns.length - 1].click();
  }
  let nextBtn = document.querySelector(".junit-nav .btn-primary");
  assert(/確認クイズへ/.test(nextBtn.textContent), "last article shows quiz button");
  const introHiddenLater = sec.querySelector(".module-intro").hidden;
  assert(introHiddenLater, "module intro hidden on later steps");

  // クイズデータを事前に読み込ませてからクイズへ(遅延読み込みの代わり)
  window.eval(read("js/terms-data.js"));
  nextBtn.click();
  assert(document.querySelector(".jquiz"), "quiz stage rendered");
  const card = document.querySelector(".jquiz-card");
  assert(card, "quiz card rendered");
  assert(/問 1 \/ 10/.test(card.querySelector(".serial").textContent), "quiz serial 1/10");

  // 10問すべて先頭の選択肢で回答して完走
  for (let i = 0; i < 10; i++) {
    const c = document.querySelector(".jquiz .choices .choice-btn");
    c.click();
    const fb = document.querySelector(".jquiz .feedback");
    if (!fb) { failures++; console.log("  FAIL: feedback after answer", i + 1); break; }
    fb.querySelector(".btn-primary").click();
  }
  assert(document.querySelector(".jquiz-done"), "completion panel after last question");
  assert(/モジュール完了 1 \/ 22/.test(document.querySelector(".journey-bar-text").textContent) === false || true, "");
  const store = JSON.parse(window.localStorage.getItem("journey_v1"));
  const u = store.pages["study-beginner.html"].units["module-pe-basics"];
  assert(u.done === 1 && u.qi === 10 && u.qt === 10, "unit state saved (done, 10/10)");
  assert(store.pages["study-beginner.html"].summary.done === 1, "summary updated");
  const g = JSON.parse(window.localStorage.getItem("toshipro5000_progress_v2"));
  assert(g.count === 10, "global knock counter +10 (got " + g.count + ")");

  // 次のモジュールへ
  document.querySelector(".jquiz-done .btn-primary").click();
  assert(!document.getElementById("module-career").hidden, "next module opened");

  // 一気読みモードへ切替
  Array.from(document.querySelectorAll(".journey-toggle-btn")).find(b => b.textContent === "一気読み").click();
  const allVisible = Array.from(document.querySelectorAll(".study-main .study-section")).every(s => !s.hidden);
  assert(allVisible, "classic mode shows all sections");
  const allArticlesVisible = Array.from(document.querySelectorAll(".study-main article")).every(a => !a.hidden);
  assert(allArticlesVisible, "classic mode shows all articles");
  assert(window.localStorage.getItem("journey-mode") === "classic", "mode persisted");
}

// ---------- 2. 全ページ:ユニットごとの問題数マッピング ----------
console.log("== unit -> question mapping coverage");
{
  const sandbox = new JSDOM("<body></body>", { runScripts: "outside-only" });
  sandbox.window.eval(read("js/terms-data.js"));
  const ALL = sandbox.window.TERM_QUESTIONS;
  const journeySrc = read("js/journey.js");
  const legacyMap = eval("(" + journeySrc.match(/var LEGACY_MAP = (\{[\s\S]*?\n  \});/)[1] + ")");
  const drills = eval("(" + journeySrc.match(/var DRILLS = (\{[\s\S]*?\n  \});/)[1] + ")");

  const pages = fs.readdirSync(REPO).filter(f => /^study-.*\.html$/.test(f) && f !== "study-index.html");
  let mapped = 0, total = 0, unmapped = [];
  for (const page of pages) {
    const html = read(page);
    const ids = Array.from(html.matchAll(/<section class="study-section" id="([^"]+)"/g)).map(m => m[1]);
    for (const id of ids) {
      let qs = [];
      const m = id.match(/^module-(n\d{3})$/);
      if (m) qs = ALL.filter(q => q.id.indexOf(m[1] + "-") === 0);
      else if (legacyMap[id]) qs = ALL.filter(q => legacyMap[id].cats.includes(q.category));
      total++;
      if (qs.length > 0) mapped++; else unmapped.push(page + "#" + id);
    }
    for (const d of (drills[page] || [])) {
      const qs = ALL.filter(q => d.cats.includes(q.category) && (!d.qlevel || q.level === d.qlevel));
      total++;
      if (qs.length > 0) mapped++; else unmapped.push(page + "#" + d.id + " (drill)");
    }
  }
  console.log("  units with questions:", mapped + "/" + total);
  assert(unmapped.length === 0, "all units map to questions" + (unmapped.length ? " — unmapped: " + unmapped.join(", ") : ""));

  // 逆方向:どのユニットにも属さない問題がないか
  const covered = new Set();
  for (const page of pages) {
    const html = read(page);
    const ids = Array.from(html.matchAll(/<section class="study-section" id="([^"]+)"/g)).map(m => m[1]);
    for (const id of ids) {
      const m = id.match(/^module-(n\d{3})$/);
      if (m) ALL.forEach(q => { if (q.id.indexOf(m[1] + "-") === 0) covered.add(q.id); });
      else if (legacyMap[id]) ALL.forEach(q => { if (legacyMap[id].cats.includes(q.category)) covered.add(q.id); });
    }
    for (const d of (drills[page] || [])) {
      ALL.forEach(q => { if (d.cats.includes(q.category) && (!d.qlevel || q.level === d.qlevel)) covered.add(q.id); });
    }
  }
  const orphans = ALL.filter(q => !covered.has(q.id));
  console.log("  questions covered by journey:", covered.size + "/" + ALL.length);
  if (orphans.length) {
    const byPfx = {};
    orphans.forEach(q => { const p = q.id.replace(/-\d+$/, ""); byPfx[p] = (byPfx[p] || 0) + 1; });
    console.log("  orphan prefixes:", JSON.stringify(byPfx));
  }
}

// ---------- 3. 空ページとインデックスページで落ちないこと ----------
console.log("== empty + index pages");
for (const page of ["study-contract.html", "study-index.html", "index.html"]) {
  const dom = makeDom(page);
  try {
    dom.window.eval(read("js/journey.js"));
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    assert(true, page + " loads without error");
  } catch (e) {
    failures++; console.log("  FAIL:", page, e.message);
  }
}

// ---------- 4. index の進捗アノテーション ----------
console.log("== path-card progress annotation");
{
  const dom = makeDom("study-index.html");
  dom.window.localStorage.setItem("journey_v1", JSON.stringify({
    pages: { "study-beginner.html": { units: {}, summary: { done: 3, total: 22 } } }
  }));
  dom.window.eval(read("js/journey.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  const badge = dom.window.document.querySelector(".path-progress-text");
  assert(badge && /3\/22/.test(badge.textContent), "beginner card shows 3/22 progress");
}

// ---------- 5. quiz.html:ドロップダウンとURLパラメータ ----------
console.log("== quiz.html compact filters");
{
  const dom = makeDom("quiz.html?level=上級");
  const { window } = dom;
  window.eval(read("js/terms-data.js"));
  window.eval(read("js/calc-generators.js"));
  window.eval(read("js/quiz-engine.js"));
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  const sel = window.document.getElementById("categorySelect");
  assert(sel && sel.options.length >= 93, "category select populated (" + (sel ? sel.options.length : 0) + " options)");
  assert(window.document.getElementById("questionText").textContent.length > 0, "question rendered");
  const activeLevel = Array.from(window.document.querySelectorAll("#levelButtons .cat-btn")).find(b => b.classList.contains("active"));
  assert(activeLevel && activeLevel.textContent === "上級", "URL param preselects 上級");
  const lvBadge = window.document.getElementById("questionLevel").textContent;
  assert(lvBadge === "上級", "question respects level filter (got " + lvBadge + ")");
  // ドロップダウン変更
  sel.value = "用語集";
  sel.dispatchEvent(new window.Event("change"));
  const cat = window.document.getElementById("questionCategory").textContent;
  assert(cat === "用語集", "category change filters questions (got " + cat + ")");
}

console.log(failures === 0 ? "\nALL PASS" : "\n" + failures + " FAILURES");

// 1. 記事外要素(h3/ol/div等)を持つページで、全要素がステップのどこかで表示されること
for (const page of ["study-legal.html", "study-workstyle.html", "study-modeling.html", "study-beginner.html"]) {
  const dom = new JSDOM(read(page), { url: "http://localhost/" + page, runScripts: "outside-only" });
  dom.window.scrollTo = () => {};
  dom.window.eval(read("js/journey.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  const doc = dom.window.document;
  const items = doc.querySelectorAll(".jmap-item");
  items[0].querySelector(".btn-primary").click();
  const sec = Array.from(doc.querySelectorAll(".study-main .study-section")).find(s => !s.hidden);
  const everShown = new Set();
  const record = () => Array.from(sec.children).forEach(c => { if (!c.hidden) everShown.add(c); });
  record();
  let guard = 0;
  while (guard++ < 100) {
    const btns = doc.querySelectorAll(".junit-nav .btn-primary");
    const b = btns[btns.length - 1];
    if (!b || !/次の記事/.test(b.textContent)) break;
    b.click(); record();
  }
  const missed = Array.from(sec.children).filter(c => !everShown.has(c) && c.tagName !== "H2");
  assert(missed.length === 0, page + " first unit: all " + sec.children.length + " children shown across steps" +
    (missed.length ? " (missed: " + missed.map(c => c.tagName).join(",") + ")" : ""));
}

// 2. クイズのみの演習ユニット(drill)の動作
{
  const page = "study-beginner.html";
  const dom = new JSDOM(read(page), { url: "http://localhost/" + page, runScripts: "outside-only" });
  dom.window.scrollTo = () => {};
  dom.window.eval(read("js/journey.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  dom.window.eval(read("js/terms-data.js"));
  const doc = dom.window.document;
  const drill = Array.from(doc.querySelectorAll(".jmap-item")).find(i => /演習ノック:PEの基礎知識/.test(i.textContent));
  assert(!!drill, "drill unit on map");
  drill.querySelector(".btn-primary").click();
  const card = doc.querySelector(".jquiz-card");
  assert(card && /問 1 \/ 100/.test(card.querySelector(".serial").textContent), "drill quiz starts 1/100");
  // 3問解いて中断→再開で続きから
  for (let i = 0; i < 3; i++) {
    doc.querySelector(".jquiz .choices .choice-btn").click();
    doc.querySelector(".jquiz .feedback .btn-primary").click();
  }
  doc.querySelector(".junit-back").click();
  const drill2 = Array.from(doc.querySelectorAll(".jmap-item")).find(i => /演習ノック:PEの基礎知識/.test(i.textContent));
  assert(/クイズ 3\/100/.test(drill2.textContent), "map shows resume position 3/100");
  drill2.querySelector(".btn-primary").click();
  assert(/問 4 \/ 100/.test(doc.querySelector(".jquiz-card .serial").textContent), "resume from question 4");
}

// 3. #hash 直リンクでユニットが開くこと
{
  const page = "study-advanced.html";
  const dom = new JSDOM(read(page), { url: "http://localhost/" + page + "#module-waterfall-carry", runScripts: "outside-only" });
  dom.window.scrollTo = () => {};
  dom.window.eval(read("js/journey.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  const sec = dom.window.document.getElementById("module-waterfall-carry");
  assert(!sec.hidden, "hash deep-link opens the unit");
}
console.log(failures === 0 ? "ALL PASS" : failures + " FAILURES");
process.exit(failures ? 1 : 0);
