const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Jobs = require('../jobs.js');
const Mapping = require('../jobs-skill-mapping.js');
const Matching = require('../jobs-matching.js');
const Portfolio = require('../portfolio.js');
const Demo = require('../jobs-demo.js');
const JobsUI = require('../jobs-ui.js');
const Progress = require('../jobs-readiness-progress.js');

function mappedJob(title, description = '', categories = []) {
  return { title, description, categories, skills: [], extensions: { skillMappings: Mapping.mapListing({ title, description, categories }) } };
}
function storage(values = {}) {
  const records = new Map(Object.entries(values));
  return { getItem(key) { return records.has(key) ? records.get(key) : null; }, setItem(key, value) { records.set(key, value); } };
}

test('explicit phrases map exact skills and common aliases to controlled taxonomy IDs', () => {
  const result = Mapping.mapListing({ title: 'SOC Analyst', categories: ['Information Security'], description: 'Use TCP/IP, Microsoft Sentinel, AWS, and PowerShell.' });
  const ids = result.map(item => item.id);
  for (const id of ['alert-triage', 'network-fundamentals', 'siem', 'aws', 'powershell']) assert.ok(ids.includes(id), id);
  assert.equal(result.find(item => item.id === 'siem').matchedPhrase, 'Microsoft Sentinel');
  assert.equal(result.find(item => item.id === 'siem').field, 'description');
  assert.ok(result.every(item => Object.hasOwn(Jobs.SKILLS, item.id)));
});

test('word boundaries and context guards prevent obvious substring and physical-window false positives', () => {
  assert.equal(Mapping.mapListing({ title: 'SOC 2 Compliance Manager', description: 'Worked at a computer company called Cpython Tools.' }).length, 0);
  const physical = Mapping.mapListing({ title: 'Facilities Security Coordinator', description: 'Maintain glass windows in the office building.' });
  assert.equal(physical.some(item => item.id.startsWith('windows-')), false);
  const operatingSystem = Mapping.mapListing({ title: 'Windows Endpoint Security Analyst' });
  assert.ok(operatingSystem.some(item => item.id === 'windows-platform'));
  const logs = Mapping.mapListing({ title: 'Windows Event Logs Analyst' });
  assert.ok(logs.some(item => item.id === 'windows-event-logs'));
});

test('multiple distinct concepts are mapped once and unrecognized terms remain unmapped', () => {
  const mapped = Mapping.mapListing({ title: 'Security Engineer', description: 'Linux, DNS, Wireshark, Python, incident response, and quantum key orchestration.' });
  const ids = mapped.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['linux-basics', 'network-fundamentals', 'network-analysis', 'python', 'incident-response']) assert.ok(ids.includes(id), id);
  assert.equal(mapped.some(item => item.matchedPhrase.toLowerCase().includes('quantum')), false);
});

test('job skill mapping covers the requested beginner cybersecurity technologies', () => {
  const mapped = Mapping.mapListing({ title: 'SOC Security Analyst', description: 'Linux, Windows, networking, TCP/IP, SIEM, SOC, Python, PowerShell, AWS, Azure, GCP, cloud security, EDR, IDS/IPS, firewalls, vulnerability management, digital forensics, web security, Active Directory, and incident response.' });
  const ids = new Set(mapped.map(item => item.id));
  for (const id of ['linux-basics', 'windows-platform', 'networking-fundamentals', 'network-fundamentals', 'siem', 'alert-triage', 'python', 'powershell', 'aws', 'azure', 'gcp', 'cloud-security', 'endpoint-security', 'ids-ips', 'firewalls', 'vulnerability-management', 'digital-forensics', 'web-security', 'identity-analysis', 'incident-response']) assert.ok(ids.has(id), id);
});

test('partial, full, and zero local evidence are expressed as educational overlap states', () => {
  const portfolio = { skills: [
    { id: 'linux-basics', evidence: [{ activityTitle: 'Linux Fundamentals', source: 'completed-activity' }] },
    { id: 'siem', evidence: [{ activityTitle: 'SOC & SIEM Fundamentals', source: 'structured-portfolio' }] }
  ] };
  const job = { skills: [], extensions: { skillMappings: [{ id: 'linux-basics' }, { id: 'siem' }, { id: 'python' }] } };
  const partial = Matching.matchJobSkills(job, portfolio, Portfolio);
  assert.equal(partial.message, 'Demonstrated: 2 skills · Developing: 0 skills · Skill gaps: 1 skills');
  assert.deepEqual(partial.missingSkillIds, ['python']);
  assert.match(partial.disclaimer, /does not determine eligibility, hiring decisions/);
  const full = Matching.matchJobSkills(job, { skills: job.extensions.skillMappings }, Portfolio);
  assert.equal(full.matchedCount, 3);
  assert.equal(full.missing.length, 0);
  const zero = Matching.matchJobSkills(job, { skills: [] }, Portfolio);
  assert.equal(zero.gapCount, 3);
});

test('unmapped listings have the exact no-comparison state and no fabricated gaps', () => {
  const match = Matching.matchJobSkills({ skills: [], extensions: { skillMappings: [] } }, { skills: [] }, Portfolio);
  assert.equal(match.message, "Better Hacker couldn't identify enough structured skills in this listing for an evidence comparison.");
  assert.equal(match.gaps.length, 0);
  const rejected = mappedJob('Security Analyst', 'Experience with an unlisted quantum orchestration platform.');
  assert.deepEqual(Matching.jobSkills(rejected), []);
});

test('only completed authored activities and structured activity IDs produce local evidence', () => {
  const local = storage({ betterHackerLinuxComplete: 'true', betterHackerPortfolioProjects: JSON.stringify({ version: 1, projects: [
    { activityId: 'lesson-networking', title: 'Typed: expert Wireshark operator', findings: 'I know AWS and Python' },
    { activityId: 'unknown-freeform-project', title: 'SIEM Python expert' }
  ] }) });
  const evidence = Matching.deriveLocalEvidence(Portfolio, local);
  const ids = evidence.skills.map(item => item.id);
  assert.ok(ids.includes('linux-basics'));
  assert.equal(ids.includes('aws'), false);
  assert.equal(ids.includes('python'), false);
  assert.ok(evidence.skills.find(item => item.id === 'linux-basics').evidence.some(item => item.activityTitle === 'Linux Fundamentals'));
  assert.ok(evidence.activities.some(activity => activity.id === 'lesson-networking' && activity.portfolioSaved));
});

test('missing skills only link to authored existing activities with taxonomy evidence', () => {
  const skills = Mapping.mapListing({ title: 'Security Analyst', description: 'Linux and Python required.' });
  const match = Matching.matchJobSkills({ skills: [], extensions: { skillMappings: skills } }, { skills: [] }, Portfolio);
  const linux = match.gaps.find(item => item.id === 'linux-basics');
  const python = match.gaps.find(item => item.id === 'python');
  assert.ok(linux.activities.some(item => item.href === '#linux-lesson' || item.href === '#practice-linux-challenges'));
  assert.ok(python.activities.some(item => item.href === '#practice-python-log-review'));
  const windows = Matching.matchJobSkills({ skills: [], extensions: { skillMappings: [{ id: 'windows-platform' }] } }, { skills: [] }, Portfolio).gaps[0];
  assert.ok(windows.activities.some(item => item.href === '#investigation-windows'));
  assert.ok(match.gaps.every(item => item.activities.every(activity => Portfolio.ACTIVITIES.some(authored => authored.id === activity.id && authored.href === activity.href))));
  const sql = Matching.learningActivities('sql-injection-prevention', Portfolio);
  assert.ok(sql.some(activity => activity.href === '#lab-web-security'));
});

test('every current uncovered live-job skill has a direct evidence-gated learning destination', () => {
  const live = JSON.parse(fs.readFileSync('jobs-live.json', 'utf8'));
  const gapIds = new Set();
  for (const job of live.jobs) for (const skill of Matching.jobSkills(job)) gapIds.add(skill.id);
  for (const id of ['endpoint-security','gcp','aws','azure','python','powershell','ids-ips','firewalls','vulnerability-management','cloud-security','digital-forensics']) {
    assert.ok(gapIds.has(id), `expected current mapped gap ${id}`);
    const activities = Matching.learningActivities(id, Portfolio);
    assert.ok(activities.length > 0, `${id} should link to authored learning`);
    for (const activity of activities) {
      assert.ok(Portfolio.ACTIVITIES.some(authored => authored.id === activity.id && authored.href === activity.href));
      assert.match(activity.href, /^#[a-z0-9-]+$/);
      assert.ok(activity.href.slice(1).length > 0);
    }
  }
  const storageWithGeneralCloud = storage({ betterHackerPracticeCloudResponsibilityComplete: 'true' });
  const general = Matching.deriveLocalEvidence(Portfolio, storageWithGeneralCloud);
  assert.ok(general.skills.some(skill => skill.id === 'cloud-security'));
  assert.equal(general.skills.some(skill => skill.id === 'aws' || skill.id === 'azure' || skill.id === 'gcp'), false);
  const storageWithAws = storage({ betterHackerPracticeAwsIamReviewComplete: 'true' });
  const aws = Matching.deriveLocalEvidence(Portfolio, storageWithAws);
  assert.ok(aws.skills.some(skill => skill.id === 'aws'));
  assert.equal(aws.skills.some(skill => skill.id === 'azure' || skill.id === 'gcp'), false);
});

test('live and demo jobs stay separate, and malicious descriptions are inserted only as text', () => {
  const demo = Demo.createDemoJobs(Jobs)[0];
  assert.equal(Matching.jobSkills(demo).length, 0);
  const source = '<img src=x onerror=alert(1)> Linux';
  const live = mappedJob('Security Analyst', source);
  assert.equal(live.description, source);
  assert.deepEqual(Matching.jobSkills(live).map(item => item.id), ['linux-basics']);
  const uiSource = fs.readFileSync('jobs-ui.js', 'utf8');
  assert.match(uiSource, /element\.textContent = value/);
  assert.doesNotMatch(uiSource, /innerHTML\s*=/);
  assert.match(uiSource, /job\.isDemo \? \[\] : Matching\.jobSkills/);
});

test('mapping search remains available to existing jobs filters without changing application URL handling', () => {
  const job = mappedJob('Security Analyst', 'Microsoft Sentinel and Linux');
  const normalized = Jobs.normalizeJob({ title: job.title, employer: 'Verified Co', skills: [], source: { name: 'Greenhouse', id: 'verified', kind: 'ats-public-feed' }, applicationUrl: 'https://job-boards.greenhouse.io/verified/jobs/81', externalId: '81', extensions: { adapter: 'greenhouse-job-board', boardToken: 'verified', skillMappings: job.extensions.skillMappings } });
  assert.equal(normalized.ok, true);
  assert.equal(Jobs.filterJobs([normalized.job], { skill: 'sentinel' }).length, 1);
  assert.equal(Jobs.filterJobs([normalized.job], { query: 'linux' }).length, 1);
  assert.equal(JobsUI.trustedApplicationUrl(normalized.job), true);
  const page = fs.readFileSync('index.html', 'utf8');
  assert.match(page, /pro-jobs-results.*jobs-results/);
  assert.match(page, /pro-jobs-status.*role="status" aria-live="polite"/);
});

test('privacy documentation describes local matching and application-link separation', () => {
  const privacy = fs.readFileSync('privacy.html', 'utf8');
  assert.match(privacy, /not sent to Greenhouse, Lever, employers, analytics providers, or application sites/);
  assert.match(privacy, /not added to application links/);
});

test('meaningful answer interactions create local developing markers, not completion evidence', () => {
  const values = new Map();
  const local = { getItem: key => values.get(key) || null, setItem(key, value) { values.set(key, value); return true; } };
  assert.equal(Progress.markStarted('practice-linux-challenges', local), true);
  assert.equal(Progress.markStarted('unknown-freeform-project', local), false);
  assert.deepEqual(Progress.read(local).started, ['practice-linux-challenges']);
  const evidence = Matching.deriveLocalEvidence(Portfolio, local, Progress);
  assert.equal(evidence.skills.some(skill => skill.id === 'linux-basics'), false);
  assert.ok(evidence.developingSkills.some(skill => skill.id === 'linux-basics'));
  const job = { skills: [], extensions: { skillMappings: [{ id: 'linux-basics' }, { id: 'python' }] } };
  const match = Matching.matchJobSkills(job, evidence, Portfolio);
  assert.equal(match.skills.find(skill => skill.id === 'linux-basics').status, 'developing');
  assert.equal(match.skills.find(skill => skill.id === 'python').status, 'gap');
  assert.equal(match.developingCount, 1);
  assert.equal(match.gapCount, 1);
  assert.equal(values.has('betterHackerPracticeLinuxChallengesComplete'), false);
});

test('only actual learner interaction marks an authored activity as developing', () => {
  const handlers = {};
  const target = { closest: selector => selector === '[data-answer]' ? null : null };
  const section = { contains: value => value === target };
  const doc = { addEventListener(type, callback) { handlers[type] = callback; }, getElementById: id => id === 'practice-linux-challenges' ? section : null };
  const values = new Map();
  const local = { getItem: key => values.get(key) || null, setItem(key, value) { values.set(key, value); return true; } };
  Progress.observe(doc, local);
  assert.deepEqual(Progress.read(local).started, []); // Loading/opening the page does not mark anything.
  handlers.input({ target });
  assert.deepEqual(Progress.read(local).started, ['practice-linux-challenges']);
});

test('job readiness supports portfolio evidence, real learning links, and unavailable content', () => {
  const values = new Map([['betterHackerPracticeNetworkAnalysisComplete', 'true']]);
  const local = { getItem: key => values.get(key) || null, setItem(key, value) { values.set(key, value); return true; } };
  Portfolio.createProject(local, 'practice-network-analysis');
  const evidence = Matching.deriveLocalEvidence(Portfolio, local);
  const job = { title: 'Security Analyst', description: 'Network analysis and Nmap', skills: [], extensions: { skillMappings: [{ id: 'network-analysis' }, { id: 'nmap' }] } };
  const before = JSON.stringify(job);
  const match = Matching.matchJobSkills(job, evidence, Portfolio);
  assert.equal(match.skills.find(skill => skill.id === 'network-analysis').status, 'demonstrated');
  assert.equal(match.skills.find(skill => skill.id === 'nmap').status, 'gap');
  assert.deepEqual(match.portfolioEvidence.map(item => [item.skillId, item.activityId]), [['network-analysis', 'practice-network-analysis']]);
  assert.ok(match.gaps.find(item => item.id === 'nmap').activities.length === 0);
  assert.equal(JSON.stringify(job), before);
});

test('a listing with no recognized job skills has no fabricated skill gaps', () => {
  const job = { title: 'Security Analyst', skills: [{ id: null, label: 'Quantum risk orchestration' }], extensions: { skillMappings: [] } };
  const match = Matching.matchJobSkills(job, { skills: [] }, Portfolio);
  assert.equal(match.totalCount, 0);
  assert.equal(match.gapCount, 0);
  assert.equal(match.message, Matching.NO_SKILLS);
});
