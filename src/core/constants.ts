// Базовые константы игры. Меняем тут, чтобы быстро балансировать прототип.

export const BOARD_COLS = 8;
export const BOARD_ROWS = 8;

// Сколько типов тайлов в игре (цвета).
export const TILE_TYPES = 6;

// Спец-тайлы (бустеры). Не участвуют в обычных линиях матч-3 и не спавнятся
// из refill — появляются из комбо или остаются на поле после каскада.
export const TILE_TYPE_BOMB = TILE_TYPES;
export const TILE_TYPE_LINE_ROW = TILE_TYPES + 1;
export const TILE_TYPE_LINE_COL = TILE_TYPES + 2;
export const TILE_TYPE_COLOR = TILE_TYPES + 3;
/** «Ракета» / самолётик: квадрат 2×2 одного цвета. */
export const TILE_TYPE_PLANE = TILE_TYPES + 4;

// Размер ячейки в пикселях в "идеальном" разрешении.
// Физический размер тайла на экране масштабируется в BoardView.
export const TILE_SIZE = 72;

// Скорость анимаций (сек) — единые константы упрощают тюнинг.
export const ANIM = {
  swap: 0.22,
  invalidSwap: 0.18,
  collapse: 0.32,
  spawn: 0.32,
  pop: 0.25,
} as const;

// Очки за совпадение длиной N (N=3,4,5...).
export const SCORE_BY_LENGTH: Record<number, number> = {
  3: 30,
  4: 60,
  5: 120,
  6: 200,
};

// Цели уровня по умолчанию.
export const DEFAULT_LEVEL = {
  moves: 25,
  targetScore: 1200,
} as const;

// Палитра цветов тайлов (HEX → number).
export const TILE_COLORS: number[] = [
  0xff6b6b, // красный
  0xfeca57, // жёлтый
  0x48dbfb, // голубой
  0x1dd1a1, // зелёный
  0x9b59ff, // фиолетовый
  0xff9ff3, // розовый
  0xffa502, // бомба (оранжевый)
  0x54a0ff, // линия по строке
  0x5f27cd, // линия по столбцу
  0x576574, // цветной бустер
  0xc8d6e5, // ракета / самолётик
];
