(function(){
  if (window.VIORA_AI) return;
  var W = window, RealFetch = W.fetch.bind(W), MISTRAL='api.mistral.ai';
  /* retries:1 (раньше 3) — внешний код (_mistralPass/callMistral) уже ретраит сам;
     перемножение ретраев двух слоёв давало «вечное» зависание шага AI */
  /* timeoutMs: 45с было мало — глубокий разбор (large, 6000 токенов) идёт 60-120с,
     перехватчик обрывал его и отдавал фейковый «успех» → шаг AI зависал. */
  var CFG = { retries:1, backoffBase:700, timeoutMs:150000, cacheTTL:5*60*1000, cacheMax:60, failoverKey:'vRe5PcdbN8EcG4U8Z96xHUbHFxt6bKD2', enrich:true, cacheEnabled:true };
  var STATS = { calls:0, ok:0, fail:0, retried:0, cached:0, failover:0, tokens:0, lastError:null };
  var CACHE = new Map();
  function now(){ return Date.now(); }
  function hash(s){ var h=0; for(var i=0;i<s.length;i++){ h=(h*31 + s.charCodeAt(i))|0; } return h+'_'+s.length; }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }
  function isChat(u){ return u.indexOf('/v1/chat/completions')>-1; }

  function enrichBody(bodyStr){
    if(!CFG.enrich) return bodyStr;
    try{
      var b=JSON.parse(bodyStr);
      if(!b || !Array.isArray(b.messages)) return bodyStr;
      var d='Виора — экспертный AI-стратег по росту YouTube и Telegram. Отвечай по-русски, конкретно и по делу. Опирайся ТОЛЬКО на факты и числа из запроса — ничего не выдумывай; если данных не хватает, прямо скажи об этом. Строго сохраняй требуемый формат ответа (если в задаче просят JSON — верни только валидный JSON без пояснений).';
      if((b.model||'').indexOf('large')>-1){ d+=' Это глубокий разбор: рассуждай как старший контент-аналитик — выводы должны быть приоритизированными, конкретными и сразу применимыми, с опорой на реальные числа и понятными следующими шагами.'; }
      var sys=null; for(var i=0;i<b.messages.length;i++){ if(b.messages[i].role==='system'){ sys=b.messages[i]; break; } }
      if(sys){ if((sys.content||'').indexOf('Виора — экспертный')===-1){ sys.content=(sys.content||'')+String.fromCharCode(10,10)+d; } }
      else { b.messages.unshift({role:'system', content:d}); }
      return JSON.stringify(b);
    }catch(e){ return bodyStr; }
  }
  function fallbackResponse(){
    var payload={ choices:[{ message:{ role:'assistant', content:'Виора сейчас не смогла связаться с AI (сеть или лимит). Попробуй ещё раз через минуту 🙏' } }], _vioraFallback:true };
    return new Response(JSON.stringify(payload), { status:200, headers:{'Content-Type':'application/json'} });
  }

  async function smartFetch(input, init){
    var url=(typeof input==='string')?input:(input&&input.url)||'';
    if(url.indexOf(MISTRAL)===-1) return RealFetch(input, init);
    init=init||{};
    var chat=isChat(url);
    var origBody=(typeof init.body==='string')?init.body:(init.body?String(init.body):'');
    var body=chat?enrichBody(origBody):origBody;
    var key=url+'::'+hash(body);
    if(CFG.cacheEnabled){ var c=CACHE.get(key); if(c && (now()-c.t)<CFG.cacheTTL){ STATS.cached++; return new Response(c.text,{status:200,headers:{'Content-Type':'application/json'}}); } }
    STATS.calls++;
    var attempts=CFG.retries+1, lastErr=null, usedFailover=false;
    for(var i=0;i<attempts;i++){
      var ctrl=new AbortController(); var to=setTimeout(function(){ ctrl.abort(); }, CFG.timeoutMs);
      /* КРИТИЧНО: уважаем сигнал отмены вызывающего кода — раньше он игнорировался,
         и таймауты _mistralPass/callMistral не действовали на реальный запрос */
      if(init.signal){ if(init.signal.aborted){ ctrl.abort(); } else { init.signal.addEventListener('abort', function(){ ctrl.abort(); }, {once:true}); } }
      try{
        var headers=Object.assign({}, init.headers||{});
        if(usedFailover && CFG.failoverKey){ headers['Authorization']='Bearer '+CFG.failoverKey; }
        var resp=await RealFetch(url, Object.assign({},init,{ body:body, headers:headers, signal:ctrl.signal }));
        clearTimeout(to);
        if(resp.status===429||resp.status>=500||resp.status===401||resp.status===403){
          lastErr='HTTP '+resp.status;
          if((resp.status===401||resp.status===403||resp.status===429)&&CFG.failoverKey&&!usedFailover){ usedFailover=true; STATS.failover++; continue; }
          if(i<attempts-1){ STATS.retried++; await sleep(CFG.backoffBase*Math.pow(2,i)+Math.random()*250); continue; }
          throw new Error(lastErr);
        }
        var text=await resp.clone().text();
        try{ var j=JSON.parse(text); if(j.usage&&j.usage.total_tokens) STATS.tokens+=j.usage.total_tokens; }catch(e){}
        if(CFG.cacheEnabled && resp.status===200){ CACHE.set(key,{t:now(),text:text}); if(CACHE.size>CFG.cacheMax){ CACHE.delete(CACHE.keys().next().value); } }
        STATS.ok++;
        return new Response(text,{status:resp.status,statusText:resp.statusText,headers:resp.headers});
      }catch(e){
        clearTimeout(to); lastErr=(e&&e.message)||String(e);
        if(i<attempts-1){ STATS.retried++; await sleep(CFG.backoffBase*Math.pow(2,i)+Math.random()*250); continue; }
      }
    }
    STATS.fail++; STATS.lastError=lastErr;
    if(chat) return fallbackResponse();
    throw new Error('VioraAI: '+lastErr);
  }

  W.fetch=function(input, init){ try{ return smartFetch(input, init); }catch(e){ return RealFetch(input, init); } };
  W.VIORA_AI={ cfg:CFG, stats:STATS, clearCache:function(){ CACHE.clear(); }, version:'phase3.3' };
  try{ console.info('[VioraAI] ядро активно: retries/timeout/cache/failover-slot/заземление'); }catch(e){}
})();
