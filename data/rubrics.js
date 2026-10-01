/* ===== rubrics.js — 自己採点ルーブリック（3バンド：アナリスト／アソシエイト／VP） =====
   設計：blueprint/06_問題と演習の設計.md §6、07_ケーススタディ設計.md §5
   採点：各観点でバンドを選ぶ → 配点 × {アナリスト0.4／アソシエイト0.7／VP1.0} → 合計 → バンド判定（pass.associate / pass.vp） */

DOJO.rubric({ id: 'rub-onepager', name: '会社の一枚紹介', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '事業の説明', pts: 30, bands: { analyst: '会社資料の項目を写している', associate: '「何を・誰に・なぜ選ばれるか」が自分の言葉で書けている', vp: '稼ぐ構造（粗利の源・依存先・将来の縮小要因）まで一段で言えている' } },
    { name: '論点の抽出', pts: 40, bands: { analyst: '強み弱みを列挙している', associate: '「この案件で確かめるべきこと」が3つ以上、具体的に挙がっている', vp: '論点に優先順位があり、それぞれ「どの工程で、どう確かめるか」が付いている' } },
    { name: '人の把握', pts: 20, bands: { analyst: '登場人物の名前と肩書を並べた', associate: '誰が意思決定に影響するかが書けている', vp: '社長・専務・親族・銀行・FAそれぞれの「動機」が一行で書けている' } },
    { name: '簡潔さ', pts: 10, bands: { analyst: '長い・重複がある', associate: '1頁に収まっている', vp: '上司が30秒で読める。数字は3つ以内に絞られている' } }
  ],
  deductions: [{ cond: '数字に単位や期が書かれていない', pts: -5 }, { cond: '会社資料の数字をそのまま「実力」として書いている', pts: -5 }] });

DOJO.rubric({ id: 'rub-sourcing-memo', name: 'ソーシング初動メモ（面談メモと適合判定）', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '事実と解釈の分離', pts: 25, bands: { analyst: '聞いた話を時系列で書いている', associate: '「相手が言ったこと」と「自分の推測」が分かれている', vp: '相手が言わなかったこと（不自然な沈黙・避けた話題）まで記録している' } },
    { name: '投資テーマとの適合', pts: 25, bands: { analyst: '規模が合う／合わないだけ', associate: '業種・規模・承継型・地域で適合を判定し理由がある', vp: '適合しない点を先に挙げ、それでも進める理由（または見送る理由）が書けている' } },
    { name: '紹介者への配慮', pts: 25, bands: { analyst: '礼のメール', associate: '24時間以内の礼・次の動き・いつ連絡するかが明記', vp: '紹介者（銀行）の動機（主幹事・継続取引）を踏まえた関係設計が書けている' } },
    { name: '次の一手', pts: 25, bands: { analyst: '「検討する」', associate: '誰が・いつ・何をするかが3つ以内で書けている', vp: '社内（上司・IC）に何をいつ上げるかまで決まっている' } }
  ] });

DOJO.rubric({ id: 'rub-screen', name: 'スクリーニングメモ（2頁）', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '結論', pts: 15, bands: { analyst: '結論が最後にある、または曖昧', associate: '冒頭に「進める／見送る」と理由3つ', vp: '結論に条件（「ここが確認できれば進める」）と価格の目線が付いている' } },
    { name: '事業理解', pts: 20, bands: { analyst: 'IMの要約', associate: '何を誰に売り、なぜ選ばれ、何が壊すかが自分の言葉', vp: 'IMの主張のうち「売主の希望」と「実力」を見分けて書いている' } },
    { name: '数字の疑い方', pts: 25, bands: { analyst: 'IMの調整後EBITDAをそのまま使用', associate: '調整項目を一つ以上疑い、確認方法を書いている', vp: '報告→調整の各項目を妥当／要検証／疑わしいに分け、自分の暫定EBITDAを置いている' } },
    { name: '価格の目線（紙LBO）', pts: 25, bands: { analyst: '倍率の相場だけ', associate: '紙LBOでMOIC/IRRの概算と入札上限の目安がある', vp: '上限の根拠（レバレッジ・exit倍率・成長）と、結論を動かす前提が明示されている' } },
    { name: '次の確認事項', pts: 15, bands: { analyst: '「DDで確認」', associate: '優先順位付きで3〜5項目', vp: '項目ごとに「誰に・何を・どう聞くか」が付いている' } }
  ],
  deductions: [{ cond: '2頁（約1,500字）を大幅に超えている', pts: -5 }, { cond: '結論を動かす前提が特定されていない', pts: -5 }] });

DOJO.rubric({ id: 'rub-thesis', name: '投資仮説「何を信じる必要があるか」', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '反証可能性', pts: 35, bands: { analyst: '「良い会社」「成長余地がある」など説明的', associate: '主張が具体的で、委員が反論できる形', vp: '各主張に「何が分かれば崩れるか」が付いている' } },
    { name: '連鎖', pts: 25, bands: { analyst: '主張が並列に並ぶ', associate: '市場→会社→スポンサーがやること→利益の順につながる', vp: 'exitの買い手が「なぜ払うか」まで連鎖が閉じている' } },
    { name: '数の規律', pts: 15, bands: { analyst: '5つ以上、または1つ', associate: '2〜3つ', vp: '2〜3つで、優先順位がある' } },
    { name: '根拠への紐づけ', pts: 25, bands: { analyst: '根拠なし', associate: '各主張にIM等の根拠が付く', vp: '根拠の信頼性（売主提示か第三者か）が区別され、DDで取る証拠が指定されている' } }
  ] });

DOJO.rubric({ id: 'rub-ioi', name: '一次入札レターの骨子', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '価格レンジと根拠', pts: 30, bands: { analyst: '一点の金額', associate: 'レンジと、その前提（EBITDA・倍率・ネットデット定義）', vp: 'レンジの下限と上限がそれぞれ何を仮定しているかが書け、交渉余地が設計されている' } },
    { name: '条件・前提', pts: 25, bands: { analyst: '価格のみ', associate: 'DD範囲・資金調達・スケジュール・前提条件が書かれている', vp: '売主の希望（雇用・工場・社長の関わり・社名）に応える条項がある' } },
    { name: '売主への訴求', pts: 20, bands: { analyst: '定型文', associate: '自社の承継投資の実績と方針が書かれている', vp: '売主の心情（第二の創業・従業員）を踏まえ、価格以外で選ばれる理由が書かれている' } },
    { name: '社内整合', pts: 25, bands: { analyst: 'ICとの整合不明', associate: 'IC初回報告と整合している', vp: '「何があれば上限を超えてよいか／降りるか」が社内で握られている' } }
  ] });

DOJO.rubric({ id: 'rub-dd-issues', name: 'DD論点リスト（優先順位付き）', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '仮説からの逆算', pts: 30, bands: { analyst: '一般的なDDチェックリスト', associate: '投資仮説の各主張に対応した論点になっている', vp: '「崩れたら降りる」論点と「価格・契約で手当てする」論点が区別されている' } },
    { name: '優先順位', pts: 25, bands: { analyst: '順位なし', associate: '重要度で順位がある', vp: '重要度×判明の早さで順位があり、最初の1週間で潰す論点が明確' } },
    { name: '担当と手段', pts: 25, bands: { analyst: '「確認する」', associate: '論点ごとに誰（FDD/BDD/法務/自社）が何の資料・面談で確かめるか', vp: '手段が最小コストで最大の情報を取る設計になっている（まず資料、次に面談、最後に専門家）' } },
    { name: '数字との接続', pts: 20, bands: { analyst: '接続なし', associate: '論点がモデルのどの行を動かすか書かれている', vp: '論点ごとに「最悪の場合の金額インパクト」の概算がある' } }
  ] });

DOJO.rubric({ id: 'rub-qa', name: 'Q&A質問状', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '質問の具体性', pts: 30, bands: { analyst: '「〜について教えてください」', associate: '資料・期間・単位を指定し、一問一答で答えられる', vp: '答えの形（表・ファイル・担当者）まで指定し、売主の作業を最小にしている' } },
    { name: '論点との対応', pts: 30, bands: { analyst: '網羅的だが論点不明', associate: '各質問がDD論点に紐づいている', vp: '質問の順序が「売主に手の内を見せない」よう設計されている' } },
    { name: '優先度と期限', pts: 20, bands: { analyst: 'なし', associate: '優先度と希望回答日がある', vp: '一次回答・二次回答に分け、面談で聞く事項と書面で取る事項を分けている' } },
    { name: '礼と規律', pts: 20, bands: { analyst: '文面が高圧的または冗長', associate: '簡潔で礼がある', vp: '売主FAの立場（成約が利益）を踏まえ、回答を引き出しやすい文面' } }
  ] });

DOJO.rubric({ id: 'rub-interview', name: '経営者面談の質問設計', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '論点から逆算', pts: 30, bands: { analyst: '一般的な質問集', associate: 'この面談で確かめる仮説が3つに絞られ、質問がその手段になっている', vp: '質問が「相手が答えたくなる順」に並び、核心は中盤以降に置かれている' } },
    { name: '開かれた質問', pts: 25, bands: { analyst: 'はい／いいえで終わる質問が多い', associate: '「どのように」「なぜ」で始まる質問が中心', vp: '沈黙の使い方と、答えの後の追い質問が設計されている' } },
    { name: '人を見る設計', pts: 25, bands: { analyst: '事業の質問のみ', associate: '社長の意思・後継・幹部の評価を聞く質問がある', vp: '「3か月休んだら会社は回るか」のように、数字に出ない情報を取る質問がある' } },
    { name: '聞かないこと', pts: 20, bands: { analyst: '制限なし', associate: '相手を傷つける・交渉上不利になる質問を外している', vp: '聞かない代わりに別の方法（資料・第三者）で確かめる設計がある' } }
  ] });

DOJO.rubric({ id: 'rub-site', name: '現場視察の観察メモ', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '事実と解釈の分離', pts: 30, bands: { analyst: '印象が書かれている', associate: '見たこと（事実）と考えたこと（解釈）が分かれている', vp: '事実に数字・場所・時刻が付き、解釈に「確かめる方法」が付いている' } },
    { name: '見るべきものを見たか', pts: 30, bands: { analyst: '案内された場所の感想', associate: '設備銘板・在庫の山・掲示板・安全・4S・人の年齢構成を見ている', vp: '帳簿と現場の不一致（稼働率・在庫・更新投資）を一つ以上拾っている' } },
    { name: '人の観察', pts: 20, bands: { analyst: 'なし', associate: '工場長・現場の表情や発言を記録', vp: '誰が現場を動かしているか、社長不在時に回るかの見立てがある' } },
    { name: '論点への変換', pts: 20, bands: { analyst: 'なし', associate: '観察がDD論点・モデルの行に接続されている', vp: '金額インパクトの概算（更新投資額・人件費）まで出ている' } }
  ] });

DOJO.rubric({ id: 'rub-model-review', name: 'DD発見のモデル反映メモ', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '発見→行の対応', pts: 35, bands: { analyst: '発見の列挙', associate: '発見ごとにモデルのどの行をどう変えるか', vp: 'EBITDA・ネットデット・Capex・運転資本のどこに効くかが分類されている' } },
    { name: '金額の明示', pts: 30, bands: { analyst: '方向のみ', associate: '金額と根拠', vp: '確定・概算・要追加確認の区別がある' } },
    { name: '結論への影響', pts: 35, bands: { analyst: 'なし', associate: '修正後の調整後EBITDAと価格目線の変化', vp: '「結論が変わる発見」と「価格で吸収できる発見」が区別されている' } }
  ] });

DOJO.rubric({ id: 'rub-termsheet', name: '銀行タームシート比較表', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '項目の網羅', pts: 25, bands: { analyst: '金利と金額のみ', associate: '金額・金利・フィー・返済・コベナンツ・担保・CP・期間を並べた', vp: '定義（EBITDA定義・バスケット・ヘッジ要件）の差まで拾っている' } },
    { name: 'オールインの比較', pts: 25, bands: { analyst: '表面金利で比較', associate: 'フィー込みの年率換算で比較', vp: '期限前返済・リファイナンス時のコスト差まで織り込んでいる' } },
    { name: 'ヘッドルーム', pts: 25, bands: { analyst: 'なし', associate: 'コベナンツの余裕が基本ケースで計算されている', vp: '下方ケースで抵触するか、どちらが耐えるかが示されている' } },
    { name: '推薦と理由', pts: 25, bands: { analyst: '安い方', associate: '推薦と理由3つ', vp: '案件の戦略（保有期間・ボルトオン・リキャップ）に照らした推薦' } }
  ] });

DOJO.rubric({ id: 'rub-ic-memo', name: 'ICメモ', total: 100, pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '推薦と条件', pts: 10, bands: { analyst: '結論が曖昧または最後にある', associate: '冒頭に推薦・価格・ストラクチャー・リターンの見込み', vp: '一文。行動・価格・ストラクチャー・基本ケースMOIC/IRR・保有期間。曖昧語なし' } },
    { name: '投資仮説（何を信じる必要があるか）', pts: 20, bands: { analyst: '事業の説明になっている', associate: '2〜3の主張があり、根拠が付く', vp: '反証可能な2〜3の主張が市場→会社→スポンサーがやること→利益→exit買い手の連鎖で書かれ、各主張に根拠資料が紐づく' } },
    { name: '事業と市場', pts: 10, bands: { analyst: 'IMの要約', associate: 'ユニットエコノミクス・堀・顧客集中・循環性が書かれている', vp: '成長率の前提に基準率（外部視点）が添えられている' } },
    { name: '財務とモデルの健全性', pts: 15, bands: { analyst: '報告EBITDAをそのまま使用', associate: '報告→調整EBITDAのブリッジがあり、感応度がある', vp: '経営陣ケースvsスポンサーケース、結論を動かす前提2つの感応度、リターン分解（事業・倍率・レバレッジ）がある' } },
    { name: '主要リスクと緩和策', pts: 15, bands: { analyst: 'リスクの列挙', associate: 'リスクごとに緩和策', vp: '重要度×蓋然性で順位付け。「緩和なし・価格に織込」の明示。後で最も恥ずかしくなるリスクを名指し' } },
    { name: '下方ケースと資本保全', pts: 10, bands: { analyst: 'なし、または「基本−10%」', associate: '現実的な下方ケースがモデル化されている', vp: 'コベナンツ余裕・流動性・エクイティ回収・再検討と損切りのトリガーが書かれている' } },
    { name: 'プレモーテム', pts: 5, bands: { analyst: 'なし', associate: '失敗シナリオがある', vp: '失敗の物語3本が過去形で書かれ、それぞれの早期シグナルがある' } },
    { name: '価値創造計画とexit', pts: 5, bands: { analyst: '「バリューアップする」', associate: '100日の優先施策とexit経路', vp: '施策に担当・KPI・時期。exit買い手候補と「なぜ払うか」' } },
    { name: '明快さと知的誠実', pts: 10, bands: { analyst: '長い・形容詞が多い', associate: '簡潔で根拠がある', vp: '長さの規律。根拠なき形容詞なし。反証となる情報を含む。分からないことは「分からない」' } }
  ],
  deductions: [
    { cond: '仮説が「説明」になっている', pts: -5 }, { cond: '下方ケースをモデル化していない', pts: -10 },
    { cond: 'リスクに順位がない', pts: -5 }, { cond: 'リターンの50%超が倍率拡大で根拠なし', pts: -5 }
  ] });

DOJO.rubric({ id: 'rub-ic-qa', name: '模擬ICの回答', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '質問に答えているか', pts: 30, bands: { analyst: '関連する説明をしている', associate: '聞かれたことに直接答えてから補足している', vp: '一文目が答え。知らないことは「分からない、こう確かめる」と言える' } },
    { name: '根拠', pts: 30, bands: { analyst: '印象・形容詞', associate: 'DD資料・数字を引いている', vp: '根拠の限界（売主提示・サンプル数）まで言える' } },
    { name: '判断の防衛', pts: 25, bands: { analyst: '反論されると引く・または意地になる', associate: '反論の正当な部分を認め、残る部分で主張を維持', vp: '「何が分かれば考えを変えるか」を自分から言える' } },
    { name: '簡潔さ', pts: 15, bands: { analyst: '長い', associate: '3文以内', vp: '委員が追い質問をしやすい答え方になっている' } }
  ] });

DOJO.rubric({ id: 'rub-spa-issues', name: 'SPA主要論点表', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: 'DD発見との対応', pts: 35, bands: { analyst: '条項の一般的説明', associate: 'DD発見ごとに、どの条項（価格調整・表明保証・特別補償・CP）で手当てするかが書かれている', vp: '手当ての選択理由（価格か、補償か、保険か、撤退か）が書かれている' } },
    { name: '優先順位', pts: 25, bands: { analyst: 'なし', associate: '譲れない／譲れるの区分', vp: '相手が譲りやすい順と自社の重要度の両面で順位がある' } },
    { name: '金額化', pts: 20, bands: { analyst: 'なし', associate: '上限・バスケット・エスクローの金額案', vp: '金額案に根拠（DD発見の最大損失・市場相場）がある' } },
    { name: '弁護士への指示', pts: 20, bands: { analyst: '「レビューお願いします」', associate: 'ビジネス論点と法務論点を分けて依頼', vp: '優先順位と予算を伴う指示になっている' } }
  ] });

DOJO.rubric({ id: 'rub-closing', name: 'クロージング・チェックリストと資金フロー', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '網羅性', pts: 30, bands: { analyst: '主要書類のみ', associate: 'CP・書類・資金・登記・通知・当日の時刻表が揃っている', vp: '各項目に担当・期限・確認方法・バックアップがある' } },
    { name: '資金フロー', pts: 35, bands: { analyst: '金額の合計', associate: '出し手→受け手→金額→時刻が一本の表になっている', vp: 'ソース&ユースと一致し、調整額の仮計算・費用の支払先・税の源泉まで整合' } },
    { name: '事故への備え', pts: 35, bands: { analyst: 'なし', associate: '典型的な事故（送金遅延・書類不備・同意未取得）への対応がある', vp: '事故の兆候を前日までに検知する手順がある' } }
  ] });

DOJO.rubric({ id: 'rub-100day', name: '100日プラン', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: 'WHAT/WHO/by WHEN', pts: 30, bands: { analyst: '施策の列挙', associate: '施策ごとに担当と期限', vp: '施策が3〜5に絞られ、優先順位と効果額がある' } },
    { name: 'DDとの接続', pts: 25, bands: { analyst: '接続なし', associate: 'DDの発見事項が施策に変わっている', vp: '投資仮説のレバー（価格・医療機器・原価）が施策の中心にある' } },
    { name: 'KPIと会議体', pts: 25, bands: { analyst: 'なし', associate: 'KPIツリーと月次会議', vp: '先行指標が選ばれ、会議の議題・時間・出席者・24時間以内の文書化が決まっている' } },
    { name: '人への配慮', pts: 20, bands: { analyst: 'なし', associate: '従業員・経営陣への説明の順序', vp: '専務・工場長・次世代の処遇と役割が設計されている' } }
  ] });

DOJO.rubric({ id: 'rub-monitoring', name: '月次モニタリング・差異分析', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '差異の特定', pts: 30, bands: { analyst: '数字の転記', associate: '前月比・予算比・前年比で差異を特定', vp: '3か月以上同方向に動く項目を要注意として抽出' } },
    { name: '「なぜ」の仮説', pts: 35, bands: { analyst: 'なし', associate: '差異ごとに一言の仮説', vp: '仮説に確認手段（誰に・何を聞く）が付く' } },
    { name: 'コベナンツ接続', pts: 35, bands: { analyst: 'なし', associate: 'コベナンツ見込みを計算', vp: '抵触の兆候があれば銀行への先回りの時期と内容まで書かれている' } }
  ] });

DOJO.rubric({ id: 'rub-exit', name: 'exit設計', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '経路の比較', pts: 30, bands: { analyst: '経路の列挙', associate: '価格・確度・時間・残る義務で比較', vp: '買い手候補を名指しし「なぜ払うか」が書かれている' } },
    { name: '準備', pts: 30, bands: { analyst: 'なし', associate: 'VDD・エクイティストーリー・データルームの準備リスト', vp: '買い手のDDで問われる論点（顧客集中・設備・人）への答えが先に用意されている' } },
    { name: '価格×確度', pts: 40, bands: { analyst: '最高値を選ぶ', associate: '確度の検証項目がある', vp: '破談の期待損失と価格差を比較し、確度を買い取る条件（手付・逆ブレークフィー）まで設計' } }
  ] });

DOJO.rubric({ id: 'rub-postmortem', name: '事後検証メモ', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: 'リターン分解', pts: 30, bands: { analyst: 'MOICのみ', associate: 'EBITDA成長・倍率・返済に分解', vp: '「運か実力か」の判定と根拠' } },
    { name: 'プロセスと結果の分離', pts: 35, bands: { analyst: '結果で判断', associate: '良い判断／悪い判断と良い結果／悪い結果を分けている', vp: '入口の予測（確信度）と結果を比較し、校正を論じている' } },
    { name: '次に変えること', pts: 35, bands: { analyst: '反省', associate: '具体的な行動が3つ', vp: '行動がチェックリストの項目になっている' } }
  ] });

DOJO.rubric({ id: 'rub-ic-question', name: 'ICの質問を書く', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '的', pts: 50, bands: { analyst: '一般的な質問（「リスクは？」）', associate: 'メモの特定の数字・主張を指している', vp: '結論を動かす前提（荷重のかかる主張）を正確に指している' } },
    { name: '検証可能性', pts: 30, bands: { analyst: '答えようがない', associate: '答えられる', vp: '答えに必要な資料・手続きまで想定している' } },
    { name: '言葉', pts: 20, bands: { analyst: '長い・曖昧', associate: '簡潔', vp: '一文。委員会でそのまま使える' } }
  ] });

DOJO.rubric({ id: 'rub-premortem', name: 'プレモーテム', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '尤もらしさ', pts: 40, bands: { analyst: '一般論（景気が悪化した）', associate: 'この案件固有の失敗（A社の切替、熟練工の退職）', vp: '失敗の連鎖（何が起きて→何が起きて→0.6倍）が具体的' } },
    { name: '早期シグナル', pts: 40, bands: { analyst: 'なし', associate: '各失敗に兆候がある', vp: '兆候が月次モニタリングで拾える指標になっている' } },
    { name: '形式', pts: 20, bands: { analyst: '現在形・条件形', associate: '過去形で書かれている', vp: '3本で、互いに異なる失敗モード' } }
  ] });

DOJO.rubric({ id: 'rub-redline', name: 'メモの赤入れ', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '形容詞の除去', pts: 30, bands: { analyst: '残っている', associate: '根拠のない形容詞を削除', vp: '形容詞を数字か事実に置き換えた' } },
    { name: '欠落の補完', pts: 40, bands: { analyst: '気づかない', associate: '欠けている下方ケース・リスク順位を指摘', vp: '補完案を書いた' } },
    { name: '仮説の矯正', pts: 30, bands: { analyst: 'そのまま', associate: '説明になっている仮説を指摘', vp: '反証可能な主張に書き直した' } }
  ] });

DOJO.rubric({ id: 'rub-report', name: '上司への報告（3行）', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '構造', pts: 40, bands: { analyst: '時系列の説明', associate: '決まったこと／持ち帰ったこと／次の動き', vp: '一行目で結論、上司の判断が要る点が明示' } },
    { name: '正確さ', pts: 30, bands: { analyst: '印象', associate: '数字・名前・期日が正確', vp: '不確かなことは不確かと書いてある' } },
    { name: '速さ', pts: 30, bands: { analyst: '翌日以降', associate: '当日中', vp: '1時間以内。相手が動ける形' } }
  ] });

DOJO.rubric({ id: 'rub-paper-lbo', name: '紙LBO（概算）', pass: { associate: 60, vp: 80 },
  criteria: [
    { name: '構造', pts: 30, bands: { analyst: 'どこかが抜けている', associate: 'EV→ネットデット→株式価値→S&U→5年後→返済→exit→MOIC/IRRの順に揃っている', vp: '10分以内で、検算の跡がある' } },
    { name: '前提の妥当性', pts: 40, bands: { analyst: '相場を知らない数字', associate: 'レバレッジ4〜5倍・exit倍率entry並び・成長は保守的', vp: '前提のうち「結論を最も動かすもの」を自分で名指ししている' } },
    { name: '結論の使い方', pts: 30, bands: { analyst: 'MOICを出して終わり', associate: '目標リターンから入札上限の目安を逆算', vp: '上限を超えて払う理由があり得るか／ないかまで書いている' } }
  ] });
