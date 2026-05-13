export const clamp = (v, min, max) => v < min ? min : v > max ? max : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const isAdjacent = (a, b) => Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
