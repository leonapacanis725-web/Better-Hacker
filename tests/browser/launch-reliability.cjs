// Focused browser regressions for the d25215e launch audit. No real signup is sent.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const State = require('../../learner-state.js');
const Library = require('../../challenges.js');
const Portfolio = require('../../portfolio.js');
const url = process.env.BETTER_HACKER_TEST_URL || 'http://127.0.0.1:8000';
const exploit = 'Review" onfocus="window.__auditXss=true'; // Exact audit reproduction; do not change.
const fieldExploit = '</textarea><img src=x onerror="window.__auditFields=true"><script>window.__auditFields=true</script> & "quoted"';
const reason = 'The fictional records support further review, not proof of compromise.';
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox']
  });
  try {
    for (const width of [1280, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      await page.evaluate(() => localStorage.setItem('betterHackerNetworkingComplete', 'true')); await page.reload();
      await page.locator('[data-portfolio-add="lesson-networking"]').click();
      await page.locator('#portfolio-form input[name="title"]').fill(exploit);
      for (const field of Portfolio.LEARNER_FIELDS) await page.locator(`[name="${field}"]`).fill(fieldExploit);
      await page.locator('#portfolio-form button[type="submit"]').click();
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('betterHackerPortfolioProjects'));
        state.projects[0].completedAt = '"onfocus="';
        localStorage.setItem('betterHackerPortfolioProjects', JSON.stringify(state));
      });
      await page.reload();
      await page.locator('.portfolio-card [data-portfolio-edit]').click();
      const title = page.locator('#portfolio-form input[name="title"]');
      assert.equal(await title.inputValue(), exploit);
      await title.focus();
      assert.equal(await page.evaluate(() => window.__auditXss === true || window.__auditFields === true), false);
      assert.equal(await title.getAttribute('onfocus'), null);
      assert.equal(await page.locator('#portfolio-form input[name="completedAt"]').getAttribute('onfocus'), null);
      for (const field of Portfolio.LEARNER_FIELDS) assert.equal(await page.locator(`[name="${field}"]`).inputValue(), fieldExploit);
      await page.locator('#portfolio-form input[name="title"]').fill('My "quoted" project: <notes> & learner’s evidence');
      await page.locator('#portfolio-form button[type="submit"]').click();
      await page.locator('#portfolio-builder [data-portfolio-export]').click();
      assert.match(await page.locator('#readme-preview code').innerText(), /&lt;notes&gt; &amp; learner’s evidence/);
      assert.equal(await page.locator('#portfolio-builder img, #portfolio-builder script').count(), 0);
      for (const field of Portfolio.LEARNER_FIELDS) assert.equal(await page.locator(`[data-evidence="${field}"]`).innerText(), fieldExploit);
      await page.reload();
      assert.equal(await page.locator('[data-project-title]').innerText(), 'My "quoted" project: <notes> & learner’s evidence');
      await page.locator('.portfolio-card [data-portfolio-edit]').click();
      assert.equal(await page.locator('#portfolio-form input[name="title"]').inputValue(), 'My "quoted" project: <notes> & learner’s evidence');
      await page.locator('[data-portfolio-close]').click();
      const before = await page.evaluate(() => localStorage.getItem('betterHackerPortfolioProjects'));
      let prompt; page.once('dialog', async dialog => { prompt = dialog.message(); await dialog.accept(); });
      await page.locator('.reset-progress-button').click(); await page.waitForLoadState('load');
      assert.match(prompt, /portfolio projects.*kept/);
      assert.equal(await page.evaluate(() => localStorage.getItem('betterHackerPortfolioProjects')), before);
      assert.equal(await page.evaluate(() => localStorage.getItem('betterHackerNetworkingComplete')), null);
      assert.equal(await page.locator('.portfolio-card').count(), 1);
      await page.locator('.portfolio-card [data-portfolio-edit]').click();
      assert.equal(await page.locator('#portfolio-form input[name="title"]').inputValue(), 'My "quoted" project: <notes> & learner’s evidence');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []); await page.close();
      console.log(`${width}px: exact portfolio exploit, all evidence fields, punctuation/reload and reset preservation passed`);
    }
    for (const failure of ['getter', 'read', 'quota']) {
      const page = await browser.newPage({ reducedMotion: 'reduce' }), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(kind => {
        if (kind === 'getter') Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
        else if (kind === 'read') Storage.prototype.getItem = function () { throw new DOMException('Blocked', 'SecurityError'); };
        else {
          localStorage.setItem('betterHackerLinuxComplete', 'true');
          localStorage.setItem('betterHackerPortfolioProjects', JSON.stringify({version:1,projects:[{activityId:'lesson-linux',title:'Existing saved work',findings:'Original evidence'}]}));
          Storage.prototype.setItem = function () { throw new DOMException('Full', 'QuotaExceededError'); };
        }
      }, failure);
      await page.goto(url);
      assert.match(await page.locator('#dashboard-next').innerText(), /Cybersecurity Fundamentals/);
      await page.locator('#fundamentals-check-answer').fill('least privilege'); await page.locator('#fundamentals-check-button').click();
      assert.match(await page.locator('#fundamentals-check-result').innerText(), /Correct.*Not saved/s);
      assert.match(await page.locator('#storage-status').innerText(), /only for this session/);
      await page.locator('#network-check-answer').fill('443'); await page.locator('#network-check-button').click();
      await page.locator('[data-portfolio-add="lesson-networking"]').click();
      await page.locator('#portfolio-form input[name="title"]').fill('Unsaved "quoted" evidence');
      await page.locator('#portfolio-form button[type="submit"]').click();
      assert.match(await page.locator('#portfolio-status').innerText(), /Not saved/);
      assert.doesNotMatch(await page.locator('#portfolio-status').innerText(), /Project saved/);
      const date = await page.evaluate(() => BetterHackerState.localDateKey(new Date())), activity = Library.challengeForDate(date);
      await page.locator('a.primary-button[href="#daily-practice-workspace"]').click();
      await page.locator(`input[name="daily-evidence"][value="${activity.evidenceIndex}"]`).check();
      await page.locator(`input[name="daily-answer"][value="${activity.correctIndex}"]`).check();
      await page.locator('#daily-reasoning').fill(reason); await page.locator('#daily-practice-form button').click();
      assert.match(await page.locator('#daily-feedback').innerText(), /Correct.*Not saved/s);
      assert.doesNotMatch(await page.locator('#daily-feedback').innerText(), /Completion saved/);
      const xp = await page.locator('#dashboard-xp').innerText();
      await page.locator('#daily-practice-form button').click(); assert.equal(await page.locator('#dashboard-xp').innerText(), xp);
      await page.evaluate(() => { location.hash = '#lab-linux'; });
      await page.locator('#lab-answer').fill('cat flag.txt'); await page.locator('#submit-answer').click(); await page.locator('#complete-lab').click();
      assert.match(await page.locator('#lab-completion-actions').innerText(), /Not saved/);
      await page.evaluate(() => { location.hash = '#computer-tools-lesson'; });
      await page.locator('.extension-check[data-extension-id="computer-tools"] input[value="observe"]').check();
      await page.locator('.extension-check[data-extension-id="computer-tools"] button[type="submit"]').click();
      assert.match(await page.locator('.extension-check[data-extension-id="computer-tools"] .extension-feedback').innerText(), /Correct.*Not saved/s);
      if (failure === 'quota') {
        assert.equal(await page.evaluate(() => localStorage.getItem('betterHackerLinuxComplete')), 'true');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('betterHackerPortfolioProjects')).projects[0].title), 'Existing saved work');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('betterHackerPortfolioProjects')).projects.length), 1);
      }
      await page.route('https://formspree.io/**', route => route.fulfill({status:200,contentType:'application/json',body:'{}'}));
      await page.locator('#waitlist-email').fill('Learner@example.test'); await page.locator('#waitlist-button').click();
      await page.waitForFunction(() => document.querySelector('#waitlist-button').textContent === 'Update Waitlist Email');
      assert.match(await page.locator('#waitlist-result').innerText(), /confirmed.*email could not be saved/s);
      page.once('dialog', dialog => dialog.accept()); await page.locator('.reset-progress-button').click();
      assert.match(await page.locator('#storage-status').innerText(), /Not saved/);
      assert.ok(await page.locator('.portfolio-card').count() >= 1);
      assert.deepEqual(errors, []); await page.close();
      console.log(`${failure}: bootstrap, correct-vs-saved feedback, portfolio, daily, lab and supplemental lesson passed without browser errors`);
    }
    const page = await browser.newPage({ reducedMotion: 'reduce' }), errors = [];
    page.on('pageerror', e => errors.push(e.message)); await page.goto(url);
    let state = State.emptyDailyState();
    for (let i=0; i<65; i++) state = State.completeDailyChallenge(state, State.localDateKey(new Date(2026,0,1+i)), 'daily-siem', 50).state;
    delete state.totalXp; // Legacy bounded history, exactly as persisted before this fix.
    await page.evaluate(state => localStorage.setItem('betterHackerDailyChallengeState',JSON.stringify(state)),state); await page.reload();
    assert.match(await page.locator('#dashboard-xp').innerText(), /3250/);
    assert.equal(await page.evaluate(() => BetterHackerState.readDailyState(BetterHackerSessionStorage).records.length),60);
    assert.deepEqual(errors, []); await page.close();
    console.log('Legacy 65-day state: dashboard restores 3,250 XP and retains bounded history');
    const corrupt = await browser.newPage({reducedMotion:'reduce'}), corruptErrors=[];
    corrupt.on('pageerror', e=>corruptErrors.push(e.message)); await corrupt.goto(url);
    const values = {
      betterHackerLinuxComplete:'true', betterHackerDailyChallengeState:'{broken',
      betterHackerPracticeLibraryState:JSON.stringify({version:1,completed:[null,{activityId:'daily-siem',date:'2026-10-10'}]}),
      betterHackerPortfolioProjects:JSON.stringify({version:1,projects:[null,{activityId:'lesson-linux',title:'Valid neighboring project'}]})
    };
    await corrupt.evaluate(values=>Object.entries(values).forEach(([key,value])=>localStorage.setItem(key,value)),values); await corrupt.reload();
    assert.equal(await corrupt.locator('[data-project-title]').innerText(),'Valid neighboring project');
    assert.match(await corrupt.locator('#dashboard-lessons').innerText(),/1 \/ 8/);
    assert.equal(await corrupt.evaluate(()=>BetterHackerState.readPracticeLibraryState(BetterHackerSessionStorage).completed.length),1);
    assert.equal(await corrupt.evaluate(()=>localStorage.getItem('betterHackerDailyChallengeState')),values.betterHackerDailyChallengeState);
    assert.deepEqual(corruptErrors,[]); await corrupt.close();
    console.log('Corrupted JSON and mixed malformed records: valid Core, library and portfolio evidence remains usable without browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
