const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const State = require('../learner-state.js');
const Library = require('../challenges.js');
const UI = require('../daily-practice-ui.js');
const Portfolio = require('../portfolio.js');
class Storage {
  constructor(seed={}) { this.data={...seed}; }
  getItem(key) { return this.data[key] ?? null; }
  setItem(key,value) { this.data[key]=String(value); }
}
const reasoning='Record A supports investigation, but is not proof of compromise.';
function complete(storage,date) {
  const activity=Library.challengeForDate(date);
  return UI.submitPractice(storage,date,activity.id,activity.evidenceIndex,activity.correctIndex,reasoning);
}

test('one daily library covers ten tracks with stable rotation, evidence, reasoning and valid existing navigation', () => {
  const html=fs.readFileSync('index.html','utf8');
  assert.equal(Library.CHALLENGES.length,14);
  assert.equal(new Set(Library.CHALLENGES.map(a=>a.track)).size,10);
  for(const activity of Library.CHALLENGES) {
    assert.ok(activity.evidence && activity.task && activity.hint && activity.evidenceExplanation && activity.minutes);
    assert.ok(activity.evidenceChoices[activity.evidenceIndex]);
    assert.match(html,new RegExp(`id="${activity.nextHref.slice(1)}"`));
    assert.match(html,new RegExp(`id="daily-practice-${activity.id}"`));
    assert.match(fs.readFileSync('script.js','utf8'),new RegExp(`id:"${activity.assistantTopic}"`));
    assert.equal(Library.checkAnswers(activity,activity.evidenceIndex,activity.correctIndex,reasoning),true);
    assert.equal(Library.checkAnswers(activity,(activity.evidenceIndex+1)%activity.evidenceChoices.length,activity.correctIndex,reasoning),false);
    assert.equal(Library.checkAnswers(activity,activity.evidenceIndex,activity.correctIndex,' '),false);
  }
  for(let day=1;day<31;day++) {
    const date=State.localDateKey(new Date(2026,9,day));
    assert.equal(Library.challengeForDate(date),Library.challengeForDate(date));
    assert.notEqual(Library.challengeForDate(date).id,Library.challengeForDate(State.localDateKey(new Date(2026,9,day+1))).id);
  }
  assert.equal(Library.isCorrect(Library.CHALLENGES[0],''),false);
});

test('daily completions persist title/track/date, reject wrong or unscheduled submissions, and do not duplicate XP', () => {
  const storage=new Storage({betterHackerNetworkingComplete:'true',unrelated:'preserved'}),date='2026-10-07', activity=Library.challengeForDate(date);
  assert.equal(UI.submitPractice(storage,date,activity.id,'1',activity.correctIndex,reasoning).correct,false);
  assert.equal(UI.submitPractice(storage,date,Library.CHALLENGES.find(a=>a.id!==activity.id).id,'0','0',reasoning).correct,false);
  assert.equal(complete(storage,date).awarded,true);
  const state=State.readDailyState(storage), record=state.records[0];
  assert.deepEqual(record,{date,challengeId:activity.id,xp:50,practice:true,title:activity.title,track:activity.track});
  const reloaded=new Storage({...storage.data});
  assert.equal(complete(reloaded,date).awarded,false);
  assert.equal(State.readDailyState(reloaded).totalCompleted,1);
  assert.equal(State.deriveXp({lessonsCompleted:1,exercisesCompleted:0,investigationsCompleted:0,reviewResult:null},State.readDailyState(reloaded)),150);
  assert.equal(storage.getItem('betterHackerNetworkingComplete'),'true');
  assert.equal(storage.getItem('unrelated'),'preserved');
});

test('legacy records migrate in memory without losing XP or rewriting other storage; malformed metadata is rejected', () => {
  const legacy={version:1,lastCompletedDate:'2026-10-06',currentStreak:1,longestStreak:1,records:[{date:'2026-10-06',challengeId:'daily-siem',xp:50}]};
  const storage=new Storage({[State.DAILY_KEY]:JSON.stringify(legacy)});
  const state=State.readDailyState(storage);assert.equal(state.totalCompleted,1);
  assert.equal(storage.getItem(State.DAILY_KEY),JSON.stringify(legacy));
  assert.equal(state.records[0].xp,50);
  assert.equal(complete(storage,'2026-10-07').state.totalCompleted,2);
  assert.equal(State.readDailyState(storage).currentStreak,2);
  const invalid={...state,records:[{...state.records[0],practice:true,title:null,track:'SOC'}]};
  assert.deepEqual(State.validateDailyState(invalid),State.emptyDailyState());
  assert.deepEqual(State.validateDailyState({...state,totalCompleted:-1}),State.emptyDailyState());
});

test('streaks expire after a missed day and lifetime count survives bounded history', () => {
  const storage=new Storage();
  complete(storage,'2026-10-05');complete(storage,'2026-10-06');
  let state=State.readDailyState(storage);
  assert.equal(State.activeDailyStreak(state,'2026-10-07'),2);
  assert.equal(State.activeDailyStreak(state,'2026-10-08'),0);
  assert.equal(State.activeDailyStreak(state,'2026-10-04'),0);
  complete(storage,'2026-10-08');assert.equal(State.readDailyState(storage).currentStreak,1);
  const many=new Storage();for(let i=0;i<65;i++)complete(many,State.localDateKey(new Date(2026,0,1+i)));
  state=State.readDailyState(many);assert.equal(state.totalCompleted,65);assert.equal(state.records.length,60);
});

test('history renders newest first, known review links, empty and legacy states, and escaped metadata', () => {
  const storage=new Storage();complete(storage,'2026-10-06');complete(storage,'2026-10-07');
  const history=UI.historyHtml(State.readDailyState(storage),'2026-10-07');
  assert.ok(history.indexOf('2026-10-07')<history.indexOf('2026-10-06'));
  assert.match(history,/href="#daily-practice-daily-/);
  assert.match(UI.historyHtml(State.emptyDailyState(),'2026-10-07'),/No completed activities/);
  const state=State.readDailyState(storage);state.records[0].title='<script>bad</script>';
  assert.doesNotMatch(UI.historyHtml(state,'2026-10-07'),/<script>/);
  assert.doesNotMatch(UI.historyHtml(state,'2026-10-05'),/datetime=/);
});

test('substantial daily portfolio entries reuse stable IDs, require new completion, and deduplicate across dates', () => {
  const activity=Library.CHALLENGES.find(a=>a.portfolio),id='practice-'+activity.id;
  const storage=new Storage();assert.equal(Portfolio.createProject(storage,id).project,null);
  let state=State.completeDailyChallenge(State.emptyDailyState(),'2026-10-05',activity.id,50).state;
  storage.setItem(State.DAILY_KEY,JSON.stringify(state));assert.equal(Portfolio.createProject(storage,id).project,null);
  state=State.completeDailyChallenge(state,'2026-10-06',activity.id,50,{title:activity.title,track:activity.track}).state;
  storage.setItem(State.DAILY_KEY,JSON.stringify(state));
  const project=Portfolio.createProject(storage,id).project;assert.ok(project);assert.equal(project.completedAt,'2026-10-06');
  state=State.completeDailyChallenge(state,'2026-10-07',activity.id,50,{title:activity.title,track:activity.track}).state;
  storage.setItem(State.DAILY_KEY,JSON.stringify(state));Portfolio.createProject(storage,id);
  assert.equal(Portfolio.read(storage).projects.length,1);
  assert.match(Portfolio.markdown(project),/educational/i);
  assert.equal(Portfolio.ACTIVITIES.some(a=>a.dailyId===Library.CHALLENGES.find(a=>!a.portfolio).id),false);
});

test('daily dashboard and accessible form use existing anchors, labels, feedback and authored help', () => {
  const html=fs.readFileSync('index.html','utf8'),ui=fs.readFileSync('daily-practice-ui.js','utf8'),script=fs.readFileSync('script.js','utf8');
  for(const id of ['daily-challenge','daily-practice','daily-practice-workspace','daily-practice-history','dashboard-practice-count']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(ui,/<legend>/);assert.match(ui,/for="daily-reasoning"/);assert.match(ui,/role="status" aria-live="polite"/);
  assert.match(ui,/today\(\) !== activeDate/);assert.match(ui,/topic\.click\(\)/);
  assert.match(script,/Daily Activities Completed: /);
  assert.match(fs.readFileSync('portfolio-ui.js','utf8'),/daily-practice-completed/);
});
