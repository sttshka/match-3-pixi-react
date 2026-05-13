import { useAppStore } from '@game/state/store';

export function HUD() {
  const score = useAppStore((s) => s.score);
  const moves = useAppStore((s) => s.moves);
  const target = useAppStore((s) => s.target);
  return (
    <div className="hud">
      <div className="panel">
        <small>Очки</small>
        <strong>{score}</strong>
      </div>
      <div className="panel" style={{ textAlign: 'center' }}>
        <small>Цель</small>
        <strong>{target}</strong>
      </div>
      <div className="panel" style={{ textAlign: 'right' }}>
        <small>Ходов</small>
        <strong>{moves}</strong>
      </div>
    </div>
  );
}
