// Better Hacker Interactive Features

document.addEventListener("DOMContentLoaded", function () {

  // Welcome message
  const startButton = document.querySelector(".primary-button");

  if (startButton) {
    startButton.addEventListener("click", function () {
      console.log("Welcome to Better Hacker!");
    });
  }


  // Lab Challenge System

  const labSection = document.querySelector("#labs");

  if (labSection) {

    const labButton = document.createElement("button");

    labButton.textContent = "Start Linux Challenge";
    labButton.className = "primary-button lab-start-button";

    labSection.appendChild(labButton);


    labButton.addEventListener("click", function () {

      const existingChallenge = document.querySelector(".lab-challenge");

      if (existingChallenge) {
        existingChallenge.remove();
        return;
      }


      const challenge = document.createElement("div");

      challenge.className = "lab-challenge";

      challenge.innerHTML = `
        <h3>🧪 Linux Basics Challenge</h3>

        <p>
          You are working inside a simulated Linux environment.
          A file named <strong>flag.txt</strong> is located in your
          current directory.
        </p>

        <p>
          Which Linux command would you use to display the contents
          of the file?
        </p>

        <input
          type="text"
          id="lab-answer"
          placeholder="Type your answer..."
          autocomplete="off"
        >

        <button id="submit-answer" class="primary-button">
          Submit Answer
        </button>

        <p id="lab-result"></p>
      `;


      labSection.appendChild(challenge);


      const submitButton =
        document.querySelector("#submit-answer");

      const answerInput =
        document.querySelector("#lab-answer");

      const result =
        document.querySelector("#lab-result");


      submitButton.addEventListener("click", function () {

        const answer = answerInput.value
          .trim()
          .toLowerCase();


        if (answer === "cat flag.txt") {

          result.textContent =
            "✅ Correct! You used the cat command to read the file.";

          result.style.color = "#38bdf8";

        } else {

          result.textContent =
            "❌ Not quite. Think about the Linux command used to display a file.";

          result.style.color = "#f87171";
        }

      });

    });

  }

});
