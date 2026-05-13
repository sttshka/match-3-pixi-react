import type { MatchGroup, TilePosition } from '@core/types';
import {
  TILE_TYPE_BOMB,
  TILE_TYPE_COLOR,
  TILE_TYPE_LINE_COL,
  TILE_TYPE_LINE_ROW,
  TILE_TYPE_PLANE,
} from '@core/constants';

export interface MatchResolutionPlan {
  upgrades: Array<{ col: number; row: number; type: number }>;
  remove: TilePosition[];
}

function key(p: TilePosition): string {
  return `${p.col}:${p.row}`;
}

function sortTiles(tiles: TilePosition[]): TilePosition[] {
  return [...tiles].sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row));
}

/**
 * Homescapes: disco (линия ≥5) → бомба (крест / кластер) → самолёт (2×2) → стрела (линия 4).
 */
function groupPriority(g: MatchGroup): number {
  if (g.kind === 'square') return 60;
  if (g.kind === 'cross' || g.kind === 'cluster') return 80;
  if (g.length >= 5) return 100;
  if (g.length === 4) return 50;
  return 20;
}

/** Центр «креста» / Т / плюса: клетка с максимальным числом соседей по строке/столбцу внутри группы. */
function pickCrossBoosterPivot(tiles: TilePosition[]): TilePosition {
  let best = tiles[0]!;
  let bestScore = -1;
  for (const p of tiles) {
    let sc = 0;
    for (const q of tiles) {
      if (p.col === q.col && p.row === q.row) continue;
      if (p.row === q.row || p.col === q.col) sc++;
    }
    if (sc > bestScore) {
      bestScore = sc;
      best = p;
    }
  }
  return best;
}

function pickPivotAvoiding(
  tiles: TilePosition[],
  preferIndex: number,
  forbidden: Set<string>,
): TilePosition | null {
  const sorted = sortTiles(tiles);
  const order = [
    preferIndex,
    preferIndex - 1,
    preferIndex + 1,
    preferIndex - 2,
    preferIndex + 2,
    0,
    sorted.length - 1,
  ];
  const tried = new Set<number>();
  for (const idx of order) {
    if (idx < 0 || idx >= sorted.length || tried.has(idx)) continue;
    tried.add(idx);
    const p = sorted[idx]!;
    if (!forbidden.has(key(p))) return p;
  }
  for (const p of sorted) {
    if (!forbidden.has(key(p))) return p;
  }
  return null;
}

function pickPivotWithMoveTarget(
  tilesAvail: TilePosition[],
  moveTarget: TilePosition | undefined,
  preferIndex: number,
  forbidden: Set<string>,
): TilePosition | null {
  if (
    moveTarget &&
    tilesAvail.some((t) => key(t) === key(moveTarget)) &&
    !forbidden.has(key(moveTarget))
  ) {
    return moveTarget;
  }
  return pickPivotAvoiding(tilesAvail, preferIndex, forbidden);
}

/**
 * После collectMatchGroups: disco → бомба → самолёт → стрела → линия 3.
 * Клетка не может стать двумя бустерами — пересечения по приоритету.
 *
 * @param moveTarget — клетка «куда» свопнули (второй тайл хода); спавн бустера там, если клетка в паттерне.
 */
export function planBoosterSurvivorsFromMatches(
  groups: MatchGroup[],
  moveTarget?: TilePosition,
): MatchResolutionPlan {
  const sorted = [...groups].sort((a, b) => groupPriority(b) - groupPriority(a));
  const survivorKeys = new Set<string>();
  const removeKeys = new Set<string>();
  const upgrades: Array<{ col: number; row: number; type: number }> = [];

  for (const g of sorted) {
    const tilesAvail = g.tiles.filter((t) => !survivorKeys.has(key(t)));

    if (g.kind === 'square') {
      if (tilesAvail.length < 4) continue;
      const sortedSq = sortTiles(tilesAvail);
      const pivot =
        moveTarget && tilesAvail.some((t) => key(t) === key(moveTarget)) ? moveTarget : sortedSq[0]!;
      upgrades.push({ col: pivot.col, row: pivot.row, type: TILE_TYPE_PLANE });
      survivorKeys.add(key(pivot));
      for (const t of tilesAvail) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    if (g.kind === 'cross' || g.kind === 'cluster') {
      if (tilesAvail.length < 3) continue;
      let pivot: TilePosition;
      if (moveTarget && tilesAvail.some((t) => key(t) === key(moveTarget))) {
        pivot = moveTarget;
      } else {
        pivot = pickCrossBoosterPivot(tilesAvail);
      }
      if (survivorKeys.has(key(pivot))) {
        const alt = pickPivotWithMoveTarget(
          tilesAvail,
          moveTarget,
          Math.floor((tilesAvail.length - 1) / 2),
          survivorKeys,
        );
        if (!alt) {
          for (const t of tilesAvail) removeKeys.add(key(t));
          continue;
        }
        upgrades.push({ col: alt.col, row: alt.row, type: TILE_TYPE_BOMB });
        survivorKeys.add(key(alt));
        for (const t of tilesAvail) {
          if (key(t) !== key(alt)) removeKeys.add(key(t));
        }
        continue;
      }
      upgrades.push({ col: pivot.col, row: pivot.row, type: TILE_TYPE_BOMB });
      survivorKeys.add(key(pivot));
      for (const t of tilesAvail) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    if (g.length >= 5) {
      if (tilesAvail.length < 3) continue;
      const mid = Math.floor((sortTiles(tilesAvail).length - 1) / 2);
      const pivot = pickPivotWithMoveTarget(tilesAvail, moveTarget, mid, survivorKeys);
      if (!pivot) {
        for (const t of tilesAvail) removeKeys.add(key(t));
        continue;
      }
      upgrades.push({ col: pivot.col, row: pivot.row, type: TILE_TYPE_COLOR });
      survivorKeys.add(key(pivot));
      for (const t of tilesAvail) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    if (g.length === 4) {
      if (tilesAvail.length < 3) continue;
      /** Homescapes: горизонтальная линия 4 → стрела чистит столбец; вертикальная → строку. */
      const lineType = g.kind === 'row' ? TILE_TYPE_LINE_COL : TILE_TYPE_LINE_ROW;
      const pivot = pickPivotWithMoveTarget(tilesAvail, moveTarget, 1, survivorKeys);
      if (!pivot) {
        for (const t of tilesAvail) removeKeys.add(key(t));
        continue;
      }
      upgrades.push({ col: pivot.col, row: pivot.row, type: lineType });
      survivorKeys.add(key(pivot));
      for (const t of tilesAvail) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    for (const t of g.tiles) {
      if (!survivorKeys.has(key(t))) removeKeys.add(key(t));
    }
  }

  for (const u of upgrades) removeKeys.delete(key(u));

  const remove: TilePosition[] = [];
  for (const k of removeKeys) {
    const [cs, rs] = k.split(':');
    remove.push({ col: Number(cs), row: Number(rs) });
  }

  return { upgrades, remove };
}
