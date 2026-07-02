/* ============ VIORA V13 · разведка: общее ядро ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var ai=C.ai,ctx=C.ctx,chid=C.chid,lget=C.lget,lset=C.lset,S=C.S;

/* полные данные видео (с channelId — базовый getVideos его не отдаёт) */
async function vidsFull(ids){
  var out=[];
  for(var i=0;i<ids.length;i+=50){
    var d=await W.ytFetch('videos?part=snippet,statistics,contentDetails&id='+ids.slice(i,i+50).join(','));
    (d.items||[]).forEach(function(v){
      var dur=0;try{dur=W.durSec?W.durSec(v.contentDetails.duration):0;}catch(e){}
      var m=String(v.contentDetails.duration||'').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if(!dur&&m)dur=(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0);
      var views=+v.statistics.viewCount||0;
      var age=Math.max(0.5,(Date.now()-new Date(v.snippet.publishedAt))/864e5);
      out.push({
        id:v.id,title:v.snippet.title||'',desc:v.snippet.description||'',
        chId:v.snippet.channelId||'',chTitle:v.snippet.channelTitle||'',
        published:v.snippet.publishedAt,dur:dur,isShort:dur>0&&dur<=180,
        views:views,likes:+v.statistics.likeCount||0,comments:+v.statistics.commentCount||0,
        age:age,vpd:views/age
      });
    });
  }
  return out;
}

/* батч-данные каналов: id → {title,subs,videoCount} */
async function chBatch(ids){
  var uniq=[],seen={};
  ids.forEach(function(id){if(id&&!seen[id]){seen[id]=1;uniq.push(id);}});
  var map={};
  for(var i=0;i<uniq.length;i+=50){
    var d=await W.ytFetch('channels?part=snippet,statistics&id='+uniq.slice(i,i+50).join(','));
    (d.items||[]).forEach(function(c){
      map[c.id]={id:c.id,title:c.snippet.title||'',subs:+c.statistics.subscriberCount||0,videoCount:+c.statistics.videoCount||0,totalViews:+c.statistics.viewCount||0};
    });
  }
  return map;
}

/* множитель «выстрела»: насколько просмотры превышают размер канала */
function xMult(views,subs){return views/Math.max(subs||0,300);}
function xBadge(x){
  var t=x>=10?'hot':(x>=3?'warm':'cold');
  var label=x>=10?('×'+Math.round(x)+' к каналу 🔥'):(x>=1?('×'+(x>=3?Math.round(x):x.toFixed(1))+' к каналу'):('×'+x.toFixed(2)));
  return '<span class="v13-x '+t+'">'+label+'</span>';
}
function thumbUrl(id){return 'https://i.ytimg.com/vi/'+id+'/mqdefault.jpg';}

/* AI-подсказки поисковых запросов по нише (кэш на канал) */
async function nicheQs(){
  var key='v13_q:'+chid();
  var c=lget(key,null);
  if(c&&c.length)return c;
  var qs=[];
  try{
    var d=await ai('Ты — аналитик YouTube. Верни строго JSON {"queries":["...","...","..."]} — 3 коротких поисковых запроса (2-4 слова, на языке канала), по которым на YouTube ищут контент ниши этого канала. Без названия самого канала.',ctx()||'универсальный развлекательный канал',300);
    qs=(d.queries||[]).map(function(s){return String(s).slice(0,60);}).filter(Boolean).slice(0,3);
  }catch(e){}
  if(!qs.length){
    var s=S();
    qs=[(s.channel&&s.channel.title)||'youtube'];
    var nn='';try{nn=C.nicheName();}catch(e){}
    if(nn)qs.unshift(nn);
  }
  lset(key,qs);
  return qs;
}

/* строка запроса + чипы-подсказки */
function qBox(idPrefix,placeholder,btnLabel){
  return '<div class="v13-qrow"><input class="v10-in v11-in" id="'+idPrefix+'Q" placeholder="'+placeholder+'" style="flex:1;min-width:200px"><button class="v11-btn" id="'+idPrefix+'Go">'+btnLabel+'</button></div>'+
    '<div class="v13-chips" id="'+idPrefix+'Chips"></div>';
}
function fillChips(idPrefix,el,onPick){
  nicheQs().then(function(qs){
    var box=C.q('#'+idPrefix+'Chips',el);if(!box)return;
    box.innerHTML=qs.map(function(s){return '<button class="v13-chip">'+C.esc(s)+'</button>';}).join('');
    C.qa('.v13-chip',box).forEach(function(b){b.addEventListener('click',function(){
      var inp=C.q('#'+idPrefix+'Q',el);if(inp)inp.value=b.textContent;
      if(onPick)onPick(b.textContent);
    });});
    var inp=C.q('#'+idPrefix+'Q',el);
    if(inp&&!inp.value)inp.value=qs[0]||'';
  });
}
function ytLink(id){return 'https://www.youtube.com/watch?v='+id;}

W.__v13={vidsFull:vidsFull,chBatch:chBatch,xMult:xMult,xBadge:xBadge,thumbUrl:thumbUrl,nicheQs:nicheQs,qBox:qBox,fillChips:fillChips,ytLink:ytLink};
})();

;
/* ============ VIORA V13 · модуль 1: охотник за трендами (outliers) ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,lget=C.lget,lset=C.lset,chid=C.chid,DAY=C.DAY;
var V=W.__v13;

var PERIOD=7;
var LAST=[];

W.v13HuntOpen=function(){
  var el=openOv11('v13hunt','🎯','Охотник за трендами','Находит видео-выстрелы: форматы, которые взлетели сильнее размера своего канала');
  if(el.__b)return;el.__b=1;
  el.innerHTML=
    '<div class="v10-card"><div class="v10-h4" style="margin-top:0">🎯 Что ищем</div>'+
    '<div class="v10-note">Охотник сканирует нишу и находит ролики, которые набрали <b>сильно больше, чем «положено» каналу их размера</b>. Маленький канал + большие просмотры = работает формат, а не имя. Это готовые форматы для перехвата.</div>'+
    V.qBox('v13h','запрос ниши, например: хоррор прохождение','🔥 Найти выстрелы')+
    '<div class="v13-pills" style="margin-top:10px">'+
      '<button class="v13-pill on" data-d="7">за 7 дней</button>'+
      '<button class="v13-pill" data-d="30">за 30 дней</button>'+
      '<button class="v13-pill" data-d="90">за 90 дней</button>'+
    '</div></div>'+
    '<div id="v13hOut" style="margin-top:16px"></div>';
  V.fillChips('v13h',el);
  qa('.v13-pill',el).forEach(function(p){p.addEventListener('click',function(){
    qa('.v13-pill',el).forEach(function(x){x.classList.remove('on');});
    p.classList.add('on');PERIOD=+p.getAttribute('data-d')||7;
  });});
  q('#v13hGo',el).addEventListener('click',function(){run(el);});
  q('#v13hQ',el).addEventListener('keydown',function(e){if(e.key==='Enter')run(el);});
  var cached=lget('v13_hunt:'+chid(),null);
  if(cached&&cached.list&&cached.list.length){LAST=cached.list;render(q('#v13hOut',el),cached.list,cached.q,cached.d,true);}
};
function openOv11(id,ic,name,sub){
  var ovEl=C.q('#v4ov_'+id);
  if(!ovEl){
    ovEl=D.createElement('div');ovEl.className='v4-ov v11-ov';ovEl.id='v4ov_'+id;
    ovEl.innerHTML='<div class="v4-top"><button class="v4-back" onclick="v4Close(\''+id+'\')">←</button><div class="v4-ttl"><span>'+ic+'</span> '+name+'<small>'+sub+'</small></div><div class="sp"></div></div>'+
      '<div class="v4-body"><div class="v4-wrap" id="v11body_'+id+'">'+
      '<div class="v11-hero"><div class="v11-hero-ic">'+ic+'</div><div><div class="v11-hero-t">'+name+'</div><div class="v11-hero-s">'+sub+'</div></div></div>'+
      '<div id="v11main_'+id+'"></div></div></div>';
    D.body.appendChild(ovEl);
  }
  ovEl.classList.add('open');D.body.style.overflow='hidden';
  return C.q('#v11main_'+id);
}
W.__v13.openOv=openOv11;

async function run(el){
  var out=q('#v13hOut',el),btn=q('#v13hGo',el);
  var query=(q('#v13hQ',el)||{}).value.trim();
  if(!query){toast('Введи запрос ниши','warn');return;}
  btn.disabled=true;out.innerHTML=load11('Сканирую нишу: «'+esc(query)+'» за '+PERIOD+' дней…');
  try{
    var after=new Date(Date.now()-PERIOD*DAY).toISOString().replace(/\.\d+Z/,'Z');
    var ids=[],seen={};
    var orders=['viewCount','relevance'];
    for(var i=0;i<orders.length;i++){
      try{
        var s=await W.ytFetch('search?part=snippet&type=video&maxResults=50&order='+orders[i]+'&publishedAfter='+after+'&q='+encodeURIComponent(query));
        (s.items||[]).forEach(function(it){var v=it.id&&it.id.videoId;if(v&&!seen[v]){seen[v]=1;ids.push(v);}});
      }catch(e){if(!ids.length&&i===orders.length-1)throw e;}
    }
    if(!ids.length)throw new Error('Ничего не нашлось — попробуй другой запрос');
    out.innerHTML=load11('Считаю выстрелы: '+ids.length+' видео, данные каналов…');
    var vids=await V.vidsFull(ids);
    var chm=await V.chBatch(vids.map(function(v){return v.chId;}));
    var minViews=PERIOD<=7?2000:5000;
    var list=vids.map(function(v){
      var ch=chm[v.chId]||{subs:0,title:v.chTitle};
      return {v:v,ch:ch,x:V.xMult(v.views,ch.subs)};
    }).filter(function(r){return r.v.views>=minViews;});
    list.sort(function(a,b){return b.x-a.x;});
    list=list.slice(0,18);
    if(!list.length)throw new Error('Слишком мало данных в этой нише за период — расширь период');
    LAST=list;
    lset('v13_hunt:'+chid(),{list:list.map(slim),q:query,d:PERIOD,t:Date.now()});
    render(out,list.map(slim),query,PERIOD,false);
  }catch(e){out.innerHTML=err11(e);}
  btn.disabled=false;
}
function slim(r){
  if(r.slim)return r;
  return {slim:1,id:r.v.id,title:r.v.title,chT:r.ch.title,subs:r.ch.subs,views:r.v.views,vpd:r.v.vpd,age:r.v.age,isShort:r.v.isShort,x:r.x};
}
function render(out,list,query,days,fromCache){
  out.innerHTML=
    (fromCache?'<div class="v10-note" style="margin-bottom:10px">Показан прошлый скан («'+esc(query||'')+'», '+days+' дн). Нажми «Найти выстрелы» для свежего.</div>':'')+
    '<div class="v13-row" style="margin-bottom:12px"><button class="v11-btn" id="v13hAi">🧠 AI-разбор: общие паттерны + 3 идеи под мой канал</button></div>'+
    '<div id="v13hAiOut"></div>'+
    list.map(function(r,i){
      return '<div class="v13-vid" data-i="'+i+'">'+
        '<a class="v13-th" href="'+V.ytLink(r.id)+'" target="_blank" rel="noopener"><img src="'+V.thumbUrl(r.id)+'" alt="" loading="lazy"><span class="v13-rank">#'+(i+1)+'</span>'+(r.isShort?'<span class="v13-sh">Shorts</span>':'')+'</a>'+
        '<div class="v13-vi">'+
          '<a class="t" href="'+V.ytLink(r.id)+'" target="_blank" rel="noopener">'+esc(r.title)+'</a>'+
          '<div class="m">'+esc(r.chT)+' · '+fmt(r.subs)+' подп.</div>'+
          '<div class="s">'+V.xBadge(r.x)+'<span class="v13-stat">'+fmt(r.views)+' просм</span><span class="v13-stat">'+fmt(Math.round(r.vpd))+'/день</span><span class="v13-stat">'+Math.round(r.age)+' дн</span></div>'+
          '<div class="v13-row"><button class="v13-mini" data-rep="'+i+'">⚡ Повторить под себя</button></div>'+
          '<div class="v13-rep" id="v13rep'+i+'"></div>'+
        '</div></div>';
    }).join('');
  var aiBtn=q('#v13hAi',out);
  if(aiBtn)aiBtn.addEventListener('click',function(){overall(out,list,query);});
  qa('[data-rep]',out).forEach(function(b){b.addEventListener('click',function(){replicate(out,list[+b.getAttribute('data-rep')],+b.getAttribute('data-rep'),b);});});
}
async function overall(out,list,query){
  var box=q('#v13hAiOut',out),btn=q('#v13hAi',out);
  btn.disabled=true;box.innerHTML=load11('Ищу паттерны в топ-выстрелах…');
  try{
    var data=list.slice(0,12).map(function(r,i){return (i+1)+'. «'+r.title+'» — '+fmt(r.views)+' просм, канал '+fmt(r.subs)+' подп ('+(r.x>=1?'×'+r.x.toFixed(1):'×'+r.x.toFixed(2))+' к размеру)'+(r.isShort?' [shorts]':'');}).join('\n');
    var d=await ai('Ты — продюсер YouTube. Анализируешь видео-выстрелы ниши (просмотры сильно выше размера канала). Верни строго JSON {"patterns":["...","...","..."],"ideas":[{"title":"...","why":"..."},{"title":"...","why":"..."},{"title":"...","why":"..."}]}. patterns — 3 общих паттерна (формат/упаковка/тема), ideas — 3 идеи под МОЙ канал на базе этих паттернов с готовым заголовком.',
      'НИША (запрос): '+query+'\nВЫСТРЕЛЫ:\n'+data+'\n\nМОЙ КАНАЛ:\n'+(ctx()||'нет данных'),1300);
    box.innerHTML='<div class="v13-panel"><div class="v10-h4" style="margin-top:0">🧩 Паттерны выстрелов</div>'+
      (d.patterns||[]).map(function(p){return '<div class="kv">• '+esc(p)+'</div>';}).join('')+
      '<div class="v10-h4">💡 3 идеи под твой канал</div>'+
      (d.ideas||[]).map(function(x){
        return '<div class="v13-idea"><b>'+esc(x.title||'')+'</b><div class="kv">'+esc(x.why||'')+'</div>'+
        '<div class="v13-row"><button class="v13-mini" data-conv="'+esc(x.title||'').replace(/"/g,'&quot;')+'">🏭 В конвейер</button>'+
        '<button class="v13-mini" onclick="v11Copy(this)" data-c="'+esc(x.title||'').replace(/"/g,'&quot;')+'">📋</button></div></div>';
      }).join('')+'</div>';
    qa('[data-conv]',box).forEach(function(b){b.addEventListener('click',function(){
      try{W.v12ConvOpen(b.getAttribute('data-conv'));}catch(e){toast('Конвейер недоступен','warn');}
    });});
  }catch(e){box.innerHTML=err11(e);}
  btn.disabled=false;
}
async function replicate(out,r,i,btn){
  var box=q('#v13rep'+i,out);
  btn.disabled=true;box.innerHTML=load11('Разбираю выстрел…');
  try{
    var d=await ai('Ты — продюсер YouTube. Разбираешь чужое видео-выстрел и адаптируешь формат под мой канал. Верни строго JSON {"why":"почему взлетело (1-2 предложения)","title":"мой заголовок","hook":"дословный хук первых 10 секунд","angle":"мой угол подачи, чем отличаюсь (1 предложение)","thumb":"текст на превью (2-4 слова)"}',
      'ВЫСТРЕЛ: «'+r.title+'» — '+fmt(r.views)+' просмотров у канала «'+r.chT+'» ('+fmt(r.subs)+' подп., ×'+r.x.toFixed(1)+' к размеру'+(r.isShort?', shorts':'')+')\n\nМОЙ КАНАЛ:\n'+(ctx()||'нет данных'),900);
    box.innerHTML='<div class="v13-panel sm">'+
      '<div class="kv"><b>Почему взлетело:</b> '+esc(d.why||'')+'</div>'+
      '<div class="kv"><b>Твой заголовок:</b> '+esc(d.title||'')+' <button class="v13-mini" onclick="v11Copy(this)" data-c="'+esc(d.title||'').replace(/"/g,'&quot;')+'">📋</button></div>'+
      '<div class="kv"><b>Хук:</b> '+esc(d.hook||'')+'</div>'+
      '<div class="kv"><b>Угол:</b> '+esc(d.angle||'')+'</div>'+
      '<div class="kv"><b>Превью:</b> '+esc(d.thumb||'')+'</div>'+
      '<div class="v13-row" style="margin-top:8px">'+
        '<button class="v13-mini" data-th="'+esc(d.thumb||'').replace(/"/g,'&quot;')+'">🎨 В студию превью</button>'+
        '<button class="v13-mini" data-cv="'+esc(d.title||'').replace(/"/g,'&quot;')+'">🏭 В конвейер</button>'+
      '</div></div>';
    var th=box.querySelector('[data-th]'),cv=box.querySelector('[data-cv]');
    if(th)th.addEventListener('click',function(){try{W.v12ThumbOpen(th.getAttribute('data-th'));}catch(e){toast('Студия недоступна','warn');}});
    if(cv)cv.addEventListener('click',function(){try{W.v12ConvOpen(cv.getAttribute('data-cv'));}catch(e){toast('Конвейер недоступен','warn');}});
  }catch(e){box.innerHTML=err11(e);}
  btn.disabled=false;
}
C.regTool({id:'hunt',ic:'🎯',name:'Охотник за трендами',d:'Выстрелы ниши: видео, взлетевшие сильнее размера своего канала + как перехватить формат',fn:W.v13HuntOpen,hub:true});
})();

;
/* ============ VIORA V13 · модуль 2: вскрытие видео по ссылке ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,med=C.med;
var V=W.__v13;

W.v13AutOpen=function(url){
  var el=V.openOv('v13aut','🔬','Вскрытие видео','Кинь ссылку на любой ролик — своё или чужое — получишь полный разбор и пересборку под твой канал');
  if(!el.__b){
    el.__b=1;
    el.innerHTML=
      '<div class="v10-card"><div class="v10-h4" style="margin-top:0">🔪 Что вскрываем</div>'+
      '<div class="v10-note">Разбор по живым данным: скорость набора, вовлечённость, множитель к размеру канала, реакция аудитории из комментариев. В конце — <b>пересборка ролика под тебя</b>: заголовок, хук, угол, превью.</div>'+
      '<div class="v13-qrow"><input class="v10-in v11-in" id="v13aQ" placeholder="https://youtube.com/watch?v=… или youtu.be/…" style="flex:1;min-width:200px"><button class="v11-btn" id="v13aGo">🔪 Вскрыть</button></div></div>'+
      '<div id="v13aOut" style="margin-top:16px"></div>';
    q('#v13aGo',el).addEventListener('click',function(){run(el);});
    q('#v13aQ',el).addEventListener('keydown',function(e){if(e.key==='Enter')run(el);});
  }
  if(url&&typeof url==='string'){var inp=q('#v13aQ',el);if(inp){inp.value=url;run(el);}}
};

async function run(el){
  var out=q('#v13aOut',el),btn=q('#v13aGo',el);
  var raw=(q('#v13aQ',el)||{}).value.trim();
  if(!raw){toast('Вставь ссылку на видео','warn');return;}
  var p=null;try{p=W.parseInput(raw);}catch(e){}
  if(!p||p.type!=='video'){out.innerHTML='<div class="v10-err">Нужна ссылка на видео: youtube.com/watch?v=…, youtu.be/… или Shorts.</div>';return;}
  btn.disabled=true;out.innerHTML=load11('Достаю данные видео…');
  try{
    var vids=await V.vidsFull([p.value]);
    if(!vids.length)throw new Error('Видео не найдено или приватное');
    var v=vids[0];
    var chm=await V.chBatch([v.chId]);
    var ch=chm[v.chId]||{title:v.chTitle,subs:0};
    var x=V.xMult(v.views,ch.subs);
    out.innerHTML=load11('Читаю реакцию аудитории…');
    var cms=[];
    try{
      var d=await W.ytFetch('commentThreads?part=snippet&videoId='+v.id+'&maxResults=60&order=relevance&textFormat=plainText');
      (d.items||[]).forEach(function(it){
        var s=it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet;
        if(s)cms.push({t:String(s.textDisplay||'').replace(/\s+/g,' ').slice(0,180),lk:+s.likeCount||0});
      });
      cms.sort(function(a,b){return b.lk-a.lk;});
    }catch(e){}
    var likeR=v.views?(v.likes/v.views*100):0;
    var cmR=v.views?(v.comments/v.views*1000):0;
    var mine=isMine(v.chId);
    var head=
      '<div class="v13-vid" style="margin-bottom:14px">'+
        '<a class="v13-th" href="'+V.ytLink(v.id)+'" target="_blank" rel="noopener"><img src="'+V.thumbUrl(v.id)+'" alt="">'+(v.isShort?'<span class="v13-sh">Shorts</span>':'')+'</a>'+
        '<div class="v13-vi"><a class="t" href="'+V.ytLink(v.id)+'" target="_blank" rel="noopener">'+esc(v.title)+'</a>'+
        '<div class="m">'+esc(ch.title)+' · '+fmt(ch.subs)+' подп.'+(mine?' · <b style="color:#7be3a8">это твой канал</b>':'')+'</div></div></div>'+
      '<div class="v13-grid">'+
        stat(fmt(v.views),'просмотров')+
        stat((x>=1?'×'+(x>=3?Math.round(x):x.toFixed(1)):'×'+x.toFixed(2)),'к размеру канала',x>=3?'#7be3a8':(x>=1?'#ffd166':'#cfc8da'))+
        stat(fmt(Math.round(v.vpd)),'просм/день')+
        stat(likeR.toFixed(1)+'%','лайков от просмотров')+
        stat(cmR.toFixed(1),'комментов на 1000')+
        stat(Math.round(v.age)+' дн','возраст')+
      '</div>';
    out.innerHTML=head+load11('AI делает вскрытие и пересборку…');
    var sys='Ты — продюсер YouTube с 10-летним опытом. Делаешь вскрытие видео. Верни строго JSON {"score":0-100,"verdict":"вердикт 1-2 предложения","why":["причина 1","причина 2","причина 3"],"packaging":{"title_formula":"формула заголовка","hook":"как устроен заход"},"remake":{"titles":["...","...","..."],"thumb":"текст превью 2-4 слова","hook_script":"дословный хук 2-3 предложения","angle":"мой угол, чем отличусь"}} . score — сила ролика относительно размера канала. remake — пересборка ЭТОГО формата под МОЙ канал.';
    var user='ВИДЕО: «'+v.title+'»\nКанал: «'+ch.title+'», '+fmt(ch.subs)+' подп.\nПросмотры: '+fmt(v.views)+' за '+Math.round(v.age)+' дн ('+fmt(Math.round(v.vpd))+'/день, ×'+x.toFixed(2)+' к размеру канала)\nЛайки: '+likeR.toFixed(1)+'%, комментарии: '+cmR.toFixed(1)+'/1000'+(v.isShort?'\nФормат: Shorts':'')+'\nОписание (начало): '+v.desc.slice(0,260)+
      (cms.length?('\n\nТОП-КОММЕНТАРИИ:\n'+cms.slice(0,10).map(function(c){return '- ['+c.lk+'♥] '+c.t;}).join('\n')):'')+
      '\n\nМОЙ КАНАЛ:\n'+(ctx()||'нет данных — дай универсальную пересборку');
    var r=await ai(sys,user,1700);
    var sc=Math.max(0,Math.min(100,Math.round(+r.score||0)));
    out.innerHTML=head+
      '<div class="v13-panel" style="margin-top:14px"><div class="v13-score"><div class="n" style="color:'+(sc>=70?'#7be3a8':(sc>=40?'#ffd166':'#ff8aa0'))+'">'+sc+'</div><div class="l">сила ролика<br>для своего канала</div><div class="v">'+esc(r.verdict||'')+'</div></div>'+
      '<div class="v10-h4">🩻 Почему так</div>'+(r.why||[]).map(function(w){return '<div class="kv">• '+esc(w)+'</div>';}).join('')+
      '<div class="v10-h4">📦 Упаковка</div>'+
      '<div class="kv"><b>Формула заголовка:</b> '+esc((r.packaging||{}).title_formula||'')+'</div>'+
      '<div class="kv"><b>Заход:</b> '+esc((r.packaging||{}).hook||'')+'</div>'+
      (cms.length?('<div class="v10-h4">💬 Голос зрителей</div>'+cms.slice(0,4).map(function(c){return '<div class="v13-quote">«'+esc(c.t)+'» <span>♥ '+c.lk+'</span></div>';}).join('')):'')+
      '</div>'+
      '<div class="v13-panel" style="margin-top:14px"><div class="v10-h4" style="margin-top:0">🛠 Пересборка под твой канал</div>'+
      ((r.remake||{}).titles||[]).map(function(t,i){return '<div class="kv"><b>'+(i+1)+'.</b> '+esc(t)+' <button class="v13-mini" onclick="v11Copy(this)" data-c="'+esc(t).replace(/"/g,'&quot;')+'">📋</button></div>';}).join('')+
      '<div class="kv" style="margin-top:8px"><b>Превью:</b> '+esc((r.remake||{}).thumb||'')+'</div>'+
      '<div class="kv"><b>Хук:</b> '+esc((r.remake||{}).hook_script||'')+'</div>'+
      '<div class="kv"><b>Угол:</b> '+esc((r.remake||{}).angle||'')+'</div>'+
      '<div class="v13-row" style="margin-top:10px">'+
        '<button class="v11-btn" id="v13aTh">🎨 Превью в студию</button>'+
        '<button class="v11-btn" id="v13aCv">🏭 Ролик в конвейер</button>'+
      '</div></div>';
    var tt=((r.remake||{}).thumb||'');var t0=(((r.remake||{}).titles||[])[0])||v.title;
    q('#v13aTh',out).addEventListener('click',function(){try{W.v12ThumbOpen(tt);}catch(e){toast('Студия недоступна','warn');}});
    q('#v13aCv',out).addEventListener('click',function(){try{W.v12ConvOpen(t0);}catch(e){toast('Конвейер недоступен','warn');}});
  }catch(e){out.innerHTML=err11(e);}
  btn.disabled=false;
}
function stat(v,l,col){return '<div class="v13-stat-c"><div class="v" style="'+(col?('color:'+col):'')+'">'+v+'</div><div class="l">'+l+'</div></div>';}
function isMine(cid){try{return cid&&S().channel&&S().channel.id===cid;}catch(e){return false;}}
C.regTool({id:'aut',ic:'🔬',name:'Вскрытие видео',d:'Полный разбор любого ролика по ссылке + пересборка формата под твой канал',fn:function(){W.v13AutOpen();},hub:true});
})();

;
/* ============ VIORA V13 · модуль 3: голос аудитории (майнинг комментариев) ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,lget=C.lget,lset=C.lset,chid=C.chid;
var V=W.__v13;
var MODE='own';

W.v13MineOpen=function(){
  var el=V.openOv('v13mine','💬','Голос аудитории','Собирает сотни комментариев с топ-роликов канала и строит досье: кто смотрит, что просят снять, за что любят');
  if(el.__b){return;}
  el.__b=1;
  el.innerHTML=
    '<div class="v10-card"><div class="v10-h4" style="margin-top:0">⛏ Чьё досье строим</div>'+
    '<div class="v13-pills">'+
      '<button class="v13-pill on" data-m="own">🧑 Мой канал</button>'+
      '<button class="v13-pill" data-m="comp">🕵️ Канал конкурента</button>'+
    '</div>'+
    '<div class="v13-qrow" id="v13mUrlRow" style="display:none"><input class="v10-in v11-in" id="v13mQ" placeholder="youtube.com/@конкурент" style="flex:1;min-width:200px"></div>'+
    '<div class="v10-note">Возьму до 6 топ-роликов, добуду из них сотни живых комментариев и разложу: портрет зрителя, <b>что просят снять</b> (готовые заказы на контент), за что хвалят, на что жалуются. Натрави на конкурента — узнаешь, чего хочет ЕГО аудитория, и заберёшь себе.</div>'+
    '<div class="v13-row" style="margin-top:10px"><button class="v11-btn" id="v13mGo">⛏ Построить досье</button></div></div>'+
    '<div id="v13mOut" style="margin-top:16px"></div>';
  qa('.v13-pill',el).forEach(function(p){p.addEventListener('click',function(){
    qa('.v13-pill',el).forEach(function(x){x.classList.remove('on');});
    p.classList.add('on');MODE=p.getAttribute('data-m');
    q('#v13mUrlRow',el).style.display=MODE==='comp'?'flex':'none';
  });});
  q('#v13mGo',el).addEventListener('click',function(){run(el);});
};

async function topVideoIds(el){
  if(MODE==='own'){
    var s=S();
    if(!s.channel)throw new Error('Сначала проанализируй свой канал на главном экране');
    var longs=(s.longs||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;});
    var ids=longs.slice(0,6).map(function(v){return {id:v.id,title:v.title};});
    if(!ids.length)throw new Error('Нет данных по роликам канала');
    return {ids:ids,name:s.channel.title,subs:s.channel.subs||0};
  }
  var raw=(q('#v13mQ',el)||{}).value.trim();
  if(!raw)throw new Error('Вставь ссылку на канал конкурента');
  var pi=W.parseInput(raw);if(!pi)throw new Error('Не понял ссылку');
  var cid=await W.resolveChannelId(pi);
  var cd=await W.ytFetch('channels?part=snippet,statistics&id='+cid);
  if(!cd.items||!cd.items.length)throw new Error('Канал не найден');
  var ch=cd.items[0];
  var sr=await W.ytFetch('search?part=snippet&channelId='+cid+'&order=viewCount&type=video&maxResults=8');
  var ids=(sr.items||[]).map(function(it){return {id:it.id&&it.id.videoId,title:(it.snippet||{}).title||''};}).filter(function(x){return x.id;}).slice(0,6);
  if(!ids.length)throw new Error('У канала не нашлось видео');
  return {ids:ids,name:ch.snippet.title,subs:+ch.statistics.subscriberCount||0};
}

async function run(el){
  var out=q('#v13mOut',el),btn=q('#v13mGo',el);
  btn.disabled=true;out.innerHTML=load11('Выбираю топ-ролики…');
  try{
    var t=await topVideoIds(el);
    var all=[];
    for(var i=0;i<t.ids.length;i++){
      out.innerHTML=load11('Добываю комментарии: ролик '+(i+1)+' из '+t.ids.length+'…');
      try{
        var d=await W.ytFetch('commentThreads?part=snippet&videoId='+t.ids[i].id+'&maxResults=100&order=relevance&textFormat=plainText');
        (d.items||[]).forEach(function(it){
          var s=it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet;
          if(s){
            var txt=String(s.textDisplay||'').replace(/\s+/g,' ').trim();
            if(txt.length>=8)all.push({t:txt.slice(0,170),lk:+s.likeCount||0,vt:t.ids[i].title});
          }
        });
      }catch(e){}
    }
    if(all.length<15)throw new Error('Комментариев слишком мало (или они закрыты) — досье не построить');
    all.sort(function(a,b){return b.lk-a.lk;});
    var sample=all.slice(0,110).concat(shuffle(all.slice(110)).slice(0,40));
    out.innerHTML=load11('AI читает '+all.length+' комментариев и строит досье…');
    var sys='Ты — аналитик аудитории YouTube. По реальным комментариям строишь досье аудитории. Верни строго JSON {"portrait":"портрет зрителя 2-3 предложения: кто, возраст/вайб, зачем приходит","tone":"как аудитория общается, 1 предложение","requests":[{"idea":"что просят снять","quote":"короткая цитата-доказательство","heat":"high|med|low"}],"praises":["за что хвалят"],"complaints":["на что жалуются"],"faq":["частые вопросы"],"phrases":["фирменные фразы/мемы фанатов"],"ideas":[{"title":"готовый заголовок ролика по заказам аудитории","why":"почему зайдёт"}]} . requests — до 5, praises/complaints/faq/phrases — до 4 каждое, ideas — ровно 3.';
    var user='КАНАЛ: «'+t.name+'», '+fmt(t.subs)+' подп. Комментарии с топ-роликов (отсортированы по лайкам):\n'+
      sample.map(function(c){return '['+c.lk+'♥] '+c.t;}).join('\n').slice(0,11000)+
      (MODE==='comp'?('\n\nЭто канал КОНКУРЕНТА. МОЙ канал:\n'+(ctx()||'нет данных')+'\nideas делай ПОД МОЙ канал — как перехватить эти запросы аудитории.'):'');
    var r=await ai(sys,user,2100);
    render(out,r,t,all.length);
  }catch(e){out.innerHTML=err11(e);}
  btn.disabled=false;
}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;}return a;}
function heatChip(h){
  var m={high:['🔥 горячий спрос','#ff8aa0'],med:['⚖️ устойчивый','#ffd166'],low:['🌱 ниша','#9aa3b2']}[h]||['⚖️','#9aa3b2'];
  return '<span class="v13-heat" style="color:'+m[1]+'">'+m[0]+'</span>';
}
function render(out,r,t,total){
  out.innerHTML=
    '<div class="v13-panel"><div class="v10-h4" style="margin-top:0">🧑‍🤝‍🧑 Портрет аудитории «'+esc(t.name)+'»</div>'+
    '<div class="kv">'+esc(r.portrait||'')+'</div>'+
    '<div class="kv" style="color:#9aa3b2">'+esc(r.tone||'')+' · досье на базе '+total+' комментариев</div>'+
    '<div class="v10-h4">🎬 Что просят снять</div>'+
    (r.requests||[]).map(function(x){return '<div class="v13-idea"><b>'+esc(x.idea||'')+'</b> '+heatChip(x.heat)+'<div class="v13-quote">«'+esc(x.quote||'')+'»</div></div>';}).join('')+
    '<div class="v13-cols">'+
      col('💚 За что любят',r.praises)+col('⚠️ На что жалуются',r.complaints)+
      col('❓ Частые вопросы',r.faq)+col('🗣 Фразы фанатов',r.phrases)+
    '</div></div>'+
    '<div class="v13-panel" style="margin-top:14px"><div class="v10-h4" style="margin-top:0">💡 3 ролика по заказам аудитории</div>'+
    (r.ideas||[]).map(function(x){
      return '<div class="v13-idea"><b>'+esc(x.title||'')+'</b><div class="kv">'+esc(x.why||'')+'</div>'+
      '<div class="v13-row"><button class="v13-mini" data-cv="'+esc(x.title||'').replace(/"/g,'&quot;')+'">🏭 В конвейер</button>'+
      '<button class="v13-mini" onclick="v11Copy(this)" data-c="'+esc(x.title||'').replace(/"/g,'&quot;')+'">📋</button></div></div>';
    }).join('')+
    '<div class="v13-row" style="margin-top:10px"><button class="v11-btn" id="v13mCopy">📋 Скопировать всё досье</button></div></div>';
  qa('[data-cv]',out).forEach(function(b){b.addEventListener('click',function(){
    try{W.v12ConvOpen(b.getAttribute('data-cv'));}catch(e){toast('Конвейер недоступен','warn');}
  });});
  q('#v13mCopy',out).addEventListener('click',function(){
    var txt='ДОСЬЕ АУДИТОРИИ «'+t.name+'»\n\nПортрет: '+(r.portrait||'')+'\n\nЧто просят снять:\n'+
      (r.requests||[]).map(function(x){return '• '+x.idea+' — «'+x.quote+'»';}).join('\n')+
      '\n\nЗа что любят:\n'+(r.praises||[]).map(function(x){return '• '+x;}).join('\n')+
      '\n\nЖалобы:\n'+(r.complaints||[]).map(function(x){return '• '+x;}).join('\n')+
      '\n\nВопросы:\n'+(r.faq||[]).map(function(x){return '• '+x;}).join('\n')+
      '\n\nИдеи роликов:\n'+(r.ideas||[]).map(function(x){return '• '+x.title+' — '+x.why;}).join('\n');
    C.copyTxt(txt,this);
  });
}
function col(h,items){
  return '<div class="v13-col"><div class="h">'+h+'</div>'+((items||[]).map(function(x){return '<div class="kv">• '+esc(x)+'</div>';}).join('')||'<div class="kv" style="color:#9aa3b2">—</div>')+'</div>';
}
C.regTool({id:'mine',ic:'💬',name:'Голос аудитории',d:'Досье по сотням комментариев: портрет зрителя, что просят снять, за что любят — свой канал или конкурент',fn:W.v13MineOpen,hub:true});
})();

;
/* ============ VIORA V13 · модуль 4: карта ниши ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,S=C.S,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,toast=C.toast,med=C.med,DAY=C.DAY;
var V=W.__v13;
var DATA=null;

W.v13MapOpen=function(){
  var el=V.openOv('v13map','🗺️','Карта ниши','Интерактивная карта рынка: кто играет, где перегрето, а где свободная территория');
  if(el.__b)return;el.__b=1;
  el.innerHTML=
    '<div class="v10-card"><div class="v10-h4" style="margin-top:0">🧭 Какую нишу картографируем</div>'+
    '<div class="v10-note">Сканирую активность ниши за 60 дней: каждый пузырь — канал (размер = подписчики, цвет = насколько его ролики стреляют выше размера). Потом AI размечает темы: где перегрето, а где <b>спрос есть, конкуренции нет</b>.</div>'+
    V.qBox('v13p','запрос ниши','🗺 Построить карту')+'</div>'+
    '<div id="v13pOut" style="margin-top:16px"></div>';
  V.fillChips('v13p',el);
  q('#v13pGo',el).addEventListener('click',function(){run(el);});
  q('#v13pQ',el).addEventListener('keydown',function(e){if(e.key==='Enter')run(el);});
};

async function run(el){
  var out=q('#v13pOut',el),btn=q('#v13pGo',el);
  var query=(q('#v13pQ',el)||{}).value.trim();
  if(!query){toast('Введи запрос ниши','warn');return;}
  btn.disabled=true;out.innerHTML=load11('Сканирую нишу «'+esc(query)+'» за 60 дней…');
  try{
    var after=new Date(Date.now()-60*DAY).toISOString().replace(/\.\d+Z/,'Z');
    var ids=[],seen={};
    var orders=['viewCount','date'];
    for(var i=0;i<orders.length;i++){
      try{
        var s=await W.ytFetch('search?part=snippet&type=video&maxResults=50&order='+orders[i]+'&publishedAfter='+after+'&q='+encodeURIComponent(query));
        (s.items||[]).forEach(function(it){var v=it.id&&it.id.videoId;if(v&&!seen[v]){seen[v]=1;ids.push(v);}});
      }catch(e){if(!ids.length&&i===orders.length-1)throw e;}
    }
    if(ids.length<8)throw new Error('Слишком мало активности по этому запросу — попробуй шире');
    out.innerHTML=load11('Собираю данные '+ids.length+' видео и каналов…');
    var vids=await V.vidsFull(ids);
    var chm=await V.chBatch(vids.map(function(v){return v.chId;}));
    var agg={};
    vids.forEach(function(v){
      if(!chm[v.chId])return;
      var a=agg[v.chId]||(agg[v.chId]={ch:chm[v.chId],vids:[],best:null});
      a.vids.push(v);
      if(!a.best||v.views>a.best.views)a.best=v;
    });
    var rows=Object.keys(agg).map(function(k){
      var a=agg[k];
      var mv=med(a.vids.map(function(v){return v.views;}))||0;
      return {ch:a.ch,n:a.vids.length,mv:mv,heat:V.xMult(mv,a.ch.subs),best:a.best,sum:a.vids.reduce(function(t,v){return t+v.views;},0)};
    }).filter(function(r){return r.mv>=500;});
    rows.sort(function(a,b){return b.sum-a.sum;});
    rows=rows.slice(0,30);
    if(rows.length<5)throw new Error('Мало живых каналов в выборке — попробуй другой запрос');
    DATA={rows:rows,q:query};
    drawMap(out,rows,query);
    aiThemes(out,vids,rows,query);
  }catch(e){out.innerHTML=err11(e);}
  btn.disabled=false;
}

/* ---------- SVG пузырьковая карта ---------- */
function drawMap(out,rows,query){
  var Wd=720,H=440,padL=64,padB=46,padT=18,padR=18;
  var me=null;try{var s=S();if(s.channel){var myMv=med((s.longs||[]).slice(0,15).map(function(v){return v.views;}))||0;me={subs:s.channel.subs||0,mv:myMv,title:s.channel.title};}}catch(e){}
  var subsAll=rows.map(function(r){return r.ch.subs;}).concat(me&&me.subs?[me.subs]:[]);
  var mvAll=rows.map(function(r){return r.mv;}).concat(me&&me.mv?[me.mv]:[]);
  function lg(v){return Math.log10(Math.max(10,v));}
  var x0=Math.min.apply(null,subsAll.map(lg))-0.25,x1=Math.max.apply(null,subsAll.map(lg))+0.25;
  var y0=Math.min.apply(null,mvAll.map(lg))-0.25,y1=Math.max.apply(null,mvAll.map(lg))+0.25;
  function X(v){return padL+(Wd-padL-padR)*((lg(v)-x0)/(x1-x0));}
  function Y(v){return H-padB-(H-padB-padT)*((lg(v)-y0)/(y1-y0));}
  function R(n){return 7+Math.min(16,Math.sqrt(n)*4);}
  function col(h){return h>=1?'#ff4d6d':(h>=0.25?'#ffb14d':'#7d8aa0');}
  var ticks='';
  for(var e=Math.ceil(x0);e<=Math.floor(x1);e++){
    ticks+='<line x1="'+X(Math.pow(10,e))+'" y1="'+padT+'" x2="'+X(Math.pow(10,e))+'" y2="'+(H-padB)+'" stroke="rgba(255,255,255,.06)"/>'+
      '<text x="'+X(Math.pow(10,e))+'" y="'+(H-padB+20)+'" fill="#8b93a5" font-size="11" text-anchor="middle">'+short(Math.pow(10,e))+'</text>';
  }
  for(var e2=Math.ceil(y0);e2<=Math.floor(y1);e2++){
    ticks+='<line x1="'+padL+'" y1="'+Y(Math.pow(10,e2))+'" x2="'+(Wd-padR)+'" y2="'+Y(Math.pow(10,e2))+'" stroke="rgba(255,255,255,.06)"/>'+
      '<text x="'+(padL-8)+'" y="'+(Y(Math.pow(10,e2))+4)+'" fill="#8b93a5" font-size="11" text-anchor="end">'+short(Math.pow(10,e2))+'</text>';
  }
  var bubbles=rows.map(function(r,i){
    return '<circle class="v13-bub" data-i="'+i+'" cx="'+X(r.ch.subs).toFixed(1)+'" cy="'+Y(r.mv).toFixed(1)+'" r="'+R(r.n).toFixed(1)+'" fill="'+col(r.heat)+'" fill-opacity=".55" stroke="'+col(r.heat)+'" stroke-width="1.5"/>';
  }).join('');
  var meDot=me&&me.subs&&me.mv?('<g><circle cx="'+X(me.subs).toFixed(1)+'" cy="'+Y(me.mv).toFixed(1)+'" r="9" fill="#2aabee" stroke="#fff" stroke-width="2"/><text x="'+X(me.subs).toFixed(1)+'" y="'+(Y(me.mv)-14).toFixed(1)+'" fill="#7fd0ff" font-size="11.5" font-weight="700" text-anchor="middle">ТЫ</text></g>'):'';
  out.innerHTML=
    '<div class="v13-panel"><div class="v10-h4" style="margin-top:0">🗺 Карта ниши «'+esc(query)+'» · 60 дней</div>'+
    '<div class="v13-mapwrap"><svg viewBox="0 0 '+Wd+' '+H+'" class="v13-map" preserveAspectRatio="xMidYMid meet">'+ticks+
    '<text x="'+(Wd/2)+'" y="'+(H-6)+'" fill="#aab2c2" font-size="11.5" text-anchor="middle">подписчики канала →</text>'+
    '<text x="14" y="'+(H/2)+'" fill="#aab2c2" font-size="11.5" text-anchor="middle" transform="rotate(-90 14 '+(H/2)+')">медиана просмотров за 60 дн →</text>'+
    bubbles+meDot+'</svg></div>'+
    '<div class="v13-leg"><span><i style="background:#ff4d6d"></i> стреляют выше размера</span><span><i style="background:#ffb14d"></i> в норме</span><span><i style="background:#7d8aa0"></i> ниже нормы</span><span><i style="background:#2aabee"></i> твой канал</span><span>размер пузыря = активность</span></div>'+
    '<div class="v10-note" style="margin-top:6px">Тапни по пузырю — покажу, кто это и что у него залетело.</div>'+
    '<div id="v13pInfo"></div></div>'+
    '<div id="v13pThemes" style="margin-top:14px">'+load11('AI размечает темы: где перегрето, где свободно…')+'</div>';
  qa('.v13-bub',out).forEach(function(c){c.addEventListener('click',function(){
    var r=rows[+c.getAttribute('data-i')];
    qa('.v13-bub',out).forEach(function(x){x.setAttribute('stroke-width','1.5');});
    c.setAttribute('stroke-width','3.5');
    q('#v13pInfo',out).innerHTML='<div class="v13-idea" style="margin-top:10px"><b>'+esc(r.ch.title)+'</b> · '+fmt(r.ch.subs)+' подп.'+
      '<div class="kv">'+r.n+' видео за 60 дн · медиана '+fmt(Math.round(r.mv))+' просм · '+(r.heat>=1?'<b style="color:#ff8aa0">стреляет ×'+r.heat.toFixed(1)+' выше размера</b>':'тепло ×'+r.heat.toFixed(2))+'</div>'+
      (r.best?('<div class="kv">Хит: <a href="'+V.ytLink(r.best.id)+'" target="_blank" rel="noopener" style="color:#7fd0ff">«'+esc(r.best.title)+'»</a> — '+fmt(r.best.views)+' просм</div>'):'')+
      (r.best?('<div class="v13-row" style="margin-top:6px"><button class="v13-mini" data-aut="'+V.ytLink(r.best.id)+'">🔬 Вскрыть хит</button></div>'):'')+'</div>';
    var ab=q('#v13pInfo [data-aut]',out);
    if(ab)ab.addEventListener('click',function(){try{W.v13AutOpen(ab.getAttribute('data-aut'));}catch(e){}});
  });});
}
function short(n){if(n>=1e6)return (n/1e6)+'M';if(n>=1e3)return (n/1e3)+'K';return String(n);}

/* ---------- AI: темы и свободные ниши ---------- */
async function aiThemes(out,vids,rows,query){
  var box=q('#v13pThemes',out);
  try{
    var sample=vids.slice().sort(function(a,b){return b.views-a.views;}).slice(0,40)
      .map(function(v){var ch=null;rows.some(function(r){if(r.ch.id===v.chId){ch=r.ch;return true;}return false;});
        return '«'+v.title+'» — '+fmt(v.views)+' просм'+(ch?(', канал '+fmt(ch.subs)+' подп'):'');}).join('\n');
    var d=await ai('Ты — стратег YouTube. По выборке видео ниши размечаешь карту тем. Верни строго JSON {"clusters":[{"name":"тема","demand":"high|med|low","supply":"high|med|low","verdict":"hot|ok|free","note":"1 предложение"}],"free":[{"niche":"свободная под-ниша","why":"почему сработает","first":"заголовок первого ролика"}]} . clusters — 4-6 тем (verdict: hot=перегрето, ok=можно заходить, free=свободно), free — ровно 3 свободные ниши ПОД МОЙ канал.',
      'НИША: '+query+'\nВИДЕО ЗА 60 ДНЕЙ:\n'+sample+'\n\nМОЙ КАНАЛ:\n'+(ctx()||'нет данных'),1700);
    var vmap={hot:['🔥 перегрето','#ff8aa0'],ok:['⚖️ можно заходить','#ffd166'],free:['🟢 свободно','#7be3a8']};
    box.innerHTML='<div class="v13-panel"><div class="v10-h4" style="margin-top:0">🌡 Температура тем</div>'+
      '<div class="v13-tbl">'+(d.clusters||[]).map(function(c){
        var vv=vmap[c.verdict]||vmap.ok;
        return '<div class="v13-tr"><div class="n">'+esc(c.name||'')+'</div>'+bar('спрос',c.demand)+bar('конкуренция',c.supply)+
          '<div class="vd" style="color:'+vv[1]+'">'+vv[0]+'</div><div class="nt">'+esc(c.note||'')+'</div></div>';
      }).join('')+'</div>'+
      '<div class="v10-h4">🚀 3 свободные территории под тебя</div>'+
      (d.free||[]).map(function(f){
        return '<div class="v13-idea"><b>'+esc(f.niche||'')+'</b><div class="kv">'+esc(f.why||'')+'</div>'+
        '<div class="kv">Первый ролик: <b>'+esc(f.first||'')+'</b></div>'+
        '<div class="v13-row"><button class="v13-mini" data-cv="'+esc(f.first||'').replace(/"/g,'&quot;')+'">🏭 В конвейер</button>'+
        '<button class="v13-mini" onclick="v11Copy(this)" data-c="'+esc(f.first||'').replace(/"/g,'&quot;')+'">📋</button></div></div>';
      }).join('')+'</div>';
    qa('[data-cv]',box).forEach(function(b){b.addEventListener('click',function(){
      try{W.v12ConvOpen(b.getAttribute('data-cv'));}catch(e){toast('Конвейер недоступен','warn');}
    });});
  }catch(e){box.innerHTML=err11(e);}
}
function bar(label,lvl){
  var p={high:92,med:55,low:22}[lvl]||55;
  return '<div class="bw"><span>'+label+'</span><div class="b"><i style="width:'+p+'%"></i></div></div>';
}
C.regTool({id:'map',ic:'🗺️',name:'Карта ниши',d:'Пузырьковая карта рынка: игроки, перегретые темы и свободные территории под твой канал',fn:W.v13MapOpen,hub:true});
})();
