(function(){
'use strict';
if(window.__v29m6)return;window.__v29m6=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function num(x){x=+x;return isFinite(x)?x:0;}

/* =================== m6.B ПРОАКТИВНЫЕ ПОДСКАЗКИ =================== */
function v29Suggest(){
  var out=[];
  try{
    var ev=(typeof W.v28evidence==='function')?W.v28evidence():null;
    if(ev&&ev.ok&&ev.levers)ev.levers.slice(0,3).forEach(function(l){out.push({score:num(l.score)+2,text:l.lever,why:'рычаг из данных канала'});});
    var rad=lget('viora_v28_radar',null);
    if(rad&&rad.rows&&rad.rows[0])out.push({score:3.4,text:'Сними под живой спрос ниши: «'+rad.rows[0].title+'» сейчас растёт ('+rad.rows[0].vpd+'/день) — адаптируй формат под свой канал.',why:'живой спрос ниши'});
    var ess=lget('viora_v28_essence',null),dna=ess&&ess.data&&ess.data.dna;
    if(dna&&dna.angles&&dna.angles[0])out.push({score:2.6,text:'Сделай ролик в выигрышном угле «'+dna.angles[0]+'» — он уже резонирует с твоей аудиторией.',why:'контент-ДНК'});
    if(dna&&dna.wants&&dna.wants[0])out.push({score:2.4,text:'Закрой запрос аудитории: «'+dna.wants[0]+'» (из комментариев) — отдельным роликом.',why:'голос аудитории'});
    var comps=S().competitors||[];
    if(comps[0]&&comps[0].vids&&comps[0].vids.length){var cv=comps[0].vids.slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);})[0];if(cv)out.push({score:2.2,text:'У конкурента залетел «'+cv.title+'» ('+Math.round(num(cv.viewsPerDay))+'/день) — сделай свою версию в этом формате.',why:'gap конкурентов'});}
    var r2=lget('viora_v29_radar2',null);
    if(r2&&r2.patterns&&r2.patterns.commonWords&&r2.patterns.commonWords.length)out.push({score:2.0,text:'В трендовых заголовках ниши часто: '+r2.patterns.commonWords.slice(0,4).join(', ')+' — впиши релевантное в свой заголовок.',why:'паттерны заголовков'});
  }catch(e){}
  out.sort(function(a,b){return b.score-a.score;});
  var seen={},res=[];out.forEach(function(x){var k=(x.text||'').slice(0,30);if(!seen[k]){seen[k]=1;res.push(x);}});
  return res.slice(0,5);
}
W.v29Suggest=v29Suggest;
function suggestText(){
  try{var s=v29Suggest();if(!s.length)return '';return 'ПРОАКТИВНАЯ ПОДСКАЗКА ВИОРЫ (предложи автору это первым делом, если уместно к запросу): '+s[0].text;}catch(e){return '';}
}

/* =================== m6.C УГЛУБЛЁННЫЙ СЕРЧ (мультирадар) =================== */
var R2_KEY='viora_v29_radar2',R2_TTL=6*3600*1000;
var STOP={'и':1,'в':1,'на':1,'с':1,'по':1,'за':1,'для':1,'как':1,'что':1,'это':1,'не':1,'из':1,'до':1,'от':1,'the':1,'a':1,'to':1,'of':1};
function niche(){
  try{var m=lget('viora_user_model',null);if(m&&m.niche)return m.niche;var s=S();if(s.primaryNiche)return s.primaryNiche;var p=lget('viora_profile_v1',null);if(p&&p.niche)return p.niche;}catch(e){}
  return '';
}
function topTopic(){try{var t=(S().topics||[]).filter(function(x){return x&&x.name;}).slice().sort(function(a,b){return num(b.medVpd)-num(a.medVpd);});return t[0]&&t[0].name;}catch(e){return '';}}
function titlePatterns(titles){
  if(!titles.length)return null;
  var lens=titles.map(function(t){return String(t).length;});
  var avg=Math.round(lens.reduce(function(s,x){return s+x;},0)/lens.length);
  var q=titles.filter(function(t){return /\?/.test(t);}).length;
  var nn=titles.filter(function(t){return /\d/.test(t);}).length;
  var freq={};
  titles.forEach(function(t){String(t).toLowerCase().replace(/[^\wа-яё\s]/gi,' ').split(/\s+/).forEach(function(w){if(w.length>3&&!STOP[w])freq[w]=(freq[w]||0)+1;});});
  var common=Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];}).filter(function(w){return freq[w]>=2;}).slice(0,6);
  return {avgLen:avg,pctQuestion:Math.round(q*100/titles.length),pctNumber:Math.round(nn*100/titles.length),commonWords:common};
}
var _r2busy=false;
function refreshDeepRadar(force){
  try{
    var n=niche();if(!n)return;
    if(_r2busy)return;
    var cur=lget(R2_KEY,null);if(!force&&cur&&cur.niche===n&&(Date.now()-cur.ts<R2_TTL))return;
    if(typeof W.ytFetch!=='function')return;
    _r2busy=true;
    var since=new Date(Date.now()-60*864e5).toISOString();
    var queries=[n];var tt=topTopic();if(tt&&tt.toLowerCase()!==n.toLowerCase())queries.push(tt);
    var jobs=queries.map(function(qq){return Promise.resolve(W.ytFetch('search?part=snippet&q='+encodeURIComponent(qq)+'&type=video&maxResults=15&order=viewCount&publishedAfter='+encodeURIComponent(since)+'&relevanceLanguage=ru')).then(function(s){return (s&&s.items)||[];}).catch(function(){return [];});});
    Promise.all(jobs).then(function(lists){
      var ids=[],seen={};lists.forEach(function(items){items.forEach(function(it){var id=it.id&&it.id.videoId;if(id&&!seen[id]){seen[id]=1;ids.push(id);}});});
      ids=ids.slice(0,30);if(!ids.length){_r2busy=false;return null;}
      return Promise.resolve(W.ytFetch('videos?part=statistics,snippet&id='+ids.join(','))).then(function(vd){
        var vs=(vd&&vd.items)||[],now=Date.now();
        var rows=vs.map(function(v){var pub=new Date(v.snippet.publishedAt).getTime();var ageD=Math.max(1,(now-pub)/864e5);var views=num(v.statistics&&v.statistics.viewCount);return {title:v.snippet.title,channel:v.snippet.channelTitle,vpd:Math.round(views/ageD),views:views};}).filter(function(r){return r.views>0;}).sort(function(a,b){return b.vpd-a.vpd;}).slice(0,8);
        var pats=titlePatterns(rows.map(function(r){return r.title;}));
        if(rows.length)lset(R2_KEY,{ts:now,niche:n,queries:queries,rows:rows,patterns:pats});
        _r2busy=false;
      });
    }).catch(function(){_r2busy=false;});
  }catch(e){_r2busy=false;}
}
W.v29DeepRadarRefresh=function(){refreshDeepRadar(true);};
function deepRadarText(){
  try{
    var r=lget(R2_KEY,null);if(!r||!r.rows||!r.rows.length)return '';
    var L=['РАСШИРЕННЫЙ ЖИВОЙ СЕРЧ (по нише и твоей сильной теме — реальные растущие ролики YouTube за 60 дней):'];
    r.rows.slice(0,6).forEach(function(x,i){L.push((i+1)+') «'+x.title+'» — '+x.channel+' ('+x.vpd+'/день)');});
    if(r.patterns){var p=r.patterns;L.push('ПАТТЕРНЫ ТРЕНДОВЫХ ЗАГОЛОВКОВ: средняя длина '+p.avgLen+' симв; '+p.pctQuestion+'% с вопросом; '+p.pctNumber+'% с числом'+(p.commonWords&&p.commonWords.length?('; частые слова: '+p.commonWords.join(', ')):'')+'.');}
    return L.join('\n');
  }catch(e){return '';}
}

/* =================== m6.D ЕДИНЫЙ АУДИТ ЧЕСТНОСТИ =================== */
function impossiblePercents(text){
  try{var bad=[],re=/(\d{3,})\s*%/g,m;while((m=re.exec(String(text||'')))){var n=+m[1];if(n>300)bad.push(n+'%');}return bad.slice(0,5);}catch(e){return [];}
}
W.v29Audit=function(text){
  var res={fabricatedTitles:[],fabricatedNumbers:[],impossiblePercents:impossiblePercents(text)};
  try{if(typeof W.v28Verify==='function')res.fabricatedTitles=(W.v28Verify(text)||{}).fabricated||[];}catch(e){}
  try{if(typeof W.v28VerifyNumbers==='function')res.fabricatedNumbers=(W.v28VerifyNumbers(text)||{}).fabricated||[];}catch(e){}
  res.clean=!res.fabricatedTitles.length&&!res.fabricatedNumbers.length&&!res.impossiblePercents.length;
  return res;
};

/* =================== m6.A МЫСЛИТЕЛЬНЫЙ КАРКАС + ИНЪЕКЦИЯ =================== */
var SCAFFOLD='МЫСЛИТЕЛЬНЫЙ ПРОЦЕСС (внутренне, до ответа): 1) что говорят данные и доказательная база; 2) гипотеза — почему так; 3) проверь гипотезу против реальных цифр, Контент-ДНК и конкурентов; 4) оставь только подтверждённое → вывод + конкретное действие. САМО-ПРОВЕРКА перед выдачей: каждое число и название ролика сверь с базой выше — неподтверждённое выкинь; если уверенности нет, прямо скажи об этом, а не выдумывай. Веди от самого важного рычага к деталям.';
function enhanceCtxM6(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v29m6ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    var add=[];
    try{if(S().channel){var dr=deepRadarText();if(dr)add.push(dr);}}catch(e){}
    try{var sg=suggestText();if(sg)add.push(sg);}catch(e){}
    add.push(SCAFFOLD);
    try{return base?(base+'\n\n'+add.join('\n\n')):add.join('\n\n');}catch(e){return base;}
  };
  wrapped.__v29m6ctx=true;W.v26ctx=wrapped;
}

function tick(){try{enhanceCtxM6();}catch(e){}try{refreshDeepRadar(false);}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,1000);setTimeout(boot,2500);setTimeout(function(){refreshDeepRadar(false);},4500);
setInterval(tick,7000);
W.__v29m6api={suggest:v29Suggest,suggestText:suggestText,deepRadarText:deepRadarText,deepRadarRefresh:function(){refreshDeepRadar(true);},audit:W.v29Audit,titlePatterns:titlePatterns};
})();
