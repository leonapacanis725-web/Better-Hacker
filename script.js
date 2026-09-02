// Better Hacker Interactive Features

document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     CYBERSECURITY LAB SYSTEM
  ========================= */

  const labSection = document.querySelector("#labs");

  if (labSection) {

    const labButton = document.createElement("button");

    labButton.textContent = "Start Cybersecurity Labs";
    labButton.className = "primary-button lab-start-button";

    labSection.appendChild(labButton);

    const progress = document.createElement("p");

    progress.id = "lab-progress";
    progress.textContent = "Labs Completed: 0 / 4";
    progress.style.marginTop = "20px";
    progress.style.color = "#38bdf8";

    labSection.appendChild(progress);

    let completedLabs =
  parseInt(localStorage.getItem("betterHackerCompletedLabs")) || 0;

let currentLab = completedLabs;

progress.textContent =
  `Labs Completed: ${completedLabs} / 4`;

if (completedLabs >= 4) {
  labButton.textContent = "View Completed Labs";
} else if (completedLabs > 0) {
  labButton.textContent = `Continue Lab ${completedLabs + 1}`;
}

    const labs = [

      {
        title: "🧪 Lab 1 — Linux Basics",

        question:
          "Which Linux command displays the contents of a file named flag.txt?",

        answer: "cat flag.txt",

        success:
          "Correct! The cat command can display the contents of a file.",

        hint:
          "Think about the Linux command used to read a text file."
      },

      {
        title: "🌐 Lab 2 — Network Recon",

        question:
          "A simulated Nmap scan shows ports 22, 80, and 443 open. Which port is commonly associated with HTTP?",

        answer: "80",

        success:
          "Correct! Port 80 is commonly associated with HTTP.",

        hint:
          "HTTP commonly uses a well-known port below 100."
      },

      {
        title: "🔐 Lab 3 — Cryptography",

        question:
          "Which security concept transforms readable data into an unreadable form using encryption?",

        answer: "encryption",

        success:
          "Correct! Encryption transforms plaintext into ciphertext.",

        hint:
          "This protects information so unauthorized people cannot easily read it."
      },

      {
        title: "🛡️ Lab 4 — Web Security",

        question:
          "A website accepts user input and places it directly into a database query. What type of vulnerability could this create?",

        answer: "sql injection",

        success:
          "Correct! Unsafe database input can create a SQL injection vulnerability.",

        hint:
          "Think about attacks involving database queries."
      }

    ];

    labButton.addEventListener("click", function () {

      const existingChallenge =
        document.querySelector(".lab-challenge");

      if (existingChallenge) {
        existingChallenge.remove();
      }

      if (currentLab >= labs.length) {

        const finished = document.createElement("div");

        finished.className = "lab-challenge";

        finished.innerHTML = `
          <h3>🎉 All Labs Completed!</h3>
          <p>
            You completed all four Better Hacker beginner challenges.
          </p>
          <p>
            Keep learning and continue building your cybersecurity skills.
          </p>
        `;

        labSection.appendChild(finished);

        return;
      }

      const lab = labs[currentLab];

      const challenge = document.createElement("div");

      challenge.className = "lab-challenge";

      challenge.innerHTML = `
        <h3>${lab.title}</h3>

        <p>${lab.question}</p>

        <input
          type="text"
          id="lab-answer"
          placeholder="Type your answer..."
          autocomplete="off"
        >

        <br>

        <button id="submit-answer" class="primary-button">
          Submit Answer
        </button>

        <button id="hint-button" class="secondary-button">
          Hint
        </button>

        <p id="lab-result"></p>
      `;

      labSection.appendChild(challenge);

      const submitButton =
        document.querySelector("#submit-answer");

      const hintButton =
        document.querySelector("#hint-button");

      const answerInput =
        document.querySelector("#lab-answer");

      const result =
        document.querySelector("#lab-result");

      submitButton.addEventListener("click", function () {

        const answer =
          answerInput.value.trim().toLowerCase();

        if (answer === lab.answer) {

          result.textContent = "✅ " + lab.success;
          result.style.color = "#38bdf8";

completedLabs++;
currentLab++;

localStorage.setItem(
  "betterHackerCompletedLabs",
  completedLabs
);

progress.textContent =
  `Labs Completed: ${completedLabs} / ${labs.length}`;

          submitButton.disabled = true;
          answerInput.disabled = true;

          setTimeout(function () {

            challenge.remove();

            if (currentLab < labs.length) {

              labButton.textContent =
                `Start Lab ${currentLab + 1}`;

            } else {

              labButton.textContent =
                "View Completed Labs";

            }

          }, 1200);

        } else {

          result.textContent =
            "❌ Not quite. Try again.";

          result.style.color = "#f87171";
        }

      });

      hintButton.addEventListener("click", function () {

        result.textContent =
          "💡 Hint: " + lab.hint;

        result.style.color = "#facc15";

      });

    });

  }


  /* =========================
     BETTER HACKER AI COACH
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
          <strong>Better Hacker Coach</strong>
          <span class="coach-online">Ready to help</span>
        </div>

        <p class="coach-question">
          What would you like help with?
        </p>

        <div class="coach-topics">

          <button class="coach-topic" data-topic="linux">
            🐧 Linux
          </button>

          <button class="coach-topic" data-topic="networking">
            🌐 Networking
          </button>

          <button class="coach-topic" data-topic="crypto">
            🔐 Cryptography
          </button>

          <button class="coach-topic" data-topic="web">
            🌎 Web Security
          </button>

          <button class="coach-topic" data-topic="soc">
            🛡️ SOC / SIEM
          </button>

          <button class="coach-topic" data-topic="labs">
            🧪 Labs
          </button>

        </div>

        <div id="coach-response" class="coach-response">

          <p>
            Select a topic and I'll give you a beginner-friendly
            explanation and a suggested next step.
          </p>

        </div>

      `;

      coachBox.appendChild(coachInterface);


      const responses = {

        linux: {
          title: "🐧 Linux",

          text:
            "Linux is important in cybersecurity because many servers, security tools, and cloud systems use it.",

          next:
            "Next step: practice commands such as pwd, ls, cd, cat, grep, and find."
        },

        networking: {
          title: "🌐 Networking",

          text:
            "Networking is the foundation of cybersecurity. Understanding IP addresses, ports, protocols, DNS, TCP, and HTTP makes security concepts much easier to understand.",

          next:
            "Next step: learn what an IP address, port, and protocol do."
        },

        crypto: {
          title: "🔐 Cryptography",

          text:
            "Cryptography protects information through techniques such as encryption, hashing, and digital signatures.",

          next:
            "Next step: learn the difference between encryption and hashing."
        },

        web: {
          title: "🌎 Web Security",

          text:
            "Web security focuses on protecting websites and applications from vulnerabilities involving authentication, input validation, sessions, databases, and more.",

          next:
            "Next step: study the OWASP Top 10 and learn why input validation matters."
        },

        soc: {
          title: "🛡️ SOC / SIEM",

          text:
            "A Security Operations Center monitors systems for suspicious activity. SIEM platforms help security teams collect and analyze logs and security events.",

          next:
            "Next step: learn what logs are and why security analysts investigate them."
        },

        labs: {
          title: "🧪 Better Hacker Labs",

          text:
            "Hands-on practice helps turn cybersecurity knowledge into practical skills. Start with the Linux lab and work through the challenges in order.",

          next:
            "Next step: go to Hands-On Practice and complete Lab 1."
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

  const lessonKeys = [
    "betterHackerFundamentalsComplete",
    "betterHackerNetworkingComplete",
    "betterHackerLinuxComplete",
    "betterHackerWebSecurityComplete",
    "betterHackerCryptographyComplete",
    "betterHackerActiveDirectoryComplete",
    "betterHackerSocComplete",
    "betterHackerSecurityTestingComplete"
  ];

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
      `${completedLessons} / 8 Lessons Completed`;
  }

  if (progressFill) {
    const percentage =
      (completedLessons / 8) * 100;

    progressFill.style.width =
      `${percentage}%`;
  }
}

updateCourseProgress();
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

      updateCourseProgress();

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

  updateCourseProgress();
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

      updateCourseProgress();

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

      updateCourseProgress();

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

      updateCourseProgress();

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

      updateCourseProgress();

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

      updateCourseProgress();

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
   SOC ALERT INVESTIGATION LAB
========================= */

const socLabSection = document.querySelector("#labs");

if (socLabSection) {

  const socInvestigation = document.createElement("div");

  socInvestigation.className = "lab-challenge soc-investigation-lab";

  socInvestigation.innerHTML = `

    <h3>🛡️ SOC Alert Investigation</h3>

    <p>
      You are a SOC analyst reviewing a suspicious login alert.
      Examine the activity below and decide what should happen next.
    </p>

    <div class="command-list">

      <div class="command-item">
        <code>User</code>
        <span>j.smith</span>
      </div>

      <div class="command-item">
        <code>Login Time</code>
        <span>2:14 AM</span>
      </div>

      <div class="command-item">
        <code>Location</code>
        <span>Detroit, Michigan</span>
      </div>

      <div class="command-item">
        <code>Failed Attempts</code>
        <span>14</span>
      </div>

      <div class="command-item">
        <code>Successful Login</code>
        <span>Yes — after the failed attempts</span>
      </div>

      <div class="command-item">
        <code>Device</code>
        <span>Unknown device</span>
      </div>

    </div>

    <p>
      <strong>Question:</strong>
      Which action is the best next step for the SOC analyst?
    </p>

    <div class="soc-answer-options">

      <button
        class="secondary-button soc-answer"
        data-answer="ignore"
      >
        Ignore the alert
      </button>

      <button
        class="secondary-button soc-answer"
        data-answer="investigate"
      >
        Investigate the login activity
      </button>

      <button
        class="secondary-button soc-answer"
        data-answer="delete"
      >
        Delete the security logs
      </button>

    </div>

    <p id="soc-lab-result"></p>

  `;

  socLabSection.appendChild(socInvestigation);

  const socAnswerButtons =
    socInvestigation.querySelectorAll(".soc-answer");

  const socLabResult =
    socInvestigation.querySelector("#soc-lab-result");

  socAnswerButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const answer = button.dataset.answer;

      if (answer === "investigate") {

        socLabResult.textContent =
          "✅ Correct! Multiple failed logins followed by a successful login from an unknown device should be investigated.";

        socLabResult.style.color = "#38bdf8";

        localStorage.setItem(
          "betterHackerSocInvestigationComplete",
          "true"
        );

      } else {

        socLabResult.textContent =
          "❌ Not quite. Look at the failed login attempts, successful login, and unknown device.";

        socLabResult.style.color = "#f87171";

      }

    });

  });

}
/* =========================
   NETWORK TRAFFIC INVESTIGATION LAB
========================= */

const networkTrafficSection = document.querySelector("#labs");

if (networkTrafficSection) {

  const networkInvestigation = document.createElement("div");

  networkInvestigation.className =
    "lab-challenge network-investigation-lab";

  networkInvestigation.innerHTML = `

    <h3>🌐 Network Traffic Investigation</h3>

    <p>
      You are reviewing network traffic from a workstation.
      Examine the activity below and identify the most suspicious connection.
    </p>

    <div class="command-list">

      <div class="command-item">
        <code>Connection 1</code>
        <span>Port 443 — HTTPS — 18 connections</span>
      </div>

      <div class="command-item">
        <code>Connection 2</code>
        <span>Port 53 — DNS — 7 connections</span>
      </div>

      <div class="command-item">
        <code>Connection 3</code>
        <span>Port 22 — SSH — 2 connections</span>
      </div>

      <div class="command-item">
        <code>Connection 4</code>
        <span>Port 4444 — Unknown service — 96 outbound connections</span>
      </div>

    </div>

    <p>
      <strong>Question:</strong>
      Which connection should the analyst investigate first?
    </p>

    <div class="network-answer-options">

      <button
        class="secondary-button network-answer"
        data-answer="443"
      >
        Port 443
      </button>

      <button
        class="secondary-button network-answer"
        data-answer="53"
      >
        Port 53
      </button>

      <button
        class="secondary-button network-answer"
        data-answer="22"
      >
        Port 22
      </button>

      <button
        class="secondary-button network-answer"
        data-answer="4444"
      >
        Port 4444
      </button>

    </div>

    <p id="network-investigation-result"></p>

  `;

  networkTrafficSection.appendChild(networkInvestigation);

  const networkAnswerButtons =
    networkInvestigation.querySelectorAll(".network-answer");

  const networkInvestigationResult =
    networkInvestigation.querySelector(
      "#network-investigation-result"
    );

  networkAnswerButtons.forEach(function (button) {

    button.addEventListener("click", function () {

      const answer = button.dataset.answer;

      if (answer === "4444") {

        networkInvestigationResult.textContent =
          "✅ Correct! Port 4444 with an unknown service and 96 outbound connections is unusual and should be investigated.";

        networkInvestigationResult.style.color =
          "#38bdf8";

        localStorage.setItem(
          "betterHackerNetworkInvestigationComplete",
          "true"
        );

      } else {

        networkInvestigationResult.textContent =
          "❌ Not quite. Look for the connection with unusual traffic volume and an unknown service.";

        networkInvestigationResult.style.color =
          "#f87171";

      }

    }

  });

}

});
