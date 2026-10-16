const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const Jobs = require('../jobs.js');
const Adapters = require('../jobs-adapters.js');
const Relevance = require('../jobs-relevance.js');
const Ingestion = require('../jobs-server/ingest.js');
const Demo = require('../jobs-demo.js');
const configuredSources = require('../jobs-sources.json').sources;
const liveDataset = require('../jobs-live.json');

const importedAt = '2026-10-14T12:00:00.000Z';
const greenhouse = { type: 'greenhouse', id: 'acme-gh', name: 'Greenhouse', employerName: 'Acme Security', sourceUrl: 'https://acme.example/careers', boardToken: 'acme' };
const lever = { type: 'lever', id: 'acme-lever', name: 'Lever', employerName: 'Acme Security', sourceUrl: 'https://jobs.lever.co/acme', site: 'acme', region: 'global' };
function response(payload, status = 200) {
  const body = JSON.stringify(payload);
  return { ok: status >= 200 && status < 300, status, headers: { get: name => name === 'content-type' ? 'application/json' : name === 'content-length' ? String(Buffer.byteLength(body)) : null }, text: async () => body };
}

test('configured Greenhouse and Lever sources use their fixed supported public feed APIs', () => {
  assert.equal(Adapters.endpoint(greenhouse), 'https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true');
  assert.equal(Adapters.endpoint(lever), 'https://api.lever.co/v0/postings/acme?mode=json');
});

test('the reviewed production config has four Greenhouse employers and one Lever employer', () => {
  assert.deepEqual(configuredSources.map(source => source.employerName), ['Volexity', 'Huntress', 'Censys', 'Relay', 'BrightEdge']);
  assert.equal(configuredSources.filter(source => source.type === 'greenhouse').length, 4);
  assert.equal(configuredSources.filter(source => source.type === 'lever').length, 1);
  for (const source of configuredSources) assert.match(source.sourceUrl, /^https:\/\//);
});

test('the committed live dataset contains unique source-attributed plain-text records with safe destinations', () => {
  assert.equal(liveDataset.kind, 'live-job-feed');
  assert.ok(liveDataset.jobs.length > 0);
  const seen = new Set();
  for (const job of liveDataset.jobs) {
    assert.equal(job.isDemo, false);
    assert.ok(job.title && job.employer && job.externalId);
    assert.ok(job.source.id && job.source.name && job.source.kind === 'ats-public-feed');
    assert.ok(Number.isFinite(Date.parse(job.dateImported)) && Number.isFinite(Date.parse(job.lastObservedAt)));
    assert.ok(Jobs.canonicalApplicationUrl(job.applicationUrl));
    assert.ok(!new URL(job.applicationUrl).port);
    assert.doesNotMatch(job.description || '', /<\/?(?:script|style|iframe|img|svg|[a-z][\w:-]*)(?:\s|\/?>)/i);
    if (job.datePosted) assert.ok(Date.parse(job.datePosted) <= Date.parse(job.dateImported));
    if (job.expiresAt && job.datePosted) assert.ok(Date.parse(job.expiresAt) >= Date.parse(job.datePosted));
    for (const key of Jobs.duplicateKeys(job)) {
      assert.ok(!seen.has(key), `duplicate job key ${key}`);
      seen.add(key);
    }
  }
});

test('relevance rules include named cyber functions and IT support while rejecting unrelated roles', () => {
  for (const title of ['SOC Analyst', 'Cybersecurity Engineer', 'Incident Response Analyst', 'Cloud Security Engineer', 'GRC Administrator', 'Help Desk Technician', 'IT Support Specialist']) {
    assert.equal(Relevance.classify({ title }).relevant, true, title);
  }
  for (const title of ['Marketing Coordinator', 'Finance Systems Administrator', 'Sales Engineer II', 'Senior Product Manager, SOC Experience', 'Security Guard']) {
    assert.equal(Relevance.classify({ title }).relevant, false, title);
  }
  assert.equal(Relevance.classify({ title: 'Support Engineer', description: 'Provides technical support for security operations tools and investigates security alerts.' }).relevant, true);
  assert.equal(Relevance.classify({ title: 'Customer Success Manager', description: 'Our cybersecurity mission protects security operations teams.' }).relevant, false);
});

test('unknown source experience stays unknown; explicit source levels are retained only when supported', () => {
  const rows = Adapters.adapt(greenhouse, { jobs: [{ id: 9, title: 'SOC Analyst', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/9' }] }, importedAt);
  assert.equal(Jobs.ingestRecords(rows, { importedAt }).jobs[0].experienceLevel, 'unspecified');
  const leverRows = Adapters.adapt(lever, [{ id: 'abc-9', text: 'Security Analyst', hostedUrl: 'https://jobs.lever.co/acme/abc-9', categories: { level: 'Junior' } }], importedAt);
  assert.equal(Jobs.ingestRecords(leverRows, { importedAt }).jobs[0].experienceLevel, 'junior');
});

test('ingestion keeps source attribution, metadata, allowed application hosts, and rejects irrelevant or unsafe records', async () => {
  const data = await Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt, delayMs: 0, fetch: async () => response({ jobs: [
    { id: 1, title: 'SOC Analyst', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/1', location: { name: 'Remote' }, first_published: '2026-10-10', content: '<p>Investigate Linux alerts and SIEM events.</p>' },
    { id: 2, title: 'Marketing Manager', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/2' },
    { id: 3, title: 'SOC Analyst', absolute_url: 'https://attacker.example/acme/jobs/3' },
    { id: 1, title: 'Security Analyst', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/1' }
  ] }) });
  assert.equal(data.jobs.length, 1);
  const job = data.jobs[0];
  assert.equal(job.title, 'SOC Analyst');
  assert.equal(job.employer, 'Acme Security');
  assert.equal(job.source.name, 'Greenhouse');
  assert.equal(job.source.id, 'acme-gh');
  assert.equal(job.externalId, '1');
  assert.equal(job.location.display, 'Remote');
  assert.equal(job.description, 'Investigate Linux alerts and SIEM events.');
  assert.equal(job.datePosted, '2026-10-10');
  assert.equal(job.dateImported, importedAt);
  assert.equal(job.lastObservedAt, importedAt);
  assert.equal(job.expiresAt, null);
  assert.equal(job.isDemo, false);
  assert.equal(job.description, 'Investigate Linux alerts and SIEM events.');
  assert.deepEqual(job.extensions.skillMappings.map(item => item.id), ['linux-basics', 'siem', 'alert-triage']);
  assert.ok(job.extensions.skillMappings.every(item => item.matchedPhrase && item.field));
  assert.equal(data.duplicateCount, 1);
  assert.equal(data.relevanceRejectedCount, 1);
  assert.equal(data.unsafeUrlRejectedCount, 1);
  assert.equal(job.extensions.relevance.matchedSignals.includes('security-operations'), true);
});

test('Lever records require the configured employer ATS path and preserve source facts', async () => {
  const data = await Ingestion.buildDataset({ sources: [lever] }, { importedAt, delayMs: 0, fetch: async () => response([
    { id: 'good-1', text: 'IT Support Specialist', hostedUrl: 'https://jobs.lever.co/acme/good-1', applyUrl: 'https://jobs.lever.co/acme/good-1/apply', createdAt: Date.parse('2026-10-12T09:00:00Z'), descriptionPlain: 'IT support and endpoint security.', categories: { location: 'San Mateo', team: 'IT Security' } },
    { id: 'bad-2', text: 'IT Support Specialist', hostedUrl: 'https://jobs.lever.co/other/bad-2' }
  ]) });
  assert.equal(data.jobs.length, 1);
  assert.equal(data.jobs[0].source.name, 'Lever');
  assert.equal(data.jobs[0].applicationUrl, 'https://jobs.lever.co/acme/good-1/apply');
  assert.equal(data.jobs[0].datePosted, '2026-10-12');
  assert.ok(data.jobs[0].extensions.skillMappings.some(item => item.id === 'endpoint-security'));
  assert.equal(data.unsafeUrlRejectedCount, 1);
});

test('successful empty feeds clear removed jobs; failed feeds do not replace the previous dataset', async () => {
  const one = { jobs: [{ id: 4, title: 'SOC Analyst', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/4' }] };
  const present = await Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt, delayMs: 0, fetch: async () => response(one) });
  const absent = await Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt: '2026-10-15T12:00:00.000Z', delayMs: 0, fetch: async () => response({ jobs: [] }) });
  assert.equal(present.jobs.length, 1);
  assert.deepEqual(absent.jobs, []);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'better-hacker-ingest-'));
  try {
    const configPath = path.join(dir, 'sources.json');
    const outputPath = path.join(dir, 'jobs-live.json');
    const previous = '{"kind":"live-job-feed","jobs":[{"previous":true}]}\n';
    await fs.writeFile(configPath, JSON.stringify({ sources: [greenhouse] }));
    await fs.writeFile(outputPath, previous);
    await assert.rejects(Ingestion.run({ configPath, outputPath, delayMs: 0, fetch: async () => response({}, 503) }), /refusing to replace/i);
    assert.equal(await fs.readFile(outputPath, 'utf8'), previous);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('live feed output stays free of fictional demo jobs', async () => {
  const live = await Ingestion.buildDataset({ sources: [greenhouse] }, { importedAt, delayMs: 0, fetch: async () => response({ jobs: [{ id: 1, title: 'SOC Analyst', absolute_url: 'https://job-boards.greenhouse.io/acme/jobs/1' }] }) });
  const demos = Demo.createDemoJobs(Jobs, importedAt);
  assert.ok(live.jobs.length > 0);
  assert.ok(live.jobs.every(job => job.isDemo === false && !job.employer.includes('Fictional')));
  assert.ok(demos.every(job => job.isDemo === true));
});
