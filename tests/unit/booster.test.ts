import { describe, expect, it } from 'vitest';
import { nextCascadeStep } from '@game/board/cascade';
import { getBoosterSwapClear } from '@game/board/boosterActivation';
import { planBoosterSurvivorsFromMatches } from '@game/board/boosterFromMatch';
import {
  TILE_TYPE_BOMB,
  TILE_TYPE_COLOR,
  TILE_TYPE_LINE_COL,
  TILE_TYPE_LINE_ROW,
} from '@core/constants';
import { applyLayout, makeEmptyBoard } from './helpers';

describe('planBoosterSurvivorsFromMatches', () => {
  it('линия из 3 — только удаление', () => {
    const plan = planBoosterSurvivorsFromMatches([
      {
        tiles: [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
        ],
        length: 3,
        kind: 'row',
      },
    ]);
    expect(plan.upgrades).toHaveLength(0);
    expect(plan.remove).toHaveLength(3);
  });

  it('вертикаль из 4 — полосатый по столбцу', () => {
    const plan = planBoosterSurvivorsFromMatches([
      {
        tiles: [
          { col: 0, row: 0 },
          { col: 0, row: 1 },
          { col: 0, row: 2 },
          { col: 0, row: 3 },
        ],
        length: 4,
        kind: 'col',
      },
    ]);
    expect(plan.upgrades).toEqual([{ col: 0, row: 1, type: TILE_TYPE_LINE_COL }]);
  });

  it('линия из 4 — один полосатый по строке', () => {
    const plan = planBoosterSurvivorsFromMatches([
      {
        tiles: [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
          { col: 3, row: 0 },
        ],
        length: 4,
        kind: 'row',
      },
    ]);
    expect(plan.upgrades).toEqual([{ col: 1, row: 0, type: TILE_TYPE_LINE_ROW }]);
    expect(plan.remove).toHaveLength(3);
  });

  it('линия из 5 — цветной бустер в центре', () => {
    const plan = planBoosterSurvivorsFromMatches([
      {
        tiles: [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
          { col: 3, row: 0 },
          { col: 4, row: 0 },
        ],
        length: 5,
        kind: 'row',
      },
    ]);
    expect(plan.upgrades).toEqual([{ col: 2, row: 0, type: TILE_TYPE_COLOR }]);
    expect(plan.remove).toHaveLength(4);
  });

  it('крест — бомба в «центре»', () => {
    const plan = planBoosterSurvivorsFromMatches([
      {
        tiles: [
          { col: 2, row: 1 },
          { col: 2, row: 2 },
          { col: 2, row: 3 },
          { col: 1, row: 2 },
          { col: 3, row: 2 },
        ],
        length: 5,
        kind: 'cross',
      },
    ]);
    expect(plan.upgrades).toEqual([{ col: 2, row: 2, type: TILE_TYPE_BOMB }]);
    expect(plan.remove).toHaveLength(4);
  });
});

describe('nextCascadeStep + бустеры', () => {
  it('после линии из 4 на доске остаётся полосатый', () => {
    const board = makeEmptyBoard(4, 2);
    applyLayout(board, [
      [2, 3, 4, 5],
      [1, 1, 1, 1],
    ]);
    nextCascadeStep(board);
    let found = false;
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (board.get(c, r)?.type === TILE_TYPE_LINE_ROW) found = true;
      }
    }
    expect(found).toBe(true);
  });
});

describe('getBoosterSwapClear', () => {
  it('бомба + сосед: область 3×3 вокруг клетки бомбы после свопа', () => {
    const board = makeEmptyBoard(5, 3);
    applyLayout(board, [
      [9, 9, 9, 9, 9],
      [9, TILE_TYPE_BOMB, 2, 9, 9],
      [9, 9, 9, 9, 9],
    ]);
    board.swap({ col: 1, row: 1 }, { col: 2, row: 1 });
    const cleared = getBoosterSwapClear({ col: 1, row: 1 }, { col: 2, row: 1 }, board)!;
    expect(cleared.length).toBe(9);
  });

  it('цветной + обычный: все тайлы этого цвета', () => {
    const board = makeEmptyBoard(3, 2);
    applyLayout(board, [
      [0, 1, TILE_TYPE_COLOR],
      [0, 2, 2],
    ]);
    board.swap({ col: 2, row: 0 }, { col: 0, row: 0 });
    const cleared = getBoosterSwapClear({ col: 2, row: 0 }, { col: 0, row: 0 }, board)!;
    const keys = new Set(cleared.map((p) => `${p.col}:${p.row}`));
    expect(keys.size).toBe(cleared.length);
    expect(cleared.length).toBeGreaterThanOrEqual(2);
  });

  it('полоса по столбцу очищает столбец', () => {
    const board = makeEmptyBoard(2, 4);
    applyLayout(board, [
      [3, 4],
      [TILE_TYPE_LINE_COL, 5],
      [6, 7],
      [8, 9],
    ]);
    board.swap({ col: 0, row: 0 }, { col: 0, row: 1 });
    const cleared = getBoosterSwapClear({ col: 0, row: 0 }, { col: 0, row: 1 }, board)!;
    expect(cleared.map((p) => p.col).every((c) => c === 0)).toBe(true);
    expect(cleared.length).toBe(4);
  });
});
