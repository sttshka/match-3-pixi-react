import {
  TILE_TYPE_BOMB,
  TILE_TYPE_COLOR,
  TILE_TYPE_LINE_COL,
  TILE_TYPE_LINE_ROW,
  TILE_TYPES,
} from '@core/constants';

export function isNormalTileType(type: number): boolean {
  return type >= 0 && type < TILE_TYPES;
}

export function isBombType(type: number): boolean {
  return type === TILE_TYPE_BOMB;
}

export function isLineRowType(type: number): boolean {
  return type === TILE_TYPE_LINE_ROW;
}

export function isLineColType(type: number): boolean {
  return type === TILE_TYPE_LINE_COL;
}

export function isLineBoosterType(type: number): boolean {
  return isLineRowType(type) || isLineColType(type);
}

export function isColorBoosterType(type: number): boolean {
  return type === TILE_TYPE_COLOR;
}

export function isSpecialTileType(type: number): boolean {
  return !isNormalTileType(type);
}
