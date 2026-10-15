(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./jobs.js") : root.BetterHackerJobs);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobsMatching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs) {
  "use strict";
  const NO_SKILLS = "Better Hacker couldn't identify enough structured skills in this listing for an evidence comparison.";
  const NO_EVIDENCE = "No matching Better Hacker evidence yet. Complete relevant lessons and hands-on activities to build evidence.";

  function jobSkills(job) {
    if (job && job.isDemo) return [];
    const result = new Map();
    for (const item of Array.isArray(job && job.skills) ? job.skills : []) {
      if (item && item.id && Object.prototype.hasOwnProperty.call(Jobs.SKILLS, item.id)) result.set(item.id, { id: item.id, label: Jobs.skillLabel(item.id) });
    }
    // Skill mappings are allowed only through Better Hacker's controlled taxonomy.
    for (const item of Array.isArray(job && job.extensions && job.extensions.skillMappings) ? job.extensions.skillMappings : []) {
      if (item && Object.prototype.hasOwnProperty.call(Jobs.SKILLS, item.id)) result.set(item.id, { id: item.id, label: Jobs.skillLabel(item.id) });
    }
    return [...result.values()];
  }

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
      activities.push({ id: activity.id, title: activity.title, href: activity.href, completed, portfolioSaved });
      for (const raw of [...(activity.skills || []), ...(activity.tools || [])]) {
        const id = Jobs.skillId(raw);
        if (!id) continue;
        if (!evidenceBySkill.has(id)) evidenceBySkill.set(id, { id, label: Jobs.skillLabel(id), evidence: [] });
        const entry = evidenceBySkill.get(id);
        entry.evidence.push({ activityId: activity.id, activityTitle: activity.title, href: activity.href,
          source: portfolioSaved ? "structured-portfolio" : "completed-activity" });
      }
    }
    return { skills: [...evidenceBySkill.values()], activities, portfolioProjects: projectIds.size };
  }

  function learningActivities(skillId, portfolio) {
    if (!portfolio || !Array.isArray(portfolio.ACTIVITIES)) return [];
    return portfolio.ACTIVITIES.filter(activity => {
      if (!activity.href || !/^#[a-z0-9-]+$/i.test(activity.href)) return false;
      return [...(activity.skills || []), ...(activity.tools || [])].some(value => Jobs.skillId(value) === skillId);
    }).map(activity => ({ id: activity.id, title: activity.title, href: activity.href }));
  }

  function matchJobSkills(job, learnerEvidence, portfolio) {
    const evidence = new Map((learnerEvidence && Array.isArray(learnerEvidence.skills) ? learnerEvidence.skills : []).filter(item => item && item.id && Object.prototype.hasOwnProperty.call(Jobs.SKILLS, item.id)).map(item => [item.id, item]));
    const skills = jobSkills(job);
    const matched = skills.filter(item => evidence.has(item.id));
    const missing = skills.filter(item => !evidence.has(item.id));
    const matchedEvidence = matched.map(item => ({ ...item, evidence: evidence.get(item.id).evidence || [] }));
    const gaps = missing.map(item => ({ ...item, activities: learningActivities(item.id, portfolio) }));
    return {
      matched, missing, matchedEvidence, gaps,
      matchedCount: matched.length, totalCount: skills.length,
      matchedSkillIds: matched.map(item => item.id), missingSkillIds: missing.map(item => item.id),
      hasStructuredSkills: skills.length > 0,
      message: skills.length ? `Your Better Hacker evidence: ${matched.length} of ${skills.length} mapped skills.` : NO_SKILLS,
      noEvidenceMessage: skills.length && !matched.length ? NO_EVIDENCE : "",
      disclaimer: "This shows educational evidence overlap only. It does not determine eligibility or hiring decisions."
    };
  }
  return { NO_SKILLS, NO_EVIDENCE, jobSkills, deriveLocalEvidence, learningActivities, matchJobSkills };
});
