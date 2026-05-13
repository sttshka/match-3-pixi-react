import type { Board } from './Board';
import type { TilePosition } from '@core/types';
import {
  isBombType,
  isColorBoosterType,
  isLineColType,
  isLineRowType,
  isNormalTileType,
  isSpecialTileType,
} from './boosterTypes';

function key(p: TilePosition): string {
  return `${p.col}:${p.row}`;
}

function uniqPositions(positions: TilePosition[]): TilePosition[] {
  const seen = new Set<string>();
  const out: TilePosition[] = [];
  for (const p of positions) {
    const k = key(p);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

function cellsIn3x3(board: Board, center: TilePosition): TilePosition[] {
  const out: TilePosition[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const col = center.col + dc;
      const row = center.row + dr;
      if (board.get(col, row)) out.push({ col, row });
    }
  }
  return out;
}

function fullRow(board: Board, row: number): TilePosition[] {
  const out: TilePosition[] = [];
  for (let c = 0; c < board.cols; c++) {
    if (board.get(c, row)) out.push({ col: c, row });
  }
  return out;
}

function fullCol(board: Board, col: number): TilePosition[] {
  const out: TilePosition[] = [];
  for (let r = 0; r < board.rows; r++) {
    if (board.get(col, r)) out.push({ col, row: r });
  }
  return out;
}

function collectColorClear(board: Board, colorType: number): TilePosition[] {
  const out: TilePosition[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const t = board.get(c, r);
      if (!t) continue;
      if (t.type === colorType) out.push({ col: c, row: r });
    }
  }
  return out;
}

/**
 * После свопа: `a` и `b` — клетки, `board` уже отражает новую раскладку.
 * Возвращает клетки для удаления при активации бустера, или null если это
 * обычный своп двух обычных тайлов (решает findMatches).
 */
export function getBoosterSwapClear(
  a: TilePosition,
  b: TilePosition,
  board: Board,
): TilePosition[] | null {
  const ta = board.get(a.col, a.row);
  const tb = board.get(b.col, b.row);
  if (!ta || !tb) return null;

  const sa = isSpecialTileType(ta.type);
  const sb = isSpecialTileType(tb.type);
  if (!sa && !sb) return null;

  if (isColorBoosterType(ta.type) && isColorBoosterType(tb.type)) return null;

  // Цветной + обычный по цвету партнёра.
  if (isColorBoosterType(ta.type) && isNormalTileType(tb.type)) {
    return uniqPositions([...collectColorClear(board, tb.type), a, b]);
  }
  if (isColorBoosterType(tb.type) && isNormalTileType(ta.type)) {
    return uniqPositions([...collectColorClear(board, ta.type), a, b]);
  }

  // Две бомбы — объединённый 3×3.
  if (isBombType(ta.type) && isBombType(tb.type)) {
    return uniqPositions([...cellsIn3x3(board, a), ...cellsIn3x3(board, b)]);
  }

  if (isBombType(ta.type)) return cellsIn3x3(board, a);
  if (isBombType(tb.type)) return cellsIn3x3(board, b);

  // Полосатый: полная строка или столбец через клетку бустера.
  if (isLineRowType(ta.type)) return fullRow(board, a.row);
  if (isLineRowType(tb.type)) return fullRow(board, b.row);
  if (isLineColType(ta.type)) return fullCol(board, a.col);
  if (isLineColType(tb.type)) return fullCol(board, b.col);

  // Цветной + спец без нормального цвета — не обрабатываем как бустер-своп.
  return null;
}
