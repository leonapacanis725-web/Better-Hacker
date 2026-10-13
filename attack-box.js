(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BetterHackerAttackBox = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STORAGE_KEY = "betterHackerAttackBoxState";
  const VERSION = 1;
  const XP_PER_CHALLENGE = 50;
  const CHALLENGES = Object.freeze([
    { id:"linux-navigation", title:"Linux: Navigate and inspect", track:"Linux", objective:"Find the learner notes by navigating the simulated home directory and reading the file.", hint:"Start with pwd and ls. Use cd to enter /home/learner, then cat notes.txt.", lesson:"#linux-lesson", required:["pwd","ls /home/learner","cd /home/learner","cat notes.txt"], dirs:["/","/home","/home/learner","/var","/var/log"], files:{"/home/learner/notes.txt":"Training note: review file ownership before changing permissions.\nThis is fictional challenge data."} },
    { id:"linux-log-search", title:"Linux: Search an authentication log", track:"Linux", objective:"Use grep to find repeated failed sign-ins and identify the source shown in the simulated log.", hint:"Search /var/log/auth.log for FAILED, then search the same file for the source address.", lesson:"#linux-lesson", required:["grep FAILED /var/log/auth.log","grep 192.0.2.44 /var/log/auth.log"], dirs:["/","/var","/var/log"], files:{"/var/log/auth.log":"2026-01-12T09:10:01Z sshd: FAILED user=admin src=192.0.2.44\n2026-01-12T09:10:08Z sshd: FAILED user=admin src=192.0.2.44\n2026-01-12T09:12:19Z sshd: ACCEPTED user=admin src=192.0.2.44\n2026-01-12T09:15:00Z sudo: command=cat /etc/passwd user=admin"} },
    { id:"network-inspection", title:"Networking: Inspect the training host", track:"Networking", objective:"Inspect the simulated interface and listening services, then check the approved training gateway.", hint:"Run ip addr, ss -tuln, and ping 192.0.2.10. This simulated address cannot contact a real host.", lesson:"#networking-lesson", required:["ip addr","ss -tuln","ping 192.0.2.10"], dirs:["/","/home","/home/learner"], files:{} },
    { id:"soc-incident-search", title:"SOC: Find the repeated failures", track:"SOC / SIEM", objective:"Search the fictional security log to identify repeated failed logins and the source address.", hint:"Use grep twice: first search for FAILED, then for the address shown in the matching records.", lesson:"#investigation-soc", required:["grep FAILED /var/log/security.log","grep 203.0.113.45 /var/log/security.log"], dirs:["/","/var","/var/log"], files:{"/var/log/security.log":"09:12:03 FAILED account=admin source=203.0.113.45\n09:12:09 FAILED account=admin source=203.0.113.45\n09:12:25 FAILED account=admin source=203.0.113.45\n09:13:02 SUCCESS account=admin source=203.0.113.45\n09:18:22 NEW_USER account=backup_service actor=admin\n09:24:10 AUDIT_LOG_CLEARED actor=admin"} },
    { id:"web-response-review", title:"Web Security: Review a safe response", track:"OWASP / Web Security", objective:"Inspect a fictional HTTP response and find its status code and a security header.", hint:"curl https://training.local displays a fixed response. Then use grep X-Frame-Options /tmp/response.txt.", lesson:"#web-security-lesson", required:["curl https://training.local","grep X-Frame-Options /tmp/response.txt"], dirs:["/","/tmp","/home","/home/learner"], files:{"/tmp/response.txt":"HTTP/1.1 200 OK\nContent-Type: text/plain\nX-Frame-Options: SAMEORIGIN\nReferrer-Policy: same-origin\n\nTraining response only."} }
  ].map(function (challenge) { return Object.freeze(challenge); }));

  const COMMANDS = Object.freeze(["pwd","ls","cd","cat","whoami","id","grep","find","ip","ping","curl","ss","ps"]);
  const challengeById = id => CHALLENGES.find(item => item.id === id) || null;
  function emptyState() { return { version:VERSION, completed:[] }; }
  function validateState(value) {
    if (!value || value.version !== VERSION || !Array.isArray(value.completed) || value.completed.length > CHALLENGES.length) return emptyState();
    const completed = Array.from(new Set(value.completed.filter(id => typeof id === "string" && challengeById(id))));
    return { version:VERSION, completed };
  }
  function read(storage) { try { return validateState(JSON.parse(storage.getItem(STORAGE_KEY))); } catch (_) { if (storage.reportCorruption) storage.reportCorruption(); return emptyState(); } }
  function complete(storage, id) {
    if (!challengeById(id)) return { newlyCompleted:false, state:read(storage) };
    const state = read(storage), newlyCompleted = !state.completed.includes(id);
    let saved=true;
    if (newlyCompleted) { state.completed.push(id); try { saved=storage.setItem(STORAGE_KEY, JSON.stringify(state)) !== false; } catch (_) { saved=false; } }
    return { newlyCompleted, state, saved };
  }
  function totalXp(state) { return validateState(state).completed.length * XP_PER_CHALLENGE; }
  function isChallengeComplete(id, commands) {
    const challenge=challengeById(id);
    const completedCommands=Array.isArray(commands)?commands.map(command=>String(command).replace(/\s+/g," ").toLowerCase()):[];
    return Boolean(challenge && challenge.required.every(required=>completedCommands.includes(required.toLowerCase())));
  }
  function normalizePath(path, cwd) {
    if (!path) return cwd;
    const parts = (path.startsWith("/") ? path : cwd + "/" + path).split("/");
    const output=[];
    for (const part of parts) { if (!part || part === ".") continue; if (part === "..") output.pop(); else output.push(part); }
    return "/" + output.join("/");
  }
  function execute(challengeId, input, cwd) {
    const challenge=challengeById(challengeId), command=typeof input === "string" ? input.trim() : "";
    const fail=(output, nextCwd) => ({ command, output, cwd:nextCwd || cwd || "/home/learner", ok:false });
    if (!challenge) return fail("Challenge not found.", "/home/learner");
    if (!command || command.length > 180 || /[;|&><`$\\\n\r\u0000-\u001f]/.test(command) || !/^[A-Za-z0-9_./:\-]+(?:\s+[A-Za-z0-9_./:\-]+)*$/.test(command)) return fail("Input not recognized. Enter one supported command with simple arguments.");
    const parts=command.split(/\s+/), name=parts[0], args=parts.slice(1), working=challenge.dirs.includes(cwd) ? cwd : "/home/learner";
    if (!COMMANDS.includes(name)) return fail("Command not supported in this simulated Attack Box. Try help.", working);
    const path=arg => normalizePath(arg, working);
    const directoryContents=target => {
      if (!challenge.dirs.includes(target)) return null;
      const children=new Set();
      challenge.dirs.forEach(dir => { if (dir !== target && dir.startsWith(target === "/" ? "/" : target + "/")) { const rest=dir.slice(target === "/" ? 1 : target.length+1); if (rest) children.add(rest.split("/")[0]+"/"); } });
      Object.keys(challenge.files).forEach(file => { if (file.startsWith(target === "/" ? "/" : target + "/")) { const rest=file.slice(target === "/" ? 1 : target.length+1); if (rest) children.add(rest.split("/")[0] + (rest.includes("/") ? "/" : "")); } });
      return Array.from(children).sort();
    };
    if (name === "pwd") return args.length ? fail("Usage: pwd",working) : {command,output:working,cwd:working,ok:true};
    if (name === "ls") { if (args.length>1) return fail("Usage: ls [simulated-path]",working); const target=path(args[0]); const items=directoryContents(target); return items ? {command,output:items.join("  ") || "(empty directory)",cwd:working,ok:true} : fail("ls: path not found in this challenge.",working); }
    if (name === "cd") { if (args.length!==1) return fail("Usage: cd simulated-directory",working); const target=path(args[0]); return challenge.dirs.includes(target) ? {command,output:"Current simulated directory: "+target,cwd:target,ok:true} : fail("cd: directory not found in this challenge.",working); }
    if (name === "whoami") return args.length ? fail("Usage: whoami",working) : {command,output:"learner",cwd:working,ok:true};
    if (name === "id") return args.length ? fail("Usage: id",working) : {command,output:"uid=1000(learner) gid=1000(learner) groups=1000(learner)",cwd:working,ok:true};
    if (name === "cat") { if (args.length!==1) return fail("Usage: cat simulated-file",working); const content=challenge.files[path(args[0])]; return typeof content === "string" ? {command,output:content,cwd:working,ok:true} : fail("cat: file not found in this challenge.",working); }
    if (name === "grep") { if (args.length!==2) return fail("Usage: grep search-text simulated-file",working); const content=challenge.files[path(args[1])]; if (typeof content!=="string") return fail("grep: file not found in this challenge.",working); const matches=content.split("\n").filter(line=>line.includes(args[0])); return {command,output:matches.length?matches.join("\n"):"No matching lines.",cwd:working,ok:true}; }
    if (name === "find") { if (args.length>1) return fail("Usage: find [simulated-directory]",working); const target=path(args[0] || "."); if (!challenge.dirs.includes(target)) return fail("find: start directory not found in this challenge.",working); return {command,output:Object.keys(challenge.files).filter(file=>file===target||file.startsWith(target==="/"?"/":target+"/")).sort().join("\n") || "No files in this challenge directory.",cwd:working,ok:true}; }
    if (name === "ip") return args.length===1 && args[0]==="addr" ? {command,output:"1: lo: <LOOPBACK,UP>\n    inet 127.0.0.1/8\n2: eth0: <BROADCAST,UP>\n    inet 192.0.2.20/24",cwd:working,ok:true} : fail("Supported form: ip addr",working);
    if (name === "ss") return args.length===1 && args[0]==="-tuln" ? {command,output:"Netid State  Local Address:Port\ntcp   LISTEN 0.0.0.0:22\ntcp   LISTEN 127.0.0.1:8080",cwd:working,ok:true} : fail("Supported form: ss -tuln",working);
    if (name === "ping") return args.length===1 && args[0]==="192.0.2.10" ? {command,output:"SIMULATION: 192.0.2.10 is a reserved documentation address.\n2 packets transmitted, 2 received, 0% packet loss",cwd:working,ok:true} : fail("Only the fixed simulated gateway 192.0.2.10 is available. No network request was made.",working);
    if (name === "curl") return args.length===1 && ["https://training.local","http://training.local"].includes(args[0]) ? {command,output:challenge.files["/tmp/response.txt"] || "SIMULATION: HTTP/1.1 200 OK\nContent-Type: text/plain\nTraining page only.",cwd:working,ok:true} : fail("Only https://training.local is available in the simulation. No network request was made.",working);
    if (name === "ps") return args.length===0 ? {command,output:"PID USER COMMAND\n1 root simulated-init\n42 learner training-shell (simulated)",cwd:working,ok:true} : fail("Usage: ps",working);
    return fail("Command not supported.",working);
  }
  return { STORAGE_KEY, VERSION, XP_PER_CHALLENGE, CHALLENGES, COMMANDS, emptyState, validateState, read, complete, totalXp, isChallengeComplete, execute };
});
