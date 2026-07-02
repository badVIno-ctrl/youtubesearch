(function(){
'use strict';
if(window.__v28m7)return;window.__v28m7=true;
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
function sim(a,b){var A=toks(a),B=toks(b);if(!A.length||!B.length)return 0;var sb={};B.forEach(function(w){sb[w]=1;});var i=0;A.forEach(function(w){if(sb[w])i++;});return i/(A.length+B.length-i);}
function parseJSON(r){if(r&&typeof r==='object')return r;if(typeof r!=='string')return null;try{return JSON.parse(r);}catch(e){}try{var m=r.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);}catch(e2){}return null;}

/* ============ m7.1 ПРИЧИННАЯ ДИАГНОСТИКА (воронка) ============ */
function diagnose(){
  try{
    var s=S(),all=vids();if(all.length<3)return null;
    var longs=all.filter(function(v){return !v.isShort;});
    var sg=s.signals||{},stages=[];
    var trg=(s.triggerStats||[]).filter(function(t){return t&&t.verdict==='up'&&t.name;}).map(function(t){return String(t.name).toLowerCase();});
    var recent=all.filter(function(v){return num(v.age)>0&&num(v.age)<=90;});
    if(recent.length>=3&&trg.length){
      var withT=recent.filter(function(v){return trg.some(function(tr){return String(v.title).toLowerCase().indexOf(tr)>=0;});}).length;
      var pct=Math.round(withT*100/recent.length);
      stages.push({stage:'Упаковка (заголовок→CTR)',sev:pct<40?(40-pct):0,finding:'только '+pct+'% свежих роликов используют рабочие триггеры ('+trg.slice(0,3).join(', ')+')',fix:'вшивай рабочие триггеры в каждый заголовок'});
    }
    var eng=all.map(function(v){return num(v.engagement);}).filter(function(x){return x>0;});
    if(eng.length){var me=median(eng);stages.push({stage:'Удержание/вовлечение',sev:me<0.02?(0.02-me)*1000:0,finding:'медианная вовлечённость '+(me*100).toFixed(1)+'%'+(sg.durationSweetSpot&&sg.durationSweetSpot.best?(', лучшая длина '+sg.durationSweetSpot.best):''),fix:'держи длину в sweet spot, усиливай первые 30 секунд'});}
    if(sg.uploadMomentum){var d=num(sg.uploadMomentum.deltaPct);stages.push({stage:'Динамика/регулярность',sev:d<0?Math.abs(d):0,finding:'динамика просмотров 90 дн '+(d>=0?'+':'')+d+'%'+(sg.posting&&sg.posting.medianGapDays?(', интервал '+sg.posting.medianGapDays+' дн'):''),fix:'стабилизируй график выпуска'});}
    var rad=lget('viora_v28_radar',null);
    if(rad&&rad.rows&&rad.rows.length&&longs.length){var myMed=median(longs.map(function(v){return num(v.viewsPerDay);}));var nm=median(rad.rows.map(function(r){return num(r.vpd);}));if(nm>0){var ratio=myMed/nm;stages.push({stage:'Охват/распространение',sev:ratio<0.3?(0.3-ratio)*100:0,finding:'твоя медиана '+Math.round(myMed)+'/день против ~'+Math.round(nm)+'/день у растущих в нише',fix:'заходи в темы с доказанным спросом из радара'});}}
    if(!stages.length)return null;
    var main=stages.slice().sort(function(a,b){return b.sev-a.sev;})[0];
    return {stages:stages,main:main};
  }catch(e){return null;}
}
function diagnoseText(){var d=diagnose();if(!d)return '';var L=['ПРИЧИННАЯ ДИАГНОСТИКА ВОРОНКИ:'];d.stages.forEach(function(s){L.push('• '+s.stage+': '+s.finding+(s.sev>0?' ⚠️':' ✓'));});L.push('ГЛАВНАЯ УТЕЧКА: '+d.main.stage+' — '+d.main.finding+'. Что делать: '+d.main.fix+'.');return L.join('\n');}

/* ============ m7.2 ПРОГНОЗ / WHAT-IF ============ */
function forecast(){
  try{
    var h=lget('viora_v28_history',[]);
    if(Array.isArray(h)&&h.length>=2){
      var first=h[0],last=h[h.length-1];var days=Math.max(1,(last.ts-first.ts)/864e5);
      var slope=(num(last.med)-num(first.med))/days;var proj=Math.round(num(last.med)+slope*90);
      return {base:Math.round(num(last.med)),proj90:Math.max(0,proj),slope:Math.round(slope*10)/10,basis:'history',snaps:h.length};
    }
    var all=vids();if(!all.length)return null;var s=S(),sg=s.signals||{};
    var med=median(all.map(function(v){return num(v.viewsPerDay);}));var d=sg.uploadMomentum?num(sg.uploadMomentum.deltaPct):0;
    return {base:Math.round(med),proj90:Math.round(med*(1+d/100)),delta:d,basis:'momentum'};
  }catch(e){return null;}
}
function forecastText(){var f=forecast();if(!f)return '';var L=['ПРОГНОЗ (оценка, не гарантия):'];if(f.basis==='history')L.push('при текущем тренде медиана VPD ~'+f.proj90+'/день через 90 дней (сейчас '+f.base+', наклон '+f.slope+'/день по '+f.snaps+' срезам)');else L.push('ориентир: медиана VPD ~'+f.proj90+'/день через 90 дней при текущей динамике ('+(f.delta>=0?'+':'')+f.delta+'%) — оценка');return L.join('\n');}

/* ============ m7.3 РЕЛЕВАНТНАЯ ВЫБОРКА ============ */
function corpus(){
  var s=S(),items=[];
  vids().forEach(function(v){items.push({t:'ролик',text:v.title,vpd:Math.round(num(v.viewsPerDay))});});
  var ess=lget('viora_v28_essence',null);
  if(ess&&ess.data){(ess.data.videos||[]).forEach(function(v){items.push({t:'суть',text:[v.essence,v.angle,v.audience].filter(Boolean).join(' ')});});var dna=ess.data.dna||{};(dna.angles||[]).forEach(function(a){items.push({t:'угол',text:a});});(dna.wants||[]).forEach(function(a){items.push({t:'запрос аудитории',text:a});});}
  var rad=lget('viora_v28_radar',null);if(rad&&rad.rows)rad.rows.forEach(function(r){items.push({t:'тренд ниши',text:r.title,vpd:r.vpd});});
  (s.competitors||[]).forEach(function(c){((c&&c.vids)||[]).slice(0,2).forEach(function(v){items.push({t:'конкурент',text:v.title,vpd:Math.round(num(v.viewsPerDay))});});});
  return items.filter(function(x){return x.text&&String(x.text).trim();});
}
function retrieve(q,k){
  var items=corpus();if(!items.length)return [];
  var sc=items.map(function(it){return {it:it,s:sim(q,it.text)+(it.vpd?Math.min(0.15,it.vpd/100000):0)};});
  sc.sort(function(a,b){return b.s-a.s;});
  return sc.filter(function(x){return x.s>0;}).slice(0,k||8).map(function(x){return x.it;});
}

/* ============ m7.5 КАЛИБРОВКА ПРЕДИКТОРА ============ */
var CAL_KEY='viora_v29_calib';
function wrapScore(){
  var orig=W.v28ScoreIdea;
  if(typeof orig!=='function'||orig.__v29cal)return;
  var wrapped=function(title,fmt){
    var r=orig.apply(this,arguments);
    try{if(r&&!r.error){var log=lget(CAL_KEY,[]);if(!Array.isArray(log))log=[];log.push({ts:Date.now(),title:String(title||'').slice(0,80),band:r.band,score:r.score});if(log.length>50)log=log.slice(-50);lset(CAL_KEY,log);}}catch(e){}
    return r;
  };
  wrapped.__v29cal=true;W.v28ScoreIdea=wrapped;
}
W.v29Calibration=function(){
  try{
    var log=lget(CAL_KEY,[]);if(!Array.isArray(log)||!log.length)return {n:0,accuracy:null};
    var all=vids();if(all.length<2)return {n:0,accuracy:null,note:'мало данных канала'};
    var med=median(all.map(function(v){return num(v.viewsPerDay);}));var matched=[];
    log.forEach(function(e){var hit=all.filter(function(v){return sim(v.title,e.title)>0.45;})[0];if(hit){var x=med?num(hit.viewsPerDay)/med:0;var actual=x>=1.1?'высокий':(x>=0.7?'средний':'низкий');matched.push({title:e.title,pred:e.band,actual:actual,ok:e.band===actual});}});
    var hits=matched.filter(function(m){return m.ok;}).length;
    return {n:matched.length,accuracy:matched.length?Math.round(hits*100/matched.length):null,sample:matched.slice(0,8)};
  }catch(e){return {n:0,accuracy:null};}
};

/* ============ m7.4 ОРКЕСТРАТОР v29Think + САМОКРИТИКА ============ */
function buildBundle(question){
  var L=[];var diag=diagnose(),fc=forecast(),rel=retrieve(question,8),sug=(typeof W.v29Suggest==='function')?W.v29Suggest():[];
  if(diag)L.push('Диагностика: главная утечка — '+diag.main.stage+': '+diag.main.finding+' ('+diag.main.fix+')');
  if(fc)L.push('Прогноз: база '+fc.base+'/день, оценка через 90 дн ~'+fc.proj90+'/день');
  if(rel.length)L.push('Релевантные факты: '+rel.map(function(r){return r.t+' «'+String(r.text).slice(0,60)+'»'+(r.vpd?(' ('+r.vpd+'/день)'):'');}).join('; '));
  if(sug.length)L.push('Рычаги: '+sug.slice(0,3).map(function(s){return s.text;}).join(' | '));
  return {text:L.join('\n'),diag:diag,fc:fc,rel:rel,sug:sug};
}
function v29Think(question,onStage){
  question=String(question||'').trim();
  function stage(n){try{if(onStage)onStage(n);}catch(e){}}
  return new Promise(function(resolve,reject){
    if(!question)return reject(new Error('Пустой вопрос'));
    var B=buildBundle(question);
    if(typeof W.callMistralRaw!=='function'){
      stage('done');
      return resolve({answer:(B.diag?('Главное — '+B.diag.main.stage+': '+B.diag.main.fix+'.'):'Недостаточно данных канала. Сначала разбери канал.'),steps:B.text.split('\n'),actions:(B.sug||[]).slice(0,3).map(function(s){return {action:s.text,why:s.why,evidence:''};}),confidence:'низкая',trace:B.text,diagnosis:B.diag,forecast:B.fc,local:true});
    }
    stage('draft');
    var dsys='Ты — Виора, продюсер-аналитик YouTube. Ответь на вопрос автора, опираясь СТРОГО на факты ниже и доказательную базу. Рассуждай по шагам, без воды. Верни СТРОГО валидный JSON: {"steps":["краткие шаги рассуждения"],"answer":"главный вывод, 2-4 предложения","actions":[{"action":"конкретное действие с готовой формулировкой","why":"механизм, почему сработает","evidence":"цифра или ролик из фактов"}],"confidence":"высокая|средняя|низкая"}. 3-5 actions по убыванию важности. Числа — только из фактов.';
    var duser=question+'\n\nФАКТЫ КАНАЛА:\n'+B.text;
    Promise.resolve(W.callMistralRaw(dsys,duser,2000)).then(function(draftRaw){
      var draft=parseJSON(draftRaw)||{answer:String(draftRaw||'').slice(0,600),steps:[],actions:[],confidence:'низкая'};
      stage('critic');
      var csys='Ты — придирчивый редактор-аналитик. Проверь черновик против ФАКТОВ: выдуманные числа/ролики, общие фразы, нелогичности — найди и исправь. Верни СТРОГО валидный JSON: {"issues":["что было не так"],"revised":{"steps":[],"answer":"","actions":[{"action":"","why":"","evidence":""}],"confidence":"высокая|средняя|низкая"}}. Если всё ок — issues:[] и revised повторяет черновик. Не добавляй данных сверх ФАКТОВ.';
      var cuser='Виора знает контекст. ЧЕРНОВИК:\n'+JSON.stringify(draft)+'\n\nФАКТЫ:\n'+B.text;
      Promise.resolve(W.callMistralRaw(csys,cuser,2000)).then(function(critRaw){
        var crit=parseJSON(critRaw);
        var fin=(crit&&crit.revised&&(crit.revised.answer||(crit.revised.actions&&crit.revised.actions.length)))?crit.revised:draft;
        stage('done');
        resolve({answer:fin.answer||'',steps:fin.steps||[],actions:fin.actions||[],confidence:fin.confidence||'средняя',issues:(crit&&crit.issues)||[],trace:B.text,diagnosis:B.diag,forecast:B.fc});
      }).catch(function(){stage('done');resolve({answer:draft.answer||'',steps:draft.steps||[],actions:draft.actions||[],confidence:draft.confidence||'средняя',issues:[],trace:B.text,diagnosis:B.diag,forecast:B.fc});});
    }).catch(function(e){reject(e);});
  });
}
W.v29Think=v29Think;
W.__v28m7api={diagnose:diagnose,diagnoseText:diagnoseText,forecast:forecast,forecastText:forecastText,retrieve:retrieve,think:v29Think,calibration:W.v29Calibration};

/* ============ ИНЪЕКЦИЯ В CTX (диагностика + прогноз) ============ */
function enhanceCtxM7(){
  var orig=W.v26ctx;if(typeof orig!=='function'||orig.__v28m7ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    var add=[];
    try{if(S().channel){var dt=diagnoseText();if(dt)add.push(dt);var ft=forecastText();if(ft)add.push(ft);}}catch(e){}
    try{if(add.length)return base?(base+'\n\n'+add.join('\n\n')):add.join('\n\n');}catch(e){}
    return base;
  };
  wrapped.__v28m7ctx=true;W.v26ctx=wrapped;
}

/* ============ m7.6 UI-КОНСОЛЬ ============ */
var CHIPS=['Почему канал не растёт?','Что снять следующим?','Как поднять CTR заголовков?','Разбери мою воронку роста'];
function ensureLab(){
  var el=D.getElementById('v29lab');if(el)return el;
  el=D.createElement('div');el.id='v29lab';
  el.innerHTML='<div class="v29-card"><div class="v29-h"><div class="ic">🧠</div><div class="tt">Виора-Аналитик<small>глубокий разбор: диагностика, прогноз, план — на твоих данных</small></div><button class="x" onclick="v29LabClose()">×</button></div>'+
    '<div class="v29-body"><div class="v29-ask"><input id="v29q" placeholder="Спроси о канале: почему не растёт, что снять, как поднять CTR…"><button class="v29-go" id="v29run">Разобрать</button></div>'+
    '<div class="v29-chips" id="v29chips"></div><div class="v29-out" id="v29out"></div></div></div>';
  el.addEventListener('click',function(e){if(e.target===el)hideLab();});
  D.body.appendChild(el);
  var chips=el.querySelector('#v29chips');CHIPS.forEach(function(c){var b=D.createElement('button');b.className='v29-chip';b.textContent=c;b.addEventListener('click',function(){var inp=D.getElementById('v29q');if(inp){inp.value=c;run();}});chips.appendChild(b);});
  el.querySelector('#v29run').addEventListener('click',run);
  el.querySelector('#v29q').addEventListener('keydown',function(e){if(e.key==='Enter')run();});
  return el;
}
function showLab(){var el=ensureLab();el.classList.add('on');try{D.body.style.overflow='hidden';}catch(e){}var inp=D.getElementById('v29q');if(inp)setTimeout(function(){try{inp.focus();}catch(e){}},60);}
function hideLab(){var el=D.getElementById('v29lab');if(el)el.classList.remove('on');try{D.body.style.overflow='';}catch(e){}}
W.v29LabOpen=showLab;W.v29LabClose=hideLab;
function stagesHTML(cur){
  var st=[['draft','Думаю и собираю доказательства'],['critic','Самопроверка и критика'],['done','Готово']];
  var idx={draft:0,critic:1,done:2}[cur];if(idx==null)idx=0;
  return st.map(function(s,i){var cls=i<idx?'done':(i===idx?'cur':'');return '<div class="v29-stage '+cls+'"><span class="dot"></span>'+esc(s[1])+'</div>';}).join('');
}
function run(){
  var inp=D.getElementById('v29q'),btn=D.getElementById('v29run'),out=D.getElementById('v29out');
  if(!inp||!out)return;var q=inp.value.trim();if(!q){inp.focus();return;}
  if(btn){btn.disabled=true;}
  var stageNow='draft';
  function paintStages(){out.innerHTML='<div class="v29-block">'+stagesHTML(stageNow)+'</div>';}
  paintStages();
  v29Think(q,function(s){stageNow=s;if(s!=='done')paintStages();}).then(function(r){
    if(btn)btn.disabled=false;
    render(out,r);
  }).catch(function(e){if(btn)btn.disabled=false;out.innerHTML='<div class="v29-err">Не удалось разобрать: '+esc(e&&e.message||'ошибка')+'. Попробуй ещё раз.</div>';});
}
function render(out,r){
  var cc=(r.confidence||'').toLowerCase();var ccls=cc.indexOf('выс')>=0?'h':(cc.indexOf('низ')>=0?'l':'m');
  var h='';
  h+='<div class="v29-block"><h4>Вывод<span class="v29-conf '+ccls+'">уверенность: '+esc(r.confidence||'средняя')+'</span></h4><div class="v29-answer">'+esc(r.answer||'—')+'</div></div>';
  if(r.actions&&r.actions.length){h+='<div class="v29-block"><h4>План действий</h4>'+r.actions.slice(0,6).map(function(a,i){return '<div class="v29-act"><span class="n">'+(i+1)+'</span><span class="txt">'+esc(a.action||'')+'<span class="why">'+esc([a.why,a.evidence].filter(Boolean).join(' · '))+'</span></span></div>';}).join('')+'</div>';}
  if(r.diagnosis&&r.diagnosis.main){h+='<div class="v29-block"><h4>Диагностика воронки</h4><div class="v29-answer" style="font-size:13.5px">Главная утечка: <b>'+esc(r.diagnosis.main.stage)+'</b> — '+esc(r.diagnosis.main.finding)+'.</div></div>';}
  if(r.forecast){var f=r.forecast;h+='<div class="v29-block"><h4>Прогноз <span class="v29-conf m">оценка</span></h4><div class="v29-answer" style="font-size:13.5px">Медиана VPD ~'+esc(f.proj90)+'/день через 90 дней (сейчас '+esc(f.base)+').</div></div>';}
  if(r.issues&&r.issues.length){h+='<div class="v29-block"><h4>Что поправила самокритика</h4><div class="tw" style="font-size:12.5px;color:#b8b2c4">'+r.issues.slice(0,5).map(function(x){return '• '+esc(x);}).join('<br>')+'</div></div>';}
  if(r.trace){h+='<details class="v29-trace"><summary>Трасса: на каких данных построено</summary><div class="tw">'+esc(r.trace)+'</div></details>';}
  if(r.local){h+='<div class="v29-err" style="color:#ffce7a">AI офлайн — показан локальный разбор без модели.</div>';}
  out.innerHTML=h;
}
function injectButton(){
  try{
    var bar=D.getElementById('v26m3launch');
    if(bar&&!D.getElementById('v29labBtn')){var b=D.createElement('button');b.className='v29lab-btn';b.id='v29labBtn';b.type='button';b.innerHTML='<span class="ic">🧠</span>Аналитик';b.addEventListener('click',showLab);bar.appendChild(b);}
  }catch(e){}
}

function tick(){try{enhanceCtxM7();}catch(e){}try{wrapScore();}catch(e){}try{injectButton();}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,1000);setTimeout(boot,2500);setTimeout(boot,4500);
setInterval(tick,3000);
D.addEventListener('keydown',function(e){if(e.key==='Escape'){var el=D.getElementById('v29lab');if(el&&el.classList.contains('on'))hideLab();}});
})();
