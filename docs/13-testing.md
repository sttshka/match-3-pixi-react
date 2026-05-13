# 13. Тестирование

В проекте используется **двухуровневый подход**:

- **E2E (Playwright)** — единственный обязательный уровень; уже подключён.
  Тесты лежат в `tests/e2e/`, конфиг — `playwright.config.ts` в корне.
- **Unit (Vitest)** — опционально, для чистой доменной логики
  (`Board`, `matchFinder`, `cascade`, `gameMachine`, `scoring`). См. раздел
  «Unit-тесты» в конце.

## Подключённые инструменты

| Инструмент | Назначение | Где живёт |
| --- | --- | --- |
| `@playwright/test` | E2E-тесты в реальном браузере | `tests/e2e/*.spec.ts` |
| Helpers (`gotoApp`, `startGame`, `hud`, `gameCanvas`) | Селекторы и шаги | `tests/e2e/helpers/game.ts` |
| `playwright.config.ts` | Конфиг + `webServer` (Vite поднимается автоматически) | корень |
| `.cursor/rules/playwright-tests.mdc` | Правило для Cursor: куда и как писать тесты | `.cursor/rules/` |

## Быстрый старт

```bash
npm install
npx playwright install chromium   # один раз на машину/CI
npm run test                      # headless
npm run test:headed               # с видимым окном
npm run test:ui                   # Playwright UI mode (рекомендуется при разработке)
npm run test:report               # открыть HTML-репорт после прогона
```

`playwright.config.ts` сам поднимает Vite на `http://localhost:5173`
через `webServer` и переиспользует уже запущенный сервер локально.

## Где лежит что

```
tests/
└── e2e/
    ├── helpers/
    │   └── game.ts          ← общие шаги (gotoApp, startGame, hud, gameCanvas)
    ├── menu.spec.ts         ← проверка стартового меню
    └── game.spec.ts         ← проверка игровой сцены и HUD
```

## Шаблон нового теста

```ts
import { test, expect } from '@playwright/test';
import { gotoApp, startGame, hud } from './helpers/game';

test.describe('<фича>', () => {
  test('<пользовательский сценарий>', async ({ page }) => {
    await gotoApp(page);
    await startGame(page);

    const { score } = hud(page);
    await expect(score).toHaveText('0');
  });
});
```

## Правила, важные для match-3

1. **Игра недетерминирована.** RNG генерирует доску по случайному seed'у.
   В тестах **не** проверяйте конкретные значения счёта или конкретные
   тайлы. Проверяйте **инварианты**:
   - HUD остался числом (`/^\d+$/`)
   - Канвас видим, ненулевой
   - Нет console errors
2. **Для детерминированных проверок** добавляйте seed (например, через
   query-param `?seed=42`) и пробрасывайте его в `Board`. Это позволит
   ассертить конкретные позиции.
3. **Канвас тестируется через `boundingBox`** и `page.mouse.click(x, y)` —
   внутренних DOM-узлов у тайлов нет.
4. **Не используйте `page.waitForTimeout` как способ ждать UI.** Это
   допустимо только для пауз "дать игре поработать" в стресс-тестах.
   В остальных случаях — `await expect(...).toBeVisible()` (с встроенным
   retry).

## Селекторы — по ролям и тексту

```ts
page.getByRole('button', { name: 'Начать игру' });
page.locator('.panel').filter({ hasText: 'Очки' }).locator('strong');
page.locator('canvas');
```

Не привязывайтесь к классам типа `.panel` напрямую (могут меняться при
рефакторинге CSS) — используйте хелперы.

## Отладка падений

- HTML-репорт после прогона: `npm run test:report`.
- Скриншоты, видео и trace падений лежат в `test-results/`.
- Trace открывается так:
  ```bash
  npx playwright show-trace test-results/<имя>/trace.zip
  ```
- В коде теста можно поставить `await page.pause()` для остановки и
  открытия Playwright Inspector.

## CI

Playwright корректно работает в GitHub Actions:

```yaml
name: CI
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run build
      - run: npm run test
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

## Unit-тесты (опционально, Vitest)

Если/когда захотите unit-тесты доменной логики:

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Минимальный конфиг можно встроить в `vite.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
// ...
test: {
  environment: 'node',
  include: ['tests/unit/**/*.test.ts'],
},
```

Пример теста `matchFinder`:

```ts
import { describe, expect, it } from 'vitest';
import { Board } from '@game/board/Board';
import { findMatches } from '@game/board/matchFinder';

describe('matchFinder', () => {
  it('finds horizontal line of 3', () => {
    const board = new Board(5, 1, 1);
    // helper, который явно подменяет cells (см. tests/unit/helpers.ts)
    setRow(board, 0, [0, 0, 0, 1, 1]);
    const m = findMatches(board);
    expect(m).toHaveLength(1);
    expect(m[0].length).toBe(3);
    expect(m[0].kind).toBe('row');
  });
});
```

## Чек-лист тестов для match-3 (на будущее)

- [ ] Свопы без матча — откатываются, ход не тратится.
- [ ] Свопы с матчем — удаляют тайлы и обновляют счёт.
- [ ] Каскад работает рекурсивно (минимум 2 шага).
- [ ] `gameMachine` запрещает невалидные переходы.
- [ ] `Board` не оставляет пустых ячеек после `refill`.
- [ ] `scoreForGroup` для `cross` ≥ score для `row` той же длины.
- [ ] `seed` даёт воспроизводимую генерацию.
