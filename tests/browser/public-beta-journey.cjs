// Optional Playwright/Chromium tooling; exercises real UI without external signups.
const {chromium}=require('playwright'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const Library=require('../../challenges.js');
const url=process.env.BETTER_HACKER_TEST_URL || 'http://127.0.0.1:8000';
const source=fs.readFileSync(require.resolve('../../script.js'),'utf8');
const start=source.indexOf('const COURSE_REVIEW_QUESTIONS = ['), end=source.indexOf('\n];',start)+3, scope={};
vm.runInNewContext(source.slice(start,end).replace('const COURSE_REVIEW_QUESTIONS','questions'),scope);
(async()=>{
 const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
 try {
  for(const width of [1280,1024,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}), errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
   assert.equal(await page.locator('#course-progress-text').innerText(),'0 / 8 Lessons Completed');
   await page.locator('.hero a[href="#learn"]').click();
   await page.waitForFunction(()=>location.hash==='#learn');
   assert.equal(await page.evaluate(()=>document.querySelector('#learn').getBoundingClientRect().top >= document.querySelector('.navbar').getBoundingClientRect().bottom),true,'Learn destination must clear the fixed navigation');
   assert.match(await page.locator('.hero').innerText(),/No account needed/);
   assert.equal(await page.locator('#pricing a.primary-button').getAttribute('href'),'#learn');
   assert.equal(await page.locator('#pricing a.secondary-button').innerText(),'Join Updates Waitlist');
   assert.equal(await page.locator('#portfolio-projects .portfolio-empty').count(),1);
   const path=page.locator('nav[aria-labelledby="beginner-path-title"]');
   for(const link of await path.locator('a').all()) assert.equal(await page.locator(await link.getAttribute('href')).count(),1);
   await path.getByRole('link',{name:'Learn your first concept'}).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>location.hash==='#fundamentals-lesson');
   assert.equal(await page.locator(':focus').evaluate(e=>e.tagName),'H2');
   await page.locator('#fundamentals-check-answer').fill('wrong');await page.locator('#fundamentals-check-button').click();
   assert.match(await page.locator('#course-progress-text').innerText(),/^0 \/ 8/);
   for(const [id,answer] of [['fundamentals','least privilege'],['network','443'],['linux','cat'],['web','SQLi'],['crypto','encryption'],['ad','user account'],['soc','SIEM'],['testing','written authorization']]){
    await page.locator('#'+id+'-check-answer').fill(answer);await page.locator('#'+id+'-check-button').click();
   }
   assert.match(await page.locator('#dashboard-lessons').innerText(),/8 \/ 8/);
   const xpBefore=await page.locator('#dashboard-xp').innerText();
   for(const [id,count] of [['reconnaissance',3],['network-analysis',4],['linux-challenges',4],['defensive-security',4]]){
    await page.locator(`#labs a[href="#practice-${id}"]`).click();
    await page.waitForFunction(id=>location.hash==='#practice-'+id,id);
    assert.equal(await page.locator(':focus').evaluate(e=>e.tagName),'H2');
    for(let i=0;i<count;i++)await page.locator(`input[name="${id}-${i}"][value="0"]`).check();
    await page.locator(`form[data-practice-id="${id}"] button`).click();
    assert.match(await page.locator(`form[data-practice-id="${id}"] .practice-feedback`).innerText(),/Correct/);
    await page.locator(`#practice-${id} [data-practice-help]`).click();
    assert.equal(await page.evaluate(()=>BetterHackerCompanionInstance.getContext().activityId),id);
   }
   assert.equal(await page.locator('#dashboard-hands-on').innerText(),'4 / 4 completed');
   assert.equal(await page.locator('#dashboard-xp').innerText(),xpBefore);
   await page.locator('.coach-topic[data-topic="networking"]').click();
   await page.locator('.coach-topic-check[data-topic="networking"] input[value="0"]').check();
   await page.locator('.coach-topic-check[data-topic="networking"] button[type="submit"]').click();
   assert.equal(await page.locator('#dashboard-topics').innerText(),'1 / 9 completed');
   // Free practice is immediately visible in the dashboard, with no daily credit.
   await page.evaluate(()=>location.hash='#library-activity-daily-dns');
   await page.waitForFunction(()=>document.querySelector('#daily-practice-form'));
   const activity=Library.activityById('daily-dns');
   await page.locator(`input[name="daily-evidence"][value="${activity.evidenceIndex}"]`).check();
   await page.locator(`input[name="daily-answer"][value="${activity.correctIndex}"]`).check();
   await page.locator('#daily-reasoning').fill('The fictional DNS record points to name resolution before web access.');
   await page.locator('#daily-practice-form button').click();
   assert.equal(await page.locator('#dashboard-library').innerText(),'1 / 14 practiced');
   assert.equal(await page.locator('#dashboard-xp').innerText(),xpBefore);
   for(const [id,answer] of [['linux','cat flag.txt'],['networking','80'],['cryptography','encryption'],['web-security','sqli']]){
    await page.evaluate(id=>location.hash='#lab-'+id,id);await page.locator('#lab-answer').fill(answer);
    await page.locator('#submit-answer').click();await page.locator('#complete-lab').click();
   }
   for(const [id,answer] of [['soc','investigate'],['network','4444'],['phishing','phishing'],['windows','investigate'],['malware','investigate'],['brute-force','bruteforce'],['web-attack','sqli']])await page.locator('.'+id+'-answer[data-answer="'+answer+'"]').click();
   await page.locator('#start-course-review').click();
   for(const q of scope.questions){
    if(q.type==='choice')await page.locator('input[name="review-answer"][value="'+q.answer+'"]').check();
    else await page.locator('#review-short-answer').fill(q.answers[0]);
    await page.locator('#submit-review-answer').click();await page.locator('#next-review-question').click();
   }
   assert.equal(await page.locator('#core-path-count').innerText(),'20 / 20 activities completed');
   assert.equal(await page.locator('#dashboard-xp').innerText(),'2175 XP');
   await page.locator('#portfolio-github-guide summary').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('#portfolio-github-guide').getAttribute('open'),'');
   assert.match(await page.locator('#portfolio-github-guide').innerText(),/README.md/);
   await page.evaluate(()=>{const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(options){if(this.id==='portfolio-builder')window.__builderScroll=options.behavior;return original.call(this,options);};});
   await page.locator('[data-portfolio-add="lesson-networking"]').click();
   assert.equal(await page.evaluate(()=>window.__builderScroll),'auto');
   await page.locator('#portfolio-form textarea[name="investigation"]').fill('Read the supplied networking scenario.');
   await page.locator('#portfolio-form textarea[name="findings"]').fill('Port 443 supports the HTTPS answer.');
   await page.locator('#portfolio-form textarea[name="learned"]').fill('A port is a clue, not proof of an application.');
   await page.locator('#portfolio-form button[type="submit"]').click();
   assert.match(await page.locator('#dashboard-portfolio-ready').innerText(),/1 portfolio ready/);
   await page.locator('#portfolio-builder [data-portfolio-export]').click();
   assert.equal(await page.locator(':focus').innerText(),'README Preview');
   assert.match(await page.locator('#readme-preview code').innerText(),/not professional employment experience/);
   // Missing API, rejected write and synchronous exceptions must all explain a fallback.
   for(const kind of ['missing','rejected','throw']){
    await page.evaluate(()=>document.querySelector('#portfolio-status').textContent='');
    await page.evaluate(kind=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:kind==='missing'?undefined:{writeText:()=>{if(kind==='throw')throw Error('Blocked');return Promise.reject(Error('Blocked'));}}}),kind);
    await page.locator('[data-copy-readme]').click();
    await page.waitForFunction(()=>document.querySelector('#portfolio-status').textContent.includes('Clipboard unavailable'));
   }
   await page.locator('[data-portfolio-close]').click();
   assert.equal(await page.locator(':focus').getAttribute('data-portfolio-view'),'lesson-networking');
   await page.locator('#portfolio-eligible [data-portfolio-add="lesson-networking"]').isDisabled().then(disabled=>assert.equal(disabled,true));
   await page.reload();
   for(const [id,text] of [['dashboard-hands-on','4 / 4 completed'],['dashboard-library','1 / 14 practiced'],['dashboard-topics','1 / 9 completed'],['core-path-count','20 / 20 activities completed'],['dashboard-xp','2175 XP']])assert.equal(await page.locator('#'+id).innerText(),text);
   assert.equal(await page.locator('.portfolio-card').count(),1);
   const dashboard=page.locator('.navbar a[href="#dashboard"]');await dashboard.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>location.hash==='#dashboard');
   assert.equal(await page.evaluate(()=>document.querySelector('#dashboard').getBoundingClientRect().top >= document.querySelector('.navbar').getBoundingClientRect().bottom),true,'Dashboard destination must clear the fixed navigation');
   await page.locator('.portfolio-card [data-portfolio-edit]').click();
   page.once('dialog',dialog=>dialog.accept());await page.locator('[data-portfolio-remove]').click();
   assert.equal(await page.locator('.portfolio-card').count(),0);
   assert.equal(await page.locator(':focus').getAttribute('id'),'portfolio-title');
   assert.equal(await page.locator('#dashboard-xp').innerText(),'2175 XP');
   assert.equal(await page.locator('#core-path-count').innerText(),'20 / 20 activities completed');
   const unresolved=await page.evaluate(()=>Array.from(document.querySelectorAll('a[href^="#"]')).map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));
   assert.deepEqual(unresolved,[]);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
   assert.deepEqual(errors,[]);await page.close();console.log(`${width}px: fresh onboarding, Core 8/8 and full path, four practice activities, Topic Guide/library/dashboard synchronization, portfolio guidance/focus/clipboard and reload passed`);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
