import { useAppStore } from '@game/state/store';

export function MenuScene() {
  const startGame = useAppStore((s) => s.startGame);
  return (
    <div className="menu">
      <div className="menu-card">
        <h1>Match-3 Pixi v8</h1>
        <p className="menu-card-lead">
          Собирай три в ряд. Выбери режим: спокойная игра без ограничений или уровень с целью по
          очкам и лимитом ходов.
        </p>
        <div className="menu-card-actions">
          <button type="button" className="btn menu-card-cta" onClick={() => startGame('zen')}>
            Дзен
          </button>
          <button type="button" className="btn menu-card-cta secondary" onClick={() => startGame('goals')}>
            С целью
          </button>
        </div>
      </div>
    </div>
  );
}
