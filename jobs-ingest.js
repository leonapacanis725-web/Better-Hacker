(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./jobs.js") : root.BetterHackerJobs);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobsIngest = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs) {
  "use strict";
  function parseCsv(text) {
    if (typeof text !== "string") return { rows: [], errors: ["CSV input must be text."] };
    if (text.length > 5 * 1024 * 1024) return { rows: [], errors: ["CSV input exceeded the 5 MB import limit."] };
    const matrix = [], errors = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') {
        if (field) errors.push(`Unexpected quote near character ${i + 1}.`);
        quoted = true;
      } else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n" || char === "\r") {
        if (char === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some(value => value.trim())) matrix.push(row);
        row = [];
      } else field += char;
    }
    if (quoted) errors.push("CSV ends inside a quoted field.");
    row.push(field);
    if (row.some(value => value.trim())) matrix.push(row);
    if (!matrix.length) return { rows: [], errors: errors.concat("CSV has no header row.") };
    const headers = matrix.shift().map(value => value.trim().toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
    if (headers.some(value => !value)) errors.push("Every CSV column needs a header.");
    const duplicateHeaders = headers.filter((value, index) => headers.indexOf(value) !== index);
    if (duplicateHeaders.length) errors.push(`Duplicate CSV header: ${duplicateHeaders[0]}.`);
    const rows = matrix.map((values, index) => {
      if (values.length !== headers.length) {
        errors.push(`Row ${index + 2} has ${values.length} values for ${headers.length} headers; it was retained as an error.`);
        return { rowNumber: index + 2, record: null, error: "Column count does not match the header." };
      }
      return { rowNumber: index + 2, record: Object.fromEntries(headers.map((header, column) => [header, values[column].trim()])) };
    });
    return { rows, errors };
  }
  function csvRecordToJob(row) {
    const result = { ...row };
    if (result.salary_min || result.salary_max || result.salary_currency || result.salary_period) {
      result.salary_range = { min: result.salary_min || null, max: result.salary_max || null, currency: result.salary_currency || null, period: result.salary_period || null };
    }
    if (result.categories) result.categories = result.categories.split(/[;,]/).map(item => item.trim()).filter(Boolean);
    if (result.skills || result.technologies) result.skills = (result.skills || result.technologies).split(/[;,]/).map(item => item.trim()).filter(Boolean);
    if (result.location) result.location = result.location;
    if (result.source_name) result.source = result.source_name;
    if (result.application_url) result.application_url = result.application_url;
    if (result.external_id) result.external_id = result.external_id;
    if (result.date_posted) result.date_posted = result.date_posted;
    if (result.expires_at) result.expires_at = result.expires_at;
    return result;
  }
  function ingestJson(input, options) {
    let records = input;
    if (typeof input === "string") {
      try { records = JSON.parse(input); }
      catch (error) { return { jobs: [], duplicates: [], rejected: [{ index: null, errors: [`Invalid JSON: ${error.message}`], warnings: [] }], warnings: [] }; }
    }
    if (isObject(records) && Array.isArray(records.jobs)) records = records.jobs;
    return Jobs.ingestRecords(records, options);
  }
  function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
  function ingestCsv(input, options) {
    const parsed = parseCsv(input);
    const validRows = parsed.rows.filter(row => row.record);
    const result = Jobs.ingestRecords(validRows.map(row => csvRecordToJob(row.record)), options);
    parsed.rows.filter(row => row.error).forEach(row => result.rejected.push({ index: row.rowNumber - 2, rowNumber: row.rowNumber, errors: [row.error], warnings: [] }));
    parsed.errors.forEach(message => result.warnings.push({ index: null, message }));
    return result;
  }
  return { parseCsv, ingestJson, ingestCsv };
});
