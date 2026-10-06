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
