(function(){
if(window.__VR9B)return; window.__VR9B=true;
var H=window.__VR9H||{}; var $=H.$||function(s){return document.querySelector(s);}; var esc=H.esc; var strip=H.strip; var toast=H.toast; var copy=H.copy; var dsave=(window.__VR9D||{}).save||function(){};
function ai(sys,user,max){ try{ if(window.__VP&&window.__VP.aiText){ return Promise.resolve(window.__VP.aiText(sys,user,max||700)); } }catch(e){} return Promise.resolve('Сейчас не получается связаться с Viora. Попробуй чуть позже.'); }
function ctx(){ var t=($('#veTitle')||{}).innerText||''; var b=($('#veBody')||{}).innerText||''; return ('Заголовок: '+t+'\n\nТекст:\n'+b).slice(0,4000); }
/* ---- open / close editor ---- */
window.vWriteOpen=function(seed){ var ed=$('#vEditor'); if(!ed)return; ed.classList.add('open'); document.body.style.overflow='hidden';
  try{document.execCommand('defaultParagraphSeparator',false,'p');}catch(e){}
  var d=(window.__VR9D||{}).load?window.__VR9D.load():null;
  if(typeof seed==='string'&&seed.trim()){ $('#veTitle').innerText=''; $('#veBody').innerHTML='<p>'+esc(seed.trim())+'</p>'; }
  else if(d){ $('#veTitle').innerText=d.t||''; $('#veAuthor').innerText=d.a||''; $('#veBody').innerHTML=strip(d.b||'')||'<p><br></p>'; }
  if(!$('#veBody').innerHTML.trim()){ $('#veBody').innerHTML='<p><br></p>'; }
  if(!$('#veAiMsgs').childNodes.length){ addMsg('bot','Привет! Я Viora — помогу с постом. Подкину идеи, проверю на ошибки или отвечу на вопрос. Просто напиши ниже.'); }
  setTimeout(function(){ var t=$('#veTitle'); if(t&&!t.innerText.trim())t.focus(); else $('#veBody').focus(); },80);
};
window.vWriteClose=function(){ var ed=$('#vEditor'); if(!ed)return; dsave(); ed.classList.remove('open'); document.body.style.overflow=''; veAiToggle(false); veLinkClose(); };
/* ---- custom link popover ---- */
var savedRange=null;
window.veLinkOpen=function(){ var s=window.getSelection(); if(s&&s.rangeCount){ savedRange=s.getRangeAt(0).cloneRange(); } var pop=$('#veLinkPop'); var inp=$('#veLinkInput'); if(!pop)return; inp.value=''; pop.classList.add('show');
  var x=window.innerWidth/2-150, y=120; try{ if(savedRange){ var r=savedRange.getBoundingClientRect(); if(r&&(r.top||r.left)){ x=Math.min(Math.max(12,r.left), window.innerWidth-330); y=Math.min(r.bottom+8, window.innerHeight-70); } } }catch(e){}
  pop.style.left=x+'px'; pop.style.top=y+'px'; setTimeout(function(){inp.focus();},30); };
window.veLinkClose=function(){ var pop=$('#veLinkPop'); if(pop)pop.classList.remove('show'); };
window.veLinkApply=function(){ var inp=$('#veLinkInput'); var url=(inp.value||'').trim(); if(!url){veLinkClose();return;} if(!/^https?:\/\//i.test(url)&&!/^mailto:/i.test(url)){url='https://'+url;} var body=$('#veBody'); body.focus(); try{ if(savedRange){ var s=window.getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }catch(e){} try{ if(window.getSelection().isCollapsed){ document.execCommand('insertHTML',false,'<a href="'+url.replace(/"/g,'%22')+'">'+esc(url)+'</a>'); } else { document.execCommand('createLink',false,url); } }catch(e){} veLinkClose(); dsave(); };
/* ---- assistant chat ---- */
window.veAiToggle=function(on){ var p=$('#veAI'),f=$('#veAiFab'); if(!p)return; if(on){p.classList.add('show'); if(f)f.style.display='none'; setTimeout(function(){var i=$('#veAiInput'); if(i)i.focus();},120);} else {p.classList.remove('show'); if(f)f.style.display='';} };
function addMsg(role,html){ var box=$('#veAiMsgs'); if(!box)return null; var d=document.createElement('div'); d.className='ve-msg '+(role==='me'?'me':'bot'); d.innerHTML=html; box.appendChild(d); box.scrollTop=box.scrollHeight; return d; }
window.__veAddMsg=addMsg;
window.veSend=function(){ var inp=$('#veAiInput'); var btn=$('#veSendBtn'); if(!inp)return; var txt=(inp.value||'').trim(); if(!txt)return; inp.value=''; inp.style.height='auto'; addMsg('me',esc(txt)); var ph=addMsg('bot','<span class="ve-spin"></span> <span class="ve-muted">Viora думает…</span>'); if(btn)btn.disabled=true;
  ai('Ты Viora — дружелюбный редактор и контент-помощник. Отвечай кратко, по делу, по-русски, без воды и клише.', 'Контекст текущего поста:\n'+ctx()+'\n\nВопрос автора: '+txt, 700)
   .then(function(r){ if(ph)ph.innerHTML=esc(r); var box=$('#veAiMsgs'); if(box)box.scrollTop=box.scrollHeight; }).catch(function(){ if(ph)ph.innerHTML='Не получилось ответить, попробуй ещё раз.'; }).then(function(){ if(btn)btn.disabled=false; }); };
window.veAsk=function(preset){ veAiToggle(true); var inp=$('#veAiInput'); if(inp){inp.value=preset;} veSend(); };
})();
