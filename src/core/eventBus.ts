import mitt from 'mitt';
import type { CascadeStep, ResolveResult, TilePosition } from './types';

// EventBus используется для слабой связности между слоями:
// игровая логика публикует события, вьюхи и звук подписываются.
export type GameEvents = {
  'board:ready': void;
  'tile:tap': TilePosition;
  'swap:start': { a: TilePosition; b: TilePosition };
  'swap:invalid': { a: TilePosition; b: TilePosition };
  'matches:found': ResolveResult;
  'cascade:step': CascadeStep;
  'score:changed': { score: number; delta: number };
  'moves:changed': { moves: number };
  'game:over': { reason: 'noMoves' | 'win' | 'lose'; score: number };
};

export const bus = mitt<GameEvents>();
