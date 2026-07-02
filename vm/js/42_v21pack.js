/* ===================================================================
   VIORA v21 — «Студия роста» для faceless-новичка
   5 модулей: Поиск прибыльной ниши · CTR-скоринг упаковки ·
   Faceless-конвейер · Серия из одной идеи · Калькулятор дохода
   Самодостаточный IIFE. Переиспользует глобальные STATE/PROFILE/
   recon/MISTRAL_API_KEY/MODEL_FAST. Сеть только по клику кнопки.
=================================================================== */
(function(){
'use strict';
var W=window, D=document;
function $(s,r){return (r||D).querySelector(s);}
function $all(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function gToast(m,k){try{if(typeof W.vToast==='function'){W.vToast(m,k||'ok');return;}if(typeof W.toast==='function'){W.toast(m);return;}}catch(e){}}
function clamp(n,a,b){n=+n||0;return n<a?a:(n>b?b:n);}
function fmtUsd(n){n=Math.round(+n||0);return '$'+n.toLocaleString('en-US');}
function getNiche(){try{return (W.STATE&&W.STATE.primaryNiche)||(W.STATE&&W.STATE.channel&&W.STATE.channel.title)||'';}catch(e){return '';}}
function getProfile(){try{return W.PROFILE||null;}catch(e){return null;}}
function profileLine(){
  var p=getProfile(),parts=[];
  try{if(W.STATE&&W.STATE.channel&&W.STATE.channel.title)parts.push('Канал: «'+W.STATE.channel.title+'», '+(W.STATE.channel.subs||0)+' подписчиков');}catch(e){}
  if(p){if(p.goal2||p.goal)parts.push('Цель: '+(p.goal2||p.goal));if(p.level)parts.push('Уровень: '+p.level);if(p.time)parts.push('Время: '+p.time);}
  return parts.length?parts.join('. '):'данных о канале пока нет — пользователь новичок';
}

/* ---------- AI ---------- */
async function v21AI(sys,user,opts){
  opts=opts||{};
  if(!W.MISTRAL_API_KEY)throw new Error('AI-ключ недоступен');
  var ctrl=new AbortController(),to=setTimeout(function(){ctrl.abort();},opts.timeout||70000);
  try{
    var body={model:(W.MODEL_FAST||'mistral-medium-latest'),temperature:opts.temp==null?0.5:opts.temp,max_tokens:opts.max||1700,
      messages:[{role:'system',content:sys},{role:'user',content:user}]};
    if(opts.json)body.response_format={type:'json_object'};
    var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',signal:ctrl.signal,
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+W.MISTRAL_API_KEY},body:JSON.stringify(body)});
    if(!r.ok)throw new Error('AI '+r.status);
    var d=await r.json();
    var c=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
    if(opts.json){try{return JSON.parse(c);}catch(e){var m=c.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('Не разобрал ответ AI');}}
    return c;
  } finally{clearTimeout(to);}
}
function skel(n){var s='';for(var i=0;i<(n||5);i++)s+='<div class="v21-skel" style="width:'+(60+Math.random()*40)+'%"></div>';return '<div class="v21-card">'+s+'</div>';}

/* ---------- справочник ниш (RPM ≈ $/1000 просмотров, оценки рынка) ---------- */
var NICHES=[
 {k:'finance',     n:'Финансы / инвестиции',        ic:'💰', rpm:[8,22], dem:5, comp:5, fl:5, mon:'Высокий RPM рекламы + партнёрки брокеров/банков + свои курсы'},
 {k:'realestate',  n:'Недвижимость',                ic:'🏠', rpm:[9,20], dem:3, comp:3, fl:4, mon:'Очень высокий RPM + лиды агентам + консультации'},
 {k:'business',    n:'Бизнес / маркетинг',          ic:'📈', rpm:[6,16], dem:4, comp:4, fl:5, mon:'Высокий RPM + инфопродукты + услуги'},
 {k:'tech',        n:'Технологии / AI / софт',      ic:'🤖', rpm:[5,13], dem:5, comp:4, fl:5, mon:'Партнёрки сервисов (часто $-affiliate) + реклама'},
 {k:'review',      n:'Обзоры техники / гаджеты',    ic:'📱', rpm:[5,12], dem:4, comp:4, fl:4, mon:'Партнёрки маркетплейсов + реклама брендов'},
 {k:'psychology',  n:'Психология / саморазвитие',   ic:'🧠', rpm:[4,9],  dem:5, comp:4, fl:5, mon:'Реклама + свои гайды/курсы + донаты'},
 {k:'health',      n:'Здоровье / фитнес',           ic:'💪', rpm:[4,10], dem:5, comp:4, fl:4, mon:'Реклама + партнёрки добавок + программы'},
 {k:'education',   n:'Обучение / how-to',           ic:'🎓', rpm:[4,9],  dem:5, comp:4, fl:5, mon:'Реклама + курсы + партнёрки сервисов'},
 {k:'crime',       n:'Тру-крайм / тайны',           ic:'🕵️', rpm:[3,8],  dem:5, comp:3, fl:5, mon:'Реклама + Patreon/донаты'},
 {k:'relationship',n:'Отношения',                   ic:'❤️', rpm:[3,7],  dem:5, comp:4, fl:5, mon:'Реклама + консультации + курсы'},
 {k:'facts',       n:'Факты / топы / истории',      ic:'📜', rpm:[2,5],  dem:5, comp:5, fl:5, mon:'Огромный объём просмотров (масштаб) + реклама'},
 {k:'gaming',      n:'Игры',                        ic:'🎮', rpm:[2,5],  dem:5, comp:5, fl:4, mon:'Объём + донаты + партнёрки игр'},
 {k:'lifestyle',   n:'Лайфстайл / мотивация',       ic:'✨', rpm:[3,7],  dem:4, comp:4, fl:4, mon:'Реклама + мерч + спонсоры'},
 {k:'entertain',   n:'Развлечения / юмор',          ic:'😂', rpm:[1,4],  dem:5, comp:5, fl:4, mon:'Масштаб просмотров + спонсоры'},
 {k:'kids',        n:'Детский контент',             ic:'🧸', rpm:[1,3],  dem:5, comp:5, fl:4, mon:'Большой объём, но низкий RPM и ограничения'}
];
function nicheByKey(k){for(var i=0;i<NICHES.length;i++)if(NICHES[i].k===k)return NICHES[i];return null;}
function oppScore(o){ /* спрос × низкая конкуренция × RPM-привлекательность */
  var rpmAvg=(o.rpm[0]+o.rpm[1])/2, rpmN=clamp(rpmAvg/22*5,1,5);
  var compInv=6-o.comp; /* меньше конкуренция = больше очков */
  var raw=(o.dem*0.32 + compInv*0.30 + rpmN*0.30 + o.fl*0.08); /* из 5 */
  return Math.round(clamp(raw/5*100,5,99));
}

/* ===================================================================
   РЕЕСТР МОДУЛЕЙ
=================================================================== */
var V21T=[
 {id:'niche',  ic:'🎯', name:'Прибыльная ниша',     d:'Спрос × конкуренция × доход — где новичку легче выстрелить'},
 {id:'ctr',    ic:'🧪', name:'CTR-скоринг упаковки', d:'Оценю заголовок+превью как пакет и усилю под клик'},
 {id:'face',   ic:'🎬', name:'Faceless-конвейер',    d:'Ролик без лица: сценарий + озвучка + что показывать в кадре'},
 {id:'serie',  ic:'♻️', name:'Серия из одной идеи',  d:'1 рабочая тема → 6 связанных роликов в план'},
 {id:'money',  ic:'💰', name:'Калькулятор дохода',   d:'Сколько реально принесёт канал — по нише и просмотрам'}
];
var R21={};

/* ---------- меню/оверлеи ---------- */
function injectMenu(){
  var m=$('#v6NavMenu'); if(!m||m.__v21||$('.v21-mi',m))return; m.__v21=1;
  var html='<div class="ttl">💎 Студия v21</div>'+V21T.map(function(t){
    return '<button class="v6-mi v21-mi" data-t="'+t.id+'"><span class="ic">'+t.ic+'</span><span><b>'+esc(t.name)+'</b><small>'+esc(t.d)+'</small></span><span class="new">NEW</span></button>';
  }).join('');
  var box=D.createElement('div'); box.innerHTML=html;
  while(box.firstChild)m.appendChild(box.firstChild);
  $all('.v21-mi',m).forEach(function(b){b.addEventListener('click',function(e){
    e.stopPropagation(); m.classList.remove('show'); openV21(b.getAttribute('data-t'));
  });});
}
function openV21(id){
  var t=null;for(var i=0;i<V21T.length;i++)if(V21T[i].id===id)t=V21T[i];
  if(!t)return;
  var ov=$('#v21ov_'+id);
  if(!ov){
    ov=D.createElement('div'); ov.className='v21-ov'; ov.id='v21ov_'+id;
    ov.innerHTML='<div class="v21-top"><button class="v21-back" type="button">←</button>'+
      '<div class="v21-ttl">'+t.ic+' '+esc(t.name)+'<small>'+esc(t.d)+'</small></div></div>'+
      '<div class="v21-body"><div class="v21-wrap" id="v21body_'+id+'"></div></div>';
    D.body.appendChild(ov);
    $('.v21-back',ov).addEventListener('click',function(){closeV21(id);});
  }
  ov.classList.add('open'); D.body.style.overflow='hidden';
  try{R21[id]&&R21[id]();}catch(e){console.error('[v21]',e);}
}
function closeV21(id){var ov=$('#v21ov_'+id);if(ov)ov.classList.remove('open');D.body.style.overflow='';}
W.openV21=openV21; W.closeV21=closeV21;

/* ===================================================================
   МОДУЛЬ 1 — ПРИБЫЛЬНАЯ НИША
=================================================================== */
R21.niche=function(){
  var el=$('#v21body_niche');if(!el||el.__b)return;el.__b=1;
  var opts=NICHES.map(function(o){return '<option value="'+o.k+'">'+o.ic+' '+esc(o.n)+'</option>';}).join('');
  el.innerHTML=
  '<div class="v21-note">Подбираю нишу по формуле <b>спрос × низкая конкуренция × доходность (RPM)</b> — как в роликах про $10k с одного видео. Зелёным помечаю, где <b>новичку без лица</b> легче выстрелить.</div>'+
  '<div class="v21-lab">Выбери нишу для оценки</div>'+
  '<select class="v21-sel" id="v21nSel">'+opts+'</select>'+
  '<div class="v21-lab">или впиши свою тему (необязательно)</div>'+
  '<div class="v21-row"><input class="v21-in v21-col" id="v21nCustom" placeholder="например: разбор схем мошенников"/>'+
  '<button class="v21-btn" id="v21nGo">🔎 Оценить</button></div>'+
  '<div id="v21nQuick" style="margin-top:18px"></div>'+
  '<div id="v21nOut" class="v21-out"></div>';
  var pn=getNiche();
  if(pn){var low=pn.toLowerCase();for(var i=0;i<NICHES.length;i++){if(low.indexOf(NICHES[i].n.split(' ')[0].toLowerCase())>=0){$('#v21nSel').value=NICHES[i].k;break;}}}
  renderQuick();
  $('#v21nGo').addEventListener('click',nicheRun);
  function renderQuick(){
    var ranked=NICHES.map(function(o){return {o:o,s:oppScore(o)};}).sort(function(a,b){return b.s-a.s;}).slice(0,5);
    $('#v21nQuick').innerHTML='<div class="v21-lab">🏆 Топ-ниши по доходности для новичка</div>'+
      ranked.map(function(r){var cls=r.s>=70?'good':(r.s>=50?'mid':'bad');
        return '<div class="v21-bar" style="margin:7px 0"><span class="nm">'+r.o.ic+' '+esc(r.o.n)+'</span>'+
        '<span class="tr"><span class="fl" style="width:'+r.s+'%"></span></span><span class="vv">'+r.s+'</span></div>';
      }).join('');
  }
};
async function nicheRun(){
  var out=$('#v21nOut'),btn=$('#v21nGo');
  var custom=($('#v21nCustom')||{}).value.trim();
  var key=($('#v21nSel')||{}).value, base=nicheByKey(key)||NICHES[0];
  // мгновенная локальная карточка (работает даже без AI)
  out.innerHTML=localNicheCard(base,custom)+'<div id="v21nAi">'+skel(5)+'</div>';
  btn.disabled=true;
  try{
    var sys='Ты — Viora AI, продюсер по росту faceless YouTube-каналов для новичков. Отвечай по-русски, конкретно, по делу. Верни СТРОГО валидный JSON.';
    var schema='Схема: {"verdict":"1-2 предложения: стоит ли новичку без лица идти в эту нишу и почему","subniches":[{"name":"узкая под-ниша","why":"почему меньше конкуренции и есть спрос"}],"outlier":"1 предложение: где тут шанс, что один ролик выстрелит","first_videos":[{"title":"готовый цепляющий заголовок","format":"Shorts|Длинное","angle":"в двух словах суть"}],"warning":"1 предложение: главный риск/ошибка новичка в этой нише"}';
    var topic=custom||base.n;
    var u='Ниша: «'+topic+'». Категория: '+base.n+' (RPM≈$'+base.rpm[0]+'–'+base.rpm[1]+'/1000). Контекст автора: '+profileLine()+'. Дай 3 под-ниши, 3 первых ролика, шанс на выброс и главный риск.';
    var j=await v21AI(sys+'\n'+schema,u,{json:true,max:1500,temp:0.55});
    $('#v21nAi').innerHTML=nicheAiCard(j);
  }catch(e){ $('#v21nAi').innerHTML='<div class="v21-err">AI-разбор не вышел ('+esc(e.message)+'). Карточка выше посчитана локально и уже полезна.</div>'; }
  finally{btn.disabled=false;}
}
function localNicheCard(o,custom){
  var s=oppScore(o), cls=s>=70?'good':(s>=50?'mid':'bad'), word=s>=70?'отличная для старта':(s>=50?'рабочая, но есть нюансы':'сложная для новичка');
  function bar(nm,v){return '<div class="v21-bar"><span class="nm">'+nm+'</span><span class="tr"><span class="fl" style="width:'+(v/5*100)+'%"></span></span><span class="vv">'+v+'/5</span></div>';}
  var flTag=o.fl>=4?'<span class="v21-tag good">faceless-friendly</span>':'<span class="v21-tag mid">нужен голос/лицо</span>';
  return '<div class="v21-card"><h4>'+o.ic+' '+esc(custom||o.n)+(custom?' <span style="font-weight:500;color:#9aa0ac;font-size:12px">('+esc(o.n)+')</span>':'')+'</h4>'+
    '<div class="v21-score"><div class="v21-ring" style="--p:'+s+'"><i><b>'+s+'</b><small>из 100</small></i></div>'+
    '<div class="v21-bars">'+bar('Спрос',o.dem)+bar('Низкая конкуренция',6-o.comp)+bar('Доходность (RPM)',clamp(Math.round((o.rpm[0]+o.rpm[1])/2/22*5),1,5))+'</div></div>'+
    '<p style="margin-top:12px"><span class="v21-tag '+cls+'">'+word+'</span>'+flTag+'</p>'+
    '<p>💵 <b>RPM ≈ $'+o.rpm[0]+'–'+o.rpm[1]+'</b> за 1000 просмотров. 💸 Монетизация: '+esc(o.mon)+'.</p></div>';
}
function nicheAiCard(j){
  j=j||{};
  var h='<div class="v21-card"><h4>🧠 Разбор продюсера</h4>';
  if(j.verdict)h+='<p>'+esc(j.verdict)+'</p>';
  if(j.outlier)h+='<p>🚀 <b>Шанс на выброс:</b> '+esc(j.outlier)+'</p>';
  if(j.subniches&&j.subniches.length){h+='<p style="margin-top:10px"><b>Узкие под-ниши (меньше конкуренции):</b></p><ul>'+j.subniches.map(function(s){return '<li><b>'+esc(s.name||'')+'</b> — '+esc(s.why||'')+'</li>';}).join('')+'</ul>';}
  if(j.first_videos&&j.first_videos.length){h+='<p style="margin-top:10px"><b>🎬 Первые ролики:</b></p><ul>'+j.first_videos.map(function(v){return '<li>«'+esc(v.title||'')+'» <span class="v21-tag mid">'+esc(v.format||'')+'</span><br><small style="color:#9aa0ac">'+esc(v.angle||'')+'</small></li>';}).join('')+'</ul>';}
  if(j.warning)h+='<p style="margin-top:8px">⚠️ <b>Не наступи:</b> '+esc(j.warning)+'</p>';
  return h+'</div>';
}

/* ===================================================================
   МОДУЛЬ 2 — CTR-СКОРИНГ УПАКОВКИ
=================================================================== */
R21.ctr=function(){
  var el=$('#v21body_ctr');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=
  '<div class="v21-note">Упаковка (заголовок + превью) решает больше, чем сам ролик — это <b>№1 рычаг выброса</b>. Опиши свой пакет, я оценю CTR-потенциал и усилю. Дополняет «Превью-лабораторию» и «Арену заголовков».</div>'+
  '<div class="v21-lab">Заголовок ролика</div>'+
  '<input class="v21-in" id="v21cTitle" placeholder="например: Я повторил схему за $45 000 — вот что пошло не так"/>'+
  '<div class="v21-lab">Что на превью (опиши кадр/текст/эмоцию)</div>'+
  '<textarea class="v21-ta" id="v21cThumb" placeholder="например: крупное лицо в шоке, красная стрелка вниз, текст «-90%»"></textarea>'+
  '<div class="v21-row" style="margin-top:12px"><div class="v21-seg" id="v21cFmt"><button class="on" data-f="Длинное">🎬 Длинное</button><button data-f="Shorts">⚡ Shorts</button></div>'+
  '<button class="v21-btn" id="v21cGo">🧪 Оценить упаковку</button></div>'+
  '<div id="v21cOut" class="v21-out"></div>';
  $all('#v21cFmt button').forEach(function(b){b.addEventListener('click',function(){$all('#v21cFmt button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  $('#v21cGo').addEventListener('click',ctrRun);
};
async function ctrRun(){
  var out=$('#v21cOut'),btn=$('#v21cGo');
  var title=($('#v21cTitle')||{}).value.trim(), thumb=($('#v21cThumb')||{}).value.trim();
  var fmt=(($('#v21cFmt .on')||{}).getAttribute&&$('#v21cFmt .on').getAttribute('data-f'))||'Длинное';
  if(!title){gToast('Впиши заголовок','warn');return;}
  btn.disabled=true;out.innerHTML=skel(6);
  try{
    var sys='Ты — Viora AI, эксперт по упаковке YouTube. Оцениваешь связку заголовок+превью по ВИСП (Выгода, Интрига, Срочность, Причастность) и кликабельности. Отвечай по-русски. Верни СТРОГО валидный JSON.';
    var schema='Схема: {"score":число 0-100 — CTR-потенциал пакета,"verdict":"1 предложение итог","visp":[{"k":"Выгода|Интрига|Срочность|Причастность","ok":true/false,"note":"коротко"}],"title_fix":"что не так с заголовком и как усилить","thumb_fix":"что улучшить в превью (конкретно: контраст/эмоция/текит/крупность)","titles":["5 более кликабельных вариантов заголовка"],"pair":"1 совет: чтобы заголовок и превью НЕ дублировали друг друга, а дополняли"}';
    var u='Формат: '+fmt+'. Заголовок: «'+title+'». Превью: '+(thumb||'(не описано)')+'. Ниша: '+(getNiche()||'не задана')+'. Оцени и усиль.';
    var j=await v21AI(sys+'\n'+schema,u,{json:true,max:1600,temp:0.5});
    out.innerHTML=ctrCard(j,title);
  }catch(e){out.innerHTML='<div class="v21-err">Не вышло оценить: '+esc(e.message)+'. Попробуй ещё раз.</div>';}
  finally{btn.disabled=false;}
}
function ctrCard(j,title){
  j=j||{};var s=clamp(j.score,0,100),cls=s>=70?'good':(s>=45?'mid':'bad');
  var h='<div class="v21-card"><div class="v21-score"><div class="v21-ring" style="--p:'+s+'"><i><b>'+s+'</b><small>CTR</small></i></div>'+
    '<div style="flex:1 1 200px"><p style="margin:0"><span class="v21-tag '+cls+'">'+(s>=70?'сильная упаковка':(s>=45?'средняя — можно лучше':'слабая — переделать'))+'</span></p><p style="margin-top:7px">'+esc(j.verdict||'')+'</p></div></div>';
  if(j.visp&&j.visp.length){h+='<p style="margin-top:10px"><b>ВИСП:</b> '+j.visp.map(function(v){return '<span class="v21-tag '+(v.ok?'good':'bad')+'">'+(v.ok?'✓ ':'✗ ')+esc(v.k)+'</span>';}).join('')+'</p>';}
  if(j.title_fix)h+='<p>✏️ <b>Заголовок:</b> '+esc(j.title_fix)+'</p>';
  if(j.thumb_fix)h+='<p>🖼 <b>Превью:</b> '+esc(j.thumb_fix)+'</p>';
  if(j.pair)h+='<p>🔗 <b>Связка:</b> '+esc(j.pair)+'</p>';
  h+='</div>';
  if(j.titles&&j.titles.length){h+='<div class="v21-card"><h4>💡 Сильнее заголовки</h4><ul>'+j.titles.map(function(t){return '<li>«'+esc(t)+'» <button class="v21-tag mid" style="cursor:pointer;border:none" onclick="navigator.clipboard&&navigator.clipboard.writeText('+JSON.stringify(String(t))+');this.textContent=\'✓\'">копировать</button></li>';}).join('')+'</ul></div>';}
  return h;
}

/* ===================================================================
   МОДУЛЬ 3 — FACELESS-КОНВЕЙЕР
=================================================================== */
R21.face=function(){
  var el=$('#v21body_face');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=
  '<div class="v21-note">Ролик <b>без лица</b> под ключ: хук, сценарий, гайд по <b>озвучке</b> (голос, темп, сервис) и <b>шотлист</b> — что показывать в кадре (сток / AI-картинки / экран). Отличие от обычного «Конвейера» — заточен под faceless-производство.</div>'+
  '<div class="v21-lab">Тема ролика</div>'+
  '<input class="v21-in" id="v21fTopic" placeholder="например: 5 психологических ловушек, на которые ты ведёшься каждый день"/>'+
  '<div class="v21-row" style="margin-top:12px"><div class="v21-seg" id="v21fFmt"><button class="on" data-f="Длинное">🎬 Длинное</button><button data-f="Shorts">⚡ Shorts</button></div>'+
  '<button class="v21-btn" id="v21fGo">🎬 Собрать ролик</button></div>'+
  '<div id="v21fOut" class="v21-out"></div>';
  $all('#v21fFmt button').forEach(function(b){b.addEventListener('click',function(){$all('#v21fFmt button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  $('#v21fGo').addEventListener('click',faceRun);
};
async function faceRun(){
  var out=$('#v21fOut'),btn=$('#v21fGo');
  var topic=($('#v21fTopic')||{}).value.trim();
  var fmt=(($('#v21fFmt .on')||{}).getAttribute&&$('#v21fFmt .on').getAttribute('data-f'))||'Длинное';
  if(!topic){gToast('Впиши тему','warn');return;}
  btn.disabled=true;out.innerHTML=skel(7);
  try{
    var sys='Ты — Viora AI, продюсер faceless YouTube (без съёмки человека: AI-озвучка + сток/AI-картинки/запись экрана). Отвечай по-русски, конкретно. Верни СТРОГО валидный JSON.';
    var schema='Схема: {"hook":"мощный хук на первые 0-15 сек (текст голоса)","script":[{"part":"название блока","voice":"что говорит диктор (1-2 фразы сути)","visual":"что показать в кадре: сток/AI-картинка/скрин/график — конкретно"}],"voiceover":{"voice":"какой голос подойдёт (пол/тон)","pace":"темп","tip":"совет по озвучке (сервис вроде ElevenLabs, паузы, эмоция)"},"title":"кликабельный заголовок","thumb":"идея превью","checklist":["3-5 пунктов чек-листа перед публикацией"]}';
    var u='Тема: «'+topic+'». Формат: '+fmt+'. Ниша: '+(getNiche()||'не задана')+'. Собери faceless-ролик: хук, '+(fmt==='Shorts'?'3-4':'5-7')+' блоков сценария с озвучкой и визуалом, гайд озвучки, заголовок+превью, чек-лист.';
    var j=await v21AI(sys+'\n'+schema,u,{json:true,max:2200,temp:0.55});
    out.innerHTML=faceCard(j,topic,fmt);
  }catch(e){out.innerHTML='<div class="v21-err">Не вышло собрать: '+esc(e.message)+'. Попробуй ещё раз.</div>';}
  finally{btn.disabled=false;}
}
function faceCard(j,topic,fmt){
  j=j||{};var h='';
  if(j.hook)h+='<div class="v21-card"><h4>🪝 Хук (0–15 сек)</h4><p>'+esc(j.hook)+'</p></div>';
  if(j.script&&j.script.length){h+='<div class="v21-card"><h4>🎬 Сценарий + что в кадре</h4>'+j.script.map(function(s,i){
    return '<div style="border-left:2px solid rgba(255,45,85,.4);padding-left:12px;margin:11px 0"><b style="color:#fff">'+(i+1)+'. '+esc(s.part||'')+'</b>'+
    '<p style="margin:5px 0">🎙 '+esc(s.voice||'')+'</p><p style="margin:0;color:#9aa0ac">🎞 '+esc(s.visual||'')+'</p></div>';
  }).join('')+'</div>';}
  if(j.voiceover){var v=j.voiceover;h+='<div class="v21-card"><h4>🎙 Озвучка</h4><p><b>Голос:</b> '+esc(v.voice||'')+' · <b>Темп:</b> '+esc(v.pace||'')+'</p>'+(v.tip?'<p>💡 '+esc(v.tip)+'</p>':'')+'</div>';}
  if(j.title||j.thumb){h+='<div class="v21-card"><h4>📦 Упаковка</h4>'+(j.title?'<p>✏️ <b>Заголовок:</b> «'+esc(j.title)+'»</p>':'')+(j.thumb?'<p>🖼 <b>Превью:</b> '+esc(j.thumb)+'</p>':'')+
    '<p style="margin-top:8px"><button class="v21-btn ghost" onclick="(window.openV21&&openV21(\'ctr\'))">🧪 Прогнать через CTR-скоринг</button></p></div>';}
  if(j.checklist&&j.checklist.length){h+='<div class="v21-card"><h4>✅ Чек-лист публикации</h4><ul>'+j.checklist.map(function(c){return '<li>'+esc(c)+'</li>';}).join('')+'</ul></div>';}
  if(j.title){h+='<p style="margin-top:12px"><button class="v21-btn" id="v21fSave">📌 В «Мои съёмки»</button></p>';
    setTimeout(function(){var b=$('#v21fSave');if(b)b.addEventListener('click',function(){try{if(typeof W.saveShootPlan==='function'){W.saveShootPlan({title:j.title,idea:topic,hook:j.hook||'',source:'Faceless-конвейер v21'});gToast('Добавил в «Мои съёмки» 🎬');b.disabled=true;b.textContent='✓ В плане';}else gToast('План недоступен','warn');}catch(e){gToast('Не вышло сохранить','warn');}});},30);}
  return h;
}

/* ===================================================================
   МОДУЛЬ 4 — СЕРИЯ ИЗ ОДНОЙ ИДЕИ
=================================================================== */
R21.serie=function(){
  var el=$('#v21body_serie');if(!el||el.__b)return;el.__b=1;
  el.innerHTML=
  '<div class="v21-note">Канал растёт не одним роликом, а <b>системой</b> ($62k/мес из ролика про Claude Code — это конвейер). Дай одну рабочую тему — разверну в серию из 6 связанных роликов и закину в план.</div>'+
  '<div class="v21-lab">Рабочая тема / идея</div>'+
  '<input class="v21-in" id="v21sTopic" placeholder="например: ошибки новичков в инвестициях"/>'+
  '<div class="v21-row" style="margin-top:12px"><div class="v21-seg" id="v21sN"><button data-n="4">4</button><button class="on" data-n="6">6</button><button data-n="8">8</button></div>'+
  '<span style="color:#9aa0ac;font-size:12.5px">роликов в серии</span>'+
  '<button class="v21-btn" id="v21sGo" style="margin-left:auto">♻️ Развернуть в серию</button></div>'+
  '<div id="v21sOut" class="v21-out"></div>';
  $all('#v21sN button').forEach(function(b){b.addEventListener('click',function(){$all('#v21sN button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');});});
  $('#v21sGo').addEventListener('click',serieRun);
};
async function serieRun(){
  var out=$('#v21sOut'),btn=$('#v21sGo');
  var topic=($('#v21sTopic')||{}).value.trim();
  var n=(($('#v21sN .on')||{}).getAttribute&&$('#v21sN .on').getAttribute('data-n'))||'6';
  if(!topic){gToast('Впиши тему','warn');return;}
  btn.disabled=true;out.innerHTML=skel(6);
  try{
    var sys='Ты — Viora AI, продюсер контент-систем для YouTube. Из одной темы делаешь серию связанных роликов, которые ведут зрителя дальше и заставляют вернуться. Отвечай по-русски. Верни СТРОГО валидный JSON.';
    var schema='Схема: {"theme":"как назвать всю серию (плейлист)","videos":[{"title":"готовый заголовок","angle":"суть/угол","hook":"одна фраза-хук","format":"Shorts|Длинное"}],"order_tip":"в каком порядке выкладывать и почему","cadence":"с какой частотой выкладывать"}';
    var u='Тема: «'+topic+'». Сделай серию из '+n+' роликов. Ниша: '+(getNiche()||'не задана')+'. Каждый ролик — отдельная цепляющая идея, но все связаны и ведут зрителя по серии.';
    var j=await v21AI(sys+'\n'+schema,u,{json:true,max:2000,temp:0.6});
    out.innerHTML=serieCard(j,topic);
    wireSerieSave(j,topic);
  }catch(e){out.innerHTML='<div class="v21-err">Не вышло: '+esc(e.message)+'. Попробуй ещё раз.</div>';}
  finally{btn.disabled=false;}
}
function serieCard(j,topic){
  j=j||{};var h='';
  if(j.theme)h+='<div class="v21-card"><h4>📚 Серия: '+esc(j.theme)+'</h4>'+(j.order_tip?'<p>🔢 '+esc(j.order_tip)+'</p>':'')+(j.cadence?'<p>📅 <b>Частота:</b> '+esc(j.cadence)+'</p>':'')+
    '<p style="margin-top:8px"><button class="v21-btn" id="v21sSaveAll">📌 Всю серию в «Мои съёмки»</button></p></div>';
  if(j.videos&&j.videos.length){h+=j.videos.map(function(v,i){
    return '<div class="v21-serie"><span class="n">'+(i+1)+'</span><h5>'+esc(v.title||'')+' <span class="v21-tag mid">'+esc(v.format||'')+'</span></h5>'+
    '<div class="meta">🎯 '+esc(v.angle||'')+(v.hook?'<br>🪝 '+esc(v.hook):'')+'</div>'+
    '<div class="add"><button class="v21-btn ghost v21sOne" data-i="'+i+'">📌 В план</button></div></div>';
  }).join('');}
  return h;
}
function wireSerieSave(j,topic){
  function save(v){try{if(typeof W.saveShootPlan==='function'){W.saveShootPlan({title:v.title,idea:v.angle||topic,hook:v.hook||'',source:'Серия v21'});return true;}}catch(e){}return false;}
  var all=$('#v21sSaveAll');
  if(all)all.addEventListener('click',function(){var c=0;(j.videos||[]).forEach(function(v){if(save(v))c++;});gToast(c?('Добавил '+c+' в «Мои съёмки» 🎬'):'План недоступен',c?'ok':'warn');all.disabled=true;all.textContent='✓ В плане ('+c+')';});
  $all('.v21sOne').forEach(function(b){b.addEventListener('click',function(){var v=(j.videos||[])[+b.getAttribute('data-i')];if(v&&save(v)){gToast('Добавил 🎬');b.disabled=true;b.textContent='✓';}else gToast('Не вышло','warn');});});
}

/* ===================================================================
   МОДУЛЬ 5 — КАЛЬКУЛЯТОР ДОХОДА (оффлайн-математика + опц. AI-совет)
=================================================================== */
R21.money=function(){
  var el=$('#v21body_money');if(!el||el.__b)return;el.__b=1;
  var opts=NICHES.map(function(o){return '<option value="'+o.k+'">'+o.ic+' '+esc(o.n)+' ($'+o.rpm[0]+'–'+o.rpm[1]+')</option>';}).join('');
  el.innerHTML=
  '<div class="v21-note">Прикину <b>реальный доход</b> канала по нише, частоте и просмотрам. Считается мгновенно, прямо в браузере. Цифры — ориентир, не гарантия.</div>'+
  '<div class="v21-lab">Ниша (задаёт RPM)</div><select class="v21-sel" id="v21mNiche">'+opts+'</select>'+
  '<div class="v21-row" style="margin-top:12px">'+
    '<div class="v21-col"><div class="v21-lab" style="margin-top:0">Роликов в месяц</div><input class="v21-in" id="v21mVids" type="number" value="8" min="1"/></div>'+
    '<div class="v21-col"><div class="v21-lab" style="margin-top:0">Просмотров на ролик</div><input class="v21-in" id="v21mViews" type="number" value="5000" min="0"/></div>'+
  '</div>'+
  '<div class="v21-lab">RPM вручную ($/1000), если знаешь свой</div><input class="v21-in" id="v21mRpm" type="number" placeholder="по умолчанию — средний по нише" step="0.5"/>'+
  '<div id="v21mOut" class="v21-out"></div>'+
  '<p style="margin-top:14px"><button class="v21-btn ghost" id="v21mAi">🧠 Как поднять этот доход — совет AI</button></p>'+
  '<div id="v21mAiOut"></div>';
  function recalc(){moneyCalc();}
  ['v21mNiche','v21mVids','v21mViews','v21mRpm'].forEach(function(id){var e=$('#'+id);if(e)e.addEventListener('input',recalc);});
  moneyCalc();
  $('#v21mAi').addEventListener('click',moneyAi);
};
function moneyCalc(){
  var o=nicheByKey(($('#v21mNiche')||{}).value)||NICHES[0];
  var vids=clamp(($('#v21mVids')||{}).value,0,1000), views=clamp(($('#v21mViews')||{}).value,0,1e9);
  var manual=parseFloat(($('#v21mRpm')||{}).value);
  var rpmLo=o.rpm[0],rpmHi=o.rpm[1],rpmMid=(rpmLo+rpmHi)/2;
  if(!isNaN(manual)&&manual>0){rpmLo=manual*0.8;rpmHi=manual*1.2;rpmMid=manual;}
  var mViews=vids*views;
  function rev(rpm){return mViews/1000*rpm;}
  var lo=rev(rpmLo),mid=rev(rpmMid),hi=rev(rpmHi);
  var out=$('#v21mOut');if(!out)return;
  out.innerHTML='<div class="v21-card"><h4>💵 Доход с рекламы '+o.ic+'</h4>'+
    '<p style="color:#9aa0ac;margin-bottom:2px">'+vids+' роликов × '+views.toLocaleString('ru-RU')+' просмотров = <b style="color:#fff">'+mViews.toLocaleString('ru-RU')+'</b> просмотров/мес · RPM ≈ $'+rpmMid.toFixed(1)+'</p>'+
    '<div class="v21-money"><div class="mc"><div class="l">Скромно / мес</div><div class="v">'+fmtUsd(lo)+'</div></div>'+
    '<div class="mc hi"><div class="l">Реалистично / мес</div><div class="v">'+fmtUsd(mid)+'</div></div>'+
    '<div class="mc"><div class="l">Хорошо / мес</div><div class="v">'+fmtUsd(hi)+'</div></div></div>'+
    '<p style="margin-top:12px">📅 В год реклама ≈ <b class="v21-big green" style="font-size:20px">'+fmtUsd(mid*12)+'</b></p>'+
    '<p style="color:#9aa0ac;font-size:12.5px;margin-top:4px">+ к этому обычно идёт <b>×1.5–3</b> сверху с партнёрок/своих продуктов в этой нише ('+esc(o.mon)+').</p>'+
    '</div>'+
    '<div class="v21-card"><h4>📈 Если выйти на ритм</h4><p>При выходе '+vids+' роликов/мес библиотека копится. Через 6 мес. это уже '+(vids*6)+' роликов, которые приносят просмотры <b>каждый день</b> — даже старые. Стабильность важнее одного хита.</p></div>';
}
async function moneyAi(){
  var out=$('#v21mAiOut'),btn=$('#v21mAi');
  var o=nicheByKey(($('#v21mNiche')||{}).value)||NICHES[0];
  var vids=($('#v21mVids')||{}).value,views=($('#v21mViews')||{}).value;
  btn.disabled=true;out.innerHTML=skel(4);
  try{
    var sys='Ты — Viora AI, продюсер по монетизации YouTube. Дай 3-4 конкретных рычага, как поднять доход именно в этой ситуации. Отвечай по-русски, по делу, без воды. Верни JSON.';
    var schema='Схема: {"levers":[{"name":"рычаг","how":"как сделать конкретно","impact":"что даст"}]}';
    var u='Ниша: '+o.n+' (RPM $'+o.rpm[0]+'–'+o.rpm[1]+'). Сейчас: '+vids+' роликов/мес по '+views+' просмотров. Автор: '+profileLine()+'. Как поднять доход?';
    var j=await v21AI(sys+'\n'+schema,u,{json:true,max:1200,temp:0.5});
    out.innerHTML='<div class="v21-card"><h4>🧠 Рычаги роста дохода</h4><ul>'+((j.levers||[]).map(function(l){return '<li><b>'+esc(l.name||'')+'</b> — '+esc(l.how||'')+' <small style="color:#9aa0ac">('+esc(l.impact||'')+')</small></li>';}).join(''))+'</ul></div>';
  }catch(e){out.innerHTML='<div class="v21-err">AI-совет не вышел: '+esc(e.message)+'</div>';}
  finally{btn.disabled=false;}
}

/* ---------- запуск ---------- */
function boot(){
  injectMenu();
  var mo=new MutationObserver(function(){injectMenu();});
  try{mo.observe(D.body,{childList:true});}catch(e){}
  setInterval(injectMenu,1800);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
W.__v21={openV21:openV21,oppScore:oppScore,NICHES:NICHES,nicheByKey:nicheByKey};
})();
