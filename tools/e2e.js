/* ===== tools/e2e.js — ブラウザ通し検証（Playwright / Chromium） =====
   使い方: (python3 -m http.server 8765 &) ; NODE_PATH=$(npm root -g) node tools/e2e.js
   すべての主要ルートを開き、JSエラー・コンソールエラーが無いこと、
   v2 の演習・ケース・ルーブリック・ジャーナルの操作が通ることを確かめる。
   最終行に "no js errors" を出せば合格。 */
const { chromium } = require('playwright');
const BASE = process.env.E2E_BASE || 'http://localhost:8765/index.html';

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const log = [];
  async function goto(hash, label) {
    await page.goto(BASE + hash, { waitUntil: 'load' });
    await page.waitForSelector('#app:not([hidden])', { timeout: 15000 });
    await page.waitForTimeout(250);
    const txt = (await page.textContent('#app')) || '';
    if (txt.indexOf('ページが見つかりません') >= 0) errors.push('notfound: ' + hash);
    log.push((label || hash) + ' ok ' + txt.replace(/\s+/g, ' ').slice(0, 60));
  }

  await goto('#/', 'home');
  const hasV2 = await page.evaluate(() => !!(window.DOJO && DOJO.CHAPTERS && DOJO.CHAPTERS.length));
  log.push('v2 chapters: ' + hasV2);

  // ---- v1（資料庫）が壊れていないこと
  await goto('#/library', 'library');
  await goto('#/quiz/pe/b/0', 'v1 set');
  const pick = await page.$('[data-pick="0"]');
  if (pick) { await pick.click(); await page.waitForTimeout(150); }
  await goto('#/glossary', 'glossary');
  await goto('#/review', 'review');
  await goto('#/progress', 'progress');

  // ---- v2
  await goto('#/road', 'road');
  await goto('#/cases', 'cases');
  await goto('#/skills', 'skills');
  await goto('#/journal', 'journal');
  const firstLec = await page.evaluate(() => { const l = DOJO.lecturesOf('ch00', 1)[0]; return l ? l.id : null; });
  const chapters = await page.evaluate(() => DOJO.CHAPTERS.map(c => c.id));
  for (const ch of chapters) {
    await goto('#/ch/' + ch + '/1', 'chapter ' + ch);
  }
  if (firstLec) {
    await goto('#/lec2/' + firstLec, 'lecture2');
    const mr = await page.$('#markRead2'); if (mr) { await mr.click(); await page.waitForTimeout(100); }
  }
  // 全章の全講義（1〜3周）を開いてレンダリングエラーが無いことを確かめる
  const allLecs = await page.evaluate(() => Object.keys(DOJO.LECTURES2));
  for (const id of allLecs) { await goto('#/lec2/' + id, 'lec ' + id); }

  // 演習セット：各章1周目のセット1を開き、全問に何か答える
  for (const ch of chapters) {
    for (const lap of [1, 2, 3]) {
      const n = await page.evaluate(([c, l]) => DOJO.setsFor2(c, l).length, [ch, lap]);
      if (!n) continue;
      await goto('#/ex/' + ch + '/' + lap + '/0', 'set ' + ch + ' l' + lap);
      for (let i = 0; i < 14; i++) {
        const done = await page.evaluate(() => !DOJO.current2 || DOJO.current2.finished);
        if (done) break;
        const type = await page.evaluate(() => DOJO.current2.cur.q.type);
        try {
          if ([13, 14, 5].includes(type)) { await page.click('[data-pick="0"]'); }
          else if (type === 11) { await page.fill('#numIn', '1'); await page.click('#submitBtn'); }
          else if (type === 9) { const ins = await page.$$('.numgrid input'); for (const x of ins) await x.fill('1'); await page.click('#submitBtn'); }
          else if (type === 8) { await page.fill('#numIn', '30'); await page.click('#submitBtn'); }
          else if (type === 2) { await page.click('[data-sc="1"]'); }
          else if (type === 3 || type === 10) { for (let k = 0; k < 12; k++) { const x = await page.$('[data-ord]:not(.picked)'); if (!x) break; await x.click(); await page.waitForTimeout(40); } await page.click('#submitBtn'); }
          else if (type === 4) { await page.click('[data-row="0"]'); await page.click('#submitBtn'); }
          else { await page.fill('#genText', 'テスト回答'); await page.click('#submitBtn'); await page.waitForTimeout(100); await page.click('[data-band="associate"]'); }
        } catch (e) { errors.push('exercise interaction failed (' + ch + ' l' + lap + ' type ' + type + '): ' + e.message); break; }
        await page.waitForTimeout(80);
        const nb = await page.$('#nextBtn'); if (nb) await nb.click();
        await page.waitForTimeout(80);
      }
    }
  }
  // 混合ドリル
  await goto('#/ex/ch02/1/mix', 'mixed drill');
  await goto('#/ex/ch04/1/lib', 'library drill');
  const lp = await page.$('[data-pick="0"]'); if (lp) { await lp.click(); await page.waitForTimeout(100); }

  // ケース：各章の1周目を開き、最初の課題を保存→自己採点→プロの成果物→新情報→ジャーナル
  const caseIds = await page.evaluate(() => Object.keys(DOJO.CASES));
  for (const cid of caseIds) {
    for (const lap of [1, 2, 3]) {
      const hasTask = await page.evaluate(([c, l]) => DOJO.CASES[c].tasks.some(t => (t.lap || 1) === l), [cid, lap]);
      if (!hasTask) continue;
      await goto('#/case/' + cid.replace('/', '~') + '/' + lap, 'case ' + cid + ' l' + lap);
      try {
        const cal = await page.$('#calibIn'); if (cal) { await page.fill('#calibIn', '55'); const cb = await page.$('#calibSave'); if (cb) await cb.click(); }
        const ta = await page.$('textarea.deliverable');
        if (ta) {
          await ta.fill('e2e 成果物ドラフト');
          const sv = await page.$('[data-save]'); if (sv) await sv.click();
          await page.waitForTimeout(100);
          const sg = await page.$('[data-startgrade]'); if (sg) { await sg.click(); await page.waitForTimeout(150); }
          const bands = await page.$$('[data-grade]');
          const seen = new Set();
          for (const b of bands) { const ci = await b.getAttribute('data-crit'); if (seen.has(ci)) continue; seen.add(ci); await b.click(); }
          const fin = await page.$('[data-finishgrade]'); if (fin) { await fin.click(); await page.waitForTimeout(150); }
          const pro = await page.$('.pro-output'); if (!pro) errors.push('pro output not revealed after grading: ' + cid + ' l' + lap);
        }
        const ni = await page.$('[data-ni-pick="1"]'); if (ni) await ni.click();
        const jt = await page.$('#jDecision');
        if (jt) { await page.fill('#jDecision', '決めたこと'); await page.fill('#jLesson', '次に変えること'); const js = await page.$('#jSave'); if (js) await js.click(); }
      } catch (e) { errors.push('case interaction failed (' + cid + ' l' + lap + '): ' + e.message); }
    }
  }
  await goto('#/journal', 'journal after');
  await goto('#/skills', 'skills after');
  await goto('#/', 'home after');

  console.log(log.join('\n'));
  await browser.close();
  if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); process.exit(1); }
  console.log('no js errors');
})().catch(e => { console.error(e); process.exit(1); });
