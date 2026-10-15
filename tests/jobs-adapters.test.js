const assert = require('node:assert/strict');
const test = require('node:test');
const Jobs = require('../jobs.js');
const Adapters = require('../jobs-adapters.js');
const Ingestion = require('../jobs-server/ingest.js');
const Demo = require('../jobs-demo.js');
const fs = require('node:fs');

const importedAt = '2026-10-14T23:00:00.000Z';
const greenhouse = {
  type: 'greenhouse', id: 'gh-example', name: 'Example Careers', employerName: 'Example Employer',
  sourceUrl: 'https://careers.example.com', boardToken: 'example-board'
};
const lever = {
  type: 'lever', id: 'lever-example', name: 'Example Careers', employerName: 'Example Employer',
  sourceUrl: 'https://jobs.lever.co/example', site: 'example', region: 'global'
};

function response(payload, status = 200) {
  const body = JSON.stringify(payload);
  return { ok: status >= 200 && status < 300, status, headers: { get: name => name === 'content-type' ? 'application/json' : name === 'content-length' ? String(Buffer.byteLength(body)) : null }, text: async () => body };
}

test('Greenhouse adapter preserves source facts and leaves absent level, skills, pay, and date unknown', () => {
  const raw = Adapters.adapt(greenhouse, { jobs: [{ id: 123, title: 'SOC Analyst', location: { name: 'Detroit, MI' }, absolute_url: 'https://boards.greenhouse.io/example/jobs/123', content: '<p>Review alerts &amp; escalate.</p>' }] }, importedAt);
  const result = Jobs.ingestRecords(raw, { importedAt });
  assert.equal(result.jobs.length, 1);
  const job = result.jobs[0];
  assert.equal(job.source.id, 'gh-example');
  assert.equal(job.source.kind, 'ats-public-feed');
  assert.equal(job.source.url, 'https://careers.example.com/');
  assert.equal(job.externalId, '123');
  assert.equal(job.employer, 'Example Employer');
  assert.equal(job.experienceLevel, 'unspecified');
  assert.deepEqual(job.skills, []);
  assert.equal(job.salaryRange, null);
  assert.equal(job.datePosted, null);
  assert.equal(job.lastObservedAt, importedAt);
  assert.equal(job.description, 'Review alerts & escalate.');
  assert.equal(job.isDemo, false);
});

test('Lever adapter maps published postings and source-provided level without inventing skills', () => {
  const posted = Date.parse('2026-10-01T12:30:00.000Z');
  const raw = Adapters.adapt(lever, [{ id: 'lever-55', text: 'Security Analyst', createdAt: posted, hostedUrl: 'https://jobs.lever.co/example/lever-55', applyUrl: 'https://jobs.lever.co/example/lever-55/apply', descriptionPlain: 'Monitor security alerts.', categories: { location: 'Remote', level: 'Junior' } }], importedAt);
  const job = Jobs.ingestRecords(raw, { importedAt }).jobs[0];
  assert.equal(job.datePosted, '2026-10-01');
  assert.equal(job.experienceLevel, 'junior');
  assert.deepEqual(job.skills, []);
  assert.equal(job.applicationUrl, 'https://jobs.lever.co/example/lever-55/apply');
  assert.equal(job.extensions.level, 'Junior');
});

test('source endpoints are fixed HTTPS hosts and malformed configs or payloads fail closed', () => {
  assert.equal(Adapters.endpoint(greenhouse), 'https://boards-api.greenhouse.io/v1/boards/example-board/jobs?content=true');
  assert.equal(Adapters.endpoint(lever), 'https://api.lever.co/v0/postings/example?mode=json');
  assert.throws(() => Adapters.endpoint({ ...lever, site: '../evil' }), /simple public board identifier/i);
  assert.throws(() => Adapters.adapt({ ...greenhouse, sourceUrl: 'javascript:alert(1)' }, { jobs: [] }, importedAt), /HTTPS employer career-page URL/i);
  assert.throws(() => Adapters.adapt(greenhouse, {}, importedAt), /jobs array/i);
  const malformed = Jobs.ingestRecords(Adapters.adapt(greenhouse, { jobs: [{ id: 2, title: 'Broken', absolute_url: 'javascript:alert(1)' }] }, importedAt), { importedAt });
  assert.equal(malformed.jobs.length, 0);
  assert.match(malformed.rejected[0].errors.join(' '), /HTTPS URL/i);
  assert.equal(Jobs.canonicalApplicationUrl(`https://jobs.example/${'x'.repeat(2100)}`), null);
  const tooManySkills = Jobs.normalizeJob({
    title: 'Long input test', source: { id: 'test', name: 'Test', kind: 'api' }, applicationUrl: 'https://jobs.example/1',
    skills: Array.from({ length: 105 }, (_, index) => `Unknown skill ${index}`)
  }, { importedAt });
  assert.equal(tooManySkills.job.skills.length, 100);
  assert.ok(tooManySkills.warnings.some(message => /first 100 skill entries/i.test(message)));
});

test('backend creates a sanitized source-attributed dataset, filters expired entries at search time, and rejects bad feeds', async () => {
  const payload = { jobs: [
    { id: 1, title: 'Junior SOC Analyst', location: { name: 'Detroit, MI' }, absolute_url: 'https://job-boards.greenhouse.io/example-board/jobs/1', first_published: '2026-10-10', content: '<script>alert(1)</script> Review alerts.' },
    { id: 2, title: 'SOC Analyst', absolute_url: 'https://job-boards.greenhouse.io/example-board/jobs/2', application_deadline: '2026-10-01' },
    { id: 3, title: 'SOC Analyst', absolute_url: 'https://evil.example/jobs/3' },
    { id: 4, title: 'Marketing Coordinator', absolute_url: 'https://job-boards.greenhouse.io/example-board/jobs/4' }
  ] };
  const dataset = await Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt, delayMs: 0, fetch: async url => { assert.equal(url, Adapters.endpoint(greenhouse)); return response(payload); } });
  assert.equal(dataset.kind, 'live-job-feed');
  assert.equal(dataset.sourceCount, 1);
  assert.equal(dataset.jobs.length, 2);
  assert.equal(dataset.rejectedCount, 0);
  assert.equal(dataset.relevanceRejectedCount, 1);
  assert.equal(dataset.unsafeUrlRejectedCount, 1);
  assert.ok(dataset.jobs.every(job => job.source.name === 'Example Careers' && job.source.kind === 'ats-public-feed' && job.source.url));
  assert.equal(Jobs.filterJobs(dataset.jobs, {}, '2026-10-14').length, 1);
  assert.equal(Jobs.filterJobs(dataset.jobs, { query: 'Junior SOC', location: 'detroit' }, '2026-10-14').length, 1);
  assert.equal(dataset.jobs.find(job => job.externalId === '1').description, 'Review alerts.');
  const empty = await Ingestion.buildDataset({ sources: [] }, { importedAt });
  assert.equal(empty.sourceCount, 0);
  assert.match(empty.note, /No approved employer feed/i);
  await assert.rejects(Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt, delayMs: 0, fetch: async () => response({}, 429) }), /refusing to replace/i);
  await assert.rejects(Ingestion.buildDataset({ sources: [greenhouse, { ...greenhouse, id: 'gh-example' }] }, { importedAt }), /Duplicate source ID/i);
});

test('demo and live data stay distinct; imported HTML-like text is retained as text content', () => {
  const demo = Demo.createDemoJobs(Jobs, importedAt);
  const live = Jobs.ingestRecords(Adapters.adapt(lever, [{ id: 'x', text: '<img src=x onerror=alert(1)>', applyUrl: 'https://jobs.lever.co/example/x' }], importedAt), { importedAt }).jobs;
  assert.ok(demo.every(job => job.isDemo));
  assert.ok(live.every(job => !job.isDemo));
  assert.notEqual(Jobs.duplicateKey(demo[0]), Jobs.duplicateKey(live[0]));
  const ui = fs.readFileSync('jobs-ui.js', 'utf8');
  assert.match(ui, /element\.textContent = value/);
  assert.doesNotMatch(ui, /\.innerHTML\s*=/);
});
