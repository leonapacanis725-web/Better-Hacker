# Better Hacker

Better Hacker is a static, dependency-light beginner cybersecurity learning prototype. It contains eight guided lessons, four guided exercises, seven defensive investigations, a local Learner Dashboard, a rule-based Learning Assistant / Topic Guide, and a Course Review.

## Course Review

The **Beginner Cybersecurity Assessment** is a 14-question, one-question-at-a-time review spanning Cybersecurity Fundamentals, Networking, Linux, Web Security, Cryptography, Active Directory, SOC & SIEM, and Security Testing. It mixes multiple choice, short answers, beginner scenarios, and safe-next-action decisions.

Unlike the knowledge check inside an individual lesson, the Course Review asks learners to connect and apply ideas across the curriculum. An answer is not revealed until the learner submits an attempt. Each response then explains the best answer, addresses a tempting misconception, and links to the relevant lesson. The final view shows the score, percentage, stronger topics, topics worth revisiting, direct lesson links, and a **Review Again** action. Results are descriptive and do not create a pass/fail label.

## Guided labs

The four existing guided exercises are presented as clickable Linux, Networking, Cryptography, and Web Security lab cards. Each opens a hash-addressable, keyboard-friendly lesson with an authored scenario, concept briefing, simulated evidence, task, hint, answer feedback, defensive relevance, and a next activity. Lab completion continues to use the original sequential `betterHackerCompletedLabs` value; no parallel completion store is introduced, and reviewing a completed lab cannot award XP again. Byte receives the current lab topic and authored guidance while withholding answer-level feedback until submission.

## Progress and local storage

Progress remains local to the learner's browser; there are no accounts or cloud sync. Existing lesson, guided-exercise, investigation, and confirmed waitlist keys are preserved. Course Review adds one key:

- `betterHackerCourseReviewResult`: JSON containing the most recent completed review's score, total, percentage, completion timestamp, and per-topic result summary.

The review is an additional activity—not a ninth lesson—so core lesson progress remains **0–8 / 8**. The dashboard separately reports lessons, **4** guided exercises, **7** investigations, and Course Review status. Its recommendation advances from incomplete lessons, to exercises, to investigations, to the Course Review. Once everything is complete it offers a course review action.

Completing the review unlocks the progress-derived **Knowledge Checkpoint** achievement. It is based on completion, not a score threshold.

## Reset behavior

**Reset Learning Progress** removes Better Hacker lesson, exercise, investigation, Course Review, and Daily Challenge state, including `betterHackerCourseReviewResult` and `betterHackerDailyChallengeState`. Derived XP, levels, achievements, and badges reset with their underlying evidence. It deliberately preserves `betterHackerWaitlistEmail` and does not clear unrelated local storage.

## Running checks

The site has no build step. Open `index.html` in a browser, or serve the directory with a simple static server. Run the dependency-free checks with:

```sh
node --check script.js
node --test tests/*.test.js
python3 tests/source_integrity.py
```

## Prototype limitations

This is a front-end learning prototype. Progress and assessment results are device/browser-specific and can be changed or deleted through browser developer tools. There is no authentication, database, certification, grading service, external AI API, or server-side validation. The Topic Guide uses authored responses and is not represented as a live AI service. The waitlist continues to use the existing Formspree endpoint.

## Waitlist and legal pages

The optional waitlist validates and normalizes an email before sending it to the existing Formspree endpoint. The local `betterHackerWaitlistEmail` value is written only after a successful HTTP response and is preserved by Reset Learning Progress. See `privacy.html` and `terms.html` for learner-facing disclosures.

The in-page Learning Assistant is an authored Topic Guide, not a live or personalized AI model.

## Retention and competency layer

The Daily Cyber Challenge is selected deterministically from the learner's local calendar date using an authored bank of 14 defensive scenarios. Its only new storage key is `betterHackerDailyChallengeState`, a version 1 JSON object:

```text
{
  version: 1,
  lastCompletedDate: "YYYY-MM-DD" | null,
  currentStreak: integer,
  longestStreak: integer,
  records: [{ date, challengeId, xp }]
}
```

History is bounded to the most recent 60 completed dates and is strictly validated. A date can award its challenge XP only once. Lesson, guided-exercise, investigation, and Course Review XP is derived from existing validated completion state, so existing learners receive it retroactively and reloads cannot duplicate it.

XP rules are 100 per lesson, 75 per guided exercise, 125 per investigation, 200 for Course Review completion, and 50 for each completed Daily Challenge date. Levels begin at 0, 400, 900, 1,500, 2,300, and 3,200 XP.

Achievements are milestone indicators. Skill badges are separate competency indicators derived from lesson, practical, investigation, and Course Review evidence; they are not certifications or third-party accreditation. Badge definitions use stable IDs and deterministic evidence so a future learner-controlled Career Profile could consume the registry. No profile is currently created, shared, or made public.

Byte Learning Guide uses the dependency-free authored provider in `companion.js`. It accepts activity context and gives hints or explanations without calling an external API or claiming to be AI. A future provider can implement the same interface without changing each activity.
