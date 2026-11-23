# Better Hacker Pro — Stripe checkout deployment

Better Hacker currently runs on GitHub Pages. GitHub Pages serves the static learning site but cannot run the server-side Stripe endpoint in `api/create-checkout-session.js`. The restored Pro plan buttons therefore remain safely unavailable until the site and API are deployed together on a serverless host.

## Plans

Use one Stripe product named **Better Hacker Pro** with two recurring prices:

- Pro Monthly: **$7.99 USD every month**
- Pro Annual: **$69 USD every year**

The two prices must belong to the same Stripe product. Create or confirm each price in the same Stripe mode used for the intended launch. Do not reuse a test-mode Price ID with a live-mode secret key, or vice versa.

## Required hosting configuration

Deploy the repository to Vercel so the static site and `/api/create-checkout-session` share the same origin. Add these environment variables in Vercel Project Settings → Environment Variables:

- `APP_URL`: `https://betterhacker.org`
- `STRIPE_SECRET_KEY`: Stripe secret key for the selected mode. Enter it only in Vercel; never in chat, GitHub, HTML, or browser JavaScript.
- `STRIPE_PRICE_MONTHLY_ID`: the recurring $7.99/month Price ID from the selected Stripe mode.
- `STRIPE_PRICE_ANNUAL_ID`: the recurring $69/year Price ID from the selected Stripe mode.

Redeploy after setting or changing environment variables. The public website and API must use the same canonical origin because the endpoint intentionally rejects requests from other origins.

## Domain cutover

1. Import this repository into Vercel and deploy the project without changing the live domain's DNS yet.
2. Confirm the Vercel preview deployment serves the homepage and the API route is deployed.
3. Configure the Stripe environment variables using **test-mode** credentials and test Price IDs first.
4. Test the monthly and annual checkout flows with Stripe test payment methods. Confirm cancellation and return behavior.
5. Only after the hosted site and API are verified should the Better Hacker domain be moved from GitHub Pages to Vercel. Follow the exact DNS records Vercel provides; do not guess or reuse old GitHub Pages records.
6. Re-test the canonical HTTPS domain and both checkout plans after DNS propagation.

Keep the current GitHub Pages site available until the Vercel deployment and domain are verified. Do not point the production domain at an untested deployment.

## What is implemented

- Pricing cards for Free, Pro Monthly, and Pro Annual.
- A plan-review confirmation panel before leaving Better Hacker.
- A browser checkout client that posts only the selected plan ID to a same-origin server endpoint.
- A server-side endpoint that selects the Stripe Price ID from environment variables, checks the request origin, creates a Stripe Checkout Session in subscription mode, and returns only the hosted Stripe Checkout URL.
- The browser never receives Stripe secret keys or Stripe Price IDs.

## What is still required before accepting real subscriptions

**Checkout creation is not the same as a complete subscription product.** The current code does not yet include:

- A Stripe webhook with signature verification.
- A trusted subscription/entitlement store.
- A member identity or secure way for a buyer to recover Pro access across browsers/devices.
- Server-side checks that enforce Pro-only access.
- A customer billing portal and a verified cancellation/update path.
- Final customer-facing subscription, cancellation, refund, and support terms.

A return to `?checkout=success` is not proof of payment and must never grant Pro access. Do not enable live checkout or publish claims that Pro access is active until the webhook, identity, entitlement, and access-control pieces are implemented and tested.

The currently published beta learning path remains free. Pro-only lessons and advanced practice must be clearly identified and actually delivered before charging customers for those benefits.

## Security notes

- Never commit Stripe secret keys or webhook signing secrets.
- Keep keys and Price IDs in the hosting provider's server-side environment variables.
- Use Stripe test mode for integration tests, even if the Stripe account has live mode available.
- Do not treat a successful browser redirect as payment confirmation.
- Do not enable real charges while subscription verification and Pro access enforcement are incomplete.
