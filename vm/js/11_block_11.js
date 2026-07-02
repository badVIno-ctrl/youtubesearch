(function(){
if(window.__VR9I)return; window.__VR9I=true;
var H=window.__VR9H||{}; var $=H.$||function(s){return document.querySelector(s);};
var dsave=(window.__VR9D||{}).save||function(){};
function wireInputs(){
  var inp=$('#veAiInput');
  if(inp&&!inp.__w){ inp.__w=true;
    inp.addEventListener('input',function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,104)+'px'; });
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); window.veSend(); } });
  }
  ['#veTitle','#veAuthor','#veBody'].forEach(function(sel){ var el=$(sel); if(el&&!el.__w){ el.__w=true; el.addEventListener('input',function(){ dsave(); }); } });
  var ttl=$('#veTitle'); if(ttl&&!ttl.__k){ ttl.__k=true; ttl.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); var b=$('#veBody'); if(b)b.focus(); } }); }
  var li=$('#veLinkInput'); if(li&&!li.__k){ li.__k=true; li.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); window.veLinkApply(); } else if(e.key==='Escape'){ e.preventDefault(); window.veLinkClose(); } }); }
  var ed=$('#vEditor'); if(ed&&!ed.__esc){ ed.__esc=true; document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var pop=$('#veLinkPop'); if(pop&&pop.classList.contains('show')){ window.veLinkClose(); return; } if($('#vEditor')&&$('#vEditor').classList.contains('open')){ window.vWriteClose(); } else if($('#vPub')&&$('#vPub').classList.contains('open')){ window.vPubClose(); } } }); }
}
function addEntryButtons(){
  var pane=$('#stgPanePosts'); if(pane&&!$('#veWriteBtn',pane)){ var existing=pane.querySelector('.stg-newchat'); var b=document.createElement('button'); b.id='veWriteBtn'; b.className='stg-newchat ve-writebtn'; b.setAttribute('onclick','vWriteOpen()'); b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>Написать пост'; if(existing){ existing.parentNode.insertBefore(b, existing); } else { pane.insertBefore(b, pane.firstChild); } }
}
function tweakVp(){ var dr=$('#vpDrawer'); if(dr&&!$('#vpWriteOwn',dr)){ var sub=dr.querySelector('.vp-bulk-sub'); if(sub){ var sp=document.createElement('button'); sp.id='vpWriteOwn'; sp.type='button'; sp.style.cssText='margin-top:8px;display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#e8e6ea;cursor:pointer;font-family:Onest,sans-serif;font-size:13px'; sp.textContent='✍️ Написать свой пост в редакторе'; sp.onclick=function(){ try{window.vpClose&&window.vpClose();}catch(e){} window.vWriteOpen(); }; sub.parentNode.insertBefore(sp, sub.nextSibling); } } }
function wrapEnter(){ ['enterYoutube','enterTelegram','goHome'].forEach(function(fn){ var orig=window[fn]; if(typeof orig==='function'&&!orig.__vr9){ window[fn]=function(){ var r=orig.apply(this,arguments); try{ var tgt=$('#hero')||$('#tgScreen'); if(tgt){ tgt.classList.remove('v-enter'); void tgt.offsetWidth; tgt.classList.add('v-enter'); } }catch(e){} return r; }; window[fn].__vr9=orig.__vr9=true; } }); }
function boot(){ try{wireInputs();}catch(e){} try{addEntryButtons();}catch(e){} try{tweakVp();}catch(e){} try{wrapEnter();}catch(e){} try{window.routeHash&&window.routeHash();}catch(e){} }
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',function(){ setTimeout(boot,300); }); } else { setTimeout(boot,300); }
setTimeout(boot,1400);
window.addEventListener('hashchange',function(){ try{window.routeHash&&window.routeHash();}catch(e){} });
setInterval(function(){ try{addEntryButtons();tweakVp();wireInputs();}catch(e){} },2500);
})();
