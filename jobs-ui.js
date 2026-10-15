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
      try { storage = root.localStorage; } catch (_) {}
      api.mount(root.document, storage);
    }
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs, Demo, Matching, Portfolio, root) {
  "use strict";
  function trustedApplicationUrl(job) {
    if (!job || !job.applicationUrl || !job.externalId) return false;
    try {
      const url = new URL(job.applicationUrl);
      if (url.protocol !== "https:" || url.username || url.password) return false;
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
    link.textContent = "Apply at Source ↗";
    link.setAttribute("aria-label", `View the application on ${job.source.name} (opens a new tab and leaves Better Hacker)`);
    return link;
  }
  function text(documentRef, tag, value, className) {
    const element = documentRef.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  }
  function renderJob(documentRef, job, evidence) {
    const article = documentRef.createElement("article");
    article.className = "jobs-card";
    article.dataset.jobId = job.id;
    article.append(text(documentRef, "p", job.isDemo ? "DEMO · NOT A CURRENT OPENING" : statusLabel(Jobs.freshness(job)), "jobs-status-badge"));
    article.append(text(documentRef, "h4", job.title, "jobs-card-title"));
    const employerLocation = [job.employer, job.location && job.location.display].filter(Boolean).join(" · ");
    if (employerLocation) article.append(text(documentRef, "p", employerLocation, "jobs-employer-location"));
    const meta = [label(job.workplace), label(job.employmentType), label(job.experienceLevel)].filter(Boolean).join(" · ");
    if (meta) article.append(text(documentRef, "p", meta, "jobs-meta"));
    if (job.salaryRange) article.append(text(documentRef, "p", formatSalary(job.salaryRange), "jobs-salary"));
    if (job.description) article.append(text(documentRef, "p", job.description, "jobs-description"));
    const mappedSkills = job.isDemo ? [] : Matching.jobSkills(job);
    if (!job.isDemo && mappedSkills.length) {
      const list = documentRef.createElement("ul");
      list.className = "jobs-skill-list";
      list.setAttribute("aria-label", "Skills shown in this job");
      article.append(text(documentRef, "h5", "Skills shown in this job", "jobs-match-subheading"));
      mappedSkills.forEach(skill => list.append(text(documentRef, "li", skill.label)));
      article.append(list);
      article.append(text(documentRef, "h5", "Your Better Hacker evidence", "jobs-match-heading"));
      const match = Matching.matchJobSkills(job, evidence, Portfolio);
      article.append(text(documentRef, "p", match.message, "jobs-match-summary"));
      if (match.noEvidenceMessage) article.append(text(documentRef, "p", match.noEvidenceMessage, "jobs-evidence-empty"));
      if (match.matchedEvidence.length) {
        const matched = documentRef.createElement("ul");
        matched.className = "jobs-evidence-list jobs-evidence-matched";
        matched.setAttribute("aria-label", "Matched skills shown in Better Hacker evidence");
        match.matchedEvidence.forEach(skill => {
          const activity = skill.evidence[0];
          matched.append(text(documentRef, "li", `✓ ${skill.label}${activity ? ` — Evidence: ${activity.activityTitle}${activity.source === "structured-portfolio" ? " (portfolio)" : ""}` : ""}`));
        });
        article.append(text(documentRef, "h5", "Matched skills", "jobs-match-subheading"), matched);
      }
      if (match.gaps.length) {
        const missing = documentRef.createElement("ul");
        missing.className = "jobs-evidence-list jobs-evidence-missing";
        missing.setAttribute("aria-label", "Skills not yet shown in Better Hacker evidence");
        match.gaps.forEach(skill => {
          const item = documentRef.createElement("li");
          item.append(text(documentRef, "span", `○ ${skill.label}`));
          skill.activities.forEach(activity => {
            const link = documentRef.createElement("a");
            link.href = activity.href;
            link.textContent = `Practice ${skill.label}: ${activity.title}`;
            link.setAttribute("aria-label", `Build evidence for ${skill.label}: open ${activity.title}`);
            item.append(documentRef.createElement("br"), link);
          });
          missing.append(item);
        });
        article.append(text(documentRef, "h5", "Not yet shown in your Better Hacker evidence", "jobs-match-subheading"), missing);
      }
      article.append(text(documentRef, "p", match.disclaimer, "jobs-match-disclaimer"));
    } else if (!job.isDemo) {
      article.append(text(documentRef, "p", Matching.NO_SKILLS, "jobs-evidence-empty"));
    }
    if (job.isDemo) article.append(text(documentRef, "p", "Sample only. There is no real employer or application available.", "jobs-demo-card-note"));
    else if (job.applicationUrl) article.append(applicationLink(documentRef, job));
    else article.append(text(documentRef, "p", "No application URL was provided by the source.", "jobs-no-application"));
    const observedAt = job.lastObservedAt || job.dateImported;
    const observed = observedAt ? ` · Checked ${observedAt.slice(0, 10)}` : "";
    article.append(text(documentRef, "p", `Source: ${job.source.name}${job.datePosted ? ` · Posted ${job.datePosted}` : " · Posting date not supplied"}${observed}`, "jobs-source"));
    return article;
  }
  function statusLabel(status) {
    return ({ stale: "POSSIBLY STALE · VERIFY AT SOURCE", expired: "EXPIRED", unknown: "LIVE LISTING · POSTING DATE NOT SUPPLIED", current: "LIVE · CURRENT LISTING" })[status] || "STATUS UNKNOWN";
  }
  function label(value) { return value && value !== "unspecified" ? value.replace(/-/g, " ") : ""; }
  function formatSalary(value) {
    const money = amount => amount === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: value.currency || "USD", maximumFractionDigits: 0 }).format(amount);
    const range = [money(value.min), money(value.max)].filter(Boolean);
    return range.length ? `Salary reported by source: ${range.join("–")}${value.period ? ` per ${value.period}` : ""}` : "Salary not supplied";
  }
  function mount(documentRef, storage) {
    const experienceRoot = documentRef.getElementById("pro-cybersecurity-jobs");
    if (!experienceRoot || !Jobs || !Demo || !Matching) return null;
    const controls = {
      query: documentRef.getElementById("pro-jobs-search"),
      category: documentRef.getElementById("pro-jobs-category"),
      workplace: documentRef.getElementById("pro-jobs-workplace"),
      employmentType: documentRef.getElementById("pro-jobs-type"),
      experienceLevel: documentRef.getElementById("pro-jobs-level"),
      location: documentRef.getElementById("pro-jobs-location"),
      skill: documentRef.getElementById("pro-jobs-skill"),
      clear: documentRef.getElementById("pro-jobs-clear"),
      results: documentRef.getElementById("pro-jobs-results"),
      status: documentRef.getElementById("pro-jobs-status")
    };
    const demoJobs = Demo.createDemoJobs(Jobs);
    let liveJobs = [];
    let liveFeedLoaded = false;
    let jobs = demoJobs.slice();
    let evidence = Matching.deriveLocalEvidence(Portfolio, storage);
    function render() {
      const filters = Object.fromEntries(Object.entries(controls).filter(([key, element]) => ["query", "category", "workplace", "employmentType", "experienceLevel", "location", "skill"].includes(key)).map(([key, element]) => [key, element.value]));
      const results = Jobs.filterJobs(jobs, filters);
      controls.results.replaceChildren();
      if (!results.length) {
        const visibleLive = Jobs.filterJobs(liveJobs, {});
        controls.results.append(text(documentRef, "p", visibleLive.length ? "No job listings match those filters. Try clearing a filter or broadening the search." : liveFeedLoaded ? "No current cybersecurity listings were found from the connected sources. Check back as employer feeds update." : "No sample roles match those filters. Try clearing a filter or broadening the search.", "jobs-empty-state"));
      } else results.forEach(job => controls.results.append(renderJob(documentRef, job, evidence)));
      const liveCount = results.filter(job => !job.isDemo).length;
      const demoCount = results.length - liveCount;
      const visibleLive = Jobs.filterJobs(liveJobs, {}).length;
      const liveStatus = liveCount ? `${liveCount} real ${liveCount === 1 ? "listing" : "listings"} shown` : visibleLive ? "No current listings match these filters." : liveFeedLoaded ? "No current cybersecurity listings were found from the connected sources. Check back as employer feeds update." : "Sample roles shown separately. These are not current vacancies.";
      controls.status.textContent = [liveStatus, demoCount ? `${demoCount} demo ${demoCount === 1 ? "role" : "roles"} shown separately` : ""].filter(Boolean).join(" · ") + (liveCount ? ". Verify current availability and details at the source." : "");
    }
    function refreshEvidence() { evidence = Matching.deriveLocalEvidence(Portfolio, storage); render(); }
    [controls.query, controls.location, controls.skill].forEach(element => element.addEventListener("input", render));
    [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel].forEach(element => element.addEventListener("change", render));
    controls.clear.addEventListener("click", () => {
      [controls.query, controls.location, controls.skill].forEach(element => { element.value = ""; });
      [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel].forEach(element => { element.value = "all"; });
      render();
      controls.query.focus();
    });
    function validLiveRecords(dataset) {
      if (!dataset || dataset.schemaVersion !== 1 || dataset.kind !== "live-job-feed" || !Array.isArray(dataset.jobs)) return [];
      return dataset.jobs.map(raw => Jobs.normalizeJob(raw, { importedAt: raw && raw.dateImported })).filter(result =>
        result.ok && !result.job.isDemo && result.job.source.kind === "ats-public-feed" &&
        result.job.source.name && result.job.source.url && result.job.applicationUrl && trustedApplicationUrl(result.job)
      ).map(result => result.job);
    }
    async function refreshLiveJobs() {
      if (typeof root.fetch !== "function" || !root.location || !root.location.href) return;
      try {
        const datasetUrl = new URL("jobs-live.json", root.location.href);
        if (datasetUrl.origin !== root.location.origin) return;
        const response = await root.fetch(datasetUrl.href, { credentials: "omit", redirect: "error", headers: { accept: "application/json" } });
        if (!response.ok) return;
        const dataset = await response.json();
        liveJobs = validLiveRecords(dataset);
        liveFeedLoaded = true;
        jobs = liveJobs.concat(demoJobs);
        render();
      } catch (_) { /* Keep the clearly labeled demo preview when no dataset is available. */ }
    }
    render();
    refreshLiveJobs();
    if (typeof root.addEventListener === "function") root.addEventListener("hashchange", refreshEvidence);
    return { get jobs() { return jobs; }, render, refreshLiveJobs, refreshEvidence, applicationLink: job => applicationLink(documentRef, job) };
  }
  return { applicationLink, trustedApplicationUrl, renderJob, mount, formatSalary };
});
