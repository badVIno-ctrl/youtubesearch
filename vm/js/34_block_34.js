/* ============ VIORA V17 · Штаб 2.0: герой-полоса · вкладка «Неделя» · авто-синк календаря · экспорт плана · демо-режим ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V||!window.v16HqOpen){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,chid=C.chid,err11=C.err11,DAY=C.DAY,regTool=C.regTool;
  var ai=(V.aiRetry||C.ai);
  W.__v17=W.__v17||{};

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}

  /* ================= 1. ШТАБ 2.0: герой-полоса ================= */
  function calDone(cal){
    var m=(cal&&cal.marks)||{};
    return Object.keys(m).filter(function(k){return m[k]==='done';}).length;
  }
  function heroHtml(){
    var s=st(),ch=s.channel||null,dream=V.dream();
    var av=ch&&ch.avatar?'<img class="av" src="'+esc(ch.avatar)+'" alt="">':'<span class="av ph">'+(dream?'🚀':'📺')+'</span>';
    var name=ch?ch.title:(dream?'Запуск с нуля':'Канал не подключён');
    var sub=ch?(fmt(ch.subs||0)+' подписчиков'+(s.primaryNiche?' · '+s.primaryNiche:''))
      :(dream?('цель: '+(dream.niche||'свой канал')):'сначала проанализируй канал на главной');
    var score=(s.ai&&s.ai.score!=null)?Math.round(s.ai.score):null;
    var stk=V.streak();
    var cal=V.calGet();
    var t=(W.__v17.todayTask&&W.__v17.todayTask())||null;
    return av+
      '<div class="who"><b>'+esc(name)+'</b><small>'+esc(sub)+'</small></div>'+
      (score!=null?'<div class="v17-stat"><b style="color:'+(score>=70?'#3ddc97':score>=45?'#ffb020':'#ff5e7a')+'">'+score+'</b><small>индекс</small></div>':'')+
      '<div class="v17-stat"><b>'+(stk>0?'🔥 '+stk:'—')+'</b><small>стрик</small></div>'+
      (cal?'<div class="v17-stat"><b>'+calDone(cal)+'/30</b><small>выложено</small></div>':'')+
      '<span class="sp"></span>'+
      (t?'<span class="v17-today" id="v17todayChip" title="'+esc(t.topic)+'">📌 Сегодня: <span class="tt">'+esc(t.topic)+'</span></span>':'')+
      '<div class="v17-qa">'+
      (W.v15RadarOpen?'<button data-a="radar">📡 Радар</button>':'')+
      (W.v11CompOpen?'<button data-a="comp">⚔️ Конкуренты</button>':'')+
      '<button data-a="growth">📈 Рост</button>'+
      '<button data-a="demo">🎬 Демо</button>'+
      '</div>';
  }
  function paintHero(){
    var el=q('#v16hq');if(!el)return;
    var hero=q('#v17hero',el);
    if(!hero){
      hero=D.createElement('div');hero.id='v17hero';hero.className='v17-hero';
      var tabs=q('.v16-tabs',el);
      el.insertBefore(hero,tabs);
      hero.addEventListener('click',function(e){
        var b=e.target.closest('[data-a]');
        if(b){
          var a=b.getAttribute('data-a');
          if(a==='radar'){W.v16HqClose();W.v15RadarOpen();}
          else if(a==='comp'){W.v16HqClose();W.v11CompOpen();}
          else if(a==='growth'){V.openTab('growth');}
          else if(a==='demo'){W.v16HqClose();setTimeout(function(){W.v17Demo();},250);}
          return;
        }
        if(e.target.closest('#v17todayChip'))V.openTab('cal');
      });
    }
    hero.innerHTML=heroHtml();
  }
  var origOpen=W.v16HqOpen;
  W.v16HqOpen=function(tab){
    var r=origOpen.apply(this,arguments);
    try{paintHero();}catch(e){}
    return r;
  };
  setInterval(function(){
    try{var el=q('#v16hq');if(el&&el.classList.contains('open'))paintHero();}catch(e){}
  },4000);

  /* ================= 2. Вкладка «Неделя» ================= */
  var WD=['вс','пн','вт','ср','чт','пт','сб'];
  function weekDays(){
    var cal=V.calGet(),out=[];
    for(var i=6;i>=0;i--){
      var d=new Date(V.today().getTime()-i*DAY);
      var dk=V.dkey(d);
      out.push({dk:dk,d:d,it:cal?V.calItem(cal,dk):null,mk:cal?((cal.marks||{})[dk]||''):''});
    }
    return out;
  }
  function weekKpis(days){
    var planned=0,done=0,shot=0;
    days.forEach(function(x){if(x.it&&x.it.topic)planned++;if(x.mk==='done')done++;if(x.mk==='shot')shot++;});
    return {planned:planned,done:done,shot:shot,adh:planned?Math.round(done/planned*100):0};
  }
  function renderWeek(body){
    var cal=V.calGet();
    if(!cal){
      body.innerHTML='<div class="v16-card"><div class="v16-h4">📊 Итоги недели</div>'+
        '<div class="v16-note" style="margin-bottom:12px">Недельный отчёт собирается из календаря: что было по плану, что вышло, где пропуски. Сначала собери план на 30 дней.</div>'+
        '<button class="v16-btn" onclick="window.__v16.openTab(\'cal\')">📅 Открыть календарь</button></div>';
      return;
    }
    var days=weekDays(),k=weekKpis(days);
    var cells=days.map(function(x){
      var cls=x.mk==='done'?' done':(x.it&&x.it.topic?' plan':'');
      var ic=x.mk==='done'?'✅':x.mk==='shot'?'🎥':(x.it&&x.it.topic?'📋':'·');
      return '<div class="v17-wday'+cls+'"><span class="ic">'+ic+'</span><b>'+WD[x.d.getDay()]+' '+x.d.getDate()+'</b>'+
        '<small title="'+esc((x.it&&x.it.topic)||'')+'">'+esc(x.it&&x.it.topic?(x.it.topic.length>26?x.it.topic.slice(0,26)+'…':x.it.topic):'без плана')+'</small></div>';
    }).join('');
    var adhCol=k.adh>=80?'#3ddc97':k.adh>=50?'#ffb020':'#ff5e7a';
    body.innerHTML='<div class="v16-card"><div class="v16-h4">📊 Итоги недели</div>'+
      '<div class="v17-week-grid">'+
      '<div class="v17-kpi"><b>'+k.done+'<span style="font-size:14px;opacity:.55"> из '+k.planned+'</span></b><small>выложено / план</small></div>'+
      '<div class="v17-kpi"><b style="color:'+adhCol+'">'+k.adh+'%</b><small>дисциплина</small></div>'+
      '<div class="v17-kpi"><b>'+(V.streak()>0?'🔥 '+V.streak():'0')+'</b><small>стрик, дней</small></div>'+
      '<div class="v17-kpi"><b>'+calDone(cal)+'/30</b><small>план месяца</small></div>'+
      '</div>'+
      '<div class="v17-wdays">'+cells+'</div>'+
      '<div class="v16-row" style="margin-top:12px"><button class="v16-btn" id="v17wkAi">🧠 AI-разбор недели</button>'+
      '<button class="v16-btn ghost" id="v17wkExp">🖨 Экспорт плана</button></div>'+
      '<div id="v17wkOut" style="margin-top:12px"></div></div>';
    q('#v17wkAi').addEventListener('click',weekAi);
    q('#v17wkExp').addEventListener('click',exportPlan);
    /* кэш разбора на сегодня */
    var cached=lget(wkKey(),null);
    if(cached)paintWeekAi(cached,true);
  }
  function wkKey(){return 'v17_week:'+V.pid()+':'+V.dkey(V.today());}
  function paintWeekAi(d,fromCache){
    var out=q('#v17wkOut');if(!out)return;
    out.innerHTML='<div class="v16-card" style="margin-bottom:0"><div style="font-size:14.5px;line-height:1.55;margin-bottom:10px"><b>'+esc(d.verdict||'')+'</b></div>'+
      ((d.wins||[]).length?'<div class="v16-note" style="margin-bottom:8px">'+(d.wins||[]).map(function(x){return '🏆 '+esc(x);}).join('<br>')+'</div>':'')+
      ((d.fixes||[]).map(function(x){return '<div class="v16-fix"><span class="p med">МЕНЯЕМ</span><div style="font-size:13.5px;line-height:1.5">'+esc(x)+'</div></div>';}).join(''))+
      (fromCache?'<div class="v16-note" style="margin-top:8px">💾 Разбор за сегодня — из памяти.</div>':'')+'</div>';
  }
  async function weekAi(){
    var btn=q('#v17wkAi'),out=q('#v17wkOut');
    if(btn)btn.disabled=true;
    out.innerHTML=V.load16('Сверяю план с фактом и собираю выводы недели…');
    try{
      var days=weekDays(),k=weekKpis(days);
      var lines=days.map(function(x){
        return WD[x.d.getDay()]+' '+x.dk+': '+(x.it&&x.it.topic?('план «'+x.it.topic+'» ('+(x.it.format==='long'?'длинный':'shorts')+')'):'плана не было')+' — '+(x.mk==='done'?'ВЫЛОЖЕНО':x.mk==='shot'?'снято, не выложено':'не выложено');
      }).join('\n');
      var sys='Ты — продюсер YouTube, делаешь честный недельный разбор автору. На входе план/факт за 7 дней. Верни СТРОГО валидный JSON без markdown: {"verdict":"итог недели одним живым предложением с эмодзи","wins":["1-2 победы недели, конкретно"],"fixes":["ровно 3 конкретных изменения на следующую неделю: что, в какой день, почему"]}. Пиши по-русски, без воды, обращайся на «ты».';
      var user='НЕДЕЛЯ:\n'+lines+'\nИТОГО: выложено '+k.done+' из '+k.planned+' по плану, дисциплина '+k.adh+'%, стрик '+V.streak()+' дн.\n'+(V.anyCtx()||'');
      var d=await ai(sys,user,800);
      lset(wkKey(),d);
      paintWeekAi(d,false);
    }catch(e){out.innerHTML=err11((e&&e.message)||'разбор не собрался — попробуй ещё раз');}
    if(btn)btn.disabled=false;
  }
  V.regTab({id:'week',ic:'📊',name:'Неделя'},renderWeek);

  /* ================= 3. Календарь ⇄ YouTube: авто-отметка публикаций ================= */
  var syncing=false;
  async function calSync(){
    var id=chid();if(!id||syncing||!W.ytFetch)return false;
    var cal=V.calGet();if(!cal)return false;
    var thr=lget('v17_calsync:'+id,0);
    if(Date.now()-thr<36e5)return false; /* не чаще раза в час */
    syncing=true;
    try{
      lset('v17_calsync:'+id,Date.now());
      var after=new Date(cal.start+'T00:00:00').toISOString().replace(/\.\d+Z/,'Z');
      var d=await W.ytFetch('search?part=snippet&channelId='+id+'&order=date&type=video&maxResults=30&publishedAfter='+after);
      var n=0;
      (d.items||[]).forEach(function(it){
        var p=it.snippet&&it.snippet.publishedAt;if(!p)return;
        var dt=new Date(p);dt.setHours(0,0,0,0);
        var dk=V.dkey(dt);
        if(!V.calItem(cal,dk))return;
        cal.marks=cal.marks||{};
        if(cal.marks[dk]!=='done'){cal.marks[dk]='done';n++;}
      });
      if(n){
        V.calSet(cal);
        toast('📅 Сверил с YouTube: отметил '+n+' публикаци'+(n===1?'ю':(n<5?'и':'й'))+' автоматически','ok');
      }
      syncing=false;return n>0;
    }catch(e){syncing=false;return false;}
  }
  /* при открытии календаря — фоновая сверка, потом тихая перерисовка */
  var origCal=V.RENDER.cal;
  V.RENDER.cal=function(body){
    origCal(body);
    calSync().then(function(changed){
      var b=q('#v16body');
      if(changed&&b&&q('.v16-cal-grid',b)){origCal(b);V.paintStreak();}
    });
  };

  /* ================= 4. Экспорт плана (печать / PDF) ================= */
  function exportPlan(){
    var cal=V.calGet();
    if(!cal){toast('Сначала собери план в календаре','warn');return;}
    var s=st(),name=(s.channel&&s.channel.title)||'мой канал';
    var start=new Date(cal.start+'T00:00:00');
    var MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    var rows=cal.days.map(function(it,i){
      var d=new Date(start.getTime()+i*DAY);
      var dk=V.dkey(d),mk=(cal.marks||{})[dk]||'';
      return '<tr'+(mk==='done'?' class="ok"':'')+'><td>'+d.getDate()+' '+MON[d.getMonth()]+'</td>'+
        '<td>'+(it.format==='long'?'🎬 длинный':'⚡ shorts')+'</td>'+
        '<td><b>'+esc(it.topic||'')+'</b>'+(it.hook?'<br><small>🪝 '+esc(it.hook)+'</small>':'')+'</td>'+
        '<td>'+(mk==='done'?'✅':mk==='shot'?'🎥':'')+'</td></tr>';
    }).join('');
    var html='<!doctype html><html><head><meta charset="utf-8"><title>Контент-план · '+esc(name)+'</title><style>'+
      'body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#16121a;margin:34px}'+
      'h1{font-size:21px;margin:0 0 4px}p.sub{color:#777;margin:0 0 20px;font-size:13px}'+
      'table{width:100%;border-collapse:collapse;font-size:13px}'+
      'th{text-align:left;padding:8px 10px;border-bottom:2px solid #e3dde8;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#8a8395}'+
      'td{padding:9px 10px;border-bottom:1px solid #efeaf3;vertical-align:top}'+
      'tr.ok td{background:#f1faf5}small{color:#8a8395}'+
      '@media print{body{margin:12mm}}'+
      '</style></head><body><h1>📅 Контент-план на 30 дней — '+esc(name)+'</h1>'+
      '<p class="sub">VioraMedia · собран '+new Date(cal.made||Date.now()).toLocaleDateString('ru-RU')+' · ✅ выложено · 🎥 снято</p>'+
      '<table><tr><th>День</th><th>Формат</th><th>Тема</th><th></th></tr>'+rows+'</table>'+
      '<'+'script>setTimeout(function(){window.print();},350);</'+'script></body></html>';
    var w=window.open('','_blank');
    if(!w){toast('Браузер заблокировал окно — разреши всплывающие окна','warn');return;}
    w.document.write(html);w.document.close();
  }
  W.__v17.exportPlan=exportPlan;

  /* ================= 5. Демо-режим: путь продукта за минуту, всё из кэша ================= */
  var demoTimers=[],demoOn=false;
  function demoStop(silent){
    demoOn=false;
    demoTimers.forEach(clearTimeout);demoTimers=[];
    var p=q('#v17demoPill');if(p)p.remove();
    if(!silent)toast('Демо остановлено','ok');
  }
  function pill(label,step,total){
    var p=q('#v17demoPill');
    if(!p){
      p=D.createElement('div');p.id='v17demoPill';
      p.addEventListener('click',function(){demoStop();});
      D.body.appendChild(p);
    }
    p.innerHTML='<span class="dot"></span>'+esc(label)+'<small>'+step+'/'+total+' · клик — стоп</small>';
  }
  function lastAudit(){
    try{
      var a=JSON.parse(localStorage.getItem('viora_hist_audit')||'[]');
      return (a&&a[0]&&a[0].state)?a[0]:null;
    }catch(e){return null;}
  }
  W.v17Demo=function(){
    if(demoOn){demoStop();return;}
    var s=st();
    var entry=null;
    if(!s.channel){
      entry=lastAudit();
      if(!entry){toast('Для демо нужен хотя бы один разбор канала — прогони анализ на главной','warn');return;}
    }
    demoOn=true;
    var steps=[];
    function add(dur,label,fn){steps.push({dur:dur,label:label,fn:fn});}
    add(4000,'Разбор канала — мгновенно из кэша',function(){
      if(entry){
        try{STATE=JSON.parse(JSON.stringify(entry.state));}catch(e){}
        var h=q('#hero');if(h)h.style.display='none';
        var idd=q('#ideas');if(idd)idd.style.display='none';
        var ld=q('#loading');if(ld)ld.style.display='none';
        W.renderDashboard&&W.renderDashboard();
      }
      try{W.v16HqClose();}catch(e){}
      window.scrollTo({top:0,behavior:'auto'});
    });
    add(4500,'Суть разбора — раскрываю плашки',function(){
      qa('.v-chip').forEach(function(c){c.classList.add('open');});
      var ins=q('.v-insights');if(ins)ins.scrollIntoView({behavior:'smooth',block:'start'});
    });
    add(5000,'Листаю разбор',function(){
      var dash=q('#dashboard');
      if(dash)window.scrollTo({top:dash.offsetTop+dash.offsetHeight*0.4,behavior:'smooth'});
    });
    add(6000,'Конкуренты уже в «Мониторинге» — добавились сами',function(){
      window.scrollTo({top:0,behavior:'auto'});
      try{W.v11CompOpen();}catch(e){}
    });
    add(5500,'Штаб: утро продюсера',function(){
      try{W.v4Close('v11comp');}catch(e){}
      try{W.v16HqOpen('morning');}catch(e){}
    });
    add(6000,'Календарь на 30 дней — из памяти',function(){try{V.openTab('cal');}catch(e){}});
    add(5500,'Итоги недели: план против факта',function(){try{V.openTab('week');}catch(e){}});
    add(6000,'Турнир заголовков — последний финал из памяти',function(){try{V.openTab('battle');}catch(e){}});
    add(4000,'Чек-ап перед публикацией',function(){try{V.openTab('chk');}catch(e){}});
    var total=steps.length,t=0;
    steps.forEach(function(stp,i){
      demoTimers.push(setTimeout(function(){
        if(!demoOn)return;
        pill(stp.label,i+1,total);
        try{stp.fn();}catch(e){}
      },t));
      t+=stp.dur;
    });
    demoTimers.push(setTimeout(function(){
      if(!demoOn)return;
      demoStop(true);
      try{W.__v17.confetti();}catch(e){}
      toast('🎬 Демо завершено — весь путь на закэшированных данных, без единого запроса к AI','ok');
    },t));
  };
  regTool({id:'v17demo',ic:'🎬',name:'Демо за минуту',d:'Прогон всего пути продукта на закэшированных данных — для показов клиентам',fn:function(){W.v17Demo();}});
}
boot();
})();
