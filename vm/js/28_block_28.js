/* ============ VIORA V14 · «Шоу»: общее ядро ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var med=C.med,S=C.S;

/* все видео канала с метриками */
function myVids(){
  var s=S();if(!s.channel)return [];
  var out=[];
  (s.longs||[]).forEach(function(v){out.push({id:v.id,title:v.title,views:v.views||0,likes:v.likes||0,vpd:v.viewsPerDay||0,published:v.published||v.publishedAt||'',isShort:false});});
  (s.shorts||[]).forEach(function(v){out.push({id:v.id,title:v.title,views:v.views||0,likes:v.likes||0,vpd:v.viewsPerDay||0,published:v.published||v.publishedAt||'',isShort:true});});
  return out;
}
/* медианный vpd канала */
function medVpd(){
  var vs=myVids().map(function(v){return v.vpd;}).filter(function(x){return x>0;});
  return med(vs)||1;
}
/* «температура» ролика относительно своего канала */
function heat(v){return v.vpd/Math.max(medVpd(),0.001);}
function heatColor(x){
  if(x>=3)return '#ffb340';
  if(x>=1.5)return '#ff5e7a';
  if(x>=0.7)return '#7fb4ff';
  return '#5a6478';
}
function heatName(x){return x>=3?'выстрел':(x>=1.5?'выше нормы':(x>=0.7?'в норме':'тихий'));}
/* темп публикаций: роликов в месяц по выборке */
function tempo(){
  var vs=myVids().map(function(v){return +new Date(v.published);}).filter(function(t){return t>0;});
  if(vs.length<2)return 4;
  var span=(Math.max.apply(null,vs)-Math.min.apply(null,vs))/(C.DAY*30.4);
  return Math.max(0.5,Math.min(40,vs.length/Math.max(span,0.5)));
}
/* доля shorts */
function shortsShare(){
  var v=myVids();if(!v.length)return 0;
  return v.filter(function(x){return x.isShort;}).length/v.length;
}
function fmtBig(n){
  n=+n||0;
  if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1).replace('.0','')+' млн';
  if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1).replace('.0','')+'К';
  return String(Math.round(n));
}
W.__v14={myVids:myVids,medVpd:medVpd,heat:heat,heatColor:heatColor,heatName:heatName,tempo:tempo,shortsShare:shortsShare,fmtBig:fmtBig};
})();

;
/* ============ VIORA V14 · модуль 1: галактика канала ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,esc=C.esc,fmt=C.fmt,S=C.S,toast=C.toast,needCh=C.needCh,chid=C.chid;
var V13=W.__v13,V=W.__v14;

var GAL=null; /* живое состояние галактики */

W.v14GalOpen=function(){
  var el=V13.openOv('v14gal','🌌','Галактика канала','Все твои ролики — живая звёздная карта: таскай, зумь, тапай по звёздам');
  if(!chid()){el.innerHTML=needCh();return;}
  if(el.__ch===chid()&&GAL){GAL.alive=true;requestAnimationFrame(GAL.tick);return;}
  el.__ch=chid();
  var vids=V.myVids();
  if(!vids.length){el.innerHTML=needCh();return;}
  el.innerHTML=
    '<div class="v14-gal-bar">'+
      '<div class="v14-leg"><i style="background:#ffb340"></i>выстрел ×3+ <i style="background:#ff5e7a"></i>выше нормы <i style="background:#7fb4ff"></i>в норме <i style="background:#5a6478"></i>тихий</div>'+
      '<div class="v14-leg dim">'+vids.length+' звёзд · ближе к центру — мощнее · колесо/щипок — зум</div>'+
    '</div>'+
    '<div class="v14-gal-wrap"><canvas id="v14galCv"></canvas><div class="v14-gal-hint" id="v14galHint">тапни по звезде ✨</div></div>'+
    '<div id="v14galInfo"></div>';
  build(el,vids);
};

function build(el,vids){
  var cv=q('#v14galCv',el),ctx2=cv.getContext('2d');
  var wrap=cv.parentNode;
  /* раскладка: спираль, лучшие в центре */
  var sorted=vids.slice().sort(function(a,b){return b.vpd-a.vpd;});
  var GA=Math.PI*(3-Math.sqrt(5));
  var stars=sorted.map(function(v,i){
    var r=36+Math.pow(i,0.78)*26, a=i*GA+(((i*2654435761)%97)/97-0.5)*0.5;
    var x=V.heat(v);
    return {v:v,x:Math.cos(a)*r,y:Math.sin(a)*r*0.72,
      size:Math.max(3,Math.min(13,2.2+Math.log10(Math.max(v.views,1))*1.7)),
      col:V.heatColor(x),hx:x,ph:Math.random()*6.28,sp:0.6+Math.random()*1.2};
  });
  /* фоновые звёзды-пылинки */
  var dust=[];for(var i=0;i<140;i++)dust.push({x:(Math.random()-0.5)*2600,y:(Math.random()-0.5)*1800,s:Math.random()*1.4+0.3,a:Math.random()*0.5+0.1});
  var cam={x:0,y:0,z:1},drag=null,hover=-1,sel=-1,shoot=null,DPR=Math.min(2,W.devicePixelRatio||1);
  var maxR=36+Math.pow(stars.length,0.78)*26;

  function resize(){
    var r=wrap.getBoundingClientRect();
    cv.width=r.width*DPR;cv.height=r.height*DPR;
    cam.z=Math.min(1.6,Math.max(0.35,(Math.min(r.width,r.height)*0.46)/maxR));
  }
  resize();
  function w2s(p){return {x:cv.width/2+(p.x-cam.x)*cam.z*DPR,y:cv.height/2+(p.y-cam.y)*cam.z*DPR};}
  function s2w(sx,sy){return {x:(sx*DPR-cv.width/2)/(cam.z*DPR)+cam.x,y:(sy*DPR-cv.height/2)/(cam.z*DPR)+cam.y};}
  function hit(sx,sy){
    var p=s2w(sx,sy),best=-1,bd=1e9;
    stars.forEach(function(st,i){
      var d=Math.hypot(st.x-p.x,st.y-p.y);
      if(d<(st.size+9)/cam.z&&d<bd){bd=d;best=i;}
    });
    return best;
  }
  var t0=Date.now();
  GAL={alive:true,tick:null};
  function tick(){
    if(!GAL.alive)return;
    var ov=q('#v4ov_v14gal');
    if(!ov||!ov.classList.contains('open')){GAL.alive=false;return;}
    var t=(Date.now()-t0)/1000,Wc=cv.width,Hc=cv.height;
    ctx2.clearRect(0,0,Wc,Hc);
    /* туманности */
    var g1=ctx2.createRadialGradient(Wc*0.32,Hc*0.4,0,Wc*0.32,Hc*0.4,Wc*0.5);
    g1.addColorStop(0,'rgba(255,45,85,0.10)');g1.addColorStop(1,'rgba(255,45,85,0)');
    ctx2.fillStyle=g1;ctx2.fillRect(0,0,Wc,Hc);
    var g2=ctx2.createRadialGradient(Wc*0.72,Hc*0.6,0,Wc*0.72,Hc*0.6,Wc*0.45);
    g2.addColorStop(0,'rgba(42,171,238,0.09)');g2.addColorStop(1,'rgba(42,171,238,0)');
    ctx2.fillStyle=g2;ctx2.fillRect(0,0,Wc,Hc);
    /* пыль (слабый параллакс) */
    dust.forEach(function(d){
      var p=w2s({x:d.x*0.6+cam.x*0.35,y:d.y*0.6+cam.y*0.35});
      ctx2.globalAlpha=d.a;ctx2.fillStyle='#cfd8ea';
      ctx2.fillRect(p.x,p.y,d.s*DPR,d.s*DPR);
    });
    ctx2.globalAlpha=1;
    /* падающая звезда раз в ~6с */
    if(!shoot&&Math.random()<0.004)shoot={x:Math.random()*Wc,y:Math.random()*Hc*0.4,vx:(6+Math.random()*5)*DPR,vy:(3+Math.random()*3)*DPR,life:1};
    if(shoot){
      ctx2.strokeStyle='rgba(255,255,255,'+(0.7*shoot.life)+')';ctx2.lineWidth=1.6*DPR;
      ctx2.beginPath();ctx2.moveTo(shoot.x,shoot.y);ctx2.lineTo(shoot.x-shoot.vx*6,shoot.y-shoot.vy*6);ctx2.stroke();
      shoot.x+=shoot.vx;shoot.y+=shoot.vy;shoot.life-=0.025;
      if(shoot.life<=0)shoot=null;
    }
    /* звёзды */
    stars.forEach(function(st,i){
      var p=w2s(st),tw=0.72+0.28*Math.sin(t*st.sp+st.ph);
      var R=st.size*cam.z*DPR*(i===hover||i===sel?1.45:1);
      var glow=ctx2.createRadialGradient(p.x,p.y,0,p.x,p.y,R*3.2);
      glow.addColorStop(0,st.col);glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx2.globalAlpha=0.32*tw*(i===hover||i===sel?1.7:1);
      ctx2.fillStyle=glow;ctx2.beginPath();ctx2.arc(p.x,p.y,R*3.2,0,6.29);ctx2.fill();
      ctx2.globalAlpha=tw;ctx2.fillStyle=st.col;
      ctx2.beginPath();ctx2.arc(p.x,p.y,R,0,6.29);ctx2.fill();
      ctx2.globalAlpha=tw*0.9;ctx2.fillStyle='#fff';
      ctx2.beginPath();ctx2.arc(p.x-R*0.25,p.y-R*0.25,R*0.36,0,6.29);ctx2.fill();
      if(i===sel){
        ctx2.globalAlpha=0.9;ctx2.strokeStyle='#fff';ctx2.lineWidth=1.4*DPR;
        ctx2.beginPath();ctx2.arc(p.x,p.y,R+5*DPR+Math.sin(t*4)*1.5*DPR,0,6.29);ctx2.stroke();
      }
    });
    /* подпись при наведении */
    var hi=hover>=0?hover:sel;
    if(hi>=0){
      var st=stars[hi],p=w2s(st);
      var label=st.v.title.length>44?st.v.title.slice(0,42)+'…':st.v.title;
      ctx2.font=(12*DPR)+'px Onest,sans-serif';
      var tw2=ctx2.measureText(label).width;
      var lx=Math.min(Math.max(p.x-tw2/2,8),Wc-tw2-16),ly=Math.max(p.y-st.size*cam.z*DPR-26*DPR,18*DPR);
      ctx2.globalAlpha=0.92;ctx2.fillStyle='rgba(10,12,20,0.92)';
      roundRect(ctx2,lx-8*DPR,ly-13*DPR,tw2+16*DPR,20*DPR,6*DPR);ctx2.fill();
      ctx2.fillStyle='#fff';ctx2.fillText(label,lx,ly+2*DPR);
    }
    ctx2.globalAlpha=1;
    GAL._raf=requestAnimationFrame(tick);
  }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  GAL.tick=tick;

  /* --- управление --- */
  var pts={},pinch=null;
  cv.style.touchAction='none';
  cv.addEventListener('pointerdown',function(e){
    cv.setPointerCapture(e.pointerId);
    pts[e.pointerId]={x:e.offsetX,y:e.offsetY};
    var ks=Object.keys(pts);
    if(ks.length===2){var a=pts[ks[0]],b=pts[ks[1]];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z};drag=null;}
    else drag={x:e.offsetX,y:e.offsetY,cx:cam.x,cy:cam.y,moved:0};
  });
  cv.addEventListener('pointermove',function(e){
    if(pts[e.pointerId])pts[e.pointerId]={x:e.offsetX,y:e.offsetY};
    var ks=Object.keys(pts);
    if(pinch&&ks.length===2){
      var a=pts[ks[0]],b=pts[ks[1]],d=Math.hypot(a.x-b.x,a.y-b.y);
      cam.z=Math.min(3,Math.max(0.25,pinch.z*d/Math.max(pinch.d,1)));return;
    }
    if(drag){
      var dx=e.offsetX-drag.x,dy=e.offsetY-drag.y;
      drag.moved+=Math.abs(dx)+Math.abs(dy);
      cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;
    }else{
      var h=hit(e.offsetX,e.offsetY);
      if(h!==hover){hover=h;cv.style.cursor=h>=0?'pointer':'grab';}
    }
  });
  function up(e){
    if(drag&&drag.moved<8){
      var h=hit(e.offsetX,e.offsetY);
      if(h>=0){sel=h;showInfo(stars[h]);var hint=q('#v14galHint');if(hint)hint.style.display='none';}
    }
    delete pts[e.pointerId];drag=null;
    if(Object.keys(pts).length<2)pinch=null;
  }
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',function(e){
    e.preventDefault();
    cam.z=Math.min(3,Math.max(0.25,cam.z*(e.deltaY<0?1.12:0.89)));
  },{passive:false});
  W.addEventListener('resize',function(){if(GAL&&GAL.alive)resize();});

  function showInfo(st){
    var v=st.v,box=q('#v14galInfo');
    box.innerHTML='<div class="v10-card v14-star-card">'+
      '<a class="v13-th" href="'+V13.ytLink(v.id)+'" target="_blank" rel="noopener"><img src="'+V13.thumbUrl(v.id)+'" alt="" loading="lazy">'+(v.isShort?'<span class="v13-sh">Shorts</span>':'')+'</a>'+
      '<div class="m"><div class="t">'+esc(v.title)+'</div>'+
      '<div class="v13-meta"><span class="v13-x '+(st.hx>=3?'hot':(st.hx>=1.5?'warm':'cold'))+'">'+V.heatName(st.hx)+' ×'+(st.hx>=10?Math.round(st.hx):st.hx.toFixed(1))+'</span><span>'+fmt(v.views)+' просм</span><span>'+Math.round(v.vpd)+'/день</span></div>'+
      '<div class="v13-row"><button class="v11-btn sm" id="v14gAut">🔬 Вскрыть ролик</button><a class="v11-btn sm ghost" href="'+V13.ytLink(v.id)+'" target="_blank" rel="noopener">▶ Открыть</a></div>'+
      '</div></div>';
    q('#v14gAut',box).addEventListener('click',function(){try{W.v13AutOpen(V13.ytLink(v.id));}catch(e){toast('Вскрытие недоступно','warn');}});
    box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  requestAnimationFrame(tick);
}
C.regTool({id:'v14gal',ic:'🌌',name:'Галактика канала',d:'Все ролики как живая звёздная карта: зум, полёт, тап по звезде — разбор',fn:function(){W.v14GalOpen();},hub:true});
})();

;
/* ============ VIORA V14 · модуль 2: битва каналов ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,med=C.med,chid=C.chid,needCh=C.needCh;
var V13=W.__v13,V=W.__v14;

W.v14BatOpen=function(){
  var el=V13.openOv('v14bat','⚔️','Битва каналов','VS-арена: твой канал против любого конкурента, 5 раундов, AI-комментатор');
  if(el.__b)return;
  el.__b=1;
  el.innerHTML=
    '<div class="v10-card"><div class="v10-h4" style="margin-top:0">⚔️ Кого вызываем</div>'+
    '<div class="v10-note">5 раундов по живым данным: аудитория, темп, вовлечённость, огневая мощь, выстрелы. AI комментирует каждый раунд и говорит, как победить.</div>'+
    '<div class="v13-qrow"><input class="v10-in v11-in" id="v14bQ" placeholder="youtube.com/@конкурент" style="flex:1;min-width:200px"><button class="v11-btn" id="v14bGo">🥊 Начать бой</button></div></div>'+
    '<div id="v14bOut" style="margin-top:16px"></div>';
  q('#v14bGo',el).addEventListener('click',function(){run(el);});
};

async function fighter(cid,name,subs,vids){
  var vpds=vids.map(function(v){return v.vpd;}).filter(function(x){return x>0;});
  var eng=med(vids.map(function(v){return v.views>0?(v.likes/v.views*100):0;}).filter(function(x){return x>0;}))||0;
  var ts=vids.map(function(v){return +new Date(v.published);}).filter(function(t){return t>0;});
  var tempo=ts.length>1?vids.length/Math.max((Math.max.apply(null,ts)-Math.min.apply(null,ts))/(C.DAY*30.4),0.5):2;
  var mv=med(vpds)||1;
  var burst=0;vids.forEach(function(v){var x=v.vpd/mv;if(x>burst)burst=x;});
  return {id:cid,name:name,subs:subs,tempo:Math.min(tempo,40),eng:eng,power:mv/Math.max(subs,300)*1000,burst:burst,medVpd:mv};
}
async function getMe(){
  var s=S();if(!s.channel)throw new Error('Сначала проанализируй свой канал на главном экране');
  return fighter(chid(),s.channel.title,s.channel.subs||0,V.myVids());
}
async function getOpp(raw){
  if(!raw)throw new Error('Вставь ссылку на канал конкурента');
  var pi=W.parseInput(raw);if(!pi)throw new Error('Не понял ссылку');
  var cid=await W.resolveChannelId(pi);
  var cd=await W.ytFetch('channels?part=snippet,statistics&id='+cid);
  if(!cd.items||!cd.items.length)throw new Error('Канал не найден');
  var ch=cd.items[0];
  var sr=await W.ytFetch('search?part=snippet&channelId='+cid+'&order=date&type=video&maxResults=25');
  var ids=(sr.items||[]).map(function(it){return it.id&&it.id.videoId;}).filter(Boolean);
  var vids=await V13.vidsFull(ids);
  if(!vids.length)throw new Error('У канала не нашлось видео');
  return fighter(cid,ch.snippet.title,+ch.statistics.subscriberCount||0,vids);
}

var ROUNDS=[
  {k:'subs', n:'Аудитория',    ic:'👥', f:function(x){return fmt(x.subs)+' подп';}},
  {k:'tempo',n:'Темп',         ic:'⏱', f:function(x){return x.tempo.toFixed(1)+' видео/мес';}},
  {k:'eng',  n:'Вовлечённость',ic:'❤️', f:function(x){return x.eng.toFixed(1)+'% лайков';}},
  {k:'power',n:'Огневая мощь', ic:'💥', f:function(x){return Math.round(x.medVpd)+' просм/день на ролик';}},
  {k:'burst',n:'Выстрелы',     ic:'🚀', f:function(x){return '×'+(x.burst>=10?Math.round(x.burst):x.burst.toFixed(1))+' лучший залп';}}
];
function pause(ms){return new Promise(function(r){setTimeout(r,ms);});}

async function run(el){
  var out=q('#v14bOut',el),btn=q('#v14bGo',el);
  btn.disabled=true;out.innerHTML=load11('Собираю бойцов на арену…');
  try{
    var me=await getMe();
    var opp=await getOpp((q('#v14bQ',el)||{}).value.trim());
    /* AI-комментатор: один вызов на весь бой */
    var table=ROUNDS.map(function(r){return r.n+': я='+r.f(me)+' / соперник='+r.f(opp);}).join('\n');
    var aiP=ai('Ты — азартный комментатор боёв на YouTube-арене. Сравниваются два канала. Верни строго JSON {"rounds":["...x5 — по одной хлёсткой фразе-комментарию на каждый раунд (до 14 слов)"],"verdict":"итог боя, 2 предложения","advice":["3 конкретных хода, как каналу автора победить или закрепить отрыв"]}. Пиши по-русски, дерзко но по делу.',
      'МОЙ КАНАЛ vs «'+opp.name+'»\n'+table+'\n\nКонтекст моего канала:\n'+ctx(),900).catch(function(){return null;});
    /* арена */
    var hpMe=100,hpOp=100,score=[0,0];
    out.innerHTML=
      '<div class="v14-arena">'+
        '<div class="v14-f me"><div class="nm">'+esc(me.name)+'</div><div class="v14-hp"><i id="v14hpMe" style="width:100%"></i></div></div>'+
        '<div class="v14-vs">VS</div>'+
        '<div class="v14-f op"><div class="nm">'+esc(opp.name)+'</div><div class="v14-hp"><i id="v14hpOp" style="width:100%"></i></div></div>'+
      '</div>'+
      '<div id="v14bRounds"></div><div id="v14bFinal"></div>';
    var rb=q('#v14bRounds',out);
    var cms=await aiP;
    for(var i=0;i<ROUNDS.length;i++){
      var r=ROUNDS[i],a=me[r.k],b=opp[r.k];
      var win=a>=b?0:1;score[win]++;
      var tot=Math.max(a+b,0.0001),pa=Math.max(6,Math.round(a/tot*100)),pb=100-pa;
      var dmg=Math.round(10+Math.abs(pa-pb)*0.22);
      if(win===0)hpOp=Math.max(4,hpOp-dmg);else hpMe=Math.max(4,hpMe-dmg);
      var row=D.createElement('div');row.className='v14-round';
      row.innerHTML='<div class="hd"><span class="ic">'+r.ic+'</span><b>Раунд '+(i+1)+' · '+r.n+'</b><span class="v14-rw '+(win===0?'me':'op')+'">'+(win===0?'мой раунд 🏆':'раунд соперника')+'</span></div>'+
        '<div class="v14-duel"><span class="lbl">'+esc(r.f(me))+'</span><div class="v14-bars"><i class="me" style="width:0%"></i><i class="op" style="width:0%"></i></div><span class="lbl r">'+esc(r.f(opp))+'</span></div>'+
        (cms&&cms.rounds&&cms.rounds[i]?'<div class="v14-comm">🎙 '+esc(cms.rounds[i])+'</div>':'');
      rb.appendChild(row);row.scrollIntoView({behavior:'smooth',block:'nearest'});
      await pause(80);
      q('.v14-bars .me',row).style.width=pa+'%';
      q('.v14-bars .op',row).style.width=pb+'%';
      q('#v14hpMe',out).style.width=hpMe+'%';
      q('#v14hpOp',out).style.width=hpOp+'%';
      await pause(820);
    }
    var iWin=score[0]>=score[1];
    var fin=q('#v14bFinal',out);
    fin.innerHTML='<div class="v14-ko '+(iWin?'win':'lose')+'">'+
      '<div class="big">'+(iWin?'🏆 ПОБЕДА':'💀 ПОРАЖЕНИЕ')+'</div>'+
      '<div class="sc">'+score[0]+' : '+score[1]+'</div>'+
      (cms&&cms.verdict?'<div class="v14-comm big-c">🎙 '+esc(cms.verdict)+'</div>':'')+
      (cms&&cms.advice?'<div class="v10-h4">Как '+(iWin?'закрепить отрыв':'забрать реванш')+'</div>'+cms.advice.map(function(s,j){return '<div class="v13-idea"><b>'+(j+1)+'.</b> '+esc(s)+'</div>';}).join(''):'')+
      '<div class="v13-row" style="margin-top:12px"><button class="v11-btn sm ghost" id="v14bAgain">🔁 Реванш</button></div></div>';
    q('#v14bAgain',fin).addEventListener('click',function(){out.innerHTML='';btn.disabled=false;});
    fin.scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){out.innerHTML=err11(e);}
  btn.disabled=false;
}
C.regTool({id:'v14bat',ic:'⚔️',name:'Битва каналов',d:'VS-арена против любого конкурента: 5 раундов, AI-комментатор, вердикт',fn:function(){W.v14BatOpen();},hub:true});
})();

;
/* ============ VIORA V14 · модуль 3: свайп идей ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,chid=C.chid,needCh=C.needCh,copyTxt=C.copyTxt;
var V13=W.__v13;

var DECK=[],PLAN=[],SEEN=[];

W.v14SwipeOpen=function(){
  var el=V13.openOv('v14swipe','🃏','Свайп идей','AI раздаёт колоду идей под твой канал — свайпай как в тиндере: вправо в план, влево мимо');
  if(el.__b){return;}
  el.__b=1;
  if(!chid()){el.innerHTML=needCh();return;}
  el.innerHTML=
    '<div class="v10-card" id="v14swIntro"><div class="v10-h4" style="margin-top:0">🃏 Как играем</div>'+
    '<div class="v10-note">AI изучит твой канал и раздаст колоду из 8 идей. Тяни карту пальцем или мышью: <b>вправо — беру в план</b>, влево — мимо. Можно стрелками ← → или кнопками. Набранное улетает в контент-план и конвейер.</div>'+
    '<div class="v13-row" style="margin-top:10px"><button class="v11-btn" id="v14swDeal">🃏 Раздать колоду</button></div></div>'+
    '<div class="v14-sw-stage" id="v14swStage" style="display:none">'+
      '<div class="v14-sw-deck" id="v14swDeck"></div>'+
      '<div class="v14-sw-ctl"><button class="v14-sw-no" id="v14swNo">✖</button><span class="v14-sw-cnt" id="v14swCnt"></span><button class="v14-sw-yes" id="v14swYes">⚡</button></div>'+
    '</div>'+
    '<div id="v14swPlan"></div>';
  q('#v14swDeal',el).addEventListener('click',function(){deal(el);});
  q('#v14swNo',el).addEventListener('click',function(){fling(el,-1);});
  q('#v14swYes',el).addEventListener('click',function(){fling(el,1);});
  D.addEventListener('keydown',function(e){
    var ov=q('#v4ov_v14swipe');
    if(!ov||!ov.classList.contains('open')||!DECK.length)return;
    if(e.key==='ArrowLeft')fling(el,-1);
    if(e.key==='ArrowRight')fling(el,1);
  });
};

async function deal(el){
  var btn=q('#v14swDeal',el),stage=q('#v14swStage',el);
  btn.disabled=true;btn.textContent='Тасую колоду…';
  try{
    var d=await ai('Ты — креативный продюсер YouTube. Придумай 8 свежих идей роликов под этот канал. Верни строго JSON {"ideas":[{"t":"цепляющий заголовок","hook":"первая фраза-хук до 12 слов","fmt":"длинное видео|Shorts","why":"почему зайдёт этой аудитории, до 14 слов"}]}. Идеи разные по типу: продолжения хитов, эксперименты, реакции на спрос.'+(SEEN.length?' НЕ повторяй эти темы: '+SEEN.slice(-16).join('; '):''),ctx(),1600);
    var ideas=(d.ideas||[]).slice(0,8);
    if(!ideas.length)throw new Error('AI не раздал колоду, попробуй ещё раз');
    ideas.forEach(function(i){SEEN.push(i.t);});
    DECK=ideas;
    stage.style.display='block';
    render(el);
    stage.scrollIntoView({behavior:'smooth',block:'nearest'});
  }catch(e){q('#v14swPlan',el).innerHTML=err11(e);}
  btn.disabled=false;btn.textContent='🃏 Раздать колоду';
}

function render(el){
  var deck=q('#v14swDeck',el);
  deck.innerHTML='';
  var show=DECK.slice(0,3);
  for(var i=show.length-1;i>=0;i--){
    var it=show[i];
    var c=D.createElement('div');c.className='v14-card'+(i===0?' top':'');
    c.style.transform='translateY('+(i*10)+'px) scale('+(1-i*0.045)+')';
    c.style.zIndex=10-i;
    c.innerHTML='<div class="v14-card-fmt">'+esc(it.fmt||'видео')+'</div>'+
      '<div class="v14-card-t">'+esc(it.t)+'</div>'+
      '<div class="v14-card-h">🎬 '+esc(it.hook||'')+'</div>'+
      '<div class="v14-card-w">💡 '+esc(it.why||'')+'</div>'+
      '<div class="v14-stamp yes">В ПЛАН</div><div class="v14-stamp no">МИМО</div>';
    deck.appendChild(c);
    if(i===0)attachDrag(el,c);
  }
  q('#v14swCnt',el).textContent=DECK.length?DECK.length+' в колоде · план: '+PLAN.length:'';
  if(!DECK.length)finish(el);
}

function attachDrag(el,card){
  var sx=0,sy=0,dx=0,dy=0,on=false;
  card.style.touchAction='none';
  card.addEventListener('pointerdown',function(e){
    on=true;sx=e.clientX;sy=e.clientY;card.setPointerCapture(e.pointerId);
    card.style.transition='none';
  });
  card.addEventListener('pointermove',function(e){
    if(!on)return;
    dx=e.clientX-sx;dy=e.clientY-sy;
    card.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(dx*0.07)+'deg)';
    card.classList.toggle('lean-yes',dx>40);
    card.classList.toggle('lean-no',dx<-40);
  });
  function fin(){
    if(!on)return;on=false;
    if(Math.abs(dx)>90)flingCard(el,card,dx>0?1:-1);
    else{
      card.style.transition='transform .3s cubic-bezier(.2,.8,.3,1.2)';
      card.style.transform='translateY(0) scale(1)';
      card.classList.remove('lean-yes','lean-no');
    }
    dx=0;dy=0;
  }
  card.addEventListener('pointerup',fin);
  card.addEventListener('pointercancel',fin);
}

function fling(el,dir){
  var card=q('#v14swDeck .v14-card.top',el);
  if(card)flingCard(el,card,dir);
}
function flingCard(el,card,dir){
  var it=DECK.shift();
  if(dir>0&&it){PLAN.push(it);renderPlan(el);}
  card.style.transition='transform .45s ease, opacity .45s ease';
  card.style.transform='translate('+(dir*560)+'px,-40px) rotate('+(dir*24)+'deg)';
  card.style.opacity='0';
  setTimeout(function(){render(el);},240);
}

function renderPlan(el){
  var box=q('#v14swPlan',el);
  if(!PLAN.length){box.innerHTML='';return;}
  box.innerHTML='<div class="v10-card" style="margin-top:16px"><div class="v10-h4" style="margin-top:0">⚡ Контент-план · '+PLAN.length+'</div>'+
    PLAN.map(function(p,i){
      return '<div class="v13-idea"><b>'+(i+1)+'. '+esc(p.t)+'</b><span class="v14-fmt-tag">'+esc(p.fmt||'')+'</span><div class="d">🎬 '+esc(p.hook||'')+'</div>'+
        '<div class="v13-row"><button class="v11-btn sm" data-cv="'+esc(p.t)+'">🏭 В конвейер</button></div></div>';
    }).join('')+
    '<div class="v13-row" style="margin-top:10px"><button class="v11-btn sm ghost" id="v14swCopy">📋 Скопировать план</button></div></div>';
  qa('[data-cv]',box).forEach(function(b){b.addEventListener('click',function(){
    try{W.v12ConvOpen(b.getAttribute('data-cv'));}catch(e){toast('Конвейер недоступен','warn');}
  });});
  q('#v14swCopy',box).addEventListener('click',function(){
    copyTxt(PLAN.map(function(p,i){return (i+1)+'. '+p.t+' ['+(p.fmt||'')+']\n   Хук: '+(p.hook||'');}).join('\n'),this);
  });
}

function finish(el){
  var deck=q('#v14swDeck',el);
  deck.innerHTML='<div class="v14-sw-done">Колода разобрана!<br><b>'+PLAN.length+'</b> идей в плане'+
    '<div class="v13-row" style="margin-top:12px;justify-content:center"><button class="v11-btn sm" id="v14swMore">🃏 Ещё колоду</button></div></div>';
  q('#v14swMore',deck).addEventListener('click',function(){deal(el);});
}
C.regTool({id:'v14swipe',ic:'🃏',name:'Свайп идей',d:'Колода AI-идей под твой канал: свайпай вправо — и идея летит в план и конвейер',fn:function(){W.v14SwipeOpen();},hub:true});
})();

;
/* ============ VIORA V14 · модуль 4: симулятор будущего ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,chid=C.chid,needCh=C.needCh;
var V13=W.__v13,V=W.__v14;

var SIM=null;

W.v14SimOpen=function(){
  var el=V13.openOv('v14sim','🔮','Симулятор будущего','Крути рычаги стратегии — график роста на 12 месяцев перестраивается вживую');
  if(!chid()){el.innerHTML=needCh();return;}
  if(el.__ch===chid())return;
  el.__ch=chid();
  var s=S(),subs=s.channel.subs||0;
  var curT=Math.round(V.tempo()),curSh=Math.round(V.shortsShare()*100);
  el.innerHTML=
    '<div class="v10-card"><div class="v10-h4" style="margin-top:0">🎛 Рычаги стратегии</div>'+
    '<div class="v10-note">Серая линия — если всё оставить как есть. Цветная — твоя новая стратегия. Двигай рычаги, график пересчитывается мгновенно.</div>'+
    sl('v14sT','⏱ Роликов в месяц',1,30,Math.min(Math.max(curT,1),30))+
    sl('v14sS','✂️ Доля Shorts, %',0,100,Math.min(Math.max(curSh,0),100))+
    sl('v14sTr','🎯 Ставка на тренды, %',0,100,30)+
    sl('v14sP','🎨 Вложение в упаковку',1,10,5)+
    '</div>'+
    '<div class="v14-sim-stats"><div class="v13-stat-c"><b id="v14sSubs">—</b><span>подписчиков через год</span></div><div class="v13-stat-c"><b id="v14sDelta">—</b><span>против «как сейчас»</span></div><div class="v13-stat-c"><b id="v14sViews">—</b><span>просмотров/мес к финалу</span></div></div>'+
    '<div class="v14-sim-wrap"><canvas id="v14simCv"></canvas></div>'+
    '<div class="v13-row" style="margin-top:12px"><button class="v11-btn" id="v14sAi">🧠 AI-разбор стратегии</button></div>'+
    '<div id="v14sOut" style="margin-top:12px"></div>';
  build(el,subs,curT,curSh);
};

function sl(id,label,min,max,val){
  return '<div class="v14-sl"><label>'+label+' · <b id="'+id+'V">'+val+'</b></label><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" value="'+val+'"></div>';
}

/* модель роста: помесячная симуляция */
function project(subs,medV,p){
  var pts=[subs],sb=subs;
  var packing=0.75+p.pack*0.06;                       /* 0.81..1.35 */
  var trend=1+p.trend/100*0.45;                       /* до +45% охвата */
  for(var m=0;m<12;m++){
    var reach=medV*30*(p.tempo/Math.max(p.tempo0,1)); /* охват масштабируется от темпа */
    reach*=packing*trend;
    var shorts=p.shorts/100;
    var views=reach*(1-shorts)+reach*shorts*3.2;       /* shorts дают больше охвата */
    var conv=0.012*(1-shorts)+0.004*shorts;            /* но хуже конвертят в подписку */
    var fatigue=p.tempo>16?1-(p.tempo-16)*0.018:1;     /* перегрев на высоком темпе */
    sb=sb+views*conv*fatigue*Math.sqrt(Math.max(sb,100)/Math.max(subs,100));
    pts.push(sb);
    medV*=1.012+p.trend/100*0.006;                     /* инерция роста охвата */
  }
  return pts;
}

function build(el,subs,curT,curSh){
  var cv=q('#v14simCv',el),c2=cv.getContext('2d'),wrap=cv.parentNode;
  var DPR=Math.min(2,W.devicePixelRatio||1);
  var medV=V.medVpd();
  var anim={p:1,raf:0};
  function params(){
    return {tempo:+q('#v14sT',el).value,shorts:+q('#v14sS',el).value,trend:+q('#v14sTr',el).value,pack:+q('#v14sP',el).value,tempo0:Math.max(curT,1)};
  }
  function base(){return project(subs,medV,{tempo:Math.max(curT,1),shorts:curSh,trend:20,pack:5,tempo0:Math.max(curT,1)});}
  function resize(){var r=wrap.getBoundingClientRect();cv.width=r.width*DPR;cv.height=r.height*DPR;}
  resize();
  W.addEventListener('resize',function(){var ov=q('#v4ov_v14sim');if(ov&&ov.classList.contains('open')){resize();draw(1);}});

  function draw(prog){
    var p=params(),mine=project(subs,medV,p),b=base();
    var Wc=cv.width,Hc=cv.height,pad=34*DPR;
    var all=mine.concat(b),mx=Math.max.apply(null,all)*1.06,mn=Math.min.apply(null,all)*0.97;
    c2.clearRect(0,0,Wc,Hc);
    function X(i){return pad+(Wc-pad*1.4)*i/12;}
    function Y(v){return Hc-pad*0.8-(Hc-pad*1.7)*(v-mn)/Math.max(mx-mn,1);}
    /* сетка */
    c2.strokeStyle='rgba(255,255,255,0.07)';c2.lineWidth=1;
    c2.font=(10.5*DPR)+'px Onest,sans-serif';c2.fillStyle='rgba(230,236,248,0.45)';
    var seen={};
    for(var g=0;g<=3;g++){
      var v=mn+(mx-mn)*g/3,y=Y(v);
      c2.beginPath();c2.moveTo(pad,y);c2.lineTo(Wc-pad*0.4,y);c2.stroke();
      var lab=V.fmtBig(v);
      if(!seen[lab]){seen[lab]=1;c2.fillText(lab,6*DPR,y+3*DPR);}
    }
    for(var m=0;m<=12;m+=3)c2.fillText(m===0?'сейчас':'+'+m+' мес',X(m)-12*DPR,Hc-8*DPR);
    var lim=Math.max(2,Math.round(12*prog));
    function line(pts,col,wd,fill){
      c2.beginPath();
      for(var i=0;i<=lim;i++){var x=X(i),y=Y(pts[i]);i?c2.lineTo(x,y):c2.moveTo(x,y);}
      c2.strokeStyle=col;c2.lineWidth=wd*DPR;c2.lineJoin='round';c2.stroke();
      if(fill){
        c2.lineTo(X(lim),Hc-pad*0.8);c2.lineTo(X(0),Hc-pad*0.8);c2.closePath();
        var gr=c2.createLinearGradient(0,0,0,Hc);gr.addColorStop(0,'rgba(255,45,85,0.22)');gr.addColorStop(1,'rgba(255,45,85,0)');
        c2.fillStyle=gr;c2.fill();
      }
    }
    line(b,'rgba(150,160,180,0.55)',1.6,false);
    line(mine,'#ff2d55',2.6,true);
    /* конечные точки */
    var ex=X(lim),ey=Y(mine[lim]);
    c2.fillStyle='#ff2d55';c2.beginPath();c2.arc(ex,ey,4*DPR,0,6.29);c2.fill();
    c2.fillStyle='#fff';c2.font='bold '+(12*DPR)+'px Onest,sans-serif';
    c2.fillText(V.fmtBig(mine[lim]),Math.min(ex+8*DPR,Wc-52*DPR),ey-8*DPR);
    /* статы */
    var fin=mine[12],fb=b[12];
    q('#v14sSubs',el).textContent=V.fmtBig(fin);
    var d=fin-fb;
    q('#v14sDelta',el).textContent=(d>=0?'+':'−')+V.fmtBig(Math.abs(d));
    q('#v14sDelta',el).style.color=d>=0?'#39d98a':'#ff5e7a';
    var p2=params(),reach=medV*30*(p2.tempo/Math.max(p2.tempo0,1))*(0.75+p2.pack*0.06)*(1+p2.trend/100*0.45);
    q('#v14sViews',el).textContent=V.fmtBig(reach*(1-p2.shorts/100)+reach*(p2.shorts/100)*3.2);
  }
  function animate(){
    cancelAnimationFrame(anim.raf);anim.p=0;
    (function step(){
      anim.p=Math.min(1,anim.p+0.09);
      draw(anim.p);
      if(anim.p<1)anim.raf=requestAnimationFrame(step);
    })();
  }
  qa('input[type=range]',el).forEach(function(r){
    r.addEventListener('input',function(){
      q('#'+r.id+'V',el).textContent=r.value;
      animate();
    });
  });
  q('#v14sAi',el).addEventListener('click',async function(){
    var out=q('#v14sOut',el);this.disabled=true;out.innerHTML=load11('Разбираю стратегию…');
    try{
      var p=params(),mine=project(subs,medV,p);
      var d=await ai('Ты — стратег роста YouTube-каналов. Оцени выбранную стратегию. Верни строго JSON {"verdict":"оценка стратегии, 2 предложения","risks":["2 главных риска"],"actions":["3 конкретных первых шага на эту неделю"]}',
        'Канал: '+fmt(subs)+' подписчиков.\nСтратегия: '+p.tempo+' роликов/мес (сейчас '+p.tempo0+'), Shorts '+p.shorts+'%, ставка на тренды '+p.trend+'%, упаковка '+p.pack+'/10.\nПрогноз модели: через 12 мес '+V.fmtBig(mine[12])+' подписчиков.\n\n'+ctx(),900);
      out.innerHTML='<div class="v10-card"><div class="v13-idea"><b>Вердикт.</b> '+esc(d.verdict||'')+'</div>'+
        (d.risks||[]).map(function(r){return '<div class="v13-idea warn"><b>⚠️ Риск.</b> '+esc(r)+'</div>';}).join('')+
        (d.actions||[]).map(function(a,i){return '<div class="v13-idea"><b>Шаг '+(i+1)+'.</b> '+esc(a)+'</div>';}).join('')+'</div>';
    }catch(e){out.innerHTML=err11(e);}
    this.disabled=false;
  });
  draw(1);
}
C.regTool({id:'v14sim',ic:'🔮',name:'Симулятор будущего',d:'Живые рычаги стратегии и график роста на год: что будет, если поменять курс',fn:function(){W.v14SimOpen();},hub:true});
/* старый «Цифровой двойник» (V12) уступает место новому симулятору: убираем дубль из хаба/меню, ссылки ведут сюда */
try{W.v12TwinOpen=function(){W.v14SimOpen();};}catch(e){}
setInterval(function(){
  var c=q('#v11hub .v11-hub-card[data-t="twin"]');if(c)c.remove();
  var m=q('#v11mi_twin');if(m)m.remove();
},1600);
})();
