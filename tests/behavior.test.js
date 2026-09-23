const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const BetterHackerState = require('../learner-state.js');
const BetterHackerChallenges = require('../challenges.js');
const BetterHackerMilestones = require('../achievements.js');
const BetterHackerCompanion = require('../companion.js');

class FakeElement {
  constructor() {
    this.value = '';
    this.textContent = '';
    this.className = '';
    this.disabled = false;
    this.style = {};
    this.attributes = {};
    this.dataset = {};
    this.listeners = {};
    this.parentElement = this;
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  dispatch(type, extra = {}) {
    const event = { preventDefault() {}, key: extra.key, target: this };
    return Promise.all((this.listeners[type] || []).map(listener => listener(event)));
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name]; }
  focus() { this.focused = true; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  appendChild() {}
  insertAdjacentElement() {}
  insertBefore() {}
  remove() { this.removed = true; }
}

class MemoryStorage {
  constructor(seed = {}) { Object.assign(this, seed); }
  getItem(key) { return Object.prototype.hasOwnProperty.call(this, key) ? String(this[key]) : null; }
  setItem(key, value) { this[key] = String(value); }
  removeItem(key) { delete this[key]; }
  key(index) { return Object.keys(this)[index] || null; }
  get length() { return Object.keys(this).length; }
}

function boot({ seed = {}, elements = {}, fetchImpl = async () => ({ ok: true, status: 200 }) } = {}) {
  let ready;
  const createdElements = [];
  const document = {
    addEventListener(type, listener) { if (type === 'DOMContentLoaded') ready = listener; },
    querySelector(selector) { return elements[selector] || null; },
    querySelectorAll() { return []; },
    activeElement: null,
    createElement() { const element = new FakeElement(); createdElements.push(element); return element; },
    createTextNode(text) { return { textContent: text }; }
  };
  const localStorage = new MemoryStorage(seed);
  const exposed = source.replace(/\n\}\);\s*$/, `\n  globalThis.__app = { readCompletedLabs, readReviewResult, getDashboardState, isReviewAnswerCorrect, COURSE_REVIEW_QUESTIONS, GUIDED_LABS, getLabStatus, getLabAction, completeGuidedLab, INVESTIGATION_ACTIVITIES, getInvestigationStatus, getInvestigationAction, completeInvestigation };\n});`);
  const context = { document, localStorage, __createdElements: createdElements, fetch: fetchImpl, setTimeout: fn => fn(), clearTimeout() {}, confirm: () => true,
    location: { reload() {} }, console, Date, JSON, Number, Math, Object, String, RegExp, Set,
    BetterHackerState, BetterHackerChallenges, BetterHackerMilestones, BetterHackerCompanion };
  vm.createContext(context);
  vm.runInContext(exposed, context);
  ready();
  return { context, localStorage, elements };
}

function fundamentalElements() {
  return {
    '#fundamentals-check-button': new FakeElement(),
    '#fundamentals-check-answer': new FakeElement(),
    '#fundamentals-check-result': new FakeElement(),
    '#course-progress-text': new FakeElement(),
    '#course-progress-fill': new FakeElement(),
    '#course-progress-bar': new FakeElement()
  };
}

test('Fundamentals completes through click and Enter event paths and updates progress immediately', async () => {
  for (const submission of ['click', 'Enter']) {
    const elements = fundamentalElements();
    const { localStorage } = boot({ elements });
    elements['#fundamentals-check-answer'].value = submission === 'click' ? 'least privilege' : 'The principle of least privilege';
    if (submission === 'click') await elements['#fundamentals-check-button'].dispatch('click');
    else await elements['#fundamentals-check-answer'].dispatch('keydown', { key: 'Enter' });
    assert.equal(localStorage.getItem('betterHackerFundamentalsComplete'), 'true');
    assert.equal(elements['#course-progress-text'].textContent, '1 / 8 Lessons Completed');
    assert.match(elements['#fundamentals-check-result'].textContent, /Correct/);
  }
});

test('dashboard recommendation follows all learning phases using existing keys', () => {
  const { context, localStorage } = boot();
  assert.match(context.__app.getDashboardState().recommendation.label, /Cybersecurity Fundamentals/);
  const lessons = ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting'];
  lessons.forEach(name => localStorage.setItem(`betterHacker${name}Complete`, 'true'));
  assert.match(context.__app.getDashboardState().recommendation.label, /Guided Exercises/);
  localStorage.setItem('betterHackerCompletedLabs', '4');
  assert.match(context.__app.getDashboardState().recommendation.label, /Continue Investigation/);
  assert.equal(context.__app.getDashboardState().recommendation.target, '#investigation-soc-alert');
  ['Soc','Network','Phishing','Windows','Malware','BruteForce','WebAttack'].forEach(name => localStorage.setItem(`betterHacker${name}InvestigationComplete`, 'true'));
  assert.match(context.__app.getDashboardState().recommendation.label, /Course Review/);
});



test('completed curriculum recommends course review rather than completed activities', () => {
  const { context, localStorage } = boot({ seed: { betterHackerCompletedLabs: '4' } });
  ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting'].forEach(name => localStorage.setItem(`betterHacker${name}Complete`, 'true'));
  context.__app.INVESTIGATION_ACTIVITIES.forEach(item => localStorage.setItem(item.key, 'true'));
  assert.deepEqual(JSON.parse(JSON.stringify(context.__app.getDashboardState().recommendation)), { target: '#course-review', label: 'Start the Course Review' });
  const topics = {};
  context.__app.COURSE_REVIEW_QUESTIONS.forEach(question => {
    topics[question.topic] ||= { correct: 0, total: 0, lesson: question.lesson };
    topics[question.topic].correct++;
    topics[question.topic].total++;
  });
  localStorage.setItem('betterHackerCourseReviewResult', JSON.stringify({ completed:true, score:14, total:14, percentage:100, completedAt:new Date().toISOString(), topics }));
  const finalRecommendation = context.__app.getDashboardState().recommendation;
  assert.equal(finalRecommendation.target, '#course-review');
  assert.match(finalRecommendation.label, /Course Complete.*Review Course Again/);
});
test('malformed guided exercise and review storage are rejected safely', () => {
  for (const value of ['-1', '2x', '5', '999', '']) {
    const { context } = boot({ seed: { betterHackerCompletedLabs: value } });
    assert.equal(context.__app.readCompletedLabs(), 0);
  }
  assert.equal(boot({ seed: { betterHackerCourseReviewResult: '{bad' } }).context.__app.readReviewResult(), null);
  assert.equal(boot({ seed: { betterHackerCourseReviewResult: JSON.stringify({ completed: true, score: 14 }) } }).context.__app.readReviewResult(), null);
});

test('waitlist validates before fetch and persists only a confirmed normalized email', async () => {
  let calls = 0;
  const elements = { '#waitlist-form': new FakeElement(), '#waitlist-button': new FakeElement(), '#waitlist-email': new FakeElement(), '#waitlist-result': new FakeElement() };
  const { localStorage } = boot({ elements, fetchImpl: async () => { calls++; return { ok: true, status: 200 }; } });
  elements['#waitlist-email'].value = 'invalid';
  await elements['#waitlist-form'].dispatch('submit');
  assert.equal(calls, 0);
  elements['#waitlist-email'].value = '  LEARNER@EXAMPLE.COM ';
  await elements['#waitlist-form'].dispatch('submit');
  assert.equal(calls, 1);
  assert.equal(localStorage.getItem('betterHackerWaitlistEmail'), 'learner@example.com');
});

test('waitlist handles HTTP/network failure and locks duplicate pending submits', async () => {
  for (const fetchImpl of [async () => ({ ok: false, status: 500 }), async () => { throw new Error('offline'); }]) {
    const elements = { '#waitlist-form': new FakeElement(), '#waitlist-button': new FakeElement(), '#waitlist-email': new FakeElement(), '#waitlist-result': new FakeElement() };
    elements['#waitlist-email'].value = 'learner@example.com';
    const { localStorage } = boot({ elements, fetchImpl });
    await elements['#waitlist-form'].dispatch('submit');
    assert.equal(localStorage.getItem('betterHackerWaitlistEmail'), null);
    assert.match(elements['#waitlist-result'].textContent, /try again/i);
  }
  let resolveRequest;
  let calls = 0;
  const pending = new Promise(resolve => { resolveRequest = resolve; });
  const elements = { '#waitlist-form': new FakeElement(), '#waitlist-button': new FakeElement(), '#waitlist-email': new FakeElement(), '#waitlist-result': new FakeElement() };
  elements['#waitlist-email'].value = 'learner@example.com';
  boot({ elements, fetchImpl: () => { calls++; return pending; } });
  const first = elements['#waitlist-form'].dispatch('submit');
  const second = elements['#waitlist-form'].dispatch('submit');
  assert.equal(calls, 1);
  resolveRequest({ ok: true, status: 200 });
  await Promise.all([first, second]);
});

test('guided exercise definitions accept documented equivalents without using the shared investigation selector', () => {
  assert.doesNotMatch(source, /querySelector\("\.lab-challenge"\)/);
  const expected = ['cat flag.txt', 'cat ./flag.txt', '80', 'port 80', 'encryption', 'sql injection', 'sqli'];
  expected.forEach(answer => assert.ok(source.includes(`"${answer}"`), `missing guided equivalent ${answer}`));
  assert.equal((source.match(/InvestigationComplete", name:/g) || []).length, 7);
  assert.match(source, /className = "lab-challenge guided-exercise lab-workspace"/);
});



test('guided lab cards map to unique anchors and Start, Continue, and Review state', () => {
  const { context, localStorage } = boot();
  assert.deepEqual(Array.from(context.__app.GUIDED_LABS, lab => lab.id), ['linux', 'networking', 'cryptography', 'web-security']);
  assert.equal(context.__app.getLabStatus(0, -1), 'Not Started');
  assert.equal(context.__app.getLabAction('Not Started'), 'Start Lab');
  assert.equal(context.__app.getLabStatus(0, 0), 'In Progress');
  assert.equal(context.__app.getLabAction('In Progress'), 'Continue Lab');
  localStorage.setItem('betterHackerCompletedLabs', '1');
  assert.equal(context.__app.getLabStatus(0, -1), 'Completed');
  assert.equal(context.__app.getLabAction('Completed'), 'Review Lab');
  for (const lab of context.__app.GUIDED_LABS) assert.match(source, new RegExp('#lab-" \\+ lab\\.id'));
});

test('guided lab completion preserves sequential state and never duplicates XP evidence', () => {
  const { context, localStorage } = boot({ seed: { betterHackerCompletedLabs: '2' } });
  const before = BetterHackerState.deriveXp({ lessonsCompleted:0, exercisesCompleted:context.__app.readCompletedLabs(), investigationsCompleted:0, reviewResult:null }, BetterHackerState.emptyDailyState());
  assert.equal(context.__app.completeGuidedLab(2), true);
  assert.equal(localStorage.getItem('betterHackerCompletedLabs'), '3');
  assert.equal(context.__app.completeGuidedLab(2), false);
  assert.equal(localStorage.getItem('betterHackerCompletedLabs'), '3');
  const snapshot = { lessonsCompleted:0, exercisesCompleted:3, investigationsCompleted:0, reviewResult:null, daily:{records:[]}, completedKeys:new Set() };
  assert.equal(BetterHackerState.deriveXp(snapshot, BetterHackerState.emptyDailyState()) - before, 75);
  assert.equal(BetterHackerMilestones.evaluateAchievements(snapshot).find(item => item.id === 'hands-on-learner').earned, true);
});

test('all guided labs contain the complete structured learning sequence', () => {
  const { context } = boot();
  for (const lab of context.__app.GUIDED_LABS) {
    for (const key of ['learn','scenario','concept','evidence','task','question','hint','feedback','importance']) assert.ok(lab[key], `${lab.id} missing ${key}`);
    assert.ok(lab.answers.length > 0);
  }
  for (const heading of ["What You’ll Learn", 'Scenario', 'Concept Explanation', 'Evidence', 'Step-by-Step Task', 'Learner Question / Decision', 'Submit Answer', 'Educational Feedback', 'Why This Matters in Cybersecurity', 'Complete Lab / Continue Learning']) assert.ok(source.includes(heading), `missing ${heading}`);
});


test('seven investigation cards retain existing keys and expose Start, Continue, and Review state', () => {
  const { context, localStorage } = boot();
  const activities = Array.from(context.__app.INVESTIGATION_ACTIVITIES);
  assert.equal(activities.length, 7);
  assert.equal(new Set(activities.map(item => item.id)).size, 7);
  assert.deepEqual(activities.map(item => item.key), [
    'betterHackerSocInvestigationComplete', 'betterHackerNetworkInvestigationComplete',
    'betterHackerPhishingInvestigationComplete', 'betterHackerWindowsInvestigationComplete',
    'betterHackerMalwareInvestigationComplete', 'betterHackerBruteForceInvestigationComplete',
    'betterHackerWebAttackInvestigationComplete'
  ]);
  const first = context.__app.INVESTIGATION_ACTIVITIES[0];
  assert.equal(context.__app.getInvestigationStatus(first, null), 'Not Started');
  assert.equal(context.__app.getInvestigationAction('Not Started'), 'Start Investigation');
  assert.equal(context.__app.getInvestigationStatus(first, first.id), 'In Progress');
  assert.equal(context.__app.getInvestigationAction('In Progress'), 'Continue Investigation');
  localStorage.setItem(first.key, 'true');
  assert.equal(context.__app.getInvestigationStatus(first, null), 'Completed');
  assert.equal(context.__app.getInvestigationAction('Completed'), 'Review Investigation');
});

test('investigation completion persists once and advances dashboard recommendations', () => {
  const lessons = ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting'];
  const { context, localStorage } = boot({ seed: { betterHackerCompletedLabs: '4' } });
  lessons.forEach(name => localStorage.setItem(`betterHacker${name}Complete`, 'true'));
  const first = context.__app.INVESTIGATION_ACTIVITIES[0];
  assert.equal(context.__app.completeInvestigation(first), true);
  assert.equal(localStorage.getItem(first.key), 'true');
  assert.equal(context.__app.completeInvestigation(first), false);
  assert.equal(context.__app.getDashboardState().investigationsCompleted, 1);
  assert.equal(context.__app.getDashboardState().recommendation.target, '#investigation-network-traffic');
  context.__app.INVESTIGATION_ACTIVITIES.forEach(item => localStorage.setItem(item.key, 'true'));
  assert.equal(context.__app.getDashboardState().recommendation.target, '#course-review');
});

test('each investigation has structured defensive content and Byte-safe context fields', () => {
  const { context } = boot();
  for (const activity of context.__app.INVESTIGATION_ACTIVITIES) {
    for (const key of ['objective','scenario','concept','evidence','classify','question','choices','hint','feedback','importance']) assert.ok(activity[key], `${activity.id} missing ${key}`);
    assert.ok(activity.evidence.length >= 4);
    assert.ok(activity.choices[activity.answer]);
  }
  for (const token of ['type: "investigation"', 'activityId: activity.id', 'lookFor: activity.classify', 'submitted: false', 'submitted: true']) assert.ok(source.includes(token));
});
test('reset removes learning state and preserves the confirmed waitlist email', async () => {
  const progress = new FakeElement();
  const learn = new FakeElement();
  const elements = { '#learn': learn, '#course-progress-text': progress, '#course-progress-fill': new FakeElement(), '#course-progress-bar': new FakeElement() };
  const { context, localStorage } = boot({ elements, seed: {
    betterHackerFundamentalsComplete: 'true',
    betterHackerCompletedLabs: '4',
    betterHackerSocInvestigationComplete: 'true',
    betterHackerCourseReviewResult: '{}',
    betterHackerDailyChallengeState: '{}',
    betterHackerWaitlistEmail: 'learner@example.com',
    unrelated: 'keep'
  }});
  const reset = context.__createdElements.find(element => element.textContent === '↻ Reset Learning Progress');
  assert.ok(reset);
  await reset.dispatch('click');
  assert.equal(localStorage.getItem('betterHackerFundamentalsComplete'), null);
  assert.equal(localStorage.getItem('betterHackerCompletedLabs'), null);
  assert.equal(localStorage.getItem('betterHackerCourseReviewResult'), null);
  assert.equal(localStorage.getItem('betterHackerDailyChallengeState'), null);
  assert.equal(localStorage.getItem('betterHackerWaitlistEmail'), 'learner@example.com');
  assert.equal(localStorage.getItem('unrelated'), 'keep');
});

test('Course Review scores authored answers, restores valid results, and rejects malformed topic data', () => {
  const { context, localStorage } = boot();
  const questions = context.__app.COURSE_REVIEW_QUESTIONS;
  let score = 0;
  const topics = {};
  questions.forEach(question => {
    const answer = question.type === 'choice' ? question.answer : question.answers[0];
    if (context.__app.isReviewAnswerCorrect(question, answer)) score++;
    topics[question.topic] ||= { correct: 0, total: 0, lesson: question.lesson };
    topics[question.topic].correct++;
    topics[question.topic].total++;
  });
  assert.equal(score, 14);
  const result = { completed: true, score, total: 14, percentage: 100, completedAt: new Date().toISOString(), topics };
  localStorage.setItem('betterHackerCourseReviewResult', JSON.stringify(result));
  assert.equal(context.__app.readReviewResult().score, 14);
  delete result.topics.Linux;
  localStorage.setItem('betterHackerCourseReviewResult', JSON.stringify(result));
  assert.equal(context.__app.readReviewResult(), null);
  assert.match(source, /if \(reviewAnswered\) return;/);
});

test('companion control opens, closes, and returns focus without trapping the keyboard', async () => {
  const toggle=new FakeElement(), panel=new FakeElement(), close=new FakeElement(), response=new FakeElement();
  panel.hidden=true;
  const { elements }=boot({elements:{'#companion-toggle':toggle,'#companion-panel':panel,'#companion-close':close,'#companion-response':response}});
  await toggle.dispatch('click');
  assert.equal(elements['#companion-panel'].hidden,false);
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
  assert.equal(close.focused,true);
  await close.dispatch('click');
  assert.equal(elements['#companion-panel'].hidden,true);
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
});
