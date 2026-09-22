(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerChallenges = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const data = [
    ["daily-least-privilege","Access with Care","Cybersecurity Fundamentals","A teammate needs one report but requests administrator access. What is safest?",["Grant only report access","Grant administrator access","Share your password"],0,"Use least privilege: provide only the access required for the task.","Compare the task with the amount of access requested."],
    ["daily-dns","Name Resolution","Networking","A training site works by IP but not by name. Which service should be checked first?",["DNS","Bluetooth","Disk encryption"],0,"DNS resolves names to IP addresses.","Which service translates names into addresses?"],
    ["daily-linux-permissions","Safer Script Permissions","Linux","A service script is writable by every user. What should happen next?",["Review ownership and reduce permissions","Make all files writable","Disable logs"],0,"Restrict ownership and permissions to what the service requires.","Look for the choice that reduces unnecessary access."],
    ["daily-web-input","Defensive Database Input","Web Security","How should a site safely place submitted values into SQL queries?",["Parameterized queries","Hidden buttons","Longer URLs"],0,"Parameterized queries separate values from SQL instructions.","The best control changes query construction, not appearance."],
    ["daily-hash","Integrity Check","Cryptography","What should you compare to check whether a download changed?",["A trusted published hash","The filename","The icon color"],0,"A matching trusted hash supports an integrity check.","Think about a fingerprint of file contents."],
    ["daily-ad-groups","Role Change Review","Active Directory","An employee changes departments. What should an administrator review?",["Group memberships and access","Screen brightness","Browser history only"],0,"Review and remove access no longer needed for the new role.","Permissions often follow group membership."],
    ["daily-siem","Correlate the Alert","SOC & SIEM","Many failed logins are followed by a success. What is the best next step?",["Correlate authentication and account logs","Erase the logs","Ignore the success"],0,"Related logs and context help validate possible account compromise.","Preserve evidence and gather context."],
    ["daily-scope","Permission Before Testing","Security Testing","Before scanning a system, what is required?",["Explicit authorization and scope","A quiet time of day","A different username"],0,"Testing requires explicit permission and an agreed scope.","Technical caution cannot replace permission."],
    ["daily-windows-log","Windows Log Clue","Windows Security Logs","A privileged group change occurs from an unknown workstation at 3 AM. What should happen?",["Investigate and verify the change","Delete the event","Assume it is normal"],0,"Unexpected privilege changes should be verified using related account and device evidence.","Consider time, device, and privilege together."],
    ["daily-phishing","Suspicious Message","Phishing","An urgent email uses a lookalike domain and ZIP attachment. What is safest?",["Report it through the approved process","Open the attachment","Reply with a password"],0,"Reporting preserves the message for safe analysis and protects others.","Do not interact with suspicious content."],
    ["daily-malware","Contain First","Malware Analysis Concepts","A workstation contacts known malicious infrastructure. What is the safest response?",["Contain it using the incident plan","Delete every backup","Keep it connected"],0,"Approved containment limits harm while supporting investigation.","Choose the action that limits further communication."],
    ["daily-mfa","Stronger Authentication","Authentication","Which control reduces risk from a stolen password?",["Multi-factor authentication","Password sharing","Disabling login logs"],0,"MFA requires another factor beyond the password.","Look for a control that adds independent proof."],
    ["daily-bruteforce","Login Pattern","Brute-force Detection","Eighty failed logins occur in four minutes from one source. What does this suggest?",["Brute-force activity","A successful backup","Normal browsing"],0,"Rapid repeated password guesses are a common brute-force signal.","Focus on frequency and repeated failures."],
    ["daily-incident","Investigate Before Concluding","Incident Investigation","An alert has limited context. What should an analyst do next?",["Validate it with related evidence","Publicly accuse a user","Destroy the source logs"],0,"Validation with related evidence supports a proportionate response.","Preserve evidence and avoid assumptions."]
  ];
  const CHALLENGES = Object.freeze(data.map(item => Object.freeze({ id:item[0], title:item[1], topic:item[2], scenario:item[3], choices:Object.freeze(item[4]), correctIndex:item[5], explanation:item[6], hint:item[7], xp:50 })));
  function challengeForDate(dateKey) {
    const digits = String(dateKey).replace(/\D/g, "");
    let hash = 0; for (const char of digits) hash = (hash * 31 + Number(char)) >>> 0;
    return CHALLENGES[hash % CHALLENGES.length];
  }
  function isCorrect(challenge, value) { return Number(value) === challenge.correctIndex; }
  return { CHALLENGES, challengeForDate, isCorrect };
});
