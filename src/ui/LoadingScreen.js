import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppStore } from '@game/state/store';
export function LoadingScreen() {
    const progress = useAppStore((s) => s.loadProgress);
    return (_jsx("div", { className: "loading", children: _jsxs("div", { style: { display: 'grid', gap: 14, placeItems: 'center' }, children: [_jsx("div", { style: { fontWeight: 700, letterSpacing: '0.08em', opacity: 0.7 }, children: "\u0417\u0410\u0413\u0420\u0423\u0417\u041A\u0410" }), _jsx("div", { className: "loading-bar", children: _jsx("div", { style: { width: `${Math.round(progress * 100)}%` } }) })] }) }));
}
