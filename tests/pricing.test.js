const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('index.html', 'utf8');
const style = fs.readFileSync('style.css', 'utf8');
const pricingSection = html.match(/<section id="pricing"[\s\S]*?<\/section>/)?.[0] || '';

test('pricing names the three plans and accurately presents published beta access', () => {
  assert.match(pricingSection, /id="plan-free-name">Free/);
  assert.match(pricingSection, /\$0<span class="plan-period"> no cost/);
  assert.match(pricingSection, /id="plan-monthly-name">Better Hacker Pro/);
  assert.match(pricingSection, /\$7\.99<span class="plan-period"> \/ month/);
  assert.match(pricingSection, /id="plan-annual-name">Better Hacker Pro Annual/);
  assert.match(pricingSection, /\$69<span class="plan-period"> \/ year/);
  assert.match(pricingSection, /All features currently published in the beta remain available to everyone/);
  for (const feature of ['Guided beginner lessons', 'Hands-on practice and investigations', 'Daily Practice and progress tracking', 'Learning Assistant guidance', 'Portfolio-building tools']) assert.match(pricingSection, new RegExp(feature));
});

test('annual equivalent and savings are mathematically accurate and clearly described', () => {
  assert.equal((69 / 12).toFixed(2), '5.75');
  assert.equal(Math.round((1 - 69 / (7.99 * 12)) * 100), 28);
  assert.match(pricingSection, /About \$5\.75 per month, billed yearly/);
  assert.match(pricingSection, /About 28% savings compared with 12 monthly payments/);
});

test('paid plans are labeled Coming Soon and do not offer a purchase or checkout action', () => {
  assert.match(pricingSection, /Cancel anytime once paid subscriptions are available/);
  assert.match(pricingSection, /aria-label="Better Hacker Pro monthly plan coming soon">Coming Soon/);
  assert.match(pricingSection, /aria-label="Better Hacker Pro Annual plan coming soon">Coming Soon/);
  assert.match(pricingSection, /Paid plans are coming soon\. You cannot purchase a subscription or be charged from this site today\./);
  assert.doesNotMatch(pricingSection, /<button|href="[^"]*checkout|Start Pro|Start Annual|Continue to secure checkout|Review your plan/);
  assert.doesNotMatch(html, /<script src="checkout\.js"/);
  assert.doesNotMatch(pricingSection, /data-checkout-plan|checkout-panel|checkout-continue/);
});

test('free CTA and pricing section remain accessible and pricing remains responsive', () => {
  assert.match(html, /<li><a href="#pricing">Pricing<\/a><\/li>/);
  assert.match(html, /<section id="pricing" class="section dark-section pricing-section" aria-labelledby="pricing-title"/);
  assert.match(pricingSection, /<a href="#learn" class="primary-button">Start Learning Free<\/a>/);
  assert.match(style, /a:focus-visible,[\s\S]*button:focus-visible/);
  assert.match(style, /@media \(max-width: 600px\)[^{]*\{[^}]*\.pricing-grid \{ grid-template-columns: minmax\(0, 1fr\)/);
});
