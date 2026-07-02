(function(){
'use strict';
if(window.__v28m4)return;window.__v28m4=true;
var D=document,W=window;
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function num(x){x=+x;return isFinite(x)?x:0;}
function median(a){a=(a||[]).filter(function(x){return isFinite(x);}).slice().sort(function(x,y){return x-y;});if(!a.length)return 0;var m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function vids(){var s=S();return [].concat(s.longs||[],s.shorts||[]).filter(function(v){return v&&v.title&&v.id;});}
function norm(s){return String(s||'').toLowerCase().replace(/[^\wа-яё\s]/gi,' ').replace(/\s+/g,' ').trim();}
function toks(s){return norm(s).split(' ').filter(function(w){return w.length>2;});}
function sim(a,b){var A=toks(a),B=toks(b);if(!A.length||!B.length)return 0;var setB={};B.forEach(function(w){setB[w]=1;});var inter=0;A.forEach(function(w){if(setB[w])inter++;});return inter/(A.length+B.length-inter);}
var SHOOTS_KEY='viora_shoots_v1';

/* =================== m4.1 ПЕТЛЯ ОБУЧЕНИЯ =================== */
var HIST_KEY='viora_v28_history';
function snapshot(){
  var all=vids();if(!all.length)return null;
  var vpds=all.map(function(v){return num(v.viewsPerDay);});
  return {ts:Date.now(),med:Math.round(median(vpds)),ids:all.map(function(v){return v.id;}),items:all.map(function(v){return {id:v.id,title:v.title,vpd:Math.round(num(v.viewsPerDay))};})};
}
function pushSnapshot(){
  try{
    var cur=snapshot();if(!cur)return;
    var h=lget(HIST_KEY,[]);if(!Array.isArray(h))h=[];
    var last=h[h.length-1];
    if(last){
      var sameSet=last.ids.length===cur.ids.length&&cur.ids.every(function(id){return last.ids.indexOf(id)>=0;});
      if(sameSet&&(cur.ts-last.ts<24*3600*1000))return;
    }
    h.push(cur);if(h.length>8)h=h.slice(-8);lset(HIST_KEY,h);
  }catch(e){}
}
function learning(){
  try{
    var cur=snapshot();if(!cur)return null;
    var h=lget(HIST_KEY,[]);if(!Array.isArray(h))h=[];
    var prev=null;
    for(var i=h.length-1;i>=0;i--){var hs=h[i];if(hs&&hs.ids&&hs.ids.join(',')!==cur.ids.join(',')){prev=hs;break;}}
    if(!prev)return {newVideos:[],med:cur.med};
    var prevIds={};prev.ids.forEach(function(id){prevIds[id]=1;});
    var news=cur.items.filter(function(it){return !prevIds[it.id];});
    var shoots=(lget(SHOOTS_KEY,[])||[]).map(function(s){return s&&(s.idea||s.title)||'';}).filter(Boolean);
    var trg=(S().triggerStats||[]).filter(function(t){return t&&t.verdict==='up'&&t.name;}).map(function(t){return String(t.name).toLowerCase();});
    news.forEach(function(n){
      n.x=cur.med?+(n.vpd/cur.med).toFixed(2):0;
      n.executed=shoots.some(function(sh){return sim(n.title,sh)>0.4;});
      n.usedTriggers=trg.filter(function(tr){return n.title.toLowerCase().indexOf(tr)>=0;});
    });
    news.sort(function(a,b){return b.vpd-a.vpd;});
    return {newVideos:news.slice(0,8),med:cur.med,prevMed:prev.med,prevTs:prev.ts};
  }catch(e){return null;}
}
function learningText(){
  try{
    var L=learning();if(!L||!L.newVideos||!L.newVideos.length)return '';
    var won=L.newVideos.filter(function(n){return n.x>=1.1;});
    var lost=L.newVideos.filter(function(n){return n.x>0&&n.x<0.8;});
    var out=['СОБЫТИЯ С ПРОШЛОГО РАЗБОРА (обучение на результатах — опирайся на это):'];
    out.push('Вышло новых роликов: '+L.newVideos.length+' (медиана канала '+L.med+' просм/день).');
    if(won.length)out.push('Сработали: '+won.map(function(n){return '«'+n.title+'» ('+n.vpd+'/день, ×'+n.x+(n.executed?', по твоему сохранённому плану':'')+(n.usedTriggers.length?(', триггеры: '+n.usedTriggers.join(', ')):'')+')';}).join('; ')+'.');
    if(lost.length)out.push('Слабее медианы: '+lost.map(function(n){return '«'+n.title+'» ('+n.vpd+'/день, ×'+n.x+')';}).join('; ')+'.');
    out.push('ВЫВОД ДЛЯ СОВЕТОВ: усиливай форматы и углы, что дали ×>1; не повторяй то, что просело. Если совпало с применённым советом — отметь это автору и предложи следующий шаг.');
    return out.join('\n');
  }catch(e){return '';}
}

/* =================== m4.2 АНТИ-ГАЛЛЮЦИНАЦИЯ =================== */
function realTitleList(){
  var arr=[];vids().forEach(function(v){arr.push(v.title);});
  var rad=lget('viora_v28_radar',null);if(rad&&rad.rows)rad.rows.forEach(function(r){if(r&&r.title)arr.push(r.title);});
  return arr;
}
function fabricatedRefs(text){
  try{
    var t=String(text||'');var real=realTitleList().map(norm);if(!real.length)return [];
    var refs=[],seen={},re=/(?:ролик|видео|выпуск)[а-яё]*\s+[«"]([^»"\n]{8,80})[»"]/gi,m;
    while((m=re.exec(t))){
      var q=norm(m[1]);if(!q||seen[q])continue;seen[q]=1;
      var ok=real.some(function(rt){return rt&&(rt.indexOf(q)>=0||q.indexOf(rt)>=0||sim(rt,q)>0.5);});
      if(!ok)refs.push(m[1]);
    }
    return refs.slice(0,5);
  }catch(e){return [];}
}
W.v28Verify=function(text){return {fabricated:fabricatedRefs(text)};};
function isReco(sys){try{return /продюсер|рекоменд|совет|план|next_video|action_plan|иде|заголов|сценар|стратег|рост|утечк|воронк|разбор|аудит|тренд|перехват|вердикт|фокус/i.test(String(sys||''));}catch(e){return false;}}
var _m4busy=false;
function wrapVerify(){
  var orig=W.callMistralRaw;
  if(typeof orig!=='function'||orig.__v28m4)return;
  var wrapped=function(sys,user,max){
    var self=this,args=arguments;var reco=false;try{reco=isReco(sys);}catch(e){}
    var p=Promise.resolve(orig.apply(self,args));
    if(!reco||_m4busy)return p;
    return p.then(function(r){
      try{
        var txt=(typeof r==='string')?r:JSON.stringify(r||'');
        var fab=fabricatedRefs(txt);
        if(fab.length){
          try{console.warn('[v28m4] выдуманные ролики:',fab);}catch(e){}
          _m4busy=true;
          var titles=realTitleList().slice(0,12).map(function(x){return '«'+x+'»';}).join(', ');
          var corr=(typeof user==='string'?user:'')+'\n\nТЫ СОСЛАЛСЯ НА НЕСУЩЕСТВУЮЩИЕ РОЛИКИ: '+fab.map(function(x){return '«'+x+'»';}).join(', ')+'. Это запрещено. Ссылайся на ролики канала ТОЛЬКО из этого реального списка: '+titles+'. Если нужного ролика нет — не упоминай его и не выдумывай числа. Перепиши ответ.';
          return Promise.resolve(orig.call(self,sys,corr,max)).then(function(r2){_m4busy=false;return r2;},function(e){_m4busy=false;return r;});
        }
      }catch(e){_m4busy=false;}
      return r;
    });
  };
  wrapped.__v28m4=true;wrapped.__v28=true;wrapped.__v27=true;wrapped.__v26=true;
  W.callMistralRaw=wrapped;
}

/* =================== m4.3 ПРЕДИКТОР ИДЕИ =================== */
W.v28ScoreIdea=function(title,format){
  try{
    var t=String(title||'').trim();if(!t)return {error:'Введите заголовок или идею'};
    var s=S();var score=50,reasons=[],fixes=[];var tl=t.length,low=t.toLowerCase();
    var trg=(s.triggerStats||[]).filter(function(x){return x&&x.verdict==='up'&&x.name;});
    var used=trg.filter(function(x){return low.indexOf(String(x.name).toLowerCase())>=0;});
    if(used.length){score+=Math.min(20,used.length*9);reasons.push('Есть рабочие триггеры: '+used.map(function(x){return '«'+x.name+'»';}).join(', '));}
    else if(trg.length){fixes.push('Добавь рабочий триггер, например «'+trg[0].name+'» (×'+(+num(trg[0].lift).toFixed(2))+').');}
    if(tl<25){score-=8;fixes.push('Заголовок короткий ('+tl+' симв) — добавь конкретику или цифру.');}
    else if(tl>75){score-=8;fixes.push('Заголовок длинный ('+tl+' симв) — сократи до ~50-60.');}
    else{score+=6;reasons.push('Длина в норме ('+tl+' симв).');}
    if(/\d/.test(t)){score+=7;reasons.push('Есть число — плюс к CTR.');}else{fixes.push('Добавь число (топ-5, за 7 дней, 3 ошибки).');}
    var topics=(s.topics||[]).filter(function(x){return x&&x.name;}).slice().sort(function(a,b){return num(b.medVpd)-num(a.medVpd);});
    var topMatch=null;for(var i=0;i<topics.length;i++){if(sim(t,topics[i].name)>0.2||low.indexOf(String(topics[i].name).toLowerCase())>=0){topMatch=topics[i];break;}}
    if(topMatch){var rank=topics.indexOf(topMatch);if(rank<=1){score+=14;reasons.push('Тема «'+topMatch.name+'» — из твоих сильных (медиана '+Math.round(num(topMatch.medVpd))+'/день).');}else if(topics.length>2&&rank>=topics.length-1){score-=10;fixes.push('Тема «'+topMatch.name+'» у тебя из слабых — переложи на сильную рубрику.');}}
    var ess=lget('viora_v28_essence',null),dna=ess&&ess.data&&ess.data.dna;
    if(dna){
      var ang=(dna.angles||[]).filter(function(a){return sim(t,a)>0.15;});if(ang.length){score+=10;reasons.push('Ложится в выигрышный угол ДНК: '+ang[0]+'.');}
      (dna.avoid||[]).forEach(function(av){if(sim(t,av)>0.25){score-=10;fixes.push('Похоже на то, что не заходит у тебя: '+av+'.');}});
    }
    var rad=lget('viora_v28_radar',null);
    if(rad&&rad.rows){var hot=null;for(var j=0;j<rad.rows.length;j++){if(sim(t,rad.rows[j].title)>0.2){hot=rad.rows[j];break;}}if(hot){score+=12;reasons.push('Совпадает с живым спросом ниши: «'+hot.title+'» ('+hot.vpd+'/день сейчас).');}}
    if(format){var f=String(format).toLowerCase();var sg=s.signals&&s.signals.durationSweetSpot;if(/long|длин/.test(f)&&sg&&sg.best)reasons.push('Лучшая длина у тебя — '+sg.best+'.');}
    score=Math.max(1,Math.min(99,Math.round(score)));
    var band=score>=70?'высокий':(score>=45?'средний':'низкий');
    return {score:score,band:band,reasons:reasons,fixes:fixes};
  }catch(e){return {error:'Не удалось оценить'};}
};

/* =================== m4.4 ИНЪЕКЦИЯ В CTX =================== */
function enhanceCtxM4(){
  var orig=W.v26ctx;
  if(typeof orig!=='function'||orig.__v28m4ctx)return;
  var wrapped=function(){
    var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
    var add=[];
    try{if(S().channel){var lt=learningText();if(lt)add.push(lt);}}catch(e){}
    try{if(S().channel)add.push('ПРАВИЛО ЧЕСТНОСТИ: ссылайся на ролики канала ТОЛЬКО по реальным названиям из доказательной базы выше; не придумывай несуществующие ролики и не выдумывай числа. Если данных нет — скажи прямо.');}catch(e){}
    try{if(add.length)return base?(base+'\n\n'+add.join('\n\n')):add.join('\n\n');}catch(e){}
    return base;
  };
  wrapped.__v28m4ctx=true;W.v26ctx=wrapped;
}

function tick(){try{pushSnapshot();}catch(e){}try{enhanceCtxM4();}catch(e){}try{wrapVerify();}catch(e){}}
function boot(){tick();}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,900);setTimeout(boot,2300);setTimeout(boot,4200);
setInterval(tick,6000);
W.__v28m4api={scoreIdea:W.v28ScoreIdea,learning:learning,learningText:learningText,verify:W.v28Verify,snapshot:function(){pushSnapshot();return lget(HIST_KEY,[]);}};
})();
