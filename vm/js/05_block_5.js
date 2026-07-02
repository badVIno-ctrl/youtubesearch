/* >>> feat.js R5 inject >>> */
(function(){
"use strict";
var W=window, D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function nfmt(n){n=+n||0;if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1)+'M';if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1)+'K';return ''+Math.round(n);}
var reduce = !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches);
function stval(){ try{ return (typeof STATE!=='undefined')?STATE:null; }catch(e){ return null; } }
function idval(){ try{ return (typeof IDEA_STATE!=='undefined')?IDEA_STATE:null; }catch(e){ return null; } }
function curMode(){ try{ return (typeof MODE!=='undefined')?MODE:'audit'; }catch(e){ return 'audit'; } }

/* ---------- toast ---------- */
function toast(msg,icon){
  try{
    var wrap=q('#vToastWrap'); if(!wrap){wrap=D.createElement('div');wrap.id='vToastWrap';D.body.appendChild(wrap);}
    var t=D.createElement('div');t.className='v-toast';t.innerHTML=(icon?'<span>'+icon+'</span>':'')+'<span>'+esc(msg)+'</span>';
    wrap.appendChild(t);
    setTimeout(function(){t.style.transition='opacity .4s,transform .4s';t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(function(){t.remove();},420);},2600);
  }catch(e){}
}
W.vToast=toast;

/* ---------- accent themes ---------- */
var THEMES={
  crimson:{name:'\u0411\u0430\u0433\u0440\u043e\u0432\u044b\u0439',c:'#ff2d55',vars:{'--red':'#ff2d55','--red-2':'#ff5470','--red-neon':'#ff3b5f','--accent':'#ff2d55'}},
  violet:{name:'\u0424\u0438\u043e\u043b\u0435\u0442',c:'#8b5cf6',vars:{'--red':'#8b5cf6','--red-2':'#a78bfa','--red-neon':'#a855f7','--accent':'#8b5cf6'}},
  emerald:{name:'\u0418\u0437\u0443\u043c\u0440\u0443\u0434',c:'#10b981',vars:{'--red':'#10b981','--red-2':'#34d399','--red-neon':'#2ee6a0','--accent':'#10b981'}},
  azure:{name:'\u041b\u0430\u0437\u0443\u0440\u044c',c:'#3b82f6',vars:{'--red':'#3b82f6','--red-2':'#60a5fa','--red-neon':'#3b9bff','--accent':'#3b82f6'}},
  amber:{name:'\u042f\u043d\u0442\u0430\u0440\u044c',c:'#f59e0b',vars:{'--red':'#f59e0b','--red-2':'#fbbf24','--red-neon':'#ffb020','--accent':'#f59e0b'}}
};
function applyTheme(id){
  var t=THEMES[id]||THEMES.crimson, r=D.documentElement;
  for(var k in t.vars){ if(t.vars.hasOwnProperty(k)) r.style.setProperty(k,t.vars[k]); }
  try{localStorage.setItem('viora_accent',id);}catch(e){}
  qa('.rp-swatch').forEach(function(s){s.classList.toggle('on',s.getAttribute('data-t')===id);});
}
(function(){ var id='crimson'; try{id=localStorage.getItem('viora_accent')||'crimson';}catch(e){} if(THEMES[id]) applyTheme(id); })();
W.vSetTheme=function(id){applyTheme(id);toast('\u0410\u043a\u0446\u0435\u043d\u0442: '+(THEMES[id]?THEMES[id].name:id),'\ud83c\udfa8');};

/* ---------- history store ---------- */
var KA='viora_hist_audit', KI='viora_hist_idea', CAP=6;
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]');}catch(e){return [];}}
function persist(k,arr){
  var a=arr.slice(); var purged=false;
  for(var guard=0; guard<=a.length+3; guard++){
    try{ localStorage.setItem(k,JSON.stringify(a)); return true; }
    catch(e){
      if(!purged){ purged=true; try{ Object.keys(localStorage).filter(function(x){return x.indexOf('ytc:')===0;}).forEach(function(x){localStorage.removeItem(x);}); }catch(e2){} continue; }
      var idx=-1;
      for(var i=a.length-1;i>=0;i--){ if(!a[i].pin){idx=i;break;} }
      if(idx<0){ if(a.length)a.pop(); else return false; } else a.splice(idx,1);
    }
  }
  return false;
}
function addEntry(k,entry){
  var a=load(k).filter(function(x){return String(x.k)!==String(entry.k);});
  a.unshift(entry);
  var out=[],count=0;
  for(var i=0;i<a.length;i++){ if(a[i].pin){out.push(a[i]);} else if(count<CAP){out.push(a[i]);count++;} }
  persist(k,out); return out;
}
function vTrimVid(v){ if(v&&typeof v==='object'){ delete v.description; delete v.desc; delete v.tags; delete v.transcript; delete v.localized; delete v.topicDetails; } return v; }
function vTrimState(s){ try{
  ['videos','shorts','longs'].forEach(function(key){ if(Array.isArray(s[key])) s[key].forEach(vTrimVid); });
  if(s.groups){ ['shorts','longs'].forEach(function(g){ if(s.groups[g]){ ['hits','flops'].forEach(function(arr){ if(Array.isArray(s.groups[g][arr])) s.groups[g][arr].forEach(vTrimVid); }); } }); }
  if(Array.isArray(s.competitors)) s.competitors.forEach(function(c){ if(c&&Array.isArray(c.vids)) c.vids.forEach(vTrimVid); });
}catch(e){} return s; }
function saveAudit(){
  try{
    var s=stval(); if(!s||!s.channel)return;
    var ch=s.channel, score=getScore();
    var snap=vTrimState(JSON.parse(JSON.stringify(s)));
    addEntry(KA,{k:ch.id||ch.handle||ch.title||('a'+Date.now()),ts:Date.now(),title:ch.title||'\u041a\u0430\u043d\u0430\u043b',handle:ch.handle||'',avatar:ch.avatar||'',score:score,niche:s.primaryNiche||'',state:snap});
  }catch(e){}
}
function saveIdea(){
  try{
    var s=idval(); if(!s||!s.query)return;
    var rows=s.rows||[]; var avg=rows.length?rows.reduce(function(a,v){return a+(v.mult||0);},0)/rows.length:0;
    var snap=JSON.parse(JSON.stringify(s));
    addEntry(KI,{k:'i:'+(s.query||'').toLowerCase()+'|'+(s.timeF||'')+(s.typeF||'')+(s.sizeF||''),ts:Date.now(),query:s.query||'',count:rows.length,avgMult:avg,state:snap});
  }catch(e){}
}

/* ---------- open from cache ---------- */
function hideHome(){ var h=q('#hero'); if(h)h.style.display='none'; }
function openAudit(entry){
  try{
    STATE=JSON.parse(JSON.stringify(entry.state));
    hideHome(); var id=q('#ideas'); if(id)id.style.display='none'; var ld=q('#loading'); if(ld)ld.style.display='none';
    W.renderDashboard();
    toast('\u041e\u0442\u043a\u0440\u044b\u0442\u043e \u0438\u0437 \u043a\u044d\u0448\u0430 \u00b7 '+(entry.title||''),'\ud83e\udde0');
    window.scrollTo(0,0);
  }catch(e){ toast('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c','\u26a0\ufe0f'); }
}
function openIdea(entry){
  try{
    IDEA_STATE=JSON.parse(JSON.stringify(entry.state));
    hideHome(); var db=q('#dashboard'); if(db)db.style.display='none'; var ld=q('#loading'); if(ld)ld.style.display='none';
    W.renderOutliers();
    toast('\u041e\u0442\u043a\u0440\u044b\u0442\u043e \u0438\u0437 \u043a\u044d\u0448\u0430 \u00b7 \u00ab'+(entry.query||'')+'\u00bb','\ud83e\udde0');
    window.scrollTo(0,0);
  }catch(e){ toast('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043a\u0440\u044b\u0442\u044c','\u26a0\ufe0f'); }
}
function rerunAudit(entry){ try{ W.goHome&&W.goHome(); W.setMode&&W.setMode('audit'); var i=q('#urlInput'); var v=entry.handle||entry.title; if(i&&v){i.value=v; W.startAnalysis&&W.startAnalysis();} }catch(e){} }
function rerunIdea(entry){ try{ W.goHome&&W.goHome(); W.setMode&&W.setMode('idea'); var i=q('#ideaInput'); if(i&&entry.query){i.value=entry.query; W.startIdeaSearch&&W.startIdeaSearch();} }catch(e){} }

/* ---------- recent panel ---------- */
function relTime(ts){
  var s=(Date.now()-ts)/1000;
  if(s<60)return '\u0442\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u043e';
  if(s<3600)return Math.floor(s/60)+' \u043c\u0438\u043d \u043d\u0430\u0437\u0430\u0434';
  if(s<86400)return Math.floor(s/3600)+' \u0447 \u043d\u0430\u0437\u0430\u0434';
  var d=Math.floor(s/86400); if(d===1)return '\u0432\u0447\u0435\u0440\u0430'; if(d<7)return d+' \u0434\u043d \u043d\u0430\u0437\u0430\u0434';
  try{return new Date(ts).toLocaleDateString('ru-RU',{day:'numeric',month:'short'});}catch(e){return '';}
}
function ring(score,size){
  var has=score!=null&&!isNaN(score); var s=has?Math.max(0,Math.min(100,score)):0;
  var col=s>=70?'var(--red-2)':s>=45?'#ffb020':'#ff5470';
  var r=size/2-3, c=2*Math.PI*r, off=c*(1-s/100);
  return '<svg class="rp-ring" width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'
    +'<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="4"/>'
    +'<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="4" stroke-linecap="round" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>'
    +'<text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Sora">'+(has?Math.round(score):'\u2014')+'</text></svg>';
}
function ensurePanel(){ var p=q('#recentPanel'); if(!p){ var hero=q('#hero'); if(!hero)return null; p=D.createElement('div'); p.id='recentPanel'; hero.appendChild(p); } return p; }
function renderRecent(mode){
  mode=mode||curMode(); var p=ensurePanel(); if(!p)return;
  var isAudit=mode!=='idea', k=isAudit?KA:KI, list=load(k);
  /* нет истории — пустую секцию не показываем вовсе */
  if(!list.length){ p.innerHTML=''; p.style.display='none'; return; }
  p.style.display='';
  var sw=Object.keys(THEMES).map(function(id){return '<span class="rp-swatch" data-t="'+id+'" title="'+esc(THEMES[id].name)+'" style="background:'+THEMES[id].c+'" onclick="vSetTheme(\''+id+'\')"></span>';}).join('');
  var head='<div class="rp-head"><h3>'+(isAudit?'\ud83d\udddc\ufe0f \u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435 \u0430\u0443\u0434\u0438\u0442\u044b':'\ud83d\udddc\ufe0f \u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435 \u043f\u043e\u0438\u0441\u043a\u0438 \u0438\u0434\u0435\u0439')+'</h3>'
    +'<span class="rp-sub">'+(list.length?('\u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e '+list.length+' \u00b7 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0431\u0435\u0437 \u0440\u0430\u0441\u0445\u043e\u0434\u0430 \u043a\u0432\u043e\u0442\u044b'):'')+'</span>'
    +'<span class="rp-sw" title="\u0410\u043a\u0446\u0435\u043d\u0442 \u0438\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430">'+sw+'</span></div>';
  var body;
  if(!list.length){
    body='<div class="rp-grid"><div class="rp-empty">\u0417\u0434\u0435\u0441\u044c \u043f\u043e\u044f\u0432\u044f\u0442\u0441\u044f \u0442\u0432\u043e\u0438 '+(isAudit?'\u043f\u0440\u043e\u0448\u043b\u044b\u0435 \u0430\u0443\u0434\u0438\u0442\u044b \u043a\u0430\u043d\u0430\u043b\u043e\u0432':'\u043f\u043e\u0438\u0441\u043a\u0438 \u0438\u0434\u0435\u0439')+'. \u041e\u043d\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u2014 \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0439 \u043c\u0433\u043d\u043e\u0432\u0435\u043d\u043d\u043e, \u0431\u0435\u0437 \u043d\u043e\u0432\u044b\u0445 \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432 \u043a API.</div></div>';
  } else {
    body='<div class="rp-grid">'+list.map(function(e){
      var act='<div class="rp-actions"><button class="pin '+(e.pin?'on':'')+'" data-act="pin" title="\u0417\u0430\u043a\u0440\u0435\u043f\u0438\u0442\u044c">\ud83d\udccc</button><button data-act="rerun" title="'+(isAudit?'\u041f\u0435\u0440\u0435\u0430\u043d\u0430\u043b\u0438\u0437\u0438\u0440\u043e\u0432\u0430\u0442\u044c':'\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c')+'">\ud83d\udd04</button><button data-act="del" title="\u0423\u0434\u0430\u043b\u0438\u0442\u044c">\u2715</button></div>';
      if(isAudit){
        var av='<div class="rp-av">\ud83d\udcfa'+(e.avatar?'<img src="'+esc(e.avatar)+'"/>':'')+'</div>';
        return '<div class="rp-card" data-k="'+esc(e.k)+'" data-kind="audit">'+ring(e.score,40)
          +'<div class="rp-top">'+av+'<div class="rp-tt">'+esc(e.title)+'</div></div>'
          +'<div class="rp-meta">'+(e.niche?'<span class="rp-tag">'+esc(e.niche)+'</span>':'')+'<span>'+relTime(e.ts)+'</span></div>'+act+'</div>';
      }
      return '<div class="rp-card" data-k="'+esc(e.k)+'" data-kind="idea"><div class="rp-top"><div class="rp-av">\ud83d\udd0d</div><div class="rp-tt">'+esc(e.query)+'</div></div>'
        +'<div class="rp-meta"><span class="rp-tag">'+(e.count||0)+' \u0432\u044b\u0431\u0440\u043e\u0441\u043e\u0432</span>'+(e.avgMult?'<span class="rp-tag">\u00d7'+(+e.avgMult).toFixed(1)+'</span>':'')+'<span>'+relTime(e.ts)+'</span></div>'+act+'</div>';
    }).join('')+'</div>';
  }
  p.innerHTML=head+body;
  var cur='crimson'; try{cur=localStorage.getItem('viora_accent')||'crimson';}catch(e){}
  qa('.rp-swatch',p).forEach(function(s){s.classList.toggle('on',s.getAttribute('data-t')===cur);});
  qa('.rp-av img',p).forEach(function(im){ im.addEventListener('error',function(){im.remove();}); });
  qa('.rp-card',p).forEach(function(card){
    card.addEventListener('mousemove',function(ev){var r=card.getBoundingClientRect();card.style.setProperty('--mx',(ev.clientX-r.left)+'px');card.style.setProperty('--my',(ev.clientY-r.top)+'px');});
    card.addEventListener('click',function(ev){
      var kind=card.getAttribute('data-kind'), key=card.getAttribute('data-k');
      var arr=load(kind==='audit'?KA:KI); var entry=null;
      for(var i=0;i<arr.length;i++){ if(String(arr[i].k)===String(key)){entry=arr[i];break;} }
      if(!entry)return;
      var actBtn=ev.target.closest?ev.target.closest('[data-act]'):null;
      if(actBtn){ ev.stopPropagation(); var a=actBtn.getAttribute('data-act');
        if(a==='del'){ persist(kind==='audit'?KA:KI, arr.filter(function(x){return String(x.k)!==String(key);})); renderRecent(mode); toast('\u0423\u0434\u0430\u043b\u0435\u043d\u043e','\ud83d\uddd1\ufe0f'); }
        else if(a==='pin'){ entry.pin=!entry.pin; persist(kind==='audit'?KA:KI,arr); renderRecent(mode); }
        else if(a==='rerun'){ kind==='audit'?rerunAudit(entry):rerunIdea(entry); }
        return;
      }
      kind==='audit'?openAudit(entry):openIdea(entry);
    });
  });
}
W.vRenderRecent=renderRecent;

/* ---------- score helper ---------- */
function getScore(){ try{ var s=stval(); if(s&&s.ai&&s.ai.score!=null)return Math.round(s.ai.score); if(W.computeScore)return Math.round(W.computeScore()); }catch(e){} return null; }

/* ---------- bento + insights + count-up ---------- */
function makeInsights(){
  var s=stval(); if(!s)return null; var ai=s.ai||{}; var chips=[];
  if(ai.main_leak)chips.push({lead:true,ic:'\ud83e\ude79',t:ai.main_leak});
  (ai.hit_formula||[]).slice(0,2).forEach(function(f){ if(f)chips.push({ic:'\ud83e\uddec',t:f}); });
  if(!chips.length)return null;
  var el=D.createElement('div'); el.innerHTML='<div class="v-insights"><span class="vi-lab">\u0421\u0443\u0442\u044c</span>'+chips.slice(0,4).map(function(c){return '<span class="v-chip '+(c.lead?'lead':'')+'" title="\u041d\u0430\u0436\u043c\u0438, \u0447\u0442\u043e\u0431\u044b \u0440\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c">'+c.ic+' <span class="vc-t">'+esc(''+c.t)+'</span></span>';}).join('')+'</div>';
  return el.firstChild;
}
function makeBento(){
  var s=stval(); if(!s||!s.channel)return null;
  var ch=s.channel, score=getScore(), has=score!=null;
  var vids=(s.videos&&s.videos.length)||0;
  var med=s.groups?Math.round(((s.groups.longs&&s.groups.longs.med)||(s.groups.shorts&&s.groups.shorts.med)||0)):0;
  var leak=(s.ai&&s.ai.main_leak)||'', niche=s.primaryNiche||'', formula=(s.ai&&s.ai.hit_formula&&s.ai.hit_formula[0])||'';
  var col=!has?'#888':score>=70?'var(--red-2)':score>=45?'#ffb020':'#ff5470';
  var lab=!has?'\u043d/\u0434':score>=70?'\u0421\u0438\u043b\u044c\u043d\u044b\u0439 \u043a\u0430\u043d\u0430\u043b':score>=45?'\u0415\u0441\u0442\u044c \u043a\u0443\u0434\u0430 \u0440\u0430\u0441\u0442\u0438':'\u0411\u043e\u043b\u044c\u0448\u043e\u0439 \u043f\u043e\u0442\u0435\u043d\u0446\u0438\u0430\u043b';
  var num=has?'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="Sora" class="vsr-num" data-to="'+score+'">0</text>':'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="Sora">\u2014</text>';
  var ringSvg='<svg viewBox="0 0 76 76" width="76" height="76" style="flex:none"><circle cx="38" cy="38" r="33" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"/><circle class="vsr-arc" cx="38" cy="38" r="33" fill="none" stroke="'+col+'" stroke-width="6" stroke-linecap="round" stroke-dasharray="207" stroke-dashoffset="207" transform="rotate(-90 38 38)"/>'+num+'</svg>';
  var html='<div class="v-bento">'
    +'<div class="v-tile accent"><div class="vt-k">\u26a1 \u0418\u043d\u0434\u0435\u043a\u0441 \u0440\u043e\u0441\u0442\u0430</div><div style="display:flex;align-items:center;gap:13px;margin-top:6px">'+ringSvg+'<div><div class="vt-sub" style="font-size:13px;color:#fff;font-weight:600">'+lab+'</div><div class="vt-sub">\u0438\u0437 100 \u0431\u0430\u043b\u043b\u043e\u0432</div></div></div></div>'
    +'<div class="v-tile"><div class="vt-k">\ud83d\udc65 \u041f\u043e\u0434\u043f\u0438\u0441\u0447\u0438\u043a\u0438</div><div class="vt-v vcount" data-to="'+(ch.subs||0)+'" data-fmt="1">0</div></div>'
    +'<div class="v-tile"><div class="vt-k">\ud83c\udfac \u0412\u0438\u0434\u0435\u043e \u0432 \u0440\u0430\u0437\u0431\u043e\u0440\u0435</div><div class="vt-v vcount" data-to="'+vids+'">0</div></div>'
    +'<div class="v-tile"><div class="vt-k">\ud83d\udcc8 \u041c\u0435\u0434\u0438\u0430\u043d\u0430 \u043f\u0440\u043e\u0441\u043c/\u0434\u0435\u043d\u044c</div><div class="vt-v vcount" data-to="'+med+'" data-fmt="1">0</div></div>'
    +(niche?'<div class="v-tile"><div class="vt-k">\ud83e\udded \u041d\u0438\u0448\u0430</div><div class="vt-v" style="font-size:18px">'+esc(niche)+'</div></div>':'')
    +(leak?'<div class="v-tile span2"><div class="vt-k">\ud83e\ude79 \u0413\u043b\u0430\u0432\u043d\u0430\u044f \u0443\u0442\u0435\u0447\u043a\u0430 \u0440\u043e\u0441\u0442\u0430</div><div class="v-leak">'+esc(leak)+'</div></div>':'')
    +(formula?'<div class="v-tile '+(niche?'':'span2')+'"><div class="vt-k">\ud83e\uddec \u0424\u043e\u0440\u043c\u0443\u043b\u0430 \u0445\u0438\u0442\u0430</div><div class="v-leak" style="font-weight:500">'+esc(formula)+'</div></div>':'')
    +'</div>';
  var el=D.createElement('div'); el.innerHTML=html; var bento=el.firstChild;
  setTimeout(function(){ var arc=q('.vsr-arc',bento); if(!arc)return; var off=207*(1-(has?score:0)/100); if(!reduce)arc.style.transition='stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)'; arc.style.strokeDashoffset=String(off); },60);
  return bento;
}
function countUp(root){
  qa('.vcount,.vsr-num',root).forEach(function(el){
    var to=+el.getAttribute('data-to')||0, fmtf=!!el.getAttribute('data-fmt');
    if(reduce){ el.textContent=fmtf?nfmt(to):String(Math.round(to)); return; }
    var dur=950,t0=null;
    function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1), e=1-Math.pow(1-p,3), val=to*e; el.textContent=fmtf?nfmt(val):String(Math.round(val)); if(p<1)requestAnimationFrame(step); }
    requestAnimationFrame(step);
  });
}
function injectShareBtn(rep){
  try{
    if(q('#vShareBtn'))return;
    var pdfBtn=null; qa('button',rep).forEach(function(b){ if(!pdfBtn && (/exportPDF\(\)/.test(b.getAttribute('onclick')||'')|| /PDF/.test(b.textContent))) pdfBtn=b; });
    if(!pdfBtn)return;
    var b=D.createElement('button'); b.id='vShareBtn'; b.className=pdfBtn.className; b.innerHTML='\ud83d\uddbc\ufe0f \u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u043e\u0439';
    b.addEventListener('click',function(){ shareImage(); });
    pdfBtn.parentNode.insertBefore(b,pdfBtn.nextSibling);
  }catch(e){}
}
function afterDashboard(){
  try{
    var rep=q('#report'); if(!rep)return;
    if(q('.v-bento',rep))return;
    var header=rep.children[0]||null, after=header?header.nextSibling:rep.firstChild;
    var ins=makeInsights(); if(ins)rep.insertBefore(ins,after);
    var bento=makeBento(); if(bento)rep.insertBefore(bento, ins?ins.nextSibling:after);
    countUp(rep);
    injectShareBtn(rep);
    if(W.__vFresh && !reduce){ var sc=getScore(); if(sc!=null&&sc>=70)confetti(); }
    W.__vFresh=false;
  }catch(e){}
}

/* ---------- confetti ---------- */
function confetti(){
  try{
    var c=D.createElement('canvas'); c.id='vConfetti'; D.body.appendChild(c);
    var ctx=c.getContext('2d'), WW=c.width=innerWidth, HH=c.height=innerHeight;
    var cols=['#ff2d55','#ff5470','#ffb020','#ffffff','#8b5cf6'], P=[];
    for(var i=0;i<140;i++)P.push({x:WW/2+(Math.random()-.5)*140,y:HH*0.28,vx:(Math.random()-.5)*11,vy:Math.random()*-13-4,g:.32+Math.random()*.1,r:4+Math.random()*5,c:cols[i%cols.length],rot:Math.random()*6,vr:(Math.random()-.5)*.4});
    var t0=performance.now();
    function fr(t){ var el=t-t0; ctx.clearRect(0,0,WW,HH); var alive=false;
      for(var i=0;i<P.length;i++){ var p=P[i]; p.vy+=p.g; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; if(p.y<HH+40)alive=true; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=Math.max(0,1-el/2600); ctx.fillStyle=p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6); ctx.restore(); }
      if(el<2600&&alive)requestAnimationFrame(fr); else c.remove();
    }
    requestAnimationFrame(fr);
  }catch(e){}
}

/* ---------- share image ---------- */
function shareImage(){
  try{
    var s=stval(); if(!s||!s.channel){toast('\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445 \u0434\u043b\u044f \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438');return;}
    if(!W.html2canvas){toast('\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430 \u0435\u0449\u0451 \u0433\u0440\u0443\u0437\u0438\u0442\u0441\u044f');return;}
    var ch=s.channel, score=getScore(), niche=s.primaryNiche||'', leak=(s.ai&&s.ai.main_leak)||'';
    var scol=score==null?'#fff':score>=70?'#36e0a0':score>=45?'#ffb020':'#ff5470';
    var old=q('#vShareCard'); if(old)old.remove();
    var card=D.createElement('div'); card.id='vShareCard';
    card.innerHTML='<div style="display:flex;align-items:center;gap:18px"><div style="width:54px;height:54px;border-radius:14px;background:var(--red);display:grid;place-items:center;font-size:26px">\ud83d\udcca</div><div style="font-size:26px;font-weight:800;letter-spacing:.5px">Viora<span style="color:var(--red-2)">Media</span></div><div style="margin-left:auto;font-size:18px;opacity:.7">AI-\u0430\u0443\u0434\u0438\u0442 YouTube</div></div>'
      +'<div style="display:flex;align-items:center;gap:40px"><div style="flex:1;min-width:0"><div style="font-size:22px;opacity:.65;margin-bottom:8px">\u041a\u0430\u043d\u0430\u043b</div><div style="font-size:50px;font-weight:800;line-height:1.05;word-break:break-word">'+esc(ch.title||'')+'</div>'+(niche?'<div style="margin-top:16px;display:inline-block;padding:8px 18px;border-radius:30px;background:rgba(255,255,255,.08);font-size:22px">'+esc(niche)+'</div>':'')+'</div>'
      +'<div style="text-align:center;flex:none"><div style="font-size:120px;font-weight:800;line-height:1;color:'+scol+'">'+(score==null?'\u2014':score)+'</div><div style="font-size:22px;opacity:.7">\u0438\u043d\u0434\u0435\u043a\u0441 \u0440\u043e\u0441\u0442\u0430 / 100</div></div></div>'
      +'<div style="font-size:24px;line-height:1.4">'+(leak?('<span style="opacity:.6">\u0413\u043b\u0430\u0432\u043d\u0430\u044f \u0437\u043e\u043d\u0430 \u0440\u043e\u0441\u0442\u0430: </span>'+esc((''+leak).slice(0,120))):'')+'</div>';
    D.body.appendChild(card);
    toast('\u0413\u043e\u0442\u043e\u0432\u043b\u044e \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0443\u2026','\ud83d\uddbc\ufe0f');
    W.html2canvas(card,{backgroundColor:null,scale:1.2,useCORS:true,logging:false}).then(function(cv){
      card.remove();
      cv.toBlob(function(blob){
        if(!blob){toast('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443');return;}
        var url=URL.createObjectURL(blob), a=D.createElement('a'); a.href=url; a.download='Viora_'+(ch.title||'channel').replace(/[^\w]/g,'_')+'.png'; D.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},4000);
        toast('\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0430','\u2705');
        try{ if(navigator.clipboard&&W.ClipboardItem){ navigator.clipboard.write([new W.ClipboardItem({'image/png':blob})]).then(function(){toast('\u0418 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430 \u0432 \u0431\u0443\u0444\u0435\u0440','\ud83d\udccb');},function(){}); } }catch(e){}
      },'image/png');
    },function(){ card.remove(); toast('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u0442\u044c \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443'); });
  }catch(e){ toast('\u041e\u0448\u0438\u0431\u043a\u0430 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438'); }
}
W.vShareImage=shareImage;

/* ---------- branded PDF (wraps exportPDF) ---------- */
function strip(s){return (''+s).replace(/[^\w \-]/g,'').trim().slice(0,40)||'channel';}
var _origPDF=W.exportPDF;
W.exportPDF=function(){
  var btn=null; try{ btn=(W.event&&W.event.target)||q('#vShareBtn')||q('#report button'); }catch(e){}
  var old=null; if(btn){old=btn.textContent;btn.textContent='\u23f3 \u0413\u043e\u0442\u043e\u0432\u043b\u044e PDF\u2026';btn.disabled=true;}
  function done(){ if(btn){btn.textContent=old;btn.disabled=false;} }
  return Promise.resolve().then(function(){
    var node=q('#report'); if(!node)throw new Error('no report');
    if(!W.html2canvas||!W.jspdf)throw new Error('libs');
    return W.html2canvas(node,{backgroundColor:'#0A0A0A',scale:1.4,useCORS:true,logging:false,windowWidth:node.scrollWidth}).then(function(canvas){
      var img=canvas.toDataURL('image/jpeg',0.9), jsPDF=W.jspdf.jsPDF, pdf=new jsPDF('p','mm','a4'), pw=210, ph=297;
      var s=stval()||{}, ch=s.channel||{}, score=getScore();
      pdf.setFillColor(7,6,8); pdf.rect(0,0,pw,ph,'F');
      pdf.setFillColor(255,45,85); pdf.rect(0,0,pw,46,'F');
      pdf.setTextColor(255,255,255); pdf.setFont('helvetica','bold'); pdf.setFontSize(30); pdf.text('Viora Media',16,28);
      pdf.setFontSize(13); pdf.setFont('helvetica','normal'); pdf.text('AI YouTube Channel Audit',16,38);
      if(score!=null){ pdf.setFontSize(66); if(score>=70)pdf.setTextColor(54,224,160); else if(score>=45)pdf.setTextColor(255,176,32); else pdf.setTextColor(255,84,112); pdf.text(String(score),16,120); pdf.setFontSize(13); pdf.setTextColor(180,180,180); pdf.setFont('helvetica','normal'); pdf.text('GROWTH SCORE / 100',16,132); }
      pdf.setFontSize(11); pdf.setTextColor(150,150,150); pdf.text('Generated '+new Date().toISOString().slice(0,10),16,ph-14);
      var iw=pw, ih=canvas.height*pw/canvas.width; pdf.addPage(); var pos=0,left=ih;
      pdf.addImage(img,'JPEG',0,pos,iw,ih); left-=ph;
      while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}
      pdf.save('Viora_Media_'+strip(ch.title||'channel')+'.pdf');
      toast('PDF \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d','\ud83d\udcc4');
    });
  }).then(done,function(e){ console.error(e); done(); try{ if(_origPDF)return _origPDF.call(W); }catch(_){} toast('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0431\u0440\u0430\u0442\u044c PDF'); });
};

/* ---------- command palette ---------- */
function openSection(sec){ try{ sec.classList.remove('collapsed'); var b=q('.sec-body',sec); if(b)b.style.height='auto'; sec.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); sec.style.transition='box-shadow .4s'; sec.style.boxShadow='0 0 0 2px var(--red)'; setTimeout(function(){sec.style.boxShadow='';},1200); }catch(e){} }
function cmdCommands(filter){
  var cmds=[], db=q('#dashboard'), dashOpen=db&&getComputedStyle(db).display!=='none'&&q('#report');
  if(dashOpen){
    qa('#report > .section').forEach(function(sec){ var h=q('.section-h h2',sec)||q('h2',sec); if(h)cmds.push({g:'\u0420\u0430\u0437\u0434\u0435\u043b\u044b \u043e\u0442\u0447\u0451\u0442\u0430',ic:'\ud83d\udcd1',t:h.textContent.trim(),run:function(){closePalette();openSection(sec);}}); });
    cmds.push({g:'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f',ic:'\ud83d\udcc4',t:'\u0421\u043a\u0430\u0447\u0430\u0442\u044c PDF-\u043e\u0442\u0447\u0451\u0442',run:function(){closePalette();W.exportPDF&&W.exportPDF();}});
    cmds.push({g:'\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044f',ic:'\ud83d\uddbc\ufe0f',t:'\u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u043e\u0439',run:function(){closePalette();shareImage();}});
  }
  cmds.push({g:'\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f',ic:'\ud83d\udcca',t:'\u041d\u043e\u0432\u044b\u0439 \u0430\u0443\u0434\u0438\u0442 \u043a\u0430\u043d\u0430\u043b\u0430',run:function(){closePalette();W.goHome&&W.goHome();W.setMode&&W.setMode('audit');}});
  cmds.push({g:'\u041d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f',ic:'\ud83d\udd0d',t:'\u041d\u043e\u0432\u044b\u0439 \u043f\u043e\u0438\u0441\u043a \u0438\u0434\u0435\u0439',run:function(){closePalette();W.goHome&&W.goHome();W.setMode&&W.setMode('idea');}});
  load(KA).forEach(function(e){ cmds.push({g:'\u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435 \u0430\u0443\u0434\u0438\u0442\u044b',ic:'\ud83e\udde0',t:e.title+(e.score!=null?' \u00b7 '+e.score:''),run:function(){closePalette();openAudit(e);}}); });
  load(KI).forEach(function(e){ cmds.push({g:'\u041d\u0435\u0434\u0430\u0432\u043d\u0438\u0435 \u0438\u0434\u0435\u0438',ic:'\ud83e\udde0',t:e.query,run:function(){closePalette();openIdea(e);}}); });
  Object.keys(THEMES).forEach(function(id){ cmds.push({g:'\u0422\u0435\u043c\u0430 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u044f',ic:'\ud83c\udfa8',t:'\u0410\u043a\u0446\u0435\u043d\u0442: '+THEMES[id].name,run:function(){closePalette();applyTheme(id);toast('\u0410\u043a\u0446\u0435\u043d\u0442: '+THEMES[id].name,'\ud83c\udfa8');}}); });
  if(filter){ var f=filter.toLowerCase(); cmds=cmds.filter(function(c){return (c.t+' '+c.g).toLowerCase().indexOf(f)>=0;}); }
  return cmds;
}
var CMDS=[];
function renderCmd(filter){
  var list=q('#vCmdList'); if(!list)return; CMDS=cmdCommands(filter);
  if(!CMDS.length){ list.innerHTML='<div class="vc-item">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e</div>'; return; }
  var html='',lastG=null;
  CMDS.forEach(function(c,i){ if(c.g!==lastG){ html+='<div class="vc-group">'+esc(c.g)+'</div>'; lastG=c.g; } html+='<div class="vc-item'+(i===0?' sel':'')+'" data-i="'+i+'"><span class="vc-ic">'+c.ic+'</span><span>'+esc(c.t)+'</span></div>'; });
  list.innerHTML=html;
  qa('.vc-item',list).forEach(function(el){ var i=+el.getAttribute('data-i'); el.addEventListener('click',function(){ var c=CMDS[i]; if(c&&c.run)c.run(); }); el.addEventListener('mouseenter',function(){ qa('.vc-item',list).forEach(function(x){x.classList.remove('sel');}); el.classList.add('sel'); }); });
}
function buildPalette(){
  if(q('#vCmdOv'))return;
  var ov=D.createElement('div'); ov.id='vCmdOv';
  ov.innerHTML='<div id="vCmd"><input id="vCmdInput" type="text" placeholder="\u041f\u043e\u0438\u0441\u043a \u043a\u043e\u043c\u0430\u043d\u0434, \u0440\u0430\u0437\u0434\u0435\u043b\u043e\u0432, \u0438\u0441\u0442\u043e\u0440\u0438\u0438\u2026" autocomplete="off"/><div id="vCmdList"></div><div class="vc-hint"><span><kbd>\u2191</kbd><kbd>\u2193</kbd> \u043d\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044f</span><span><kbd>\u21b5</kbd> \u0432\u044b\u0431\u0440\u0430\u0442\u044c</span><span><kbd>esc</kbd> \u0437\u0430\u043a\u0440\u044b\u0442\u044c</span><span style="margin-left:auto"><kbd>\u2318/Ctrl</kbd><kbd>K</kbd></span></div></div>';
  D.body.appendChild(ov);
  ov.addEventListener('click',function(e){ if(e.target===ov)closePalette(); });
  var inp=q('#vCmdInput',ov);
  inp.addEventListener('input',function(){ renderCmd(this.value); });
  inp.addEventListener('keydown',function(e){
    var items=qa('.vc-item',ov); if(!items.length)return;
    var cur=-1; items.forEach(function(it,i){ if(it.classList.contains('sel'))cur=i; });
    if(e.key==='ArrowDown'){ e.preventDefault(); var n=(cur+1)%items.length; items.forEach(function(x){x.classList.remove('sel');}); items[n].classList.add('sel'); items[n].scrollIntoView({block:'nearest'}); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); var p=(cur-1+items.length)%items.length; items.forEach(function(x){x.classList.remove('sel');}); items[p].classList.add('sel'); items[p].scrollIntoView({block:'nearest'}); }
    else if(e.key==='Enter'){ e.preventDefault(); var sel=q('.vc-item.sel',ov)||items[0]; if(sel)sel.click(); }
    else if(e.key==='Escape'){ closePalette(); }
  });
}
function openPalette(){ buildPalette(); var ov=q('#vCmdOv'); ov.classList.add('show'); var inp=q('#vCmdInput'); inp.value=''; renderCmd(''); setTimeout(function(){inp.focus();},30); }
function closePalette(){ var ov=q('#vCmdOv'); if(ov)ov.classList.remove('show'); }
W.vOpenPalette=openPalette;
D.addEventListener('keydown',function(e){ if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){ e.preventDefault(); var ov=q('#vCmdOv'); if(ov&&ov.classList.contains('show'))closePalette(); else openPalette(); } });

/* ---------- skeleton ---------- */
function ensureSkeleton(){
  try{
    var ld=q('#loading'); if(!ld)return;
    if(!q('#vSkeleton',ld)){ var sk=D.createElement('div'); sk.id='vSkeleton'; sk.innerHTML='<div class="sk grid"><span></span><span></span><span></span><span></span></div><div class="sk row"></div><div class="sk row" style="height:120px"></div><div class="sk row"></div>'; ld.appendChild(sk); }
    ld.classList.add('v-has-skel');
  }catch(e){}
}

/* ---------- wrap existing globals ---------- */
function wrap(name,after){ var orig=W[name]; if(typeof orig!=='function')return; W[name]=function(){ var r=orig.apply(this,arguments); try{ after.apply(this,[r,arguments]); }catch(e){} return r; }; }
var VLT=null;
function vLongStart(){ vLongClear(); VLT=setTimeout(function(){ try{ var s=document.getElementById('loadSub'); if(s){ s.innerHTML='⏳ Анализ продолжается… можешь пока сходить за чаем ☕ На больших каналах разбор занимает чуть дольше — Viora уже почти всё ✨'; s.style.color='#ffcf7a'; s.style.fontWeight='600'; } }catch(e){} }, 120000); }
function vLongClear(){ try{ if(VLT){clearTimeout(VLT);VLT=null;} var s=document.getElementById('loadSub'); if(s){ s.style.color=''; s.style.fontWeight=''; } }catch(e){} }
wrap('renderDashboard',function(){ vLongClear(); saveAudit(); afterDashboard(); });
wrap('renderOutliers',function(){ vLongClear(); saveIdea(); });
wrap('setMode',function(){ renderRecent(curMode()); });
wrap('goHome',function(){ vLongClear(); renderRecent(curMode()); });
wrap('backToHero',function(){ renderRecent('idea'); });
wrap('startAnalysis',function(){ W.__vFresh=true; vLongStart(); ensureSkeleton(); });
wrap('startIdeaSearch',function(){ vLongStart(); ensureSkeleton(); });

/* ---------- init ---------- */
function init(){ try{ renderRecent(curMode()); }catch(e){} try{ buildPalette(); }catch(e){} }
if(D.readyState==='loading'){ D.addEventListener('DOMContentLoaded',init); } else { init(); }
})();

/* <<< feat.js R5 inject <<< */
