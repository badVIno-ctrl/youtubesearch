(function(){
  "use strict";
  try{
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var PRIMARY=[/что конкретно менять/i,/моментум/i,/разбор видео/i,/план на 30/i,/контент-аудит/i,/фокус недели/i,/следующее видео/i,/реальные метрики/i,/деньги на столе/i];
    function isPrimary(t){return PRIMARY.some(function(r){return r.test(t||"");});}

    function setOpen(sec,open,animate){
      var body=sec.querySelector(":scope > .sec-body"); if(!body) return;
      if(open){
        sec.classList.remove("collapsed");
        if(animate && !reduce){
          body.style.height=body.scrollHeight+"px";
          body.addEventListener("transitionend",function te(e){ if(e.propertyName==="height"){ body.style.height="auto"; body.removeEventListener("transitionend",te);} });
        } else { body.style.height="auto"; }
      } else {
        if(animate && !reduce){
          body.style.height=body.scrollHeight+"px";
          body.getBoundingClientRect();
          requestAnimationFrame(function(){ body.style.height="0px"; });
        } else { body.style.height="0px"; }
        sec.classList.add("collapsed");
      }
    }

    function enhance(container){
      var secs=container.querySelectorAll(":scope > .section");
      secs.forEach(function(sec){
        if(sec.__acc) return;
        var head=sec.querySelector(":scope > .section-h"); if(!head) return;
        sec.__acc=true; sec.classList.add("acc");
        var body=document.createElement("div"); body.className="sec-body";
        var nodes=[],n=head.nextSibling;
        while(n){ nodes.push(n); n=n.nextSibling; }
        nodes.forEach(function(x){ body.appendChild(x); });
        sec.appendChild(body);
        var chev=document.createElement("span"); chev.className="acc-chev"; chev.textContent="\u25be";
        head.appendChild(chev);
        var h2=head.querySelector("h2");
        var title=h2?h2.textContent:"";
        setOpen(sec, isPrimary(title), false);
        head.addEventListener("click",function(e){
          if(e.target.closest("a,button,input,select,textarea,.dd,.copy,.toggle,.out-sort") && !e.target.closest(".acc-chev")) return;
          setOpen(sec, sec.classList.contains("collapsed"), true);
        });
      });
    }

    function addBar(container){
      if(container.querySelector(":scope > .acc-bar")) return;
      var bar=document.createElement("div"); bar.className="acc-bar";
      var allOpen=false;
      var btn=document.createElement("button"); btn.textContent="\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0432\u0441\u0451";
      btn.addEventListener("click",function(){
        allOpen=!allOpen;
        container.querySelectorAll(":scope > .section.acc").forEach(function(sec){ setOpen(sec,allOpen,true); });
        btn.textContent=allOpen?"\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0432\u0441\u0451":"\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0432\u0441\u0451";
      });
      bar.appendChild(btn);
      container.insertBefore(bar, container.firstChild);
    }

    function buildNav(container){
      var old=document.getElementById("secNav"); if(old) old.remove();
      var secs=container.querySelectorAll(":scope > .section");
      if(secs.length<3) return;
      var nav=document.createElement("div"); nav.id="secNav";
      secs.forEach(function(sec){
        var h=sec.querySelector(".section-h h2"); if(!h) return;
        var b=document.createElement("button"); b.className="nav-dot";
        var lbl=document.createElement("span"); lbl.className="lbl"; lbl.textContent=h.textContent.trim();
        var dot=document.createElement("i");
        b.appendChild(lbl); b.appendChild(dot);
        b.addEventListener("click",function(){
          setOpen(sec,true,true);
          var y=sec.getBoundingClientRect().top+window.scrollY-80;
          window.scrollTo({top:y,behavior:reduce?"auto":"smooth"});
        });
        sec.__navdot=b;
        nav.appendChild(b);
      });
      document.body.appendChild(nav);
    }

    function activeObserver(container){
      if(!("IntersectionObserver" in window)) return;
      if(container.__io) container.__io.disconnect();
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          var d=en.target.__navdot; if(!d) return;
          if(en.isIntersecting){
            var act=document.querySelectorAll("#secNav .nav-dot.active");
            act.forEach(function(x){ x.classList.remove("active"); });
            d.classList.add("active");
          }
        });
      },{rootMargin:"-45% 0px -45% 0px"});
      container.querySelectorAll(":scope > .section").forEach(function(s){ io.observe(s); });
      container.__io=io;
    }

    function visible(el){ return el && getComputedStyle(el).display!=="none"; }
    function refreshRail(){
      var nav=document.getElementById("secNav"); if(!nav) return;
      var dash=document.getElementById("dashboard");
      nav.classList.toggle("show", visible(dash) && nav.children.length>0);
    }

    function run(container, withNav){
      if(!container) return;
      var c = container.querySelector("#report") || container;
      enhance(c);
      if(window.__vioraExtra){ try{ window.__vioraExtra(c); }catch(e){} }
      addBar(c);
      if(withNav){ buildNav(c); activeObserver(c); }
      refreshRail();
    }

    var timers={};
    function schedule(id, withNav){
      clearTimeout(timers[id]);
      timers[id]=setTimeout(function(){ run(document.getElementById(id), withNav); }, 450);
    }

    [{id:"dashboard",nav:true},{id:"ideas",nav:false}].forEach(function(cfg){
      var host=document.getElementById(cfg.id); if(!host) return;
      new MutationObserver(function(){ schedule(cfg.id, cfg.nav); }).observe(host,{childList:true});
      new MutationObserver(refreshRail).observe(host,{attributes:true,attributeFilter:["style"]});
    });
  }catch(e){ /* never break the app */ }
})();
