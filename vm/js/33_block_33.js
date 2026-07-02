/* ============ VIORA V17 · фиксы: плашки «Суть», точки-навигация, автодобавление конкурентов, бейдж Штаба, конфетти ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core;
  if(!C){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,lget=C.lget,lset=C.lset,toast=C.toast,chid=C.chid,DAY=C.DAY;

  W.__v17=W.__v17||{};

  /* ---------- 0. Конфетти (общая утилита V17) ---------- */
  var confBusy=false;
  W.__v17.confetti=function(){
    if(confBusy)return;confBusy=true;
    try{
      var c=D.createElement('canvas');
      c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:16060';
      D.body.appendChild(c);
      var ctx=c.getContext('2d'),WW=c.width=innerWidth,HH=c.height=innerHeight;
      var cols=['#ff2d55','#ff5470','#ffb020','#ffffff','#8b5cf6','#3ddc97'],P=[];
      for(var i=0;i<130;i++)P.push({x:WW/2+(Math.random()-.5)*160,y:HH*0.3,vx:(Math.random()-.5)*11,vy:Math.random()*-13-4,g:.32+Math.random()*.1,r:4+Math.random()*5,c:cols[i%cols.length],rot:Math.random()*6,vr:(Math.random()-.5)*.4});
      var t0=performance.now();
      function fr(t){
        var el=t-t0;ctx.clearRect(0,0,WW,HH);var alive=false;
        for(var i=0;i<P.length;i++){var p=P[i];p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;if(p.y<HH+40)alive=true;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.max(0,1-el/2400);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6);ctx.restore();}
        if(el<2400&&alive)requestAnimationFrame(fr);else{c.remove();confBusy=false;}
      }
      requestAnimationFrame(fr);
    }catch(e){confBusy=false;}
  };

  /* ---------- 1. Плашки «Суть»: клик раскрывает полный текст ---------- */
  D.addEventListener('click',function(e){
    var chip=e.target&&e.target.closest&&e.target.closest('.v-chip');
    if(!chip)return;
    chip.classList.toggle('open');
  });

  /* ---------- 2. Точки-навигация: показывать только над разбором ---------- */
  function navTick(){
    var nav=q('#secNav');if(!nav)return;
    var hide=false;
    /* поверх открытых оверлеев инструментов и Штаба точкам делать нечего */
    if(D.body.classList.contains('v16-ov-open'))hide=true;
    if(!hide&&q('.v4-ov.open'))hide=true;
    if(!hide){
      var hq=q('#v16hq');if(hq&&hq.classList.contains('open'))hide=true;
    }
    if(!hide){
      var dash=q('#dashboard');
      if(!dash||getComputedStyle(dash).display==='none')hide=true;
      else{
        var r=dash.getBoundingClientRect();
        /* окно ниже конца или выше начала разбора — точки не нужны */
        if(r.bottom<innerHeight*0.45||r.top>innerHeight*0.6)hide=true;
      }
    }
    nav.classList.toggle('v17hide',hide);
  }
  W.addEventListener('scroll',navTick,{passive:true});
  setInterval(navTick,800);

  /* ---------- 3. Конкуренты из анализа → автоматически в «Мониторинг» ---------- */
  function stateComps(){
    try{
      var s=(typeof STATE!=='undefined'&&STATE)?STATE:null;
      if(!s||!s.competitors||!s.competitors.length)return [];
      return s.competitors.map(function(c){
        var ch=c.ch||{};
        return ch.id?{id:ch.id,title:ch.title||'Канал',subs:+ch.subs||0}:null;
      }).filter(Boolean);
    }catch(e){return [];}
  }
  function seedComps(){
    var id=chid();if(!id)return;
    var found=stateComps();if(!found.length)return;
    var key='v11_comp:'+id;
    var list=lget(key,[])||[];
    var have={};list.forEach(function(c){have[c.id]=1;});
    var added=0;
    found.forEach(function(c){
      if(list.length>=8)return;
      if(!have[c.id]){list.push(c);have[c.id]=1;added++;}
    });
    if(added){
      lset(key,list);
      var seenKey='v17_comp_seeded:'+id;
      if(!lget(seenKey,0)){
        lset(seenKey,1);
        toast('📡 Добавил '+added+' конкурент'+(added===1?'а':'ов')+' из анализа в «Мониторинг конкурентов»','ok');
      }
    }
  }
  setInterval(function(){try{seedComps();}catch(e){}},3000);
  /* и прямо перед открытием мониторинга — чтобы список точно был свежим */
  var waitComp=setInterval(function(){
    if(typeof W.v11CompOpen!=='function')return;
    clearInterval(waitComp);
    var orig=W.v11CompOpen;
    W.v11CompOpen=function(){try{seedComps();}catch(e){}return orig.apply(this,arguments);};
  },500);

  /* ---------- 4. Бейдж на кнопке Штаба: сегодня по плану съёмка/публикация ---------- */
  function todayTask(){
    var V=W.__v16;if(!V||!V.hasData||!V.hasData())return null;
    var cal=V.calGet();if(!cal)return null;
    var dk=V.dkey(V.today());
    if((cal.marks||{})[dk]==='done')return null;
    var it=V.calItem(cal,dk);
    if(!it||!it.topic)return null;
    return it;
  }
  W.__v17.todayTask=todayTask;
  setInterval(function(){
    try{
      var b=q('#v16hqBtn');if(!b)return;
      var t=todayTask();
      b.classList.toggle('v17dot',!!t);
      if(t)b.title='Сегодня по плану: '+(t.topic||'задача')+' — открой Штаб';
    }catch(e){}
  },2500);
}
boot();
})();
