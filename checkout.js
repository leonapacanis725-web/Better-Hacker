// Hosted-checkout boundary. The browser receives only a same-origin API path;
// payment credentials and Stripe price IDs belong on the server.
(function (global) {
  "use strict";

  const plans = Object.freeze({
    monthly: Object.freeze({ id: "monthly", name: "Better Hacker Pro", amount: 799, currency: "USD", interval: "month", displayPrice: "$7.99", frequency: "Monthly" }),
    annual: Object.freeze({ id: "annual", name: "Better Hacker Pro Annual", amount: 6900, currency: "USD", interval: "year", displayPrice: "$69", frequency: "Yearly" })
  });

  function annualSavings() {
    const monthlyYear = plans.monthly.amount * 12;
    return Object.freeze({ monthlyEquivalent: (plans.annual.amount / 12 / 100).toFixed(2), percent: Math.round((1 - plans.annual.amount / monthlyYear) * 100) });
  }

  async function startCheckout(planId, endpoint, options = {}) {
    const plan = plans[planId];
    if (!plan) return { ok: false, code: "invalid_plan", message: "Choose a listed plan to continue." };
    if (!endpoint || !String(endpoint).trim()) return { ok: false, code: "not_configured", message: "Secure checkout is not configured yet. No subscription has started and no payment was taken." };

    const location = options.location || global.location;
    let target;
    try {
      target = new URL(endpoint, location.origin);
      if (target.origin !== location.origin || !["http:", "https:"].includes(target.protocol)) throw new Error("Checkout must use a same-origin secure endpoint.");
    } catch (_) {
      return { ok: false, code: "invalid_endpoint", message: "Secure checkout is unavailable right now. No payment was taken." };
    }

    try {
      const response = await (options.fetch || global.fetch)(target.href, {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "same-origin", body: JSON.stringify({ planId: plan.id })
      });
      if (!response || !response.ok) throw new Error("The checkout service did not create a session.");
      const payload = await response.json();
      const checkoutUrl = new URL(payload.url);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") throw new Error("The checkout service returned an unexpected destination.");
      if (options.redirect) options.redirect(checkoutUrl.href);
      else location.assign(checkoutUrl.href);
      return { ok: true, planId: plan.id };
    } catch (_) {
      return { ok: false, code: "checkout_unavailable", message: "Secure checkout could not be started. No payment was taken. Please try again later." };
    }
  }

  global.BetterHackerCheckout = Object.freeze({ plans, annualSavings, startCheckout });

  if (!global.document) return;
  global.document.addEventListener("DOMContentLoaded", function () {
    const panel = global.document.querySelector("#checkout-panel");
    const continueButton = global.document.querySelector("#checkout-continue");
    const status = global.document.querySelector("#checkout-status");
    const endpoint = global.document.querySelector('meta[name="better-hacker-checkout-endpoint"]')?.content || "";
    if (!panel || !continueButton || !status) return;

    let selectedPlan = null;
    let selectedButton = null;
    const show = planId => {
      const plan = plans[planId];
      if (!plan) return;
      selectedPlan = planId;
      selectedButton = global.document.querySelector(`[data-checkout-plan="${planId}"]`);
      global.document.querySelector("#checkout-plan-name").textContent = plan.name;
      global.document.querySelector("#checkout-plan-price").textContent = `${plan.displayPrice} ${plan.interval === "month" ? "per month" : "per year"}`;
      global.document.querySelector("#checkout-plan-frequency").textContent = plan.frequency;
      global.document.querySelector("#checkout-renewal-note").textContent = plan.interval === "month" ? "Renews monthly. Cancel anytime after paid subscriptions launch." : "Renews yearly after paid subscriptions launch.";
      status.textContent = "";
      panel.hidden = false;
      panel.scrollIntoView({ block: "start" });
      global.document.querySelector("#checkout-title").focus();
    };

    global.document.querySelectorAll("[data-checkout-plan]").forEach(button => button.addEventListener("click", () => show(button.dataset.checkoutPlan)));
    global.document.querySelector(".checkout-back")?.addEventListener("click", () => {
      panel.hidden = true;
      if (selectedButton) selectedButton.focus();
    });
    continueButton.addEventListener("click", async () => {
      if (!selectedPlan) return;
      continueButton.disabled = true;
      status.textContent = "Connecting to secure checkout…";
      const result = await startCheckout(selectedPlan, endpoint);
      status.textContent = result.ok ? "Opening secure checkout…" : result.message;
      continueButton.disabled = false;
    });

    const returnState = new URLSearchParams(global.location.search).get("checkout");
    const returnStatus = global.document.querySelector("#checkout-return-status");
    if (returnStatus && returnState === "success") {
      returnStatus.textContent = "You returned from checkout. Subscription status must be confirmed securely before Pro access is enabled.";
      returnStatus.hidden = false;
    } else if (returnStatus && returnState === "cancel") {
      returnStatus.textContent = "Checkout was canceled. No subscription was started from this return.";
      returnStatus.hidden = false;
    }
  });
})(globalThis);
