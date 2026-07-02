/* =====================================================================
   VIORA V11 PACK — «Продюсер + раскрутка»
   A. Премиум-редизайн: страницы инструментов, Telegram-студия, без «NEW»
   B. Фичи: упаковка видео, сценарий в 1 клик, путь роста (геймификация),
      шер-карточка PNG, мониторинг конкурентов, режиссёр Shorts,
      медиакит для рекламодателей, промо-движок дистрибуции, коллаб-радар
   API-ключи и существующая логика не тронуты — только надстройка.
   ===================================================================== */
(function(){
'use strict';
if(window.__V11)return;window.__V11=true;
var W=window,D=document;

/* ---------------- helpers ---------------- */
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}}
function toast(m,k){try{if(W.vToast){W.vToast(m,k);return;}}catch(e){}try{console.log('[viora]',m);}catch(e){}}
function fmt(n){try{if(typeof W.fmt==='function')return W.fmt(n);}catch(e){}try{return Number(n).toLocaleString('ru-RU');}catch(e){return String(n);}}
function med(a){a=(a||[]).filter(function(x){return typeof x==='number'&&isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
function chid(){try{return (S().channel&&S().channel.id)||'';}catch(e){return '';}}
var DAY=864e5;
async function ai(sys,user,max){
  var r=await W.callMistralRaw(sys,user,max||1500);
  if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){throw new Error('AI вернула не-JSON, попробуй ещё раз');}}
  return r;
}
function copyTxt(t,btn){
  try{navigator.clipboard.writeText(t);}catch(e){
    var ta=D.createElement('textarea');ta.value=t;D.body.appendChild(ta);ta.select();try{D.execCommand('copy');}catch(_){}ta.remove();
  }
  if(btn){var o=btn.textContent;btn.textContent='✓ Скопировано';setTimeout(function(){btn.textContent=o;},1300);}
  toast('Скопировано','ok');
}
W.v11Copy=function(btn){copyTxt(btn.getAttribute('data-c')||'',btn);};
function err11(e){return '<div class="v10-err">⚠️ '+esc((e&&e.message)||e||'что-то пошло не так')+'</div>';}
function load11(t){return '<div class="v10-load"><span class="v10-spin"></span>'+esc(t||'Думаю…')+'</div>';}
function needCh(){return '<div class="v10-note">Сначала проанализируй канал на главном экране — тогда этот инструмент заработает на твоих данных.</div>';}

/* премиум-оверлей в стиле v4-ov с hero-шапкой */
function ov11(id,ic,name,sub){
  var ov=q('#v4ov_'+id);
  if(!ov){
    ov=D.createElement('div');ov.className='v4-ov v11-ov';ov.id='v4ov_'+id;
    ov.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\''+id+'\')">←</button><div class="v4-ttl"><span>'+ic+'</span> '+name+'<small>'+sub+'</small></div><div class="sp"></div></div>'+
      '<div class="v4-body"><div class="v4-wrap" id="v11body_'+id+'">'+
      '<div class="v11-hero"><div class="v11-hero-ic">'+ic+'</div><div><div class="v11-hero-t">'+name+'</div><div class="v11-hero-s">'+sub+'</div></div></div>'+
      '<div id="v11main_'+id+'"></div></div></div>';
    D.body.appendChild(ov);
  }
  ov.classList.add('open');D.body.style.overflow='hidden';
  return q('#v11main_'+id);
}

/* контекст канала для AI */
function nicheName(){
  var id=lget('v10_niche:'+chid(),'');
  return {gaming:'гейминг',edu:'обучение/экспертиза',vlog:'влоги/лайфстайл',review:'обзоры'}[id]||'';
}
function ctx(){
  var s=S();if(!s.channel)return '';
  var longs=(s.longs||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;});
  var top=longs.slice(0,8).map(function(v){return '- «'+v.title+'» — '+fmt(v.views)+' просм, '+Math.round(v.viewsPerDay)+'/день';}).join('\n');
  var weak=longs.slice(-4).map(function(v){return '- «'+v.title+'» — '+Math.round(v.viewsPerDay)+'/день';}).join('\n');
  return 'КАНАЛ: «'+s.channel.title+'», подписчиков: '+fmt(s.channel.subs||0)+', видео в выборке: '+((s.longs||[]).length+(s.shorts||[]).length)+
    (nicheName()?', ниша: '+nicheName():'')+
    '\nМедиана просмотров/день: '+Math.round(med((s.longs||[]).map(function(v){return v.viewsPerDay;})))+
    '\nТОП-РОЛИКИ:\n'+top+(weak?'\nСЛАБЫЕ:\n'+weak:'');
}
function scoreNow(){
  try{var s2=S();if(s2.ai&&s2.ai.score!=null&&isFinite(+s2.ai.score))return Math.round(+s2.ai.score);}catch(e){}
  try{var n=q('.score-ring .num');var v=n&&n.getAttribute('data-count');if(v!=null&&isFinite(+v)&&+v>0)return Math.round(+v);}catch(e){}
  try{if(typeof W.getScore==='function'){var g=W.getScore();if(g!=null&&isFinite(+g))return Math.round(+g);}}catch(e){}
  try{var ls=W.localScore&&W.localScore({signals:(S().signals)||{}});if(ls&&ls.score!=null)return Math.round(ls.score);}catch(e){}
  try{var hs=W.healthScore&&W.healthScore();if(hs&&hs.total!=null)return Math.round(hs.total);}catch(e){}
  return null;
}

/* ---------------- убираем все бейджи NEW ---------------- */
function killNew(root){
  qa('span,em,i,b',root||D).forEach(function(el){
    if(el.children.length===0&&el.textContent.trim()==='NEW')el.remove();
  });
}
try{
  killNew();
  new MutationObserver(function(){killNew();}).observe(D.body,{childList:true,subtree:true});
}catch(e){}

/* ---------------- декор тулзов-плиток в TG-сайдбаре ---------------- */
function decorateTgTiles(){
  qa('.v10tgb').forEach(function(b){
    if(b.__v11)return;b.__v11=1;
    var t=b.textContent.trim();
    var m=t.match(/^(\p{Extended_Pictographic}(?:\uFE0F)?)\s*(.+)$/u);
    var ic=m?m[1]:'•',label=m?m[2]:t;
    b.classList.add('v11-tile');
    b.innerHTML='<span class="v11-tile-ic">'+ic+'</span><span class="v11-tile-tx">'+esc(label)+'</span><span class="v11-tile-ar">›</span>';
  });
}
setInterval(decorateTgTiles,1200);

/* ---------------- меню запуска новых тулзов ---------------- */
var LAUNCH=[];/* {id,ic,name,fn,yt:true} */
function regTool(t){LAUNCH.push(t);}
function injectMenu(){
  var menu=q('#v6NavMenu');if(!menu)return;
  if(!q('#v11menuTtl',menu)){
    var ttl=D.createElement('div');ttl.className='ttl';ttl.id='v11menuTtl';ttl.textContent='Продюсер-центр';
    menu.appendChild(ttl);
  }
  LAUNCH.forEach(function(t){
    if(q('#v11mi_'+t.id,menu))return;
    var mi=D.createElement('button');mi.className='v6-mi';mi.id='v11mi_'+t.id;
    mi.innerHTML='<span class="ic">'+t.ic+'</span> '+t.name;
    mi.addEventListener('click',function(){menu.classList.remove('show');try{t.fn();}catch(e){toast(e.message||'ошибка','warn');}});
    menu.appendChild(mi);
  });
}
setInterval(injectMenu,1500);

/* ---------------- блок «Продюсер-центр» на дашборде ---------------- */
function producerHub(){
  var dash=q('#dashboard');if(!dash||!chid())return;
  if(q('#v11hub')&&q('#v11hub').__ch===chid())return;
  var old=q('#v11hub');if(old)old.remove();
  var host=q('#v10vs')||q('#dashboard .verdict');
  var sec=D.createElement('section');sec.id='v11hub';sec.__ch=chid();sec.className='v11-hub';
  sec.innerHTML='<div class="v11-hub-head"><span class="v11-kicker">Продюсер-центр</span><h3>Раскрутка и монетизация</h3></div>'+
    '<div class="v11-hub-grid">'+LAUNCH.filter(function(t){return t.hub;}).map(function(t){
      return '<button class="v11-hub-card" data-t="'+t.id+'"><span class="ic">'+t.ic+'</span><b>'+t.name+'</b><small>'+t.d+'</small><span class="go">Открыть →</span></button>';
    }).join('')+'</div>';
  if(host&&host.parentNode)host.parentNode.insertBefore(sec,host.nextSibling);else dash.appendChild(sec);
  qa('.v11-hub-card',sec).forEach(function(c){
    c.addEventListener('click',function(){
      var t=LAUNCH.filter(function(x){return x.id===c.getAttribute('data-t');})[0];
      if(t)try{t.fn();}catch(e){toast(e.message||'ошибка','warn');}
    });
  });
}
setInterval(producerHub,1800);

/* ---------------- кнопка «сценарий» на карточках идей ---------------- */
function ideaButtons(){
  qa('#dashboard .idea-card, #dashboard [class*="idea"], .v10cm-idea').forEach(function(card){
    if(card.__v11s)return;
    var ttlEl=card.querySelector('b,h4,.t,.ttl')||card;
    var topic=(ttlEl.textContent||'').trim();
    if(!topic||topic.length<8||topic.length>160)return;
    if(card.querySelector('.v11-scr'))return;
    card.__v11s=1;
    var b=D.createElement('button');b.className='v11-scr';b.type='button';
    b.innerHTML='🎬 Сценарий в 1 клик';
    b.addEventListener('click',function(ev){ev.stopPropagation();
      if(W.v6ToScript){b.setAttribute('data-c',topic);W.v6ToScript(b);}
    });
    card.appendChild(b);
  });
}
setInterval(ideaButtons,2500);

/* экспорт для других частей пака */
W.__v11core={q:q,qa:qa,esc:esc,lget:lget,lset:lset,toast:toast,fmt:fmt,med:med,clamp:clamp,S:S,chid:chid,ai:ai,ov11:ov11,ctx:ctx,nicheName:nicheName,scoreNow:scoreNow,copyTxt:copyTxt,err11:err11,load11:load11,needCh:needCh,regTool:regTool,DAY:DAY};
})();

;
/* ============ V11 часть 2: путь роста, шер-карточка, мониторинг конкурентов ============ */
(function(){
'use strict';
var C=window.__v11core;if(!C)return;
var W=window,D=document,q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,fmt=C.fmt,S=C.S,chid=C.chid,ai=C.ai,ov11=C.ov11,toast=C.toast,DAY=C.DAY;

/* ================= 1. ПУТЬ РОСТА (геймификация) ================= */
function gKey(){return 'v11_growth:'+chid();}
function gData(){var d=lget(gKey(),{});d.visits=d.visits||[];d.goal=d.goal||null;return d;}
function gSave(d){lset(gKey(),d);}
function today(){var t=new Date();return t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);}
function markVisit(){
  if(!chid())return;
  var d=gData();
  if(d.visits.indexOf(today())<0){d.visits.push(today());d.visits=d.visits.slice(-120);gSave(d);}
}
function streak(){
  var d=gData(),set={},i;d.visits.forEach(function(x){set[x]=1;});
  var n=0,t=new Date();
  for(i=0;i<120;i++){
    var k=t.getFullYear()+'-'+('0'+(t.getMonth()+1)).slice(-2)+'-'+('0'+t.getDate()).slice(-2);
    if(set[k])n++;else if(i>0)break; /* сегодня может ещё не быть */
    t=new Date(t.getTime()-DAY);
  }
  return n;
}
function doneList(){return lget('v10_done:'+chid(),[])||[];}
function achievements(){
  var s=S(),d=doneList(),st=streak();
  var subs=(s.channel&&s.channel.subs)||0;
  var hist=[];try{hist=W.loadHistory?W.loadHistory(chid()):[];}catch(e){}
  var A=[
    {ic:'🔍',t:'Первый аудит',ok:!!s.channel},
    {ic:'🛠',t:'Совет внедрён',ok:d.length>=1},
    {ic:'⚙️',t:'5 советов внедрено',ok:d.length>=5},
    {ic:'🔥',t:'Серия 3 дня',ok:st>=3},
    {ic:'⚡',t:'Серия 7 дней',ok:st>=7},
    {ic:'📈',t:'2+ замера динамики',ok:hist.length>=2},
    {ic:'🎯',t:'Цель индекса задана',ok:!!gData().goal},
    {ic:'💼',t:'1000+ подписчиков',ok:subs>=1000}
  ];
  return A;
}
W.v11SetGoal=function(){
  var sc=C.scoreNow()||50;
  var v=prompt('Целевой индекс роста (сейчас ~'+sc+'):',String(Math.min(100,sc+10)));
  if(!v)return;var d=gData();d.goal=Math.max(1,Math.min(100,+v||sc+10));gSave(d);renderGrowth(true);
};
function renderGrowth(force){
  var dash=q('#dashboard');if(!dash||!chid())return;
  var host=q('#v11hub');if(!host)return;
  var old=q('#v11growth');
  if(old&&!force&&old.__ch===chid())return;
  if(old)old.remove();
  markVisit();
  var st=streak(),d=gData(),sc=C.scoreNow(),A=achievements(),got=A.filter(function(a){return a.ok;}).length;
  var goal=d.goal,pr=goal&&sc?Math.min(100,Math.round(sc/goal*100)):null;
  var sec=D.createElement('div');sec.id='v11growth';sec.__ch=chid();
  sec.innerHTML='<div class="v11-hub-head" style="margin-top:20px"><span class="v11-kicker">Путь роста</span></div>'+
    '<div class="v11-row" style="align-items:stretch">'+
      '<div class="v11-stat"><div class="k">Серия</div><div class="v">🔥 '+st+' '+(st%10===1&&st%100!==11?'день':(st%10>=2&&st%10<=4&&(st%100<10||st%100>=20)?'дня':'дней'))+'</div><div class="n">заходи каждый день — алгоритмы любят системных</div></div>'+
      '<div class="v11-stat"><div class="k">Индекс → цель</div><div class="v">'+(sc!=null?sc:'—')+(goal?' <span style="font-size:13px;color:#9b93a8">/ '+goal+'</span>':'')+'</div>'+
        (pr!=null?'<div class="v11-bar" style="margin-top:8px"><i style="width:'+pr+'%"></i></div>':'<button class="v11-cp" style="margin-top:7px" onclick="v11SetGoal()">🎯 Задать цель</button>')+'</div>'+
      '<div class="v11-stat"><div class="k">Ачивки</div><div class="v">'+got+' / '+A.length+'</div><div class="n" style="font-size:15px;letter-spacing:2px">'+A.map(function(a){return '<span title="'+esc(a.t)+'" style="opacity:'+(a.ok?1:.25)+'">'+a.ic+'</span>';}).join('')+'</div></div>'+
      '<div class="v11-stat" style="display:flex;flex-direction:column;justify-content:center;gap:8px"><button class="v11-btn ghost" style="font-size:12px;padding:9px" onclick="v11ShareCard()">🖼 Шер-карточка роста</button>'+(goal?'<button class="v11-cp" onclick="v11SetGoal()">🎯 Изменить цель</button>':'')+'</div>'+
    '</div>';
  host.appendChild(sec);
}
setInterval(function(){try{renderGrowth();}catch(e){}},2200);

/* ================= 2. ШЕР-КАРТОЧКА PNG ================= */
W.v11ShareCard=function(){
  var s=S();if(!s.channel){toast('Сначала проанализируй канал','warn');return;}
  var sc=C.scoreNow(),st=streak();
  var longs=(s.longs||[]);
  var medv=Math.round(C.med(longs.map(function(v){return v.viewsPerDay;})));
  var cv=D.createElement('canvas');cv.width=1080;cv.height=1350;
  var x=cv.getContext('2d');
  /* фон */
  var g=x.createLinearGradient(0,0,1080,1350);g.addColorStop(0,'#13101a');g.addColorStop(1,'#070609');
  x.fillStyle=g;x.fillRect(0,0,1080,1350);
  function glow(cx,cy,r,col){var rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(0,0,1080,1350);}
  glow(140,80,620,'rgba(255,45,85,.22)');glow(980,1200,700,'rgba(110,70,255,.2)');glow(900,150,500,'rgba(42,171,238,.13)');
  /* рамка */
  x.strokeStyle='rgba(255,255,255,.14)';x.lineWidth=2;
  if(x.roundRect){x.beginPath();x.roundRect(40,40,1000,1270,36);x.stroke();}
  x.textAlign='center';
  x.fillStyle='rgba(255,255,255,.55)';x.font='800 30px Sora,Onest,sans-serif';
  x.fillText('МОЙ ИНДЕКС РОСТА',540,170);
  /* кольцо */
  var cx2=540,cy2=480,R=210;
  x.beginPath();x.arc(cx2,cy2,R,0,Math.PI*2);x.strokeStyle='rgba(255,255,255,.09)';x.lineWidth=34;x.stroke();
  var frac=(sc!=null?sc:50)/100;
  var gr=x.createLinearGradient(cx2-R,cy2,cx2+R,cy2);gr.addColorStop(0,'#ff2d55');gr.addColorStop(1,'#ff7a4d');
  x.beginPath();x.arc(cx2,cy2,R,-Math.PI/2,-Math.PI/2+Math.PI*2*frac);x.strokeStyle=gr;x.lineWidth=34;x.lineCap='round';x.stroke();
  x.fillStyle='#fff';x.font='800 170px Sora,Onest,sans-serif';
  x.fillText(sc!=null?String(sc):'—',540,545);
  x.fillStyle='rgba(255,255,255,.45)';x.font='700 30px Onest,sans-serif';x.fillText('из 100',540,600);
  /* имя канала */
  x.fillStyle='#fff';x.font='800 52px Sora,Onest,sans-serif';
  var name=s.channel.title||'';if(name.length>26)name=name.slice(0,25)+'…';
  x.fillText(name,540,800);
  var nn=C.nicheName();
  x.fillStyle='rgba(255,255,255,.5)';x.font='600 30px Onest,sans-serif';
  x.fillText((nn?('ниша: '+nn+' · '):'')+fmt(s.channel.subs||0)+' подписчиков',540,852);
  /* метрики */
  function chip(cxp,label,val){
    x.fillStyle='rgba(255,255,255,.06)';
    if(x.roundRect){x.beginPath();x.roundRect(cxp-145,920,290,150,24);x.fill();
      x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=2;x.beginPath();x.roundRect(cxp-145,920,290,150,24);x.stroke();}
    x.fillStyle='#fff';x.font='800 46px Sora,Onest,sans-serif';x.fillText(val,cxp,990);
    x.fillStyle='rgba(255,255,255,.45)';x.font='600 22px Onest,sans-serif';x.fillText(label,cxp,1035);
  }
  chip(220,'просм/день (медиана)',fmt(medv));
  chip(540,'роликов в выборке',String(longs.length+(s.shorts||[]).length));
  chip(860,'серия в Viora','🔥 '+st);
  x.fillStyle='rgba(255,255,255,.35)';x.font='700 26px Onest,sans-serif';
  x.fillText('аудит канала за 2 минуты — viora.media',540,1230);
  cv.toBlob(function(b){
    var a=D.createElement('a');a.href=URL.createObjectURL(b);a.download='viora_growth_card.png';
    D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},700);
    toast('Карточка скачана — кидай в сторис/TG','ok');
  },'image/png');
};

/* ================= 3. МОНИТОРИНГ КОНКУРЕНТОВ ================= */
function compKey(){return 'v11_comp:'+chid();}
function compList(){return lget(compKey(),[])||[];}
async function resolveCh(raw){
  var pi=W.parseInput(raw);if(!pi)throw new Error('не понял ссылку');
  var id=await W.resolveChannelId(pi);
  var d=await W.ytFetch('channels?part=snippet,statistics&id='+id);
  if(!d.items||!d.items.length)throw new Error('канал не найден');
  var c=d.items[0];
  return {id:c.id,title:c.snippet.title,subs:+c.statistics.subscriberCount||0};
}
async function freshUploads(chId,days){
  var d=await W.ytFetch('search?part=id&channelId='+chId+'&order=date&type=video&maxResults=10&publishedAfter='+new Date(Date.now()-days*DAY).toISOString().replace(/\.\d+Z/,'Z'));
  var ids=(d.items||[]).map(function(it){return it.id.videoId;}).filter(Boolean);
  if(!ids.length)return [];
  return await W.getVideos(ids);
}
W.v11CompOpen=function(){
  var el=ov11('v11comp','📡','Мониторинг конкурентов','Сохрани конкурентов один раз — Viora будет показывать, что у них залетело за неделю, и предлагать перехват');
  drawComp(el);
};
function drawComp(el){
  var list=compList();
  el.innerHTML='<div class="v10-card"><div class="v10-h4">📋 Мой список конкурентов</div>'+
    (list.length?('<div class="v11-pills" style="margin-bottom:12px">'+list.map(function(c,i){
      return '<span class="v11-pill on" style="cursor:default">'+esc(c.title)+' · '+fmt(c.subs)+' <a href="#" data-i="'+i+'" class="v11del" style="color:#ff8aa0;text-decoration:none;margin-left:6px">✕</a></span>';
    }).join('')+'</div>'):'<div class="v10-note">Пока пусто. Добавь 2–5 каналов своего размера и крупнее — за ними и будем следить.</div>')+
    '<div class="v11-row" style="margin-top:10px"><input class="v10-in v11-in" id="v11compIn" placeholder="youtube.com/@конкурент" style="flex:1;min-width:220px"><button class="v11-btn" id="v11compAdd">＋ Добавить</button></div></div>'+
    '<div id="v11compOut" style="margin-top:16px">'+(list.length?'':'')+'</div>'+
    (list.length?'<div class="v11-row" style="margin-top:14px"><button class="v11-btn" id="v11compScan">🛰 Что у них залетело за 7 дней</button></div>':'');
  q('#v11compAdd',el.parentNode).addEventListener('click',async function(){
    var v=q('#v11compIn').value.trim();if(!v)return;
    var b=this;b.disabled=true;b.textContent='…';
    try{
      var c=await resolveCh(v);
      var l=compList();if(l.length>=8)throw new Error('максимум 8 каналов');
      if(!l.some(function(x){return x.id===c.id;}))l.push(c);
      lset(compKey(),l);drawComp(el);
    }catch(e){toast(e.message||'не получилось','warn');b.disabled=false;b.textContent='＋ Добавить';}
  });
  qa('.v11del',el).forEach(function(a){a.addEventListener('click',function(ev){ev.preventDefault();
    var l=compList();l.splice(+a.getAttribute('data-i'),1);lset(compKey(),l);drawComp(el);});});
  var scan=q('#v11compScan',el);
  if(scan)scan.addEventListener('click',function(){compScan(q('#v11compOut',el));});
}
async function compScan(out){
  out.innerHTML=C.load11('Смотрю свежие ролики конкурентов…');
  try{
    var list=compList(),rows=[];
    for(var i=0;i<list.length;i++){
      var c=list[i];
      try{
        var vids=await freshUploads(c.id,7);
        vids.forEach(function(v){rows.push({ch:c,v:v,heat:v.viewsPerDay/Math.max(1,c.subs)*1000});});
      }catch(e){}
    }
    if(!rows.length){out.innerHTML='<div class="v10-note">За 7 дней у конкурентов нет новых роликов. Загляни позже — список сохранён.</div>';return;}
    rows.sort(function(a,b){return b.heat-a.heat;});
    var top=rows.slice(0,6);
    var brief=top.map(function(r,i){return (i+1)+'. ['+r.ch.title+'] «'+r.v.title+'» — '+fmt(r.v.views)+' просм за '+Math.max(1,Math.round(r.v.age))+' дн';}).join('\n');
    var ideas=null;
    try{
      ideas=await ai('Ты продюсер YouTube-канала. Отвечай ТОЛЬКО валидным JSON: {"items":[{"src":"номер ролика из списка (1-6)","why":"почему залетело, 1 фраза","steal":"как перехватить тренд под наш канал: конкретная тема + угол"}]}. Ровно по одному элементу на каждый ролик из списка. По-русски, без воды.',
        C.ctx()+'\n\nСВЕЖИЕ ХИТЫ КОНКУРЕНТОВ (7 дней):\n'+brief+'\n\nДля каждого: почему залетел и как нам перехватить.',1400);
    }catch(e){}
    out.innerHTML='<div class="v11-res">'+top.map(function(r,i){
      var it=ideas&&ideas.items&&ideas.items[i];
      return '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><span class="v11-tag hot">🔥 '+fmt(Math.round(r.v.viewsPerDay))+' просм/день</span><small>'+esc(r.ch.title)+'</small></div>'+
        '<b class="t" style="margin-top:8px"><a href="https://youtu.be/'+r.v.id+'" target="_blank" style="color:#fff;text-decoration:none">'+esc(r.v.title)+'</a></b>'+
        (it?('<p><b style="color:#ff8aa0">Почему залетело:</b> '+esc(it.why)+'</p><p><b style="color:#7fd0ff">Перехват:</b> '+esc(it.steal)+'</p>'+
          '<button class="v11-scr" data-c="'+esc(it.steal)+'" onclick="v6ToScript(this)">🎬 Сценарий на перехват</button>'):'')+
        '</div>';
    }).join('')+'</div>';
  }catch(e){out.innerHTML=C.err11(e);}
}
C.regTool({id:'comp',ic:'📡',name:'Мониторинг конкурентов',d:'Что залетело у конкурентов за неделю + как перехватить тренд',fn:W.v11CompOpen,hub:true});
})();

;
/* ============ V11 часть 3: упаковка видео, режиссёр Shorts, промо-движок ============ */
(function(){
'use strict';
var C=window.__v11core;if(!C)return;
var W=window,D=document,q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ov11=C.ov11,toast=C.toast;

function vidOptions(){
  var s=S(),longs=(s.longs||[]).slice().sort(function(a,b){return new Date(b.published)-new Date(a.published);});
  return longs.slice(0,30).map(function(v){return '<option value="'+v.id+'">'+esc(v.title.slice(0,70))+' · '+fmt(v.views)+' просм</option>';}).join('');
}
function vidById(id){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v.id===id;})[0];}
function selCard(selId,btnId,btnTxt,note){
  return '<div class="v10-card"><div class="v11-row"><select class="v10-in v11-in" id="'+selId+'" style="flex:1;min-width:240px">'+vidOptions()+'</select>'+
    '<button class="v11-btn" id="'+btnId+'">'+btnTxt+'</button></div>'+(note?'<div class="v10-note" style="margin-top:10px">'+note+'</div>':'')+'</div><div id="'+selId+'Out" style="margin-top:16px"></div>';
}
function cpBtn(label,text){return '<button class="v11-cp" data-c="'+esc(text)+'" onclick="v11Copy(this)">'+label+'</button>';}

/* ================= 1. ФАБРИКА УПАКОВКИ ================= */
W.v11PackOpen=function(){
  var el=ov11('v11pack','🎁','Фабрика упаковки','Заголовки с CTR-прогнозом, описание с SEO, текст превью — по формуле хитов именно твоего канала');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  el.innerHTML=selCard('v11pkSel','v11pkGo','✨ Упаковать','Берём ролик и пересобираем упаковку: 5 заголовков с прогнозом CTR, описание, текст и композицию превью, теги. Формула выводится из твоих топ-роликов.');
  q('#v11pkGo').addEventListener('click',async function(){
    var v=vidById(q('#v11pkSel').value),out=q('#v11pkSelOut');
    if(!v)return;
    out.innerHTML=C.load11('Изучаю формулу хитов канала и собираю упаковку…');
    try{
      var r=await ai('Ты упаковщик YouTube-видео уровня топ-агентства. Отвечай ТОЛЬКО валидным JSON: {"formula":"какая формула заголовков работает на этом канале, 1-2 фразы","titles":[{"t":"заголовок до 70 символов","ctr":число 1-10,"why":"почему сработает, кратко"}],"desc":"описание 500-800 символов: хук в первой строке, структура, 3-5 ключевых фраз органично","preview":{"text":"текст на превью до 4 слов","comp":"композиция кадра","emo":"эмоция в кадре"},"tags":["10-14 тегов"]}. titles: ровно 5, разные приёмы (вопрос, цифра, интрига, выгода, конфликт). ctr — относительный прогноз кликабельности. По-русски.',
        C.ctx()+'\n\nРОЛИК ДЛЯ УПАКОВКИ: «'+v.title+'»\nОписание (фрагмент): '+String(v.desc||'').slice(0,500)+'\nПросмотров: '+fmt(v.views)+' ('+Math.round(v.viewsPerDay)+'/день)',1900);
      var ts=(r.titles||[]).slice(0,5);
      out.innerHTML='<div class="v11-res">'+
        '<div class="v11-res-card"><span class="v11-tag gold">Формула канала</span><p style="margin-top:8px">'+esc(r.formula||'')+'</p></div>'+
        ts.map(function(t){
          var ctr=Math.max(1,Math.min(10,+t.ctr||5));
          return '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0;flex:1">'+esc(t.t)+'</b>'+cpBtn('Копировать',t.t)+'</div>'+
            '<div class="v11-row" style="margin-top:8px;align-items:center"><span class="v11-tag '+(ctr>=7?'hot':'')+'">CTR-прогноз '+ctr+'/10</span><div class="v11-bar" style="flex:1;max-width:180px"><i style="width:'+ctr*10+'%"></i></div></div>'+
            '<p style="margin-top:8px"><small>'+esc(t.why||'')+'</small></p></div>';
        }).join('')+
        '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0">📝 Описание с SEO</b>'+cpBtn('Копировать',r.desc||'')+'</div><p style="white-space:pre-wrap;margin-top:8px">'+esc(r.desc||'')+'</p></div>'+
        '<div class="v11-grid2"><div class="v11-res-card"><b class="t">🖼 Превью</b><p><b>Текст:</b> «'+esc((r.preview||{}).text||'')+'» '+cpBtn('⧉',(r.preview||{}).text||'')+'</p><p><b>Кадр:</b> '+esc((r.preview||{}).comp||'')+'</p><p><b>Эмоция:</b> '+esc((r.preview||{}).emo||'')+'</p></div>'+
        '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0">🏷 Теги</b>'+cpBtn('Копировать все',(r.tags||[]).join(', '))+'</div><p style="margin-top:8px">'+(r.tags||[]).map(function(t){return '<span class="v11-pill" style="cursor:default;display:inline-block;margin:3px 4px 0 0;padding:5px 11px">'+esc(t)+'</span>';}).join('')+'</p></div></div>'+
        '</div>';
    }catch(e){out.innerHTML=C.err11(e);}
  });
};
C.regTool({id:'pack',ic:'🎁',name:'Фабрика упаковки',d:'5 заголовков с CTR-прогнозом, описание, превью и теги под формулу канала',fn:W.v11PackOpen,hub:true});

/* ================= 2. РЕЖИССЁР SHORTS ================= */
W.v11ShortsOpen=function(){
  var el=ov11('v11sh','✂️','Режиссёр Shorts','Из длинного ролика — 3 готовых фрагмента под нарезку: таймкоды, заголовок и первая фраза для каждого');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  var s=S(),nsh=(s.shorts||[]).length;
  el.innerHTML=(nsh===0?'<div class="v10-note" style="margin-bottom:14px">⚡ На канале <b>нет Shorts</b> — это самый недоиспользованный рычаг роста: нарезки из готовых роликов приводят новую аудиторию почти бесплатно.</div>':'')+
    selCard('v11shSel','v11shGo','🎬 Найти фрагменты','Разбираем главы и реакции из комментариев, AI предлагает 3 самых «нарезаемых» момента.');
  q('#v11shGo').addEventListener('click',async function(){
    var v=vidById(q('#v11shSel').value),out=q('#v11shSelOut');
    if(!v)return;
    out.innerHTML=C.load11('Ищу самые цепляющие моменты ролика…');
    try{
      var extra='';
      try{
        var cd=await W.ytFetch('commentThreads?part=snippet&videoId='+v.id+'&maxResults=60&order=relevance&textFormat=plainText');
        var cs=(cd.items||[]).map(function(i){return i.snippet.topLevelComment.snippet.textDisplay;});
        var tc=cs.filter(function(c){return /\d+:\d{2}/.test(c);}).slice(0,12);
        if(tc.length)extra='\nКОММЕНТАРИИ С ТАЙМКОДАМИ (туда тыкают зрители):\n'+tc.map(function(c){return '- '+c.slice(0,160);}).join('\n');
      }catch(e){}
      var ch='';
      var m=String(v.desc||'').match(/^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/gm);
      if(m&&m.length>=2)ch='\nГЛАВЫ РОЛИКА:\n'+m.slice(0,20).join('\n');
      var dm=Math.floor((v.dur||0)/60)+':'+('0'+Math.floor((v.dur||0)%60)).slice(-2);
      var r=await ai('Ты режиссёр Shorts-нарезок. Отвечай ТОЛЬКО валидным JSON: {"cuts":[{"tc":"таймкод начала мм:сс (в пределах длительности ролика)","len":"длина фрагмента в секундах 20-58","title":"заголовок Shorts до 60 символов с интригой","first":"первая фраза-хук, которую зритель слышит в первые 2 секунды","why":"почему этот момент завирусится"}],"strategy":"1-2 фразы: как часто постить нарезки и как уводить зрителя в полный ролик"}. cuts: ровно 3, разные по типу (пик эмоции, главный инсайт, конфликт/интрига). По-русски.',
        'РОЛИК: «'+v.title+'» (длительность '+dm+', '+fmt(v.views)+' просмотров)\nОписание: '+String(v.desc||'').slice(0,400)+ch+extra,1500);
      out.innerHTML='<div class="v11-res">'+
        (r.cuts||[]).slice(0,3).map(function(c2,i){
          return '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><span class="v11-tag hot">✂️ Фрагмент '+(i+1)+' · с '+esc(c2.tc)+' · ~'+esc(String(c2.len))+' сек</span><a class="v11-cp" style="text-decoration:none" target="_blank" href="https://youtu.be/'+v.id+'?t='+(function(t){var p=String(t).split(':').map(Number);return p.length===2?p[0]*60+p[1]:(p[0]*3600+p[1]*60+(p[2]||0));})(c2.tc)+'">▶ Смотреть момент</a></div>'+
            '<b class="t" style="margin-top:9px">'+esc(c2.title)+' '+cpBtn('⧉',c2.title)+'</b>'+
            '<p><b style="color:#7fd0ff">Первая фраза:</b> «'+esc(c2.first)+'» '+cpBtn('⧉',c2.first)+'</p>'+
            '<p><small>'+esc(c2.why||'')+'</small></p></div>';
        }).join('')+
        '<div class="v11-res-card"><span class="v11-tag gold">Стратегия</span><p style="margin-top:8px">'+esc(r.strategy||'')+'</p></div>'+
        '</div>';
    }catch(e){out.innerHTML=C.err11(e);}
  });
};
C.regTool({id:'shorts',ic:'✂️',name:'Режиссёр Shorts',d:'3 фрагмента из длинного ролика: таймкоды, заголовок, первая фраза',fn:W.v11ShortsOpen,hub:true});

/* ================= 3. ПРОМО-ДВИЖОК ================= */
W.v11PromoOpen=function(){
  var el=ov11('v11promo','📣','Промо-движок','Готовый план дистрибуции ролика: кросспост-тексты для всех площадок, SEO, посев и тайминг');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  el.innerHTML=selCard('v11prSel','v11prGo','🚀 Собрать промо-кит','Один ролик — полный пакет распространения: пост в Telegram, ВКонтакте, Дзен, тизер для Shorts, SEO-теги, где посеять и в каком порядке.');
  q('#v11prGo').addEventListener('click',async function(){
    var v=vidById(q('#v11prSel').value),out=q('#v11prSelOut');
    if(!v)return;
    out.innerHTML=C.load11('Собираю промо-кит для ролика…');
    try{
      var r=await ai('Ты диструбьютор контента (промо-продюсер). Отвечай ТОЛЬКО валидным JSON: {"tg":"пост для Telegram-канала 300-500 знаков: хук, 1-2 инсайта из ролика, призыв смотреть (БЕЗ ссылки — её вставят сами)","vk":"пост для ВКонтакте 300-500 знаков, чуть теплее по тону","dzen":"анонс для Дзена: цепляющий первый абзац 200-350 знаков","teaser":"сценарий 15-сек тизера для Shorts/Reels: 3 строки — кадр, текст на экране, фраза","seo":["8-10 поисковых фраз, по которым ролик должны находить"],"seeds":[{"where":"конкретный тип площадки/сообщества для посева","how":"как подать, чтобы не выглядело рекламой"}],"timing":"план на 48 часов после публикации: что и когда постить, 3-4 шага"}. seeds: 4 пункта. По-русски, живым языком, без воды.',
        C.ctx()+'\n\nРОЛИК ДЛЯ ПРОМО: «'+v.title+'»\nОписание: '+String(v.desc||'').slice(0,400),2000);
      function block(ic,t,txt){return '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0">'+ic+' '+t+'</b>'+cpBtn('Копировать',txt)+'</div><p style="white-space:pre-wrap;margin-top:8px">'+esc(txt)+'</p></div>';}
      out.innerHTML='<div class="v11-res">'+
        block('✈️','Пост для Telegram',r.tg||'')+
        block('🔵','Пост для ВКонтакте',r.vk||'')+
        block('🟠','Анонс для Дзена',r.dzen||'')+
        block('🎞','15-сек тизер (Shorts/Reels)',r.teaser||'')+
        '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0">🔎 SEO-фразы</b>'+cpBtn('Копировать',(r.seo||[]).join(', '))+'</div><p style="margin-top:8px">'+(r.seo||[]).map(function(t){return '<span class="v11-pill" style="cursor:default;display:inline-block;margin:3px 4px 0 0;padding:5px 11px">'+esc(t)+'</span>';}).join('')+'</p></div>'+
        '<div class="v11-res-card"><b class="t">🌱 Посев без бюджета</b>'+(r.seeds||[]).map(function(s2){return '<p>• <b>'+esc(s2.where)+'</b> — '+esc(s2.how)+'</p>';}).join('')+'</div>'+
        '<div class="v11-res-card"><span class="v11-tag gold">Тайминг 48 часов</span><p style="white-space:pre-wrap;margin-top:8px">'+esc(r.timing||'')+'</p></div>'+
        '</div>';
    }catch(e){out.innerHTML=C.err11(e);}
  });
};
C.regTool({id:'promo',ic:'📣',name:'Промо-движок',d:'Кросспост-тексты, SEO, посев и тайминг на 48 часов для каждого ролика',fn:W.v11PromoOpen,hub:true});
})();

;
/* ============ V11 часть 4: медиакит для рекламодателей + коллаб-радар ============ */
(function(){
'use strict';
var C=window.__v11core;if(!C)return;
var W=window,D=document,q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ov11=C.ov11,toast=C.toast,lget=C.lget;

/* ================= 1. МЕДИАКИТ ================= */
function brand(){var b=lget('v10_brand',{})||{};return {on:!!b.on,name:b.name||'',site:b.site||'',logo:b.logo||'',color:b.color||'#ff2d55'};}
function avgViews(){
  var s=S(),longs=(s.longs||[]).slice().sort(function(a,b){return new Date(b.published)-new Date(a.published);}).slice(0,12);
  return Math.round(C.med(longs.map(function(v){return v.views;})))||0;
}
function priceTable(){
  var av=avgViews();
  var k=Math.max(.4,Math.min(2.2,av>200000?.8:av>50000?1:av>10000?1.4:2)); /* CPV выше у малых каналов */
  function rng(a,b){return fmt(Math.round(a/500)*500)+' – '+fmt(Math.round(b/500)*500)+' ₽';}
  return [
    {t:'Интеграция 60–90 сек',d:'нативный блок внутри ролика, ссылка в описании и закрепе',p:rng(av*1.2*k,av*2*k)},
    {t:'Пре-ролл 30 сек',d:'упоминание в начале ролика',p:rng(av*.6*k,av*1*k)},
    {t:'Эксклюзивный ролик',d:'отдельное видео под бренд, согласование сценария',p:rng(av*2.5*k,av*4*k)},
    {t:'Пакет 3 интеграции',d:'месячное сопровождение, ссылки во всех описаниях',p:rng(av*3*k,av*4.8*k)}
  ];
}
W.v11KitOpen=function(){
  var el=ov11('v11kit','💼','Медиакит для рекламодателей','PDF, который не стыдно отправить бренду: цифры канала, аудитория, форматы и прайс интеграций');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  var b=brand(),av=avgViews();
  el.innerHTML='<div class="v10-card"><div class="v10-h4">⚙️ Параметры</div>'+
    '<div class="v10-note">Прайс рассчитан от медианы просмотров свежих роликов ('+fmt(av)+') по рыночным ставкам CPV — поправь под себя в полях ниже. '+(b.on?'Используется бренд «'+esc(b.name)+'» из режима агентства.':'Контакт возьмём из поля ниже; включить white-label можно в «Режиме агентства» на дашборде.')+'</div>'+
    '<div class="v11-row" style="margin-top:12px"><input class="v10-in v11-in" id="v11kitMail" placeholder="Контакт для брендов (email / @telegram)" style="flex:1;min-width:220px" value="'+esc(lget('v11_kit_contact','')||'@badVInq')+'">'+
    '<button class="v11-btn" id="v11kitGo">📄 Скачать медиакит PDF</button></div></div>'+
    '<div id="v11kitOut" style="margin-top:16px"></div>';
  q('#v11kitGo').addEventListener('click',async function(){
    var out=q('#v11kitOut'),btn=this;
    var contact=q('#v11kitMail').value.trim();C.lset('v11_kit_contact',contact);
    btn.disabled=true;btn.textContent='⏳ Собираю…';
    out.innerHTML=C.load11('AI описывает аудиторию и собираю PDF…');
    try{
      if(W.vEnsureLib){await W.vEnsureLib('html2canvas');await W.vEnsureLib('jspdf');}
      if(!W.html2canvas||!W.jspdf)throw new Error('библиотеки не загрузились (нужен интернет)');
      var aud=null;
      try{
        aud=await ai('Ты медиапланер. Отвечай ТОЛЬКО валидным JSON: {"about":"2-3 фразы о канале для рекламодателя: о чём, чем ценен бренду","audience":"портрет аудитории: кто смотрит, возраст, интересы, покупательские мотивы — 2-3 фразы","fit":["4 категории брендов, которым идеально зайдёт этот канал"]}. Деловой тон, по-русски, без воды.',C.ctx(),900);
      }catch(e){aud={about:'',audience:'',fit:[]};}
      var s=S(),ch=s.channel,b2=brand();
      var col=b2.on&&b2.color?b2.color:'#ff2d55';
      var name=b2.on&&b2.name?b2.name:'Viora Media';
      var longs=(s.longs||[]).slice().sort(function(x,y){return y.views-x.views;});
      var eng=(function(){var a=[].concat(s.longs||[],s.shorts||[]);return a.length?(a.reduce(function(t,v){return t+v.engagement;},0)/a.length*100):0;})();
      var permo=(function(){var rc=(s.longs||[]).filter(function(v){return v.age<=30;}).length;return rc;})();
      var topv=longs[0]?longs[0].views:0;
      var stat4=permo>0?statB('Роликов за 30 дн',String(permo),'регулярность'):statB('Топ-ролик',fmt(topv),'просмотров');
      var PW=794,PH=1123;
      function page(html){
        var p=D.createElement('div');
        p.style.cssText='width:'+PW+'px;height:'+PH+'px;background:#fff;font-family:Onest,Inter,Arial,sans-serif;color:#160f1d;box-sizing:border-box;position:relative;overflow:hidden';
        p.innerHTML=html;return p;
      }
      function statB(l,v,n){return '<div style="flex:1;background:#f7f4fa;border:1px solid #e9e3f0;border-radius:14px;padding:15px 17px"><div style="font-size:10px;color:#7a7385;text-transform:uppercase;letter-spacing:.8px">'+l+'</div><div style="font-size:23px;font-weight:800;margin-top:4px">'+v+'</div>'+(n?'<div style="font-size:10.5px;color:#9a92a5;margin-top:2px">'+n+'</div>':'')+'</div>';}
      var p1=page(
        '<div style="position:absolute;inset:0;background:linear-gradient(160deg,'+col+'14,#ffffff 45%)"></div>'+
        '<div style="position:relative;padding:64px 60px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:800;font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:'+col+'">'+esc(name)+'</div><div style="font-size:11px;color:#9a92a5">МЕДИАКИТ · '+new Date().toLocaleDateString('ru-RU',{month:'long',year:'numeric'})+'</div></div>'+
        '<div style="margin-top:90px;font-size:40px;font-weight:800;line-height:1.15">'+esc(ch.title)+'</div>'+
        '<div style="margin-top:10px;font-size:15px;color:#6f6680">'+(C.nicheName()?'YouTube-канал · ниша: '+C.nicheName():'YouTube-канал')+'</div>'+
        '<div style="margin-top:26px;font-size:14.5px;line-height:1.7;color:#3c3546;max-width:600px">'+esc(aud.about||'')+'</div>'+
        '<div style="display:flex;gap:14px;margin-top:44px">'+
          statB('Подписчики',fmt(ch.subs||0),'')+statB('Медиана просмотров',fmt(avgViews()),'свежие ролики')+statB('Вовлечённость',eng.toFixed(1)+'%','лайки + комментарии')+statB('Роликов за 30 дн',String(permo),'регулярность')+
        '</div>'+
        '<div style="margin-top:40px"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:'+col+';margin-bottom:10px">Аудитория</div><div style="font-size:14px;line-height:1.7;color:#3c3546;max-width:620px">'+esc(aud.audience||'')+'</div></div>'+
        '<div style="margin-top:30px"><div style="font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:'+col+';margin-bottom:10px">Кому идеально подойдёт</div><div style="display:flex;flex-wrap:wrap;gap:8px">'+(aud.fit||[]).map(function(f){return '<span style="background:'+col+'14;border:1px solid '+col+'33;color:#3c3546;border-radius:99px;padding:7px 16px;font-size:12.5px;font-weight:600">'+esc(f)+'</span>';}).join('')+'</div></div>'+
        '<div style="position:absolute;left:60px;right:60px;bottom:-640px"></div>'+
        '</div>'+
        '<div style="position:absolute;left:60px;right:60px;bottom:40px;display:flex;justify-content:space-between;font-size:11px;color:#9a92a5"><span>'+esc(contact||(b2.on?b2.site:''))+'</span><span>стр. 1 / 2</span></div>');
      var p2=page(
        '<div style="position:relative;padding:56px 60px">'+
        '<div style="font-size:22px;font-weight:800">Форматы и прайс</div>'+
        '<div style="margin-top:6px;font-size:12.5px;color:#6f6680">Расчёт от медианных просмотров свежих роликов · финальная цена обсуждается под задачу бренда</div>'+
        '<div style="margin-top:24px">'+priceTable().map(function(r){
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:18px;border:1px solid #e9e3f0;border-radius:14px;padding:16px 20px;margin-bottom:10px"><div><div style="font-size:15px;font-weight:800">'+r.t+'</div><div style="font-size:12px;color:#7a7385;margin-top:3px">'+r.d+'</div></div><div style="font-size:16px;font-weight:800;color:'+col+';white-space:nowrap">'+r.p+'</div></div>';
        }).join('')+'</div>'+
        '<div style="margin-top:26px;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:'+col+'">Доказательства: топ-ролики канала</div>'+
        '<div style="margin-top:12px">'+longs.slice(0,5).map(function(v,i){
          return '<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #f0ebf5;font-size:13px"><span style="color:#3c3546">'+(i+1)+'. '+esc(v.title.slice(0,70))+'</span><b style="white-space:nowrap">'+fmt(v.views)+' просм</b></div>';
        }).join('')+'</div>'+
        '<div style="margin-top:30px;background:#160f1d;border-radius:16px;padding:22px 26px;color:#fff;display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:15px;font-weight:800">Обсудить интеграцию</div><div style="font-size:12.5px;color:#b8aec6;margin-top:4px">'+esc(contact||'Telegram: @badVInq')+'</div></div><div style="font-size:12px;color:#b8aec6">'+esc(b2.on&&b2.site?b2.site:'')+'</div></div>'+
        '</div>'+
        '<div style="position:absolute;left:60px;right:60px;bottom:40px;display:flex;justify-content:space-between;font-size:11px;color:#9a92a5"><span>'+esc(name)+'</span><span>стр. 2 / 2</span></div>');
      var wrap=D.createElement('div');wrap.style.cssText='position:fixed;left:-12000px;top:0;z-index:-1;background:#fff';
      wrap.appendChild(p1);wrap.appendChild(p2);D.body.appendChild(wrap);
      var jsPDF=W.jspdf.jsPDF,pdf=new jsPDF('p','mm','a4');
      var pgs=[p1,p2];
      for(var i=0;i<pgs.length;i++){
        var cv=await W.html2canvas(pgs[i],{backgroundColor:'#ffffff',scale:2,useCORS:true,logging:false,windowWidth:PW});
        if(i>0)pdf.addPage();
        pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);
      }
      wrap.remove();
      pdf.save('mediakit_'+(ch.title||'channel').replace(/[^\wа-яё]+/gi,'_').slice(0,30)+'.pdf');
      out.innerHTML='<div class="v10-note">✅ Медиакит скачан. Отправляй брендам в ответ на «пришлите статистику» — выглядит как от агентства.</div>';
    }catch(e){out.innerHTML=C.err11(e);}
    btn.disabled=false;btn.textContent='📄 Скачать медиакит PDF';
  });
};
C.regTool({id:'kit',ic:'💼',name:'Медиакит + прайс',d:'PDF для рекламодателей: цифры, аудитория, форматы и расчёт цен интеграций',fn:W.v11KitOpen,hub:true});

/* ================= 2. КОЛЛАБ-РАДАР ================= */
W.v11CollabOpen=function(){
  var el=ov11('v11collab','🤝','Коллаб-радар','Каналы твоего размера в нише для взаимных интеграций + готовый питч для каждого');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  el.innerHTML='<div class="v10-card"><div class="v10-h4">🔭 Поиск партнёров</div>'+
    '<div class="v10-note">Коллабы — самый недооценённый канал роста: аудитория партнёра уже любит твой формат. Ищем каналы сопоставимого размера (×0.3 – ×3 твоих подписчиков).</div>'+
    '<div class="v11-row" style="margin-top:12px"><input class="v10-in v11-in" id="v11clQ" placeholder="Тема поиска (по умолчанию — твоя ниша)" style="flex:1;min-width:220px"><button class="v11-btn" id="v11clGo">🤝 Найти партнёров</button></div></div>'+
    '<div id="v11clOut" style="margin-top:16px"></div>';
  q('#v11clGo').addEventListener('click',async function(){
    var out=q('#v11clOut');
    out.innerHTML=C.load11('Сканирую нишу и подбираю каналы твоего размера…');
    try{
      var s=S(),mySubs=(s.channel&&s.channel.subs)||0;
      var qq=q('#v11clQ').value.trim()||C.nicheName()||(s.longs&&s.longs[0]?s.longs[0].title.split(' ').slice(0,3).join(' '):'youtube');
      var sd=await W.ytFetch('search?part=snippet&type=channel&maxResults=20&relevanceLanguage=ru&q='+encodeURIComponent(qq));
      var ids=(sd.items||[]).map(function(i){return i.id.channelId;}).filter(function(id){return id&&id!==s.channel.id;});
      if(!ids.length)throw new Error('каналы не нашлись — уточни тему поиска');
      var cd=await W.ytFetch('channels?part=snippet,statistics&id='+ids.slice(0,20).join(','));
      var cands=(cd.items||[]).map(function(c){return {id:c.id,title:c.snippet.title,desc:c.snippet.description||'',subs:+c.statistics.subscriberCount||0,vids:+c.statistics.videoCount||0};})
        .filter(function(c){return c.subs>0&&c.vids>=5&&(mySubs===0||(c.subs>=mySubs*.3&&c.subs<=mySubs*3));})
        .sort(function(a,b){return Math.abs(Math.log((a.subs||1)/(mySubs||1)))-Math.abs(Math.log((b.subs||1)/(mySubs||1)));})
        .slice(0,6);
      if(!cands.length)throw new Error('подходящих по размеру не нашлось — попробуй другую тему');
      var pit=null;
      try{
        pit=await ai('Ты продюсер коллабораций. Отвечай ТОЛЬКО валидным JSON: {"items":[{"n":номер канала из списка,"format":"конкретный формат коллаба под этот канал, 1 фраза","pitch":"готовое сообщение-питч 250-400 знаков от первого лица: тёплое, конкретное, win-win, без лести и канцелярита"}]}. По одному элементу на каждый канал. По-русски.',
          C.ctx()+'\n\nКАНДИДАТЫ НА КОЛЛАБ:\n'+cands.map(function(c,i){return (i+1)+'. «'+c.title+'» — '+fmt(c.subs)+' подписчиков. '+c.desc.slice(0,120);}).join('\n'),1800);
      }catch(e){}
      out.innerHTML='<div class="v11-res">'+cands.map(function(c,i){
        var it=pit&&pit.items&&pit.items.filter(function(x){return +x.n===i+1;})[0];
        return '<div class="v11-res-card"><div class="v11-row" style="justify-content:space-between"><b class="t" style="margin:0"><a href="https://www.youtube.com/channel/'+c.id+'" target="_blank" style="color:#fff;text-decoration:none">'+esc(c.title)+'</a></b><span class="v11-tag">'+fmt(c.subs)+' подп.</span></div>'+
          (it?('<p style="margin-top:8px"><b style="color:#7fd0ff">Формат:</b> '+esc(it.format)+'</p>'+
            '<p style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 14px;font-size:13px">'+esc(it.pitch)+'</p>'+
            '<button class="v11-cp" data-c="'+esc(it.pitch)+'" onclick="v11Copy(this)">⧉ Копировать питч</button>'):'')+
          '</div>';
      }).join('')+'</div>';
    }catch(e){out.innerHTML=C.err11(e);}
  });
};
C.regTool({id:'collab',ic:'🤝',name:'Коллаб-радар',d:'Партнёры твоего размера в нише + готовый питч для каждого',fn:W.v11CollabOpen,hub:true});
})();
