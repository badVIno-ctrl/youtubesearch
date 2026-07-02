(function(){
'use strict';
if(window.__v28m5)return;window.__v28m5=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function num(x){x=+x;return isFinite(x)?x:0;}
function median(a){a=(a||[]).filter(function(x){return isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function isReco(sys){try{return /продюсер|рекоменд|совет|план|next_video|action_plan|иде|заголов|сценар|стратег|рост|утечк|воронк|разбор|аудит|тренд|перехват|вердикт|фокус/i.test(String(sys||''));}catch(e){return false;}}

/* =================== m5.3 GAP-АНАЛИЗ КОНКУРЕНТОВ =================== */
function gapText(){
  try{
    var comps=S().competitors||[];if(!comps.length)return '';
    var rows=[];
    comps.slice(0,4).forEach(function(c){
      var name=(c&&c.ch&&c.ch.title)||c.name||'конкурент';
      var top=((c&&c.vids)||[]).slice().sort(function(a,b){return num(b.viewsPerDay)-num(a.viewsPerDay);}).slice(0,2);
      if(top.length)rows.push(name+': '+top.map(function(v){return '«'+v.title+'» ('+Math.round(num(v.viewsPerDay))+'/день)';}).join('; '));
    });
    if(!rows.length)return '';
    return 'ЧТО ЗАЛЕТАЕТ У КОНКУРЕНТОВ (их топ-ролики по росту просмотров/день — найди форматы и углы, которых нет у тебя, и предложи адаптацию под твой канал):\n'+rows.join('\n');
  }catch(e){return '';}
}

/* =================== m5.1 АНТИ-ГАЛЛЮЦИНАЦИЯ 2.0 (числа) =================== */
function knownNumbers(){
  var s=S(),nums=[];
  function add(n){n=Math.round(+n);if(isFinite(n)&&n>0)nums.push(n);}
  var longs=(s.longs||[]),shorts=(s.shorts||[]);
  longs.concat(shorts).forEach(function(v){if(v){add(v.viewsPerDay);add(v.views);}});
  add(median(longs.map(function(v){return num(v.viewsPerDay);})));
  add(median(shorts.map(function(v){return num(v.viewsPerDay);})));
  add(median(longs.concat(shorts).map(function(v){return num(v.viewsPerDay);})));
  if(s.channel){add(s.channel.subs);add(s.channel.views);}
  (s.competitors||[]).forEach(function(c){if(!c)return;add(c.avgViews);if(c.ch){add(c.ch.subs);}(c.vids||[]).forEach(function(v){if(v){add(v.viewsPerDay);add(v.views);}});});
  var rad=lget('viora_v28_radar',null);if(rad&&rad.rows)rad.rows.forEach(function(r){add(r.vpd);add(r.views);});
  var sg=s.signals||{};if(sg.uploadMomentum){add(sg.uploadMomentum.last90&&sg.uploadMomentum.last90.medianVpd);add(sg.uploadMomentum.prev90&&sg.uploadMomentum.prev90.medianVpd);}
  return nums;
}
function numberClaims(text){
  var t=String(text||''),claims=[],re=/(\d[\d\s.,]{0,12}\d|\d)\s*(просмотр|в день|\/\s*день|подписчик)/gi,m;
  while((m=re.exec(t))){
    var pre=t.slice(Math.max(0,m.index-14),m.index).toLowerCase();
    if(/~|≈|примерн|около|оценк|прогноз|порядка|(?:^|\s)до\s/.test(pre))continue;
    var raw=String(m[1]).replace(/[\s.,]/g,'');var n=+raw;
    if(isFinite(n)&&n>=500)claims.push(n);
  }
  return claims;
}
function fabricatedNumbers(text){
  try{
    var known=knownNumbers();if(!known.length)return [];
    var bad=[],seen={};
    numberClaims(text).forEach(function(n){
      if(seen[n])return;seen[n]=1;
      var ok=known.some(function(k){return Math.abs(k-n)<=Math.max(50,k*0.25);});
      if(!ok)bad.push(n);
    });
    return bad.slice(0,5);
  }catch(e){return [];}
}
W.v28VerifyNumbers=function(text){return {fabricated:fabricatedNumbers(text)};};
var _m5busy=false;
function wrapNum(){
  var orig=W.callMistralRaw;
  if(typeof orig!=='function'||orig.__v28m5)return;
  var wrapped=function(sys,user,max){
    var self=this,args=arguments;var reco=false;try{reco=isReco(sys);}catch(e){}
    var p=Promise.resolve(orig.apply(self,args));
    if(!reco||_m5busy)return p;
    return p.then(function(r){
      try{
        var txt=(typeof r==='string')?r:JSON.stringify(r||'');
        var bad=fabricatedNumbers(txt);
        if(bad.length){
          try{console.warn('[v28m5] выдуманные числа:',bad);}catch(e){}
          _m5busy=true;
          var corr=(typeof user==='string'?user:'')+'\n\nТЫ ПРИВЁЛ ЧИСЛА, КОТОРЫХ НЕТ В ДАННЫХ КАНАЛА: '+bad.join(', ')+'. Используй ТОЛЬКО реальные метрики из доказательной базы. Если это прогноз или оценка — явно пометь словом «оценка». Перепиши.';
          return Promise.resolve(orig.call(self,sys,corr,max)).then(function(r2){_m5busy=false;return r2;},function(){_m5busy=false;return r;});
        }
      }catch(e){_m5busy=false;}
      return r;
    });
  };
  wrapped.__v28m5=true;wrapped.__v28m4=true;wrapped.__v28=true;wrapped.__v27=true;wrapped.__v26=true;
  W.callMistralRaw=wrapped;
}

/* =================== m5.2 КОМПОЗИТОР/БЮДЖЕТ КОНТЕКСТА =================== */
var BUDGET=7500;
function prio(h){
  if(/^Канал:/.test(h))return 10;
  if(/Главные рычаги|ДОКАЗАТЕЛЬНАЯ БАЗА|КОНТРАКТ ОТВЕТА/.test(h))return 9;
  if(/СОБЫТИЯ С ПРОШЛОГО|ПРАВИЛО ЧЕСТНОСТИ|УВЕРЕННОСТЬ/.test(h))return 9;
  if(/СВЯЗКА/.test(h))return 8;
  if(/КОНТЕНТ-ДНК|СУТЬ ТВОИХ/.test(h))return 7;
  if(/ДОПОЛНИТЕЛЬНЫЙ АНАЛИЗ/.test(h))return 6;
  if(/ЖИВОЙ СПРОС|ЧТО ЗАЛЕТАЕТ У КОНКУРЕНТОВ/.test(h))return 5;
  if(/ПАМЯТЬ О ТЕБЕ/.test(h))return 4;
  return 6;
}
function budget(text){
  try{
    if(!text||text.length<=BUDGET)return text;
    var parts=text.split(/\n\n+/);
    var meta=parts.map(function(p,i){return {i:i,p:p,pr:prio(p.slice(0,70))};});
    var order=meta.slice().sort(function(a,b){return a.pr-b.pr;});
    var total=text.length;
    for(var k=0;k<order.length&&total>BUDGET;k++){
      var o=order[k];if(o.pr>=9)continue;
      var keep=Math.max(180,Math.floor(o.p.length*0.4));
      if(o.p.length>keep+40){var nw=o.p.slice(0,keep)+' …';total-=(o.p.length-nw.length);parts[o.i]=nw;}
    }
    return parts.join('\n\n');
  }catch(e){return text;}
}
W.v28Budget=function(t){return budget(t);};

function enhanceCtxM5(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v28m5ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    try{
      if(S().channel){
        var g=gapText();if(g)base=base?(base+'\n\n'+g):g;
        base=base+'\n\nУВЕРЕННОСТЬ И ИСТОЧНИК: для каждого совета указывай уверенность (высокая/средняя/низкая) по объёму данных; любое число бери только из доказательной базы выше, а прогнозы помечай «оценка».';
      }
      base=budget(base);
    }catch(e){}
    return base;
  };
  wrapped.__v28m5ctx=true;W.v26ctx=wrapped;
}

function tick(){try{enhanceCtxM5();}catch(e){}try{wrapNum();}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,900);setTimeout(boot,2300);setTimeout(boot,4200);
setInterval(tick,6000);
W.__v28m5api={gapText:gapText,verifyNumbers:W.v28VerifyNumbers,budget:budget,knownNumbers:knownNumbers};
})();
