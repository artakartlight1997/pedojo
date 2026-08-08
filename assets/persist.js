/* ===== persist.js — 進捗の永続化レイヤ =====
   進捗が消えたら道場は成立しないため、保存を多層にする。

   ① localStorage       主。同期的に読み書きできる
   ② IndexedDB          副（ミラー）。localStorage が消えても復元できる
   ③ 進捗ファイル        File System Access API 対応ブラウザなら、
                        選んだファイルへ自動保存＝ディスク上に本物の永続化
   ④ 手動バックアップ    どのブラウザでも .json をダウンロード／復元できる

   さらに：
   - 保存に失敗したら「黙って消える」ことがないよう、画面に警告を出す
   - 起動時に ①と② を突き合わせ、updatedAt が新しい方を採用する
   - 一定回数の保存ごとに、バックアップを促す                                */
(function (g) {
  'use strict';
  var DOJO = g.DOJO = g.DOJO || {};

  var LS_KEY = 'pedojo.v1';
  var DB_NAME = 'pedojo';
  var DB_STORE = 'state';
  var DB_KEY = 'main';
  var FH_KEY = 'pedojo.fileHandle';   // IndexedDB に保存するファイルハンドル

  var db = null;
  var fileHandle = null;
  var memory = null;                  // localStorage が使えない環境の最終手段
  var lsOK = true;
  var state = {
    ls: 'unknown', idb: 'unknown', file: 'off',
    lastSaved: null, lastError: null, saves: 0, recovered: null
  };
  var listeners = [];

  function notify() { listeners.forEach(function (f) { try { f(state); } catch (e) {} }); }
  function fail(where, e) {
    state.lastError = where + ': ' + (e && e.message ? e.message : String(e));
    notify();
  }

  /* ---------- localStorage ---------- */
  function lsRead() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      state.ls = 'ok';
      return raw ? JSON.parse(raw) : null;
    } catch (e) { lsOK = false; state.ls = 'ng'; fail('localStorage読込', e); return null; }
  }
  function lsWrite(obj) {
    if (!lsOK) return false;
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); state.ls = 'ok'; return true; }
    catch (e) { lsOK = false; state.ls = 'ng'; fail('localStorage保存', e); return false; }
  }

  /* ---------- IndexedDB ---------- */
  function openDB() {
    return new Promise(function (res) {
      if (!g.indexedDB) { state.idb = 'na'; return res(null); }
      var req;
      try { req = indexedDB.open(DB_NAME, 1); }
      catch (e) { state.idb = 'ng'; fail('IndexedDB', e); return res(null); }
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains(DB_STORE)) d.createObjectStore(DB_STORE);
      };
      req.onsuccess = function () { db = req.result; state.idb = 'ok'; res(db); };
      req.onerror = function () { state.idb = 'ng'; fail('IndexedDB', req.error); res(null); };
    });
  }
  function idbGet(key) {
    return new Promise(function (res) {
      if (!db) return res(null);
      try {
        var tx = db.transaction(DB_STORE, 'readonly');
        var r = tx.objectStore(DB_STORE).get(key);
        r.onsuccess = function () { res(r.result || null); };
        r.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
  }
  function idbPut(key, val) {
    return new Promise(function (res) {
      if (!db) return res(false);
      try {
        var tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put(val, key);
        tx.oncomplete = function () { state.idb = 'ok'; res(true); };
        tx.onerror = function () { state.idb = 'ng'; fail('IndexedDB保存', tx.error); res(false); };
      } catch (e) { state.idb = 'ng'; fail('IndexedDB保存', e); res(false); }
    });
  }

  /* ---------- 進捗ファイル（File System Access API） ---------- */
  var canFile = !!(g.showSaveFilePicker);

  function fileWrite(obj) {
    if (!fileHandle) return Promise.resolve(false);
    return fileHandle.createWritable()
      .then(function (w) { return w.write(JSON.stringify(obj, null, 2)).then(function () { return w.close(); }); })
      .then(function () { state.file = 'on'; return true; })
      .catch(function (e) { state.file = 'ng'; fail('進捗ファイル保存', e); return false; });
  }

  function verifyPermission(handle) {
    if (!handle || !handle.queryPermission) return Promise.resolve(false);
    var opts = { mode: 'readwrite' };
    return handle.queryPermission(opts).then(function (p) {
      if (p === 'granted') return true;
      return handle.requestPermission(opts).then(function (p2) { return p2 === 'granted'; });
    }).catch(function () { return false; });
  }

  /* ---------- 統合 ---------- */
  function stamp(obj) {
    obj._v = 1;
    obj._ts = Date.now();
    return obj;
  }
  function newer(a, b) {
    if (!a) return b; if (!b) return a;
    return ((a._ts || 0) >= (b._ts || 0)) ? a : b;
  }

  var Persist = DOJO.Persist = {
    canFile: canFile,

    /** 起動時に呼ぶ。localStorage と IndexedDB を突き合わせ、最新の状態を返す */
    init: function () {
      var ls = lsRead();
      return openDB().then(function () {
        return idbGet(DB_KEY);
      }).then(function (idb) {
        var best = newer(ls, idb);
        // 片方だけに新しいデータがあれば、もう片方へ復元する
        if (best && ls && best !== ls) { lsWrite(best); state.recovered = 'IndexedDBから復元しました'; }
        if (best && !ls) { lsWrite(best); state.recovered = 'IndexedDBから復元しました'; }
        if (best && (!idb || (idb._ts || 0) < (best._ts || 0))) idbPut(DB_KEY, best);
        if (!lsOK) memory = best || null;
        return idbGet(FH_KEY);
      }).then(function (h) {
        if (!h || !canFile) return null;
        return verifyPermission(h).then(function (ok) {
          if (ok) { fileHandle = h; state.file = 'on'; }
          else { state.file = 'need-permission'; }
          return null;
        });
      }).then(function () {
        notify();
        return { data: (lsOK ? lsRead() : memory), status: state };
      }).catch(function (e) {
        fail('init', e);
        return { data: ls, status: state };
      });
    },

    /** 同期読み出し（store から呼ばれる） */
    readSync: function () {
      if (!lsOK) return memory;
      return lsRead();
    },

    /** 保存。localStorage は即時、IndexedDB とファイルはデバウンスして書く */
    write: (function () {
      var timer = null, pending = null;
      return function (obj) {
        stamp(obj);
        if (!lsWrite(obj)) memory = obj;
        state.lastSaved = new Date();
        state.saves++;
        pending = obj;
        clearTimeout(timer);
        timer = setTimeout(function () {
          var o = pending; pending = null;
          idbPut(DB_KEY, o);
          fileWrite(o);
          notify();
        }, 800);
        notify();
      };
    })(),

    status: function () { return state; },
    onChange: function (fn) { listeners.push(fn); },

    /** 進捗ファイルを選んで、以後の自動保存を有効にする */
    enableFile: function (obj) {
      if (!canFile) return Promise.reject(new Error('このブラウザは進捗ファイルへの自動保存に対応していません'));
      var d = new Date();
      var name = 'pedojo-progress-' + d.getFullYear()
        + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '.json';
      return g.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'PE道場の進捗', accept: { 'application/json': ['.json'] } }]
      }).then(function (h) {
        fileHandle = h;
        state.file = 'on';
        idbPut(FH_KEY, h);          // ハンドルを保存しておくと、次回以降も同じファイルに書ける
        return fileWrite(stamp(obj));
      }).then(function () { notify(); return true; });
    },

    /** 手動バックアップのダウンロード（全ブラウザ対応） */
    download: function (obj) {
      var d = new Date();
      var name = 'pedojo-backup-' + d.getFullYear()
        + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
        + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '.json';
      var blob = new Blob([JSON.stringify(stamp(obj), null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      try { localStorage.setItem('pedojo.lastBackup', String(Date.now())); } catch (e) {}
      return name;
    },

    /** バックアップから復元（File オブジェクトを渡す） */
    restoreFile: function (file) {
      return file.text().then(function (txt) {
        var obj = JSON.parse(txt);
        if (!obj || typeof obj !== 'object' || !('q' in obj)) throw new Error('進捗ファイルの形式ではありません');
        Persist.write(obj);
        return obj;
      });
    },

    /** バックアップを促すべきか（最後のバックアップから7日、または200回の保存） */
    needsBackup: function () {
      var last = 0;
      try { last = Number(localStorage.getItem('pedojo.lastBackup') || 0); } catch (e) {}
      if (state.file === 'on') return false;             // ファイル自動保存が有効なら不要
      if (!last) return state.saves >= 30;
      return (Date.now() - last) > 7 * 86400000;
    }
  };
})(window);
