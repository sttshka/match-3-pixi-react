# 02. Технологический стек

## Сводная таблица

| Слой              | Технология                                   | Версия        | Зачем                                                                                  |
| ----------------- | -------------------------------------------- | ------------- | -------------------------------------------------------------------------------------- |
| Рендер            | [Pixi.js](https://pixijs.com)                | `^8.6`        | WebGL/WebGPU-рендер, `Graphics`, `Sprite`, `ParticleContainer`, `Assets`.              |
| UI / реактивность | [React](https://react.dev)                   | `^18.3`       | Компоненты HUD, меню, модалок.                                                         |
| React ↔ Pixi      | [@pixi/react](https://react.pixijs.io)       | `^8.0`        | Декларативные Pixi-компоненты в JSX (`<pixiContainer/>`), `useTick`, `useApplication`. |
| Физика            | [Matter.js](https://brm.io/matter-js/)       | `^0.20`       | 2D физика: Engine, World, Bodies, Composite.                                           |
| Анимации          | [GSAP](https://gsap.com)                     | `^3.12`       | Tween-анимации позиций, масштаба, прозрачности; промисификация.                        |
| Аудио             | [@pixi/sound](https://pixijs.io/sound/)      | `^6.0`        | Загрузка и воспроизведение звуков с глобальной громкостью/мьютом.                      |
| Стейт             | [Zustand](https://github.com/pmndrs/zustand) | `^4.5`        | Лёгкий стор для UI-стейта (счёт, ходы, сцена).                                         |
| Событийная шина   | [mitt](https://github.com/developit/mitt)    | `^3.0`        | Слабая связность слоёв через `bus.emit/on`.                                            |
| Тулинг            | TypeScript / Vite / ESLint / Prettier        | TS 5 · Vite 5 | Строгая типизация и быстрая сборка.                                                    |

## Почему именно так

### Pixi v8 (а не v7)

- Полная переработка рендера: единый `Graphics` API (`g.rect(...).fill({...}).stroke({...})`),
  ускоренный `Spritesheet`, `ParticleContainer`, WebGPU-бэкенд.
- Поддержка ES-модулей, лучшее tree-shaking.
- Совместимость с `@pixi/react` v8.

### @pixi/react (а не голый Pixi)

- Привычная композиция UI и игровой сцены в JSX.
- Сцена живёт внутри `<Application/>`, который сам отрабатывает init/destroy,
  `autoDensity`, ресайз и общий `Ticker`.
- Хуки `useTick`, `useApplication`, `useExtend` упрощают код.
- Внутри одного React-компонента можно “выпрыгнуть” в императивный Pixi
  через `ref` — мы так и делаем для `BoardController`.

### Matter.js (а не Planck/Cannon)

- Прост для 2D-эффектов: круги, прямоугольники, события коллизий.
- Дружелюбен к новичкам в физике.
- Хорошо ложится на ticker Pixi: `Engine.update(engine, deltaMs)`.

### GSAP (а не Tween.js)

- Самый зрелый tweener для веба: ease-функции, цепочки, таймлайны.
- Можно тюнить FPS-чувствительные сценарии и интерполировать любые свойства,
  включая `scale.x/scale.y` на Pixi-объектах.

### Zustand + mitt (а не Redux)

- Match-3 — приложение, где **UI-стейта мало**, а игровой стейт лежит в
  доменной модели `Board`. Redux был бы избыточным.
- mitt используется для событий, на которые подписываются разные слои
  (звуки, UI, аналитика).

## Совместимость и матрица версий

- Node.js: `>=18.18` (Vite 5 требует).
- Браузеры: современные (Pixi v8 предполагает ES2022 + WebGL2/WebGPU).
  Для совместимости можно собрать в `target: es2017`, но это сократит
  возможности оптимизации.
- iOS Safari 15+: ок, WebGL2; для WebGPU нужен Safari 17.5+.
- Android Chrome 80+: ок.

## Что МОЖНО заменить без боли

- **GSAP → Tween.js / motion / своя реализация** — интерфейс `tweenTo()`
  изолирован в `src/utils/tween.ts`.
- **Zustand → React Context / Redux / Jotai** — обращения к стору сосредоточены
  в `src/game/state/store.ts`.
- **@pixi/sound → Howler.js** — обёртка `SoundManager` инкапсулирует API.
- **Matter.js → Planck.js (Box2D)** — `PhysicsWorld` спрятан под собственным
  фасадом.

## Что заменять НЕ стоит

- **Pixi v8** — переписывание под другой рендер потребует переработки всего
  слоя `rendering/`.
- **React + @pixi/react** — это базовый каркас приложения; смена потребует
  переписать UI и сцены.
