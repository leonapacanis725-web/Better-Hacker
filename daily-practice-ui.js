(function (root, factory) {
  const api = factory(typeof module === "object" && module.exports ? require('./learner-state.js') : root.BetterHackerState,
    typeof module === "object" && module.exports ? require('./challenges.js') : root.BetterHackerChallenges);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerDailyPracticeUI = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (State, Library) {
  "use strict";
  function escape(value) { return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char])); }
  function historyHtml(state, today) {
    const records = State.validateDailyState(state).records.filter(record => record.date <= today).slice().reverse();
    return records.length ? records.map(record => {
      const activity = Library.activityById(record.challengeId);
      const title = record.title || (activity ? activity.title : 'Earlier Daily Challenge');
      const track = record.track || (activity ? activity.track : 'Archived activity');
      return '<li><time datetime="' + record.date + '">' + record.date + '</time> — ✓ ' + escape(track) + ': ' +
        (activity ? '<a href="#daily-practice-' + activity.id + '">' + escape(title) + ' — Review</a>' : escape(title)) + '</li>';
    }).join('') : '<li>No completed activities yet. Start with today’s practice.</li>';
  }
  function submitPractice(storage, date, id, evidence, decision, reasoning) {
    const activity = Library.activityById(id);
    if (!activity || Library.challengeForDate(date).id !== id || !Library.checkAnswers(activity, evidence, decision, reasoning)) return { correct: false, awarded: false };
    const result = State.completeDailyChallenge(State.readDailyState(storage), date, id, activity.xp, { title: activity.title, track: activity.track });
    if (result.awarded) storage.setItem(State.DAILY_KEY, JSON.stringify(result.state));
    return { ...result, correct: true };
  }
  function create(options) {
    const { root, storage, companion, onComplete } = options;
    const workspace = root.querySelector('#daily-practice-workspace');
    let active = null, activeDate = null, review = false, lastDate = null;
    const today = () => State.localDateKey(new Date());
    function context(submitted) {
      if (active) companion.setContext({ type:'daily', activityId:active.id, topic:active.track, hint:active.hint,
        lookFor:active.task, explanation:active.explanation, submitted:submitted });
    }
    function summary() {
      const date = today(), state = State.readDailyState(storage), activity = Library.challengeForDate(date);
      const completed = state.records.some(record => record.date === date);
      root.querySelector('#daily-challenge-card').innerHTML = '<p class="review-topic">Today’s Practice · ' + date + '</p><h3>' + escape(activity.title) + '</h3><p>' + escape(activity.track) + ' · ' + activity.difficulty + ' · ' + activity.minutes + '</p><p>' + escape(activity.scenario) + '</p><p>' + (completed ? '✓ Completed today — review without extra credit' : 'Not completed today') + '</p><a class="primary-button" href="#daily-practice-workspace">' + (completed ? 'Review Today’s Activity →' : 'Start Today’s Activity →') + '</a>';
      root.querySelector('#daily-practice-summary').textContent = 'Practice streak: ' + State.activeDailyStreak(state, date) + ' days · Daily Activities Completed: ' + state.totalCompleted + ' · History: latest ' + State.MAX_DAILY_RECORDS + ' days completed';
      root.querySelector('#daily-practice-history').innerHTML = historyHtml(state, date);
      lastDate = date;
    }
    function nextActions() {
      const record = State.readDailyState(storage).records.find(item => item.challengeId === active.id && item.practice);
      return '<h4>Next step</h4><p>Review the related foundations or document your own educational evidence.</p><a class="primary-button" href="' + active.nextHref + '">Review related foundations →</a> <a href="#labs" class="secondary-button">Try defensive practice →</a>' +
        (active.portfolio && record ? ' <button type="button" class="secondary-button" data-portfolio-add="practice-' + active.id + '">Add to Portfolio</button>' : '');
    }
    function open(id, isReview, moveFocus) {
      active = Library.activityById(id); if (!active) return;
      activeDate = today(); review = isReview;
      workspace.hidden = false;
      workspace.innerHTML = '<p class="section-label">' + (review ? 'REVIEW — NO DAILY CREDIT' : 'TODAY’S DAILY PRACTICE') + '</p><h3 id="daily-practice-title" tabindex="-1">' + escape(active.title) + '</h3><p>' + escape(active.track) + ' · ' + active.difficulty + ' · ' + active.minutes + '</p><h4>Scenario</h4><p>' + escape(active.scenario) + '</p><p>All evidence is fictional and supplied for authorized educational analysis. Do not contact or test real systems.</p><h4>Evidence</h4><pre>' + escape(active.evidence) + '</pre><h4>Task</h4><p>Interpret the evidence, choose a next action, and explain your reasoning.</p><details><summary>Reasoning hint</summary><p>' + escape(active.hint) + '</p></details>' +
        '<form id="daily-practice-form"><fieldset><legend>' + escape(active.task) + '</legend><div class="review-answers">' + active.evidenceChoices.map((choice, index) => '<label class="review-option"><input type="radio" name="daily-evidence" value="' + index + '" required>' + escape(choice) + '</label>').join('') + '</div></fieldset><fieldset><legend>' + escape(active.scenario) + '</legend><div class="review-answers">' + active.choices.map((choice, index) => '<label class="review-option"><input type="radio" name="daily-answer" value="' + index + '" required>' + escape(choice) + '</label>').join('') + '</div></fieldset><label class="input-label" for="daily-reasoning">Evidence and reasoning in your own words</label><p id="daily-reasoning-help">Name a record or indicator and explain what it supports. Your reflection is not automatically graded for meaning and is not stored. Minimum 12 characters.</p><textarea id="daily-reasoning" name="reasoning" rows="3" minlength="12" maxlength="2000" aria-describedby="daily-reasoning-help" required></textarea><button type="submit" class="primary-button">Check Answers</button></form><div id="daily-feedback" role="status" aria-live="polite"></div><div id="daily-practice-next"></div><a href="#coach" data-daily-help="' + active.assistantTopic + '" class="secondary-button">Need help? Ask the Learning Assistant →</a> <a href="#daily-practice" class="secondary-button">Back to Daily Practice</a>';
      context(false);
      if (moveFocus) workspace.querySelector('h3').focus();
    }
    function navigate(hash) {
      summary();
      if (hash === '#daily-practice-workspace') open(Library.challengeForDate(today()).id, false, true);
      else if (hash.startsWith('#daily-practice-daily-')) open(hash.slice('#daily-practice-'.length), true, true);
    }
    root.addEventListener('submit', function (event) {
      if (event.target.id !== 'daily-practice-form' || !active) return;
      event.preventDefault();
      const feedback = workspace.querySelector('#daily-feedback');
      if (!review && today() !== activeDate) { summary(); feedback.textContent = 'A new calendar day has started. Start today’s activity from the card above; this earlier activity cannot earn today’s credit.'; return; }
      const evidence = workspace.querySelector('input[name="daily-evidence"]:checked');
      const decision = workspace.querySelector('input[name="daily-answer"]:checked');
      const reasoning = workspace.querySelector('#daily-reasoning').value;
      if (!evidence || !decision || reasoning.trim().length < 12) { feedback.textContent = 'Choose both answers and provide a short evidence-based reflection.'; return; }
      context(true);
      if (!Library.checkAnswers(active, evidence.value, decision.value, reasoning)) { feedback.textContent = 'Not quite — review the evidence and retry. ' + active.explanation; return; }
      let message = '✓ Activity Complete. ' + active.explanation;
      if (!review) {
        const result = submitPractice(storage, activeDate, active.id, evidence.value, decision.value, reasoning);
        message += result.awarded ? ' Completion saved; 50 XP awarded once for today.' : ' Today’s credit was already recorded; no duplicate XP.';
      } else message += ' Review only; no new completion or XP.';
      feedback.textContent = message;
      workspace.querySelector('#daily-practice-next').innerHTML = nextActions();
      summary(); onComplete(); context(true);
      root.dispatchEvent(new Event('daily-practice-completed', { bubbles:true }));
    });
    root.addEventListener('click', function (event) {
      const start = event.target.closest('a[href="#daily-practice-workspace"]');
      if (start && location.hash === '#daily-practice-workspace') open(Library.challengeForDate(today()).id, false, true);
      const help = event.target.closest('[data-daily-help]');
      if (help) { context(false); const topic = document.querySelector('.coach-topic[data-topic="' + help.dataset.dailyHelp + '"]'); if (topic) topic.click(); }
    });
    function refreshDate() {
      if (today() !== lastDate) { summary(); onComplete(); context(true); }
    }
    document.addEventListener('visibilitychange', refreshDate);
    window.addEventListener('focus', refreshDate);
    // Short poll handles a tab left open across local midnight without rerandomizing it.
    window.setInterval(refreshDate, 60000);
    summary();
    return { navigate, summary, refreshDate };
  }
  return { create, historyHtml, submitPractice };
});
