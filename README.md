# 投資プロ5000本ノック

エンジニアからPE(プライベートエクイティ)投資プロへ。ゼロ知識からディレクターレベルの知識まで、座学と5000本の四択クイズで身につける無料学習サイトです。

## 公開ページ (GitHub Pages)

このリポジトリの `main` ブランチのルートを GitHub Pages で公開すると閲覧できます。

- `index.html` — トップページ / 学習の進め方
- `study-beginner.html` — 座学：初級(PEの世界地図とLBOの基礎)
- `study-intermediate.html` — 座学：中級(DD・ストラクチャー・コベナンツ)
- `study-advanced.html` — 座学：上級(LBO応用・ウォーターフォール・Exit)
- `glossary.html` — 用語集(70語以上)
- `quiz.html` — 5000本ノック クイズ(用語・シナリオ問題 + 計算問題ジェネレーター)

## GitHub Pages の有効化方法

1. リポジトリの **Settings → Pages** を開く
2. **Source** を「Deploy from a branch」、ブランチを `main` / `/(root)` に設定して保存
3. 数分後に `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます

## 構成

- 静的HTML/CSS/JavaScriptのみで構築(ビルド不要)
- クイズの進捗はブラウザの `localStorage` にのみ保存され、外部には送信されません
- `js/calc-generators.js` がLBO・財務計算問題をパラメータ自動生成し、`js/terms-data.js` の手書き用語・シナリオ問題と組み合わせて出題します
- `js/journey.js` が座学ページを「ステップ学習」モードに変換します:短い記事を1本ずつ読み進め、モジュールを読み終えるとその場で確認クイズが始まり、完了するとジャーニーマップにチェックが付きます(従来どおりの「一気読み」にも切替可能)。インラインクイズの回答も通算5000本ノックに加算されます
