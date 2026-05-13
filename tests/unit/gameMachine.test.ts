import { describe, expect, it, vi } from 'vitest';
import { createGameMachine } from '@game/state/gameMachine';

describe('gameMachine', () => {
  it('стартует в состоянии idle', () => {
    expect(createGameMachine().state).toBe('idle');
  });

  it('разрешает корректную цепочку хода: idle→input→swap→resolve→cascade→idle', () => {
    const m = createGameMachine();
    expect(m.transition('input')).toBe(true);
    expect(m.transition('swap')).toBe(true);
    expect(m.transition('resolve')).toBe(true);
    expect(m.transition('cascade')).toBe(true);
    expect(m.transition('idle')).toBe(true);
    expect(m.state).toBe('idle');
  });

  it('разрешает альтернативный путь resolve → idle (нет матча после свопа)', () => {
    const m = createGameMachine();
    m.transition('input');
    m.transition('swap');
    m.transition('resolve');
    expect(m.transition('idle')).toBe(true);
  });

  it('запрещает прыжок idle → swap минуя input', () => {
    const m = createGameMachine();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(m.transition('swap')).toBe(false);
    expect(m.state).toBe('idle');
    warn.mockRestore();
  });

  it('запрещает прыжок swap → cascade минуя resolve', () => {
    const m = createGameMachine();
    m.transition('input');
    m.transition('swap');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(m.transition('cascade')).toBe(false);
    warn.mockRestore();
  });

  it('reset() возвращает в idle из любого состояния', () => {
    const m = createGameMachine();
    m.transition('input');
    m.transition('swap');
    m.reset();
    expect(m.state).toBe('idle');
  });

  it('can() сообщает то же, что transition(), но без побочного эффекта', () => {
    const m = createGameMachine();
    expect(m.can('input')).toBe(true);
    expect(m.can('cascade')).toBe(false);
    expect(m.state).toBe('idle');
  });

  it('gameover достижим из idle и cascade', () => {
    const m1 = createGameMachine();
    expect(m1.transition('game-over')).toBe(true);

    const m2 = createGameMachine();
    m2.transition('input');
    m2.transition('swap');
    m2.transition('resolve');
    m2.transition('cascade');
    expect(m2.transition('game-over')).toBe(true);
  });
});
