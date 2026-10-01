/* ===== tools/glossary2.js — 工程講義§6の用語から用語集を逆引き生成する =====
   使い方: node tools/glossary2.js
   出力: data/glossary2.js（DOJO.glossary([...])。v1 の data/glossary.js に無い用語だけを、章タグ付きで追加する）
   ルール: 見出しの括弧以降を除いた形（例「IM（インフォメーション・メモランダム）」→「IM」）で重複判定。
          同じ用語が複数章に出る場合は最初に出た章（章番号・周・順の昇順）の定義を採る。 */
const fs = require('fs');
global.window = global;
global.document = { createElement: () => ({}), getElementById: () => null, querySelectorAll: () => [], addEventListener: () => {}, body: {} };
global.location = { hash: '' };
global.localStorage = { getItem: () => null, setItem: () => {} };
function load(p) { eval(fs.readFileSync(p, 'utf8')); }
load('assets/md.js'); load('data/curriculum.js'); load('assets/loader.js'); load('assets/loader2.js'); load('data/glossary.js');
for (const f of fs.readdirSync('data/lectures2').sort()) load('data/lectures2/' + f);

const norm = s => String(s || '').replace(/[（(].*$/, '').replace(/\s+/g, ' ').trim();
const known = new Set();
DOJO.GLOSSARY.forEach(e => { known.add(e.term); known.add(norm(e.term)); });

const lecs = Object.values(DOJO.LECTURES2).sort((a, b) => a.chapter.localeCompare(b.chapter) || (a.lap - b.lap) || (a.order - b.order));
const out = []; const seen = new Set(); let dup = 0, skipped = 0;
lecs.forEach(l => (l.sections.terms || []).forEach(t => {
  const k = norm(t.term);
  if (!k || k.length < 2) { skipped++; return; }
  if (known.has(t.term) || known.has(k)) { skipped++; return; }
  if (seen.has(k)) { dup++; return; }
  seen.add(k);
  out.push({ term: t.term, en: t.en || '', topic: l.chapter, src: l.id, def: t.def });
}));

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\r?\n/g, ' ');
let js = '/* ===== glossary2.js — 工程講義§6から逆引きした用語集（tools/glossary2.js が生成。手で編集しない） =====\n';
js += '   ' + out.length + '語。topic は章ID（ch00〜ch11）、src は初出の講義ID。v1 の glossary.js と重複する用語は含まない。 */\n';
js += 'DOJO.glossary([\n';
let cur = '';
out.forEach(e => {
  if (e.topic !== cur) { cur = e.topic; const c = DOJO.chapterById(cur); js += '/* --- 第' + c.n + '章 ' + c.name + ' --- */\n'; }
  js += '{term:\'' + esc(e.term) + '\', en:\'' + esc(e.en) + '\', topic:\'' + e.topic + '\', src:\'' + e.src + '\', def:\'' + esc(e.def) + '\'},\n';
});
js += ']);\n';
fs.writeFileSync('data/glossary2.js', js);
console.log('glossary2: 新規 ' + out.length + ' 語（v1用語集 ' + DOJO.GLOSSARY.length + ' 語と重複 ' + skipped + '、講義間の重複 ' + dup + '）→ data/glossary2.js');
