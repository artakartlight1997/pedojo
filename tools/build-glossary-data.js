#!/usr/bin/env node
// glossary.html の用語カードから js/glossary-data.js を生成する。
// 座学ページの js/term-notes.js が、このデータを使って
// 「記事に出てきた用語の解説」を各記事の下に自動表示する。
//
// 使い方: node tools/build-glossary-data.js
// glossary.html に用語を追加・修正したら再実行してコミットすること。

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "glossary.html");
const OUT = path.join(ROOT, "js", "glossary-data.js");

// 用語集の正式名称と座学本文中の表記が違うものを手で補う
const EXTRA_ALIASES = {
  "term-vintage-year": ["ビンテージイヤー", "ビンテージ"],
  "term-mezzanine": ["メザニン"],
  "term-high-yield": ["ハイイールド債", "ハイイールド"],
  "term-dd": ["デューデリ"],
  "term-working-capital": ["ワーキングキャピタル", "運転資本"],
  "term-reps-warranties": ["レプワラ"],
};

// 短すぎて誤検出しやすい別名は除外する(全角3文字未満・半角2文字未満)
const MIN_JP = 3;
const MIN_ASCII = 2;

function stripTags(s) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// 名称を strong(全体名・括弧の中外)と weak(スラッシュ分割の断片)に分ける。
// weak な別名は、他の用語の strong な別名と衝突した場合に後処理で捨てる
// (例: 「EV/EBITDA倍率」を割った「EV」は用語「EV」のものなので捨てる)。
function splitName(name) {
  const strong = new Set();
  const weak = new Set();
  strong.add(name);
  const parenParts = [];
  const outside = name.replace(/[(（]([^)）]*)[)）]/g, (m, inner) => {
    parenParts.push(inner);
    return " ";
  });
  outside
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => strong.add(s));
  parenParts.forEach((p) =>
    p
      .split(/[/／・]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => strong.add(s))
  );
  Array.from(strong).forEach((a) => {
    if (a.includes("/")) {
      a.split("/")
        .map((s) => s.trim())
        .filter((s) => s && !/[()（）]/.test(s))
        .forEach((s) => {
          if (!strong.has(s)) weak.add(s);
        });
    }
  });
  return { strong: Array.from(strong), weak: Array.from(weak) };
}

function isAscii(s) {
  return /^[\x20-\x7e]+$/.test(s);
}

function goodAlias(a) {
  if (!a) return false;
  if (/[()（）]/.test(a)) return false; // 括弧入りは本文に現れない
  if (isAscii(a)) return a.length >= MIN_ASCII;
  return a.length >= MIN_JP;
}

const html = fs.readFileSync(SRC, "utf8");
const cardRe = /<div class="glossary-card" id="(term-[^"]+)">([\s\S]*?)<\/div>/g;
const raw = [];
let m;
while ((m = cardRe.exec(html))) {
  const id = m[1];
  const body = m[2];
  const h3m = body.match(/<h3>([\s\S]*?)<\/h3>/);
  if (!h3m) continue;
  let h3 = h3m[1];
  let en = "";
  h3 = h3.replace(/<span class="term-en">\s*[(（]?([\s\S]*?)[)）]?\s*<\/span>/, (mm, inner) => {
    en = stripTags(inner).replace(/^[(（]|[)）]$/g, "");
    return "";
  });
  const name = stripTags(h3);
  const defm = body.match(/<p class="term-def">([\s\S]*?)<\/p>/);
  const def = defm ? stripTags(defm[1]) : "";

  const parts = splitName(name);
  const strong = new Set(parts.strong);
  const weak = new Set(parts.weak);
  if (en) {
    en.split(/ \/ /)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => strong.add(s));
  }
  (EXTRA_ALIASES[id] || []).forEach((a) => strong.add(a));
  raw.push({ id, name, def, strong, weak });
}

if (!raw.length) {
  console.error("用語カードが1件も見つかりませんでした。glossary.html の構造を確認してください。");
  process.exit(1);
}

// 他の用語の strong 別名と衝突する weak 別名を捨てる
const strongOwner = new Map();
raw.forEach((t) => t.strong.forEach((a) => strongOwner.set(a, t.id)));
const terms = raw.map((t) => {
  const aliases = new Set(Array.from(t.strong).filter(goodAlias));
  t.weak.forEach((a) => {
    if (!goodAlias(a)) return;
    const owner = strongOwner.get(a);
    if (owner && owner !== t.id) return;
    aliases.add(a);
  });
  // 長い別名から先に照合できるよう降順に並べる
  return { id: t.id, name: t.name, def: t.def, aliases: Array.from(aliases).sort((a, b) => b.length - a.length) };
});

const header =
  "// このファイルは自動生成です。編集しないでください。\n" +
  "// 生成元: glossary.html / 生成コマンド: node tools/build-glossary-data.js\n";
const js = header + "window.GLOSSARY_TERMS = " + JSON.stringify(terms, null, 1) + ";\n";
fs.writeFileSync(OUT, js);
console.log("js/glossary-data.js を生成しました:", terms.length, "語");
