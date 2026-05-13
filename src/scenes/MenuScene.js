import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from '@game/state/store';
export function MenuScene() {
    const reset = useAppStore((s) => s.reset);
    return (_jsx("div", { className: "menu", children: _jsxs("div", { className: "menu-card", children: [_jsx("h1", { children: "Match-3 Pixi v8" }), _jsxs("p", { children: ["\u0428\u0430\u0431\u043B\u043E\u043D \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u043D\u0430 Pixi v8, React \u0438 Matter.js.", _jsx("br", {}), "\u0426\u0435\u043B\u044C \u2014 \u043D\u0430\u0431\u0440\u0430\u0442\u044C \u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0441\u0447\u0451\u0442 \u0437\u0430 \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u0445\u043E\u0434\u043E\u0432."] }), _jsx("button", { className: "btn", onClick: () => reset(), children: "\u041D\u0430\u0447\u0430\u0442\u044C \u0438\u0433\u0440\u0443" })] }) }));
}
