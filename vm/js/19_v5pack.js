/* ============================================================ */
/* VIORA V5 PACK — unified profile, editor v2, short links,     */
/* custom selects, daily card, sound design, concepts, mobile   */
/* ============================================================ */
(function(){
'use strict';
if(window.__V5)return;window.__V5=true;
var W=window,D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){s=String(s==null?'':s);return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function toast(m,t,ms){try{if(W.vToast){W.vToast(m,t||'ok',ms||2400);return;}}catch(e){}try{W.toastY&&W.toastY(m);}catch(e){}}
function copyTxt(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t);}catch(e){}try{var ta=D.createElement('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';D.body.appendChild(ta);ta.select();D.execCommand('copy');ta.remove();}catch(e){}return Promise.resolve();}
async function aiJson(sys,usr,max){
  var r=await callMistralRaw(sys,usr,max||1500);
  if(typeof r==='string'){try{r=JSON.parse(r.replace(/```json|```/g,'').trim());}catch(e){throw new Error('AI вернула не-JSON');}}
  return r;
}
function confetti(){try{if(typeof v4Confetti==='function'){v4Confetti();return;}}catch(e){}
  try{var wrap=D.createElement('div');wrap.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:16000;overflow:hidden';
  for(var i=0;i<60;i++){var p=D.createElement('i');var c=['#ff2d55','#ff7a4d','#36e07a','#36c2ff','#ffd23c','#a78bfa'][i%6];
  p.style.cssText='position:absolute;width:'+(6+Math.random()*7)+'px;height:'+(8+Math.random()*8)+'px;left:'+(Math.random()*100)+'%;top:-3%;background:'+c+';border-radius:2px;opacity:.95;transform:rotate('+(Math.random()*360)+'deg);transition:all '+(1.4+Math.random()*1.3)+'s cubic-bezier(.2,.6,.4,1)';
  wrap.appendChild(p);}
  D.body.appendChild(wrap);
  requestAnimationFrame(function(){qa('i',wrap).forEach(function(p){p.style.top=(70+Math.random()*40)+'%';p.style.left=(parseFloat(p.style.left)+(Math.random()*30-15))+'%';p.style.transform='rotate('+(Math.random()*900)+'deg)';p.style.opacity='0';});});
  setTimeout(function(){wrap.remove();},3000);}catch(e){}}

/* ============================================================ */
/* 1. GOOGLE AUTH — fully removed                                */
/* ============================================================ */
W.vMyChannel=function(){};
function killGoogle(){
  var r=q('#myChRow');if(r)r.remove();
  var b=q('#myChBtn');if(b)b.remove();
}

/* ============================================================ */
/* 2. CUSTOM DROPDOWNS — replace ugly native selects             */
/* ============================================================ */
function v5Select(sel){
  if(!sel||sel.__v5dd||sel.multiple)return;
  sel.__v5dd=true;
  var dd=D.createElement('div');dd.className='v5dd';
  var btn=D.createElement('button');btn.type='button';btn.className='v5dd-btn';
  var menu=D.createElement('div');menu.className='v5dd-menu';
  function label(){var o=sel.options[sel.selectedIndex];return o?o.text:'—';}
  function build(){
    btn.innerHTML='<span>'+esc(label())+'</span><span class="car">▼</span>';
    menu.innerHTML='';
    qa('option',sel).forEach(function(o,i){
      var it=D.createElement('button');it.type='button';it.className='v5dd-it'+(i===sel.selectedIndex?' on':'');
      it.textContent=o.text;
      it.addEventListener('click',function(e){e.stopPropagation();sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}));build();dd.classList.remove('open');});
      menu.appendChild(it);
    });
  }
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    var was=dd.classList.contains('open');
    qa('.v5dd.open').forEach(function(x){x.classList.remove('open');});
    if(!was){build();dd.classList.add('open');}
  });
  build();
  dd.appendChild(btn);dd.appendChild(menu);
  sel.style.display='none';
  sel.parentNode.insertBefore(dd,sel.nextSibling);
  if(sel.style.width)dd.style.width=sel.style.width;
  if(sel.style.maxWidth)dd.style.maxWidth=sel.style.maxWidth;
  if(sel.style.minWidth)dd.style.minWidth=sel.style.minWidth;
  /* rebuild when options change programmatically */
  new MutationObserver(build).observe(sel,{childList:true,attributes:true});
}
D.addEventListener('click',function(){qa('.v5dd.open').forEach(function(x){x.classList.remove('open');});});
function upgradeSelects(root){qa('select',root||D).forEach(function(s){
  /* v9: кастомные дропдауны по всему сайту (opt-out: .v9-native) */
  if(s.closest('.v9-native'))return;
  v5Select(s);
});}
/* watch v4 overlays for newly rendered selects */
new MutationObserver(function(ms){ms.forEach(function(m){var t=m.target;if(t&&t.querySelectorAll&&qa('select',t).length)upgradeSelects(t);});}).observe(D.body,{childList:true,subtree:true});

/* ============================================================ */
/* 3. UNIFIED PROFILE CENTER — one beautiful profile             */
/* ============================================================ */
var PKEY='viora_profile_v1',PLAN4='viora_plan4w_v1',GROW='viora_growth_plan_v1';
function pGet(){return lget(PKEY,null)||{};}
function pSet(p){try{if(typeof saveProfile==='function'){saveProfile(p);return;}}catch(e){}lset(PKEY,p);}
function chGet(){var c=pGet().channels;return Array.isArray(c)?c:[];}
function chSet(l){var p=pGet();p.channels=l;pSet(p);}
function growGet(){var a=lget(GROW,[]);return Array.isArray(a)?a:[];}
function uid(){return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
var P_TAB='over';
function v5ProfEnsure(){
  if(q('#v5Prof'))return;
  var ov=D.createElement('div');ov.id='v5Prof';
  ov.innerHTML='<div class="scrim" onclick="v5ProfClose()"></div><div class="v5p-card">'+
    '<button class="v5p-x" onclick="v5ProfClose()">✕</button>'+
    '<div class="v5p-hero"><div class="v5p-ava">👤</div><div><h3>Кабинет автора</h3><div class="sub" id="v5pSub"></div></div></div>'+
    '<div class="v5p-stats" id="v5pStats"></div>'+
    '<div class="v5p-tabs">'+[['over','📊 Обзор'],['data','⚙️ Данные'],['ch','📡 Каналы'],['plan','🗺 План'],['safe','💾 Бэкап']].map(function(t){return '<button class="v5p-tab" data-t="'+t[0]+'" onclick="v5ProfTab(\''+t[0]+'\')">'+t[1]+'</button>';}).join('')+'</div>'+
    '<div class="v5p-body" id="v5pBody"></div></div>';
  D.body.appendChild(ov);
}
function planCounts(){
  var done=0,total=0;
  var pl=lget(PLAN4,null);
  if(pl&&pl.weeks)pl.weeks.forEach(function(w){(w.tasks||[]).forEach(function(t){total++;if(t.done)done++;});});
  growGet().forEach(function(t){total++;if(t.done)done++;});
  return {done:done,total:total};
}
function v5pHead(){
  var p=pGet();
  var sub=q('#v5pSub');if(sub){
    var bits=[];
    if(p.goalLabel)bits.push(p.goalLabel);
    if(p.level)bits.push(p.level==='new'?'🐣 новичок':'🚀 опытный');
    sub.textContent=bits.length?bits.join(' · '):'Профиль, каналы и план роста — всё в одном месте';
  }
  var st=q('#v5pStats');if(!st)return;
  var pc=planCounts();
  var ach=lget('v4_achv_v1',{});var achN=Object.keys(ach).length;
  var shoots=[];try{shoots=(typeof loadShoots==='function'?loadShoots():[])||[];}catch(e){}
  var pub=shoots.filter(function(s){return s.status==='pub';}).length;
  st.innerHTML='<div class="v5p-stat"><div class="v">'+chGet().length+'</div><div class="l">каналов</div></div>'+
    '<div class="v5p-stat"><div class="v">'+(pc.total?pc.done+'/'+pc.total:'—')+'</div><div class="l">план выполнен</div></div>'+
    '<div class="v5p-stat"><div class="v">'+pub+'<span style="font-size:13px;color:#8d8b96">/'+shoots.length+'</span></div><div class="l">опубликовано</div></div>'+
    '<div class="v5p-stat"><div class="v">'+achN+'<span style="font-size:13px;color:#8d8b96">/11</span></div><div class="l">достижений</div></div>';
}
W.v5ProfOpen=function(tab){v5ProfEnsure();q('#v5Prof').classList.add('open');D.body.style.overflow='hidden';v5ProfTab(tab||P_TAB);};
W.v5ProfClose=function(){var m=q('#v5Prof');if(m)m.classList.remove('open');D.body.style.overflow='';};
W.v5ProfTab=function(t){
  P_TAB=t;v5pHead();
  qa('#v5Prof .v5p-tab').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===t);});
  var b=q('#v5pBody');if(!b)return;
  if(t==='over')renderOver(b);else if(t==='data')renderData(b);else if(t==='ch')renderCh(b);else if(t==='plan')renderPlanTab(b);else renderSafe(b);
};
/* --- Обзор --- */
function renderOver(b){
  var p=pGet();var ch=chGet();
  var yt=ch.filter(function(c){return c.type!=='tg';})[0];
  var pc=planCounts();var pct=pc.total?Math.round(pc.done/pc.total*100):0;
  b.innerHTML='<div class="v5p-sec">Быстрые действия</div><div class="v5p-row">'+
    (yt?'<button class="v5p-act hot" onclick="v5ChAnalyze(\''+yt.id+'\')">⚡ Аудит моего канала</button>':'<button class="v5p-act hot" onclick="v5ProfTab(\'ch\')">➕ Добавить свой канал</button>')+
    '<button class="v5p-act" onclick="v5ProfClose();try{v4OpenTool&&v4OpenTool(\'script\')}catch(e){}">🎬 Написать сценарий</button>'+
    '<button class="v5p-act" onclick="v5ProfClose();try{v4OpenTool&&v4OpenTool(\'prog\')}catch(e){}">📈 Мой прогресс</button>'+
    '<button class="v5p-act" onclick="v5ProfClose();try{enterTelegram&&enterTelegram();setTimeout(function(){try{vpOpen()}catch(e){}},300)}catch(e){}">📝 Мои посты</button>'+
    '<button class="v5p-act" onclick="v5ProfClose();try{(window.V30&&V30.open)?V30.open():0}catch(e){}">✦ Аналитика+</button></div>'+
    '<div class="v5p-sec">План роста</div>'+
    (pc.total?'<div class="v5p-prog"><div class="bar"><i style="width:'+pct+'%"></i></div><span>'+pc.done+' из '+pc.total+' · '+pct+'%</span></div><div class="v5p-row"><button class="v5p-act" onclick="v5ProfTab(\'plan\')">🗺 Открыть план</button></div>':'<div class="v5p-empty">Плана пока нет. Настрой профиль во вкладке «Данные» — соберу персональный план на 4 недели. Или добавь задачи вручную во вкладке «План».</div>')+
    (p.goal2||p.goal?'<div class="v5p-sec">Цель</div><div style="font-size:13.5px;color:#e8e6ec;line-height:1.6">🎯 '+esc(p.goal2||p.goal)+'</div>':'')+
    '<div class="v5p-priv">🔒 Всё хранится только в твоём браузере — без имён, почты и телефонов.</div>';
}
/* --- Данные --- */
function renderData(b){
  var p=pGet();
  function opt(g,v,e2,t,d){return '<button type="button" class="v5p-opt'+((p[g]||'')===v?' on':'')+'" onclick="v5DataSet(\''+g+'\',\''+v+'\')"><span style="font-size:19px">'+e2+'</span><span><b>'+t+'</b><small>'+d+'</small></span></button>';}
  b.innerHTML='<div class="v5p-sec">Опыт</div><div class="v5p-row">'+
    opt('level','new','🐣','Новичок','объясняем проще, без жаргона')+opt('level','pro','🚀','Уже веду канал','плотно, без азов')+'</div>'+
    '<div class="v5p-sec">Контент</div><div class="v5p-row">'+
    opt('context','fresh','🔥','Свежак / тренды','новости и инфоповоды')+opt('context','expert','🌲','Вечнозелёное','экспертиза и польза')+opt('context','mixed','🔀','И то, и то','смешанный контент')+'</div>'+
    '<div class="v5p-sec">Цель</div><input class="v5p-in" id="v5Goal" placeholder="Напр.: 10 000 подписчиков и продажи через Telegram" value="'+esc(p.goal2||p.goal||'')+'"/>'+
    '<div class="v5p-row" style="margin-top:14px"><button class="v5p-act hot" onclick="v5DataSave()">💾 Сохранить</button><button class="v5p-act" onclick="v5ProfClose();try{openProfileQuiz()}catch(e){}">🧭 Пройти полную настройку (5 вопросов)</button></div>'+
    '<div class="v5p-priv">Полная настройка пересоберёт план роста на 4 недели под твои ответы.</div>';
}
W.v5DataSet=function(g,v){var p=pGet();p[g]=v;pSet(p);renderData(q('#v5pBody'));};
W.v5DataSave=function(){
  var p=pGet();var g=(q('#v5Goal')||{}).value||'';p.goal2=g.trim();pSet(p);
  try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}
  toast('Профиль сохранён ✅');v5pHead();
};
/* --- Каналы --- */
function renderCh(b){
  var list=chGet();
  var rows=list.length?list.map(function(c){
    var yt=c.type!=='tg';
    return '<div class="v5p-ch"><div class="ic">'+(yt?'▶️':'✈️')+'</div><div class="m"><b>'+esc(c.title||c.handle)+'</b><i>'+esc(c.handle)+'</i></div>'+
      (yt?'<button class="v5p-mini" onclick="v5ChAnalyze(\''+c.id+'\')">⚡ Аудит</button>':'<button class="v5p-mini" onclick="v5ProfClose();try{enterTelegram()}catch(e){}">Студия</button>')+
      '<button class="v5p-del" title="Удалить" onclick="v5ChDel(\''+c.id+'\')">🗑</button></div>';
  }).join(''):'<div class="v5p-empty">Каналы пока не добавлены.<br/>Добавь свой YouTube — аудит и план роста будут запускаться в один клик.</div>';
  b.innerHTML='<div class="v5p-sec">Мои каналы</div>'+rows+
    '<div class="v5p-sec">Добавить канал</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><div style="width:170px;flex:none;position:relative"><select id="v5ChType" class="v5p-in"><option value="yt">▶️ YouTube</option><option value="tg">✈️ Telegram</option></select></div><input class="v5p-in" id="v5ChIn" style="flex:1;min-width:200px" placeholder="ссылка или @handle"/></div>'+
    '<div class="v5p-row" style="margin-top:12px"><button class="v5p-act hot" onclick="v5ChAdd()">➕ Добавить</button></div>';
  upgradeSelects(b);
}
W.v5ChAdd=function(){
  var t=(q('#v5ChType')||{}).value||'yt';
  var v=((q('#v5ChIn')||{}).value||'').trim();
  if(!v){toast('Вставь ссылку или @handle','warn');return;}
  var title=v.replace(/^https?:\/\//,'').replace('www.','').replace('youtube.com/','').replace('t.me/','').replace(/\/$/,'');
  var list=chGet();list.push({id:uid(),type:t,handle:v,title:title});chSet(list);
  renderCh(q('#v5pBody'));v5pHead();toast('Канал добавлен ✅');
};
W.v5ChDel=function(id){chSet(chGet().filter(function(c){return c.id!==id;}));renderCh(q('#v5pBody'));v5pHead();};
W.v5ChAnalyze=function(id){
  var c=chGet().filter(function(x){return x.id===id;})[0];if(!c)return;
  v5ProfClose();
  try{W.enterYoutube&&W.enterYoutube();}catch(e){}
  try{W.setMode&&W.setMode('audit');}catch(e){}
  var i=q('#urlInput');if(i)i.value=c.handle;
  try{W.startAnalysis&&W.startAnalysis();}catch(e){}
};
/* --- План (4 недели + свои задачи) --- */
function renderPlanTab(b){
  var pl=lget(PLAN4,null);var grow=growGet();
  var h='';
  if(pl&&pl.weeks){
    var total=0,done=0;
    pl.weeks.forEach(function(w){(w.tasks||[]).forEach(function(t){total++;if(t.done)done++;});});
    var pct=total?Math.round(done/total*100):0;
    var firstOpen=0;for(var i=0;i<pl.weeks.length;i++){if((pl.weeks[i].tasks||[]).some(function(t){return !t.done;})){firstOpen=i;break;}}
    h+='<div class="v5p-sec">План на 4 недели <button class="v5p-mini" style="margin-left:auto" onclick="try{v3PlanRebuild()}catch(e){};v5ProfTab(\'plan\')">🔁 пересобрать</button></div>'+
      '<div class="v5p-prog"><div class="bar"><i style="width:'+pct+'%"></i></div><span>'+done+'/'+total+' · '+pct+'%</span></div>'+
      pl.weeks.map(function(w,wi){
        var wd=(w.tasks||[]).filter(function(t){return t.done;}).length;
        return '<details class="v5p-week"'+(wi===firstOpen?' open':'')+'><summary>'+esc(w.t)+'<em>'+wd+'/'+(w.tasks||[]).length+'</em></summary><div class="wk-b">'+
          (w.tasks||[]).map(function(t,ti){return '<div class="v5p-task'+(t.done?' done':'')+'"><button class="v5p-ck" onclick="v5Plan4Toggle('+wi+','+ti+')">'+(t.done?'✓':'')+'</button><div class="tx">'+esc(t.t)+'</div></div>';}).join('')+
        '</div></details>';
      }).join('');
  }else{
    h+='<div class="v5p-sec">План на 4 недели</div><div class="v5p-empty">Плана ещё нет. Пройди настройку профиля (вкладка «Данные» → «Полная настройка») — Viora соберёт персональный план под твою цель и время.</div>';
  }
  h+='<div class="v5p-sec">Свои задачи</div>'+
    (grow.length?grow.map(function(t){return '<div class="v5p-task'+(t.done?' done':'')+'"><button class="v5p-ck" onclick="v5GrowToggle(\''+t.id+'\')">'+(t.done?'✓':'')+'</button><div class="tx">'+esc(t.text)+'</div><button class="v5p-del" onclick="v5GrowDel(\''+t.id+'\')">🗑</button></div>';}).join(''):'<div class="v5p-empty">Своих задач пока нет — добавь первую ниже.</div>')+
    '<div style="display:flex;gap:8px;margin-top:10px"><input class="v5p-in" id="v5TaskIn" placeholder="Напр.: снять 3 ролика про индикаторы" style="flex:1"/><button class="v5p-act hot" style="flex:none" onclick="v5GrowAdd()">➕</button></div>';
  b.innerHTML=h;
  var inp=q('#v5TaskIn');if(inp)inp.addEventListener('keydown',function(e){if(e.key==='Enter')W.v5GrowAdd();});
}
W.v5Plan4Toggle=function(w,t){try{W.v3PlanToggle(w,t);}catch(e){var pl=lget(PLAN4,null);if(pl&&pl.weeks&&pl.weeks[w]){pl.weeks[w].tasks[t].done=!pl.weeks[w].tasks[t].done;lset(PLAN4,pl);}}renderPlanTab(q('#v5pBody'));v5pHead();};
W.v5GrowToggle=function(id){var a=growGet();a.forEach(function(t){if(t.id===id)t.done=!t.done;});lset(GROW,a);renderPlanTab(q('#v5pBody'));v5pHead();};
W.v5GrowDel=function(id){lset(GROW,growGet().filter(function(t){return t.id!==id;}));renderPlanTab(q('#v5pBody'));v5pHead();};
W.v5GrowAdd=function(){var i=q('#v5TaskIn');var v=(i&&i.value||'').trim();if(!v){toast('Напиши задачу','warn');return;}var a=growGet();a.unshift({id:uid(),text:v,platform:'all',horizon:'week',done:false,ts:Date.now()});lset(GROW,a);renderPlanTab(q('#v5pBody'));v5pHead();};
/* --- Бэкап (export / import) --- */
function renderSafe(b){
  b.innerHTML='<div class="v5p-sec">Экспорт</div>'+
    '<div style="font-size:13px;color:#cfcdd6;line-height:1.65;margin-bottom:12px">Все данные (профиль, каналы, планы, посты, съёмки, история аудитов, достижения) живут только в этом браузере. Скачай резервную копию, чтобы не потерять их при чистке браузера или переезде на другое устройство.</div>'+
    '<div class="v5p-row"><button class="v5p-act hot" onclick="v5Export()">⬇️ Скачать бэкап (.json)</button></div>'+
    '<div class="v5p-sec">Импорт</div>'+
    '<div style="font-size:13px;color:#cfcdd6;line-height:1.65;margin-bottom:12px">Загрузи файл бэкапа — данные восстановятся, страница перезагрузится.</div>'+
    '<div class="v5p-row"><button class="v5p-act" onclick="v5Import()">⬆️ Загрузить бэкап</button></div>'+
    '<input type="file" id="v5ImpFile" accept=".json,application/json" style="display:none"/>';
  var f=q('#v5ImpFile');
  f.addEventListener('change',function(){
    var file=f.files&&f.files[0];if(!file)return;
    var r=new FileReader();
    r.onload=function(){
      try{
        var data=JSON.parse(r.result);
        if(!data||typeof data!=='object'||!data.__viora_backup)throw new Error('bad');
        var n=0;Object.keys(data.keys||{}).forEach(function(k){if(/^(viora_|v3_|v4_|v5_)/.test(k)){localStorage.setItem(k,data.keys[k]);n++;}});
        toast('Восстановлено: '+n+' разделов. Перезагружаю…','ok',2200);
        setTimeout(function(){location.reload();},1200);
      }catch(e){toast('Это не похоже на файл бэкапа Viora','warn',3000);}
    };
    r.readAsText(file);
  });
}
W.v5Export=function(){
  var out={__viora_backup:1,version:5,date:new Date().toISOString(),keys:{}};
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    if(/^(viora_|v3_|v4_|v5_)/.test(k))out.keys[k]=localStorage.getItem(k);
  }
  var blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'});
  var a=D.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='viora-backup-'+new Date().toISOString().slice(0,10)+'.json';
  D.body.appendChild(a);a.click();a.remove();
  toast('Бэкап скачан 💾');
};
/* route ALL old profile entry points to the new center */
W.vProfileOpen=function(tab){W.v5ProfOpen(tab==='plan'?'plan':tab==='channels'?'ch':'over');};
W.v3ProfOpen=function(){W.v5ProfOpen('over');};

/* ============================================================ */
/* 4. EDITOR AGENT v2 — sees HTML, keeps links, multi-undo       */
/* ============================================================ */
var E5={sel:null,pending:null,hist:[]};
D.addEventListener('selectionchange',function(){
  try{
    var s=W.getSelection();if(!s||!s.rangeCount||s.isCollapsed)return;
    var body=q('#veBody');if(!body)return;
    var n=s.anchorNode,inside=false;
    while(n){if(n===body){inside=true;break;}n=n.parentNode;}
    if(inside){
      var r=s.getRangeAt(0);
      var div=D.createElement('div');div.appendChild(r.cloneContents());
      E5.sel={html:div.innerHTML,text:s.toString(),range:r.cloneRange(),ts:Date.now()};
    }
  }catch(e){}
});
function e5Sel(){return (E5.sel&&E5.sel.text&&E5.sel.text.trim().length>2&&Date.now()-E5.sel.ts<180000)?E5.sel:null;}
function e5Add(role,html){var f=W.__veAddMsg;if(typeof f==='function')return f(role,html);return null;}
function sanitize(html){
  var d=D.createElement('div');d.innerHTML=String(html||'');
  qa('script,style,iframe,object,embed,link,meta,img',d).forEach(function(n){n.remove();});
  qa('*',d).forEach(function(n){
    var ok={P:1,BR:1,B:1,STRONG:1,I:1,EM:1,U:1,S:1,A:1,UL:1,OL:1,LI:1,H1:1,H2:1,H3:1,BLOCKQUOTE:1,CODE:1,SPAN:1,DIV:1};
    if(!ok[n.tagName]){var p=n.parentNode;while(n.firstChild)p.insertBefore(n.firstChild,n);p.removeChild(n);return;}
    for(var i=n.attributes.length-1;i>=0;i--){
      var a=n.attributes[i].name,v=n.attributes[i].value||'';
      if(n.tagName==='A'&&a==='href'&&!/^javascript:/i.test(v))continue;
      n.removeAttribute(a);
    }
    if(n.tagName==='A'){n.setAttribute('target','_blank');n.setAttribute('rel','noopener');}
  });
  return d.innerHTML;
}
function e5Push(){var b=q('#veBody');if(!b)return;E5.hist.push(b.innerHTML);if(E5.hist.length>12)E5.hist.shift();}
function e5Save(){try{if(W.__VR9D&&W.__VR9D.save)W.__VR9D.save();}catch(e){}}
function e5Detect(t){
  var l=t.toLowerCase();
  if(/исправ|ошибк|орфограф|опечат|запят|грамот/.test(l))return 'fix';
  if(/допиш|продолж|закончи|дальше|ещё абзац|еще абзац|финал|концовк/.test(l))return 'continue';
  if(/сократ|короче|урежь|сожми|убери воду|лаконич/.test(l))return 'shorten';
  if(/усиль|перепиш|переформулируй|улучши|сильнее|цепляюще|живее|переделай/.test(l))return 'rewrite';
  return null;
}
var E5A={
  fix:{l:'✏️ Исправить ошибки',busy:'Вычитываю…',mode:'replace',
    sys:'Ты — редактор-корректор. Исправь орфографию, пунктуацию и явные стилистические ошибки в HTML-тексте. НЕ меняй смысл, структуру и тон. КРИТИЧНО: сохрани ВСЕ HTML-теги как есть — особенно ссылки <a href="...">, жирный, курсив, абзацы <p>. Меняй только текст внутри тегов.'},
  shorten:{l:'✂️ Сократить',busy:'Убираю воду…',mode:'replace',
    sys:'Ты — редактор. Сократи HTML-текст примерно на треть: убери воду, повторы, канцелярит. Сохрани все ключевые мысли и факты. КРИТИЧНО: все ссылки <a href="...">, которые остаются по смыслу, сохрани с их тегами; структуру абзацев <p> сохрани.'},
  rewrite:{l:'🔥 Усилить',busy:'Усиливаю…',mode:'replace',
    sys:'Ты — сильный копирайтер. Перепиши HTML-текст мощнее: цепляющее начало, живой ритм, конкретика, без клише. Смысл и факты сохрани. КРИТИЧНО: сохрани ВСЕ ссылки <a href="..."> (можно переставить по тексту, но не терять), форматирование <b>/<i> и абзацы <p>.'},
  continue:{l:'➕ Дописать',busy:'Дописываю…',mode:'append',
    sys:'Ты — соавтор. Продолжи текст в том же стиле и тоне: 1-3 абзаца HTML (<p>...</p>), которые органично развивают или завершают мысль. Верни ТОЛЬКО продолжение, без повтора исходного текста.'}
};
async function e5Run(action,hint){
  var act=E5A[action];if(!act)return;
  var body=q('#veBody');if(!body)return;
  var sel=act.mode==='replace'?e5Sel():null;
  var src=sel?sel.html:body.innerHTML;
  if(!String(src).replace(/<[^>]+>/g,'').trim()){e5Add('bot','Пока нечего обрабатывать — сначала напиши текст ✍️');return;}
  var ph=e5Add('bot','<span class="ve-spin"></span> <span class="ve-muted">'+act.busy+(sel?' (выделенный фрагмент)':'')+'</span>');
  try{
    var usr=(hint?'Пожелание автора: '+hint+'\n\n':'')+
      'HTML для обработки:\n'+String(src).slice(0,6000)+
      (action==='continue'?'\n\nЗаголовок поста: '+((q('#veTitle')||{}).innerText||''):'');
    var r=await aiJson(act.sys+' Верни СТРОГО валидный JSON без markdown: {"html":"результат в HTML","notes":["2-4 коротких пункта, что сделано"]}',usr,2800);
    var out=r&&(r.html||r.text);
    if(!out||typeof out!=='string')throw new Error('пустой ответ');
    out=sanitize(out);
    E5.pending={mode:act.mode,sel:sel,html:out};
    var notes=(r.notes||[]).slice(0,4).map(function(n){return '<li>'+esc(n)+'</li>';}).join('');
    if(ph)ph.outerHTML='<div class="v5e-act"><div class="hd">'+act.l+' · '+(sel?'фрагмент':act.mode==='append'?'продолжение':'весь текст')+'</div><div class="df">'+out+'</div>'+(notes?'<ul class="nt">'+notes+'</ul>':'')+'<div class="bt"><button class="ok" onclick="v5eApply()">✅ Применить</button><button class="no" onclick="v5eCancel(this)">Отмена</button></div></div>';
    var box=q('#veAiMsgs');if(box)box.scrollTop=box.scrollHeight;
  }catch(e){if(ph)ph.innerHTML='Не получилось ('+esc(e.message||'AI недоступна')+'). Попробуй ещё раз.';}
}
W.v5eApply=function(){
  var p=E5.pending;if(!p)return;
  var body=q('#veBody');if(!body)return;
  e5Push();
  try{
    if(p.mode==='append'){body.innerHTML=body.innerHTML+p.html;}
    else if(p.sel&&p.sel.range){
      var done=false;
      try{
        var r=p.sel.range;
        if(r.startContainer&&body.contains(r.startContainer)){
          var s=W.getSelection();s.removeAllRanges();s.addRange(r);
          body.focus();D.execCommand('insertHTML',false,p.html);done=true;
        }
      }catch(e){}
      if(!done){
        /* fallback: substring replace on serialized html */
        if(p.sel.html&&body.innerHTML.indexOf(p.sel.html)>=0)body.innerHTML=body.innerHTML.replace(p.sel.html,p.html);
        else body.innerHTML=p.html;
      }
    }else{body.innerHTML=p.html;}
    e5Save();
    E5.pending=null;E5.sel=null;
    qa('.v5e-act .bt').forEach(function(b){b.style.display='none';});
    e5Add('bot','Готово ✅ Текст обновлён, ссылки и форматирование на месте.<br/><button class="v5e-undo" onclick="v5eUndo()">↩ Вернуть как было</button>');
  }catch(e){e5Add('bot','Не получилось применить правку 😔');}
};
W.v5eCancel=function(btn){E5.pending=null;try{btn.closest('.v5e-act').querySelector('.bt').style.display='none';}catch(e){}e5Add('bot','Ок, оставил как есть.');};
W.v5eUndo=function(){
  var body=q('#veBody');if(!body||!E5.hist.length)return;
  body.innerHTML=E5.hist.pop();e5Save();
  e5Add('bot','Вернул прежнюю версию ↩'+(E5.hist.length?' (можно откатить ещё раз)':''));
};
/* override v4 editor entry points */
W.v4eApply=W.v5eApply;W.v4eCancel=W.v5eCancel;W.v4eUndo=W.v5eUndo;
W.veSend=function(){
  var inp=q('#veAiInput');if(!inp)return;
  var txt=(inp.value||'').trim();if(!txt)return;
  inp.value='';inp.style.height='auto';
  e5Add('me',esc(txt));
  var intent=e5Detect(txt);
  if(intent){e5Run(intent,txt);return;}
  var ph=e5Add('bot','<span class="ve-spin"></span> <span class="ve-muted">Viora думает…</span>');
  var body=q('#veBody');var sel=e5Sel();
  var ctx=('Заголовок: '+((q('#veTitle')||{}).innerText||'')+'\n\nТекст поста:\n'+(body?body.innerText:'')).slice(0,5000);
  aiJson('Ты — Viora, дружелюбный редактор и контент-помощник. Ты ВИДИШЬ текст поста автора и отвечаешь с опорой на него: конкретно, кратко, по-русски, без воды. Если просят изменить текст — предложи готовую формулировку. Верни СТРОГО JSON: {"reply":"ответ"}',
    ctx+(sel?'\n\nВыделенный фрагмент: «'+sel.text.slice(0,800)+'»':'')+'\n\nСообщение автора: '+txt,900)
  .then(function(r){var a=(r&&(r.reply||r.text))||'';if(ph)ph.innerHTML=esc(String(a)||'Хм, не вышло. Попробуй ещё раз.').replace(/\n/g,'<br>');var box=q('#veAiMsgs');if(box)box.scrollTop=box.scrollHeight;})
  .catch(function(){if(ph)ph.innerHTML='Не получилось ответить, попробуй ещё раз.';});
};
W.veCheck=function(){
  W.veAiToggle&&W.veAiToggle(true);
  var b=q('#veBody');
  if(!b||!(b.innerText||'').trim()){e5Add('bot','Напиши сначала текст — проверю и сразу исправлю.');return;}
  e5Add('me','✏️ Проверь и исправь текст');
  e5Run('fix');
};
function e5Chips(){
  var panel=q('#veAI');if(!panel)return;
  var old=q('#v4eChips',panel);if(old)old.remove();
  if(q('#v5eChips',panel))return;
  var inp=q('#veAiInput',panel);if(!inp)return;
  var bar=D.createElement('div');bar.id='v5eChips';
  bar.innerHTML=Object.keys(E5A).map(function(k){return '<button data-a="'+k+'">'+E5A[k].l+'</button>';}).join('');
  var anchor=inp.closest('.ve-ai-input')||inp.parentNode;
  anchor.parentNode.insertBefore(bar,anchor);
  qa('button',bar).forEach(function(b){b.addEventListener('click',function(){e5Add('me',E5A[b.getAttribute('data-a')].l);e5Run(b.getAttribute('data-a'));});});
}
(function(){
  var orig=W.vWriteOpen;
  if(typeof orig==='function'){
    W.vWriteOpen=function(){
      var r=orig.apply(this,arguments);
      try{
        setTimeout(function(){
          e5Chips();
          var box=q('#veAiMsgs');
          if(box){box.__v4hello=true;qa('.ve-m.bot',box).forEach(function(m){if(/Кстати, теперь я умею/.test(m.textContent))m.remove();});}
          if(box&&!box.__v5hello){box.__v5hello=true;e5Add('bot','Привет! Я вижу твой текст и могу править его прямо здесь: выдели фрагмент (или ничего — возьму весь пост) и нажми кнопку ниже, либо напиши словами: «исправь ошибки», «сократи», «усиль», «допиши» ✨<br/><span class="ve-muted" style="font-size:11.5px">Ссылки и форматирование при правках сохраняются. Любую правку можно откатить.</span>');}
        },80);
      }catch(e){}
      return r;
    };
  }
})();

/* ============================================================ */
/* 5. SHORT LINKS for posts                                      */
/* ============================================================ */
function fetchTO(url,ms){
  return new Promise(function(res,rej){
    var ctl=('AbortController' in W)?new AbortController():null;
    var t=setTimeout(function(){try{ctl&&ctl.abort();}catch(e){}rej(new Error('timeout'));},ms||4500);
    fetch(url,ctl?{signal:ctl.signal}:{}).then(function(r){clearTimeout(t);if(!r.ok)throw new Error('http '+r.status);return r.text();}).then(res).catch(function(e){clearTimeout(t);rej(e);});
  });
}
async function shortenUrl(longUrl){
  if(longUrl.length>4800)throw new Error('too long');
  var enc=encodeURIComponent(longUrl);
  var svcs=[
    {u:'https://clck.ru/--?url='+enc,ok:function(t){return /^https?:\/\/clck\.ru\//.test(t.trim())?t.trim():null;}},
    {u:'https://is.gd/create.php?format=simple&url='+enc,ok:function(t){return /^https?:\/\/is\.gd\//.test(t.trim())?t.trim():null;}},
    {u:'https://tinyurl.com/api-create.php?url='+enc,ok:function(t){return /^https?:\/\/tinyurl\.com\//.test(t.trim())?t.trim():null;}}
  ];
  for(var i=0;i<svcs.length;i++){
    try{var t=await fetchTO(svcs[i].u,4500);var s=svcs[i].ok(t);if(s)return s;}catch(e){}
  }
  throw new Error('shorteners unavailable');
}
(function(){
  var origCopy=W.vPubCopy;
  W.vPubCopy=function(){
    var title=((q('#vpubTitle')||{}).textContent||'');
    var author=((q('#vpubAuthor')||{}).textContent||'');
    var html=(q('#vpubBody')||{}).innerHTML||'';
    /* build compressed long link via existing pipeline by intercepting copy */
    var json=JSON.stringify({t:title,a:author,b:html});
    var bytes=new TextEncoder().encode(json);
    function b64u(arr){var s='';for(var i=0;i<arr.length;i++)s+=String.fromCharCode(arr[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
    function finish(longUrl){
      toast('Сжимаю ссылку…','ok',1400);
      shortenUrl(longUrl).then(function(shortU){
        copyTxt(shortU);toast('Короткая ссылка скопирована ✂️🔗 ('+shortU.replace(/^https?:\/\//,'')+')','ok',3200);
      }).catch(function(){
        copyTxt(longUrl);
        toast('Ссылка скопирована. Сервисы сокращения сейчас недоступны — скопировал полную (она самодостаточна: весь пост зашит в неё).','warn',4200);
      });
    }
    try{
      if(W.CompressionStream){
        var cs=new CompressionStream('deflate-raw');var w=cs.writable.getWriter();w.write(bytes);w.close();
        new Response(cs.readable).arrayBuffer().then(function(ab){finish(location.origin+location.pathname+'#vpz='+b64u(new Uint8Array(ab)));}).catch(function(){finish(location.origin+location.pathname+'#vp='+b64u(bytes));});
        return;
      }
    }catch(e){}
    finish(location.origin+location.pathname+'#vp='+b64u(bytes));
  };
})();

/* ============================================================ */
/* 6. SOUND DESIGN in scriptwriter + desc/tags generator         */
/* ============================================================ */
W.v5Music=async function(btn){
  var SL=W.__SCR_LAST||null;
  if(!SL){toast('Сначала собери сценарий','warn');return;}
  var out=q('#v5MusicOut');if(!out)return;
  if(btn)btn.disabled=true;
  out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Подбираю саунд-дизайн…</span></div>';
  try{
    var d=SL.d;
    var r=await aiJson('Ты — саунд-дизайнер YouTube. Под сценарий подбери музыку по блокам: настроение, жанр, темп (BPM), где менять трек, и готовый поисковый запрос на английском для YouTube Audio Library / Epidemic Sound. Пиши по-русски (кроме запросов). Верни СТРОГО JSON: {"parts":[{"seg":"Хук","mood":"описание настроения и зачем","query":"english search query"}],"tip":"общий совет по звуку для этого ролика"}',
      'Тема: «'+SL.topic+'». Блоки: '+JSON.stringify((d.blocks||[]).map(function(b){return b.block;}))+'. Хук: '+JSON.stringify((d.hook||'').slice(0,200)),1400);
    var parts=(r&&r.parts)||[];
    if(!parts.length)throw new Error('пусто');
    out.innerHTML='<div class="v5-music"><h4>🎵 Саунд-дизайн</h4>'+parts.map(function(p){
      return '<div class="v5m-row"><span class="seg">'+esc(p.seg||'')+'</span><span class="ds">'+esc(p.mood||'')+'</span><button class="v5m-q" onclick="(navigator.clipboard&&navigator.clipboard.writeText(\''+esc(String(p.query||'').replace(/'/g,''))+'\'));vToast&&vToast(\'Запрос скопирован 🎵\')">📋 '+esc(p.query||'')+'</button></div>';
    }).join('')+(r.tip?'<div style="font-size:12px;color:#b9aede;margin-top:9px;line-height:1.55">💡 '+esc(r.tip)+'</div>':'')+'</div>';
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось подобрать музыку: '+esc(e.message||'AI недоступна')+'</div>';}
  if(btn)btn.disabled=false;
};
W.v5DescTags=async function(btn){
  var SL=W.__SCR_LAST||null;
  if(!SL){toast('Сначала собери сценарий','warn');return;}
  var out=q('#v5DescOut');if(!out)return;
  if(btn)btn.disabled=true;
  out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Пишу описание и теги…</span></div>';
  try{
    var d=SL.d;
    var r=await aiJson('Ты — SEO-специалист YouTube. Напиши описание ролика (первые 2 строки продают клик — их видно до «ещё»; далее структура, таймкоды по блокам, призыв) и 12-15 тегов. По-русски. Верни СТРОГО JSON: {"description":"текст описания с переносами","tags":["тег1","тег2"]}',
      'Заголовок: '+JSON.stringify(d.title||SL.topic)+'. Тема: «'+SL.topic+'». Блоки: '+JSON.stringify((d.blocks||[]).map(function(b){return (b.time||'')+' '+(b.block||'');})),1600);
    if(!r||!r.description)throw new Error('пусто');
    var tags=(r.tags||[]).map(function(t){return String(t).replace(/^#/,'');});
    out.innerHTML='<div class="v4-aicard"><h4>📝 Описание</h4><div style="font-size:13px;line-height:1.65;color:#dcdbe1;white-space:pre-wrap">'+esc(r.description)+'</div><div class="v4-row" style="margin-top:10px"><button class="v4-btn sm ghost" onclick="(navigator.clipboard&&navigator.clipboard.writeText(this.getAttribute(\'data-d\')));vToast&&vToast(\'Описание скопировано 📋\')" data-d="'+esc(r.description)+'">📋 Копировать описание</button></div>'+
      '<h4 style="margin-top:14px">🏷 Теги <span style="font-weight:400;color:#8d8b96;font-size:11px">(клик — копия всех)</span></h4><div class="v5-tagrow" onclick="(navigator.clipboard&&navigator.clipboard.writeText(\''+esc(tags.join(', ').replace(/'/g,''))+'\'));vToast&&vToast(\'Теги скопированы 🏷\')">'+tags.map(function(t){return '<span class="v5-tag">'+esc(t)+'</span>';}).join('')+'</div></div>';
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось: '+esc(e.message||'AI недоступна')+'</div>';}
  if(btn)btn.disabled=false;
};

/* ============================================================ */
/* 7. PREVIEW CONCEPTS — before shooting anything                */
/* ============================================================ */
W.v5Concepts=async function(btn){
  var out=q('#labAiOut');if(!out)return;
  var topic=((q('#labTitleA')||{}).value||'').trim();
  var niche=((q('#labNiche')||{}).value||'').trim();
  if(!topic&&!niche){toast('Заполни заголовок или нишу — от этого считаю концепты','warn');return;}
  if(btn)btn.disabled=true;
  out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Придумываю 3 концепта превью…</span></div>';
  try{
    var r=await aiJson('Ты — арт-директор YouTube-превью с опытом в кликабельности. Придумай 3 РАЗНЫХ концепта превью (не вариации одного). Для каждого: название подхода, композиция (что в кадре, крупность, где лицо/объект), эмоция, текст на превью (до 4 слов), цвета (фон + акцент), и чем выделится среди конкурентов в нише. По-русски, конкретно, без воды. Верни СТРОГО JSON: {"concepts":[{"name":"...","title":"текст на превью","comp":"композиция","emo":"эмоция/выражение","colors":"цвета","diff":"чем выделится"}]}',
      'Тема ролика: «'+(topic||niche)+'». Ниша: «'+(niche||'—')+'».',1900);
    var cs=(r&&r.concepts)||[];
    if(!cs.length)throw new Error('пусто');
    out.innerHTML='<div style="display:grid;gap:10px">'+cs.slice(0,3).map(function(c,i){
      return '<div class="v5c-card" style="animation-delay:'+(i*0.08)+'s"><div class="nm">Концепт '+(i+1)+' · '+esc(c.name||'')+'</div><h4>«'+esc(c.title||'')+'»</h4>'+
        '<div class="v5c-kv"><span class="k">🎬 Кадр</span><span>'+esc(c.comp||'')+'</span></div>'+
        '<div class="v5c-kv"><span class="k">😱 Эмоция</span><span>'+esc(c.emo||'')+'</span></div>'+
        '<div class="v5c-kv"><span class="k">🎨 Цвета</span><span>'+esc(c.colors||'')+'</span></div>'+
        '<div class="v5c-kv"><span class="k">⚡ Отличие</span><span>'+esc(c.diff||'')+'</span></div></div>';
    }).join('')+'</div><div class="v4-note" style="margin-top:10px">Сними по концепту, загрузи фото в слот «Превью A/B» выше — и проверь в живой сетке YouTube.</div>';
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось: '+esc(e.message||'AI недоступна')+'</div>';}
  if(btn)btn.disabled=false;
};

/* ============================================================ */
/* 8. DAILY CARD — «карточка дня», once a day, local data only   */
/* ============================================================ */
function dailyItems(){
  var items=[];
  var pl=lget(PLAN4,null);
  if(pl&&pl.weeks){
    outer:for(var wi=0;wi<pl.weeks.length;wi++){
      var ts=pl.weeks[wi].tasks||[];
      for(var ti=0;ti<ts.length;ti++){if(!ts[ti].done){items.push({e:'🗺',h:'<b>Следующий шаг плана:</b> '+esc(ts[ti].t)});break outer;}}
    }
  }
  var grow=growGet().filter(function(t){return !t.done;});
  if(grow.length)items.push({e:'📌',h:'<b>Твои задачи:</b> осталось '+grow.length+' — ближайшая: '+esc(grow[0].text)});
  var shoots=[];try{shoots=(typeof loadShoots==='function'?loadShoots():[])||[];}catch(e){}
  var idea=shoots.filter(function(s){return s.status==='idea'||s.status==='plan';})[0];
  if(idea)items.push({e:'🎬',h:'<b>В съёмках ждёт:</b> '+esc(idea.topic||idea.title||'план съёмки')});
  /* пункт про достижения показываем только если прогресс уже начат —
     «0 из 11» новичку не даёт ничего полезного */
  var ach=lget('v4_achv_v1',{});var n=Object.keys(ach).length;
  if(n>0&&n<11)items.push({e:'🏆',h:'Открыто <b>'+n+' из 11</b> достижений — загляни в «Мой прогресс»'});
  return items;
}
function showDaily(){
  var today=new Date().toISOString().slice(0,10);
  if(lget('v5_daily',null)===today)return;
  if(!lget(PKEY,null)&&!growGet().length)return; /* new visitor — don't spam */
  var items=dailyItems();
  if(!items.length)return;
  var el=D.createElement('div');el.id='v5Daily';
  var days=['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  el.innerHTML='<div class="hd"><div class="ic">☀️</div><div><b>Карточка дня</b><small>'+days[new Date().getDay()]+', '+new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+'</small></div><button class="x" onclick="v5DailyClose()">✕</button></div>'+
    items.slice(0,3).map(function(i){return '<div class="v5d-it"><span class="e">'+i.e+'</span><span>'+i.h+'</span></div>';}).join('')+
    '<div class="ft"><button onclick="v5DailyIdea(this)">💡 Идея дня</button><button class="hot" onclick="v5DailyClose();v5ProfOpen(\'plan\')">🗺 К плану</button></div>';
  D.body.appendChild(el);
  setTimeout(function(){el.classList.add('show');},900);
}
W.v5DailyClose=function(){
  lset('v5_daily',new Date().toISOString().slice(0,10));
  var el=q('#v5Daily');if(el){el.classList.remove('show');setTimeout(function(){el.remove();},450);}
};
W.v5DailyIdea=async function(btn){
  if(btn){btn.disabled=true;btn.innerHTML='✨ Думаю…';}
  try{
    var p=pGet();
    var r=await aiJson('Ты — продюсер YouTube. Дай ОДНУ конкретную идею ролика на сегодня: рабочий заголовок + 1 предложение почему зайдёт. По-русски. Верни СТРОГО JSON: {"title":"...","why":"..."}',
      'Контекст автора: цель «'+(p.goal2||p.goal||'рост канала')+'», уровень: '+(p.level||'—')+', контент: '+(p.context||'—')+'.',500);
    var el=q('#v5Daily');
    if(el&&r&&r.title){
      var d=D.createElement('div');d.className='v5d-it';d.innerHTML='<span class="e">💡</span><span><b>«'+esc(r.title)+'»</b><br/><span style="color:#9b99a3">'+esc(r.why||'')+'</span></span>';
      el.insertBefore(d,el.querySelector('.ft'));
      if(btn)btn.style.display='none';
    }
  }catch(e){toast('AI сейчас недоступна','warn');if(btn){btn.disabled=false;btn.innerHTML='💡 Идея дня';}}
};

/* ============================================================ */
/* 9. INIT                                                       */
/* ============================================================ */
function init(){
  killGoogle();
  upgradeSelects();
  /* re-route legacy profile buttons rendered before v5 loaded */
  qa('#v3ProfBtn').forEach(function(b){b.remove();});
  setTimeout(showDaily,1600);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init);else init();
})();
