/*
 * 表示設定(文字サイズ・ダークモード)
 * - 全ページ共通のヘッダーに、文字サイズ切り替えとダークモード切り替えのボタンを差し込む。
 * - 選択内容は localStorage に保存し、次回訪問時にも復元する。
 * - <head> 側で同じキーを読む即時反映スクリプトが別途あるため、ここでの適用は
 *   フォールバック(即時スクリプトが動かない環境向け)を兼ねる。
 */
(function () {
  "use strict";

  var THEME_KEY = "pref-theme";     // "light" | "dark" | 未設定(=端末設定に従う)
  var SIZE_KEY = "pref-fontsize";   // "sm" | "md" | "lg" | "xl"

  function readPref(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function writePref(key, value) {
    try {
      if (value) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      /* プライベートブラウジング等で保存できなくても表示は反映する */
    }
  }

  function applyTheme(theme) {
    var root = document.documentElement;
    if (theme === "light" || theme === "dark") {
      root.setAttribute("data-theme", theme);
    } else {
      root.removeAttribute("data-theme");
    }
  }
  function applySize(size) {
    var root = document.documentElement;
    if (size && size !== "md") {
      root.setAttribute("data-fontsize", size);
    } else {
      root.setAttribute("data-fontsize", "md");
    }
  }

  var theme = readPref(THEME_KEY); // null = 自動(端末設定)
  var size = readPref(SIZE_KEY) || "md";
  applyTheme(theme);
  applySize(size);

  var SIZE_LABELS = [
    ["sm", "小"],
    ["md", "標準"],
    ["lg", "大"],
    ["xl", "特大"],
  ];

  function themeButtonLabel(t) {
    if (t === "dark") return "🌙 ダーク";
    if (t === "light") return "☀️ ライト";
    return "🖥️ 自動";
  }

  function buildControls() {
    var header = document.querySelector(".site-header-inner");
    if (!header || header.querySelector(".pref-controls")) return;

    var wrap = document.createElement("div");
    wrap.className = "pref-controls";

    // 文字サイズ選択(4段階)
    var fontGroup = document.createElement("div");
    fontGroup.className = "pref-group pref-font-group";
    fontGroup.setAttribute("role", "group");
    fontGroup.setAttribute("aria-label", "文字の大きさを選ぶ");

    var fontButtons = SIZE_LABELS.map(function (pair) {
      var key = pair[0];
      var label = pair[1];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pref-btn pref-font-btn";
      btn.setAttribute("data-size", key);
      btn.setAttribute("aria-pressed", String(key === size));
      btn.title = "文字サイズ: " + label;
      btn.textContent = label;
      if (key === size) btn.classList.add("active");
      btn.addEventListener("click", function () {
        size = key;
        writePref(SIZE_KEY, size);
        applySize(size);
        fontButtons.forEach(function (b) {
          var on = b.getAttribute("data-size") === size;
          b.classList.toggle("active", on);
          b.setAttribute("aria-pressed", String(on));
        });
      });
      fontGroup.appendChild(btn);
      return btn;
    });

    // ダークモード切り替え(自動 -> ライト -> ダーク -> 自動 の3段階トグル)
    var themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.className = "pref-btn pref-theme-btn";
    themeBtn.setAttribute("aria-label", "配色を切り替える(自動/ライト/ダーク)");
    themeBtn.title = "配色を切り替える(自動/ライト/ダーク)";
    themeBtn.textContent = themeButtonLabel(theme);
    themeBtn.addEventListener("click", function () {
      if (theme === "dark") {
        theme = null; // 自動へ戻す
      } else if (theme === "light") {
        theme = "dark";
      } else {
        theme = "light";
      }
      writePref(THEME_KEY, theme);
      applyTheme(theme);
      themeBtn.textContent = themeButtonLabel(theme);
    });

    wrap.appendChild(fontGroup);
    wrap.appendChild(themeBtn);
    header.appendChild(wrap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildControls);
  } else {
    buildControls();
  }
})();
