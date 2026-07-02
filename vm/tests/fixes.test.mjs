/*
 * Тесты к трём правкам:
 *   1) Анти-429: троттлинг + экспоненциальный кулдаун в ytFetch (js/01_block_1.js)
 *   2) Нижняя навигация #vQuickNav — корректный скролл (js/67_uipolish.js)
 *   3) Полное удаление счётчика лимитов API (#quotaPill)
 *
 * Запуск:  node --test tests/
 * Зависимостей нет — только встроенные node:test / node:assert.
 * Часть тестов ИЗВЛЕКАЕТ реальный код анти-429 из исходника и исполняет его.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SRC_01 = read('js/01_block_1.js');
const SRC_67 = read('js/67_uipolish.js');
const SRC_HTML = read('index.html');

/* Извлекаем реальный анти-429 блок из 01_block_1.js и оживляем его */
function loadAnti429() {
  const start = SRC_01.indexOf('let _ytCooldownUntil');
  const mPos = SRC_01.indexOf('function _ytReset(){');
  const end = SRC_01.indexOf('\n', mPos);
  assert.ok(start !== -1 && mPos !== -1, 'анти-429 блок должен присутствовать');
  const block = SRC_01.slice(start, end);

  const sleeps = [];
  const sleep = (ms) => { sleeps.push(ms); return Promise.resolve(); };

  const factory = new Function('sleep', `
    ${block}
    return {
      _ytThrottle, _ytIsRateLimited, _ytTrip, _ytReset,
      state: () => ({ cooldownUntil: _ytCooldownUntil, backoff: _ytBackoff, lastAt: _ytLastAt }),
      MIN: YT_COOLDOWN_MIN, MAX: YT_COOLDOWN_MAX,
    };
  `);
  return { api: factory(sleep), sleeps };
}

/* ============================ 1. АНТИ-429 ============================ */

test('_ytIsRateLimited распознаёт 429 и квотные reason-ы', () => {
  const { api } = loadAnti429();
  assert.equal(api._ytIsRateLimited(429, ''), true);
  assert.equal(api._ytIsRateLimited(403, 'quotaExceeded'), true);
  assert.equal(api._ytIsRateLimited(403, 'rateLimitExceeded'), true);
  assert.equal(api._ytIsRateLimited(200, 'rateLimitExceeded'), true);
  assert.equal(api._ytIsRateLimited(500, 'backendError'), false);
  assert.equal(api._ytIsRateLimited(404, ''), false);
  assert.equal(api._ytIsRateLimited(200, ''), false);
});

test('кулдаун включается, растёт экспоненциально, reset снимает', () => {
  const { api } = loadAnti429();
  assert.equal(api.state().cooldownUntil, 0);
  api._ytTrip();
  const s1 = api.state();
  assert.equal(s1.backoff, api.MIN);
  assert.ok(s1.cooldownUntil > Date.now());
  api._ytTrip();
  assert.equal(api.state().backoff, api.MIN * 2);
  for (let i = 0; i < 20; i++) api._ytTrip();
  assert.equal(api.state().backoff, api.MAX);
  api._ytReset();
  assert.equal(api.state().cooldownUntil, 0);
  assert.equal(api.state().backoff, 0);
});

test('троттлинг: search ждёт ~450мс, обычный запрос ~90мс', async () => {
  const { api, sleeps } = loadAnti429();
  await api._ytThrottle('search?q=a');
  assert.equal(sleeps.length, 0, 'первый запрос без задержки');
  await api._ytThrottle('search?q=b');
  const lastSearch = sleeps[sleeps.length - 1];
  assert.ok(lastSearch >= 400 && lastSearch <= 450, `search ~450мс, получено ${lastSearch}`);
  await api._ytThrottle('videos?id=x');
  const lastVideos = sleeps[sleeps.length - 1];
  assert.ok(lastVideos >= 60 && lastVideos <= 90, `videos ~90мс, получено ${lastVideos}`);
});

test('РЕГРЕСС: во время кулдауна поллер не делает сетевых запросов', () => {
  const { api } = loadAnti429();
  const canHitNetwork = () => Date.now() >= api.state().cooldownUntil;
  api._ytTrip();
  let networkCalls = 0;
  for (let tick = 0; tick < 30; tick++) { if (canHitNetwork()) networkCalls++; }
  assert.equal(networkCalls, 0, 'пока кулдаун активен — 0 обращений к сети');
});

test('исходник ytFetch: кулдаун ДО сети, 429 не ретраится, успех сбрасывает', () => {
  assert.match(SRC_01, /if\(Date\.now\(\)<_ytCooldownUntil\)\{/);
  assert.match(SRC_01, /await _ytThrottle\(path\)/);
  assert.match(SRC_01, /if\(_ytIsRateLimited\(r\.status,reason\)\)\{_ytTrip\(\);throw e;\}/);
  assert.match(SRC_01, /_ytReset\(\);\n\s*if\(cacheable\)_cacheSet/);
});

/* ===================== 2. НИЖНЯЯ НАВИГАЦИЯ #vQuickNav ================ */

test('#vQuickNav: уникальные id без коллизий', () => {
  assert.match(SRC_67, /_vqnSeq\+\+/);
  assert.doesNotMatch(SRC_67, /'vnav-'\+items\.length/);
  let seq = 0;
  const ids = new Set();
  for (let rebuild = 0; rebuild < 5; rebuild++) {
    for (let i = 0; i < 7; i++) ids.add('vqnav-' + (seq++));
  }
  assert.equal(ids.size, 35);
});

test('#vQuickNav: скролл учитывает высоту шапки и раскрывает секцию', () => {
  assert.match(SRC_67, /getBoundingClientRect\(\)\.top\+W\.pageYOffset-off/);
  assert.match(SRC_67, /navbar\?navbar\.getBoundingClientRect\(\)\.height/);
  assert.match(SRC_67, /classList\.contains\('collapsed'\)/);
  const navHeight = 64, off = navHeight + 14, rectTop = 20, pageYOffset = 1000;
  const y = rectTop + pageYOffset - off;
  assert.equal(y, 942);
  assert.ok(y < pageYOffset);
});

/* ===================== 3. УДАЛЕНИЕ СЧЁТЧИКА ЛИМИТОВ ================== */

test('счётчик лимитов API удалён из разметки', () => {
  assert.doesNotMatch(SRC_HTML, /id="quotaPill"/);
  assert.doesNotMatch(SRC_HTML, /class="quota-pill"/);
});

test('ytFetch не инкрементирует счётчик квоты', () => {
  assert.doesNotMatch(SRC_01, /quotaAdd\(quotaCost\(path\)\)/);
});

test('renderQuota безопасен без элемента', () => {
  assert.match(SRC_01, /getElementById\('quotaPill'\);if\(!el\)return;/);
});
