const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const html = fs.readFileSync('index.html', 'utf8');
const style = fs.readFileSync('style.css', 'utf8');
const checkout = fs.readFileSync('checkout.js', 'utf8');
const pricingStart = html.indexOf('<section id="pricing"');
const pricingEnd = html.indexOf('<!-- Call To Action -->', pricingStart);
const pricingSection = pricingStart >= 0 && pricingEnd > pricingStart ? html.slice(pricingStart, pricingEnd) : '';

test('pricing publishes Free, Pro Monthly, and Pro Annual plans with the established prices', () => {
  assert.match(pricingSection, /id="plan-free-name">Free/);
  assert.match(pricingSection, /\$0<span class="plan-period"> no cost/);
  assert.match(pricingSection, /id="plan-monthly-name">Better Hacker Pro/);
  assert.match(pricingSection, /\$7\.99<span class="plan-period"> \/ month/);
  assert.match(pricingSection, /id="plan-annual-name">Better Hacker Pro Annual/);
  assert.match(pricingSection, /\$69<span class="plan-period"> \/ year/);
  assert.match(pricingSection, /data-checkout-plan="monthly"/);
  assert.match(pricingSection, /data-checkout-plan="annual"/);
  assert.match(pricingSection, /Access to premium lessons and advanced practice as released/);
});

test('annual equivalent and savings are mathematically accurate', () => {
  assert.equal((69 / 12).toFixed(2), '5.75');
  assert.equal(Math.round((1 - 69 / (7.99 * 12)) * 100), 28);
  assert.match(pricingSection, /About \$5\.75 per month, billed yearly/);
  assert.match(pricingSection, /about 28% less than 12 monthly payments/);
});

test('checkout uses a confirmation step and the hosted server endpoint', () => {
  assert.match(html, /name="better-hacker-checkout-endpoint" content="\/api\/create-checkout-session"/);
  assert.match(html, /id="checkout-panel"/);
  assert.match(html, /id="checkout-continue"/);
  assert.match(html, /<script src="checkout\.js" defer><\/script>/);
  assert.match(checkout, /mode: "subscription"/);
  assert.match(checkout, /checkout\.stripe\.com/);
  assert.match(checkout, /credentials: "same-origin"/);
  assert.match(checkout, /No payment was taken/);
  assert.match(pricingSection, /current published beta learning path remains free/);
});

test('pricing and checkout remain accessible and responsive', () => {
  assert.match(html, /<li><a href="#pricing">Pricing<\/a><\/li>/);
  assert.match(html, /<section id="pricing" class="section dark-section pricing-section" aria-labelledby="pricing-title"/);
  assert.match(pricingSection, /<a href="#learn" class="primary-button">Start Learning Free<\/a>/);
  assert.match(pricingSection, /role="status" aria-live="polite"/);
  assert.match(style, /a:focus-visible,[\s\S]*button:focus-visible/);
  assert.match(style, /@media \(max-width: 600px\)[^{]*\{[^}]*\.pricing-grid \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(style, /\.checkout-panel/);
});
