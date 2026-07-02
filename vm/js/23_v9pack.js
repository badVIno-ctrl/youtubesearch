/* =====================================================================
   VIORA v9 — JS: умное позиционирование дропдаунов, Escape, мелочи
   ===================================================================== */
(function(){
'use strict';
if(window.__V9)return;window.__V9=true;
var D=document;
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}

/* дропдаун открывается вверх, если у нижнего края экрана */
D.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest&&e.target.closest('.v5dd-btn');
  if(!btn)return;
  setTimeout(function(){
    try{
      var dd=btn.parentNode;
      if(!dd||!dd.classList||!dd.classList.contains('open'))return;
      dd.classList.remove('up');
      var menu=dd.querySelector('.v5dd-menu');
      if(!menu)return;
      var r=menu.getBoundingClientRect();
      if(r.bottom>window.innerHeight-10&&r.top>r.height+24)dd.classList.add('up');
    }catch(_){}
  },0);
},true);

/* Escape закрывает дропдауны и меню студии */
D.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  qa('.v5dd.open,.stg-modemenu.open,.stg-plusmenu.open').forEach(function(x){x.classList.remove('open');});
});

/* короткий плейсхолдер композера на узких экранах (длинный не влезает) */
function fitPh(){
  try{
    var t=D.getElementById('tgInput');if(!t)return;
    if(!t.__phFull)t.__phFull=t.getAttribute('placeholder')||'';
    t.setAttribute('placeholder',window.innerWidth<640?'Спроси Viora…':t.__phFull);
  }catch(_){}
}
fitPh();
window.addEventListener('resize',fitPh);
})();
