/* 用語集ページの検索フィルタ */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("glossarySearch");
    var cards = document.querySelectorAll(".glossary-card");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var hit = q === "" || card.textContent.toLowerCase().includes(q);
        card.style.display = hit ? "" : "none";
      });
    });
  });
})();
