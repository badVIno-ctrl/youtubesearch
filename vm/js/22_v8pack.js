/* ===== V8 PACK: экономия Mistral (очередь+ретраи+кеш), слитые ИИ-проходы,
   локальный скор, сравнение замеров, новый PDF, умные слоты, прокачка плана ===== */
(function(){
'use strict';
var W=window,D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc8(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function ldel(k){try{localStorage.removeItem(k);}catch(e){}}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function wait8(ms){return new Promise(function(r){setTimeout(r,ms);});}
var DAY=864e5;
function chid(){try{return (STATE&&STATE.channel&&STATE.channel.id)||'';}catch(e){return '';}}
function today8(){return new Date().toISOString().slice(0,10);}
function toast8(m){try{if(W.vToast)W.vToast(m);}catch(e){}}
function fmt8(n){try{if(typeof W.fmt==='function')return W.fmt(n);}catch(e){}try{return Number(n).toLocaleString('ru-RU');}catch(e){return String(n);}}

/* ---- кеш-уборка: держим только свежие ключи v8 ---- */
function prune(prefix,keep){
  try{
    var ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(prefix)===0)ks.push(k);}
    if(ks.length<=keep)return;
    ks.map(function(k){var v=lget(k,{});return {k:k,ts:(v&&v.ts)||0};})
      .sort(function(a,b){return a.ts-b.ts;}).slice(0,ks.length-keep)
      .forEach(function(x){ldel(x.k);});
  }catch(e){}
}

/* =====================================================================
   1+4. ОБЁРТКА callMistralRaw: очередь (макс 2 параллельно), ретраи с
   экспоненциальной паузой и retry-after, таймаут 90с, опц. мемо-кеш  */
var QU={active:0,max:2,list:[]};
function qpump(){
  while(QU.active<QU.max&&QU.list.length){
    var t=QU.list.shift();
    QU.active++;
    (function(task){
      task.fn().then(function(v){QU.active--;qpump();task.res(v);},
                     function(e){QU.active--;qpump();task.rej(e);});
    })(t);
  }
}
function qrun(fn){return new Promise(function(res,rej){QU.list.push({fn:fn,res:res,rej:rej});qpump();});}

W.__v8ai={net:0,cache:0};
function parseAiText(txt){
  try{if(typeof W.vClean==='function'&&typeof W.vJsonParse==='function')return W.vJsonParse(W.vClean(txt));}catch(e){}
  return JSON.parse(txt);
}
async function rawFetch(sys,user,maxTokens){
  var lastErr=null;
  for(var i=0;i<4;i++){
    var ctrl,to;
    try{
      ctrl=new AbortController();to=setTimeout(function(){try{ctrl.abort();}catch(e){}},90000);
      var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',signal:ctrl.signal,
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+MISTRAL_API_KEY},
        body:JSON.stringify({model:MODEL_DEEP,temperature:0.5,max_tokens:maxTokens||1800,
          response_format:{type:'json_object'},
          messages:[{role:'system',content:sys},{role:'user',content:user}]})});
      clearTimeout(to);
      if(r.status===429||r.status>=500){
        lastErr=new Error('Mistral '+r.status);
        var ra=parseFloat(r.headers.get('retry-after'))||0;
        await wait8(ra>0?ra*1000:Math.min(16000,1200*Math.pow(2,i))+Math.random()*500);
        continue;
      }
      if(!r.ok)throw new Error('Mistral '+r.status);
      var j=await r.json();
      W.__v8ai.net++;
      var parsed=parseAiText((j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'{}');
      return (typeof W.vScrub==='function')?W.vScrub(parsed):parsed;
    }catch(e){
      try{clearTimeout(to);}catch(_){}
      if(e&&/Mistral 4\d\d/.test(e.message||'')&&!/429/.test(e.message||''))throw e;
      lastErr=e;
      await wait8(Math.min(12000,1000*Math.pow(2,i))+Math.random()*300);
    }
  }
  throw lastErr||new Error('Mistral недоступен');
}
var MEMOKEY=null; /* «расходуется» первым же вызовом */
W.callMistralRaw=async function(sys,user,maxTokens){
  var mk=MEMOKEY;MEMOKEY=null;
  if(mk){
    var hit=lget('v8m:'+mk,null);
    if(hit&&hit.v&&(Date.now()-hit.ts)<DAY){W.__v8ai.cache++;toast8('⚡ Ответ взят из кеша — 0 запросов к ИИ');return hit.v;}
  }
  var v=await qrun(function(){return rawFetch(sys,user,maxTokens);});
  if(mk){try{if(JSON.stringify(v).length<80000){lset('v8m:'+mk,{ts:Date.now(),v:v});prune('v8m:',10);}}catch(e){}}
  return v;
};

/* =====================================================================
   2. Кеш тем канала (aiTopics) — 24ч, инвалидация по новым роликам */
var _aiTopics=W.aiTopics;
if(typeof _aiTopics==='function'){
  W.aiTopics=async function(videos){
    var sig=((videos&&videos.length)||0)+':'+((videos&&videos[0]&&videos[0].id)||'');
    var key='v8t:'+chid();
    var hit=lget(key,null);
    if(hit&&hit.v&&hit.sig===sig&&(Date.now()-hit.ts)<DAY){W.__v8ai.cache++;return hit.v;}
    var v=await _aiTopics(videos);
    lset(key,{ts:Date.now(),sig:sig,v:v});prune('v8t:',6);
    return v;
  };
}

/* =====================================================================
   3. ЛОКАЛЬНЫЙ СКОР: детерминированный расчёт score + breakdown */
function localScore(payload){
  try{
    var sig=(payload&&payload.signals)||{};
    var all=[].concat(STATE.shorts||[],STATE.longs||[],STATE.streams||[]);
    if(!all.length)return null;
    var eng=all.reduce(function(s,v){return s+(v.engagement||0);},0)/all.length*100;
    var engScore=clamp(Math.round(eng/6*100),5,98);
    var gap=(sig.posting&&sig.posting.medianGapDays)||30;
    var regScore=gap<=3.5?94:gap<=7?82:gap<=10?68:gap<=14?55:gap<=21?42:gap<=30?30:18;
    var cons=(sig.posting&&sig.posting.consistency)||'';
    if(/высокая/.test(cons))regScore=Math.min(98,regScore+5);
    if(/низкая/.test(cons))regScore=Math.max(5,regScore-8);
    var g=STATE.groups||{};
    var hits=(((g.shorts||{}).hits)||[]).length+(((g.longs||{}).hits)||[]).length;
    var tot=(STATE.shorts||[]).length+(STATE.longs||[]).length||1;
    var share=hits/tot;
    var hitScore=clamp(Math.round(10+share*270),5,95);
    var vc=sig.vispCoverage||{};
    var pack;
    if((vc.hitsAvgLetters||0)===0&&(vc.flopsAvgLetters||0)===0){pack=55;}
    else{
      pack=clamp(Math.round(((vc.hitsAvgLetters||0)+(vc.flopsAvgLetters||0))/2/4*100),10,95);
      var nt=sig.numbersInTitle||{};
      if((nt.hitsPct||0)>(nt.flopsPct||0))pack=Math.min(95,pack+5);
    }
    var score=clamp(Math.round(engScore*0.3+regScore*0.25+hitScore*0.25+pack*0.2),3,97);
    return {score:score,breakdown:[
      {factor:'Вовлечённость',value:engScore},
      {factor:'Регулярность',value:regScore},
      {factor:'Доля хитов',value:hitScore},
      {factor:'Упаковка',value:pack}]};
  }catch(e){return null;}
}
W.__v8LocalScore=localScore;

/* =====================================================================
   1. СЛИТЫЙ МУЛЬТИПАСС: 6 запросов -> 2 (мега-проход + синтез-критик),
   плюс суточный кеш всего ИИ-разбора на канал */
var _origMP=W.callMistralMultipass;
function _kb(name){try{return (typeof kbFor==='function')?kbFor(name):'';}catch(e){return '';}}
function _kbp(arr){try{return (typeof kbPick==='function')?kbPick(arr):'';}catch(e){return '';}}
function _sp(sig,keys){try{return (typeof _sigPick==='function')?_sigPick(sig,keys):sig;}catch(e){return sig;}}
async function megaPass(payload){
  var sys='Ты — Viora AI, элитный YouTube-продюсер ($500/час). За ОДИН проход разбери канал по трём направлениям по РЕАЛЬНЫМ данным: '+
    '(1) УПАКОВКА: закономерности заголовков хитов vs провалов с цифрами; для каждого провала — 3 переписанных заголовка по ВИСП и идея превью с техникой, эмоцией и цветом; опирайся на signals.titleTechniques, vispCoverage, numbersInTitle, titleLen и titleTriggers (liftVsRest — во сколько раз ролики с триггером набирают больше). '+
    '(2) СТРАТЕГИЯ ФОРМАТОВ: Shorts vs длинные, баланс, регулярность, тренд — каждая мысль с цифрой из signals.formatBalance, shortsDuration, trend, posting; hit_formula — повторяемая формула хита ИМЕННО этого канала как чек-лист. '+
    '(3) РУБРИКИ И КОНКУРЕНТЫ: для каждой рубрики из topics — человеческий вывод с цифрой просм/день; ОБЯЗАТЕЛЬНО используй конкурентов (их topShorts/topLongs): идеи на основе ЧУЖИХ хитов — «у конкурента X видео про Y набрало Z — сними свою версию». content_ideas — темы, которых у автора ЕЩЁ НЕТ. '+
    'ЖЕЛЕЗНЫЕ ПРАВИЛА: никакой воды; каждая мысль с конкретной цифрой и названием ролика; сравнивай с медианой канала, а не с абсолютом; советы готовые к применению. '+_AUD_RULE+' Верни СТРОГО валидный JSON по схеме, без markdown.\n'+_kb('titles')+_kbp(['funnel','videoTypes','shorts','goldenTopics','visp']);
  var schema='Схема ответа (заполни ВСЕ ключи): {"title_patterns":["3-5 закономерностей заголовков, с цифрами"],"hits_reasons":[{"videoId":"","reason":"почему залетело, во сколько раз выше медианы"}],"flops_reasons":[{"videoId":"","reason":"конкретный диагноз","rewrites":["3 переписанных заголовка по ВИСП"],"thumb_idea":"техника превью + эмоция + цвет"}],"shorts_insights":"3-5 предложений с цифрами по Shorts","longform_insights":"3-5 предложений с цифрами по длинным","hit_formula":["3-5 пунктов формулы хита канала"],"topics":[{"name":"рубрика","verdict":"up|down|mid","note":"вывод с цифрой просм/день"}],"topic_conclusion":"2-4 предложения с цифрами: на что делать ставку","next_videos":[{"idea":"идея ролика","title":"готовый заголовок","format":"Shorts|Длинное","why":"почему зайдёт по данным","based_on":"свой хит или хит конкурента","expected":"порядок просмотров"}],"content_ideas":[{"topic":"тема, которой ещё нет","source":"конкурент + видео + сколько набрало","why_works":"почему работает","your_angle":"как адаптировать","format":"Shorts|Длинное"}],"competitor_takeaways":["приёмы конкурентов, которых нет у канала"],"versus":[{"name":"конкурент","insight":"чем обгоняет и что перенять, с цифрами"}]}';
  var tslim=function(v){return {videoId:v.videoId,title:v.title,viewsPerDay:v.viewsPerDay,xMedian:v.xMedian,engagementPct:v.engagementPct,titleLen:v.titleLen,hasNumber:v.hasNumber,hasQuestion:v.hasQuestion};};
  var slice={
    audience_profile:payload.audience_profile,
    channel:payload.channel,
    signals:_sp(payload.signals,['titleLen','numbersInTitle','titleTechniques','vispCoverage','capsHeavyTitlesPct','posting','trend','formatBalance','shortsDuration','bestWindow','streams']),
    titleTriggers:payload.titleTriggers,
    topics:payload.topics,
    competitors:payload.competitors,
    shorts:{count:payload.shorts.count,median_vpd:payload.shorts.median_vpd,hits:(payload.shorts.hits||[]).map(tslim),flops:(payload.shorts.flops||[]).map(tslim)},
    longform:{count:payload.longform.count,median_vpd:payload.longform.median_vpd,hits:(payload.longform.hits||[]).map(tslim),flops:(payload.longform.flops||[]).map(tslim)}
  };
  return W.callMistralRaw(sys+'\n\n'+schema,'Разбери этот канал по трём направлениям, конкретно и по цифрам:\n'+JSON.stringify(slice),3900);
}
async function synthPass(payload,M,ls){
  var sys='Ты — Viora AI, главный продюсер И строгий шеф-редактор («Критик») в одном лице. Сделай ФИНАЛЬНЫЙ СИНТЕЗ разбора канала: главная утечка роста (1-2 предложения с цифрами), скор и разбивка, эмоциональный профиль, триггеры, конкретные изменения и план по неделям. Требования критика: ноль воды и общих фраз; в каждом пункте — конкретная цифра канала и готовый пример (переписанный заголовок / идея превью / фраза хука); ничего не выдумывай сверх данных. ФОРМАТ СОВЕТА: ЧТО изменить -> ПОЧЕМУ (цифра) -> ЭФФЕКТ -> ПРИМЕР. '+_AUD_RULE+' Верни СТРОГО валидный JSON, без markdown.\n'+_kbp(['visp','hunt','funnel','scenarioErrors','mission','comments']);
  var schema='Схема ответа: {"main_leak":"1-2 предложения: главный ограничитель роста, с цифрами","leak_tag":"короткий тег, 2-4 слова","score":"число 0-100","score_breakdown":[{"factor":"Вовлечённость","value":0},{"factor":"Регулярность","value":0},{"factor":"Доля хитов","value":0},{"factor":"Упаковка","value":0}],"emotional_profile":{"summary":"1-2 предложения","works":[{"emotion":"что заходит","evidence":"ролик + цифра"}],"avoid":[{"emotion":"что не цепляет","why":"почему, с примером"}]},"triggers":[{"trigger":"триггер","example":"ролик, где сработал","how_to_use":"как применять"}],"concrete_changes":[{"change":"действие без воды","target":"ролик/рубрика","effect":"эффект в цифрах","priority":"high|medium|low"}],"action_plan":[{"step":"задача с деталями","why":"эффект в цифрах","priority":"high|medium|low","week":1}],"roadmap_story":"2-4 предложения: путь канала по датам"}';
  var anchor=ls?('РАСЧЁТНЫЙ СКОР (детерминированный, по формулам из метрик канала): общий '+ls.score+'; '+ls.breakdown.map(function(b){return b.factor+' '+b.value;}).join(', ')+'. Используй именно эти значения в score и score_breakdown (отклонение не более ±5) — твоя задача объяснить их, а не пересчитать.'):'';
  var brief={
    audience_profile:payload.audience_profile,
    channel:payload.channel,
    signals:payload.signals,
    titleTriggers:(payload.titleTriggers||[]).slice(0,8),
    topics_brief:(payload.topics||[]).map(function(t){return {name:t.name,verdict:t.verdict,medianViewsPerDay:t.medianViewsPerDay};}),
    from_mega:{title_patterns:(M&&M.title_patterns)||[],hit_formula:(M&&M.hit_formula)||[],shorts_insights:(M&&M.shorts_insights)||'',longform_insights:(M&&M.longform_insights)||'',topic_conclusion:(M&&M.topic_conclusion)||''}
  };
  return W.callMistralRaw(sys+'\n\n'+schema+'\n\n'+anchor,'Сведи всё в финальный вердикт по этому каналу:\n'+JSON.stringify(brief),3000);
}
if(typeof _origMP==='function'){
  W.callMistralMultipass=async function(payload){
    var key='v8ai:'+chid();
    var vsig=(STATE.videos&&STATE.videos.length||0)+':'+((STATE.videos&&STATE.videos[0]&&STATE.videos[0].id)||'');
    var hit=lget(key,null);
    if(hit&&hit.v&&hit.sig===vsig&&(Date.now()-hit.ts)<DAY){
      W.__v8ai.cache++;
      setTimeout(function(){toast8('⚡ ИИ-разбор взят из суточного кеша — 0 запросов к Mistral');},800);
      return hit.v;
    }
    var ls=localScore(payload);
    var M={},S={};
    try{M=await megaPass(payload);}catch(e){console.warn('v8 megaPass failed',e);}
    try{S=await synthPass(payload,M,ls);}catch(e){console.warn('v8 synthPass failed',e);}
    var merged=Object.assign({},M||{},S||{});
    if(!Object.keys(merged).length){
      console.warn('v8: оба слитых прохода пусты — откат на старый мультипасс');
      return _origMP(payload);
    }
    if(ls){
      var sc=parseFloat(merged.score);
      if(!isFinite(sc)||Math.abs(sc-ls.score)>15){merged.score=ls.score;merged.score_breakdown=ls.breakdown;}
    }
    merged._multipass=true;merged._v8=true;
    if(lset(key,{ts:Date.now(),sig:vsig,v:merged}))prune('v8ai:',4);
    return merged;
  };
}

/* =====================================================================
   2b. Мемо-кеш для тяжёлых разовых разборов (сутки, на канал) */
function memoWrap(name,keyFn){
  var orig=W[name];
  if(typeof orig!=='function')return;
  W[name]=function(){MEMOKEY=keyFn.apply(this,arguments);try{return orig.apply(this,arguments);}finally{}};
}
memoWrap('wkBuild',function(){return 'wk:'+chid()+':'+today8();});
memoWrap('fnlBuild',function(){return 'fnl:'+chid()+':'+today8();});

/* разбор одного ролика — кеш по id ролика на сутки */
var _asv=W.analyzeSingleVideo;
if(typeof _asv==='function'){
  W.analyzeSingleVideo=async function(v,med){
    var key='v8sv:'+((v&&v.id)||'');
    var hit=lget(key,null);
    if(hit&&hit.v&&(Date.now()-hit.ts)<DAY){W.__v8ai.cache++;return hit.v;}
    var a=await _asv(v,med);
    if(lset(key,{ts:Date.now(),v:a}))prune('v8sv:',30);
    return a;
  };
}
/* массовый разбор всех роликов — самый дорогой; кеш на канал+день */
var _bulk=W.callBulkAI;
if(typeof _bulk==='function'){
  W.callBulkAI=async function(onProg){
    var key='v8blk:'+chid();
    var hit=lget(key,null);
    if(hit&&hit.v&&(Date.now()-hit.ts)<DAY){
      W.__v8ai.cache++;
      if(onProg)onProg({pct:100,note:'⚡ Из суточного кеша — 0 запросов к ИИ'});
      toast8('⚡ Разбор роликов взят из кеша за сегодня');
      return hit.v;
    }
    var r=await _bulk(onProg);
    try{if(JSON.stringify(r).length<250000){if(lset(key,{ts:Date.now(),v:r}))prune('v8blk:',3);}}catch(e){}
    return r;
  };
}

/* =====================================================================
   5. СРАВНЕНИЕ ЗАМЕРОВ — бок о бок, внутри «Динамика канала» */
var DIFF={a:null,b:null};
function snapLabel(s){try{return new Date(s.ts||s.date).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}catch(e){return s.date;}}
function buildDiffUI(){
  var area=q('#historyArea');if(!area)return;
  var h=[];try{h=(typeof loadHistory==='function')?loadHistory(chid()):[];}catch(e){}
  var old=q('#v8diff');if(old)old.remove();
  if(!h||h.length<2)return;
  var box=D.createElement('div');box.id='v8diff';
  var hh=h.slice(-12);
  if(DIFF.a==null||DIFF.b==null){DIFF.a=hh.length-2;DIFF.b=hh.length-1;}
  DIFF.a=clamp(DIFF.a,0,hh.length-1);DIFF.b=clamp(DIFF.b,0,hh.length-1);
  var chips=hh.map(function(s,i){
    var cls=i===DIFF.a?' a':(i===DIFF.b?' b':'');
    return '<button type="button" class="v8d-chip'+cls+'" data-i="'+i+'">'+esc8(snapLabel(s))+(i===DIFF.a?' · A':(i===DIFF.b?' · B':''))+'</button>';
  }).join('');
  var A=hh[DIFF.a],B=hh[DIFF.b];
  function row(label,ka,disp){
    var a=A[ka],b=B[ka];disp=disp||function(x){return fmt8(Math.round(x));};
    var d=b-a;var pc=a!==0?Math.round((b/a-1)*100):(b>0?100:0);
    var dir=Math.abs(d)<1e-9?'flat':(d>0?'up':'down');
    var arrow=dir==='up'?'▲':dir==='down'?'▼':'■';
    return '<div class="v8d-row"><div class="l">'+label+'</div><div>'+disp(a)+'</div><div>'+disp(b)+'</div><div class="d '+dir+'">'+arrow+' '+(d>0?'+':'')+disp(d).replace('−−','−')+(dir!=='flat'?' ('+(pc>0?'+':'')+pc+'%)':'')+'</div></div>';
  }
  box.innerHTML='<div class="v8d-head">🔀 Сравнить два замера <span class="muted" style="font-weight:400;font-size:12px">— выбери A и B (первый клик ставит A, второй B)</span></div>'+
    '<div class="v8d-chips">'+chips+'</div>'+
    '<div class="v8d-table">'+
    '<div class="v8d-row hd"><div class="l"></div><div>A · '+esc8(snapLabel(A))+'</div><div>B · '+esc8(snapLabel(B))+'</div><div>Δ</div></div>'+
    row('Подписчики','subs')+
    row('Просмотры всего','totalViews')+
    row('Роликов','videoCount')+
    row('Медиана просм/день','medVpd')+
    row('Вовлечённость, %','eng',function(x){return (Math.round(x*100)/100)+'';})+
    '</div>';
  area.appendChild(box);
  qa('.v8d-chip',box).forEach(function(ch){
    ch.addEventListener('click',function(){
      var i=+ch.getAttribute('data-i');
      if(i===DIFF.b){return;}
      DIFF.a=DIFF.b;DIFF.b=i;
      if(DIFF.a===DIFF.b)DIFF.a=Math.max(0,DIFF.b-1);
      buildDiffUI();
    });
  });
}
var _rh=W.renderHistory;
if(typeof _rh==='function'){
  W.renderHistory=function(){var r=_rh.apply(this,arguments);try{DIFF={a:null,b:null};buildDiffUI();}catch(e){console.warn('v8 diff',e);}return r;};
}

/* =====================================================================
   6. НОВЫЙ PDF-ОТЧЁТ: компактная белая выжимка на 1-2 страницы */
W.v8PdfFull=W.exportPDF; /* старый полный скрин остаётся доступен */
function pdfBlock(title,inner){return '<div style="margin:0 0 18px"><div style="font-size:15px;font-weight:800;color:#1a1023;margin:0 0 8px;letter-spacing:.2px">'+title+'</div>'+inner+'</div>';}
function pdfStat(l,v){return '<div style="flex:1 1 30%;min-width:150px;background:#f6f3f9;border:1px solid #e8e2ef;border-radius:12px;padding:12px 14px"><div style="font-size:11px;color:#7a7385;text-transform:uppercase;letter-spacing:.6px">'+l+'</div><div style="font-size:20px;font-weight:800;color:#1a1023;margin-top:3px">'+v+'</div></div>';}
function topicTop(){
  return ((STATE.topics||[]).slice().sort(function(a,b){return (b.medVpd||0)-(a.medVpd||0);}).slice(0,3));
}
W.exportPDF=async function(ev){
  var btn=(ev&&ev.target)||(W.event&&W.event.target)||null;
  var old=btn?btn.textContent:'';
  if(btn){btn.textContent='⏳ Готовлю PDF…';btn.disabled=true;}
  var node=null;
  try{
    if(W.vEnsureLib){await vEnsureLib('html2canvas');await vEnsureLib('jspdf');}
    if(!W.html2canvas||!W.jspdf)throw new Error('библиотеки не загрузились (нужен интернет)');
    var ch=STATE.channel||{},ai=STATE.ai||{};
    var all=[].concat(STATE.shorts||[],STATE.longs||[]);
    var medV=0;try{medV=Math.round(median(all.map(function(v){return v.viewsPerDay;}))||0);}catch(e){}
    var sig=STATE.signals||{};
    var ls=localScore({signals:sig})||{score:null,breakdown:[]};
    var score=(ai.score!=null&&isFinite(parseFloat(ai.score)))?Math.round(parseFloat(ai.score)):ls.score;
    var bd=(ai.score_breakdown&&ai.score_breakdown.length?ai.score_breakdown:ls.breakdown)||[];
    var dateStr=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    node=D.createElement('div');
    node.style.cssText='position:fixed;left:-12000px;top:0;width:794px;background:#ffffff;color:#1a1023;font-family:Onest,Arial,sans-serif;padding:0;z-index:-1';
    var bars=bd.map(function(b){
      var v=clamp(Math.round(parseFloat(b.value)||0),0,100);
      return '<div style="margin:0 0 8px"><div style="display:flex;justify-content:space-between;font-size:12px;color:#4a4156"><span>'+esc8(b.factor)+'</span><b>'+v+'</b></div><div style="height:7px;border-radius:5px;background:#efeaf4;margin-top:3px"><div style="height:7px;border-radius:5px;width:'+v+'%;background:linear-gradient(90deg,#ff2d55,#ff7a4d)"></div></div></div>';
    }).join('');
    var formula=(ai.hit_formula||[]).slice(0,5).map(function(f){return '<div style="display:flex;gap:8px;margin:0 0 6px;font-size:13px;line-height:1.5"><span style="color:#ff2d55;font-weight:800">✓</span><span>'+esc8(typeof f==='string'?f:JSON.stringify(f))+'</span></div>';}).join('');
    var ideas=(ai.next_videos||[]).slice(0,3).map(function(n){return '<div style="background:#f6f3f9;border:1px solid #e8e2ef;border-radius:10px;padding:10px 12px;margin:0 0 7px"><div style="font-weight:700;font-size:13px">«'+esc8(n.title||n.idea||'')+'»</div><div style="font-size:12px;color:#6a6175;margin-top:3px">'+esc8(n.format||'')+(n.why?' · '+esc8(n.why):'')+'</div></div>';}).join('');
    var plan=(ai.action_plan||[]).filter(function(t){return t&&t.step;}).slice(0,6).map(function(t,i){return '<div style="display:flex;gap:9px;margin:0 0 7px;font-size:13px;line-height:1.5"><span style="flex:0 0 auto;width:20px;height:20px;border-radius:7px;background:#1a1023;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">'+(i+1)+'</span><span><b>'+esc8(typeof t.step==='string'?t.step:'')+'</b>'+(t.why?' — <span style="color:#6a6175">'+esc8(typeof t.why==='string'?t.why:'')+'</span>':'')+'</span></div>';}).join('');
    var tps=topicTop().map(function(t){return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;border-bottom:1px solid #efeaf4;padding:7px 0"><span style="font-weight:700">'+esc8(t.name)+'</span><span style="color:#6a6175">'+fmt8(Math.round(t.medVpd||0))+' просм/день</span></div>';}).join('');
    node.innerHTML=
      '<div style="background:linear-gradient(120deg,#160f1d,#2b1030);padding:26px 34px;color:#fff">'+
        '<div style="font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#ff8a9e;font-weight:800">Viora Media · АИ-аудит канала</div>'+
        '<div style="font-size:27px;font-weight:800;margin-top:7px">'+esc8(ch.title||'Канал')+'</div>'+
        '<div style="font-size:13px;color:#cfc7d8;margin-top:5px">'+fmt8(ch.subs||0)+' подписчиков · '+fmt8(ch.videoCount||0)+' роликов · отчёт от '+dateStr+'</div>'+
      '</div>'+
      '<div style="padding:26px 34px">'+
        '<div style="display:flex;gap:18px;align-items:stretch;margin:0 0 20px">'+
          '<div style="flex:0 0 170px;background:#160f1d;border-radius:16px;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px"><div style="font-size:44px;font-weight:800;background:linear-gradient(90deg,#ff2d55,#ff7a4d);-webkit-background-clip:text;background-clip:text;color:transparent">'+(score!=null?score:'—')+'</div><div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#b8aec6">Индекс роста / 100</div></div>'+
          '<div style="flex:1">'+bars+'</div>'+
        '</div>'+
        (ai.main_leak?pdfBlock('🩺 Главная утечка роста','<div style="background:#fff4f6;border:1px solid #ffd7de;border-left:4px solid #ff2d55;border-radius:10px;padding:12px 14px;font-size:13.5px;line-height:1.55">'+esc8(typeof ai.main_leak==='string'?ai.main_leak:'')+'</div>'):'')+
        pdfBlock('📊 Ключевые цифры','<div style="display:flex;gap:10px;flex-wrap:wrap">'+
          pdfStat('Медиана просм/день',fmt8(medV))+
          pdfStat('Ритм выхода',(sig.posting?('раз в ~'+sig.posting.medianGapDays+' дн'):'—'))+
          pdfStat('Лучшее окно',(sig.bestWindow&&sig.bestWindow.day?(sig.bestWindow.day+' · '+(sig.bestWindow.hourRange||'')):'—'))+
          '</div>')+
        (formula?pdfBlock('🧬 Формула хита канала',formula):'')+
        (tps?pdfBlock('📂 Сильнейшие рубрики',tps):'')+
        (ideas?pdfBlock('💡 Что снять дальше',ideas):'')+
        (plan?pdfBlock('🗓 Первые шаги плана',plan):'')+
        '<div style="margin-top:22px;padding-top:12px;border-top:1px solid #efeaf4;font-size:11px;color:#9a92a5;display:flex;justify-content:space-between"><span>Сделано в Viora Media — АИ-аудит YouTube-каналов</span><span>'+dateStr+'</span></div>'+
      '</div>';
    D.body.appendChild(node);
    var canvas=await html2canvas(node,{backgroundColor:'#ffffff',scale:2,useCORS:true,logging:false,windowWidth:794});
    var img=canvas.toDataURL('image/jpeg',0.94);
    var jsPDF=W.jspdf.jsPDF;
    var pdf=new jsPDF('p','mm','a4');
    var pw=210,ph=297;var iw=pw;var ih=canvas.height*pw/canvas.width;
    var pos=0,left=ih;
    pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;
    while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}
    var handle=(ch.handle||ch.title||'kanal').replace(/[^\wа-яА-ЯёЁ@-]+/g,'_');
    pdf.save('Viora_отчёт_'+handle+'_'+today8()+'.pdf');
    toast8('📄 PDF-отчёт готов');
  }catch(e){console.error(e);toast8('Не удалось собрать PDF: '+(e.message||e));}
  if(node)try{node.remove();}catch(e){}
  if(btn){btn.textContent=old;btn.disabled=false;}
};

/* =====================================================================
   7. УМНЫЕ СЛОТЫ в контент-календаре */
var DOWN=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
function calKey8(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function proposeSlots(){
  var sig=(STATE&&STATE.signals)||{};
  if(!STATE||!STATE.channel){return null;}
  var bw=sig.bestWindow||{};
  var bestDowIdx=Math.max(0,DOWN.indexOf(bw.day||''));/* пн по умолчанию */
  var hour=18;
  try{var m=String(bw.hourRange||'').match(/^(\d+)/);if(m)hour=clamp(+m[1],6,23);}catch(e){}
  var cadence=clamp(Math.round((sig.posting&&sig.posting.medianGapDays)||7),2,7);
  var fb=sig.formatBalance||{};
  var preferShorts=(fb.shortsMedianVpd||0)>(fb.longsMedianVpd||0)*1.2&&(fb.shortsCount||0)>2;
  var slots=[];
  var d=new Date();d.setDate(d.getDate()+1);
  /* первый слот — ближайший лучший день недели */
  while(((d.getDay()+6)%7)!==bestDowIdx)d.setDate(d.getDate()+1);
  for(var i=0;i<6;i++){
    var fmtName=preferShorts?(i%3===2?'длинный ролик':'Shorts'):(i%3===2?'Shorts':'длинный ролик');
    slots.push({key:calKey8(d),dow:DOWN[(d.getDay()+6)%7],label:d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}),t:'📤 Слот: '+fmtName+' · '+hour+':00'});
    d=new Date(d.getTime()+cadence*DAY);
  }
  return {slots:slots,why:'Окно: '+(bw.day||'Пн')+' '+(bw.hourRange||hour+' ч')+' (когда выходили хиты) · ритм: раз в '+cadence+' дн · формат: '+(preferShorts?'упор на Shorts':'упор на длинные')+' по медиане просмотров'};
}
function v8SlotsPanel(){
  var bodyEl=q('#v6body_calendar');if(!bodyEl)return;
  var ex=q('#v8slots');if(ex){ex.remove();return;}
  var p=proposeSlots();
  if(!p){toast8('Сначала проанализируй канал — слоты считаются по его данным');return;}
  var panel=D.createElement('div');panel.id='v8slots';
  panel.innerHTML='<div class="v8s-h">✨ Умные слоты публикаций <span class="muted" style="font-size:12px;font-weight:400">'+esc8(p.why)+'</span></div>'+
    '<div class="v8s-list">'+p.slots.map(function(s,i){return '<label class="v8s-it"><input type="checkbox" checked data-i="'+i+'"/><span><b>'+esc8(s.dow)+', '+esc8(s.label)+'</b> — '+esc8(s.t.replace('📤 Слот: ',''))+'</span></label>';}).join('')+'</div>'+
    '<div class="v8s-foot"><button class="v4-btn" id="v8sAdd">📅 Добавить выбранные</button><button class="v4-btn ghost" id="v8sX">Закрыть</button></div>';
  var top=q('.v6c-top',bodyEl);
  if(top&&top.parentNode)top.parentNode.insertBefore(panel,top.nextSibling);else bodyEl.insertBefore(panel,bodyEl.firstChild);
  q('#v8sX',panel).addEventListener('click',function(){panel.remove();});
  q('#v8sAdd',panel).addEventListener('click',function(){
    var data={};try{data=JSON.parse(localStorage.getItem('v6_cal_v1')||'{}')||{};}catch(e){}
    var n=0;
    qa('input[type=checkbox]',panel).forEach(function(cb){
      if(!cb.checked)return;
      var s=p.slots[+cb.getAttribute('data-i')];
      data[s.key]=data[s.key]||[];
      if(!data[s.key].some(function(e){return e.t===s.t;})){data[s.key].push({t:s.t});n++;}
    });
    try{localStorage.setItem('v6_cal_v1',JSON.stringify(data));}catch(e){}
    panel.remove();
    /* перерисовать календарь без доступа к замыканию: туда-обратно по месяцу */
    var pv=q('#v6cPrev'),nx=q('#v6cNext');if(pv&&nx){pv.click();nx.click();}
    toast8(n?('✨ Добавлено слотов: '+n):'Эти слоты уже в календаре');
  });
}
function v8SlotBtn(){
  var top=q('#v6body_calendar .v6c-top');
  if(!top||q('#v8SlotsBtn'))return;
  var b=D.createElement('button');
  b.id='v8SlotsBtn';b.className='v4-btn ghost';b.style.cssText='font-size:12px;padding:8px 12px';
  b.textContent='✨ Умные слоты';
  b.addEventListener('click',v8SlotsPanel);
  var imp=q('#v6cImp');
  if(imp&&imp.parentNode===top)top.insertBefore(b,imp);else top.appendChild(b);
}
var _v6o=W.v6Open;
if(typeof _v6o==='function'){
  W.v6Open=function(id){var r=_v6o.apply(this,arguments);try{if(id==='calendar')setTimeout(v8SlotBtn,180);}catch(e){}return r;};
}

/* =====================================================================
   8. ПРОКАЧКА ПЛАНА НА 30 ДНЕЙ: локальные задачи-рычаги + недели в календарь */
function leverTasks(){
  var out=[];var sig=(STATE&&STATE.signals)||{};
  try{
    var bw=sig.bestWindow||{};
    if(bw.day)out.push({step:'Публикуй следующие ролики в лучшее окно канала: '+bw.day+', '+(bw.hourRange||''),why:'По данным канала именно в это окно выходили хиты — алгоритм быстрее подхватывает ролик в часы активности твоей аудитории.',priority:'high',week:1});
    var t=((STATE.topics||[]).slice().sort(function(a,b){return (b.medVpd||0)-(a.medVpd||0);}))[0];
    if(t&&t.medVpd)out.push({step:'Сними 2 ролика в самой сильной рубрике «'+t.name+'»',why:'Эта рубрика даёт ~'+fmt8(Math.round(t.medVpd))+' просмотров/день — выше остальных тем канала.',priority:'high',week:1});
    var vc=sig.vispCoverage||{};
    if((vc.hitsAvgLetters||0)>(vc.flopsAvgLetters||0)&&vc.hitsAvgLetters>0)out.push({step:'Переупакуй заголовки 3 слабых роликов до уровня хитов по ВИСП ('+vc.hitsAvgLetters+' буквы из 4)',why:'У хитов в среднем '+vc.hitsAvgLetters+' буквы ВИСП, у слабых — '+vc.flopsAvgLetters+'. Недостаёт чаще всего: '+((vc.mostMissedInFlops||[]).join(', ')||'выгоды и интриги')+'.',priority:'medium',week:2});
    var longs=STATE.longs||[];
    if(longs.length>=6){
      var zones=[[8,15],[15,30],[30,99999]];
      var zs=zones.map(function(z){var vs=longs.filter(function(v){return v.dur>=z[0]*60&&v.dur<z[1]*60;});var meds=vs.map(function(v){return v.viewsPerDay;}).sort(function(a,b){return a-b;});return {z:z,n:vs.length,med:meds.length?meds[Math.floor(meds.length/2)]:0};}).filter(function(x){return x.n>=2;});
      zs.sort(function(a,b){return b.med-a.med;});
      if(zs.length>=2&&zs[0].med>zs[zs.length-1].med*1.3){
        var zlab=zs[0].z[1]>9000?(zs[0].z[0]+'+ мин'):(zs[0].z[0]+'–'+zs[0].z[1]+' мин');
        out.push({step:'Делай длинные ролики в лучшей зоне длительности: '+zlab,why:'Медиана просмотров/день в этой зоне ~'+fmt8(Math.round(zs[0].med))+' — заметно выше остальных длительностей канала.',priority:'medium',week:2});
      }
    }
  }catch(e){}
  return out.slice(0,3);
}
function injectLevers(){
  var ai=STATE&&STATE.ai;
  if(!ai||ai.__v8lev)return;
  ai.__v8lev=true;
  if(!Array.isArray(ai.action_plan))ai.action_plan=[];
  var have={};ai.action_plan.forEach(function(t){if(t&&t.step)have[String(t.step).toLowerCase().slice(0,50)]=1;});
  leverTasks().forEach(function(t){
    if(!have[String(t.step).toLowerCase().slice(0,50)])ai.action_plan.push(t);
  });
}
function weekToCal(w,tasks){
  var data={};try{data=JSON.parse(localStorage.getItem('v6_cal_v1')||'{}')||{};}catch(e){}
  var d=new Date();
  d.setDate(d.getDate()+((8-d.getDay())%7||7)); /* следующий понедельник */
  d=new Date(d.getTime()+(w-1)*7*DAY);
  var n=0;
  tasks.slice(0,5).forEach(function(t,i){
    var dd=new Date(d.getTime()+Math.min(i*2,6)*DAY);
    var k=calKey8(dd);
    data[k]=data[k]||[];
    var label='✅ '+t.slice(0,70);
    if(!data[k].some(function(e){return e.t===label;})){data[k].push({t:label,type:'shoot'});n++;}
  });
  try{localStorage.setItem('v6_cal_v1',JSON.stringify(data));}catch(e){}
  toast8(n?('📅 Неделя '+w+': '+n+' задач в календаре (открой 🧰 → Контент-календарь)'):'Эти задачи уже в календаре');
}
function decorateWeeks(){
  var el=q('#plan');if(!el)return;
  qa('.week-h',el).forEach(function(wh){
    if(wh.querySelector('.v8wk'))return;
    var m=(wh.textContent||'').match(/Неделя\s+(\d+)/);
    if(!m)return;
    var w=+m[1];
    var btn=D.createElement('button');
    btn.type='button';btn.className='v8wk';btn.textContent='📅 в календарь';
    btn.addEventListener('click',function(ev){
      ev.stopPropagation();
      var tasks=[];var n=wh.nextElementSibling;
      while(n&&!n.classList.contains('week-h')){
        if(n.classList.contains('task')&&!n.classList.contains('done2')){
          var ts=n.querySelector('.ts');
          if(ts){var clone=ts.cloneNode(true);qa('.prio',clone).forEach(function(x){x.remove();});tasks.push(clone.textContent.trim());}
        }
        n=n.nextElementSibling;
      }
      if(!tasks.length){toast8('В этой неделе всё уже сделано ✅');return;}
      weekToCal(w,tasks);
    });
    wh.appendChild(btn);
  });
}
var _rp=W.renderPlan;
if(typeof _rp==='function'){
  W.renderPlan=function(){
    try{injectLevers();}catch(e){}
    var r=_rp.apply(this,arguments);
    try{decorateWeeks();}catch(e){}
    return r;
  };
}

/* первичная уборка старых ключей */
try{prune('v8m:',10);prune('v8sv:',30);prune('v8ai:',4);prune('v8t:',6);prune('v8blk:',3);}catch(e){}
})();
