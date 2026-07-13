/* ===================================================================== */
/*  API KEYS (зашиты в коде)                                              */
/* ===================================================================== */
const YOUTUBE_API_KEY = "AIzaSyB3IQRYXPY086TLyMYlmb-0cSLaivEFdSs";
const MISTRAL_API_KEY = "d5XZbS9vkG6R4fPclXwcUkxA6G8QbCZJ";
/* Модели Mistral (тот же ключ). DEEP — глубокий разбор/синтез/критик; FAST — под-проходы, чат, быстрая генерация. */
const MODEL_DEEP = "mistral-large-latest";
const MODEL_FAST = "mistral-medium-latest";
(function(){if(location.protocol!=='file:')return;window.addEventListener('DOMContentLoaded',function(){try{var b=document.createElement('div');b.style.cssText='position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1a1418;border-top:1px solid rgba(255,45,85,.4);color:#e9e7ee;font:13px Inter,sans-serif;padding:11px 16px;display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap';b.textContent='⚠️ Страница открыта как file:// — браузер ограничивает часть возможностей. Для стабильной работы запусти в папке с файлом: python -m http.server 8000 и открой http://localhost:8000';var x=document.createElement('button');x.textContent='Понятно ✕';x.style.cssText='background:rgba(255,255,255,.1);border:none;color:#e9e7ee;font-size:13px;padding:5px 11px;border-radius:8px;cursor:pointer;white-space:nowrap';x.onclick=function(){b.remove();};b.appendChild(x);document.body.appendChild(b);}catch(e){}});})();
const YT = "https://www.googleapis.com/youtube/v3";

/* ===================================================================== */
/*  ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК: тосты + лог. Ошибки больше не теряются.  */
/* ===================================================================== */
function vToast(msg,kind,ms){
  try{
    var box=document.getElementById('vToasts');
    if(!box){box=document.createElement('div');box.id='vToasts';document.body.appendChild(box);}
    var t=document.createElement('div');t.className='vtoast '+(kind||'');
    var ic=kind==='err'?'⚠️':kind==='warn'?'💡':kind==='ok'?'✅':'ℹ️';
    var sp=document.createElement('span');sp.className='ic';sp.textContent=ic;
    var tx=document.createElement('div');tx.textContent=String(msg||'');
    var x=document.createElement('button');x.className='x';x.textContent='✕';x.onclick=function(){try{t.remove();}catch(e){}};
    t.appendChild(sp);t.appendChild(tx);t.appendChild(x);
    box.appendChild(t);
    while(box.children.length>4)box.removeChild(box.firstChild);
    setTimeout(function(){try{t.style.transition='opacity .4s';t.style.opacity='0';}catch(e){}},(ms||7000)-450);
    setTimeout(function(){try{t.remove();}catch(e){}},ms||7000);
  }catch(e){}
}
var _vErrSeen={};
function reportError(where,e,userMsg){
  try{console.error('[Viora] '+where+':',e);}catch(_){}
  if(userMsg===false)return;
  var now=Date.now();
  if(_vErrSeen[where]&&now-_vErrSeen[where]<10000)return;
  _vErrSeen[where]=now;
  var msg=userMsg;
  if(!msg){
    var em=(e&&e.message)?String(e.message):'';
    if(e&&(e.reason==='quotaExceeded'||(e.status===403&&/quota/i.test(em))))msg='Дневная квота YouTube API исчерпана — данные появятся после обновления лимита (раз в сутки).';
    else if(/failed to fetch|networkerror|load failed/i.test(em))msg='Проблема с сетью — проверь интернет и попробуй ещё раз.';
    else msg='Не получилось: '+where+'. Попробуй ещё раз — детали в консоли (F12).';
  }
  vToast(msg,'err');
}
window.addEventListener('error',function(ev){
  try{
    if(!ev)return;
    /* ошибки чужих скриптов (CDN) не показываем пользователю, только в консоль */
    if(ev.filename&&/^https?:/.test(ev.filename)&&ev.filename.indexOf(location.host)<0){console.error('[Viora][external]',ev.message,ev.filename);return;}
    reportError('внутренняя ошибка страницы',ev.error||ev.message,'Внутренняя ошибка страницы — часть блока могла не отрисоваться. Обнови страницу, если что-то зависло.');
  }catch(e){}
});
window.addEventListener('unhandledrejection',function(ev){
  try{reportError('фоновая задача',ev&&ev.reason,false);}catch(e){}
});


/* фоновая канва (katakana rain) удалена — фон теперь лёгкий CSS-градиент, ноль CPU */

/* ===================================================================== */
/*  HELPERS                                                              */
/* ===================================================================== */
const $=s=>document.querySelector(s);
const fmt=n=>{n=+n||0;if(n>=1e9)return (n/1e9).toFixed(1).replace('.0','')+'B';if(n>=1e6)return (n/1e6).toFixed(1).replace('.0','')+'M';if(n>=1e3)return (n/1e3).toFixed(1).replace('.0','')+'K';return n.toLocaleString('ru-RU');}
const esc=s=>(s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function vBalanceJson(t){var inStr=false,esc=false,stack=[];for(var i=0;i<t.length;i++){var ch=t[i];if(esc){esc=false;continue;}if(ch==='\\'){if(inStr)esc=true;continue;}if(ch==='"'){inStr=!inStr;continue;}if(inStr)continue;if(ch==='{'||ch==='[')stack.push(ch);else if(ch==='}'||ch===']')stack.pop();}var out=t;if(inStr)out+='"';out=out.replace(/,\s*$/,'');for(var j=stack.length-1;j>=0;j--){out+=(stack[j]==='{'?'}':']');}return out;}
function vClean(s){if(s==null)return s;s=String(s);if(s.indexOf('\uFFFD')>=0)s=s.replace(/\uFFFD+/g,'');if(s.indexOf('**')>=0)s=s.replace(/\*\*+/g,'');if(s.indexOf('__')>=0)s=s.replace(/__+/g,'');if(s.indexOf('`')>=0)s=s.replace(/`+/g,'');s=s.replace(/^\s{0,3}#{1,6}\s+/gm,'');return s;}
function vScrub(o){if(o==null)return o;var t=typeof o;if(t==='string')return vClean(o);if(t!=='object')return o;if(Array.isArray(o)){for(var i=0;i<o.length;i++)o[i]=vScrub(o[i]);return o;}for(var k in o){if(Object.prototype.hasOwnProperty.call(o,k))o[k]=vScrub(o[k]);}return o;}
function vJsonParse(s){return vScrub(_vJsonParse0(s));}
function _vJsonParse0(s){if(s&&typeof s==='object')return s;if(typeof s!=='string')return JSON.parse(s);var raw=String(s).trim();try{return JSON.parse(raw);}catch(e){}var t=raw.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();var oi=t.indexOf('{'),ai=t.indexOf('[');var useObj=(ai<0)||(oi>=0&&oi<ai);var a=useObj?oi:ai,bC=useObj?t.lastIndexOf('}'):t.lastIndexOf(']');if(a>=0&&bC>a){var s1=t.slice(a,bC+1).replace(/,\s*([}\]])/g,'$1');try{return JSON.parse(s1);}catch(e){}}if(a>=0){var s2=t.slice(a).replace(/,\s*([}\]])/g,'$1');try{return JSON.parse(vBalanceJson(s2));}catch(e){}}return JSON.parse(t);}
const PLACEHOLDER="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='2' height='2'%3E%3C/svg%3E";
const safeImg=u=>u&&typeof u==='string'?u:PLACEHOLDER;
function fillEx(u){$('#urlInput').value=u;startAnalysis();}
function goHome(){$('#dashboard').style.display='none';$('#loading').style.display='none';$('#ideas')&&($('#ideas').style.display='none');$('#hero').style.display='flex';const f=$('#chatFab');if(f)f.style.display='none';const p=$('#chatPanel');if(p)p.classList.remove('open');closeVideoDrawer();window.scrollTo(0,0);}

/* ===================================================================== */
/*  ENTRY GATE (YouTube / Telegram) + STANDALONE TELEGRAM CHAT           */
/* ===================================================================== */
function _hideMainSections(){['#hero','#dashboard','#loading','#ideas'].forEach(function(s){var el=$(s);if(el)el.style.display='none';});var f=$('#chatFab');if(f)f.style.display='none';var p=$('#chatPanel');if(p)p.classList.remove('open');}
function showGate(){var g=$('#entryGate');if(g)g.classList.remove('hide');var tg=$('#tgScreen');if(tg)tg.classList.remove('show');var t=$('#toTgBtn');if(t)t.classList.remove('show');_hideMainSections();try{closeVideoDrawer();}catch(e){}window.scrollTo(0,0);}
function hideGate(){var g=$('#entryGate');if(g)g.classList.add('hide');}
function enterYoutube(){hideGate();var tg=$('#tgScreen');if(tg)tg.classList.remove('show');goHome();var t=$('#toTgBtn');if(t)t.classList.add('show');setTimeout(function(){var i=$('#urlInput');if(i)i.focus({preventScroll:true});},90);}
function switchToYoutube(){enterYoutube();}
function enterTelegram(){hideGate();_hideMainSections();var tg=$('#tgScreen');if(tg)tg.classList.add('show');var t=$('#toTgBtn');if(t)t.classList.remove('show');tgMountChat();setTimeout(function(){var i=$('#tgInput');if(i)i.focus({preventScroll:true});},160);}

/* ===== VIORA TELEGRAM STUDIO ENGINE ===== */
var TG_MODE='auto', TG_MOUNTED=false, TG_SENDING=false;
var TG_CHATS=[], TG_CUR=null;
var TG_KEY='viora_tg_chats_v1', TG_CURKEY='viora_tg_cur_v1';
var TG_AVA='<svg viewBox="0 0 24 24"><path fill="#fff" d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>';
function vClean(s){if(typeof s!=='string')return s;return s.replace(/\uFFFD/g,'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g,'');}
function tgUid(){return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function tgLoad(){try{TG_CHATS=JSON.parse(localStorage.getItem(TG_KEY)||'[]')||[];}catch(e){TG_CHATS=[];}if(!Array.isArray(TG_CHATS))TG_CHATS=[];try{TG_CUR=localStorage.getItem(TG_CURKEY)||null;}catch(e){TG_CUR=null;}if(TG_CUR&&!tgCur())TG_CUR=TG_CHATS.length?TG_CHATS[0].id:null;}
function tgSave(){try{localStorage.setItem(TG_KEY,JSON.stringify(TG_CHATS));if(TG_CUR)localStorage.setItem(TG_CURKEY,TG_CUR);}catch(e){}}
function tgCur(){for(var i=0;i<TG_CHATS.length;i++){if(TG_CHATS[i].id===TG_CUR)return TG_CHATS[i];}return null;}
function tgEnsureChat(){var c=tgCur();if(!c){c={id:tgUid(),title:'Новый чат',created:Date.now(),messages:[]};TG_CHATS.unshift(c);TG_CUR=c.id;tgSave();tgRenderChatList();}return c;}
function tgNewChat(){var c={id:tgUid(),title:'Новый чат',created:Date.now(),messages:[]};TG_CHATS.unshift(c);TG_CUR=c.id;tgSave();tgRenderChatList();tgRender();tgToggleSidebar(false);var i=$('#tgInput');if(i)i.focus();}
function tgOpenChat(id){TG_CUR=id;tgSave();tgRenderChatList();tgRender();tgToggleSidebar(false);}
function tgDeleteChat(id,ev){if(ev)ev.stopPropagation();TG_CHATS=TG_CHATS.filter(function(c){return c.id!==id;});if(TG_CUR===id)TG_CUR=TG_CHATS.length?TG_CHATS[0].id:null;tgSave();tgRenderChatList();tgRender();}
function tgTitleFrom(t){t=(t||'').replace(/\s+/g,' ').trim();return t.length>38?t.slice(0,38)+'…':(t||'Новый чат');}
function tgRenderChatList(){var box=$('#stgChatList');if(!box)return;var q=(($('#stgSearch')||{}).value||'').toLowerCase();var list=TG_CHATS.filter(function(c){return !q||(c.title||'').toLowerCase().indexOf(q)>=0;});if(!list.length){box.innerHTML='<div class="stg-empty">'+(q?'Ничего не найдено':'Пока нет чатов. Начни диалог — он сохранится здесь.')+'</div>';return;}box.innerHTML=list.map(function(c){return '<div class="stg-chat'+(c.id===TG_CUR?' active':'')+'" onclick="tgOpenChat(\''+c.id+'\')"><span class="ti">'+esc(c.title||'Новый чат')+'</span><button class="del" title="Удалить" onclick="tgDeleteChat(\''+c.id+'\',event)">×</button></div>';}).join('');}
function tgMd(s){s=esc(s);if(s.indexOf('\uFFFD')>=0)s=s.replace(/\uFFFD+/g,'');s=s.replace(/\*\*\*(.+?)\*\*\*/g,'<b><i>$1</i></b>');s=s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');s=s.replace(/\*([^*\n]+?)\*/g,'<i>$1</i>');s=s.replace(/\*/g,'');var lines=s.split(/\n/),out=[],inList=false;for(var i=0;i<lines.length;i++){var ln=lines[i].trim();if(/^[-•]\s+/.test(ln)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+ln.replace(/^[-•]\s+/,'')+'</li>');continue;}if(/^\d+[\.\)]\s+/.test(ln)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+ln.replace(/^\d+[\.\)]\s+/,'')+'</li>');continue;}if(inList){out.push('</ul>');inList=false;}if(!ln)continue;if(/^#{1,4}\s+/.test(ln)){out.push('<h4>'+ln.replace(/^#{1,4}\s+/,'')+'</h4>');continue;}out.push('<p>'+ln+'</p>');}if(inList)out.push('</ul>');return out.join('');}
function tgActions(){return '<div class="stg-actions"><button title="Копировать" onclick="tgCopy(this)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button></div>';}
function tgCopy(btn){try{var msg=btn.closest('.stg-msg');var b=msg&&msg.querySelector('.body');navigator.clipboard.writeText(b?b.innerText:'');}catch(e){}}
function tgScrollBottom(){var s=$('#stgScroll');if(s)s.scrollTop=s.scrollHeight;}
function tgAppendDom(m){var box=$('#stgScrollIn');if(!box)return;var w=box.querySelector('.stg-welcome');if(w)box.innerHTML='';var d=document.createElement('div');if(m.role==='user'){d.className='stg-msg user';d.innerHTML='<div class="bubble">'+esc(m.content||'').replace(/\n/g,'<br>')+'</div>';}else{d.className='stg-msg bot';var body=m.html?m.html:tgMd(m.content||'');var acts=(m.content&&!m.html)?tgActions():'';d.innerHTML='<div class="ava">'+TG_AVA+'</div><div style="flex:1;min-width:0"><div class="body">'+body+'</div>'+acts+'</div>';}box.appendChild(d);}
function tgRender(){var box=$('#stgScrollIn');if(!box)return;var c=tgCur();if(!c||!c.messages.length){tgRenderWelcome();return;}box.innerHTML='';c.messages.forEach(function(m){tgAppendDom(m);});tgScrollBottom();}
function tgRenderWelcome(){var box=$('#stgScrollIn');if(!box)return;var sub='<p class="sub">Я <b>Viora AI</b> — помогу растить Telegram: разберу посты с аналитикой и диаграммами, соберу контент-план и свяжу всё с YouTube.</p>';try{var _pc=(window.vGetProfileChannels?window.vGetProfileChannels():[]);var _ytc=_pc.filter(function(c){return c.type==='yt';})[0];var _ytName=_ytc?(_ytc.title||_ytc.handle):((typeof STATE!=='undefined'&&STATE&&STATE.channel&&STATE.channel.title)?STATE.channel.title:'');if(_ytName){sub='<p class="sub">Вижу твой YouTube-канал <b>'+esc(_ytName)+'</b> — могу построить план перелива его аудитории в Telegram.</p>';}}catch(e){}var cards=[{a:'send',ic:'🚀',h:'Раскрутить Telegram',d:'Стратегия роста канала с нуля',q:'Составь пошаговую стратегию роста моего Telegram-канала: позиционирование, рубрики, охваты и вовлечение.'},{a:'post',ic:'📝',h:'Разбор поста',d:'Вставь пост — дам аналитику и переписку',q:''},{a:'send',ic:'🔗',h:'Воронка с YouTube',d:'Связать YouTube и Telegram',q:'Построй воронку перелива аудитории с YouTube в мой Telegram: какие ролики и Shorts снимать, что писать в описании и закрепе.'},{a:'send',ic:'🗓',h:'Контент-план',d:'План публикаций на неделю',q:'Составь контент-план для моего Telegram-канала на 7 дней с форматами и темами.'}];var cardsHtml=cards.map(function(c){return '<div class="stg-card" data-act="'+c.a+'" data-q="'+esc(c.q)+'" onclick="tgCardClick(this)"><div class="ic">'+c.ic+'</div><div class="h">'+c.h+'</div><div class="d">'+c.d+'</div></div>';}).join('');var howto='<details class="stg-howto"><summary>❓ Как пользоваться студией</summary><div class="hbody"><p><b>1. Разбор постов.</b> Вставь текст Telegram-поста (кнопка «+» → «Вставить пост» или просто отправь) — Viora покажет аналитику по 6 параметрам, диаграмму и перепишет пост сильнее.</p><p><b>2. Идеи и заголовки.</b> Спроси идеи рубрик, заголовки, форматы — получишь конкретику под нишу.</p><p><b>3. Воронка с YouTube.</b> Сделай аудит во вкладке YouTube или дай ссылку — свяжу платформы и построю перелив.</p><p><b>4. История.</b> Все диалоги сохраняются в левой панели — возвращайся к ним в любой момент.</p></div></details>';box.innerHTML='<div class="stg-welcome"><h1>С чего начнём?</h1>'+sub+'<div class="stg-cards">'+cardsHtml+'</div>'+howto+'</div>';}
function tgTyping(){var box=$('#stgScrollIn');if(!box)return;var w=box.querySelector('.stg-welcome');if(w)box.innerHTML='';var d=document.createElement('div');d.className='stg-msg bot';d.id='stgTyping';d.innerHTML='<div class="ava">'+TG_AVA+'</div><div class="stg-typing"><span></span><span></span><span></span></div>';box.appendChild(d);tgScrollBottom();}
function tgHideTyping(){var t=$('#stgTyping');if(t)t.remove();}
function tgAddMessage(role,obj){var c=tgEnsureChat();var m={role:role};if(obj.content!=null)m.content=obj.content;if(obj.html)m.html=obj.html;c.messages.push(m);if(role==='user'&&(!c.title||c.title==='Новый чат')&&obj.content){c.title=tgTitleFrom(obj.content);}tgSave();tgAppendDom(m);tgScrollBottom();tgRenderChatList();}
function tgClamp(v,a,b){return Math.max(a,Math.min(b,v));}
function tgDetectPost(t){var lines=t.split(/\n/).length;return t.length>180||(lines>=3&&t.length>90)||/^\s*(вот мой пост|разбери|мой пост|оцени пост)/i.test(t);}
function tgAnalyzeLocal(t){var text=(t||'').trim();var chars=text.length;var words=(text.match(/[^\s]+/g)||[]).length;var lines=text.split(/\n/);var paras=text.split(/\n\s*\n/).filter(function(x){return x.trim();}).length||1;var first=(lines[0]||'').trim();var emoji=(text.match(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE0F]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g)||[]).length;var links=(text.match(/https?:\/\/|t\.me\//gi)||[]).length;var tags=(text.match(/#[\wА-Яа-яЁё]+/g)||[]).length;var bold=/\*\*[^*]+\*\*/.test(text)||/[A-ZА-Я]{4,}/.test(text);var listy=/(^|\n)\s*([-•]|\d+[\.\)])\s+/.test(text);var cta=/(подпиш|подпис|переход|жми|ссылк|читай|напиш|коммент|ставь|делись|поделись|залетай|вступ|забирай|скачай|регистрир|подключ|жду|👇|➡|❤|🔥|👉)/i.test(text);var sentences=(text.match(/[.!?]+/g)||[]).length||1;var avgSent=words/sentences;var s={};s.hook=tgClamp((first.length>=18&&first.length<=95?68:42)+(/[?!]/.test(first)?13:0)+(/\d/.test(first)?9:0)+(/[\uD83C-\uDBFF\u2300-\u27BF]/.test(first)?6:0),5,100);s.structure=tgClamp((paras>=2&&paras<=6?70:45)+(chars>120&&chars<2200?18:0)+(listy?12:0),5,100);s.cta=cta?tgClamp(78+(links?12:0),0,100):24;s.read=tgClamp(avgSent<=10?92:avgSent<=16?74:avgSent<=22?55:35,5,100);s.emotion=tgClamp(26+emoji*7+((text.match(/!/g)||[]).length*5),5,100);s.format=tgClamp((bold?28:0)+(listy?28:0)+(emoji>0?20:0)+(paras>=2?16:0)+(tags?8:0),5,100);var visp=null;try{if(typeof vispScore==='function')visp=vispScore(first);}catch(e){}if(visp&&visp.hit&&visp.hit.length){s.hook=tgClamp(s.hook+(visp.hit.length-1)*6,5,100);}var overall=Math.round((s.hook+s.structure+s.cta+s.read+s.emotion+s.format)/6);var tg=[];tg.push({k:'',t:'📝 '+words+' слов'});tg.push({k:'',t:'📄 '+paras+' абз.'});tg.push({k:'',t:'😀 '+emoji+' эмодзи'});tg.push({k:cta?'good':'bad',t:cta?'✅ Есть призыв':'⚠️ Нет призыва (CTA)'});tg.push({k:(first.length>=18&&first.length<=95)?'good':'warn',t:(first.length<18?'⚠️ Слабый хук':first.length>95?'⚠️ Длинный хук':'✅ Сильный хук')});if(visp&&visp.hit){tg.push({k:visp.hit.length>=2?'good':'warn',t:'🎯 ВИСП: '+(visp.hit.map(function(x){return x.k;}).join('')||'—')+(visp.miss&&visp.miss.length?(' (нет '+visp.miss.map(function(x){return x.k;}).join('')+')'):'')});}if(chars>2200)tg.push({k:'warn',t:'⚠️ Очень длинный'});if(!listy&&chars>500)tg.push({k:'warn',t:'💡 Добавь списки'});if(links)tg.push({k:'good',t:'🔗 Есть ссылка'});return {overall:overall,s:s,tags:tg};}
function tgRadarSVG(sc){var ax=[['Хук',sc.hook],['Структура',sc.structure],['Призыв',sc.cta],['Читаб-ть',sc.read],['Эмоции',sc.emotion],['Оформл.',sc.format]];var cx=120,cy=115,R=78,n=ax.length;function pt(i,r){var a=-Math.PI/2+i*2*Math.PI/n;return [cx+r*Math.cos(a),cy+r*Math.sin(a)];}var grid='';[0.25,0.5,0.75,1].forEach(function(f){var p=ax.map(function(_,i){var v=pt(i,R*f);return v[0].toFixed(1)+','+v[1].toFixed(1);}).join(' ');grid+='<polygon points="'+p+'" fill="none" stroke="rgba(255,255,255,.09)"/>';});var spokes='';for(var i=0;i<n;i++){var e=pt(i,R);spokes+='<line x1="'+cx+'" y1="'+cy+'" x2="'+e[0].toFixed(1)+'" y2="'+e[1].toFixed(1)+'" stroke="rgba(255,255,255,.08)"/>';}var dp=ax.map(function(a,i){var v=pt(i,R*Math.max(5,a[1])/100);return v[0].toFixed(1)+','+v[1].toFixed(1);}).join(' ');var labels='';ax.forEach(function(a,i){var l=pt(i,R+19);labels+='<text x="'+l[0].toFixed(1)+'" y="'+l[1].toFixed(1)+'" fill="#9aa0a6" font-size="9" font-family="Inter,sans-serif" text-anchor="middle" dominant-baseline="middle">'+a[0]+'</text>';});return '<svg class="stg-radar" viewBox="0 0 240 232">'+grid+spokes+'<polygon points="'+dp+'" fill="rgba(42,171,238,.28)" stroke="#2aabee" stroke-width="2"/>'+labels+'</svg>';}
function tgRenderAnalysis(m){var bars=[['Хук',m.s.hook],['Структура',m.s.structure],['Призыв (CTA)',m.s.cta],['Читабельность',m.s.read],['Эмоции',m.s.emotion],['Оформление',m.s.format]];var barsHtml=bars.map(function(b){return '<div class="stg-metric"><div class="lab"><span>'+b[0]+'</span><b>'+Math.round(b[1])+'</b></div><div class="stg-bar"><i style="width:'+Math.round(b[1])+'%"></i></div></div>';}).join('');var tags=m.tags.map(function(t){return '<span class="stg-tag '+t.k+'">'+esc(t.t)+'</span>';}).join('');return '<div class="stg-an"><h4>📊 Аналитика поста<span class="score">'+m.overall+'/100</span></h4><div class="stg-an-grid"><div>'+tgRadarSVG(m.s)+'</div><div class="stg-metrics">'+barsHtml+'</div></div><div class="stg-chips">'+tags+'</div></div>';}
function buildTgContext(){try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel&&STATE.channel.title){var c=STATE.channel;return 'У пользователя уже разобран YouTube-канал "'+(c.title||'')+'" (подписчиков: '+(c.subs||'?')+'). Активно используй это: предлагай, как переливать его аудиторию в Telegram, какие ролики/Shorts снять, что писать в закрепе и описании.';}}catch(e){}return 'YouTube-аудит пока не сделан. Если уместно — предложи дать ссылку на канал или сделать аудит во вкладке YouTube, чтобы связать платформы.';}
function VIORA_TG_SYS(mode,isPost){var base='Ты — Viora AI, эксперт-продюсер по росту в Telegram и кросс-промо с YouTube. Отвечай по-русски, живо, конкретно. КРАТКО — только суть, без воды и длинных вступлений: короткий ответ или 3-5 пунктов. Форматируй удобно: короткие абзацы, списки через "- ", **жирным** ключевое, заголовки через "### ", эмодзи в меру. Исключение — режим разбора поста, где нужен полный переписанный вариант.';var modes={analyze:'РЕЖИМ: разбор поста. Пользователь прислал Telegram-пост. Дай структурный разбор: 1) **Хук** (первая строка) — оцени по ВИСП (Выгода/Интрига/Срочность/Причастность): что закрыто и что добавить; 2) **Структура и читабельность**; 3) **Призыв (CTA)**; 4) **Оформление и эмоции**. Затем под заголовком "### ✍️ Переписанный вариант" дай усиленную версию поста целиком, готовую к публикации, с мощным первым предложением. В конце — 1-2 совета на будущее. Над твоим ответом уже показана визуальная аналитика — не дублируй цифры, а объясни смысл и дай улучшения.',ideas:'РЕЖИМ: идеи и заголовки. Дай конкретные идеи постов/рубрик и цепляющие заголовки под нишу пользователя.',plan:'РЕЖИМ: контент-план. Составь план публикаций по дням с форматами (текст, опрос, кружок, видео) и темами, с прицелом на охваты и вовлечение.',funnel:'РЕЖИМ: воронка YouTube→Telegram. YouTube = охват/новые люди, Telegram = закрытый клуб для лояльных (бонусы, бэкстейдж, ранний доступ). Предложи конкретную связку: какие ролики/Shorts снять, лид-магнит за подписку, что писать в описании/закрепе.',auto:'РЕЖИМ: авто. Сам определи задачу по сообщению и ответь максимально полезно.'};var m=modes[mode]||modes.auto;if(isPost&&mode==='auto')m=modes.analyze;return base+'\n\n'+m+'\n\nЛОГИКА СВЯЗКИ: Telegram растёт за счёт перелива лояльной аудитории с YouTube и сильного контента.\n\nКОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:\n'+buildTgContext()+'\n'+(typeof kbFor!=='undefined'?kbFor('telegram'):'');}
async function tgCallAI(msgs,maxTokens){var ctrl=new AbortController();var to=setTimeout(function(){ctrl.abort();},60000);try{var r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:ctrl.signal,headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},body:JSON.stringify({model:MODEL_FAST,temperature:0.6,max_tokens:maxTokens||1000,messages:msgs})});if(!r.ok)throw new Error('AI');var d=await r.json();return vClean((d.choices&&d.choices[0]&&d.choices[0].message&&d.choices[0].message.content)||'Не получилось ответить, попробуй переформулировать.');}finally{clearTimeout(to);}}
async function tgSendChat(){if(TG_SENDING)return;var inp=$('#tgInput');if(!inp)return;var q=inp.value.trim();if(!q)return;inp.value='';tgAutoGrow(inp);tgEnsureChat();tgAddMessage('user',{content:q});var mode=TG_MODE;var isPost=(mode==='analyze')||(mode==='auto'&&tgDetectPost(q));if(isPost){try{var an=tgAnalyzeLocal(q);tgAddMessage('bot',{html:tgRenderAnalysis(an)});}catch(e){}}TG_SENDING=true;tgSetSend(true);tgTyping();try{var sys=VIORA_TG_SYS(mode,isPost);var c=tgCur();var hist=c.messages.filter(function(x){return x.content;}).map(function(x){return {role:x.role==='bot'?'assistant':'user',content:x.content};}).slice(-8);var msgs=[{role:'system',content:sys}].concat(hist);var ans=await tgCallAI(msgs,isPost?1300:420);tgHideTyping();tgAddMessage('bot',{content:ans});}catch(e){tgHideTyping();tgAddMessage('bot',{content:'⚠️ Viora AI сейчас недоступна — попробуй ещё раз через пару секунд.'});}TG_SENDING=false;tgSetSend(false);var i2=$('#tgInput');if(i2)i2.focus();}
function tgSetSend(d){var b=$('#tgSendBtn');if(b)b.disabled=!!d;}
function tgAutoGrow(el){if(!el)return;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,180)+'px';}
function tgCardClick(el){var act=el.getAttribute('data-act');var qq=el.getAttribute('data-q');var i=$('#tgInput');if(!i)return;if(act==='post'){i.value='Вот мой Telegram-пост, разбери его и перепиши сильнее:\n\n';i.focus();tgAutoGrow(i);return;}i.value=qq;tgSendChat();}
function tgToggleSidebar(force){var sb=$('#stgSidebar');var ov=$('#stgOverlay');if(!sb)return;var open=(typeof force==='boolean')?force:!sb.classList.contains('open');sb.classList.toggle('open',open);if(ov)ov.classList.toggle('show',open);}
function tgTogglePlus(ev){if(ev)ev.stopPropagation();var m=$('#stgPlusMenu');if(m)m.classList.toggle('open');}
function tgPlusAction(a){var m=$('#stgPlusMenu');if(m)m.classList.remove('open');var i=$('#tgInput');if(!i)return;if(a==='post'){i.value='Вот мой Telegram-пост, разбери его и перепиши сильнее:\n\n';i.focus();tgAutoGrow(i);}else if(a==='yt'){i.value='Свяжи мой YouTube и Telegram: построй воронку перелива аудитории.';tgSendChat();}else if(a==='plan'){i.value='Составь контент-план для моего Telegram на неделю.';tgSendChat();}}
function tgToggleModeMenu(ev){if(ev)ev.stopPropagation();var m=$('#stgModeMenu');if(m)m.classList.toggle('open');}
function tgSetMode(mode,label){TG_MODE=mode;var l=$('#stgModeLabel');if(l)l.textContent=label;var m=$('#stgModeMenu');if(m)m.classList.remove('open');}
function tgMountChat(){if(!TG_MOUNTED){TG_MOUNTED=true;tgLoad();tgWire();}tgRenderChatList();tgRender();}
function tgWire(){var i=$('#tgInput');if(i){i.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();tgSendChat();}});i.addEventListener('input',function(){tgAutoGrow(i);});}document.addEventListener('click',function(e){var pm=$('#stgPlusMenu');if(pm&&pm.classList.contains('open')&&!e.target.closest('.stg-plusmenu')&&!e.target.closest('.stg-plus'))pm.classList.remove('open');var mm=$('#stgModeMenu');if(mm&&mm.classList.contains('open')&&!e.target.closest('.stg-modechip'))mm.classList.remove('open');});}
(function tgBoot(){try{var h=$('#hero');if(h)h.style.display='none';}catch(e){}})();

/*  MODE SWITCH + IDEA SEARCH (Outlier Finder)                           */
/* ===================================================================== */
let MODE='audit';
function setMode(m){
  MODE=m;
  document.querySelectorAll('#modeSwitch button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  $('#hero')?.classList.toggle('tall',m==='idea');
  $('#auditPane').style.display=m==='audit'?'block':'none';
  $('#ideaPane').style.display=m==='idea'?'block':'none';
  setTimeout(()=>{(m==='audit'?$('#urlInput'):$('#ideaInput'))?.focus({preventScroll:true});window.scrollTo(0,0);},60);
}

let IDEA_STATE={};
const IDEA_STEPS=[
  {id:'q',label:'Формирую поисковые запросы'},
  {id:'search',label:'Сканирую YouTube по теме'},
  {id:'channels',label:'Подтягиваю размеры каналов'},
  {id:'outlier',label:'Считаю множители выбросов'},
  {id:'ai',label:'AI выделяет закономерности'}
];

async function startIdeaSearch(){
  const q=$('#ideaInput').value.trim();
  if(!q){$('#ideaInput').focus();return;}
  const timeF=ddGet('ideaTime'), typeF=ddGet('ideaType'), sizeF=ddGet('ideaSize'), langF=ddGet('ideaLang'), presetF=ddGet('ideaPreset')||'';
  $('#hero').style.display='none';$('#dashboard').style.display='none';$('#ideas').style.display='none';
  $('#loading').style.display='flex';
  $('#steps').innerHTML=IDEA_STEPS.map(s=>`<div class="step" data-s="${s.id}"><span class="ic"></span><span>${s.label}</span></div>`).join('');
  $('#loadTitle').textContent='Ищу виральные выбросы…';
  $('#loadSub').textContent='Сканирую десятки каналов по теме — 20–50 секунд';
  window.scrollTo(0,0);
  try{
    setStep('q','active');
    // publishedAfter filter
    let after='';
    if(timeF){const d=new Date(Date.now()-(+timeF)*864e5);after='&publishedAfter='+d.toISOString();}
    const order = timeF&&+timeF<=30 ? 'viewCount':'relevance';
    const lang = langParam(langF);
    setStep('q','done');

    setStep('search','active');
    // pull up to 100 candidate videos across 2 pages, multiple orders
    let vids=[],token='',pages=0;
    const orders=[order,'viewCount'];
    const seen=new Set();
    for(const ord of [...new Set(orders)]){
      token='';pages=0;
      while(pages<2){
        const s=await ytFetch(`search?part=snippet&type=video&maxResults=50&order=${ord}&q=${encodeURIComponent(q)}${lang}${after}${token?`&pageToken=${token}`:''}`);
        (s.items||[]).forEach(i=>{const id=i.id?.videoId;if(id&&!seen.has(id)){seen.add(id);vids.push({id,channelId:i.snippet.channelId});}});
        token=s.nextPageToken;pages++;if(!token)break;
      }
    }
    if(!vids.length)throw new Error('По запросу «'+q+'» ничего не нашлось. Попробуй другую формулировку.');
    setStep('search','done');

    setStep('channels','active');
    // fetch video stats
    const ids=vids.map(v=>v.id);
    const full=await getVideos(ids);
    // unique channels
    const chMap={};
    const chIds=[...new Set(full.map((v,i)=>vids.find(x=>x.id===v.id)?.channelId).filter(Boolean))];
    // map video->channelId from search result
    const vToCh={};vids.forEach(v=>vToCh[v.id]=v.channelId);
    // batch channel stats
    for(let i=0;i<chIds.length;i+=50){
      const chunk=chIds.slice(i,i+50).join(',');
      const d=await ytFetch(`channels?part=snippet,statistics&id=${chunk}`);
      (d.items||[]).forEach(c=>{chMap[c.id]={title:c.snippet.title,avatar:c.snippet.thumbnails?.default?.url,subs:+c.statistics.subscriberCount||0,totalViews:+c.statistics.viewCount||0,videoCount:+c.statistics.videoCount||0};});
    }
    setStep('channels','done');

    setStep('outlier','active');
    const mySubs=STATE?.channel?.subs||0;
    const rows=[];
    full.forEach(v=>{
      const cid=vToCh[v.id];const ch=chMap[cid];if(!ch)return;
      // outlier baseline = subscriber count (industry standard: views beyond your sub base = algorithm pushed it out)
      const subs=ch.subs||0;
      if(subs<50)return; // skip channels with hidden/zero subs
      const mult=v.views/subs;
      // discard noise: need real traction
      if(v.views<500)return;
      // type filter
      if(typeF==='long'&&v.isShort)return;
      if(typeF==='short'&&!v.isShort)return;
      // size filter
      if(sizeF==='small'&&ch.subs>100000)return;
      if(sizeF==='mid'&&(ch.subs<100000||ch.subs>1000000))return;
      if(sizeF==='similar'&&mySubs>0&&(ch.subs<mySubs*0.2||ch.subs>mySubs*5))return;
      const _age=v.age||0;
      if(presetF==='gold'&&!(subs<5000&&v.views>=10000&&mult>=8))return;
      if(presetF==='under'&&!(mult>=5&&subs<200000))return;
      if(presetF==='fresh'&&!(_age<=30&&mult>=2))return;
      if(presetF==='evergreen'&&!(_age>=180&&v.viewsPerDay>=(v.isShort?40:15)))return;
      if(presetF==='seo'){const _qw=q.toLowerCase().split(/\s+/).filter(w=>w.length>3);const _t=(v.title||'').toLowerCase();if(_qw.length&&!_qw.some(w=>_t.includes(w)))return;}
      rows.push({...v,channel:ch,channelId:cid,baseline:subs,mult});
    });
    if(!rows.length)throw new Error('Не нашлось ярких выбросов под эти фильтры. Ослабь фильтры (размер канала / период) и попробуй снова.');
    // keep meaningful outliers: views >= subscriber count is the classic viral signal
    rows.sort((a,b)=>b.mult-a.mult);
    const _sort=presetF==='evergreen'?'views':(presetF==='fresh'?'recent':'mult');
    IDEA_STATE={query:q,rows,sort:_sort,timeF,typeF,sizeF,langF,presetF};
    setStep('outlier','done');

    setStep('ai','active');
    $('#loadTitle').textContent='AI ищет общий паттерн…';
    let ai=null;
    try{ai=await callIdeaAI(q,rows.slice(0,18));}catch(e){console.warn('idea ai failed',e);IDEA_STATE.aiError=true;}
    IDEA_STATE.ai=ai;
    setStep('ai','done');

    await sleep(300);
    renderOutliers();
  }catch(err){console.error(err);showError(err);}
}

function outClass(m){return m>=5?'mega':m>=2?'hot':'';}
function multLabel(m){return '×'+(m>=10?Math.round(m):m.toFixed(1));}

function renderOutliers(){
  $('#loading').style.display='none';
  $('#ideas').style.display='block';
  const {query,rows,ai,sort}=IDEA_STATE;
  let sorted=[...rows];
  if(sort==='views')sorted.sort((a,b)=>b.views-a.views);
  else if(sort==='recent')sorted.sort((a,b)=>new Date(b.published)-new Date(a.published));
  else if(sort==='eng')sorted.sort((a,b)=>b.engagement-a.engagement);
  else sorted.sort((a,b)=>b.mult-a.mult);
  sorted=sorted.slice(0,30);
  const avgMult=rows.reduce((s,v)=>s+v.mult,0)/rows.length;
  const shortShare=rows.filter(v=>v.isShort).length/rows.length;
  $('#ideas').innerHTML=`
  <div class="section" style="margin-top:24px">
    <div class="out-head">
      <div>
        <h2 style="font-size:clamp(22px,3.4vw,30px);font-weight:800">🔍 Выбросы по теме «${esc(query)}»</h2>
        <div class="desc" style="margin-top:6px">Найдено <b style="color:#fff">${rows.length}</b> виральных роликов. <b style="color:#9bf3bf">Множитель</b> = во сколько раз просмотры превысили число подписчиков канала. <b style="color:#9bf3bf">×1+</b> уже означает, что алгоритм вынес ролик за пределы своей аудитории.</div>
      </div>
      <div class="out-sort" id="outSort">
        <button class="${sort==='mult'?'on':''}" onclick="setIdeaSort('mult')">🚀 Выброс</button>
        <button class="${sort==='views'?'on':''}" onclick="setIdeaSort('views')">👁 Просмотры</button>
        <button class="${sort==='eng'?'on':''}" onclick="setIdeaSort('eng')">⚡ Вовлечённость</button>
        <button class="${sort==='recent'?'on':''}" onclick="setIdeaSort('recent')">🆕 Свежие</button>
      </div>
    </div>
    ${ai?`<div class="out-summary">
      <div class="oh">🧠 Что общего у этих хитов${IDEA_STATE.aiError?' · оффлайн':''}</div>
      ${ai.pattern?`<div style="margin-bottom:10px">${esc(ai.pattern)}</div>`:''}
      ${ai.angles?.length?`<div style="margin-bottom:6px"><b>Готовые углы для тебя:</b></div><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px">${ai.angles.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>`:''}
    </div>`:''}
    <div class="out-grid" id="outGrid">
      ${sorted.map(v=>outCard(v)).join('')}
    </div>
    <div class="fab-bar" style="margin-top:26px">
      <button class="btn ghost" onclick="backToHero()">← Новый поиск</button>
    </div>
  </div>`;
  window.scrollTo(0,0);
}

function outCard(v){
  const cls=outClass(v.mult);
  return `<div class="out">
    <a class="thumb" href="https://youtu.be/${v.id}" target="_blank" rel="noopener">
      <img src="${safeImg(v.thumb)}" alt="" loading="lazy" onerror="this.parentElement.style.background='#1a1a1a'"/>
      <span class="mult ${cls}">${multLabel(v.mult)}</span>
      <span class="typ ${v.isShort?'short':'long'}">${v.isShort?'⚡ Shorts':'🎬 Длинное'}</span>
      <span class="dur">${durLabel(v.dur)}</span>
    </a>
    <div class="body">
      <div class="ot">${esc(v.title)}</div>
      ${benefitChip(v.title)}
      <div class="och">📺 ${esc(v.channel.title)} · ${fmt(v.channel.subs)} подп.</div>
      <div class="ostats">
        <span class="om">👁 <b>${fmt(v.views)}</b></span>
        <span class="om">👥 <b>${fmt(Math.round(v.baseline))}</b> подп.</span>
        <span class="om">⚡ <b>${(v.engagement*100).toFixed(1)}%</b></span>
      </div>
      <div class="obar">
        <button onclick="adaptIdea('${v.id}')">✨ Адаптировать</button>
        <a href="https://youtu.be/${v.id}" target="_blank" rel="noopener">▶ Открыть</a>
      </div>
    </div>
  </div>`;
}

function setIdeaSort(s){IDEA_STATE.sort=s;renderOutliers();}
function backToHero(){$('#ideas').style.display='none';$('#dashboard').style.display='none';$('#loading').style.display='none';$('#hero').style.display='flex';setMode('idea');window.scrollTo(0,0);}

async function callIdeaAI(query,rows){
  const payload=rows.map(v=>({title:v.title,channel:v.channel.title,subs:v.channel.subs,views:v.views,multiplier:+v.mult.toFixed(1),type:v.isShort?'Shorts':'Long',engagementPct:+(v.engagement*100).toFixed(2)}));
  const sys=`Ты — аналитик виральности YouTube. Тебе дают список роликов-ВЫБРОСОВ по теме (каждый набрал кратно больше нормы своего канала). Найди, что у них ОБЩЕГО и что из этого может повторить другой автор. Верни СТРОГО JSON:
{"pattern":"2-4 предложения: какой формат/заголовок/угол объединяет эти выбросы. Конкретно, с примерами заголовков из данных. Объясняй через ВИСП и ступень Лестницы Ханта.","angles":["4-6 готовых углов/идей роликов на эту тему, которые с высокой вероятностью повторят успех — каждый как готовый заголовок, упакованный по ВИСП"]}
Без воды, по-русски, конкретно.

${kbFor('idea')}`;
  const _ctrl=new AbortController();const _to=setTimeout(function(){_ctrl.abort();},60000);
  const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:_ctrl.signal,
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
    body:JSON.stringify({model:MODEL_FAST,temperature:0.5,max_tokens:1500,response_format:{type:"json_object"},
      messages:[{role:"system",content:sys},{role:"user",content:`Тема: "${query}". Выбросы:\n`+JSON.stringify(payload)}]})});
  clearTimeout(_to);
  if(!r.ok)throw new Error('ai '+r.status);
  const d=await r.json();return vJsonParse(d.choices[0].message.content);
}

/* adapt a found outlier into a personalized idea via the title lab */
function adaptIdea(vid){
  const row=(IDEA_STATE.rows||[]).find(v=>v.id===vid);if(!row)return;
  if(!STATE?.channel){
    // no channel analyzed yet — prefill idea input and prompt audit
    alert('Чтобы адаптировать идею под твой канал, сначала сделай аудит своего канала (вкладка «Аудит канала»). Тогда AI подгонит формат под твою аудиторию.');
    return;
  }
  // jump to title lab prefilled
  $('#dashboard').style.display='block';$('#ideas').style.display='none';
  const topic=row.title;
  const lt=$('#labTopic');
  if(lt){lt.value=topic;lt.scrollIntoView({block:'center'});setTimeout(()=>runTitleLab(),200);}
}


// parse ISO8601 duration -> seconds
function durSec(iso){if(!iso)return 0;const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return 0;return (+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0);}
function durLabel(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return (h?h+':':'')+(h?String(m).padStart(2,'0'):m)+':'+String(sec).padStart(2,'0');}
function ageDays(date){return Math.max(1,(Date.now()-new Date(date).getTime())/864e5);}
function quantile(arr,q){if(!arr.length)return 0;const s=[...arr].sort((a,b)=>a-b);const p=(s.length-1)*q,b=Math.floor(p),r=p-b;return s[b+1]!==undefined?s[b]+r*(s[b+1]-s[b]):s[b];}
function median(a){return quantile(a,0.5);}

/* ===================================================================== */
/*  YOUTUBE FETCH — cached, deduped, quota-aware                         */
/* ===================================================================== */
const YT_CACHE_TTL=24*3600*1000; // 24h — агрессивный кэш, чтобы экономить ����воту
const _inflight=new Map();
function _cacheGet(key){
  try{
    const raw=localStorage.getItem('ytc:'+key);if(!raw)return null;
    const o=JSON.parse(raw);
    if(Date.now()-o.t>YT_CACHE_TTL){localStorage.removeItem('ytc:'+key);return null;}
    return o.d;
  }catch(e){return null;}
}
function _cacheSet(key,data){
  try{localStorage.setItem('ytc:'+key,JSON.stringify({t:Date.now(),d:data}));}
  catch(e){
    // storage full — purge oldest ytc entries and retry once
    try{
      const keys=Object.keys(localStorage).filter(k=>k.startsWith('ytc:'));
      keys.slice(0,Math.ceil(keys.length/2)).forEach(k=>localStorage.removeItem(k));
      localStorage.setItem('ytc:'+key,JSON.stringify({t:Date.now(),d:data}));
    }catch(e2){}
  }
}
/* ---- глобальная защита от 429: троттлинг запросов + экспоненциальный кулдаун ----
   Раньше фоновые радары (ниша/тренды) при первом же 429 не кэшировали результат и
   повторяли запрос каждые 6-7 секунд, устраивая шторм «Too Many Requests».
   Теперь: (1) все обращения к YouTube сериализуются с минимальным интервалом, а «дорогие»
   search-запросы — с бОльшим; (2) после 429/исчерпания квоты включается кулдаун (60с→…→15мин),
   в течение которого мы вообще не трогаем сеть и сразу отдаём кэш или ошибку. */
let _ytCooldownUntil=0;   // до этого времени сетевые запросы к YouTube заблокированы
let _ytBackoff=0;         // текущая длительность кулдауна (растёт при повторных 429)
let _ytChain=Promise.resolve(); // очередь для сериализации запросов
let _ytLastAt=0;          // время последнего реального сетевого вызова
const YT_COOLDOWN_MIN=60000;      // старт кулдауна: 60 секунд
const YT_COOLDOWN_MAX=15*60*1000; // потолок кулдауна: 15 минут
function _ytThrottle(path){
  const gapNeed=/^search\b/.test(path)?450:90; // search дороже и жёстче лимитируется
  const wait=_ytChain.then(async()=>{
    const gap=Date.now()-_ytLastAt;
    if(gap<gapNeed)await sleep(gapNeed-gap);
    _ytLastAt=Date.now();
  });
  _ytChain=wait.catch(()=>{});
  return wait;
}
function _ytIsRateLimited(status,reason){
  return status===429||(status===403&&/quota|rate/i.test(reason||''))||/rateLimitExceeded|quotaExceeded|userRateLimitExceeded/i.test(reason||'');
}
function _ytTrip(){ // включить кулдаун после 429/исчерпания квоты
  _ytBackoff=_ytBackoff?Math.min(_ytBackoff*2,YT_COOLDOWN_MAX):YT_COOLDOWN_MIN;
  _ytCooldownUntil=Date.now()+_ytBackoff;
}
function _ytReset(){_ytBackoff=0;_ytCooldownUntil=0;} // сброс после успешного ответа
async function ytFetch(path,opts={}){
  const cacheable=opts.cache!==false;
  const key=path;
  if(cacheable){const hit=_cacheGet(key);if(hit)return hit;}
  if(_inflight.has(key))return _inflight.get(key);
  // активный кулдаун: не трогаем сеть, чтобы не плодить 429
  if(Date.now()<_ytCooldownUntil){
    const e=new Error('YouTube временно ограничил частоту запросов — данные подтянутся автоматически чуть позже.');
    e.reason='rateLimitExceeded';e.status=429;e.cooldown=true;
    throw e;
  }
  const p=(async()=>{
    let lastErr;
    for(let attempt=0;attempt<2;attempt++){
      try{
        await _ytThrottle(path);
        const _ctrl=new AbortController();const _to=setTimeout(function(){_ctrl.abort();},20000);
        let r;try{r=await fetch(`${YT}/${path}&key=${YOUTUBE_API_KEY}`,{signal:_ctrl.signal});}finally{clearTimeout(_to);}
        if(!r.ok){
          let body={};try{body=await r.json();}catch(e){}
          const reason=body?.error?.errors?.[0]?.reason||'';
          const msg=body?.error?.message||r.statusText;
          const e=new Error(msg);e.reason=reason;e.status=r.status;
          // 429 / исчерпание квоты → включаем кулдаун и выходим сразу (без ретраев)
          if(_ytIsRateLimited(r.status,reason)){_ytTrip();throw e;}
          // прочие временные 5xx → один ретрай
          if(r.status>=500&&attempt===0){lastErr=e;await sleep(700);continue;}
          throw e;
        }
        const j=await r.json();
        _ytReset();
        if(cacheable)_cacheSet(key,j);
        return j;
      }catch(e){
        if(e.status&&e.status<500)throw e;
        lastErr=e;if(attempt===0)await sleep(700);
      }
    }
    throw lastErr||new Error('Сеть недоступна');
  })();
  _inflight.set(key,p);
  try{return await p;}finally{_inflight.delete(key);}
}

/* ===================================================================== */
/*  CHANNEL RESOLUTION                                                   */
/* ===================================================================== */
function parseInput(raw){
  raw=raw.trim();
  if(!raw)return null;
  // bare handle
  if(/^@[\w.\-]+$/.test(raw))return {type:'handle',value:raw};
  let url;try{url=new URL(raw.startsWith('http')?raw:'https://'+raw);}catch(e){
    if(/^UC[\w\-]{20,}$/.test(raw))return{type:'id',value:raw};
    return {type:'search',value:raw};
  }
  const p=url.pathname.replace(/\/$/,'');
  const seg=p.split('/').filter(Boolean);
  // video link
  if(url.hostname.includes('youtu.be'))return{type:'video',value:seg[0]};
  if(url.searchParams.get('v'))return{type:'video',value:url.searchParams.get('v')};
  if(seg[0]==='shorts'&&seg[1])return{type:'video',value:seg[1]};
  if(seg[0]==='watch'&&url.searchParams.get('v'))return{type:'video',value:url.searchParams.get('v')};
  if(seg[0]&&seg[0].startsWith('@'))return{type:'handle',value:seg[0]};
  if(seg[0]==='channel'&&seg[1])return{type:'id',value:seg[1]};
  if(seg[0]==='c'&&seg[1])return{type:'custom',value:seg[1]};
  if(seg[0]==='user'&&seg[1])return{type:'custom',value:seg[1]};
  if(seg[0])return{type:'custom',value:seg[0]};
  return{type:'search',value:raw};
}

async function resolveChannelId(parsed){
  if(parsed.type==='id')return parsed.value;
  if(parsed.type==='video'){
    const d=await ytFetch(`videos?part=snippet&id=${parsed.value}`);
    if(!d.items?.length)throw new Error('Видео не найдено по этой ссылке.');
    return d.items[0].snippet.channelId;
  }
  if(parsed.type==='handle'){
    const h=parsed.value.replace('@','');
    const d=await ytFetch(`channels?part=id&forHandle=${encodeURIComponent(h)}`);
    if(d.items?.length)return d.items[0].id;
  }
  // custom / search fallback
  const q=parsed.value.replace('@','');
  const s=await ytFetch(`search?part=snippet&type=channel&maxResults=1&q=${encodeURIComponent(q)}`);
  if(s.items?.length)return s.items[0].snippet.channelId||s.items[0].id.channelId;
  throw new Error('Не удалось найти канал по этой ссылке.');
}

async function getChannel(id){
  const d=await ytFetch(`channels?part=snippet,statistics,contentDetails,brandingSettings&id=${id}`);
  if(!d.items?.length)throw new Error('Канал не найден или приватный.');
  const c=d.items[0];
  return{
    id:c.id,
    title:c.snippet.title,
    handle:c.snippet.customUrl||'',
    desc:c.snippet.description||'',
    avatar:c.snippet.thumbnails?.medium?.url||c.snippet.thumbnails?.default?.url,
    subs:+c.statistics.subscriberCount||0,
    hiddenSubs:c.statistics.hiddenSubscriberCount,
    totalViews:+c.statistics.viewCount||0,
    videoCount:+c.statistics.videoCount||0,
    uploads:c.contentDetails.relatedPlaylists.uploads,
    keywords:c.brandingSettings?.channel?.keywords||''
  };
}

async function getUploads(uploadsId,max=120){
  let ids=[],token='';
  while(ids.length<max){
    const d=await ytFetch(`playlistItems?part=contentDetails&maxResults=50&playlistId=${uploadsId}${token?`&pageToken=${token}`:''}`);
    (d.items||[]).forEach(i=>ids.push(i.contentDetails.videoId));
    token=d.nextPageToken;if(!token)break;
  }
  return ids.slice(0,max);
}

async function getVideos(ids){
  const out=[];
  for(let i=0;i<ids.length;i+=50){
    const chunk=ids.slice(i,i+50).join(',');
    const d=await ytFetch(`videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${chunk}`);
    (d.items||[]).forEach(v=>{
      const dur=durSec(v.contentDetails.duration);
      const views=+v.statistics.viewCount||0;
      const likes=+v.statistics.likeCount||0;
      const comments=+v.statistics.commentCount||0;
      const age=ageDays(v.snippet.publishedAt);
      const d2=new Date(v.snippet.publishedAt);
      const txt=((v.snippet.title||'')+' '+(v.snippet.description||'')+' '+((v.snippet.tags||[]).join(' '))).toLowerCase();
      const shortHint=/#shorts?\b|#short\b/.test(txt);
      const isShort = dur>0 && (dur<=180 || (shortHint && dur<=240));
      const lsd=v.liveStreamingDetails||null;
      const hadLive=!!(lsd&&(lsd.actualStartTime||lsd.actualEndTime));
      const streamHint=/стрим|трансляц|прямой эфир|онлайн[ -]?эфир|вебинар|лайв|\blive\b/i.test(txt);
      const isStream = !isShort && dur>0 && ((hadLive && dur>=1800) || (streamHint && dur>=2400));
      out.push({
        id:v.id,title:v.snippet.title,desc:v.snippet.description||'',
        tags:v.snippet.tags||[],published:v.snippet.publishedAt,
        thumb:v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,
        dur,isShort,isStream,
        views,likes,comments,age,
        viewsPerDay:views/age,
        engagement:views? (likes+comments)/views : 0,
        likeRate:views?likes/views:0,
        commentRate:views?comments/views:0,
        dow:d2.getDay(), hour:d2.getHours()
      });
    });
  }
  return out;
}

/* classification within a group — с когортной поправкой на возраст.
   Просмотры/день у свежих роликов всегда выше (просмотры приходят в первые дни),
   поэтому "сырое" сравнение хоронит старые видео и завышает новые.
   Каждый ролик сравнивается с медианой роликов СВОЕГО возраста (когорты),
   а уже относительные коэффициенты (xc) сравниваются между собой. */
const AGE_COHORTS=[[0,7],[8,30],[31,90],[91,180],[181,365],[366,Infinity]];
function cohortIndex(v){const a=v.age||0;for(let i=0;i<AGE_COHORTS.length;i++){if(a>=AGE_COHORTS[i][0]&&a<=AGE_COHORTS[i][1])return i;}return AGE_COHORTS.length-1;}
function applyCohorts(group){
  if(!group.length)return;
  const med=median(group.map(v=>v.viewsPerDay))||0;
  const bMed=AGE_COHORTS.map((b,i)=>{
    const arr=group.filter(v=>cohortIndex(v)===i).map(v=>v.viewsPerDay);
    return arr.length>=3?median(arr):null; /* <3 роликов — когорта ненадёжна */
  });
  group.forEach(v=>{
    const i=cohortIndex(v);let m=bMed[i];
    if(m==null){ /* берём ближайшую заполненную когорту, иначе медиану группы */
      for(let d=1;d<AGE_COHORTS.length&&m==null;d++){
        if(i-d>=0&&bMed[i-d]!=null)m=bMed[i-d];
        else if(i+d<AGE_COHORTS.length&&bMed[i+d]!=null)m=bMed[i+d];
      }
      if(m==null)m=med;
    }
    v.cohortMed=m||med||1;
    v.xc=v.cohortMed>0?v.viewsPerDay/v.cohortMed:0;
  });
}
function classify(group){
  if(!group.length)return{hits:[],flops:[],mid:[],med:0,q1:0,q3:0,xq1:0,xq3:0};
  const vpd=group.map(v=>v.viewsPerDay);
  const med=median(vpd),q1=quantile(vpd,0.25),q3=quantile(vpd,0.75);
  applyCohorts(group);
  const xcs=group.map(v=>v.xc);
  const xq1=quantile(xcs,0.25),xq3=quantile(xcs,0.75);
  const hits=[],flops=[],mid=[];
  group.forEach(v=>{
    /* хит: верхняя четверть по когортному коэффициенту (и реально выше нормы) или ×2 к своей когорте */
    if((v.xc>xq3&&v.xc>1.05)||v.xc>=2)hits.push(v);
    /* провал: нижняя четверть и заметно ниже нормы — на ровных каналах не пугаем зря */
    else if(v.xc<xq1&&v.xc<0.95)flops.push(v);
    else mid.push(v);
  });
  hits.sort((a,b)=>b.xc-a.xc);
  flops.sort((a,b)=>a.xc-b.xc);
  return{hits,flops,mid,med,q1,q3,xq1,xq3,cohort:true};
}


/* ===================================================================== */
/*  ЭТАП 1 — ЕДИНЫЙ ДЕТЕРМИНИРОВАННЫЙ ВЕРДИКТ + АНТИ-ГАЛЛЮЦИНАЦИИ          */
/*  Бейдж/вердикт считается ТОЛЬКО по цифрам (classify). Любой AI-текст   */
/*  проверяется на согласованность с вердиктом и чистится от повторов.    */
/* ===================================================================== */
function videoVerdict(v){
  const g=v&&v.isShort?((STATE.groups&&STATE.groups.shorts)||{}):((STATE.groups&&STATE.groups.longs)||{});
  const med=g.med||0;
  /* xc — честный коэффициент с поправкой на возраст ролика (когорта); fallback на сырую медиану */
  const xr=(v&&v.xc!=null)?v.xc:(med>0?(v.viewsPerDay/med):0);
  let kind='mid',label='в норме',emoji='\u2796';
  if(g.hits&&g.hits.some(x=>x.id===v.id)){kind='hit';label='залетело';emoji='\uD83D\uDD25';}
  else if(g.flops&&g.flops.some(x=>x.id===v.id)){kind='flop';label='не зашло';emoji='\u2744\uFE0F';}
  return {kind,label,emoji,med,xr};
}
const VRD_POS=/(залет|выстрел|\bхит\b|вирус|успешн|отличн результат|хорошо набрал|зашл[оаи]\b|в топ|прорыв|бомба|огонь)/i;
const VRD_NEG=/(не\s*зашл|не\s*залет|провал|слаб[оыа]|недобор|плохо|низк|мало просмотр|не выстрел|разочаров|просел|тянет вниз|не набр)/i;
function vrdConsistent(text,kind){
  if(!text||!kind)return true;
  const s=String(text);
  if(kind==='hit'&&VRD_NEG.test(s)&&!VRD_POS.test(s))return false;
  if(kind==='flop'&&VRD_POS.test(s)&&!VRD_NEG.test(s))return false;
  return true;
}
function sanitizeAIText(text,kind){
  let s=String(text==null?'':text).trim();
  if(!s)return '';
  if(kind&&!vrdConsistent(s,kind))return '';
  const parts=s.match(/[^.!?\u2026]+[.!?\u2026]*\s*/g)||[s];
  const seen=new Set(),out=[];
  parts.forEach(p=>{const key=p.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');if(!key){out.push(p);}else if(!seen.has(key)){seen.add(key);out.push(p);}});
  return out.join(' ').replace(/\s+/g,' ').trim();
}
function vrdSentence(vd,v){
  const x=vd.xr?(' (\u00d7'+vd.xr.toFixed(1)+' к норме канала для роликов этого возраста)'):'';
  const vpd=fmt(Math.round(v.viewsPerDay));
  if(vd.kind==='hit')return '\uD83D\uDD25 Залетело — '+vpd+' просм/день'+x+'. Масштабируй этот формат.';
  if(vd.kind==='flop')return '\u2744\uFE0F Не зашло — '+vpd+' просм/день'+x+'. Разбери упаковку (заголовок + превью) и хук.';
  return '\u2796 В норме канала — '+vpd+' просм/день'+x+'.';
}
function reconcileVerdict(a,v){
  if(!a||!v)return;
  const vd=videoVerdict(v);
  if(!a.verdict||!vrdConsistent(a.verdict,vd.kind))a.verdict=vrdSentence(vd,v);
  if(a.why_result&&!vrdConsistent(a.why_result,vd.kind))a.why_result='';
  if(!a.why_result)a.why_result=(vd.xr?('Ролик идёт \u00d7'+vd.xr.toFixed(1)+' к норме канала с поправкой на возраст — '):'')+'результат определяется упаковкой (заголовок + превью) и вовлечённостью '+((v.engagement||0)*100).toFixed(1)+'%.';
  if(a.hook&&!vrdConsistent(a.hook,vd.kind))a.hook='';
  if(a.retention&&!vrdConsistent(a.retention,vd.kind))a.retention='';
}
/* Сквозная метка ВЫГОДЫ (из методички: материальна / применима / базовая потребность) */
const BENEFIT_MATERIAL=/(деньг|рубл|доллар|₽|\$|зарабат|доход|бесплат|скидк|цена|стоит|купить|сэконом|прибыл|заработок|выгодн|инвест|накоп)/i;
const BENEFIT_APPLY=/(как |способ|инструкц|пошагов|гайд|урок|научи|сделать|настро|за \d|шаг|метод|лайфхак|схема|рецепт|формула|чек-лист|\bплан\b|разбор|туториал)/i;
const BENEFIT_NEED=/(здоров|похуд|сон\b|отношен|секс|страх|безопасн|защит|карьер|\bработ|жиль|кварт|семь|\bдет|экзамен|виза|переезд|\bеда|питан|увер|свобод)/i;
function benefitScore(title){
  const t=(title||'').toLowerCase();const hits=[];
  if(BENEFIT_MATERIAL.test(t))hits.push('материальная');
  if(BENEFIT_APPLY.test(t))hits.push('применимая');
  if(BENEFIT_NEED.test(t))hits.push('базовая потребность');
  const n=hits.length;
  if(n>=2)return{level:'high',color:'#36e07a',emoji:'\uD83D\uDFE2',label:'сильная',tip:'Выгода ясна: '+hits.join(', ')+'. Зритель сразу понимает, что получит.'};
  if(n===1)return{level:'mid',color:'#ffd84d',emoji:'\uD83D\uDFE1',label:'размытая',tip:'Видна выгода (\u00ab'+hits.join(', ')+'\u00bb), но слабо. Усиль: добавь конкретику/цифру и явную применимость.'};
  return{level:'low',color:'#ff5a5f',emoji:'\uD83D\uDD34',label:'неясна',tip:'Из заголовка непонятно, что получит зритель. Сформулируй явную пользу — материальную, применимую или из базовых потребностей.'};
}
function benefitChip(title){
  const b=benefitScore(title);
  return '<span class="bnf" title="'+aq(b.tip)+'" style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.05);color:'+b.color+';border:1px solid '+b.color+'40;margin:6px 0 2px">'+b.emoji+' Выгода: '+b.label+'</span>';
}

/* ===================================================================== */
/*  COMPETITORS                                                          */
/* ===================================================================== */
async function findCompetitors(channel,videos,topics){
  const ownWords=new Set((channel.title+' '+(channel.handle||'')).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean));
  const top=[...videos].sort((a,b)=>b.viewsPerDay-a.viewsPerDay).slice(0,12);
  const stop=new Set(['это','как','что','для','свой','чтобы','очень','будет','может','если','один','года','тебя','твои','меня','this','that','with','your','from','have','интервью','видео','channel','канал','смотреть','полный','новый','лучший','выпуск']);
  const tagPool=[];top.forEach(v=>(v.tags||[]).forEach(t=>tagPool.push(t)));
  const isRu=/[а-яё]/i.test(channel.title+' '+top.map(v=>v.title).join(' '));
  const words=(channel.keywords+' '+top.map(v=>v.title).join(' ')+' '+tagPool.join(' ')).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>3&&!stop.has(w)&&!ownWords.has(w));
  const freq={};words.forEach(w=>freq[w]=(freq[w]||0)+1);
  const topWords=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(e=>e[0]);
  const tagFreq={};tagPool.forEach(t=>{const k=t.toLowerCase().trim();if(k.length>3&&!ownWords.has(k))tagFreq[k]=(tagFreq[k]||0)+1;});
  const topTags=Object.entries(tagFreq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  let queries=[];
  if(STATE.primaryNiche)queries.push(STATE.primaryNiche);
  if(topics&&topics.length)topics.filter(t=>t&&t.name&&!/разное|прочее|все ролики|other/i.test(t.name)).slice(0,3).forEach(t=>queries.push(t.name));
  if(topWords.length)queries.push(topWords.slice(0,3).join(' '));
  if(topWords.length>3)queries.push(topWords.slice(2,5).join(' '));
  topTags.forEach(t=>queries.push(t));
  if(channel.keywords)queries.push(channel.keywords.split(/[\s,]+/).filter(Boolean).slice(0,3).join(' '));
  queries.push(channel.title.replace(/[^\p{L}\p{N}\s]/gu,' ').trim());
  queries=[...new Set(queries.map(q=>(q||'').trim().toLowerCase()).filter(q=>q.length>2))].slice(0,6);
  const score={};
  const bump=(cid,n)=>{if(cid&&cid!==channel.id)score[cid]=(score[cid]||0)+n;};
  const lang=isRu?'&relevanceLanguage=ru':'';
  for(const q of queries){
    if(Object.keys(score).length>=14)break;
    try{
      const s=await ytFetch(`search?part=snippet&type=video&maxResults=20&order=viewCount${lang}&q=${encodeURIComponent(q)}`);
      (s.items||[]).forEach(i=>bump(i.snippet&&i.snippet.channelId,2));
    }catch(e){}
    try{
      const s2=await ytFetch(`search?part=snippet&type=channel&maxResults=8${lang}&q=${encodeURIComponent(q)}`);
      (s2.items||[]).forEach(i=>bump((i.snippet&&i.snippet.channelId)||(i.id&&i.id.channelId),3));
    }catch(e){}
  }
  return Object.entries(score).sort((a,b)=>b[1]-a[1]).map(e=>e[0]).slice(0,14);
}

async function buildCompetitor(id){
  try{
    const ch=await getChannel(id);
    const vids=await getVideos(await getUploads(ch.uploads,40));
    const shorts=vids.filter(v=>v.isShort),longs=vids.filter(v=>!v.isShort);
    const topShort=[...shorts].sort((a,b)=>b.viewsPerDay-a.viewsPerDay)[0];
    const topLong=[...longs].sort((a,b)=>b.viewsPerDay-a.viewsPerDay)[0];
    const freqPerWeek=vids.length? (vids.length/Math.max(1,(ageDays(vids[vids.length-1].published)/7))) : 0;
    return{ch,vids,shorts:shorts.length,longs:longs.length,topShort,topLong,
      avgViews:vids.length?vids.reduce((s,v)=>s+v.views,0)/vids.length:0,
      shortsShare:vids.length?shorts.length/vids.length:0,
      freqPerWeek:Math.round(freqPerWeek*10)/10};
  }catch(e){return null;}
}

/* ===================================================================== */
/*  MISTRAL                                                              */
/* ===================================================================== */
/* ===================================================================== */
/*  MISTRAL — МНОГОПРОХОДНЫЙ АНАЛИЗ (Фаза 1)                             */
/*  Меньше данных за один запрос -> выше фокус и стабильность JSON.       */
/*  Каждый проход = узкая задача + свой срез KB + компактный срез payload.*/
/*  Проходы A/B/C идут параллельно, затем синтез D. Результат собирается  */
/*  в тот же объект, что и одинарный callMistral (контракт рендера цел).  */
/* ===================================================================== */
async function _mistralPass(system,userContent,maxTokens,temp,model){
  const body={model:(model||MODEL_DEEP),temperature:(temp==null?0.45:temp),max_tokens:maxTokens,
    response_format:{type:"json_object"},
    messages:[{role:"system",content:system},{role:"user",content:userContent}]};
  let lastErr;
  for(let i=0;i<2;i++){ /* было 5 — вместе с ретраями fetch-обёртки давало зависание */
    try{
      const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),90000);
      const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:ctrl.signal,
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
        body:JSON.stringify(body)});
      clearTimeout(to);
      if(r.status===429||r.status>=500){lastErr=new Error("Viora AI занят ("+r.status+")");var ra=parseFloat(r.headers.get("retry-after"))||0;var wait=ra>0?ra*1000:Math.min(15000,1500*Math.pow(2,i));await sleep(wait+Math.random()*400);continue;}
      if(!r.ok)throw new Error("Viora AI error "+r.status);
      const d=await r.json();
      return vJsonParse(vClean(d.choices?.[0]?.message?.content||"{}"));
    }catch(e){lastErr=e;await sleep(Math.min(12000,1000*Math.pow(2,i))+Math.random()*300);}
  }
  throw lastErr||new Error("Viora AI недоступен");
}

/* срез сигналов под конкретную задачу — не гоняем весь объект в каждый проход */
function _sigPick(sig,keys){const o={};if(!sig)return o;keys.forEach(k=>{if(sig[k]!=null)o[k]=sig[k];});return o;}

const _AUD_RULE='Если задан audience_profile: уровень "new" (НОВИЧОК) — пиши простым человеческим языком, как для друга, без жаргона и англицизмов (если термин необходим — тут же поясни в скобках одним-двумя словами); НЕ вали всё сразу: дай 2-3 первоочередных шага и пометь их как «сделай первым»; формулируй советы как пошаговую инструкцию «бери и делай», и к каждой рекомендации добавляй короткий готовый пример (заголовок/фраза хука/идея превью). "pro" — пиши плотно, без азов. Контекст "fresh" — упор на скорость выхода и тренды; "expert" — глубина пользы и SEO; "mixed" — баланс. Если профиль не задан — пиши нейтрально. ВАЖНО: пиши обычным человеческим текстом БЕЗ markdown-разметки — не используй символы ** * # _ и обратные кавычки, выделяй мысль словами, а не звёздочками.';

/* ПРОХОД A — УПАКОВКУ: заголовки + превью */
async function _passPackaging(payload){
  const sys='Ты — Viora AI, элитный YouTube-продюсер ($500/час). Разбери УПАКОВКУ канала (заголовки + превью) по РЕАЛЬНЫМ данным. Правила: никакой воды и общих фраз; каждая мысль — с конкретной цифрой и названием ролика; сравнивай ролик с МЕДИАНОЙ канала, а не с абсолютом; для каждого провала дай 3 ПЕРЕПИСАННЫХ заголовка по ВИСП (разные по подходу, готовые к публикации) и идею превью с конкретной ТЕХНИКОЙ превью, эмоцией и тёплым цветом под ЦА. Опирайся на signals.titleTechniques (какие приёмы дают хиты на этом канале), signals.vispCoverage, signals.numbersInTitle, signals.titleLen и titleTriggers (liftVsRest — во сколько раз ролики с триггером набирают больше). Хвали используемые приёмы и предлагай недозакрытые буквы ВИСП. '+_AUD_RULE+' Верни СТРОГО валидный JSON по схеме, без markdown.\n'+kbFor('titles');
  const schema='Схема ответа: {"title_patterns":["3-5 закономерностей заголовков хитов VS провалов, с цифрами"],"hits_reasons":[{"videoId":"","reason":"почему залетело — что в заголовке/теме сработало, во сколько раз выше медианы"}],"flops_reasons":[{"videoId":"","reason":"конкретный диагноз","rewrites":["3 переписанных заголовка по ВИСП"],"thumb_idea":"конкретная техника превью + эмоция + цвет"}]}';
  // для упаковки нужны только заголовочные поля — режем лайки/теги/длительность
  const tslim=v=>({videoId:v.videoId,title:v.title,viewsPerDay:v.viewsPerDay,xMedian:v.xMedian,titleLen:v.titleLen,hasNumber:v.hasNumber,hasQuestion:v.hasQuestion,hasEmoji:v.hasEmoji});
  const slice={
    audience_profile:payload.audience_profile,
    channel:{title:payload.channel.title},
    signals:_sigPick(payload.signals,['titleLen','numbersInTitle','titleTechniques','vispCoverage','capsHeavyTitlesPct']),
    titleTriggers:payload.titleTriggers,
    shorts:{median_vpd:payload.shorts.median_vpd,hits:(payload.shorts.hits||[]).map(tslim),flops:(payload.shorts.flops||[]).map(tslim)},
    longform:{median_vpd:payload.longform.median_vpd,hits:(payload.longform.hits||[]).map(tslim),flops:(payload.longform.flops||[]).map(tslim)}
  };
  return _mistralPass(sys+'\n\n'+schema,'Разбери упаковку этого канала конкретно и по цифрам:\n'+JSON.stringify(slice),2200,0.45,MODEL_FAST);
}

/* ПРОХОД B — СТРАТЕГИЮ ФОРМАТОВ: Shorts vs длинные, баланс, регулярность, тренд */
async function _passFormats(payload){
  const sys='Ты — Viora AI, YouTube-продюсер. Разбери СТРАТЕГИЮ ФОРМАТОВ канала (Shorts vs длинные, баланс сил, регулярность, тренд свежих vs старых) по РЕАЛЬНЫМ данным. Каждая мысль — с цифрой из signals.formatBalance, signals.shortsDuration, signals.trend, signals.posting. Помни воронку (на 8 роликов: 5 хайп + 2 экспертных + 1 продающее), 3 типа видео и параметры Shorts (идеал ~30 сек). hit_formula — повторяемая формула хита ИМЕННО этого канала как чек-лист. '+_AUD_RULE+' Верни СТРОГО валидный JSON, без markdown.\n'+kbPick(['funnel','videoTypes','shorts','hunt','retentionTable','retentionHacks']);
  const schema='Схема ответа: {"shorts_insights":"3-5 предложений с цифрами: что работает в Shorts, что нет, что делать","longform_insights":"3-5 предложений с цифрами по длинным роликам","hit_formula":["3-5 пунктов — повторяемая формула хита этого канала как чек-лист"]}';
  const slice={
    audience_profile:payload.audience_profile,
    channel:payload.channel,
    signals:_sigPick(payload.signals,['posting','trend','formatBalance','shortsDuration','bestWindow']),
    shorts:{count:payload.shorts.count,median_vpd:payload.shorts.median_vpd,hits:(payload.shorts.hits||[]).slice(0,4)},
    longform:{count:payload.longform.count,median_vpd:payload.longform.median_vpd,hits:(payload.longform.hits||[]).slice(0,4)}
  };
  return _mistralPass(sys+'\n\n'+schema,'Разбери стратегию форматов этого канала по цифрам:\n'+JSON.stringify(slice),1800,0.45,MODEL_FAST);
}

/* ПРОХОД C — РУБРИКИ И КОНКУРЕНТЫ: темы, идеи на основе чужих хитов */
async function _passTopics(payload){
  const sys='Ты — Viora AI, YouTube-продюсер. Разбери РУБРИКИ И КОНКУРЕНТОВ канала. Для КАЖДОЙ рубрики из topics дай человеческий вывод по образцу: «про X в среднем столько-то просм/день, про Y меньше — аудитории интереснее X». Затем ОБЯЗАТЕЛЬНО используй данные конкурентов (их topShorts/topLongs): предложи автору конкретные идеи на основе ЧУЖИХ хитов — «у конкурента X видео про Y набрало Z — сними свою версию про …». Это самое ценное. Идеи в content_ideas — те, которых у автора ЕЩЁ НЕТ. Каждая мысль с цифрой и именем. '+_AUD_RULE+' Верни СТРОГО валидный JSON, без markdown.\n'+kbPick(['goldenTopics','videoTypes','preview','visp','comments']);
  const schema='Схема ответа: {"topics":[{"name":"рубрика","verdict":"up|down|mid","note":"вывод с цифрой средних просм/день"}],"topic_conclusion":"2-4 предложения: на какую тему делать ставку, с цифрами","next_videos":[{"idea":"идея ролика","title":"готовый заголовок","format":"Shorts|Длинное","why":"почему зайдёт по данным","based_on":"свой хит или хит конкурента (название)","expected":"порядок просмотров"}],"content_ideas":[{"topic":"тема, которой у автора ещё нет","source":"имя конкурента + название видео + сколько набрало","why_works":"почему работает","your_angle":"как адаптировать под канал","format":"Shorts|Длинное"}],"competitor_takeaways":["конкретные приёмы конкурентов, которых нет у канала"],"versus":[{"name":"имя конкурента","insight":"чем обгоняет и что перенять, с цифрами"}]}';
  const slice={
    audience_profile:payload.audience_profile,
    channel:{title:payload.channel.title,subscribers:payload.channel.subscribers},
    topics:payload.topics,
    competitors:payload.competitors
  };
  return _mistralPass(sys+'\n\n'+schema,'Разбери рубрики и конкурентов этого канала, дай идеи на основе чужих хитов:\n'+JSON.stringify(slice),2400,0.5,MODEL_FAST);
}

/* ПРОХОД D — ФИНАЛЬНЫЙ СИНТЕЗ: главная утечка, скор, эмоции, триггеры, план */
async function _passSynthesis(payload,A,B,C){
  const sys='Ты — Viora AI, главный продюсер. Сделай ФИНАЛЬНЫЙ СИНТЕЗ ра��б��ра канала: на основе сигналов и выводов прошлых проходов сформулируй ГЛАВНУЮ УТЕЧКУ роста (1-2 предложения с цифрами), общий скор 0-100 и его разбивку, список конкретных изменений и план действий по неделям. Включай только выводы, которые ведут к действию; наблюдения без действия отбрасывай. Никакой воды, только цифры и конкретика этого канала. ФОРМАТ СОВЕТА: ЧТО изменить -> ПОЧЕМУ (со ссылкой на методику и цифру) -> ЭФФЕКТ в цифрах -> ПРИМЕР. '+_AUD_RULE+' Верни СТРОГО валидный JSON, без markdown.\n'+kbPick(['visp','hunt','funnel','scenarioErrors','scenarioCubes','mission','benefit','comments']);
  const schema='Схема ответа: {"main_leak":"1-2 предложения: самый большой ограничитель роста этого канала, с опорой на цифры","leak_tag":"короткий тег проблемы, 2-4 слова","score":"число 0-100","score_breakdown":[{"factor":"Вовлечённость","value":0},{"factor":"Регулярность","value":0},{"factor":"Доля хитов","value":0},{"factor":"Упаковка","value":0}],"concrete_changes":[{"change":"действие без воды","target":"ролик/рубрика","effect":"эффект в цифрах","priority":"high|medium|low"}],"action_plan":[{"step":"задача с деталями","why":"эффект в цифрах","priority":"high|medium|low","week":1}]}';
  const brief={
    audience_profile:payload.audience_profile,
    channel:payload.channel,
    signals:payload.signals,
    topics_brief:(payload.topics||[]).map(t=>({name:t.name,verdict:t.verdict,medianViewsPerDay:t.medianViewsPerDay})),
    from_packaging:{title_patterns:(A&&A.title_patterns)||[]},
    from_formats:{hit_formula:(B&&B.hit_formula)||[],shorts_insights:(B&&B.shorts_insights)||'',longform_insights:(B&&B.longform_insights)||''},
    from_topics:{topic_conclusion:(C&&C.topic_conclusion)||''}
  };
  return _mistralPass(sys+'\n\n'+schema,'Сведи всё в финальный вердикт по этому каналу:\n'+JSON.stringify(brief),2600,0.4,MODEL_DEEP);
}

/* ОРКЕСТРАТОР: A/B/C параллельно -> D. Частичные сбои не валят разбор — */
/* рендер сам подставит локальные фолбэки для недостающих полей.          */
/* Валидация ответа AI: кривой JSON больше не ломает блоки дашборда молча.
   Приводим все поля к ожидаемым типам, мусор отбрасываем. */
function validateAudit(a){
  if(!a||typeof a!=='object')return null;
  const S=x=>typeof x==='string'?x:(x==null?'':(typeof x==='object'?'':String(x)));
  const A=x=>Array.isArray(x)?x.filter(i=>i!=null):[];
  const out=Object.assign({},a);
  out.main_leak=S(a.main_leak);
  out.leak_tag=S(a.leak_tag);
  if(a.score!=null){const n=parseFloat(a.score);out.score=isFinite(n)?Math.max(0,Math.min(100,n)):null;}
  out.score_breakdown=A(a.score_breakdown).filter(x=>x&&typeof x==='object'&&x.factor!=null)
    .map(x=>({factor:S(x.factor),value:Math.max(0,Math.min(100,parseFloat(x.value)||0))}));
  ['title_patterns','hit_formula','competitor_takeaways'].forEach(k=>{out[k]=A(a[k]).map(S).filter(Boolean);});
  ['hits_reasons','flops_reasons','topics','next_videos','content_ideas','versus','action_plan','concrete_changes'].forEach(k=>{out[k]=A(a[k]).filter(x=>x&&typeof x==='object');});
  /* мусорные поля старых разборов вычищаем — только качественная польза */
  delete out.emotional_profile; delete out.triggers; delete out.roadmap_story;
  return out;
}

async function callMistralMultipass(payload){
  const [A,B,C]=await Promise.all([
    _passPackaging(payload).catch(e=>{console.warn('passA(packaging) failed',e);return {};}),
    _passFormats(payload).catch(e=>{console.warn('passB(formats) failed',e);return {};}),
    _passTopics(payload).catch(e=>{console.warn('passC(topics) failed',e);return {};})
  ]);
  let D={};
  try{ D=await _passSynthesis(payload,A,B,C); }catch(e){ console.warn('passD(synthesis) failed',e); }
  const merged=Object.assign({},A,B,C,D);
  if(!Object.keys(merged).length) throw new Error('multipass: все проходы пусты');
  merged._multipass=true;
  // Прогоняем результат мультипасса через «Критик» — как и одинарный разбор.
  try{ return await criticAudit(merged,payload); }catch(e){ console.warn('critic(multipass) failed',e); return merged; }
}

async function callMistral(payload){
  const sys=`Ты — Viora AI, элитный консультант по росту YouTube-��аналов с 10-летним опытом. Ты анализируешь РЕАЛЬНЫЕ данные канала и даёшь жёсткий, конкретный, прикладной разбор — как платный консультант за $500/час, а не как обобщённый бот.

ЖЕЛЕЗНЫЕ ПРАВИЛА:
1. НИКАКОЙ воды и общих фраз ("делайте качественный контент", "улучшите превью"). Каждое утверждение должно опираться на КОНКРЕТНЫЕ цифры и названия роликов из данных.
2. Всегда называй конкретные ролики по их заголовкам и приводи числа (просмотры, просм/день, вовлечённость, во сколько раз выше/ниже медианы).
3. Советы — готовые к применению: не "сделай цепляющий заголовок", а конкретный переписанный заголовок под этот ролик.
4. Сравнивай ролик с МЕДИАНОЙ КАНАЛА, а не с абсолютными числами. Маленький канал с 2К просмотров может иметь хит, если медиана 500. У каждого ролика есть поле xCohort — во сколько раз он обгоняет ролики СВОЕГО ВОЗРАСТА на канале (просмотры/день у свежих видео всегда выше, xCohort эту погрешность убирает). При оценке «залетело/не зашло» опирайся в ПЕРВУЮ очередь на xCohort, а не на сырые просмотры/день.
5. Пиши простым человеческим русским, но как эксперт — уверенно и по делу. НИКОГДА не используй сырые сокращения, англицизмы и коды полей (VPD, CTR, CTA, engagement, engagementPct, longs, longform, retention, xr). Вместо них пиши по-русски: «просмотров в день», «кликабельность превью», «призыв к действию», «вовлечённость», «длинные ролики», «короткие ролики», «досматриваемость». Любой профессиональный термин (вовлечённость, медиана, хук, удержание, превью, ВИСП) при первом упоминании коротко расшифровывай простыми словами в скобках.
6. Возвращай СТРОГО валидный JSON по схеме, без markdown, без пояснений вокруг.
7. ОБЯЗАТЕЛЬНО используй данные конкурентов: смотри, какие темы и форматы залетают у похожих каналов (их topShorts/topLongs), и предлагай автору конкретные идеи на основе ЧУЖИХ хитов — «у конкурента X видео про Y набрало Z — сними свою версию про …». Это самое ценное в разборе.
8. ОБЯЗАТЕЛЬНО опирайся на блок "signals" (расчётные сигналы): регулярность постинга, разницу длины заголовков у хитов и провалов, долю цифр в заголовках, тренд просмотров и вовлечённости (свежие vs старые ролики), баланс форматов. Это твоя доказательная база — main_leak и title_patterns должны прямо ссылаться на эти числа, а не на догадки. Также используй payload.titleTriggers (для каждого триггера заголовка посчитано liftVsRest — во сколько раз ролики с ним набирают больше остальных): ссылайся на самые сильные триггеры по имени и числам в title_patterns, triggers и concrete_changes, и предложи усилить недоиспользованные.
9. ОБЯЗАТЕЛЬНО заполни topic_conclusion, topics и concrete_changes. Для КАЖДОЙ рубрики из payload.topics дай человеческий вывод по образцу: «про X в среднем столько-то просм/день, про Y меньше — аудитории интереснее X». Дай 4-7 КОНКРЕТНЫХ изменений без воды — что именно поменять, в каком ролике/рубрике и какой эффект в цифрах ждать.
11. ФОРМАТ КАЖДОГО СОВЕТА (ради ясности): строй его по схеме ЧТО изменить → ПОЧЕМУ (со ссылкой на методику и конкретную цифру канала) → ЭФФЕКТ в цифрах → ПРИМЕР (готовый заголовок / кубик сценария / идея превью). Никаких абстракций без примера.
12. ГОВОРИ ПОНЯТИЯМИ МЕТОДИКИ ПО ИМЕНАМ: называй технику превью (ошибки / нельзя / до-после / «стоит ли» / стоимость / год…), ступень Лестницы Ханта, тип видео (хайп / экспертное / продающее), кубик сценарной башни (красный=проблема, оранжевый=усугубление, зелёный=решение…), параметр шортса. Заголовки и хуки оценивай по ВИСП. В thumb_idea всегда указывай конкретную технику превью + тёплый цвет под ЦА. Для Shorts помни про длину ~30 сек и 6 параметров. Опирайся на signals.titleTechniques (какие приёмы заголовков реально дают хиты на ЭТОМ канале) — хвали используемые и предлагай недостающие.

13. ПОДСТРОЙСЯ ПОД ПРОФИЛЬ АВТОРА (payload.audience_profile, если задан). Уровень "new" (новичок): объясняй проще, без жаргона, давай чуть больше контекста и НЕ вали всё сразу — выдели 2-3 самых важных шага и пометь их как первоочередные. Уровень "pro" (опытный): пиши плотно, без азов и базовых объяснений. Контекст "fresh" (свежак/тренды): упор на скорость выхода, попадание в актуальные инфоповоды и окно постинга — такой контент быстро устаревает. Контекст "expert" (вечнозелёное): упор на глубину пользы, SEO-запросы и переупаковку "золотых тем", время выхода вторично. Контекст "mixed": баланс того и другого. Если профиль не задан — пиши нейтрально, без предположений об уровне автора.

${kbFor('audit')}`;
  const schema=`Схема ответа (заполни ВСЕ поля содержательно, на основе данных):
{
 "main_leak": "1-2 предложения: самый большой ограничитель роста ИМЕННО этого канала, с опорой на цифры. Например: 'Твои Shorts дают в 12 раз больше просмотров/день, чем длинные (340 против 28), но ты тратишь 80% усилий на длинные — главная утечка в неправильном распределении сил.'",
 "leak_tag": "короткий тег проблемы, 2-4 слова",
 "score": "число 0-100 — общий скор канала (учитывай вовлечённость, регулярность, долю хитов, баланс форматов)",
 "score_breakdown": [{"factor":"Вовлечённость","value":0},{"factor":"Регулярность","value":0},{"factor":"Доля хитов","value":0},{"factor":"Упаковка","value":0}],
 "hits_reasons":[{"videoId":"","reason":"ПОЧЕМУ залетело — конкретно: что в заголовке/теме/тайминге сработало. С цифрами (во сколько раз выше медианы)."}],
 "flops_reasons":[{"videoId":"","reason":"Почему не зашло — конкретный диагноз","rewrites":["3 ПЕРЕПИСАННЫХ заголовка под этот ролик — готовых к публикации, разных по подходу"],"thumb_idea":"Конкретная идея превью: что в кадре, эмоция, текст, цвет"}],
 "shorts_insights":"3-5 предложений: глубокий разбор Shorts-стратегии канала с цифрами. Что работает, что нет, что делать.",
 "longform_insights":"3-5 предложений: глубокий разбор длинных роликов с цифрами.",
 "title_patterns":["3-5 конкретных закономерностей в заголовках хитов VS провалов, с цифрами. Например: 'Хиты в среднем 52 символа, пров��лы 78 — длинные заголовки режут просмотры'"],
 "hit_formula":["3-5 пунктов — повторяемая формула хита этого канала как чек-лист"],
 "topics":[{"name":"рубрика/тема","verdict":"up|down|mid","note":"вывод с цифрой: средние просм/день по теме"}],
 "next_videos":[{"idea":"конкретная идея следующего ролика","title":"готовый заголовок","format":"Shorts|Длинное","why":"почему зайдёт — на основе данных","based_on":"на чём основано: свой хит или хит конкурента (название)","expected":"ожидаемый порядок просмотров"}],
 "content_ideas":[{"topic":"тема/идея ролика, которой у автора ЕЩЁ НЕТ, но которая залетает у конкурентов","source":"имя конкурента + название его залетевшего видео + сколько набрало","why_works":"почему эта тема/формат работает","your_angle":"как адаптировать под эт��т канал — конкретно","format":"Shorts|Длинное"}],
 "competitor_takeaways":["конкретные приёмы конкурентов, которых нет у канала"],
 "versus":[{"name":"имя конкурента","insight":"чем обгоняет и что именно перенять — с цифрами"}],
 "action_plan":[{"step":"конкретная задача с деталями","why":"ожидаемый эффект в цифрах","priority":"high|medium|low","week":1}],
 "topic_conclusion":"2-4 предложения: главный вывод по рубрикам — какая тема реально интересна аудитории этого канала и на что делать ставку, с конкретными цифрами просм/день по темам",
 "concrete_changes":[{"change":"одно конкретное действие без воды","target":"какой ролик или рубрика","effect":"ожидаемый эффект в цифрах","priority":"high|medium|low"}]
}`;
  const body={
    model:MODEL_DEEP,
    temperature:0.45,
    max_tokens:6000,
    response_format:{type:"json_object"},
    messages:[
      {role:"system",content:sys+"\n\n"+schema},
      {role:"user",content:"Проанализируй этот канал максимально глубоко и конкретно. Дай разбор, который реально изменит результаты автора:\n"+JSON.stringify(payload)}
    ]
  };
  let lastErr;
  for(let i=0;i<2;i++){ /* было 5 — это fallback-путь, долгие ретраи здесь недопустимы */
    try{
      const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),110000);
      const r=await fetch("https://api.mistral.ai/v1/chat/completions",{
        method:"POST",signal:ctrl.signal,
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
        body:JSON.stringify(body)
      });
      clearTimeout(to);
      if(r.status===429||r.status>=500){lastErr=new Error("Viora AI занят ("+r.status+")");var ra=parseFloat(r.headers.get("retry-after"))||0;var wait=ra>0?ra*1000:Math.min(15000,1500*Math.pow(2,i));await sleep(wait+Math.random()*400);continue;}
      if(!r.ok)throw new Error("Viora AI error "+r.status);
      const d=await r.json();
      const txt=vClean(d.choices?.[0]?.message?.content||"{}");
      return await criticAudit(vJsonParse(txt),payload);
    }catch(e){lastErr=e;await sleep(Math.min(12000,1000*Math.pow(2,i))+Math.random()*300);}
  }
  throw lastErr||new Error("Viora AI недоступен");
}

async function criticAudit(audit,payload){
  try{
    if(!audit||typeof audit!=='object')return audit;
    const fields=['main_leak','leak_tag','shorts_insights','longform_insights','title_patterns','concrete_changes','next_videos','action_plan'];
    const draft={};fields.forEach(f=>{if(audit[f]!=null)draft[f]=audit[f];});
    if(!Object.keys(draft).length)return audit;
    const signals=(payload&&payload.signals)?payload.signals:{};
    const titleTriggers=(payload&&payload.titleTriggers)?payload.titleTriggers:[];
    const topics=(payload&&payload.topics)?payload.topics:[];
    const sys='Ты — строгий шеф-редактор продюсерской студии («Критик»). Возьми ЧЕРНОВИК разбора YouTube-канала и сделай его жёстче и конкретнее. Правила: убери воду и общие фразы; в каждом пункте должна быть КОНКРЕТНАЯ цифра канала (из signals/topics/titleTriggers) и готовый пример (переписанный заголовок / кубик сценария / идея превью); сохрани исходную структуру и ключи JSON; ничего не выдумывай сверх данных. Верни СТРОГО валидный JSON ровно с теми же ключами, что в черновике, без markdown и пояснений.'+kbFor('audit');
    const user='ЧЕРНОВИК:\n'+JSON.stringify(draft)+'\n\nДАННЫЕ/СИГНАЛЫ (опирайся ТОЛЬКО на них):\n'+JSON.stringify({signals,titleTriggers,topics});
    const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),60000);
    const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_DEEP,temperature:0.3,max_tokens:3000,response_format:{type:"json_object"},
        messages:[{role:"system",content:sys},{role:"user",content:user}]})});
    clearTimeout(to);
    if(!r.ok)return audit;
    const d=await r.json();
    const refined=vJsonParse(vClean(d.choices?.[0]?.message?.content||"{}"));
    if(refined&&typeof refined==='object'){
      fields.forEach(f=>{const v=refined[f];const empty=(v==null)||(Array.isArray(v)&&v.length===0)||(typeof v==='string'&&!v.trim());if(!empty)audit[f]=v;});
      audit._refined=true;
    }
    return audit;
  }catch(e){return audit;}
}

function computeSignals(groups){
  const all=[...STATE.shorts,...STATE.longs,...(STATE.streams||[])];
  const sig={};
  // posting consistency: median gap between uploads (days) + coefficient of variation
  const dates=all.map(v=>new Date(v.published).getTime()).sort((a,b)=>a-b);
  const gaps=[];for(let i=1;i<dates.length;i++)gaps.push((dates[i]-dates[i-1])/864e5);
  const medGap=gaps.length?median(gaps):0;
  const avgGap=gaps.length?gaps.reduce((s,g)=>s+g,0)/gaps.length:0;
  const gapCV=avgGap?(Math.sqrt(gaps.reduce((s,g)=>s+(g-avgGap)**2,0)/gaps.length)/avgGap):0;
  sig.posting={medianGapDays:+medGap.toFixed(1),consistency:gapCV<0.5?'высокая':gapCV<1?'средняя':'низкая (рваный график)'};
  // title length: hits vs flops
  const tl=g=>g.length?g.reduce((s,v)=>s+v.title.length,0)/g.length:0;
  const allHits=[...groups.shorts.hits,...groups.longs.hits];
  const allFlops=[...groups.shorts.flops,...groups.longs.flops];
  sig.titleLen={hits:Math.round(tl(allHits)),flops:Math.round(tl(allFlops))};
  // number/question usage in hits vs flops
  const pct=(g,re)=>g.length?Math.round(g.filter(v=>re.test(v.title)).length/g.length*100):0;
  sig.numbersInTitle={hitsPct:pct(allHits,/\d/),flopsPct:pct(allFlops,/\d/)};
  // engagement trend: recent third vs older third
  const byDate=[...all].sort((a,b)=>new Date(a.published)-new Date(b.published));
  const third=Math.max(1,Math.floor(byDate.length/3));
  const early=byDate.slice(0,third),recent=byDate.slice(-third);
  const eng=g=>g.length?g.reduce((s,v)=>s+v.engagement,0)/g.length:0;
  const vpd=g=>g.length?g.reduce((s,v)=>s+v.viewsPerDay,0)/g.length:0;
  sig.trend={earlyVpd:Math.round(vpd(early)),recentVpd:Math.round(vpd(recent)),
    deltaPct:vpd(early)?Math.round((vpd(recent)/vpd(early)-1)*100):0,
    engEarlyPct:+(eng(early)*100).toFixed(2),engRecentPct:+(eng(recent)*100).toFixed(2)};
  // format balance vs performance
  sig.formatBalance={shortsCount:STATE.shorts.length,longsCount:STATE.longs.length,streamsCount:(STATE.streams||[]).length,
    shortsMedianVpd:Math.round(groups.shorts.med),longsMedianVpd:Math.round(groups.longs.med),streamsMedianVpd:Math.round((groups.streams&&groups.streams.med)||0)};
  if((STATE.streams||[]).length){sig.streams={count:STATE.streams.length,medianVpd:Math.round((groups.streams&&groups.streams.med)||0),note:'Это записи прямых эфиров/стримов — у них другая механика: их смотрят дольше, но просмотров в день обычно меньше, чем у обычных роликов. Разбирай и оценивай их ОТДЕЛЬНО, не сравнивай напрямую с длинными роликами и не считай слабыми из-за низких просмотров в день.'};}
  // приёмы упаковки в заголовках (методика Велижанина) — для глубины разбора упаковки
  const techRe={'«Как»-заголовок (~8× просмотров)':/как /i,'Ошибки':/ошибк|зря|неправильно/i,'Запрет (нельзя/НЕ)':/нельзя|никогда|не делай|хватит|перестан/i,'Топ-список (число)':/(^|\s)\d+\s|топ[\s-]?\d/i,'Год/актуальность':/20\d{2}|тренд/i,'Вопрос (?/ли)':/ ли |\?/i,'Самый/лучший':/самы|лучш/i,'До/после':/до и после|было.*стало/i};
  sig.titleTechniques=Object.keys(techRe).map(name=>{const re=techRe[name];return{technique:name,inHits:allHits.filter(v=>re.test(v.title)).length,inFlops:allFlops.filter(v=>re.test(v.title)).length,totalUses:all.filter(v=>re.test(v.title)).length};}).filter(x=>x.totalUses>0).sort((a,b)=>b.inHits-a.inHits);
  const capsCnt=all.filter(v=>{const c=v.title.replace(/[^А-ЯA-Z]/g,'').length,l=v.title.replace(/[^а-яa-z]/g,'').length;return c>l&&v.title.length>6;}).length;
  sig.capsHeavyTitlesPct=all.length?Math.round(capsCnt/all.length*100):0;
  if(STATE.shorts.length){const durs=STATE.shorts.map(v=>v.dur).filter(d=>d>0);const md=durs.length?median(durs):0;sig.shortsDuration={medianSec:Math.round(md),over45sPct:durs.length?Math.round(durs.filter(d=>d>45).length/durs.length*100):0,ideal:'~30 сек'};}
  // ВИСП-покрытие заголовков: хиты vs провалы + самые недозакрытые буквы (детерминированно)
  try{
    const _vc=g=>g.length?+(g.reduce((s,v)=>s+vispScore(v.title).hit.length,0)/g.length).toFixed(2):0;
    const _miss={'В':0,'И':0,'С':0,'П':0};
    allFlops.forEach(v=>vispScore(v.title).miss.forEach(L=>{_miss[L.k]=(_miss[L.k]||0)+1;}));
    const _ln={'В':'Выгода','И':'Интрига','С':'Срочность','П':'Причастность'};
    const _top=Object.keys(_miss).sort((a,b)=>_miss[b]-_miss[a]).slice(0,2).map(k=>_ln[k]);
    sig.vispCoverage={hitsAvgLetters:_vc(allHits),flopsAvgLetters:_vc(allFlops),mostMissedInFlops:_top,maxLetters:4};
  }catch(e){}
  // лучшее окно публикации по хитам канала (детерминированно)
  try{
    if(allHits.length){
      const _dn=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],_dc={},_hc={};
      allHits.forEach(v=>{if(v.dow!=null)_dc[v.dow]=(_dc[v.dow]||0)+1;const _hb=Math.floor((v.hour||0)/3)*3;_hc[_hb]=(_hc[_hb]||0)+1;});
      const _bd=Object.keys(_dc).sort((a,b)=>_dc[b]-_dc[a])[0];
      const _bh=Object.keys(_hc).sort((a,b)=>_hc[b]-_hc[a])[0];
      sig.bestWindow={day:_bd!=null?_dn[_bd]:null,hourRange:_bh!=null?(_bh+'–'+(+_bh+3)+' ч'):null,src:'own',note:'окно, в которое выходили хиты канала'};
    }
  }catch(e){}
  // мало своих данных → берём окно хитов НИШИ: когда публикуют похожие каналы (детерминированно)
  try{
    const _ownN=allHits.length+allFlops.length;
    if((!sig.bestWindow||!sig.bestWindow.day||_ownN<6)&&Array.isArray(competitors)&&competitors.length){
      const _nv=[];
      competitors.forEach(c=>{
        const vs=((c&&c.vids)||[]).filter(v=>v&&v.dow!=null&&v.hour!=null&&isFinite(v.viewsPerDay));
        if(vs.length<3)return;
        const _md=median(vs.map(v=>v.viewsPerDay))||1;
        vs.forEach(v=>_nv.push({dow:v.dow,hour:v.hour,viewsPerDay:v.viewsPerDay/_md}));
      });
      const _nbw=bestPostingWindow(_nv);
      if(_nbw&&_nbw.winBest){
        sig.bestWindow={day:_nbw.winBest.day,hourRange:_nbw.winBest.time,src:'niche',sample:_nv.length,
          note:'окно, в которое выходят хиты похожих каналов ниши — у канала пока мало своих публикаций'};
      }
    }
  }catch(e){}
  return sig;
}

/* ===================================================================== */
/*  ПРОФИЛЬ АВТОРА + ОПРОСНИК (Этап 3) + ОКНО ПОСТИНГА (Этап 4)          */
/* ===================================================================== */
const PROFILE_KEY='viora_profile_v1';
let PROFILE=(function(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');}catch(e){return null;}})();
function saveProfile(p){PROFILE=p;try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));}catch(e){}}
function profileLevelLabel(){return PROFILE?(PROFILE.level==='new'?'🐣 Новичок':'🚀 Опытный'):'❓ Профиль не задан';}
function profileCtxLabel(){if(!PROFILE)return '';return PROFILE.context==='fresh'?'🔥 Свежак / тренды':PROFILE.context==='expert'?'🌲 Вечнозелёное':PROFILE.context==='mixed'?'🔀 Смешанное':'';}
function openProfileQuiz(){
  closeProfileQuiz();
  var p=PROFILE||{level:'',context:'',goal:''};
  var draft={level:p.level||'',context:p.context||'',goal:p.goal||''};
  var ov=document.createElement('div');
  ov.id='profileQuiz';
  ov.setAttribute('style','position:fixed;inset:0;z-index:140;background:rgba(8,7,10,.74);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px');
  function opt(group,val,emoji,title,desc){var sel=draft[group]===val;return '<button type="button" class="pq-opt'+(sel?' on':'')+'" data-g="'+group+'" data-v="'+val+'" style="text-align:left;border:1px solid '+(sel?'#ff2d55':'var(--card-brd)')+';background:'+(sel?'rgba(255,45,85,.12)':'rgba(255,255,255,.03)')+';color:#eaf1f8;border-radius:13px;padding:13px 15px;cursor:pointer;display:flex;gap:11px;align-items:flex-start;transition:.15s;width:100%;font-family:inherit"><span style="font-size:20px;line-height:1">'+emoji+'</span><span><span style="display:block;font-weight:700;font-size:14.5px">'+title+'</span><span style="display:block;font-size:12.5px;color:var(--muted);margin-top:2px">'+desc+'</span></span></button>';}
  function render(){
    ov.innerHTML='<div style="max-width:520px;width:100%;background:linear-gradient(180deg,#141118,#0e0c11);border:1px solid var(--card-brd);border-radius:20px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.6);max-height:92vh;overflow-y:auto">'
      +'<div style="font-family:Onest,sans-serif;font-weight:700;font-size:20px;color:#fff;margin-bottom:4px">Настроим Viora под тебя</div>'
      +'<div style="font-size:13px;color:var(--muted);margin-bottom:18px">2 быстрых вопроса — и разбор, советы и ИИ будут говорить на твоём языке.</div>'
      +'<div style="font-weight:700;font-size:13.5px;color:#cdd2d8;margin-bottom:9px">1. Какой у тебя опыт?</div>'
      +'<div style="display:grid;gap:8px;margin-bottom:18px">'+opt('level','new','🐣','Новичок','Только начинаю или роликов мало — объясняй проще')+opt('level','pro','🚀','Уже веду канал','Есть опыт — давай плотно, без азов')+'</div>'
      +'<div style="font-weight:700;font-size:13.5px;color:#cdd2d8;margin-bottom:9px">2. Какой у тебя контент?</div>'
      +'<div style="display:grid;gap:8px;margin-bottom:20px">'+opt('context','fresh','🔥','Свежак / тренды','Новости, инфоповоды — быстро устаревает')+opt('context','expert','🌲','Вечнозелёное','Экспертиза, польза — смотрят месяцами')+opt('context','mixed','🔀','И то, и то','Смешанный контент')+'</div>'
      +'<div style="display:flex;gap:10px;justify-content:flex-end;align-items:center">'
      +'<button type="button" class="btn ghost" id="pqSkip">Пропустить</button>'
      +'<button type="button" class="btn" id="pqSave">Сохранить профиль</button></div></div>';
    ov.querySelectorAll('.pq-opt').forEach(function(b){b.onclick=function(){draft[b.getAttribute('data-g')]=b.getAttribute('data-v');render();};});
    ov.querySelector('#pqSkip').onclick=function(){closeProfileQuiz(true);};
    ov.querySelector('#pqSave').onclick=function(){if(!draft.level)draft.level='new';if(!draft.context)draft.context='mixed';saveProfile(draft);try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}closeProfileQuiz();try{if(typeof STATE!=='undefined'&&STATE&&STATE.channel){renderProfileBanner();renderFormula();renderHeatmap();}}catch(e){}};
  }
  render();
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)closeProfileQuiz(true);});
}
function closeProfileQuiz(markSeen){var ov=document.getElementById('profileQuiz');if(ov)ov.remove();if(markSeen){try{localStorage.setItem('viora_quiz_seen','1');}catch(e){}}}
function renderProfileBanner(){
  var el=document.getElementById('profileBanner');if(!el)return;
  var pill='display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--card-brd);color:#eaf1f8';
  var head='<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">'
    +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="'+pill+'">'+profileLevelLabel()+'</span>'+(profileCtxLabel()?'<span style="'+pill+'">'+profileCtxLabel()+'</span>':'')+'<span style="color:var(--muted);font-size:12.5px">'+(PROFILE?'Под этот профиль подстроены советы и ИИ-разбор':'Задай профиль — и разбор станет точнее под тебя')+'</span></div>'
    +'<button class="btn ghost" type="button" onclick="openProfileQuiz()" style="padding:9px 16px;font-size:13.5px">⚙️ '+(PROFILE?'Изменить':'Настроить под себя')+'</button></div>';
  var guide='';
  if(PROFILE&&PROFILE.level==='new'){
    guide='<div class="card" style="margin-top:12px;border-color:rgba(255,45,85,.25)"><div style="font-weight:700;font-size:15px;color:#fff;margin-bottom:10px">🧭 С чего начать (для новичка)</div>'
      +'<div style="display:grid;gap:9px">'
      +'<div style="font-size:13.5px;color:#cdd2d8;line-height:1.5"><b style="color:#ff8aa0">1.</b> Прочитай блок <b>«Главная утечка роста»</b> сверху — это то, что сильнее всего мешает каналу прямо сейчас.</div>'
      +'<div style="font-size:13.5px;color:#cdd2d8;line-height:1.5"><b style="color:#ff8aa0">2.</b> Посмотри <b>«Твоя формула хита»</b> и <b>«Когда постить»</b> — повторяй эти черты и время выхода в новых роликах.</div>'
      +'<div style="font-size:13.5px;color:#cdd2d8;line-height:1.5"><b style="color:#ff8aa0">3.</b> Возьми 1-2 идеи из <b>«Идеи для следующих видео»</b> и собери ролик в разделе <b>«Продюсер ведёт»</b>.</div>'
      +'</div><div style="font-size:12px;color:var(--muted);margin-top:10px">Не пытайся внедрить всё сразу — начни с пункта 1.</div></div>';
  }
  el.style.display='block';el.innerHTML=head+guide;
}
function bestPostingWindow(list){
  list=(list||[]).filter(function(v){return v&&v.dow!=null&&v.hour!=null&&isFinite(v.viewsPerDay);});
  if(list.length<6)return null;
  var days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  var buckets=['ночью (0–6ч)','утром (6–9ч)','днём (9–12ч)','в обед (12–15ч)','днём (15–18ч)','вечером (18–21ч)','ночью (21–24ч)'];
  var bIdx=function(h){return h<6?0:h<9?1:h<12?2:h<15?3:h<18?4:h<21?5:6;};
  var dayAgg={},winAgg={};
  list.forEach(function(v){var d=(v.dow+6)%7,b=bIdx(v.hour);
    dayAgg[d]=dayAgg[d]||{s:0,n:0};dayAgg[d].s+=v.viewsPerDay;dayAgg[d].n++;
    var k=d+'_'+b;winAgg[k]=winAgg[k]||{s:0,n:0,d:d,b:b};winAgg[k].s+=v.viewsPerDay;winAgg[k].n++;});
  var dayArr=Object.keys(dayAgg).map(function(d){return{d:+d,avg:dayAgg[d].s/dayAgg[d].n,n:dayAgg[d].n};}).sort(function(a,b){return b.avg-a.avg;});
  var winArr=Object.keys(winAgg).map(function(k){return{d:winAgg[k].d,b:winAgg[k].b,avg:winAgg[k].s/winAgg[k].n,n:winAgg[k].n};});
  var winRel=winArr.filter(function(x){return x.n>=2;});
  var winBest=(winRel.length?winRel:winArr).sort(function(a,b){return b.avg-a.avg;})[0];
  var dayBest=dayArr[0];
  return{dayBest:dayBest?{day:days[dayBest.d],avg:dayBest.avg,n:dayBest.n}:null,winBest:winBest?{day:days[winBest.d],time:buckets[winBest.b],avg:winBest.avg,n:winBest.n}:null,enough:list.length>=12};
}
(function(){function _mq(){/* v-cleanup #1: авто-опрос сведён к единому онбордингу v16 — убран дубль profileQuiz/v3w. openProfileQuiz остаётся доступен вручную из профиля. */}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_mq);else _mq();})();

function buildMistralPayload(channel,groups,competitors){
  const slim=(v,med)=>({videoId:v.id,title:v.title,views:v.views,likes:v.likes,comments:v.comments,
    viewsPerDay:Math.round(v.viewsPerDay),
    ageDays:Math.round(v.age||0),
    xCohort:v.xc!=null?+v.xc.toFixed(2):null,
    xMedian:med?+(v.viewsPerDay/med).toFixed(1):null,
    engagementPct:+(v.engagement*100).toFixed(2),
    durationSec:v.dur,titleLen:v.title.length,
    hasNumber:/\d/.test(v.title),hasQuestion:v.title.includes('?'),
    hasEmoji:/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(v.title),
    dayOfWeek:["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][v.dow],hour:v.hour,
    tags:v.tags.slice(0,5)});
  return{
    audience_profile:(typeof PROFILE!=='undefined'&&PROFILE)?{level:PROFILE.level,context:PROFILE.context,goal:PROFILE.goal||''}:null,
    channel:{title:channel.title,description:(channel.desc||'').slice(0,300),
      subscribers:channel.subs,totalVideos:channel.videoCount,totalViews:channel.totalViews},
    signals:(STATE.signals=computeSignals(groups)),
    titleTriggers:(((typeof STATE!=="undefined"&&STATE.triggerStats)||[]).slice(0,12)).map(s=>({trigger:s.name,videosWithIt:s.count,sharePct:Math.round(s.share*100),liftVsRest:+s.lift.toFixed(2),verdict:s.verdict,bestExample:s.best?{title:s.best.title,viewsPerDay:Math.round(s.best.vpd)}:null})),
    topics:(STATE.topics||[]).map(t=>({name:t.name,count:t.count,sharePct:Math.round(t.share*100),medianViewsPerDay:Math.round(t.medVpd),avgViews:Math.round(t.avgViews),engagementPct:+(t.avgEng*100).toFixed(2),verdict:t.verdict,bestVideo:t.best&&{title:t.best.title,viewsPerDay:Math.round(t.best.viewsPerDay),views:t.best.views},worstVideo:t.worst&&{title:t.worst.title,viewsPerDay:Math.round(t.worst.viewsPerDay),views:t.worst.views}})),
    shorts:{
      count:STATE.shorts.length,
      median_vpd:Math.round(groups.shorts.med),
      hits:groups.shorts.hits.slice(0,6).map(v=>slim(v,groups.shorts.med)),
      flops:groups.shorts.flops.slice(0,6).map(v=>slim(v,groups.shorts.med))
    },
    longform:{
      count:STATE.longs.length,
      median_vpd:Math.round(groups.longs.med),
      hits:groups.longs.hits.slice(0,6).map(v=>slim(v,groups.longs.med)),
      flops:groups.longs.flops.slice(0,6).map(v=>slim(v,groups.longs.med))
    },
    streams:(STATE.streams&&STATE.streams.length)?{
      count:STATE.streams.length,
      median_vpd:Math.round((groups.streams&&groups.streams.med)||0),
      note:'Записи прямых эфиров/стримов. Оценивай ОТДЕЛЬНО от обычных роликов: у них своя механика (долгий просмотр, меньше просмотров в день). Не считай их провалами из-за низких просмотров в день и давай советы по стримам отдельно: анонс заранее, расписание, нарезки лучших моментов в Shorts и обычные ролики.',
      hits:groups.streams.hits.slice(0,4).map(v=>slim(v,groups.streams.med)),
      flops:groups.streams.flops.slice(0,4).map(v=>slim(v,groups.streams.med))
    }:null,
    competitors:competitors.map(c=>{
      const cs=c.vids.filter(v=>v.isShort).sort((a,b)=>b.viewsPerDay-a.viewsPerDay);
      const cl=c.vids.filter(v=>!v.isShort).sort((a,b)=>b.viewsPerDay-a.viewsPerDay);
      const slimC=v=>({title:v.title,viewsPerDay:Math.round(v.viewsPerDay),views:v.views});
      return{name:c.ch.title,subs:c.ch.subs,avgViews:Math.round(c.avgViews),
        shortsShare:+(c.shortsShare*100).toFixed(0),freqPerWeek:c.freqPerWeek,
        topShorts:cs.slice(0,3).map(slimC),
        topLongs:cl.slice(0,3).map(slimC)};
    })
  };
}

/* ===================================================================== */
/*  PIPELINE                                                             */
/* ===================================================================== */

/* ===== PRODUCER HQ: KB + функции ===== */
/* ===== БАЗА ЗНАНИЙ ПРОДЮСЕРА (извлечена из методички и эфиров) ===== */
const KB={
  visp:{name:'ВИСП',full:'Выгода · Интрига · Срочность · Причастность',
    letters:[
      {k:'В',name:'Выгода',desc:'что зритель получит',words:['как ','топ','способ','секрет','бесплатн','быстр','прост','инструкц','лайфхак','ошибк','правил','схема','чек-лист','за 5','за 10','без ']},
      {k:'И',name:'Интрига',desc:'недосказанность, гэп любопытства',words:['почему','что будет','правда о','никто не','на самом деле','шок','я не ожидал','вот что','скрыт','оказалось','что если','тайна','никогда не']},
      {k:'С',name:'Срочность',desc:'актуальность прямо сейчас',words:['2024','2025','2026','сейчас','новый','новая','уже','пока не','успей','тренд','обновлен','свеж','этот год','последн']},
      {k:'П',name:'Причастность',desc:'это про тебя и твою группу',words:['для новичк','если ты','твой','твоя','наш','для тех кто','новичкам','каждый','для начинающ','для себя','тебе']}
    ],
    note:'В одном заголовке (или в одном вопросе спикеру из-за кадра) старайся закрыть несколько букв ВИСП — но не повторяй одну и ту же букву дважды.'},
  hunt:{name:'Лестница Ханта',
    levels:[
      {n:1,title:'Всё ок',desc:'Проблемы нет или не осознаёт. Холодная массовая аудитория.',content:'Хайп, развлечение, широкие «золотые темы»',funnel:'Интересующийся'},
      {n:2,title:'Есть проблема — не знает о ней',desc:'Нужно вскрыть проблему.',content:'Разоблачения, «ты делаешь это неправильно»',funnel:'Интересующийся'},
      {n:3,title:'Знает о проблеме — не парит',desc:'Поднять важность и показать последствия.',content:'Истории последствий, сравнения «до/после»',funnel:'Думающий'},
      {n:4,title:'Парит — не знает как решить',desc:'Дать конкретный способ решения.',content:'Инструкции, разборы методов, экспертиза',funnel:'Думающий'},
      {n:5,title:'��нает как — не знает с кем',desc:'Показать, что решать стоит с тобой.',content:'Кейсы, отзывы, продающие видео',funnel:'Покупатель'}
    ],
    note:'Верх лестницы = много просмотров, мало продаж. Низ = мало просмотров, но деньги. Нужен баланс: шортсами с верхних уровней ведём аудиторию на нижние.'},
  funnel:{name:'Воронка просмотров',
    ratio:'Баланс на 8 роликов в месяц: 5 хайп + 2 экспертных + 1 продающее.',
    path:'познакомились → подружились → доверились → купили → дали отзыв',
    cats:[
      {name:'Интересующийся',why:'занять время, удовлетворить любопытство',need:'чтобы было интересно',hook:'уникальная подача'},
      {name:'Подписчик (думающий)',why:'получить ответ на конкретный вопрос',need:'чтобы вызывало доверие',hook:'нигде больше нет нужной информации'},
      {name:'Покупатель',why:'решить свою проблему чужими руками',need:'видеть, как проблема решается у других',hook:'ты — лучший на рынке'}
    ]},
  scenarioErrors:[
    {t:'Нет сценария',fix:'Пиши хотя бы тезисный план: вступление → логичные блоки → финал. Импровизация без опыта сливает удержание.'},
    {t:'Слабый заход (опенинг)',fix:'Первые 30 секунд решают всё. Бей в боль аудитории / создавай интригу «но это ещё не всё…» / шокируй фактом или ломай шаблон.'},
    {t:'Нет нормального CTA',fix:'Прямо проси действие и объясни выгоду: что изменится для зрителя, если он подпишется/досмотрит. Встраивай призыв в контекст, не как формальность.'},
    {t:'Выдал всю пользу сразу',fix:'Держи интригу, дозируй ценность, каждая минута добавляет что-то новое. Иначе незачем досматривать.'},
    {t:'Сложный, неестественный язык',fix:'Объясняй как пятилетнему, рассказывай через истории, говори естественно — не читай заученный текст по бумажке.'},
    {t:'Вода и растянутый хронометраж',fix:'Только суть. Если фраза не несёт смысла — вырезай. Не размазывай одну мысль на 3 минуты: короче, но мощнее.'},
    {t:'Нет динамики',fix:'Чередуй темп, делай смысловые паузы, добавляй крючки «самое важное дальше…», чтобы зритель не провалился в скуку.'}
  ],
  openings:{
    stat:'Все видео, которые набрали больше 100 тыс. просмотров, держат удержание в первые 30 секунд выше 60%.',
    avoid:'Не начинай с долгого нудного представления («меня зовут…, 7 лет опыта, автор книг…») — это сразу минус вайб. Представься плашкой или уже ПОСЛЕ цепляющего хука.',
    types:[
      {n:'Шок-факт / цифра',d:'Начни с неожиданной цифры или факта, который ломает ожидания зрителя.'},
      {n:'Боль зрителя',d:'Сразу назови проблему, которая реально задевает аудиторию — «ты теряешь просмотры, потому что…».'},
      {n:'Интрига-обещание',d:'Пообещай результат и намекни на секрет, но не раскрывай сразу: «в конце покажу приём, который…».'},
      {n:'Ломка шаблона / провокация',d:'Спорное утверждение против общепринятого мнения — заставляет досмотреть, чтобы поспорить.'},
      {n:'С места событий',d:'Влетай в действие без прелюдий — зритель попадает в гущу происходящего.'},
      {n:'Антипример «как не надо»',d:'Покажи типичную ошибку и пообещай, как сделать правильно.'},
      {n:'Результат вперёд (до/после)',d:'Покажи финальный результат в первые секунды, потом разбери путь к нему.'},
      {n:'Прямой вопрос-кр��чок',d:'Задай вопрос, на который зритель хочет узнать ответ — упакуй в него буквы ВИСП.'}
    ]},
  preview:{
    ctr:'Норма CTR (кликабельности) — 5–10% при 500+ подписчиков. Ниже — срочно меняй превью. Выше 10% — отлично.',
    clickbait:'Обман на превью поднимает клики, но убивает удержание и вовлечение — и алгоритм потом топит видео. Кликбейт должен быть честным.',
    metrics:'3 кита продвижения: кликабельность (CTR), удержание, вовлечение. Они связаны.',
    colors:[
      {c:'Красный',emotion:'возбуждение, энергия, паника, страх',use:'акцент, срочность, сильная эмоция'},
      {c:'Синий',emotion:'спокойствие, доверие, надёжность',use:'экспертные и деловые ниши'},
      {c:'Зелёный',emotion:'рост, здоровье, деньги, безопасность',use:'финансы, ЗОЖ, природа'},
      {c:'Жёлтый',emotion:'внимание, оптимизм, дешевизна',use:'привлечь взгляд, выделить элемент'},
      {c:'Оранжевый',emotion:'энергия, доступность, дружелюбие',use:'CTA, тёплая подача'},
      {c:'Фиолетовый',emotion:'премиум, творчество, загадка',use:'lifestyle, креатив, бьюти'},
      {c:'Чёрный',emotion:'премиум, сила, строгость',use:'фон под мужскую/премиум-аудиторию'},
      {c:'Белый',emotion:'чистота, простота, ясность',use:'контраст и читаемость текста'}
    ],
    audience:[
      {a:'Младшая аудитория',rec:'яркие, насыщенные, разноцветные оттенки'},
      {a:'Старшая аудитория',rec:'сдержанные, приглушённые, коричневые тона'},
      {a:'Женская ЦА',rec:'светлые, нежные оттенки'},
      {a:'Мужская ЦА',rec:'тёмные, насыщенные, строгие цвета'}
    ],
    rules:['Используй контрастные (противоположные) цвета, чтобы превью читалось.','Цвет превью должен соответствовать ЦА — иначе придёт не та аудитория.','1–3 крупных слова максимум, читаемых даже с телефона.']},
  goldenTopics:{
    def:'«Золотые темы» — большие объёмные вопросы, которые в нише смотрят снова и снова. Меняются только название и превью, содержание по сути повторяется.',
    how:'Ищи через конкурентов: режим инкогнито → поиск по нише → перейти на канал → сортировка «по популярным». Бери попсовые локомотивы, а не банальщину «для экспертов».',
    warn:'«Мёртвые души»: если у конкурента выстрелили НЕ нишевые ролики (шашлыки, гитара) — это не твой конкурент, вычёркивай.'},
  caps:{rule:'Прямой связи охвата с КАПСом нет (проверяли многократно). КАПС обязателен для аудитории «бабушки» / ниша здоровья / слабое зрение. В остальных случаях — только для усиления 1–2 ключевых слов или ВИСП-триггеров.'},
  seo:{tags:'3 типа тегов: брендированные (имя, фамилия, название студии/бренда), тематические (по теме видео) и общие. Цель SEO — показать релевантный контент релевантной аудитории.'},
  gptTemplates:[
    {id:'thesis',name:'Тезисный сценарий',tpl:'Ты будешь писать тезисные сценарии для видео на ютуб-канал. В сценарии должна быть чёткая структура: Вступление — короткое, яркое, цепляющее; обозначь тему/проблему/вопрос. Основная часть — логичные блоки, каждый тезис раскрывает важный аспект, с примерами, фактами, сравнениями и короткими историями, без воды и сложных терминов. Заключение — мотивация к действию. Стиль живой, разговорный, вовлекающий.'},
    {id:'full',name:'Полный сценарий (спикер+продукт)',tpl:'Напиши полный сценарий без раскадровки для видео на тему *ТЕМА*, используя параметры: Спикер: *СПИКЕР*. Продукт: *ПРОДУКТ* — интегрируй призыв перейти на продукт, отталкиваясь от проблемы зрителя. Целевая аудитория: *ЦА*. Боль зрителей: *БОЛЬ*. Пиши просто и понятно, вовлекая. Начало триггерное и интригующее, завершение мотивирующее.'},
    {id:'role',name:'Ролевой (от лица спикера)',tpl:'Ты будешь писать сценарии без раскадровки на ютуб-канал по нише *НИША*. Прими роль *СПИКЕР*. Он простым языком рассказывает о теме, цель — дать зрителю пользу так, чтобы было чувство, что со спикером общаются на равных, как друзья.'},
    {id:'shorts',name:'Шортс',tpl:'Напиши сценарий для шортс-видео без раскадровки — короткий и цепляющий текст, простой и понятный язык. Тема: *ТЕМА*. Без приветствия и прощания, сразу к сути. Динамично, с ярким началом. Если тема — ответ на вопрос, сохрани интригу и дай ответ в самом конце шортс.'}
  ],
  videoTypes:{name:'3 типа видео',
    items:[
      {t:'Хайповые («локомотивы»)',goal:'максимальный охват холодной аудитории',how:'простой язык (понятно даже 10-летнему), широкие «золотые темы», цепляющее превью',note:'тянут трафик на канал, но почти не продают'},
      {t:'Экспертные',goal:'доверие и подписка, решают конкретную проблему',how:'пошаговые разборы, гайды, ответы на запросы аудитории',note:'ЛАЙФХАК: режь длинную лекцию на ролики 5–10 мин под разные запросы. Название режет охват: «Страшные ошибки в питании» соберёт больше, чем «Правильный рацион»'},
      {t:'Продающие',goal:'превратить доверие в деньги',how:'кейсы, отзывы, «как мы работаем», экскурсия',note:'трафик только с канала (в органику почти н�� идут). Продающее видео с 80k просмотров может дать в 3× больше продаж, чем хит с 1 млн'}
    ],
    note:'Путь зрителя: познакомились → подружились → доверились → купили → дали отзыв. Баланс на 8 роликов: 5 хайп + 2 экспертных + 1 продающее (новый канал — 7 хайп + 1 экспертное).'},
  scenarioCubes:{name:'Сценарная башня (конструктор LEGO)',
    note:'Собирай сценарий из «кубиков» в любом порядке. Правила: красный кубик ВСЕГДА один (одно видео — одна проблема); зелёных решений ровно столько, сколько оранжевых усугублений; история одна на видео. Хронометраж не важен — важны удержание и динамика.',
    cubes:[
      {c:'Синий',name:'Обращение',d:'приветствие, призывы (подписка, лайк, коммент, переход), прощание. Можно опустить или ставить ПОСЛЕ хука, не в самом начале'},
      {c:'Красный',name:'Проблема',d:'одна, чёткая, анонсируется в заголовке/превью. Формулируй с вопроса: Как / Что / Зачем / Сколько / Где. «Как» даёт в ~8× больше просмотров'},
      {c:'Жёлтый',name:'Подпроблема',d:'вопросы, с которыми сталкивается зритель по пути. Основа формата «Топ-список». Не выдумывай там, где её нет'},
      {c:'Оранжевый',name:'Усугубление',d:'нагнетание: «что будет, если не решить / решить неправильно». 1–3 штуки. Правильная «вода» поднимает удержание'},
      {c:'Фиолетовый',name:'Сторителлинг',d:'одна честная история «как я/знакомый не решил проблему и были последствия». Не выдумывай чужие истории'},
      {c:'Зелёный',name:'Решение',d:'конкретный ответ. Никогда не оставляй вопрос без ответа. В «Топ-списке» — решение перед каждым новым пунктом'},
      {c:'Розовый',name:'Пример',d:'наглядное решение здесь и сейчас (покажи / нарисуй / фото). Не путать со сторителлингом'}
    ]},
  speakerTypes:{name:'5 типов спикеров — как разговорить',
    items:[
      {t:'Перфекционист',how:'задавай вопросы из-за кадра, проси рассказать «как НЕ надо», снимай дублями'},
      {t:'Душнила',how:'техника «деградни» (наивные тупые вопросы), флипчарт, провоцируй на спор'},
      {t:'Расплывающийся',how:'жёсткая структура перед глазами, перебивай и направляй, тайминг по 1 минуте, потом нарезка'},
      {t:'Волнушка',how:'создай комфорт, «снимаем тестово», держи зрительный контакт, проси «скажи ещё круче», не «переговори»'},
      {t:'Весельчак',how:'дай контент-план за 30 мин до съёмки, наводящие вопросы, питается атмосферой — поддерживай драйв'}
    ]},
  thumbnailTechniques:{name:'Техники превью (CTR)',
    note:'Цель превью — не анонс, а клик. CTR <7% — в органику почти не войдет; 7–10% норма; >10% отлично; рекорд ~24%. 60%+ смотрят с телефона: текст огромным шрифтом, 5–6 слов, слева. Техники можно комбинировать, но без перебора.',
    rules:['Тёплые тона (даже если бренд Total Black): задача — кликабельность, а не «дорого»','Краткий ёмкий текст ОГРОМНЫМ шрифтом слева, максимум 5–6 слов','Фото спикера с яркой живой эмоцией (гнев / радость / удивление), лучше «трушный» скрин из видео','Нижние 10% превью оставляй свободными (там таймкод и ползунок)','Замаскируйся под «вкусный» контент ниши: смотри, на какие превью кликает твоя ЦА'],
    techniques:[
      {n:'Топ-список',d:'«7 ошибок», «5 способов» — структурно, легко, тянет досмотр'},
      {n:'Нельзя / НЕ',d:'запрещающие слова ярко-красным: людям нельзя не посмотреть, что им нельзя'},
      {n:'Ошибки',d:'самая частая и почти всегда выстреливаю��ая техника, особенно для старта канала'},
      {n:'До / после',d:'визуальный контраст результата (CTR доходил до 24%)'},
      {n:'Быстро / дёшево',d:'«волшебная таблетка» — закрывает боль скорости и цены'},
      {n:'Стоимость',d:'чужие деньги и цены притягивают взгляд: «сколько это стоит?»'},
      {n:'Актуальность (год / тренд)',d:'год или «тренды» — желание быть в моде. Тренды снимай на полгода вперёд'},
      {n:'Годы спустя',d:'«что будет через N лет» — для продуктов с долгим сроком службы'},
      {n:'Стоит ЛИ? (прямой вопрос)',d:'частица «ли» добавляет пару % к CTR: Стоит ли? Надо ли?'},
      {n:'Самый / лучший',d:'переводит видео в разряд «для избранных», поднимает значимость'},
      {n:'Присоска',d:'известный логотип / лицо / место в превью — заём доверия на старте'},
      {n:'Стрелочка',d:'маленькая красная стрелка крадёт внимание, лучше в паре с «Ошибками»'},
      {n:'Секс',d:'красивое фото под одно-полую ЦА: поднимает CTR, но топит конверсию в подписку'}
    ]},
  shortsParams:{name:'Shorts — 6 параметров и конверсия',
    note:'Идеальная длина шортса ~30 сек (ни больше, ни меньше). Доверие и конверсию даёт простой человеческий язык и харизма, а не «умность». Внутри — мини сценарная башня: усугубляй проблему по разным сферам жизни.',
    params:['Удержание в первые 3 секунды','Конверсия в лайк','Конверсия в репост (шер)','Конверсия в комментарий','Конверсия в подписку','Досматриваемость'],
    rule:'Чтобы шортс вышел в органику, хотя бы по 2 из 6 параметров надо пробить ВЕРХНЮЮ границу нормы. Если хоть один параметр ниже нижней границы — шортс встанет (макс ~2000 просмотров). Конверсия в подписку: 0,1% — норма, 0,5%+ — отлично, бывает до 6%.'},
  seoDeep:{name:'SEO / теги — подробно',
    note:'SEO лишь ускоряет, а не заменяет хороший контент. Из поиска приходит <10% трафика, но у этих просмотров удержание на 20–25% выше. Цель — найти запросы с высоким спросом и низкой конкуренцией.',
    tagMix:'В каждом видео: 3–4 брендирующих тега (имя, фамилия, студия) + 5–6 широких / тематических («ремонт», «питание») + 6–8 низкочастотных (длинный хвост, longtail). Новому каналу — больше низкочастотных.',
    title:'Вставляй точный поисковый запрос прямо в название. Для конкурентных тем комбинируй высокочастотный + низкочастотный: «Как разговаривать с полицией? Участковый стучится в дверь».',
    lifehacks:['Транслит-теги (например «<fyz» = баня) забирают забывших раскладку','Таймкоды в описании: YouTube бьёт видео на смыслы и добавляет показы по новым запросам','Призыв купить — первой строкой описания','Новый канал: публикуй раз в 2 дня (преференция «Новинка» живёт 48 ч), 10–15 роликов в месяц по низкочастотке'],
    lifecycle:'Жизненный цикл видео: 1) только поиск (5–50 просм/день); 2) на ~10k просмотров включается look-alike, охваты скачут 2–3 дня; 3) бомбардировка главной и «Похожих» (от суток до 2–3 недель — основной рост); 4) затухание + остаточный шлейф.'}
};

/* Компактная выжимка методики для системного промпта ИИ */
const KB_PROMPT=`МЕТОДИКА (применяй при анализе и советах, говори этими понятиями):\n`+
`• ВИСП — формула заголовка/хука: Выгода, Интрига, Срочность, Причастность. В заголовке закрывай несколько букв, не повторяя одну.\n`+
`• Лестница Ханта (5 ступеней осознанности): 1) всё ок; 2) есть проблема, не знает о ней; 3) знает, не парит; 4) парит, не знает как решить; 5) знает как, не знает с кем. Верх = охваты без продаж, низ = деньги. Нужен баланс.\n`+
`• Воронка/3 категории зрителей: интересующийся (хайп), думающий-подписчик (экспертное, доверие), покупатель (продающее). Баланс на 8 роликов: 5 хайп + 2 экспертных + 1 продающее. Путь: познакомились→подружились→доверились→��упили→отзыв.\n`+
`• Заход (опенинг): первые 30 сек решают всё (у видео >100k удержание 30с >60%). Бей в боль / интрига / шок / ломка шаблона. Не начинай с долгого представления.\n`+
`• 7 ошибок сценария: нет сценария; слабый заход; нет CTA; выдал всю пользу сразу; сложный язык; вода; нет динамики.\n`+
`• Превью: CTR норма 5–10%; кликбейт-обман топит удержание. Цвет под ЦА (женская — светлые/нежные, мужская — тёмные/строгие, младшие — яркие, старшие — приглушённые; красный=эмоция/страх, синий=доверие).\n`+
`• Золотые темы: большие повторяющиеся вопросы ниши; меняй название+превью, содержание то же. Бери попсовые локомотивы конкурентов, а не банальщину для экспертов. • 3 типа видео: хайповые (охват, простой язык, «золотые темы»), экспертные (доверие/подписка; режь лекцию на ролики 5–10 мин под запросы; «ошибки» в названии собирают больше «правильного»), продающие (кейсы/отзывы; продают, но в органику не идут). На 8 роликов: 5 хайп + 2 экспертных + 1 продающее. • Сценарная башня (кубики): Красный = одна проблема (формулируй с «Как» — ~8× просмотров); Жёлтый = подпроблемы; Оранжевый = усугубление 1–3 («что будет, если не решить»); Фиолетовый = одна история; Зелёный = решений столько же, сколько усугублений; Розовый = наглядный пример; Синий = обращение/CTA. • Превью (CTR): норма 7–10%, <7% не выйдет в органику, >10% отлично. Текст огромным шрифтом слева 5–6 слов, тёплые тона, фото спикера с эмоцией. Техники: ошибки, нельзя/НЕ, топ-список, до/после, быстро-дёшево, стоимость, год/тренд, «стоит ли?», «самый/лучший», стрелочка, присоска. • Shorts: длина ~30 сек; 6 параметров (удержание первых 3 сек, лайк, репост, коммент, подписка, досмотр) — для органики пробей верх хотя бы по 2 из 6, любой ниже нормы = стоп. Конверсия в подписку 0,1% норма, 0,5%+ отлично. Простой язык = доверие. • SEO/теги: 3–4 брендирующих + 5–6 широких + 6–8 низкочастотных (longtail); поисковый запрос — прямо в название; транслит-теги и таймкоды в описании; новинке YouTube даёт буст 48 ч. Жизненный цикл: поиск → look-alike (~10k) → главная/похожие → затухание. • Типы спикеров: перфекционист, душнила, расплывающийся, волнушка, весельчак — у каждого свой способ разговорить.`;

function kbBrief(){return KB_PROMPT;}

/* ===== МОДУЛЬНАЯ БАЗА ЗНАНИЙ + РОУТЕР: в каждый промпт подаём только релевантные задаче блоки ===== */
const KB_MOD={
  visp:`• ВИСП — формула заголовка/хука: Выгода, Интрига, Срочность, Причастность. В заголовке закрывай несколько букв, не повторяя одну.`,
  hunt:`• Лестница Ханта (5 ступеней осознанности): 1) всё ок; 2) есть проблема, не знает; 3) знает, не парит; 4) парит, не знает как; 5) знает как, не знает с кем. Верх = охваты без продаж, низ = деньги — нужен баланс.`,
  funnel:`• Воронка/3 категории зрителей: интересующийся (хайп), думающий-подписчик (экспертное, доверие), покупатель (продающее). Баланс на 8 роликов: 5 хайп + 2 экспертных + 1 продающее. Путь: познакомились→подружились→доверились→купили→отзыв.`,
  opening:`• Заход (опенинг): первые 30 сек решают всё (у видео >100k удержание 30с >60%). Бей в боль / интрига / шок / ломка шаблона. Не начинай с долгого представления.`,
  scenarioErrors:`• 7 ошибок сценария: нет сценария; слабый заход; нет CTA; выдал всю пользу сразу; сложный язык; вода; нет динамики.`,
  scenarioCubes:`• Сценарная башня (кубики): Красный = одна проблема (формулируй с «Как» — ~8× просмотров); Жёлтый = подпроблемы; Оранжевый = усугубление 1–3 («что будет, если не решить»); Фиолетовый = одна честная история; Зелёный = решений столько же, сколько усугублений; Розовый = наглядный пример; Синий = обращение/CTA (после хука, не в начале).`,
  preview:`• Превью (CTR): норма 7–10%, <7% не выйдет в органику, >10% отлично. Текст огромным шрифтом слева 5–6 слов, тёплые тона, фото спикера с эмоцией. Цвет под ЦА (женская — светлые/нежные, мужская — тёмные/строгие, младшие — яркие, старшие — приглушённые; красный=эмоция/страх, синий=доверие). Техники: ошибки, нельзя/НЕ, топ-список, до/после, быстро-дёшево, стоимость, год/тренд, «стоит ли?», «самый/лучший», стрелочка, присоска.`,
  goldenTopics:`• Золотые темы: большие повторяющиеся вопросы ниши; меняй название+превью, содержание по сути то же. Бери попсовые локомотивы конкурентов, а не банальщину для экспертов.`,
  videoTypes:`• 3 типа видео: хайповые (охват, простой язык, «золотые темы»), экспертные (доверие/подписка; режь лекцию на ролики 5–10 мин под запросы; «ошибки» в названии собирают больше «правильного»), продающие (кейсы/отзывы; продают, но в органику не идут).`,
  shorts:`• Shorts: длина ~30 сек; 6 параметров (удержание первых 3 сек, лайк, репост, коммент, подписка, досмотр) — для органики пробей верх хотя бы по 2 из 6, любой ниже нормы = стоп (макс ~2000). Конверсия в подписку 0,1% норма, 0,5%+ отлично. Простой язык = доверие.`,
  seo:`• SEO/теги: 3–4 брендирующих + 5–6 широких + 6–8 низкочастотных (longtail); поисковый запрос — прямо в название; транслит-теги и таймкоды в описании; новинке YouTube даёт буст 48 ч. Жизненный цикл: поиск → look-alike (~10k) → главная/похожие → затухание.`,
  speakers:`• Типы спикеров: перфекционист, душнила, расплывающийся, волнушка, весельчак — у каждого свой способ разговорить.`,
  retentionTable:`• Норма удержания по длине ролика: Shorts 80–100%; до 5 мин 50–80%; 5–10 мин 45–70%; 10–20 мин 40–55%; 20–30 мин 30–50%; 30–60 мин 20–45%; 60+ мин 15–35%. Чем длиннее ролик, тем ниже планка удержания, но больше суммарное время просмотра. Удержание + общее время просмотра — главные сигналы ранжирования YouTube.`,
  retentionHacks:`• Удержание до конца: пообещай главный ответ/итог в финале («самое важное покажу в конце»), держи открытые петли и не выдавай всю пользу сразу; делай эмоциональные качели (интрига↔облегчение, проблема↔надежда); меняй картинку/динамику каждые 15–30 сек; режь воду.`,
  mission:`• Миссия канала (8 вопросов до старта): 1) для кого канал; 2) какую их проблему решаю; 3) почему я (экспертиза/история); 4) какой результат даю зрителю; 5) чем отлич��юсь от к��нкурентов; 6) что зритель сделает после просмотра; 7) как это ведёт к деньгам; 8) почему буду вести регулярно. Чёткая миссия = стержень контента и позиционирования.`,
  comments:`• Комментарии как драйвер роста: прямой призыв комментировать и вопрос аудитории поднимают вовлечённость и охваты; отвечай в первые часы — это разгоняет ролик. Кейс (ниша здоровья): ~100k подписчиков за 3 месяца через ролик «Первые признаки деменции» + активный сбор и отработка комментариев.`,
  benefit:`• Выгода (4 опоры): польза должна быть материальной (ощутимый результат), применимой (можно сделать сразу), значимой (реально важна зрителю) и понятной (без сложного языка). Каждый ролик чётко отвечает: что зритель получит и сможет применить.`,
  /* === НОВЫЕ БЛОКИ (исследование роста 2025–2026) === */
  packaging:`• Упаковка решает клик (важнее самого видео): порядок работы — сначала идея и упаковка (заголовок+превью), потом съёмка. Если на упаковку не хочется кликнуть — видео не посмотрят, как бы хорошо оно ни было снято. Каждое видео начинай с вопроса «на это кликнут в ленте среди конкурентов?».`,
  satisfaction:`• Алгоритм YouTube 2025–2026: ранжирует по цепочке показы→CTR→удержание→УДОВЛЕТВОРЁННОСТЬ. Удовлетворённость (лайки, шеры, опросы «понравилось?», возвраты к каналу, досмотры) теперь весит выше «голого» watch time. YouTube тестит новое видео на маленькой аудитории и по реакции решает, катить ли шире — поэтому первые 1–2 часа и честное совпадение «обещание превью = контент» критичны.`,
  heroHubHygiene:`• Стратегия Hero-Hub-Hygiene (микс контента): HERO — крупные «событийные» ролики на широкую аудиторию (1–2 в квартал, ради охвата); HUB — регулярные серии/рубрики для своей аудитории (еженедельно, держат подписчика); HYGIENE/HELP — вечнозелёные ответы на поисковые запросы (постоянно, дают приток из поиска). Здоровый канал ведёт все три типа одновременно.`,
  series:`• Серийность и сессии: повторяющиеся рубрики, серии и плейлисты формируют привычку и поднимают session time (сколько человек смотрит на YouTube ПОСЛЕ твоего видео — важный сигнал). Заканчивай ролик подводкой к следующему, собирай темы в плейлисты, давай рубрикам узнаваемые названия.`,
  launch5:`• Старт канала: выбери ОДНУ нишу и протестируй её всерьёз (не бросай после 3 роликов — нужно ~15–20 видео / «100 часов» контента, чтобы понять, заходит ли). Правило 5 видео: прежде чем активно звать людей, выложи 4–5 сильных роликов, чтобы новый зритель залип и подписался. Найди свой самый успешный ролик и сделай ещё 3 похожих — повторяй то, что уже сработало.`,
  abThumbnail:`• A/B-тест упаковки обязателен: у роликов с низким CTR в первую очередь меняй превью и заголовок (само видео не трогай). Делай 2–3 варианта превью и сравнивай (в т.ч. через «Тест и сравнение» в YouTube Studio). Раз в неделю проверяй последние ролики: что ниже медианного CTR — переупакуй.`,
  prePublish:`• Чек-лист «ЗАЛЕТИТ / НЕ ЗАЛЕТИТ» перед публикацией (пройди ДО выхода ролика): 1) УПАКОВКА — на превью+заголовок кликнул бы сам в ленте среди конкурентов? закрыты буквы ВИСП? 2) ХУК — первые 5–15 сек цепляют (боль/интрига/шок), без долгого вступления? 3) УДЕРЖАНИЕ — нет воды, есть открытые петли и смена динамики каждые 15–30 сек? 4) ОДНА мысль/проблема на ролик и чёткое решение в конце? 5) ВОВЛЕЧЕНИЕ — есть прямой вопрос или призыв к лайку/комменту? 6) ЧЕСТНОСТЬ — контент реально выполняет обещание превью (иначе алгоритм утопит). Если хоть один пункт «нет» — дорабатывай, не публикуй.`,
  tgContentPlan:`• Telegram контент-план: заведи 3–5 постоянных рубрик (польза/гайд, личное/бэкстейдж, новость-разбор, опрос-вовлечение, продающий пост) и распиши сетку на 2–4 недели. Ритм важнее объёма: 1 сильный пост в день лучше пачки слабых. Чередуй форматы — текст, опрос, кружок (видеосообщение), фото, голосовое. Лучшее время — утро и вечер буднего дня.`,
  tgFirstSubs:`• Первые подписчики в Telegram: 1) наполни канал 5–10 постами ДО приглашений; 2) позови тёплый круг и партнёров; 3) переливай аудиторию с YouTube/Shorts (ссылка в описании, закрепе, в конце ролика + лид-магнит за подписку); 4) оставляй полезные комментарии в чатах/каналах ниши; 5) добавь канал в тематические папки и каталоги. Качество трафика > количества: целевой подписчик ценнее «накрутки».`,
  tgCrossPromo:`• Взаимопиар и коллаборации: договаривайся о взаимных постах и общих папках с каналами близкого размера и схожей ЦА — это самый дешёвый органический рост в Telegram. Готовь под партнёра отдельный цепляющий пост (а не «вот канал, подпишись»). Совместные эфиры/рубрики и упоминания усиливают доверие.`,
  tgEngagement:`• Вовлечение и удержание в Telegram: добавляй реакции и опросы, задавай прямой вопрос в конце поста, отвечай в комментариях. Держи эксклюзив, которого нет на YouTube (закрытые разборы, ранний доступ, бонусы) — это причина оставаться подписанным. Стабильность постинга и «своя фишка/тон» удерживают аудиторию сильнее разовых всплесков.`
};
const KB_ROUTES={
  audit:['visp','hunt','funnel','opening','scenarioErrors','scenarioCubes','preview','goldenTopics','videoTypes','shorts','seo','speakers','retentionTable','retentionHacks','mission','comments','benefit','packaging','satisfaction','heroHubHygiene','series','launch5','abThumbnail','prePublish'],
  idea:['visp','hunt','funnel','goldenTopics','videoTypes','preview','mission','benefit','comments','packaging','satisfaction','heroHubHygiene','series','prePublish'],
  titles:['visp','goldenTopics','preview','benefit','packaging','satisfaction'],
  script:['scenarioCubes','scenarioErrors','opening','visp','speakers','retentionHacks','benefit','satisfaction','prePublish'],
  retention:['opening','scenarioErrors','visp','shorts','retentionTable','retentionHacks','satisfaction','series'],
  thumbnail:['preview','visp','packaging','abThumbnail','satisfaction'],
  shorts:['shorts','opening','visp','retentionTable','packaging','satisfaction','prePublish'],
  telegram:['funnel','visp','preview','comments','benefit','tgContentPlan','tgFirstSubs','tgCrossPromo','tgEngagement'],
  bulk:['visp','videoTypes','preview','packaging','satisfaction']
};
function kbFor(task){
  try{
    const keys=KB_ROUTES[task]||KB_ROUTES.audit;
    const head='МЕТОДИКА (применяй и говори этими понятиями — даны только релевантные задаче блоки):\n';
    return head+keys.map(k=>KB_MOD[k]).filter(Boolean).join('\n');
  }catch(e){return (typeof kbBrief==='function'?kbBrief():'');}
}
function kbPick(keys){try{const head='МЕТОДИКА (применяй и говори этими понятиями — даны только релевантные задаче блоки):\n';return head+(keys||[]).map(k=>KB_MOD[k]).filter(Boolean).join('\n');}catch(e){return (typeof kbBrief==='function'?kbBrief():'');}}

/* ===== ПРОДЮСЕРСКИЙ ШТАБ — функции (на базе знаний KB) ===== */
function _v(sel){const e=$(sel);return e?((''+(e.value||'')).trim()):'';}
function _esc(s){return esc(''+(s==null?'':s));}

/* --- ВИСП-скоринг заголовка --- */
function vispScore(title){
  const t=(title||'').toLowerCase();const hit=[],miss=[];
  KB.visp.letters.forEach(L=>{
    let on=L.words.some(w=>t.indexOf(w)>=0);
    if(L.k==='В'&&/\d/.test(t))on=true;
    if(L.k==='И'&&/[?]/.test(t))on=true;
    if(L.k==='С'&&/(20[0-9]{2}|сегодня|свеж|только что)/.test(t))on=true;
    (on?hit:miss).push(L);
  });
  const len=(title||'').length;const flags=[];
  if(len>70)flags.push('Длинновато (>70 симв.) — хвост обрежется в выдаче и на мобиле.');
  if(len>0&&len<20)flags.push('Коротковато — мало места для триггеров, добавь конкретику.');
  const caps=(title||'').replace(/[^А-ЯA-Z]/g,'').length, low=(title||'').replace(/[^а-яa-z]/g,'').length;
  if(caps>low&&len>6)flags.push('Сплошной КАПС оправдан только для аудитории «бабушки»/здоровье/слабое зрение. Иначе капсом выделяй 1–2 ключевых слова.');
  const score=Math.round(hit.length/4*100);
  const label=hit.length>=4?'Сильный':hit.length===3?'Хороший':hit.length===2?'Средний':'Слабый';
  return {score,hit,miss,flags,len,label};
}

/* --- 1. Анализатор заголовка + превью --- */
function runPreviewLab(){
  const out=$('#pvOut');if(!out)return;
  const title=_v('#pvTitle');const aud=_v('#pvAud');
  if(!title){out.innerHTML='<div class="muted" style="padding:12px 2px">Введи заголовок будущего ролика — проверим по ВИСП и подберём цвета превью под аудиторию 🙂</div>';return;}
  const r=vispScore(title);
  const meter='<div class="kb-meter"><div class="kb-meter-bar"><i style="width:'+r.score+'%"></i></div><div class="kb-meter-num">'+r.score+'% · '+r.label+'</div></div>';
  const letters=KB.visp.letters.map(L=>{const on=r.hit.indexOf(L)>=0;return '<div class="kb-letter '+(on?'on':'off')+'"><div class="kl-k">'+L.k+'</div><div class="kl-n">'+L.name+'</div><div class="kl-s">'+(on?'✓ есть':'нет — '+_esc(L.desc))+'</div></div>';}).join('');
  let tips='';
  if(r.miss.length){tips='<div class="kb-sub">Чего не хватает по ВИСП:</div><ul class="kb-ul">'+r.miss.map(L=>{
    const ex={'В':'добавь конкретную выгоду/цифру: «…за 5 минут», «топ-7…»','И':'добавь интригу/гэп: «почему…», «правда о…», «никто не говорит…»','С':'добавь срочность: год, «новый», «уже сейчас», «тренд»','П':'добавь причастность: «для новичков», «если ты…», «твой…»'};
    return '<li><b>'+L.k+' — '+_esc(L.name)+':</b> '+_esc(ex[L.k]||L.desc)+'</li>';}).join('')+'</ul>';}
  const flags=r.flags.length?'<div class="kb-flags">'+r.flags.map(f=>'<div class="kb-flag">⚠️ '+_esc(f)+'</div>').join('')+'</div>':'';
  const audObj=KB.preview.audience.find(a=>a.a===aud);
  const colorRec=audObj?'<div class="kb-callout"><b>🎨 Цвет превью под «'+_esc(audObj.a)+'»:</b> '+_esc(audObj.rec)+'</div>':'<div class="kb-callout">🎨 Выбери аудиторию слева — подскажу палитру превью.</div>';
  const colors='<div class="kb-colors">'+KB.preview.colors.map(c=>'<div class="kb-color"><b>'+_esc(c.c)+'</b><span>'+_esc(c.emotion)+'</span><i>'+_esc(c.use)+'</i></div>').join('')+'</div>';
  const rules='<ul class="kb-ul">'+KB.preview.rules.map(x=>'<li>'+_esc(x)+'</li>').join('')+'</ul>';
  out.innerHTML='<div class="kb-block"><div class="kb-h">🧪 Заголовок по ВИСП</div>'+meter+'<div class="kb-letters">'+letters+'</div>'+tips+flags+'</div>'+
    '<div class="kb-block"><div class="kb-h">🖼️ Превью</div>'+colorRec+'<div class="kb-note">'+_esc(KB.preview.ctr)+'</div><div class="kb-note">'+_esc(KB.preview.clickbait)+'</div><div class="kb-sub">Палитра и эмоции:</div>'+colors+'<div class="kb-sub">Правила превью:</div>'+rules+'</div>';
}

/* --- 2. Генератор сценариев (4 шаблона + чек-лист ошибок) --- */
function scenarioCheck(text,a){
  text=text||'';const low=text.toLowerCase();const blocks=(a&&Array.isArray(a.blocks))?a.blocks:[];
  const items=[];
  const has=(arr)=>arr.some(w=>low.indexOf(w)>=0);
  items.push({t:'Есть структура сценария',ok:blocks.length>=2,why:KB.scenarioErrors[0].fix});
  const hook=(a&&a.hook)?(''+a.hook).toLowerCase():'';
  const hookStrong=hook.length>0&&(has(['?','но ','шок','правда','ошибк','предст','никто','секрет','боль','потеря'])||/\d/.test(hook));
  items.push({t:'Сильный заход (первые 30 сек)',ok:hookStrong,why:KB.scenarioErrors[1].fix});
  items.push({t:'Есть внятный CTA',ok:!!(a&&a.cta&&(''+a.cta).trim().length>4),why:KB.scenarioErrors[2].fix});
  items.push({t:'Динамика / крючки по тексту',ok:has(['но это','дальше','самое важное','а теперь','вот что','секунд','представь']),why:KB.scenarioErrors[6].fix});
  const longWords=(text.match(/[А-Яа-яA-Za-z]{14,}/g)||[]).length;
  items.push({t:'Простой язык (без перегруза)',ok:longWords<=4,why:KB.scenarioErrors[4].fix});
  return items;
}
async function runScenarioTower(topic,opt,errs,out){
  opt=opt||{};
  const sys='Ты — сценарист YouTube-студии «Контент Могущества». Собери сценарий СТРОГО по «Сценарной башне» из кубиков. Правила: КРАСНЫЙ кубик ВСЕГДА один (одно видео — одна проблема, формулируй через вопрос «Как/Что/Зачем/Сколько»; «Как» даёт ~8× просмотров); ЖЁЛТЫЙ — подпроблемы зрителя (основа «Топ-списка»); ОРАНЖЕВЫЙ — усугубление 1–3 («что будет, если не решить»); ФИОЛЕТОВЫЙ — одна честная история; ЗЕЛЁНЫЙ — решений РОВНО столько, сколько оранжевых усугублений (ни один вопрос без ответа); РОЗОВЫЙ — наглядный пример здесь и сейчас; СИНИЙ — обращение/CTA (после хука, не в начале). Первые 20–30 секунд (хук) бей в боль/интригу/шок, без долгого вступления. Говори просто, без воды, держи динамику. Избегай 7 ошибок: '+errs+'. Заголовки и хук — по ВИСП. Верни СТРОГО валидный JSON без markdown: {\"hook\":\"заход на 20–30 сек\",\"blocks\":[{\"cube\":\"Красный|Жёлтый|Оранжевый|Фиолетовый|Зелёный|Розовый|Синий\",\"title\":\"роль кубика 1-2 словами\",\"points\":[\"конкретный текст или тезис\"]}],\"cta\":\"призыв с выгодой\",\"title_ideas\":[\"3-5 заголовков по ВИСП\"]}. Выстрой blocks в порядке показа в ролике.'+kbFor('script');
  const user='Тема: '+topic+'. Спикер: '+(opt.speaker||'не указан')+'. Продукт: '+(opt.product||'нет, без продажи')+'. Аудитория: '+(opt.aud||'широкая')+'. Боль зрителя: '+(opt.pain||'не указана')+'.';
  try{const a=await callMistralRaw(sys,user,2600);renderScenario(a,topic);}
  catch(e){out.innerHTML='<div class="empty">⚠️ Не получилось собрать башню — попробуй ещё раз через пару секунд.</div>';}
}

async function runPackaging(){
  const out=$('#pkOut');if(!out)return;
  const title=_v('#pvTitle');const aud=_v('#pvAud');
  if(!title){out.innerHTML='<div class="muted" style="padding:10px 2px">Введи заголовок или тему выше — соберу упаковку: заголовки по ВИСП, хук и бриф превью 🎁</div>';return;}
  out.innerHTML='<div class="loader-ring" style="width:42px;height:42px;margin:14px auto"></div><div class="muted center">Viora AI собирает упаковку…</div>';
  const ch=(STATE&&STATE.channel)?STATE.channel.title:'';
  const formula=(STATE&&STATE.ai&&Array.isArray(STATE.ai.hit_formula))?STATE.ai.hit_formula.join('; '):'';
  const sys='Ты — продюсер по упаковке YouTube. По теме или черновому заголовку собери ПОЛНУЮ упаковку ролика по методике. Опирайся на ВИСП (Выгода/Интрига/Срочность/Причастность) и техники превью. Верни СТРОГО валидный JSON без markdown: {\"titles\":[{\"title\":\"кликабельный заголовок 40-70 символов\",\"visp\":\"какие буквы ВИСП закрывает\"}],\"hook\":\"готовый текст хука на первые 10-15 секунд — бьёт в боль или интригу, без долгого представления\",\"thumb\":{\"text\":\"3-5 слов огромным шрифтом на превью\",\"frame\":\"что в кадре: спикер или объект и его эмоция\",\"emotion\":\"эмоция лица\",\"color\":\"палитра под аудиторию\",\"technique\":\"техника превью (ошибки / нельзя / до-после / топ-список / стоимость / год)\"}}. Дай 4 заголовка разными приёмами. По-русски, конкретно, без воды.'+kbFor('thumbnail');
  const user='Тема или заголовок: "'+title+'". Аудитория превью: '+(aud||'не указана')+'. Канал: '+(ch||'не указан')+(formula?('. Формула хита канала: '+formula):'');
  try{
    const a=await callMistralRaw(sys,user,1700);
    const titles=Array.isArray(a.titles)?a.titles.filter(t=>t&&t.title):[];
    const th=a.thumb||{};
    const tHtml=titles.length?'<div class="kb-sub">Заголовки по ВИСП (клик — скопировать):</div><div class="lab-out">'+titles.map(t=>{const sv=vispScore(t.title);return '<div class="lab-item" onclick="copyText(this.querySelector(\'.lc\'),\''+_esc((''+t.title).replace(/\x27/g,'’'))+'\')"><span class="lc">'+_esc(t.title)+'</span><span class="chip">ВИСП '+sv.score+'%</span></div>';}).join('')+'</div>':'';
    const hHtml=a.hook?'<div class="sc-hook"><div class="sc-tag">🎬 ХУК (0–15 сек)</div><div>'+_esc(a.hook)+'</div></div>':'';
    const rows=[['🖼️ Текст на превью',th.text],['🎭 Что в кадре',th.frame],['😮 Эмоция',th.emotion],['🎨 Цвет под ЦА',th.color],['🧲 Техника',th.technique]].filter(r=>r[1]);
    const thHtml=rows.length?'<div class="sc-blk" style="margin-top:4px"><div class="sc-bn">🖼️ Бриф превью</div><ul>'+rows.map(r=>'<li><b>'+r[0]+':</b> '+_esc(''+r[1])+'</li>').join('')+'</ul></div>':'';
    out.innerHTML=(hHtml+tHtml+thHtml)||'<div class="empty">Пусто — попробуй ещё раз.</div>';
  }catch(e){out.innerHTML='<div class="empty">⚠️ Не получилось собрать упаковку — попробуй ещё раз через пару секунд.</div>';}
}

async function runScenario(){
  const out=$('#scOut');if(!out)return;
  const topic=_v('#scTopic');
  if(!topic){out.innerHTML='<div class="muted" style="padding:12px 2px">Введи тему ролика 🙂</div>';return;}
  const fmt=_v('#scFormat')||'thesis';
  const speaker=_v('#scSpeaker'),product=_v('#scProduct'),aud=_v('#scAud')||(STATE.primaryNiche||''),pain=_v('#scPain');
  out.innerHTML='<div class="loader-ring" style="width:46px;height:46px;margin:14px auto"></div><div class="muted center">Viora AI пишет сценарий по методике…</div>';
  const errs=KB.scenarioErrors.map((e,i)=>(i+1)+') '+e.t).join('; ');
  if(fmt==='tower'){return runScenarioTower(topic,{speaker,product,aud,pain},errs,out);}
  const tplObj=KB.gptTemplates.find(x=>x.id===fmt)||KB.gptTemplates[0];
  const sys='Ты — сценарист YouTube-студии «Контент Могущества». Пиши строго по этой методике-шаблону: "'+tplObj.tpl+'". '+
    'Первые 30 секунд (хук) решают всё — бей в боль/интригу/шок. Дозируй пользу, держи динамику крючками «но это ещё не всё…», говори просто, как с другом, без воды. '+
    'Избегай 7 ошибок: '+errs+'. Заголовки и хук строй по ВИСП (Выгода/Интрига/Срочность/Причастность). '+
    'Верни СТРОГО валидный JSON без markdown: {"hook":"яркий заход на первые 20-30 секунд","blocks":[{"title":"название блока","points":["тезис","тезис"]}],"cta":"призыв с выгодой","title_ideas":["3-5 заголовков по ВИСП"]}.'+kbFor('script');
  const user='Тема: '+topic+'\nФормат: '+fmt+'\nСпикер: '+(speaker||'не указан')+'\nПродукт: '+(product||'нет, без продажи')+'\nЦелевая аудитория: '+(aud||'широкая')+'\nБоль зрителя: '+(pain||'не указана');
  try{const a=await callMistralRaw(sys,user,2200);renderScenario(a,topic);}
  catch(e){out.innerHTML='<div class="empty">⚠️ Не получилось сгенерировать сценарий — попробуй ещё раз через пару секунд.</div>';}
}
function renderScenario(a,topic){
  const out=$('#scOut');if(!out)return;a=a||{};
  const blocks=Array.isArray(a.blocks)?a.blocks:[];
  const ideas=Array.isArray(a.title_ideas)?a.title_ideas:[];
  const full=[a.hook].concat(blocks.map(b=>(b.title||'')+' '+((b.points||[]).join(' ')))).concat([a.cta]).filter(Boolean).join(' ');
  const chk=scenarioCheck(full,a);
  const hookHtml=a.hook?'<div class="sc-hook"><div class="sc-tag">🎬 ЗАХОД (0–30 сек)</div><div>'+_esc(a.hook)+'</div></div>':'';
  const CUBE_HEX={'Синий':'#3aa0ff','Красный':'#ff3b46','Жёлтый':'#ffd23f','Оранжевый':'#ff9f1c','Фиолетовый':'#b06bff','Зелёный':'#36e07a','Розовый':'#ff6bd0'};
  const blocksHtml=blocks.length?'<div class="sc-blocks">'+blocks.map((b,i)=>{const cube=(b.cube&&CUBE_HEX[b.cube])?b.cube:'';const hex=cube?CUBE_HEX[cube]:'';const style=cube?' style="border-left:4px solid '+hex+'"':'';const badge=cube?'<span class="sc-cube" style="background:'+hex+'22;color:'+hex+';border:1px solid '+hex+'55">'+_esc(cube)+'</span> ':'';return '<div class="sc-blk"'+style+'><div class="sc-bn">'+badge+(i+1)+'. '+_esc(b.title||'')+'</div><ul>'+((b.points||[]).map(p=>'<li>'+_esc(p)+'</li>').join(''))+'</ul></div>';}).join('')+'</div>':'';
  const ctaHtml=a.cta?'<div class="sc-cta"><div class="sc-tag">📣 CTA</div><div>'+_esc(a.cta)+'</div></div>':'';
  const ideasHtml=ideas.length?'<div class="sc-sub">Заголовки по ВИСП (клик — скопировать):</div><div class="lab-out">'+ideas.map(t=>{const sv=vispScore(t);return '<div class="lab-item" onclick="copyText(this.querySelector(\'.lc\'),\''+_esc((''+t).replace(/\x27/g,'’'))+'\')"><span class="lc">'+_esc(t)+'</span><span class="chip">ВИСП '+sv.score+'%</span></div>';}).join('')+'</div>':'';
  const chkHtml='<div class="sc-check"><div class="sc-sub">Проверка по 7 ошибкам сценария:</div>'+chk.map(c=>'<div class="sc-ci '+(c.ok?'ok':'no')+'"><span class="ci-m">'+(c.ok?'✓':'✕')+'</span><div><b>'+_esc(c.t)+'</b>'+(c.ok?'':'<div class="ci-why">→ '+_esc(c.why)+'</div>')+'</div></div>').join('')+'</div>';
  out.innerHTML=hookHtml+blocksHtml+ctaHtml+ideasHtml+chkHtml;
}

/* --- 3. Контент-план по Лестнице Ханта + воронке --- */
function kbContentPlan(){
  const el=$('#prodPlan');if(!el)return;
  const niche=STATE.primaryNiche||'твоя тема';
  const topics=(STATE.topics||[]).filter(t=>t&&t.name);
  const byVpd=topics.slice().sort((a,b)=>(b.medVpd||0)-(a.medVpd||0));
  const winners=byVpd.slice(0,3).map(t=>t.name);
  const th=i=>winners.length?winners[i%winners.length]:niche;
  const year=new Date().getFullYear();
  const L=KB.hunt.levels;
  const plan=[
    {cat:'Хайп',lvl:L[0],t:'ТОП-7 '+th(0)+', которые реально работают в '+year},
    {cat:'Хайп',lvl:L[1],t:'5 ошибок в '+th(1)+', из-за которых ты теряешь просмотры'},
    {cat:'Хайп',lvl:L[1],t:'Почему '+th(2)+' не приносит результат — правда, о которой молчат'},
    {cat:'Хайп',lvl:L[0],t:'Я проверил '+th(0)+' за 30 дней — вот что вышло'},
    {cat:'Хайп',lvl:L[0],t:th(1)+': что изменилось в '+year+' и как этим пользоваться'},
    {cat:'Экспертное',lvl:L[2],t:'Как '+th(0)+' с нуля: пошаговый разбор для новичков'},
    {cat:'Экспертное',lvl:L[3],t:th(2)+': полный гайд — от частых ошибок до результата'},
    {cat:'Продающее',lvl:L[4],t:'Как мы сделали результат в '+th(0)+' — реальный кейс'}
  ];
  const catColor={'Хайп':'#ff9f6b','Экспертное':'#9bd0ff','Продающее':'#9bf3bf'};
  const rows=plan.map((p,i)=>{const sv=vispScore(p.t);return '<div class="cp-row"><div class="cp-num">'+(i+1)+'</div>'+
    '<div class="cp-mid"><div class="cp-title" onclick="copyText(this,\''+_esc(p.t.replace(/\x27/g,'’'))+'\')" title="клик — скопировать">'+_esc(p.t)+'</div>'+
    '<div class="cp-meta"><span class="cp-cat" style="color:'+catColor[p.cat]+'">'+p.cat+'</span> · Ханта №'+p.lvl.n+': '+_esc(p.lvl.title)+' · '+_esc(p.lvl.funnel)+'</div></div>'+
    '<div class="cp-visp">ВИСП '+sv.score+'%</div></div>';}).join('');
  el.innerHTML='<div class="card"><div class="cp-head">📅 План на месяц по балансу воронки: <b>5 хайп + 2 экспертных + 1 продающее</b>. Заголовки — черновики по ВИСП под твои сильные темы ('+_esc(winners.join(', ')||niche)+'). Клик по заголовку — скопировать.</div>'+rows+
    '<div class="cp-foot">🧭 Путь зрителя: '+_esc(KB.funnel.path)+'. Верх Лестницы Ханта даёт охваты, низ — продажи. Держи баланс.</div></div>';
}

/* --- 4. Авто-оценка качества роликов (чек-листы) --- */
function qualityScore(v,medVpd,medEng){
  const xr=(v.xc!=null)?v.xc:(medVpd>0?v.viewsPerDay/medVpd:0); /* когортный коэффициент честнее сырой медианы */
  const er=medEng>0?v.engagement/medEng:0;
  const sv=vispScore(v.title);
  let hookPts=xr>=1.5?35:xr>=1?28:xr>=0.6?18:8;          /* прокси хука/удержания: vpd vs медиана */
  let engPts=er>=1.3?25:er>=1?20:er>=0.6?12:6;            /* вовлечение */
  let titlePts=Math.round(sv.score/100*30);               /* упаковка заголовка */
  let lenPts=10;
  if(!v.isShort){if(v.dur<60)lenPts=4;else if(v.dur>2400)lenPts=6;}
  const score=Math.max(1,Math.min(100,hookPts+engPts+titlePts+lenPts));
  const weak=[];
  if(xr<0.8)weak.push(KB.scenarioErrors[1]);              /* слабый заход */
  if(sv.hit.length<2)weak.push({t:'Слабая упаковка',fix:'Заголовок закрывает мало букв ВИСП — добавь '+sv.miss.map(m=>m.name).join('/')+'.'});
  if(er<0.8)weak.push(KB.scenarioErrors[6]);              /* нет динамики -> вовлечение низкое */
  if(!weak.length)weak.push({t:'Так держать',fix:'Ролик выше среднего — разбери его формулу и повтори.'});
  return {score,xr,er,sv,fix:weak[0]};
}
function renderQuality(){
  const el=$('#prodQuality');if(!el)return;
  const vids=(STATE.videos||[]).filter(v=>v&&v.title);
  if(vids.length<4){el.innerHTML='<div class="card"><div class="empty">Нужно минимум 4 ролика, чтобы оценить качество по чек-листу.</div></div>';return;}
  const medVpd=median(vids.map(v=>v.viewsPerDay));const medEng=median(vids.map(v=>v.engagement));
  const scored=vids.map(v=>({v,q:qualityScore(v,medVpd,medEng)}));
  const avg=Math.round(scored.reduce((s,x)=>s+x.q.score,0)/scored.length);
  const worst=scored.slice().sort((a,b)=>a.q.score-b.q.score).slice(0,12);
  const rows=worst.map(({v,q})=>'<div class="ql-row" onclick="openVideoDrawer(\''+v.id+'\')"><img class="vp" src="'+safeImg(v.thumb)+'" alt="" loading="lazy"/>'+
    '<div class="ql-mid"><div class="ql-t">'+_esc(v.title)+'</div><div class="ql-fix">🛠 '+_esc(q.fix.t)+': '+_esc(q.fix.fix)+'</div></div>'+
    '<div class="ql-score s'+(q.score>=70?'g':q.score>=45?'m':'b')+'">'+q.score+'</div></div>').join('');
  el.innerHTML='<div class="card"><div class="ql-head">Средняя оценка качества канала: <b>'+avg+'/100</b>. Считается по прокси-хука (просмотры/день к медиане), вовлечению и упаковки заголовка (ВИСП). Ниже — '+worst.length+' роликов, которым сильнее всего нужен ремонт. Клик — открыть разбор.</div>'+rows+'</div>';
}

/* --- 5. Заходы (опенинги) --- */
function kbHooks(){
  const el=$('#prodHooks');if(!el)return;
  const types=KB.openings.types.map(o=>'<div class="hk-card"><div class="hk-n">'+_esc(o.n)+'</div><div class="hk-d">'+_esc(o.d)+'</div></div>').join('');
  el.innerHTML='<div class="card"><div class="kb-callout">📊 '+_esc(KB.openings.stat)+'</div><div class="kb-flag" style="margin:10px 0">🚫 '+_esc(KB.openings.avoid)+'</div><div class="hk-grid">'+types+'</div></div>';
}

/* --- 6. Методика (база знаний) --- */
function kbRenderMethod(){
  const el=$('#prodMethod');if(!el)return;
  const visp='<div class="m-card"><div class="m-h">🎯 ВИСП — формула заголовка и хука</div><div class="m-sub">'+_esc(KB.visp.full)+'</div><div class="kb-letters">'+KB.visp.letters.map(L=>'<div class="kb-letter on"><div class="kl-k">'+L.k+'</div><div class="kl-n">'+_esc(L.name)+'</div><div class="kl-s">'+_esc(L.desc)+'</div></div>').join('')+'</div><div class="kb-note">'+_esc(KB.visp.note)+'</div></div>';
  const hunt='<div class="m-card"><div class="m-h">🪜 Лестница Ханта — 5 ступеней осознанности</div>'+KB.hunt.levels.map(L=>'<div class="m-step"><span class="ms-n">'+L.n+'</span><div><b>'+_esc(L.title)+'</b> — '+_esc(L.desc)+'<div class="ms-c">Контент: '+_esc(L.content)+' · Воронка: '+_esc(L.funnel)+'</div></div></div>').join('')+'<div class="kb-note">'+_esc(KB.hunt.note)+'</div></div>';
  const fun='<div class="m-card"><div class="m-h">🌪️ Воронка просмотров — 3 категории зрителей</div><div class="f-grid">'+KB.funnel.cats.map(c=>'<div class="f-cat"><b>'+_esc(c.name)+'</b><div>Зачем смотрит: '+_esc(c.why)+'</div><div>Важно: '+_esc(c.need)+'</div><div class="f-hook">Цепляет: '+_esc(c.hook)+'</div></div>').join('')+'</div><div class="kb-callout" style="margin-top:10px">⚖️ '+_esc(KB.funnel.ratio)+'</div></div>';
  const extra='<div class="m-card"><div class="m-h">📌 Ещё из методики</div><div class="kb-note"><b>Золотые темы:</b> '+_esc(KB.goldenTopics.def)+' '+_esc(KB.goldenTopics.how)+'</div><div class="kb-note"><b>«Мёртвые души»:</b> '+_esc(KB.goldenTopics.warn)+'</div><div class="kb-note"><b>КАПС:</b> '+_esc(KB.caps.rule)+'</div><div class="kb-note"><b>SEO/теги:</b> '+_esc(KB.seo.tags)+'</div></div>';
  const vtypes='<div class="m-card"><div class="m-h">🎬 3 типа видео и воронка</div>'+KB.videoTypes.items.map(x=>'<div class="m-step"><div><b>'+_esc(x.t)+'</b> — цель: '+_esc(x.goal)+'<div class="ms-c">Как: '+_esc(x.how)+'</div><div class="ms-c">'+_esc(x.note)+'</div></div></div>').join('')+'<div class="kb-callout" style="margin-top:8px">⚖️ '+_esc(KB.videoTypes.note)+'</div></div>';
  const tower='<div class="m-card"><div class="m-h">🧱 '+_esc(KB.scenarioCubes.name)+'</div><div class="kb-note">'+_esc(KB.scenarioCubes.note)+'</div>'+KB.scenarioCubes.cubes.map(c=>'<div class="m-step"><b>'+_esc(c.c)+' · '+_esc(c.name)+'</b> — '+_esc(c.d)+'</div>').join('')+'</div>';
  const thumbs='<div class="m-card"><div class="m-h">🖼️ '+_esc(KB.thumbnailTechniques.name)+'</div><div class="kb-note">'+_esc(KB.thumbnailTechniques.note)+'</div><div class="kb-sub">Правила:</div><ul class="kb-ul">'+KB.thumbnailTechniques.rules.map(r=>'<li>'+_esc(r)+'</li>').join('')+'</ul><div class="kb-sub">Техники:</div><div class="hk-grid">'+KB.thumbnailTechniques.techniques.map(t=>'<div class="hk-card"><div class="hk-n">'+_esc(t.n)+'</div><div class="hk-d">'+_esc(t.d)+'</div></div>').join('')+'</div></div>';
  const shorts='<div class="m-card"><div class="m-h">⚡ '+_esc(KB.shortsParams.name)+'</div><div class="kb-note">'+_esc(KB.shortsParams.note)+'</div><ul class="kb-ul">'+KB.shortsParams.params.map(p=>'<li>'+_esc(p)+'</li>').join('')+'</ul><div class="kb-callout">'+_esc(KB.shortsParams.rule)+'</div></div>';
  const spk='<div class="m-card"><div class="m-h">🎤 '+_esc(KB.speakerTypes.name)+'</div>'+KB.speakerTypes.items.map(s=>'<div class="m-step"><b>'+_esc(s.t)+'</b> — '+_esc(s.how)+'</div>').join('')+'</div>';
  const seo2='<div class="m-card"><div class="m-h">🔎 '+_esc(KB.seoDeep.name)+'</div><div class="kb-note">'+_esc(KB.seoDeep.note)+'</div><div class="kb-note"><b>Теги:</b> '+_esc(KB.seoDeep.tagMix)+'</div><div class="kb-note"><b>Название:</b> '+_esc(KB.seoDeep.title)+'</div><div class="kb-sub">Лайфхаки:</div><ul class="kb-ul">'+KB.seoDeep.lifehacks.map(l=>'<li>'+_esc(l)+'</li>').join('')+'</ul><div class="kb-callout">'+_esc(KB.seoDeep.lifecycle)+'</div></div>';
  el.innerHTML=visp+hunt+fun+vtypes+tower+thumbs+shorts+spk+seo2+extra;
}

/* --- мастер-рендер --- */
function renderProducer(){
  try{kbContentPlan();}catch(e){}
  try{renderQuality();}catch(e){}
  try{kbHooks();}catch(e){}
  try{runPreviewLab();}catch(e){}
}

let STATE={};
const STEPS=[
  {id:'resolve',label:'Резолвлю канал по ссылке'},
  {id:'channel',label:'Загружаю данные канала'},
  {id:'videos',label:'Собираю последние видео'},
  {id:'classify',label:'Считаю метрики · делю Shorts / длинные'},
  {id:'topics',label:'Разбиваю канал на темы и рубрики'},
  {id:'competitors',label:'Ищу похожие каналы по темам'},
  {id:'ai',label:'Анализирую через Viora AI'}
];
function renderSteps(){
  $('#steps').innerHTML=STEPS.map(s=>`<div class="step" data-s="${s.id}"><span class="ic"></span><span>${s.label}</span></div>`).join('');
}
function setStep(id,state){
  const el=$(`.step[data-s="${id}"]`);if(!el)return;
  STEPS.forEach((s,i)=>{const e=$(`.step[data-s="${s.id}"]`);});
  document.querySelectorAll('.step').forEach(e=>{});
  el.className='step '+state;
  el.querySelector('.ic').innerHTML = state==='active'?'<span class="sp"></span>':'';
}

async function startAnalysis(){
  const raw=$('#urlInput').value.trim();
  if(!raw){$('#urlInput').focus();return;}
  $('#hero').style.display='none';$('#dashboard').style.display='none';
  $('#loading').style.display='flex';renderSteps();
  $('#loadTitle').textContent='Анализирую канал…';
  window.scrollTo(0,0);
  try{
    setStep('resolve','active');
    const parsed=parseInput(raw);
    if(!parsed)throw new Error('Не похоже на ссылку YouTube. Проверьте адрес.');
    const chId=await resolveChannelId(parsed);
    setStep('resolve','done');

    setStep('channel','active');
    const channel=await getChannel(chId);
    if(channel.videoCount===0)throw new Error('На канале «'+channel.title+'» нет публичных видео для анализа.');
    setStep('channel','done');

    setStep('videos','active');
    const ids=await getUploads(channel.uploads,200);
    if(!ids.length)throw new Error('Не удалось получить список видео (возможно, канал приватный).');
    const videos=await getVideos(ids);
    setStep('videos','done');

    setStep('classify','active');
    const shorts=videos.filter(v=>v.isShort),streams=videos.filter(v=>v.isStream),longs=videos.filter(v=>!v.isShort&&!v.isStream);
    const groups={shorts:classify(shorts),longs:classify(longs),streams:classify(streams)};
    STATE={channel,videos,shorts,longs,streams,groups};
    setStep('classify','done');

    setStep('topics','active');
    $('#loadTitle').textContent='Определяю темы и рубрики канала…';
    const topicBase = longs.length>=4 ? longs : videos;
    let topicDefs;
    try{ const at=await aiTopics(topicBase); topicDefs=at&&at.topics; STATE.primaryNiche=(at&&at.primary)||''; }
    catch(e){ console.warn('aiTopics failed',e); }
    if(!topicDefs||!topicDefs.length)topicDefs=heuristicTopics(topicBase);
    STATE.topics=computeTopicStats(topicDefs,topicBase).topics;
    STATE.roadmap=computeRoadmap(videos);STATE.triggerStats=computeTriggerStats(videos);STATE.triggerCombos=computeTriggerCombos(videos);STATE.titleBoosts=suggestTitleBoosts(videos);
    setStep('topics','done');

    setStep('competitors','active');
    $('#loadTitle').textContent='Изучаю каналы-конкуренты по твоим темам…';
    let competitors=[];
    try{
      const compIds=await findCompetitors(channel,videos,STATE.topics);
      const built=await Promise.all(compIds.slice(0,12).map(cid=>buildCompetitor(cid)));
      competitors=built.filter(c=>c&&c.vids.length>=1)
        .sort((a,b)=>b.avgViews-a.avgViews).slice(0,10);
    }catch(e){reportError('поиск конкурентов',e,'Не удалось подобрать конкурентов (часто это исчерпанная квота поиска YouTube) — разбор продолжится без них.');}
    STATE.competitors=competitors;
    setStep('competitors','done');

    setStep('ai','active');
    $('#loadTitle').textContent='AI изучает закономерности…';
    $('#loadSub').textContent='Глубокий разбор может занять до 1–2 минут — это нормально';
    let ai=null;
    const _pl=buildMistralPayload(channel,groups,competitors);
    /* Жёсткий общий дедлайн на AI-шаг: 3 минуты. Раньше каскад ретраев
       (multipass → fallback → критик, каждый со своими повторами) мог
       крутиться 15-30 минут и выглядел как зависание. */
    const _AI_DEADLINE=180000;
    const _deadline=new Promise(res=>setTimeout(()=>res('__timeout__'),_AI_DEADLINE));
    const _aiWork=(async()=>{
      /* Сначала быстрый одиночный разбор (1 запрос + критик, обычно 30-60 сек).
         Тяжёлый мультипасс (4+ запроса) раньше шёл первым и никогда не
         укладывался в дедлайн — из-за этого AI-шаг «зависал» и всегда падал
         в оффлайн-режим. Теперь мультипасс — только запасной путь. */
      try{ return await callMistral(_pl); }
      catch(e){
        console.warn('Single-pass failed, fallback to multipass',e);
        try{ return await callMistralMultipass(_pl); }
        catch(e2){ console.warn('Multipass failed too',e2); return null; }
      }
    })();
    const _res=await Promise.race([_aiWork,_deadline]);
    if(_res==='__timeout__'||_res==null){
      reportError('AI-разбор',new Error(_res==='__timeout__'?'AI не уложился в 3 минуты':'AI недоступен'),'Viora AI сейчас перегружена — показываю разбор по цифрам (оффлайн-режим). Попробуй обновить анализ позже.');
      STATE.aiError=true;
    }else{ ai=_res; }
    STATE.ai=validateAudit(ai);
    setStep('ai','done');

    await sleep(350);
    renderDashboard();
  }catch(err){
    console.error(err);
    showError(err);
  }
}

function showError(err){
  let msg=err.message||'Неизвестная ошибка';
  let hint='';
  if(err.reason==='quotaExceeded'||err.status===403&&/quota/i.test(msg)){msg='Превышена дневная квота YouTube API.';hint='Попробуйте позже — лимит обновляется раз в сутки.';}
  else if(err.status===403){hint='Возможно, проблема с доступом к API или ключом.';}
  else if(/не найден|не удалось найти/i.test(msg)){hint='Проверьте ссылку — поддерживаются форматы @handle, /channel/UC..., /c/, /user/ и ссылка на видео.';}
  $('#loading').style.display='none';
  $('#dashboard').style.display='block';
  $('#dashboard').innerHTML=`<div class="section"><div class="err-box"><span class="x">⚠️</span><div>
    <b style="font-size:16px;display:block;margin-bottom:6px">Не получилось проанализировать</b>
    ${esc(msg)}${hint?`<div style="margin-top:8px;color:#e7c9cf">${esc(hint)}</div>`:''}
    <div style="margin-top:16px"><button class="btn" onclick="goHome()">← Попробовать другую ссылку</button></div>
  </div></div></div>`;
  window.scrollTo(0,0);
}

/* ===================================================================== */
/*  RENDER DASHBOARD                                                     */
/* ===================================================================== */
let CURRENT='longs';let charts={};
function renderDashboard(){
  $('#loading').style.display='none';
  $('#dashboard').style.display='block';
  const {channel,shorts,longs,streams,groups,ai}=STATE;
  CURRENT = longs.length>0 ? 'longs' : (shorts.length>0 ? 'shorts' : ((streams&&streams.length) ? 'streams' : 'longs'));
  const score = ai?.score!=null ? Math.round(ai.score) : computeScore();
  const sb = ai?.score_breakdown?.length ? ai.score_breakdown : defaultBreakdown();

  $('#dashboard').innerHTML=`
  <div id="report">
  <!-- header -->
  <div class="section" style="margin-top:24px">
    <div class="card">
      <div style="display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center">
        <div class="ch-head">
          <img src="${safeImg(channel.avatar)}" alt="" onerror="this.style.display='none'"/>
          <div class="ch-meta">
            <h2>${esc(channel.title)}</h2>
            <div class="handle">${esc(channel.handle||'')}</div>
            <div class="ch-stats">
              <div class="ch-stat"><div class="v">${channel.hiddenSubs?'—':fmt(channel.subs)}</div><div class="l">Подписчиков</div></div>
              <div class="ch-stat"><div class="v">${fmt(channel.videoCount)}</div><div class="l">Видео</div></div>
              <div class="ch-stat"><div class="v">${fmt(channel.totalViews)}</div><div class="l">Просмотров</div></div>
              <div class="ch-stat"><div class="v">${shorts.length}/${longs.length}${(streams&&streams.length)?'/'+streams.length:''}</div><div class="l">Shorts / Длинные${(streams&&streams.length)?' / Стримы':''}</div></div>
            </div>
          </div>
        </div>
        <div class="score-wrap">
          <div class="score-ring">
            <svg width="96" height="96"><circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.08)" stroke-width="8" fill="none"/>
            <circle cx="48" cy="48" r="42" stroke="url(#g1)" stroke-width="8" fill="none" stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*42}" stroke-dashoffset="${2*Math.PI*42*(1-score/100)}"/>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF0000"/><stop offset="1" stop-color="#FF2D55"/></linearGradient></defs></svg>
            <div class="num" data-count="${score}">0<small>скор</small></div>
          </div>
          <div style="font-size:12.5px;color:var(--muted);max-width:130px">Оценка здоровья канала по ${sb.length} факторам</div>
        </div>
      </div>
    </div>
  </div>

  <!-- profile banner (Этап 3) -->
  <div id="profileBanner" class="section" style="display:none"></div>

  <!-- 1. MAIN LEAK verdict -->
  <div class="section">
    <div class="verdict">
      <div class="lab">🩺 Главная утечка роста${STATE.aiError?' · оффлайн-режим':''}</div>
      <h3>${esc(ai?.main_leak||fallbackLeak())}</h3>
      ${ai?.leak_tag?`<span class="leak-tag">⚑ ${esc(ai.leak_tag)}</span>`:''}
    </div>
  </div>

  <!-- WEEK FOCUS: 3 главных шага -->
  <div class="section" id="weekFocusSection" style="display:none">
    <div class="section-h"><h2>🎯 Фокус недели — 3 шага</h2><div class="desc">Самое важное из всего разбора, без перегруза. Сделай эти три вещи на этой неделе — остальные секции ниже подождут.</div></div>
    <div class="wkf" id="weekFocusArea"></div>
  </div>

  <!-- NEXT SHOOT: полный план следующего видео -->
  <div class="section" id="nextShootSection">
    <div class="section-h"><h2>🎬 Твоё следующее видео — план от продюсера</h2><div class="desc">Одна кнопка — и у тебя полный план съёмки: тема, которая уже доказала спрос у тебя или в нише, готовые заголовки, дословный хук на первые 15 секунд, структура с таймингом, превью, время выхода и чек-лист перед заливкой. Снимай по шагам — даже если это твой первый ролик.</div></div>
    <div class="card" id="nextShootCard">
      <div class="ns-cta"><button class="pbtn" id="nsBtn" onclick="buildNextShoot()">⚡ Собрать план следующего видео</button><span class="ns-note">ИИ собирает план из данных твоего канала · ~20 секунд</span></div>
      <div id="nextShootOut"></div>
      <div id="shootsArea"></div>
    </div>
  </div>

  <!-- MY CHANNEL: реальные метрики через Google OAuth -->
  <div class="section" id="myStatsSection" style="display:none">
    <div class="section-h"><h2>📈 Подключённый канал — реальные метрики</h2><div class="desc">Появляется после «Подключить канал»: разовая передача данных из YouTube API, только чтение. Это не вход и не аккаунт на сайте. Реальное удержание, время просмотра и подписки за 28 дней — цифры, которых нет у конкурентов.</div></div>
    <div id="myStatsArea"></div>
  </div>


  <!-- concrete changes: what to change, no fluff -->
  <div class="section" id="concreteSection" style="display:none">
    <div class="section-h"><h2>🛠️ Что конкретно менять</h2><div class="desc">Без воды — точечные действия под этот канал, по приоритету. Каждое привязано к ролику/рубрике и ожидаемому эффекту.</div></div>
    <div class="concrete" id="concreteArea"></div>
  </div>

  <!-- TRIGGER LAB -->
  <div class="section" id="triggerSection" style="display:none">
    <div class="section-h"><h2>🎣 Лаборатория триггеров</h2><div class="desc">Какие крючки в заголовках реально поднимают просмотры — посчитано на данных твоего канала. Зелёные работают, синие тянут вниз. Ниже — сильные связки, пробелы против конкурентов и черновики переписанных слабых заголовков (клик — скопировать).</div></div>
    <div id="triggerArea"></div>
  </div>

  <!-- MOMENTUM -->
  <div class="section">
    <div class="section-h"><h2>🚀 Моментум канала</h2><div class="desc">Ускоряется канал или затухает. Сравниваем свежие ролики со старыми — это видит и алгоритм YouTube. <span class="howcalc" title="Сравнение идёт с поправкой на возраст роликов: каждый ролик оценивается относительно нормы канала для видео его возраста. Без этой поправки свежие ролики всегда выглядели бы лучше старых, и тренд был бы ложным.">ℹ️ как считается</span></div></div>
    <div id="momentum"></div>
  </div>

  <!-- HISTORY / dynamics -->
  <div class="section">
    <div class="section-h"><h2>📈 Динамика канала</h2><div class="desc">Как меняются подписчики, просмотры и вовлечённость от замера к замеру. Запускай анализ периодически — история копится прямо в браузере.</div></div>
    <div id="historyArea"></div>
  </div>

  <!-- roadmap: the channel's journey -->
  <div class="section">
    <div class="section-h"><h2>🧭 Путь канала</h2><div class="desc">Хронология ключевых поворотов: когда сменился формат, что выстрелило, как менялся темп. Видно, какие решения привели к росту.</div></div>
    <div id="roadmapArea"></div>
  </div>

  <!-- toggle -->
  <div class="section">
    <div class="section-h"><h2>📊 Аудит роликов: Shorts и длинные — отдельно</h2>
      <div class="desc">Shorts, длинные ролики и стримы анализируются отдельно — у них разная механика и базовый уровень просмотров. «Залетело» и «не зашло» считаются относительно уровня <b>самого канала</b>, а не абсолютных чисел. <span class="howcalc" title="Каждый ролик сравнивается с медианой роликов своего возраста на канале (когорты: до недели, до месяца, до 3 месяцев и т.д.). Так старые видео не выглядят провалами только потому, что просмотры уже не растут, а свежие — хитами только потому, что они новые.">ℹ️ как считается</span></div>
    </div>
    <div id="fmtAudit" class="fmt-audit"></div>
    <div class="toggle" id="toggle">
      <button data-g="longs" onclick="switchGroup('longs')"><span>🎬 Длинные</span><span class="cnt">${longs.length}</span></button>
      <button data-g="shorts" onclick="switchGroup('shorts')"><span>⚡ Shorts</span><span class="cnt">${shorts.length}</span></button>
      ${(streams&&streams.length)?`<button data-g="streams" onclick="switchGroup('streams')"><span>🔴 Стримы</span><span class="cnt">${streams.length}</span></button>`:''}
    </div>
    <div id="groupArea"></div>
    <div class="bulk-cta" id="bulkCta">
      <div class="bc-txt"><b>🔬 Глубокий разбор всех роликов</b><span>AI пройдётся по каждому ролику канала: вердикт, причина и главный фикс — плюс общий вывод.</span></div>
      <button class="btn" style="white-space:nowrap" onclick="analyzeAllVideos()">Разобрать все ролики →</button>
    </div>
    <div id="bulkArea"></div>
  </div>

  <!-- charts -->
  <div class="section">
    <div class="section-h"><h2>📈 Графики</h2><div class="desc">Наглядное распределение результатов по те��ущей группе.</div></div>
    <div class="chart-grid">
      <div class="chart-box"><h4>Распределение просмотров/день</h4><div class="ch-sub">Каждый столбик — видео. Видно разброс между хитами и провалами.</div><canvas id="chartViews"></canvas></div>
      <div class="chart-box"><h4>Вовлечённость по времени</h4><div class="ch-sub">Engagement (%) в зависимости от даты публикации.</div><canvas id="chartEng"></canvas></div>
    </div>
  </div>

  <!-- 4. heatmap -->
  <div class="section">
    <div class="section-h"><h2>🗓️ Когда постить</h2><div class="desc">Результат роликов по дню недели и времени суток публикации. Ярче = лучше заходит. <span class="howcalc" title="Считается по результату роликов относительно нормы канала для их возраста — поэтому ячейки со свежими видео не светятся просто из-за того, что видео новые. Если данных мало, относись к карте как к ориентиру.">ℹ️ как считается</span></div></div>
    <div class="card"><div class="heat-wrap" id="heatmap"></div>
      <div class="heat-legend"><span>меньше</span><div class="grad"></div><span>больше просмотров</span></div>
    </div>
  </div>

  <!-- 5. hit formula + patterns -->
  <div class="section">
    <div class="section-h"><h2>🧬 Твоя формула хита</h2><div class="desc">Общие черты роликов, которые залетали. Применяй как чек-лист к следующему видео.</div></div>
    <div class="card"><div class="formula" id="formula"></div></div>
  </div>

  <!-- title patterns -->
  <div class="section" id="patternsSection" style="display:none">
    <div class="section-h"><h2>🏷️ Шаблоны заголовков</h2><div class="desc">Конкретные формулировки, которые работают на твоём канале — бери и подставляй свою тему.</div></div>
    <div class="patterns" id="titlePatterns"></div>
  </div>

  <!-- next video ideas -->
  <div class="section" id="ideasSection" style="display:none">
    <div class="section-h"><h2>💡 Идеи для следующих видео</h2><div class="desc">Готовые концепты на основе того, что у тебя уже залетало. С прогнозом и форматом.</div></div>
    <div class="ideas" id="nextIdeas"></div>
  </div>

  <!-- 9. topics -->
  <div class="section" id="topicsSection">
    <div class="section-h"><h2>🗂️ Анализ по темам и рубрикам</h2><div class="desc">Канал разбит на смысловые рубрики. Видно, какие темы реально приносят просмотры, а какие тянут вниз — с лучшим и худшим роликом каждой темы и выводом.</div></div>
    <div id="topicArea"></div>
  </div>

  <!-- niche by topic: what to film to take off -->
  <div class="section" id="nicheTopicSection" style="display:none">
    <div class="section-h"><h2>🎯 Что снять по каждой теме</h2><div class="desc">Залетевшие ролики конкурентов в твоих темах — готовые идеи, которые уже доказали спрос. Сними свою версию и поймай волну.</div></div>
    <div id="nicheTopicArea"></div>
  </div>

  <!-- PRODUCER: GUIDED WIZARD (Этап 4) -->
  <div class="section">
    <div class="section-h"><h2>🎙️ Продюсер ведёт</h2><div class="desc">Пошаговый режим: ИИ ведёт от темы до готовой упаковки, сценария и плана публикации — как личный продюсер. Помнит твой канал между заходами.</div></div>
    <div class="card wiz" id="wizCard">
      <div id="wizMem" class="wiz-mem" hidden></div>
      <div id="wizSteps" class="wiz-steps"></div>
      <div class="wiz-body">
        <div class="wiz-step" id="wizStep1">
          <div class="wiz-q">Шаг 1. О чём ролик?</div>
          <div class="wiz-grid">
            <label class="wiz-f"><span>Тема ролика *</span><input id="wzTopic" type="text" placeholder="например: как новичку начать инвестировать"/></label>
            <label class="wiz-f"><span>Боль зрителя</span><input id="wzPain" type="text" placeholder="чего боится / что не получается"/></label>
            <label class="wiz-f"><span>Аудитория</span><input id="wzAud" type="text" placeholder="кто смотрит канал"/></label>
            <label class="wiz-f"><span>Спикер (необязательно)</span><input id="wzSpeaker" type="text" placeholder="кто в кадре"/></label>
            <label class="wiz-f"><span>Продукт (необязательно)</span><input id="wzProduct" type="text" placeholder="что продаём, если есть"/></label>
          </div>
          <div class="wiz-nav"><span></span><button class="pbtn" onclick="wizStart()">Дальше → собрать упаковку</button></div>
        </div>
        <div class="wiz-step" id="wizStep2" hidden>
          <div class="wiz-q">Шаг 2. Упаковка — выбери заголовок</div>
          <div id="wzPackOut" class="wiz-out"></div>
          <div class="wiz-nav"><button class="pbtn ghost" onclick="wizGo(1)">← Назад</button><span><button class="pbtn ghost" onclick="wizRunPackaging()">↻ Ещё варианты</button> <button class="pbtn" onclick="wizToScenario()">Дальше → сценарий</button></span></div>
        </div>
        <div class="wiz-step" id="wizStep3" hidden>
          <div class="wiz-q">Шаг 3. Сценарий по сценарной башне</div>
          <div id="wzScenOut" class="wiz-out"></div>
          <div class="wiz-nav"><button class="pbtn ghost" onclick="wizGo(2)">← Назад</button><span><button class="pbtn ghost" onclick="wizRunScenario()">↻ Пересобрать</button> <button class="pbtn" onclick="wizToPlan()">Дальше → план</button></span></div>
        </div>
        <div class="wiz-step" id="wizStep4" hidden>
          <div class="wiz-q">Шаг 4. План публикации</div>
          <div id="wzPlanOut" class="wiz-out"></div>
          <div class="wiz-nav"><button class="pbtn ghost" onclick="wizGo(3)">← Назад</button><span><button class="pbtn ghost" onclick="wizReset()">⟲ Новый ролик</button> <button class="pbtn" onclick="wizSaveMem()">💾 Запомнить для канала</button></span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- WEEKLY -->
  <div class="section">
    <div class="section-h"><h2>🗓️ Недельный разбор</h2><div class="desc">Возвращайся раз в неделю: я сравниваю замеры канала, показываю динамику и собираю фокус-план на 7 дней. Замеры копятся прямо в браузере — ничего настраивать не нужно.</div></div>
    <div class="card wk" id="wkCard">
      <div id="wkDelta" class="wk-delta"></div>
      <div class="wk-cta"><button class="pbtn" onclick="wkBuild()">📋 Собрать разбор и план на неделю (ИИ)</button></div>
      <div id="wkOut" class="wk-out"></div>
    </div>
  </div>

  <!-- PRODUCER: TOOLS -->
  <div class="section">
    <div class="section-h"><h2>🧰 Быстрые проверки</h2><div class="desc">Мини-инструменты перед публикацией: заголовок по ВИСП, цвета превью и другие утилиты.</div></div>
    <div class="prod-grid">
      <div class="prod-tool">
        <h3>🧪 Анализатор заголовка и превью</h3>
        <div class="sub">Проверка заголовка по формуле ВИСП и подбор цветов превью под аудиторию.</div>
        <input id="pvTitle" class="pin" placeholder="Заголовок будущего ролика"/>
        <select id="pvAud" class="pin">
          <option value="">Аудитория превью…</option>
          <option value="Младшая аудитория">Младшая аудитория</option>
          <option value="Старшая аудитория">Старшая аудитория</option>
          <option value="Женская ЦА">Женская ЦА</option>
          <option value="Мужская ЦА">Мужская ЦА</option>
        </select>
        <button class="pbtn" onclick="runPreviewLab()">Проверить заголовок и превью</button>
        <button class="pbtn" onclick="runPackaging()" style="margin-top:8px">🎁 Собрать упаковку (ИИ): заголовки + хук + бриф превью</button>
        <div id="pvOut"></div>
        <div id="pkOut"></div>
      </div>
      <div class="prod-tool">
        <h3>📝 Генератор сценариев</h3>
        <div class="sub">5 шаблонов из методики + авто-проверка по 7 ошибкам сценария.</div>
        <input id="scTopic" class="pin" placeholder="Тема ролика *"/>
        <div class="pin-row">
          <select id="scFormat" class="pin">
            <option value="tower">🧱 Сценарная башня (по кубикам)</option>
            <option value="thesis">Тезисный сценарий</option>
            <option value="full">Полный (спикер+продукт)</option>
            <option value="role">Ролевой (от лица спикера)</option>
            <option value="shorts">Шортс</option>
          </select>
          <input id="scAud" class="pin" placeholder="Целевая аудитория"/>
        </div>
        <div class="pin-row">
          <input id="scSpeaker" class="pin" placeholder="Спикер (опц.)"/>
          <input id="scProduct" class="pin" placeholder="Продукт (опц.)"/>
        </div>
        <input id="scPain" class="pin" placeholder="Боль зрителя (опц.)"/>
        <button class="pbtn" onclick="runScenario()">✍️ Написать сценарий</button>
        <div id="scOut"></div>
      </div>
    </div>
  </div>

  <!-- PRODUCER: CONTENT PLAN -->
  <div class="section">
    <div class="section-h"><h2>📅 Контент-план по Лестнице Ханта</h2><div class="desc">Готовый план на месяц под твои сильные темы: баланс хайп/экспертное/продающее, каждый ролик привязан к ступени осознанности зрителя.</div></div>
    <div id="prodPlan"></div>
  </div>

  <!-- PRODUCER: QUALITY -->
  <div class="section">
    <div class="section-h"><h2>✅ Чек-лист качества роликов</h2><div class="desc">Авто-оценка каждого ролика по хуку, вовлечению и упаковке заголовка (ВИСП) — с конкретным рецептом, что починить.</div></div>
    <div id="prodQuality"></div>
  </div>

  <!-- PRODUCER: HOOKS -->
  <div class="section">
    <div class="section-h"><h2>🎣 Заходы (опенинги)</h2><div class="desc">Библиотека сильных заходов для первых 30 секунд — самого важного отрезка для удержания.</div></div>
    <div id="prodHooks"></div>
  </div>

  <!-- TITLE LAB -->
  <div class="section">
    <div class="section-h"><h2>🧪 Лаборатория заголовков</h2><div class="desc">Введи тему ролика — AI сгенерирует 10 готовых заголовков по <b>твоей формуле хита</b> и приёмам конкурентов. Нажми на заголовок, чтобы скопировать.</div></div>
    <div class="lab-shell">
      <div class="lab-form">
        <input id="labTopic" placeholder="Тема будущего ролика — например: монтаж в CapCut для новичков"/>
        <button class="btn" onclick="runTitleLab()">✨ Сгенерировать 10 заголовков</button>
      </div>
      <div class="lab-out" id="labOut"><div class="muted" style="padding:14px 2px">Введи тему выше и получи пачку кликабельных заголовков под твой канал 🧪</div></div>
    </div>
    <div class="ab-mem" id="abArea"></div>
  </div>

  <!-- 7. competitors -->
  <div class="section">
    <div class="section-h"><h2>🥊 Конкуренты — лицом к лицу</h2><div class="desc">Похожие каналы по твоей тематике. Добавь своего вручную для точного сравнения.</div></div>
    <div class="comp-add">
      <input id="compInput" placeholder="Вставь ссылку на канал конкурента (@handle или /channel/...)"/>
      <button class="btn ghost sm" onclick="addCompetitor()">+ Добавить</button>
    </div>
    <div class="comp-grid" id="competitors"></div>
    <div class="compare-wrap" id="compareWrap"></div>
    ${ai?.versus?.length?`<div class="section-h" style="margin-top:24px"><h2 style="font-size:19px">⚔️ Где они обгоняют</h2></div><div class="bullets" id="versus"></div>`:''}
  </div>

  <!-- NICHE benchmark -->
  <div class="section">
    <div class="section-h"><h2>📊 Бенчмарк по нише</h2><div class="desc">Твои метрики против среднего по найденным конкурентам — видно, где ты опережаешь нишу, а где отстаёшь.</div></div>
    <div id="nicheArea"></div>
  </div>

  <!-- content ideas mined from competitors -->
  <div class="section" id="borrowSection" style="display:none">
    <div class="section-h"><h2>💡 Что снять, чтобы залетело</h2><div class="desc">Проверенные темы и форматы, которые уже выстреливают у похожих каналов — адаптированы под твой канал. Бери и снимай.</div></div>
    <div class="borrow-grid" id="borrowIdeas"></div>
  </div>

  <!-- 8 + audit -->
  <div class="section">
    <div class="section-h"><h2>🎯 Контент-аудит и план на 30 дней</h2><div class="desc">Приоритизированный план-задачник. Отмечай галочками выполненное.</div></div>
    <div class="card"><div class="plan-progress"><div class="pp-bar"><span id="planProg" style="width:0%"></span></div><div class="pp-lab" id="planProgLab">0 из 0 · 0%</div></div><div class="plan" id="plan"></div></div>
  </div>

  ${ai?.competitor_takeaways?.length?`<div class="section"><div class="section-h"><h2 style="font-size:20px">💡 Что перенять у конкурентов</h2></div><div class="bullets" id="takeaways"></div></div>`:''}
  </div>

  <!-- export -->
  <div class="section">
    <div class="fab-bar">
      <button class="btn" onclick="exportPDF(event)">📄 Скачать PDF-отчёт</button>
      <button class="btn ghost" onclick="window.v8PdfFull&&v8PdfFull(event)">📋 Полный дашборд в PDF</button>
      <button class="btn ghost" onclick="window.vShareImage&&vShareImage()">🖼 Карточка результата</button>
      <button class="btn ghost" onclick="window.vShareLink&&vShareLink(this)">🔗 Ссылка на аудит</button>
      <button class="btn ghost" onclick="goHome()">← Новый анализ</button>
    </div>
    <div class="note">PDF-отчёт — компактная выжимка на 1-2 страницы. «Полный дашборд» — скрин всего отчёта целиком. «Ссылка на аудит» — короткая ссылка с выжимкой: открывается без анализа и без ключей.</div>
  </div>
  `;

  // toggle initial state
  document.querySelector(`#toggle button[data-g="${CURRENT}"]`).classList.add('on');
  renderProfileBanner();
  renderGroup();
  renderFormula();
  renderTopicAnalytics();
  renderRoadmap();
  renderFormatAudit();
  renderAbTitles();
  renderConcrete();
  renderNicheTopics();renderTriggerLab();renderProducer();
  renderCompetitors();
  renderVersus();
  renderTakeaways();
  renderPlan();
  renderPatterns();
  renderIdeas();
  renderBorrow();
  try{var _dash=document.getElementById('dashboard');vHumanize(_dash);vGlossify(_dash);}catch(e){}
  renderMomentum();
  try{renderWeekFocus();}catch(e){reportError('фокус недели',e,false);}
  try{if(STATE.nextShoot)renderNextShoot(STATE.nextShoot);else restoreShootForChannel();}catch(e){reportError('план видео',e,false);}
  try{renderShootsList();}catch(e){}
  try{if(window.vTourMaybe)setTimeout(window.vTourMaybe,1100);}catch(e){}
  try{if(window.vMyStatsMaybe)window.vMyStatsMaybe();}catch(e){}
  renderHistory();
  renderCompare();
  renderNiche();
  mountChat();
  countUp();
  window.scrollTo(0,0);
}

/* ===================================================================== */
/*  ФОКУС НЕДЕЛИ: 3 главных шага из всего разбора                          */
/* ===================================================================== */
function renderWeekFocus(){
  const sec=$('#weekFocusSection'),area=$('#weekFocusArea');if(!sec||!area)return;
  try{
    const ai=STATE.ai||{};const items=[];
    const seen=new Set();
    const txt=x=>{if(x==null)return '';if(typeof x==='string')return x;if(Array.isArray(x))return x.map(txt).filter(Boolean).join(', ');if(typeof x==='object')return Object.values(x).map(txt).filter(Boolean).join(' — ');return String(x);};
    const push=(t,why)=>{t=txt(t);why=txt(why);const k=String(t||'').toLowerCase().slice(0,60);if(!t||seen.has(k)||items.length>=3)return;seen.add(k);items.push({t,why:why||''});};
    (ai.action_plan||[]).filter(s=>s&&s.priority==='high').sort((a,b)=>(a.week||9)-(b.week||9)).forEach(s=>push(s.step,s.why));
    (ai.concrete_changes||[]).filter(c=>c&&c.priority==='high').forEach(c=>push(c.change,(c.target?('Где: '+txt(c.target)+'. '):'')+txt(c.effect)));
    (ai.action_plan||[]).filter(s=>s&&s.priority!=='high').forEach(s=>push(s.step,s.why));
    /* эвристики, если AI недоступен или дал мало шагов */
    if(items.length<3){
      const sig=STATE.signals||{};
      if(sig.posting&&sig.posting.medianGapDays>10)push('Выпускай чаще: сейчас ролик выходит раз в ~'+Math.round(sig.posting.medianGapDays)+' дней','Регулярность — один из главных сигналов для алгоритма. Цель: хотя бы раз в неделю.');
      if(sig.vispCoverage&&sig.vispCoverage.flopsAvgLetters<sig.vispCoverage.hitsAvgLetters)push('У��иль заголовки: у слабых роликов в среднем '+sig.vispCoverage.flopsAvgLetters+' буквы ВИСП из 4, у хитов — '+sig.vispCoverage.hitsAvgLetters,'Добавляй в заголовок недостающее: '+((sig.vispCoverage.mostMissedInFlops||[]).join(', ')||'выгоду и интригу')+'.');
      const tt=((STATE.topics||[]).filter(t=>t.verdict==='up').sort((a,b)=>(b.medVpd||0)-(a.medVpd||0)))[0];
      if(tt)push('Сними следующий ролик в рубрике «'+tt.name+'»','Это твоя самая сильная тема: ~'+fmt(Math.round(tt.medVpd||0))+' просмотров/день в среднем.');
      if(sig.bestWindow&&sig.bestWindow.day){const _bwN=sig.bestWindow.src==='niche';push((_bwN?'Публикуй в окно хитов ниши: ':'Публикуй в своё лучшее окно: ')+sig.bestWindow.day+', '+(sig.bestWindow.hourRange||''),_bwN?'Своих роликов у канала пока мало, поэтому окно взято из публикаций похожих каналов: в это время выходят их хиты.':'В это окно выходили твои хиты.');}
    }
    if(!items.length){sec.style.display='none';return;}
    sec.style.display='block';
    area.innerHTML=items.slice(0,3).map((it,i)=>`<div class="wkf-i"><div class="n">${i+1}</div><div><b>${esc(it.t)}</b>${it.why?`<div class="w">${esc(it.why)}</div>`:''}</div></div>`).join('');
  }catch(e){reportError('фокус недели',e,false);sec.style.display='none';}
}

/* ===================================================================== */
/*  «ПРОДЮСЕР В КАРМАНЕ»: полный план следующего видео одной кнопкой       */
/* ===================================================================== */
function _nsCopy(text){
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text);
    else{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}
    vToast('Скопировано: '+text.slice(0,60)+(text.length>60?'…':''),'ok',3000);
  }catch(e){reportError('копирование',e,false);}
}
function _nsToggle(el){try{
  const on=el.querySelector('input').checked;el.classList.toggle('don',on);
  if(STATE&&STATE.shootId){const i=el.dataset.i;patchShoot(STATE.shootId,s=>{s.checks=s.checks||{};s.checks[i]=!!on;});renderShootsList();}
}catch(e){}}
function buildNextShootPayload(){
  const ch=STATE.channel||{};const sig=STATE.signals||{};const ai=STATE.ai||{};
  const allG=[...(STATE.shorts||[]),...(STATE.longs||[])];
  const sorted=[...allG].filter(v=>v.xc!=null).sort((a,b)=>b.xc-a.xc);
  const slim=v=>({title:v.title,format:v.isShort?'Shorts':'Длинное',xCohort:+(v.xc||0).toFixed(2),viewsPerDay:Math.round(v.viewsPerDay),engagementPct:+((v.engagement||0)*100).toFixed(2)});
  const compHits=[];(STATE.competitors||[]).forEach(c=>{(c.vids||[]).slice().sort((a,b)=>b.viewsPerDay-a.viewsPerDay).slice(0,2).forEach(v=>compHits.push({channel:c.ch&&c.ch.title,title:v.title,viewsPerDay:Math.round(v.viewsPerDay)}));});
  return{
    channel:{title:ch.title,subs:ch.subs,niche:STATE.primaryNiche||'',shortsCount:(STATE.shorts||[]).length,longsCount:(STATE.longs||[]).length,
      shortsMedianVpd:Math.round((STATE.groups&&STATE.groups.shorts&&STATE.groups.shorts.med)||0),
      longsMedianVpd:Math.round((STATE.groups&&STATE.groups.longs&&STATE.groups.longs.med)||0)},
    audience_profile:(typeof PROFILE!=='undefined'&&PROFILE)?{level:PROFILE.level,context:PROFILE.context,goal:PROFILE.goal||''}:null,
    topTopics:(STATE.topics||[]).filter(t=>t&&t.verdict==='up').sort((a,b)=>(b.medVpd||0)-(a.medVpd||0)).slice(0,3).map(t=>({name:t.name,medianViewsPerDay:Math.round(t.medVpd||0),bestVideo:t.best&&t.best.title})),
    topTriggers:(STATE.triggerStats||[]).filter(t=>t&&t.verdict==='up').sort((a,b)=>(b.lift||0)-(a.lift||0)).slice(0,4).map(t=>({trigger:t.name,liftVsRest:+(t.lift||0).toFixed(2)})),
    myHits:sorted.slice(0,5).map(slim),
    myFlops:sorted.slice(-3).reverse().map(slim),
    competitorHits:compHits.slice(0,6),
    hitFormula:(ai.hit_formula||[]).slice(0,5),
    bestWindow:sig.bestWindow||null,
    postingGapDays:sig.posting?sig.posting.medianGapDays:null
  };
}
async function buildNextShoot(){
  const out=$('#nextShootOut'),btn=$('#nsBtn');if(!out)return;
  if(!STATE||!STATE.channel){vToast('Сначала проанализируй канал.','warn');return;}
  if(btn)btn.disabled=true;
  out.innerHTML='<div class="ns-load"><span class="sp"></span>Продюсер изучает твой канал и собирает план съёмки…</div>';
  try{
    const payload=buildNextShootPayload();
    const sys=`Ты — личный продюсер YouTube-канала. Твоя задача: дать автору ГОТОВЫЙ план следующего видео, по которому даже новичок без опыта снимет сильный ролик. Никаких общих советов — всё конкретно под данные канала. Пиши простым русским языком, дружелюбно, без англицизмов и кодов полей (никаких vpd, CTR, xCohort в тексте — вместо этого «просмотров в день», «во столько-то раз выше нормы канала»).
ПРАВИЛА:
1. Тему бери из того, что УЖЕ доказало спрос: сильные рубрики канала (topTopics), его хиты (myHits, поле xCohort = во сколько раз ролик обогнал ролики своего возраста) или залетевшие у конкурентов темы (competitorHits), которых у автора ещё нет.
2. why — обязательно с цифрами канала: «твой ролик X идёт в N раз выше нормы», «рубрика Y даёт Z просмотров в день».
3. Заголовки строй по ВИСП (Выгода/Интрига/Срочность/Причастность) и сильным триггерам канала (topTriggers). 3 варианта, разные по подходу.
4. hook — ДОСЛОВНЫЙ текст, который автор произносит в первые 10–20 секунд: без приветствий и «в этом видео», сразу боль/интрига/обещание.
5. structure — 4–6 блоков с таймингом, под выбранный формат (Shorts ~30 сек или длинный ролик).
6. thumb — конкретная сцена: что в кадре, какая эмоция, какой текст (до 4 слов), какие цвета.
7. publish — день и время из bestWindow, если есть; иначе предложи разумное и объясни почему.
8. checklist — 6–8 пунктов проверки ПЕРЕД заливкой, по порядку, выполнимых за вечер.
9. pitfalls — 3 ошибки, которые новичок сделает именно в ЭТОМ ролике, и как их избежать.
Верни СТРОГО валидный JSON без markdown:
{"idea":"тема ролика одной фразой","why":"почему зайдёт — с цифрами канала","format":"Shorts|Длинное","duration":"длительность словами","titles":[{"title":"готовый заголовок","note":"что закрывает по ВИСП"}],"hook":"дословный текст первых 10–20 секунд","structure":[{"block":"название блока","what":"что говорить/показывать","time":"0:00–0:30"}],"thumb":{"idea":"что в кадре и какая эмоция","text":"текст на превью","style":"цвета/стиль"},"publish":{"when":"день и время","why":"почему именно тогда"},"checklist":["пункт"],"pitfalls":["ошибка и как избежать"]}`;
    const d=await callMistralRaw(sys,'Собери план следующего видео для этого канала:\n'+JSON.stringify(payload),2600);
    if(!d||typeof d!=='object'||!d.idea)throw new Error('пустой план');
    STATE.nextShoot=d;
    try{STATE.shootId=saveShootPlan(d);}catch(e){}
    renderNextShoot(d);
    try{renderShootsList();}catch(e){}
    vToast('План следующего видео готов 🎬','ok',4000);
  }catch(e){
    reportError('план следующего видео',e,'Не получилось собрать план — Viora AI сейчас недоступна. Попробуй ещё раз через минуту.');
    out.innerHTML='<div class="ns-load" style="color:#ff8da1">Не получилось собрать план. <button class="pbtn ghost" style="margin-left:10px" onclick="buildNextShoot()">Попробовать ещё раз</button></div>';
  }finally{if(btn)btn.disabled=false;}
}
function renderNextShoot(d){
  const out=$('#nextShootOut');if(!out||!d)return;
  try{
    const S=x=>esc(typeof x==='string'?x:(x==null?'':String(x)));
    const titles=(Array.isArray(d.titles)?d.titles:[]).filter(t=>t&&t.title).map(t=>
      `<div class="ns-title-row" onclick="_nsCopy(this.querySelector('.tt').textContent)" title="Нажми, чтобы скопировать"><span class="tt">${S(t.title)}</span>${t.note?`<span class="chip">${S(t.note)}</span>`:''}</div>`).join('');
    const steps=(Array.isArray(d.structure)?d.structure:[]).filter(s=>s&&(s.block||s.what)).map(s=>
      `<li><div><b>${S(s.block)}.</b> ${S(s.what)}</div>${s.time?`<span class="sec">${S(s.time)}</span>`:''}</li>`).join('');
    const checks=(Array.isArray(d.checklist)?d.checklist:[]).filter(Boolean).map((c,i)=>
      `<label data-i="${i}" onclick="_nsToggle(this)"><input type="checkbox"/><span>${S(c)}</span></label>`).join('');
    const pits=(Array.isArray(d.pitfalls)?d.pitfalls:[]).filter(Boolean).map(p=>`<div class="p">⚠️ ${S(p)}</div>`).join('');
    const th=d.thumb||{};const pub=d.publish||{};
    out.innerHTML=`<div class="ns-out">
      <div class="ns-block"><h4>💡 Идея ролика</h4>
        <div style="font-size:16px;font-weight:700;line-height:1.4">${S(d.idea)}</div>
        <div class="ns-meta">${d.format?`<span class="m">${S(d.format)}</span>`:''}${d.duration?`<span class="m">⏱ ${S(d.duration)}</span>`:''}</div>
        ${d.why?`<div class="why">📊 ${S(d.why)}</div>`:''}</div>
      ${titles?`<div class="ns-block"><h4>🏷️ Заголовок — выбери один <span class="howcalc" title="Собраны по формуле ВИСП: Выгода, Интрига, Срочность, Причастность — и по триггерам, которые уже работают на твоём канале">по ВИСП</span></h4>${titles}<div class="why">Клик по заголовку — скопировать.</div></div>`:''}
      ${d.hook?`<div class="ns-block"><h4>🎤 Хук — первые 15 секунд, говори дословно</h4><div class="ns-hook">${S(d.hook)}</div></div>`:''}
      ${steps?`<div class="ns-block"><h4>🧱 Структура ролика</h4><ol class="ns-steps">${steps}</ol></div>`:''}
      ${(th.idea||th.text)?`<div class="ns-block"><h4>🖼️ Превью</h4><div style="font-size:13.5px;line-height:1.55">${th.idea?S(th.idea)+'<br/>':''}${th.text?`Текст на превью: <b>«${S(th.text)}»</b><br/>`:''}${th.style?`<span style="color:var(--muted)">${S(th.style)}</span>`:''}</div></div>`:''}
      ${pub.when?`<div class="ns-block"><h4>📅 Когда публиковать</h4><div style="font-size:14px"><b>${S(pub.when)}</b>${pub.why?` — <span style="color:var(--muted)">${S(pub.why)}</span>`:''}</div></div>`:''}
      ${checks?`<div class="ns-block"><h4>✅ Чек-лист перед заливкой</h4><div class="ns-check">${checks}</div></div>`:''}
      ${pits?`<div class="ns-block"><h4>🚧 Не наступи на эти грабли</h4><div class="ns-pit">${pits}</div></div>`:''}
      <div class="ns-cta"><button class="pbtn ghost" onclick="buildNextShoot()">↻ Собрать другой план</button><button class="pbtn ghost" onclick="exportShootImg('png')">🖼 Скачать картинкой</button><button class="pbtn ghost" onclick="exportShootImg('pdf')">📄 В PDF</button><span class="ns-note">План сохраняется в «Мои съёмки» ниже — не потеряется после закрытия вкладки</span></div>
    </div>`;
    try{const rec=(STATE.shootId&&typeof getShoot==='function')?getShoot(STATE.shootId):null;
      if(rec&&rec.checks){out.querySelectorAll('.ns-check label').forEach(l=>{
        if(rec.checks[l.dataset.i]){l.classList.add('don');const i2=l.querySelector('input');if(i2)i2.checked=true;}});}
    }catch(e){}
  }catch(e){reportError('отрисовка плана видео',e);}
}

/* ===================================================================== */
/*  МОИ СЪЁМКИ: планы видео сохраняются между визитами                     */
/* ===================================================================== */
const SHOOTS_KEY='viora_shoots_v1';
const SHOOT_ST={plan:['📝','запланировано'],shot:['🎬','снято'],pub:['✅','опубликовано']};
function loadShoots(){try{const a=JSON.parse(localStorage.getItem(SHOOTS_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}}
function saveShoots(a){try{localStorage.setItem(SHOOTS_KEY,JSON.stringify(a.slice(0,30)));}catch(e){}}
function saveShootPlan(d){
  const ch=STATE.channel||{};
  const rec={id:'s'+Date.now()+Math.floor(Math.random()*999),chId:ch.id||'',chTitle:ch.title||'',created:Date.now(),status:'plan',checks:{},d};
  const a=loadShoots();a.unshift(rec);saveShoots(a);return rec.id;
}
function getShoot(id){return loadShoots().find(s=>s.id===id)||null;}
function patchShoot(id,fn){const a=loadShoots();const s=a.find(x=>x.id===id);if(!s)return;try{fn(s);}catch(e){}saveShoots(a);}
function setShootStatus(id,st){patchShoot(id,s=>{s.status=st;});renderShootsList();if(st==='pub')vToast('Поздравляю с публикацией! 🎉','ok',3500);}
function delShoot(id){saveShoots(loadShoots().filter(s=>s.id!==id));if(STATE.shootId===id)STATE.shootId=null;renderShootsList();}
function openShoot(id){const s=getShoot(id);if(!s)return;STATE.nextShoot=s.d;STATE.shootId=id;renderNextShoot(s.d);renderShootsList();try{$('#nextShootSection').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}}
function renderShootsList(){
  const box=$('#shootsArea');if(!box)return;
  const chId=(STATE.channel||{}).id;
  const mine=loadShoots().filter(s=>!chId||s.chId===chId);
  if(!mine.length){box.innerHTML='';return;}
  box.innerHTML='<div class="sh-h">🗂 Мои съёмки <span class="howcalc" title="Планы сохраняются в этом браузере. Меняй статус: запланировано → снято → опубликовано">'+mine.length+'</span></div>'
   +mine.slice(0,8).map(s=>{
     const date=new Date(s.created).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'});
     const doneN=Object.values(s.checks||{}).filter(Boolean).length;
     const checksN=(s.d&&Array.isArray(s.d.checklist))?s.d.checklist.length:0;
     return '<div class="sh-row'+(s.id===STATE.shootId?' cur':'')+'">'
      +'<button class="sh-open" onclick="openShoot(\''+s.id+'\')" title="Открыть план">'+esc(String(s.d&&s.d.idea||'План').slice(0,80))+'</button>'
      +'<span class="sh-meta">'+date+(checksN?' · чек-лист '+doneN+'/'+checksN:'')+'</span>'
      +'<select class="sh-st" onchange="setShootStatus(\''+s.id+'\',this.value)">'
      +Object.keys(SHOOT_ST).map(k=>'<option value="'+k+'"'+(k===s.status?' selected':'')+'>'+SHOOT_ST[k][0]+' '+SHOOT_ST[k][1]+'</option>').join('')
      +'</select>'
      +'<button class="sh-del" onclick="delShoot(\''+s.id+'\')" title="Удалить план">✕</button></div>';
   }).join('');
}
function restoreShootForChannel(){
  const ch=STATE.channel||{};if(!ch.id)return false;
  const s=loadShoots().find(x=>x.chId===ch.id);if(!s)return false;
  STATE.nextShoot=s.d;STATE.shootId=s.id;renderNextShoot(s.d);
  return true;
}
/* ===== экспорт плана видео: PNG / PDF ===== */
async function exportShootImg(kind){
  const node=document.querySelector('#nextShootOut .ns-out');
  if(!node){vToast('Сначала собери план видео.','warn');return;}
  vToast(kind==='pdf'?'Готовлю PDF…':'Готовлю картинку…','info',2500);
  let wrap=null;
  try{
    if(window.vEnsureLib){await vEnsureLib('html2canvas');if(kind==='pdf')await vEnsureLib('jspdf');}
    if(!window.html2canvas)throw new Error('библиотека не загрузилась');
    const ch=STATE.channel||{};
    wrap=document.createElement('div');
    wrap.style.cssText='position:fixed;left:-10000px;top:0;width:860px;background:#0A0A0A;padding:34px;font-family:Onest,Inter,sans-serif;color:#fff;z-index:-1';
    wrap.innerHTML='<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><div style="width:38px;height:38px;border-radius:10px;background:#FF2D55;display:grid;place-items:center;font-size:17px">▶</div><div style="font-size:19px;font-weight:800">Viora<span style="color:#FF2D55">Media</span></div><div style="margin-left:auto;font-size:13px;opacity:.65">План следующего видео · '+esc(ch.title||'')+'</div></div>';
    var clone=node.cloneNode(true);
    clone.querySelectorAll('.ns-cta,.ns-note').forEach(x=>x.remove());
    wrap.appendChild(clone);
    document.body.appendChild(wrap);
    const cv=await html2canvas(wrap,{backgroundColor:'#0A0A0A',scale:1.5,useCORS:true,logging:false,windowWidth:wrap.scrollWidth});
    wrap.remove();wrap=null;
    const name='Viora_plan_'+String(ch.title||'video').replace(/[^\w]+/g,'_').slice(0,40);
    if(kind==='pdf'){
      const jsPDF=window.jspdf&&window.jspdf.jsPDF;if(!jsPDF)throw new Error('PDF-библиотека не загрузилась');
      const img=cv.toDataURL('image/jpeg',0.92),pdf=new jsPDF('p','mm','a4'),pw=210,ph=297,ih=cv.height*pw/cv.width;
      let pos=0,left=ih;pdf.addImage(img,'JPEG',0,pos,pw,ih);left-=ph;
      while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'JPEG',0,pos,pw,ih);left-=ph;}
      pdf.save(name+'.pdf');vToast('PDF с планом сохранён 📄','ok');
    }else{
      cv.toBlob(b=>{
        if(!b){vToast('Не удалось создать картинку','err');return;}
        const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name+'.png';
        document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
        vToast('Картинка с планом сохранена 🖼','ok');
      },'image/png');
    }
  }catch(e){
    if(wrap)try{wrap.remove();}catch(_){}
    reportError('экспорт плана',e,'Не получилось сохранить план: '+(e&&e.message||'попробуй ещё раз'));
  }
}

/* momentum — pure-math channel trajectory */
function renderMomentum(){
  const el=$('#momentum');if(!el)return;
  const all=[...STATE.videos].sort((a,b)=>new Date(a.published)-new Date(b.published));
  if(all.length<6){el.innerHTML='<div class="card"><div class="empty">Нужно минимум 6 роликов, чтобы посчитать динамику канала.</div></div>';return;}
  const third=Math.max(2,Math.floor(all.length/3));
  const early=all.slice(0,third), recent=all.slice(-third);
  /* тренд считаем по когортному коэффициенту (xc): сырые просмотры/день у свежих
     роликов всегда выше из-за возраста — это давало бы ложное «канал ускоряется» */
  const relOf=v=>v.xc!=null?v.xc:v.viewsPerDay;
  const medOf=arr=>median(arr.map(relOf));
  const eM=medOf(early)||0.0001, rM=medOf(recent);
  const eVpd=median(early.map(v=>v.viewsPerDay)), rVpd=median(recent.map(v=>v.viewsPerDay));
  const trendPct=Math.round((rM/eM-1)*100);
  const dir=trendPct>=12?'up':trendPct<=-12?'down':'flat';
  const arrow=dir==='up'?'\uD83D\uDCC8':dir==='down'?'\uD83D\uDCC9':'\u27A1\uFE0F';
  const word=dir==='up'?'Канал ускоряется':dir==='down'?'Канал теряет обороты':'Канал на плато';
  let streak=0,streakUp=null;
  for(let i=all.length-1;i>=0;i--){const up=relOf(all[i])>=1;if(streakUp===null)streakUp=up;if(up===streakUp)streak++;else break;}
  const recentForGap=all.slice(-13);let gaps=[];
  for(let i=1;i<recentForGap.length;i++){gaps.push((new Date(recentForGap[i].published)-new Date(recentForGap[i-1].published))/864e5);}
  const avgGap=gaps.length?gaps.reduce((s,g)=>s+g,0)/gaps.length:0;
  const best=[...recent].sort((a,b)=>relOf(b)-relOf(a))[0];
  const spark=all.slice(-20);const sMax=Math.max(...spark.map(relOf),0.01);
  const bars=spark.map(v=>`<i style="height:${Math.max(6,Math.round(relOf(v)/sMax*100))}%;${relOf(v)>=1?'':'background:linear-gradient(180deg,#3a7bff,#16324f)'}" title="${esc(v.title).slice(0,40)} \u00B7 ${fmt(Math.round(v.viewsPerDay))}/день \u00B7 \u00d7${relOf(v).toFixed(1)} к норме"></i>`).join('');
  el.innerHTML=`<div class="mom-grid">
    <div class="mom-main">
      <div class="mom-verdict mom-trend ${dir}"><span class="ar">${arrow}</span>${word}</div>
      <div class="mom-sub">Свежие ролики идут на <b class="mom-trend ${dir}">${trendPct>0?'+':''}${trendPct}%</b> относительно ранних — с поправкой на возраст роликов (свежие видео всегда набирают быстрее, мы это учитыва��м). Медиана просмотров/день: ранние <b>${fmt(Math.round(eVpd))}</b> → свежие <b>${fmt(Math.round(rVpd))}</b>.</div>
      <div class="mom-spark">${bars}</div>
      <div class="mom-sub" style="font-size:12.5px;color:var(--muted)">Последние ${spark.length} роликов \u00B7 розовые — выше нормы канала для своего возраста, синие — ниже.</div>
    </div>
    <div class="mom-cards">
      <div class="mom-card"><div class="l">${streakUp?'\uD83D\uDD25 Серия попаданий':'\uD83E\uDDCA Серия ниже уровня'}</div><div class="v">${streak} ${streak===1?'ролик':streak<5?'ролика':'роликов'} подряд</div><div class="d">${streakUp?'Последние ролики держатся выше медианы — лови волну, выпускай в том же духе.':'Несколько роликов подряд ниже уровня канала — смени подачу или тему.'}</div></div>
      <div class="mom-card"><div class="l">\uD83D\uDCC5 Темп выпуска</div><div class="v">${avgGap?'раз в '+(avgGap<1?'<1':Math.round(avgGap))+' '+(Math.round(avgGap)===1?'день':Math.round(avgGap)<5?'дня':'дней'):'—'}</div><div class="d">${avgGap>10?'Редкие выпуски тормозят рост — алгоритм любит стабильность.':'Хороший темп — продолжай регулярно.'}</div></div>
      ${best?`<div class="mom-card"><div class="l">\u2B50 Лучший свежий ролик</div><div class="v" style="font-size:15px;line-height:1.3">«${esc(best.title).slice(0,52)}${best.title.length>52?'…':''}»</div><div class="d">${fmt(Math.round(best.viewsPerDay))} просмотров/день \u00B7 повтори этот формат.</div></div>`:''}
    </div>
  </div>`;
}

/* score helpers (fallback) */
function computeScore(){
  const {groups,channel,shorts,longs}=STATE;
  const all=[...shorts,...longs];
  if(!all.length)return 50;
  const eng=all.reduce((s,v)=>s+v.engagement,0)/all.length;
  const consistency=Math.min(1,all.length/50);
  const engScore=Math.min(1,eng/0.06);
  const hitRate=(groups.shorts.hits.length+groups.longs.hits.length)/all.length;
  return Math.round((engScore*0.4+consistency*0.3+Math.min(1,hitRate*3)*0.3)*100);
}
function defaultBreakdown(){
  const {shorts,longs}=STATE;const all=[...shorts,...longs];
  const eng=all.length?all.reduce((s,v)=>s+v.engagement,0)/all.length:0;
  return[
    {factor:'Вовлечённость',value:Math.min(100,Math.round(eng/0.06*100))},
    {factor:'Регулярность',value:Math.min(100,Math.round(all.length/50*100))},
    {factor:'Доля хитов',value:Math.round((STATE.groups.shorts.hits.length+STATE.groups.longs.hits.length)/Math.max(1,all.length)*100)}
  ];
}
function fallbackLeak(){
  const S=STATE||{},groups=S.groups||{shorts:{},longs:{}};
  const shorts=S.shorts||[],longs=S.longs||[];
  const sm=Math.round((groups.shorts&&groups.shorts.med)||0),lm=Math.round((groups.longs&&groups.longs.med)||0);
  if(shorts.length>=3&&longs.length>=3&&sm>0&&lm>0){
    const ratio=sm>=lm?sm/lm:lm/sm;
    if(ratio>=2){
      const strongName=sm>=lm?'Shorts':'длинные ролики';
      const weakName=sm>=lm?'длинные':'Shorts';
      const weakCount=sm>=lm?longs.length:shorts.length;
      return `${strongName} дают в ×${ratio.toFixed(1)} больше просмотров/день (медиана ${fmt(Math.max(sm,lm))} против ${fmt(Math.min(sm,lm))}), но ${weakCount} ${weakName} по-прежнему тянут канал вниз. Главная утечка — перекос усилий в слабый формат: смести фокус на ${strongName}.`;
    }
  }
  const strong=(S.triggerStats||[]).filter(t=>t.verdict==='up'&&t.share<0.5).sort((a,b)=>b.lift-a.lift)[0];
  if(strong){
    return `Триггер «${strong.name}» в заголовке даёт тебе ×${strong.lift.toFixed(1)} к просмотрам${strong.best?` (пример: «${(strong.best.title||'').slice(0,45)}»)`:''}, но он есть лишь в ${Math.round(strong.share*100)}% роликов. Главная утечка — ты редко повторяешь то, что уже доказанно работает.`;
  }
  const all=[...shorts,...longs];
  if(all.length>=6){
    const ds=all.map(v=>new Date(v.published).getTime()).sort((a,b)=>a-b);
    const gaps=[];for(let i=1;i<ds.length;i++)gaps.push((ds[i]-ds[i-1])/864e5);
    const avg=gaps.length?gaps.reduce((s,g)=>s+g,0)/gaps.length:0;
    const cv=avg?Math.sqrt(gaps.reduce((s,g)=>s+(g-avg)**2,0)/gaps.length)/avg:0;
    if(cv>1)return `График выхода рваный — интервалы между роликами скачут (в среднем ~${Math.round(avg)} дн, но крайне неравномерно). Алгоритм YouTube любит ритм, и именно нестабильность постинга тормозит рост сильнее всего.`;
  }
  const fl=((groups.shorts&&groups.shorts.flops)||[]).length+((groups.longs&&groups.longs.flops)||[]).length;
  const ht=((groups.shorts&&groups.shorts.hits)||[]).length+((groups.longs&&groups.longs.hits)||[]).length;
  if(fl>Math.max(1,ht)*1.5)return `Большинство роликов уходят ниже уровня канала (${fl} провалов против ${ht} хитов). Идеи рабочие, но упаковка нестабильна — проблема в заголовках и превью, а не в темах.`;
  return `Есть отдельные хиты, но нет повторяемой формулы: разброс просмотров/день слишком большой. Зафиксируй, что сработало в топовых роликах (формат, тема, тип заголовка), и тиражируй это системно.`;
}

/* group switch */
function switchGroup(g){CURRENT=g;document.querySelectorAll('#toggle button').forEach(b=>b.classList.toggle('on',b.dataset.g===g));renderGroup();renderFormula();renderCharts();renderHeatmap();}
function renderGroup(){
  const {groups,ai}=STATE;
  const g=groups[CURRENT]||groups.longs;
  const list=(CURRENT==='streams'?STATE.streams:CURRENT==='shorts'?STATE.shorts:STATE.longs)||[];
  const area=$('#groupArea');
  const _glab=CURRENT==='streams'?'стримов/эфиров':CURRENT==='shorts'?'Shorts':'длинных видео';
  if(!list.length){area.innerHTML=`<div class="empty">На канале нет ${_glab} для анализа этой группы.</div>`;renderCharts();renderHeatmap();return;}
  const med=g.med;
  const totalGap=g.flops.reduce((s,v)=>s+Math.max(0,(med*v.age - v.views)),0);
  area.innerHTML=`
    <div class="kpis">
      <div class="kpi"><div class="v" data-count="${list.length}">0</div><div class="l">Видео в группе</div></div>
      <div class="kpi"><div class="v" data-count="${Math.round(med)}">0</div><div class="l"><span class="tooltip">просмотров/день медиана<span class="tip">Серединное значение: половина роликов выше, половина ниже. Это «уровень канала».</span></span></div></div>
      <div class="kpi"><div class="v">${g.hits.length}</div><div class="l">🔥 Залетело</div></div>
      <div class="kpi"><div class="v">${g.flops.length}</div><div class="l">❄️ Не зашло</div></div>
      <div class="kpi"><div class="v">${fmt(Math.round(totalGap))}</div><div class="l"><span class="tooltip">упущено просмотров<span class="tip">Сколько просмотров недобрали провалившиеся ролики относительно медианы канала.</span></span></div></div>
    </div>
    <div class="section-h" style="margin-top:30px"><h2 style="font-size:21px">🔥 Залетело</h2><div class="desc">Ролики выше верхнего квартиля или вдвое выше медианы канала.</div></div>
    <div class="vid-grid">${g.hits.slice(0,9).map(v=>vidCard(v,'hit',med)).join('')||'<div class="empty">Пока нет ярко выраженных хитов в этой группе.</div>'}</div>
    <div class="section-h" style="margin-top:30px"><h2 style="font-size:21px">❄️ Не зашло</h2><div class="desc">Ролики ниже нижнего квартиля. AI предлагает переписанные заголовки и идею превью.</div></div>
    <div class="vid-grid">${g.flops.slice(0,9).map(v=>vidCard(v,'flop',med)).join('')||'<div class="empty">Хорошие новости — явных провалов в этой группе нет.</div>'}</div>
  `;
  renderCharts();renderHeatmap();countUp();
}

function vidCard(v,kind,med){
  const ai=STATE.ai;
  let reason='',rewrites=null,thumb='';
  if(ai){
    const arr=kind==='hit'?ai.hits_reasons:ai.flops_reasons;
    const found=(arr||[]).find(x=>x.videoId===v.id);
    if(found){reason=sanitizeAIText(found.reason||'',kind);if(found.rewrites)rewrites=found.rewrites;if(found.thumb_idea)thumb=found.thumb_idea;}
  }
  const gap=kind==='flop'?Math.max(0,Math.round(med*v.age - v.views)):0;
  return `<div class="vid" data-vid="${v.id}">
    <a class="thumb" href="https://youtu.be/${v.id}" target="_blank" rel="noopener">
      <img src="${safeImg(v.thumb)}" alt="" loading="lazy" onerror="this.parentElement.style.background='#1a1a1a'"/>
      <span class="badge ${kind}">${kind==='hit'?'🔥 Залетело':'❄️ Не зашло'}</span>
      <span class="dur">${durLabel(v.dur)}</span>
    </a>
    <div class="body">
      <div class="vtitle">${esc(v.title)}</div>
      ${benefitChip(v.title)}
      <div class="vmetrics">
        <span class="vm">👁 <b>${fmt(v.views)}</b></span>
        <span class="vm">👍 <b>${fmt(v.likes)}</b></span>
        <span class="vm">💬 <b>${fmt(v.comments)}</b></span>
        <span class="vm">📈 <b>${fmt(Math.round(v.viewsPerDay))}</b>/день</span>
        <span class="vm">❤️ <b>${(v.engagement*100).toFixed(1)}%</b></span>
      </div>
      <div class="why">📐 ${med>0?`Вердикт «${kind==='hit'?'залетело':(kind==='flop'?'не зашло':'в норме')}»: <b>${fmt(Math.round(v.viewsPerDay))}</b> просм/день против медианы канала <b>${fmt(Math.round(med))}</b> (×${(v.viewsPerDay/med).toFixed(1)}), вовлечённость <b>${(v.engagement*100).toFixed(1)}%</b>, лайков <b>${(v.likeRate*100).toFixed(1)}%</b>.`:`<b>${fmt(Math.round(v.viewsPerDay))}</b> просм/день · вовлечённость <b>${(v.engagement*100).toFixed(1)}%</b>.`}</div>
      ${gap>0?`<div class="gap">📉 Недобор ≈ ${fmt(gap)} просмотров до уровня канала</div>`:''}
      ${reason?`<div class="reason"><span class="ai">🤖 AI: почему ${kind==='hit'?'залетело':'не зашло'}</span>${esc(reason)}</div>`:''}
      ${rewrites?`<div class="rewrites"><div class="rw-h">✍️ Переписанные заголовки</div><ul>${rewrites.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>${thumb?`<div class="thumbidea">🖼️ Превью: ${esc(thumb)}</div>`:''}</div>`:''}
      <button class="deep-btn" onclick="openVideoDrawer('${v.id}')">🔬 Покадровый разбор: хук и удержание</button>
    </div>
  </div>`;
}

/* charts */
function renderCharts(){
  const list=(CURRENT==='streams'?STATE.streams:CURRENT==='shorts'?STATE.shorts:STATE.longs)||[];
  if(typeof Chart==='undefined'||!list.length)return;
  Chart.defaults.color='#9a98a3';Chart.defaults.font.family="Inter";
  const sorted=[...list].sort((a,b)=>b.viewsPerDay-a.viewsPerDay).slice(0,40);
  const med=((STATE.groups[CURRENT]||STATE.groups.longs).med);
  if(charts.v)charts.v.destroy();
  charts.v=new Chart($('#chartViews'),{type:'bar',data:{labels:sorted.map((_,i)=>i+1),
    datasets:[{data:sorted.map(v=>Math.round(v.viewsPerDay)),
      backgroundColor:sorted.map(v=>v.viewsPerDay>med*2?'rgba(54,224,122,0.7)':v.viewsPerDay<med*0.5?'rgba(58,160,255,0.6)':'rgba(255,45,85,0.6)'),
      borderRadius:5,borderSkipped:false}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{title:i=>esc(sorted[i[0].dataIndex].title).slice(0,50),label:c=>fmt(c.raw)+' просм/день'}}},
      scales:{x:{grid:{display:false},ticks:{display:false}},y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{callback:v=>fmt(v)}}}}});
  const byDate=[...list].sort((a,b)=>new Date(a.published)-new Date(b.published));
  if(charts.e)charts.e.destroy();
  charts.e=new Chart($('#chartEng'),{type:'line',data:{labels:byDate.map(v=>new Date(v.published).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'})),
    datasets:[{data:byDate.map(v=>+(v.engagement*100).toFixed(2)),borderColor:'#FF2D55',backgroundColor:'rgba(255,45,85,0.12)',
      fill:true,tension:0.35,pointRadius:2,pointBackgroundColor:'#fff',borderWidth:2}]},
    options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>c.raw+'% вовлечённость'}}},
      scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{callback:v=>v+'%'}}}}});
}

/* heatmap */
function renderHeatmap(){
  const list=(CURRENT==='streams'?STATE.streams:CURRENT==='shorts'?STATE.shorts:STATE.longs)||[];
  const el=$('#heatmap');if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty">Недостаточно данных.</div>';return;}
  var _bw=bestPostingWindow(list);
  var _ctxNote=(typeof PROFILE!=='undefined'&&PROFILE&&PROFILE.context==='fresh')?' Для трендового контента попасть в это окно особенно важно — выходи быстро и на пике интереса.':((typeof PROFILE!=='undefined'&&PROFILE&&PROFILE.context==='expert')?' Для вечнозелёного контента время выхода вторично — польза и упаковка важнее.':'');
  var _rec;
  if(_bw&&_bw.winBest){_rec='<div style="background:linear-gradient(135deg,rgba(54,224,122,.12),rgba(255,255,255,.03));border:1px solid rgba(54,224,122,.3);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13.5px;line-height:1.5;color:#eaf1f8">🎯 <b>Лучшее окно для публикации:</b> '+_bw.winBest.day+', '+_bw.winBest.time+' — в среднем <b>'+fmt(Math.round(_bw.winBest.avg))+'</b> просм/день'+(_bw.winBest.n>=2?' ('+_bw.winBest.n+' видео)':'')+'.'+(_bw.enough?'':' <span style="color:var(--muted)">Данных пока немного — это ориентир, а не правило.</span>')+_ctxNote+'</div>';}
  else{var _nw=(STATE.signals&&STATE.signals.bestWindow&&STATE.signals.bestWindow.src==='niche')?STATE.signals.bestWindow:null;
    if(_nw)_rec='<div style="background:linear-gradient(135deg,rgba(90,140,255,.1),rgba(255,255,255,.03));border:1px solid rgba(90,140,255,.3);border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13.5px;line-height:1.5;color:#eaf1f8">🌐 <b>Окно хитов твоей ниши:</b> '+_nw.day+', '+(_nw.hourRange||'')+' — в это время публикуют свои хиты похожие каналы. <span style="color:var(--muted)">Своих роликов у канала пока мало — когда накопятся свои данные, подсказка станет персональной.</span></div>';
    else _rec='<div style="color:var(--muted);font-size:13px;margin-bottom:12px">Пока мало роликов с известным временем публикации, чтобы выделить лучшее окно — публикуй регулярнее, и подсказка появится.</div>';}
  const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];const dmap=[6,0,1,2,3,4,5]; // getDay 0=Sun
  const buckets=['0–6','6–9','9–12','12–15','15–18','18–21','21–24'];
  const bIdx=h=>h<6?0:h<9?1:h<12?2:h<15?3:h<18?4:h<21?5:6;
  const grid={};let max=0;
  /* взвешиваем по когортному коэффициенту: иначе ячейки со свежими роликами всегда «ярче» только из-за возраста */
  const _hmMed=median(list.map(v=>v.viewsPerDay))||1;
  list.forEach(v=>{const d=(v.dow+6)%7;const b=bIdx(v.hour);const k=d+'_'+b;grid[k]=grid[k]||{sum:0,n:0};grid[k].sum+=(v.xc!=null?v.xc*_hmMed:v.viewsPerDay);grid[k].n++;});
  Object.values(grid).forEach(c=>{c.avg=c.sum/c.n;if(c.avg>max)max=c.avg;});
  let html='<table class="heat"><tr><th></th>'+buckets.map(b=>`<th>${b}</th>`).join('')+'</tr>';
  days.forEach((day,di)=>{html+=`<tr><td class="rowlab">${day}</td>`;
    buckets.forEach((b,bi)=>{const c=grid[di+'_'+bi];const r=c?c.avg/max:0;
      const col=r===0?'rgba(255,255,255,0.03)':`rgba(255,${Math.round(45-r*45)},${Math.round(85-r*40)},${0.18+r*0.82})`;
      html+=`<td class="cell" style="background:${col}" title="${day} ${b}: ${c?fmt(Math.round(c.avg))+' просм/день ('+c.n+' видео)':'нет видео'}">${c?fmt(Math.round(c.avg)):''}</td>`;});
    html+='</tr>';});
  html+='</table>';el.innerHTML=_rec+html;
}

/* formula */
function renderFormula(){
  const el=$('#formula');if(!el)return;
  const ai=STATE.ai;
  const chips=(ai&&ai.hit_formula&&ai.hit_formula.length)?ai.hit_formula:computeFormula();
  const g=STATE.groups[CURRENT]||STATE.groups.longs;
  const parts=[];
  const topTopic=((STATE.topics||[]).filter(t=>t.verdict==='up'&&!t.oneoff).sort((a,b)=>(b.medVpd||0)-(a.medVpd||0)))[0];
  if(topTopic)parts.push('🗂️ тема «'+esc(topTopic.name)+'»');
  if(g&&g.hits&&g.hits.length){const avgLen=Math.round(g.hits.reduce((s,v)=>s+v.title.length,0)/g.hits.length);parts.push('🏷️ заголовок ~'+avgLen+' симв');}
  const topTrig=((STATE.triggerStats||[]).filter(t=>t.verdict==='up').sort((a,b)=>(b.lift||0)-(a.lift||0)))[0];
  if(topTrig)parts.push('🎣 приём «'+esc(topTrig.name)+'»');
  if(CURRENT!=='shorts'&&g&&g.hits&&g.hits.length){const avgD=Math.round(g.hits.reduce((s,v)=>s+v.dur,0)/g.hits.length/60);if(avgD>0)parts.push('⏱️ ~'+avgD+' мин');}
  const bw=bestPostingWindow((CURRENT==='streams'?STATE.streams:CURRENT==='shorts'?STATE.shorts:STATE.longs)||[]);
  if(bw&&bw.winBest)parts.push('🗓️ выпуск: '+bw.winBest.day+', '+bw.winBest.time);
  let eq='';
  if(parts.length>=2){eq='<div style="flex-basis:100%;width:100%;background:rgba(255,255,255,.03);border:1px solid var(--card-brd);border-radius:13px;padding:14px 16px;margin-bottom:14px;font-size:14.5px;line-height:1.65;color:#eaf1f8">🎬 <b>Хит '+(CURRENT==='shorts'?'шортса':CURRENT==='streams'?'стрима':'длинного ролика')+' на этом канале</b> ≈ '+parts.join(' <span style="opacity:.45">+</span> ')+'</div>';}
  const newbie=(typeof PROFILE!=='undefined'&&PROFILE&&PROFILE.level==='new')?'<div style="flex-basis:100%;width:100%;margin-top:12px;font-size:12.5px;color:var(--muted);line-height:1.5">Как пользоваться: когда придумываешь следующий ролик, повтори тему, тип заголовка, длительность и время выхода. Это не гарантия, но заметно повышает шансы повторить успех.</div>':'';
  el.innerHTML=eq+chips.map(f=>`<span class="chip">✓ ${esc(f)}</span>`).join('')+newbie;
}
function computeFormula(){
  const g=STATE.groups[CURRENT]||STATE.groups.longs;
  if(!g.hits.length)return['Недостаточно хитов, чтобы вывести формулу — публикуй регулярнее.'];
  const out=[];const avgLen=g.hits.reduce((s,v)=>s+v.title.length,0)/g.hits.length;
  out.push(`Длина заголовка ~${Math.round(avgLen)} символов`);
  const withNum=g.hits.filter(v=>/\d/.test(v.title)).length/g.hits.length;
  if(withNum>0.4)out.push('Цифры в заголовке');
  const withQ=g.hits.filter(v=>v.title.includes('?')).length/g.hits.length;
  if(withQ>0.3)out.push('Вопрос в заголовке');
  if(CURRENT!=='shorts'){const avgD=g.hits.reduce((s,v)=>s+v.dur,0)/g.hits.length;out.push(`Длительность ~${Math.round(avgD/60)} мин`);}
  return out;
}

/* topics */
function renderTopics(){
  const ai=STATE.ai;if(!ai?.topics?.length)return;
  $('#topicsSection').style.display='block';
  const max=Math.max(...ai.topics.map((_,i)=>ai.topics.length-i));
  $('#topics').innerHTML=ai.topics.map((t,i)=>{
    const tag=t.verdict==='up'?'up':t.verdict==='down'?'down':'mid';
    const lab=t.verdict==='up'?'растёт':t.verdict==='down'?'тянет вниз':'средне';
    const pct=100-(i/ai.topics.length*70);
    return `<div class="topic"><div class="tt"><span>${esc(t.name)}</span><span class="tag ${tag}">${lab}</span></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="mu">${esc(t.note||'')}</div></div>`;
  }).join('');
}

/* competitors */
function renderCompetitors(){
  const el=$('#competitors');const comps=STATE.competitors||[];
  if(!comps.length){el.innerHTML='<div class="empty">Не удалось автоматически найти конкурентов. Добавь канал вручную выше ↑</div>';return;}
  el.innerHTML=comps.map(c=>compCard(c)).join('');
}
function compCard(c){
  const mine=STATE.channel;
  let edge='';
  if(c.freqPerWeek> (STATE.videos.length/Math.max(1,ageDays(STATE.videos[STATE.videos.length-1].published)/7)))
    edge=`Постит чаще (~${c.freqPerWeek}/нед) — это его главный канал притока зрителей.`;
  else if(c.shortsShare>0.5) edge=`Делает ставку на Shorts (${Math.round(c.shortsShare*100)}% контента) для охвата новой аудитории.`;
  else if(c.avgViews>mine.totalViews/Math.max(1,mine.videoCount)) edge='Средний ролик набирает больше — сильнее упаковка.';
  return `<div class="comp">
    <div class="comp-top"><img src="${safeImg(c.ch.avatar)}" onerror="this.style.display='none'"/>
      <div><div class="cn">${esc(c.ch.title)}</div><div class="cs">${fmt(c.ch.subs)} подписчиков</div></div></div>
    <div class="mini">
      <div><div class="v">${fmt(Math.round(c.avgViews))}</div><div class="l">ср. просмотры</div></div>
      <div><div class="v">${Math.round(c.shortsShare*100)}%</div><div class="l">Shorts</div></div>
      <div><div class="v">${c.freqPerWeek}</div><div class="l">видео/нед</div></div>
    </div>
    ${edge?`<div class="versus">⚔️ ${esc(edge)}</div>`:''}
    ${c.topLong?`<div class="versus" style="background:rgba(255,255,255,0.03)">🎬 Топ: «${esc(c.topLong.title)}» — ${fmt(c.topLong.views)} просм.</div>`:''}
  </div>`;
}
function renderVersus(){
  const ai=STATE.ai;if(!ai?.versus?.length)return;const el=$('#versus');if(!el)return;
  el.innerHTML=ai.versus.map((v,i)=>`<div class="b"><span class="n">${i+1}</span><div><b>${esc(v.name)}</b> — ${esc(v.insight)}</div></div>`).join('');
}
function renderTakeaways(){
  const ai=STATE.ai;if(!ai?.competitor_takeaways?.length)return;const el=$('#takeaways');if(!el)return;
  el.innerHTML=ai.competitor_takeaways.map((t,i)=>`<div class="b"><span class="n">${i+1}</span><div style="flex:1">${esc(t)}</div><span class="copy" style="position:static;display:inline-block;margin-left:10px;white-space:nowrap;cursor:pointer" onclick="vAddToPlan(this,'${esc(('Применить приём конкурента: '+t).replace(/'/g,'’'))}','Сильная сторона конкурента — внедри её у себя')">➕ в план</span></div>`).join('');
}

/* plan */
function renderPatterns(){
  const ai=STATE.ai;const el=$('#titlePatterns');if(!el)return;
  const arr=ai?.title_patterns||[];
  if(!arr.length)return;
  $('#patternsSection').style.display='block';
  el.innerHTML=arr.map(p=>`<div class="pat">${esc(p)}</div>`).join('');
}

/* next-video ideas */
function renderIdeas(){
  const ai=STATE.ai;const el=$('#nextIdeas');if(!el)return;
  const arr=ai?.next_videos||[];
  if(!arr.length)return;
  $('#ideasSection').style.display='block';
  el.innerHTML=arr.map(v=>{
    const isShort=/short|шортс|шорт/i.test(v.format||'');
    return `<div class="idea">
      <span class="copy" onclick="copyText(this,'${esc((v.title||'').replace(/'/g,'’'))}')">⧉ копировать</span>
      <span class="fmt ${isShort?'short':'long'}">${isShort?'⚡ Shorts':'🎬 Длинное'}</span>
      <h4>${esc(v.title||v.idea||'')}</h4>
      <div class="iw">${esc(v.why||v.idea||'')}</div>
      ${v.based_on?`<div class="src" style="color:#ffb3c1;margin-bottom:8px">💡 Основано на: ${esc(v.based_on)}</div>`:''}
      ${v.expected?`<div class="exp">📊 Прогноз: ${esc(String(v.expected))}</div>`:''}
    </div>`;
  }).join('');
}
function copyText(btn,txt){
  navigator.clipboard?.writeText(txt).then(()=>{const o=btn.textContent;btn.textContent='✓ скопировано';setTimeout(()=>btn.textContent=o,1400);}).catch(()=>{});
}

function renderBorrow(){
  const ai=STATE.ai;const el=$('#borrowIdeas');if(!el)return;
  const arr=ai?.content_ideas||[];
  if(!arr.length)return;
  $('#borrowSection').style.display='block';
  el.innerHTML=arr.map(v=>{
    const isShort=/short|шортс|шорт/i.test(v.format||'');
    const title=v.topic||v.title||'';
    return `<div class="borrow">
      <span class="copy" onclick="copyText(this,'${esc(String(v.your_angle||title).replace(/'/g,'’'))}')">⧉ копировать</span>
      <span class="fmt ${isShort?'short':'long'}">${isShort?'⚡ Shorts':'🎬 Длинное'}</span>
      <h4>${esc(title)}</h4>
      ${v.source?`<div class="src">🔥 Зашло у конкурента: ${esc(v.source)}</div>`:''}
      ${v.why_works?`<div class="bw">${esc(v.why_works)}</div>`:''}
      ${v.your_angle?`<div class="ang">🎯 Твой угол: ${esc(v.your_angle)}</div>`:''}
      <div style="margin-top:10px"><span class="copy" style="position:static;display:inline-block;cursor:pointer" onclick="vAddToPlan(this,'${esc((v.your_angle?('Снять свой ролик: '+v.your_angle):('Сделать ролик на тему «'+title+'»')).replace(/'/g,'’'))}','${esc((v.why_works||(v.source?('Зашло у конкурента: '+v.source):'Идея от конкурента')).replace(/'/g,'’'))}')">➕ Добавить в план развития</span></div>
    </div>`;
  }).join('');
}

/* ===== живой план развития (сохраняется и дорабатывается с новыми данными) ===== */
function planStateKey(){return 'tp_plan_v2_'+(STATE.channel?.id||'x');}
function getPlanState(){let s={done:{},added:[],known:[]};try{const r=JSON.parse(localStorage.getItem(planStateKey())||'null');if(r&&typeof r==='object')s=Object.assign(s,r);}catch(e){}if(!s.done||typeof s.done!=='object')s.done={};if(!Array.isArray(s.added))s.added=[];if(!Array.isArray(s.known))s.known=[];return s;}
function setPlanState(s){try{localStorage.setItem(planStateKey(),JSON.stringify(s));}catch(e){}}
function taskSig(step){const t=(step||'').toLowerCase().replace(/[^а-яёa-z]/g,'').slice(0,90);let h=0;for(let i=0;i<t.length;i++){h=(h*31+t.charCodeAt(i))|0;}return 's'+(h>>>0).toString(36);}
function planMiniToast(m){try{const t=document.createElement('div');t.textContent=m;t.style.cssText='position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:99999;background:#1c1c20;color:#fff;padding:11px 18px;border-radius:12px;font-family:Onest,sans-serif;font-size:13.5px;border:1px solid rgba(255,255,255,.12)';document.body.appendChild(t);setTimeout(()=>{t.style.transition='.3s';t.style.opacity='0';},1500);setTimeout(()=>{try{t.remove();}catch(e){}},1900);}catch(e){}}
function vAddToPlan(btn,step,why){if(!step)return;const st=getPlanState();const sig=taskSig(step);const exists=st.added.some(t=>taskSig(t.step)===sig)||(st.known.indexOf(sig)>=0);if(!st.added.some(t=>taskSig(t.step)===sig)){st.added.unshift({step:step,why:why||'Идея, которая сработала у конкурента — адаптируй под свой канал',priority:'medium',week:1,fromCompetitor:true,ts:Date.now()});setPlanState(st);}if(btn){btn.textContent='✓ в плане';btn.classList.add('added');btn.style.pointerEvents='none';btn.style.opacity='.7';}planMiniToast(exists?'Уже в плане развития':'Добавлено в план развития ✓');renderPlan();}
function vRemovePlanTask(sig){const st=getPlanState();st.added=(st.added||[]).filter(t=>taskSig(t.step)!==sig);if(st.done)delete st.done[sig];setPlanState(st);renderPlan();planMiniToast('Задача убрана из плана');}
function renderPlan(){
  const ai=STATE.ai;const el=$('#plan');if(!el)return;
  let plan=ai?.action_plan?.length?ai.action_plan:fallbackPlan();
  const st=getPlanState();
  const added=(st.added||[]).map(t=>Object.assign({},t,{_added:true}));
  let full=[...added,...plan];
  const dseen={};full=full.filter(t=>{const sg=taskSig(t.step);if(dseen[sg])return false;dseen[sg]=1;return true;});
  const pr={high:0,medium:1,low:2};
  full=[...full].sort((a,b)=>(a.week||1)-(b.week||1)||((pr[a.priority]!=null?pr[a.priority]:1)-(pr[b.priority]!=null?pr[b.priority]:1)));
  const sigs=full.map(t=>taskSig(t.step));
  const firstTime=!(st.known&&st.known.length);
  let html='';let curWeek=null;
  full.forEach((t)=>{
    const sg=taskSig(t.step);
    const w=t.week||1;
    if(w!==curWeek){curWeek=w;html+=`<div class="week-h">📅 Неделя ${w}</div>`;}
    const pri=['high','medium','low'].includes(t.priority)?t.priority:'medium';
    const plab={high:'срочно',medium:'важно',low:'позже'}[pri];
    const isDone=st.done[sg]?' done2':'';
    const isNew=(!firstTime&&st.known.indexOf(sg)<0&&!t._added);
    const badge=t._added?'<span class="prio low" style="background:rgba(54,224,122,.18);color:#7CFFB0">🔥 фишка конкурента</span>':(isNew?'<span class="prio low" style="background:rgba(58,160,255,.18);color:#8EC9FF">🆕 новое</span>':'');
    const rm=t._added?`<button class="task-rm" title="Убрать из плана" onclick="event.stopPropagation();vRemovePlanTask('${sg}')" style="margin-left:auto;background:none;border:none;color:#9a98a3;cursor:pointer;font-size:15px;align-self:flex-start;flex:0 0 auto">🗑</button>`:'';
    html+=`<div class="task${isDone}" data-sig="${sg}" onclick="togglePlanTask(this)"><div class="check"></div>
      <div class="tx"><div class="ts">${esc(t.step)}<span class="prio ${pri}">${plab}</span>${badge}</div>
      ${t.why?`<div class="why">📈 ${esc(t.why)}</div>`:''}</div>${rm}</div>`;
  });
  el.innerHTML=html;
  st.known=Array.from(new Set([...(st.known||[]),...sigs]));
  setPlanState(st);
  updatePlanProgress();
}
function togglePlanTask(el){
  el.classList.toggle('done2');
  const sg=el.dataset.sig;const st=getPlanState();
  if(el.classList.contains('done2'))st.done[sg]=1;else delete st.done[sg];
  setPlanState(st);
  updatePlanProgress();
}
function updatePlanProgress(){
  const tasks=document.querySelectorAll('#plan .task');
  if(!tasks.length)return;
  const done=document.querySelectorAll('#plan .task.done2').length;
  const pct=Math.round(done/tasks.length*100);
  const bar=$('#planProg');if(bar)bar.style.width=pct+'%';
  const lab=$('#planProgLab');if(lab)lab.textContent=`${done} из ${tasks.length} · ${pct}%`;
}
function fallbackPlan(){
  const S=STATE||{},groups=S.groups||{shorts:{},longs:{}};
  const shorts=S.shorts||[],longs=S.longs||[];
  const out=[];
  const sm=Math.round((groups.shorts&&groups.shorts.med)||0),lm=Math.round((groups.longs&&groups.longs.med)||0);
  if(shorts.length>=3&&longs.length>=3&&sm>0&&lm>0&&(sm>=lm?sm/lm:lm/sm)>=1.8){
    const strong=sm>=lm?'Shorts':'длинные ролики';
    const ratio=(sm>=lm?sm/lm:lm/sm).toFixed(1);
    out.push({step:`Сместить контент-план в сторону ${strong}: 2 из каждых 3 ближайших роликов делать в этом формате`,why:`${strong} у тебя дают ×${ratio} к просмотрам/день (медиана ${fmt(Math.max(sm,lm))} против ${fmt(Math.min(sm,lm))})`,priority:'high',week:1});
  }
  (S.titleBoosts||[]).slice(0,2).forEach(b=>{
    const idea=b.ideas&&b.ideas[0];
    if(idea&&idea.newTitle)out.push({step:`Переписать заголовок «${(b.title||'').slice(0,38)}» → «${idea.newTitle}»`,why:`Добавляет триггер «${idea.trigger}», который на твоём канале даёт ×${(idea.lift||1).toFixed(1)}`,priority:'high',week:1});
  });
  const strongT=(S.triggerStats||[]).filter(t=>t.verdict==='up').sort((a,b)=>b.lift-a.lift)[0];
  if(strongT)out.push({step:`Добавлять триггер «${strongT.name}» в заголовки новых роликов`,why:`Ролики с ним набирают ×${strongT.lift.toFixed(1)} к остальным${strongT.best?` — сработало в «${(strongT.best.title||'').slice(0,32)}»`:''}`,priority:'high',week:1});
  const topics=(S.topics||[]).filter(t=>t.name&&!/разное|прочее|все ролики/i.test(t.name)).sort((a,b)=>((b.medVpd||0)-(a.medVpd||0)));
  if(topics.length>=2){
    const best=topics[0],worst=topics[topics.length-1];
    if((best.medVpd||0)>(worst.medVpd||0)*1.3)out.push({step:`Снять 2 ролика на тему «${best.name}» и реже заходить в «${worst.name}»`,why:`«${best.name}» приносит ${fmt(Math.round(best.medVpd))}/день против ${fmt(Math.round(worst.medVpd))}/день у «${worst.name}»`,priority:'medium',week:2});
  }
  const hits=[...(((groups.shorts&&groups.shorts.hits)||[])),...(((groups.longs&&groups.longs.hits)||[]))];
  if(hits.length>=3){
    const dows=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];const cnt={};
    hits.forEach(v=>{cnt[v.dow]=(cnt[v.dow]||0)+1;});
    const bd=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0];
    if(bd&&bd[1]>=2)out.push({step:`Публиковать в ${dows[+bd[0]]} — день, когда выходили твои хиты`,why:`${bd[1]} из ${hits.length} залетевших роликов вышли именно в этот день`,priority:'medium',week:2});
  }
  const topHit=[...hits].sort((a,b)=>b.viewsPerDay-a.viewsPerDay)[0];
  if(topHit)out.push({step:`Разобрать формулу хита «${(topHit.title||'').slice(0,38)}» и снять ролик по тому же шаблону`,why:`Твой эталон — ${fmt(Math.round(topHit.viewsPerDay))} просм/день. Повтори тему, длину и тип заголовка`,priority:'medium',week:3});
  const flops=[...(((groups.shorts&&groups.shorts.flops)||[])),...(((groups.longs&&groups.longs.flops)||[]))].sort((a,b)=>a.viewsPerDay-b.viewsPerDay);
  if(flops.length)out.push({step:`Переснять превью и первые 5 секунд у «${(flops[0].title||'').slice(0,38)}»`,why:`Худший ролик канала (${fmt(Math.round(flops[0].viewsPerDay))}/день) — слабый хук убивает удержание`,priority:'low',week:4});
  if(!out.length)return[
    {step:'Выпустить 3 ролика подряд в едином ритме и сравнить отклик',why:'Данных пока мало — нужен стабильный поток, чтобы проявилась формула',priority:'high',week:1},
    {step:'Добавлять в заголовки конкретную цифру или вопрос и сверять CTR',why:'Конкретика и интрига стабильно поднимают кликабельность',priority:'medium',week:2}
  ];
  return out;
}

/* simulator */
async function runSim(){
  const title=$('#simTitle').value.trim();const type=$('#simType').value;
  const durRaw=+$('#simDur').value||0;
  const dur=type==='shorts'?durRaw:durRaw*60;
  const res=$('#simResult');
  if(!title){res.innerHTML='<div class="muted">Введи заголовок ролика 🙂</div>';return;}
  res.innerHTML='<div class="loader-ring" style="width:50px;height:50px;margin:0 auto"></div><div class="muted" style="margin-top:14px">AI прикидывает шансы…</div>';
  // heuristic baseline
  const g=type==='longs'?STATE.groups.longs:STATE.groups.shorts;
  const hits=g.hits;
  let score=50;
  if(/\d/.test(title))score+=10;
  if(title.includes('?'))score+=8;
  if(title.length>=30&&title.length<=70)score+=10; else score-=5;
  if(hits.length){const avgLen=hits.reduce((s,v)=>s+v.title.length,0)/hits.length;if(Math.abs(title.length-avgLen)<15)score+=10;}
  score=Math.max(5,Math.min(95,score));
  let aiTips=null;
  if(!STATE.aiError){
    try{
      const out=await callMistralSim(title,type,dur,g);
      if(out)aiTips=out;
    }catch(e){console.warn('sim ai failed',e);}
  }
  const verdict = score>=65?{c:'good',t:'Скорее зайдёт 🚀'}:score>=45?{c:'mid',t:'50/50 — можно усилить ⚖️'}:{c:'risk',t:'Риск провала ⚠️'};
  const tips=aiTips?.tips||heuristicTips(title,type);
  res.innerHTML=`<div class="sim-gauge">Прогноз на основе ${hits.length} хитов канала</div>
    <div class="sim-verdict ${verdict.c}">${aiTips?.verdict||verdict.t}</div>
    <div style="font-family:'Onest',Inter,sans-serif;font-weight:700;font-size:30px;color:#fff">${aiTips?.score??score}<span style="font-size:15px;color:var(--muted)">/100</span></div>
    <ul class="sim-tips" style="margin-top:14px">${tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
}
function heuristicTips(title,type){
  const t=[];
  if(!/\d/.test(title))t.push('Добавь конкретное число — повышает кликабельность');
  if(title.length>75)t.push('Сократи заголовок — длинные обрезаются в выдаче');
  if(title.length<25)t.push('Заголовок коротковат — добавь интригу или выгоду');
  if(type==='shorts')t.push('Для Shorts важен крючок в первые 1–2 секунды');
  if(!t.length)t.push('Заголовок выглядит сильным — следи за превью и первыми секундами');
  return t;
}
async function callMistralSim(title,type,dur,g){
  const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),25000);
  try{
    const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_FAST,temperature:0.4,response_format:{type:"json_object"},
        messages:[{role:"system",content:"Ты эксперт по YouTube. Верни JSON: {\"verdict\":\"короткий вердикт с эмодзи\",\"score\":число 0-100,\"tips\":[\"2-4 совета что подправить\"]}. По-русски, просто."},
        {role:"user",content:`Канал-контекст: медиана просм/день=${Math.round(g.med)}, примеры хитов: ${g.hits.slice(0,4).map(v=>v.title).join(' | ')}. Оцени будущее ${type==='shorts'?'Shorts':'длинное'} видео, длительность ${dur}с, заголовок: "${title}". Зайдёт ли?`}]})});
    clearTimeout(to);if(!r.ok)return null;const d=await r.json();return vJsonParse(d.choices[0].message.content);
  }catch(e){clearTimeout(to);return null;}
}

/* title lab — generate 10 click-ready titles for a topic */
async function runTitleLab(){
  const topic=$('#labTopic').value.trim();
  const out=$('#labOut');
  if(!topic){out.innerHTML='<div class="muted" style="padding:14px 2px">Сначала введи тему ролика 🙂</div>';return;}
  out.innerHTML='<div class="loader-ring" style="width:46px;height:46px;margin:14px auto"></div><div class="muted center">AI подбирает заголовки под твой канал…</div>';
  const {groups,channel,ai}=STATE;
  const longHits=groups.longs.hits.slice(0,6).map(v=>v.title);
  const shortHits=groups.shorts.hits.slice(0,6).map(v=>v.title);
  const formula=(ai?.hit_formula||computeFormula()).join('; ');
  const compTitles=(STATE.competitors||[]).flatMap(c=>c.vids.sort((a,b)=>b.viewsPerDay-a.viewsPerDay).slice(0,2).map(v=>v.title)).slice(0,8);
  try{
    const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),40000);
    const sys='Ты — эксперт по упаковке YouTube. На основе формулы хитов конкретного канала и приёмов конкурентов придумай 10 РАЗНЫХ кликабельных заголовков на заданную тему. Разные подходы: цифра/список, вопрос, интрига/гэп любопытства, конкретная выгода, контраст «было/стало», провокация, «как я», антисовет. Заголовки на русском, живые, без воды, 40–70 символов. Верни СТРОГО JSON: {"titles":[{"title":"...","angle":"короткое название приёма (1-3 слова)"}]}. Без markdown.'+kbFor('titles');
    const usr='Канал: '+channel.title+'. Формула хита: '+(formula||'нет данных')+'. Заголовки моих хитов (длинные): '+(longHits.join(' | ')||'нет')+'. Хиты Shorts: '+(shortHits.join(' | ')||'нет')+'. Заголовки залетевших роликов конкурентов: '+(compTitles.join(' | ')||'нет')+'. Тема нового ролика: "'+topic+'". Дай 10 заголовков.';
    const r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_FAST,temperature:0.8,max_tokens:1500,response_format:{type:"json_object"},
        messages:[{role:"system",content:sys},{role:"user",content:usr}]})});
    clearTimeout(to);
    if(!r.ok)throw new Error('AI занят ('+r.status+')');
    const d=await r.json();
    const parsed=vJsonParse(d.choices?.[0]?.message?.content||'{}');
    const titles=(parsed.titles||[]).filter(t=>t&&t.title);
    if(!titles.length)throw new Error('пусто');
    out.innerHTML=titles.map(t=>`<div class="lab-item" onclick="copyText(this.querySelector('.lc'),'${esc((t.title||'').replace(/'/g,'’'))}')">
      <span class="lc">⧉</span>
      <div class="lt">${esc(t.title)}</div>
      ${t.angle?`<div class="why2">приём: ${esc(t.angle)}</div>`:''}
    </div>`).join('');
  }catch(e){
    out.innerHTML='<div class="empty">⚠️ Не получилось сгенериро��ать заголовки — попробуй ещё раз через пару секунд.</div>';
  }
}

/* add competitor manually */
async function addCompetitor(){
  const inp=$('#compInput');const raw=inp.value.trim();if(!raw)return;
  const btn=event.target;btn.disabled=true;btn.textContent='Добавляю…';
  try{
    const id=await resolveChannelId(parseInput(raw));
    if((STATE.competitors||[]).some(c=>c.ch.id===id)){inp.value='';btn.disabled=false;btn.textContent='+ Добавить';return;}
    const c=await buildCompetitor(id);
    if(c){STATE.competitors.push(c);renderCompetitors();try{renderCompare();}catch(e){}try{renderNiche();}catch(e){}inp.value='';}
    else alert('Не удалось загрузить этот канал.');
  }catch(e){alert('Не найден канал: '+e.message);}
  btn.disabled=false;btn.textContent='+ Добавить';
}

/* count-up */
function countUp(){
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=+el.dataset.count;if(isNaN(target)){return;}
    const small=el.querySelector('small');const sHtml=small?small.outerHTML:'';
    let cur=0;const steps=40;const inc=target/steps;let i=0;
    const t=setInterval(()=>{i++;cur+=inc;if(i>=steps){cur=target;clearInterval(t);}
      el.firstChild&&(el.childNodes[0].nodeValue=fmt(Math.round(cur)));},18);
    el.removeAttribute('data-count');
  });
}

/* PDF export */
async function exportPDF(){
  const btn=event.target;const old=btn.textContent;btn.textContent='⏳ Готовлю PDF…';btn.disabled=true;
  try{
    const node=$('#report');
    const canvas=await html2canvas(node,{backgroundColor:'#0A0A0A',scale:1.4,useCORS:true,logging:false,windowWidth:node.scrollWidth});
    const img=canvas.toDataURL('image/jpeg',0.9);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF('p','mm','a4');
    const pw=210,ph=297;const iw=pw;const ih=canvas.height*pw/canvas.width;
    let pos=0;let left=ih;
    pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;
    while(left>0){pos-=ph;pdf.addPage();pdf.addImage(img,'JPEG',0,pos,iw,ih);left-=ph;}
    pdf.save(`Viora_Media_${(STATE.channel.title||'channel').replace(/[^\w]/g,'_')}.pdf`);
  }catch(e){console.error(e);alert('Не удалось собрать PDF: '+e.message);}
  btn.textContent=old;btn.disabled=false;
}

/* ===================================================================== */
/*  AI CHAT — Viora AI knows the analyzed channel                        */
/* ===================================================================== */
let CHAT_HISTORY=[];
function mountChat(){
  const fab=$('#chatFab');if(!fab)return;
  fab.style.display='grid';
  CHAT_HISTORY=[];
  const body=$('#chatBody');
  const name=STATE.channel?.title||'твой канал';
  body.innerHTML='';
  pushMsg('bot',`Привет 👋 Я **Viora AI** — я проанализировала канал **${esc(name)}** и помню все цифры. Спроси что угодно: почему ролик не зашёл, какой заголовок выбрать, что снять дальше.`);
  const sugg=[
    'Что мне снять в следующем видео?',
    'Почему мои длинные видео не заходят?',
    'Дай 5 идей заголовков под мою формулу хита'
  ];
  const wrap=document.createElement('div');
  wrap.className='chat-sugg';
  wrap.innerHTML=sugg.map(s=>`<button onclick="askSugg('${s.replace(/'/g,"\\'")}')">${esc(s)}</button>`).join('');
  body.appendChild(wrap);
}
function toggleChat(){
  const p=$('#chatPanel');p.classList.toggle('open');
  if(p.classList.contains('open')){setTimeout(()=>$('#chatInput')?.focus(),100);}
}
function askSugg(q){$('#chatInput').value=q;sendChat();}
function mdLite(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
function pushMsg(role,text){
  const body=$('#chatBody');
  const sg=body.querySelector('.chat-sugg');if(sg&&role==='user')sg.remove();
  const d=document.createElement('div');
  d.className='msg '+role;
  d.innerHTML=mdLite(text);
  body.appendChild(d);
  body.scrollTop=body.scrollHeight;
  return d;
}
function showTyping(){
  const body=$('#chatBody');
  const d=document.createElement('div');
  d.className='chat-typing';d.id='typing';
  d.innerHTML='<span></span><span></span><span></span>';
  body.appendChild(d);body.scrollTop=body.scrollHeight;
}
function hideTyping(){$('#typing')?.remove();}
function buildChatContext(){
  const {channel,groups,ai,shorts,longs}=STATE;
  const topTitles=g=>g.hits.slice(0,5).map(v=>`«${v.title}» (${Math.round(v.viewsPerDay)}/день)`).join('; ')||'нет';
  const flopTitles=g=>g.flops.slice(0,4).map(v=>`«${v.title}» (${Math.round(v.viewsPerDay)}/день)`).join('; ')||'нет';
  return `Канал: ${channel.title} | подписчиков: ${channel.subs} | Shorts: ${shorts.length} (медиана ${Math.round(groups.shorts.med)} просм/день), хиты: ${topTitles(groups.shorts)}, провалы: ${flopTitles(groups.shorts)} | Длинные: ${longs.length} (медиана ${Math.round(groups.longs.med)} просм/день), хиты: ${topTitles(groups.longs)}, провалы: ${flopTitles(groups.longs)}${(STATE.streams&&STATE.streams.length)?` | Стримы/эфиры: ${STATE.streams.length} (медиана ${Math.round((groups.streams&&groups.streams.med)||0)} просм/день — оценивай отдельно от роликов)`:''} | Главная проблема: ${ai?.main_leak||'—'} | Формула хита: ${(ai?.hit_formula||[]).join('; ')||'—'}`;
}
async function sendChat(){
  const inp=$('#chatInput');const q=inp.value.trim();if(!q)return;
  inp.value='';
  pushMsg('user',q);
  CHAT_HISTORY.push({role:'user',content:q});
  showTyping();
  try{
    const sys=`Ты — Viora AI, личный консультант по росту YouTube. Отвечай МАКСИМАЛЬНО КРАТКО — только суть. 1-3 коротких предложения ИЛИ 2-4 пункта списком, не больше. Без вступлений и воды, не повторяй вопрос. По-русски, конкретно, с опорой на данные канала ниже. Не выдумывай цифры, которых нет. Если просят идею/заголовок — дай сразу готовый вариант. Ключевое выделяй **жирным**.\n\nДАННЫЕ КАНАЛА:\n${buildChatContext()}`;
    const msgs=[{role:'system',content:sys},...CHAT_HISTORY.slice(-8)];
    const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),35000);
    const r=await fetch("https://api.mistral.ai/v1/chat/completions",{
      method:"POST",signal:ctrl.signal,
      headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},
      body:JSON.stringify({model:MODEL_FAST,temperature:0.6,max_tokens:340,messages:msgs})
    });
    clearTimeout(to);
    hideTyping();
    if(!r.ok)throw new Error('AI занят');
    const d=await r.json();
    const ans=vClean(d.choices?.[0]?.message?.content||'Не получилось ответить, попробуй переформулировать.');
    pushMsg('bot',ans);
    CHAT_HISTORY.push({role:'assistant',content:ans});
  }catch(e){
    hideTyping();
    pushMsg('bot','⚠️ Viora AI сейчас недоступна — попробуй ещё раз через пару секунд.');
  }
}
$('#chatInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});

/* ===================================================================== */
/*  CUSTOM DROPDOWNS + LANGUAGE FILTER                                   */
/* ===================================================================== */
const DD_VALUES={ideaTime:"30",ideaType:"any",ideaSize:"any",ideaLang:"",cmpPick:"0"};
function ddGet(name){return DD_VALUES[name];}
function ddToggle(btn){
  const dd=btn.closest(".dd");const open=dd.classList.contains("open");
  document.querySelectorAll(".dd.open").forEach(d=>d.classList.remove("open"));
  if(!open)dd.classList.add("open");
}
function ddPick(opt){
  const dd=opt.closest(".dd");const name=dd.dataset.dd;
  DD_VALUES[name]=opt.dataset.v;
  dd.querySelectorAll(".dd-opt").forEach(o=>o.classList.toggle("sel",o===opt));
  const valEl=dd.querySelector(".dd-val");if(valEl)valEl.textContent=opt.dataset.label||opt.textContent.trim();
  dd.classList.remove("open");
  const fn=dd.dataset.onpick;if(fn&&window[fn])window[fn](opt.dataset.v);
}
document.addEventListener("click",e=>{if(!e.target.closest(".dd"))document.querySelectorAll(".dd.open").forEach(d=>d.classList.remove("open"));});
function langParam(l){
  if(!l)return "";
  const reg={ru:"RU",en:"US",es:"ES",de:"DE",fr:"FR",pt:"BR",hi:"IN",ar:"SA",ja:"JP",ko:"KR"}[l]||"";
  return "&relevanceLanguage="+l+(reg?"&regionCode="+reg:"");
}
function aq(s){return String(s==null?"":s).replace(/"/g,"&quot;");}

/* ===================================================================== */
/*  PER-VIDEO DEEP DIVE (hook + retention)                               */
/* ===================================================================== */
const VIDEO_ANALYSIS={};
function findVideoById(id){return (STATE.videos||[]).find(x=>x.id===id)||((typeof IDEA_STATE!=="undefined"&&IDEA_STATE.rows)||[]).find(x=>x.id===id)||null;}
function vMed(v){const g=STATE.groups||{};return v.isShort?((g.shorts&&g.shorts.med)||0):(v.isStream?((g.streams&&g.streams.med)||0):((g.longs&&g.longs.med)||0));}
async function openVideoDrawer(id){
  const v=findVideoById(id);if(!v)return;
  const dr=$("#vdDrawer"),ov=$("#vdOverlay");
  dr.classList.add("open");ov.classList.add("open");dr.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
  const med=vMed(v);
  $("#vdInner").innerHTML=vdShell(v,med)+`<div class="vd-loading"><div class="muted center">⏳ Viora AI разбирает хук и удержание…</div></div>`;
  if(VIDEO_ANALYSIS[id]){renderVideoDrawer(v,med,VIDEO_ANALYSIS[id],!!VIDEO_ANALYSIS[id]._offline);return;}
  try{const a=await analyzeSingleVideo(v,med);reconcileVerdict(a,v);VIDEO_ANALYSIS[id]=a;renderVideoDrawer(v,med,a,false);}
  catch(e){const fb=heuristicVideoAnalysis(v,med);reconcileVerdict(fb,v);fb._offline=true;VIDEO_ANALYSIS[id]=fb;renderVideoDrawer(v,med,fb,true);}
}
function closeVideoDrawer(){const dr=$("#vdDrawer"),ov=$("#vdOverlay");if(dr){dr.classList.remove("open");dr.setAttribute("aria-hidden","true");}if(ov)ov.classList.remove("open");document.body.style.overflow="";}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeVideoDrawer();});
function vdShell(v,med){
  const xr=med>0?(v.viewsPerDay/med):0;const hot=xr>=1.5,cold=xr>0&&xr<0.6;
  return `<div class="vd-top"><span class="lab">🔬 Разбор ролика</span><button class="vd-x" onclick="closeVideoDrawer()" aria-label="Закрыть">✕</button></div>
  <div class="vd-hero">
    <a class="thumb" href="https://youtu.be/${v.id}" target="_blank" rel="noopener"><img src="${safeImg(v.thumb)}" alt=""/><span class="dur">${durLabel(v.dur)}</span></a>
    <div class="vt">${esc(v.title)}</div>
    <div class="vd-chips">
      <span class="vd-chip"><b>${fmt(v.views)}</b> просмотров</span>
      <span class="vd-chip"><b>${fmt(Math.round(v.viewsPerDay))}</b>/день</span>
      <span class="vd-chip"><b>${(v.engagement*100).toFixed(1)}%</b> вовл.</span>
      <span class="vd-chip ${hot?"hot":cold?"cold":""}">${med>0?("×"+xr.toFixed(1)+" от медианы"):(v.isShort?"Shorts":"Длинное")}</span>
    </div>
  </div>`;
}
function heuristicCurve(v){
  const eng=Math.min(0.08,v.engagement||0.02);
  const k=v.isShort?(0.6-eng*3):(1.15-eng*4);
  const pts=[];
  for(let i=0;i<10;i++){const t=i/9;pts.push(Math.round(100*Math.exp(-Math.max(0.22,k)*t)));}
  pts[0]=100;return pts;
}
function curveSVG(curve){
  const W=480,H=120,pad=6,n=curve.length;
  const xs=i=>pad+(W-2*pad)*(i/(n-1));
  const ys=val=>pad+(H-2*pad)*(1-val/100);
  const line=curve.map((v,i)=>xs(i).toFixed(1)+","+ys(v).toFixed(1)).join(" ");
  const area=pad+","+(H-pad)+" "+line+" "+(W-pad)+","+(H-pad);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,45,85,.45)"/><stop offset="1" stop-color="rgba(255,45,85,0)"/></linearGradient></defs><polygon points="${area}" fill="url(#rg)"/><polyline points="${line}" fill="none" stroke="#FF2D55" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
function curveSVG2(forecast,real){
  const W=480,H=120,pad=6;
  const xs=(i,n)=>pad+(W-2*pad)*(i/(n-1));
  const ys=val=>pad+(H-2*pad)*(1-val/100);
  const li=c=>c.map((v,i)=>xs(i,c.length).toFixed(1)+","+ys(v).toFixed(1)).join(" ");
  const rl=li(real);
  const area=pad+","+(H-pad)+" "+rl+" "+(W-pad)+","+(H-pad);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(54,224,160,.4)"/><stop offset="1" stop-color="rgba(54,224,160,0)"/></linearGradient></defs><polygon points="${area}" fill="url(#rg2)"/><polyline points="${li(forecast)}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-dasharray="6 5"/><polyline points="${rl}" fill="none" stroke="#36e0a0" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
async function vRealCurveMaybe(v,forecast){
  if(!window.vRealRetention)return;
  const real=await window.vRealRetention(v.id);
  if(!Array.isArray(real)||real.length<2)return;
  const secEl=document.getElementById('vdCurveSec');if(!secEl)return;
  const avg=Math.round(real.reduce((s,x)=>s+x,0)/real.length);
  secEl.innerHTML=`<h4>📈 Удержание: факт vs прогноз</h4><div class="vd-curve">${curveSVG2(forecast,real)}<div class="axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div><div class="fx-legend"><span class="lg real">━ факт из YouTube Analytics · в среднем досматривают ${avg}%</span><span class="lg fc">┅ прогноз ИИ</span></div></div>`;
}
/* ===== A/B-память заголовков ===== */
function abKey(){return 'viora_ab_titles:'+(STATE.channel?.id||'x');}
function abLoad(){try{const a=JSON.parse(localStorage.getItem(abKey())||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function abStore(a){try{localStorage.setItem(abKey(),JSON.stringify(a.slice(0,40)));}catch(e){}}
window.vAbApply=function(btn,vid,title){
  const v=findVideoById(vid);const list=abLoad();
  if(list.some(x=>x.vid===vid&&x.nt===title)){planMiniToast('Этот вариант уже отслеживается');return;}
  list.unshift({vid:vid,ot:v?v.title:'',nt:title,ts:Date.now(),vpd0:v?+(+v.viewsPerDay||0).toFixed(2):0});
  abStore(list);
  if(btn){btn.textContent='✓ отслеживаю';btn.disabled=true;}
  planMiniToast('Запомнил. Смени заголовок на YouTube — эффект покажу при следующем анализе');
  renderAbTitles();
};
window.vAbDrop=function(vid,ts){abStore(abLoad().filter(x=>!(x.vid===vid&&x.ts===ts)));renderAbTitles();};
function renderAbTitles(){
  const el=document.getElementById('abArea');if(!el)return;
  const list=abLoad();
  if(!list.length){el.innerHTML='';return;}
  const rows=list.map(x=>{
    const v=findVideoById(x.vid);
    const days=Math.floor((Date.now()-x.ts)/864e5);
    const applied=v&&v.title===x.nt;
    let eff;
    if(!v)eff='<span class="ab-st">ролик не попал в текущую выборку</span>';
    else if(!applied)eff='<span class="ab-st wait">заголовок на YouTube ещё старый</span>';
    else if(days<3)eff='<span class="ab-st wait">применён · копаю данные ('+days+' дн. из 3)</span>';
    else{
      const k=x.vpd0>0?(v.viewsPerDay/x.vpd0):null;
      eff=k==null?'<span class="ab-st">нет базы для сравнения</span>'
        :'<span class="ab-st '+(k>=1.05?'up':k<=0.95?'down':'')+'">×'+k.toFixed(2)+' к темпу просм./день'+(k>=1.05?' — новый работает 🎉':k<=0.95?' — старый был сильнее':' — примерно одинаково')+'</span>';
    }
    return `<div class="ab-row"><div class="ab-t"><span class="old">${esc(x.ot||'')}</span><span class="arr">→</span><span class="new">${esc(x.nt)}</span></div><div class="ab-meta">${new Date(x.ts).toLocaleDateString('ru-RU')} · ${eff}<button class="ab-x" onclick="vAbDrop('${x.vid}',${x.ts})" title="Убрать из памяти">✕</button></div></div>`;
  }).join('');
  el.innerHTML=`<div class="section-h" style="margin-top:18px"><h2 style="font-size:19px">🧪 A/B-память заголовков</h2><div class="desc">Варианты, которые ты пометил «применил» в разборе ролика. Смени заголовок на YouTube — при следующем анализе сравню темп просмотров до и после.</div></div><div class="card ab-list">${rows}</div>`;
}
async function callMistralRaw(sys,user,maxTokens){
  const _ctrl=new AbortController();const _to=setTimeout(function(){_ctrl.abort();},90000);
  let r;try{r=await fetch("https://api.mistral.ai/v1/chat/completions",{method:"POST",signal:_ctrl.signal,headers:{"Content-Type":"application/json","Authorization":"Bearer "+MISTRAL_API_KEY},body:JSON.stringify({model:MODEL_DEEP,temperature:0.5,max_tokens:maxTokens||1800,response_format:{type:"json_object"},messages:[{role:"system",content:sys},{role:"user",content:user}]})});}finally{clearTimeout(_to);}
  if(!r.ok)throw new Error("Mistral "+r.status);
  const j=await r.json();return vScrub(JSON.parse(j.choices[0].message.content));
}
async function analyzeSingleVideo(v,med){
  const ch=STATE.channel||{};const xr=med>0?(v.viewsPerDay/med):0;
  const _vd=videoVerdict(v);
  const ctx={channel:ch.title||"",subs:ch.subs||0,video:{title:v.title,format:v.isShort?"Shorts":"Длинное",durationSec:v.dur,ageDays:v.age,views:v.views,viewsPerDay:Math.round(v.viewsPerDay),likes:v.likes,comments:v.comments,engagementPct:+(v.engagement*100).toFixed(2),vsChannelMedian:+xr.toFixed(2),description:(v.desc||"").slice(0,280),tags:(v.tags||[]).slice(0,12)}};
  const sys=`Ты — Viora AI, эксперт по удержанию аудитории на YouTube. По метаданным ролика и его позиции относительно медианы канала ты реконструируешь, как работают ХУК (первые 3-10 секунд) и УДЕРЖАНИЕ, и даёшь конкретный покадровый разбор. ВАЖНО: у тебя НЕТ доступа к реальному графику удержания из YouTube Analytics — ты строишь ОБОСНОВАННЫЙ ПРОГНОЗ по формату, длительности, теме, заголовку и вовлечённости. Никакой воды, только конкретика под ЭТОТ ролик, с опорой на цифры. Пиши по-русски. Опирайся на методику (ВИСП, Лестница Ханта, заход 30 сек, 7 ошибок). Верни СТРОГО валидный JSON без markdown.`+kbFor('retention');
  const schema=`Схема (заполни ВСЕ поля; retention_curve — ровно 10 чисел 0-100 по убыванию: % зрителей, оставшихся на 0,10,...,90% длины ролика):
{"hook_score":0,"hook":"диагноз хука","hook_fix":"как переписать первые 3-10 секунд","retention_score":0,"retention":"диагноз удержания: где и почему уходят","retention_curve":[100,90],"dropoff":"в какой момент (% длины) основной отвал и что сделать","intro_script":"готовый текст первых 5-10 секунд","why_result":"1-2 предложения: ПОЧЕМУ ролик набрал именно столько — с опорой на ×медиану канала и вовлечённость","triggers":[{"name":"триггер, который использовал автор","how":"как именно он применён в заголовке/превью/подаче"}],"emotions":[{"name":"эмоция/чувство","how":"на что давит у зрителя"}],"titles":["3 переписанных заголовка"],"thumb":"идея превью","structure":["3-5 пунктов: как перемонтировать ролик ради удержания"],"verdict":"итог одним предложением с эмодзи"}`;
  const user=`${schema}

ФАКТ (не противоречь ему): по данным канала этот ролик — ${_vd.label} ${_vd.emoji}, он набирает ×${_vd.xr.toFixed(1)} к медиане (${fmt(Math.round(_vd.med))}/день). Поля verdict/why_result/hook/retention обязаны соответствовать этому факту: не пиши, что ролик «залетел», если он в недоборе, и наоборот.

ДАННЫЕ РОЛИКА:
${JSON.stringify(ctx)}`;
  const a=await callMistralRaw(sys,user,1900);
  if(!Array.isArray(a.retention_curve)||a.retention_curve.length<2)a.retention_curve=heuristicCurve(v);
  a.retention_curve=a.retention_curve.slice(0,10).map(n=>Math.max(0,Math.min(100,+n||0)));
  return a;
}
function heuristicVideoAnalysis(v,med){
  const xr=med>0?(v.viewsPerDay/med):1;
  const hookScore=Math.max(20,Math.min(95,Math.round(45+(xr-1)*22+v.engagement*200)));
  const retScore=Math.max(20,Math.min(95,Math.round(40+v.engagement*350+(v.isShort?10:0))));
  const tooLong=!v.isShort&&v.dur>900;
  return {hook_score:hookScore,hook:xr>=1.3?("Ролик набирает ×"+xr.toFixed(1)+" к медиане канала — заголовок и превью явно цепляют целевого зрителя."):("Ролик идёт "+(xr<0.8?"ниже":"около")+" медианы канала (×"+xr.toFixed(1)+"). Вероятно, хук в превью/заголовке недостаточно конкретен."),hook_fix:"Первые 3 секунды: сразу показать результат или конфликт, без длинного интро и приветствий. В заголовок вынести цифру или конкретную выгоду.",retention_score:retScore,retention:v.isShort?("Для Shorts важны петля и темп. Вовлечённость "+(v.engagement*100).toFixed(1)+"% "+(v.engagement>0.05?"хорошая":"низковата")+"."):("Длинный ролик "+(tooLong?"длиннее 15 минут — высок риск отвала в середине":"средней длины")+". Вовлечённость "+(v.engagement*100).toFixed(1)+"%."),retention_curve:heuristicCurve(v),dropoff:v.isShort?"Основной отвал — на 2-3 секунде, если петля не считывается мгновенно.":"Основной отвал — на 20-40% длины, в момент провисания после интро. Поставь сюда крючок и анонс того, что будет дальше.",intro_script:"Сразу к сути: покажи финальный результат за первые секунды, потом раскрывай, как к нему пришёл.",titles:[v.title],thumb:"Крупное лицо с эмоцией + 2-3 слова крупным контрастным шрифтом, минимум деталей.",structure:["Сократи интро до 3-5 секунд","Добавляй визуальный крючок каждые 20-30 секунд","Убери провисание в середине — перемонтируй динамичнее","Сильный финал с переходом на следующий ролик"],why_result:(med>0?("Ролик идёт ×"+xr.toFixed(1)+" к медиане канала — "):"")+"результат определяется упаковкой (заголовок+превью) и вовлечённостью "+(v.engagement*100).toFixed(1)+"%.",triggers:detectTriggersForDrawer(v),emotions:[{name:xr>=1.3?"Любопытство":"Любопытство (слабое)",how:"Зритель кликает, чтобы узнать ответ"},{name:"Желание результата",how:"Обещание выгоды/трансформации"}],verdict:xr>=1.3?"🔥 Сильный ролик — масштабируй формат":"⚠️ Потенциал есть, но хук и удержание можно усилить"};
}
function renderVideoDrawer(v,med,a,offline){
  function sec(title,body){return body?`<div class="vd-sec"><h4>${title}</h4><div class="vd-card">${esc(body)}</div></div>`:"";}
  function cardH(h,body){return body?`<div class="vd-sec"><div class="vd-card"><div class="h">${h}</div>${esc(body)}</div></div>`:"";}
  const curve=(Array.isArray(a.retention_curve)&&a.retention_curve.length>1)?a.retention_curve:heuristicCurve(v);
  $("#vdInner").innerHTML=vdShell(v,med)
    +(offline?`<div class="vd-sec"><div class="vd-card" style="border-color:rgba(255,176,32,.35)"><div class="h">⚠️ Офлайн-режим</div>Viora AI временно недоступна — показываю эвристический разбор по метрикам. Открой ролик ещё раз для полного AI-анализа.</div></div>`:"")
    +`<div class="vd-sec"><div class="vd-score-row"><div class="vd-sb"><div class="lbl">Хук</div><div class="num">${a.hook_score==null?"—":a.hook_score}<span style="font-size:13px;color:var(--muted)">/100</span></div><div class="vd-meter"><span style="width:${a.hook_score||0}%"></span></div></div><div class="vd-sb"><div class="lbl">Удержание</div><div class="num">${a.retention_score==null?"—":a.retention_score}<span style="font-size:13px;color:var(--muted)">/100</span></div><div class="vd-meter"><span style="width:${a.retention_score||0}%"></span></div></div></div></div>`
    +(a.verdict?`<div class="vd-verdict">${esc(a.verdict)}</div>`:"")
    +(a.why_result?`<div class="vd-sec"><div class="vd-card"><div class="h">🎯 Почему набрал столько</div>${esc(a.why_result)}</div></div>`:"")
    +((Array.isArray(a.triggers)&&a.triggers.length)?`<div class="vd-sec"><h4>🎣 Триггеры автора</h4><div class="vd-tags">${a.triggers.map(t=>`<span class="vd-tag tg">${esc(typeof t==='string'?t:((t.name||'')+(t.how?' — '+t.how:'')))}</span>`).join("")}</div></div>`:"")
    +((Array.isArray(a.emotions)&&a.emotions.length)?`<div class="vd-sec"><h4>❤️‍🔥 На какие чувства давит</h4><div class="vd-tags">${a.emotions.map(t=>`<span class="vd-tag em">${esc(typeof t==='string'?t:((t.name||'')+(t.how?' — '+t.how:'')))}</span>`).join("")}</div></div>`:"")
    +`<div class="vd-sec" id="vdCurveSec"><h4>📈 Прогноз кривой удержания</h4><div class="vd-curve">${curveSVG(curve)}<div class="axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div><div class="note">AI-прогноз по формату, длине и вовлечённости. Подключи свой канал — и здесь появится реальная кривая из YouTube Analytics.</div></div></div>`
    +sec("🎬 Диагноз хука",a.hook)
    +cardH("Как усилить первые секунды",a.hook_fix)
    +cardH("Готовый текст интро",a.intro_script)
    +sec("⏳ Диагноз удержания",a.retention)
    +cardH("Где основной отвал",a.dropoff)
    +(Array.isArray(a.structure)&&a.structure.length?`<div class="vd-sec"><h4>🧱 Как перестроить ролик</h4><ul class="vd-list">${a.structure.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`:"")
    +(Array.isArray(a.titles)&&a.titles.length?`<div class="vd-sec"><h4>✍️ Переписанные заголовки</h4><div class="vd-rew">${a.titles.map(t=>`<div class="rw" onclick="copyText(this,this.querySelector('.t').textContent)"><span class="c">⧉</span><span class="t">${esc(t)}</span><button class="rw-ab" onclick="event.stopPropagation();vAbApply(this,'${v.id}','${esc((''+t).replace(/'/g,'’'))}')">🧪 применил</button></div>`).join("")}</div></div>`:"")
    +cardH("🖼️ Идея превью",a.thumb);
  try{vRealCurveMaybe(v,curve);}catch(e){}
}

/* ===================================================================== */
/*  BULK: ANALYZE ALL VIDEOS                                             */
/* ===================================================================== */
let BULK_RESULT=null;
async function analyzeAllVideos(){
  const cta=$("#bulkCta"),area=$("#bulkArea");
  if(BULK_RESULT){renderBulk(BULK_RESULT);return;}
  const btn=cta?cta.querySelector("button"):null;if(btn){btn.disabled=true;btn.textContent="Разбираю…";}
  area.innerHTML=`<div class="card bulk-prog"><div class="bp-top"><span>⏳ Viora AI разбирает ролики пачками…</span><span id="bpCount">0%</span></div><div class="bp-bar"><i id="bpFill"></i></div><div class="muted" id="bpNote" style="margin-top:9px;font-size:12.5px">Готовлю пачки…</div></div>`;
  try{BULK_RESULT=await callBulkAI(p=>{const f=document.getElementById('bpFill'),c=document.getElementById('bpCount'),n=document.getElementById('bpNote');if(f)f.style.width=p.pct+'%';if(c)c.textContent=p.pct+'%';if(n)n.textContent=p.note;});renderBulk(BULK_RESULT);}
  catch(e){area.innerHTML=`<div class="empty">⚠️ Не получилось разобрать все ролики — попробуй ещё раз.</div>`;}
  if(btn){btn.disabled=false;btn.textContent="Разобрать все ролики →";}
}
async function callBulkAI(onProg){
  const ch=STATE.channel||{};
  const vids=[...(STATE.videos||[])].sort((a,b)=>new Date(b.published)-new Date(a.published)).slice(0,80);
  const gS=(STATE.groups&&STATE.groups.shorts&&STATE.groups.shorts.med)||0;
  const gL=(STATE.groups&&STATE.groups.longs&&STATE.groups.longs.med)||0;
  const gSt=(STATE.groups&&STATE.groups.streams&&STATE.groups.streams.med)||0;
  const compactOf=v=>{const m=v.isShort?gS:(v.isStream?gSt:gL);return {id:v.id,t:v.title.slice(0,90),f:v.isShort?"S":(v.isStream?"Стрим":"L"),vpd:Math.round(v.viewsPerDay),views:v.views,eng:+(v.engagement*100).toFixed(1),age:v.age,xr:+((m>0?v.viewsPerDay/m:1)).toFixed(2)};};
  const BATCH=16,CONC=3;
  const batches=[];for(let i=0;i<vids.length;i+=BATCH)batches.push(vids.slice(i,i+BATCH));
  if(!batches.length)return {overall:{summary:"На канале нет роликов для разбора.",patterns:[],priorities:[]},videos:[]};
  const sys=`Ты — Viora AI, эксперт по росту YouTube. Тебе дают пачку роликов канала с метриками (xr — во сколько раз просмотры/день выше или ниже медианы своего формата). Для КАЖДОГО ролика дай вердикт (hit если xr>=1.5, flop если xr<0.6, иначе ok), одну строку причины и одну строку главного фикса. Без воды, с опорой на цифры и названия, по-русски. Верни СТРОГО валидный JSON без markdown.`+kbFor('bulk');
  const schema=`Схема: {"videos":[{"videoId":"id как в данных","verdict":"hit|ok|flop","reason":"одна строка — почему","fix":"одна строка — главный фикс"}]}. Включи ВСЕ присланные ролики.`;
  const allV=[];let done=0;const total=batches.length+1;
  if(onProg)onProg({pct:3,note:`Разбиваю ${vids.length} роликов на ${batches.length} ${batches.length===1?'пачку':'пачек'}…`});
  let idx=0;
  async function worker(){
    while(idx<batches.length){
      const batch=batches[idx++];
      try{
        const r=await callMistralRaw(sys,`${schema}\n\nРОЛИКИ:\n${JSON.stringify(batch.map(compactOf))}`,2400);
        if(r&&Array.isArray(r.videos))allV.push(...r.videos);else throw new Error('bad');
      }catch(e){
        batch.forEach(v=>{const m=v.isShort?gS:(v.isStream?gSt:gL);const xr=m>0?v.viewsPerDay/m:1;allV.push({videoId:v.id,verdict:xr>=1.5?'hit':xr<0.6?'flop':'ok',reason:'Авто-оценка: ×'+xr.toFixed(1)+' к медиане формата по просмотрам/день.',fix:xr<0.6?'Переупакуй заголовок и превью под более узкий запрос.':''});});
      }
      done++;if(onProg)onProg({pct:Math.round(done/total*100),note:`Разобрано пачек ${done} из ${batches.length}…`});
    }
  }
  await Promise.all(Array.from({length:Math.min(CONC,batches.length)},()=>worker()));
  if(onProg)onProg({pct:Math.round(batches.length/total*100),note:'Собираю общий вывод по каналу…'});
  const byId={};allV.forEach(x=>byId[x.videoId]=x);
  const counts={hit:0,ok:0,flop:0};allV.forEach(x=>{if(counts[x.verdict]!=null)counts[x.verdict]++;});
  const sample=vids.map(v=>{const a=byId[v.id];const m=v.isShort?gS:(v.isStream?gSt:gL);return {t:v.title.slice(0,80),verdict:a?a.verdict:'ok',f:v.isShort?'S':'L',xr:+((m>0?v.viewsPerDay/m:1)).toFixed(2)};});
  let overall;
  try{
    const osys=`Ты — Viora AI, эксперт по росту YouTube. По сводке вердиктов всех роликов канала дай общий вывод. Без воды, с опорой на цифры и названия роликов, по-русски. Верни СТРОГО валидный JSON без markdown.`;
    const oschema=`Схема: {"summary":"3-5 предложений: что работает, что нет, на чём фокусироваться","patterns":["3-5 закономерностей между хитами и провалами, с цифрами"],"priorities":["3 главных приоритета на ближайший месяц"]}`;
    overall=await callMistralRaw(osys,`${oschema}\n\nКАНАЛ: ${ch.title||""}; хиты ${counts.hit}, норм ${counts.ok}, провалы ${counts.flop}; медиана просм/день — Shorts ${Math.round(gS)}, Длинные ${Math.round(gL)}.\n\nРОЛИКИ (вердикты):\n${JSON.stringify(sample)}`,2000);
  }catch(e){overall={summary:`Разобрано ${allV.length} роликов: ${counts.hit} хитов, ${counts.ok} нормальных, ${counts.flop} провалов. Фокус — повторять форматы хитов и переупаковывать провалы.`,patterns:[],priorities:[]};}
  if(onProg)onProg({pct:100,note:'Готово'});
  return {overall:overall||{},videos:allV};
}
function renderBulk(res){
  const area=$("#bulkArea");if(!area)return;
  const byId={};(res.videos||[]).forEach(x=>byId[x.videoId]=x);
  const counts={hit:0,ok:0,flop:0};(res.videos||[]).forEach(x=>{if(counts[x.verdict]!=null)counts[x.verdict]++;});
  const o=res.overall||{};const order={hit:0,ok:1,flop:2};
  const rows=(STATE.videos||[]).map(v=>{const a=byId[v.id];return a?{v,a}:null;}).filter(Boolean).sort((a,b)=>((order[a.a.verdict]==null?1:order[a.a.verdict])-(order[b.a.verdict]==null?1:order[b.a.verdict]))||b.v.viewsPerDay-a.v.viewsPerDay);
  const vlabel={hit:"🔥 Хит",ok:"➖ Норм",flop:"❄️ Провал"};
  area.innerHTML=`<div class="bulk-summary"><div class="oh">🧠 Общий вывод по всем роликам</div><div>${esc(o.summary||"")}</div><div class="bulk-stats"><div class="bulk-stat"><div class="v" style="color:#9bf3bf">${counts.hit}</div><div class="l">Хиты</div></div><div class="bulk-stat"><div class="v" style="color:#ffd089">${counts.ok}</div><div class="l">Норм</div></div><div class="bulk-stat"><div class="v" style="color:#a9d4ff">${counts.flop}</div><div class="l">Провалы</div></div><div class="bulk-stat"><div class="v">${rows.length}</div><div class="l">Разобрано</div></div></div>${Array.isArray(o.patterns)&&o.patterns.length?`<div style="margin-top:8px"><b>Закономерности:</b><ul>${o.patterns.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>`:""}${Array.isArray(o.priorities)&&o.priorities.length?`<div style="margin-top:10px"><b>Приоритеты на месяц:</b><ul>${o.priorities.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>`:""}</div><div class="bulk-table">${rows.map(({v,a})=>`<div class="brow" onclick="openVideoDrawer('${v.id}')"><img class="vp" src="${safeImg(v.thumb)}" alt="" loading="lazy"/><div class="bmid"><div class="bt">${esc(v.title)}</div><div class="br">${esc(a.reason||"")}</div>${a.fix?`<div class="bf">🛠 ${esc(a.fix)}</div>`:""}</div><div class="bv ${a.verdict}">${vlabel[a.verdict]||esc(a.verdict||"")}</div></div>`).join("")}</div>`;
}

/* ===================================================================== */
/*  SIDE-BY-SIDE COMPARE (you vs competitor)                             */
/* ===================================================================== */
let COMPARE_IDX=0;
function renderCompare(){
  const el=$("#compareWrap");if(!el)return;
  const comps=STATE.competitors||[];
  if(!comps.length){el.innerHTML="";return;}
  if(COMPARE_IDX>=comps.length)COMPARE_IDX=0;
  DD_VALUES.cmpPick=String(COMPARE_IDX);
  const opts=comps.map((c,i)=>`<div class="dd-opt ${i===COMPARE_IDX?"sel":""}" data-v="${i}" data-label="${aq((c.ch&&c.ch.title)||("Конкурент "+(i+1)))}" onclick="ddPick(this)">${esc((c.ch&&c.ch.title)||("Конкурент "+(i+1)))}</div>`).join("");
  el.innerHTML=`<div class="cmp-head"><div class="cmp-title">⚖️ Сравнение бок-о-бок</div><div class="dd" data-dd="cmpPick" data-onpick="onCompPick" style="min-width:210px"><button type="button" class="dd-btn" onclick="ddToggle(this)"><span class="dd-ic">🥊</span><span class="dd-val">${esc((comps[COMPARE_IDX].ch&&comps[COMPARE_IDX].ch.title)||"Конкурент")}</span><span class="dd-arr">▾</span></button><div class="dd-menu">${opts}</div></div></div><div id="cmpBody"></div>`;
  renderCompareBody();
}
window.onCompPick=function(v){COMPARE_IDX=+v||0;renderCompareBody();};
function renderCompareBody(){
  const body=$("#cmpBody");if(!body)return;
  const comps=STATE.competitors||[];const c=comps[COMPARE_IDX];if(!c){body.innerHTML="";return;}
  const ch=STATE.channel||{};const myV=STATE.videos||[];
  const mean=arr=>arr.length?arr.reduce((s,x)=>s+x,0)/arr.length:0;
  const cv=c.vids||[];
  const myAvgViews=mean(myV.map(v=>v.views));
  const myMedVpd=median(myV.map(v=>v.viewsPerDay));
  const myShortsShare=myV.length?((STATE.shorts&&STATE.shorts.length)||0)/myV.length:0;
  const myEng=mean(myV.map(v=>v.engagement));
  let myFreq=0;{const ds=myV.map(v=>new Date(v.published)).sort((a,b)=>a-b);const wk=ds.length>1?Math.max(1,(ds[ds.length-1]-ds[0])/6048e5):1;myFreq=myV.length/wk;}
  const cEng=mean(cv.map(v=>v.engagement));
  const cMedVpd=median(cv.map(v=>v.viewsPerDay));
  const rows=[
    {label:"Подписчики",me:ch.subs||0,co:(c.ch&&c.ch.subs)||0,f:fmt},
    {label:"Ср. просмотры/ролик",me:myAvgViews,co:c.avgViews||mean(cv.map(v=>v.views)),f:n=>fmt(Math.round(n))},
    {label:"Медиана просм./день",me:myMedVpd,co:cMedVpd,f:n=>fmt(Math.round(n))},
    {label:"Вовлечённость",me:myEng*100,co:cEng*100,f:n=>n.toFixed(1)+"%"},
    {label:"Доля Shorts",me:myShortsShare*100,co:(c.shortsShare||0)*100,f:n=>Math.round(n)+"%",neutral:true},
    {label:"Частота, видео/нед",me:myFreq,co:c.freqPerWeek||0,f:n=>n.toFixed(1)}
  ];
  const head=`<div class="cmp-cols"><div class="cmp-col me"><img src="${safeImg(ch.avatar)}" alt=""/><div><div class="nm">${esc(ch.title||"Твой канал")}</div><div class="tag you">Твой канал</div></div></div><div class="cmp-col"><img src="${safeImg(c.ch&&c.ch.avatar)}" alt=""/><div><div class="nm">${esc((c.ch&&c.ch.title)||"Конкурент")}</div><div class="tag">Конкурент</div></div></div></div>`;
  const rowsHtml=rows.map(r=>{
    const max=Math.max(r.me,r.co,1);const meW=Math.round(r.me/max*100),coW=Math.round(r.co/max*100);
    let meWin=false,coWin=false;if(!r.neutral&&Math.abs(r.me-r.co)>1e-9){if(r.me>r.co)meWin=true;else coWin=true;}
    return `<div class="cmp-row"><div class="rl"><span>${r.label}</span></div><div class="cmp-bars"><div class="side me"><div class="val">${r.f(r.me)}${meWin?`<span class="cmp-win me">ты</span>`:""}</div><div class="track"><i style="width:${meW}%"></i></div></div><div class="side r"><div class="val">${r.f(r.co)}${coWin?`<span class="cmp-win">они</span>`:""}</div><div class="track"><i style="width:${coW}%"></i></div></div></div></div>`;
  }).join("");
  body.innerHTML=head+rowsHtml;
}

/* ===================================================================== */
/*  QUOTA TRACKER                                                        */
/* ===================================================================== */
const YT_QUOTA_DAILY=10000;
function _quotaKey(){return 'ytq:'+new Date().toISOString().slice(0,10);}
function quotaCost(path){return /^search\b/.test(path)?100:1;}
function quotaUsed(){try{return +localStorage.getItem(_quotaKey())||0;}catch(e){return 0;}}
function quotaAdd(n){try{localStorage.setItem(_quotaKey(),String(quotaUsed()+(n||0)));}catch(e){}try{renderQuota();}catch(e){}}
function renderQuota(){
  const el=document.getElementById('quotaPill');if(!el)return;
  const used=quotaUsed();const left=Math.max(0,YT_QUOTA_DAILY-used);
  const pct=Math.min(100,Math.round(used/YT_QUOTA_DAILY*100));
  const low=left<1500;
  el.className='quota-pill'+(low?' low':'');
  el.innerHTML=`<span class="qd"></span><span>API: <b>${fmt(left)}</b>/${fmt(YT_QUOTA_DAILY)}</span><span class="qbar"><i style="width:${pct}%"></i></span>`;
  el.title='Оценка дневной квоты YouTube API: '+fmt(used)+' из '+fmt(YT_QUOTA_DAILY)+' единиц использовано сегодня. Сбрасывается раз в сутки. Кэш на 24 часа экономит запросы.';
}

/* ===================================================================== */
/*  ANALYSIS HISTORY (localStorage)                                      */
/* ===================================================================== */
function histKey(id){return 'tph:'+id;}
function loadHistory(id){try{return JSON.parse(localStorage.getItem(histKey(id))||'[]');}catch(e){return [];}}
function saveSnapshot(){
  const ch=STATE.channel;if(!ch||!ch.id)return [];
  const all=[...(STATE.shorts||[]),...(STATE.longs||[])];
  const eng=all.length?all.reduce((s,v)=>s+v.engagement,0)/all.length:0;
  const snap={date:new Date().toISOString().slice(0,10),ts:Date.now(),subs:ch.subs||0,totalViews:ch.totalViews||0,videoCount:ch.videoCount||0,medVpd:Math.round(median(all.map(v=>v.viewsPerDay))||0),eng:+(eng*100).toFixed(2),score:(STATE.ai&&isFinite(+STATE.ai.score))?Math.round(+STATE.ai.score):null,leak:(STATE.ai&&STATE.ai.leak_tag)?String(STATE.ai.leak_tag).slice(0,60):'',planDone:(function(){try{const st=getPlanState();return Object.keys(st.done||{}).filter(k=>st.done[k]).length;}catch(e){return 0;}})()};
  let h=loadHistory(ch.id);
  if(h.length&&h[h.length-1].date===snap.date)h[h.length-1]=snap;else h.push(snap);
  if(h.length>60)h=h.slice(-60);
  try{localStorage.setItem(histKey(ch.id),JSON.stringify(h));}catch(e){}
  return h;
}
function _deltaCard(label,cur,prev,disp){
  if(prev==null||!isFinite(prev))return `<div class="hist-card"><div class="l">${label}</div><div class="v">${disp(cur)}</div><div class="dlt flat">первый замер</div></div>`;
  const diff=cur-prev;const pc=prev!==0?Math.round((cur/prev-1)*100):(cur>0?100:0);
  const dir=Math.abs(diff)<1e-6?'flat':(diff>0?'up':'down');
  const arrow=dir==='up'?'▲':dir==='down'?'▼':'■';const sign=diff>0?'+':(diff<0?'−':'');
  return `<div class="hist-card"><div class="l">${label}</div><div class="v">${disp(cur)}</div><div class="dlt ${dir}">${arrow} ${sign}${disp(Math.abs(diff))}${dir!=='flat'?' ('+(pc>0?'+':'')+pc+'%)':''}</div></div>`;
}
function renderHistory(){
  const el=document.getElementById('historyArea');if(!el)return;
  const h=saveSnapshot();
  if(h.length<2){el.innerHTML=`<div class="card"><div class="empty">📅 Это первый замер канала — данные сохранены. Запусти анализ снова через несколько дней, и здесь появится динамика подписчиков, просмотров и вовлечённости во времени.</div></div>`;if(charts.hist){try{charts.hist.destroy();}catch(e){}charts.hist=null;}return;}
  const last=h[h.length-1],prev=h[h.length-2];
  const dispInt=n=>fmt(Math.round(n));const dispPct=n=>(+n).toFixed(1)+'%';
  const cards=_deltaCard('Подписчики',last.subs,prev.subs,dispInt)+_deltaCard('Просмотры всего',last.totalViews,prev.totalViews,dispInt)+_deltaCard('Медиана просм./день',last.medVpd,prev.medVpd,dispInt)+_deltaCard('Вовлечённость',last.eng,prev.eng,dispPct);
  const auds=h.filter(s=>s.score!=null);
  let auditBlk='';
  if(auds.length){
    const la=auds[auds.length-1],pa=auds.length>1?auds[auds.length-2]:null;
    const d=pa?la.score-pa.score:null;
    const planPlus=(pa&&la.planDone!=null&&pa.planDone!=null)?Math.max(0,la.planDone-pa.planDone):0;
    auditBlk=`<div class="aud-hist"><div class="ah-score">🧾 Скор аудита: <b>${la.score}</b>/100 ${d==null?'<span class="dlt flat">первый аудит</span>':`<span class="dlt ${d>0?'up':d<0?'down':'flat'}">${d>0?'▲ +'+d:d<0?'▼ '+d:'■ без изменений'}</span>`}${(pa&&pa.leak&&la.leak&&pa.leak!==la.leak)?`<span class="ah-leak">утечка сменилась: «${esc(pa.leak)}» → «${esc(la.leak)}»</span>`:(la.leak?`<span class="ah-leak">утечка: «${esc(la.leak)}»</span>`:'')}</div>${planPlus>0?`<div class="ah-plan">✅ С прошлого аудита закрыто пунктов плана: +${planPlus}</div>`:''}${auds.length>1?`<div class="ah-log">${auds.slice(-6).map(s=>`<span class="ah-chip" title="${s.leak?esc(s.leak):''}">${s.date.slice(5)} · ${s.score}</span>`).join('')}</div>`:''}</div>`;
  }
  el.innerHTML=`<div class="hist-cards">${cards}</div>${auditBlk}<div class="hist-chart-wrap"><canvas id="histChart"></canvas></div><div class="note" style="margin-top:8px">Замеров в истории: ${h.length}. Δ показан относительно прошлого замера (${prev.date} → ${last.date}).</div>`;
  const labels=h.map(s=>s.date.slice(5));
  if(charts.hist){try{charts.hist.destroy();}catch(e){}}
  charts.hist=new Chart(document.getElementById('histChart'),{type:'line',data:{labels,datasets:[{label:'Подписчики',data:h.map(s=>s.subs),borderColor:'#FF2D55',backgroundColor:'rgba(255,45,85,.12)',yAxisID:'y',tension:.3,fill:true,pointRadius:3},{label:'Вовлечённость, %',data:h.map(s=>s.eng),borderColor:'#36c2ff',backgroundColor:'transparent',yAxisID:'y1',tension:.3,pointRadius:3}]},options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{usePointStyle:true,boxWidth:8}}},scales:{y:{position:'left',ticks:{callback:v=>fmt(v)},grid:{color:'rgba(255,255,255,.06)'}},y1:{position:'right',grid:{drawOnChartArea:false},ticks:{callback:v=>v+'%'}}}}});
}

/* ===================================================================== */
/*  NICHE BENCHMARK (you vs average of competitors)                      */
/* ===================================================================== */
function renderNiche(){
  const el=document.getElementById('nicheArea');if(!el)return;
  const comps=(STATE.competitors||[]).filter(c=>c&&c.vids&&c.vids.length);
  if(comps.length<2){el.innerHTML=`<div class="card"><div class="empty">Для бенчмарка по нише нужно минимум 2 конкурента с роликами. Добавь каналы конкурентов выше — и здесь появится сравнение со средним по нише.</div></div>`;return;}
  const ch=STATE.channel||{};const myV=STATE.videos||[];
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
  const freqOf=vs=>{const ds=vs.map(v=>new Date(v.published)).sort((a,b)=>a-b);const wk=ds.length>1?Math.max(1,(ds[ds.length-1]-ds[0])/6048e5):1;return vs.length/wk;};
  const my={subs:ch.subs||0,avgViews:mean(myV.map(v=>v.views)),medVpd:median(myV.map(v=>v.viewsPerDay)),eng:mean(myV.map(v=>v.engagement))*100,freq:freqOf(myV),shortsShare:(myV.length?((STATE.shorts&&STATE.shorts.length)||0)/myV.length:0)*100};
  const niche={subs:mean(comps.map(c=>(c.ch&&c.ch.subs)||0)),avgViews:mean(comps.map(c=>c.avgViews||mean(c.vids.map(v=>v.views)))),medVpd:mean(comps.map(c=>median(c.vids.map(v=>v.viewsPerDay)))),eng:mean(comps.map(c=>mean(c.vids.map(v=>v.engagement))*100)),freq:mean(comps.map(c=>c.freqPerWeek||freqOf(c.vids))),shortsShare:mean(comps.map(c=>(c.shortsShare||0)*100))};
  const metrics=[{k:'subs',label:'Подписчики',f:n=>fmt(Math.round(n)),higher:true},{k:'avgViews',label:'Средние просмотры на ролик',f:n=>fmt(Math.round(n)),higher:true},{k:'medVpd',label:'Медиана просмотров/день',f:n=>fmt(Math.round(n)),higher:true,hint:'главный показатель «здоровья» свежих роликов'},{k:'eng',label:'Вовлечённость',f:n=>n.toFixed(1)+'%',higher:true},{k:'freq',label:'Частота выпуска, видео/нед',f:n=>n.toFixed(1),higher:true},{k:'shortsShare',label:'Доля Shorts',f:n=>Math.round(n)+'%',higher:null}];
  let wins=0,tot=0;
  const rows=metrics.map(m=>{
    const me=my[m.k]||0,av=niche[m.k]||0;
    const pc=av!==0?Math.round((me/av-1)*100):(me>0?100:0);
    let cls,txt;
    if(m.higher===null){cls='flat';txt=(me>av?'выше':me<av?'ниже':'на уровне')+' среднего';}
    else{tot++;const better=me>=av;if(better&&Math.abs(pc)>=3)wins++;cls=Math.abs(pc)<3?'flat':(better?'up':'down');txt=(pc>0?'+':'')+pc+'% к нише';}
    return `<div class="niche-row"><div class="nl">${m.label}${m.hint?`<small>${m.hint}</small>`:''}</div><div class="niche-vals"><div><div class="me">${m.f(me)}</div><div class="avg">ниша: ${m.f(av)}</div></div><span class="niche-badge ${cls}">${txt}</span></div></div>`;
  }).join('');
  const verdict=tot&&wins>=tot*0.6?`🟢 Ты опережаешь нишу по ${wins} из ${tot} ключевых метрик — держи курс.`:(tot&&wins<=tot*0.3?`🔴 Ниша обгоняет тебя по большинству метрик — есть куда расти, смотри разбор выше.`:`🟡 Идёшь вровень с нишей: впереди по ${wins} из ${tot} метрик.`);
  el.innerHTML=`<div class="card"><div class="niche-head"><div class="muted" style="font-size:13px">Среднее по ${comps.length} конкурентам: ${comps.map(c=>esc((c.ch&&c.ch.title)||'')).filter(Boolean).slice(0,5).join(', ')}</div></div><div style="margin:4px 0 14px;font-size:14.5px;color:#fff">${verdict}</div>${rows}</div>`;
}

/* ===================================================================== */
/*  TOPIC ENGINE · ROADMAP · EMOTIONS · CONCRETE (большое обновление)  */
/* ===================================================================== */
const TOPIC_STOP=new Set("это как что для своё чтобы очень будет может если один года тебя твой твои наши влог shorts short когда где день дня лучший топ самый самое самые обзор новый новые году роликов видео канал the for you your with from this that have how why what".split(/\s+/));
function _norm(s){return (s||'').toLowerCase().replace(/ё/g,'е');}
function _topicTokens(name){return _norm(name).replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>3&&!TOPIC_STOP.has(w));}
function heuristicTopics(videos){
  if(!videos||videos.length<4)return [{name:'Все ролики',videoIds:(videos||[]).map(v=>v.id)}];
  const docs=videos.map(v=>{const text=_norm((v.title||'')+' '+((v.tags||[]).slice(0,8).join(' ')));const toks=[...new Set(text.replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(w=>w.length>3&&!TOPIC_STOP.has(w)))];return {v,toks};});
  const N=videos.length,freq={};docs.forEach(d=>d.toks.forEach(t=>freq[t]=(freq[t]||0)+1));
  const seeds=Object.entries(freq).filter(([w,c])=>c>=2&&c<=Math.max(3,N*0.55)).sort((a,b)=>b[1]-a[1]).map(e=>e[0]).slice(0,10);
  const groups={};
  docs.forEach(d=>{const hit=seeds.find(s=>d.toks.includes(s));const key=hit||'__other__';(groups[key]=groups[key]||[]).push(d.v.id);});
  let topics=Object.entries(groups).map(([k,ids])=>({name:k==='__other__'?'Разное':(k.charAt(0).toUpperCase()+k.slice(1)),videoIds:ids}));
  const big=topics.filter(t=>t.videoIds.length>=2&&t.name!=='Разное');
  const small=[].concat(...topics.filter(t=>!(t.videoIds.length>=2&&t.name!=='Разное')).map(t=>t.videoIds));
  if(small.length){const o=big.find(t=>t.name==='Разное');if(o)o.videoIds.push(...small);else if(big.length)big.push({name:'Разное',videoIds:small});else big.push({name:'Все ролики',videoIds:small});}
  return (big.length?big:topics).slice(0,8);
}
async function aiTopics(videos){
  const slim=videos.slice(0,90).map(v=>({id:v.id,t:(v.title||'').slice(0,90)}));
  const sys=`Ты — Viora AI, аналитик YouTube. Сгруппируй ролики канала по СМЫСЛОВЫМ темам/рубрикам (например: «Трейдинг», «Отпуск и влоги», «Арбитраж»). Каждый ролик ровно в одну тему. Названия тем — короткие, человеческие, по-русски. Не больше 7 тем; редкие ролики собери в «Разное». Верни СТРОГО валидный JSON без markdown.`;
  const schema=`Схема: {"primary":"главная ниша канала","topics":[{"name":"короткое имя темы","videoIds":["id…"]}]}. Используй ТОЛЬКО присланные id, каждый ровно один раз.`;
  const r=await callMistralRaw(sys,`${schema}\n\nРОЛИКИ:\n${JSON.stringify(slim)}`,2600);
  if(!r||!Array.isArray(r.topics)||!r.topics.length)throw new Error('no topics');
  const valid=new Set(videos.map(v=>v.id)),seen=new Set();
  r.topics.forEach(t=>{t.videoIds=(t.videoIds||[]).filter(id=>valid.has(id)&&!seen.has(id)&&seen.add(id));});
  r.topics=r.topics.filter(t=>t.videoIds.length);
  const left=videos.map(v=>v.id).filter(id=>!seen.has(id));
  if(left.length){let o=r.topics.find(t=>/разное|прочее|other/i.test(t.name));if(o)o.videoIds.push(...left);else r.topics.push({name:'Разное',videoIds:left});}
  return r;
}
function computeTopicStats(topicDefs,videos){
  const byId={};videos.forEach(v=>byId[v.id]=v);
  const chMed=median(videos.map(v=>v.viewsPerDay))||0;
  const mk=(name,vs,oneoff)=>{
    const avgViews=vs.reduce((s,v)=>s+v.views,0)/vs.length;
    const medVpd=median(vs.map(v=>v.viewsPerDay));
    const avgEng=vs.reduce((s,v)=>s+(v.engagement||0),0)/vs.length;
    const sorted=[...vs].sort((a,b)=>b.viewsPerDay-a.viewsPerDay);
    const byDate=[...vs].sort((a,b)=>new Date(a.published)-new Date(b.published));
    let trend='flat';
    if(byDate.length>=4){const h=Math.floor(byDate.length/2);const oldM=median(byDate.slice(0,h).map(v=>v.viewsPerDay));const newM=median(byDate.slice(h).map(v=>v.viewsPerDay));if(oldM>0){const tr=newM/oldM;trend=tr>=1.2?'up':(tr<=0.8?'down':'flat');}}
    return {name,count:vs.length,videos:vs,avgViews,medVpd,avgEng,best:sorted[0],worst:sorted[sorted.length-1],trend,share:vs.length/videos.length,oneoff:!!oneoff};
  };
  let raw=(topicDefs||[]).map(t=>{
    const vs=(t.videoIds||[]).map(id=>byId[id]).filter(Boolean);
    if(!vs.length)return null;
    return mk(t.name,vs,false);
  }).filter(Boolean);
  const isReal=t=>t.count>=3&&!/разное|прочее|все ролики/i.test(t.name);
  let topics=raw.filter(isReal);
  const smallVs=[].concat(...raw.filter(t=>!isReal(t)).map(t=>t.videos));
  topics.forEach(t=>{t.ratio=chMed?t.medVpd/chMed:1;t.verdict=t.ratio>=1.25?'up':(t.ratio<=0.75?'down':'mid');});
  topics.sort((a,b)=>b.medVpd-a.medVpd);
  if(smallVs.length){const o=mk('Разовые / эксперименты',smallVs,true);o.ratio=chMed?o.medVpd/chMed:1;o.verdict='mid';topics.push(o);}
  return {topics,chMed};
}
function renderTopicAnalytics(){
  const wrap=$('#topicArea');if(!wrap)return;
  const _all=(STATE.topics||[]).filter(t=>t.count>0);
  const _real=_all.filter(t=>!t.oneoff);const _oneoff=_all.find(t=>t.oneoff);
  if(_real.length<2){wrap.innerHTML='<div class="card"><div class="empty">Пока мало повторяющихся рубрик (нужно ≥3 ролика в одной теме), чтобы сравнить направления канала. Снимай темы сериями — и здесь появится разбор по рубрикам.</div></div>';return;}
  const topics=_oneoff?_real.concat([_oneoff]):_real;
  const ai=STATE.ai||{};const notes={};(ai.topics||[]).forEach(t=>{if(t&&t.name)notes[_norm(t.name)]=t.note;});
  const max=Math.max(..._real.map(t=>t.medVpd),1);
  const best=_real[0],worst=_real[_real.length-1];
  const concl=ai.topic_conclusion||`Делай ставку на рубрику «${best.name}» — это локомотив канала (медиана ${fmt(Math.round(best.medVpd))} просм/день). Рубрика «${worst.name}» тянет вниз (${fmt(Math.round(worst.medVpd))}/день) — переупакуй её (заголовок + превью + угол) или сократи в пользу сильных направлений.`;
  const rows=topics.map(t=>{
    const w=Math.max(4,Math.round(t.medVpd/max*100));
    const lab=t.oneoff?'🧪 разовые':(t.verdict==='up'?'🔥 растёт':(t.verdict==='down'?'❄️ тянет вниз':'➖ средне'));
    const note=notes[_norm(t.name)]||'';
    return `<div class="trow ${t.verdict}"><div class="th"><div class="tn">${esc(t.name)} <span class="tcnt">${t.count} видео · ${Math.round(t.share*100)}%${t.oneoff?'':' · '+({up:'📈 растёт',down:'📉 затухает',flat:'➖ ровно'}[t.trend]||'')}</span></div><span class="tverd ${t.verdict}">${lab}</span></div><div class="tbar"><i style="width:${w}%"></i></div><div class="tstats"><span>📈 <b>${fmt(Math.round(t.medVpd))}</b>/день</span><span>👁 <b>${fmt(Math.round(t.avgViews))}</b> ср.</span><span>💬 <b>${(t.avgEng*100).toFixed(1)}%</b> вовл.</span></div><div class="tbw"><a class="tb up" href="https://youtu.be/${t.best.id}" target="_blank" rel="noopener"><span class="lab">▲ лучшее</span> «${esc(t.best.title).slice(0,58)}» — ${fmt(Math.round(t.best.viewsPerDay))}/день</a><a class="tb down" href="https://youtu.be/${t.worst.id}" target="_blank" rel="noopener"><span class="lab">▼ худшее</span> «${esc(t.worst.title).slice(0,58)}» — ${fmt(Math.round(t.worst.viewsPerDay))}/день</a></div>${note?`<div class="tnote">🤖 ${esc(note)}</div>`:''}</div>`;
  }).join('');
  wrap.innerHTML=`<div class="topic-concl">🧭 ${esc(concl)}</div><div class="topic-rows">${rows}</div>`;
}
function computeRoadmap(videos){
  const all=(videos||[]).filter(v=>v.published);
  let base=all.filter(v=>!v.isShort).sort((a,b)=>new Date(a.published)-new Date(b.published));
  let longOnly=true;
  if(base.length<3){base=[...all].sort((a,b)=>new Date(a.published)-new Date(b.published));longOnly=false;}
  if(base.length<3)return [];
  const ms=[];
  const cut=(t,n)=>(t||'').slice(0,n);
  ms.push({date:base[0].published,type:'start',v:base[0],note:`Точка отсчёта${longOnly?' по длинным роликам':''}. Первый ролик набрал ${fmt(base[0].views)} просмотров (${fmt(Math.round(base[0].viewsPerDay))}/день). От этого уровня и считаем рост.`});
  const breakouts=[],earlyFlops=[];
  for(let i=1;i<base.length;i++){
    const prev=base.slice(Math.max(0,i-8),i);const m=median(prev.map(v=>v.viewsPerDay));const v=base[i];
    if(m<=0)continue;const xr=v.viewsPerDay/m;
    if(xr>=2)breakouts.push({date:v.published,type:'breakout',v,xr,note:`Прорыв: ×${xr.toFixed(1)} к прежнему уровню (${fmt(Math.round(v.viewsPerDay))}/день). Здесь автор нащупал рабочую тему/подачу — повторяй этот формат.`});
    else if(xr<=0.5&&i<base.length*0.6)earlyFlops.push({date:v.published,type:'flop',v,xr,note:`Не зашло: всего ${fmt(Math.round(v.viewsPerDay))}/день (×${xr.toFixed(1)} к уровню канала). Тема/упаковка не попали — такие форматы на старте лучше не множить.`});
  }
  breakouts.slice(0,4).forEach(m=>ms.push(m));
  earlyFlops.sort((a,b)=>a.xr-b.xr).slice(0,3).forEach(m=>ms.push(m));
  const gapsOf=arr=>{const ds=arr.map(v=>new Date(v.published).getTime()).sort((a,b)=>a-b);const g=[];for(let i=1;i<ds.length;i++)g.push((ds[i]-ds[i-1])/864e5);return g;};
  const third=Math.floor(base.length/3);
  if(third>=3){const me=median(gapsOf(base.slice(0,third))),ml=median(gapsOf(base.slice(-third)));const pivot=base[base.length-third];
    if(me&&ml&&ml<=me*0.6)ms.push({date:pivot.published,type:'freq',v:pivot,note:`Темп вырос: интервал между роликами сократился с ~${Math.round(me)} до ~${Math.round(ml)} дн. Регулярность любит алгоритм.`});
    else if(me&&ml&&ml>=me*1.7)ms.push({date:pivot.published,type:'freq',v:pivot,note:`Темп упал: интервал между роликами вырос с ~${Math.round(me)} до ~${Math.round(ml)} дн. Это тормозит рост.`});}
  const bestEver=[...base].sort((a,b)=>b.views-a.views)[0];
  ms.push({date:bestEver.published,type:'peak',v:bestEver,note:`Пик по просмотрам: «${cut(bestEver.title,55)}» — ${fmt(bestEver.views)}. Эталон формата канала — разбери, что сработало, и тиражируй.`});
  const seen=new Set();
  return ms.filter(m=>{const id=m.v&&m.v.id;if(id&&seen.has(id))return false;if(id)seen.add(id);return true;}).sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function renderRoadmap(){
  const el=$('#roadmapArea');if(!el)return;
  const rm=STATE.roadmap||[];const story=(STATE.ai&&STATE.ai.roadmap_story)||'';
  if(rm.length<2){el.innerHTML='<div class="card"><div class="empty">Маловато длинных роликов с датами, чтобы построить путь канала — он появится, когда длинных роликов станет хотя бы 3.</div></div>';return;}
  const icon={start:'🚩',format:'🔀',breakout:'🚀',flop:'❄️',freq:'⏱️',peak:'🏆'};
  const items=rm.map(m=>{const d=new Date(m.date).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'});const v=m.v;return `<div class="rm-item ${m.type}"><div class="rm-dot">${icon[m.type]||'•'}</div><div class="rm-body"><div class="rm-date">${d}</div>${v?`<a class="rm-vid" href="https://youtu.be/${v.id}" target="_blank" rel="noopener"><img src="${safeImg(v.thumb)}" loading="lazy"/><span>«${esc(v.title).slice(0,70)}»</span></a>`:''}<div class="rm-note">${esc(m.note)}</div>${v?`<div class="rm-mini">👁 ${fmt(v.views)} · 📈 ${fmt(Math.round(v.viewsPerDay))}/день · ${v.isShort?'⚡ Shorts':'🎬 Длинное'}</div>`:''}</div></div>`;}).join('');
  el.innerHTML=`${story?`<div class="rm-story">🧭 ${esc(story)}</div>`:''}<div class="roadmap">${items}</div>`;
}
function renderFormatAudit(){
  const el=$('#fmtAudit');if(!el)return;
  const ai=STATE.ai||{};const g=STATE.groups||{};
  const med=k=>fmt(Math.round((g[k]&&g[k].med)||0));
  const rr=window.__vFmtReal||null;
  const mmss=x=>{x=Math.round(+x||0);return Math.floor(x/60)+':'+('0'+(x%60)).slice(-2);};
  const realLine=o=>{
    if(!o||!o.views)return '';
    const mpk=Math.round(o.min/o.views*1000);
    return `<div class="fa-real">📊 Analytics, 28 дн.: <b>${fmt(o.views)}</b> просм. · <b>${fmt(mpk)}</b> мин внимания на 1000 просм. · ср. просмотр <b>${mmss(o.avd)}</b>${o.subs!=null?` · <b>${o.subs>=0?'+':''}${fmt(o.subs)}</b> подписч.`:''}</div>`;
  };
  const cards=[];
  if((STATE.shorts||[]).length||ai.shorts_insights)cards.push({ic:'⚡',t:'Вывод по Shorts',n:(STATE.shorts||[]).length,m:med('shorts'),txt:ai.shorts_insights||'',real:realLine(rr&&rr.shorts)});
  if((STATE.longs||[]).length||ai.longform_insights)cards.push({ic:'🎬',t:'Вывод по длинным роликам',n:(STATE.longs||[]).length,m:med('longs'),txt:ai.longform_insights||'',real:realLine(rr&&rr.longs)});
  if(!cards.length){el.innerHTML='';return;}
  let vs='';
  if(rr&&rr.shorts&&rr.longs&&rr.shorts.views>0&&rr.longs.views>0){
    const mpkS=rr.shorts.min/rr.shorts.views*1000,mpkL=rr.longs.min/rr.longs.views*1000;
    if(mpkS>0&&mpkL>0){
      const longWins=mpkL>=mpkS;
      const k=(Math.max(mpkS,mpkL)/Math.max(1e-9,Math.min(mpkS,mpkL))).toFixed(1);
      let sub='';
      if(rr.shorts.subs!=null&&rr.longs.subs!=null){
        const spkS=rr.shorts.subs/rr.shorts.views*1000,spkL=rr.longs.subs/rr.longs.views*1000;
        sub=' Подписчиков на 1000 просмотров: Shorts — '+spkS.toFixed(1)+', длинные — '+spkL.toFixed(1)+'.';
      }
      vs=`<div class="fa-vs">⚖️ По реальным данным за 28 дней <b>${longWins?'длинные ролики':'Shorts'}</b> приносят ×${k} больше минут внимания на 1000 просмотров.${sub}</div>`;
    }
  }
  el.innerHTML=cards.map(c=>`<div class="fa-card"><div class="fa-h">${c.ic} ${c.t}<span class="fa-meta">${c.n} шт. · медиана ${c.m}/день</span></div><div class="fa-txt">${c.txt?esc(c.txt):'<span class="muted">ИИ-вывод по этому формату появится после анализа — ниже разбор по цифрам.</span>'}</div>${c.real}</div>`).join('')+vs;
}
/* ===== Глоссарий: всплывающие подсказки к терминам (Блок 1) ===== */
const VGLOSSARY={
  'CTA':'призыв к действию — фраза, которая просит зрителя что-то сделать: подписаться, лайкнуть, написать комментарий',
  'органический охват':'бесплатные показы от YouTube в рекомендациях и поиске, без рекламы',
  'органика':'бесплатные показы от YouTube, без рекламы',
  'вовлечённость':'насколько активно зрители реагируют: лайки, комментарии и репосты относительно просмотров',
  'удержание':'какую часть ролика зрители в среднем досматривают',
  'хук':'первые 3–10 секунд ролика — цепляющее начало, ради которого остаются смотреть',
  'медиана':'типичное значение по каналу (середина): половина роликов выше, половина ниже',
  'VPD':'просмотров в день — сколько просмотров ролик набирает за сутки в среднем',
  'engagement':'вовлечённость — лайки и комментарии относительно просмотров',
  'ВИСП':'формула цепляющего заголовка: Выгода, Интрига, Срочность, Причастность',
  'превью':'картинка-обложка ролика, по которой зритель решает кликнуть',
  'CTR':'кликабельность — сколько процентов увидевших обложку нажали на ролик',
  'просмотров в день':'сколько просмотров ролик набирает за сутки в среднем — так честно сравнивают свежие и старые ролики',
  'кликабельность превью':'сколько процентов увидевших обложку нажали на ролик',
  'кликабельность':'сколько процентов увидевших обложку нажали на ролик',
  'призыв к действию':'фраза, которая просит зрителя что-то сделать: подписаться, лайкнуть, написать комментарий',
  'длинные ролики':'обычные горизонтальные видео — не Shorts',
  'короткие ролики':'вертикальные ролики до 60 секунд (Shorts)',
  'досматриваемость':'какую часть ролика зрители в среднем досматривают до конца',
  'конверсия в подписку':'сколько из посмотревших ролик подписались на канал',
  'воронка':'путь зрителя: от первого ролика — к подписке и просмотру следующих видео',
  'триггер':'эмоциональный крючок в теме или обложке, который заставляет кликнуть'
};
let _VGLOSS_CSS=false;
function _vGlossCss(){ if(_VGLOSS_CSS)return; _VGLOSS_CSS=true; try{ var s=document.createElement('style'); s.textContent='.vterm{border-bottom:1px dashed rgba(255,45,85,.6);cursor:help;transition:color .12s}.vterm:hover{color:#ff5c78}#vtip{position:fixed;z-index:99999;max-width:300px;background:linear-gradient(180deg,#1c1c1f,#161618);color:#f3f3f3;border:1px solid rgba(255,45,85,.45);border-radius:11px;padding:10px 13px;font-size:13px;line-height:1.5;box-shadow:0 10px 34px rgba(0,0,0,.6);pointer-events:none;opacity:0;transform:translateY(5px);transition:opacity .16s ease,transform .16s ease}#vtip.on{opacity:1;transform:translateY(0)}'; document.head.appendChild(s); }catch(e){} _vTipInit(); }
function _vTipInit(){ if(typeof document==='undefined'||window._vTipReady)return; window._vTipReady=1; try{ var tip=document.createElement('div'); tip.id='vtip'; (document.body||document.documentElement).appendChild(tip); var pos=function(x,y){ var r=tip.getBoundingClientRect(); var nx=x+15,ny=y+18; if(nx+r.width>window.innerWidth-10)nx=window.innerWidth-r.width-10; if(ny+r.height>window.innerHeight-10)ny=y-r.height-14; if(nx<10)nx=10; if(ny<10)ny=10; tip.style.left=nx+'px'; tip.style.top=ny+'px'; }; var show=function(t,x,y){ var txt=t.getAttribute('data-tip'); if(!txt)return; tip.textContent=txt; tip.classList.add('on'); pos(x,y); }; document.addEventListener('mouseover',function(e){ var t=e.target; if(t&&t.classList&&t.classList.contains('vterm'))show(t,e.clientX,e.clientY); }); document.addEventListener('mousemove',function(e){ if(tip.classList.contains('on'))pos(e.clientX,e.clientY); }); document.addEventListener('mouseout',function(e){ var t=e.target; if(t&&t.classList&&t.classList.contains('vterm'))tip.classList.remove('on'); }); document.addEventListener('click',function(e){ var t=e.target; if(t&&t.classList&&t.classList.contains('vterm')){ if(tip.classList.contains('on')&&tip._cur===t){ tip.classList.remove('on'); tip._cur=null; } else { tip._cur=t; show(t,e.clientX,e.clientY); } } else if(tip._cur){ tip.classList.remove('on'); tip._cur=null; } }); }catch(e){} }
const VHUMAN=[
  [/engagementPct/g,'вовлечённость'],
  [/\bengagement\b/gi,'вовлечённость'],
  [/\bVPD\b/g,'просмотров в день'],
  [/\bvpd\b/g,'просмотров в день'],
  [/\bCTR\b/g,'кликабельность превью'],
  [/\bCTA\b/g,'призыв к действию'],
  [/\blongform\b/gi,'длинные ролики'],
  [/\blongs\b/gi,'длинные ролики'],
  [/\bretention\b/gi,'досматриваемость']
];
function vHumanize(root){
  if(!root||typeof document==='undefined'||!document.createTreeWalker)return;
  try{
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue)return NodeFilter.FILTER_REJECT;
      var p=n.parentNode;if(!p)return NodeFilter.FILTER_REJECT;
      var tag=p.tagName;if(tag==='SCRIPT'||tag==='STYLE')return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[],nd;while(nd=walker.nextNode())nodes.push(nd);
    nodes.forEach(function(n){
      var s=n.nodeValue,o=s;
      for(var i=0;i<VHUMAN.length;i++)s=s.replace(VHUMAN[i][0],VHUMAN[i][1]);
      if(s!==o)n.nodeValue=s;
    });
  }catch(e){}
}
function vGlossify(root){
  if(!root||typeof document==='undefined'||!document.createTreeWalker)return;
  try{
    _vGlossCss();
    var keys=Object.keys(VGLOSSARY).sort(function(a,b){return b.length-a.length;});
    var isW=function(c){return /[0-9A-Za-zА-Яа-яЁё]/.test(c||'');};
    var used={};
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      if(!n.nodeValue||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      var p=n.parentNode;if(!p)return NodeFilter.FILTER_REJECT;
      if(p.classList&&p.classList.contains('vterm'))return NodeFilter.FILTER_REJECT;
      var tag=p.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='BUTTON')return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    var nodes=[],nd;while(nd=walker.nextNode())nodes.push(nd);
    nodes.forEach(function(n){
      var s=n.nodeValue,low=s.toLowerCase(),best=null;
      for(var i=0;i<keys.length;i++){
        var key=keys[i];
        var idx=low.indexOf(key.toLowerCase());if(idx<0)continue;
        var before=idx>0?s[idx-1]:'';var after=(idx+key.length<s.length)?s[idx+key.length]:'';
        if(isW(before)||isW(after))continue;
        if(best===null||idx<best.idx||(idx===best.idx&&key.length>best.key.length))best={idx:idx,key:key};
      }
      if(!best)return;
      used[best.key.toLowerCase()]=1;
      var term=s.substr(best.idx,best.key.length);
      var frag=document.createDocumentFragment();
      if(best.idx>0)frag.appendChild(document.createTextNode(s.slice(0,best.idx)));
      var span=document.createElement('span');span.className='vterm';span.setAttribute('data-tip',VGLOSSARY[best.key]);span.textContent=term;
      frag.appendChild(span);
      if(best.idx+best.key.length<s.length)frag.appendChild(document.createTextNode(s.slice(best.idx+best.key.length)));
      n.parentNode.replaceChild(frag,n);
    });
  }catch(e){}
}
function renderConcrete(){
  const el=$('#concreteArea'),sec=$('#concreteSection');if(!el)return;
  const arr=(STATE.ai&&STATE.ai.concrete_changes)||[];
  if(!arr.length){if(sec)sec.style.display='none';return;}
  if(sec)sec.style.display='block';
  const pr={high:'🔴 сделать первым',medium:'🟡 важно',low:'🟢 потом'};
  el.innerHTML=arr.map(c=>{const o=typeof c==='string'?{change:c}:c;const p=o.priority||'medium';return `<div class="cc ${p}"><div class="cc-top"><span class="cc-pr">${pr[p]||pr.medium}</span>${o.target?`<span class="cc-tg">${esc(o.target)}</span>`:''}</div><div class="cc-lbl">Что сделать</div><div class="cc-ch">${esc(o.change||'')}</div>${o.effect?`<div class="cc-ef"><span class="cc-ef-lbl">📈 Что это даст</span><span class="cc-ef-tx">${esc(o.effect)}</span></div>`:''}</div>`;}).join('');
}
function renderNicheTopics(){
  const el=$('#nicheTopicArea'),sec=$('#nicheTopicSection');if(!el)return;
  const topics=(STATE.topics||[]).filter(t=>t.name&&!/разное|прочее|все ролики/i.test(t.name));
  const comps=STATE.competitors||[];
  if(!topics.length||!comps.length){if(sec)sec.style.display='none';return;}
  const pool=[];comps.forEach(c=>{(c.vids||[]).forEach(v=>pool.push({v,ch:(c.ch&&c.ch.title)||''}));});
  if(!pool.length){if(sec)sec.style.display='none';return;}
  let any=false;
  const blocks=topics.slice(0,6).map(t=>{
    const toks=_topicTokens(t.name);if(!toks.length)return '';
    const matches=pool.filter(p=>{const tt=_norm(p.v.title);return toks.some(tok=>tt.includes(tok));});
    if(!matches.length)return '';
    matches.sort((a,b)=>b.v.viewsPerDay-a.v.viewsPerDay);any=true;
    const top=matches.slice(0,3);
    return `<div class="nt-block"><div class="nt-h">🗂️ ${esc(t.name)} <span class="muted">· у тебя медиана ${fmt(Math.round(t.medVpd))}/день</span></div>${top.map(p=>`<a class="nt-row" href="https://youtu.be/${p.v.id}" target="_blank" rel="noopener"><img src="${safeImg(p.v.thumb)}" loading="lazy"/><div class="nt-mid"><div class="nt-t">${esc(p.v.title)}</div><div class="nt-m">📺 ${esc(p.ch)} · 👁 ${fmt(p.v.views)} · 📈 ${fmt(Math.round(p.v.viewsPerDay))}/день</div></div><span class="nt-go">снять своё →</span></a>`).join('')}</div>`;
  }).filter(Boolean).join('');
  if(!any){if(sec)sec.style.display='none';return;}
  if(sec)sec.style.display='block';
  el.innerHTML=blocks;
}

/* === TRIGGER LAB ENGINE v2 === */
const TRIGGER_LIB=[
 {key:'number',name:'Цифра в заголовке',icon:'🔢',re:/\d/,tip:'Конкретное число обещает измеримый результат и структуру: «5 способов», «за 3 дня».'},
 {key:'list',name:'Список / N вещей',icon:'📋',re:/(\d+)\s*(вещ|способ|шаг|идей|идеи|правил|причин|урок|ошиб|ways|things|steps|tips|reasons|ideas|mistakes)/i,tip:'Списки легко сканируются и обещают чёткую структуру пользы.'},
 {key:'howto',name:'Как / гайд',icon:'🛠️',re:/(^|\s)(как|how to|how i|гайд|инструкц|туториал|tutorial|руководств)/i,tip:'Обучающий формат — самый стабильный спрос на YouTube.'},
 {key:'question',name:'Вопрос-интрига',icon:'❓',re:/\?|почему|зачем|стоит ли|что будет|why|what if|what happens/i,tip:'Открытая петля: мозг хочет закрыть незавершённый вопрос.'},
 {key:'fomo',name:'FOMO / срочность',icon:'⏳',re:/(пока не|успей|последн|больше не|исчез|срочно|deadline|too late|before it|right now)/i,tip:'Страх упустить заставляет кликнуть сейчас, а не «потом».'},
 {key:'money',name:'Деньги',icon:'💰',re:/(\$|₽|руб|доллар|деньг|зарабат|доход|бесплатн|free|profit|cash|money|цена|price)/i,tip:'Тема денег почти всегда повышает кликабельность.'},
 {key:'secret',name:'Секрет / скрытое',icon:'🔒',re:/(секрет|secret|никто не|тайн|скрыт|hidden|правда о|truth about|о котором молчат)/i,tip:'Эксклюзивное знание даёт зрителю ощущение преимущества.'},
 {key:'negative',name:'Негатив / ошибки',icon:'⚠️',re:/(ошибк|не делай|перестань|худш|провал|fail|mistake|stop|avoid|never|не покупай|не повторяй)/i,tip:'Предупреждение об ошибке цепляет сильнее, чем совет «как надо».'},
 {key:'time',name:'Время / скорость',icon:'⚡',re:/(за \d|\d\s*(минут|час|дн|day|min|hour|week|недел|месяц)|быстро|за день|за ночь|in \d)/i,tip:'Конкретный срок делает обещание осязаемым.'},
 {key:'superlative',name:'Превосходство',icon:'🏆',re:/(лучш|топ|\btop\b|\bbest\b|самый|#1|номер 1|ultimate|главн|худший|worst)/i,tip:'Превосходная степень выделяет ролик среди похожих.'},
 {key:'direct',name:'Обращение к зрителю',icon:'👉',re:/(^|\s)(ты|вы|твой|твоя|твои|ваш|ваша|your|you)(\s|$|,)/i,tip:'Прямое «ты/вы» создаёт ощущение личного разговора.'},
 {key:'curiosity',name:'Любопытство',icon:'👀',re:/(вот что|оказалось|вот почему|это меняет|вот как|смотри что|this is why|you won.t believe)/i,tip:'Намёк на неожиданный поворот — двигатель кликов.'},
 {key:'authority',name:'Авторитет / опыт',icon:'🎓',re:/(эксперт|professional|профи|\d+\s*(лет|года|years)|опыт|мнение|expert|официальн)/i,tip:'Доказанный опыт повышает доверие к ролику.'},
 {key:'vs',name:'Сравнение / VS',icon:'⚔️',re:/(\bvs\b|\bvs\.|против|сравн|comparison)/i,tip:'Противостояние двух вариантов втягивает зрителя в спор.'},
 {key:'result',name:'Результат / до-после',icon:'📈',re:/(результат|до и после|before.*after|трансформац|итог|я получил|я сделал|что вышло)/i,tip:'Видимый результат — главный аргумент кликнуть.'},
 {key:'challenge',name:'Челлендж / эксперимент',icon:'🎯',re:/(челлендж|challenge|24 час|7 дней|30 дней|эксперимент|experiment|пробую|я попробовал|i tried)/i,tip:'Формат «я проверил на себе» обещает честный исход.'},
 {key:'emoji',name:'Эмодзи в заголовке',icon:'😀',re:/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u,tip:'Эмодзи цепляет взгляд в ленте — но не перебарщивай.'},
 {key:'brackets',name:'Скобки / уточнение',icon:'［］',re:/[\[\(][^\]\)]{2,}[\]\)]/,tip:'Скобки добавляют конкретику: [2026], (полный гайд).'},
 {key:'year',name:'Год / актуальность',icon:'📅',re:/\b20\d{2}\b/,tip:'Год сигналит свежесть и актуальность контента.'},
 {key:'proof',name:'Пруф / честность',icon:'✅',re:/(доказательств|пруф|proof|реальн|честно|на самом деле|без обмана)/i,tip:'Обещание доказательств снимает скепсис зрителя.'},
 {key:'emotion',name:'Сильная эмоция',icon:'🔥',re:/(шок|невероятн|безум|insane|crazy|shocking|amazing|ужас|восторг|жесть|капец)/i,tip:'Эмоционально заряженные слова поднимают CTR.'},
 {key:'exclusive',name:'Эксклюзив / впервые',icon:'💎',re:/(эксклюзив|только здесь|exclusive|впервые|first time|никогда не|разоблач)/i,tip:'Уникальность контента — причина не пройти мимо.'},
 {key:'reveal',name:'Разбор / обзор',icon:'🔍',re:/(показываю|раскрываю|разбор|breakdown|review|обзор|анализ|reveal)/i,tip:'Разбор обещает глубину и инсайды.'},
 {key:'target',name:'Адресность',icon:'🧭',re:/(для новичк|для начинающ|for beginners|для тех кто|для тех, кто|для профи)/i,tip:'Чёткий адресат повышает релевантность для своей аудитории.'},
 {key:'personal',name:'Личная история',icon:'🙋',re:/(моя истори|я бросил|я ушёл|как я|my story|i quit|моя ошибка|честная истори)/i,tip:'Личные истории вызывают эмпатию и досматриваемость.'},
 {key:'caps',name:'КАПС / акцент',icon:'🔠',re:null,tip:'Слово капсом выделяет ключевую мысль — но одно, не весь заголовок.'},
 {key:'simple',name:'Короткий заголовок',icon:'✂️',re:null,tip:'Короткий заголовок (≤45 симв.) читается мгновенно в ленте.'},
 {key:'cta',name:'Призыв / до конца',icon:'📣',re:/(смотри до конца|не пропусти|watch till|подпиш|до самого конца)/i,tip:'Прямой призыв удерживает и догоняет досмотры.'},
 {key:'trend',name:'Тренд / хайп',icon:'🚀',re:/(тренд|trend|viral|вирус|хайп|hype|новинк|новый)/i,tip:'Привязка к тренду ловит волну текущего спроса.'},
 {key:'howmuch',name:'Сколько / измеримость',icon:'🧮',re:/(сколько|how much|how many)/i,tip:'«Сколько…» обещает конкретный измеримый ответ.'},
 {key:'warning',name:'Внимание / опасность',icon:'🚨',re:/(внимание|осторожно|warning|danger|опасн)/i,tip:'Сигнал тревоги мгновенно притягивает взгляд.'},
 {key:'contrast',name:'Контраст / неожиданно',icon:'🔄',re:/(\sно\s|однако|зато|на самом деле|\sbut\s|however|хотя)/i,tip:'Слом ожидания удерживает внимание дольше.'}
];

function TL_vpd(v){return (v&&v.viewsPerDay)||0;}
function TL_med(arr){const a=(arr||[]).filter(x=>typeof x==='number'&&isFinite(x)).sort((x,y)=>x-y);if(!a.length)return 0;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function TL_fmtMed(videos){const s=[],l=[];(videos||[]).forEach(v=>{const x=TL_vpd(v);if(x>0){(v.isShort?s:l).push(x);}});return {short:TL_med(s)||1,long:TL_med(l)||1};}
function TL_xr(v,fm){const base=v.isShort?fm.short:fm.long;return base>0?TL_vpd(v)/base:0;}
function TL_name(k){const t=TRIGGER_LIB.find(x=>x.key===k);return t?t.name:k;}
function TL_lc(s){s=String(s||'');return s?s.charAt(0).toLowerCase()+s.slice(1):s;}
function TL_strip(s){return String(s||'').replace(/\s+/g,' ').trim();}

function detectTitleTriggers(title){
  const t=String(title||'');const keys=[];
  for(const tr of TRIGGER_LIB){
    if(tr.key==='simple'){ if(t.length>0&&t.length<=45) keys.push('simple'); continue; }
    if(tr.key==='caps'){ if(/(^|\s)[A-ZА-ЯЁ]{3,}(\s|$|[!?.,:])/.test(t)) keys.push('caps'); continue; }
    try{ if(tr.re&&tr.re.test(t)) keys.push(tr.key); }catch(e){}
  }
  return keys;
}

const BOOST_TPL={
  howto:t=>{t=TL_strip(t);return /(^|\s)как\b/i.test(t)?'':'Как '+TL_lc(t);},
  question:t=>{t=TL_strip(t);return /\?\s*$/.test(t)?'':t.replace(/[.!\s]+$/,'')+'?';},
  year:t=>{t=TL_strip(t);return /\b20\d{2}\b/.test(t)?'':t+' в 2026';},
  number:t=>{t=TL_strip(t);return /\d/.test(t)?'':'5 '+TL_lc(t);},
  list:t=>{t=TL_strip(t);return /\d/.test(t)?'':'7 идей: '+TL_lc(t);},
  superlative:t=>{t=TL_strip(t);return /(лучш|топ|самый|best|top)/i.test(t)?'':'Лучший способ — '+TL_lc(t);},
  secret:t=>{t=TL_strip(t);return /(секрет|secret|тайн)/i.test(t)?'':'Секрет, о котором молчат: '+TL_lc(t);},
  curiosity:t=>{t=TL_strip(t);return 'Вот почему '+TL_lc(t);},
  result:t=>{t=TL_strip(t);return /(результат|до и после|итог)/i.test(t)?'':t+' — вот что вышло';},
  time:t=>{t=TL_strip(t);return /(за \d|\d\s*(мин|час|дн))/i.test(t)?'':t+' за 7 дней';},
  negative:t=>{t=TL_strip(t);return /(ошибк|не делай)/i.test(t)?'':'Не делай этого: '+TL_lc(t);},
  fomo:t=>{t=TL_strip(t);return t+' (пока не поздно)';}
};

function computeTriggerStats(videos){
  const vids=(videos||[]).filter(v=>v&&v.title&&TL_vpd(v)>0);
  if(vids.length<4) return [];
  const fm=TL_fmtMed(vids);
  vids.forEach(v=>{v._xr=TL_xr(v,fm);v._tk=detectTitleTriggers(v.title);});
  const out=[];
  for(const tr of TRIGGER_LIB){
    const wit=vids.filter(v=>v._tk.includes(tr.key));
    const wo=vids.filter(v=>!v._tk.includes(tr.key));
    if(wit.length<2||wo.length<1) continue;
    const medW=TL_med(wit.map(v=>v._xr)),medO=TL_med(wo.map(v=>v._xr));
    const lift=medO>0?medW/medO:1;
    let best=null;wit.forEach(v=>{if(!best||v._xr>best._xr)best=v;});
    out.push({key:tr.key,name:tr.name,icon:tr.icon,tip:tr.tip,count:wit.length,share:wit.length/vids.length,medXr:medW,lift:lift,best:best?{title:best.title,xr:best._xr,vpd:best.viewsPerDay}:null,verdict:lift>=1.15?'up':(lift<=0.85?'down':'mid')});
  }
  out.sort((a,b)=>b.lift-a.lift);
  return out;
}

function computeTriggerCombos(videos){
  const vids=(videos||[]).filter(v=>v&&v.title&&TL_vpd(v)>0);
  if(vids.length<6) return [];
  const fm=TL_fmtMed(vids);
  vids.forEach(v=>{v._xr=TL_xr(v,fm);v._tk=v._tk||detectTitleTriggers(v.title);});
  const overall=TL_med(vids.map(v=>v._xr))||1;
  const keys=TRIGGER_LIB.map(t=>t.key),combos=[];
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){
    const a=keys[i],b=keys[j];
    const both=vids.filter(v=>v._tk.includes(a)&&v._tk.includes(b));
    if(both.length<2) continue;
    const med=TL_med(both.map(v=>v._xr));
    combos.push({a:a,b:b,na:TL_name(a),nb:TL_name(b),count:both.length,medXr:med,lift:overall>0?med/overall:1});
  }
  combos.sort((x,y)=>y.lift-x.lift);
  return combos.filter(c=>c.lift>=1.05).slice(0,6);
}

function suggestTitleBoosts(videos){
  const vids=(videos||[]).filter(v=>v&&v.title&&TL_vpd(v)>0);
  if(vids.length<4) return [];
  const fm=TL_fmtMed(vids);
  const stats=computeTriggerStats(vids);
  const winners=stats.filter(s=>s.verdict==='up'&&BOOST_TPL[s.key]).slice(0,6);
  if(!winners.length) return [];
  vids.forEach(v=>{v._xr=TL_xr(v,fm);v._tk=v._tk||detectTitleTriggers(v.title);});
  const weak=vids.filter(v=>v._xr<1).sort((a,b)=>a._xr-b._xr).slice(0,6);
  const res=[];
  for(const v of weak){
    const missing=winners.filter(w=>!v._tk.includes(w.key)).slice(0,2);
    if(!missing.length) continue;
    const ideas=[];
    missing.forEach(w=>{let nt='';try{nt=BOOST_TPL[w.key](v.title);}catch(e){nt='';}if(nt&&nt!==v.title)ideas.push({trigger:w.name,icon:w.icon,lift:w.lift,newTitle:nt});});
    if(!ideas.length) continue;
    res.push({title:v.title,xr:v._xr,vpd:v.viewsPerDay,isShort:v.isShort,ideas:ideas});
  }
  return res.slice(0,5);
}

function _competitorTriggerGaps(){
  const comps=(typeof STATE!=='undefined'&&STATE.competitors)||[];
  const mine=(typeof STATE!=='undefined'&&STATE.videos)||[];
  if(!comps.length||mine.length<3) return [];
  const cvids=[];comps.forEach(c=>{const arr=(c.vids||[]).concat(c.shorts||[],c.longs||[]);arr.forEach(v=>{if(v&&v.title)cvids.push(v);});});
  if(cvids.length<3) return [];
  const mk={},ck={};
  mine.forEach(v=>detectTitleTriggers(v.title).forEach(k=>mk[k]=(mk[k]||0)+1));
  cvids.forEach(v=>detectTitleTriggers(v.title).forEach(k=>ck[k]=(ck[k]||0)+1));
  const gaps=[];
  TRIGGER_LIB.forEach(tr=>{const ms=(mk[tr.key]||0)/mine.length,cs=(ck[tr.key]||0)/cvids.length;if(cs>=0.25&&(cs-ms)>=0.15)gaps.push({key:tr.key,name:tr.name,icon:tr.icon,tip:tr.tip,mine:ms,comp:cs});});
  gaps.sort((a,b)=>(b.comp-b.mine)-(a.comp-a.mine));
  return gaps.slice(0,5);
}

function detectTriggersForDrawer(v){
  const keys=detectTitleTriggers(v&&v.title);
  const map={};TRIGGER_LIB.forEach(t=>map[t.key]=t);
  const out=keys.filter(k=>map[k]).slice(0,6).map(k=>({name:map[k].name+' '+map[k].icon,how:map[k].tip}));
  if(!out.length) return [{name:'Явных триггеров нет 🚫',how:'Заголовок не использует сильные крючки. Добавь число, вопрос или интригу — смотри Лабораторию триггеров.'}];
  return out;
}

function renderTriggerLab(){
  const area=(typeof $==='function')?$('#triggerArea'):document.getElementById('triggerArea');
  const sec=(typeof $==='function')?$('#triggerSection'):document.getElementById('triggerSection');
  if(!area) return;
  const stats=(typeof STATE!=='undefined'&&STATE.triggerStats)||[];
  if(!stats.length){ if(sec)sec.style.display='none'; return; }
  if(sec)sec.style.display='';
  const E=(typeof esc==='function')?esc:(s=>String(s==null?'':s));
  const F=(typeof fmt==='function')?fmt:(n=>String(n));
  const up=stats.filter(s=>s.verdict==='up'),down=stats.filter(s=>s.verdict==='down');
  const top=up[0],worst=down.length?down[down.length-1]:null;
  let concl='<div class="trg-concl">';
  if(top)concl+='🔥 Сильнее всего работает <b>'+E(top.name)+'</b>: ролики с ним набирают ×'+top.lift.toFixed(2)+' к остальным (выборка '+top.count+' видео).';
  if(worst)concl+=' ⚠️ А <b>'+E(worst.name)+'</b> тянет вниз (×'+worst.lift.toFixed(2)+') — используй аккуратнее.';
  if(!top&&!worst)concl+='Пока ни один триггер не даёт явного эффекта — тестируй новые крючки из таблицы ниже.';
  concl+='</div>';
  let rows='';
  stats.forEach(s=>{
    const cls=s.verdict==='up'?'up':(s.verdict==='down'?'down':'');
    const barW=Math.max(4,Math.min(100,Math.round(s.lift*42)));
    rows+='<div class="trg '+cls+'">'
      +'<div class="trg-h"><span class="trg-i">'+s.icon+'</span><span class="trg-n">'+E(s.name)+'</span><span class="trg-c">'+s.count+' видео · '+Math.round(s.share*100)+'%</span><span class="trg-v">×'+s.lift.toFixed(2)+'</span></div>'
      +'<div class="trg-bar"><i style="width:'+barW+'%"></i></div>'
      +(s.best?'<div class="trg-best">Лучший: «'+E(String(s.best.title).slice(0,80))+'» — '+F(Math.round(s.best.vpd))+'/день</div>':'')
      +'<div class="trg-tip">'+E(s.tip)+'</div></div>';
  });
  const combos=(typeof STATE!=='undefined'&&STATE.triggerCombos)||[];
  let comboHtml='';
  if(combos.length){comboHtml='<div class="trg-sub">🧬 Сильные связки триггеров</div><div class="trg-combos">';combos.forEach(c=>{comboHtml+='<div class="trg-combo"><span>'+E(c.na)+' + '+E(c.nb)+'</span><b>×'+c.lift.toFixed(2)+'</b><i>'+c.count+' видео</i></div>';});comboHtml+='</div>';}
  let gapHtml='';const gaps=_competitorTriggerGaps();
  if(gaps.length){gapHtml='<div class="trg-sub">🎯 Бьют конкуренты, а ты — нет</div><div class="trg-gaps">';gaps.forEach(g=>{gapHtml+='<div class="trg-gap-row"><span class="gi">'+g.icon+'</span><b>'+E(g.name)+'</b><span class="gp">у тебя '+Math.round(g.mine*100)+'% · у них '+Math.round(g.comp*100)+'%</span><em>'+E(g.tip)+'</em></div>';});gapHtml+='</div>';}
  let boostHtml='';const boosts=(typeof STATE!=='undefined'&&STATE.titleBoosts)||[];
  if(boosts.length){boostHtml='<div class="trg-sub">✏️ Перепиши слабые заголовки (черновики на данных, клик — копировать)</div><div class="trg-boost">';boosts.forEach(b=>{boostHtml+='<div class="trg-bcard"><div class="trg-bwas">Было: «'+E(b.title)+'» <span class="trg-bx">×'+b.xr.toFixed(2)+'</span></div>';b.ideas.forEach(id=>{boostHtml+='<div class="trg-bnew" onclick="try{navigator.clipboard.writeText(this.querySelector(\'b\').textContent)}catch(e){}" title="Клик — скопировать"><span class="trg-bi">'+id.icon+'</span><b>'+E(id.newTitle)+'</b><span class="trg-bl">+«'+E(id.trigger)+'» ×'+id.lift.toFixed(2)+'</span></div>';});boostHtml+='</div>';});boostHtml+='</div>';}
  area.innerHTML=concl+'<div class="trg-rows">'+rows+'</div>'+comboHtml+gapHtml+boostHtml;
}
/* === /TRIGGER LAB ENGINE === */


/* enter key */
$('#urlInput').addEventListener('keydown',e=>{if(e.key==='Enter')startAnalysis();});
$('#ideaInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')startIdeaSearch();});
try{renderQuota();}catch(e){}
