const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const url=process.env.BETTER_HACKER_TEST_URL||'http://127.0.0.1:8000';
(async()=>{
 const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
 try{
  for(const width of [1280,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
   await page.locator('#attack-box').scrollIntoViewIfNeeded();
   const input=page.locator('#attack-command');await input.focus();await input.fill('pwd');await input.press('Enter');
   assert.match(await page.locator('#attack-output').innerText(),/\/home\/learner/);
   await input.fill('sudo id');await input.press('Enter');assert.match(await page.locator('#attack-status').innerText(),/did not run/);
   await input.fill('ls; id');await input.press('Enter');assert.match(await page.locator('#attack-output').innerText(),/Input not recognized/);
   await page.locator('#attack-reset').click();assert.equal(await page.locator('#attack-output').innerText().includes('pwd'),false);
   for(const command of ['pwd','ls /home/learner','cd /home/learner','cat notes.txt']){await input.fill(command);await input.press('Enter');}
   assert.match(await page.locator('#attack-status').innerText(),/50 XP earned and saved/);
   const xp=await page.locator('#dashboard-xp').innerText();assert.match(xp, /50 XP/);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('betterHackerAttackBoxState')));
   assert.deepEqual(saved.completed,['linux-navigation']);
   await input.focus();await page.keyboard.press('ArrowUp');assert.equal(await input.inputValue(),'cat notes.txt');
   await page.locator('#attack-reset').click();assert.equal(await page.locator('#dashboard-xp').innerText(),xp);
   assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('betterHackerAttackBoxState')).completed),['linux-navigation']);
   await page.reload();await page.locator('#attack-box').scrollIntoViewIfNeeded();assert.match(await page.locator('#attack-complete').innerText(),/Completed before/);
   await page.evaluate(()=>localStorage.setItem('betterHackerLinuxComplete','true'));await page.reload();
   await page.locator('[data-portfolio-add="lesson-linux"]').click();
   await page.locator('#portfolio-form input[name="title"]').fill('Linux File Review');
   await page.locator('#portfolio-form textarea[name="investigation"]').fill('Reviewed the fictional training notes.');
   await page.locator('#portfolio-form textarea[name="findings"]').fill('The notes were located in the learner home directory.');
   await page.locator('#portfolio-form textarea[name="learned"]').fill('Start by checking the current path, then inspect the supplied files.');
   await page.locator('#portfolio-form button[type="submit"]').click();
   await page.locator('.portfolio-card [data-portfolio-github]').click();
   assert.match(await page.locator('#github-publish-preview').innerText(),/Direct GitHub publishing is unavailable/);
   assert.match(await page.locator('#github-publish-preview').innerText(),/Suggested repository name: linux-file-review/);
   assert.equal(await page.locator('#github-file-preview').count(),0);
   assert.equal(await page.locator('#github-publish-preview details').count(),2);
   assert.match(await page.locator('#github-publish-preview').innerText(),/README\.md/);
   assert.match(await page.locator('#github-publish-preview').innerText(),/findings\.md/);
   assert.match(await page.locator('#github-publish-preview').innerText(),/New repository/);
   const download=page.waitForEvent('download');await page.locator('[data-github-download="findings.md"]').click();assert.equal((await download).suggestedFilename(),'findings.md');
   await page.locator('#attack-help').click();assert.equal(await page.evaluate(()=>location.hash),'#coach');assert.equal(await page.evaluate(()=>BetterHackerCompanionInstance.getContext().type),'attack-box');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`No horizontal overflow at ${width}px`);
   assert.equal(await input.isVisible(),true);assert.equal(await page.locator('label[for="attack-command"]').count(),1);assert.deepEqual(errors,[]);
   await page.close();console.log(`${width}px: simulated commands, validation, keyboard history, completion, reset, persistence, XP and overflow passed`);
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
