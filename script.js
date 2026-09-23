// Better Hacker Interactive Features

document.addEventListener("DOMContentLoaded", function () {

  const LESSON_PROGRESS = Object.freeze([
    { key: "betterHackerFundamentalsComplete", target: "#fundamentals-lesson", name: "Cybersecurity Fundamentals" },
    { key: "betterHackerNetworkingComplete", target: "#networking-lesson", name: "Networking" },
    { key: "betterHackerLinuxComplete", target: "#linux-lesson", name: "Linux" },
    { key: "betterHackerWebSecurityComplete", target: "#web-security-lesson", name: "Web Security" },
    { key: "betterHackerCryptographyComplete", target: "#cryptography-lesson", name: "Cryptography" },
    { key: "betterHackerActiveDirectoryComplete", target: "#active-directory-lesson", name: "Active Directory" },
    { key: "betterHackerSocComplete", target: "#soc-siem-lesson", name: "SOC & SIEM" },
    { key: "betterHackerSecurityTestingComplete", target: "#security-testing-lesson", name: "Security Testing" }
  ]);

  const INVESTIGATIONS = Object.freeze([
    { key: "betterHackerSocInvestigationComplete", name: "SOC Alert Investigation", selector: ".soc-investigation-lab" },
    { key: "betterHackerNetworkInvestigationComplete", name: "Network Traffic Investigation", selector: ".network-investigation-lab" },
    { key: "betterHackerPhishingInvestigationComplete", name: "Phishing Email Investigation", selector: ".phishing-investigation-lab" },
    { key: "betterHackerWindowsInvestigationComplete", name: "Windows / Active Directory Investigation", selector: ".windows-investigation-lab" },
    { key: "betterHackerMalwareInvestigationComplete", name: "Malware Investigation", selector: ".malware-investigation-lab" },
    { key: "betterHackerBruteForceInvestigationComplete", name: "Brute Force Investigation", selector: ".brute-force-investigation-lab" },
    { key: "betterHackerWebAttackInvestigationComplete", name: "Web Attack Investigation", selector: ".web-attack-investigation-lab" }
  ]);

  const GUIDED_EXERCISE_TOTAL = 4;
  const COURSE_REVIEW_STORAGE_KEY = "betterHackerCourseReviewResult";
  const RetentionState = globalThis.BetterHackerState;
  const DailyChallenges = globalThis.BetterHackerChallenges;
  const Milestones = globalThis.BetterHackerMilestones;
  const CompanionModule = globalThis.BetterHackerCompanion;
  const companion = CompanionModule.createCompanion(new CompanionModule.AuthoredProvider());

  function readCompletedLabs() {
    const raw = localStorage.getItem("betterHackerCompletedLabs");
    if (!/^[0-4]$/.test(raw || "")) return 0;
    return Number(raw);
  }

  /* =========================
     CLICKABLE GUIDED LAB SYSTEM
  ========================= */

  const GUIDED_LABS = Object.freeze([
    {
      id: "linux", icon: "💻", title: "Linux File Detective", topic: "Linux", time: "8–10 minutes",
      description: "Interpret a safe directory listing and choose a command to read a text file.",
      learn: "Read basic Linux file information and select an appropriate, non-destructive command.",
      scenario: "You are helping review files in an authorized training workspace. Your goal is to inspect a notes file without changing it.",
      concept: "The ls -l command lists names, types, permissions, owners, sizes, and dates. A leading d means directory; a leading - means regular file. cat prints a short text file to the terminal.",
      evidence: "$ pwd\n/home/learner/training\n$ ls -l\ndrwxr-xr-x 2 learner learner 4096 Sep 23 09:00 reports\n-rw-r--r-- 1 learner learner   42 Sep 23 09:02 flag.txt",
      task: "Identify which entry is the regular text file, then enter the command that safely displays it from the current directory.",
      question: "Which command displays the contents of flag.txt?", answers: ["cat flag.txt", "cat ./flag.txt"],
      hint: "The filename appears in the current directory. Use the short command commonly used to print a text file.",
      feedback: "Correct. The leading - identifies flag.txt as a regular file, and cat flag.txt displays it without modifying it.",
      importance: "Defenders routinely inspect files and logs. Recognizing file metadata and using read-only commands reduces accidental changes while investigating."
    },
    {
      id: "networking", icon: "🌐", title: "Network Service Triage", topic: "Networking", time: "10–12 minutes",
      description: "Connect ports, protocols, and services while interpreting simulated network evidence.",
      learn: "Interpret common ports and connect a port to its likely protocol and service.",
      scenario: "An approved inventory scan found three listening services on a training web server. You need to identify the service carrying ordinary unencrypted web traffic.",
      concept: "A port identifies a network service endpoint. Common associations include 22/TCP for SSH, 80/TCP for HTTP, and 443/TCP for HTTPS. A port is evidence, not proof; defenders confirm it with service data.",
      evidence: "SIMULATED AUTHORIZED SCAN\nPORT    PROTOCOL   STATE   SERVICE\n22      TCP        open    ssh\n80      TCP        open    http\n443     TCP        open    https",
      task: "Compare the port, protocol, and service columns. Select the port conventionally associated with HTTP.",
      question: "Which listed port is commonly associated with HTTP?", answers: ["80", "port 80"],
      hint: "Look at the service column for http, then read the port in the same row.",
      feedback: "Correct. Port 80/TCP is commonly associated with HTTP; HTTPS commonly uses 443/TCP.",
      importance: "Knowing expected services helps defenders spot exposed, unexpected, or misconfigured network services during triage."
    },
    {
      id: "cryptography", icon: "🔐", title: "Choose the Right Data Protection", topic: "Cryptography", time: "10–12 minutes",
      description: "Distinguish encryption, hashing, and encoding by their security purpose.",
      learn: "Tell encryption, hashing, and encoding apart and choose the right mechanism for a security need.",
      scenario: "A team must protect a confidential backup so an authorized recipient can recover the original information with a key.",
      concept: "Encryption is reversible with the proper key and protects confidentiality. Hashing creates a one-way digest useful for integrity checks and password verification. Encoding changes representation for compatibility and is not a security control.",
      evidence: "REQUIREMENTS\n• Output must be unreadable without authorization\n• An approved recipient must recover the original data\n• A managed key is available",
      task: "Match the requirements to the mechanism whose output can be reversed only with authorized key material.",
      question: "Which mechanism best meets these requirements?", answers: ["encryption", "encrypting"],
      hint: "Hashing is designed to be one-way, and encoding offers no confidentiality. Which option uses a key and is reversible?",
      feedback: "Correct. Encryption transforms plaintext into ciphertext and permits authorized recovery with the proper key.",
      importance: "Choosing the wrong mechanism can expose sensitive data. Encoding is not encryption, and hashes should not be treated as recoverable ciphertext."
    },
    {
      id: "web-security", icon: "🛡️", title: "Defend a Database Query", topic: "Web Security", time: "12–15 minutes",
      description: "Recognize unsafe input handling and learn why parameterized queries reduce SQL injection risk.",
      learn: "Identify SQL injection risk and explain the defensive value of parameterized queries.",
      scenario: "During an authorized code review, you see a login value being joined directly into a query string. You are asked to name the risk—not to exploit it.",
      concept: "When an application treats untrusted input as part of SQL syntax, the input may change the query's meaning. Parameterized queries keep the SQL structure separate from data values, so the database treats input as data.",
      evidence: "SIMULATED INSECURE PATTERN\nquery = \"SELECT id FROM users WHERE username = '\" + userInput + \"'\"\n\nDEFENSIVE PATTERN\nquery = \"SELECT id FROM users WHERE username = ?\"\ndatabase.execute(query, [userInput])",
      task: "Compare how the two patterns handle userInput. Name the vulnerability risk created by the first pattern.",
      question: "What vulnerability can direct insertion of untrusted input into a database query create?", answers: ["sql injection", "sql injection attack", "sqli"],
      hint: "The risky input becomes part of SQL syntax. Name the injection category involving database queries.",
      feedback: "Correct. Direct string construction can create SQL injection risk. Parameterized queries separate instructions from values and are a key defense.",
      importance: "SQL injection can expose or alter data. Defensive input handling and parameterized queries protect confidentiality and integrity."
    }
  ]);

  function getLabStatus(index, activeIndex) {
    const completed = readCompletedLabs();
    if (index < completed) return "Completed";
    if (index === activeIndex) return "In Progress";
    return "Not Started";
  }

  function getLabAction(status) {
    return status === "Completed" ? "Review Lab" : status === "In Progress" ? "Continue Lab" : "Start Lab";
  }

  function completeGuidedLab(index) {
    const completed = readCompletedLabs();
    if (index < completed) return false;
    if (index !== completed) return false;
    localStorage.setItem("betterHackerCompletedLabs", String(completed + 1));
    return true;
  }

  const labSection = document.querySelector("#labs");
  if (labSection) {
    const existingCards = labSection.querySelector(".cards");
    if (existingCards) existingCards.hidden = true;
    const oldHelpLink = labSection.querySelector('a[href="#coach"]');
    if (oldHelpLink) oldHelpLink.hidden = true;

    const overview = document.createElement("div");
    overview.className = "lab-overview";
    overview.id = "lab-overview";
    const workspace = document.createElement("article");
    workspace.className = "lab-challenge guided-exercise lab-workspace";
    workspace.id = "lab-workspace";
    workspace.hidden = true;
    labSection.appendChild(overview);
    labSection.appendChild(workspace);

    let activeLabIndex = -1;
    let answerWasCorrect = false;

    function renderLabCards() {
      const completed = readCompletedLabs();
      overview.innerHTML = '<p id="lab-progress" role="status" aria-live="polite">Guided exercises completed: ' + completed + ' / ' + GUIDED_LABS.length + '</p><p><a class="secondary-button" href="#investigations-overview">Browse Defensive Investigations</a></p><div class="lab-card-grid">' +
        GUIDED_LABS.map(function (lab, index) {
          const status = getLabStatus(index, activeLabIndex);
          return '<article class="lab-card"><p class="lab-topic">' + lab.topic + ' · Beginner</p><h3>' + lab.icon + ' ' + lab.title + '</h3><p>' + lab.description + '</p><p class="lab-time">Estimated time: ' + lab.time + '</p><p class="lab-status lab-status-' + status.toLowerCase().replace(" ", "-") + '">Status: <strong>' + status + '</strong></p><button type="button" class="primary-button lab-card-action" data-lab-index="' + index + '" aria-label="' + getLabAction(status) + ': ' + lab.title + '">' + getLabAction(status) + '</button></article>';
        }).join("") + '</div>';
    }

    function setLabHash(lab) {
      if (typeof history !== "undefined" && history.pushState) history.pushState(null, "", "#lab-" + lab.id);
      else if (typeof location !== "undefined") location.hash = "lab-" + lab.id;
    }

    function openLab(index, updateHash) {
      const lab = GUIDED_LABS[index];
      if (!lab) return;
      activeLabIndex = index;
      answerWasCorrect = false;
      renderLabCards();
      workspace.hidden = false;
      workspace.setAttribute("data-lab-id", lab.id);
      workspace.innerHTML = '<a class="lab-back-link" href="#lab-overview">← Back to all labs</a>' +
        '<p class="lab-topic">' + lab.topic + ' · Beginner · ' + lab.time + '</p><h3 tabindex="-1">' + lab.icon + ' ' + lab.title + '</h3>' +
        '<section aria-labelledby="lab-learn-heading"><h4 id="lab-learn-heading">1. What You’ll Learn</h4><p>' + lab.learn + '</p></section>' +
        '<section><h4>2. Scenario</h4><p>' + lab.scenario + '</p></section>' +
        '<section><h4>3. Concept Explanation</h4><p>' + lab.concept + '</p></section>' +
        '<section><h4>4. Evidence</h4><pre><code>' + lab.evidence + '</code></pre></section>' +
        '<section><h4>5. Step-by-Step Task</h4><ol><li>Read the scenario and concept.</li><li>Review each line of evidence.</li><li>' + lab.task + '</li></ol></section>' +
        '<form id="guided-lab-form"><h4>6. Learner Question / Decision</h4><p>' + lab.question + '</p><label class="input-label" for="lab-answer">Your answer</label><input type="text" id="lab-answer" autocomplete="off" required><div class="lab-actions"><button type="button" id="hint-button" class="secondary-button">7. Show Hint</button><button type="submit" id="submit-answer" class="primary-button">8. Submit Answer</button></div></form>' +
        '<div id="lab-result" role="status" aria-live="polite"></div><section class="lab-why"><h4>10. Why This Matters in Cybersecurity</h4><p>' + lab.importance + '</p></section><div id="lab-completion-actions"></div>';
      if (updateHash !== false) setLabHash(lab);
      if (typeof companion !== "undefined") companion.setContext({ type: "guided-lab", activityId: lab.id, topic: lab.topic + ": " + lab.title, hint: lab.hint, explanation: lab.concept, lookFor: lab.task, submitted: false });

      const form = workspace.querySelector("#guided-lab-form");
      const input = workspace.querySelector("#lab-answer");
      const result = workspace.querySelector("#lab-result");
      const submit = workspace.querySelector("#submit-answer");
      workspace.querySelector("#hint-button").addEventListener("click", function () {
        result.className = "feedback-review";
        result.textContent = "💡 Hint: " + lab.hint;
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const answer = input.value.trim().toLowerCase();
        if (!lab.answers.includes(answer)) {
          result.className = "feedback-review";
          result.textContent = "Not quite yet. Recheck the evidence and use the hint; no progress was changed.";
          return;
        }
        answerWasCorrect = true;
        result.className = "feedback-success";
        result.textContent = "9. Educational Feedback — " + lab.feedback;
        submit.disabled = true;
        input.disabled = true;
        if (typeof companion !== "undefined") companion.setContext({ submitted: true, explanation: lab.feedback });
        const completed = readCompletedLabs();
        const alreadyComplete = index < completed;
        const canComplete = index === completed;
        const actions = workspace.querySelector("#lab-completion-actions");
        actions.innerHTML = '<h4>11. Complete Lab / Continue Learning</h4>' +
          (alreadyComplete ? '<p>This lab was already completed. Reviewing it does not award XP again.</p>' : canComplete ? '<button type="button" id="complete-lab" class="primary-button">Complete Lab</button>' : '<p>Practice complete. Finish the earlier lab first so existing sequential progress remains accurate.</p>') +
          '<a class="secondary-button" href="#lab-overview">Return to Labs</a>';
        const complete = workspace.querySelector("#complete-lab");
        if (complete) complete.addEventListener("click", function () {
          if (!answerWasCorrect || !completeGuidedLab(index)) return;
          refreshLearningUI();
          renderLabCards();
          actions.innerHTML = '<h4>11. Lab Complete</h4><p class="feedback-success">Completed. Progress, XP, achievements, badge evidence, and your dashboard are now updated.</p>' +
            (index + 1 < GUIDED_LABS.length ? '<button type="button" class="primary-button" id="next-guided-lab">Continue Learning: ' + GUIDED_LABS[index + 1].title + '</button>' : '<a class="primary-button" href="#dashboard">Continue Learning from Dashboard</a>') + '<a class="secondary-button" href="#lab-overview">Return to Labs</a>';
          const next = workspace.querySelector("#next-guided-lab");
          if (next) next.addEventListener("click", function () { openLab(index + 1, true); });
        });
      });
      const heading = workspace.querySelector("h3");
      if (heading) heading.focus();
    }

    overview.addEventListener("click", function (event) {
      const button = event.target.closest && event.target.closest(".lab-card-action");
      if (button) openLab(Number(button.getAttribute("data-lab-index")), true);
    });
    function openFromHash() {
      const hash = typeof location !== "undefined" ? location.hash : "";
      const index = GUIDED_LABS.findIndex(function (lab) { return hash === "#lab-" + lab.id; });
      if (index >= 0) openLab(index, false);
      if (hash === "#lab-overview" || hash === "#labs") { workspace.hidden = true; activeLabIndex = -1; renderLabCards(); }
    }
    if (typeof window !== "undefined") window.addEventListener("hashchange", openFromHash);
    renderLabCards();
    openFromHash();
  }


  /* =========================
   BETTER HACKER LEARNING ASSISTANT
========================= */

const coachSection =
  document.querySelector("#coach");

if (coachSection) {

  const coachBox =
    coachSection.querySelector(".coach-box");

  if (coachBox) {

    const coachInterface =
      document.createElement("div");

    coachInterface.className =
      "coach-interface";

    coachInterface.innerHTML = `

      <div class="coach-header">
        <span class="coach-status"></span>
        <strong>Better Hacker Learning Assistant</strong>
        <span class="coach-online">Ready to help</span>
      </div>

      <p class="coach-question">
        What would you like help with?
      </p>

      <div class="coach-topics">

        <button class="coach-topic" data-topic="fundamentals">
          🛡️ Fundamentals
        </button>

        <button class="coach-topic" data-topic="networking">
          🌐 Networking
        </button>

        <button class="coach-topic" data-topic="linux">
          🐧 Linux
        </button>

        <button class="coach-topic" data-topic="web">
          🌎 Web Security
        </button>

        <button class="coach-topic" data-topic="crypto">
          🔐 Cryptography
        </button>

        <button class="coach-topic" data-topic="ad">
          🪟 Active Directory
        </button>

        <button class="coach-topic" data-topic="soc">
          🛡️ SOC / SIEM
        </button>

        <button class="coach-topic" data-topic="testing">
          🔎 Security Testing
        </button>

        <button class="coach-topic" data-topic="labs">
          🧪 Labs
        </button>

      </div>

      <div id="coach-response" class="coach-response" role="status" aria-live="polite">

        <p>
          Select a topic for a beginner-friendly authored
          explanation and a suggested next step.
        </p>

      </div>

    `;

    coachBox.appendChild(coachInterface);


    const responses = {

      fundamentals: {
        title: "🛡️ Cybersecurity Fundamentals",

        text:
          "Cybersecurity fundamentals include threats, vulnerabilities, risk, authentication, authorization, least privilege, and defense in depth.",

        next:
          "Next step: review the CIA Triad and make sure you understand the difference between authentication and authorization."
      },

      networking: {
        title: "🌐 Networking",

        text:
          "Networking is the foundation of cybersecurity. Understanding IP addresses, ports, protocols, DNS, TCP, UDP, HTTP, and HTTPS makes security concepts much easier to understand.",

        next:
          "Next step: review common ports such as 22, 53, 80, and 443."
      },

      linux: {
        title: "🐧 Linux",

        text:
          "Linux is important in cybersecurity because many servers, security tools, and cloud systems use it.",

        next:
          "Next step: practice commands such as pwd, ls, cd, cat, grep, and find."
      },

      web: {
        title: "🌎 Web Security",

        text:
          "Web security focuses on protecting websites and applications from vulnerabilities involving authentication, input validation, access control, sessions, and databases.",

        next:
          "Next step: review SQL injection, cross-site scripting, and broken access control."
      },

      crypto: {
        title: "🔐 Cryptography",

        text:
          "Cryptography protects information through techniques such as encryption, hashing, keys, and digital signatures.",

        next:
          "Next step: make sure you understand the difference between encryption and hashing."
      },

      ad: {
        title: "🪟 Active Directory",

        text:
          "Active Directory helps organizations manage users, computers, groups, authentication, and permissions across Windows environments.",

        next:
          "Next step: review users, groups, domains, domain controllers, and why administrative privileges must be protected."
      },

      soc: {
        title: "🛡️ SOC / SIEM",

        text:
          "A Security Operations Center monitors systems for suspicious activity. SIEM platforms help security teams collect, search, and analyze logs and security events.",

        next:
          "Next step: practice identifying who performed an action, what happened, where it happened, and when it occurred."
      },

      testing: {
        title: "🔎 Security Testing",

        text:
          "Security testing looks for weaknesses in systems, applications, and networks. Testing must always stay within an authorized scope.",

        next:
          "Next step: review reconnaissance, vulnerability assessment, authorization, reporting, and remediation."
      },

      labs: {
        title: "🧪 Better Hacker Labs",

        text:
          "Hands-on practice helps turn cybersecurity knowledge into practical skills. Use the Better Hacker labs to apply what you learn in realistic scenarios.",

        next:
          "Next step: complete the beginner labs and then work through the investigation challenges."
      }

    };


    const topicButtons =
      coachInterface.querySelectorAll(".coach-topic");

    const responseBox =
      coachInterface.querySelector("#coach-response");


    topicButtons.forEach(function (button) {

      button.addEventListener("click", function () {

        const topic =
          button.dataset.topic;

        const response =
          responses[topic];

        responseBox.innerHTML = `

          <h3>${response.title}</h3>

          <p>${response.text}</p>

          <div class="coach-next">

            <strong>🎯 Recommended Next Step</strong>

            <p>${response.next}</p>

          </div>

        `;

      });

    });

  }

}

  
/* =========================
   COURSE PROGRESS SYSTEM
========================= */

function updateCourseProgress() {

  const lessonKeys = LESSON_PROGRESS.map(function (lesson) { return lesson.key; });

  let completedLessons = 0;

  lessonKeys.forEach(function (key) {
    if (localStorage.getItem(key) === "true") {
      completedLessons++;
    }
  });

  const progressText =
    document.querySelector("#course-progress-text");

  const progressFill =
    document.querySelector("#course-progress-fill");

  if (progressText) {
    progressText.textContent =
      `${completedLessons} / ${LESSON_PROGRESS.length} Lessons Completed`;
  }

  if (progressFill) {
    const percentage =
      (completedLessons / LESSON_PROGRESS.length) * 100;

    progressFill.style.width =
      `${percentage}%`;

    const progressBar = document.querySelector("#course-progress-bar");
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(completedLessons));
  }
}

updateCourseProgress();
/* =========================
   COMPLETED LESSON BADGES
========================= */

function renderLessonCompletionStates() {
  LESSON_PROGRESS.forEach(function (lesson) {
    const lessonCard = document.querySelector(`.lesson-card[href="${lesson.target}"]`);
    const lessonSection = document.querySelector(lesson.target);
    const complete = localStorage.getItem(lesson.key) === "true";
    if (lessonCard) {
      let badge = lessonCard.querySelector(".lesson-complete-badge");
      if (complete && !badge) {
        badge = document.createElement("span");
        badge.textContent = "✓ Completed";
        badge.className = "lesson-complete-badge";
        lessonCard.appendChild(badge);
      } else if (!complete && badge) badge.remove();
    }
    if (lessonSection) lessonSection.classList.toggle("activity-complete", complete);
  });
}

function refreshLearningUI() {
  updateCourseProgress();
  renderLessonCompletionStates();
  if (typeof renderDashboard === "function") renderDashboard();
  if (typeof updateInvestigationProgress === "function") updateInvestigationProgress();
  if (typeof renderInvestigationCompletionStates === "function") renderInvestigationCompletionStates();
}

renderLessonCompletionStates();
  /* =========================
   NEXT LESSON BUTTON
========================= */

function showNextLessonButton(resultElement, target, name) {

  if (!resultElement) {
    return;
  }

  const oldButton =
    resultElement.parentElement.querySelector(
      ".next-lesson-button"
    );

  if (oldButton) {
    oldButton.remove();
  }

  const nextButton =
    document.createElement("a");

  nextButton.href = target;
  nextButton.textContent =
    "Next → " + name;

  nextButton.className =
    "primary-button next-lesson-button";

  resultElement.insertAdjacentElement(
    "afterend",
    nextButton
  );
}
  /* =========================
   FUNDAMENTALS LESSON COMPLETION
========================= */

const fundamentalsCheckButton = document.querySelector("#fundamentals-check-button");
const fundamentalsCheckAnswer = document.querySelector("#fundamentals-check-answer");
const fundamentalsCheckResult = document.querySelector("#fundamentals-check-result");

if (fundamentalsCheckButton && fundamentalsCheckAnswer && fundamentalsCheckResult) {
  function checkFundamentalsAnswer() {
    const answer = fundamentalsCheckAnswer.value.trim().toLowerCase().replace(/\s+/g, " ").replace(/^the /, "");
    if (answer === "least privilege" || answer === "principle of least privilege") {
      fundamentalsCheckResult.textContent = "✓ Correct. Least privilege limits people and systems to only the access they need, reducing the impact of mistakes or compromise.";
      fundamentalsCheckResult.className = "feedback-success";
      localStorage.setItem("betterHackerFundamentalsComplete", "true");
      refreshLearningUI();
      showNextLessonButton(fundamentalsCheckResult, "#networking-lesson", "Networking");
    } else {
      fundamentalsCheckResult.textContent = "Not quite yet. Review the principle that limits access to only what a person or system needs.";
      fundamentalsCheckResult.className = "feedback-review";
    }
  }
  fundamentalsCheckButton.addEventListener("click", checkFundamentalsAnswer);
  fundamentalsCheckAnswer.addEventListener("keydown", function (event) {
    if (event.key === "Enter") { event.preventDefault(); checkFundamentalsAnswer(); }
  });
}

  /* =========================
   LINUX LESSON COMPLETION
========================= */

const linuxCheckButton =
  document.querySelector("#linux-check-button");

const linuxCheckAnswer =
  document.querySelector("#linux-check-answer");

const linuxCheckResult =
  document.querySelector("#linux-check-result");

const linuxLesson =
  document.querySelector("#linux-lesson");

if (
  linuxCheckButton &&
  linuxCheckAnswer &&
  linuxCheckResult &&
  linuxLesson
) {

  function checkLinuxAnswer() {

    const answer =
      linuxCheckAnswer.value.trim().toLowerCase();

    if (answer === "cat") {

      linuxCheckResult.textContent =
        "✅ Correct! The cat command displays the contents of a file.";

      linuxCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerLinuxComplete",
        "true"
      );

      refreshLearningUI();

      showNextLessonButton(
  linuxCheckResult,
  "#web-security-lesson",
  "Web Security"
);
    } else {

      linuxCheckResult.textContent =
        "❌ Not quite. Try again.";

      linuxCheckResult.style.color = "#f87171";
    }
  }

  linuxCheckButton.addEventListener(
    "click",
    checkLinuxAnswer
  );

  linuxCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkLinuxAnswer();
      }

    }
  );

}

/* =========================
   NETWORKING KNOWLEDGE CHECK
========================= */

const networkCheckButton =
  document.querySelector("#network-check-button");

const networkCheckAnswer =
  document.querySelector("#network-check-answer");

const networkCheckResult =
  document.querySelector("#network-check-result");

if (
  networkCheckButton &&
  networkCheckAnswer &&
  networkCheckResult
) {

  function checkNetworkAnswer() {

    const answer =
      networkCheckAnswer.value.trim();

    if (answer === "443") {

      networkCheckResult.textContent =
        "✅ Correct! Port 443 is commonly used for HTTPS.";

      networkCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerNetworkingComplete",
        "true"
      );

  refreshLearningUI();
    showNextLessonButton(
  networkCheckResult,
  "#linux-lesson",
  "Linux"
);
    } else {

      networkCheckResult.textContent =
        "❌ Not quite. Try again.";

      networkCheckResult.style.color = "#f87171";
    }
  }

  networkCheckButton.addEventListener(
    "click",
    checkNetworkAnswer
  );

  networkCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkNetworkAnswer();
      }

    }
  );

}
/* =========================
   WEB SECURITY KNOWLEDGE CHECK
========================= */

const webCheckButton =
  document.querySelector("#web-check-button");

const webCheckAnswer =
  document.querySelector("#web-check-answer");

const webCheckResult =
  document.querySelector("#web-check-result");

if (
  webCheckButton &&
  webCheckAnswer &&
  webCheckResult
) {

  function checkWebAnswer() {

    const answer =
      webCheckAnswer.value.trim().toLowerCase();

    if (
      answer === "sql injection" ||
      answer === "sql injection attack" ||
      answer === "sqli"
    ) {

      webCheckResult.textContent =
        "✅ Correct! SQL injection can occur when unsafe input is placed directly into a database query.";

      webCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerWebSecurityComplete",
        "true"
      );

      refreshLearningUI();
showNextLessonButton(
  webCheckResult,
  "#cryptography-lesson",
  "Cryptography"
);
    
    } else {

      webCheckResult.textContent =
        "❌ Not quite. Think about an attack involving database queries.";

      webCheckResult.style.color = "#f87171";

    }
  }

  webCheckButton.addEventListener(
    "click",
    checkWebAnswer
  );

    webCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkWebAnswer();
      }

    }
  );

}
/* =========================
   CRYPTOGRAPHY KNOWLEDGE CHECK
========================= */

const cryptoCheckButton =
  document.querySelector("#crypto-check-button");

const cryptoCheckAnswer =
  document.querySelector("#crypto-check-answer");

const cryptoCheckResult =
  document.querySelector("#crypto-check-result");

if (
  cryptoCheckButton &&
  cryptoCheckAnswer &&
  cryptoCheckResult
) {

  function checkCryptoAnswer() {

    const answer =
      cryptoCheckAnswer.value.trim().toLowerCase();

    if (answer === "encryption") {

      cryptoCheckResult.textContent =
        "✅ Correct! Encryption transforms readable plaintext into unreadable ciphertext.";

      cryptoCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerCryptographyComplete",
        "true"
      );

      refreshLearningUI();
showNextLessonButton(
  cryptoCheckResult,
  "#active-directory-lesson",
  "Active Directory"
);
    
    } else {

      cryptoCheckResult.textContent =
        "❌ Not quite. Think about transforming readable data into ciphertext.";

      cryptoCheckResult.style.color = "#f87171";

    }
  }

  cryptoCheckButton.addEventListener(
    "click",
    checkCryptoAnswer
  );

  cryptoCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkCryptoAnswer();
      }

    }
  );

}
/* =========================
   ACTIVE DIRECTORY KNOWLEDGE CHECK
========================= */

const adCheckButton =
  document.querySelector("#ad-check-button");

const adCheckAnswer =
  document.querySelector("#ad-check-answer");

const adCheckResult =
  document.querySelector("#ad-check-result");

if (
  adCheckButton &&
  adCheckAnswer &&
  adCheckResult
) {

  function checkAdAnswer() {

    const answer =
      adCheckAnswer.value.trim().toLowerCase();

    if (
      answer === "user" ||
      answer === "user account"
    ) {

      adCheckResult.textContent =
        "✅ Correct! A user account represents a person who can sign in to the network.";

      adCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerActiveDirectoryComplete",
        "true"
      );

      refreshLearningUI();

      showNextLessonButton(
  adCheckResult,
  "#soc-siem-lesson",
  "SOC & SIEM"
);
    } else {

      adCheckResult.textContent =
        "❌ Not quite. Think about the account assigned to a person.";

      adCheckResult.style.color = "#f87171";

    }
  }

  adCheckButton.addEventListener(
    "click",
    checkAdAnswer
  );

  adCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkAdAnswer();
      }

    }
  );

}
/* =========================
   SOC & SIEM KNOWLEDGE CHECK
========================= */

const socCheckButton =
  document.querySelector("#soc-check-button");

const socCheckAnswer =
  document.querySelector("#soc-check-answer");

const socCheckResult =
  document.querySelector("#soc-check-result");

if (
  socCheckButton &&
  socCheckAnswer &&
  socCheckResult
) {

  function checkSocAnswer() {

    const answer =
      socCheckAnswer.value.trim().toLowerCase();

    if (answer === "siem") {

      socCheckResult.textContent =
        "✅ Correct! A SIEM collects and analyzes security logs from many systems.";

      socCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerSocComplete",
        "true"
      );

      refreshLearningUI();

      showNextLessonButton(
  socCheckResult,
  "#security-testing-lesson",
  "Security Testing"
);
    } else {

      socCheckResult.textContent =
        "❌ Not quite. Think about the platform security teams use to centralize and analyze logs.";

      socCheckResult.style.color = "#f87171";

    }
  }

  socCheckButton.addEventListener(
    "click",
    checkSocAnswer
  );

  socCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkSocAnswer();
      }

    }
  );

}
/* =========================
   SECURITY TESTING KNOWLEDGE CHECK
========================= */

const testingCheckButton =
  document.querySelector("#testing-check-button");

const testingCheckAnswer =
  document.querySelector("#testing-check-answer");

const testingCheckResult =
  document.querySelector("#testing-check-result");

if (
  testingCheckButton &&
  testingCheckAnswer &&
  testingCheckResult
) {

  function checkTestingAnswer() {

    const answer =
      testingCheckAnswer.value.trim().toLowerCase();

    if (
      answer === "permission" ||
      answer === "authorization" ||
      answer === "written permission" ||
      answer === "written authorization"
    ) {

      testingCheckResult.textContent =
        "✅ Correct! Security testing must only be performed with proper authorization.";

      testingCheckResult.style.color = "#38bdf8";

      localStorage.setItem(
        "betterHackerSecurityTestingComplete",
        "true"
      );

      refreshLearningUI();

      showNextLessonButton(
  testingCheckResult,
  "#labs",
  "Cybersecurity Labs"
);
    } else {

      testingCheckResult.textContent =
        "❌ Not quite. Think about what makes security testing legal and authorized.";

      testingCheckResult.style.color = "#f87171";

    }
  }

  testingCheckButton.addEventListener(
    "click",
    checkTestingAnswer
  );

  testingCheckAnswer.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {
        checkTestingAnswer();
      }

    }
  );

}
/* =========================
   CLICKABLE DEFENSIVE INVESTIGATIONS
========================= */

const INVESTIGATION_ACTIVITIES = Object.freeze([
  {
    id: "soc-alert", key: "betterHackerSocInvestigationComplete", icon: "🛡️", title: "SOC Alert Investigation", topic: "SOC & SIEM", difficulty: "Beginner", time: "10–12 minutes",
    objective: "Correlate authentication signals and choose a proportionate first response.",
    scenario: "You are a SOC analyst reviewing a simulated identity alert for an employee account.",
    concept: "Authentication alerts become stronger when several signals align. Time, failed attempts, a later success, and device familiarity provide context; one field alone does not prove compromise.",
    evidence: ["User: j.smith", "Time: 2:14 AM", "Failed attempts: 14", "Successful login: Yes, after failures", "Device: Unknown", "Location: Detroit, Michigan"],
    classify: "Classify the event as routine, suspicious and needing validation, or safe to delete.",
    question: "What is the best first action?", choices: ["Ignore the alert", "Investigate and verify the login activity", "Delete the security logs"], answer: 1,
    hint: "Correlate the failures, later success, time, and unfamiliar device. Preserve evidence.",
    feedback: "The combined signals justify investigation and identity verification. They are suspicious evidence, not automatic proof of compromise.",
    importance: "Careful triage helps analysts respond quickly without destroying evidence or overreacting to a single signal."
  },
  {
    id: "network-traffic", key: "betterHackerNetworkInvestigationComplete", icon: "🌐", title: "Network Traffic Investigation", topic: "Network Defense", difficulty: "Beginner", time: "10–12 minutes",
    objective: "Compare network connections and prioritize the strongest anomaly for investigation.",
    scenario: "An authorized monitoring tool summarized outbound connections from a training workstation.",
    concept: "Ports suggest likely services, while direction, volume, destination reputation, and baseline determine whether traffic is unusual. An uncommon port is a lead, not proof.",
    evidence: ["443/TCP · HTTPS · 18 outbound connections", "53/UDP · DNS · 7 outbound requests", "22/TCP · SSH · 2 approved admin connections", "4444/TCP · Unknown service · 96 outbound connections"],
    classify: "Compare expected service, volume, and authorization. Identify the connection that should be prioritized.",
    question: "Which connection should the analyst investigate first?", choices: ["Port 443", "Port 53", "Port 22", "Port 4444"], answer: 3,
    hint: "Look for the row combining an unknown service with unusually high outbound volume.",
    feedback: "Port 4444 with an unknown service and 96 outbound connections is the strongest anomaly. The next step is validation, not assuming maliciousness.",
    importance: "Network prioritization helps defenders focus limited time on evidence that departs most clearly from an approved baseline."
  },
  {
    id: "phishing-email", key: "betterHackerPhishingInvestigationComplete", icon: "📧", title: "Phishing Email Investigation", topic: "Email Security", difficulty: "Beginner", time: "10–12 minutes",
    objective: "Evaluate sender, language, link, and attachment indicators without interacting with them.",
    scenario: "An employee reported a simulated email. Review its displayed metadata safely; do not open its link or attachment.",
    concept: "Phishing assessments use multiple indicators: lookalike domains, urgency, unexpected attachments, and mismatched or insecure links. Reporting preserves evidence for defenders.",
    evidence: ["Sender: security@micros0ft-support.example", "Subject: URGENT: account disabled today", "Message: Verify immediately to avoid suspension", "Displayed link: http://account-verification.example", "Attachment: Account_Update.zip"],
    classify: "Classify the message as routine, likely phishing, or impossible to assess, based on the combined indicators.",
    question: "What is the best assessment and response?", choices: ["Safe—open the attachment", "Likely phishing—report it through the approved process", "Forward it widely for opinions"], answer: 1,
    hint: "Examine the substituted character in the sender, urgency, HTTP link, and unexpected ZIP file.",
    feedback: "The lookalike sender, urgency, suspicious link, and ZIP attachment support a likely-phishing classification and safe reporting.",
    importance: "Recognizing and reporting phishing can prevent credential exposure while giving responders useful evidence."
  },
  {
    id: "windows-ad", key: "betterHackerWindowsInvestigationComplete", icon: "🪟", title: "Windows / Active Directory Investigation", topic: "Identity Security", difficulty: "Beginner", time: "12–15 minutes",
    objective: "Recognize a risky privilege change and select an evidence-preserving response.",
    scenario: "You are reviewing simulated Windows identity events for an employee account.",
    concept: "A privileged-group change raises impact. Defenders correlate who changed access, the source device, authentication events, and whether the change was approved.",
    evidence: ["User: m.williams", "Time: 3:42 AM", "Failed logins: 11", "Successful login: Yes", "Group change: Added to Administrators", "Source: Unknown workstation"],
    classify: "Decide whether the evidence represents ordinary access, suspicious privilege escalation evidence, or disposable logs.",
    question: "What should the analyst do first?", choices: ["Ignore the activity", "Investigate, verify authorization, and preserve the events", "Delete the logs"], answer: 1,
    hint: "Focus on the unfamiliar device and unexpected administrator-group membership change.",
    feedback: "The login pattern and privileged-group change require prompt verification and preserved evidence. Access may also need containment under the organization’s process.",
    importance: "Unauthorized privilege can increase the impact of account misuse, so timely, documented validation matters."
  },
  {
    id: "malware", key: "betterHackerMalwareInvestigationComplete", icon: "🔎", title: "Malware Investigation", topic: "Endpoint Defense", difficulty: "Beginner", time: "12–15 minutes",
    objective: "Correlate process and network evidence and choose a safe containment-first action.",
    scenario: "A simulated endpoint alert reports unusual process behavior on an employee workstation.",
    concept: "Process name, location, parent process, and network behavior are investigation clues. Isolation can reduce risk while responders preserve and analyze evidence.",
    evidence: ["Process: invoice_update.exe", "Location: Downloads", "Parent: WINWORD.EXE", "Network: Repeated connections to an unknown server", "Alert: Suspicious executable behavior"],
    classify: "Classify the endpoint as routine, requiring isolation and investigation, or safe to allow without review.",
    question: "What is the safest next action?", choices: ["Ignore the process", "Use the approved process to isolate and investigate the workstation", "Allow the program to continue"], answer: 1,
    hint: "Connect the document parent process, downloaded executable, alert, and repeated unknown network traffic.",
    feedback: "The combined endpoint and network indicators justify approved isolation and investigation while preserving evidence.",
    importance: "Fast, controlled containment can limit spread and communication while responders determine what actually occurred."
  },
  {
    id: "brute-force", key: "betterHackerBruteForceInvestigationComplete", icon: "🔐", title: "Brute Force Investigation", topic: "Authentication Defense", difficulty: "Beginner", time: "8–10 minutes",
    objective: "Classify a rapid password-guessing pattern and identify useful response evidence.",
    scenario: "A simulated authentication report shows repeated attempts against one employee account.",
    concept: "Brute-force activity typically produces many rapid failures with varied password guesses. Analysts also check source, target scope, success events, and approved testing context.",
    evidence: ["User: a.johnson", "Failures: 86 in 4 minutes", "Source: 203.0.113.42 (documentation-only address)", "Passwords tried: Many different values", "Successful login: No"],
    classify: "Classify the pattern as phishing, brute-force behavior, or endpoint malware evidence.",
    question: "Which pattern best fits this evidence?", choices: ["Phishing", "Brute-force password guessing", "Malware execution"], answer: 1,
    hint: "Consider the rate of failed logins and the many different password guesses.",
    feedback: "The rapid failures and varied guesses match brute-force behavior. Analysts should preserve logs and follow approved account-protection procedures.",
    importance: "Early recognition supports rate limiting, account safeguards, and source investigation before a guess succeeds."
  },
  {
    id: "web-attack", key: "betterHackerWebAttackInvestigationComplete", icon: "🌐", title: "Web Attack Investigation", topic: "Web Defense", difficulty: "Beginner", time: "10–12 minutes",
    objective: "Recognize simulated SQL-injection indicators and choose a defensive response.",
    scenario: "An authorized web-monitoring system flagged repeated requests to a training login page.",
    concept: "SQL injection risk appears when untrusted values can be interpreted as query syntax. Logs can show attempts; parameterized queries keep instructions separate from data.",
    evidence: ["Target: /login.php", "Parameter: username", "Captured input: ' OR '1'='1", "Rate: 37 attempts in 2 minutes", "Source: Unknown external address"],
    classify: "Classify the request pattern by the technology it appears to manipulate; do not reproduce it against any system.",
    question: "What should the analyst investigate?", choices: ["Cross-site scripting", "SQL injection attempts and unsafe query handling", "Phishing email delivery"], answer: 1,
    hint: "The input resembles a database condition and targets a login parameter.",
    feedback: "The input is a simulated SQL-injection indicator. Defenders should review logs and ensure the application uses parameterized queries.",
    importance: "Recognizing injection attempts and fixing unsafe query construction helps protect sensitive database information."
  }
]);

function getInvestigationStatus(activity, activeId) {
  if (localStorage.getItem(activity.key) === "true") return "Completed";
  return activity.id === activeId ? "In Progress" : "Not Started";
}

function getInvestigationAction(status) {
  return status === "Completed" ? "Review Investigation" : status === "In Progress" ? "Continue Investigation" : "Start Investigation";
}

function completeInvestigation(activity) {
  if (!activity || localStorage.getItem(activity.key) === "true") return false;
  localStorage.setItem(activity.key, "true");
  return true;
}

const investigationHost = document.querySelector("#labs");
if (investigationHost) {
  INVESTIGATIONS.forEach(function (legacy) {
    const element = document.querySelector(legacy.selector);
    if (element) element.hidden = true;
  });
  const legacyProgress = investigationHost.querySelector(".investigation-progress");
  if (legacyProgress) legacyProgress.hidden = true;

  const overview = document.createElement("section");
  overview.id = "investigations-overview";
  overview.className = "investigation-overview";
  overview.setAttribute("aria-labelledby", "investigations-heading");
  const workspace = document.createElement("article");
  workspace.id = "investigation-workspace";
  workspace.className = "lab-challenge investigation-workspace";
  workspace.hidden = true;
  investigationHost.appendChild(overview);
  investigationHost.appendChild(workspace);
  let activeInvestigationId = null;

  function renderInvestigationCards() {
    const completed = INVESTIGATION_ACTIVITIES.filter(function (activity) { return localStorage.getItem(activity.key) === "true"; }).length;
    overview.innerHTML = '<p class="section-label">DEFENSIVE INVESTIGATIONS</p><h3 id="investigations-heading">Practice Evidence-Based Decisions</h3><p>Inspect safe simulated evidence, make a defensive decision, and review the reasoning.</p><p class="investigation-count" role="status" aria-live="polite">Investigations completed: ' + completed + ' / ' + INVESTIGATION_ACTIVITIES.length + '</p><div class="investigation-card-grid">' + INVESTIGATION_ACTIVITIES.map(function (activity) {
      const status = getInvestigationStatus(activity, activeInvestigationId);
      const action = getInvestigationAction(status);
      return '<article class="investigation-card"><p class="lab-topic">' + activity.topic + ' · ' + activity.difficulty + '</p><h4>' + activity.icon + ' ' + activity.title + '</h4><p>' + activity.objective + '</p><p>Estimated time: ' + activity.time + '</p><p class="lab-status lab-status-' + status.toLowerCase().replace(" ", "-") + '">Status: <strong>' + status + '</strong></p><button type="button" class="primary-button investigation-card-action" data-investigation-id="' + activity.id + '" aria-label="' + action + ': ' + activity.title + '">' + action + '</button></article>';
    }).join("") + '</div>';
  }

  function setInvestigationHash(activity) {
    if (typeof history !== "undefined" && history.pushState) history.pushState(null, "", "#investigation-" + activity.id);
    else if (typeof location !== "undefined") location.hash = "investigation-" + activity.id;
  }

  function openInvestigation(activity, updateHash) {
    if (!activity) return;
    activeInvestigationId = activity.id;
    renderInvestigationCards();
    workspace.hidden = false;
    workspace.setAttribute("data-investigation-id", activity.id);
    const options = activity.choices.map(function (choice, index) {
      return '<label class="investigation-option"><input type="radio" name="investigation-answer" value="' + index + '"><span>' + choice + '</span></label>';
    }).join("");
    workspace.innerHTML = '<a class="lab-back-link" href="#investigations-overview">← Back to investigation overview</a><p class="lab-topic">' + activity.topic + ' · ' + activity.difficulty + ' · ' + activity.time + '</p><h3 tabindex="-1">' + activity.icon + ' ' + activity.title + '</h3>' +
      '<section><h4>Learning Objective</h4><p>' + activity.objective + '</p></section><section><h4>Scenario</h4><p>' + activity.scenario + '</p></section><section><h4>What the Evidence Represents</h4><p>' + activity.concept + '</p></section>' +
      '<section><h4>Evidence to Inspect</h4><ul class="evidence-list">' + activity.evidence.map(function (item) { return '<li>' + item + '</li>'; }).join("") + '</ul></section><section><h4>Evidence Analysis</h4><p>' + activity.classify + '</p></section>' +
      '<form id="investigation-form"><fieldset><legend>' + activity.question + '</legend><div class="investigation-options">' + options + '</div></fieldset><div class="lab-actions"><button type="button" class="secondary-button" id="investigation-hint">Show Hint</button><button type="submit" class="primary-button">Submit Decision</button></div></form><div id="investigation-feedback" role="status" aria-live="polite"></div><section class="lab-why"><h4>Why This Matters in Cybersecurity</h4><p>' + activity.importance + '</p></section><div id="investigation-completion"></div>';
    if (updateHash !== false) setInvestigationHash(activity);
    companion.setContext({ type: "investigation", activityId: activity.id, topic: activity.topic + ": " + activity.title, hint: activity.hint, explanation: activity.concept, lookFor: activity.classify, submitted: false });
    const feedback = workspace.querySelector("#investigation-feedback");
    workspace.querySelector("#investigation-hint").addEventListener("click", function () { feedback.className = "feedback-review"; feedback.textContent = "Hint: " + activity.hint; });
    workspace.querySelector("#investigation-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const selected = workspace.querySelector('input[name="investigation-answer"]:checked');
      if (!selected) { feedback.className = "feedback-review"; feedback.textContent = "Choose the decision best supported by the evidence before submitting."; return; }
      if (Number(selected.value) !== activity.answer) { feedback.className = "feedback-review"; feedback.textContent = "Not quite. Re-examine how the evidence fits together, then try again."; return; }
      feedback.className = "feedback-success";
      feedback.textContent = "Educational feedback: " + activity.feedback;
      workspace.querySelectorAll('input[name="investigation-answer"]').forEach(function (input) { input.disabled = true; });
      workspace.querySelector('button[type="submit"]').disabled = true;
      companion.setContext({ submitted: true, explanation: activity.feedback });
      const completion = workspace.querySelector("#investigation-completion");
      const wasComplete = localStorage.getItem(activity.key) === "true";
      completion.innerHTML = wasComplete ? '<h4>Review Complete</h4><p>This investigation was already completed. Review does not award XP again.</p><a class="secondary-button" href="#investigations-overview">Return to Investigations</a>' : '<h4>Complete Investigation</h4><button type="button" class="primary-button" id="complete-investigation">Complete Investigation</button><a class="secondary-button" href="#investigations-overview">Return to Investigations</a>';
      const completeButton = workspace.querySelector("#complete-investigation");
      if (completeButton) completeButton.addEventListener("click", function () {
        if (!completeInvestigation(activity)) return;
        refreshLearningUI();
        renderInvestigationCards();
        const next = INVESTIGATION_ACTIVITIES.find(function (candidate) { return localStorage.getItem(candidate.key) !== "true"; });
        completion.innerHTML = '<h4>Investigation Complete</h4><p class="feedback-success">Progress, XP, achievements, badge evidence, and dashboard recommendations are updated.</p>' + (next ? '<button type="button" class="primary-button" id="next-investigation">Continue Learning: ' + next.title + '</button>' : '<a class="primary-button" href="#course-review">Continue Learning: Course Review</a>') + '<a class="secondary-button" href="#investigations-overview">Return to Investigations</a>';
        const nextButton = workspace.querySelector("#next-investigation");
        if (nextButton) nextButton.addEventListener("click", function () { openInvestigation(next, true); });
      });
    });
    const heading = workspace.querySelector("h3");
    if (heading) heading.focus();
  }

  overview.addEventListener("click", function (event) {
    const button = event.target.closest && event.target.closest(".investigation-card-action");
    if (!button) return;
    openInvestigation(INVESTIGATION_ACTIVITIES.find(function (activity) { return activity.id === button.getAttribute("data-investigation-id"); }), true);
  });
  function openInvestigationFromHash() {
    const hash = typeof location !== "undefined" ? location.hash : "";
    const activity = INVESTIGATION_ACTIVITIES.find(function (candidate) { return hash === "#investigation-" + candidate.id; });
    if (activity) openInvestigation(activity, false);
    if (hash === "#investigations-overview") { workspace.hidden = true; activeInvestigationId = null; renderInvestigationCards(); }
  }
  if (typeof window !== "undefined") window.addEventListener("hashchange", openInvestigationFromHash);
  renderInvestigationCards();
  openInvestigationFromHash();
}

/* =========================
   WAITLIST SIGNUP
========================= */

/* =========================
   LEARNER DASHBOARD & COURSE REVIEW
========================= */

const COURSE_REVIEW_QUESTIONS = [
  {
    id: "fundamentals-least-privilege",
       type: "choice", topic: "Cybersecurity Fundamentals", lesson: "#fundamentals-lesson",
    scenario: "A teammate needs access to one shared project folder, but asks for an administrator account because it is faster.",
    prompt: "What is the safest response?",
    options: ["Give temporary administrator access", "Grant only the folder permission needed", "Share your own account", "Disable authentication for the folder"], answer: 1,
    why: "Least privilege means granting only the access needed for the task.",
    misconception: "Administrator access is tempting for convenience, but it unnecessarily increases the impact of mistakes or account compromise."
  },
  {
    id: "networking-dns-resolution",
       type: "choice", topic: "Networking", lesson: "#networking-lesson",
    scenario: "A browser can reach a training site by IP address but not by its domain name.",
    prompt: "Which service should you check first?",
    options: ["DNS", "Bluetooth", "File permissions", "Disk encryption"], answer: 0,
    why: "DNS translates domain names into IP addresses, so this symptom points first to name resolution.",
    misconception: "The web server may be working because its IP responds; changing file permissions would not repair domain lookup."
  },
  {
    id: "linux-current-directory",
       type: "short", topic: "Linux", lesson: "#linux-lesson",
    scenario: "You are in an authorized practice terminal and need to confirm your current directory before opening a file.",
    prompt: "Which Linux command should you run?", answers: ["pwd", "/bin/pwd"], displayAnswer: "pwd",
    why: "pwd prints the full path of the current working directory.",
    misconception: "Commands such as ls show directory contents, but do not directly answer which directory you are in."
  },
  {
    id: "web-parameterized-queries",
       type: "choice", topic: "Web Security", lesson: "#web-security-lesson",
    scenario: "A developer builds a database query by directly joining it with text submitted in a login form.",
    prompt: "What is the most appropriate defensive improvement?",
    options: ["Hide the login button", "Use parameterized queries and validate input", "Move the form lower on the page", "Publish the database password"], answer: 1,
    why: "Parameterized queries keep submitted values separate from SQL instructions; validation adds another useful control.",
    misconception: "Changing the interface does not address unsafe query construction and can create a false sense of security."
  },
  {
    id: "cryptography-password-hashing",
       type: "choice", topic: "Cryptography", lesson: "#cryptography-lesson",
    scenario: "A service must verify passwords without needing to recover the original passwords.",
    prompt: "Which approach is most appropriate?",
    options: ["Store plaintext", "Use reversible encryption with a public key", "Store salted password hashes", "Put passwords in filenames"], answer: 2,
    why: "A unique salt and a suitable password-hashing function allow verification without storing recoverable passwords.",
    misconception: "Reversible encryption still creates a key that could expose every password if compromised."
  },
  {
    id: "active-directory-access-review",
       type: "choice", topic: "Active Directory", lesson: "#active-directory-lesson",
    scenario: "An employee changes departments and no longer needs access to finance resources.",
    prompt: "What should an administrator do next?",
    options: ["Leave access indefinitely", "Review group membership and remove unneeded access", "Delete all finance files", "Give the employee a second account"], answer: 1,
    why: "Reviewing group membership applies least privilege while preserving the employee's legitimate account needs.",
    misconception: "Leaving historical access is convenient, but creates unnecessary risk as roles change."
  },
  {
    id: "soc-alert-validation",
       type: "choice", topic: "SOC & SIEM", lesson: "#soc-siem-lesson",
    scenario: "A SIEM alert reports many failed logins followed by one success from an unfamiliar location.",
    prompt: "What would you do next?",
    options: ["Immediately erase every log", "Validate the alert using related authentication and account activity", "Ignore it because one login succeeded", "Post the username publicly"], answer: 1,
    why: "Correlating related logs and context helps determine whether the alert represents account compromise before responding.",
    misconception: "A successful login after repeated failures can increase concern; ignoring it would discard an important signal."
  },
  {
    id: "testing-authorization",
       type: "choice", topic: "Security Testing", lesson: "#security-testing-lesson",
    scenario: "You discover a public website that looks interesting to scan for weaknesses.",
    prompt: "Which action is appropriate?",
    options: ["Scan it quietly", "Get explicit authorization and a defined scope first", "Test only late at night", "Ask a friend to scan it"], answer: 1,
    why: "Security testing requires explicit permission and an agreed scope before any testing begins.",
    misconception: "Low visibility or using someone else does not replace authorization and can still cause harm."
  },
  {
    id: "fundamentals-confidentiality",
       type: "choice", topic: "Cybersecurity Fundamentals", lesson: "#fundamentals-lesson",
    scenario: "A laptop containing confidential work is stolen, but its storage was strongly encrypted and the key was protected.",
    prompt: "Which part of the CIA triad did encryption primarily support?",
    options: ["Confidentiality", "Availability", "Convenience", "Performance"], answer: 0,
    why: "Encryption primarily protects confidentiality by making data unreadable without the key.",
    misconception: "Encryption can support a broader security plan, but it does not make a stolen laptop more available."
  },
  {
    id: "networking-https",
       type: "short", topic: "Networking", lesson: "#networking-lesson",
    scenario: "An approved inventory lists a web service using encrypted browser connections on its standard port.",
    prompt: "What protocol should appear in the inventory?", answers: ["https", "https protocol", "the https protocol", "https/tls", "https tls", "https://"], displayAnswer: "HTTPS",
    why: "HTTPS protects browser-to-server HTTP traffic with TLS.",
    misconception: "HTTP alone does not provide the encrypted transport described in the scenario."
  },
  {
    id: "linux-file-permissions",
       type: "choice", topic: "Linux", lesson: "#linux-lesson",
    scenario: "A script only needs to be read by its service account, but it is writable by every user.",
    prompt: "What is the safest general next step?",
    options: ["Review ownership and reduce permissions to what is required", "Make every file world-writable", "Disable logging", "Publish the script"], answer: 0,
    why: "Reviewing ownership and tightening permissions reduces unauthorized modification while keeping required access.",
    misconception: "Broad write permission may feel easier, but lets unrelated accounts alter the script."
  },
  {
    id: "web-object-authorization",
       type: "choice", topic: "Web Security", lesson: "#web-security-lesson",
    scenario: "A signed-in learner changes an ID in a URL and can view another learner's private record.",
    prompt: "Which control is most important to add?",
    options: ["A brighter error page", "Server-side authorization for every record request", "A longer URL", "Client-side hiding only"], answer: 1,
    why: "The server must verify that the signed-in user is authorized to access the requested object every time.",
    misconception: "Hiding links in the browser does not stop a user from requesting a changed URL directly."
  },
  {
    id: "cryptography-integrity-hash",
       type: "choice", topic: "Cryptography", lesson: "#cryptography-lesson",
    scenario: "You downloaded a legitimate training image and want to check whether the file changed during transfer.",
    prompt: "What should you compare?",
    options: ["Screen brightness", "A trusted published hash", "The filename length", "The folder color"], answer: 1,
    why: "Matching a freshly calculated hash to a trusted published value provides an integrity check.",
    misconception: "A filename can remain the same even when file contents have been altered."
  },
  {
    id: "soc-containment",
       type: "choice", topic: "SOC & SIEM", lesson: "#soc-siem-lesson",
    scenario: "Investigation confirms a workstation is communicating with known malicious infrastructure.",
    prompt: "What is the safest immediate response among these choices?",
    options: ["Contain the workstation using the approved incident plan", "Delete all company backups", "Announce unverified details", "Keep it connected for convenience"], answer: 0,
    why: "Approved containment limits further harm while preserving a coordinated investigation and response.",
    misconception: "Leaving a confirmed affected device connected prioritizes convenience over limiting impact."
  }
];

function isReviewAnswerCorrect(question, value) {
  if (question.type === "choice") return Number(value) === question.answer;
  const normalized = String(value).trim().toLowerCase().replace(/[.!?]+$/, "");
  return question.answers.includes(normalized);
}

function countCompleted(keys) {
  return keys.filter(function (key) { return localStorage.getItem(key) === "true"; }).length;
}

function readReviewResult() {
  try {
    const result = JSON.parse(localStorage.getItem(COURSE_REVIEW_STORAGE_KEY));
    if (!result || result.completed !== true || !Number.isInteger(result.score) ||
        result.total !== COURSE_REVIEW_QUESTIONS.length || result.score < 0 || result.score > result.total ||
        result.percentage !== Math.round((result.score / result.total) * 100) ||
        typeof result.completedAt !== "string" || !Number.isFinite(Date.parse(result.completedAt)) ||
        !result.topics || typeof result.topics !== "object" || Array.isArray(result.topics)) return null;
    const topicDefinitions = {};
    COURSE_REVIEW_QUESTIONS.forEach(function (question) {
      if (!topicDefinitions[question.topic]) topicDefinitions[question.topic] = { total: 0, lesson: question.lesson };
      topicDefinitions[question.topic].total++;
    });
    const topicEntries = Object.entries(result.topics);
    if (topicEntries.length !== Object.keys(topicDefinitions).length || topicEntries.some(function (entry) {
      const topic = entry[0];
      const value = entry[1];
      const expected = topicDefinitions[topic];
      return !expected || !value || !Number.isInteger(value.correct) || value.total !== expected.total ||
        value.correct < 0 || value.correct > value.total || value.lesson !== expected.lesson;
    })) return null;
    return result;
  } catch (error) {
    return null;
  }
}

function getDashboardState() {
  const lessonsCompleted = countCompleted(LESSON_PROGRESS.map(function (lesson) { return lesson.key; }));
  const exercisesCompleted = readCompletedLabs();
  const investigationsCompleted = countCompleted(INVESTIGATIONS.map(function (investigation) { return investigation.key; }));
  const reviewResult = readReviewResult();
  let recommendation;
  const nextLesson = LESSON_PROGRESS.find(function (lesson) { return localStorage.getItem(lesson.key) !== "true"; });

  if (nextLesson) {
    recommendation = { target: nextLesson.target, label: "Continue Learning: " + nextLesson.name };
  } else if (exercisesCompleted < GUIDED_EXERCISE_TOTAL) {
    recommendation = { target: "#lab-" + GUIDED_LABS[exercisesCompleted].id, label: "Lessons Complete — Continue Guided Exercises: " + GUIDED_LABS[exercisesCompleted].title };
  } else if (investigationsCompleted < INVESTIGATIONS.length) {
    const nextInvestigation = INVESTIGATION_ACTIVITIES.find(function (activity) { return localStorage.getItem(activity.key) !== "true"; });
    recommendation = { target: "#investigation-" + nextInvestigation.id, label: "Continue Investigation: " + nextInvestigation.title };
  } else if (!reviewResult) {
    recommendation = { target: "#course-review", label: "Start the Course Review" };
  } else {
    recommendation = { target: "#course-review", label: "Course Complete — Review Course Again" };
  }

  return { lessonsCompleted: lessonsCompleted, exercisesCompleted: exercisesCompleted, investigationsCompleted: investigationsCompleted, reviewResult: reviewResult, recommendation: recommendation };
}

function buildRetentionSnapshot() {
  const dashboard = getDashboardState();
  const completedKeys = new Set();
  LESSON_PROGRESS.forEach(function (item) { if (localStorage.getItem(item.key) === "true") completedKeys.add(item.key); });
  INVESTIGATIONS.forEach(function (item) { if (localStorage.getItem(item.key) === "true") completedKeys.add(item.key); });
  return Object.assign({}, dashboard, { completedKeys: completedKeys, daily: RetentionState.readDailyState(localStorage) });
}

function renderRetentionSummary() {
  const snapshot = buildRetentionSnapshot();
  const xp = RetentionState.deriveXp(snapshot, snapshot.daily);
  const level = RetentionState.getLevel(xp);
  const achievements = Milestones.evaluateAchievements(snapshot);
  const badges = Milestones.evaluateBadges(snapshot);
  const set = function (selector, value) { const element=document.querySelector(selector); if (element) element.textContent=value; };
  set("#dashboard-xp", xp + " XP");
  set("#dashboard-level", "Level " + level.level + " — " + level.name);
  const today=RetentionState.localDateKey(new Date());
  const dailyComplete=snapshot.daily.records.some(function(record){return record.date===today;});
  set("#dashboard-daily", dailyComplete ? "Daily challenge completed" : "Daily challenge available");
  set("#dashboard-streak", "Current streak: " + snapshot.daily.currentStreak + " days");
  set("#dashboard-longest-streak", "Longest streak: " + snapshot.daily.longestStreak + " days");
  set("#dashboard-achievements", achievements.filter(function (a) { return a.earned; }).length + " achievements");
  set("#dashboard-badges", badges.filter(function (b) { return b.earned; }).length + " skill badges");
  const progress=document.querySelector("#level-progress");
  const fill=document.querySelector("#level-progress-fill");
  if (progress) progress.setAttribute("aria-valuenow", String(level.progress));
  if (fill) fill.style.width=level.progress + "%";
  set("#level-progress-text", level.next ? level.xpToNext + " XP to " + level.next.name : "Top current level — more progression will be added");
  const achievementList=document.querySelector("#achievements-list");
  if (achievementList) achievementList.innerHTML=achievements.map(function (a) { return '<article class="milestone ' + (a.earned?'earned':'locked') + '"><strong>' + a.name + '</strong><span>' + (a.earned?'Earned':'Locked') + '</span><p>' + a.description + '</p></article>'; }).join("");
  const badgeList=document.querySelector("#skill-badges-list");
  if (badgeList) badgeList.innerHTML=badges.map(function (b) { return '<article class="milestone ' + (b.earned?'earned':'locked') + '"><strong>' + b.name + '</strong><span>' + (b.earned?'Earned':'In progress — '+b.completed+'/'+b.total+' requirements') + '</span><p>' + b.requirement + '</p><ul>' + b.evidence.map(function(e){return '<li>'+e+'</li>';}).join('') + '</ul></article>'; }).join("");
  const skillsSummary=document.querySelector("#skills-summary");
  if (skillsSummary) skillsSummary.textContent=achievements.filter(function(a){return a.earned;}).length + " of " + achievements.length + " achievements and " + badges.filter(function(b){return b.earned;}).length + " of " + badges.length + " skill badges earned.";
  return { snapshot:snapshot, xp:xp, level:level, achievements:achievements, badges:badges };
}

function renderDashboard() {
  const state = getDashboardState();
  const setText = function (selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  setText("#dashboard-lessons", state.lessonsCompleted + " / " + LESSON_PROGRESS.length + " completed");
  setText("#dashboard-exercises", state.exercisesCompleted + " / " + GUIDED_EXERCISE_TOTAL + " completed");
  setText("#dashboard-investigations", state.investigationsCompleted + " / " + INVESTIGATIONS.length + " completed");
  setText("#dashboard-review-status", state.reviewResult ? "Completed — " + state.reviewResult.score + " / " + state.reviewResult.total + " (" + state.reviewResult.percentage + "%)" : "Not Started");

  const next = document.querySelector("#dashboard-next");
  if (next) next.innerHTML = '<strong>Recommended next action</strong><a class="primary-button" href="' + state.recommendation.target + '">' + state.recommendation.label + '</a>';

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
  reviewResults.innerHTML = '<h3>Course Review Complete</h3><p class="review-score"><strong>' + reviewScore + ' / ' + total + '</strong><span>' + percentage + '%</span></p>' +
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
function renderDailyChallenge() {
  if (!dailyCard) return;
  const dateKey = RetentionState.localDateKey(new Date());
  const challenge = DailyChallenges.challengeForDate(dateKey);
  const state = RetentionState.readDailyState(localStorage);
  const completed = state.records.some(function (record) { return record.date === dateKey && record.challengeId === challenge.id; });
  dailyCard.innerHTML = '<p class="review-topic">' + challenge.topic + '</p><h3>' + challenge.title + '</h3><p>' + challenge.scenario + '</p>' +
    '<p><strong>Reward:</strong> ' + challenge.xp + ' XP</p><fieldset><legend>Choose the safest answer</legend><div class="review-answers">' + challenge.choices.map(function(choice,index){return '<label class="review-option"><input type="radio" name="daily-answer" value="'+index+'">'+choice+'</label>';}).join('') + '</div></fieldset>' +
    '<div class="daily-actions"><button type="button" class="primary-button" id="daily-submit">Submit Answer</button><button type="button" class="secondary-button" id="daily-hint">Hint</button></div><div id="daily-feedback" role="status" aria-live="polite"></div>' +
    (completed?'<p class="activity-complete-badge">✓ Completed today — XP already awarded. You may review it again.</p>':'');
  companion.setContext({ type:"daily", topic:challenge.topic, hint:challenge.hint, explanation:challenge.explanation, submitted:false });
  const submit=dailyCard.querySelector("#daily-submit"), hint=dailyCard.querySelector("#daily-hint"), feedback=dailyCard.querySelector("#daily-feedback");
  hint.addEventListener("click",function(){feedback.textContent="Hint: "+challenge.hint; companion.setContext({hint:challenge.hint});});
  submit.addEventListener("click",function(){
    const selected=dailyCard.querySelector('input[name="daily-answer"]:checked');
    if(!selected){feedback.textContent="Choose an answer before submitting.";return;}
    if(!DailyChallenges.isCorrect(challenge,selected.value)){feedback.textContent="Not quite yet. "+challenge.hint;companion.setContext({submitted:true});return;}
    const result=RetentionState.completeDailyChallenge(state,dateKey,challenge.id,challenge.xp);
    if(result.awarded)localStorage.setItem(RetentionState.DAILY_KEY,JSON.stringify(result.state));
    feedback.textContent="✓ Correct. "+challenge.explanation+(result.awarded?" You earned "+challenge.xp+" XP.":" Today’s XP was already awarded.");
    companion.setContext({submitted:true,explanation:challenge.explanation});
    renderDailyChallenge(); renderDashboard();
  });
}
renderDailyChallenge();

document.querySelectorAll(".lesson-card").forEach(function(card){card.addEventListener("click",function(){companion.setContext({type:"lesson",topic:card.querySelector("h3").textContent,submitted:false});});});
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
          "Reset all Better Hacker learning, Daily Challenge, XP, streak, achievement, and skill badge progress?"
        );

      if (!confirmed) {
        return;
      }

      Object.keys(localStorage).forEach(
        function (key) {

          if (
            key.startsWith("betterHacker") &&
            key !== "betterHackerWaitlistEmail"
          ) {
            localStorage.removeItem(key);
          }

        }
      );

      location.reload();
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
      localStorage.setItem("betterHackerWaitlistEmail", email);
      waitlistResult.textContent = "✓ You’re confirmed on the Better Hacker early-access list.";
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
