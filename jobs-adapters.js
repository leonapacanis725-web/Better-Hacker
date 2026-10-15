"use strict";

const Jobs = require("./jobs.js");

const SOURCE_TYPES = Object.freeze({
  greenhouse: { host: "boards-api.greenhouse.io", sourceKind: "ats-public-feed" },
  lever: { host: "api.lever.co", sourceKind: "ats-public-feed" }
});

function requireSlug(value, field) {
  if (typeof value !== "string" || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(value)) throw new Error(`${field} must be a simple public board identifier.`);
  return value;
}
function requireSource(config, type) {
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Source configuration must be an object.");
  if (config.type !== type) throw new Error(`Expected a ${type} source configuration.`);
  const id = requireSlug(config.id, "Source ID");
  const employer = typeof config.employerName === "string" ? config.employerName.trim().slice(0, 180) : "";
  if (!employer) throw new Error("An explicit employerName is required for attribution.");
  const sourceUrl = Jobs.canonicalApplicationUrl(config.sourceUrl);
  if (!sourceUrl) throw new Error("A verified HTTPS employer career-page URL is required for attribution.");
  return { id, employer, sourceUrl, name: String(config.name || employer).trim().slice(0, 160) };
}
function descriptionText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ").trim().slice(0, 3000);
}
function locationText(value) {
  return typeof value === "string" ? value : value && typeof value.name === "string" ? value.name : "";
}
function mapGreenhouse(config, payload, importedAt) {
  const sourceConfig = requireSource(config, "greenhouse");
  const boardToken = requireSlug(config.boardToken, "Greenhouse boardToken");
  const rows = payload && payload.jobs;
  if (!Array.isArray(rows)) throw new Error("Greenhouse response did not contain a jobs array.");
  const source = { id: sourceConfig.id, name: sourceConfig.name, kind: SOURCE_TYPES.greenhouse.sourceKind, url: sourceConfig.sourceUrl };
  return rows.map(row => ({
    title: row && row.title,
    employer: sourceConfig.employer,
    location: locationText(row && row.location),
    workplace: "unspecified",
    employmentType: "unspecified",
    experienceLevel: "unspecified",
    categories: Array.isArray(row && row.departments) ? row.departments.map(item => item && item.name).filter(Boolean) : [],
    datePosted: row && row.first_published || null,
    expiresAt: row && row.application_deadline || null,
    skills: [],
    description: descriptionText(row && row.content),
    source,
    applicationUrl: row && row.absolute_url,
    externalId: row && row.id != null ? String(row.id) : null,
    importedAt,
    lastObservedAt: importedAt,
    extensions: { adapter: "greenhouse-job-board", boardToken, requisitionId: row && row.requisition_id || null,
      sourceCategories: Array.isArray(row && row.departments) ? row.departments.map(item => item && item.name).filter(Boolean) : [] }
  }));
}
function dateFromEpoch(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function mapLever(config, payload, importedAt) {
  const sourceConfig = requireSource(config, "lever");
  const site = requireSlug(config.site, "Lever site");
  if (!Array.isArray(payload)) throw new Error("Lever response must be an array of published postings.");
  const source = { id: sourceConfig.id, name: sourceConfig.name, kind: SOURCE_TYPES.lever.sourceKind, url: sourceConfig.sourceUrl };
  return payload.map(row => {
    const categories = row && row.categories && typeof row.categories === "object" ? row.categories : {};
    const location = categories.location && typeof categories.location === "object" ? categories.location.name : categories.location;
    return {
      title: row && row.text,
      employer: sourceConfig.employer,
      location: typeof location === "string" ? location : "",
      workplace: "unspecified",
      employmentType: "unspecified",
      experienceLevel: categories.level || "unspecified",
      categories: [categories.team, categories.department, categories.commitment].filter(value => typeof value === "string"),
      datePosted: dateFromEpoch(row && row.createdAt),
      skills: [],
      description: descriptionText(row && (row.descriptionPlain || row.description)),
      source,
      applicationUrl: row && (row.applyUrl || row.hostedUrl),
      externalId: row && row.id != null ? String(row.id) : null,
      importedAt,
      lastObservedAt: importedAt,
      extensions: { adapter: "lever-postings", site, team: categories.team || null, department: categories.department || null,
        commitment: categories.commitment || null, level: categories.level || null,
        sourceCategories: [categories.team, categories.department, categories.commitment].filter(value => typeof value === "string") }
    };
  });
}
function endpoint(config) {
  if (!config || !SOURCE_TYPES[config.type]) throw new Error("Unsupported public job source type.");
  if (config.type === "greenhouse") {
    const boardToken = requireSlug(config.boardToken, "Greenhouse boardToken");
    return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  }
  const site = requireSlug(config.site, "Lever site");
  const region = config.region === "eu" ? "eu" : "global";
  const host = region === "eu" ? "api.eu.lever.co" : "api.lever.co";
  return `https://${host}/v0/postings/${encodeURIComponent(site)}?mode=json`;
}
function adapt(config, payload, importedAt) {
  if (config && config.type === "greenhouse") return mapGreenhouse(config, payload, importedAt);
  if (config && config.type === "lever") return mapLever(config, payload, importedAt);
  throw new Error("Unsupported public job source type.");
}

module.exports = { SOURCE_TYPES, endpoint, adapt, mapGreenhouse, mapLever, descriptionText };
