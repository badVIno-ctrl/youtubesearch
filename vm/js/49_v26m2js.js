/* VIORA v26.m2 — универсальный загрузчик через MutationObserver. Идемпотентен. */
(function(){
'use strict';
if(window.__v26m2)return;window.__v26m2=true;
var D=document,W=window;
function qa(s,r){return [].slice.call((r||D).querySelectorAll(s));}
/* селекторы всех спиннеров в проекте (кроме мелкого инлайна в автоподсказках) */
var SPIN='.loader-ring,.v25-spin,.v4-spin,.vsc-spin,.ns-load .sp,.x5-load .loader-ring';
function makeOrb(sz){
  var o=D.createElement('div');o.className='v26orb';
  o.innerHTML='<span></span><span></span><span></span><b></b>';
  sz=Math.max(34,Math.min(82,sz||58));
  o.style.width=sz+'px';o.style.height=sz+'px';
  o.style.setProperty('--g',Math.round(sz*0.15)+'px');
  o.style.setProperty('--bw',Math.max(2,Math.round(sz*0.05))+'px');
  return o;
}
function upgradeSpinners(root){
  qa(SPIN,root||D).forEach(function(el){
    if(el.__v26up||el.classList.contains('v26orb'))return;el.__v26up=1;
    try{
      var r=el.getBoundingClientRect();var sz=Math.round(r.width)||parseInt((el.style&&el.style.width)||'',10)||58;
      var o=makeOrb(sz);
      el.style.display='none';
      if(el.parentNode)el.parentNode.insertBefore(o,el.nextSibling);
    }catch(e){}
  });
}
/* живые статус-строки для загрузочных контейнеров без ступеней (v25, next-shoot) */
var rotters=[];
function sweep(){rotters=rotters.filter(function(r){if(!D.contains(r.el)){clearInterval(r.t);return false;}return true;});}
function lines(ctx){
  if(ctx==='topics')return ['Изучаю твою нишу…','Ищу залетающие форматы…','Считаю шансы на просмотры…','Почти готово ✨'];
  if(ctx==='package')return ['Пишу цепляющий заголовок…','Собираю сценарий по шагам…','Готовлю превью и описание…','Почти готово ✨'];
  return ['Анализирую…','Собираю данные…','Почти готово ✨'];
}
function enhanceLoad(el,ctx){
  if(el.__v26e)return;el.__v26e=1;
  var L=lines(ctx);
  var rot=D.createElement('div');rot.className='v26-rot';rot.textContent=L[0];
  var bar=D.createElement('div');bar.className='v26-prog';bar.innerHTML='<i></i>';
  el.appendChild(rot);el.appendChild(bar);
  var i=0;var t=setInterval(function(){
    if(!D.contains(el)){clearInterval(t);return;}
    i=(i+1)%L.length;rot.classList.add('fade');
    setTimeout(function(){try{rot.textContent=L[i];rot.classList.remove('fade');}catch(e){}},300);
  },2200);
  rotters.push({el:el,t:t});
}
function enhanceContainers(){
  qa('.v25-load',D).forEach(function(el){
    var lt=((el.querySelector('.lt')||{}).textContent||'').toLowerCase();
    enhanceLoad(el,/тем/.test(lt)?'topics':(/ролик/.test(lt)?'package':''));
  });
}
function run(root){try{upgradeSpinners(root);}catch(e){}try{enhanceContainers();}catch(e){}sweep();}
/* старт + наблюдение */
function boot(){
  run();
  try{
    var mo=new MutationObserver(function(muts){
      var hit=false;
      for(var i=0;i<muts.length;i++){if(muts[i].addedNodes&&muts[i].addedNodes.length){hit=true;break;}}
      if(hit)run();
    });
    mo.observe(D.body,{childList:true,subtree:true});
  }catch(e){}
  setInterval(run,1200);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
W.__v26m2api={upgrade:upgradeSpinners,makeOrb:makeOrb};
})();
