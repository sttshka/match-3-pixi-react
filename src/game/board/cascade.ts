import type { CascadeStep, ResolveResult, TilePosition } from '@core/types';
import { findMatches } from './matchFinder';
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
export function nextCascadeStep(board: Board): CascadeStep | null {
  const groups = findMatches(board);
  if (groups.length === 0) return null;

  const plan = planBoosterSurvivorsFromMatches(groups);
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
