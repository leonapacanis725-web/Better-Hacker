document.addEventListener("DOMContentLoaded", function () {
  "use strict";
  const Portfolio = BetterHackerPortfolio;
  const list = document.querySelector("#portfolio-projects");
  const builder = document.querySelector("#portfolio-builder");
  const status = document.querySelector("#portfolio-status");
  let activeId = null;

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
    list.innerHTML=projects.length ? projects.map(function(project){const a=Portfolio.activityById(project.activityId), ready=Portfolio.readiness(project); return '<article class="portfolio-card"><p class="portfolio-type">'+escapeHtml(a.type)+'</p><h3>'+escapeHtml(project.title)+'</h3><p><strong>Skills:</strong> '+escapeHtml(a.skills.slice(0,3).join(" · "))+'</p><p><strong>Tools:</strong> '+escapeHtml(a.tools.join(" · ") || "No specific tool listed")+'</p><p class="readiness readiness-'+ready.status.toLowerCase().replaceAll(" ","-")+'">'+ready.status+'</p><div class="portfolio-actions"><button type="button" data-portfolio-view="'+a.id+'">View Project</button><button type="button" data-portfolio-edit="'+a.id+'">Edit Project</button><button type="button" data-portfolio-export="'+a.id+'">Export README</button></div></article>';}).join("") : '<div class="portfolio-empty"><h3>Your portfolio is ready for its first project</h3><p>Complete an eligible activity, then choose <strong>Add to Portfolio</strong>. Nothing is added automatically.</p></div>';
    renderEligible(); renderDashboard();
  }
  function openBuilder(id, viewOnly) {
    const project=Portfolio.read(localStorage).projects.find(function(p){return p.activityId===id;}), a=Portfolio.activityById(id); if (!project || !a || !builder) return;
    activeId=id; const ready=Portfolio.readiness(project);
    builder.hidden=false;
    builder.innerHTML='<div class="portfolio-builder-head"><div><p class="portfolio-type">'+escapeHtml(a.type)+'</p><h3 id="portfolio-builder-title" tabindex="-1">'+(viewOnly?'Project Detail':'Edit Portfolio Project')+'</h3></div><button type="button" data-portfolio-close aria-label="Close project builder">×</button></div>'+
      '<div class="readiness-panel" role="status"><strong>'+ready.status+'</strong><p>'+(ready.missing.length?'Add '+escapeHtml(ready.missing.join(", "))+' to make this evidence stronger.':'This project contains work performed, findings, and learning evidence.')+'</p></div>'+
      (viewOnly ? detailHtml(project,a) : formHtml(project,a))+'<div id="readme-preview" class="readme-preview" hidden></div>';
    builder.scrollIntoView({behavior:"smooth",block:"start"}); builder.querySelector("#portfolio-builder-title").focus(); setByte(a);
  }
  function authoredHtml(a) { return '<aside class="authored-info"><strong>Provided by Better Hacker</strong><p><b>Objective:</b> '+escapeHtml(a.objective)+'</p><p><b>Skills practised:</b> '+escapeHtml(a.skills.join(", "))+'</p><p><b>Relevant tools:</b> '+escapeHtml(a.tools.join(", ") || "None specified")+'</p></aside>'; }
  function formHtml(p,a) { const fields=[["commands","Commands I used"],["investigation","What I investigated / work I performed"],["findings","What I found"],["learned","What I learned"],["challenges","Challenges I encountered"],["solutions","How I solved them"]]; return authoredHtml(a)+'<form id="portfolio-form"><p class="learner-label"><strong>Your evidence</strong> — only record work you actually completed.</p><label>Project title<input name="title" maxlength="120" required value="'+escapeHtml(p.title)+'"></label><label>Completion date<input name="completedAt" type="date" value="'+escapeHtml(p.completedAt)+'"></label>'+fields.map(function(f){return '<label>'+f[1]+'<textarea name="'+f[0]+'" rows="4">'+escapeHtml(p[f[0]])+'</textarea></label>';}).join("")+'<div class="portfolio-actions"><button class="primary-button" type="submit">Save Project</button><button type="button" class="secondary-button" data-portfolio-remove>Remove from Portfolio</button></div></form>'; }
  function section(title,value){return value?'<section><h4>'+title+'</h4><p class="preserve-lines">'+escapeHtml(value)+'</p></section>':'';}
  function detailHtml(p,a){return authoredHtml(a)+'<div class="project-detail"><section><h4>Project Overview</h4><p>'+escapeHtml(a.type)+' · Completed '+escapeHtml(p.completedAt || "date not recorded")+'</p></section>'+section("Objective",a.objective)+section("Skills Demonstrated",a.skills.join(", "))+section("Tools Used",a.tools.join(", "))+section("Commands Used",p.commands)+section("Investigation / Work Performed",p.investigation)+section("Findings",p.findings)+section("Challenges and Solutions",[p.challenges,p.solutions].filter(Boolean).join("\n\n"))+section("What I Learned",p.learned)+'<section><h4>Related Better Hacker Activity</h4><a href="'+a.href+'">'+escapeHtml(a.title)+'</a></section></div><div class="portfolio-actions"><button type="button" data-portfolio-edit="'+a.id+'">Edit Project</button><button type="button" data-portfolio-export="'+a.id+'">Preview README</button></div>';}
  function showExport(id) { const project=Portfolio.read(localStorage).projects.find(function(p){return p.activityId===id;}); if(!project)return; if(!builder || activeId!==id)openBuilder(id,true); const preview=builder.querySelector("#readme-preview"), md=Portfolio.markdown(project); preview.hidden=false; preview.innerHTML='<h4>README Preview</h4><pre><code>'+escapeHtml(md)+'</code></pre><div class="portfolio-actions"><button type="button" data-copy-readme>Copy Markdown</button><button type="button" data-download-readme>Download .md</button></div>'; preview.scrollIntoView({block:"nearest"}); }
  document.addEventListener("click", function(event){
    const add=event.target.closest && event.target.closest("[data-portfolio-add],[data-portfolio-suggest]"); if(add){const id=add.dataset.portfolioAdd||add.dataset.portfolioSuggest,result=Portfolio.createProject(localStorage,id);setStatus(result.reason);renderProjects();if(result.project)openBuilder(id,false);return;}
    const edit=event.target.closest && event.target.closest("[data-portfolio-edit]"); if(edit){openBuilder(edit.dataset.portfolioEdit,false);return;}
    const view=event.target.closest && event.target.closest("[data-portfolio-view]"); if(view){openBuilder(view.dataset.portfolioView,true);return;}
    const exp=event.target.closest && event.target.closest("[data-portfolio-export]"); if(exp){showExport(exp.dataset.portfolioExport);return;}
    if(event.target.closest&&event.target.closest("[data-portfolio-close]")){builder.hidden=true;activeId=null;return;}
    if(event.target.closest&&event.target.closest("[data-portfolio-remove]")){if(confirm("Remove this portfolio entry? Your activity completion will stay unchanged.")){Portfolio.removeProject(localStorage,activeId);builder.hidden=true;setStatus("Portfolio entry removed. Activity completion was not changed.");renderProjects();}return;}
    if(event.target.closest&&event.target.closest("[data-copy-readme]")){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;}); if(navigator.clipboard&&p)navigator.clipboard.writeText(Portfolio.markdown(p)).then(function(){setStatus("README Markdown copied.");});return;}
    if(event.target.closest&&event.target.closest("[data-download-readme]")){const p=Portfolio.read(localStorage).projects.find(function(x){return x.activityId===activeId;});if(p){const blob=new Blob([Portfolio.markdown(p)],{type:"text/markdown"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=p.title.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-README.md";a.click();URL.revokeObjectURL(a.href);setStatus("README downloaded.");}return;}
    if(event.target.closest && event.target.closest("#labs, .lesson")) setTimeout(renderProjects,0);
  });
  document.addEventListener("submit",function(event){if(event.target.id!=="portfolio-form")return;event.preventDefault();const data=new FormData(event.target),changes={};["title","completedAt"].concat(Portfolio.LEARNER_FIELDS).forEach(function(f){changes[f]=data.get(f)||"";});Portfolio.updateProject(localStorage,activeId,changes);setStatus("Project saved. Readiness has been updated.");renderProjects();openBuilder(activeId,true);});
  document.addEventListener("daily-practice-completed", renderProjects);
  renderProjects();
});
