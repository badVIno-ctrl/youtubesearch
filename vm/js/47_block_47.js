/* VIORA v25 — «Лёгкий старт»: ведём новичка от ниши до готового первого ролика. Self-contained. */
(function(){
'use strict';
if(window.__v25Booted)return;window.__v25Booted=true;
var D=document;
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function jget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function arr(x){return Array.isArray(x)?x:[];}
function profileNiche(){var p=jget('viora_profile_v1',{});return (p&&p.niche)||'';}
async function aiRaw(sys,user,max){
  if(typeof window.callMistralRaw!=='function')throw new Error('AI offline');
  var r=await window.callMistralRaw(sys,user,max||1400);
  if(typeof r==='string'){try{r=JSON.parse(r);}catch(e){var m=r.match(/\{[\s\S]*\}/);r=m?JSON.parse(m[0]):null;}}
  if(!r||typeof r!=='object')throw new Error('bad AI response');
  return r;
}
var S={step:1,niche:'',topics:[],ti:-1,pkg:null,loading:false,loadMsg:'',err:'',check:null,checking:false};
function reset(){S={step:1,niche:profileNiche(),topics:[],ti:-1,pkg:null,loading:false,loadMsg:'',err:'',check:null,checking:false};}
function ensureOverlay(){var o=D.getElementById('v25easy');if(!o){o=D.createElement('div');o.id='v25easy';o.innerHTML='<div class="v25-wrap" id="v25wrap"></div>';D.body.appendChild(o);}return o;}
function open(){reset();var o=ensureOverlay();o.classList.add('on');try{D.body.style.overflow='hidden';}catch(e){}render();}
function close(){var o=D.getElementById('v25easy');if(o)o.classList.remove('on');try{D.body.style.overflow='';}catch(e){}}
window.v25Easy=open;window.v25EasyClose=close;
function dots(){var h='';for(var i=1;i<=5;i++)h+='<span class="v25-dot'+(i===S.step?' on':'')+'"></span>';return '<div class="v25-dots">'+h+'</div>';}
function bar(){return '<div class="v25-bar"><span class="v25-logo">Viora<b>Media</b></span>'+dots()+'<button class="v25-x" onclick="v25EasyClose()" title="Закрыть">×</button></div>';}
function loadView(t,s){return bar()+'<div class="v25-load"><div class="v25-spin"></div><div class="lt">'+esc(t)+'</div><div class="ls">'+esc(s||'обычно 5-15 секунд')+'</div></div>';}
function errView(){return '<div class="v25-err">'+esc(S.err||'Виора сейчас недоступна. Попробуй ещё раз через пару секунд.')+'</div><button class="v25-btn" onclick="__v25retry()">Попробовать снова</button><button class="v25-btn ghost sm" onclick="__v25step(1)">← В начало</button>';}
var EX=['Готовлю еду дома','Рыбалка','Ремонт своими руками','Уход за садом и огородом','Игры на телефоне','Здоровье после 50','Лайфхаки для дома','Истории из жизни'];
function step1(){
  return bar()+
   '<h1 class="v25-h1">Соберём твой первый ролик 🎬</h1>'+
   '<p class="v25-lead">Я Виора. Проведу тебя за руку по шагам — и в конце у тебя будет готовый ролик: о чём снимать, что говорить, какое название и обложка. Это бесплатно и без регистрации.</p>'+
   '<div class="v25-label">О чём ты хочешь снимать видео?</div>'+
   '<input class="v25-input" id="v25niche" placeholder="Напиши простыми словами, например: рецепты для дачи" value="'+esc(S.niche)+'">'+
   '<div class="v25-chips">'+EX.map(function(e){return '<span class="v25-chip" onclick="__v25pick(this)">'+esc(e)+'</span>';}).join('')+'</div>'+
   '<button class="v25-btn" onclick="__v25niche()">Дальше →</button>';
}
function step2(){
  var h=bar()+'<button class="v25-back" onclick="__v25step(1)">← назад</button>'+
   '<h1 class="v25-h1">Вот 3 темы, на которых легко вырасти</h1>'+
   '<p class="v25-lead">Выбери ту, что нравится. Я соберу под неё готовый ролик.</p>';
  h+=S.topics.map(function(t,i){return '<button class="v25-topic" onclick="__v25topic('+i+')"><div class="tt">'+esc(t.title)+'</div><div class="tw">'+esc(t.why)+'</div><span class="tf">'+esc(t.format||'Shorts')+'</span></button>';}).join('');
  h+='<button class="v25-btn ghost sm" onclick="__v25niche()">↻ Другие темы</button>';
  return h;
}
function copyBtn(id){return '<span class="cp" onclick="__v25copy(\''+id+'\')">📋 копировать</span>';}
function step3(){
  var p=S.pkg||{};
  var h=bar()+'<button class="v25-back" onclick="__v25step(2)">← назад к темам</button>'+
   '<h1 class="v25-h1">Готовый ролик — бери и снимай</h1>'+
   '<p class="v25-lead">Всё уже расписано простыми словами. Можешь скопировать любую часть.</p>';
  h+='<div class="v25-card"><div class="ch">📌 Название видео'+copyBtn('v25_title')+'</div><div class="v25-bigtitle" id="v25_title">'+esc(p.title||'')+'</div></div>';
  if(p.about)h+='<div class="v25-card"><div class="ch">💡 О чём ролик</div><div class="v25-txt">'+esc(p.about)+'</div></div>';
  if(p.hook)h+='<div class="v25-card"><div class="ch">🎯 Первые 10 секунд (скажи это)'+copyBtn('v25_hook')+'</div><div class="v25-hook" id="v25_hook">'+esc(p.hook)+'</div></div>';
  if(arr(p.script).length)h+='<div class="v25-card"><div class="ch">📝 Что говорить по шагам'+copyBtn('v25_script')+'</div><ol class="v25-ol" id="v25_script">'+arr(p.script).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ol></div>';
  if(arr(p.shots).length)h+='<div class="v25-card"><div class="ch">🎥 Что показать в кадре</div><ul class="v25-ul">'+arr(p.shots).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>';
  if(p.thumb&&(p.thumb.idea||p.thumb.text))h+='<div class="v25-card"><div class="ch">🖼 Обложка (превью)</div><div class="v25-txt">'+esc(p.thumb.idea||'')+(p.thumb.text?('<br><br>Крупный текст на обложке: <b>'+esc(p.thumb.text)+'</b>'):'')+'</div></div>';
  if(p.description)h+='<div class="v25-card"><div class="ch">📄 Описание под видео'+copyBtn('v25_desc')+'</div><div class="v25-txt" id="v25_desc">'+esc(p.description)+'</div></div>';
  if(arr(p.tags).length)h+='<div class="v25-card"><div class="ch">🏷 Теги'+copyBtn('v25_tags')+'</div><div class="v25-tags" id="v25_tags">'+arr(p.tags).map(function(x){return '<span class="v25-tag">'+esc(x)+'</span>';}).join('')+'</div></div>';
  if(p.when)h+='<div class="v25-card"><div class="ch">⏰ Когда выложить</div><div class="v25-txt">'+esc(p.when)+'</div></div>';
  if(S.check){var c=S.check;var lc=c.light==='green'?'🟢':c.light==='red'?'🔴':'🟡';h+='<div class="v25-light '+(c.light||'yellow')+'"><div class="lc">'+lc+'</div><div class="lv">'+esc(c.verdict||'')+'</div></div>';if(arr(c.fixes).length)h+='<ul class="v25-fixes">'+arr(c.fixes).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
  h+='<button class="v25-btn" onclick="__v25step(4)">Как выложить на YouTube →</button>';
  h+='<button class="v25-btn ghost sm" onclick="__v25save()" id="v25saveBtn">💾 Сохранить в «Мои съёмки»</button>';
  h+='<button class="v25-btn ghost sm" onclick="__v25check()" id="v25checkBtn">'+(S.checking?'Проверяю…':'🚦 Проверить шансы на 100k')+'</button>';
  h+='<button class="v25-btn ghost sm" onclick="__v25copyAll()">📋 Скопировать весь ролик</button>';
  return h;
}
function step4(){
  return bar()+'<button class="v25-back" onclick="__v25step(3)">← назад к ролику</button>'+
   '<h1 class="v25-h1">Как выложить видео на YouTube</h1>'+
   '<p class="v25-lead">По шагам, спокойно. Это проще, чем кажется.</p>'+
   '<ol class="v25-steps-guide">'+
     '<li><b>Создай канал.</b> Зайди на youtube.com под своей почтой Google → нажми на кружок с фото справа сверху → «Создать канал».</li>'+
     '<li><b>Сними видео</b> на телефон по плану выше. Снимай горизонтально для длинных, вертикально для Shorts.</li>'+
     '<li><b>Нажми «Создать» (значок камеры с плюсом)</b> справа сверху → «Загрузить видео» → выбери файл.</li>'+
     '<li><b>Вставь название и описание</b> из готового ролика выше (кнопки «копировать»).</li>'+
     '<li><b>Поставь обложку.</b> Сделай простую картинку с крупным текстом из подсказки и загрузи её как значок.</li>'+
     '<li><b>Добавь теги</b> в поле тегов (для Shorts можно прямо в описание через #).</li>'+
     '<li><b>Нажми «Опубликовать».</b> Готово — твой первый ролик в эфире! 🎉</li>'+
     '<li><b>Поделись ссылкой</b> с друзьями в первые часы — это помогает алгоритму показать видео шире.</li>'+
   '</ol>'+
   '<button class="v25-btn" onclick="__v25step(5)">Я всё понял ✓</button>';
}
function step5(){
  return bar()+
   '<h1 class="v25-h1">Ты молодец! 🚀</h1>'+
   '<p class="v25-lead">У тебя на руках готовый первый ролик. Сними его сегодня — не жди идеального момента, его не бывает. Первые видео нужны, чтобы набить руку. Виора рядом и поможет на каждом шаге.</p>'+
   '<button class="v25-btn" onclick="__v25again()">Собрать ещё один ролик</button>'+
   '<button class="v25-btn ghost" onclick="v25EasyClose()">Закрыть</button>';
}
function render(){
  var w=D.getElementById('v25wrap');if(!w)return;
  if(S.err){w.innerHTML=bar()+errView();return;}
  if(S.loading){w.innerHTML=loadView(S.loadMsg||'Виора думает…');return;}
  var fn=[step1,step2,step3,step4,step5][S.step-1]||step1;
  w.innerHTML=fn();
  if(S.step===1){var i=D.getElementById('v25niche');if(i)setTimeout(function(){try{i.focus();}catch(e){}},80);}
}
window.__v25step=function(n){S.step=n;S.err='';render();};
window.__v25pick=function(el){var i=D.getElementById('v25niche');if(i)i.value=el.textContent;};
window.__v25retry=function(){S.err='';if(S.step===2||!S.topics.length)fetchTopics();else if(S.step===3)fetchPackage(S.ti);else render();};
window.__v25niche=function(){var i=D.getElementById('v25niche');var v=i?String(i.value||'').trim():S.niche;if(!v){if(i){i.style.borderColor='#ff3b5c';i.focus();}return;}S.niche=v;fetchTopics();};
async function fetchTopics(){
  S.loading=true;S.loadMsg='Виора подбирает темы под тебя…';S.err='';S.step=2;render();
  try{
    var sys='Ты — Viora AI, наставник для НОВИЧКОВ на YouTube. Пиши предельно просто, как для человека, который никогда не снимал видео (понятно даже пожилому). Без англицизмов и сложных слов. Верни СТРОГО валидный JSON: {"topics":[{"title":"простое название будущего видео","why":"1 короткое предложение: почему по этой теме новичку реально набрать просмотры","format":"Shorts или Длинное"}]}. Дай РОВНО 3 темы под нишу пользователя — такие, что реально могут набрать 100000+ просмотров и которые легко снять дома на телефон.';
    var r=await aiRaw(sys,'Ниша пользователя: '+S.niche,1100);
    var t=arr(r.topics).filter(function(x){return x&&x.title;}).slice(0,3);
    if(!t.length)throw new Error('empty');
    S.topics=t;S.loading=false;S.step=2;render();
  }catch(e){S.loading=false;S.err='Не получилось подобрать темы. Проверь, что описал нишу, и попробуй снова.';render();}
}
window.__v25topic=function(i){S.ti=i;fetchPackage(i);};
async function fetchPackage(i){
  var t=S.topics[i];if(!t)return;
  S.loading=true;S.loadMsg='Виора собирает готовый ролик…';S.err='';S.check=null;S.step=3;render();
  try{
    var sys='Ты — Viora AI, продюсер, который ведёт НОВИЧКА за руку. Пиши очень просто и по-доброму, без сложных слов и англицизмов, чтобы понял даже пожилой человек. Верни СТРОГО валидный JSON: {"title":"цепляющий заголовок видео","about":"о чём видео в 1 простом предложении","hook":"что дословно сказать в первые 10 секунд, чтобы не закрыли","script":["5-8 простых шагов по порядку: что говорить и делать"],"shots":["3-6 пунктов: что показать в кадре"],"thumb":{"idea":"что изобразить на обложке","text":"крупный текст на обложке, 2-4 слова"},"description":"готовое описание под видео","tags":["8-12 коротких тегов"],"when":"в какой день и время лучше выложить"}.';
    var r=await aiRaw(sys,'Тема видео: '+t.title+'\nФормат: '+(t.format||'Shorts')+'\nНиша: '+S.niche,1800);
    r.format=t.format||'Shorts';
    S.pkg=r;S.loading=false;S.step=3;render();
  }catch(e){S.loading=false;S.err='Не получилось собрать ролик. Попробуй ещё раз.';render();}
}
window.__v25copy=function(id){var el=D.getElementById(id);if(!el)return;var txt=el.innerText||el.textContent||'';try{navigator.clipboard.writeText(txt);}catch(e){}try{if(window.vToast)window.vToast('Скопировано ✓','ok');else if(window.toast)window.toast('Скопировано ✓');}catch(e){}};
window.__v25copyAll=function(){
  var p=S.pkg||{};var L=[];
  if(p.title)L.push('НАЗВАНИЕ:\n'+p.title);
  if(p.about)L.push('\nО ЧЁМ:\n'+p.about);
  if(p.hook)L.push('\nПЕРВЫЕ 10 СЕКУНД:\n'+p.hook);
  if(arr(p.script).length)L.push('\nСЦЕНАРИЙ:\n- '+arr(p.script).join('\n- '));
  if(arr(p.shots).length)L.push('\nЧТО ПОКАЗАТЬ:\n- '+arr(p.shots).join('\n- '));
  if(p.thumb)L.push('\nОБЛОЖКА:\n'+(p.thumb.idea||'')+(p.thumb.text?(' | текст: '+p.thumb.text):''));
  if(p.description)L.push('\nОПИСАНИЕ:\n'+p.description);
  if(arr(p.tags).length)L.push('\nТЕГИ:\n'+arr(p.tags).join(', '));
  if(p.when)L.push('\nКОГДА ВЫЛОЖИТЬ:\n'+p.when);
  try{navigator.clipboard.writeText(L.join('\n'));}catch(e){}
  try{if(window.vToast)window.vToast('Весь ролик скопирован ✓','ok');}catch(e){}
};
window.__v25save=function(){
  var p=S.pkg||{};if(!p.title){return;}
  var d={idea:p.title,why:p.about||'Из Лёгкого старта',format:(p.format==='Длинное'?'Длинное':'Shorts'),duration:'',titles:[{title:p.title,note:'Лёгкий старт'}],hook:p.hook||'',structure:arr(p.script).map(function(x,i){return {block:'Шаг '+(i+1),what:x,time:''};}),thumb:{idea:(p.thumb&&p.thumb.idea)||'',text:(p.thumb&&p.thumb.text)||''},publish:{when:p.when||''},checklist:arr(p.shots),pitfalls:[]};
  var ok=false;
  try{if(typeof window.saveShootPlan==='function'){window.saveShootPlan(d);ok=true;}}catch(e){}
  try{if(typeof window.renderShootsList==='function')window.renderShootsList();}catch(e){}
  var b=D.getElementById('v25saveBtn');if(b){b.textContent=ok?'✓ Сохранено в «Мои съёмки»':'Сохранено';b.style.pointerEvents='none';b.style.opacity='.75';}
  try{if(window.vToast)window.vToast(ok?'Сохранил в «Мои съёмки» 🎬':'Сохранено','ok');}catch(e){}
};
window.__v25check=function(){
  if(S.checking)return;var p=S.pkg||{};if(!p.title)return;
  S.checking=true;var b=D.getElementById('v25checkBtn');if(b)b.textContent='Проверяю…';
  var sys='Ты — Viora AI. Оцени, насколько у новичка есть шанс добить ролик до 100000 просмотров — по заголовку, первым 10 секундам и тексту обложки. Будь честным, но поддерживающим. Верни СТРОГО валидный JSON: {"light":"green или yellow или red","verdict":"1 короткое предложение простым языком","fixes":["2-4 конкретные правки простым языком"]}.';
  var u='ЗАГОЛОВОК: '+(p.title||'')+'\nПЕРВЫЕ 10 СЕКУНД: '+(p.hook||'')+'\nТЕКСТ ОБЛОЖКИ: '+((p.thumb&&p.thumb.text)||'');
  aiRaw(sys,u,700).then(function(r){S.checking=false;S.check={light:String(r.light||'yellow'),verdict:String(r.verdict||''),fixes:arr(r.fixes).map(String).slice(0,4)};render();}).catch(function(){S.checking=false;var bb=D.getElementById('v25checkBtn');if(bb)bb.textContent='🚦 Проверить шансы на 100k';try{if(window.vToast)window.vToast('Виора недоступна, попробуй ещё раз','warn');}catch(e){}});
  render();
};
window.__v25again=function(){reset();render();};
function mountGate(){
  return; /* v-cleanup: убрана дублирующая кнопка «Я новичок» — beginner-флоу доступен через опцию «Нет — хочу начать» в опросе */
  try{
    var gate=D.getElementById('entryGate');if(!gate)return;
    var inner=gate.querySelector('.eg-inner');if(!inner)return;
    if(inner.querySelector('#v25gateBtn'))return;
    var btn=D.createElement('button');btn.id='v25gateBtn';btn.className='v25-gatebtn';btn.type='button';
    btn.innerHTML='🌱 Я новичок — собрать первый ролик с нуля<small>Виора проведёт по шагам: тема → сценарий → название → как выложить</small>';
    btn.onclick=open;
    var foot=inner.querySelector('.eg-foot');
    if(foot)inner.insertBefore(btn,foot);else inner.appendChild(btn);
  }catch(e){}
}
function boot(){
  mountGate();
  try{var mo=new MutationObserver(function(){if(!D.getElementById('v25gateBtn'))mountGate();});mo.observe(D.body,{childList:true,subtree:true});setTimeout(function(){try{mo.disconnect();}catch(e){}},15000);}catch(e){}
}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
window.__v25={open:open,close:close,_state:function(){return S;},_setTopics:function(t){S.topics=t;},_render:render};
})();
