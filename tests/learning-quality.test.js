const assert=require('node:assert/strict');
const test=require('node:test');
const Daily=require('../challenges.js');
const Box=require('../attack-box.js');
const Portfolio=require('../portfolio.js');

test('learning quality additions include baseline comparison and benign alert triage',()=>{
  const baseline=Daily.activityById('daily-network-baseline');
  const benign=Daily.activityById('daily-siem-false-positive');
  assert.ok(baseline);
  assert.ok(benign);
  assert.match(baseline.evidence,/SIMULATED BASELINE/);
  assert.match(baseline.evidence,/SIMULATED OBSERVATION/);
  assert.match(baseline.evidenceExplanation,/not proof/i);
  assert.match(benign.evidence,/approved password-reset exercise/i);
  assert.match(benign.evidenceExplanation,/matching evidence/i);
  assert.equal(Daily.checkAnswers(benign,String(benign.evidenceIndex),String(benign.correctIndex),'The approved ticket matches the account, device, and time window.'),true);
});

test('Attack Box help and common errors give actionable beginner troubleshooting',()=>{
  const help=Box.execute('linux-log-search','help','/home/learner');
  assert.equal(help.ok,true);
  assert.match(help.output,/paths and grep text are case-sensitive/i);
  assert.match(help.output,/does not support sudo or permission changes/i);
  const missing=Box.execute('linux-log-search','cat /var/log/missing.log','/home/learner');
  assert.equal(missing.ok,false);
  assert.match(missing.output,/Check the full path and capitalization/i);
  const noMatch=Box.execute('linux-log-search','grep failed /var/log/auth.log','/home/learner');
  assert.equal(noMatch.ok,true);
  assert.match(noMatch.output,/grep is case-sensitive/i);
});

test('portfolio report template includes evidence, baseline, timeline, impact and handoff sections',()=>{
  const template=Portfolio.reportTemplate({activityId:'investigation-soc',title:'SOC investigation'});
  for(const section of ['Executive Summary','Scope and Authorization','Timeline','Findings and Evidence','Baseline and Alternative Explanations','Impact and Risk','Recommended Next Steps','Closure / Handoff Notes']) {
    assert.match(template,new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.match(template,/observed facts from interpretation/i);
  assert.match(template,/unknown/i);
});
