/* ============================================================================
   VIORA V30 — ANALYTICS PACK  (additive, non-destructive)
   Pure analytics core: scoring, trends, clustering, benchmark, predictor,
   sentiment, CSV, schema validation. No DOM / network dependency here.
   Exposed via window.V30 (and window.VIORA_V30 alias).
   ============================================================================ */
(function(){
  "use strict";
  var V30 = (typeof window!=='undefined' && window.V30) ? window.V30 : {};

  /* ---------- small numeric helpers (self-contained, no global deps) ---------- */
  function num(x){ x=+x; return isFinite(x)?x:0; }
  function arrMedian(a){ a=(a||[]).map(num).filter(function(v){return isFinite(v);}).sort(function(x,y){return x-y;}); if(!a.length)return 0; var m=Math.floor(a.length/2); return a.length%2?a[m]:(a[m-1]+a[m])/2; }
  function arrMean(a){ a=(a||[]).map(num); return a.length? a.reduce(function(s,v){return s+v;},0)/a.length : 0; }
  function arrStd(a){ a=(a||[]).map(num); if(a.length<2)return 0; var m=arrMean(a); return Math.sqrt(a.reduce(function(s,v){return s+(v-m)*(v-m);},0)/(a.length-1)); }
  function pct(a, p){ a=(a||[]).map(num).sort(function(x,y){return x-y;}); if(!a.length)return 0; var idx=(a.length-1)*p; var lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi)return a[lo]; return a[lo]+(a[hi]-a[lo])*(idx-lo); }
  function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
  function pctRank(arr, v){ arr=(arr||[]).map(num); if(!arr.length)return 0; var c=0; for(var i=0;i<arr.length;i++){ if(arr[i]<=v)c++; } return c/arr.length; }
  V30.num=num; V30.median=arrMedian; V30.mean=arrMean; V30.std=arrStd; V30.pct=pct; V30.clamp=clamp; V30.pctRank=pctRank;

  /* ---------- field accessors tolerant to the app's video shape ---------- */
  function vViews(v){ return num(v.views!=null?v.views:(v.viewCount!=null?v.viewCount:0)); }
  function vVpd(v){ if(v.viewsPerDay!=null)return num(v.viewsPerDay); var age=num(v.age||v.ageDays||1); return age>0? vViews(v)/age : vViews(v); }
  function vEng(v){ if(v.engagement!=null)return num(v.engagement); var views=vViews(v)||1; return (num(v.likes)+num(v.comments))/views; }
  function vTitle(v){ return (v.title||v.snippet&&v.snippet.title||"")+""; }
  function vDate(v){ return v.publishedAt||v.published||(v.snippet&&v.snippet.publishedAt)||null; }
  V30.vViews=vViews; V30.vVpd=vVpd; V30.vEng=vEng; V30.vTitle=vTitle; V30.vDate=vDate;

  /* ============================================================
     1) TRANSPARENT SCORING — explainable, niche-normalized, with CI
     ============================================================ */
  V30.scoreBreakdown = function(channel, vids){
    vids = (vids||[]).slice();
    var n = vids.length;
    var vpd = vids.map(vVpd), eng = vids.map(vEng), views = vids.map(vViews);
    var medVpd = arrMedian(vpd), medEng = arrMedian(eng);
    // consistency: lower coefficient of variation of vpd is better
    var cv = medVpd>0 ? (arrStd(vpd)/ (arrMean(vpd)||1)) : 1;
    var consistency = clamp(1 - clamp(cv/2,0,1), 0, 1);
    // outperformance: share of videos above 1.5x median (breakout rate)
    var breakouts = medVpd>0 ? vpd.filter(function(x){return x>=1.5*medVpd;}).length : 0;
    var breakoutRate = n? breakouts/n : 0;
    // cadence: videos per 30d over observed span
    var dates = vids.map(vDate).filter(Boolean).map(function(d){return +new Date(d);}).filter(isFinite).sort();
    var spanDays = dates.length>1 ? (dates[dates.length-1]-dates[0])/864e5 : 0;
    var cadence = spanDays>0 ? (n/(spanDays/30)) : 0;
    // engagement score normalized (2% engagement ~ good baseline)
    var engScore = clamp(medEng/0.04, 0, 1);
    // subscale 0..100
    var factors = [
      { key:'reach',        label:'Охват (медиана VPD)', weight:0.30, raw:medVpd, score: clamp(Math.log10(1+medVpd)/Math.log10(1+5000),0,1) },
      { key:'consistency',  label:'Стабильность',        weight:0.20, raw:cv,      score: consistency },
      { key:'breakout',     label:'Доля «выстрелов»',    weight:0.20, raw:breakoutRate, score: clamp(breakoutRate/0.25,0,1) },
      { key:'engagement',   label:'Вовлечённость',       weight:0.15, raw:medEng,  score: engScore },
      { key:'cadence',      label:'Регулярность',        weight:0.15, raw:cadence, score: clamp(cadence/8,0,1) }
    ];
    var total = factors.reduce(function(s,f){return s + f.weight*f.score;},0)*100;
    // confidence interval width from sample size (bootstrap-free approx on vpd)
    var sePct = n? clamp(1/Math.sqrt(n),0,1) : 1;
    var confidence = clamp(1 - sePct, 0, 1); // 0..1
    var ciHalf = Math.round( (1-confidence) * 18 ); // +/- points on 0..100
    return {
      score: Math.round(total),
      ci: [Math.max(0,Math.round(total)-ciHalf), Math.min(100,Math.round(total)+ciHalf)],
      confidence: Math.round(confidence*100),
      sample: n,
      factors: factors.map(function(f){ return { key:f.key, label:f.label, weight:f.weight, raw:f.raw, score:Math.round(f.score*100), points:Math.round(f.weight*f.score*100) }; }),
      medVpd: medVpd, medEng: medEng
    };
  };

  /* ============================================================
     2) TIME TRENDS — monthly views & upload frequency + breakouts
     ============================================================ */
  V30.trends = function(vids){
    var by = {};
    (vids||[]).forEach(function(v){
      var d = vDate(v); if(!d)return; var dt=new Date(d); if(isNaN(dt))return;
      var key = dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
      (by[key]=by[key]||{month:key,count:0,views:0,vpd:[]});
      by[key].count++; by[key].views+=vViews(v); by[key].vpd.push(vVpd(v));
    });
    var months = Object.keys(by).sort().map(function(k){ var b=by[k]; return { month:k, uploads:b.count, totalViews:Math.round(b.views), medVpd:Math.round(arrMedian(b.vpd)) }; });
    // simple slope of medVpd over months (linear regression)
    var ys=months.map(function(m){return m.medVpd;}); var slope=V30.linReg(ys).slope;
    var allVpd=(vids||[]).map(vVpd); var med=arrMedian(allVpd);
    var breakouts=(vids||[]).filter(function(v){return med>0 && vVpd(v)>=2*med;})
      .sort(function(a,b){return vVpd(b)-vVpd(a);})
      .slice(0,10)
      .map(function(v){return {title:vTitle(v), vpd:Math.round(vVpd(v)), x:med>0?+(vVpd(v)/med).toFixed(1):0, date:vDate(v)};});
    return { months:months, momentum: slope>0?'рост':(slope<0?'спад':'ровно'), slope:slope, breakouts:breakouts };
  };

  V30.linReg = function(ys){
    ys=(ys||[]).map(num); var n=ys.length; if(n<2)return {slope:0,intercept:ys[0]||0};
    var sx=0,sy=0,sxx=0,sxy=0; for(var i=0;i<n;i++){ sx+=i; sy+=ys[i]; sxx+=i*i; sxy+=i*ys[i]; }
    var d=(n*sxx-sx*sx)||1; var slope=(n*sxy-sx*sy)/d; var intercept=(sy-slope*sx)/n;
    return {slope:slope,intercept:intercept};
  };

  if(typeof window!=='undefined'){ window.V30=V30; window.VIORA_V30=V30; }
  if(typeof module!=='undefined'&&module.exports){ module.exports=V30; }
})();



(function(){
  "use strict";
  var V30 = (typeof window!=='undefined'&&window.V30)?window.V30:{};
  var num=V30.num, med=V30.median, pct=V30.pct, clamp=V30.clamp, pctRank=V30.pctRank;
  var vViews=V30.vViews, vVpd=V30.vVpd, vEng=V30.vEng, vTitle=V30.vTitle, vDate=V30.vDate;

  /* ---------- RU/EN stopwords + tokenizer ---------- */
  var STOP = ("и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между " +
    "the a an of to in on for and or is are be with this that at by from your you it as how what why top best new vs my our 2023 2024 2025").split(/\s+/);
  var STOPSET={}; STOP.forEach(function(w){STOPSET[w]=1;});
  function tokenize(s){ return (s||"").toLowerCase().replace(/[#@|]/g,' ').replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(function(w){return w.length>=3 && !STOPSET[w] && !/^\d+$/.test(w);}); }
  V30.tokenize=tokenize;

  /* ============================================================
     3) TOPIC CLUSTERING + ROI per topic (keyword/co-occurrence)
     ============================================================ */
  V30.clusterTopics = function(vids, opts){
    opts=opts||{}; var minCount=opts.minCount||2, topK=opts.topK||12;
    var df={}; var docs=(vids||[]).map(function(v){ var t=Array.from(new Set(tokenize(vTitle(v)))); t.forEach(function(w){df[w]=(df[w]||0)+1;}); return {v:v,t:t}; });
    var N=docs.length||1;
    // score keywords by tf-idf-ish * count; build topic = keyword bucket
    var kw=Object.keys(df).filter(function(w){return df[w]>=minCount;});
    kw.sort(function(a,b){return df[b]-df[a];});
    var topics=kw.slice(0, topK).map(function(w){
      var members=docs.filter(function(d){return d.t.indexOf(w)>=0;}).map(function(d){return d.v;});
      var vpds=members.map(vVpd), views=members.map(vViews);
      return {
        topic:w, videos:members.length,
        medVpd:Math.round(med(vpds)), totalViews:Math.round(views.reduce(function(s,x){return s+x;},0)),
        sample: members.slice(0,3).map(vTitle)
      };
    });
    // ROI = topic medVpd vs overall medVpd
    var overall=med((vids||[]).map(vVpd))||1;
    topics.forEach(function(t){ t.roi=+(t.medVpd/overall).toFixed(2); });
    topics.sort(function(a,b){return b.roi-a.roi;});
    return { overallMedVpd:Math.round(overall), topics:topics };
  };

  /* ============================================================
     4) COMPETITOR BENCHMARK — niche medians + percentile rank
     ============================================================ */
  V30.benchmark = function(channel, vids, competitors){
    // competitors: [{title, subs, vids:[...]}] OR flat list of comp videos
    var myVpd=med((vids||[]).map(vVpd)), myEng=med((vids||[]).map(vEng));
    var compVids=[];
    (competitors||[]).forEach(function(c){ (c.vids||c.videos||[]).forEach(function(v){compVids.push(v);}); if(Array.isArray(c)&&c.length){} });
    if((competitors||[]).length && !compVids.length && Array.isArray(competitors)) compVids=competitors;
    var nicheVpd=compVids.map(vVpd), nicheEng=compVids.map(vEng);
    var rows=(competitors||[]).map(function(c){
      var cv=(c.vids||c.videos||[]);
      return { title:c.title||c.name||'—', subs:num(c.subs), medVpd:Math.round(med(cv.map(vVpd))), medEng:+med(cv.map(vEng)).toFixed(3), videos:cv.length };
    });
    return {
      me:{ medVpd:Math.round(myVpd), medEng:+myEng.toFixed(3) },
      niche:{ medVpd:Math.round(med(nicheVpd)), p25:Math.round(pct(nicheVpd,.25)), p75:Math.round(pct(nicheVpd,.75)), medEng:+med(nicheEng).toFixed(3) },
      myVpdPercentile: Math.round(pctRank(nicheVpd, myVpd)*100),
      myEngPercentile: Math.round(pctRank(nicheEng, myEng)*100),
      competitors: rows
    };
  };

  /* ============================================================
     5) PREDICTOR — expected views for a topic/format
     ============================================================ */
  V30.predict = function(vids, query){
    query=query||{}; var topic=(query.topic||'').toLowerCase(); var fmt=query.format; // 'short'|'long'
    var pool=(vids||[]).filter(function(v){
      var okFmt = fmt? ((fmt==='short')=== !!(v.isShort|| (num(v.durationSec||v.duration)>0 && num(v.durationSec||v.duration)<=60))) : true;
      return okFmt;
    });
    var toks = topic? tokenize(topic):[];
    var match = toks.length? pool.filter(function(v){ var t=tokenize(vTitle(v)); return toks.some(function(w){return t.indexOf(w)>=0;}); }) : pool;
    var base = match.length>=3? match : pool;
    var vpds=base.map(vVpd).sort(function(a,b){return a-b;});
    var horizon = num(query.days||30);
    return {
      basedOn: base.length,
      matched: match.length,
      expectedVpd: Math.round(med(vpds)),
      low: Math.round(pct(vpds,.25)),
      high: Math.round(pct(vpds,.75)),
      expectedViews30d: Math.round(med(vpds)*horizon),
      note: match.length<3? 'мало похожих видео — прогноз по всему каналу' : 'прогноз по '+match.length+' похожим видео'
    };
  };

  /* ============================================================
     6) COMMENT SENTIMENT + IDEA EXTRACTION (lexicon heuristic)
     ============================================================ */
  var POS=("круто супер класс отлично спасибо лучший топ огонь полезно помог респект гениально кайф любим браво wow great love best amazing helpful thanks awesome").split(/\s+/);
  var NEG=("плохо ужас отстой бред скучно фигня хрень обман развод дизлайк кликбейт зря разочарован waste boring clickbait scam bad worst hate terrible").split(/\s+/);
  var REQ=/(сделай|снимите?|хочу|хотелось бы|можешь|сделайте|обзор на|видео про|расскажи про|please make|do a video|can you|пожалуйста\s+сними)/i;
  function lexScore(text){ var t=(text||'').toLowerCase(); var p=0,n=0; POS.forEach(function(w){if(t.indexOf(w)>=0)p++;}); NEG.forEach(function(w){if(t.indexOf(w)>=0)n++;}); return p-n; }
  V30.summarizeComments = function(comments){
    comments=(comments||[]).map(function(c){return typeof c==='string'?c:(c.text||c.textDisplay||'');});
    var pos=0,neg=0,neu=0, ideas=[];
    comments.forEach(function(c){ var s=lexScore(c); if(s>0)pos++; else if(s<0)neg++; else neu++; if(REQ.test(c)&&ideas.length<15) ideas.push(c.trim().slice(0,140)); });
    var tot=comments.length||1;
    return { total:comments.length, positive:pos, negative:neg, neutral:neu,
      sentiment:+( (pos-neg)/tot ).toFixed(2),
      mood: (pos-neg)/tot>0.15?'позитивная':((pos-neg)/tot<-0.1?'негативная':'нейтральная'),
      contentRequests: ideas };
  };

  /* ============================================================
     7) CSV EXPORT (Excel/Sheets-friendly, BOM + ; safe)
     ============================================================ */
  V30.toCSV = function(vids, sep){
    sep=sep||';';
    var cols=[['videoId','ID'],['title','Заголовок'],['views','Просмотры'],['viewsPerDay','VPD'],['engagement','Вовлечённость'],['age','Возраст(дн)'],['publishedAt','Дата']];
    function cell(s){ s=(s==null?'':String(s)); if(s.indexOf(sep)>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0){ s='"'+s.replace(/"/g,'""')+'"'; } return s; }
    var head=cols.map(function(c){return cell(c[1]);}).join(sep);
    var body=(vids||[]).map(function(v){ return [v.videoId, vTitle(v), Math.round(vViews(v)), Math.round(vVpd(v)), +vEng(v).toFixed(4), Math.round(num(v.age||v.ageDays)), vDate(v)||''].map(cell).join(sep); }).join('\n');
    return '\ufeff'+head+'\n'+body;
  };

  /* ============================================================
     8) SCHEMA VALIDATION for structured AI output
     ============================================================ */
  V30.validateSchema = function(obj, schema){
    var errors=[];
    function check(o, s, path){
      if(s.type==='object'){ if(typeof o!=='object'||o===null||Array.isArray(o)){errors.push(path+': ожидался object'); return;} (s.required||[]).forEach(function(k){ if(!(k in o))errors.push(path+'.'+k+': отсутствует'); }); var props=s.properties||{}; Object.keys(props).forEach(function(k){ if(k in o) check(o[k],props[k],path+'.'+k); }); }
      else if(s.type==='array'){ if(!Array.isArray(o)){errors.push(path+': ожидался array'); return;} if(s.items) o.forEach(function(it,i){check(it,s.items,path+'['+i+']');}); }
      else if(s.type==='string'){ if(typeof o!=='string')errors.push(path+': ожидалась строка'); }
      else if(s.type==='number'){ if(typeof o!=='number'||!isFinite(o))errors.push(path+': ожидалось число'); }
    }
    check(obj, schema, '$');
    return { ok:errors.length===0, errors:errors };
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();



(function(){
  "use strict";
  var V30 = (typeof window!=='undefined'&&window.V30)?window.V30:{};
  var num=V30.num;

  /* resilient access to the app's primitives (fall back gracefully) */
  function ytKey(){ try{ return (typeof YOUTUBE_API_KEY!=='undefined')?YOUTUBE_API_KEY:(window.YOUTUBE_API_KEY||''); }catch(e){ return (typeof window!=='undefined'&&window.YOUTUBE_API_KEY)||''; } }
  function YTBASE(){ return 'https://www.googleapis.com/youtube/v3/'; }
  function appYtFetch(){ return (typeof window!=='undefined'&&typeof window.ytFetch==='function')?window.ytFetch:(typeof ytFetch!=='undefined'?ytFetch:null); }

  /* ---------- in-flight dedup + lightweight cost meter ---------- */
  var _inflight={}; var _meter={ytUnits:0, mistralCalls:0, mistralTokensEst:0, requests:0, deduped:0};
  V30.meter=function(){ return Object.assign({}, _meter); };
  V30.resetMeter=function(){ _meter={ytUnits:0,mistralCalls:0,mistralTokensEst:0,requests:0,deduped:0}; };
  // unit cost per YouTube endpoint (Data API v3 official quota)
  var YT_UNIT={search:100,videos:1,channels:1,playlistItems:1,commentThreads:1,captions:50,playlists:1};
  function endpointOf(path){ var m=(path||'').match(/^([a-zA-Z]+)/); return m?m[1]:''; }
  V30.ytUnitCost=function(path){ return YT_UNIT[endpointOf(path)]!=null?YT_UNIT[endpointOf(path)]:1; };

  // dedup wrapper around the app's ytFetch (same cache key = same in-flight promise)
  V30.ytFetch=function(path){
    var ep=endpointOf(path); _meter.requests++;
    if(_inflight[path]){ _meter.deduped++; return _inflight[path]; }
    var raw=appYtFetch();
    var p;
    if(raw){ p=Promise.resolve(raw(path)); }
    else { p=fetch(YTBASE()+path+(path.indexOf('?')>=0?'&':'?')+'key='+encodeURIComponent(ytKey())).then(function(r){return r.json();}); }
    p=p.then(function(d){ _meter.ytUnits+=V30.ytUnitCost(path); delete _inflight[path]; return d; })
       .catch(function(e){ delete _inflight[path]; throw e; });
    _inflight[path]=p; return p;
  };

  V30.noteMistral=function(promptLen, respLen){ _meter.mistralCalls++; _meter.mistralTokensEst+=Math.round(((promptLen||0)+(respLen||0))/4); };

  /* ============================================================
     DEEP UPLOADS — full channel via uploads playlist (cost-efficient)
     parse helpers are pure & testable
     ============================================================ */
  V30.parsePlaylistPage=function(json){
    return ((json&&json.items)||[]).map(function(it){
      var s=it.snippet||{}, c=it.contentDetails||{};
      return { videoId:(c.videoId||(s.resourceId&&s.resourceId.videoId)), title:s.title, publishedAt:c.videoPublishedAt||s.publishedAt, thumbnail:(s.thumbnails&&(s.thumbnails.medium||s.thumbnails.default)||{}).url };
    }).filter(function(v){return v.videoId;});
  };
  V30.uploadsPlaylistId=function(channelJson){
    var it=((channelJson&&channelJson.items)||[])[0];
    return it && it.contentDetails && it.contentDetails.relatedPlaylists && it.contentDetails.relatedPlaylists.uploads || null;
  };
  V30.fetchUploadsDeep=async function(channelId, max){
    max=max||300;
    var ch=await V30.ytFetch('channels?part=contentDetails&id='+channelId);
    var pl=V30.uploadsPlaylistId(ch); if(!pl)return [];
    var out=[], token='';
    while(out.length<max){
      var page=await V30.ytFetch('playlistItems?part=snippet,contentDetails&maxResults=50&playlistId='+pl+(token?'&pageToken='+token:''));
      out=out.concat(V30.parsePlaylistPage(page));
      token=page.nextPageToken||''; if(!token)break;
    }
    return out.slice(0,max);
  };

  /* enrich a list of videoIds with statistics+contentDetails (batched 50) */
  V30.parseVideoStats=function(json){
    var map={};
    ((json&&json.items)||[]).forEach(function(v){
      var st=v.statistics||{}, cd=v.contentDetails||{};
      map[v.id]={ views:num(st.viewCount), likes:num(st.likeCount), comments:num(st.commentCount), duration:cd.duration||'' };
    });
    return map;
  };
  V30.iso8601ToSec=function(d){ var m=/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d||''); if(!m)return 0; return (+(m[1]||0))*3600+(+(m[2]||0))*60+(+(m[3]||0)); };
  V30.enrichStats=async function(videos){
    for(var i=0;i<videos.length;i+=50){
      var batch=videos.slice(i,i+50); var ids=batch.map(function(v){return v.videoId;}).join(',');
      var d=await V30.ytFetch('videos?part=statistics,contentDetails&id='+ids);
      var map=V30.parseVideoStats(d);
      batch.forEach(function(v){ var s=map[v.videoId]; if(s){ v.views=s.views; v.likes=s.likes; v.comments=s.comments; v.duration=s.duration; v.durationSec=V30.iso8601ToSec(s.duration); v.isShort=v.durationSec>0&&v.durationSec<=60; var age=(Date.now()-+new Date(v.publishedAt))/864e5; v.age=Math.max(1,age); v.viewsPerDay=v.views/v.age; v.engagement=v.views?(v.likes+v.comments)/v.views:0; } });
    }
    return videos;
  };

  /* ============================================================
     TRANSCRIPT — timedtext (best-effort; CORS may block w/o proxy)
     ============================================================ */
  V30.parseTimedText=function(xml){
    if(!xml)return ''; var out=[]; var re=/<text[^>]*>([\s\S]*?)<\/text>/g; var m;
    function dec(s){ return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&#(\d+);/g,function(_,n){return String.fromCharCode(+n);}).replace(/\n/g,' '); }
    while((m=re.exec(xml))!==null){ out.push(dec(m[1])); }
    return out.join(' ').replace(/\s+/g,' ').trim();
  };
  V30.fetchTranscript=async function(videoId, lang){
    lang=lang||'ru';
    var proxy=(typeof window!=='undefined'&&window.CORS_PROXY)||'';
    var url='https://www.youtube.com/api/timedtext?lang='+lang+'&v='+videoId;
    try{ var r=await fetch(proxy?proxy+encodeURIComponent(url):url); var x=await r.text(); var t=V30.parseTimedText(x); if(!t&&lang!=='en')return V30.fetchTranscript(videoId,'en'); return t; }
    catch(e){ return ''; }
  };

  /* ============================================================
     COMMENTS — commentThreads (top, relevance)
     ============================================================ */
  V30.parseComments=function(json){
    return ((json&&json.items)||[]).map(function(it){ var s=it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet||{}; return { text:s.textDisplay||s.textOriginal||'', likes:num(s.likeCount) }; }).filter(function(c){return c.text;});
  };
  V30.fetchComments=async function(videoId, max){
    max=max||100; var out=[], token='';
    while(out.length<max){
      var d=await V30.ytFetch('commentThreads?part=snippet&order=relevance&maxResults=100&videoId='+videoId+(token?'&pageToken='+token:''));
      out=out.concat(V30.parseComments(d)); token=d.nextPageToken||''; if(!token)break;
    }
    return out.slice(0,max);
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  var num=V30.num;
  function mKey(){ try{return (typeof MISTRAL_API_KEY!=='undefined')?MISTRAL_API_KEY:(window.MISTRAL_API_KEY||'');}catch(e){return (typeof window!=='undefined'&&window.MISTRAL_API_KEY)||'';} }
  var MODEL_TEXT='mistral-large-latest', MODEL_VISION='pixtral-large-latest';

  /* generic structured Mistral call w/ JSON mode + schema retry */
  V30.mistral=async function(messages, opts){
    opts=opts||{};
    var body={ model:opts.model||MODEL_TEXT, messages:messages, temperature:opts.temperature!=null?opts.temperature:0.3 };
    if(opts.json) body.response_format={type:'json_object'};
    var promptLen=JSON.stringify(messages).length;
    var r=await fetch('https://api.mistral.ai/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+mKey()},body:JSON.stringify(body)});
    if(!r.ok){ var t=await r.text(); throw new Error('Mistral '+r.status+': '+t.slice(0,200)); }
    var d=await r.json();
    var content=(d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'';
    if(V30.noteMistral) V30.noteMistral(promptLen, content.length);
    return content;
  };

  /* parse + validate JSON from model, with one repair retry */
  V30.mistralJSON=async function(messages, schema, opts){
    opts=opts||{}; opts.json=true;
    var raw=await V30.mistral(messages, opts);
    var obj=V30.safeJSON(raw);
    if(schema){ var val=V30.validateSchema(obj||{}, schema); if(!val.ok && !opts._retry){ var fix=messages.concat([{role:'user',content:'Твой ответ не прошёл валидацию схемы: '+val.errors.join('; ')+'. Верни СТРОГО валидный JSON по схеме.'}]); return V30.mistralJSON(fix, schema, Object.assign({},opts,{_retry:true})); } }
    return obj;
  };
  V30.safeJSON=function(s){ if(!s)return null; try{return JSON.parse(s);}catch(e){} var m=s.match(/\{[\s\S]*\}/); if(m){try{return JSON.parse(m[0]);}catch(e){}} return null; };

  /* ---------- THUMBNAIL heuristics (pure, testable fallback) ---------- */
  V30.thumbHeuristics=function(meta){
    // meta: {hasFace, faceEmotion, textWords, contrast(0..1), brightness(0..1), saturation(0..1)}
    meta=meta||{}; var s=0, notes=[];
    if(meta.hasFace){ s+=25; notes.push('есть лицо (+CTR)'); } else notes.push('нет лица — добавьте крупный план/эмоцию');
    var tw=num(meta.textWords);
    if(tw>=1&&tw<=4){ s+=20; notes.push('лаконичный текст'); } else if(tw>4){ s+=5; notes.push('слишком много текста — сократите до 3–4 слов'); } else notes.push('добавьте 2–4 слова крупного текста');
    var contrast=meta.contrast!=null?meta.contrast:0.5; s+=Math.round(contrast*25); if(contrast<0.4)notes.push('низкий контраст — усильте');
    var sat=meta.saturation!=null?meta.saturation:0.5; s+=Math.round(sat*15); if(sat<0.4)notes.push('бледные цвета — повысьте насыщенность');
    if(meta.faceEmotion&&/(surprise|joy|shock|удив|радост|шок)/i.test(meta.faceEmotion)){ s+=15; notes.push('сильная эмоция'); }
    return { score:Math.min(100,s), notes:notes };
  };

  /* AI vision over a batch of thumbnail URLs -> structured per-video ctr advice */
  V30.analyzeThumbnailsAI=async function(videos, limit){
    limit=limit||6; var pick=videos.slice(0,limit).filter(function(v){return v.thumbnail;});
    if(!pick.length) return {items:[]};
    var content=[{type:'text',text:'Ты CTR-эксперт по YouTube-обложкам. Для каждой обложки верни JSON {items:[{i,ctrScore(0-100),hasFace,emotion,textWords,issues[],fix}]}. Кратко и по делу, на русском.'}];
    pick.forEach(function(v,i){ content.push({type:'text',text:'Обложка #'+i+': '+(v.title||'')}); content.push({type:'image_url',image_url:v.thumbnail}); });
    var schema={type:'object',required:['items'],properties:{items:{type:'array',items:{type:'object'}}}};
    return await V30.mistralJSON([{role:'user',content:content}], schema, {model:MODEL_VISION, temperature:0.2});
  };

  /* AI hook analysis from transcript (first ~600 chars = first seconds) */
  V30.analyzeHookAI=async function(title, transcript){
    var hook=(transcript||'').slice(0,700);
    var schema={type:'object',required:['hookScore','verdict','rewrite'],properties:{hookScore:{type:'number'},verdict:{type:'string'},retentionRisks:{type:'array',items:{type:'string'}},rewrite:{type:'string'}}};
    var msg=[{role:'system',content:'Ты сценарист YouTube. Оцени силу хука (первые секунды) по транскрипту. Верни JSON {hookScore(0-100), verdict, retentionRisks[], rewrite}. На русском.'},
             {role:'user',content:'Заголовок: '+title+'\nНачало (расшифровка): '+(hook||'(нет субтитров)')}];
    return await V30.mistralJSON(msg, schema, {temperature:0.4});
  };

  /* DEEP SYNTHESIS — feeds computed analytics into the model for a strategy */
  V30.synthesize=async function(pack){
    var schema={type:'object',required:['summary','strengths','weaknesses','actions'],properties:{summary:{type:'string'},strengths:{type:'array',items:{type:'string'}},weaknesses:{type:'array',items:{type:'string'}},actions:{type:'array',items:{type:'object'}},contentIdeas:{type:'array',items:{type:'string'}}}};
    var msg=[{role:'system',content:'Ты стратег YouTube-роста. На основе ЧИСЛОВОЙ аналитики дай конкретную стратегию. Верни JSON {summary, strengths[], weaknesses[], actions[{action,impact,effort}], contentIdeas[]}. Опирайся на цифры, без воды, на русском.'},
             {role:'user',content:'Аналитика канала (JSON):\n'+JSON.stringify(pack).slice(0,12000)}];
    return await V30.mistralJSON(msg, schema, {temperature:0.5});
  };

  if(typeof window!=='undefined'){ window.V30=V30; }
})();



(function(){
  "use strict";
  var V30=(typeof window!=='undefined'&&window.V30)?window.V30:{};
  function esc(s){ return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ n=+n||0; if(n>=1e6)return (n/1e6).toFixed(1)+'M'; if(n>=1e3)return (n/1e3).toFixed(1)+'K'; return ''+Math.round(n); }
  V30.esc=esc; V30.fmt=fmt;

  /* ---------- pure HTML builders (testable) ---------- */
  V30.html_score=function(sb){
    if(!sb)return '';
    var bars=sb.factors.map(function(f){ return '<div class="v30-fac"><span>'+esc(f.label)+'</span><div class="v30-bar"><i style="width:'+f.score+'%"></i></div><b>'+f.score+'</b></div>'; }).join('');
    return '<div class="v30-card"><h3>Оценка канала</h3>'+
      '<div class="v30-big">'+sb.score+'<small>/100</small></div>'+
      '<div class="v30-ci">доверит. интервал '+sb.ci[0]+'–'+sb.ci[1]+' · уверенность '+sb.confidence+'% · выборка '+sb.sample+'</div>'+
      bars+'</div>';
  };
  V30.html_trends=function(tr){
    if(!tr)return '';
    var br=(tr.breakouts||[]).slice(0,6).map(function(b){return '<li>'+esc(b.title)+' — <b>'+b.x+'x</b> ('+fmt(b.vpd)+'/дн)</li>';}).join('');
    return '<div class="v30-card"><h3>Динамика и «выстрелы»</h3><div class="v30-ci">Моментум: <b>'+esc(tr.momentum)+'</b> · точек: '+(tr.months||[]).length+'</div>'+
      '<canvas id="v30-trend-canvas" height="120"></canvas>'+
      '<h4>Топ «выстрелы»</h4><ul class="v30-list">'+(br||'<li>нет данных</li>')+'</ul></div>';
  };
  V30.html_topics=function(cl){
    if(!cl)return '';
    var rows=(cl.topics||[]).slice(0,12).map(function(t){ var c=t.roi>=1.2?'v30-up':(t.roi<0.85?'v30-down':''); return '<tr><td>'+esc(t.topic)+'</td><td>'+t.videos+'</td><td>'+fmt(t.medVpd)+'</td><td class="'+c+'">'+t.roi+'x</td></tr>'; }).join('');
    return '<div class="v30-card"><h3>Темы и ROI</h3><table class="v30-tbl"><thead><tr><th>Тема</th><th>Видео</th><th>медVPD</th><th>ROI</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  };
  V30.html_benchmark=function(bm){
    if(!bm||!bm.competitors||!bm.competitors.length)return '';
    var rows=bm.competitors.map(function(c){return '<tr><td>'+esc(c.title)+'</td><td>'+fmt(c.subs)+'</td><td>'+fmt(c.medVpd)+'</td></tr>';}).join('');
    return '<div class="v30-card"><h3>Бенчмарк ниши</h3><div class="v30-ci">Вы по VPD выше <b>'+bm.myVpdPercentile+'%</b> ниши · по вовлечённости выше <b>'+bm.myEngPercentile+'%</b></div>'+
      '<div class="v30-ci">Ваш медVPD '+fmt(bm.me.medVpd)+' vs ниша '+fmt(bm.niche.medVpd)+' (p25 '+fmt(bm.niche.p25)+' – p75 '+fmt(bm.niche.p75)+')</div>'+
      '<table class="v30-tbl"><thead><tr><th>Конкурент</th><th>Подписч.</th><th>медVPD</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  };
  V30.html_sentiment=function(sm){
    if(!sm)return '';
    var ideas=(sm.contentRequests||[]).slice(0,8).map(function(i){return '<li>'+esc(i)+'</li>';}).join('');
    return '<div class="v30-card"><h3>Аудитория (комментарии)</h3><div class="v30-ci">Настроение: <b>'+esc(sm.mood)+'</b> ('+sm.sentiment+') · 👍'+sm.positive+' 👎'+sm.negative+' 😐'+sm.neutral+'</div>'+
      '<h4>Запросы на контент</h4><ul class="v30-list">'+(ideas||'<li>нет явных запросов</li>')+'</ul></div>';
  };
  V30.html_synth=function(s){
    if(!s)return '';
    function ul(a){return '<ul class="v30-list">'+((a||[]).map(function(x){return '<li>'+esc(typeof x==='string'?x:(x.action||JSON.stringify(x)))+(x&&x.impact?' <em>['+esc(x.impact)+']</em>':'')+'</li>';}).join(''))+'</ul>';}
    return '<div class="v30-card"><h3>AI-стратегия</h3><p>'+esc(s.summary||'')+'</p>'+
      '<h4>Сильные стороны</h4>'+ul(s.strengths)+'<h4>Слабые стороны</h4>'+ul(s.weaknesses)+'<h4>Действия</h4>'+ul(s.actions)+'<h4>Идеи контента</h4>'+ul(s.contentIdeas)+'</div>';
  };
  V30.html_meter=function(m){
    return '<div class="v30-meter">YT квота: <b>'+m.ytUnits+'</b> ед. · Mistral: <b>'+m.mistralCalls+'</b> вызовов (~'+m.mistralTokensEst+' токенов) · запросов '+m.requests+' (дедуп '+m.deduped+')</div>';
  };

  /* gather videos from app STATE defensively */
  V30.collectVideos=function(){
    var S=(typeof window!=='undefined'&&window.STATE)||{};
    var v=[].concat(S.longs||[], S.shorts||[], S.videos||[]);
    if(!v.length && Array.isArray(S.items)) v=S.items.slice();
    return v;
  };
  V30.collectCompetitors=function(){ var S=(typeof window!=='undefined'&&window.STATE)||{}; return S.competitors||S.comps||[]; };

  /* ---------- CSS + DOM shell ---------- */
  function injectCSS(){
    if(document.getElementById('v30-css'))return;
    var s=document.createElement('style'); s.id='v30-css';
    s.textContent=[
      '#v30-modal{position:fixed;inset:0;z-index:99998;background:rgba(8,7,10,.86);backdrop-filter:blur(6px);display:none;overflow:auto;padding:28px}',
      '#v30-modal.open{display:block}',
      '.v30-wrap{max-width:920px;margin:0 auto;color:#eee;font:14px/1.5 system-ui}',
      '.v30-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}',
      '.v30-head h2{margin:0;font-size:20px}',
      '.v30-x{background:#222;color:#fff;border:none;border-radius:8px;padding:8px 12px;cursor:pointer}',
      '.v30-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:16px;margin-bottom:14px}',
      '.v30-card h3{margin:0 0 10px;font-size:16px;color:#FFB37A}',
      '.v30-card h4{margin:12px 0 6px;font-size:13px;color:#bbb}',
      '.v30-big{font-size:46px;font-weight:800}.v30-big small{font-size:18px;color:#888}',
      '.v30-ci{color:#9aa;font-size:12px;margin-bottom:8px}',
      '.v30-fac{display:flex;align-items:center;gap:10px;margin:6px 0;font-size:13px}.v30-fac span{width:160px;color:#ccc}.v30-fac b{width:34px;text-align:right}',
      '.v30-bar{flex:1;height:8px;background:rgba(255,255,255,.08);border-radius:6px;overflow:hidden}.v30-bar i{display:block;height:100%;background:linear-gradient(90deg,#FF2D55,#FFB37A)}',
      '.v30-tbl{width:100%;border-collapse:collapse;font-size:13px}.v30-tbl th,.v30-tbl td{text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.06)}',
      '.v30-up{color:#4ade80;font-weight:700}.v30-down{color:#f87171;font-weight:700}',
      '.v30-list{margin:4px 0;padding-left:18px}.v30-list li{margin:3px 0}',
      '.v30-meter{font-size:12px;color:#8ab;background:rgba(0,180,255,.06);border:1px solid rgba(0,180,255,.15);border-radius:10px;padding:8px 12px;margin-bottom:14px}',
      '.v30-btns{display:flex;gap:10px;margin-bottom:14px}.v30-btns button{background:#1c1c22;color:#fff;border:1px solid #333;border-radius:8px;padding:8px 14px;cursor:pointer}',
      '.v30-load{color:#FFB37A;padding:20px;text-align:center}',
      '@media (max-width:600px){#v30-modal{padding:0}.v30-wrap{max-width:100%;min-height:100%;border-radius:0;background:#0c0b0f;padding:16px 14px env(safe-area-inset-bottom) 14px}.v30-head{position:sticky;top:0;background:#0c0b0f;z-index:2;padding:10px 0;margin:0 0 8px}.v30-head h2{font-size:17px}.v30-fac{flex-wrap:wrap;gap:8px}.v30-fac span{width:auto;min-width:120px}.v30-big{font-size:34px}.v30-tbl{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch}.v30-acts{flex-wrap:wrap}.v30-acts button{flex:1 1 auto}}'
    ].join('\n');
    document.head.appendChild(s);
  }

  function ensureShell(){
    injectCSS();
    /* FAB убран — вход в «Аналитику+» перенесён в штаб (профиль) */
    if(!document.getElementById('v30-modal')){
      var m=document.createElement('div'); m.id='v30-modal';
      m.innerHTML='<div class="v30-wrap"><div class="v30-head"><h2>✦ Глубокая аналитика</h2><button class="v30-x" id="v30-close">Закрыть ✕</button></div><div class="v30-btns"><button id="v30-csv">⬇ CSV</button><button id="v30-refresh">↻ Пересчитать</button><button id="v30-ai">✦ AI-стратегия</button></div><div id="v30-body"><div class="v30-load">Готов к анализу.</div></div></div>';
      document.body.appendChild(m);
      document.getElementById('v30-close').onclick=function(){ m.classList.remove('open'); };
      document.getElementById('v30-csv').onclick=function(){ V30.downloadCSV(); };
      document.getElementById('v30-refresh').onclick=function(){ V30.run(); };
      document.getElementById('v30-ai').onclick=function(){ V30.runAI(); };
    }
  }

  V30.downloadCSV=function(){
    var v=V30.collectVideos(); if(!v.length){alert('Нет данных. Сначала проведите аудит канала.');return;}
    var csv=V30.toCSV(v); var blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); var a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='viora-export-'+Date.now()+'.csv'; a.click();
  };

  /* compute everything (no AI) and render */
  V30._last=null;
  V30.run=async function(){
    var body=document.getElementById('v30-body'); if(body)body.innerHTML='<div class="v30-load">Считаю аналитику…</div>';
    var vids=V30.collectVideos();
    if(!vids.length){ if(body)body.innerHTML='<div class="v30-load">Нет данных канала. Сначала проведите аудит, затем откройте «Аналитика+».</div>'; return; }
    var S=(window.STATE||{});
    var sb=V30.scoreBreakdown(S.channel||{}, vids);
    var tr=V30.trends(vids);
    var cl=V30.clusterTopics(vids);
    var comps=V30.collectCompetitors();
    var bm=comps.length? V30.benchmark(S.channel||{}, vids, comps) : null;
    var pack={score:sb, trends:{momentum:tr.momentum, months:tr.months.length, breakouts:tr.breakouts}, topics:cl.topics.slice(0,8), benchmark:bm};
    V30._last={vids:vids, sb:sb, tr:tr, cl:cl, bm:bm, pack:pack};
    var html=V30.html_meter(V30.meter())+V30.html_score(sb)+V30.html_trends(tr)+V30.html_topics(cl)+(bm?V30.html_benchmark(bm):'');
    if(body)body.innerHTML=html;
    V30._drawTrend(tr);
  };

  V30._drawTrend=function(tr){
    try{
      var cv=document.getElementById('v30-trend-canvas'); if(!cv||typeof Chart==='undefined')return;
      var labels=tr.months.map(function(m){return m.month;});
      var data=tr.months.map(function(m){return m.medVpd;});
      var up=tr.months.map(function(m){return m.uploads;});
      var cfg={
        type:'line',
        data:{ labels:labels, datasets:[
          { label:'медиана VPD', data:data, borderColor:'#FF2D55', tension:0.3, yAxisID:'y' },
          { label:'загрузки', data:up, borderColor:'#5BC0EB', tension:0.3, yAxisID:'y1' }
        ]},
        options:{
          plugins:{ legend:{ labels:{ color:'#ccc' } } },
          scales:{
            x:{ ticks:{ color:'#888' } },
            y:{ ticks:{ color:'#888' } },
            y1:{ position:'right', ticks:{ color:'#888' }, grid:{ display:false } }
          }
        }
      };
      new Chart(cv.getContext('2d'), cfg);
    }catch(e){ console.warn('v30 chart', e); }
  };

  V30.runAI=async function(){
    if(!V30._last){ await V30.run(); }
    var body=document.getElementById('v30-body'); if(!V30._last)return;
    var note=document.createElement('div'); note.className='v30-load'; note.textContent='AI формирует стратегию…'; if(body)body.appendChild(note);
    try{
      var sm=null;
      // sentiment from top video comments (best-effort, 1 video to save quota)
      try{ var top=V30._last.vids.slice().sort(function(a,b){return V30.vVpd(b)-V30.vVpd(a);})[0]; if(top&&top.videoId){ var cm=await V30.fetchComments(top.videoId,80); sm=V30.summarizeComments(cm); } }catch(e){}
      var syn=await V30.synthesize(V30._last.pack);
      var extra=(sm?V30.html_sentiment(sm):'')+V30.html_synth(syn);
      note.remove();
      var holder=document.createElement('div'); holder.innerHTML=extra; if(body)body.appendChild(holder);
      // refresh meter
      var m0=document.querySelector('.v30-meter'); if(m0)m0.outerHTML=V30.html_meter(V30.meter());
    }catch(e){ note.textContent='AI-ошибка: '+e.message; }
  };

  V30.open=function(){ ensureShell(); document.getElementById('v30-modal').classList.add('open'); V30.run(); };

  /* auto-mount the FAB when DOM ready */
  if(typeof window!=='undefined'){
    window.V30=V30;
    function mount(){ try{ ensureShell(); }catch(e){console.warn('v30 mount',e);} }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
  }
})();
