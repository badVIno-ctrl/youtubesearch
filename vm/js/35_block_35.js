/* ============ VIORA V18 · часть 1: реальные бенчмарки + вкладка «Рост» (ты vs рынок, время, монетизация, симулятор) ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V||!window.v16HqOpen){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,chid=C.chid,DAY=C.DAY;
  W.__v18=W.__v18||{};

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}

  /* ================= БАЗА РЕАЛЬНЫХ ДАННЫХ (исследования 2024–2026) ================= */
  var BENCH={
    /* Вовлечённость = (лайки+комментарии)/просмотры, % — по размеру канала. Modash, ноябрь 2025 */
    er:{
      tiers:[5e3,1e4,5e4,1e5,5e5,1e6,Infinity],
      rows:[[1.79,2.78,3.28,4.93],[1.78,2.67,3.12,4.53],[1.76,2.61,3.03,4.35],[1.80,2.64,3.04,4.31],[1.85,2.69,3.09,4.31],[1.79,2.59,2.97,4.10],[1.60,2.35,2.71,3.73]],
      src:'Modash, бенчмарки по 7 размерам каналов, ноябрь 2025'
    },
    /* Лайки/просмотры, % — здоровый диапазон. Humble&Brag, 2026 */
    likes:{long:[4,8],shorts:[3,6],src:'Humble & Brag, бенчмарки 2026'},
    /* Частота выпуска. vidIQ: 5,08 млн каналов, июнь 2024 — июнь 2025 */
    freq:{src:'vidIQ, исследование 5,08 млн каналов, 2024–2025',
      note:'12+ роликов/мес: просмотры растут ~в 8 раз быстрее, подписчики — в 3+ раза (против <1/мес). Даже 1 ролик/нед держит канал в рекомендациях.'},
    /* Баланс форматов: гибрид побеждает, новичкам 25–35% Shorts. Анализ гибридных каналов, 2026 */
    mix:{ideal:[25,35],src:'анализ гибридных каналов (Shorts vs Longs), 2026'},
    /* CTR по размеру канала (видно только в YouTube Studio). Humble&Brag / Focus Digital, 2025–2026 */
    ctr:{rows:[[1e3,'6–10%'],[1e4,'5–8%'],[1e5,'4–6%'],[Infinity,'3–5%']],poor:'< 4%',src:'Humble & Brag / Focus Digital, 2025–2026'},
    /* Удержание по длительности. Humble&Brag, 2026 */
    ret:{rows:[['Shorts','≥ 70% досмотра'],['до 5 мин','50–70%'],['5–15 мин','40–55%'],['15–30 мин','30–45%'],['30+ мин','25–35%']],src:'Humble & Brag, бенчмарки удержания 2026'},
    /* Путь до 1000 подписчиков. vidIQ: 9 414 каналов, созданных после 2023 */
    sub1k:{medianMonths:16,fastMonths:8.5,over40vids:68,over150vids:31,src:'vidIQ, 9 414 каналов (медиана пути до 1000 подписчиков)'},
    /* Пороги Партнёрской программы YouTube */
    ypp:{fan:{subs:500,label:'Ранний доступ: 500 подп. + 3 ролика за 90 дней + 3000 ч просмотра (или 3 млн просмотров Shorts за 90 дней)'},
         full:{subs:1000,label:'Полная монетизация: 1000 подп. + 4000 ч просмотра за год (или 10 млн просмотров Shorts за 90 дней)'}},
    /* Лучшее время. Buffer: 1,8 млн Shorts + длинные, 2026 */
    times:{src:'Buffer, анализ 1,8 млн роликов, 2026',
      long:{bestDays:'Вс · Вт · Пн',bestSlot:'воскресенье 10:00',window:'утро 8:00–11:00'},
      shorts:{bestDays:'Пт · Сб · Чт',bestSlot:'пятница 16:00–19:00',window:'вечер'},
      /* рекомендованные ячейки тепловой карты: [день 0=Пн..6=Вс, часть дня 0=утро..3=ночь] */
      recLong:[[6,0],[1,0],[0,0]],recShorts:[[4,2],[5,2],[3,2]]},
    /* Хук: первые секунды. Shortimize/Retensis + OpusClip (3000+ роликов), 2026 */
    hook:{src:'Shortimize / Retensis, OpusClip (3000+ роликов), 2026'},
    /* Факт дня для «Утра продюсера» */
    facts:[
      {t:'Каналы, выпускающие 12+ роликов в месяц, растут по просмотрам ~в 8 раз быстрее тех, кто публикует реже раза в месяц.',a:'Сегодня: проверь календарь — держишь ли темп хотя бы 1 ролик в неделю.',s:'vidIQ, 5,08 млн каналов'},
      {t:'68% каналов доходят до 1000 подписчиков только после 40+ видео, а самый частый путь — 150+ роликов.',a:'Сегодня: не суди канал по 10 видео — суди по тому, лучше ли каждый следующий ролик.',s:'vidIQ, 5,3 млн каналов'},
      {t:'Если первые 3 секунды Shorts удерживают меньше 80% зрителей, алгоритм режет раздачу в 5–10 раз.',a:'Сегодня: пересмотри первые 3 секунды последнего ролика — есть ли там движение, обещание и текст на экране?',s:'Shortimize / Retensis, 2026'},
      {t:'Конкретная цифра в первой фразе удерживает на 12–18% лучше, чем «много» или «мало».',a:'Сегодня: перепиши первую фразу следующего сценария так, чтобы в ней была цифра.',s:'OpusClip, 3000+ роликов'},
      {t:'Лучшее время для длинных роликов — утро 8:00–11:00, пик — воскресенье 10:00. Shorts наоборот: вечер, пик — пятница 16:00–19:00.',a:'Сегодня: поставь следующему ролику время публикации из этих окон.',s:'Buffer, 1,8 млн роликов'},
      {t:'Гибридные каналы (Shorts + длинные) обгоняют каналы одного формата. Идеальная доля Shorts для роста — 25–35%.',a:'Сегодня: глянь свой баланс форматов во вкладке «Рост».',s:'анализ гибридных каналов, 2026'},
      {t:'Здоровое удержание ролика 5–15 минут — 40–55%. Если ниже 40% — чаще всего проблема в хуке, а не в теме.',a:'Сегодня: открой YouTube Studio → Удержание и сравни свой график с этой планкой.',s:'Humble & Brag, 2026'},
      {t:'Хорошая вовлечённость (лайки+комментарии к просмотрам) для канала до 5000 подписчиков — выше 3,3%, отличная — выше 4,9%.',a:'Сегодня: попроси зрителей о конкретном действии в конце ролика — это легально поднимает вовлечённость.',s:'Modash, ноябрь 2025'},
      {t:'У маленьких каналов CTR обычно ВЫШЕ, чем у больших: до 1000 подписчиков нормой считается 6–10%.',a:'Сегодня: если CTR в Studio ниже 4% — меняй превью, а не тему.',s:'Humble & Brag / Focus Digital',},
      {t:'Медианный путь до 1000 подписчиков — около 16 месяцев. Быстрейшие 25% каналов добегают за 8,5.',a:'Сегодня: сверь свой темп с целью во вкладке «Рост» → «Путь к монетизации».',s:'vidIQ, 9 414 каналов'},
      {t:'Ролик, который держит 60% зрителей до конца, алгоритм продвигает с максимальной уверенностью.',a:'Сегодня: найди в Studio момент, где график удержания падает резче всего, — это место для пересборки.',s:'Humble & Brag, 2026'},
      {t:'Стабильность важнее рывков: канал, ушедший в тишину (<1 ролика/мес), теряет рост просмотров с ~10% до ~2% в месяц.',a:'Сегодня: если на неделе нет ролика — выпусти хотя бы Shorts по готовой теме из календаря.',s:'vidIQ, 2024–2025'},
      {t:'Лайки к просмотрам: здоровая норма 4–8% у длинных и 3–6% у Shorts.',a:'Сегодня: проверь последние 5 роликов — какие добирают до нормы, а какие нет, и чем они отличаются.',s:'Humble & Brag, 2026'},
      {t:'Первое слово ролика решает: не «привет, сегодня я…», а конкретное обещание или вопрос в первые 1,5 секунды.',a:'Сегодня: вычеркни приветствие из следующего сценария — начни сразу с сути.',s:'OpusClip / Welder, 2026'}
    ]
  };
  W.__v18.BENCH=BENCH;

  /* ================= МЕТРИКИ КАНАЛА ================= */
  function recentVids(days){
    var s=st(),all=(s.videos||[]).filter(function(v){return v&&v.published;});
    if(!all.length)return [];
    var cut=Date.now()-(days||90)*DAY;
    var r=all.filter(function(v){return new Date(v.published).getTime()>=cut;});
    return r.length>=4?r:all.slice(0,30);
  }
  function median(arr){if(!arr.length)return 0;var a=arr.slice().sort(function(x,y){return x-y;});var m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function erBenchRow(subs){
    for(var i=0;i<BENCH.er.tiers.length;i++)if(subs<BENCH.er.tiers[i])return BENCH.er.rows[i];
    return BENCH.er.rows[BENCH.er.rows.length-1];
  }
  /* позиция маркера на шкале 0..100: low|below|avg|high по краям диапазонов */
  function bandPos(val,lo,a1,a2,hi){
    if(val<=0)return 2;
    if(val<lo)return Math.max(3,val/lo*25);
    if(val<a1)return 25+(val-lo)/Math.max(.001,a1-lo)*25;
    if(val<a2)return 50+(val-a1)/Math.max(.001,a2-a1)*12.5;
    if(val<hi)return 62.5+(val-a2)/Math.max(.001,hi-a2)*12.5;
    return Math.min(97,75+ (val-hi)/Math.max(.001,hi)*50);
  }
  function statusOf(val,lo,hi){return val<lo?0:(val<hi?1:2);}
  var TAGS=['<span class="tag lo">ниже рынка</span>','<span class="tag mid">в рынке</span>','<span class="tag hi">выше рынка</span>'];

  function metrics(){
    var s=st(),ch=s.channel||{};
    var vids=recentVids(90);
    var longs=vids.filter(function(v){return !v.isShort;}),shorts=vids.filter(function(v){return v.isShort;});
    var er=median(vids.map(function(v){return (v.engagement||0)*100;}));
    var lkL=median(longs.map(function(v){return (v.likeRate||0)*100;}));
    var lkS=median(shorts.map(function(v){return (v.likeRate||0)*100;}));
    /* частота: по последним 90 дням реальной выкладки */
    var all=(s.videos||[]).filter(function(v){return v&&v.published;});
    var n90=all.filter(function(v){return new Date(v.published).getTime()>=Date.now()-90*DAY;}).length;
    var perMonth=n90/3;
    var shareShorts=vids.length?Math.round(shorts.length/vids.length*100):0;
    return {subs:ch.subs||0,total:all.length,vids:vids,er:er,lkL:lkL,lkS:lkS,perMonth:perMonth,shareShorts:shareShorts,hasLongs:longs.length>0,hasShorts:shorts.length>0};
  }
  W.__v18.metrics=metrics;

  /* ================= БЛОК 1: ты против рынка ================= */
  function gauge(o){
    return '<div class="v18-card v18-g"><div class="top"><b>'+o.name+'</b></div>'+
      '<div class="val">'+o.val+(o.unit?'<small> '+o.unit+'</small>':'')+'</div>'+
      '<div class="v18-band"><i style="left:'+o.pos.toFixed(1)+'%"></i></div>'+
      '<div class="v18-band-lab"><span>слабо</span><span>норма рынка</span><span>топ</span></div>'+
      '<div class="v18-verdict">'+TAGS[o.st]+o.text+'</div>'+
      (o.act?'<div class="v18-act">→ '+o.act+'</div>':'')+
      '<span class="v18-src">данные: '+o.src+'</span></div>';
  }
  function benchHtml(m){
    if(!m.vids.length)return '<div class="v18-card">Бенчмарки появятся после анализа канала на главной: сравню твои реальные цифры с рыночными нормами для канала твоего размера.</div>';
    var row=erBenchRow(m.subs),cards='';
    /* вовлечённость */
    var stE=statusOf(m.er,row[1],row[3]);
    cards+=gauge({name:'⚡ Вовлечённость (лайки+комм. / просмотры)',val:m.er.toFixed(2),unit:'%',
      pos:bandPos(m.er,row[0],row[1],row[2],row[3]),st:stE,
      text:'Для каналов твоего размера норма '+row[1]+'–'+row[2]+'%, топ — выше '+row[3]+'%.',
      act:stE===0?'Заканчивай ролик конкретным вопросом к зрителям и отвечай на первые комментарии в течение часа — это самый быстрый способ поднять вовлечённость.':(stE===1?'До «топа» не хватает '+Math.max(0,(row[3]-m.er)).toFixed(1)+' п.п. — добавь явный призыв к лайку в момент пиковой эмоции ролика.':'Аудитория живая — теперь масштабируй охват: больше роликов в проверенных темах.'),
      src:BENCH.er.src});
    /* лайки */
    if(m.hasLongs||m.hasShorts){
      var isL=m.hasLongs,v=isL?m.lkL:m.lkS,rng=isL?BENCH.likes.long:BENCH.likes.shorts;
      var stL=statusOf(v,rng[0],rng[1]);
      cards+=gauge({name:'👍 Лайки к просмотрам · '+(isL?'длинные':'Shorts'),val:v.toFixed(1),unit:'%',
        pos:bandPos(v,rng[0]*.55,rng[0],(rng[0]+rng[1])/2,rng[1]),st:stL,
        text:'Здоровый диапазон для '+(isL?'длинных роликов':'Shorts')+' — '+rng[0]+'–'+rng[1]+'%.',
        act:stL===0?'Лайк ставят за эмоцию и пользу «здесь и сейчас»: проси его сразу после самого сильного момента, а не в конце.':'',
        src:BENCH.likes.src});
    }
    /* частота */
    var stF=m.perMonth>=12?2:(m.perMonth>=4?1:0);
    cards+=gauge({name:'📆 Частота выпуска',val:m.perMonth.toFixed(1),unit:'роликов/мес',
      pos:Math.min(97,m.perMonth/16*100),st:stF,
      text:BENCH.freq.note,
      act:stF<2?'Подними темп на одну ступень: '+(m.perMonth<4?'закрепи хотя бы 1 ролик в неделю — это порог видимости в рекомендациях.':'попробуй 3 ролика в неделю: 2 Shorts + 1 длинный из готового календаря.'):'Темп топовый — следи, чтобы качество хука не проседало.',
      src:BENCH.freq.src});
    /* баланс форматов */
    var ideal=BENCH.mix.ideal,stM=(m.shareShorts>=ideal[0]&&m.shareShorts<=ideal[1])?1:(m.shareShorts>ideal[1]?(m.shareShorts>60?0:1):0);
    cards+=gauge({name:'🎬 Баланс форматов (доля Shorts)',val:String(m.shareShorts),unit:'%',
      pos:bandPos(m.shareShorts,12,ideal[0],ideal[1],55),st:stM,
      text:'Гибридные каналы обгоняют каналы одного формата. Идеал для роста — '+ideal[0]+'–'+ideal[1]+'% Shorts: они приводят новых, длинные — удерживают и монетизируют.',
      act:m.shareShorts<ideal[0]?'Добавь Shorts: нарежь моменты из готовых длинных через «Режиссёр Shorts».':(m.shareShorts>55?'Слишком много Shorts: подписчик с них хуже конвертируется — добавь длинные ролики, они «копилка» канала.':''),
      src:BENCH.mix.src});
    /* справочник Studio */
    var ctr='';for(var i=0;i<BENCH.ctr.rows.length;i++){if(m.subs<BENCH.ctr.rows[i][0]){ctr=BENCH.ctr.rows[i][1];break;}}
    var ret=BENCH.ret.rows.map(function(r){return '<div class="cell"><b>'+r[0]+'</b>норма удержания: <span class="rng">'+r[1]+'</span></div>';}).join('');
    var studio='<div class="v18-card"><b style="font-size:13.5px">🎯 Ориентиры для YouTube Studio</b>'+
      '<div style="font-size:12px;color:#9aa3b2;margin-top:5px;line-height:1.5">CTR и удержание не видны снаружи — сверяй сам в Studio с этими планками:</div>'+
      '<div class="v18-studio"><div class="cell"><b>CTR превью для твоего размера</b>норма: <span class="rng">'+ctr+'</span> · тревога: <span style="color:#ff8aa0">'+BENCH.ctr.poor+'</span></div>'+ret+'</div>'+
      '<span class="v18-src">данные: '+BENCH.ctr.src+' · '+BENCH.ret.src+'</span></div>';
    return '<div class="v18-bench">'+cards+'</div>'+studio;
  }

  /* ================= БЛОК 2: лучшее время ================= */
  var PARTS=[['Утро','6–11'],['День','12–16'],['Вечер','17–22'],['Ночь','23–5']];
  var DOWS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  function partOf(h){return h>=6&&h<12?0:(h>=12&&h<17?1:(h>=17&&h<23?2:3));}
  function heatHtml(m){
    var cellAgg={},maxMed=0,enough=false;
    if(m.vids.length>=8){
      var byCell={};
      m.vids.forEach(function(v){
        var d=new Date(v.published),k=((d.getDay()+6)%7)+'_'+partOf(d.getHours());
        (byCell[k]=byCell[k]||[]).push(v.viewsPerDay||((v.views||0)/30));
      });
      Object.keys(byCell).forEach(function(k){
        var md=median(byCell[k]);cellAgg[k]={n:byCell[k].length,med:md};
        if(byCell[k].length>=2&&md>maxMed)maxMed=md;
      });
      enough=maxMed>0;
    }
    var rec={};BENCH.times.recLong.forEach(function(c){rec[c[0]+'_'+c[1]]='long';});BENCH.times.recShorts.forEach(function(c){rec[c[0]+'_'+c[1]]='sh';});
    var grid='<div class="v18-heat"><div class="hl"></div>'+DOWS.map(function(d){return '<div class="hl">'+d+'</div>';}).join('');
    for(var p=0;p<4;p++){
      grid+='<div class="hl">'+PARTS[p][0]+'<br>'+PARTS[p][1]+'</div>';
      for(var d=0;d<7;d++){
        var k=d+'_'+p,a=cellAgg[k],lvl='';
        if(enough&&a&&a.n>=2){var r=a.med/maxMed;lvl=r>.7?' l3':(r>.35?' l2':(r>.12?' l1':''));}
        grid+='<div class="hc'+lvl+(rec[k]?' rec':'')+'" title="'+DOWS[d]+', '+PARTS[p][0].toLowerCase()+(a?(' · роликов: '+a.n+' · медиана просм./день: '+fmt(Math.round(a.med))):'')+(rec[k]?' · рекомендация исследования Buffer':'')+'">'+(a?fmt(Math.round(a.med)):'·')+(a?'<span class="n">'+a.n+'</span>':'')+'</div>';
      }
    }
    grid+='</div>';
    return '<div class="v18-card">'+
      (enough?'<div style="font-size:12px;color:#9aa3b2;line-height:1.5">Зелёное — где ТВОИ ролики реально взлетали (медиана просмотров/день по дню недели и времени выхода). Янтарная рамка — слоты из исследования Buffer.</div>'
        :'<div style="font-size:12px;color:#9aa3b2;line-height:1.5">Пока роликов мало для личной статистики — показываю проверенные слоты из исследования Buffer (янтарная рамка). Когда наберётся 8+ роликов, карта перестроится под твой канал.</div>')+
      grid+
      '<div class="v18-timechips">'+
      '<span class="tc">🎞 Длинные: '+BENCH.times.long.window+' · лучший слот — '+BENCH.times.long.bestSlot+' · дни: '+BENCH.times.long.bestDays+'</span>'+
      '<span class="tc">⚡ Shorts: '+BENCH.times.shorts.window+' · лучший слот — '+BENCH.times.shorts.bestSlot+' · дни: '+BENCH.times.shorts.bestDays+'</span></div>'+
      '<span class="v18-src">данные: '+BENCH.times.src+' + публикации твоего канала</span></div>';
  }

  /* ================= БЛОК 3: путь к монетизации ================= */
  function mile(ic,title,sub,cur,goal){
    var pct=Math.min(100,goal?cur/goal*100:0),done=pct>=100;
    return '<div class="v18-mile'+(done?' done':'')+'"><span class="ic">'+(done?'✅':ic)+'</span>'+
      '<div class="mi"><b>'+title+'</b><small>'+sub+'</small><div class="v18-bar"><i style="width:'+pct.toFixed(1)+'%"></i></div></div>'+
      '<span class="pct">'+(done?'готово':Math.floor(pct)+'%')+'</span></div>';
  }
  function roadHtml(m){
    var s=st(),subs=m.subs;
    var html='<div class="v18-card v18-road">';
    if(!s.channel){
      html+='<div style="font-size:12.5px;line-height:1.6">Подключи канал на главной — и здесь появится живой прогресс к Партнёрской программе YouTube. А пока запомни честные ориентиры рынка ниже.</div>';
    }else{
      html+=mile('🪙','Ранний доступ к монетизации — 500 подписчиков',BENCH.ypp.fan.label,subs,500);
      html+=mile('💰','Полная монетизация — 1000 подписчиков',BENCH.ypp.full.label,subs,1000);
      html+=mile('🎞','Библиотека контента — 40 видео',Math.round(m.total)+' опубликовано. 68% каналов доходят до 1000 подписчиков после 40+ видео — библиотека работает на тебя каждый день.',m.total,40);
    }
    html+='<div class="v18-honest">🧭 <b>Честная карта пути</b> (vidIQ, 9 414 каналов): медиана до 1000 подписчиков — ~'+BENCH.sub1k.medianMonths+' месяцев, быстрейшие 25% — до '+BENCH.sub1k.fastMonths+' мес. '+BENCH.sub1k.over40vids+'% каналов понадобилось 40+ видео, '+BENCH.sub1k.over150vids+'% — 150 и больше. Если у тебя «всего» '+(m.total||0)+' роликов и нет 1000 подписчиков — ты не отстаёшь, ты в процессе. Важно одно: каждый следующий ролик чуть лучше предыдущего.</div>';
    html+='<span class="v18-src">данные: '+BENCH.sub1k.src+' · пороги YPP — официальные правила YouTube</span></div>';
    return html;
  }

  /* ================= БЛОК 4: симулятор роста ================= */
  /* множители скорости роста подписчиков/просмотров по частоте (vidIQ, относительно <1 ролика/мес) */
  function freqMult(perMonth){
    if(perMonth>=12)return {v:8,s:3.3};
    if(perMonth>=4)return {v:6.2,s:2.6};
    if(perMonth>=1)return {v:4.9,s:1.9};
    return {v:1,s:1};
  }
  function simHtml(m){
    var cur=Math.max(.25,m.perMonth||1);
    return '<div class="v18-card v18-sim">'+
      '<div style="font-size:12px;color:#9aa3b2;line-height:1.5">Двигай ползунок — посчитаю по множителям vidIQ, как темп выпуска меняет скорость канала. Сейчас твой темп: <b style="color:#fff">'+(m.perMonth||0).toFixed(1)+' рол./мес</b>.</div>'+
      '<div class="row"><label>Роликов в неделю</label><input type="range" id="v18simR" min="1" max="28" step="1" value="'+Math.min(28,Math.max(1,Math.round(cur/4.33*4)))+'"><span class="rv" id="v18simRv"></span></div>'+
      '<div class="v18-simout" id="v18simOut"></div>'+
      '<div class="v18-simnote" id="v18simNote"></div>'+
      '<span class="v18-src">данные: '+BENCH.freq.src+' · '+BENCH.sub1k.src+' · оценка, не гарантия</span></div>';
  }
  function simPaint(m){
    var r=q('#v18simR');if(!r)return;
    var quarters=+r.value,perWeek=quarters/4,perMonth=perWeek*4.33;
    q('#v18simRv').textContent=(perWeek<1?perWeek.toFixed(2):perWeek.toFixed(perWeek%1?1:0))+' / нед';
    var mu=freqMult(perMonth),muCur=freqMult(Math.max(.25,m.perMonth));
    /* медиана 16 мес ≈ темп ~4 ролика/мес (1/нед). Шкалируем от множителя подписчиков */
    var baseMult=freqMult(4).s;
    var eta=BENCH.sub1k.medianMonths*(baseMult/mu.s);
    var remain=m.subs>0?Math.max(.02,1-Math.min(1,m.subs/1000)):1;
    var etaUser=eta*remain;
    var etaCur=BENCH.sub1k.medianMonths*(baseMult/muCur.s)*remain;
    var saved=Math.max(0,etaCur-etaUser);
    q('#v18simOut').innerHTML=
      '<div class="so"><b>×'+mu.v.toFixed(1)+'</b><small>скорость просмотров</small></div>'+
      '<div class="so"><b>×'+mu.s.toFixed(1)+'</b><small>скорость подписчиков</small></div>'+
      '<div class="so"><b>'+(etaUser<1?'<1':Math.round(etaUser))+' мес</b><small>оценка до 1000 подп.</small></div>';
    q('#v18simNote').innerHTML= saved>=1
      ? '⚡ Такой темп вместо текущего приближает 1000 подписчиков примерно на <b>'+Math.round(saved)+' мес</b>. Главное правило vidIQ: каждая ступень частоты = новая скорость канала.'
      : (perMonth<4?'⚠️ Ниже 1 ролика в неделю канал выпадает из рекомендаций — это самый дорогой режим. Хотя бы 4 ролика в месяц меняют картину.':'✊ Ты уже близко к этому темпу — теперь решает качество хука и упаковки, а не частота.');
  }

  /* ================= вкладка «Рост» ================= */
  function renderGrowth(body){
    var m=metrics();
    body.innerHTML='<div class="v18-wrap">'+
      '<div class="v18-subnav">'+
        '<button data-go="v18bench">⚡ Ты vs рынок</button>'+
        '<button data-go="v18time">🗓 Когда выходить</button>'+
        '<button data-go="v18road">🛣 Монетизация</button>'+
        '<button data-go="v18sim">🎚 Симулятор</button>'+
        '<button data-go="v18hooklab">🪝 Хук-лаб</button>'+
      '</div>'+
      '<div class="v18-sec" id="v18bench"><div class="v18-h"><b>⚡ Ты против рынка</b><small>твои реальные цифры против исследований 2025–2026</small></div>'+benchHtml(m)+'</div>'+
      '<div class="v18-sec" id="v18time"><div class="v18-h"><b>🗓 Когда выходить</b><small>твоя статистика + Buffer, 1,8 млн роликов</small></div>'+heatHtml(m)+'</div>'+
      '<div class="v18-sec" id="v18road"><div class="v18-h"><b>🛣 Путь к монетизации</b><small>живой прогресс к порогам YouTube</small></div>'+roadHtml(m)+'</div>'+
      '<div class="v18-sec" id="v18sim"><div class="v18-h"><b>🎚 Симулятор темпа</b><small>что даёт частота — на данных vidIQ</small></div>'+simHtml(m)+'</div>'+
      '<div class="v18-sec" id="v18hooklab"><div class="v18-h"><b>🪝 Хук-лаборатория</b><small>первые 3 секунды решают всё</small></div><div id="v18hookBody"></div></div>'+
      '</div>';
    body.querySelector('.v18-subnav').addEventListener('click',function(e){
      var b=e.target.closest('[data-go]');if(!b)return;
      var el=q('#'+b.getAttribute('data-go'),body);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
    var r=q('#v18simR',body);
    if(r){r.addEventListener('input',function(){simPaint(m);});simPaint(m);}
    if(W.__v18.hookLab)try{W.__v18.hookLab(q('#v18hookBody',body));}catch(e){}
  }
  V.regTab({id:'growth',ic:'📈',name:'Рост'},renderGrowth);
  W.__v18.renderGrowth=renderGrowth;
}
boot();
})();
