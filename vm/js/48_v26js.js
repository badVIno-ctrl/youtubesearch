/* VIORA v26 — самодостаточный модуль. Все обращения к чужим функциям через feature-detection. */
(function(){
'use strict';
if(window.__v26)return;window.__v26=true;
var D=document,W=window;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return [].slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function toast(m,k){try{if(W.vToast){W.vToast(m,k||'ok');return;}if(W.toast){W.toast(m);return;}}catch(e){}}
function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a);},ms);};}
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function fmt(n){try{if(W.fmt)return W.fmt(n);}catch(e){}n=+n||0;var a=Math.abs(n);return a>=1e6?(n/1e6).toFixed(1)+'M':a>=1e3?(n/1e3).toFixed(1)+'K':String(Math.round(n));}
function aiRaw(sys,user,max){
  if(typeof W.callMistralRaw!=='function')return Promise.reject(new Error('AI offline'));
  return Promise.resolve(W.callMistralRaw(sys,user,max||1400)).then(function(r){
    if(typeof r==='string'){try{return JSON.parse(r);}catch(e){var m=r.match(/[\[{][\s\S]*[\]}]/);if(m){try{return JSON.parse(m[0]);}catch(e2){}}return null;}}
    return r;
  });
}

/* =====================================================================
   1. ЖИВЫЕ ПОДСКАЗКИ (autocomplete) — единый компонент v26ac
   ===================================================================== */
var YTKEY=(typeof YOUTUBE_API_KEY!=='undefined'?YOUTUBE_API_KEY:(W.YOUTUBE_API_KEY||''));
var YTB=(typeof YT!=='undefined'?YT:'https://www.googleapis.com/youtube/v3');
var NICHES=['игры','прохождение игр','обзоры игр','мобильные игры','киберспорт','майнкрафт','роблокс',
'рецепты','готовлю дома','выпечка','быстрые рецепты','уличная еда','обзоры еды','что приготовить',
'фитнес','тренировки дома','похудение','йога','здоровье','питание','спорт','бег',
'финансы','инвестиции для новичков','криптовалюта','трейдинг','как заработать','бизнес','маркетинг','личные финансы',
'технологии','обзоры техники','обзоры смартфонов','гаджеты','искусственный интеллект','нейросети','программирование','python','веб-разработка',
'монтаж видео','монтаж в capcut','монтаж в premiere','съёмка на телефон','блогинг','как вести youtube','продвижение канала',
'путешествия','влоги','влог из путешествий','лайфхаки для дома','уборка','организация пространства','ремонт своими руками','дача','сад и огород','уход за растениями',
'психология','саморазвитие','мотивация','продуктивность','тайм-менеджмент','отношения','воспитание детей',
'автомобили','обзоры авто','ремонт авто','тюнинг',
'мода','стиль','уход за собой','макияж','причёски','уход за кожей',
'музыка','уроки гитары','музыкальные обзоры','битмейкинг',
'рисование','уроки рисования','хендмейд','рукоделие','вязание',
'история','наука','факты','документалки','образование','английский язык','обучение',
'рыбалка','охота','туризм','выживание','кемпинг',
'юмор','скетчи','реакции','челленджи','истории из жизни','страшные истории',
'животные','уход за питомцами','собаки','кошки','аквариум'];

function acCacheGet(key){var c=lget('viora_v26_acq',{});var e=c[key];if(e&&(Date.now()-e.ts<600000))return e.items;return null;}
function acCacheSet(key,items){var c=lget('viora_v26_acq',{});c[key]={ts:Date.now(),items:items};try{var ks=Object.keys(c);if(ks.length>40){ks.sort(function(a,b){return c[a].ts-c[b].ts;});delete c[ks[0]];}}catch(e){}lset('viora_v26_acq',c);}

function fetchChannels(query){
  var key='ch:'+query.toLowerCase();var hit=acCacheGet(key);if(hit)return Promise.resolve(hit);
  if(!YTKEY)return Promise.resolve([]);
  var url=YTB+'/search?part=snippet&type=channel&maxResults=6&q='+encodeURIComponent(query)+'&key='+YTKEY;
  return fetch(url).then(function(r){return r.ok?r.json():null;}).then(function(d){
    var items=((d&&d.items)||[]).map(function(it){
      var sn=it.snippet||{};var th=(sn.thumbnails&&(sn.thumbnails.default||sn.thumbnails.medium))||{};
      var cid=(it.id&&it.id.channelId)||sn.channelId||'';
      return {title:sn.title||sn.channelTitle||'',desc:(sn.description||'').slice(0,60),thumb:th.url||'',val:cid?('https://www.youtube.com/channel/'+cid):''};
    }).filter(function(x){return x.val;});
    acCacheSet(key,items);return items;
  }).catch(function(){return [];});
}

function localTopics(query){
  var ql=query.toLowerCase().trim();if(!ql)return [];
  var starts=[],words=[],contains=[];
  NICHES.forEach(function(n){var nl=n.toLowerCase();if(nl.indexOf(ql)===0){starts.push(n);return;}var ws=nl.split(/[\s,\-]+/);if(ws.some(function(x){return x.indexOf(ql)===0;})){words.push(n);}else if(ql.length>=4&&nl.indexOf(ql)>=0){contains.push(n);}});
  return starts.concat(words,contains).slice(0,7).map(function(t){return {title:t,kind:'local'};});
}
var aiTopicCache={};
function fetchAiTopics(query){
  var ql=query.toLowerCase().trim();if(ql.length<4)return Promise.resolve([]);
  if(aiTopicCache[ql])return Promise.resolve(aiTopicCache[ql]);
  if(typeof W.callMistralRaw!=='function')return Promise.resolve([]);
  var sys='Ты помогаешь выбрать узкую тему/нишу для YouTube. Верни СТРОГО валидный JSON: {"topics":["..."]}. Дай 5 коротких конкретных уточнений ниши пользователя (2-4 слова каждое), которые реально ищут на YouTube. Без пояснений. По-русски.';
  return aiRaw(sys,'Ввод пользователя: '+query,400).then(function(r){
    var t=((r&&r.topics)||[]).filter(function(x){return typeof x==='string'&&x.trim();}).slice(0,5).map(function(x){return {title:x.trim(),kind:'ai'};});
    aiTopicCache[ql]=t;return t;
  }).catch(function(){return [];});
}

function AC(input,kind){
  var box=D.createElement('div');box.className='v26-ac';D.body.appendChild(box);
  var items=[],sel=-1,open=false,lastQ='';
  function place(){var r=input.getBoundingClientRect();box.style.left=r.left+'px';box.style.top=(r.bottom+6)+'px';box.style.width=r.width+'px';}
  function hide(){open=false;box.classList.remove('on');}
  function show(){if(!items.length){hide();return;}place();open=true;box.classList.add('on');}
  function hl(t,query){try{var i=t.toLowerCase().indexOf(query.toLowerCase());if(i<0)return esc(t);return esc(t.slice(0,i))+'<b>'+esc(t.slice(i,i+query.length))+'</b>'+esc(t.slice(i+query.length));}catch(e){return esc(t);}}
  function render(query,loadingMore){
    var html='';
    if(kind==='channel'){
      html+='<div class="v26-ac-head">📺 Каналы YouTube</div>';
      html+=items.map(function(it,i){return '<div class="v26-ac-it'+(i===sel?' sel':'')+'" data-i="'+i+'"><span class="v26-ac-av">'+(it.thumb?'<img src="'+esc(it.thumb)+'">':'📺')+'</span><span class="v26-ac-m"><span class="v26-ac-t">'+hl(it.title,query)+'</span>'+(it.desc?'<span class="v26-ac-s">'+esc(it.desc)+'</span>':'')+'</span></div>';}).join('');
    }else{
      html+='<div class="v26-ac-head">🔍 Подсказки тем</div>';
      html+=items.map(function(it,i){return '<div class="v26-ac-it'+(i===sel?' sel':'')+'" data-i="'+i+'"><span class="v26-ac-av">'+(it.kind==='ai'?'✨':'🎯')+'</span><span class="v26-ac-m"><span class="v26-ac-t">'+hl(it.title,query)+'</span></span>'+(it.kind==='ai'?'<span class="v26-ac-tag">AI</span>':'')+'</div>';}).join('');
    }
    if(loadingMore)html+='<div class="v26-ac-load"><span class="v26-ac-sp"></span>Виора ищет ещё варианты…</div>';
    box.innerHTML=html;
    qa('.v26-ac-it',box).forEach(function(el){el.addEventListener('mousedown',function(ev){ev.preventDefault();pick(+el.getAttribute('data-i'));});el.addEventListener('mouseenter',function(){sel=+el.getAttribute('data-i');markSel();});});
    qa('.v26-ac-av img',box).forEach(function(im){im.addEventListener('error',function(){im.parentNode.textContent='📺';});});
    show();
  }
  function markSel(){qa('.v26-ac-it',box).forEach(function(el,i){el.classList.toggle('sel',i===sel);});}
  function pick(i){var it=items[i];if(!it)return;input.value=it.val||it.title;try{input.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}hide();input.focus();}
  var runChannel=debounce(function(qv){fetchChannels(qv).then(function(res){if(input.value.trim()!==qv)return;items=res;sel=-1;render(qv,false);});},350);
  var runAi=debounce(function(qv){fetchAiTopics(qv).then(function(extra){if(input.value.trim()!==qv||!extra.length)return;var seen={};items.forEach(function(x){seen[x.title.toLowerCase()]=1;});extra.forEach(function(x){if(!seen[x.title.toLowerCase()])items.push(x);});render(qv,false);});},750);
  function onInput(){
    var qv=input.value.trim();lastQ=qv;
    if(qv.length<2){hide();return;}
    if(kind==='channel'){
      if(/^https?:\/\//i.test(qv)&&/youtube\.com|youtu\.be/i.test(qv)){hide();return;}
      items=[];render(qv,true);runChannel(qv);
    }else{
      items=localTopics(qv);render(qv,qv.length>=4);if(qv.length>=4)runAi(qv);
    }
  }
  input.addEventListener('input',onInput);
  input.addEventListener('focus',function(){if(input.value.trim().length>=2)onInput();});
  input.addEventListener('keydown',function(e){
    if(!open)return;
    if(e.key==='ArrowDown'){e.preventDefault();sel=(sel+1)%items.length;markSel();}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=(sel-1+items.length)%items.length;markSel();}
    else if(e.key==='Enter'){if(sel>=0){e.preventDefault();pick(sel);}}
    else if(e.key==='Escape'){hide();}
  });
  input.addEventListener('blur',function(){setTimeout(hide,150);});
  W.addEventListener('scroll',function(){if(open)place();},true);
  W.addEventListener('resize',function(){if(open)place();});
}
function wire(input,kind){if(!input||input.__v26ac)return;input.__v26ac=1;try{input.setAttribute('autocomplete','off');new AC(input,kind);}catch(e){}}
function scanInputs(){wire(q('#urlInput'),'channel');wire(q('#ideaInput'),'topic');wire(q('#v25niche'),'topic');}
D.addEventListener('focusin',function(e){try{var t=e.target;if(!t||!t.id)return;if(t.id==='urlInput')wire(t,'channel');else if(t.id==='ideaInput'||t.id==='v25niche')wire(t,'topic');}catch(err){}});

/* =====================================================================
   2. ЭТАПНАЯ АНИМАЦИЯ ЗАГРУЗКИ
   ===================================================================== */
W.v26Loader=(function(){
  var stages=[],idx=0,timer=null;
  function host(){var L=q('#loading');if(!L)return null;var el=q('#v26steps',L);if(!el){el=D.createElement('div');el.id='v26steps';el.className='v26-steps';L.appendChild(el);}return el;}
  function render(){var el=host();if(!el)return;el.innerHTML=stages.map(function(s,i){var st=i<idx?'done':(i===idx?'cur':'');return '<div class="v26-step '+st+'"><span class="v26-sdot">'+(i<idx?'✓':'')+'</span><span class="v26-stx">'+esc(s)+'</span></div>';}).join('');}
  function start(list){stages=(list&&list.length)?list:['Готовлю данные','Анализирую','Собираю отчёт'];idx=0;render();clearInterval(timer);timer=setInterval(function(){if(idx<stages.length-1){idx++;render();}else{clearInterval(timer);}},2600);}
  function done(){clearInterval(timer);idx=stages.length;render();var el=q('#v26steps');if(el)setTimeout(function(){try{el.remove();}catch(e){}},400);}
  return {start:start,done:done};
})();
function wrapFn(name,before,after){var o=W[name];if(typeof o!=='function')return;W[name]=function(){if(before)try{before();}catch(e){}var r=o.apply(this,arguments);if(after)try{after();}catch(e){}return r;};}
function hookLoader(){
  return; /* v-cleanup #2: отключён дублирующий лоадер v26 — оставлен единый поэтапный лоадер (#loading/renderSteps) без наложения цветов */
  wrapFn('startAnalysis',function(){W.v26Loader.start(['Нахожу канал на YouTube','Загружаю ролики и метрики','Считаю выбросы и удержание','Виора пишет разбор и план роста']);});
  wrapFn('startIdeaSearch',function(){W.v26Loader.start(['Ищу ролики по теме','Сравниваю с медианой каналов','Отбираю настоящие выбросы','Готовлю идеи под тебя']);});
  wrapFn('renderDashboard',null,function(){W.v26Loader.done();});
  wrapFn('renderOutliers',null,function(){W.v26Loader.done();});
}

/* =====================================================================
   3. ПЕРЕОБУЧЕНИЕ МОЗГА — контекст, калибровка, фильтр воды, фидбэк
   ===================================================================== */
var FB_KEY='viora_fb_v1';
function feedbackNotes(){
  try{var fb=lget(FB_KEY,[])||[];var down=fb.filter(function(x){return x&&x.vote===-1&&x.note;}).slice(0,3).map(function(x){return x.note;});return down;}catch(e){return [];}
}
W.v26ctx=function(){
  try{
    var s=S(),c=s.channel||{},ai=s.ai||{},sig=s.signals||{};var L=[];
    if(c.title)L.push('Канал: '+c.title+(c.handle?(' '+c.handle):''));
    if(c.subs!=null)L.push('Подписчиков: '+c.subs);
    if(s.primaryNiche)L.push('Ниша: '+s.primaryNiche);
    try{var all=[].concat(s.shorts||[],s.longs||[]);if(all.length){var v=all.map(function(x){return x.viewsPerDay||0;}).sort(function(a,b){return a-b;});L.push('Медиана просмотров/день: '+Math.round(v[Math.floor(v.length/2)]||0));}}catch(e){}
    if(ai.main_leak)L.push('Главная утечка роста: '+ai.main_leak);
    if(ai.hit_formula&&ai.hit_formula.length)L.push('Что залетает: '+ai.hit_formula.slice(0,2).join('; '));
    if(sig.bestWindow&&sig.bestWindow.day)L.push('Лучшее окно публикации: '+sig.bestWindow.day+' '+(sig.bestWindow.hourRange||''));
    if(sig.durationSweetSpot&&sig.durationSweetSpot.best)L.push('Лучшая длина роликов: '+sig.durationSweetSpot.best);
    try{var tp=(s.topics||[]).slice(0,4).map(function(t){return t.name+' ('+Math.round(t.medVpd||0)+'/день)';});if(tp.length)L.push('Рубрики: '+tp.join('; '));}catch(e){}
    try{var cmp=(s.competitors||[]).slice(0,3).map(function(x){return (x.ch&&x.ch.title)||x.title||'';}).filter(Boolean);if(cmp.length)L.push('Конкуренты: '+cmp.join(', '));}catch(e){}
    if(sig.uploadMomentum)L.push('Динамика (90 дн): '+(sig.uploadMomentum.deltaPct>=0?'+':'')+sig.uploadMomentum.deltaPct+'% к просмотрам');
    try{var p=lget('viora_profile_v1',null);if(p){if(p.level)L.push('Автор: '+(p.level==='pro'?'опытный':'новичок'));if(p.goalLabel||p.goal)L.push('Цель: '+(p.goalLabel||p.goal));}}catch(e){}
    var fn=feedbackNotes();if(fn.length)L.push('Автор отвергал советы как слабые: '+fn.join('; ')+' — не повторяй такие общие фразы.');
    return L.join('\n');
  }catch(e){return '';}
};
var V26_CALIB='\n\nПРАВИЛА КАЧЕСТВА (обязательно): каждый пункт привязывай к конкретной цифре канала и/или названию ролика и давай ГОТОВУЮ формулировку (заголовок/действие), а не общий принцип. ЗАПРЕЩЕНЫ общие фразы без конкретики: «снимай регулярнее», «улучши заголовки», «делай качественный контент», «взаимодействуй с аудиторией», «анализируй канал». Если данных не хватает — честно скажи об этом, не выдумывай цифры.';
function isReco(sys){try{return /продюсер|рекоменд|совет|план|next_video|action_plan|идеи|идею|заголов|сценар|стратег|рост|утечк|воронк|разбор|аудитор/i.test(String(sys||''));}catch(e){return false;}}
W.vScrub=W.vScrub||function(data){
  try{
    var BAD=/^\s*(снимай(те)?\s+регулярнее|улучш(и|ите|айте)?\s+заголовк|делай(те)?\s+(более\s+)?качествен|будь(те)?\s+активнее|взаимодействуй(те)?\s+с\s+аудитор|анализируй(те)?\s+(свой\s+)?канал|изучи(те)?\s|посмотри(те)?\s|продолжай(те)?\s+в\s+том\s+же)/i;
    function bad(t){return typeof t==='string'&&BAD.test(t.trim());}
    function clean(x){if(typeof x==='string')return bad(x)?null:x;if(x&&typeof x==='object'){var t=x.text||x.step||x.title||x.idea||'';if(bad(t))return null;}return x;}
    if(Array.isArray(data)){var f=data.map(clean).filter(function(x){return x!=null;});return f.length?f:data;}
    return data;
  }catch(e){return data;}
};
function hookBrain(){
  var o=W.callMistralRaw;if(typeof o!=='function')return;if(o.__v26)return;
  var wrapped=function(sys,user,max){
    try{
      if(isReco(sys)){
        if(typeof sys==='string'&&sys.indexOf('ПРАВИЛА КАЧЕСТВА')<0)sys+=V26_CALIB;
        var ctx=W.v26ctx();
        if(ctx&&typeof user==='string'&&user.indexOf(ctx.slice(0,30))<0&&user.indexOf('Виора знает')<0)user=user+'\n\nКОНТЕКСТ КАНАЛА (Виора это уже знает, опирайся на цифры, не выдумывай):\n'+ctx;
      }
    }catch(e){}
    return o.call(this,sys,user,max);
  };
  wrapped.__v26=true;W.callMistralRaw=wrapped;
}

/* =====================================================================
   4. ПРОДЮСЕР-ХАБ — календарь, авто-разбор недели, ролик под ключ, конкуренты
   ===================================================================== */
function hubEl(){
  var h=q('#v26hub');if(h)return h;
  h=D.createElement('div');h.id='v26hub';
  h.innerHTML='<div class="v26-card"><div class="v26-h"><div class="ic">🎬</div><div><div class="tt">Виора-Продюсер<small>план, разбор и ролики под ключ — на основе данных твоего канала</small></div></div><button class="x" onclick="v26HubClose()">×</button></div>'+
    '<div class="v26-tabs"><button class="v26-tab on" data-t="cal">📅 Контент-план</button><button class="v26-tab" data-t="week">🗓 Разбор недели</button><button class="v26-tab" data-t="turnkey">🎥 Ролик под ключ</button><button class="v26-tab" data-t="rivals">📡 Перехват трендов</button></div>'+
    '<div class="v26-body" id="v26body"></div></div>';
  h.addEventListener('click',function(e){if(e.target===h)hide();});
  D.body.appendChild(h);
  qa('.v26-tab',h).forEach(function(b){b.addEventListener('click',function(){qa('.v26-tab',h).forEach(function(x){x.classList.remove('on');});b.classList.add('on');renderTab(b.getAttribute('data-t'));});});
  return h;
}
function show(){hubEl().classList.add('on');try{D.body.style.overflow='hidden';}catch(e){}renderTab('cal');}
function hide(){var h=q('#v26hub');if(h)h.classList.remove('on');try{D.body.style.overflow='';}catch(e){}}
W.v26HubOpen=show;W.v26HubClose=hide;
function noChannel(body){if(!S().channel){body.innerHTML='<div class="v26-note">Сначала разбери свой канал на главном экране — тогда план, разбор и идеи будут опираться на твои реальные цифры.</div><button class="v26-btn" style="margin-top:12px" onclick="v26HubClose()">← На главную, разобрать канал</button>';return true;}return false;}

function renderTab(t){
  var body=q('#v26body');if(!body)return;
  if(t==='cal')return calTab(body);
  if(t==='week')return weekTab(body);
  if(t==='turnkey')return turnkeyTab(body);
  if(t==='rivals')return rivalsTab(body);
}

/* ---- Контент-план (4 недели) ---- */
var CAL_KEY='viora_v26_cal';
function calLoad(){var a=lget(CAL_KEY,[]);return Array.isArray(a)?a:[];}
function calSave(a){lset(CAL_KEY,a);}
function calTab(body){
  var items=calLoad();
  var weeks=[[],[],[],[]];items.forEach(function(it){var w=Math.max(1,Math.min(4,it.week||1));weeks[w-1].push(it);});
  var grid=weeks.map(function(list,wi){
    var cards=list.map(function(it){return '<div class="v26-cal-it"><div class="d">'+esc(it.day||'')+'</div><div class="t">'+esc(it.title||'')+'</div><div class="f">'+esc(it.format||'')+'</div><div class="acts"><button onclick="v26CalSave(\''+it.id+'\')">💾 в съёмки</button><button onclick="v26CalDel(\''+it.id+'\')">✕</button></div></div>';}).join('')||'<div class="v26-note" style="margin:0">пусто</div>';
    return '<div class="v26-week"><div class="wh">Неделя '+(wi+1)+'</div>'+cards+'</div>';
  }).join('');
  body.innerHTML='<div class="v26-row"><button class="v26-btn" id="v26calGen">✨ Собрать план на 4 недели</button><button class="v26-btn ghost" id="v26calClear">Очистить</button></div>'+
    '<div class="v26-note">Виора соберёт план публикаций под твою нишу, формулу хита и лучшее окно. Любой пункт можно отправить в «Мои съёмки».</div>'+
    '<div class="v26-cal">'+grid+'</div>';
  q('#v26calGen').addEventListener('click',calGen);
  q('#v26calClear').addEventListener('click',function(){calSave([]);calTab(body);});
}
function calGen(){
  var body=q('#v26body');if(noChannel(body))return;
  var btn=q('#v26calGen');if(btn){btn.disabled=true;btn.textContent='Собираю…';}
  var sys='Ты — продюсер YouTube. Составь контент-план на 4 недели под канал автора. Опирайся на нишу, формулу хита и рубрики из контекста. Верни СТРОГО валидный JSON: {"items":[{"week":1,"day":"Пн","title":"конкретное название ролика","format":"Длинное или Shorts"}]}. 8-12 пунктов, распределены по 4 неделям, разные форматы. Заголовки — готовые, цепляющие, под нишу. По-русски.';
  aiRaw(sys,'Составь план публикаций на 4 недели.',1600).then(function(r){
    var its=((r&&r.items)||[]).filter(function(x){return x&&x.title;}).map(function(x){return {id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),week:+x.week||1,day:x.day||'',title:String(x.title),format:x.format||'Длинное'};});
    if(!its.length)throw new Error('пусто');
    calSave(its);toast('План на 4 недели готов 📅');calTab(body);
  }).catch(function(){if(btn){btn.disabled=false;btn.textContent='✨ Собрать план на 4 недели';}toast('Не удалось собрать план, попробуй ещё раз','warn');});
}
W.v26CalDel=function(id){calSave(calLoad().filter(function(x){return x.id!==id;}));calTab(q('#v26body'));};
W.v26CalSave=function(id){
  var it=calLoad().filter(function(x){return x.id===id;})[0];if(!it)return;
  try{if(typeof W.saveShootPlan==='function'){W.saveShootPlan({idea:it.title,why:'Из контент-плана v26',format:(it.format==='Shorts'?'Shorts':'Длинное'),duration:'',titles:[{title:it.title,note:'контент-план'}],hook:'',structure:[],thumb:{},publish:{},checklist:[],pitfalls:[]});if(typeof W.renderShootsList==='function')W.renderShootsList();toast('Добавлено в «Мои съёмки» 🎬');}else{toast('Хранилище съёмок недоступно','warn');}}catch(e){toast('Не получилось сохранить','warn');}
};

/* ---- Разбор недели ---- */
function weekTab(body){
  if(noChannel(body))return;
  body.innerHTML='<button class="v26-btn" id="v26wkGo">🗓 Собрать разбор и фокус недели</button><div class="v26-note">Виора оценит состояние канала и даст 3 фокус-задачи и чек-лист на эту неделю.</div><div id="v26wkOut" style="margin-top:14px"></div>';
  q('#v26wkGo').addEventListener('click',function(){
    var btn=this,out=q('#v26wkOut');btn.disabled=true;out.innerHTML='<div class="v26-note">Виора думает…</div>';
    var sys='Ты — продюсер, ведёшь еженедельный разбор канала. Верни СТРОГО валидный JSON: {"verdict":"что происходит с каналом и на чём сфокусироваться, 2 предложения","focus":[{"title":"фокус-задача","why":"почему именно сейчас","how":"как сделать конкретно"}],"checklist":["короткое конкретное действие"]}. focus — ровно 3, привязаны к главной утечке и цифрам. checklist — 5-7 пунктов. По-русски.';
    aiRaw(sys,'Сделай недельный разбор и план фокуса.',1700).then(function(d){
      d=d||{};var h='';if(d.verdict)h+='<div class="v26-mc"><div class="kv">'+esc(d.verdict)+'</div></div>';
      (d.focus||[]).forEach(function(f,i){h+='<div class="v26-fcard"><div class="n">'+(i+1)+'</div><div><div class="ft">'+esc(f.title||'')+'</div><div class="fw">'+esc(f.why||'')+'</div><div class="fh">'+esc(f.how||'')+'</div></div></div>';});
      if((d.checklist||[]).length)h+='<div class="v26-mc"><h4>✅ Чек-лист недели</h4>'+d.checklist.map(function(x){return '<div class="kv">• '+esc(x)+'</div>';}).join('')+'</div>';
      out.innerHTML=h||'<div class="v26-err">Пусто, попробуй ещё раз.</div>';btn.disabled=false;
    }).catch(function(){out.innerHTML='<div class="v26-err">Виора недоступна, попробуй через пару секунд.</div>';btn.disabled=false;});
  });
}

/* ---- Ролик под ключ ---- */
var TK_LAST=null;
function turnkeyTab(body){
  body.innerHTML='<div class="v26-lab">Тема ролика</div><input class="v26-in" id="v26tkTopic" placeholder="например: 5 ошибок новичка в монтаже">'+
    '<div class="v26-row" style="margin-top:10px"><select class="v26-in" id="v26tkFmt" style="max-width:170px"><option value="long">🎥 Длинное</option><option value="shorts">⚡ Shorts</option></select><button class="v26-btn" id="v26tkGo" style="flex:1">🎬 Собрать ролик под ключ</button></div>'+
    '<div class="v26-note">Полный пакет: заголовок, хук, сценарий по шагам, бриф превью, описание, теги. Можно сохранить в «Мои съёмки».</div><div id="v26tkOut" style="margin-top:14px"></div>';
  var ni=S().primaryNiche;if(ni){var inp=q('#v26tkTopic');}
  q('#v26tkGo').addEventListener('click',turnkeyRun);
}
function turnkeyRun(){
  var topic=(q('#v26tkTopic')||{}).value.trim();if(!topic){toast('Введи тему ролика','warn');return;}
  var fmt=(q('#v26tkFmt')||{}).value==='shorts'?'Shorts':'Длинное';
  var btn=q('#v26tkGo'),out=q('#v26tkOut');btn.disabled=true;out.innerHTML='<div class="v26-note">Виора собирает ролик…</div>';
  var sys='Ты — продюсер YouTube, собираешь ролик под ключ. Верни СТРОГО валидный JSON: {"title":"цепляющий заголовок","hook":"что дословно сказать в первые 10-15 секунд","script":["6-9 шагов сценария: что говорить и делать"],"thumb":{"idea":"что на превью","text":"2-4 слова на обложке"},"description":"готовое описание","tags":["8-12 тегов"],"when":"когда выложить"}. Конкретно, под нишу автора, без воды. По-русски.';
  aiRaw(sys,'Тема: '+topic+'. Формат: '+fmt+'.',2000).then(function(p){
    if(!p||!p.title)throw new Error('пусто');TK_LAST={p:p,topic:topic,fmt:fmt};
    var h='';
    h+='<div class="v26-mc"><h4>📌 Заголовок<span class="v26-cp" onclick="v26Copy(this,\'tk_title\')">📋</span></h4><div class="kv" id="tk_title"><b>'+esc(p.title)+'</b></div></div>';
    if(p.hook)h+='<div class="v26-mc"><h4>🎯 Первые секунды<span class="v26-cp" onclick="v26Copy(this,\'tk_hook\')">📋</span></h4><div class="kv" id="tk_hook">'+esc(p.hook)+'</div></div>';
    if((p.script||[]).length)h+='<div class="v26-mc"><h4>📝 Сценарий по шагам</h4><ol class="v26-ol">'+p.script.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div>';
    if(p.thumb&&(p.thumb.idea||p.thumb.text))h+='<div class="v26-mc"><h4>🖼 Превью</h4><div class="kv">'+esc(p.thumb.idea||'')+(p.thumb.text?('<br>Текст: <b>'+esc(p.thumb.text)+'</b>'):'')+'</div></div>';
    if(p.description)h+='<div class="v26-mc"><h4>📄 Описание<span class="v26-cp" onclick="v26Copy(this,\'tk_desc\')">📋</span></h4><div class="kv" id="tk_desc">'+esc(p.description)+'</div></div>';
    if((p.tags||[]).length)h+='<div class="v26-mc"><h4>🏷 Теги</h4><div class="v26-tags">'+p.tags.map(function(x){return '<span class="v26-tag">'+esc(x)+'</span>';}).join('')+'</div></div>';
    if(p.when)h+='<div class="v26-mc"><h4>⏰ Когда выложить</h4><div class="kv">'+esc(p.when)+'</div></div>';
    h+='<div class="v26-row" style="margin-top:12px"><button class="v26-btn ghost sm" onclick="v26TkSave()">💾 В «Мои съёмки»</button></div>';
    out.innerHTML=h;btn.disabled=false;toast('Ролик собран 🎬');
  }).catch(function(){out.innerHTML='<div class="v26-err">Не удалось собрать ролик, попробуй ещё раз.</div>';btn.disabled=false;});
}
W.v26Copy=function(el,id){var n=q('#'+id);if(!n)return;var t=n.innerText||n.textContent||'';try{navigator.clipboard.writeText(t);}catch(e){}toast('Скопировано');};
W.v26TkSave=function(){if(!TK_LAST)return;var p=TK_LAST.p;try{if(typeof W.saveShootPlan==='function'){W.saveShootPlan({idea:p.title,why:'Ролик под ключ v26',format:(TK_LAST.fmt==='Shorts'?'Shorts':'Длинное'),duration:'',titles:[{title:p.title,note:'под ключ'}],hook:p.hook||'',structure:(p.script||[]).map(function(x,i){return {block:'Шаг '+(i+1),what:x,time:''};}),thumb:{idea:(p.thumb&&p.thumb.idea)||'',text:(p.thumb&&p.thumb.text)||''},publish:{when:p.when||''},checklist:[],pitfalls:[]});if(typeof W.renderShootsList==='function')W.renderShootsList();toast('Сохранил в «Мои съёмки» 🎬');}else toast('Хранилище недоступно','warn');}catch(e){toast('Не получилось сохранить','warn');}};

/* ---- Перехват трендов ---- */
function rivalsTab(body){
  if(noChannel(body))return;
  body.innerHTML='<button class="v26-btn" id="v26rvGo">📡 Что снять, чтобы перехватить тренды ниши</button><div class="v26-note">Виора предложит 3 ролика на основе того, что сейчас залетает в твоей нише и у конкурентов.</div><div id="v26rvOut" style="margin-top:14px"></div>';
  q('#v26rvGo').addEventListener('click',function(){
    var btn=this,out=q('#v26rvOut');btn.disabled=true;out.innerHTML='<div class="v26-note">Виора сканирует тренды…</div>';
    var sys='Ты — продюсер. На основе ниши и конкурентов автора предложи 3 ролика-перехвата трендов. Верни СТРОГО валидный JSON: {"trend":"тренд ниши одним предложением","steal":[{"idea":"как перехватить под наш канал","title":"готовый заголовок","why":"почему сработает"}]}. Ровно 3. По-русски.';
    aiRaw(sys,'Что снять, чтобы перехватить тренды моей ниши?',1400).then(function(d){
      d=d||{};var h='';if(d.trend)h+='<div class="v26-mc"><h4>📡 Тренд ниши</h4><div class="kv">'+esc(d.trend)+'</div></div>';
      (d.steal||[]).forEach(function(s){h+='<div class="v26-mc"><h4>🎯 '+esc(s.title||'')+'<span class="v26-cp" onclick="navigator.clipboard.writeText(this.parentNode.nextElementSibling.innerText);v26toastCopy()">📋</span></h4><div class="kv">'+esc(s.idea||'')+'</div>'+(s.why?'<div class="kv" style="color:#9b95a6">'+esc(s.why)+'</div>':'')+'</div>';});
      out.innerHTML=h||'<div class="v26-err">Пусто, попробуй ещё раз.</div>';btn.disabled=false;
      if(typeof W.v11CompOpen==='function')out.innerHTML+='<div class="v26-row" style="margin-top:12px"><button class="v26-btn ghost sm" onclick="v26HubClose();v11CompOpen()">📡 Открыть полный мониторинг конкурентов</button></div>';
    }).catch(function(){out.innerHTML='<div class="v26-err">Виора недоступна, попробуй ещё раз.</div>';btn.disabled=false;});
  });
}
W.v26toastCopy=function(){toast('Скопировано');};

/* ---- кнопка запуска хаба ---- */
function mountBtn(){
  try{
    var nav=q('.nav-in');
    if(nav&&!q('#v26navBtn')){
      var b=D.createElement('button');b.id='v26navBtn';b.className='v26-navbtn';b.type='button';b.innerHTML='🎬 <span>Продюсер</span>';b.onclick=show;
      var wrap=nav.querySelector('div[style*="flex-end"]')||nav.lastElementChild;
      if(wrap&&wrap!==nav)wrap.insertBefore(b,wrap.firstChild);else nav.appendChild(b);
    }
  }catch(e){}
}

/* =====================================================================
   BOOT
   ===================================================================== */
function boot(){
  try{scanInputs();}catch(e){}
  try{hookLoader();}catch(e){}
  try{hookBrain();}catch(e){}
  try{mountBtn();}catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,800);setTimeout(boot,2000);
setInterval(function(){try{scanInputs();mountBtn();}catch(e){}},2000);
D.addEventListener('keydown',function(e){if(e.key==='Escape'){var h=q('#v26hub');if(h&&h.classList.contains('on'))hide();}});
W.__v26api={open:show,ctx:W.v26ctx,loader:W.v26Loader};
})();
