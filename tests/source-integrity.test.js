const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('script.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const achievements = fs.readFileSync('achievements.js', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

function contrastRatio(first, second) {
  const luminance = hex => {
    const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function reviewQuestions() {
  const start = script.indexOf('const COURSE_REVIEW_QUESTIONS = ');
  const end = script.indexOf('\n];', start) + 3;
  const declaration = script.slice(start, end).replace('const COURSE_REVIEW_QUESTIONS', 'questions');
  const context = {};
  vm.runInNewContext(declaration, context);
  return context.questions;
}

test('review has 12-16 complete, mixed questions covering all lessons', () => {
  const questions = reviewQuestions();
  assert.equal(questions.length, 14);
  assert.deepEqual([...new Set(questions.map(q => q.topic))].sort(), [
    'Active Directory', 'Cryptography', 'Cybersecurity Fundamentals', 'Linux',
    'Networking', 'SOC & SIEM', 'Security Testing', 'Web Security'
  ]);
  assert.deepEqual([...new Set(questions.map(q => q.type))].sort(), ['choice', 'short']);
  assert.equal(new Set(questions.map(q => q.id)).size, 14);
  assert.ok(questions.every(q => q.id));
  questions.forEach(q => {
    assert.ok(q.prompt && q.why && q.misconception && q.lesson);
    assert.ok(q.type === 'choice' ? Number.isInteger(q.answer) && q.options[q.answer] : q.answers.length);
  });
});

test('assessment contains start, submit, advance, scoring, completion, and restoration paths', () => {
  for (const token of ['startCourseReview', 'submitReviewAnswer', 'renderReviewQuestion',
    'reviewScore++', 'finishCourseReview', 'localStorage.setItem(COURSE_REVIEW_STORAGE_KEY',
    'readReviewResult()', 'showStoredReviewResult()', 'Review Again']) assert.match(script, new RegExp(token.replace(/[()++]/g, '\\$&')));
  assert.match(html, /id="start-course-review"/);
  assert.match(html, /aria-live="polite"/);
});

test('dashboard, achievement, recommendation order, and reset integrate review state', () => {
  assert.match(html, /id="dashboard-review-status"/);
  assert.match(achievements, /Knowledge Checkpoint/);
  assert.match(script, /achievement-unlocked/);
  const order = ['if (nextLesson)', 'exercisesCompleted < GUIDED_EXERCISE_TOTAL', 'investigationsCompleted < INVESTIGATIONS.length', '!reviewResult'];
  let position = -1;
  order.forEach(token => { const next = script.indexOf(token, position + 1); assert.ok(next > position); position = next; });
  assert.match(script, /key\.startsWith\("betterHacker"\)/);
  assert.match(script, /key !== "betterHackerWaitlistEmail"/);
});

test('existing curriculum totals and waitlist endpoint remain intact', () => {
  assert.equal((html.match(/class="card lesson-card"/g) || []).length, 8);
  assert.match(script, /LESSON_PROGRESS\.length.*Lessons Completed/);
  assert.match(script, /Guided exercises completed:.*GUIDED_LABS\.length/s);
  assert.equal((script.match(/InvestigationComplete"/g) || []).length >= 7, true);
  assert.match(script, /https:\/\/formspree\.io\/f\/xdeobdjl/);
  assert.doesNotMatch(script, /querySelector\("\.lab-challenge"\)/);
  assert.match(html, /<main id="main-content" tabindex="-1">/);
  for (const page of ['privacy.html', 'terms.html']) {
    assert.match(fs.readFileSync(page, 'utf8'), /<main id="main-content"[^>]*tabindex="-1">/);
  }
  assert.ok(fs.existsSync('privacy.html'));
  assert.ok(fs.existsSync('terms.html'));
});

test('representative answers calculate the expected score', () => {
  const questions = reviewQuestions();
  const attempts = questions.map(q => q.type === 'choice' ? q.answer : q.answers[0]);
  const score = questions.reduce((total, q, i) => total + (q.type === 'choice'
    ? Number(attempts[i]) === q.answer
    : q.answers.includes(String(attempts[i]).trim().toLowerCase())) , 0);
  assert.equal(score, questions.length);
  assert.equal(Math.round(score / questions.length * 100), 100);
});

test('footer copy meets WCAG AA contrast against its background', () => {
  const footerColor = css.match(/footer p\s*{[^}]*color:\s*(#[\da-f]{6})/i)?.[1];
  const footerBackground = css.match(/footer\s*{[^}]*background:\s*(#[\da-f]{6})/i)?.[1];
  assert.ok(footerColor && footerBackground);
  assert.ok(contrastRatio(footerColor, footerBackground) >= 4.5);
});


test('every core lesson exposes a connected, accessible learning sequence', () => {
  const lessonIds = ['fundamentals','networking','linux','web-security','cryptography','active-directory','soc-siem','security-testing'];
  for (const id of lessonIds) {
    const start = html.indexOf(`<section id="${id}-lesson"`);
    assert.ok(start >= 0, `missing ${id}`);
    const end = html.indexOf('</section>', start);
    const lesson = html.slice(start, end);
    for (const part of ['Prerequisites:', 'Learning objectives', 'Why this matters in cybersecurity', 'Try It — safe analysis', 'Knowledge Check', 'Lesson recap', 'Recommended next activity:', 'View your Learner Dashboard']) {
      assert.ok(lesson.includes(part), `${id} missing ${part}`);
    }
    assert.match(lesson, /role="status" aria-live="polite"/);
  }
  assert.equal((html.match(/type="button"\s+class="primary-button"/g) || []).length >= 8, true);
});

test('investigations expose idempotent completion, evidence guidance, and Start or Review navigation', () => {
  assert.match(script, /function completeInvestigation\(key\)/);
  assert.match(script, /Evidence analysis:/);
  assert.match(script, /complete \? 'Review' : 'Start'/);
  assert.match(script, /review without duplicate XP/);
});


test('supplemental lessons remain complete, clickable, and dashboard-integrated', () => {
  for (const id of ['computer-tools', 'incident-response']) {
    assert.match(html, new RegExp('class="card extension-lesson-card" data-extension-id="' + id + '"'));
    assert.match(html, new RegExp('class="lesson-block knowledge-check extension-check" data-extension-id="' + id + '"'));
  }
  for (const heading of ['Learning objectives', 'Why this matters in cybersecurity', 'Important terminology', 'Try It:', 'Knowledge check:', 'Recap', 'Recommended next activity:']) {
    assert.ok(html.includes(heading), `missing supplemental lesson element: ${heading}`);
  }
  assert.match(html, /id="dashboard-extension-lessons"/);
  assert.match(script, /const EXTENSION_LESSONS = Object\.freeze/);
  assert.match(script, /betterHackerComputerToolsLessonComplete/);
  assert.match(script, /betterHackerIncidentResponseLessonComplete/);
  assert.match(script, /extensionLessonsCompleted/);
  assert.match(script, /const extensionLesson = EXTENSION_LESSONS\.find/);
  assert.match(script, /reviewing it does not award duplicate completion/);
  assert.equal((html.match(/class="card topic-link-card"/g) || []).length, 10);
  assert.equal((script.match(/const lesson = LESSON_PROGRESS\.find/g) || []).length, 1);
});


test('Learning Assistant has nine complete authored and accessible topic experiences', () => {
  assert.match(script, /const ASSISTANT_PROGRESS_KEY = "betterHackerLearningAssistantTopics"/);
  assert.match(script, /const ASSISTANT_TOPICS = Object\.freeze/);
  for (const id of ['fundamentals','networking','linux','web','crypto','ad','soc','testing','labs']) {
    assert.match(script, new RegExp('id:"' + id + '"'));
  }
  for (const field of ['explanation:','terms:','concepts:','tools:','scenario:','question:','options:','correct:','hint:','feedback:','nextTopic:','nextHref:']) {
    assert.equal((script.match(new RegExp(field, 'g')) || []).length >= 9, true, `missing authored field ${field}`);
  }
  for (const label of ['Beginner-friendly explanation','Important terminology','Key concepts','Commands and tools','Example scenario','Try It — quick knowledge check','Show Hint','Next step']) {
    assert.ok(script.includes(label), `missing rendered section ${label}`);
  }
  assert.match(script, /Learning Assistant Topics: /);
  assert.match(script, /aria-pressed="false"/);
  assert.match(script, /aria-controls="coach-topic-view"/);
  assert.match(script, /role="status" aria-live="polite"/);
  assert.match(script, /Objective → Evidence → Investigation → Hint → Decision → Review/);
  assert.match(script, /nextHref:"#labs"/);
  assert.equal((script.match(/coachInterface\.addEventListener\("click"/g) || []).length, 1);
  assert.equal((script.match(/coachInterface\.addEventListener\("submit"/g) || []).length, 1);
});

test('beginner benefit cards are accessible links to existing learning experiences', () => {
  const sectionStart = html.indexOf('<section id="platform-entry-points"');
  const sectionEnd = html.indexOf('</section>', sectionStart);
  const section = html.slice(sectionStart, sectionEnd);
  assert.ok(sectionStart >= 0);
  for (const destination of ['#learn', '#labs', '#dashboard', '#coach']) {
    assert.match(section, new RegExp('href="' + destination + '"'));
    assert.match(html, new RegExp('id="' + destination.slice(1) + '"'));
  }
  for (const action of ['Explore Lessons →', 'Start Practicing →', 'View Dashboard →', 'Open Learning Assistant →']) {
    assert.ok(section.includes(action), `missing card action: ${action}`);
  }
  assert.equal((section.match(/class="card platform-entry-card"/g) || []).length, 4);
  assert.doesNotMatch(section, /Better Hacker Coach/);
  assert.match(css, /\.platform-entry-card:focus-visible/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('remaining dashboard summaries and practice cards expose valid navigation actions', () => {
  const dashboard = html.slice(html.indexOf('<div class="dashboard-grid"'), html.indexOf('</div>', html.indexOf('<div class="dashboard-grid"')));
  for (const [destination, label] of [
    ['#learn', 'Explore lessons →'],
    ['#labs', 'Practice in guided labs →'],
    ['#investigation-overview-title', 'Explore investigations →']
  ]) {
    assert.ok(dashboard.includes(`href="${destination}"`));
    assert.ok(dashboard.includes(label));
  }

  const labsStart = html.indexOf('<section id="labs"');
  const overview = html.slice(labsStart, html.indexOf('<a href="#coach"', labsStart));
  for (const [destination, label] of [
    ['#security-testing-lesson', 'Start Security Testing →'],
    ['#investigation-network', 'Practice Network Analysis →'],
    ['#lab-linux', 'Start Linux Practice →'],
    ['#investigation-soc', 'Explore Defensive Investigations →']
  ]) {
    assert.ok(overview.includes(`href="${destination}"`));
    assert.ok(overview.includes(label));
  }
  assert.equal((overview.match(/class="card action-card"/g) || []).length, 4);
  assert.match(script, /hash === "#lab-" \+ lab\.id/);
  for (const id of ['network', 'soc']) assert.match(script, new RegExp('anchor: "investigation-' + id + '"'));
  assert.match(css, /\.action-card:focus-visible/);
});
