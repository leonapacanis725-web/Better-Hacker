(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./jobs.js") : root.BetterHackerJobs);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobsMatching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs) {
  "use strict";
  function deriveLocalEvidence(portfolio, storage) {
    if (!portfolio || !Array.isArray(portfolio.ACTIVITIES) || typeof portfolio.isComplete !== "function" || !storage) {
      return { skills: [], activities: [], portfolioProjects: 0 };
    }
    let projectIds = new Set();
    if (typeof portfolio.read === "function") {
      try { projectIds = new Set(portfolio.read(storage).projects.map(project => project.activityId)); } catch (_) {}
    }
    const activities = [];
    const evidenceBySkill = new Map();
    for (const activity of portfolio.ACTIVITIES) {
      let completed = false;
      try { completed = portfolio.isComplete(activity, storage); } catch (_) {}
      const portfolioSaved = projectIds.has(activity.id);
      if (!completed && !portfolioSaved) continue;
      activities.push({ id: activity.id, title: activity.title, completed, portfolioSaved });
      if (!completed && !portfolioSaved) continue;
      for (const raw of [...(activity.skills || []), ...(activity.tools || [])]) {
        const id = Jobs.skillId(raw);
        if (!id) continue;
        if (!evidenceBySkill.has(id)) evidenceBySkill.set(id, { id, label: raw, evidence: [] });
        const entry = evidenceBySkill.get(id);
        entry.evidence.push({ activityId: activity.id, activityTitle: activity.title, source: portfolioSaved ? "portfolio-or-completed-activity" : "completed-activity" });
      }
    }
    return { skills: [...evidenceBySkill.values()], activities, portfolioProjects: projectIds.size };
  }
  function matchJobSkills(job, learnerEvidence) {
    const evidence = new Map((learnerEvidence && Array.isArray(learnerEvidence.skills) ? learnerEvidence.skills : []).filter(item => item && item.id).map(item => [item.id, item]));
    const allSkills = Array.isArray(job && job.skills) ? job.skills : [];
    const matchable = allSkills.filter(item => item && item.id);
    const matched = matchable.filter(item => evidence.has(item.id));
    const missing = matchable.filter(item => !evidence.has(item.id));
    const required = matchable.filter(item => item.level === "required");
    const requiredMatched = required.filter(item => evidence.has(item.id));
    return {
      matchedCount: matched.length, totalCount: matchable.length,
      matchedSkillIds: matched.map(item => item.id), missingSkillIds: missing.map(item => item.id),
      requiredMatchedCount: requiredMatched.length, requiredCount: required.length,
      hasStructuredSkills: matchable.length > 0,
      message: matchable.length ? `${matched.length} of ${matchable.length} listed skills appear in saved Better Hacker evidence.` : "This listing has no structured skills to compare yet.",
      disclaimer: "This evidence comparison is not a qualification, hiring, or job-fit assessment. Employers do not receive learner progress."
    };
  }
  return { deriveLocalEvidence, matchJobSkills };
});
