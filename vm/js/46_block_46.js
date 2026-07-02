/* VIORA v24 — «Виора-Мозг»: единая память, самообучение, шкала «знаю тебя на X%», пульс-визуал. Self-contained. */
(function(){
'use strict';
if(window.__v24Booted)return;window.__v24Booted=true;
var D=document,LS=null;
try{LS=window.localStorage;}catch(e){}
var BKEY='viora_brain_v1';
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function jget(k,d){try{var v=LS.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function jset(k,v){try{LS.setItem(k,JSON.stringify(v));}catch(e){}}
function dkey(ts){var d=new Date(ts||Date.now());return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function dword(n){var a=n%10,b=n%100;if(a===1&&b!==11)return 'день';if(a>=2&&a<=4&&(b<10||b>=20))return 'дня';return 'дней';}
function raf(fn){if(typeof requestAnimationFrame==='function')return requestAnimationFrame(fn);return 0;}

function profile(){var p=jget('viora_profile_v1',{});return (p&&typeof p==='object')?p:{};}
function audits(){var a=jget('viora_hist_audit',[]);return Array.isArray(a)?a:[];}
function ideas(){var a=jget('viora_hist_idea',[]);return Array.isArray(a)?a:[];}
function shoots(){var s=jget('viora_shoots_v1',[]);return Array.isArray(s)?s:[];}
function calDays(){
  try{if(window.__v16&&window.__v16.calGet){var c=window.__v16.calGet();if(c&&Array.isArray(c.days))return c.days;}}catch(e){}
  try{for(var i=0;i<LS.length;i++){var k=LS.key(i);if(k&&k.indexOf('v16_cal:')===0){var v=jget(k,null);if(v&&Array.isArray(v.days)&&v.days.length)return v.days;}}}catch(e){}
  return [];
}
function snap(){
  var p=profile();var A=audits();var sh=shoots();var cd=calDays();
  var pf=0;['level','context','niche','goal'].forEach(function(k){if(p[k]&&String(p[k]).trim())pf++;});
  var scores=A.map(function(a){return +(a&&a.score)||0;}).filter(function(x){return x>0;});
  var top=scores.length?Math.max.apply(null,scores):0;
  var latest=A.length?(+(A[0]&&A[0].score)||0):0;
  var prev=A.length>1?(+(A[1]&&A[1].score)||0):0;
  var shot=sh.filter(function(s){return s&&/shot|pub|done|film/i.test(String(s.status||''));}).length;
  var pub=sh.filter(function(s){return s&&/pub/i.test(String(s.status||''));}).length;
  var fmtLong=0,fmtShort=0;
  cd.forEach(function(it){var f=String((it&&it.format)||'').toLowerCase();if(/short/.test(f))fmtShort++;else if(/long|длин/.test(f))fmtLong++;});
  sh.forEach(function(s){var f=String((s&&(s.format||s.type))||'').toLowerCase();if(/short/.test(f))fmtShort++;else if(/long|длин/.test(f))fmtLong++;});
  return {pf:pf,audits:A.length,top:top,latest:latest,prev:prev,shot:shot,pub:pub,ideas:ideas().length,plan:cd.length,fmtLong:fmtLong,fmtShort:fmtShort,niche:(p.niche||''),goal:(p.goal||''),level:(p.level||''),context:(p.context||'')};
}
function knowOf(s,br){
  var pts=0;
  pts+=Math.min(25,s.pf*6.25);
  pts+=Math.min(20,s.audits*8);
  pts+=s.plan>0?15:0;
  pts+=Math.min(15,s.shot*7.5);
  pts+=Math.min(10,s.pub*5);
  pts+=Math.min(5,s.ideas*1.5);
  var days=(br&&br.days&&br.days.length)||1;
  pts+=Math.min(10,(days-1)*2.5);
  return Math.max(0,Math.min(100,Math.round(pts)));
}
function load(){var b=jget(BKEY,null);if(!b||typeof b!=='object')b={};if(!b.v)b.v=1;if(!b.firstSeen)b.firstSeen=Date.now();if(!Array.isArray(b.days))b.days=[];if(!Array.isArray(b.snapshots))b.snapshots=[];if(!b.visits)b.visits=0;return b;}
function ingestOnce(){
  if(window.__v24state)return window.__v24state;
  var b=load();var now=Date.now();var today=dkey(now);
  b.gapMs=now-(b.lastSeen||now);
  var lastDay=b.days[b.days.length-1];
  if(lastDay!==today){b.days.push(today);if(b.days.length>120)b.days=b.days.slice(-120);b.visits=(b.visits||0)+1;}
  b.lastSeen=now;
  b.snapNow=snap();
  var last=b.snapshots[b.snapshots.length-1];
  if(last&&last.d===today)last.m=b.snapNow;else{b.snapshots.push({d:today,m:b.snapNow});if(b.snapshots.length>40)b.snapshots=b.snapshots.slice(-40);}
  b.know=knowOf(b.snapNow,b);
  jset(BKEY,b);
  window.__v24state=b;
  return b;
}
function tick(){
  var b=window.__v24state;if(!b)return;
  var pk=b.know;b.snapNow=snap();b.know=knowOf(b.snapNow,b);
  var today=dkey();var last=b.snapshots[b.snapshots.length-1];
  if(last&&last.d===today)last.m=b.snapNow;
  if(pk!==b.know)jset(BKEY,b);
}
function portraitLocal(s){
  var bits=[];
  if(s.niche)bits.push('ниша <b>'+esc(s.niche)+'</b>');
  if(s.level)bits.push(s.level==='pro'?'уже ведёшь канал':'делаешь первые шаги');
  if(s.context)bits.push(s.context==='fresh'?'тянет к трендам':s.context==='expert'?'любишь вечнозелёное':'миксуешь форматы');
  if(s.fmtShort>s.fmtLong&&s.fmtShort)bits.push('чаще ставишь Shorts');
  else if(s.fmtLong>s.fmtShort&&s.fmtLong)bits.push('предпочитаешь длинные ролики');
  if(s.pub>0)bits.push('доводишь до публикации');
  if(!bits.length)return 'Пока я только начинаю тебя узнавать. Заполни профиль и разбери канал — и я соберу твой портрет продюсера.';
  return 'Что я понял: '+bits.join(', ')+'.';
}
function insightsLocal(s){
  var out=[];
  if(s.audits>=2&&s.latest&&s.prev){var dl=s.latest-s.prev;out.push({d:dl>=0?'📈':'📉',t:dl>=0?('С прошлого разбора балл вырос на +'+dl+' — то, что ты меняешь, работает.'):('Балл просел на '+dl+' с прошлого разбора — вернись к подаче, что залетала.')});}
  if(s.plan>0&&s.shot===0)out.push({d:'🎬',t:'План собран, но ни одной съёмки не отмечено. Сними первый ролик из плана — пусть даже черновой.'});
  if(s.shot>0&&s.pub===0)out.push({d:'🚀',t:'Есть съёмки, но нет публикаций. Опубликуй — и я начну отслеживать реальный результат.'});
  if(s.fmtShort>=3&&s.fmtShort>s.fmtLong*2)out.push({d:'⚡',t:'Ты сильно завязан на Shorts. Добавь 1 длинный ролик в месяц — он держит ядро аудитории.'});
  if(s.audits===0)out.push({d:'🔍',t:'Я ещё не видел твой канал. Разбери его — и найду, что мешает росту именно у тебя.'});
  if(!s.goal&&s.audits>0)out.push({d:'🎯',t:'Цель не задана. С ней советы становятся точнее: подписчики, просмотры или продажи?'});
  if(s.ideas>0&&s.plan===0)out.push({d:'💡',t:'Ты искал идеи ('+s.ideas+'), но не собрал план. Перенеси лучшие темы в план на 30 дней.'});
  if(s.pub>0)out.push({d:'🔥',t:'Ты уже публикуешь — я сравниваю твои ролики между собой. Каждый новый разбор уточняет, что заходит именно у тебя.'});
  if(s.audits>0&&s.top)out.push({d:'🏆',t:'Лучший балл канала: '+s.top+'/100. Цель — стабильно держаться выше этой планки.'});
  if(!out.length)out.push({d:'✅',t:'Ты двигаешься ровно. Держи ритм: свежий разбор раз в 1–2 недели покажет динамику.'});
  return out.slice(0,4);
}
function breakLocal(s){
  if(s.audits===0)return {t:'Прорыв недели',s:'Разбери свой канал — это разблокирует персональные советы и план.'};
  if(s.plan===0)return {t:'Прорыв недели',s:'Собери контент-план на 30 дней по нише «'+(s.niche||'твоя тема')+'».'};
  if(s.shot===0)return {t:'Прорыв недели',s:'Сними 1 ролик из плана и отметь его в «Моих съёмках».'};
  if(s.pub===0)return {t:'Прорыв недели',s:'Опубликуй первый ролик — закрепи привычку выпускать.'};
  return {t:'Прорыв недели',s:'Выпусти ещё 1 ролик и сравни его с прошлым в разборе — ищем рост.'};
}
function lastDelta(b){
  var snaps=b.snapshots||[];var cur=b.snapNow||{};var prev=snaps.length>=2?snaps[snaps.length-2].m:null;
  if(!prev)return 'Я держу твой прогресс в памяти — продолжим с того, где остановились.';
  var msgs=[];
  if((cur.audits||0)>(prev.audits||0))msgs.push('новых разборов +'+((cur.audits||0)-(prev.audits||0)));
  if((cur.pub||0)>(prev.pub||0))msgs.push('публикаций +'+((cur.pub||0)-(prev.pub||0)));
  if((cur.shot||0)>(prev.shot||0))msgs.push('съёмок +'+((cur.shot||0)-(prev.shot||0)));
  if(!msgs.length)return 'Пора сделать шаг: свежий разбор или ролик из плана двинут тебя вперёд.';
  return 'С прошлого раза: '+msgs.join(', ')+'. Так держать.';
}
function aiSig(s){return [s.audits,s.plan,s.shot,s.pub,s.pf].join('-');}
function aiStale(b){var c=b.ai;return !c||!c.ts||(Date.now()-c.ts>20*3600*1000)||(c.sig!==aiSig(b.snapNow||snap()));}
function refreshAI(b){
  try{
    if(typeof window.callMistralRaw!=='function')return;
    var s=b.snapNow||snap();
    if(s.audits<1)return;
    if(!aiStale(b))return;
    if(b._aiNext&&Date.now()<b._aiNext)return;
    if(b._aiBusy)return;b._aiBusy=true;
    var sys='Ты — Viora AI, продюсер YouTube с памятью о пользователе. По его профилю и истории действий на платформе дай персональный разбор. Пиши по-русски, дружелюбно и конкретно, без воды и общих фраз. Верни СТРОГО валидный JSON: {"portrait":"1-2 предложения как ты понял этого автора","insights":["3-4 коротких наблюдения или совета строго по его данным"],"breakthrough":"одна цель-прорыв на эту неделю"}';
    var data={ниша:s.niche,уровень:s.level,контекст:s.context,цель:s.goal,разборов:s.audits,текущий_балл:s.latest,прошлый_балл:s.prev,лучший_балл:s.top,дней_в_плане:s.plan,снято:s.shot,опубликовано:s.pub,поисков_идей:s.ideas,shorts:s.fmtShort,длинных:s.fmtLong};
    var user='ДАННЫЕ АВТОРА:\n'+JSON.stringify(data)+'\n\nДай portrait, insights (массив строк) и breakthrough.';
    window.callMistralRaw(sys,user,900).then(function(r){
      b._aiBusy=false;
      if(r&&typeof r==='object'){
        var ins=Array.isArray(r.insights)?r.insights.filter(Boolean).map(String).slice(0,4):[];
        b.ai={ts:Date.now(),sig:aiSig(s),portrait:String(r.portrait||''),insights:ins,breakthrough:String(r.breakthrough||'')};
        jset(BKEY,b);
        try{var hub=D.getElementById('v22Hub');if(hub){var c=hub.querySelector('#v24Brain');if(c){c.setAttribute('data-sig','ai');refresh();}}}catch(e){}
      }
    }).catch(function(){b._aiBusy=false;b._aiNext=Date.now()+5*60*1000;});
  }catch(e){if(b){b._aiBusy=false;b._aiNext=Date.now()+5*60*1000;}}
}
function build(b){
  var s=b.snapNow||snap();
  var pct=b.know||0;
  var ai=b.ai||{};
  var portrait=ai.portrait?('Что я понял: '+esc(ai.portrait)):portraitLocal(s);
  var insArr=(ai.insights&&ai.insights.length)?ai.insights.map(function(t){return {d:'💡',t:esc(t)};}):insightsLocal(s);
  var brk=ai.breakthrough?{t:'Прорыв недели',s:esc(ai.breakthrough)}:breakLocal(s);
  var welcome='';
  if(b.gapMs&&b.gapMs>=12*3600*1000){
    var gd=Math.round(b.gapMs/864e5);
    welcome='<div class="v24-welcome"><div class="e">👋</div><div><div class="t">Пока тебя не было'+(gd>=1?(' ('+gd+' '+dword(gd)+')'):'')+'…</div><div class="s">'+lastDelta(b)+'</div></div></div>';
  }
  var insHtml=insArr.map(function(x){return '<div class="v24-insi"><div class="d">'+x.d+'</div><div class="t">'+x.t+'</div></div>';}).join('');
  var loy=(b.days&&b.days.length)||1;
  var thinking=b._aiBusy?'<span class="v24-think"> · думаю над тобой…</span>':'';
  return '<div class="v24-glow"></div><div class="v24-in">'+
    welcome+
    '<div class="v24-top"><div class="v24-ic">🧠</div><div><div class="v24-ttl">Виора-Мозг</div><div class="v24-sub">Твой AI-продюсер с памятью — учится на тебе с каждым визитом'+thinking+'</div></div></div>'+
    '<div class="v24-core">'+
      '<div class="v24-gauge"><canvas class="v24-canvas" id="v24pulse" width="296" height="296"></canvas><div class="v24-ring"><div style="text-align:center"><div class="pct" id="v24pct">0</div><div class="lbl">знаю тебя</div></div></div></div>'+
      '<div class="v24-coreR">'+
        '<div class="v24-portrait">'+portrait+'</div>'+
        '<div class="v24-know"><div class="v24-knowbar"><i id="v24bar"></i></div><div class="v24-knowlbl">Виора знает тебя на <b id="v24pl">'+pct+'</b>% · с тобой '+loy+' '+dword(loy)+' · чем больше действий, тем умнее советы</div></div>'+
      '</div>'+
    '</div>'+
    '<div class="v24-sec"><div class="v24-sec-h">✨ Виора заметила</div><div class="v24-ins">'+insHtml+'</div></div>'+
    '<div class="v24-sec"><div class="v24-break"><div class="e">🎯</div><div><div class="t">'+brk.t+'</div><div class="s">'+brk.s+'</div></div></div></div>'+
    '</div>';
}
function animateGauge(pct){
  try{
    var bar=D.getElementById('v24bar');if(bar)setTimeout(function(){bar.style.width=pct+'%';},60);
    var el=D.getElementById('v24pct');if(!el||typeof requestAnimationFrame!=='function'){if(el)el.textContent=pct;return;}
    var t0=null,dur=900;
    function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);var e=1-Math.pow(1-p,3);el.textContent=Math.round(pct*e);if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
  }catch(e){}
}
function startPulse(cv,pct){
  try{
    if(!cv||!cv.getContext||typeof requestAnimationFrame!=='function')return;
    var ctx=cv.getContext('2d');if(!ctx)return;
    var W=cv.width,H=cv.height,cx=W/2,cy=H/2;
    var intensity=Math.max(.16,pct/100);
    var hue=190+(300-190)*pct/100;
    var t=0;
    function frame(){
      if(cv.__stop||!D.body||!D.body.contains(cv))return;
      t+=0.016;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<3;i++){
        var ph=(t*0.6+i/3)%1;var r=ph*W*0.46;var a=(1-ph)*0.5*intensity;
        ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
        ctx.strokeStyle='hsla('+hue+',90%,62%,'+a+')';ctx.lineWidth=2.4;ctx.stroke();
      }
      var pulse=0.5+0.5*Math.sin(t*2);var coreR=W*0.18*(0.85+0.15*pulse);
      var g=ctx.createRadialGradient(cx,cy,0,cx,cy,coreR);
      g.addColorStop(0,'hsla('+hue+',95%,66%,'+(0.5+0.4*intensity)+')');
      g.addColorStop(1,'hsla('+hue+',95%,56%,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,coreR,0,Math.PI*2);ctx.fill();
      var pc=Math.round(3+pct/12);
      for(var k=0;k<pc;k++){
        var ang=t*0.8+k*(Math.PI*2/pc);var rr=W*0.30+Math.sin(t*1.5+k)*W*0.04;
        var px=cx+Math.cos(ang)*rr,py=cy+Math.sin(ang)*rr;
        ctx.beginPath();ctx.arc(px,py,2.2,0,Math.PI*2);
        ctx.fillStyle='hsla('+(190+(300-190)*(k/pc))+',90%,72%,'+(0.4+0.5*intensity)+')';ctx.fill();
      }
      cv.__raf=requestAnimationFrame(frame);
    }
    cv.__raf=requestAnimationFrame(frame);
  }catch(e){}
}
function sig(b){var s=b.snapNow||{};return [b.know,s.audits,s.plan,s.shot,s.pub,s.pf,(b.ai&&b.ai.ts)||0,(b.gapMs>=12*3600*1000)?1:0].join('|');}
function mountInto(hub,card){
  var ladder=hub.querySelector('#v23mPath');var today=hub.querySelector('.v22-today');
  if(ladder&&ladder.parentNode===hub){hub.insertBefore(card,ladder);return;}
  if(today&&today.parentNode===hub){if(today.nextSibling)hub.insertBefore(card,today.nextSibling);else hub.appendChild(card);return;}
  hub.appendChild(card);
}
function inject(){
  var hub=D.getElementById('v22Hub');if(!hub)return;
  if(hub.querySelector('#v24Brain'))return;
  var b=window.__v24state||ingestOnce();
  var card=D.createElement('section');card.id='v24Brain';card.className='v24-brain';card.setAttribute('data-sig',sig(b));card.innerHTML=build(b);
  mountInto(hub,card);
  var cv=card.querySelector('#v24pulse');card.__cv=cv;startPulse(cv,b.know||0);animateGauge(b.know||0);
  refreshAI(b);
}
function refresh(){
  var hub=D.getElementById('v22Hub');if(!hub)return;var card=hub.querySelector('#v24Brain');
  if(!card){inject();return;}
  tick();var b=window.__v24state;if(!b)return;var ns=sig(b);
  if(card.getAttribute('data-sig')!==ns){
    if(card.__cv)card.__cv.__stop=true;
    card.setAttribute('data-sig',ns);card.innerHTML=build(b);
    var cv=card.querySelector('#v24pulse');card.__cv=cv;startPulse(cv,b.know||0);animateGauge(b.know||0);
    refreshAI(b);
  }
}
function watch(){
  var hub=D.getElementById('v22Hub');
  if(!hub){setTimeout(watch,500);return;}
  ingestOnce();
  try{var mo=new MutationObserver(function(){if(!hub.querySelector('#v24Brain'))inject();});mo.observe(hub,{childList:true});}catch(e){}
  inject();
  try{setInterval(refresh,3000);}catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',watch);else watch();
window.__v24={build:build,inject:inject,refresh:refresh,ingestOnce:ingestOnce,snap:snap,knowOf:knowOf,sig:sig};
})();
