# Stripe Checkout deployment setup

This repository is hosted as a static site on GitHub Pages today. The new `api/create-checkout-session.js` endpoint requires a serverless host; deploy the repository to Vercel and attach the Better Hacker domain there before enabling paid checkout. GitHub Pages alone cannot run this endpoint.

## Vercel environment variables

Set these in the Vercel project settings (never in GitHub files or browser JavaScript):

- `APP_URL`: the canonical HTTPS origin, for example `https://betterhacker.org`.
- `STRIPE_SECRET_KEY`: a Stripe **test-mode** secret key to begin testing. Do not use or share a live key during testing.
- `STRIPE_PRICE_MONTHLY_ID`: the existing Better Hacker Pro monthly test Price ID, if it is still current: `price_1UcEaxBZZpPfVV0Nw8FvZO30`.
- `STRIPE_PRICE_ANNUAL_ID`: create the $69/year recurring test price in Stripe, then enter its Price ID here. The annual Price ID was not confirmed when this integration was prepared.

Redeploy after setting or changing environment variables. Do not put any secret key in the repository, HTML, or client-side JavaScript.

## What this change does and does not do

- The two pricing buttons open a plan confirmation panel and request a subscription Checkout Session from the same-origin serverless endpoint.
- The server accepts only the two known plan IDs, uses server-side Price IDs, checks the request origin, and sends the Stripe secret only from the server.
- Stripe Checkout handles payment details. The browser never receives the Stripe secret key.
- The return message is informational only. **A successful return URL is not proof of payment or an active subscription.**
- This change does not create user accounts, verify subscriptions with webhooks, or enforce Pro-only access. Do not describe paid access as activated until a separate, secure subscription-verification and entitlement flow exists.
- The current Stripe account was previously confirmed to be in test mode. Test checkout with Stripe test payment methods first. Real charges require Stripe live mode, live recurring Price IDs, reviewed customer-facing terms/refund/cancellation details, and a deliberate production launch.

## Deployment

1. Import this repository into Vercel and deploy it as a Vercel project.
2. Add the four environment variables above using test-mode values.
3. Create the annual $69/year recurring test price in Stripe and set its Price ID.
4. Assign `betterhacker.org` to the Vercel project and set `APP_URL` to `https://betterhacker.org`.
5. Test both plans end-to-end in Stripe test mode. Confirm cancel and success returns.
6. Keep the existing GitHub Pages deployment unchanged until the Vercel deployment and custom domain are verified. Do not point the domain at an untested checkout deployment.

If any required environment variable is missing, the API refuses to create a session and the page explains that checkout is not configured; it never falls back to a waitlist.
