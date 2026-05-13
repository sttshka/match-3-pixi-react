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

  return (
    <div className="app-shell">
      <Application
        width={width}
        height={height}
        antialias
        autoDensity
        resolution={Math.min(window.devicePixelRatio || 1, 2)}
        background={'#070b1a'}
      >
        {/* Игровая сцена живёт в Pixi-канвасе.
            На время загрузки/меню сцена не маунтится. */}
        {scene === 'game' && <GameScene width={width} height={height} />}
      </Application>

      {!loaded && <BootScene />}
      {!loaded && <LoadingScreen />}

      {scene === 'menu' && <MenuScene />}
      {scene === 'game' && <HUD />}
      {scene === 'gameOver' && <GameOverModal won={false} />}
      {scene === 'win' && <GameOverModal won={true} />}

      <div className="footer">PIXI v8 · React · @pixi/react · Matter.js</div>
    </div>
  );
}
