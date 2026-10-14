(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobs = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SCHEMA_VERSION = 1;
  const DEFAULT_STALE_DAYS = 30;
  const CATEGORIES = Object.freeze([
    "entry-level", "soc", "cybersecurity-analyst", "security-analyst", "junior-security", "help-desk-it", "internship", "other"
  ]);
  const WORKPLACE_TYPES = Object.freeze(["remote", "hybrid", "onsite", "unspecified"]);
  const EMPLOYMENT_TYPES = Object.freeze(["full-time", "part-time", "contract", "internship", "apprenticeship", "temporary", "unspecified"]);
  const EXPERIENCE_LEVELS = Object.freeze(["entry-level", "junior", "internship", "mid-level", "senior", "unspecified"]);
  const SKILLS = Object.freeze({
    "alert-triage": ["alert triage"],
    "log-analysis": ["log analysis", "log correlation"],
    "evidence-correlation": ["evidence correlation", "indicator correlation"],
    "siem": ["siem"],
    "authentication-logs": ["authentication logs"],
    "linux-basics": ["linux"],
    "command-line-navigation": ["command-line navigation"],
    "file-permission-analysis": ["file and permission analysis"],
    "evidence-preservation": ["evidence preservation"],
    "network-fundamentals": ["tcp/ip fundamentals", "ports and protocols"],
    "network-analysis": ["network analysis", "traffic investigation", "network investigation"],
    "phishing-analysis": ["email analysis", "phishing analysis"],
    "safe-escalation": ["safe escalation", "escalation decisions"],
    "web-request-analysis": ["web request analysis"],
    "input-validation": ["input validation", "input handling"],
    "sql-injection-prevention": ["sql injection prevention"],
    "identity-analysis": ["identity analysis", "identity investigation"],
    "least-privilege": ["least privilege"],
    "windows-event-logs": ["windows event logs"]
  });
  const SKILL_ALIASES = Object.freeze(Object.fromEntries(Object.entries(SKILLS).flatMap(([id, aliases]) =>
    aliases.map(alias => [normalizeLabel(alias), id]))));

  function normalizeLabel(value) {
    return typeof value === "string" ? value.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim() : "";
  }
  function skillId(value) {
    const normalized = normalizeLabel(value);
    return SKILL_ALIASES[normalized] || null;
  }
  function slug(value) {
    return normalizeLabel(value).replace(/\s+/g, "-").slice(0, 100);
  }
  function cleanText(value, limit) {
    return typeof value === "string" ? value.trim().slice(0, limit || 5000) : "";
  }
  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function validDate(value, allowTimestamp) {
    if (typeof value !== "string" || !value.trim()) return false;
    if (!allowTimestamp || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return false;
    }
    return Number.isFinite(Date.parse(value));
  }
  function isoDate(value) {
    if (!value) return null;
    const text = String(value).trim();
    return validDate(text, true) ? text.slice(0, 10) : null;
  }
  function canonicalApplicationUrl(value) {
    if (typeof value !== "string" || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      if (url.protocol !== "https:" || url.username || url.password) return null;
      url.hash = "";
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_.+|ref|source|gh_src|trk|trackingid)$/i.test(key)) url.searchParams.delete(key);
      }
      url.hostname = url.hostname.toLocaleLowerCase("en-US");
      if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
      return url.toString();
    } catch (_) { return null; }
  }
  function pick(record, names) {
    for (const name of names) if (record[name] !== undefined && record[name] !== null && record[name] !== "") return record[name];
    return undefined;
  }
  function normalizeEnum(value, allowed, fallback) {
    const key = slug(value).replace(/-/g, "-");
    return allowed.includes(key) ? key : fallback;
  }
  function normalizeSkillList(values, warnings) {
    if (values === undefined || values === null || values === "") return [];
    const items = Array.isArray(values) ? values : typeof values === "string" ? values.split(/[;,]/) : null;
    if (!items) { warnings.push("Skills must be a list or delimited string; no skills were imported."); return []; }
    const seen = new Set();
    return items.map(item => {
      const object = isPlainObject(item) ? item : { label: item };
      const label = cleanText(pick(object, ["label", "name", "skill"]), 120);
      if (!label) return null;
      const declaredId = cleanText(object.id, 100);
      const id = declaredId && Object.prototype.hasOwnProperty.call(SKILLS, declaredId) ? declaredId : skillId(label);
      if (declaredId && !Object.prototype.hasOwnProperty.call(SKILLS, declaredId)) warnings.push(`Skill ID “${declaredId}” is not in the current matching taxonomy.`);
      if (!id) warnings.push(`Skill “${label}” is retained for display but is not in the current matching taxonomy.`);
      const key = id || normalizeLabel(label);
      if (seen.has(key)) return null;
      seen.add(key);
      const level = ["required", "preferred", "unspecified"].includes(object.level) ? object.level : "unspecified";
      return { id: id || null, label, level };
    }).filter(Boolean);
  }
  function normalizeCategories(values, warnings) {
    const items = Array.isArray(values) ? values : typeof values === "string" ? values.split(/[;,]/) : [];
    const categories = [];
    for (const item of items) {
      const key = slug(item);
      if (CATEGORIES.includes(key) && !categories.includes(key)) categories.push(key);
      else if (key && !CATEGORIES.includes(key)) warnings.push(`Unrecognized category “${String(item).slice(0, 80)}” was not used as a filter category.`);
    }
    return categories;
  }
  function normalizeSalary(raw, errors) {
    if (raw === undefined || raw === null || raw === "") return null;
    if (!isPlainObject(raw)) { errors.push("Salary range must be an object or blank."); return null; }
    const min = raw.min === "" || raw.min === undefined || raw.min === null ? null : Number(raw.min);
    const max = raw.max === "" || raw.max === undefined || raw.max === null ? null : Number(raw.max);
    const currency = cleanText(raw.currency, 3).toUpperCase();
    const period = cleanText(raw.period, 20).toLowerCase();
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) errors.push("Salary values must be non-negative numbers.");
    if (min !== null && max !== null && min > max) errors.push("Salary minimum cannot be greater than the maximum.");
    if (currency && !/^[A-Z]{3}$/.test(currency)) errors.push("Salary currency must be a three-letter code such as USD.");
    if (period && !["hour", "year", "month", "day", "week"].includes(period)) errors.push("Salary period must be hour, day, week, month, or year.");
    if (min === null && max === null && !currency && !period) return null;
    return { min: Number.isFinite(min) ? min : null, max: Number.isFinite(max) ? max : null, currency: currency || null, period: period || null, sourceText: cleanText(raw.sourceText, 240) || null };
  }
  function normalizeJob(raw, options) {
    const opts = options || {};
    const errors = [], warnings = [];
    if (!isPlainObject(raw)) return { ok: false, job: null, errors: ["Record must be a JSON object."], warnings };
    const title = cleanText(pick(raw, ["title", "jobTitle", "job_title"]), 180);
    const employer = cleanText(pick(raw, ["employer", "company", "organization"]), 180) || null;
    const locationInput = pick(raw, ["location", "locationName"]);
    const location = typeof locationInput === "string" ? { display: cleanText(locationInput, 180), city: null, region: null, country: null } : {
      display: cleanText(locationInput && locationInput.display, 180) || null,
      city: cleanText(locationInput && locationInput.city, 100) || null,
      region: cleanText(locationInput && locationInput.region, 100) || null,
      country: cleanText(locationInput && locationInput.country, 100) || null
    };
    const sourceInput = pick(raw, ["source", "sourceName"]) || opts.source;
    const source = typeof sourceInput === "string" ? { id: slug(sourceInput) || "unspecified", name: cleanText(sourceInput, 160), kind: "unspecified", url: null } : {
      id: cleanText(sourceInput && sourceInput.id, 100) || slug(sourceInput && sourceInput.name) || "unspecified",
      name: cleanText(sourceInput && sourceInput.name, 160),
      kind: cleanText(sourceInput && sourceInput.kind, 60) || "unspecified",
      url: sourceInput && sourceInput.url ? canonicalApplicationUrl(sourceInput.url) : null
    };
    const applicationUrlRaw = pick(raw, ["applicationUrl", "application_url", "applyUrl", "url"]);
    const applicationUrl = applicationUrlRaw ? canonicalApplicationUrl(String(applicationUrlRaw)) : null;
    if (!title) errors.push("Job title is required.");
    if (!source.name) errors.push("Source attribution is required.");
    if (applicationUrlRaw && !applicationUrl) errors.push("Application URL must be a valid HTTPS URL without embedded credentials.");
    if (!applicationUrl) warnings.push("No valid application URL was supplied; this record cannot provide an application link.");
    const workplaceRaw = pick(raw, ["workplace", "workplaceType", "workplace_type"]);
    const workplace = normalizeEnum(workplaceRaw, WORKPLACE_TYPES, "unspecified");
    if (workplaceRaw && workplace === "unspecified" && slug(workplaceRaw) !== "unspecified") warnings.push("Workplace type was not recognized and is marked unspecified.");
    const employmentRaw = pick(raw, ["employmentType", "employment_type"]);
    const employmentType = normalizeEnum(employmentRaw, EMPLOYMENT_TYPES, "unspecified");
    if (employmentRaw && employmentType === "unspecified" && slug(employmentRaw) !== "unspecified") warnings.push("Employment type was not recognized and is marked unspecified.");
    const experienceRaw = pick(raw, ["experienceLevel", "experience_level"]);
    const experienceLevel = normalizeEnum(experienceRaw, EXPERIENCE_LEVELS, "unspecified");
    if (experienceRaw && experienceLevel === "unspecified" && slug(experienceRaw) !== "unspecified") warnings.push("Experience level was not recognized and is marked unspecified.");
    const datePostedRaw = pick(raw, ["datePosted", "date_posted"]);
    const expiresAtRaw = pick(raw, ["expiresAt", "expires_at", "expirationDate"]);
    if (datePostedRaw && !validDate(String(datePostedRaw), true)) errors.push("Date posted must be a valid date or ISO timestamp.");
    if (expiresAtRaw && !validDate(String(expiresAtRaw), true)) errors.push("Expiration date must be a valid date or ISO timestamp.");
    let importedAt = cleanText(opts.importedAt || raw.importedAt || raw.dateImported, 40);
    if (!importedAt) importedAt = new Date().toISOString();
    if (!validDate(importedAt, true)) errors.push("Import timestamp must be a valid ISO date or timestamp.");
    const skills = normalizeSkillList(pick(raw, ["skills", "technologies", "requiredSkills"]), warnings);
    const categories = normalizeCategories(pick(raw, ["categories", "roleCategories", "role_categories"]), warnings);
    const salaryRange = normalizeSalary(pick(raw, ["salaryRange", "salary_range", "salary"]), errors);
    const externalId = cleanText(pick(raw, ["externalId", "external_id", "sourceJobId"]), 180) || null;
    const description = cleanText(pick(raw, ["description", "summary"]), 3000);
    const id = cleanText(raw.id, 180) || (externalId ? `${source.id}-${slug(externalId)}` : applicationUrl ? `job-${slug(applicationUrl)}` : `job-${slug(`${title}-${employer || "unknown"}`)}`);
    let extensions = {};
    if (isPlainObject(raw.extensions)) {
      try { extensions = JSON.parse(JSON.stringify(raw.extensions)); }
      catch (_) { warnings.push("Unserializable extension fields were omitted."); }
    }
    const job = {
      schemaVersion: SCHEMA_VERSION, id, externalId, title, employer, location,
      workplace, employmentType, experienceLevel, categories, salaryRange,
      datePosted: isoDate(datePostedRaw), skills, description, source,
      applicationUrl, dateImported: importedAt,
      expiresAt: isoDate(expiresAtRaw), isDemo: opts.demo === true,
      extensions
    };
    return { ok: errors.length === 0, job: errors.length ? null : job, errors, warnings };
  }
  function duplicateKey(job) {
    if (!job) return null;
    if (job.externalId) return `external:${normalizeLabel(job.source && job.source.id)}:${normalizeLabel(job.externalId)}`;
    const url = canonicalApplicationUrl(job.applicationUrl);
    if (url) return `url:${url}`;
    return `fingerprint:${normalizeLabel(job.title)}|${normalizeLabel(job.employer || "")}|${normalizeLabel(job.location && job.location.display || "")}`;
  }
  function ingestRecords(records, options) {
    const opts = options || {};
    if (!Array.isArray(records)) return { jobs: [], duplicates: [], rejected: [{ index: null, errors: ["Input must be an array of records."], warnings: [] }], warnings: [] };
    const jobs = [], duplicates = [], rejected = [], warnings = [];
    const seen = new Map();
    for (const existing of (Array.isArray(opts.existingJobs) ? opts.existingJobs : [])) {
      const key = duplicateKey(existing);
      if (key && !seen.has(key)) seen.set(key, existing.id || "existing record");
    }
    records.forEach((record, index) => {
      const result = normalizeJob(record, opts);
      warnings.push(...result.warnings.map(message => ({ index, message })));
      if (!result.ok) { rejected.push({ index, record, errors: result.errors, warnings: result.warnings }); return; }
      const key = duplicateKey(result.job);
      if (seen.has(key)) { duplicates.push({ index, id: result.job.id, key, duplicateOf: seen.get(key), record }); return; }
      seen.set(key, result.job.id);
      jobs.push(result.job);
    });
    return { jobs, duplicates, rejected, warnings };
  }
  function freshness(job, today, staleDays) {
    if (job && job.isDemo) return "demo";
    const date = today || new Date().toISOString().slice(0, 10);
    if (job && job.expiresAt && job.expiresAt <= date) return "expired";
    if (!job || !job.datePosted) return "unknown";
    const threshold = Number.isInteger(staleDays) ? staleDays : DEFAULT_STALE_DAYS;
    const age = Math.floor((Date.parse(date) - Date.parse(job.datePosted)) / 86400000);
    return age > threshold ? "stale" : "current";
  }
  function searchText(job) {
    return [job.title, job.employer, job.location && job.location.display, job.description,
      job.source && job.source.name, ...(job.categories || []), ...(job.skills || []).map(skill => skill.label)]
      .filter(Boolean).join(" ").toLocaleLowerCase("en-US");
  }
  function filterJobs(jobs, filters, today) {
    const f = filters || {};
    const query = normalizeLabel(f.query || "");
    const terms = query ? query.split(/\s+/).filter(Boolean) : [];
    const location = normalizeLabel(f.location || "");
    const skill = normalizeLabel(f.skill || "");
    return (Array.isArray(jobs) ? jobs : []).filter(job => {
      const state = freshness(job, today, f.staleDays);
      if (state === "expired" && f.includeExpired !== true) return false;
      if (f.includeDemo === false && job.isDemo) return false;
      if (terms.length && !terms.every(term => searchText(job).includes(term))) return false;
      if (f.category && f.category !== "all" && !(job.categories || []).includes(f.category)) return false;
      if (f.workplace && f.workplace !== "all" && job.workplace !== f.workplace) return false;
      if (f.employmentType && f.employmentType !== "all" && job.employmentType !== f.employmentType) return false;
      if (f.experienceLevel && f.experienceLevel !== "all" && job.experienceLevel !== f.experienceLevel) return false;
      if (location && !normalizeLabel(job.location && job.location.display).includes(location)) return false;
      if (skill && !(job.skills || []).some(item => normalizeLabel(item.label).includes(skill) || (item.id || "").includes(slug(skill)))) return false;
      return true;
    });
  }

  return { SCHEMA_VERSION, DEFAULT_STALE_DAYS, CATEGORIES, WORKPLACE_TYPES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
    SKILLS, normalizeLabel, skillId, normalizeJob, canonicalApplicationUrl, duplicateKey, ingestRecords, freshness, filterJobs };
});
