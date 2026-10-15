(function (root, factory) {
  const commonJs = typeof module === "object" && module.exports;
  const api = factory(commonJs ? require("./jobs.js") : root.BetterHackerJobs,
    commonJs ? require("./jobs-readiness-progress.js") : root.BetterHackerReadinessProgress);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobsMatching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs, Progress) {
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

  function deriveLocalEvidence(portfolio, storage, progress) {
    if (!portfolio || !Array.isArray(portfolio.ACTIVITIES) || typeof portfolio.isComplete !== "function" || !storage) {
      return { skills: [], activities: [], portfolioProjects: 0 };
    }
    const progressStore = progress || Progress;
    let projects = [];
    if (typeof portfolio.read === "function") {
      try { projects = portfolio.read(storage).projects; } catch (_) {}
    }
    const projectByActivity = new Map(projects.map(project => [project.activityId, project]));
    const activities = [];
    const evidenceBySkill = new Map();
    const developingBySkill = new Map();
    for (const activity of portfolio.ACTIVITIES) {
      let completed = false;
      try { completed = portfolio.isComplete(activity, storage); } catch (_) {}
      const project = projectByActivity.get(activity.id) || null;
      const portfolioSaved = Boolean(project);
      let started = false;
      try { started = !completed && !portfolioSaved && Boolean(progressStore && progressStore.hasStarted(activity.id, storage)); } catch (_) {}
      if (!completed && !portfolioSaved && !started) continue;
      activities.push({ id: activity.id, title: activity.title, href: activity.href, completed, portfolioSaved, started });
      for (const raw of [...(activity.skills || []), ...(activity.tools || [])]) {
        const id = Jobs.skillId(raw);
        if (!id) continue;
        if (started) {
          if (!developingBySkill.has(id)) developingBySkill.set(id, { id, label: Jobs.skillLabel(id), evidence: [] });
          developingBySkill.get(id).evidence.push({ activityId: activity.id, activityTitle: activity.title, href: activity.href });
        }
        if (!completed && !portfolioSaved) continue;
        if (!evidenceBySkill.has(id)) evidenceBySkill.set(id, { id, label: Jobs.skillLabel(id), evidence: [] });
        const entry = evidenceBySkill.get(id);
        entry.evidence.push({ activityId: activity.id, activityTitle: activity.title, href: activity.href,
          source: portfolioSaved ? "structured-portfolio" : "completed-activity",
          ...(project ? { portfolioTitle: project.title, portfolioHref: "#portfolio" } : {}) });
      }
    }
    return { skills: [...evidenceBySkill.values()], developingSkills: [...developingBySkill.values()], activities, portfolioProjects: projects.length };
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
    const developingEvidence = new Map((learnerEvidence && Array.isArray(learnerEvidence.developingSkills) ? learnerEvidence.developingSkills : []).filter(item => item && item.id && Object.hasOwn(Jobs.SKILLS, item.id)).map(item => [item.id, item]));
    const classified = skills.map(item => ({ ...item, status: evidence.has(item.id) ? "demonstrated" : developingEvidence.has(item.id) ? "developing" : "gap" }));
    const matched = classified.filter(item => item.status === "demonstrated");
    const developing = classified.filter(item => item.status === "developing").map(item => ({ ...item, evidence: developingEvidence.get(item.id).evidence || [], activities: learningActivities(item.id, portfolio) }));
    const missing = classified.filter(item => item.status === "gap");
    const matchedEvidence = matched.map(item => ({ ...item, evidence: evidence.get(item.id).evidence || [] }));
    const gaps = missing.map(item => ({ ...item, activities: learningActivities(item.id, portfolio) }));
    const portfolioEvidence = matchedEvidence.flatMap(item => item.evidence.filter(record => record.portfolioTitle).map(record => ({ skillId: item.id, skillLabel: item.label, activityId: record.activityId, title: record.portfolioTitle, href: record.portfolioHref })));
    return {
      skills: classified, matched, developing, missing, matchedEvidence, gaps, portfolioEvidence,
      matchedCount: matched.length, developingCount: developing.length, gapCount: gaps.length, totalCount: skills.length,
      matchedSkillIds: matched.map(item => item.id), missingSkillIds: missing.map(item => item.id),
      hasStructuredSkills: skills.length > 0,
      message: skills.length ? `Demonstrated: ${matched.length} skills · Developing: ${developing.length} skills · Skill gaps: ${gaps.length} skills` : NO_SKILLS,
      noEvidenceMessage: "",
      disclaimer: "This is educational evidence overlap based on the available listing and work recorded in this browser. It does not determine eligibility, hiring decisions, or whether an employer will hire you. Employers cannot see this learner evidence."
    };
  }
  return { NO_SKILLS, NO_EVIDENCE, jobSkills, deriveLocalEvidence, learningActivities, matchJobSkills };
});
