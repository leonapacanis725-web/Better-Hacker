"use strict";

// Conservative, explainable discovery filter. It never assigns experience level.
const SIGNALS = Object.freeze([
  ["cybersecurity", /\bcyber\s*security\b|\bcybersecurity\b/i],
  ["information-security", /\binformation\s+security\b|\binfosec\b/i],
  ["security-operations", /\bsecurity\s+operations\b|\bsoc\b/i],
  ["security-role", /\bsecurity\b/i],
  ["incident-response", /\bincident\s+response\b|\bcsirt\b|\bforensics?\b/i],
  ["threat-detection", /\bthreat\b|\bdetection\b|\bthreat\s+hunting\b/i],
  ["vulnerability", /\bvulnerabilit(?:y|ies)\b/i],
  ["identity-access", /\biam\b|\bidentity\s+(?:and|&)\s+access\b/i],
  ["application-security", /\bapp(?:lication)?\s+sec(?:urity)?\b/i],
  ["cloud-security", /\bcloud\s+security\b/i],
  ["network-security", /\bnetwork\s+security\b/i],
  ["security-compliance", /\bgrc\b|\bsecurity\s+compliance\b|\binformation\s+security\s+compliance\b/i],
  ["it-support-pathway", /\bhelp\s*desk\b|\bit\s+support\b|\btechnical\s+support\b|\bit\s+operations\b/i],
  ["security-internship", /\bsecurity\s+(?:intern|internship|apprentice(?:ship)?)\b|\bcyber\s*(?:security)?\s+(?:intern|internship|apprentice(?:ship)?)\b/i]
]);
const GENERIC_ROLE = /\b(analyst|engineer|specialist|administrator|operations|support|researcher|intern|internship|apprentice|apprenticeship|technician)\b/i;
const PHYSICAL_ONLY = /\b(physical security|security guard|loss prevention|safety officer|campus safety)\b/i;
const CLEARLY_UNRELATED_FAMILY = /\b(sales|account executive|product manager|customer success|finance|accounting|recruit(?:er|ing)?|marketing|legal|equity administrator)\b/i;
const SPECIFIC_SECURITY_TASK = /\b(security operations|security incident|security alert|incident response|threat hunting|threat detection|siem|endpoint security|cybersecurity|cyber security|information security|vulnerability (?:management|scanning)|security research|security engineering)\b/i;

function fields(record) {
  const categories = Array.isArray(record && record.categories) ? record.categories : [];
  return {
    title: typeof (record && record.title) === "string" ? record.title : "",
    categories: categories.map(item => typeof item === "string" ? item : item && (item.name || item.label) || "").join(" "),
    description: typeof (record && record.description) === "string" ? record.description : ""
  };
}
function classify(record) {
  const text = fields(record);
  const titleHits = SIGNALS.filter(([, pattern]) => pattern.test(text.title)).map(([name]) => name);
  const categoryHits = SIGNALS.filter(([, pattern]) => pattern.test(text.categories)).map(([name]) => name);
  const titleExplicit = titleHits.some(hit => hit !== "security-role") || (titleHits.includes("security-role") && GENERIC_ROLE.test(text.title));
  const categoryExplicit = categoryHits.some(hit => hit !== "security-role");
  const pathwayTitle = titleHits.includes("it-support-pathway");
  // Description-only inclusion is restricted to recognizable support roles and
  // specific operational duties; employer mission boilerplate is insufficient.
  const descriptionConfirmedSupport = /\b(support engineer|support specialist|technical support)\b/i.test(text.title) && SPECIFIC_SECURITY_TASK.test(text.description);
  const matchedSignals = [...new Set([...titleHits, ...(categoryExplicit ? categoryHits : []), ...(descriptionConfirmedSupport ? ["description-confirmed-security-support"] : [])])];
  const physicalOnly = PHYSICAL_ONLY.test(text.title) && !titleExplicit;
  const unrelatedFamily = CLEARLY_UNRELATED_FAMILY.test(text.title);
  const relevant = !physicalOnly && !unrelatedFamily && (titleExplicit || (pathwayTitle && titleHits.includes("it-support-pathway")) || (categoryExplicit && GENERIC_ROLE.test(text.title)) || descriptionConfirmedSupport);
  return {
    relevant,
    reason: relevant ? (titleExplicit ? "Matched source title." : categoryExplicit ? "Matched source category and technical role title." : pathwayTitle ? "Matched IT support pathway title." : "Source description confirms security related support duties.") : "No approved cybersecurity or IT pathway signal in source title, category, or qualifying description.",
    matchedSignals
  };
}

module.exports = { SIGNALS, classify };
