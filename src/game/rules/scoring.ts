import { SCORE_BY_LENGTH } from '@core/constants';
import type { MatchGroup } from '@core/types';

// Подсчёт очков за группу совпадений.
// Для длин, отсутствующих в таблице, продолжаем линейной экстраполяцией
// от максимума таблицы — это гарантирует монотонный рост очков с длиной.
const TABLE_MAX_LENGTH = Math.max(...Object.keys(SCORE_BY_LENGTH).map(Number));
const OVERFLOW_BONUS_PER_TILE = 50;

function tableScore(length: number): number {
  const direct = SCORE_BY_LENGTH[length];
  if (direct !== undefined) return direct;
  const fallback = SCORE_BY_LENGTH[TABLE_MAX_LENGTH];
  return fallback + (length - TABLE_MAX_LENGTH) * OVERFLOW_BONUS_PER_TILE;
}

export function scoreForGroup(group: MatchGroup): number {
  if (group.kind === 'cross' || group.kind === 'cluster') {
    const base = SCORE_BY_LENGTH[5] ?? 120;
    return base + Math.max(0, group.length - 5) * 30;
  }
  if (group.kind === 'square') {
    return SCORE_BY_LENGTH[4] ?? 60;
  }
  return tableScore(group.length);
}

export function scoreForGroups(groups: MatchGroup[]): number {
  return groups.reduce((acc, g) => acc + scoreForGroup(g), 0);
}

/** Очки за ручную активацию бустера (удаление по области без match-групп). */
export function scoreForBoosterClear(tileCount: number): number {
  return tileCount * 18;
}
