(function (root, factory) {
  const commonJs = typeof module === "object" && module.exports;
  const api = factory(
    commonJs ? require("./jobs.js") : root.BetterHackerJobs,
    commonJs ? require("./jobs-demo.js") : root.BetterHackerJobsDemo,
    commonJs ? require("./jobs-matching.js") : root.BetterHackerJobsMatching,
    commonJs ? require("./portfolio.js") : root.BetterHackerPortfolio
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
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs, Demo, Matching, Portfolio) {
  "use strict";
  function applicationLink(documentRef, job) {
    if (!job || job.isDemo || !job.applicationUrl) return null;
    const link = documentRef.createElement("a");
    link.href = job.applicationUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "secondary-button jobs-apply-link";
    link.textContent = "Apply on source site ↗";
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
    if (job.skills.length) {
      const list = documentRef.createElement("ul");
      list.className = "jobs-skill-list";
      list.setAttribute("aria-label", "Skills and technologies listed for this role");
      job.skills.forEach(skill => list.append(text(documentRef, "li", skill.label)));
      article.append(list);
    }
    const match = Matching.matchJobSkills(job, evidence);
    article.append(text(documentRef, "p", match.message, "jobs-match-summary"));
    if (job.isDemo) article.append(text(documentRef, "p", "Sample only. There is no real employer or application available.", "jobs-demo-card-note"));
    else if (job.applicationUrl) article.append(applicationLink(documentRef, job));
    else article.append(text(documentRef, "p", "No application URL was provided by the source.", "jobs-no-application"));
    article.append(text(documentRef, "p", `Source: ${job.source.name}${job.datePosted ? ` · Posted ${job.datePosted}` : " · Posting date not supplied"}`, "jobs-source"));
    return article;
  }
  function statusLabel(status) {
    return ({ stale: "POSSIBLY STALE · VERIFY AT SOURCE", expired: "EXPIRED", unknown: "POSTING DATE UNKNOWN", current: "SOURCE DATE PROVIDED" })[status] || "STATUS UNKNOWN";
  }
  function label(value) { return value && value !== "unspecified" ? value.replace(/-/g, " ") : ""; }
  function formatSalary(value) {
    const money = amount => amount === null ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: value.currency || "USD", maximumFractionDigits: 0 }).format(amount);
    const range = [money(value.min), money(value.max)].filter(Boolean);
    return range.length ? `Salary reported by source: ${range.join("–")}${value.period ? ` per ${value.period}` : ""}` : "Salary not supplied";
  }
  function mount(documentRef, storage) {
    const root = documentRef.getElementById("pro-jobs-experience");
    if (!root || !Jobs || !Demo || !Matching) return null;
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
    const jobs = Demo.createDemoJobs(Jobs);
    let evidence = Matching.deriveLocalEvidence(Portfolio, storage);
    function render() {
      const filters = Object.fromEntries(Object.entries(controls).filter(([key, element]) => ["query", "category", "workplace", "employmentType", "experienceLevel", "location", "skill"].includes(key)).map(([key, element]) => [key, element.value]));
      const results = Jobs.filterJobs(jobs, filters);
      controls.results.replaceChildren();
      if (!results.length) {
        controls.results.append(text(documentRef, "p", "No sample roles match those filters. Try clearing a filter or broadening the search.", "jobs-empty-state"));
      } else results.forEach(job => controls.results.append(renderJob(documentRef, job, evidence)));
      controls.status.textContent = `${results.length} demo ${results.length === 1 ? "role" : "roles"} shown. These are not current vacancies.`;
    }
    [controls.query, controls.location, controls.skill].forEach(element => element.addEventListener("input", render));
    [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel].forEach(element => element.addEventListener("change", render));
    controls.clear.addEventListener("click", () => {
      [controls.query, controls.location, controls.skill].forEach(element => { element.value = ""; });
      [controls.category, controls.workplace, controls.employmentType, controls.experienceLevel].forEach(element => { element.value = "all"; });
      render();
      controls.query.focus();
    });
    render();
    return { jobs, render, refreshEvidence() { evidence = Matching.deriveLocalEvidence(Portfolio, storage); render(); }, applicationLink: job => applicationLink(documentRef, job) };
  }
  return { applicationLink, renderJob, mount, formatSalary };
});
