const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Portfolio = require('../portfolio.js');
const html = fs.readFileSync('index.html','utf8'), css=fs.readFileSync('style.css','utf8');
const privacy=fs.readFileSync('privacy.html','utf8');

test('all static navigation cards use their visible text as their accessible name',()=>{
  const cards=[...html.matchAll(/<a\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
  assert.ok(cards.length>=20);
  for(const card of cards){assert.doesNotMatch(card,/aria-label=|aria-hidden="true"|tabindex="-1"/);assert.doesNotMatch(card.slice(card.indexOf('>')+1),/<(?:a|button|input|textarea|select)\b/);assert.match(card,/href="#/);}
});

test('review-panel ordinary link styling excludes both primary and secondary button links',()=>{
  assert.match(css,/\.review-panel a:not\(\.primary-button\):not\(\.secondary-button\)/);
  assert.doesNotMatch(css,/\.review-panel a\s*\{/);
});

test('every portfolio activity exports a standalone educational record without site-only navigation',()=>{
  for(const activity of Portfolio.ACTIVITIES){
    const p={activityId:activity.id,title:activity.title,findings:'Observed supplied evidence.',learned:'Document uncertainty.',completedAt:'2026-10-10'};
    const md=Portfolio.markdown(p);
    assert.match(md,/^# .+\n\n> Educational work completed through Better Hacker\./);
    assert.match(md,/not professional employment experience or independent certification/);
    assert.match(md,/## Related Better Hacker Activity\n\n/);
    assert.doesNotMatch(md,/\]\(#|data-portfolio|href=|View Project|Edit Project|Copy Markdown|Download \.md/);
    assert.match(md,/## Findings\n\nObserved supplied evidence\./);assert.match(md,/## Completion Date\n\n2026-10-10/);
  }
});

test('portfolio Markdown treats special characters and injected headings/HTML/links as learner text',()=>{
  const p={activityId:'lesson-networking',title:'"Quoted" [notes] & <script>\n# injected heading',findings:'[click](javascript:alert(1)) <img src=x onerror=alert(1)> **bold** `command`',commands:'dumpcap -D',learned:'Original text'};
  const before=JSON.stringify(p),md=Portfolio.markdown(p);
  assert.equal(JSON.stringify(p),before);
  assert.equal(md.split('\n').filter(line=>/^# /.test(line)).length,1);
  assert.doesNotMatch(md,/<script>|<img|\n# injected/);
  assert.match(md,/&amp; &lt;script&gt;/);assert.match(md,/\\\[click\\\]/);
  assert.match(md,/## Commands Used\n\ndumpcap -D/);
});

test('privacy describes current local data, external signup and actual reset/export controls',()=>{
  for(const text of ['Core Lessons','supplemental lessons','Hands-On Practice','guided labs','Topic Guide','Course Review','latest 60','Lifetime completion and XP','Practice Library','first completion date','Learner Portfolio','creation/update times','commands','findings','session-only','clipboard','Formspree','not included in this request','preserving your authored portfolio projects','Remove from Portfolio','does not undo an external waitlist submission']) assert.ok(privacy.includes(text),text);
  assert.match(html,/Joining sends your email to Formspree/);assert.match(html,/href="privacy.html">Read how your data/);
  assert.doesNotMatch(privacy,/mailto:|certified compliant|GDPR compliant|HIPAA compliant/i);
});

test('learner-facing production assets contain no accidental development endpoints or debug markers',()=>{
  for(const file of ['index.html','privacy.html','terms.html','script.js','portfolio-ui.js','daily-practice-ui.js','storage.js']){
    const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)|console\.log\(|TODO|FIXME/);
  }
  assert.match(fs.readFileSync('script.js','utf8'),/https:\/\/formspree\.io\/f\/xdeobdjl/);
  assert.doesNotMatch(fs.readFileSync('script.js','utf8'),/optional Daily Challenge XP/);
});
