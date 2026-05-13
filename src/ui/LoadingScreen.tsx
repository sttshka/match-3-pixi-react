import { useAppStore } from '@game/state/store';

export function LoadingScreen() {
  const progress = useAppStore((s) => s.loadProgress);
  return (
    <div className="loading">
      <div style={{ display: 'grid', gap: 14, placeItems: 'center' }}>
        <div style={{ fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7 }}>
          ЗАГРУЗКА
        </div>
        <div className="loading-bar">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
