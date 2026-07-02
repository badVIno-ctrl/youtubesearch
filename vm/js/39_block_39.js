/* ============ VIORA V19 · часть 3: Разведка — турнир→факт, комментарии, свободные ниши + доход в «Росте» + кнопка в Штабе ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16,X=window.__v18;
  if(!C||!V||!X||!X.BENCH){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,copyTxt=C.copyTxt,err11=C.err11,chid=C.chid;
  var ai=(V.aiRetry||C.ai);
  var Z=W.__v19=W.__v19||{};

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
  function pid(){return V.pid?V.pid():(chid()||'p0');}
  function median(a){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;}
  function clean(t){return String(t).replace(/```json|```/g,'').trim();}
  function ytf(path){try{if(typeof ytFetch==='function')return ytFetch(path);}catch(e){}return Promise.reject(new Error('YouTube API недоступен'));}

  /* ================= 1. ТУРНИР → ФАКТ ================= */
  function norm(t){return String(t||'').toLowerCase().replace(/[^a-zа-яё0-9\s]/gi,' ').split(/\s+/).filter(function(w){return w.length>2;});}
  function sim(a,b){
    var A=norm(a),B=norm(b);if(!A.length||!B.length)return 0;
    var setB={};B.forEach(function(w){setB[w]=1;});
    var hit=0;A.forEach(function(w){if(setB[w])hit++;});
    return hit/Math.max(A.length,B.length);
  }
  function factHtml(){
    var h=lget('v16_bt_hist:'+pid(),[])||[];
    if(!h.length)return '<div class="v16-note">Здесь замыкается петля прогнозов: сыграй турнир заголовков, выпусти ролик с чемпионом — и Viora сверит прогноз CTR с фактическим стартом ролика. Так видно, какие формулы заголовков реально работают на этом канале.</div>';
    var vids=(st().videos||[]);
    var medVpd=median(vids.map(function(v){return v.viewsPerDay||0;}))||1;
    var hits=0,miss=0;
    var rows=h.slice(0,10).map(function(x){
      var best=null,bs=0;
      vids.forEach(function(v){var s=sim(x.champ,v.title);if(s>bs){bs=s;best=v;}});
      var d=new Date(x.d);var ds=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2);
      if(best&&bs>=0.45){
        var ratio=(best.viewsPerDay||0)/medVpd;
        var ok=ratio>=1;if(ok)hits++;else miss++;
        return '<div class="v19-fact-row"><div class="ti"><b>«'+esc(x.champ||'')+'»</b><small>турнир '+ds+' · прогноз CTR ≈ '+esc(String(x.ctr||'?'))+'% → вышел как «'+esc(best.title)+'»: '+fmt(Math.round(best.viewsPerDay||0))+' просм./день — '+(ratio>=1?'×':'')+ratio.toFixed(1)+(ratio>=1?' к медиане канала':' от медианы канала')+'</small></div>'+
          '<span class="v19-verd '+(ok?'hit':'miss')+'">'+(ok?'🎯 сработал':'📉 ниже медианы')+'</span></div>';
      }
      return '<div class="v19-fact-row"><div class="ti"><b>«'+esc(x.champ||'')+'»</b><small>турнир '+ds+' · прогноз CTR ≈ '+esc(String(x.ctr||'?'))+'%</small></div><span class="v19-verd wait">⏳ ролик ещё не вышел</span></div>';
    }).join('');
    var verdict='';
    if(hits+miss>0)verdict='<div class="v18-card" style="margin-top:12px;font-size:13px;line-height:1.55"><b>Счёт судьи: '+hits+' из '+(hits+miss)+'</b> — '+
      (hits>=miss?'прогнозы турнира на этом канале чаще сбываются. Доверяй финалистам сетки.':'прогнозы пока сбываются через раз — выпусти ещё 3–4 чемпиона, судья учится на каждом исходе.')+'</div>';
    return rows+verdict+'<div class="v16-note" style="margin-top:10px">Сопоставление по совпадению слов заголовка. «Сработал» = ролик набирает не хуже медианы канала по просмотрам в день.</div>';
  }

  /* ================= 2. МАЙНИНГ КОММЕНТАРИЕВ ================= */
  function comKey(){return 'v19_comments:'+pid();}
  function comHtml(){
    var c=lget(comKey(),null);
    var btn='<div class="v16-row" style="margin-bottom:10px"><button class="v16-btn" id="v19comGo">⛏ '+(c?'Обновить разбор':'Собрать боли аудитории')+'</button>'+(c?'<span style="font-size:11.5px;color:#9aa0ae;align-self:center">разбор от '+new Date(c.ts).toLocaleDateString('ru-RU')+'</span>':'')+'</div>';
    return '<div class="v16-note" style="margin-bottom:10px">Viora читает комментарии под твоими хитами и хитами конкурентов и достаёт оттуда: что болит у зрителей, о чём они спрашивают и какие ролики просят. Это темы с гарантированным спросом — их просила сама аудитория.</div>'+
      btn+'<div id="v19comOut">'+(c?comPaint(c):'')+'</div>';
  }
  function comPaint(c){
    function block(title,arr,cls){
      if(!(arr||[]).length)return '';
      return '<div class="v16-h4" style="margin-top:14px">'+title+'</div>'+arr.map(function(x){
        var t=typeof x==='string'?x:(x.t||'');var why=typeof x==='object'?(x.why||''):'';
        var tt=cls==='idea'?'<b data-idea="'+esc(t)+'" title="Нажми, чтобы добавить в банк идей">'+esc(t)+'</b>':esc(t);
        return '<div class="v19-pain '+cls+'">'+tt+(why?'<small>'+esc(why)+'</small>':'')+'</div>';}).join('');
    }
    return block('🔥 Боли аудитории',c.pains,'')+block('❓ Частые вопросы',c.questions,'q')+block('🎬 Ролики, которые просят',c.ideas,'idea')+
      '<div class="v16-note" style="margin-top:10px">Разобрано комментариев: '+(c.n||0)+'. Идеи можно унести в банк — вкладка «Студия».</div>';
  }
  function comRun(){
    var s=st();
    if(!s.channel||!(s.videos||[]).length){toast('Сначала сделай анализ канала — нужны его ролики');return;}
    var box=q('#v19comOut');box.innerHTML=V.load16('Читаю комментарии под хитами (твоими и конкурентов)…');
    var mine=(s.videos||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,3);
    var comp=[];(s.competitors||[]).slice(0,2).forEach(function(c){
      (c.vids||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,1).forEach(function(v){comp.push(v);});
    });
    var targets=mine.concat(comp).filter(function(v){return v&&v.id;}).slice(0,5);
    if(!targets.length){box.innerHTML=err11('Не нашёл роликов с ID для сбора комментариев');return;}
    Promise.all(targets.map(function(v){
      return ytf('commentThreads?part=snippet&videoId='+v.id+'&maxResults=40&order=relevance&textFormat=plainText')
        .then(function(r){return (r.items||[]).map(function(it){
          try{var sn=it.snippet.topLevelComment.snippet;return {t:String(sn.textDisplay||'').slice(0,300),likes:+sn.likeCount||0};}catch(e){return null;}
        }).filter(Boolean);})
        .catch(function(){return [];});
    })).then(function(lists){
      var all=[];lists.forEach(function(l){all=all.concat(l);});
      all.sort(function(a,b){return b.likes-a.likes;});
      all=all.slice(0,120);
      if(all.length<10)throw new Error('комментариев слишком мало (часто отключены или исчерпана квота API) — попробуй позже');
      var corpus=all.map(function(c){return (c.likes?'['+c.likes+'👍] ':'')+c.t.replace(/\s+/g,' ');}).join('\n').slice(0,12000);
      return ai('Ты аналитик YouTube-аудитории. Отвечай ТОЛЬКО валидным JSON без markdown.',
        'Ниша: '+(s.primaryNiche||'')+'. Вот реальные комментарии зрителей под хитами канала и конкурентов (в скобках — лайки):\n'+corpus+
        '\nВыдели: 1) боли/раздражения зрителей (конкретно, не общо), 2) частые вопросы, 3) идеи роликов, которые аудитория прямо просит или которые закрывают боль — с объяснением почему залетит. JSON: {"pains":["…3-6 шт"],"questions":["…3-6 шт"],"ideas":[{"t":"тема ролика","why":"почему залетит, 1 фраза"}]}',1100)
      .then(function(t){
        var d=typeof t==='string'?JSON.parse(clean(t)):t;
        d.ts=Date.now();d.n=all.length;
        lset(comKey(),d);box.innerHTML=comPaint(d);
        var go=q('#v19comGo');if(go)go.textContent='⛏ Обновить разбор';
        toast('⛏ Разбор аудитории готов','ok');
      });
    }).catch(function(e){box.innerHTML=err11('Не получилось: '+((e&&e.message)||e));});
  }

  /* ================= 3. СВОБОДНЫЕ НИШИ (GAP) ================= */
  function gapKey(){return 'v19_gap:'+pid();}
  function gapHtml(){
    var g=lget(gapKey(),null);
    return '<div class="v16-note" style="margin-bottom:10px">Сравниваю хиты конкурентов с твоими темами и ищу «свободные ниши» — то, что в твоей тематике уже собирает просмотры у других, но чего нет у тебя.</div>'+
      '<div class="v16-row" style="margin-bottom:10px"><button class="v16-btn" id="v19gapGo">🕳 '+(g?'Обновить поиск ниш':'Найти свободные ниши')+'</button>'+(g?'<span style="font-size:11.5px;color:#9aa0ae;align-self:center">поиск от '+new Date(g.ts).toLocaleDateString('ru-RU')+'</span>':'')+'</div>'+
      '<div id="v19gapOut">'+(g?gapPaint(g):'')+'</div>';
  }
  function gapPaint(g){
    return (g.gaps||[]).map(function(x){
      return '<div class="v19-pain idea"><b data-idea="'+esc(x.idea||x.theme||'')+'" title="Нажми, чтобы добавить в банк идей">'+esc(x.theme||'')+'</b>'+(x.idea?' — '+esc(x.idea):'')+
        '<small>'+esc(x.evidence||'')+(x.fmt?' · формат: '+(x.fmt==='shorts'?'Shorts':'длинный'):'')+'</small></div>';
    }).join('')||'<div class="v16-note">Пока пусто.</div>';
  }
  function gapRun(){
    var s=st();
    var comps=(s.competitors||[]).filter(function(c){return c&&(c.vids||[]).length;});
    if(!comps.length){toast('Нужны конкуренты из анализа — сделай аудит канала');return;}
    var box=q('#v19gapOut');box.innerHTML=V.load16('Сравниваю твои темы с хитами конкурентов…');
    var compHits=[];comps.slice(0,4).forEach(function(c){
      (c.vids||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,5).forEach(function(v){
        compHits.push((c.ch&&c.ch.title?c.ch.title+': ':'')+'«'+v.title+'» ('+fmt(Math.round(v.viewsPerDay||0))+'/день)');
      });
    });
    var myTitles=(s.videos||[]).slice(0,40).map(function(v){return v.title;});
    ai('Ты продюсер-стратег YouTube. Отвечай ТОЛЬКО валидным JSON без markdown.',
      'Ниша: '+(s.primaryNiche||'')+'.\nХиты конкурентов:\n'+compHits.join('\n')+'\n\nТемы моего канала:\n'+myTitles.join(' | ')+
      '\nНайди 4-6 «свободных ниш»: темы/форматы, которые у конкурентов собирают просмотры, а у меня не закрыты вообще или закрыты слабо. Не повторяй мои темы. JSON: {"gaps":[{"theme":"свободная ниша 2-5 слов","evidence":"чем доказано у конкурентов, 1 фраза с цифрой","idea":"конкретная тема ролика под мой канал","fmt":"shorts|long"}]}',1100)
    .then(function(t){
      var d=typeof t==='string'?JSON.parse(clean(t)):t;
      d.ts=Date.now();
      lset(gapKey(),d);box.innerHTML=gapPaint(d);
      var go=q('#v19gapGo');if(go)go.textContent='🕳 Обновить поиск ниш';
      toast('🕳 Свободные ниши найдены','ok');
    }).catch(function(e){box.innerHTML=err11('Не получилось: '+((e&&e.message)||e));});
  }

  /* ================= ВКЛАДКА «РАЗВЕДКА» ================= */
  function renderRecon(body){
    body.innerHTML='<div class="v18-subnav" id="v19rcNav">'+
      '<button data-s="v19fact">🎯 Турнир → факт</button><button data-s="v19com">⛏ Комментарии</button><button data-s="v19gap">🕳 Свободные ниши</button></div>'+
      '<div class="v18-sec" id="v19fact"><div class="v18-h"><b>🎯 Турнир → факт</b><small>сбылись ли прогнозы CTR — проверка по реальным роликам</small></div><div id="v19factBox">'+factHtml()+'</div></div>'+
      '<div class="v18-sec" id="v19com"><div class="v18-h"><b>⛏ Боли аудитории</b><small>живые комментарии → готовые темы со спросом</small></div>'+comHtml()+'</div>'+
      '<div class="v18-sec" id="v19gap"><div class="v18-h"><b>🕳 Свободные ниши</b><small>что собирает просмотры у конкурентов, но не закрыто у тебя</small></div>'+gapHtml()+'</div>';
    q('#v19rcNav',body).addEventListener('click',function(e){
      var b=e.target.closest('button[data-s]');if(!b)return;
      var el=q('#'+b.getAttribute('data-s'),body);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
    var cg=q('#v19comGo',body);if(cg)cg.addEventListener('click',comRun);
    var gg=q('#v19gapGo',body);if(gg)gg.addEventListener('click',gapRun);
    body.addEventListener('click',function(e){
      var p=e.target.closest('.v19-pain.idea b');
      if(!p||!Z.addIdea)return;
      var t=p.getAttribute('data-idea')||p.textContent;
      if(confirm('Добавить «'+t+'» в банк идей?'))Z.addIdea({t:t,fmt:'long',src:'разведка'});
    });
  }
  V.regTab({id:'recon',ic:'🔬',name:'Разведка'},renderRecon);
  if(C.regTool)C.regTool({id:'v19recon',ic:'🔬',name:'Разведка',d:'Проверка прогнозов турнира по фактическим просмотрам, боли аудитории из комментариев и свободные ниши против конкурентов',fn:function(){W.v16HqOpen('recon');},hub:true});

  /* ================= ДОХОД-КАЛЬКУЛЯТОР в «Росте» ================= */
  /* RPM (доход на 1000 монетизируемых просмотров) — открытые данные креаторов 2024–2025, USD */
  var RPM=[
    ['Финансы и инвестиции',8,22],['Технологии и софт',4,12],['Бизнес и образование',3,10],
    ['Недвижимость и авто',4,10],['Здоровье и спорт',2.5,6],['Лайфстайл и влоги',1.5,4.5],
    ['Гейминг',1.2,3.5],['Развлечения и челленджи',1,3],['Музыка',0.8,2.5]
  ];
  var RPM_SHORTS=[0.05,0.18];
  function guessNiche(){
    var n=(st().primaryNiche||'').toLowerCase();
    if(/финанс|инвест|деньг/.test(n))return 0;if(/техно|гаджет|software|программ|ии|ai/.test(n))return 1;
    if(/бизнес|образован|обуч|курс/.test(n))return 2;if(/недвиж|авто|машин/.test(n))return 3;
    if(/здоров|спорт|фитнес/.test(n))return 4;if(/лайф|влог|быт/.test(n))return 5;
    if(/гейм|игр/.test(n))return 6;if(/музык/.test(n))return 8;
    return 7;
  }
  function moneyHtml(){
    var s=st();
    var vpm=Math.round((s.videos||[]).reduce(function(a,v){return a+(v.viewsPerDay||0);},0)*30);
    var ni=Z._rpmN!=null?Z._rpmN:guessNiche();
    var views=Z._rpmV!=null?Z._rpmV:Math.max(1000,vpm);
    var r=RPM[ni];
    var lo=views/1000*r[1],hi=views/1000*r[2];
    var loS=views/1000*RPM_SHORTS[0],hiS=views/1000*RPM_SHORTS[1];
    var kurs=95;
    return '<div class="v18-card" id="v19money"><div class="v18-h" style="margin-bottom:4px"><b>💵 Калькулятор дохода после Партнёрки</b><small>оценка по открытым RPM креаторов, не гарантия</small></div>'+
      '<div class="v16-row" style="margin:10px 0 4px"><select class="v16-in" id="v19rpmN" style="min-width:200px">'+RPM.map(function(x,i){return '<option value="'+i+'"'+(i===ni?' selected':'')+'>'+x[0]+' · $'+x[1]+'–'+x[2]+' RPM</option>';}).join('')+'</select>'+
      '<div style="flex:1;min-width:200px"><input type="range" id="v19rpmV" min="1000" max="2000000" step="1000" value="'+Math.min(2000000,views)+'" style="width:100%">'+
      '<div style="font-size:11.5px;color:#9aa0ae" id="v19rpmVl">'+fmt(views)+' монетизируемых просмотров/мес'+(vpm>0?' (сейчас канал делает ~'+fmt(vpm)+'/мес)':'')+'</div></div></div>'+
      '<div class="v19-money"><div class="sum" id="v19moneyOut">$'+Math.round(lo)+'–'+Math.round(hi)+'<small>≈ '+fmt(Math.round(lo*kurs))+'–'+fmt(Math.round(hi*kurs))+' ₽/мес на длинных</small></div>'+
      '<div class="sum" style="color:#ffd166">$'+loS.toFixed(0)+'–'+hiS.toFixed(0)+'<small>если те же просмотры дадут Shorts ($'+RPM_SHORTS[0]+'–'+RPM_SHORTS[1]+' RPM)</small></div></div>'+
      '<span class="v18-src">RPM: открытые данные креаторов 2024–2025 · курс ₽ ориентировочный · реальный RPM зависит от гео аудитории и сезона</span></div>';
  }
  function wireMoney(box){
    var sel=q('#v19rpmN',box),rng=q('#v19rpmV',box);
    if(!sel||!rng)return;
    function rep(){
      Z._rpmN=+sel.value;Z._rpmV=+rng.value;
      var host=q('#v19money',box);
      if(host){var tmp=D.createElement('div');tmp.innerHTML=moneyHtml();host.replaceWith(tmp.firstElementChild);wireMoney(box);}
    }
    sel.addEventListener('change',rep);
    rng.addEventListener('input',function(){
      Z._rpmV=+rng.value;
      var ni=+sel.value,r=RPM[ni],v=+rng.value;
      var lbl=q('#v19rpmVl',box),out=q('#v19moneyOut',box);
      if(lbl)lbl.textContent=fmt(v)+' монетизируемых просмотров/мес';
      if(out)out.innerHTML='$'+Math.round(v/1000*r[1])+'–'+Math.round(v/1000*r[2])+'<small>≈ '+fmt(Math.round(v/1000*r[1]*95))+'–'+fmt(Math.round(v/1000*r[2]*95))+' ₽/мес на длинных</small>';
    });
  }
  var origGrowth=V.RENDER.growth;
  if(origGrowth){
    V.RENDER.growth=function(body){
      origGrowth(body);
      try{
        var road=q('#v18road',body);
        if(road&&!q('#v19money',body)){
          var holder=D.createElement('div');holder.innerHTML=moneyHtml();
          road.appendChild(holder.firstElementChild);
          wireMoney(body);
        }
      }catch(e){}
    };
  }

  /* ================= КНОПКА В ГЕРОЙ-ПОЛОСЕ + УРОВЕНЬ ================= */
  function heroPatch(){
    var hero=q('#v17hero');if(!hero)return;
    if(!q('[data-a="cab"]',hero)){
      var growthBtn=q('[data-a="growth"]',hero);
      if(growthBtn){
        var b=D.createElement('button');b.setAttribute('data-a','cab');b.innerHTML='💼 Кабинет';
        growthBtn.after(b);
        b.addEventListener('click',function(ev){ev.stopPropagation();V.openTab('cab');});
      }
    }
    if(!hero.__v19mo){
      hero.__v19mo=1;
      try{new MutationObserver(function(){try{heroPatch();}catch(e){}}).observe(hero,{childList:true});}catch(e){}
    }
  }
  setInterval(function(){try{heroPatch();}catch(e){}},800);
}
boot();
})();
