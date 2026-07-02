/* ============================================================ */
/* V3 PACK — Pack 3: editor, posts, chat, profile, search, AI   */
/* ============================================================ */
(function(){
'use strict';
if(window.__V3)return; window.__V3=true;
var D=document;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function escH(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function v3Toast(m,k,ms){try{if(typeof window.vToast==='function'){window.vToast(m,k||'ok',ms||2400);return;}}catch(e){}try{if(typeof window.toast==='function'){window.toast(m);return;}}catch(e){}}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function fmtN(n){try{return (+n).toLocaleString('ru-RU');}catch(e){return String(n);}}
function dsv(){try{if(window.__VR9D&&window.__VR9D.save)window.__VR9D.save();}catch(e){}}

/* ============================================================ */
/* 1. EDITOR                                                     */
/* ============================================================ */

/* ---- extended commands (strike, mono, h3) ---- */
window.veCmd=function(ev,cmd){ if(ev){ev.preventDefault();} var body=q('#veBody'); if(body){body.focus();}
  try{
    if(cmd==='undo'){D.execCommand('undo');return false;}
    if(cmd==='redo'){D.execCommand('redo');return false;}
    if(cmd==='bold'){D.execCommand('bold');}
    else if(cmd==='italic'){D.execCommand('italic');}
    else if(cmd==='strike'){D.execCommand('strikeThrough');}
    else if(cmd==='ul'){D.execCommand('insertUnorderedList');}
    else if(cmd==='h2'){ var blk=curBlk(); D.execCommand('formatBlock',false,(blk==='h2'?'p':'h2')); }
    else if(cmd==='h3'){ var b3=curBlk(); D.execCommand('formatBlock',false,(b3==='h3'?'p':'h3')); }
    else if(cmd==='quote'){ var b2=curBlk(); D.execCommand('formatBlock',false,(b2==='blockquote'?'p':'blockquote')); }
    else if(cmd==='mono'){ v3Mono(); }
    else if(cmd==='link'){ if(window.veLinkOpen)window.veLinkOpen(); }
  }catch(e){}
  dsv(); v3Count(); return false;
};
function curBlk(){ try{var s=window.getSelection();if(!s||!s.rangeCount)return '';var n=s.getRangeAt(0).startContainer;n=n.nodeType===3?n.parentNode:n;while(n&&n!==D.body){var tg=(n.tagName||'').toLowerCase();if(tg==='h2'||tg==='h3'||tg==='blockquote'||tg==='p'||tg==='li')return tg;n=n.parentNode;}return '';}catch(e){return '';} }
function selIn(sel,tag){ try{var s=window.getSelection();if(!s.rangeCount)return null;var n=s.getRangeAt(0).startContainer;n=n.nodeType===3?n.parentNode:n;while(n&&n.id!=='veBody'&&n!==D.body){if((n.tagName||'').toLowerCase()===tag)return n;n=n.parentNode;}return null;}catch(e){return null;} }
function v3Mono(){
  var code=selIn(null,'code');
  if(code){ var t=D.createTextNode(code.textContent); code.parentNode.replaceChild(t,code); return; }
  var s=window.getSelection(); if(!s.rangeCount||s.isCollapsed)return;
  var txt=s.toString(); if(!txt)return;
  D.execCommand('insertHTML',false,'<code>'+escH(txt)+'</code>');
}

/* ---- floating bubble toolbar ---- */
function buildBubble(){
  if(q('#v3Bubble'))return;
  var ed=q('#vEditor'); if(!ed)return;
  var b=D.createElement('div'); b.id='v3Bubble';
  b.innerHTML=
    '<button title="Жирный (Ctrl+B)" data-c="bold"><b>B</b></button>'+
    '<button title="Курсив (Ctrl+I)" data-c="italic"><i>I</i></button>'+
    '<button title="Зачёркнутый" data-c="strike"><s>S</s></button>'+
    '<button title="Моноширинный" data-c="mono">&lt;/&gt;</button>'+
    '<span class="v3sep"></span>'+
    '<button title="Заголовок" data-c="h2">H2</button>'+
    '<button title="Подзаголовок" data-c="h3">H3</button>'+
    '<button title="Цитата" data-c="quote">&rdquo;</button>'+
    '<button title="Список" data-c="ul">&bull;</button>'+
    '<span class="v3sep"></span>'+
    '<button title="Ссылка (Ctrl+K)" data-c="link">🔗</button>';
  qa('button',b).forEach(function(btn){ btn.addEventListener('mousedown',function(ev){ ev.preventDefault(); window.veCmd(ev,btn.getAttribute('data-c')); hideBubble(); }); });
  ed.appendChild(b);
}
function hideBubble(){ var b=q('#v3Bubble'); if(b)b.classList.remove('show'); }
function onSel(){
  var ed=q('#vEditor'); if(!ed||!ed.classList.contains('open')){hideBubble();return;}
  var b=q('#v3Bubble'); if(!b)return;
  try{
    var s=window.getSelection();
    if(!s.rangeCount||s.isCollapsed){hideBubble();return;}
    var n=s.anchorNode; n=n&&n.nodeType===3?n.parentNode:n;
    var inBody=false; while(n&&n!==D.body){ if(n.id==='veBody'){inBody=true;break;} n=n.parentNode; }
    if(!inBody){hideBubble();return;}
    var r=s.getRangeAt(0).getBoundingClientRect();
    if(!r||(!r.width&&!r.height)){hideBubble();return;}
    b.classList.add('show');
    var bw=b.offsetWidth||320;
    var x=Math.max(8,Math.min(r.left+r.width/2-bw/2,window.innerWidth-bw-8));
    var y=r.top-46; if(y<54){y=r.bottom+10;}
    b.style.left=x+'px'; b.style.top=y+'px';
  }catch(e){hideBubble();}
}
var selT=null;
D.addEventListener('selectionchange',function(){ if(selT)clearTimeout(selT); selT=setTimeout(onSel,140); });

/* ---- hotkeys + markdown autoreplace ---- */
function wireBody(){
  var body=q('#veBody'); if(!body||body.__v3)return; body.__v3=true;
  body.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&(e.key==='k'||e.key==='K'||e.code==='KeyK')){ e.preventDefault(); window.veCmd(null,'link'); return; }
    if(e.key!==' ')return;
    try{
      var s=window.getSelection(); if(!s.rangeCount||!s.isCollapsed)return;
      var r=s.getRangeAt(0); var node=r.startContainer; if(node.nodeType!==3)return;
      var before=node.textContent.slice(0,r.startOffset);
      if(!/^(#{1,2}|>|[-*])$/.test(before))return;
      if(node.previousSibling)return;
      var p=node.parentNode; var tag=(p.tagName||'').toLowerCase();
      if(['p','div','h2','h3','blockquote'].indexOf(tag)<0&&p.id!=='veBody')return;
      e.preventDefault();
      node.textContent=node.textContent.slice(before.length);
      var nr=D.createRange(); nr.setStart(node,0); nr.collapse(true); s.removeAllRanges(); s.addRange(nr);
      if(before==='-'||before==='*'){D.execCommand('insertUnorderedList');}
      else if(before==='#'){D.execCommand('formatBlock',false,'h2');}
      else if(before==='##'){D.execCommand('formatBlock',false,'h3');}
      else if(before==='>'){D.execCommand('formatBlock',false,'blockquote');}
      dsv();
    }catch(err){}
  });
  /* clean paste */
  body.addEventListener('paste',function(e){
    try{
      var cd=e.clipboardData; if(!cd)return;
      var html=cd.getData('text/html'); var txt=cd.getData('text/plain');
      e.preventDefault();
      var out;
      if(html){ out=v3CleanHtml(html); }
      else{ out=String(txt||'').split(/\n{2,}/).map(function(p){return '<p>'+escH(p).replace(/\n/g,'<br>')+'</p>';}).join(''); }
      if(out)D.execCommand('insertHTML',false,out);
      dsv(); v3Count();
    }catch(err){}
  });
  ['input','keyup'].forEach(function(ev){ body.addEventListener(ev,function(){ v3Count(); }); });
  var t=q('#veTitle'); if(t)t.addEventListener('input',function(){ v3Count(); });
}
var V3PASTE_MAP={strong:'b',b:'b',em:'i',i:'i',s:'s',strike:'s',del:'s',code:'code',pre:'pre',u:'u',h1:'h2',h2:'h2',h3:'h3',h4:'h3',blockquote:'blockquote',ul:'ul',ol:'ol',li:'li',p:'p'};
function v3CleanHtml(html){
  try{
    var doc=new DOMParser().parseFromString(html,'text/html');
    function walk(n){
      if(n.nodeType===3)return escH(n.nodeValue);
      if(n.nodeType!==1)return '';
      var tag=n.tagName.toLowerCase();
      if(tag==='script'||tag==='style'||tag==='iframe'||tag==='img')return '';
      var inner=Array.prototype.map.call(n.childNodes,walk).join('');
      if(tag==='br')return '<br>';
      if(tag==='a'){ var href=n.getAttribute('href')||''; if(/^https?:/i.test(href))return '<a href="'+href.replace(/"/g,'%22')+'">'+inner+'</a>'; return inner; }
      if(V3PASTE_MAP[tag])return '<'+V3PASTE_MAP[tag]+'>'+inner+'</'+V3PASTE_MAP[tag]+'>';
      if(tag==='div'||tag==='section'||tag==='article'||tag==='tr')return (inner?'<p>'+inner+'</p>':'');
      return inner;
    }
    return Array.prototype.map.call(doc.body.childNodes,walk).join('').replace(/(<p>\s*<\/p>)+/g,'');
  }catch(e){return escH(html.replace(/<[^>]*>/g,''));}
}

/* ---- char counter (Telegram limits) ---- */
function buildCounter(){
  if(q('#v3Count'))return;
  var ed=q('#vEditor'); if(!ed)return;
  var c=D.createElement('div'); c.id='v3Count'; c.title='Лимиты Telegram: 4096 символов — текстовый пост, 1024 — подпись к фото/видео';
  ed.appendChild(c);
}
function v3Count(){
  var el=q('#v3Count'); if(!el)return;
  var t=(q('#veTitle')||{}).innerText||''; var b=(q('#veBody')||{}).innerText||'';
  t=t.trim(); b=b.replace(/\n+$/,'');
  var n=(t?t.length+2:0)+b.length;
  el.textContent=fmtN(n)+' / 4096';
  el.classList.toggle('warn',n>1024&&n<=4096);
  el.classList.toggle('over',n>4096);
}

/* ---- copy formatted for Telegram ---- */
function tgConvert(){
  var t=((q('#veTitle')||{}).innerText||'').trim();
  var src=D.createElement('div'); src.innerHTML=(q('#veBody')||{}).innerHTML||'';
  var html=[],plain=[];
  if(t){ html.push('<b>'+escH(t)+'</b><br><br>'); plain.push(t+'\n'); }
  function blockSep(){ if(html.length&&!/(<br>\s*)$/.test(html[html.length-1]))html.push('<br>'); }
  function walk(n,ctx){
    if(n.nodeType===3){ html.push(escH(n.nodeValue)); plain.push(n.nodeValue); return; }
    if(n.nodeType!==1)return;
    var tag=n.tagName.toLowerCase();
    var kids=function(c){ Array.prototype.forEach.call(n.childNodes,function(k){walk(k,c||ctx);}); };
    if(tag==='br'){ html.push('<br>'); plain.push('\n'); return; }
    if(tag==='b'||tag==='strong'){ html.push('<b>'); kids(); html.push('</b>'); return; }
    if(tag==='i'||tag==='em'){ html.push('<i>'); kids(); html.push('</i>'); return; }
    if(tag==='s'||tag==='strike'||tag==='del'){ html.push('<s>'); kids(); html.push('</s>'); return; }
    if(tag==='u'){ html.push('<u>'); kids(); html.push('</u>'); return; }
    if(tag==='code'){ html.push('<code>'); kids(); html.push('</code>'); return; }
    if(tag==='pre'){ html.push('<pre>'); kids(); html.push('</pre>'); plain.push('\n'); return; }
    if(tag==='a'){ var href=n.getAttribute('href')||''; html.push('<a href="'+href.replace(/"/g,'%22')+'">'); kids(); html.push('</a>'); return; }
    if(tag==='h2'||tag==='h3'){ html.push('<b>'); kids(); html.push('</b><br><br>'); plain.push('\n\n'); return; }
    if(tag==='blockquote'){ html.push('<i>'); plain.push('«'); kids(); plain.push('»'); html.push('</i><br><br>'); plain.push('\n\n'); return; }
    if(tag==='li'){ html.push('• '); plain.push('• '); kids(); html.push('<br>'); plain.push('\n'); return; }
    if(tag==='ul'||tag==='ol'){ kids(); html.push('<br>'); plain.push('\n'); return; }
    if(tag==='p'||tag==='div'){ kids(); html.push('<br><br>'); plain.push('\n\n'); return; }
    kids();
  }
  Array.prototype.forEach.call(src.childNodes,function(n){walk(n);});
  var h=html.join('').replace(/(<br>){3,}/g,'<br><br>').replace(/(<br>)+$/,'');
  var p=plain.join('').replace(/\n{3,}/g,'\n\n').replace(/\n+$/,'');
  return {html:h,plain:p};
}
window.v3CopyTg=function(){
  var c=tgConvert();
  if(!c.plain.trim()){ v3Toast('Пост пустой','warn'); return; }
  function fallback(){
    try{
      var d=D.createElement('div'); d.contentEditable='true'; d.style.cssText='position:fixed;left:-9999px;top:0;opacity:0'; d.innerHTML=c.html;
      D.body.appendChild(d);
      var r=D.createRange(); r.selectNodeContents(d); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
      D.execCommand('copy'); s.removeAllRanges(); d.remove();
      v3Toast('Скопировано с форматированием — вставь в Telegram 📨');
    }catch(e){ v3Toast('Не удалось скопировать','warn'); }
  }
  try{
    if(navigator.clipboard&&window.ClipboardItem){
      var item=new ClipboardItem({'text/html':new Blob([c.html],{type:'text/html'}),'text/plain':new Blob([c.plain],{type:'text/plain'})});
      navigator.clipboard.write([item]).then(function(){ v3Toast('Скопировано с форматированием — вставь в Telegram 📨'); },fallback);
    } else fallback();
  }catch(e){ fallback(); }
};

/* ============================================================ */
/* 2. POSTS — import, preview, search/sort, summary             */
/* ============================================================ */
var V3PREV=[];
function vp(){ return window.__VP||null; }
function pSplit(t){ t=String(t||'').replace(/\r/g,''); var parts; if(/^\s*-{3,}\s*$/m.test(t)){parts=t.split(/^\s*-{3,}\s*$/m);}else{parts=t.split(/\n{2,}/);} return parts.map(function(s){return s.trim();}).filter(function(s){return s.length>0;}); }

/* fix: реальный экспорт добавления поста (кнопка «Сохранить в посты» в редакторе раньше ничего не сохраняла) */
window.pAddOne=function(text){
  var V=vp(); if(!V)return null;
  text=String(text||'').trim(); if(!text)return null;
  var an=null; try{ if(typeof window.tgAnalyzeLocal==='function')an=window.tgAnalyzeLocal(text); }catch(e){}
  var p={id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),text:text,ts:Date.now(),an:an};
  var a=V.pget(); a.unshift(p); V.pset(a);
  try{ V.pdRender(); }catch(e){}
  v3PostsApply();
  return p;
};
function addMany(items){
  var V=vp(); if(!V)return 0;
  var a=V.pget(); var n=0;
  items.forEach(function(it){
    var text=String(it.text||'').trim(); if(!text)return;
    var an=null; try{ if(typeof window.tgAnalyzeLocal==='function')an=window.tgAnalyzeLocal(text); }catch(e){}
    a.unshift({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)+n,text:text,ts:it.ts||Date.now(),an:an}); n++;
  });
  V.pset(a);
  try{ V.pdRender(); }catch(e){}
  v3PostsApply();
  return n;
}

/* ---- preview before add ---- */
function showPreview(items,src){
  V3PREV=items.slice(0,60);
  var box=q('#v3Prev'); if(!box)return;
  renderPreview(src);
  box.style.display='block';
  try{ box.scrollIntoView({behavior:'smooth',block:'nearest'}); }catch(e){}
}
function renderPreview(src){
  var box=q('#v3Prev'); if(!box)return;
  if(!V3PREV.length){ box.style.display='none'; box.innerHTML=''; return; }
  var rows=V3PREV.map(function(it,i){
    var sc=null; try{ if(typeof window.tgAnalyzeLocal==='function'){var an=window.tgAnalyzeLocal(it.text); sc=an&&an.overall!=null?Math.round(an.overall):null;} }catch(e){}
    var scH=sc==null?'':'<span class="v3pv-sc" style="color:'+(sc>=70?'#7ee0a2':sc>=45?'#ffcf7a':'#ff8fa3')+'">'+sc+'</span>';
    return '<div class="v3pv-item">'+
      '<div class="v3pv-n">'+(i+1)+'</div>'+
      '<div class="v3pv-t">'+escH(it.text.slice(0,150))+(it.text.length>150?'…':'')+'</div>'+scH+
      '<div class="v3pv-acts">'+(i>0?'<button title="Склеить с предыдущим" onclick="v3PrevMerge('+i+')">⤴</button>':'')+'<button title="Убрать" onclick="v3PrevDel('+i+')">✕</button></div>'+
    '</div>';
  }).join('');
  box.innerHTML='<div class="v3pv-h">Проверь разбивку — <b>'+V3PREV.length+'</b> '+plural(V3PREV.length,'пост','поста','постов')+(src==='json'?' из экспорта Telegram':'')+'. Если что-то разрезалось неправильно — склей кнопкой ⤴.</div>'+
    '<div class="v3pv-list">'+rows+'</div>'+
    '<div class="v3pv-foot"><button class="v3pv-add" onclick="v3PrevConfirm()">✅ Добавить '+V3PREV.length+' '+plural(V3PREV.length,'пост','поста','постов')+'</button><button class="v3pv-cancel" onclick="v3PrevCancel()">Отмена</button></div>';
}
function plural(n,a,b,c){ n=Math.abs(n)%100; var d=n%10; if(n>10&&n<20)return c; if(d>1&&d<5)return b; if(d===1)return a; return c; }
window.v3PrevMerge=function(i){ if(i<=0||i>=V3PREV.length)return; V3PREV[i-1].text=V3PREV[i-1].text+'\n\n'+V3PREV[i].text; V3PREV.splice(i,1); renderPreview(); };
window.v3PrevDel=function(i){ V3PREV.splice(i,1); renderPreview(); };
window.v3PrevCancel=function(){ V3PREV=[]; renderPreview(); };
window.v3PrevConfirm=function(){
  var n=addMany(V3PREV); V3PREV=[]; renderPreview();
  var ta=q('#vpBulk'); if(ta)ta.value=''; if(window.vpCount)window.vpCount();
  v3Toast('Добавлено постов: '+n+' 🎉');
};

/* override: bulk add now goes through preview */
window.vpBulkAdd=function(){
  var ta=q('#vpBulk'); if(!ta)return;
  var parts=pSplit(ta.value);
  if(!parts.length){ v3Toast('Вставь хотя бы один пост','warn'); return; }
  showPreview(parts.map(function(t){return {text:t};}),'text');
};

/* ---- Telegram Desktop export (result.json) ---- */
function parseTgExport(raw){
  var j; try{ j=JSON.parse(raw); }catch(e){ return null; }
  var msgs=(j&&j.messages)||[]; if(!Array.isArray(msgs))return null;
  var out=[];
  msgs.forEach(function(m){
    if(!m||m.type!=='message')return;
    var t=m.text!=null?m.text:m.text_entities;
    var text='';
    if(typeof t==='string')text=t;
    else if(Array.isArray(t))text=t.map(function(x){return typeof x==='string'?x:((x&&x.text)||'');}).join('');
    text=String(text||'').trim();
    if(text.length<15)return;
    var ts=Date.now();
    try{ if(m.date_unixtime)ts=(+m.date_unixtime)*1000; else if(m.date)ts=new Date(m.date).getTime()||ts; }catch(e){}
    out.push({text:text,ts:ts});
  });
  out.sort(function(a,b){return b.ts-a.ts;});
  return out.slice(0,60);
}
function handleTgFile(file){
  if(!file)return;
  if(!/json$/i.test(file.name||'')){ v3Toast('Нужен файл result.json из экспорта Telegram Desktop','warn'); return; }
  var rd=new FileReader();
  rd.onload=function(){
    var items=parseTgExport(rd.result);
    if(!items){ v3Toast('Не получилось прочитать файл — это точно result.json?','warn'); return; }
    if(!items.length){ v3Toast('В экспорте не нашлось текстовых постов','warn'); return; }
    showPreview(items,'json');
  };
  rd.readAsText(file);
}

/* ---- toolbar: search / sort / summary + import UI ---- */
function injectVpUI(){
  var dr=q('#vpDrawer'); if(!dr)return;
  /* import button + dropzone */
  var bulk=dr.querySelector('.vp-bulk');
  if(bulk&&!q('#v3TgImport',dr)){
    var row=D.createElement('div'); row.id='v3TgImport';
    row.innerHTML='<button type="button" class="v3-imp" onclick="document.getElementById(\'v3TgFile\').click()">📂 Импорт из Telegram (result.json)</button>'+
      '<input type="file" id="v3TgFile" accept=".json,application/json" style="display:none"/>'+
      '<div class="v3-imp-hint">Telegram Desktop → канал → ⋮ → «Экспорт истории чата» → формат JSON. Или перетащи файл прямо сюда.</div>';
    bulk.appendChild(row);
    q('#v3TgFile').addEventListener('change',function(){ handleTgFile(this.files&&this.files[0]); this.value=''; });
    bulk.addEventListener('dragover',function(e){ e.preventDefault(); bulk.classList.add('v3-drag'); });
    bulk.addEventListener('dragleave',function(){ bulk.classList.remove('v3-drag'); });
    bulk.addEventListener('drop',function(e){ e.preventDefault(); bulk.classList.remove('v3-drag'); try{ handleTgFile(e.dataTransfer.files&&e.dataTransfer.files[0]); }catch(err){} });
  }
  /* preview container */
  if(bulk&&!q('#v3Prev',dr)){ var pv=D.createElement('div'); pv.id='v3Prev'; pv.style.display='none'; bulk.parentNode.insertBefore(pv,bulk.nextSibling); }
  /* search/sort bar above list */
  var listH=dr.querySelector('.vp-list-h');
  if(listH&&!q('#v3PostBar',dr)){
    var bar=D.createElement('div'); bar.id='v3PostBar';
    bar.innerHTML='<input id="v3PostSearch" type="text" placeholder="🔎 Поиск по постам…"/>'+
      '<select id="v3PostSort"><option value="new">Сначала новые</option><option value="old">Сначала старые</option><option value="best">Лучшие по баллу</option><option value="worst">Слабые по баллу</option></select>'+
      '<div id="v3PostSum"></div>';
    listH.parentNode.insertBefore(bar,listH.nextSibling);
    q('#v3PostSearch').addEventListener('input',function(){ v3PostsApply(); });
    q('#v3PostSort').addEventListener('change',function(){ v3PostsApply(); });
  }
}
function v3Card(p){
  var V=vp(); var an=V.getAn(p); var sc=an&&an.overall!=null?Math.round(an.overall):null;
  var col=sc==null?'#5fb0e6':V.scoreColor(sc);
  var t=V.ptext(p); var snip=V.escH(t.slice(0,120))+(t.length>120?'…':'');
  var ring=sc==null?'<div class="vp-ring na"><span>—</span></div>':'<div class="vp-ring" style="background:conic-gradient('+col+' '+(sc*3.6)+'deg,rgba(255,255,255,.08) 0)"><span style="color:'+col+'">'+sc+'</span></div>';
  var dt=''; try{ dt=new Date(p.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'short'}); }catch(e){}
  return '<div class="vp-item" onclick="vpO(\''+p.id+'\')">'+ring+'<div class="vp-item-main"><div class="vp-item-txt">'+snip+'</div><div class="vp-item-meta">'+dt+'</div></div><div class="vp-item-acts"><button title="Совет в чате" onclick="event.stopPropagation();vpAsk(\''+p.id+'\')">💡</button><button title="Удалить" onclick="event.stopPropagation();vpDel(\''+p.id+'\')">🗑</button></div></div>';
}
var METRIC_RU={hook:'хук (первая строка)',structure:'структура',cta:'призыв (CTA)',read:'читабельность',emotion:'эмоции',format:'оформление'};
function v3PostsApply(){
  var V=vp(); if(!V)return;
  var list=q('#vpList'); if(!list)return;
  var all=V.pget();
  var query=((q('#v3PostSearch')||{}).value||'').trim().toLowerCase();
  var sort=((q('#v3PostSort')||{}).value)||'new';
  var rows=all.filter(function(p){ return !query||V.ptext(p).toLowerCase().indexOf(query)>=0; });
  function sc(p){ var an=V.getAn(p); return an&&an.overall!=null?an.overall:-1; }
  if(sort==='old')rows.sort(function(a,b){return (a.ts||0)-(b.ts||0);});
  else if(sort==='best')rows.sort(function(a,b){return sc(b)-sc(a);});
  else if(sort==='worst')rows.sort(function(a,b){return sc(a)-sc(b);});
  else rows.sort(function(a,b){return (b.ts||0)-(a.ts||0);});
  list.innerHTML=rows.length?rows.map(v3Card).join(''):(query?'<div class="vp-empty">Ничего не нашлось по «'+escH(query)+'»</div>':'<div class="vp-empty">Пока нет постов. Вставь их в поле выше — Viora разберёт каждый локально, без ИИ.</div>');
  /* summary */
  var sum=q('#v3PostSum'); if(!sum)return;
  var scored=all.map(function(p){return V.getAn(p);}).filter(function(a){return a&&a.s;});
  if(scored.length<2){ sum.innerHTML=''; return; }
  var avg=Math.round(scored.reduce(function(a,x){return a+(x.overall||0);},0)/scored.length);
  var keys=Object.keys(METRIC_RU); var worst=null,worstV=101;
  keys.forEach(function(k){ var v=scored.reduce(function(a,x){return a+(x.s[k]||0);},0)/scored.length; if(v<worstV){worstV=v;worst=k;} });
  sum.innerHTML='📊 Средний балл <b style="color:'+(avg>=70?'#7ee0a2':avg>=45?'#ffcf7a':'#ff8fa3')+'">'+avg+'/100</b> по '+scored.length+' '+plural(scored.length,'посту','постам','постам')+' · слабое место: <b>'+METRIC_RU[worst]+'</b> ('+Math.round(worstV)+')';
}
/* hooks */
(function(){
  var oOpen=window.vpOpen;
  window.vpOpen=function(){ var r=oOpen?oOpen.apply(this,arguments):null; try{ injectVpUI(); v3PostsApply(); }catch(e){} return r; };
  var oDel=window.vpDel;
  window.vpDel=function(){ var r=oDel?oDel.apply(this,arguments):null; try{ v3PostsApply(); }catch(e){} return r; };
  try{
    if(window.__VP&&window.__VP.pdRender&&!window.__VP.__v3){
      var oR=window.__VP.pdRender;
      window.__VP.pdRender=function(){ var r=oR.apply(this,arguments); try{ v3PostsApply(); }catch(e){} return r; };
      window.__VP.__v3=true;
    }
  }catch(e){}
})();
/* ============================================================ */
/* 3. YOUTUBE CHAT — history, streaming, rich render, actions   */
/* ============================================================ */
var CHAT_KEY='viora_chat_v2';
var V3CH={id:'_',busy:false};
function chAll(){ return lget(CHAT_KEY,{})||{}; }
function chLoad(id){ var a=chAll(); var e=a[id]; return (e&&Array.isArray(e.ms))?e.ms:[]; }
function chSave(){ try{ var a=chAll(); a[V3CH.id]={ms:CHAT_HISTORY.slice(-40),ts:Date.now()}; var ids=Object.keys(a); if(ids.length>8){ ids.sort(function(x,y){return (a[x].ts||0)-(a[y].ts||0);}); delete a[ids[0]]; } lset(CHAT_KEY,a); }catch(e){} }
function chClear(){ try{ var a=chAll(); delete a[V3CH.id]; lset(CHAT_KEY,a); }catch(e){} CHAT_HISTORY=[]; window.mountChat(); }
window.v3ChatClear=chClear;

/* rich markdown for chat */
function v3Md(s){
  s=escH(String(s==null?'':s));
  var lines=s.split('\n'); var out=[]; var inUl=false;
  function closeUl(){ if(inUl){out.push('</ul>');inUl=false;} }
  lines.forEach(function(l){
    var t=l.trim();
    if(/^#{1,4}\s+/.test(t)){ closeUl(); out.push('<div class="v3h">'+t.replace(/^#{1,4}\s+/,'')+'</div>'); return; }
    if(/^([-•*]|\d+[\.)])\s+/.test(t)){ if(!inUl){out.push('<ul class="v3ul">');inUl=true;} out.push('<li>'+t.replace(/^([-•*]|\d+[\.)])\s+/,'')+'</li>'); return; }
    closeUl();
    if(t==='')out.push('<div class="v3gap"></div>');
    else out.push('<div>'+l+'</div>');
  });
  closeUl();
  return out.join('').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/`([^`]+)`/g,'<code>$1</code>');
}

function v3ChatScroll(){ var b=q('#chatBody'); if(b)b.scrollTop=b.scrollHeight; }
function v3PushMsg(role,text,opts){
  opts=opts||{};
  var body=q('#chatBody'); if(!body)return null;
  var sg=body.querySelector('.chat-sugg'); if(sg&&role==='user')sg.remove();
  var d=D.createElement('div');
  d.className='msg '+role;
  d.innerHTML='<div class="v3-mdc">'+(opts.pending?'<span class="v3dots"><span></span><span></span><span></span></span>':v3Md(text))+'</div>';
  body.appendChild(d); v3ChatScroll();
  return d;
}
function v3Acts(d,answer,userQ){
  if(!d||d.querySelector('.v3-acts'))return;
  var row=D.createElement('div'); row.className='v3-acts';
  var hasLab=!!q('#labTopic');
  row.innerHTML='<button data-a="copy" title="Скопировать">📋</button>'+
    (hasLab?'<button data-a="shoot" title="Снять видео про это — открою лабораторию заголовков">🎬</button>':'')+
    '<button data-a="up" title="Полезно">👍</button>'+
    '<button data-a="down" title="Слабо — переделать жёстче">👎</button>';
  row.addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b)return;
    var a=b.getAttribute('data-a');
    if(a==='copy'){ try{ navigator.clipboard.writeText(answer); }catch(err){} v3Toast('Скопировано'); }
    else if(a==='shoot'){ try{ var first=answer.split('\n').map(function(x){return x.replace(/^[#*\-•\d\.\)\s]+/,'').trim();}).filter(Boolean)[0]||answer.slice(0,80); var lt=q('#labTopic'); if(lt){ lt.value=first.slice(0,120); var p=q('#chatPanel'); if(p)p.classList.remove('open'); lt.scrollIntoView({block:'center'}); if(typeof window.runTitleLab==='function')setTimeout(function(){window.runTitleLab();},250); } }catch(err){} }
    else if(a==='up'){ v3Fb(1,''); b.textContent='✅'; b.disabled=true; }
    else if(a==='down'){ v3Fb(-1,userQ||''); v3Regen(d,userQ); }
  });
  d.appendChild(row);
}

/* richer channel context */
(function(){
  var orig=window.buildChatContext;
  window.buildChatContext=function(){
    var base=''; try{ base=orig?orig():''; }catch(e){}
    var extra=[];
    try{ var tp=(STATE.topics||[]).slice(0,5).map(function(t){return t.name+' ('+Math.round(t.medVpd)+'/день, '+(t.verdict||'')+')';}); if(tp.length)extra.push('Рубрики: '+tp.join('; ')); }catch(e){}
    try{ var bw=STATE.signals&&STATE.signals.bestWindow; if(bw&&bw.day)extra.push('Окно хитов: '+bw.day+' '+(bw.hourRange||'')); }catch(e){}
    try{ var ss=STATE.signals&&STATE.signals.durationSweetSpot; if(ss&&ss.best)extra.push('Лучшая длина длинных роликов: '+ss.best); }catch(e){}
    try{ var cmp=(STATE.competitors||[]).slice(0,3).map(function(c){return c.title||c.name||'';}).filter(Boolean); if(cmp.length)extra.push('Конкуренты: '+cmp.join(', ')); }catch(e){}
    try{ if(typeof PROFILE!=='undefined'&&PROFILE){ var lv=PROFILE.level==='new'?'новичок (объясняй просто, без жаргона)':'опытный (пиши плотно)'; extra.push('Автор: '+lv+(PROFILE.goalLabel?(', цель — '+PROFILE.goalLabel):'')); } }catch(e){}
    try{ if(typeof loadShoots==='function'){ var sh=loadShoots()[0]; if(sh&&sh.d&&(sh.d.topic||sh.d.title))extra.push('Последний план съёмки: «'+(sh.d.topic||sh.d.title)+'» (статус: '+(sh.status||'plan')+')'); } }catch(e){}
    try{ var ai=STATE.ai||{}; if(ai.concrete_changes&&ai.concrete_changes.length)extra.push('Рекомендованные изменения: '+ai.concrete_changes.slice(0,3).map(function(c){return c.change||'';}).filter(Boolean).join('; ')); }catch(e){}
    return base+(extra.length?(' | '+extra.join(' | ')):'');
  };
})();

/* dynamic suggestions from channel weak spots */
function v3Suggs(){
  var out=[];
  try{
    var ai=STATE.ai||{};
    if(ai.leak_tag||ai.main_leak)out.push('Что сделать на этой неделе, чтобы закрыть главную утечку?');
    if(ai.hit_formula&&ai.hit_formula.length)out.push('Дай 5 заголовков под мою формулу хита');
    var bad=(STATE.topics||[]).filter(function(t){return /слаб|провал|ниже/i.test(t.verdict||'');})[0];
    if(bad)out.push('Стоит ли продолжать рубрику «'+bad.name+'»?');
    var sig=STATE.signals||{};
    if(sig.posting&&/низкая/.test(sig.posting.consistency||''))out.push('Помоги составить реалистичный график выхода роликов');
    if(sig.vispCoverage&&sig.vispCoverage.mostMissedInFlops&&sig.vispCoverage.mostMissedInFlops.length)out.push('Как добавить «'+sig.vispCoverage.mostMissedInFlops[0]+'» в мои заголовки?');
  }catch(e){}
  if(!out.length)out=['Что мне снять в следующем видео?','Почему мои длинные видео не заходят?','Дай 5 идей заголовков под мою формулу хита'];
  return out.slice(0,3);
}

window.mountChat=function(){
  var fab=q('#chatFab'); if(!fab)return;
  fab.style.display='grid';
  var ch=(typeof STATE!=='undefined'&&STATE&&STATE.channel)||{};
  V3CH.id=ch.id||ch.handle||ch.title||'_';
  var hist=chLoad(V3CH.id);
  CHAT_HISTORY=hist.slice();
  var body=q('#chatBody'); if(!body)return;
  body.innerHTML='';
  var name=ch.title||'твой канал';
  v3PushMsg('bot','Привет 👋 Я **Viora AI** — я проанализировала канал **'+name+'** и помню все цифры.'+(hist.length?' Продолжаем наш диалог 👇':' Спроси что угодно: почему ролик не зашёл, какой заголовок выбрать, что снять дальше.'));
  hist.forEach(function(m){
    var d=v3PushMsg(m.role==='assistant'?'bot':'user',m.content);
    if(m.role==='assistant'&&d)v3Acts(d,m.content,'');
  });
  var wrap=D.createElement('div'); wrap.className='chat-sugg';
  wrap.innerHTML=v3Suggs().map(function(s){return '<button onclick="askSugg(\''+s.replace(/'/g,"\\'")+'\')">'+escH(s)+'</button>';}).join('');
  body.appendChild(wrap);
  /* clear-dialog button in head */
  try{
    var head=q('#chatPanel .chat-head')||q('#chatPanel');
    if(head&&!q('#v3ChatNew')){
      var btn=D.createElement('button'); btn.id='v3ChatNew'; btn.title='Новый диалог (очистить историю)'; btn.textContent='⟳';
      btn.onclick=function(){ chClear(); };
      var x=head.querySelector('.x'); if(x)head.insertBefore(btn,x); else head.appendChild(btn);
    }
  }catch(e){}
  v3ChatScroll();
};

/* streaming */
function v3Stream(msgs,maxTokens,onTick){
  return new Promise(function(resolve,reject){
    var ctrl=new AbortController(); var to=setTimeout(function(){ctrl.abort();},60000);
    fetch('https://api.mistral.ai/v1/chat/completions',{
      method:'POST',signal:ctrl.signal,
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_FAST,temperature:0.6,max_tokens:maxTokens||700,stream:true,messages:msgs})
    }).then(function(r){
      if(!r.ok||!r.body)throw new Error('AI '+r.status);
      var rd=r.body.getReader(); var dec=new TextDecoder(); var buf=''; var full=''; var last=0;
      function pump(){
        rd.read().then(function(x){
          if(x.done){ clearTimeout(to); resolve(full); return; }
          buf+=dec.decode(x.value,{stream:true});
          var lines=buf.split('\n'); buf=lines.pop();
          lines.forEach(function(l){
            l=l.trim(); if(!l||l.indexOf('data:')!==0)return;
            var data=l.slice(5).trim(); if(data==='[DONE]')return;
            try{ var j=JSON.parse(data); var dlt=j.choices&&j.choices[0]&&j.choices[0].delta; if(dlt&&dlt.content)full+=dlt.content; }catch(e){}
          });
          var now=Date.now();
          if(onTick&&now-last>90){ last=now; try{ onTick(full); }catch(e){} }
          pump();
        },function(e){ clearTimeout(to); if(full)resolve(full); else reject(e); });
      }
      pump();
    },function(e){ clearTimeout(to); reject(e); });
  });
}
function v3ChatSys(){
  return 'Ты — Viora AI, личный консультант по росту YouTube. Отвечай КРАТКО и конкретно: суть без вступлений, не повторяй вопрос. Если нужен список — 3-5 пунктов через "- ". Подзаголовки через "### " только в длинных ответах. Ключевое выделяй **жирным**. По-русски. Опирайся ТОЛЬКО на данные канала ниже, не выдумывай цифры. Если просят идею/заголовок — дай сразу готовые варианты.\n\nДАННЫЕ КАНАЛА:\n'+window.buildChatContext();
}
window.sendChat=async function(){
  var inp=q('#chatInput'); if(!inp)return;
  var question=inp.value.trim(); if(!question||V3CH.busy)return;
  inp.value='';
  V3CH.busy=true;
  v3PushMsg('user',question);
  CHAT_HISTORY.push({role:'user',content:question}); chSave();
  var d=v3PushMsg('bot','',{pending:true});
  try{
    var msgs=[{role:'system',content:v3ChatSys()}].concat(CHAT_HISTORY.slice(-10));
    var ans=await v3Stream(msgs,700,function(t){ if(d){ d.querySelector('.v3-mdc').innerHTML=v3Md(t); v3ChatScroll(); } });
    ans=(typeof window.vClean==='function')?window.vClean(ans):ans;
    if(!ans)ans='Не получилось ответить, попробуй переформулировать.';
    if(d){ d.querySelector('.v3-mdc').innerHTML=v3Md(ans); v3Acts(d,ans,question); }
    CHAT_HISTORY.push({role:'assistant',content:ans}); chSave();
  }catch(e){
    if(d)d.querySelector('.v3-mdc').innerHTML='⚠️ Viora AI сейчас недоступна — попробуй ещё раз через пару секунд.';
  }
  V3CH.busy=false; v3ChatScroll();
};
/* regenerate harsher on 👎 */
function v3Regen(d,userQ){
  if(V3CH.busy)return; V3CH.busy=true;
  var mdc=d.querySelector('.v3-mdc'); var acts=d.querySelector('.v3-acts'); if(acts)acts.remove();
  mdc.innerHTML='<span class="v3dots"><span></span><span></span><span></span></span>';
  var hist=CHAT_HISTORY.slice(-10);
  var sys=v3ChatSys()+'\n\nВАЖНО: твой предыдущий ответ автор оценил как слабый и водянистый. Ответь ЗАНОВО: жёстче, конкретнее, каждая мысль с цифрой канала или готовым примером (заголовок/действие). Никаких общих фраз.';
  v3Stream([{role:'system',content:sys}].concat(hist),700,function(t){ mdc.innerHTML=v3Md(t); v3ChatScroll(); })
    .then(function(ans){
      ans=(typeof window.vClean==='function')?window.vClean(ans):ans;
      mdc.innerHTML=v3Md(ans||'Не получилось.');
      v3Acts(d,ans,userQ);
      if(CHAT_HISTORY.length&&CHAT_HISTORY[CHAT_HISTORY.length-1].role==='assistant')CHAT_HISTORY[CHAT_HISTORY.length-1].content=ans;
      chSave();
    })
    .catch(function(){ mdc.innerHTML='⚠️ Не получилось перегенерировать.'; })
    .then(function(){ V3CH.busy=false; });
}
/* feedback store (used in audit prompts too) */
var FB_KEY='viora_fb_v1';
function v3Fb(vote,note){
  try{ var a=lget(FB_KEY,[]); a.unshift({ts:Date.now(),vote:vote,note:String(note||'').slice(0,200)}); lset(FB_KEY,a.slice(0,30)); }catch(e){}
}
window.v3Fb=v3Fb;
/* ============================================================ */
/* 4. ONBOARDING WIZARD (5 шагов) + «МОЙ ПРОФИЛЬ» + план 4 нед. */
/* ============================================================ */
var PLAN_KEY='viora_plan4w_v1';
var GOALS={grow:{l:'🚀 Первые 1000 подписчиков',s:'набрать аудиторию с нуля'},monetize:{l:'💰 Монетизация',s:'выйти на доход с контента'},brand:{l:'⭐ Личный бренд',s:'стать заметным экспертом в нише'},funnel:{l:'📨 Перелив в Telegram',s:'собирать лояльную базу в TG'}};
var HOURS={low:{l:'⏱ 2–3 часа в неделю',n:1},mid:{l:'⏱ 5–7 часов в неделю',n:2},high:{l:'⏱ 10+ часов в неделю',n:3}};

function profGet(){ try{ return (typeof PROFILE!=='undefined'&&PROFILE)?PROFILE:lget('viora_profile_v1',null); }catch(e){ return lget('viora_profile_v1',null); } }
function profSet(p){ try{ if(typeof saveProfile==='function'){saveProfile(p);return;} }catch(e){} lset('viora_profile_v1',p); }

/* ---------- wizard ---------- */
window.openProfileQuiz=function(){
  var old=q('#profileQuiz'); if(old)old.remove();
  var p=profGet()||{};
  var draft={goal:p.goal2||'',level:p.level||'',context:p.context||'',hours:p.hours||'',ytLink:p.ytLink||'',tgLink:p.tgLink||''};
  var step=0;
  var ov=D.createElement('div'); ov.id='profileQuiz';
  ov.setAttribute('style','position:fixed;inset:0;z-index:14100;background:rgba(8,7,10,.78);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px');
  function opt(group,val,emoji,title,desc){
    var sel=draft[group]===val;
    return '<button type="button" class="v3w-opt'+(sel?' on':'')+'" data-g="'+group+'" data-v="'+val+'">'+
      '<span class="ic">'+emoji+'</span><span class="tx"><b>'+title+'</b>'+(desc?'<small>'+desc+'</small>':'')+'</span></button>';
  }
  var steps=[
    {t:'Какая цель ближе всего?',body:function(){return opt('goal','grow','🚀','Первые 1000 подписчиков','Набрать аудиторию и пробить алгоритм')+opt('goal','monetize','💰','Монетизация','Выйти на доход: реклама, продукты, донаты')+opt('goal','brand','⭐','Личный бренд','Стать узнаваемым экспертом в нише')+opt('goal','funnel','📨','Аудитория в Telegram','Переливать зрителей в свой TG-канал');}},
    {t:'Какой у тебя опыт?',body:function(){return opt('level','new','🐣','Новичок','Только начинаю или роликов мало — объясняй проще')+opt('level','pro','🚀','Уже веду канал','Есть опыт — давай плотно, без азов');}},
    {t:'Какой у тебя контент?',body:function(){return opt('context','fresh','🔥','Свежак / тренды','Новости, инфоповоды — быстро устаревает')+opt('context','expert','🌲','Вечнозелёное','Экспертиза, польза — смотрят месяцами')+opt('context','mixed','🔀','И то, и то','Смешанный контент');}},
    {t:'Сколько времени готов вкладывать?',body:function(){return opt('hours','low','🌙','2–3 часа в неделю','План будет компактным — только самое важное')+opt('hours','mid','🌤','5–7 часов в неделю','Стабильный темп: контент + упаковка')+opt('hours','high','☀️','10+ часов в неделю','Плотный план на максимальную скорость');}},
    {t:'Твои каналы (по желанию)',body:function(){
      return '<div class="v3w-f"><span>Ссылка на YouTube-канал</span><input id="v3wYt" type="text" placeholder="youtube.com/@handle" value="'+escH(draft.ytLink)+'"/></div>'+
        '<div class="v3w-f"><span>Ссылка на Telegram-канал</span><input id="v3wTg" type="text" placeholder="t.me/channel" value="'+escH(draft.tgLink)+'"/></div>'+
        '<div class="v3w-priv">🔒 Без персональных данных: имя, почта и телефон не нужны. Все ответы хранятся <b>только в твоём браузере</b> и никуда не отправляются. Если дашь ссылку на YouTube — сразу запущу полный аудит.</div>';
    }}
  ];
  function render(){
    var dots=steps.map(function(_,i){return '<span class="v3w-dot'+(i===step?' on':(i<step?' done':''))+'"></span>';}).join('');
    ov.innerHTML='<div class="v3w">'+
      '<div class="v3w-head"><div class="v3w-title">Настроим Viora под тебя</div><div class="v3w-dots">'+dots+'</div></div>'+
      '<div class="v3w-q">'+(step+1)+'/'+steps.length+' · '+steps[step].t+'</div>'+
      '<div class="v3w-body">'+steps[step].body()+'</div>'+
      '<div class="v3w-nav">'+
        '<button type="button" class="v3w-skip" id="v3wSkip">Пропустить</button>'+
        '<div class="v3w-navr">'+(step>0?'<button type="button" class="v3w-back" id="v3wBack">← Назад</button>':'')+
        '<button type="button" class="v3w-next" id="v3wNext">'+(step===steps.length-1?'✅ Готово':'Далее →')+'</button></div>'+
      '</div></div>';
    qa('.v3w-opt',ov).forEach(function(b){ b.onclick=function(){ draft[b.getAttribute('data-g')]=b.getAttribute('data-v'); if(step<steps.length-1){step++;render();}else{render();} }; });
    var sk=q('#v3wSkip',ov); if(sk)sk.onclick=function(){ try{localStorage.setItem('viora_quiz_seen','1');}catch(e){} ov.remove(); };
    var bk=q('#v3wBack',ov); if(bk)bk.onclick=function(){ grab(); step--; render(); };
    var nx=q('#v3wNext',ov); if(nx)nx.onclick=function(){ grab(); if(step<steps.length-1){step++;render();}else{finish();} };
  }
  function grab(){
    var yt=q('#v3wYt',ov),tg=q('#v3wTg',ov);
    if(yt)draft.ytLink=yt.value.trim();
    if(tg)draft.tgLink=tg.value.trim();
  }
  function finish(){
    grab();
    if(!draft.goal)draft.goal='grow';
    if(!draft.level)draft.level='new';
    if(!draft.context)draft.context='mixed';
    if(!draft.hours)draft.hours='mid';
    if(draft.ytLink&&!/^https?:/i.test(draft.ytLink))draft.ytLink='https://'+draft.ytLink.replace(/^\/+/,'');
    if(draft.tgLink&&!/^https?:/i.test(draft.tgLink))draft.tgLink='https://'+draft.tgLink.replace(/^\/+/,'');
    var prof={level:draft.level,context:draft.context,goal:(profGet()||{}).goal||'',goal2:draft.goal,goalLabel:(GOALS[draft.goal]||{}).l||'',hours:draft.hours,ytLink:draft.ytLink,tgLink:draft.tgLink,ts:Date.now()};
    profSet(prof);
    try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}
    lset(PLAN_KEY,buildPlan(prof));
    ov.remove();
    try{ if(typeof STATE!=='undefined'&&STATE&&STATE.channel&&typeof window.renderDashboard==='function')window.renderDashboard(); }catch(e){}
    v3Toast('Профиль сохранён — план на 4 недели готов 🎯');
    if(draft.ytLink&&!(typeof STATE!=='undefined'&&STATE&&STATE.channel)){
      setTimeout(function(){
        try{
          if(typeof window.enterYoutube==='function')window.enterYoutube();
          var i=q('#urlInput'); if(i){ i.value=draft.ytLink; if(typeof window.startAnalysis==='function')window.startAnalysis(); }
        }catch(e){}
      },450);
    } else {
      setTimeout(function(){ window.v3ProfOpen(); },350);
    }
  }
  render();
  D.body.appendChild(ov);
  ov.addEventListener('click',function(e){ if(e.target===ov){ try{localStorage.setItem('viora_quiz_seen','1');}catch(err){} ov.remove(); } });
};

/* ---------- план на 4 недели (детерминированные шаблоны методики) ---------- */
function buildPlan(p){
  var lvl=p.level||'new', goal=p.goal2||'grow', hrs=(HOURS[p.hours]||HOURS.mid).n, ctx=p.context||'mixed';
  var W1=[],W2=[],W3=[],W4=[];
  /* Неделя 1 — фундамент и диагностика */
  W1.push('Сделай полный аудит канала во вкладке YouTube (или обнови старый) и прочитай блок «Главная утечка роста»');
  W1.push('Выпиши свою «формулу хита» из разбора: какие приёмы заголовков и темы дают тебе максимум просмотров');
  if(lvl==='new')W1.push('Разбери ВИСП: проверь 3 последних заголовка — какие буквы (Выгода/Интрига/Срочность/Причастность) закрыты, какие нет');
  if(hrs>=2)W1.push('Найди 5 виральных тем через «Поиск идей» в своей нише и сохрани лучшие в избранное');
  if(hrs>=3)W1.push('Разбери 3 канала конкурентов: какие их ролики-выбросы ты можешь переснять лучше');
  /* Неделя 2 — упаковка */
  W2.push('Перепиши заголовки 3 слабых роликов по ВИСП (возьми готовые варианты из разбора)');
  W2.push('Собери план съёмки в «🎬 Твоё следующее видео» и сними ролик по чек-листу');
  if(ctx!=='fresh')W2.push('Проверь превью своих топ-5 роликов: эмоция, крупный объект, 3-5 слов текста, тёплые цвета');
  if(hrs>=2)W2.push('Выложи ролик в лучшее окно постинга из раздела «Когда постить»');
  if(hrs>=3)W2.push('Сними 2-3 Shorts (~30 сек) из нарезок или анонсов основного ролика');
  /* Неделя 3 — контент-система */
  W3.push('Закрепи регулярность: запланируй даты выхода на 2 недели вперёд и держи график');
  W3.push('Возьми 1 идею из «Идеи для следующих видео» и доведи до публикации');
  if(goal==='funnel')W3.push('Добавь ссылку на Telegram в описание, закреп-комментарий и конец ролика с конкретным бонусом за подписку');
  if(goal==='monetize')W3.push('Определи продукт/оффер: что будешь продавать аудитории (курс, услуга, реклама) и упомяни в 1 ролике нативно');
  if(goal==='brand')W3.push('Сними 1 экспертный ролик с личной историей — лицо в кадре, конкретный кейс с цифрами');
  if(goal==='grow')W3.push('Сделай 1 ролик в самой сильной рубрике канала (смотри вердикты рубрик в разборе)');
  if(hrs>=2)W3.push('Отвечай на все комментарии в первые 2 часа после выхода ролика');
  if(hrs>=3)W3.push('Протестируй 2 разных хука на Shorts: вопрос против шок-факта — сравни удержание');
  /* Неделя 4 — анализ и масштаб */
  W4.push('Обнови аудит канала и сравни: что изменилось по цифрам за месяц');
  W4.push('Спроси у Viora в чате: «Что сработало за месяц и что снять дальше?»');
  if(goal==='funnel')W4.push('Проверь конверсию: сколько подписчиков пришло в TG, и усили лучший источник');
  else W4.push('Найди свой ролик-выброс месяца и запланируй 2 продолжения в той же теме');
  if(hrs>=2)W4.push('Перепиши план на следующий месяц: убери то, что не работает, удвой то, что работает');
  var mk=function(t,tasks){return {t:t,tasks:tasks.map(function(x){return {t:x,done:false};})};};
  return {created:Date.now(),goal:goal,goalLabel:(GOALS[goal]||{}).l||'',hours:p.hours,weeks:[mk('Неделя 1 · Диагностика',W1),mk('Неделя 2 · Упаковка',W2),mk('Неделя 3 · Система контента',W3),mk('Неделя 4 · Анализ и масштаб',W4)]};
}
function planGet(){ return lget(PLAN_KEY,null); }
window.v3PlanToggle=function(w,t){
  var pl=planGet(); if(!pl||!pl.weeks[w]||!pl.weeks[w].tasks[t])return;
  pl.weeks[w].tasks[t].done=!pl.weeks[w].tasks[t].done;
  lset(PLAN_KEY,pl); renderProf();
};
window.v3PlanRebuild=function(){
  var p=profGet(); if(!p){ window.openProfileQuiz(); return; }
  lset(PLAN_KEY,buildPlan(p)); renderProf(); v3Toast('План пересобран 🔁');
};

/* ---------- profile page ---------- */
function buildProfModal(){
  if(q('#v3Prof'))return;
  var m=D.createElement('div'); m.id='v3Prof';
  m.innerHTML='<div class="v3p-scrim" onclick="v3ProfClose()"></div><div class="v3p-panel"><div class="v3p-head"><div class="v3p-title">👤 Мой профиль</div><button class="v3p-x" onclick="v3ProfClose()">×</button></div><div class="v3p-body" id="v3ProfBody"></div></div>';
  D.body.appendChild(m);
}
function renderProf(){
  var body=q('#v3ProfBody'); if(!body)return;
  var p=profGet();
  if(!p||!p.goal2){
    body.innerHTML='<div class="v3p-empty">Профиль ещё не настроен. Ответь на 5 коротких вопросов — соберу персональный план роста на 4 недели.<br><br><button class="v3p-cta" onclick="v3ProfClose();openProfileQuiz()">⚙️ Настроить профиль</button><div class="v3w-priv" style="margin-top:14px">🔒 Всё хранится только в твоём браузере — без имён, почты и телефонов.</div></div>';
    return;
  }
  var pills=[];
  if(p.goalLabel)pills.push(p.goalLabel);
  pills.push(p.level==='new'?'🐣 Новичок':'🚀 Опытный');
  pills.push(p.context==='fresh'?'🔥 Тренды':p.context==='expert'?'🌲 Вечнозелёное':'🔀 Смешанное');
  if(p.hours&&HOURS[p.hours])pills.push(HOURS[p.hours].l);
  var pillsH='<div class="v3p-pills">'+pills.map(function(x){return '<span>'+escH(x)+'</span>';}).join('')+'</div>';
  /* channels */
  var ch=[];
  var ytName=''; try{ if(typeof STATE!=='undefined'&&STATE&&STATE.channel)ytName=STATE.channel.title||''; }catch(e){}
  if(p.ytLink||ytName)ch.push('<div class="v3p-ch"><span>▶️ YouTube'+(ytName?(' · <b>'+escH(ytName)+'</b>'):'')+'</span><span class="v3p-ch-a">'+(p.ytLink?'<a href="'+escH(p.ytLink)+'" target="_blank" rel="noopener">открыть</a>':'')+'<button onclick="v3ProfAudit()">'+(ytName?'обновить аудит':'сделать аудит')+'</button></span></div>');
  if(p.tgLink)ch.push('<div class="v3p-ch"><span>📨 Telegram</span><span class="v3p-ch-a"><a href="'+escH(p.tgLink)+'" target="_blank" rel="noopener">открыть</a><button onclick="v3ProfClose();enterTelegram()">в студию</button></span></div>');
  var chH=ch.length?('<div class="v3p-sec">Мои каналы</div>'+ch.join('')):'';
  /* plan */
  var pl=planGet(); var planH='';
  if(pl&&pl.weeks){
    var total=0,done=0;
    pl.weeks.forEach(function(w){w.tasks.forEach(function(t){total++;if(t.done)done++;});});
    var pct=total?Math.round(done/total*100):0;
    planH='<div class="v3p-sec">План роста на 4 недели <button class="v3p-mini" onclick="v3PlanRebuild()" title="Пересобрать план под текущий профиль">🔁</button></div>'+
      '<div class="v3p-prog"><div class="v3p-prog-bar"><i style="width:'+pct+'%"></i></div><span>'+done+'/'+total+' · '+pct+'%</span></div>'+
      pl.weeks.map(function(w,wi){
        var wd=w.tasks.filter(function(t){return t.done;}).length;
        return '<details class="v3p-week"'+(wi===firstOpenWeek(pl)?' open':'')+'><summary>'+escH(w.t)+' <em>'+wd+'/'+w.tasks.length+'</em></summary>'+
          w.tasks.map(function(t,ti){return '<label class="v3p-task'+(t.done?' done':'')+'"><input type="checkbox" '+(t.done?'checked':'')+' onchange="v3PlanToggle('+wi+','+ti+')"/><span>'+escH(t.t)+'</span></label>';}).join('')+
        '</details>';
      }).join('');
  }
  /* shortcuts */
  var sc='<div class="v3p-sec">Быстрые действия</div><div class="v3p-row">'+
    '<button onclick="v3ProfClose();enterTelegram();setTimeout(function(){try{vpOpen()}catch(e){}},300)">📝 Мои посты</button>'+
    '<button onclick="v3ProfShoots()">🎬 Мои съёмки</button>'+
    '<button onclick="v3ProfClose();openProfileQuiz()">⚙️ Перенастроить</button></div>';
  body.innerHTML=pillsH+chH+planH+sc+'<div class="v3w-priv" style="margin-top:14px">🔒 Профиль и план хранятся только в этом браузере.</div>';
}
function firstOpenWeek(pl){
  for(var i=0;i<pl.weeks.length;i++){ if(pl.weeks[i].tasks.some(function(t){return !t.done;}))return i; }
  return 0;
}
window.v3ProfOpen=function(){ buildProfModal(); renderProf(); var m=q('#v3Prof'); if(m)m.classList.add('open'); };
window.v3ProfClose=function(){ var m=q('#v3Prof'); if(m)m.classList.remove('open'); };
window.v3ProfAudit=function(){
  var p=profGet()||{};
  window.v3ProfClose();
  try{
    if(typeof window.enterYoutube==='function')window.enterYoutube();
    var i=q('#urlInput');
    if(i){ if(p.ytLink&&!i.value)i.value=p.ytLink; if(i.value&&typeof window.startAnalysis==='function')window.startAnalysis(); else i.focus(); }
  }catch(e){}
};
window.v3ProfShoots=function(){
  window.v3ProfClose();
  try{
    if(typeof STATE!=='undefined'&&STATE&&STATE.channel){ var s=q('#nextShootSection'); if(s){ s.scrollIntoView({behavior:'smooth',block:'start'}); return; } }
  }catch(e){}
  v3Toast('Сначала сделай аудит канала — раздел «Мои съёмки» появится в разборе','warn',3200);
};
/* floating chip */
function buildProfChip(){
  if(q('#v3ProfBtn'))return;
  var b=D.createElement('button'); b.id='v3ProfBtn'; b.title='Мой профиль и план роста'; b.innerHTML='👤 <span>Профиль</span>';
  b.onclick=function(){ window.v3ProfOpen(); };
  D.body.appendChild(b);
}
/* ============================================================ */
/* 5. IDEA SEARCH — расширение запроса, честный множитель,      */
/*    фильтр мусора, «почему зашло», избранное                  */
/* ============================================================ */
var FAV_KEY='viora_fav_ideas_v1';
var JUNK_RE=/(\bклип\b|официальн\w+ клип|music video|official video|\bmv\b|lyric|караоке|karaoke|мэшап|mashup|подборка|компиляци|compilation|нарезк\w+ приколов|тик[- ]?ток|tiktok|премьера клипа|full album|концерт)/i;

function favGet(){ var a=lget(FAV_KEY,[]); return Array.isArray(a)?a:[]; }
function favHas(id){ return favGet().some(function(f){return f.id===id;}); }
window.v3FavToggle=function(id){
  var a=favGet();
  if(favHas(id)){ a=a.filter(function(f){return f.id!==id;}); lset(FAV_KEY,a); v3Toast('Убрано из избранного'); }
  else{
    var row=((IDEA_STATE&&(IDEA_STATE._all||IDEA_STATE.rows))||[]).find(function(v){return v.id===id;});
    if(!row)return;
    a.unshift({id:row.id,title:row.title,thumb:row.thumb,mult:+(+row.mult).toFixed(1),xavg:row.xavg||null,ch:(row.channel||{}).title||'',subs:(row.channel||{}).subs||0,views:row.views,isShort:!!row.isShort,dur:row.dur||0,q:(IDEA_STATE||{}).query||'',ts:Date.now()});
    lset(FAV_KEY,a.slice(0,50)); v3Toast('Сохранено в избранное ⭐');
  }
  qa('.v3-fav[data-id="'+id+'"]').forEach(function(b){ b.textContent=favHas(id)?'★':'☆'; b.classList.toggle('on',favHas(id)); });
  var c=q('#v3FavCnt'); if(c)c.textContent=favGet().length;
  var hc=q('#v3FavHeroCnt'); if(hc)hc.textContent=favGet().length;
};
window.v3FavOpen=function(){
  var old=q('#v3FavModal'); if(old)old.remove();
  var a=favGet();
  var m=D.createElement('div'); m.id='v3FavModal';
  var cards=a.length?a.map(function(f){
    return '<div class="v3f-item"><a class="v3f-th" href="https://youtu.be/'+f.id+'" target="_blank" rel="noopener"><img src="'+escH(f.thumb||'')+'" loading="lazy" onerror="this.style.display=\'none\'"/><span>×'+(f.mult>=10?Math.round(f.mult):f.mult)+'</span></a>'+
      '<div class="v3f-b"><div class="v3f-t">'+escH(f.title)+'</div><div class="v3f-m">📺 '+escH(f.ch)+' · 👁 '+fmtN(f.views)+(f.q?' · «'+escH(f.q)+'»':'')+'</div>'+
      '<div class="v3f-acts"><a href="https://youtu.be/'+f.id+'" target="_blank" rel="noopener">▶ Открыть</a><button onclick="v3FavAdapt(\''+f.id+'\')">✨ Адаптировать</button><button class="del" onclick="v3FavDel(\''+f.id+'\')">🗑</button></div></div></div>';
  }).join(''):'<div class="v3f-empty">Пока пусто. Жми ☆ на карточках в результатах поиска — соберёшь личную копилку проверенных идей.</div>';
  m.innerHTML='<div class="v3p-scrim" onclick="document.getElementById(\'v3FavModal\').remove()"></div><div class="v3p-panel"><div class="v3p-head"><div class="v3p-title">⭐ Избранные идеи ('+a.length+')</div><button class="v3p-x" onclick="document.getElementById(\'v3FavModal\').remove()">×</button></div><div class="v3p-body">'+cards+'</div></div>';
  D.body.appendChild(m); m.classList.add('open');
};
window.v3FavDel=function(id){ lset(FAV_KEY,favGet().filter(function(f){return f.id!==id;})); window.v3FavOpen(); var c=q('#v3FavCnt'); if(c)c.textContent=favGet().length; var hc=q('#v3FavHeroCnt'); if(hc)hc.textContent=favGet().length; };
window.v3FavAdapt=function(id){
  var f=favGet().find(function(x){return x.id===id;}); if(!f)return;
  var m=q('#v3FavModal'); if(m)m.remove();
  try{
    if(typeof STATE!=='undefined'&&STATE&&STATE.channel){
      q('#dashboard').style.display='block'; q('#ideas').style.display='none';
      var lt=q('#labTopic'); if(lt){ lt.value=f.title.slice(0,120); lt.scrollIntoView({block:'center'}); setTimeout(function(){ if(typeof window.runTitleLab==='function')window.runTitleLab(); },250); }
    } else { alert('Чтобы адаптировать идею под твой канал, сначала сделай аудит своего канала (вкладка «Аудит канала»).'); }
  }catch(e){}
};

/* «почему зашло» — детерминированные триггеры заголовка */
function whyHit(title){
  var out=[];
  try{ var v=window.vispScore?window.vispScore(title):null; if(v&&v.hit&&v.hit.length)out.push('ВИСП: '+v.hit.map(function(x){return x.k;}).join('')); }catch(e){}
  if(/\bкак\b|\bhow\b/i.test(title))out.push('«как»-формат');
  if(/\d/.test(title))out.push('число');
  if(/\?/.test(title))out.push('вопрос');
  if(/нельзя|никогда|не делай|хватит|stop|ошибк/i.test(title))out.push('запрет/ошибка');
  if(/секрет|скрыт|никто не|правда о/i.test(title))out.push('интрига');
  return out.slice(0,3);
}

/* AI-расширение запроса (MODEL_FAST, мягкий fallback) */
async function v3Expand(query){
  try{
    var ctrl=new AbortController(); var to=setTimeout(function(){ctrl.abort();},8000);
    var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',signal:ctrl.signal,
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_FAST,temperature:0.4,max_tokens:80,
        messages:[{role:'system',content:'Дай 2 альтернативные короткие поисковые формулировки для поиска видео на YouTube по теме пользователя, на том же языке. Близкие по смыслу, но другими словами (синонимы, смежный угол). Ответ: ровно 2 строки, без нумерации, кавычек и пояснений.'},{role:'user',content:query}]})});
    clearTimeout(to);
    if(!r.ok)return [];
    var d=await r.json();
    var txt=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
    return txt.split('\n').map(function(s){return s.replace(/^[\d\.\)\-•"«»\s]+/,'').replace(/["«»]+$/,'').trim();})
      .filter(function(s){return s.length>2&&s.length<80&&s.toLowerCase()!==query.toLowerCase();}).slice(0,2);
  }catch(e){ return []; }
}

/* полный override поиска идей */
window.startIdeaSearch=async function(){
  var qEl=q('#ideaInput'); var query=(qEl?qEl.value:'').trim();
  if(!query){ if(qEl)qEl.focus(); return; }
  var timeF=ddGet('ideaTime'), typeF=ddGet('ideaType'), sizeF=ddGet('ideaSize'), langF=ddGet('ideaLang'), presetF=ddGet('ideaPreset')||'';
  q('#hero').style.display='none'; q('#dashboard').style.display='none'; q('#ideas').style.display='none';
  q('#loading').style.display='flex';
  q('#steps').innerHTML=IDEA_STEPS.map(function(s){return '<div class="step" data-s="'+s.id+'"><span class="ic"></span><span>'+s.label+'</span></div>';}).join('');
  q('#loadTitle').textContent='Ищу виральные выбросы…';
  q('#loadSub').textContent='Сканирую десятки каналов по теме — 20–50 секунд';
  window.scrollTo(0,0);
  var longT=setTimeout(function(){ var ls=q('#loadSub'); if(ls&&q('#loading').style.display!=='none')ls.textContent='Почти готово — AI сводит закономерности…'; },25000);
  try{
    setStep('q','active');
    var after='';
    if(timeF){ var dd=new Date(Date.now()-(+timeF)*864e5); after='&publishedAfter='+dd.toISOString(); }
    var order=timeF&&+timeF<=30?'viewCount':'relevance';
    var lang=langParam(langF);
    /* AI: 2 альтернативные формулировки → шире охват */
    var variants=await v3Expand(query);
    var queries=[query].concat(variants);
    setStep('q','done');

    setStep('search','active');
    var vids=[],seen=new Set();
    var orders=Array.from(new Set([order,'viewCount']));
    for(var qi=0;qi<queries.length;qi++){
      var qq=queries[qi];
      var pagesMax=qi===0?2:1; /* основной запрос глубже, варианты — по 1 странице */
      for(var oi=0;oi<orders.length;oi++){
        if(qi>0&&oi>0)continue; /* варианты — только в основном порядке */
        var token='',pages=0;
        while(pages<pagesMax){
          var s=await ytFetch('search?part=snippet&type=video&maxResults=50&order='+orders[oi]+'&q='+encodeURIComponent(qq)+lang+after+(token?('&pageToken='+token):''));
          (s.items||[]).forEach(function(i){ var id=i.id&&i.id.videoId; if(id&&!seen.has(id)){ seen.add(id); vids.push({id:id,channelId:i.snippet.channelId}); } });
          token=s.nextPageToken; pages++; if(!token)break;
        }
      }
    }
    if(!vids.length)throw new Error('По запросу «'+query+'» ничего не нашлось. Попробуй другую формулировку.');
    setStep('search','done');

    setStep('channels','active');
    var ids=vids.map(function(v){return v.id;});
    var full=await getVideos(ids);
    var chMap={};
    var vToCh={}; vids.forEach(function(v){ vToCh[v.id]=v.channelId; });
    var chIds=Array.from(new Set(vids.map(function(v){return v.channelId;}).filter(Boolean)));
    for(var ci=0;ci<chIds.length;ci+=50){
      var chunk=chIds.slice(ci,ci+50).join(',');
      var d=await ytFetch('channels?part=snippet,statistics&id='+chunk);
      (d.items||[]).forEach(function(c){ chMap[c.id]={title:c.snippet.title,avatar:c.snippet.thumbnails&&c.snippet.thumbnails.default&&c.snippet.thumbnails.default.url,subs:+c.statistics.subscriberCount||0,totalViews:+c.statistics.viewCount||0,videoCount:+c.statistics.videoCount||0}; });
    }
    setStep('channels','done');

    setStep('outlier','active');
    var mySubs=(typeof STATE!=='undefined'&&STATE&&STATE.channel&&STATE.channel.subs)||0;
    var rows=[];
    full.forEach(function(v){
      var cid=vToCh[v.id]; var ch=chMap[cid]; if(!ch)return;
      var subs=ch.subs||0;
      if(subs<50)return;
      var mult=v.views/subs;
      if(v.views<500)return;
      if(typeF==='long'&&v.isShort)return;
      if(typeF==='short'&&!v.isShort)return;
      if(sizeF==='small'&&ch.subs>100000)return;
      if(sizeF==='mid'&&(ch.subs<100000||ch.subs>1000000))return;
      if(sizeF==='similar'&&mySubs>0&&(ch.subs<mySubs*0.2||ch.subs>mySubs*5))return;
      var _age=v.age||0;
      if(presetF==='gold'&&!(subs<5000&&v.views>=10000&&mult>=8))return;
      if(presetF==='under'&&!(mult>=5&&subs<200000))return;
      if(presetF==='fresh'&&!(_age<=30&&mult>=2))return;
      if(presetF==='evergreen'&&!(_age>=180&&v.viewsPerDay>=(v.isShort?40:15)))return;
      if(presetF==='seo'){ var _qw=query.toLowerCase().split(/\s+/).filter(function(w){return w.length>3;}); var _t=(v.title||'').toLowerCase(); if(_qw.length&&!_qw.some(function(w){return _t.indexOf(w)>=0;}))return; }
      /* честный второй множитель: во сколько раз ролик обогнал СРЕДНИЙ ролик этого канала */
      var xavg=null;
      if(ch.videoCount>=5&&ch.totalViews>0){ var avgPer=ch.totalViews/ch.videoCount; if(avgPer>=20)xavg=+(v.views/avgPer).toFixed(1); }
      var row=Object.assign({},v,{channel:ch,channelId:cid,baseline:subs,mult:mult,xavg:xavg,_junk:JUNK_RE.test(v.title||'')});
      rows.push(row);
    });
    if(!rows.length)throw new Error('Не нашлось ярких выбросов под эти фильтры. Ослабь фильтры (размер канала / период) и попробуй снова.');
    rows.sort(function(a,b){return b.mult-a.mult;});
    var _sort=presetF==='evergreen'?'views':(presetF==='fresh'?'recent':'mult');
    IDEA_STATE={query:query,rows:rows,sort:_sort,timeF:timeF,typeF:typeF,sizeF:sizeF,langF:langF,presetF:presetF,variants:variants};
    setStep('outlier','done');

    setStep('ai','active');
    q('#loadTitle').textContent='AI ищет общий паттерн…';
    var ai=null;
    try{ ai=await callIdeaAI(query,rows.filter(function(r){return !r._junk;}).slice(0,18)); }catch(e){ console.warn('idea ai failed',e); IDEA_STATE.aiError=true; }
    IDEA_STATE.ai=ai;
    setStep('ai','done');

    await sleep(300);
    clearTimeout(longT);
    renderOutliers();
  }catch(err){ clearTimeout(longT); console.error(err); showError(err); }
};

/* карточка результата: оба множителя + «почему зашло» + ☆ + метка мусора */
window.outCard=function(v){
  var cls=outClass(v.mult);
  var why=whyHit(v.title||'');
  var fav=favHas(v.id);
  return '<div class="out'+(v._junk?' v3junk':'')+'">'+
    '<a class="thumb" href="https://youtu.be/'+v.id+'" target="_blank" rel="noopener">'+
      '<img src="'+safeImg(v.thumb)+'" alt="" loading="lazy" onerror="this.parentElement.style.background=\'#1a1a1a\'"/>'+
      '<span class="mult '+cls+'">'+multLabel(v.mult)+'</span>'+
      '<span class="typ '+(v.isShort?'short':'long')+'">'+(v.isShort?'⚡ Shorts':'🎬 Длинное')+'</span>'+
      '<span class="dur">'+durLabel(v.dur)+'</span>'+
      (v._junk?'<span class="v3junk-tag">🎵 похоже на клип</span>':'')+
    '</a>'+
    '<div class="body">'+
      '<div class="ot">'+esc(v.title)+'</div>'+
      benefitChip(v.title)+
      (why.length?'<div class="v3why">🎯 Почему зашло: '+why.map(function(w){return '<b>'+escH(w)+'</b>';}).join(' · ')+'</div>':'')+
      '<div class="och">📺 '+esc(v.channel.title)+' · '+fmt(v.channel.subs)+' подп.</div>'+
      '<div class="ostats">'+
        '<span class="om">👁 <b>'+fmt(v.views)+'</b></span>'+
        '<span class="om" title="Просмотры относительно числа подписчиков">👥 ×<b>'+(v.mult>=10?Math.round(v.mult):v.mult.toFixed(1))+'</b> к подп.</span>'+
        (v.xavg?'<span class="om v3om" title="Во сколько раз ролик обогнал средний ролик этого канала — самый честный признак выброса">📈 ×<b>'+(v.xavg>=10?Math.round(v.xavg):v.xavg)+'</b> к ср. ролику</span>':'')+
        '<span class="om">⚡ <b>'+(v.engagement*100).toFixed(1)+'%</b></span>'+
      '</div>'+
      '<div class="obar">'+
        '<button onclick="adaptIdea(\''+v.id+'\')">✨ Адаптировать</button>'+
        '<a href="https://youtu.be/'+v.id+'" target="_blank" rel="noopener">▶ Открыть</a>'+
        '<button class="v3-fav'+(fav?' on':'')+'" data-id="'+v.id+'" title="В избранное" onclick="v3FavToggle(\''+v.id+'\')">'+(fav?'★':'☆')+'</button>'+
      '</div>'+
    '</div>'+
  '</div>';
};

/* wrap renderOutliers: фильтр мусора + кнопка избранного + честный текст */
(function(){
  var orig=window.renderOutliers;
  window.renderOutliers=function(){
    try{
      if(IDEA_STATE&&IDEA_STATE.rows){
        if(!IDEA_STATE._all)IDEA_STATE._all=IDEA_STATE.rows;
        IDEA_STATE.rows=IDEA_STATE.junkOff?IDEA_STATE._all.filter(function(v){return !v._junk;}):IDEA_STATE._all;
        if(!IDEA_STATE.rows.length)IDEA_STATE.rows=IDEA_STATE._all;
      }
    }catch(e){}
    var r=orig?orig.apply(this,arguments):null;
    try{
      var sortBar=q('#outSort');
      if(sortBar&&!q('#v3FavBtn2')){
        var junkN=(IDEA_STATE._all||[]).filter(function(v){return v._junk;}).length;
        if(junkN>0){
          var jb=D.createElement('button'); jb.id='v3JunkBtn';
          jb.className=IDEA_STATE.junkOff?'on':'';
          jb.innerHTML='🎵 Без клипов ('+junkN+')';
          jb.title='Скрыть музыкальные клипы, караоке и компиляции из результатов';
          jb.onclick=function(){ IDEA_STATE.junkOff=!IDEA_STATE.junkOff; window.renderOutliers(); };
          sortBar.appendChild(jb);
        }
        var fb=D.createElement('button'); fb.id='v3FavBtn2'; fb.innerHTML='⭐ <span id="v3FavCnt">'+favGet().length+'</span>'; fb.title='Избранные идеи';
        fb.onclick=function(){ window.v3FavOpen(); };
        sortBar.appendChild(fb);
      }
      var desc=q('#ideas .out-head .desc');
      if(desc&&IDEA_STATE&&IDEA_STATE._all){
        var extra=' <b style="color:#9bf3bf">📈 ×N к ср. ролику</b> — во сколько раз ролик обогнал средний ролик своего канала (самый честный признак выброса).';
        if(IDEA_STATE.variants&&IDEA_STATE.variants.length)extra+=' Поиск расширен AI: «'+IDEA_STATE.variants.map(esc).join('», «')+'».';
        desc.innerHTML+=extra;
      }
    }catch(e){}
    return r;
  };
})();

/* кнопка избранного на главной (режим поиска идей) */
function injectFavHero(){
  var pane=q('#ideaPane .searchbox'); if(!pane||q('#v3FavHero'))return;
  var d=D.createElement('div'); d.className='examples'; d.id='v3FavHero';
  d.innerHTML='<code onclick="v3FavOpen()">⭐ мои избранные идеи (<span id="v3FavHeroCnt">'+favGet().length+'</span>)</code>';
  pane.appendChild(d);
}
/* ============================================================ */
/* 6. КАЧЕСТВО АНАЛИЗА — сигналы, калибровка, обратная связь    */
/* ============================================================ */

/* больше детерминированных сигналов до ИИ */
(function(){
  var orig=window.computeSignals;
  if(!orig)return;
  window.computeSignals=function(groups){
    var sig=orig.apply(this,arguments)||{};
    try{
      /* sweet spot длительности длинных роликов */
      var longs=(STATE.longs||[]).filter(function(v){return v.dur>0&&v.viewsPerDay>=0;});
      if(longs.length>=6){
        var buckets=[{l:'до 4 мин',f:function(d){return d<240;}},{l:'4–8 мин',f:function(d){return d>=240&&d<480;}},{l:'8–15 мин',f:function(d){return d>=480&&d<900;}},{l:'15+ мин',f:function(d){return d>=900;}}];
        var res=buckets.map(function(b){
          var g=longs.filter(function(v){return b.f(v.dur);});
          if(g.length<3)return null;
          var vals=g.map(function(v){return v.viewsPerDay;}).sort(function(a,b){return a-b;});
          return {bucket:b.l,count:g.length,medianVpd:Math.round(vals[Math.floor(vals.length/2)])};
        }).filter(Boolean);
        if(res.length>=2){
          var best=res.slice().sort(function(a,b){return b.medianVpd-a.medianVpd;})[0];
          sig.durationSweetSpot={best:best.bucket,bestMedianVpd:best.medianVpd,buckets:res};
        }
      }
      /* momentum: последние 90 дней vs предыдущие 90 */
      var all=[].concat(STATE.shorts||[],STATE.longs||[],STATE.streams||[]);
      var rec=all.filter(function(v){return v.age<=90;}), prev=all.filter(function(v){return v.age>90&&v.age<=180;});
      if(rec.length>=3&&prev.length>=3){
        var med=function(g){var v=g.map(function(x){return x.viewsPerDay;}).sort(function(a,b){return a-b;});return v[Math.floor(v.length/2)];};
        var mr=med(rec),mp=med(prev);
        sig.uploadMomentum={last90:{count:rec.length,medianVpd:Math.round(mr)},prev90:{count:prev.length,medianVpd:Math.round(mp)},deltaPct:mp?Math.round((mr/mp-1)*100):0};
      }
    }catch(e){}
    return sig;
  };
})();

/* few-shot калибровка: каждому проходу — образец плохого/хорошего совета */
var V3_FEWSHOT='\n\nКАЛИБРОВКА КАЧЕСТВА. ПЛОХО (запрещено, слишком общо): «Улучшайте заголовки и снимайте регулярнее, это поможет каналу расти». ХОРОШО (образец уровня): «Замени заголовок «Мой влог #12» (×0.3 к медиане) на формат Выгода+Интрига — у тебя «как»-заголовки дают ×2.4 (ролик «Как я …» — 1 200 просм/день против медианы 500). Конкретный вариант: «Как я потерял 50 000 ₽ за один день — и что спасло канал»». Каждый твой пункт обязан быть уровня ХОРОШЕГО примера: цифра из данных + название ролика + готовая формулировка.';
(function(){
  var orig=window._mistralPass;
  if(!orig)return;
  window._mistralPass=function(system,userContent,maxTokens,temp,model){
    try{ if(typeof system==='string'&&system.indexOf('КАЛИБРОВКА КАЧЕСТВА')<0)system+=V3_FEWSHOT; }catch(e){}
    return orig.call(this,system,userContent,maxTokens,temp,model);
  };
})();

/* обратная связь автора попадает в следующий разбор */
(function(){
  var orig=window.buildMistralPayload;
  if(!orig)return;
  window.buildMistralPayload=function(){
    var p=orig.apply(this,arguments);
    try{
      var fb=lget(FB_KEY,[])||[];
      var down=fb.filter(function(x){return x.vote===-1;});
      if(down.length){
        p.user_feedback={note:'Автор ставил 👎 предыдущим разборам/ответам '+down.length+' раз(а). Будь жёстче и конкретнее: каждый пункт с цифрой и готовой формулировкой, ноль общих фраз.',examples:down.slice(0,3).map(function(x){return x.note;}).filter(Boolean)};
      }
    }catch(e){}
    return p;
  };
})();

/* 👍/👎 под вердиктом разбора */
(function(){
  var orig=window.renderDashboard;
  if(!orig)return;
  window.renderDashboard=function(){
    var r=orig.apply(this,arguments);
    try{
      var v=q('#dashboard .verdict');
      if(v&&!q('#v3FbRow')){
        var row=D.createElement('div'); row.id='v3FbRow';
        row.innerHTML='<span>Полезен разбор?</span><button data-v="1">👍</button><button data-v="-1">👎</button>';
        row.addEventListener('click',function(e){
          var b=e.target.closest('button'); if(!b)return;
          var vote=+b.getAttribute('data-v');
          if(vote===1){ v3Fb(1,''); row.innerHTML='<span>Спасибо! 🙌</span>'; }
          else{
            row.innerHTML='<span>Что не так?</span><input id="v3FbNote" type="text" placeholder="например: слишком общо, мало цифр" maxlength="120"/><button id="v3FbSend">→</button>';
            q('#v3FbSend').onclick=function(){
              v3Fb(-1,(q('#v3FbNote')||{}).value||'');
              row.innerHTML='<span>Записала — следующий разбор сделаю жёстче и конкретнее 🎯</span>';
            };
          }
        });
        v.parentNode.insertBefore(row,v.nextSibling);
      }
    }catch(e){}
    return r;
  };
})();

/* ============================================================ */
/* BOOT                                                          */
/* ============================================================ */
function v3Boot(){
  try{ buildBubble(); buildCounter(); wireBody(); }catch(e){}
  try{ buildProfChip(); }catch(e){}
  try{ injectFavHero(); }catch(e){}
  try{ if(typeof window.vpOpen==='function'){} }catch(e){}
  /* счётчик при открытии редактора */
  try{
    var oW=window.vWriteOpen;
    if(oW)window.vWriteOpen=function(){ var r=oW.apply(this,arguments); try{ wireBody(); setTimeout(v3Count,80); }catch(e){} return r; };
  }catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){ setTimeout(v3Boot,400); });
else setTimeout(v3Boot,400);
})();
