(function(){
'use strict';
if(window.__v27)return;window.__v27=true;
var D=document,W=window;
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}

var KEYS={prof:'viora_profile_v1',shoots:'viora_shoots_v1',cal:'viora_v26_cal',fb:'viora_fb_v1',model:'viora_user_model',niche:'viora_v26m3_niche'};

function detectNicheLite(){
  try{
    var s=S();if(s.primaryNiche)return s.primaryNiche;
    var el=D.getElementById('v25niche')||D.getElementById('ideaInput');
    if(el&&el.value&&el.value.trim())return el.value.trim();
    var p=lget(KEYS.prof,null);if(p&&p.niche)return p.niche;
    var last=lget(KEYS.niche,'');if(last)return last;
  }catch(e){}
  return '';
}
function readShoots(){var a=lget(KEYS.shoots,[]);return Array.isArray(a)?a:[];}

function buildModel(){
  var s=S(),c=s.channel||{},ai=s.ai||{},sig=s.signals||{};
  var prof=lget(KEYS.prof,null)||{};
  var shoots=readShoots();
  var cal=lget(KEYS.cal,[]);if(!Array.isArray(cal))cal=[];
  var fb=lget(KEYS.fb,[]);if(!Array.isArray(fb))fb=[];
  var rejected=fb.filter(function(x){return x&&x.vote===-1&&x.note;}).map(function(x){return x.note;}).slice(0,5);
  var liked=fb.filter(function(x){return x&&x.vote===1&&x.note;}).map(function(x){return x.note;}).slice(0,5);
  var prev=lget(KEYS.model,null)||{};
  var niche=s.primaryNiche||prof.niche||prev.niche||detectNicheLite()||'';
  var m={
    v:27,
    ts:Date.now(),
    hasChannel:!!s.channel,
    channel:c.title?{title:c.title,handle:c.handle||'',subs:(c.subs!=null?c.subs:null)}:(prev.channel||null),
    niche:niche,
    level:prof.level||prev.level||'',
    goal:prof.goalLabel||prof.goal||prev.goal||'',
    mainLeak:ai.main_leak||prev.mainLeak||'',
    hitFormula:(ai.hit_formula||prev.hitFormula||[]).slice(0,3),
    bestWindow:(sig.bestWindow&&sig.bestWindow.day)?(sig.bestWindow.day+' '+(sig.bestWindow.hourRange||'')).trim():(prev.bestWindow||''),
    bestDuration:(sig.durationSweetSpot&&sig.durationSweetSpot.best)||prev.bestDuration||'',
    topics:(s.topics||[]).slice(0,5).map(function(t){return t.name;}).filter(Boolean),
    competitors:(s.competitors||[]).slice(0,4).map(function(x){return (x.ch&&x.ch.title)||x.title||'';}).filter(Boolean),
    savedShoots:shoots.slice(0,8).map(function(x){return x.idea||x.title||'';}).filter(Boolean),
    savedCount:shoots.length,
    planWeeks:cal.length,
    rejected:rejected,
    liked:liked,
    auditCount:(prev.auditCount||0),
    _chsig:prev._chsig||''
  };
  try{
    if(c.title){
      var cs=(c.title||'')+'|'+(c.subs||'');
      if(cs!==prev._chsig){m.auditCount=(prev.auditCount||0)+1;m._chsig=cs;}
    }
  }catch(e){}
  return m;
}
function refreshModel(){try{var m=buildModel();lset(KEYS.model,m);return m;}catch(e){return lget(KEYS.model,{})||{};}}
W.v27model=function(){return lget(KEYS.model,null)||refreshModel();};
function modelSig(){
  var m=lget(KEYS.model,null)||{};
  return [m.hasChannel?1:0,m.niche||'',m.level||'',m.mainLeak||'',(m.hitFormula||[]).join(','),m.bestWindow||'',m.savedCount||0,m.planWeeks||0,(m.rejected||[]).length].join('|');
}

function memLines(){
  var m=lget(KEYS.model,null)||{};var L=[];
  if(m.savedShoots&&m.savedShoots.length)L.push('Уже сохранял идеи/ролики: '+m.savedShoots.slice(0,5).join('; ')+' — не предлагай это повторно, развивай дальше.');
  if(m.planWeeks)L.push('Ведёт контент-план ('+m.planWeeks+' пунктов) — учитывай преемственность.');
  if(m.rejected&&m.rejected.length)L.push('Ранее отвергал советы как слабые: '+m.rejected.join('; ')+' — не повторяй такие формулировки.');
  if(m.liked&&m.liked.length)L.push('Заходили советы в духе: '+m.liked.join('; ')+'.');
  if(m.auditCount>1)L.push('Это уже не первый разбор канала (разборов: '+m.auditCount+') — общайся как с возвращающимся автором, помни прошлый контекст.');
  return L;
}
function enhanceCtxMem(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v27ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    try{var L=memLines();if(L.length){var extra='ПАМЯТЬ О ТЕБЕ (между сессиями):\n'+L.join('\n');return base?(base+'\n'+extra):extra;}}catch(e){}
    return base;
  };
  wrapped.__v27ctx=true;W.v26ctx=wrapped;
}

var Q=[],ACTIVE=0,MAXC=2,GAP=140;
function pump(){
  if(ACTIVE>=MAXC)return;
  var job=Q.shift();if(!job)return;
  ACTIVE++;
  Promise.resolve().then(job.fn).then(function(v){ACTIVE--;setTimeout(pump,GAP);job.res(v);},function(e){ACTIVE--;setTimeout(pump,GAP);job.rej(e);});
  if(ACTIVE<MAXC)pump();
}
function schedule(fn){return new Promise(function(res,rej){Q.push({fn:fn,res:res,rej:rej});pump();});}
function hashStr(s){s=String(s);var h=5381,i=s.length;while(i)h=(h*33)^s.charCodeAt(--i);return (h>>>0).toString(36);}
var MEM={},TTL=8000,INFLIGHT={};
function isRecoV27(sys){try{return /продюсер|рекоменд|совет|план|next_video|action_plan|иде|заголов|сценар|стратег|рост|утечк|воронк|разбор|аудит|тем|тренд|перехват/i.test(String(sys||''));}catch(e){return false;}}
function keyFor(sys,user,max){
  var ctx='';try{if(isRecoV27(sys)&&typeof W.v26ctx==='function')ctx=W.v26ctx()||'';}catch(e){}
  return hashStr(String(sys)+'|~|'+String(user)+'|~|'+(max||'')+'|~|'+modelSig()+'|~|'+ctx);
}
function wrapMistral(){
  var orig=W.callMistralRaw;
  if(typeof orig!=='function')return;
  if(orig.__v27)return;
  var wrapped=function(sys,user,max){
    var key=null;try{key=keyFor(sys,user,max);}catch(e){key=null;}
    if(key){
      var c=MEM[key];
      if(c&&(Date.now()-c.ts<TTL))return Promise.resolve(c.val);
      if(INFLIGHT[key])return INFLIGHT[key];
    }
    var self=this,args=arguments;
    var p=schedule(function(){return orig.apply(self,args);});
    if(key){
      INFLIGHT[key]=p;
      p.then(function(v){MEM[key]={ts:Date.now(),val:v};delete INFLIGHT[key];try{var ks=Object.keys(MEM);if(ks.length>80){ks.sort(function(a,b){return MEM[a].ts-MEM[b].ts;});for(var i=0;i<ks.length-80;i++)delete MEM[ks[i]];}}catch(e){}},function(){delete INFLIGHT[key];});
    }
    return p;
  };
  wrapped.__v27=true;wrapped.__v26=true;
  W.callMistralRaw=wrapped;
}

function extendScrub(){
  if(W.vScrub&&W.vScrub.__v27)return;
  var orig=W.vScrub;
  var BAD2=/(будьте?\s+собой|просто\s+начни|главное\s+начать|не\s+бойся|верь\s+в\s+себя|регулярность\s+(это\s+)?ключ|контент\s+решает|качество\s+важнее\s+количеств|экспериментируй|пробуй\s+(разное|разн)|следи\s+за\s+трендами|изучи\s+(свою\s+)?аудитор|будь\s+(более\s+)?активн|вовлекай\s+аудитор|создавай\s+(качественн|интересн)|публикуй\s+чаще)/i;
  function bad(t){return typeof t==='string'&&BAD2.test(t.trim());}
  function clean(x){if(typeof x==='string')return bad(x)?null:x;if(x&&typeof x==='object'){var t=x.text||x.step||x.title||x.idea||x.why||x.how||'';if(bad(t))return null;}return x;}
  var wrapped=function(data){
    try{if(Array.isArray(data)){var f=data.map(clean).filter(function(x){return x!=null;});data=f.length?f:data;}}catch(e){}
    try{if(typeof orig==='function')return orig(data);}catch(e){}
    return data;
  };
  wrapped.__v27=true;W.vScrub=wrapped;
}

function tick27(){try{refreshModel();}catch(e){}try{enhanceCtxMem();}catch(e){}try{wrapMistral();}catch(e){}}
function boot27(){try{extendScrub();}catch(e){}tick27();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot27);else boot27();
setTimeout(boot27,600);setTimeout(boot27,1500);setTimeout(boot27,3000);
setInterval(tick27,4000);
W.__v27api={model:W.v27model,refresh:refreshModel,sig:modelSig,clearCache:function(){MEM={};INFLIGHT={};},stats:function(){return {cache:Object.keys(MEM).length,inflight:Object.keys(INFLIGHT).length,queue:Q.length,active:ACTIVE};}};
})();
