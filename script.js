// Better Hacker Interactive Lab System

document.addEventListener("DOMContentLoaded", function () {

  const labSection = document.querySelector("#labs");

  if (!labSection) return;

  const labButton = document.createElement("button");

  labButton.textContent = "Start Cybersecurity Labs";
  labButton.className = "primary-button lab-start-button";

  labSection.appendChild(labButton);

  // Progress display
  const progress = document.createElement("p");
  progress.id = "lab-progress";
  progress.textContent = "Labs Completed: 0 / 4";
  progress.style.marginTop = "20px";
  progress.style.color = "#38bdf8";

  labSection.appendChild(progress);

  let completedLabs = 0;

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

  let currentLab = 0;

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

        progress.textContent =
          `Labs Completed: ${completedLabs} / ${labs.length}`;

        currentLab++;

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

});
