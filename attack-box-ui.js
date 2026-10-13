document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  const Box = globalThis.BetterHackerAttackBox;
  const State = Box;
  const storage = globalThis.BetterHackerSessionStorage;
  const root = document.querySelector("#attack-box");
  if (!Box || !State || !storage || !root) return;

  const select=root.querySelector("#attack-challenge"), objective=root.querySelector("#attack-objective"), output=root.querySelector("#attack-output"), form=root.querySelector("#attack-form"), input=root.querySelector("#attack-command"), status=root.querySelector("#attack-status"), progress=root.querySelector("#attack-progress"), historyButton=root.querySelector("#attack-history-up");
  let cwd="/home/learner", commands=[], history=[], lines=[], historyIndex=0;
  function saved(){return State.read(storage);}
  function challenge(){return Box.CHALLENGES.find(item=>item.id===select.value)||Box.CHALLENGES[0];}
  function say(message){status.textContent=message;}
  function renderProgress(){const state=saved(); progress.textContent=state.completed.length+" of "+Box.CHALLENGES.length+" simulations completed · "+State.totalXp(state)+" Attack Box XP earned";}
  function renderOutput(){output.textContent=lines.join("\n");output.scrollTop=output.scrollHeight;}
  function resetAttempt(message){cwd="/home/learner";commands=[];history=[];lines=["Better Hacker Attack Box — simulated environment","No real shell, operating system, or network is connected.","Type help to list supported command formats."];historyIndex=0;input.value="";renderOutput();const wasDone=saved().completed.includes(challenge().id);say(message||(wasDone?"Attempt reset. Your saved completion and XP remain recorded.":"Challenge reset. Your saved progress is unchanged."));}
  function setChallenge(){const current=challenge();objective.textContent="Objective: "+current.objective;root.querySelector("#attack-hint-text").textContent=current.hint;const done=saved().completed.includes(current.id);root.querySelector("#attack-complete").textContent=done?"Completed before · review is available":"Not completed";resetAttempt(done?"Review mode: this simulation was already completed, so no duplicate XP is awarded.":"New simulation loaded.");}
  function print(command,result){lines.push("learner@better-hacker:"+result.cwd+"$ "+command,result.output);if(lines.length>64)lines=lines.slice(-64);cwd=result.cwd;renderOutput();}
  select.addEventListener("change",setChallenge);
  form.addEventListener("submit",function(event){event.preventDefault();const command=input.value.trim();if(!command)return;history.push(command);historyIndex=history.length;input.value="";
    if(command.toLowerCase()==="help"){lines.push("learner@better-hacker:"+cwd+"$ "+command,"Supported commands: "+Box.COMMANDS.join(", "),"Examples: pwd · ls /home/learner · cat notes.txt · grep FAILED /var/log/auth.log · ip addr · ss -tuln");renderOutput();say("Help shown. Commands run only against fictional challenge data.");return;}
    const result=Box.execute(challenge().id,command,cwd);print(command,result);
    if(result.ok)commands.push(command.replace(/\s+/g," ").toLowerCase());
    else say("Command did not run. Read the message above and try a supported command.");
    const current=challenge();
    if(!saved().completed.includes(current.id)&&Box.isChallengeComplete(current.id,commands)){const completion=State.complete(storage,current.id);root.querySelector("#attack-complete").textContent="Completed";const feedback=typeof storage.feedback==="function"?storage.feedback(completion.saved?"50 XP earned and saved.":"50 XP earned for this session only.",State.STORAGE_KEY):completion.saved?"50 XP earned and saved.":"50 XP earned for this session only.";say("Challenge complete. "+feedback);renderProgress();document.dispatchEvent(new Event("attack-box-completed"));}
    else if(result.ok)say("Command ran against simulated data. Continue until you meet the objective.");
  });
  root.querySelector("#attack-reset").addEventListener("click",function(){resetAttempt();input.focus();});
  root.querySelector("#attack-help").addEventListener("click",function(){const guide=globalThis.BetterHackerCompanionInstance;if(guide)guide.setContext({type:"attack-box",activityId:challenge().id,topic:challenge().track,submitted:false,hint:challenge().hint,lookFor:"the objective and the fixed simulated outputs; no real system is connected",explanation:"Use only the listed commands against this fictional training data."});location.hash="coach";});
  input.addEventListener("keydown",function(event){if(event.key==="ArrowUp"){event.preventDefault();historyIndex=history.length?Math.max(0,historyIndex-1):0;input.value=history[historyIndex]||"";}else if(event.key==="ArrowDown"){event.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||"";}});
  historyButton.addEventListener("click",function(){input.focus();if(history.length){input.value=history[history.length-1];historyIndex=history.length-1;say("Last command loaded from this page session’s history.");}else say("Command history is empty. It is available while this page is open.");});
  document.addEventListener("attack-box-completed",renderProgress);
  Box.CHALLENGES.forEach(function(item){const option=document.createElement("option");option.value=item.id;option.textContent=item.title;select.appendChild(option);});
  renderProgress();setChallenge();
});
