/* ===== ЭТАП 4: Продюсер ведёт (визард) + память канала ===== */
var WIZ={step:1,topic:'',pain:'',aud:'',speaker:'',product:'',title:'',pack:null,scen:null,plan:null};
function _wq(id){return document.getElementById(id);}
function pmemKey(){var id='anon';try{var c=(typeof STATE!=='undefined')&&STATE.channel;if(c)id=c.id||c.handle||c.title||'anon';}catch(e){}return 'viora_pmem_'+id;}
function pmemLoad(){try{return lget(pmemKey(),{})||{};}catch(e){return {};}}
function pmemSave(patch){try{var m=pmemLoad();patch=patch||{};Object.keys(patch).forEach(function(k){var v=patch[k];if(v!=null&&v!=='')m[k]=v;});m.updated=Date.now();lset(pmemKey(),m);return m;}catch(e){return {};}}
function wizInit(){
  if(!_wq('wizSteps'))return;
  WIZ={step:1,topic:'',pain:'',aud:'',speaker:'',product:'',title:'',pack:null,scen:null,plan:null};
  var mem=pmemLoad();
  var aud=_wq('wzAud');
  if(aud&&!aud.value){aud.value=mem.aud||((typeof STATE!=='undefined'&&STATE.primaryNiche)||'');}
  wizRenderMem(mem);
  wizGo(1);
}
function wizRenderMem(mem){
  var el=_wq('wizMem');if(!el)return;mem=mem||pmemLoad();
  if(mem&&(mem.topic||mem.title)){
    var when=mem.updated?new Date(mem.updated).toLocaleDateString('ru-RU'):'';
    el.innerHTML='<div class="wm-ic">🧠</div><div class="wm-tx"><b>Память канала.</b> Прошлый раз работали над: «'+_esc(mem.title||mem.topic)+'»'+(when?(' · '+when):'')+'</div><div class="wm-act"><button class="pbtn ghost sm" onclick="wizMemUse()">Подставить тему</button><button class="pbtn ghost sm" onclick="wizMemClear()">Забыть</button></div>';
    el.hidden=false;
  }else{el.hidden=true;el.innerHTML='';}
}
function wizMemUse(){var m=pmemLoad();var t=_wq('wzTopic');if(t&&(m.topic||m.title))t.value=m.topic||m.title;var a=_wq('wzAud');if(a&&m.aud)a.value=m.aud;}
function wizMemClear(){try{lset(pmemKey(),{});}catch(e){}wizRenderMem({});}
function wizGo(n){
  WIZ.step=n;
  [1,2,3,4].forEach(function(i){var s=_wq('wizStep'+i);if(s)s.hidden=(i!==n);});
  var labels=['Тема','Упаковка','Сценарий','План'];
  var st=_wq('wizSteps');if(st){st.innerHTML=labels.map(function(l,i){var k=i+1;var cls='wz-st'+(k===n?' active':'')+(k<n?' done':'');return '<div class="'+cls+'"><span class="wz-num">'+(k<n?'✓':k)+'</span>'+l+'</div>';}).join('<div class="wz-line"></div>');}
}
function wizStart(){
  var tEl=_wq('wzTopic');var topic=(tEl&&tEl.value||'').trim();
  if(!topic){if(tEl)tEl.focus();return;}
  WIZ.topic=topic;
  WIZ.pain=(_wq('wzPain')&&_wq('wzPain').value||'').trim();
  WIZ.aud=(_wq('wzAud')&&_wq('wzAud').value||'').trim();
  WIZ.speaker=(_wq('wzSpeaker')&&_wq('wzSpeaker').value||'').trim();
  WIZ.product=(_wq('wzProduct')&&_wq('wzProduct').value||'').trim();
  WIZ.title='';WIZ.pack=null;WIZ.scen=null;WIZ.plan=null;
  pmemSave({topic:WIZ.topic,aud:WIZ.aud});
  wizGo(2);wizRunPackaging();
}
async function wizRunPackaging(){
  var out=_wq('wzPackOut');if(!out)return;
  out.innerHTML='<div class="loader-ring" style="width:42px;height:42px;margin:14px auto"></div><div class="muted center">Продюсер собирает упаковку…</div>';
  var ch=(typeof STATE!=='undefined'&&STATE.channel)?STATE.channel.title:'';
  var formula=(typeof STATE!=='undefined'&&STATE.ai&&Array.isArray(STATE.ai.hit_formula))?STATE.ai.hit_formula.join('; '):'';
  var sys='Ты — продюсер по упаковке YouTube. По теме собери ПОЛНУЮ упаковку ролика по методике. Опирайся на ВИСП (Выгода/Интрига/Срочность/Причастность) и техники превью. Верни СТРОГО валидный JSON без markdown: {"titles":[{"title":"кликабельный заголовок 40-70 символов","visp":"какие буквы ВИСП закрывает"}],"hook":"готовый текст хука на первые 10-15 секунд — бьёт в боль или интригу","thumb":{"text":"3-5 слов огромным шрифтом на превью","frame":"что в кадре","emotion":"эмоция лица","color":"палитра под аудиторию","technique":"техника превью"}}. Дай 4 заголовка разными приёмами. По-русски, конкретно, без воды.'+kbFor('thumbnail');
  var user='Тема: "'+WIZ.topic+'". Боль зрителя: '+(WIZ.pain||'не указана')+'. Аудитория: '+(WIZ.aud||'широкая')+'. Канал: '+(ch||'не указан')+(formula?('. Формула хита канала: '+formula):'');
  try{
    var a=await callMistralRaw(sys,user,1700);
    WIZ.pack=a||{};WIZ.pack.titles=Array.isArray(a&&a.titles)?a.titles.filter(function(t){return t&&t.title;}):[];
    wizRenderPack();
  }catch(e){out.innerHTML='<div class="empty">⚠️ Не получилось собрать упаковку — попробуй ещё раз через пару секунд.</div>';}
}
function wizRenderPack(){
  var out=_wq('wzPackOut');if(!out||!WIZ.pack)return;
  var titles=WIZ.pack.titles||[];var th=WIZ.pack.thumb||{};
  var tHtml=titles.length?'<div class="sc-sub">Заголовки по ВИСП — кликни, чтобы выбрать для сценария (и скопировать):</div><div class="lab-out">'+titles.map(function(t,i){var sv=vispScore(t.title);var sel=(WIZ.title===t.title)?' selected':'';return '<div class="wz-title'+sel+'" data-i="'+i+'" onclick="wizSelectTitle(this)"><span class="lc">'+_esc(t.title)+'</span><span class="chip">ВИСП '+sv.score+'%</span></div>';}).join('')+'</div>':'';
  var hHtml=WIZ.pack.hook?'<div class="sc-hook"><div class="sc-tag">🎬 ХУК (0–15 сек)</div><div>'+_esc(WIZ.pack.hook)+'</div></div>':'';
  var rows=[['🖼️ Текст на превью',th.text],['🎭 Что в кадре',th.frame],['😮 Эмоция',th.emotion],['🎨 Цвет под ЦА',th.color],['🧢 Техника',th.technique]].filter(function(r){return r[1];});
  var thHtml=rows.length?'<div class="sc-blk" style="margin-top:4px"><div class="sc-bn">🖼️ Бриф превью</div><ul>'+rows.map(function(r){return '<li><b>'+r[0]+':</b> '+_esc(''+r[1])+'</li>';}).join('')+'</ul></div>':'';
  out.innerHTML=(hHtml+tHtml+thHtml)||'<div class="empty">Пусто — попробуй ещё раз.</div>';
}
function wizSelectTitle(el){
  var i=+el.getAttribute('data-i');var t=(WIZ.pack&&WIZ.pack.titles[i])?WIZ.pack.titles[i].title:el.textContent;
  WIZ.title=t;WIZ.scen=null;
  var p=el.parentNode;if(p){var all=p.querySelectorAll('.wz-title');for(var k=0;k<all.length;k++)all[k].classList.remove('selected');}
  el.classList.add('selected');
  try{copyText(el.querySelector('.lc')||el,t);}catch(e){}
}
function wizToScenario(){
  if(!WIZ.title&&WIZ.pack&&WIZ.pack.titles&&WIZ.pack.titles[0])WIZ.title=WIZ.pack.titles[0].title;
  wizGo(3);
  if(!WIZ.scen)wizRunScenario();else wizRenderScenario(WIZ.scen);
}
async function wizRunScenario(){
  var out=_wq('wzScenOut');if(!out)return;
  out.innerHTML='<div class="loader-ring" style="width:46px;height:46px;margin:14px auto"></div><div class="muted center">Продюсер пишет сценарий по сценарной башне…</div>';
  var errs=(typeof KB!=='undefined'&&KB.scenarioErrors)?KB.scenarioErrors.map(function(e,i){return (i+1)+') '+e.t;}).join('; '):'';
  var topicForScen=WIZ.title||WIZ.topic;
  var sys='Ты — сценарист YouTube-студии. Собери сценарий СТРОГО по «Сценарной башне» из кубиков. Правила: КРАСНЫЙ кубик ВСЕГДА один (одна проблема через вопрос «Как/Что/Зачем»); ЖЁЛТЫЙ — подпроблемы; ОРАНЖЕВЫЙ — усугубление 1–3; ФИОЛЕТОВЫЙ — одна честная история; ЗЕЛЁНЫЙ — решений ровно столько, сколько оранжевых; РОЗОВЫЙ — наглядный пример; СИНИЙ — обращение/CTA после хука. Хук на первые 20–30 сек бей в боль/интригу. Избегай ошибок: '+errs+'. Верни СТРОГО валидный JSON без markdown: {"hook":"заход на 20–30 сек","blocks":[{"cube":"Красный|Жёлтый|Оранжевый|Фиолетовый|Зелёный|Розовый|Синий","title":"роль кубика 1-2 словами","points":["конкретный тезис"]}],"cta":"призыв с выгодой","title_ideas":["3-5 заголовков по ВИСП"]}. Выстрой blocks в порядке показа.'+kbFor('script');
  var user='Тема/заголовок: '+topicForScen+'. Спикер: '+(WIZ.speaker||'не указан')+'. Продукт: '+(WIZ.product||'нет, без продажи')+'. Аудитория: '+(WIZ.aud||'широкая')+'. Боль зрителя: '+(WIZ.pain||'не указана')+'.';
  try{var a=await callMistralRaw(sys,user,2600);WIZ.scen=a;wizRenderScenario(a);}
  catch(e){out.innerHTML='<div class="empty">⚠️ Не получилось собрать сценарий — попробуй ещё раз через пару секунд.</div>';}
}
function wizRenderScenario(a){
  var out=_wq('wzScenOut');if(!out)return;a=a||{};
  var blocks=Array.isArray(a.blocks)?a.blocks:[];var ideas=Array.isArray(a.title_ideas)?a.title_ideas:[];
  var CUBE_HEX={'Синий':'#3aa0ff','Красный':'#ff3b46','Жёлтый':'#ffd23f','Оранжевый':'#ff9f1c','Фиолетовый':'#b06bff','Зелёный':'#36e07a','Розовый':'#ff6bd0'};
  var hookHtml=a.hook?'<div class="sc-hook"><div class="sc-tag">🎬 ЗАХОД (0–30 сек)</div><div>'+_esc(a.hook)+'</div></div>':'';
  var blocksHtml=blocks.length?'<div class="sc-blocks">'+blocks.map(function(b,i){var cube=(b.cube&&CUBE_HEX[b.cube])?b.cube:'';var hex=cube?CUBE_HEX[cube]:'';var style=cube?' style="border-left:4px solid '+hex+'"':'';var badge=cube?'<span class="sc-cube" style="background:'+hex+'22;color:'+hex+';border:1px solid '+hex+'55">'+_esc(cube)+'</span> ':'';return '<div class="sc-blk"'+style+'><div class="sc-bn">'+badge+(i+1)+'. '+_esc(b.title||'')+'</div><ul>'+((b.points||[]).map(function(p){return '<li>'+_esc(p)+'</li>';}).join(''))+'</ul></div>';}).join('')+'</div>':'';
  var ctaHtml=a.cta?'<div class="sc-cta"><div class="sc-tag">📣 CTA</div><div>'+_esc(a.cta)+'</div></div>':'';
  var ideasHtml=ideas.length?'<div class="sc-sub">Ещё заголовки по ВИСП (клик — скопировать):</div><div class="lab-out">'+ideas.map(function(t){var sv=vispScore(t);return '<div class="wz-title" onclick="wizCopyPlain(this)"><span class="lc">'+_esc(t)+'</span><span class="chip">ВИСП '+sv.score+'%</span></div>';}).join('')+'</div>':'';
  var chk='';try{if(typeof scenarioCheck==='function'){var full=[a.hook].concat(blocks.map(function(b){return (b.title||'')+' '+((b.points||[]).join(' '));})).concat([a.cta]).filter(Boolean).join(' ');var c=scenarioCheck(full,a);chk='<div class="sc-check"><div class="sc-sub">Проверка по 7 ошибкам сценария:</div>'+c.map(function(x){return '<div class="sc-ci '+(x.ok?'ok':'no')+'"><span class="ci-m">'+(x.ok?'✓':'✕')+'</span><div><b>'+_esc(x.t)+'</b>'+(x.ok?'':'<div class="ci-why">→ '+_esc(x.why)+'</div>')+'</div></div>';}).join('')+'</div>';}}catch(e){}
  out.innerHTML=hookHtml+blocksHtml+ctaHtml+ideasHtml+chk;
}
function wizCopyPlain(el){try{var lc=el.querySelector('.lc');copyText(lc||el,(lc||el).textContent);}catch(e){}}
function wizToPlan(){wizGo(4);wizRunPlan();}
function wizRunPlan(){
  var out=_wq('wzPlanOut');if(!out)return;
  var sig=(typeof STATE!=='undefined'&&STATE.signals)?STATE.signals:{};
  var bw=(sig&&sig.bestWindow)?sig.bestWindow:{};
  var niche=(typeof STATE!=='undefined'&&STATE.primaryNiche)||WIZ.aud||'твоя тема';
  var when=(bw.day||bw.hourRange)?('<div class="kb-callout">🗓️ <b>Лучшее окно публикации (по твоим хитам):</b> '+_esc([bw.day,bw.hourRange].filter(Boolean).join(', '))+'.</div>'):'<div class="kb-callout">🗓️ Окно публикации определится после анализа канала — публикуй, когда аудитория активнее, и держи регулярность.</div>';
  var title=WIZ.title||(WIZ.pack&&WIZ.pack.titles&&WIZ.pack.titles[0]&&WIZ.pack.titles[0].title)||WIZ.topic;
  var steps=['Заголовок: «'+title+'» — проверь по ВИСП.','Превью: огромный текст в 3–5 слов, эмоция на лице, тёплый цвет под ЦА, одна техника.','Хук: первые 10–15 секунд бьют в боль/интригу, без долгого вступления.','Сценарий по башне: одна проблема, решений столько же, сколько усугублений, честная история и пример.','CTA — после хука и пользы, с конкретной выгодой.','Теги и описание: ключевая фраза в первых 1–2 предложениях + смешанные теги.','Опубликуй в лучшее окно и закрепи комментарий с вопросом.'];
  var checklist='<div class="sc-blk"><div class="sc-bn">✅ Чек-лист перед загрузкой</div><ul>'+steps.map(function(s){return '<li>'+_esc(s)+'</li>';}).join('')+'</ul></div>';
  var head='<div class="wz-plan-head">Готовый план по ролику <b>«'+_esc(title)+'»</b> для ниши <b>'+_esc(niche)+'</b>.</div>';
  out.innerHTML=head+when+checklist+'<div class="muted" style="margin-top:8px">Нажми «💾 Запомнить для канала» — продюсер сохранит тему и заголовок и в следующий раз продолжит с этого места.</div>';
}
function wizSaveMem(){
  var title=WIZ.title||(WIZ.pack&&WIZ.pack.titles&&WIZ.pack.titles[0]&&WIZ.pack.titles[0].title)||'';
  pmemSave({topic:WIZ.topic,title:title,aud:WIZ.aud});
  wizRenderMem(pmemLoad());
  try{var t=document.createElement('div');t.className='wz-toast';t.textContent='Сохранено в память канала ✓';document.body.appendChild(t);setTimeout(function(){t.classList.add('show');},10);setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},1800);}catch(e){}
}
function wizReset(){
  ['wzTopic','wzPain','wzSpeaker','wzProduct'].forEach(function(id){var e=_wq(id);if(e)e.value='';});
  WIZ.topic='';WIZ.pain='';WIZ.speaker='';WIZ.product='';WIZ.title='';WIZ.pack=null;WIZ.scen=null;WIZ.plan=null;
  var po=_wq('wzPackOut');if(po)po.innerHTML='';var so=_wq('wzScenOut');if(so)so.innerHTML='';var pl=_wq('wzPlanOut');if(pl)pl.innerHTML='';
  wizGo(1);var t=_wq('wzTopic');if(t)t.focus();
}
(function(){var prev=window.__vioraExtra;window.__vioraExtra=function(c){if(typeof prev==='function'){try{prev(c);}catch(e){}}try{wizInit();}catch(e){}};})();
