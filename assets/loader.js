/* ===== loader.js — 座学/問題データの動的ロード（file:// でも動作） ===== */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};

  DOJO.LECTURES = {};   // { topicId: { b: md, i: md, a: md } }
  DOJO.BANK = {};       // { "topicId-lv": [question, ...] }
  DOJO.GLOSSARY = [];   // [{term, read, level, topic, def}]

  /** 座学登録: DOJO.lecture('acct', {b:'...', i:'...', a:'...'}) */
  DOJO.lecture = function (topicId, obj) {
    DOJO.LECTURES[topicId] = Object.assign(DOJO.LECTURES[topicId] || {}, obj);
  };

  /** 問題登録: DOJO.quiz('acct','b',[...]) */
  DOJO.quiz = function (topicId, lv, arr) {
    var key = topicId + '-' + lv;
    var base = DOJO.BANK[key] || (DOJO.BANK[key] = []);
    for (var i = 0; i < arr.length; i++) {
      var q = arr[i];
      q.topic = topicId;
      q.lv = lv;
      if (!q.id) q.id = topicId + '-' + lv + '-' + String(base.length + 1).padStart(3, '0');
      base.push(q);
    }
  };

  /** 用語集登録 */
  DOJO.glossary = function (arr) {
    for (var i = 0; i < arr.length; i++) DOJO.GLOSSARY.push(arr[i]);
  };

  /** すべての問題をフラットに */
  DOJO.allQuestions = function () {
    var out = [];
    Object.keys(DOJO.BANK).forEach(function (k) { out = out.concat(DOJO.BANK[k]); });
    return out;
  };
  DOJO.questionsOf = function (topicId, lv) {
    return (DOJO.BANK[topicId + '-' + lv] || []).slice();
  };
  DOJO.questionById = function (id) {
    var all = DOJO.allQuestions();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  };

  /** スクリプトを順次読み込む */
  function loadScripts(urls, done) {
    var idx = 0, failed = [];
    (function next() {
      if (idx >= urls.length) return done(failed);
      var s = document.createElement('script');
      s.src = urls[idx];
      s.onload = function () { idx++; next(); };
      s.onerror = function () { failed.push(urls[idx]); idx++; next(); };
      document.head.appendChild(s);
    })();
  }

  DOJO.loadAll = function (done) {
    var urls = ['data/glossary.js'];
    DOJO.TOPICS.forEach(function (t) { urls.push('data/lectures/' + t.id + '.js'); });
    DOJO.TOPICS.forEach(function (t) {
      DOJO.LEVELS.forEach(function (l) { urls.push('data/quiz/' + t.id + '-' + l.id + '.js'); });
    });
    loadScripts(urls, function (failed) {
      if (failed.length) console.warn('[dojo] 未収録データ ' + failed.length + ' 件', failed);
      done();
    });
  };
})(window);
