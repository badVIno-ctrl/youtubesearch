(function(){
if(window.__VR9C)return; window.__VR9C=true;
var H=window.__VR9H||{}; var $=H.$||function(s){return document.querySelector(s);}; var esc=H.esc; var strip=H.strip; var toast=H.toast; var copy=H.copy; var b64e=H.b64e; var b64d=H.b64d; var uid=H.uid; var addMsg=window.__veAddMsg||function(){};
function ai(sys,user,max){ try{ if(window.__VP&&window.__VP.aiText){return Promise.resolve(window.__VP.aiText(sys,user,max||700));} }catch(e){} return Promise.resolve(''); }
function ctx(){ var t=($('#veTitle')||{}).innerText||''; var b=($('#veBody')||{}).innerText||''; return ('Заголовок: '+t+'\n\nТекст:\n'+b).slice(0,4000); }
var ideas=[];
window.veInsertIdea=function(i){ var v=ideas[i]; if(v==null)return; var t=$('#veTitle'); if(t&&!t.innerText.trim()){t.innerText=v;} else { var body=$('#veBody'); body.focus(); try{document.execCommand('insertHTML',false,'<p>'+esc(v)+'</p>');}catch(e){body.innerHTML+='<p>'+esc(v)+'</p>';} } (window.__VR9D||{}).save&&window.__VR9D.save(); toast('Добавлено'); };
window.veIdeas=function(force){ window.veAiToggle(true); var ph=addMsg('bot','<span class="ve-spin"></span> <span class="ve-muted">Подбираю идеи…</span>');
  ai('Ты Viora, контент-стратег. Дай ровно 3 коротких цепляющих варианта заголовка/хука для поста. Каждый с новой строки, без нумерации и кавычек.', 'Пост:\n'+ctx(), 500)
  .then(function(r){ var lines=String(r||'').split(/\n+/).map(function(s){return s.replace(/^[\d\.)\-\u2022\s"]+/,'').replace(/"$/,'').trim();}).filter(function(s){return s.length>3;}).slice(0,3); if(!lines.length){ if(ph)ph.innerHTML='Не получилось придумать идеи. Попробуй ещё раз.'; return;} ideas=lines; var html='Вот 3 варианта — нажми, чтобы вставить:'; lines.forEach(function(l,i){ html+='<span class="ve-chip" onclick="veInsertIdea('+i+')">'+esc(l)+'</span>'; }); if(ph)ph.innerHTML=html; var box=$('#veAiMsgs'); if(box)box.scrollTop=box.scrollHeight; }).catch(function(){ if(ph)ph.innerHTML='Не получилось. Попробуй ещё раз.'; }); };
window.veCheck=function(force){ window.veAiToggle(true); var b=($('#veBody')||{}).innerText||''; if(!b.trim()){ addMsg('bot','Напиши сначала текст — и я проверю его на ошибки и слабые места.'); return; } var ph=addMsg('bot','<span class="ve-spin"></span> <span class="ve-muted">Проверяю текст…</span>');
  ai('Ты Viora, редактор-корректор. Проверь текст на орфографию, логику и стиль. Дай 3-5 коротких пунктов с конкретными правками, каждый с новой строки.', 'Текст:\n'+b.slice(0,4000), 700)
  .then(function(r){ if(ph)ph.innerHTML=esc(String(r||'Готово.')); var box=$('#veAiMsgs'); if(box)box.scrollTop=box.scrollHeight; }).catch(function(){ if(ph)ph.innerHTML='Не получилось проверить.'; }); };
/* ---- save to TG posts ---- */
window.veSavePost=function(){ var t=($('#veTitle')||{}).innerText.trim(); var b=($('#veBody')||{}).innerText.trim(); if(!t&&!b){ toast('Пустой пост'); return; } var text=(t?('**'+t+'**\n\n'):'')+b; try{ if(window.__VP&&window.__VP.aiText&&window.pAddOne){ window.pAddOne(text); } else if(window.pAddOne){ window.pAddOne(text); } else if(window.postAdd){ window.postAdd(text); } toast('Сохранено в посты'); }catch(e){ toast('Сохранено'); } };
window.veCopyLink=function(){ var t=($('#veTitle')||{}).innerText||''; var a=($('#veAuthor')||{}).innerText||''; var b=strip(($('#veBody')||{}).innerHTML||''); var data=b64e(JSON.stringify({t:t,a:a,b:b,ts:Date.now()})); var url=location.origin+location.pathname+'#viorapost='+data; copy(url); toast('Ссылка на пост скопирована'); };
/* ---- public read view ---- */
window.showPub=function(p){ if(!p)return; $('#vpubTitle').innerText=p.t||''; $('#vpubAuthor').innerText=p.a||''; $('#vpubBody').innerHTML=strip(p.b||''); var v=$('#vPub'); v.classList.add('open'); document.body.style.overflow='hidden'; window.__vpubCur=p; };
window.vPubCopy=function(){ var p=window.__vpubCur; if(!p)return; var url=location.origin+location.pathname+'#viorapost='+b64e(JSON.stringify(p)); copy(url); toast('Ссылка скопирована'); };
window.vPubClose=function(){ var v=$('#vPub'); if(v)v.classList.remove('open'); document.body.style.overflow=''; if(location.hash.indexOf('viorapost')>=0){ history.replaceState(null,'',location.pathname); } };
window.vPubWrite=function(){ var p=window.__vpubCur||{}; vPubClose(); $('#veTitle').innerText=p.t||''; $('#veAuthor').innerText=p.a||''; $('#veBody').innerHTML=strip(p.b||'')||'<p><br></p>'; window.vWriteOpen(); };
window.routeHash=function(){ try{ var m=(location.hash||'').match(/viorapost=([^&]+)/); if(m){ var p=JSON.parse(b64d(decodeURIComponent(m[1]))||'null'); if(p)showPub(p); } }catch(e){} };
})();
