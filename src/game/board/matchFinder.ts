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

/** Квадраты 2×2 из четырёх обычных тайлов одного цвета (ракета). */
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

function isDegenerateLine(tiles: TilePosition[]): boolean {
  const rows = new Set(tiles.map((t) => t.row));
  const cols = new Set(tiles.map((t) => t.col));
  return rows.size === 1 || cols.size === 1;
}

/**
 * Связные (4-соседство) области ≥5 одного цвета, не лежащие на одной прямой
 * (линии ≥5 обрабатываются как disco). Homescapes: «компактный кластер» → бомба.
 */
export function findClusterBombMatches(board: Board): MatchGroup[] {
  const assigned = new Set<string>();
  const groups: MatchGroup[] = [];

  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const k = `${c}:${r}`;
      if (assigned.has(k)) continue;
      const t0 = board.get(c, r);
      if (!t0 || !isNormalTileType(t0.type)) continue;

      const typ = t0.type;
      const comp: TilePosition[] = [];
      const q: TilePosition[] = [{ col: c, row: r }];
      const queued = new Set<string>([k]);

      while (q.length > 0) {
        const p = q.shift()!;
        const t = board.get(p.col, p.row);
        if (!t || !isNormalTileType(t.type) || t.type !== typ) continue;
        comp.push(p);
        for (const [dc, dr] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nc = p.col + dc;
          const nr = p.row + dr;
          const nk = `${nc}:${nr}`;
          if (queued.has(nk)) continue;
          const tn = board.get(nc, nr);
          if (!tn || !isNormalTileType(tn.type) || tn.type !== typ) continue;
          queued.add(nk);
          q.push({ col: nc, row: nr });
        }
      }

      for (const cell of comp) assigned.add(`${cell.col}:${cell.row}`);

      if (comp.length < 5) continue;
      if (isDegenerateLine(comp)) continue;
      groups.push({ tiles: comp, length: comp.length, kind: 'cluster' });
    }
  }
  return groups;
}

/** Линии (с крестами) + квадраты 2×2 + кластеры для бомбы — один шаг каскада. */
export function collectMatchGroups(board: Board): MatchGroup[] {
  return [...findMatches(board), ...findSquareMatches(board), ...findClusterBombMatches(board)];
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
