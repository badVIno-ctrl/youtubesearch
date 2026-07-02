/* ============ VIORA V15 · «Радар»: ядро + центр уведомлений (UI) ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,chid=C.chid,fmt=C.fmt,toast=C.toast;

/* ---------- хранилище уведомлений (per-канал) ---------- */
function nKey(){return 'v15_ntf:'+(chid()||'_');}
function seenKey(){return 'v15_seen:'+(chid()||'_');}
function list(){return lget(nKey(),[])||[];}
function save(l){lset(nKey(),l.slice(0,40));}
function seen(){return lget(seenKey(),{})||{};}
function markSeen(id){var s=seen();s[id]=1;lset(seenKey(),s);}
function unread(){return list().filter(function(n){return !n.read;}).length;}
function addNotif(n){
  var l=list();
  if(l.some(function(x){return x.id===n.id;}))return false;
  n.ts=n.ts||Date.now();n.read=false;
  l.unshift(n);save(l);
  return true;
}
function markAllRead(){var l=list();l.forEach(function(n){n.read=true;});save(l);paintBell();}
function clearAll(){save([]);paintBell();}

/* ---------- колокольчик в шапке ---------- */
function bell(){
  if(q('#v15bell'))return;
  var anchor=q('#v6NavTools');if(!anchor||!anchor.parentNode)return;
  var b=D.createElement('button');b.id='v15bell';b.type='button';b.title='Уведомления Viora';
  b.innerHTML='<span class="v15-bell-ic">🔔</span><span class="v15-bell-n" id="v15bellN" style="display:none">0</span>';
  anchor.parentNode.insertBefore(b,anchor);
  b.addEventListener('click',function(e){e.stopPropagation();togglePanel();});
  D.addEventListener('click',function(e){
    var p=q('#v15panel');
    if(p&&p.classList.contains('show')&&!p.contains(e.target)&&e.target!==b&&!b.contains(e.target))p.classList.remove('show');
  });
  paintBell();
}
function paintBell(){
  var n=q('#v15bellN');if(!n)return;
  var u=unread();
  n.style.display=u?'grid':'none';n.textContent=u>9?'9+':u;
  var b=q('#v15bell');if(b)b.classList.toggle('hot',u>0);
}
setInterval(bell,1500);

/* ---------- панель уведомлений ---------- */
function ago(ts){
  var m=Math.max(1,Math.round((Date.now()-ts)/6e4));
  if(m<60)return m+' мин назад';
  var h=Math.round(m/60);if(h<24)return h+' ч назад';
  return Math.round(h/24)+' дн назад';
}
function togglePanel(){
  var p=q('#v15panel');
  if(!p){p=D.createElement('div');p.id='v15panel';D.body.appendChild(p);}
  if(p.classList.contains('show')){p.classList.remove('show');return;}
  drawPanel(p);
  var b=q('#v15bell');
  if(b){var r=b.getBoundingClientRect();p.style.top=(r.bottom+10)+'px';p.style.right=Math.max(8,W.innerWidth-r.right-8)+'px';}
  p.classList.add('show');
  setTimeout(markAllRead,1600);
}
function drawPanel(p){
  var l=list(),V=W.__v13;
  var comps=lget('v11_comp:'+chid(),[])||[];
  p.innerHTML='<div class="v15p-head"><b>🔔 Уведомления</b><span class="sp"></span>'+
    '<button class="v15p-act" id="v15scanBtn" title="Проверить конкурентов сейчас">🔄</button>'+
    (l.length?'<button class="v15p-act" id="v15clrBtn" title="Очистить">🗑</button>':'')+'</div>'+
    '<div class="v15p-body">'+
    (l.length?l.map(function(n,i){
      var img=n.vid?('<img class="v15n-img" src="https://i.ytimg.com/vi/'+n.vid+'/mqdefault.jpg" alt="" loading="lazy">'):'';
      var tag=n.type==='own'?'<span class="v15n-tag own">твой канал</span>':(n.type==='comp'?'<span class="v15n-tag">конкурент</span>':'');
      return '<div class="v15n'+(n.read?'':' un')+'" data-i="'+i+'">'+img+
        '<div class="v15n-tx"><div class="v15n-t">'+tag+' '+esc(n.title||'')+'</div>'+
        (n.body?'<div class="v15n-b">'+esc(n.body)+'</div>':'')+
        (n.why?'<div class="v15n-why">💡 '+esc(n.why)+'</div>':'')+
        '<div class="v15n-meta">'+esc(n.ch||'')+' · '+ago(n.ts)+'</div>'+
        (n.vid?'<div class="v15n-row"><button class="v15n-btn" data-act="aut" data-v="'+n.vid+'">🔬 Вскрыть и перехватить</button><a class="v15n-btn ghost" href="https://www.youtube.com/watch?v='+n.vid+'" target="_blank" rel="noopener">▶ Открыть</a></div>':'')+
        '</div></div>';
    }).join(''):
    '<div class="v15p-empty">Пока тихо. '+(comps.length?
      'Слежу за '+comps.length+' конкурент'+(comps.length===1?'ом':'ами')+' — как только у кого-то взлетит ролик, здесь появится разбор, почему.':
      'Добавь конкурентов — и Viora будет сообщать, когда у них что-то взлетело, и объяснять почему.')+'</div>')+
    '</div>'+
    '<div class="v15p-foot"><button class="v15p-link" id="v15compLnk">📡 Мои конкуренты ('+comps.length+')</button></div>';
  var sb=q('#v15scanBtn',p);
  if(sb)sb.addEventListener('click',function(){
    sb.disabled=true;sb.textContent='…';
    Promise.resolve(W.__v15.scan(true)).then(function(){sb.disabled=false;sb.textContent='🔄';drawPanel(p);});
  });
  var cb=q('#v15clrBtn',p);
  if(cb)cb.addEventListener('click',function(){clearAll();drawPanel(p);});
  var cl=q('#v15compLnk',p);
  if(cl)cl.addEventListener('click',function(){p.classList.remove('show');if(W.v11CompOpen)W.v11CompOpen();});
  qa('.v15n-btn[data-act="aut"]',p).forEach(function(b){
    b.addEventListener('click',function(){
      p.classList.remove('show');
      if(W.v13AutOpen)W.v13AutOpen('https://www.youtube.com/watch?v='+b.getAttribute('data-v'));
    });
  });
}

W.__v15={addNotif:addNotif,paintBell:paintBell,markSeen:markSeen,seen:seen,unread:unread,scan:function(){return Promise.resolve();}};
})();

;
/* ============ VIORA V15 · сканер конкурентов: что взлетело и почему ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var lget=C.lget,lset=C.lset,chid=C.chid,fmt=C.fmt,toast=C.toast,ai=C.ai,ctx=C.ctx,DAY=C.DAY;

function comps(){return lget('v11_comp:'+chid(),[])||[];}
function lastKey(){return 'v15_scan:'+(chid()||'_');}

async function freshOf(chId){
  var d=await W.ytFetch('search?part=id&channelId='+chId+'&order=date&type=video&maxResults=10&publishedAfter='+new Date(Date.now()-10*DAY).toISOString().replace(/\.\d+Z/,'Z'));
  return (d.items||[]).map(function(it){return it.id&&it.id.videoId;}).filter(Boolean);
}

/* короткое AI-объяснение «почему взлетело» для пачки роликов */
async function whys(flagged){
  if(!flagged.length)return {};
  var lines=flagged.map(function(f,i){
    return (i+1)+'. «'+f.v.title.slice(0,90)+'» — канал '+f.c.title+' ('+fmt(f.c.subs)+' подп.), '+fmt(f.v.views)+' просмотров за '+Math.round(f.v.age)+' дн ('+(f.x>=3?'выстрел ×'+Math.round(f.x):'выше нормы')+')';
  }).join('\n');
  try{
    var d=await ai('Ты — продюсер YouTube. Для каждого ролика из списка коротко (до 14 слов) объясни, почему он, скорее всего, взлетел: триггер в заголовке/теме/формате. Верни строго JSON {"whys":["...","..."]} в том же порядке.',lines,500);
    var out={};(d.whys||[]).forEach(function(w,i){if(flagged[i])out[flagged[i].v.id]=String(w).slice(0,140);});
    return out;
  }catch(e){return {};}
}

async function scan(manual){
  var V=W.__v13,N=W.__v15;
  if(!V||!chid())return;
  var cl=comps();
  var found=0;

  /* 1. конкуренты */
  if(cl.length){
    var vids=[],owner={};
    for(var i=0;i<Math.min(cl.length,8);i++){
      try{
        var ids=await freshOf(cl[i].id);
        ids.forEach(function(id){owner[id]=cl[i];});
        vids=vids.concat(ids);
      }catch(e){}
    }
    var newIds=vids.filter(function(id){return !N.seen()[id];});
    if(newIds.length){
      var full=await V.vidsFull(newIds);
      /* норма канала = медианный vpd его свежих роликов */
      var byCh={};
      full.forEach(function(v){var c=owner[v.id];if(!c)return;(byCh[c.id]=byCh[c.id]||[]).push(v.vpd);});
      var norm={};
      Object.keys(byCh).forEach(function(k){
        var a=byCh[k].slice().sort(function(x,y){return x-y;});
        norm[k]=a[Math.floor(a.length/2)]||1;
      });
      var flagged=[];
      full.forEach(function(v){
        var c=owner[v.id];if(!c)return;
        var x=V.xMult(v.views,c.subs);
        var rel=v.vpd/Math.max(norm[c.id]||1,1);
        N.markSeen(v.id);
        /* взлёт: сильно выше своей нормы (если есть с чем сравнить) или больше размера канала */
        if((byCh[c.id].length>=3&&rel>=2&&v.views>=1000)||x>=0.7||v.vpd>=Math.max(2000,c.subs*0.05))flagged.push({v:v,c:c,x:x,rel:rel});
      });
      flagged.sort(function(a,b){return b.x-a.x;});
      flagged=flagged.slice(0,4);
      var wmap=await whys(flagged);
      flagged.forEach(function(f){
        if(N.addNotif({
          id:'c_'+f.v.id,type:'comp',vid:f.v.id,ch:f.c.title,
          title:f.v.title.slice(0,90),
          body:fmt(f.v.views)+' просмотров за '+Math.max(1,Math.round(f.v.age))+' дн'+(f.x>=0.5?' · ×'+(f.x>=3?Math.round(f.x):f.x.toFixed(1))+' к размеру канала':(f.rel>=2?' · ×'+f.rel.toFixed(1)+' к норме канала':'')),
          why:wmap[f.v.id]||''
        }))found++;
      });
    }
  }

  /* 2. свой канал: ролик начал взлетать */
  try{
    var V14=W.__v14;
    if(V14){
      V14.myVids().forEach(function(v){
        var age=(Date.now()-new Date(v.published))/DAY;
        if(age>0&&age<=14&&V14.heat(v)>=2&&!N.seen()['o_'+v.id]){
          N.markSeen('o_'+v.id);
          if(N.addNotif({
            id:'o_'+v.id,type:'own',vid:v.id,ch:'',
            title:v.title.slice(0,90),
            body:'Набирает '+fmt(Math.round(v.vpd))+'/день — это ×'+V14.heat(v).toFixed(1)+' к твоей норме. Поддержи: Shorts-нарезка + пост в TG.',
            why:''
          }))found++;
        }
      });
    }
  }catch(e){}

  lset(lastKey(),Date.now());
  N.paintBell();
  if(found)toast('🔔 '+found+' нов'+(found===1?'ое уведомление':'ых уведомления'),'ok');
  else if(manual)toast('Проверил — пока без взлётов','ok');
}
W.__v15.scan=scan;

/* автоскан: раз в 12 часов, когда канал проанализирован и есть конкуренты */
var tried=false;
setInterval(function(){
  if(tried||!chid()||!comps().length)return;
  var last=lget(lastKey(),0)||0;
  if(Date.now()-last<12*36e5){tried=true;return;}
  tried=true;
  setTimeout(function(){scan(false).catch(function(){});},4000);
},3000);
})();

;
/* ============ VIORA V15 · Поисковый радар: живой спрос YouTube ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,qa=C.qa,esc=C.esc,fmt=C.fmt,toast=C.toast,ai=C.ai,ctx=C.ctx,err11=C.err11,load11=C.load11,needCh=C.needCh,regTool=C.regTool;

/* живые подсказки поиска YouTube (JSONP, без ключей) */
function suggest(query){
  return new Promise(function(res){
    var cb='__v15s'+(Math.random()*1e9|0),done=false;
    var s=D.createElement('script');
    W[cb]=function(data){
      done=true;
      var items=[];
      try{items=(data&&data[1]||[]).map(function(x){return String(Array.isArray(x)?x[0]:x);});}catch(e){}
      try{delete W[cb];}catch(e){}s.remove();res(items);
    };
    s.onerror=function(){if(!done){try{delete W[cb];}catch(e){}s.remove();res([]);}};
    s.src='https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&hl=ru&q='+encodeURIComponent(query)+'&callback='+cb;
    D.head.appendChild(s);
    setTimeout(function(){if(W[cb]){try{delete W[cb];}catch(e){}s.remove();res([]);}},4500);
  });
}

/* майнинг: базовый запрос + расширения → {query → спрос-балл} */
async function mine(base){
  var probes=[base,base+' как',base+' почему',base+' топ',base+' для',base+' 2026','как '+base,'лучший '+base];
  var score={},total=0;
  for(var i=0;i<probes.length;i++){
    var items=await suggest(probes[i]);
    total+=items.length;
    items.forEach(function(s,pos){
      s=s.toLowerCase().trim();
      if(!s||s.length<4||s.length>70)return;
      score[s]=(score[s]||0)+(items.length-pos)+(i===0?6:0);
    });
  }
  if(!total){
    /* сеть закрыла подсказки — fallback через AI, инструмент не ломается */
    try{
      var d=await ai('Верни строго JSON {"queries":["..."]} — 10 реальных поисковых запросов YouTube (рус., 2-5 слов) вокруг темы.',base,400);
      (d.queries||[]).forEach(function(s,i){score[String(s).toLowerCase()]=20-i;});
    }catch(e){}
  }
  return Object.keys(score).map(function(k){return {q:k,demand:score[k]};})
    .sort(function(a,b){return b.demand-a.demand;}).slice(0,8);
}

/* конкуренция по запросу: топ выдачи → медианные просмотры, свежесть */
async function competition(query){
  var V=W.__v13;
  var d=await W.ytFetch('search?part=id&q='+encodeURIComponent(query)+'&type=video&maxResults=4&relevanceLanguage=ru');
  var ids=(d.items||[]).map(function(it){return it.id&&it.id.videoId;}).filter(Boolean);
  if(!ids.length)return {med:0,fresh:0,top:[]};
  var full=await V.vidsFull(ids);
  var vs=full.map(function(v){return v.views;}).sort(function(a,b){return a-b;});
  var med=vs.length?vs[Math.floor(vs.length/2)]:0;
  var fresh=full.filter(function(v){return v.age<365;}).length/Math.max(full.length,1);
  return {med:med,fresh:fresh,top:full.slice(0,4)};
}

function zone(p){
  if(p.norm>=0.5&&p.comp<0.45)return 'gold';
  if(p.norm>=0.35&&p.comp<0.7)return 'ok';
  return 'hard';
}
var ZN={gold:'🏆 золотая зона',ok:'⚖️ рабочая',hard:'🔥 перегрето'};
var ZC={gold:'#3ddc97',ok:'#7fb4ff',hard:'#ff5e7a'};

async function run(el){
  if(!C.chid()){var o0=q('#v15rdOut',el);if(o0)o0.innerHTML=needCh();return;}
  var base=(q('#v15rdQ',el)||{}).value||'';
  base=base.trim();if(!base){toast('Введи тему или выбери подсказку','warn');return;}
  var out=q('#v15rdOut',el);
  out.innerHTML=load11('Слушаю живой поиск YouTube: что люди вводят прямо сейчас…');
  try{
    var rows=await mine(base);
    if(!rows.length)throw new Error('подсказки не нашлись — попробуй другую формулировку');
    out.innerHTML=load11('Замеряю конкуренцию по '+rows.length+' запросам…');
    for(var i=0;i<rows.length;i++){
      try{var c=await competition(rows[i].q);}catch(e){c={med:0,fresh:0,top:[]};}
      rows[i].med=c.med;rows[i].fresh=c.fresh;rows[i].top=c.top;
    }
    var dmax=Math.max.apply(null,rows.map(function(r){return r.demand;}));
    var mmax=Math.max(1,Math.max.apply(null,rows.map(function(r){return Math.log10(1+r.med);})));
    rows.forEach(function(r){
      r.norm=r.demand/Math.max(dmax,1);
      r.comp=Math.log10(1+r.med)/mmax;
      r.zone=zone(r);
    });
    /* раскладка: смешиваем значение с рангом, чтобы точки не слипались */
    var byC=rows.slice().sort(function(a,b){return a.comp-b.comp;});
    var byN=rows.slice().sort(function(a,b){return a.norm-b.norm;});
    rows.forEach(function(r){
      r.px=0.4*r.comp+0.6*((byC.indexOf(r)+0.5)/rows.length);
      r.py=0.4*r.norm+0.6*((byN.indexOf(r)+0.5)/rows.length);
    });
    rows.sort(function(a,b){return (b.norm-b.comp)-(a.norm-a.comp);});
    draw(out,rows,base);
  }catch(e){out.innerHTML=err11(e.message||'не получилось');}
}

function draw(out,rows,base){
  var V=W.__v13;
  /* scatter: x = конкуренция, y = спрос */
  var Wd=640,H=380,pad=46;
  var dots=rows.map(function(r,i){
    var x=pad+18+r.px*(Wd-pad-66),y=H-pad-18-r.py*(H-pad-66);
    var lab=r.q.length>24?r.q.slice(0,23)+'…':r.q;
    var up=i%2===0;
    var anch=x>Wd-150?'end':(x<pad+130?'start':'middle');
    return '<g class="v15rd-dot" data-i="'+i+'" style="cursor:pointer">'+
      '<circle cx="'+x+'" cy="'+y+'" r="'+(8+r.norm*8)+'" fill="'+ZC[r.zone]+'" fill-opacity=".8" stroke="rgba(255,255,255,.5)" stroke-width="1.2"><animate attributeName="r" values="'+(8+r.norm*8)+';'+(10+r.norm*8)+';'+(8+r.norm*8)+'" dur="2.6s" repeatCount="indefinite"/></circle>'+
      '<text x="'+x+'" y="'+(up?(y-14-r.norm*6):(y+24+r.norm*6))+'" text-anchor="'+anch+'" fill="#e6ecf8" font-size="10.5" opacity=".85">'+esc(lab)+'</text></g>';
  }).join('');
  out.innerHTML=
    '<div class="v10-card"><div class="v10-h4">📡 Карта спроса: «'+esc(base)+'»</div>'+
    '<div class="v10-note">Каждая точка — реальный запрос из живого поиска YouTube. Выше — чаще ищут, левее — слабее конкуренция. Тапни точку.</div>'+
    '<div class="v15rd-svgwrap"><svg viewBox="0 0 '+Wd+' '+H+'" class="v15rd-svg">'+
    '<defs><linearGradient id="v15gz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ddc97" stop-opacity=".14"/><stop offset="1" stop-color="#3ddc97" stop-opacity="0"/></linearGradient></defs>'+
    '<rect x="'+pad+'" y="20" width="'+(Wd-pad-30)*0.45+'" height="'+(H-pad-20)*0.5+'" fill="url(#v15gz)" rx="14"/>'+
    '<text x="'+(pad+10)+'" y="40" fill="#3ddc97" font-size="11" opacity=".9">🏆 золотая зона: спрос есть, конкуренции мало</text>'+
    '<line x1="'+pad+'" y1="'+(H-pad)+'" x2="'+(Wd-20)+'" y2="'+(H-pad)+'" stroke="rgba(255,255,255,.18)"/>'+
    '<line x1="'+pad+'" y1="'+(H-pad)+'" x2="'+pad+'" y2="14" stroke="rgba(255,255,255,.18)"/>'+
    '<text x="'+(Wd-24)+'" y="'+(H-14)+'" text-anchor="end" fill="#8b93a7" font-size="11">конкуренция →</text>'+
    '<text x="14" y="24" fill="#8b93a7" font-size="11">спрос ↑</text>'+
    dots+'</svg></div>'+
    '<div id="v15rdDetail"></div></div>'+
    '<div class="v10-card" style="margin-top:14px"><div class="v10-h4">🧠 Вердикт AI</div><div id="v15rdAi">'+load11('Выбираю, куда бить…')+'</div></div>';
  qa('.v15rd-dot',out).forEach(function(g){
    g.addEventListener('click',function(){detail(out,rows[+g.getAttribute('data-i')]);});
  });
  detail(out,rows[0]);
  verdict(rows,base);
}

function detail(out,r){
  var V=W.__v13;
  var box=q('#v15rdDetail',out);if(!box||!r)return;
  box.innerHTML='<div class="v15rd-det">'+
    '<div class="v15rd-det-h"><span class="v15rd-z" style="background:'+ZC[r.zone]+'22;color:'+ZC[r.zone]+'">'+ZN[r.zone]+'</span><b>«'+esc(r.q)+'»</b></div>'+
    '<div class="v15rd-stats"><span>спрос '+Math.round(r.norm*100)+'/100</span><span>топ выдачи ~'+fmt(r.med)+' просм.</span><span>'+(r.fresh<0.5?'⚡ выдача устарела — окно для нового ролика':'выдача свежая')+'</span></div>'+
    (r.top&&r.top.length?('<div class="v15rd-top">'+r.top.map(function(v){
      return '<a class="v15rd-tv" href="'+V.ytLink(v.id)+'" target="_blank" rel="noopener"><img src="'+V.thumbUrl(v.id)+'" alt="" loading="lazy"><span>'+esc(v.title.slice(0,60))+'<small>'+fmt(v.views)+' · '+Math.round(v.age/30)+' мес</small></span></a>';
    }).join('')+'</div>'):'')+
    '<div class="v11-row" style="margin-top:10px"><button class="v11-btn" id="v15rdMake">🏭 Ролик под этот запрос</button></div></div>';
  var mk=q('#v15rdMake',box);
  if(mk)mk.addEventListener('click',function(){
    if(W.v12ConvOpen)W.v12ConvOpen('видео под поисковый запрос: '+r.q);
    else if(W.v6ToScript){mk.setAttribute('data-c',r.q);W.v6ToScript(mk);}
  });
}

async function verdict(rows,base){
  var box=q('#v15rdAi');if(!box)return;
  try{
    var lines=rows.map(function(r,i){return (i+1)+'. «'+r.q+'» — спрос '+Math.round(r.norm*100)+'/100, конкуренция '+Math.round(r.comp*100)+'/100, свежесть выдачи '+Math.round(r.fresh*100)+'%';}).join('\n');
    var d=await ai('Ты — продюсер YouTube. По данным живого поиска выбери 3 лучших запроса для нового ролика этого канала. Верни строго JSON {"picks":[{"q":"запрос","title":"кликабельный заголовок ролика","why":"почему зайдёт, до 15 слов"}]}.','Канал: '+(ctx()||'универсальный')+'\nТема: '+base+'\nЗапросы:\n'+lines,700);
    box.innerHTML=(d.picks||[]).slice(0,3).map(function(p,i){
      return '<div class="v15rd-pick"><span class="n">'+(i+1)+'</span><div><b>'+esc(p.title||p.q||'')+'</b><small>запрос: «'+esc(p.q||'')+'» · '+esc(p.why||'')+'</small></div></div>';
    }).join('')||'<div class="v10-note">AI не ответил — но карта выше уже показывает золотую зону.</div>';
  }catch(e){box.innerHTML='<div class="v10-note">AI не ответил — ориентируйся на золотую зону карты.</div>';}
}

W.v15RadarOpen=function(){
  var V=W.__v13;
  var el=V.openOv('v15radar','📡','Поисковый радар','Живые подсказки поиска YouTube: что люди ищут прямо сейчас — и где спрос без конкуренции');
  el.innerHTML='<div class="v10-card"><div class="v10-h4">🎯 Тема</div>'+V.qBox('v15rd','тема или ниша, например: монтаж в капкат','📡 Сканировать спрос')+'</div><div id="v15rdOut" style="margin-top:16px"></div>';
  V.fillChips('v15rd',el.parentNode);
  q('#v15rdGo',el.parentNode).addEventListener('click',function(){run(el.parentNode);});
  var inp=q('#v15rdQ',el.parentNode);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')run(el.parentNode);});
};

regTool({id:'v15radar',ic:'📡',name:'Поисковый радар',d:'Что ищут прямо сейчас — и где спрос без конкуренции',fn:function(){W.v15RadarOpen();},hub:true});
})();

;
/* ============ VIORA V15 · мост: Студия превью → примерка в реальной ленте ============ */
(function(){
'use strict';
var W=window,D=document,C=W.__v11core;
if(!C)return;
var q=C.q,toast=C.toast;

function inject(){
  var dl=q('#v12thDl');
  if(!dl||q('#v15try'))return;
  var b=D.createElement('button');
  b.className='v11-btn ghost';b.id='v15try';b.type='button';
  b.innerHTML='👀 Примерить в ленте';
  dl.parentNode.insertBefore(b,dl.nextSibling);
  b.addEventListener('click',tryInFeed);
}
setInterval(inject,1200);

function tryInFeed(){
  var cv=q('#v12cv');
  if(!cv){toast('Сначала собери превью','warn');return;}
  var title=(q('#v12thHead')||{}).value||'';
  cv.toBlob(function(blob){
    if(!blob){toast('Не смог снять превью с холста','warn');return;}
    /* открываем Превью-лабораторию и подкладываем файл как будто его загрузил юзер */
    try{W.v4OpenTool('plab');}catch(e){toast('Лаборатория недоступна','warn');return;}
    setTimeout(function(){
      var fi=q('#labFileA');
      if(!fi){toast('Лаборатория недоступна','warn');return;}
      try{
        var dt=new DataTransfer();
        dt.items.add(new File([blob],'viora_thumb.png',{type:'image/png'}));
        fi.files=dt.files;
        fi.dispatchEvent(new Event('change',{bubbles:true}));
      }catch(e){toast('Браузер не дал передать файл — скачай PNG и загрузи вручную','warn');return;}
      var t=q('#labTitleA');if(t&&title)t.value=title;
      var n=q('#labNiche');
      if(n&&!n.value){
        var s=C.S();var nn='';try{nn=C.nicheName();}catch(e){}
        n.value=nn||((s.channel&&s.channel.title)||'');
      }
      /* ждём, пока картинка прочитается, и жмём «показать в сетке» */
      setTimeout(function(){
        var gb=q('#labGridBtn');if(gb)gb.click();
        toast('Превью в реальной ленте — смотри, цепляет или теряется','ok');
      },700);
    },350);
  },'image/png');
}
})();
