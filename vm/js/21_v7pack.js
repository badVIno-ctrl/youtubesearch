/* =====================================================================
   VIORA v7 — ровный интерфейс · анализ нового уровня · TG-студия
   ===================================================================== */
(function(){
'use strict';
if(window.__V7)return;window.__V7=true;
var W=window,D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(n){try{return W.fmt?W.fmt(n):String(n);}catch(e){return String(n);}}
function toast(m,t){try{W.vToast?vToast(m,t):0;}catch(e){}}
function medOf(a){var b=a.filter(function(x){return isFinite(x);}).sort(function(x,y){return x-y;});if(!b.length)return 0;var m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;}
async function ai(sys,user,max){var r=await callMistralRaw(sys,user,max||1200);if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){throw new Error('AI вернула не-JSON');}}return r;}
function S(){return (typeof STATE!=='undefined'&&STATE)?STATE:{};}
function allVids(){var s=S();return [].concat(s.shorts||[],s.longs||[]);}
function copyTxt(t,btn){
  function ok(){if(btn){var o=btn.textContent;btn.textContent='✓ Скопировано';setTimeout(function(){btn.textContent=o;},1400);}toast('Скопировано ✓','ok');}
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,function(){fb();});else fb();
  function fb(){var ta=D.createElement('textarea');ta.value=t;D.body.appendChild(ta);ta.select();try{D.execCommand('copy');ok();}catch(e){}ta.remove();}
}
W.v7Copy=function(btn){copyTxt(btn.getAttribute('data-c')||'',btn);};
var DOWS=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
function durFmt(sec){sec=Math.round(sec||0);if(sec<60)return sec+' сек';var m=Math.round(sec/60);return m+' мин';}

/* ============================================================ */
/* 💰 ДЕНЬГИ НА СТОЛЕ — топ-5 рычагов с оценкой по данным        */
/* ============================================================ */
function calcLevers(){
  var s=S(),g=s.groups||{},vs=allVids(),L=[];
  if(vs.length<8)return L;
  var chMed=medOf(vs.map(function(v){return v.viewsPerDay;}));
  /* 1. формат */
  var sm=(g.shorts&&g.shorts.med)||0,lm=(g.longs&&g.longs.med)||0;
  var sn=(s.shorts||[]).length,ln=(s.longs||[]).length;
  if(sn>=5&&ln>=5&&sm>0&&lm>0){
    var strong=sm>lm?'Shorts':'длинные ролики',weak=sm>lm?'длинных':'Shorts';
    var hi=Math.max(sm,lm),lo=Math.min(sm,lm);
    if(hi>=lo*1.4)L.push({ic:'⚖️',t:'Сместить план в сторону '+strong,why:'Медиана у '+strong+' — '+fmt(Math.round(hi))+' просм/день против '+fmt(Math.round(lo))+' у '+weak+' (×'+(hi/lo).toFixed(1)+'). Каждый ролик, снятый в сильном формате вместо слабого, в среднем приносит разницу ниже.',est:Math.round(hi-lo),act:{lab:'📊 Смотреть разбор форматов',fn:"document.getElementById('toggle')&&document.getElementById('toggle').scrollIntoView({behavior:'smooth'})"}});
  }
  /* 2. триггер заголовков */
  var tg=(s.triggerStats||[]).filter(function(t){return t&&t.verdict==='up'&&t.lift>=1.3&&t.count>=3;}).sort(function(a,b){return b.lift-a.lift;})[0];
  if(tg)L.push({ic:'🎣',t:'Добавлять триггер «'+tg.name+'» в заголовки',why:'Ролики с ним набирают ×'+tg.lift.toFixed(1)+' к остальным'+(tg.best&&tg.best.title?' — пример: «'+String(tg.best.title).slice(0,46)+'»':'')+'. Сейчас он лишь в '+Math.round((tg.share||0)*100)+'% заголовков.',est:Math.round(chMed*(tg.lift-1)),act:{lab:'🎣 Лаборатория триггеров',fn:"var x=document.getElementById('triggerSection');x&&x.scrollIntoView({behavior:'smooth'})"}});
  /* 3. ВИСП покрытие */
  try{
    var hiV=[],loV=[];
    vs.forEach(function(v){var sc=vispScore(v.title).score||0;(sc>=55?hiV:loV).push(v.viewsPerDay);});
    if(hiV.length>=4&&loV.length>=4){
      var hm=medOf(hiV),lm2=medOf(loV);
      if(hm>=lm2*1.3)L.push({ic:'✍️',t:'Дожимать заголовки по ВИСП до 55+',why:'Заголовки с сильным ВИСП (выгода/интрига/срочность/причастность) дают '+fmt(Math.round(hm))+' просм/день против '+fmt(Math.round(lm2))+' у слабых. Слабых на канале: '+loV.length+' из '+vs.length+'.',est:Math.round(hm-lm2),act:{lab:'⚔️ Арена заголовков',fn:"v4OpenTool&&v4OpenTool('arena')"}});
    }
  }catch(e){}
  /* 4. длина */
  var dom=ln>=sn?(s.longs||[]):(s.shorts||[]);
  var bins=binsFor(dom,ln>=sn);
  var bb=bins.filter(function(b){return b.n>=3;}).sort(function(a,b){return b.med-a.med;})[0];
  if(bb&&bins.length>1){
    var others=medOf(dom.filter(function(v){return !bb.test(v.dur);}).map(function(v){return v.viewsPerDay;}));
    if(others>0&&bb.med>=others*1.35)L.push({ic:'⏱',t:'Держать длину '+(ln>=sn?'длинных роликов':'Shorts')+' в зоне '+bb.lab,why:'В этой зоне медиана '+fmt(Math.round(bb.med))+' просм/день против '+fmt(Math.round(others))+' вне её ('+bb.n+' роликов в выборке).',est:Math.round(bb.med-others),act:{lab:'⏱ Оптимальная длина ниже',fn:"var x=document.getElementById('v7len');x&&x.scrollIntoView({behavior:'smooth'})"}});
  }
  /* 5. день недели */
  var byDow={};vs.forEach(function(v){(byDow[v.dow]=byDow[v.dow]||[]).push(v.viewsPerDay);});
  var dows=Object.keys(byDow).filter(function(k){return byDow[k].length>=3;}).map(function(k){return {d:+k,med:medOf(byDow[k]),n:byDow[k].length};}).sort(function(a,b){return b.med-a.med;});
  if(dows.length>=3){
    var bd=dows[0],rest=medOf(vs.filter(function(v){return v.dow!==bd.d;}).map(function(v){return v.viewsPerDay;}));
    if(rest>0&&bd.med>=rest*1.35)L.push({ic:'📅',t:'Публиковать по '+DOWS[bd.d]+' — лучший день канала',why:'Ролики, вышедшие в '+DOWS[bd.d]+', держат медиану '+fmt(Math.round(bd.med))+' просм/день против '+fmt(Math.round(rest))+' в остальные дни ('+bd.n+' роликов).',est:Math.round(bd.med-rest),act:{lab:'⏰ Карта времени',fn:"v6Open&&v6Open('timing')"}});
  }
  /* 6. регулярность */
  try{
    var sorted=vs.slice().sort(function(a,b){return new Date(a.published)-new Date(b.published);});
    if(sorted.length>=8){
      var gaps=[];for(var i=1;i<sorted.length;i++)gaps.push((new Date(sorted[i].published)-new Date(sorted[i-1].published))/864e5);
      var mg=medOf(gaps);
      var after=[],afterLong=[];
      for(var j=1;j<sorted.length;j++){(gaps[j-1]<=mg*1.5?after:afterLong).push(sorted[j].viewsPerDay);}
      if(after.length>=4&&afterLong.length>=4){
        var am=medOf(after),lm3=medOf(afterLong);
        if(am>=lm3*1.3)L.push({ic:'🔁',t:'Не делать пауз дольше ~'+Math.round(mg*1.5)+' дней',why:'Ролики, вышедшие в обычном ритме, набирают '+fmt(Math.round(am))+' просм/день; после долгих пауз — только '+fmt(Math.round(lm3))+'. Алгоритм наказывает за тишину.',est:Math.round(am-lm3),act:{lab:'📅 Открыть контент-календарь',fn:"v6Open&&v6Open('calendar')"}});
      }
    }
  }catch(e){}
  L=L.filter(function(x){return x.est>0;}).sort(function(a,b){return b.est-a.est;}).slice(0,5);
  return L;
}
function binsFor(list,isLong){
  var defs=isLong?[[0,180,'до 3 мин'],[180,480,'3–8 мин'],[480,900,'8–15 мин'],[900,1800,'15–30 мин'],[1800,1e9,'30+ мин']]:[[0,20,'до 20 сек'],[20,40,'20–40 сек'],[40,61,'40–60 сек'],[61,1e9,'60+ сек']];
  return defs.map(function(d){
    var sel=list.filter(function(v){return v.dur>=d[0]&&v.dur<d[1];});
    return {lab:d[2],n:sel.length,med:medOf(sel.map(function(v){return v.viewsPerDay;})),test:function(x){return x>=d[0]&&x<d[1];}};
  }).filter(function(b){return b.n>0;});
}
function secWrap(id,emoji,title,desc,inner){
  return '<div class="section v7-sec" id="'+id+'"><div class="section-h"><h2>'+emoji+' '+title+'</h2><div class="desc">'+desc+'</div></div>'+inner+'</div>';
}
function buildMoney(){
  var L=calcLevers();if(!L.length)return '';
  var mx=L[0].est||1;
  var inner='<div class="v7-money">'+L.map(function(x,i){
    return '<div class="v7-lev" style="animation-delay:'+(i*0.07)+'s"><div class="ic">'+x.ic+'</div><div><div class="tt">'+esc(x.t)+'</div><div class="why">'+esc(x.why)+'</div></div><div class="est"><b>+'+fmt(x.est)+'</b><small>просм/день на ролик</small></div><div class="bar"><i style="width:'+Math.max(8,Math.round(x.est/mx*100))+'%"></i></div>'+(x.act?'<div class="act"><button class="v4-btn ghost" onclick="'+x.act.fn.replace(/"/g,'&quot;')+'">'+x.act.lab+'</button></div>':'')+'</div>';
  }).join('');
  var sum=L.reduce(function(s,x){return s+x.est;},0);
  inner+='<div class="v7-sum">💡 Если закрыть все рычаги, потенциал — до <b>+'+fmt(sum)+' просм/день</b> с каждого нового ролика. Оценки честные: считаются из медиан твоего же канала, а не из воздуха.</div></div>';
  return secWrap('v7money','💰','Деньги на столе','Сколько просмотров канал недополучает прямо сейчас — посчитано на твоих данных, без ИИ-фантазий. Рычаги отсортированы по эффекту: начинай сверху.',inner);
}

/* ============================================================ */
/* 🧬 ФОРМУЛА КАНАЛА — топ-10% vs слабые 10%                     */
/* ============================================================ */
function decStats(list){
  var titles=list.map(function(v){return v.title||'';});
  function pct(f){return Math.round(list.filter(f).length/Math.max(1,list.length)*100);}
  var byDow={};list.forEach(function(v){byDow[v.dow]=(byDow[v.dow]||0)+1;});
  var topDow=Object.keys(byDow).sort(function(a,b){return byDow[b]-byDow[a];})[0];
  return {
    dur:medOf(list.map(function(v){return v.dur;})),
    tlen:Math.round(medOf(titles.map(function(t){return t.length;}))),
    digits:pct(function(v){return /\d/.test(v.title);}),
    quest:pct(function(v){return /\?/.test(v.title);}),
    caps:pct(function(v){return /[А-ЯA-Z]{4,}/.test(v.title);}),
    shorts:pct(function(v){return v.isShort;}),
    dow:topDow!=null?DOWS[+topDow]:'—',
    visp:Math.round(medOf(titles.map(function(t){try{return vispScore(t).score||0;}catch(e){return 0;}})))
  };
}
function buildFormula(){
  var vs=allVids();if(vs.length<10)return '';
  var sorted=vs.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;});
  var n=Math.max(3,Math.floor(vs.length*0.12));
  var top=sorted.slice(0,n),bot=sorted.slice(-n);
  var T=decStats(top),B=decStats(bot);
  function row(name,tv,bv){return '<div class="v7-fm-row"><div>'+name+'</div><div class="hit">🔥 '+tv+'</div><div class="flop">❄️ '+bv+'</div></div>';}
  var rows='<div class="v7-fm-row"><div>Параметр</div><div>Хиты (топ-'+n+')</div><div>Слабые ('+n+')</div></div>';
  function rowIf(name,tv,bv,raw1,raw2){ if(raw1===raw2)return; rows+=row(name,tv,bv); }
  rowIf('Длина ролика',durFmt(T.dur),durFmt(B.dur),durFmt(T.dur),durFmt(B.dur));
  rowIf('Длина заголовка',T.tlen+' симв.',B.tlen+' симв.',T.tlen,B.tlen);
  if(T.visp||B.visp)rowIf('ВИСП заголовка',T.visp+'/100',B.visp+'/100',T.visp,B.visp);
  rowIf('Цифры в заголовке',T.digits+'%',B.digits+'%',T.digits,B.digits);
  rowIf('Вопрос в заголовке',T.quest+'%',B.quest+'%',T.quest,B.quest);
  if(T.caps||B.caps)rowIf('CAPS-акценты',T.caps+'%',B.caps+'%',T.caps,B.caps);
  if(T.shorts!==B.shorts)rows+=row('Доля Shorts',T.shorts+'%',B.shorts+'%');
  rowIf('Частый день выхода',T.dow,B.dow,T.dow,B.dow);
  /* чек-лист из значимых отличий */
  var ck=[];
  function diff(a,b){return b>0?a/b:(a>0?9:1);}
  if(diff(T.visp,B.visp)>=1.25)ck.push('✍️ Заголовок собирай по ВИСП минимум на '+T.visp+'/100 — у хитов он именно такой, у слабых лишь '+B.visp+'.');
  if(T.digits>=B.digits+20)ck.push('🔢 Ставь конкретную цифру в заголовок — она есть у '+T.digits+'% хитов и только у '+B.digits+'% слабых.');
  if(T.quest>=B.quest+20)ck.push('❓ Вопрос в заголовке работает: '+T.quest+'% хитов против '+B.quest+'% у слабых.');
  if(Math.abs(T.dur-B.dur)>Math.max(30,B.dur*0.3))ck.push('⏱ Целься в длину ~'+durFmt(T.dur)+' — хиты канала живут именно там (слабые — ~'+durFmt(B.dur)+').');
  if(Math.abs(T.tlen-B.tlen)>=12)ck.push('📏 Держи заголовок около '+T.tlen+' символов — формат хитов этого канала.');
  if(T.dow!==B.dow&&T.dow!=='—')ck.push('📅 Хиты чаще выходят в '+T.dow+' — планируй сильные ролики на этот день.');
  if(!ck.length)ck.push('📊 Хиты и слабые ролики по упаковке близки — главный разрыв в темах. Смотри «Карту рубрик» ниже и масштабируй верхние.');
  var inner='<div class="v7-fm">'+rows+'</div><div class="v7-check">'+ck.map(function(c){var i=c.indexOf(' ');return '<div class="it"><span class="em">'+c.slice(0,i)+'</span><span>'+esc(c.slice(i+1))+'</span></div>';}).join('')+'</div>';
  return secWrap('v7formula','🧬','Формула канала: хиты vs слабые','Сравнил упаковку твоего топ-12% роликов с худшими — по сухим цифрам видно, из чего сделан хит именно на этом канале. Внизу — чек-лист «снимай так».',inner);
}

/* ============================================================ */
/* 📂 КАРТА РУБРИК                                               */
/* ============================================================ */
function buildTopics(){
  var s=S();
  var ts=(s.topics||[]).filter(function(t){return t&&t.name&&!/разное|прочее|все ролики/i.test(t.name)&&(t.count||0)>=2;});
  if(ts.length<2)return '';
  ts=ts.slice().sort(function(a,b){return (b.medVpd||0)-(a.medVpd||0);});
  var chMed=medOf(allVids().map(function(v){return v.viewsPerDay;}))||1;
  var mx=ts[0].medVpd||1;
  var inner='<div class="v7-top">'+ts.slice(0,8).map(function(t,i){
    var r=(t.medVpd||0)/chMed;
    var vd=r>=1.25?['up','🚀 Масштабируй']:r<=0.7?['down','⛔ Пересмотри']:['mid','👀 Наблюдай'];
    return '<div class="v7-tp"><div class="hd"><span class="nm">'+esc(t.name)+'</span><span class="ct">'+t.count+' роликов · '+Math.round((t.share||0)*100)+'% канала</span><span class="vd '+vd[0]+'">'+vd[1]+'</span></div><div class="bar"><i style="width:'+Math.max(6,Math.round((t.medVpd||0)/mx*100))+'%"></i></div><div class="st">'+fmt(Math.round(t.medVpd||0))+' просм/день (×'+r.toFixed(1)+' к уровню канала)'+(t.best&&t.best.title?' · лучший: «'+esc(String(t.best.title).slice(0,52))+'»':'')+'</div></div>';
  }).join('')+'</div>';
  return secWrap('v7topics','📂','Карта рубрик','Какие темы реально кормят канал, а какие тянут вниз. ×N — отношение медианы рубрики к общей медиане канала. Масштабируй верхние, нижние — меняй подачу или убирай.',inner);
}

/* ============================================================ */
/* ⏱ ОПТИМАЛЬНАЯ ДЛИНА                                          */
/* ============================================================ */
function lenCard(list,isLong,name){
  if(list.length<5)return '';
  var bins=binsFor(list,isLong).filter(function(b){return b.n>=2;});
  if(bins.length<2)return '';
  var mx=Math.max.apply(null,bins.map(function(b){return b.med;}))||1;
  var best=bins.slice().sort(function(a,b){return b.med-a.med;})[0];
  var bars='<div class="v7-bars">'+bins.map(function(b){
    return '<div class="v7-bcol'+(b===best?' best':'')+'"><span class="v">'+fmt(Math.round(b.med))+'/д</span><div class="b" style="height:'+Math.max(5,Math.round(b.med/mx*100))+'%"></div><span class="l">'+b.lab+'</span></div>';
  }).join('')+'</div>';
  var others=medOf(list.filter(function(v){return !best.test(v.dur);}).map(function(v){return v.viewsPerDay;}));
  var rec=others>0&&best.med>=others*1.2?'Лучшая зона — <b>'+best.lab+'</b>: медиана '+fmt(Math.round(best.med))+' просм/день против '+fmt(Math.round(others))+' вне её. Следующие ролики собирай под эту длину.':'Просмотры слабо зависят от длины — решают тема и упаковка. Длину выбирай под содержание.';
  return '<div class="v7-len-card"><h4>'+name+' · '+list.length+' шт.</h4>'+bars+'<div class="v7-len-rec">'+rec+'</div></div>';
}
function buildLen(){
  var s=S();
  var a=lenCard(s.longs||[],true,'🎬 Длинные ролики'),b=lenCard(s.shorts||[],false,'⚡ Shorts');
  if(!a&&!b)return '';
  return secWrap('v7len','⏱','Оптимальная длина','Медиана просмотров в день по зонам длительности — отдельно для длинных и Shorts. Зелёная зона — где живут твои просмотры.','<div class="v7-len">'+a+b+'</div>');
}

/* ============================================================ */
/* 📈 ДЕЛЬТА С ПРОШЛОГО АУДИТА (шапка)                          */
/* ============================================================ */
function buildDelta(){
  try{
    var ch=S().channel;if(!ch||!ch.id||typeof loadHistory!=='function')return;
    var h=loadHistory(ch.id);if(!h||h.length<2)return;
    var prev=h[h.length-2],cur=h[h.length-1];
    var meta=q('#dashboard .ch-meta');if(!meta||q('#v7delta'))return;
    function chip(lab,d,suf){if(!d)return '';var up=d>0;return '<span>'+lab+' <b class="'+(up?'up':'down')+'">'+(up?'▲ +':'▼ −')+fmt(Math.abs(d))+(suf||'')+'</b></span>';}
    var html=chip('Подписчики',(cur.subs||0)-(prev.subs||0))+chip('Просмотры',(cur.totalViews||0)-(prev.totalViews||0))+chip('Медиана/день',(cur.medVpd||0)-(prev.medVpd||0));
    if(!html)return;
    var days=Math.max(1,Math.round((cur.ts-prev.ts)/864e5));
    var el=D.createElement('div');el.className='v7-delta';el.id='v7delta';
    el.innerHTML='<span style="border-style:dashed">📈 за '+days+' дн.</span>'+html;
    meta.appendChild(el);
  }catch(e){}
}

/* ============================================================ */
/* 🔍 «ПОЧЕМУ ТАК?» — AI-разбор любого ролика по клику           */
/* ============================================================ */
var WHYC={};
function injectWhy(){
  qa('#groupArea .vid').forEach(function(card){
    if(q('.reason',card)||q('.v7-why-btn',card)||q('.v7-why-out',card))return;
    var id=card.getAttribute('data-vid');if(!id)return;
    var btn=D.createElement('button');btn.className='v7-why-btn';btn.type='button';
    btn.textContent='🧠 Почему такой результат? · спросить AI';
    btn.addEventListener('click',function(){whyRun(id,btn);});
    var deep=q('.deep-btn',card);
    if(deep)deep.parentNode.insertBefore(btn,deep);else (q('.body',card)||card).appendChild(btn);
  });
}
async function whyRun(id,btn){
  if(WHYC[id]){renderWhy(btn,WHYC[id]);return;}
  var v=allVids().concat(S().streams||[]).filter(function(x){return x.id===id;})[0];
  if(!v){toast('Не нашёл данные ролика','warn');return;}
  btn.disabled=true;btn.textContent='🧠 Думаю…';
  try{
    var s=S(),g=(v.isShort?(s.groups&&s.groups.shorts):(s.groups&&s.groups.longs))||{};
    var med=g.med||medOf(allVids().map(function(x){return x.viewsPerDay;}))||1;
    var hits=((g.hits||[]).slice(0,3)).map(function(h){return h.title;});
    var vp;try{vp=vispScore(v.title);}catch(e){vp={score:0};}
    var ctx={title:v.title,format:v.isShort?'Shorts':'длинный',durSec:Math.round(v.dur||0),ageDays:Math.round(v.age||0),views:v.views,viewsPerDay:Math.round(v.viewsPerDay),channelMedianVpd:Math.round(med),ratioToMedian:+(v.viewsPerDay/med).toFixed(2),engagementPct:+((v.engagement||0)*100).toFixed(1),vispScore:vp.score||0,publishedDow:DOWS[v.dow]||'',hour:v.hour,channelHits:hits,niche:s.primaryNiche||''};
    var r=await ai(
      'Ты — YouTube-аналитик. Объясни результат КОНКРЕТНОГО ролика относительно уровня его канала (ratioToMedian — главный факт). Опирайся только на данные. Верни СТРОГО JSON: {"verdict":"1 предложение: что произошло и насколько это выше/ниже нормы канала","cause":"главная причина в 1-2 предложениях, с цифрами из данных","fix":"одно конкретное действие: что сделать с этим роликом или учесть в следующем"}. По-русски, без воды.',
      JSON.stringify(ctx),900);
    var out={verdict:r.verdict||'',cause:r.cause||'',fix:r.fix||''};
    WHYC[id]=out;renderWhy(btn,out);
  }catch(e){btn.disabled=false;btn.textContent='🧠 Не вышло — попробовать ещё раз';}
}
function renderWhy(btn,r){
  var div=D.createElement('div');div.className='v7-why-out';
  div.innerHTML='<div class="h">🧠 AI-разбор</div>'+esc(r.verdict)+(r.cause?'<br/><b style="color:#cfe6f5">Причина:</b> '+esc(r.cause):'')+(r.fix?'<br/><b style="color:#9bf3bf">Что делать:</b> '+esc(r.fix):'');
  btn.parentNode.replaceChild(div,btn);
}

/* ============================================================ */
/* СБОРКА СЕКЦИЙ В ДАШБОРД                                       */
/* ============================================================ */
var building=false;
function enhanceDash(){
  if(building)return;
  var rep=q('#dashboard #report');if(!rep)return;
  building=true;
  try{
    if(!q('#v7money')){
      var verdSec=q('#dashboard .verdict');
      var anchor=verdSec?verdSec.closest('.section'):null;
      var html=buildMoney()+buildFormula()+buildTopics()+buildLen();
      if(html&&anchor){
        var tmp=D.createElement('div');tmp.innerHTML=html;
        var nodes=Array.prototype.slice.call(tmp.children);
        var after=anchor;
        nodes.forEach(function(n){n.__acc=true;after.insertAdjacentElement('afterend',n);after=n;});
      }
    }
    buildDelta();
    injectWhy();
  }catch(e){}
  building=false;
}
var mo=new MutationObserver(function(){
  clearTimeout(mo.__t);
  mo.__t=setTimeout(enhanceDash,250);
});
function watchDash(){
  var d=q('#dashboard');if(!d)return;
  mo.observe(d,{childList:true,subtree:true});
  enhanceDash();
}

/* ============================================================ */
/* 🏭 ПОСТ-ЗАВОД ДЛЯ TELEGRAM                                    */
/* ============================================================ */
function pzEnsureOv(){
  if(q('#v4ov_v7pz'))return;
  var ov=D.createElement('div');ov.className='v4-ov';ov.id='v4ov_v7pz';
  ov.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\'v7pz\')">←</button><div class="v4-ttl"><span>🏭</span> Пост-завод <small>пакет контента для Telegram за один клик</small></div></div><div class="v4-body"><div class="v4-wrap" id="v7pzBody"></div></div>';
  D.body.appendChild(ov);
  var el=q('#v7pzBody');
  el.innerHTML=''+
  '<div class="v4-note">Опиши тему — соберу готовый пакет для Telegram-канала: пост-анонс, опрос для вовлечения, тизер для прогрева и текст закрепа. Всё можно сразу скопировать или поставить в контент-календарь.</div>'+
  '<div class="v4-lab" style="margin-top:12px">Тема / о чём пост</div>'+
  '<input class="v4-in" id="v7pzIdea" placeholder="например: вышел новый ролик про ошибки новичков в трейдинге"/>'+
  '<div class="v4-row" style="margin-top:9px;align-items:center">'+
    '<div class="v6-seg" id="v7pzGoal"><button class="on" data-g="reach">📣 Охват</button><button data-g="eng">💬 Вовлечение</button><button data-g="sell">💼 Продажа</button></div>'+
    '<button class="v4-btn" id="v7pzGo">🏭 Собрать пакет</button>'+
  '</div>'+
  '<div class="v7pz-out" id="v7pzOut"></div>';
  try{
    var s=S();var seed='';
    if(s.topics&&s.topics.length)seed=s.topics.slice().sort(function(a,b){return (b.medVpd||0)-(a.medVpd||0);})[0].name;
    if(seed)q('#v7pzIdea').value='пост по теме «'+seed+'» для подписчиков';
  }catch(e){}
  qa('#v7pzGoal button').forEach(function(b){b.addEventListener('click',function(){qa('#v7pzGoal button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  q('#v7pzGo').addEventListener('click',pzRun);
  q('#v7pzIdea').addEventListener('keydown',function(e){if(e.key==='Enter')pzRun();});
}
W.v7OpenPz=function(){
  pzEnsureOv();
  var ov=q('#v4ov_v7pz');ov.classList.add('open');D.body.style.overflow='hidden';
};
function pzCalAdd(txt,offset){
  try{
    var d=new Date();d.setDate(d.getDate()+offset);
    var k=d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
    var data={};try{data=JSON.parse(localStorage.getItem('v6_cal_v1')||'{}')||{};}catch(e){}
    (data[k]=data[k]||[]).push({t:txt.slice(0,90),type:'pub'});
    localStorage.setItem('v6_cal_v1',JSON.stringify(data));
    toast('Поставил в календарь на '+d.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+' ✓','ok');
  }catch(e){toast('Не удалось добавить','warn');}
}
W.v7PzCal=function(btn){pzCalAdd(btn.getAttribute('data-t')||'',+btn.getAttribute('data-o')||1);};
async function pzRun(){
  var idea=(q('#v7pzIdea')||{}).value.trim();
  if(idea.length<5){toast('Опиши тему поста','warn');return;}
  var goal=(q('#v7pzGoal .on')||{getAttribute:function(){return 'reach';}}).getAttribute('data-g');
  var goals={reach:'максимальный охват и пересылки',eng:'вовлечение: комментарии, реакции, опросы',sell:'мягкая продажа/подводка к продукту без агрессии'};
  var btn=q('#v7pzGo'),out=q('#v7pzOut');
  btn.disabled=true;out.innerHTML='<div class="v4-note">🏭 Собираю пакет…</div>';
  var s=S(),chCtx=s.channel?('Контекст: у автора YouTube-канал «'+(s.channel.title||'')+'» ('+fmt(s.channel.subs||0)+' подписчиков, ниша: '+(s.primaryNiche||'не определена')+'). Telegram — его приватка для самых лояльных.'):'Контекст: Telegram-канал автора контента.';
  try{
    var r=await ai(
      'Ты — редактор Telegram-каналов с сильным личным тоном (без канцелярита и ИИ-штампов). Собери пакет контента. Цель: '+goals[goal]+'. Верни СТРОГО JSON: {"announce":"пост-анонс 400-700 знаков: цепляющая первая строка, личный тон, абзацы, 1-2 эмодзи, конкретный CTA","teaser":"короткий пост-прогрев 200-350 знаков на день раньше: интрига без раскрытия","poll":{"q":"вопрос опроса","options":["вариант 1","вариант 2","вариант 3"]},"pin":"текст закрепа 150-250 знаков: кто автор, что здесь, почему остаться"}. По-русски.',
      chCtx+'\nТема: «'+idea+'»',2600);
    function flat(x){if(x==null)return '';if(typeof x==='string')return x;if(Array.isArray(x))return x.map(flat).filter(Boolean).join('\n');if(typeof x==='object')return Object.values(x).map(flat).filter(Boolean).join('\n\n');return String(x);}
    function card(ic,name,text,off){text=flat(text);
      return '<div class="v7pz-card"><div class="hd"><span>'+ic+'</span><span>'+name+'</span><span class="sp"></span><button class="v6-copy" data-c="'+esc(text)+'" onclick="v7Copy(this)">⧉</button><button class="v6-copy" data-t="TG: '+esc(name.toLowerCase())+' — '+esc(idea.slice(0,40))+'" data-o="'+off+'" onclick="v7PzCal(this)">📅</button></div><div class="bd">'+esc(text)+'</div></div>';
    }
    var h='';
    if(r.teaser)h+=card('🫦','Тизер (за день до)',r.teaser,1);
    if(r.announce)h+=card('📣','Пост-анонс',r.announce,2);
    if(r.poll&&r.poll.q){
      r.poll.q=flat(r.poll.q);r.poll.options=(r.poll.options||[]).map(flat);
      var pollTxt=r.poll.q+'\n'+(r.poll.options||[]).map(function(o){return '— '+o;}).join('\n');
      h+='<div class="v7pz-card"><div class="hd"><span>📊</span><span>Опрос (после анонса)</span><span class="sp"></span><button class="v6-copy" data-c="'+esc(pollTxt)+'" onclick="v7Copy(this)">⧉</button><button class="v6-copy" data-t="TG: опрос — '+esc(idea.slice(0,40))+'" data-o="3" onclick="v7PzCal(this)">📅</button></div><div class="bd" style="padding-bottom:6px">'+esc(r.poll.q)+'</div><div class="v7pz-poll">'+(r.poll.options||[]).map(function(o){return '<div class="opt">'+esc(o)+'</div>';}).join('')+'</div></div>';
    }
    if(r.pin)h+=card('📌','Закреп канала',r.pin,0);
    h+='<div class="v4-note">📅 — ставит пункт в контент-календарь (тизер завтра, анонс послезавтра, опрос через 3 дня). Открыть: меню 🧰 → Контент-календарь.</div>';
    out.innerHTML=h;
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось: '+esc(e.message||'AI недоступна')+'. Попробуй ещё раз.</div>';}
  btn.disabled=false;
}
function tgInit(){
  var tabs=q('#tgScreen .stg-tabs');
  if(!tabs||q('.stg-newchat.v7pz'))return;
  var b=D.createElement('button');b.className='stg-newchat v7pz';
  b.innerHTML='🏭 Пост-завод <span style="font-size:10px;background:rgba(255,45,85,.25);border-radius:6px;padding:2px 6px;margin-left:4px">NEW</span>';
  b.addEventListener('click',function(){W.v7OpenPz();});
  tabs.insertAdjacentElement('afterend',b);
}

/* ============================================================ */
/* INIT                                                          */
/* ============================================================ */
function init(){
  watchDash();
  tgInit();
  setTimeout(tgInit,1000);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init);else init();
})();
