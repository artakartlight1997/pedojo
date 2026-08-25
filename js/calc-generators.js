/*
 * 投資プロ5000本ノック — 計算問題ジェネレーター
 * ------------------------------------------------------------
 * LBO・企業価値評価・財務分析の「計算問題」をパラメータをランダムに
 * 変えながら無限に近い組み合わせで出題するためのモジュール。
 * 手書きの用語問題(terms-data.js)と組み合わせて 5000本ノック の
 * 出題プールを構成する。
 *
 * 各ジェネレーターは generate() を呼ぶたびに
 *   { category, question, choices: string[4], answerIndex, explain, level, id }
 * を返す。数値は 億円 を基本単位とする(PEディールの規模感に合わせる)。
 */

(function (global) {
  "use strict";

  // ---------- ユーティリティ ----------

  function randInt(min, max, step) {
    step = step || 1;
    const n = Math.floor(Math.random() * ((max - min) / step + 1));
    return min + n * step;
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function fmt(n, digits) {
    if (digits === undefined) digits = 0;
    const rounded = Number(n.toFixed(digits));
    return rounded.toLocaleString("ja-JP", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function shuffleWithAnswer(correctText, distractorTexts) {
    const choices = [correctText].concat(distractorTexts);
    // Fisher-Yates
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return { choices, answerIndex: choices.indexOf(correctText) };
  }

  // 数値の一意な distractor 集合を作る(correct と重複しないように)
  // validate: 生成した数値を採用してよいかの述語(例: 正の値のみ許可)。省略時は有限数であればOK。
  function uniqueDistractors(correct, candidates, count, digits, validate) {
    const isValid = validate || ((x) => true);
    const seen = new Set([fmt(correct, digits)]);
    const out = [];
    for (const c of candidates) {
      const label = fmt(c, digits);
      if (!seen.has(label) && isFinite(c) && isValid(c)) {
        seen.add(label);
        out.push(c);
      }
      if (out.length >= count) break;
    }
    // 足りなければ、表示上の最小刻み幅(unit)を徐々に広げながら埋める。
    // k を増やし続けることで、値の大小や digits の桁数によらず必ず一意な値に収束する。
    const unit = Math.pow(10, -digits);
    let k = 1;
    let guard = 0;
    while (out.length < count && guard < 500) {
      guard++;
      const sign = guard % 2 === 0 ? 1 : -1;
      const magnitude = unit * k * (1 + Math.random());
      const cand = correct + sign * magnitude;
      const label = fmt(cand, digits);
      if (!seen.has(label) && isFinite(cand) && isValid(cand)) {
        seen.add(label);
        out.push(cand);
      }
      if (guard % 2 === 0) k++;
    }
    return out;
  }

  // ---------- ジェネレーター定義 ----------
  // 各エントリ: { key, category, level, combos(概算組み合わせ数), build() }

  const GENERATORS = [];

  // 1. EV(エンタープライズバリュー)算出
  GENERATORS.push({
    key: "ev-calc",
    category: "企業価値評価",
    level: "初級",
    combos: 40 * 30 * 20,
    build() {
      const mcap = randInt(100, 4000, 100); // 時価総額(億円)
      const debt = randInt(0, 2000, 50); // 有利子負債(億円)
      const cash = randInt(0, Math.min(800, mcap + debt - 50), 20); // 現金及び現金同等物(億円、EVが極端な値にならないよう上限を調整)
      const ev = mcap + debt - cash;
      const mistakeNoCash = mcap + debt; // 現金を引き忘れ
      const mistakeMinus = mcap - debt + cash; // 符号を逆にした
      const distractors = uniqueDistractors(ev, [mistakeNoCash, mistakeMinus, ev * 1.15], 3, 0, (x) => x > 0);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(ev)}億円`,
        distractors.map((d) => `${fmt(d)}億円`)
      );
      return {
        question: `時価総額 ${fmt(mcap)}億円、有利子負債 ${fmt(debt)}億円、現金及び現金同等物 ${fmt(
          cash
        )}億円の会社があります。この会社のEV(エンタープライズバリュー、事業価値)はいくらですか?`,
        choices,
        answerIndex,
        explain: `EV = 時価総額 + 有利子負債 − 現金 = ${fmt(mcap)} + ${fmt(debt)} − ${fmt(cash)} = ${fmt(
          ev
        )}億円。EVは「買収する側が実質的に負担する会社全体の値段」で、株主から株を買う代金(時価総額)に加えて、引き継ぐ借金を足し、逆に会社に残っている現金は差し引いて考えます(現金は買収後すぐ借金返済に回せるため)。現金を引き忘れる、符号を逆にする、はよくある間違いです。`,
      };
    },
  });

  // 2. EV/EBITDA倍率
  GENERATORS.push({
    key: "ev-ebitda-multiple",
    category: "企業価値評価",
    level: "初級",
    combos: 40 * 30,
    build() {
      const ev = randInt(500, 8000, 50);
      const ebitda = randInt(50, 800, 10);
      const multiple = ev / ebitda;
      const mistakeInverse = ebitda / ev;
      const distractors = uniqueDistractors(
        multiple,
        [mistakeInverse, multiple * 1.3, multiple * 0.7],
        3,
        1
      );
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(multiple, 1)}倍`,
        distractors.map((d) => `${fmt(d, 1)}倍`)
      );
      return {
        question: `EVが ${fmt(ev)}億円、EBITDAが ${fmt(
          ebitda
        )}億円の会社の EV/EBITDA倍率(EBITDAマルチプル)はいくつですか?(小数点第1位まで)`,
        choices,
        answerIndex,
        explain: `EV/EBITDA倍率 = EV ÷ EBITDA = ${fmt(ev)} ÷ ${fmt(ebitda)} ≈ ${fmt(
          multiple,
          1
        )}倍。「その会社が生み出す年間キャッシュ創出力(EBITDA)の何年分の値段が付いているか」を表す最も基本的なバリュエーション指標です。分母と分子を逆にしてしまう間違いに注意してください。`,
      };
    },
  });

  // 3. ネットデット/EBITDA(レバレッジ倍率)
  GENERATORS.push({
    key: "leverage-multiple",
    category: "LBO・財務分析",
    level: "初級",
    combos: 40 * 20 * 30,
    build() {
      const debt = randInt(200, 3000, 50);
      const cash = randInt(0, 500, 10);
      const ebitda = randInt(30, 500, 10);
      const netDebt = debt - cash;
      const lev = netDebt / ebitda;
      const mistakeGross = debt / ebitda; // 現金を控除しない
      const distractors = uniqueDistractors(lev, [mistakeGross, lev * 1.25, lev * 0.75], 3, 1);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(lev, 1)}倍`,
        distractors.map((d) => `${fmt(d, 1)}倍`)
      );
      return {
        question: `有利子負債 ${fmt(debt)}億円、現金 ${fmt(cash)}億円、EBITDA ${fmt(
          ebitda
        )}億円の会社のネットデット/EBITDA倍率(レバレッジ倍率)はいくつですか?(小数点第1位まで)`,
        choices,
        answerIndex,
        explain: `ネットデット = 有利子負債 − 現金 = ${fmt(debt)} − ${fmt(cash)} = ${fmt(
          netDebt
        )}億円。レバレッジ倍率 = ネットデット ÷ EBITDA = ${fmt(netDebt)} ÷ ${fmt(ebitda)} ≈ ${fmt(
          lev,
          1
        )}倍。「今のキャッシュ創出力で借金を何年で返せる規模か」を示す、レンダー(貸し手)やコベナンツ設計で最重要視される指標の一つです。`,
      };
    },
  });

  // 4. デットエクイティレシオ
  GENERATORS.push({
    key: "debt-equity-ratio",
    category: "LBO・財務分析",
    level: "初級",
    combos: 30 * 30,
    build() {
      const debt = randInt(200, 3000, 50);
      const equity = randInt(200, 3000, 50);
      const ratio = debt / equity;
      const mistakeInverse = equity / debt;
      const distractors = uniqueDistractors(ratio, [mistakeInverse, ratio * 1.3, ratio * 0.7], 3, 2);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(ratio, 2)}倍`,
        distractors.map((d) => `${fmt(d, 2)}倍`)
      );
      return {
        question: `LBOのSources(資金調達)が 借入 ${fmt(debt)}億円、エクイティ(株主資本) ${fmt(
          equity
        )}億円で構成されるとき、デットエクイティレシオ(D/E比率)はいくつですか?(小数点第2位まで)`,
        choices,
        answerIndex,
        explain: `D/E比率 = 借入 ÷ エクイティ = ${fmt(debt)} ÷ ${fmt(equity)} ≈ ${fmt(
          ratio,
          2
        )}倍。この比率が高いほど「他人のお金(借金)」で買収を賄っている割合が高く、少ない自己資金でリターンを増幅できる一方、返済負担も重くなります。`,
      };
    },
  });

  // 5. MOIC / 簡易IRR
  GENERATORS.push({
    key: "moic-irr",
    category: "LBO・リターン計算",
    level: "中級",
    combos: 40 * 40 * 10,
    build() {
      const invest = randInt(50, 1000, 10);
      const years = randInt(3, 7, 1);
      const moicRaw = 1.4 + Math.random() * 2.6; // 1.4x - 4.0x
      const exitValue = Math.round(invest * moicRaw);
      const moic = exitValue / invest;
      const irr = Math.pow(moic, 1 / years) - 1;
      const irrPct = irr * 100;
      const mistakeLinear = ((moic - 1) / years) * 100; // 単純に年数で割った誤り
      const distractors = uniqueDistractors(
        irrPct,
        [mistakeLinear, irrPct + 6, irrPct - 5],
        3,
        1,
        (x) => x > -50
      );
      const { choices, answerIndex } = shuffleWithAnswer(
        `約${fmt(irrPct, 1)}%`,
        distractors.map((d) => `約${fmt(d, 1)}%`)
      );
      return {
        question: `投資額 ${fmt(invest)}億円のエクイティが、${years}年後のExitで ${fmt(
          exitValue
        )}億円になりました。MOIC(投資倍率)は ${fmt(
          moic,
          2
        )}倍です。このときの概算IRR(内部収益率)に最も近いものはどれですか?`,
        choices,
        answerIndex,
        explain: `概算IRR ≈ MOIC^(1/保有年数) − 1 = ${fmt(moic, 2)}^(1/${years}) − 1 ≈ ${fmt(
          irrPct,
          1
        )}%。MOICは「何倍になったか」というリターンの大きさ、IRRは「年率換算でどれくらいのスピードで増えたか」という時間軸を加味した指標です。単純に (MOIC−1)÷年数 で計算するのはよくある間違いで、複利の効果を無視してしまいます。`,
      };
    },
  });

  // 6. Sources & Uses(必要エクイティの算出)
  GENERATORS.push({
    key: "sources-uses",
    category: "LBO・ストラクチャー",
    level: "中級",
    combos: 40 * 20 * 10,
    build() {
      const purchasePrice = randInt(500, 5000, 50);
      const fees = randInt(10, 150, 10);
      const debt = randInt(200, purchasePrice, 50);
      const totalUses = purchasePrice + fees;
      const requiredEquity = totalUses - debt;
      const mistakeNoFees = purchasePrice - debt; // フィーを考慮しない
      const distractors = uniqueDistractors(
        requiredEquity,
        [mistakeNoFees, requiredEquity * 1.2, requiredEquity * 0.8],
        3,
        0,
        (x) => x > 0
      );
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(requiredEquity)}億円`,
        distractors.map((d) => `${fmt(d)}億円`)
      );
      return {
        question: `買収価格(Purchase Price)${fmt(
          purchasePrice
        )}億円、アドバイザリー等の諸費用(Fees)${fmt(fees)}億円のLBO案件で、借入(Debt)を ${fmt(
          debt
        )}億円調達する場合、必要なエクイティ(Sources & Usesが均衡するための株主資本)はいくらですか?`,
        choices,
        answerIndex,
        explain: `Uses(資金使途)= 買収価格 + 諸費用 = ${fmt(purchasePrice)} + ${fmt(
          fees
        )} = ${fmt(totalUses)}億円。Sources(資金調達)は Debt + Equity で Uses と必ず一致する必要があるため、Equity = ${fmt(
          totalUses
        )} − ${fmt(debt)} = ${fmt(
          requiredEquity
        )}億円。フィーを Uses に含め忘れると、必要エクイティを過小評価してしまう典型的なミスです。`,
      };
    },
  });

  // 7. インタレストカバレッジレシオ(ICR)
  GENERATORS.push({
    key: "icr",
    category: "コベナンツ・与信分析",
    level: "中級",
    combos: 40 * 30,
    build() {
      const ebitda = randInt(50, 800, 10);
      const interest = randInt(10, 200, 5);
      const icr = ebitda / interest;
      const mistakeInverse = interest / ebitda;
      const distractors = uniqueDistractors(icr, [mistakeInverse, icr * 1.3, icr * 0.7], 3, 1);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(icr, 1)}倍`,
        distractors.map((d) => `${fmt(d, 1)}倍`)
      );
      return {
        question: `EBITDA ${fmt(ebitda)}億円、年間支払利息 ${fmt(
          interest
        )}億円の会社のインタレストカバレッジレシオ(ICR)はいくつですか?(小数点第1位まで)`,
        choices,
        answerIndex,
        explain: `ICR = EBITDA ÷ 支払利息 = ${fmt(ebitda)} ÷ ${fmt(interest)} ≈ ${fmt(
          icr,
          1
        )}倍。「稼ぐ力(EBITDA)で利息の何倍を賄えるか」を示す指標で、レンダーがコベナンツとして最低ラインを設定することが多い指標です。数値が低いほど利払い負担が重く、コベナンツ抵触リスクが高まります。`,
      };
    },
  });

  // 8. のれん(Goodwill)計算
  GENERATORS.push({
    key: "goodwill",
    category: "財務3表・会計",
    level: "初級",
    combos: 40 * 30,
    build() {
      const price = randInt(300, 5000, 50);
      const netAssets = randInt(50, price - 10, 10);
      const goodwill = price - netAssets;
      const mistakeSum = price + netAssets;
      const distractors = uniqueDistractors(
        goodwill,
        [mistakeSum, goodwill * 1.3, goodwill * 0.7],
        3,
        0,
        (x) => x > 0
      );
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(goodwill)}億円`,
        distractors.map((d) => `${fmt(d)}億円`)
      );
      return {
        question: `買収価格 ${fmt(price)}億円で、対象会社の時価純資産が ${fmt(
          netAssets
        )}億円のとき、この買収で計上される「のれん(Goodwill)」はいくらですか?`,
        choices,
        answerIndex,
        explain: `のれん = 買収価格 − 時価純資産 = ${fmt(price)} − ${fmt(netAssets)} = ${fmt(
          goodwill
        )}億円。のれんは「純資産という帳簿上の価値を超えて支払った、ブランド力や技術力・将来の収益力への対価」と考えるとイメージしやすいです。買収後は定期的な減損テストの対象になります。`,
      };
    },
  });

  // 9. ウォーターフォール/キャリー計算
  GENERATORS.push({
    key: "waterfall-carry",
    category: "ファンド経済性・キャリー",
    level: "上級",
    combos: 30 * 30 * 3,
    build() {
      const invested = randInt(200, 2000, 50);
      const profit = randInt(100, 3000, 50);
      const hurdleRate = pick([6, 7, 8]);
      const carryRate = 0.2;
      const hurdleAmount = Math.round(invested * (hurdleRate / 100));
      let lpTake, gpCarry;
      if (profit <= hurdleAmount) {
        lpTake = profit;
        gpCarry = 0;
      } else {
        const excess = profit - hurdleAmount;
        gpCarry = Math.round(excess * carryRate);
        lpTake = profit - gpCarry;
      }
      const mistakeFlat = Math.round(profit * carryRate); // ハードルを無視して単純に20%
      const distractors = uniqueDistractors(gpCarry, [mistakeFlat, gpCarry + 20, Math.max(0, gpCarry - 15)], 3, 0);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(gpCarry)}億円`,
        distractors.map((d) => `${fmt(d)}億円`)
      );
      return {
        question: `LP出資額 ${fmt(invested)}億円、投資全体の利益(Profit)が ${fmt(
          profit
        )}億円、ハードルレート(優先分配率)年${hurdleRate}%相当額を ${fmt(
          hurdleAmount
        )}億円、キャリー(成功報酬)率20%(簡易・キャッチアップ無視)とするとき、GPが受け取るキャリード・インタレストはおよそいくらですか?`,
        choices,
        answerIndex,
        explain: `まずLPにハードルレート分 ${fmt(
          hurdleAmount
        )}億円を優先分配し、それを超えた超過利益 ${fmt(profit)} − ${fmt(hurdleAmount)} = ${fmt(
          profit - hurdleAmount > 0 ? profit - hurdleAmount : 0
        )}億円についてのみ、GPがキャリー率20%を受け取ります。GP取り分 ≈ ${fmt(
          gpCarry
        )}億円。利益全体にいきなり20%を掛けてしまうのはハードルレートの存在を無視した典型的な間違いです(実務ではさらにキャッチアップ条項が絡み、より複雑になります)。`,
      };
    },
  });

  // 10. 運転資本増減とキャッシュフローへの影響
  GENERATORS.push({
    key: "working-capital",
    category: "財務3表・会計",
    level: "中級",
    combos: 40 * 40,
    build() {
      const beginWC = randInt(50, 800, 10);
      const endWC = randInt(50, 800, 10);
      const delta = endWC - beginWC;
      const cfImpact = -delta; // 増加はキャッシュのマイナス
      const mistakeSameSign = delta; // 符号を逆にする間違い
      const distractors = uniqueDistractors(cfImpact, [mistakeSameSign, cfImpact + 30, cfImpact - 25], 3, 0);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${cfImpact >= 0 ? "+" : ""}${fmt(cfImpact)}億円`,
        distractors.map((d) => `${d >= 0 ? "+" : ""}${fmt(d)}億円`)
      );
      return {
        question: `正味運転資本(ネットワーキングキャピタル)が期首 ${fmt(beginWC)}億円から期末 ${fmt(
          endWC
        )}億円へ変化しました。この変化がキャッシュフロー計算書に与える影響として正しいものはどれですか?(符号付きで)`,
        choices,
        answerIndex,
        explain: `運転資本が増加すると、その分だけ在庫や売掛金などに現金が「寝てしまう」ため、キャッシュフローにはマイナスの影響を与えます。CFへの影響 = −(期末WC − 期首WC) = −(${fmt(
          endWC
        )} − ${fmt(beginWC)}) = ${cfImpact >= 0 ? "+" : ""}${fmt(
          cfImpact
        )}億円。運転資本の増加=キャッシュ減少、という符号の関係を逆に覚えてしまうのはよくある落とし穴です。`,
      };
    },
  });

  // 11. タックスシールド(節税効果)
  GENERATORS.push({
    key: "tax-shield",
    category: "LBO・財務分析",
    level: "上級",
    combos: 40 * 10,
    build() {
      const interest = randInt(20, 400, 5);
      const taxRate = pick([25, 30, 33, 35]);
      const shield = Math.round(interest * (taxRate / 100));
      const mistakeNoTax = interest;
      const distractors = uniqueDistractors(shield, [mistakeNoTax, shield * 1.4, shield * 0.6], 3, 0);
      const { choices, answerIndex } = shuffleWithAnswer(
        `${fmt(shield)}億円`,
        distractors.map((d) => `${fmt(d)}億円`)
      );
      return {
        question: `年間支払利息が ${fmt(interest)}億円、実効税率が${taxRate}%のとき、負債の節税効果(タックスシールド)はおよそいくらですか?`,
        choices,
        answerIndex,
        explain: `タックスシールド = 支払利息 × 実効税率 = ${fmt(interest)} × ${taxRate}% ≈ ${fmt(
          shield
        )}億円。支払利息は損金算入できるため、負債で資金調達すること自体に税務上のメリットが生まれます。これがLBOで借入を活用する動機の一つです。利息そのものを節税効果と混同しないよう注意してください。`,
      };
    },
  });

  // ---------- 公開API ----------

  function totalCombos() {
    return GENERATORS.reduce((sum, g) => sum + g.combos, 0);
  }

  let seq = 0;
  function generateOne(levelFilter) {
    let pool = GENERATORS;
    if (levelFilter && levelFilter !== "all") {
      pool = GENERATORS.filter((g) => g.level === levelFilter);
      if (pool.length === 0) pool = GENERATORS;
    }
    const gen = pick(pool);
    const built = gen.build();
    seq++;
    return Object.assign(
      {
        id: "calc-" + gen.key + "-" + seq + "-" + Math.floor(Math.random() * 1e6),
        type: "calc",
        level: gen.level,
        category: gen.category,
      },
      built
    );
  }

  global.CalcGenerators = {
    list: GENERATORS,
    totalCombos,
    generateOne,
  };
})(typeof window !== "undefined" ? window : globalThis);
