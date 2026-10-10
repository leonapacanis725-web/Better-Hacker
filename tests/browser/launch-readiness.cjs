// Optional development tools: Playwright, axe-core and marked. No live signup is sent.
const { chromium }=require('playwright'), assert=require('node:assert/strict'), fs=require('node:fs');
const axe=require(process.env.AXE_CORE_PATH || 'axe-core');
const Portfolio=require('../../portfolio.js'), Library=require('../../challenges.js');
const url=process.env.BETTER_HACKER_TEST_URL || 'http://127.0.0.1:8000';
function contrast(a,b){
  const l=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const x=l(a),y=l(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
(async()=>{
  const {marked}=await import(require.resolve('marked'));
  const browser=await chromium.launch({...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox']});
  try{
    for(const width of [1280,1024,768,390,320]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}), errors=[];
      page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
      async function readable(control){const c=await control.evaluate(e=>({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));assert.ok(contrast(c.fg,c.bg)>=4.5,`${width}px: ${JSON.stringify(c)}`);}
      const start=page.locator('a.primary-button[href="#daily-practice-workspace"]');
      await readable(start);await start.hover();await readable(start);await page.mouse.move(0,0);await start.focus();await readable(start);
      assert.notEqual(await start.evaluate(e=>getComputedStyle(e).outlineStyle),'none');
      await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('#daily-practice-workspace').hidden);
      assert.equal(await page.locator(':focus').getAttribute('id'),'daily-practice-title');
      const button=page.locator('#daily-practice-form button');await readable(button);await button.evaluate(e=>e.disabled=true);await readable(button);await button.evaluate(e=>e.disabled=false);
      const date=await page.evaluate(()=>BetterHackerState.localDateKey(new Date())), activity=Library.challengeForDate(date);
      await page.locator(`input[name="daily-evidence"][value="${activity.evidenceIndex}"]`).check();await page.locator(`input[name="daily-answer"][value="${activity.correctIndex}"]`).check();
      await page.locator('#daily-reasoning').fill('The supplied evidence supports review, not proof of compromise.');await button.click();
      assert.equal(await page.locator('#daily-feedback').getAttribute('role'),'status');assert.match(await page.locator('#daily-feedback').innerText(),/Completion saved/);
      const next=page.locator('#daily-practice-next a.primary-button');await readable(next);await next.hover();await readable(next);await page.mouse.move(0,0);await next.focus();await readable(next);
      const secondary=page.locator('#daily-practice-next a.secondary-button');await secondary.hover();await readable(secondary);await page.mouse.move(0,0);
      for(const [href,action] of [['#learn','Explore Lessons →'],['#labs','Start Practicing →'],['#dashboard','View Dashboard →'],['#coach','Open Learning Assistant →']]){
        const card=page.locator(`#platform-entry-points a[href="${href}"]`);
        assert.equal(await card.getAttribute('aria-label'),null);assert.ok((await card.ariaSnapshot()).includes(action));
        await card.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert.notEqual(await card.evaluate(e=>getComputedStyle(e).boxShadow),'none');await page.keyboard.press('Enter');
        await page.waitForFunction(href=>location.hash===href,href);assert.ok(await page.locator(href).isVisible());
      }
      for(const card of await page.locator('a.card').all()){
        assert.equal(await card.getAttribute('aria-label'),null);
        assert.equal(await card.locator('[aria-hidden="true"]').count(),0);
        assert.equal(await card.locator('a,button,input,textarea,select').count(),0);
      }
      await page.addScriptTag({content:axe.source});
      const a11y=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}});return{violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),manual:r.incomplete.length};});
      assert.deepEqual(a11y.violations,[],JSON.stringify(a11y.violations));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);await page.close();console.log(`${width}px: normal/hover/focus/disabled contrast, navigation-card names/keyboard, dynamic daily next steps and axe scan passed (${a11y.manual} rule types need manual review)`);
    }
    const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
    let requests=0,status=503;await page.route('https://formspree.io/**',async route=>{requests++;await route.fulfill({status,contentType:'application/json',body:'{}'});});
    await page.locator('#waitlist-email').fill('not-an-email');await page.locator('#waitlist-button').click();assert.equal(requests,0);assert.match(await page.locator('#waitlist-result').innerText(),/complete email/);
    await page.locator('#waitlist-email').fill('Learner@Example.test');await page.locator('#waitlist-button').click();await page.waitForFunction(()=>document.querySelector('#waitlist-button').textContent==='Retry Joining');
    assert.equal(await page.evaluate(()=>localStorage.getItem('betterHackerWaitlistEmail')),null);status=200;
    await page.locator('#waitlist-button').click();await page.waitForFunction(()=>document.querySelector('#waitlist-button').textContent==='Update Waitlist Email');
    assert.equal(requests,2);assert.equal(await page.evaluate(()=>localStorage.getItem('betterHackerWaitlistEmail')),'learner@example.test');
    for(const file of ['privacy.html','terms.html']){await page.goto(new URL(file,url.endsWith('/')?url:url+'/').href);await page.addScriptTag({content:axe.source});const violations=await page.evaluate(async()=>{const r=await axe.run();return r.violations.map(v=>v.id);});assert.deepEqual(violations,[]);await page.locator('a[href="index.html"]').click();}
    const example={activityId:'lesson-networking',title:'My "quoted" [notes] & <script>\n# injected heading',commands:'cat notes.txt',findings:'[click](javascript:alert(1)) <img src=x onerror="window.__exportXss=true"> **literal**',learned:'Document evidence & uncertainty.',completedAt:'2026-10-10'};
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('betterHackerNetworkingComplete','true'));await page.reload();
    await page.locator('[data-portfolio-add="lesson-networking"]').click();
    await page.locator('#portfolio-form input[name="title"]').fill('My "quoted" [notes] & <script>');
    await page.locator('#portfolio-form textarea[name="findings"]').fill(example.findings);
    await page.locator('#portfolio-form textarea[name="learned"]').fill(example.learned);
    await page.locator('#portfolio-form input[name="completedAt"]').fill(example.completedAt);
    await page.locator('#portfolio-form button[type="submit"]').click();await page.locator('#portfolio-builder [data-portfolio-export]').click();
    const preview=await page.locator('#readme-preview code').innerText();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedMarkdown=text;}}}));
    await page.locator('[data-copy-readme]').click();assert.equal(await page.evaluate(()=>window.__copiedMarkdown),preview);
    const pendingDownload=page.waitForEvent('download');await page.locator('[data-download-readme]').click();
    const download=await pendingDownload;assert.equal(fs.readFileSync(await download.path(),'utf8'),preview);
    assert.match(marked.parse(preview,{gfm:true}),/Related Better Hacker Activity/);
    const rendered=marked.parse(Portfolio.markdown(example),{gfm:true});await page.setContent(rendered);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('a,img,script,input,button').count(),0);
    assert.equal(await page.locator('h1').innerText(),'My "quoted" [notes] & <script> # injected heading');
    assert.ok((await page.locator('body').innerText()).includes(example.findings));
    assert.match(await page.locator('blockquote').innerText(),/not professional employment experience/);
    assert.deepEqual(errors,[]);await page.close();console.log('Legal pages, mocked signup failure/success and preview/copy/download and standalone GFM rendering passed; zero live signups');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
