import { useAppStore } from '@game/state/store';

export function MenuScene() {
  const reset = useAppStore((s) => s.reset);
  return (
    <div className="menu">
      <div className="menu-card">
        <h1>Match-3 Pixi v8</h1>
        <p>
          Шаблон проекта на Pixi v8, React и Matter.js.
          <br />
          Цель — набрать целевой счёт за выделенное число ходов.
        </p>
        <button className="btn" onClick={() => reset()}>
          Начать игру
        </button>
      </div>
    </div>
  );
}
