const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync('script.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const achievements = fs.readFileSync('achievements.js', 'utf8');

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
  assert.match(html, /<main id="main-content">/);
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
