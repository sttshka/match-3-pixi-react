# 07. Физика — Matter.js

В классической match-3 физика не обязательна. Но она открывает целые
жанры “physics match-3” (например, Toon Blast / Toy Blast), а также
даёт “дешёвые” эффектные мелочи: разлёт осколков, дрожание уровня,
маятниковые препятствия.

## Базовые объекты

- **Engine** — “мозги” физики. Содержит `gravity`, `timing`, `pairs`.
- **World** — частный случай `Composite`. Содержит все тела/connstraint'ы.
- **Body** — физическое тело: круг, прямоугольник, многоугольник, polygon.
- **Composite** — группа тел и составных композитов.
- **Constraint** — пружина/верёвка между двумя точками.
- **Events** — `collisionStart`, `collisionEnd`, `beforeUpdate`, и т.д.

## Создание физического мира

```ts
import Matter from 'matter-js';

const engine = Matter.Engine.create({ gravity: { x: 0, y: 1 } });
Matter.Composite.add(engine.world, [
  Matter.Bodies.rectangle(400, 580, 800, 40, { isStatic: true }), // пол
  Matter.Bodies.circle(200, 100, 16, { restitution: 0.7 }),
]);
```

## Шаг физики и интеграция с Pixi Ticker

```ts
useGameTick(({ deltaMS }) => {
  // Matter ожидает миллисекунды. Огранивайте deltaMs, чтобы избежать
  // “tunneling” при просадках FPS.
  const dt = Math.min(deltaMS, 32);
  Matter.Engine.update(engine, dt);
});
```

Чтобы синхронизировать рендер, на каждом тике копируйте `body.position`
и `body.angle` в Pixi `view`. Для массовых частиц лучше
`ParticleContainer`.

## Координатные системы

Matter и Pixi используют одну систему **в чистом виде** (X вправо, Y вниз).
Главное — следите за единицами: один Matter-юнит = один пиксель,
и тогда конвертация не нужна.

## События коллизий

```ts
Matter.Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    const a = pair.bodyA;
    const b = pair.bodyB;
    bus.emit('physics:collision', { a, b });
  }
});
```

В match-3 событие коллизии можно использовать для:

- “Запуск каскада, только когда все осколки приземлились на дно”.
- “Активация бомбы, когда два бустера касаются друг друга”.

## Использование в шаблоне

В шаблоне создан `PhysicsWorld` (см. `src/physics/PhysicsWorld.ts`) с
готовым `step(deltaMs)`. По умолчанию он создаётся в `GameScene` и тикает,
но физических тел ещё нет — это слот под будущие эффекты.

Пример полного использования — частицы от взрыва тайла:

```ts
const positions: TilePosition[] = step.resolved.removed;
for (const p of positions) {
  for (let i = 0; i < 6; i++) {
    const body = createDebrisBody(px, py, 4, 8);
    physics.add(body);
    const view = createDebrisView(); // Graphics или Sprite
    debrisLayer.addChild(view);
    debris.push({ body, view, ttl: 1.2 });
  }
}

// в ticker:
for (const d of debris) {
  d.view.x = d.body.position.x;
  d.view.y = d.body.position.y;
  d.view.rotation = d.body.angle;
  d.ttl -= deltaMS / 1000;
  if (d.ttl <= 0) {
    physics.remove(d.body);
    d.view.destroy();
  }
}
```

## Производительность

- **Sleeping**: Matter сам “усыпляет” неактивные тела. Не выключайте
  `enableSleeping` без причины.
- **Subdivision**: при больших количествах тел может помочь
  `engine.timing.timeScale` или фиксированный шаг с подшагами.
- **Не плодите констрейнты**. Каждый кадр — это решение системы пружин.

## Когда физика **не** нужна в match-3

- Если падение тайлов — это просто `gsap.to(..., { y })`, физика излишня.
- Если эффект разрушения — это масштаб+альфа на спрайте, физика излишня.

Используйте Matter, когда геймплей требует **физически достоверного
поведения** (объект свободно падает, ударяется, отражается).

## Альтернативы

- **Planck.js** — порт Box2D на JS, более точный, но сложнее API.
- **Rapier.js** — современный, на WASM, очень быстрый, типобезопасный
  биндинг через `@dimforge/rapier2d-compat`.

Для шаблона Matter.js — лучший компромисс “простой API + достаточно для
эффектов”.
