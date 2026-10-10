const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const BetterHackerState = require('../learner-state.js');
const BetterHackerStorage = require('../storage.js');
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

function boot({ seed = {}, elements = {}, fetchImpl = async () => ({ ok: true, status: 200 }), storageImpl } = {}) {
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
  const localStorage = storageImpl || new MemoryStorage(seed);
  const exposed = source.replace(/\n\}\);\s*$/, `\n  globalThis.__app = { readCompletedLabs, readReviewResult, getDashboardState, buildRetentionSnapshot, isReviewAnswerCorrect, COURSE_REVIEW_QUESTIONS, PRACTICE_LESSONS, checkPracticeAnswers, handleNavigation, GUIDED_LABS, INVESTIGATIONS, LESSON_PROGRESS, EXTENSION_LESSONS, countCompletedExtensionLessons, completeExtensionLesson, getLabStatus, getLabAction, completeGuidedLab, completeInvestigation, ASSISTANT_TOPICS, ASSISTANT_PROGRESS_KEY, readAssistantProgress, completeAssistantTopic, renderDashboard, setDashboardCompanionContext, companion };\n});`);
  const context = { document, localStorage, __createdElements: createdElements, fetch: fetchImpl, setTimeout: fn => fn(), clearTimeout() {}, confirm: () => true,
    location: { reload() {} }, console, Date, JSON, Number, Math, Object, String, RegExp, Set,
    BetterHackerStorage, BetterHackerState, BetterHackerChallenges, BetterHackerMilestones, BetterHackerCompanion };
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

function allLessonElements() {
  const elements = fundamentalElements();
  elements['#linux-lesson'] = new FakeElement();
  for (const prefix of ['network', 'linux', 'web', 'crypto', 'ad', 'soc', 'testing']) {
    elements[`#${prefix}-check-button`] = new FakeElement();
    elements[`#${prefix}-check-answer`] = new FakeElement();
    elements[`#${prefix}-check-result`] = new FakeElement();
  }
  return elements;
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

test('a new learner completes all eight lessons through knowledge-check interactions', async () => {
  const elements = allLessonElements();
  const { context, localStorage } = boot({ elements });
  const checks = [
    ['fundamentals', '  The   principle of least privilege  ', 'Fundamentals'],
    ['network', '443', 'Networking'],
    ['linux', 'CAT', 'Linux'],
    ['web', 'SQLi', 'WebSecurity'],
    ['crypto', 'Encryption', 'Cryptography'],
    ['ad', 'User Account', 'ActiveDirectory'],
    ['soc', 'SIEM', 'Soc'],
    ['testing', 'Written Authorization', 'SecurityTesting']
  ];

  for (const [index, [prefix, answer, storageName]] of checks.entries()) {
    elements[`#${prefix}-check-answer`].value = answer;
    await elements[`#${prefix}-check-button`].dispatch('click');
    assert.equal(localStorage.getItem(`betterHacker${storageName}Complete`), 'true');
    assert.equal(context.__app.getDashboardState().lessonsCompleted, index + 1);
  }
  assert.equal(elements['#course-progress-text'].textContent, '8 / 8 Lessons Completed');
  assert.equal(context.__app.getDashboardState().recommendation.type, 'Guided Lab');
});

test('dashboard recommendation follows all learning phases using existing keys', () => {
  const { context, localStorage } = boot();
  assert.match(context.__app.getDashboardState().recommendation.label, /Cybersecurity Fundamentals/);
  const lessons = ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting'];
  lessons.forEach(name => localStorage.setItem(`betterHacker${name}Complete`, 'true'));
  assert.equal(context.__app.getDashboardState().recommendation.type, 'Guided Lab');
  localStorage.setItem('betterHackerCompletedLabs', '4');
  assert.equal(context.__app.getDashboardState().recommendation.type, 'Defensive Investigation');
  ['Soc','Network','Phishing','Windows','Malware','BruteForce','WebAttack'].forEach(name => localStorage.setItem(`betterHacker${name}InvestigationComplete`, 'true'));
  assert.match(context.__app.getDashboardState().recommendation.label, /Course Review/);
});

test('Core Path derives 0/20, partial, and 20/20 progress from existing evidence', () => {
  const { context, localStorage } = boot();
  let state = context.__app.getDashboardState();
  assert.deepEqual([state.completedActivities, state.totalActivities, state.percentage], [0, 20, 0]);
  localStorage.setItem('betterHackerFundamentalsComplete', 'true');
  localStorage.setItem('betterHackerCompletedLabs', '2');
  state = context.__app.getDashboardState();
  assert.deepEqual([state.completedActivities, state.percentage], [3, 15]);
  context.__app.LESSON_PROGRESS.forEach(item => localStorage.setItem(item.key, 'true'));
  localStorage.setItem('betterHackerCompletedLabs', '4');
  context.__app.INVESTIGATIONS.forEach(item => localStorage.setItem(item.key, 'true'));
  const topics = {};
  context.__app.COURSE_REVIEW_QUESTIONS.forEach(question => { topics[question.topic] ||= { correct: 0, total: 0, lesson: question.lesson }; topics[question.topic].total++; });
  localStorage.setItem('betterHackerCourseReviewResult', JSON.stringify({ completed:true, score:0, total:14, percentage:0, completedAt:'2026-09-28T00:00:00.000Z', topics }));
  state = context.__app.getDashboardState();
  assert.deepEqual([state.completedActivities, state.percentage, state.coreComplete], [20, 100, true]);
  assert.match(state.recommendation.label, /Core Path Complete/);
  assert.equal(BetterHackerState.deriveXp(context.__app.buildRetentionSnapshot(), BetterHackerState.emptyDailyState()), 2175);
});

test('five stages and returning learner boundaries use real sequential evidence', () => {
  const { context, localStorage } = boot();
  let state = context.__app.getDashboardState();
  assert.equal(state.stages.length, 5);
  assert.ok(state.stages.every(stage => stage.status === 'Not Started'));
  localStorage.setItem(context.__app.LESSON_PROGRESS[0].key, 'true');
  state = context.__app.getDashboardState();
  assert.equal(state.stages[0].status, 'In Progress');
  context.__app.LESSON_PROGRESS.forEach(item => localStorage.setItem(item.key, 'true'));
  state = context.__app.getDashboardState();
  assert.equal(state.stages[0].status, 'Complete');
  assert.equal(state.stages[1].status, 'Complete');
  assert.equal(state.recommendation.type, 'Guided Lab');
  assert.equal(state.recommendation.xp, 75);
  localStorage.setItem('betterHackerCompletedLabs', '4');
  state = context.__app.getDashboardState();
  assert.equal(state.recommendation.target, '#investigation-soc');
  assert.equal(state.recommendation.xp, 125);
  context.__app.INVESTIGATIONS.forEach(item => localStorage.setItem(item.key, 'true'));
  state = context.__app.getDashboardState();
  assert.equal(state.recommendation.type, 'Knowledge Checkpoint');
  assert.equal(state.recommendation.xp, 200);
});

test('skills, Today panel, accessible progress, and Byte dashboard context derive from state', () => {
  const elements = {
    '#core-path-count': new FakeElement(), '#core-path-percent': new FakeElement(), '#core-path-progress': new FakeElement(), '#core-path-progress-fill': new FakeElement(),
    '#today-daily': new FakeElement(), '#today-streaks': new FakeElement(), '#today-next': new FakeElement(), '#today-action': new FakeElement(), '#learning-indicators': new FakeElement()
  };
  const { context, localStorage } = boot({ elements });
  localStorage.setItem('betterHackerFundamentalsComplete', 'true');
  const state = context.__app.renderDashboard();
  assert.equal(elements['#core-path-count'].textContent, '1 / 20 activities completed');
  assert.equal(elements['#core-path-progress'].getAttribute('aria-valuenow'), '5');
  assert.equal(elements['#core-path-progress'].getAttribute('aria-valuetext'), '1 of 20 Core Path activities completed');
  assert.match(elements['#today-daily'].textContent, /available/);
  assert.match(elements['#today-next'].textContent, /Networking/);
  assert.equal(state.skills.length, 10);
  assert.equal(state.skills.find(skill => skill.name === 'Cybersecurity Foundations').status, 'Supported by completed learning');
  assert.equal(state.skills.find(skill => skill.name === 'Linux Fundamentals').status, 'Upcoming learning');
  const byte = context.__app.companion.respond('look');
  assert.match(byte, /Foundations: In Progress/);
  assert.match(byte, /Current rewards/);
});

test('a fully completed learner resumes with one set of rewards and a review recommendation', () => {
  const lessonKeys = ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting']
    .map(name => `betterHacker${name}Complete`);
  const investigationKeys = ['Soc','Network','Phishing','Windows','Malware','BruteForce','WebAttack']
    .map(name => `betterHacker${name}InvestigationComplete`);
  const topics = {};
  const initial = boot();
  initial.context.__app.COURSE_REVIEW_QUESTIONS.forEach(question => {
    topics[question.topic] ||= { correct: 0, total: 0, lesson: question.lesson };
    topics[question.topic].correct++;
    topics[question.topic].total++;
  });
  const review = { completed: true, score: 14, total: 14, percentage: 100, completedAt: '2026-09-27T12:00:00.000Z', topics };
  const seed = { betterHackerCompletedLabs: '4', betterHackerCourseReviewResult: JSON.stringify(review) };
  [...lessonKeys, ...investigationKeys].forEach(key => { seed[key] = 'true'; });

  for (let reload = 0; reload < 2; reload++) {
    const { context } = boot({ seed });
    const dashboard = context.__app.getDashboardState();
    const snapshot = context.__app.buildRetentionSnapshot();
    assert.deepEqual([dashboard.lessonsCompleted, dashboard.exercisesCompleted, dashboard.investigationsCompleted], [8, 4, 7]);
    assert.match(dashboard.recommendation.label, /Core Path Complete/);
    assert.equal(BetterHackerState.deriveXp(snapshot, snapshot.daily), 2175);
    assert.equal(BetterHackerMilestones.evaluateAchievements(snapshot).filter(item => item.earned).length, 8);
  }
});

test('architecture has one bootstrap, registries, renderers, completion path, and navigation listener', () => {
  assert.equal((source.match(/document\.addEventListener\("DOMContentLoaded"/g) || []).length, 1);
  for (const name of ['getDashboardState', 'renderDashboard', 'renderRetentionSummary', 'completeGuidedLab', 'renderDailyChallenge', 'setDashboardCompanionContext', 'handleNavigation', 'openCompanion']) {
    assert.equal((source.match(new RegExp(`function ${name}\\(`, 'g')) || []).length, 1, `${name} must have one declaration`);
  }
  assert.equal((source.match(/const GUIDED_LABS\s*=/g) || []).length, 1);
  assert.equal((source.match(/const INVESTIGATIONS\s*=/g) || []).length, 1);
  assert.equal((source.match(/addEventListener\("hashchange"/g) || []).length, 1);
  assert.equal((source.match(/const waitlistForm\s*=/g) || []).length, 1);
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

test('all investigations expose unique anchors, authored hints, and persisted completion keys', () => {
  const { context } = boot();
  const investigations = Array.from(context.__app.INVESTIGATIONS);
  assert.equal(investigations.length, 7);
  assert.equal(new Set(investigations.map(item => item.anchor)).size, 7);
  assert.equal(new Set(investigations.map(item => item.key)).size, 7);
  for (const investigation of investigations) {
    assert.match(investigation.anchor, /^investigation-/);
    assert.match(investigation.key, /^betterHacker.+InvestigationComplete$/);
    assert.ok(investigation.hint.length > 30);
  }
  assert.match(source, /href=\"#' \+ investigation\.anchor/);
  assert.match(source, /className = "secondary-button investigation-hint"/);
  assert.match(source, /NAVIGATION_HANDLERS\.push\(focusInvestigationFromHash\)/);
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


test('all lesson checks teach on incorrect answers, accept documented equivalents, and restore review state', async () => {
  const elements = allLessonElements();
  let app = boot({ elements });
  const cases = [
    ['fundamentals', 'administrator', 'least privilege', 'Fundamentals'],
    ['network', '80', 'port 443', 'Networking'],
    ['linux', 'rm', 'cat file', 'Linux'],
    ['web', 'xss', 'sql injection attack', 'WebSecurity'],
    ['crypto', 'encoding', 'data encryption', 'Cryptography'],
    ['ad', 'group', 'active directory user', 'ActiveDirectory'],
    ['soc', 'firewall', 'security information and event management', 'Soc'],
    ['testing', 'quiet hours', 'explicit authorization', 'SecurityTesting']
  ];
  for (const [prefix, wrong, right, storageName] of cases) {
    elements[`#${prefix}-check-answer`].value = wrong;
    await elements[`#${prefix}-check-button`].dispatch('click');
    assert.equal(app.localStorage.getItem(`betterHacker${storageName}Complete`), null);
    assert.ok(elements[`#${prefix}-check-result`].textContent.length > 25);
    elements[`#${prefix}-check-answer`].value = right;
    await elements[`#${prefix}-check-answer`].dispatch('keydown', { key: 'Enter' });
    assert.equal(app.localStorage.getItem(`betterHacker${storageName}Complete`), 'true');
  }
  assert.equal(app.context.__app.getDashboardState().lessonsCompleted, 8);
  const seed = Object.fromEntries(Object.keys(app.localStorage).map(key => [key, app.localStorage.getItem(key)]));
  const restoredElements = allLessonElements();
  const restored = boot({ seed, elements: restoredElements });
  assert.equal(restored.context.__app.getDashboardState().lessonsCompleted, 8);
  assert.match(restoredElements['#fundamentals-check-result'].textContent, /Completed previously/);
  assert.equal(BetterHackerState.deriveXp(restored.context.__app.buildRetentionSnapshot(), BetterHackerState.emptyDailyState()), 800);
});

test('investigation completion API validates keys and is idempotent for XP evidence', () => {
  const { context, localStorage } = boot();
  const key = context.__app.INVESTIGATIONS[0].key;
  assert.equal(context.__app.completeInvestigation('unrelated'), false);
  assert.equal(context.__app.completeInvestigation(key), true);
  assert.equal(context.__app.completeInvestigation(key), false);
  assert.equal(localStorage.getItem(key), 'true');
  const state = context.__app.getDashboardState();
  assert.equal(state.investigationsCompleted, 1);
  assert.equal(BetterHackerState.deriveXp(context.__app.buildRetentionSnapshot(), BetterHackerState.emptyDailyState()), 125);
});


test('supplemental lessons persist once without altering 8/8 Core progress or XP', () => {
  const { context, localStorage } = boot();
  assert.equal(context.__app.EXTENSION_LESSONS.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(context.__app.completeExtensionLesson('computer-tools', 'stop'))), { correct:false, newlyCompleted:false });
  assert.equal(context.__app.countCompletedExtensionLessons(), 0);
  assert.deepEqual(JSON.parse(JSON.stringify(context.__app.completeExtensionLesson('computer-tools', 'observe'))), { correct:true, newlyCompleted:true });
  assert.deepEqual(JSON.parse(JSON.stringify(context.__app.completeExtensionLesson('computer-tools', 'observe'))), { correct:true, newlyCompleted:false });
  assert.equal(localStorage.getItem('betterHackerComputerToolsLessonComplete'), 'true');
  assert.equal(context.__app.countCompletedExtensionLessons(), 1);
  assert.equal(context.__app.getDashboardState().lessonsCompleted, 0);
  assert.equal(BetterHackerState.deriveXp(context.__app.buildRetentionSnapshot(), BetterHackerState.emptyDailyState()), 0);
});

test('completed Core Path recommends unfinished supplemental learning then Daily Challenge', () => {
  const initial = boot();
  const { context, localStorage } = initial;
  context.__app.LESSON_PROGRESS.forEach(item => localStorage.setItem(item.key, 'true'));
  localStorage.setItem('betterHackerCompletedLabs', '4');
  context.__app.INVESTIGATIONS.forEach(item => localStorage.setItem(item.key, 'true'));
  const topics = {};
  context.__app.COURSE_REVIEW_QUESTIONS.forEach(question => { topics[question.topic] ||= {correct:0,total:0,lesson:question.lesson}; topics[question.topic].total++; });
  localStorage.setItem('betterHackerCourseReviewResult', JSON.stringify({completed:true,score:0,total:14,percentage:0,completedAt:'2026-10-01T00:00:00.000Z',topics}));
  let state = context.__app.getDashboardState();
  assert.equal(state.coreComplete, true);
  assert.equal(state.lessonsCompleted, 8);
  assert.equal(state.recommendation.type, 'Supplemental Lesson');
  assert.equal(state.recommendation.name, 'Computer Fundamentals & Security Tools');
  localStorage.setItem('betterHackerComputerToolsLessonComplete', 'true');
  state = context.__app.getDashboardState();
  assert.equal(state.recommendation.name, 'Incident Response');
  context.__app.EXTENSION_LESSONS.forEach(item => localStorage.setItem(item.key, 'true'));
  state = context.__app.getDashboardState();
  assert.equal(state.recommendation.name, 'Daily Cyber Challenge');
});


test('Learning Assistant tracks all nine topic checks once without affecting Core progress or XP', () => {
  const { context, localStorage } = boot();
  assert.equal(context.__app.ASSISTANT_TOPICS.length, 9);
  assert.deepEqual(Array.from(context.__app.readAssistantProgress()), []);
  assert.equal(context.__app.completeAssistantTopic('unknown', 0), false);
  for (const topic of context.__app.ASSISTANT_TOPICS) {
    assert.equal(context.__app.completeAssistantTopic(topic.id, 99), false);
    assert.equal(context.__app.completeAssistantTopic(topic.id, topic.correct), true);
    assert.equal(context.__app.completeAssistantTopic(topic.id, topic.correct), false);
  }
  assert.equal(context.__app.readAssistantProgress().length, 9);
  const stored = JSON.parse(localStorage.getItem(context.__app.ASSISTANT_PROGRESS_KEY));
  assert.equal(stored.version, 1);
  assert.equal(new Set(stored.completed).size, 9);
  assert.deepEqual([context.__app.getDashboardState().lessonsCompleted, context.__app.getDashboardState().completedActivities], [0, 0]);
  assert.equal(BetterHackerState.deriveXp(context.__app.buildRetentionSnapshot(), BetterHackerState.emptyDailyState()), 0);
});

test('Learning Assistant rejects malformed or stale topic progress safely', () => {
  for (const value of ['{bad', JSON.stringify({version:2,completed:[]}), JSON.stringify({version:1,completed:['unknown']}), JSON.stringify({version:1,completed:'fundamentals'})]) {
    const { context } = boot({ seed: { betterHackerLearningAssistantTopics:value } });
    assert.deepEqual(Array.from(context.__app.readAssistantProgress()), []);
  }
  const { context } = boot({ seed: { betterHackerLearningAssistantTopics:JSON.stringify({version:1,completed:['linux','linux','web']}) } });
  assert.deepEqual(Array.from(context.__app.readAssistantProgress()), ['linux','web']);
});


test('supplemental practice validates every decision, persists idempotently, and leaves Core evidence unchanged', () => {
  const { context, localStorage } = boot({ seed: { betterHackerWaitlistEmail: 'saved@example.test', unrelated: 'keep' } });
  const app = context.__app;
  const baseline = JSON.stringify(app.getDashboardState());
  assert.equal(app.PRACTICE_LESSONS.length, 4);
  for (const lesson of app.PRACTICE_LESSONS) {
    assert.equal(app.checkPracticeAnswers(lesson.id, []).correct, false);
    const wrong = [...lesson.answers]; wrong[0] = '1';
    assert.equal(app.checkPracticeAnswers(lesson.id, wrong).correct, false);
    assert.equal(localStorage.getItem(lesson.key), null);
    assert.equal(app.checkPracticeAnswers(lesson.id, [...lesson.answers]).newlyCompleted, true);
    assert.equal(localStorage.getItem(lesson.key), 'true');
    assert.equal(app.checkPracticeAnswers(lesson.id, [...lesson.answers]).newlyCompleted, false);
    assert.equal(app.checkPracticeAnswers(lesson.id, wrong).correct, false);
    context.location.hash = lesson.target;
    app.handleNavigation();
    assert.equal(app.companion.getContext().activityId, lesson.id);
  }
  assert.equal(JSON.stringify(app.getDashboardState()), baseline);
  const restored = boot({ seed: { ...localStorage } }).context.__app;
  for (const lesson of restored.PRACTICE_LESSONS) assert.equal(restored.checkPracticeAnswers(lesson.id, [...lesson.answers]).newlyCompleted, false);
  assert.equal(localStorage.getItem('unrelated'), 'keep');
  assert.equal(localStorage.getItem('betterHackerWaitlistEmail'), 'saved@example.test');
});

test('Daily Practice credit leaves Core 8/8, guided-lab and investigation evidence intact', () => {
  const initial = boot().context.__app;
  const seed = Object.fromEntries(initial.LESSON_PROGRESS.map(lesson => [lesson.key, 'true']));
  seed.betterHackerCompletedLabs = '4';
  initial.INVESTIGATIONS.forEach(investigation => { seed[investigation.key] = 'true'; });
  const activity = BetterHackerChallenges.challengeForDate('2026-10-07');
  const daily = BetterHackerState.completeDailyChallenge(BetterHackerState.emptyDailyState(), '2026-10-07', activity.id, 50, {title:activity.title,track:activity.track}).state;
  seed[BetterHackerState.DAILY_KEY] = JSON.stringify(daily);
  const app = boot({ seed }).context.__app;
  const dashboard = app.getDashboardState();
  assert.equal(dashboard.lessonsCompleted, 8);
  assert.equal(dashboard.exercisesCompleted, 4);
  assert.equal(dashboard.investigationsCompleted, 7);
  assert.equal(app.buildRetentionSnapshot().daily.totalCompleted, 1);
});

test('reset removes learning and practice evidence but preserves authored portfolio projects and email', async () => {
  const project = JSON.stringify({version:1,projects:[{activityId:'lesson-linux',title:'My "quoted" evidence',findings:'Saved before reset'}]});
  const {context, localStorage} = boot({seed:{betterHackerPortfolioProjects:project,betterHackerWaitlistEmail:'learner@example.test',betterHackerLinuxComplete:'true',betterHackerPracticeLibraryState:'library',betterHackerDailyChallengeState:'daily',unrelated:'keep'},elements:{'#learn':new FakeElement()}});
  let prompt; context.confirm = text => { prompt=text; return true; };
  const reset = context.__createdElements.find(e=>e.className==='secondary-button reset-progress-button');
  await reset.dispatch('click');
  assert.match(prompt,/portfolio projects.*kept/);
  assert.equal(localStorage.getItem('betterHackerPortfolioProjects'),project);
  assert.equal(localStorage.getItem('betterHackerWaitlistEmail'),'learner@example.test');
  assert.equal(localStorage.getItem('betterHackerLinuxComplete'),null);
  assert.equal(localStorage.getItem('betterHackerPracticeLibraryState'),null);
  assert.equal(localStorage.getItem('betterHackerDailyChallengeState'),null);
  assert.equal(localStorage.getItem('unrelated'),'keep');
});

test('quota failure allows correct feedback and session progress without claiming persistence', async () => {
  const storage = new MemoryStorage({betterHackerNetworkingComplete:'true'});
  storage.setItem=()=>{throw new DOMException('full','QuotaExceededError');};
  const elements=fundamentalElements();elements['#storage-status']=new FakeElement();
  const {context}=boot({elements,storageImpl:storage});
  elements['#fundamentals-check-answer'].value='least privilege';
  await elements['#fundamentals-check-button'].dispatch('click');
  assert.match(elements['#fundamentals-check-result'].textContent,/Correct/);
  assert.match(elements['#fundamentals-check-result'].textContent,/Not saved to this browser/);
  assert.equal(storage.getItem('betterHackerFundamentalsComplete'),null);
  assert.equal(storage.getItem('betterHackerNetworkingComplete'),'true');
  assert.equal(context.__app.getDashboardState().lessonsCompleted,2);
});

test('blocked storage reads do not interrupt bootstrap or the learning recommendation', () => {
  const storage = new MemoryStorage();storage.getItem=()=>{throw new DOMException('blocked','SecurityError');};
  const elements={'#storage-status':new FakeElement()};
  const {context}=boot({storageImpl:storage,elements});
  assert.equal(context.__app.getDashboardState().recommendation.target,'#fundamentals-lesson');
  assert.match(elements['#storage-status'].textContent,/Not saved to this browser/);
});

test('confirmed waitlist signup remains confirmed when saving its local email throws', async () => {
  const storage=new MemoryStorage();storage.setItem=()=>{throw new DOMException('full','QuotaExceededError');};
  const elements={'#waitlist-form':new FakeElement(),'#waitlist-button':new FakeElement(),'#waitlist-email':new FakeElement(),'#waitlist-result':new FakeElement()};
  boot({storageImpl:storage,elements});elements['#waitlist-email'].value='Learner@Example.test';
  await elements['#waitlist-form'].dispatch('submit');
  assert.match(elements['#waitlist-result'].textContent,/confirmed.*email could not be saved/s);
  assert.doesNotMatch(elements['#waitlist-result'].textContent,/couldn’t confirm/);
  assert.equal(storage.getItem('betterHackerWaitlistEmail'),null);
});

test('valid Assistant topic progress survives an adjacent stale or malformed entry', () => {
  const seed={betterHackerLearningAssistantTopics:JSON.stringify({version:1,completed:['linux',null,'unknown','web','linux']})};
  const {context,localStorage}=boot({seed});
  assert.deepEqual(Array.from(context.__app.readAssistantProgress()),['linux','web']);
  assert.equal(localStorage.getItem('betterHackerLearningAssistantTopics'),seed.betterHackerLearningAssistantTopics);
});
