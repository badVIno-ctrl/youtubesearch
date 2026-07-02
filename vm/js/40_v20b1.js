/* ================= VIORA V20 · БЛОК 1 — Фундамент =================
   Неинвазивный пак: переопределяет функции, добавляет элементы/CSS, ничего не ломает.
   1.1 итоговая карточка (авто-высота, обрезка по предложению, 2x, новый макет + подпись/QR)
   1.2 мобильная шапка (компактный логотип + нижний док)
   1.3 скорость (лайт-режим, content-visibility, тротл)
   1.4 закреплённая панель «С чего начать» вместо прыгающего тура
   1.5 баги консоли (manifest start_url/scope, deprecated meta)
*/
(function(){
  'use strict';
  var W=window,D=document;
  function $(s,r){return (r||D).querySelector(s);}
  function $all(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
  function esc(s){return (''+(s==null?'':s)).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function on(el,ev,fn){if(el)el.addEventListener(ev,fn,false);}
  function ready(fn){if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',fn);else fn();}
  function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  function toastV(m,t){try{if(W.toastSafe)return W.toastSafe(m,t||'ok');if(W.toast)return W.toast(m);}catch(e){}}

  /* =========================================================
     1.5 — БАГИ КОНСОЛИ: manifest + deprecated meta
  ========================================================= */
  function fixMetaAndManifest(){
    try{
      /* deprecated apple-meta → добавляем стандартный mobile-web-app-capable */
      if(!$('meta[name="mobile-web-app-capable"]')){
        var mm=D.createElement('meta');mm.name='mobile-web-app-capable';mm.content='yes';
        D.head.appendChild(mm);
      }
    }catch(e){}
    try{
      if(location.protocol==='file:')return; /* в file:// манифест не нужен */
      /* абсолютные start_url/scope — иначе blob:-манифест даёт invalid URL в консоли */
      var dir=location.href.replace(/[?#].*$/,'').replace(/[^/]*$/,'');
      function icon(sz){
        var c=D.createElement('canvas');c.width=c.height=sz;var x=c.getContext('2d');var r=sz*0.22;
        x.fillStyle='#FF2D55';x.beginPath();x.moveTo(r,0);x.arcTo(sz,0,sz,sz,r);x.arcTo(sz,sz,0,sz,r);x.arcTo(0,sz,0,0,r);x.arcTo(0,0,sz,0,r);x.closePath();x.fill();
        x.fillStyle='#fff';x.beginPath();x.moveTo(sz*0.40,sz*0.30);x.lineTo(sz*0.72,sz*0.50);x.lineTo(sz*0.40,sz*0.70);x.closePath();x.fill();
        return c.toDataURL('image/png');
      }
      var man={name:'Viora Media — AI-аудит YouTube',short_name:'Viora',
        start_url:dir,scope:dir,id:dir,display:'standalone',orientation:'portrait',
        background_color:'#08070c',theme_color:'#FF2D55',lang:'ru',
        description:'AI-продюсер в кармане: аудит YouTube-канала и план роста.',
        icons:[{src:icon(192),sizes:'192x192',type:'image/png',purpose:'any'},
               {src:icon(512),sizes:'512x512',type:'image/png',purpose:'any maskable'}]};
      var old=$('#vManifest');if(old){try{old.parentNode.removeChild(old);}catch(e){}}
      var ml=D.createElement('link');ml.rel='manifest';ml.id='vManifest';
      ml.href=URL.createObjectURL(new Blob([JSON.stringify(man)],{type:'application/manifest+json'}));
      D.head.appendChild(ml);
    }catch(e){}
  }

  /* =========================================================
     1.3 — СКОРОСТЬ: лайт-режим + content-visibility
  ========================================================= */
  function liteShould(){
    var saved=lsGet('viora_lite');
    if(saved==='1')return true; if(saved==='0')return false;
    try{
      var m=navigator.deviceMemory,c=navigator.hardwareConcurrency;
      if(m&&m<=4)return true;
      if(c&&c<=4)return true;
      if(W.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches)return true;
    }catch(e){}
    return false;
  }
  function applyLite(on){
    D.documentElement.classList.toggle('v20-lite',!!on);
    var b=$('#v20liteBtn');
    if(b){b.classList.toggle('on',!!on);
      b.innerHTML=on?'⚡ Лайт <span class="lb">вкл</span>':'⚡ Лайт';
      b.title=on?'Лёгкий режим включён: меньше эффектов, плавнее на слабых телефонах':'Включить лёгкий режим (быстрее на слабых телефонах)';}
  }
  function liteToggle(){
    var now=!D.documentElement.classList.contains('v20-lite');
    lsSet('viora_lite',now?'1':'0');
    applyLite(now);
    toastV(now?'⚡ Лёгкий режим включён — меньше анимаций, плавнее скролл':'Лёгкий режим выключен','ok');
  }
  function injectLiteBtn(){
    if($('#v20liteBtn'))return;
    var nav=$('.nav .nav-in');if(!nav)return;
    var b=D.createElement('button');b.id='v20liteBtn';b.type='button';
    on(b,'click',liteToggle);
    nav.appendChild(b);
    applyLite(D.documentElement.classList.contains('v20-lite'));
  }
  /* content-visibility: помечаем секции отчёта без canvas (графики не трогаем — Chart.js) */
  function markCV(){
    try{
      var root=$('#report')||$('#dashboard');if(!root)return;
      $all('.section',root).forEach(function(s){
        if(s.id==='v20start')return;
        if(s.querySelector('canvas'))return;        /* секции с графиками пропускаем */
        if(s.classList.contains('v20cv'))return;
        s.classList.add('v20cv');
      });
    }catch(e){}
  }

  /* =========================================================
     1.4 — ПАНЕЛЬ «С ЧЕГО НАЧАТЬ» (заменяет прыгающий тур)
  ========================================================= */
  var START_HIDE='viora_v20_start_hidden';
  var START_COLLAPSE='viora_v20_start_collapsed';
  var STEPS=[
    {sel:'#weekFocusSection',n:'1',t:'Сделай 3 действия недели',d:'Самое важное из всего разбора — три шага на эту неделю. Начни с них.'},
    {sel:'#nextShootSection,#nsBtn',n:'2',t:'Собери план съёмки',d:'Один клик — и AI-продюсер выдаст тему, заголовки, хук и структуру следующего видео.'},
    {sel:'.verdict,#verdictSection',n:'3',t:'Пойми главную утечку',d:'Главная причина, почему канал не растёт быстрее. Чини её — остальные секции помогут.'}
  ];
  function findTarget(sel){var el=null;sel.split(',').some(function(s){var c=$(s.trim());if(c&&c.offsetParent){el=c;return true;}return false;});return el;}
  function gotoStep(st){
    var el=findTarget(st.sel);
    if(!el){toastV('Эта секция появится после полного разбора','warn');return;}
    try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){el.scrollIntoView();}
    el.classList.add('v20-flash');
    setTimeout(function(){el.classList.remove('v20-flash');},1400);
  }
  function buildStartPanel(){
    if(lsGet(START_HIDE)==='1')return;
    var root=$('#report')||$('#dashboard');if(!root)return;
    /* должен существовать хотя бы один из таргетов — иначе это не отчёт */
    if(!findTarget('#weekFocusSection,.verdict,#nextShootSection,#nsBtn'))return;
    var ex=$('#v20start');if(ex){try{ex.parentNode.removeChild(ex);}catch(e){}}
    var p=D.createElement('div');p.id='v20start';p.className='section';
    if(lsGet(START_COLLAPSE)==='1')p.classList.add('collapsed');
    var stepsHtml=STEPS.map(function(s,i){
      return '<button class="v20s-step" data-i="'+i+'"><span class="n">'+s.n+'</span>'
        +'<span class="t">'+esc(s.t)+'</span><span class="d">'+esc(s.d)+'</span></button>';
    }).join('');
    p.innerHTML='<div class="v20s-head"><span class="ic">🧭</span>'
      +'<b>С чего начать</b><small>3 шага по разбору</small>'
      +'<button class="v20s-toggle" title="Свернуть/развернуть">▾</button></div>'
      +'<div class="v20s-body">'+stepsHtml+'</div>'
      +'<div class="v20s-foot"><a class="v20s-never">не показывать снова</a></div>';
    /* вставляем первым блоком отчёта */
    root.insertBefore(p,root.firstChild);
    $all('.v20s-step',p).forEach(function(btn){
      on(btn,'click',function(){gotoStep(STEPS[+btn.getAttribute('data-i')]);});
    });
    var head=$('.v20s-head',p),tg=$('.v20s-toggle',p);
    function setCol(c){p.classList.toggle('collapsed',c);tg.textContent=c?'▸':'▾';lsSet(START_COLLAPSE,c?'1':'0');}
    on(head,'click',function(e){if(e.target.closest('.v20s-step'))return;setCol(!p.classList.contains('collapsed'));});
    setCol(p.classList.contains('collapsed'));
    on($('.v20s-never',p),'click',function(e){e.stopPropagation();lsSet(START_HIDE,'1');try{p.parentNode.removeChild(p);}catch(_){}toastV('Панель «С чего начать» скрыта','ok');});
  }
  /* глушим старый прыгающий тур */
  function killJumpyTour(){
    try{lsSet('viora_tour_done','1');}catch(e){}
    W.vTourMaybe=function(){try{buildStartPanel();}catch(e){}};
  }

  /* =========================================================
     1.1 — ИТОГОВАЯ КАРТОЧКА (новый макет, авто-высота, 2x, подпись/QR)
  ========================================================= */
  function trimSentence(t,max){
    t=(''+(t==null?'':t)).replace(/\s+/g,' ').trim();
    if(t.length<=max)return t;
    var cut=t.slice(0,max+1);
    /* последняя граница предложения в пределах лимита */
    var m=cut.match(/^[\s\S]*?[.!?…](?=\s|["»)]*\s|["»)]*$)/g);
    if(m){
      var joined=m.join('');
      if(joined.length>=Math.max(40,max*0.45)&&joined.length<=max+1)return joined.trim();
    }
    /* иначе режем по слову */
    var sp=cut.lastIndexOf(' ');
    if(sp>max*0.5)cut=cut.slice(0,sp);
    return cut.replace(/[\s,;:—-]+$/,'').trim()+'…';
  }
  function topLevers(max){
    var out=[];
    try{
      $all('#v7money .v7-lev').forEach(function(el){
        if(out.length>=max)return;
        var t=$('.tt',el),est=$('.est b',el);
        if(t)out.push({t:(t.textContent||'').trim(),est:est?(est.textContent||'').trim():''});
      });
    }catch(e){}
    return out;
  }
  function lazyQR(){
    if(W.qrcode)return Promise.resolve(W.qrcode);
    if(W.__v20qrP)return W.__v20qrP;
    W.__v20qrP=new Promise(function(res,rej){
      var s=D.createElement('script');s.async=true;
      s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
      s.onload=function(){W.qrcode?res(W.qrcode):rej(new Error('qr init'));};
      s.onerror=function(){W.__v20qrP=null;rej(new Error('qr net'));};
      D.head.appendChild(s);
    });
    return W.__v20qrP;
  }
  function qrDataUrl(text){
    return lazyQR().then(function(qrcode){
      var qr=qrcode(0,'M');qr.addData(text);qr.make();
      var n=qr.getModuleCount(),cell=4,pad=cell*2,sz=n*cell+pad*2;
      var c=D.createElement('canvas');c.width=c.height=sz;var x=c.getContext('2d');
      x.fillStyle='#fff';x.fillRect(0,0,sz,sz);x.fillStyle='#0a0a0a';
      for(var r=0;r<n;r++)for(var col=0;col<n;col++)if(qr.isDark(r,col))x.fillRect(pad+col*cell,pad+r*cell,cell,cell);
      return c.toDataURL('image/png');
    });
  }
  function shareUrl(){
    /* Карточка-визитка всегда ведёт на боевой домен, где бы её ни сгенерировали
       (на превью/локалке раньше подцеплялся 127.0.0.1). */
    return 'https://vioramedia.onrender.com/';
  }
  function buildCardEl(){
    var S=W.STATE||{};
    var ch=S.channel||{};
    var ai=S.ai||{};
    var niche=S.primaryNiche||(ch.niche||'');
    var score=null;
    try{score=ai.score!=null?Math.round(ai.score):(W.computeScore?Math.round(W.computeScore()):null);}catch(e){}
    var scoreCol=score==null?'#ff5c7a':(score>=70?'#36e0a0':score>=45?'#ffb020':'#ff5470');
    var leakRaw=ai.main_leak||ai.mainLeak||ai.summary||ai.verdict||'';
    var leak=trimSentence(leakRaw,240);
    var levers=topLevers(3);
    var leverHtml=levers.length?('<div class="vsc-lev-h">🚀 Топ-'+levers.length+' рычага роста</div>'
      +'<div class="vsc-levs">'+levers.map(function(l,i){
        return '<div class="vsc-lev"><span class="ln">'+(i+1)+'</span><span class="lt">'+esc(l.t)+'</span>'
          +(l.est?'<span class="le">'+esc(l.est).replace(/^\+?/,'+')+'<small style="display:block;font-size:12px;font-weight:600;color:#7fcbaa;font-family:Onest,Inter,sans-serif;margin-top:2px">просм/день</small></span>':'')+'</div>';
      }).join('')+'</div>'):'';
    var subs=ch.subs!=null?ch.subs:'';
    var card=D.createElement('div');
    card.id='vShareCard';card.setAttribute('data-v20','1');
    card.style.cssText='position:fixed;left:-99999px;top:0;width:1200px;min-height:630px;box-sizing:border-box;'
      +'padding:56px 60px;background:radial-gradient(1100px 520px at 80% -10%,rgba(255,45,85,.22),transparent 60%),linear-gradient(160deg,#120b12 0%,#0a0810 100%);'
      +'color:#fff;font-family:Onest,Inter,sans-serif;border:1px solid rgba(255,255,255,.08);';
    card.innerHTML=
      '<div style="display:flex;align-items:center;gap:14px">'
        +'<div style="width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,#FF2D55,#ff6a4d);display:flex;align-items:center;justify-content:center">'
          +'<div style="width:0;height:0;border-left:16px solid #fff;border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px"></div></div>'
        +'<div style="font-family:Sora,Onest,sans-serif;font-weight:800;font-size:22px;letter-spacing:.3px">Viora<span style="color:#ff5c7a">Media</span></div>'
        +'<div style="margin-left:auto;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#b9b2c4">AI-аудит YouTube-канала</div>'
      +'</div>'
      +'<div style="display:flex;align-items:flex-end;gap:24px;margin-top:40px">'
        +'<div style="flex:1;min-width:0">'
          +'<div style="font-size:14px;letter-spacing:.16em;text-transform:uppercase;color:#9b93a8;margin-bottom:8px">Канал</div>'
          +'<div style="font-family:Sora,Onest,sans-serif;font-weight:800;font-size:40px;line-height:1.06;word-break:break-word">'+esc(ch.title||'—')+'</div>'
          +'<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">'
            +(niche?'<span style="font-size:15px;padding:7px 14px;border-radius:999px;background:rgba(255,45,85,.14);border:1px solid rgba(255,45,85,.4);color:#ffb9c6">'+esc(niche)+'</span>':'')
            +(subs!==''?'<span style="font-size:15px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#d7d2df">'+esc(W.fmtSafe?W.fmtSafe(subs):subs)+' подписчиков</span>':'')
          +'</div>'
        +'</div>'
        +(score!=null?'<div style="text-align:center;flex:0 0 auto">'
          +'<div style="font-family:Sora,sans-serif;font-weight:800;font-size:84px;line-height:1;color:'+scoreCol+'">'+score+'</div>'
          +'<div style="font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#9b93a8;margin-top:4px">индекс роста / 100</div></div>':'')
      +'</div>'
      +(leak?'<div style="margin-top:36px;padding:22px 24px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09)">'
        +'<div style="font-size:15px;font-weight:700;color:#ff8da1;margin-bottom:9px">🩺 Главная зона роста</div>'
        +'<div style="font-size:20px;line-height:1.5;color:#ece8f2">'+esc(leak)+'</div></div>':'')
      +(leverHtml?'<div style="margin-top:26px">'+leverHtml.replace('class="vsc-lev-h"','style="font-size:15px;font-weight:700;color:#ffd98a;margin-bottom:14px"')
        .replace('class="vsc-levs"','style="display:flex;flex-direction:column;gap:10px"')
        .replace(/class="vsc-lev"/g,'style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:13px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08)"')
        .replace(/class="ln"/g,'style="width:30px;height:30px;flex:0 0 auto;border-radius:9px;background:linear-gradient(118deg,#ff2233,#ff6a4d);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px"')
        .replace(/class="lt"/g,'style="flex:1;font-size:18px;line-height:1.35;font-weight:600"')
        .replace(/class="le"/g,'style="flex:0 0 auto;text-align:right;font-family:Sora,sans-serif;font-weight:800;font-size:22px;color:#36e0a0"')
        +'</div>':'')
      +'<div id="vscFoot" style="margin-top:auto;padding-top:38px;display:flex;align-items:center;gap:18px">'
        +'<div id="vscQR" style="width:96px;height:96px;flex:0 0 auto;border-radius:12px;background:#fff;display:none"></div>'
        +'<div style="display:flex;flex-direction:column;gap:4px">'
          +'<div style="font-family:Sora,sans-serif;font-weight:800;font-size:19px">VioraMedia · продюсер в кармане</div>'
          +'<div style="font-size:15px;color:#b4adbf">Полный AI-разбор твоего канала за 2 минуты → '+esc(shareUrl().replace(/^https?:\/\//,''))+'</div>'
        +'</div>'
      +'</div>';
    return card;
  }
  function renderCard(){
    if(!W.STATE||!W.STATE.channel){toastV('Сначала проанализируй канал','warn');return;}
    var old=$('#vShareCard');if(old){try{old.parentNode.removeChild(old);}catch(e){}}
    var card=buildCardEl();
    D.body.appendChild(card);
    var url=shareUrl();
    /* QR (ленивая загрузка; если оффлайн — просто без QR, подпись остаётся) */
    var qrP=qrDataUrl(url).then(function(d){
      var box=$('#vscQR',card);if(box){box.style.display='block';box.innerHTML='<img src="'+d+'" style="width:96px;height:96px;display:block;border-radius:12px" alt="QR">';}
    }).catch(function(){/* без QR */});
    /* ждём QR максимум 1.5с, потом всё равно рендерим */
    var go=function(){
      W.vEnsureLib('html2canvas').then(function(){
        return W.html2canvas(card,{backgroundColor:null,scale:2,useCORS:true,logging:false,
          windowWidth:1240,width:1200,height:card.offsetHeight});
      }).then(function(canvas){
        try{card.parentNode.removeChild(card);}catch(e){}
        var name=((W.STATE.channel&&W.STATE.channel.title)||'viora').replace(/[^\wа-яё\- ]/gi,'').slice(0,40).trim()||'viora';
        canvas.toBlob(function(blob){
          if(!blob){toastV('Не удалось собрать картинку','err');return;}
          var a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='Viora-аудит-'+name+'.png';
          D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
          toastV('🖼 Карточка сохранена — отправляй клиенту','ok',3500);
        },'image/png');
      }).catch(function(e){
        try{card.parentNode.removeChild(card);}catch(_){}
        toastV('Не удалось собрать карточку: '+((e&&e.message)||''),'err');
      });
    };
    var done=false,fire=function(){if(done)return;done=true;go();};
    qrP.then(function(){setTimeout(fire,60);});
    setTimeout(fire,1500);
  }

  /* =========================================================
     1.2 — МОБИЛЬНЫЙ НИЖНИЙ ДОК (перенос кнопок навигации)
  ========================================================= */
  var dockEl=null,homes=[];
  function ensureDock(){
    if(dockEl)return dockEl;
    dockEl=D.createElement('nav');dockEl.id='v20dock';dockEl.setAttribute('aria-label','Навигация');
    D.body.appendChild(dockEl);
    return dockEl;
  }
  function isMobile(){return W.innerWidth<=520;}
  /* что уходит ВНИЗ в док (в этом порядке) и что остаётся ВВЕРХУ в шапке */
  var DOCK_IDS=['v6NavTools','v10howBtn','v12navAgent'];   /* Инструменты · Как это работает · AI-продюсер */
  var TOP_IDS =['v20liteBtn','v16hqBtn','v15bell'];         /* Лайт · Штаб · уведомления (колокольчик) */
  function byId(id){return D.getElementById(id);}
  function navSlot(){var nav=$('.nav .nav-in');return nav?nav.children[1]:null;}
  function toDock(){
    var dock=ensureDock();
    /* 1) три кнопки — в нижний док, строго в заданном порядке
          (порядок фиксируем через flex order: у исходных кнопок может
          быть свой order, поэтому полагаться на DOM-порядок нельзя) */
    DOCK_IDS.forEach(function(id,i){
      var b=byId(id); if(!b)return;
      if(!b.__v20home){ b.__v20home={parent:b.parentNode,next:b.nextSibling}; homes.push(b); }
      b.classList.add('v20-dkitem');
      b.style.order=String(i+1);
      /* у кнопки «Как это работает» в шапке только иконка ❓ — в доке
         добавляем читаемую подпись, чтобы кнопка была качественной */
      if(id==='v10howBtn'&&!b.querySelector('.v20-dklb')){
        var sp=D.createElement('span');sp.className='lb v20-dklb';sp.textContent='Как это работает';b.appendChild(sp);
      }
      dock.appendChild(b);                          /* append → сохраняем порядок */
    });
    /* 2) три кнопки — ВСЕГДА возвращаем в шапку и упорядочиваем
          (Лайт · Штаб · колокольчик); даже если их случайно затянуло
          в док — например, колокольчик вставляет себя рядом с кнопкой,
          уже переехавшей вниз */
    var slot=navSlot();
    if(slot){ TOP_IDS.forEach(function(id,i){var b=byId(id);if(b){b.classList.remove('v20-dkitem');b.classList.add('v20-topitem');b.style.order=String(i+1);slot.appendChild(b);}}); }
  }
  function fromDock(){
    homes.slice().forEach(function(b){
      b.classList.remove('v20-dkitem');
      b.style.order='';
      if(b.id==='v10howBtn'){var sp=b.querySelector('.v20-dklb');if(sp)sp.remove();}
      try{
        if(b.__v20home&&b.__v20home.parent){
          if(b.__v20home.next&&b.__v20home.next.parentNode===b.__v20home.parent)b.__v20home.parent.insertBefore(b,b.__v20home.next);
          else b.__v20home.parent.appendChild(b);
        }
      }catch(e){}
      b.__v20home=null;
    });
    homes=[];
    TOP_IDS.forEach(function(id){var b=byId(id);if(b){b.classList.remove('v20-topitem');b.style.order='';}});
  }
  var dockRaf=null;
  function syncDock(){
    if(dockRaf)return;
    dockRaf=requestAnimationFrame(function(){
      dockRaf=null;
      if(isMobile())toDock();else fromDock();
    });
  }

  /* =========================================================
     ХУКИ
  ========================================================= */
  function wrapRender(){
    if(W.renderDashboard&&!W.renderDashboard.__v20){
      var orig=W.renderDashboard;
      W.renderDashboard=function(){
        var r=orig.apply(this,arguments);
        setTimeout(function(){try{buildStartPanel();}catch(e){}try{markCV();}catch(e){}try{syncDock();}catch(e){}},120);
        /* v7money рендерится чуть позже — обновим панель/CV ещё раз */
        setTimeout(function(){try{markCV();}catch(e){}},900);
        return r;
      };
      W.renderDashboard.__v20=true;
    }
  }
  function wrapShare(){
    /* перехватываем все известные точки вызова карточки */
    W.shareImage=renderCard;
    W.vShareImage=renderCard;
    W.v20ShareCard=renderCard;
  }

  /* троттлинг: пассивный обработчик скролла, чтобы дать браузеру приоритет на композитинг */
  var _st;
  function lightScroll(){
    on(W,'scroll',function(){
      if(_st)return;_st=setTimeout(function(){_st=null;},1000/30);
    },{passive:true});
  }

  /* убираем смену акцентных цветов: фиксируем фирменный crimson.
     THEMES/applyTheme объявлены внутри IIFE (не на window), поэтому
     надёжнее всего — наблюдатель: любой инлайн-оверрайд акцентных
     переменных на <html> мгновенно снимаем (откат к crimson из :root). */
  var ACCENT_KEYS=['--red','--red-2','--red-neon','--accent'];
  function stripAccent(){var r=D.documentElement;ACCENT_KEYS.forEach(function(k){if(r.style.getPropertyValue(k))r.style.removeProperty(k);});}
  function lockAccent(){
    try{ localStorage.setItem('viora_accent','crimson'); }catch(e){}
    try{ if(W.THEMES&&W.THEMES.crimson){ W.THEMES={crimson:W.THEMES.crimson}; } }catch(e){}
    try{ W.vSetTheme=function(){stripAccent();}; }catch(e){}
    stripAccent();
    try{ if(W.MutationObserver){ new MutationObserver(stripAccent).observe(D.documentElement,{attributes:true,attributeFilter:['style']}); } }catch(e){}
  }

  function boot(){
    fixMetaAndManifest();
    lockAccent();
    if(liteShould())D.documentElement.classList.add('v20-lite');
    injectLiteBtn();
    killJumpyTour();
    wrapShare();
    ensureDock();
    syncDock();
    lightScroll();
    /* renderDashboard может появиться позже — пробуем обернуть несколько раз */
    wrapRender();
    var tries=0,iv=setInterval(function(){wrapRender();injectLiteBtn();syncDock();if(++tries>20||(W.renderDashboard&&W.renderDashboard.__v20))clearInterval(iv);},400);
    /* если отчёт уже на экране (напр. демо/возврат) — построим панель */
    setTimeout(function(){try{if($('#weekFocusSection')||$('.verdict'))buildStartPanel();markCV();}catch(e){}},600);

    /* следим за поздно-инжектируемыми кнопками навигации */
    try{
      var nav=$('.nav .nav-in');
      if(nav&&W.MutationObserver){new MutationObserver(syncDock).observe(nav,{childList:true,subtree:true});}
    }catch(e){}
    var rz;on(W,'resize',function(){clearTimeout(rz);rz=setTimeout(syncDock,150);});
  }
  ready(boot);
})();
