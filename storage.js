(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerStorage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const UNSAVED = "Not saved to this browser. Changes are available only for this session and may be lost on reload. Export portfolio work before leaving.";
  function create(getStorage, onStatus) {
    const cache = new Map(), pending = new Set(), unreadable = new Set();
    let readFailed = false, resetFailed = false;
    function notify() {
      if (onStatus) onStatus(readFailed || pending.size || resetFailed ? UNSAVED : "");
    }
    function getItem(key) {
      key = String(key);
      try {
        const value = getStorage().getItem(key);
        if (!pending.has(key)) cache.set(key, value);
        return cache.get(key) ?? null;
      } catch (_) {
        readFailed = true;
        // Never overwrite unknown persisted data with a session-only replacement.
        if (!cache.has(key)) unreadable.add(key);
        notify(); return cache.get(key) ?? null;
      }
    }
    function setItem(key, value) {
      key = String(key); value = String(value);
      cache.set(key, value);
      try {
        if (unreadable.has(key)) throw new Error("Original record unavailable");
        getStorage().setItem(key, value); pending.delete(key); notify(); return true;
      } catch (_) { pending.add(key); notify(); return false; }
    }
    function removeItem(key) {
      key = String(key); cache.set(key, null);
      try {
        getStorage().removeItem(key); pending.delete(key); notify(); return true;
      } catch (_) { pending.add(key); resetFailed = true; notify(); return false; }
    }
    function keys() {
      const found = new Set(cache.keys());
      try {
        const storage = getStorage();
        for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key !== null) found.add(key); }
      } catch (_) { readFailed = true; resetFailed = true; notify(); }
      return Array.from(found);
    }
    return { getItem, setItem, removeItem, keys,
      isPersisted: key => !pending.has(key) && !unreadable.has(key),
      hasFailures: () => Boolean(readFailed || pending.size || resetFailed),
      feedback: (message, key) => pending.has(key) || unreadable.has(key) ? UNSAVED : message,
      reportCorruption() { if (onStatus) onStatus("Some saved data could not be read. Other valid progress is retained; the original stored data has not been deleted."); }
    };
  }
  return { create, UNSAVED };
});
