import type { Board } from './Board';
import type { MatchGroup, TilePosition } from '@core/types';
import { isNormalTileType } from './boosterTypes';

// Поиск совпадений: горизонтальные и вертикальные линии длиной ≥ 3,
// а также объединение пересечений в "крест".
export function findMatches(board: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];

  // Горизонтальные линии.
  for (let r = 0; r < board.rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= board.cols; c++) {
      const cur = c < board.cols ? board.get(c, r) : null;
      const prev = board.get(c - 1, r);
      const same =
        cur &&
        prev &&
        isNormalTileType(cur.type) &&
        isNormalTileType(prev.type) &&
        cur.type === prev.type;
      if (!same) {
        const runLen = c - runStart;
        if (runLen >= 3 && prev) {
          const tiles: TilePosition[] = [];
          for (let i = runStart; i < c; i++) tiles.push({ col: i, row: r });
          groups.push({ tiles, length: runLen, kind: 'row' });
        }
        runStart = c;
      }
    }
  }

  // Вертикальные линии.
  for (let c = 0; c < board.cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= board.rows; r++) {
      const cur = r < board.rows ? board.get(c, r) : null;
      const prev = board.get(c, r - 1);
      const same =
        cur &&
        prev &&
        isNormalTileType(cur.type) &&
        isNormalTileType(prev.type) &&
        cur.type === prev.type;
      if (!same) {
        const runLen = r - runStart;
        if (runLen >= 3 && prev) {
          const tiles: TilePosition[] = [];
          for (let i = runStart; i < r; i++) tiles.push({ col: c, row: i });
          groups.push({ tiles, length: runLen, kind: 'col' });
        }
        runStart = r;
      }
    }
  }

  return mergeCrosses(groups);
}

/** Квадраты 2×2 из четырёх обычных тайлов одного цвета (самолётик). */
export function findSquareMatches(board: Board): MatchGroup[] {
  const groups: MatchGroup[] = [];
  for (let r = 0; r < board.rows - 1; r++) {
    for (let c = 0; c < board.cols - 1; c++) {
      const t00 = board.get(c, r);
      const t10 = board.get(c + 1, r);
      const t01 = board.get(c, r + 1);
      const t11 = board.get(c + 1, r + 1);
      if (!t00 || !t10 || !t01 || !t11) continue;
      if (
        !isNormalTileType(t00.type) ||
        !isNormalTileType(t10.type) ||
        !isNormalTileType(t01.type) ||
        !isNormalTileType(t11.type)
      ) {
        continue;
      }
      if (t00.type === t10.type && t00.type === t01.type && t00.type === t11.type) {
        groups.push({
          tiles: [
            { col: c, row: r },
            { col: c + 1, row: r },
            { col: c, row: r + 1 },
            { col: c + 1, row: r + 1 },
          ],
          length: 4,
          kind: 'square',
        });
      }
    }
  }
  return groups;
}

/** Линии (с крестами) + квадраты 2×2 — один шаг каскада. Бомба — только из креста 5–6 клеток (Г / Т / +). */
export function collectMatchGroups(board: Board): MatchGroup[] {
  return [...findMatches(board), ...findSquareMatches(board)];
}

// Объединяет пересекающиеся row+col группы в один "cross" — это нужно
// для корректного подсчёта очков (без двойного начисления за пересечения).
function mergeCrosses(groups: MatchGroup[]): MatchGroup[] {
  if (groups.length < 2) return groups;
  const used = new Set<number>();
  const merged: MatchGroup[] = [];

  for (let i = 0; i < groups.length; i++) {
    if (used.has(i)) continue;
    let acc = groups[i];
    for (let j = i + 1; j < groups.length; j++) {
      if (used.has(j)) continue;
      if (acc.kind === groups[j].kind) continue;
      if (hasIntersection(acc.tiles, groups[j].tiles)) {
        const tiles = uniqPositions([...acc.tiles, ...groups[j].tiles]);
        acc = { tiles, length: tiles.length, kind: 'cross' };
        used.add(j);
      }
    }
    used.add(i);
    merged.push(acc);
  }
  return merged;
}

function hasIntersection(a: TilePosition[], b: TilePosition[]): boolean {
  for (const p of a) {
    for (const q of b) {
      if (p.col === q.col && p.row === q.row) return true;
    }
  }
  return false;
}

function uniqPositions(arr: TilePosition[]): TilePosition[] {
  const seen = new Set<string>();
  const out: TilePosition[] = [];
  for (const p of arr) {
    const k = `${p.col}:${p.row}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}
