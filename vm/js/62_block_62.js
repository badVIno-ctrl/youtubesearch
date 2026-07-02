(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};
  var num=V30.num, med=V30.median, tokenize=V30.tokenize, vViews=V30.vViews, vVpd=V30.vVpd, vTitle=V30.vTitle;

  /* ---------- niche keywords from a video set ---------- */
  V32.extractNicheKeywords=function(vids, topN){
    topN=topN||6; var df={};
    (vids||[]).forEach(function(v){ Array.from(new Set(tokenize(vTitle(v)))).forEach(function(w){df[w]=(df[w]||0)+1;}); });
    return Object.keys(df).filter(function(w){return df[w]>=2 && w.length>=4;})
      .sort(function(a,b){return df[b]-df[a];}).slice(0,topN);
  };

  /* ---------- parsers for search responses ---------- */
  V32.parseSearchChannels=function(json){
    return ((json&&json.items)||[]).map(function(it){
      var id=(it.id&&(it.id.channelId))||it.snippet&&it.snippet.channelId;
      var s=it.snippet||{};
      return { channelId:id, title:s.channelTitle||s.title, desc:s.description||'' };
    }).filter(function(c){return c.channelId;});
  };
  V32.parseSearchVideos=function(json){
    return ((json&&json.items)||[]).map(function(it){
      var s=it.snippet||{};
      return { videoId:(it.id&&it.id.videoId), channelId:s.channelId, channelTitle:s.channelTitle, title:s.title, publishedAt:s.publishedAt };
    }).filter(function(v){return v.videoId;});
  };
  V32.parseChannelStats=function(json){
    return ((json&&json.items)||[]).map(function(it){
      var st=it.statistics||{}, s=it.snippet||{}, cd=it.contentDetails||{};
      return { channelId:it.id, title:s.title, subs:num(st.subscriberCount), totalViews:num(st.viewCount), videoCount:num(st.videoCount),
        country:s.country||'', publishedAt:s.publishedAt, uploads:(cd.relatedPlaylists&&cd.relatedPlaylists.uploads)||'', desc:s.description||'' };
    });
  };

  /* ---------- language heuristic ---------- */
  V32.detectLang=function(text){ text=(text||''); var cyr=(text.match(/[а-яё]/gi)||[]).length, lat=(text.match(/[a-z]/gi)||[]).length; if(cyr+lat<3)return 'unknown'; return cyr>=lat?'ru':'en'; };

  /* ---------- competitor relevance scoring ---------- */
  // cand: {channelId,title,subs,desc, sharedKw} ; ctx:{keywords[], mySubs, lang, recentOk}
  V32.scoreCompetitor=function(cand, ctx){
    ctx=ctx||{}; var s=0, parts={};
    // topic overlap
    var ck=tokenize((cand.title||'')+' '+(cand.desc||''));
    var shared=(ctx.keywords||[]).filter(function(w){return ck.indexOf(w)>=0;}).length;
    parts.topic=Math.min(40, shared*12 + (cand.sharedKw||0)*6); s+=parts.topic;
    // size proximity (closer to mySubs = better); if no mySubs, prefer mid-size
    if(ctx.mySubs){ var r=cand.subs>0? Math.max(cand.subs,ctx.mySubs)/Math.max(1,Math.min(cand.subs,ctx.mySubs)) : 99; parts.size=Math.max(0,30-(r-1)*6); }
    else { parts.size = cand.subs>=2000 && cand.subs<=2000000 ? 22 : 8; }
    s+=parts.size;
    // language match
    var lng=V32.detectLang((cand.title||'')+' '+(cand.desc||'')); parts.lang=(ctx.lang&&lng!=='unknown')?(lng===ctx.lang?15:0):8; s+=parts.lang;
    // activity
    parts.activity=cand.recentOk?15:0; s+=parts.activity;
    return { score:Math.round(s), parts:parts, lang:lng };
  };

  /* ---------- filter + dedup + rank ---------- */
  V32.rankCompetitors=function(cands, ctx, max){
    max=max||8; ctx=ctx||{};
    var self=ctx.selfChannelId;
    var seen={}, out=[];
    cands.forEach(function(c){
      if(!c.channelId||c.channelId===self||seen[c.channelId])return;
      // size band filter
      if(ctx.subsMin && c.subs<ctx.subsMin)return;
      if(ctx.subsMax && c.subs>ctx.subsMax)return;
      // language filter (hard) if requested strict
      var sc=V32.scoreCompetitor(c, ctx);
      if(ctx.langStrict && ctx.lang && sc.lang!=='unknown' && sc.lang!==ctx.lang)return;
      seen[c.channelId]=1; out.push(Object.assign({}, c, {relevance:sc.score, relParts:sc.parts}));
    });
    return out.sort(function(a,b){return b.relevance-a.relevance;}).slice(0,max);
  };

  /* ---------- async orchestrator ---------- */
  // opts: { keywords[], seedVids[], mySubs, selfChannelId, lang, maxSearch=2, max=8, withVideos=true }
  V32.discoverCompetitors=async function(opts){
    opts=opts||{}; var maxSearch=opts.maxSearch||2, lang=opts.lang||'ru';
    var kws=opts.keywords && opts.keywords.length ? opts.keywords : V32.extractNicheKeywords(opts.seedVids||[], 6);
    if(!kws.length) return { keywords:[], competitors:[], note:'нет ключевых слов для поиска' };
    var candMap={}; // channelId -> {channelId,title,sharedKw}
    // 1) channel search by joined niche query (cheapest count of search calls)
    var q=encodeURIComponent(kws.slice(0,4).join(' '));
    try{
      var chJson=await V30.ytFetch('search?part=snippet&type=channel&maxResults=25&relevanceLanguage='+lang+'&q='+q);
      V32.parseSearchChannels(chJson).forEach(function(c){ candMap[c.channelId]=candMap[c.channelId]||{channelId:c.channelId,title:c.title,desc:c.desc,sharedKw:0}; });
    }catch(e){}
    // 2) video search by niche -> collect channels (1 extra search) if budget allows
    if(maxSearch>=2){
      try{
        var vJson=await V30.ytFetch('search?part=snippet&type=video&order=viewCount&maxResults=25&relevanceLanguage='+lang+'&q='+q);
        V32.parseSearchVideos(vJson).forEach(function(v){ var c=candMap[v.channelId]=candMap[v.channelId]||{channelId:v.channelId,title:v.channelTitle,desc:'',sharedKw:0}; c.sharedKw++; });
      }catch(e){}
    }
    var ids=Object.keys(candMap); if(!ids.length) return { keywords:kws, competitors:[], note:'кандидаты не найдены' };
    // 3) enrich with channel stats (cheap, batched 50)
    var stats={};
    for(var i=0;i<ids.length;i+=50){
      var batch=ids.slice(i,i+50).join(',');
      try{ var sJson=await V30.ytFetch('channels?part=snippet,statistics,contentDetails&id='+batch); V32.parseChannelStats(sJson).forEach(function(s){ stats[s.channelId]=s; }); }catch(e){}
    }
    var cands=ids.map(function(id){ var c=candMap[id], st=stats[id]||{}; return { channelId:id, title:st.title||c.title, subs:st.subs||0, desc:st.desc||c.desc, uploads:st.uploads||'', sharedKw:c.sharedKw, recentOk:true }; });
    var ctx={ keywords:kws, mySubs:opts.mySubs, selfChannelId:opts.selfChannelId, lang:lang, subsMin:opts.subsMin, subsMax:opts.subsMax, langStrict:opts.langStrict };
    var ranked=V32.rankCompetitors(cands, ctx, opts.max||8);
    return { keywords:kws, competitors:ranked, note:ranked.length?('найдено '+ranked.length+' конкурентов'):'после фильтров пусто' };
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();



(function(){
  "use strict";
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};
  var _mem=null; var KEY='v32:profile';
  function store(){ try{ return (typeof localStorage!=='undefined')?localStorage:null; }catch(e){ return null; } }

  V32.defaultProfile=function(){
    return { hasChannel:null, channelUrl:'', niche:'', subNiche:'', audience:'', lang:'ru',
      format:'both', goal:'growth', references:[], updatedAt:null };
  };

  V32.validateProfile=function(p){
    p=p||{}; var errors=[];
    if(p.hasChannel===null||p.hasChannel===undefined) errors.push('Укажите, есть ли канал');
    if(!p.niche || (''+p.niche).trim().length<2) errors.push('Укажите нишу');
    if(p.hasChannel===true && !(p.channelUrl||'').trim()) errors.push('Укажите ссылку/название канала');
    if(['shorts','long','both'].indexOf(p.format)<0) errors.push('Некорректный формат');
    if(['growth','views','money','authority'].indexOf(p.goal)<0) errors.push('Некорректная цель');
    return { ok:errors.length===0, errors:errors };
  };

  V32.setProfile=function(p){
    var base=V32.getProfile()||V32.defaultProfile();
    var merged=Object.assign({}, base, p||{});
    if(typeof merged.references==='string') merged.references=merged.references.split(/[,\n]/).map(function(s){return s.trim();}).filter(Boolean);
    merged.updatedAt=new Date().toISOString();
    var s=store(); if(s){ try{ s.setItem(KEY, JSON.stringify(merged)); }catch(e){ _mem=merged; } } else _mem=merged;
    return merged;
  };

  V32.getProfile=function(){
    var s=store(); if(s){ try{ var raw=s.getItem(KEY); if(raw) return JSON.parse(raw); }catch(e){} }
    return _mem;
  };

  V32.clearProfile=function(){ var s=store(); if(s){ try{ s.removeItem(KEY); }catch(e){} } _mem=null; };

  V32.hasChannel=function(){ var p=V32.getProfile(); if(p&&p.hasChannel!=null) return !!p.hasChannel; var S=(typeof window!=='undefined'&&window.STATE)||{}; return !!(S.channel && ((S.longs&&S.longs.length)||(S.shorts&&S.shorts.length))); };

  /* build a compact context object for AI prompts */
  V32.profileContext=function(){
    var p=V32.getProfile()||V32.defaultProfile();
    var goalMap={growth:'рост подписчиков',views:'максимум просмотров',money:'монетизация',authority:'экспертность/бренд'};
    var fmtMap={shorts:'Shorts',long:'длинные видео',both:'Shorts + длинные'};
    return { niche:p.niche, subNiche:p.subNiche, audience:p.audience, lang:p.lang,
      format:fmtMap[p.format]||p.format, goal:goalMap[p.goal]||p.goal, references:p.references||[], hasChannel:!!p.hasChannel };
  };

  /* niche keywords seed when there's no channel (from profile text) */
  V32.profileKeywords=function(){
    var p=V32.getProfile()||{}; var V30=(typeof window!=='undefined'&&window.V30)||{};
    var tok=V30.tokenize||function(s){return (s||'').toLowerCase().split(/\s+/).filter(function(w){return w.length>=4;});};
    var words=tok((p.niche||'')+' '+(p.subNiche||''));
    return Array.from(new Set(words)).slice(0,6);
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};
  var num=V30.num, med=V30.median, pct=V30.pct, std=V30.std, vViews=V30.vViews, vVpd=V30.vVpd, vEng=V30.vEng, vTitle=V30.vTitle;

  /* fetch a few recent videos for each competitor (cheap: uploads playlist) */
  V32.fetchNicheVideos=async function(competitors, perChannel){
    perChannel=perChannel||15; var all=[];
    for(var i=0;i<(competitors||[]).length;i++){
      var c=competitors[i]; if(!c.channelId)continue;
      try{
        var vids=await V30.fetchUploadsDeep(c.channelId, perChannel);
        await V30.enrichStats(vids);
        vids.forEach(function(v){ v.channelId=c.channelId; v.channelTitle=c.title; });
        all=all.concat(vids);
      }catch(e){}
    }
    return all;
  };

  /* ============================================================
     NICHE SCAN — demand map, entry bar, competition level, windows
     ============================================================ */
  V32.nicheScan=function(nicheVids, competitors){
    nicheVids=(nicheVids||[]).filter(function(v){return vViews(v)>=0;});
    var n=nicheVids.length;
    var vpd=nicheVids.map(vVpd), eng=nicheVids.map(vEng);
    var entryBar={ medVpd:Math.round(med(vpd)), p25:Math.round(pct(vpd,.25)), p75:Math.round(pct(vpd,.75)), topDecile:Math.round(pct(vpd,.9)), medEng:+med(eng).toFixed(3) };
    // demand map = topic clustering with ROI
    var demand=(V30.clusterTopics?V30.clusterTopics(nicheVids,{topK:14}):{topics:[]});
    // competition per topic: how many channels cover it (lower = window)
    var chByTopic={}; var tok=V30.tokenize||function(){return [];};
    nicheVids.forEach(function(v){ var ch=v.channelId||'?'; Array.from(new Set(tok(vTitle(v)))).forEach(function(w){ (chByTopic[w]=chByTopic[w]||{}); chByTopic[w][ch]=1; }); });
    (demand.topics||[]).forEach(function(t){ t.channels=chByTopic[t.topic]?Object.keys(chByTopic[t.topic]).length:0; t.competition=t.channels; t.opportunity=+((t.roi||1)/Math.max(1,t.channels)).toFixed(2); });
    var windows=(demand.topics||[]).slice().sort(function(a,b){return b.opportunity-a.opportunity;}).slice(0,8);
    // saturation: unique channels & dispersion of views
    var chans={}; nicheVids.forEach(function(v){chans[v.channelId||v.channelTitle||'?']=1;});
    var chanCount=Object.keys(chans).length;
    var disp = med(vpd)>0 ? +(std(vpd)/med(vpd)).toFixed(2) : 0;
    var saturation = chanCount>40?'высокая':(chanCount>=15?'средняя':'низкая');
    // momentum of niche
    var tr=(V30.trends?V30.trends(nicheVids):{momentum:'—'});
    return {
      sample:n, channels:chanCount, saturation:saturation, dispersion:disp,
      entryBar:entryBar, momentum:tr.momentum,
      demandTop:(demand.topics||[]).slice(0,10),
      opportunityWindows:windows,
      competitors:(competitors||[]).slice(0,8).map(function(c){return {title:c.title,subs:c.subs,relevance:c.relevance};})
    };
  };

  /* potential score for a blogger entering the niche (0..100) */
  V32.nichePotential=function(scan, profile){
    if(!scan)return null; var s=0, parts={};
    parts.demand = Math.min(35, Math.round((scan.entryBar.topDecile/Math.max(1,scan.entryBar.medVpd))*10)); // upside vs median
    parts.openness = scan.saturation==='низкая'?30:(scan.saturation==='средняя'?20:10);
    parts.momentum = scan.momentum==='рост'?20:(scan.momentum==='ровно'?12:5);
    parts.windows = Math.min(15, (scan.opportunityWindows||[]).filter(function(w){return w.opportunity>=1;}).length*3);
    s=parts.demand+parts.openness+parts.momentum+parts.windows;
    return { score:Math.min(100,Math.round(s)), parts:parts,
      verdict: s>=70?'отличная ниша для входа':(s>=45?'ниша рабочая, нужен сильный угол':'высокая конкуренция — только с дифференциацией') };
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};

  /* gap for no-channel = all hot niche topics ranked by opportunity */
  V32.adaptGapForNiche=function(scan){
    if(!scan)return {nicheMedVpd:0,gaps:[]};
    return { nicheMedVpd:scan.entryBar.medVpd,
      gaps:(scan.opportunityWindows||[]).map(function(w){ return { kw:w.topic, competitorVideos:w.videos, medVpd:w.medVpd, roi:w.roi, competition:w.channels, opportunity:w.opportunity }; }) };
  };
  /* benchmark for no-channel = market percentiles (no "me") */
  V32.adaptBenchmarkForNiche=function(scan, competitors){
    if(!scan)return null;
    return { me:null, mode:'niche',
      niche:{ medVpd:scan.entryBar.medVpd, p25:scan.entryBar.p25, p75:scan.entryBar.p75, topDecile:scan.entryBar.topDecile, medEng:scan.entryBar.medEng },
      competitors:(competitors||[]).map(function(c){return {title:c.title,subs:c.subs,medVpd:null,relevance:c.relevance};}) };
  };

  /* ============================================================
     RESOLVER — единая точка: режим, видео, конкуренты, скан ниши
     opts.forceDiscover -> всегда искать конкурентов
     ============================================================ */
  V32.getAnalysisContext=async function(opts){
    opts=opts||{}; var S=(typeof window!=='undefined'&&window.STATE)||{};
    var profile=V32.getProfile&&V32.getProfile();
    var hasCh=V32.hasChannel&&V32.hasChannel();
    var myVids=V30.collectVideos?V30.collectVideos():[].concat(S.longs||[],S.shorts||[]);
    var competitors=(S.competitors||S.comps||[]);

    // auto-discover competitors if none provided (or forced)
    if(opts.forceDiscover || !competitors.length){
      var dOpts;
      if(hasCh && myVids.length){ dOpts={ seedVids:myVids, mySubs:(S.channel&&S.channel.subs)||0, selfChannelId:(S.channel&&S.channel.id)||null, lang:(profile&&profile.lang)||'ru' }; }
      else { dOpts={ keywords:V32.profileKeywords?V32.profileKeywords():[], lang:(profile&&profile.lang)||'ru' }; }
      try{ var disc=await V32.discoverCompetitors(dOpts); competitors=disc.competitors; if(typeof window!=='undefined'){ (window.STATE=window.STATE||{}).competitors=competitors; } }catch(e){}
    }

    if(hasCh && myVids.length){
      return { mode:'channel', myVids:myVids, competitors:competitors, profile:profile };
    }
    // no channel -> niche analysis from competitors' videos
    var nicheVids=[];
    try{ nicheVids=await V32.fetchNicheVideos(competitors, opts.perChannel||15); }catch(e){}
    var scan=V32.nicheScan(nicheVids, competitors);
    return { mode:'niche', myVids:[], nicheVids:nicheVids, competitors:competitors, scan:scan, profile:profile,
      gap:V32.adaptGapForNiche(scan), benchmark:V32.adaptBenchmarkForNiche(scan, competitors), potential:V32.nichePotential(scan, profile) };
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};

  function profCtx(){ return V32.profileContext?V32.profileContext():{}; }

  /* POSITIONING — unique angle vs saturated competitors */
  V32.positioning=async function(ctx){
    var schema={type:'object',required:['angle','differentiators'],properties:{angle:{type:'string'},differentiators:{type:'array',items:{type:'string'}},avoid:{type:'array',items:{type:'string'}},tagline:{type:'string'}}};
    var msg=[
      {role:'system',content:'Ты бренд-стратег YouTube. На основе профиля блогера и насыщенных тем ниши предложи уникальный угол позиционирования. Верни JSON {angle, differentiators[], avoid[], tagline}. Конкретно, на русском.'},
      {role:'user',content:'Профиль: '+JSON.stringify(profCtx())+'\nДанные ниши: '+JSON.stringify(ctx||{}).slice(0,8000)}
    ];
    return await V30.mistralJSON(msg, schema, {temperature:0.7});
  };

  /* STARTER KIT — for bloggers with no channel yet */
  V32.starterKit=async function(ctx){
    var schema={type:'object',required:['first10','channelName','channelDescription','goal90d'],properties:{
      channelName:{type:'array',items:{type:'string'}}, channelDescription:{type:'string'},
      first10:{type:'array',items:{type:'object'}}, branding:{type:'object'}, goal90d:{type:'string'}}};
    var msg=[
      {role:'system',content:'Ты наставник YouTube-новичков. Сформируй стартовый набор: 3 варианта имени канала, описание, первые 10 видео (idea, format, hook), рекомендации по оформлению (branding: {colors, thumbnailStyle, tone}), и цель на 90 дней. Верни JSON {channelName[], channelDescription, first10[{idea,format,hook}], branding{}, goal90d}. На русском.'},
      {role:'user',content:'Профиль: '+JSON.stringify(profCtx())+'\nСпрос и окна ниши: '+JSON.stringify(ctx||{}).slice(0,8000)}
    ];
    return await V30.mistralJSON(msg, schema, {temperature:0.7});
  };

  /* LAUNCH PLAN — step-by-step from zero */
  V32.launchPlan=async function(ctx){
    var schema={type:'object',required:['phases'],properties:{phases:{type:'array',items:{type:'object'}}}};
    var msg=[
      {role:'system',content:'Ты продюсер запуска YouTube-канала с нуля. Дай поэтапный план (3–4 фазы: подготовка, запуск, рост, оптимизация) с задачами и метриками успеха. Верни JSON {phases:[{name,weeks,tasks[],successMetric}]}. На русском.'},
      {role:'user',content:'Профиль: '+JSON.stringify(profCtx())+'\nКонтекст ниши: '+JSON.stringify(ctx||{}).slice(0,7000)}
    ];
    return await V30.mistralJSON(msg, schema, {temperature:0.6});
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var V32=(typeof window!=='undefined'&&window.V32)?window.V32:{};
  var esc=V30.esc||function(s){return (s==null?'':String(s));}, fmt=V30.fmt||function(n){return ''+(n||0);};

  /* ---------- HTML builders ---------- */
  V32.html_competitors=function(disc){
    if(!disc)return '';
    var rows=(disc.competitors||[]).map(function(c){return '<tr><td>'+esc(c.title)+'</td><td>'+fmt(c.subs)+'</td><td class="v30-up">'+c.relevance+'</td></tr>';}).join('');
    return '<div class="v30-card"><h3>Конкуренты (авто)</h3><div class="v30-ci">Ключи поиска: '+esc((disc.keywords||[]).join(', '))+' · '+esc(disc.note||'')+'</div>'+
      '<table class="v30-tbl"><thead><tr><th>Канал</th><th>Подписч.</th><th>Релевантность</th></tr></thead><tbody>'+(rows||'<tr><td colspan=3>не найдено</td></tr>')+'</tbody></table></div>';
  };
  V32.html_niche=function(scan, pot){
    if(!scan)return '';
    var dem=(scan.demandTop||[]).slice(0,8).map(function(t){return '<tr><td>'+esc(t.topic)+'</td><td>'+fmt(t.medVpd)+'</td><td>'+(t.roi||'')+'x</td><td>'+(t.channels||0)+'</td></tr>';}).join('');
    var win=(scan.opportunityWindows||[]).slice(0,6).map(function(w){return '<li>'+esc(w.topic)+' — окно <b>'+w.opportunity+'</b> (ROI '+w.roi+'x, конкурентов '+w.channels+')</li>';}).join('');
    var potHtml=pot?'<div class="v30-big">'+pot.score+'<small>/100</small></div><div class="v30-ci">'+esc(pot.verdict)+'</div>':'';
    return '<div class="v30-card"><h3>Анализ ниши</h3>'+potHtml+
      '<div class="v30-ci">Насыщенность: <b>'+esc(scan.saturation)+'</b> · каналов '+scan.channels+' · моментум '+esc(scan.momentum)+' · планка входа (медиана VPD) '+fmt(scan.entryBar.medVpd)+', топ-10% '+fmt(scan.entryBar.topDecile)+'</div>'+
      '<h4>Карта спроса</h4><table class="v30-tbl"><thead><tr><th>Тема</th><th>медVPD</th><th>ROI</th><th>каналов</th></tr></thead><tbody>'+dem+'</tbody></table>'+
      '<h4>Окна возможностей</h4><ul class="v30-list">'+(win||'<li>—</li>')+'</ul></div>';
  };
  V32.html_positioning=function(p){ if(!p)return '';
    function ul(a){return '<ul class="v30-list">'+((a||[]).map(function(x){return '<li>'+esc(x)+'</li>';}).join(''))+'</ul>';}
    return '<div class="v30-card"><h3>Позиционирование</h3><p><b>Угол:</b> '+esc(p.angle)+'</p>'+(p.tagline?'<p><em>«'+esc(p.tagline)+'»</em></p>':'')+
      '<h4>Отстройка</h4>'+ul(p.differentiators)+(p.avoid&&p.avoid.length?'<h4>Чего избегать</h4>'+ul(p.avoid):'')+'</div>'; };
  V32.html_starter=function(s){ if(!s)return '';
    var vids=(s.first10||[]).map(function(v){return '<li><b>'+esc(v.idea)+'</b> ['+esc(v.format||'')+']'+(v.hook?' — хук: '+esc(v.hook):'')+'</li>';}).join('');
    var b=s.branding||{};
    return '<div class="v30-card"><h3>Стартовый набор</h3><div class="v30-ci">Имя канала: <b>'+esc((s.channelName||[]).join(' / '))+'</b></div>'+
      '<p>'+esc(s.channelDescription||'')+'</p>'+
      '<h4>Первые видео</h4><ul class="v30-list">'+vids+'</ul>'+
      '<h4>Оформление</h4><div class="v30-ci">Цвета: '+esc(b.colors||'—')+' · Обложки: '+esc(b.thumbnailStyle||'—')+' · Тон: '+esc(b.tone||'—')+'</div>'+
      '<h4>Цель на 90 дней</h4><p>'+esc(s.goal90d||'')+'</p></div>'; };
  V32.html_launch=function(l){ if(!l||!l.phases)return '';
    var ph=l.phases.map(function(p){return '<div style="margin:8px 0"><b>'+esc(p.name)+'</b> ('+esc(p.weeks||'')+' нед.)<ul class="v30-list">'+((p.tasks||[]).map(function(t){return '<li>'+esc(t)+'</li>';}).join(''))+'</ul><div class="v30-ci">Успех: '+esc(p.successMetric||'')+'</div></div>';}).join('');
    return '<div class="v30-card"><h3>План запуска</h3>'+ph+'</div>'; };

  V32.html_profileForm=function(p){
    p=p||(V32.getProfile&&V32.getProfile())||(V32.defaultProfile&&V32.defaultProfile())||{};
    function sel(v,val){return v===val?' selected':'';}
    function ck(v,val){return v===val?' checked':'';}
    return '<div class="v30-card"><h3>👤 Профиль блогера</h3>'+
      '<div class="v32-row"><label>Есть канал?</label>'+
        '<label><input type="radio" name="v32-has" value="yes"'+ck(p.hasChannel===true?'yes':'',('yes'))+'> Да</label> '+
        '<label><input type="radio" name="v32-has" value="no"'+ck(p.hasChannel===false?'no':'',('no'))+'> Нет</label></div>'+
      '<div class="v32-row"><label>Ссылка/имя канала</label><input id="v32-url" value="'+esc(p.channelUrl||'')+'" placeholder="@channel"></div>'+
      '<div class="v32-row"><label>Ниша *</label><input id="v32-niche" value="'+esc(p.niche||'')+'" placeholder="напр. технологии"></div>'+
      '<div class="v32-row"><label>Под-ниша</label><input id="v32-subniche" value="'+esc(p.subNiche||'')+'" placeholder="напр. ИИ-инструменты"></div>'+
      '<div class="v32-row"><label>Аудитория</label><input id="v32-aud" value="'+esc(p.audience||'')+'" placeholder="кто зритель"></div>'+
      '<div class="v32-row"><label>Формат</label><select id="v32-format"><option value="both"'+sel(p.format,'both')+'>Shorts + длинные</option><option value="long"'+sel(p.format,'long')+'>Длинные</option><option value="shorts"'+sel(p.format,'shorts')+'>Shorts</option></select></div>'+
      '<div class="v32-row"><label>Цель</label><select id="v32-goal"><option value="growth"'+sel(p.goal,'growth')+'>Рост подписчиков</option><option value="views"'+sel(p.goal,'views')+'>Просмотры</option><option value="money"'+sel(p.goal,'money')+'>Монетизация</option><option value="authority"'+sel(p.goal,'authority')+'>Экспертность</option></select></div>'+
      '<div class="v32-row"><label>Язык</label><select id="v32-lang"><option value="ru"'+sel(p.lang,'ru')+'>Русский</option><option value="en"'+sel(p.lang,'en')+'>English</option></select></div>'+
      '<div class="v32-row"><label>Референсы</label><input id="v32-refs" value="'+esc((p.references||[]).join(', '))+'" placeholder="каналы через запятую"></div>'+
      '<div class="v30-btns"><button id="v32-save">Сохранить и анализировать</button></div>'+
      '<div id="v32-form-err" class="v30-down"></div></div>';
  };

  /* ---------- CSS for form ---------- */
  function injectCSS2(){ if(typeof document==='undefined'||document.getElementById('v32-css'))return;
    var s=document.createElement('style'); s.id='v32-css';
    s.textContent='.v32-row{display:flex;align-items:center;gap:10px;margin:8px 0}.v32-row label{min-width:140px;color:#ccc;font-size:13px}.v32-row input,.v32-row select{flex:1;background:#15151a;color:#eee;border:1px solid #333;border-radius:8px;padding:7px 10px;font:13px system-ui}';
    document.head.appendChild(s);
  }

  /* ---------- wiring ---------- */
  V32.openOnboarding=function(){
    if(typeof document==='undefined')return; injectCSS2();
    var body=document.getElementById('v30-body'); if(!body)return;
    body.innerHTML=V32.html_profileForm();
    var has=function(){ var r=document.querySelector('input[name="v32-has"]:checked'); return r?r.value:null; };
    document.getElementById('v32-save').onclick=function(){
      var prof={ hasChannel: has()==='yes'?true:(has()==='no'?false:null),
        channelUrl:(document.getElementById('v32-url')||{}).value||'',
        niche:(document.getElementById('v32-niche')||{}).value||'',
        subNiche:(document.getElementById('v32-subniche')||{}).value||'',
        audience:(document.getElementById('v32-aud')||{}).value||'',
        format:(document.getElementById('v32-format')||{}).value||'both',
        goal:(document.getElementById('v32-goal')||{}).value||'growth',
        lang:(document.getElementById('v32-lang')||{}).value||'ru',
        references:(document.getElementById('v32-refs')||{}).value||'' };
      var val=V32.validateProfile(prof);
      if(!val.ok){ var e=document.getElementById('v32-form-err'); if(e)e.textContent=val.errors.join('; '); return; }
      V32.setProfile(prof); V32.runBlogger();
    };
  };

  V32.findCompetitors=async function(){
    if(typeof document==='undefined')return; var body=document.getElementById('v30-body');
    var note=document.createElement('div'); note.className='v30-load'; note.textContent='Ищу конкурентов…'; if(body)body.appendChild(note);
    try{
      var S=(window.STATE||{}); var prof=V32.getProfile&&V32.getProfile();
      var hasCh=V32.hasChannel&&V32.hasChannel();
      var opts=hasCh?{ seedVids:V30.collectVideos(), mySubs:(S.channel&&S.channel.subs)||0, selfChannelId:(S.channel&&S.channel.id)||null, lang:(prof&&prof.lang)||'ru', forceDiscover:true }
                    :{ keywords:V32.profileKeywords?V32.profileKeywords():[], lang:(prof&&prof.lang)||'ru' };
      var disc=await V32.discoverCompetitors(opts); (window.STATE=window.STATE||{}).competitors=disc.competitors;
      note.remove(); var d=document.createElement('div'); d.id='v32-comp'; d.innerHTML=V32.html_competitors(disc);
      var old=document.getElementById('v32-comp'); if(old)old.remove(); if(body)body.appendChild(d);
      return disc;
    }catch(e){ note.textContent='Ошибка поиска: '+e.message; }
  };

  /* full blogger flow: resolves context, renders niche or channel-aware results */
  V32.runBlogger=async function(){
    if(typeof document==='undefined')return; var body=document.getElementById('v30-body');
    if(body)body.innerHTML='<div class="v30-load">Собираю данные ниши и конкурентов…</div>';
    try{
      var ctx=await V32.getAnalysisContext({ forceDiscover:true });
      V32._ctx=ctx;
      var html='';
      html+=V32.html_competitors({keywords:[],competitors:ctx.competitors,note:'релевантность по теме/размеру/языку'});
      if(ctx.mode==='niche'){
        html+=V32.html_niche(ctx.scan, ctx.potential);
      } else {
        var sb=V30.scoreBreakdown((window.STATE||{}).channel||{}, ctx.myVids);
        html+=V30.html_score(sb);
        var bm=V30.benchmark((window.STATE||{}).channel||{}, ctx.myVids, ctx.competitors);
        html+=V30.html_benchmark(bm);
      }
      if(body)body.innerHTML=html;
      var ai=document.createElement('div'); ai.className='v30-btns'; ai.innerHTML='<button id="v32-ai-pos">✦ Позиционирование</button>'+(ctx.mode==='niche'?'<button id="v32-ai-start">✦ Стартовый набор</button><button id="v32-ai-launch">✦ План запуска</button>':'');
      if(body)body.appendChild(ai);
      var bind=function(id,fn){var b=document.getElementById(id); if(b)b.onclick=fn;};
      bind('v32-ai-pos',function(){V32.runAI('positioning');});
      bind('v32-ai-start',function(){V32.runAI('starter');});
      bind('v32-ai-launch',function(){V32.runAI('launch');});
    }catch(e){ if(body)body.innerHTML='<div class="v30-down">Ошибка: '+e.message+'</div>'; }
  };

  V32.runAI=async function(kind){
    var body=document.getElementById('v30-body'); var ctx=V32._ctx||{};
    var aiCtx=ctx.mode==='niche'?ctx.scan:{topics:(V30._last&&V30._last.cl&&V30._last.cl.topics)||[]};
    var note=document.createElement('div'); note.className='v30-load'; note.textContent='AI работает…'; if(body)body.appendChild(note);
    try{
      var html='';
      if(kind==='positioning') html=V32.html_positioning(await V32.positioning(aiCtx));
      else if(kind==='starter') html=V32.html_starter(await V32.starterKit(aiCtx));
      else if(kind==='launch') html=V32.html_launch(await V32.launchPlan(aiCtx));
      note.remove(); var d=document.createElement('div'); d.innerHTML=html; if(body)body.appendChild(d);
    }catch(e){ note.textContent='AI-ошибка: '+e.message; }
  };

  /* inject blogger buttons into the V30 modal toolbar */
  var _prevOpen=V30.open;
  V30.open=function(){ _prevOpen&&_prevOpen.call(V30); try{ V32._injectButtons(); }catch(e){console.warn('v32 btns',e);} };
  V32._injectButtons=function(){
    var bar=document.querySelector('#v30-modal .v30-btns'); if(!bar||document.getElementById('v32-blogger-btn'))return;
    function mk(id,label,fn){var b=document.createElement('button'); b.id=id; b.textContent=label; b.onclick=fn; bar.appendChild(b);}
    mk('v32-blogger-btn','👤 Режим блогера',function(){V32.openOnboarding();});
    mk('v32-find-btn','🔍 Найти конкурентов',function(){V32.findCompetitors();});
  };

  if(typeof window!=='undefined'){ window.V32=V32; }
})();
