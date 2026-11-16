// Vercel serverless endpoint for creating Stripe Checkout sessions.
// Keep Stripe secret keys and Price IDs in Vercel environment variables only.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const appUrl = process.env.APP_URL;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!appUrl || !secretKey) {
    return res.status(503).json({ error: "Secure checkout is not configured." });
  }

  let trustedOrigin;
  try {
    trustedOrigin = new URL(appUrl).origin;
  } catch {
    return res.status(500).json({ error: "Checkout configuration is invalid." });
  }

  const requestOrigin = req.headers.origin;
  if (!requestOrigin || requestOrigin !== trustedOrigin) {
    return res.status(403).json({ error: "Request origin is not allowed." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: "Invalid request body." });
    }
  }
  const planId = body && body.planId;
  const priceId = planId === "monthly"
    ? process.env.STRIPE_PRICE_MONTHLY_ID
    : planId === "annual"
      ? process.env.STRIPE_PRICE_ANNUAL_ID
      : null;

  if (!priceId || !/^price_[A-Za-z0-9]+$/.test(priceId)) {
    return res.status(400).json({ error: "That plan is not configured yet." });
  }
  if (!/^sk_(test|live)_/.test(secretKey)) {
    return res.status(500).json({ error: "Stripe secret key configuration is invalid." });
  }

  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${trustedOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${trustedOrigin}/?checkout=cancel`,
    "billing_address_collection": "auto"
  });

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session.url) {
      return res.status(502).json({ error: "Stripe could not start checkout." });
    }
    return res.status(200).json({ url: session.url });
  } catch {
    return res.status(502).json({ error: "Secure checkout is temporarily unavailable." });
  }
}
