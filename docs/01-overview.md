# 01. Обзор проекта

## Что это

Учебно-демонстрационный проект match-3 игры, реализованный как
расширяемый шаблон. Внутри:

- Сетка `8×8` с шестью типами тайлов (цвет-кодированные кружки/плитки).
- Полный игровой цикл: **выбор → своп → проверка → откат/каскад → новые тайлы**.
- Подсчёт очков с разной шкалой за длину группы.
- Цель уровня (счёт за N ходов) → переход в WinModal/GameOverModal.
- Анимации свопа/поп/падения через GSAP.
- Физический мир Matter.js, тикающий вместе с Pixi (готов для эффектов
  разлёта осколков и физического режима).

## Что НЕ входит

- Реальные арт-ассеты. Тайлы рисуются `Graphics.roundRect().fill()` —
  это даёт мгновенный визуальный результат без подготовки атласа.
- Сервер, авторизация, мультиплеер.
- Полная локализация (UI на русском, но без i18n-инфраструктуры).
- Полноценная аудио-палитра.

## Структура каталогов

```
.
├─ docs/                # документация на русском
├─ public/              # статические файлы (robots.txt, llms.txt, favicon)
├─ src/
│  ├─ assets/           # AssetManager + манифест ассетов
│  ├─ audio/            # SoundManager поверх @pixi/sound
│  ├─ core/             # константы, типы, EventBus, extend()
│  ├─ game/
│  │  ├─ board/         # Board, matchFinder, cascade
│  │  ├─ state/         # gameMachine, zustand store
│  │  ├─ commands/      # CommandQueue (последовательные асинхронные действия)
│  │  └─ rules/         # scoring
│  ├─ hooks/            # React-хуки (useResize, useGameTick)
│  ├─ physics/          # PhysicsWorld поверх Matter.js
│  ├─ rendering/        # BoardController (императивный Pixi-слой)
│  ├─ scenes/           # BootScene, MenuScene, GameScene
│  ├─ ui/               # HUD, LoadingScreen, GameOverModal
│  ├─ utils/            # math, random, tween-обёртка
│  ├─ App.tsx           # корневой React-компонент
│  ├─ main.tsx          # точка входа + extend Pixi-компонентов
│  └─ index.css         # стили DOM-оверлеев
├─ index.html
├─ package.json
├─ TODO.md              # дорожная карта работ
└─ README.md
```

## Игровой цикл (упрощённо)

```
boot → грузим манифест ассетов → menu → game
                                           │
                                           ▼
              ┌──────────────────────────────────────────┐
              │  idle  ─tap tile─▶ input ─tap adj─▶ swap │
              │   ▲                                   │  │
              │   │           ┌───── invalid ◀────────┤  │
              │   │           ▼                          │
              │  cascade ◀── resolve ── valid? ─────────▶ idle │
              └──────────────────────────────────────────┘
                                  │
                                  ▼
                          (moves==0) → gameOver
                          (score>=target) → win
```

## Технологические опоры

- **Pixi v8** — низкоуровневый WebGL/WebGPU-рендер, новый Graphics API.
- **React 18** — UI-оверлей и оркестрация сцен.
- **@pixi/react v8** — декларативные Pixi-компоненты в JSX и общий ticker.
- **Matter.js** — 2D физический движок для эффектов и физических режимов.
- **TypeScript strict** — строгая типизация во всех слоях.
- **Vite 5** — быстрый dev-сервер и сборщик.
- **GSAP** — анимации (промисифицированы для использования в `CommandQueue`).
- **Zustand** + **mitt** — лёгкий стейт-менеджмент и event-bus.

Подробнее — см. [02. Технологический стек](./02-tech-stack.md).
