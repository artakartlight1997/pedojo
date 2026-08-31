// 座学ページの各記事の下に、その記事に出てきた用語集の用語の解説を自動表示する。
// データは js/glossary-data.js(glossary.html から自動生成)。
// journey.js より前に読み込むこと(ステップ学習の分割前にDOMへ挿入するため)。
(function () {
  "use strict";
  var TERMS = window.GLOSSARY_TERMS;
  if (!TERMS || !TERMS.length) return;
  var sections = document.querySelectorAll(".study-main .study-section");
  if (!sections.length) return;

  function isAscii(s) {
    return /^[\x20-\x7e]+$/.test(s);
  }
  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 各用語に「本文テキスト中の最初の出現位置を返す」照合関数を用意する。
  // 半角英数の別名(GP、EVなど)は前後が英数字でない位置のみマッチさせ、
  // "TOP" の P や "REVIEW" の EV のような偶然の一致を防ぐ。
  var matchers = TERMS.map(function (t) {
    var res = t.aliases.map(function (a) {
      if (isAscii(a)) {
        return { re: new RegExp("(^|[^A-Za-z0-9])" + escapeRe(a) + "($|[^A-Za-z0-9])") };
      }
      return { str: a };
    });
    return {
      term: t,
      find: function (text) {
        var best = -1;
        for (var i = 0; i < res.length; i++) {
          var p = -1;
          if (res[i].str) {
            p = text.indexOf(res[i].str);
          } else {
            var m = res[i].re.exec(text);
            if (m) p = m.index;
          }
          if (p >= 0 && (best < 0 || p < best)) best = p;
        }
        return best;
      },
    };
  });

  sections.forEach(function (sec) {
    var seen = {}; // モジュール内では同じ用語を最初に出てきた記事の下にだけ載せる
    var articles = sec.querySelectorAll(":scope > article");
    Array.prototype.forEach.call(articles, function (art) {
      var text = art.textContent || "";
      var hits = [];
      matchers.forEach(function (mt) {
        if (seen[mt.term.id]) return;
        var pos = mt.find(text);
        if (pos < 0) return;
        seen[mt.term.id] = true;
        hits.push({ term: mt.term, pos: pos });
      });
      if (!hits.length) return;
      hits.sort(function (a, b) {
        return a.pos - b.pos;
      });

      var aside = document.createElement("aside");
      aside.className = "term-note";
      var h = document.createElement("p");
      h.className = "term-note-title";
      h.textContent = "📖 この記事に出てきた用語";
      aside.appendChild(h);
      var dl = document.createElement("dl");
      hits.forEach(function (hit) {
        var dt = document.createElement("dt");
        var a = document.createElement("a");
        a.href = "glossary.html#" + hit.term.id;
        a.textContent = hit.term.name;
        dt.appendChild(a);
        var dd = document.createElement("dd");
        dd.textContent = hit.term.def;
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
      aside.appendChild(dl);
      art.appendChild(aside);
    });
  });
})();
