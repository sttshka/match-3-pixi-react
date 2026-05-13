import { create } from 'zustand';
import { DEFAULT_LEVEL } from '@core/constants';
export const useAppStore = create((set) => ({
    scene: 'boot',
    loaded: false,
    loadProgress: 0,
    score: 0,
    moves: DEFAULT_LEVEL.moves,
    target: DEFAULT_LEVEL.targetScore,
    setScene: (scene) => set({ scene }),
    setLoaded: (loaded) => set({ loaded }),
    setLoadProgress: (loadProgress) => set({ loadProgress }),
    addScore: (delta) => set((s) => {
        const score = s.score + delta;
        const nextScene = score >= s.target ? 'win' : s.scene;
        return { score, scene: nextScene };
    }),
    decrementMove: () => set((s) => {
        const moves = Math.max(0, s.moves - 1);
        const nextScene = moves === 0 && s.score < s.target ? 'gameOver' : s.scene;
        return { moves, scene: nextScene };
    }),
    reset: () => set({
        score: 0,
        moves: DEFAULT_LEVEL.moves,
        target: DEFAULT_LEVEL.targetScore,
        scene: 'game',
    }),
}));
