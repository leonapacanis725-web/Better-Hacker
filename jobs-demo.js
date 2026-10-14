(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobsDemo = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Fictional preview records only. This data is deliberately separate from all production feeds.
  const DEMO_JOB_RECORDS = Object.freeze([
    Object.freeze({
      id: "demo-soc-analyst", title: "Sample: Junior SOC Analyst", employer: "Fictional Demo Employer",
      location: "Sample location (not a real opening)", workplace: "remote", employmentType: "full-time",
      experienceLevel: "entry-level", categories: ["entry-level", "soc", "junior-security"],
      salaryRange: null, datePosted: null,
      skills: ["Alert triage", "Log analysis", "Evidence correlation", "SIEM", "Authentication logs"],
      description: "Illustrative role profile showing how an entry-level security operations listing could be organized. It is not a real vacancy and is not open for applications.",
      source: { id: "demo", name: "Built-in demo data", kind: "demo", url: null }, applicationUrl: null, expiresAt: null,
      extensions: { demoPurpose: "interface-preview" }
    }),
    Object.freeze({
      id: "demo-security-intern", title: "Sample: Cybersecurity Analyst Intern", employer: "Fictional Demo Employer",
      location: "Sample city (not a real opening)", workplace: "hybrid", employmentType: "internship",
      experienceLevel: "internship", categories: ["internship", "cybersecurity-analyst", "security-analyst"],
      salaryRange: null, datePosted: null,
      skills: ["Web request analysis", "Input validation", "Evidence preservation", "Safe escalation"],
      description: "Illustrative internship profile for demonstrating beginner-friendly filters. Employer, location, terms, and role are fictional; this is not an active position.",
      source: { id: "demo", name: "Built-in demo data", kind: "demo", url: null }, applicationUrl: null, expiresAt: null,
      extensions: { demoPurpose: "interface-preview" }
    }),
    Object.freeze({
      id: "demo-it-pathway", title: "Sample: Help Desk Technician — Security Pathway", employer: "Fictional Demo Employer",
      location: "Sample region (not a real opening)", workplace: "onsite", employmentType: "full-time",
      experienceLevel: "entry-level", categories: ["entry-level", "help-desk-it"],
      salaryRange: null, datePosted: null,
      skills: ["Linux", "Command-line navigation", "File and permission analysis", "Evidence preservation"],
      description: "Illustrative IT support profile showing a possible first step toward cybersecurity. This fictional role is not open for applications.",
      source: { id: "demo", name: "Built-in demo data", kind: "demo", url: null }, applicationUrl: null, expiresAt: null,
      extensions: { demoPurpose: "interface-preview" }
    })
  ]);
  function createDemoJobs(Jobs, importedAt) {
    if (!Jobs || typeof Jobs.normalizeJob !== "function") throw new TypeError("A Better Hacker Jobs normalizer is required.");
    return DEMO_JOB_RECORDS.map(record => Jobs.normalizeJob(record, { demo: true, importedAt }).job).filter(Boolean);
  }
  return { DEMO_JOB_RECORDS, createDemoJobs };
});
