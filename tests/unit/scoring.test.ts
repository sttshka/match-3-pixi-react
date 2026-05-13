import { describe, expect, it } from 'vitest';
import { scoreForGroup, scoreForGroups } from '@game/rules/scoring';
import type { MatchGroup } from '@core/types';

function row(length: number): MatchGroup {
  return {
    tiles: Array.from({ length }, (_, i) => ({ col: i, row: 0 })),
    length,
    kind: 'row',
  };
}

describe('scoring', () => {
  it('даёт табличные значения для длин 3, 4, 5', () => {
    expect(scoreForGroup(row(3))).toBe(30);
    expect(scoreForGroup(row(4))).toBe(60);
    expect(scoreForGroup(row(5))).toBe(120);
  });

  it('даёт прогрессивные значения для длин > 5', () => {
    expect(scoreForGroup(row(6))).toBe(200);
    expect(scoreForGroup(row(7))).toBeGreaterThan(scoreForGroup(row(6)));
  });

  it('cross на ту же длину даёт не меньше row', () => {
    const five = row(5);
    const cross: MatchGroup = { ...five, kind: 'cross' };
    expect(scoreForGroup(cross)).toBeGreaterThanOrEqual(scoreForGroup(five));
  });

  it('scoreForGroups суммирует независимые группы', () => {
    expect(scoreForGroups([row(3), row(3)])).toBe(60);
    expect(scoreForGroups([row(3), row(4), row(5)])).toBe(30 + 60 + 120);
  });
});
