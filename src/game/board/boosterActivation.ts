import type { Board } from './Board';
import type { TileModel, TilePosition } from '@core/types';
import { TILE_TYPES } from '@core/constants';
import {
  isBombType,
  isColorBoosterType,
  isLineColType,
  isLineRowType,
  isLineBoosterType,
  isNormalTileType,
  isPlaneType,
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

/** Горизонтальный своп соседей (одна строка, соседние столбцы). */
export function swapIsHorizontal(a: TilePosition, b: TilePosition): boolean {
  return a.row === b.row && Math.abs(a.col - b.col) === 1;
}

function cellsChebyshev(board: Board, center: TilePosition, radius: number): TilePosition[] {
  const out: TilePosition[] = [];
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) > radius) continue;
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

function orthogonalNeighbors(board: Board, center: TilePosition): TilePosition[] {
  const dirs = [
    { dc: 1, dr: 0 },
    { dc: -1, dr: 0 },
    { dc: 0, dr: 1 },
    { dc: 0, dr: -1 },
  ];
  const out: TilePosition[] = [];
  for (const { dc, dr } of dirs) {
    const col = center.col + dc;
    const row = center.row + dr;
    if (board.get(col, row)) out.push({ col, row });
  }
  return out;
}

/** Самый частый обычный цвет на доске (комбо «радужный + бонус» / цепочки). */
function mostFrequentNormalColor(board: Board): number | null {
  const counts = new Array<number>(TILE_TYPES).fill(0);
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const t = board.get(c, r);
      if (!t || !isNormalTileType(t.type)) continue;
      counts[t.type]++;
    }
  }
  let best = -1;
  let bestT = -1;
  for (let i = 0; i < TILE_TYPES; i++) {
    if (counts[i] > best) {
      best = counts[i];
      bestT = i;
    }
  }
  return best > 0 ? bestT : null;
}

/** Кандидаты для «удара» самолёта: любая занятая клетка кроме позиции самолёта. */
function listPlaneTargetCandidates(board: Board, exclude: TilePosition): TilePosition[] {
  const out: TilePosition[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (c === exclude.col && r === exclude.row) continue;
      if (board.get(c, r)) out.push({ col: c, row: r });
    }
  }
  return out.sort((p, q) => (p.row === q.row ? p.col - q.col : p.row - q.row));
}

function pickDeterministicTarget(board: Board, exclude: TilePosition, salt: number): TilePosition | null {
  const cands = listPlaneTargetCandidates(board, exclude);
  if (cands.length === 0) return null;
  return cands[Math.abs(salt) % cands.length]!;
}

/** Самолёт: крест вокруг себя + удар по цели + крест вокруг цели (Homescapes). */
function planeSwapClear(board: Board, planePos: TilePosition, salt: number): TilePosition[] {
  const out = [...orthogonalNeighbors(board, planePos), planePos];
  const pick = pickDeterministicTarget(board, planePos, salt);
  if (pick) {
    out.push(pick, ...orthogonalNeighbors(board, pick));
  }
  return uniqPositions(out);
}

/** Три удара самолётика (два самолёта): три разные цели. */
function triplePlaneHits(board: Board, salt: number): TilePosition[] {
  const cands = listPlaneTargetCandidates(board, { col: -1, row: -1 });
  if (cands.length === 0) return [];
  const used = new Set<string>();
  const out: TilePosition[] = [];
  for (let i = 0; i < 3; i++) {
    let idx = Math.abs(salt + i * 9973) % cands.length;
    let guard = 0;
    while (guard < cands.length && used.has(key(cands[idx]!))) {
      idx = (idx + 1) % cands.length;
      guard++;
    }
    const pick = cands[idx]!;
    used.add(key(pick));
    out.push(pick, ...orthogonalNeighbors(board, pick));
  }
  return uniqPositions(out);
}

/** Homescapes bomb+rocket: три полосы по строкам и три по столбцам вокруг центра пары. */
function threeRowsThreeColsBand(board: Board, centerRow: number, centerCol: number): TilePosition[] {
  const out: TilePosition[] = [];
  const seen = new Set<string>();
  for (let dr = -1; dr <= 1; dr++) {
    const row = centerRow + dr;
    if (row < 0 || row >= board.rows) continue;
    for (let c = 0; c < board.cols; c++) {
      const p = { col: c, row };
      const k = key(p);
      if (seen.has(k)) continue;
      if (board.get(c, row)) {
        seen.add(k);
        out.push(p);
      }
    }
  }
  for (let dc = -1; dc <= 1; dc++) {
    const col = centerCol + dc;
    if (col < 0 || col >= board.cols) continue;
    for (let r = 0; r < board.rows; r++) {
      const p = { col, row: r };
      const k = key(p);
      if (seen.has(k)) continue;
      if (board.get(col, r)) {
        seen.add(k);
        out.push(p);
      }
    }
  }
  return out;
}

function comboCenter(a: TilePosition, b: TilePosition): { row: number; col: number } {
  return { row: Math.floor((a.row + b.row) / 2), col: Math.floor((a.col + b.col) / 2) };
}

/** Локальный эффект одного бустера (для цепочки во взрыве). */
function oneBoosterBlast(board: Board, pos: TilePosition, tile: TileModel): TilePosition[] {
  if (isBombType(tile.type)) return cellsChebyshev(board, pos, 1);
  if (isLineRowType(tile.type)) return fullRow(board, pos.row);
  if (isLineColType(tile.type)) return fullCol(board, pos.col);
  if (isPlaneType(tile.type)) return planeSwapClear(board, pos, tile.id * 17);
  if (isColorBoosterType(tile.type)) {
    const mc = mostFrequentNormalColor(board);
    if (mc === null) return [pos];
    return uniqPositions([...collectColorClear(board, mc), pos]);
  }
  return [];
}

const CHAIN_MAX = 48;

/** Бустеры во взрыве цепляются (Homescapes): расширяем множество клеток к удалению. */
function expandBoosterChain(board: Board, seeds: TilePosition[]): TilePosition[] {
  const acc = new Set<string>(seeds.map(key));
  let changed = true;
  let guard = 0;
  while (changed && guard++ < CHAIN_MAX) {
    changed = false;
    const snapshot = [...acc];
    for (const ks of snapshot) {
      const [cs, rs] = ks.split(':');
      const p = { col: Number(cs), row: Number(rs) };
      const t = board.get(p.col, p.row);
      if (!t || isNormalTileType(t.type)) continue;
      const extra = oneBoosterBlast(board, p, t);
      for (const e of extra) {
        const ek = key(e);
        if (!acc.has(ek)) {
          acc.add(ek);
          changed = true;
        }
      }
    }
  }
  const out: TilePosition[] = [];
  for (const ks of acc) {
    const [cs, rs] = ks.split(':');
    out.push({ col: Number(cs), row: Number(rs) });
  }
  return out;
}

function allOccupiedCells(board: Board): TilePosition[] {
  const out: TilePosition[] = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (board.get(c, r)) out.push({ col: c, row: r });
    }
  }
  return out;
}

/** Два ракетных бустера: одна полная строка + один полный столбец (Homescapes). */
function twoRocketsCombo(board: Board, a: TilePosition, b: TilePosition): TilePosition[] {
  const sorted = [a, b].sort((p, q) => (p.row === q.row ? p.col - q.col : p.row - q.row));
  const first = sorted[0]!;
  const second = sorted[1]!;
  return uniqPositions([...fullRow(board, first.row), ...fullCol(board, second.col)]);
}

function tryTwoSpecialCombo(
  a: TilePosition,
  b: TilePosition,
  ta: TileModel,
  tb: TileModel,
  board: Board,
): TilePosition[] | undefined {
  const bombA = isBombType(ta.type);
  const bombB = isBombType(tb.type);
  const planeA = isPlaneType(ta.type);
  const planeB = isPlaneType(tb.type);
  const colorA = isColorBoosterType(ta.type);
  const colorB = isColorBoosterType(tb.type);
  const lineA = isLineBoosterType(ta.type);
  const lineB = isLineBoosterType(tb.type);

  if (colorA && colorB) {
    return allOccupiedCells(board);
  }

  if (bombA && bombB) {
    return uniqPositions([...cellsChebyshev(board, a, 2), ...cellsChebyshev(board, b, 2)]);
  }

  if (planeA && planeB) {
    return triplePlaneHits(board, ta.id * 31 + tb.id * 17);
  }

  if ((planeA && bombB) || (bombA && planeB)) {
    const planePos = planeA ? a : b;
    const bombPos = bombA ? a : b;
    const salt = ta.id + tb.id;
    const target = pickDeterministicTarget(board, planePos, salt);
    const planeZone = planeSwapClear(board, planePos, salt);
    const bombZone = target ? cellsChebyshev(board, target, 1) : cellsChebyshev(board, bombPos, 1);
    return uniqPositions([...planeZone, ...bombZone]);
  }

  if ((planeA && lineB) || (lineA && planeB)) {
    const planePos = planeA ? a : b;
    const linePos = lineA ? a : b;
    const lineTile = lineA ? ta : tb;
    const salt = ta.id * 11 + tb.id;
    const target = pickDeterministicTarget(board, planePos, salt);
    const planeZone = planeSwapClear(board, planePos, salt);
    let lineAtTarget: TilePosition[] = [];
    if (target) {
      lineAtTarget = isLineRowType(lineTile.type)
        ? fullRow(board, target.row)
        : fullCol(board, target.col);
    } else {
      lineAtTarget = isLineRowType(lineTile.type)
        ? fullRow(board, linePos.row)
        : fullCol(board, linePos.col);
    }
    return uniqPositions([...planeZone, ...lineAtTarget]);
  }

  if (lineA && lineB) {
    return twoRocketsCombo(board, a, b);
  }

  if ((bombA && lineB) || (lineA && bombB)) {
    const ctr = comboCenter(a, b);
    return threeRowsThreeColsBand(board, ctr.row, ctr.col);
  }

  if ((colorA && (bombB || lineB || planeB)) || (colorB && (bombA || lineA || planeA))) {
    const other = colorA ? tb : ta;
    const mc = mostFrequentNormalColor(board);
    if (mc === null) return uniqPositions([a, b]);
    const colorCells = collectColorClear(board, mc);
    const union: TilePosition[] = [...colorCells, a, b];

    if (isBombType(other.type)) {
      for (const p of colorCells) {
        union.push(...cellsChebyshev(board, p, 1));
      }
    } else if (isLineRowType(other.type)) {
      for (const p of colorCells) {
        union.push(...fullRow(board, p.row));
      }
    } else if (isLineColType(other.type)) {
      for (const p of colorCells) {
        union.push(...fullCol(board, p.col));
      }
    } else if (isPlaneType(other.type)) {
      for (const p of colorCells) {
        union.push(...planeSwapClear(board, p, other.id + p.col * 31 + p.row * 17));
      }
    }
    return uniqPositions(union);
  }

  return undefined;
}

/**
 * После свопа: `a` и `b` — клетки, `board` уже отражает новую раскладку.
 * `horiz` — направление свопа (оставлено в API для вызывающего кода).
 */
export function getBoosterSwapClear(
  a: TilePosition,
  b: TilePosition,
  board: Board,
  _horiz: boolean,
): TilePosition[] | null {
  const ta = board.get(a.col, a.row);
  const tb = board.get(b.col, b.row);
  if (!ta || !tb) return null;

  const sa = isSpecialTileType(ta.type);
  const sb = isSpecialTileType(tb.type);
  if (!sa && !sb) return null;

  let base: TilePosition[] | null = null;

  if (sa && sb) {
    const combo = tryTwoSpecialCombo(a, b, ta, tb, board);
    if (combo !== undefined) base = combo;
  }

  if (base === null && isColorBoosterType(ta.type) && isNormalTileType(tb.type)) {
    base = uniqPositions([...collectColorClear(board, tb.type), a, b]);
  }
  if (base === null && isColorBoosterType(tb.type) && isNormalTileType(ta.type)) {
    base = uniqPositions([...collectColorClear(board, ta.type), a, b]);
  }

  if (base === null && isBombType(ta.type) && isNormalTileType(tb.type)) {
    base = cellsChebyshev(board, a, 1);
  }
  if (base === null && isBombType(tb.type) && isNormalTileType(ta.type)) {
    base = cellsChebyshev(board, b, 1);
  }

  if (base === null && isLineRowType(ta.type) && isNormalTileType(tb.type)) {
    base = fullRow(board, a.row);
  }
  if (base === null && isLineColType(ta.type) && isNormalTileType(tb.type)) {
    base = fullCol(board, a.col);
  }
  if (base === null && isLineRowType(tb.type) && isNormalTileType(ta.type)) {
    base = fullRow(board, b.row);
  }
  if (base === null && isLineColType(tb.type) && isNormalTileType(ta.type)) {
    base = fullCol(board, b.col);
  }

  if (base === null && isPlaneType(ta.type) && isNormalTileType(tb.type)) {
    base = planeSwapClear(board, a, ta.id + tb.id);
  }
  if (base === null && isPlaneType(tb.type) && isNormalTileType(ta.type)) {
    base = planeSwapClear(board, b, ta.id + tb.id);
  }

  if (base === null) return null;

  if (sa && sb && isColorBoosterType(ta.type) && isColorBoosterType(tb.type)) {
    return uniqPositions(base);
  }

  return uniqPositions(expandBoosterChain(board, base));
}
