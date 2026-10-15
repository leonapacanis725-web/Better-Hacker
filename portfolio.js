(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require('./learner-state.js') : root.BetterHackerState,
    typeof module === "object" && module.exports ? require('./challenges.js') : root.BetterHackerChallenges,
    typeof module === "object" && module.exports ? require('./attack-box.js') : root.BetterHackerAttackBox);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerPortfolio = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (DailyState, DailyLibrary, AttackBox) {
  "use strict";

  const STORAGE_KEY = "betterHackerPortfolioProjects";
  const VERSION = 1;
  const LEARNER_FIELDS = Object.freeze(["commands", "investigation", "findings", "learned", "challenges", "solutions"]);
  const ACTIVITIES = Object.freeze([
    { id:"lesson-networking", title:"Networking Fundamentals", type:"Networking", objective:"Understand how devices communicate and how defenders use network context.", skills:["Networking","TCP/IP fundamentals","Ports and protocols","Network analysis"], tools:["ip addr","ip route","ss"], key:"betterHackerNetworkingComplete", href:"#networking-lesson" },
    { id:"lesson-linux", title:"Linux Fundamentals", type:"Linux", objective:"Inspect files, permissions, processes, and logs safely from the command line.", skills:["Command-line navigation","File and permission analysis","Evidence preservation"], tools:["Linux","cat","grep","find"], key:"betterHackerLinuxComplete", href:"#linux-lesson" },
    { id:"lesson-web-security", title:"Web Security Fundamentals", type:"Web Security", objective:"Recognize common web risks and choose defensive controls.", skills:["Web security","Web request analysis","Input validation","Defensive design"], tools:["Browser developer tools"], key:"betterHackerWebSecurityComplete", href:"#web-security-lesson" },
    { id:"lesson-cryptography", title:"Cryptography Fundamentals", type:"Cryptography", objective:"Choose appropriate encryption, hashing, and signature concepts.", skills:["Data protection choices","Hashing concepts","Key management concepts"], tools:[], key:"betterHackerCryptographyComplete", href:"#cryptography-lesson" },
    { id:"lesson-active-directory", title:"Active Directory Fundamentals", type:"Identity & Access", objective:"Analyze users, groups, permissions, and safer enterprise access.", skills:["Identity analysis","IAM","Least privilege","Permission review"], tools:["Active Directory"], key:"betterHackerActiveDirectoryComplete", href:"#active-directory-lesson" },
    { id:"lesson-soc-siem", title:"SOC & SIEM Fundamentals", type:"SOC / SIEM", objective:"Triage alerts and correlate useful log evidence.", skills:["SOC","Alert triage","Threat detection","Log analysis","Evidence correlation"], tools:["SIEM","Authentication logs"], key:"betterHackerSocComplete", href:"#soc-siem-lesson" },
    { id:"lesson-incident-response", title:"Incident Response Fundamentals", type:"Incident Response", objective:"Follow the incident-response lifecycle, preserve evidence, and choose proportionate authorized actions.", skills:["Incident response","Safe escalation","Evidence preservation"], tools:[], key:"betterHackerIncidentResponseLessonComplete", href:"#incident-response-lesson" },
    { id:"lesson-security-testing", title:"Authorized Security Testing", type:"Security Testing", objective:"Plan safe testing within explicit authorization and scope.", skills:["Scope review","Finding validation","Security reporting"], tools:["Vulnerability scanner concepts"], key:"betterHackerSecurityTestingComplete", href:"#security-testing-lesson" },
    { id:"lab-linux-file", title:"Linux File Detective", type:"Guided Lab · Linux", objective:"Use simulated file evidence to identify the relevant file safely.", skills:["File inspection","Command selection","Evidence analysis"], tools:["Linux","ls","cat"], labIndex:0, href:"#lab-linux-file" },
    { id:"lab-network-service", title:"Network Service Triage", type:"Guided Lab · Networking", objective:"Interpret simulated listening-service evidence and choose a safe next step.", skills:["Service triage","Port analysis","Network investigation"], tools:["ss"], labIndex:1, href:"#lab-network-service" },
    { id:"lab-data-protection", title:"Choose the Right Data Protection", type:"Guided Lab · Cryptography", objective:"Match a data-protection requirement to the appropriate security control.", skills:["Control selection","Encryption concepts","Requirements analysis"], tools:[], labIndex:2, href:"#lab-data-protection" },
    { id:"lab-database-query", title:"Defend a Database Query", type:"Guided Lab · Web Security", objective:"Choose a defensive approach for handling untrusted database input.", skills:["SQL injection prevention","Input handling","Defensive coding"], tools:["Parameterized queries"], labIndex:3, href:"#lab-database-query" },
    { id:"investigation-soc", title:"SOC Alert Investigation", type:"Defensive Investigation · SOC / SIEM", objective:"Correlate authentication evidence and select a proportionate response.", skills:["Alert triage","Threat detection","Log correlation","Escalation decisions"], tools:["SIEM","Authentication logs"], key:"betterHackerSocInvestigationComplete", href:"#investigation-soc" },
    { id:"investigation-network", title:"Network Traffic Investigation", type:"Defensive Investigation · Networking", objective:"Analyze simulated traffic patterns for unusual services and connections.", skills:["Traffic investigation","TCP/IP analysis","Anomaly recognition"], tools:["Network logs","Packet analysis concepts"], key:"betterHackerNetworkInvestigationComplete", href:"#investigation-network" },
    { id:"investigation-phishing", title:"Phishing Email Investigation", type:"Defensive Investigation · Email Security", objective:"Assess sender, link, attachment, and message clues together.", skills:["Email analysis","Indicator correlation","Safe escalation"], tools:["Email headers"], key:"betterHackerPhishingInvestigationComplete", href:"#investigation-phishing" },
    { id:"investigation-windows", title:"Windows / Active Directory Investigation", type:"Defensive Investigation · Identity", objective:"Review a simulated privilege change using time, account, and workstation context.", skills:["Privilege analysis","Identity investigation","Timeline review"], tools:["Windows","Windows event logs","Active Directory"], key:"betterHackerWindowsInvestigationComplete", href:"#investigation-windows" },
    { id:"investigation-malware", title:"Malware Investigation", type:"Defensive Investigation · Malware", objective:"Identify evidence of persistence or suspicious communication.", skills:["Malware analysis","Indicator analysis","Persistence recognition","Evidence prioritization"], tools:["Endpoint telemetry"], key:"betterHackerMalwareInvestigationComplete", href:"#investigation-malware" },
    { id:"investigation-brute-force", title:"Brute Force Investigation", type:"Defensive Investigation · Authentication", objective:"Analyze repeated authentication failures and their timing.", skills:["Authentication analysis","Pattern recognition","Defensive response"], tools:["Authentication logs"], key:"betterHackerBruteForceInvestigationComplete", href:"#investigation-brute-force" },
    { id:"investigation-web-attack", title:"Web Attack Investigation", type:"Defensive Investigation · Web Security", objective:"Interpret simulated malicious input and identify the affected interpreter.", skills:["Web log analysis","Injection recognition","Defensive investigation"], tools:["Web server logs"], key:"betterHackerWebAttackInvestigationComplete", href:"#investigation-web-attack" },
    { id:"practice-network-analysis", title:"Network Analysis Practice", type:"Hands-On Practice · Networking", objective:"Interpret simulated network traffic and support a cautious conclusion with evidence.", skills:["Network analysis","Networking","TCP/IP fundamentals"], tools:["DNS","Packet analysis concepts"], key:"betterHackerPracticeNetworkAnalysisComplete", href:"#practice-network-analysis" },
    { id:"practice-linux-challenges", title:"Linux Challenges", type:"Hands-On Practice · Linux", objective:"Inspect supplied Linux evidence and choose safe, read-only next steps.", skills:["Linux","Linux basics","Command-line navigation"], tools:["Bash"], key:"betterHackerPracticeLinuxChallengesComplete", href:"#practice-linux-challenges" },
    { id:"practice-defensive-security", title:"Defensive Security Practice", type:"Hands-On Practice · SOC", objective:"Correlate simulated events into a cautious incident timeline.", skills:["SOC","Alert triage","Log analysis","Incident response"], tools:["Authentication logs"], key:"betterHackerPracticeDefensiveSecurityComplete", href:"#practice-defensive-security" },
    { id:"practice-reconnaissance", title:"Reconnaissance Practice", type:"Hands-On Practice · Security", objective:"Review supplied fictional records and identify exposure within the authorized scope.", skills:["Exposure review","Authorized reconnaissance"], tools:[], key:"betterHackerPracticeReconnaissanceComplete", href:"#practice-reconnaissance" },
    { id:"practice-python-log-review", title:"Python Log Review", type:"Hands-On Practice · Python", objective:"Read a simulated Python filter and interpret authentication log results without executing code.", skills:["Python","Log analysis","Evidence correlation"], tools:["Python","CSV log parsing"], key:"betterHackerPracticePythonLogReviewComplete", href:"#practice-python-log-review" },
    { id:"practice-powershell-event-review", title:"PowerShell Event Review", type:"Hands-On Practice · Windows", objective:"Interpret a supplied, read-only PowerShell event query and correlate its fictional results.", skills:["PowerShell","Windows event logs","Alert triage"], tools:["PowerShell","Get-WinEvent"], key:"betterHackerPracticePowerShellEventReviewComplete", href:"#practice-powershell-event-review" },
    { id:"practice-cloud-responsibility-review", title:"Cloud Shared Responsibility", type:"Hands-On Practice · Cloud Security", objective:"Review customer workload settings and identity permissions using the shared responsibility model.", skills:["Cloud security","IAM","Least privilege"], tools:["Shared responsibility model"], key:"betterHackerPracticeCloudResponsibilityComplete", href:"#practice-cloud-responsibility-review" },
    { id:"practice-aws-iam-review", title:"AWS IAM Policy Review", type:"Hands-On Practice · AWS", objective:"Review a fictional AWS policy request for least privilege and resource scope.", skills:["AWS","IAM","Least privilege"], tools:["AWS IAM policy review"], key:"betterHackerPracticeAwsIamReviewComplete", href:"#practice-aws-iam-review" },
    { id:"practice-azure-signin-review", title:"Azure Sign-in Review", type:"Hands-On Practice · Azure", objective:"Interpret supplied Azure identity events and state what the evidence does and does not establish.", skills:["Azure","IAM","Alert triage"], tools:["Microsoft Entra sign-in logs"], key:"betterHackerPracticeAzureSigninReviewComplete", href:"#practice-azure-signin-review" },
    { id:"practice-gcp-audit-review", title:"Google Cloud Audit Review", type:"Hands-On Practice · GCP", objective:"Review fictional Google Cloud audit evidence and choose a validated follow-up.", skills:["GCP","Cloud security","IAM"], tools:["Google Cloud Audit Logs"], key:"betterHackerPracticeGcpAuditReviewComplete", href:"#practice-gcp-audit-review" },
    { id:"practice-edr-process-review", title:"EDR Process-chain Triage", type:"Hands-On Practice · Endpoint Security", objective:"Triage simulated EDR process and network telemetry without touching an endpoint.", skills:["Endpoint Detection and Response","Threat detection","Incident response"], tools:["EDR process telemetry"], key:"betterHackerPracticeEdrProcessReviewComplete", href:"#practice-edr-process-review" },
    { id:"practice-ids-ips-review", title:"IDS and IPS Alert Review", type:"Hands-On Practice · Network Security", objective:"Distinguish detection from prevention using a supplied network security event.", skills:["Intrusion detection","Network analysis","Threat detection"], tools:["Intrusion prevention system"], key:"betterHackerPracticeIdsIpsReviewComplete", href:"#practice-ids-ips-review" },
    { id:"practice-firewall-rule-review", title:"Firewall Rule Review", type:"Hands-On Practice · Network Security", objective:"Compare a fictional firewall rule with its stated purpose and recommend a scoped change.", skills:["Firewalls","Network fundamentals","Least privilege"], tools:["Firewall rule review"], key:"betterHackerPracticeFirewallRuleReviewComplete", href:"#practice-firewall-rule-review" },
    { id:"practice-vulnerability-queue-review", title:"Vulnerability Queue Prioritization", type:"Hands-On Practice · Vulnerability Management", objective:"Prioritize a simulated remediation queue with severity, exposure, asset context, and uncertainty.", skills:["Vulnerability management","Risk prioritization","Evidence correlation"], tools:["Asset inventory","Patch management concepts"], key:"betterHackerPracticeVulnerabilityQueueReviewComplete", href:"#practice-vulnerability-queue-review" },
    { id:"practice-forensics-evidence-review", title:"Digital Forensics Evidence Handling", type:"Hands-On Practice · Digital Forensics", objective:"Choose authorization-first, evidence-preserving handling for a fictional incident.", skills:["Digital forensics","Evidence preservation","Incident response"], tools:["Forensic image","Cryptographic hash","Chain of custody"], key:"betterHackerPracticeForensicsEvidenceReviewComplete", href:"#practice-forensics-evidence-review" }
  ].concat(DailyLibrary.CHALLENGES.filter(activity => activity.portfolio).map(activity => ({
    id: "practice-" + activity.id, dailyId: activity.id, title: activity.title,
    type: "Educational Practice · " + activity.track,
    objective: "Educational practice using supplied fictional evidence (not professional experience): " + activity.task,
    skills: [activity.track, "Evidence interpretation", "Defensive reasoning"], tools: ["Simulated evidence"],
    href: "#library-activity-" + activity.id
  }))).concat((AttackBox ? AttackBox.CHALLENGES : []).map(challenge => ({
    id:"attackbox-"+challenge.id, attackBoxId:challenge.id, title:challenge.title,
    type:"Simulated Practice · "+challenge.track, objective:"Safe simulated exercise: "+challenge.objective,
    skills:[challenge.track,"Command-line practice","Evidence analysis"], tools:["Better Hacker simulated terminal"], href:"#attack-box"
  }))));

  function clean(value, max) { return typeof value === "string" ? value.trim().slice(0, max || 5000) : ""; }
  function activityById(id) { return ACTIVITIES.find(function (item) { return item.id === id; }) || null; }
  function isComplete(activity, storage) {
    if (!activity) return false;
    if (activity.dailyId) return DailyState.readDailyState(storage).records.some(record => record.practice && record.challengeId === activity.dailyId) || DailyState.readPracticeLibraryState(storage).completed.some(record => record.activityId === activity.dailyId);
    if (activity.attackBoxId) return AttackBox && AttackBox.read(storage).completed.includes(activity.attackBoxId);
    if (Number.isInteger(activity.labIndex)) return Math.max(0, Math.min(4, parseInt(storage.getItem("betterHackerCompletedLabs"), 10) || 0)) > activity.labIndex;
    return storage.getItem(activity.key) === "true";
  }
  function emptyState() { return { version:VERSION, projects:[] }; }
  function normalizeProject(value) {
    const activity = value && activityById(value.activityId);
    if (!activity) return null;
    const project = { id:activity.id, activityId:activity.id, title:clean(value.title, 120) || activity.title, createdAt:clean(value.createdAt, 30), updatedAt:clean(value.updatedAt, 30), completedAt:clean(value.completedAt, 10) };
    LEARNER_FIELDS.forEach(function (field) { project[field] = clean(value[field]); });
    return project;
  }
  function validateState(value) {
    if (!value || value.version !== VERSION || !Array.isArray(value.projects)) return emptyState();
    const seen = new Set(), projects = [];
    value.projects.forEach(function (raw) { const project=normalizeProject(raw); if (project && !seen.has(project.activityId)) { seen.add(project.activityId); projects.push(project); } });
    return { version:VERSION, projects:projects.slice(0, 100) };
  }
  function read(storage) { try { return validateState(JSON.parse(storage.getItem(STORAGE_KEY))); } catch (_) { return emptyState(); } }
  function save(storage, state) { const valid=validateState(state); storage.setItem(STORAGE_KEY, JSON.stringify(valid)); return valid; }
  function practiceCompletionDate(activity, storage) {
    const dates = DailyState.readDailyState(storage).records.filter(record => record.practice && record.challengeId === activity.dailyId).map(record => record.date)
      .concat(DailyState.readPracticeLibraryState(storage).completed.filter(record => record.activityId === activity.dailyId).map(record => record.date));
    return dates.sort()[0] || "";
  }
  function createProject(storage, activityId, now) {
    const activity=activityById(activityId), state=read(storage);
    if (!activity || !isComplete(activity, storage)) return { state:state, project:null, reason:"Complete this activity before adding it to your portfolio." };
    const existing=state.projects.find(function (item) { return item.activityId === activityId; });
    if (existing) return { state:state, project:existing, reason:"This activity is already in your portfolio." };
    const stamp=(now || new Date()).toISOString();
    const project=normalizeProject({ activityId:activityId, title:activity.title, createdAt:stamp, updatedAt:stamp, completedAt:activity.dailyId ? practiceCompletionDate(activity, storage) : "" });
    state.projects.push(project); save(storage,state); return { state:state, project:project, reason:"Project added. Add your own evidence when you are ready." };
  }
  function updateProject(storage, activityId, changes, now) {
    const state=read(storage), index=state.projects.findIndex(function (item) { return item.activityId === activityId; });
    if (index < 0) return null;
    const next={ ...state.projects[index], updatedAt:(now || new Date()).toISOString() };
    ["title","completedAt"].concat(LEARNER_FIELDS).forEach(function(field){ if (Object.prototype.hasOwnProperty.call(changes,field)) next[field]=clean(changes[field], field === "title" ? 120 : 5000); });
    state.projects[index]=normalizeProject(next); save(storage,state); return state.projects[index];
  }
  function removeProject(storage, activityId) { const state=read(storage); state.projects=state.projects.filter(function(item){return item.activityId!==activityId;}); save(storage,state); }
  function readiness(project) {
    const missing=[];
    if (!clean(project.investigation)) missing.push("work or investigation performed");
    if (!clean(project.findings)) missing.push("key findings");
    if (!clean(project.learned)) missing.push("what you learned");
    const completed=3-missing.length;
    return { status:completed === 3 ? "Portfolio Ready" : completed >= 2 ? "Almost Ready" : "Draft", missing:missing };
  }
  // Standalone exports render learner text literally rather than as HTML,
  // links or injected Markdown headings. This does not change stored evidence.
  function markdownText(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/[\\`*_#\[\]]/g, "\\$&");
  }
  function markdown(project) {
    const activity=activityById(project.activityId); if (!activity) return "";
    const sections=[["Project Objective",markdownText(activity.objective)],["Skills Practiced",activity.skills.map(function(x){return "- "+markdownText(x);}).join("\n")],["Tools / Concepts",activity.tools.length ? activity.tools.map(function(x){return "- "+markdownText(x);}).join("\n") : ""],["Commands Used",markdownText(project.commands)],["Investigation / Work Performed",markdownText(project.investigation)],["Findings",markdownText(project.findings)],["Challenges",markdownText(project.challenges)],["Solutions",markdownText(project.solutions)],["What I Learned",markdownText(project.learned)],["Related Better Hacker Activity",markdownText(activity.title)+" — "+markdownText(activity.type)],["Completion Date",markdownText(project.completedAt)]];
    return "# "+markdownText(project.title).replace(/[\r\n]+/g, " ")+"\n\n"+
      "> Educational work completed through Better Hacker. This record documents learning and practice, not professional employment experience or independent certification.\n\n"+
      sections.filter(function(item){return clean(item[1]);}).map(function(item){return "## "+item[0]+"\n\n"+item[1];}).join("\n\n")+"\n";
  }
  function repositoryName(project) {
    return (project.title || "cybersecurity-project").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80) || "cybersecurity-project";
  }
  function repositoryDescription(project) {
    const activity=activityById(project.activityId);
    return ("Better Hacker educational project: " + (activity ? activity.title : project.title) + ". " + (activity ? activity.objective : "Document a cybersecurity learning activity.")).replace(/\s+/g," ").slice(0,350);
  }
  function findingsMarkdown(project) {
    const activity=activityById(project.activityId); if(!activity)return "";
    const items=["# Findings — "+markdownText(project.title).replace(/[\r\n]+/g," "),
      "> Educational practice record. Findings are learner-authored observations and are not independently verified.",
      "## Objective\n\n"+markdownText(activity.objective),
      "## Methodology\n\n"+(clean(project.investigation)?markdownText(project.investigation):"Add the steps you personally completed. Keep the scope authorized and describe how you reviewed the supplied evidence."),
      "## Tools and Commands\n\n"+(clean(project.commands)?markdownText(project.commands):activity.tools.length?activity.tools.map(item=>"- "+markdownText(item)).join("\n"):"No specific tool was required; describe the concepts or controls you reviewed."),
      "## Findings\n\n"+(clean(project.findings)?markdownText(project.findings):"Add only the observations you personally confirmed from the exercise evidence."),
      "## Lessons Learned\n\n"+(clean(project.learned)?markdownText(project.learned):"Describe what you learned and any uncertainty that remains."),
      "## Recommendations\n\n"+(clean(project.solutions)?markdownText(project.solutions):"When relevant, record a proportionate recommendation supported by the evidence and follow the authorized owner’s procedures."),
      "## Educational Use\n\nThis is a simulated educational exercise completed through Better Hacker. It is not professional work experience, certification, or a claim that a real system was tested. Use only authorized, fictional evidence." ];
    return items.join("\n\n")+"\n";
  }
  function githubPackage(project) {
    const activity=activityById(project.activityId); if(!activity)return null;
    const files={"README.md":markdown(project),"findings.md":findingsMarkdown(project)};
    const challenge=activity.dailyId && DailyLibrary.activityById ? DailyLibrary.activityById(activity.dailyId) : null;
    if(challenge && clean(challenge.evidence)) files["sample-evidence.md"]="# Supplied Sample Evidence\n\n"+markdownText(challenge.evidence)+"\n\nThis fictional evidence was supplied by Better Hacker for educational practice. Review it as exercise data; do not treat it as a real organization record.\n";
    const attackChallenge=activity.attackBoxId && AttackBox ? AttackBox.CHALLENGES.find(item=>item.id===activity.attackBoxId) : null;
    if(attackChallenge && Object.keys(attackChallenge.files).length)files["sample-evidence.md"]="# Supplied Sample Evidence\n\n"+Object.keys(attackChallenge.files).map(function(path){return "### `"+path+"`\n\n```text\n"+attackChallenge.files[path]+"\n```";}).join("\n\n")+"\n\nThis fictional evidence was supplied by Better Hacker for educational practice. It is not a record from a real system or organization.\n";
    return {repositoryName:repositoryName(project),description:repositoryDescription(project),files:files};
  }
  function stats(storage) { const projects=read(storage).projects; return { total:projects.length, ready:projects.filter(function(p){return readiness(p).status === "Portfolio Ready";}).length, drafts:projects.filter(function(p){return readiness(p).status !== "Portfolio Ready";}).length }; }
  function suggestion(storage) { return ACTIVITIES.find(function(a){return isComplete(a,storage) && !read(storage).projects.some(function(p){return p.activityId===a.id;});}) || null; }
  return { STORAGE_KEY, VERSION, ACTIVITIES, LEARNER_FIELDS, activityById, isComplete, emptyState, validateState, read, save, createProject, updateProject, removeProject, readiness, markdown, repositoryName, repositoryDescription, findingsMarkdown, githubPackage, stats, suggestion };
});

