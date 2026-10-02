(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerCompanion = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  class AuthoredProvider {
    respond(action, context) {
      context = context || { type:"general", topic:"Cybersecurity" };
      const topic = context.topic || "Cybersecurity";
      if (context.type === "dashboard") {
        if (action === "hint") return `Next: ${context.recommendation} It contributes to ${context.coreProgress} Core Path progress.`;
        if (action === "look") return `Learning Path — ${context.stages}. Current rewards: ${context.rewards}.`;
        return `${context.coreProgress} Core Path complete. ${context.xpSummary}. ${context.dailyRule}`;
      }
      if (action === "hint") return `Conceptual hint: ${context.hint || `Identify the security goal in this ${topic} activity before choosing an action.`}`;
      if (action === "look") return context.lookFor ? `Stronger clue for ${topic}: focus on ${context.lookFor}` : `Stronger clue for ${topic}: compare the affected asset, unusual behavior, relevant evidence, and the safest authorized next step.`;
      if (context.submitted && context.explanation) return context.explanation;
      return `Explanation locked: submit your own ${topic} answer first. Until then, use the conceptual hint and stronger clue so Byte supports your reasoning without revealing the answer.`;
    }
  }
  function createCompanion(provider) {
    let context={type:"general",topic:"Cybersecurity",submitted:false};
    return { setContext(value){
      value=value||{};
      const changesActivity=(value.activityId&&value.activityId!==context.activityId)||(value.topic&&value.topic!==context.topic)||(value.type&&value.type!==context.type);
      context=changesActivity?{type:"general",topic:"Cybersecurity",submitted:false,...value}:{...context,...value};
    }, getContext(){return {...context};}, respond(action){return provider.respond(action,context);} };
  }
  return { AuthoredProvider, createCompanion };
});
