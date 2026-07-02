/* ===================================================================== */
/*  PERF PACK: глобальный lazy-loading картинок + разгрузка рендера      */
/*  Модули рисуют сотни превью через innerHTML — этот наблюдатель        */
/*  автоматически добавляет loading="lazy" и decoding="async" всем <img> */
/* ===================================================================== */
(function(){
"use strict";

/* --- 1. Ленивые изображения для всего динамического контента --- */
function lazify(img){
  try{
    if(img.dataset.vPerf)return;
    img.dataset.vPerf='1';
    if(!img.hasAttribute('loading'))img.setAttribute('loading','lazy');
    if(!img.hasAttribute('decoding'))img.setAttribute('decoding','async');
  }catch(e){}
}
function scan(root){
  try{
    if(root.nodeType!==1)return;
    if(root.tagName==='IMG'){lazify(root);return;}
    var imgs=root.querySelectorAll?root.querySelectorAll('img:not([data-v-perf])'):[];
    for(var i=0;i<imgs.length;i++)lazify(imgs[i]);
  }catch(e){}
}
try{
  var mo=new MutationObserver(function(muts){
    for(var m=0;m<muts.length;m++){
      var added=muts[m].addedNodes;
      for(var n=0;n<added.length;n++)scan(added[n]);
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true});
  scan(document.documentElement);
}catch(e){}

/* --- 2. Пауза фоновых анимаций, когда вкладка скрыта --- */
try{
  document.addEventListener('visibilitychange',function(){
    document.documentElement.classList.toggle('v-hidden-tab',document.hidden);
  });
}catch(e){}

})();
