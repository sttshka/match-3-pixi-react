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
}

export type SceneId = 'boot' | 'menu' | 'game' | 'gameOver';

export interface MatchGroup {
  // Список позиций тайлов, образующих совпадение.
  tiles: TilePosition[];
  // Длина (количество тайлов в группе). Для крестов считается общее число.
  length: number;
  // Ориентация (если линия) либо 'cross' для пересечений.
  kind: 'row' | 'col' | 'cross';
}

export interface ResolveResult {
  // Группы совпадений на текущей фазе.
  groups: MatchGroup[];
  // Сколько очков добавили на этой фазе.
  scoreGained: number;
  // Удалённые позиции.
  removed: TilePosition[];
}

export interface CascadeStep {
  resolved: ResolveResult;
  // Перемещения после коллапса: (id тайла) → новая позиция.
  moves: Array<{ id: number; from: TilePosition; to: TilePosition }>;
  // Новые тайлы, появившиеся сверху.
  spawned: TileModel[];
}
