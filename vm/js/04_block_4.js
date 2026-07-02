(function(){
  "use strict";
  try{
    function ce(tag,cls){var e=document.createElement(tag); if(cls)e.className=cls; return e;}
    var built=false, ov, panel, inner, titleEl, tab;
    function ensureUI(){
      if(built) return; built=true;
      ov=ce("div"); ov.id="sideOv";
      panel=ce("aside"); panel.id="sidePanel";
      var head=ce("div","sp-head");
      titleEl=ce("h3"); titleEl.id="sideTitle"; titleEl.textContent="\u041f\u0443\u0442\u044c \u043a\u0430\u043d\u0430\u043b\u0430";
      var close=ce("button"); close.id="sideClose"; close.innerHTML="\u2715";
      head.appendChild(titleEl); head.appendChild(close);
      inner=ce("div"); inner.id="sideInner";
      panel.appendChild(head); panel.appendChild(inner);
      document.body.appendChild(ov); document.body.appendChild(panel);
      tab=ce("button"); tab.id="journeyTab";
      tab.appendChild(ce("span","pulse"));
      tab.appendChild(document.createTextNode("\ud83e\udded \u041f\u0443\u0442\u044c \u043a\u0430\u043d\u0430\u043b\u0430"));
      document.body.appendChild(tab);
      function open(){ ov.classList.add("show"); panel.classList.add("show"); tab.classList.add("hidden"); }
      function shut(){ ov.classList.remove("show"); panel.classList.remove("show"); tab.classList.remove("hidden"); }
      tab.addEventListener("click",open);
      ov.addEventListener("click",shut);
      close.addEventListener("click",shut);
      document.addEventListener("keydown",function(e){ if(e.key==="Escape") shut(); });
    }
    function syncTab(){
      if(!built) return;
      var dash=document.getElementById("dashboard");
      var vis=dash && getComputedStyle(dash).display!=="none";
      tab.classList.toggle("show", !!(vis && inner.childNodes.length));
      if(!vis){ ov.classList.remove("show"); panel.classList.remove("show"); }
    }
    window.__vioraExtra=function(c){
      ensureUI();
      if(c){
        var secs=c.querySelectorAll(":scope > .section");
        var target=null;
        secs.forEach(function(s){ var h=s.querySelector(".section-h h2"); if(h && /\u043f\u0443\u0442\u044c \u043a\u0430\u043d\u0430\u043b\u0430/i.test(h.textContent)) target=s; });
        if(target){
          target.classList.remove("acc","collapsed");
          var chev=target.querySelector(".acc-chev"); if(chev) chev.remove();
          var b=target.querySelector(":scope > .sec-body"); if(b) b.style.height="auto";
          var sh=target.querySelector(":scope > .section-h");
          if(sh){ var hh=sh.querySelector("h2"); if(hh){ titleEl.textContent=hh.textContent; hh.style.display="none"; } sh.style.cursor="default"; }
          inner.innerHTML=""; inner.appendChild(target);
        }
      }
      syncTab();
    };
    var dash=document.getElementById("dashboard");
    if(dash){ new MutationObserver(syncTab).observe(dash,{attributes:true,attributeFilter:["style"]}); }
  }catch(e){}
})();
