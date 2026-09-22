(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerState = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const DAILY_KEY = "betterHackerDailyChallengeState";
  const DAILY_VERSION = 1;
  const MAX_DAILY_RECORDS = 60;
  const XP_RULES = Object.freeze({ lesson: 100, guidedExercise: 75, investigation: 125, courseReview: 200 });
  const LEVELS = Object.freeze([
    { level: 1, name: "New Recruit", threshold: 0 },
    { level: 2, name: "Cyber Explorer", threshold: 400 },
    { level: 3, name: "Security Apprentice", threshold: 900 },
    { level: 4, name: "Cyber Defender", threshold: 1500 },
    { level: 5, name: "Security Analyst", threshold: 2300 },
    { level: 6, name: "Cyber Investigator", threshold: 3200 }
  ]);
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  function validDate(value) {
    if (!DATE_PATTERN.test(value || "")) return false;
    const parts = value.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
  }
  function localDateKey(date) {
    const d = date || new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
  }
  function dayDifference(from, to) {
    if (!validDate(from) || !validDate(to)) return null;
    const a = from.split("-").map(Number), b = to.split("-").map(Number);
    return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
  }
  function emptyDailyState() { return { version: DAILY_VERSION, lastCompletedDate: null, currentStreak: 0, longestStreak: 0, records: [] }; }
  function validateDailyState(value) {
    if (!value || value.version !== DAILY_VERSION || !Array.isArray(value.records) ||
        !Number.isInteger(value.currentStreak) || value.currentStreak < 0 || value.currentStreak > 10000 ||
        !Number.isInteger(value.longestStreak) || value.longestStreak < value.currentStreak || value.longestStreak > 10000 ||
        (value.lastCompletedDate !== null && !validDate(value.lastCompletedDate))) return emptyDailyState();
    const seen = new Set(), records = [];
    for (const record of value.records.slice(-MAX_DAILY_RECORDS)) {
      if (!record || !validDate(record.date) || typeof record.challengeId !== "string" || !record.challengeId ||
          !Number.isInteger(record.xp) || record.xp < 0 || record.xp > 100 || seen.has(record.date)) return emptyDailyState();
      seen.add(record.date); records.push({ date: record.date, challengeId: record.challengeId, xp: record.xp });
    }
    if ((records.length === 0) !== (value.lastCompletedDate === null) ||
        (records.length && !records.some(r => r.date === value.lastCompletedDate))) return emptyDailyState();
    return { version: DAILY_VERSION, lastCompletedDate: value.lastCompletedDate, currentStreak: value.currentStreak,
      longestStreak: value.longestStreak, records };
  }
  function readDailyState(storage) {
    try { return validateDailyState(JSON.parse(storage.getItem(DAILY_KEY))); } catch (_) { return emptyDailyState(); }
  }
  function completeDailyChallenge(state, date, challengeId, xp) {
    state = validateDailyState(state);
    if (!validDate(date) || typeof challengeId !== "string" || !Number.isInteger(xp) || xp < 0 || xp > 100) return { state, awarded: false };
    if (state.records.some(record => record.date === date)) return { state, awarded: false };
    const difference = state.lastCompletedDate ? dayDifference(state.lastCompletedDate, date) : null;
    if (difference !== null && difference < 0) return { state, awarded: false };
    const streak = difference === 1 ? state.currentStreak + 1 : 1;
    const next = { version: DAILY_VERSION, lastCompletedDate: date, currentStreak: streak,
      longestStreak: Math.max(state.longestStreak, streak), records: state.records.concat({ date, challengeId, xp }).slice(-MAX_DAILY_RECORDS) };
    return { state: next, awarded: true };
  }
  function deriveXp(snapshot, dailyState) {
    const dailyXp = validateDailyState(dailyState).records.reduce((sum, record) => sum + record.xp, 0);
    return snapshot.lessonsCompleted * XP_RULES.lesson + snapshot.exercisesCompleted * XP_RULES.guidedExercise +
      snapshot.investigationsCompleted * XP_RULES.investigation + (snapshot.reviewResult ? XP_RULES.courseReview : 0) + dailyXp;
  }
  function getLevel(xp) {
    xp = Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
    let current = LEVELS[0];
    LEVELS.forEach(level => { if (xp >= level.threshold) current = level; });
    const next = LEVELS.find(level => level.threshold > xp) || null;
    const progress = next ? Math.round(((xp - current.threshold) / (next.threshold - current.threshold)) * 100) : 100;
    return { ...current, xp, next, progress, xpToNext: next ? next.threshold - xp : 0 };
  }
  return { DAILY_KEY, DAILY_VERSION, MAX_DAILY_RECORDS, XP_RULES, LEVELS, localDateKey, dayDifference, emptyDailyState,
    validateDailyState, readDailyState, completeDailyChallenge, deriveXp, getLevel };
});
