# 11. Аудио

## Стек

- **@pixi/sound** — официальная аудио-библиотека Pixi.
- Регистрируется в `Assets`-loader-е, что позволяет указывать звуки
  в манифесте бандла.

## Когда подключать звук

В match-3 ритм геймплея во многом задаётся звуком: каждое успешное
совпадение → короткий “плеск”, длинный каскад → нарастающая мелодия.
Без звука игра кажется мёртвой.

## Подключение

```ts
import { sound } from '@pixi/sound';

sound.add('sfx-swap', '/sfx/swap.mp3');
sound.add('sfx-match', { url: '/sfx/match.mp3', preload: true });
sound.play('sfx-match', { volume: 0.6 });
```

В шаблоне обёртка — `SoundManager`:

```ts
soundManager.register('sfx-match', '/sfx/match.mp3');
soundManager.play('sfx-match');
soundManager.setVolume(0.5);
soundManager.setMuted(true);
```

## Связка с EventBus

Звук подписывается на игровые события, а не вызывается напрямую из
логики:

```ts
bus.on('matches:found', (info) => {
  soundManager.play('sfx-match', { volume: 0.6 });
});
bus.on('swap:invalid', () => soundManager.play('sfx-error'));
bus.on('game:over', ({ reason }) => {
  if (reason === 'win') soundManager.play('sfx-win');
  else soundManager.play('sfx-lose');
});
```

## Браузерные ограничения

- Автоплей **запрещён** до взаимодействия пользователя. Первое касание
  меню (нажатие “Начать игру”) — лучший момент инициализировать звук.
- На iOS Safari `<audio>` контексты должны быть разбужены жестом.
  `@pixi/sound` решает это, но первый `sound.play` должен идти в
  цепочке обработчика клика.

## Динамическая громкость

Хорошо звучит, когда фоновая музыка чуть глушится во время каскада:

```ts
bus.on('cascade:step', () => {
  gsap.to(sound.context, { volume: 0.4, duration: 0.2 });
});
bus.on('cascade:end', () => {
  gsap.to(sound.context, { volume: 1.0, duration: 0.5 });
});
```

(Нужно завести событие `cascade:end` в `BoardController` после окончания
цикла.)

## Сжатие

- MP3 / OGG — широкая поддержка, ~10-20 KB на короткий sfx.
- AAC — хуже всех поддерживается в Chrome, но идеален для iOS.
- Лучше иметь по два формата на ассет и указывать оба:

```ts
sound.add('sfx-match', { url: ['/sfx/match.ogg', '/sfx/match.mp3'] });
```

## Альтернатива: Howler.js

Howler — более популярная библиотека, но не интегрирована с Pixi `Assets`.
Если выбираете её, бандлите звуки отдельно от Pixi-ассетов.

## Тонкая работа: микширование

- Делайте 2-3 версии звука матча и проигрывайте случайную — это уменьшает
  ощущение монотонности.
- Меняйте `playbackRate` на ±5% — “живая” вариация без затрат на ассеты:

```ts
sound.play('sfx-match', { speed: 1 + (Math.random() - 0.5) * 0.1 });
```

## Чек-лист

- [ ] Все звуки заведены через `register`/`Assets`.
- [ ] Mute/Volume сохраняются между сессиями (`localStorage`).
- [ ] Первый `play` идёт после жеста пользователя.
- [ ] Подписки на события заведены в одном месте (Audio-layer).
