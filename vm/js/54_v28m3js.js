(function(){
'use strict';
if(window.__v28m3)return;window.__v28m3=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function num(x){x=+x;return isFinite(x)?x:0;}
function vids(){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v&&v.title&&v.id;});}
function parseJSON(r){if(r&&typeof r==='object')return r;if(typeof r!=='string')return null;try{return JSON.parse(r);}catch(e){}try{var m=r.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);}catch(e2){}return null;}
function topComments(items){
  return (items||[]).slice(0,10).map(function(it){
    try{var s=it&&it.snippet&&it.snippet.topLevelComment&&it.snippet.topLevelComment.snippet;var txt=(s&&(s.textDisplay||s.textOriginal))||'';return String(txt).replace(/<[^>]+>/g,' ').replace(/&[a-z]+;/gi,' ').replace(/\s+/g,' ').trim().slice(0,160);}catch(e){return '';}
  }).filter(function(x){return x&&x.length>3;}).slice(0,8);
}

var ESS_KEY='viora_v28_essence',ESS_TTL=24*3600*1000;
function topTargets(){
  var all=vids();if(all.length<2)return [];
  var byVpd=all.slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);});
  function mk(v,kind){return {id:v.id,title:v.title,desc:v.desc||'',tags:v.tags||[],vpd:Math.round(num(v.viewsPerDay)),kind:kind};}
  var picks=byVpd.slice(0,4).map(function(v){return mk(v,'hit');}).concat(byVpd.slice(-2).map(function(v){return mk(v,'flop');}));
  var seen={},res=[];picks.forEach(function(t){if(t&&t.id&&!seen[t.id]){seen[t.id]=1;res.push(t);}});
  return res;
}
var _essBusy=false;
function buildEssence(force){
  try{
    if(!S().channel)return;
    if(typeof W.callMistralRaw!=='function')return;
    var targets=topTargets();if(targets.length<2)return;
    var sig=targets.map(function(t){return t.id;}).join(',');
    var cached=lget(ESS_KEY,null);
    if(!force&&cached&&cached.sig===sig&&(Date.now()-cached.ts<ESS_TTL))return;
    if(_essBusy)return;_essBusy=true;
    var withC=targets.filter(function(t){return t.kind==='hit';}).slice(0,3);
    var cmap={};
    var commentJobs=(typeof W.ytFetch==='function')?withC.map(function(t){
      return Promise.resolve(W.ytFetch('commentThreads?part=snippet&videoId='+t.id+'&maxResults=20&order=relevance&textFormat=plainText')).then(function(cd){cmap[t.id]=topComments(cd&&cd.items);}).catch(function(){cmap[t.id]=[];});
    }):[];
    Promise.all(commentJobs).then(function(){
      var payload={videos:targets.map(function(t){return {id:t.id,kind:t.kind,title:t.title,vpd:t.vpd,desc:String(t.desc||'').slice(0,400),tags:(t.tags||[]).slice(0,8),comments:cmap[t.id]||[]};})};
      var sys='Ты — аналитик YouTube-контента. По заголовку, описанию, тегам и РЕАЛЬНЫМ комментариям зрителей определи СУТЬ каждого ролика и почему он сработал или нет. Верни СТРОГО валидный JSON: {"videos":[{"id":"","essence":"о чём ролик одной фразой","angle":"угол подачи","hook":"тип крючка","promise":"что обещает зрителю","why":"почему зашёл или провалился — опирайся на цифры просмотров/день и комментарии","audience":"что зрители вынесли или просят (из комментариев)"}],"dna":{"angles":["выигрышные углы подачи"],"hooks":["работающие крючки"],"wants":["чего хочет аудитория"],"avoid":["что не заходит"]}}. Конкретно, по-русски, без общих фраз.';
      var user='Виора знает контекст канала. Извлеки суть этих роликов на основе заголовков, описаний, тегов и реальных комментариев:\n'+JSON.stringify(payload);
      return Promise.resolve(W.callMistralRaw(sys,user,2200)).then(function(r){
        var data=parseJSON(r);
        if(data&&(data.videos||data.dna)){var meta={};targets.forEach(function(t){meta[t.id]={title:t.title,vpd:t.vpd,kind:t.kind};});lset(ESS_KEY,{ts:Date.now(),sig:sig,data:data,meta:meta});}
        _essBusy=false;
      });
    }).catch(function(){_essBusy=false;});
  }catch(e){_essBusy=false;}
}
W.v28EssenceRefresh=function(){buildEssence(true);};

function essenceText(){
  try{
    var c=lget(ESS_KEY,null);if(!c||!c.data)return '';
    var d=c.data,meta=c.meta||{};
    var L=['СУТЬ ТВОИХ РОЛИКОВ И ГОЛОС АУДИТОРИИ (понимание контента, не только метрики):'];
    (d.videos||[]).slice(0,6).forEach(function(v){
      var ti=(meta[v.id]&&meta[v.id].title)||v.title||'ролик';
      var parts=[];
      if(v.essence)parts.push('суть: '+v.essence);
      if(v.angle)parts.push('угол: '+v.angle);
      if(v.hook)parts.push('крючок: '+v.hook);
      if(v.why)parts.push('почему: '+v.why);
      if(v.audience)parts.push('аудитория: '+v.audience);
      if(parts.length)L.push('«'+ti+'» — '+parts.join('; '));
    });
    var dna=d.dna||{},dl=[];
    if(dna.angles&&dna.angles.length)dl.push('выигрышные углы: '+dna.angles.slice(0,5).join('; '));
    if(dna.hooks&&dna.hooks.length)dl.push('работающие крючки: '+dna.hooks.slice(0,5).join('; '));
    if(dna.wants&&dna.wants.length)dl.push('запросы аудитории: '+dna.wants.slice(0,5).join('; '));
    if(dna.avoid&&dna.avoid.length)dl.push('не заходит: '+dna.avoid.slice(0,5).join('; '));
    if(dl.length)L.push('КОНТЕНТ-ДНК КАНАЛА: '+dl.join('. ')+'.');
    if(L.length<2)return '';
    L.push('ИСПОЛЬЗУЙ СУТЬ: предлагай идеи в выигрышных углах и крючках под реальные запросы аудитории (из комментариев); не повторяй то, что не заходит.');
    return L.join('\n');
  }catch(e){return '';}
}

function parseVid(s){s=String(s||'').trim();var m=s.match(/(?:v=|\/shorts\/|youtu\.be\/|\/embed\/|\/live\/)([\w-]{11})/);if(m)return m[1];if(/^[\w-]{11}$/.test(s))return s;return '';}
W.v28UnderstandVideo=function(idOrUrl){
  return new Promise(function(resolve,reject){
    try{
      var id=parseVid(idOrUrl);if(!id)return reject(new Error('Не разобрал ссылку или ID видео'));
      if(typeof W.ytFetch!=='function'||typeof W.callMistralRaw!=='function')return reject(new Error('API недоступно'));
      Promise.all([
        Promise.resolve(W.ytFetch('videos?part=snippet,statistics&id='+id)).catch(function(){return null;}),
        Promise.resolve(W.ytFetch('commentThreads?part=snippet&videoId='+id+'&maxResults=20&order=relevance&textFormat=plainText')).catch(function(){return null;})
      ]).then(function(res){
        var vd=res[0],cd=res[1];var it=vd&&vd.items&&vd.items[0];
        if(!it)return reject(new Error('Видео не найдено'));
        var sn=it.snippet||{};
        var payload={title:sn.title,channel:sn.channelTitle,desc:String(sn.description||'').slice(0,600),tags:(sn.tags||[]).slice(0,10),views:num(it.statistics&&it.statistics.viewCount),comments:topComments(cd&&cd.items)};
        var sys='Ты — аналитик YouTube-контента. По заголовку, описанию, тегам и комментариям зрителей объясни СУТЬ ролика и чему он учит для собственного контента. Верни СТРОГО валидный JSON: {"essence":"о чём ролик одной фразой","angle":"угол подачи","hook":"крючок","promise":"что обещает зрителю","why":"почему заходит или нет","audience":"что выносят зрители из комментариев","steal":"что перенять в свой контент"}. Конкретно, по-русски.';
        var user='Виора знает контекст. Разбери суть этого ролика:\n'+JSON.stringify(payload);
        Promise.resolve(W.callMistralRaw(sys,user,1200)).then(function(r){var d=parseJSON(r);if(d)resolve(d);else reject(new Error('AI вернула не-JSON'));},reject);
      },reject);
    }catch(e){reject(e);}
  });
};

function enhanceCtxM3(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v28m3ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    try{if(S().channel){var e=essenceText();if(e)return base?(base+'\n\n'+e):e;}}catch(er){}
    return base;
  };
  wrapped.__v28m3ctx=true;W.v26ctx=wrapped;
}

function tick(){try{enhanceCtxM3();}catch(e){}try{buildEssence(false);}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,900);setTimeout(boot,2200);setTimeout(function(){buildEssence(false);},4000);
setInterval(tick,8000);
W.__v28m3api={buildEssence:function(){buildEssence(true);},essenceText:essenceText,understandVideo:W.v28UnderstandVideo,targets:topTargets};
})();
