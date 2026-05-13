import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Application } from '@pixi/react';
import { useAppStore } from '@game/state/store';
import { useResize } from '@hooks/useResize';
import { BootScene } from '@scenes/BootScene';
import { MenuScene } from '@scenes/MenuScene';
import { GameScene } from '@scenes/GameScene';
import { LoadingScreen } from '@ui/LoadingScreen';
import { HUD } from '@ui/HUD';
import { GameOverModal } from '@ui/GameOverModal';
export function App() {
    const scene = useAppStore((s) => s.scene);
    const loaded = useAppStore((s) => s.loaded);
    const { width, height } = useResize();
    return (_jsxs("div", { className: "app-shell", children: [_jsx(Application, { width: width, height: height, antialias: true, autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), background: '#070b1a', children: scene === 'game' && _jsx(GameScene, { width: width, height: height }) }), !loaded && _jsx(BootScene, {}), !loaded && _jsx(LoadingScreen, {}), scene === 'menu' && _jsx(MenuScene, {}), scene === 'game' && _jsx(HUD, {}), scene === 'gameOver' && _jsx(GameOverModal, { won: false }), scene === 'win' && _jsx(GameOverModal, { won: true }), _jsx("div", { className: "footer", children: "PIXI v8 \u00B7 React \u00B7 @pixi/react \u00B7 Matter.js" })] }));
}
