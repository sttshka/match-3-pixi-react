import { useAppStore } from '@game/state/store';

export function MenuScene() {
  const reset = useAppStore((s) => s.reset);
  return (
    <div className="menu">
      <div className="menu-card">
        <h1>Match-3 Pixi v8</h1>
        <p className="menu-card-lead">
          Собирай три в ряд. Набери нужные очки до конца ходов.
        </p>
        <button type="button" className="btn menu-card-cta" onClick={() => reset()}>
          Начать игру
        </button>
      </div>
    </div>
  );
}
