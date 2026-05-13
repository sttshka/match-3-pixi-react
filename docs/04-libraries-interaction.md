# 04. Взаимодействие библиотек

Здесь описано, **как** именно Pixi, React, @pixi/react, Matter.js, GSAP,
@pixi/sound и Zustand живут вместе.

## Общая картина

```
                     ┌────────────────┐
                     │  React 18      │  HUD, меню, модалки
                     └──────┬─────────┘
                            │ JSX
                            ▼
                     ┌────────────────┐
                     │ @pixi/react v8 │  <Application>, useTick,
                     │                │  pixiContainer, pixiGraphics
                     └──────┬─────────┘
                            │ управляет жизненным циклом
                            ▼
                     ┌────────────────┐
                     │  Pixi.js v8    │  Renderer, Ticker, Container, Graphics,
                     │                │  Assets, ParticleContainer, Spritesheet
                     └──────┬─────────┘
                            │ ticker.add
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
      ┌───────────┐   ┌─────────────┐   ┌──────────┐
      │ Matter.js │   │   GSAP      │   │ @pixi/   │
      │ Engine    │   │ tweens      │   │ sound    │
      │ World     │   │ Promise-обёртка│  │ play/mute│
      └───────────┘   └─────────────┘   └──────────┘
```

## Жизненный цикл Pixi-приложения через @pixi/react

`@pixi/react` v8 даёт компонент `<Application>`, который:

1. Создаёт `new Pixi.Application()` и вызывает `await app.init({...})`.
2. Создаёт `<canvas>` и подключает его к DOM.
3. Поднимает общий `Ticker` и связывает с React-хуком `useTick`.
4. На размонтирование вызывает `app.destroy()`.

```tsx
<Application
  width={width}
  height={height}
  antialias
  autoDensity
  resolution={Math.min(window.devicePixelRatio || 1, 2)}
  background={'#070b1a'}
>
  {scene === 'game' && <GameScene width={width} height={height} />}
</Application>
```

Внутри `<Application>` доступны:

- `useApplication()` — получить экземпляр `Application`.
- `useTick(callback)` — подписаться на общий ticker.
- `extend({ Container, Graphics, Sprite, Text, ParticleContainer })` —
  включить эти Pixi-классы в JSX как `pixiContainer`, `pixiGraphics` и т.д.
  ВАЖНО: вызывать `extend()` нужно один раз на верхнем уровне модуля,
  до первого рендера (мы делаем это в `src/core/pixiExtend.ts`).

## Когда декларативный @pixi/react, а когда императивный Pixi

| Сценарий                                     | Подход                     | Почему                                                           |
| -------------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| Простые/статичные сцены, кнопки на канвасе   | Декларативно               | Меньше кода, наглядно.                                           |
| Сложная игровая сцена с массовыми анимациями | Императивно через `ref`    | Реконсиляция React не вмешивается, проще оркестрировать tween'ы. |
| Большие списки спрайтов (частицы)            | `ParticleContainer` в коде | React-композиция тут только мешает.                              |
| HUD, меню, модалки                           | Только React DOM           | Их легко стилизовать CSS и подключать к стейту.                  |

В нашем проекте `GameScene` — гибрид: монтирует один `<pixiContainer ref/>`,
а `BoardController` ведёт всю императивную работу с детьми контейнера.

## Pixi ↔ Matter.js

Matter.js работает в собственной системе координат и не имеет понятия
о Pixi. Связка строится **через общий ticker**:

```ts
useGameTick(({ deltaMS }) => {
  physics.step(deltaMS); // Engine.update(engine, deltaMS)
});
```

Чтобы отрисовать тело Matter в Pixi, на каждом тике читаем `body.position`
и `body.angle` и копируем в `view.position`, `view.rotation`. Если объектов
много — используем `ParticleContainer`.

## Pixi ↔ GSAP

GSAP работает в собственном `requestAnimationFrame` и не привязан к Pixi.
Это плюс: GSAP сам тушит при `visibilitychange`. Минус: пауза Pixi `Ticker`
не останавливает GSAP. Если нужно — приходится явно делать `gsap.globalTimeline.pause()`.

Анимации над Pixi-объектами идут напрямую:

```ts
gsap.to(sprite, { x: 100, y: 200, duration: 0.3, ease: 'power2.out' });
gsap.to(sprite.scale, { x: 1.2, y: 1.2, duration: 0.18 });
```

В шаблоне используется обёртка `tweenTo()` — она возвращает `Promise`,
что позволяет последовательно гонять tween'ы внутри `CommandQueue`.

## Pixi ↔ @pixi/sound

@pixi/sound регистрирует свой `Loader` в Pixi `Assets`, что позволяет
указывать звуки в манифесте бандла:

```ts
{
  alias: 'sfx-match',
  src: '/sfx/match.mp3',
}
```

После `Assets.loadBundle('sfx')` звук уже доступен через `sound.play('sfx-match')`.
В `SoundManager` мы оборачиваем это и добавляем mute/volume.

## React ↔ Zustand ↔ EventBus

- **Zustand** — для UI-стейта: сцена, счёт, ходы.
  Используется в React-компонентах через хуки `useAppStore(s => s.score)`.
- **EventBus (mitt)** — для всего, что не нужно хранить, а нужно “прокинуть”:
  событие “матч найден”, “тайл взорван”, “игра окончена”.
- Игровая логика обновляет Zustand через `useAppStore.getState().addScore(...)`
  — это безопасно вне React-дерева.

## Поток данных при типичном свопе

1. `BoardController.onPointerDown` определяет тайлы a и b.
2. Пушит в `CommandQueue` асинхронный flow.
3. `Board.swap(a, b)` — модель обновлена.
4. `tweenAll([sa, sb], …)` — анимация позиций.
5. `findMatches(board)` — поиск.
   - Нет матчей → откат `Board.swap` + анимация назад → `idle`.
   - Есть матчи → `useAppStore.getState().decrementMove()`.
6. `resolveCascades()` в цикле:
   - `nextCascadeStep(board)` — модель обновлена (удалили + collapse + refill).
   - `useAppStore.getState().addScore(step.resolved.scoreGained)`.
   - `bus.emit('matches:found', ...)` — звук, частицы, аналитика.
   - `animatePops(...)`, `animateMoves(...)`, `animateSpawned(...)`.
7. Если `score >= target` → `scene='win'`, если `moves==0` → `scene='gameOver'`.
8. React автоматически перерисовывает UI-оверлей.

## Конфликты и тонкости

- **StrictMode**: React 18 в `<React.StrictMode>` маунтит компонент дважды
  в dev-режиме. Контроллеры должны корректно срабатывать через cleanup-функцию
  (`useEffect(() => { … return () => destroy() })`).
- **autoDensity**: при `autoDensity` Pixi сам управляет CSS-размером канваса.
  Не задавайте canvas-стиль вручную.
- **Resize**: размеры передаются в `<Application width=… height=… />`.
  При смене размеров `@pixi/react` корректно вызывает `renderer.resize`.
- **HMR**: при изменении модулей Vite перезапустит компоненты — наш
  `useEffect` в `GameScene` пересоздаст `BoardController`. Это нормально.
- **WebGPU/WebGL**: Pixi сам выбирает рендер. Принудительно — через
  `preference: 'webgl' | 'webgpu'` в опциях `Application`.
