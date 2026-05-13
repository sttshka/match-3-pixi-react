// Простой конечный автомат игры. Без внешних зависимостей.
// Состояния отражают этапы хода игрока:
//   idle      — ничего не происходит, доска ждёт ввод
//   input     — игрок начал тянуть тайл
//   swap      — выполняется анимация свопа
//   resolve   — проверка/откат свопа, поиск матчей
//   cascade   — каскад: удаление+гравитация+спавн+анимации
//   gameover  — финал
// Разрешённые переходы. Намеренно жёсткие, чтобы ловить баги логики.
const TRANSITIONS = {
    idle: ['input', 'gameover'],
    input: ['swap', 'idle'],
    swap: ['resolve'],
    resolve: ['cascade', 'idle'],
    cascade: ['idle', 'gameover'],
    gameover: ['idle'],
};
export function createGameMachine() {
    let state = 'idle';
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
