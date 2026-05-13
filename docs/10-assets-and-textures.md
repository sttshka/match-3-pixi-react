# 10. Ассеты и текстуры

## Pixi v8 Assets API

`Assets` — единая точка для всего, что нужно загрузить: текстуры, JSON,
звуки, spine. Поддерживает алиасы и бандлы.

```ts
import { Assets } from 'pixi.js';

Assets.init({
  manifest: {
    bundles: [
      { name: 'preload', assets: [{ alias: 'logo', src: '/img/logo.webp' }] },
      {
        name: 'level-1',
        assets: [
          { alias: 'tiles', src: '/atlases/tiles.json' },
          { alias: 'bg', src: '/img/level-1.webp' },
        ],
      },
    ],
  },
});

await Assets.loadBundle('preload', (progress) => setLoadProgress(progress));
const logoTex = Assets.get('logo');
```

Бандлы — это **группы**, которые удобно стримить по прогрессу уровня.
Так избегается “долгая загрузка всего сразу”.

## SpriteSheet

В v8 формат spritesheet JSON совместим с TexturePacker. Структура:

```json
{
  "frames": {
    "tile_red.png": { "frame": { "x": 0, "y": 0, "w": 64, "h": 64 } },
    ...
  },
  "meta": {
    "image": "tiles.png",
    "size": { "w": 256, "h": 256 },
    "scale": 1
  },
  "animations": {
    "tile_red_pop": ["tile_red_1.png", "tile_red_2.png", "tile_red_3.png"]
  }
}
```

После `Assets.loadBundle('level-1')`:

```ts
const sheet = Assets.get('tiles');
const tex = sheet.textures['tile_red.png'];
const sprite = new Sprite(tex);
```

## Форматы

- **PNG** — универсально, но тяжело.
- **WebP** — на 30-50% легче PNG, поддерживается во всех современных
  браузерах.
- **AVIF** — ещё легче, но декодинг дороже на слабых CPU.
- **KTX2/Basis** — GPU-сжатые текстуры, маленький VRAM, требуют декодера
  и `compressedTextures` plugin'а Pixi.

В `manifest.assets` можно указывать несколько источников:

```ts
{ alias: 'logo', src: ['/img/logo.avif', '/img/logo.webp', '/img/logo.png'] }
```

Pixi выберет первый поддерживаемый.

## Mipmaps

Pixi автоматически генерирует mipmaps для power-of-two текстур. Если
тайл рендерится в очень разных масштабах (например, при анимации
пинч-зума), включайте `mipmap: 'on'`:

```ts
texture.source.style.mipmap = 'on';
```

Без mipmaps масштабированная текстура шумит.

## Padding и bleeding

При использовании spritesheet:

- Оставляйте 1-2 px между фреймами в атласе.
- Включайте `padding` в TexturePacker.
- Иначе соседние фреймы будут “протекать” при билинейной интерполяции.

## Lazy loading

Не грузите все уровни сразу. Стратегия:

```
boot:  /atlases/ui.json + /sfx/click.mp3
menu:  /atlases/menu.webp
level-1: /atlases/tiles-set-1.json + /sfx/swap.mp3 + ...
```

В переходе между сценами:

```ts
await Assets.loadBundle('level-1');
useAppStore.getState().setScene('game');
// Когда уходим из уровня:
await Assets.unloadBundle('level-1');
```

## Кеширование

`Assets.get(alias)` возвращает уже загруженный объект мгновенно.
Если ассет был unloaded — придётся загружать заново.

## Лимиты и память

- Браузерный лимит на одну текстуру: 4096×4096 (мобильные) — 16384×16384
  (десктоп). Делайте атласы не больше 2048×2048 для совместимости.
- VRAM ограничен. Следите за тем, чтобы общий объём текстур не превышал
  ~256 MB на мобильных. Pixi пишет в `console.warn` при неудаче.

## Спрайтовые анимации (frame-by-frame)

Используйте `AnimatedSprite`:

```ts
const frames = ['tile_red_1.png', 'tile_red_2.png', 'tile_red_3.png'].map((n) => sheet.textures[n]);
const anim = new AnimatedSprite(frames);
anim.animationSpeed = 0.2;
anim.loop = false;
anim.play();
anim.onComplete = () => {
  anim.destroy();
};
```

## Шрифты

- **BitmapFont** — лучший выбор для часто меняющегося текста (счёт).
- **WebFont** — для статичных надписей через `pixiText` (CSS-фонт).

```ts
import { BitmapFont } from 'pixi.js';
BitmapFont.install({
  name: 'game-num',
  style: { fontSize: 36, fill: 0xffffff, fontFamily: 'Inter' },
  chars: '0123456789+',
});
```

## Стратегия для match-3

1. Атлас тайлов: `tiles.webp` (например, 6 цветов × 4 кадра pop = 24 фрейма
   на ~2048×512).
2. Атлас UI: иконки, фоны панелей.
3. Атлас спецэффектов: частицы взрыва, искры.
4. Звуки: 6-8 коротких сэмплов, общим весом до 200 KB.

Загружать `preload` (UI + первый набор тайлов) и стримить уровни.

## Чек-лист

- [ ] Все ассеты заведены в `manifest.ts` с alias'ами.
- [ ] Большие текстуры собраны в атласы.
- [ ] Используются WebP-форматы (+PNG fallback).
- [ ] Между сценами вызывается `Assets.unloadBundle`.
- [ ] `Assets.get` нигде не вызывается до `Assets.load`.
