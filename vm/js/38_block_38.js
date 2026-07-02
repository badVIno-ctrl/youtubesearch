/* ============ VIORA V19 · часть 2: Студия — сценарист, превью-лаб, SEO-пакет, банк идей ============ */
(function(){
'use strict';
function boot(){
  var C=window.__v11core,V=window.__v16,X=window.__v18;
  if(!C||!V||!X){setTimeout(boot,400);return;}
  var W=window,D=document;
  var q=C.q,esc=C.esc,lget=C.lget,lset=C.lset,toast=C.toast,copyTxt=C.copyTxt,err11=C.err11,chid=C.chid,DAY=C.DAY;
  var ai=(V.aiRetry||C.ai);
  var Z=W.__v19=W.__v19||{};

  function st(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:{};}catch(e){return {};}}
  function pid(){return V.pid?V.pid():(chid()||'p0');}
  function niche(){var s=st();return s.primaryNiche||(V.dream()&&V.dream().niche)||'';}
  function hits(n){return (st().videos||[]).slice().sort(function(a,b){return (b.viewsPerDay||0)-(a.viewsPerDay||0);}).slice(0,n||3).map(function(v){return v.title;});}
  function clean(t){return String(t).replace(/```json|```/g,'').trim();}

  /* ================= 1. СЦЕНАРИСТ ================= */
  function scrHtml(){
    var last=lget('v19_script_last:'+pid(),null);
    return '<div class="v16-note" style="margin-bottom:10px">Скелет сценария с ретеншн-точками: зритель решает «смотреть дальше?» каждые 25–40 секунд — в эти моменты нужен новый крючок, смена кадра или обещание. Сценарист расставляет их по таймкодам.</div>'+
      '<div class="v16-row"><input class="v16-in" id="v19scrT" placeholder="Тема ролика" value="'+esc(last&&last.topic||'')+'" style="flex:1;min-width:200px">'+
      '<select class="v16-in" id="v19scrF" style="min-width:120px"><option value="shorts">Shorts ~45 сек</option><option value="m5"'+(last&&last.fmt==='m5'?' selected':'')+'>Длинный ~5 мин</option><option value="m10"'+(last&&last.fmt==='m10'?' selected':'')+'>Длинный ~10 мин</option></select>'+
      '<button class="v16-btn" id="v19scrGo">📝 Собрать сценарий</button></div>'+
      '<div id="v19scrOut"></div>';
  }
  function paintScript(d){
    var box=q('#v19scrOut');if(!box)return;
    var rows=(d.sections||[]).map(function(s){
      return '<div class="row"><span class="tm">'+esc(s.t||'')+'</span><div class="bd"><b>'+esc(s.beat||'')+'</b>'+esc(s.text||'')+
        (s.trick?'<span class="tr">🎣 удержание: '+esc(s.trick)+'</span>':'')+'</div></div>';}).join('');
    box.innerHTML='<div class="v19-scr">'+
      '<div class="row"><span class="tm">0:00</span><div class="bd"><b>🪝 Хук</b>«'+esc(d.hook||'')+'»'+(d.overlay?'<span class="tr">текст на экране: «'+esc(d.overlay)+'»</span>':'')+'</div></div>'+
      rows+
      (d.cta?'<div class="row"><span class="tm">финал</span><div class="bd"><b>📣 Призыв</b>'+esc(d.cta)+'</div></div>':'')+
      '</div><div class="v16-row" style="margin-top:12px"><button class="v16-btn ghost" id="v19scrCp">📋 Скопировать сценарий</button><button class="v16-btn ghost" id="v19scrBank">💡 В банк идей</button></div>';
    q('#v19scrCp').addEventListener('click',function(){
      var txt='ХУК: '+(d.hook||'')+'\n'+(d.sections||[]).map(function(s){return '['+(s.t||'')+'] '+(s.beat||'')+': '+(s.text||'')+(s.trick?' (удержание: '+s.trick+')':'');}).join('\n')+(d.cta?'\nПРИЗЫВ: '+d.cta:'');
      copyTxt(txt);toast('Сценарий скопирован');
    });
    q('#v19scrBank').addEventListener('click',function(){
      Z.addIdea({t:d.topic||'',fmt:d.fmt==='shorts'?'shorts':'long',src:'сценарист'});
    });
  }
  function genScript(){
    var topic=(q('#v19scrT')||{}).value||'';topic=topic.trim();
    var fmt=(q('#v19scrF')||{}).value||'shorts';
    if(!topic){toast('Сначала напиши тему ролика');return;}
    var box=q('#v19scrOut');box.innerHTML=V.load16('Расставляю ретеншн-точки по таймкодам…');
    var lens={shorts:'Shorts на ~45 секунд, ретеншн-точки каждые ~10 секунд, 4 секции',m5:'длинный ролик на ~5 минут, ретеншн-точки каждые ~35 секунд, 7-8 секций',m10:'длинный ролик на ~10 минут, ретеншн-точки каждые ~45 секунд, 9-10 секций'};
    ai('Ты сценарист YouTube, пишешь структуры с максимальным удержанием. Отвечай ТОЛЬКО валидным JSON без markdown.',
      'Тема: "'+topic+'". Формат: '+lens[fmt]+'. '+(niche()?('Ниша: '+niche()+'. '):'')+(hits().length?('Хиты канала: '+hits().join(' | ')+'. '):'')+
      'JSON: {"hook":"первая фраза до 12 слов","overlay":"текст на экране 3-5 слов","sections":[{"t":"таймкод вида 0:10","beat":"название бита 2-4 слова","text":"что происходит и что сказать, 1-2 предложения","trick":"приём удержания в этой точке, до 8 слов"}],"cta":"финальный призыв, 1 фраза"}',1600)
    .then(function(t){
      var d=typeof t==='string'?JSON.parse(clean(t)):t;
      if(!d.sections||!d.sections.length)throw new Error('пустой ответ');
      d.topic=topic;d.fmt=fmt;
      lset('v19_script_last:'+pid(),d);paintScript(d);
    }).catch(function(e){box.innerHTML=err11('Сценарий не собрался: '+((e&&e.message)||e)+'. Попробуй ещё раз.');});
  }

  /* ================= 2. ПРЕВЬЮ-ЛАБ ================= */
  var TCHK=['Текст на превью: 3–5 слов, читается за полсекунды','Текст НЕ дублирует заголовок — добавляет интригу к нему','Крупное лицо с эмоцией или один крупный объект (не мелкая сцена)','Контраст: объект отделён от фона, 2–3 цвета максимум','Превью читается в размере спичечного коробка (так его видит зритель в ленте)','Стиль узнаваем: одна рамка/шрифт/палитра на всех превью канала'];
  function thumbHtml(){
    var last=lget('v19_thumb_last:'+pid(),null);
    var done=lget('v19_thumb_chk',[])||[];
    return '<div class="v16-note" style="margin-bottom:10px">CTR превью решает, получит ли ролик показы. Опиши идею превью словами — AI оценит её по критериям кликабельности и предложит текст на картинку.</div>'+
      '<div class="v16-row"><input class="v16-in" id="v19thT" placeholder="Опиши превью: что в кадре, какой текст, какая эмоция" value="'+esc(last&&last.idea||'')+'" style="flex:1;min-width:220px">'+
      '<button class="v16-btn" id="v19thGo">🖼 Оценить превью</button></div>'+
      '<div id="v19thOut"></div>'+
      '<div class="v18-card" style="margin-top:14px"><b style="font-size:13.5px">✅ Чек-лист превью</b>'+
      '<div class="v18-chk" id="v19thChk">'+TCHK.map(function(c,i){var on=done.indexOf(i)>-1;
        return '<label class="'+(on?'on':'')+'"><input type="checkbox" data-i="'+i+'"'+(on?' checked':'')+'> '+c+'</label>';}).join('')+'</div>'+
      '<div class="v18-chkbar" id="v19thBar">'+done.length+' из '+TCHK.length+'</div></div>';
  }
  function paintThumb(d){
    var box=q('#v19thOut');if(!box)return;
    var sc=+d.score||0;var cls=sc>=8?'hi':(sc>=5?'md':'');
    box.innerHTML='<div class="v19-thumb-score"><span class="n '+cls+'">'+sc+'/10</span><div style="flex:1;min-width:200px;font-size:13px;line-height:1.5">'+esc(d.verdict||'')+'</div></div>'+
      ((d.fixes||[]).length?'<div class="v18-card"><b style="font-size:13px">Что усилить:</b><ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;line-height:1.6">'+d.fixes.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul></div>':'')+
      ((d.texts||[]).length?'<div class="v19-tvars">'+d.texts.map(function(t){return '<div class="v19-tvar"><b>'+esc(t)+'</b><button class="v16-btn ghost" data-cp="'+esc(t).replace(/"/g,'&quot;')+'" style="padding:6px 10px;min-height:32px">📋</button></div>';}).join('')+'</div>':'');
    box.onclick=function(e){var b=e.target.closest('[data-cp]');if(b){copyTxt(b.getAttribute('data-cp'));toast('Текст скопирован');}};
  }
  function genThumb(){
    var idea=(q('#v19thT')||{}).value||'';idea=idea.trim();
    if(!idea){toast('Опиши идею превью словами');return;}
    var box=q('#v19thOut');box.innerHTML=V.load16('Смотрю на превью глазами зрителя из ленты…');
    ai('Ты арт-директор YouTube-превью. Оцениваешь кликабельность жёстко и честно. Отвечай ТОЛЬКО валидным JSON без markdown.',
      'Идея превью: "'+idea+'". '+(niche()?('Ниша: '+niche()+'. '):'')+
      'Критерии: читаемость в маленьком размере, эмоция/объект, контраст, интрига без кликбейт-обмана, текст 3-5 слов не дублирует заголовок. JSON: {"score":7,"verdict":"вердикт 1-2 предложения","fixes":["что улучшить, до 12 слов"],"texts":["вариант текста на превью 3-5 слов","вариант 2","вариант 3"]}',700)
    .then(function(t){
      var d=typeof t==='string'?JSON.parse(clean(t)):t;d.idea=idea;
      lset('v19_thumb_last:'+pid(),d);paintThumb(d);
    }).catch(function(e){box.innerHTML=err11('Оценка не получилась: '+((e&&e.message)||e)+'. Попробуй ещё раз.');});
  }

  /* ================= 3. SEO-ПАКЕТ ================= */
  function seoHtml(){
    var last=lget('v19_seo_last:'+pid(),null);
    return '<div class="v16-note" style="margin-bottom:10px">Готовый комплект метаданных под ролик: название с поисковым запросом, описание с таймкодами и теги. Скопировал — вставил в Studio.</div>'+
      '<div class="v16-row"><input class="v16-in" id="v19seoT" placeholder="Тема ролика" value="'+esc(last&&last.topic||'')+'" style="flex:1;min-width:200px">'+
      '<select class="v16-in" id="v19seoF" style="min-width:110px"><option value="long">Длинный</option><option value="shorts"'+(last&&last.fmt==='shorts'?' selected':'')+'>Shorts</option></select>'+
      '<button class="v16-btn" id="v19seoGo">🔎 Собрать SEO-пакет</button></div>'+
      '<div class="v19-seo" id="v19seoOut"></div>';
  }
  function paintSeo(d){
    var box=q('#v19seoOut');if(!box)return;
    function fld(name,val,cp){return '<div class="fld"><div class="hd"><span>'+name+'</span><button class="v16-btn ghost" data-cp="'+esc(cp).replace(/"/g,'&quot;')+'" style="padding:5px 9px;min-height:28px;font-size:11px">📋 копировать</button></div><div class="tx">'+esc(val)+'</div></div>';}
    box.innerHTML=fld('Название',d.title||'',d.title||'')+
      fld('Описание',d.description||'',d.description||'')+
      '<div class="fld"><div class="hd"><span>Теги ('+(d.tags||[]).length+')</span><button class="v16-btn ghost" data-cp="'+esc((d.tags||[]).join(', ')).replace(/"/g,'&quot;')+'" style="padding:5px 9px;min-height:28px;font-size:11px">📋 копировать</button></div><div class="v19-tags">'+(d.tags||[]).map(function(t){return '<span>'+esc(t)+'</span>';}).join('')+'</div></div>'+
      '<div class="v16-row" style="margin-top:10px"><button class="v16-btn ghost" id="v19seoBank">💡 В банк идей</button></div>';
    box.onclick=function(e){
      var b=e.target.closest('[data-cp]');if(b){copyTxt(b.getAttribute('data-cp'));toast('Скопировано — вставляй в Studio');return;}
      if(e.target.closest('#v19seoBank'))Z.addIdea({t:d.topic||'',fmt:d.fmt||'long',src:'SEO-пакет'});
    };
  }
  function genSeo(){
    var topic=(q('#v19seoT')||{}).value||'';topic=topic.trim();
    var fmt=(q('#v19seoF')||{}).value||'long';
    if(!topic){toast('Сначала напиши тему ролика');return;}
    var box=q('#v19seoOut');box.innerHTML=V.load16('Подбираю запросы и собираю метаданные…');
    var hot='';try{var mc=lget('v16_morn:'+pid()+':'+V.dkey(V.today()),{});if(mc&&mc.hot)hot=mc.hot;}catch(e){}
    ai('Ты SEO-специалист YouTube. Отвечай ТОЛЬКО валидным JSON без markdown.',
      'Тема '+(fmt==='shorts'?'Shorts':'длинного ролика')+': "'+topic+'". '+(niche()?('Ниша: '+niche()+'. '):'')+(hot?('Живой поисковый запрос в нише прямо сейчас: "'+hot+'" — используй, если уместен. '):'')+(hits().length?('Хиты канала: '+hits().join(' | ')+'. '):'')+
      'Собери: название до 70 символов с главным запросом ближе к началу (цепляющее, не канцелярит); описание 500-800 символов — первые 2 строки продают клик, дальше суть, '+(fmt==='shorts'?'без таймкодов':'таймкоды вида 0:00 по логичным главам')+', 2-3 запроса вплетены естественно; 15-20 тегов от точных к широким. JSON: {"title":"…","description":"…","tags":["…"]}',1400)
    .then(function(t){
      var d=typeof t==='string'?JSON.parse(clean(t)):t;d.topic=topic;d.fmt=fmt;
      lset('v19_seo_last:'+pid(),d);paintSeo(d);
    }).catch(function(e){box.innerHTML=err11('SEO-пакет не собрался: '+((e&&e.message)||e)+'. Попробуй ещё раз.');});
  }

  /* ================= 4. БАНК ИДЕЙ ================= */
  function ideasKey(){return 'v19_ideas:'+pid();}
  function ideas(){return lget(ideasKey(),[])||[];}
  Z.addIdea=function(o){
    if(!o||!o.t){toast('Пустую идею не сохранить');return;}
    var a=ideas();
    if(a.some(function(x){return x.t.toLowerCase()===o.t.toLowerCase();})){toast('Эта идея уже в банке');return;}
    a.unshift({id:'i'+Date.now(),t:o.t,fmt:o.fmt||'long',src:o.src||'вручную',ts:Date.now()});
    lset(ideasKey(),a.slice(0,60));
    toast('💡 Идея в банке','ok');
    var box=q('#v19bankBox');if(box)box.innerHTML=bankList();
  };
  function dayOptions(){
    var cal=V.calGet();if(!cal)return '';
    var t0=V.today(),opts='';
    for(var i=0;i<14;i++){
      var d=new Date(t0.getTime()+i*DAY),dk=V.dkey(d);
      var it=V.calItem(cal,dk);if(!it)continue;
      var ds=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2);
      opts+='<option value="'+dk+'">'+ds+' — '+esc((it.topic||'').slice(0,42))+'…</option>';
    }
    return opts;
  }
  function bankList(){
    var a=ideas();
    if(!a.length)return '<div class="v16-note">Банк пуст. Складывай сюда идеи из сценариста, SEO-пакета, разведки — или добавляй свои. Из банка идея одним кликом встаёт в контент-план.</div>';
    return a.map(function(x){
      var d=new Date(x.ts);var ds=('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2);
      return '<div class="v19-idea" data-id="'+x.id+'"><div class="bd"><b>'+esc(x.t)+'</b><small>'+(x.fmt==='shorts'?'Shorts':'длинный')+' · из: '+esc(x.src)+' · '+ds+'</small><div class="v19-daypick" id="dp-'+x.id+'" style="display:none"></div></div>'+
        '<div class="acts"><button data-a="cal" title="В календарь">📅</button><button data-a="del" title="Удалить">🗑</button></div></div>';
    }).join('');
  }
  function bankHtml(){
    return '<div class="v16-row" style="margin-bottom:6px"><input class="v16-in" id="v19bankT" placeholder="Своя идея ролика" style="flex:1;min-width:200px">'+
      '<select class="v16-in" id="v19bankF" style="min-width:110px"><option value="long">Длинный</option><option value="shorts">Shorts</option></select>'+
      '<button class="v16-btn" id="v19bankAdd">＋ В банк</button></div>'+
      '<div id="v19bankBox">'+bankList()+'</div>';
  }
  function bankWire(body){
    q('#v19bankAdd',body).addEventListener('click',function(){
      var inp=q('#v19bankT',body);
      Z.addIdea({t:(inp.value||'').trim(),fmt:(q('#v19bankF',body)||{}).value||'long',src:'вручную'});
      inp.value='';
    });
    q('#v19bankBox',body).addEventListener('click',function(e){
      var b=e.target.closest('button[data-a]');
      var row=e.target.closest('.v19-idea');
      if(b&&row){
        var id=row.getAttribute('data-id'),a=ideas();
        var idea=a.filter(function(x){return x.id===id;})[0];
        if(b.getAttribute('data-a')==='del'){
          lset(ideasKey(),a.filter(function(x){return x.id!==id;}));
          q('#v19bankBox',body).innerHTML=bankList();toast('Удалено');return;
        }
        if(b.getAttribute('data-a')==='cal'){
          var cal=V.calGet();
          if(!cal){toast('Сначала собери контент-план на 30 дней во вкладке «Календарь»');return;}
          var dp=q('#dp-'+id,body);
          if(dp.style.display==='none'){
            dp.innerHTML='<select class="v16-in" style="flex:1;min-width:180px;font-size:12px">'+dayOptions()+'</select><button class="v16-btn" style="padding:7px 12px;min-height:34px" data-put="1">Заменить тему дня</button>';
            dp.style.display='flex';
          }else dp.style.display='none';
          return;
        }
      }
      var put=e.target.closest('[data-put]');
      if(put){
        var row2=e.target.closest('.v19-idea');var id2=row2.getAttribute('data-id');
        var idea2=ideas().filter(function(x){return x.id===id2;})[0];if(!idea2)return;
        var sel=q('select',q('#dp-'+id2,body));var dk=sel.value;
        var cal2=V.calGet();var it=V.calItem(cal2,dk);
        if(!it){toast('Этот день вне плана');return;}
        it.topic=idea2.t;it.format=idea2.fmt;it.why='из банка идей';it.hook='';
        V.calSet(cal2);
        lset(ideasKey(),ideas().filter(function(x){return x.id!==id2;}));
        q('#v19bankBox',body).innerHTML=bankList();
        toast('📅 Идея встала в план на '+dk.slice(8,10)+'.'+dk.slice(5,7),'ok');
      }
    });
  }

  /* ================= ВКЛАДКА «СТУДИЯ» ================= */
  function renderStudio(body){
    body.innerHTML='<div class="v18-subnav" id="v19stNav">'+
      '<button data-s="v19scr">📝 Сценарий</button><button data-s="v19th">🖼 Превью</button>'+
      '<button data-s="v19seo">🔎 SEO</button><button data-s="v19bank">💡 Банк идей</button></div>'+
      '<div class="v18-sec" id="v19scr"><div class="v18-h"><b>📝 Сценарист</b><small>скелет с ретеншн-точками по таймкодам</small></div>'+scrHtml()+'</div>'+
      '<div class="v18-sec" id="v19th"><div class="v18-h"><b>🖼 Превью-лаборатория</b><small>оценка кликабельности до публикации</small></div>'+thumbHtml()+'</div>'+
      '<div class="v18-sec" id="v19seo"><div class="v18-h"><b>🔎 SEO-пакет</b><small>название · описание · теги — копируй в Studio</small></div>'+seoHtml()+'</div>'+
      '<div class="v18-sec" id="v19bank"><div class="v18-h"><b>💡 Банк идей</b><small>бэклог тем с постановкой в план</small></div>'+bankHtml()+'</div>';
    q('#v19stNav',body).addEventListener('click',function(e){
      var b=e.target.closest('button[data-s]');if(!b)return;
      var el=q('#'+b.getAttribute('data-s'),body);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    });
    q('#v19scrGo',body).addEventListener('click',genScript);
    q('#v19scrT',body).addEventListener('keydown',function(e){if(e.key==='Enter')genScript();});
    q('#v19thGo',body).addEventListener('click',genThumb);
    q('#v19thT',body).addEventListener('keydown',function(e){if(e.key==='Enter')genThumb();});
    q('#v19seoGo',body).addEventListener('click',genSeo);
    q('#v19seoT',body).addEventListener('keydown',function(e){if(e.key==='Enter')genSeo();});
    q('#v19thChk',body).addEventListener('change',function(e){
      var inp=e.target.closest('input[type=checkbox]');if(!inp)return;
      var i=+inp.getAttribute('data-i'),arr=lget('v19_thumb_chk',[])||[];
      if(inp.checked){if(arr.indexOf(i)<0)arr.push(i);}else arr=arr.filter(function(x){return x!==i;});
      lset('v19_thumb_chk',arr);
      inp.closest('label').classList.toggle('on',inp.checked);
      q('#v19thBar',body).textContent=arr.length+' из '+TCHK.length;
      if(arr.length===TCHK.length){toast('🖼 Превью собрано по всем правилам!','ok');try{if(W.__v17&&W.__v17.confetti)W.__v17.confetti();}catch(err){}}
    });
    bankWire(body);
    /* восстановление кэша */
    var ls=lget('v19_script_last:'+pid(),null);if(ls&&ls.sections)try{paintScript(ls);}catch(e){}
    var lt=lget('v19_thumb_last:'+pid(),null);if(lt&&lt.score!=null)try{paintThumb(lt);}catch(e){}
    var lo=lget('v19_seo_last:'+pid(),null);if(lo&&lo.title)try{paintSeo(lo);}catch(e){}
  }
  V.regTab({id:'studio',ic:'🧰',name:'Студия'},renderStudio);
  if(C.regTool)C.regTool({id:'v19studio',ic:'🧰',name:'Студия контента',d:'Сценарист с ретеншн-точками, оценка превью, SEO-пакет для Studio и банк идей с постановкой в план',fn:function(){W.v16HqOpen('studio');},hub:true});
}
boot();
})();
