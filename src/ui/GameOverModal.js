import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from '@game/state/store';
export function GameOverModal({ won }) {
    const reset = useAppStore((s) => s.reset);
    const score = useAppStore((s) => s.score);
    return (_jsx("div", { className: "modal", children: _jsxs("div", { className: "modal-card", children: [_jsx("h2", { children: won ? 'Победа!' : 'Игра окончена' }), _jsxs("p", { children: ["\u0412\u0430\u0448 \u0441\u0447\u0451\u0442: ", _jsx("strong", { children: score })] }), _jsxs("div", { style: { display: 'flex', gap: 10, justifyContent: 'center' }, children: [_jsx("button", { className: "btn", onClick: () => reset(), children: "\u0421\u044B\u0433\u0440\u0430\u0442\u044C \u0435\u0449\u0451" }), _jsx("button", { className: "btn secondary", onClick: () => useAppStore.getState().setScene('menu'), children: "\u0412 \u043C\u0435\u043D\u044E" })] })] }) }));
}
