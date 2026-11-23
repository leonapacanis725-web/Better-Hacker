# Better Hacker Pro — Stripe checkout setup

## Plans

One Stripe product named **Better Hacker Pro** should contain two recurring prices:

- Pro Monthly: **$7.99 USD every month**
- Pro Annual: **$69 USD every year**

The monthly and annual Price IDs must be created in the same Stripe mode as the secret key configured on the server.

## What the site code does

- The Pro Monthly and Pro Annual buttons open a plan review panel.
- The browser sends only the selected plan name (`monthly` or `annual`) to `/api/create-checkout-session`.
- The server chooses the matching Stripe Price ID from server-side environment variables.
- Stripe hosts the payment form; Better Hacker does not collect or store card details.
- The endpoint currently accepts **test-mode secret keys only**. Live checkout is intentionally blocked.
- Returning to the success URL is not proof of payment and never grants Pro access.

## Required hosting

The current production site is on GitHub Pages. GitHub Pages cannot run the server-side API endpoint. Deploy the repository to Vercel (or another compatible serverless host) before checkout can work.

For a Vercel preview deployment, set these environment variables in Project Settings → Environment Variables:

- `APP_URL`: the exact HTTPS origin of the preview deployment during testing.
- `STRIPE_SECRET_KEY`: a Stripe **test-mode** secret key. Enter it only in the hosting dashboard.
- `STRIPE_PRICE_MONTHLY_ID`: the test-mode recurring Price ID for $7.99/month.
- `STRIPE_PRICE_ANNUAL_ID`: the test-mode recurring Price ID for $69/year.

Never put secret keys in chat, GitHub, HTML, or browser JavaScript. Do not reuse a live Price ID with a test secret key or vice versa. Redeploy after changing environment variables.

## Safe setup sequence

1. Import the Better Hacker GitHub repository into Vercel and deploy a preview. Do not change the live domain's DNS yet.
2. Configure the four environment variables above using Stripe test mode.
3. Confirm the preview homepage loads and the API route is deployed.
4. Test both monthly and annual checkout using Stripe's test payment methods. Verify cancel and return behavior.
5. Keep the live domain on GitHub Pages until the preview and backend are verified. Only then consider moving the domain using the exact DNS records provided by the hosting provider.
6. Do not switch to live Stripe keys or accept real payments until all membership safeguards below are implemented.

## Still required before live subscriptions

The current site does not yet have:

- A Stripe webhook with signature verification.
- A trusted subscription/entitlement database.
- A member identity and secure Pro-access recovery method across devices.
- Server-side Pro feature enforcement.
- A customer billing portal and verified cancellation/update workflow.
- Final customer-facing subscription, cancellation, refund, and support terms.

The existing beta features are currently available to everyone. Do not promise paid-only benefits until they are actually implemented and access-controlled. Do not enable live charges until webhook verification, identity, entitlements, feature enforcement, billing management, and customer terms are complete and tested.
