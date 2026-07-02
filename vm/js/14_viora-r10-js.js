/* ===== VIORA R10 logic ===== */
(function(){
'use strict';
if(window.__VR10)return; window.__VR10=true;
var D=document;
function vq(s,r){return (r||D).querySelector(s);}
function vqa(s,r){return [].slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
function toast(m){ try{ if(window.toastY){window.toastY(m);return;} }catch(e){} var t=D.createElement('div'); t.textContent=m; t.style.cssText='position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:99999;background:#1c1c20;color:#fff;padding:11px 18px;border-radius:12px;font-family:Onest,Sora,sans-serif;font-size:13.5px;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 44px -16px rgba(0,0,0,.7)'; D.body.appendChild(t); setTimeout(function(){t.style.transition='.3s';t.style.opacity='0';},1600); setTimeout(function(){try{t.remove();}catch(e){}},2000); }
var POSTS_KEY='viora_tg_posts_v1';
function getPosts(){ try{ if(window.__VP&&window.__VP.pget){var r=window.__VP.pget();return Array.isArray(r)?r:[];} }catch(e){} try{ var x=JSON.parse(localStorage.getItem(POSTS_KEY)||'[]'); return Array.isArray(x)?x:[]; }catch(e){return [];} }
function setPosts(a){ try{ if(window.__VP&&window.__VP.pset){window.__VP.pset(a);} else localStorage.setItem(POSTS_KEY,JSON.stringify(a)); }catch(e){} try{ if(window.__VP&&window.__VP.pdRender)window.__VP.pdRender(); }catch(e){} }
function ptext(p){ try{ if(window.__VP&&window.__VP.ptext){return window.__VP.ptext(p)||'';} }catch(e){} return (p&&(p.text||p.content))||''; }
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function fmt(n){ try{ if(window.fmt)return window.fmt(n);}catch(e){} n=Number(n)||0; if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1)+'M'; if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1)+'K'; return String(Math.round(n)); }
function median(a){a=(a||[]).filter(function(x){return typeof x==='number'&&isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
window.__VR10API={vq:vq,vqa:vqa,esc:esc,toast:toast,getPosts:getPosts,setPosts:setPosts,ptext:ptext,uid:uid,fmt:fmt,median:median,D:D};
(function(){
var A=window.__VR10API,vq=A.vq,vqa=A.vqa,esc=A.esc,fmt=A.fmt,median=A.median,D=A.D;
/* (2) chat avatar V monogram */
var V_SVG='<svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5 L12 19 L20 5.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
window.__VR10_brandChat=function(){ vqa('.chat-head .av').forEach(function(av){ if(av.__vr)return; av.__vr=1; av.innerHTML=V_SVG; }); };
/* (1a) roadmap: keep style, more videos */
function enrichedRoadmap(videos){
  var _all=(videos||[]).filter(function(v){return v&&v.published;});
  var _longs=_all.filter(function(v){return !v.isShort;});
  var vids=(_longs.length>=4?_longs:_all).slice().sort(function(a,b){return new Date(a.published)-new Date(b.published);});
  if(vids.length<3)return [];
  var F=(window.fmt||fmt), MED=(window.median||median), ms=[], used={};
  function push(m){ if(m.v){ if(used[m.v.id])return; used[m.v.id]=1; } ms.push(m); }
  push({date:vids[0].published,type:'start',v:vids[0],note:'Старт разобранного периода — точка отсчёта. Первый ролик набрал '+F(vids[0].views)+' просмотров.'});
  var earlyN=Math.max(4,Math.floor(vids.length*0.6));
  var flops=vids.slice(1,earlyN).slice().sort(function(a,b){return (a.viewsPerDay||0)-(b.viewsPerDay||0);}).slice(0,6);
  flops.sort(function(a,b){return new Date(a.published)-new Date(b.published);});
  var lastFi=-99;
  flops.forEach(function(v){ var idx=vids.indexOf(v); if(idx-lastFi>=2 && used.__fc!==3){ push({date:v.published,type:'flop',v:v,note:'Не залетел: '+F(v.views)+' просмотров (~'+F(Math.round(v.viewsPerDay||0))+'/день). Тема или подача не зацепили аудиторию.'}); lastFi=idx; used.__fc=(used.__fc||0)+1; } });
  var firstShort=vids.find(function(v){return v.isShort;});
  var firstLong=vids.find(function(v){return !v.isShort;});
  if(firstShort&&firstLong){var later=new Date(firstShort.published)>new Date(firstLong.published)?firstShort:firstLong; if(later!==vids[0]) push({date:later.published,type:'format',v:later,note:'Автор начал совмещать форматы — '+(later.isShort?'добавил Shorts':'добавил длинные ролики')+'. Это расширяет охват.'}); }
  var bo=0,lastBo=-99;
  for(var i=4;i<vids.length;i++){ var prev=vids.slice(Math.max(0,i-8),i); var mm=MED(prev.map(function(v){return v.viewsPerDay||0;})); if(mm>0 && (vids[i].viewsPerDay||0)>=2.2*mm && (i-lastBo)>=3){ push({date:vids[i].published,type:'breakout',v:vids[i],note:(bo===0?'Первый прорыв: ':'Очередной рывок: ')+'×'+((vids[i].viewsPerDay||0)/mm).toFixed(1)+' к прежнему уровню ('+F(Math.round(vids[i].viewsPerDay||0))+'/день). Сработала тема и подача.'}); bo++; lastBo=i; if(bo>=5)break; } }
  var best=0,rises=0,lastRi=-99;
  for(var j=1;j<vids.length;j++){ if((vids[j].views||0)>best){ if(best>0 && (vids[j].views||0)>=best*1.5 && (j-lastRi)>=3 && rises<3){ push({date:vids[j].published,type:'rise',v:vids[j],note:'Новый рекорд по просмотрам на тот момент: '+F(vids[j].views)+'. Канал растёт.'}); rises++; lastRi=j; } best=vids[j].views||0; } }
  var gapsOf=function(arr){var ds=arr.map(function(v){return new Date(v.published).getTime();}).sort(function(a,b){return a-b;});var g=[];for(var k=1;k<ds.length;k++)g.push((ds[k]-ds[k-1])/864e5);return g;};
  var third=Math.floor(vids.length/3);
  if(third>=3){var me=MED(gapsOf(vids.slice(0,third))),ml=MED(gapsOf(vids.slice(-third)));var pivot=vids[vids.length-third];
    if(me&&ml&&ml<=me*0.6)push({date:pivot.published,type:'freq',v:pivot,note:'Темп вырос: интервал сократился с ~'+Math.round(me)+' до ~'+Math.round(ml)+' дн. Регулярность любит алгоритм.'});
    else if(me&&ml&&ml>=me*1.7)push({date:pivot.published,type:'freq',v:pivot,note:'Темп упал: интервал вырос с ~'+Math.round(me)+' до ~'+Math.round(ml)+' дн. Это тормозит рост.'}); }
  var bestEver=vids.slice().sort(function(a,b){return (b.views||0)-(a.views||0);})[0];
  push({date:bestEver.published,type:'peak',v:bestEver,note:'Пик по просмотрам: «'+String(bestEver.title||'').slice(0,50)+'» — '+F(bestEver.views)+'. Эталон формата.'});
  ms.sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  return ms.slice(0,16);
}
try{ window.computeRoadmap=enrichedRoadmap; }catch(e){}
try{ window.renderRoadmap=function(){
  var el=(window.$?window.$('#roadmapArea'):vq('#roadmapArea')); if(!el)return;
  var S=(typeof STATE!=='undefined'&&STATE)?STATE:(window.STATE||{}); var rm=S.roadmap||[]; var story=(S.ai&&S.ai.roadmap_story)||'';
  if(rm.length<2){el.innerHTML='<div class="card"><div class="empty">Недостаточно роликов с датами.</div></div>';return;}
  var ES=window.esc||esc, F=window.fmt||fmt, SI=window.safeImg||function(u){return u||'';};
  var icon={start:'🚩',format:'🔀',breakout:'🚀',freq:'⏱️',peak:'🏆',flop:'💤',rise:'📈',recovery:'🔁'};
  var items=rm.map(function(m){var d=new Date(m.date).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'});var v=m.v;return '<div class="rm-item '+m.type+'"><div class="rm-dot">'+(icon[m.type]||'•')+'</div><div class="rm-body"><div class="rm-date">'+d+'</div>'+(v?'<a class="rm-vid" href="https://youtu.be/'+v.id+'" target="_blank" rel="noopener"><img src="'+SI(v.thumb)+'" loading="lazy"/><span>«'+ES(String(v.title||'')).slice(0,70)+'»</span></a>':'')+'<div class="rm-note">'+ES(m.note)+'</div>'+(v?'<div class="rm-mini">👁 '+F(v.views)+' · 📈 '+F(Math.round(v.viewsPerDay||0))+'/день · '+(v.isShort?'⚡ Shorts':'🎬 Длинное')+'</div>':'')+'</div></div>';}).join('');
  el.innerHTML=(story?'<div class="rm-story">🧭 '+ES(story)+'</div>':'')+'<div class="roadmap">'+items+'</div>';
}; }catch(e){}
})();
(function(){
var A=window.__VR10API,vq=A.vq,vqa=A.vqa,esc=A.esc,D=A.D;
var ARROW='<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function splitTitle(raw){ raw=(raw||'').trim(); var parts=raw.split(/\s+/); var ic=''; if(parts.length>1 && /[\u2190-\u2bff\u2600-\u27bf\ufe0f\u2764\ud800-\udfff]/.test(parts[0])){ ic=parts.shift(); } return {ic:ic||'📊',txt:parts.join(' ')||raw}; }
function isSectionReady(sec){ try{ if(sec.style.display==='none')return false; if(getComputedStyle(sec).display==='none')return false; }catch(e){} var txt=(sec.textContent||'').replace(/\s+/g,''); return txt.length>30; }
var openSec=null,openHome=null;
function resizeCharts(){ try{ window.dispatchEvent(new Event('resize')); }catch(e){} try{ if(window.charts){Object.keys(window.charts).forEach(function(k){try{window.charts[k]&&window.charts[k].resize&&window.charts[k].resize();}catch(e){}});} }catch(e){} }
function ensureOverlay(){ var ov=vq('#vrOverlay'); if(ov)return ov; ov=D.createElement('div'); ov.id='vrOverlay'; ov.className='vr-ov'; ov.innerHTML='<div class="vr-ov-top"><button class="vr-ov-back" type="button"><svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Назад</button><div class="vr-ov-title"></div></div><div class="vr-ov-body"></div>'; D.body.appendChild(ov); ov.querySelector('.vr-ov-back').onclick=closeCard; ov.addEventListener('click',function(e){ if(e.target===ov)closeCard(); }); return ov; }
function openCard(sec,title){ var ov=ensureOverlay(); var body=ov.querySelector('.vr-ov-body'); ov.querySelector('.vr-ov-title').textContent=title; openSec=sec; openHome=sec.parentNode; body.innerHTML=''; body.appendChild(sec); sec.style.display='block'; ov.classList.add('open'); D.body.style.overflow='hidden'; setTimeout(resizeCharts,80); }
function closeCard(){ var ov=vq('#vrOverlay'); if(!ov)return; if(openSec&&openHome){ openHome.appendChild(openSec); openSec.style.display='none'; } openSec=null;openHome=null; ov.classList.remove('open'); D.body.style.overflow=''; }
D.addEventListener('keydown',function(e){ if(e.key==='Escape'){ var ov=vq('#vrOverlay'); if(ov&&ov.classList.contains('open'))closeCard(); } });
function syncCards(){
  var report=vq('#dashboard #report'); if(!report)return;
  var grid=vq('#vrCardGrid',report), store=vq('#vrStore',report);
  if(!grid){
    store=D.createElement('div'); store.id='vrStore'; store.style.display='none';
    grid=D.createElement('div'); grid.id='vrCardGrid'; grid.className='vr-cards';
    var anchor=null; vqa(':scope > .section',report).forEach(function(s){ if(s.querySelector('.ch-head')||s.querySelector('.verdict')||s.id==='weekFocusSection'||s.id==='nextShootSection'||s.id==='myStatsSection')anchor=s; });
    if(anchor){ report.insertBefore(grid,anchor.nextSibling); report.insertBefore(store,grid.nextSibling); }
    else { report.insertBefore(grid,report.firstChild); report.insertBefore(store,grid.nextSibling); }
  }
  vqa(':scope > .section',report).forEach(function(sec){
    if(sec===grid||sec===store)return;
    if(sec.querySelector('.ch-head'))return;
    if(sec.querySelector('.verdict'))return;
    if(sec.querySelector('#roadmapArea'))return;
    if(sec.querySelector('.fab-bar'))return;
    if(sec.id==='weekFocusSection'||sec.id==='nextShootSection'||sec.id==='myStatsSection'||sec.id==='v7money')return; /* ключевые секции продюсера всегда на виду */
    if(sec.__carded)return;
    if(!isSectionReady(sec))return;
    sec.__carded=true;
    var h2=sec.querySelector('.section-h h2')||sec.querySelector('h2');
    var _h3=sec.querySelector('h3');
    var raw=h2?h2.textContent.trim():(_h3?_h3.textContent.trim():'Раздел');
    var sp=splitTitle(raw);
    var desc=sec.querySelector('.desc'); var dtxt=desc?desc.textContent.trim():'';
    var card=D.createElement('button'); card.type='button'; card.className='vr-card';
    card.innerHTML='<div class="ic">'+sp.ic+'</div><div class="ct">'+esc(sp.txt)+'</div><div class="cd">'+esc(dtxt||'Открыть раздел с подробностями.')+'</div><div class="cgo">Подробнее '+ARROW+'</div>';
    card.onclick=function(){ openCard(sec,sp.txt); };
    grid.appendChild(card); store.appendChild(sec); sec.style.display='none';
  });
  var rs=null; vqa(':scope > .section',report).forEach(function(s){ if(s.querySelector('#roadmapArea'))rs=s; });
  if(rs && report.lastElementChild!==rs){ report.appendChild(rs); }
}
window.__VR10_syncCards=syncCards;
try{ var _rd=window.renderDashboard; if(typeof _rd==='function'){ window.renderDashboard=function(){ var r=_rd.apply(this,arguments); try{ setTimeout(syncCards,300); setTimeout(syncCards,1300); }catch(e){} return r; }; } }catch(e){}
try{ var _ve=window.__vioraExtra; window.__vioraExtra=function(c){ if(typeof _ve==='function'){try{_ve(c);}catch(e){}} try{ setTimeout(syncCards,250); }catch(e){} }; }catch(e){}
})();
(function(){
var A=window.__VR10API,vq=A.vq,vqa=A.vqa,esc=A.esc,toast=A.toast,getPosts=A.getPosts,setPosts=A.setPosts,ptext=A.ptext,uid=A.uid,D=A.D;
function postTitleOf(p){ if(p&&p.title)return p.title; var t=ptext(p); var m=t.match(/^\s*\*\*(.+?)\*\*/); if(m)return m[1].trim(); return (t.split('\n')[0]||'Без названия').slice(0,60); }
function postSnippet(p){ var t=ptext(p).replace(/^\s*\*\*(.+?)\*\*\s*/,'').replace(/\s+/g,' ').trim(); return t.slice(0,110); }
function textToHtml(t){ t=String(t||'').replace(/^\s*\*\*(.+?)\*\*\s*\n*/,''); var paras=t.split(/\n{2,}/); return paras.map(function(p){ p=esc(p).replace(/\n/g,'<br>'); return '<p>'+(p||'<br>')+'</p>'; }).join('')||'<p><br></p>'; }
function openEditor(){ var ed=vq('#vEditor'); if(!ed)return; ed.classList.add('open','has-rail'); D.body.style.overflow='hidden'; }
function openPostForEdit(p){ buildRail(); openEditor(); var t=vq('#veTitle'),a=vq('#veAuthor'),b=vq('#veBody'); if(t)t.innerText=postTitleOf(p); if(a)a.innerText=p.author||''; if(b)b.innerHTML=p.html?p.html:textToHtml(ptext(p)); window.__veEditId=p.id; _railSig=''; refreshRail(); setTimeout(function(){ if(b)b.focus(); },90); }
function newPost(){ buildRail(); openEditor(); var t=vq('#veTitle'),a=vq('#veAuthor'),b=vq('#veBody'); if(t)t.innerText=''; if(a)a.innerText=''; if(b)b.innerHTML='<p><br></p>'; window.__veEditId=null; _railSig=''; refreshRail(); setTimeout(function(){ if(t)t.focus(); },90); }
var _railSig='';
function refreshRail(){ var list=vq('.ve-rail .ve-rail-list'); if(!list)return; var posts=getPosts(); var cur=window.__veEditId||''; var sig=cur+'|'+posts.map(function(p){return p.id+':'+(p.ts||0)+':'+postTitleOf(p);}).join('~'); if(sig===_railSig)return; _railSig=sig;
  if(!posts.length){ list.innerHTML='<div class="ve-rail-empty">Пока нет сохранённых постов.<br>Нажми «Новый пост», чтобы начать.</div>'; return; }
  list.innerHTML=posts.map(function(p){ var d=p.ts?new Date(p.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'}):''; return '<div class="ve-rail-item'+(p.id===cur?' active':'')+'" data-id="'+p.id+'"><div class="rt">'+esc(postTitleOf(p))+'</div><div class="rs">'+esc(postSnippet(p))+'</div><div class="rd">📄 '+d+'</div><button class="rdel" data-del="'+p.id+'" title="Удалить">✕</button></div>'; }).join('');
  vqa('.ve-rail-item',list).forEach(function(it){ it.onclick=function(e){ if(e.target.closest&&e.target.closest('.rdel'))return; var id=it.getAttribute('data-id'); var p=getPosts().filter(function(x){return x.id===id;})[0]; if(p)openPostForEdit(p); }; });
  vqa('.rdel',list).forEach(function(btn){ btn.onclick=function(e){ e.stopPropagation(); var id=btn.getAttribute('data-del'); var arr=getPosts().filter(function(x){return x.id!==id;}); setPosts(arr); if(window.__veEditId===id)window.__veEditId=null; _railSig=''; refreshRail(); toast('Пост удалён'); }; });
}
function buildRail(){ var ed=vq('#vEditor'); if(!ed)return; if(!vq('.ve-rail',ed)){ var rail=D.createElement('aside'); rail.className='ve-rail'; rail.innerHTML='<div class="ve-rail-h"><span class="dot"></span>Мои посты</div><button class="ve-newpost" type="button">➕ Новый пост</button><div class="ve-rail-list"></div>'; ed.insertBefore(rail,ed.firstChild); ed.classList.add('has-rail'); rail.querySelector('.ve-newpost').onclick=newPost; } refreshRail(); }
window.__VR10_buildRail=buildRail;
window.__VR10_newPost=newPost;
window.vioraNewPost=newPost;
function strip(h){ try{ if(window.strip)return window.strip(h);}catch(e){} return h; }
window.veSavePost=function(){
  var t=((vq('#veTitle')||{}).innerText||'').trim();
  var a=((vq('#veAuthor')||{}).innerText||'').trim();
  var bodyEl=vq('#veBody'); var bodyHTML=bodyEl?bodyEl.innerHTML:''; var bodyText=bodyEl?(bodyEl.innerText||'').trim():'';
  if(!t&&!bodyText){ toast('Пост пустой'); return; }
  var text=(t?'**'+t+'**\n\n':'')+bodyText;
  var posts=getPosts(); var id=window.__veEditId, existing=id?posts.filter(function(x){return x.id===id;})[0]:null;
  if(existing){ existing.text=text; existing.title=t; existing.author=a; existing.html=bodyHTML; existing.ts=existing.ts||Date.now(); setPosts(posts); toast('Пост обновлён'); }
  else { var np={id:uid(),text:text,title:t,author:a,html:bodyHTML,ts:Date.now(),an:null}; posts.unshift(np); setPosts(posts); window.__veEditId=np.id; toast('Сохранено в посты'); }
  _railSig=''; refreshRail();
};
try{ var _vwo=window.vWriteOpen; window.vWriteOpen=function(seed){ if(typeof _vwo==='function'){try{_vwo(seed);}catch(e){}} setTimeout(buildRail,40); }; }catch(e){}
})();
(function(){
var A=window.__VR10API,vq=A.vq,toast=A.toast,getPosts=A.getPosts,ptext=A.ptext,D=A.D;
function b64urlFromBytes(bytes){ var s=''; for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function bytesFromB64url(str){ str=String(str||'').replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4)str+='='; var bin=atob(str); var a=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i); return a; }
function postTitleOf(p){ if(p&&p.title)return p.title; var t=ptext(p); var m=t.match(/^\s*\*\*(.+?)\*\*/); if(m)return m[1].trim(); return (t.split('\n')[0]||'').slice(0,60); }
function textToHtml(t){ t=String(t||'').replace(/^\s*\*\*(.+?)\*\*\s*\n*/,''); var paras=t.split(/\n{2,}/); return paras.map(function(p){ p=A.esc(p).replace(/\n/g,'<br>'); return '<p>'+(p||'<br>')+'</p>'; }).join('')||'<p><br></p>'; }
function payload(p){ return {t:p.title||postTitleOf(p),a:p.author||'',b:(p.html||textToHtml(ptext(p)))}; }
function baseUrl(){ return location.origin+location.pathname; }
function makeShareLink(p){ return new Promise(function(resolve){ var json=JSON.stringify(payload(p)); var bytes=new TextEncoder().encode(json); if(window.CompressionStream){ try{ var cs=new CompressionStream('deflate-raw'); var w=cs.writable.getWriter(); w.write(bytes); w.close(); new Response(cs.readable).arrayBuffer().then(function(ab){ resolve(baseUrl()+'#vpz='+b64urlFromBytes(new Uint8Array(ab))); }).catch(function(){ resolve(baseUrl()+'#vp='+b64urlFromBytes(bytes)); }); return; }catch(e){} } resolve(baseUrl()+'#vp='+b64urlFromBytes(bytes)); }); }
function showPubObj(o){ var pub=vq('#vPub'); if(!pub){ if(typeof window.showPub==='function'){try{window.showPub(o);}catch(e){}} return; } var T=vq('#vpubTitle'),a=vq('#vpubAuthor'),b=vq('#vpubBody'); if(T)T.textContent=o.t||o.title||''; if(a)a.textContent=o.a||o.author||''; if(b)b.innerHTML=o.b||o.body||''; pub.classList.add('open'); D.body.style.overflow='hidden'; }
function decodeShare(){ var h=location.hash||''; var m; if(m=h.match(/[#&]vpz=([^&]+)/)){ if(window.DecompressionStream){ try{ var ds=new DecompressionStream('deflate-raw'); var w=ds.writable.getWriter(); w.write(bytesFromB64url(m[1])); w.close(); new Response(ds.readable).arrayBuffer().then(function(ab){ try{ showPubObj(JSON.parse(new TextDecoder().decode(ab))); }catch(e){} }).catch(function(){}); return true; }catch(e){} } return false; } if(m=h.match(/[#&]vp=([^&]+)/)){ try{ showPubObj(JSON.parse(new TextDecoder().decode(bytesFromB64url(m[1])))); return true; }catch(e){} } return false; }
function copyText(s){ try{ if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(s); return; } }catch(e){} try{ var ta=D.createElement('textarea'); ta.value=s; D.body.appendChild(ta); ta.select(); D.execCommand('copy'); ta.remove(); }catch(e){} }
function currentEditingPost(){ var id=window.__veEditId; var p=id?getPosts().filter(function(x){return x.id===id;})[0]:null; if(p)return p; return {title:((vq('#veTitle')||{}).innerText||'').trim(),author:((vq('#veAuthor')||{}).innerText||'').trim(),html:(vq('#veBody')||{}).innerHTML||''}; }
window.veCopyLink=function(){ makeShareLink(currentEditingPost()).then(function(url){ copyText(url); toast('Короткая ссылка скопирована'); }); };
window.vPubCopy=function(){ var o={title:((vq('#vpubTitle')||{}).textContent||''),author:((vq('#vpubAuthor')||{}).textContent||''),html:(vq('#vpubBody')||{}).innerHTML||''}; makeShareLink(o).then(function(url){ copyText(url); toast('Ссылка скопирована'); }); };
try{ var _rh=window.routeHash; window.routeHash=function(){ if(decodeShare())return; if(typeof _rh==='function'){try{return _rh.apply(this,arguments);}catch(e){}} }; }catch(e){}
window.addEventListener('hashchange',function(){ try{ window.routeHash(); }catch(e){} });
function boot(){ try{ window.__VR10_brandChat&&window.__VR10_brandChat(); }catch(e){} try{ if(vq('#vEditor'))window.__VR10_buildRail&&window.__VR10_buildRail(); }catch(e){} try{ if(vq('#dashboard #report'))window.__VR10_syncCards&&window.__VR10_syncCards(); }catch(e){} }
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot); else boot();
setTimeout(boot,600); setTimeout(boot,1800);
setTimeout(function(){ try{ window.routeHash&&window.routeHash(); }catch(e){} },500);
setInterval(function(){ try{ window.__VR10_brandChat&&window.__VR10_brandChat(); }catch(e){} try{ if(vq('#vEditor'))window.__VR10_buildRail&&window.__VR10_buildRail(); }catch(e){} try{ if(vq('#dashboard #report'))window.__VR10_syncCards&&window.__VR10_syncCards(); }catch(e){} },1700);
})();

})();
