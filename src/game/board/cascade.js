import { findMatches } from './matchFinder';
import { scoreForGroups } from '../rules/scoring';
// Один шаг каскада: находим матчи, удаляем, схлопываем, доспавним новые.
// Если матчей нет — возвращаем null, и контроллер останавливает каскад.
export function nextCascadeStep(board) {
    const groups = findMatches(board);
    if (groups.length === 0)
        return null;
    const removedPositions = groups.flatMap((g) => g.tiles);
    board.remove(removedPositions);
    const resolved = {
        groups,
        scoreGained: scoreForGroups(groups),
        removed: removedPositions,
    };
    const moves = board.collapse();
    const spawned = board.refill();
    return { resolved, moves, spawned };
}
// Запускает каскад до стабильного состояния и возвращает все шаги.
// Используется когда нужно посчитать итог "за один тик".
export function runFullCascade(board) {
    const steps = [];
    let safety = 32;
    while (safety-- > 0) {
        const step = nextCascadeStep(board);
        if (!step)
            break;
        steps.push(step);
    }
    return steps;
}
