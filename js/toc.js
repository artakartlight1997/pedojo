/* 座学ページ用の目次(TOC)自動生成。h2見出しから左サイドのリンクを組み立てる。 */
(function () {
  "use strict";
  function slugify(text, idx) {
    return "module-" + idx;
  }
  document.addEventListener("DOMContentLoaded", function () {
    var toc = document.getElementById("studyToc");
    var sections = document.querySelectorAll(".study-main .study-section");
    if (!toc || sections.length === 0) return;
    var list = document.createElement("div");
    sections.forEach(function (sec, idx) {
      var h2 = sec.querySelector("h2");
      if (!h2) return;
      if (!sec.id) sec.id = slugify(h2.textContent, idx);
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      a.textContent = h2.textContent;
      list.appendChild(a);
    });
    toc.appendChild(list);
  });
})();
