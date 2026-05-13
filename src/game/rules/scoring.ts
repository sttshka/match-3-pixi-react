import { SCORE_BY_LENGTH } from '@core/constants';
import type { MatchGroup } from '@core/types';

// Подсчёт очков за группу совпадений. Для крестов используем линейную шкалу.
export function scoreForGroup(group: MatchGroup): number {
  const table = SCORE_BY_LENGTH;
  if (group.kind === 'cross') {
    const base = table[5] ?? 120;
    return base + Math.max(0, group.length - 5) * 30;
  }
  return table[group.length] ?? table[3] + (group.length - 3) * 30;
}

export function scoreForGroups(groups: MatchGroup[]): number {
  return groups.reduce((acc, g) => acc + scoreForGroup(g), 0);
}
