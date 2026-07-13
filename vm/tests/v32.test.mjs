/* Тесты V32: реальное удержание, Analytics по форматам, история аудитов,
   A/B-память заголовков, экспорт ссылкой, PWA, онбординг-тур. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const html = read('index.html');
const core = read('js/01_block_1.js');
const v2   = read('js/16_viora-v2-js.js');
const v32  = read('js/68_v32pack.js');
const sw   = read('sw.js');
const css  = read('css/styles.css');

/* ---- 1. Реальное удержание ---- */
test('16: есть vRealRetention с elapsedVideoTimeRatio и кешем', () => {
  assert.ok(v2.includes('W.vRealRetention=function'));
  assert.ok(v2.includes('elapsedVideoTimeRatio'));
  assert.ok(v2.includes('audienceWatchRatio'));
  assert.ok(v2.includes('RET_CACHE'));
});
test('01: шторка ролика запрашивает факт и рисует две кривые', () => {
  assert.ok(core.includes('id="vdCurveSec"'));
  assert.ok(core.includes('async function vRealCurveMaybe'));
  assert.ok(core.includes('vRealCurveMaybe(v,curve)'));
  assert.ok(core.includes('function curveSVG2'));
  assert.ok(core.includes('Удержание: факт vs прогноз'));
  assert.ok(!core.includes('доступен только в твоём YouTube Studio'), 'старая приписка осталась');
});

/* ---- 2. Shorts vs длинные по Analytics ---- */
test('16: fmtRealFetch с creatorContentType и фолбэком без подписчиков', () => {
  assert.ok(v2.includes('function fmtRealFetch()'));
  assert.ok(v2.includes('creatorContentType'));
  assert.ok(v2.includes('VIDEO_ON_DEMAND'));
  assert.ok((v2.match(/dimensions=creatorContentType/g)||[]).length>=2, 'нет фолбэк-запроса');
  assert.ok(v2.includes('renderMyStats();\n    fmtRealFetch();'));
});
test('01: renderFormatAudit показывает реальные цифры и вердикт форматов', () => {
  assert.ok(core.includes('window.__vFmtReal'));
  assert.ok(core.includes('мин внимания на 1000 просм'));
  assert.ok(core.includes('fa-vs'));
  assert.ok(core.includes('Подписчиков на 1000 просмотров'));
});

/* ---- 3. История аудитов ---- */
test('01: снапшот хранит скор/утечку/прогресс плана', () => {
  assert.ok(core.includes('score:(STATE.ai&&isFinite(+STATE.ai.score))'));
  assert.ok(core.includes('planDone:'));
});
test('01: renderHistory сравнивает аудиты', () => {
  assert.ok(core.includes('Скор аудита:'));
  assert.ok(core.includes('Закрыто пунктов плана'.replace('З','з')));
  assert.ok(core.includes('${auditBlk}'));
  assert.ok(core.includes('ah-chip'));
});

/* ---- 4. A/B-память заголовков ---- */
test('01: vAbApply/renderAbTitles/контейнер/кнопка в шторке', () => {
  assert.ok(core.includes('window.vAbApply=function'));
  assert.ok(core.includes('function renderAbTitles()'));
  assert.ok(core.includes('id="abArea"'));
  assert.ok(core.includes('renderAbTitles();'));
  assert.ok(core.includes('rw-ab'));
  assert.ok(core.includes("viora_ab_titles:"));
  assert.ok(core.includes('A/B-память заголовков'));
});

/* ---- 5. Экспорт ссылкой ---- */
test('68 подключён, кнопка в экспорт-баре есть', () => {
  assert.ok(html.includes('js/68_v32pack.js'));
  assert.ok(core.includes('vShareLink(this)'));
  assert.ok(core.includes('Ссылка на аудит'));
  assert.ok(v32.includes('#a='));
  assert.ok(v32.includes('CompressionStream')&&v32.includes('DecompressionStream'));
});
test('68: кодек ссылки — реальный roundtrip (сжатие + base64url)', async () => {
  const sandbox = {
    window:{location:{hash:''}}, location:{hash:''},
    document:{readyState:'complete', addEventListener(){}, createElement:()=>({}), getElementById:()=>null, body:{appendChild(){}, style:{}}},
    navigator:{}, history:{replaceState(){}},
    btoa, atob, TextEncoder, TextDecoder, Blob, Response,
    CompressionStream, DecompressionStream, Uint8Array, Promise, JSON, Math, Date, String, Array, Object, console,
  };
  vm.createContext(sandbox);
  vm.runInContext(v32, sandbox);
  const api = sandbox.window.__v32;
  assert.ok(api && api.encodeAudit && api.decodeAudit, '__v32 не экспортирован');
  const payload = {v:1,d:'2026-07-12',ch:{t:'Тестовый канал «Ёжики»',s:12345,n:87},sc:64,
    lk:'Слабые хуки: зритель уходит в первые 10 секунд',sh:'Shorts работают лучше с цифрами',lf:'Длинные держат до 40%',
    ns:20,nl:15,ms:1500,ml:300,pl:['Шаг 1','Шаг 2 с эмодзи 🎯'],cg:['Поменять обложки']};
  const enc = await api.encodeAudit(payload);
  assert.match(enc, /^[01][A-Za-z0-9_-]+$/, 'не base64url: '+enc.slice(0,30));
  const dec = await api.decodeAudit(enc);
  assert.deepEqual(dec, payload, 'roundtrip исказил данные');
});

/* ---- 6. PWA ---- */
test('sw.js есть, регистрируется, не трогает чужие домены', () => {
  assert.ok(existsSync(new URL('../sw.js', import.meta.url)));
  assert.ok(v2.includes("serviceWorker.register('sw.js')"));
  assert.ok(v2.includes("location.protocol!=='file:'"));
  assert.ok(sw.includes('url.origin!==location.origin'));
  assert.ok(sw.includes("req.method!=='GET'"));
});
test('sw.js: CORE синхронизирован с index.html', () => {
  const srcs=[...html.matchAll(/src="(js\/[^"]+)"/g)].map(m=>m[1]);
  assert.ok(srcs.length>40);
  for(const s of srcs) assert.ok(sw.includes('"./'+s+'"'), s+' не в CORE кеше');
  assert.ok(sw.includes('"./css/styles.css"') && sw.includes('"./index.html"'));
  for(const m of sw.matchAll(/"\.\/(js\/[^"]+)"/g)) assert.ok(srcs.includes(m[1]), m[1]+' в CORE, но не в index.html');
});

/* ---- 7. Онбординг-тур ---- */
test('16: тур обновлён под новую структуру', () => {
  assert.ok(v2.includes("sel:'#fmtAudit'"), 'нет шага про форматы');
  assert.ok(v2.includes("sel:'#historyArea'"), 'нет шага про историю');
  const steps=[...v2.matchAll(/\{sel:'([^']+)'/g)].map(m=>m[1]);
  for(const sel of steps.flatMap(s=>s.split(','))){
    const id=sel.trim();
    if(id.startsWith('#')) assert.ok(core.includes('id="'+id.slice(1)+'"'), 'тур целится в несуществующий '+id);
  }
  assert.ok(v2.includes('Подключить мой канал» на главной'), 'финальный тост не обновлён');
});

/* ---- 8. CSS и дизайн ---- */
test('css: стили новых блоков + reduced-motion', () => {
  for(const cls of ['.fx-legend','.rw-ab','.fa-real','.fa-vs','.aud-hist','.ab-row','.vshare-ov','.vsh-card'])
    assert.ok(css.includes(cls), 'нет стиля '+cls);
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(css.includes('cubic-bezier(.22,1,.36,1)'));
});
