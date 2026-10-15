"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const Jobs = require("../jobs.js");
const Adapters = require("../jobs-adapters.js");
const Relevance = require("../jobs-relevance.js");

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_SOURCES = 100;
const REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_OUTPUT = path.resolve(__dirname, "../jobs-live.json");

function validateConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config) || !Array.isArray(config.sources)) throw new Error("Source config must be an object with a sources array.");
  if (config.sources.length > MAX_SOURCES) throw new Error(`At most ${MAX_SOURCES} sources may be configured.`);
  const seen = new Set();
  for (const source of config.sources) {
    if (!source || typeof source !== "object" || !["greenhouse", "lever"].includes(source.type)) throw new Error("Each configured source must use a supported public ATS type.");
    if (seen.has(source.id)) throw new Error(`Duplicate source ID: ${String(source.id).slice(0, 100)}.`);
    seen.add(source.id);
    Adapters.endpoint(source);
  }
  return config.sources;
}
function boundedDelay(ms) { return new Promise(resolve => setTimeout(resolve, Math.max(0, ms))); }
async function readJsonResponse(response) {
  if (!response || !response.ok) throw new Error(`Feed returned HTTP ${response ? response.status : "no response"}.`);
  const contentType = response.headers && response.headers.get ? response.headers.get("content-type") || "" : "";
  if (contentType && !/json/i.test(contentType)) throw new Error("Feed response was not JSON.");
  const contentLength = Number(response.headers && response.headers.get && response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) throw new Error("Feed response exceeded the configured size limit.");
  let body;
  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new Error("Feed response exceeded the configured size limit.");
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const joined = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    body = new TextDecoder("utf-8", { fatal: true }).decode(joined);
  } else {
    body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_RESPONSE_BYTES) throw new Error("Feed response exceeded the configured size limit.");
  }
  try { return JSON.parse(body); }
  catch (_) { throw new Error("Feed response contained invalid JSON."); }
}
async function loadFeed(source, fetchImpl) {
  const url = Adapters.endpoint(source);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: "GET", redirect: "error", signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "BetterHacker-PublicJobs/1.0 (+https://github.com/leonapacanis725-web/Better-Hacker)" }
    });
    return await readJsonResponse(response);
  } finally { clearTimeout(timeout); }
}
function expectedApplicationUrl(record, source) {
  const value = Jobs.canonicalApplicationUrl(record && record.applicationUrl);
  if (!value || !record.externalId) return false;
  const url = new URL(value);
  if (source.type === "greenhouse") {
    const board = String(source.boardToken).toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    return ["job-boards.greenhouse.io", "boards.greenhouse.io"].includes(url.hostname) &&
      parts.length === 3 && parts[0].toLowerCase() === board && parts[1] === "jobs" && parts[2] === String(record.externalId);
  }
  const parts = url.pathname.split("/").filter(Boolean);
  return url.hostname === "jobs.lever.co" && parts.length >= 2 && parts.length <= 3 && parts[0].toLowerCase() === String(source.site).toLowerCase() &&
    parts[1] === String(record.externalId) && (parts.length === 2 || parts[2] === "apply");
}
async function buildDataset(config, options = {}) {
  const sources = validateConfig(config);
  const fetchImpl = options.fetch || globalThis.fetch;
  if (sources.length && typeof fetchImpl !== "function") throw new Error("Node.js with built-in fetch is required to contact configured feeds.");
  const importedAt = options.importedAt || new Date().toISOString();
  const records = [];
  const diagnostics = [];
  let relevanceRejectedCount = 0;
  let unsafeUrlRejectedCount = 0;
  let incompleteRejectedCount = 0;
  for (const [index, source] of sources.entries()) {
    try {
      const payload = await loadFeed(source, fetchImpl);
      const mapped = Adapters.adapt(source, payload, importedAt);
      const accepted = [];
      let sourceRelevanceRejected = 0, sourceUnsafeUrlRejected = 0, sourceIncompleteRejected = 0;
      for (const record of mapped) {
        const relevance = Relevance.classify(record);
        if (!relevance.relevant) { relevanceRejectedCount++; sourceRelevanceRejected++; continue; }
        if (!expectedApplicationUrl(record, source)) { unsafeUrlRejectedCount++; sourceUnsafeUrlRejected++; continue; }
        if (!record.title || !record.employer || !record.externalId || !record.source || !record.importedAt) { incompleteRejectedCount++; sourceIncompleteRejected++; continue; }
        record.extensions = { ...record.extensions, relevance: { reason: relevance.reason, matchedSignals: relevance.matchedSignals } };
        accepted.push(record);
      }
      records.push(...accepted);
      diagnostics.push({ sourceId: source.id, status: "ok", recordsReceived: mapped.length, relevanceRejected: sourceRelevanceRejected,
        candidatesAccepted: accepted.length, unsafeUrlRejected: sourceUnsafeUrlRejected, incompleteRejected: sourceIncompleteRejected });
    } catch (error) {
      const message = error && error.name === "AbortError" ? "Feed request timed out." : String(error && error.message || "Feed request failed.").slice(0, 240);
      diagnostics.push({ sourceId: String(source.id || "unknown").slice(0, 100), status: "error", message });
    }
    if (index < sources.length - 1) await boundedDelay(options.delayMs === undefined ? 1000 : options.delayMs);
  }
  const failed = diagnostics.filter(item => item.status === "error");
  if (failed.length) {
    const error = new Error(`${failed.length} configured job feed(s) failed; refusing to replace the last known dataset.`);
    error.diagnostics = diagnostics;
    throw error;
  }
  const report = Jobs.ingestRecords(records, { importedAt });
  const dataset = {
    schemaVersion: 1,
    kind: "live-job-feed",
    generatedAt: importedAt,
    sourceCount: sources.length,
    jobs: report.jobs,
    ...(sources.length ? {} : { note: "No approved employer feed is configured." }),
    duplicateCount: report.duplicates.length,
    rejectedCount: report.rejected.length,
    relevanceRejectedCount,
    unsafeUrlRejectedCount,
    incompleteRejectedCount,
    diagnostics
  };
  return dataset;
}
async function run(options = {}) {
  const configPath = path.resolve(options.configPath || process.env.BETTER_HACKER_JOBS_CONFIG || path.resolve(__dirname, "../jobs-sources.json"));
  const outputPath = path.resolve(options.outputPath || process.env.BETTER_HACKER_JOBS_OUTPUT || DEFAULT_OUTPUT);
  let config = { sources: [] };
  try { config = JSON.parse(await fs.readFile(configPath, "utf8")); }
  catch (error) {
    if (error.code !== "ENOENT") throw new Error("Source configuration file is unreadable or invalid JSON.");
  }
  const dataset = await buildDataset(config, options);
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(dataset, null, 2)}\n`, { mode: 0o644 });
    await fs.rename(temporaryPath, outputPath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
  return dataset;
}

if (require.main === module) {
  run().then(dataset => {
    process.stdout.write(`Wrote ${dataset.jobs.length} validated jobs from ${dataset.sourceCount} configured source(s) to ${DEFAULT_OUTPUT}.\n`);
  }).catch(error => {
    process.stderr.write(`${error.message}\n`);
    if (error.diagnostics) process.stderr.write(`${JSON.stringify(error.diagnostics)}\n`);
    process.exitCode = 1;
  });
}

module.exports = { MAX_RESPONSE_BYTES, MAX_SOURCES, validateConfig, readJsonResponse, loadFeed, expectedApplicationUrl, buildDataset, run };
