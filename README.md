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

The Learner Portfolio reuses existing completion evidence rather than introducing another progress counter. Completed practical lessons (Networking through Security Testing), supplemental Hands-On Practice, all four guided labs, all seven defensive investigations, eligible Daily Practice activities, and completed Attack Box simulations become eligible for optional documentation. Learners choose what to add; repeated selections resolve to the same stable activity ID.

Each builder separates Better Hacker-authored context—objective, skills, tools, and the related activity—from learner-authored commands, work performed, findings, learning, challenges, and solutions. **Draft**, **Almost Ready**, and **Portfolio Ready** explain which of the three essential learner-evidence areas are missing: work performed, findings, and what was learned. Incomplete projects always remain viewable and editable.

Project details can be previewed as Markdown, copied, or downloaded as a `.md` README without GitHub authentication. **Prepare GitHub Files** previews the suggested repository name and description plus README.md, findings.md, and safe supplied sample evidence when available. Files download individually and include an educational-work disclaimer; learner text is escaped for literal Markdown rendering without changing saved evidence. Direct GitHub authentication and publishing are unavailable, so Better Hacker never asks for a GitHub password or token and never publishes automatically. The versioned `betterHackerPortfolioProjects` local-storage record remains based on stable activity IDs.

The dashboard reports project, ready, and draft counts and may suggest one completed activity to document. This suggestion is separate from—and never replaces—the Core Path Continue Learning recommendation. Byte offers authored portfolio-writing guidance and never supplies accomplishments, commands, findings, credentials, or employment history for the learner.

## Simulated Attack Box

The Attack Box is a beginner terminal simulation with five Linux, Networking, SOC, and Web Security exercises. Its command interpreter accepts a small allowlist (`pwd`, `ls`, `cd`, `cat`, `whoami`, `id`, `grep`, `find`, `ip addr`, `ping`, `curl`, `ss`, `ps`) and reads only fixed fictional data. It rejects shell operators, unsupported commands, and non-training network targets. It never invokes a host shell, makes network requests, or connects to backend infrastructure. The objective, hint, command history, reset action, Byte link, keyboard controls, and completion count share the existing learner interface. Each first completion awards 50 derived XP and is retained under `betterHackerAttackBoxState`; reset and repeat review do not remove completion or duplicate XP. The key is cleared by the existing Learning Progress Reset.

## Learning Assistant Topic Guide

The authored Learning Assistant contains nine clickable topic experiences: Fundamentals, Networking, Linux, Web Security, Cryptography, Active Directory, SOC / SIEM, Security Testing, and Labs. Each view includes beginner terminology, practical concepts, safe commands or tools where relevant, a scenario, a hint, a retryable knowledge check, educational feedback, and links to the next topic or an existing activity. The Labs topic links to the existing guided-lab hub rather than duplicating those exercises.

Successful topic checks are stored in the versioned `betterHackerLearningAssistantTopics` record. Topic progress is supplemental: it awards no XP and does not change the 8/8 lesson or 20-activity Core Path counters. Byte receives the selected topic's authored hint, scenario context, and post-submission explanation.

## Course Review

The Course Review mixes multiple-choice and short-answer questions across all eight domains. Learners submit before seeing the answer. Feedback explains the correct reasoning, addresses a misconception, and links to the related lesson. The final result includes score, percentage, topic strengths, topics to revisit, and a Review Again action. A repeated attempt replaces the prior review result but does not change lesson completion or create duplicate XP.

## Daily Practice

Daily Practice expands the existing Daily Cyber Challenge into a short evidence-analysis experience, using the same engine, activity IDs, daily storage, 50 XP award and existing achievements. It is optional: it never changes the eight Core Lessons, the 20-activity Core Path, guided-lab sequencing, investigations or supplemental lesson completion. The old `#daily-challenge` anchor still works; `#daily-practice` opens the daily overview.

The 14 starter activities cover ten tracks: OWASP / Web Security, SOC / SIEM, AI + Cybersecurity, Linux, Networking, Windows Security, Cryptography, Phishing Analysis, Threat Analysis, and Defensive Security / Security Testing. Each offers a fictional scenario, supplied evidence, an interpretation question, a next-action decision, a hint, a learner reflection, retryable feedback, explanation and existing next-step links. Nothing executes commands, contacts a target, requires an account or uses a live AI service.

The two selected answers are validated against authored answers. The reflection asks learners to cite evidence and explain uncertainty; only a minimum length is checked. It is not automatically graded for meaning and is not stored. Byte provides contextual authored hints. The help link opens the existing Topic Guide at the related topic.

### Rotation, completion and history

`challenges.js` selects one activity from the ordered library by hashing the digits of the browser's local `YYYY-MM-DD` date with `hash = (hash * 31 + digit) >>> 0`, then taking the remainder modulo the library length. This retains the existing daily schedule and remains stable on reload for the same date and library. A new date rotates the activity. Changing library size/order can change the schedule, so preserve stable IDs and order when editing. An open page refreshes the overview on focus, visibility changes and a one-minute poll; submitting yesterday's form cannot earn today's credit.

`betterHackerDailyChallengeState` remains version 1. Existing records are read without a destructive migration. New records add `practice: true`, `title` and `track` to `{ date, challengeId, xp }`. State includes `lastCompletedDate`, `currentStreak`, `longestStreak`, `totalCompleted`, lifetime `totalXp` and a bounded `records` array. Missing legacy `totalCompleted` starts from the retained record count; counts lost before this update cannot be reconstructed. New totals survive history trimming. History retains the latest 60 completed dates; XP uses the lifetime total independently of retained history. Legacy states without `totalXp` retain their recorded XP and recover older shipped 50-XP awards when a lifetime completion count is available. Dates use calendar-day differences rather than elapsed hours, so daylight-saving changes do not break streaks. A missed day resets the displayed active streak; tomorrow preserves a streak completed today. Duplicate submissions and history reviews never award more credit.

History links reopen activities in review mode without recording new daily completion. The dashboard shows today's status, active/longest streak and lifetime completion count. Unknown archived activity IDs retain readable history text without broken review links. Learning Progress Reset continues removing daily state while preserving authored portfolio projects, confirmed waitlist email and unrelated storage.

### Portfolio and adding activities

Substantial activities opt into the existing portfolio through `portfolio: true`. After a new-format completion, an explicit **Add to Portfolio** action becomes available. Nothing is added automatically. Portfolio IDs are stable per activity (`practice-<daily-id>`), so repeating it on another date cannot create duplicate projects. Authored objectives clearly identify fictional educational practice, never professional work. Daily and library sessions share the same stable project ID. Earlier quick-question completions do not automatically qualify. Eligibility requires either a retained new-format daily completion or a completed Practice Library session; already saved projects remain readable after a daily completion leaves the 60-record history.

To add an activity, append one object to the ordered `entries` library in `challenges.js`: use a unique stable ID, `scenario`, `choices`, `correctIndex`, `explanation`, `hint`, and `xp: 50`; then provide `track`, `difficulty`, `minutes`, fictional `evidence`, evidence question `task`, `evidenceChoices`, `evidenceIndex`, `evidenceExplanation`, related `assistantTopic`, existing `nextHref`, and boolean `portfolio` eligibility. Add its `daily-practice-<id>` anchor inside the Daily Practice section in `index.html`. The shared renderer and storage need no changes. Use the existing Topic Guide IDs (`fundamentals`, `networking`, `linux`, `web`, `crypto`, `ad`, `soc`, `testing`, `labs`) and existing section anchors. Keep evidence defensive and authorized. Run the full Node suite and Python source-integrity check to validate targets and content. Do not change existing IDs: persisted history and portfolio projects depend on them.

## Practice Library

The library at `#practice-library` lets learners browse all ten tracks and all 14 activities whenever they want. It reuses `CHALLENGES`, the evidence/decision/reflection renderer, authored Byte hints and the existing Topic Guide. Track cards display descriptions, activity counts, beginner difficulty and estimated time. Track routes (`#practice-track-<track-id>`) expose the matching activities; activity routes (`#library-activity-<daily-id>`) reopen directly, including after a reload. Today’s Daily Practice and its original `#daily-challenge`/`#daily-practice` anchors remain intact. Library links are available from the daily overview, dashboard and Hands-On Practice section.

Library sessions are explicitly labeled **Practice Mode — No Daily XP or Streak Credit**. Correct answers save only a first-completion marker under `betterHackerPracticeLibraryState`: `{ version: 1, completed: [{ activityId, date }] }`. Dates use the browser's local calendar. Records are validated, unique per activity and bounded to 1,000 activities; malformed individual records are skipped while valid records and unrelated storage are retained. This is eligibility/status evidence, with no XP, streak, daily count or daily history. Daily storage and all Core, lab, investigation, Course Review and supplemental lesson keys stay separate. Repeats show **Practiced** without adding records. Learning Progress Reset already clears Better Hacker keys, including this new state.

For activities with `portfolio: true`, a successful library completion enables the existing explicit **Add to Portfolio** action. No project is created automatically. Stable `practice-<daily-id>` project IDs are shared across both modes, so daily/free repeats never create duplicate projects. Project objectives describe simulated educational practice and the first supported completion date is used for a new project. Small activities marked `portfolio: false` remain ineligible. Reflections still have only a minimum-length check; they are not graded for meaning or stored automatically.

Track metadata (`TRACKS`) contains only names, stable IDs and descriptions. `activitiesForTrack` derives activity lists from the original activity objects, avoiding duplicate activity data. When adding an activity, keep its stable daily ID and assign an existing track name; add both the daily review and library activity anchors in `index.html`. A new track needs one metadata entry and a `practice-track-<id>` anchor. No new renderer or scoring system is needed. The optional Chromium regression command is the same as above with `tests/browser/practice-library.cjs`; it exercises all ten tracks and all 14 activities at the same five widths, plus completion isolation, portfolio deduplication, keyboard controls, reloads and daily rollover.

## XP, achievements, and badges

XP is derived rather than incremented: 100 per completed lesson, 75 per guided lab, 125 per investigation, 200 for Course Review completion, plus the validated lifetime Daily Challenge XP total. Levels begin at 0, 400, 900, 1,500, 2,300, and 3,200 XP.

Achievements include First Step, Core Foundations, Course Complete, Hands-On Learner, Lab Ready, Investigator, Cyber Investigator, Knowledge Checkpoint, and daily-streak milestones. Skill badges combine lesson completion with Course Review and, where applicable, linked practical evidence. These are local educational indicators, not certifications.

## Progress persistence and compatibility

Progress is stored only in browser `localStorage`. Existing keys remain the source of truth:

- Lessons: `betterHackerFundamentalsComplete`, `betterHackerNetworkingComplete`, `betterHackerLinuxComplete`, `betterHackerWebSecurityComplete`, `betterHackerCryptographyComplete`, `betterHackerActiveDirectoryComplete`, `betterHackerSocComplete`, `betterHackerSecurityTestingComplete`.
- Guided labs: `betterHackerCompletedLabs` (`0`–`4`).
- Investigations: `betterHackerSocInvestigationComplete`, `betterHackerNetworkInvestigationComplete`, `betterHackerPhishingInvestigationComplete`, `betterHackerWindowsInvestigationComplete`, `betterHackerMalwareInvestigationComplete`, `betterHackerBruteForceInvestigationComplete`, `betterHackerWebAttackInvestigationComplete`.
- Course Review: `betterHackerCourseReviewResult`.
- Daily Challenge: `betterHackerDailyChallengeState`.
- Free Practice Library status: `betterHackerPracticeLibraryState` (versioned activity ID and first completion date).
- Confirmed waitlist email: `betterHackerWaitlistEmail`.
- Supplemental lessons: `betterHackerComputerToolsLessonComplete` and `betterHackerIncidentResponseLessonComplete`.
- Learning Assistant topics: `betterHackerLearningAssistantTopics` (versioned JSON containing completed topic IDs).
- Learner Portfolio: `betterHackerPortfolioProjects` (versioned JSON containing one editable project per stable eligible activity ID).

XP, levels, achievements, and badges are calculated from validated evidence, so reloads and reviews cannot repeatedly award them. Reset Learning Progress removes Better Hacker learning and Daily Challenge state while deliberately preserving authored portfolio projects, a confirmed waitlist email and unrelated local storage.

## Waitlist, privacy, and terms

The waitlist validates and normalizes email, prevents duplicate in-flight requests, reports success/failure accessibly, and writes `betterHackerWaitlistEmail` only after the existing Formspree endpoint confirms success. See `privacy.html` and `terms.html` for learner-facing disclosures.

## Storage failures and portfolio safety

The shared `storage.js` facade retains existing storage keys and uses session-only values when browser storage is blocked or full. A live status and completion/save feedback explicitly explain when changes have not persisted. Saved records are not deleted on failure; an unreadable original record is not overwritten by a session replacement. Retry a portfolio save after freeing storage, or export the evidence before reloading. If reads were blocked, reload when storage is available to restore the original records. Reset clears learning/practice evidence but keeps authored portfolio projects editable and exportable even if the underlying completion is reset.

Learner-entered portfolio titles, dates and evidence are assigned using DOM `.value` / `.textContent`, including edit/detail/Markdown-preview paths; no learner data is interpolated into HTML attributes.

## Run and test

Open `index.html` directly or serve the directory with a static HTTP server. There are no package dependencies or build commands.

```sh
node --test tests/*.test.js
python3 tests/source_integrity.py
node --check script.js
node --check companion.js
node --check checkout.js
```

## Pricing and payment status

The site displays **Free ($0)**, **Better Hacker Pro ($7.99/month)**, and **Better Hacker Pro Annual ($69/year)**. Annual is **about $5.75/month** and **about 28% savings** compared with twelve monthly payments ($95.88). Free learners can use the published beginner lessons, hands-on practice, investigations, Daily Practice, progress tracking, Learning Assistant guidance, and portfolio tools. Published beta features remain available to everyone; the site does not currently restrict features by plan.

Paid plans are labeled **Coming Soon**. The site has no active checkout, does not accept payment details, and cannot create a subscription or charge a learner. Payment processing, subscriptions, authentication, and paid-feature access control are a separate future milestone. The existing `checkout.js` file is an unconnected checkout foundation and is not loaded by the learner-facing page. Do not enable it as a purchase flow until real server-side authentication, payment processing, subscription verification, cancellation handling, and appropriate legal and support information are implemented and reviewed.

## Better Hacker Pro Cybersecurity Jobs foundation

The **Cybersecurity Jobs** experience is nested in the learner path after learning, practice, and portfolio building. It is not a standalone Employer section. Prices remain $7.99/month and $69/year. Because this static beta has no sign-in, payment processing, or subscription entitlement service, the preview is not paywalled and does not claim to enforce Pro access. Fictional samples remain visibly marked **DEMO · NOT A CURRENT OPENING** and never count as live jobs.

### Canonical job record (schema version 1)

`jobs.js` normalizes each source record to this extensible shape:

```json
{
  "schemaVersion": 1,
  "id": "approved-feed-req-123",
  "externalId": "req-123",
  "title": "SOC Analyst",
  "employer": "Employer supplied by source",
  "location": { "display": "Detroit, MI", "city": null, "region": null, "country": null },
  "workplace": "remote",
  "employmentType": "full-time",
  "experienceLevel": "entry-level",
  "categories": ["entry-level", "soc"],
  "salaryRange": null,
  "datePosted": null,
  "skills": [{ "id": "alert-triage", "label": "Alert triage", "level": "required" }],
  "description": "Description supplied by the source.",
  "source": { "id": "approved-feed", "name": "Approved Feed", "kind": "api", "url": null },
  "applicationUrl": "https://careers.example/jobs/req-123",
  "dateImported": "2026-10-14T19:00:00.000Z",
  "expiresAt": null,
  "isDemo": false,
  "extensions": {}
}
```

Unknown dates and salary are `null`; import normalization never estimates them. URLs for application handoffs must be valid HTTPS URLs. Skill labels outside the current curated taxonomy remain visible but are not matchable until an approved mapping is added. `extensions` and `schemaVersion` allow fields to evolve without changing the base contract.

### Live source adapters and ingestion

`jobs-ingest.js` accepts reviewed JSON/CSV imports. `jobs-adapters.js` maps two documented public ATS job feeds into the same canonical schema:

- **Greenhouse Job Board API:** public board jobs and descriptions from the official `boards-api.greenhouse.io` host. Board tokens are public identifiers; application submissions/authenticated endpoints are not used. See [Greenhouse Job Board API docs](https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_jobs.md).
- **Lever Postings API:** published postings from the official global or EU `api.lever.co` host. Its documentation states that CORS is limited to the employer's own domains, so ingestion runs server-side. See [Lever Postings API docs](https://github.com/lever/postings-api).

`jobs-server/ingest.js` is a portable Node.js ingestion boundary. The committed `jobs-sources.json` configures five reviewed, public feeds: Volexity, Huntress, Censys, and Relay on Greenhouse, and BrightEdge on Lever. Their employer career pages link to or match the public ATS boards. No authentication, job-application submission, restricted platform scraping, or ATS protection bypass is used. The runner contacts only fixed ATS API hosts, follows no feed redirects, applies a timeout and 5 MB response cap, reads feeds sequentially, validates records and application URL host/path against the configured board, deduplicates, and atomically leaves the previous `jobs-live.json` untouched if any configured feed fails.

`jobs-relevance.js` documents the allowlist: source title/category must identify a cybersecurity function (for example SOC, security, incident response, threat detection, vulnerability, IAM, GRC, application/cloud/network security) or a direct IT support/help desk pathway. A generic support title can qualify only when the source description confirms security duties. Generic employer boilerplate does not qualify, and unrelated families such as finance, sales, product management, and marketing are excluded. The filter does not infer entry-level fit; absent source experience levels remain `unspecified`. Relevance reasons/signals are retained in the dataset for review. Imported descriptions are plain text rendered with `textContent`; application links are limited to the configured Greenhouse board or Lever site path on the ATS HTTPS domains. The frontend independently rejects other application destinations.

GitHub Actions runs this pipeline daily at 06:15 UTC and on manual dispatch (`.github/workflows/update-live-jobs.yml`). It needs only the built-in `contents: write` permission to publish a changed `jobs-live.json`; there are no repository secrets or package dependencies. Tests and output validation run before commit, unchanged data is not committed, and a failed feed or validation leaves the remote dataset unchanged. The workflow has no pull-request trigger. To retire a vacancy, a successful complete feed snapshot removes it immediately. If scheduled refreshes keep failing, the frontend hides live records whose last-observed time is more than seven days old; it also hides source-expired jobs and marks postings older than 30 days as possibly stale. The empty live state says: “No current cybersecurity listings were found from the connected sources. Check back as employer feeds update.”

The adapters retain explicit employer/source attribution, source type and career URL, external ATS ID, import timestamp, original HTTPS application URL, last-observed timestamp, and adapter metadata. They map only source-provided dates and text. Workplace type, employment type, experience level, role categories, salary, and required skills remain unknown/empty unless present in the feed; adapter code does not infer beginner fit or fabricate structured skills. HTML descriptions are converted to plain text and rendered via `textContent`. Duplicate detection uses source plus external ID, then canonical HTTPS application URL with common tracking parameters removed, and finally a title/employer/location fingerprint. Rejected records and duplicate counts appear in the generated dataset diagnostics, never as job cards.

**Operational status:** The configured dataset is generated from verified public feed responses; counts and source-specific current jobs are reported with each release. Source facts are not supplemented with invented details. Employer and ATS attribution, application destination, source posting date, import/check date, and feed freshness are shown on live cards. Demo data remains separately defined in `jobs-demo.js`, retains `isDemo`, and is never included in the generated live dataset or live count.

The frontend fetches only the same-origin `jobs-live.json`, accepts records marked as live ATS feed data after canonical validation, and keeps fictional demos separately labeled. Every live result needs verified source attribution and an application URL under its configured ATS board/site path. The link opens the original source in a new tab with `noopener noreferrer` and identifies that the learner is leaving Better Hacker. No imported description is executable HTML and no untrusted application URL is accepted.

### Adding another approved source

1. Confirm the source owner publishes the feed for public job-board display or explicitly permits this use. Do not use login-only pages, CAPTCHA-protected pages, restricted scraping, or sources that prohibit collection.
2. Add a source-specific parser in `jobs-adapters.js`, keep requests constrained to the official HTTPS host, and map source fields to the canonical job shape without inventing unknown facts.
3. Add a configuration example with public identifiers only; never put API secrets in browser code, tracked config, fixtures, or job output.
4. Add offline adapter fixtures and tests for source attribution, invalid URLs, missing/unknown facts, malformed rows, and deduplication. Run the full suites below before enabling the source in a trusted ingestion environment.
5. Review retention/removal rules and feed rate limits; confirm the first generated records and application URLs before publishing `jobs-live.json`.

### Local skill evidence comparison

`jobs-skill-mapping.js` applies explicit deterministic phrases to source listing titles, categories, and descriptions. It stores controlled skill IDs and an audit record (`matchedPhrase` and source `field`) under `extensions.skillMappings`; original listing fields and source-provided `skills` remain unchanged. Windows terms require an operating-system context and physical-building context suppresses those matches. Unsupported or ambiguous wording remains unmapped. The current rules live in `jobs-skill-mapping.js` and are regression-tested.

`jobs-matching.js` reads only the authored `BetterHackerPortfolio.ACTIVITIES` registry and local completion/project activity IDs. It compares mapped job skill IDs with skills and tools declared by completed activities. Portfolio project titles and learner-written project fields are not inspected; project evidence is tied to its fixed authored activity ID. Matching runs in this browser and does not transmit learner progress, portfolio details, or match results to employers, ATS providers, application URLs, analytics, or ingestion infrastructure. The card explains overlap as educational evidence only, offers existing learning activities for mapped gaps, and does not assess eligibility or hiring decisions. Demo records remain excluded from these live comparisons.

### Job-linked skill practice

The Hands-On Practice section includes focused, browser-only simulations for Python log filtering, PowerShell event review, general cloud shared responsibility, separate AWS/Azure/GCP evidence, EDR triage, IDS/IPS, firewall rule review, vulnerability prioritization, and digital-forensics evidence handling. Each activity requires all of its authored decisions to be correct before its dedicated local completion key is saved. Incomplete or wrong attempts are not evidence and do not change Core progress or XP. The portfolio registry links those keys to their authored skills and internal learning anchors; jobs offer direct links only for skills the activity actually practices.

Cloud Shared Responsibility awards only general Cloud Security/IAM evidence. AWS, Azure, and GCP are earned only by their distinct provider-specific simulations. Byte receives the active activity's authored hint and stronger clue, and withholds the explanation until submission. All scenarios are fictional; code and commands are text examples and are never executed or sent to a service. This material is supplemental Hands-On Practice; the Core lessons, guided lab sequence, Attack Box, and investigations remain focused on their existing objectives.

### Future authentication and Pro entitlement requirements

When paid access is ready, enforce it on a trusted server using authenticated accounts and payment-provider subscription webhooks/status checks. The server must validate entitlement on every protected job API request; frontend visibility alone is not a paywall. Avoid sending learner evidence to that service unless a separate, clear user choice and privacy review justify it. Before adding more live listings, verify source permissions, freshness and removal handling, employer/source attribution, safe external-link policy, privacy/terms updates, and operational monitoring.

Optional Chromium regression checks for Daily Practice require an available Playwright installation and Chromium (development tooling only; the site has no new dependencies). With the static server running, run:

```sh
BETTER_HACKER_TEST_URL=http://127.0.0.1:8000 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
node tests/browser/daily-practice.cjs
BETTER_HACKER_TEST_URL=http://127.0.0.1:8000 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
node tests/browser/launch-reliability.cjs
```

Omit `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use Playwright's installed default Chromium. The checks cover 1280, 1024, 768, 390 and 320px layouts, all 14 activity panels, keyboard navigation/hints, answer retries, daily credit, history, topic help, portfolio deduplication, local-midnight rollover, and independent Core 8/8 progress.

The tests cover all eight knowledge checks, persistence and recommendations, guided-lab sequencing, investigation completion, dashboard/XP/achievement derivation, portfolio eligibility, deduplication, editing, readiness, removal, README export, Byte context, Course Review, Daily Challenges, waitlist behavior, HTML links/IDs, legal navigation, and source integrity.

## Prototype limitations

There is no authentication, cloud sync, database, live AI, direct GitHub publishing, public portfolio hosting, server-side validation, formal grading, or certification. Browser data may be edited or cleared through developer/browser controls and does not synchronize across devices. Downloaded READMEs are learner-controlled, unverified educational records. The simulations teach safe decision-making; they are not substitutes for an organization's procedures or authorization requirements.

## Launch verification still required

No verified public deployment URL is configured in this repository. The official public contact email is [betterhackerteam@gmail.com](mailto:betterhackerteam@gmail.com); confirm that the inbox is monitored and has a deletion-request process. Do not derive or publish a production URL solely from the GitHub repository name. The configured signup endpoint is `https://formspree.io/f/xdeobdjl`; mocks verify browser behavior, not service ownership or delivery. No real signup is sent by the test suites.

Before a publicly invited beta, confirm the public contact inbox is monitored and can handle deletion requests; verify the HTTPS deployment and deployed revision/assets/legal links/deep links, and verify Formspree ownership, delivery, limits/abuse controls and an unsubscribe process. Have the current privacy and terms reviewed for the intended audience and jurisdiction. A real signup test requires explicit authorization. Browser-local progress and portfolio exports are not accounts, cloud sync or independent credentials.

The focused launch-readiness Chromium runner additionally uses development-only `axe-core` and `marked` alongside Playwright. These are not shipped to learners. With those modules available to Node, run:

```sh
BETTER_HACKER_TEST_URL=http://127.0.0.1:8000 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
node tests/browser/launch-readiness.cjs
```

If axe-core is installed outside Node's normal module search path, set `AXE_CORE_PATH` to its installed package directory. The runner checks contrast through normal/hover/focus/disabled states, navigation-card names and keyboard behavior, portable Markdown rendered with GFM, legal pages, anchors and mocked waitlist failures/success without contacting the live signup endpoint.

## Public beta learner journey

New visitors can use the lightweight beginner path in Learn, then reuse existing lessons, Hands-On Practice and Daily Practice. The dashboard includes derived Hands-On Practice, Practice Library and Topic Guide completion summaries; these optional counters do not add Core activities. Incomplete Attack Box attempts are not persisted; the new versioned Attack Box completion key is separate from all existing progress keys.

The portfolio contains beginner-friendly GitHub guidance, preserves the educational-work disclaimer and never publishes automatically. GitHub-ready README, findings, and supplied sample-evidence files can be previewed, copied, and downloaded. Copy failures (including browsers without a Clipboard API) explain how to select or download the Markdown instead. Closing or removing a project returns keyboard focus; reduced-motion preferences apply to editor scrolling. Anchor offsets follow the fixed navigation’s actual height so mobile wrapping does not cover destinations.

Run the fresh learner journey at 1280/1024/768/390/320px with the same Playwright/Chromium prerequisites:

```sh
BETTER_HACKER_TEST_URL=http://127.0.0.1:8000 \
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium \
node tests/browser/public-beta-journey.cjs
```

It completes actual lesson checks, all four Hands-On activities, a Topic Guide, free practice, all guided labs/investigations and Course Review, verifies dashboard/reload/portfolio behavior and clipboard fallbacks, and checks internal anchors and reduced-motion layouts. It sends no live signup requests.

