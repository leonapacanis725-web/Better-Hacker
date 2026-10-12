const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const checkoutSource = fs.readFileSync('checkout.js', 'utf8');
const context = { URL, URLSearchParams, JSON, Object, Math, String, globalThis: null };
context.globalThis = context;
vm.runInNewContext(checkoutSource, context);
const checkout = context.BetterHackerCheckout;

test('pricing names Free, Monthly Pro, Annual Pro and explains current access accurately', () => {
  assert.match(html, /id="plan-free-name">Free/);
  assert.match(html, /id="plan-monthly-name">Better Hacker Pro/);
  assert.match(html, /id="plan-annual-name">Better Hacker Pro Annual/);
  assert.match(html, /All features currently published in the beta remain available to everyone/);
  for (const feature of ['Guided beginner lessons', 'Hands-on practice and investigations', 'Daily Practice and progress tracking', 'Learning Assistant guidance', 'Portfolio-building tools']) assert.match(html, new RegExp(feature));
});

test('monthly and annual plan IDs have the requested prices and billing intervals', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(checkout.plans.monthly)), { id: 'monthly', name: 'Better Hacker Pro', amount: 799, currency: 'USD', interval: 'month', displayPrice: '$7.99', frequency: 'Monthly' });
  assert.deepEqual(JSON.parse(JSON.stringify(checkout.plans.annual)), { id: 'annual', name: 'Better Hacker Pro Annual', amount: 6900, currency: 'USD', interval: 'year', displayPrice: '$69', frequency: 'Yearly' });
  assert.match(html, /data-checkout-plan="monthly"[^>]*>Start Pro/);
  assert.match(html, /data-checkout-plan="annual"[^>]*>Start Annual/);
});

test('annual equivalent and savings are calculated from the displayed monthly rate', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(checkout.annualSavings())), { monthlyEquivalent: '5.75', percent: 28 });
  assert.match(html, /About \$5\.75 per month, billed yearly/);
  assert.match(html, /About 28% less than paying monthly for 12 months/);
});

test('checkout refuses an unconfigured endpoint without calling fetch or reporting success', async () => {
  let requested = false;
  const result = await checkout.startCheckout('monthly', '', { fetch: async () => { requested = true; } });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'not_configured');
  assert.match(result.message, /No subscription has started and no payment was taken/);
  assert.equal(requested, false);
  assert.match(html, /paid checkout is not configured yet/);
});

test('checkout sends only the selected public plan ID and accepts hosted Stripe URLs only', async () => {
  const requests = [];
  const redirects = [];
  const fetch = async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_example' }) }; };
  const annual = await checkout.startCheckout('annual', '/api/checkout/session', { fetch, redirect: url => redirects.push(url), location: { origin: 'https://better-hacker.example' } });
  assert.equal(annual.ok, true);
  assert.equal(requests[0].url, 'https://better-hacker.example/api/checkout/session');
  assert.deepEqual(JSON.parse(requests[0].options.body), { planId: 'annual' });
  assert.equal(requests[0].options.method, 'POST');
  assert.deepEqual(redirects, ['https://checkout.stripe.com/c/pay/cs_test_example']);

  const unsafe = await checkout.startCheckout('monthly', 'https://other.example/session', { fetch, location: { origin: 'https://better-hacker.example' } });
  assert.equal(unsafe.code, 'invalid_endpoint');
  const unexpected = await checkout.startCheckout('monthly', '/api/checkout/session', { fetch: async () => ({ ok: true, json: async () => ({ url: 'https://attacker.example/pay' }) }), location: { origin: 'https://better-hacker.example' } });
  assert.equal(unexpected.code, 'checkout_unavailable');
});

test('Pricing navigation and plan controls are semantic and keyboard operable', () => {
  assert.match(html, /<li><a href="#pricing">Pricing<\/a><\/li>/);
  assert.match(html, /<section id="pricing"[^>]*aria-labelledby="pricing-title"/);
  assert.match(html, /<button type="button" class="primary-button" data-checkout-plan="monthly" aria-label=/);
  assert.match(html, /<button type="button" class="primary-button" data-checkout-plan="annual" aria-label=/);
  assert.match(html, /data-checkout-plan="monthly" aria-label="Start Pro/);
  assert.match(html, /data-checkout-plan="annual" aria-label="Start Annual/);
  assert.match(html, /id="checkout-title" tabindex="-1"/);
  assert.match(html, /id="checkout-status" role="status" aria-live="polite"/);
  assert.match(fs.readFileSync('style.css', 'utf8'), /a:focus-visible,[\s\S]*button:focus-visible/);
});

test('checkout return messaging stays neutral and no payment secrets or learner keys enter client code', () => {
  assert.match(checkoutSource, /checkout\.stripe\.com/);
  assert.match(checkoutSource, /Subscription status must be confirmed securely before Pro access is enabled/);
  assert.match(checkoutSource, /Checkout was canceled/);
  assert.doesNotMatch(`${checkoutSource}\n${html}`, /(?:sk_live_|sk_test_|whsec_)[A-Za-z0-9]+/);
  assert.doesNotMatch(checkoutSource, /betterHacker(?:Progress|DailyChallenge|LearningAssistant|Portfolio)/);
  assert.match(checkoutSource, /planId: plan\.id/);
});

