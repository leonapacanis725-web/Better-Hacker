(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./portfolio.js") : root.BetterHackerPortfolio);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.BetterHackerReadinessProgress = api;
    let storage = null;
    try { storage = root.BetterHackerSessionStorage || root.localStorage; } catch (_) {}
    if (root.document && storage) api.observe(root.document, storage);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (Portfolio) {
  "use strict";
  const STORAGE_KEY = "betterHackerJobReadinessProgress";
  const VERSION = 1;
  function validActivityIds() { return new Set((Portfolio && Portfolio.ACTIVITIES || []).map(activity => activity.id)); }
  function emptyState() { return { version: VERSION, started: [] }; }
  function validate(value) {
    if (!value || value.version !== VERSION || !Array.isArray(value.started)) return emptyState();
    const allowed = validActivityIds();
    return { version: VERSION, started: [...new Set(value.started.filter(id => typeof id === "string" && allowed.has(id)))].slice(-500) };
  }
  function read(storage) {
    try { return validate(JSON.parse(storage.getItem(STORAGE_KEY))); } catch (_) { return emptyState(); }
  }
  function hasStarted(activityId, storage) { return read(storage).started.includes(activityId); }
  function markStarted(activityId, storage) {
    if (!storage || !validActivityIds().has(activityId)) return false;
    const state = read(storage);
    if (state.started.includes(activityId)) return false;
    state.started.push(activityId);
    try { return storage.setItem(STORAGE_KEY, JSON.stringify(state)) !== false; } catch (_) { return false; }
  }
  function activityForTarget(target, documentRef) {
    if (!target || typeof target.closest !== "function") return null;
    const activities = Portfolio && Portfolio.ACTIVITIES || [];
    const direct = activities.find(activity => {
      const id = activity.href && activity.href.slice(1);
      const section = id && documentRef.getElementById(id);
      return section && section.contains(target);
    }) || null;
    if (direct) return direct;
    const workspace = target.closest("#lab-workspace");
    const labIds = ["linux", "networking", "cryptography", "web-security"];
    const index = workspace && typeof workspace.getAttribute === "function" ? labIds.indexOf(workspace.getAttribute("data-lab-id")) : -1;
    return index >= 0 ? activities.find(activity => activity.labIndex === index) || null : null;
  }
  function observe(documentRef, storage) {
    if (!documentRef || !documentRef.addEventListener || !storage) return false;
    const mark = event => {
      const activity = activityForTarget(event.target, documentRef);
      if (activity) markStarted(activity.id, storage);
    };
    ["input", "change"].forEach(type => documentRef.addEventListener(type, mark, true));
    documentRef.addEventListener("click", event => {
      if (event.target && typeof event.target.closest === "function" && event.target.closest("[data-answer]")) mark(event);
    }, true);
    return true;
  }
  return { STORAGE_KEY, VERSION, emptyState, validate, read, hasStarted, markStarted, activityForTarget, observe };
});
