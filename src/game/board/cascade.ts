import type { CascadeStep, ResolveResult, TilePosition } from '@core/types';
import { collectMatchGroups } from './matchFinder';
import { planBoosterSurvivorsFromMatches } from './boosterFromMatch';
import { scoreForBoosterClear, scoreForGroups } from '../rules/scoring';
import type { Board } from './Board';

function uniqRemovePositions(positions: TilePosition[]): TilePosition[] {
  const seen = new Set<string>();
  const out: TilePosition[] = [];
  for (const p of positions) {
    const k = `${p.col}:${p.row}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

const LAYER_STRIP_SCORE = 30;

/**
 * Радужный + радужный: снос всех фишек; у клеток с `obstacleLayers` снимается один слой
 * (препятствие остаётся, пока слои не исчерпаны).
 */
export function applyRainbowDuoClearAndGravity(board: Board): CascadeStep {
  const removed: TilePosition[] = [];
  let layerStrips = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const t = board.get(c, r);
      if (!t) continue;
      if (t.obstacleLayers !== undefined && t.obstacleLayers > 0) {
        t.obstacleLayers--;
        layerStrips++;
        if (t.obstacleLayers <= 0) delete t.obstacleLayers;
        continue;
      }
      removed.push({ col: c, row: r });
    }
  }
  board.remove(removed);
  const resolved: ResolveResult = {
    groups: [],
    scoreGained: scoreForBoosterClear(removed.length) + layerStrips * LAYER_STRIP_SCORE,
    removed,
  };
  const moves = board.collapse();
  const spawned = board.refill();
  return { resolved, moves, spawned };
}

/** Удаление по списку клеток (активация бустера), гравитация и refill — один шаг каскада. */
export function applyBoosterClearAndGravity(board: Board, positions: TilePosition[]): CascadeStep {
  const remove = uniqRemovePositions(positions);
  board.remove(remove);
  const resolved: ResolveResult = {
    groups: [],
    scoreGained: scoreForBoosterClear(remove.length),
    removed: remove,
  };
  const moves = board.collapse();
  const spawned = board.refill();
  return { resolved, moves, spawned };
}

// Один шаг каскада: находим матчи, удаляем, схлопываем, доспавним новые.
// Если матчей нет — возвращаем null, и контроллер останавливает каскад.
export function nextCascadeStep(
  board: Board,
  opts?: { moveTarget?: TilePosition },
): CascadeStep | null {
  const groups = collectMatchGroups(board);
  if (groups.length === 0) return null;

  const plan = planBoosterSurvivorsFromMatches(groups, opts?.moveTarget);
  for (const u of plan.upgrades) {
    const tile = board.get(u.col, u.row);
    if (tile) tile.type = u.type;
  }
  board.remove(plan.remove);

  const upgradedToBooster: Array<{ id: number; type: number }> | undefined =
    plan.upgrades.length > 0
      ? plan.upgrades
          .map((u) => {
            const t = board.get(u.col, u.row);
            return t ? { id: t.id, type: t.type } : null;
          })
          .filter((x): x is { id: number; type: number } => x !== null)
      : undefined;

  const resolved: ResolveResult = {
    groups,
    scoreGained: scoreForGroups(groups),
    removed: plan.remove,
    upgradedToBooster,
  };

  const moves = board.collapse();
  const spawned = board.refill();

  return { resolved, moves, spawned };
}

// Запускает каскад до стабильного состояния и возвращает все шаги.
// Используется когда нужно посчитать итог "за один тик".
export function runFullCascade(board: Board): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let safety = 32;
  while (safety-- > 0) {
    const step = nextCascadeStep(board);
    if (!step) break;
    steps.push(step);
  }
  return steps;
}
