/* ============================================================== */
/*  VIORA V32: экспорт аудита ссылкой + просмотр по ссылке       */
/*  Ссылка несёт только выжимку аудита в самом URL (#a=...):    */
/*  никакого бэкенда, ключей и персональных данных.            */
/* ============================================================== */
(function(){
"use strict";
var W=window,D=document;
function esc2(s){return String(s==null?'':s).replace(/[<>&"]/g,function(c){return{'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});}
function fmt2(n){n=+n||0;if(n>=1e6)return (n/1e6).toFixed(1).replace(/\.0$/,'')+' млн';if(n>=1e3)return (n/1e3).toFixed(1).replace(/\.0$/,'')+' тыс.';return String(Math.round(n));}
function b64uEnc(u8){var s='';for(var i=0;i<u8.length;i+=0x8000){s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));}return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64uDec(str){str=String(str).replace(/-/g,'+').replace(/_/g,'/');while(str.length%4)str+='=';var b=atob(str),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
async function deflate(u8){if(!W.CompressionStream)return null;var cs=new CompressionStream('deflate-raw');var ab=await new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer();return new Uint8Array(ab);}
async function inflate(u8){var ds=new DecompressionStream('deflate-raw');var ab=await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer();return new TextDecoder().decode(ab);}
function packPayload(){
  var s=W.STATE;if(!s||!s.channel||!s.channel.title)return null;
  var ai=s.ai||{},g=s.groups||{};
  function arr(a,n,f){return (Array.isArray(a)?a:[]).slice(0,n).map(f).filter(Boolean);}
  return {v:1,d:new Date().toISOString().slice(0,10),
    ch:{t:s.channel.title,s:s.channel.subs||0,n:s.channel.videoCount||0},
    sc:isFinite(+ai.score)?Math.round(+ai.score):null,
    lk:ai.main_leak||'',sh:ai.shorts_insights||'',lf:ai.longform_insights||'',
    ns:(s.shorts||[]).length,nl:(s.longs||[]).length,
    ms:Math.round((g.shorts&&g.shorts.med)||0),ml:Math.round((g.longs&&g.longs.med)||0),
    pl:arr(ai.action_plan,8,function(p){return typeof p==='string'?p:(p&&(p.step||p.title)||'');}),
    cg:arr(ai.concrete_changes,6,function(c){return typeof c==='string'?c:(c&&(c.change||c.what||c.step)||'');})};
}
async function encodeAudit(p){
  var u8=new TextEncoder().encode(JSON.stringify(p));
  var z=null;try{z=await deflate(u8);}catch(e){}
  return (z&&z.length<u8.length)?('1'+b64uEnc(z)):('0'+b64uEnc(u8));
}
async function decodeAudit(str){
  var mode=str.charAt(0),u8=b64uDec(str.slice(1));
  var json=(mode==='1')?await inflate(u8):new TextDecoder().decode(u8);
  return JSON.parse(json);
}
W.vShareLink=async function(btn){
  try{
    var p=packPayload();
    if(!p||p.sc==null){if(W.vToast)W.vToast('Сначала дождись окончания AI-аудита','warn');return;}
    var enc=await encodeAudit(p);
    var url=location.href.split('#')[0]+'#a='+enc;
    var done=function(){
      if(W.vToast)W.vToast('Ссылка скопирована — по ней откроется выжимка аудита','ok',3500);
      if(btn){var t=btn.textContent;btn.textContent='✓ Ссылка скопирована';setTimeout(function(){btn.textContent=t;},2600);}
    };
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(done,function(){prompt('Скопируй ссылку:',url);});
    else prompt('Скопируй ссылку:',url);
  }catch(e){if(W.vToast)W.vToast('Не получилось собрать ссылку: '+(e&&e.message||''),'err');}
};
function li(x){return '<li>'+esc2(x)+'</li>';}
function sharedHtml(p){
  var sc=p.sc==null?null:+p.sc;
  var scCol=sc==null?'#9aa':sc>=70?'#36e0a0':sc>=45?'#ffb020':'#ff5470';
  return '<div class="vsh-card">'
    +'<div class="vsh-top"><span class="vsh-brand">Viora<span>Media</span></span><button class="vsh-x" onclick="__vShareClose()" aria-label="Закрыть">✕</button></div>'
    +'<div class="vsh-head"><div class="vsh-score" style="color:'+scCol+';border-color:'+scCol+'">'+(sc==null?'—':sc)+'<span>/100</span></div>'
    +'<div class="vsh-chwrap"><div class="vsh-cht">'+esc2(p.ch.t)+'</div><div class="vsh-chm">'+fmt2(p.ch.s)+' подписчиков · '+fmt2(p.ch.n)+' роликов · аудит от '+esc2(p.d)+'</div></div></div>'
    +(p.lk?'<div class="vsh-leak"><b>🩺 Главная утечка роста:</b> '+esc2(p.lk)+'</div>':'')
    +((p.sh||p.lf)?'<div class="vsh-fmt">'
      +(p.sh?'<div class="vsh-fc"><div class="h">⚡ Shorts · '+p.ns+' шт. · медиана '+fmt2(p.ms)+'/день</div>'+esc2(p.sh)+'</div>':'')
      +(p.lf?'<div class="vsh-fc"><div class="h">🎬 Длинные · '+p.nl+' шт. · медиана '+fmt2(p.ml)+'/день</div>'+esc2(p.lf)+'</div>':'')
      +'</div>':'')
    +(p.cg&&p.cg.length?'<div class="vsh-sec"><div class="h">🔧 Что менять в первую очередь</div><ul>'+p.cg.map(li).join('')+'</ul></div>':'')
    +(p.pl&&p.pl.length?'<div class="vsh-sec"><div class="h">🗺️ План действий</div><ol>'+p.pl.map(li).join('')+'</ol></div>':'')
    +'<div class="vsh-note">Это выжимка аудита, которой поделились по ссылке. Полный интерактивный разбор — по кнопке ниже.</div>'
    +'<button class="vsh-cta" onclick="__vShareClose()">Сделать аудит своего канала →</button>'
    +'</div>';
}
function showShared(p){
  var ov=D.createElement('div');ov.className='vshare-ov';ov.id='vShareView';
  ov.innerHTML=sharedHtml(p);
  D.body.appendChild(ov);D.body.style.overflow='hidden';
}
W.__vShareClose=function(){
  var ov=D.getElementById('vShareView');if(ov)ov.remove();
  D.body.style.overflow='';
  try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
};
function boot(){
  var m=/^#a=(.+)$/.exec(location.hash||'');
  if(!m)return;
  decodeAudit(m[1]).then(function(p){if(p&&p.v===1&&p.ch)showShared(p);}).catch(function(){});
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
W.__v32={encodeAudit:encodeAudit,decodeAudit:decodeAudit,packPayload:packPayload,b64uEnc:b64uEnc,b64uDec:b64uDec};
})();
