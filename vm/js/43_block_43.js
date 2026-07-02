/* ====================================================================
   VIORA v22 — «Старт и возвращение» · self-contained IIFE
   ==================================================================== */
(function(){
'use strict';
var W=window, D=document;
var PFX='viora_v22_';
function lg(k,d){try{var v=JSON.parse(localStorage.getItem(PFX+k));return v==null?d:v;}catch(e){return d;}}
function ls(k,v){try{localStorage.setItem(PFX+k,JSON.stringify(v));return true;}catch(e){return false;}}
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]);});}
function qs(sel,r){return (r||D).querySelector(sel);}
function toast(m,k){try{if(typeof W.vToast==='function')W.vToast(m,k||'ok');}catch(e){}}
function fmtN(n){n=Number(n)||0;if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1).replace('.0','')+'M';if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1).replace('.0','')+'K';return String(Math.round(n));}
function st(){try{return (typeof W.STATE!=='undefined'&&W.STATE)?W.STATE:(typeof STATE!=='undefined'?STATE:{});}catch(e){return {};}}

/* ---- shared shoots store (общая правда с «Моими съёмками») ---- */
var SHOOTS_KEY='viora_shoots_v1';
function shootsLoad(){try{var a=JSON.parse(localStorage.getItem(SHOOTS_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}}
function shootsSave(a){try{localStorage.setItem(SHOOTS_KEY,JSON.stringify(a.slice(0,80)));}catch(e){}try{if(typeof W.renderShootsList==='function')W.renderShootsList();}catch(e){}}

/* ---- AI helper с мягким фолбэком ---- */
function aiReady(){return typeof W.callMistralRaw==='function';}
function aiCall(sys,user,max){
  return new Promise(function(resolve){
    if(!aiReady()){resolve(null);return;}
    try{
      Promise.resolve(W.callMistralRaw(sys,user,max||1100)).then(function(a){
        if(typeof a==='string'){try{a=JSON.parse(a);}catch(e){a=null;}}
        resolve(a||null);
      }).catch(function(){resolve(null);});
    }catch(e){resolve(null);}
  });
}

/* ---- ISO week helpers ---- */
function weekKey(ts){var d=new Date(ts);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-((d.getDay()+6)%7));var wk1=new Date(d.getFullYear(),0,4);var n=1+Math.round(((d-wk1)/864e5-3+((wk1.getDay()+6)%7))/7);return d.getFullYear()+'-W'+(n<10?'0'+n:n);}
function curWeek(){return weekKey(Date.now());}

/* ====================  ДАННЫЕ B1 / B4  ==================== */
function pubLog(){var a=lg('publog',[]);return Array.isArray(a)?a:[];}
function pubLogAdd(meta){var a=pubLog();a.unshift(Object.assign({ts:Date.now()},meta||{}));ls('publog',a.slice(0,400));}
function weeklyGoal(){var g=+lg('goal',2);return (g>=1&&g<=14)?g:2;}
function setWeeklyGoal(n){ls('goal',n);}
function pubThisWeek(){var w=curWeek();return pubLog().filter(function(p){return weekKey(p.ts)===w;}).length;}
function weekStreak(){
  /* стрик подряд идущих недель (заканчивая прошлой неделей или текущей если цель уже выполнена) с выполненной целью */
  var g=weeklyGoal();var byWeek={};pubLog().forEach(function(p){var w=weekKey(p.ts);byWeek[w]=(byWeek[w]||0)+1;});
  var streak=0;var probe=new Date();probe.setHours(0,0,0,0);
  /* если текущая неделя ещё не выполнена — не рвём стрик, начинаем считать с прошлой */
  if((byWeek[weekKey(probe.getTime())]||0) < g){probe.setDate(probe.getDate()-7);}
  for(var i=0;i<104;i++){var wk=weekKey(probe.getTime());if((byWeek[wk]||0)>=g){streak++;probe.setDate(probe.getDate()-7);}else break;}
  return streak;
}
function pubTotal(){return pubLog().length;}

/* ====================  ДАННЫЕ A2 челлендж  ==================== */
var CH_TASKS=[
 {t:'День 1 — выбери нишу и тему',w:'Одна узкая тема, в которой тебе есть что сказать. Конкретное «как» бьёт абстрактное «про всё».'},
 {t:'День 2 — собери 10 идей роликов',w:'Накидай 10 заголовков. Открой «Поиск идей» Viora — подсмотри, что уже залетело у других в нише.'},
 {t:'День 3 — напиши сценарий первого ролика',w:'Хук на первые 15 секунд + 3-5 смысловых блоков + призыв. Можно собрать в мастере «Первый ролик за 10 минут».'},
 {t:'День 4 — сделай упаковку',w:'Кликабельный заголовок и превью: крупный текст, эмоция, контраст. Упаковка важнее самой съёмки.'},
 {t:'День 5 — сними черновик',w:'Не гонись за идеалом. Снял — уже победа. Свет от окна, телефон на опоре, чистый звук.'},
 {t:'День 6 — смонтируй',w:'Убери паузы и «эээ», держи динамику каждые 20-30 сек, добавь субтитры.'},
 {t:'День 7 — опубликуй',w:'Загрузи ролик, заполни описание и теги. Отметь публикацию в «Стрик + цель» — засчитаем в стрик.'}
];
function chState(){var s=lg('challenge',null);if(!s||typeof s!=='object')s={start:0,done:{}};if(!s.done)s.done={};return s;}
function chSave(s){ls('challenge',s);}
function chDoneCount(){var d=chState().done;return Object.keys(d).filter(function(k){return d[k];}).length;}

/* ====================  ДАННЫЕ B2 рост  ==================== */
function growth(){var a=lg('growth',[]);return Array.isArray(a)?a:[];}
function growthSave(a){a.sort(function(x,y){return x.ts-y.ts;});ls('growth',a.slice(-52));}

/* ====================  B4 достижения  ==================== */
var ACHV=[
 {id:'flow',ic:'🎬',n:'Первый ролик',d:'Прошёл мастер «Первый ролик за 10 минут»'},
 {id:'firstpub',ic:'🚀',n:'Премьера',d:'Отметил первую публикацию'},
 {id:'challenge',ic:'🧭',n:'Профиль готов',d:'Прошёл опрос-онбординг и заполнил профиль'},
 {id:'streak3',ic:'🔥',n:'Стрик ×3',d:'3 недели подряд с выполненной целью'},
 {id:'tenpub',ic:'🏆',n:'Десятка',d:'10 опубликованных роликов'}
];
function achvStore(){var a=lg('achv',{});return (a&&typeof a==='object')?a:{};}
function achvEarned(){
  var e={};
  if(lg('flow_done',0))e.flow=1;
  var pt=pubTotal();
  if(pt>=1)e.firstpub=1;
  if(pt>=10)e.tenpub=1;
  if(surveyDone())e.challenge=1;
  if(weekStreak()>=3)e.streak3=1;
  return e;
}
function achvSync(){
  var earned=achvEarned();var stored=achvStore();var fresh=[];
  Object.keys(earned).forEach(function(id){if(!stored[id]){stored[id]=Date.now();fresh.push(id);}});
  if(fresh.length){ls('achv',stored);fresh.forEach(function(id){var m=ACHV.filter(function(x){return x.id===id;})[0];if(m)toast('Достижение разблокировано: '+m.ic+' '+m.n,'ok');});}
  return stored;
}
var LEVELS=[
 {min:0,n:'Новичок',ic:'🌱'},{min:60,n:'Любитель',ic:'🎥'},{min:160,n:'Продюсер',ic:'🎬'},
 {min:320,n:'Мастер',ic:'⭐'},{min:600,n:'Легенда',ic:'👑'}
];
function xp(){var s=achvStore();return pubTotal()*12 + Object.keys(s).length*30 + surveyCount()*6;}
function levelInfo(){var x=xp();var lv=LEVELS[0],nxt=null;for(var i=0;i<LEVELS.length;i++){if(x>=LEVELS[i].min){lv=LEVELS[i];nxt=LEVELS[i+1]||null;}}return {lv:lv,next:nxt,xp:x};}

/* ====================  МОНТИРОВАНИЕ ХАБА  ==================== */
function isNewbie(){
  try{if(st()&&st().channel)return false;}catch(e){}
  if(shootsLoad().length)return false;
  if(pubTotal())return false;
  if(growth().length)return false;
  if(surveyDone())return false;
  return true;
}
function ensureHub(){
  var hero=qs('#hero');if(!hero)return null;
  var hub=qs('#v22Hub');
  if(!hub){hub=D.createElement('div');hub.id='v22Hub';
    var rp=qs('#recentPanel');
    if(rp&&rp.parentNode===hero)hero.insertBefore(hub,rp); else hero.appendChild(hub);
  }
  return hub;
}
var _tab=null;
function activeTab(){
  if(_tab)return _tab;
  _tab=lg('tab', isNewbie()?'start':'return');
  return _tab;
}
function setTab(t){_tab=t;ls('tab',t);render();}
W.__v22setTab=setTab;

function render(){
  var hub=ensureHub();if(!hub)return;
  achvSync();
  var tab=activeTab();
  var html=''+
   '<div class="v22-head">'+
     '<div class="v22-ic">🚀</div>'+
     '<div><h3>Старт и возвращение</h3><div class="v22-sub">'+(tab==='start'?'Запусти свой первый ролик — по шагам, без воды':'Возвращайся, держи ритм и расти')+'</div></div>'+
     '<div class="v22-tabs">'+
       '<button class="'+(tab==='start'?'on':'')+'" onclick="__v22setTab(\'start\')">🚀 Старт</button>'+
       '<button class="'+(tab==='return'?'on':'')+'" onclick="__v22setTab(\'return\')">🔁 Возвращение</button>'+
     '</div>'+
   '</div>'+
   cardToday()+
   (tab==='start'?blockA():blockB());
  hub.innerHTML=html;
  if(tab==='return'){try{drawGrowthChart();}catch(e){}}
}
W.__v22render=render;
function cardToday(){
  var p=profGet();var ch=st().channel;var done=surveyDone();var streak=weekStreak();var pub=pubTotal();
  var primary,sub,btnLabel,btnAction;
  if(!done){
    primary='Заполни профиль за 30 секунд';
    sub='Несколько коротких вопросов — и весь сайт настроится под тебя: план, разбор, советы.';
    btnLabel='Пройти опрос →';btnAction="try{v16OnbOpen()}catch(e){}";
  } else if(!ch){
    primary='Сними первый ролик по нише «'+(p.niche||'твоя тема')+'»';
    sub='Мастер за 10 минут проведёт: идея → сценарий → упаковка → чек-лист. Он уже знает твою нишу.';
    btnLabel='Собрать ролик ⚡';btnAction='__v22flowOpen()';
  } else {
    primary='Собери план следующего видео';
    sub='Канал разобран. Дальше — конкретный план съёмки на основе твоих данных.';
    btnLabel='Открыть план →';btnAction='__v22goShoot()';
  }
  var bits=[];if(done)bits.push('✅ профиль готов');if(streak>0)bits.push('🔥 стрик '+streak+' нед.');if(pub>0)bits.push('🎬 опубликовано '+pub);
  var glance=bits.length?('<div class="v22-today-glance">'+bits.join(' · ')+'</div>'):'';
  return '<div class="v22-today">'+
    '<div class="v22-today-l"><div class="v22-today-k">СЕГОДНЯ · твой следующий шаг</div>'+
      '<div class="v22-today-h">'+esc(primary)+'</div>'+
      '<div class="v22-today-s">'+esc(sub)+'</div>'+glance+'</div>'+
    '<button class="v22-btn v22-today-btn" onclick="'+btnAction+'">'+esc(btnLabel)+'</button>'+
  '</div>';
}
W.__v22goShoot=function(){try{var s=qs('#nextShootSection');if(s){s.scrollIntoView({behavior:'smooth',block:'start'});return;}}catch(e){}toast('Открой раздел плана на дашборде','info');};

/* ====================  БЛОК A — СТАРТ  ==================== */
/* ---- профиль: единый источник (viora_profile_v1) ---- */
function profGet(){try{var p=(typeof W.PROFILE!=='undefined'&&W.PROFILE)?W.PROFILE:JSON.parse(localStorage.getItem('viora_profile_v1')||'null');return (p&&typeof p==='object')?p:{};}catch(e){return {};}}
function makePatch(k,v){var o={};o[k]=v;return o;}
function profSet(patch){var p=profGet();Object.keys(patch||{}).forEach(function(k){p[k]=patch[k];});try{if(typeof W.saveProfile==='function')W.saveProfile(p);else localStorage.setItem('viora_profile_v1',JSON.stringify(p));}catch(e){try{localStorage.setItem('viora_profile_v1',JSON.stringify(p));}catch(_){}}try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}return p;}
function surveyCount(){var p=profGet();var n=0;if(p.level)n++;if(p.niche&&String(p.niche).trim())n++;if(p.context)n++;if(p.goal&&String(p.goal).trim())n++;return n;}
function surveyDone(){var p=profGet();return !!(p.level&&p.context&&p.niche&&String(p.niche).trim());}

/* ====================  БЛОК A — СТАРТ  ==================== */
function blockA(){
  return '<div class="v22-grid">'+
   '<div class="v22-card wide">'+
     '<div class="v22-a1">'+
       '<div class="v22-a1-tx">'+
         '<span class="v22-time">⏱ ~10 минут</span>'+
         '<div class="v22-ct">🎬 Первый ролик за 10 минут</div>'+
         '<div class="v22-cd" style="margin-bottom:0">Один проход для новичка: ниша → 3 идеи → готовый сценарий → упаковка → чек-лист публикации. В конце сохраним всё как съёмку — и ты уйдёшь с готовым первым роликом.</div>'+
       '</div>'+
       '<button class="v22-btn" onclick="__v22flowOpen()">Начать ⚡</button>'+
     '</div>'+
   '</div>'+
   cardSurvey()+
  '</div>';
}
/* Дублирующий 4-вопросный опрос удалён — те же вопросы задаёт единый
   онбординг v16 (v16OnbOpen). Пока профиль не заполнен, карточку не показываем
   вовсе: CTA «Пройти опрос» уже есть в блоке «СЕГОДНЯ» выше. */
function cardSurvey(){
  if(!surveyDone())return '';
  var p=profGet();var niche=p.niche||'';
  return '<div class="v22-card wide">'+
    '<div class="v22-ct">🧭 Профиль продюсера <span class="v22-ch-num" style="color:#36e07a">✓</span></div>'+
    '<div class="v22-cd">Ниша «'+esc(niche)+'» — план, разбор канала и AI-советы опираются на неё.</div>'+
    '<div class="v22-row" style="margin-top:8px"><button class="v22-btn ghost sm" onclick="try{W.v16OnbOpen()}catch(e){}">Изменить профиль</button></div>'+
  '</div>';
}

/* ====================  БЛОК B — ВОЗВРАЩЕНИЕ  ==================== */
function blockB(){
  return '<div class="v22-grid">'+cardStreak()+cardGrowth()+cardKanban()+cardTips()+cardAchv()+'</div>';
}
var V23_TIPS=[
 {t:'Упаковка решает на ~50%',s:'Paddy Galloway: топы тратят ~30% времени на идею и упаковку. CTR ниже 4% — проблема в превью и заголовке, а не в монтаже.'},
 {t:'Правило 3 элементов на превью',s:'Лицо с эмоцией + 1 контрастный объект + чистый фон. Картинка читается за <1 сек с телефона. Делай 2-3 варианта на A/B.'},
 {t:'Первые 15 секунд = всё',s:'55% зрителей уходят в первую минуту. Без интро и логотипов — сразу к ценности. Цель: удержать 70%+ на 30-й секунде.'},
 {t:'Хук Shorts < 3 секунд',s:'Jenny Hoyos (10М+ просмотров/Shorts): хук понятен без звука за 3 сек. «Хук, затем предвестие». Цель удержания 90%+.'},
 {t:'Outlier-анализ идей',s:'Бери ролики в нише с 3-4x к средней канала. Воронка 0-100-10-1: 100 идей → 10 годных → 1 в продакшн.'},
 {t:'Первые 10 роликов новичка',s:'Цель не вирал, а «обучить алгоритм». Узкая ниша, 80% overlap между роликами, поисковые how-to (CTR поиска 8-15%).'},
 {t:'Частота под стадию',s:'Мес 1-4: 2 ролика/нед на повторение и навык. Мес 5-12: 1 качественный/нед с упором на упаковку.'},
 {t:'Связка Shorts → длинное',s:'74% просмотров Shorts — не от подписчиков. Линкуй Short на длинное видео по теме: такие зрители смотрят в 4x дольше.'}
];
var _tipOff=0;
function cardTips(){
  var i=((new Date().getDate())+_tipOff)%V23_TIPS.length;var tip=V23_TIPS[i];
  return '<div class="v22-card wide">'+
    '<div class="v22-ct">🎓 Плейбук практиков <span class="v22-ch-num" style="color:var(--muted,#a6a4af);font-weight:600">совет №'+(i+1)+'/'+V23_TIPS.length+'</span></div>'+
    '<div class="v22-cd">Из разборов реальных продюсеров (Paddy Galloway, Jenny Hoyos, Think Media) — конкретика с бенчмарками.</div>'+
    '<div class="v22-concl" style="background:linear-gradient(120deg,rgba(58,160,255,.09),rgba(255,45,85,.04))"><b>'+esc(tip.t)+'</b><br>'+esc(tip.s)+'</div>'+
    '<div class="v22-row" style="margin-top:10px"><button class="v22-btn ghost sm" onclick="__v22tip()">Следующий совет →</button></div>'+
  '</div>';
}
W.__v22tip=function(){_tipOff=(_tipOff+1)%V23_TIPS.length;render();};

/* ---- B1 ---- */
function cardStreak(){
  var g=weeklyGoal();var done=pubThisWeek();var streak=weekStreak();
  var dots='';for(var i=0;i<g;i++)dots+='<i class="'+(i<done?'on':'')+'"></i>';
  var pct=Math.min(100,Math.round(done/g*100));
  var nudge='';
  if(done>=g)nudge='<div class="v22-nudge" style="color:#9bf3bf;background:rgba(54,224,122,.08);border-color:rgba(54,224,122,.3)">✅ Цель недели выполнена — '+done+' из '+g+'. Так держать, стрик растёт!</div>';
  else nudge='<div class="v22-nudge">🎯 На этой неделе '+done+' из '+g+'. Осталось '+(g-done)+' — выпусти ролик и отметь его, чтобы продлить стрик.</div>';
  var goalOpts=[1,2,3,4,5,7].map(function(n){return '<option value="'+n+'"'+(n===g?' selected':'')+'>'+n+' / нед.</option>';}).join('');
  return '<div class="v22-card">'+
    '<div class="v22-ct">🔥 Стрик и недельная цель</div>'+
    '<div class="v22-cd" style="margin-bottom:10px">Держи ритм публикаций. Неделя засчитана, когда выполнил цель.</div>'+
    '<div class="v22-streak-top"><span class="v22-flame">'+(streak>0?'🔥':'🧊')+'</span>'+
      '<div><div class="v22-streak-n">'+streak+'</div><div class="v22-streak-l">'+(streak===1?'неделя':streak>=2&&streak<=4?'недели':'недель')+' подряд с выполненной целью</div></div></div>'+
    '<div class="v22-weekgoal"><label>Цель:</label><select class="v22-sel" style="width:auto;min-width:120px" onchange="__v22setGoal(this.value)">'+goalOpts+'</select></div>'+
    '<div class="v22-ch-prog"><div class="v22-bar'+(done>=g?' grn':'')+'"><i style="width:'+pct+'%"></i></div><span class="v22-ch-num">'+done+'/'+g+'</span></div>'+
    '<div class="v22-dots">'+dots+'</div>'+
    '<div class="v22-row" style="margin-top:13px"><button class="v22-btn sm" onclick="__v22markPub()">+ Отметить публикацию</button>'+(pubTotal()?'<button class="v22-btn ghost sm" onclick="__v22undoPub()">Отменить последнюю</button>':'')+'</div>'+
    nudge+
  '</div>';
}
W.__v22setGoal=function(v){setWeeklyGoal(+v||2);render();};
W.__v22markPub=function(){pubLogAdd({src:'manual'});achvSync();toast('Публикация засчитана 🎉','ok');render();};
W.__v22undoPub=function(){var a=pubLog();a.shift();ls('publog',a);render();};

/* ---- B2 ---- */
var _gChart=null;
function cardGrowth(){
  var g=growth();var last=g[g.length-1]||null,prev=g[g.length-2]||null;
  var ch=st().channel||{};
  function delta(cur,pr){if(pr==null||cur==null||!pr)return '<div class="d flat">—</div>';var p=(cur-pr)/pr*100;var cls=p>0.05?'up':(p<-0.05?'down':'flat');return '<div class="d '+cls+'">'+(p>=0?'▲ +':'▼ ')+Math.abs(p).toFixed(1)+'%</div>';}
  var subsNow=last?last.subs:(ch.subs||null), viewsNow=last?last.views:(ch.totalViews||null);
  var tiles='<div class="v22-g-tiles">'+
    '<div class="v22-g-tile"><div class="v">'+(subsNow!=null?fmtN(subsNow):'—')+'</div><div class="l">Подписчиков</div>'+(last&&prev?delta(last.subs,prev.subs):'')+'</div>'+
    '<div class="v22-g-tile"><div class="v">'+(viewsNow!=null?fmtN(viewsNow):'—')+'</div><div class="l">Просмотров</div>'+(last&&prev?delta(last.views,prev.views):'')+'</div>'+
    '<div class="v22-g-tile"><div class="v">'+g.length+'</div><div class="l">Замеров</div></div>'+
  '</div>';
  var concl='';
  if(g.length>=2){var ds=prev.subs?((last.subs-prev.subs)/prev.subs*100):0;
    concl='<div class="v22-concl">'+(ds>0.05?('📈 Ты вырос на <b>+'+ds.toFixed(1)+'%</b> по подписчикам за период между замерами ('+ (last.subs-prev.subs>=0?'+':'') + fmtN(last.subs-prev.subs)+'). Так держать — фиксируй, что сработало.'):ds< -0.05?('📉 Подписчики просели на <b>'+ds.toFixed(1)+'%</b>. Посмотри, какие ролики дали отток, и вернись к рабочей формуле.'):'➖ Рост почти на месте. Увеличь частоту или попробуй новый формат — и заверши неделю замером.')+'</div>';
  } else { concl='<div class="v22-concl">Добавь замер раз в неделю — и я покажу динамику «вырос на X%» и график. Можно заполнить из подключённого канала'+(ch.subs!=null?' (уже вижу '+fmtN(ch.subs)+' подписчиков)':'')+'.</div>'; }
  var prefill = ch.subs!=null||ch.totalViews!=null ? '<button class="v22-btn ghost sm" onclick="__v22growthFromChannel()">Взять из канала</button>':'';
  return '<div class="v22-card">'+
    '<div class="v22-ct">📊 Трекер роста канала</div>'+
    '<div class="v22-cd" style="margin-bottom:12px">Сверяйся раз в неделю: подписчики и просмотры по неделям + вывод одной строкой.</div>'+
    tiles+
    (g.length?'<div class="v22-chart-wrap"><canvas id="v22GrowthCv"></canvas></div>':'')+
    concl+
    '<div class="v22-row" style="margin-top:13px">'+
      '<input class="v22-input" id="v22gSubs" type="number" inputmode="numeric" placeholder="Подписчики" style="flex:1;min-width:110px">'+
      '<input class="v22-input" id="v22gViews" type="number" inputmode="numeric" placeholder="Просмотры (всего)" style="flex:1;min-width:110px">'+
    '</div>'+
    '<div class="v22-row" style="margin-top:10px"><button class="v22-btn sm" onclick="__v22growthAdd()">+ Записать замер</button>'+prefill+(g.length?'<button class="v22-btn ghost sm" onclick="__v22growthUndo()">Удалить последний</button>':'')+'</div>'+
  '</div>';
}
W.__v22growthAdd=function(){
  var s=+(qs('#v22gSubs')||{}).value, v=+(qs('#v22gViews')||{}).value;
  if(!s&&!v){toast('Введи подписчиков или просмотры','warn');return;}
  var g=growth();g.push({ts:Date.now(),subs:s||0,views:v||0});growthSave(g);toast('Замер записан','ok');render();
};
W.__v22growthFromChannel=function(){var ch=st().channel||{};if(ch.subs==null&&ch.totalViews==null){toast('Сначала проанализируй канал','warn');return;}var g=growth();g.push({ts:Date.now(),subs:ch.subs||0,views:ch.totalViews||0});growthSave(g);toast('Замер из канала добавлен','ok');render();};
W.__v22growthUndo=function(){var g=growth();g.pop();growthSave(g);render();};
function drawGrowthChart(){
  var cv=qs('#v22GrowthCv');if(!cv||typeof W.Chart==='undefined')return;
  var g=growth();if(!g.length)return;
  var labels=g.map(function(x){return new Date(x.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});});
  try{if(_gChart){_gChart.destroy();_gChart=null;}}catch(e){}
  try{
    _gChart=new W.Chart(cv.getContext('2d'),{type:'line',
      data:{labels:labels,datasets:[
        {label:'Подписчики',data:g.map(function(x){return x.subs;}),borderColor:'#ff5a78',backgroundColor:'rgba(255,90,120,.12)',tension:.3,fill:true,yAxisID:'y',pointRadius:3},
        {label:'Просмотры',data:g.map(function(x){return x.views;}),borderColor:'#36c2ff',backgroundColor:'rgba(54,194,255,.10)',tension:.3,fill:true,yAxisID:'y1',pointRadius:3}
      ]},
      options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        plugins:{legend:{labels:{color:'#a6a4af',boxWidth:12,font:{size:11}}}},
        scales:{
          x:{ticks:{color:'#827581',font:{size:10}},grid:{color:'rgba(255,255,255,.05)'}},
          y:{position:'left',ticks:{color:'#ff8fa3',font:{size:10},callback:function(v){return fmtN(v);}},grid:{color:'rgba(255,255,255,.05)'}},
          y1:{position:'right',ticks:{color:'#7fc8ff',font:{size:10},callback:function(v){return fmtN(v);}},grid:{drawOnChartArea:false}}
        }}});
  }catch(e){}
}

/* ---- B3 канбан ---- */
var KB_COLS=[{k:'idea',h:'💡 Идея'},{k:'script',h:'📝 Сценарий'},{k:'shot',h:'🎬 Снято'},{k:'pub',h:'✅ Опубликовано'}];
function shootStage(s){
  if(s.st2)return s.st2;
  if(s.status==='pub')return 'pub';
  if(s.status==='shot')return 'shot';
  return 'idea';
}
function shootText(s){var d=s.d||{};return d.idea||d.title||(Array.isArray(d.title_ideas)&&d.title_ideas[0])||'Идея ролика';}
function cardKanban(){
  var sh=shootsLoad();
  var byCol={idea:[],script:[],shot:[],pub:[]};
  sh.forEach(function(s){var stg=shootStage(s);(byCol[stg]||byCol.idea).push(s);});
  var cols=KB_COLS.map(function(c,ci){
    var items=byCol[c.k];
    var list=items.length?items.map(function(s){
      var idx=KB_COLS.map(function(x){return x.k;}).indexOf(shootStage(s));
      var date=new Date(s.created||Date.now()).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
      return '<div class="v22-kb-card"><div class="txt">'+esc(String(shootText(s)).slice(0,120))+'</div>'+
        '<div class="v22-kb-meta">'+date+(s.chTitle?' · '+esc(String(s.chTitle).slice(0,18)):'')+'</div>'+
        '<div class="v22-kb-mv">'+
          '<button onclick="__v22kbMove(\''+s.id+'\',-1)" '+(idx<=0?'disabled':'')+' title="Назад">◀</button>'+
          '<button onclick="__v22kbMove(\''+s.id+'\',1)" '+(idx>=3?'disabled':'')+' title="Дальше">▶</button>'+
          '<button class="del" onclick="__v22kbDel(\''+s.id+'\')" title="Удалить">✕</button>'+
        '</div></div>';
    }).join(''):'<div class="v22-kb-empty">—</div>';
    return '<div class="v22-kb-col"><div class="v22-kb-h">'+c.h+'<span class="cnt">'+items.length+'</span></div><div class="v22-kb-list">'+list+'</div></div>';
  }).join('');
  return '<div class="v22-card wide">'+
    '<div class="v22-ct">🗂 Продакшн-доска</div>'+
    '<div class="v22-cd">Веди ролик по этапам: идея → сценарий → снято → опубликовано. Карточки общие с «Моими съёмками». Перевод в «Опубликовано» засчитывается в стрик.</div>'+
    '<div class="v22-kb-cols">'+cols+'</div>'+
    '<div class="v22-kb-add"><input class="v22-input" id="v22kbInput" placeholder="Новая идея ролика — заголовок или тема" onkeydown="if(event.key===\'Enter\')__v22kbAdd()"><button class="v22-btn sm" onclick="__v22kbAdd()">+ Добавить идею</button></div>'+
  '</div>';
}
function syncLegacyStatus(s){var stg=s.st2;if(stg==='pub')s.status='pub';else if(stg==='shot')s.status='shot';else s.status='plan';}
W.__v22kbAdd=function(){
  var inp=qs('#v22kbInput');if(!inp)return;var v=(inp.value||'').trim();if(!v){inp.focus();return;}
  var sh=shootsLoad();var ch=st().channel||{};
  sh.unshift({id:'s'+Date.now()+Math.floor(Math.random()*999),chId:ch.id||'',chTitle:ch.title||'',created:Date.now(),status:'plan',st2:'idea',checks:{},d:{idea:v}});
  shootsSave(sh);inp.value='';toast('Идея добавлена на доску','ok');render();
};
W.__v22kbMove=function(id,dir){
  var sh=shootsLoad();var s=sh.filter(function(x){return x.id===id;})[0];if(!s)return;
  var order=['idea','script','shot','pub'];var idx=order.indexOf(shootStage(s));var ni=Math.max(0,Math.min(3,idx+dir));
  var was=order[idx];s.st2=order[ni];syncLegacyStatus(s);shootsSave(sh);
  if(s.st2==='pub'&&was!=='pub'){pubLogAdd({src:'kanban',shootId:id});achvSync();toast('🎉 Ролик опубликован — засчитано в стрик!','ok');}
  render();
};
W.__v22kbDel=function(id){var sh=shootsLoad().filter(function(x){return x.id!==id;});shootsSave(sh);render();};

/* ---- B4 ---- */
function cardAchv(){
  var unlocked=achvStore();var li=levelInfo();
  var nextTx='';if(li.next){var need=li.next.min-li.xp;nextTx='До «'+li.next.n+'»: '+Math.max(0,need)+' XP';}else nextTx='Максимальный уровень 👑';
  var pctNext=li.next?Math.min(100,Math.round((li.xp-li.lv.min)/(li.next.min-li.lv.min)*100)):100;
  var grid=ACHV.map(function(a){var on=!!unlocked[a.id];return '<div class="v22-ach '+(on?'on':'lock')+'"><div class="ic">'+a.ic+'</div><b>'+esc(a.n)+'</b><small>'+esc(a.d)+'</small></div>';}).join('');
  return '<div class="v22-card wide">'+
    '<div class="v22-ct">🏆 Ачивки и уровень продюсера</div>'+
    '<div class="v22-lvl"><div class="v22-lvl-badge">'+li.lv.ic+'</div>'+
      '<div class="v22-lvl-tx" style="flex:1;min-width:160px"><b>'+esc(li.lv.n)+'</b><small>'+li.xp+' XP · '+nextTx+'</small>'+
        '<div class="v22-xp"><div class="v22-bar"><i style="width:'+pctNext+'%"></i></div></div>'+
      '</div></div>'+
    '<div class="v22-ach-grid">'+grid+'</div>'+
  '</div>';
}

/* ====================  A1 — поток «Первый ролик за 10 минут»  ==================== */
var FLOW={step:0,niche:'',ideas:[],pick:null,script:null,pack:null};
var NICHES=['Финансы и инвестиции','Технологии и AI','Игры','Образование','Лайфстайл','Спорт и фитнес','Кулинария','Бьюти и мода','Бизнес','Психология','DIY и хобби','Авто'];
function flowOv(){
  var ov=qs('#v22FlowOv');
  if(!ov){
    ov=D.createElement('div');ov.id='v22FlowOv';
    ov.innerHTML='<div id="v22Flow">'+
      '<div class="v22-fl-top"><span class="t">🎬 Первый ролик за 10 минут</span><button class="v22-fl-x" onclick="__v22flowClose()">×</button></div>'+
      '<div class="v22-steps" id="v22FlSteps"></div>'+
      '<div class="v22-fl-body" id="v22FlBody"></div>'+
      '<div class="v22-fl-foot" id="v22FlFoot"></div>'+
    '</div>';
    D.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov)flowClose();});
  }
  return ov;
}
function flowOpen(){var pn='';try{pn=(profGet().niche||'').toString();}catch(e){}FLOW={step:0,niche:pn,ideas:[],pick:null,script:null,pack:null};flowOv().classList.add('show');flowRender();}
function flowClose(){var ov=qs('#v22FlowOv');if(ov)ov.classList.remove('show');}
W.__v22flowOpen=flowOpen;W.__v22flowClose=flowClose;
function flowSteps(){var s=qs('#v22FlSteps');if(!s)return;var h='';for(var i=0;i<5;i++)h+='<i class="'+(i<=FLOW.step?'on':'')+'"></i>';s.innerHTML=h;}
function flowFoot(html){var f=qs('#v22FlFoot');if(f)f.innerHTML=html;}
function flowBody(html){var b=qs('#v22FlBody');if(b)b.innerHTML=html;}
function flowRender(){
  flowSteps();
  if(FLOW.step===0)flowNiche();
  else if(FLOW.step===1)flowIdeas();
  else if(FLOW.step===2)flowScript();
  else if(FLOW.step===3)flowPack();
  else if(FLOW.step===4)flowChecklist();
}
/* step 0: niche */
function flowNiche(){
  flowBody('<div class="v22-fl-h">Шаг 1 · Выбери нишу</div>'+
    '<div class="v22-fl-sub">С чего твой канал? Можно выбрать из популярных или вписать свою тему — чем уже, тем точнее идеи.</div>'+
    '<input class="v22-input" id="v22flNiche" placeholder="например: монтаж в CapCut для новичков" value="'+esc(FLOW.niche)+'">'+
    '<div class="v22-chips">'+NICHES.map(function(n){return '<span class="v22-chip" onclick="__v22flPickNiche(this)">'+esc(n)+'</span>';}).join('')+'</div>');
  flowFoot('<span class="sp"></span><button class="v22-btn" onclick="__v22flNext()">Найти идеи →</button>');
}
W.__v22flPickNiche=function(el){var i=qs('#v22flNiche');if(i)i.value=el.textContent;};
W.__v22flNext=function(){
  if(FLOW.step===0){var i=qs('#v22flNiche');var v=i?(i.value||'').trim():'';if(!v){if(i)i.focus();return;}FLOW.niche=v;FLOW.step=1;flowRender();genIdeas();}
};
/* step 1: ideas */
function flowIdeas(){
  flowBody('<div class="v22-fl-h">Шаг 2 · Выбери идею</div><div class="v22-fl-sub">Три идеи под нишу «'+esc(FLOW.niche)+'». Выбери ту, что зажигает — под неё соберём сценарий.</div><div id="v22flIdeas"><div class="v22-load"><span class="v22-spin"></span>Подбираю идеи…</div></div>');
  flowFoot('<button class="v22-btn ghost" onclick="__v22flBack()">← Назад</button><span class="sp"></span><button class="v22-btn" id="v22flIdeasNext" disabled onclick="__v22flNextIdea()">Дальше →</button>');
}
function ideasFallback(n){return [
  {title:'«'+n+'» с нуля: первое видео за один вечер',format:'long',why:'Низкий порог входа — обещает быстрый результат новичку'},
  {title:'5 ошибок новичка в теме «'+n+'» (и как их избежать)',format:'long',why:'Формат ошибок цепляет — зритель боится их повторить'},
  {title:n+': что я понял за 30 дней',format:'short',why:'Личный опыт + конкретный срок = доверие и интрига'}
];}
function renderIdeas(){
  var box=qs('#v22flIdeas');if(!box)return;
  box.innerHTML=FLOW.ideas.map(function(it,i){return '<div class="v22-pick'+(FLOW.pick===i?' sel':'')+'" onclick="__v22flPickIdea('+i+')"><div class="pt">'+esc(it.title)+'</div><div class="pm">'+esc(it.why||'')+'</div><span class="pf">'+(it.format==='short'?'⚡ Shorts':'🎬 Длинный')+'</span></div>';}).join('');
}
W.__v22flPickIdea=function(i){FLOW.pick=i;renderIdeas();var b=qs('#v22flIdeasNext');if(b)b.disabled=false;};
function genIdeas(){
  var sys='Ты — продюсер YouTube, запускаешь новичка с нуля. Придумай 3 идеи ПЕРВОГО ролика под нишу. Лёгкие для съёмки, но цепляющие. Заголовки по ВИСП. Верни СТРОГО валидный JSON без markdown: {"ideas":[{"title":"кликабельный заголовок","format":"long|short","why":"почему хороший первый ролик, до 12 слов"}]}. Ровно 3 идеи. По-русски.';
  aiCall(sys,'Ниша: "'+FLOW.niche+'". Дай 3 идеи первого ролика.',900).then(function(a){
    var ideas=(a&&Array.isArray(a.ideas))?a.ideas.filter(function(x){return x&&x.title;}):null;
    FLOW.ideas=(ideas&&ideas.length)?ideas.slice(0,3):ideasFallback(FLOW.niche);
    if(FLOW.step===1)renderIdeas();
  });
}
W.__v22flNextIdea=function(){if(FLOW.pick==null)return;FLOW.step=2;flowRender();genScript();};
W.__v22flBack=function(){if(FLOW.step>0){FLOW.step--;flowRender();}};
/* step 2: script */
function flowScript(){
  var idea=FLOW.ideas[FLOW.pick]||{};
  flowBody('<div class="v22-fl-h">Шаг 3 · Сценарий</div><div class="v22-fl-sub">«'+esc(idea.title)+'»</div><div id="v22flScript"><div class="v22-load"><span class="v22-spin"></span>Пишу сценарий…</div></div>');
  flowFoot('<button class="v22-btn ghost" onclick="__v22flBack()">← Назад</button><span class="sp"></span><button class="v22-btn" id="v22flScNext" disabled onclick="__v22flToPack()">К упаковке →</button>');
}
function scriptFallback(idea){return {
  hook:'Первые 10 секунд: сразу покажи результат или задай острый вопрос по теме — без долгого приветствия.',
  beats:['Проблема: с чем сталкивается новичок','Решение по шагам — 3 конкретных действия','Частая ошибка и как её избежать','Быстрый итог + что делать прямо сейчас'],
  cta:'Призыв: «Если было полезно — подпишись, в следующем ролике разберём…» и назови конкретную тему.'
};}
function renderScript(){
  var d=FLOW.script||{};var box=qs('#v22flScript');if(!box)return;
  var beats=(Array.isArray(d.beats)?d.beats:[]).map(function(b){return '<li>'+esc(b)+'</li>';}).join('');
  box.innerHTML='<div class="v22-block"><h5>🪝 Хук (первые 15 сек)</h5><div class="bd">'+esc(d.hook||'')+'</div></div>'+
    '<div class="v22-block"><h5>🎬 Структура</h5><ul>'+beats+'</ul></div>'+
    '<div class="v22-block"><h5>📣 Призыв в конце</h5><div class="bd">'+esc(d.cta||'')+'</div></div>';
}
function genScript(){
  var idea=FLOW.ideas[FLOW.pick]||{};
  var sys='Ты — сценарист YouTube. Напиши простой сценарий первого ролика новичка. Верни СТРОГО валидный JSON без markdown: {"hook":"текст хука на первые 15 секунд","beats":["4-5 смысловых блоков, каждый с действия"],"cta":"призыв в конце"}. По-русски, конкретно, без воды.';
  aiCall(sys,'Ниша: "'+FLOW.niche+'". Ролик: "'+idea.title+'" ('+(idea.format==='short'?'Shorts':'длинный')+').',1100).then(function(a){
    FLOW.script=(a&&(a.hook||a.beats))?a:scriptFallback(idea);
    if(FLOW.step===2){renderScript();var b=qs('#v22flScNext');if(b)b.disabled=false;}
  });
}
W.__v22flToPack=function(){FLOW.step=3;flowRender();genPack();};
/* step 3: packaging */
function flowPack(){
  flowBody('<div class="v22-fl-h">Шаг 4 · Упаковка</div><div class="v22-fl-sub">Заголовки и превью — то, на что кликают в ленте.</div><div id="v22flPack"><div class="v22-load"><span class="v22-spin"></span>Собираю упаковку…</div></div>');
  flowFoot('<button class="v22-btn ghost" onclick="__v22flBack()">← Назад</button><span class="sp"></span><button class="v22-btn" id="v22flPackNext" disabled onclick="__v22flToCheck()">Чек-лист →</button>');
}
function packFallback(idea){return {titles:[idea.title,'Как начать в теме «'+FLOW.niche+'» — пошагово','«'+FLOW.niche+'»: с нуля до первого результата'],thumb:{text:'С НУЛЯ',concept:'Крупное лицо с эмоцией удивления + 2-3 слова огромным контрастным шрифтом'}};}
function renderPack(){
  var d=FLOW.pack||{};var box=qs('#v22flPack');if(!box)return;
  var titles=(Array.isArray(d.titles)?d.titles:[]).map(function(t){return '<li>'+esc(typeof t==='string'?t:(t&&t.title)||'')+'</li>';}).join('');
  var thumb=d.thumb||{};
  box.innerHTML='<div class="v22-block"><h5>🎯 Варианты заголовка</h5><ul>'+titles+'</ul></div>'+
    '<div class="v22-block"><h5>🖼 Превью</h5><div class="bd"><b>Текст на превью:</b> '+esc(thumb.text||'')+'\n'+esc(thumb.concept||thumb.frame||'')+'</div></div>';
}
function genPack(){
  var idea=FLOW.ideas[FLOW.pick]||{};
  var sys='Ты — продюсер по упаковке YouTube. Собери упаковку первого ролика. Верни СТРОГО валидный JSON без markdown: {"titles":["3 кликабельных заголовка 40-65 символов"],"thumb":{"text":"2-4 слова огромным шрифтом на превью","concept":"что в кадре и эмоция"}}. По-русски.';
  aiCall(sys,'Ниша: "'+FLOW.niche+'". Ролик: "'+idea.title+'".',900).then(function(a){
    FLOW.pack=(a&&(a.titles||a.thumb))?a:packFallback(idea);
    if(FLOW.step===3){renderPack();var b=qs('#v22flPackNext');if(b)b.disabled=false;}
  });
}
W.__v22flToCheck=function(){FLOW.step=4;flowRender();};
/* step 4: checklist */
var PUB_CHECK=['Заголовок цепляет и есть выгода/интрига','Превью читается с телефона (крупный текст, эмоция)','Первые 15 секунд = хук без долгого интро','Заполнено описание и 5-10 тегов','Добавлены субтитры / подписи','В конце — призыв подписаться и анонс следующего ролика'];
function flowChecklist(){
  var idea=FLOW.ideas[FLOW.pick]||{};
  flowBody('<div class="v22-fl-h">Шаг 5 · Чек-лист публикации</div><div class="v22-fl-sub">Пройдись перед заливкой — и твой первый ролик готов выйти в свет 🎉</div>'+
    '<div class="v22-checklist">'+PUB_CHECK.map(function(c,i){return '<label><input type="checkbox" id="v22pc'+i+'"> '+esc(c)+'</label>';}).join('')+'</div>'+
    '<div class="v22-block" style="margin-top:14px"><h5>📦 Что у тебя есть</h5><div class="bd"><b>Ролик:</b> '+esc(idea.title)+'\n<b>Формат:</b> '+(idea.format==='short'?'Shorts':'длинный')+'</div></div>');
  flowFoot('<button class="v22-btn ghost" onclick="__v22flBack()">← Назад</button><span class="sp"></span><button class="v22-btn" onclick="__v22flFinish()">Сохранить как съёмку ✓</button>');
}
W.__v22flFinish=function(){
  var idea=FLOW.ideas[FLOW.pick]||{};
  var sh=shootsLoad();var ch=st().channel||{};
  var d={idea:idea.title,title:idea.title,format:idea.format,niche:FLOW.niche,
    script:FLOW.script||null,pack:FLOW.pack||null,checklist:PUB_CHECK,
    title_ideas:(FLOW.pack&&Array.isArray(FLOW.pack.titles))?FLOW.pack.titles:[idea.title]};
  sh.unshift({id:'s'+Date.now()+Math.floor(Math.random()*999),chId:ch.id||'',chTitle:ch.title||'',created:Date.now(),status:'plan',st2:'script',checks:{},d:d});
  shootsSave(sh);
  ls('flow_done',1);achvSync();
  flowClose();
  _tab='start';ls('tab','start');
  toast('🎬 Готово! Ролик сохранён в «Продакшн-доску» (этап «Сценарий»).','ok');
  render();
  try{var hub=qs('#v22Hub');if(hub)hub.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}
};

/* ====================  BOOT  ==================== */
function boot(){
  try{render();}catch(e){try{console.error('[v22] render',e);}catch(_){}}
  /* перемонтирование, если hero перерисовался или recentPanel пересоздался */
  try{
    var hero=qs('#hero');
    if(hero){var mo=new MutationObserver(function(){if(!qs('#v22Hub')){try{render();}catch(e){}}});mo.observe(hero,{childList:true});}
  }catch(e){}
  setInterval(function(){if(!qs('#v22Hub')){try{render();}catch(e){}}},2500);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
W.__v22={render:render,setTab:setTab,flowOpen:flowOpen,pubTotal:pubTotal,weekStreak:weekStreak};
})();
