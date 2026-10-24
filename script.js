Warning: truncated output (original token count: 40262)
Total output lines: 3216

// Better Hacker Interactive Features

document.addEventListener("DOMContentLoaded", function () {
  const localStorage = BetterHackerStorage.create(function () { return globalThis.localStorage; }, function (message) {
    const status = document.querySelector("#storage-status");
    if (status) { status.textContent = message; status.hidden = !message; }
  });
  globalThis.BetterHackerSessionStorage = localStorage;


  // The fixed navigation wraps on narrow screens; keep anchor destinations visible.
  const navigationBar = document.querySelector(".navbar");
  if (navigationBar && document.documentElement) {
    const updateNavigationOffset = function () {
      document.documentElement.style.setProperty("--navigation-offset", Math.ceil(navigationBar.getBoundingClientRect().height) + 16 + "px");
    };
    updateNavigationOffset();
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(updateNavigationOffset).observe(navigationBar);
    else window.addEventListener("resize", updateNavigationOffset);
  }

  const LESSON_PROGRESS = Object.freeze([
    { key: "betterHackerFundamentalsComplete", target: "#fundamentals-lesson", name: "Cybersecurity Fundamentals", check: "#fundamentals-check-result", next: "#networking-lesson", nextName: "Networking" },
    { key: "betterHackerNetworkingComplete", target: "#networking-lesson", name: "Networking", check: "#network-check-result", next: "#linux-lesson", nextName: "Linux" },
    { key: "betterHackerLinuxComplete", target: "#linux-lesson", name: "Linux", check: "#linux-check-result", next: "#web-security-lesson", nextName: "Web Security" },
    { key: "betterHackerWebSecurityComplete", target: "#web-security-lesson", name: "Web Security", check: "#web-check-result", next: "#cryptography-lesson", nextName: "Cryptography" },
    { key: "betterHackerCryptographyComplete", target: "#cryptography-lesson", name: "Cryptography", check: "#crypto-check-result", next: "#active-directory-lesson", nextName: "Active Directory" },
    { key: "betterHackerActiveDirectoryComplete", target: "#active-directory-lesson", name: "Active Directory", check: "#ad-check-result", next: "#soc-siem-lesson", nextName: "SOC & SIEM" },
    { key: "betterHackerSocComplete", target: "#soc-siem-lesson", name: "SOC & SIEM", check: "#soc-check-result", next: "#security-testing-lesson", nextName: "Security Testing" },
    { key: "betterHackerSecurityTestingComplete", target: "#security-testing-lesson", name: "Security Testing", check: "#testing-check-result", next: "#labs", nextName: "Guided Exercises" }
  ]);

  const EXTENSION_LESSONS = Object.freeze([
    { id: "computer-tools", key: "betterHackerComputerToolsLessonComplete", target: "#computer-tools-lesson", name: "Computer Fundamentals & Security Tools", answer: "observe", next: "#labs", hint: "Start by observing rather than changing the system.", lookFor: "the process identity, parent, user, time, and connections" },
    { id: "incident-response", key: "betterHackerIncidentResponseLessonComplete", target: "#incident-response-lesson", name: "Incident Response", answer: "approved-containment", next: "#soc-siem-lesson", hint: "Use the authorized plan to limit harm while preserving evidence.", lookFor: "validation, evidence preservation, and proportionate containment" }
  ]);

  const PRACTICE_LESSONS = Object.freeze([
    {
      "id": "reconnaissance",
      "key": "betterHackerPracticeReconnaissanceComplete",
      "target": "#practice-reconnaissance",
      "name": "Reconnaissance",
      "answer": "complete",
      "answers": [
        "0",
        "0",
        "0"
      ],
      "hint": "Separate what the records reveal from what you are allowed to do.",
      "lookFor": "Record A reveals a version and age; neither record authorizes an active check.",
      "explanation": "Reviewing supplied records is passive and within scope. The old version label merits owner review but does not prove a vulnerability or compromise. Active interaction requires explicit permission."
    },
    {
      "id": "network-analysis",
      "key": "betterHackerPracticeNetworkAnalysisComplete",
      "target": "#practice-network-analysis",
      "name": "Network Analysis",
      "answer": "complete",
      "answers": [
        "0",
        "0",
        "0",
        "0"
      ],
      "hint": "Read the columns before interpreting the pattern.",
      "lookFor": "The last row repeats rapidly against port 22, unlike the DNS-then-web baseline.",
      "explanation": "The last row is TCP from 10.0.0.99 to destination port 22. Sixty attempts in ten seconds without approved maintenance justify investigation, not a claim of confirmed compromise. DNS followed by HTTP fits the supplied normal baseline."
    },
    {
      "id": "linux-challenges",
      "key": "betterHackerPracticeLinuxChallengesComplete",
      "target": "#practice-linux-challenges",
      "name": "Linux Challenges",
      "answer": "complete",
      "answers": [
        "0",
        "0",
        "0",
        "0"
      ],
      "hint": "Read each command’s output; keep observation separate from modification.",
      "lookFor": "Permissions split into rw-, r--, ---; the process row names both its PID and owner.",
      "explanation": "whoami identifies learner. The file grants owner read/write, group read, and no permissions to others. find locates auth.log; ps shows analyst’s PID 2410. A password request warrants documentation and reporting, not deletion or credential sharing."
    },
    {
      "id": "defensive-security",
      "key": "betterHackerPracticeDefensiveSecurityComplete",
      "target": "#practice-defensive-security",
      "name": "Defensive Security",
      "answer": "complete",
      "answers": [
        "0",
        "0",
        "0",
        "0"
      ],
      "hint": "Order the records, then correlate the repeated account and source with the later changes.",
      "lookFor": "E103 follows the failures; E104 and E105 create and elevate backup-helper.",
      "explanation": "The timeline links demo-admin at 192.0.2.44 to later creation and elevation of backup-helper. Unscheduled changes following failures merit investigation. Preserve event IDs and timestamps, verify ownership/authorization, and use approved containment; the logs alone do not prove who operated the account."
    },
    {
      id:"python-log-review", key:"betterHackerPracticePythonLogReviewComplete", target:"#practice-python-log-review", name:"Python Log Review",
      answer:"complete", answers:["0","1"], skills:["Python","Log analysis","Evidence correlation"], tools:["Python","CSV log parsing"],
      intro:"Practice reading a small Python log-filtering example. The code and records are simulated; nothing is executed.",
      evidence:'SIMULATED CSV rows\ntime,user,result\n09:01,alex,success\n09:02,alex,failed\n09:03,sam,failed\n\nPython example: failed = [row for row in rows if row["result"] == "failed"]',
      questions:[
        {prompt:"Which rows does the filter select?",options:["Rows whose result is failed","Every row from alex","Only rows after 09:02"]},
        {prompt:"What is the safest conclusion from two failed rows?",options:["Two failures are evidence to review, not proof of compromise","The accounts are compromised","Delete the failed records"]}
      ],
      hint:"Read the field named in the condition, then separate the count from any unsupported conclusion.", lookFor:"The condition checks result, and the records show two failures.",
      explanation:"The example selects rows whose result equals failed. Two failed rows are observations to correlate with other evidence; they do not prove compromise. This is a reading exercise, not a Python runtime."
    },
    {
      id:"powershell-event-review", key:"betterHackerPracticePowerShellEventReviewComplete", target:"#practice-powershell-event-review", name:"PowerShell Event Review",
      answer:"complete", answers:["1","0"], skills:["PowerShell","Windows event logs","Alert triage"], tools:["PowerShell","Get-WinEvent"],
      intro:"Read a defensive PowerShell query and its supplied output. No command runs on a device.",
      evidence:'SIMULATED read-only example: Get-WinEvent -FilterHashtable @{LogName="Security"; Id=4625} -MaxEvents 20\nSIMULATED result: 3 records, all failed logon events, from two source addresses.',
      questions:[
        {prompt:"What does this query request?",options:["Delete failed logons","Read up to 20 Security log events with ID 4625","Reset the accounts"]},
        {prompt:"What should an analyst do next?",options:["Correlate time, accounts, source addresses, and expected activity","Assume an attacker succeeded","Erase the log"]}
      ],
      hint:"The cmdlet name and filter describe a read. The returned failures still need context.", lookFor:"Get-WinEvent reads matching events; failed logons need correlation.",
      explanation:"Get-WinEvent reads records matching the supplied log and event ID. Validate the time, account, source, and surrounding activity before drawing a conclusion. The command is presented only as text."
    },
    {
      id:"cloud-responsibility-review", key:"betterHackerPracticeCloudResponsibilityComplete", target:"#practice-cloud-responsibility-review", name:"Cloud Shared Responsibility",
      answer:"complete", answers:["0","1"], skills:["Cloud security","IAM","Least privilege"], tools:["Shared responsibility model"],
      intro:"Separate provider responsibilities from customer configuration and access decisions. This general exercise does not grant AWS, Azure, or GCP platform evidence.",
      evidence:"SIMULATED scenario: A cloud-hosted application has a public storage setting and a user account with broad administrator access. The provider operates the underlying physical data center.",
      questions:[
        {prompt:"Who is responsible for correcting the application's public storage setting?",options:["The customer or workload owner","Only the physical data-center operator","No one; cloud storage is always public"]},
        {prompt:"Which access change best follows least privilege?",options:["Keep permanent administrator access","Grant the specific role needed for the task","Share a root credential"]}
      ],
      hint:"The provider secures parts of the cloud service; customers still configure their workloads and identities.", lookFor:"Workload settings and user permissions remain customer-controlled responsibilities.",
      explanation:"Cloud responsibility is shared and depends on the service. The workload owner must review its storage exposure and grant only task-specific access. This general concept does not count as experience with any specific cloud platform."
    },
    {
      id:"aws-iam-review", key:"betterHackerPracticeAwsIamReviewComplete", target:"#practice-aws-iam-review", name:"AWS IAM Policy Review",
      answer:"complete", answers:["1","0"], skills:["AWS","IAM","Least privilege"], tools:["AWS IAM policy review"],
      intro:"Review a fictional AWS IAM request without signing in or changing any cloud resource.",
      evidence:"SIMULATED AWS request: A reporting task needs read access to one named S3 bucket. The draft policy grants s3:* on Resource: *.",
      questions:[
        {prompt:"What is the main concern?",options:["The policy is too narrow","Wildcard resource and broad actions exceed the stated task","S3 cannot have access policies"]},
        {prompt:"What is the safer review recommendation?",options:["Scope required read actions to the named bucket and have the owner validate","Keep all actions on every resource","Publish access keys in a ticket"]}
      ],
      hint:"Compare the requested task with both the action scope and resource scope.", lookFor:"The request is bucket-specific read access, while the draft uses all actions and all resources.",
      explanation:"The draft exceeds the stated reporting need. Recommend task-specific read actions and the named resource, then have the authorized owner validate the policy. This is simulated AWS policy review only."
    },
    {
      id:"azure-signin-review", key:"betterHackerPracticeAzureSigninReviewComplete", target:"#practice-azure-signin-review", name:"Azure Sign-in Review",
      answer:"complete", answers:["0","1"], skills:["Azure","IAM","Alert triage"], tools:["Microsoft Entra sign-in logs"],
      intro:"Interpret supplied Microsoft Azure sign-in evidence. No account or tenant is accessed.",
      evidence:"SIMULATED sign-in records: user pat@example.test; 08:10 success from usual office location; 08:14 MFA denied from a new location; no successful sign-in after the denial.",
      questions:[
        {prompt:"Which event deserves follow-up?",options:["The denied MFA attempt from a new location","The routine success by itself","Neither event can be reviewed"]},
        {prompt:"What conclusion is supported now?",options:["The account is definitely taken over","A denied attempt is a signal to correlate, not proof of access","MFA should be disabled"]}
      ],
      hint:"A denied attempt is important context, but the records show no later successful sign-in.", lookFor:"The unusual denied attempt is observed; account compromise is not established.",
      explanation:"Review the new-location MFA denial with related identity and endpoint evidence. The supplied records show no subsequent success, so they do not establish account takeover. This is simulated Azure identity-log analysis."
    },
    {
      id:"gcp-audit-review", key:"betterHackerPracticeGcpAuditReviewComplete", target:"#practice-gcp-audit-review", name:"Google Cloud Audit Review",
      answer:"complete", answers:["1","0"], skills:["GCP","Cloud security","IAM"], tools:["Google Cloud Audit Logs"],
      intro:"Review fictional Google Cloud audit evidence and choose a safe follow-up. No project is accessed.",
      evidence:"SIMULATED Cloud Audit Log: service account key created for reporting-svc at 14:02 UTC by analyst-7. Change ticket field is empty; owner is listed as Data Reporting.",
      questions:[
        {prompt:"Which detail makes this change worth validating?",options:["A service account key was created without a linked ticket","The log has a timestamp","The service account has an owner"]},
        {prompt:"What is a proportionate next step?",options:["Immediately delete every service account","Confirm the change with the owner and review approved key-handling procedures","Share the key to identify its user"]}
      ],
      hint:"A missing change reference is a validation gap. Confirm ownership before proposing action.", lookFor:"The event is observable, but authorization and business context are not supplied.",
      explanation:"Validate the key creation with the named owner and approved change process. Preserve the event and avoid exposing or deleting credentials without authorization. This is simulated GCP audit-log review."
    },
    {
      id:"edr-process-review", key:"betterHackerPracticeEdrProcessReviewComplete", target:"#practice-edr-process-review", name:"EDR Process-chain Triage",
      answer:"complete", answers:["0","1"], skills:["Endpoint security / EDR","Threat detection","Incident response"], tools:["EDR process telemetry"],
      intro:"Triage fictional endpoint detection and response (EDR) process evidence without interacting with an endpoint.",
      evidence:"SIMULATED EDR alert: workstation W-12; office macro-enabled document opened; child process launched a command interpreter; outbound connection was blocked; no file hash reputation result is available.",
      questions:[
        {prompt:"Which combination is the strongest investigation lead?",options:["Document-to-interpreter process chain plus blocked connection","Workstation name alone","The missing reputation result proves malware"]},
        {prompt:"What is the safest next step?",options:["Declare confirmed malware and wipe the workstation","Preserve alert and process details, then validate with approved endpoint procedures","Ignore the alert because the connection was blocked"]}
      ],
      hint:"Correlate the parent-child process context and connection outcome; a detection is not a verdict.", lookFor:"A suspicious process chain and blocked connection merit validation; the hash is unknown.",
      explanation:"The process chain and blocked connection support investigation, but the supplied data do not confirm malware. Preserve the telemetry and validate using authorized EDR procedures."
    },
    {
      id:"ids-ips-review", key:"betterHackerPracticeIdsIpsReviewComplete", target:"#practice-ids-ips-review", name:"IDS and IPS Alert Review",
      answer:"complete", answers:["1","0"], skills:["IDS / IPS","Network analysis","Threat detection"], tools:["Intrusion detection system","Intrusion prevention system"],
      intro:"Distinguish network detection from prevention and interpret one fictional alert safely.",
      evidence:"SIMULATED network security event: signature matched a known test pattern; sensor mode is IDS; action is alert-only; destination host is a training server.",
      questions:[
        {prompt:"What does the supplied IDS mode tell you?",options:["The connection was automatically blocked","The event was detected and alerted; blocking is not shown","The host is compromised"]},
        {prompt:"What does IPS commonly add when configured to prevent?",options:["Automatic evidence deletion","A prevention action such as blocking matching traffic","A guarantee of zero false positives"]}
      ],
      hint:"Read the sensor mode and recorded action separately from the signature match.", lookFor:"IDS plus alert-only indicates detection; prevention requires an enabled blocking action.",
      explanation:"The supplied IDS event was detected and alerted but not shown as blocked. An IPS can take a configured prevention action, though alerts still need validation and controls can have false positives."
    },
    {
      id:"firewall-rule-review", key:"betterHackerPracticeFirewallRuleReviewComplete", target:"#practice-firewall-rule-review", name:"Firewall Rule Review",
      answer:"complete", answers:["0","1"], skills:["Firewalls","Network fundamentals","Least privilege"], tools:["Firewall rule review"],
      intro:"Review a fictional firewall change request against its business need. Do not change any real firewall.",
      evidence:"SIMULATED request: allow inbound TCP/22 from 0.0.0.0/0 to all production servers, permanently. Stated need: one administrator needs temporary maintenance access to host app-17.",
      questions:[
        {prompt:"Which risk is most apparent?",options:["The rule permits broad sources and destinations beyond the stated need","The rule names a protocol","The request has a business purpose"]},
        {prompt:"What is the safer recommendation?",options:["Keep the permanent all-host rule","Limit source, destination, duration, and approval to the documented maintenance need","Disable logging for the rule"]}
      ],
      hint:"Compare source, destination, time limit, and service in the rule with the task.", lookFor:"The need is one administrator, one host, and temporary maintenance.",
      explanation:"The proposed source and destination scope is much broader and longer-lived than requested. Recommend a time-bound, approved rule limited to the necessary source, host, and service, with normal logging."
    },
    {
      id:"vulnerability-queue-review", key:"betterHackerPracticeVulnerabilityQueueReviewComplete", target:"#practice-vulnerability-queue-review", name:"Vulnerability Queue Prioritization",
      answer:"complete", answers:["1","0"], skills:["Vulnerability management","Risk prioritization","Evidence correlation"], tools:["Asset inventory","Patch management concepts"],
      intro:"Prioritize a fictional remediation queue using severity, exposure, asset importance, and available evidence.",
      evidence:"SIMULATED queue: A) critical issue on an internet-facing customer gateway with vendor fix available; B) high issue on an isolated test image, no known exposure; C) medium issue on a routine workstation. No exploit evidence is supplied.",
      questions:[
        {prompt:"Which item is the strongest initial remediation priority?",options:["B, because its label says high","A, because critical severity, internet exposure, asset role, and a fix align","C, because workstations are common"]},
        {prompt:"What should the priority statement avoid claiming?",options:["The gateway is internet-facing","The issue is confirmed exploited, since no exploit evidence was supplied","A vendor fix is available"]}
      ],
      hint:"Combine severity with exposure and business context. Do not add exploit evidence that is absent.", lookFor:"A combines critical severity, internet exposure, important function, and an available fix.",
      explanation:"The gateway is the strongest initial priority based on supplied severity, exposure, role, and remediation availability. The evidence does not show exploitation; keep that uncertainty explicit and follow the owner’s SLA and change process."
    },
    {
      id:"forensics-evidence-review", key:"betterHackerPracticeForensicsEvidenceReviewComplete", target:"#practice-forensics-evidence-review", name:"Digital Forensics Evidence Handling",
      answer:"complete", answers:["0","1"], skills:["Digital forensics","Evidence preservation","Incident response"], tools:["Forensic image","Cryptographic hash","Chain of custody"],
      intro:"Choose evidence-preserving actions for a fictional incident. This exercise does not access or acquire any real device.",
      evidence:"SIMULATED request: A laptop may contain relevant logs. It is powered on and assigned to its user. The incident lead has not yet approved collection steps or identified the evidence custodian.",
      questions:[
        {prompt:"What should happen before collection?",options:["Confirm authority, scope, trained custodian, and the approved preservation procedure","Let several people browse the laptop","Shut it down immediately without recording context"]},
        {prompt:"What helps document evidence integrity after authorized acquisition?",options:["Rename the source files","Record custody and handling, and verify hashes according to procedure","Email an unprotected copy to the team"]}
      ],
      hint:"Preserve current context and establish an authorized, documented handling plan before touching evidence.", lookFor:"Authority and a trained custodian come before collection; custody and hashes support integrity records.",
      explanation:"Confirm scope and authority and use the trained custodian’s procedure to preserve volatile context. Document custody and verify integrity as directed. No collection action is authorized by the scenario as written."
    }
  ]);

  const ASSISTANT_PROGRESS_KEY = "betterHackerLearningAssistantTopics";
  const ASSISTANT_TOPICS = Object.freeze([
    { id:"fundamentals", icon:"🛡️", name:"Fundamentals", explanation:"Cybersecurity protects information and systems from harm. Professionals use shared principles to decide what matters, what could go wrong, and which safeguards reduce risk.", terms:[["Asset","Something valuable, such as data or a service."],["Threat","Something capable of causing harm."],["Vulnerability","A weakness a threat could use."],["Risk","The likelihood and impact of possible harm."]], concepts:["The CIA triad covers confidentiality, integrity, and availability.","Authentication proves identity; authorization controls permitted actions.","Least privilege limits access, while defense in depth uses multiple safeguards."], tools:"Example: multi-factor authentication, permissions, backups, monitoring, and incident plans are defensive controls—not guarantees on their own.", scenario:"A teammate needs one report but requests administrator access. Which detail matters most? The task requires one report, so broad privileges add avoidable risk.", question:"Which principle grants only the access needed for a task?", options:["Least privilege","Availability","Encoding"], correct:0, hint:"Compare the access requested with the access actually required.", feedback:"Least privilege reduces unnecessary access and limits the effect of mistakes or account compromise.", nextTopic:"networking", nextHref:"#fundamentals-lesson", nextLabel:"Review the Fundamentals lesson" },
    { id:"networking", icon:"🌐", name:"Networking", explanation:"Networking is how devices exchange information. Defenders use network context to identify expected services, troubleshoot failures, and investigate unusual connections.", terms:[["IP address","A network address for a device or interface."],["Port","A numbered endpoint commonly associated with a service."],["DNS","The system that resolves names to addresses."],["Route","A path used to reach another network."]], concepts:["Protocols define communication rules; TCP emphasizes reliable delivery and UDP has less overhead.","A port is a useful clue, but it does not prove which application is running.","Source, destination, protocol, port, time, and volume give traffic context."], tools:"Safe local inspection examples include `ip addr` for interfaces, `ip route` for routes, `ss -tuln` for listening sockets, `ping` for basic reachability, and DNS lookups for name resolution. Use them only on systems and networks you are authorized to inspect.", scenario:"A training site opens by IP address but not by name. Address reachability works, so name resolution is the first area to examine.", question:"Which service translates a host name into an IP address?", options:["DNS","SSH","HTTPS"], correct:0, hint:"Think about the service that acts like a directory for names and addresses.", feedback:"DNS resolves names to addresses. A working IP connection with a failing name is a strong reason to inspect DNS configuration and results.", nextTopic:"linux", nextHref:"#networking-lesson", nextLabel:"Review the Networking lesson" },
    { id:"linux", icon:"🐧", name:"Linux", explanation:"Linux is an operating system widely used for servers, cloud workloads, and security tools. Defenders use its command line to inspect files, identities, permissions, processes, and logs.", terms:[["Directory","A container for files and other directories."],["Permission","A rule controlling read, write, or execute access."],["Process","A running instance of a program."],["User/group","Identities used to assign ownership and access."]], concepts:["Confirm your current location before acting.","Read-only inspection helps preserve evidence.","Ownership and permissions explain who can access a resource."], tools:"Useful safe commands include `pwd`, `ls -l`, `cd`, `cat`, `grep`, and `find`. Process and identity context can be viewed with tools such as `ps` and `whoami`. Avoid changing or deleting evidence during initial review.", scenario:"A simulated listing contains `-rw-r--r-- notes.txt`. The leading dash indicates a regular file, and the permissions show who may read or write it.", question:"Which command displays a short text file without editing it?", options:["cat notes.txt","rm notes.txt","chmod 777 notes.txt"], correct:0, hint:"Choose the command used to print file contents, not remove or change the file.", feedback:"`cat notes.txt` displays the file. The other choices destroy evidence or unnecessarily broaden permissions.", nextTopic:"web", nextHref:"#linux-lesson", nextLabel:"Review the Linux lesson" },
    { id:"web", icon:"🌎", name:"Web Security", explanation:"Web security protects browsers, servers, applications, identities, and data. Professionals examine how requests are processed and whether users can access only authorized actions and records.", terms:[["Request","A browser or client message sent to a server."],["Response","The server result, including a status code and content."],["Session","Server-recognized state that keeps a user signed in."],["Input validation","Checking whether supplied data meets expected rules."]], concepts:["GET commonly retrieves data and POST commonly submits data.","Status codes describe outcomes, such as 200 success, 404 not found, and 500 server error.","Parameterized queries, contextual output encoding, secure authentication, and server-side access control address different risks."], tools:"Browser developer tools can safely show requests and responses for your own application. Never test another application without explicit authorization. Common vulnerability categories include injection, cross-site scripting, and broken access control.", scenario:"A code review shows a user value joined directly into a SQL string. The important clue is that untrusted data can become query instructions.", question:"Which defensive pattern keeps SQL instructions separate from user values?", options:["Parameterized queries","A longer URL","A hidden button"], correct:0, hint:"Look for the option that changes how the database receives data.", feedback:"Parameterized queries send the query structure and values separately, reducing SQL injection risk.", nextTopic:"crypto", nextHref:"#web-security-lesson", nextLabel:"Review the Web Security lesson" },
    { id:"crypto", icon:"🔐", name:"Cryptography", explanation:"Cryptography protects confidentiality, integrity, and authenticity. Professionals choose a mechanism based on the security goal rather than treating every transformation as encryption.", terms:[["Encryption","Reversible protection using authorized key material."],["Hashing","A one-way digest used for integrity and verification."],["Encoding","A representation change for compatibility, not secrecy."],["Certificate","A signed binding between identity information and a public key."]], concepts:["Symmetric encryption uses a shared secret; asymmetric systems use related public and private keys.","Digital signatures support integrity, origin authentication, and non-repudiation concepts.","Keys require careful generation, storage, rotation, and revo…25262 tokens truncated…sult ? "Completed — " + state.reviewResult.score + " / " + state.reviewResult.total + " (" + state.reviewResult.percentage + "%)" : "Not Started");
  setText("#core-path-count", state.completedActivities + " / " + state.totalActivities + " activities completed");
  setText("#core-path-percent", state.percentage + "% complete");
  const coreProgress = document.querySelector("#core-path-progress");
  const coreFill = document.querySelector("#core-path-progress-fill");
  if (coreProgress) {
    coreProgress.setAttribute("aria-valuenow", String(state.percentage));
    coreProgress.setAttribute("aria-valuetext", state.completedActivities + " of " + state.totalActivities + " Core Path activities completed");
  }
  if (coreFill) coreFill.style.width = state.percentage + "%";

  const path = document.querySelector("#learning-path-stages");
  if (path) path.innerHTML = state.stages.map(function (stage, index) {
    return '<li><a href="' + stage.target + '"><span>Stage ' + (index + 1) + '</span><strong>' + stage.name + '</strong><em>' + stage.status + ' · ' + stage.completed + '/' + stage.total + '</em></a></li>';
  }).join("");

  const next = document.querySelector("#dashboard-next");
  if (next) next.innerHTML = '<strong>' + (state.coreComplete ? 'Core Path Complete' : 'Recommended next activity') + '</strong><h3>' + state.recommendation.name + ' <span>(' + state.recommendation.type + ')</span></h3>' +
    '<p><b>Why next:</b> ' + state.recommendation.why + '</p><p><b>You will practice:</b> ' + state.recommendation.practice + '</p><p><b>XP contribution:</b> ' + state.recommendation.xp + ' XP' + '</p>' +
    '<a class="primary-button" href="' + state.recommendation.target + '">' + state.recommendation.action + '</a>' + (state.recommendation.secondaryTarget ? ' <a class="secondary-button" href="' + state.recommendation.secondaryTarget + '">' + state.recommendation.secondaryAction + '</a>' : '');

  const daily = RetentionState.readDailyState(localStorage);
  const dailyComplete = daily.records.some(function (record) { return record.date === RetentionState.localDateKey(new Date()); });
  setText("#today-daily", dailyComplete ? "Today’s Daily Challenge is completed." : "Today’s Daily Challenge is available.");
  setText("#today-streaks", "Current streak: " + RetentionState.formatDayCount(RetentionState.activeDailyStreak(daily, RetentionState.localDateKey(new Date()))) + " · Longest streak: " + RetentionState.formatDayCount(daily.longestStreak));
  setText("#today-next", state.coreComplete ? "Core Path Complete — next optional activity: " + state.recommendation.name + "." : "Next core activity: " + state.recommendation.name + " (" + state.recommendation.type + ").");
  const todayAction = document.querySelector("#today-action");
  if (todayAction) { todayAction.href = state.recommendation.target; todayAction.textContent = state.recommendation.action; }

  const skillList = document.querySelector("#learning-indicators");
  if (skillList) skillList.innerHTML = state.skills.map(function (skill) {
    return '<li class="' + (skill.evidenceCount ? 'supported' : 'upcoming') + '"><strong>' + skill.name + '</strong><span>' + skill.status + '</span></li>';
  }).join("");

  const achievement = document.querySelector("#knowledge-checkpoint");
  if (achievement && state.reviewResult) {
    achievement.classList.add("achievement-unlocked");
    achievement.setAttribute("aria-label", "Knowledge Checkpoint achievement unlocked");
    achievement.querySelector("span").textContent = "✓";
  }
  const existingContinueButton = document.querySelector(".continue-learning-button");
  if (existingContinueButton) {
    existingContinueButton.href = state.recommendation.target;
    existingContinueButton.textContent = "▶ " + state.recommendation.label;
  }
  renderRetentionSummary();
  setDashboardCompanionContext(state);
  return state;
}

const continueLearningButton = document.createElement("a");
const dashboardState = renderDashboard();
continueLearningButton.href = dashboardState.recommendation.target;
continueLearningButton.textContent = "▶ " + dashboardState.recommendation.label;
continueLearningButton.className = "primary-button continue-learning-button";
const learnSection = document.querySelector("#learn");
if (learnSection) {
  const progressText = document.querySelector("#course-progress-text");
  if (progressText) progressText.insertAdjacentElement("afterend", continueLearningButton);
}

const dashboardActivitySection = document.querySelector("#labs");
if (dashboardActivitySection) {
  dashboardActivitySection.addEventListener("click", function () {
    setTimeout(renderDashboard, 0);
  });
}

const reviewIntro = document.querySelector("#review-intro");
const reviewForm = document.querySelector("#review-question");
const reviewResults = document.querySelector("#review-results");
let reviewIndex = 0;
let reviewScore = 0;
let reviewTopicResults = {};
let reviewAnswered = false;

function showStoredReviewResult() {
  const result = readReviewResult();
  const previous = document.querySelector("#review-previous-result");
  if (previous && result) {
    previous.textContent = "Most recent result: " + result.score + " / " + result.total + " (" + result.percentage + "%).";
    const details = document.querySelector("#review-previous-topics");
    if (details) {
      details.innerHTML = "<h4>Most recent topic review</h4><ul>" + Object.keys(result.topics).map(function (topic) {
        const value = result.topics[topic];
        return '<li><a href="' + value.lesson + '">' + topic + '</a>: ' + value.correct + ' / ' + value.total + ' answered correctly</li>';
      }).join("") + "</ul>";
    }
  }
}

function renderReviewQuestion() {
  const question = COURSE_REVIEW_QUESTIONS[reviewIndex];
  reviewAnswered = false;
  if (typeof companion !== "undefined") companion.setContext({ type:"review", topic:question.topic, hint:question.misconception, explanation:question.why, submitted:false });
  document.querySelector("#review-progress").textContent = "Question " + (reviewIndex + 1) + " of " + COURSE_REVIEW_QUESTIONS.length;
  document.querySelector("#review-topic").textContent = question.topic;
  document.querySelector("#review-prompt").textContent = question.prompt;
  const scenario = document.querySelector("#review-scenario");
  scenario.textContent = question.scenario;
  scenario.hidden = !question.scenario;
  const answers = document.querySelector("#review-answers");
  answers.innerHTML = "";

  if (question.type === "choice") {
    question.options.forEach(function (option, index) {
      const label = document.createElement("label");
      label.className = "review-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "review-answer";
      input.value = String(index);
      label.appendChild(input);
      label.appendChild(document.createTextNode(option));
      answers.appendChild(label);
    });
  } else {
    const label = document.createElement("label");
    label.setAttribute("for", "review-short-answer");
    label.textContent = "Your answer";
    const input = document.createElement("input");
    input.id = "review-short-answer";
    input.name = "review-answer";
    input.type = "text";
    input.autocomplete = "off";
    answers.appendChild(label);
    answers.appendChild(input);
  }
  document.querySelector("#review-feedback").hidden = true;
  document.querySelector("#next-review-question").hidden = true;
  document.querySelector("#submit-review-answer").hidden = false;
  const firstControl = answers.querySelector("input");
  if (firstControl) firstControl.focus();
}

function startCourseReview() {
  reviewIndex = 0;
  reviewScore = 0;
  reviewTopicResults = {};
  reviewIntro.hidden = true;
  reviewResults.hidden = true;
  reviewForm.hidden = false;
  renderReviewQuestion();
}

function submitReviewAnswer(event) {
  event.preventDefault();
  if (reviewAnswered) return;
  const question = COURSE_REVIEW_QUESTIONS[reviewIndex];
  const selected = reviewForm.querySelector('input[name="review-answer"]:checked');
  const shortInput = reviewForm.querySelector('#review-short-answer');
  if (!selected && (!shortInput || !shortInput.value.trim())) {
    const feedback = document.querySelector("#review-feedback");
    feedback.hidden = false;
    feedback.className = "review-feedback review-feedback-neutral";
    feedback.textContent = "Choose or enter an answer before submitting.";
    return;
  }
  const correct = isReviewAnswerCorrect(question, question.type === "choice" ? selected.value : shortInput.value);
  reviewAnswered = true;
  if (typeof companion !== "undefined") companion.setContext({ submitted:true, explanation:question.why });
  if (!reviewTopicResults[question.topic]) reviewTopicResults[question.topic] = { correct: 0, total: 0, lesson: question.lesson };
  reviewTopicResults[question.topic].total++;
  if (correct) {
    reviewScore++;
    reviewTopicResults[question.topic].correct++;
  }
  reviewForm.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
  const correctAnswer = question.type === "choice" ? question.options[question.answer] : question.displayAnswer;
  const feedback = document.querySelector("#review-feedback");
  feedback.hidden = false;
  feedback.className = "review-feedback " + (correct ? "review-feedback-correct" : "review-feedback-learning");
  feedback.innerHTML = "<h3>" + (correct ? "That’s right" : "A useful concept to revisit") + "</h3>" +
    (correct ? "" : "<p><strong>Best answer:</strong> " + correctAnswer + "</p>") +
    "<p>" + question.why + "</p><p><strong>Why another choice may be tempting:</strong> " + question.misconception + "</p>" +
    '<p><strong>Lesson connection:</strong> <a href="' + question.lesson + '">' + question.topic + "</a></p>";
  document.querySelector("#submit-review-answer").hidden = true;
  const next = document.querySelector("#next-review-question");
  next.textContent = reviewIndex === COURSE_REVIEW_QUESTIONS.length - 1 ? "See My Results" : "Next Question";
  next.hidden = false;
  next.focus();
}

function finishCourseReview() {
  const total = COURSE_REVIEW_QUESTIONS.length;
  const percentage = Math.round((reviewScore / total) * 100);
  const result = { completed: true, score: reviewScore, total: total, percentage: percentage, completedAt: new Date().toISOString(), topics: reviewTopicResults };
  localStorage.setItem(COURSE_REVIEW_STORAGE_KEY, JSON.stringify(result));
  reviewForm.hidden = true;
  reviewResults.hidden = false;
  const strong = [];
  const review = [];
  Object.keys(reviewTopicResults).forEach(function (topic) {
    const value = reviewTopicResults[topic];
    (value.correct / value.total >= 0.5 ? strong : review).push({ topic: topic, lesson: value.lesson });
  });
  const links = function (items) { return items.length ? '<ul>' + items.map(function (item) { return '<li><a href="' + item.lesson + '">' + item.topic + '</a></li>'; }).join("") + '</ul>' : '<p>Keep using the lesson links below to reinforce every topic.</p>'; };
  reviewResults.innerHTML = '<p role="status">' + localStorage.feedback('Review result saved.', COURSE_REVIEW_STORAGE_KEY) + '</p><h3>Course Review Complete</h3><p class="review-score"><strong>' + reviewScore + ' / ' + total + '</strong><span>' + percentage + '%</span></p>' +
    '<div class="review-topic-columns"><div><h4>Answered correctly</h4>' + links(strong) + '</div><div><h4>Worth revisiting</h4>' + links(review) + '</div></div>' +
    '<p>Your result is a study guide, not a label. Revisit any lesson and try again whenever you are ready.</p><button id="review-again" class="primary-button" type="button">Review Again</button>';
  document.querySelector("#review-again").addEventListener("click", startCourseReview);
  renderDashboard();
  reviewResults.focus();
}

if (reviewIntro && reviewForm && reviewResults) {
  reviewResults.tabIndex = -1;
  showStoredReviewResult();
  document.querySelector("#start-course-review").addEventListener("click", startCourseReview);
  reviewForm.addEventListener("submit", submitReviewAnswer);
  document.querySelector("#next-review-question").addEventListener("click", function () {
    if (reviewIndex < COURSE_REVIEW_QUESTIONS.length - 1) {
      reviewIndex++;
      renderReviewQuestion();
    } else {
      finishCourseReview();
    }
  });
}

/* =========================
   DAILY CHALLENGE & AUTHORED COMPANION
========================= */
const dailyCard = document.querySelector("#daily-challenge-card");
const dailyPracticeUI = dailyCard ? globalThis.BetterHackerDailyPracticeUI.create({
  root: document.querySelector("#daily-challenge"), storage: localStorage, companion: companion,
  onComplete: function () { renderDashboard(); }
}) : null;
function renderDailyChallenge() { if (dailyPracticeUI) dailyPracticeUI.summary(); }
NAVIGATION_HANDLERS.push(function () { if (dailyPracticeUI) dailyPracticeUI.navigate(location.hash || ""); });
renderDailyChallenge();

function renderExtensionLessonProgress() {
  renderPracticeProgress();
  EXTENSION_LESSONS.forEach(function (lesson) {
    const complete = localStorage.getItem(lesson.key) === "true";
    const card = document.querySelector('.extension-lesson-card[data-extension-id="' + lesson.id + '"]');
    if (card) card.classList.toggle("activity-complete", complete);
  });
}

document.querySelectorAll(".extension-check").forEach(function (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const extensionLesson = EXTENSION_LESSONS.find(function (item) { return item.id === form.dataset.extensionId; });
    const selected = form.querySelector('input[type="radio"]:checked');
    const feedback = form.querySelector(".extension-feedback");
    if (!extensionLesson || !feedback) return;
    if (!selected) {
      feedback.className = "extension-feedback feedback-review";
      feedback.textContent = "Choose an answer first. Review the lesson or ask Byte for a conceptual hint.";
      return;
    }
    const result = completeExtensionLesson(extensionLesson.id, selected.value);
    if (!result.correct) {
      feedback.className = "extension-feedback feedback-review";
      feedback.textContent = "Not quite. Choose the authorized response that observes or contains safely and preserves evidence.";
      companion.setContext({ type: "lesson", activityId: extensionLesson.id, topic: extensionLesson.name, hint: extensionLesson.hint, lookFor: extensionLesson.lookFor, submitted: true, explanation: feedback.textContent });
      return;
    }
    feedback.className = "extension-feedback feedback-success";
    feedback.textContent = "Correct. " + localStorage.feedback(result.newlyCompleted ? "Lesson complete. Your supplemental progress has been saved." : "You already completed this lesson, so reviewing it does not award duplicate completion or XP.", extensionLesson.key);
    companion.setContext({ type: "lesson", activityId: extensionLesson.id, topic: extensionLesson.name, hint: extensionLesson.hint, lookFor: extensionLesson.lookFor, submitted: true, explanation: feedback.textContent });
    renderExtensionLessonProgress();
    renderDashboard();
  });
});
renderExtensionLessonProgress();

document.querySelectorAll(".lesson-card").forEach(function(card){card.addEventListener("click",function(){companion.setContext({type:"lesson",topic:card.querySelector("h3").textContent,submitted:false});});});
function updateCompanionForLessonHash() {
  const lesson = LESSON_PROGRESS.find(function (item) { return location.hash === item.target; });
  if (lesson) {
    companion.setContext({ type: "lesson", topic: lesson.name, hint: "Review the learning objectives, then connect the Try It evidence to the principle asked about in the knowledge check.", lookFor: "the key term and the security goal it supports", submitted: false });
    const section = document.querySelector(lesson.target);
    const heading = section && section.querySelector("h2");
    if (heading) heading.focus();
  }
  const extensionLesson = EXTENSION_LESSONS.find(function (item) { return location.hash === item.target; });
  if (extensionLesson) {
    companion.setContext({ type: "lesson", activityId: extensionLesson.id, topic: extensionLesson.name, hint: extensionLesson.hint, lookFor: extensionLesson.lookFor, submitted: false });
    const extensionSection = document.querySelector(extensionLesson.target);
    const extensionHeading = extensionSection && extensionSection.querySelector("h2");
    if (extensionHeading) extensionHeading.focus();
  }
}

function checkPracticeAnswers(id, answers) {
  const lesson = PRACTICE_LESSONS.find(function (item) { return item.id === id; });
  if (!lesson || answers.length !== lesson.answers.length || !lesson.answers.every(function (answer, index) { return answer === answers[index]; })) return { correct: false, newlyCompleted: false };
  return completeExtensionLesson(id, "complete");
}
function setPracticeContext(lesson, submitted, explanation) {
  companion.setContext({ type: "activity", activityId: lesson.id, topic: lesson.name, hint: lesson.hint, lookFor: lesson.lookFor, submitted: submitted, explanation: explanation || "" });
}
function renderSkillPractice() {
  const cards = document.querySelector("#skill-practice-cards");
  const sections = document.querySelector("#skill-practice-sections");
  if (!cards || !sections) return;
  PRACTICE_LESSONS.filter(function (lesson) { return Array.isArray(lesson.questions); }).forEach(function (lesson) {
    const card = document.createElement("a");
    card.className = "card platform-entry-card";
    card.dataset.practiceId = lesson.id;
    card.href = lesson.target;
    const cardTitle = document.createElement("h3"); cardTitle.textContent = lesson.name;
    const cardCopy = document.createElement("p"); cardCopy.textContent = lesson.intro;
    const action = document.createElement("span"); action.className = "platform-entry-action"; action.textContent = "Start Practice →";
    const cardStatus = document.createElement("span"); cardStatus.className = "practice-status"; cardStatus.textContent = "Not completed";
    card.append(cardTitle, cardCopy, action, cardStatus); cards.appendChild(card);

    const section = document.createElement("section"); section.id = lesson.target.slice(1); section.className = "section extension-lesson";
    section.setAttribute("aria-labelledby", lesson.id + "-title");
    const label = document.createElement("p"); label.className = "section-label"; label.textContent = "SUPPLEMENTAL HANDS-ON PRACTICE — NO CORE XP";
    const title = document.createElement("h2"); title.id = lesson.id + "-title"; title.tabIndex = -1; title.textContent = lesson.name;
    const intro = document.createElement("p"); intro.textContent = lesson.intro;
    const status = document.createElement("p"); status.className = "practice-status"; status.setAttribute("role", "status"); status.textContent = "Not completed";
    const evidenceBlock = document.createElement("div"); evidenceBlock.className = "lesson-block";
    const evidenceTitle = document.createElement("h3"); evidenceTitle.textContent = "Supplied simulated evidence";
    const evidence = document.createElement("pre"); evidence.textContent = lesson.evidence;
    evidenceBlock.append(evidenceTitle, evidence);
    const hintDetails = document.createElement("details"); hintDetails.className = "lesson-block";
    const summary = document.createElement("summary"); summary.textContent = "Reasoning hint";
    const hint = document.createElement("p"); hint.textContent = lesson.hint;
    const clue = document.createElement("p"); clue.textContent = lesson.lookFor;
    hintDetails.append(summary, hint, clue);
    const form = document.createElement("form"); form.className = "lesson-block practice-check"; form.dataset.practiceId = lesson.id;
    lesson.questions.forEach(function (question, index) {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend"); legend.textContent = question.prompt; fieldset.appendChild(legend);
      question.options.forEach(function (option, optionIndex) {
        const input = document.createElement("input"); input.type = "radio"; input.name = lesson.id + "-" + index; input.id = lesson.id + "-" + index + "-" + optionIndex; input.value = String(optionIndex);
        const optionLabel = document.createElement("label"); optionLabel.htmlFor = input.id; optionLabel.append(input, document.createTextNode(" " + option)); fieldset.appendChild(optionLabel);
      });
      form.appendChild(fieldset);
    });
    const submit = document.createElement("button"); submit.type = "submit"; submit.className = "primary-button"; submit.textContent = "Check Practice";
    const feedback = document.createElement("p"); feedback.className = "practice-feedback"; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite");
    const help = document.createElement("a"); help.className = "secondary-button"; help.href = "#coach"; help.dataset.practiceHelp = lesson.id; help.textContent = "Get Help With This Practice";
    const back = document.createElement("a"); back.href = "#labs"; back.textContent = "Return to Hands-On Practice";
    form.append(submit, feedback, help, document.createTextNode(" "), back);
    section.append(label, title, intro, status, evidenceBlock, hintDetails, form); sections.appendChild(section);
  });
}
renderSkillPractice();
function renderPracticeProgress() {
  PRACTICE_LESSONS.forEach(function (lesson) {
    const complete = localStorage.getItem(lesson.key) === "true";
    const card = document.querySelector('[data-practice-id="' + lesson.id + '"].card');
    const section = document.querySelector(lesson.target);
    [card, section].forEach(function (element) {
      if (!element) return;
      const status = element.querySelector(".practice-status");
      if (status) status.textContent = complete ? "✓ Completed — Review Practice" : "Not completed";
      element.classList.toggle("activity-complete", complete);
    });
  });
}
document.querySelectorAll(".practice-check").forEach(function (form) {
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const lesson = PRACTICE_LESSONS.find(function (item) { return item.id === form.dataset.practiceId; });
    if (!lesson) return;
    const answers = lesson.answers.map(function (_, index) {
      const selected = form.querySelector('input[name="' + lesson.id + '-' + index + '"]:checked');
      return selected ? selected.value : null;
    });
    const feedback = form.querySelector(".practice-feedback");
    if (answers.includes(null)) { feedback.textContent = "Answer every step first. Use the evidence and reasoning hint."; return; }
    const result = checkPracticeAnswers(lesson.id, answers);
    feedback.className = "practice-feedback " + (result.correct ? "feedback-success" : "feedback-review");
    feedback.textContent = (result.correct ? ("Correct. " + localStorage.feedback(result.newlyCompleted ? "Supplemental practice completed and saved. " : "Reviewing your completed practice. ", lesson.key)) : "Not quite — review the evidence and retry. Completion has not changed. ") + lesson.explanation;
    setPracticeContext(lesson, true, lesson.explanation);
    renderPracticeProgress();
    renderDashboard();
  });
});
document.querySelectorAll("[data-practice-help]").forEach(function (link) {
  link.addEventListener("click", function () {
    const lesson = PRACTICE_LESSONS.find(function (item) { return item.id === link.dataset.practiceHelp; });
    if (lesson) setPracticeContext(lesson, false);
  });
});
NAVIGATION_HANDLERS.push(function () {
  const lesson = PRACTICE_LESSONS.find(function (item) { return location.hash === item.target; });
  if (!lesson) return;
  setPracticeContext(lesson, false);
  const section = document.querySelector(lesson.target);
  const heading = section && section.querySelector("h2");
  if (heading) heading.focus();
});
renderPracticeProgress();

function handleNavigation() {
  NAVIGATION_HANDLERS.forEach(function (handler) { handler(); });
  updateCompanionForLessonHash();
  if (typeof location !== "undefined" && location.hash === "#dashboard") setDashboardCompanionContext(getDashboardState());
}
if (typeof window !== "undefined") window.addEventListener("hashchange", handleNavigation);
handleNavigation();
const labsForCompanion=document.querySelector("#labs");
if(labsForCompanion)labsForCompanion.addEventListener("click",function(event){const card=event.target.closest&&event.target.closest(".lab-challenge");if(card){const heading=card.querySelector("h3");companion.setContext({type:"activity",topic:heading?heading.textContent:"Cybersecurity practice",submitted:false});}});

const companionToggle=document.querySelector("#companion-toggle");
const companionPanel=document.querySelector("#companion-panel");
const companionClose=document.querySelector("#companion-close");
const companionResponse=document.querySelector("#companion-response");
let companionReturnFocus=null;
function openCompanion(){companionReturnFocus=document.activeElement;companionPanel.hidden=false;companionToggle.setAttribute("aria-expanded","true");companionClose.focus();}
function closeCompanion(){companionPanel.hidden=true;companionToggle.setAttribute("aria-expanded","false");if(companionReturnFocus&&companionReturnFocus.focus)companionReturnFocus.focus();}
if(companionToggle&&companionPanel&&companionClose){
  companionToggle.addEventListener("click",openCompanion); companionClose.addEventListener("click",closeCompanion);
  companionPanel.addEventListener("click",function(event){const action=event.target.dataset.companionAction;if(action)companionResponse.textContent=companion.respond(action);});
  document.addEventListener("keydown",function(event){if(event.key==="Escape"&&!companionPanel.hidden)closeCompanion();});
}

/* =========================
   RESET LEARNING PROGRESS
========================= */

const resetProgressButton =
  document.createElement("button");

resetProgressButton.textContent =
  "↻ Reset Learning Progress";

resetProgressButton.className =
  "secondary-button reset-progress-button";

if (learnSection) {

  continueLearningButton.insertAdjacentElement(
    "afterend",
    resetProgressButton
  );

  resetProgressButton.addEventListener(
    "click",
    function () {

      const confirmed =
        confirm(
          "Reset Better Hacker learning, Practice Library, Daily Challenge, XP, streak, achievement, and skill badge progress? Your authored portfolio projects and confirmed waitlist email will be kept."
        );

      if (!confirmed) {
        return;
      }

      localStorage.keys().forEach(
        function (key) {

          if (
            key.startsWith("betterHacker") &&
            key !== "betterHackerWaitlistEmail" &&
            key !== "betterHackerPortfolioProjects"
          ) {
            localStorage.removeItem(key);
          }

        }
      );

      if (!localStorage.hasFailures()) location.reload();
      else {
        refreshLearningUI(); renderDailyChallenge(); renderExtensionLessonProgress();
        document.dispatchEvent(new Event("daily-practice-completed"));
      }
    }
  );
}
  const waitlistForm = document.querySelector("#waitlist-form");
const waitlistButton = document.querySelector("#waitlist-button");
const waitlistEmail = document.querySelector("#waitlist-email");
const waitlistResult = document.querySelector("#waitlist-result");
let waitlistPending = false;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function renderJoinedWaitlistState() {
  const joinedEmail = localStorage.getItem("betterHackerWaitlistEmail");
  if (!joinedEmail || !waitlistResult) return;
  waitlistResult.textContent = "✓ Joined with " + joinedEmail + ".";
  waitlistResult.className = "feedback-success";
  if (waitlistEmail) waitlistEmail.value = joinedEmail;
  if (waitlistButton) waitlistButton.textContent = "Update Waitlist Email";
}

if (waitlistForm && waitlistButton && waitlistEmail && waitlistResult) {
  renderJoinedWaitlistState();
  waitlistForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (waitlistPending) return;
    const email = waitlistEmail.value.trim().toLowerCase();
    if (!isValidEmail(email)) {
      waitlistResult.textContent = "Enter a complete email address, such as you@example.com.";
      waitlistResult.className = "feedback-review";
      waitlistEmail.setAttribute("aria-invalid", "true");
      waitlistEmail.focus();
      return;
    }
    waitlistEmail.removeAttribute("aria-invalid");
    waitlistPending = true;
    waitlistButton.disabled = true;
    waitlistButton.textContent = "Joining…";
    waitlistResult.textContent = "Submitting your email…";
    try {
      const response = await fetch("https://formspree.io/f/xdeobdjl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: email })
      });
      if (!response.ok) throw new Error("Waitlist request failed with status " + response.status);
      const emailSaved = localStorage.setItem("betterHackerWaitlistEmail", email);
      waitlistResult.textContent = "✓ You’re confirmed on the Better Hacker early-access list." + (emailSaved ? "" : " Your email could not be saved on this device; the signup was confirmed by Formspree.");
      waitlistResult.className = "feedback-success";
      waitlistButton.textContent = "Update Waitlist Email";
    } catch (error) {
      waitlistResult.textContent = "We couldn’t confirm your signup. Check your connection and try again.";
      waitlistResult.className = "feedback-review";
      waitlistButton.textContent = "Retry Joining";
    } finally {
      waitlistPending = false;
      waitlistButton.disabled = false;
    }
  });
}

});

