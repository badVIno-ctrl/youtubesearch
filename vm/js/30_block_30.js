/* =====================================================================
   VIORA V16 PACK — «Штаб»: командный центр канала
   1. Ровная шапка (фикс выравнивания на главной и в анализе)
   2. Штаб: Утро продюсера · Контент-календарь 30 дней · Турнир
      заголовков · Чек-ап перед публикацией
   3. Онбординг-опросник при первом запуске (работает и без канала)
      + стартовый план для новичка + расширенный профиль
   API-ключи и старая логика не тронуты — только надстройка.
   ===================================================================== */
(function(){
'use strict';
if(window.__V16)return;window.__V16=true;
var W=window,D=document;

function boot(){
  var C=W.__v11core;
  if(!C){setTimeout(boot,400);return;}
  var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,
      S=C.S,chid=C.chid,ai=C.ai,ctx=C.ctx,nicheName=C.nicheName,copyTxt=C.copyTxt,
      err11=C.err11,needCh=C.needCh,regTool=C.regTool,clamp=C.clamp,DAY=C.DAY;
  function aiR(sys,user,max){var att=0;function go(){return C.ai(sys,user,max).catch(function(e){att++;var msg=String((e&&e.message)||e);if(att<=3&&/429|rate|timeout|fetch/i.test(msg)){return new Promise(function(res){setTimeout(res,2500*att);}).then(go);}throw e;});}return go();}
  ai=aiR;

/* ================= общие помощники V16 ================= */
function pad2(n){return (n<10?'0':'')+n;}
function dkey(d){return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());}
function today(){var d=new Date();d.setHours(0,0,0,0);return d;}
var DOW=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
var MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function human(d){return d.getDate()+' '+MON[d.getMonth()]+', '+DOW[(d.getDay()+6)%7];}
function dream(){return lget('v16_dream',null);}
function pid(){return chid()||(dream()?'dream':'');}
function hasData(){return !!pid();}
var FMTN={shorts:'Shorts',long:'Длинный',both:'Shorts + длинные'};
var GEARN={phone:'телефон',cam:'камера',screen:'запись экрана (без лица)'};
var HRSN={low:'2–3 часа в неделю',mid:'5–7 часов в неделю',high:'10+ часов в неделю'};
var GOALN={grow:'набрать первую аудиторию',money:'выйти на доход',brand:'личный бренд / экспертность',hobby:'для души, без давления'};
function dreamCtx(){
  var d=dream();if(!d)return '';
  return 'АВТОР ПОКА БЕЗ КАНАЛА — план запуска с нуля.'+
    '\nХочет снимать: '+(d.custom||d.niche||'не определился')+
    (d.sub?'\nКОНКРЕТНО (важно! строй все идеи, ролики и заголовки именно вокруг этого; НЕ выдумывай другие игры/темы, которые автор не называл): '+d.sub:'')+
    (d.audience?'\nДля кого: '+d.audience:'')+
    '\nФормат: '+(FMTN[d.format]||'Shorts + длинные')+
    '\nВремя на контент: '+(HRSN[d.hours]||HRSN.mid)+
    '\nЦель: '+(GOALN[d.goal]||GOALN.grow)+
    '\nСнимает на: '+(GEARN[d.gear]||'телефон');
}
function anyCtx(){var c='';try{c=ctx();}catch(e){}return c||dreamCtx();}
function hitFormula(){
  try{var s=S();if(s.ai&&Array.isArray(s.ai.hit_formula)&&s.ai.hit_formula.length)return s.ai.hit_formula.join('; ');}catch(e){}
  return '';
}
/* живые подсказки поиска YouTube (JSONP) — своя копия, v15-шная закрыта в модуле */
function suggest(query){
  return new Promise(function(res){
    var cb='__v16s'+(Math.random()*1e9|0),done=false;
    var s=D.createElement('script');
    W[cb]=function(data){
      done=true;var items=[];
      try{items=(data&&data[1]||[]).map(function(x){return String(Array.isArray(x)?x[0]:x);});}catch(e){}
      try{delete W[cb];}catch(e){}s.remove();res(items);
    };
    s.onerror=function(){if(!done){try{delete W[cb];}catch(e){}s.remove();res([]);}};
    s.src='https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&hl=ru&q='+encodeURIComponent(query)+'&callback='+cb;
    D.head.appendChild(s);
    setTimeout(function(){if(W[cb]){try{delete W[cb];}catch(e){}s.remove();res([]);}},4500);
  });
}
function baseKw(){
  var d=dream();
  if(chid()){
    var nn='';try{nn=nicheName();}catch(e){}
    if(nn)return nn;
    try{return (S().channel&&S().channel.title)||'';}catch(e){return '';}
  }
  return d?String(d.custom||d.sub||d.niche||'').slice(0,60):'';
}
function load16(t){return '<div class="v16-load"><div class="v16-load-top"><span class="v16-spin"></span>'+esc(t||'Думаю…')+'</div><div class="v16-skel"><i style="width:88%"></i><i style="width:64%"></i><i style="width:76%"></i><i style="width:42%"></i></div></div>';}
function emptyState(msg){
  return '<div class="v16-empty">'+esc(msg||'Чтобы Штаб заработал, проанализируй канал — или пройди стартовый опросник, если канала пока нет.')+
    '<div class="v16-row" style="justify-content:center;margin-top:14px">'+
    '<button class="v16-btn" onclick="v16HqClose();try{showGate()}catch(e){}">📊 Проанализировать канал</button>'+
    '<button class="v16-btn ghost" onclick="v16OnbOpen()">🌱 У меня нет канала</button></div></div>';
}

/* ================= 1. РОВНАЯ ШАПКА ================= */
function tidyNav(){
  var nav=q('.nav-in');if(!nav)return;
  var brand=q('.brand',nav);
  var right=q('#v16navRight',nav);
  if(!right){
    var kids=Array.prototype.slice.call(nav.children);
    for(var i=0;i<kids.length;i++){
      if(kids[i]!==brand&&kids[i].tagName==='DIV'&&(kids[i].querySelector('.nav-tag')||kids[i].querySelector('.quota-pill'))){right=kids[i];break;}
    }
    if(!right){right=D.createElement('div');nav.appendChild(right);}
    right.id='v16navRight';
    right.removeAttribute('style');
  }
  /* всё, что модули докинули прямо в .nav-in, уводим в правый блок */
  Array.prototype.slice.call(nav.children).forEach(function(ch){
    if(ch===brand||ch===right)return;
    right.appendChild(ch);
  });
  /* кнопка Штаба */
  if(!q('#v16hqBtn')){
    var b=D.createElement('button');b.id='v16hqBtn';b.type='button';b.title='Штаб — командный центр канала';
    b.innerHTML='🎯 <span class="lb">Штаб</span>';
    b.addEventListener('click',function(){W.v16HqOpen();});
    right.appendChild(b);
  }
  /* длинная «Как это работает» на узких экранах — в иконку */
  var how=q('#v10howBtn');
  if(how){
    if(W.innerWidth<=900&&how.textContent!=='❓'){how.textContent='❓';how.title='Как это работает';}
    else if(W.innerWidth>900&&how.textContent==='❓'){how.textContent='❓ Как это работает';}
  }
}
setInterval(tidyNav,900);
try{tidyNav();}catch(e){}
W.addEventListener('resize',function(){try{tidyNav();}catch(e){}});

/* ================= 2. ШТАБ: каркас ================= */
var TABS=[
  {id:'morning',ic:'🌅',name:'Утро продюсера'},
  {id:'cal',ic:'📅',name:'Календарь'},
  {id:'battle',ic:'🥊',name:'Турнир заголовков'},
  {id:'chk',ic:'🚀',name:'Чек-ап'}
];
var RENDER={}; /* id -> fn(body) */
var curTab='morning';
function hqEl(){
  var el=q('#v16hq');
  if(el)return el;
  el=D.createElement('div');el.id='v16hq';
  el.innerHTML='<div class="v16-top"><button class="v16-back" onclick="v16HqClose()">←</button>'+
    '<div class="v16-ttl"><span>🎯</span><div>Штаб<small id="v16hqSub">командный центр канала</small></div></div>'+
    '<span class="v16-streak" id="v16streak" style="display:none"></span></div>'+
    '<div class="v16-tabs">'+TABS.map(function(t){
      return '<button class="v16-tab" data-t="'+t.id+'">'+t.ic+' '+t.name+'</button>';
    }).join('')+'</div>'+
    '<div class="v16-body"><div class="v16-wrap" id="v16body"></div></div>';
  D.body.appendChild(el);
  qa('.v16-tab',el).forEach(function(b){
    b.addEventListener('click',function(){openTab(b.getAttribute('data-t'));});
  });
  return el;
}
function openTab(id){
  curTab=id;
  var el=hqEl();
  qa('.v16-tab',el).forEach(function(b){b.classList.toggle('on',b.getAttribute('data-t')===id);});
  var body=q('#v16body',el);
  body.innerHTML='';
  paintStreak();
  if(!hasData()&&id!=='battle'){body.innerHTML=emptyState();return;}
  try{RENDER[id](body);}catch(e){body.innerHTML=err11(e&&e.message||'не получилось открыть раздел');}
  q('.v16-body',el).scrollTop=0;
}
W.v16HqOpen=function(tab){D.body.classList.add('v16-ov-open');
  var el=hqEl();
  var sub=q('#v16hqSub',el);
  try{var s=S();sub.textContent=s.channel?('канал «'+s.channel.title+'»'):(dream()?'план запуска с нуля':'командный центр канала');}catch(e){}
  el.classList.add('open');D.body.style.overflow='hidden';
  openTab(tab||curTab||'morning');
};
W.v16HqClose=function(){var el=q('#v16hq');if(el)el.classList.remove('open');D.body.style.overflow='';D.body.classList.remove('v16-ov-open');};
D.addEventListener('keydown',function(e){if(e.key==='Escape'){var el=q('#v16hq');if(el&&el.classList.contains('open'))W.v16HqClose();}});

/* ================= 3. КАЛЕНДАРЬ НА 30 ДНЕЙ ================= */
function calKey(){return 'v16_cal:'+pid();}
function calGet(){return lget(calKey(),null);}
function calSet(c){lset(calKey(),c);}
function calItem(cal,dk){
  if(!cal)return null;
  var start=new Date(cal.start+'T00:00:00');var d=new Date(dk+'T00:00:00');
  var idx=Math.round((d-start)/DAY);
  if(idx<0||idx>=cal.days.length)return null;
  return cal.days[idx];
}
function streak(){
  var cal=calGet();if(!cal)return 0;
  var n=0,d=today();
  if((cal.marks||{})[dkey(d)]!=='done')d=new Date(d-DAY); /* сегодня ещё не вечер — не рвём стрик */
  while((cal.marks||{})[dkey(d)]==='done'){n++;d=new Date(d-DAY);}
  return n;
}
function paintStreak(){
  var el=q('#v16streak');if(!el)return;
  var n=streak();
  if(n>0){el.style.display='';el.innerHTML='🔥 стрик: '+n+' дн.';}
  else el.style.display='none';
}
async function calBuild(btn){
  if(btn){btn.disabled=true;btn.textContent='Собираю план…';}
  var body=q('#v16body');
  var out=q('#v16calOut',body);
  if(out)out.innerHTML=load16('Viora изучает твои данные, спрос и конкурентов — план на 30 дней будет через ~20 секунд…');
  try{
    /* свежие взлёты конкурентов из Радара */
    var risers=(lget('v15_ntf:'+(chid()||'_'),[])||[]).filter(function(n){return n.type==='comp';}).slice(0,5)
      .map(function(n){return '«'+n.title+'»'+(n.why?' — '+n.why:'');}).join('\n');
    /* живой спрос */
    var hot=[];
    var kw=baseKw();
    if(kw){
      try{
        var s1=await suggest(kw);var s2=await suggest('как '+kw);
        hot=s1.slice(0,6).concat(s2.slice(0,4));
      }catch(e){}
    }
    var sys='Ты — продюсер YouTube. Составь контент-план ровно на 30 дней. Учитывай реальные данные: лучшие форматы и темы канала, живые поисковые запросы, взлёты конкурентов и время автора. Чередуй форматы осмысленно (Shorts чаще, длинные — на сильные темы), темы не повторяй, каждая тема — конкретная, «бери и снимай», а не рубрика. В дни без публикации ставь подготовительные задачи (съёмка, монтаж, превью) только если времени у автора мало — иначе план плотный. Поле why — почему эта тема и почему именно в этот день (1 фраза с опорой на данные). Поле hook — готовая первая фраза ролика. Верни СТРОГО валидный JSON: {"days":[{"d":1,"topic":"…","format":"shorts|long","hook":"…","why":"…"}]} — ровно 30 элементов, d от 1 до 30, без markdown.';
    var user=(anyCtx()||'Универсальный автор без данных.')+
      (hitFormula()?'\nФОРМУЛА ХИТА КАНАЛА: '+hitFormula():'')+
      (hot.length?'\nЖИВОЙ ПОИСК (что вводят прямо сейчас): '+hot.join(' · '):'')+
      (risers?'\nВЗЛЁТЫ КОНКУРЕНТОВ:\n'+risers:'')+
      '\nСтарт плана: завтра. Составь 30 дней.';
    var d=await ai(sys,user,3600);
    var days=(d.days||[]).filter(function(x){return x&&x.topic;}).slice(0,30);
    if(days.length<20)throw new Error('AI вернул неполный план — попробуй ещё раз');
    while(days.length<30)days.push({d:days.length+1,topic:'Запасной день: пересними лучшую тему месяца в новом формате',format:days.length%3?'shorts':'long',hook:'',why:'буфер на случай сдвига графика'});
    var start=new Date(today().getTime()+DAY);
    var old=calGet();
    calSet({made:Date.now(),start:dkey(start),days:days,marks:(old&&old.marks)||{}});
    toast('📅 План на 30 дней готов','ok');
    renderCal(q('#v16body'));
  }catch(e){
    if(out)out.innerHTML=err11((e&&e.message)||'не получилось собрать план');
    if(btn){btn.disabled=false;btn.textContent='📅 Собрать план на 30 дней';}
  }
}
W.v16CalBuild=function(btn){calBuild(btn);};
W.v16Mark=function(dk,kind){
  var cal=calGet();if(!cal)return;
  cal.marks=cal.marks||{};
  cal.marks[dk]=cal.marks[dk]===kind?'':kind; /* повторный тап снимает отметку */
  if(!cal.marks[dk])delete cal.marks[dk];
  calSet(cal);
  renderCal(q('#v16body'),dk);
  paintStreak();
  if(cal.marks[dk]==='done'){
    var n=streak();
    try{if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}catch(e){}
    toast(n>1?('✅ Выложено! Стрик '+n+' дн. подряд 🔥'):'✅ Выложено! Начало стрика 🔥','ok');
  }
};
var calSel='';
function renderCal(body,keepSel){
  var cal=calGet();
  body.innerHTML='<div class="v16-card"><div class="v16-h4">📅 Контент-календарь на 30 дней'+
    '<span style="flex:1"></span>'+
    (cal?'<button class="v16-btn ghost" style="min-height:34px;padding:7px 13px;font-size:12px" onclick="v16CalBuild(this)">🔄 Пересобрать</button>':'')+
    '</div>'+
    (cal?calGridHtml(cal):'<div class="v16-note" style="margin-bottom:13px">Viora соберёт план из твоих же данных: лучшие форматы канала + живые запросы поиска + взлёты конкурентов. Каждая ячейка — тема, формат и почему именно в этот день.</div>'+
      '<button class="v16-btn" onclick="v16CalBuild(this)">📅 Собрать план на 30 дней</button>')+
    '<div id="v16calOut"></div></div>'+
    '<div id="v16dsel"></div>';
  if(cal){
    qa('.v16-day[data-dk]',body).forEach(function(c){
      c.addEventListener('click',function(){selDay(c.getAttribute('data-dk'));});
    });
    selDay(keepSel||calSel||(calItem(cal,dkey(today()))?dkey(today()):cal.start),true);
  }
}
function calGridHtml(cal){
  var start=new Date(cal.start+'T00:00:00');
  var tk=dkey(today());
  var marks=cal.marks||{};
  var doneN=Object.keys(marks).filter(function(k){return marks[k]==='done';}).length;
  var lead=(start.getDay()+6)%7;
  var cells=DOW.map(function(d){return '<div class="v16-cal-dow">'+d+'</div>';}).join('');
  for(var i=0;i<lead;i++)cells+='<div class="v16-day off" aria-hidden="true"></div>';
  for(var j=0;j<cal.days.length;j++){
    var dt=new Date(start.getTime()+j*DAY);
    var dk=dkey(dt),it=cal.days[j],mk=marks[dk]||'';
    cells+='<button type="button" class="v16-day'+(dk===tk?' today':'')+(mk==='done'?' done':mk==='shot'?' shot':'')+'" data-dk="'+dk+'">'+
      '<span class="dn">'+dt.getDate()+' '+MON[dt.getMonth()].slice(0,3)+'</span>'+
      '<span class="fmt '+(it.format==='long'?'long':'shorts')+'">'+(it.format==='long'?'ДЛИННЫЙ':'SHORTS')+'</span>'+
      '<span class="tp">'+esc(it.topic)+'</span>'+
      (mk?'<span class="st">'+(mk==='done'?'✅':'🎥')+'</span>':'')+
      '</button>';
  }
  return '<div class="v16-cal-head"><div class="v16-cal-prog"><small>выложено '+doneN+' из 30 · стрик '+streak()+' дн.</small><div class="bar"><i style="width:'+Math.round(doneN/30*100)+'%"></i></div></div></div>'+
    '<div class="v16-cal-grid">'+cells+'</div>';
}
function selDay(dk,quiet){
  var cal=calGet();var it=calItem(cal,dk);
  var box=q('#v16dsel');if(!box)return;
  calSel=dk;
  qa('.v16-day[data-dk]').forEach(function(c){c.classList.toggle('sel',c.getAttribute('data-dk')===dk);});
  if(!it){if(!quiet)box.innerHTML='';else box.innerHTML='';return;}
  var dt=new Date(dk+'T00:00:00');
  var mk=(cal.marks||{})[dk]||'';
  box.innerHTML='<div class="v16-dsel"><div class="v16-h4" style="margin-bottom:4px">'+(it.format==='long'?'🎬':'⚡')+' '+human(dt)+' · '+(it.format==='long'?'длинный ролик':'Shorts')+'</div>'+
    '<div style="font-size:16px;font-weight:700;line-height:1.4">'+esc(it.topic)+'</div>'+
    (it.hook?'<div class="hk">🪝 Хук: «'+esc(it.hook)+'»</div>':'')+
    (it.why?'<div class="why">💡 '+esc(it.why)+'</div>':'')+
    '<div class="v16-row">'+
    (chid()?'<button class="v16-btn" id="v16dConv">🏭 Ролик под ключ</button>':'<button class="v16-btn" id="v16dScript">📝 Сценарий</button>')+
    '<button class="v16-btn ghost" id="v16dBattle">🥊 Турнир заголовков</button>'+
    '<button class="v16-btn ghost" onclick="v16Mark(\''+dk+'\',\'shot\')">'+(mk==='shot'?'🎥 Снял ✓':'🎥 Снял')+'</button>'+
    '<button class="v16-btn gold" onclick="v16Mark(\''+dk+'\',\'done\')">'+(mk==='done'?'✅ Выложил ✓':'✅ Выложил')+'</button>'+
    '</div></div>';
  var cv=q('#v16dConv');if(cv)cv.addEventListener('click',function(){W.v16HqClose();W.v12ConvOpen&&W.v12ConvOpen(it.topic);});
  var sc=q('#v16dScript');if(sc)sc.addEventListener('click',function(){openScript(it.topic);});
  var bt=q('#v16dBattle');if(bt)bt.addEventListener('click',function(){openTab('battle');setTimeout(function(){var i=q('#v16btIdea');if(i)i.value=it.topic;},60);});
}
function openScript(topic){
  W.v16HqClose();
  try{
    if(W.vScriptOpen){W.vScriptOpen();var t=q('#vsTopic');if(t)t.value=topic;return;}
  }catch(e){}
  toast('Открой «Генератор сценариев» и вставь тему: '+topic,'warn');
}
RENDER.cal=function(body){renderCal(body);};

function regTab(t,fn){
  TABS.push(t);RENDER[t.id]=fn;
  var el=q('#v16hq');
  if(el){
    var tb=q('.v16-tabs',el);
    if(tb&&!q('.v16-tab[data-t="'+t.id+'"]',tb)){
      var b=D.createElement('button');b.className='v16-tab';b.setAttribute('data-t',t.id);
      b.innerHTML=t.ic+' '+t.name;
      b.addEventListener('click',function(){openTab(t.id);});
      tb.appendChild(b);
    }
  }
}
W.__v16={regTab:regTab,calSet:calSet,renderCal:renderCal,openTab:openTab,suggest:suggest,baseKw:baseKw,anyCtx:anyCtx,dreamCtx:dreamCtx,dream:dream,pid:pid,hasData:hasData,calGet:calGet,calItem:calItem,streak:streak,load16:load16,emptyState:emptyState,RENDER:RENDER,hitFormula:hitFormula,dkey:dkey,today:today,human:human,openScript:openScript,paintStreak:paintStreak,FMTN:FMTN,GEARN:GEARN,HRSN:HRSN,GOALN:GOALN};W.__v16.aiRetry=aiR;

/* регистрация в меню и хабе */
regTool({id:'v16hq',ic:'🎯',name:'Штаб',d:'Командный центр: утро продюсера, календарь на 30 дней, турнир заголовков, чек-ап',fn:function(){W.v16HqOpen();},hub:true});
regTool({id:'v16battle',ic:'🥊',name:'Турнир заголовков',d:'8 заголовков сталкиваются в плей-офф — финалист + прогноз CTR',fn:function(){W.v16HqOpen('battle');}});
regTool({id:'v16chk',ic:'🚀',name:'Чек-ап перед публикацией',d:'Превью + заголовок + описание → скор 0-100 и готовый SEO-пакет',fn:function(){W.v16HqOpen('chk');}});
}
boot();
})();
