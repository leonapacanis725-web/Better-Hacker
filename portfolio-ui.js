document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  const Portfolio = BetterHackerPortfolio;
  const localStorage = globalThis.BetterHackerSessionStorage;
  const list = document.querySelector("#portfolio-projects");
  const builder = document.querySelector("#portfolio-builder");
  const status = document.querySelector("#portfolio-status");
  let activeId = null;
  let returnFocus = null;

  function escapeHtml(value) { const node=document.createElement("span"); node.textContent=String(value || ""); return node.innerHTML; }
  function setStatus(message) { if (status) status.textContent=message; }
  function setByte(activity) {
    const guide=globalThis.BetterHackerCompanionInstance; if (!guide) return;
    guide.setContext({ type:"portfolio", activityId:activity ? activity.id : "portfolio", topic:activity ? activity.title : "Learner Portfolio", submitted:true,
      hint:"Skills name what you practised; evidence describes what you actually did, observed, and learned.",
      lookFor:"your own commands, investigation steps, findings, challenges, and lessons learned—do not add claims you cannot support",
      explanation:"A README is a Markdown document that explains a project. Use specific, honest learner evidence and describe this as completed educational work, not professional experience." });
  }
  function renderEligible() {
    const target=document.querySelector("#portfolio-eligible"); if (!target) return;
    const projects=Portfolio.read(localStorage).projects;
    const completed=Portfolio.ACTIVITIES.filter(function(a){return Portfolio.isComplete(a,localStorage);});
    target.innerHTML=completed.length ? completed.map(function(a){
      const exists=projects.some(function(p){return p.activityId===a.id;});
      return '<li><span><strong>'+escapeHtml(a.title)+'</strong><small>'+escapeHtml(a.type)+'</small></span><button type="button" class="secondary-button" data-portfolio-add="'+a.id+'" '+(exists?'disabled':'')+'>'+(exists?'Added':'Add to Portfolio')+'</button></li>';
    }).join("") : "<li>Complete an eligible hands-on lesson, guided lab, or defensive investigation to document it here.</li>";
  }
  function renderDashboard() {
    const counts=Portfolio.stats(localStorage), suggested=Portfolio.suggestion(localStorage);
    [["#dashboard-portfolio",counts.total+" projects"],["#dashboard-portfolio-ready",counts.ready+" portfolio ready"],["#dashboard-portfolio-drafts",counts.drafts+" drafts"]].forEach(function(item){const el=document.querySelector(item[0]);if(el)el.textContent=item[1];});
    const prompt=document.querySelector("#portfolio-suggestion");
    if (prompt) prompt.innerHTML=suggested ? 'Turn your completed <strong>'+escapeHtml(suggested.title)+'</strong> into a portfolio project. <a href="#portfolio" data-portfolio-suggest="'+suggested.id+'">Document this activity</a>.' : (counts.total ? 'Keep improving your saved project evidence. <a href="#portfolio">Open Portfolio</a>.' : 'Complete eligible practical work to receive a documentation suggestion.');
  }
  function renderProjects() {
    if (!list) return;
    const projects=Portfolio.read(localStorage).projects;
    list.innerHTML=projects.length ? projects.map(function(project){const a=Portfolio.activityById(project.activityId), ready=Portfolio.readiness(project); return '<article class="portfolio-card"><p class="portfolio-type">'+escapeHtml(a.type)+'</p><h3 data-project-title></h3><p><strong>Skills:</strong> '+escapeHtml(a.skills.slice(0,3).join(" · "))+'</p><p><strong>Tools:</strong> '+escapeHtml(a.tools.join(" · ") || "No specific tool listed")+'</p><p class="readiness readiness-'+ready.status.toLowerCase().replaceAll(" ","-")+'">'+ready.status+'</p><div class="portfolio-actions"><button type="button" data-portfolio-view="'+a.id+'">View Project</button><button type="button" data-portfolio-edit="'+a.id+'">Edit Project</button><button type="button" data-portfolio-export="'+a.id+'">Export README</button><button type="button" data-portfolio-github="'+a.id+'">Prepare GitHub Files</button></div></article>';}).join("") : '<div class="portfolio-empty"><h3>Your portfolio is ready for its first project</h3><p>Complete an eligible activity, then choose <strong>Add to Portfolio</strong>. Nothing is added automatically.</p></div>';
    list.querySelectorAll("[data-project-title]").forEach(function (heading, index) { heading.textContent = projects[index].title; });
    renderEligible(); renderDashboard();
  }
  function closeBuilder() {
    builder.hidden=true;
    const fallback=Array.from(list.querySelectorAll("[data-portfolio-view]")).find(function(button){return button.dataset.portfolioView===activeId;}) || document.querySelector("#portfolio-title");
    const target=returnFocus && returnFocus.isConnected && !returnFocus.disabled ? returnFocus : fallback;
    if(target){if(!target.matches("button,a,input"))target.setAttribute("tabindex","-1");target.focus();}
    activeId=null;
  }
  function openBuilder(id, viewOnly) {
    const project=Portfolio.read(localStorage).projects.find(function(p){return p.activityId===id;}), a=Portfolio.activityById(id); if (!project || !a || !builder) return;
    if (!builder.contains(document.activeElement)) returnFocus = document.activeElement && document.activeElement.matches("button,a,input") ? document.activeElement : null;
    activeId=id; const ready=Portfolio.readiness(project);
    builder.hidden=false;
    builder.innerHTML='<div class="portfolio-builder-head"><div><p class="portfolio-type">'+escapeHtml(a.type)+'</p><h3 id="portfolio-builder-title" tabindex="-1">'+(viewOnly?'Project Detail':'Edit Portfolio Project')+'</h3></div><button type="button" data-portfolio-close aria-label="Close project builder">×</button></div>'+
      '<div class="readiness-panel" role="status"><strong>'+ready.status+'</strong><p>'+(ready.missing.length?'Add '+escapeHtml(ready.missing.join(", "))+' to make this evidence stronger.':'This project contains work performed, findings, and learning evidence.')+'</p></div>'+
      (viewOnly ? detailHtml(project,a) : formHtml(project,a))+'<div id="readme-preview" class="readme-preview" hidden></div>';
    if (!viewOnly) {
      ["title", "completedAt"].concat(Portfolio.LEARNER_FIELDS).forEach(function (field) {
        builder.querySelector('[name="' + field + '"]').value = project[field];
      });
    } else {
      builder.querySelectorAll("[data-evidence]").forEach(function (node) { node.textContent = project[node.dataset.evidence]; });
      builder.querySelector("[data-completion-date]").textContent = project.completedAt || "date not recorded";
    }
    builder.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",block:"start"}); builder.querySelector("#portfolio-builder-title").focus(); setByte(a);
  }
  function authoredHtml(a) { return '<aside class="authored-info"><strong>Provided by Better Hacker</strong><p><b>Objective:</b> '+escapeHtml(a.objective)+'</p><p><b>Skills practised:</b> '+escapeHtml(a.skills.join(", "))+'</p><p><b>Relevant tools:</b> '+escapeHtml(a.tools.join(", ") || "None specified")+'</p></aside>'; }
  function formHtml(p,a) { const fields=[["commands","Commands I used"],["investigation","What I investigated / work I performed"],["findings","What I found"],["learned","What I learned"],["challenges","Challenges I encountered"],["solutions","How I solved them"]]; return authoredHtml(a)+'<form id="portfolio-form"><p class="learner-label"><strong>Your evidence</strong> — only record work you actually completed.</p><label>Project title<input name="title" maxlength="120" required></label><label>Completion date<input name="completedAt" type="date"></label>'+fields.map(function(f){return '<label>'+f[1]+'<textarea name="'+f[0]+'" rows="4"></textarea></label>';}).join("")+'<div class="portfolio-actions"><button class="primary-button" type="submit">Save Project</button><button type="button" class="secondary-button" data-portfolio-remove>Remove from Portfolio</button></div></form>'; }
  function section(title,value){return value?'<section><h4>'+title+'</h4><p class="preserve-lines">'+escapeHtml(value)+'</p></section>':'';}
  function evidenceSection(title, field, project) {
    return project[field] ? '<section><h4>' + title + '</h4><p class="preserve-lines" data-evidence="' + field + '"></p></section>' : '';
  }
  function detailHtml(p,a){return authoredHtml(a)+'<div class="project-detail"><section><h4>Project Overview</h4><p>'+escapeHtml(a.type)+' · Completed <span data-completion-date></span></p></section>'+section("Objective",a.objective)+section("Skills Demonstrated",a.skills.join(", "))+section("Tools / Concepts",a.tools.join(", "))+evidenceSection("Commands Used","commands",p)+evidenceSection("Investigation / Work Performed","investigation",p)+evidenceSection("Findings","findings",p)+evidenceSection("Challenges","challenges",p)+evidenceSection("Solutions","solutions",p)+evidenceSection("What I Learned","learned",p)+'<section><h4>Related Better Hacker Activity</h4><a href="'+a.href+'">'+escapeHtml(a.title)+'</a></section></div><div class="portfolio-actions"><button type="button" data-portfolio-edit="'+a.id+'">Edit Project</button><button type="button" data-portfolio-export="'+a.id+'">Preview README</button></div>';}
  function showExport(id) { const project=Portfolio.read(localStorage).projects.find(function(p){return p.activityId===id;}); if(!project)return; if(!builder || activeId!==id)openBuilder(id,true); const preview=builder.querySelector("#readme-preview"), md=Portfolio.markdown(project); preview.hidden=false; preview.innerHTML='<h4 tabindex="-1">README Preview</h4><pre><code></code></pre><div class="portfolio-actions"><button type="button" data-copy-readme>Copy Markdown</button><button type="button" data-download-readme>Download .md</button></div>'; preview.querySelector("code").textContent = md; preview.scrollIntoView({block:"nearest"}); preview.querySelector("h4").focus(); }
  function preparedGitHubPackage(project) {
    const pack=Portfolio.githubPackage(project); if(!pack)return null;
    const activity=Portfolio.activityById(project.activityId);
    if(!pack.files["sample-evidence.md"]){
      let sample="";
      if(Number.isInteger(activity.labIndex)){const lab=(globalThis.BetterHackerGuidedLabEvidence||[])[activity.labIndex];if(lab)sample=lab.evidence;}
      else if(activity.id.indexOf("investigation-")===0){const card=document.getElementById(activity.href.slice(1));const evidence=card&&card.querySelector(".command-list");if(evidence)sample=evidence.textContent.trim();}
      if(sample)pack.files["sample-evidence.md"]="# Supplied Sample Evidence\n\n"+sample+"\n\nThis fictional evidence was supplied by Better Hacker for educational practice. It is not a record from a real system or organization.\n";
    }
    const fileNames=Object.keys(pack.files);
    pack.files["README.md"]=pack.files["README.md"].replace("\n\n## Project Objective", "\n\n## Repository Structure\n\n"+fileNames.map(function(file){return "- `"+file+"`";}).join("\n")+"\n\n## Project Objective");
    return pack;
  }
  function showGitHubPackage(id) {
    const project=Portfolio.read(localStorage).projects.find(function(p){return p.activityId===id;}); if(!project)return;
    if(!builder || activeId!==id)openBuilder(id,true);
    const pack=preparedGitHubPackage(project); if(!pack)return;
    let panel=builder.querySelector("#github-publish-preview");
    if(!panel){panel=document.createElement("section");panel.id="github-publish-preview";panel.className="github-publish-preview";panel.setAttribute("aria-labelledby","github-publish-title");builder.appendChild(panel);}
    panel.hidden=false;panel.replaceChildren();
    const title=document.createElement("h4");title.id="github-publish-title";title.tabIndex=-1;title.textContent="Prepare this project for GitHub";panel.appendChild(title);
    const unavailable=document.createElement("p");unavailable.className="github-integration-note";unavailable.textContent="Direct GitHub publishing is unavailable because Better Hacker does not have secure GitHub authentication. Nothing will be sent or published from this page.";panel.appendChild(unavailable);
    const name=document.createElement("p");name.innerHTML="<strong>Suggested repository name:</strong> ";const nameCode=document.createElement("code");nameCode.textContent=pack.repositoryName;name.appendChild(nameCode);panel.appendChild(name);
    const description=document.createElement("p");description.innerHTML="<strong>Suggested repository description:</strong> ";description.appendChild(document.createTextNode(pack.description));panel.appendChild(description);
    const exact=document.createElement("p");exact.textContent="Preview every file below before downloading it. These files use your saved evidence plus Better Hacker’s authored objective and safe supplied evidence.";panel.appendChild(exact);
    Object.keys(pack.files).forEach(function(filename){const details=document.createElement("details");details.className="github-file-preview";details.open=true;const summary=document.createElement("summary");summary.textContent=filename;details.appendChild(summary);const pre=document.createElement("pre");const code=document.createElement("code");code.textContent=pack.files[filename];pre.appendChild(code);details.appendChild(pre);const actions=document.createElement("div");actions.className="portfolio-actions";const copy=document.createElement("button");copy.type="button";copy.dataset.githubCopy=filename;copy.textContent="Copy "+filename;const download=document.createElement("button");download.type="button";download.dataset.githubDownload=filename;download.textContent="Download "+filename;actions.append(copy,download);details.appendChild(actions);panel.appendChild(details);});
    const steps=document.createElement("div");steps.className="github-publish-steps";steps.innerHTML="<h5>Publish it yourself on GitHub</h5><ol><li>Download each file above and review the content. Remove any personal or private information before sharing.</li><li>Sign in to GitHub in your browser and choose <strong>New repository</strong>. Enter the suggested name and description. Keep the repository private if you are unsure.</li><li>Create the repository, then choose <strong>Add file → Upload files</strong> and upload the downloaded files, or create README.md and paste its copied Markdown.</li><li>Use GitHub’s preview, confirm the repository visibility, and only then choose <strong>Commit changes</strong>. A public repository can be read by anyone.</li></ol><p>Keep the educational-use disclaimer. Do not upload passwords, personal data, real organization logs, or work you did not complete.</p>";panel.appendChild(steps);
    panel.scrollIntoView({block:"nearest",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});title.focus();setStatus("GitHub-ready files are prepared for review. Direct publishing is unavailable; nothing was sent.");
  }
  document.addEventListener("click", function(event){
    const add=event.target.closest && event.target.closest("[data-portfolio-add],[data-portfolio-suggest]"); if(add){const id=add.dataset.portfolioAdd||add.dataset.portfolioSuggest,result=Portfolio.createProject(localStorage,id);setStatus(localStorage.feedback(result.reason, Portfolio.STORAGE_KEY));renderProjects();if(result.project)openBuilder(id,false);return;}
    const edit=event.target.closest && event.target.closest("[data-portfolio-edit]"); if(edit){openBuilder(edit.dataset.portfolioEdit,false);return;}
    const view=event.target.closest && event.target.closest("[data-portfolio-view]"); if(view){openBuilder(view.dataset.portfolioView,true);return;}
    const exp=event.target.closest && event.target.closest("[data-portfolio-export]"); if(exp){showExport(exp.dataset.portfolioExport);return;}
    const github=event.target.closest && event.target.closest("[data-portfolio-github]"); if(github){showGitHubPackage(github.dataset.portfolioGithub);return;}
    const githubDownload=event.target.closest && event.target.closest("[data-github-download]"); if(githubDownload){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;});const pack=p&&preparedGitHubPackage(p);const filename=githubDownload.dataset.githubDownload;if(pack&&pack.files[filename]){const link=document.createElement("a"),blob=new Blob([pack.files[filename]],{type:"text/markdown;charset=utf-8"});link.href=URL.createObjectURL(blob);link.download=filename;link.click();URL.revokeObjectURL(link.href);setStatus(filename+" downloaded. Review it before uploading to GitHub.");}return;}
    const githubCopy=event.target.closest && event.target.closest("[data-github-copy]"); if(githubCopy){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;});const pack=p&&preparedGitHubPackage(p);const filename=githubCopy.dataset.githubCopy;if(!pack||!pack.files[filename])return;const unavailable=function(){setStatus("Clipboard unavailable. Select the preview text or download "+filename+" instead.");};if(!navigator.clipboard||typeof navigator.clipboard.writeText!=="function"){unavailable();return;}Promise.resolve().then(function(){return navigator.clipboard.writeText(pack.files[filename]);}).then(function(){setStatus(filename+" copied. Review it before uploading to GitHub.");}).catch(unavailable);return;}
    if(event.target.closest&&event.target.closest("[data-portfolio-close]")){closeBuilder();return;}
    if(event.target.closest&&event.target.closest("[data-portfolio-remove]")){if(confirm("Remove this portfolio entry? Your activity completion will stay unchanged.")){Portfolio.removeProject(localStorage,activeId);setStatus(localStorage.feedback("Portfolio entry removed. Activity completion was not changed.", Portfolio.STORAGE_KEY));renderProjects();closeBuilder();}return;}
    if(event.target.closest&&event.target.closest("[data-copy-readme]")){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;}); if(!p)return;
      const unavailable=function(){setStatus("Clipboard unavailable. Select the README preview or download it instead.");};
      if(!navigator.clipboard || typeof navigator.clipboard.writeText!=="function"){unavailable();return;}
      Promise.resolve().then(function(){return navigator.clipboard.writeText(Portfolio.markdown(p));}).then(function(){setStatus("README Markdown copied.");}).catch(unavailable);return;}
    if(event.target.closest&&event.target.closest("[data-download-readme]")){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;});if(p){const blob=new Blob([Portfolio.markdown(p)],{type:"text/markdown"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=p.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-README.md";a.click();URL.revokeObjectURL(a.href);setStatus("README downloaded.");}return;}
    if(event.target.closest && event.target.closest("#labs, .lesson, .lesson-container, .extension-check, .practice-check")) setTimeout(renderProjects,0);
  });
  document.addEventListener("submit",function(event){if(event.target.id!=="portfolio-form")return;event.preventDefault();const data=new FormData(event.target),changes={};["title","completedAt"].concat(Portfolio.LEARNER_FIELDS).forEach(function(f){changes[f]=data.get(f)||"";});Portfolio.updateProject(localStorage,activeId,changes);setStatus(localStorage.feedback("Project saved. Readiness has been updated.", Portfolio.STORAGE_KEY));renderProjects();openBuilder(activeId,true);});
  document.addEventListener("daily-practice-completed", renderProjects);
  document.addEventListener("attack-box-completed", renderProjects);
  renderProjects();
});

