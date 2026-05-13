import { describe, expect, it } from 'vitest';
import { nextCascadeStep, runFullCascade } from '@game/board/cascade';
import { TILE_TYPE_LINE_COL } from '@core/constants';
import { applyLayout, isFull, makeEmptyBoard, readLayout } from './helpers';

describe('cascade.nextCascadeStep', () => {
  it('возвращает null, если нет совпадений', () => {
    const board = makeEmptyBoard(3, 3);
    applyLayout(board, [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
    ]);
    expect(nextCascadeStep(board)).toBeNull();
  });

  it('удаляет совпадение и применяет гравитацию', () => {
    // Горизонталь из трёх 0 в строке 2 → удаляем, верхние тайлы должны
    // упасть на их место.
    const board = makeEmptyBoard(3, 3);
    applyLayout(board, [
      [1, 2, 3],
      [4, 5, 6],
      [0, 0, 0],
    ]);
    const step = nextCascadeStep(board);
    expect(step).not.toBeNull();
    expect(step!.resolved.removed).toHaveLength(3);
    // Снизу теперь должна оказаться вторая строка (4, 5, 6),
    // а над ней — первая (1, 2, 3). Верх — заполнен новыми тайлами.
    expect(board.get(0, 2)?.type).toBe(4);
    expect(board.get(1, 2)?.type).toBe(5);
    expect(board.get(2, 2)?.type).toBe(6);
    expect(board.get(0, 1)?.type).toBe(1);
    expect(board.get(1, 1)?.type).toBe(2);
    expect(board.get(2, 1)?.type).toBe(3);
    // Доска снова заполнена — `refill` отработал.
    expect(isFull(board)).toBe(true);
  });

  it('начисляет очки за группу длины 3', () => {
    const board = makeEmptyBoard(3, 1);
    applyLayout(board, [[5, 5, 5]]);
    const step = nextCascadeStep(board);
    expect(step!.resolved.scoreGained).toBe(30);
  });

  it('возвращает корректные moves для упавших тайлов', () => {
    const board = makeEmptyBoard(1, 4);
    applyLayout(board, [[7], [8], [0], [0]]);
    // Сначала ставим в нижнюю тройку три 2, чтобы было совпадение.
    applyLayout(board, [[7], [2], [2], [2]]);
    const step = nextCascadeStep(board);
    expect(step).not.toBeNull();
    // Все три нижних 2 удаляются, 7 падает в самый низ.
    expect(board.get(0, 3)?.type).toBe(7);
    // Сверху появляется новый тайл.
    expect(board.get(0, 0)).not.toBeNull();
    expect(step!.moves.length).toBeGreaterThan(0);
  });

  it('moveTarget: бустер спавнится на клетке хода, если она в паттерне', () => {
    const board = makeEmptyBoard(4, 2);
    applyLayout(board, [
      [2, 3, 4, 5],
      [1, 1, 1, 1],
    ]);
    nextCascadeStep(board, { moveTarget: { col: 3, row: 1 } });
    expect(board.get(3, 1)?.type).toBe(TILE_TYPE_LINE_COL);
  });
});

describe('cascade.runFullCascade', () => {
  it('останавливается за конечное число шагов даже на пустой доске', () => {
    const board = makeEmptyBoard(3, 3);
    applyLayout(board, [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
    ]);
    const steps = runFullCascade(board);
    expect(steps).toEqual([]);
  });

  it('одна стартовая линия рождает хотя бы один шаг', () => {
    const board = makeEmptyBoard(4, 4);
    applyLayout(board, [
      [1, 2, 3, 0],
      [4, 5, 0, 1],
      [0, 0, 0, 2],
      [2, 3, 4, 5],
    ]);
    const before = readLayout(board);
    const steps = runFullCascade(board);
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(isFull(board)).toBe(true);
    // Доска изменилась.
    expect(readLayout(board)).not.toEqual(before);
  });

  it('каскад очищает все вызванные совпадения (на выходе матчей нет)', () => {
    const board = makeEmptyBoard(5, 5);
    applyLayout(board, [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5, 1],
      [3, 4, 5, 1, 2],
      [4, 5, 1, 2, 3],
      [0, 0, 0, 2, 3],
    ]);
    runFullCascade(board);
    // После каскада нечего больше схлопывать.
    expect(nextCascadeStep(board)).toBeNull();
    expect(isFull(board)).toBe(true);
  });
});
