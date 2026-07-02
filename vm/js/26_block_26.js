/* ============ VIORA V12 · модуль 1: AI-продюсер-агент ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C){console.warn('v12: core missing');return;}
var q=C.q,esc=C.esc,fmt=C.fmt,S=C.S,chid=C.chid,ai=C.ai,ctx=C.ctx,med=C.med,lget=C.lget,lset=C.lset;

var FEED=null,BUSY=false;

function histKey(){return 'v12_agent:'+(chid()||'anon');}
function pushHist(role,html){
  try{var h=lget(histKey(),[]);h.push({r:role,h:html,t:Date.now()});if(h.length>40)h=h.slice(-40);lset(histKey(),h);}catch(e){}
}
function msg(role,html,save){
  if(!FEED)return null;
  var m=D.createElement('div');m.className='v12-msg '+(role==='user'?'user':'bot');
  m.innerHTML='<div class="ava">'+(role==='user'?'🙂':'🎬')+'</div><div class="bub">'+html+'</div>';
  FEED.appendChild(m);FEED.scrollTop=FEED.scrollHeight;
  if(save!==false)pushHist(role,html);
  return m;
}
function stepsCard(list){
  var el=D.createElement('div');el.className='v12-msg bot';
  el.innerHTML='<div class="ava">🎬</div><div class="bub"><div class="v12-steps">'+
    list.map(function(s,i){return '<div class="v12-step" data-i="'+i+'"><span class="dot">'+(i+1)+'</span><span>'+esc(s)+'</span></div>';}).join('')+'</div></div>';
  FEED.appendChild(el);FEED.scrollTop=FEED.scrollHeight;
  var idx=-1;
  return {
    next:function(){
      if(idx>=0){var p=el.querySelector('[data-i="'+idx+'"]');if(p){p.className='v12-step ok';p.querySelector('.dot').textContent='✓';}}
      idx++;var c=el.querySelector('[data-i="'+idx+'"]');if(c)c.className='v12-step run';
      FEED.scrollTop=FEED.scrollHeight;
    },
    done:function(){var p=el.querySelector('[data-i="'+idx+'"]');if(p){p.className='v12-step ok';p.querySelector('.dot').textContent='✓';}},
    fail:function(){var p=el.querySelector('[data-i="'+idx+'"]');if(p)p.className='v12-step';}
  };
}
function actBtn(label,fn){
  var b=D.createElement('button');b.className='v11-btn sm';b.textContent=label;b.addEventListener('click',fn);return b;
}
function copyBtn(label,text){
  return actBtn(label,function(){C.copyTxt(text,this);});
}
function addActs(m,btns){
  var w=D.createElement('div');w.className='v12-acts';btns.forEach(function(b){w.appendChild(b);});
  m.querySelector('.bub').appendChild(w);
}

/* ---------- competitor quick-scan (reuses v11 watchlist) ---------- */
async function compScan(){
  var list=lget('v11_comp:'+(chid()||''),[])||[];
  if(!list.length)return null;
  var vids=[];
  for(var i=0;i<Math.min(list.length,5);i++){
    try{
      var c=list[i];
      var ch=await W.ytFetch('channels?part=contentDetails&id='+c.id);
      var up=ch.items&&ch.items[0]&&ch.items[0].contentDetails.relatedPlaylists.uploads;
      if(!up)continue;
      var pl=await W.ytFetch('playlistItems?part=contentDetails&playlistId='+up+'&maxResults=6');
      var ids=(pl.items||[]).map(function(x){return x.contentDetails.videoId;});
      var vv=await W.getVideos(ids);
      vv.forEach(function(v){if(v.age<=8){v._comp=c.title;vids.push(v);}});
    }catch(e){}
  }
  vids.sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;});
  return vids.slice(0,6);
}
function compTxt(vids){
  if(!vids||!vids.length)return '';
  return '\nСВЕЖИЕ ХИТЫ КОНКУРЕНТОВ (за неделю):\n'+vids.map(function(v){return '- ['+v._comp+'] «'+v.title+'» — '+Math.round(v.viewsPerDay)+' просм/день';}).join('\n');
}

/* ---------- pipelines ---------- */
async function runNextVideo(extra){
  var st=stepsCard(['Изучаю данные канала','Смотрю свежие хиты конкурентов','Выбираю тему с максимальным потенциалом','Собираю заход, структуру и упаковку']);
  st.next();
  var base=ctx();st.next();
  var comp=null;try{comp=await compScan();}catch(e){}
  st.next();st.next();
  var sys='Ты — продюсер YouTube-канала. Отвечай СТРОГО валидным JSON без markdown: {"theme":"тема ролика","why":"почему именно она сейчас (с опорой на данные)","title":"готовый заголовок по формуле хитов канала","hook":"дословный текст первых 15 секунд","plan":["5-7 пунктов структуры ролика"],"thumb":"2-4 слова для превью КАПСОМ","tags":["8-10 тегов"]}. По-русски, конкретно, без воды.';
  var user='Подбери СЛЕДУЮЩИЙ ролик для канала.'+(extra?'\nПожелание автора: '+extra:'')+'\n'+base+compTxt(comp);
  try{
    var d=await ai(sys,user,1600);st.done();
    var planHtml=(d.plan||[]).map(function(p){return '<div class="kv">• '+esc(p)+'</div>';}).join('');
    var m=msg('bot','<b>🎬 Твой следующий ролик готов:</b>'+
      '<div class="v12-card"><h5>💡 '+esc(d.theme||'')+'</h5><div class="kv">'+esc(d.why||'')+'</div></div>'+
      '<div class="v12-card"><h5>📝 Заголовок</h5><div class="kv"><b>'+esc(d.title||'')+'</b></div><div class="kv">Превью: <b>'+esc(d.thumb||'')+'</b></div></div>'+
      '<div class="v12-card"><h5>🎙 Заход (первые 15 сек)</h5><div class="kv">'+esc(d.hook||'')+'</div></div>'+
      '<div class="v12-card"><h5>🧩 Структура</h5>'+planHtml+'</div>');
    var full='ТЕМА: '+d.theme+'\nЗАГОЛОВОК: '+d.title+'\nПРЕВЬЮ: '+d.thumb+'\nХУК: '+d.hook+'\nПЛАН:\n'+(d.plan||[]).map(function(p,i){return (i+1)+'. '+p;}).join('\n')+'\nТЕГИ: '+(d.tags||[]).join(', ');
    addActs(m,[
      copyBtn('📋 Копировать всё',full),
      actBtn('🏭 Собрать под ключ',function(){W.v12ConvOpen&&W.v12ConvOpen(d.theme);}),
      actBtn('🎨 Превью в студии',function(){W.v12ThumbOpen&&W.v12ThumbOpen(d.thumb);})
    ]);
  }catch(e){st.fail();msg('bot','⚠️ Не получилось: '+esc(e.message||e)+'. Попробуй ещё раз.');}
}
async function runDiagnose(){
  var st=stepsCard(['Собираю метрики канала','Ищу главные утечки роста','Формирую план лечения']);
  st.next();var base=ctx();st.next();st.next();
  var sys='Ты — аналитик роста YouTube. Отвечай СТРОГО валидным JSON: {"verdict":"диагноз 2 предложения","leaks":[{"problem":"утечка","evidence":"доказательство из данных","fix":"конкретное лечение"}],"first":"самое первое действие прямо сегодня"}. Ровно 3 утечки. По-русски.';
  try{
    var d=await ai(sys,'Почему канал не растёт? Найди утечки.\n'+base,1500);st.done();
    msg('bot','<b>🩺 Диагноз:</b> '+esc(d.verdict||'')+
      (d.leaks||[]).map(function(l,i){return '<div class="v12-card"><h5>'+['🔴','🟠','🟡'][i]+' '+esc(l.problem)+'</h5><div class="kv">📊 '+esc(l.evidence)+'</div><div class="kv">💊 <b>'+esc(l.fix)+'</b></div></div>';}).join('')+
      '<div class="v12-card"><h5>⚡ Начни сегодня</h5><div class="kv">'+esc(d.first||'')+'</div></div>');
  }catch(e){st.fail();msg('bot','⚠️ Не получилось: '+esc(e.message||e));}
}
async function runCompetitors(){
  var list=lget('v11_comp:'+(chid()||''),[])||[];
  if(!list.length){
    var m=msg('bot','Я пока не знаю твоих конкурентов. Добавь их в «Мониторинг конкурентов» — и я буду следить за ними сам.');
    addActs(m,[actBtn('📡 Открыть мониторинг',function(){W.v11CompOpen&&W.v11CompOpen();})]);return;
  }
  var st=stepsCard(['Сканирую '+list.length+' конкурентов','Ищу что залетело за неделю','Готовлю план перехвата']);
  st.next();var vids=await compScan();st.next();st.next();
  if(!vids||!vids.length){st.done();msg('bot','За последнюю неделю у конкурентов тихо — ничего выдающегося не вышло. Это окно: твой ролик сейчас легче заметят.');return;}
  var sys='Ты — продюсер. Отвечай СТРОГО валидным JSON: {"trend":"общий тренд недели одним предложением","steal":[{"src":"чьё видео","idea":"как перехватить под наш канал","title":"готовый заголовок"}]}. Ровно 3 перехвата. По-русски.';
  try{
    var d=await ai(sys,'Что залетает у конкурентов и как перехватить?\n'+ctx()+compTxt(vids),1400);st.done();
    msg('bot','<b>📡 Тренд недели:</b> '+esc(d.trend||'')+
      vids.slice(0,3).map(function(v){return '<div class="v12-card"><h5>🔥 '+esc(v.title)+'</h5><div class="kv">'+esc(v._comp)+' · <b>'+fmt(Math.round(v.viewsPerDay))+'</b> просм/день</div></div>';}).join('')+
      (d.steal||[]).map(function(s){return '<div class="v12-card"><h5>🎯 Перехват</h5><div class="kv">'+esc(s.idea)+'</div><div class="kv">Заголовок: <b>'+esc(s.title)+'</b></div></div>';}).join(''));
  }catch(e){st.fail();msg('bot','⚠️ Не получилось: '+esc(e.message||e));}
}
async function runWeekPlan(){
  var st=stepsCard(['Анализирую лучшие окна публикаций','Собираю план недели']);
  st.next();st.next();
  var sys='Ты — продюсер. Отвечай СТРОГО валидным JSON: {"focus":"фокус недели одним предложением","days":[{"d":"Пн".."Вс","task":"конкретная задача"}],"kpi":"что измерить в конце недели"}. 5-7 дней. По-русски, конкретно.';
  try{
    var d=await ai(sys,'Составь план на неделю для автора канала.\n'+ctx(),1400);st.done();
    var m=msg('bot','<b>🗓 Фокус недели:</b> '+esc(d.focus||'')+
      '<div class="v12-card">'+(d.days||[]).map(function(x){return '<div class="kv"><b>'+esc(x.d)+'</b> — '+esc(x.task)+'</div>';}).join('')+'</div>'+
      '<div class="v12-card"><h5>📏 KPI недели</h5><div class="kv">'+esc(d.kpi||'')+'</div></div>');
    addActs(m,[copyBtn('📋 Копировать план',(d.days||[]).map(function(x){return x.d+': '+x.task;}).join('\n'))]);
  }catch(e){st.fail();msg('bot','⚠️ Не получилось: '+esc(e.message||e));}
}
async function runChat(text){
  var st=stepsCard(['Думаю над ответом']);st.next();
  var sys='Ты — Viora, AI-продюсер YouTube-канала. Отвечай по-русски, дружелюбно и КОНКРЕТНО, с опорой на данные канала. Отвечай СТРОГО валидным JSON: {"reply":"ответ, можно с эмодзи, до 120 слов","action":"none|next_video|diagnose|competitors|week_plan|twin|thumb|conveyor"}. Поле action заполняй, только если для запроса явно полезен инструмент.';
  try{
    var d=await ai(sys,'Вопрос автора: '+text+'\n\nДанные канала:\n'+ctx(),900);st.done();
    var m=msg('bot',esc(d.reply||'…').replace(/\n/g,'<br>'));
    var map={next_video:['🎬 Подобрать ролик',function(){runNextVideo();}],diagnose:['🩺 Диагностика',function(){runDiagnose();}],competitors:['📡 Конкуренты',function(){runCompetitors();}],week_plan:['🗓 План недели',function(){runWeekPlan();}],twin:['🔮 Симулятор',function(){W.v12TwinOpen&&W.v12TwinOpen();}],thumb:['🎨 Студия превью',function(){W.v12ThumbOpen&&W.v12ThumbOpen();}],conveyor:['🏭 Ролик под ключ',function(){W.v12ConvOpen&&W.v12ConvOpen();}]};
    if(d.action&&map[d.action])addActs(m,[actBtn(map[d.action][0],map[d.action][1])]);
  }catch(e){st.fail();msg('bot','⚠️ Не получилось ответить: '+esc(e.message||e));}
}

/* ---------- intent routing ---------- */
function route(text){
  var t=text.toLowerCase();
  if(/следующ|подготовь.*ролик|что снять|какой ролик|идею? ролика/.test(t))return runNextVideo(text);
  if(/не раст|почему.*(просмотр|подписч)|диагноз|что не так|утечк/.test(t))return runDiagnose();
  if(/конкурент|у других|залетает у/.test(t))return runCompetitors();
  if(/план на неделю|недельный план|расписание/.test(t))return runWeekPlan();
  return runChat(text);
}
async function handle(text){
  if(BUSY||!text.trim())return;
  BUSY=true;var inp=q('#v12agIn'),snd=q('#v12agSend');
  if(inp){inp.value='';inp.disabled=true;}if(snd)snd.disabled=true;
  msg('user',esc(text));
  try{await route(text);}finally{
    BUSY=false;if(inp){inp.disabled=false;inp.focus();}if(snd)snd.disabled=false;
  }
}

/* ---------- open ---------- */
W.v12AgentOpen=function(){
  var el=C.ov11('v12agent','🎬','AI-продюсер','Скажи, что нужно — я сам пройдусь по данным, конкурентам и соберу результат');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  el.innerHTML='<div class="v12-chat"><div class="v12-feed" id="v12agFeed"></div>'+
    '<div class="v12-chips">'+
    '<button class="v12-chip" data-a="next">🎬 Подготовь следующий ролик</button>'+
    '<button class="v12-chip" data-a="diag">📉 Почему канал не растёт?</button>'+
    '<button class="v12-chip" data-a="comp">📡 Что залетает у конкурентов?</button>'+
    '<button class="v12-chip" data-a="week">🗓 План на неделю</button></div>'+
    '<div class="v12-cmp"><input id="v12agIn" placeholder="Спроси своего продюсера…" autocomplete="off"><button class="v12-send" id="v12agSend">➤</button></div></div>';
  FEED=q('#v12agFeed');
  var hist=lget(histKey(),[])||[];
  if(hist.length){
    hist.slice(-12).forEach(function(h){msg(h.r,h.h,false);});
    msg('bot','С возвращением! Продолжим работу над каналом 👇',false);
  }else{
    var s=S();
    msg('bot','Привет! Я твой AI-продюсер. Канал <b>'+esc(s.channel.title)+'</b> уже изучил'+(C.scoreNow()!=null?' — индекс роста <b>'+C.scoreNow()+'/100</b>':'')+'. Нажми кнопку ниже или напиши, что нужно — я сам пройду по инструментам и принесу готовый результат.',false);
  }
  q('#v12agSend').addEventListener('click',function(){handle(q('#v12agIn').value);});
  q('#v12agIn').addEventListener('keydown',function(e){if(e.key==='Enter')handle(this.value);});
  C.qa('.v12-chip',el).forEach(function(ch){
    ch.addEventListener('click',function(){
      var a=this.dataset.a;
      if(BUSY)return;
      msg('user',esc(this.textContent.trim()));
      BUSY=true;
      var p=a==='next'?runNextVideo():a==='diag'?runDiagnose():a==='comp'?runCompetitors():runWeekPlan();
      p.finally(function(){BUSY=false;});
    });
  });
};

/* nav pill */
function injectNav(){
  var slot=q('.nav-in')&&q('.nav-in').children[1];
  if(!slot||q('#v12navAgent'))return;
  var b=D.createElement('button');b.className='v12-navagent';b.id='v12navAgent';
  b.innerHTML='🎬 AI-продюсер';
  b.addEventListener('click',function(){W.v12AgentOpen();});
  slot.insertBefore(b,slot.firstChild);
}
var navIv=setInterval(injectNav,1200);setTimeout(function(){clearInterval(navIv);},30000);
try{injectNav();}catch(e){}

C.regTool({id:'agent',ic:'🎬',name:'AI-продюсер',d:'Чат-агент: сам проходит по данным и инструментам и приносит готовый результат',fn:W.v12AgentOpen,hub:true});
})();

;
/* ============ VIORA V12 · модуль 2: цифровой двойник канала ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,med=C.med,clamp=C.clamp;

/* ---------- baseline from real data ---------- */
function baseline(){
  var s=S(),longs=(s.longs||[]).slice(),shorts=(s.shorts||[]);
  longs.sort(function(a,b){return new Date(b.published)-new Date(a.published);});
  var recent=longs.slice(0,20);
  // upload frequency from gaps
  var gaps=[];
  for(var i=0;i<recent.length-1;i++){
    var g=(new Date(recent[i].published)-new Date(recent[i+1].published))/864e5;
    if(g>0&&g<90)gaps.push(g);
  }
  var gap=med(gaps)||7;
  var upw=clamp(7/gap,0.25,14);
  var mv=med(recent.map(function(v){return v.views;}))||0;
  var msv=med(shorts.slice(0,15).map(function(v){return v.views;}))||Math.round(mv*0.6);
  var subs=(s.channel&&s.channel.subs)||0;
  var tv=(s.channel&&s.channel.totalViews)||1;
  var conv=clamp(subs/tv,0.0008,0.05); // subs per view, historical
  var shShare=shorts.length/(Math.max(1,shorts.length+longs.length));
  return {upw:upw,mv:mv,msv:msv,subs:subs,conv:conv,shShare:shShare};
}
/* monthly views given params */
function monthly(b,p){
  var longsM=p.upw*4.33*(1-p.sh);
  var shortsM=p.upw*4.33*p.sh;
  var lv=b.mv*(1+p.ctr)*(1+p.ret*0.6);
  var sv=b.msv*(1+p.ctr*0.4);
  return longsM*lv+shortsM*sv*3; // shorts get feed multiplier
}
function project(b,p,days){
  var out=[],subs=b.subs,mView=monthly(b,p);
  var pts=Math.round(days/15);
  for(var i=0;i<=pts;i++){
    out.push({d:i*15,subs:Math.round(subs),views:Math.round(mView)});
    var gain=mView/2*b.conv*(1+p.ret*0.8); // per 15 days
    subs+=gain;
    mView*=(1+0.012*(1+p.ctr+p.ret)); // gentle compounding from algorithm trust
  }
  return out;
}

/* ---------- chart ---------- */
function chart(a,bm){
  var Wd=640,H=280,pad=58;
  var all=a.concat(bm),maxV=Math.max.apply(null,all.map(function(x){return x.subs;}))*1.04;
  var minV=Math.min.apply(null,all.map(function(x){return x.subs;}))*0.97;
  function X(i,n){return pad+(Wd-pad-14)*(i/(n-1));}
  function Y(v){return H-30-(H-58)*((v-minV)/Math.max(1,maxV-minV));}
  function line(arr,col,wd,dash){
    var d=arr.map(function(x,i){return (i?'L':'M')+X(i,arr.length).toFixed(1)+' '+Y(x.subs).toFixed(1);}).join(' ');
    return '<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+wd+'"'+(dash?' stroke-dasharray="5 5"':'')+' stroke-linecap="round"/>';
  }
  function area(arr,col){
    var d=arr.map(function(x,i){return (i?'L':'M')+X(i,arr.length).toFixed(1)+' '+Y(x.subs).toFixed(1);}).join(' ');
    d+='L'+X(arr.length-1,arr.length).toFixed(1)+' '+(H-30)+' L'+pad+' '+(H-30)+' Z';
    return '<path d="'+d+'" fill="'+col+'"/>';
  }
  var grid='';
  for(var g=0;g<4;g++){
    var gv=minV+(maxV-minV)*g/3,gy=Y(gv);
    grid+='<line x1="'+pad+'" y1="'+gy+'" x2="'+(Wd-14)+'" y2="'+gy+'" stroke="rgba(255,255,255,0.06)"/>'+
      '<text x="'+(pad-7)+'" y="'+(gy+4)+'" text-anchor="end" font-size="10.5" fill="#9b93a8">'+fmt(Math.round(gv))+'</text>';
  }
  var xl='';
  [0,Math.floor((a.length-1)/2),a.length-1].forEach(function(i){
    xl+='<text x="'+X(i,a.length)+'" y="'+(H-9)+'" text-anchor="middle" font-size="10.5" fill="#9b93a8">'+(a[i].d===0?'сегодня':'+'+a[i].d+' дн')+'</text>';
  });
  var last=a[a.length-1],lx=X(a.length-1,a.length),ly=Y(last.subs);
  return '<svg viewBox="0 0 '+Wd+' '+H+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><linearGradient id="v12tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,45,85,0.28)"/><stop offset="1" stop-color="rgba(255,45,85,0)"/></linearGradient></defs>'+
    grid+xl+area(a,'url(#v12tg)')+line(bm,'#8d83a0',2,true)+line(a,'#ff2d55',3.5)+
    '<circle cx="'+lx+'" cy="'+ly+'" r="5" fill="#ff2d55" stroke="#fff" stroke-width="2"/>'+
    '</svg>';
}

/* ---------- UI ---------- */
var P={upw:0,sh:0,ctr:0,ret:0},B=null;
function render(){
  var bm=project(B,{upw:B.upw,sh:B.shShare,ctr:0,ret:0},180);
  var sc=project(B,P,180);
  q('#v12twChart').innerHTML=chart(sc,bm);
  var s90=sc[Math.round(90/15)],b90=bm[Math.round(90/15)];
  var dSubs=s90.subs-B.subs,dVs=s90.views,dd=s90.subs-b90.subs;
  var st=q('#v12twStats');
  st.innerHTML='<div class="v12-tstat"><div class="v">'+(dSubs>=0?'+':'')+fmt(dSubs)+'</div><div class="k">подписчиков за 90 дней</div></div>'+
    '<div class="v12-tstat"><div class="v">'+fmt(dVs)+'</div><div class="k">просмотров / месяц</div></div>'+
    '<div class="v12-tstat"><div class="v '+(dd>=0?'up':'down')+'">'+(dd>=0?'+':'')+fmt(dd)+'</div><div class="k">vs текущий курс</div></div>';
}
function slider(id,label,min,max,step,val,fmtFn){
  return '<div class="v12-sl"><div class="lab"><span>'+label+'</span><b id="v12lv_'+id+'">'+fmtFn(val)+'</b></div>'+
    '<input type="range" id="v12sl_'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>';
}
var PRESETS={
  now:{n:'Как сейчас',f:function(){P.upw=B.upw;P.sh=B.shShare;P.ctr=0;P.ret=0;}},
  growth:{n:'🚀 Режим роста',f:function(){P.upw=Math.max(B.upw,2);P.sh=Math.max(B.shShare,0.35);P.ctr=0.25;P.ret=0.15;}},
  shorts:{n:'⚡ Машина Shorts',f:function(){P.upw=Math.max(B.upw*1.5,4);P.sh=0.7;P.ctr=0.1;P.ret=0;}},
  quality:{n:'💎 Качество > количество',f:function(){P.upw=Math.max(B.upw*0.75,0.5);P.sh=B.shShare*0.5;P.ctr=0.4;P.ret=0.25;}}
};
function syncSliders(){
  q('#v12sl_upw').value=P.upw;q('#v12sl_sh').value=Math.round(P.sh*100);
  q('#v12sl_ctr').value=Math.round(P.ctr*100);q('#v12sl_ret').value=Math.round(P.ret*100);
  q('#v12lv_upw').textContent=P.upw.toFixed(1)+' / нед';
  q('#v12lv_sh').textContent=Math.round(P.sh*100)+'%';
  q('#v12lv_ctr').textContent=(P.ctr>=0?'+':'')+Math.round(P.ctr*100)+'%';
  q('#v12lv_ret').textContent=(P.ret>=0?'+':'')+Math.round(P.ret*100)+'%';
}

W.v12TwinOpen=function(){
  var el=C.ov11('v12twin','🔮','Цифровой двойник','Симулятор будущего: двигай рычаги и смотри, что будет с каналом через 90 и 180 дней');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  B=baseline();PRESETS.now.f();
  el.innerHTML='<div class="v12-twin">'+
    '<div class="v12-panel"><div class="v10-h4" style="margin-top:0">⚙️ Рычаги роста</div>'+
    '<div class="v12-presets">'+Object.keys(PRESETS).map(function(k){return '<button class="v12-preset'+(k==='now'?' on':'')+'" data-p="'+k+'">'+PRESETS[k].n+'</button>';}).join('')+'</div>'+
    slider('upw','Выходов в неделю',0.25,7,0.25,+B.upw.toFixed(2),function(v){return (+v).toFixed(1)+' / нед';})+
    slider('sh','Доля Shorts',0,80,5,Math.round(B.shShare*100),function(v){return v+'%';})+
    slider('ctr','Буст упаковки (CTR)',-20,60,5,0,function(v){return (v>=0?'+':'')+v+'%';})+
    slider('ret','Буст удержания',-20,30,5,0,function(v){return (v>=0?'+':'')+v+'%';})+
    '<div class="v10-note" style="margin-top:4px">База — реальные цифры канала: медиана '+fmt(Math.round(B.mv))+' просм/ролик, '+B.upw.toFixed(1)+' видео/нед, конверсия в подписку '+(B.conv*100).toFixed(2)+'%.</div>'+
    '<button class="v11-btn" id="v12twAi" style="width:100%;margin-top:12px">🧠 Вердикт AI по сценарию</button></div>'+
    '<div><div class="v12-panel"><div id="v12twChart"></div>'+
    '<div class="v12-legend"><span><i style="background:#ff2d55"></i>твой сценарий</span><span><i style="background:#8d83a0"></i>если ничего не менять</span></div>'+
    '<div class="v12-tstats" id="v12twStats"></div></div>'+
    '<div id="v12twOut" style="margin-top:14px"></div></div></div>';
  render();
  [['upw',function(v){P.upw=+v;}],['sh',function(v){P.sh=v/100;}],['ctr',function(v){P.ctr=v/100;}],['ret',function(v){P.ret=v/100;}]].forEach(function(pair){
    q('#v12sl_'+pair[0]).addEventListener('input',function(){
      pair[1](+this.value);syncSliders();render();
      C.qa('.v12-preset',el).forEach(function(x){x.classList.remove('on');});
    });
  });
  C.qa('.v12-preset',el).forEach(function(b){
    b.addEventListener('click',function(){
      C.qa('.v12-preset',el).forEach(function(x){x.classList.remove('on');});
      this.classList.add('on');PRESETS[this.dataset.p].f();syncSliders();render();
    });
  });
  q('#v12twAi').addEventListener('click',async function(){
    var out=q('#v12twOut');this.disabled=true;
    out.innerHTML=C.load11('Оцениваю реалистичность сценария…');
    var sc=project(B,P,90),end=sc[sc.length-1];
    var sys='Ты — продюсер-аналитик. Отвечай СТРОГО валидным JSON: {"realism":"оценка реалистичности сценария 1-2 предложения","risks":["2-3 риска"],"order":["3 шага: с чего начать переход к этому сценарию"]}. По-русски, конкретно.';
    var user='Канал хочет перейти к сценарию: '+P.upw.toFixed(1)+' видео/нед, '+Math.round(P.sh*100)+'% Shorts, упаковка '+(P.ctr>=0?'+':'')+Math.round(P.ctr*100)+'%, удержание '+(P.ret>=0?'+':'')+Math.round(P.ret*100)+'%. Прогноз: +'+fmt(end.subs-B.subs)+' подписчиков за 90 дней.\n'+ctx();
    try{
      var d=await ai(sys,user,1100);
      out.innerHTML='<div class="v12-panel"><div class="v10-h4" style="margin-top:0">🧠 Вердикт продюсера</div>'+
        '<div class="kv" style="font-size:13.5px;color:#dcd5e6">'+esc(d.realism||'')+'</div>'+
        '<div class="v10-h4">⚠️ Риски</div>'+(d.risks||[]).map(function(r){return '<div style="font-size:13px;color:#cfc8da;margin:4px 0">• '+esc(r)+'</div>';}).join('')+
        '<div class="v10-h4">🪜 С чего начать</div>'+(d.order||[]).map(function(r,i){return '<div style="font-size:13px;color:#cfc8da;margin:4px 0"><b style="color:#fff">'+(i+1)+'.</b> '+esc(r)+'</div>';}).join('')+'</div>';
    }catch(e){out.innerHTML=C.err11(e);}
    this.disabled=false;
  });
};
C.regTool({id:'twin',ic:'🔮',name:'Цифровой двойник',d:'Симулятор будущего канала: рычаги частоты, Shorts и упаковки + прогноз на 180 дней',fn:W.v12TwinOpen,hub:true});
})();

;
/* ============ VIORA V12 · модуль 3: студия превью ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,esc=C.esc,S=C.S,ai=C.ai,ctx=C.ctx;

var CV=null,CX=null,ST=null,DRAG=null,TAINT=false;

var GRADS=[
  ['#1a0b2e','#ff2d55'],['#0b1c2e','#2aabee'],['#091f14','#3cc878'],
  ['#211003','#ff9a3d'],['#1c0f24','#a06bff'],['#13131a','#e7e1f0']
];
var SWATCH=['#ffffff','#ffe24d','#ff2d55','#2aabee','#3cc878','#ff9a3d'];
var TPLS={
  left:{n:'Слева крупно',f:function(s){s.head.x=64;s.head.y=460;s.head.align='left';s.badge.x=64;s.badge.y=120;}},
  center:{n:'По центру',f:function(s){s.head.x=640;s.head.y=380;s.head.align='center';s.badge.x=640;s.badge.y=140;}},
  bottom:{n:'Нижняя плашка',f:function(s){s.head.x=640;s.head.y=620;s.head.align='center';s.badge.x=110;s.badge.y=110;}},
  punch:{n:'Удар в лоб',f:function(s){s.head.x=640;s.head.y=300;s.head.align='center';s.head.size=Math.max(s.head.size,128);s.badge.x=640;s.badge.y=560;}}
};

function defState(txt){
  return {
    bg:{type:'grad',a:GRADS[0][0],b:GRADS[0][1],img:null},
    dark:35,
    head:{text:txt||'МОЙ НОВЫЙ РОЛИК',x:64,y:460,size:104,color:'#ffffff',align:'left'},
    badge:{text:'НОВОЕ',x:64,y:120,on:true}
  };
}
function wrapText(c,text,maxW){
  var words=text.split(/\s+/),lines=[],cur='';
  words.forEach(function(w){
    var t=cur?cur+' '+w:w;
    if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;
  });
  if(cur)lines.push(cur);
  return lines.slice(0,3);
}
function draw(){
  if(!CX||!ST)return;
  var c=CX,s=ST;
  c.clearRect(0,0,1280,720);
  // bg
  if(s.bg.type==='img'&&s.bg.img){
    var im=s.bg.img,r=Math.max(1280/im.width,720/im.height);
    var w=im.width*r,h=im.height*r;
    c.drawImage(im,(1280-w)/2,(720-h)/2,w,h);
  }else{
    var g=c.createLinearGradient(0,0,1280,720);
    g.addColorStop(0,s.bg.a);g.addColorStop(1,s.bg.b);
    c.fillStyle=g;c.fillRect(0,0,1280,720);
    // texture dots
    c.fillStyle='rgba(255,255,255,0.05)';
    for(var i=0;i<40;i++){c.beginPath();c.arc((i*167)%1280,(i*311)%720,(i%4)+1,0,7);c.fill();}
  }
  // dark overlay + vignette
  c.fillStyle='rgba(0,0,0,'+(s.dark/100)+')';c.fillRect(0,0,1280,720);
  var v=c.createRadialGradient(640,360,330,640,360,820);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,0.45)');
  c.fillStyle=v;c.fillRect(0,0,1280,720);
  // headline
  c.textAlign=s.head.align==='center'?'center':'left';
  c.font='900 '+s.head.size+'px Sora, Onest, Arial, sans-serif';
  var lines=wrapText(c,s.head.text.toUpperCase(),s.head.align==='center'?1140:1100);
  var lh=s.head.size*1.08;
  lines.forEach(function(ln,i){
    var y=s.head.y+i*lh;
    c.lineJoin='round';c.lineWidth=Math.max(10,s.head.size*0.13);c.strokeStyle='rgba(0,0,0,0.85)';
    c.strokeText(ln,s.head.x,y);
    c.shadowColor='rgba(0,0,0,0.5)';c.shadowBlur=18;c.shadowOffsetY=6;
    c.fillStyle=s.head.color;c.fillText(ln,s.head.x,y);
    c.shadowBlur=0;c.shadowOffsetY=0;
  });
  // badge
  if(s.badge.on&&s.badge.text){
    c.font='800 44px Sora, Onest, Arial, sans-serif';
    var bw=c.measureText(s.badge.text.toUpperCase()).width+56;
    var bx=s.badge.x,by=s.badge.y;
    var left=(s.head.align==='center')?bx-bw/2:bx;
    c.save();
    c.translate(left+bw/2,by);c.rotate(-0.04);c.translate(-(left+bw/2),-by);
    c.fillStyle='#ff2d55';
    c.beginPath();
    if(c.roundRect)c.roundRect(left,by-44,bw,72,18);else c.rect(left,by-44,bw,72);
    c.fill();
    c.shadowColor='rgba(255,45,85,0.5)';c.shadowBlur=26;
    c.fillStyle='#fff';c.textAlign='center';
    c.fillText(s.badge.text.toUpperCase(),left+bw/2,by+10);
    c.restore();
  }
}
function hit(x,y){
  var s=ST;
  // badge box approx
  if(s.badge.on){
    var bx=s.badge.x,by=s.badge.y;
    if(Math.abs(x-bx)<240&&y>by-70&&y<by+50)return 'badge';
  }
  var hh=s.head.size*1.08*2;
  if(y>s.head.y-s.head.size&&y<s.head.y+hh)return 'head';
  return null;
}
function evPos(e){
  var r=CV.getBoundingClientRect();
  var px=(e.touches?e.touches[0].clientX:e.clientX)-r.left;
  var py=(e.touches?e.touches[0].clientY:e.clientY)-r.top;
  return {x:px*1280/r.width,y:py*720/r.height};
}
function bindDrag(){
  function down(e){
    var p=evPos(e),h=hit(p.x,p.y);
    if(h){DRAG={t:h,dx:p.x-ST[h].x,dy:p.y-ST[h].y};e.preventDefault();}
  }
  function move(e){
    if(!DRAG)return;
    var p=evPos(e);
    ST[DRAG.t].x=Math.round(p.x-DRAG.dx);ST[DRAG.t].y=Math.round(p.y-DRAG.dy);
    draw();e.preventDefault();
  }
  function up(){DRAG=null;}
  CV.addEventListener('mousedown',down);CV.addEventListener('mousemove',move);
  D.addEventListener('mouseup',up);
  CV.addEventListener('touchstart',down,{passive:false});
  CV.addEventListener('touchmove',move,{passive:false});
  CV.addEventListener('touchend',up);
}
function setBgImg(url,cors){
  var im=new Image();
  if(cors)im.crossOrigin='anonymous';
  im.onload=function(){ST.bg={type:'img',img:im,a:'',b:''};TAINT=false;draw();};
  im.onerror=function(){
    if(cors){ // retry without cors → preview works, export warns
      var im2=new Image();
      im2.onload=function(){ST.bg={type:'img',img:im2};TAINT=true;draw();C.toast('Кадр загружен, но YouTube не отдаёт его для экспорта — для скачивания загрузи свой кадр');};
      im2.src=url;
    }else C.toast('Не удалось загрузить картинку');
  };
  im.src=url;
}

W.v12ThumbOpen=function(presetTxt){
  var el=C.ov11('v12thumb','🎨','Студия превью','Собери превью 1280×720 прямо здесь: кадр, текст, плашка — и скачай PNG');
  var s=S();
  ST=defState(typeof presetTxt==='string'?presetTxt:'');
  var thumbs=(s.longs||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,8);
  el.innerHTML='<div class="v12-thumb">'+
    '<div><div class="v12-stage"><canvas id="v12cv" width="1280" height="720"></canvas></div>'+
    '<div class="v10-note" style="margin-top:10px">Перетаскивай заголовок и плашку прямо по картинке. Экспорт — честные 1280×720 PNG.</div>'+
    '<div class="v12-row12" style="margin-top:10px"><button class="v11-btn" id="v12thDl">⬇️ Скачать PNG 1280×720</button>'+
    '<button class="v11-btn ghost" id="v12thAi">🧠 Придумай текст (AI)</button></div><div id="v12thOut" style="margin-top:10px"></div></div>'+
    '<div class="v12-tools v12-panel">'+
    '<div class="grp"><div class="t">Заголовок</div><input class="v12-in12" id="v12thHead" value="'+esc(ST.head.text)+'" maxlength="60">'+
    '<div class="v12-row12"><button class="v12-mini" data-sz="-">A−</button><button class="v12-mini" data-sz="+">A+</button>'+
    '<div class="v12-swatches">'+SWATCH.map(function(c,i){return '<div class="v12-sw'+(i===0?' on':'')+'" data-c="'+c+'" style="background:'+c+'"></div>';}).join('')+'</div></div></div>'+
    '<div class="grp"><div class="t">Плашка</div><input class="v12-in12" id="v12thBadge" value="'+esc(ST.badge.text)+'" maxlength="20">'+
    '<button class="v12-mini on" id="v12thBgOn">Показать плашку</button></div>'+
    '<div class="grp"><div class="t">Макет</div><div class="v12-tpls">'+Object.keys(TPLS).map(function(k){return '<button class="v12-mini'+(k==='left'?' on':'')+'" data-tpl="'+k+'">'+TPLS[k].n+'</button>';}).join('')+'</div></div>'+
    '<div class="grp"><div class="t">Фон · градиенты</div><div class="v12-bgs">'+GRADS.map(function(g,i){return '<div class="v12-bg'+(i===0?' on':'')+'" data-g="'+i+'" style="background:linear-gradient(135deg,'+g[0]+','+g[1]+')"></div>';}).join('')+'</div></div>'+
    (thumbs.length?'<div class="grp"><div class="t">Фон · кадры из твоих хитов</div><div class="v12-bgs">'+thumbs.map(function(v,i){return '<div class="v12-bg" data-yt="'+esc(v.thumb||'')+'" style="background-image:url('+esc(v.thumb||'')+')" title="'+esc(v.title)+'"></div>';}).join('')+'</div></div>':'')+
    '<div class="grp"><div class="t">Фон · свой кадр</div><input type="file" id="v12thFile" accept="image/*" style="display:none"><button class="v12-mini" id="v12thUp">📁 Загрузить картинку</button></div>'+
    '<div class="grp"><div class="t">Затемнение фона</div><div class="v12-sl"><input type="range" id="v12thDark" min="0" max="75" value="35"></div></div>'+
    '</div></div>';
  CV=q('#v12cv');CX=CV.getContext('2d');
  draw();bindDrag();
  q('#v12thHead').addEventListener('input',function(){ST.head.text=this.value;draw();});
  q('#v12thBadge').addEventListener('input',function(){ST.badge.text=this.value;draw();});
  q('#v12thBgOn').addEventListener('click',function(){ST.badge.on=!ST.badge.on;this.classList.toggle('on',ST.badge.on);draw();});
  q('#v12thDark').addEventListener('input',function(){ST.dark=+this.value;draw();});
  C.qa('[data-sz]',el).forEach(function(b){b.addEventListener('click',function(){
    ST.head.size=C.clamp(ST.head.size+(this.dataset.sz==='+'?10:-10),48,170);draw();});});
  C.qa('.v12-sw',el).forEach(function(b){b.addEventListener('click',function(){
    C.qa('.v12-sw',el).forEach(function(x){x.classList.remove('on');});this.classList.add('on');
    ST.head.color=this.dataset.c;draw();});});
  C.qa('[data-tpl]',el).forEach(function(b){b.addEventListener('click',function(){
    C.qa('[data-tpl]',el).forEach(function(x){x.classList.remove('on');});this.classList.add('on');
    TPLS[this.dataset.tpl].f(ST);draw();});});
  C.qa('.v12-bg',el).forEach(function(b){b.addEventListener('click',function(){
    C.qa('.v12-bg',el).forEach(function(x){x.classList.remove('on');});this.classList.add('on');
    if(this.dataset.g!=null){var g=GRADS[+this.dataset.g];ST.bg={type:'grad',a:g[0],b:g[1],img:null};TAINT=false;draw();}
    else if(this.dataset.yt)setBgImg(this.dataset.yt,true);
  });});
  q('#v12thUp').addEventListener('click',function(){q('#v12thFile').click();});
  q('#v12thFile').addEventListener('change',function(){
    var f=this.files[0];if(!f)return;
    var r=new FileReader();
    r.onload=function(){setBgImg(r.result,false);};
    r.readAsDataURL(f);
  });
  q('#v12thDl').addEventListener('click',function(){
    try{
      var url=CV.toDataURL('image/png');
      var a=D.createElement('a');a.href=url;a.download='viora_thumbnail.png';a.click();
      C.toast('Превью скачано 🎉');
    }catch(e){
      C.toast('YouTube не разрешил экспорт этого кадра — загрузи свой кадр через «📁 Загрузить картинку»');
    }
  });
  q('#v12thAi').addEventListener('click',async function(){
    var out=q('#v12thOut');this.disabled=true;
    out.innerHTML=C.load11('Придумываю текст под формулу твоих хитов…');
    var sys='Ты — мастер упаковки YouTube. Отвечай СТРОГО валидным JSON: {"options":[{"head":"2-4 слова КАПСОМ для превью","badge":"1-2 слова для плашки"}]}. Ровно 4 варианта, цепляющие, без кавычек внутри. По-русски.';
    try{
      var d=await ai(sys,'Придумай текст для превью ролика на тему: «'+(q('#v12thHead').value||'новый ролик')+'».\n'+ctx(),700);
      out.innerHTML='<div class="v12-row12">'+(d.options||[]).map(function(o,i){return '<button class="v12-mini" data-ai="'+i+'">'+esc(o.head)+'</button>';}).join('')+'</div>';
      C.qa('[data-ai]',out).forEach(function(b){b.addEventListener('click',function(){
        var o=d.options[+this.dataset.ai];
        ST.head.text=o.head;ST.badge.text=o.badge||ST.badge.text;
        q('#v12thHead').value=o.head;q('#v12thBadge').value=ST.badge.text;draw();
      });});
    }catch(e){out.innerHTML=C.err11(e);}
    this.disabled=false;
  });
};
C.regTool({id:'thumb',ic:'🎨',name:'Студия превью',d:'Canvas-редактор 1280×720: кадр, заголовок, плашка, AI-текст — и готовый PNG',fn:W.v12ThumbOpen,hub:true});
})();

;
/* ============ VIORA V12 · модуль 4: конвейер «Ролик под ключ» ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx;

var DOWS=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
function bestSlot(){
  var s=S(),longs=(s.longs||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,12);
  var dows={},hours={};
  longs.forEach(function(v){
    if(v.dow!=null)dows[v.dow]=(dows[v.dow]||0)+1;
    if(v.hour!=null)hours[v.hour]=(hours[v.hour]||0)+1;
  });
  function top(o,d){var k=Object.keys(o);if(!k.length)return d;return +k.sort(function(a,b){return o[b]-o[a];})[0];}
  var dow=top(dows,5),hour=top(hours,17);
  var now=new Date(),target=new Date(now);
  var diff=(dow-now.getDay()+7)%7;if(diff===0)diff=7;
  target.setDate(now.getDate()+diff);target.setHours(hour,0,0,0);
  return {dow:dow,hour:hour,date:target};
}
function icsFor(title,dt){
  function p(n){return ('0'+n).slice(-2);}
  function fd(d){return d.getFullYear()+''+p(d.getMonth()+1)+p(d.getDate())+'T'+p(d.getHours())+'0000';}
  var end=new Date(dt.getTime()+36e5);
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Viora//RU\r\nBEGIN:VEVENT\r\nUID:viora-'+Date.now()+'@viora.media\r\nDTSTART:'+fd(dt)+'\r\nDTEND:'+fd(end)+'\r\nSUMMARY:'+title.replace(/[,;]/g,' ')+'\r\nDESCRIPTION:Публикация ролика (план Viora)\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
}
function calAdd(title,dt){
  try{
    var k=dt.getFullYear()+'-'+('0'+(dt.getMonth()+1)).slice(-2)+'-'+('0'+dt.getDate()).slice(-2);
    var data={};try{data=JSON.parse(localStorage.getItem('v6_cal_v1')||'{}')||{};}catch(e){}
    (data[k]=data[k]||[]).push({t:('🎬 '+title).slice(0,90),type:'pub'});
    localStorage.setItem('v6_cal_v1',JSON.stringify(data));
    C.toast('Поставил в контент-календарь на '+dt.toLocaleDateString('ru-RU',{day:'numeric',month:'long'})+' ✓');
  }catch(e){C.toast('Не удалось добавить в календарь');}
}

var STEPS=[
  ['🎯','Выбираю тему','по данным канала и трендам'],
  ['✍️','Пишу сценарий','хук, структура, CTA'],
  ['🎁','Собираю упаковку','заголовки, описание, теги, превью'],
  ['📣','Готовлю промо','посты, тизер, посев'],
  ['🗓','Считаю слот выхода','лучшее окно твоей аудитории']
];

W.v12ConvOpen=function(presetTheme){
  var el=C.ov11('v12conv','🏭','Ролик под ключ','Одна кнопка — и у тебя полный производственный пакет: тема, сценарий, упаковка, промо и дата выхода');
  if(!S().channel){el.innerHTML=C.needCh();return;}
  var theme=typeof presetTheme==='string'?presetTheme:'';
  el.innerHTML='<div class="v10-card"><div class="v10-h4" style="margin-top:0">🚀 Запуск конвейера</div>'+
    '<div class="v10-note">Можно задать тему — или оставить пустой, тогда я сам выберу самую перспективную по данным канала'+(C.lget('v11_comp:'+(C.chid()||''),[]).length?' и конкурентов':'')+'.</div>'+
    '<div class="v11-row" style="margin-top:12px"><input class="v10-in v11-in" id="v12cvTheme" placeholder="Тема (необязательно)" style="flex:1;min-width:220px" value="'+esc(theme)+'">'+
    '<button class="v11-btn" id="v12cvGo">🏭 Собрать ролик под ключ</button></div></div>'+
    '<div id="v12cvPipe"></div><div id="v12cvDoc" class="v12-doc"></div>';
  q('#v12cvGo').addEventListener('click',run);
  if(theme)setTimeout(run,300);

  async function run(){
    var btn=q('#v12cvGo');btn.disabled=true;
    var pipe=q('#v12cvPipe'),doc=q('#v12cvDoc');doc.innerHTML='';
    pipe.innerHTML='<div class="v12-pipe">'+STEPS.map(function(s,i){
      return '<div class="v12-pst" data-i="'+i+'"><div class="ic">'+s[0]+'</div><div class="tx"><b>'+s[1]+'</b><span>'+s[2]+'</span></div></div>';
    }).join('')+'</div>';
    function st(i,cls){var n=pipe.querySelector('[data-i="'+i+'"]');if(n)n.className='v12-pst '+(cls||'');}
    var t=q('#v12cvTheme').value.trim();
    try{
      st(0,'run');
      var sys1='Ты — продюсер и сценарист YouTube. Отвечай СТРОГО валидным JSON без markdown: {"theme":"тема ролика","why":"почему она выстрелит (по данным)","duration":"рекомендуемый хронометраж","script":{"hook":"дословный текст первых 20 секунд","blocks":[{"t":"название блока","time":"м:сс–м:сс","text":"что происходит и ключевые фразы, 2-4 предложения"}],"cta":"дословный призыв в конце"}}. Блоков 5-7, покрой весь хронометраж. По-русски.';
      var d1=await ai(sys1,(t?'Тема задана автором: «'+t+'». Доработай её под канал и напиши сценарий.':'Сам выбери самую перспективную тему и напиши сценарий.')+'\n'+ctx(),2400);
      st(0,'ok');st(1,'run');st(1,'ok');st(2,'run');
      var sys2='Ты — мастер упаковки и дистрибуции YouTube. Отвечай СТРОГО валидным JSON: {"titles":["3 заголовка по формуле хитов канала"],"desc":"описание ролика 3-5 предложений с ключевыми словами","tags":["10 тегов"],"thumb":"2-4 слова КАПСОМ для превью","promo":{"tg":"пост для Telegram с эмодзи","teaser":"сценарий 15-сек тизера для Shorts/Reels","seed":["3 места, где посеять ролик бесплатно"]}}. По-русски.';
      var d2=await ai(sys2,'Ролик: «'+(d1.theme||t)+'». Хук: '+(d1.script&&d1.script.hook||'')+'\n'+ctx(),1900);
      st(2,'ok');st(3,'run');st(3,'ok');st(4,'run');
      var slot=bestSlot();st(4,'ok');
      renderDoc(d1,d2,slot);
    }catch(e){
      pipe.innerHTML='';doc.innerHTML=C.err11(e);
    }
    btn.disabled=false;
  }

  function renderDoc(d1,d2,slot){
    var doc=q('#v12cvDoc');
    var sc=d1.script||{};
    var scriptTxt='ХУК:\n'+(sc.hook||'')+'\n\n'+(sc.blocks||[]).map(function(b){return '['+b.time+'] '+b.t+'\n'+b.text;}).join('\n\n')+'\n\nCTA:\n'+(sc.cta||'');
    var allTxt='ТЕМА: '+(d1.theme||'')+'\nХРОНОМЕТРАЖ: '+(d1.duration||'')+'\n\n=== СЦЕНАРИЙ ===\n'+scriptTxt+'\n\n=== УПАКОВКА ===\nЗАГОЛОВКИ:\n'+(d2.titles||[]).map(function(x,i){return (i+1)+'. '+x;}).join('\n')+'\nПРЕВЬЮ: '+(d2.thumb||'')+'\nОПИСАНИЕ:\n'+(d2.desc||'')+'\nТЕГИ: '+(d2.tags||[]).join(', ')+'\n\n=== ПРОМО ===\nTELEGRAM:\n'+(d2.promo&&d2.promo.tg||'')+'\n\nТИЗЕР:\n'+(d2.promo&&d2.promo.teaser||'')+'\n\nПОСЕВ:\n'+(d2.promo&&d2.promo.seed||[]).map(function(x){return '- '+x;}).join('\n')+'\n\nВЫХОД: '+slot.date.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})+', '+slot.hour+':00';
    doc.innerHTML=
      '<section><h4>🎯 Тема</h4><div class="kv" style="font-size:16px;color:#fff;font-weight:800">'+esc(d1.theme||'')+'</div><div class="scr" style="margin-top:6px">'+esc(d1.why||'')+'</div><div class="v10-note" style="margin-top:8px">Хронометраж: '+esc(d1.duration||'—')+'</div></section>'+
      '<section><h4>✍️ Сценарий</h4><div class="scr">'+esc(scriptTxt)+'</div><div class="v12-acts"><button class="v11-btn sm" id="v12cvCpS">📋 Копировать сценарий</button></div></section>'+
      '<section><h4>🎁 Упаковка</h4>'+(d2.titles||[]).map(function(x,i){return '<div class="v12-ttl-opt"><div class="n">'+(i+1)+'. '+esc(x)+'</div></div>';}).join('')+
      '<div class="kv" style="margin-top:8px">Превью: <b>'+esc(d2.thumb||'')+'</b></div><div class="scr" style="margin-top:8px">'+esc(d2.desc||'')+'</div>'+
      '<div class="v10-note" style="margin-top:8px">Теги: '+esc((d2.tags||[]).join(', '))+'</div>'+
      '<div class="v12-acts"><button class="v11-btn sm" id="v12cvThumb">🎨 Сделать превью в студии</button></div></section>'+
      '<section><h4>📣 Промо</h4><div class="scr"><b>Telegram:</b>\n'+esc(d2.promo&&d2.promo.tg||'')+'\n\n<b>Тизер 15 сек:</b>\n'+esc(d2.promo&&d2.promo.teaser||'')+'\n\n<b>Посев:</b>\n'+esc((d2.promo&&d2.promo.seed||[]).map(function(x){return '• '+x;}).join('\n'))+'</div></section>'+
      '<section><h4>🗓 Выход</h4><div class="kv" style="font-size:15px;color:#fff"><b>'+slot.date.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})+', '+slot.hour+':00</b> — лучшее окно по твоим хитам</div>'+
      '<div class="v12-acts"><button class="v11-btn sm" id="v12cvCal">📅 В контент-календарь</button><button class="v11-btn sm ghost" id="v12cvIcs">⬇️ .ics для телефона</button></div></section>'+
      '<div class="v12-acts" style="margin:4px 0 30px"><button class="v11-btn" id="v12cvAll">📋 Копировать весь пакет</button><button class="v11-btn ghost" id="v12cvPdf">📄 Скачать PDF-пакет</button></div>';
    q('#v12cvCpS').addEventListener('click',function(){C.copyTxt(scriptTxt,this);});
    q('#v12cvAll').addEventListener('click',function(){C.copyTxt(allTxt,this);});
    q('#v12cvThumb').addEventListener('click',function(){W.v12ThumbOpen&&W.v12ThumbOpen(d2.thumb||'');});
    q('#v12cvCal').addEventListener('click',function(){calAdd((d2.titles&&d2.titles[0])||d1.theme||'Ролик',slot.date);});
    q('#v12cvIcs').addEventListener('click',function(){
      var blob=new Blob([icsFor((d2.titles&&d2.titles[0])||d1.theme||'Ролик',slot.date)],{type:'text/calendar'});
      var a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='viora_publish.ics';a.click();
    });
    q('#v12cvPdf').addEventListener('click',async function(){
      var btn=this;btn.disabled=true;btn.textContent='⏳ Собираю PDF…';
      try{
        if(W.vEnsureLib){await W.vEnsureLib('html2canvas');await W.vEnsureLib('jspdf');}
        if(!W.html2canvas||!W.jspdf)throw new Error('библиотеки не загрузились');
        var PW=794,PH=1123;
        function page(html){
          var p=D.createElement('div');
          p.style.cssText='width:'+PW+'px;min-height:'+PH+'px;background:#fff;font-family:Onest,Inter,Arial,sans-serif;color:#160f1d;box-sizing:border-box;position:relative;overflow:hidden;padding:56px 54px';
          p.innerHTML=html;return p;
        }
        function h2(t){return '<div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ff2d55;font-weight:800;margin:26px 0 10px">'+t+'</div>';}
        var s=S();
        var head='<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #160f1d;padding-bottom:14px"><div style="font-weight:800;font-size:15px">VIORA · ПРОИЗВОДСТВЕННЫЙ ПАКЕТ</div><div style="font-size:11px;color:#9a92a5">'+esc(s.channel.title)+' · '+new Date().toLocaleDateString('ru-RU')+'</div></div>';
        var p1=page(head+
          '<div style="margin-top:34px;font-size:30px;font-weight:800;line-height:1.2">'+esc(d1.theme||'')+'</div>'+
          '<div style="margin-top:10px;font-size:13px;color:#6f6680;line-height:1.6">'+esc(d1.why||'')+' · Хронометраж: '+esc(d1.duration||'—')+'</div>'+
          h2('Сценарий')+'<div style="font-size:12px;line-height:1.65;color:#3c3546;white-space:pre-wrap">'+esc(scriptTxt).slice(0,4200)+'</div>');
        var p2=page(head+
          h2('Упаковка')+(d2.titles||[]).map(function(x,i){return '<div style="font-size:14px;font-weight:700;margin:6px 0">'+(i+1)+'. '+esc(x)+'</div>';}).join('')+
          '<div style="font-size:12.5px;margin-top:8px"><b>Превью:</b> '+esc(d2.thumb||'')+'</div>'+
          '<div style="font-size:12px;line-height:1.6;color:#3c3546;margin-top:8px;white-space:pre-wrap">'+esc(d2.desc||'')+'</div>'+
          '<div style="font-size:11px;color:#6f6680;margin-top:8px">Теги: '+esc((d2.tags||[]).join(', '))+'</div>'+
          h2('Промо')+'<div style="font-size:12px;line-height:1.65;color:#3c3546;white-space:pre-wrap">'+esc('Telegram:\n'+(d2.promo&&d2.promo.tg||'')+'\n\nТизер:\n'+(d2.promo&&d2.promo.teaser||'')+'\n\nПосев:\n'+(d2.promo&&d2.promo.seed||[]).map(function(x){return '• '+x;}).join('\n'))+'</div>'+
          h2('Выход')+'<div style="font-size:14px;font-weight:700">'+slot.date.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})+', '+slot.hour+':00</div>'+
          '<div style="position:absolute;left:54px;right:54px;bottom:34px;display:flex;justify-content:space-between;font-size:10.5px;color:#9a92a5"><span>Сделано в Viora · viora.media</span><span>Поддержка: @badVInq</span></div>');
        var wrap=D.createElement('div');wrap.style.cssText='position:fixed;left:-12000px;top:0;z-index:-1';
        wrap.appendChild(p1);wrap.appendChild(p2);D.body.appendChild(wrap);
        var jsPDF=W.jspdf.jsPDF,pdf=new jsPDF('p','mm','a4');
        var pgs=[p1,p2];
        for(var i=0;i<pgs.length;i++){
          var cv=await W.html2canvas(pgs[i],{backgroundColor:'#ffffff',scale:2,useCORS:true,logging:false,windowWidth:PW});
          if(i)pdf.addPage();
          pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297*Math.min(1,cv.height/(cv.width*1123/794)));
        }
        pdf.save('viora_production_pack.pdf');
        wrap.remove();C.toast('PDF-пакет скачан 🎉');
      }catch(e){C.toast('PDF не собрался: '+(e.message||e));}
      btn.disabled=false;btn.textContent='📄 Скачать PDF-пакет';
    });
    doc.scrollIntoView({behavior:'smooth',block:'start'});
  }
};
C.regTool({id:'conv',ic:'🏭',name:'Ролик под ключ',d:'Конвейер: тема → сценарий → упаковка → промо → дата выхода, одним пакетом + PDF',fn:W.v12ConvOpen,hub:true});
})();
