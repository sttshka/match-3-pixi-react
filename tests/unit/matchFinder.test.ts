import { describe, expect, it } from 'vitest';
import { findMatches } from '@game/board/matchFinder';
import { applyLayout, makeEmptyBoard } from './helpers';

describe('matchFinder', () => {
  it('возвращает пустой массив для доски без совпадений', () => {
    const board = makeEmptyBoard(4, 4);
    applyLayout(board, [
      [0, 1, 2, 3],
      [1, 2, 3, 0],
      [2, 3, 0, 1],
      [3, 0, 1, 2],
    ]);
    expect(findMatches(board)).toEqual([]);
  });

  it('находит горизонтальный матч длины 3', () => {
    const board = makeEmptyBoard(5, 1);
    applyLayout(board, [[0, 0, 0, 1, 2]]);
    const m = findMatches(board);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('row');
    expect(m[0].length).toBe(3);
    expect(m[0].tiles).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
    ]);
  });

  it('находит горизонтальный матч длины 5', () => {
    const board = makeEmptyBoard(5, 1);
    applyLayout(board, [[2, 2, 2, 2, 2]]);
    const m = findMatches(board);
    expect(m).toHaveLength(1);
    expect(m[0].length).toBe(5);
  });

  it('находит вертикальный матч длины 4', () => {
    const board = makeEmptyBoard(1, 5);
    applyLayout(board, [[1], [1], [1], [1], [0]]);
    const m = findMatches(board);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('col');
    expect(m[0].length).toBe(4);
  });

  it('находит несколько независимых горизонтальных линий', () => {
    const board = makeEmptyBoard(6, 2);
    applyLayout(board, [
      [0, 0, 0, 1, 2, 2],
      [3, 4, 4, 4, 4, 5],
    ]);
    const m = findMatches(board);
    expect(m).toHaveLength(2);
    const rows = m.filter((g) => g.kind === 'row');
    expect(rows.map((g) => g.length).sort()).toEqual([3, 4]);
  });

  it('объединяет пересекающиеся row+col в "cross" без двойного учёта', () => {
    // T-образное совпадение: горизонталь длины 3 и вертикаль длины 3,
    // пересекаются в одной клетке → результат — один cross на 5 уникальных позиций.
    // Фон специально разнотипный, чтобы вокруг T не возникало случайных линий.
    const board = makeEmptyBoard(5, 5);
    applyLayout(board, [
      [2, 3, 1, 4, 5],
      [6, 7, 1, 8, 9],
      [1, 1, 1, 0, 2],
      [3, 4, 5, 6, 7],
      [8, 9, 0, 1, 2],
    ]);
    const m = findMatches(board);
    expect(m).toHaveLength(1);
    expect(m[0].kind).toBe('cross');
    expect(m[0].length).toBe(5);
  });

  it('не учитывает линии короче 3', () => {
    const board = makeEmptyBoard(4, 1);
    applyLayout(board, [[0, 0, 1, 1]]);
    expect(findMatches(board)).toEqual([]);
  });

  it('null-клетки не образуют совпадений', () => {
    const board = makeEmptyBoard(5, 1);
    applyLayout(board, [[0, 0, -1, 0, 0]]);
    expect(findMatches(board)).toEqual([]);
  });
});
