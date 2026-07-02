(function(){
'use strict';
if(window.__v28)return;window.__v28=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function num(x){x=+x;return isFinite(x)?x:0;}
function median(a){a=(a||[]).filter(function(x){return isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function vids(){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v&&v.title;});}

function outliers(arr,label){
  if(!arr||arr.length<3)return null;
  var med=median(arr.map(function(v){return num(v.viewsPerDay);}));
  var sorted=arr.slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);});
  var top=sorted.slice(0,3).map(function(v){return {title:v.title,vpd:Math.round(num(v.viewsPerDay)),x:med?+(num(v.viewsPerDay)/med).toFixed(1):0};});
  var bottom=sorted.slice(-3).reverse().map(function(v){return {title:v.title,vpd:Math.round(num(v.viewsPerDay)),x:med?+(num(v.viewsPerDay)/med).toFixed(2):0};});
  return {label:label,median:Math.round(med),top:top,bottom:bottom,n:arr.length};
}

function computeLevers(ev){
  var L=[];
  try{
    if(ev.topics&&ev.topics.length>=2){
      var t0=ev.topics[0],tl=ev.topics[ev.topics.length-1];
      if(t0.medVpd&&tl.medVpd&&t0.medVpd>=tl.medVpd*1.5){var r=+(t0.medVpd/Math.max(1,tl.medVpd)).toFixed(1);L.push({score:r,lever:'Рубрика «'+t0.name+'» даёт медиану '+t0.medVpd+' просм/день — в '+r+'× выше слабых рубрик. Сместить контент сюда.'});}
    }
    if(ev.triggers&&ev.triggers.length){var tr=ev.triggers[0];if(tr.lift>1.1)L.push({score:+tr.lift.toFixed(2),lever:'Заголовки с «'+tr.trigger+'» заходят в '+tr.lift+'× лучше — добавлять в будущие ролики'+(tr.best?(' (пример: «'+tr.best+'»)'):'')+'.'});}
    if(ev.signals&&ev.signals.momentum&&ev.signals.momentum.deltaPct<0)L.push({score:Math.abs(ev.signals.momentum.deltaPct)/10+3,lever:'Просмотры падают на '+ev.signals.momentum.deltaPct+'% за 90 дней (медиана '+ev.signals.momentum.last+' против '+ev.signals.momentum.prev+') — приоритет №1 остановить спад.'});
    if(ev.longOutliers&&ev.longOutliers.top&&ev.longOutliers.top[0]&&ev.longOutliers.top[0].x>=2)L.push({score:ev.longOutliers.top[0].x,lever:'Ролик «'+ev.longOutliers.top[0].title+'» дал '+ev.longOutliers.top[0].x+'× медианы — разобрать почему и повторить формат/тему.'});
    if(ev.signals&&ev.signals.bestDuration)L.push({score:1.2,lever:'Лучшая длина роликов — '+ev.signals.bestDuration+', держаться её.'});
  }catch(e){}
  L.sort(function(a,b){return b.score-a.score;});
  return L.slice(0,5);
}

function buildEvidence(){
  var s=S();var all=vids();
  if(!all.length)return {ok:false};
  var longs=all.filter(function(v){return !v.isShort;});
  var shorts=all.filter(function(v){return v.isShort;});
  var sg=s.signals||{};
  var ev={
    ok:true,
    channel:(s.channel&&s.channel.title)||'',
    counts:{longs:longs.length,shorts:shorts.length},
    longOutliers:outliers(longs,'Длинные'),
    shortOutliers:outliers(shorts,'Shorts'),
    triggers:((s.triggerStats||[]).filter(function(t){return t&&t.verdict==='up'&&t.name;}).slice(0,5).map(function(t){return {trigger:t.name,lift:+num(t.lift).toFixed(2),inHits:t.count,best:t.best&&t.best.title};})),
    topics:((s.topics||[]).filter(function(t){return t&&t.name;}).slice().sort(function(a,b){return num(b.medVpd)-num(a.medVpd);}).slice(0,5).map(function(t){return {name:t.name,medVpd:Math.round(num(t.medVpd)),best:t.best&&t.best.title};})),
    signals:{
      bestWindow:(sg.bestWindow)?((sg.bestWindow.day||'')+' '+(sg.bestWindow.hourRange||'')).trim():'',
      bestDuration:(sg.durationSweetSpot&&sg.durationSweetSpot.best)||'',
      momentum:(sg.uploadMomentum)?{deltaPct:sg.uploadMomentum.deltaPct,last:(sg.uploadMomentum.last90&&sg.uploadMomentum.last90.medianVpd),prev:(sg.uploadMomentum.prev90&&sg.uploadMomentum.prev90.medianVpd)}:null,
      gapDays:(sg.posting&&sg.posting.medianGapDays)||0
    },
    leak:(s.ai&&s.ai.main_leak)||''
  };
  ev.levers=computeLevers(ev);
  return ev;
}

var _ev=null,_evTs=0,_evSig='';
function evSig(){var s=S();var v=[].concat(s.longs||[],s.shorts||[]);return ((s.channel&&s.channel.title)||'')+'|'+v.length+'|'+((s.signals&&s.signals.uploadMomentum&&s.signals.uploadMomentum.deltaPct)||'');}
function evidence(){var sig=evSig();if(_ev&&sig===_evSig&&Date.now()-_evTs<3000)return _ev;var e=buildEvidence();_ev=e;_evSig=sig;_evTs=Date.now();return e;}
W.v28evidence=function(){return buildEvidence();};

function evidenceText(){
  var ev;try{ev=evidence();}catch(e){ev=null;}
  if(!ev||!ev.ok)return '';
  var L=[];
  L.push('ДОКАЗАТЕЛЬНАЯ БАЗА КАНАЛА (посчитано по реальным данным — опирайся ТОЛЬКО на эти цифры и названия, не выдумывай свои):');
  if(ev.levers&&ev.levers.length){L.push('Главные рычаги по убыванию важности:');ev.levers.forEach(function(x,i){L.push((i+1)+') '+x.lever);});}
  if(ev.longOutliers)L.push('Длинные ролики: медиана '+ev.longOutliers.median+' просм/день. Хиты: '+ev.longOutliers.top.map(function(v){return '«'+v.title+'» ('+v.vpd+'/день, '+v.x+'× медианы)';}).join('; ')+'. Слабые: '+ev.longOutliers.bottom.map(function(v){return '«'+v.title+'» ('+v.vpd+'/день)';}).join('; ')+'.');
  if(ev.shortOutliers)L.push('Shorts: медиана '+ev.shortOutliers.median+' просм/день. Лучшие: '+ev.shortOutliers.top.map(function(v){return '«'+v.title+'» ('+v.vpd+'/день)';}).join('; ')+'.');
  if(ev.triggers&&ev.triggers.length)L.push('Триггеры заголовков, что реально работают на канале: '+ev.triggers.map(function(t){return '«'+t.trigger+'» (×'+t.lift+')';}).join('; ')+'.');
  if(ev.topics&&ev.topics.length)L.push('Рубрики по медиане просм/день: '+ev.topics.map(function(t){return t.name+' ('+t.medVpd+')';}).join('; ')+'.');
  var sg=ev.signals,sl=[];
  if(sg.bestWindow)sl.push('окно публикации хитов: '+sg.bestWindow);
  if(sg.bestDuration)sl.push('лучшая длина: '+sg.bestDuration);
  if(sg.momentum&&sg.momentum.deltaPct!=null)sl.push('динамика 90 дней: '+(sg.momentum.deltaPct>=0?'+':'')+sg.momentum.deltaPct+'%');
  if(sg.gapDays)sl.push('обычный интервал между роликами: '+sg.gapDays+' дн');
  if(sl.length)L.push('Сигналы: '+sl.join('; ')+'.');
  if(ev.leak)L.push('Гипотеза главной утечки роста: '+ev.leak+'.');
  L.push('');
  L.push('КОНТРАКТ ОТВЕТА (обязателен): начни с ОДНОГО самого важного рычага (см. список выше). Каждый совет привязывай к конкретной цифре или ролику ОТСЮДА, объясняй механизм (почему сработает на YouTube) и давай готовую формулировку или точное действие. Сравнивай с нормой канала («в N× выше/ниже медианы»). Если данных для совета не хватает — честно скажи об этом и не выдумывай числа. Не повторяй то, что автор уже сохранял или отвергал (см. ПАМЯТЬ О ТЕБЕ). Без общих фраз вроде «снимай регулярнее» и «улучши заголовки».');
  return L.join('\n');
}

function enhanceCtxEvidence(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v28ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    try{if(S().channel){var ev=evidenceText();if(ev)return base?(base+'\n\n'+ev):ev;}}catch(e){}
    return base;
  };
  wrapped.__v28ctx=true;W.v26ctx=wrapped;
}

function isRecoV28(sys){try{return /продюсер|рекоменд|совет|план|next_video|action_plan|иде|заголов|сценар|стратег|рост|утечк|воронк|разбор|аудит|тем|тренд|перехват|вердикт|фокус/i.test(String(sys||''));}catch(e){return false;}}
function quality(text){
  var t=String(text||'');
  var BAD=/(снимай(те)?\s+регулярнее|публикуй\s+чаще|улучши(ть)?\s+заголовк|делай(те)?\s+качествен|будь(те)?\s+(более\s+)?активн|вовлекай\s+аудитор|анализируй\s+(свой\s+)?канал|экспериментируй|просто\s+начни|верь\s+в\s+себя|следи\s+за\s+трендами|создавай\s+(качествен|интересн)|будь\s+собой)/gi;
  return {bad:(t.match(BAD)||[]).length,digits:(t.match(/\d/g)||[]).length,quotes:(t.match(/[«"][^»"]{4,}/g)||[]).length,len:t.length};
}
function weak(text){var m=quality(text);return (m.bad>=2&&m.digits<3)||(m.digits===0&&m.quotes===0&&m.len>220);}

function wrapQuality(){
  var orig=W.callMistralRaw;
  if(typeof orig!=='function'||orig.__v28)return;
  var wrapped=function(sys,user,max){
    var self=this,args=arguments;
    var reco=false;try{reco=isRecoV28(sys);}catch(e){}
    var p=Promise.resolve(orig.apply(self,args));
    if(!reco)return p;
    return p.then(function(r){
      try{
        var txt=(typeof r==='string')?r:JSON.stringify(r||'');
        if(weak(txt)){
          var u=(typeof user==='string')?user:'';
          var sharpen=u+'\n\nПРЕДЫДУЩИЙ ОТВЕТ БЫЛ СЛИШКОМ ОБЩИМ И БЕЗ ЦИФР. Переделай строго по контракту: каждый пункт — с конкретной цифрой или названием ролика из доказательной базы, с механизмом и готовой формулировкой. Никаких общих фраз.';
          return Promise.resolve(orig.call(self,sys,sharpen,max));
        }
      }catch(e){}
      return r;
    },function(err){return Promise.reject(err);});
  };
  wrapped.__v28=true;wrapped.__v27=true;wrapped.__v26=true;
  W.callMistralRaw=wrapped;
}

function extendScrub2(){
  if(W.vScrub&&W.vScrub.__v28)return;
  var orig=W.vScrub;
  var BAD3=/(используй\s+(теги|хэштеги)|добавь\s+призыв|сделай\s+яркую\s+обложк|работай\s+над\s+качеством|повышай\s+вовлечён|расскажи\s+о\s+себе|найди\s+свою\s+нишу|будь\s+уникальн|не\s+сдавайся|главное\s+постоянство)/i;
  function bad(t){return typeof t==='string'&&BAD3.test(t.trim());}
  function clean(x){if(typeof x==='string')return bad(x)?null:x;if(x&&typeof x==='object'){var t=x.text||x.step||x.title||x.idea||x.why||x.how||'';if(bad(t))return null;}return x;}
  var wrapped=function(data){
    try{if(Array.isArray(data)){var f=data.map(clean).filter(function(x){return x!=null;});data=f.length?f:data;}}catch(e){}
    try{if(typeof orig==='function')return orig(data);}catch(e){}
    return data;
  };
  wrapped.__v28=true;W.vScrub=wrapped;
}

function tick28(){try{enhanceCtxEvidence();}catch(e){}try{wrapQuality();}catch(e){}try{extendScrub2();}catch(e){}}
function boot28(){tick28();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot28);else boot28();
setTimeout(boot28,700);setTimeout(boot28,1800);setTimeout(boot28,3200);
setInterval(tick28,5000);
W.__v28api={evidence:W.v28evidence,evidenceText:evidenceText,quality:quality,weak:weak};
})();
