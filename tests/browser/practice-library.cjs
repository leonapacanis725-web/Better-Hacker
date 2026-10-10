// Optional Chromium regression checks; see README for prerequisites.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const State = require('../../learner-state.js');
const Library = require('../../challenges.js');

(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
    args: ['--no-sandbox']
  });
  for (const width of [1280, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', timezoneId: 'America/Detroit' });
    await page.clock.install({ time: new Date('2026-10-10T16:00:00Z') });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.BETTER_HACKER_TEST_URL || 'http://127.0.0.1:8000');
    const daily = State.completeDailyChallenge(State.emptyDailyState(), '2026-10-09', 'daily-siem', 50).state;
    const seed = {
      [State.DAILY_KEY]: JSON.stringify(daily), betterHackerCompletedLabs: '2',
      betterHackerSocInvestigationComplete: 'true', unrelated: 'preserved'
    };
    for (const name of ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting']) seed['betterHacker'+name+'Complete'] = 'true';
    await page.evaluate(values => Object.entries(values).forEach(([key,value]) => localStorage.setItem(key,value)), seed);
    await page.reload();
    const baseline = await page.evaluate(() => ({
      xp: document.querySelector('#dashboard-xp').textContent,
      core: document.querySelector('#core-path-progress').getAttribute('aria-valuenow'),
      streak: document.querySelector('#dashboard-streak').textContent,
      count: document.querySelector('#dashboard-practice-count').textContent
    }));
    assert.equal(await page.locator('#practice-library-tracks a').count(), 10);
    async function checkOverflow() {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px horizontal overflow`);
    }
    async function answer(activity, wrong = false) {
      await page.locator(`input[name="daily-evidence"][value="${wrong ? (activity.evidenceIndex+1)%3 : activity.evidenceIndex}"]`).check();
      await page.locator(`input[name="daily-answer"][value="${activity.correctIndex}"]`).check();
      await page.locator('#daily-reasoning').fill('The supplied fictional records support review, not a proven compromise.');
      await page.locator('#daily-practice-form button').click();
    }
    for (const track of Library.TRACKS) {
      const activities = Library.activitiesForTrack(track.id);
      for (const activity of activities) {
        const trackCard = page.locator(`#practice-library-tracks a[href="#practice-track-${track.id}"]`);
        await trackCard.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
        assert.notEqual(await trackCard.evaluate(el => getComputedStyle(el).boxShadow), 'none');
        await page.keyboard.press('Enter');
        await page.waitForFunction(name => document.querySelector('#practice-track-title')?.textContent === name, track.name);
        assert.equal(await page.locator('#practice-library-activities .card').count(), activities.length);
        assert.equal(await page.locator(':focus').getAttribute('id'), 'practice-track-title');
        const link = page.locator(`#practice-library-activities a[href="#library-activity-${activity.id}"]`);
        await link.focus(); await page.keyboard.press('Enter');
        await page.waitForFunction(title => document.querySelector('#daily-practice-title')?.textContent === title, activity.title);
        assert.equal(await page.locator(':focus').getAttribute('id'), 'daily-practice-title');
        assert.match(await page.locator('#daily-practice-workspace .section-label').innerText(), /PRACTICE MODE/);
        assert.equal(await page.evaluate(() => BetterHackerCompanionInstance.getContext().assistantTopic), activity.assistantTopic);
        assert.equal(await page.locator('#daily-practice-form fieldset').count(), 2);
        await page.locator('#daily-practice-workspace summary').focus(); await page.keyboard.press('Enter');
        assert.equal(await page.locator('#daily-practice-workspace details').getAttribute('open'), '');
        await answer(activity, true); assert.match(await page.locator('#daily-feedback').innerText(), /Not quite/);
        await answer(activity); assert.match(await page.locator('#daily-feedback').innerText(), /Practice completed and saved/);
        await answer(activity); assert.match(await page.locator('#daily-feedback').innerText(), /Practiced before/);
        if (activity.portfolio) {
          const countBefore = await page.locator('.portfolio-card').count();
          await page.locator('#daily-practice-next [data-portfolio-add]').click();
          assert.equal(await page.locator('.portfolio-card').count(), countBefore+1);
          await page.locator('[data-portfolio-close]').click();
          await page.locator('#daily-practice-next [data-portfolio-add]').click();
          assert.equal(await page.locator('.portfolio-card').count(), countBefore+1);
          await page.locator('[data-portfolio-close]').click();
        } else assert.equal(await page.locator('#daily-practice-next [data-portfolio-add]').count(), 0);
        await page.locator('[data-daily-help]').click();
        assert.equal(await page.locator('.coach-topic[aria-pressed="true"]').getAttribute('data-topic'), activity.assistantTopic);
        await checkOverflow();
      }
    }
    const after = await page.evaluate(() => ({
      xp: document.querySelector('#dashboard-xp').textContent,
      core: document.querySelector('#core-path-progress').getAttribute('aria-valuenow'),
      streak: document.querySelector('#dashboard-streak').textContent,
      count: document.querySelector('#dashboard-practice-count').textContent
    }));
    assert.deepEqual(after, baseline);
    for (const [key,value] of Object.entries(seed)) assert.equal(await page.evaluate(k => localStorage.getItem(k), key), value);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).completed.length, State.PRACTICE_LIBRARY_KEY), 14);
    // Deep links survive reload and reflect practiced status; Core 8/8 is unchanged.
    await page.evaluate(() => { location.hash = '#library-activity-daily-web-input'; });
    await page.reload();
    assert.match(await page.locator('#daily-practice-workspace').innerText(), /Practiced/);
    assert.match(await page.locator('#daily-practice-workspace .section-label').innerText(), /PRACTICE MODE/);
    assert.match(await page.locator('#course-progress-text').innerText(), /8 \/ 8/);
    await page.locator('#daily-practice-workspace a[href="#practice-library"]').click();
    await page.waitForFunction(() => document.activeElement?.id === 'practice-library-title');
    assert.equal(await page.locator('#daily-practice-workspace').isVisible(), false);
    await checkOverflow();
    // Library practice, even of today's activity, cannot consume or multiply daily credit.
    await page.locator('#daily-challenge-card a[href="#daily-practice-workspace"]').click();
    const today = Library.challengeForDate('2026-10-10');
    await page.waitForFunction(title => document.querySelector('#daily-practice-title')?.textContent === title, today.title);
    await answer(today); await answer(today);
    let state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), State.DAILY_KEY);
    assert.equal(state.totalCompleted, 2); assert.equal(state.currentStreak, 2); assert.equal(state.records.length, 2);
    await page.clock.setFixedTime(new Date('2026-10-11T16:00:00Z'));
    await answer(today); assert.match(await page.locator('#daily-feedback').innerText(), /new calendar day/);
    await page.locator('#daily-challenge-card a[href="#daily-practice-workspace"]').click();
    const tomorrow = Library.challengeForDate('2026-10-11');
    await page.waitForFunction(title => document.querySelector('#daily-practice-title')?.textContent === title, tomorrow.title);
    assert.notEqual(tomorrow.id, today.id); await answer(tomorrow);
    state = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), State.DAILY_KEY);
    assert.equal(state.totalCompleted, 3); assert.equal(state.currentStreak, 3);
    assert.equal(await page.locator('#lab-overview').isVisible(), true);
    assert.equal(await page.locator('[data-practice-id="reconnaissance"].card').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(`${width}px: all 10 tracks/14 activities, keyboard/focus/help, free completion and persistence, unchanged daily/Core evidence, portfolio deduplication, daily credit and rollover passed`);
    await page.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
