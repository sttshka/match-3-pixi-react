import { useAppStore } from '@game/state/store';

export function GameOverModal({ won }: { won: boolean }) {
  const reset = useAppStore((s) => s.reset);
  const score = useAppStore((s) => s.score);
  return (
    <div className="modal">
      <div className="modal-card">
        <h2>{won ? 'Победа!' : 'Игра окончена'}</h2>
        <p>Ваш счёт: <strong>{score}</strong></p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn" onClick={() => reset()}>Сыграть ещё</button>
          <button
            className="btn secondary"
            onClick={() => useAppStore.getState().setScene('menu')}
          >
            В меню
          </button>
        </div>
      </div>
    </div>
  );
}
