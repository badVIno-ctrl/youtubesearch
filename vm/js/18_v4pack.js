/* ============================================================ */
/* V4 PACK — Pack 4: preview lab, title arena, video x-ray,     */
/* trend radar, progress+gamification, scriptwriter studio,     */
/* editor AI agent, design polish                               */
/* ============================================================ */
(function(){
'use strict';
if(window.__V4)return; window.__V4=true;
var D=document, W=window;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function lget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function toast(m,k,ms){try{if(typeof W.vToast==='function'){W.vToast(m,k||'ok',ms||2600);return;}}catch(e){}try{if(typeof W.toast==='function')W.toast(m);}catch(e){}}
function v4fmt(n){n=Number(n)||0;if(n>=1e6)return (n/1e6).toFixed(n>=1e7?0:1)+'M';if(n>=1e3)return (n/1e3).toFixed(n>=1e4?0:1)+'K';return String(Math.round(n));}
function jget(t){try{if(typeof t==='object')return t;return JSON.parse(t);}catch(e){}try{if(W.__VP&&W.__VP.jsonFrom)return W.__VP.jsonFrom(t);}catch(e){}return null;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function median(a){if(!a||!a.length)return 0;var s=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}
function relAge(iso){var d=Math.max(1,Math.round((Date.now()-new Date(iso))/864e5));if(d<7)return d+' дн. назад';if(d<30)return Math.round(d/7)+' нед. назад';if(d<365)return Math.round(d/30)+' мес. назад';return Math.round(d/365)+' г. назад';}
function skel(n,big){var h='<div class="v4-skel">';for(var i=0;i<(n||4);i++){h+='<i class="'+(big&&i%2?'h60':'')+(i%3===2?' w50':'')+'"></i>';}return h+'</div>';}
function ring(score,size,id){var col=score>=70?'#7ee0a2':score>=45?'#ffcf7a':'#ff8da1';return '<div class="v4-ring" style="background:conic-gradient('+col+' '+(clamp(score,0,100)*3.6)+'deg,rgba(255,255,255,.08) 0)'+(size?';width:'+size+'px;height:'+size+'px;flex-basis:'+size+'px':'')+'"><b style="color:'+col+'"'+(id?' id="'+id+'"':'')+'>'+Math.round(score)+'</b><small>из 100</small></div>';}
function countUpEl(el,target,suf){if(!el)return;var t0=null,from=0;target=+target||0;function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/700);var v=Math.round(from+(target-from)*(1-Math.pow(1-p,3)));el.textContent=v+(suf||'');if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
function v4Confetti(){try{var c=D.createElement('canvas');c.style.cssText='position:fixed;inset:0;z-index:15000;pointer-events:none';D.body.appendChild(c);var x=c.getContext('2d'),WW=c.width=innerWidth,HH=c.height=innerHeight;var cols=['#ff2d55','#ff5470','#ffb020','#ffffff','#8b5cf6','#36e07a'],P=[];for(var i=0;i<150;i++)P.push({x:WW/2+(Math.random()-.5)*160,y:HH*0.3,vx:(Math.random()-.5)*12,vy:Math.random()*-13-4,g:.33,r:4+Math.random()*5,c:cols[i%cols.length],rot:Math.random()*6,vr:(Math.random()-.5)*.4});var t0=performance.now();(function fr(t){var el=t-t0;x.clearRect(0,0,WW,HH);var alive=false;P.forEach(function(p){p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;if(p.y<HH+40)alive=true;x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.globalAlpha=Math.max(0,1-el/2500);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.6);x.restore();});if(el<2500&&alive)requestAnimationFrame(fr);else c.remove();})(t0);}catch(e){}}
W.__v4Confetti=v4Confetti;

/* ---- AI helpers ---- */
function aiJson(sys,user,max){if(typeof W.callMistralRaw==='function')return W.callMistralRaw(sys,user,max||1800);return Promise.reject(new Error('AI недоступна'));}
function aiTxt(sys,user,max){try{if(W.__VP&&W.__VP.aiText)return Promise.resolve(W.__VP.aiText(sys,user,max||900));}catch(e){}return Promise.reject(new Error('AI недоступна'));}
var VISION_MODELS=['pixtral-large-latest','pixtral-12b-2409'];
async function aiVision(prompt,images,max){
  var content=[{type:'text',text:prompt}];
  (images||[]).forEach(function(u){content.push({type:'image_url',image_url:u});});
  var lastErr;
  for(var i=0;i<VISION_MODELS.length;i++){
    try{
      var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+MISTRAL_API_KEY},body:JSON.stringify({model:VISION_MODELS[i],temperature:0.4,max_tokens:max||1700,response_format:{type:'json_object'},messages:[{role:'user',content:content}]})});
      if(!r.ok){lastErr=new Error('Vision AI '+r.status);if(r.status===429||r.status>=500){continue;}continue;}
      var j=await r.json();var out=jget(j.choices[0].message.content);if(out)return out;lastErr=new Error('пустой ответ');
    }catch(e){lastErr=e;}
  }
  throw lastErr||new Error('Vision AI недоступна');
}
function downscale(dataUrl,maxW){return new Promise(function(res){var img=new Image();img.onload=function(){var w=img.width,h=img.height;var k=Math.min(1,(maxW||640)/w);var c=D.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',0.85));};img.onerror=function(){res(dataUrl);};img.src=dataUrl;});}

/* ---- profile niche guess (for prefills) ---- */
function myNiche(){
  try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){var tp=(STATE.groups&&STATE.groups.long&&STATE.groups.long[0])?'':'';return STATE.channel.keywords?STATE.channel.keywords.split(/[,"]/).filter(Boolean)[0]||STATE.channel.title:STATE.channel.title;}}catch(e){}
  try{var p=lget('viora_profile_v1',null);if(p&&p.context)return p.context;}catch(e){}
  return '';
}
function myChannelBrief(){
  try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){var ch=STATE.channel;var all=[].concat(STATE.shorts||[],STATE.longs||[]);var tops=all.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,5).map(function(v){return v.title;});return {title:ch.title,subs:ch.subs,videoCount:ch.videoCount,topTitles:tops,medViewsPerDay:Math.round(median(all.map(function(v){return v.viewsPerDay;})))};}}catch(e){}
  try{var p=lget('viora_profile_v1',null);if(p)return {profile:{goal:p.goal2||p.goal||'',level:p.level||'',context:p.context||''}};}catch(e){}
  return null;
}

/* ============================================================ */
/* OVERLAY SHELL + TOOL DOCK                                     */
/* ============================================================ */
var TOOLS=[
  {id:'plab', ic:'🖼️', name:'Превью-лаборатория', desc:'Твоя превью в реальной сетке YouTube + AI-разбор', open:function(){openTool('plab');}},
  {id:'arena',ic:'⚔️', name:'Арена заголовков', desc:'2–5 вариантов: скоринг, AI-судья, сравнение с нишей', open:function(){openTool('arena');}},
  {id:'xray', ic:'🔬', name:'Разбор видео по ссылке', desc:'Почему чужой ролик залетел + адаптация под тебя', open:function(){openTool('xray');}},
  {id:'radar',ic:'📡', name:'Тренд-радар', desc:'Ты vs конкуренты + тренды недели в нише', open:function(){openTool('radar');}},
  {id:'prog', ic:'📈', name:'Прогресс и достижения', desc:'Здоровье канала, динамика, стрики и награды', open:function(){openTool('prog');}},
  {id:'script',ic:'🎬', name:'Сценарист-студия', desc:'Сценарий с кривой удержания + Shorts-конвейер', open:function(){openTool('script');}}
];
function buildOverlay(id,title,sub,topExtra){
  var ov=q('#v4ov_'+id);
  if(ov)return ov;
  ov=D.createElement('div');ov.className='v4-ov';ov.id='v4ov_'+id;
  ov.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\''+id+'\')">←</button><div class="v4-ttl">'+title+'<small>'+sub+'</small></div><div class="sp">'+(topExtra||'')+'</div></div><div class="v4-body"><div class="v4-wrap" id="v4body_'+id+'"></div></div>';
  D.body.appendChild(ov);
  return ov;
}
W.v4Close=function(id){var ov=q('#v4ov_'+id);if(ov)ov.classList.remove('open');D.body.style.overflow='';};
var RENDERERS={};
function openTool(id){
  var ov=q('#v4ov_'+id);
  if(!ov){var t=TOOLS.filter(function(x){return x.id===id;})[0];ov=buildOverlay(id,(t?t.ic+' '+t.name:id),(t?t.desc:''));}
  ov.classList.add('open');D.body.style.overflow='hidden';
  hideDock(); markUsed(id);
  try{if(RENDERERS[id])RENDERERS[id]();}catch(e){console.error(e);}
}
W.v4OpenTool=openTool;
function markUsed(id){var u=lget('v4_used',{});if(!u[id]){u[id]=Date.now();lset('v4_used',u);try{checkAchievements();}catch(e){}}}
/* dock */
function buildDock(){
  if(q('#v4Dock'))return;
  var d=D.createElement('div');d.id='v4Dock';
  var menu='<div id="v4DockMenu"><div class="ttl">Инструменты Viora</div>'+TOOLS.map(function(t){return '<button class="v4-dock-it" data-tool="'+t.id+'"><span class="ic">'+t.ic+'</span><span><b>'+t.name+'</b><small>'+t.desc+'</small></span><span class="new">NEW</span></button>';}).join('')+'</div>';
  d.innerHTML=menu+'<button id="v4DockBtn"><span class="ic">🧰</span>Инструменты</button>';
  D.body.appendChild(d);
  q('#v4DockBtn').addEventListener('click',function(e){e.stopPropagation();q('#v4DockMenu').classList.toggle('show');});
  qa('.v4-dock-it',d).forEach(function(b){b.addEventListener('click',function(){openTool(b.getAttribute('data-tool'));});});
  D.addEventListener('click',function(e){var m=q('#v4DockMenu');if(m&&m.classList.contains('show')&&!d.contains(e.target))m.classList.remove('show');});
}
function hideDock(){var m=q('#v4DockMenu');if(m)m.classList.remove('show');}
/* hero strip */
function buildHeroStrip(){
  var hero=q('#hero');if(!hero||q('#v4HeroTools'))return;
  var feats=q('.hero-feats',hero);
  var s=D.createElement('div');s.id='v4HeroTools';
  var SHORT={plab:'Превью-лаборатория',arena:'Арена заголовков',xray:'Разбор по ссылке',radar:'Тренд-радар',prog:'Прогресс',script:'Сценарист'};
  s.innerHTML='<span class="lbl">Инструменты:</span>'+TOOLS.map(function(t){return '<button class="v4-chip" data-tool="'+t.id+'">'+t.ic+' '+(SHORT[t.id]||t.name)+'</button>';}).join('');
  qa('button',s).forEach(function(b){b.addEventListener('click',function(){openTool(b.getAttribute('data-tool'));});});
  if(feats&&feats.parentNode)feats.parentNode.insertBefore(s,feats.nextSibling);else hero.appendChild(s);
}

/* ============================================================ */
/* 1. PREVIEW LAB                                                */
/* ============================================================ */
var LAB={a:null,b:null,ab:false,device:'desktop',blur:false,tiny:false,hl:true,rows:null,niche:''};
RENDERERS.plab=function(){
  var el=q('#v4body_plab');if(!el)return;
  if(el.__built){labGrid();return;}
  el.__built=true;
  el.innerHTML=''+
  '<div class="v4-cols">'+
    '<div class="v4-panel">'+
      '<h3>Твоя превью</h3>'+
      '<div class="v4-drop" id="labDropA"><span>📤 Перетащи или кликни,<br/>чтобы загрузить превью (16:9)</span></div>'+
      '<input type="file" id="labFileA" accept="image/*" style="display:none"/>'+
      '<div class="v4-lab">Заголовок ролика (для сетки и AI)</div>'+
      '<input class="v4-in" id="labTitleA" placeholder="Как я набрал 100K за месяц"/>'+
      '<div class="v4-row" style="margin-top:12px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);cursor:pointer"><input type="checkbox" id="labAB" style="accent-color:#ff2d55"/> Режим A/B — две превью</label></div>'+
      '<div id="labBwrap" style="display:none">'+
        '<div class="v4-lab">Вариант B</div>'+
        '<div class="v4-drop" id="labDropB"><span>📤 Превью B</span></div>'+
        '<input type="file" id="labFileB" accept="image/*" style="display:none"/>'+
        '<input class="v4-in" id="labTitleB" placeholder="Заголовок для B (можно тот же)" style="margin-top:8px"/>'+
      '</div>'+
      '<div class="v4-lab">Ниша — подтянем живых конкурентов из поиска</div>'+
      '<input class="v4-in" id="labNiche" placeholder="например: монтаж видео, фитнес дома"/>'+
      '<div class="v4-row" style="margin-top:12px">'+
        '<button class="v4-btn" id="labGridBtn">Показать в сетке YouTube</button>'+
      '</div>'+
      '<div class="v4-row" style="margin-top:8px">'+
        '<button class="v4-btn ghost" id="labAiBtn">✨ AI-разбор превью</button>'+
        '<button class="v4-btn ghost" onclick="v5Concepts(this)">🧠 Концепты до съёмки</button>'+
      '</div>'+
      '<div class="v4-note">Картинки никуда не сохраняются — анализ идёт прямо из браузера. Vision-модель смотрит на превью как живой зритель.</div>'+
    '</div>'+
    '<div>'+
      '<div class="v4-row" style="margin-bottom:12px">'+
        '<div class="v4-seg" id="labDevSeg"><button class="on" data-d="desktop">🖥 Десктоп</button><button data-d="phone">📱 Телефон</button></div>'+
        '<div class="v4lab-tests">'+
          '<button class="v4-chip" id="labBlurBtn" title="Блюр-тест: считывается ли композиция, когда детали не видны">🌫 Блюр-тест</button>'+
          '<button class="v4-chip" id="labTinyBtn" title="Тест мелкого размера: так превью выглядит в сайдбаре и на слабых экранах">🐜 Мелкий размер</button>'+
          '<button class="v4-chip" id="labHlBtn">🎯 Подсветить моё</button>'+
          '<button class="v4-chip" id="labShuffleBtn">🔀 Перемешать</button>'+
        '</div>'+
      '</div>'+
      '<div class="v4lab-stage desktop" id="labStage"><div class="v4-empty"><span class="big">🖼️</span>Загрузи превью слева, укажи нишу — и увидишь её в реальной выдаче YouTube рядом с конкурентами.<br/>Сразу станет ясно: цепляет или теряется.</div></div>'+
      '<div class="v4-aiout" id="labAiOut"></div>'+
    '</div>'+
  '</div>';
  function wireDrop(dropSel,fileSel,key){
    var drop=q(dropSel),file=q(fileSel);
    drop.addEventListener('click',function(e){if(e.target.classList.contains('rm'))return;file.click();});
    file.addEventListener('change',function(){if(file.files&&file.files[0])readImg(file.files[0],key,drop);});
    ;['dragover','dragenter'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over');});});
    ;['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over');});});
    drop.addEventListener('drop',function(e){var f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)readImg(f,key,drop);});
  }
  function readImg(f,key,drop){
    if(!/^image\//.test(f.type)){toast('Это не картинка','warn');return;}
    var r=new FileReader();
    r.onload=function(){downscale(r.result,1280).then(function(u){LAB[key]=u;drop.innerHTML='<img src="'+u+'" alt=""/><button class="rm" title="Убрать">✕</button>';q('.rm',drop).addEventListener('click',function(e){e.stopPropagation();LAB[key]=null;drop.innerHTML='<span>📤 Загрузить превью</span>';labGrid();});labGrid();});};
    r.readAsDataURL(f);
  }
  wireDrop('#labDropA','#labFileA','a');
  wireDrop('#labDropB','#labFileB','b');
  q('#labAB').addEventListener('change',function(){LAB.ab=this.checked;q('#labBwrap').style.display=this.checked?'block':'none';labGrid();});
  qa('#labDevSeg button').forEach(function(b){b.addEventListener('click',function(){qa('#labDevSeg button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');LAB.device=b.getAttribute('data-d');var st=q('#labStage');st.classList.toggle('desktop',LAB.device==='desktop');st.classList.toggle('phone',LAB.device==='phone');});});
  q('#labBlurBtn').addEventListener('click',function(){LAB.blur=!LAB.blur;q('#labStage').classList.toggle('blurred',LAB.blur);this.style.borderColor=LAB.blur?'rgba(255,45,85,.6)':'';});
  q('#labTinyBtn').addEventListener('click',function(){LAB.tiny=!LAB.tiny;q('#labStage').classList.toggle('tiny',LAB.tiny);this.style.borderColor=LAB.tiny?'rgba(255,45,85,.6)':'';});
  q('#labHlBtn').addEventListener('click',function(){LAB.hl=!LAB.hl;qa('#labStage .v4yt-card.mine').forEach(function(c){c.classList.toggle('hl',LAB.hl);});this.style.borderColor=LAB.hl?'rgba(255,45,85,.6)':'';});
  q('#labShuffleBtn').addEventListener('click',function(){renderLabGrid(true);});
  q('#labGridBtn').addEventListener('click',function(){labGrid(true);});
  q('#labAiBtn').addEventListener('click',labAI);
  var n=myNiche();if(n)q('#labNiche').value=n;
};
async function labGrid(force){
  var stage=q('#labStage');if(!stage)return;
  var niche=(q('#labNiche')||{}).value||'';niche=niche.trim();
  if(!LAB.a&&!LAB.b){if(force)toast('Сначала загрузи превью','warn');return;}
  if(!niche){stage.innerHTML='<div class="v4-empty"><span class="big">🔍</span>Укажи нишу слева — подтянем реальные ролики конкурентов из поиска YouTube.</div>';return;}
  if(force||!LAB.rows||LAB.niche!==niche){
    stage.innerHTML=skel(6,true);
    try{
      var s=await ytFetch('search?part=snippet&type=video&maxResults=11&q='+encodeURIComponent(niche));
      var items=(s.items||[]).filter(function(i){return i.id&&i.id.videoId;});
      var ids=items.map(function(i){return i.id.videoId;}).join(',');
      var stats={};
      if(ids){var vd=await ytFetch('videos?part=statistics,contentDetails&id='+ids);(vd.items||[]).forEach(function(v){stats[v.id]={views:+v.statistics.viewCount||0,dur:(typeof durSec==='function'?durSec(v.contentDetails.duration):0)};});}
      LAB.rows=items.map(function(i){var st=stats[i.id.videoId]||{};return {id:i.id.videoId,title:i.snippet.title,ch:i.snippet.channelTitle,thumb:(i.snippet.thumbnails.high||i.snippet.thumbnails.medium||i.snippet.thumbnails.default||{}).url,published:i.snippet.publishedAt,views:st.views||0,dur:st.dur||0};});
      LAB.niche=niche;
    }catch(e){stage.innerHTML='<div class="v4-err">Не удалось загрузить конкурентов: '+esc(e.message||'сеть')+'</div>';return;}
  }
  renderLabGrid();
}
function durTxt(s){if(!s)return '';var m=Math.floor(s/60),ss=s%60;return m+':'+(ss<10?'0':'')+ss;}
function renderLabGrid(shuffle){
  var stage=q('#labStage');if(!stage||!LAB.rows)return;
  var rows=LAB.rows.slice(0,LAB.ab?8:9);
  if(shuffle)rows.sort(function(){return Math.random()-.5;});
  var cards=rows.map(function(r){
    return {mine:false,html:'<div class="v4yt-card"><div class="v4yt-thumb"><img src="'+esc(r.thumb)+'" loading="lazy" alt=""/>'+(r.dur?'<span class="dur">'+durTxt(r.dur)+'</span>':'')+'</div><div class="v4yt-meta"><div class="v4yt-av"></div><div><div class="v4yt-t">'+esc(r.title)+'</div><div class="v4yt-s">'+esc(r.ch)+'<br/>'+(r.views?v4fmt(r.views)+' просмотров · ':'')+relAge(r.published)+'</div></div></div></div>'};
  });
  function mineCard(img,title,tag){
    return {mine:true,html:'<div class="v4yt-card mine'+(LAB.hl?' hl':'')+'"><div class="v4yt-thumb"><img src="'+img+'" alt=""/>'+(tag?'<span class="dur" style="background:rgba(255,45,85,.9)">'+tag+'</span>':'')+'</div><div class="v4yt-meta"><div class="v4yt-av" style="background:linear-gradient(135deg,#ff2d55,#ff7a4d)"></div><div><div class="v4yt-t">'+esc(title||'Твой будущий ролик')+'</div><div class="v4yt-s">Твой канал · сейчас</div></div></div></div>'};
  }
  var tA=(q('#labTitleA')||{}).value||'';
  if(LAB.a)cards.splice(1,0,mineCard(LAB.a,tA,LAB.ab?'A':''));
  if(LAB.ab&&LAB.b){var tB=(q('#labTitleB')||{}).value||tA;cards.splice(5,0,mineCard(LAB.b,tB,'B'));}
  stage.innerHTML='<div class="v4yt-grid">'+cards.map(function(c){return c.html;}).join('')+'</div>';
}
async function labAI(){
  var out=q('#labAiOut'),btn=q('#labAiBtn');if(!out)return;
  if(!LAB.a){toast('Сначала загрузи превью','warn');return;}
  var tA=(q('#labTitleA')||{}).value||'';var niche=(q('#labNiche')||{}).value||'';
  btn.disabled=true;out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Viora смотрит на превью глазами зрителя…</span></div>';
  try{
    var imgs=[await downscale(LAB.a,640)];
    var schema, prompt;
    if(LAB.ab&&LAB.b){
      imgs.push(await downscale(LAB.b,640));
      var tB=(q('#labTitleB')||{}).value||tA;
      schema='{"a":{"score":0,"first_impression":"...","strengths":["..."],"fixes":["конкретная правка"],"readability":"вердикт про мелкий размер и блюр"},"b":{...то же...},"winner":"A|B","why":"почему победитель выигрывает, 2-3 предложения","ab_advice":"что взять из обоих"}';
      prompt='Ты — эксперт по CTR на YouTube. Первая картинка — превью A, вторая — превью B одного и того же ролика. Ниша: «'+niche+'». Заголовок A: «'+tA+'». Заголовок B: «'+tB+'». Оцени каждую как живой зритель, листающий ленту 0.5 секунды: композиция, лицо/эмоция, текст (читается ли в мелком размере), контраст, цвета, кликабельность в паре с заголовком. Скоринг 0-100 честный, не завышай. fixes — только конкретные правки («увеличь текст до 3 слов», «убери мелкие детали слева»). Выбери победителя. Отвечай по-русски. Верни СТРОГО JSON по схеме: '+schema;
    }else{
      schema='{"score":0,"first_impression":"что зритель понял за 0.5 сек","strengths":["..."],"fixes":["конкретная правка"],"readability":"вердикт: текст и композиция в мелком размере","ctr_with_title":"насколько превью работает в паре с заголовком"}';
      prompt='Ты — эксперт по CTR на YouTube. На картинке — превью ролика. Ниша: «'+niche+'». Заголовок: «'+tA+'». Оцени как живой зритель, листающий ленту 0.5 секунды: композиция, лицо/эмоция, текст (мало и крупно?), контраст с интерфейсом YouTube, кликабельность в паре с заголовком (превью не должно дублировать заголовок). Скоринг 0-100 честный. fixes — только конкретика. Отвечай по-русски. Верни СТРОГО JSON: '+schema;
    }
    var a=await aiVision(prompt,imgs,1800);
    out.innerHTML=renderLabAI(a);
    qa('.v4ar-bar i',out).forEach(function(b){requestAnimationFrame(function(){b.style.width=b.getAttribute('data-w')+'%';});});
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось разобрать превью: '+esc(e.message||'AI недоступна')+'. Попробуй ещё раз.</div>';}
  btn.disabled=false;
}
function renderLabAI(a){
  function card(label,d){
    if(!d)return '';
    var str=(d.strengths||[]).map(function(s){return '<li>✅ '+esc(s)+'</li>';}).join('');
    var fx=(d.fixes||[]).map(function(s){return '<li>🔧 '+esc(s)+'</li>';}).join('');
    return '<div class="v4-aicard"><h4>'+(label?label+' · ':'')+'оценка зрителя</h4><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">'+ring(+d.score||0)+'<div style="flex:1;min-width:200px"><div class="vrd">'+esc(d.first_impression||'')+'</div>'+(d.readability?'<div class="vrd" style="color:var(--muted);font-size:12.5px;margin-top:6px">🐜 '+esc(d.readability)+'</div>':'')+(d.ctr_with_title?'<div class="vrd" style="color:var(--muted);font-size:12.5px;margin-top:6px">🏷 '+esc(d.ctr_with_title)+'</div>':'')+'</div></div>'+(str?'<ul>'+str+'</ul>':'')+(fx?'<div class="v4-lab">Что поправить:</div><ul>'+fx+'</ul>':'')+'</div>';
  }
  if(a&&(a.a||a.b)){
    var w=String(a.winner||'').toUpperCase().indexOf('B')>=0?'B':'A';
    return '<div class="v4-aicard"><span class="v4-winner">🏆 Побеждает вариант '+w+'</span><div class="vrd" style="margin-top:10px">'+esc(a.why||'')+'</div>'+(a.ab_advice?'<div class="vrd" style="margin-top:8px;color:var(--muted)">💡 '+esc(a.ab_advice)+'</div>':'')+'</div>'+card('Вариант A',a.a)+card('Вариант B',a.b);
  }
  return card('',a);
}

/* ============================================================ */
/* 2. TITLE ARENA                                                */
/* ============================================================ */
function arenaLocalScore(t){
  t=String(t||'').trim();
  var visp=null;try{if(typeof vispScore==='function')visp=vispScore(t);}catch(e){}
  var trigs=[];try{if(typeof detectTitleTriggers==='function')trigs=detectTitleTriggers(t)||[];}catch(e){}
  var base=visp?visp.score*0.55:40;
  base+=Math.min(24,trigs.length*8);
  if(/\d/.test(t))base+=6;
  var len=t.length;
  if(len>=25&&len<=62)base+=12;else if(len>70)base-=12;else if(len<18&&len>0)base-=8;
  if(/[?!«»"]/.test(t))base+=3;
  return {score:Math.round(clamp(base,3,98)),visp:visp,trigs:trigs,len:len};
}
function trigName(key){
  try{if(typeof TRIGGER_LIB!=='undefined'){var f=TRIGGER_LIB.filter(function(x){return x.key===key;})[0];if(f)return f.name||key;}}catch(e){}
  return key;
}
RENDERERS.arena=function(){
  var el=q('#v4body_arena');if(!el)return;
  if(el.__built)return;el.__built=true;
  var inputs='';for(var i=0;i<5;i++)inputs+='<div class="v4ar-row"><span class="idx">'+(i+1)+'</span><input class="v4-in" data-ar="'+i+'" placeholder="'+(i<2?'Вариант заголовка '+(i+1):'Ещё вариант (необязательно)')+'"/></div>';
  el.innerHTML='<div class="v4-cols"><div class="v4-panel"><h3>Варианты заголовков</h3>'+inputs+
    '<div class="v4-lab">Тема / ниша — сравним с реальными заголовками из выдачи</div>'+
    '<input class="v4-in" id="arNiche" placeholder="например: похудение после 40"/>'+
    '<div class="v4-row" style="margin-top:12px"><button class="v4-btn" id="arGo">⚔️ Запустить арену</button></div>'+
    '<div class="v4-note">Каждый вариант проходит ВИСП-скоринг, проверку длины, цифр и эмоциональных триггеров. Потом AI-судья выбирает победителя и объясняет почему, а твой балл сравнивается с живыми заголовками по теме.</div></div>'+
    '<div id="arOut"><div class="v4-empty"><span class="big">⚔️</span>Введи 2–5 вариантов заголовка — устроим честный бой.<br/>Победителя выберут формулы и AI-судья.</div></div></div>';
  var n=myNiche();if(n)q('#arNiche').value=n;
  q('#arGo').addEventListener('click',arenaRun);
};
async function arenaRun(){
  var out=q('#arOut'),btn=q('#arGo');
  var titles=qa('[data-ar]').map(function(i){return i.value.trim();}).filter(Boolean);
  if(titles.length<2){toast('Нужно минимум 2 варианта','warn');return;}
  var niche=(q('#arNiche')||{}).value.trim();
  btn.disabled=true;
  var locals=titles.map(arenaLocalScore);
  out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Считаю формулы, зову AI-судью'+(niche?' и сравниваю с нишей':'')+'…</span></div>';
  /* niche percentile */
  var pct=null,nicheTitles=[];
  if(niche){
    try{
      var s=await ytFetch('search?part=snippet&type=video&maxResults=25&q='+encodeURIComponent(niche));
      nicheTitles=(s.items||[]).map(function(i){return i.snippet?i.snippet.title:'';}).filter(Boolean);
      if(nicheTitles.length>=6){
        var nScores=nicheTitles.map(function(t){return arenaLocalScore(t).score;});
        var best=Math.max.apply(null,locals.map(function(l){return l.score;}));
        var beat=nScores.filter(function(x){return best>x;}).length;
        pct=Math.round(beat/nScores.length*100);
      }
    }catch(e){}
  }
  /* AI judge */
  var judge=null;
  try{
    var brief=myChannelBrief();
    var sys='Ты — AI-судья заголовков YouTube, эксперт по CTR и формуле ВИСП (Выгода, Интрига, Срочность, Причастность). Сравни варианты заголовков ОДНОГО ролика честно и жёстко: что цепляет, что обрезается, что выглядит кликбейтом без подкрепления. Пиши по-русски, конкретно, без воды. Верни СТРОГО валидный JSON без markdown: {"winner_index":0,"verdict":"почему именно он победил, 2-3 предложения с конкретикой","per_title":[{"index":0,"pro":"сильная сторона одной фразой","con":"слабость одной фразой"}],"improved":["3 улучшенных заголовка на базе победителя — разные подходы"]}';
    var usr='Тема/ниша: «'+(niche||'не указана')+'».'+(brief?' Контекст канала автора: '+JSON.stringify(brief)+'.':'')+(nicheTitles.length?' Реальные заголовки конкурентов из выдачи по теме: '+JSON.stringify(nicheTitles.slice(0,12))+'.':'')+'\nВарианты автора (index с нуля):\n'+titles.map(function(t,i){return i+'. '+t;}).join('\n');
    judge=await aiJson(sys,usr,1600);
  }catch(e){}
  var winIdx=judge&&judge.winner_index!=null?+judge.winner_index:locals.indexOf(locals.slice().sort(function(a,b){return b.score-a.score;})[0]);
  if(!(winIdx>=0&&winIdx<titles.length))winIdx=0;
  var html='';
  if(pct!=null)html+='<div class="v4-pct"><b>'+pct+'%</b><div class="tx">Твой лучший вариант сильнее <b>'+pct+'% заголовков</b> из реальной выдачи по теме «'+esc(niche)+'» ('+nicheTitles.length+' роликов, по формульному скорингу).</div></div>';
  html+=titles.map(function(t,i){
    var L=locals[i];var pt=judge&&judge.per_title?(judge.per_title.filter(function(x){return +x.index===i;})[0]||null):null;
    var vispChips='';
    if(L.visp&&L.visp.hit){var hitK=L.visp.hit.map(function(x){return x.k;});vispChips=['В','И','С','П'].map(function(k){var on=hitK.indexOf(k)>=0;return '<span class="'+(on?'on':'off')+'">'+k+(on?' ✓':'')+'</span>';}).join('');}
    var trigChips=L.trigs.slice(0,4).map(function(k){return '<span class="on">⚡ '+esc(trigName(k))+'</span>';}).join('');
    var col=L.score>=70?'#7ee0a2':L.score>=45?'#ffcf7a':'#ff8da1';
    return '<div class="v4ar-card'+(i===winIdx?' win':'')+'" style="animation-delay:'+(i*70)+'ms">'+
      '<div class="v4ar-head"><span class="idx" style="width:26px;height:26px;border-radius:8px;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted)">'+(i+1)+'</span><div class="t">'+esc(t)+(i===winIdx?' <span class="v4-winner" style="padding:3px 9px;font-size:11.5px;margin-left:6px">🏆 победитель</span>':'')+'</div><span class="v4ar-score" style="color:'+col+'">'+L.score+'</span></div>'+
      '<div class="v4ar-bar"><i data-w="'+L.score+'" style="background:linear-gradient(90deg,'+col+','+col+'aa)"></i></div>'+
      '<div class="v4ar-chips">'+vispChips+trigChips+'<span>'+L.len+' симв.'+(L.len>70?' ⚠️ обрежется':'')+'</span>'+(/\d/.test(t)?'<span class="on">🔢 цифры</span>':'<span class="off">без цифр</span>')+'</div>'+
      (pt?'<div style="font-size:12.5px;margin-top:9px;line-height:1.55">'+(pt.pro?'<div style="color:#9ef0bb">＋ '+esc(pt.pro)+'</div>':'')+(pt.con?'<div style="color:#ff9fae">－ '+esc(pt.con)+'</div>':'')+'</div>':'')+
      '</div>';
  }).join('');
  if(judge&&judge.verdict)html+='<div class="v4-aicard"><h4>🧑‍⚖️ Вердикт AI-судьи</h4><div class="vrd">'+esc(judge.verdict)+'</div></div>';
  if(judge&&Array.isArray(judge.improved)&&judge.improved.length){
    html+='<div class="v4-aicard"><h4>✨ Улучшенные версии — кликни, чтобы скопировать</h4><div class="v4-imp">'+judge.improved.slice(0,3).map(function(t){return '<div class="it" onclick="v4Copy(this)" data-t="'+esc(t)+'"><span>🏷</span><span>'+esc(t)+'</span><span class="cp">копировать</span></div>';}).join('')+'</div></div>';
  }
  if(!judge)html+='<div class="v4-err">AI-судья сейчас недоступен — показан формульный скоринг. Попробуй ещё раз через минуту.</div>';
  out.innerHTML=html;
  qa('.v4ar-bar i',out).forEach(function(b){requestAnimationFrame(function(){setTimeout(function(){b.style.width=b.getAttribute('data-w')+'%';},60);});});
  btn.disabled=false;
  try{markUsed('arena_run');}catch(e){}
}
W.v4Copy=function(el){var t=el.getAttribute('data-t')||el.textContent;try{navigator.clipboard.writeText(t);toast('Скопировано 📋','ok',1600);}catch(e){}};

/* ============================================================ */
/* 3. VIDEO X-RAY (разбор любого видео по ссылке)                */
/* ============================================================ */
RENDERERS.xray=function(){
  var el=q('#v4body_xray');if(!el)return;
  if(el.__built)return;el.__built=true;
  el.innerHTML='<div class="v4-panel" style="max-width:760px;margin:0 auto 16px"><h3>Вставь ссылку на любой ролик</h3>'+
    '<div class="v4-row"><input class="v4-in" id="xrUrl" style="flex:1;min-width:240px" placeholder="https://youtube.com/watch?v=... или ссылка на Shorts"/><button class="v4-btn" id="xrGo">🔬 Разобрать</button></div>'+
    '<div class="v4-note">Viora сравнит ролик с фоном его канала, найдёт триггеры заголовка, момент публикации и объяснит, почему он залетел (или нет). А потом адаптирует приём под твой канал.</div></div>'+
    '<div id="xrOut" style="max-width:760px;margin:0 auto"></div>';
  q('#xrGo').addEventListener('click',xrayRun);
  q('#xrUrl').addEventListener('keydown',function(e){if(e.key==='Enter')xrayRun();});
};
var XR_LAST=null;
async function xrayRun(){
  var out=q('#xrOut'),btn=q('#xrGo');
  var raw=(q('#xrUrl')||{}).value.trim();
  if(!raw){toast('Вставь ссылку на видео','warn');return;}
  var p=null;try{p=parseInput(raw);}catch(e){}
  if(!p||p.type!=='video'){out.innerHTML='<div class="v4-err">Это не похоже на ссылку на видео. Нужна ссылка вида youtube.com/watch?v=… , youtu.be/… или ссылка на Shorts.</div>';return;}
  btn.disabled=true;out.innerHTML=skel(7,true);
  try{
    var vids=await getVideos([p.value]);
    if(!vids.length)throw new Error('Видео не найдено или приватное');
    var v=vids[0];
    var vd=await ytFetch('videos?part=snippet&id='+p.value);
    var chId=vd.items[0].snippet.channelId;
    var ch=await getChannel(chId);
    var upIds=await getUploads(ch.uploads,25);
    var ups=await getVideos(upIds);
    var same=ups.filter(function(x){return x.isShort===v.isShort&&x.id!==v.id;});
    if(same.length<4)same=ups.filter(function(x){return x.id!==v.id;});
    var med=median(same.map(function(x){return x.viewsPerDay;}))||1;
    var mult=v.viewsPerDay/med;
    var trigs=[];try{trigs=detectTitleTriggers(v.title)||[];}catch(e){}
    var dows=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
    var stat={title:v.title,format:v.isShort?'Shorts':'Длинное видео',durationSec:v.dur,views:v.views,viewsPerDay:Math.round(v.viewsPerDay),ageDays:v.age,engagementPct:+(v.engagement*100).toFixed(2),multiplier:+mult.toFixed(2),channel:{title:ch.title,subs:ch.subs,medianViewsPerDay:Math.round(med)},published:dows[v.dow]+', ~'+v.hour+':00',titleTriggers:trigs.map(trigName),description:(v.desc||'').slice(0,300)};
    var brief=myChannelBrief();
    var sys='Ты — Viora AI, аналитик YouTube. По метаданным ролика и его позиции относительно медианы канала объясни, ПОЧЕМУ он набрал столько просмотров. Без воды, с опорой на цифры (множитель к медиане, вовлечённость, формат, момент публикации, триггеры заголовка). Если ролик НЕ залетел (множитель < 1.5) — честно скажи это и объясни почему. Пиши по-русски. Верни СТРОГО валидный JSON без markdown: {"verdict":"итог одним предложением с эмодзи","reasons":[{"t":"причина коротко","d":"объяснение с конкретикой 1-2 предложения"}],"title_play":"как именно работает заголовок (триггеры, ВИСП)","timing":"роль момента публикации","steal":["2-4 приёма, которые стоит забрать себе"]}';
    var a=await aiJson(sys,'Разбери ролик:\n'+JSON.stringify(stat),1900);
    XR_LAST={v:v,ch:ch,med:med,mult:mult,a:a,trigs:trigs};
    var hot=mult>=1.5;
    var reasons=(a.reasons||[]).map(function(r,i){return '<div class="v4x-reason" style="animation-delay:'+(i*80)+'ms"><span class="n">'+(i+1)+'</span><div><b>'+esc(r.t||'')+'</b><div style="color:#d8d7dd;margin-top:3px">'+esc(r.d||'')+'</div></div></div>';}).join('');
    var steal=(a.steal||[]).map(function(s){return '<li>🎯 '+esc(s)+'</li>';}).join('');
    out.innerHTML='<div class="v4-panel" style="margin-bottom:14px"><div class="v4x-hero">'+
      '<div class="th"><img src="'+esc(v.thumb)+'" alt=""/><span class="mult'+(hot?' hot':'')+'">×'+mult.toFixed(1)+' к медиане</span></div>'+
      '<div style="flex:1;min-width:230px"><div style="font-weight:700;font-size:16px;line-height:1.4">'+esc(v.title)+'</div>'+
      '<div style="color:var(--muted);font-size:12.5px;margin-top:5px">'+esc(ch.title)+' · '+v4fmt(ch.subs)+' подписчиков · '+esc(stat.format)+'</div>'+
      '<div class="v4x-stats"><div class="v4x-stat"><b>'+v4fmt(v.views)+'</b>просмотров</div><div class="v4x-stat"><b>'+v4fmt(v.viewsPerDay)+'</b>в день</div><div class="v4x-stat"><b>'+v4fmt(med)+'</b>медиана канала/день</div><div class="v4x-stat"><b>'+stat.engagementPct+'%</b>вовлечённость</div><div class="v4x-stat"><b>'+esc(stat.published)+'</b>публикация</div></div>'+
      (trigs.length?'<div class="v4ar-chips" style="margin-top:10px">'+trigs.map(function(k){return '<span class="on">⚡ '+esc(trigName(k))+'</span>';}).join('')+'</div>':'')+
      '</div></div></div>'+
      '<div class="v4-aicard" style="margin-bottom:14px"><h4>'+(hot?'🔥':'🧊')+' Вердикт</h4><div class="vrd">'+esc(a.verdict||'')+'</div></div>'+
      (reasons?'<div class="v4-panel" style="margin-bottom:14px"><h3>Почему такой результат</h3>'+reasons+(a.title_play?'<div class="v4-aicard"><h4>🏷 Игра заголовка</h4><div class="vrd">'+esc(a.title_play)+'</div></div>':'')+(a.timing?'<div class="v4-aicard"><h4>📅 Тайминг</h4><div class="vrd">'+esc(a.timing)+'</div></div>':'')+'</div>':'')+
      (steal?'<div class="v4-panel" style="margin-bottom:14px"><h3>Что забрать себе</h3><ul style="margin:4px 0;padding-left:18px;font-size:13.5px;line-height:1.7">'+steal+'</ul></div>':'')+
      '<div class="v4-row" style="justify-content:center;padding:6px 0 20px"><button class="v4-btn" id="xrAdapt">🪄 Адаптировать под мой канал</button></div><div id="xrAdaptOut"></div>';
    q('#xrAdapt').addEventListener('click',xrayAdapt);
    try{markUsed('xray_run');checkAchievements();}catch(e){}
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось разобрать: '+esc(e.message||'ошибка сети')+'</div>';}
  btn.disabled=false;
}
async function xrayAdapt(){
  var out=q('#xrAdaptOut'),btn=q('#xrAdapt');if(!XR_LAST)return;
  var brief=myChannelBrief();
  btn.disabled=true;out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Продюсер адаптирует приём под твой канал…</span></div>';
  try{
    var src={title:XR_LAST.v.title,format:XR_LAST.v.isShort?'Shorts':'Длинное',multiplier:+XR_LAST.mult.toFixed(2),whyWorked:XR_LAST.a&&XR_LAST.a.reasons?XR_LAST.a.reasons.map(function(r){return r.t;}):[],steal:XR_LAST.a?XR_LAST.a.steal:[]};
    var sys='Ты — личный продюсер YouTube-канала. Автор нашёл чужой залетевший ролик и хочет адаптировать приём под себя (НЕ скопировать тему один в один, а перенести механику успеха). Дай готовый план съёмки. Пиши простым русским языком. Верни СТРОГО валидный JSON без markdown: {"idea":"тема ролика одной фразой под канал автора","why":"почему зайдёт — со ссылкой на механику исходника","format":"Shorts|Длинное","duration":"длительность словами","titles":[{"title":"готовый заголовок","note":"что закрывает по ВИСП"}],"hook":"дословный текст первых 10-20 секунд","structure":[{"block":"название","what":"что говорить/показывать","time":"0:00–0:30"}],"thumb":{"idea":"что в кадре","text":"текст на превью до 4 слов","style":"цвета/стиль"},"publish":{"when":"день и время","why":"почему"},"checklist":["6 пунктов проверки"],"pitfalls":["3 ошибки и как избежать"]}';
    var usr='Исходный залетевший ролик: '+JSON.stringify(src)+'\nКанал автора: '+JSON.stringify(brief||{note:'канал ещё не проанализирован — дай универсальный план под нишу исходника'});
    var d=await aiJson(sys,usr,2400);
    if(!d||!d.idea)throw new Error('пустой план');
    var saved=false;
    try{if(typeof saveShootPlan==='function'){saveShootPlan(d);saved=true;}}catch(e){}
    var titles=(d.titles||[]).map(function(t){return '<div class="v4-imp"><div class="it" onclick="v4Copy(this)" data-t="'+esc(t.title)+'"><span>🏷</span><span>'+esc(t.title)+(t.note?' <small style="color:var(--muted)">· '+esc(t.note)+'</small>':'')+'</span><span class="cp">копировать</span></div></div>';}).join('');
    var steps=(d.structure||[]).map(function(s){return '<div class="v4s-block"><span class="tc">'+esc(s.time||'')+'</span><div class="bd"><div class="bn">'+esc(s.block||'')+'</div><div class="say">'+esc(s.what||'')+'</div></div></div>';}).join('');
    var th=d.thumb||{},pub=d.publish||{};
    out.innerHTML='<div class="v4-panel" style="margin-bottom:20px"><h3>🪄 План под твой канал</h3>'+
      '<div style="font-size:16px;font-weight:700;line-height:1.4">'+esc(d.idea)+'</div>'+
      '<div class="v4ar-chips" style="margin:7px 0">'+(d.format?'<span class="on">'+esc(d.format)+'</span>':'')+(d.duration?'<span>⏱ '+esc(d.duration)+'</span>':'')+'</div>'+
      (d.why?'<div class="vrd" style="color:var(--muted);font-size:13px;margin-bottom:10px">📊 '+esc(d.why)+'</div>':'')+
      (titles?'<div class="v4-lab">Заголовки</div>'+titles:'')+
      (d.hook?'<div class="v4s-hook" style="margin-top:12px"><div class="lb">🎤 Хук — первые 15 секунд</div>'+esc(d.hook)+'</div>':'')+
      (steps?'<div class="v4-lab">Структура</div>'+steps:'')+
      ((th.idea||th.text)?'<div class="v4-aicard"><h4>🖼️ Превью</h4><div class="vrd">'+esc(th.idea||'')+(th.text?'<br/>Текст: <b>«'+esc(th.text)+'»</b>':'')+(th.style?'<br/><span style="color:var(--muted)">'+esc(th.style)+'</span>':'')+'</div></div>':'')+
      (pub.when?'<div class="v4-aicard"><h4>📅 Когда публиковать</h4><div class="vrd"><b>'+esc(pub.when)+'</b>'+(pub.why?' — '+esc(pub.why):'')+'</div></div>':'')+
      (saved?'<div class="v4-note">✅ План сохранён в «Мои съёмки» — найдёшь его в аудите канала.</div>':'')+
      '</div>';
    toast('План съёмки готов 🎬','ok',3000);
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось адаптировать: '+esc(e.message||'AI недоступна')+'</div>';}
  btn.disabled=false;
}

/* ============================================================ */
/* 4. TREND RADAR + COMPETITORS                                  */
/* ============================================================ */
var RIVALS_KEY='v4_rivals_v1';
function rivalsGet(){var a=lget(RIVALS_KEY,[]);return Array.isArray(a)?a:[];}
function rivalsSet(a){lset(RIVALS_KEY,a.slice(0,5));}
var radarChart=null;
RENDERERS.radar=function(){
  var el=q('#v4body_radar');if(!el)return;
  if(!el.__built){
    el.__built=true;
    el.innerHTML='<div class="v4-cols"><div class="v4-panel"><h3>Конкуренты (до 5)</h3>'+
      '<div id="rvList"></div>'+
      '<div class="v4-row" style="margin-top:10px"><input class="v4-in" id="rvUrl" style="flex:1;min-width:160px" placeholder="Ссылка или @handle канала"/><button class="v4-btn sm" id="rvAdd">＋</button></div>'+
      '<div class="v4-lab">Ниша для трендов недели</div>'+
      '<input class="v4-in" id="rvNiche" placeholder="например: обзоры техники"/>'+
      '<div class="v4-row" style="margin-top:12px"><button class="v4-btn" id="rvGo">📡 Запустить радар</button></div>'+
      '<div class="v4-note" id="rvMeNote"></div></div>'+
      '<div id="rvOut"><div class="v4-empty"><span class="big">📡</span>Добавь 3–5 каналов конкурентов — построю карту «ты vs они», покажу, что у них выстрелило за 30 дней, и какие приёмы они используют, а ты нет.</div></div></div>';
    q('#rvAdd').addEventListener('click',rivalAdd);
    q('#rvUrl').addEventListener('keydown',function(e){if(e.key==='Enter')rivalAdd();});
    q('#rvGo').addEventListener('click',radarRun);
    var n=myNiche();if(n)q('#rvNiche').value=n;
  }
  renderRivals();
  var me=null;try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel)me=STATE.channel;}catch(e){}
  q('#rvMeNote').innerHTML=me?'Твоя сторона карты: <b>'+esc(me.title)+'</b> (из последнего аудита).':'⚠️ Сначала прогони аудит своего канала на главной — тогда на карте появится сторона «ты». Пока покажу только конкурентов.';
};
function renderRivals(){
  var box=q('#rvList');if(!box)return;
  var a=rivalsGet();
  box.innerHTML=a.length?a.map(function(r){return '<div class="v4r-rival">'+(r.avatar?'<img src="'+esc(r.avatar)+'" alt=""/>':'<div class="v4yt-av"></div>')+'<div class="nm">'+esc(r.title)+'<small>'+v4fmt(r.subs)+' подписчиков</small></div><button class="rm" onclick="v4RivalDel(\''+r.id+'\')">✕</button></div>';}).join(''):'<div class="v4-note" style="margin:0">Пока пусто — добавь ссылку на канал конкурента.</div>';
}
W.v4RivalDel=function(id){rivalsSet(rivalsGet().filter(function(r){return r.id!==id;}));renderRivals();};
async function rivalAdd(){
  var inp=q('#rvUrl'),btn=q('#rvAdd');var raw=inp.value.trim();
  if(!raw)return;
  if(rivalsGet().length>=5){toast('Максимум 5 конкурентов','warn');return;}
  btn.disabled=true;btn.textContent='…';
  try{
    var id=await resolveChannelId(parseInput(raw));
    if(rivalsGet().some(function(r){return r.id===id;})){toast('Этот канал уже в списке','warn');}
    else{
      var ch=await getChannel(id);
      var a=rivalsGet();a.push({id:ch.id,title:ch.title,subs:ch.subs,avatar:ch.avatar,uploads:ch.uploads});rivalsSet(a);
      renderRivals();inp.value='';toast('Добавил: '+ch.title,'ok',2200);
    }
  }catch(e){toast('Не нашёл канал: '+(e.message||''),'warn',3200);}
  btn.disabled=false;btn.textContent='＋';
}
function chanMetrics(ch,vids){
  var recent=vids.filter(function(v){return v.age<=30;});
  var meds=median(vids.map(function(v){return v.viewsPerDay;}))||0;
  var eng=vids.length?vids.reduce(function(s,v){return s+v.engagement;},0)/vids.length*100:0;
  var maxX=0;vids.forEach(function(v){var x=meds>0?v.viewsPerDay/meds:0;if(x>maxX)maxX=x;});
  return {freq30:recent.length,med:meds,eng:eng,viral:maxX,fresh:recent.length?Math.min.apply(null,recent.map(function(v){return v.age;})):99,vids:vids};
}
async function radarRun(){
  var out=q('#rvOut'),btn=q('#rvGo');
  var rivals=rivalsGet();
  if(!rivals.length){toast('Добавь хотя бы одного конкурента','warn');return;}
  btn.disabled=true;out.innerHTML=skel(8,true);
  try{
    var me=null,meM=null;
    try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){me=STATE.channel;var myVids=[].concat(STATE.shorts||[],STATE.longs||[]);if(myVids.length)meM=chanMetrics(me,myVids);}}catch(e){}
    var data=[];
    for(var i=0;i<rivals.length;i++){
      var r=rivals[i];
      try{
        var ids=await getUploads(r.uploads,20);
        var vids=await getVideos(ids);
        data.push({r:r,m:chanMetrics(r,vids)});
      }catch(e){}
    }
    if(!data.length)throw new Error('не удалось загрузить каналы конкурентов');
    /* normalize axes 0-100 across all participants */
    var parts=data.map(function(d){return d.m;});if(meM)parts=parts.concat([meM]);
    function norm(get){var max=Math.max.apply(null,parts.map(get))||1;return function(m){return Math.round(clamp(get(m)/max*100,0,100));};}
    var nFreq=norm(function(m){return m.freq30;}),nMed=norm(function(m){return m.med;}),nEng=norm(function(m){return m.eng;}),nVir=norm(function(m){return m.viral;});
    var axes=['Частота (30 дн)','Медиана просм./день','Вовлечённость','Виральность','Свежесть'];
    function axesOf(m){return [nFreq(m),nMed(m),nEng(m),nVir(m),Math.round(clamp((30-Math.min(m.fresh,30))/30*100,0,100))];}
    /* hits of last 30 days across rivals */
    var hits=[];
    data.forEach(function(d){d.m.vids.forEach(function(v){if(v.age<=30&&d.m.med>0){var x=v.viewsPerDay/d.m.med;if(x>=1.6)hits.push({v:v,ch:d.r.title,x:x});}});});
    hits.sort(function(a,b){return b.x-a.x;});
    /* trigger gap */
    var gap=[];
    try{
      var theirTrigs={};
      data.forEach(function(d){d.m.vids.slice(0,15).forEach(function(v){(detectTitleTriggers(v.title)||[]).forEach(function(k){theirTrigs[k]=(theirTrigs[k]||0)+1;});});});
      var myTrigs={};
      if(meM)meM.vids.slice(0,20).forEach(function(v){(detectTitleTriggers(v.title)||[]).forEach(function(k){myTrigs[k]=1;});});
      gap=Object.keys(theirTrigs).filter(function(k){return theirTrigs[k]>=3&&!myTrigs[k];}).sort(function(a,b){return theirTrigs[b]-theirTrigs[a];}).slice(0,6).map(function(k){return {k:k,n:theirTrigs[k]};});
    }catch(e){}
    /* weekly trends */
    var trends=[];
    var niche=(q('#rvNiche')||{}).value.trim();
    if(niche){
      try{
        var after=new Date(Date.now()-7*864e5).toISOString();
        var s=await ytFetch('search?part=snippet&type=video&order=viewCount&maxResults=12&publishedAfter='+encodeURIComponent(after)+'&q='+encodeURIComponent(niche));
        var tIds=(s.items||[]).filter(function(i){return i.id&&i.id.videoId;}).map(function(i){return i.id.videoId;});
        if(tIds.length){var tv=await getVideos(tIds);trends=tv.filter(function(v){return v.age<=7;}).sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,6);}
      }catch(e){}
    }
    /* render */
    var html='<div class="v4-panel" style="margin-bottom:14px"><h3>'+(meM?'Ты vs конкуренты':'Карта конкурентов')+'</h3><div class="v4r-chart"><canvas id="rvChart"></canvas></div>'+(meM?'':'<div class="v4-note">Прогони аудит своего канала — добавлю твою линию на карту.</div>')+'</div>';
    if(hits.length)html+='<div class="v4-panel" style="margin-bottom:14px"><h3>🔥 Что выстрелило у них за 30 дней</h3>'+hits.slice(0,7).map(function(h,i){return '<a class="v4r-hit" style="animation-delay:'+(i*60)+'ms" href="https://youtube.com/watch?v='+h.v.id+'" target="_blank" rel="noopener"><img src="'+esc(h.v.thumb)+'" alt=""/><div style="min-width:0"><div class="t">'+esc(h.v.title)+'</div><div class="m">'+esc(h.ch)+' · '+v4fmt(h.v.views)+' за '+h.v.age+' дн.</div></div><span class="x">×'+h.x.toFixed(1)+'</span></a>';}).join('')+'</div>';
    else html+='<div class="v4-panel" style="margin-bottom:14px"><h3>🔥 Хиты за 30 дней</h3><div class="v4-note" style="margin:0">За последний месяц явных выбросов у конкурентов нет — ниша спокойная, время обгонять.</div></div>';
    if(gap.length)html+='<div class="v4-panel" style="margin-bottom:14px"><h3>🧩 Приёмы, которые они юзают, а ты нет</h3><div class="v4-gap">'+gap.map(function(g){return '<span>⚡ '+esc(trigName(g.k))+' · у них '+g.n+' раз</span>';}).join('')+'</div><div class="v4-note">Это триггеры из их заголовков за последние ролики, которых нет в твоих. Попробуй 1-2 в следующем видео.</div></div>';
    if(trends.length)html+='<div class="v4-panel" style="margin-bottom:14px"><h3>📈 Тренды недели в нише «'+esc(niche)+'»</h3>'+trends.map(function(v,i){return '<a class="v4r-hit" style="animation-delay:'+(i*60)+'ms" href="https://youtube.com/watch?v='+v.id+'" target="_blank" rel="noopener"><img src="'+esc(v.thumb)+'" alt=""/><div style="min-width:0"><div class="t">'+esc(v.title)+'</div><div class="m">'+v4fmt(v.views)+' за '+v.age+' дн. · '+v4fmt(v.viewsPerDay)+'/день</div></div><span class="x">🚀</span></a>';}).join('')+'<div class="v4-note">Свежие ролики младше 7 дней, которые уже набирают темп — успей на волну.</div></div>';
    out.innerHTML=html;
    /* radar chart */
    try{
      if(radarChart){radarChart.destroy();radarChart=null;}
      var palette=['#36c2ff','#ffb020','#8b5cf6','#36e07a','#ff7a4d'];
      var ds=data.map(function(d,i){return {label:d.r.title,data:axesOf(d.m),borderColor:palette[i%palette.length],backgroundColor:'transparent',pointRadius:2.5,borderWidth:2};});
      if(meM)ds.unshift({label:(me?me.title:'Ты')+' (ты)',data:axesOf(meM),borderColor:'#FF2D55',backgroundColor:'rgba(255,45,85,.14)',fill:true,pointRadius:3,borderWidth:2.5});
      radarChart=new Chart(q('#rvChart'),{type:'radar',data:{labels:axes,datasets:ds},options:{maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,boxWidth:8,color:'#cfced6',font:{size:11}}}},scales:{r:{min:0,max:100,ticks:{display:false},grid:{color:'rgba(255,255,255,.08)'},angleLines:{color:'rgba(255,255,255,.08)'},pointLabels:{color:'#9b99a3',font:{size:11}}}}}});
    }catch(e){}
    try{markUsed('radar_run');checkAchievements();}catch(e){}
  }catch(e){out.innerHTML='<div class="v4-err">Радар не взлетел: '+esc(e.message||'ошибка')+'</div>';}
  btn.disabled=false;
}

/* ============================================================ */
/* 5. PROGRESS + GAMIFICATION                                    */
/* ============================================================ */
var ACHV_KEY='v4_achv_v1';
var ACHV=[
  {id:'first_audit',ic:'🧠',name:'Первый аудит',desc:'Проанализировал свой первый канал'},
  {id:'three_audits',ic:'🔁',name:'Серийный аналитик',desc:'3+ аудита в истории'},
  {id:'first_shoot',ic:'🎬',name:'Первый план',desc:'Сохранил план съёмки'},
  {id:'first_pub',ic:'🚀',name:'Опубликовано!',desc:'Довёл ролик от плана до публикации'},
  {id:'streak3',ic:'🔥',name:'Стрик ×3',desc:'3 съёмки подряд без пропуска недели'},
  {id:'lab_user',ic:'🖼️',name:'Лаборант',desc:'Прогнал превью через лабораторию'},
  {id:'arena_user',ic:'⚔️',name:'Гладиатор',desc:'Провёл бой заголовков на арене'},
  {id:'xray_user',ic:'🔬',name:'Рентгенолог',desc:'Разобрал чужой ролик по ссылке'},
  {id:'radar_user',ic:'📡',name:'Радарщик',desc:'Запустил тренд-радар'},
  {id:'growth10',ic:'📈',name:'+10% к медиане',desc:'Медиана просмотров выросла на 10%+'},
  {id:'week_done',ic:'✅',name:'Неделя закрыта',desc:'Выполнил все задачи недели в плане'}
];
function achvGet(){return lget(ACHV_KEY,{});}
function unlockAchv(id){
  var a=achvGet();
  if(a[id])return false;
  a[id]=Date.now();lset(ACHV_KEY,a);
  var meta=ACHV.filter(function(x){return x.id===id;})[0];
  if(meta){toast('🏆 Достижение: '+meta.name,'ok',3600);v4Confetti();}
  return true;
}
function weekKey(ts){var d=new Date(ts);var on=new Date(d.getFullYear(),0,1);var w=Math.floor(((d-on)/864e5+on.getDay())/7);return d.getFullYear()+'-'+w;}
function shootStreak(){
  var sh=[];try{sh=loadShoots();}catch(e){}
  var done=sh.filter(function(s){return s.status==='shot'||s.status==='pub';});
  if(!done.length)return {streak:0,weeks:[],total:sh.length,pub:sh.filter(function(s){return s.status==='pub';}).length};
  var wk={};done.forEach(function(s){wk[weekKey(s.created)]=1;});
  var streak=0;var now=Date.now();
  for(var i=0;i<26;i++){var k=weekKey(now-i*7*864e5);if(wk[k])streak++;else if(i>0)break;}
  var weeks=[];for(var j=7;j>=0;j--)weeks.push(!!wk[weekKey(now-j*7*864e5)]);
  return {streak:streak,weeks:weeks,total:sh.length,pub:sh.filter(function(s){return s.status==='pub';}).length};
}
function healthScore(){
  var parts=[];
  var hist=[];var ch=null;
  try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){ch=STATE.channel;hist=loadHistory(ch.id);}}catch(e){}
  var all=[];try{all=[].concat(STATE.shorts||[],STATE.longs||[]);}catch(e){}
  /* growth */
  var growth=50;
  if(hist.length>=2){var a=hist[hist.length-2],b=hist[hist.length-1];var gm=a.medVpd>0?(b.medVpd/a.medVpd-1):0;var gs=a.subs>0?(b.subs/a.subs-1):0;growth=clamp(50+gm*220+gs*420,0,100);}
  parts.push({l:'Динамика роста',v:Math.round(growth),c:'#36e07a',hint:hist.length>=2?'по сравнению с прошлым замером':'нужно 2+ замера — прогоняй аудит регулярно'});
  /* engagement */
  var eng=all.length?all.reduce(function(s,v){return s+v.engagement;},0)/all.length*100:0;
  parts.push({l:'Вовлечённость',v:Math.round(clamp(eng*18,0,100)),c:'#36c2ff',hint:eng?eng.toFixed(1)+'% лайки+комменты':'нет данных'});
  /* freq: uploads last 30d */
  var rec=all.filter(function(v){return v.age<=30;}).length;
  parts.push({l:'Регулярность',v:Math.round(clamp(rec/8*100,0,100)),c:'#ffb020',hint:rec+' роликов за 30 дней'});
  /* discipline: shoots streak */
  var st=shootStreak();
  parts.push({l:'Дисциплина съёмок',v:Math.round(clamp(st.streak*25+st.pub*10,0,100)),c:'#ff7a4d',hint:st.streak?('стрик '+st.streak+' нед.'):'снимай по планам из «Моих съёмок»'});
  var total=Math.round(parts.reduce(function(s,p){return s+p.v;},0)/parts.length);
  return {total:total,parts:parts,hist:hist,ch:ch,streak:st};
}
function checkAchievements(){
  try{
    var used=lget('v4_used',{});
    var sh=[];try{sh=loadShoots();}catch(e){}
    var hist=[];try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel)hist=loadHistory(STATE.channel.id);}catch(e){}
    try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel)unlockAchv('first_audit');}catch(e){}
    var allKeys=Object.keys(localStorage).filter(function(k){return k.indexOf('tph:')===0;});
    if(allKeys.length>=3)unlockAchv('three_audits');
    if(sh.length)unlockAchv('first_shoot');
    if(sh.some(function(s){return s.status==='pub';}))unlockAchv('first_pub');
    var st=shootStreak();if(st.streak>=3)unlockAchv('streak3');
    if(used.plab)unlockAchv('lab_user');
    if(used.arena_run)unlockAchv('arena_user');
    if(used.xray_run)unlockAchv('xray_user');
    if(used.radar_run)unlockAchv('radar_user');
    if(hist.length>=2){var a=hist[hist.length-2],b=hist[hist.length-1];if(a.medVpd>0&&b.medVpd/a.medVpd>=1.10)unlockAchv('growth10');}
  }catch(e){}
}
RENDERERS.prog=function(){
  var el=q('#v4body_prog');if(!el)return;
  checkAchievements();
  var h=healthScore();
  var col=h.total>=70?'#7ee0a2':h.total>=45?'#ffcf7a':'#ff8da1';
  var parts=h.parts.map(function(p){return '<div class="v4p-part"><div class="l"><b>'+p.l+'</b><span>'+p.v+' / 100 · '+esc(p.hint)+'</span></div><div class="v4p-bar"><i data-w="'+p.v+'" style="background:'+p.c+'"></i></div></div>';}).join('');
  var html='<div class="v4p-hero"><div class="v4p-ring" style="background:conic-gradient('+col+' '+(h.total*3.6)+'deg,rgba(255,255,255,.08) 0)"><b id="v4HealthNum" style="color:'+col+'">0</b><small>ЗДОРОВЬЕ</small></div><div class="v4p-parts">'+parts+'</div></div>';
  /* deltas + chart */
  if(h.hist.length>=2){
    var a=h.hist[h.hist.length-2],b=h.hist[h.hist.length-1];
    function delta(label,va,vb,suf){var d=vb-va;var pc=va>0?Math.round((vb/va-1)*100):0;var cls=Math.abs(d)<1e-9?'flat':(d>0?'up':'down');var ar=cls==='up'?'▲':cls==='down'?'▼':'■';return '<div class="v4p-card"><div class="l">'+label+'</div><div class="v">'+v4fmt(vb)+(suf||'')+'</div><div class="d '+cls+'">'+ar+' '+(pc>0?'+':'')+pc+'%</div></div>';}
    html+='<div class="v4p-cards">'+delta('Подписчики',a.subs,b.subs)+delta('Медиана просм./день',a.medVpd,b.medVpd)+delta('Просмотры всего',a.totalViews,b.totalViews)+delta('Вовлечённость',a.eng,b.eng,'%')+'</div>';
    html+='<div class="v4-panel" style="margin-top:14px"><h3>Динамика '+(h.ch?'· '+esc(h.ch.title):'')+'</h3><div class="v4p-chart"><canvas id="v4ProgChart"></canvas></div><div class="v4-note">Каждый аудит сохраняет замер. Чем чаще проверяешь канал — тем точнее график.</div></div>';
  }else{
    html+='<div class="v4-panel" style="margin-top:14px"><div class="v4-empty"><span class="big">📅</span>'+(h.ch?'Это первый замер канала «'+esc(h.ch.title)+'» — точка отсчёта сохранена.<br/>Прогони аудит через несколько дней, и здесь появятся графики роста и дельты.':'Прогони аудит своего канала на главной — каждый запуск сохраняет замер, и здесь появится динамика роста.')+'</div></div>';
  }
  /* streak */
  var st=h.streak;
  html+='<div class="v4-streak"><span class="fl">🔥</span><div><b>'+st.streak+'</b> '+(st.streak===1?'неделя':st.streak>=2&&st.streak<=4?'недели':'недель')+' съёмок подряд<div class="tx">Снято или опубликовано видео из «Моих съёмок» — неделя засчитана. Закрой текущую неделю, чтобы продлить стрик.</div><div class="v4-weekdots">'+st.weeks.map(function(w){return '<i class="'+(w?'on':'')+'"></i>';}).join('')+'</div></div></div>';
  /* achievements */
  var unlocked=achvGet();
  html+='<div class="v4-panel" style="margin-top:14px"><h3>🏆 Достижения · '+Object.keys(unlocked).length+' из '+ACHV.length+'</h3><div class="v4-ach-grid">'+ACHV.map(function(a2){var on=!!unlocked[a2.id];return '<div class="v4-ach '+(on?'unlocked':'lock')+'"><span class="ic">'+a2.ic+'</span><b>'+a2.name+'</b><small>'+a2.desc+'</small></div>';}).join('')+'</div></div>';
  el.innerHTML=html;
  countUpEl(q('#v4HealthNum'),h.total);
  qa('.v4p-bar i',el).forEach(function(b){requestAnimationFrame(function(){setTimeout(function(){b.style.width=b.getAttribute('data-w')+'%';},80);});});
  if(h.hist.length>=2){
    try{
      var labels=h.hist.map(function(s){return s.date.slice(5);});
      new Chart(q('#v4ProgChart'),{type:'line',data:{labels:labels,datasets:[{label:'Медиана просм./день',data:h.hist.map(function(s){return s.medVpd;}),borderColor:'#FF2D55',backgroundColor:'rgba(255,45,85,.12)',tension:.35,fill:true,pointRadius:3},{label:'Подписчики',data:h.hist.map(function(s){return s.subs;}),borderColor:'#36c2ff',backgroundColor:'transparent',tension:.35,pointRadius:3,yAxisID:'y1'}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{usePointStyle:true,boxWidth:8,color:'#cfced6'}}},scales:{y:{ticks:{callback:function(v){return v4fmt(v);},color:'#9b99a3'},grid:{color:'rgba(255,255,255,.06)'}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:function(v){return v4fmt(v);},color:'#9b99a3'}},x:{ticks:{color:'#9b99a3'},grid:{display:false}}}}});
    }catch(e){}
  }
};

/* ============================================================ */
/* 6. SCRIPTWRITER STUDIO + SHORTS CONVEYOR                      */
/* ============================================================ */
var SCR_LAST=null;
RENDERERS.script=function(){
  var el=q('#v4body_script');if(!el)return;
  if(el.__built)return;el.__built=true;
  el.innerHTML='<div class="v4-cols"><div class="v4-panel"><h3>Сценарий под удержание</h3>'+
    '<div class="v4-lab">Тема ролика</div><input class="v4-in" id="scTopic" placeholder="например: 5 ошибок новичка в монтаже"/>'+
    '<div class="v4-lab">Формат</div><div class="v4-seg" id="scFmt"><button class="on" data-f="long">🎥 Длинное</button><button data-f="shorts">⚡ Shorts</button></div>'+
    '<div class="v4-lab">Длительность</div><select class="v4-in" id="scDur"><option value="5-7 минут">5–7 минут</option><option value="8-12 минут" selected>8–12 минут</option><option value="15-20 минут">15–20 минут</option></select>'+
    '<div class="v4-lab">Аудитория и стиль (необязательно)</div><input class="v4-in" id="scAud" placeholder="новички, дружелюбно, без воды"/>'+
    '<div class="v4-row" style="margin-top:12px"><button class="v4-btn" id="scGo">🎬 Написать сценарий</button></div>'+
    '<div class="v4-note">Сценарий строится по правилам удержания: жёсткий хук, перебивки каждые 25–30 секунд, открытые петли и сильный финал. Кривая покажет, где зритель рискует уйти.</div></div>'+
    '<div id="scOut"><div class="v4-empty"><span class="big">🎬</span>Введи тему — соберу полный сценарий с таймкодами, разметкой удержания и кривой внимания.<br/>Потом нарежем его на 3–5 Shorts.</div></div></div>';
  qa('#scFmt button').forEach(function(b){b.addEventListener('click',function(){qa('#scFmt button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');var sh=b.getAttribute('data-f')==='shorts';q('#scDur').innerHTML=sh?'<option value="30 секунд" selected>~30 секунд</option><option value="60 секунд">~60 секунд</option>':'<option value="5-7 минут">5–7 минут</option><option value="8-12 минут" selected>8–12 минут</option><option value="15-20 минут">15–20 минут</option>';});});
  q('#scGo').addEventListener('click',scriptRun);
  try{var p=lget('viora_profile_v1',null);if(p&&p.context)q('#scAud').value=p.context;}catch(e){}
};
function retentionSVG(blocks){
  var n=blocks.length;if(n<2)return '';
  var Wd=640,H=150,pad=26;
  var pts=blocks.map(function(b,i){
    var risk=+b.risk||clamp(20+i*8,15,70);
    var x=pad+i*(Wd-2*pad)/(n-1);
    var y=pad+ (clamp(risk,5,95)/100)*(H-2*pad);
    return {x:x,y:y,b:b};
  });
  var path='M'+pts.map(function(p){return p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' L');
  var dots=pts.map(function(p,i){var hot=(+p.b.risk||0)>=55;return '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="5" fill="'+(hot?'#ff2d55':'#36e07a')+'"><title>'+esc(p.b.time||'')+' · '+esc(p.b.block||'')+' · риск ухода '+(p.b.risk||'—')+'%</title></circle><text x="'+p.x.toFixed(1)+'" y="'+(H-6)+'" text-anchor="middle" font-size="9" fill="#9b99a3">'+esc((p.b.time||'').split('–')[0]||'')+'</text>';}).join('');
  return '<svg viewBox="0 0 '+Wd+' '+H+'" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg">'+
    '<text x="'+pad+'" y="14" font-size="10" fill="#9b99a3">↑ выше точка — выше риск потерять зрителя</text>'+
    '<path d="'+path+'" fill="none" stroke="url(#v4g)" stroke-width="2.5" stroke-linecap="round"/><defs><linearGradient id="v4g" x1="0" x2="1"><stop offset="0" stop-color="#36e07a"/><stop offset="1" stop-color="#ff2d55"/></linearGradient></defs>'+dots+'</svg>';
}
async function scriptRun(){
  var out=q('#scOut'),btn=q('#scGo');
  var topic=(q('#scTopic')||{}).value.trim();
  if(!topic){toast('Введи тему ролика','warn');return;}
  var fmt=q('#scFmt .on').getAttribute('data-f')==='shorts'?'Shorts':'Длинное видео';
  var dur=(q('#scDur')||{}).value;var aud=(q('#scAud')||{}).value.trim();
  btn.disabled=true;out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Сценарист пишет: хук, петли, перебивки…</span></div>';
  try{
    var brief=myChannelBrief();
    var sys='Ты — сценарист YouTube, эксперт по удержанию. Напиши ПОЛНЫЙ сценарий ролика с разметкой удержания: жёсткий хук без приветствий (первые 10-15 сек, дословно), перебивка/ре-хук каждые 25-30 секунд (смена плана, вопрос, обещание, петля), открытые петли (что пообещали и когда закрыли), сильный финал с CTA. Текст «say» — дословные слова автора, живым разговорным языком, без канцелярита. У каждого блока: таймкод, что говорить, что показывать (b-roll/графика), приём удержания и risk — оценка риска ухода зрителя в этой точке 0-100 (хук обычно 25-45, середина растёт, перед финалом пик). Пиши по-русски. Верни СТРОГО валидный JSON без markdown: {"title":"рабочий заголовок по ВИСП","hook":"дословный текст хука","blocks":[{"time":"0:00–0:25","block":"название блока","say":"дословный текст 2-4 предложения","visual":"что в кадре/перебивка","hold":"приём удержания в этой точке","risk":35}],"loops":["петля: где открыта → где закрыта"],"cta":"финал и призыв дословно","tips":["3 совета по съёмке именно этого сценария"]}';
    var usr='Тема: «'+topic+'». Формат: '+fmt+', длительность: '+dur+'.'+(aud?' Аудитория/стиль: '+aud+'.':'')+(brief?' Канал автора: '+JSON.stringify(brief):'');
    var d=await aiJson(sys,usr,3200);
    if(!d||!Array.isArray(d.blocks)||!d.blocks.length)throw new Error('пустой сценарий');
    SCR_LAST={d:d,topic:topic,fmt:fmt,dur:dur};W.__SCR_LAST=SCR_LAST;
    var blocks=d.blocks.map(function(b,i){return '<div class="v4s-block" style="animation-delay:'+(i*60)+'ms"><span class="tc">'+esc(b.time||'')+'</span><div class="bd"><div class="bn">'+esc(b.block||'Блок '+(i+1))+'</div><div class="say">'+esc(b.say||'')+'</div>'+(b.visual?'<div class="vis">🎥 <b>В кадре:</b> '+esc(b.visual)+'</div>':'')+(b.hold?'<span class="ret">🧲 '+esc(b.hold)+'</span>':'')+'</div></div>';}).join('');
    var loops=(d.loops||[]).map(function(l){return '<li>🔄 '+esc(l)+'</li>';}).join('');
    out.innerHTML='<div id="scDoc">'+
      '<div class="v4-panel" style="margin-bottom:12px"><h3>Сценарий · '+esc(fmt)+' · '+esc(dur)+'</h3>'+
      (d.title?'<div style="font-weight:700;font-size:16px;line-height:1.4;margin-bottom:10px">'+esc(d.title)+'</div>':'')+
      '<div class="v4s-curve"><div class="v4-lab" style="margin-top:0">Кривая внимания по сценарию</div>'+retentionSVG(d.blocks)+'</div>'+
      '<div class="v4s-hook"><div class="lb">🎤 Хук — говори дословно</div>'+esc(d.hook||'')+'</div>'+blocks+
      (d.cta?'<div class="v4s-hook" style="background:linear-gradient(135deg,rgba(54,224,122,.1),rgba(54,194,255,.05));border-color:rgba(54,224,122,.3)"><div class="lb" style="color:#7ee0a2">🏁 Финал + CTA</div>'+esc(d.cta)+'</div>':'')+
      (loops?'<div class="v4-aicard"><h4>🔄 Открытые петли</h4><ul>'+loops+'</ul></div>':'')+
      ((d.tips&&d.tips.length)?'<div class="v4-aicard"><h4>💡 Советы по съёмке</h4><ul>'+d.tips.map(function(t){return '<li>'+esc(t)+'</li>';}).join('')+'</ul></div>':'')+
      '</div></div>'+
      '<div class="v4-row" style="margin:4px 0 16px"><button class="v4-btn ghost" id="scPdf">📄 Скачать PDF</button><button class="v4-btn ghost" id="scSave">💾 В «Мои съёмки»</button><button class="v4-btn ghost" onclick="v5Music(this)">🎵 Музыка</button><button class="v4-btn ghost" onclick="v5DescTags(this)">📝 Описание и теги</button><button class="v4-btn" id="scShorts">⚡ Нарезать на Shorts</button></div><div id="v5MusicOut"></div><div id="v5DescOut"></div><div id="scShortsOut"></div>';
    q('#scPdf').addEventListener('click',scriptPdf);
    q('#scSave').addEventListener('click',scriptSave);
    q('#scShorts').addEventListener('click',shortsRun);
    toast('Сценарий готов 🎬','ok',2600);
  }catch(e){out.innerHTML='<div class="v4-err">Сценарист споткнулся: '+esc(e.message||'AI недоступна')+'. Попробуй ещё раз.</div>';}
  btn.disabled=false;
}
function scriptSave(){
  if(!SCR_LAST)return;var d=SCR_LAST.d;
  try{
    if(typeof saveShootPlan!=='function')throw new Error('нет хранилища');
    saveShootPlan({idea:SCR_LAST.topic,why:'Сценарий из Сценарист-студии',format:SCR_LAST.fmt==='Shorts'?'Shorts':'Длинное',duration:SCR_LAST.dur,titles:d.title?[{title:d.title,note:'из студии'}]:[],hook:d.hook||'',structure:(d.blocks||[]).map(function(b){return {block:b.block||'',what:b.say||'',time:b.time||''};}),thumb:{},publish:{},checklist:(d.tips||[]),pitfalls:[]});
    toast('Сохранил в «Мои съёмки» ✅','ok',2600);
  }catch(e){toast('Не получилось сохранить','warn');}
}
async function scriptPdf(){
  var btn=q('#scPdf');var node=q('#scDoc');if(!node)return;
  btn.disabled=true;btn.textContent='⏳ Готовлю PDF…';
  try{
    if(W.vEnsureLib){await W.vEnsureLib('html2canvas');await W.vEnsureLib('jspdf');}
    var canvas=await html2canvas(node,{backgroundColor:'#0d0c0f',scale:1.5,useCORS:true,logging:false});
    var img=canvas.toDataURL('image/jpeg',0.92);
    var jsPDF=(W.jspdf||{}).jsPDF;var pdf=new jsPDF('p','mm','a4');
    var pw=210,ph=297,iw=pw,ih=canvas.height*pw/canvas.width,pos=0,left=ih;
    pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;
    while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}
    pdf.save('Viora_Сценарий.pdf');
    toast('PDF сохранён 📄','ok',2400);
  }catch(e){toast('Не удалось собрать PDF: '+(e.message||''),'warn',3000);}
  btn.disabled=false;btn.textContent='📄 Скачать PDF';
}
async function shortsRun(){
  var out=q('#scShortsOut'),btn=q('#scShorts');if(!SCR_LAST)return;
  btn.disabled=true;out.innerHTML='<div class="v4-aicard"><span class="v4-spin"></span> <span style="color:var(--muted);font-size:13px"> Конвейер режет тему на Shorts…</span></div>';
  try{
    var d=SCR_LAST.d;
    var sys='Ты — продюсер Shorts. Из темы и сценария длинного ролика сделай план на 3-5 самостоятельных Shorts (вертикальные, до 60 сек). У каждого: цепляющий заголовок, дословный хук первых 2 секунд (самое важное!), 3-4 бита структуры с таймингом (0-2с хук, 2-15с суть, 15-45с развитие, финал-петля на длинный ролик или подписку). Каждый Short — законченная мысль, не «отрывок». Пиши по-русски. Верни СТРОГО валидный JSON без markdown: {"shorts":[{"title":"заголовок","hook":"дословные первые 2 секунды","beats":[{"time":"0–2 c","what":"что происходит"}],"cta":"финальная фраза"}]}';
    var usr='Тема длинного ролика: «'+SCR_LAST.topic+'». Хук: '+JSON.stringify(d.hook||'')+'. Блоки: '+JSON.stringify((d.blocks||[]).map(function(b){return b.block+': '+(b.say||'').slice(0,90);}));
    var r=await aiJson(sys,usr,2600);
    var shorts=(r&&Array.isArray(r.shorts))?r.shorts.slice(0,5):[];
    if(!shorts.length)throw new Error('конвейер вернул пусто');
    W.__v4Shorts=shorts;
    out.innerHTML='<div class="v4-panel"><h3>⚡ Shorts-конвейер · '+shorts.length+' шт.</h3><div class="v4-shorts-grid">'+shorts.map(function(s,i){
      return '<div class="v4-short" style="animation-delay:'+(i*70)+'ms"><div class="num">SHORT '+(i+1)+'</div><h4>'+esc(s.title||'')+'</h4><div class="hk">🎤 '+esc(s.hook||'')+'</div><ul>'+(s.beats||[]).map(function(b){return '<li><b>'+esc(b.time||'')+'</b> — '+esc(b.what||'')+'</li>';}).join('')+'</ul>'+(s.cta?'<div style="font-size:12.5px;color:#9ef0bb">🏁 '+esc(s.cta)+'</div>':'')+'<div class="v4-row" style="margin-top:10px"><button class="v4-btn sm ghost" onclick="v4ShortSave('+i+')">💾 В мои съёмки</button></div></div>';
    }).join('')+'</div></div>';
    toast('Готово: '+shorts.length+' Shorts ⚡','ok',2600);
  }catch(e){out.innerHTML='<div class="v4-err">Не получилось нарезать: '+esc(e.message||'AI недоступна')+'</div>';}
  btn.disabled=false;
}
W.v4ShortSave=function(i){
  var s=(W.__v4Shorts||[])[i];if(!s)return;
  try{
    saveShootPlan({idea:s.title||'Short',why:'Из Shorts-конвейера',format:'Shorts',duration:'до 60 секунд',titles:[{title:s.title||'',note:'хук-формат'}],hook:s.hook||'',structure:(s.beats||[]).map(function(b){return {block:b.time||'',what:b.what||'',time:b.time||''};}),thumb:{},publish:{},checklist:[],pitfalls:[]});
    toast('Short сохранён в «Мои съёмки» ✅','ok',2400);
  }catch(e){toast('Не получилось сохранить','warn');}
};

/* ============================================================ */
/* 7. EDITOR AI AGENT — Виора видит и правит текст               */
/* ============================================================ */
var V4E={pending:null,backup:null,sel:null};
/* track last selection inside the editor body (survives focus loss to chat input) */
D.addEventListener('selectionchange',function(){
  try{
    var s=W.getSelection();if(!s||!s.rangeCount||s.isCollapsed)return;
    var body=q('#veBody');if(!body)return;
    var n=s.anchorNode;var inside=false;
    while(n){if(n===body){inside=true;break;}n=n.parentNode;}
    if(inside){V4E.sel={text:s.toString(),range:s.getRangeAt(0).cloneRange(),ts:Date.now()};}
  }catch(e){}
});
function v4eSel(){
  if(V4E.sel&&V4E.sel.text&&V4E.sel.text.trim().length>2&&Date.now()-V4E.sel.ts<120000)return V4E.sel;
  return null;
}
function v4eAddMsg(role,html){var f=W.__veAddMsg;if(typeof f==='function')return f(role,html);return null;}
function v4eBodyText(){var b=q('#veBody');return b?b.innerText:'';}
function v4eCtx(){var t=(q('#veTitle')||{}).innerText||'';return ('Заголовок: '+t+'\n\nТекст поста:\n'+v4eBodyText()).slice(0,5000);}
function textToParas(t){
  return String(t||'').trim().split(/\n{2,}/).map(function(p){return '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>';}).join('');
}
function v4eDetect(txt){
  var l=txt.toLowerCase();
  if(/исправ|ошибк|орфограф|опечат|запят|грамот/.test(l))return 'fix';
  if(/допиш|продолж|закончи|дальше|еще абзац|ещё абзац|финал|концовк/.test(l))return 'continue';
  if(/сократ|короче|урежь|сожми|убери воду|лаконич/.test(l))return 'shorten';
  if(/усиль|перепиш|переформулируй|улучши|сильнее|цепляюще|живее|переделай/.test(l))return 'rewrite';
  return null;
}
var V4E_ACTIONS={
  fix:{label:'✏️ Исправить ошибки',busy:'Вычитываю текст…',mode:'replace',
    sys:'Ты — редактор-корректор. Исправь в тексте орфографию, пунктуацию и явные стилистические ошибки. НЕ меняй смысл, структуру и авторский тон. Сохрани разбивку на абзацы (раздели абзацы пустой строкой). Верни СТРОГО JSON: {"text":"исправленный текст целиком","notes":["2-4 коротких пункта, что исправлено"]}'},
  shorten:{label:'✂️ Сократить',busy:'Убираю воду…',mode:'replace',
    sys:'Ты — редактор. Сократи текст примерно на треть: убери воду, повторы и канцелярит, сохрани все ключевые мысли, факты и авторский тон. Сохрани разбивку на абзацы (пустая строка между абзацами). Верни СТРОГО JSON: {"text":"сокращённый текст целиком","notes":["что убрал"]}'},
  rewrite:{label:'🔥 Усилить',busy:'Усиливаю формулировки…',mode:'replace',
    sys:'Ты — сильный копирайтер. Перепиши текст мощнее: цепляющее начало, живой ритм, конкретика вместо общих слов, никаких клише. Смысл и факты сохрани. Сохрани разбивку на абзацы (пустая строка между абзацами). Верни СТРОГО JSON: {"text":"усиленный текст целиком","notes":["что усилил"]}'},
  continue:{label:'➕ Дописать',busy:'Дописываю…',mode:'append',
    sys:'Ты — соавтор. Продолжи текст в том же стиле, тоне и логике: 1-3 абзаца, которые органично развивают и/или завершают мысль. Верни СТРОГО JSON: {"text":"ТОЛЬКО продолжение, без повтора исходного текста","notes":["что добавил"]}'}
};
async function v4eRun(action,userHint){
  var act=V4E_ACTIONS[action];if(!act)return;
  var body=q('#veBody');if(!body)return;
  var sel=act.mode==='replace'?v4eSel():null;
  var src=sel?sel.text:v4eBodyText();
  if(!src.trim()){v4eAddMsg('bot','Пока нечего обрабатывать — напиши сначала текст поста ✍️');return;}
  var ph=v4eAddMsg('bot','<span class="ve-spin"></span> <span class="ve-muted">'+act.busy+(sel?' (только выделенный фрагмент)':'')+'</span>');
  try{
    var usr=(userHint?('Пожелание автора: '+userHint+'\n\n'):'')+(sel?'Фрагмент для обработки:\n'+src.slice(0,4500):'Текст целиком:\n'+src.slice(0,4500))+(action==='continue'?'\n\nЗаголовок поста: '+((q('#veTitle')||{}).innerText||''):'');
    var r=await aiJson(act.sys,usr,2400);
    var newText=r&&(r.text||r.reply);
    if(!newText||typeof newText!=='string')throw new Error('пустой ответ');
    V4E.pending={action:action,mode:act.mode,sel:sel,text:newText};
    var notes=(r.notes||[]).slice(0,4).map(function(n){return '<li>'+esc(n)+'</li>';}).join('');
    if(ph)ph.innerHTML='<div class="v4e-act"><div class="lb">'+act.label+' · '+(sel?'фрагмент':act.mode==='append'?'продолжение':'весь текст')+'</div><div class="tx">'+esc(newText)+'</div>'+(notes?'<ul style="margin:8px 0 0;padding-left:16px;font-size:12px;color:var(--muted);line-height:1.5">'+notes+'</ul>':'')+'<div class="bt"><button class="ok" onclick="v4eApply()">✅ Применить</button><button class="no" onclick="v4eCancel(this)">Отмена</button></div></div>';
    var box=q('#veAiMsgs');if(box)box.scrollTop=box.scrollHeight;
  }catch(e){if(ph)ph.innerHTML='Не получилось ('+esc(e.message||'AI недоступна')+'). Попробуй ещё раз.';}
}
W.v4eApply=function(){
  var p=V4E.pending;if(!p)return;
  var body=q('#veBody');if(!body)return;
  V4E.backup=body.innerHTML;
  try{
    if(p.mode==='append'){
      body.innerHTML=body.innerHTML+textToParas(p.text);
    }else if(p.sel&&p.sel.range){
      var applied=false;
      try{
        var r=p.sel.range;
        if(r.startContainer&&r.startContainer.isConnected!==false&&body.contains(r.startContainer)){
          var s=W.getSelection();s.removeAllRanges();s.addRange(r);
          body.focus();
          D.execCommand('insertHTML',false,esc(p.text).replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>'));
          applied=true;
        }
      }catch(e){}
      if(!applied)body.innerHTML=textToParas(p.text);
    }else{
      body.innerHTML=textToParas(p.text);
    }
    try{if(W.__VR9D&&W.__VR9D.save)W.__VR9D.save();}catch(e){}
    var done=v4eAddMsg('bot','Готово ✅ Текст обновлён прямо в редакторе.<br/><button class="v4e-undo" onclick="v4eUndo(this)">↩ Вернуть как было</button>');
    V4E.pending=null;V4E.sel=null;
    qa('.v4e-act .bt').forEach(function(b){b.style.display='none';});
  }catch(e){v4eAddMsg('bot','Не получилось применить правку 😔');}
};
W.v4eCancel=function(btn){V4E.pending=null;try{btn.closest('.v4e-act').querySelector('.bt').style.display='none';v4eAddMsg('bot','Ок, оставил как есть.');}catch(e){}};
W.v4eUndo=function(btn){
  var body=q('#veBody');if(!body||V4E.backup==null)return;
  body.innerHTML=V4E.backup;V4E.backup=null;
  try{if(W.__VR9D&&W.__VR9D.save)W.__VR9D.save();}catch(e){}
  try{btn.style.display='none';}catch(e){}
  v4eAddMsg('bot','Вернул прежнюю версию ↩');
};
/* smarter veSend: detects edit intents, otherwise chats WITH full post context */
var origVeSend=W.veSend;
W.veSend=function(){
  var inp=q('#veAiInput');if(!inp)return;
  var txt=(inp.value||'').trim();if(!txt)return;
  var intent=v4eDetect(txt);
  if(intent){
    inp.value='';inp.style.height='auto';
    v4eAddMsg('me',esc(txt));
    v4eRun(intent,txt);
    return;
  }
  /* general question — answer with reliable JSON path + post context */
  inp.value='';inp.style.height='auto';
  v4eAddMsg('me',esc(txt));
  var ph=v4eAddMsg('bot','<span class="ve-spin"></span> <span class="ve-muted">Viora думает…</span>');
  var sel=v4eSel();
  aiJson('Ты — Viora, дружелюбный редактор и контент-помощник. Ты ВИДИШЬ текст поста автора и отвечаешь с опорой на него: конкретно, кратко, по-русски, без воды. Если автор просит что-то изменить в тексте — предложи готовый вариант формулировки. Верни СТРОГО JSON: {"reply":"твой ответ, можно с переносами строк"}',
    v4eCtx()+(sel?'\n\nВыделенный автором фрагмент: «'+sel.text.slice(0,800)+'»':'')+'\n\nСообщение автора: '+txt,900)
  .then(function(r){var ans=(r&&(r.reply||r.text))||'';if(ph)ph.innerHTML=esc(String(ans)||'Хм, не получилось. Попробуй ещё раз.').replace(/\n/g,'<br>');var box=q('#veAiMsgs');if(box)box.scrollTop=box.scrollHeight;})
  .catch(function(){if(ph)ph.innerHTML='Не получилось ответить, попробуй ещё раз.';});
};
/* quick-action chips inside the assistant panel */
function v4eChips(){
  var panel=q('#veAI');if(!panel||q('#v4eChips',panel))return;
  var inp=q('#veAiInput',panel);if(!inp)return;
  var bar=D.createElement('div');bar.id='v4eChips';
  bar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;padding:7px 10px 2px';
  bar.innerHTML=Object.keys(V4E_ACTIONS).map(function(k){return '<button data-a="'+k+'" style="border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.05);color:#dcdbe1;border-radius:9px;padding:6px 10px;font-size:11.5px;cursor:pointer;font-family:inherit">'+V4E_ACTIONS[k].label+'</button>';}).join('');
  var anchor=inp.closest('div')||inp;
  anchor.parentNode.insertBefore(bar,anchor);
  qa('button',bar).forEach(function(b){b.addEventListener('click',function(){v4eAddMsg('me',V4E_ACTIONS[b.getAttribute('data-a')].label);v4eRun(b.getAttribute('data-a'));});});
}
var origWriteOpen=W.vWriteOpen;
if(typeof origWriteOpen==='function'){
  W.vWriteOpen=function(seed){
    var r=origWriteOpen.apply(this,arguments);
    try{
      v4eChips();
      var box=q('#veAiMsgs');
      if(box&&!box.__v4hello){box.__v4hello=true;v4eAddMsg('bot','Кстати, теперь я умею править текст прямо здесь: выдели фрагмент (или ничего не выделяй — возьму весь пост) и нажми кнопку ниже, либо просто напиши «исправь ошибки», «сократи», «усиль» или «допиши» ✨');}
    }catch(e){}
    return r;
  };
}
/* «проверить» button now offers to apply fixes too */
var origVeCheck=W.veCheck;
W.veCheck=function(){
  W.veAiToggle&&W.veAiToggle(true);
  var b=v4eBodyText();
  if(!b.trim()){v4eAddMsg('bot','Напиши сначала текст — и я проверю его и сразу смогу исправить.');return;}
  v4eAddMsg('me','✏️ Проверь и исправь текст');
  v4eRun('fix');
};

/* ============================================================ */
/* 8. WIRING, POLISH, INIT                                       */
/* ============================================================ */
/* Esc closes any open v4 overlay */
D.addEventListener('keydown',function(e){
  if(e.key==='Escape'){var open=qa('.v4-ov.open');if(open.length){open.forEach(function(o){o.classList.remove('open');});D.body.style.overflow='';}}
});
/* confetti + achievements on shoot publish / plan week complete */
(function(){
  var orig=W.setShootStatus;
  if(typeof orig==='function'){W.setShootStatus=function(id,st){var r=orig.apply(this,arguments);try{if(st==='pub'){v4Confetti();}checkAchievements();}catch(e){}return r;};}
  var origPlan=W.v3PlanToggle;
  if(typeof origPlan==='function'){W.v3PlanToggle=function(w,t){var r=origPlan.apply(this,arguments);try{
    var pl=lget('viora_plan4w_v1',null);
    if(pl&&pl.weeks&&pl.weeks[w]){var wk=pl.weeks[w];var all=wk.tasks.length&&wk.tasks.every(function(x){return x.done;});
      var done=lget('v4_weeks_done',{});
      if(all&&!done[w]){done[w]=Date.now();lset('v4_weeks_done',done);v4Confetti();unlockAchv('week_done');toast('🎉 '+wk.t+' закрыта полностью! Так держать!','ok',4200);}
      if(!all&&done[w]){delete done[w];lset('v4_weeks_done',done);}
    }
  }catch(e){}return r;};}
})();
/* keep audit snapshot achievements fresh after dashboard renders */
(function(){
  var orig=W.renderDashboard;
  if(typeof orig==='function'){W.renderDashboard=function(){var r=orig.apply(this,arguments);try{setTimeout(checkAchievements,800);}catch(e){}return r;};}
})();
function v4Init(){
  try{buildDock();}catch(e){}
  try{buildHeroStrip();}catch(e){}
  try{checkAchievements();}catch(e){}
  /* hero re-renders on navigation in some flows — retry softly */
  var tries=0;var iv=setInterval(function(){tries++;try{buildHeroStrip();}catch(e){}if(tries>10)clearInterval(iv);},1500);
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',v4Init);else v4Init();
})();
