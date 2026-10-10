// Optional Chromium regression checks; see README for runner prerequisites.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const State=require('../../learner-state.js');
const Library=require('../../challenges.js');
(async()=>{
const b=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE} : {}),args:['--no-sandbox']});
for(const width of [1280,1024,768,390,320]){
const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce',timezoneId:'America/Detroit'});await p.clock.install({time:new Date('2026-10-07T16:00:00Z')});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.BETTER_HACKER_TEST_URL || 'http://127.0.0.1:8000');
await p.evaluate(()=>localStorage.setItem('unrelated','preserve'));await p.reload();
const cardTitle=await p.locator('#daily-challenge-card h3').innerText();await p.reload();assert.equal(await p.locator('#daily-challenge-card h3').innerText(),cardTitle);
const start=p.locator('#daily-challenge-card a[href="#daily-practice-workspace"]');await start.focus();await p.keyboard.press('Enter');assert.equal(await p.locator(':focus').getAttribute('id'),'daily-practice-title');
const activity=Library.challengeForDate('2026-10-07');
const hint=p.locator('#daily-practice-workspace summary');await hint.focus();await p.keyboard.press('Enter');assert.equal(await hint.evaluate(el=>el.parentElement.open),true);
async function answer(wrong=false){await p.locator(`input[name="daily-evidence"][value="${wrong ? (activity.evidenceIndex+1)%3 : activity.evidenceIndex}"]`).check();await p.locator(`input[name="daily-answer"][value="${activity.correctIndex}"]`).check();await p.locator('#daily-reasoning').fill('The supplied event sequence supports review, not proof.');await p.locator('#daily-practice-form button').click();}
await answer(true);assert.match(await p.locator('#daily-feedback').innerText(),/Not quite/);assert.equal(await p.evaluate(()=>localStorage.getItem('betterHackerDailyChallengeState')),null);
await answer();assert.match(await p.locator('#daily-feedback').innerText(),/50 XP awarded/);await answer();assert.match(await p.locator('#daily-feedback').innerText(),/no duplicate XP/);
assert.match(await p.locator('#dashboard-practice-count').innerText(),/: 1/);assert.match(await p.locator('#dashboard-xp').innerText(),/50 XP/);assert.match(await p.locator('#course-progress-text').innerText(),/0 \/ 8/);
await p.locator('[data-daily-help]').click();assert.equal(await p.locator('.coach-topic[aria-pressed="true"]').getAttribute('data-topic'),activity.assistantTopic);
await p.locator('#daily-practice-history a').click();await p.waitForFunction(()=>document.querySelector('#daily-practice-workspace .section-label')?.textContent.includes('REVIEW'));await answer();assert.match(await p.locator('#daily-feedback').innerText(),/Review only/);
if(activity.portfolio){await p.locator('#daily-practice-next [data-portfolio-add]').click();assert.equal(await p.locator('#portfolio-builder').isVisible(),true);await p.locator('[data-portfolio-close]').click();await p.locator('#daily-practice-next [data-portfolio-add]').click();assert.equal(await p.locator('.portfolio-card').count(),1);await p.locator('[data-portfolio-close]').click();}
await p.reload();assert.match(await p.locator('#daily-challenge-card').innerText(),/Completed today/);assert.equal(await p.locator('#daily-practice-history li').count(),1);
// Preview every authored activity through its review route, no credit or overflow.
for(const a of Library.CHALLENGES){await p.evaluate(id=>location.hash='#daily-practice-'+id,a.id);await p.waitForFunction(title=>document.querySelector('#daily-practice-title')?.textContent===title,a.title);assert.equal(await p.locator('#daily-practice-form fieldset').count(),2);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${a.id} overflow`);}
assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('betterHackerDailyChallengeState')).totalCompleted),1);
// Local midnight invalidates an open today's form; next day earns once and streak advances.
await p.evaluate(()=>location.hash='#daily-practice-workspace');await p.locator('input[name="daily-evidence"][value="0"]').check();await p.locator('input[name="daily-answer"][value="0"]').check();await p.locator('#daily-reasoning').fill('Evidence needs investigation and source verification.');
await p.clock.setFixedTime(new Date('2026-10-08T16:00:00Z'));await p.locator('#daily-practice-form button').click();assert.match(await p.locator('#daily-feedback').innerText(),/new calendar day/);
await p.locator('#daily-challenge-card a[href="#daily-practice-workspace"]').click();const next=Library.challengeForDate('2026-10-08');assert.equal(await p.locator('#daily-practice-title').innerText(),next.title);await p.locator(`input[name="daily-evidence"][value="${next.evidenceIndex}"]`).check();await p.locator(`input[name="daily-answer"][value="${next.correctIndex}"]`).check();await p.locator('#daily-reasoning').fill('The supplied records support investigation.');await p.locator('#daily-practice-form button').click();assert.match(await p.locator('#daily-practice-summary').innerText(),/streak: 2 days/);
// Fully completed lessons retain 8/8 independently of daily practice.
await p.evaluate(()=>['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting'].forEach(name=>localStorage.setItem('betterHacker'+name+'Complete','true')));await p.reload();assert.match(await p.locator('#course-progress-text').innerText(),/8 \/ 8/);assert.equal(await p.evaluate(()=>localStorage.getItem('unrelated')),'preserve');assert.equal(await p.locator('#lab-overview').isVisible(),true);assert.equal(await p.locator('[data-practice-id="reconnaissance"].card').isVisible(),true);assert.deepEqual(errors,[]);
console.log(`${width}px: daily/review flows, keyboard, hint/help, portfolio deduplication, all 14 activities, no overflow, rollover, 2-day streak, 8/8 and preserved storage passed`);await p.close();
}await b.close();})().catch(e=>{console.error(e);process.exit(1)});
