(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var num=V30.num, med=V30.median, clamp=V30.clamp, tokenize=V30.tokenize, pctRank=V30.pctRank;
  var vViews=V30.vViews, vVpd=V30.vVpd, vTitle=V30.vTitle, vDate=V30.vDate;

  /* ---------- title heuristics (CTR-oriented) ---------- */
  var POWER=("секрет шок никогда всегда лучший худший простой быстро бесплатно как почему топ главный правда ошибка убил спас взорвал срочно новый 2024 2025 гайд разбор честно проверил").split(/\s+/);
  V30.titleScore=function(title){
    var t=(title||'').trim(); var low=t.toLowerCase(); var s=0; var tips=[];
    var len=t.length;
    if(len>=30&&len<=60){ s+=25; } else if(len<30){ s+=10; tips.push('заголовок коротковат (<30) — добавьте конкретику'); } else { s+=8; tips.push('длинный (>60) — обрежется в выдаче'); }
    if(/\d/.test(t)){ s+=20; } else tips.push('добавьте число (год, «5 способов»)');
    if(/[\[\(\|►▶]|»|«/.test(t)){ s+=10; } else tips.push('добавьте скобки/разделитель для акцента');
    var pw=POWER.filter(function(w){return low.indexOf(w)>=0;}).length; if(pw){ s+=Math.min(20,pw*10); } else tips.push('добавьте «силовое» слово (секрет/как/топ)');
    var emo=(t.match(/\p{Extended_Pictographic}/gu)||[]).length; if(emo>=1&&emo<=2){ s+=10; } else if(emo>2){ tips.push('многовато эмодзи'); }
    if(/[A-ZА-Я]{4,}/.test(t)){ s+=5; }
    if(/[?!]/.test(t)){ s+=10; } else tips.push('добавьте вопрос/восклицание');
    return { score:Math.min(100,s), len:len, tips:tips };
  };

  /* ============================================================
     1) SEO AUDIT — titles/descriptions + underused keywords
     ============================================================ */
  V30.seoAudit=function(vids){
    vids=vids||[]; var n=vids.length||1;
    var scores=vids.map(function(v){return V30.titleScore(vTitle(v)).score;});
    var lens=vids.map(function(v){return vTitle(v).length;});
    var withNum=vids.filter(function(v){return /\d/.test(vTitle(v));}).length;
    var withDesc=vids.filter(function(v){return (v.description||'').length>=100;}).length;
    // keyword leverage: words that appear in HIGH-vpd titles but rarely overall (opportunity)
    var medVpd=med(vids.map(vVpd))||1;
    var top=vids.filter(function(v){return vVpd(v)>=medVpd;});
    var df={}, dfTop={};
    vids.forEach(function(v){ tokenize(vTitle(v)).forEach(function(w){df[w]=(df[w]||0)+1;}); });
    top.forEach(function(v){ tokenize(vTitle(v)).forEach(function(w){dfTop[w]=(dfTop[w]||0)+1;}); });
    var winners=Object.keys(dfTop).map(function(w){ var lift=(dfTop[w]/top.length)/((df[w]/vids.length)||1); return {kw:w, inTop:dfTop[w], total:df[w], lift:+lift.toFixed(2)}; })
      .filter(function(x){return x.inTop>=2 && x.lift>=1.1;}).sort(function(a,b){return b.lift-a.lift;}).slice(0,12);
    return {
      avgTitleScore:Math.round(med(scores)),
      avgTitleLen:Math.round(med(lens)),
      numericTitlePct:Math.round(withNum/n*100),
      richDescPct:Math.round(withDesc/n*100),
      winningKeywords:winners,
      worstTitles:vids.map(function(v){return {title:vTitle(v),score:V30.titleScore(vTitle(v)).score};}).sort(function(a,b){return a.score-b.score;}).slice(0,5)
    };
  };

  /* ============================================================
     2) BEST PUBLISH TIMES — weekday x hour performance
     ============================================================ */
  var WD=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
  V30.bestTimes=function(vids){
    var byDay={}, byHour={};
    (vids||[]).forEach(function(v){ var d=vDate(v); if(!d)return; var dt=new Date(d); if(isNaN(dt))return; var wd=dt.getDay(), hr=dt.getHours();
      (byDay[wd]=byDay[wd]||[]).push(vVpd(v)); (byHour[hr]=byHour[hr]||[]).push(vVpd(v)); });
    function rank(map,labelFn){ return Object.keys(map).map(function(k){return {key:+k,label:labelFn(+k),medVpd:Math.round(med(map[k])),n:map[k].length};}).sort(function(a,b){return b.medVpd-a.medVpd;}); }
    var days=rank(byDay,function(k){return WD[k];});
    var hours=rank(byHour,function(k){return (k<10?'0':'')+k+':00';});
    return { byDay:days, byHour:hours, bestDay:days[0]||null, bestHour:hours[0]||null };
  };

  /* ============================================================
     3) GAP ANALYSIS — high-ROI niche topics you don't cover
     ============================================================ */
  V30.gapAnalysis=function(myVids, competitors){
    var mine={}; (myVids||[]).forEach(function(v){ tokenize(vTitle(v)).forEach(function(w){mine[w]=1;}); });
    var compVids=[]; (competitors||[]).forEach(function(c){ (c.vids||c.videos||[]).forEach(function(v){compVids.push(v);}); });
    var med0=med(compVids.map(vVpd))||1;
    var agg={};
    compVids.forEach(function(v){ var vpd=vVpd(v); tokenize(vTitle(v)).forEach(function(w){ (agg[w]=agg[w]||{kw:w,count:0,vpd:[]}); agg[w].count++; agg[w].vpd.push(vpd); }); });
    var gaps=Object.keys(agg).filter(function(w){return !mine[w] && agg[w].count>=2;})
      .map(function(w){ var a=agg[w]; return {kw:w, competitorVideos:a.count, medVpd:Math.round(med(a.vpd)), roi:+(med(a.vpd)/med0).toFixed(2)}; })
      .filter(function(x){return x.roi>=1.0;}).sort(function(a,b){return b.roi-a.roi;}).slice(0,15);
    return { nicheMedVpd:Math.round(med0), gaps:gaps };
  };

  /* ============================================================
     4) HISTORY DELTA — compare current score with stored snapshots
     ============================================================ */
  V30.historyDelta=function(currentScore, history){
    history=(history||[]).filter(function(h){return h&&typeof h.score==='number';});
    if(!history.length) return { current:currentScore, prev:null, delta:null, trend:'нет истории', points:[] };
    var prev=history[history.length-1];
    var first=history[0];
    return {
      current:currentScore, prev:prev.score, delta:currentScore-prev.score,
      sinceFirst: currentScore-first.score,
      trend: currentScore>prev.score?'рост':(currentScore<prev.score?'спад':'стабильно'),
      points: history.map(function(h){return {t:h.t||h.date||'', score:h.score};}).concat([{t:'сейчас',score:currentScore}])
    };
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};

  /* 30-day content plan from analytics pack */
  V30.contentPlan=async function(ctx){
    var schema={type:'object',required:['plan'],properties:{plan:{type:'array',items:{type:'object'}}}};
    var msg=[
      {role:'system',content:'Ты продюсер YouTube. Составь контент-план на 30 дней (8–12 видео). Используй темы с высоким ROI, gap-анализ ниши и запросы аудитории. Верни JSON {plan:[{idea,format,topic,whyNow,expectedVpd}]}. Конкретно, на русском.'},
      {role:'user',content:'Данные канала (JSON):\n'+JSON.stringify(ctx).slice(0,11000)}
    ];
    return await V30.mistralJSON(msg, schema, {temperature:0.6});
  };

  /* A/B title variants for a topic, scored by built-in heuristic */
  V30.titleVariants=async function(topic, examples){
    var schema={type:'object',required:['variants'],properties:{variants:{type:'array',items:{type:'string'}}}};
    var msg=[
      {role:'system',content:'Ты копирайтер YouTube-заголовков. Дай 6 кликабельных вариантов заголовка (RU): с числом, интригой, пользой, без чистого кликбейта. Верни JSON {variants:[".."]}'},
      {role:'user',content:'Тема: '+topic+(examples&&examples.length?'\nУспешные примеры с канала:\n- '+examples.slice(0,5).join('\n- '):'')}
    ];
    var r=await V30.mistralJSON(msg, schema, {temperature:0.8});
    var vars=(r&&r.variants)||[];
    return { variants: vars.map(function(t){ return { title:t, score:V30.titleScore(t).score, tips:V30.titleScore(t).tips }; }).sort(function(a,b){return b.score-a.score;}) };
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var esc=V30.esc||function(s){return s;}, fmt=V30.fmt||function(n){return n;};

  /* ---------- HTML builders ---------- */
  V30.html_seo=function(s){ if(!s)return '';
    var win=(s.winningKeywords||[]).slice(0,10).map(function(w){return '<tr><td>'+esc(w.kw)+'</td><td>'+w.inTop+'/'+w.total+'</td><td class="v30-up">'+w.lift+'x</td></tr>';}).join('');
    var worst=(s.worstTitles||[]).map(function(w){return '<li>['+w.score+'] '+esc(w.title)+'</li>';}).join('');
    return '<div class="v30-card"><h3>SEO-аудит</h3><div class="v30-ci">Средний скор заголовка <b>'+s.avgTitleScore+'/100</b> · длина '+s.avgTitleLen+' · с числом '+s.numericTitlePct+'% · подробные описания '+s.richDescPct+'%</div>'+
      '<h4>Выигрышные ключевые слова</h4><table class="v30-tbl"><thead><tr><th>Ключ</th><th>в топе</th><th>lift</th></tr></thead><tbody>'+(win||'<tr><td colspan=3>—</td></tr>')+'</tbody></table>'+
      '<h4>Слабые заголовки</h4><ul class="v30-list">'+(worst||'<li>—</li>')+'</ul></div>'; };

  V30.html_times=function(t){ if(!t)return '';
    var d=(t.byDay||[]).map(function(x){return '<tr><td>'+esc(x.label)+'</td><td>'+fmt(x.medVpd)+'</td><td>'+x.n+'</td></tr>';}).join('');
    var h=(t.byHour||[]).slice(0,6).map(function(x){return '<tr><td>'+esc(x.label)+'</td><td>'+fmt(x.medVpd)+'</td><td>'+x.n+'</td></tr>';}).join('');
    return '<div class="v30-card"><h3>Лучшее время публикации</h3><div class="v30-ci">Топ-день: <b>'+(t.bestDay?esc(t.bestDay.label)+' ('+fmt(t.bestDay.medVpd)+'/дн)':'—')+'</b> · топ-час: <b>'+(t.bestHour?esc(t.bestHour.label):'—')+'</b></div>'+
      '<div style="display:flex;gap:14px;flex-wrap:wrap"><div><h4>По дням</h4><table class="v30-tbl"><thead><tr><th>День</th><th>медVPD</th><th>n</th></tr></thead><tbody>'+d+'</tbody></table></div>'+
      '<div><h4>По часам (топ-6)</h4><table class="v30-tbl"><thead><tr><th>Час</th><th>медVPD</th><th>n</th></tr></thead><tbody>'+h+'</tbody></table></div></div></div>'; };

  V30.html_gap=function(g){ if(!g)return '';
    var rows=(g.gaps||[]).map(function(x){return '<tr><td>'+esc(x.kw)+'</td><td>'+x.competitorVideos+'</td><td>'+fmt(x.medVpd)+'</td><td class="v30-up">'+x.roi+'x</td></tr>';}).join('');
    return '<div class="v30-card"><h3>Gap-анализ ниши</h3><div class="v30-ci">Темы конкурентов с высоким ROI, которых у вас нет (медиана ниши '+fmt(g.nicheMedVpd)+'/дн)</div>'+
      '<table class="v30-tbl"><thead><tr><th>Тема</th><th>видео у конк.</th><th>медVPD</th><th>ROI</th></tr></thead><tbody>'+(rows||'<tr><td colspan=4>нет данных по конкурентам</td></tr>')+'</tbody></table></div>'; };

  V30.html_history=function(h){ if(!h)return '';
    var d=h.delta==null?'—':(h.delta>0?'+'+h.delta:''+h.delta);
    return '<div class="v30-card"><h3>Динамика оценки</h3><div class="v30-ci">Сейчас <b>'+h.current+'</b> · прошлый замер '+(h.prev==null?'—':h.prev)+' · изменение <b class="'+(h.delta>0?'v30-up':(h.delta<0?'v30-down':''))+'">'+d+'</b> · тренд '+esc(h.trend)+'</div></div>'; };

  V30.html_plan=function(p){ if(!p||!p.plan)return '';
    var rows=p.plan.map(function(x){return '<tr><td>'+esc(x.idea)+'</td><td>'+esc(x.format||'')+'</td><td>'+esc(x.whyNow||'')+'</td><td>'+fmt(x.expectedVpd||0)+'</td></tr>';}).join('');
    return '<div class="v30-card"><h3>Контент-план на 30 дней</h3><table class="v30-tbl"><thead><tr><th>Идея</th><th>Формат</th><th>Почему сейчас</th><th>~VPD</th></tr></thead><tbody>'+rows+'</tbody></table></div>'; };

  V30.html_titles=function(t){ if(!t||!t.variants)return '';
    var rows=t.variants.map(function(v){return '<li>['+v.score+'] '+esc(v.title)+(v.tips&&v.tips.length?' <em style="color:#888">— '+esc(v.tips[0])+'</em>':'')+'</li>';}).join('');
    return '<div class="v30-card"><h3>A/B заголовки</h3><ul class="v30-list">'+rows+'</ul></div>'; };

  /* ---------- compute + render growth section ---------- */
  V30._growth=null;
  V30.runGrowth=function(){
    var body=document.getElementById('v30-body'); var vids=V30.collectVideos(); if(!vids.length){alert('Сначала аудит канала.');return;}
    var S=(window.STATE||{}); var comps=V30.collectCompetitors();
    var seo=V30.seoAudit(vids); var times=V30.bestTimes(vids);
    var gap=comps.length?V30.gapAnalysis(vids,comps):{nicheMedVpd:0,gaps:[]};
    var curScore=(V30._last&&V30._last.sb.score)||V30.scoreBreakdown(S.channel||{},vids).score;
    var hist=[]; try{ var raw=localStorage.getItem('v30hist:'+(S.channel&&S.channel.id||'x')); hist=raw?JSON.parse(raw):[]; }catch(e){}
    var hd=V30.historyDelta(curScore, hist);
    // persist snapshot
    try{ hist.push({t:new Date().toISOString().slice(0,10),score:curScore}); if(hist.length>60)hist=hist.slice(-60); localStorage.setItem('v30hist:'+(S.channel&&S.channel.id||'x'),JSON.stringify(hist)); }catch(e){}
    V30._growth={seo:seo,times:times,gap:gap,history:hd};
    var html=V30.html_history(hd)+V30.html_seo(seo)+V30.html_times(times)+V30.html_gap(gap);
    var holder=document.createElement('div'); holder.id='v30-growth'; holder.innerHTML=html;
    var old=document.getElementById('v30-growth'); if(old)old.remove();
    if(body)body.appendChild(holder);
  };

  V30.runPlan=async function(){
    var body=document.getElementById('v30-body'); var vids=V30.collectVideos(); if(!vids.length){alert('Сначала аудит.');return;}
    if(!V30._growth)V30.runGrowth();
    var note=document.createElement('div');note.className='v30-load';note.textContent='AI готовит контент-план…';if(body)body.appendChild(note);
    try{ var cl=(V30._last&&V30._last.cl)||V30.clusterTopics(vids);
      var ctx={topROI:cl.topics.slice(0,8),gaps:V30._growth.gap.gaps,winningKeywords:V30._growth.seo.winningKeywords};
      var p=await V30.contentPlan(ctx); note.remove();
      var d=document.createElement('div');d.innerHTML=V30.html_plan(p);if(body)body.appendChild(d);
      V30._growth.plan=p; }catch(e){note.textContent='Ошибка плана: '+e.message;}
  };

  V30.runTitles=async function(){
    var body=document.getElementById('v30-body'); var vids=V30.collectVideos(); if(!vids.length){alert('Сначала аудит.');return;}
    var topic=prompt('Тема для A/B заголовков:', (V30._last&&V30._last.cl&&V30._last.cl.topics[0]&&V30._last.cl.topics[0].topic)||'');
    if(!topic)return;
    var note=document.createElement('div');note.className='v30-load';note.textContent='AI генерит заголовки…';if(body)body.appendChild(note);
    try{ var ex=vids.slice().sort(function(a,b){return V30.vVpd(b)-V30.vVpd(a);}).slice(0,5).map(V30.vTitle);
      var t=await V30.titleVariants(topic,ex); note.remove();
      var d=document.createElement('div');d.innerHTML=V30.html_titles(t);if(body)body.appendChild(d); }catch(e){note.textContent='Ошибка: '+e.message;}
  };

  /* ---------- Markdown report export ---------- */
  V30.buildReport=function(){
    var L=V30._last||{}; var G=V30._growth||{}; var lines=[];
    var S=(window.STATE||{}); var ch=S.channel||{};
    lines.push('# Аналитический отчёт — '+(ch.title||'YouTube-канал'));
    lines.push('_'+new Date().toLocaleString('ru-RU')+'_\n');
    if(L.sb){ lines.push('## Оценка: '+L.sb.score+'/100  (интервал '+L.sb.ci[0]+'–'+L.sb.ci[1]+', уверенность '+L.sb.confidence+'%)');
      L.sb.factors.forEach(function(f){lines.push('- '+f.label+': '+f.score+'/100 ('+f.points+' баллов)');}); lines.push(''); }
    if(L.tr){ lines.push('## Динамика'); lines.push('Моментум: **'+L.tr.momentum+'**'); (L.tr.breakouts||[]).slice(0,5).forEach(function(b){lines.push('- «выстрел» '+b.x+'x: '+b.title);}); lines.push(''); }
    if(L.cl){ lines.push('## Темы (ROI)'); L.cl.topics.slice(0,8).forEach(function(t){lines.push('- '+t.topic+': ROI '+t.roi+'x ('+t.videos+' видео)');}); lines.push(''); }
    if(G.seo){ lines.push('## SEO'); lines.push('Средний скор заголовка: '+G.seo.avgTitleScore+'/100; с числом '+G.seo.numericTitlePct+'%');
      lines.push('Выигрышные ключи: '+G.seo.winningKeywords.slice(0,8).map(function(w){return w.kw+'('+w.lift+'x)';}).join(', ')); lines.push(''); }
    if(G.times&&G.times.bestDay){ lines.push('## Тайминг'); lines.push('Лучший день: '+G.times.bestDay.label+'; лучший час: '+(G.times.bestHour?G.times.bestHour.label:'—')); lines.push(''); }
    if(G.gap&&G.gap.gaps.length){ lines.push('## Gap-анализ'); G.gap.gaps.slice(0,8).forEach(function(g){lines.push('- '+g.kw+': ROI '+g.roi+'x ('+g.competitorVideos+' видео у конкурентов)');}); lines.push(''); }
    if(G.plan&&G.plan.plan){ lines.push('## Контент-план'); G.plan.plan.forEach(function(p,i){lines.push((i+1)+'. '+p.idea+' ['+(p.format||'')+'] — '+(p.whyNow||''));}); lines.push(''); }
    lines.push('---\n_Сгенерировано Viora V30/V31_');
    return lines.join('\n');
  };
  V30.exportReport=function(){
    var md=V30.buildReport(); var blob=new Blob([md],{type:'text/markdown;charset=utf-8'}); var a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='viora-report-'+Date.now()+'.md'; a.click();
  };

  /* ---------- inject extra buttons into the modal toolbar ---------- */
  var _origOpen=V30.open;
  V30.open=function(){ _origOpen&&_origOpen.call(V30); try{ V30._injectBtns(); }catch(e){console.warn('v31 btns',e);} };
  V30._injectBtns=function(){
    var bar=document.querySelector('#v30-modal .v30-btns'); if(!bar||document.getElementById('v31-growth-btn'))return;
    function mk(id,label,fn){ var b=document.createElement('button'); b.id=id; b.textContent=label; b.onclick=fn; bar.appendChild(b); }
    mk('v31-growth-btn','📈 Рост (SEO/тайминг/gap)',function(){V30.runGrowth();});
    mk('v31-plan-btn','🗓 План 30 дней',function(){V30.runPlan();});
    mk('v31-titles-btn','✏ A/B заголовки',function(){V30.runTitles();});
    mk('v31-report-btn','⬇ Отчёт MD',function(){V30.exportReport();});
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();
