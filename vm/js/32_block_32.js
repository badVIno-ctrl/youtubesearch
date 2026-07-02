/* ============ VIORA V16 · Чек-ап перед публикацией ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,toast=C.toast,chid=C.chid,ai=((W.__v16&&W.__v16.aiRetry)||C.ai),err11=C.err11,clamp=C.clamp,copyTxt=C.copyTxt,lget=C.lget,lset=C.lset;
  var IMG=null; /* {dataUrl, metrics} */
  function chkKey(){return 'v16_chk_last:'+V.pid();}
  /* свежие хиты конкурентов из анализа — для сравнения упаковки */
  function compCtx(){
    try{
      var s=(typeof STATE!=='undefined'&&STATE)?STATE:{};
      var rows=[];
      (s.competitors||[]).forEach(function(c){
        (c.vids||[]).slice().sort(function(a,b){return b.viewsPerDay-a.viewsPerDay;}).slice(0,2).forEach(function(v){
          rows.push('['+((c.ch&&c.ch.title)||'конкурент')+'] «'+v.title+'» — '+Math.round(v.viewsPerDay)+' просм/день');
        });
      });
      return rows.slice(0,6).join('\n');
    }catch(e){return '';}
  }

  V.RENDER.chk=function(body){
    IMG=null;
    body.innerHTML='<div class="v16-card"><div class="v16-h4">🚀 Чек-ап перед публикацией</div>'+
      '<div class="v16-note" style="margin-bottom:13px">Кидай превью + заголовок + описание до заливки — получишь скор 0–100 по нормам'+(chid()?' твоего канала':' ниши')+', список конкретных правок и готовый SEO-пакет.</div>'+
      '<div class="v16-chk-grid"><div>'+
      '<div class="v16-drop" id="v16chkDrop"><span class="lbl">🖼 Кликни или перетащи превью<br><small style="opacity:.7">jpg / png, лучше 1280×720</small></span></div>'+
      '<input type="file" id="v16chkFile" accept="image/*" style="display:none">'+
      '<div class="v16-note" id="v16chkImgInfo" style="margin-top:9px"></div>'+
      '</div><div style="display:flex;flex-direction:column;gap:10px">'+
      '<input class="v16-in" id="v16chkTitle" placeholder="Заголовок ролика">'+
      '<textarea class="v16-in" id="v16chkDesc" placeholder="Описание (первые строки — самые важные)"></textarea>'+
      '<div class="v16-row"><select class="v16-in" id="v16chkFmt" style="min-width:130px"><option value="long">Длинный</option><option value="shorts">Shorts</option></select>'+
      '<button class="v16-btn" id="v16chkGo" style="flex:1;justify-content:center">🚀 Проверить перед заливкой</button></div>'+
      '</div></div><div id="v16chkOut" style="margin-top:14px"></div></div>';
    var drop=q('#v16chkDrop'),file=q('#v16chkFile');
    drop.addEventListener('click',function(){file.click();});
    drop.addEventListener('dragover',function(e){e.preventDefault();drop.style.borderColor='rgba(255,45,85,.6)';});
    drop.addEventListener('dragleave',function(){drop.style.borderColor='';});
    drop.addEventListener('drop',function(e){e.preventDefault();drop.style.borderColor='';if(e.dataTransfer.files[0])readImg(e.dataTransfer.files[0]);});
    file.addEventListener('change',function(){if(file.files[0])readImg(file.files[0]);});
    q('#v16chkGo').addEventListener('click',run);
    /* последний чек-ап восстанавливается мгновенно */
    var last=lget(chkKey(),null);
    if(last&&last.d){
      var t=q('#v16chkTitle');if(t&&last.title)t.value=last.title;
      var ds=q('#v16chkDesc');if(ds&&last.desc)ds.value=last.desc;
      try{
        render(q('#v16chkOut'),last.d,last.fmtv||'long',true);
        var note=D.createElement('div');note.className='v16-note';note.style.cssText='margin-top:8px;text-align:center';
        note.textContent='💾 Последний чек-ап — из памяти. Запусти новый, чтобы перепроверить.';
        q('#v16chkOut').appendChild(note);
      }catch(e){}
    }
  };

  function readImg(f){
    if(!/^image\//.test(f.type)){toast('Нужна картинка (jpg/png)','warn');return;}
    var r=new FileReader();
    r.onload=function(){
      var img=new Image();
      img.onload=function(){
        IMG={dataUrl:r.result,metrics:metrics(img,f)};
        var drop=q('#v16chkDrop');
        if(drop)drop.innerHTML='<img src="'+r.result+'" alt="превью"><span class="lbl">🖼 Заменить превью</span>';
        var info=q('#v16chkImgInfo');
        if(info){
          var m=IMG.metrics;
          info.innerHTML=[
            m.w+'×'+m.h+(Math.abs(m.ar-1.78)>0.06&&q('#v16chkFmt').value!=='shorts'?' ⚠️ не 16:9':''),
            'яркость '+m.bright+'/255'+(m.bright<70?' ⚠️ темно':m.bright>200?' ⚠️ пересвет':''),
            'контраст '+m.contrast+(m.contrast<28?' ⚠️ вяло':''),
            'насыщенность '+m.sat+'%'+(m.sat<18?' ⚠️ блекло':''),
            'детализация '+m.busy+(m.busy>34?' ⚠️ перегруз':'')
          ].join(' · ');
        }
      };
      img.src=r.result;
    };
    r.readAsDataURL(f);
  }
  function metrics(img,f){
    var cw=96,chh=Math.max(8,Math.round(cw*img.naturalHeight/Math.max(img.naturalWidth,1)));
    var cv=D.createElement('canvas');cv.width=cw;cv.height=chh;
    var cx=cv.getContext('2d');cx.drawImage(img,0,0,cw,chh);
    var d=cx.getImageData(0,0,cw,chh).data;
    var n=cw*chh,sum=0,sum2=0,sat=0,edge=0;
    var lum=new Float32Array(n);
    for(var i=0;i<n;i++){
      var r=d[i*4],g=d[i*4+1],b=d[i*4+2];
      var L=0.2126*r+0.7152*g+0.0722*b;
      lum[i]=L;sum+=L;sum2+=L*L;
      var mx=Math.max(r,g,b),mn=Math.min(r,g,b);
      sat+=mx?((mx-mn)/mx):0;
    }
    for(var y=0;y<chh;y++)for(var x=1;x<cw;x++)edge+=Math.abs(lum[y*cw+x]-lum[y*cw+x-1]);
    var mean=sum/n,std=Math.sqrt(Math.max(0,sum2/n-mean*mean));
    return {w:img.naturalWidth,h:img.naturalHeight,ar:+(img.naturalWidth/Math.max(img.naturalHeight,1)).toFixed(2),
      bright:Math.round(mean),contrast:Math.round(std),sat:Math.round(sat/n*100),busy:Math.round(edge/(n)),kb:Math.round((f.size||0)/1024)};
  }

  async function run(){
    var title=(q('#v16chkTitle')||{}).value||'';title=title.trim();
    var desc=(q('#v16chkDesc')||{}).value||'';desc=desc.trim();
    var fmtv=(q('#v16chkFmt')||{}).value||'long';
    if(!title){toast('Вставь заголовок — без него чек-ап не имеет смысла','warn');return;}
    var out=q('#v16chkOut'),go=q('#v16chkGo');go.disabled=true;
    out.innerHTML=V.load16('Прогоняю по нормам'+(chid()?' твоего канала':' ниши')+' и собираю SEO-пакет…');
    try{
      var m=IMG&&IMG.metrics;
      var imtxt=m?('Замеры превью (локальный анализ): '+m.w+'×'+m.h+' ('+m.ar+':1), яркость '+m.bright+'/255, контраст '+m.contrast+' (норма 30-60), насыщенность '+m.sat+'% (норма 25-60), детализация/зашумлённость '+m.busy+' (норма 8-30, выше — каша из деталей).')
        :'Превью НЕ загружено — оцени thumb как 0 из возможных и первой правкой потребуй превью.';
      var cc=compCtx();
      var sys='Ты — строгий пре-публикационный аудитор YouTube. Оцени пакет (заголовок + описание + замеры превью) ПО НОРМАМ КАНАЛА и методике ВИСП (Выгода, Интрига, Срочность, Причастность). Будь честным: средний пакет = 50-65, отличный = 80+. Все правки — конкретные, «возьми и сделай», с примером. SEO-пакет пиши готовым к вставке: описание 3-5 строк с ключевым запросом в первой строке, 10-14 тегов, таймкоды-шаблон (если длинный ролик), закреп-комментарий с вопросом для вовлечения. Верни СТРОГО валидный JSON без markdown: {"score":0,"sub":{"title":0,"thumb":0,"desc":0,"fit":0},"verdict":"вердикт одним предложением с эмодзи","fixes":[{"what":"что не так","how":"как исправить + пример","prio":"high|med|low"}],"seo":{"description":"…","tags":["…"],"timecodes":["0:00 — …"],"pin":"…"}'+(cc?',"vs":"сравнение упаковки с хитами конкурентов: чем их заголовки сильнее/слабее этого и что перенять, 2-3 конкретных предложения"':'')+'}. sub.fit — попадание в темы/нормы канала. fixes: 3-6 штук, отсортируй по prio.';
      var user='ЗАГОЛОВОК: «'+title+'»\nОПИСАНИЕ: '+(desc?'«'+desc.slice(0,900)+'»':'(пустое!)')+'\nФОРМАТ: '+(fmtv==='shorts'?'Shorts':'длинный ролик')+'\n'+imtxt+'\n\n'+(V.anyCtx()||'Данных о канале нет — оценивай по общим нормам ниши.')+(V.hitFormula()?'\nФОРМУЛА ХИТА КАНАЛА: '+V.hitFormula():'')+(cc?'\n\nСВЕЖИЕ ХИТЫ КОНКУРЕНТОВ (для сравнения упаковки):\n'+cc:'');
      var d=await ai(sys,user,2600);
      render(out,d,fmtv);
      try{lset(chkKey(),{d:d,fmtv:fmtv,title:title,desc:desc,ts:Date.now()});}catch(e){}
    }catch(e){out.innerHTML=err11((e&&e.message)||'чек-ап не прошёл — попробуй ещё раз');}
    go.disabled=false;
  }

  function ring(score){
    var col=score>=75?'#3ddc97':score>=50?'#ffb020':'#ff5e7a';
    var rr=52,cc=2*Math.PI*rr;
    return '<div class="v16-score"><svg width="120" height="120"><circle cx="60" cy="60" r="'+rr+'" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="9"/>'+
      '<circle cx="60" cy="60" r="'+rr+'" fill="none" stroke="'+col+'" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+cc+'" stroke-dashoffset="'+(cc*(1-score/100))+'" style="transition:stroke-dashoffset 1s ease"/></svg>'+
      '<div class="n" style="color:'+col+'">'+score+'</div><small>из 100</small></div>';
  }
  function bar(name,val){
    var col=val>=75?'#3ddc97':val>=50?'#ffb020':'#ff5e7a';
    return '<div class="v16-sub"><div class="sl"><span>'+name+'</span><b style="color:'+col+'">'+val+'</b></div><div class="sb"><i style="width:'+clamp(val,0,100)+'%;background:'+col+'"></i></div></div>';
  }
  function seoItem(ic,name,val){
    if(!val)return '';
    return '<div class="v16-seo-item"><div class="sh"><span>'+ic+' '+name+'</span><button class="v16-copy" data-c="'+esc(val).replace(/"/g,'&quot;')+'" onclick="v11Copy(this)">📋 Копировать</button></div><div class="sv">'+esc(val)+'</div></div>';
  }
  function render(out,d,fmtv,fromCache){
    var score=Math.round(clamp(+d.score||0,0,100));
    var sub=d.sub||{};
    var seo=d.seo||{};
    var vcol=score>=75?'rgba(61,220,151,.35)':score>=50?'rgba(255,176,32,.35)':'rgba(255,94,122,.4)';
    var vtxt=score>=75?'Можно заливать':score>=50?'Залить можно, но правки поднимут результат':'Пока не публикуй — сначала правки';
    out.innerHTML='<div class="v16-card" style="border-color:'+vcol+'"><div class="v16-score-wrap">'+ring(score)+
      '<div class="v16-subs">'+bar('Заголовок',Math.round(+sub.title||0))+bar('Превью',Math.round(+sub.thumb||0))+bar('Описание',Math.round(+sub.desc||0))+bar('Попадание в канал',Math.round(+sub.fit||0))+'</div></div>'+
      '<div style="margin-top:13px;font-size:14.5px;line-height:1.5"><b>'+esc(vtxt)+'.</b> '+esc(d.verdict||'')+'</div></div>'+
      '<div class="v16-card"><div class="v16-h4">🔧 Правки перед заливкой</div>'+
      ((d.fixes||[]).map(function(f){
        var p=f.prio==='high'?'high':f.prio==='low'?'low':'med';
        return '<div class="v16-fix"><span class="p '+p+'">'+(p==='high'?'СРОЧНО':p==='med'?'ВАЖНО':'ПОЛЕЗНО')+'</span><div><b>'+esc(f.what||'')+'</b><div class="v16-note" style="margin-top:3px">'+esc(f.how||'')+'</div></div></div>';
      }).join('')||'<div class="v16-note">Правок нет — пакет собран отлично.</div>')+'</div>'+
      '<div class="v16-card"><div class="v16-h4">📦 Готовый SEO-пакет</div>'+
      seoItem('📝','Описание',seo.description)+
      seoItem('🏷','Теги',(seo.tags||[]).join(', '))+
      (fmtv==='long'?seoItem('⏱','Таймкоды',(seo.timecodes||[]).join('\n')):'')+
      seoItem('📌','Закреп-комментарий',seo.pin)+
      '</div>'+
      (d.vs?'<div class="v16-card"><div class="v16-h4">⚔️ Против конкурентов</div><div class="v16-note" style="font-size:14px;line-height:1.55">'+esc(d.vs)+'</div></div>':'');
    if(!fromCache&&score>=80){try{if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}catch(e){}}
  }
}
boot();
})();

;
/* ============ VIORA V16 · Онбординг при первом запуске + стартовый план ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16;
  if(!C||!V){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,qa=C.qa,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,ai=((W.__v16&&W.__v16.aiRetry)||C.ai),chid=C.chid;

  var NICHES=['Гейминг','Обучение / экспертиза','Влоги / лайфстайл','Обзоры техники','Финансы и инвестиции','Кулинария','Фитнес и здоровье','Юмор / скетчи','Наука и факты','Авто','Путешествия','DIY / рукоделие'];
  var AUDS=['Новички в теме','Ровесники, как я','Профи и продвинутые','Геймеры','Предприниматели','Широкая аудитория'];
  /* уточнение внутри ниши — чтобы план строился на том, что автор реально хочет снимать,
     а не на выдуманных AI играх/темах */
  var SUBTOPICS={
    'Гейминг':['Шутеры (CS, Valorant…)','Minecraft','Roblox','Dota / LoL / мобы','Хорроры','Инди-игры','Мобильные игры','Симуляторы / стратегии','Ретро-игры','Прохождения сюжеток','Стримы-нарезки','Киберспорт и разборы'],
    'Обучение / экспертиза':['IT и программирование','Языки','Дизайн','Маркетинг','Школьные предметы','Психология','Музыка'],
    'Влоги / лайфстайл':['Будни и рутина','Переезд / жизнь в другой стране','Семья и дети','Минимализм','Студенчество'],
    'Обзоры техники':['Смартфоны','ПК и комплектующие','Гаджеты до 5000₽','Аудио','Умный дом'],
    'Финансы и инвестиции':['Инвестиции для новичков','Крипта','Бюджет и экономия','Бизнес с нуля'],
    'Кулинария':['Простые рецепты','Выпечка','ПП и здоровое питание','Национальная кухня','Готовка на бюджете'],
    'Фитнес и здоровье':['Тренировки дома','Зал и силовые','Похудение','Йога и растяжка','Бег'],
    'Юмор / скетчи':['Скетчи','Пародии','Мемы и обзоры трендов','Стендап'],
    'Наука и факты':['Космос','История','Технологии будущего','Психология и мозг','Разрушение мифов'],
    'Авто':['Обзоры авто','Ремонт своими руками','Автопутешествия','Тюнинг'],
    'Путешествия':['Бюджетные путешествия','По России','Экзотика','Походы и кемпинг'],
    'DIY / рукоделие':['Ремонт и стройка','Дерево / мастерская','Хендмейд на продажу','3D-печать']
  };

  function saveProfileV16(p){
    var prof=null;
    try{prof=JSON.parse(localStorage.getItem('viora_profile_v1')||'null');}catch(e){}
    prof=prof||{};
    Object.keys(p).forEach(function(k){prof[k]=p[k];});
    prof.ts=Date.now();
    try{if(typeof W.saveProfile==='function'){W.saveProfile(prof);return;}}catch(e){}
    try{localStorage.setItem('viora_profile_v1',JSON.stringify(prof));}catch(e){}
  }

  W.v16OnbOpen=function(){
    var old=q('#v16onb');if(old)old.remove();
    try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}
    /* старый квиз мог уже встать в очередь — гасим его, чтобы не было двух опросников */
    var kill=setInterval(function(){var pq=q('#profileQuiz');if(pq)pq.remove();},250);
    setTimeout(function(){clearInterval(kill);},3500);
    var a={has:'',link:'',niche:'',sub:'',subCustom:'',custom:'',audience:'',audCustom:'',format:'both',hours:'mid',goal:'grow',gear:'phone',level:'new'};
    var step=0;
    var ov=D.createElement('div');ov.id='v16onb';
    function steps(){
      var base=[{t:'Шаг 1 — начнём с главного',h:'У тебя уже есть канал?',body:function(){
        return opt('has','yt','▶️','Да, YouTube','Вставишь ссылку — сразу сделаю полный аудит')+
          opt('has','tg','✈️','Да, Telegram','Открою Telegram-студию: посты, идеи, связка с YouTube')+
          opt('has','none','🌱','Нет — хочу начать','Скажи, что хочешь снимать, — соберу стартовый план с нуля');
      }}];
      if(a.has==='yt')return base.concat([
        {t:'Шаг 2',h:'Ссылка на твой канал',body:function(){return '<input class="v16-in" id="v16oLink" style="width:100%" placeholder="youtube.com/@handle или ссылка на видео" value="'+esc(a.link)+'">'+'<div class="v16-note" style="margin-top:9px">Подойдёт любой формат ссылки. После опросника запущу анализ автоматически.</div>';}},
        {t:'Шаг 3',h:'Какой у тебя опыт?',body:function(){return opt('level','new','🐣','Новичок','Объясняю проще, шаги по одному')+opt('level','pro','🚀','Уже опытный','Плотно, без азов');}},
        {t:'Шаг 4',h:'Главная цель?',body:function(){return goals();}},
        {t:'Шаг 5',h:'Сколько времени есть на контент?',body:function(){return hoursOpts();}}
      ]);
      if(a.has==='tg')return base.concat([
        {t:'Шаг 2',h:'Какой у тебя опыт?',body:function(){return opt('level','new','🐣','Новичок','')+opt('level','pro','🚀','Уже опытный','');}},
        {t:'Шаг 3',h:'Главная цель?',body:function(){return goals();}}
      ]);
      if(a.has==='none'){
      var noneSteps=[
        {t:'Шаг 2',h:'Что хочешь снимать?',body:function(){
          return '<div class="v16-chips">'+NICHES.map(function(n){return '<button type="button" class="v16-chip'+(a.niche===n?' on':'')+'" data-g="niche" data-v="'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div>'+
            '<input class="v16-in" id="v16oCustom" style="width:100%" placeholder="…или своими словами: «разборы матчей КС», «жизнь на даче»" value="'+esc(a.custom)+'">';
        }}];
      /* уточняющий шаг: про что именно, чтобы план не выдумывал за автора */
      if(a.niche&&SUBTOPICS[a.niche]&&!a.custom)noneSteps.push(
        {t:'Шаг 3',h:'А конкретнее — про что именно?',body:function(){
          return '<div class="v16-chips">'+SUBTOPICS[a.niche].map(function(n){return '<button type="button" class="v16-chip'+(a.sub===n?' on':'')+'" data-g="sub" data-v="'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div>'+
            '<input class="v16-in" id="v16oSub" style="width:100%" placeholder="…или напиши сам: конкретная игра, тема, формат" value="'+esc(a.subCustom)+'">'+
            '<div class="v16-note" style="margin-top:9px">План будет строиться именно вокруг этого — идеи роликов, заголовки, конкуренты.</div>';
        }});
      return base.concat(noneSteps).concat([
        {t:'Далее',h:'Кому это будет интересно?',body:function(){
          return '<div class="v16-chips">'+AUDS.map(function(n){return '<button type="button" class="v16-chip'+(a.audience===n?' on':'')+'" data-g="audience" data-v="'+esc(n)+'">'+esc(n)+'</button>';}).join('')+'</div>'+
            '<input class="v16-in" id="v16oAud" style="width:100%" placeholder="…или опиши сам (необязательно)" value="'+esc(a.audCustom)+'">';
        }},
        {t:'Формат',h:'Какой формат ближе?',body:function(){
          return opt('format','shorts','⚡','Короткие Shorts','Снимать быстро, расти на охватах')+
            opt('format','long','🎬','Длинные ролики','Глубже тема — лояльнее зритель')+
            opt('format','both','🔀','И то, и то','Классическая связка для роста');
        }},
        {t:'Время',h:'Сколько времени готов вкладывать?',body:function(){return hoursOpts();}},
        {t:'Цель',h:'Зачем тебе это? Честно :)',body:function(){return goals(true);}},
        {t:'Почти всё',h:'На что будешь снимать?',body:function(){
          return opt('gear','phone','📱','Телефон','Этого достаточно для старта — серьёзно')+
            opt('gear','cam','📷','Камера','Есть техника — используем по полной')+
            opt('gear','screen','🖥','Запись экрана','Без лица: гайды, игры, разборы');
        }}
      ]);
      }
      return base;
    }
    function opt(g,v,ic,t,d){
      return '<button type="button" class="v16-opt'+(a[g]===v?' on':'')+'" data-g="'+g+'" data-v="'+v+'"><span class="ic">'+ic+'</span><span><b>'+t+'</b>'+(d?'<small>'+d+'</small>':'')+'</span></button>';
    }
    function goals(withHobby){
      return opt('goal','grow','🚀','Набрать аудиторию','Первая 1000 подписчиков и дальше')+
        opt('goal','money','💰','Выйти на доход','Реклама, продукты, донаты')+
        opt('goal','brand','⭐','Личный бренд','Стать узнаваемым в своей теме')+
        (withHobby?opt('goal','hobby','🎈','Для души','Без давления цифр — в удовольствие'):'');
    }
    function hoursOpts(){
      return opt('hours','low','🌙','2–3 часа в неделю','План будет компактным')+
        opt('hours','mid','🌤','5–7 часов в неделю','Стабильный темп')+
        opt('hours','high','☀️','10+ часов в неделю','Максимальная скорость');
    }
    function grab(){
      var l=q('#v16oLink',ov);if(l)a.link=l.value.trim();
      var cu=q('#v16oCustom',ov);if(cu)a.custom=cu.value.trim();
      var su=q('#v16oSub',ov);if(su)a.subCustom=su.value.trim();
      var au=q('#v16oAud',ov);if(au)a.audCustom=au.value.trim();
    }
    function render(){
      var st=steps();
      if(step>=st.length)step=st.length-1;
      var s=st[step];
      var dots=st.map(function(_,i){return '<span class="'+(i===step?'on':i<step?'done':'')+'"></span>';}).join('');
      ov.innerHTML='<div class="v16-onb"><div class="v16-onb-head"><b>🎯 Настроим Viora под тебя</b><div class="v16-dots">'+dots+'</div></div>'+
        '<div class="v16-onb-q">'+s.t+'<b>'+s.h+'</b></div>'+
        '<div>'+s.body()+'</div>'+
        '<div class="v16-onb-nav"><button type="button" class="v16-skip" id="v16oSkip">Пропустить</button>'+
        '<div class="v16-row">'+(step>0?'<button type="button" class="v16-btn ghost" id="v16oBack">← Назад</button>':'')+
        '<button type="button" class="v16-btn" id="v16oNext">'+(step===st.length-1?'✅ Готово':'Далее →')+'</button></div></div>'+
        '<div class="v16-priv">🔒 Без имён, почты и телефона. Ответы хранятся только в твоём браузере.</div></div>';
      qa('.v16-opt,.v16-chip',ov).forEach(function(b){
        b.addEventListener('click',function(){
          grab();
          a[b.getAttribute('data-g')]=b.getAttribute('data-v');
          var st2=steps();
          if(b.classList.contains('v16-opt')&&step<st2.length-1){step++;render();}
          else render();
        });
      });
      var sk=q('#v16oSkip',ov);if(sk)sk.addEventListener('click',function(){ov.remove();});
      var bk=q('#v16oBack',ov);if(bk)bk.addEventListener('click',function(){grab();step--;render();});
      var nx=q('#v16oNext',ov);if(nx)nx.addEventListener('click',function(){
        grab();
        var st2=steps();
        if(!a.has){toast('Выбери вариант','warn');return;}
        if(a.has==='yt'&&step===1&&!a.link){toast('Вставь ссылку на канал','warn');return;}
        if(a.has==='none'&&step===1&&!a.niche&&!a.custom){toast('Выбери нишу или напиши свою','warn');return;}
        if(step<st2.length-1){step++;render();}else finish();
      });
    }
    function finish(){
      ov.remove();
      if(a.has==='yt'){
        saveProfileV16({level:a.level,context:'mixed',goal2:a.goal,hours:a.hours,ytLink:a.link});
        toast('Профиль сохранён — запускаю аудит 🚀','ok');
        setTimeout(function(){
          try{
            if(typeof W.enterYoutube==='function')W.enterYoutube();
            var i=q('#urlInput');
            if(i){i.value=a.link;if(typeof W.startAnalysis==='function')W.startAnalysis();}
          }catch(e){}
        },420);
        return;
      }
      if(a.has==='tg'){
        saveProfileV16({level:a.level,context:'mixed',goal2:a.goal});
        toast('Профиль сохранён ✈️','ok');
        setTimeout(function(){try{if(typeof W.enterTelegram==='function')W.enterTelegram();}catch(e){}},380);
        return;
      }
      /* dream-режим: канала нет */
      var d={niche:a.niche,sub:[a.sub,a.subCustom].filter(Boolean).join('; '),custom:a.custom,audience:[a.audience,a.audCustom].filter(Boolean).join('; '),
        format:a.format,hours:a.hours,goal:a.goal,gear:a.gear,ts:Date.now()};
      lset('v16_dream',d);
      saveProfileV16({level:'new',context:'mixed',goal2:a.goal,hours:a.hours,dream:1});
      W.v16PlanOpen(true);
    }
    render();
    D.body.appendChild(ov);
  };

  /* ---------- стартовый план новичка ---------- */
  function planEl(){
    var el=q('#v16plan');
    if(el)return el;
    el=D.createElement('div');el.id='v16plan';
    el.innerHTML='<div class="v16-top" style="position:sticky;top:0;z-index:3;background:rgba(11,10,13,.92);backdrop-filter:blur(10px)"><button class="v16-back" onclick="v16PlanClose()">←</button><div class="v16-ttl"><span>🚀</span><div>Твой стартовый план<small>Viora собрала запуск канала с нуля</small></div></div></div><div class="v16-plan-wrap" id="v16planBody"></div>';
    D.body.appendChild(el);
    return el;
  }
  W.v16PlanClose=function(){var el=q('#v16plan');if(el)el.classList.remove('open');D.body.style.overflow='';if(!(q('#v16hq')&&q('#v16hq').classList.contains('open')))D.body.classList.remove('v16-ov-open');};
  W.v16PlanOpen=function(rebuild){
    var d=V.dream();
    if(!d){W.v16OnbOpen();return;}
    var el=planEl();el.classList.add('open');D.body.style.overflow='hidden';D.body.classList.add('v16-ov-open');
    var body=q('#v16planBody',el);
    if(d.plan&&!rebuild){renderPlan(body,d);return;}
    body.innerHTML=V.load16('Viora продумывает твой запуск: ниша, первые ролики, план недели — ~20 секунд…');
    var sys='Ты — продюсер, который запускает новичка на YouTube с нуля. Говори просто, тепло и конкретно, как друг-наставник, без жаргона (термины поясняй в скобках). Учитывай формат, технику и время автора. Темы первых роликов — лёгкие для съёмки, но цепляющие; заголовки — по ВИСП (выгода/интрига/число/причастность). Верни СТРОГО валидный JSON без markdown: {"verdict":"честный вердикт ниши: спрос, конкуренция, шанс новичка — 2-3 предложения","positioning":"позиционирование: чем выделиться — 1-2 предложения","names":["3 варианта названия канала"],"first":[{"title":"кликабельный заголовок","format":"shorts|long","hook":"первая фраза ролика дословно","why":"почему это хороший первый ролик, до 15 слов"}],"week":["7 шагов первой недели, каждый с глагола, выполним за вечер"],"gear":"совет под технику автора: свет/звук/кадр, 2-3 предложения","growth":"один главный принцип роста для этой ниши, 1-2 предложения"}. first — ровно 5 роликов.';
    ai(sys,V.dreamCtx(),2800).then(function(p){
      d.plan=p;lset('v16_dream',d);
      renderPlan(body,d);
      toast('🚀 Стартовый план готов','ok');
    }).catch(function(e){
      body.innerHTML='<div class="v16-err">⚠️ '+esc((e&&e.message)||'не получилось')+'</div><div class="v16-row" style="margin-top:12px"><button class="v16-btn" onclick="v16PlanOpen(true)">Попробовать ещё раз</button></div>';
    });
  };
  function renderPlan(body,d){
    var p=d.plan||{};
    var marks=lget('v16_week_done',{})||{};
    body.innerHTML=
      '<div class="v16-plan-hero"><span class="ic">🌱</span><div><h2>'+esc(d.custom||(d.niche&&d.sub?d.niche+' · '+d.sub:d.niche)||'Твой канал')+'</h2><p>'+esc(p.positioning||'')+'</p></div></div>'+
      '<div class="v16-card"><div class="v16-h4">🧭 Честный вердикт ниши</div><div style="font-size:14px;line-height:1.6">'+esc(p.verdict||'')+'</div></div>'+
      ((p.names||[]).length?'<div class="v16-card"><div class="v16-h4">✏️ Название канала</div><div class="v16-chips">'+(p.names||[]).map(function(n){return '<span class="v16-chip" style="cursor:default">'+esc(n)+'</span>';}).join('')+'</div></div>':'')+
      '<div class="v16-card"><div class="v16-h4">🎬 Первые 5 роликов</div>'+
      (p.first||[]).map(function(f,i){
        return '<div class="v16-fv"><span class="n">'+(i+1)+'</span><b>'+(f.format==='long'?'🎬':'⚡')+' '+esc(f.title||'')+'</b>'+
          (f.hook?'<div class="hk">🪝 «'+esc(f.hook)+'»</div>':'')+
          (f.why?'<div class="meta">💡 '+esc(f.why)+'</div>':'')+
          '<div class="v16-row"><button class="v16-btn ghost" style="min-height:34px;padding:7px 13px;font-size:12px" data-scr="'+esc(f.title||'').replace(/"/g,'&quot;')+'">📝 Сценарий</button>'+
          '<button class="v16-btn ghost" style="min-height:34px;padding:7px 13px;font-size:12px" data-bt="'+esc(f.title||'').replace(/"/g,'&quot;')+'">🥊 Турнир заголовков</button></div></div>';
      }).join('')+'</div>'+
      '<div class="v16-card"><div class="v16-h4">🗓 Первая неделя — по шагам</div><ol class="v16-wk">'+
      (p.week||[]).map(function(s,i){return '<li style="'+(marks[i]?'opacity:.5;text-decoration:line-through':'')+'"><label style="cursor:pointer;display:flex;gap:9px;align-items:flex-start"><input type="checkbox" data-wk="'+i+'" '+(marks[i]?'checked':'')+' style="margin-top:4px;accent-color:#FF2D55">'+esc(s)+'</label></li>';}).join('')+'</ol></div>'+
      '<div class="v16-grid2"><div class="v16-card"><div class="v16-h4">🎥 Съёмка на '+esc(V.GEARN[d.gear]||'телефон')+'</div><div class="v16-note" style="font-size:13px">'+esc(p.gear||'')+'</div></div>'+
      '<div class="v16-card"><div class="v16-h4">📈 Главный принцип роста</div><div class="v16-note" style="font-size:13px">'+esc(p.growth||'')+'</div></div></div>'+
      '<div class="v16-row" style="margin-top:6px"><button class="v16-btn gold" id="v16pCal">📅 Собрать календарь на 30 дней</button>'+
      '<button class="v16-btn ghost" id="v16pHq">🎯 Открыть Штаб</button>'+
      '<button class="v16-btn ghost" onclick="v16PlanOpen(true)">🔄 Пересобрать план</button>'+
      '<button class="v16-btn ghost" onclick="v16OnbOpen()">⚙️ Изменить ответы</button></div>';
    qa('[data-scr]',body).forEach(function(b){b.addEventListener('click',function(){W.v16PlanClose();V.openScript(b.getAttribute('data-scr'));});});
    qa('[data-bt]',body).forEach(function(b){b.addEventListener('click',function(){W.v16PlanClose();W.v16HqOpen('battle');setTimeout(function(){var i=q('#v16btIdea');if(i)i.value=b.getAttribute('data-bt');},120);});});
    qa('[data-wk]',body).forEach(function(c){c.addEventListener('change',function(){
      var mk=lget('v16_week_done',{})||{};
      if(c.checked)mk[c.getAttribute('data-wk')]=1;else delete mk[c.getAttribute('data-wk')];
      lset('v16_week_done',mk);renderPlan(body,V.dream());
    });});
    var pc=q('#v16pCal',body);if(pc)pc.addEventListener('click',function(){W.v16PlanClose();W.v16HqOpen('cal');});
    var ph=q('#v16pHq',body);if(ph)ph.addEventListener('click',function(){W.v16PlanClose();W.v16HqOpen();});
  }

  /* ---------- кнопки входа: гейт + герой ---------- */
  function injectButtons(){
    try{
      var inner=q('#entryGate .eg-inner');
      if(inner&&!q('#v16egBtn',inner)){
        var b=D.createElement('button');b.id='v16egBtn';b.className='v10-eg-how';b.type='button';
        b.textContent=V.dream()?'🚀 Мой стартовый план':'🌱 У меня нет канала — с чего начать?';
        b.addEventListener('click',function(){V.dream()?W.v16PlanOpen():W.v16OnbOpen();});
        inner.appendChild(b);
      }else if(inner){
        var eb=q('#v16egBtn',inner);
        var want=V.dream()?'🚀 Мой стартовый план':'🌱 У меня нет канала — с чего начать?';
        if(eb&&eb.textContent!==want)eb.textContent=want;
      }
      var hb=q('#vprHeroBtn');
      if(hb&&hb.parentNode&&!q('#v16heroPlan')&&V.dream()){
        var b2=D.createElement('button');b2.id='v16heroPlan';b2.className=hb.className;b2.type='button';
        b2.textContent='🚀 Стартовый план';
        b2.addEventListener('click',function(){W.v16PlanOpen();});
        hb.parentNode.insertBefore(b2,hb);
      }
    }catch(e){}
  }
  setInterval(injectButtons,1400);
  injectButtons();

  /* ---------- блок «Мой замысел» в профиле ---------- */
  function augmentProfile(){
    var bodyEl=q('#vprBody');
    if(!bodyEl||q('#v16profDream',bodyEl))return;
    var d=V.dream();
    var div=D.createElement('div');div.id='v16profDream';
    div.style.cssText='border:1px solid rgba(255,176,32,.3);background:rgba(255,176,32,.06);border-radius:14px;padding:14px 16px;margin-top:14px';
    div.innerHTML='<div style="font-weight:800;font-size:13.5px;margin-bottom:7px">🌱 Мой замысел</div>'+
      (d?('<div style="font-size:12.5px;color:#cfd5e2;line-height:1.6">Снимаю: <b>'+esc(d.custom||d.niche||'—')+'</b>'+(d.audience?' · для: '+esc(d.audience):'')+' · формат: '+esc(V.FMTN[d.format]||'—')+' · цель: '+esc(V.GOALN[d.goal]||'—')+'</div>'):
      '<div style="font-size:12.5px;color:#9aa3b2">Опросник ещё не пройден — расскажи, что хочешь снимать, и Viora соберёт стартовый план даже без канала.</div>')+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">'+
      (d?'<button class="v16-btn ghost" style="min-height:34px;padding:7px 13px;font-size:12px" onclick="vProfileClose&&vProfileClose();v16PlanOpen()">🚀 Стартовый план</button>':'')+
      '<button class="v16-btn ghost" style="min-height:34px;padding:7px 13px;font-size:12px" onclick="vProfileClose&&vProfileClose();v16OnbOpen()">'+(d?'⚙️ Пройти опросник заново':'🌱 Пройти опросник')+'</button></div>';
    bodyEl.appendChild(div);
  }
  setInterval(augmentProfile,1200);

  /* ---------- первый запуск ---------- */
  function firstRun(){
    try{
      var prof=JSON.parse(localStorage.getItem('viora_profile_v1')||'null');
      if(!prof&&!localStorage.getItem('viora_quiz_seen')){
        setTimeout(function(){W.v16OnbOpen();},700);
      }
    }catch(e){}
  }
  if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',firstRun);else firstRun();
}
boot();
})();
