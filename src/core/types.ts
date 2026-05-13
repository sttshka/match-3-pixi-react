// Общие доменные типы. Сосредоточены в одном месте для удобства поиска.

export type TileType = number;

export interface TilePosition {
  col: number;
  row: number;
}

export interface TileModel {
  id: number;
  type: TileType;
  col: number;
  row: number;
  /** Слои препятствия (коробка): радужный+радужный снимает один слой. */
  obstacleLayers?: number;
  /** Цель уровня — приоритетная цель для самолётика. */
  isGoal?: boolean;
}

export type SceneId = 'boot' | 'menu' | 'game' | 'gameOver';

export interface MatchGroup {
  // Список позиций тайлов, образующих совпадение.
  tiles: TilePosition[];
  // Длина (количество тайлов в группе). Для крестов считается общее число.
  length: number;
  // Ориентация линии, 'cross' (пересечение линий), 'square' (квадрат 2×2),
  kind: 'row' | 'col' | 'cross' | 'square';
}

export interface ResolveResult {
  // Группы совпадений на текущей фазе.
  groups: MatchGroup[];
  // Сколько очков добавили на этой фазе.
  scoreGained: number;
  // Удалённые позиции.
  removed: TilePosition[];
  /** Тайлы, превращённые в бустеры на этом шаге (по id — позиция могла измениться после гравитации). */
  upgradedToBooster?: Array<{ id: number; type: number }>;
  /**
   * Мердж в бустер: клетки `absorb` (до гравитации) визуально втягиваются в `pivot`;
   * `survivorId` — тайл на pivot до смены графики.
   */
  boosterMerges?: Array<{
    survivorId: number;
    pivot: TilePosition;
    absorb: TilePosition[];
  }>;
}

export interface CascadeStep {
  resolved: ResolveResult;
  // Перемещения после коллапса: (id тайла) → новая позиция.
  moves: Array<{ id: number; from: TilePosition; to: TilePosition }>;
  // Новые тайлы, появившиеся сверху.
  spawned: TileModel[];
}
