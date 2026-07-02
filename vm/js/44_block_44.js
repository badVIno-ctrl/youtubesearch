/* VIORA v23 phase-1 — collapse «Продюсерский разбор», self-contained */
(function(){
'use strict';
var D=document;
var KEY='viora_v23_b2open';
function isOpen(){try{return localStorage.getItem(KEY)==='1';}catch(e){return false;}}
function setOpen(v){try{localStorage.setItem(KEY,v?'1':'0');}catch(e){}}
function apply(card){
  if(!card)return;
  var head=card.querySelector('.v20b2-head');
  var title=card.querySelector('.v20b2-title');
  if(!head||!title)return;
  /* добавить шеврон один раз */
  if(!title.querySelector('.v23-b2chev')){
    var chev=D.createElement('span');chev.className='v23-b2chev';chev.textContent='▾';
    title.appendChild(chev);
    /* подсказка в свёрнутом виде */
    if(!card.querySelector('.v23-b2hint')){
      var hint=D.createElement('div');hint.className='v23-b2hint';hint.textContent='Нажми, чтобы развернуть полный разбор';
      head.appendChild(hint);
    }
    /* клик по заголовку (но не по кнопкам режим/сегмент) переключает */
    title.addEventListener('click',function(ev){
      ev.stopPropagation();
      var open=!card.classList.contains('v23-collapsed')?false:true; /* если развёрнут -> свернём */
      card.classList.toggle('v23-collapsed');
      setOpen(!card.classList.contains('v23-collapsed'));
    });
  }
  /* начальное состояние: свёрнут, пока пользователь не раскрыл */
  if(!card.dataset.v23init){
    card.dataset.v23init='1';
    if(isOpen())card.classList.remove('v23-collapsed');
    else card.classList.add('v23-collapsed');
  } else {
    /* при ре-рендере сохраняем выбранное состояние */
    if(isOpen())card.classList.remove('v23-collapsed');else card.classList.add('v23-collapsed');
  }
}
function scan(){try{D.querySelectorAll('.b2-card').forEach(apply);}catch(e){}}
function boot(){
  scan();
  try{var mo=new MutationObserver(function(){scan();});mo.observe(D.body,{childList:true,subtree:true});}catch(e){}
  setInterval(scan,1800);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
window.__v23={scan:scan};
})();
