(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require("./jobs.js") : root.BetterHackerJobs);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerJobSkillMapping = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (Jobs) {
  "use strict";

  // These explicit phrases are the complete, auditable rules for extracting
  // normalized skills. Each match points back to a source field and phrase.
  const RULES = Object.freeze([
    ["linux-basics", ["linux"]],
    ["network-fundamentals", ["tcp/ip", "tcp ip", "dns", "ports and protocols"]],
    ["networking-fundamentals", ["networking", "network fundamentals"]],
    ["network-analysis", ["network analysis", "network traffic analysis", "wireshark", "packet analysis"]],
    ["siem", ["siem", "splunk", "microsoft sentinel"]],
    ["alert-triage", ["alert triage", "security operations center", "soc analyst", "soc"]],
    ["log-analysis", ["log analysis", "log correlation"]],
    ["evidence-correlation", ["evidence correlation", "indicator correlation"]],
    ["authentication-logs", ["authentication logs", "auth logs"]],
    ["least-privilege", ["least privilege"]],
    ["identity-analysis", ["active directory", "identity analysis", "identity investigation"]],
    ["iam", ["iam", "identity and access management"]],
    ["web-security", ["web security", "application security", "appsec", "owasp"]],
    ["web-request-analysis", ["web request analysis"]],
    ["incident-response", ["incident response", "incident handling"]],
    ["safe-escalation", ["safe escalation", "escalation decisions"]],
    ["vulnerability-management", ["vulnerability management", "vulnerability assessment"]],
    ["threat-detection", ["threat detection", "security monitoring"]],
    ["cloud-security", ["cloud security"]],
    ["aws", ["aws", "amazon web services"]],
    ["azure", ["azure", "microsoft azure"]],
    ["gcp", ["gcp", "google cloud platform"]],
    ["python", ["python"]],
    ["powershell", ["powershell", "power shell"]],
    ["bash", ["bash"]],
    ["sql", ["sql"]],
    ["firewalls", ["firewall", "firewalls"]],
    ["endpoint-security", ["endpoint security", "endpoint detection and response", "edr"]],
    ["ids-ips", ["intrusion detection", "intrusion prevention", "ids/ips"]],
    ["malware-analysis", ["malware analysis"]],
    ["digital-forensics", ["digital forensics", "computer forensics"]],
    ["nmap", ["nmap"]],
    ["windows-event-logs", ["windows event logs", "windows security logs"]],
    ["windows-platform", ["microsoft windows", "windows server", "windows endpoint", "windows operating system", "windows"]]
  ]);

  function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function phrasePattern(phrase) {
    const body = escapeRegExp(phrase).replace(/\\\//g, "\\s*[/]\\s*").replace(/\\ /g, "\\s+");
    return new RegExp(`(?<![a-z0-9])${body}(?![a-z0-9])`, "i");
  }
  const WINDOWS_CONTEXT = /\b(windows(?:\s+(?:event|security|server|endpoint|operating\s+system|os|environment|systems?))?|microsoft\s+windows)\b/i;
  const PHYSICAL_WINDOWS = /\b(?:glass|building|office|house|architectural|physical|pane|window\s+clean(?:ing|er|ers)|window\s+installation)\b/i;

  function mapListing(listing) {
    const sourceFields = [
      ["title", typeof listing?.title === "string" ? listing.title : ""],
      ["categories", Array.isArray(listing?.extensions?.sourceCategories) ? listing.extensions.sourceCategories.filter(value => typeof value === "string").join(" ") : Array.isArray(listing?.categories) ? listing.categories.filter(value => typeof value === "string").join(" ") : ""],
      ["description", typeof listing?.description === "string" ? listing.description : ""]
    ];
    const combined = sourceFields.map(([, value]) => value).join(" ");
    const mappings = [];
    const seen = new Set();
    for (const [id, phrases] of RULES) {
      if (!Object.prototype.hasOwnProperty.call(Jobs.SKILLS, id)) continue;
      let found = null;
      for (const [field, value] of sourceFields) {
        if (!value) continue;
        for (const phrase of phrases) {
          const match = phrasePattern(phrase).exec(value);
          if (!match) continue;
          if (phrase === "soc" && /\bSOC\s*2\b/i.test(value.slice(Math.max(0, match.index - 1), match.index + match[0].length + 3))) continue;
          if (id === "windows-platform" || id === "windows-event-logs") {
            if (!WINDOWS_CONTEXT.test(combined) || PHYSICAL_WINDOWS.test(combined)) continue;
          }
          found = { id, label: Jobs.skillLabel(id), matchedPhrase: match[0], field };
          break;
        }
        if (found) break;
      }
      if (found && !seen.has(id)) { seen.add(id); mappings.push(found); }
    }
    return mappings;
  }

  function attachMappings(listing) {
    const mappings = mapListing(listing);
    return { ...listing, extensions: { ...(listing.extensions || {}), skillMappingVersion: 1, skillMappings: mappings } };
  }

  return { RULES, mapListing, attachMappings };
});
