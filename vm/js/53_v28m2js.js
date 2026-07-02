(function(){
'use strict';
if(window.__v28m2)return;window.__v28m2=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function num(x){x=+x;return isFinite(x)?x:0;}
function median(a){a=(a||[]).filter(function(x){return isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function avg(a){a=(a||[]).filter(function(x){return isFinite(x);});return a.length?a.reduce(function(s,x){return s+x;},0)/a.length:0;}
function vids(){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v&&v.title;});}

/* ---------- m2.1 глубже локальный анализ ---------- */
function titleLenInsight(arr){
  if(!arr||arr.length<6)return '';
  var sorted=arr.slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);});
  var k=Math.max(2,Math.floor(sorted.length/3));
  var topLen=Math.round(avg(sorted.slice(0,k).map(function(v){return String(v.title||'').length;})));
  var botLen=Math.round(avg(sorted.slice(-k).map(function(v){return String(v.title||'').length;})));
  if(!topLen||!botLen||Math.abs(topLen-botLen)<6)return '';
  return 'Длина заголовка: у хитов в среднем '+topLen+' символов против '+botLen+' у слабых — целься в ~'+topLen+'.';
}
function formatROI(){
  var s=S();var longs=(s.longs||[]).filter(function(v){return v&&v.title;});var shorts=(s.shorts||[]).filter(function(v){return v&&v.title;});
  if(longs.length<3&&shorts.length<3)return '';
  var ml=Math.round(median(longs.map(function(v){return num(v.viewsPerDay);})));
  var ms=Math.round(median(shorts.map(function(v){return num(v.viewsPerDay);})));
  if(ml&&ms){var who=ms>ml*1.3?'Shorts':(ml>ms*1.3?'длинные':'');var r=who==='Shorts'?+(ms/Math.max(1,ml)).toFixed(1):(who==='длинные'?+(ml/Math.max(1,ms)).toFixed(1):0);return 'ROI формата: длинные '+ml+'/день vs Shorts '+ms+'/день'+(who?(' — вкладывайся в '+who+' (в '+r+'× выгоднее)'):' (сопоставимо)')+'.';}
  if(ml)return 'Длинные: медиана '+ml+' просм/день.';
  if(ms)return 'Shorts: медиана '+ms+' просм/день.';
  return '';
}
function recentWinners(){
  var all=vids().filter(function(v){return num(v.age)>0&&num(v.age)<=90;});
  if(all.length<2)return '';
  var top=all.slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);}).slice(0,3);
  return 'Свежие хиты (90 дней): '+top.map(function(v){return '«'+v.title+'» ('+Math.round(num(v.viewsPerDay))+'/день)';}).join('; ')+' — формат ещё горячий, развивай его.';
}
function comboInsight(){
  var combos=(S().triggerCombos||[]);if(!combos.length)return '';
  var rows=combos.map(function(c){
    var label=c.name||c.label||[c.a,c.b].filter(Boolean).join(' + ')||((c.triggers&&c.triggers.join&&c.triggers.join(' + '))||'');
    var lift=num(c.lift||c.liftVsRest);
    return {label:label,lift:lift};
  }).filter(function(x){return x.label&&x.lift>1.1;}).sort(function(a,b){return b.lift-a.lift;}).slice(0,3);
  if(!rows.length)return '';
  return 'Сильные связки в заголовках: '+rows.map(function(r){return '«'+r.label+'» (×'+(+r.lift.toFixed(2))+')';}).join('; ')+'.';
}
function deeperText(){
  try{
    if(!S().channel)return '';
    var L=[];
    var longs=(S().longs||[]).filter(function(v){return v&&v.title;});
    var tl=titleLenInsight(longs.length>=6?longs:vids());if(tl)L.push(tl);
    var fr=formatROI();if(fr)L.push(fr);
    var rw=recentWinners();if(rw)L.push(rw);
    var ci=comboInsight();if(ci)L.push(ci);
    if(!L.length)return '';
    return 'ДОПОЛНИТЕЛЬНЫЙ АНАЛИЗ КАНАЛА:\n'+L.join('\n');
  }catch(e){return '';}
}

/* ---------- m2.2 нишевой радар (живой YouTube-серч) ---------- */
function nicheQuery(){
  try{
    var m=lget('viora_user_model',null);if(m&&m.niche)return m.niche;
    var s=S();if(s.primaryNiche)return s.primaryNiche;
    var p=lget('viora_profile_v1',null);if(p&&p.niche)return p.niche;
    var el=D.getElementById('v25niche')||D.getElementById('ideaInput');if(el&&el.value&&el.value.trim())return el.value.trim();
  }catch(e){}
  return '';
}
var RADAR_KEY='viora_v28_radar',RADAR_TTL=6*3600*1000;
function radarCached(){var r=lget(RADAR_KEY,null);if(r&&r.niche===nicheQuery()&&(Date.now()-r.ts<RADAR_TTL))return r;return null;}
var _radarBusy=false;
function refreshRadar(force){
  try{
    var niche=nicheQuery();if(!niche)return;
    if(_radarBusy)return;
    if(!force&&radarCached())return;
    if(typeof W.ytFetch!=='function')return;
    _radarBusy=true;
    var since=new Date(Date.now()-60*864e5).toISOString();
    Promise.resolve(W.ytFetch('search?part=snippet&q='+encodeURIComponent(niche)+'&type=video&maxResults=20&order=viewCount&publishedAfter='+encodeURIComponent(since)+'&relevanceLanguage=ru')).then(function(s){
      var items=(s&&s.items)||[];
      var ids=items.map(function(it){return it.id&&it.id.videoId;}).filter(Boolean).slice(0,20);
      if(!ids.length){_radarBusy=false;return null;}
      return Promise.resolve(W.ytFetch('videos?part=statistics,snippet&id='+ids.join(','))).then(function(vd){
        var vs=(vd&&vd.items)||[];var now=Date.now();
        var rows=vs.map(function(v){
          var pub=new Date(v.snippet.publishedAt).getTime();var ageDays=Math.max(1,(now-pub)/864e5);
          var views=num(v.statistics&&v.statistics.viewCount);
          return {title:v.snippet.title,channel:v.snippet.channelTitle,views:views,vpd:Math.round(views/ageDays),ageDays:Math.round(ageDays)};
        }).filter(function(r){return r.views>0;}).sort(function(a,b){return b.vpd-a.vpd;}).slice(0,6);
        if(rows.length)lset(RADAR_KEY,{ts:now,niche:niche,rows:rows});
        _radarBusy=false;
      });
    }).catch(function(){_radarBusy=false;});
  }catch(e){_radarBusy=false;}
}
W.v28RadarRefresh=function(){refreshRadar(true);};
function radarText(){
  try{
    var r=radarCached();if(!r||!r.rows||!r.rows.length)return '';
    return 'ЖИВОЙ СПРОС В НИШЕ «'+r.niche+'» (реальные ролики YouTube за 60 дней, по росту просмотров/день — это то, что аудитория смотрит ПРЯМО СЕЙЧАС):\n'+r.rows.map(function(x,i){return (i+1)+') «'+x.title+'» — '+x.channel+' ('+x.vpd+'/день, '+x.views+' просмотров за '+x.ageDays+' дн)';}).join('\n');
  }catch(e){return '';}
}

/* ---------- m2.3 инъекция в ctx (доп.анализ + радар + связка) ---------- */
function enhanceCtxM2(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v28m2ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    var add=[];
    try{var d=deeperText();if(d)add.push(d);}catch(e){}
    try{var r=radarText();if(r)add.push(r);}catch(e){}
    try{
      if(add.length){
        add.push('СВЯЗКА (обязательно): скрести победные паттерны канала с живым спросом в нише и предложи КОНКРЕТНО, что снять следующим — с готовым заголовком и почему это залетит сейчас. Если живой спрос и сильные стороны канала пересекаются — это приоритет №1.');
        return base?(base+'\n\n'+add.join('\n\n')):add.join('\n\n');
      }
    }catch(e){}
    return base;
  };
  wrapped.__v28m2ctx=true;W.v26ctx=wrapped;
}

function tick(){try{enhanceCtxM2();}catch(e){}try{refreshRadar(false);}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,800);setTimeout(boot,2000);setTimeout(function(){refreshRadar(false);},3500);
setInterval(tick,6000);
W.__v28m2api={deeperText:deeperText,radarText:radarText,radarRefresh:function(){refreshRadar(true);},niche:nicheQuery};
})();
