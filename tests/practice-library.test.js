const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const State = require('../learner-state.js');
const Library = require('../challenges.js');
const UI = require('../daily-practice-ui.js');
const Portfolio = require('../portfolio.js');
class Storage {
  constructor(seed = {}) { this.data = {...seed}; }
  getItem(key) { return this.data[key] ?? null; }
  setItem(key, value) { this.data[key] = String(value); }
}
const reasoning = 'The fictional evidence supports investigation rather than a proven compromise.';
function practice(storage, activity, date = '2026-10-10') {
  return UI.submitLibraryPractice(storage, date, activity.id, activity.evidenceIndex, activity.correctIndex, reasoning);
}

test('ten accessible track cards expose every existing activity exactly once', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const cards = UI.trackCardsHtml();
  assert.equal(Library.TRACKS.length, 10);
  assert.equal((cards.match(/class="card platform-entry-card"/g) || []).length, 10);
  const ids = [];
  for (const track of Library.TRACKS) {
    const activities = Library.activitiesForTrack(track.id);
    assert.ok(activities.length > 0);
    assert.match(html, new RegExp(`id="practice-track-${track.id}"`));
    assert.ok(cards.includes(`href="#practice-track-${track.id}"`));
    assert.ok(cards.includes(track.description));
    assert.ok(cards.includes(`${activities.length} ${activities.length === 1 ? 'activity' : 'activities'}`));
    const list = UI.trackActivitiesHtml(track.id, new Storage());
    for (const activity of activities) {
      ids.push(activity.id);
      assert.ok(list.includes(activity.title));
      assert.ok(list.includes(`href="#library-activity-${activity.id}"`));
      assert.match(html, new RegExp(`id="library-activity-${activity.id}"`));
      assert.equal(activity.track, track.name);
    }
  }
  assert.deepEqual(ids.sort(), Library.CHALLENGES.map(a => a.id).sort());
  assert.ok(Library.activitiesForTrack('web').some(a => a.title === 'Query Construction Review'));
  assert.ok(Library.activitiesForTrack('soc').some(a => a.id === 'daily-siem'));
  assert.equal(Library.activitiesForTrack('ai').length, 2);
  assert.deepEqual(Library.activitiesForTrack('unknown'), []);
});

test('free practice validates answers, persists first completion once and never creates a daily record', () => {
  const storage = new Storage({unrelated:'keep'});
  for (const activity of Library.CHALLENGES) {
    assert.equal(UI.submitLibraryPractice(storage, '2026-10-10', activity.id, null, activity.correctIndex, reasoning).correct, false);
    assert.equal(practice(storage, activity).newlyCompleted, true);
    assert.equal(practice(storage, activity, '2026-10-11').newlyCompleted, false);
  }
  assert.equal(State.readPracticeLibraryState(storage).completed.length, 14);
  assert.ok(State.readPracticeLibraryState(storage).completed.every(record => record.date === '2026-10-10'));
  assert.equal(storage.getItem(State.DAILY_KEY), null);
  assert.equal(storage.getItem('unrelated'), 'keep');
  const restored = new Storage(storage.data);
  assert.equal(practice(restored, Library.CHALLENGES[0]).newlyCompleted, false);
  assert.match(UI.trackActivitiesHtml('web', restored), /Practiced/);
});

test('free practice leaves existing daily history, streak, lifetime count, XP and Core evidence byte-for-byte intact', () => {
  const state = State.completeDailyChallenge(State.emptyDailyState(), '2026-10-09', 'daily-siem', 50).state;
  const daily = JSON.stringify(state);
  const seed = {[State.DAILY_KEY]:daily, betterHackerCompletedLabs:'4', betterHackerCourseReviewResult:'saved', betterHackerSocInvestigationComplete:'true'};
  for (const name of ['Fundamentals','Networking','Linux','WebSecurity','Cryptography','ActiveDirectory','Soc','SecurityTesting']) seed['betterHacker'+name+'Complete'] = 'true';
  const storage = new Storage(seed);
  for (const activity of Library.CHALLENGES) practice(storage, activity);
  for (const [key,value] of Object.entries(seed)) assert.equal(storage.getItem(key),value);
  const snapshot = {lessonsCompleted:8,exercisesCompleted:4,investigationsCompleted:7,reviewResult:{completed:true}};
  assert.equal(State.deriveXp(snapshot, State.readDailyState(storage)), State.deriveXp(snapshot,state));
  assert.equal(State.readDailyState(storage).currentStreak, 1);
  assert.equal(State.readDailyState(storage).totalCompleted, 1);
});

test('daily credit still awards exactly once after free practice and next date rotates independently', () => {
  const storage = new Storage(), date = '2026-10-10', activity = Library.challengeForDate(date);
  practice(storage, activity);
  const submit = () => UI.submitPractice(storage,date,activity.id,activity.evidenceIndex,activity.correctIndex,reasoning);
  assert.equal(submit().awarded,true);
  assert.equal(submit().awarded,false);
  const next = Library.challengeForDate('2026-10-11');
  assert.notEqual(next.id,activity.id);
  assert.equal(UI.submitPractice(storage,'2026-10-11',next.id,next.evidenceIndex,next.correctIndex,reasoning).awarded,true);
  const state = State.readDailyState(storage);
  assert.equal(state.currentStreak,2);assert.equal(state.totalCompleted,2);assert.equal(state.records.length,2);
  assert.equal(UI.submitPractice(storage,'2026-10-09',activity.id,activity.evidenceIndex,activity.correctIndex,reasoning).awarded,false);
});

test('malformed or unknown library data cannot reset unrelated state or grant portfolio eligibility', () => {
  const activity = Library.CHALLENGES.find(a => a.portfolio), id = 'practice-'+activity.id;
  for (const invalid of [null,{version:2,completed:[]},{version:1,completed:'bad'},{version:1,completed:[{activityId:activity.id,date:'2026-02-30'}]}]) {
    const storage = new Storage({[State.PRACTICE_LIBRARY_KEY]:JSON.stringify(invalid), [State.DAILY_KEY]:'existing'});
    assert.equal(State.readPracticeLibraryState(storage).completed.length,0);
    assert.equal(Portfolio.createProject(storage,id).project,null);
    assert.equal(storage.getItem(State.DAILY_KEY),'existing');
  }
  const storage = new Storage();
  assert.equal(UI.submitLibraryPractice(storage,'2026-10-10','unknown',0,0,reasoning).correct,false);
  assert.equal(practice(storage,activity,'not-a-date').newlyCompleted,false);
  assert.equal(storage.getItem(State.PRACTICE_LIBRARY_KEY),null);
});

test('explicit eligible free-practice projects reuse existing IDs and deduplicate across both modes', () => {
  const storage = new Storage(), activity = Library.CHALLENGES.find(a => a.portfolio), id = 'practice-'+activity.id;
  assert.equal(Portfolio.createProject(storage,id).project,null);
  practice(storage,activity);
  assert.equal(Portfolio.read(storage).projects.length,0);
  const project = Portfolio.createProject(storage,id).project;
  assert.equal(project.id,id);assert.equal(project.completedAt,'2026-10-10');
  assert.match(Portfolio.markdown(project),/educational practice/i);
  practice(storage,activity,'2026-10-11');Portfolio.createProject(storage,id);
  const daily = State.completeDailyChallenge(State.emptyDailyState(),'2026-10-11',activity.id,50,{title:activity.title,track:activity.track}).state;
  storage.setItem(State.DAILY_KEY,JSON.stringify(daily));Portfolio.createProject(storage,id);
  assert.equal(Portfolio.read(storage).projects.length,1);
  assert.equal(Portfolio.read(storage).projects[0].id,id);
  const tiny = Library.CHALLENGES.find(a => !a.portfolio);
  practice(storage,tiny);assert.equal(Portfolio.createProject(storage,'practice-'+tiny.id).project,null);
});

test('library entry points and modes retain daily anchors and existing accessible navigation patterns', () => {
  const html = fs.readFileSync('index.html','utf8'), ui = fs.readFileSync('daily-practice-ui.js','utf8');
  for (const id of ['daily-challenge','daily-practice','practice-library','practice-library-title']) assert.match(html,new RegExp(`id="${id}"`));
  const labs = html.slice(html.indexOf('<section id="labs"'),html.indexOf('<section id="practice-reconnaissance"'));
  for (const target of ['#daily-practice','#practice-library']) assert.ok(labs.includes(`href="${target}"`));
  assert.match(html, /href="#practice-library" class="secondary-button">Explore Practice Library/);
  assert.match(ui,/PRACTICE MODE — NO DAILY XP OR STREAK CREDIT/);
  assert.match(ui,/mode === 'daily' && today\(\) !== activeDate/);
  assert.match(ui,/assistantTopic:active.assistantTopic/);
  assert.match(ui,/topic\.click\(\)/);
  assert.match(fs.readFileSync('style.css','utf8'),/\.platform-entry-card:focus-visible/);
});
