const assert = require('node:assert/strict');
const test = require('node:test');
const SafeStorage = require('../storage.js');
const State = require('../learner-state.js');
const UI = require('../daily-practice-ui.js');
const Library = require('../challenges.js');
const Portfolio = require('../portfolio.js');
class Storage {
  constructor(seed = {}) { this.data = { ...seed }; }
  getItem(key) { return this.data[key] ?? null; }
  setItem(key, value) { this.data[key] = String(value); }
  removeItem(key) { delete this.data[key]; }
  key(i) { return Object.keys(this.data)[i] ?? null; }
  get length() { return Object.keys(this.data).length; }
}
const snapshot = { lessonsCompleted: 0, exercisesCompleted: 0, investigationsCompleted: 0, reviewResult: null };
const reason = 'The supplied record supports investigation, not proof of compromise.';

test('storage facade preserves existing keys, external updates and normal persistence', () => {
  const raw = new Storage({ learning: 'true', unrelated: 'keep' }), storage = SafeStorage.create(() => raw);
  assert.equal(storage.getItem('learning'), 'true');
  raw.setItem('learning', 'changed'); assert.equal(storage.getItem('learning'), 'changed');
  assert.equal(storage.setItem('new', 'value'), true); assert.equal(raw.getItem('new'), 'value');
  assert.equal(storage.isPersisted('new'), true); assert.equal(storage.hasFailures(), false);
  assert.deepEqual(storage.keys().sort(), ['learning', 'new', 'unrelated']);
  assert.equal(storage.removeItem('new'), true); assert.equal(raw.getItem('new'), null);
});

test('blocked storage getter and read/write failures never throw and use explicit session-only state', () => {
  const notices = [], storage = SafeStorage.create(() => { throw new DOMException('blocked', 'SecurityError'); }, m => notices.push(m));
  assert.equal(storage.getItem('lesson'), null);
  assert.equal(storage.setItem('lesson', 'true'), false);
  assert.equal(storage.getItem('lesson'), 'true');
  assert.equal(storage.isPersisted('lesson'), false);
  assert.match(storage.feedback('Progress saved.', 'lesson'), /Not saved/);
  assert.match(notices.at(-1), /only for this session/);
  assert.deepEqual(storage.keys(), ['lesson']);
  assert.equal(storage.removeItem('lesson'), false); assert.equal(storage.getItem('lesson'), null);
});

test('quota failure retains original saved portfolio and other records; a later explicit save can recover', () => {
  const raw = new Storage({ portfolio: 'original', other: 'valid' });
  const write = raw.setItem.bind(raw), storage = SafeStorage.create(() => raw);
  assert.equal(storage.getItem('portfolio'), 'original');
  raw.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  assert.equal(storage.setItem('portfolio', 'edited'), false);
  assert.equal(raw.getItem('portfolio'), 'original'); assert.equal(storage.getItem('portfolio'), 'edited');
  assert.equal(storage.getItem('other'), 'valid');
  raw.setItem = write; assert.equal(storage.setItem('portfolio', storage.getItem('portfolio')), true);
  assert.equal(raw.getItem('portfolio'), 'edited'); assert.equal(storage.hasFailures(), false);
});

test('an unreadable original record cannot be overwritten by a session-only replacement', () => {
  const raw = new Storage({ portfolio: 'original' }); let blocked = true;
  const read = raw.getItem.bind(raw); raw.getItem = key => { if (blocked) throw new Error('denied'); return read(key); };
  const storage = SafeStorage.create(() => raw);
  assert.equal(storage.getItem('portfolio'), null); assert.equal(storage.setItem('portfolio', 'replacement'), false);
  blocked = false; assert.equal(storage.getItem('portfolio'), 'replacement');
  assert.equal(storage.setItem('portfolio', 'replacement'), false); assert.equal(read('portfolio'), 'original');
});

test('daily and free-practice APIs report failed persistence without throwing or claiming saved completion', () => {
  const raw = new Storage(); raw.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  const activity = Library.challengeForDate('2026-10-10');
  const result = UI.submitPractice(raw, '2026-10-10', activity.id, activity.evidenceIndex, activity.correctIndex, reason);
  assert.equal(result.correct, true); assert.equal(result.saved, false); assert.equal(State.readDailyState(raw).totalCompleted, 0);
  const free = UI.submitLibraryPractice(raw, '2026-10-10', activity.id, activity.evidenceIndex, activity.correctIndex, reason);
  assert.equal(free.correct, true); assert.equal(free.saved, false);
});

test('session-only daily credit remains idempotent and does not replace saved Core progress', () => {
  const raw = new Storage({ betterHackerFundamentalsComplete: 'true' });
  raw.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
  const storage = SafeStorage.create(() => raw), date = '2026-10-10', a = Library.challengeForDate(date);
  const first = UI.submitPractice(storage, date, a.id, a.evidenceIndex, a.correctIndex, reason);
  const repeat = UI.submitPractice(storage, date, a.id, a.evidenceIndex, a.correctIndex, reason);
  assert.equal(first.saved, false); assert.equal(first.awarded, true); assert.equal(repeat.awarded, false); assert.equal(repeat.saved, false);
  assert.equal(State.deriveXp(snapshot, State.readDailyState(storage)), 50);
  assert.equal(raw.getItem('betterHackerFundamentalsComplete'), 'true');
});

test('daily state retains valid records when a neighboring record is malformed or duplicated', () => {
  let state = State.completeDailyChallenge(State.emptyDailyState(), '2026-10-09', 'daily-siem', 50).state;
  state = State.completeDailyChallenge(state, '2026-10-10', 'daily-linux', 50).state;
  const raw = new Storage({ [State.DAILY_KEY]: JSON.stringify({ ...state, records: [state.records[0], { date: 'invalid', xp: -1 }, state.records[1], state.records[0]] }), other: 'keep' });
  const before = raw.getItem(State.DAILY_KEY), restored = State.readDailyState(raw);
  assert.equal(restored.records.length, 2); assert.equal(restored.totalXp, 100);
  assert.equal(raw.getItem(State.DAILY_KEY), before); assert.equal(raw.getItem('other'), 'keep');
  assert.equal(State.completeDailyChallenge(restored, '2026-10-10', 'daily-linux', 50).awarded, false);
});

test('one malformed practice-library or portfolio record cannot wipe valid neighboring entries', () => {
  const valid = { activityId: 'daily-siem', date: '2026-10-10' };
  assert.deepEqual(State.validatePracticeLibraryState({ version: 1, completed: [null, valid, { activityId: 'bad', date: 'bad' }, valid] }).completed, [valid]);
  const project = { activityId: 'lesson-linux', title: 'My "quoted" notes & findings' };
  const projects = Portfolio.validateState({ version: 1, projects: [null, project, { activityId: 'unknown' }] }).projects;
  assert.equal(projects.length, 1); assert.equal(projects[0].title, project.title);
});

test('corrupted JSON is handled without deleting the original or unrelated valid records', () => {
  const raw = new Storage({ [State.DAILY_KEY]: '{broken', betterHackerFundamentalsComplete: 'true' });
  const notices = [], storage = SafeStorage.create(() => raw, m => notices.push(m));
  assert.equal(State.readDailyState(storage).totalCompleted, 0);
  assert.match(notices.at(-1), /original stored data has not been deleted/);
  assert.equal(raw.getItem(State.DAILY_KEY), '{broken'); assert.equal(raw.getItem('betterHackerFundamentalsComplete'), 'true');
});

test('a damaged newest daily record cannot allow duplicate credit for its known completion date', () => {
  let state = State.completeDailyChallenge(State.emptyDailyState(), '2026-10-09', 'daily-siem', 50).state;
  state = State.completeDailyChallenge(state, '2026-10-10', 'daily-linux', 50).state;
  state.records[1].xp = 'invalid';
  const restored = State.validateDailyState(state);
  assert.equal(restored.records.length, 1); assert.equal(restored.records[0].date, '2026-10-09');
  assert.equal(restored.lastCompletedDate, '2026-10-10');
  assert.equal(State.completeDailyChallenge(restored, '2026-10-10', 'daily-linux', 50).awarded, false);
});

test('retrying daily credit after storage recovers saves the session award without adding XP twice', () => {
  const raw = new Storage(), write = raw.setItem.bind(raw), storage = SafeStorage.create(() => raw);
  raw.setItem = () => { throw new Error('full'); };
  const date = '2026-10-10', a = Library.challengeForDate(date);
  assert.equal(UI.submitPractice(storage,date,a.id,a.evidenceIndex,a.correctIndex,reason).saved,false);
  raw.setItem = write;
  const retry = UI.submitPractice(storage,date,a.id,a.evidenceIndex,a.correctIndex,reason);
  assert.equal(retry.saved,true); assert.equal(retry.awarded,false); assert.equal(State.readDailyState(raw).totalXp,50);
});
