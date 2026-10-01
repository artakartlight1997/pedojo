# PEファンド道場 v2 — 投資プロへの道

**素人を、PEファンドの投資プロフェッショナルに育てる。知識を増やすのではなく、仕事ができるようにする。**

一本の案件「信州精機」（事業承継×製造業）を、ソーシングからexitまで**自分の手で運ぶ**。
各工程で成果物を作り、プロの成果物と比べ、ルーブリックで自己採点し、判断ジャーナルに残す。
ブラウザだけで動く、ビルド不要の学習アプリ。設計思想は [`blueprint/`](blueprint/README.md) に全文がある。

---

## 使い方

```bash
# リポジトリを取得して index.html を開くだけ（file:// でも動く）
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
# ローカルサーバで動かす場合
python3 -m http.server 8000   # → http://localhost:8000
```

進捗・成果物・ジャーナルはブラウザ（localStorage＋IndexedDB）に保存される。進捗ページからJSONでバックアップ／復元できる。

---

## 道の構造 — 12章 × 3周

| | 内容 |
|---|---|
| **章（横）** | 投資プロセスの工程：第0章 入門 → 1 ソーシング → 2 スクリーニング → 3 一次入札 → 4 DD → 5 値付け・資金調達 → 6 最終入札・SPA → 7 クロージング → 8 100日 → 9 保有期間 → 10 exit → 11 事後検証 |
| **周（縦）** | 職位の視点：**1周目「作れる」**（アソシエイト：任された工程の成果物を型どおり・ミスなく・速く）→ **2周目「設計し回せる」**（VP：工程を設計し、専門家・相手方・部下を使って回す）→ **3周目「判断し責任を負う」**（ディレクター：買うか・いくらか・誰とやるか・いつ降りるか） |
| **各章の中身** | ① 工程講義（プロの手本を見る・固定7節）→ ② 演習セット（10問・80%合格・14の問題型）→ ③ ケース課題（成果物を作る→自己採点→プロの成果物と比べる→新情報で確信度を更新）→ ④ 判断ジャーナル |
| **背骨** | 通しケース「信州精機」：売上120億円・EBITDA15億円・72歳社長・後継者なし。IM・Q&A・DD報告・タームシート・SPA・月次レポート…を**実物として**読み、罠（補助金・押し込み・簿外の役員退職慰労・顧客契約の更改）を自分で見つける |
| **枝** | 8本の枝ケースで型を転用：A カーブアウト／B 非公開化（MBO）／C ターンアラウンド／D ロールアップ／E 破談／F セカンダリーバイアウト／G 共同投資／H 投資先の危機 |
| **測るもの** | 問題数ではなく、**成果物の合格バンド**（アナリスト／アソシエイト／VP）、**スキルマップ**（7領域×3周）、**校正ギャップ**（自己採点と模範の差）、紙計算の速度 |

完走の目安は約200時間（1周目約60時間・2周目約70時間・3周目約60時間）。週10時間で約5か月。

---

## 講義の型 — 「解説」ではなく「手本」

全工程講義は固定7節：**§1 この工程は何か／§2 成果物と評価基準／§3 プロの手本（実データ・思考の声・判断の分岐）／§4 型（手順・チェックリスト）／§5 落とし穴（症状→原因→見分け方→回避）／§6 その場の用語／§7 次にやること**。
モデルは「使える→分解できる→疑える→超えられる」の四段階で教える。モデルだけではだめ、を講義の構造そのもので示す。

## 問題の型 — 「正解を選ぶ」ではなく「判断を作る」

14の型：紙計算・リターン分解・基準率（校正）・確信度更新（専門家分布と比較）・優先順位の並べ替え（専門家の順序と理由）・順序・モデルの誤り発見・最初に確認する数字・ICの質問を書く・プレモーテム・メモの赤入れ・場面判断4択・用語確認4択・ケース設問。生成型は3バンドのルーブリックで自己採点する。
用語確認4択は全体の10%以下。4択の選択肢は「判断＋理由」で長さを揃え、正解が長さで分からないことを機械検査する（SOLV=0）。

---

## 画面

- **ホーム**：いま、ここ（道の次の一手）／修了・スキルセル・校正ギャップ・連続学習
- **道**：12章×3周の一覧。各章の講義・演習・課題の状態
- **章**：工程講義 → 演習セット（固定セット／混合ドリル／資料庫ドリル）→ ケース課題 → ジャーナル
- **ケース**：通しケース11章と枝ケース8本。状況の提示（資料タブ）→ 校正の記録 → 任務（成果物エディタ・下書き保存）→ 自己採点（ルーブリック）→ プロの成果物と思考過程 → 模範判定 → 新情報の投下 → 罠と答えのない論点 → 判断ジャーナル
- **スキルマップ**：7領域（数字／仮説・検証／資金と器／リスク配分と契約／人と現場／価値創造とexit／プロとして動く）×3周のセル達成状況
- **ジャーナル**：記録・校正ギャップの推移・自分の失敗チェックリスト・確信度の記録
- **復習箱**：間隔反復（1→3→7→21→60日）
- **用語集**：340語超。講義・問題・ケース本文中の用語はタップでその場解説
- **資料庫**：旧版（27トピック×4レベル・4,309問）の座学と問題。学習の本線ではなく索引。出題対象1,999問は各章の「資料庫ドリル」と混合出題の補充元として道に接続されている

---

## ディレクトリ構成

```
index.html
assets/
  md.js         軽量Markdown      loader.js    v1データ登録と読み込み    loader2.js  v2登録（lecture2/quiz2/caseChapter/caseAppend/rubric）
  store.js      進捗・SRS・v2記録  engine.js    v1出題エンジン             exercise.js v2演習エンジン（14型の採点・セッション・混合出題）
  ui.js         v1画面            ui2.js       v2画面（道・章・講義・演習・ケース・スキルマップ・ジャーナル）
  app.js        ルーティング      persist.js   多層保存                   style.css
data/
  curriculum.js  v1 TOPICS/LEVELS/STAGES ＋ v2 LAPS2/CHAPTERS/SKILLMAP/BRANCHES
  glossary.js    用語集
  rubrics.js     自己採点ルーブリック（3バンド）
  lectures2/     工程講義 chNN-lK.js（章×周）        lectures/  v1座学（資料庫）
  quiz2/         演習 chNN-lK.js, chNN-lK-b.js（章×周）  quiz/      v1問題（資料庫）
  cases/spine/   通しケース company.js, chNN.js（1周目）, chNN-l2.js, chNN-l3.js（追記）
  cases/         枝ケース branch-A.js … branch-H.js
  v1map.js       v1問題の章・周・型タグ（tools/migrate-v1.js が生成）
tools/
  lint2.js       v2品質ゲート（7節・タグ・SOLV・検算・ルーブリック・ケース完全性・言語混入）
  lint.js        v1品質ゲート    e2e.js  Playwright通し検証    progress2.js  測定値    migrate-v1.js  v1→v2タグ付け
blueprint/       設計文書（思想・診断・リサーチ・スキルマップ・カリキュラム・講義／問題／ケース設計・実装・ロードマップ）
```

---

## コンテンツの追加（規約）

### 工程講義
```js
DOJO.lecture2({ id: 'ch04-03', chapter: 'ch04', lap: 1, order: 3, minutes: 15, skills: ['A1', 'A2'],
  title: '財務DDの読み方 — QoE・ネットデット・運転資本',
  sections: { what: `…`, output: `…`, model: `…`, kata: `…`, pitfalls: `…`, terms: [{ term, en, def }], next: `…` } });
```
7節すべて必須（欠落は lint2 error）。本文（what+output+model+kata+pitfalls+next）は2,500〜4,000字。

### 演習（14型）
```js
DOJO.quiz2('ch04', 1, [
  { type: 11, skills: ['A1'], q: '【紙計算】…', answer: { value: 14.4, tol: 0.1, unit: '億円' }, exp: '検算：…' },
  { type: 13, skills: ['B1'], q: '…場面…。あなたの対応は？', choices: ['判断＋理由（正解を先頭）', '…', '…', '…'], a: 0, exp: '…' },
  { type: 2, skills: ['B1'], vignette: '…', hypothesis: '…', newFact: '…', expert: { '-2': 0, '-1': 2, '0': 3, '1': 9, '2': 1 }, exp: '…' },
  { type: 3, skills: ['B1'], q: '…順に並べよ', items: [...], expertOrder: [2, 0, 1, 3, 4], rationale: '…' },
  { type: 4, skills: ['A2'], q: '…おかしい行を選べ', model: [{ label, value, note }], bugs: [{ row: 4, fix: '…', why: '…' }], exp: '…' },
  { type: 6, skills: ['G1'], rubric: 'rub-ic-question', q: '…', material: '…', prompt: '…', exemplar: '…' }
]);
```
4択（13/14）は正解を先頭に `a: 0`。選択肢4つの長さは±10%以内（正解が長さで分かる問題は lint2 error）。計算（9/11）の解説には「検算」を含める。生成型（1/6/7/12）は `rubric` と `exemplar` が必須。

### ケース
```js
DOJO.caseChapter({ id: 'spine/ch04', chapter: 'ch04', title, subtitle, intro,
  situation: [{ type: 'FDD中間報告', title, body: `…` }], calibration: { ask: '…' },
  tasks: [{ id: 't1', lap: 1, role: 'アソシエイト', title, deliverable, minutes, skills, rubric: 'rub-dd-issues', lectures: ['ch04-01'],
            brief: `…`, template: `…`, pro: { text: `…`, thinking: `…` } }],
  newInfo: [{ fact, question, expert: -1, exp }], trap: ['…'], openIssue: ['…'] });
// 2周目・3周目は別ファイルから追記
DOJO.caseAppend({ id: 'spine/ch04', chapter: 'ch04', lap: 2, intro, situation: [...], tasks: [...], newInfo: [...], trap, openIssue });
```

### ルーブリック
```js
DOJO.rubric({ id: 'rub-xxx', name, pass: { associate: 60, vp: 80 },
  criteria: [{ name, pts, bands: { analyst: '…', associate: '…', vp: '…' } }], deductions: [{ cond, pts: -5 }] });
```

---

## 品質ゲート（コミットの測定値はこれで出す）

```bash
node tools/lint2.js      # v2: 7節／タグ／SOLV=0／検算／ルーブリック／ケース完全性／言語混入 → "lint2 clean"
node tools/lint.js       # v1資料庫 → "lint clean"
node tools/progress2.js  # 講義・演習・ケース・ルーブリック・型分布・配分達成度・章×周の完成度
python3 -m http.server 8765 &  NODE_PATH=$(npm root -g) node tools/e2e.js   # 全ルート＋14型の操作＋ケース操作 → "no js errors"
```

---

## 収録内容についての注記

- 日本のミドルマーケット・バイアウト（事業承継・カーブアウト・非公開化）の実務を主軸にしている。KKR／Blackstone／Carlyle等の型は世界標準の参照として配置した（`blueprint/02_リサーチ_必要スキル.md`）。
- 「信州精機」および枝ケースの会社・人物・数字はすべて架空である。
- 法令・税制・会計基準・市場慣行は変わる。実務では必ず最新の情報と専門家の確認を。本教材は学習用であり、法務・税務・会計・投資に関する助言ではない。
- 数値の目安（倍率・レバレッジ・手数料率等）は市況で変動する。水準そのものより、**それがどういう論理で決まるか**を身につけること。
