/* ===== md.js — 軽量 Markdown レンダラ（座学・解説用） ===== */
(function (g) {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // インライン記法: `code`  **bold**  *em*  [text](url)  ==highlight==  {{kw}}
  function inline(s) {
    var out = esc(s);
    out = out.replace(/`([^`]+)`/g, function (_, c) { return '<code>' + c + '</code>'; });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    out = out.replace(/==([^=]+)==/g, '<span class="hl">$1</span>');
    out = out.replace(/\{\{([^}]+)\}\}/g, '<span class="kw">$1</span>');
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return out;
  }

  function slug(s) {
    return String(s).trim().replace(/[\s　]+/g, '-').replace(/[^\wぁ-んァ-ヶ一-龠ー\-]/g, '').slice(0, 60);
  }

  function render(src) {
    if (!src) return '';
    var lines = String(src).replace(/\r\n?/g, '\n').split('\n');
    var html = [], i = 0;

    function flushList(tag, items) {
      html.push('<' + tag + '>' + items.map(function (x) { return '<li>' + inline(x) + '</li>'; }).join('') + '</' + tag + '>');
    }

    while (i < lines.length) {
      var ln = lines[i];

      // fenced code
      if (/^```/.test(ln)) {
        var buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        html.push('<pre><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }
      // callout  :::type タイトル ... :::
      if (/^:::/.test(ln)) {
        var m0 = ln.match(/^:::(field|warn)?\s*(.*)$/);
        var cls = (m0 && m0[1]) ? ' ' + m0[1] : '';
        var title = (m0 && m0[2].trim()) || 'POINT';
        var cbuf = []; i++;
        while (i < lines.length && !/^:::\s*$/.test(lines[i])) { cbuf.push(lines[i]); i++; }
        i++;
        html.push('<div class="callout' + cls + '"><div class="ct">' + inline(title) + '</div>' + render(cbuf.join('\n')) + '</div>');
        continue;
      }
      // table
      if (/\|/.test(ln) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
        var head = ln.split('|').map(function (s) { return s.trim(); });
        if (head[0] === '') head.shift();
        if (head[head.length - 1] === '') head.pop();
        i += 2;
        var rows = [];
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== '') {
          var cells = lines[i].split('|').map(function (s) { return s.trim(); });
          if (cells[0] === '') cells.shift();
          if (cells[cells.length - 1] === '') cells.pop();
          rows.push(cells); i++;
        }
        html.push('<table><thead><tr>' + head.map(function (h) { return '<th>' + inline(h) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows.map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + inline(c) + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table>');
        continue;
      }
      // heading
      var mh = ln.match(/^(#{1,5})\s+(.*)$/);
      if (mh) {
        var lv = mh[1].length, txt = mh[2].trim();
        html.push('<h' + lv + ' id="h-' + slug(txt) + '">' + inline(txt) + '</h' + lv + '>');
        i++; continue;
      }
      // blockquote
      if (/^>\s?/.test(ln)) {
        var qb = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { qb.push(lines[i].replace(/^>\s?/, '')); i++; }
        html.push('<blockquote>' + render(qb.join('\n')) + '</blockquote>');
        continue;
      }
      // unordered list
      if (/^\s*[-*+]\s+/.test(ln)) {
        var ul = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { ul.push(lines[i].replace(/^\s*[-*+]\s+/, '')); i++; }
        flushList('ul', ul); continue;
      }
      // ordered list
      if (/^\s*\d+[.)]\s+/.test(ln)) {
        var ol = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { ol.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
        flushList('ol', ol); continue;
      }
      // hr
      if (/^---+\s*$/.test(ln)) { html.push('<hr>'); i++; continue; }
      // blank
      if (ln.trim() === '') { i++; continue; }
      // paragraph
      var pb = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,5}\s|>\s?|\s*[-*+]\s|\s*\d+[.)]\s|```|:::|---+\s*$)/.test(lines[i])) {
        pb.push(lines[i]); i++;
      }
      if (pb.length) html.push('<p>' + inline(pb.join('\n')).replace(/\n/g, '<br>') + '</p>');
    }
    return html.join('\n');
  }

  // 見出し抽出（目次用）
  function outline(src) {
    var res = [];
    String(src || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (ln) {
      var m = ln.match(/^(#{2,3})\s+(.*)$/);
      if (m) res.push({ lv: m[1].length, text: m[2].trim(), id: 'h-' + slug(m[2].trim()) });
    });
    return res;
  }

  g.MD = { render: render, inline: inline, outline: outline, esc: esc, slug: slug };
})(window);
