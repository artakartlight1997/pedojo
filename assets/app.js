/* ===== app.js — ルーティングと起動 ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO;

  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('?')[0].split('/').filter(Boolean);
    var qs = (location.hash.split('?')[1] || '');
    var UI = DOJO.UI;

    document.querySelectorAll('.topnav button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.nav === (parts[0] || 'home'));
    });

    switch (parts[0]) {
      case undefined:
      case 'home': UI.home(); break;
      case 'curriculum': UI.curriculum(); break;
      case 'topic': UI.topic(parts[1]); break;
      case 'lecture': UI.lecture(parts[1], parts[2] || 'b'); break;
      case 'quiz': UI.quiz(parts[1], parts[2] || 'b'); break;
      case 'drill': UI.drill(); break;
      case 'review': UI.review(); break;
      case 'exam': UI.exam(); break;
      case 'glossary': UI.glossary(); break;
      case 'progress': UI.progress(); break;
      case 'search': UI.search(decodeURIComponent((qs.match(/q=([^&]*)/) || [])[1] || '')); break;
      default: UI.notfound();
    }
  }

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    DOJO.Store.settings({ theme: t });
  }

  function boot() {
    var appEl = document.getElementById('app');
    DOJO.UI.init(appEl);
    DOJO.UI.delegate();

    applyTheme(DOJO.Store.settings().theme || 'light');

    document.getElementById('themeToggle').addEventListener('click', function () {
      applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    document.querySelectorAll('.topnav button, .brand').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = b.dataset.nav;
        location.hash = n === 'home' ? '#/' : '#/' + n;
      });
    });
    var gs = document.getElementById('globalSearch');
    gs.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && gs.value.trim()) location.hash = '#/search?q=' + encodeURIComponent(gs.value.trim());
    });

    // キーボードショートカット（クイズ中）
    document.addEventListener('keydown', function (e) {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) return;
      var s = DOJO.current;
      if (!s || s.finished) return;
      if (/^[1-6]$/.test(e.key)) {
        var b = appEl.querySelector('[data-pick="' + (parseInt(e.key, 10) - 1) + '"]');
        if (b && !b.disabled) { b.click(); e.preventDefault(); }
      } else if (e.key === 'Enter' || e.key === ' ') {
        var n = document.getElementById('nextBtn');
        if (n) { n.click(); e.preventDefault(); }
      } else if (e.key === 'ArrowLeft') {
        var p = document.getElementById('prevBtn'); if (p) p.click();
      }
    });

    window.addEventListener('hashchange', route);

    document.getElementById('boot').hidden = true;
    document.querySelector('.topbar').hidden = false;
    document.querySelector('.foot').hidden = false;
    appEl.hidden = false;

    var o = DOJO.Store.overall();
    document.getElementById('footStats').textContent =
      DOJO.TOPICS.length + 'トピック / ' + o.total + '問収録';

    route();
  }

  window.addEventListener('DOMContentLoaded', function () {
    DOJO.loadAll(boot);
  });
})(window);
