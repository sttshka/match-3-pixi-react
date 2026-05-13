import { describe, expect, it } from 'vitest';
import { Board } from '@game/board/Board';
import { findMatches } from '@game/board/matchFinder';
import { applyLayout, isFull, makeBoard, makeEmptyBoard, readLayout } from './helpers';

describe('Board', () => {
  it('generateInitial заполняет всю доску', () => {
    const b = makeBoard(8, 8, 42);
    expect(isFull(b)).toBe(true);
  });

  it('generateInitial не создаёт стартовых матчей (seed-устойчиво)', () => {
    for (const seed of [1, 2, 3, 7, 42, 100, 12345]) {
      const b = makeBoard(8, 8, seed);
      expect(findMatches(b)).toEqual([]);
    }
  });

  it('одинаковый seed даёт одинаковую начальную раскладку', () => {
    const a = makeBoard(6, 6, 777);
    const b = makeBoard(6, 6, 777);
    expect(readLayout(a)).toEqual(readLayout(b));
  });

  it('swap меняет местами тайлы', () => {
    const b = makeEmptyBoard(2, 1);
    applyLayout(b, [[0, 1]]);
    b.swap({ col: 0, row: 0 }, { col: 1, row: 0 });
    expect(b.get(0, 0)?.type).toBe(1);
    expect(b.get(1, 0)?.type).toBe(0);
  });

  it('remove ставит null на указанные позиции', () => {
    const b = makeEmptyBoard(3, 1);
    applyLayout(b, [[0, 1, 2]]);
    b.remove([{ col: 1, row: 0 }]);
    expect(b.get(1, 0)).toBeNull();
  });

  it('collapse складывает тайлы вниз, возвращая перемещения', () => {
    const b = makeEmptyBoard(1, 4);
    applyLayout(b, [[1], [-1], [2], [-1]]);
    const moves = b.collapse();
    // На дне теперь 2, выше — 1, ещё выше — пусто.
    expect(b.get(0, 3)?.type).toBe(2);
    expect(b.get(0, 2)?.type).toBe(1);
    expect(b.get(0, 1)).toBeNull();
    expect(b.get(0, 0)).toBeNull();
    expect(moves.length).toBeGreaterThan(0);
  });

  it('refill заполняет все пустые клетки новыми тайлами', () => {
    const b = makeEmptyBoard(3, 3);
    applyLayout(b, [
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
    ]);
    const spawned = b.refill();
    expect(spawned).toHaveLength(9);
    expect(isFull(b)).toBe(true);
  });

  it('get() возвращает null за пределами доски', () => {
    const b = makeBoard(4, 4);
    expect(b.get(-1, 0)).toBeNull();
    expect(b.get(0, -1)).toBeNull();
    expect(b.get(4, 0)).toBeNull();
    expect(b.get(0, 4)).toBeNull();
  });
});
