/* ============================================================
   VIORA V20 — BLOCK 2 «Продюсерский мозг»
   Самодостаточный модуль. Считает всё из STATE (без запросов к API).
   Инжектится в начало #report при renderDashboard.
   Покрывает 2.1–2.6: сегменты, рубрики+тренд+сезонность, выгорание,
   разведка ниши, продюсерский вердикт, режим «просто/эксперт».
   ============================================================ */
(function(){
'use strict';
var W=window, D=document;

/* ---------- безопасные прокси к глобальным хелперам ---------- */
function qs(s,r){return (r||D).querySelector(s);}
function ST(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return (W.STATE||{});}}
function MED(a){try{return median(a)||0;}catch(e){if(!a||!a.length)return 0;var s=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;}}
function QNT(a,q){try{return quantile(a,q)||0;}catch(e){if(!a||!a.length)return 0;var s=a.slice().sort(function(x,y){return x-y;});var p=(s.length-1)*q,b=Math.floor(p),r=p-b;return s[b+1]!==undefined?s[b]+r*(s[b+1]-s[b]):s[b];}}
function E(s){try{return esc(''+(s==null?'':s));}catch(e){return (''+(s==null?'':s)).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}}
function F(n){try{return fmt(Math.round(n));}catch(e){n=Math.round(n||0);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':''+n;}}
function IMG(u){try{return safeImg(u);}catch(e){return u||'';}}
function AGE(d){try{return ageDays(d);}catch(e){return Math.max(1,(Date.now()-new Date(d).getTime())/864e5);}}
function TOAST(m,k){try{vToast(m,k||'ok');}catch(e){}}
function CLS(g){try{return classify(g);}catch(e){return null;}}
function NORM(s){try{return _norm(s);}catch(e){return (s||'').toLowerCase().replace(/ё/g,'е');}}
function COPY(t){try{copy(t);}catch(e){}}

/* ---------- состояние модуля ---------- */
var MODE_KEY='viora_b2_mode_v1';
var B2={seg:'all', mode:'simple'};
try{var sm=localStorage.getItem(MODE_KEY); if(sm==='expert'||sm==='simple')B2.mode=sm;}catch(e){}

/* ================= 2.1  СЕГМЕНТЫ + УМНОЕ ОКНО ================= */
var WINDOW_DAYS=365, MIN_SEG=12, TARGET_SEG=22;
function segFilter(seg){
  var S=ST(); var all=(S.videos||[]).filter(function(v){return v&&v.title&&v.published;});
  if(seg==='longs')return all.filter(function(v){return !v.isShort && !v.isStream;});
  if(seg==='shorts')return all.filter(function(v){return v.isShort;});
  return all.filter(function(v){return !v.isStream;}); /* 'all' = без стримов (своя механика) */
}
/* Возвращает рабочий набор + флаг архивности по каждому ролику. */
function segData(seg){
  var pool=segFilter(seg);
  var byDate=pool.slice().sort(function(a,b){return new Date(b.published)-new Date(a.published);});
  var fresh=byDate.filter(function(v){return AGE(v.published)<=WINDOW_DAYS;});
  var chosen, expanded=false, archIds={};
  if(fresh.length>=MIN_SEG || fresh.length===pool.length){
    chosen=fresh.slice();
    /* добираем старые залетевшие как «архивные хиты» (не в основной счёт окна) */
    var older=byDate.filter(function(v){return AGE(v.published)>WINDOW_DAYS;});
    if(older.length){
      var oldRanked=older.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,4);
      oldRanked.forEach(function(v){archIds[v.id]=true;chosen.push(v);});
    }
  }else{
    /* свежих мало — расширяем окно назад до TARGET_SEG, старые помечаем архивными */
    expanded=true;
    chosen=byDate.slice(0,Math.max(TARGET_SEG,fresh.length));
    chosen.forEach(function(v){if(AGE(v.published)>WINDOW_DAYS)archIds[v.id]=true;});
  }
  /* клонируем, чтобы classify не портил глобальные v.xc других сегментов */
  var clones=chosen.map(function(v){var c={};for(var k in v)c[k]=v[k];return c;});
  var cls=CLS(clones)||{hits:[],flops:[],mid:[],med:0};
  return {seg:seg, vids:clones, raw:chosen, archIds:archIds, expanded:expanded,
          freshCount:fresh.length, poolCount:pool.length, cls:cls,
          medVpd:MED(clones.map(function(v){return v.viewsPerDay;}))};
}

/* ================= 2.2  РУБРИКИ: ТРЕНД + СЕЗОННОСТЬ ================= */
/* Привязываем темы канала (STATE.topics) к роликам сегмента и считаем
   тренд по времени (растёт/умирает) + сезонность по месяцам. */
function topicSeasonality(vids){
  var byMonth=new Array(12).fill(0), cnt=new Array(12).fill(0);
  vids.forEach(function(v){var m=new Date(v.published).getMonth(); byMonth[m]+=v.viewsPerDay; cnt[m]++;});
  var avg=byMonth.map(function(s,i){return cnt[i]?s/cnt[i]:0;});
  var active=avg.map(function(x,i){return {i:i,x:x,n:cnt[i]};}).filter(function(o){return o.n>0;});
  if(active.length<3)return null;
  var overall=MED(active.map(function(o){return o.x;}))||1;
  var peaks=active.filter(function(o){return o.x>=overall*1.4;}).sort(function(a,b){return b.x-a.x;}).slice(0,3);
  if(!peaks.length)return null;
  var MN=['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  return peaks.map(function(p){return MN[p.i];});
}
function topicTimeline(vids){
  /* делим ролики темы на хронологические корзины, считаем медиану vpd по каждой */
  var byDate=vids.slice().sort(function(a,b){return new Date(a.published)-new Date(b.published);});
  var n=byDate.length; if(n<3)return {bars:[], trend:'flat'};
  var buckets=Math.min(6,Math.max(3,Math.floor(n/2)));
  var size=Math.ceil(n/buckets), bars=[];
  for(var i=0;i<n;i+=size){bars.push(MED(byDate.slice(i,i+size).map(function(v){return v.viewsPerDay;})));}
  var trend='flat';
  if(bars.length>=2){var first=MED(bars.slice(0,Math.ceil(bars.length/2))), last=MED(bars.slice(Math.floor(bars.length/2)));
    if(first>0){var r=last/first; trend=r>=1.25?'up':(r<=0.7?'down':'flat');}}
  return {bars:bars, trend:trend};
}
function buildTopics(sd){
  var S=ST(); var byId={}; sd.vids.forEach(function(v){byId[v.id]=v;});
  var defs=(S.topics||[]).filter(function(t){return t&&t.name && !t.oneoff && !/разовы|разное|прочее|все ролики/i.test(t.name);});
  var rows=[];
  if(defs.length){
    defs.forEach(function(t){
      var vs=(t.videos||[]).map(function(v){return byId[v.id];}).filter(Boolean);
      if(vs.length<2)return;
      rows.push(topicRow(t.name, vs, sd));
    });
  }
  if(rows.length<2){ /* фолбэк: грубая кластеризация по ключевым словам заголовков */
    rows=heuristicCluster(sd);
  }
  return rows.sort(function(a,b){return b.medVpd-a.medVpd;}).slice(0,7);
}
function topicRow(name, vs, sd){
  var medVpd=MED(vs.map(function(v){return v.viewsPerDay;}));
  var tl=topicTimeline(vs), season=topicSeasonality(vs);
  var recent=vs.filter(function(v){return AGE(v.published)<=90;});
  var recentMed=recent.length?MED(recent.map(function(v){return v.xc!=null?v.xc:1;})):null;
  return {name:name, count:vs.length, vids:vs, medVpd:medVpd, avgViews:MED(vs.map(function(v){return v.views;})),
    bars:tl.bars, trend:tl.trend, season:season,
    recentCount:recent.length, recentXc:recentMed,
    best:vs.slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;})[0]};
}
var STOP=' это как что для своё чтобы очень будет может если один года тебя твой твои наши shorts short когда где день дня лучший топ самый самое самые обзор новый новые видео канал the for you your with from this that have how why what '.split(/\s+/);
function heuristicCluster(sd){
  var docs=sd.vids.map(function(v){var t=NORM((v.title||'')+' '+((v.tags||[]).slice(0,6).join(' ')));var toks=t.replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(function(w){return w.length>3 && STOP.indexOf(w)<0;});return {v:v,toks:[].concat(new Set?Array.from(new Set(toks)):toks)};});
  var freq={}; docs.forEach(function(d){d.toks.forEach(function(t){freq[t]=(freq[t]||0)+1;});});
  var seeds=Object.keys(freq).filter(function(w){return freq[w]>=2;}).sort(function(a,b){return freq[b]-freq[a];}).slice(0,8);
  var groups={};
  docs.forEach(function(d){var hit=seeds.filter(function(s){return d.toks.indexOf(s)>=0;})[0]||'__o';(groups[hit]=groups[hit]||[]).push(d.v);});
  var rows=[];
  Object.keys(groups).forEach(function(k){if(k!=='__o'&&groups[k].length>=2){var nm=k.charAt(0).toUpperCase()+k.slice(1);rows.push(topicRow(nm,groups[k],sd));}});
  return rows;
}

/* ================= 2.3  ДЕТЕКТОР ВЫГОРАНИЯ + ВЫБРОСЫ ================= */
function burnVerdict(t){
  /* тема живая, только если свежие (≤90д) ролики ещё набирают */
  if(t.recentCount>=1 && t.recentXc!=null){
    if(t.recentXc>=1.0)return {tag:'live',label:'🔥 живая — снимай',note:'Свежие ролики (за ~3 мес) всё ещё набирают выше нормы канала (×'+t.recentXc.toFixed(1)+'). Тема рабочая.'};
    if(t.recentXc>=0.75)return {tag:'cool',label:'🌡 остывает',note:'Свежие ролики идут чуть ниже нормы (×'+t.recentXc.toFixed(1)+'). Тема ещё жива, но нужен новый угол/упаковка.'};
    return {tag:'dead',label:'🏴‍☠️ выгорела',note:'Свежие ролики по теме просели (×'+t.recentXc.toFixed(1)+' к норме). Старый хит был, но сейчас не тянет — не пересниматй в лоб, ищи смежный угол.'};
  }
  if(t.trend==='down')return {tag:'dead',label:'🏴‍☠️ затухает',note:'По теме давно не снимали, а исторический тренд вниз. Скорее всего выгорела — проверь свежими данными ниши.'};
  return {tag:'flat',label:'➖ нет свежих данных',note:'Давно не было роликов по теме — нельзя сказать, жива ли она. Сними тест и посмотри.'};
}
function findOutliers(sd){
  var vids=sd.vids.filter(function(v){return v.xc!=null;});
  if(vids.length<5)return [];
  var top=vids.slice().sort(function(a,b){return b.xc-a.xc;});
  var thr=Math.max(2.5, QNT(vids.map(function(v){return v.xc;}),0.95));
  return top.filter(function(v){return v.xc>=thr;}).slice(0,3).map(function(v){
    var reasons=[];
    var tl=(v.title||'').toLowerCase();
    if(/как |почему|что будет|способ|инструкц|гайд|настро/i.test(tl))reasons.push('поисковый спрос (заголовок-запрос «как/почему»)');
    if(/\d/.test(tl))reasons.push('конкретное число в заголовке');
    if(/секрет|никто|правда|развод|обман|схема|слив/i.test(tl))reasons.push('сильная интрига/эмоция в упаковке');
    if(v.isShort)reasons.push('формат Shorts — алгоритм раскатал в ленте');
    if(v.engagement>0.04)reasons.push('высокое вовлечение ('+(v.engagement*100).toFixed(1)+'%) — зрители реагировали');
    if(!reasons.length)reasons.push('возможно сторонний трафик/тренд момента — проверь источник в Studio');
    var repeat = /как |почему|гайд|инструкц|настро|способ|\d/i.test(tl) && !/слив|развод|скандал/i.test(tl);
    return {v:v, x:v.xc, reasons:reasons, repeat:repeat};
  });
}

/* ================= 2.4  РАЗВЕДКА НИШИ ================= */
function recon(){
  var S=ST(); var comps=(S.competitors||[]).filter(Boolean);
  return comps.map(function(c){
    var vids=c.vids||[];
    var last=vids.slice().sort(function(a,b){return new Date(b.published)-new Date(a.published);})[0];
    var idleDays=last?AGE(last.published):9999;
    var sh=vids.filter(function(v){return v.isShort;}), ln=vids.filter(function(v){return !v.isShort && !v.isStream;});
    var avgOwn=vids.length?vids.reduce(function(s,v){return s+v.views;},0)/vids.length:0;
    /* «эксклюзив» = ролик, выбившийся из ОБЫЧНОЙ статистики канала.
       Берём медиану (устойчивее среднего к выбросам) ×2.2 как порог. */
    var medOwn=MED(vids.map(function(v){return v.views;}))||avgOwn;
    var thr=Math.max(medOwn*2.2, avgOwn*1.6);
    var excl=vids.filter(function(v){return thr>0 && v.views>=thr;}).sort(function(a,b){return b.views-a.views;})[0];
    return {name:(c.ch&&c.ch.title)||'Канал', avatar:c.ch&&c.ch.avatar, subs:(c.ch&&c.ch.subs)||0,
      idleDays:Math.round(idleDays), live:idleDays<=60,
      shorts:sh.length, longs:ln.length, freq:c.freqPerWeek||0,
      medLong:MED(ln.map(function(v){return v.views;})), medShort:MED(sh.map(function(v){return v.views;})),
      exclusive:excl};
  });
}
function nichePatterns(reconList){
  /* общие паттерны хитов ниши по топ-роликам конкурентов */
  var S=ST(); var hits=[];
  reconList.forEach(function(r){});
  (S.competitors||[]).forEach(function(c){(c.vids||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,3).forEach(function(v){hits.push(v);});});
  if(hits.length<4)return [];
  var pats=[];
  var withNum=hits.filter(function(v){return /\d/.test(v.title);}).length/hits.length;
  if(withNum>=0.4)pats.push({ic:'🔢',t:'Числа в заголовках',d:Math.round(withNum*100)+'% хитов ниши содержат число (топ-N, суммы, сроки). Цифра обещает конкретику — добавляй в заголовки.'});
  var withQ=hits.filter(function(v){return /как |почему|что |зачем|стоит ли|\?/i.test(v.title);}).length/hits.length;
  if(withQ>=0.35)pats.push({ic:'❓',t:'Вопрос / запрос',d:Math.round(withQ*100)+'% хитов — это ответ на прямой вопрос («как», «почему»). Это поисковый трафик. Закрывай реальные запросы новичков.'});
  var fear=hits.filter(function(v){return /ошибк|нельзя|развод|обман|опасн|потеря|никогда|перестань|хватит/i.test(v.title);}).length/hits.length;
  if(fear>=0.25)pats.push({ic:'⚠️',t:'Триггер страха/потери',d:'Заметная доля хитов давит на страх ошибки/потери. Сильный крючок, но держи честным — иначе удержание просядет.'});
  var benefit=hits.filter(function(v){return /\$|₽|доход|заработ|бесплатн|выгод|деньг|прибыл/i.test(v.title);}).length/hits.length;
  if(benefit>=0.25)pats.push({ic:'💰',t:'Прямая выгода',d:'Хиты ниши обещают конкретную выгоду (деньги/результат) прямо в заголовке.'});
  var durs=hits.filter(function(v){return !v.isShort && v.dur>0;}).map(function(v){return v.dur;});
  if(durs.length>=3){var md=MED(durs); pats.push({ic:'⏱',t:'Длительность хитов',d:'Медианная длина длинных хитов ниши — ~'+Math.round(md/60)+' мин. Ориентируйся на этот формат, не короче без причины.'});}
  return pats;
}

/* ================= 2.5  ФАКТЫ / ДИАГНОЗ / КЛИКБЕЙТ ================= */
function buildFacts(sd){
  var S=ST(), ch=S.channel||{};
  var vids=sd.vids, hits=sd.cls.hits.length, total=vids.length;
  var freqPerWeek=(function(){var byDate=vids.slice().sort(function(a,b){return new Date(a.published)-new Date(b.published);});if(byDate.length<2)return 0;var span=AGE(byDate[0].published)-AGE(byDate[byDate.length-1].published);return span>0?+(byDate.length/(span/7)).toFixed(1):0;})();
  var medEng=MED(vids.map(function(v){return v.engagement;}))*100;
  var subs=ch.subs||0;
  var medViews=MED(vids.map(function(v){return v.views;}));
  var viewToSub=subs>0?medViews/subs:0;
  return [
    {k:'Подписчиков', v:ch.hiddenSubs?'скрыто':F(subs)},
    {k:'Роликов в анализе ('+segLabel(sd.seg)+')', v:total+(sd.expanded?' · окно расширено':'')},
    {k:'Медиана просмотров/ролик', v:F(medViews)},
    {k:'Просмотры к базе подписчиков', v:(viewToSub*100).toFixed(0)+'%', cls:viewToSub>=0.15?'good':(viewToSub>=0.05?'mid':'bad'), hint:viewToSub>=0.15?'выходит за пределы своей аудитории':(viewToSub>=0.05?'в основном смотрят свои':'охват ниже базы подписчиков')},
    {k:'Доля хитов', v:total?Math.round(hits/total*100)+'%':'—', cls:hits/total>=0.25?'good':(hits/total>=0.12?'mid':'bad'), hint:'роликов выше нормы канала'},
    {k:'Регулярность', v:freqPerWeek?freqPerWeek+' / нед':'нерегулярно', cls:freqPerWeek>=1?'good':(freqPerWeek>=0.5?'mid':'bad'), hint:freqPerWeek>=1?'темп алгоритм любит':'реже раза в неделю — рост тормозит'},
    {k:'Среднее вовлечение', v:medEng.toFixed(1)+'%', cls:medEng>=3?'good':(medEng>=1.5?'mid':'bad'), hint:'лайки+комменты к просмотрам'}
  ];
}
function buildDiagnosis(sd){
  var S=ST(), ai=S.ai||{};
  var out=[];
  /* если есть main_leak от ИИ — это диагноз №1 */
  if(ai.main_leak)out.push({h:ai.leak_tag||'Главная утечка', mech:ai.main_leak, prob:'высокая'});
  /* добираем механикой из цифр */
  var vids=sd.vids;
  var freqPerWeek=(function(){var bd=vids.slice().sort(function(a,b){return new Date(a.published)-new Date(b.published);});if(bd.length<2)return 1;var span=AGE(bd[0].published)-AGE(bd[bd.length-1].published);return span>0?bd.length/(span/7):1;})();
  if(freqPerWeek<0.6)out.push({h:'Низкая регулярность', mech:'Выходит реже раза в 1.5 недели ('+freqPerWeek.toFixed(1)+'/нед). Алгоритм YouTube хуже разгоняет редкие каналы — аудитория и привычка смотреть не успевают сформироваться.', prob:'высокая'});
  var hitShare=vids.length?sd.cls.hits.length/vids.length:0;
  if(hitShare<0.12)out.push({h:'Мало попаданий в тему', mech:'Лишь '+Math.round(hitShare*100)+'% роликов выходят за норму канала. Темы/упаковка чаще не попадают в спрос — нужен системный подбор тем (см. «Что снимать» ниже).', prob:'средняя'});
  var medEng=MED(vids.map(function(v){return v.engagement;}))*100;
  if(medEng<1.5)out.push({h:'Слабое вовлечение', mech:'Вовлечение '+medEng.toFixed(1)+'% — зрители смотрят пассивно, мало реакций. Чаще зови к действию (вопрос в конце, закреп, опрос) — это сигнал ценности для алгоритма.', prob:'средняя'});
  /* формат-дисбаланс */
  if(sd.seg==='all'){var sh=segFilter('shorts').length, ln=segFilter('longs').length;
    if(sh>0&&ln>0){var rs=sh/(sh+ln); if(rs>=0.8)out.push({h:'Перекос в Shorts', mech:'Почти весь контент — Shorts ('+Math.round(rs*100)+'%). Они дают охват, но плохо конвертят в подписку и удержание. Нужны длинные ролики, чтобы переводить охват в лояльную аудиторию.', prob:'средняя'});
      else if(rs<=0.1)out.push({h:'Нет Shorts для охвата', mech:'Почти нет Shorts. Длинные ролики строят глубину, но Shorts — главный сейчас источник новых зрителей. 2-3 нарезки в неделю расширят воронку.', prob:'низкая'});}}
  if(!out.length)out.push({h:'Канал ровный', mech:'Явных провалов в цифрах нет — рост упирается в объём и системность. Держи темп и усиливай упаковку лучших тем.', prob:'низкая'});
  return out.slice(0,5);
}
function clickbaitBalance(sd){
  /* прокси: высокий «клик» (хиты по vpd) при низком вовлечении = разрыв обёртка≠начинка */
  var vids=sd.vids; if(vids.length<5)return null;
  var medVpd=MED(vids.map(function(v){return v.viewsPerDay;}));
  var hi=vids.filter(function(v){return v.viewsPerDay>=medVpd;});
  var loEng=hi.filter(function(v){return v.engagement<MED(vids.map(function(x){return x.engagement;}))*0.6;}).length;
  var gapShare=hi.length?loEng/hi.length:0;
  var ctrProxy=Math.round(MED(hi.map(function(v){return v.viewsPerDay;}))/Math.max(1,medVpd)*100);
  var engProxy=(MED(hi.map(function(v){return v.engagement;}))*100).toFixed(1);
  var warn=gapShare>=0.4;
  return {ctr:ctrProxy, eng:engProxy, gap:Math.round(gapShare*100), warn:warn};
}

/* ---- «Что снимать» (top-10) ---- */
function buildShootList(sd, topics, reconList){
  var items=[], S=ST(), ai=S.ai||{};
  /* 1) рабочие живые рубрики */
  topics.forEach(function(t){var bv=burnVerdict(t);
    if(bv.tag==='live'||bv.tag==='cool'){
      items.push({title:'Новый ролик в рубрике «'+t.name+'»'+(t.best?': угол как у «'+(t.best.title||'').slice(0,46)+'»':''),
        why:'Рубрика '+(bv.tag==='live'?'растёт':'ещё жива')+' — свежие ролики набирают (×'+(t.recentXc!=null?t.recentXc.toFixed(1):'1')+' к норме). '+(t.best?'Эталон формата уже есть на канале.':''),
        tags:[{c:'demand',t:'спрос подтверждён'},{c:'',t:t.count+' роликов в рубрике'}].concat(t.season?[{c:'season',t:'сезон: '+t.season[0]}]:[]),
        src:'topic'});
    }});
  /* 2) эксклюзивы конкурентов = свободные темы */
  reconList.forEach(function(r){if(r.exclusive){
    items.push({title:'Сделать свою версию: «'+(r.exclusive.title||'').slice(0,60)+'»',
      why:'У конкурента «'+r.name+'» этот ролик выбился из его средней статистики ('+F(r.exclusive.views)+' просм). Тема доказала спрос в нише, а у тебя её ещё нет — свободное окно.',
      tags:[{c:'free',t:'свободная тема'},{c:'demand',t:'хит у конкурента'}], src:'comp'});
  }});
  /* 3) идеи от ИИ */
  (ai.next_videos||[]).concat(ai.content_ideas||[]).forEach(function(o){
    var title=o.title||o.idea||o.angle||o.theme||o.name; if(!title||typeof title!=='string')return;
    items.push({title:title, why:(o.reason||o.why||o.rationale||'Идея от Viora AI на основе разбора канала и ниши.'),
      tags:[{c:'',t:'🤖 Viora AI'}], src:'ai'});
  });
  /* дедуп по началу заголовка */
  var seen={}, uniq=[];
  items.forEach(function(it){var k=NORM(it.title).slice(0,28); if(seen[k])return; seen[k]=1; uniq.push(it);});
  return uniq.slice(0,10);
}

/* ---- 3 действия (для простого режима) ---- */
function buildActions(sd){
  var S=ST(), ai=S.ai||{}, acts=[];
  var plan=(ai.action_plan||[]).filter(function(s){return s&&typeof s.step==='string';});
  plan.sort(function(a,b){var pa=a.priority==='high'?0:a.priority==='medium'?1:2,pb=b.priority==='high'?0:b.priority==='medium'?1:2;return pa-pb||(a.week||9)-(b.week||9);});
  plan.slice(0,3).forEach(function(s){acts.push({t:s.step, w:(typeof s.why==='string'?s.why:'')});});
  if(acts.length<3){var d=buildDiagnosis(sd);
    d.forEach(function(x){if(acts.length>=3)return; acts.push({t:fixFor(x.h), w:x.mech.slice(0,120)});});}
  return acts.slice(0,3);
}
function fixFor(h){
  var m={'Низкая регулярность':'Зафиксируй график: минимум 1 ролик в неделю в один день',
    'Слабое вовлечение':'Добавляй явный призыв и вопрос зрителю в конце каждого ролика',
    'Мало попаданий в тему':'Снимай только из списка «Что снимать» ниже — там темы с подтверждённым спросом',
    'Перекос в Shorts':'Добавь 1 длинный ролик в неделю, переливая в него аудиторию Shorts',
    'Нет Shorts для охвата':'Делай 2-3 Shorts-нарезки из каждого длинного ролика'};
  return m[h]||('Исправь: '+h);
}

/* ================= СЕГМЕНТ-ХЕЛПЕРЫ ================= */
function segLabel(s){return s==='longs'?'длинные':(s==='shorts'?'Shorts':'все');}
function availSegs(){
  var out=[{k:'all',n:'Все'}];
  if(segFilter('longs').length>0)out.push({k:'longs',n:'🎬 Длинные'});
  if(segFilter('shorts').length>0)out.push({k:'shorts',n:'⚡ Shorts'});
  return out;
}

/* ================= РЕНДЕР ================= */
function trendBadge(tr){return tr==='up'?'<span class="badge up">📈 растёт</span>':(tr==='down'?'<span class="badge down">📉 затухает</span>':'<span class="badge flat">➖ ровно</span>');}
function spark(bars){
  if(!bars||!bars.length)return '';
  var mx=Math.max.apply(null,bars)||1;
  return '<div class="v20b2-spark">'+bars.map(function(b){var h=Math.max(8,Math.round(b/mx*100));return '<i style="height:'+h+'%"></i>';}).join('')+'</div>';
}

function renderInner(){
  var host=qs('#v20b2'); if(!host)return;
  var S=ST(); if(!S.videos||!S.videos.length){host.innerHTML='';return;}
  var sd=segData(B2.seg);
  var topics=buildTopics(sd);
  var reconList=recon().filter(function(r){return r.live || (r.longs+r.shorts)>0;});
  var shoots=buildShootList(sd, topics, reconList);

  var segs=availSegs();
  var segBtns=segs.map(function(s){return '<button data-seg="'+s.k+'" class="'+(B2.seg===s.k?'on':'')+'">'+s.n+'</button>';}).join('');
  var modeBtns='<button data-mode="simple" class="'+(B2.mode==='simple'?'on':'')+'">😌 Просто</button><button data-mode="expert" class="'+(B2.mode==='expert'?'on':'')+'">🧠 Эксперт</button>';

  var winNote='';
  if(sd.expanded)winNote='<div class="v20b2-winnote">⏳ В сегменте мало свежих роликов — расширил окно за пределы года, чтобы было что анализировать. <span class="arch">архивные ролики помечены</span></div>';
  else if(Object.keys(sd.archIds).length)winNote='<div class="v20b2-winnote">Основа анализа — последние 12 мес. <span class="arch">архивные хиты</span> старше года добавлены отдельно — проверь, актуальна ли тема сегодня.</div>';

  var body = (B2.mode==='simple') ? renderSimple(sd,shoots) : renderExpert(sd,topics,reconList,shoots);

  host.innerHTML =
   '<div class="b2-card">'+
     '<div class="v20b2-head">'+
       '<div class="v20b2-title">🧠 Продюсерский разбор'+
         '<span class="sub">'+(B2.mode==='simple'?'Коротко: диагноз, 3 действия и что снимать':'Полный разбор: цифры → диагноз → стратегия → план')+'</span></div>'+
       '<div class="v20b2-ctrls">'+
         '<div class="v20b2-mode" id="v20b2Mode">'+modeBtns+'</div>'+
         '<div class="v20b2-seg" id="v20b2Seg">'+segBtns+'</div>'+
       '</div>'+
     '</div>'+
     winNote+ body+
   '</div>';

  wire(sd,shoots);
}

function renderSimple(sd,shoots){
  var diag=buildDiagnosis(sd)[0];
  var acts=buildActions(sd);
  var html='<div class="v20b2-diag"><span class="lab">🩺 Диагноз одной фразой</span>'+E(diag.mech)+'</div>';
  html+='<div class="v20b2-block"><div class="v20b2-bh">✅ 3 действия прямо сейчас</div><div class="v20b2-acts">'+
    acts.map(function(a,i){return '<div class="v20b2-act"><div class="n">'+(i+1)+'</div><div><div class="t">'+E(a.t)+'</div>'+(a.w?'<div class="w">'+E(a.w)+'</div>':'')+'</div></div>';}).join('')+'</div></div>';
  html+='<div class="v20b2-block"><div class="v20b2-bh">🎥 Что снимать (топ-'+Math.min(3,shoots.length)+')</div>'+shootsHtml(shoots.slice(0,3))+'</div>';
  html+='<div class="v20b2-expandcta"><button id="v20b2ToExpert">🧠 Открыть полный разбор (эксперт-режим)</button></div>';
  return html;
}

function shootsHtml(shoots){
  if(!shoots.length)return '<div class="v20b2-empty">Чтобы собрать список тем, нужно больше данных по каналу и нише. Сделай полный анализ канала — и здесь появятся конкретные темы под спрос.</div>';
  return '<div class="v20b2-shoots">'+shoots.map(function(it,i){
    var tags=(it.tags||[]).map(function(t){return '<span class="'+(t.c||'')+'">'+E(t.t)+'</span>';}).join('');
    return '<div class="v20b2-shoot"><div class="st"><span class="rk">'+(i+1)+'</span><span>'+E(it.title)+'</span></div>'+
      (tags?'<div class="tags">'+tags+'</div>':'')+
      (it.why?'<div class="why">'+E(it.why)+'</div>':'')+
      '<div class="acts"><button data-copy="'+i+'">📋 Копировать</button><button data-plan="'+i+'">🎬 В план съёмок</button></div></div>';
  }).join('')+'</div>';
}

function renderExpert(sd,topics,reconList,shoots){
  var html='';
  /* 2.5 facts */
  var facts=buildFacts(sd);
  html+='<div class="v20b2-block"><div class="v20b2-bh">📊 Таблица фактов</div><div class="v20b2-bd">Что с каналом в цифрах — без ощущений.</div>'+
    '<div class="v20b2-tablewrap"><table class="v20b2-facts"><tbody>'+facts.map(function(f){return '<tr><td class="k">'+E(f.k)+'</td><td class="v"><span class="'+(f.cls||'')+'">'+f.v+'</span>'+(f.hint?'<span class="hint">'+E(f.hint)+'</span>':'')+'</td></tr>';}).join('')+'</tbody></table></div></div>';
  /* 2.5 diagnosis */
  var diags=buildDiagnosis(sd);
  html+='<div class="v20b2-block"><div class="v20b2-bh">🔍 Диагноз: причины по вероятности</div><div class="v20b2-bd">Ранжировано: сверху — самое вероятное, с механикой «почему именно так».</div><div class="v20b2-diags">'+
    diags.map(function(d,i){var p=i===0?'p1':(i===1?'p2':'p3');return '<div class="v20b2-dg '+p+'"><div class="dh">'+E(d.h)+'<span class="prob">'+E(d.prob)+'</span></div><div class="mech">'+E(d.mech)+'</div></div>';}).join('')+'</div></div>';
  /* 2.5 clickbait */
  var ckb=clickbaitBalance(sd);
  if(ckb){html+='<div class="v20b2-block"><div class="v20b2-bh">⚖️ Баланс «обёртка ≠ начинка»</div><div class="v20b2-bd">Разрыв между кликабельностью и удержанием. Высокий клик + слабая реакция = алгоритм душит выдачу.</div>'+
    '<div class="v20b2-ckb"><div class="v20b2-ckcell"><div class="h">Кликабельность (прокси)</div><div class="big">'+ckb.ctr+'%</div></div>'+
    '<div class="v20b2-ckcell"><div class="h">Реакция зрителя</div><div class="big">'+ckb.eng+'%</div></div></div>'+
    '<div class="v20b2-ckverdict '+(ckb.warn?'warn':'ok')+'">'+(ckb.warn?
      '⚠️ У '+ckb.gap+'% хорошо кликаемых роликов слабое вовлечение — похоже на разрыв «обёртка ≠ начинка». Заголовок/превью обещают больше, чем даёт ролик. Принцип MrBeast: выжимай из видео максимум в заголовок, но честно — иначе удержание падает и алгоритм режет показы.':
      '✅ Кликабельность и реакция сбалансированы — упаковка честная, зритель получает обещанное. Так держать.')+'</div></div>';}
  /* 2.6/strategy: «что снимать» */
  html+='<div class="v20b2-block"><div class="v20b2-bh">🎥 Что снимать — главный экран</div><div class="v20b2-bd">Топ тем под этот канал: паттерн ниши + свободная тема + подтверждённый спрос. Клик — копировать или отправить в план съёмок.</div>'+shootsHtml(shoots)+'</div>';
  /* 2.2 topics trend+seasonality */
  html+='<div class="v20b2-block"><div class="v20b2-bh">🗂 Рубрики канала: тренд и сезонность</div><div class="v20b2-bd">Что снимает канал, как меняется интерес во времени и в какие месяцы тема выстреливает.</div>';
  if(topics.length){html+=topics.map(function(t){var bv=burnVerdict(t);
    return '<div class="v20b2-trow"><div class="th"><span class="tn">'+E(t.name)+'</span><span class="meta">'+t.count+' видео · медиана '+F(t.medVpd)+'/день</span>'+trendBadge(t.trend)+'</div>'+
      spark(t.bars)+
      (t.season?'<div class="v20b2-season">📅 Сезонные пики: <b>'+t.season.join(', ')+'</b></div>':'')+
      '<div class="v20b2-season" style="margin-top:6px;color:#cfc9d6">'+bv.label+' — '+E(bv.note)+'</div></div>';
  }).join('');}
  else html+='<div class="v20b2-empty">Пока мало повторяющихся рубрик (нужно ≥2 ролика в одной теме в этом сегменте). Снимай темы сериями — и здесь появится разбор по рубрикам с трендом и сезонностью.</div>';
  html+='</div>';
  /* 2.3 outliers */
  var outs=findOutliers(sd);
  if(outs.length){html+='<div class="v20b2-block"><div class="v20b2-bh">💥 Выбросы — что внезапно залетело</div><div class="v20b2-bd">Ролики, выбившиеся из статистики канала. Разбираем, почему — и повторяемо ли это.</div>'+
    outs.map(function(o){return '<div class="v20b2-out"><div class="ot">«'+E((o.v.title||'').slice(0,70))+'»<span class="ox">×'+o.x.toFixed(1)+' к норме · '+F(o.v.views)+' просм</span></div>'+
      '<div class="orx">Почему залетело: '+E(o.reasons.join('; '))+'.<br>'+(o.repeat?'✅ <b style="color:#8ef0b8">Повторяемо</b> — заложи этот паттерн в следующие ролики.':'⚠️ Скорее разовый всплеск — не строй стратегию только на этом.')+'</div></div>';
    }).join('')+'</div>';}
  /* 2.4 niche recon */
  html+='<div class="v20b2-block"><div class="v20b2-bh">🔭 Разведка ниши</div><div class="v20b2-bd">Конкуренты по твоим темам: формат, частота, медианы и эксклюзивы (их выбившиеся хиты = твои свободные темы).</div>';
  if(reconList.length){
    var pats=nichePatterns(reconList);
    if(pats.length)html+='<div class="v20b2-patterns">'+pats.map(function(p){return '<div class="v20b2-pat"><span class="ic">'+p.ic+'</span><span><b>'+E(p.t)+'.</b> '+E(p.d)+'</span></div>';}).join('')+'</div>';
    html+=reconList.slice(0,10).map(function(r){
      return '<div class="v20b2-comp" style="margin-top:11px"><div class="ch"><img src="'+IMG(r.avatar)+'" alt="" onerror="this.style.display=\'none\'"/><div><div class="nm">'+E(r.name)+'</div><div class="ms">'+F(r.subs)+' подписчиков</div></div>'+
        '<span class="status '+(r.live?'live':'idle')+'">'+(r.live?'активен':'молчит '+r.idleDays+'д')+'</span></div>'+
        '<div class="grid"><div class="cell"><div class="v">'+r.longs+'/'+r.shorts+'</div><div class="l">Длинные / Shorts</div></div>'+
        '<div class="cell"><div class="v">'+(r.freq||0)+'</div><div class="l">в неделю</div></div>'+
        '<div class="cell"><div class="v">'+F(r.medLong)+'</div><div class="l">медиана лонга</div></div>'+
        '<div class="cell"><div class="v">'+F(r.medShort)+'</div><div class="l">медиана Shorts</div></div></div>'+
        (r.exclusive?'<div class="excl"><b>Эксклюзив:</b> «'+E((r.exclusive.title||'').slice(0,64))+'» — '+F(r.exclusive.views)+' просм (выбился из его средней). Свободная тема для тебя.</div>':'')+'</div>';
    }).join('');
  }else html+='<div class="v20b2-empty">Конкурентов подобрать не удалось (часто это исчерпанная квота поиска YouTube или узкая ниша). Разбор канала работает и без них — а разведку можно догнать при следующем анализе.</div>';
  html+='</div>';
  /* 2.5 30-day experiment */
  html+='<div class="v20b2-block"><div class="v20b2-bh">🧪 30-дневный эксперимент</div><div class="v20b2-bd">Конкретный план на месяц с метриками проверки.</div>'+experimentHtml(sd,topics,shoots)+'</div>';
  return html;
}

function experimentHtml(sd,topics,shoots){
  var liveTopic=topics.filter(function(t){var b=burnVerdict(t);return b.tag==='live'||b.tag==='cool';})[0];
  var topicName=liveTopic?liveTopic.name:'твоей рабочей рубрики';
  var freqGoal=segFilter('shorts').length>0?'1 длинный + 2 Shorts в неделю':'1 ролик в неделю в один день';
  var steps=[
    {wk:'Нед. 1', t:'Сними и выпусти ролик из списка «Что снимать» (тема «'+topicName+'»). Заголовок — по формуле ВИСП, превью с одним крупным акцентом.'},
    {wk:'Нед. 2', t:'Держи темп: '+freqGoal+'. В каждом ролике — призыв и вопрос зрителю в конце.'},
    {wk:'Нед. 3', t:'Возьми эксклюзив-тему конкурента из «Разведки ниши» и сделай свою версию. Сравни первые 48ч с обычным роликом.'},
    {wk:'Нед. 4', t:'Переупакуй 1 старый «провальный» ролик (новый заголовок+превью) и замерь, изменился ли приток.'}
  ];
  var kpi='Проверка через 30 дней: (1) медиана просмотров/ролик выросла vs текущая '+F(sd.medVpd)+'/день; (2) доля хитов поднялась выше '+(sd.vids.length?Math.round(sd.cls.hits.length/sd.vids.length*100):0)+'%; (3) удержание и подписки с ролика растут (смотри в YouTube Studio). Если темы из списка не дали роста за 2 ролика — меняй угол, а не тему.';
  return '<div class="v20b2-exp">'+steps.map(function(s){return '<div class="step"><span class="wk">'+s.wk+'</span><span>'+E(s.t)+'</span></div>';}).join('')+'<div class="kpi">🎯 '+E(kpi)+'</div></div>';
}

/* ================= ОБРАБОТЧИКИ ================= */
function wire(sd,shoots){
  var seg=qs('#v20b2Seg'); if(seg)seg.querySelectorAll('button').forEach(function(b){b.onclick=function(){B2.seg=b.getAttribute('data-seg');renderInner();};});
  var mode=qs('#v20b2Mode'); if(mode)mode.querySelectorAll('button').forEach(function(b){b.onclick=function(){B2.mode=b.getAttribute('data-mode');try{localStorage.setItem(MODE_KEY,B2.mode);}catch(e){}renderInner();};});
  var toExp=qs('#v20b2ToExpert'); if(toExp)toExp.onclick=function(){B2.mode='expert';try{localStorage.setItem(MODE_KEY,'expert');}catch(e){}renderInner();var h=qs('#v20b2');if(h)try{h.scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}};
  qs('#v20b2')&&qs('#v20b2').querySelectorAll('[data-copy]').forEach(function(b){b.onclick=function(){var it=shoots[+b.getAttribute('data-copy')];if(!it)return;COPY(it.title+'\n\n'+(it.why||''));TOAST('Тема скопирована 📋');};});
  qs('#v20b2')&&qs('#v20b2').querySelectorAll('[data-plan]').forEach(function(b){b.onclick=function(){var it=shoots[+b.getAttribute('data-plan')];if(!it)return;
    try{ if(typeof saveShootPlan==='function'){ saveShootPlan({title:it.title, idea:it.why||'', hook:'', source:'Продюсерский разбор'}); TOAST('Добавил в «Мои съёмки» 🎬'); var ns=qs('#nextShootSection'); if(ns){try{renderShootsList();}catch(e){} } }
      else { COPY(it.title); TOAST('Скопировал тему 📋'); } }catch(e){ COPY(it.title); TOAST('Скопировал тему 📋'); } };});
}

/* ================= ИНЪЕКЦИЯ В DASHBOARD ================= */
function ensureHost(){
  var rep=qs('#report'); if(!rep)return null;
  var host=qs('#v20b2');
  if(!host){host=D.createElement('div'); host.id='v20b2';
    /* вставляем сразу после шапки канала (первая .section), до «Главной утечки» */
    var firstSec=rep.querySelector('.section');
    if(firstSec && firstSec.nextSibling)rep.insertBefore(host, firstSec.nextSibling);
    else rep.insertBefore(host, rep.firstChild);
  }
  return host;
}
function boot(){
  try{
    var host=ensureHost(); if(!host)return;
    /* синхроним STATE в window — чинит карточку B1 (она читает W.STATE) и даёт доступ извне */
    try{ if(typeof STATE!=='undefined') W.STATE=STATE; }catch(e){}
    renderInner();
  }catch(e){console.warn('[v20b2] render error',e);}
}
/* оборачиваем renderDashboard: function declarations висят на window */
if(typeof W.renderDashboard==='function' && !W.__v20b2wrap){
  W.__v20b2wrap=true;
  var _orig=W.renderDashboard;
  W.renderDashboard=function(){ var r=_orig.apply(this,arguments); setTimeout(boot,0); return r; };
}
/* если дашборд уже отрисован (повторная загрузка скрипта) */
if(qs('#report'))setTimeout(boot,0);
W.__v20b2_boot=boot; /* для e2e */
})();
