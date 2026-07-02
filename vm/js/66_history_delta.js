/* ===================================================================== */
/*  HISTORY DELTA PACK (v31)                                             */
/*  Динамика канала между аудитами: снимки метрик, дельты «до/после»,    */
/*  спарклайны. Данные — localStorage (viora_metric_series).             */
/* ===================================================================== */
(function(){
"use strict";
var W=window,D=document;
var KEY='viora_metric_series', PER_CH=30, MAX_CH=20;

function q(s,r){return (r||D).querySelector(s);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function loadAll(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}}
function saveAll(o){try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){
  /* переполнение — режем самые старые серии */
  try{var ks=Object.keys(o);ks.sort(function(a,b){var la=o[a][o[a].length-1],lb=o[b][o[b].length-1];return (la?la.ts:0)-(lb?lb.ts:0);});if(ks.length){delete o[ks[0]];localStorage.setItem(KEY,JSON.stringify(o));}}catch(e2){}
}}
function chKey(ch){return String(ch.id||ch.handle||ch.title||'');}
function getScoreSafe(){try{var s=W.STATE||(typeof STATE!=='undefined'?STATE:null);if(s&&s.ai&&s.ai.score!=null)return Math.round(s.ai.score);if(W.computeScore)return Math.round(W.computeScore());}catch(e){}return null;}

/* ---------- запись снимка ---------- */
function snapshot(){
  try{
    var s=(typeof STATE!=='undefined')?STATE:null;
    if(!s||!s.channel)return;
    var ch=s.channel,k=chKey(ch);if(!k)return;
    var all=loadAll(),arr=all[k]||[];
    var snap={ts:Date.now(),subs:+ch.subs||0,views:+ch.totalViews||0,videos:+ch.videoCount||0,score:getScoreSafe()};
    var last=arr[arr.length-1];
    /* не дублируем: если <30 мин и метрики не изменились — обновляем score */
    if(last&&(snap.ts-last.ts<1800000)&&last.subs===snap.subs&&last.views===snap.views){
      if(snap.score!=null)last.score=snap.score;
    }else{
      arr.push(snap);
      if(arr.length>PER_CH)arr=arr.slice(arr.length-PER_CH);
    }
    all[k]=arr;
    var keys=Object.keys(all);
    if(keys.length>MAX_CH){keys.sort(function(a,b){var la=all[a][all[a].length-1],lb=all[b][all[b].length-1];return (la?la.ts:0)-(lb?lb.ts:0);});delete all[keys[0]];}
    saveAll(all);
    return {arr:arr,key:k,title:ch.title||''};
  }catch(e){return null;}
}

/* ---------- helpers ---------- */
function fmtN(n){
  if(n==null||isNaN(n))return '—';
  var a=Math.abs(n);
  if(a>=1e6)return (n/1e6).toFixed(a>=1e7?0:1).replace(/\.0$/,'')+' млн';
  if(a>=1e3)return (n/1e3).toFixed(a>=1e5?0:1).replace(/\.0$/,'')+' тыс';
  return String(Math.round(n));
}
function fmtDelta(d){
  if(d==null||isNaN(d)||d===0)return null;
  return (d>0?'+':'−')+fmtN(Math.abs(d));
}
function fmtDate(ts){try{return new Date(ts).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}catch(e){return '';}}
function spark(vals,w,h,color){
  var pts=vals.filter(function(v){return v!=null&&!isNaN(v);});
  if(pts.length<2)return '';
  var min=Math.min.apply(null,pts),max=Math.max.apply(null,pts);
  var rng=(max-min)||1,step=w/(pts.length-1);
  var d=pts.map(function(v,i){return (i?'L':'M')+(i*step).toFixed(1)+' '+(h-3-((v-min)/rng)*(h-6)).toFixed(1);}).join(' ');
  var lastX=((pts.length-1)*step).toFixed(1),lastY=(h-3-((pts[pts.length-1]-min)/rng)*(h-6)).toFixed(1);
  return '<svg class="vd-spark" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true">'
    +'<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>'
    +'<circle cx="'+lastX+'" cy="'+lastY+'" r="2.6" fill="'+color+'"/></svg>';
}

/* ---------- панель динамики в дашборде ---------- */
function metricCell(label,cur,prev,vals,color,fmt){
  fmt=fmt||fmtN;
  var d=(prev!=null&&cur!=null)?cur-prev:null;
  var ds=fmtDelta(d);
  var cls=d>0?'up':(d<0?'down':'flat');
  return '<div class="vd-cell">'
    +'<div class="vd-lab">'+label+'</div>'
    +'<div class="vd-val">'+fmt(cur)+(ds?' <span class="vd-diff '+cls+'">'+ds+'</span>':'')+'</div>'
    +(vals&&vals.length>1?spark(vals,120,30,color):'')
    +'</div>';
}
function renderDeltaPanel(info){
  try{
    var host=q('#dashboard');if(!host||!info||!info.arr||info.arr.length<1)return;
    var old=q('#vDeltaPanel');if(old)old.remove();
    var arr=info.arr;
    if(arr.length<2)return; /* нет прошлых аудитов — нечего сравнивать */
    var cur=arr[arr.length-1],prev=arr[arr.length-2],first=arr[0];
    var days=Math.max(1,Math.round((cur.ts-prev.ts)/86400000));
    var sub='с прошлого аудита ('+fmtDate(prev.ts)+(days>1?' · '+days+' дн':'')+') · всего снимков: '+arr.length;
    var take=arr.slice(-12);
    var el=D.createElement('section');
    el.id='vDeltaPanel';
    el.setAttribute('role','region');
    el.setAttribute('aria-label','Динамика канала между аудитами');
    el.innerHTML='<div class="vd-head"><h3>📈 Динамика канала</h3><span class="vd-sub">'+esc(sub)+'</span></div>'
      +'<div class="vd-grid">'
      +metricCell('Подписчики',cur.subs,prev.subs,take.map(function(x){return x.subs;}),'var(--red-2, #4ade80)')
      +metricCell('Просмотры',cur.views,prev.views,take.map(function(x){return x.views;}),'#60a5fa')
      +metricCell('Видео',cur.videos,prev.videos,take.map(function(x){return x.videos;}),'#ffb020')
      +metricCell('Скор Viora',cur.score,prev.score,take.map(function(x){return x.score;}),'#f472b6',function(v){return v==null?'—':String(Math.round(v));})
      +'</div>'
      +'<div class="vd-first">С первого аудита ('+fmtDate(first.ts)+'): '
      +'<b>'+(fmtDelta(cur.subs-first.subs)||'0')+'</b> подписчиков · '
      +'<b>'+(fmtDelta(cur.views-first.views)||'0')+'</b> просмотров</div>';
    /* вставляем после первой карточки дашборда (шапки канала) */
    var firstCard=host.firstElementChild;
    if(firstCard&&firstCard.nextSibling)host.insertBefore(el,firstCard.nextSibling);
    else host.appendChild(el);
  }catch(e){}
}

/* ---------- хук на рендер дашборда ---------- */
function hook(){
  var orig=W.renderDashboard;
  if(typeof orig!=='function'){setTimeout(hook,400);return;}
  if(orig.__vDelta)return;
  var wrapped=function(){
    var r=orig.apply(this,arguments);
    setTimeout(function(){
      var info=snapshot();
      if(info)renderDeltaPanel(info);
      else{
        /* открыто из кэша — рисуем по сохранённой серии без новой записи */
        try{
          var s=(typeof STATE!=='undefined')?STATE:null;
          if(s&&s.channel){var k=chKey(s.channel),all=loadAll();if(all[k])renderDeltaPanel({arr:all[k],key:k});}
        }catch(e){}
      }
    },250);
    return r;
  };
  wrapped.__vDelta=true;
  W.renderDashboard=wrapped;
}
hook();

/* публичные хуки — для отладки и переиспользования другими модулями */
W.__vioraDelta={snapshot:snapshot,render:renderDeltaPanel,series:loadAll};

})();
