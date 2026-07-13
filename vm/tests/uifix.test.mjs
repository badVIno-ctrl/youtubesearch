/* Тесты V33-fix: стеклянная навигация сверху, карточки заголовков,
   окно публикации из ниши, память подключения, типографика. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';

const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const css  = read('css/styles.css');
const html = read('index.html');
const core = read('js/01_block_1.js');
const v2   = read('js/16_viora-v2-js.js');
const j67  = read('js/67_uipolish.js');

/* 1. Панель разделов сверху со стеклом */
test('quick-nav: закреплена сверху, стекло, не сливается с фоном', () => {
  const m = css.match(/#vQuickNav\{[^}]+\}/);
  assert.ok(m, 'нет правила #vQuickNav');
  const r = m[0];
  assert.ok(r.includes('top:70px'), 'не сверху');
  assert.ok(!r.includes('bottom:14px'), 'осталась снизу');
  assert.ok(r.includes('backdrop-filter:blur(18px) saturate(1.6)'), 'нет стекла');
  assert.ok(r.includes('-webkit-backdrop-filter'), 'нет webkit-стекла (Safari)');
  assert.ok(r.includes('border:1px solid') && r.includes('inset 0 1px 0'), 'нет отбивки от фона');
  assert.ok(r.includes('cubic-bezier(.22,1,.36,1)'), 'нет фирменной анимации');
  // прыжок к секции учитывает высоту панели
  assert.ok(j67.includes("_qn.getBoundingClientRect().height+22"), 'оффсет прыжка не учитывает панель');
});

/* 2. Карточки заголовков */
test('ns-title-row: колонка, жёлтая подпись переносится и не вылезает', () => {
  const row = css.match(/\.ns-title-row\{[^}]+\}/)[0];
  assert.ok(row.includes('flex-direction:column'));
  const tt = css.match(/\.ns-title-row \.tt\{[^}]+\}/)[0];
  assert.ok(tt.includes('overflow-wrap:anywhere') && tt.includes('max-width:100%'));
  const chip = css.match(/\.ns-title-row \.chip\{[^}]+\}/)[0];
  assert.ok(chip.includes('white-space:normal') && chip.includes('max-width:100%'), 'чип всё ещё не переносится');
  assert.ok(!chip.includes('flex:0 0 auto'), 'чип не сжимается');
});

/* 3. Окно публикации из ниши */
test('bestWindow: фолбэк на нишу при <6 своих роликах', () => {
  assert.ok(core.includes("src:'niche'"), 'нет нишевого источника');
  assert.ok(core.includes('_ownN<6'), 'нет порога по своим данным');
  assert.ok(core.includes('v.viewsPerDay/_md'), 'нет нормировки по медиане канала-конкурента');
  assert.ok(core.includes('Публикуй в окно хитов ниши'), 'фокус недели не различает источник');
  assert.ok(core.includes('Окно хитов твоей ниши'), 'тепловая карта без нишевого фолбэка');
  assert.ok(core.includes("src:'own'"), 'свой источник не помечен');
});

/* 4. Память подключения */
test('16: токен хранится, восстанавливается, синхронизируется между вкладками', () => {
  assert.ok(v2.includes("TOK_KEY='viora_ytok_v1'"));
  assert.ok(v2.includes('o.e>Date.now()'), 'нет проверки срока токена');
  assert.ok(v2.includes("addEventListener('storage'"), 'нет синхронизации вкладок');
  assert.ok(v2.includes('tokSave({t:MY_TOKEN,e:Date.now()+55*60*1000})'), 'токен не сохраняется при подключении');
  assert.ok(v2.includes('r.status===401') && v2.includes('tokClear()'), 'протухший токен не чистится');
  assert.ok(v2.includes('Канал подключён'), 'кнопка не меняет состояние');
  assert.ok(v2.includes('Google API: 403 — нет доступа'), '403 без понятного объяснения');
  assert.ok(css.includes('#connectChannelBtn.connected'), 'нет стиля подключённой кнопки');
});

/* 5. Типографика */
test('шрифты: Sora (без кириллицы) убран везде, Unbounded подключён', () => {
  assert.ok(html.includes('family=Unbounded'), 'Unbounded не грузится');
  assert.ok(!html.includes('Sora'), 'Sora в index.html');
  assert.ok(!/\bSora\b/.test(css), 'Sora в css');
  for (const f of readdirSync(new URL('../js', import.meta.url)))
    assert.ok(!/\bSora\b/.test(read('js/'+f)), 'Sora в js/'+f);
  assert.ok(css.includes("font-family:'Unbounded','Onest'"), 'нет дисплейного правила');
  assert.ok(!css.includes("'Onest','Onest'"), 'задвоенный Onest');
});

/* sw: новая версия кеша, чтобы пользователи получили обновление */
test('sw.js: версия кеша поднята', () => {
  assert.ok(read('sw.js').includes("CACHE='viora-v33-1'"));
});
