import { create } from 'zustand';
import { DEFAULT_LEVEL } from '@core/constants';

// Глобальный стейт UI. Игровая логика хранится в инстансе Board и автомата,
// а сюда попадают только "проекции" для рендера HUD/модалок/меню.
export type AppScene = 'boot' | 'menu' | 'game' | 'gameOver' | 'win';

/** `zen` — без лимита ходов и цели по очкам; `goals` — классический уровень. */
export type GameMode = 'zen' | 'goals';

interface AppState {
  scene: AppScene;
  loaded: boolean;
  loadProgress: number;
  score: number;
  moves: number;
  target: number;
  gameMode: GameMode;

  setScene: (s: AppScene) => void;
  setLoaded: (v: boolean) => void;
  setLoadProgress: (v: number) => void;
  addScore: (delta: number) => void;
  decrementMove: () => void;
  startGame: (mode: GameMode) => void;
  reset: () => void;
}

function boardStateForMode(mode: GameMode): Pick<AppState, 'score' | 'moves' | 'target'> {
  return {
    score: 0,
    moves: mode === 'goals' ? DEFAULT_LEVEL.moves : 0,
    target: DEFAULT_LEVEL.targetScore,
  };
}

export const useAppStore = create<AppState>((set) => ({
  scene: 'boot',
  loaded: false,
  loadProgress: 0,
  score: 0,
  moves: DEFAULT_LEVEL.moves,
  target: DEFAULT_LEVEL.targetScore,
  gameMode: 'goals',

  setScene: (scene) => set({ scene }),
  setLoaded: (loaded) => set({ loaded }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  addScore: (delta) =>
    set((s) => {
      const score = s.score + delta;
      const nextScene: AppScene =
        s.gameMode === 'goals' && score >= s.target ? 'win' : s.scene;
      return { score, scene: nextScene };
    }),
  decrementMove: () =>
    set((s) => {
      if (s.gameMode === 'zen') return {};
      const moves = Math.max(0, s.moves - 1);
      const nextScene: AppScene = moves === 0 && s.score < s.target ? 'gameOver' : s.scene;
      return { moves, scene: nextScene };
    }),
  startGame: (gameMode) =>
    set({
      gameMode,
      scene: 'game',
      ...boardStateForMode(gameMode),
    }),
  reset: () =>
    set((s) => ({
      scene: 'game',
      ...boardStateForMode(s.gameMode),
    })),
}));
