import type { MatchGroup, TilePosition } from '@core/types';
import {
  TILE_TYPE_BOMB,
  TILE_TYPE_COLOR,
  TILE_TYPE_LINE_COL,
  TILE_TYPE_LINE_ROW,
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

/** Центр «креста»: клетка с максимальным числом соседей по строке/столбцу внутри группы. */
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

/**
 * После findMatches: какие клетки удалить, какие превратить в бустер.
 * Крест → бомба 3×3 при активации; линия ≥5 → цветной; линия ровно 4 → полосатый.
 */
export function planBoosterSurvivorsFromMatches(groups: MatchGroup[]): MatchResolutionPlan {
  const upgrades: Array<{ col: number; row: number; type: number }> = [];
  const upgradeKeys = new Set<string>();
  const removeKeys = new Set<string>();

  for (const g of groups) {
    const tiles = sortTiles(g.tiles);
    if (tiles.length === 0) continue;

    if (g.kind === 'cross') {
      const pivot = pickCrossBoosterPivot(tiles);
      upgrades.push({ col: pivot.col, row: pivot.row, type: TILE_TYPE_BOMB });
      upgradeKeys.add(key(pivot));
      for (const t of tiles) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    if (g.length >= 5) {
      const pivot = tiles[Math.floor((tiles.length - 1) / 2)]!;
      upgrades.push({ col: pivot.col, row: pivot.row, type: TILE_TYPE_COLOR });
      upgradeKeys.add(key(pivot));
      for (const t of tiles) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    if (g.length === 4) {
      const pivot = tiles[1]!;
      const lineType = g.kind === 'row' ? TILE_TYPE_LINE_ROW : TILE_TYPE_LINE_COL;
      upgrades.push({ col: pivot.col, row: pivot.row, type: lineType });
      upgradeKeys.add(key(pivot));
      for (const t of tiles) {
        if (key(t) !== key(pivot)) removeKeys.add(key(t));
      }
      continue;
    }

    for (const t of tiles) {
      removeKeys.add(key(t));
    }
  }

  for (const k of upgradeKeys) removeKeys.delete(k);

  const remove: TilePosition[] = [];
  for (const k of removeKeys) {
    const [cs, rs] = k.split(':');
    const col = Number(cs);
    const row = Number(rs);
    remove.push({ col, row });
  }

  return { upgrades, remove };
}
