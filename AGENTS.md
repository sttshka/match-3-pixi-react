# AGENTS.md

> Навигационный файл для AI-агентов (Cursor, Codex CLI, Claude Code, Aider и др.),
> работающих с этим репозиторием. Стандарт: [agents.md](https://agents.md).
>
> Цель файла — **экономить контекст**: не дублировать содержание `docs/`,
> а быстро сориентировать агента, куда смотреть.

## Краткое описание

Шаблон match-3 игры. Стек: **Pixi.js v8 + React 19 + @pixi/react v8 +
Matter.js + TypeScript strict + Vite 5**. E2E — Playwright.

Подробное описание: `docs/01-overview.md`.

## Где что лежит (карта проекта)

```
src/
  core/        константы, типы, EventBus, Pixi extend()
  game/
    board/     Board, matchFinder, cascade  ← чистая доменная логика
    state/     gameMachine (FSM), Zustand store
    commands/  CommandQueue (последовательные асинхронные действия)
    rules/     scoring
  rendering/   BoardController              ← императивный Pixi-слой
  physics/     обёртка над Matter.Engine
  scenes/      BootScene, MenuScene, GameScene
  ui/          HUD, LoadingScreen, GameOverModal  (DOM, не Pixi)
  hooks/       useResize, useGameTick
  assets/      AssetManager поверх Pixi Assets API
  audio/       SoundManager поверх @pixi/sound
  utils/       math, random (seeded RNG), tween (GSAP-обёртка)
  App.tsx, main.tsx, index.css

tests/
  unit/        Vitest, чистая логика (helpers.ts + *.test.ts)
  e2e/         Playwright + helpers/
docs/          вся документация (на русском)
.cursor/rules/ Cursor-правила (vitest-tests.mdc, playwright-tests.mdc)
public/        статика (robots.txt, llms.txt, favicon)
```

## Команды

```bash
npm run dev           # Vite dev-server (http://localhost:5173)
npm run build         # tsc -b && vite build
npm run preview       # preview prod-сборки
npm run lint          # ESLint
npm run typecheck     # tsc -b --pretty
npm run format        # Prettier

# Тесты
npm run test          # Vitest (unit) — быстрый
npm run test:watch    # Vitest в watch-режиме
npm run test:coverage # покрытие
npm run test:e2e      # Playwright (E2E)
npm run test:e2e:ui   # Playwright UI mode
npm run test:all      # оба прогона подряд
```

Перед первым запуском E2E: `npx playwright install chromium`.

## Соглашения (обязательно к чтению при изменениях)

- Код, identifier'ы — **на английском**.
- Документация и пользовательский UI — **на русском**.
- TypeScript **strict** включён везде; `any` запрещён в публичных API.
- React 19: **глобального `JSX.Element` больше нет**; возвращаемые типы
  компонентов лучше выводить, а не писать вручную.
- Доменная логика (`Board`, `matchFinder`, `cascade`, `gameMachine`) — **чистая**,
  без Pixi/React/DOM. Не нарушайте это.
- Анимации **не** через React-стейт, а через GSAP напрямую на Pixi-объектах
  (см. `src/utils/tween.ts` + `src/rendering/BoardController.ts`).
- Последовательные асинхронные действия — через `CommandQueue`, см.
  `src/game/commands/CommandQueue.ts`.
- События между слоями — через `bus` (mitt), см. `src/core/eventBus.ts`.

Полные правила: `docs/14-conventions.md`.

## Где искать ответ, прежде чем менять код

| Если задача про… | Смотри файл |
| --- | --- |
| Архитектуру, слои, поток данных | `docs/03-architecture.md` |
| Как Pixi/React/Matter живут вместе | `docs/04-libraries-interaction.md` |
| Pixi v8 API и лучшие практики | `docs/05-pixi-best-practices.md` |
| `@pixi/react` (extend, useTick, ref) | `docs/06-react-pixi-integration.md` |
| Matter.js | `docs/07-physics-matter.md` |
| Match-3 алгоритмы (поиск, каскад, своп) | `docs/08-match3-mechanics.md` |
| GSAP и анимации | `docs/09-animations.md` |
| Ассеты, текстуры, атласы | `docs/10-assets-and-textures.md` |
| Звук | `docs/11-audio.md` |
| Производительность, FPS, профайлинг | `docs/12-performance.md` |
| Тестирование (Vitest unit + Playwright E2E) | `docs/13-testing.md` + `.cursor/rules/vitest-tests.mdc` + `.cursor/rules/playwright-tests.mdc` |
| Типичные ошибки | `docs/15-troubleshooting.md` |
| Дорожная карта расширения | `docs/16-roadmap.md` + `TODO.md` |

## Чего делать НЕ нужно

- ❌ Не подменяйте `@pixi/react` на `@pixijs/react` — это разные пакеты,
  правильный — `@pixi/react` (для Pixi v8).
- ❌ Не возвращайтесь к React 18 — `@pixi/react@^8.0.5` требует React 19.
- ❌ Не создавайте `vite.config.js`/`vite.config.d.ts` вручную — это
  артефакты `tsc -b`, они в `.gitignore`.
- ❌ Не пишите unit-тесты в `tests/e2e/`. Чистая логика — это Vitest
  (`tests/unit/`), Playwright — для UI.
- ❌ Не добавляйте `.test.ts` в `src/` — Vitest их не подхватит,
  это противоречит соглашениям.
- ❌ Не вызывайте `extend()` внутри компонента — только в `src/core/pixiExtend.ts`
  на уровне модуля.
- ❌ Не используйте `page.waitForTimeout` в тестах как способ ждать UI;
  только `expect(...).toBeVisible()` с встроенным retry.
- ❌ Не коммитьте `node_modules`, `dist`, `.vite`, `.playwright-mcp`,
  `playwright-report`, `test-results`, `*.tsbuildinfo`.

## Style для коммитов

Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
Один логический change на коммит.

## Дополнительные навигационные файлы

- [`README.md`](README.md) — quickstart для людей
- [`TODO.md`](TODO.md) — дорожная карта работ
- [`public/llms.txt`](public/llms.txt) — карта проекта для **онлайн** LLM-краулеров
- [`public/robots.txt`](public/robots.txt) — правила для поисковиков и AI-краулеров
