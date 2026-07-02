/* ============================================================
   VIORA v6 PACK — киллер-фичи
   1. Кнопка «Инструменты» в шапке (только на странице анализа)
   2. Коммент-майнер   3. Дуэль каналов   4. Виральный сканер
   5. Карта времени    6. Телесуфлёр      7. Хук-доктор
   8. Контент-календарь 9. Конвейер ролика
   ============================================================ */
(function(){
'use strict';
if(window.__V6)return;window.__V6=1;
var W=window,D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fmt(n){n=+n||0;if(n>=1e6)return (n/1e6).toFixed(1).replace('.0','')+'M';if(n>=1e3)return (n/1e3).toFixed(1).replace('.0','')+'K';return String(Math.round(n));}
function lget(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function toast(m,t){try{if(typeof vToast==='function')vToast(m,t);else console.log(m);}catch(e){}}
function med(a){if(!a.length)return 0;var s=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
async function aiJson(sys,user,max){
  var r=await callMistralRaw(sys,user,max||1800);
  if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){throw new Error('AI вернула неожиданный формат');}}
  if(!r||typeof r!=='object')throw new Error('AI вернула пустой ответ');
  return r;
}
function skel(n){var s='';for(var i=0;i<n;i++)s+='<div class="v4-skel" style="height:'+(i?46:64)+'px;margin-bottom:9px"></div>';return s;}
function copyTxt(t,btn){
  try{navigator.clipboard.writeText(t).then(function(){toast('Скопировано ✓','ok');});}
  catch(e){var ta=D.createElement('textarea');ta.value=t;D.body.appendChild(ta);ta.select();try{D.execCommand('copy');toast('Скопировано ✓','ok');}catch(e2){}ta.remove();}
  if(btn){var o=btn.textContent;btn.textContent='✓';setTimeout(function(){btn.textContent=o;},1200);}
}
W.v6Copy=function(btn){copyTxt(btn.getAttribute('data-c')||'',btn);};
function pGet(){return lget('viora_profile_v1',{})||{};}
function myHandle(){
  var p=pGet();var chs=Array.isArray(p.channels)?p.channels:[];
  if(chs.length&&chs[0].handle)return chs[0].handle;
  try{if(W.STATE&&STATE.channel&&STATE.channel.handle)return STATE.channel.handle;}catch(e){}
  return '';
}
function chanBrief(){
  var p=pGet(),parts=[];
  try{if(W.STATE&&STATE.channel)parts.push('Канал: «'+STATE.channel.title+'», '+STATE.channel.subs+' подписчиков, ниша: '+(STATE.primaryNiche||''));}catch(e){}
  if(p.goal2||p.goal)parts.push('Цель: '+(p.goal2||p.goal));
  if(p.context)parts.push('О контенте: '+p.context);
  if(p.level)parts.push('Уровень: '+p.level);
  return parts.join('. ')||'данных о канале нет';
}

/* ============================================================ */
/* 1. TOOLS BUTTON → NAV BAR, only on analysis (dashboard) page  */
/* ============================================================ */
var V4T=[
  {id:'plab',ic:'🖼',name:'Превью-лаборатория',d:'Своё превью в реальной сетке YouTube + AI-разбор'},
  {id:'arena',ic:'⚔️',name:'Арена заголовков',d:'Заголовки сражаются — AI выбирает кликабельный'},
  {id:'xray',ic:'🔬',name:'Разбор по ссылке',d:'Почему чужой ролик залетел + адаптация'},
  {id:'radar',ic:'📡',name:'Тренд-радар',d:'Конкуренты: хиты, триггеры, динамика'},
  {id:'prog',ic:'🏆',name:'Мой прогресс',d:'Здоровье канала, достижения, серия'},
  {id:'script',ic:'🎬',name:'Сценарист-студия',d:'Сценарий + ретеншн-кривая + Shorts'}
];
var V6T=[
  {id:'comments',ic:'💬',name:'Коммент-майнер',d:'Идеи и боли аудитории из реальных комментариев'},
  {id:'duel',ic:'🥊',name:'Дуэль каналов',d:'Ты против конкурента + план догона'},
  {id:'viral',ic:'🔥',name:'Виральный сканер',d:'Ролики-аномалии твоей ниши за 7/30/90 дней'},
  {id:'timing',ic:'⏰',name:'Карта времени',d:'Когда выходят хиты ниши — лучшие слоты'},
  {id:'prompter',ic:'🎤',name:'Телесуфлёр',d:'Снимай по сценарию прямо с экрана'},
  {id:'hook',ic:'🧲',name:'Хук-доктор',d:'Первые 30 секунд: оценка + 3 варианта'},
  {id:'calendar',ic:'📅',name:'Контент-календарь',d:'План публикаций + экспорт в телефон'},
  {id:'pipeline',ic:'🚀',name:'Конвейер ролика',d:'Идея → полный пакет к съёмке за один прогон'}
];
function openAny(id){
  closeNavMenu();
  if(V4T.some(function(t){return t.id===id;})){try{W.v4OpenTool(id);}catch(e){}return;}
  v6Open(id);
}
function buildNavBtn(){
  if(q('#v6NavTools'))return;
  var slot=q('.nav-in')&&q('.nav-in').children[1];
  if(!slot)return;
  var b=D.createElement('button');b.id='v6NavTools';
  b.innerHTML='<span>🧰</span><span class="lb">Инструменты</span>';
  slot.insertBefore(b,slot.firstChild);
  var m=D.createElement('div');m.id='v6NavMenu';
  m.innerHTML='<div class="ttl">Новое в v6</div>'+V6T.map(mi).join('')+'<div class="ttl">Инструменты</div>'+V4T.map(function(t){return mi(t,1);}).join('');
  D.body.appendChild(m);
  function mi(t,old){return '<button class="v6-mi" data-t="'+t.id+'"><span class="ic">'+t.ic+'</span><span><b>'+t.name+'</b><small>'+t.d+'</small></span>'+(old?'':'<span class="new">NEW</span>')+'</button>';}
  qa('.v6-mi',m).forEach(function(x){x.addEventListener('click',function(){openAny(x.getAttribute('data-t'));});});
  b.addEventListener('click',function(e){
    e.stopPropagation();
    if(m.classList.contains('show')){closeNavMenu();return;}
    var r=b.getBoundingClientRect();
    m.style.top=(r.bottom+10)+'px';
    m.style.right=Math.max(10,W.innerWidth-r.right)+'px';
    m.style.left='auto';
    m.classList.add('show');
  });
  D.addEventListener('click',function(e){if(m.classList.contains('show')&&!m.contains(e.target)&&e.target!==b)closeNavMenu();});
}
function closeNavMenu(){var m=q('#v6NavMenu');if(m)m.classList.remove('show');}
function updNavBtn(){
  var b=q('#v6NavTools');if(!b)return;
  var dash=q('#dashboard');
  var on=!!(dash&&getComputedStyle(dash).display!=='none');
  b.classList.toggle('on',on);
  if(!on)closeNavMenu();
}
function watchDash(){
  var dash=q('#dashboard');if(!dash)return;
  new MutationObserver(updNavBtn).observe(dash,{attributes:true,attributeFilter:['style']});
  updNavBtn();
}
function killDock(){
  var d=q('#v4Dock');if(d)d.remove();
  /* v4 builds dock on its own DOMContentLoaded — sweep again shortly after */
  setTimeout(function(){var x=q('#v4Dock');if(x)x.remove();},800);
}
function heroChips(){
  var s=q('#v4HeroTools');if(!s||s.__v6)return;s.__v6=1;
  V6T.forEach(function(t){
    var b=D.createElement('button');b.className='v4-chip';b.innerHTML=t.ic+' '+t.name;
    b.addEventListener('click',function(){openAny(t.id);});
    s.appendChild(b);
  });
}

/* ============================================================ */
/* overlay infra (reuses .v4-ov styles so design is consistent)  */
/* ============================================================ */
var R6={};
function v6Open(id){
  var t=V6T.filter(function(x){return x.id===id;})[0]||{ic:'',name:id,d:''};
  var ov=q('#v4ov_v6'+id);
  if(!ov){
    ov=D.createElement('div');ov.className='v4-ov';ov.id='v4ov_v6'+id;
    ov.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\'v6'+id+'\')">←</button><div class="v4-ttl">'+t.ic+' '+t.name+'<small>'+t.d+'</small></div><div class="sp"></div></div><div class="v4-body"><div class="v4-wrap" id="v6body_'+id+'"></div></div>';
    D.body.appendChild(ov);
  }
  ov.classList.add('open');D.body.style.overflow='hidden';
  try{if(R6[id])R6[id]();}catch(e){console.error(e);}
}
W.v6Open=v6Open;
function openScriptWith(topic){
  try{W.v4OpenTool('script');}catch(e){return;}
  setTimeout(function(){
    var inp=q('#v4ov_script #scTopic')||q('#v4body_script input');
    if(inp){inp.value=topic;inp.focus();}
  },250);
}
W.v6ToScript=function(btn){openScriptWith(btn.getAttribute('data-c')||'');};

/* ============================================================ */
/* 2. COMMENT MINER                                              */
/* ============================================================ */
R6.comments=function(){
  var el=q('#v6body_comments');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=''+
  '<div class="v4-note">Вставь ссылку на видео — своё или хит конкурента. Вытащу реальные комментарии и разложу: что зрители <b>просят снять</b>, за что хвалят, на что жалуются и что спрашивают. Это готовые идеи прямо из уст аудитории.</div>'+
  '<div class="v4-row" style="margin-top:12px"><input class="v4-in" id="v6cmUrl" placeholder="https://youtube.com/watch?v=… или youtu.be/…" style="flex:1;min-width:240px"/><button class="v4-btn" id="v6cmGo">⛏ Добыть инсайты</button></div>'+
  '<div id="v6cmOut" style="margin-top:14px"></div>';
  q('#v6cmGo').addEventListener('click',cmRun);
  q('#v6cmUrl').addEventListener('keydown',function(e){if(e.key==='Enter')cmRun();});
};
async function cmRun(){
  var out=q('#v6cmOut'),btn=q('#v6cmGo');
  var raw=(q('#v6cmUrl')||{}).value.trim();
  if(!raw){toast('Вставь ссылку на видео','warn');return;}
  var p=null;try{p=parseInput(raw);}catch(e){}
  if(!p||p.type!=='video'){out.innerHTML='<div class="v4-err">Нужна ссылка на видео: youtube.com/watch?v=… , youtu.be/… или Shorts.</div>';return;}
  btn.disabled=true;out.innerHTML=skel(6);
  try{
    var vids=await getVideos([p.value]);
    if(!vids.length)throw new Error('Видео не найдено или приватное');
    var v=vids[0];
    var cms=[],token='',pages=0;
    while(pages<3){
      var d=await ytFetch('commentThreads?part=snippet&videoId='+p.value+'&maxResults=100&order=relevance&textFormat=plainText'+(token?'&pageToken='+token:''));
      (d.items||[]).forEach(function(it){
        var s=it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet;
        if(s)cms.push({t:String(s.textDisplay||'').slice(0,220),lk:+s.likeCount||0,a:s.authorDisplayName||''});
      });
      token=d.nextPageToken;pages++;
      if(!token||cms.length>=200)break;
    }
    if(!cms.length)throw new Error('У видео нет комментариев или они отключены');
    cms.sort(function(a,b){return b.lk-a.lk;});
    var top=cms.slice(0,3);
    var sample=cms.slice(0,120).map(function(c){return (c.lk?'['+c.lk+'👍] ':'')+c.t.replace(/\s+/g,' ');}).join('\n');
    out.innerHTML='<div class="v4-note">Собрано <b>'+cms.length+'</b> комментариев к «'+esc(v.title)+'». Анализирую…</div>'+skel(4);
    var r=await aiJson(
      'Ты — аналитик YouTube-аудитории. Тебе дают реальные комментарии под видео. Извлеки максимум пользы для автора. Верни СТРОГО JSON: {"mood":"общее настроение аудитории, 1-2 предложения","ideas":[{"idea":"конкретная тема ролика, которую зрители просят или которая закроет их вопрос","why":"на каких комментариях основано"}],"praise":["за что хвалят, кратко"],"pain":["жалобы/что раздражает, кратко"],"questions":["частые вопросы зрителей дословно или кратко"]}. ideas: 4-6 штук, остальное по 3-5. Только то, что реально следует из комментариев. По-русски.',
      'Видео: «'+v.title+'» ('+(v.isShort?'Shorts':'длинное')+', '+v.views+' просмотров).\nКомментарии (число = лайки):\n'+sample.slice(0,9000),2600);
    var h='';
    h+='<div class="v6cm-card"><h4>🌡 Настроение аудитории</h4><div style="font-size:13.5px;line-height:1.6;color:#d8d6df">'+esc(r.mood||'')+'</div></div>';
    h+='<div class="v6cm-card"><h4>🏆 Топ-комментарии</h4>'+top.map(function(c){return '<div class="v6cm-top"><span class="lk">'+fmt(c.lk)+' 👍</span><span>'+esc(c.t)+'</span></div>';}).join('')+'</div>';
    var ideas=(r.ideas||[]).slice(0,6);
    if(ideas.length)h+='<div class="v6cm-card"><h4>💡 Зрители просят снять</h4>'+ideas.map(function(i){
      var idea=typeof i==='string'?i:(i.idea||'');var why=i&&i.why?i.why:'';
      return '<div class="v6cm-it"><span class="e">🎬</span><span><b>'+esc(idea)+'</b>'+(why?'<br/><span style="color:#9b99a3;font-size:12px">'+esc(why)+'</span>':'')+'</span><span class="act"><button class="v6-copy" data-c="'+esc(idea)+'" onclick="v6ToScript(this)">→ в сценарист</button></span></div>';
    }).join('')+'</div>';
    h+='<div class="v6-grid2">';
    if((r.praise||[]).length)h+='<div class="v6cm-card"><h4>❤️ За что хвалят</h4>'+r.praise.slice(0,5).map(function(x){return '<div class="v6cm-it"><span class="e">＋</span><span>'+esc(x)+'</span></div>';}).join('')+'</div>';
    if((r.pain||[]).length)h+='<div class="v6cm-card"><h4>⚠️ Что раздражает</h4>'+r.pain.slice(0,5).map(function(x){return '<div class="v6cm-it"><span class="e">－</span><span>'+esc(x)+'</span></div>';}).join('')+'</div>';
    h+='</div>';
    if((r.questions||[]).length)h+='<div class="v6cm-card"><h4>❓ Частые вопросы — готовый FAQ для следующего ролика</h4><div style="margin-top:4px">'+r.questions.slice(0,8).map(function(x){return '<span class="v6cm-q">'+esc(x)+'</span>';}).join('')+'</div></div>';
    out.innerHTML=h;
  }catch(e){
    var msg=e&&e.message||'не получилось';
    if(/disabled/i.test(msg)||(e&&e.reason==='commentsDisabled'))msg='Комментарии под этим видео отключены';
    out.innerHTML='<div class="v4-err">'+esc(msg)+'</div>';
  }
  btn.disabled=false;
}

/* ============================================================ */
/* 7. HOOK DOCTOR                                                */
/* ============================================================ */
R6.hook=function(){
  var el=q('#v6body_hook');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=''+
  '<div class="v4-note">Первые 30 секунд решают, останется зритель или уйдёт. Вставь текст своего хука (как начинается ролик) — оценю по 6 критериям и дам 3 усиленных варианта.</div>'+
  '<div class="v4-lab" style="margin-top:12px">Текст первых 20–30 секунд</div>'+
  '<textarea class="v4-in" id="v6hkTxt" style="min-height:110px;resize:vertical" placeholder="Например: Привет, друзья! Сегодня я расскажу вам про…"></textarea>'+
  '<div class="v4-lab">Тема ролика (необязательно)</div>'+
  '<input class="v4-in" id="v6hkTopic" placeholder="о чём ролик"/>'+
  '<div class="v4-row" style="margin-top:10px"><button class="v4-btn" id="v6hkGo">🧲 Диагноз хука</button></div>'+
  '<div id="v6hkOut" style="margin-top:14px"></div>';
  q('#v6hkGo').addEventListener('click',hkRun);
};
async function hkRun(){
  var out=q('#v6hkOut'),btn=q('#v6hkGo');
  var txt=(q('#v6hkTxt')||{}).value.trim();
  if(txt.length<15){toast('Вставь текст хука — хотя бы пару предложений','warn');return;}
  btn.disabled=true;out.innerHTML=skel(5);
  try{
    var r=await aiJson(
      'Ты — эксперт по удержанию на YouTube. Оцени хук (первые секунды ролика) по 6 критериям, каждый 1-10: Интрига (хочется узнать, что дальше), Конкретика (факты/цифры вместо воды), Обещание (понятно, что зритель получит), Темп (нет воды и долгих приветствий), Эмоция (вызывает реакцию), Визуальный потенциал (легко показать картинкой). Верни СТРОГО JSON: {"crit":[{"name":"Интрига","score":7,"note":"короткий комментарий"}],"total":0-100,"verdict":"главная проблема и сильная сторона, 2-3 предложения","rewrites":["вариант 1","вариант 2","вариант 3"],"visual":"что показать в первых кадрах, конкретно"}. rewrites — готовые к озвучке тексты хука в разных стилях (шок-факт, история, вопрос-вызов), сохраняя тему автора. По-русски.',
      'Хук: «'+txt.slice(0,1200)+'». Тема ролика: '+((q('#v6hkTopic')||{}).value||'—')+'. Контекст канала: '+chanBrief(),2400);
    var crit=(r.crit||[]).slice(0,6);
    var total=Math.max(0,Math.min(100,Math.round(+r.total||crit.reduce(function(s,c){return s+(+c.score||0);},0)/(crit.length*10||1)*100)));
    var col=total>=70?'#2bd97e':total>=45?'#ffb340':'#ff5d7f';
    var h='<div class="v6cm-card"><div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap"><div style="font-size:38px;font-weight:900;color:'+col+'">'+total+'<span style="font-size:15px;color:var(--muted)">/100</span></div><div style="flex:1;min-width:200px;font-size:13.5px;line-height:1.55;color:#d8d6df">'+esc(r.verdict||'')+'</div></div></div>';
    h+='<div class="v6cm-card"><h4>📋 Разбор по критериям</h4>'+crit.map(function(c){
      var sc=Math.max(0,Math.min(10,+c.score||0));var cc=sc>=7?'#2bd97e':sc>=5?'#ffb340':'#ff5d7f';
      return '<div class="v6h-crit"><div class="t"><b>'+esc(c.name||'')+' · '+sc+'/10</b><span>'+esc(c.note||'')+'</span></div><div class="v6h-bar"><i style="width:'+(sc*10)+'%;background:'+cc+'"></i></div></div>';
    }).join('')+'</div>';
    h+='<div class="v6cm-card"><h4>✍️ 3 усиленных варианта</h4>'+(r.rewrites||[]).slice(0,3).map(function(x,i){
      return '<div class="v6h-re"><span class="n">'+(i+1)+'</span><span>'+esc(x)+'</span><span class="act"><button class="v6-copy" data-c="'+esc(x)+'" onclick="v6Copy(this)">⧉</button></span></div>';
    }).join('')+'</div>';
    if(r.visual)h+='<div class="v4-note">🎥 <b>Первые кадры:</b> '+esc(r.visual)+'</div>';
    out.innerHTML=h;
  }catch(e){out.innerHTML='<div class="v4-err">'+esc(e.message||'AI недоступна')+'</div>';}
  btn.disabled=false;
}

/* ============================================================ */
/* 3. CHANNEL DUEL                                               */
/* ============================================================ */
async function duelLoad(raw){
  var id=await resolveChannelId(parseInput(raw));
  var ch=await getChannel(id);
  var ids=await getUploads(ch.uploads,50);
  var vids=await getVideos(ids);
  var recent=vids.filter(function(v){return !v.isStream;});
  var vpd=med(recent.map(function(v){return v.viewsPerDay;}));
  var eng=med(recent.map(function(v){return v.engagement;}))*100;
  var shorts=recent.filter(function(v){return v.isShort;}).length;
  var span=1;
  if(recent.length>1){
    var ds=recent.map(function(v){return +new Date(v.published);});
    span=Math.max(7,(Math.max.apply(null,ds)-Math.min.apply(null,ds))/864e5);
  }
  var perWeek=recent.length/(span/7);
  var visp=0;try{visp=recent.slice(0,20).reduce(function(s,v){return s+(vispScore(v.title).score||0);},0)/Math.min(20,recent.length||1);}catch(e){}
  var best=recent.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;})[0];
  return {ch:ch,vpd:vpd,eng:eng,shortsShare:recent.length?shorts/recent.length*100:0,perWeek:perWeek,visp:visp,best:best,n:recent.length};
}
R6.duel=function(){
  var el=q('#v6body_duel');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=''+
  '<div class="v4-note">Сравню два канала по живым данным: темп просмотров, форматы, заголовки, частота выхода. Потом AI скажет, почему соперник растёт, и даст план догона.</div>'+
  '<div class="v6-grid2" style="margin-top:12px">'+
    '<div><div class="v4-lab">Твой канал</div><input class="v4-in" id="v6dA" placeholder="@handle или ссылка"/></div>'+
    '<div><div class="v4-lab">Соперник</div><input class="v4-in" id="v6dB" placeholder="@handle или ссылка"/></div>'+
  '</div>'+
  '<div class="v4-row" style="margin-top:10px"><button class="v4-btn" id="v6dGo">🥊 Начать дуэль</button></div>'+
  '<div id="v6dOut" style="margin-top:14px"></div>';
  var mh=myHandle();if(mh)q('#v6dA').value=mh;
  q('#v6dGo').addEventListener('click',duelRun);
};
async function duelRun(){
  var out=q('#v6dOut'),btn=q('#v6dGo');
  var a=(q('#v6dA')||{}).value.trim(),b=(q('#v6dB')||{}).value.trim();
  if(!a||!b){toast('Нужны оба канала','warn');return;}
  btn.disabled=true;out.innerHTML=skel(7);
  try{
    var rs=await Promise.all([duelLoad(a),duelLoad(b)]);
    var A=rs[0],B=rs[1];
    function chCard(x){return '<div class="v6d-ch"><img src="'+esc(x.ch.avatar||'')+'" onerror="this.style.visibility=\'hidden\'"/><div><b>'+esc(x.ch.title)+'</b><small>'+esc(x.ch.handle||'')+' · '+fmt(x.ch.subs)+' подписчиков</small></div></div>';}
    function row(name,va,vb,fmtFn,suffix){
      var fa=fmtFn(va),fb=fmtFn(vb);
      var mx=Math.max(va,vb)||1;
      var aw=va>=vb,bw=vb>va;
      return '<div class="v6d-row">'+
        '<div class="v6d-cell r '+(aw?'win':'')+'"><span class="val">'+fa+(suffix||'')+'</span><span class="v6d-bar l"><i style="width:'+Math.round(va/mx*100)+'%"></i></span></div>'+
        '<div class="m">'+name+'</div>'+
        '<div class="v6d-cell '+(bw?'win':'')+'"><span class="val">'+fb+(suffix||'')+'</span><span class="v6d-bar r"><i style="width:'+Math.round(vb/mx*100)+'%"></i></span></div>'+
      '</div>';
    }
    var h='<div class="v6d-head">'+chCard(A)+'<div class="v6d-vs">VS</div>'+chCard(B)+'</div>';
    h+='<div class="v6cm-card">';
    h+=row('Подписчики',A.ch.subs,B.ch.subs,fmt);
    h+=row('Просмотров всего',A.ch.totalViews,B.ch.totalViews,fmt);
    h+=row('Медиана просм/день',A.vpd,B.vpd,function(v){return fmt(Math.round(v));});
    h+=row('Вовлечённость',A.eng,B.eng,function(v){return v.toFixed(1);},'%');
    h+=row('Роликов в неделю',A.perWeek,B.perWeek,function(v){return v.toFixed(1);});
    h+=row('Доля Shorts',A.shortsShare,B.shortsShare,function(v){return Math.round(v);},'%');
    h+=row('ВИСП заголовков',A.visp,B.visp,function(v){return Math.round(v);},'/100');
    h+='</div>';
    if(A.best&&B.best)h+='<div class="v6-grid2"><div class="v6cm-card"><h4>🏅 Лучший у тебя</h4><div style="font-size:13px;line-height:1.5">«'+esc(A.best.title)+'»<br/><span style="color:var(--muted)">'+fmt(Math.round(A.best.viewsPerDay))+'/день</span></div></div><div class="v6cm-card"><h4>🏅 Лучший у соперника</h4><div style="font-size:13px;line-height:1.5">«'+esc(B.best.title)+'»<br/><span style="color:var(--muted)">'+fmt(Math.round(B.best.viewsPerDay))+'/день</span></div></div></div>';
    h+='<div id="v6dAi">'+skel(3)+'</div>';
    out.innerHTML=h;
    var stat=function(x){return {title:x.ch.title,subs:x.ch.subs,medianVpd:Math.round(x.vpd),engagementPct:+x.eng.toFixed(1),videosPerWeek:+x.perWeek.toFixed(1),shortsSharePct:Math.round(x.shortsShare),vispAvg:Math.round(x.visp),bestVideo:x.best?x.best.title:''};};
    try{
      var r=await aiJson(
        'Ты — стратег роста YouTube-каналов. Сравни два канала по метрикам (A — канал автора, B — соперник). Верни СТРОГО JSON: {"verdict":"кто впереди и почему, 2-3 предложения, честно","secret":"главное, что соперник делает лучше (по данным)","plan":["шаг 1","шаг 2","шаг 3","шаг 4","шаг 5"]}. План — конкретные действия для A, чтобы догнать B, каждый шаг начинается с глагола. По-русски, без воды.',
        'A: '+JSON.stringify(stat(A))+'\nB: '+JSON.stringify(stat(B)),1900);
      var ai='<div class="v6cm-card"><h4>🧠 Вердикт Виоры</h4><div style="font-size:13.5px;line-height:1.6;color:#d8d6df">'+esc(r.verdict||'')+'</div>'+(r.secret?'<div class="v4-note" style="margin-top:10px">🔑 <b>Секрет соперника:</b> '+esc(r.secret)+'</div>':'')+'</div>';
      if((r.plan||[]).length)ai+='<div class="v6cm-card"><h4>🗺 План догона</h4>'+r.plan.slice(0,5).map(function(s,i){return '<div class="v6cm-it"><span class="e" style="color:#ff5d7f;font-weight:800">'+(i+1)+'.</span><span>'+esc(s)+'</span></div>';}).join('')+'</div>';
      q('#v6dAi').innerHTML=ai;
    }catch(e){q('#v6dAi').innerHTML='<div class="v4-err">AI-вердикт не получился: '+esc(e.message||'')+'</div>';}
  }catch(e){out.innerHTML='<div class="v4-err">'+esc(e.message||'не получилось')+'</div>';}
  btn.disabled=false;
}

/* ============================================================ */
/* 4. VIRAL SCANNER + data for timing map                        */
/* ============================================================ */
var V6SCAN={rows:null,niche:''};
R6.viral=function(){
  var el=q('#v6body_viral');if(!el||el.__b){return;}el.__b=1;
  el.innerHTML=''+
  '<div class="v4-note">Найду ролики-аномалии: у них просмотров в разы больше, чем подписчиков у канала. Это идеи, которые алгоритм уже полюбил — бери и снимай свою версию.</div>'+
  '<div class="v4-row" style="margin-top:12px"><input class="v4-in" id="v6vQ" placeholder="тема или ниша: трейдинг, монтаж видео, фитнес дома…" style="flex:1;min-width:220px"/>'+
  '<div class="v6-seg" id="v6vPer"><button data-d="7">7 дней</button><button class="on" data-d="30">30 дней</button><button data-d="90">90 дней</button></div>'+
  '<button class="v4-btn" id="v6vGo">🔥 Сканировать</button></div>'+
  '<div id="v6vOut" style="margin-top:14px"></div>';
  var p=pGet();var n=(W.STATE&&STATE.primaryNiche)||p.niche||'';if(n)q('#v6vQ').value=n;
  qa('#v6vPer button').forEach(function(b){b.addEventListener('click',function(){qa('#v6vPer button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  q('#v6vGo').addEventListener('click',viralRun);
  q('#v6vQ').addEventListener('keydown',function(e){if(e.key==='Enter')viralRun();});
};
async function viralRun(){
  var out=q('#v6vOut'),btn=q('#v6vGo');
  var qstr=(q('#v6vQ')||{}).value.trim();
  if(!qstr){toast('Введи тему или нишу','warn');return;}
  var days=+(q('#v6vPer .on')||{getAttribute:function(){return 30;}}).getAttribute('data-d')||30;
  btn.disabled=true;out.innerHTML=skel(6);
  try{
    var after=new Date(Date.now()-days*864e5).toISOString();
    var ids=[],seen={};
    var batches=await Promise.all([
      ytFetch('search?part=snippet&q='+encodeURIComponent(qstr)+'&type=video&maxResults=25&order=viewCount&publishedAfter='+after+'&relevanceLanguage=ru'),
      ytFetch('search?part=snippet&q='+encodeURIComponent(qstr)+'&type=video&maxResults=25&order=relevance&publishedAfter='+after+'&relevanceLanguage=ru')
    ]);
    batches.forEach(function(d){(d.items||[]).forEach(function(it){var id=it.id&&it.id.videoId;if(id&&!seen[id]){seen[id]=1;ids.push(id);}});});
    if(!ids.length)throw new Error('Ничего не нашлось — попробуй другую формулировку');
    var vids=await getVideos(ids);
    var chIds=[],chSeen={};
    var vd=await ytFetch('videos?part=snippet&id='+ids.slice(0,50).join(','));
    var chOf={};(vd.items||[]).forEach(function(it){chOf[it.id]={id:it.snippet.channelId,name:it.snippet.channelTitle};});
    Object.keys(chOf).forEach(function(k){var c=chOf[k].id;if(!chSeen[c]){chSeen[c]=1;chIds.push(c);}});
    var subsOf={};
    for(var i=0;i<chIds.length;i+=50){
      var cd=await ytFetch('channels?part=statistics&id='+chIds.slice(i,i+50).join(','));
      (cd.items||[]).forEach(function(c){subsOf[c.id]=+c.statistics.subscriberCount||0;});
    }
    var rows=vids.map(function(v){
      var ch=chOf[v.id]||{};var subs=subsOf[ch.id]||0;
      var ratio=subs>0?v.views/subs:0;
      return {v:v,chName:ch.name||'',subs:subs,ratio:ratio};
    }).filter(function(r){return r.v.views>1000;});
    rows.sort(function(a,b){return (b.ratio||0)-(a.ratio||0);});
    rows=rows.slice(0,12);
    if(!rows.length)throw new Error('Мало данных по этой теме за выбранный период');
    V6SCAN={rows:rows,niche:qstr};
    out.innerHTML='<div class="v4-note">Найдено <b>'+rows.length+'</b> аномалий за '+days+' дней. ×N — во сколько раз просмотры превышают подписчиков канала: чем выше, тем сильнее идею разогнал алгоритм, а не база канала.</div>'+
      rows.map(function(r,i){
        var x=r.ratio>=10?Math.round(r.ratio):+r.ratio.toFixed(1);
        return '<div class="v6v-card" style="animation-delay:'+(i*0.05)+'s"><img src="'+esc(r.v.thumb||'')+'" loading="lazy"/><div style="min-width:0"><div class="v6v-t">'+esc(r.v.title)+'</div><div class="v6v-m"><span class="v6v-x">×'+x+'</span>📺 '+esc(r.chName)+' ('+fmt(r.subs)+' подп.) · 👁 '+fmt(r.v.views)+' · '+(r.v.isShort?'⚡ Shorts':'🎬 Длинное')+' · '+Math.round(r.v.age)+' дн. назад</div></div><div class="v6v-act"><button class="v4-btn ghost" style="font-size:12px;padding:8px 12px" data-c="Своя версия под мой канал: '+esc(r.v.title)+'" onclick="v6ToScript(this)">🎬 Снять свою версию</button><a class="v6-copy" style="text-align:center;text-decoration:none" href="https://youtu.be/'+r.v.id+'" target="_blank" rel="noopener">▶ Открыть</a></div></div>';
      }).join('')+
      '<div class="v4-row" style="margin-top:10px"><button class="v4-btn ghost" onclick="v6Open(\'timing\')">⏰ Когда публиковались эти хиты → Карта времени</button></div>';
  }catch(e){out.innerHTML='<div class="v4-err">'+esc(e.message||'не получилось')+'</div>';}
  btn.disabled=false;
}

/* ============================================================ */
/* 5. TIMING HEATMAP                                             */
/* ============================================================ */
R6.timing=function(){
  var el=q('#v6body_timing');if(!el)return;
  var rows=null,src='';
  if(V6SCAN.rows&&V6SCAN.rows.length){rows=V6SCAN.rows.map(function(r){return r.v;});src='хиты ниши «'+V6SCAN.niche+'» из Вирального сканера';}
  else{
    try{
      if(W.STATE&&STATE.videos&&STATE.videos.length){
        var vs=STATE.videos.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;});
        rows=vs.slice(0,Math.max(10,Math.round(vs.length*0.3)));
        src='топ-30% роликов канала «'+(STATE.channel&&STATE.channel.title||'')+'»';
      }
    }catch(e){}
  }
  if(!rows||!rows.length){
    el.innerHTML='<div class="v4-note">Пока нет данных для карты. Сначала запусти <b>🔥 Виральный сканер</b> по своей нише или сделай аудит канала — тогда покажу, в какие дни и часы выходили хиты.</div><div class="v4-row" style="margin-top:10px"><button class="v4-btn" onclick="v6Open(\'viral\')">🔥 Открыть сканер</button></div>';
    return;
  }
  var grid={},best=[];
  rows.forEach(function(v){
    var d=new Date(v.published);var dow=(d.getDay()+6)%7;var hr=d.getHours();
    var k=dow+'_'+hr;
    grid[k]=(grid[k]||0)+1+Math.log10(1+(v.viewsPerDay||0));
  });
  var mx=0;Object.keys(grid).forEach(function(k){if(grid[k]>mx)mx=grid[k];});
  var dows=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  var h='<div class="v4-note">Источник: '+esc(src)+' ('+rows.length+' роликов). Время — твоё локальное. Чем ярче клетка, тем чаще в этот слот выходили ролики, которые выстрелили.</div>';
  h+='<div class="v6t-wrap" style="margin-top:13px"><div class="v6t-grid"><div></div>';
  for(var hh=0;hh<24;hh++)h+='<div class="v6t-h">'+(hh%3===0?hh:'')+'</div>';
  for(var dd=0;dd<7;dd++){
    h+='<div class="v6t-lab">'+dows[dd]+'</div>';
    for(var hh2=0;hh2<24;hh2++){
      var val=grid[dd+'_'+hh2]||0;
      var op=val?0.18+0.82*(val/mx):0;
      h+='<div class="v6t-cell" '+(val?'data-l="'+dows[dd]+' '+hh2+':00 — '+Math.round(val*10)/10+' балл."':'')+' style="'+(val?'background:rgba(255,45,85,'+op.toFixed(2)+')':'')+'"></div>';
    }
  }
  h+='</div></div>';
  var slots=Object.keys(grid).map(function(k){return {k:k,v:grid[k]};}).sort(function(a,b){return b.v-a.v;}).slice(0,3);
  h+='<div class="v6t-best">'+slots.map(function(s,i){
    var p=s.k.split('_');
    return '<div class="v6t-slot">'+['🥇','🥈','🥉'][i]+' <b>'+dows[+p[0]]+', ~'+p[1]+':00</b></div>';
  }).join('')+'</div>';
  h+='<div class="v4-note" style="margin-top:12px">💡 Это ориентир по нише, а не закон: главное — стабильность. Выбери 1-2 слота из топа и держи их 4 недели подряд, алгоритм любит предсказуемость.</div>';
  el.innerHTML=h;
};

/* ============================================================ */
/* 6. TELEPROMPTER                                               */
/* ============================================================ */
var PRO={raf:0,y:0,playing:false,t0:0,elapsed:0,speed:55,mirror:false,fs:42};
function proText(){
  var SL=W.__SCR_LAST;
  if(SL&&SL.d&&Array.isArray(SL.d.blocks))return SL.d.blocks.map(function(b){return (b.name?'[ '+b.name+' ]\n':'')+(b.text||b.t||'');}).join('\n\n');
  return '';
}
R6.prompter=function(){
  var el=q('#v6body_prompter');if(!el||el.__b){if(el&&el.__b){var ta=q('#v6ptTa');if(ta&&!ta.value){var t0=proText();if(t0)ta.value=t0;}}return;}el.__b=1;
  el.innerHTML='<div id="v6ProSetup">'+
  '<div class="v4-note">Полноэкранный суфлёр: плавная прокрутка, регулировка скорости на ходу, зеркальный режим (если читаешь через стекло у объектива) и таймер. Пробел или тап — старт/пауза.</div>'+
  '<div class="v4-lab" style="margin-top:12px">Текст (подтянул из сценариста, можно править)</div>'+
  '<textarea id="v6ptTa" placeholder="Вставь сценарий или текст, который будешь читать…"></textarea>'+
  '<div class="v4-row" style="margin-top:11px"><button class="v4-btn" id="v6ptGo">🎤 На весь экран</button><button class="v4-btn ghost" onclick="v4OpenTool(\'script\')">✍️ Сначала в сценарист</button></div></div>';
  var t=proText();if(t)q('#v6ptTa').value=t;
  q('#v6ptGo').addEventListener('click',function(){
    var txt=q('#v6ptTa').value.trim();
    if(txt.length<20){toast('Вставь текст — хотя бы пару абзацев','warn');return;}
    proStart(txt);
  });
};
function buildPro(){
  if(q('#v6Pro'))return;
  var el=D.createElement('div');el.id='v6Pro';
  el.innerHTML='<div id="v6ProBar"></div><div id="v6ProText"><div id="v6ProMid"></div><div id="v6ProScroll"></div></div>'+
  '<div id="v6ProCtl">'+
    '<button class="v6p-btn hot" id="v6ProPlay">▶ Старт</button>'+
    '<span id="v6ProTime">0:00</span>'+
    '<span class="grp">Скорость <input type="range" id="v6ProSp" min="14" max="160" value="55"/></span>'+
    '<span class="grp">Шрифт <input type="range" id="v6ProFs" min="24" max="72" value="42"/></span>'+
    '<button class="v6p-btn" id="v6ProMir">🪞 Зеркало</button>'+
    '<button class="v6p-btn" id="v6ProRst">⏮ Сначала</button>'+
    '<button class="v6p-btn" id="v6ProX" style="margin-left:auto">✕ Выйти</button>'+
  '</div>';
  D.body.appendChild(el);
  q('#v6ProPlay').addEventListener('click',proToggle);
  q('#v6ProSp').addEventListener('input',function(){PRO.speed=+this.value;});
  q('#v6ProFs').addEventListener('input',function(){PRO.fs=+this.value;q('#v6ProScroll').style.fontSize=PRO.fs+'px';});
  q('#v6ProMir').addEventListener('click',function(){PRO.mirror=!PRO.mirror;this.classList.toggle('hot',PRO.mirror);proApply();});
  q('#v6ProRst').addEventListener('click',function(){PRO.y=0;PRO.elapsed=0;PRO.t0=performance.now();proApply();updTime();});
  q('#v6ProX').addEventListener('click',proExit);
  q('#v6ProText').addEventListener('click',proToggle);
  D.addEventListener('keydown',function(e){
    var el2=q('#v6Pro');if(!el2||!el2.classList.contains('open'))return;
    if(e.code==='Space'){e.preventDefault();proToggle();}
    if(e.key==='Escape')proExit();
    if(e.key==='ArrowUp'){PRO.y=Math.max(0,PRO.y-120);proApply();}
    if(e.key==='ArrowDown'){PRO.y+=120;proApply();}
  });
}
function proStart(txt){
  buildPro();
  q('#v6ProScroll').textContent=txt;
  q('#v6ProScroll').style.fontSize=PRO.fs+'px';
  PRO.y=0;PRO.playing=false;PRO.elapsed=0;
  proApply();updTime();
  q('#v6ProPlay').textContent='▶ Старт';
  q('#v6Pro').classList.add('open');
  try{W.v4Close('v6prompter');}catch(e){}
  D.body.style.overflow='hidden';
}
function proApply(){
  var s=q('#v6ProScroll');if(!s)return;
  s.style.transform=(PRO.mirror?'scaleX(-1) ':'')+'translateY(-'+PRO.y+'px)';
  var max=Math.max(1,s.scrollHeight-W.innerHeight*0.4);
  var bar=q('#v6ProBar');if(bar)bar.style.width=Math.min(100,PRO.y/max*100)+'%';
}
function updTime(){
  var t=q('#v6ProTime');if(!t)return;
  var sec=Math.floor(PRO.elapsed/1000);
  t.textContent=Math.floor(sec/60)+':'+('0'+sec%60).slice(-2);
}
function proLoop(ts){
  if(!PRO.playing)return;
  var dt=ts-PRO._last;PRO._last=ts;
  PRO.y+=PRO.speed*dt/1000;
  PRO.elapsed+=dt;
  var s=q('#v6ProScroll');
  if(s&&PRO.y>s.scrollHeight){PRO.playing=false;q('#v6ProPlay').textContent='▶ Старт';return;}
  proApply();updTime();
  PRO.raf=requestAnimationFrame(proLoop);
}
function proToggle(){
  PRO.playing=!PRO.playing;
  q('#v6ProPlay').textContent=PRO.playing?'⏸ Пауза':'▶ Старт';
  if(PRO.playing){PRO._last=performance.now();PRO.raf=requestAnimationFrame(proLoop);}
  else cancelAnimationFrame(PRO.raf);
}
function proExit(){
  PRO.playing=false;cancelAnimationFrame(PRO.raf);
  var el=q('#v6Pro');if(el)el.classList.remove('open');
  D.body.style.overflow='';
}
W.v6Prompter=function(txt){if(txt&&txt.length>20)proStart(txt);else v6Open('prompter');};

/* ============================================================ */
/* 8. CONTENT CALENDAR                                           */
/* ============================================================ */
var CAL={ym:null,sel:null};
function calKey(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);}
function calGet(){return lget('v6_cal_v1',{});}
function calSet(v){lset('v6_cal_v1',v);}
R6.calendar=function(){
  var el=q('#v6body_calendar');if(!el)return;
  if(!CAL.ym){var n=new Date();CAL.ym=[n.getFullYear(),n.getMonth()];CAL.sel=calKey(n);}
  if(!el.__b){
    el.__b=1;
    el.innerHTML='<div class="v6c-top"><h3 id="v6cTitle"></h3><div class="v6c-nav"><button id="v6cPrev">‹</button><button id="v6cNext">›</button></div><div class="sp" style="flex:1"></div>'+
    '<button class="v4-btn ghost" style="font-size:12px;padding:8px 12px" id="v6cImp">📥 Импорт из плана и съёмок</button>'+
    '<button class="v4-btn ghost" style="font-size:12px;padding:8px 12px" id="v6cIcs">📲 Экспорт .ics</button></div>'+
    '<div class="v6c-grid" id="v6cGrid"></div>'+
    '<div class="v6c-side"><h4 id="v6cSelT"></h4><div id="v6cList"></div>'+
    '<div class="v6c-add"><input id="v6cIn" placeholder="что снимаем / публикуем в этот день"/><button class="v4-btn" style="padding:9px 15px" id="v6cAdd">+</button></div></div>';
    q('#v6cPrev').addEventListener('click',function(){calShift(-1);});
    q('#v6cNext').addEventListener('click',function(){calShift(1);});
    q('#v6cImp').addEventListener('click',calImport);
    q('#v6cIcs').addEventListener('click',calIcs);
    q('#v6cAdd').addEventListener('click',calAdd);
    q('#v6cIn').addEventListener('keydown',function(e){if(e.key==='Enter')calAdd();});
  }
  calRender();
};
function calShift(d){var m=CAL.ym[1]+d;CAL.ym=[CAL.ym[0]+Math.floor(m/12),(m%12+12)%12];calRender();}
function calRender(){
  var grid=q('#v6cGrid');if(!grid)return;
  var y=CAL.ym[0],m=CAL.ym[1];
  var months=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  q('#v6cTitle').textContent=months[m]+' '+y;
  var data=calGet();
  var first=new Date(y,m,1);var startDow=(first.getDay()+6)%7;
  var today=calKey(new Date());
  var h=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(function(d){return '<div class="v6c-dow">'+d+'</div>';}).join('');
  var cur=new Date(y,m,1-startDow);
  for(var i=0;i<42;i++){
    var k=calKey(cur);var evs=data[k]||[];
    h+='<div class="v6c-day'+(cur.getMonth()!==m?' out':'')+(k===today?' today':'')+(k===CAL.sel?' sel':'')+(evs.length?' has':'')+'" data-k="'+k+'"><span class="d">'+cur.getDate()+'</span>'+
      evs.slice(0,2).map(function(e){return '<div class="v6c-ev'+(e.type==='shoot'?' shoot':'')+'">'+esc(e.t)+'</div>';}).join('')+
      (evs.length>2?'<div class="v6c-ev">+'+(evs.length-2)+'</div>':'')+'</div>';
    cur.setDate(cur.getDate()+1);
  }
  grid.innerHTML=h;
  qa('.v6c-day',grid).forEach(function(d){d.addEventListener('click',function(){CAL.sel=d.getAttribute('data-k');calRender();});});
  calSide();
}
function calSide(){
  var data=calGet();var evs=data[CAL.sel]||[];
  var d=new Date(CAL.sel+'T12:00:00');
  q('#v6cSelT').textContent='📌 '+d.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
  q('#v6cList').innerHTML=evs.length?evs.map(function(e,i){
    return '<div class="v6c-li"><span>'+(e.type==='shoot'?'🎬':'📤')+'</span><span>'+esc(e.t)+'</span><button data-i="'+i+'">✕</button></div>';
  }).join(''):'<div style="color:var(--muted);font-size:12.5px;padding:6px 0">Пока пусто — добавь ниже или импортируй план.</div>';
  qa('#v6cList button').forEach(function(b){b.addEventListener('click',function(){
    var data2=calGet();(data2[CAL.sel]||[]).splice(+b.getAttribute('data-i'),1);
    if(data2[CAL.sel]&&!data2[CAL.sel].length)delete data2[CAL.sel];
    calSet(data2);calRender();
  });});
}
function calAdd(){
  var inp=q('#v6cIn');var t=inp.value.trim();if(!t)return;
  var data=calGet();(data[CAL.sel]=data[CAL.sel]||[]).push({t:t,type:'pub'});
  calSet(data);inp.value='';calRender();toast('Добавлено в календарь ✓','ok');
}
function calImport(){
  var data=calGet(),added=0;
  var has={};Object.keys(data).forEach(function(k){data[k].forEach(function(e){has[e.t.toLowerCase()]=1;});});
  function put(date,t,type){
    var k=calKey(date);var key=t.toLowerCase();
    if(has[key])return;has[key]=1;
    (data[k]=data[k]||[]).push({t:t.slice(0,90),type:type});added++;
  }
  /* next monday */
  var nm=new Date();nm.setDate(nm.getDate()+((8-nm.getDay())%7||7));
  var pl=lget('viora_plan4w_v1',null);
  if(pl&&Array.isArray(pl.weeks)){
    pl.weeks.forEach(function(w,wi){
      var ts=(w.tasks||[]).filter(function(t){return !t.done;});
      var offs=[0,2,4];
      ts.slice(0,3).forEach(function(t,ti){
        var d=new Date(nm);d.setDate(d.getDate()+wi*7+offs[ti%3]);
        put(d,t.t||String(t),'pub');
      });
    });
  }
  var shoots=[];try{shoots=(typeof loadShoots==='function'?loadShoots():[])||[];}catch(e){}
  shoots.filter(function(s){return s.status!=='done';}).slice(0,6).forEach(function(s,i){
    var d=new Date(nm);d.setDate(d.getDate()+i*3+1);
    put(d,s.topic||s.title||'Съёмка по плану','shoot');
  });
  calSet(data);calRender();
  toast(added?('Импортировано задач: '+added+' ✓'):'Всё уже в календаре','ok');
}
function calIcs(){
  var data=calGet();var keys=Object.keys(data).sort();
  if(!keys.length){toast('Календарь пуст — нечего экспортировать','warn');return;}
  function icsEsc(s){return String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');}
  var lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Viora Media//Content Calendar//RU','CALSCALE:GREGORIAN'];
  var stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  keys.forEach(function(k){
    data[k].forEach(function(e,i){
      var d=k.replace(/-/g,'');
      var nd=new Date(k+'T12:00:00');nd.setDate(nd.getDate()+1);
      lines.push('BEGIN:VEVENT','UID:viora-'+k+'-'+i+'@v.media','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+d,'DTEND;VALUE=DATE:'+calKey(nd).replace(/-/g,''),'SUMMARY:'+icsEsc((e.type==='shoot'?'🎬 ':'📤 ')+e.t),'END:VEVENT');
    });
  });
  lines.push('END:VCALENDAR');
  var blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'});
  var a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='viora-calendar.ics';
  D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
  toast('Файл .ics скачан — открой его на телефоне, события встанут в твой календарь ✓','ok');
}

/* ============================================================ */
/* 9. PIPELINE — idea → full production pack                     */
/* ============================================================ */
R6.pipeline=function(){
  var el=q('#v6body_pipeline');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=''+
  '<div class="v4-note">Одна кнопка — и из идеи получается полный пакет к съёмке: заголовки по формуле хита, концепт превью, сценарий, описание с таймкодами, теги и музыка. Останется только нажать REC.</div>'+
  '<div class="v4-lab" style="margin-top:12px">Идея ролика</div>'+
  '<input class="v4-in" id="v6ppIdea" placeholder="например: почему 90% новичков сливают первый депозит"/>'+
  '<div class="v4-row" style="margin-top:9px;align-items:center">'+
    '<div class="v6-seg" id="v6ppFmt"><button class="on" data-f="long">🎬 Длинный</button><button data-f="shorts">⚡ Shorts</button></div>'+
    '<button class="v4-btn" id="v6ppGo">🚀 Запустить конвейер</button>'+
  '</div>'+
  '<div id="v6ppSteps" class="v6pp-steps" style="display:none"></div>'+
  '<div id="v6ppOut" style="margin-top:6px"></div>';
  qa('#v6ppFmt button').forEach(function(b){b.addEventListener('click',function(){qa('#v6ppFmt button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  q('#v6ppGo').addEventListener('click',ppRun);
  q('#v6ppIdea').addEventListener('keydown',function(e){if(e.key==='Enter')ppRun();});
};
var PP_STEPS=[
  {ic:'✏️',t:'Заголовки и концепт превью'},
  {ic:'🎬',t:'Сценарий с хуком'},
  {ic:'📦',t:'Описание и теги'},
  {ic:'🎵',t:'Музыка и саунд-дизайн'}
];
function ppStepUI(state){
  q('#v6ppSteps').innerHTML=PP_STEPS.map(function(s,i){
    var st=state[i]||'wait';
    var ic=st==='done'?'✓':st==='run'?'<span class="v4-spin" style="width:13px;height:13px"></span>':s.ic;
    return '<div class="v6pp-st '+st+'"><span class="ic">'+ic+'</span><span>'+s.t+'</span><small>'+(st==='done'?'готово':st==='run'?'в работе…':'')+'</small></div>';
  }).join('');
}
function ppSec(ic,title,body,open){
  return '<div class="v6pp-sec'+(open?' open':'')+'"><div class="hd" onclick="this.parentNode.classList.toggle(\'open\')"><span>'+ic+'</span><span>'+title+'</span><span class="ar">▾</span></div><div class="bd">'+body+'</div></div>';
}
async function ppRun(){
  var idea=(q('#v6ppIdea')||{}).value.trim();
  if(idea.length<5){toast('Опиши идею ролика','warn');return;}
  var fmtV=(q('#v6ppFmt .on')||{getAttribute:function(){return 'long';}}).getAttribute('data-f');
  var isShorts=fmtV==='shorts';
  var btn=q('#v6ppGo'),out=q('#v6ppOut');
  btn.disabled=true;out.innerHTML='';
  q('#v6ppSteps').style.display='flex';
  var state=['run','wait','wait','wait'];ppStepUI(state);
  var brief=chanBrief();
  var P={};
  try{
    /* step 1: titles + preview */
    var r1=await aiJson(
      'Ты — продюсер YouTube. Для идеи ролика придумай: 5 заголовков (конкретика, цифры, интрига, до 65 символов, по-русски) с пометкой лучшего, и концепт превью. Верни СТРОГО JSON: {"titles":["..."],"best":0,"preview":{"text":"текст на превью до 4 слов","comp":"композиция кадра","emo":"эмоция","colors":"фон и акцент"}}',
      'Идея: «'+idea+'». Формат: '+(isShorts?'Shorts':'длинный ролик')+'. Канал: '+brief,1600);
    P.titles=r1.titles||[];P.best=Math.max(0,Math.min(P.titles.length-1,+r1.best||0));P.preview=r1.preview||{};
    state[0]='done';state[1]='run';ppStepUI(state);
    var title=P.titles[P.best]||idea;
    /* step 2: script */
    var r2=await aiJson(
      'Ты — сценарист YouTube с опытом удержания. Напиши сценарий ролика по блокам. Верни СТРОГО JSON: {"blocks":[{"name":"Хук","sec":20,"text":"дословный текст для озвучки"}]}. '+(isShorts?'Shorts: 4-5 блоков, суммарно 45-60 секунд, динамично, без приветствий.':'Длинный ролик: 6-8 блоков, суммарно 6-9 минут, каждый блок 40-90 секунд.')+' Текст готов к чтению вслух, разговорный, без воды. По-русски.',
      'Заголовок: «'+title+'». Идея: «'+idea+'». Канал: '+brief,3400);
    P.blocks=r2.blocks||[];
    state[1]='done';state[2]='run';ppStepUI(state);
    /* step 3: description + tags */
    var sumSec=0;var tc=P.blocks.map(function(b){var t=Math.floor(sumSec/60)+':'+('0'+Math.floor(sumSec%60)).slice(-2);sumSec+=(+b.sec||45);return t+' '+(b.name||'');});
    var r3=await aiJson(
      'Ты — SEO-специалист YouTube. Сделай описание ролика (2-3 абзаца: крючок в первой строке, о чём ролик, призыв) '+(isShorts?'':'с таймкодами ')+'и 15 тегов. Верни СТРОГО JSON: {"description":"...","tags":["..."]}. По-русски.',
      'Заголовок: «'+title+'». Идея: «'+idea+'».'+(isShorts?'':' Таймкоды: '+tc.join(', ')+'.')+' Канал: '+brief,2200);
    P.desc=r3.description||'';P.tags=r3.tags||[];
    state[2]='done';state[3]='run';ppStepUI(state);
    /* step 4: music */
    var r4=await aiJson(
      'Ты — саунд-дизайнер видео. Для каждого блока сценария предложи настроение музыки и готовый поисковый запрос для бесплатных библиотек (Epidemic Sound/YouTube Audio Library, запрос на английском). Верни СТРОГО JSON: {"items":[{"block":"имя блока","mood":"по-русски","query":"english search query"}],"sfx":["2-3 звуковых эффекта и где их вставить, по-русски"]}',
      'Блоки: '+P.blocks.map(function(b){return b.name;}).join(', ')+'. Тема: «'+title+'».',1800);
    P.music=r4.items||[];P.sfx=r4.sfx||[];
    state[3]='done';ppStepUI(state);
    lset('v6_pipe_v1',{idea:idea,fmt:fmtV,p:P,ts:Date.now()});
    /* render */
    var scriptTxt=P.blocks.map(function(b){return '[ '+(b.name||'')+' · ~'+(b.sec||45)+' сек ]\n'+(b.text||'');}).join('\n\n');
    var h='';
    h+=ppSec('✏️','Заголовки',P.titles.map(function(t,i){
      return '<div class="v6h-re"><span class="n">'+(i===P.best?'🏆':i+1)+'</span><span>'+esc(t)+'</span><span class="act"><button class="v6-copy" data-c="'+esc(t)+'" onclick="v6Copy(this)">⧉</button></span></div>';
    }).join(''),true);
    h+=ppSec('🖼','Концепт превью','<div class="v6cm-it"><span class="e">💬</span><span><b>Текст:</b> «'+esc(P.preview.text||'')+'»</span></div><div class="v6cm-it"><span class="e">🎬</span><span><b>Кадр:</b> '+esc(P.preview.comp||'')+'</span></div><div class="v6cm-it"><span class="e">😱</span><span><b>Эмоция:</b> '+esc(P.preview.emo||'')+'</span></div><div class="v6cm-it"><span class="e">🎨</span><span><b>Цвета:</b> '+esc(P.preview.colors||'')+'</span></div><div class="v4-row" style="margin-top:9px"><button class="v4-btn ghost" style="font-size:12px;padding:8px 12px" onclick="v4OpenTool(\'plab\')">🖼 Проверить в Превью-лаборатории</button></div>');
    h+=ppSec('🎬','Сценарий · ~'+Math.round(P.blocks.reduce(function(s,b){return s+(+b.sec||45);},0)/60)+' мин',P.blocks.map(function(b){
      return '<div style="margin-bottom:11px"><div style="font-weight:700;font-size:12px;color:#ff5d7f;letter-spacing:.05em;text-transform:uppercase">'+esc(b.name||'')+' · ~'+(b.sec||45)+' сек</div><div style="margin-top:3px">'+esc(b.text||'')+'</div></div>';
    }).join('')+'<div class="v4-row" style="margin-top:6px"><button class="v6-copy" id="v6ppScCopy">⧉ Скопировать сценарий</button><button class="v4-btn ghost" style="font-size:12px;padding:8px 12px" id="v6ppToPro">🎤 В телесуфлёр</button></div>');
    h+=ppSec('📦','Описание и теги','<div style="white-space:pre-wrap">'+esc(P.desc)+'</div><div style="margin-top:11px">'+P.tags.map(function(t){return '<span class="v6-tag">'+esc(t)+'</span>';}).join('')+'</div><div class="v4-row" style="margin-top:9px"><button class="v6-copy" data-c="'+esc(P.desc)+'" onclick="v6Copy(this)">⧉ Описание</button><button class="v6-copy" data-c="'+esc(P.tags.join(', '))+'" onclick="v6Copy(this)">⧉ Теги</button></div>');
    h+=ppSec('🎵','Музыка',P.music.map(function(m){
      return '<div class="v6cm-it"><span class="e">🎵</span><span><b>'+esc(m.block||'')+':</b> '+esc(m.mood||'')+'<br/><span style="color:#9b99a3;font-size:12px">поиск: '+esc(m.query||'')+'</span></span><span class="act"><button class="v6-copy" data-c="'+esc(m.query||'')+'" onclick="v6Copy(this)">⧉</button></span></div>';
    }).join('')+(P.sfx.length?'<div class="v4-note" style="margin-top:9px">🔊 '+P.sfx.map(esc).join(' · ')+'</div>':''));
    h+='<div class="v4-note">✅ Пакет готов и сохранён. Снимай по сценарию — телесуфлёр уже знает текст.</div>';
    out.innerHTML=h;
    var sc=q('#v6ppScCopy');if(sc)sc.addEventListener('click',function(){copyTxt(scriptTxt,sc);});
    var tp=q('#v6ppToPro');if(tp)tp.addEventListener('click',function(){W.v4Close('v6pipeline');W.v6Prompter(scriptTxt);});
    W.__SCR_LAST=W.__SCR_LAST||{d:{blocks:P.blocks},topic:title};
  }catch(e){
    out.innerHTML='<div class="v4-err">Конвейер остановился: '+esc(e.message||'AI недоступна')+'. Уже готовые шаги выше не потеряются — нажми ещё раз.</div>';
  }
  btn.disabled=false;
}

/* ============================================================ */
/* INIT                                                          */
/* ============================================================ */
function init(){
  killDock();
  buildNavBtn();
  watchDash();
  heroChips();
  /* hero strip may be built by v4 after us */
  setTimeout(heroChips,900);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',init);else init();
})();
