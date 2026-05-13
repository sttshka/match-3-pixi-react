import { Board } from '@game/board/Board';
import type { TileModel } from '@core/types';

/**
 * Хелперы для unit-тестов. Все они используют публичный API, кроме
 * `applyLayout`/`readLayout` — там мы аккуратно лезем в приватный
 * массив `cells` через `as any`. Это локальное решение для тестов
 * допустимо: добавлять test-only методы в `Board` ради этого нет смысла.
 *
 * Сетки в layout читаются «как видим»: сверху вниз, слева направо.
 * Значение -1 означает «пусто» (null), любое неотрицательное число —
 * это `type` тайла.
 */

export function makeBoard(cols: number, rows: number, seed = 1): Board {
  const board = new Board(cols, rows, seed);
  board.generateInitial();
  return board;
}

export function makeEmptyBoard(cols: number, rows: number): Board {
  const board = new Board(cols, rows, 1);
  const cells = (board as unknown as { cells: Array<TileModel | null> }).cells;
  for (let i = 0; i < cells.length; i++) cells[i] = null;
  return board;
}

/**
 * Накладывает прямоугольную сетку типов поверх доски, не пересоздавая тайлы:
 * меняется только `type`, id сохраняется (важно для проверки коллапса).
 * Если в клетке layout -1 — клетка очищается (null).
 * Если в клетке layout число и в доске null — создаётся новый тайл.
 */
export function applyLayout(board: Board, layout: number[][]): void {
  const cells = (board as unknown as { cells: Array<TileModel | null> }).cells;
  const refNextId = board as unknown as { nextId: number };
  for (let r = 0; r < layout.length; r++) {
    for (let c = 0; c < layout[r].length; c++) {
      const idx = r * board.cols + c;
      const value = layout[r][c];
      if (value < 0) {
        cells[idx] = null;
        continue;
      }
      const tile = cells[idx];
      if (tile) {
        tile.type = value;
      } else {
        cells[idx] = { id: refNextId.nextId++, type: value, col: c, row: r };
      }
    }
  }
}

/**
 * Удобное чтение раскладки в виде матрицы `number | null`.
 * Используем в ассертах: `expect(readLayout(board)).toEqual([[...], ...])`.
 */
export function readLayout(board: Board): Array<Array<number | null>> {
  const out: Array<Array<number | null>> = [];
  for (let r = 0; r < board.rows; r++) {
    const row: Array<number | null> = [];
    for (let c = 0; c < board.cols; c++) {
      row.push(board.get(c, r)?.type ?? null);
    }
    out.push(row);
  }
  return out;
}

/** Проверка: на доске нет пустых клеток. */
export function isFull(board: Board): boolean {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (!board.get(c, r)) return false;
    }
  }
  return true;
}
