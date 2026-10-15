const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const Jobs = require('../jobs.js');
const Demo = require('../jobs-demo.js');
const Ingest = require('../jobs-ingest.js');
const Matching = require('../jobs-matching.js');
const JobsUI = require('../jobs-ui.js');
const Portfolio = require('../portfolio.js');
const State = require('../learner-state.js');

const fixedImport = '2026-10-14T19:00:00.000Z';
function record(overrides = {}) {
  return {
    title: 'Junior SOC Analyst', employer: 'Example Employer', location: 'Detroit, MI', workplace: 'remote',
    employmentType: 'full-time', experienceLevel: 'entry-level', categories: ['entry-level', 'soc'],
    salaryRange: null, datePosted: '2026-10-10', skills: ['Alert triage', 'SIEM'],
    description: 'Review supplied alerts and escalate findings.', source: { id: 'approved-feed', name: 'Approved Feed', kind: 'api' },
    applicationUrl: 'https://jobs.example/roles/123?utm_source=feed', expiresAt: null, ...overrides
  };
}

class FakeElement {
  constructor(tagName = 'DIV') { this.tagName = tagName; this.children = []; this.attributes = {}; this.listeners = {}; this.dataset = {}; this.value = ''; this.className = ''; this._text = ''; }
  append(...elements) { this.children.push(...elements); }
  replaceChildren(...elements) { this.children = elements; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  focus() { this.focused = true; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  dispatch(name) { (this.listeners[name] || []).forEach(callback => callback({ target: this })); }
}
function fakeDocument() {
  const elements = {
    'pro-cybersecurity-jobs': new FakeElement('SECTION'), 'pro-jobs-search': new FakeElement('INPUT'),
    'pro-jobs-category': new FakeElement('SELECT'), 'pro-jobs-workplace': new FakeElement('SELECT'),
    'pro-jobs-type': new FakeElement('SELECT'), 'pro-jobs-level': new FakeElement('SELECT'),
    'pro-jobs-location': new FakeElement('INPUT'), 'pro-jobs-skill': new FakeElement('INPUT'),
    'pro-jobs-clear': new FakeElement('BUTTON'), 'pro-jobs-results': new FakeElement('DIV'),
    'pro-jobs-status': new FakeElement('P')
  };
  for (const id of ['pro-jobs-category', 'pro-jobs-workplace', 'pro-jobs-type', 'pro-jobs-level']) elements[id].value = 'all';
  return { elements, createElement: tag => new FakeElement(tag.toUpperCase()), getElementById: id => elements[id] || null };
}
function descendants(element) { return [element, ...element.children.flatMap(descendants)]; }

test('normalizes supported fields, keeps optional facts empty, and records import/source metadata', () => {
  const result = Jobs.normalizeJob(record(), { importedAt: fixedImport });
  assert.equal(result.ok, true);
  assert.equal(result.job.schemaVersion, 1);
  assert.equal(result.job.title, 'Junior SOC Analyst');
  assert.equal(result.job.source.name, 'Approved Feed');
  assert.equal(result.job.dateImported, fixedImport);
  assert.equal(result.job.salaryRange, null);
  assert.equal(result.job.expiresAt, null);
  assert.equal(result.job.skills[0].id, 'alert-triage');
  assert.equal(result.job.applicationUrl, 'https://jobs.example/roles/123');
});

test('rejects invalid required fields, unsafe URLs, invalid dates and invalid salary without hiding errors', () => {
  const invalid = Jobs.normalizeJob(record({ title: '', applicationUrl: 'javascript:alert(1)', datePosted: '2026-02-31', salaryRange: { min: 90, max: 10, currency: 'US', period: 'century' } }), { importedAt: fixedImport });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.job, null);
  assert.match(invalid.errors.join(' '), /title is required/i);
  assert.match(invalid.errors.join(' '), /HTTPS URL/i);
  assert.match(invalid.errors.join(' '), /Date posted/i);
  assert.match(invalid.errors.join(' '), /minimum cannot be greater/i);
  assert.match(invalid.errors.join(' '), /three-letter code/i);
  assert.match(invalid.errors.join(' '), /Salary period/i);
  const report = Jobs.ingestRecords([record({ title: '' })], { source: 'Approved Feed', importedAt: fixedImport });
  assert.equal(report.rejected.length, 1);
  assert.ok(report.rejected[0].record);
  assert.ok(report.rejected[0].errors.length);
});

test('normalizes JSON and CSV imports and retains row-level parse/validation failures', () => {
  const json = Ingest.ingestJson(JSON.stringify({ jobs: [record(), { title: '' }] }), { importedAt: fixedImport });
  assert.equal(json.jobs.length, 1);
  assert.equal(json.rejected.length, 1);
  const csv = 'job_title,employer,location,workplace,employment_type,experience_level,categories,skills,source_name,application_url\n"Junior Analyst","Example Org","Detroit, MI",remote,full-time,entry-level,"entry-level;soc","SIEM;Alert triage",Approved Feed,https://jobs.example/abc\nBad Row,,,,,,,,\n';
  const imported = Ingest.ingestCsv(csv, { importedAt: fixedImport });
  assert.equal(imported.jobs.length, 1);
  assert.equal(imported.jobs[0].location.display, 'Detroit, MI');
  assert.equal(imported.jobs[0].skills.length, 2);
  assert.equal(imported.rejected.length, 1);
  const malformed = Ingest.ingestCsv('title,source,application_url\n"Unclosed,Feed,https://jobs.example/1', { importedAt: fixedImport });
  assert.ok(malformed.warnings.length || malformed.rejected.length);
});

test('deduplicates across tracking variants, repeated source IDs, and same-batch records', () => {
  const first = record();
  const sameUrl = record({ id: 'duplicate-id', applicationUrl: 'https://jobs.example/roles/123?utm_campaign=mail' });
  const sameId = record({ externalId: 'req-7', id: 'original' });
  const repeatedId = record({ externalId: 'req-7', id: 'repeat', applicationUrl: 'https://jobs.example/other' });
  const report = Jobs.ingestRecords([first, sameUrl, sameId, repeatedId], { importedAt: fixedImport });
  assert.equal(report.jobs.length, 2);
  assert.equal(report.duplicates.length, 2);
  assert.equal(report.duplicates[0].duplicateOf, 'job-https-jobs-example-roles-123');
  const againstExisting = Jobs.ingestRecords([record()], { existingJobs: report.jobs, importedAt: fixedImport });
  assert.equal(againstExisting.jobs.length, 0);
  assert.equal(againstExisting.duplicates.length, 1);
});

test('search and role filters cover categories, remote arrangements, location, and skills', () => {
  const jobs = Demo.createDemoJobs(Jobs, fixedImport);
  assert.equal(Jobs.filterJobs(jobs, { query: 'SOC Analyst' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { category: 'internship' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { category: 'help-desk-it', workplace: 'onsite' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { experienceLevel: 'entry-level', workplace: 'remote' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { location: 'sample region' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { skill: 'siem' }).length, 1);
  assert.equal(Jobs.filterJobs(jobs, { query: 'quantum pineapple' }).length, 0);
});

test('freshness distinguishes demo, unknown, stale and expired postings without inventing dates', () => {
  const jobs = Demo.createDemoJobs(Jobs, fixedImport);
  assert.ok(jobs.every(job => job.isDemo && job.datePosted === null && job.salaryRange === null && !job.applicationUrl));
  assert.equal(Jobs.freshness(jobs[0], '2026-10-14'), 'demo');
  assert.equal(Jobs.freshness(Jobs.normalizeJob(record({ datePosted: null }), { importedAt: fixedImport }).job, '2026-10-14'), 'unknown');
  const stale = Jobs.normalizeJob(record({ datePosted: '2026-08-01' }), { importedAt: fixedImport }).job;
  const expired = Jobs.normalizeJob(record({ expiresAt: '2026-10-01' }), { importedAt: fixedImport }).job;
  assert.equal(Jobs.freshness(stale, '2026-10-14'), 'stale');
  assert.equal(Jobs.freshness(expired, '2026-10-14'), 'expired');
  assert.equal(Jobs.filterJobs([expired], {}).length, 0);
  const lastObservedTooLongAgo = Jobs.normalizeJob(record({ lastObservedAt: '2026-10-01T00:00:00.000Z' }), { importedAt: fixedImport }).job;
  assert.equal(Jobs.freshness(lastObservedTooLongAgo, '2026-10-14'), 'removed');
  assert.equal(Jobs.filterJobs([lastObservedTooLongAgo], {}, '2026-10-14').length, 0);
});

test('local evidence matching is deterministic, uses completed records, and avoids learner text', () => {
  const values = new Map([
    ['betterHackerSocComplete', 'true'], ['betterHackerSocInvestigationComplete', 'true'],
    ['betterHackerCompletedLabs', '1']
  ]);
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, value); }
  };
  const daily = Portfolio.ACTIVITIES.find(activity => activity.dailyId);
  const dailyState = State.completeDailyChallenge(State.emptyDailyState(), '2026-10-14', daily.dailyId, 50, { title: 'Local demo activity', track: 'SOC' }).state;
  storage.setItem(State.DAILY_KEY, JSON.stringify(dailyState));
  const evidence = Matching.deriveLocalEvidence(Portfolio, storage);
  const job = Jobs.normalizeJob(record({ skills: ['Alert triage', 'Log analysis', 'SIEM', 'Wireshark'] }), { importedAt: fixedImport }).job;
  const match = Matching.matchJobSkills(job, evidence);
  assert.equal(match.matchedCount, 3);
  assert.equal(match.totalCount, 3);
  assert.equal(match.message, 'Demonstrated: 3 skills · Developing: 0 skills · Skill gaps: 0 skills');
  assert.match(match.disclaimer, /does not determine eligibility, hiring decisions/i);
  assert.ok(evidence.activities.some(item => item.id.startsWith('investigation-')));
  assert.ok(evidence.activities.some(item => item.id.startsWith('practice-')));
  assert.ok(!JSON.stringify(evidence).includes('password'));
  const unknownSkill = Jobs.normalizeJob(record({ skills: [{ id: 'invented-skill', label: 'Invented Skill' }] }), { importedAt: fixedImport });
  assert.equal(unknownSkill.job.skills[0].id, null);
});

test('job view links only relevant saved portfolio evidence and explains unmapped learning gaps', () => {
  const local = new Map([['betterHackerPracticeNetworkAnalysisComplete', 'true']]);
  const storage = { getItem: key => local.get(key) || null, setItem(key, value) { local.set(key, value); return true; } };
  Portfolio.createProject(storage, 'practice-network-analysis');
  const evidence = Matching.deriveLocalEvidence(Portfolio, storage);
  const job = { title: 'Security Analyst', employer: 'Example Employer', description: 'Network analysis and Nmap', skills: [], source: { name: 'Greenhouse' }, applicationUrl: null, dateImported: fixedImport, isDemo: false, extensions: { skillMappings: [{ id: 'network-analysis' }, { id: 'nmap' }] } };
  const rendered = JobsUI.renderJob({ createElement: tag => new FakeElement(tag.toUpperCase()) }, job, evidence);
  const portfolioButton = descendants(rendered).find(node => node.dataset.portfolioView === 'practice-network-analysis');
  assert.ok(portfolioButton);
  assert.match(rendered.textContent, /No Better Hacker activity is currently available for this skill\./);
  assert.match(rendered.textContent, /Demonstrated/);
  assert.match(rendered.textContent, /Skill Gap/);
});

test('demo jobs are isolated, explicitly labeled, and provide honest empty states', () => {
  const jobs = Demo.createDemoJobs(Jobs, fixedImport);
  assert.equal(Demo.DEMO_JOB_RECORDS.length, 3);
  assert.ok(jobs.every(job => job.isDemo && job.source.kind === 'demo'));
  assert.ok(jobs.every(job => job.employer.includes('Fictional')));
  const documentRef = fakeDocument();
  const ui = JobsUI.mount(documentRef, null);
  assert.equal(ui.jobs.length, 3);
  assert.match(documentRef.elements['pro-jobs-status'].textContent, /not current vacancies/i);
  assert.ok(documentRef.elements['pro-jobs-results'].children.every(card => descendants(card).some(node => /DEMO · NOT A CURRENT OPENING/.test(node.textContent))));
  documentRef.elements['pro-jobs-search'].value = 'no such job';
  ui.render();
  assert.match(documentRef.elements['pro-jobs-results'].textContent, /No sample roles match/i);
  documentRef.elements['pro-jobs-clear'].dispatch('click');
  assert.match(documentRef.elements['pro-jobs-status'].textContent, /3 demo roles shown/);
  assert.equal(documentRef.elements['pro-jobs-search'].focused, true);
});

test('jobs UI loads only same-origin validated live data and keeps it separate from demo labels', async () => {
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const previousFetch = globalThis.fetch;
  let fetchedUrl = null;
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { href: 'https://betterhacker.example/', origin: 'https://betterhacker.example' } });
  globalThis.fetch = async url => {
    fetchedUrl = url;
    assert.equal(url, 'https://betterhacker.example/jobs-live.json');
    return { ok: true, json: async () => ({ schemaVersion: 1, kind: 'live-job-feed', jobs: [record({
      externalId: '123', applicationUrl: 'https://job-boards.greenhouse.io/example/jobs/123',
      source: { id: 'approved-feed', name: 'Greenhouse', kind: 'ats-public-feed', url: 'https://careers.example/' },
      lastObservedAt: fixedImport, extensions: { adapter: 'greenhouse-job-board', boardToken: 'example' }
    })] }) };
  };
  try {
    assert.equal(globalThis.location.href, 'https://betterhacker.example/');
    assert.equal(typeof globalThis.fetch, 'function');
    const documentRef = fakeDocument();
    const ui = JobsUI.mount(documentRef, null);
    await ui.refreshLiveJobs();
    assert.equal(fetchedUrl, 'https://betterhacker.example/jobs-live.json');
    assert.equal(ui.jobs.length, 4);
    assert.equal(ui.jobs.filter(job => !job.isDemo).length, 1);
    assert.match(documentRef.elements['pro-jobs-status'].textContent, /1 real listing shown/);
    assert.match(documentRef.elements['pro-jobs-results'].textContent, /LIVE · CURRENT LISTING/);
    assert.match(documentRef.elements['pro-jobs-results'].textContent, /DEMO · NOT A CURRENT OPENING/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else delete globalThis.location;
  }
});

test('a verified empty live dataset states that no current cybersecurity listings were found', async () => {
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const previousFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { href: 'https://betterhacker.example/', origin: 'https://betterhacker.example' } });
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ schemaVersion: 1, kind: 'live-job-feed', jobs: [] }) });
  try {
    const documentRef = fakeDocument();
    const ui = JobsUI.mount(documentRef, null);
    await ui.refreshLiveJobs();
    assert.match(documentRef.elements['pro-jobs-status'].textContent, /No current cybersecurity listings were found from the connected sources\. Check back as employer feeds update\./);
    assert.equal(ui.jobs.filter(job => !job.isDemo).length, 0);
    assert.match(documentRef.elements['pro-jobs-status'].textContent, /demo roles shown separately/i);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else delete globalThis.location;
  }
});

test('external application links clearly leave Better Hacker and are omitted from demo jobs', () => {
  const documentRef = fakeDocument();
  const demoJob = Demo.createDemoJobs(Jobs, fixedImport)[0];
  assert.equal(JobsUI.applicationLink(documentRef, demoJob), null);
  const normalized = Jobs.normalizeJob(record({ externalId: '123', applicationUrl: 'https://job-boards.greenhouse.io/example/jobs/123',
    source: { id: 'approved-feed', name: 'Greenhouse', kind: 'ats-public-feed' },
    extensions: { adapter: 'greenhouse-job-board', boardToken: 'example' } }), { importedAt: fixedImport }).job;
  const anchor = JobsUI.applicationLink(documentRef, normalized);
  assert.equal(anchor.href, 'https://job-boards.greenhouse.io/example/jobs/123');
  assert.equal(anchor.target, '_blank');
  assert.equal(anchor.rel, 'noopener noreferrer');
  assert.match(anchor.textContent, /Apply at Source/);
  assert.match(anchor.attributes['aria-label'], /leaves Better Hacker/);
});

test('jobs interface has labeled controls, keyboard focus styling, and no remote tracking requests', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const css = fs.readFileSync('style.css', 'utf8');
  const ui = fs.readFileSync('jobs-ui.js', 'utf8');
  for (const id of ['pro-jobs-search', 'pro-jobs-category', 'pro-jobs-workplace', 'pro-jobs-type', 'pro-jobs-level', 'pro-jobs-location', 'pro-jobs-skill']) {
    assert.match(html, new RegExp(`for="${id}"`));
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /id="pro-jobs-status" class="jobs-results-status" role="status" aria-live="polite"/);
  assert.match(css, /\.pro-jobs-experience :focus-visible/);
  assert.match(ui, /noopener noreferrer/);
  assert.match(ui, /new URL\("jobs-live\.json", root\.location\.href\)/);
  assert.match(ui, /datasetUrl\.origin !== root\.location\.origin/);
  assert.doesNotMatch(ui, /XMLHttpRequest|sendBeacon/);
  assert.match(css, /prefers-reduced-motion/);
});
