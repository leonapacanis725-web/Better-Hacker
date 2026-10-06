# Better Hacker

Better Hacker is a static, dependency-light cybersecurity learning platform for beginners. It runs in the browser without a build step or account and connects lessons, guided practice, defensive investigations, review, daily recall, and progress-derived rewards into one recommended path.

The extended learner journey is **Learn → Practice → Complete → Document → Portfolio → Career Evidence**. Better Hacker helps learners describe completed educational work clearly; a portfolio project is not a claim of professional work experience, employment, certification, or independent verification.

## Learning path

The Core Path contains 20 activities in this order:

1. **Eight lessons:** Cybersecurity Fundamentals, Networking, Linux, Web Security, Cryptography, Active Directory, SOC & SIEM, and Security Testing.
2. **Four guided labs:** Linux File Detective, Network Service Triage, Choose the Right Data Protection, and Defend a Database Query.
3. **Seven defensive investigations:** SOC alerts, network traffic, phishing, Windows / Active Directory, malware concepts, brute-force detection, and web attacks.
4. **Course Review:** a 14-question checkpoint spanning all eight lesson domains.

Each core lesson includes prerequisites, objectives, cybersecurity relevance, terminology and concepts, a safe analysis activity, an authored knowledge check, educational feedback, a recap, and a recommended next activity. Lessons remain available after completion, and review does not duplicate progress or XP.

Guided labs are clickable, hash-addressable simulations with an objective, scenario, concept briefing, static evidence, step-by-step task, hint, validated answer, explanation, completion action, and next recommendation. They preserve the original sequential `betterHackerCompletedLabs` value.

Investigations use static simulated evidence and defensive decisions. Their overview reports **Start** or **Review**, and each provides evidence-analysis guidance, a hint, feedback, completion status, and a direct anchor. No activity scans, exploits, or connects to a real target.

Two optional supplemental lessons—Computer Fundamentals & Security Tools and Incident Response—expand roadmap topics after the Core Path. They have their own persisted completion state, remain reviewable, award no Core XP, and do not change the established 8/8 lesson or 20-activity counters.

## Learner Dashboard and Continue Learning

The Learner Dashboard is the home base for:

- lesson, lab, investigation, Course Review, and overall 20-activity progress;
- a five-stage path with direct links;
- the current recommended activity and a Continue Learning action;
- XP, level, Daily Challenge status, current/longest streaks;
- achievements, skill badges, and evidence supporting each badge.

The recommendation advances through incomplete lessons, guided labs, investigations, and Course Review. After the Core Path is complete, it recommends optional Daily Challenge practice and allows the Course Review to be repeated. The eight-lesson counter remains 0–8 and is not changed by labs, investigations, review attempts, or daily work.

## Byte Learning Guide

Byte is an authored, rule-based learning guide—not a live AI service. It receives the current lesson, knowledge check, lab, investigation, daily challenge, Course Review topic, or dashboard recommendation. Help is progressive:

1. a conceptual hint;
2. a stronger evidence clue;
3. the authored explanation after the learner submits.

Changing activities clears stale activity details so guidance from one exercise cannot leak into another. Byte makes no network requests.

## Learner Portfolio

The Learner Portfolio reuses existing completion evidence rather than introducing another progress counter. Completed practical lessons (Networking through Security Testing), all four guided labs, and all seven defensive investigations become eligible for optional documentation. Learners choose what to add; repeated selections resolve to the same stable activity ID.

Each builder separates Better Hacker-authored context—objective, skills, tools, and the related activity—from learner-authored commands, work performed, findings, learning, challenges, and solutions. **Draft**, **Almost Ready**, and **Portfolio Ready** explain which of the three essential learner-evidence areas are missing: work performed, findings, and what was learned. Incomplete projects always remain viewable and editable.

Project details can be previewed as Markdown, copied, or downloaded as a `.md` README without GitHub authentication. Empty learner sections are omitted so exports never invent evidence. The versioned `betterHackerPortfolioProjects` local-storage record is deliberately based on stable activity IDs, leaving room for later GitHub export, public profiles, shareable pages, templates, resume summaries, and verified evidence without changing existing completion keys.

The dashboard reports project, ready, and draft counts and may suggest one completed activity to document. This suggestion is separate from—and never replaces—the Core Path Continue Learning recommendation. Byte offers authored portfolio-writing guidance and never supplies accomplishments, commands, findings, credentials, or employment history for the learner.

## Learning Assistant Topic Guide

The authored Learning Assistant contains nine clickable topic experiences: Fundamentals, Networking, Linux, Web Security, Cryptography, Active Directory, SOC / SIEM, Security Testing, and Labs. Each view includes beginner terminology, practical concepts, safe commands or tools where relevant, a scenario, a hint, a retryable knowledge check, educational feedback, and links to the next topic or an existing activity. The Labs topic links to the existing guided-lab hub rather than duplicating those exercises.

Successful topic checks are stored in the versioned `betterHackerLearningAssistantTopics` record. Topic progress is supplemental: it awards no XP and does not change the 8/8 lesson or 20-activity Core Path counters. Byte receives the selected topic's authored hint, scenario context, and post-submission explanation.

## Course Review

The Course Review mixes multiple-choice and short-answer questions across all eight domains. Learners submit before seeing the answer. Feedback explains the correct reasoning, addresses a misconception, and links to the related lesson. The final result includes score, percentage, topic strengths, topics to revisit, and a Review Again action. A repeated attempt replaces the prior review result but does not change lesson completion or create duplicate XP.

## Daily Challenges, XP, achievements, and badges

A bank of 14 safe defensive scenarios selects one challenge deterministically from the learner's local date. A valid completion awards 50 XP at most once per local date; history is validated and bounded to 60 dates.

XP is derived rather than incremented: 100 per completed lesson, 75 per guided lab, 125 per investigation, 200 for Course Review completion, plus valid Daily Challenge records. Levels begin at 0, 400, 900, 1,500, 2,300, and 3,200 XP.

Achievements include First Step, Core Foundations, Course Complete, Hands-On Learner, Lab Ready, Investigator, Cyber Investigator, Knowledge Checkpoint, and daily-streak milestones. Skill badges combine lesson completion with Course Review and, where applicable, linked practical evidence. These are local educational indicators, not certifications.

## Progress persistence and compatibility

Progress is stored only in browser `localStorage`. Existing keys remain the source of truth:

- Lessons: `betterHackerFundamentalsComplete`, `betterHackerNetworkingComplete`, `betterHackerLinuxComplete`, `betterHackerWebSecurityComplete`, `betterHackerCryptographyComplete`, `betterHackerActiveDirectoryComplete`, `betterHackerSocComplete`, `betterHackerSecurityTestingComplete`.
- Guided labs: `betterHackerCompletedLabs` (`0`–`4`).
- Investigations: `betterHackerSocInvestigationComplete`, `betterHackerNetworkInvestigationComplete`, `betterHackerPhishingInvestigationComplete`, `betterHackerWindowsInvestigationComplete`, `betterHackerMalwareInvestigationComplete`, `betterHackerBruteForceInvestigationComplete`, `betterHackerWebAttackInvestigationComplete`.
- Course Review: `betterHackerCourseReviewResult`.
- Daily Challenge: `betterHackerDailyChallengeState`.
- Confirmed waitlist email: `betterHackerWaitlistEmail`.
- Supplemental lessons: `betterHackerComputerToolsLessonComplete` and `betterHackerIncidentResponseLessonComplete`.
- Learning Assistant topics: `betterHackerLearningAssistantTopics` (versioned JSON containing completed topic IDs).
- Learner Portfolio: `betterHackerPortfolioProjects` (versioned JSON containing one editable project per stable eligible activity ID).

XP, levels, achievements, and badges are calculated from validated evidence, so reloads and reviews cannot repeatedly award them. Reset Learning Progress removes Better Hacker learning and Daily Challenge state while deliberately preserving a confirmed waitlist email and unrelated local storage.

## Waitlist, privacy, and terms

The waitlist validates and normalizes email, prevents duplicate in-flight requests, reports success/failure accessibly, and writes `betterHackerWaitlistEmail` only after the existing Formspree endpoint confirms success. See `privacy.html` and `terms.html` for learner-facing disclosures.

## Run and test

Open `index.html` directly or serve the directory with a static HTTP server. There are no package dependencies or build commands.

```sh
node --test tests/*.test.js
python3 tests/source_integrity.py
node --check script.js
node --check companion.js
```

The tests cover all eight knowledge checks, persistence and recommendations, guided-lab sequencing, investigation completion, dashboard/XP/achievement derivation, portfolio eligibility, deduplication, editing, readiness, removal, README export, Byte context, Course Review, Daily Challenges, waitlist behavior, HTML links/IDs, legal navigation, and source integrity.

## Prototype limitations

There is no authentication, cloud sync, database, live AI, direct GitHub publishing, public portfolio hosting, server-side validation, formal grading, or certification. Browser data may be edited or cleared through developer/browser controls and does not synchronize across devices. Downloaded READMEs are learner-controlled, unverified educational records. The simulations teach safe decision-making; they are not substitutes for an organization's procedures or authorization requirements.
