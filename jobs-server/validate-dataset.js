"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Jobs = require("../jobs.js");
const SkillMapping = require("../jobs-skill-mapping.js");
const file = path.resolve(process.argv[2] || path.resolve(__dirname, "../jobs-live.json"));

function fail(message) { throw new Error(message); }
function validate(dataset) {
  if (!dataset || dataset.schemaVersion !== 1 || dataset.kind !== "live-job-feed" || !Array.isArray(dataset.jobs)) fail("Invalid live dataset envelope.");
  if (!Number.isFinite(Date.parse(dataset.generatedAt || ""))) fail("Dataset has no valid generation timestamp.");
  const seen = new Set();
  for (const [index, job] of dataset.jobs.entries()) {
    const prefix = `Live job ${index + 1}`;
    if (!job || job.isDemo !== false) fail(`${prefix} is not explicitly marked live.`);
    if (!job.title || !job.employer || !job.externalId || !job.dateImported || !job.lastObservedAt) fail(`${prefix} is missing a required source fact or timestamp.`);
    if (!job.source || !job.source.id || job.source.kind !== "ats-public-feed" || !job.source.name || !Jobs.canonicalApplicationUrl(job.source.url)) fail(`${prefix} has invalid source attribution.`);
    const normalized = Jobs.normalizeJob(job, { importedAt: job.dateImported });
    if (!normalized.ok) fail(`${prefix} failed canonical field validation: ${normalized.errors.join(" ")}`);
    if (!job.extensions || !job.extensions.relevance || !Array.isArray(job.extensions.relevance.matchedSignals) || !job.extensions.relevance.matchedSignals.length) fail(`${prefix} has no relevance evidence.`);
    if (job.extensions.skillMappingVersion !== 1 || !Array.isArray(job.extensions.skillMappings)) fail(`${prefix} has no versioned skill mapping audit.`);
    const expectedMappings = SkillMapping.mapListing(job);
    if (JSON.stringify(job.extensions.skillMappings) !== JSON.stringify(expectedMappings)) fail(`${prefix} has skill mappings that do not match the source fields and current rules.`);
    const app = Jobs.canonicalApplicationUrl(job.applicationUrl);
    if (!app || Jobs.hasUnsafeRedirectParameter(app)) fail(`${prefix} has an invalid or redirect-style application URL.`);
    const url = new URL(app);
    if (url.port) fail(`${prefix} uses a non-standard application URL port.`);
    const parts = url.pathname.split("/").filter(Boolean);
    if (job.extensions.adapter === "greenhouse-job-board") {
      const board = job.extensions.boardToken;
      if (!["job-boards.greenhouse.io", "boards.greenhouse.io"].includes(url.hostname) || typeof board !== "string" || parts.length !== 3 || parts[0].toLowerCase() !== board.toLowerCase() || parts[1] !== "jobs" || parts[2] !== String(job.externalId)) fail(`${prefix} has an unexpected Greenhouse application destination.`);
    } else if (job.extensions.adapter === "lever-postings") {
      const site = job.extensions.site;
      if (url.hostname !== "jobs.lever.co" || typeof site !== "string" || parts.length < 2 || parts.length > 3 || parts[0].toLowerCase() !== site.toLowerCase() || parts[1] !== String(job.externalId) || (parts.length === 3 && parts[2] !== "apply")) fail(`${prefix} has an unexpected Lever application destination.`);
    } else fail(`${prefix} does not use a supported ATS adapter.`);
    const keys = Jobs.duplicateKeys(job);
    if (!keys.length || keys.some(key => seen.has(key))) fail(`${prefix} duplicates another live listing or has no stable source/application identifier.`);
    keys.forEach(key => seen.add(key));
    if (job.description && (typeof job.description !== "string" || job.description.length > 3000 || /<\/?(?:script|style|iframe|img|svg|[a-z][\w:-]*)(?:\s|\/?>)/i.test(job.description))) fail(`${prefix} description is not bounded plain text.`);
  }
  return { count: dataset.jobs.length, sources: dataset.sourceCount };
}

try {
  const dataset = JSON.parse(fs.readFileSync(file, "utf8"));
  const result = validate(dataset);
  process.stdout.write(`Validated ${result.count} live listings from ${result.sources} configured sources.\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
module.exports = { validate };
