// Простой конечный автомат игры. Без внешних зависимостей.
// Состояния отражают этапы хода игрока:
//   idle      — ничего не происходит, доска ждёт ввод
//   input     — игрок начал тянуть тайл
//   swap      — выполняется анимация свопа
//   resolve   — проверка/откат свопа, поиск матчей
//   cascade   — каскад: удаление+гравитация+спавн+анимации
//   gameover  — финал

export type GameState = 'idle' | 'input' | 'swap' | 'resolve' | 'cascade' | 'gameover';

export interface GameMachine {
  state: GameState;
  transition(next: GameState): boolean;
  can(next: GameState): boolean;
  reset(): void;
}

// Разрешённые переходы. Намеренно жёсткие, чтобы ловить баги логики.
const TRANSITIONS: Record<GameState, GameState[]> = {
  idle: ['input', 'gameover'],
  input: ['swap', 'idle'],
  swap: ['resolve'],
  resolve: ['cascade', 'idle'],
  cascade: ['idle', 'gameover'],
  gameover: ['idle'],
};

export function createGameMachine(): GameMachine {
  let state: GameState = 'idle';
  return {
    get state() {
      return state;
    },
    can(next) {
      return TRANSITIONS[state].includes(next);
    },
    transition(next) {
      if (!this.can(next)) {
        if (typeof console !== 'undefined') {
          console.warn(`[gameMachine] invalid transition ${state} → ${next}`);
        }
        return false;
      }
      state = next;
      return true;
    },
    reset() {
      state = 'idle';
    },
  };
}
