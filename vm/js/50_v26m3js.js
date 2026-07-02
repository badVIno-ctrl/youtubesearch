(function(){
'use strict';
if(window.__v26m3)return;window.__v26m3=true;
var D=document,W=window;
function q(s,r){return (r||D).querySelector(s);}
function qa(s,r){return [].slice.call((r||D).querySelectorAll(s));}
function lget(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function S(){try{return (typeof STATE!=='undefined'&&STATE)?STATE:(W.STATE||{});}catch(e){return {};}}
function hasChannel(){try{return !!S().channel;}catch(e){return false;}}

/* ---------- Шаг 1: один командный центр ---------- */
function hideDups(){
  try{['v26navBtn','v12navAgent'].forEach(function(id){var el=D.getElementById(id);if(el&&!el.classList.contains('v26m3-dup-hidden'))el.classList.add('v26m3-dup-hidden');});}catch(e){}
}
function closeHq(){try{if(typeof W.v16HqClose==='function')W.v16HqClose();}catch(e){}}
function openHub(tab){
  try{
    if(typeof W.v26HubOpen!=='function')return;
    W.v26HubOpen();
    if(tab&&tab!=='cal'){setTimeout(function(){try{var h=D.getElementById('v26hub');var b=h&&h.querySelector('.v26-tab[data-t=\"'+tab+'\"]');if(b)b.click();}catch(e){}},70);}
  }catch(e){}
}
function openAgent(){try{if(typeof W.v12AgentOpen==='function')W.v12AgentOpen();}catch(e){}}
function injectLauncher(){
  try{
    var hq=D.getElementById('v16hq');if(!hq)return;
    if(hq.querySelector('#v26m3launch'))return;
    var tabs=hq.querySelector('.v16-tabs');if(!tabs)return;
    var bar=D.createElement('div');bar.id='v26m3launch';
    bar.innerHTML='<div class=\"v26m3-lh\">🎬 Инструменты продюсера</div>'+
      '<button class=\"v26m3-lbtn\" data-act=\"cal\"><span class=\"ic\">📅</span>Контент-план</button>'+
      '<button class=\"v26m3-lbtn\" data-act=\"week\"><span class=\"ic\">🗓</span>Разбор недели</button>'+
      '<button class=\"v26m3-lbtn\" data-act=\"turnkey\"><span class=\"ic\">🎥</span>Ролик под ключ</button>'+
      '<button class=\"v26m3-lbtn\" data-act=\"rivals\"><span class=\"ic\">📡</span>Перехват трендов</button>'+
      '<button class=\"v26m3-lbtn\" data-act=\"agent\"><span class=\"ic\">💎</span>AI-продюсер</button>';
    bar.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;var a=b.getAttribute('data-act');if(a==='agent')openAgent();else openHub(a);});
    tabs.parentNode.insertBefore(bar,tabs.nextSibling);
  }catch(e){}
}

/* ---------- Шаг 2: сворачиваемые блоки ---------- */
function skey(id){return 'viora_v26m3_acc_'+id;}
function isCollapsed(id){return lget(skey(id),true)!==false;}
function headFor(id){return q('.v26m3-acc-head[data-for="'+id+'"]');}
function applyState(id){
  var blk=D.getElementById(id);if(!blk)return;
  var c=isCollapsed(id);var head=headFor(id);
  blk.classList.toggle('v26m3-collapsed',c);
  if(head)head.classList.toggle('open',!c);
}
function toggleAcc(id){lset(skey(id),!isCollapsed(id));applyState(id);}
function accWrap(id,title,sub){
  var blk=D.getElementById(id);if(!blk||!blk.parentNode)return;
  var head=headFor(id);
  if(head&&head.nextElementSibling===blk){applyState(id);return;}
  if(head&&head.parentNode)head.parentNode.removeChild(head);
  head=D.createElement('div');head.className='v26m3-acc-head';head.setAttribute('data-for',id);
  head.innerHTML='<span>'+title+'</span>'+(sub?'<span class=\"sub\">'+sub+'</span>':'')+'<span class=\"chev\">▾</span>';
  head.addEventListener('click',function(){toggleAcc(id);});
  blk.parentNode.insertBefore(head,blk);
  applyState(id);
}

/* ---------- Шаг 3: честный режим без воды ---------- */
function detectNiche(){
  try{
    var s=S();if(s.primaryNiche)return s.primaryNiche;
    var el=D.getElementById('v25niche')||D.getElementById('ideaInput');
    if(el&&el.value&&el.value.trim())return el.value.trim();
    var p=lget('viora_profile_v1',null);if(p&&p.niche)return p.niche;
    var last=lget('viora_v26m3_niche','');if(last)return last;
  }catch(e){}
  return '';
}
function enhanceCtx(){
  try{
    var orig=W.v26ctx;
    if(typeof orig!=='function'||orig.__v26m3)return;
    var wrapped=function(){
      var base='';try{base=orig.apply(this,arguments)||'';}catch(e){base='';}
      try{
        if(!hasChannel()){
          var niche=detectNiche();var prof=lget('viora_profile_v1',null)||{};
          var lvl=prof.level==='pro'?'опытный автор':'новичок';
          var goal=prof.goalLabel||prof.goal||'';
          var L=['ВАЖНО: канал автора ещё НЕ разобран, реальных цифр канала пока нет.'];
          if(niche)L.push('Ниша/тема автора: '+niche+'.');
          L.push('Уровень автора: '+lvl+'.');
          if(goal)L.push('Цель: '+goal+'.');
          L.push('ПРАВИЛА КАЧЕСТВА: давай конкретные, актуальные идеи и шаги именно под эту нишу и уровень — точные форматы, готовые заголовки и механику, почему это залетит сейчас. НЕ проси абстрактно \'разобрать канал\' и не давай общих советов вроде \'снимай регулярнее\' или \'улучши заголовки\'.');
          var extra=L.join('\n');
          return base?(base+'\n'+extra):extra;
        }
      }catch(e){}
      return base;
    };
    wrapped.__v26m3=true;W.v26ctx=wrapped;
  }catch(e){}
}
function gotoAnalyze(){
  try{var inp=D.getElementById('urlInput');if(inp){inp.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){try{inp.focus();}catch(e){}},350);}}catch(e){}
}
W.v26m3Analyze=gotoAnalyze;
function syncBanner(){
  /* Баннер «Разбери канал» отключён: дублирует главную форму анализа выше по странице. */
  try{
    var existing=D.getElementById('v26m3banner');
    if(existing&&existing.parentNode)existing.parentNode.removeChild(existing);
  }catch(e){}
}

/* ---------- цикл сопровождения ---------- */
function tick(){
  hideDups();
  injectLauncher();
  enhanceCtx();
  accWrap('v24Brain','🧠 Виора-Мозг','что я знаю о тебе и канале');
  accWrap('v23mPath','🚀 Путь роста','твои уровни и задачи');
  syncBanner();
}
function boot(){try{tick();}catch(e){}}
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',boot);else boot();
setTimeout(boot,600);setTimeout(boot,1500);setTimeout(boot,3000);
setInterval(function(){try{tick();}catch(e){}},1200);
W.__v26m3api={tick:tick,toggle:toggleAcc,openHub:openHub};
})();
