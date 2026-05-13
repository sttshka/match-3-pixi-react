# 17. Архитектура системы бустеров (спецификация)

> Документ описывает **целевую** модель бустеров: создание, замена тайла,
> цепочки активаций, комбо и детерминизм. Часть уже отражена в коде
> (`boosterFromMatch`, `boosterActivation`, `CommandQueue`); расхождения
> с текущей реализацией отмечены в конце.

## 1. Термины

| Термин (EN) | Смысл |
|-------------|--------|
| **Rocket** | Стрела: чистит целую строку **или** целый столбец при активации. |
| **Bomb** | Бомба: взрыв по области (радиус / крест / квадрат — по правилу комбо). |
| **Plane** | Ракета / самолётик: «летит» к целям, снимает клетки по правилу. |
| **Disco** | Радужный шар: работа с цветом и массовые превращения. |
| **Match resolution** | Один «тик» после свопа или после каскада: какие паттерны найдены, что спавнится. |
| **Activation** | Применение эффекта уже существующего бустера на доске. |

## 2. Правила создания (Booster Creation Rules)

### 2.1. Rocket (стрела)

**Условие:** найден матч **ровно из 4** тайлов в **одной линии** (горизонталь или вертикаль).

**Тип стрелы (важно):**

- Горизонтальная линия из 4 → спавнить **вертикальную** стрелу (очищает столбец).
- Вертикальная линия из 4 → спавнить **горизонтальную** стрелу (очищает строку).

Так игрок визуально связывает направление «полосы» на тайле с ортогональным эффектом.

### 2.2. Bomb (бомба)

**Условие (любое из):**

- паттерн **T** (пять клеток, ортогонально связанных, степень центра/узла по правилу T);
- паттерн **L** (угол + «ножка»);
- **компактный кластер** размера **≥ 5** одного цвета (4-связность или 8-связность — зафиксировать в одном месте константой).

Пересечение двух линий (классический «крест») может входить в класс T/+ / кластер — детекторы не должны двойного счёта одной клетки в двух бомбах за один шаг.

### 2.3. Plane (ракета)

**Условие:** квадрат **2×2** из четырёх тайлов **одного** обычного цвета.

### 2.4. Disco Ball (радужный)

**Условие:** линейный матч длины **≥ 5** (одна ось).

---

## 3. Приоритет паттернов (Match Priority)

Если один ход (или один шаг каскада) порождает **несколько** спец-паттернов, обработка **строго по приоритету** (сначала самый высокий):

1. **Disco** (линия ≥ 5)  
2. **Bomb** (T / L / кластер ≥ 5)  
3. **Plane** (2×2)  
4. **Rocket** (линия ровно 4)

Внутри одного уровня приоритета при нескольких кандидатах порядок фиксируется: например **сканирование слева-сверху**, первый найденный паттерн «забирает» клетки по правилам replacement; остальные паттерны пересчитываются на **урезанном** множестве клеток (без уже назначенных под disco/bomb/plane/rocket).

**Детерминизм:** при одинаковом состоянии доски результат всегда одинаковый → один и тот же порядок сортировки кандидатов и одна и та же функция выбора `spawn tile`.

---

## 4. Позиция спавна бустера (Booster Spawn Position)

- Использовать тайл, который является **целью хода** (`move target`) — тот, **на который указал своп** (второй выбранный тайл в UI), после применения свопа в модели.
- Если каскадный шаг **без** пользовательского move target (только гравитация): использовать **детерминированное** правило запаса, например:
  - центр паттерна по индексу в отсортированном списке клеток паттерна, или
  - «якорь» паттерна (угол L, центр T) — **одна таблица на тип бустера**, задокументированная в коде.

**Replacement logic:**

1. Все клетки матча, **кроме** spawn position, помечаются на удаление.  
2. Клетка spawn **не** удаляется пустой: её `type` (и при необходимости флаги) заменяются на сущность бустера.  
3. Остальные операции: `remove` → `collapse` → `refill` как сейчас, но список `remove` **не** содержит spawn-клетку.

---

## 5. Взаимодействие: бустер в зоне взрыва (Booster in Explosion)

Если при удалении / взрыве бустер **попадает** в область эффекта:

1. Он **не** просто удаляется как обычный тайл: ставится в очередь **активаций** (`ActivationQueue`).
2. Активация **не** рекурсивным вызовом «сразу всё дерево» — только **постановка** в очередь с приоритетом и фиксированным порядком обхода.
3. Обработчик одного шага очереди:
   - снимает с доски зону эффекта **или** помечает бустеры для следующей волны;
   - добавляет в очередь новые **вторичные** активации (другие бустеры в новой зоне).

Так достигаются длинные chain reactions и combo cascades **без** стека бесконечной глубины.

---

## 6. Комбо: своп booster + booster

Если игрок меняет местами **два бустера** на соседних клетках:

- **Обычный** match-3 по цветам на этом шаге **не** выполняется (отдельный флаг `resolutionMode = 'combo'`).
- Запускается **combo resolver** — один проход, который возвращает:
  - множество клеток к удалению / преобразованию;
  - список **отложенных активаций** (например, все ракеты после disco+rocket).

### 6.1. Таблица комбо (эффекты)

| Пара | Эффект |
|------|--------|
| **rocket + rocket** | Полная **строка** + полный **столбец** (крест максимальной длины через пересечение или через позиции двух тайлов — зафиксировать геометрию одной функцией). |
| **rocket + bomb** | Большой **крест**: несколько строк и столбцов (например, строка/столбец ракеты + расширенный ортогональный удар бомбы; константы ширины в `COMBO_ROCKET_BOMB`). |
| **rocket + plane** | Ракеты с **взрывами ракеты** по целям (см. §7): каждая цель + крест ракеты вокруг неё + зона от rocket. |
| **bomb + bomb** | **Огромный** радиус (например Chebyshev r=3 вокруг каждого центра, объединение). |
| **bomb + plane** | Ракеты с **взрывами бомбы** у целей (квадрат 3×3 или r вокруг каждой выбранной клетки). |
| **plane + plane** | Несколько ракет с **разными** целевыми клетками (детерминированный список целей). |
| **disco + normal** | Удалить все тайлы **выбранного** цвета (цвет обычного соседа после свопа). |
| **disco + rocket** | Все тайлы выбранного цвета → **rocket** (тип по правилу §2.1 от ориентации «виртуальной линии» или фиксированно vertical/horizontal); затем **последовательная** активация каждой ракеты через очередь. |
| **disco + bomb** | То же: превратить все клетки цвета в **bomb**, затем активировать каждую через очередь. |
| **disco + plane** | Превратить все клетки цвета в **plane**, затем активировать через очередь. |
| **disco + disco** | Почти вся доска: например все обычные тайлы **кроме** одной полосы/рамки или два прохода disco-подобного очиста — зафиксировать в `COMBO_DISCO_DISCO`. |

Все «activate all X» = **enqueue** N задач типа `ActivateBooster { id, kind, position }`, не рекурсивный DFS в одном кадре.

---

## 7. Plane: выбор целей (deterministic)

Функция `pickPlaneTargets(board, context): TilePosition[]`.

**Приоритет (первый подходящий уровень):**

1. **Mission targets** — клетки, отмеченные целью уровня (когда появится слой целей).  
2. **Blockers** — препятствия, которые нужно ломать в первую очередь.  
3. **Hard-to-reach** — эвристика: например нижние ряды, углы, клетки с малым числом соседей того же цвета (зашитый скоринг).  
4. **Random valid fallback** — не случайный `Math.random`, а **индекс** от хеша состояния:  
   `index = hash(board.snapshot, planeId, stepIndex) % candidates.length`.

Кандидаты — только клетки с **снимаемым** содержимым (обычный тайл / блокер / другой бустер по правилам).

---

## 8. Архитектура модулей (production-ready layout)

```
src/game/boosters/
  types.ts              // BoosterKind, ActivationJob, ComboPair, MatchPatternKind
  creation/
    detectPatterns.ts   // findLine4, findLine5Plus, findSquare2x2, findT, findL, findCluster5
    priority.ts         // sortPatternCandidates(board) -> ordered list
    spawnFromMatch.ts   // applySpawn(moveTarget, pattern) -> { remove[], upgrade[] }
  activation/
    ActivationQueue.ts  // FIFO + priority tier (optional secondary queue)
    resolveOneJob.ts    // one job -> { cellsToClear, childJobs[] }
    rocketEffect.ts
    bombEffect.ts
    planeEffect.ts
    discoEffect.ts
  combo/
    comboResolver.ts    // swap two specials -> Plan { clears, transforms, enqueue[] }
    comboTable.ts       // (kindA, kindB) -> handler
  pipeline/
    runMatchStep.ts     // after swap or cascade: creation OR combo OR normal match
    runActivationWave.ts// drain queue until empty or safety cap
```

**Зависимости:** домен не импортирует Pixi/React. `BoardController` только:
- переводит ввод в команды;
- вызывает `runMatchStep` / `runActivationWave`;
- мапит `cellsToClear` в анимации и снова в очередь UI (у вас уже есть `CommandQueue`).

---

## 9. Детерминированная очередь активаций (Activation Queue)

### 9.1. Структура задачи

```text
ActivationJob {
  kind: 'rocket' | 'bomb' | 'plane' | 'disco' | 'combo-followup'
  sourceTileId: number
  position: TilePosition
  payload?: ComboPayload | TransformPayload  // для disco chains
  sequence: number   // монотонно растёт глобально на шаг — порядок сортировки
}
```

### 9.2. Инварианты

- Задачи сортируются по `(sequence)`; при равенстве — по `(row, col, kind)`.
- За один «волновой» проход обрабатывается **лимит** N задач или до пустой очереди (константа `MAX_ACTIVATIONS_PER_FRAME` для отладки).
- Любое новое обнаружение бустера в зоне взрыва → **enqueue**, не немедленный рекурсивный вызов.

### 9.3. Псевдокод очереди

```pseudo
queue = PriorityQueue<ActivationJob>()

function onExplosion(cells: Set<CellKey>):
  for each cell in cells:
    t = board.get(cell)
    if t is booster:
      queue.push(ActivationJob.fromTile(t, nextSequence()))

function drainActivations(board, queue, safety = 10_000):
  while not queue.empty and safety-- > 0:
    job = queue.pop()
    result = resolveOneJob(board, job)
    board.applyRemovals(result.removed)        // не трогать spawn до collapse rules
    for child in result.childJobs:
      queue.push(child)
    for cell in result.cellsTriggeredExplosion:
      onExplosion({cell})                       // только enqueue, не re-enter drain
  if safety == 0: log error "activation cap"
```

---

## 10. Пайплайн после свопа (Booster Interaction Pipeline)

```pseudo
function onPlayerSwap(a, b, moveTarget):
  board.swap(a, b)

  if isAdjacentBoosterPair(board, a, b):
    plan = comboResolver.resolve(board, a, b, moveTarget)
    applyPlanTransforms(plan)                  // disco: recolor tiles
    enqueue(plan.initialActivations)
    drainActivations(board, queue)
    collapseAndRefill(board)
    return

  patterns = detectAllPatterns(board)
  if patterns.nonEmpty():
    ordered = sortByPriority(patterns)         // disco > bomb > plane > rocket
    spawnPlan = spawnFromMatch(ordered, moveTarget)
    applySpawnAndRemovals(spawnPlan)
    // если какие-то removals цепляют бустеры — они попадут в onExplosion при apply
    drainActivations(board, queue)
    collapseAndRefill(board)
    return

  board.swap(a, b)  // rollback
```

---

## 11. Combo resolver (псевдокод)

```pseudo
function comboResolver.resolve(board, posA, posB, moveTarget):
  ka = boosterKind(board, posA)
  kb = boosterKind(board, posB)
  key = normalizePair(ka, kb)  // порядок не важен для симметричных пар

  switch key:
    ROCKET_ROCKET:
      return crossRowColumn(board, posA, posB)
    ROCKET_BOMB:
      return largeCrossExplosion(board, posA, posB)
    ROCKET_PLANE:
      return planesWithRocketBlast(board, posA, posB)
    BOMB_BOMB:
      return massiveRadius(board, posA, posB)
    BOMB_PLANE:
      return planesWithBombBlast(board, posA, posB)
    PLANE_PLANE:
      return multiPlaneTargets(board, posA, posB)
    DISCO_NORMAL:
      return clearColorOfNormalNeighbor(board, posA, posB)
    DISCO_ROCKET:
      return transformColorToKindThenEnqueue(board, posA, posB, ROCKET)
    ...
    DISCO_DISCO:
      return clearNearlyEntireBoard(board)
```

`return` всегда структура `ComboPlan { clears, transforms[], jobs[] }`.

---

## 12. Граничные случаи (Edge Cases)

| Ситуация | Поведение |
|----------|-----------|
| Паттерн disco и bomb на одних клетках | Побеждает **disco** по приоритету; клетки bomb-паттерна не получают второй бустер. |
| Spawn position уже помечена удалением другим паттерном | Переназначить spawn на **следующий** детерминированный кандидат из того же паттерна (отсортированный список без занятых). |
| Очередь активаций раздувается (disco+disco → много джобов) | Лимит `MAX_ACTIVATIONS_PER_FRAME` + лог; игра не зависает. |
| Plane без валидных целей | Fallback: нижний ряд, слева направо первая непустая клетка. |
| Disco + normal, но normal «не того» типа | Цвет берётся строго с указанного соседа после свопа; если null — откат комбо как невалидный ход. |
| Бустер активируется дважды из двух пересекающихся взрывов | Дедуп по `tileId` в множестве «уже в очереди на этот wave-id». |
| Каскад после свопа создаёт новый матч | Один шаг каскада = снова `detectAllPatterns` → приоритеты → spawn; moveTarget отсутствует — правило запаса из §4. |

---

## 13. Связь с текущим кодом (кратко)

| Тема | В репозитории сейчас | Цель по этому документу |
|------|----------------------|-------------------------|
| Rocket ориентация | Линия 4 → `LINE_ROW` / `LINE_COL` по направлению линии | Линия 4 → **ортогональная** стрела к линии |
| Bomb | В основном `cross` из `findMatches` | T, L, кластер ≥5 |
| Приоритет | disco > cross > line4 > square | disco > bomb > plane > **rocket** (то же, уточнить имена) |
| Бустер во взрыве | Не отдельная очередь активаций домена | `ActivationQueue` + drain |
| Disco + rocket / bomb / plane | Упрощение (частый цвет + один эффект) | Превращение всех клеток цвета + **последовательная** активация всех |
| Plane targets | Хеш от id + список нормалей | Приоритет mission / blockers / эвристика + детерминированный fallback |

Дальнейшие шаги реализации: вынести детекторы в `boosters/creation/`, ввести `ActivationQueue` в домене (или расширить `CommandQueue` контрактом «одна джоба = одна активация»), затем подключить `BoardController` только как вью-слой.
