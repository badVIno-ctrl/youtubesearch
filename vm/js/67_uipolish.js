/* ===================================================================== */
/*  UI POLISH PACK (v31)                                                 */
/*  1. Кнопка «наверх» с прогрессом чтения                               */
/*  2. Быстрая навигация по секциям дашборда (десктоп)                   */
/*  3. Плавное появление карточек при скролле (reveal)                   */
/*  Всё аддитивно и уважает prefers-reduced-motion.                      */
/* ===================================================================== */
(function(){
"use strict";
var W=window,D=document;
var reduce=false;
try{reduce=W.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}

function q(s,r){return (r||D).querySelector(s);}
var _vqnSeq=0; // монотонный счётчик для уникальных id заголовков (без коллизий)

/* ---------- 1. Кнопка «наверх» с кольцом прогресса ---------- */
function initTopBtn(){
  if(q('#vTopBtn'))return;
  var b=D.createElement('button');
  b.id='vTopBtn';
  b.type='button';
  b.setAttribute('aria-label','Наверх');
  b.innerHTML='<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">'
    +'<circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2.5"/>'
    +'<circle id="vTopProg" cx="18" cy="18" r="15.5" fill="none" stroke="var(--red-2,#ff5470)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="97.4" stroke-dashoffset="97.4" transform="rotate(-90 18 18)"/>'
    +'</svg><span class="vt-arr">↑</span>';
  b.addEventListener('click',function(){W.scrollTo({top:0,behavior:reduce?'auto':'smooth'});});
  D.body.appendChild(b);
  var prog=q('#vTopProg'),ticking=false;
  function upd(){
    ticking=false;
    var h=D.documentElement,max=(h.scrollHeight-h.clientHeight)||1;
    var p=Math.min(1,h.scrollTop/max);
    b.classList.toggle('show',h.scrollTop>600);
    if(prog)prog.style.strokeDashoffset=(97.4*(1-p)).toFixed(1);
  }
  W.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(upd);}},{passive:true});
  upd();
}

/* ---------- 2. Быстрая навигация по секциям дашборда ---------- */
var NAV_MAP=[
  ['Обзор','#dashboard > :first-child'],
  ['Динамика','#vDeltaPanel'],
  ['Видео','#dashboard [id*="video" i], #dashboard [class*="vid-grid"]'],
  ['AI-аудит','#dashboard [id*="ai" i], #dashboard [class*="ai-"]']
];
function buildNav(){
  try{
    var dash=q('#dashboard');
    if(!dash||!dash.children.length||dash.style.display==='none'){var old0=q('#vQuickNav');if(old0)old0.classList.remove('show');return;}
    var items=[];
    /* собираем реальные заголовки h2/h3 верхнего уровня дашборда */
    var hs=dash.querySelectorAll('h2, section > h3, .card > h3');
    var seen={};
    for(var i=0;i<hs.length&&items.length<7;i++){
      var t=(hs[i].textContent||'').replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu,'').trim();
      if(!t||t.length<3||seen[t])continue;
      seen[t]=1;
      if(!hs[i].id)hs[i].id='vqnav-'+(_vqnSeq++);
      items.push({t:t.length>22?t.slice(0,21)+'…':t,id:hs[i].id});
    }
    if(items.length<2){var old1=q('#vQuickNav');if(old1)old1.classList.remove('show');return;}
    var nav=q('#vQuickNav');
    if(!nav){
      nav=D.createElement('nav');
      nav.id='vQuickNav';
      nav.setAttribute('aria-label','Быстрая навигация по отчёту');
      D.body.appendChild(nav);
      nav.addEventListener('click',function(e){
        var a=e.target.closest('[data-to]');if(!a)return;
        var el=D.getElementById(a.getAttribute('data-to'));
        if(!el)return;
        /* если целевая секция свёрнута в аккордеон — раскрываем её, иначе прыжок «в пустоту» */
        var sec=el.closest?el.closest('.section'):null;
        if(sec&&sec.classList.contains('collapsed')){
          try{var head=sec.querySelector('.section-h');if(head)head.click();}catch(_){}
        }
        /* прокрутка с поправкой на фиксированную (sticky) шапку, чтобы заголовок не прятался под неё */
        var navbar=q('.nav'),off=(navbar?navbar.getBoundingClientRect().height:64)+14;
        var y=el.getBoundingClientRect().top+W.pageYOffset-off;
        W.scrollTo({top:y<0?0:y,behavior:reduce?'auto':'smooth'});
      });
    }
    nav.innerHTML=items.map(function(it){return '<button type="button" data-to="'+it.id+'">'+it.t+'</button>';}).join('');
    nav.classList.add('show');
  }catch(e){}
}
function hookNav(){
  var orig=W.renderDashboard;
  if(typeof orig!=='function'){setTimeout(hookNav,500);return;}
  if(orig.__vNav)return;
  var wrapped=function(){var r=orig.apply(this,arguments);setTimeout(buildNav,400);return r;};
  wrapped.__vNav=true;
  W.renderDashboard=wrapped;
  /* прячем навигацию, когда уходим на главную */
  var origHome=W.goHome;
  if(typeof origHome==='function'&&!origHome.__vNav){
    var wh=function(){var r=origHome.apply(this,arguments);var n=q('#vQuickNav');if(n)n.classList.remove('show');return r;};
    wh.__vNav=true;W.goHome=wh;
  }
}

/* ---------- 3. Reveal-анимация карточек ---------- */
function initReveal(){
  if(reduce||!('IntersectionObserver' in W))return;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('v-in');io.unobserve(en.target);}});
  },{rootMargin:'0px 0px -8% 0px',threshold:.05});
  function watch(root){
    try{
      var cards=root.querySelectorAll?root.querySelectorAll('#dashboard > *:not(.v-rv), #ideas > *:not(.v-rv)'):[];
      for(var i=0;i<cards.length;i++){cards[i].classList.add('v-rv');io.observe(cards[i]);}
    }catch(e){}
  }
  var mo=new MutationObserver(function(){watch(D)});
  var dash=q('#dashboard'),ideas=q('#ideas');
  if(dash)mo.observe(dash,{childList:true});
  if(ideas)mo.observe(ideas,{childList:true});
  watch(D);
}

function boot(){initTopBtn();hookNav();initReveal();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);
else boot();

})();
