# 13. Тестирование

В проекте — **двухуровневое тестирование**, оба уровня уже подключены и работают.

| Уровень | Инструмент | Что покрывает | Где |
| --- | --- | --- | --- |
| Unit | **Vitest** | Чистая TS-логика (`Board`, `matchFinder`, `cascade`, `gameMachine`, `scoring`, `CommandQueue`) | `tests/unit/` |
| E2E  | **Playwright** | Реальный браузер: меню, переход в игру, HUD, отсутствие console errors | `tests/e2e/` |

Текущее состояние: **40 unit-тестов + 5 E2E-тестов**, все зелёные.

## Команды

```bash
# Unit (Vitest)
npm run test             # все unit-тесты, один прогон
npm run test:watch       # watch-режим
npm run test:coverage    # с покрытием → coverage/index.html

# E2E (Playwright)
npm run test:e2e         # headless
npm run test:e2e:headed  # с видимым окном
npm run test:e2e:ui      # Playwright UI mode (рекомендую при разработке)
npm run test:e2e:report  # открыть HTML-репорт последнего прогона

# Оба
npm run test:all
```

Перед первым запуском E2E: `npx playwright install chromium`.

## Структура

```
tests/
├── unit/
│   ├── helpers.ts          ← makeBoard, makeEmptyBoard, applyLayout, readLayout, isFull
│   ├── Board.test.ts
│   ├── matchFinder.test.ts
│   ├── cascade.test.ts
│   ├── gameMachine.test.ts
│   ├── scoring.test.ts
│   └── CommandQueue.test.ts
└── e2e/
    ├── helpers/
    │   └── game.ts          ← gotoApp, startGame, hud, gameCanvas
    ├── menu.spec.ts
    └── game.spec.ts
```

Конфиги:

- `vitest.config.ts` — наследует резолв-алиасы от `vite.config.ts`
  (мерджем `mergeConfig`), Node-окружение, входы — `tests/unit/**/*.test.ts`.
- `playwright.config.ts` — `webServer` сам поднимает Vite, baseURL,
  retries для CI, screenshots/video/trace на падениях.

## Unit-тесты: правила

### Layout-first ассерты

Хелпер `applyLayout` принимает матрицу `number[][]`, где значение —
это `type` тайла, а `-1` — пусто. Тест читается как ASCII-art:

```ts
const board = makeEmptyBoard(5, 5);
applyLayout(board, [
  [2, 3, 1, 4, 5],
  [6, 7, 1, 8, 9],
  [1, 1, 1, 0, 2],   // ← горизонталь длины 3
  [3, 4, 5, 6, 7],
  [8, 9, 0, 1, 2],
]);
expect(findMatches(board)).toHaveLength(1);
```

### Подводный камень: разноцветный фон

Если в качестве "фона" поставить один тип (например, везде `9`), вокруг
полезной фигуры **возникнут лишние линии**. В шаблонных тестах фон
заполняется разными типами, как в примере выше.

### Помощник для коллапса

`applyLayout` **не пересоздаёт** тайлы — он меняет поле `type` у
существующих, сохраняя `id`. Это критично для тестов `cascade`, где
проверяется, что упавший тайл — это **тот же самый тайл** по `id`,
а не новый из `refill`.

### Глушим намеренный шум

В тесте «ошибка в команде не блокирует очередь» `CommandQueue.tick()`
выводит `console.error`. Чтобы не засорять вывод:

```ts
const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
// ...
errSpy.mockRestore();
```

То же — для `gameMachine` (`console.warn` при невалидном переходе).

## E2E-тесты: правила

### Селекторы — по ролям и тексту

```ts
page.getByRole('button', { name: 'Начать игру' });
page.locator('.panel').filter({ hasText: 'Очки' }).locator('strong');
page.locator('canvas');
```

Хелперы в `tests/e2e/helpers/game.ts` инкапсулируют это.

### Канвас тестируется через `boundingBox`

Pixi не выставляет внутреннюю структуру в DOM. Кликаем по координатам:

```ts
const box = await gameCanvas(page).boundingBox();
await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
```

### Игра недетерминирована

RNG генерирует доску по случайному seed'у. В E2E **не** проверяйте
конкретные значения счёта или тайлы. Только инварианты:

- HUD остался числом (`/^\d+$/`)
- Канвас видим, ненулевой
- В консоли нет ошибок

Для **детерминированных** проверок: добавьте `?seed=42` query-param и
пробросьте в `Board`. Появится возможность ассертить конкретные позиции
после клика.

### Не используйте `waitForTimeout` как способ ждать UI

`expect(...).toBeVisible()` имеет встроенный retry. `waitForTimeout`
оправдан только для пауз "дать игре поработать" в стресс-тестах.

## CI

Минимальный workflow для GitHub Actions:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## Cursor-правила

В `.cursor/rules/` лежат два правила, которые Cursor подтянет
автоматически при работе с тестами:

- `vitest-tests.mdc` — для `tests/unit/**`
- `playwright-tests.mdc` — для `tests/e2e/**`

## Чек-лист для расширения тестов

- [ ] Бустеры: бомба, линейный, цветной (когда появятся в `cascade.ts`).
- [ ] Анти-deadlock: проверка `findFirstValidMove` (когда появится).
- [ ] Seed-тесты конкретных сценариев (длинный каскад из 4+ шагов).
- [ ] Snapshot тестов через `toHaveScreenshot` для меню/HUD.
- [ ] Property-based тесты `Board.collapse`/`refill` с fast-check (опционально).
