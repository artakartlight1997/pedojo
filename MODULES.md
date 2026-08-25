# モジュール構成ガイド

このサイトはすべて静的HTML/CSS/JSで構成されており、**座学コンテンツも、クイズ問題も、あとから機械的に追記できるモジュール単位**で作られています。新しいトピックを追加したくなったら、このドキュメントの手順に従ってください。

## 1. 座学モジュール(HTML)

### 単位
座学の1モジュール = 1つの `<section class="study-section" id="module-xxx">...</section>` ブロック。

```html
<section class="study-section" id="module-xxx">
  <h2>モジュールタイトル</h2>
  <p class="module-intro">導入文</p>
  <article class="lesson">
    <h3>サブトピック見出し</h3>
    <p>本文。専門用語は初出時に <strong>太字</strong> にし、直後にかみ砕いた説明を入れる。</p>
    <div class="callout callout-metaphor"><strong>たとえるなら:</strong> 比喩</div>
    <div class="callout callout-pitfall"><strong>落とし穴:</strong> 誤解・ミス</div>
    <div class="example"><strong>具体例:</strong> 数値を使った具体的なワークアウト</div>
  </article>
  <!-- article を複数繰り返してよい -->
</section>
```

### 置き場所
- `study-beginner.html` / `study-intermediate.html` / `study-advanced.html`:各レベルの座学。`<!-- STUDY_CONTENT_XXX_START -->` と `<!-- STUDY_CONTENT_XXX_END -->` の間に上記の `<section>` を追記する。
- `study-modules.html`:レベル分けしにくい専門テーマ(会計基礎、バリュエーション指標、DD実践編、投資テーマ策定、IC実践、ファンドレイズ、ケーススタディ等)を追加する場所。`<!-- STUDY_CONTENT_MODULES_START -->` と `<!-- STUDY_CONTENT_MODULES_END -->` の間に追記する。**今後の追加モジュールは基本的にこのページに追記していく。**

目次(左サイドバー)は `js/toc.js` が `.study-main .study-section` を自動でスキャンして生成するため、`id` さえユニークにしておけば手動でのTOC更新は不要。

## 2. クイズ問題モジュール(JSON)

クイズ問題バンクは `js/terms-data.js` の `TERM_QUESTIONS` 配列1本にすべて格納されている。1問 = 1オブジェクト:

```json
{
  "id": "m7-001",
  "level": "初級 | 中級 | 上級",
  "category": "カテゴリ名(座学モジュールのサブトピック名と合わせる)",
  "question": "問題文",
  "choices": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answerIndex": 0,
  "explain": "解説文"
}
```

- `id` は他と衝突しないプレフィックスを割り振ること。既存プレフィックス一覧:
  - `b-`:初級座学(beginner)
  - `i-`:中級座学(intermediate)
  - `a-`:上級座学(advanced)
  - `g-`:用語集(glossary)
  - `m1-`:会計・資産の超基礎(module-accounting-basics)
  - `m2-`:上場指標(PER/PBR/ROICなど、module-valuation-ratios)
  - `m3-`:デューデリジェンス実践編(module-dd-deep-dive)
  - `m4-`:投資テーマ策定・投資委員会実践(module-thesis-ic)
  - `m5-`:ファンドレイズ実務(module-fundraising)
  - `m6-`:成功・失敗ケーススタディ(module-case-studies)
  - `m7-`:営業ノック(相対ソーシング実践、module-sales-intro/negotiation/psychology/process)
  - `m8-`:座学初級モジュール6の投資プロセス深掘り(ソーシング〜Exitの全フェーズ、study-beginner.html内)
  - `m9-`〜:今後の追加モジュール用。新しいモジュールを追加するときは次の空き番号(`m9-`, `m10-`…)を使う。
- 新しいプレフィックスを使ったら、追記するだけでよい。`js/quiz-engine.js` は配列全体を毎回読み込み、`level`/`category` を自動収集してフィルタUIを作るため、コード変更は不要。

## 3. 計算問題ジェネレーター

`js/calc-generators.js` の `GENERATORS` 配列に、`{ key, category, level, combos, build() }` の形でジェネレーターを追加すると、パラメータ自動生成の計算問題を増やせる。`build()` は `{ question, choices, answerIndex, explain }` を返す関数。既存の10種類のジェネレーター(EV算出、EV/EBITDA倍率、レバレッジ倍率、D/Eレシオ、MOIC/IRR、Sources & Uses、ICR、のれん、ウォーターフォール/キャリー、運転資本、タックスシールド)を参考にすること。

## 4. 追加の流れ(チェックリスト)

1. 追加したいテーマを決める(例:「メザニン投資家の視点」「クロスボーダーPMI」など)
2. 座学HTML断片を書き、`study-modules.html` の `<!-- STUDY_CONTENT_MODULES_START -->` 直後(または末尾)に追記
3. 対応するクイズ問題を `js/terms-data.js` の `TERM_QUESTIONS` 配列末尾に追記(新しいidプレフィックスを割り当てる)
4. `study-modules.html` のナビ導線(トップページの `path-grid` など)から辿れるか確認
5. 必要であれば `js/calc-generators.js` に計算問題ジェネレーターを追加

このように、新しいトピックはページ全体を作り直さずに「1モジュール分のHTML追記」と「JSON配列への追記」だけで拡張できる。

## 5. 座学初級モジュール6(投資プロセス全体像)の連番ルール

`study-beginner.html` の「モジュール6:投資プロセス全体像(ソーシングからExitまで)」は、`<h3>6-1.</h3>` 〜 `<h3>6-34.</h3>` という連番の`<article>`でソーシングからExitまでの全フェーズを深掘りしている。このモジュールに新しいフェーズや記事を追記する場合:

1. 挿入したい位置の前後の番号を確認し、以降のすべての `<h3>6-N.</h3>` を1つずつ繰り下げる(番号の欠番・重複はTOC自動生成やユーザーの理解を損なうため厳禁)。
2. 本文中に他のフェーズを指す `6-N` という相互参照(例:「6-14で学んだDD」)がある場合、繰り下げに合わせて参照先の番号も必ず更新する。
3. 末尾に追記するだけなら(例:6-35を追加)、番号の繰り下げは不要。
