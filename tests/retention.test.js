const assert = require('node:assert/strict');
const test = require('node:test');
const State = require('../learner-state.js');
const Challenges = require('../challenges.js');
const Milestones = require('../achievements.js');
const Companion = require('../companion.js');

function dailyState() { return State.emptyDailyState(); }
function snapshot(overrides={}) {
  return { lessonsCompleted:0, exercisesCompleted:0, investigationsCompleted:0, reviewResult:null,
    completedKeys:new Set(), daily:dailyState(), ...overrides };
}
function reviewResult(percentage=75) {
  const topics=['Cybersecurity Fundamentals','Networking','Linux','Web Security','Cryptography','Active Directory','SOC & SIEM','Security Testing'];
  return { completed:true, percentage, topics:Object.fromEntries(topics.map(topic=>[topic,{correct:1,total:1,lesson:'#lesson'}])) };
}

test('daily challenge bank is safe, stable, complete, and deterministic by local date key', () => {
  assert.equal(Challenges.CHALLENGES.length, 14);
  assert.equal(new Set(Challenges.CHALLENGES.map(c=>c.id)).size, 14);
  const first=Challenges.challengeForDate('2026-09-22');
  assert.equal(Challenges.challengeForDate('2026-09-22').id, first.id);
  Challenges.CHALLENGES.forEach(c=>{ assert.ok(c.title&&c.topic&&c.scenario&&c.explanation&&c.hint); assert.equal(c.xp,50); });
});

test('daily answers distinguish incorrect/correct and completion awards once per date across reload', () => {
  const challenge=Challenges.challengeForDate('2026-09-22');
  assert.equal(Challenges.isCorrect(challenge, challenge.correctIndex), true);
  assert.equal(Challenges.isCorrect(challenge, (challenge.correctIndex+1)%challenge.choices.length), false);
  const first=State.completeDailyChallenge(dailyState(),'2026-09-22',challenge.id,challenge.xp);
  assert.equal(first.awarded,true); assert.equal(first.state.records.length,1);
  const restored=State.validateDailyState(JSON.parse(JSON.stringify(first.state)));
  const repeat=State.completeDailyChallenge(restored,'2026-09-22',challenge.id,challenge.xp);
  assert.equal(repeat.awarded,false); assert.equal(repeat.state.records.length,1);
});

test('daily state rejects malformed data and remains bounded', () => {
  assert.deepEqual(State.validateDailyState({version:1,records:'bad'}),dailyState());
  assert.deepEqual(State.validateDailyState({version:99,records:[],currentStreak:0,longestStreak:0,lastCompletedDate:null}),dailyState());
  let state=dailyState();
  for(let i=1;i<=65;i++){
    const date=new Date(2026,0,i); const key=State.localDateKey(date);
    state=State.completeDailyChallenge(state,key,'daily-test',50).state;
  }
  assert.ok(state.records.length<=State.MAX_DAILY_RECORDS);
});

test('streak follows first, same, consecutive, skipped, longest, and future-date rules', () => {
  let result=State.completeDailyChallenge(dailyState(),'2026-09-20','a',50); assert.equal(result.state.currentStreak,1);
  result=State.completeDailyChallenge(result.state,'2026-09-20','a',50); assert.equal(result.state.currentStreak,1);
  result=State.completeDailyChallenge(result.state,'2026-09-21','b',50); assert.equal(result.state.currentStreak,2);
  result=State.completeDailyChallenge(result.state,'2026-09-23','c',50); assert.equal(result.state.currentStreak,1); assert.equal(result.state.longestStreak,2);
  const future=State.completeDailyChallenge(result.state,'2026-09-22','d',50); assert.equal(future.awarded,false); assert.equal(future.state.currentStreak,1);
  assert.equal(State.dayDifference('bad','2026-09-22'),null);
});

test('XP derives retroactively and never duplicates completed or daily work', () => {
  const daily=State.completeDailyChallenge(dailyState(),'2026-09-22','a',50).state;
  const work=snapshot({lessonsCompleted:8,exercisesCompleted:4,investigationsCompleted:7,reviewResult:reviewResult(),daily});
  const expected=8*100+4*75+7*125+200+50;
  assert.equal(State.deriveXp(work,daily),expected);
  assert.equal(State.deriveXp(work,State.validateDailyState(JSON.parse(JSON.stringify(daily)))),expected);
});

test('level thresholds and top-level behavior are deterministic', () => {
  const cases=[[0,1],[399,1],[400,2],[900,3],[1500,4],[2300,5],[3200,6]];
  cases.forEach(([xp,level])=>assert.equal(State.getLevel(xp).level,level));
  assert.equal(State.getLevel(9999).next,null); assert.equal(State.getLevel(9999).progress,100);
});

test('achievements transition from locked and preserve Knowledge Checkpoint compatibility', () => {
  const locked=Milestones.evaluateAchievements(snapshot());
  assert.ok(locked.every(a=>!a.earned));
  const earned=Milestones.evaluateAchievements(snapshot({lessonsCompleted:8,exercisesCompleted:4,investigationsCompleted:7,reviewResult:reviewResult(),daily:{...dailyState(),records:[{date:'2026-09-22',challengeId:'a',xp:50}],currentStreak:7,longestStreak:7,lastCompletedDate:'2026-09-22'}}));
  assert.ok(earned.find(a=>a.id==='knowledge-checkpoint').earned);
  assert.ok(earned.find(a=>a.id==='seven-day-defender').earned);
});

test('skill badges require competency evidence, ignore XP/streak, and enforce Core requirements', () => {
  const visitsOnly=snapshot({lessonsCompleted:8});
  assert.ok(Milestones.evaluateBadges(visitsOnly).every(b=>!b.earned));
  const completedKeys=new Set(['betterHackerFundamentalsComplete','betterHackerNetworkingComplete','betterHackerNetworkInvestigationComplete']);
  const competent=snapshot({lessonsCompleted:2,exercisesCompleted:2,completedKeys,reviewResult:reviewResult()});
  const badges=Milestones.evaluateBadges(competent);
  assert.ok(badges.find(b=>b.id==='fundamentals-foundations').earned);
  assert.ok(badges.find(b=>b.id==='networking-foundations').earned);
  assert.equal(badges.find(b=>b.id==='better-hacker-core-foundations').earned,false);
  const core=Milestones.evaluateBadges(snapshot({lessonsCompleted:8,exercisesCompleted:4,investigationsCompleted:7,completedKeys,reviewResult:reviewResult(60)}));
  assert.equal(core.find(b=>b.id==='better-hacker-core-foundations').earned,true);
});

test('authored companion changes context, withholds answers before submission, and has no external dependency', () => {
  const companion=Companion.createCompanion(new Companion.AuthoredProvider());
  companion.setContext({type:'daily',topic:'Networking',hint:'Think about name resolution.',explanation:'DNS resolves names.',submitted:false});
  assert.match(companion.respond('hint'),/name resolution/);
  assert.doesNotMatch(companion.respond('explain'),/DNS resolves names/);
  companion.setContext({submitted:true});
  assert.match(companion.respond('explain'),/DNS resolves names/);
  assert.equal(require('node:fs').readFileSync('companion.js','utf8').includes('fetch('),false);
});
