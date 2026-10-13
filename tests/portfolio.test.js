const assert = require('node:assert/strict');
const test = require('node:test');
const Portfolio = require('../portfolio.js');
const Companion = require('../companion.js');

class MemoryStorage {
  constructor(seed = {}) { Object.assign(this, seed); }
  getItem(key) { return Object.hasOwn(this, key) ? String(this[key]) : null; }
  setItem(key, value) { this[key] = String(value); }
  removeItem(key) { delete this[key]; }
}

test('only completed eligible activities can become projects', () => {
  const storage = new MemoryStorage();
  assert.equal(Portfolio.createProject(storage, 'lesson-linux').project, null);
  assert.equal(Portfolio.createProject(storage, 'unknown').project, null);
  storage.setItem('betterHackerLinuxComplete', 'true');
  const result = Portfolio.createProject(storage, 'lesson-linux', new Date('2026-10-05T12:00:00Z'));
  assert.equal(result.project.activityId, 'lesson-linux');
  assert.equal(result.project.completedAt, '');
});

test('stable activity ID prevents duplicate projects across repeated clicks and reloads', () => {
  const storage = new MemoryStorage({ betterHackerLinuxComplete: 'true' });
  Portfolio.createProject(storage, 'lesson-linux');
  const second = Portfolio.createProject(storage, 'lesson-linux');
  assert.match(second.reason, /already/);
  assert.equal(Portfolio.read(storage).projects.length, 1);
  const reloaded = new MemoryStorage({ betterHackerLinuxComplete:'true', [Portfolio.STORAGE_KEY]:storage.getItem(Portfolio.STORAGE_KEY) });
  assert.equal(Portfolio.read(reloaded).projects[0].activityId, 'lesson-linux');
});

test('guided lab eligibility reuses sequential completion evidence', () => {
  const storage = new MemoryStorage({ betterHackerCompletedLabs:'2' });
  assert.equal(Portfolio.isComplete(Portfolio.activityById('lab-linux-file'), storage), true);
  assert.equal(Portfolio.isComplete(Portfolio.activityById('lab-network-service'), storage), true);
  assert.equal(Portfolio.isComplete(Portfolio.activityById('lab-data-protection'), storage), false);
});

test('edits persist and readiness uses transparent learner-evidence requirements', () => {
  const storage = new MemoryStorage({ betterHackerNetworkInvestigationComplete:'true' });
  Portfolio.createProject(storage, 'investigation-network');
  let project = Portfolio.updateProject(storage, 'investigation-network', { investigation:'Reviewed connection counts.', findings:'One service differed from the baseline.' });
  assert.deepEqual(Portfolio.readiness(project), { status:'Almost Ready', missing:['what you learned'] });
  project = Portfolio.updateProject(storage, 'investigation-network', { learned:'Correlate service and volume before concluding.' });
  assert.equal(Portfolio.readiness(project).status, 'Portfolio Ready');
  assert.equal(Portfolio.stats(storage).ready, 1);
  assert.equal(Portfolio.read(storage).projects[0].findings, 'One service differed from the baseline.');
});

test('README contains saved evidence and omits missing learner sections', () => {
  const storage = new MemoryStorage({ betterHackerNetworkInvestigationComplete:'true' });
  Portfolio.createProject(storage, 'investigation-network', new Date('2026-10-05T12:00:00Z'));
  let project = Portfolio.read(storage).projects[0];
  let output = Portfolio.markdown(project);
  assert.match(output, /# Network Traffic Investigation/);
  assert.doesNotMatch(output, /## Findings/);
  assert.doesNotMatch(output, /fabricat|suspicious host/i);
  project = Portfolio.updateProject(storage, project.activityId, { commands:'dumpcap -D', findings:'Interface 2 was the relevant simulated source.' });
  output = Portfolio.markdown(project);
  assert.match(output, /## Commands Used\n\ndumpcap -D/);
  assert.match(output, /Interface 2 was the relevant simulated source/);
});

test('GitHub preparation previews a professional file set without publishing or inventing learner findings',()=>{
  const storage=new MemoryStorage({betterHackerLinuxComplete:'true'});
  Portfolio.createProject(storage,'lesson-linux');
  const project=Portfolio.updateProject(storage,'lesson-linux',{commands:'pwd\nls /home/learner',investigation:'Inspected the supplied training directory.',findings:'The exercise notes are in the learner home directory.',learned:'Use pwd and ls to establish location and contents.'});
  const prepared=Portfolio.githubPackage(project);
  assert.equal(prepared.repositoryName,'linux-fundamentals');
  assert.match(prepared.description,/Linux Fundamentals/);
  assert.deepEqual(Object.keys(prepared.files),['README.md','findings.md']);
  assert.match(prepared.files['README.md'],/Educational work completed through Better Hacker/);
  assert.match(prepared.files['README.md'],/Commands Used/);
  assert.match(prepared.files['findings.md'],/Inspected the supplied training directory/);
  assert.match(prepared.files['findings.md'],/The exercise notes are in the learner home directory/);
  assert.doesNotMatch(prepared.files['findings.md'],/real host|professional experience/i);
  assert.match(prepared.files['README.md'],/not professional employment experience/);
  assert.equal(storage.getItem('githubToken'),null);
});

test('provided fictional challenge evidence is included as a clearly labeled separate sample file',()=>{
  const storage=new MemoryStorage({betterHackerPracticeLibraryState:JSON.stringify({version:1,completed:[{activityId:'daily-linux-permissions',date:'2026-10-13'}]})});
  Portfolio.createProject(storage,'practice-daily-linux-permissions');
  const prepared=Portfolio.githubPackage(Portfolio.read(storage).projects[0]);
  assert.ok(prepared.files['sample-evidence.md']);
  assert.match(prepared.files['sample-evidence.md'],/SIMULATED ls -l/);
  assert.match(prepared.files['sample-evidence.md'],/fictional evidence/i);
});

test('completed Attack Box simulations become portfolio-ready and export only their fixed sample data',()=>{
  const box=require('../attack-box.js');
  const storage=new MemoryStorage({[box.STORAGE_KEY]:JSON.stringify({version:1,completed:['linux-log-search']})});
  assert.equal(Portfolio.isComplete(Portfolio.activityById('attackbox-linux-log-search'),storage),true);
  const result=Portfolio.createProject(storage,'attackbox-linux-log-search');
  const prepared=Portfolio.githubPackage(result.project);
  assert.ok(prepared.files['sample-evidence.md']);
  assert.match(prepared.files['sample-evidence.md'],/\/var\/log\/auth\.log/);
  assert.match(prepared.files['sample-evidence.md'],/fictional evidence/i);
  assert.equal(Portfolio.isComplete(Portfolio.activityById('attackbox-linux-navigation'),storage),false);
});

test('removing a portfolio entry leaves underlying completion evidence intact', () => {
  const storage = new MemoryStorage({ betterHackerSocInvestigationComplete:'true' });
  Portfolio.createProject(storage, 'investigation-soc');
  Portfolio.removeProject(storage, 'investigation-soc');
  assert.equal(Portfolio.read(storage).projects.length, 0);
  assert.equal(storage.getItem('betterHackerSocInvestigationComplete'), 'true');
});

test('suggestion selects completed undocumented work without changing core state', () => {
  const storage = new MemoryStorage({ betterHackerNetworkingComplete:'true', betterHackerLinuxComplete:'true' });
  assert.equal(Portfolio.suggestion(storage).id, 'lesson-networking');
  Portfolio.createProject(storage, 'lesson-networking');
  assert.equal(Portfolio.suggestion(storage).id, 'lesson-linux');
  assert.equal(storage.getItem('betterHackerNetworkingComplete'), 'true');
});

test('Byte portfolio guidance explains evidence without fabricating it', () => {
  const byte = Companion.createCompanion(new Companion.AuthoredProvider());
  byte.setContext({ type:'portfolio', topic:'Linux File Detective', hint:'Skills describe practice; evidence describes what you did.', lookFor:'your own commands and findings', explanation:'A README explains educational work without presenting it as employment.' });
  assert.match(byte.respond('hint'), /evidence describes what you did/);
  assert.match(byte.respond('look'), /your own commands and findings/);
  assert.match(byte.respond('explain'), /without presenting it as employment/);
  assert.doesNotMatch(byte.respond('explain'), /you found|you used|certified/i);
});

