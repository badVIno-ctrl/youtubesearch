/* ============================================================== */
/*  VIORA V2: ленивые библиотеки, PWA, онбординг-тур, «мой канал»  */
/* ============================================================== */
(function(){
"use strict";
var W=window,D=document;
function toastSafe(m,k,ms){try{if(W.vToast){W.vToast(m,k||'warn',ms);return;}}catch(e){}try{W.toast&&W.toast(m);}catch(e){}}
function escSafe(s){try{if(W.esc)return W.esc(String(s));}catch(e){}return String(s).replace(/[<>&"]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});}
function fmtSafe(n){try{if(W.fmt)return W.fmt(n);}catch(e){}return String(n);}
function stv(){try{return (typeof STATE!=='undefined')?STATE:null;}catch(e){return null;}}

/* ---------- 1. Ленивая загрузка тяжёлых библиотек ---------- */
var LIBS={
  html2canvas:{src:'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',ok:function(){return !!W.html2canvas;}},
  jspdf:{src:'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',ok:function(){return !!(W.jspdf&&W.jspdf.jsPDF);}},
  gis:{src:'https://accounts.google.com/gsi/client',ok:function(){return !!(W.google&&W.google.accounts&&W.google.accounts.oauth2);}}
};
var LIBP={};
W.vEnsureLib=function(name){
  var L=LIBS[name];if(!L)return Promise.reject(new Error('неизвестная библиотека'));
  if(L.ok())return Promise.resolve();
  if(LIBP[name])return LIBP[name];
  LIBP[name]=new Promise(function(res,rej){
    var s=D.createElement('script');s.src=L.src;s.async=true;
    s.onload=function(){L.ok()?res():rej(new Error(name+' не инициализировалась'));};
    s.onerror=function(){LIBP[name]=null;rej(new Error(name+': не загрузилась (сеть)'));};
    D.head.appendChild(s);
  });
  return LIBP[name];
};
/* предзагрузка в простое — чтобы PDF/карточки были мгновенными */
function idlePreload(){['html2canvas','jspdf'].forEach(function(n){W.vEnsureLib(n).catch(function(){});});}
if(D.readyState==='complete')setTimeout(idlePreload,2200);
else W.addEventListener('load',function(){(W.requestIdleCallback||function(f){setTimeout(f,2200);})(idlePreload);});

/* ---------- 2. PWA: установка на главный экран ---------- */
try{
  var mIcon=function(sz){
    var c=D.createElement('canvas');c.width=c.height=sz;var x=c.getContext('2d');var r=sz*0.22;
    x.fillStyle='#FF2D55';x.beginPath();x.moveTo(r,0);x.arcTo(sz,0,sz,sz,r);x.arcTo(sz,sz,0,sz,r);x.arcTo(0,sz,0,0,r);x.arcTo(0,0,sz,0,r);x.closePath();x.fill();
    x.fillStyle='#fff';x.beginPath();x.moveTo(sz*0.40,sz*0.30);x.lineTo(sz*0.72,sz*0.50);x.lineTo(sz*0.40,sz*0.70);x.closePath();x.fill();
    return c.toDataURL('image/png');
  };
  var man={name:'Viora Media — AI-аудит YouTube',short_name:'Viora',start_url:'./',scope:'./',display:'standalone',background_color:'#0A0A0A',theme_color:'#FF2D55',
    icons:[{src:mIcon(192),sizes:'192x192',type:'image/png'},{src:mIcon(512),sizes:'512x512',type:'image/png'}]};
  if(location.protocol!=='file:'){
    var ml=D.createElement('link');ml.rel='manifest';ml.id='vManifest';
    ml.href=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:'application/manifest+json'}));
    D.head.appendChild(ml);
  }
}catch(e){}

/* ---------- 3. Онбординг-тур для новичков ---------- */
var TOUR_KEY='viora_tour_done';
function tourDone(){try{return localStorage.getItem(TOUR_KEY)==='1';}catch(e){return true;}}
function markTour(){try{localStorage.setItem(TOUR_KEY,'1');}catch(e){}}
/* подсказка на главной при самом первом визите */
var hintTries=0;
function heroHint(){
  try{
    if(tourDone()||localStorage.getItem('viora_hint_seen')==='1')return;
    var inp=D.getElementById('urlInput');
    if(!inp||!inp.offsetParent){if(hintTries++<30)setTimeout(heroHint,1500);return;}
    localStorage.setItem('viora_hint_seen','1');
    var b=D.createElement('div');b.className='vtour-hint';
    b.innerHTML='👋 Начни здесь: вставь ссылку на свой канал — полный разбор займёт около минуты';
    var shell=inp.closest('.searchbox')||inp.parentNode;shell.style.position='relative';shell.appendChild(b);
    var kill=function(){try{b.remove();}catch(e){}};
    inp.addEventListener('focus',kill,{once:true});setTimeout(kill,15000);
  }catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){setTimeout(heroHint,1200);});
else setTimeout(heroHint,1200);

var TOUR_STEPS=[
  {sel:'#weekFocusSection',t:'🎯 Фокус недели',d:'Начни отсюда: три самых важных действия из всего разбора. Сделай их на этой неделе — и не утонешь в остальных секциях.'},
  {sel:'#nsBtn,#nextShootSection',t:'🎬 План следующего видео',d:'Одна кнопка — и ИИ-продюсер соберёт полный план съёмки: тему, заголовки, хук, структуру с таймингом и чек-лист. План сохранится в «Мои съёмки».'},
  {sel:'.verdict',t:'🩺 Главная утечка роста',d:'Главная причина, почему канал не растёт быстрее. Секции ниже раскрывают её подробнее — возвращайся к ним, когда сделаешь первые шаги.'}
];
var tourIdx=0,tourEls=null;
function tourUI(){
  if(tourEls)return tourEls;
  var hl=D.createElement('div');hl.id='vTourHl';
  var tip=D.createElement('div');tip.id='vTourTip';
  D.body.appendChild(hl);D.body.appendChild(tip);
  tourEls={hl:hl,tip:tip};return tourEls;
}
function endTour(){markTour();if(tourEls){try{tourEls.hl.remove();tourEls.tip.remove();}catch(e){}tourEls=null;}}
W.__vTourNext=function(){tourIdx++;showStep();};
W.__vTourSkip=function(){endTour();};
function showStep(){
  var st=TOUR_STEPS[tourIdx];
  if(!st){endTour();toastSafe('Удачи! Все секции разбора — ниже по странице 👇','ok',3500);return;}
  var el=null;st.sel.split(',').some(function(s){var c=D.querySelector(s.trim());if(c&&c.offsetParent){el=c;return true;}return false;});
  if(!el){tourIdx++;showStep();return;}
  var u=tourUI();
  try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){}
  setTimeout(function(){
    var r=el.getBoundingClientRect(),pad=10;
    u.hl.style.cssText='position:fixed;z-index:9991;pointer-events:none;border-radius:18px;transition:all .35s ease;'
      +'left:'+(r.left-pad)+'px;top:'+(r.top-pad)+'px;width:'+(r.width+pad*2)+'px;height:'+(r.height+pad*2)+'px;'
      +'box-shadow:0 0 0 9999px rgba(5,4,8,.78),0 0 0 2px #FF2D55;';
    u.tip.innerHTML='<div class="tt">'+st.t+'</div><div class="td">'+st.d+'</div>'
      +'<div class="tb"><button class="skip" onclick="__vTourSkip()">Пропустить</button>'
      +'<span class="cnt">'+(tourIdx+1)+' / '+TOUR_STEPS.length+'</span>'
      +'<button class="next" onclick="__vTourNext()">'+(tourIdx===TOUR_STEPS.length-1?'Понятно!':'Дальше →')+'</button></div>';
  },430);
}
W.vTourMaybe=function(){
  if(tourDone())return;
  var wf=D.getElementById('weekFocusSection');
  if(!wf)return;
  tourIdx=0;showStep();
};

/* ---------- 4. «Мой канал» через Google (реальные метрики) ---------- */
/* Чтобы включить вход через Google: вставь сюда OAuth Client ID
   (Google Cloud Console → Credentials → OAuth client ID → Web application,
   в Authorized JavaScript origins добавь адреса сайта). */
var OAUTH_CLIENT_ID='';
var MY_TOKEN=null;
function v2Modal(html){
  var ov=D.createElement('div');ov.className='v2ov';
  ov.innerHTML='<div class="v2modal"><button class="x" onclick="this.closest(&quot;.v2ov&quot;).remove()">✕</button>'+html+'</div>';
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  D.body.appendChild(ov);return ov;
}
function myChSetup(){
  v2Modal('<h3>🔐 Вход через Google пока не настроен</h3>'
   +'<p>Когда владелец сайта включит вход через Google, здесь появятся <b>реальное удержание, время просмотра и подписки</b> твоего канала из YouTube Analytics.</p>'
   +'<p>А пока просто вставь ссылку на свой канал в поле выше — полный разбор работает и без входа.</p>'
   +'<details><summary style="cursor:pointer;font-size:13px;color:#ff8da1">Инструкция для владельца сайта (≈5 минут)</summary>'
   +'<ol><li>Зайди в <code>console.cloud.google.com</code> и создай проект.</li>'
   +'<li>В «APIs &amp; Services → Library» включи <b>YouTube Data API v3</b> и <b>YouTube Analytics API</b>.</li>'
   +'<li>Заполни «OAuth consent screen» (External; добавь свой Google-аккаунт в Test users).</li>'
   +'<li>В «Credentials» создай <b>OAuth client ID → Web application</b> и добавь в Authorized JavaScript origins: <code>https://badvino-ctrl.github.io</code> и <code>https://youtubesearch-1cl.pages.dev</code>.</li>'
   +'<li>Полученный Client ID вставь в <code>index.html</code> в константу <code>OAUTH_CLIENT_ID</code> (поиск по файлу) и задеплой.</li></ol></details>');
}
W.vMyChannel=function(){
  if(!OAUTH_CLIENT_ID){myChSetup();return;}
  W.vEnsureLib('gis').then(function(){
    var tc=W.google.accounts.oauth2.initTokenClient({
      client_id:OAUTH_CLIENT_ID,
      scope:'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly',
      callback:function(resp){
        if(resp&&resp.access_token){MY_TOKEN=resp.access_token;myChStart();}
        else toastSafe('Google не выдал доступ — попробуй ещё раз','warn');
      }
    });
    tc.requestAccessToken();
  }).catch(function(e){toastSafe('Не удалось загрузить Google-вход: '+(e&&e.message||''),'err');});
};
function gFetch(url){
  return fetch(url,{headers:{Authorization:'Bearer '+MY_TOKEN}}).then(function(r){
    if(!r.ok)throw new Error('Google API: '+r.status);return r.json();
  });
}
function myChStart(){
  gFetch('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true').then(function(d){
    var it=d.items&&d.items[0];if(!it)throw new Error('канал не найден на этом Google-аккаунте');
    W.__vMyChId=it.id;
    var inp=D.getElementById('urlInput');if(inp)inp.value='https://www.youtube.com/channel/'+it.id;
    toastSafe('Подключён канал «'+((it.snippet&&it.snippet.title)||'')+'» — запускаю разбор','ok',3500);
    if(W.startAnalysis)W.startAnalysis();
  }).catch(function(e){toastSafe('Не получилось получить канал: '+(e&&e.message||''),'err');});
}
W.vMyStatsMaybe=function(){
  try{
    var s=stv();
    if(!MY_TOKEN||!W.__vMyChId||!s||!s.channel||s.channel.id!==W.__vMyChId)return;
    renderMyStats();
  }catch(e){}
};
function renderMyStats(){
  var sec=D.getElementById('myStatsSection'),area=D.getElementById('myStatsArea');if(!sec||!area)return;
  sec.style.display='block';
  area.innerHTML='<div class="ns-load"><span class="sp"></span>Загружаю YouTube Analytics твоего канала…</div>';
  var end=new Date(),start=new Date(Date.now()-28*864e5);
  function ds(d){return d.toISOString().slice(0,10);}
  var base='https://youtubeanalytics.googleapis.com/v2/reports?ids=channel%3D%3DMINE&startDate='+ds(start)+'&endDate='+ds(end);
  Promise.all([
    gFetch(base+'&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost'),
    gFetch(base+'&metrics=averageViewPercentage,views&dimensions=video&sort=-views&maxResults=10')
  ]).then(function(rs){
    var tot=(rs[0].rows&&rs[0].rows[0])||[0,0,0,0,0,0];
    var vids=rs[1].rows||[];
    var s=stv(),names={};
    try{((s&&s.videos)||[]).forEach(function(v){names[v.id]=v.title;});}catch(e){}
    function mmss(x){x=Math.round(+x||0);return Math.floor(x/60)+':'+('0'+(x%60)).slice(-2);}
    var subs=(+tot[4]||0)-(+tot[5]||0);
    area.innerHTML='<div class="mys-grid">'
      +'<div class="mys-tile"><div class="v">'+fmtSafe(+tot[0]||0)+'</div><div class="l">просмотров за 28 дней</div></div>'
      +'<div class="mys-tile"><div class="v">'+fmtSafe(Math.round((+tot[1]||0)/60))+' ч</div><div class="l">время просмотра</div></div>'
      +'<div class="mys-tile"><div class="v">'+mmss(tot[2])+'</div><div class="l">средняя длительность просмотра</div></div>'
      +'<div class="mys-tile"><div class="v">'+Math.round(+tot[3]||0)+'%</div><div class="l">среднее удержание</div></div>'
      +'<div class="mys-tile"><div class="v">'+(subs>=0?'+':'')+fmtSafe(subs)+'</div><div class="l">подписчиков за период</div></div>'
      +'</div>'
      +(vids.length?'<div class="sh-h">Удержание по роликам — топ по просмотрам за 28 дней</div>'
        +vids.map(function(r){
          var p=Math.round(+r[1]||0),col=p>=50?'#36e0a0':p>=35?'#ffb020':'#ff5470';
          return '<div class="mys-row"><span class="t">'+escSafe(names[r[0]]||r[0])+'</span>'
            +'<span class="mys-bar"><i style="width:'+Math.min(100,p)+'%;background:'+col+'"></i></span>'
            +'<span class="pc" style="color:'+col+'">'+p+'%</span></div>';
        }).join('')
        +'<div class="note" style="margin-top:10px">Удержание ниже 35% значит, что зрителя теряют первые секунды — перепиши хук по разделу «Заходы (опенинги)».</div>'
       :'');
  }).catch(function(e){
    area.innerHTML='<div class="ns-load" style="color:#ff8da1">Не удалось загрузить аналитику ('+escSafe(e&&e.message||'')+'). <button class="pbtn ghost" style="margin-left:10px" onclick="vMyStatsMaybe()">Повторить</button></div>';
  });
}
})();
