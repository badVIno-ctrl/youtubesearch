/* Тесты качественного пасса V32: чистый аудит, разделение Shorts/длинные,
   «Подключить канал» вместо «входа», удаление бесполезных модулей. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync} from 'node:fs';

const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const html = read('index.html');
const core = read('js/01_block_1.js');
const v2   = read('js/16_viora-v2-js.js');
const v5   = read('js/19_v5pack.js');
const v8   = read('js/22_v8pack.js');
const css  = read('css/styles.css');

/* ---- 1. Бесполезные модули удалены ---- */
const removed = ['15_block_15','28_block_28','29_block_29','30_block_30','31_block_31','32_block_32','34_block_34','35_block_35','36_block_36','37_block_37','38_block_38','39_block_39','42_v21pack','43_block_43','45_block_45','46_block_46','47_block_47'];
test('удалённые модули не подключены в index.html', () => {
  for (const f of removed) assert.ok(!html.includes(f+'.js'), f+' всё ещё в index.html');
});
test('файлы удалённых модулей отсутствуют', () => {
  for (const f of removed) assert.ok(!existsSync(new URL('../js/'+f+'.js', import.meta.url)), f+'.js не удалён');
});
test('все подключённые скрипты существуют', () => {
  for (const m of html.matchAll(/src="(js\/[^"]+)"/g)) assert.ok(existsSync(new URL('../'+m[1], import.meta.url)), m[1]+' подключён, но файла нет');
});

/* ---- 2. Промпты: только качественная польза, без мусорных полей ---- */
test('в промптах нет emotional_profile / triggers / roadmap_story', () => {
  for (const [name, src] of [['01_block_1.js', core], ['22_v8pack.js', v8]]) {
    assert.ok(!src.includes('"emotional_profile"'), name+': emotional_profile остался в схеме');
    assert.ok(!src.includes('"roadmap_story"'), name+': roadmap_story остался в схеме');
    assert.ok(!src.includes('"triggers":[{"trigger"'), name+': канальный triggers остался в схеме (пер-видео triggers в analyzeSingleVideo — ок)');
  }
});
test('validateAudit вычищает мусорные поля из старых кешей', () => {
  assert.ok(core.includes('delete out.emotional_profile'));
  assert.ok(core.includes('delete out.roadmap_story'));
});
test('промпт синтеза требует только выводы, ведущие к действию', () => {
  assert.ok(core.includes('Включай только выводы, которые ведут к действию'));
});

/* ---- 3. Разделение Shorts / длинные ---- */
test('дашборд содержит блок аудита по форматам', () => {
  assert.ok(core.includes('id="fmtAudit"'), 'нет контейнера fmtAudit');
  assert.ok(core.includes('function renderFormatAudit()'), 'нет renderFormatAudit');
  assert.ok(core.includes('renderFormatAudit();'), 'renderFormatAudit не вызывается');
  assert.ok(core.includes('Вывод по Shorts') && core.includes('Вывод по длинным роликам'));
  assert.ok(core.includes('Аудит роликов: Shorts и длинные — отдельно'));
});
test('промпты по-прежнему требуют раздельные выводы shorts/longform', () => {
  assert.ok(core.includes('"shorts_insights"') && core.includes('"longform_insights"'));
});
test('css для карточек аудита по форматам добавлен', () => {
  assert.ok(css.includes('.fmt-audit') && css.includes('.fa-card'));
});

/* ---- 4. «Подключить канал» вместо «входа» (152-ФЗ / 149-ФЗ, 406-ФЗ) ---- */
test('нет формулировок «вход через Google» в интерфейсе', () => {
  assert.ok(!v2.includes('Вход через Google'), '16: осталась формулировка входа');
  assert.ok(!html.includes('Вход через Google'));
});
test('кнопка «Подключить мой канал» есть на главной с дисклеймером', () => {
  assert.ok(html.includes('connectChannelBtn'));
  assert.ok(html.includes('Подключить мой канал'));
  assert.ok(html.includes('не вход и не регистрация'));
});
test('модалка объясняет: разовый импорт, только чтение, не регистрация', () => {
  assert.ok(v2.includes('не вход и не регистрация'));
  assert.ok(v2.includes('youtube.readonly'), 'scope должен остаться read-only');
});
test('kill-switch Google-авторизации убран из 19_v5pack', () => {
  assert.ok(!v5.includes('W.vMyChannel=function(){}'));
  assert.ok(!v5.includes('killGoogle();'));
});

/* ---- 5. Дашборд: мусорные секции удалены ---- */
test('удалены секции: эмоции, воронка TG, симулятор, метод-дамп', () => {
  assert.ok(!core.includes('id="emoSection"'), 'emoSection остался');
  assert.ok(!core.includes('Воронка YouTube → Telegram'), 'воронка осталась');
  assert.ok(!core.includes('Симулятор перед загрузкой'), 'симулятор остался');
  assert.ok(!core.includes('id="prodMethod"'), 'prodMethod остался');
  assert.ok(!core.includes('renderEmotions'), 'renderEmotions остался');
});
test('фоновая канва-«матрица» удалена (ноль CPU на фон)', () => {
  assert.ok(!html.includes('id="matrix"'));
  assert.ok(!core.includes('function matrix()'));
});

/* ---- 6. Полезное ядро не тронуто ---- */
test('ключевые полезные секции на месте', () => {
  for (const s of ['Фокус недели','Что конкретно менять','Когда постить','Твоя формула хита','Конкуренты — лицом к лицу','Контент-аудит и план на 30 дней','Динамика канала','Лаборатория заголовков','id="myStatsSection"'])
    assert.ok(core.includes(s), 'потеряна секция: '+s);
});
test('пайплайн анализа цел', () => {
  for (const fn of ['function renderDashboard()','async function callMistralMultipass','function buildMistralPayload','async function startAnalysis()'])
    assert.ok(core.includes(fn), 'потеряно: '+fn);
});
