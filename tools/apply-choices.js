/* apply.js — 選択肢の差し替えパッチを data/quiz/*.js に適用する
   パッチ形式: { "lbo-i-003": { "1": "新しい誤答文", "3": "..." }, ... }
   使い方: node apply.js patch.json                                        */
const fs = require('fs');
const patch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// id -> {file, idx}
const byFile = {};
Object.keys(patch).forEach(id => {
  const m = id.match(/^(.+)-([bia p]|[biap])-(\d+)$/);
  const parts = id.split('-');
  const num = parseInt(parts.pop(), 10);
  const lv = parts.pop();
  const topic = parts.join('-');
  const file = 'data/quiz/' + topic + '-' + lv + '.js';
  (byFile[file] = byFile[file] || []).push({ id, idx: num - 1, rep: patch[id] });
});

let changed = 0, miss = [];
Object.keys(byFile).forEach(file => {
  let src = fs.readFileSync(file, 'utf8');
  // choices 配列の位置を順に取得
  const positions = [];
  const re = /choices:\s*\[/g; let m;
  while ((m = re.exec(src))) {
    // 対応する ] を探す（文字列内の ] は考慮不要：選択肢に ] は使っていない前提）
    let i = m.index + m[0].length, depth = 1;
    while (i < src.length && depth > 0) { if (src[i] === '[') depth++; else if (src[i] === ']') depth--; i++; }
    positions.push({ start: m.index, bodyStart: m.index + m[0].length, end: i - 1 });
  }
  // 後ろから適用（オフセットずれ防止）
  byFile[file].sort((a, b) => b.idx - a.idx).forEach(job => {
    const p = positions[job.idx];
    if (!p) { miss.push(job.id + ' (index out of range)'); return; }
    const body = src.slice(p.bodyStart, p.end);
    // 選択肢文字列を抽出
    const items = [];
    const sre = /'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"/g; let sm;
    while ((sm = sre.exec(body))) items.push(sm[1] !== undefined ? sm[1] : sm[2]);
    if (!items.length) { miss.push(job.id + ' (no choices parsed)'); return; }
    Object.keys(job.rep).forEach(k => {
      const i = parseInt(k, 10);
      if (i < 0 || i >= items.length) { miss.push(job.id + ' bad index ' + k); return; }
      items[i] = job.rep[k];
    });
    const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const rebuilt = '\n    ' + items.map(s => "'" + esc(s) + "'").join(',\n    ') + '\n  ';
    src = src.slice(0, p.bodyStart) + rebuilt + src.slice(p.end);
    changed++;
  });
  fs.writeFileSync(file, src);
});
console.log('applied:', changed, miss.length ? ('\nMISS:\n' + miss.join('\n')) : '');
