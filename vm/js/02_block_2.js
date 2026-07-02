/* Viora redesign enhancements — additive, non-destructive. Never touches API/data logic. */
(function(){
  "use strict";
  try{
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var fine   = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;

    /* ---------- 1. Signature cursor glow ---------- */
    if(fine && !reduce){
      var cur = document.createElement("div");
      cur.id = "vCursor";
      document.body.appendChild(cur);
      var cx=window.innerWidth/2, cy=window.innerHeight/2, tx=cx, ty=cy, raf=null;
      window.addEventListener("mousemove", function(e){
        tx=e.clientX; ty=e.clientY; cur.classList.add("on");
        var t=e.target;
        var interactive = t && t.closest && t.closest("button,a,input,.dd,.task,.vid,.out,.idea,.borrow,.lab-item,.brow,code");
        cur.classList.toggle("big", !!interactive);
        if(!raf) raf=requestAnimationFrame(loop);
      });
      window.addEventListener("mouseout", function(e){ if(!e.relatedTarget) cur.classList.remove("on"); });
      function loop(){
        cx += (tx-cx)*0.22; cy += (ty-cy)*0.22;
        cur.style.left = cx+"px"; cur.style.top = cy+"px";
        if(Math.abs(tx-cx)>0.4 || Math.abs(ty-cy)>0.4){ raf=requestAnimationFrame(loop); } else { raf=null; }
      }
    }

    /* ---------- 2. Magnetic buttons ---------- */
    if(fine && !reduce){
      var bindMagnet = function(btn){
        if(btn.__mag) return; btn.__mag=true;
        btn.addEventListener("mousemove", function(e){
          var r=btn.getBoundingClientRect();
          var mx=e.clientX-(r.left+r.width/2), my=e.clientY-(r.top+r.height/2);
          btn.style.transform="translate("+(mx*0.18)+"px,"+(my*0.22-2)+"px)";
        });
        btn.addEventListener("mouseleave", function(){ btn.style.transform=""; });
      };
      document.querySelectorAll(".btn").forEach(bindMagnet);
      // re-bind for buttons rendered later
      new MutationObserver(function(muts){
        muts.forEach(function(m){ m.addedNodes && m.addedNodes.forEach(function(n){
          if(n.nodeType!==1) return;
          if(n.classList && n.classList.contains("btn")) bindMagnet(n);
          if(n.querySelectorAll) n.querySelectorAll(".btn").forEach(bindMagnet);
        }); });
      }).observe(document.body,{childList:true,subtree:true});
    }

    /* ---------- 3. Cursor spotlight on big surfaces ---------- */
    if(fine && !reduce){
      document.addEventListener("mousemove", function(e){
        var s = e.target && e.target.closest && e.target.closest(".card,.chart-box,.mom-main,.lab-shell");
        if(!s) return;
        var r=s.getBoundingClientRect();
        s.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");
        s.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%");
      }, {passive:true});
    }

    /* ---------- 4. Condensing nav on scroll ---------- */
    var nav=document.querySelector(".nav");
    if(nav){
      var onScroll=function(){ nav.classList.toggle("scrolled", window.scrollY>24); };
      window.addEventListener("scroll", onScroll, {passive:true}); onScroll();
    }

    /* ---------- 5. Safe scroll-reveal for dashboard/idea sections ---------- */
    if(!reduce && "IntersectionObserver" in window){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
      }, {threshold:0.08, rootMargin:"0px 0px -6% 0px"});
      var prep=function(sec){
        if(sec.__rev) return; sec.__rev=true;
        sec.classList.add("reveal");
        io.observe(sec);
        // safety net: never let content stay hidden
        setTimeout(function(){ sec.classList.add("in"); }, 2200);
      };
      var scan=function(root){
        (root||document).querySelectorAll("#dashboard .section, #ideas .section").forEach(prep);
      };
      scan(document);
      ['dashboard','ideas'].forEach(function(id){
        var host=document.getElementById(id);
        if(host) new MutationObserver(function(){ scan(host); }).observe(host,{childList:true,subtree:true});
      });
    }
  }catch(err){ /* enhancements are non-critical */ }
})();
