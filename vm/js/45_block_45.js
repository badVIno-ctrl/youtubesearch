/* VIORA v23m2 — «Путь роста»: ретеншн-лестница новичка, self-contained */
(function(){
'use strict';
if(window.__v23mBooted)return;window.__v23mBooted=true;
var D=document;
function jget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function prof(){var p=jget('viora_profile_v1',{});return (p&&typeof p==='object')?p:{};}
function profileOk(){var p=prof();return !!(p.level&&p.context&&p.niche&&String(p.niche).trim());}
function auditOk(){var a=jget('viora_hist_audit',[]);return !!(a&&a[0]&&a[0].state);}
function planOk(){try{if(window.__v16&&window.__v16.calGet){var c=window.__v16.calGet();if(c&&c.days&&c.days.length)return true;}}catch(e){}try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('v16_cal:')===0){var v=jget(k,null);if(v&&v.days&&v.days.length)return true;}}}catch(e){}return false;}
function shoots(){var s=jget('viora_shoots_v1',[]);return (s&&s.length)?s:[];}
function shotOk(){return shoots().some(function(s){return s&&/shot|pub|done|film/i.test(String(s.status||''));});}
function pubOk(){return shoots().some(function(s){return s&&/pub/i.test(String(s.status||''));});}
var META=[
 {ic:'\uD83E\uDDED',t:'Профиль продюсера',d:'4 коротких вопроса — и весь сайт настроится под тебя.',cta:'Пройти опрос',act:"try{window.__v22setTab&&window.__v22setTab('start')}catch(e){};var h=document.getElementById('v22Hub');if(h)h.scrollIntoView({behavior:'smooth',block:'start'})"},
 {ic:'\uD83D\uDD0D',t:'Разбор своего канала',d:'Вставь ссылку — AI покажет, что мешает росту.',cta:'Разобрать канал',act:"try{window.enterYoutube&&window.enterYoutube()}catch(e){}"},
 {ic:'\uD83D\uDDD3',t:'План на 30 дней',d:'Контент-план под твою нишу и цель, по шагам.',cta:'Собрать план',act:"try{window.__v22flowOpen&&window.__v22flowOpen()}catch(e){}"},
 {ic:'\uD83C\uDFAC',t:'Первая съёмка',d:'Отметь первый ролик в «Моих съёмках».',cta:'К съёмкам',act:"try{window.__v22goShoot&&window.__v22goShoot()}catch(e){}"},
 {ic:'\uD83D\uDE80',t:'Первая публикация',d:'Опубликуй ролик — и закрепи привычку расти.',cta:'К съёмкам',act:"try{window.__v22goShoot&&window.__v22goShoot()}catch(e){}"}
];
function sp(n){var a=n%10,b=n%100;if(a===1&&b!==11)return 'шаг';if(a>=2&&a<=4&&(b<10||b>=20))return 'шага';return 'шагов';}
function sig(){return [profileOk(),auditOk(),planOk(),shotOk(),pubOk()].map(function(b){return b?1:0;}).join('');}
function build(){
 var S=[profileOk(),auditOk(),planOk(),shotOk(),pubOk()];
 var done=S.filter(Boolean).length;var pct=Math.round(done/5*100);var cur=S.indexOf(false);
 var head;
 if(done>=5){
  head='<div class="v23m-banner"><div class="e">\uD83C\uDF89</div><div><div class="t">Путь новичка пройден — ты Продюсер!</div><div class="s">Все 5 шагов закрыты. Дальше — ритм: держи стрик, разбирай новые ролики и расти по «Возвращению».</div></div></div>';
 }else{
  var h=done===0?'Твой путь с нуля: 5 шагов до первого ролика':('Осталось '+(5-done)+' '+sp(5-done)+' до звания «Продюсер \uD83C\uDFAC»');
  head='<div class="v23m-top"><div><div class="v23m-k">\uD83E\uDE9C Путь роста</div><div class="v23m-h">'+h+'</div></div><div class="v23m-prog"><div class="v23m-pct">'+done+'/5</div><div class="v23m-bar"><i style="width:'+pct+'%"></i></div></div></div>';
 }
 var steps=META.map(function(m,i){
  var st=S[i];var cls=st?'done':(i===cur?'cur':'lock');
  var node=st?'\u2713':m.ic;
  var right;
  if(st)right='<span class="v23m-badge">Готово</span>';
  else if(i===cur)right='<button class="v23m-cta" onclick="'+m.act+'">'+m.cta+' \u2192</button>';
  else right='<span class="v23m-badge" style="color:#8a85a0">\uD83D\uDD12</span>';
  return '<div class="v23m-step '+cls+'"><div class="v23m-node">'+node+'</div><div class="v23m-txt"><div class="v23m-st">'+m.t+'</div><div class="v23m-sd">'+m.d+'</div></div>'+right+'</div>';
 }).join('');
 return head+'<div class="v23m-steps">'+steps+'</div>';
}
function inject(){
 var hub=D.getElementById('v22Hub');if(!hub)return;
 if(hub.querySelector('#v23mPath'))return;
 var card=D.createElement('section');card.id='v23mPath';card.className='v23m-wrap';card.setAttribute('data-sig',sig());card.innerHTML=build();
 var today=hub.querySelector('.v22-today');
 if(today&&today.parentNode===hub){if(today.nextSibling)hub.insertBefore(card,today.nextSibling);else hub.appendChild(card);}
 else hub.appendChild(card);
}
function refresh(){
 var hub=D.getElementById('v22Hub');if(!hub)return;var card=hub.querySelector('#v23mPath');
 if(!card){inject();return;}
 var s=sig();if(card.getAttribute('data-sig')!==s){card.setAttribute('data-sig',s);card.innerHTML=build();}
}
function watch(){
 var hub=D.getElementById('v22Hub');
 if(!hub){setTimeout(watch,500);return;}
 try{var mo=new MutationObserver(function(){if(!hub.querySelector('#v23mPath'))inject();});mo.observe(hub,{childList:true});}catch(e){}
 inject();setInterval(refresh,2500);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',watch);else watch();
window.__v23m={build:build,inject:inject,sig:sig};
})();
