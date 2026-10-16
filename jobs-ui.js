(function (root, factory) {
  const commonJs = typeof module === "object" && module.exports;
  const api = factory(
    commonJs ? require("./jobs.js") : root.BetterHackerJobs,
    commonJs ? require("./jobs-demo.js") : root.BetterHackerJobsDemo,
    commonJs ? require("./jobs-matching.js") : root.BetterHackerJobsMatching,
    commonJs ? require("./portfolio.js") : root.BetterHackerPortfolio,
    root
  );
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.BetterHackerJobsUI = api;
    if (root.document) {
      let storage = null;
      try { storage = root.BetterHackerSessionStorage || root.localStorage; } catch (_) {}
      api.mount(root.document, storage);
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs, Demo, Matching, Portfolio, root) {
  "use strict";
  function trustedApplicationUrl(job) {
    if (!job || !job.applicationUrl || !job.externalId) return false;
    try {
      const url = new URL(job.applicationUrl);
      if (url.protocol !== "https:" || url.username || url.password || url.port || Jobs.hasUnsafeRedirectParameter(job.applicationUrl)) return false;
      const ext = job.extensions || {};
      const parts = url.pathname.split("/").filter(Boolean);
      if (ext.adapter === "greenhouse-job-board") return ["job-boards.greenhouse.io", "boards.greenhouse.io"].includes(url.hostname) &&
        typeof ext.boardToken === "string" && parts.length === 3 && parts[0].toLowerCase() === ext.boardToken.toLowerCase() && parts[1] === "jobs" && parts[2] === String(job.externalId);
      if (ext.adapter === "lever-postings") return url.hostname === "jobs.lever.co" && typeof ext.site === "string" &&
        parts.length >= 2 && parts.length <= 3 && parts[0].toLowerCase() === ext.site.toLowerCase() && parts[1] === String(job.externalId) && (parts.length === 2 || parts[2] === "apply");
      return false;
    } catch (_) { return false; }
  }
  function applicationLink(documentRef, job) {
    if (!job || job.isDemo || !trustedApplicationUrl(job)) return null;
    const link = documentRef.createElement("a");
    link.href = job.applicationUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "secondary-button jobs-apply-link";
    link.textContent = `Open ${job.source.name} application ↗`;
    link.setAttribute("aria-label", `Open the application page on ${job.source.name}; this opens a new tab and leaves Better Hacker`);
    return link;
  }
  function text(documentRef, tag, value, className) {
    const element = documentRef.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  }
  function renderJob(documentRef, job, evidence, precomputedMatch) {
    const article = documentRef.createElement("article");
    article.className = "jobs-card";
    article.dataset.jobId = job.id;
    const freshness = Jobs.freshness(job);
    article.append(text(documentRef, "p", job.isDemo ? "DEMO · NOT A CURRENT OPENING" : statusLabel(freshness), `jobs-status-badge jobs-status-${freshness}`));
    article.append(text(documentRef, "h4", job.title, "jobs-card-title"));
    const employerLocation = [job.employer || "Employer not provided", job.location && job.location.display || "Location not provided"].join(" · ");
    if (employerLocation) article.append(text(documentRef, "p", employerLocation, "jobs-employer-location"));
    const meta = [label(job.workplace) || "Work arrangement not provided", label(job.employmentType) || "Employment type not provided", label(job.experienceLevel) || "Experience level not provided"].join(" · ");
    article.append(text(documentRef, "p", meta, "jobs-meta"));
    if (job.salaryRange) article.append(text(documentRef, "p", formatSalary(job.salaryRange), "jobs-salary"));
    const mappedSkills = job.isDemo ? [] : Matching.jobSkills(job);
    if (!job.isDemo) {
      const match = precomputedMatch || Matching.matchJobSkills(job, evidence, Portfolio);
      const summary = match.hasStructuredSkills ? match.message : "No mapped skills are available for a readiness comparison yet.";
      article.append(text(documentRef, "p", summary, "jobs-match-summary"));
      if (mappedSkills.length) article.append(text(documentRef, "p", `Recognized skills: ${mappedSkills.slice(0, 4).map(skill => skill.label).join(", ")}${mappedSkills.length > 4 ? ` and ${mappedSkills.length - 4} more` : ""}`, "jobs-mapped-skill-summary"));
      const details = documentRef.createElement("details");
      details.className = "jobs-details";
      const summaryToggle = text(documentRef, "summary", "Job details, listed skills, and learning evidence");
      details.append(summaryToggle);
      if (job.description) details.append(text(documentRef, "p", job.description, "jobs-description"));
      else details.append(text(documentRef, "p", "The source did not provide a job description.", "jobs-description-missing"));
      const sourceSkills = Array.isArray(job.skills) ? job.skills : [];
      if (sourceSkills.length) {
        const sourceList = documentRef.createElement("ul");
        sourceList.className = "jobs-skill-list jobs-source-skill-list";
        sourceList.setAttribute("aria-label", "Skills listed in the original employer feed");
        sourceSkills.forEach(sourceSkill => {
          const item = documentRef.createElement("li");
          item.append(text(documentRef, "span", sourceSkill.label || Jobs.skillLabel(sourceSkill.id) || "Skill listed by source"));
          const sourceSkillId = sourceSkill.id || Jobs.skillId(sourceSkill.label);
          const matched = sourceSkillId && match.skills.find(skill => skill.id === sourceSkillId);
          item.append(text(documentRef, "span", matched ? statusText(matched.status) : "Not mapped for comparison", "jobs-readiness-status"));
          if (sourceSkill.level && sourceSkill.level !== "unspecified") item.append(text(documentRef, "span", `Source level: ${sourceSkill.level}`, "jobs-readiness-detail"));
          sourceList.append(item);
        });
        details.append(text(documentRef, "h5", "Skills listed by the employer source", "jobs-match-subheading"), sourceList);
      }
      if (mappedSkills.length) {
        const list = documentRef.createElement("ul");
        list.className = "jobs-skill-list jobs-readiness-list";
        list.setAttribute("aria-label", "Employer skills and Better Hacker evidence status");
        match.skills.forEach(skill => {
          const item = documentRef.createElement("li");
          item.append(text(documentRef, "span", skill.label, "jobs-readiness-skill"));
          item.append(text(documentRef, "span", statusText(skill.status), `jobs-readiness-status jobs-readiness-${skill.status}`));
          if (skill.status === "demonstrated") {
            const record = (evidence.skills.find(entry => entry.id === skill.id) || {}).evidence || [];
            if (record.length) item.append(text(documentRef, "span", `Evidence: ${record.map(entry => entry.activityTitle).join("; ")}`, "jobs-readiness-detail"));
          } else {
            const activities = Matching.learningActivities(skill.id, Portfolio);
            if (activities.length) {
              const link = documentRef.createElement("a");
              link.href = activities[0].href;
              link.textContent = `${skill.status === "developing" ? "Continue" : "Build evidence"}: ${activities[0].title}`;
              link.setAttribute("aria-label", `${skill.status === "developing" ? "Continue developing" : "Build evidence for"} ${skill.label}: ${activities[0].title}`);
              item.append(link);
            } else item.append(text(documentRef, "span", "No Better Hacker activity is currently available for this skill.", "jobs-readiness-detail"));
          }
          list.append(item);
        });
        details.append(text(documentRef, "h5", "Skills recognized for this comparison", "jobs-match-subheading"), list);
      } else details.append(text(documentRef, "p", Matching.NO_SKILLS, "jobs-evidence-empty"));
      if (match.portfolioEvidence.length) {
        const portfolioList = documentRef.createElement("ul");
        portfolioList.className = "jobs-evidence-list jobs-portfolio-evidence";
        portfolioList.setAttribute("aria-label", "Portfolio items linked to demonstrated job skills");
        match.portfolioEvidence.forEach(item => {
          const row = documentRef.createElement("li");
          row.append(text(documentRef, "span", `${item.skillLabel}: ${item.title}`));
          const view = documentRef.createElement("button");
          view.type = "button";
          view.dataset.portfolioView = item.activityId;
          view.className = "jobs-portfolio-view";
          view.textContent = "Open portfolio item";
          view.setAttribute("aria-label", `Open portfolio item ${item.title} for ${item.skillLabel}`);
          row.append(view);
          portfolioList.append(row);
        });
        details.append(text(documentRef, "h5", "Related portfolio evidence", "jobs-match-subheading"), portfolioList);
      } else details.append(text(documentRef, "p", "No saved portfolio project is linked to these skills yet.", "jobs-portfolio-empty"));
      details.append(text(documentRef, "p", match.disclaimer, "jobs-match-disclaimer"));
      article.append(details);
    }
    const observedAt = job.lastObservedAt || job.dateImported;
    const observed = observedAt ? ` · Checked ${observedAt.slice(0, 10)}` : " · Check date not supplied";
    article.append(text(documentRef, "p", `Source: ${job.source.name}${job.datePosted ? ` · Posted ${job.datePosted}` : " · Posting date not supplied"}${observed}`, "jobs-source"));
    if (job.isDemo) article.append(text(documentRef, "p", "Sample only. There is no real employer or application available.", "jobs-demo-card-note"));
    else if (job.applicationUrl) {
      const link = applicationLink(documentRef, job);
      if (link) {
        article.append(link, text(documentRef, "p", `Opens a new tab and leaves Better Hacker. ${job.source.name} hosts the application page.`, "jobs-external-note"));
      } else article.append(text(documentRef, "p", "This application link did not pass the safety checks, so no link is available.", "jobs-no-application"));
    } else article.append(text(documentRef, "p", "No application URL was provided by the source.", "jobs-no-application"));
    return article;
  }
  function statusLabel(status) {
    return ({ stale: "POSSIBLY STALE · POSTED OVER 30 DAYS AGO", expired: "EXPIRED PER SOURCE DATE", removed: "REMOVED FROM CURRENT FEED", unknown: "IN CURRENT FEED · POSTING DATE UNKNOWN", current: "IN CURRENT FEED · POSTED WITHIN 30 DAYS" })[status] || "STATUS UNKNOWN";
  }
  function statusText(status) { return ({ demonstrated: "Demonstrated", developing: "Developing", gap: "Skill Gap" })[status] || "Not mapped"; }
  function label(value) { return value && value !== "unspecified" ? value.replace(/-/g, " ") : ""; }
  function formatSalary(value) {
    const money = amount => amount === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: value.currency || "USD", maximumFractionDigits: 0 }).format(amount);
    const range = [money(value.min), money(value.max)].filter(Boolean);
    return range.length ? `Salary reported by source: ${range.join("–")}${value.period ? ` per ${value.period}` : ""}` : "Salary not supplied";
  }
  function sortJobs(jobs, sortBy, evidence, matchForJob) {
    const list = Array.isArray(jobs) ? jobs.slice() : [];
    const rank = job => {
      if (job.isDemo) return { hasSkills: false, demonstrated: 0, gaps: 0 };
      const match = typeof matchForJob === "function" ? matchForJob(job) : Matching.matchJobSkills(job, evidence || { skills: [], developingSkills: [] }, Portfolio);
      return { hasSkills: match.hasStructuredSkills, demonstrated: match.matchedCount, gaps: match.gapCount };
    };
    const ranks = new Map(list.map(job => [job.id, rank(job)]));
    const byDate = (a, b, direction) => {
      const aDate = a.datePosted && Date.parse(a.datePosted), bDate = b.datePosted && Date.parse(b.datePosted);
      if (!Number.isFinite(aDate)) return Number.isFinite(bDate) ? 1 : 0;
      if (!Number.isFinite(bDate)) return -1;
      return (aDate - bDate) * direction;
    };
    return list.sort((a, b) => {
      const ar = ranks.get(a.id), br = ranks.get(b.id);
      if (sortBy === "demonstrated" || sortBy === "fewest-gaps") {
        if (ar.hasSkills !== br.hasSkills) return ar.hasSkills ? -1 : 1;
        const primary = sortBy === "demonstrated" ? br.demonstrated - ar.demonstrated : ar.gaps - br.gaps;
        if (primary) return primary;
      }
      const dateOrder = byDate(a, b, sortBy === "oldest" ? 1 : -1);
      return dateOrder || a.title.localeCompare(b.title);
    });
  }
  function mount(documentRef, storage) {
    const experienceRoot = documentRef.getElementById("pro-cybersecurity-jobs");
    if (!experienceRoot || !Jobs || !Demo || !Matching) return null;
    if (!storage) {
      try { storage = root.BetterHackerSessionStorage || root.localStorage; } catch (_) { storage = null; }
    }
    const controls = {
      query: documentRef.getElementById("pro-jobs-search"),
      category: documentRef.getElementById("pro-jobs-category"),
      workplace: documentRef.getElementById("pro-jobs-workplace"),
      employmentType: documentRef.getElementById("pro-jobs-type"),
      experienceLevel: documentRef.getElementById("pro-jobs-level"),
      location: documentRef.getElementById("pro-jobs-location"),
      skill: documentRef.getElementById("pro-jobs-skill"),
      postedWithin: documentRef.getElementById("pro-jobs-posted"),
      freshness: documentRef.getElementById("pro-jobs-freshness"),
      sort: documentRef.getElementById("pro-jobs-sort"),
      clear: documentRef.getElementById("pro-jobs-clear"),
      retry: documentRef.getElementById("pro-jobs-retry"),
      results: documentRef.getElementById("pro-jobs-results"),
      status: documentRef.getElementById("pro-jobs-status")
    };
    const demoJobs = Demo.createDemoJobs(Jobs);
    let liveJobs = [];
    let liveFeedState = "loading";
    let rejectedLiveCount = 0;
    let jobs = demoJobs.slice();
    let evidence = Matching.deriveLocalEvidence(Portfolio, storage);
    const filterKeys = ["query", "category", "workplace", "employmentType", "experienceLevel", "location", "skill", "postedWithinDays", "freshness"];
    function currentFilters() {
      return Object.fromEntries(filterKeys.map(key => {
        const controlKey = key === "postedWithinDays" ? "postedWithin" : key;
        return [key, controls[controlKey] ? controls[controlKey].value : "all"];
      }));
    }
    function render() {
      const filters = currentFilters();
      const matchCache = new Map();
      const matchForJob = job => {
        if (!matchCache.has(job.id)) matchCache.set(job.id, Matching.matchJobSkills(job, evidence, Portfolio));
        return matchCache.get(job.id);
      };
      const results = sortJobs(Jobs.filterJobs(jobs, filters), controls.sort.value, evidence, matchForJob);
      controls.results.replaceChildren();
      if (!results.length) {
        const visibleLive = Jobs.filterJobs(liveJobs, {});
        let message;
        if (visibleLive.length) message = "No listings match those filters. Try clearing a filter or broadening the search.";
        else if (liveFeedState === "loading") message = "Live listings are loading. Sample roles are fictional examples and are not current vacancies.";
        else if (liveFeedState === "failed") message = "Live listings could not be loaded right now. Sample roles are fictional examples and are not current vacancies.";
        else if (liveFeedState === "invalid") message = "The live job data could not be safely displayed. Please check back later.";
        else if (!liveJobs.length && rejectedLiveCount) message = "The connected feed returned records, but none passed validation. No imported listings are being shown.";
        else if (!liveJobs.length) message = "No current cybersecurity listings were found from the connected sources. Check back as employer feeds update.";
        else message = "No listings match those filters. Try clearing a filter or broadening the search.";
        controls.results.append(text(documentRef, "p", message, "jobs-empty-state"));
      } else results.forEach(job => controls.results.append(renderJob(documentRef, job, evidence, job.isDemo ? null : matchForJob(job))));
      const liveCount = results.filter(job => !job.isDemo).length;
      const demoCount = results.length - liveCount;
      const visibleLive = Jobs.filterJobs(liveJobs, {}).length;
      const liveStatus = liveCount ? `${liveCount} connected-source ${liveCount === 1 ? "listing" : "listings"} shown. Verify availability and details at the source.`
        : liveFeedState === "loading" ? "Loading connected job sources."
          : liveFeedState === "failed" ? "Live job data could not be loaded. Try again later."
            : liveFeedState === "invalid" || (!liveJobs.length && rejectedLiveCount) ? "Live job data did not pass validation; no imported listings are shown."
              : visibleLive ? "No connected-source listings match these filters."
                : "No current cybersecurity listings were found from the connected sources. Check back as employer feeds update.";
      const dataWarning = rejectedLiveCount && liveCount ? "Some source records were omitted because they did not pass validation." : "";
      controls.status.textContent = [liveStatus, dataWarning, demoCount ? `${demoCount} demo ${demoCount === 1 ? "role" : "roles"} shown separately` : ""].filter(Boolean).join(" ");
      controls.retry.hidden = liveFeedState !== "failed";
    }
    function refreshEvidence() { evidence = Matching.deriveLocalEvidence(Portfolio, storage); render(); }
    [controls.query, controls.location, controls.skill].forEach(element => element.addEventListener("input", render));
    [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel, controls.postedWithin, controls.freshness, controls.sort].forEach(element => element.addEventListener("change", render));
    controls.clear.addEventListener("click", () => {
      [controls.query, controls.location, controls.skill].forEach(element => { element.value = ""; });
      [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel, controls.postedWithin, controls.freshness, controls.sort].forEach(element => { element.value = "all"; });
      render();
      controls.query.focus();
    });
    controls.retry.addEventListener("click", () => refreshLiveJobs());
    function validLiveRecords(dataset) {
      if (!dataset || dataset.schemaVersion !== 1 || dataset.kind !== "live-job-feed" || !Array.isArray(dataset.jobs) || !Number.isInteger(dataset.sourceCount) || dataset.sourceCount < 1) return { ok: false, jobs: [], rejected: 0 };
      const normalized = [];
      let rejected = 0;
      for (const raw of dataset.jobs) {
        const result = Jobs.normalizeJob(raw, { importedAt: raw && raw.dateImported });
        const required = raw && raw.isDemo === false && raw.externalId && raw.dateImported && raw.lastObservedAt;
        const job = result.job;
        if (!required || !result.ok || !job || job.isDemo || job.source.kind !== "ats-public-feed" || !job.source.id || !job.source.name || !job.source.url || !job.employer || !job.externalId || !job.applicationUrl || !trustedApplicationUrl(job)) { rejected++; continue; }
        normalized.push(job);
      }
      const seen = new Set();
      const unique = normalized.filter(job => {
        const keys = Jobs.duplicateKeys(job);
        if (!keys.length || keys.some(key => seen.has(key))) { rejected++; return false; }
        keys.forEach(key => seen.add(key));
        return true;
      });
      return { ok: true, jobs: unique, rejected };
    }
    async function refreshLiveJobs() {
      liveFeedState = "loading";
      render();
      try {
        if (typeof root.fetch !== "function" || !root.location || !root.location.href) throw new Error("Live job loading is unavailable.");
        const datasetUrl = new URL("jobs-live.json", root.location.href);
        if (datasetUrl.origin !== root.location.origin) throw new Error("The live dataset must be same-origin.");
        const response = await root.fetch(datasetUrl.href, { credentials: "omit", redirect: "error", headers: { accept: "application/json" } });
        if (!response.ok) throw new Error("The live dataset request failed.");
        const dataset = await response.json();
        const checked = validLiveRecords(dataset);
        if (!checked.ok) throw new Error("The live dataset did not match the expected format.");
        liveJobs = checked.jobs;
        rejectedLiveCount = checked.rejected;
        liveFeedState = "loaded";
        jobs = liveJobs.concat(demoJobs);
        render();
      } catch (_) {
        liveFeedState = "failed";
        render();
      }
    }
    render();
    refreshLiveJobs();
    if (typeof root.addEventListener === "function") root.addEventListener("hashchange", refreshEvidence);
    if (typeof root.addEventListener === "function") root.addEventListener("storage", refreshEvidence);
    if (typeof documentRef.addEventListener === "function") {
      ["daily-practice-completed", "attack-box-completed"].forEach(event => documentRef.addEventListener(event, refreshEvidence));
    }
    return { get jobs() { return jobs; }, render, refreshLiveJobs, refreshEvidence, applicationLink: job => applicationLink(documentRef, job), validLiveRecords };
  }
  return { applicationLink, trustedApplicationUrl, renderJob, sortJobs, mount, formatSalary };
});
