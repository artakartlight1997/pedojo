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
  - `m9-`:座学初級の実務ノック3本立て(study-beginner.html内)
    - `m9-001`〜`m9-040`:税務実務(モジュール7 `module-tax-practice`)
    - `m9-041`〜`m9-080`:レンダー実務(モジュール8 `module-lender-comms`)
    - `m9-081`〜`m9-120`:ICメモ作成実務(モジュール9 `module-ic-memo`)
  - `m10-`:座学中級の実務ノック2本立て(study-intermediate.html内)
    - `m10-001`〜`m10-040`:案件execution実務(モジュール8 `module-deal-execution`)
    - `m10-041`〜`m10-080`:交渉・ステークホルダー実務(モジュール9 `module-negotiation`)
  - `m11-`:応用的な投資判断と思考法――ディレクターの視座(study-advanced.html内 `module-applied-judgment`、モジュール8)
  - `m12-`:PMI(買収後統合)と最初の100日プラン(study-modules.html内 `module-pmi-100day`)
  - `m13-`:ポートフォリオ・モニタリングと取締役会運営(study-modules.html内 `module-portfolio-monitoring`)
  - `m14-`:財務モデルを自分で組む(study-intermediate.html内 `module-modeling-practice`、モジュール10)
  - `m15-`:契約実務の深掘り(study-intermediate.html内 `module-legal-contract`、モジュール11)
  - `m16-`:事業承継・オーナー系企業の案件実務(study-beginner.html内 `module-succession-sme`、モジュール10)
  - `m17-`:セクター別の見方(study-modules.html内 `module-sector-lens`)
  - `m18-`:バリュエーション実務(study-beginner.html内 `module-valuation-practice`、モジュール11)
  - `m19-`:ファンド運営とLP対応の実務(study-advanced.html内 `module-lp-fund-ops`、モジュール9)
  - `m20-`:事業再生・ターンアラウンド案件の実務(study-modules.html内 `module-turnaround`)
  - `m21-`:投資形態のバリエーション(study-advanced.html内 `module-deal-types`、モジュール10)
  - `e01-`〜:座学の各記事に紐づけて出題数を拡張するためのバッチ用プレフィックス。1バッチ=1つの出典モジュール群。
  - `m22-`〜:今後の追加モジュール用。新しいモジュールを追加するときは空き番号を使う。
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
