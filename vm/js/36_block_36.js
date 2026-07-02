/* ============ VIORA V18 · часть 2: хук-лаборатория + факт дня в «Утре продюсера» ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16,X=window.__v18;
  if(!C||!V||!X||!X.BENCH){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,copyTxt=C.copyTxt,err11=C.err11;
  var ai=(V.aiRetry||C.ai);
  var B=X.BENCH;

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
  function pid(){return V.pid?V.pid():(C.chid()||'p0');}

  /* ================= ХУК-ЛАБОРАТОРИЯ ================= */
  var FORMULAS=[
    {n:'Конкретная цифра',ex:'«Этот приём сэкономил мне 47 000 рублей»',s:'цифра в первой фразе удерживает на 12–18% лучше абстракций (OpusClip)'},
    {n:'Провокация против большинства',ex:'«Все советуют снимать каждый день. Это убивает канал»',s:'ломает паттерн ожидания — зритель остаётся спорить'},
    {n:'Результат вперёд',ex:'«Вот канал через 90 дней. Сейчас покажу, как»',s:'обещание результата до объяснений — классика удержания'},
    {n:'Открытая петля',ex:'«В конце — ошибка, которую делают 9 из 10 новичков»',s:'недосказанность заставляет досмотреть'},
    {n:'Ошибка/анти-совет',ex:'«Не покупай микрофон, пока не увидишь это»',s:'страх ошибки сильнее желания выгоды'},
    {n:'Ты-обращение',ex:'«Твои Shorts не растут по одной причине»',s:'личное обращение в первые 1,5 сек повышает вовлечённость'},
    {n:'До/после',ex:'«Было 12 просмотров — стало 40 000. Меняли одно»',s:'контраст — самый быстрый способ показать ценность'},
    {n:'Вопрос-ловушка',ex:'«Почему у плохих роликов больше просмотров?»',s:'вопрос без очевидного ответа = досмотр за ответом'},
    {n:'Секрет изнутри',ex:'«Продюсер с 1 млн подписчиков рассказал мне это в личке»',s:'эффект закрытой информации'}
  ];
  var CHECK=[
    'Первый кадр живой: движение камеры/объекта в первые 0,5 секунды (не статичная заставка)',
    'Первое слово — конкретное обещание или вопрос. Без «привет, сегодня я расскажу»',
    'В первой фразе есть цифра или конкретика (+12–18% к удержанию)',
    'Текст на экране в первые 2 секунды: 3–5 слов, читается мгновенно',
    'Хук отвечает на «что я получу за досмотр?» — польза или интрига названа вслух',
    'Все слои (кадр + слово + текст) несут ОДНО сообщение, а не три разных'
  ];

  function hookLab(el){
    if(!el)return;
    var last=lget('v18_hook_last:'+pid(),null);
    var done=lget('v18_hook_chk',[]);
    el.innerHTML=
      '<div class="v18-hookstats">'+
        '<div class="hs"><b>в 5–10 раз</b>режется раздача Shorts, если первые 3 секунды держат меньше 80% зрителей</div>'+
        '<div class="hs"><b>×2,8</b>больше просмотров у роликов с удержанием 85%+ в первые 3 секунды против тех, у кого ниже 60%</div>'+
        '<div class="hs"><b>+12–18%</b>к удержанию даёт конкретная цифра в первой фразе вместо «много/мало»</div>'+
      '</div>'+
      '<div class="v18-card"><b style="font-size:13.5px">🧪 9 формул первой фразы</b>'+
        '<div class="v18-formulas" style="margin-top:10px">'+FORMULAS.map(function(f){
          return '<div class="v18-f"><b>'+f.n+'</b><div class="ex">'+f.ex+'</div><small>'+f.s+'</small></div>';}).join('')+'</div>'+
        '<span class="v18-src">данные: '+B.hook.src+'</span></div>'+
      '<div class="v18-card v18-hookgen"><b style="font-size:13.5px">⚙️ Генератор хуков под твою тему</b>'+
        '<div class="in"><input type="text" id="v18hkTopic" placeholder="Тема ролика, например: собрал игровой ПК за 30 тысяч" value="'+esc(last&&last.topic||'')+'">'+
        '<select id="v18hkFmt"><option value="shorts">Shorts</option><option value="long"'+(last&&last.fmt==='long'?' selected':'')+'>Длинный</option></select>'+
        '<button class="v16-btn" id="v18hkGo">Собрать 5 хуков</button></div>'+
        '<div class="v18-hres" id="v18hkRes"></div></div>'+
      '<div class="v18-card"><b style="font-size:13.5px">✅ Чек-лист хука перед публикацией</b>'+
        '<div class="v18-chk" id="v18chk">'+CHECK.map(function(c,i){
          var on=done.indexOf(i)>-1;
          return '<label class="'+(on?'on':'')+'"><input type="checkbox" data-i="'+i+'"'+(on?' checked':'')+'> '+c+'</label>';}).join('')+'</div>'+
        '<div class="v18-chkbar" id="v18chkBar"></div></div>';
    if(last&&last.hooks)paintHooks(last.hooks);
    paintChkBar();
    q('#v18hkGo',el).addEventListener('click',genHooks);
    q('#v18hkTopic',el).addEventListener('keydown',function(e){if(e.key==='Enter')genHooks();});
    q('#v18chk',el).addEventListener('change',function(e){
      var inp=e.target.closest('input[type=checkbox]');if(!inp)return;
      var i=+inp.getAttribute('data-i'),arr=lget('v18_hook_chk',[]);
      if(inp.checked){if(arr.indexOf(i)<0)arr.push(i);}else arr=arr.filter(function(x){return x!==i;});
      lset('v18_hook_chk',arr);
      inp.closest('label').classList.toggle('on',inp.checked);
      paintChkBar();
      if(arr.length===CHECK.length){toast('🪝 Хук собран по всем правилам — публикуй!');if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}
    });
  }
  function paintChkBar(){
    var el=q('#v18chkBar');if(!el)return;
    var n=lget('v18_hook_chk',[]).length;
    el.textContent=n+' из '+CHECK.length+(n===CHECK.length?' — идеально. Сбрось галочки для следующего ролика.':' пунктов закрыто');
  }
  function paintHooks(hooks){
    var box=q('#v18hkRes');if(!box)return;
    box.innerHTML=hooks.map(function(h,i){
      return '<div class="hr"><div class="bd"><div class="ph">«'+esc(h.phrase)+'»</div>'+
        '<div class="meta"><b>'+esc(h.formula||'')+'</b>'+(h.overlay?' · текст на экране: «'+esc(h.overlay)+'»':'')+(h.frame?' · первый кадр: '+esc(h.frame):'')+'</div></div>'+
        '<button class="v16-btn" data-cp="'+i+'">📋</button></div>';}).join('');
    box.onclick=function(e){
      var b=e.target.closest('[data-cp]');if(!b)return;
      var h=hooks[+b.getAttribute('data-cp')];
      copyTxt(h.phrase+(h.overlay?'\nТекст на экране: '+h.overlay:'')+(h.frame?'\nПервый кадр: '+h.frame:''));
      toast('Хук скопирован');
    };
  }
  function genHooks(){
    var topic=(q('#v18hkTopic')||{}).value||'';topic=topic.trim();
    var fmt=(q('#v18hkFmt')||{}).value||'shorts';
    if(!topic){toast('Сначала напиши тему ролика');return;}
    var box=q('#v18hkRes');box.innerHTML=V.load16('Собираю хуки по формулам удержания…');
    var s=st(),niche=s.primaryNiche||(V.dream()&&V.dream().niche)||'';
    var hits=(s.videos||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,3).map(function(v){return v.title;});
    ai('Ты продюсер YouTube. Отвечай ТОЛЬКО валидным JSON без markdown.',
      'Тема '+(fmt==='shorts'?'Shorts':'длинного ролика')+': "'+topic+'". '+(niche?('Ниша: '+niche+'. '):'')+(hits.length?('Хиты канала: '+hits.join(' | ')+'. '):'')+
      'Собери 5 хуков (первая произносимая фраза ролика, до 12 слов) по РАЗНЫМ формулам из списка: конкретная цифра; провокация против большинства; результат вперёд; открытая петля; ошибка/анти-совет; ты-обращение; до/после; вопрос-ловушка; секрет изнутри. Правила: без «привет», без «сегодня я расскажу», хотя бы в двух хуках конкретная цифра. JSON: {"hooks":[{"formula":"название формулы","phrase":"первая фраза","overlay":"текст на экране 3-5 слов","frame":"что в первом кадре, до 8 слов"}]}',900)
    .then(function(t){
      var j=JSON.parse(String(t).replace(/```json|```/g,'').trim());
      var hooks=(j.hooks||[]).slice(0,5);
      if(!hooks.length)throw new Error('пустой ответ');
      lset('v18_hook_last:'+pid(),{topic:topic,fmt:fmt,hooks:hooks,ts:Date.now()});
      paintHooks(hooks);
    })
    .catch(function(e){box.innerHTML=err11('Хуки не собрались: '+((e&&e.message)||e)+'. Попробуй ещё раз.');});
  }
  X.hookLab=hookLab;

  /* ================= ФАКТ ДНЯ в «Утре продюсера» ================= */
  function dayIndex(){
    var d=new Date(),start=new Date(d.getFullYear(),0,0);
    return Math.floor((d-start)/864e5);
  }
  function factCard(){
    var f=B.facts[dayIndex()%B.facts.length];
    return '<div class="v18-fact" id="v18fact"><span class="fi">💡</span><div class="fb"><b>Факт дня из исследований</b>'+
      f.t+'<span class="do">→ '+f.a+'</span><small>источник: '+f.s+'</small></div></div>';
  }
  var origMorning=V.RENDER.morning;
  if(origMorning){
    V.RENDER.morning=function(body){
      origMorning(body);
      try{
        if(!q('#v18fact',body)){
          var card=D.createElement('div');card.innerHTML=factCard();
          var first=body.firstElementChild;
          if(first&&first.nextSibling)body.insertBefore(card.firstElementChild,first.nextSibling);
          else body.appendChild(card.firstElementChild);
        }
      }catch(e){}
    };
  }

  /* ================= инструмент в общем списке ================= */
  if(C.regTool)C.regTool({id:'v18growth',ic:'📈',name:'Рост: ты против рынка',d:'Твои цифры против исследований vidIQ, Buffer и Modash: вовлечённость, время выхода, путь к монетизации, хук-лаборатория',fn:function(){W.v16HqOpen('growth');},hub:true});
}
boot();
})();
