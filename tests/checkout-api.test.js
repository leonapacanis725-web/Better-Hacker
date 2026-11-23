const assert = require('node:assert/strict');
const test = require('node:test');

const originalEnv = {
  APP_URL: process.env.APP_URL,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_MONTHLY_ID: process.env.STRIPE_PRICE_MONTHLY_ID,
  STRIPE_PRICE_ANNUAL_ID: process.env.STRIPE_PRICE_ANNUAL_ID
};
const originalFetch = global.fetch;

function responseRecorder() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('checkout endpoint accepts only same-origin subscription plan requests', async () => {
  process.env.APP_URL = 'https://betterhacker.org';
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  process.env.STRIPE_PRICE_MONTHLY_ID = 'price_monthly123';
  process.env.STRIPE_PRICE_ANNUAL_ID = 'price_annual123';

  const { default: handler } = await import('../api/create-checkout-session.js');
  let stripeRequest;
  global.fetch = async (url, options) => {
    stripeRequest = { url, options };
    return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_example' }) };
  };

  const req = { method: 'POST', headers: { origin: 'https://betterhacker.org' }, body: { planId: 'monthly' } };
  const res = responseRecorder();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.url, 'https://checkout.stripe.com/c/pay/cs_test_example');
  assert.equal(stripeRequest.url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(stripeRequest.options.headers.Authorization, 'Bearer sk_test_example');
  const params = new URLSearchParams(stripeRequest.options.body);
  assert.equal(params.get('mode'), 'subscription');
  assert.equal(params.get('line_items[0][price]'), 'price_monthly123');
  assert.equal(params.get('line_items[0][quantity]'), '1');
  assert.match(params.get('success_url'), /session_id=\{CHECKOUT_SESSION_ID\}/);
});

test('checkout endpoint rejects an untrusted origin before contacting Stripe', async () => {
  process.env.APP_URL = 'https://betterhacker.org';
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  let contactedStripe = false;
  global.fetch = async () => { contactedStripe = true; throw new Error('Unexpected Stripe request'); };

  const { default: handler } = await import('../api/create-checkout-session.js');
  const res = responseRecorder();
  await handler({ method: 'POST', headers: { origin: 'https://attacker.example' }, body: { planId: 'monthly' } }, res);

  assert.equal(res.statusCode, 403);
  assert.equal(contactedStripe, false);
});

test('checkout endpoint rejects unknown plans and unsupported methods', async () => {
  process.env.APP_URL = 'https://betterhacker.org';
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  const { default: handler } = await import('../api/create-checkout-session.js');

  const badPlan = responseRecorder();
  await handler({ method: 'POST', headers: { origin: 'https://betterhacker.org' }, body: { planId: 'lifetime' } }, badPlan);
  assert.equal(badPlan.statusCode, 400);

  const badMethod = responseRecorder();
  await handler({ method: 'GET', headers: {} }, badMethod);
  assert.equal(badMethod.statusCode, 405);
  assert.equal(badMethod.headers.Allow, 'POST');
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  global.fetch = originalFetch;
});
