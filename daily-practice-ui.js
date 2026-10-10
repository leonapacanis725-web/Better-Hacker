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
    let saved = !storage.isPersisted || storage.isPersisted(State.DAILY_KEY);
    if (result.awarded || !saved) {
      try { saved = storage.setItem(State.DAILY_KEY, JSON.stringify(result.state)) !== false; } catch (_) { saved = false; }
    }
    return { ...result, correct: true, saved };
  }
  function submitLibraryPractice(storage, date, id, evidence, decision, reasoning) {
    const activity = Library.activityById(id);
    if (!activity || !Library.checkAnswers(activity, evidence, decision, reasoning)) return { correct: false, newlyCompleted: false };
    const result = State.completeLibraryPractice(storage, date, id);
    return { ...result, correct: true };
  }
  function practiced(storage, id) {
    return State.readPracticeLibraryState(storage).completed.some(record => record.activityId === id);
  }
  function completionStatus(storage, id) {
    if (practiced(storage, id)) return 'Practiced';
    return State.readDailyState(storage).records.some(record => record.practice && record.challengeId === id) ? 'Completed before in Daily Practice' : 'Available';
  }
  function trackCardsHtml() {
    return Library.TRACKS.map(track => {
      const activities = Library.activitiesForTrack(track.id);
      const difficulty = [...new Set(activities.map(activity => activity.difficulty))].join(' / ');
      const minutes = [...new Set(activities.map(activity => activity.minutes))].join(' / ');
      return '<a class="card platform-entry-card" href="#practice-track-' + track.id + '"><h4>' + escape(track.name) + '</h4><p>' + escape(track.description) + '</p><p>' + activities.length + ' ' + (activities.length === 1 ? 'activity' : 'activities') + ' · ' + escape(difficulty) + ' · ' + escape(minutes) + ' each</p><span class="platform-entry-action">Practice →</span></a>';
    }).join('');
  }
  function trackActivitiesHtml(id, storage) {
    return Library.activitiesForTrack(id).map(activity => '<a class="card platform-entry-card" href="#library-activity-' + activity.id + '"><h4>' + escape(activity.title) + '</h4><p>' + escape(activity.scenario) + '</p><p>' + activity.difficulty + ' · ' + activity.minutes + '</p><p>' + completionStatus(storage, activity.id) + (activity.portfolio ? ' · Portfolio eligible after completion' : '') + '</p><span class="platform-entry-action">Practice →</span></a>').join('');
  }
  function create(options) {
    const { root, storage, companion, onComplete } = options;
    const workspace = root.querySelector('#daily-practice-workspace');
    let active = null, activeDate = null, mode = 'daily', lastDate = null;
    const today = () => State.localDateKey(new Date());
    function context(submitted) {
      if (active) companion.setContext({ type:mode === 'library' ? 'practice' : 'daily', activityId:active.id, topic:active.track, assistantTopic:active.assistantTopic, hint:active.hint,
        lookFor:active.task, explanation:active.explanation, submitted:submitted });
    }
    function summary() {
      const date = today(), state = State.readDailyState(storage), activity = Library.challengeForDate(date);
      const completed = state.lastCompletedDate === date;
      root.querySelector('#daily-challenge-card').innerHTML = '<p class="review-topic">Today’s Practice · ' + date + '</p><h3>' + escape(activity.title) + '</h3><p>' + escape(activity.track) + ' · ' + activity.difficulty + ' · ' + activity.minutes + '</p><p>' + escape(activity.scenario) + '</p><p>' + (completed ? '✓ Completed today — review without extra credit' : 'Not completed today') + '</p><a class="primary-button" href="#daily-practice-workspace">' + (completed ? 'Review Today’s Activity →' : 'Start Today’s Activity →') + '</a> <a class="secondary-button" href="#practice-library">Explore Practice Library →</a>';
      root.querySelector('#daily-practice-summary').textContent = 'Practice streak: ' + State.activeDailyStreak(state, date) + ' days · Daily Activities Completed: ' + state.totalCompleted + ' · History: latest ' + State.MAX_DAILY_RECORDS + ' days completed';
      root.querySelector('#daily-practice-history').innerHTML = historyHtml(state, date);
      root.querySelector('#practice-library-tracks').innerHTML = trackCardsHtml();
      lastDate = date;
    }
    function nextActions() {
      const record = State.readDailyState(storage).records.find(item => item.challengeId === active.id && item.practice) || practiced(storage, active.id);
      return '<h4>Next step</h4><p>Review the related foundations or document your own educational evidence.</p><a class="primary-button" href="' + active.nextHref + '">Review related foundations →</a> <a href="#labs" class="secondary-button">Try defensive practice →</a>' +
        (active.portfolio && record ? ' <button type="button" class="secondary-button" data-portfolio-add="practice-' + active.id + '">Add to Portfolio</button>' : '');
    }
    function open(id, sessionMode, moveFocus) {
      active = Library.activityById(id); if (!active) return;
      activeDate = today(); mode = sessionMode;
      root.querySelector('#practice-library-activities').hidden = true;
      workspace.hidden = false;
      workspace.innerHTML = '<p class="section-label">' + (mode === 'library' ? 'PRACTICE MODE — NO DAILY XP OR STREAK CREDIT' : mode === 'review' ? 'REVIEW — NO DAILY CREDIT' : 'TODAY’S DAILY PRACTICE') + '</p><h3 id="daily-practice-title" tabindex="-1">' + escape(active.title) + '</h3><p>' + escape(active.track) + ' · ' + active.difficulty + ' · ' + active.minutes + '</p><h4>Scenario</h4><p>' + escape(active.scenario) + '</p><p>All evidence is fictional and supplied for authorized educational analysis. Do not contact or test real systems.</p><h4>Evidence</h4><pre>' + escape(active.evidence) + '</pre><h4>Task</h4><p>Interpret the evidence, choose a next action, and explain your reasoning.</p><details><summary>Reasoning hint</summary><p>' + escape(active.hint) + '</p></details>' +
        '<form id="daily-practice-form"><fieldset><legend>' + escape(active.task) + '</legend><div class="review-answers">' + active.evidenceChoices.map((choice, index) => '<label class="review-option"><input type="radio" name="daily-evidence" value="' + index + '" required>' + escape(choice) + '</label>').join('') + '</div></fieldset><fieldset><legend>' + escape(active.scenario) + '</legend><div class="review-answers">' + active.choices.map((choice, index) => '<label class="review-option"><input type="radio" name="daily-answer" value="' + index + '" required>' + escape(choice) + '</label>').join('') + '</div></fieldset><label class="input-label" for="daily-reasoning">Evidence and reasoning in your own words</label><p id="daily-reasoning-help">Name a record or indicator and explain what it supports. Your reflection is not automatically graded for meaning and is not stored. Minimum 12 characters.</p><textarea id="daily-reasoning" name="reasoning" rows="3" minlength="12" maxlength="2000" aria-describedby="daily-reasoning-help" required></textarea><button type="submit" class="primary-button">Check Answers</button></form><div id="daily-feedback" role="status" aria-live="polite"></div><div id="daily-practice-next"></div><a href="#coach" data-daily-help="' + active.assistantTopic + '" class="secondary-button">Need help? Ask the Learning Assistant →</a> <a href="#practice-library" class="secondary-button">Explore Practice Library</a> <a href="#daily-practice" class="secondary-button">Today’s Daily Practice</a>';
      if (mode === 'library') {
        const notice = document.createElement('p'); notice.textContent = completionStatus(storage, active.id) + '. Free practice never changes today’s daily award, streak or Core Path.';
        workspace.querySelector('h3').insertAdjacentElement('afterend', notice);
        if (practiced(storage, active.id)) workspace.querySelector('#daily-practice-next').innerHTML = nextActions();
      }
      context(false);
      if (moveFocus) workspace.querySelector('h3').focus();
    }
    function openTrack(id, moveFocus) {
      const track = Library.TRACKS.find(item => item.id === id);
      if (!track) return;
      const panel = root.querySelector('#practice-library-activities');
      panel.hidden = false;
      panel.innerHTML = '<h4 id="practice-track-title" tabindex="-1">' + escape(track.name) + '</h4><p>Choose an activity. Practice Mode records only that you practiced; it does not award daily XP or streak credit.</p><div class="cards">' + trackActivitiesHtml(id, storage) + '</div><a href="#practice-library">All practice tracks →</a>';
      workspace.hidden = true;
      if (moveFocus) panel.querySelector('h4').focus();
    }
    function navigate(hash) {
      summary();
      if (hash === '#daily-practice-workspace') open(Library.challengeForDate(today()).id, 'daily', true);
      else if (hash.startsWith('#library-activity-daily-')) open(hash.slice('#library-activity-'.length), 'library', true);
      else if (hash.startsWith('#practice-track-')) openTrack(hash.slice('#practice-track-'.length), true);
      else if (hash === '#practice-library') {
        workspace.hidden = true; root.querySelector('#practice-library-activities').hidden = true; root.querySelector('#practice-library-title').focus();
      }
      else if (hash.startsWith('#daily-practice-daily-')) open(hash.slice('#daily-practice-'.length), 'review', true);
    }
    root.addEventListener('submit', function (event) {
      if (event.target.id !== 'daily-practice-form' || !active) return;
      event.preventDefault();
      const feedback = workspace.querySelector('#daily-feedback');
      if (mode === 'daily' && today() !== activeDate) { summary(); feedback.textContent = 'A new calendar day has started. Start today’s activity from the card above; this earlier activity cannot earn today’s credit.'; return; }
      const evidence = workspace.querySelector('input[name="daily-evidence"]:checked');
      const decision = workspace.querySelector('input[name="daily-answer"]:checked');
      const reasoning = workspace.querySelector('#daily-reasoning').value;
      if (!evidence || !decision || reasoning.trim().length < 12) { feedback.textContent = 'Choose both answers and provide a short evidence-based reflection.'; return; }
      context(true);
      if (!Library.checkAnswers(active, evidence.value, decision.value, reasoning)) { feedback.textContent = 'Not quite — review the evidence and retry. ' + active.explanation; return; }
      let message = '✓ Correct — Activity Complete. ' + active.explanation;
      if (mode === 'daily') {
        const result = submitPractice(storage, activeDate, active.id, evidence.value, decision.value, reasoning);
        message += !result.saved ? ' Not saved to this browser. Progress and XP are only available for this session; they may be lost on reload.' : result.awarded ? ' Completion saved; 50 XP awarded once for today.' : ' Today’s credit was already recorded; no duplicate XP.';
      } else if (mode === 'library') {
        const result = submitLibraryPractice(storage, today(), active.id, evidence.value, decision.value, reasoning);
        message += result.saved === false ? ' Not saved to this browser. Practice completion is only available for this session; it may be lost on reload.' : result.newlyCompleted ? ' Practice completed and saved. No daily XP, streak or history credit.' : ' Practiced before — no duplicate completion and no daily XP, streak or history credit.';
      } else message += ' Review only; no new completion or XP.';
      feedback.textContent = message;
      workspace.querySelector('#daily-practice-next').innerHTML = nextActions();
      summary(); onComplete(); context(true);
      root.dispatchEvent(new Event('daily-practice-completed', { bubbles:true }));
    });
    root.addEventListener('click', function (event) {
      const start = event.target.closest('a[href="#daily-practice-workspace"]');
      if (start && location.hash === '#daily-practice-workspace') open(Library.challengeForDate(today()).id, 'daily', true);
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
  return { create, historyHtml, submitPractice, submitLibraryPractice, trackCardsHtml, trackActivitiesHtml };
});
