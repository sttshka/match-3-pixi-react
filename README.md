# Match-3 на Pixi v8 + React

Шаблон проекта для match-3 игры: **Pixi.js v8 + React 18 + @pixi/react v8 + Matter.js**.
Внутри — рабочая доска 8×8, свопы, поиск совпадений, каскады с анимациями,
HUD, экраны меню/победы/поражения и подробная документация на русском.

> Цель шаблона — служить отправной точкой для разработки match-3 игры и
> базой для технических консультаций по архитектуре, анимациям и
> производительности.

## Быстрый старт

```bash
npm install
npm run dev      # запустить dev-сервер (http://localhost:5173)
npm run build    # продакшен сборка
npm run preview  # локальный preview сборки
npm run lint     # ESLint
npm run typecheck
npm run format   # Prettier
```

Требуется Node.js `>=18.18`.

## Документация

Вся документация на русском — в каталоге [`docs/`](./docs).

- [Обзор проекта](./docs/01-overview.md)
- [Технологический стек](./docs/02-tech-stack.md)
- [Архитектура](./docs/03-architecture.md)
- [Взаимодействие библиотек](./docs/04-libraries-interaction.md)
- [Best practices Pixi v8](./docs/05-pixi-best-practices.md)
- [Интеграция React + Pixi](./docs/06-react-pixi-integration.md)
- [Физика Matter.js](./docs/07-physics-matter.md)
- [Механики match-3](./docs/08-match3-mechanics.md)
- [Анимации](./docs/09-animations.md)
- [Ассеты и текстуры](./docs/10-assets-and-textures.md)
- [Аудио](./docs/11-audio.md)
- [Производительность](./docs/12-performance.md)
- [Тестирование](./docs/13-testing.md)
- [Соглашения по коду](./docs/14-conventions.md)
- [Troubleshooting](./docs/15-troubleshooting.md)
- [Roadmap](./docs/16-roadmap.md)

Дорожная карта задач — [`TODO.md`](./TODO.md).

## Стек

| Слой | Технология |
| --- | --- |
| Рендер | [pixi.js](https://pixijs.com) ^8 |
| UI | [react](https://react.dev) ^18 |
| React ↔ Pixi | [@pixi/react](https://react.pixijs.io) ^8 |
| Физика | [matter-js](https://brm.io/matter-js/) |
| Анимации | [GSAP](https://gsap.com) |
| Аудио | [@pixi/sound](https://pixijs.io/sound/) |
| Стейт | [zustand](https://github.com/pmndrs/zustand) |
| EventBus | [mitt](https://github.com/developit/mitt) |
| Тулинг | TypeScript 5 · Vite 5 · ESLint · Prettier |

## Структура

```
docs/        — документация на русском
public/      — статика (robots.txt, llms.txt, favicon)
src/
  assets/    — AssetManager поверх Pixi Assets API
  audio/     — SoundManager поверх @pixi/sound
  core/      — extend(), типы, EventBus, константы
  game/      — Board, matchFinder, cascade, gameMachine, store
  hooks/     — React-хуки (useResize, useGameTick)
  physics/   — обёртка над Matter.Engine
  rendering/ — BoardController (императивный Pixi-слой)
  scenes/    — BootScene, MenuScene, GameScene
  ui/        — HUD, LoadingScreen, GameOverModal
  utils/     — math, random, tween
  App.tsx    — корневой компонент
  main.tsx   — точка входа
```

## Лицензия

MIT.
# match-3-pixi-react
