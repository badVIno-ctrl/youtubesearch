/* ============ VIORA V16 · Утро продюсера ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,chid=C.chid,ai=((W.__v16&&W.__v16.aiRetry)||C.ai),err11=C.err11;

  function mkey(){return 'v16_morn:'+V.pid()+':'+V.dkey(V.today());}
  function greet(){var h=new Date().getHours();return h<5?'Доброй ночи':h<12?'Доброе утро':h<18?'Добрый день':'Добрый вечер';}

  V.RENDER.morning=function(body){
    var t=V.today();
    var cal=V.calGet();
    var it=cal?V.calItem(cal,V.dkey(t)):null;
    var st=V.streak();
    body.innerHTML=
      '<div class="v16-morn-hero"><span class="ic">🌅</span><div><b>'+greet()+', продюсер!</b><small>'+V.human(t)+(st>0?' · стрик '+st+' дн. 🔥':'')+' — вот твоя сводка за 30 секунд</small></div></div>'+
      '<div class="v16-card"><div class="v16-h4">📅 Сегодня по плану</div><div id="v16mPlan">'+
      (it?('<div style="font-size:16px;font-weight:700;line-height:1.45">'+(it.format==='long'?'🎬':'⚡')+' '+esc(it.topic)+'</div>'+
        (it.hook?'<div class="v16-note" style="margin-top:6px;color:#ffd27a">🪝 «'+esc(it.hook)+'»</div>':'')+
        '<div class="v16-row" style="margin-top:12px">'+
        (chid()?'<button class="v16-btn" id="v16mConv">🏭 Ролик под ключ</button>':'<button class="v16-btn" id="v16mScript">📝 Сценарий</button>')+
        '<button class="v16-btn ghost" id="v16mCal">Открыть календарь →</button></div>')
      :(cal?'<div class="v16-note">На сегодня публикации нет — день на подготовку. Загляни в календарь: что снимаем завтра.</div><div class="v16-row" style="margin-top:11px"><button class="v16-btn ghost" id="v16mCal">📅 Открыть календарь</button></div>'
        :'<div class="v16-note">Календаря ещё нет. Собери план на 30 дней — и каждое утро здесь будет конкретная задача.</div><div class="v16-row" style="margin-top:11px"><button class="v16-btn" id="v16mCal">📅 Собрать календарь</button></div>'))+
      '</div></div>'+
      '<div class="v16-grid2">'+
      '<div class="v16-card"><div class="v16-h4">🌙 Что взлетело за ночь'+(chid()?'<span style="flex:1"></span><button class="v16-copy" id="v16mScan">🔄 Проверить</button>':'')+'</div><div id="v16mRisers">'+risersHtml()+'</div></div>'+
      '<div class="v16-card"><div class="v16-h4">🔥 Горячий запрос сейчас</div><div id="v16mHot">'+V.load16('Слушаю живой поиск YouTube…')+'</div></div>'+
      '</div>'+
      '<div class="v16-card"><div class="v16-h4">⚡ Одно действие дня</div><div id="v16mAct">'+V.load16('Выбираю самое важное…')+'</div></div>';
    var mc=q('#v16mCal');if(mc)mc.addEventListener('click',function(){V.openTab('cal');});
    var cv=q('#v16mConv');if(cv)cv.addEventListener('click',function(){W.v16HqClose();W.v12ConvOpen&&W.v12ConvOpen(it.topic);});
    var sc=q('#v16mScript');if(sc)sc.addEventListener('click',function(){V.openScript(it.topic);});
    var sb=q('#v16mScan');if(sb)sb.addEventListener('click',function(){
      sb.textContent='Сканирую…';sb.disabled=true;
      Promise.resolve(W.__v15&&W.__v15.scan?W.__v15.scan(true):null).then(function(){
        var bx=q('#v16mRisers');if(bx)bx.innerHTML=risersHtml();
        sb.textContent='🔄 Проверить';sb.disabled=false;
      }).catch(function(){sb.textContent='🔄 Проверить';sb.disabled=false;});
    });
    hotQuery();
    actionOfDay(it);
  };

  function risersHtml(){
    var l=(lget('v15_ntf:'+(chid()||'_'),[])||[]).slice(0,3);
    if(!l.length){
      if(!chid())return '<div class="v16-note">Появится после анализа канала: Viora начнёт следить за конкурентами и сообщать, что у них взлетело.</div>';
      var comps=(lget('v11_comp:'+chid(),[])||[]);
      return '<div class="v16-note">'+(comps.length?'Пока тихо — нажми «Проверить», чтобы просканировать конкурентов прямо сейчас.':'Добавь конкурентов в «Мониторинге конкурентов» — и каждое утро здесь будут их взлёты.')+'</div>';
    }
    return l.map(function(n){
      var age=n.ts?Math.max(1,Math.round((Date.now()-n.ts)/36e5)):null;
      return '<div class="v16-riser"><span>'+(n.type==='own'?'🚀':'📈')+'</span><div>'+
        '<div class="t">'+esc(n.title||'')+'</div>'+
        '<div class="m">'+(n.ch?esc(n.ch)+' · ':'')+esc(n.body||'')+(age?' · '+(age<24?age+' ч назад':Math.round(age/24)+' дн назад'):'')+'</div>'+
        (n.why?'<div class="why">💡 '+esc(n.why)+'</div>':'')+
        '</div></div>';
    }).join('');
  }

  async function hotQuery(){
    var box=q('#v16mHot');if(!box)return;
    var cache=lget(mkey(),{})||{};
    try{
      if(!cache.hot){
        var kw=V.baseKw();
        if(!kw){box.innerHTML='<div class="v16-note">Сначала анализ канала или стартовый опросник — тогда я знаю, в какой нише слушать спрос.</div>';return;}
        var items=await V.suggest(kw);
        if(!items.length)items=await V.suggest('как '+kw);
        var seen=lget('v16_hotseen:'+V.pid(),{})||{};
        var pick=items.filter(function(s){return s&&s.length>=8&&!seen[s];})[0]||items[0];
        if(!pick)throw new Error('подсказки молчат');
        seen[pick]=1;lset('v16_hotseen:'+V.pid(),seen);
        cache.hot=pick;lset(mkey(),cache);
      }
      box.innerHTML='<div class="v16-hotq">«'+esc(cache.hot)+'»</div>'+
        '<div class="v16-note">Это реальный запрос из живого поиска YouTube в твоей нише — люди вводят его прямо сейчас.</div>'+
        '<div class="v16-row" style="margin-top:12px">'+
        (chid()?'<button class="v16-btn" id="v16mHotConv">🏭 Ролик под запрос</button>':'<button class="v16-btn" id="v16mHotScript">📝 Сценарий под запрос</button>')+
        (W.v15RadarOpen?'<button class="v16-btn ghost" id="v16mHotRadar">📡 Радар спроса</button>':'')+
        '</div>';
      var hc=q('#v16mHotConv');if(hc)hc.addEventListener('click',function(){W.v16HqClose();W.v12ConvOpen&&W.v12ConvOpen('видео под поисковый запрос: '+cache.hot);});
      var hs=q('#v16mHotScript');if(hs)hs.addEventListener('click',function(){V.openScript('видео под поисковый запрос: '+cache.hot);});
      var hr=q('#v16mHotRadar');if(hr)hr.addEventListener('click',function(){W.v16HqClose();W.v15RadarOpen();});
    }catch(e){box.innerHTML='<div class="v16-note">Живой поиск сейчас недоступен — попробуй позже или открой «Поисковый радар».</div>';}
  }

  async function actionOfDay(planItem){
    var box=q('#v16mAct');if(!box)return;
    var cache=lget(mkey(),{})||{};
    try{
      if(!cache.act){
        var risers=(lget('v15_ntf:'+(chid()||'_'),[])||[]).slice(0,3).map(function(n){return n.title+' ('+(n.body||'')+')';}).join('; ');
        var d=await ai('Ты — продюсер. По сводке утра выбери ОДНО самое важное действие на сегодня для роста канала: конкретное, выполнимое за день, с глагола. Верни строго JSON {"act":"одно действие, до 30 слов","why":"почему именно оно сегодня, до 15 слов"}.',
          (V.anyCtx()||'автор без данных')+
          (planItem?'\nСегодня по плану: '+planItem.topic+' ('+planItem.format+')':'\nСегодня публикации по плану нет.')+
          (cache.hot?'\nГорячий запрос: '+cache.hot:'')+
          (risers?'\nВзлёты конкурентов: '+risers:''),300);
        if(!d.act)throw new Error('no act');
        cache.act=d.act;cache.actWhy=d.why||'';lset(mkey(),cache);
      }
      box.innerHTML='<div class="v16-action"><b>'+esc(cache.act)+'</b>'+(cache.actWhy?'<div class="v16-note" style="margin-top:5px">'+esc(cache.actWhy)+'</div>':'')+'</div>';
    }catch(e){
      var fb=planItem?('Сними и выложи по плану: «'+planItem.topic+'» — а вечером отметь ✅ в календаре.'):'Собери календарь на 30 дней во вкладке «Календарь» — это 20 секунд, а думать «что снимать» больше не придётся.';
      box.innerHTML='<div class="v16-action"><b>'+esc(fb)+'</b></div>';
    }
  }
}
boot();
})();

;
/* ============ VIORA V16 · Турнир заголовков ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,toast=C.toast,chid=C.chid,ai=((W.__v16&&W.__v16.aiRetry)||C.ai),err11=C.err11,clamp=C.clamp,copyTxt=C.copyTxt,lget=C.lget,lset=C.lset;

  /* память турнира: последний результат + история чемпионов */
  function btKey(){return 'v16_bt_last:'+V.pid();}
  function btHistKey(){return 'v16_bt_hist:'+V.pid();}
  function btHist(){return lget(btHistKey(),[])||[];}
  function btSave(res){
    try{
      lset(btKey(),res);
      var h=btHist();
      h.unshift({d:Date.now(),champ:res.champ,ctr:res.ctr,idea:res.idea});
      lset(btHistKey(),h.slice(0,10));
    }catch(e){}
  }
  function histHtml(){
    var h=btHist();if(!h.length)return '';
    return '<div class="v16-card" style="margin-top:14px"><div class="v16-h4">🏅 Мои чемпионы</div>'+
      '<div class="v16-note" style="margin-bottom:10px">История финалистов. Когда ролик выйдет — сравни реальный CTR в YouTube Studio с прогнозом: так судья учится на твоём канале.</div>'+
      h.slice(0,6).map(function(x){
        var dt=new Date(x.d);var ds=('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2);
        return '<div class="v17-hist-row"><span class="v17-hist-d">'+ds+'</span><span class="v17-hist-t">'+esc(x.champ||'')+'</span><span class="v17-hist-ctr">CTR ≈ '+esc(String(x.ctr||'?'))+'%</span><button class="v16-copy" data-c="'+esc(x.champ||'').replace(/"/g,'&quot;')+'" onclick="v11Copy(this)">📋</button></div>';
      }).join('')+'</div>';
  }

  V.RENDER.battle=function(body){
    body.innerHTML='<div class="v16-card"><div class="v16-h4">🥊 Турнир заголовков</div>'+
      '<div class="v16-note" style="margin-bottom:12px">Вводишь идею — AI генерит 8 заголовков и сталкивает их в сетке плей-офф. Судья — триггеры, которые реально работают'+(chid()?' на твоём канале':' в твоей нише')+'. На выходе — финалист и прогноз CTR.</div>'+
      '<div class="v16-row"><input class="v16-in" id="v16btIdea" placeholder="Идея ролика, например: собрал ПК за 30 000 и он тянет все игры" style="flex:1;min-width:240px">'+
      '<select class="v16-in" id="v16btFmt" style="min-width:130px"><option value="long">Длинный</option><option value="shorts">Shorts</option></select>'+
      '<button class="v16-btn" id="v16btGo">🥊 Старт турнира</button></div>'+
      '<div id="v16btOut" style="margin-top:6px"></div></div>'+
      '<div id="v16btHist">'+histHtml()+'</div>';
    q('#v16btGo').addEventListener('click',run);
    q('#v16btIdea').addEventListener('keydown',function(e){if(e.key==='Enter')run();});
    /* последний турнир восстанавливается мгновенно */
    var last=lget(btKey(),null);
    if(last&&last.titles){
      var inp=q('#v16btIdea');if(inp&&last.idea)inp.value=last.idea;
      try{renderBracket(q('#v16btOut'),last.titles,last.Q,last.Sm,last.F,last.ctr,last.idea,true);}catch(e){}
    }
  };

  /* локальный судья-запаска: ВИСП-эвристика */
  function localScore(t){
    var s=0;
    if(/\d/.test(t))s+=3;
    if(/[А-ЯЁ]{3,}/.test(t))s+=2;
    if(/\?|почему|как |что будет/i.test(t))s+=2;
    if(/ты|тебе|твой|вы |вас/i.test(t))s+=1.5;
    if(/сейчас|сегодня|пока не|успей|2026/i.test(t))s+=1.5;
    if(/ошибк|никто не|правда|скрыва|на самом деле/i.test(t))s+=2;
    var L=t.length;
    if(L>=35&&L<=65)s+=2;else if(L>75)s-=2;
    return s;
  }
  function pickW(m,titles){
    var w=+m.w;
    if(w===+m.a||w===+m.b)return w;
    return localScore(titles[+m.a-1]||'')>=localScore(titles[+m.b-1]||'')?+m.a:+m.b;
  }

  async function run(){
    var idea=(q('#v16btIdea')||{}).value||'';idea=idea.trim();
    var fmtv=(q('#v16btFmt')||{}).value||'long';
    if(!idea){toast('Введи идею ролика','warn');return;}
    var out=q('#v16btOut');var go=q('#v16btGo');go.disabled=true;
    out.innerHTML=V.load16('Раунд 0: генерирую 8 бойцов-заголовков…');
    try{
      var sys1='Ты — титульный копирайтер YouTube. Сгенерируй ровно 8 РАЗНЫХ заголовков под идею ролика — каждый бьёт в свой триггер: 1 число/конкретный факт, 2 интрига/недосказанность, 3 выгода зрителя, 4 срочность/актуальность, 5 причастность («ты/тебе»), 6 провокация/против мнения большинства, 7 предостережение/ошибки, 8 история/личный опыт. До 70 символов каждый, без кавычек вокруг, без нумерации, по-русски. Верни строго JSON {"titles":["…",…]} — ровно 8.';
      var d1=await ai(sys1,'Идея: '+idea+'\nФормат: '+(fmtv==='shorts'?'Shorts':'длинный ролик')+'\n'+(V.anyCtx()||'')+(V.hitFormula()?'\nФормула хита канала: '+V.hitFormula():''),900);
      var titles=(d1.titles||[]).map(function(t){return String(t).trim();}).filter(Boolean).slice(0,8);
      if(titles.length<8)throw new Error('AI выдал меньше 8 заголовков — попробуй ещё раз');
      out.innerHTML=V.load16('Плей-офф: судья сталкивает заголовки по триггерам'+(chid()?' твоего канала':'')+'…');
      var sys2='Ты — судья турнира заголовков YouTube. Даны 8 заголовков (номера 1-8). Проведи плей-офф: четвертьфиналы (1vs2, 3vs4, 5vs6, 7vs8), полуфиналы, финал. Победителя каждой пары выбирай по силе триггеров и кликабельности'+(chid()?' С УЧЁТОМ того, что реально работает на этом канале (формула хита, топ-ролики)':'')+'. why — почему победил, до 12 слов, по-русски. В финале добавь ctr — прогноз CTR победителя в процентах (число от 2 до 12, реалистично). Верни строго JSON: {"q":[{"a":1,"b":2,"w":1,"why":"…"},{"a":3,"b":4,"w":4,"why":"…"},{"a":5,"b":6,"w":5,"why":"…"},{"a":7,"b":8,"w":8,"why":"…"}],"s":[{"a":0,"b":0,"w":0,"why":"…"},{"a":0,"b":0,"w":0,"why":"…"}],"f":{"a":0,"b":0,"w":0,"why":"причина победы, до 25 слов","ctr":5.5}}';
      var d2=await ai(sys2,'Заголовки:\n'+titles.map(function(t,i){return (i+1)+'. '+t;}).join('\n')+'\n\nИдея ролика: '+idea+'\n'+(V.anyCtx()||'')+(V.hitFormula()?'\nФормула хита: '+V.hitFormula():''),900);
      var Q=(d2.q||[]).slice(0,4),Sm=(d2.s||[]).slice(0,2),F=d2.f||{};
      /* валидация: чиним сетку, если AI напутал с номерами */
      var pairs=[[1,2],[3,4],[5,6],[7,8]];
      var qw=[];
      for(var i=0;i<4;i++){
        var m=Q[i]||{};m.a=pairs[i][0];m.b=pairs[i][1];
        m.w=pickW(m,titles);qw.push(m.w);Q[i]=m;
      }
      var sw=[];
      for(var j=0;j<2;j++){
        var sm=Sm[j]||{};sm.a=qw[j*2];sm.b=qw[j*2+1];
        sm.w=pickW(sm,titles);sw.push(sm.w);Sm[j]=sm;
      }
      F.a=sw[0];F.b=sw[1];F.w=pickW(F,titles);
      var ctr=clamp(parseFloat(F.ctr)||5,1.5,14).toFixed(1);
      renderBracket(out,titles,Q,Sm,F,ctr,idea);
      btSave({titles:titles,Q:Q,Sm:Sm,F:F,ctr:ctr,idea:idea,champ:titles[F.w-1]||titles[0]});
      var hh=q('#v16btHist');if(hh)hh.innerHTML=histHtml();
    }catch(e){out.innerHTML=err11((e&&e.message)||'турнир сорвался — попробуй ещё раз');}
    go.disabled=false;
  }

  function fighter(n,titles,winN,decided){
    var t=titles[n-1]||'';
    var cls=decided?(n===winN?' win':' lose'):'';
    return '<div class="v16-fighter'+cls+'"><span class="vs">#'+n+'</span><span>'+esc(t)+'</span></div>';
  }
  function renderBracket(out,titles,Q,Sm,F,ctr,idea,fromCache){
    var col1=Q.map(function(m){
      return '<div class="v16-match">'+fighter(m.a,titles,m.w,true)+fighter(m.b,titles,m.w,true)+(m.why?'<div class="why">⚖️ '+esc(m.why)+'</div>':'')+'</div>';
    }).join('');
    var col2=Sm.map(function(m){
      return '<div class="v16-match">'+fighter(m.a,titles,m.w,true)+fighter(m.b,titles,m.w,true)+(m.why?'<div class="why">⚖️ '+esc(m.why)+'</div>':'')+'</div>';
    }).join('');
    var champ=titles[F.w-1]||titles[0];
    var col3='<div class="v16-match">'+fighter(F.a,titles,F.w,true)+fighter(F.b,titles,F.w,true)+'</div>'+
      '<div class="v16-champ" id="v16champ"><div class="cup">🏆</div><div class="ct">'+esc(champ)+'</div>'+
      '<div class="ctr">📈 прогноз CTR ≈ '+ctr+'%</div>'+
      (F.why?'<div class="why">'+esc(F.why)+'</div>':'')+
      '<div class="v16-row" style="justify-content:center">'+
      '<button class="v16-copy" id="v16btCopy">📋 Копировать</button>'+
      '<button class="v16-copy" id="v16btLab">🖼 Примерить с превью в ленте</button>'+
      (chid()?'<button class="v16-copy" id="v16btConv">🏭 Ролик под ключ</button>':'<button class="v16-copy" id="v16btScript">📝 Сценарий</button>')+
      '</div></div>';
    out.innerHTML='<div class="v16-bracket">'+
      '<div><div class="v16-round-h">Четвертьфиналы</div>'+col1+'</div>'+
      '<div><div class="v16-round-h">Полуфиналы</div>'+col2+'</div>'+
      '<div><div class="v16-round-h">Финал</div>'+col3+'</div></div>';
    /* каскадное появление: плей-офф разыгрывается на глазах (из кэша — мгновенно) */
    var ms=qa('.v16-match',out),k=0;
    if(fromCache){
      ms.forEach(function(m){m.classList.add('show');});
      var c0=q('#v16champ',out);if(c0)c0.classList.add('show');
      var lbl=D.createElement('div');lbl.className='v16-note';lbl.style.cssText='margin-top:8px;text-align:center';lbl.textContent='💾 Последний турнир — восстановлен из памяти. Запусти новый, чтобы пересобрать.';
      out.appendChild(lbl);
    }else{
      ms.forEach(function(m){setTimeout(function(){m.classList.add('show');},220+k*330);k++;});
      setTimeout(function(){var c=q('#v16champ',out);if(c)c.classList.add('show');try{if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}catch(e){}},220+k*330+260);
    }
    var cp=q('#v16btCopy',out);if(cp)cp.addEventListener('click',function(){copyTxt(champ,cp);});
    var lb=q('#v16btLab',out);if(lb)lb.addEventListener('click',function(){
      W.v16HqClose();
      try{
        W.v4OpenTool('plab');
        setTimeout(function(){
          var t=q('#labTitleA');if(t)t.value=champ;
          toast('Заголовок уже в Лаборатории — загрузи превью и жми «показать в сетке»','ok');
        },420);
      }catch(e){toast('Лаборатория превью недоступна','warn');}
    });
    var cv=q('#v16btConv',out);if(cv)cv.addEventListener('click',function(){W.v16HqClose();W.v12ConvOpen&&W.v12ConvOpen(idea+' — заголовок: '+champ);});
    var sc=q('#v16btScript',out);if(sc)sc.addEventListener('click',function(){V.openScript(idea+' — заголовок: '+champ);});
  }
}
boot();
})();
