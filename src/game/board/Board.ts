import { BOARD_COLS, BOARD_ROWS, TILE_TYPES } from '@core/constants';
import type { TileModel, TilePosition } from '@core/types';
import { createRng, randInt } from '@utils/random';

// Чистая (без Pixi) модель доски. Знает только про сетку тайлов
// и предоставляет операции: get/set/swap/clear/collapse/refill.
// Не выполняет анимаций — это ответственность вью-слоя.
export class Board {
  readonly cols: number;
  readonly rows: number;

  private readonly cells: Array<TileModel | null>;
  private nextId = 1;
  private readonly rng: () => number;

  constructor(
    cols: number = BOARD_COLS,
    rows: number = BOARD_ROWS,
    seed: number = Date.now() & 0xffffffff,
  ) {
    this.cols = cols;
    this.rows = rows;
    this.cells = new Array(cols * rows).fill(null);
    this.rng = createRng(seed);
  }

  // Заполняем доску так, чтобы не было стартовых матчей.
  generateInitial(): void {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let type = randInt(this.rng, TILE_TYPES);
        // Исключаем 3 подряд по горизонтали и вертикали при генерации.
        const left1 = this.get(c - 1, r)?.type;
        const left2 = this.get(c - 2, r)?.type;
        const up1 = this.get(c, r - 1)?.type;
        const up2 = this.get(c, r - 2)?.type;
        let guard = 0;
        while (
          guard++ < 16 &&
          ((left1 === type && left2 === type) || (up1 === type && up2 === type))
        ) {
          type = randInt(this.rng, TILE_TYPES);
        }
        this.setCell(c, r, this.createTile(type, c, r));
      }
    }
  }

  get(col: number, row: number): TileModel | null {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null;
    return this.cells[row * this.cols + col] ?? null;
  }

  private setCell(col: number, row: number, tile: TileModel | null): void {
    this.cells[row * this.cols + col] = tile;
    if (tile) {
      tile.col = col;
      tile.row = row;
    }
  }

  swap(a: TilePosition, b: TilePosition): void {
    const ta = this.get(a.col, a.row);
    const tb = this.get(b.col, b.row);
    this.setCell(a.col, a.row, tb);
    this.setCell(b.col, b.row, ta);
  }

  // Возвращает все тайлы в виде плоского массива (включая null).
  snapshot(): ReadonlyArray<TileModel | null> {
    return this.cells;
  }

  // Удаляет тайлы по позициям (ставит null), возвращает удалённые.
  remove(positions: TilePosition[]): TileModel[] {
    const removed: TileModel[] = [];
    for (const p of positions) {
      const t = this.get(p.col, p.row);
      if (t) {
        removed.push(t);
        this.setCell(p.col, p.row, null);
      }
    }
    return removed;
  }

  // Применяем гравитацию: тайлы падают вниз, заполняя null.
  // Возвращает список перемещений {id, from, to}.
  collapse(): Array<{ id: number; from: TilePosition; to: TilePosition }> {
    const moves: Array<{ id: number; from: TilePosition; to: TilePosition }> = [];
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const t = this.get(c, r);
        if (t) {
          if (writeRow !== r) {
            const from: TilePosition = { col: c, row: r };
            const to: TilePosition = { col: c, row: writeRow };
            this.setCell(c, r, null);
            this.setCell(c, writeRow, t);
            moves.push({ id: t.id, from, to });
          }
          writeRow--;
        }
      }
    }
    return moves;
  }

  // Создаёт новые тайлы сверху для пустых клеток. Возвращает их.
  refill(): TileModel[] {
    const spawned: TileModel[] = [];
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.get(c, r)) {
          const type = randInt(this.rng, TILE_TYPES);
          const tile = this.createTile(type, c, r);
          this.setCell(c, r, tile);
          spawned.push(tile);
        }
      }
    }
    return spawned;
  }

  private createTile(type: number, col: number, row: number): TileModel {
    return { id: this.nextId++, type, col, row };
  }
}
