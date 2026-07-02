/* ============ VIORA V19 · часть 1: Кабинет продюсера — каналы, динамика, ачивки, отчёт, бэкап ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16,X=window.__v18;
  if(!C||!V||!X||!X.metrics){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,fmt=C.fmt,chid=C.chid,DAY=C.DAY;
  var Z=W.__v19=W.__v19||{};

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
  Z.openAudit=function(entry){
    STATE=JSON.parse(JSON.stringify(entry.state));
    ['#hero','#ideas','#loading'].forEach(function(sel){var el=q(sel);if(el)el.style.display='none';});
    if(W.renderDashboard)W.renderDashboard();
    toast('Открыто из кэша · '+(entry.title||''),'ok');
    W.scrollTo(0,0);
  };
  function pid(){return V.pid?V.pid():(chid()||'p0');}
  function hist(){return lget('viora_hist_audit',[])||[];}
  function median(a){if(!a.length)return 0;var b=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;}
  function score(){var s=st();return (s.ai&&s.ai.score!=null)?Math.round(s.ai.score):null;}

  /* ================= СНАПШОТЫ ДЛЯ ДИНАМИКИ ================= */
  function snapKey(){return 'v19_snaps:'+pid();}
  function snaps(){return lget(snapKey(),[])||[];}
  function takeSnap(){
    var s=st();if(!s.channel||!s.channel.id||!(s.videos||[]).length)return;
    if(s.channel.id!==pid())return;
    var m=X.metrics();
    var snap={ts:Date.now(),subs:+s.channel.subs||0,vids:(s.videos||[]).length,
      er:+(m.er||0).toFixed(2),vpd:Math.round(median((s.videos||[]).map(function(v){return v.viewsPerDay||0;}))),
      score:score()||0};
    var a=snaps(),last=a[a.length-1];
    if(last){
      var sameDay=new Date(last.ts).toDateString()===new Date(snap.ts).toDateString();
      var same=last.subs===snap.subs&&last.vids===snap.vids&&last.score===snap.score;
      if(sameDay&&same)return;
      if(sameDay){a[a.length-1]=snap;lset(snapKey(),a.slice(-90));return;}
    }
    a.push(snap);lset(snapKey(),a.slice(-90));
  }
  setInterval(function(){try{takeSnap();}catch(e){}},6000);

  /* ================= АЧИВКИ И УРОВНИ ================= */
  var ACH=[
    {id:'audit',ic:'🔍',n:'Первый аудит',d:'Прогнал канал через полный AI-разбор',t:function(){return !!(st().channel&&st().channel.id);}},
    {id:'plan',ic:'📅',n:'Штурман',d:'Собрал контент-план на 30 дней',t:function(){return !!V.calGet();}},
    {id:'streak3',ic:'🔥',n:'Разогрев',d:'Стрик публикаций 3 дня подряд',t:function(){return V.streak()>=3;}},
    {id:'streak7',ic:'🌋',n:'Неделя без пропусков',d:'Стрик публикаций 7 дней подряд',t:function(){return V.streak()>=7;}},
    {id:'battle',ic:'🥊',n:'Промоутер',d:'Провёл первый турнир заголовков',t:function(){return (lget('v16_bt_hist:'+pid(),[])||[]).length>0;}},
    {id:'hook6',ic:'🪝',n:'Чистый хук',d:'Закрыл все 6 пунктов чек-листа хука',t:function(){return (lget('v18_hook_chk',[])||[]).length>=6;}},
    {id:'vids40',ic:'🎬',n:'Библиотека',d:'40+ роликов на канале — порог, после которого у 68% каналов начинается рост',t:function(){var s=st();return ((s.videos||[]).length)>=40;}},
    {id:'er',ic:'💬',n:'Живая аудитория',d:'Вовлечённость выше медианы рынка для своего размера',t:function(){
      var s=st();if(!s.channel)return false;var m=X.metrics();if(!m.vids.length)return false;
      var subs=m.subs,B=X.BENCH,ti=0;while(subs>=B.er.tiers[ti])ti++;return m.er>=B.er.rows[ti][1];}},
    {id:'subs500',ic:'🎯',n:'Полпути',d:'500+ подписчиков — открыт ранний доступ к Партнёрке',t:function(){var s=st();return s.channel&&(+s.channel.subs||0)>=500;}},
    {id:'subs1000',ic:'💰',n:'Монетизация',d:'1000+ подписчиков — порог полной Партнёрки взят',t:function(){var s=st();return s.channel&&(+s.channel.subs||0)>=1000;}},
    {id:'ideas5',ic:'💡',n:'Генератор',d:'5+ идей в банке идей',t:function(){return (lget('v19_ideas:'+pid(),[])||[]).length>=5;}},
    {id:'backup',ic:'💾',n:'Хозяин данных',d:'Скачал резервную копию своих данных',t:function(){return !!lget('v19_backup_done',0);}}
  ];
  var LVLS=[[0,'Новичок','🌱'],[3,'Практик','⚙️'],[6,'Продюсер','🎬'],[9,'Профи','🏆'],[12,'Легенда','👑']];
  function earned(){return lget('v19_ach',[])||[];}
  function achTick(silent){
    var got=earned(),fresh=[];
    ACH.forEach(function(a){try{if(got.indexOf(a.id)<0&&a.t()){got.push(a.id);fresh.push(a);}}catch(e){}});
    if(fresh.length){
      lset('v19_ach',got);
      if(!silent){
        fresh.forEach(function(a){toast(a.ic+' Ачивка: «'+a.n+'»','ok');});
        try{if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}catch(e){}
      }
    }
    return got;
  }
  setInterval(function(){try{achTick();}catch(e){}},8000);
  function lvlOf(n){var l=LVLS[0];LVLS.forEach(function(x){if(n>=x[0])l=x;});return l;}
  Z.achList=function(){return ACH;};Z.earned=earned;Z.lvlOf=lvlOf;

  /* ================= ОТЧЁТ ================= */
  function bandVerdict(val,low,mid,top){
    if(val>=top)return ['топ рынка','ok'];if(val>=mid)return ['в рынке','ok'];
    if(val>=low)return ['ниже медианы','warn'];return ['слабо','bad'];
  }
  function reportHtml(){
    var s=st(),ch=s.channel||{},m=X.metrics(),B=X.BENCH;
    var dt=new Date(),ds=('0'+dt.getDate()).slice(-2)+'.'+('0'+(dt.getMonth()+1)).slice(-2)+'.'+dt.getFullYear();
    var subs=m.subs,ti=0;while(subs>=B.er.tiers[ti])ti++;
    var er=B.er.rows[ti];
    var vpd=Math.round(median((s.videos||[]).map(function(v){return v.viewsPerDay||0;})));
    var sc=score();
    var rows=[];
    if(m.vids.length){
      var v1=bandVerdict(m.er,er[0],er[1],er[3]);
      rows.push(['Вовлечённость (лайки+комм. / просмотры)',m.er.toFixed(2)+'%','норма '+er[1]+'–'+er[2]+'% · топ '+er[3]+'%',v1]);
      if(m.hasLongs){var v2=bandVerdict(m.lkL,B.likes.long[0]*0.6,B.likes.long[0],B.likes.long[1]);rows.push(['Лайки к просмотрам · длинные',m.lkL.toFixed(2)+'%','здоровый диапазон '+B.likes.long[0]+'–'+B.likes.long[1]+'%',v2]);}
      if(m.hasShorts){var v3=bandVerdict(m.lkS,B.likes.shorts[0]*0.6,B.likes.shorts[0],B.likes.shorts[1]);rows.push(['Лайки к просмотрам · Shorts',m.lkS.toFixed(2)+'%','здоровый диапазон '+B.likes.shorts[0]+'–'+B.likes.shorts[1]+'%',v3]);}
      var v4=bandVerdict(m.perMonth,1,4,12);rows.push(['Частота выпуска',m.perMonth.toFixed(1)+' ролика/мес','12+/мес — просмотры растут ~в 8 раз быстрее (vidIQ)',v4]);
      var v5=m.shareShorts>=B.mix.ideal[0]&&m.shareShorts<=B.mix.ideal[1]?['идеал','ok']:(m.shareShorts>0&&m.shareShorts<60?['в рынке','ok']:['перекос','warn']);
      rows.push(['Доля Shorts',m.shareShorts+'%','идеал для роста '+B.mix.ideal[0]+'–'+B.mix.ideal[1]+'%',v5]);
    }
    var leaks=[];try{
      if(s.ai&&s.ai.main_leak)leaks.push(s.ai.main_leak);
      if(s.ai&&s.ai.leaks)s.ai.leaks.slice(0,3).forEach(function(l){leaks.push(typeof l==='string'?l:(l.title||l.text||''));});
    }catch(e){}
    var recs=[];try{
      if(s.ai&&s.ai.hit_formula)s.ai.hit_formula.slice(0,4).forEach(function(f){recs.push(typeof f==='string'?f:(f.text||''));});
      if(s.ai&&s.ai.recommendations)s.ai.recommendations.slice(0,4).forEach(function(r){recs.push(typeof r==='string'?r:(r.text||r.title||''));});
    }catch(e){}
    var cal=V.calGet(),week=[];
    if(cal){var t0=V.today();for(var i=0;i<7;i++){var dk=V.dkey(new Date(t0.getTime()+i*DAY));var it=V.calItem(cal,dk);if(it)week.push({d:dk,it:it});}}
    var hits=(s.videos||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,5);
    return '<div class="v19-rep">'+
      '<div class="rhead"><div class="brand">Viora<i>Media</i><small>AI-аудит YouTube-канала</small></div>'+
      '<div class="chh">'+(ch.avatar?'<img src="'+esc(ch.avatar)+'" alt="">':'')+'<div><b style="font-size:16px">'+esc(ch.title||'Канал')+'</b><div style="font-size:11.5px;color:#9aa0ae">'+esc(ch.handle||'')+' · отчёт от '+ds+'</div></div></div></div>'+
      '<h2>Сводка</h2><div class="grid">'+
        '<div class="kpi"><b>'+(sc!=null?sc+'/100':'—')+'</b><small>индекс канала Viora</small></div>'+
        '<div class="kpi"><b>'+fmt(subs)+'</b><small>подписчиков</small></div>'+
        '<div class="kpi"><b>'+(s.videos||[]).length+'</b><small>роликов проанализировано</small></div>'+
        '<div class="kpi"><b>'+fmt(vpd)+'</b><small>медиана просмотров/день на ролик</small></div></div>'+
      (rows.length?'<h2>Метрики против рынка</h2><table><tr><th>Метрика</th><th>Канал</th><th>Ориентир рынка</th><th>Вердикт</th></tr>'+
        rows.map(function(r){return '<tr><td>'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td class="'+r[3][1]+'">'+r[3][0]+'</td></tr>';}).join('')+'</table>'+
        '<div style="font-size:11px;color:#9aa0ae;margin-top:6px">Источники: '+B.er.src+' · '+B.likes.src+' · '+B.freq.src+'</div>':'')+
      (leaks.length?'<h2>Главные утечки роста</h2><ul>'+leaks.filter(Boolean).map(function(l){return '<li>'+esc(l)+'</li>';}).join('')+'</ul>':'')+
      (recs.length?'<h2>Формула хита и рекомендации</h2><ol>'+recs.filter(Boolean).map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ol>':'')+
      (hits.length?'<h2>Топ-5 роликов по скорости набора</h2><table><tr><th>Ролик</th><th>Просмотры</th><th>В день</th><th>Формат</th></tr>'+
        hits.map(function(v){return '<tr><td>'+esc(v.title||'')+'</td><td>'+fmt(v.views||0)+'</td><td>'+fmt(Math.round(v.viewsPerDay||0))+'</td><td>'+(v.isShort?'Shorts':'длинный')+'</td></tr>';}).join('')+'</table>':'')+
      (week.length?'<h2>План на ближайшую неделю</h2><table><tr><th>Дата</th><th>Тема</th><th>Формат</th></tr>'+
        week.map(function(w){var d=new Date(w.d+'T00:00:00');return '<tr><td>'+('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'</td><td>'+esc(w.it.topic||'')+'</td><td>'+(w.it.format==='shorts'?'Shorts':'длинный')+'</td></tr>';}).join('')+'</table>':'')+
      '<div class="foot"><span>Подготовлено VioraMedia · AI-аудит YouTube-каналов</span><span>'+ds+'</span></div></div>';
  }
  function ensureOv(){
    var ov=q('#v19ov');
    if(!ov){ov=D.createElement('div');ov.id='v19ov';ov.innerHTML='<button class="close">✕ Закрыть</button><div id="v19repBox"></div>';D.body.appendChild(ov);
      q('.close',ov).addEventListener('click',function(){ov.classList.remove('open');});
      D.addEventListener('keydown',function(e){if(e.key==='Escape')ov.classList.remove('open');});}
    return ov;
  }
  function openReport(){
    var s=st();if(!s.channel||!s.channel.id){toast('Сначала сделай анализ канала — отчёт собирается из его данных');return;}
    var ov=ensureOv();q('#v19repBox',ov).innerHTML=reportHtml();ov.classList.add('open');ov.scrollTop=0;
  }
  function printReport(){
    var s=st();if(!s.channel||!s.channel.id){toast('Сначала сделай анализ канала — отчёт собирается из его данных');return;}
    var ov=ensureOv();q('#v19repBox',ov).innerHTML=reportHtml();ov.classList.add('open');
    D.body.classList.add('v19print');
    var done=function(){D.body.classList.remove('v19print');W.removeEventListener('afterprint',done);};
    W.addEventListener('afterprint',done);
    setTimeout(function(){try{W.print();}catch(e){done();}},120);
  }
  W.v19Report=openReport;W.v19Print=printReport;

  /* ================= БЭКАП ================= */
  function exportAll(){
    var out={};
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);out[k]=localStorage.getItem(k);}}catch(e){}
    var blob=new Blob([JSON.stringify({viora_backup:1,ts:Date.now(),data:out})],{type:'application/json'});
    var a=D.createElement('a');a.href=URL.createObjectURL(blob);
    var dt=new Date();a.download='viora-backup-'+dt.getFullYear()+('0'+(dt.getMonth()+1)).slice(-2)+('0'+dt.getDate()).slice(-2)+'.json';
    D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
    lset('v19_backup_done',1);toast('💾 Бэкап скачан — храни файл в надёжном месте','ok');achTick();
  }
  function importAll(file){
    var r=new FileReader();
    r.onload=function(){
      try{
        var j=JSON.parse(r.result);
        if(!j||!j.viora_backup||!j.data)throw new Error('это не файл бэкапа Viora');
        var n=0;for(var k in j.data){if(j.data.hasOwnProperty(k)){try{localStorage.setItem(k,j.data[k]);n++;}catch(e){}}}
        toast('✅ Восстановлено '+n+' записей — перезагружаю…','ok');
        setTimeout(function(){location.reload();},900);
      }catch(e){toast('Не получилось: '+((e&&e.message)||e));}
    };
    r.readAsText(file);
  }

  /* ================= UI ВКЛАДКИ «КАБИНЕТ» ================= */
  function chanCards(){
    var h=hist(),cur=pid();
    if(!h.length)return '<div class="v16-note">Здесь появятся все каналы, которые ты прогонишь через анализ, — с быстрым переключением между ними. Сделай первый аудит на главной.</div>';
    return '<div class="v19-chans">'+h.map(function(e,i){
      var sc=e.score!=null?Math.round(e.score):null;
      var cls=sc==null?'':(sc>=70?'':(sc>=45?' mid':' low'));
      var subs=e.state&&e.state.channel?(+e.state.channel.subs||0):0;
      var d=new Date(e.ts);var ds=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2);
      return '<div class="v19-chan'+(String(e.k)===String(cur)?' cur':'')+'" data-i="'+i+'">'+
        (e.avatar?'<img src="'+esc(e.avatar)+'" alt="" loading="lazy">':'<span class="av">📺</span>')+
        '<div class="ci"><b>'+esc(e.title||'Канал')+'</b><small>'+fmt(subs)+' подп. · '+esc(e.niche||'')+' · аудит '+ds+'</small></div>'+
        (sc!=null?'<span class="sc'+cls+'">'+sc+'</span>':'')+
        (String(e.k)===String(cur)?'<span style="font-size:10.5px;color:#ff7a45;flex:none">открыт</span>':'<button class="v16-btn ghost" data-open="'+i+'" style="padding:7px 11px;min-height:34px">Открыть</button>')+
      '</div>';}).join('')+'</div>'+
      '<div class="v16-note" style="margin-top:10px">Хранится до 6 последних каналов (страховка от переполнения памяти браузера). Переключение мгновенное — анализ берётся из кэша, без траты квоты API.</div>';
  }
  function dynHtml(){
    var a=snaps();
    if(a.length<2)return '<div class="v16-note">Снимки метрик сохраняются автоматически при каждом анализе. Сделай повторный аудит через несколько дней — здесь появится график «что изменилось»: подписчики, вовлечённость, скорость просмотров и индекс. '+(a.length===1?'Первый снимок уже сохранён ✅':'')+'</div>';
    var mode=Z._dynMode||'subs';
    var defs={subs:['Подписчики',function(x){return x.subs;}],er:['Вовлечённость, %',function(x){return x.er;}],vpd:['Просмотры/день (медиана)',function(x){return x.vpd;}],score:['Индекс Viora',function(x){return x.score;}]};
    var dd=defs[mode],vals=a.map(dd[1]);
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals);if(max===min)max=min+1;
    var Wd=720,H=190,P=28;
    function xy(i,v){return [P+(Wd-2*P)*(a.length===1?0:i/(a.length-1)),H-P-(H-2*P)*((v-min)/(max-min))];}
    var pts=vals.map(function(v,i){return xy(i,v);});
    var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    var area=line+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H-P)+' L'+pts[0][0].toFixed(1)+' '+(H-P)+' Z';
    var first=vals[0],lastV=vals[vals.length-1],prev=vals[vals.length-2];
    function dCard(lbl,from,to){
      var d=to-from,up=d>=0;
      return '<div class="d '+(up?'up':'dn')+'"><b>'+(up?'+':'')+(mode==='er'?d.toFixed(2):fmt(Math.round(d)))+'</b>'+lbl+'</div>';
    }
    var labs='';[0,a.length-1].forEach(function(i){var d=new Date(a[i].ts);labs+='<text x="'+pts[i][0]+'" y="'+(H-8)+'" text-anchor="middle">'+('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'</text>';});
    return '<div class="v19-dyn-pick">'+Object.keys(defs).map(function(k){return '<button data-m="'+k+'"'+(k===mode?' class="on"':'')+'>'+defs[k][0]+'</button>';}).join('')+'</div>'+
      '<svg class="v19-chart" viewBox="0 0 '+Wd+' '+H+'" preserveAspectRatio="none"><defs><linearGradient id="v19grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2d55" stop-opacity=".35"/><stop offset="1" stop-color="#ff2d55" stop-opacity="0"/></linearGradient></defs>'+
      '<path class="ar" d="'+area+'"/><path class="ln" d="'+line+'"/>'+
      pts.map(function(p){return '<circle class="dot" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5"/>';}).join('')+labs+'</svg>'+
      '<div class="v19-delta">'+dCard('с первого снимка',first,lastV)+dCard('с прошлого снимка',prev,lastV)+
      '<div class="d"><b>'+a.length+'</b>снимков · с '+new Date(a[0].ts).toLocaleDateString('ru-RU')+'</div></div>'+
      '<div class="v16-note" style="margin-top:10px">Это твоё доказательство для клиентов: цифры «до» и «после» работы продюсера.</div>';
  }
  function achHtml(){
    var got=achTick(true),lvl=lvlOf(got.length);
    var next=LVLS.filter(function(l){return l[0]>got.length;})[0];
    var pct=Math.min(100,Math.round(got.length/ACH.length*100));
    return '<div class="v19-lvl"><span class="big">'+lvl[2]+'</span><div><b style="font-size:15px">Уровень: '+lvl[1]+'</b>'+
      '<div style="font-size:11.5px;color:#9aa0ae">'+got.length+' из '+ACH.length+' ачивок'+(next?' · до уровня «'+next[1]+'» ещё '+(next[0]-got.length):' · максимум!')+'</div></div>'+
      '<div class="bar"><i style="width:'+pct+'%"></i></div></div>'+
      '<div class="v19-achs">'+ACH.map(function(a){var on=got.indexOf(a.id)>-1;
        return '<div class="v19-ach'+(on?' got':'')+'"><span class="ic">'+a.ic+'</span><div><b>'+a.n+'</b><small>'+a.d+'</small></div></div>';}).join('')+'</div>';
  }
  function renderCab(body){
    body.innerHTML='<div class="v18-subnav" id="v19cabNav">'+
      '<button data-s="v19chans">📺 Каналы</button><button data-s="v19dyn">📈 Динамика</button>'+
      '<button data-s="v19rep">📄 Отчёт</button><button data-s="v19ach">🏆 Ачивки</button><button data-s="v19bk">💾 Бэкап</button></div>'+
      '<div class="v18-sec" id="v19chans"><div class="v18-h"><b>📺 Мои каналы</b><small>все аудиты под рукой — переключайся в один клик</small></div><div id="v19chansBox">'+chanCards()+'</div></div>'+
      '<div class="v18-sec" id="v19dyn"><div class="v18-h"><b>📈 Динамика канала</b><small>что изменилось между аудитами</small></div><div id="v19dynBox">'+dynHtml()+'</div></div>'+
      '<div class="v18-sec" id="v19rep"><div class="v18-h"><b>📄 Отчёт для клиента</b><small>брендированный аудит VioraMedia</small></div>'+
        '<div class="v16-note" style="margin-bottom:12px">Собирает фирменный отчёт из живых данных: индекс, метрики против рынка с вердиктами, утечки, формула хита, топ-ролики и план на неделю. «Скачать PDF» открывает печать — выбери «Сохранить как PDF». «Режим клиента» — чистый полноэкранный показ для созвона, без внутренних инструментов.</div>'+
        '<div class="v16-row"><button class="v16-btn" id="v19pdfBtn">📄 Скачать PDF</button><button class="v16-btn ghost" id="v19cliBtn">🖥 Режим клиента</button></div></div>'+
      '<div class="v18-sec" id="v19ach"><div class="v18-h"><b>🏆 Ачивки продюсера</b><small>прогресс твоей дисциплины</small></div><div id="v19achBox">'+achHtml()+'</div></div>'+
      '<div class="v18-sec" id="v19bk"><div class="v18-h"><b>💾 Бэкап данных</b><small>все аудиты, планы и настройки — одним файлом</small></div>'+
        '<div class="v16-note" style="margin-bottom:12px">Всё хранится в памяти браузера: очистка истории или смена устройства сотрёт аудиты и календари. Скачай копию — и восстановишь всё за 5 секунд на любом компьютере.</div>'+
        '<div class="v16-row"><button class="v16-btn" id="v19expBtn">💾 Скачать бэкап</button><button class="v16-btn ghost" id="v19impBtn">📥 Загрузить бэкап</button>'+
        '<input type="file" id="v19impFile" accept="application/json" style="display:none"></div></div>';
    q('#v19cabNav',body).addEventListener('click',function(e){
      var b=e.target.closest('button[data-s]');if(!b)return;
      var el=q('#'+b.getAttribute('data-s'),body);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
    q('#v19chansBox',body).addEventListener('click',function(e){
      var b=e.target.closest('[data-open]');if(!b)return;
      var entry=hist()[+b.getAttribute('data-open')];if(!entry)return;
      try{
        Z.openAudit(entry);
        setTimeout(function(){if(W.v16HqOpen)W.v16HqOpen('cab');},350);
      }catch(err){toast('Не получилось открыть канал: '+((err&&err.message)||err));}
    });
    q('#v19dynBox',body).addEventListener('click',function(e){
      var b=e.target.closest('button[data-m]');if(!b)return;
      Z._dynMode=b.getAttribute('data-m');q('#v19dynBox',body).innerHTML=dynHtml();
    });
    q('#v19pdfBtn',body).addEventListener('click',printReport);
    q('#v19cliBtn',body).addEventListener('click',openReport);
    q('#v19expBtn',body).addEventListener('click',exportAll);
    var fi=q('#v19impFile',body);
    q('#v19impBtn',body).addEventListener('click',function(){fi.click();});
    fi.addEventListener('change',function(){if(fi.files&&fi.files[0]&&confirm('Восстановить данные из бэкапа? Текущие данные будут перезаписаны.'))importAll(fi.files[0]);fi.value='';});
  }
  V.regTab({id:'cab',ic:'💼',name:'Кабинет'},renderCab);
  if(C.regTool)C.regTool({id:'v19cab',ic:'💼',name:'Кабинет продюсера',d:'Все каналы клиентов, динамика между аудитами, брендированный PDF-отчёт, режим показа клиенту и бэкап данных',fn:function(){W.v16HqOpen('cab');},hub:true});
}
boot();
})();
