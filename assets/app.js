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
      case 'path': UI.path(); break;
      case 'curriculum': UI.curriculum(); break;
      case 'topic': UI.topic(parts[1]); break;
      case 'lecture': UI.lecture(parts[1], parts[2] || 'b'); break;
      case 'quiz': UI.quiz(parts[1], parts[2] || 'b', parts[3] !== undefined ? parseInt(parts[3], 10) : undefined); break;
      case 'resume': UI.resume(); break;
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
    window.addEventListener('beforeunload', function () { try { DOJO.Store.save(); } catch (e) {} });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') { try { DOJO.Store.save(); } catch (e) {} }
    });

    document.getElementById('boot').hidden = true;
    document.querySelector('.topbar').hidden = false;
    document.querySelector('.foot').hidden = false;
    appEl.hidden = false;

    var o = DOJO.Store.overall();
    document.getElementById('footStats').textContent =
      DOJO.TOPICS.length + 'トピック / ' + o.total + '問収録';

    route();
  }

  /* 保存の状態を画面に出す（黙って消えるのを防ぐ） */
  /* 復元の知らせは、直後の保存で notify() が走ると消えてしまうため、
     一度受け取ったらこちらで持ち、一定時間は出し続ける */
  var recoveredMsg = null, recoveredUntil = 0, recoveredTimer = null;

  function renderSaveBanner() {
    var P = DOJO.Persist; if (!P) return;
    var st = P.status();
    if (st.recovered) {
      recoveredMsg = st.recovered;
      recoveredUntil = Date.now() + 12000;
      st.recovered = null;
      clearTimeout(recoveredTimer);
      recoveredTimer = setTimeout(renderSaveBanner, 12200);
    }
    var bar = document.getElementById('saveBanner');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'saveBanner';
      bar.className = 'savebar';
      document.body.insertBefore(bar, document.getElementById('app'));
    }
    var msg = '', cls = '';
    if (st.ls === 'ng' && st.idb !== 'ok') {
      cls = 'bad';
      msg = '⚠ このブラウザに進捗を保存できません（プライベートモード等）。'
          + '<a href="#/progress">進捗ページ</a>でバックアップを保存してください。';
    } else if (st.ls === 'ng') {
      cls = 'warn';
      msg = '⚠ localStorage に保存できないため、IndexedDB のみで保持しています。'
          + '<a href="#/progress">バックアップ</a>を取ってください。';
    } else if (st.file === 'need-permission') {
      cls = 'warn';
      msg = '進捗ファイルへの自動保存が一時停止しています。'
          + '<a href="#/progress">進捗ページ</a>で許可し直してください。';
    } else if (P.needsBackup()) {
      cls = 'warn';
      msg = 'バックアップをしばらく取っていません。'
          + '<a href="#/progress">進捗ページ</a>から保存できます。';
    } else if (recoveredMsg && Date.now() < recoveredUntil) {
      cls = 'ok';
      msg = '✓ ' + recoveredMsg + '（進捗は失われていません）';
    }
    if (!msg) { bar.remove(); return; }
    bar.className = 'savebar ' + cls;
    bar.innerHTML = msg;
  }
  DOJO.renderSaveBanner = renderSaveBanner;

  window.addEventListener('DOMContentLoaded', function () {
    var P = DOJO.Persist;
    var ready = P ? P.init() : Promise.resolve(null);
    ready.catch(function () { return null; }).then(function () {
      DOJO.loadAll(function () {
        boot();
        renderSaveBanner();
        if (P) P.onChange(renderSaveBanner);
      });
    });
  });
})(window);
