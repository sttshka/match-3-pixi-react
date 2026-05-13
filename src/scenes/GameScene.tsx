import { useEffect, useRef } from 'react';
import { useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { BoardController } from '@rendering/BoardController';
import { PhysicsWorld } from '@physics/PhysicsWorld';
import { useGameTick } from '@hooks/useTicker';
import { BOARD_COLS, BOARD_ROWS, TILE_SIZE } from '@core/constants';

// Императивная сцена: один pixiContainer, всё остальное собирается контроллером.
// React НЕ участвует в анимациях — это сознательное решение.
export function GameScene({ width, height }: { width: number; height: number }) {
  const containerRef = useRef<Container>(null);
  const controllerRef = useRef<BoardController | null>(null);
  const physicsRef = useRef<PhysicsWorld | null>(null);
  const { app } = useApplication();

  useEffect(() => {
    if (!containerRef.current) return;
    const controller = new BoardController(containerRef.current);
    controllerRef.current = controller;
    const physics = new PhysicsWorld({ gravityY: 1 });
    physicsRef.current = physics;
    return () => {
      controller.destroy();
      physics.destroy();
      controllerRef.current = null;
      physicsRef.current = null;
    };
  }, [app]);

  useGameTick(({ deltaMS }) => {
    physicsRef.current?.step(deltaMS);
  });

  // Подгоняем масштаб доски под доступную область.
  const boardWidth = BOARD_COLS * TILE_SIZE;
  const boardHeight = BOARD_ROWS * TILE_SIZE;
  const maxBoardScale = Math.min(
    (width - 80) / boardWidth,
    (height - 200) / boardHeight,
    1.2,
  );
  const scale = Math.max(0.4, maxBoardScale);
  const cx = (width - boardWidth * scale) / 2;
  const cy = (height - boardHeight * scale) / 2 + 24;

  return (
    <pixiContainer ref={containerRef} x={cx} y={cy} scale={scale} />
  );
}
