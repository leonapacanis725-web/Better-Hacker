const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('index.html', 'utf8');

function section(id) {
  const start = html.indexOf(`<section id="${id}"`);
  assert.notEqual(start, -1, `missing section #${id}`);
  const end = html.indexOf('</section>', start);
  assert.notEqual(end, -1, `unclosed section #${id}`);
  return html.slice(start, end);
}

test('beginner start-here route ends with the existing Cybersecurity Jobs experience', () => {
  const start = html.indexOf('<nav class="review-panel" aria-labelledby="beginner-path-title">');
  const end = html.indexOf('</nav>', start);
  const path = html.slice(start, end);
  const destinations = [...path.matchAll(/href="#([a-z0-9-]+)"/g)].map(match => match[1]);
  for (const destination of ['fundamentals-lesson', 'practice-reconnaissance', 'daily-practice-workspace', 'practice-library', 'dashboard', 'portfolio', 'pro-cybersecurity-jobs']) {
    assert.ok(destinations.includes(destination), `beginner path is missing #${destination}`);
    assert.match(html, new RegExp(`id="${destination}"`), `#${destination} must remain a valid destination`);
  }
  assert.ok(destinations.lastIndexOf('portfolio') < destinations.lastIndexOf('pro-cybersecurity-jobs'), 'jobs follow portfolio building in the route');
});

test('Dashboard and Portfolio provide contextual paths into source-verified jobs', () => {
  const dashboard = section('dashboard');
  assert.match(dashboard, /Compare current source-verified openings with your completed learning and portfolio evidence\./);
  assert.match(dashboard, /href="#pro-cybersecurity-jobs"[^>]*>Explore Cybersecurity Jobs/);
  assert.doesNotMatch(dashboard, /sample entry paths/i);

  const portfolio = section('portfolio');
  assert.match(portfolio, /href="#pro-cybersecurity-jobs"[^>]*>Compare source-verified jobs/);
  assert.match(section('pro-cybersecurity-jobs'), /Your next step after learning, practice, and portfolio building/);
});
