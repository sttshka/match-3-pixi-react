# TODO — Match-3 на Pixi v8 + React

> Этот файл — план работ по проекту-шаблону для match-3 игры на стеке
> **Pixi v8 + React + @pixijs/react + Matter.js**.
> Чекбоксы отмечены в порядке приоритета. Каждый пункт связан с разделом
> документации в `docs/`.

## Этап 0. Подготовка инфраструктуры (done)

- [x] Инициализировать репозиторий, выбрать стек и менеджер пакетов
- [x] Подготовить `package.json`, Vite, TypeScript strict, ESLint, Prettier
- [x] `public/robots.txt`, `public/llms.txt`
- [x] Базовая документация в `docs/` на русском
- [x] Корневой `README.md` + `TODO.md`

## Этап 1. Базовый каркас (in progress)

- [x] React 18 + Vite + TS
- [x] Pixi v8 через `@pixijs/react` (`<Application>`, `extend()`)
- [x] Менеджер сцен: `BootScene → MenuScene → GameScene`
- [x] Глобальный стейт UI (Zustand)
- [x] EventBus (`mitt`) для коммуникации слоёв
- [x] AssetManager поверх `Assets.load` (Pixi v8)
- [x] SoundManager (`@pixi/sound`) с поддержкой mute/volume
- [x] Resize / DPR / autoDensity helpers

## Этап 2. Игровая логика match-3

- [x] Модель доски `Board` (чистый TS, без Pixi)
- [x] Модель тайла `Tile`
- [x] Алгоритм поиска совпадений (`matchFinder`): горизонтали, вертикали, длины ≥ 3
- [x] Свопы с откатом, если не нашли совпадения
- [x] Каскад: удаление, гравитация, генерация новых тайлов, повтор
- [x] State Machine: `idle → input → swap → resolve → cascade → idle`
- [x] Очередь команд (`CommandQueue`) для последовательных анимаций
- [x] Подсчёт очков (`scoring.ts`)
- [ ] Бустеры: бомба (3×3), линейный, цветной
- [ ] Условия победы/поражения (цели уровня, ходы, время)
- [ ] Анти-deadlock: проверка наличия валидных ходов, авто-перемешивание

## Этап 3. Рендеринг и анимация

- [x] `BoardView` рисует grid и тайлы через `@pixijs/react`
- [x] `TileView` с интерактивностью (pointerdown/move/up)
- [x] Базовые tween-анимации свопа и падения (GSAP)
- [x] ParticleContainer для эффектов взрыва
- [ ] Shader-эффект подсветки совпадений
- [ ] Skeleton/Spine анимации для бустеров (опционально)

## Этап 4. Физика (Matter.js)

- [x] `PhysicsWorld` — обёртка Engine + World
- [x] Интеграция тика Matter.js с Pixi Ticker
- [x] Физические частицы при разрушении тайлов
- [ ] Падающие "обломки" с правильной формой коллайдеров
- [ ] Эксперимент: физический режим (физика тайлов вместо grid-гравитации)

## Этап 5. Производительность

- [x] Texture atlas (sprite sheet) для тайлов
- [x] `ParticleContainer` для массовых эффектов
- [x] `autoDensity` + DPR-aware рендер
- [ ] Профилирование на слабых устройствах (Lighthouse, devtools performance)
- [ ] Web Worker для тяжёлых вычислений (matchFinder на больших полях)
- [ ] Object pool для TileView/Particle

## Этап 6. Контент и UX

- [x] HUD: очки, ходы, цели уровня
- [x] LoadingScreen с прогрессом ассетов
- [x] GameOverModal / WinModal
- [ ] Звуковая палитра (swap, match, cascade, win, lose)
- [ ] Тач-управление и доступность с клавиатуры
- [ ] Локализация UI (ru/en)

## Этап 7. Тесты и качество

- [x] Подключён Playwright (`tests/e2e/`, `playwright.config.ts`)
- [x] Cursor-правило `.cursor/rules/playwright-tests.mdc` для агента
- [x] E2E: меню, переход в игру, HUD, отсутствие console errors, кликaeмость канваса
- [ ] Unit-тесты `matchFinder`, `cascade`, `gameMachine` (Vitest)
- [ ] Детерминированные seed-тесты конкретных совпадений
- [ ] Snapshot/Visual regression (Playwright `toHaveScreenshot`)
- [ ] CI: lint + типы + тесты + e2e
- [ ] Pre-commit (lint-staged + husky)

## Этап 8. Расширение

- [ ] Редактор уровней (JSON-схема, drag-n-drop в UI)
- [ ] Сохранение прогресса (localStorage / IndexedDB)
- [ ] Метаигра: карта уровней, прогрессия
- [ ] Аналитика и трекинг событий

---

## Открытые вопросы для консультаций

1. **Best practices Pixi v8.** Какой шаблон жизненного цикла `Application` выбрать
   при использовании `@pixijs/react`? Когда стоит делать React-overlay, а когда
   рисовать всё внутри Pixi?
2. **Архитектура.** ECS-light vs Scene/Manager + чистая доменная модель.
   Что выбрать для match-3?
3. **Анимации.** GSAP vs встроенный tweener vs spine. Как корректно связать
   tween-таймлайны с `CommandQueue` и state machine?
4. **API Pixi.** Использование `RenderTexture`, кастомные фильтры, `Mesh` —
   когда оправдано?
5. **Оптимизация.** Texture bleeding, mipmaps, `roundPixels`, `cullable`,
   когда стоит включать `eventMode: 'static'` vs `'dynamic'`.
6. **Ассеты.** TexturePacker vs Pixi v8 Spritesheet API, форматы (WebP, KTX2),
   стратегия preload/lazy.
7. **Звук.** `@pixi/sound` vs Howler — что лучше под web + мобильный браузер.
8. **Физика.** Имеет ли смысл Matter.js в классическом match-3 или он нужен
   только под физический режим / спецэффекты?
