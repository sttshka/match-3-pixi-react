import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from '@game/state/store';
export function HUD() {
    const score = useAppStore((s) => s.score);
    const moves = useAppStore((s) => s.moves);
    const target = useAppStore((s) => s.target);
    return (_jsxs("div", { className: "hud", children: [_jsxs("div", { className: "panel", children: [_jsx("small", { children: "\u041E\u0447\u043A\u0438" }), _jsx("strong", { children: score })] }), _jsxs("div", { className: "panel", style: { textAlign: 'center' }, children: [_jsx("small", { children: "\u0426\u0435\u043B\u044C" }), _jsx("strong", { children: target })] }), _jsxs("div", { className: "panel", style: { textAlign: 'right' }, children: [_jsx("small", { children: "\u0425\u043E\u0434\u043E\u0432" }), _jsx("strong", { children: moves })] })] }));
}
