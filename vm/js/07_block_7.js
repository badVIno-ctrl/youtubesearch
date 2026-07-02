/* ===== VIORA R8 behaviour fixes ===== */
(function(){
  function byId(id){return document.getElementById(id);}
  /* --- Telegram studio tab switching (tgTab was undefined => Posts/Plan dead) --- */
  window.tgTab=function(name){
    var map={chats:'stgPaneChats',posts:'stgPanePosts',plan:'stgPanePlan'};
    Object.keys(map).forEach(function(k){var p=byId(map[k]);if(p)p.style.display=(k===name)?'flex':'none';});
    var tabs=document.querySelectorAll('.stg-tab');
    for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle('active',tabs[i].getAttribute('data-tab')===name);}
    try{
      if(name==='posts'){if(window.__VP&&typeof window.__VP.pdRender==='function')window.__VP.pdRender();else if(typeof pdRender==='function')pdRender();}
      else if(name==='chats'){if(typeof tgRenderChatList==='function')tgRenderChatList();}
      else if(name==='plan'){renderPlanMini();}
    }catch(e){}
  };
  function renderPlanMini(){var box=byId('stgPlanMini');if(!box)return;
    if(!box.innerHTML.trim())box.innerHTML='<div class="stg-empty">\u041d\u0430\u0436\u043c\u0438 \u00ab\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043f\u043b\u0430\u043d\u0435\u0440\u00bb \u2014 Viora \u0441\u043e\u0431\u0435\u0440\u0451\u0442 \u043a\u043e\u043d\u0442\u0435\u043d\u0442-\u043f\u043b\u0430\u043d \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e \u0438 \u0441\u0432\u044f\u0436\u0435\u0442 \u0435\u0433\u043e \u0441 \u0442\u0432\u043e\u0438\u043c YouTube.</div>';}
  /* --- planOpen (was undefined) --- */
  if(typeof window.planOpen!=='function'){
    window.planOpen=function(){try{window.tgTab('chats');}catch(e){}var i=byId('tgInput');
      if(i){i.value='\u0421\u043e\u0441\u0442\u0430\u0432\u044c \u043a\u043e\u043d\u0442\u0435\u043d\u0442-\u043f\u043b\u0430\u043d \u0434\u043b\u044f \u043c\u043e\u0435\u0433\u043e Telegram \u043d\u0430 \u043d\u0435\u0434\u0435\u043b\u044e \u0441 \u0444\u043e\u0440\u043c\u0430\u0442\u0430\u043c\u0438, \u0442\u0435\u043c\u0430\u043c\u0438 \u0438 \u0441\u0432\u044f\u0437\u043a\u043e\u0439 \u0441 YouTube.';
        if(typeof tgAutoGrow==='function')try{tgAutoGrow(i);}catch(e){}}
      if(typeof tgSendChat==='function')try{tgSendChat();}catch(e){}};
  }
  /* --- smooth platform crossfade --- */
  function fadeIn(el){if(!el)return;el.style.opacity='0';
    requestAnimationFrame(function(){requestAnimationFrame(function(){
      el.style.transition='opacity .55s cubic-bezier(.22,.61,.36,1)';el.style.opacity='1';});});}
  if(typeof window.enterTelegram==='function'){var _tg=window.enterTelegram;
    window.enterTelegram=function(){_tg.apply(this,arguments);fadeIn(byId('tgScreen'));};}
  if(typeof window.enterYoutube==='function'){var _yt=window.enterYoutube;
    window.enterYoutube=function(){_yt.apply(this,arguments);fadeIn(byId('hero'));};}
})();
