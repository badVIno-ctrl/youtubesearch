/* =====================================================================
   VIORA V10 PACK — Этап «вау»:
   1) PDF-отчёт уровня агентства (умная постраничная вёрстка, обложка,
      оглавление, выводы на 1 страницу, white-label режим агентства)
   2) «Ты vs топ-3 ниши» прямо в аудите
   3) Динамика «до/после»: авто-напоминание о замерах + эффект советов
   4) Аудит удержания одного видео по таймкодам
   5) Коммент-майнер → контент-план одним потоком
   6) Профили ниш (gaming / обучение / влоги / обзоры)
   7) Telegram: импорт реального канала из JSON-экспорта
   8) Telegram: недельная сетка постов + .ics
   9) Telegram: A/B-тестер постов
   10) Онбординг: страница «Как это работает» + расширенный тур
   11) Мобильная полировка
   API-ключи и существующая логика не тронуты — только надстройка.
   ===================================================================== */
(function(){
'use strict';
if(window.__V10)return;window.__V10=true;
var W=window,D=document;

/* ---------------- helpers ---------------- */
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc10(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function toast10(m,k){try{if(W.vToast){W.vToast(m,k);return;}}catch(e){}try{console.log('[viora]',m);}catch(e){}}
function fmt10(n){try{if(typeof W.fmt==='function')return W.fmt(n);}catch(e){}try{return Number(n).toLocaleString('ru-RU');}catch(e){return String(n);}}
function med10(a){a=(a||[]).filter(function(x){return typeof x==='number'&&isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function clamp10(n,a,b){return Math.max(a,Math.min(b,n));}
function chid10(){try{return (typeof STATE!=='undefined'&&STATE&&STATE.channel&&STATE.channel.id)||'';}catch(e){return '';}}
function S10(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
var DAY10=864e5;
async function ai10(sys,user,max){
  var r=await W.callMistralRaw(sys,user,max||1400);
  if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){throw new Error('AI вернула не-JSON, попробуй ещё раз');}}
  return r;
}
function pct10(x){return (x>0?'+':'')+Math.round(x)+'%';}
function secToTc(s){s=Math.max(0,Math.round(s));var m=Math.floor(s/60),ss=s%60;return m+':'+('0'+ss).slice(-2);}
function tcToSec(t){if(typeof t==='number')return t;var p=String(t||'').trim().split(':').map(Number);if(p.some(isNaN))return null;if(p.length===3)return p[0]*3600+p[1]*60+p[2];if(p.length===2)return p[0]*60+p[1];return p[0]||null;}
function dlFile(name,text,mime){
  try{
    var b=new Blob([text],{type:mime||'text/plain'});
    var a=D.createElement('a');a.href=URL.createObjectURL(b);a.download=name;
    D.body.appendChild(a);a.click();
    setTimeout(function(){try{URL.revokeObjectURL(a.href);a.remove();}catch(e){}},800);
  }catch(e){toast10('Не удалось скачать файл','warn');}
}
/* запись в контент-календарь (v6_cal_v1) на конкретную дату */
function calPut(dateObj,text,type){
  try{
    var k=dateObj.getFullYear()+'-'+('0'+(dateObj.getMonth()+1)).slice(-2)+'-'+('0'+dateObj.getDate()).slice(-2);
    var data=lget('v6_cal_v1',{})||{};
    data[k]=data[k]||[];
    if(!data[k].some(function(e){return e.t===text;}))data[k].push({t:String(text).slice(0,90),type:type||'pub'});
    lset('v6_cal_v1',data);
    return true;
  }catch(e){return false;}
}
/* .ics builder: events = [{date:Date, durMin, title, desc}] */
function buildIcs(events,calName){
  function icsDt(d){return d.getFullYear()+('0'+(d.getMonth()+1)).slice(-2)+('0'+d.getDate()).slice(-2)+'T'+('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2)+'00';}
  function escI(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');}
  var now=new Date();
  var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Viora//RU','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escI(calName||'Viora план')];
  events.forEach(function(e,i){
    var end=new Date(e.date.getTime()+(e.durMin||30)*60000);
    L.push('BEGIN:VEVENT','UID:viora-'+now.getTime()+'-'+i+'@viora','DTSTAMP:'+icsDt(now),'DTSTART:'+icsDt(e.date),'DTEND:'+icsDt(end),'SUMMARY:'+escI(e.title),'DESCRIPTION:'+escI(e.desc||''),'END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.join('\r\n');
}
/* universal overlay в стиле v4-ov */
function ov10(id,ic,name,sub){
  var ov=q('#v4ov_'+id);
  if(!ov){
    ov=D.createElement('div');ov.className='v4-ov';ov.id='v4ov_'+id;
    ov.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\''+id+'\')">←</button><div class="v4-ttl"><span>'+ic+'</span> '+name+'<small>'+sub+'</small></div><div class="sp"></div></div><div class="v4-body"><div class="v4-wrap" id="v10body_'+id+'"></div></div>';
    D.body.appendChild(ov);
  }
  ov.classList.add('open');D.body.style.overflow='hidden';
  return q('#v10body_'+id);
}

/* ---------------- мобильный класс ---------------- */
function mobInit(){
  try{
    var mq=W.matchMedia('(max-width:760px)');
    var upd=function(){D.body.classList.toggle('v10-mob',mq.matches);};
    if(mq.addEventListener)mq.addEventListener('change',upd);else if(mq.addListener)mq.addListener(upd);
    upd();
  }catch(e){}
}

/* =====================================================================
   «КАК ЭТО РАБОТАЕТ» — страница-онбординг (первые 60 секунд)
   ===================================================================== */
function howHtml(){
  return ''+
  '<div class="hw-in">'+
    '<div class="hw-top"><h2>Как работает Viora</h2><button class="hw-x" onclick="v10HowClose()">✕ Закрыть</button></div>'+
    '<div class="v10-note" style="font-size:14px;margin-bottom:18px">Viora — твой AI-штаб роста: полный аудит YouTube-канала и студия для Telegram. Всё считается на реальных данных YouTube API и разборе Viora AI. <b style="color:#fff">Первый отчёт — примерно за 60 секунд.</b></div>'+
    '<div class="hw-steps">'+
      '<div class="hw-st"><div class="n">1</div><b>Вставь ссылку на канал</b><p>Подойдёт @handle, /channel/UC…, /c/имя или просто ссылка на любое видео канала. Регистрация не нужна.</p></div>'+
      '<div class="hw-st"><div class="n">2</div><b>~60 секунд анализа</b><p>Viora забирает до 200 последних роликов, делит Shorts / длинные / стримы, ищет конкурентов по твоим темам и прогоняет всё через AI-продюсера.</p></div>'+
      '<div class="hw-st"><div class="n">3</div><b>Получи план и действуй</b><p>Индекс роста, главная утечка, фокус недели, план на 30 дней и PDF-отчёт уровня агентства. Возвращайся раз в неделю — Viora покажет динамику «до/после».</p></div>'+
    '</div>'+
    '<h3>Что внутри отчёта</h3>'+
    '<div class="hw-feat">'+
      '<div class="hw-f"><span>🩺</span><span><b>Главная утечка роста</b> — что сильнее всего тормозит канал и как это чинить</span></div>'+
      '<div class="hw-f"><span>⚔️</span><span><b>Ты vs топ-3 ниши</b> — честное сравнение с лидерами по твоим темам</span></div>'+
      '<div class="hw-f"><span>🎬</span><span><b>План следующего видео</b> — тема, заголовки, хук, структура и чек-лист</span></div>'+
      '<div class="hw-f"><span>🎯</span><span><b>Аудит удержания</b> — гипотезы по таймкодам: где зритель уходит и что перемонтировать</span></div>'+
      '<div class="hw-f"><span>💬</span><span><b>Коммент-майнер</b> — боли и запросы аудитории превращаются в контент-план</span></div>'+
      '<div class="hw-f"><span>🧬</span><span><b>Профиль ниши</b> — нормы и советы под gaming, обучение, влоги или обзоры</span></div>'+
      '<div class="hw-f"><span>📈</span><span><b>Динамика «до/после»</b> — что изменилось после внедрения советов</span></div>'+
      '<div class="hw-f"><span>📄</span><span><b>PDF-отчёт</b> — обложка, оглавление, выводы на 1 странице; есть white-label для агентств</span></div>'+
      '<div class="hw-f"><span>✈️</span><span><b>Telegram-студия</b> — импорт реального канала из JSON, недельная сетка постов, A/B-тестер</span></div>'+
    '</div>'+
    '<h3>Частые вопросы</h3>'+
    '<div class="hw-faq">'+
      '<details><summary>Это бесплатно? Нужна ли регистрация?</summary><p>Да, аудит запускается без регистрации — просто вставь ссылку. Подключение своего канала через Google (для реального удержания и времени просмотра) — по желанию.</p></details>'+
      '<details><summary>Куда сохраняются мои данные?</summary><p>История замеров, планы и настройки хранятся локально в твоём браузере. Ничего никуда не выгружается — поэтому возвращайся с того же устройства, чтобы видеть динамику.</p></details>'+
      '<details><summary>Почему анализ иногда не запускается?</summary><p>Чаще всего — исчерпана дневная квота YouTube API. Она обновляется раз в сутки, попробуй позже. Канал также должен иметь публичные видео.</p></details>'+
      '<details><summary>Что за «Режим агентства»?</summary><p>Нажми «🏢 Режим агентства» внизу отчёта: добавь логотип, название и фирменный цвет — и PDF-отчёт соберётся в твоём оформлении (white-label), без брендинга Viora. Такой аудит агентства продают за 15–30 тыс. ₽.</p></details>'+
      '<details><summary>У меня Telegram-канал, а не YouTube</summary><p>Открой Telegram-студию: чат с AI-редактором, анализ постов, Пост-завод, недельная сетка, A/B-тестер и импорт реального канала из JSON-экспорта Telegram Desktop.</p></details>'+
    '</div>'+
    '<div class="hw-cta">'+
      '<button class="v10-btn" onclick="v10HowClose();try{enterYoutube();}catch(e){}setTimeout(function(){var i=document.getElementById(\'urlInput\');if(i)i.focus();},250)">📊 Разобрать мой канал →</button>'+
      '<button class="v10-btn ghost" onclick="v10HowClose();try{enterTelegram();}catch(e){}">✈️ Открыть Telegram-студию</button>'+
    '</div>'+
  '</div>';
}
W.v10HowOpen=function(){
  var el=q('#v10how');
  if(!el){el=D.createElement('div');el.id='v10how';el.innerHTML=howHtml();D.body.appendChild(el);}
  el.classList.add('open');D.body.style.overflow='hidden';
};
W.v10HowClose=function(){var el=q('#v10how');if(el)el.classList.remove('open');D.body.style.overflow='';};

function howButtons(){
  /* кнопка в навбаре */
  try{
    if(!q('#v10howBtn')){
      var slot=q('.nav-in')&&q('.nav-in').children[1];
      if(slot){
        var b=D.createElement('button');b.id='v10howBtn';b.textContent='❓ Как это работает';
        b.addEventListener('click',W.v10HowOpen);
        slot.insertBefore(b,slot.firstChild);
      }
    }
  }catch(e){}
  /* ссылка на экране выбора платформы */
  try{
    var inner=q('#entryGate .eg-inner');
    if(inner&&!q('.v10-eg-how',inner)){
      var l=D.createElement('button');l.className='v10-eg-how';l.textContent='❓ Как это работает — за 60 секунд';
      l.addEventListener('click',W.v10HowOpen);
      inner.appendChild(l);
    }
  }catch(e){}
}

/* расширяем существующий тур по дашборду новыми остановками */
function extendTour(){
  try{
    var T=W.TOUR_STEPS;
    if(!T||!T.push)return;
    if(!T.some(function(s){return s.sel==='#v10vs';}))
      T.push({sel:'#v10vs',t:'⚔️ Ты vs топ-3 ниши',d:'Честное сравнение с лидерами твоих тем: где ты впереди, где отстаёшь и какой разрыв до топа. Этот блок попадает и в PDF-отчёт.'});
    if(!T.some(function(s){return s.sel==='.fab-bar';}))
      T.push({sel:'.fab-bar',t:'📄 PDF и режим агентства',d:'Скачай отчёт уровня агентства: обложка, оглавление, выводы на одной странице. В «Режиме агентства» — твой логотип и цвета (white-label).'});
  }catch(e){}
}

/* =====================================================================
   АВТО-ЗАМЕРЫ: напоминание «пора обновить замер» на главной
   ===================================================================== */
function snapCfg(){var c=lget('v10_snapcfg',{days:7});if(!c||!c.days)c={days:7};return c;}
W.v10SnapDays=function(d){lset('v10_snapcfg',{days:+d||7});try{v10RenderBA();}catch(e){}};
function homeReminder(){
  try{
    var last=lget('v10_last',null);
    if(!last||!last.id||q('#v10remind'))return;
    var hero=q('#hero');
    if(!hero||getComputedStyle(hero).display==='none')return;
    var days=snapCfg().days;
    var passed=(Date.now()-(last.ts||0))/DAY10;
    if(passed<days)return;
    var el=D.createElement('div');el.id='v10remind';
    el.innerHTML='<span>📈 Пора обновить замер канала <b>«'+esc10(last.title||'')+'»</b> — прошло '+Math.floor(passed)+' дн. Свежий замер достроит график динамики «до/после».</span>'+
      '<button class="v10-btn sm">⚡ Обновить замер</button>';
    q('button',el).addEventListener('click',function(){
      try{
        var i=q('#urlInput');
        if(i){i.value=last.handle||('https://youtube.com/channel/'+last.id);}
        el.remove();
        if(typeof W.startAnalysis==='function')W.startAnalysis();
      }catch(e){}
    });
    var sb=q('#auditPane .searchbox')||q('.searchbox');
    if(sb&&sb.parentNode)sb.parentNode.insertBefore(el,sb.nextSibling);else hero.appendChild(el);
  }catch(e){}
}
/* показываем напоминание и при возврате на главную */
(function(){
  var gh=W.goHome;
  if(typeof gh==='function'){W.goHome=function(){var r=gh.apply(this,arguments);setTimeout(homeReminder,400);return r;};}
})();

/* =====================================================================
   V10 · ДАШБОРД: «Ты vs топ-3», профили ниш, «до/после», коннекторы
   ===================================================================== */

/* ---------- метрики для сравнения ---------- */
function myMetrics(){
  var s=S10(),all=[].concat(s.shorts||[],s.longs||[]);
  if(!s.channel)return null;
  var eng=all.length?all.reduce(function(t,v){return t+(v.engagement||0);},0)/all.length*100:0;
  var gap=(s.signals&&s.signals.posting&&s.signals.posting.medianGapDays)||0;
  return {
    name:s.channel.title,avatar:s.channel.avatar||'',me:true,
    subs:s.channel.subs||0,
    medVpd:Math.round(med10(all.map(function(v){return v.viewsPerDay;}))||0),
    avgViews:all.length?Math.round(all.reduce(function(t,v){return t+v.views;},0)/all.length):0,
    eng:+eng.toFixed(2),
    perWeek:gap>0?+(7/gap).toFixed(1):0
  };
}
function compMetrics(c){
  if(!c||!c.ch)return null;
  var vids=c.vids||[];
  var eng=vids.length?vids.reduce(function(t,v){return t+(v.engagement||0);},0)/vids.length*100:0;
  return {
    name:c.ch.title,avatar:c.ch.avatar||'',me:false,
    subs:c.ch.subs||0,
    medVpd:Math.round(med10(vids.map(function(v){return v.viewsPerDay;}))||0),
    avgViews:Math.round(c.avgViews||0),
    eng:+eng.toFixed(2),
    perWeek:c.freqPerWeek||0
  };
}
function vsData(){
  var s=S10();
  var me=myMetrics();
  if(!me)return null;
  var comps=(s.competitors||[]).map(compMetrics).filter(Boolean)
    .sort(function(a,b){return b.medVpd-a.medVpd;}).slice(0,3);
  if(!comps.length)return null;
  return {me:me,comps:comps};
}
function vsVerdicts(d){
  var out=[];
  var fields=[
    {k:'medVpd',n:'Просмотры/день (медиана)',good:'Ты собираешь больше просмотров в день, чем медиана топов — упаковка и темы работают.',bad:'Топ ниши собирает в {x} раза больше просмотров в день — главный резерв роста.'},
    {k:'eng',n:'Вовлечённость',good:'Твоя аудитория активнее, чем у топов, — лояльное ядро уже есть, масштабируй охват.',bad:'У топов вовлечённость выше — добавь вопросы в ролики, отвечай на комментарии первые 2 часа.'},
    {k:'perWeek',n:'Ритм публикаций',good:'Ты публикуешь чаще лидеров — следи, чтобы частота не убивала качество.',bad:'Лидеры публикуют чаще ({x} ролика/нед против твоих) — алгоритм любит стабильный ритм.'}
  ];
  fields.forEach(function(f){
    var topAvg=d.comps.reduce(function(t,c){return t+(c[f.k]||0);},0)/d.comps.length;
    var mine=d.me[f.k]||0;
    if(!topAvg&&!mine)return;
    if(mine>=topAvg){
      out.push({good:true,t:f.n,d:f.good});
    }else{
      var x=mine>0?(topAvg/mine):0;
      var msg=f.bad.replace('{x}',x>=2?Math.round(x*10)/10:(Math.round(topAvg*10)/10));
      out.push({good:false,t:f.n,d:msg});
    }
  });
  return out.slice(0,3);
}
function vsRowHtml(m,best){
  function cell(v,key,disp){
    var top=best[key]||0;
    var cls=m.me?(v>=top?'vs-win':(top>0&&v<top*0.5?'vs-lose':'')):'';
    return '<td class="'+cls+'">'+disp+'</td>';
  }
  return '<tr class="'+(m.me?'me':'')+'">'+
    '<td><div class="vs-ch">'+(m.avatar?'<img src="'+esc10(m.avatar)+'" onerror="this.style.display=\'none\'"/>':'')+'<span>'+(m.me?'⭐ ':'')+esc10(m.name)+'</span></div></td>'+
    cell(m.subs,'subs',fmt10(m.subs))+
    cell(m.medVpd,'medVpd',fmt10(m.medVpd))+
    cell(m.avgViews,'avgViews',fmt10(m.avgViews))+
    cell(m.eng,'eng',m.eng+'%')+
    cell(m.perWeek,'perWeek',(m.perWeek||'—')+(m.perWeek?'/нед':''))+
  '</tr>';
}
function injectVs(){
  if(q('#v10vs'))return;
  var d=vsData();
  if(!d)return;
  var best={};['subs','medVpd','avgViews','eng','perWeek'].forEach(function(k){
    best[k]=Math.max.apply(null,d.comps.map(function(c){return c[k]||0;}));
  });
  var rows=vsRowHtml(d.me,best)+d.comps.map(function(c){return vsRowHtml(c,best);}).join('');
  var verd=vsVerdicts(d).map(function(v){
    return '<div class="vs-v '+(v.good?'good':'bad')+'"><b>'+(v.good?'✅ ':'⚠️ ')+esc10(v.t)+'</b>'+esc10(v.d)+'</div>';
  }).join('');
  var gaps=['medVpd','subs','eng'].map(function(k){
    var labs={medVpd:'Просмотры/день',subs:'Подписчики',eng:'Вовлечённость'};
    var top=best[k]||0,mine=d.me[k]||0;
    if(!top)return '';
    var p=clamp10(Math.round(mine/top*100),2,100);
    return '<div class="g-row"><span class="g-lab">'+labs[k]+'</span><span class="g-bar"><i style="width:'+p+'%"></i></span><span class="g-val">'+p+'% от топа</span></div>';
  }).join('');
  var sec=D.createElement('div');sec.className='section';sec.id='v10vs';
  sec.innerHTML='<div class="section-h"><h2>⚔️ Ты vs топ-3 ниши</h2><div class="desc">Лидеры по твоим темам — лицом к лицу. Жирная строка — ты; зелёное — где ты впереди топов. Этот блок попадает в PDF-отчёт.</div></div>'+
    '<div class="card">'+
      '<div class="vs-scroll"><table class="vs-table"><thead><tr><th>Канал</th><th>Подписчики</th><th>Просм/день</th><th>Просм/видео</th><th>Вовлеч.</th><th>Ритм</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<div class="vs-gap">'+gaps+'</div>'+
      '<div class="vs-verdicts">'+verd+'</div>'+
      '<div class="v10-row" style="margin-top:14px">'+
        '<button class="v10-btn ghost sm" onclick="try{v6Open(\'duel\')}catch(e){}">🥊 Дуэль с конкурентом</button>'+
        '<button class="v10-btn ghost sm" onclick="try{v4OpenTool(\'radar\')}catch(e){}">📡 Тренд-радар ниши</button>'+
      '</div>'+
    '</div>';
  var verdict=q('#dashboard .verdict');
  var anchor=verdict?verdict.closest('.section'):null;
  if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(sec,anchor.nextSibling);
}
/* данные для PDF */
W.v10VsForPdf=function(){
  var d=vsData();if(!d)return null;
  return {me:d.me,comps:d.comps,verdicts:vsVerdicts(d)};
};

/* =====================================================================
   ПРОФИЛИ НИШ
   ===================================================================== */
var V10N=[
  {id:'gaming',ic:'🎮',name:'Gaming',re:/игр|game|гейм|майнкрафт|minecraft|кс[:\s2]|dota|дота|роблокс|roblox|стандофф|фортнайт|летсплей|прохожден/i,
   norms:{eng:4.0,perWeek:3,durMin:'15–25 мин',shorts:'30–50% Shorts'},
   weights:[['Регулярность и серийность',95],['Удержание и монтаж',90],['Тренды игр и патчи',85],['Упаковка превью',75],['SEO заголовков',55]],
   advice:['Делай серии и плейлисты по одной игре — биндж-просмотр сильно качает время просмотра','Лови патчи/обновления в первые 24 часа: трендовый ролик в gaming живёт 3–5 дней','Режь паузы агрессивно: ритм нарезки 3–7 секунд на план — норма ниши','Конвертируй лучшие моменты длинных роликов в Shorts с того же геймплея','Закрепляй комментарий с вопросом про игру — gaming-аудитория очень разговорчива'],
   aiHint:'Ниша GAMING: важны серийность, скорость реакции на патчи/тренды, динамичный монтаж, конверсия хайлайтов в Shorts. Сленг аудитории уместен.'},
  {id:'edu',ic:'🎓',name:'Обучение',re:/обуч|урок|курс|образован|туториал|tutorial|лекц|как сделать|how to|гайд|школ|экзамен|програм|английск|математ/i,
   norms:{eng:3.0,perWeek:1.5,durMin:'10–18 мин',shorts:'10–30% Shorts'},
   weights:[['Польза и структура',95],['SEO и поисковые запросы',90],['Доверие и экспертность',85],['Упаковка превью',70],['Регулярность',65]],
   advice:['Затачивай заголовки под поисковые запросы — обучение ищут, а не листают','Первые 30 секунд: покажи результат, который получит зритель к концу ролика','Добавляй таймкоды-главы в описание — YouTube подсветит их в поиске','Один ролик = одна проблема. Широкие «всё обо всём» проигрывают точечным','Серии «с нуля до результата» дают подписку лучше любых призывов'],
   aiHint:'Ниша ОБУЧЕНИЕ: упор на поисковый трафик, чёткую структуру, демонстрацию результата в начале, таймкоды, серии-курсы. Тон экспертный и дружелюбный.'},
  {id:'vlog',ic:'🎒',name:'Влоги/лайфстайл',re:/влог|vlog|жизнь|будни|путешеств|travel|переезд|деревн|лайфстайл|день из/i,
   norms:{eng:5.0,perWeek:1.5,durMin:'12–20 мин',shorts:'20–40% Shorts'},
   weights:[['Личность и история',95],['Вовлечённость комьюнити',90],['Регулярность',80],['Упаковка превью',70],['Тренды',50]],
   advice:['Каждый влог — мини-история с конфликтом и развязкой, а не хроника дня','Лицо и эмоция на превью работают в влогах лучше любого текста','Отвечай на комментарии в первые 2 часа — для влогов вовлечённость решает','Снимай рубрики-якоря (один формат раз в неделю) — за них возвращаются','Shorts с яркими моментами влога — главный источник новых зрителей ниши'],
   aiHint:'Ниша ВЛОГИ: главное — личность, сторителлинг (завязка-конфликт-развязка), комьюнити и регулярные рубрики. Высокая норма вовлечённости.'},
  {id:'review',ic:'📦',name:'Обзоры',re:/обзор|review|распаков|unbox|сравнен|тест|топ[\s-]?\d|лучших|техник|смартфон|гаджет/i,
   norms:{eng:2.5,perWeek:2,durMin:'8–15 мин',shorts:'20–40% Shorts'},
   weights:[['Скорость выхода (релизы)',95],['SEO и поисковые запросы',90],['Честность и сравнения',80],['Упаковка превью',75],['Регулярность',60]],
   advice:['Выпускай обзор в первые 48 часов после релиза — потом трафик забирают крупные','Формат «X vs Y» стабильно собирает больше, чем одиночный обзор','Вердикт и оценка — в первые 60 секунд, подробности потом: так удержание выше','Добавляй год в заголовок («…в 2026») — обзоры ищут с актуальностью','Снимай «итоги через месяц использования» — второй урожай с той же темы'],
   aiHint:'Ниша ОБЗОРЫ: критична скорость выхода после релизов, сравнения «X vs Y», ранний вердикт, SEO с указанием года, follow-up ролики.'}
];
function nicheKey(){return 'v10_niche:'+chid10();}
function curNiche(){
  var id=lget(nicheKey(),'');
  if(!id){id=detectNiche();if(id)lset(nicheKey(),id);}
  for(var i=0;i<V10N.length;i++)if(V10N[i].id===id)return V10N[i];
  return null;
}
function detectNiche(){
  try{
    var s=S10();
    var txt=((s.primaryNiche||'')+' '+(s.topics||[]).map(function(t){return t.name;}).join(' ')+' '+(s.longs||[]).slice(0,12).map(function(v){return v.title;}).join(' ')).toLowerCase();
    for(var i=0;i<V10N.length;i++)if(V10N[i].re.test(txt))return V10N[i].id;
  }catch(e){}
  return '';
}
W.v10SetNiche=function(id){
  lset(nicheKey(),id);
  try{renderNicheSection();}catch(e){}
  toast10(id?'Профиль ниши применён — советы и AI-разборы учитывают её специфику':'Профиль ниши сброшен');
};
function nicheNorms(n){
  var me=myMetrics();if(!me)return '';
  var cards=[];
  var engOk=me.eng>=n.norms.eng;
  cards.push('<div class="np-n '+(engOk?'good':'bad')+'"><div class="k">Вовлечённость</div><div class="v">'+me.eng+'%</div><div class="n">норма ниши: от '+n.norms.eng+'% · '+(engOk?'в норме ✅':'ниже нормы ⚠️')+'</div></div>');
  var fOk=me.perWeek>=n.norms.perWeek;
  cards.push('<div class="np-n '+(fOk?'good':'bad')+'"><div class="k">Ритм публикаций</div><div class="v">'+(me.perWeek||'—')+'/нед</div><div class="n">норма ниши: ~'+n.norms.perWeek+'/нед · '+(fOk?'в норме ✅':'реже нормы ⚠️')+'</div></div>');
  cards.push('<div class="np-n"><div class="k">Длина длинных роликов</div><div class="v">'+n.norms.durMin+'</div><div class="n">рабочая зона для ниши</div></div>');
  cards.push('<div class="np-n"><div class="k">Баланс форматов</div><div class="v">'+n.norms.shorts+'</div><div class="n">рекомендация для ниши</div></div>');
  return '<div class="np-norm">'+cards.join('')+'</div>';
}
function renderNicheSection(){
  var sec=q('#v10niche');
  if(!sec){
    sec=D.createElement('div');sec.className='section';sec.id='v10niche';
    var vs=q('#v10vs');
    var anchor=vs||((q('#dashboard .verdict')||{}).closest&&q('#dashboard .verdict').closest('.section'));
    if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(sec,anchor.nextSibling);
    else return;
  }
  var n=curNiche();
  var chips=V10N.map(function(p){
    return '<button class="v10-chip '+(n&&n.id===p.id?'on':'')+'" onclick="v10SetNiche(\''+p.id+'\')">'+p.ic+' '+p.name+'</button>';
  }).join('')+'<button class="v10-chip '+(!n?'on':'')+'" onclick="v10SetNiche(\'\')">✨ Универсальный</button>';
  var body='';
  if(n){
    var w=n.weights.map(function(x){
      return '<div class="w-row"><span class="w-lab">'+esc10(x[0])+'</span><span class="w-bar"><i style="width:'+x[1]+'%"></i></span></div>';
    }).join('');
    var adv=n.advice.map(function(a){
      return '<div class="np-a"><span class="dot">▸</span><span>'+esc10(a)+'</span><button class="add" onclick="try{vAddToPlan(this,\''+esc10(a.replace(/'/g,'’'))+'\',\'Совет профиля ниши «'+n.name+'»\');this.classList.add(\'ok\');this.textContent=\'✓ в плане\'}catch(e){}">➕ в план</button></div>';
    }).join('');
    body=nicheNorms(n)+
      '<div class="np-w"><div class="v10-h4" style="margin-top:4px">⚖️ Что важнее всего в этой нише</div>'+w+'</div>'+
      '<div class="np-adv"><div class="v10-h4">🎯 Советы под '+n.ic+' '+esc10(n.name)+'</div>'+adv+'</div>'+
      '<div class="v10-note" style="margin-top:12px">Профиль учитывается в AI-разборах (план видео, недельный разбор, чат) и попадает в PDF-отчёт.</div>';
  }else{
    body='<div class="v10-note">Выбери профиль — Viora сравнит канал с нормами ниши, перенастроит советы и начнёт учитывать специфику в AI-разборах. Сейчас действует универсальный режим.</div>';
  }
  sec.innerHTML='<div class="section-h"><h2>🧬 Профиль ниши</h2><div class="desc">У gaming, обучения, влогов и обзоров разные правила игры: вес метрик, нормы и советы. Выбери свой профиль — аудит подстроится.</div></div>'+
    '<div class="card"><div class="np-chips">'+chips+'</div>'+body+'</div>';
}
/* профиль ниши → в базу знаний всех AI-промптов */
(function(){
  var kf=W.kbFor;
  if(typeof kf!=='function')return;
  W.kbFor=function(){
    var r='';try{r=kf.apply(this,arguments)||'';}catch(e){}
    try{
      var n=curNiche();
      if(n)r+='\n\nПРОФИЛЬ НИШИ КАНАЛА — '+n.name.toUpperCase()+': '+n.aiHint+' Приоритеты ниши: '+n.weights.map(function(x){return x[0];}).slice(0,3).join(', ')+'.';
    }catch(e){}
    return r;
  };
})();
W.v10NicheForPdf=function(){
  var n=curNiche();if(!n)return null;
  return {ic:n.ic,name:n.name,norms:n.norms,advice:n.advice.slice(0,4),weights:n.weights.slice(0,4)};
};

/* =====================================================================
   ДИНАМИКА «ДО/ПОСЛЕ» — эффект внедрённых советов + настройка замеров
   ===================================================================== */
function doneKey(){return 'v10_done:'+chid10();}
/* ловим момент, когда задача плана отмечается выполненной */
(function(){
  var sp=W.setPlanState;
  if(typeof sp!=='function')return;
  W.setPlanState=function(st){
    try{
      var prev=(typeof W.getPlanState==='function')?W.getPlanState():{done:{}};
      var was=prev.done||{},now=(st&&st.done)||{};
      var log=lget(doneKey(),[]);
      var changed=false;
      Object.keys(now).forEach(function(sig){
        if(now[sig]&&!was[sig]&&!log.some(function(x){return x.sig===sig;})){
          log.push({sig:sig,ts:Date.now(),step:findStepText(sig,st)});changed=true;
        }
      });
      /* снятая галочка убирает запись */
      log=log.filter(function(x){return now[x.sig];});
      if(changed||log.length!==(lget(doneKey(),[])||[]).length)lset(doneKey(),log.slice(-40));
    }catch(e){}
    return sp.apply(this,arguments);
  };
  function findStepText(sig,st){
    try{
      var pools=[];
      if(S10().ai&&Array.isArray(S10().ai.action_plan))pools=pools.concat(S10().ai.action_plan);
      if(st&&Array.isArray(st.added))pools=pools.concat(st.added);
      for(var i=0;i<pools.length;i++){
        var t=pools[i];
        if(t&&t.step&&typeof W.taskSig==='function'&&W.taskSig(t.step)===sig)return String(t.step).slice(0,160);
      }
    }catch(e){}
    return '';
  }
})();
function v10RenderBA(){
  var hist=q('#historyArea');if(!hist)return;
  var old=q('#v10ba');if(old)old.remove();
  var box=D.createElement('div');box.id='v10ba';
  var cfg=snapCfg();
  var h=[];try{h=W.loadHistory(chid10())||[];}catch(e){}
  var log=lget(doneKey(),[]).filter(function(x){return x.step;}).sort(function(a,b){return b.ts-a.ts;}).slice(0,6);
  var impHtml='';
  if(log.length&&h.length>=2){
    var latest=h[h.length-1];
    var rows=log.map(function(x){
      var before=null;
      for(var i=h.length-1;i>=0;i--){if(h[i].ts<=x.ts){before=h[i];break;}}
      if(!before)before=h[0];
      if(before===latest)return '';
      var d=before.medVpd>0?Math.round((latest.medVpd/before.medVpd-1)*100):0;
      var cls=d>2?'up':(d<-2?'down':'flat');
      var arrow=d>2?'▲':(d<-2?'▼':'■');
      var date=new Date(x.ts).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
      return '<div class="ba-it"><div class="st">✅ '+esc10(x.step)+'<small>внедрено '+date+' · медиана была '+fmt10(before.medVpd)+' просм/день</small></div><div class="dl '+cls+'">'+arrow+' '+pct10(d)+'</div></div>';
    }).filter(Boolean).join('');
    if(rows)impHtml='<div class="ba-imp"><div class="v10-h4" style="margin:14px 0 4px">🧪 Эффект внедрённых советов</div><div class="v10-note">Δ медианы просмотров/день: замер до внедрения → текущий замер ('+esc10(latest.date)+'). Чем больше замеров, тем честнее картина.</div>'+rows+'</div>';
  }else if(log.length){
    impHtml='<div class="v10-note" style="margin-top:12px">✅ Советов внедрено: '+log.length+'. Сделай следующий замер через несколько дней — здесь появится эффект «до/после» по каждому.</div>';
  }
  var days=[3,7,14];
  box.innerHTML='<div class="ba-cfg"><span>🔔 Напоминать о новом замере раз в:</span>'+
    days.map(function(d){return '<button class="'+(cfg.days===d?'on':'')+'" onclick="v10SnapDays('+d+')">'+d+' дн</button>';}).join('')+
    '<span style="opacity:.7">— Viora напомнит на главной, когда придёт срок</span></div>'+impHtml;
  hist.appendChild(box);
}

/* =====================================================================
   КОММЕНТ-МАЙНЕР → КОНТЕНТ-ПЛАН (один поток)
   ===================================================================== */
function enhanceMiner(){
  var out=q('#v6cmOut');
  if(!out||out.__v10w)return;
  out.__v10w=true;
  var mo=new MutationObserver(function(){upgradeIdeas(out);});
  mo.observe(out,{childList:true,subtree:true});
  upgradeIdeas(out);
}
function upgradeIdeas(out){
  try{
    var cards=qa('.v6cm-card',out).filter(function(c){return /Зрители просят снять/.test(c.textContent||'');});
    if(!cards.length)return;
    var card=cards[0];
    qa('.v6cm-it',card).forEach(function(it){
      if(it.__v10)return;it.__v10=true;
      var b=q('b',it);if(!b)return;
      var idea=b.textContent.trim();if(!idea)return;
      var act=q('.act',it);if(!act)return;
      var p=D.createElement('button');p.className='v6-copy';p.textContent='➕ в план';
      p.addEventListener('click',function(){
        try{W.vAddToPlan(p,'Снять ролик: '+idea,'Запрос аудитории из комментариев');}catch(e){}
      });
      act.appendChild(p);
    });
    if(!q('.v10cm-flow',card)){
      var bar=D.createElement('div');bar.className='v10cm-flow';bar.style.cssText='margin-top:12px;display:flex;gap:9px;flex-wrap:wrap';
      bar.innerHTML='<button class="v10-btn sm">🗓 Распределить идеи по контент-календарю</button><span class="v10-note" style="align-self:center">идеи лягут в календарь с шагом под ритм канала</span>';
      q('button',bar).addEventListener('click',function(){
        var ideas=qa('.v6cm-it b',card).map(function(b){return b.textContent.trim();}).filter(Boolean);
        if(!ideas.length){toast10('Идей пока нет','warn');return;}
        var gap=3;
        try{var g=(S10().signals&&S10().signals.posting&&S10().signals.posting.medianGapDays)||3;gap=clamp10(Math.round(g),2,7);}catch(e){}
        var d=new Date();d.setDate(d.getDate()+2);
        var n=0;
        ideas.slice(0,7).forEach(function(idea){
          if(calPut(d,'🎬 Из комментов: '+idea))n++;
          d=new Date(d.getTime()+gap*DAY10);
        });
        this.textContent='✓ В календаре: '+n;this.disabled=true;
        toast10('🗓 Идеи из комментариев в контент-календаре (меню 🧰 → Контент-календарь)');
      });
      card.appendChild(bar);
    }
  }catch(e){}
}
(function(){
  var vo=W.v6Open;
  if(typeof vo!=='function')return;
  W.v6Open=function(id){
    var r=vo.apply(this,arguments);
    try{if(id==='comments')setTimeout(enhanceMiner,250);}catch(e){}
    return r;
  };
})();
/* мост из дашборда: разобрать комментарии топ-видео в один клик */
function minerBridgeBtn(){
  var bulk=q('#bulkCta');
  if(!bulk||q('#v10cmBridge'))return;
  var s=S10();
  var all=[].concat(s.longs||[],s.shorts||[]).filter(function(v){return (v.comments||0)>3;});
  if(!all.length)return;
  var top=all.sort(function(a,b){return (b.comments||0)-(a.comments||0);})[0];
  var b=D.createElement('button');b.className='btn ghost';b.id='v10cmBridge';b.style.whiteSpace='nowrap';
  b.textContent='💬 Идеи из комментариев →';
  b.title='Разобрать комментарии самого обсуждаемого ролика и превратить их в контент-план';
  b.addEventListener('click',function(){
    try{
      W.v6Open('comments');
      setTimeout(function(){
        var i=q('#v6cmUrl');
        if(i&&!i.value)i.value='https://youtu.be/'+top.id;
        enhanceMiner();
      },300);
    }catch(e){}
  });
  bulk.appendChild(b);
}

/* =====================================================================
   V10 · PDF УРОВНЯ АГЕНТСТВА
   Постраничный движок: каждый блок целиком на странице (без разрезов),
   обложка, оглавление, «выводы на 1 странице», ты-vs-топ-3, white-label.
   ===================================================================== */
function brand(){
  var b=lget('v10_brand',{})||{};
  return {on:!!b.on,name:b.name||'',site:b.site||'',logo:b.logo||'',color:b.color||'#FF2D55'};
}
W.v10BrandOpen=function(){
  var m=q('#v10brand');
  if(!m){
    m=D.createElement('div');m.id='v10brand';
    m.innerHTML='<div class="bx">'+
      '<h3>🏢 Режим агентства</h3>'+
      '<div class="v10-note">White-label PDF: твой логотип, имя и фирменный цвет вместо брендинга Viora. Идеально, чтобы отдавать аудит клиенту от своего имени.</div>'+
      '<label class="sw"><input type="checkbox" id="v10bOn" style="accent-color:#ff2d55;width:18px;height:18px"/> Включить оформление агентства в PDF</label>'+
      '<div class="v10-lab">Название агентства / студии</div><input class="v10-in" id="v10bName" placeholder="Например: GrowthLab Media"/>'+
      '<div class="v10-lab">Сайт или контакт (подвал отчёта)</div><input class="v10-in" id="v10bSite" placeholder="growthlab.ru · @growthlab"/>'+
      '<div class="v10-lab">Логотип (PNG/JPG, до 1 МБ)</div>'+
      '<div class="logo-drop" id="v10bDrop"><span id="v10bLogoPrev"></span>Нажми, чтобы выбрать файл логотипа</div>'+
      '<input type="file" id="v10bFile" accept="image/*" style="display:none"/>'+
      '<div class="v10-lab">Фирменный цвет</div><div class="v10-row"><input type="color" id="v10bColor" value="#FF2D55"/><span class="v10-note">акценты обложки и заголовков PDF</span></div>'+
      '<div class="v10-row" style="margin-top:18px"><button class="v10-btn" id="v10bSave">💾 Сохранить</button><button class="v10-btn ghost" id="v10bClose">Закрыть</button><button class="v10-btn ghost sm" id="v10bReset" style="margin-left:auto">Сбросить</button></div>'+
    '</div>';
    D.body.appendChild(m);
    q('#v10bDrop',m).addEventListener('click',function(){q('#v10bFile',m).click();});
    q('#v10bFile',m).addEventListener('change',function(){
      var f=this.files&&this.files[0];if(!f)return;
      if(f.size>1024*1024){toast10('Логотип больше 1 МБ — выбери файл поменьше','warn');return;}
      var r=new FileReader();
      r.onload=function(){m.__logo=String(r.result||'');prevLogo(m);};
      r.readAsDataURL(f);
    });
    q('#v10bSave',m).addEventListener('click',function(){
      lset('v10_brand',{on:q('#v10bOn',m).checked,name:q('#v10bName',m).value.trim(),site:q('#v10bSite',m).value.trim(),logo:m.__logo||'',color:q('#v10bColor',m).value});
      m.classList.remove('open');
      toast10('🏢 Оформление сохранено — следующий PDF соберётся в твоём стиле');
    });
    q('#v10bClose',m).addEventListener('click',function(){m.classList.remove('open');});
    q('#v10bReset',m).addEventListener('click',function(){
      lset('v10_brand',{});m.__logo='';fill(m);prevLogo(m);
    });
    m.addEventListener('click',function(e){if(e.target===m)m.classList.remove('open');});
  }
  function fill(m){
    var b=brand();
    q('#v10bOn',m).checked=b.on;q('#v10bName',m).value=b.name;q('#v10bSite',m).value=b.site;q('#v10bColor',m).value=b.color;
    m.__logo=b.logo;
  }
  function prevLogo(m){
    q('#v10bLogoPrev',m).innerHTML=m.__logo?'<img src="'+m.__logo+'" alt=""/>':'';
  }
  fill(m);prevLogo(m);
  m.classList.add('open');
};

/* ---------- блоки отчёта ---------- */
var PG_W=794,PG_H=1123,PG_BODY=926; /* высота контентной зоны */
function hx(c,a){ /* затемнение hex для градиента */
  try{
    var n=parseInt(c.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    r=Math.round(r*a);g=Math.round(g*a);b=Math.round(b*a);
    return 'rgb('+r+','+g+','+b+')';
  }catch(e){return c;}
}
function bTitle(t){return '<div data-keep="1" style="font-size:16px;font-weight:800;color:#160f1d;margin:4px 0 12px;padding-bottom:7px;border-bottom:2px solid '+brand().color+'">'+t+'</div>';}
function bStat(l,v,n){return '<div style="flex:1 1 30%;min-width:140px;background:#f7f4fa;border:1px solid #e9e3f0;border-radius:12px;padding:12px 14px"><div style="font-size:10px;color:#7a7385;text-transform:uppercase;letter-spacing:.7px">'+l+'</div><div style="font-size:19px;font-weight:800;color:#160f1d;margin-top:3px">'+v+'</div>'+(n?'<div style="font-size:10.5px;color:#9a92a5;margin-top:2px">'+n+'</div>':'')+'</div>';}
function bBar(label,v,color){
  v=clamp10(Math.round(v),0,100);
  return '<div style="margin:0 0 9px"><div style="display:flex;justify-content:space-between;font-size:12px;color:#4a4156"><span>'+label+'</span><b>'+v+'</b></div><div style="height:7px;border-radius:5px;background:#efeaf4;margin-top:3px"><div style="height:7px;border-radius:5px;width:'+v+'%;background:'+(color||('linear-gradient(90deg,'+brand().color+',#ff7a4d)'))+'"></div></div></div>';
}
function spark(h){
  if(!h||h.length<2)return '';
  var vals=h.map(function(s){return s.medVpd||0;});
  var mx=Math.max.apply(null,vals)||1,mn=Math.min.apply(null,vals);
  var W2=690,H2=120,pad=8;
  var pts=vals.map(function(v,i){
    var x=pad+i*(W2-2*pad)/(vals.length-1);
    var y=H2-pad-(mx>mn?(v-mn)/(mx-mn):0.5)*(H2-2*pad);
    return [x,y];
  });
  var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
  var area=line+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H2-2)+' L'+pts[0][0].toFixed(1)+' '+(H2-2)+' Z';
  var c=brand().color;
  return '<svg width="'+W2+'" height="'+H2+'" viewBox="0 0 '+W2+' '+H2+'" style="display:block;margin-top:6px">'+
    '<path d="'+area+'" fill="'+c+'18"/><path d="'+line+'" fill="none" stroke="'+c+'" stroke-width="2.5" stroke-linecap="round"/>'+
    pts.map(function(p){return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3" fill="'+c+'"/>';}).join('')+
    '</svg><div style="display:flex;justify-content:space-between;font-size:10px;color:#9a92a5"><span>'+esc10(h[0].date)+'</span><span>медиана просмотров/день по замерам</span><span>'+esc10(h[h.length-1].date)+'</span></div>';
}
function pdfBlocks(){
  var s=S10(),ch=s.channel||{},ai=s.ai||{};
  var all=[].concat(s.shorts||[],s.longs||[]);
  var sig=s.signals||{};
  var blocks=[]; /* {h, sect} */
  var medV=Math.round(med10(all.map(function(v){return v.viewsPerDay;}))||0);

  /* —— Ключевые метрики —— */
  blocks.push({sect:'Ключевые метрики',h:bTitle('📊 Ключевые метрики канала')});
  blocks.push({h:'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">'+
    bStat('Подписчики',ch.hiddenSubs?'скрыто':fmt10(ch.subs||0))+
    bStat('Медиана просм/день',fmt10(medV))+
    bStat('Всего просмотров',fmt10(ch.totalViews||0))+
    bStat('Роликов',fmt10(ch.videoCount||0),(s.shorts||[]).length+' Shorts · '+(s.longs||[]).length+' длинных')+
    bStat('Ритм выхода',(sig.posting?('раз в ~'+sig.posting.medianGapDays+' дн'):'—'),(sig.posting?('стабильность: '+sig.posting.consistency):''))+
    bStat('Лучшее окно',(sig.bestWindow&&sig.bestWindow.day?(sig.bestWindow.day+' · '+(sig.bestWindow.hourRange||'')):'—'),'когда выходили хиты')+
    '</div>'});
  var bd=(ai.score_breakdown&&ai.score_breakdown.length)?ai.score_breakdown:[];
  if(!bd.length){try{var ls=W.localScore&&W.localScore({signals:sig});bd=(ls&&ls.breakdown)||[];}catch(e){}}
  if(bd.length){
    blocks.push({h:'<div style="font-size:13px;font-weight:800;color:#160f1d;margin:4px 0 8px">Из чего складывается индекс роста</div>'});
    bd.slice(0,8).forEach(function(b){blocks.push({h:bBar(esc10(b.factor),parseFloat(b.value)||0)});});
  }

  /* —— Ты vs топ-3 —— */
  var vs=null;try{vs=W.v10VsForPdf();}catch(e){}
  if(vs){
    blocks.push({sect:'Ты vs топ-3 ниши',h:bTitle('⚔️ Ты vs топ-3 ниши')});
    function row(m,me){
      return '<tr style="'+(me?'background:#fff2f5;font-weight:700;':'')+'border-bottom:1px solid #efeaf4">'+
        '<td style="padding:8px 9px;font-size:12px;color:#160f1d">'+(me?'⭐ ':'')+esc10(String(m.name).slice(0,30))+'</td>'+
        '<td style="padding:8px 9px;font-size:12px;text-align:right">'+fmt10(m.subs)+'</td>'+
        '<td style="padding:8px 9px;font-size:12px;text-align:right">'+fmt10(m.medVpd)+'</td>'+
        '<td style="padding:8px 9px;font-size:12px;text-align:right">'+fmt10(m.avgViews)+'</td>'+
        '<td style="padding:8px 9px;font-size:12px;text-align:right">'+m.eng+'%</td>'+
        '<td style="padding:8px 9px;font-size:12px;text-align:right">'+(m.perWeek||'—')+'</td></tr>';
    }
    blocks.push({h:'<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><thead><tr style="border-bottom:2px solid #e9e3f0">'+
      '<th style="text-align:left;font-size:10px;color:#7a7385;text-transform:uppercase;letter-spacing:.6px;padding:6px 9px">Канал</th>'+
      ['Подписчики','Просм/день','Просм/видео','Вовлеч.','Видео/нед'].map(function(t){return '<th style="text-align:right;font-size:10px;color:#7a7385;text-transform:uppercase;letter-spacing:.6px;padding:6px 9px">'+t+'</th>';}).join('')+
      '</tr></thead><tbody>'+row(vs.me,true)+vs.comps.map(function(c){return row(c);}).join('')+'</tbody></table>'});
    vs.verdicts.forEach(function(v){
      blocks.push({h:'<div style="display:flex;gap:8px;font-size:12.5px;line-height:1.5;margin:0 0 7px;color:#3c3346"><span style="font-weight:800">'+(v.good?'✅':'⚠️')+'</span><span><b>'+esc10(v.t)+':</b> '+esc10(v.d)+'</span></div>'});
    });
  }

  /* —— Темы и формула —— */
  var tps=(s.topics||[]).slice().sort(function(a,b){return (b.medVpd||0)-(a.medVpd||0);}).slice(0,5);
  if(tps.length||((ai.hit_formula||[]).length)){
    blocks.push({sect:'Темы и формула хита',h:bTitle('🗂 Темы канала и формула хита')});
    tps.forEach(function(t){
      blocks.push({h:'<div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;border-bottom:1px solid #efeaf4;padding:7px 2px;color:#3c3346"><span style="font-weight:700">'+esc10(t.name)+'</span><span style="color:#6a6175">'+fmt10(Math.round(t.medVpd||0))+' просм/день · '+((t.videos&&t.videos.length)||t.count||'')+' видео</span></div>'});
    });
    (ai.hit_formula||[]).slice(0,5).forEach(function(f,i){
      if(i===0)blocks.push({h:'<div style="font-size:13px;font-weight:800;color:#160f1d;margin:14px 0 7px">🧬 Что общего у твоих хитов</div>'});
      blocks.push({h:'<div style="display:flex;gap:8px;margin:0 0 6px;font-size:12.5px;line-height:1.5;color:#3c3346"><span style="color:'+brand().color+';font-weight:800">✓</span><span>'+esc10(typeof f==='string'?f:JSON.stringify(f))+'</span></div>'});
    });
  }

  /* —— Профиль ниши —— */
  var np=null;try{np=W.v10NicheForPdf();}catch(e){}
  if(np){
    blocks.push({sect:'Профиль ниши',h:bTitle(np.ic+' Профиль ниши: '+esc10(np.name))});
    blocks.push({h:'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">'+
      bStat('Норма вовлечённости','от '+np.norms.eng+'%')+
      bStat('Норма ритма','~'+np.norms.perWeek+' видео/нед')+
      bStat('Длина роликов',np.norms.durMin)+
      bStat('Баланс форматов',np.norms.shorts)+'</div>'});
    np.advice.forEach(function(a){
      blocks.push({h:'<div style="display:flex;gap:8px;margin:0 0 7px;font-size:12.5px;line-height:1.55;color:#3c3346"><span style="color:'+brand().color+';font-weight:800">▸</span><span>'+esc10(a)+'</span></div>'});
    });
  }

  /* —— Динамика —— */
  var h=[];try{h=W.loadHistory(ch.id)||[];}catch(e){}
  if(h.length>=2){
    var first=h[0],last=h[h.length-1];
    blocks.push({sect:'Динамика канала',h:bTitle('📈 Динамика по замерам ('+h.length+' замеров)')});
    blocks.push({h:'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">'+
      bStat('Подписчики',fmt10(last.subs),(last.subs-first.subs>=0?'+':'')+fmt10(last.subs-first.subs)+' с первого замера')+
      bStat('Медиана просм/день',fmt10(last.medVpd),(first.medVpd?pct10((last.medVpd/first.medVpd-1)*100):'—')+' с первого замера')+
      bStat('Вовлечённость',last.eng+'%',(last.eng-first.eng>=0?'+':'')+(last.eng-first.eng).toFixed(1)+' п.п.')+'</div>'});
    blocks.push({h:spark(h)});
  }

  /* —— Идеи —— */
  var ideas=(ai.next_videos||[]).slice(0,5);
  if(ideas.length){
    blocks.push({sect:'Что снять дальше',h:bTitle('💡 Что снять дальше')});
    ideas.forEach(function(n){
      blocks.push({h:'<div style="background:#f7f4fa;border:1px solid #e9e3f0;border-radius:11px;padding:11px 13px;margin:0 0 8px"><div style="font-weight:700;font-size:13px;color:#160f1d">«'+esc10(n.title||n.idea||'')+'»</div><div style="font-size:11.5px;color:#6a6175;margin-top:3px">'+esc10(n.format||'')+(n.why?' · '+esc10(n.why):'')+'</div></div>'});
    });
  }

  /* —— План —— */
  var plan=(ai.action_plan||[]).filter(function(t){return t&&t.step;}).slice(0,12);
  if(plan.length){
    blocks.push({sect:'План на 30 дней',h:bTitle('🗓 План действий на 30 дней')});
    plan.forEach(function(t,i){
      blocks.push({h:'<div style="display:flex;gap:10px;margin:0 0 9px;font-size:12.5px;line-height:1.55;color:#3c3346"><span style="flex:0 0 auto;width:21px;height:21px;border-radius:7px;background:#160f1d;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">'+(i+1)+'</span><span><b style="color:#160f1d">'+esc10(typeof t.step==='string'?t.step:'')+'</b>'+(t.why?' — <span style="color:#6a6175">'+esc10(typeof t.why==='string'?t.why:'')+'</span>':'')+(t.week?' <span style="color:#9a92a5;font-size:11px">· неделя '+t.week+'</span>':'')+'</span></div>'});
    });
  }
  return blocks;
}
function pageNode(){
  var d=D.createElement('div');
  d.style.cssText='width:'+PG_W+'px;height:'+PG_H+'px;background:#fff;color:#160f1d;font-family:Onest,Arial,sans-serif;display:flex;flex-direction:column;overflow:hidden;position:relative';
  return d;
}
function headFoot(page,bodyHtml){
  var b=brand();
  var who=b.on?(b.name||'Аудит-отчёт'):'Viora Media';
  var logo=b.on&&b.logo?'<img src="'+b.logo+'" style="height:22px;max-width:120px;object-fit:contain"/>':'<span style="display:inline-flex;align-items:center;gap:7px"><span style="width:10px;height:10px;border-radius:50%;background:'+b.color+'"></span><b style="font-size:12.5px">'+esc10(who)+'</b></span>';
  page.innerHTML=
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 40px 12px;border-bottom:1px solid #efeaf4">'+logo+
      '<span style="font-size:10px;color:#9a92a5;letter-spacing:1.6px;text-transform:uppercase">AI-аудит YouTube-канала</span></div>'+
    '<div class="pg-body" style="flex:1;padding:22px 40px 10px;overflow:hidden">'+bodyHtml+'</div>'+
    '<div style="display:flex;justify-content:space-between;padding:10px 40px 16px;border-top:1px solid #efeaf4;font-size:10px;color:#9a92a5"><span>'+esc10(b.on?((b.name||'')+(b.site?' · '+b.site:'')):'Сделано в Viora Media — viora.media')+'</span><span class="v10pg"></span></div>';
  return q('.pg-body',page);
}
function coverPage(){
  var s=S10(),ch=s.channel||{},ai=s.ai||{},b=brand();
  var score=ai.score!=null?Math.round(ai.score):null;
  if(score==null){try{score=(W.localScore&&W.localScore({signals:s.signals||{}}).score)||null;}catch(e){}}
  var dateStr=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
  var page=pageNode();
  var c=b.color;
  if(b.on){ /* white-label: светлая обложка в цветах агентства */
    page.innerHTML=
      '<div style="flex:1;display:flex;flex-direction:column;padding:60px 64px;background:linear-gradient(160deg,#ffffff 60%,'+c+'14)">'+
        '<div style="display:flex;align-items:center;gap:14px">'+(b.logo?'<img src="'+b.logo+'" style="height:46px;max-width:220px;object-fit:contain"/>':'<b style="font-size:21px">'+esc10(b.name||'Агентство')+'</b>')+'</div>'+
        '<div style="margin-top:120px"><div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:'+c+';font-weight:800">Аудит YouTube-канала</div>'+
        '<div style="font-size:40px;font-weight:800;line-height:1.15;margin-top:14px">'+esc10(ch.title||'Канал')+'</div>'+
        '<div style="font-size:14px;color:#6a6175;margin-top:10px">'+esc10(ch.handle||'')+' · '+fmt10(ch.subs||0)+' подписчиков · '+fmt10(ch.videoCount||0)+' роликов</div></div>'+
        '<div style="margin-top:56px;display:flex;gap:14px">'+
          '<div style="background:#160f1d;color:#fff;border-radius:18px;padding:20px 26px;text-align:center"><div style="font-size:42px;font-weight:800;color:'+c+'">'+(score!=null?score:'—')+'</div><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#b8aec6">Индекс роста / 100</div></div>'+
          '<div style="border:1px solid #e9e3f0;border-radius:18px;padding:20px 26px;display:flex;flex-direction:column;justify-content:center"><div style="font-size:11px;color:#9a92a5;text-transform:uppercase;letter-spacing:1px">Дата отчёта</div><div style="font-size:16px;font-weight:700;margin-top:5px">'+dateStr+'</div></div>'+
        '</div>'+
        '<div style="margin-top:auto;font-size:12px;color:#9a92a5">Подготовлено: <b style="color:#160f1d">'+esc10(b.name||'')+'</b>'+(b.site?' · '+esc10(b.site):'')+'</div>'+
      '</div>';
  }else{
    page.innerHTML=
      '<div style="flex:1;display:flex;flex-direction:column;padding:60px 64px;background:linear-gradient(135deg,#160f1d,#2b1030 55%,'+hx(c,0.35)+');color:#fff">'+
        '<div style="display:flex;align-items:center;gap:10px"><span style="width:14px;height:14px;border-radius:50%;background:'+c+';box-shadow:0 0 18px '+c+'"></span><b style="font-size:19px">Viora<span style="color:'+c+'">Media</span></b></div>'+
        '<div style="margin-top:120px"><div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#ff8a9e;font-weight:800">AI-аудит YouTube-канала</div>'+
        '<div style="font-size:40px;font-weight:800;line-height:1.15;margin-top:14px">'+esc10(ch.title||'Канал')+'</div>'+
        '<div style="font-size:14px;color:#cfc7d8;margin-top:10px">'+esc10(ch.handle||'')+' · '+fmt10(ch.subs||0)+' подписчиков · '+fmt10(ch.videoCount||0)+' роликов</div></div>'+
        '<div style="margin-top:56px;display:flex;gap:14px">'+
          '<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:20px 26px;text-align:center"><div style="font-size:42px;font-weight:800;color:'+c+'">'+(score!=null?score:'—')+'</div><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#b8aec6">Индекс роста / 100</div></div>'+
          '<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:20px 26px;display:flex;flex-direction:column;justify-content:center"><div style="font-size:11px;color:#b8aec6;text-transform:uppercase;letter-spacing:1px">Дата отчёта</div><div style="font-size:16px;font-weight:700;margin-top:5px">'+dateStr+'</div></div>'+
        '</div>'+
        '<div style="margin-top:auto;font-size:12px;color:#b8aec6">Данные: YouTube Data API v3 · Анализ: Viora AI · Отчёт собран автоматически за ~60 секунд</div>'+
      '</div>';
  }
  return page;
}
function summaryPage(){
  var s=S10(),ai=s.ai||{},sig=s.signals||{};
  var all=[].concat(s.shorts||[],s.longs||[]);
  var medV=Math.round(med10(all.map(function(v){return v.viewsPerDay;}))||0);
  var page=pageNode();
  var body=headFoot(page,'');
  var focus=[];
  try{
    var plan=(ai.action_plan||[]).filter(function(t){return t&&t.step;});
    focus=plan.filter(function(t){return t.priority==='high';}).concat(plan).slice(0,3);
  }catch(e){}
  var vs=null;try{vs=W.v10VsForPdf();}catch(e){}
  var hl='';
  if(vs&&vs.verdicts.length){
    hl='<div style="margin-top:16px"><div style="font-size:13px;font-weight:800;margin-bottom:7px">⚔️ Позиция в нише</div>'+
      vs.verdicts.map(function(v){return '<div style="display:flex;gap:8px;font-size:12.5px;line-height:1.5;margin:0 0 6px;color:#3c3346"><span>'+(v.good?'✅':'⚠️')+'</span><span>'+esc10(v.d)+'</span></div>';}).join('')+'</div>';
  }
  body.innerHTML=bTitle('📌 Выводы на одной странице')+
    (ai.main_leak?'<div style="background:#fff2f5;border:1px solid #ffd7de;border-left:5px solid '+brand().color+';border-radius:11px;padding:14px 16px;font-size:13.5px;line-height:1.6;color:#3c2630"><b style="display:block;margin-bottom:4px;color:#160f1d">🩺 Главная утечка роста</b>'+esc10(typeof ai.main_leak==='string'?ai.main_leak:'')+'</div>':'')+
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">'+
      bStat('Медиана просм/день',fmt10(medV))+
      bStat('Ритм выхода',(sig.posting?('раз в ~'+sig.posting.medianGapDays+' дн'):'—'))+
      bStat('Лучшее окно',(sig.bestWindow&&sig.bestWindow.day?(sig.bestWindow.day+' · '+(sig.bestWindow.hourRange||'')):'—'))+
    '</div>'+
    (focus.length?'<div style="margin-top:18px"><div style="font-size:13px;font-weight:800;margin-bottom:8px">🎯 Три первых шага</div>'+
      focus.map(function(t,i){return '<div style="display:flex;gap:10px;margin:0 0 9px;font-size:13px;line-height:1.55;color:#3c3346"><span style="flex:0 0 auto;width:22px;height:22px;border-radius:8px;background:'+brand().color+';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800">'+(i+1)+'</span><span><b style="color:#160f1d">'+esc10(t.step)+'</b>'+(t.why?' — <span style="color:#6a6175">'+esc10(t.why)+'</span>':'')+'</span></div>';}).join('')+'</div>':'')+
    hl+
    '<div style="margin-top:18px;font-size:11.5px;color:#9a92a5;line-height:1.6">Полная детализация — на следующих страницах: метрики, сравнение с топами ниши, темы, идеи и план на 30 дней.</div>';
  return page;
}
function tocPage(sections){
  var page=pageNode();
  var body=headFoot(page,'');
  body.innerHTML=bTitle('Содержание')+sections.map(function(s){
    return '<div style="display:flex;align-items:baseline;gap:8px;font-size:13.5px;padding:9px 2px;border-bottom:1px dashed #e9e3f0;color:#3c3346"><span style="font-weight:700;color:#160f1d">'+esc10(s.t)+'</span><span style="flex:1"></span><span style="color:'+brand().color+';font-weight:800">стр. '+s.p+'</span></div>';
  }).join('');
  return page;
}
/* ---------- сборка PDF ---------- */
W.v8PdfCompact=W.exportPDF; /* компактный V8-вариант остаётся доступен */
W.exportPDF=async function(ev){
  var btn=(ev&&ev.target)||(W.event&&W.event.target)||null;
  var old=btn?btn.textContent:'';
  if(btn){btn.textContent='⏳ Собираю отчёт…';btn.disabled=true;}
  var wrapEl=null;
  try{
    if(!S10().channel)throw new Error('сначала проанализируй канал');
    if(W.vEnsureLib){await W.vEnsureLib('html2canvas');await W.vEnsureLib('jspdf');}
    if(!W.html2canvas||!W.jspdf)throw new Error('библиотеки не загрузились (нужен интернет)');
    wrapEl=D.createElement('div');
    wrapEl.style.cssText='position:fixed;left:-12000px;top:0;z-index:-1;background:#fff';
    D.body.appendChild(wrapEl);

    /* 1) контентные страницы с постраничной раскладкой блоков */
    var blocks=pdfBlocks();
    var pages=[],sections=[];
    var cur=null,curBody=null;
    var startPage=3; /* 1 обложка, 2 оглавление */
    function newPage(){
      cur=pageNode();curBody=headFoot(cur,'');
      wrapEl.appendChild(cur);pages.push(cur);
    }
    newPage();
    for(var i=0;i<blocks.length;i++){
      var b=blocks[i];
      var tmp=D.createElement('div');tmp.innerHTML=b.h;
      var nodes=Array.prototype.slice.call(tmp.childNodes);
      nodes.forEach(function(n){curBody.appendChild(n);});
      var bodyTop=curBody.getBoundingClientRect().top;
      var lastEl0=curBody.lastElementChild;
      var usedH=lastEl0?(lastEl0.getBoundingClientRect().bottom-bodyTop):0;
      if(usedH>PG_BODY&&curBody.children.length>nodes.length){
        nodes.forEach(function(n){try{curBody.removeChild(n);}catch(e){}});
        /* заголовок секции не должен висеть последним — забираем с собой */
        var carry=[];
        var lastEl=curBody.lastElementChild;
        if(lastEl&&lastEl.getAttribute&&lastEl.getAttribute('data-keep')==='1'){curBody.removeChild(lastEl);carry.push(lastEl);}
        newPage();
        carry.forEach(function(n){curBody.appendChild(n);});
        nodes.forEach(function(n){curBody.appendChild(n);});
      }
      if(b.sect)sections.push({t:b.sect.replace(/^[^\wа-яА-ЯёЁ]+\s*/,''),p:startPage+pages.length-1});
    }
    sections=[{t:'Выводы на одной странице',p:3}].concat(sections.map(function(s){return {t:s.t,p:s.p+1};}));
    /* у summary фиксированная страница 3, контент начинается с 4 */

    /* 2) собираем полный порядок: обложка, оглавление, выводы, контент */
    var cover=coverPage();wrapEl.insertBefore(cover,wrapEl.firstChild);
    var summ=summaryPage();wrapEl.appendChild(summ);
    var toc=tocPage(sections);wrapEl.appendChild(toc);
    var ordered=[cover,toc,summ].concat(pages);
    var total=ordered.length;
    ordered.forEach(function(p,i){
      var el=q('.v10pg',p);
      if(el)el.textContent='стр. '+(i+1)+' из '+total;
    });

    /* 3) рендер: каждая страница отдельным канвасом — блоки не режутся */
    var jsPDF=W.jspdf.jsPDF;
    var pdf=new jsPDF('p','mm','a4');
    for(var p=0;p<ordered.length;p++){
      if(btn)btn.textContent='⏳ Страница '+(p+1)+' из '+total+'…';
      var canvas=await W.html2canvas(ordered[p],{backgroundColor:'#ffffff',scale:2,useCORS:true,logging:false,windowWidth:PG_W});
      var img=canvas.toDataURL('image/jpeg',0.93);
      if(p>0)pdf.addPage();
      pdf.addImage(img,'JPEG',0,0,210,297);
    }
    var ch=S10().channel||{};
    var handle=(ch.handle||ch.title||'kanal').replace(/[^\wа-яА-ЯёЁ@-]+/g,'_');
    var b2=brand();
    pdf.save((b2.on&&b2.name?b2.name.replace(/[^\wа-яА-ЯёЁ-]+/g,'_'):'Viora')+'_аудит_'+handle+'_'+new Date().toISOString().slice(0,10)+'.pdf');
    toast10('📄 Отчёт готов: '+total+' страниц, блоки не разрезаны');
  }catch(e){
    console.error(e);
    toast10('Не удалось собрать PDF: '+(e&&e.message||e),'warn');
  }
  if(wrapEl)try{wrapEl.remove();}catch(e){}
  if(btn){btn.textContent=old;btn.disabled=false;}
};
/* кнопка режима агентства в панели экспорта + обновлённая подпись */
function agencyBtn(){
  var bar=q('#dashboard .fab-bar');
  if(!bar||q('#v10AgBtn'))return;
  var b=D.createElement('button');b.className='btn ghost';b.id='v10AgBtn';
  b.textContent='🏢 Режим агентства';
  b.addEventListener('click',W.v10BrandOpen);
  var home=qa('button',bar).filter(function(x){return /Новый анализ/.test(x.textContent);})[0];
  if(home)bar.insertBefore(b,home);else bar.appendChild(b);
  var note=bar.parentNode&&q('.note',bar.parentNode);
  if(note)note.innerHTML='PDF-отчёт — многостраничный аудит уровня агентства: обложка, оглавление, выводы на 1 странице, сравнение с топами ниши и план. «Режим агентства» добавит твой логотип и цвета (white-label). «Полный дашборд» — скрин всего отчёта.';
}

/* =====================================================================
   V10 · АУДИТ УДЕРЖАНИЯ ОДНОГО ВИДЕО (гипотезы по таймкодам)
   ===================================================================== */
var RT={vid:null,res:null};
W.v10RetOpen=function(prefillUrl){
  var body=ov10('v10ret','🎯','Аудит удержания','гипотезы по таймкодам: где уходят и что перемонтировать');
  if(!q('#v10rtUrl',body)){
    body.innerHTML='<div class="v10-card" style="max-width:860px;margin:0 auto">'+
      '<div class="v10-h4">🎯 Разбор удержания одного ролика <span class="v10-new">NEW</span></div>'+
      '<div class="v10-note">Viora соберёт данные ролика, главы из описания и комментарии с таймкодами — и построит карту риска: где хук слабый, на каких минутах зрители вероятнее всего уходят и что перемонтировать. Это гипотезы по косвенным сигналам; точную кривую смотри в YouTube Studio → Аналитика → Удержание.</div>'+
      '<div class="v10-lab">Ссылка на видео</div>'+
      '<div class="v10-row"><input class="v10-in" id="v10rtUrl" style="flex:1;min-width:220px" placeholder="https://youtu.be/…"/><button class="v10-btn" id="v10rtGo">Разобрать →</button></div>'+
      '<div id="v10rtOut" style="margin-top:16px"></div></div>';
    q('#v10rtGo',body).addEventListener('click',function(){retRun(body);});
    q('#v10rtUrl',body).addEventListener('keydown',function(e){if(e.key==='Enter')retRun(body);});
  }
  if(prefillUrl)q('#v10rtUrl',body).value=prefillUrl;
};
function parseChapters(desc,dur){
  var out=[];
  String(desc||'').split('\n').forEach(function(line){
    var m=line.match(/(?:^|\s)((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[-–—·]?\s*(.{3,80})/);
    if(m){var s=tcToSec(m[1]);if(s!=null&&s<dur)out.push({sec:s,name:m[2].trim()});}
  });
  out.sort(function(a,b){return a.sec-b.sec;});
  return out.slice(0,20);
}
async function retRun(body){
  var out=q('#v10rtOut',body),url=q('#v10rtUrl',body).value.trim();
  if(!url){out.innerHTML='<div class="v10-err">Вставь ссылку на видео</div>';return;}
  out.innerHTML='<div class="v10-load"><span class="v10-spin"></span>Собираю данные ролика, главы и комментарии с таймкодами…</div>';
  try{
    var pi=W.parseInput(url);
    if(!pi||pi.type!=='video')throw new Error('нужна ссылка именно на видео (youtu.be/… или watch?v=…)');
    var vids=await W.getVideos([pi.value]);
    var v=vids&&vids[0];
    if(!v)throw new Error('видео не нашлось — проверь ссылку');
    if(v.isShort)toast10('Это Shorts — разбор сфокусируется на первых секундах','warn');
    RT.vid=v;
    var chapters=parseChapters(v.desc,v.dur);
    /* комментарии: ищем упоминания таймкодов */
    var comments=[],tcMentions=[];
    try{
      var cd=await W.ytFetch('commentThreads?part=snippet&videoId='+v.id+'&maxResults=80&order=relevance&textFormat=plainText');
      (cd.items||[]).forEach(function(it){
        var sn=it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet;
        if(!sn)return;
        var txt=String(sn.textDisplay||'').slice(0,300);
        comments.push({t:txt,likes:sn.likeCount||0});
        var ms=txt.match(/(?:\d{1,2}:)?\d{1,2}:\d{2}/g);
        if(ms)ms.forEach(function(tc){var s=tcToSec(tc);if(s!=null&&s<v.dur)tcMentions.push({sec:s,quote:txt.slice(0,140)});});
      });
    }catch(e){/* комментарии могут быть закрыты */}
    out.innerHTML='<div class="v10-load"><span class="v10-spin"></span>AI-монтажёр строит карту риска по таймкодам…</div>';
    var s=S10();
    var norm=s.channel?('Канал: '+s.channel.title+', медиана просмотров/день по каналу: '+Math.round(med10([].concat(s.shorts||[],s.longs||[]).map(function(x){return x.viewsPerDay;}))||0)):'';
    var sys='Ты — топовый монтажёр-аналитик YouTube. По косвенным сигналам строишь гипотезы удержания. Отвечай СТРОГО валидным JSON без markdown: {"verdict":"общий вывод 2-3 предложения","hook":{"score":число 1-10,"weak":"что слабо в первых 15-30 сек","fix":"как переснять/перемонтировать хук","rewrite":"готовая фраза-хук для начала"},"timeline":[{"from":"м:сс","to":"м:сс","risk":"high|mid|low","hypothesis":"почему тут вероятен отвал","fix":"что сделать при перемонтаже"}],"reedit":["3-5 конкретных действий перемонтажа"],"checks":["3 пункта: что проверить в YouTube Studio после правок"]}. Таймлайн: 4-7 сегментов, покрой весь хронометраж от 0:00 до конца, сегменты не пересекаются.';
    var user='ВИДЕО: «'+v.title+'» · длительность '+secToTc(v.dur)+' ('+v.dur+' сек) · '+v.views+' просмотров · '+v.likes+' лайков · '+v.comments+' комментариев · вышло '+Math.round(v.age)+' дн назад. '+norm+
      '\nОПИСАНИЕ (начало): '+String(v.desc||'').slice(0,400)+
      '\nГЛАВЫ: '+(chapters.length?chapters.map(function(c){return secToTc(c.sec)+' '+c.name;}).join(' | '):'нет')+
      '\nТАЙМКОДЫ ИЗ КОММЕНТАРИЕВ (моменты, которые зрители обсуждают): '+(tcMentions.length?tcMentions.slice(0,12).map(function(m){return secToTc(m.sec)+' — «'+m.quote+'»';}).join(' | '):'нет')+
      '\nТОП-КОММЕНТАРИИ: '+(comments.length?comments.slice(0,10).map(function(c){return '«'+c.t.slice(0,120)+'» ('+c.likes+'👍)';}).join(' | '):'нет');
    var r=await ai10(sys,user,1900);
    if(!r||!r.timeline)throw new Error('AI вернула неполный ответ — нажми «Разобрать» ещё раз');
    RT.res=r;
    retRender(out,v,r,chapters,tcMentions);
  }catch(e){
    out.innerHTML='<div class="v10-err">⚠️ '+esc10(e&&e.message||e)+'</div>';
  }
}
function retRender(out,v,r,chapters,tcMentions){
  var segs=(r.timeline||[]).map(function(t){
    var a=tcToSec(t.from)||0,b=tcToSec(t.to);
    if(b==null||b<=a)b=Math.min(v.dur,a+Math.max(20,v.dur*0.12));
    return {a:clamp10(a,0,v.dur),b:clamp10(b,0,v.dur),risk:(t.risk==='high'||t.risk==='low')?t.risk:'mid',hy:t.hypothesis||'',fx:t.fix||''};
  }).filter(function(s){return s.b>s.a;});
  var bar=segs.map(function(s){
    var l=(s.a/v.dur*100).toFixed(2),w=((s.b-s.a)/v.dur*100).toFixed(2);
    return '<span class="seg '+s.risk+'" style="left:'+l+'%;width:'+w+'%" title="'+esc10(secToTc(s.a)+'–'+secToTc(s.b))+'"></span>';
  }).join('');
  var hookScore=r.hook&&r.hook.score!=null?clamp10(Math.round(r.hook.score),1,10):null;
  var cards=segs.map(function(s){
    var riskName={high:'высокий риск отвала',mid:'средний риск',low:'держит внимание'}[s.risk];
    return '<div class="v10rt-it"><div class="tc">⏱ '+secToTc(s.a)+' – '+secToTc(s.b)+' <span class="risk '+s.risk+'">'+riskName+'</span></div>'+
      (s.hy?'<div class="hy">'+esc10(s.hy)+'</div>':'')+
      (s.fx?'<div class="fx">🛠 '+esc10(s.fx)+'</div>':'')+'</div>';
  }).join('');
  var reedit=(r.reedit||[]).map(function(x){return '<div class="np-a" style="border-bottom:1px solid rgba(255,255,255,.05);display:flex;gap:10px;padding:9px 0;font-size:13px;line-height:1.5"><span class="dot" style="color:#ff2d55;font-weight:800">▸</span><span>'+esc10(x)+'</span></div>';}).join('');
  var checks=(r.checks||[]).map(function(x){return '<span class="v10-tag">☑ '+esc10(x)+'</span>';}).join('');
  out.innerHTML=
    '<div class="v10-h4" style="margin-top:4px">«'+esc10(v.title)+'» · '+secToTc(v.dur)+'</div>'+
    '<div class="v10-note">'+esc10(r.verdict||'')+'</div>'+
    (r.hook?'<div class="v10rt-it" style="border-color:rgba(255,45,85,.35);margin-top:12px"><div class="tc">🪝 Хук (0:00–0:30)'+(hookScore!=null?' <span class="risk '+(hookScore>=7?'low':hookScore>=4?'mid':'high')+'">'+hookScore+'/10</span>':'')+'</div>'+
      (r.hook.weak?'<div class="hy">'+esc10(r.hook.weak)+'</div>':'')+
      (r.hook.fix?'<div class="fx">🛠 '+esc10(r.hook.fix)+'</div>':'')+
      (r.hook.rewrite?'<div class="fx" style="border-left-color:rgba(42,171,238,.6);background:rgba(42,171,238,.07)">💬 Готовый хук: «'+esc10(r.hook.rewrite)+'»</div>':'')+'</div>':'')+
    '<div class="v10-h4" style="margin-top:18px">🗺 Карта риска по хронометражу</div>'+
    '<div class="v10rt-bar">'+bar+'</div>'+
    '<div class="v10rt-scale"><span>0:00</span><span>'+secToTc(v.dur/2)+'</span><span>'+secToTc(v.dur)+'</span></div>'+
    '<div class="v10rt-leg"><span><i style="background:rgba(255,70,95,.7)"></i>высокий риск</span><span><i style="background:rgba(255,170,70,.6)"></i>средний</span><span><i style="background:rgba(95,224,160,.55)"></i>держит</span>'+(tcMentions&&tcMentions.length?'<span style="margin-left:auto">💬 таймкодов в комментах: '+tcMentions.length+'</span>':'')+'</div>'+
    cards+
    (reedit?'<div class="v10-h4" style="margin-top:18px">✂️ Что перемонтировать в первую очередь</div>'+reedit:'')+
    (checks?'<div style="margin-top:14px">'+checks+'</div>':'')+
    '<div class="v10-row" style="margin-top:16px">'+
      '<button class="v10-btn sm" id="v10rtPlan">➕ Фиксы — в план развития</button>'+
      '<span class="v10-note">точную кривую удержания сверяй в YouTube Studio</span>'+
    '</div>';
  var pb=q('#v10rtPlan',out);
  if(pb)pb.addEventListener('click',function(){
    var n=0;
    (r.reedit||[]).slice(0,4).forEach(function(x){
      try{W.vAddToPlan(pb,'Перемонтаж «'+String(v.title).slice(0,40)+'»: '+x,'Аудит удержания по таймкодам');n++;}catch(e){}
    });
    pb.textContent='✓ В плане: '+n;pb.disabled=true;
  });
}
/* лаунчеры: пункт меню 🧰 + кнопка в секции «Разбор видео» */
function retLaunchers(){
  try{
    var menu=q('#v6NavMenu');
    if(menu&&!q('#v10retMi',menu)){
      var mi=D.createElement('button');mi.className='v6-mi';mi.id='v10retMi';
      mi.innerHTML='<span class="ic">🎯</span> Аудит удержания <span class="v10-new" style="margin-left:auto">NEW</span>';
      mi.addEventListener('click',function(){menu.classList.remove('open');W.v10RetOpen(topLongUrl());});
      menu.appendChild(mi);
    }
  }catch(e){}
  try{
    var bulk=q('#bulkCta');
    if(bulk&&!q('#v10retBtn')){
      var b=D.createElement('button');b.className='btn ghost';b.id='v10retBtn';b.style.whiteSpace='nowrap';
      b.textContent='🎯 Аудит удержания';
      b.title='Карта риска по таймкодам: где зрители уходят и что перемонтировать';
      b.addEventListener('click',function(){W.v10RetOpen(topLongUrl());});
      bulk.appendChild(b);
    }
  }catch(e){}
}
function topLongUrl(){
  try{
    var s=S10();
    var top=(s.longs||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;})[0]||(s.shorts||[])[0];
    return top?('https://youtu.be/'+top.id):'';
  }catch(e){return '';}
}

/* =====================================================================
   V10 · TELEGRAM: импорт реального канала · недельная сетка · A/B-тестер
   ===================================================================== */
var DOW=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
var DOW_FULL=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];

/* ---------- helpers ---------- */
function tgText(m){
  var t=m.text;
  if(typeof t==='string')return t;
  if(Array.isArray(t))return t.map(function(x){return typeof x==='string'?x:(x&&x.text)||'';}).join('');
  return '';
}
function numLoose(v){
  if(v==null)return null;
  if(typeof v==='number')return v;
  var s=String(v).trim().replace(',','.');
  var m=s.match(/^([\d.]+)\s*([KkКк])?([MmМм])?/);
  if(!m)return null;
  var n=parseFloat(m[1]);if(isNaN(n))return null;
  if(m[2])n*=1e3;if(m[3])n*=1e6;
  return Math.round(n);
}
function heatColor(v,max){
  if(!max||!v)return 'rgba(255,255,255,.05)';
  var a=0.12+0.75*(v/max);
  return 'rgba(42,171,238,'+a.toFixed(2)+')';
}

/* =====================================================================
   ИМПОРТ КАНАЛА ИЗ JSON (Telegram Desktop → Экспорт истории чата)
   ===================================================================== */
W.v10TgImpOpen=function(){
  var body=ov10('v10imp','📥','Импорт канала','реальная аналитика из JSON-экспорта Telegram Desktop');
  if(q('#v10impDrop',body))return;
  body.innerHTML='<div class="v10-card" style="max-width:880px;margin:0 auto">'+
    '<div class="v10-h4">📥 Импорт реального канала <span class="v10-new">NEW</span></div>'+
    '<div class="v10-note">Без ботов и доступов: выгрузи историю канала из <b>Telegram Desktop</b> и закинь файл сюда — Viora построит полную аналитику по реальным постам. Файл обрабатывается прямо в браузере и никуда не отправляется.</div>'+
    '<div class="v10-note" style="margin-top:8px;background:rgba(42,171,238,.07);border:1px solid rgba(42,171,238,.25);border-radius:11px;padding:10px 13px">📋 Как выгрузить: Telegram Desktop → открой свой канал → ⋮ → <b>Экспорт истории чата</b> → формат <b>JSON</b>, медиа можно выключить → дождись файла <b>result.json</b>.</div>'+
    '<div class="v10drop" id="v10impDrop" style="margin-top:14px"><span class="big">🗂</span><b>Перетащи result.json сюда</b><br/>или нажми, чтобы выбрать файл</div>'+
    '<input type="file" id="v10impFile" accept=".json,application/json" style="display:none"/>'+
    '<div id="v10impOut" style="margin-top:16px"></div></div>';
  var drop=q('#v10impDrop',body),file=q('#v10impFile',body);
  drop.addEventListener('click',function(){file.click();});
  ['dragenter','dragover'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over');});});
  ['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over');});});
  drop.addEventListener('drop',function(e){var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)impRead(f,body);});
  file.addEventListener('change',function(){if(this.files&&this.files[0])impRead(this.files[0],body);});
};
function impRead(f,body){
  var out=q('#v10impOut',body);
  if(!/\.json$/i.test(f.name)&&f.type!=='application/json'){out.innerHTML='<div class="v10-err">Нужен JSON-файл (result.json из экспорта Telegram Desktop)</div>';return;}
  if(f.size>120*1024*1024){out.innerHTML='<div class="v10-err">Файл больше 120 МБ — экспортируй без медиа (галочки фото/видео выключить)</div>';return;}
  out.innerHTML='<div class="v10-load"><span class="v10-spin"></span>Читаю '+esc10(f.name)+' ('+(f.size/1048576).toFixed(1)+' МБ)…</div>';
  var r=new FileReader();
  r.onerror=function(){out.innerHTML='<div class="v10-err">Не удалось прочитать файл</div>';};
  r.onload=function(){
    try{
      var data=JSON.parse(r.result);
      impAnalyze(data,out);
    }catch(e){out.innerHTML='<div class="v10-err">Это не похоже на JSON-экспорт Telegram: '+esc10(e.message||e)+'</div>';}
  };
  r.readAsText(f);
}
function impAnalyze(data,out){
  var msgs=(data&&data.messages)||[];
  var posts=msgs.filter(function(m){return m&&m.type==='message';}).map(function(m){
    var d=m.date_unixtime?new Date(+m.date_unixtime*1000):new Date(m.date);
    var txt=tgText(m);
    var views=numLoose(m.views);
    var fwd=numLoose(m.forwards);
    var reacts=0;
    if(Array.isArray(m.reactions))m.reactions.forEach(function(x){reacts+=(+x.count||0);});
    var media=m.media_type||(m.photo?'photo':(m.poll?'poll':(m.file?'file':'')));
    return {d:d,txt:txt,len:txt.length,views:views,fwd:fwd,reacts:reacts,media:media,tags:(txt.match(/#[\wА-Яа-яЁё]+/g)||[]),fromFwd:!!m.forwarded_from};
  }).filter(function(p){return p.d&&!isNaN(p.d.getTime());});
  if(!posts.length){out.innerHTML='<div class="v10-err">В файле не нашлось постов. Убедись, что экспортирован именно канал и формат — JSON.</div>';return;}
  posts.sort(function(a,b){return a.d-b.d;});
  var name=esc10(data.name||'канал');
  var first=posts[0].d,last=posts[posts.length-1].d;
  var weeks=Math.max(1,(last-first)/(7*DAY10));
  var perWeek=+(posts.length/weeks).toFixed(1);
  var hasViews=posts.some(function(p){return p.views!=null;});
  var hasReacts=posts.some(function(p){return p.reacts>0;});
  /* heat по часам и дням */
  var byHour=Array(24).fill(0),byHourW=Array(24).fill(0),byDow=Array(7).fill(0),byDowW=Array(7).fill(0);
  var gaps=[],lens=[],mediaCnt={},tagCnt={};
  posts.forEach(function(p,i){
    byHour[p.d.getHours()]++;byDow[p.d.getDay()]++;
    if(p.views){byHourW[p.d.getHours()]+=p.views;byDowW[p.d.getDay()]+=p.views;}
    if(i)gaps.push((p.d-posts[i-1].d)/DAY10);
    if(p.len)lens.push(p.len);
    var mk=p.media||'текст';mediaCnt[mk]=(mediaCnt[mk]||0)+1;
    p.tags.forEach(function(t){tagCnt[t.toLowerCase()]=(tagCnt[t.toLowerCase()]||0)+1;});
  });
  var medGap=+med10(gaps).toFixed(1),maxGap=gaps.length?Math.max.apply(null,gaps):0;
  var medLen=Math.round(med10(lens));
  var avgViews=hasViews?Math.round(posts.reduce(function(s,p){return s+(p.views||0);},0)/posts.filter(function(p){return p.views!=null;}).length):null;
  var bestHours=byHour.map(function(c,h){return {h:h,c:c,w:byHourW[h]};}).filter(function(x){return x.c>0;})
    .sort(function(a,b){return hasViews?(b.w/b.c-a.w/a.c):(b.c-a.c);}).slice(0,3).map(function(x){return x.h;});
  var topDowIdx=byDow.indexOf(Math.max.apply(null,byDow));
  var topPosts=hasViews?posts.slice().sort(function(a,b){return (b.views||0)-(a.views||0);}).slice(0,5):[];
  var topTags=Object.keys(tagCnt).sort(function(a,b){return tagCnt[b]-tagCnt[a];}).slice(0,8);
  /* сохранить для недельной сетки */
  lset('v10_tgimp',{name:data.name||'',posts:posts.length,perWeek:perWeek,bestHours:bestHours,topDow:topDowIdx,medLen:medLen,ts:Date.now()});
  var maxH=Math.max.apply(null,byHour)||1,maxD=Math.max.apply(null,byDow)||1;
  var heat=byHour.map(function(c,h){return '<span style="background:'+heatColor(c,maxH)+'" data-l="'+h+':00 — '+c+' пост.'+(hasViews&&c?(' · ~'+fmt10(Math.round(byHourW[h]/c))+' просм'):'')+'"></span>';}).join('');
  var wd=[1,2,3,4,5,6,0].map(function(i){
    return '<div class="d '+(i===topDowIdx?'top':'')+'"><div class="n">'+DOW[i]+'</div><div class="c">'+byDow[i]+'</div>'+(hasViews&&byDow[i]?'<div class="n">~'+fmt10(Math.round(byDowW[i]/byDow[i]))+'</div>':'')+'</div>';
  }).join('');
  var mediaTags=Object.keys(mediaCnt).sort(function(a,b){return mediaCnt[b]-mediaCnt[a];}).map(function(k){
    var icons={'текст':'📝',photo:'🖼',video_file:'🎬',voice_message:'🎙',video_message:'🟢',sticker:'🩵',animation:'🎞',audio_file:'🎵',poll:'📊',file:'📎'};
    return '<span class="v10-tag">'+(icons[k]||'📄')+' '+esc10(k==='текст'?'текст':k)+': '+mediaCnt[k]+' ('+Math.round(mediaCnt[k]/posts.length*100)+'%)</span>';
  }).join('');
  var stats=''+
    '<div class="v10imp-stat"><div class="k">Постов</div><div class="v">'+fmt10(posts.length)+'</div><div class="n">'+first.toLocaleDateString('ru-RU')+' → '+last.toLocaleDateString('ru-RU')+'</div></div>'+
    '<div class="v10imp-stat"><div class="k">Ритм</div><div class="v">'+perWeek+'/нед</div><div class="n">медианный перерыв '+medGap+' дн · макс '+Math.round(maxGap)+' дн</div></div>'+
    '<div class="v10imp-stat"><div class="k">Длина поста</div><div class="v">'+fmt10(medLen)+'</div><div class="n">символов (медиана)</div></div>'+
    (avgViews!=null?'<div class="v10imp-stat"><div class="k">Просмотры</div><div class="v">~'+fmt10(avgViews)+'</div><div class="n">в среднем на пост</div></div>':'')+
    (hasReacts?'<div class="v10imp-stat"><div class="k">Реакции</div><div class="v">'+fmt10(posts.reduce(function(s,p){return s+p.reacts;},0))+'</div><div class="n">всего за период</div></div>':'');
  out.innerHTML='<div class="v10-h4">📊 '+name+' — реальная аналитика</div>'+
    '<div class="v10imp-stats">'+stats+'</div>'+
    '<div class="v10-h4" style="margin-top:18px">🕐 Когда выходят посты'+(hasViews?' (и когда их лучше смотрят)':'')+'</div>'+
    '<div class="v10heat">'+heat+'</div><div class="v10heat-lab"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>'+
    '<div class="v10wd">'+wd+'</div>'+
    '<div class="v10-h4" style="margin-top:18px">📦 Форматы</div><div>'+mediaTags+'</div>'+
    (topTags.length?'<div class="v10-h4" style="margin-top:14px">#️⃣ Хэштеги</div><div>'+topTags.map(function(t){return '<span class="v10-tag">'+esc10(t)+' ×'+tagCnt[t]+'</span>';}).join('')+'</div>':'')+
    (topPosts.length?'<div class="v10-h4" style="margin-top:18px">🏆 Топ-посты по просмотрам</div>'+topPosts.map(function(p){
      return '<div class="v10wk-card"><div class="hd"><span class="day">'+p.d.toLocaleDateString('ru-RU')+'</span><span class="typ">'+fmt10(p.views||0)+' 👁'+(p.fwd?' · '+fmt10(p.fwd)+' ↗':'')+(p.reacts?' · '+fmt10(p.reacts)+' ❤':'')+'</span></div><div class="bd">'+esc10((p.txt||'(медиа без текста)').slice(0,220))+(p.txt.length>220?'…':'')+'</div></div>';
    }).join(''):'')+
    '<div id="v10impAi" style="margin-top:18px"><button class="v10-btn" id="v10impAiBtn">🧠 AI-вердикт и план улучшений</button></div>'+
    '<div class="v10-row" style="margin-top:14px"><button class="v10-btn ghost sm" onclick="try{v4Close(\'v10imp\')}catch(e){};v10WeekOpen()">🗓 Собрать недельную сетку под эти данные →</button></div>';
  var aiBtn=q('#v10impAiBtn',out);
  aiBtn.addEventListener('click',async function(){
    var box=q('#v10impAi',out);
    box.innerHTML='<div class="v10-load"><span class="v10-spin"></span>AI-редактор изучает канал…</div>';
    try{
      var sys='Ты — главред Telegram-каналов. Отвечай СТРОГО валидным JSON: {"verdict":"вывод 2-3 предложения о канале","strengths":["2-3 сильные стороны"],"fixes":["4-5 конкретных улучшений с обоснованием"],"rubrics":["5 идей регулярных рубрик под тематику канала"]}';
      var sample=posts.slice(-12).filter(function(p){return p.txt;}).slice(-6).map(function(p){return '«'+p.txt.slice(0,200)+'»';}).join(' | ');
      var user='Канал «'+(data.name||'')+'»: '+posts.length+' постов, ритм '+perWeek+'/нед, медианная длина '+medLen+' зн., перерывы до '+Math.round(maxGap)+' дн. Форматы: '+JSON.stringify(mediaCnt)+'. '+(avgViews!=null?('Средние просмотры: '+avgViews+'. '):'')+'Лучшие часы: '+bestHours.join(', ')+'. Примеры последних постов: '+sample;
      var r=await ai10(sys,user,1500);
      box.innerHTML='<div class="v10-h4">🧠 AI-вердикт</div><div class="v10-note" style="font-size:13.5px;color:#e3e1ea">'+esc10(r.verdict||'')+'</div>'+
        ((r.strengths||[]).length?'<div style="margin-top:10px">'+(r.strengths||[]).map(function(x){return '<div class="v10-note" style="margin:4px 0">💪 '+esc10(x)+'</div>';}).join('')+'</div>':'')+
        ((r.fixes||[]).length?'<div class="v10-h4" style="margin-top:14px">🔧 Что улучшить</div>'+(r.fixes||[]).map(function(x){return '<div class="np-a" style="display:flex;gap:9px;padding:7px 0;font-size:13px;line-height:1.5"><span style="color:#2aabee;font-weight:800">▸</span><span>'+esc10(x)+'</span></div>';}).join(''):'')+
        ((r.rubrics||[]).length?'<div class="v10-h4" style="margin-top:14px">🗂 Идеи рубрик</div><div>'+(r.rubrics||[]).map(function(x){return '<span class="v10-tag">💡 '+esc10(x)+'</span>';}).join('')+'</div>':'');
    }catch(e){box.innerHTML='<div class="v10-err">AI недоступна: '+esc10(e.message||e)+'. Попробуй ещё раз.</div><button class="v10-btn sm" style="margin-top:8px" onclick="document.getElementById(\'v10impAiBtn\')&&document.getElementById(\'v10impAiBtn\').click()">Повторить</button>';}
  });
}

/* =====================================================================
   НЕДЕЛЬНАЯ СЕТКА ПОСТОВ
   ===================================================================== */
W.v10WeekOpen=function(){
  var body=ov10('v10week','🗓','Неделя постов','готовая сетка на 7 дней с расписанием и календарём');
  if(q('#v10wkTheme',body))return;
  var imp=lget('v10_tgimp',null);
  body.innerHTML='<div class="v10-card" style="max-width:860px;margin:0 auto">'+
    '<div class="v10-h4">🗓 Недельная сетка постов <span class="v10-new">NEW</span></div>'+
    '<div class="v10-note">Опиши канал и цель — Пост-завод соберёт готовую неделю: 7 постов с типами, временем выхода и текстами. Дальше — одна кнопка «в календарь» или .ics для телефона.'+(imp?' <b style="color:#7ec9f2">Учту данные импорта «'+esc10(imp.name)+'»: лучшие часы '+imp.bestHours.map(function(h){return h+':00';}).join(', ')+'.</b>':'')+'</div>'+
    '<div class="v10-lab">О чём канал и для кого</div><input class="v10-in" id="v10wkTheme" placeholder="напр.: канал про рост YouTube-каналов для авторов 20–35"/>'+
    '<div class="v10-lab">Цель недели</div><div class="v10-row" id="v10wkGoal">'+
      ['рост подписчиков','вовлечённость','прогрев к продаже','удержание ядра'].map(function(g,i){return '<button class="v10-chip'+(i===0?' on':'')+'" data-g="'+g+'">'+g+'</button>';}).join('')+'</div>'+
    '<div class="v10-row" style="margin-top:16px"><button class="v10-btn" id="v10wkGo">⚙️ Собрать неделю</button></div>'+
    '<div id="v10wkOut" style="margin-top:16px"></div></div>';
  qa('#v10wkGoal .v10-chip',body).forEach(function(c){
    c.addEventListener('click',function(){qa('#v10wkGoal .v10-chip',body).forEach(function(x){x.classList.remove('on');});c.classList.add('on');});
  });
  q('#v10wkGo',body).addEventListener('click',function(){weekRun(body);});
};
function nextMonday(){
  var d=new Date();d.setHours(0,0,0,0);
  var add=(8-d.getDay())%7;if(!add)add=7;
  d.setDate(d.getDate()+add);
  return d;
}
async function weekRun(body){
  var out=q('#v10wkOut',body);
  var theme=q('#v10wkTheme',body).value.trim();
  var goal=(q('#v10wkGoal .on',body)||{}).dataset?q('#v10wkGoal .on',body).dataset.g:'рост подписчиков';
  if(!theme){out.innerHTML='<div class="v10-err">Опиши, о чём канал — одной строкой</div>';return;}
  var imp=lget('v10_tgimp',null);
  var times=imp&&imp.bestHours&&imp.bestHours.length?imp.bestHours.map(function(h){return ('0'+h).slice(-2)+':00';}):['09:00','19:00'];
  out.innerHTML='<div class="v10-load"><span class="v10-spin"></span>Пост-завод собирает неделю…</div>';
  try{
    var sys='Ты — контент-директор Telegram-каналов. Отвечай СТРОГО валидным JSON: {"week":[{"day":"Пн|Вт|Ср|Чт|Пт|Сб|Вс","time":"ЧЧ:ММ","type":"польза|вовлечение|личное|кейс|анонс|опрос|дайджест","title":"короткое название","text":"готовый текст поста 300-700 знаков, с хуком в первой строке, эмодзи умеренно, с CTA в конце"}]}. Ровно 7 постов, Пн-Вс, разнообразь типы (минимум 4 разных), время бери из списка предпочтительных.';
    var user='Канал: '+theme+'. Цель недели: '+goal+'. Предпочтительное время: '+times.join(', ')+'.'+(imp?(' Реальные данные канала: '+imp.perWeek+' постов/нед, медианная длина '+imp.medLen+' знаков.'):'');
    var r=await ai10(sys,user,2400);
    var week=(r&&r.week||[]).slice(0,7);
    if(week.length<5)throw new Error('AI вернула неполную неделю — попробуй ещё раз');
    var mon=nextMonday();
    var dayIdx={'Пн':0,'Вт':1,'Ср':2,'Чт':3,'Пт':4,'Сб':5,'Вс':6};
    week.forEach(function(p,i){p.__off=dayIdx[p.day]!=null?dayIdx[p.day]:i;});
    var cards=week.map(function(p,i){
      var d=new Date(mon.getTime()+p.__off*DAY10);
      var dateStr=d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
      return '<div class="v10wk-card"><div class="hd"><span class="day">'+esc10(p.day||DOW_FULL[i])+' · '+dateStr+' · '+esc10(p.time||times[0])+'</span><span class="typ">'+esc10(p.type||'пост')+'</span><span class="sp"></span><button class="v6-copy" onclick="v10CopyWk(this,'+i+')">⧉ копировать</button></div><div class="bd"><b>'+esc10(p.title||'')+'</b>\n\n'+esc10(p.text||'')+'</div></div>';
    }).join('');
    W.__v10week={week:week,mon:mon};
    out.innerHTML=cards+
      '<div class="v10-row" style="margin-top:16px">'+
        '<button class="v10-btn" id="v10wkCal">📅 Всю неделю — в контент-календарь</button>'+
        '<button class="v10-btn ghost" id="v10wkIcs">📆 Скачать .ics (в телефон)</button>'+
      '</div><div class="v10-note" style="margin-top:8px">Календарь Viora: меню 🧰 → Контент-календарь. Файл .ics открывается любым календарём — будут напоминания о каждом посте.</div>';
    q('#v10wkCal',out).addEventListener('click',function(){
      var n=0;
      week.forEach(function(p){
        var d=new Date(mon.getTime()+p.__off*DAY10);
        if(calPut(d,'✈️ '+(p.time||'')+' '+(p.title||p.type),'pub'))n++;
      });
      this.textContent='✓ В календаре: '+n+' постов';this.disabled=true;
      toast10('🗓 Неделя в контент-календаре');
    });
    q('#v10wkIcs',out).addEventListener('click',function(){
      var evs=week.map(function(p){
        var d=new Date(mon.getTime()+p.__off*DAY10);
        var hm=String(p.time||'10:00').split(':');
        d.setHours(+hm[0]||10,+hm[1]||0,0,0);
        return {date:d,durMin:20,title:'✈️ TG-пост: '+(p.title||p.type),desc:(p.text||'').slice(0,800)};
      });
      dlFile('viora_неделя_постов.ics',buildIcs(evs,'Viora: неделя постов'),'text/calendar');
    });
  }catch(e){out.innerHTML='<div class="v10-err">⚠️ '+esc10(e.message||e)+'</div>';}
}
W.v10CopyWk=function(btn,i){
  try{
    var p=W.__v10week.week[i];
    var t=(p.title?p.title+'\n\n':'')+(p.text||'');
    navigator.clipboard.writeText(t).then(function(){btn.textContent='✓';setTimeout(function(){btn.textContent='⧉ копировать';},1200);});
  }catch(e){toast10('Не удалось скопировать','warn');}
};

/* =====================================================================
   A/B-ТЕСТЕР ПОСТОВ
   ===================================================================== */
W.v10AbOpen=function(){
  var body=ov10('v10ab','⚖️','A/B-тестер постов','два варианта → вердикт до публикации');
  if(q('#v10abA',body))return;
  body.innerHTML='<div class="v10-card" style="max-width:900px;margin:0 auto">'+
    '<div class="v10-h4">⚖️ A/B-тестер постов <span class="v10-new">NEW</span></div>'+
    '<div class="v10-note">Вставь два варианта одного поста — Viora прогонит оба через локальный анализатор (хук, структура, CTA, читабельность) и AI-редактора, выберет победителя и соберёт улучшенную версию.</div>'+
    '<div class="v10ab-grid" style="margin-top:14px">'+
      '<div><div class="v10-lab">Вариант A</div><textarea class="v10-in" id="v10abA" placeholder="Текст первого варианта…"></textarea></div>'+
      '<div><div class="v10-lab">Вариант B</div><textarea class="v10-in" id="v10abB" placeholder="Текст второго варианта…"></textarea></div>'+
    '</div>'+
    '<div class="v10-row" style="margin-top:14px"><button class="v10-btn" id="v10abGo">🥊 Сравнить</button></div>'+
    '<div id="v10abOut" style="margin-top:16px"></div></div>';
  q('#v10abGo',body).addEventListener('click',function(){abRun(body);});
};
async function abRun(body){
  var out=q('#v10abOut',body);
  var A=q('#v10abA',body).value.trim(),B=q('#v10abB',body).value.trim();
  if(!A||!B){out.innerHTML='<div class="v10-err">Нужны оба варианта — A и B</div>';return;}
  var la,lb;
  try{la=W.tgAnalyzeLocal(A);lb=W.tgAnalyzeLocal(B);}catch(e){la=lb=null;}
  var local='';
  if(la&&lb){
    local='<div class="v10ab-grid">'+
      '<div class="v10ab-res" id="v10abResA"><h5>Вариант A <span class="sc">'+la.overall+'/100</span></h5>'+W.tgRadarSVG(la.s)+'</div>'+
      '<div class="v10ab-res" id="v10abResB"><h5>Вариант B <span class="sc">'+lb.overall+'/100</span></h5>'+W.tgRadarSVG(lb.s)+'</div></div>';
  }
  out.innerHTML=local+'<div class="v10-load" id="v10abWait"><span class="v10-spin"></span>AI-редактор выносит вердикт…</div><div id="v10abAi"></div>';
  try{
    var sys='Ты — главред Telegram-каналов с опытом A/B-тестов. Отвечай СТРОГО валидным JSON: {"winner":"A|B","why":"3-4 предложения: почему этот вариант выиграет по открытиям и удержанию","checklist":["4-5 пунктов: что проверить перед публикацией"],"best":"улучшенная финальная версия поста, объединяющая сильные стороны обоих вариантов"}';
    var user='ВАРИАНТ A:\n'+A.slice(0,1200)+'\n\nВАРИАНТ B:\n'+B.slice(0,1200)+(la&&lb?('\n\nЛокальные скоры: A='+la.overall+'/100, B='+lb.overall+'/100'):'');
    var r=await ai10(sys,user,1800);
    var w=(r.winner==='B')?'B':'A';
    var el=q('#v10abRes'+w,out);
    if(el){el.classList.add('win');q('h5',el).insertAdjacentHTML('beforeend',' <span class="v10ab-win-tag">ПОБЕДИТЕЛЬ</span>');}
    q('#v10abWait',out).remove();
    q('#v10abAi',out).innerHTML=
      '<div class="v10-h4" style="margin-top:14px">🏆 Вердикт: вариант '+w+'</div>'+
      '<div class="v10-note" style="font-size:13.5px;color:#e3e1ea">'+esc10(r.why||'')+'</div>'+
      ((r.checklist||[]).length?'<div class="v10-h4" style="margin-top:14px">☑️ Чеклист перед публикацией</div>'+(r.checklist||[]).map(function(x){return '<div style="display:flex;gap:9px;padding:6px 0;font-size:13px;line-height:1.5"><span style="color:#5fe0a0;font-weight:800">☑</span><span>'+esc10(x)+'</span></div>';}).join(''):'')+
      (r.best?'<div class="v10-h4" style="margin-top:14px">✨ Улучшенная версия</div><div class="v10wk-card"><div class="bd">'+esc10(r.best)+'</div><div class="v10-row" style="margin-top:10px"><button class="v6-copy" onclick="navigator.clipboard.writeText(this.dataset.t).then(()=>{this.textContent=\'✓ скопировано\'})" data-t="'+esc10(r.best)+'">⧉ копировать</button></div></div>':'');
  }catch(e){
    var wait=q('#v10abWait',out);if(wait)wait.remove();
    q('#v10abAi',out).innerHTML='<div class="v10-err">AI недоступна: '+esc10(e.message||e)+'. Локальные скоры выше всё равно работают.</div>';
  }
}

/* ---------- кнопки в сайдбаре TG-студии ---------- */
function tgButtons(){
  var tabs=q('#tgScreen .stg-tabs');
  if(!tabs||q('.v10tgb'))return;
  var defs=[
    ['📥 Импорт канала','v10TgImpOpen'],
    ['🗓 Неделя постов','v10WeekOpen'],
    ['⚖️ A/B-тестер','v10AbOpen']
  ];
  var anchor=q('#tgScreen .stg-newchat.v7pz')||tabs;
  defs.reverse().forEach(function(d){
    var b=D.createElement('button');b.className='stg-newchat v10tgb';
    b.innerHTML=d[0]+' <span style="font-size:10px;background:rgba(42,171,238,.25);border-radius:6px;padding:2px 6px;margin-left:4px">NEW</span>';
    b.addEventListener('click',function(){W[d[1]]();});
    anchor.insertAdjacentElement('afterend',b);
  });
}

/* =====================================================================
   ИНИЦИАЛИЗАЦИЯ V10
   ===================================================================== */
function v10AfterDash(){
  try{injectVs();}catch(e){}
  try{renderNicheSection();}catch(e){}
  try{v10RenderBA();}catch(e){}
  try{minerBridgeBtn();}catch(e){}
  try{retLaunchers();}catch(e){}
  try{agencyBtn();}catch(e){}
  try{extendTour();}catch(e){}
  try{
    var ch=S10().channel;
    if(ch&&ch.id)lset('v10_last',{id:ch.id,handle:ch.handle||'',title:ch.title||'',ts:Date.now()});
  }catch(e){}
}
(function(){
  var rd=W.renderDashboard;
  if(typeof rd==='function'){
    W.renderDashboard=function(){
      var r=rd.apply(this,arguments);
      setTimeout(v10AfterDash,150);
      return r;
    };
  }
})();
function v10Init(){
  mobInit();
  howButtons();
  tgButtons();
  setTimeout(tgButtons,1200);
  setTimeout(homeReminder,1500);
  setTimeout(extendTour,800);
  /* если дашборд уже отрисован (горячая перезагрузка) */
  if(q('#dashboard .verdict'))setTimeout(v10AfterDash,300);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',v10Init);else v10Init();
})();
