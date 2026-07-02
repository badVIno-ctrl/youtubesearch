(function(){
'use strict';
if(window.__v28m8)return;window.__v28m8=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function num(x){x=+x;return isFinite(x)?x:0;}
function median(a){a=(a||[]).filter(function(x){return isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function vids(){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v&&v.title;});}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function norm(s){return String(s||'').toLowerCase().replace(/[^\wа-яё\s]/gi,' ').replace(/\s+/g,' ').trim();}
function toks(s){return norm(s).split(' ').filter(function(w){return w.length>2;});}
function lex(a,b){var A=toks(a),B=toks(b);if(!A.length||!B.length)return 0;var sb={};B.forEach(function(w){sb[w]=1;});var i=0;A.forEach(function(w){if(sb[w])i++;});return i/(A.length+B.length-i);}
function parseJSON(r){if(r&&typeof r==='object')return r;if(typeof r!=='string')return null;try{return JSON.parse(r);}catch(e){}try{var m=r.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);}catch(e2){}return null;}
function hashStr(s){s=String(s);var h=5381,i=s.length;while(i)h=(h*33)^s.charCodeAt(--i);return (h>>>0).toString(36);}

/* ============ m8.1 СЕМАНТИЧЕСКОЕ ЯДРО (эмбеддинги) ============ */
var EMB_KEY='viora_v29_emb',_embMem={};
function mkey(){try{return (typeof MISTRAL_API_KEY!=='undefined'&&MISTRAL_API_KEY)?MISTRAL_API_KEY:(W.MISTRAL_API_KEY||'');}catch(e){return W.MISTRAL_API_KEY||'';}}
function embCache(){var c=lget(EMB_KEY,{});return c&&typeof c==='object'?c:{};}
function embGet(h){if(_embMem[h])return _embMem[h];var c=embCache();if(c[h]){_embMem[h]=c[h];return c[h];}return null;}
function embPut(map){try{var c=embCache();for(var h in map){var v=map[h];_embMem[h]=v;c[h]=(v&&v.map)?v.map(function(x){return Math.round(x*1e4)/1e4;}):v;}var ks=Object.keys(c);if(ks.length>90){ks.slice(0,ks.length-90).forEach(function(k){delete c[k];});}lset(EMB_KEY,c);}catch(e){}}
function v29Embed(texts){
  texts=(texts||[]).map(function(t){return String(t||'').slice(0,400);}).filter(Boolean);
  var uniq=[],seen={};texts.forEach(function(t){var h=hashStr(t);if(!seen[h]){seen[h]=1;uniq.push({t:t,h:h});}});
  var miss=uniq.filter(function(u){return !embGet(u.h);});
  function result(){var out={};uniq.forEach(function(u){out[u.h]=embGet(u.h);});return texts.map(function(t){return out[hashStr(t)]||null;});}
  if(!miss.length)return Promise.resolve(result());
  var key=mkey();if(!key||typeof fetch!=='function')return Promise.resolve(texts.map(function(){return null;}));
  return fetch('https://api.mistral.ai/v1/embeddings',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify({model:'mistral-embed',input:miss.map(function(m){return m.t;})})}).then(function(r){return r.ok?r.json():null;}).then(function(j){
    var data=(j&&j.data)||[];var map={};data.forEach(function(d,i){if(d&&d.embedding&&miss[i])map[miss[i].h]=d.embedding;});embPut(map);return result();
  }).catch(function(){return texts.map(function(){return null;});});
}
W.v29Embed=v29Embed;
function cosine(a,b){if(!a||!b||!a.length||a.length!==b.length)return 0;var d=0,na=0,nb=0;for(var i=0;i<a.length;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}if(!na||!nb)return 0;return d/(Math.sqrt(na)*Math.sqrt(nb));}
function semsim(va,vb,ta,tb){if(va&&vb)return cosine(va,vb);return lex(ta,tb);}

/* ============ m8.2 КАРТА РЫНКА / WHITESPACE ============ */
function v29Whitespace(){
  return new Promise(function(resolve){
    try{
      var s=S();
      var demand=[];
      var r1=lget('viora_v28_radar',null);if(r1&&r1.rows)r1.rows.forEach(function(x){demand.push({title:x.title,vpd:num(x.vpd)});});
      var r2=lget('viora_v29_radar2',null);if(r2&&r2.rows)r2.rows.forEach(function(x){demand.push({title:x.title,vpd:num(x.vpd)});});
      var seen={};demand=demand.filter(function(x){var h=norm(x.title);if(!h||seen[h])return false;seen[h]=1;return true;});
      var supply=[];vids().forEach(function(v){supply.push(v.title);});(s.competitors||[]).forEach(function(c){((c&&c.vids)||[]).slice(0,4).forEach(function(v){supply.push(v.title);});});
      if(!demand.length||!supply.length)return resolve({ok:false,reason:'мало данных (нужны радар ниши и ролики)'});
      var allTexts=demand.map(function(d){return d.title;}).concat(supply);
      v29Embed(allTexts).then(function(vecs){
        var dv=demand.map(function(_,i){return vecs[i];});
        var sv=supply.map(function(_,i){return vecs[demand.length+i];});
        var gaps=demand.map(function(d,i){
          var best=0;for(var j=0;j<supply.length;j++){var sm=semsim(dv[i],sv[j],d.title,supply[j]);if(sm>best)best=sm;}
          return {title:d.title,vpd:d.vpd,coverage:+best.toFixed(2)};
        });
        gaps=gaps.filter(function(g){return g.coverage<0.62;}).sort(function(a,b){return (b.vpd*(1-b.coverage))-(a.vpd*(1-a.coverage));}).slice(0,6);
        resolve({ok:true,semantic:!!(vecs[0]),gaps:gaps});
      });
    }catch(e){resolve({ok:false,reason:'ошибка'});}
  });
}
W.v29Whitespace=v29Whitespace;
var _wsCache=null;
function whitespaceText(){try{if(!_wsCache||!_wsCache.ok||!_wsCache.gaps||!_wsCache.gaps.length)return '';return 'КАРТА РЫНКА — НЕЗАНЯТЫЕ ПОЛЯНЫ (спрос есть, контента мало; покрытие = насколько уже закрыто тобой/конкурентами):\n'+_wsCache.gaps.map(function(g){return '• «'+g.title+'» ('+g.vpd+'/день в нише, покрытие '+Math.round(g.coverage*100)+'%) — слабо закрыто, заходи.';}).join('\n');}catch(e){return '';}}
function refreshWhitespace(){try{v29Whitespace().then(function(r){_wsCache=r;}).catch(function(){});}catch(e){}}

/* ============ m8.3 A/B-ОПТИМИЗАТОР ЗАГОЛОВКОВ ============ */
function v29ABTitles(idea){
  idea=String(idea||'').trim();
  return new Promise(function(resolve,reject){
    if(!idea)return reject(new Error('Введите идею ролика'));
    if(typeof W.callMistralRaw!=='function')return reject(new Error('AI недоступно'));
    var sys='Ты — продюсер YouTube. Для идеи ролика придумай 6 РАЗНЫХ цепляющих заголовков (разные углы: интрига, цифра, боль, результат, спор, как-то) и к каждому короткий концепт обложки. Под нишу автора. Верни СТРОГО валидный JSON: {"variants":[{"title":"","thumb":"что на обложке, 3-6 слов"}]}. По-русски, без воды.';
    Promise.resolve(W.callMistralRaw(sys,'Идея: '+idea,1400)).then(function(r){
      var d=parseJSON(r);var vs=(d&&d.variants)||[];
      if(!vs.length)return reject(new Error('пусто'));
      var scored=vs.slice(0,7).map(function(v){var sc=(typeof W.v28ScoreIdea==='function')?W.v28ScoreIdea(v.title):{score:0,band:'?',reasons:[],fixes:[]};return {title:v.title,thumb:v.thumb||'',score:sc.score,band:sc.band,reasons:sc.reasons||[],fixes:sc.fixes||[]};});
      scored.sort(function(a,b){return num(b.score)-num(a.score);});
      resolve(scored);
    }).catch(function(e){reject(e);});
  });
}
W.v29ABTitles=v29ABTitles;

/* ============ m8.4 СЦЕНАРИСТ ============ */
function v29Script(idea){
  idea=String(idea||'').trim();
  return new Promise(function(resolve,reject){
    if(!idea)return reject(new Error('Введите тему ролика'));
    if(typeof W.callMistralRaw!=='function')return reject(new Error('AI недоступно'));
    var sys='Ты — продюсер-сценарист YouTube. Собери сценарий под идею, опираясь на выигрышные углы и крючки канала. Верни СТРОГО валидный JSON: {"hooks":["3 варианта хука — что дословно сказать в первые 15 секунд"],"beats":[{"t":"тайминг","what":"что говорить/показывать","retention":"приём удержания"}],"outro":"финал и CTA"}. 6-9 битов, конкретно, по-русски, без воды.';
    Promise.resolve(W.callMistralRaw(sys,'Тема: '+idea,2200)).then(function(r){
      var d=parseJSON(r);if(!d||(!d.hooks&&!d.beats))return reject(new Error('пусто'));
      resolve(d);
    }).catch(function(e){reject(e);});
  });
}
W.v29Script=v29Script;

/* ============ m8.5 ТРЕНДЫ + АВТО-ДАЙДЖЕСТ ============ */
var TREND_KEY='viora_v28_trendhist';
function pushTrend(){
  try{
    var r2=lget('viora_v29_radar2',null);if(!r2||!r2.rows||!r2.rows.length)return;
    var h=lget(TREND_KEY,[]);if(!Array.isArray(h))h=[];
    var last=h[h.length-1];
    if(last&&(Date.now()-last.ts<5*864e5))return;
    h.push({ts:Date.now(),niche:r2.niche,rows:r2.rows.map(function(x){return {title:x.title,vpd:num(x.vpd)};})});
    if(h.length>8)h=h.slice(-8);lset(TREND_KEY,h);
  }catch(e){}
}
function v29Trends(){
  try{
    var h=lget(TREND_KEY,[]);if(!Array.isArray(h)||h.length<2)return {ok:false,reason:'нужно ≥2 недельных среза (накопится со временем)'};
    var prev=h[h.length-2],cur=h[h.length-1],rising=[],falling=[],fresh=[];
    cur.rows.forEach(function(c){var p=prev.rows.filter(function(x){return lex(x.title,c.title)>0.5;})[0];if(p){var d=p.vpd?Math.round((c.vpd-p.vpd)*100/p.vpd):0;if(d>=20)rising.push({title:c.title,delta:d,vpd:c.vpd});else if(d<=-20)falling.push({title:c.title,delta:d,vpd:c.vpd});}else fresh.push({title:c.title,vpd:c.vpd});});
    rising.sort(function(a,b){return b.delta-a.delta;});
    return {ok:true,rising:rising.slice(0,5),falling:falling.slice(0,5),fresh:fresh.slice(0,5)};
  }catch(e){return {ok:false};}
}
W.v29Trends=v29Trends;
function trendsText(){var t=v29Trends();if(!t.ok)return '';var L=['ТРЕНДЫ НИШИ ВО ВРЕМЕНИ:'];if(t.rising.length)L.push('Разгоняются: '+t.rising.map(function(x){return '«'+x.title+'» (+'+x.delta+'%)';}).join('; ')+' — заходи сейчас.');if(t.falling.length)L.push('Остывают: '+t.falling.map(function(x){return '«'+x.title+'» ('+x.delta+'%)';}).join('; ')+'.');if(t.fresh.length)L.push('Новое в нише: '+t.fresh.map(function(x){return '«'+x.title+'»';}).join('; ')+'.');return L.join('\n');}

function v29Digest(){
  try{
    var h=lget('viora_v28_history',[]);if(!Array.isArray(h)||h.length<2)return {ok:false,reason:'нужно ≥2 разбора канала'};
    var prev=null,cur=h[h.length-1];
    for(var i=h.length-2;i>=0;i--){if(h[i].ids.join(',')!==cur.ids.join(',')){prev=h[i];break;}}
    if(!prev)return {ok:false,reason:'нет изменений с прошлого разбора'};
    var prevIds={};prev.ids.forEach(function(id){prevIds[id]=1;});
    var news=(cur.items||[]).filter(function(it){return !prevIds[it.id];});
    var medDelta=prev.med?Math.round((cur.med-prev.med)*100/prev.med):0;
    var sug=(typeof W.v29Suggest==='function')?W.v29Suggest():[];
    return {ok:true,newCount:news.length,medNow:cur.med,medDelta:medDelta,topNew:news.sort(function(a,b){return b.vpd-a.vpd;}).slice(0,3),steps:sug.slice(0,3).map(function(s){return s.text;})};
  }catch(e){return {ok:false};}
}
W.v29Digest=v29Digest;
function digestText(){var d=v29Digest();if(!d.ok)return '';var L=['АВТО-ДАЙДЖЕСТ (что изменилось с прошлого разбора):'];L.push('Медиана VPD '+(d.medDelta>=0?'+':'')+d.medDelta+'% (сейчас '+d.medNow+'), новых роликов: '+d.newCount+'.');if(d.topNew&&d.topNew.length)L.push('Заметные новые: '+d.topNew.map(function(x){return '«'+x.title+'» ('+x.vpd+'/день)';}).join('; ')+'.');if(d.steps&&d.steps.length)L.push('Шаги на неделю: '+d.steps.join(' | ')+'.');return L.join('\n');}

/* ============ ИНЪЕКЦИЯ В CTX ============ */
function enhanceCtxM8(){
  var orig=W.v26ctx;if(typeof orig!=='function'||orig.__v28m8ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    var add=[];
    try{if(S().channel){var ws=whitespaceText();if(ws)add.push(ws);var tr=trendsText();if(tr)add.push(tr);var dg=digestText();if(dg)add.push(dg);}}catch(e){}
    try{if(add.length)return base?(base+'\n\n'+add.join('\n\n')):add.join('\n\n');}catch(e){}
    return base;
  };
  wrapped.__v28m8ctx=true;W.v26ctx=wrapped;
}

/* ============ m8.6 UI «СТУДИЯ РОСТА» ============ */
var TABS=[['market','🗺 Карта рынка'],['titles','🅰️ A/B заголовки'],['script','🎬 Сценарий'],['trends','📈 Тренды']];
function ensureStudio(){
  var el=D.getElementById('v29studio');if(el)return el;
  el=D.createElement('div');el.id='v29studio';
  el.innerHTML='<div class="v29s-card"><div class="v29-h"><div class="ic">🚀</div><div class="tt">Студия роста<small>рынок, заголовки, сценарий, тренды — на твоих данных</small></div><button class="x" onclick="v29StudioClose()">×</button></div>'+
    '<div class="v29s-tabs">'+TABS.map(function(t,i){return '<button class="v29s-tab'+(i===0?' on':'')+'" data-t="'+t[0]+'">'+esc(t[1])+'</button>';}).join('')+'</div>'+
    '<div class="v29-body" id="v29sbody"></div></div>';
  el.addEventListener('click',function(e){if(e.target===el)hideStudio();});
  D.body.appendChild(el);
  el.querySelectorAll('.v29s-tab').forEach(function(b){b.addEventListener('click',function(){el.querySelectorAll('.v29s-tab').forEach(function(x){x.classList.remove('on');});b.classList.add('on');renderTab(b.getAttribute('data-t'));});});
  return el;
}
function showStudio(){var el=ensureStudio();el.classList.add('on');try{D.body.style.overflow='hidden';}catch(e){}renderTab('market');}
function hideStudio(){var el=D.getElementById('v29studio');if(el)el.classList.remove('on');try{D.body.style.overflow='';}catch(e){}}
W.v29StudioOpen=showStudio;W.v29StudioClose=hideStudio;
function body(){return D.getElementById('v29sbody');}
function spin(msg){var b=body();if(b)b.innerHTML='<div class="v29-block"><span class="v29-spin"></span>'+esc(msg||'Виора думает…')+'</div>';}
function renderTab(t){
  var b=body();if(!b)return;
  if(t==='market')return renderMarket(b);
  if(t==='titles')return renderTitles(b);
  if(t==='script')return renderScript(b);
  if(t==='trends')return renderTrends(b);
}
function renderMarket(b){
  b.innerHTML='<div class="v29-block"><div class="v29-answer" style="font-size:13.5px">Где в нише есть спрос, но мало контента — твои незанятые поляны.</div><button class="v29-go" id="v29wsGo" style="margin-top:10px">Построить карту рынка</button></div><div id="v29wsOut"></div>';
  b.querySelector('#v29wsGo').addEventListener('click',function(){var o=b.querySelector('#v29wsOut');o.innerHTML='<div class="v29-block"><span class="v29-spin"></span>Считаю спрос против предложения…</div>';v29Whitespace().then(function(r){_wsCache=r;if(!r.ok)return o.innerHTML='<div class="v29-err">'+esc(r.reason||'не удалось')+'</div>';if(!r.gaps.length)return o.innerHTML='<div class="v29-block">Явных дыр не нашёл — ниша плотно закрыта. Дифференцируйся углом подачи.</div>';o.innerHTML='<div class="v29-block"><h4>Незанятые поляны'+(r.semantic?' (семантика)':' (лексика)')+'</h4>'+r.gaps.map(function(g){return '<div class="v29-act"><span class="n">'+g.vpd+'</span><span class="txt">«'+esc(g.title)+'»<span class="why">покрытие '+Math.round(g.coverage*100)+'% — слабо закрыто, есть место зайти</span></span></div>';}).join('')+'</div>';}).catch(function(){o.innerHTML='<div class="v29-err">Ошибка построения карты.</div>';});});
}
function renderTitles(b){
  b.innerHTML='<div class="v29-ask"><input id="v29abq" placeholder="Идея ролика, например: 5 ошибок новичка в монтаже"><button class="v29-go" id="v29abGo">Сгенерить и оценить</button></div><div id="v29abOut" style="margin-top:14px"></div>';
  function go(){var q=b.querySelector('#v29abq').value.trim(),o=b.querySelector('#v29abOut');if(!q)return;o.innerHTML='<div class="v29-block"><span class="v29-spin"></span>Генерю варианты и оцениваю предиктором…</div>';v29ABTitles(q).then(function(list){o.innerHTML='<div class="v29-block"><h4>Варианты по силе</h4>'+list.map(function(v){var cls=v.score>=70?'h':(v.score>=45?'m':'l');return '<div class="v29-act"><span class="n">'+v.score+'</span><span class="txt"><b>'+esc(v.title)+'</b> <span class="v29-conf '+cls+'">'+esc(v.band)+'</span><span class="why">🖼 '+esc(v.thumb)+(v.fixes&&v.fixes.length?(' · ⚠️ '+esc(v.fixes[0])):'')+'</span></span></div>';}).join('')+'</div>';}).catch(function(e){o.innerHTML='<div class="v29-err">'+esc(e&&e.message||'ошибка')+'</div>';});}
  b.querySelector('#v29abGo').addEventListener('click',go);b.querySelector('#v29abq').addEventListener('keydown',function(e){if(e.key==='Enter')go();});
}
function renderScript(b){
  b.innerHTML='<div class="v29-ask"><input id="v29scq" placeholder="Тема ролика для сценария"><button class="v29-go" id="v29scGo">Собрать сценарий</button></div><div id="v29scOut" style="margin-top:14px"></div>';
  function go(){var q=b.querySelector('#v29scq').value.trim(),o=b.querySelector('#v29scOut');if(!q)return;o.innerHTML='<div class="v29-block"><span class="v29-spin"></span>Собираю хуки и раскадровку…</div>';v29Script(q).then(function(d){var h='';if(d.hooks&&d.hooks.length)h+='<div class="v29-block"><h4>Варианты хука (первые 15 сек)</h4>'+d.hooks.map(function(x,i){return '<div class="v29-act"><span class="n">'+(i+1)+'</span><span class="txt">'+esc(x)+'</span></div>';}).join('')+'</div>';if(d.beats&&d.beats.length)h+='<div class="v29-block"><h4>Раскадровка</h4>'+d.beats.map(function(bt){return '<div class="v29-act"><span class="n">'+esc(bt.t||'·')+'</span><span class="txt">'+esc(bt.what||'')+'<span class="why">🎯 '+esc(bt.retention||'')+'</span></span></div>';}).join('')+'</div>';if(d.outro)h+='<div class="v29-block"><h4>Финал</h4><div class="v29-answer" style="font-size:13.5px">'+esc(d.outro)+'</div></div>';o.innerHTML=h||'<div class="v29-err">Пусто.</div>';}).catch(function(e){o.innerHTML='<div class="v29-err">'+esc(e&&e.message||'ошибка')+'</div>';});}
  b.querySelector('#v29scGo').addEventListener('click',go);b.querySelector('#v29scq').addEventListener('keydown',function(e){if(e.key==='Enter')go();});
}
function renderTrends(b){
  var t=v29Trends();var dg=v29Digest();var h='';
  if(dg.ok){h+='<div class="v29-block"><h4>Дайджест: что изменилось</h4><div class="v29-answer" style="font-size:13.5px">Медиана VPD '+(dg.medDelta>=0?'+':'')+dg.medDelta+'% (сейчас '+dg.medNow+'), новых роликов '+dg.newCount+'.</div>'+(dg.steps&&dg.steps.length?('<div style="margin-top:8px">'+dg.steps.map(function(s,i){return '<div class="v29-act"><span class="n">'+(i+1)+'</span><span class="txt">'+esc(s)+'</span></div>';}).join('')+'</div>'):'')+'</div>';}
  if(t.ok){h+='<div class="v29-block"><h4>Тренды ниши во времени</h4>'+(t.rising.length?('<div class="v29-answer" style="font-size:13.5px;color:#7be0a0">▲ Разгоняются: '+t.rising.map(function(x){return esc(x.title)+' (+'+x.delta+'%)';}).join('; ')+'</div>'):'')+(t.falling.length?('<div class="v29-answer" style="font-size:13.5px;color:#ff9d9d;margin-top:6px">▼ Остывают: '+t.falling.map(function(x){return esc(x.title)+' ('+x.delta+'%)';}).join('; ')+'</div>'):'')+(t.fresh.length?('<div class="v29-answer" style="font-size:13.5px;margin-top:6px">✦ Новое: '+t.fresh.map(function(x){return esc(x.title);}).join('; ')+'</div>'):'')+'</div>';}
  if(!h)h='<div class="v29-block">Тренды и дайджест накопятся после нескольких разборов канала и обновлений радара. Загляни позже.</div>';
  b.innerHTML=h;
}
function injectButton(){
  try{var bar=D.getElementById('v26m3launch');if(bar&&!D.getElementById('v29studioBtn')){var b=D.createElement('button');b.className='v29lab-btn';b.id='v29studioBtn';b.type='button';b.innerHTML='<span class="ic">🚀</span>Студия роста';b.addEventListener('click',showStudio);bar.appendChild(b);}}catch(e){}
}

function tick(){try{enhanceCtxM8();}catch(e){}try{injectButton();}catch(e){}try{pushTrend();}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,1200);setTimeout(boot,2800);setTimeout(function(){try{refreshWhitespace();}catch(e){}},5000);
setInterval(tick,4000);setInterval(refreshWhitespace,6*3600*1000);
D.addEventListener('keydown',function(e){if(e.key==='Escape'){var el=D.getElementById('v29studio');if(el&&el.classList.contains('on'))hideStudio();}});
W.__v28m8api={embed:v29Embed,whitespace:v29Whitespace,abTitles:v29ABTitles,script:v29Script,trends:v29Trends,digest:v29Digest,cosine:cosine};
})();
