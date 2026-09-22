(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerMilestones = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const ACHIEVEMENTS = Object.freeze([
    ["first-step","First Step","Complete your first lesson",s=>s.lessonsCompleted>=1],
    ["core-foundations","Core Foundations","Complete four core lessons",s=>s.lessonsCompleted>=4],
    ["course-complete","Course Complete","Complete all eight lessons",s=>s.lessonsCompleted===8],
    ["hands-on-learner","Hands-On Learner","Complete your first guided exercise",s=>s.exercisesCompleted>=1],
    ["lab-ready","Lab Ready","Complete all four guided exercises",s=>s.exercisesCompleted===4],
    ["investigator","Investigator","Complete your first investigation",s=>s.investigationsCompleted>=1],
    ["cyber-investigator","Cyber Investigator","Complete all seven investigations",s=>s.investigationsCompleted===7],
    ["knowledge-checkpoint","Knowledge Checkpoint","Complete the Course Review",s=>Boolean(s.reviewResult)],
    ["daily-defender","Daily Defender","Complete your first Daily Cyber Challenge",s=>s.daily.records.length>=1],
    ["consistency-counts","Consistency Counts","Reach a 3-day Daily Challenge streak",s=>s.daily.longestStreak>=3],
    ["seven-day-defender","Seven-Day Defender","Reach a 7-day Daily Challenge streak",s=>s.daily.longestStreak>=7]
  ].map(a=>Object.freeze({id:a[0],name:a[1],description:a[2],isEarned:a[3]})));
  const topicBadges = [
    ["fundamentals-foundations","Cybersecurity Fundamentals","betterHackerFundamentalsComplete","Cybersecurity Fundamentals",null],
    ["networking-foundations","Networking Foundations","betterHackerNetworkingComplete","Networking",2],
    ["linux-foundations","Linux Foundations","betterHackerLinuxComplete","Linux",1],
    ["web-security-foundations","Web Security Foundations","betterHackerWebSecurityComplete","Web Security",4],
    ["cryptography-foundations","Cryptography Foundations","betterHackerCryptographyComplete","Cryptography",3],
    ["active-directory-foundations","Active Directory Foundations","betterHackerActiveDirectoryComplete","Active Directory","betterHackerWindowsInvestigationComplete"],
    ["soc-siem-foundations","SOC & SIEM Foundations","betterHackerSocComplete","SOC & SIEM","betterHackerSocInvestigationComplete"],
    ["security-testing-foundations","Security Testing Foundations","betterHackerSecurityTestingComplete","Security Testing",null]
  ];
  const SKILL_BADGES = Object.freeze(topicBadges.map(item => Object.freeze({
    id:item[0], name:item[1], topic:item[3],
    requirement:item[4] ? "Complete the topic lesson, answer a topic Course Review question correctly, and complete its linked practical activity." : "Complete the topic lesson and answer a topic Course Review question correctly.",
    evaluate(snapshot) {
      const lesson = snapshot.completedKeys.has(item[2]);
      const topic = snapshot.reviewResult && snapshot.reviewResult.topics[item[3]];
      const review = Boolean(topic && topic.correct >= 1);
      const checks=[lesson,review];
      const evidence=[lesson?"Lesson complete":"Lesson needed",review?"Course Review evidence":"Course Review evidence needed"];
      if (typeof item[4] === "number") { const practical=snapshot.exercisesCompleted>=item[4]; checks.push(practical); evidence.push(practical?"Linked guided exercise complete":"Linked guided exercise needed"); }
      else if (typeof item[4] === "string") { const practical=snapshot.completedKeys.has(item[4]); checks.push(practical); evidence.push(practical?"Linked investigation complete":"Linked investigation needed"); }
      return { earned:checks.every(Boolean), evidence:evidence, completed:checks.filter(Boolean).length, total:checks.length };
    }
  })).concat(Object.freeze({
    id:"better-hacker-core-foundations", name:"Better Hacker Core Foundations", topic:"Complete curriculum",
    requirement:"Complete all 8 lessons, all 4 guided exercises, all 7 investigations, and the Course Review with at least 60% correct.",
    evaluate(snapshot) {
      const checks=[snapshot.lessonsCompleted===8,snapshot.exercisesCompleted===4,snapshot.investigationsCompleted===7,Boolean(snapshot.reviewResult&&snapshot.reviewResult.percentage>=60)];
      return { earned:checks.every(Boolean), evidence:[`${snapshot.lessonsCompleted}/8 lessons`,`${snapshot.exercisesCompleted}/4 guided exercises`,`${snapshot.investigationsCompleted}/7 investigations`,snapshot.reviewResult?`${snapshot.reviewResult.percentage}% Course Review (60% needed)`:"Course Review needed"],completed:checks.filter(Boolean).length,total:4 };
    }
  })));
  function evaluateAchievements(snapshot) { return ACHIEVEMENTS.map(a=>({...a,earned:Boolean(a.isEarned(snapshot))})); }
  function evaluateBadges(snapshot) { return SKILL_BADGES.map(b=>({...b,...b.evaluate(snapshot)})); }
  return { ACHIEVEMENTS, SKILL_BADGES, evaluateAchievements, evaluateBadges };
});
