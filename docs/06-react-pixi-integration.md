# 06. Интеграция React + Pixi через @pixi/react v8

`@pixi/react` v8 — это “декларативный фасад” над Pixi v8. Не самостоятельная
библиотека, а слой Reconciler-а, который понимает Pixi-объекты как
React-узлы.

## Минимальный пример

```tsx
import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';

extend({ Container, Graphics });

export function MyScene() {
  return (
    <Application width={800} height={600} background={'#000'}>
      <pixiContainer x={100} y={100}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, 100, 100).fill({ color: 0xff0000 });
          }}
        />
      </pixiContainer>
    </Application>
  );
}
```

Ключевые правила:

1. **`extend({...})` обязателен** — без него `<pixiContainer>` не будет
   зарегистрирован в JSX. Вызов делается один раз на верхнем уровне модуля.
2. Имена в JSX — `lowercase` с префиксом `pixi`: `pixiContainer`,
   `pixiGraphics`, `pixiSprite`, `pixiText`, `pixiParticleContainer`.
3. `draw` у `pixiGraphics` — это callback, который получает
   уже очищенный `Graphics`. Используйте его для рисования.

## Хуки

### `useApplication()`

Возвращает `{ app }`, где `app` — экземпляр `PIXI.Application`. Доступен
только внутри `<Application>`. Полезен для доступа к `app.stage`,
`app.renderer`, `app.canvas`.

### `useTick(callback)`

Подписывает callback на общий ticker `Application`. Принимает функцию
вида `(ticker: PIXI.Ticker) => void`. `ticker.deltaTime` нормализован
(`1.0` ≈ 16.7ms), `ticker.deltaMS` — миллисекунды.

```ts
useTick((ticker) => {
  sprite.rotation += 0.01 * ticker.deltaTime;
});
```

### `useExtend({...})`

Динамически добавляет компоненты в JSX-карту. Полезно для условной
подгрузки фильтров.

## Императивный escape hatch

В реальных играх не всё стоит описывать через React. Когда вам нужен
прямой контроль над спрайтами (создание, анимация, удаление) — используйте
`ref` на pixiContainer и работайте с ним как с обычным `PIXI.Container`:

```tsx
const ref = useRef<Container>(null);
useEffect(() => {
  if (!ref.current) return;
  const child = new Sprite(texture);
  ref.current.addChild(child);
  return () => child.destroy();
}, []);
return <pixiContainer ref={ref} />;
```

В нашем шаблоне `GameScene` использует именно этот паттерн, делегируя
всё `BoardController`-у.

## Когда что выбирать

| Что нужно | React + @pixi/react | Императивный Pixi |
| --- | --- | --- |
| Меню, статика, кнопки | + | − |
| Игровая сцена с анимациями | возможно | предпочтительно |
| HUD, оверлеи | DOM (React, без Pixi) | − |
| Массовые частицы | − | `ParticleContainer` |

## Подводные камни

### StrictMode

В dev-режиме React 18 монтирует и размонтирует компоненты дважды.
Все эффекты должны иметь корректный cleanup. Это особенно важно для
контроллеров с подписками на ввод и tween'ами.

### Перерисовка React

Любое обновление props компонента вызывает диффинг и потенциальный
пересоздаст детей. Старайтесь делать игровые компоненты тонкими
(один pixiContainer + ref), чтобы React не отбрасывал их.

### Передача функций как props

`draw`-функция, переданная в `pixiGraphics`, должна быть стабильной
(через `useCallback`), иначе будет вызываться каждый render.

### Управление текстурами

В декларативном стиле можно передать `texture` в `pixiSprite`. Будьте
осторожны: если меняете её на лету, Pixi обновит подложку, но **не**
освободит старую — следите за освобождением через `Assets.unload`
при смене сцены.

### Order of mount

`<Application>` асинхронно инициализируется. Дочерние эффекты
выполнятся после готовности приложения, поэтому `useApplication()` всегда
вернёт валидный `app` внутри детей.

## Производительность

- **Не строьте большие JSX-деревья**, если они меняются часто. React
  при каждом перерендере проходит по дереву, и это ощутимо при сотнях
  узлов.
- **Используйте `key` для стабильных списков** (тайлы, частицы). Без
  ключей реконсиляция будет неверно мапить компоненты.
- **Локализуйте обновления**: если меняется только счёт, не помещайте
  обращение к `useAppStore` в корневой компонент. Подписывайтесь
  селектором в `HUD`.

## Тестирование

- `vitest` + `@testing-library/react` для UI-логики.
- Для Pixi-канваса нужен `jest-canvas-mock` / `vitest-canvas-mock`, либо
  тестировать **только** доменную логику (что мы и предпочитаем).
- Визуальные тесты — Playwright (см. `13-testing.md`).
