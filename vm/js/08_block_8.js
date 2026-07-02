(function(){
if(window.__VR9)return; window.__VR9=true;
var $=function(s,r){return (r||document).querySelector(s);};
function esc(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function b64e(s){try{return btoa(unescape(encodeURIComponent(s)));}catch(e){return '';}}
function b64d(s){try{return decodeURIComponent(escape(atob(s)));}catch(e){return '';}}
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function toast(m){try{if(window.toastY){window.toastY(m);return;}}catch(e){}var t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:#1a1a1d;color:#fff;border:1px solid rgba(255,255,255,.12);padding:11px 18px;border-radius:12px;z-index:14040;font-family:Onest,sans-serif;font-size:13.5px;box-shadow:0 18px 50px rgba(0,0,0,.6)';document.body.appendChild(t);setTimeout(function(){t.style.transition='.4s';t.style.opacity='0';setTimeout(function(){t.remove();},420);},2000);}
function copy(text){try{if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(text);}}catch(e){}try{var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}catch(e){}return Promise.resolve();}
function strip(html){var d=document.createElement('div');d.innerHTML=html||'';d.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach(function(n){n.remove();});d.querySelectorAll('*').forEach(function(n){for(var i=n.attributes.length-1;i>=0;i--){var a=n.attributes[i].name;var v=n.attributes[i].value||'';if(/^on/i.test(a)||/javascript:/i.test(v)){n.removeAttribute(a);}}});return d.innerHTML;}
window.__VR9H={$:$,esc:esc,b64e:b64e,b64d:b64d,uid:uid,strip:strip,toast:toast,copy:copy};
var DKEY='viora_draft_v2';
function dsave(){try{var d={t:($('#veTitle')||{}).innerText||'',a:($('#veAuthor')||{}).innerText||'',b:strip(($('#veBody')||{}).innerHTML||'')};localStorage.setItem(DKEY,JSON.stringify(d));}catch(e){}}
function dload(){try{return JSON.parse(localStorage.getItem(DKEY)||'null');}catch(e){return null;}}
window.__VR9D={save:dsave,load:dload};
window.veCmd=function(ev,cmd){ if(ev){ev.preventDefault();} var body=$('#veBody'); if(body){body.focus();}
  try{
    if(cmd==='undo'){document.execCommand('undo');return false;}
    if(cmd==='redo'){document.execCommand('redo');return false;}
    if(cmd==='bold'){document.execCommand('bold');}
    else if(cmd==='italic'){document.execCommand('italic');}
    else if(cmd==='ul'){document.execCommand('insertUnorderedList');}
    else if(cmd==='h2'){ var blk=curBlock(); document.execCommand('formatBlock',false, (blk==='h2'?'p':'h2')); }
    else if(cmd==='quote'){ var b2=curBlock(); document.execCommand('formatBlock',false,(b2==='blockquote'?'p':'blockquote')); }
    else if(cmd==='link'){ veLinkOpen(); }
  }catch(e){}
  dsave(); return false;
};
function curBlock(){ try{var s=window.getSelection();if(!s||!s.rangeCount)return '';var n=s.getRangeAt(0).startContainer;n=n.nodeType===3?n.parentNode:n;while(n&&n!==document.body){var tg=(n.tagName||'').toLowerCase();if(tg==='h2'||tg==='blockquote'||tg==='p'||tg==='li')return tg;n=n.parentNode;}return '';}catch(e){return '';} }
window.__veCurBlock=curBlock;
})();
