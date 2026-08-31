/*
 * ラーニングジャーニーのスモークテスト。
 * 実行方法: npm i jsdom がある環境でリポジトリ直下から node tools/test-journey.js
 */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const REPO = process.cwd();

function read(p) { return fs.readFileSync(path.join(REPO, p.split("?")[0]), "utf8"); }

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log("  ok:", msg); }
  else { failures++; console.log("  FAIL:", msg); }
}

function makeDom(page, hash) {
  const dom = new JSDOM(read(page), {
    url: "http://localhost/" + page + (hash || ""),
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  dom.window.scrollTo = () => {};
  return dom;
}

function boot(page, hash) {
  const dom = makeDom(page, hash);
  dom.window.eval(read("js/journey.js"));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
  return dom;
}

// 現在表示中のステップの本文文字数(ナビ・見出し除く)
function visibleStepLength(sec) {
  return Array.from(sec.children)
    .filter(c => !c.hidden && c.tagName !== "H2")
    .reduce((s, c) => s + c.textContent.length, 0);
}

// ---------- 1. study-beginner.html のジャーニーフロー ----------
console.log("== study-beginner journey flow");
{
  const dom = boot("study-beginner.html");
  const { window } = dom;
  const { document } = window;

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
  assert(/ステップ 1 \/ \d+/.test(document.querySelector(".junit-nav-label").textContent), "step pager starts at 1");

  // ステップを最後まで送る(各ステップの長さも検査)
  let quizBtn = null;
  let maxLen = 0;
  for (let guard = 0; guard < 100; guard++) {
    maxLen = Math.max(maxLen, visibleStepLength(sec));
    const btns = document.querySelectorAll(".junit-nav .btn-primary");
    const b = btns[btns.length - 1];
    if (!/次へ/.test(b.textContent)) { quizBtn = b; break; }
    b.click();
  }
  assert(quizBtn && /確認クイズへ/.test(quizBtn.textContent), "last step shows quiz button");
  assert(sec.querySelector(".module-intro").hidden, "module intro hidden on later steps");

  // クイズデータを事前に読み込ませてからクイズへ(遅延読み込みの代わり)
  window.eval(read("js/terms-data.js"));
  quizBtn.click();
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

// ---------- 2. 長い記事の分割:1ステップの長さと内容の保全 ----------
console.log("== long-article splitting");
for (const page of ["study-advanced.html", "study-intermediate.html", "study-legal.html", "study-modeling.html", "study-workstyle.html", "study-beginner.html"]) {
  const before = new JSDOM(read(page)).window.document;
  const beforeText = {};
  before.querySelectorAll(".study-main .study-section").forEach(s => { beforeText[s.id] = s.textContent.replace(/\s+/g, ""); });

  const dom = boot(page);
  const doc = dom.window.document;

  // 分割後も本文が失われていないこと:
  // 追加されるのは「(続き)」見出しだけなので、その分を差し引くと元と一致するはず
  let intact = true;
  doc.querySelectorAll(".study-main .study-section").forEach(s => {
    const afterLen = s.textContent.replace(/\s+/g, "").length;
    const addedLen = Array.from(s.querySelectorAll(".lesson-cont > h3.cont"))
      .reduce((sum, h) => sum + h.textContent.replace(/\s+/g, "").length, 0);
    if (afterLen - addedLen !== beforeText[s.id].length) intact = false;
  });
  assert(intact, page + ": no content lost by splitting");

  // 全ユニット・全ステップを巡回して1ステップの本文長を検査
  const items = doc.querySelectorAll(".jmap-item");
  let maxLen = 0;
  let steps = 0;
  for (const item of items) {
    const btn = item.querySelector(".btn-primary");
    btn.click();
    const sec = Array.from(doc.querySelectorAll(".study-main .study-section")).find(s => !s.hidden);
    if (!sec) { // クイズのみのユニット
      doc.querySelector(".junit-back").click();
      continue;
    }
    for (let guard = 0; guard < 200; guard++) {
      steps++;
      maxLen = Math.max(maxLen, visibleStepLength(sec));
      const btns = doc.querySelectorAll(".junit-nav .btn-primary");
      const b = btns[btns.length - 1];
      if (!/次へ/.test(b.textContent)) break;
      b.click();
    }
    doc.querySelector(".junit-back").click();
  }
  // 分割不能な単一巨大ブロックがない限り、1ステップは目安の2倍(2800字)以内に収まる
  assert(maxLen <= 2800, page + ": max step length " + maxLen + " chars over " + steps + " steps");
}

// ---------- 3. 全ページ:ユニットごとの問題数マッピング ----------
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
  const covered = new Set();
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
      qs.forEach(q => covered.add(q.id));
    }
    for (const d of (drills[page] || [])) {
      const qs = ALL.filter(q => d.cats.includes(q.category) && (!d.qlevel || q.level === d.qlevel));
      total++;
      if (qs.length > 0) mapped++; else unmapped.push(page + "#" + d.id + " (drill)");
      qs.forEach(q => covered.add(q.id));
    }
  }
  console.log("  units with questions:", mapped + "/" + total);
  assert(unmapped.length === 0, "all units map to questions" + (unmapped.length ? " — unmapped: " + unmapped.join(", ") : ""));
  console.log("  questions covered by journey:", covered.size + "/" + ALL.length);
  assert(covered.size === ALL.length, "every question reachable from some unit");
}

// ---------- 4. 空ページとインデックスページで落ちないこと ----------
console.log("== empty + index pages");
for (const page of ["study-contract.html", "study-index.html", "index.html"]) {
  try {
    boot(page);
    assert(true, page + " loads without error");
  } catch (e) {
    failures++; console.log("  FAIL:", page, e.message);
  }
}

// ---------- 5. index の進捗アノテーション ----------
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

// ---------- 6. クイズのみの演習ユニットの再開 ----------
console.log("== drill unit resume");
{
  const dom = boot("study-beginner.html");
  dom.window.eval(read("js/terms-data.js"));
  const doc = dom.window.document;
  const drill = Array.from(doc.querySelectorAll(".jmap-item")).find(i => /演習ノック:PEの基礎知識/.test(i.textContent));
  assert(!!drill, "drill unit on map");
  drill.querySelector(".btn-primary").click();
  const card = doc.querySelector(".jquiz-card");
  assert(card && /問 1 \/ 100/.test(card.querySelector(".serial").textContent), "drill quiz starts 1/100");
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

// ---------- 7. #hash 直リンク ----------
console.log("== hash deep-link");
{
  const dom = boot("study-advanced.html", "#module-waterfall-carry");
  const sec = dom.window.document.getElementById("module-waterfall-carry");
  assert(!sec.hidden, "hash deep-link opens the unit");
}

// ---------- 8. quiz.html:ドロップダウンとURLパラメータ ----------
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
  assert(window.document.getElementById("questionLevel").textContent === "上級", "question respects level filter");
  sel.value = "用語集";
  sel.dispatchEvent(new window.Event("change"));
  assert(window.document.getElementById("questionCategory").textContent === "用語集", "category change filters questions");
}

console.log(failures === 0 ? "\nALL PASS" : "\n" + failures + " FAILURES");
process.exit(failures === 0 ? 0 : 1);
