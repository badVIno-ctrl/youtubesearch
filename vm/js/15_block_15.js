/* ===================================================================== */
/*  VIORA — Профиль / Кабинет автора (Этап 5)                            */
/*  Кнопка профиля на обоих интерфейсах (YouTube + Telegram):           */
/*  данные автора, мои каналы, план развития (YT / TG / всё вместе)   */
/* ===================================================================== */
(function(){
  var D=document;var NL=String.fromCharCode(10);
  function byId(id){return D.getElementById(id);}
  function esc(s){s=String(s==null?'':s);return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function vToast(m){try{if(typeof window.toastY==='function'){window.toastY(m);return;}if(typeof window.toast==='function'){window.toast(m);return;}}catch(e){}var t=D.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:99999;background:#1c1c20;color:#fff;padding:11px 18px;border-radius:12px;font-family:Sora,sans-serif;font-size:13.5px;border:1px solid rgba(255,255,255,.12)';D.body.appendChild(t);setTimeout(function(){t.style.transition='.3s';t.style.opacity='0';},1600);setTimeout(function(){try{t.remove();}catch(e){}},2000);}
  function uid(){return 'g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  var PLAN_K='viora_growth_plan_v1';
  function getProfile(){try{if(typeof PROFILE!=='undefined'&&PROFILE)return PROFILE;}catch(e){}try{return JSON.parse(localStorage.getItem('viora_profile_v1')||'null');}catch(e){return null;}}
  function persistProfile(p){try{if(typeof saveProfile==='function'){saveProfile(p);return;}}catch(e){}try{localStorage.setItem('viora_profile_v1',JSON.stringify(p));}catch(e){}}
  function getChannels(){var p=getProfile();var c=p&&p.channels;return Array.isArray(c)?c:[];}
  function setChannels(list){var p=getProfile()||{};p.channels=list;persistProfile(p);}
  function getPlan(){try{var a=JSON.parse(localStorage.getItem(PLAN_K)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
  function setPlan(a){try{localStorage.setItem(PLAN_K,JSON.stringify(a));}catch(e){}}
  var curTab='profile',planFilter='all',draft={level:'',context:'',goal:''};

  function ensureModal(){
    if(byId('vprOv'))return;
    var ov=D.createElement('div');ov.id='vprOv';
    ov.innerHTML='<div class="vpr-card"><div class="vpr-head"><h3>👤 Профиль автора</h3><button class="vpr-x" onclick="vProfileClose()">×</button></div><div class="vpr-tabs"><button class="vpr-tab" data-t="profile" onclick="vProfileTab(\'profile\')">⚙️ Данные</button><button class="vpr-tab" data-t="channels" onclick="vProfileTab(\'channels\')">📡 Мои каналы</button><button class="vpr-tab" data-t="plan" onclick="vProfileTab(\'plan\')">🗺 План развития</button></div><div class="vpr-body" id="vprBody"></div></div>';
    ov.addEventListener('click',function(e){if(e.target===ov)vProfileClose();});
    D.body.appendChild(ov);
  }

  function initDraft(){var p=getProfile()||{};draft={level:p.level||'',context:p.context||'',goal:p.goal||''};}
  function renderProfile(){
    var body=byId('vprBody');if(!body)return;
    function opt(g,v,em,t,d){var sel=draft[g]===v;return '<button type="button" class="vpr-opt'+(sel?' on':'')+'" data-g="'+g+'" data-v="'+v+'"><span class="em">'+em+'</span><span><b>'+t+'</b><i>'+d+'</i></span></button>';}
    body.innerHTML='<div class="vpr-lbl">Какой у тебя опыт?</div><div class="vpr-grid">'+opt('level','new','🐣','Новичок','Объясняем проще, без жаргона')+opt('level','pro','🚀','Уже веду канал','Плотно, без азов')+'</div><div class="vpr-lbl">Какой контент снимаешь?</div><div class="vpr-grid">'+opt('context','fresh','🔥','Свежак / тренды','Новости и инфоповоды')+opt('context','expert','🌲','Вечнозелёное','Экспертиза и польза')+opt('context','mixed','🔀','И то, и то','Смешанный контент')+'</div><div class="vpr-lbl">Твоя цель (по желанию)</div><input id="vprGoal" class="vpr-input" placeholder="Напр.: 10 000 подписчиков и продажи через Telegram" value="'+esc(draft.goal)+'"><div class="vpr-actions"><button class="vpr-btn" onclick="vProfileSaveData()">Сохранить</button></div>';
    var opts=body.querySelectorAll('.vpr-opt');for(var i=0;i<opts.length;i++){opts[i].onclick=function(){var g=this.getAttribute('data-g'),v=this.getAttribute('data-v');var gi=byId('vprGoal');if(gi)draft.goal=gi.value;draft[g]=v;renderProfile();};}
  }
  window.vProfileSaveData=function(){var gi=byId('vprGoal');if(gi)draft.goal=gi.value;var p=getProfile()||{};p.level=draft.level||p.level||'new';p.context=draft.context||p.context||'mixed';p.goal=draft.goal||'';persistProfile(p);try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){if(typeof renderProfileBanner==='function')renderProfileBanner();if(typeof renderFormula==='function')renderFormula();if(typeof renderHeatmap==='function')renderHeatmap();}}catch(e){}vToast('Профиль сохранён');renderProfile();};

  function renderChannels(){
    var body=byId('vprBody');if(!body)return;var list=getChannels();
    var rows=list.length?list.map(function(c){var icon=c.type==='tg'?'✈️':'▶️';var act=c.type==='yt'?'<button class="vpr-mini" onclick="vProfileAnalyze(\''+c.id+'\')">Анализировать</button>':'<button class="vpr-mini" onclick="vProfileOpenTg()">Открыть студию</button>';return '<div class="vpr-ch"><span class="vpr-ch-ic">'+icon+'</span><div class="vpr-ch-m"><b>'+esc(c.title||c.handle)+'</b><i>'+esc(c.handle)+'</i></div>'+act+'<button class="vpr-ch-x" title="Удалить" onclick="vProfileDelChannel(\''+c.id+'\')">🗑</button></div>';}).join(''):'<div class="vpr-empty">Каналы пока не добавлены. Добавь свой YouTube или Telegram — сможешь в один клик запускать аудит и собирать план развития.</div>';
    body.innerHTML='<div class="vpr-lbl">Мои каналы</div>'+rows+'<div class="vpr-addbox"><div class="vpr-lbl">Добавить канал</div><div class="vpr-addrow"><select id="vprChType" class="vpr-select" style="max-width:150px"><option value="yt">▶️ YouTube</option><option value="tg">✈️ Telegram</option></select><input id="vprChIn" class="vpr-input" placeholder="ссылка или @handle"></div><div class="vpr-actions"><button class="vpr-btn" onclick="vProfileAddChannel()">Добавить канал</button></div></div>';
  }
  window.vProfileStartAnalyze=function(ch,offerPlan){if(!ch)return;vProfileClose();try{if(typeof window.enterYoutube==='function')window.enterYoutube();}catch(e){}try{if(typeof window.setMode==='function')window.setMode('audit');}catch(e){}var i=byId('urlInput');if(i)i.value=ch.handle;var pr;try{if(typeof window.startAnalysis==='function')pr=window.startAnalysis();}catch(e){}if(offerPlan){window.__vprPendingPlan=true;if(pr&&typeof pr.then==='function'){pr.then(function(){if(window.__vprPendingPlan)window.__vprAutoPlan();}).catch(function(){window.__vprPendingPlan=false;});}}};
  window.__vprAutoPlan=function(){if(!window.__vprPendingPlan)return;window.__vprPendingPlan=false;try{window.vProfileOpen('plan');}catch(e){}setTimeout(function(){try{window.vProfileAiPlan();}catch(e){}},450);};
  window.vProfileAddChannel=function(){var t=(byId('vprChType')||{}).value||'yt';var v=((byId('vprChIn')||{}).value||'').trim();if(!v){vToast('Вставь ссылку или @handle');return;}var title=v;title=title.replace('https://','').replace('http://','').replace('www.','').replace('youtube.com/','').replace('t.me/','').replace('telegram.me/','');if(title.charAt(title.length-1)==='/')title=title.slice(0,-1);var list=getChannels();var ch={id:uid(),type:t,handle:v,title:title};list.push(ch);setChannels(list);renderChannels();try{if(typeof window.tgRenderWelcome==='function')window.tgRenderWelcome();}catch(e){}vToast('Канал добавлен');if(t==='yt'){vToast('Запускаю анализ твоего канала…');setTimeout(function(){window.vProfileStartAnalyze(ch,true);},450);}};
  window.vProfileDelChannel=function(id){setChannels(getChannels().filter(function(c){return c.id!==id;}));renderChannels();try{if(typeof window.tgRenderWelcome==='function')window.tgRenderWelcome();}catch(e){}};
  window.vProfileAnalyze=function(id){var c=getChannels().filter(function(x){return x.id===id;})[0];window.vProfileStartAnalyze(c,false);};
  window.vProfileOpenTg=function(){vProfileClose();try{if(typeof window.enterTelegram==='function')window.enterTelegram();}catch(e){}};

  function renderPlan(){
    var body=byId('vprBody');if(!body)return;var plan=getPlan();
    var filtered=plan.filter(function(t){return planFilter==='all'||t.platform===planFilter||t.platform==='all';});
    var done=filtered.filter(function(t){return t.done;}).length;var pct=filtered.length?Math.round(done/filtered.length*100):0;
    function chip(v,l){return '<button class="vpr-fchip'+(planFilter===v?' on':'')+'" onclick="vProfilePlanFilter(\''+v+'\')">'+l+'</button>';}
    var tasks=filtered.length?filtered.map(function(t){var pl=t.platform==='yt'?'▶️ YouTube':t.platform==='tg'?'✈️ Telegram':'🌐 Всё';var hor=t.horizon==='week'?'эта неделя':t.horizon==='month'?'этот месяц':t.horizon==='quarter'?'квартал':'';return '<div class="vpr-task'+(t.done?' done':'')+'"><button class="vpr-ck" onclick="vProfileToggleTask(\''+t.id+'\')">'+(t.done?'✓':'')+'</button><div class="vpr-task-m"><div class="vpr-task-t">'+esc(t.text)+'</div><div class="vpr-task-meta"><span class="vpr-tag">'+pl+'</span>'+(hor?'<span class="vpr-tag soft">'+hor+'</span>':'')+'</div></div><button class="vpr-ch-x" title="Удалить" onclick="vProfileDelTask(\''+t.id+'\')">🗑</button></div>';}).join(''):'<div class="vpr-empty">План развития пуст. Добавь задачи вручную или нажми «Собрать с ИИ» — Viora составит план под твой профиль и каналы.</div>';
    body.innerHTML='<div class="vpr-plan-top"><div class="vpr-filters">'+chip('all','Все')+chip('yt','▶️ YT')+chip('tg','✈️ TG')+'</div><button class="vpr-btn ai" id="vprAiBtn" onclick="vProfileAiPlan()">✨ Собрать с ИИ</button></div>'+(filtered.length?'<div class="vpr-prog"><div class="vpr-prog-bar"><i style="width:'+pct+'%"></i></div><span>'+done+' из '+filtered.length+' · '+pct+'%</span></div>':'')+'<div class="vpr-tasks">'+tasks+'</div><div class="vpr-addbox"><div class="vpr-lbl">Новая задача</div><textarea id="vprTaskIn" class="vpr-input" placeholder="Напр.: снять 3 длинных ролика по теме трейдинга"></textarea><div class="vpr-addrow"><select id="vprTaskPl" class="vpr-select" style="max-width:150px"><option value="all">🌐 Всё</option><option value="yt">▶️ YouTube</option><option value="tg">✈️ Telegram</option></select><select id="vprTaskHor" class="vpr-select" style="max-width:150px"><option value="week">эта неделя</option><option value="month">этот месяц</option><option value="quarter">квартал</option></select></div><div class="vpr-actions"><button class="vpr-btn" onclick="vProfileAddTask()">Добавить задачу</button></div></div>';
  }
  window.vProfilePlanFilter=function(v){planFilter=v;renderPlan();};
  window.vProfileAddTask=function(){var v=((byId('vprTaskIn')||{}).value||'').trim();if(!v){vToast('Напиши задачу');return;}var pl=(byId('vprTaskPl')||{}).value||'all';var hor=(byId('vprTaskHor')||{}).value||'week';var a=getPlan();a.unshift({id:uid(),text:v,platform:pl,horizon:hor,done:false,ts:Date.now()});setPlan(a);renderPlan();vToast('Задача добавлена');};
  window.vProfileToggleTask=function(id){var a=getPlan();a.forEach(function(t){if(t.id===id)t.done=!t.done;});setPlan(a);renderPlan();};
  window.vProfileDelTask=function(id){setPlan(getPlan().filter(function(t){return t.id!==id;}));renderPlan();};
  window.vProfileAiPlan=async function(){
    var btn=byId('vprAiBtn');if(btn){btn.disabled=true;btn.dataset.t=btn.textContent;btn.textContent='Собираю…';}
    try{
      var p=getProfile()||{};
      var lvl=p.level==='pro'?'опытный автор':'новичок';
      var ctx=p.context==='fresh'?'тренды и инфоповоды':p.context==='expert'?'вечнозелёный экспертный контент':'смешанный контент';
      var chs=getChannels();var chTxt=chs.length?chs.map(function(c){return (c.type==='tg'?'Telegram ':'YouTube ')+c.handle;}).join(', '):'каналы не указаны';
      var aud='';try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){var s=STATE;aud=NL+'YouTube-канал: '+(s.channel.title||'')+', подписчиков: '+(s.channel.subs||'?')+'.';if(s.ai){if(s.ai.main_leak)aud+=NL+'Главная проблема роста: '+s.ai.main_leak+'.';if(s.ai.score!=null)aud+=NL+'Оценка канала: '+Math.round(s.ai.score)+'/100.';if(s.ai.action_plan&&s.ai.action_plan.length)aud+=NL+'Из последнего плана: '+s.ai.action_plan.slice(0,4).map(function(x){return x.step;}).join('; ')+'.';}}}catch(e){}
      var goal=p.goal?(NL+'Цель автора: '+p.goal+'.'):'';
      var sys='Ты — Viora AI, личный стратег роста YouTube и Telegram. Ты УЖЕ изучил профиль и данные канала — выдавай ГОТОВЫЙ план, а НЕ задания вида «проанализируй сам», «изучи», «посмотри». Каждый пункт — конкретный шаг «возьми и сделай»: что именно сделать, как по шагам и что это даст. Верни СТРОГО валидный JSON-массив без markdown: [{"text":"...","platform":"yt|tg|all","horizon":"week|month|quarter"}]. 8-12 задач, по приоритету (сначала то, что быстрее всего поднимет аудиторию), пиши с глагола, без воды и вступлений. ЯЗЫК ПРОСТОЙ, как для друга-новичка: не ссылайся на «методику» или «методичку»; рабочие термины (вовлечённость, удержание, хук, превью, призыв к действию) можно, но при первом упоминании поясни простыми словами в скобках; не используй сырые сокращения (VPD, CTA, engagement) без расшифровки. Если задана главная проблема роста канала — первые 2-3 задачи закрывают именно её. Уровень «новичок» — совсем простые первые шаги и больше пояснений; «опытный автор» — плотнее, без азов. platform: yt — про YouTube, tg — про Telegram, all — общее развитие.';
      var user='Профиль: '+lvl+', контент — '+ctx+'.'+goal+NL+'Каналы: '+chTxt+'.'+aud+NL+'Составь персональный ГОТОВЫЙ план развития: конкретные пошаговые действия под этот канал и уровень автора, которые реально поднимут аудиторию. Никаких заданий «проанализируй сам» — ты уже всё знаешь из данных выше.';
      var raw;
      if(window.__VP&&typeof window.__VP.aiText==='function')raw=await window.__VP.aiText(sys,user,1900);
      else if(typeof window.callMistralRaw==='function')raw=await window.callMistralRaw(sys,user,1900);
      else throw new Error('no ai');
      var data=(window.__VP&&window.__VP.jsonFrom)?window.__VP.jsonFrom(raw):JSON.parse(raw);try{if(typeof vScrub==='function')data=vScrub(data);}catch(e){}
      if(!data||!data.length){vToast('Не удалось собрать план — попробуй ещё раз');}
      else{var a=getPlan();var added=0;data.forEach(function(it){if(it&&it.text){a.push({id:uid(),text:String(it.text),platform:(['yt','tg','all'].indexOf(it.platform)>=0?it.platform:'all'),horizon:(['week','month','quarter'].indexOf(it.horizon)>=0?it.horizon:'month'),done:false,ts:Date.now(),ai:true});added++;}});setPlan(a);renderPlan();vToast('Viora добавила задач: '+added);}
    }catch(e){vToast('Viora недоступна — попробуй через пару секунд');}
    var b2=byId('vprAiBtn');if(b2){b2.disabled=false;b2.textContent=b2.dataset.t||'✨ Собрать с ИИ';}
  };

  window.vProfileTab=function(t){curTab=t;var ts=D.querySelectorAll('#vprOv .vpr-tab');for(var i=0;i<ts.length;i++)ts[i].classList.toggle('on',ts[i].getAttribute('data-t')===t);if(t==='profile'){initDraft();renderProfile();}else if(t==='channels')renderChannels();else renderPlan();};
  window.vProfileOpen=function(tab){ensureModal();var ov=byId('vprOv');if(ov)ov.classList.add('open');vProfileTab(tab||'profile');};
  window.vProfileClose=function(){var ov=byId('vprOv');if(ov)ov.classList.remove('open');};

  function injectBtns(){
    var hb=byId('vHeroBtns');
    if(hb&&!byId('vprHeroBtn'))hb.insertAdjacentHTML('beforeend','<button id="vprHeroBtn" class="v-hero-btn" onclick="vProfileOpen()">👤 Профиль</button>');
    if(!byId('vprHeroBtn')&&!byId('vprNavBtn')){var nav=D.querySelector('.nav-in');if(nav)nav.insertAdjacentHTML('beforeend','<button id="vprNavBtn" class="vpr-navbtn" onclick="vProfileOpen()">👤 Профиль</button>');}
    var foot=D.querySelector('.stg-side-foot');
    if(foot&&!byId('vprTgBtn'))foot.insertAdjacentHTML('afterbegin','<button id="vprTgBtn" class="stg-foot-btn" onclick="vProfileOpen()">👤 Профиль</button>');
  }
  function boot(){try{ensureModal();}catch(e){}try{injectBtns();}catch(e){}try{window.vGetProfileChannels=getChannels;window.vGetProfile=getProfile;}catch(e){}}
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
  setTimeout(boot,900);setTimeout(boot,2100);
  D.addEventListener('keydown',function(e){if(e.key==='Escape')window.vProfileClose&&window.vProfileClose();});
})();
