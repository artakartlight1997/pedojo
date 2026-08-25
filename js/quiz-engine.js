/*
 * 投資プロ5000本ノック — クイズエンジン
 * ------------------------------------------------------------
 * terms-data.js で定義される手書きの用語・シナリオ問題(TERM_QUESTIONS)と
 * calc-generators.js のパラメータ自動生成の計算問題を組み合わせて出題する。
 * 進捗(通算ノック数・正解数・連続正解)は localStorage に保存する。
 */

(function () {
  "use strict";

  const STORAGE_KEY = "toshipro5000_progress_v2";
  const TARGET = 5000;

  const TERM_POOL = typeof TERM_QUESTIONS !== "undefined" ? TERM_QUESTIONS : [];

  // ---------- 進捗状態 ----------

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) throw new Error("no data");
      const parsed = JSON.parse(raw);
      return Object.assign(
        { count: 0, correct: 0, streak: 0, maxStreak: 0, byLevel: {} },
        parsed
      );
    } catch (e) {
      return { count: 0, correct: 0, streak: 0, maxStreak: 0, byLevel: {} };
    }
  }

  function saveProgress(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* localStorage unavailable — 進捗は保存されないが動作は継続 */
    }
  }

  let progress = loadProgress();

  // ---------- フィルタ状態 ----------

  let levelFilter = "all"; // "all" | "初級" | "中級" | "上級"
  let categoryFilter = "all";

  // ---------- 出題キュー(用語問題を網羅してから繰り返す) ----------

  let termQueue = [];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function filteredTerms() {
    return TERM_POOL.filter((q) => {
      if (levelFilter !== "all" && q.level !== levelFilter) return false;
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      return true;
    });
  }

  function refillQueue() {
    termQueue = shuffle(filteredTerms());
  }

  function nextTermQuestion() {
    if (termQueue.length === 0) refillQueue();
    if (termQueue.length === 0) return null;
    return termQueue.pop();
  }

  function matchingCalcGenerators() {
    return CalcGenerators.list.filter((g) => {
      if (levelFilter !== "all" && g.level !== levelFilter) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      return true;
    });
  }

  function nextCalcQuestion() {
    const pool = matchingCalcGenerators();
    if (pool.length === 0) return null;
    const gen = pool[Math.floor(Math.random() * pool.length)];
    const built = gen.build();
    return Object.assign(
      {
        id: "calc-" + gen.key + "-" + Date.now() + "-" + Math.floor(Math.random() * 1e6),
        type: "calc",
        level: gen.level,
        category: gen.category,
      },
      built
    );
  }

  function pickNextQuestion() {
    const hasTerms = filteredTerms().length > 0;
    const hasCalc = matchingCalcGenerators().length > 0;

    if (hasTerms && hasCalc) {
      // 用語問題と計算問題をおよそ半々で出題
      if (Math.random() < 0.5) {
        const t = nextTermQuestion();
        if (t) return Object.assign({ type: "term" }, t);
        return nextCalcQuestion();
      }
      return nextCalcQuestion();
    }
    if (hasTerms) {
      const t = nextTermQuestion();
      return t ? Object.assign({ type: "term" }, t) : null;
    }
    if (hasCalc) return nextCalcQuestion();
    return null;
  }

  // ---------- カテゴリ一覧の収集 ----------

  function allCategories() {
    const set = new Set();
    TERM_POOL.forEach((q) => set.add(q.category));
    CalcGenerators.list.forEach((g) => set.add(g.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
  }

  // ---------- DOM ----------

  const el = {
    statCount: document.getElementById("statCount"),
    statCorrect: document.getElementById("statCorrect"),
    statAccuracy: document.getElementById("statAccuracy"),
    statStreak: document.getElementById("statStreak"),
    statMaxStreak: document.getElementById("statMaxStreak"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    levelButtons: document.getElementById("levelButtons"),
    categoryButtons: document.getElementById("categoryButtons"),
    questionCategory: document.getElementById("questionCategory"),
    questionLevel: document.getElementById("questionLevel"),
    questionSerial: document.getElementById("questionSerial"),
    questionText: document.getElementById("questionText"),
    choices: document.getElementById("choices"),
    feedback: document.getElementById("feedback"),
    feedbackHeadline: document.getElementById("feedbackHeadline"),
    feedbackExplain: document.getElementById("feedbackExplain"),
    nextBtn: document.getElementById("nextBtn"),
    resetBtn: document.getElementById("resetBtn"),
    milestone: document.getElementById("milestone"),
    variationCount: document.getElementById("variationCount"),
  };

  let currentQuestion = null;
  let answered = false;

  function renderStats() {
    el.statCount.textContent = progress.count.toLocaleString("ja-JP");
    el.statCorrect.textContent = progress.correct.toLocaleString("ja-JP");
    el.statAccuracy.textContent =
      progress.count > 0 ? Math.round((progress.correct / progress.count) * 100) + "%" : "–";
    el.statStreak.textContent = progress.streak.toLocaleString("ja-JP");
    el.statMaxStreak.textContent = progress.maxStreak.toLocaleString("ja-JP");

    const pct = Math.min(100, Math.round((progress.count / TARGET) * 100));
    el.progressFill.style.width = pct + "%";
    el.progressText.textContent = `${Math.min(progress.count, TARGET).toLocaleString(
      "ja-JP"
    )} / ${TARGET.toLocaleString("ja-JP")} 本 (${pct}%)${
      progress.count > TARGET ? ` ※通算 ${progress.count.toLocaleString("ja-JP")} 本` : ""
    }`;

    if (el.milestone) {
      el.milestone.hidden = progress.count < TARGET;
    }
  }

  function renderLevelButtons() {
    if (!el.levelButtons) return;
    const levels = [
      ["all", "すべて"],
      ["初級", "初級"],
      ["中級", "中級"],
      ["上級", "上級"],
    ];
    el.levelButtons.innerHTML = "";
    levels.forEach(([value, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-btn" + (levelFilter === value ? " active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => {
        levelFilter = value;
        refillQueue();
        renderLevelButtons();
        renderCategoryButtons();
        loadNextQuestion();
      });
      el.levelButtons.appendChild(btn);
    });
  }

  function renderCategoryButtons() {
    if (!el.categoryButtons) return;
    const cats = ["all"].concat(allCategories());
    el.categoryButtons.innerHTML = "";
    cats.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-btn" + (categoryFilter === cat ? " active" : "");
      btn.textContent = cat === "all" ? "すべてのジャンル" : cat;
      btn.addEventListener("click", () => {
        categoryFilter = cat;
        refillQueue();
        renderCategoryButtons();
        loadNextQuestion();
      });
      el.categoryButtons.appendChild(btn);
    });
  }

  function loadNextQuestion() {
    answered = false;
    el.feedback.hidden = true;
    currentQuestion = pickNextQuestion();

    if (!currentQuestion) {
      el.questionText.textContent = "この条件に合う問題が見つかりませんでした。フィルタを変更してください。";
      el.choices.innerHTML = "";
      return;
    }

    if (el.questionCategory) el.questionCategory.textContent = currentQuestion.category;
    if (el.questionLevel) {
      el.questionLevel.textContent = currentQuestion.level;
      el.questionLevel.className = "badge badge-level badge-level-" + currentQuestion.level;
    }
    if (el.questionSerial) el.questionSerial.textContent = `第 ${(progress.count + 1).toLocaleString("ja-JP")} 問`;
    el.questionText.textContent = currentQuestion.question;

    el.choices.innerHTML = "";
    currentQuestion.choices.forEach((choiceText, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = choiceText;
      btn.addEventListener("click", () => handleAnswer(idx, btn));
      el.choices.appendChild(btn);
    });
  }

  function handleAnswer(idx, btnEl) {
    if (answered) return;
    answered = true;

    const isCorrect = idx === currentQuestion.answerIndex;

    progress.count += 1;
    if (isCorrect) {
      progress.correct += 1;
      progress.streak += 1;
      progress.maxStreak = Math.max(progress.maxStreak, progress.streak);
    } else {
      progress.streak = 0;
    }
    saveProgress(progress);
    renderStats();

    const buttons = Array.from(el.choices.children);
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === currentQuestion.answerIndex) b.classList.add("correct");
      else if (i === idx) b.classList.add("wrong");
    });

    el.feedback.hidden = false;
    el.feedbackHeadline.textContent = isCorrect ? "◯ 正解！" : "✕ 不正解";
    el.feedbackHeadline.className = "feedback-headline " + (isCorrect ? "correct" : "wrong");
    el.feedbackExplain.textContent = currentQuestion.explain;
  }

  function resetProgress() {
    if (!confirm("これまでの記録(通算ノック数・正解数など)をすべて削除します。よろしいですか？")) return;
    progress = { count: 0, correct: 0, streak: 0, maxStreak: 0, byLevel: {} };
    saveProgress(progress);
    renderStats();
    loadNextQuestion();
  }

  function init() {
    if (el.variationCount) {
      const total = TERM_POOL.length + CalcGenerators.totalCombos();
      el.variationCount.textContent = total.toLocaleString("ja-JP");
    }
    renderStats();
    renderLevelButtons();
    renderCategoryButtons();
    refillQueue();
    loadNextQuestion();

    if (el.nextBtn) el.nextBtn.addEventListener("click", loadNextQuestion);
    if (el.resetBtn) el.resetBtn.addEventListener("click", resetProgress);

    document.addEventListener("keydown", (e) => {
      if (!answered && ["1", "2", "3", "4"].includes(e.key)) {
        const i = Number(e.key) - 1;
        const btn = el.choices.children[i];
        if (btn) btn.click();
      } else if (answered && e.key === "Enter") {
        loadNextQuestion();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
