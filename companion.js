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
      if (action === "hint") return context.hint || `Identify the evidence that matters most in this ${topic} scenario. Eliminate choices that add risk or skip verification.`;
      if (action === "look") return context.lookFor ? `For ${topic}, look for: ${context.lookFor}` : `For ${topic}, look for the affected asset, unusual behavior, relevant evidence, and the safest authorized next step.`;
      if (context.submitted && context.explanation) return context.explanation;
      return `${topic} decisions are strongest when you preserve evidence, use least privilege, validate assumptions, and follow an authorized process. Submit your own answer before requesting a full activity explanation.`;
    }
  }
  function createCompanion(provider) {
    let context={type:"general",topic:"Cybersecurity",submitted:false};
    return { setContext(value){context={...context,...value};}, getContext(){return {...context};}, respond(action){return provider.respond(action,context);} };
  }
  return { AuthoredProvider, createCompanion };
});
