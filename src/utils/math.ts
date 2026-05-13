export const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const isAdjacent = (
  a: { col: number; row: number },
  b: { col: number; row: number },
): boolean => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
