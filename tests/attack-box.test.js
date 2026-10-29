const assert=require('node:assert/strict');
const test=require('node:test');
const Box=require('../attack-box.js');
const State=require('../learner-state.js');

class MemoryStorage {
  constructor(seed={}){this.values={...seed};}
  getItem(key){return Object.hasOwn(this.values,key)?this.values[key]:null;}
  setItem(key,value){this.values[key]=String(value);return true;}
  reportCorruption(){}
}

test('simulated supported commands operate only on controlled challenge data',()=>{
  const id='linux-log-search';
  const cases=[
    ['pwd','/home/learner'],['ls /var/log','auth.log'],['cd /var/log','/var/log'],
    ['cat /var/log/auth.log','FAILED'],['whoami','learner'],['id','uid=1000'],
    ['grep FAILED /var/log/auth.log','FAILED'],['find /var/log','auth.log']
  ];
  for(const [command,expected] of cases){const result=Box.execute(id,command,'/home/learner');assert.equal(result.ok,true,command);assert.match(result.output,new RegExp(expected,'i'),command);}
  for(const [id,command,expected] of [
    ['network-inspection','ip addr','192.0.2.20'],['network-inspection','ss -tuln','8080'],
    ['network-inspection','ping 192.0.2.10','SIMULATION'],['web-response-review','curl https://training.local','200 OK'],
    ['linux-navigation','ps','training-shell']
  ])assert.match(Box.execute(id,command,'/home/learner').output,new RegExp(expected,'i'));
});

test('unsupported, malformed, oversized and external-target input is rejected without execution',()=>{
  for(const value of ['sudo id','uname -a','ls; id','cat /etc/passwd','curl https://example.com','ping 8.8.8.8','grep ( /tmp/a','x'.repeat(181),'grep FAILED /var/log/auth.log | cat']){
    const result=Box.execute('linux-log-search',value,'/home/learner');assert.equal(result.ok,false,value);assert.match(result.output,/not supported|not recognized|only the fixed|only https|file not found/i,value);
  }
});

test('challenge requirements can be completed and completion survives reload without duplicate XP',()=>{
  const storage=new MemoryStorage();
  const challenge=Box.CHALLENGES.find(item=>item.id==='soc-incident-search');
  const used=[];assert.equal(Box.isChallengeComplete(challenge.id,used),false);
  for(const command of challenge.required){const result=Box.execute(challenge.id,command,'/home/learner');assert.equal(result.ok,true);used.push(command);}
  assert.equal(Box.isChallengeComplete(challenge.id,used),true);
  const first=Box.complete(storage,challenge.id);assert.equal(first.newlyCompleted,true);assert.equal(Box.totalXp(first.state),50);
  const reloaded=new MemoryStorage({[Box.STORAGE_KEY]:storage.getItem(Box.STORAGE_KEY)});
  assert.deepEqual(Box.read(reloaded).completed,[challenge.id]);
  const repeat=Box.complete(reloaded,challenge.id);assert.equal(repeat.newlyCompleted,false);assert.equal(Box.totalXp(repeat.state),50);
  assert.equal(State.deriveXp({lessonsCompleted:0,exercisesCompleted:0,investigationsCompleted:0,reviewResult:null},State.emptyDailyState(),Box.totalXp(repeat.state)),50);
});

test('state rejects malformed and unknown completion records',()=>{
  assert.deepEqual(Box.validateState({version:99,completed:['linux-navigation']}),Box.emptyState());
  assert.deepEqual(Box.validateState({version:1,completed:['linux-navigation','fake','linux-navigation',4]}),{version:1,completed:['linux-navigation']});
  const result=Box.execute('linux-navigation','', '/home/learner');assert.equal(result.ok,false);
});

test('storage failures report a session-only completion without claiming it was saved',()=>{
  const storage={getItem(){return null;},setItem(){return false;}};
  const result=Box.complete(storage,'linux-navigation');
  assert.equal(result.newlyCompleted,true);assert.equal(result.saved,false);
  assert.equal(Box.totalXp(result.state),50);
  assert.equal(Box.read(storage).completed.length,0);
});

test('Attack Box uses the explicit safe command allowlist and no host or network execution APIs',()=>{
  const fs=require('node:fs');const source=fs.readFileSync(require.resolve('../attack-box.js'),'utf8');
  assert.deepEqual([...Box.COMMANDS],['help','pwd','ls','cd','cat','whoami','id','grep','find','ip','ping','curl','ss','ps']);
  assert.doesNotMatch(source,/\beval\s*\(|new Function|child_process|execSync|spawnSync|fetch\s*\(|XMLHttpRequest|WebSocket/);
  assert.match(fs.readFileSync(require.resolve('../attack-box-ui.js'),'utf8'),/No real shell, operating system, or network is connected/);
});
