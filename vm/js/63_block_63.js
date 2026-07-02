(function(){
  if(window.__vph2)return; window.__vph2=true;
  var D=document;
  /* A) Единый стек уведомлений (анти-наложение) */
  function stack(){ var s=D.getElementById('vph2-stack'); if(!s){s=D.createElement('div');s.id='vph2-stack';D.body.appendChild(s);} return s; }
  var SEL='#v5Daily'; /* известные плавающие карточки-уведомления */
  function collect(){ try{ var ns=D.querySelectorAll(SEL); if(!ns.length)return; var s=stack(); ns.forEach(function(n){ if(n.parentNode!==s) s.appendChild(n); }); }catch(e){} }
  try{ new MutationObserver(collect).observe(D.body,{childList:true}); }catch(e){}
  collect(); setTimeout(collect,800); setTimeout(collect,2000);

  /* D) Чиним наложение: глобальный «подвал» (contentinfo) из-за SPA-вёрстки
     просвечивает поверх контента на всех экранах (top:101) и наезжает на
     заголовок — это визуальный баг. Прячем висящий дубль + чистим «галочки». */
  function fixFooter(){ try{
    D.querySelectorAll('footer.wrap, footer[role="contentinfo"], [role="contentinfo"]').forEach(function(f){ if((f.textContent||'').indexOf('Viora Media')>-1 || f.tagName==='FOOTER') f.style.display='none'; });
    var tw=D.createTreeWalker(D.body, NodeFilter.SHOW_TEXT, null);
    var rm=[]; while(tw.nextNode()){ var t=tw.currentNode; var v=(t.nodeValue||'').replace(/\s+/g,''); if(v && /^\u2713+$/.test(v)){ var pe=t.parentElement; if(pe && !/^(BUTTON|A|LABEL)$/.test(pe.tagName)) rm.push(t); } }
    rm.forEach(function(n){ try{ n.nodeValue=''; }catch(e){} });
  }catch(e){} }
  fixFooter(); setTimeout(fixFooter,600); setTimeout(fixFooter,1800);
  try{ var _mo=new MutationObserver(function(){ fixFooter(); }); _mo.observe(D.body,{childList:true,subtree:true}); }catch(e){}

  /* B) Единая маршрутизация старых входов в один профиль-центр (только дополняет отсутствующее, не переопределяет рабочее) */
  try{ if(typeof window.v5ProfOpen==='function'){ ['v3ProfOpen','v4ProfOpen','vProfileOpen','openProfile','openCabinet'].forEach(function(k){ if(typeof window[k]!=='function'){ window[k]=function(t){ return window.v5ProfOpen(t); }; } }); } }catch(e){}
})();
