import type { Graphics } from 'pixi.js';
import {
  isBombType,
  isColorBoosterType,
  isLineColType,
  isLineRowType,
  isPlaneType,
} from '@game/board/boosterTypes';

/**
 * Рисует бустер в стиле Homescapes: разные силуэты, чтобы сразу отличать тип на поле.
 * @returns true если тип — бустер и отрисовка выполнена.
 */
export function drawBoosterTile(g: Graphics, type: number, cellSize: number): boolean {
  if (
    !isBombType(type) &&
    !isLineRowType(type) &&
    !isLineColType(type) &&
    !isColorBoosterType(type) &&
    !isPlaneType(type)
  ) {
    return false;
  }

  const half = cellSize / 2;
  const pad = cellSize * 0.1;
  g.roundRect(-half + pad, -half + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.14)
    .fill({ color: 0x1c1530, alpha: 0.88 })
    .stroke({ color: 0xffffff, alpha: 0.14, width: 1.5 });

  if (isBombType(type)) {
    drawBombBooster(g, cellSize);
  } else if (isLineRowType(type)) {
    drawLineRocketHorizontal(g, cellSize);
  } else if (isLineColType(type)) {
    drawLineRocketVertical(g, cellSize);
  } else if (isPlaneType(type)) {
    drawPaperPlaneBooster(g, cellSize);
  } else if (isColorBoosterType(type)) {
    drawDiscoBallBooster(g, cellSize);
  }

  return true;
}

/** Бомба: сфера, жёлтая «лента», фитиль со «искрой». */
function drawBombBooster(g: Graphics, cellSize: number): void {
  const half = cellSize / 2;
  const r = half * 0.5;
  g.circle(0, 0, r)
    .fill({ color: 0x3d2666 })
    .stroke({ color: 0xa78bcc, alpha: 0.45, width: 2 });
  g.roundRect(-r * 0.9, -r * 0.14, r * 1.8, r * 0.28, 3).fill({ color: 0xffd447 });
  g.circle(-r * 0.32, -r * 0.32, r * 0.2).fill({ color: 0xffffff, alpha: 0.38 });
  g.moveTo(0, -r + 1)
    .lineTo(0, -r - half * 0.36)
    .stroke({ color: 0x4e342e, width: 4 });
  g.circle(0, -r - half * 0.36, half * 0.075).fill({ color: 0xff9f1a });
}

/** Ракета горизонтальная — чистит строку (Homescapes: вертикальный матч 4). */
function drawLineRocketHorizontal(g: Graphics, cellSize: number): void {
  const half = cellSize / 2;
  const bodyW = half * 1.05;
  const bodyH = half * 0.3;
  const cx = -bodyW * 0.22;
  g.roundRect(cx - bodyW * 0.42, -bodyH * 0.5, bodyW * 0.88, bodyH, bodyH * 0.5)
    .fill({ color: 0x6d4aae })
    .stroke({ color: 0xffffff, alpha: 0.28, width: 1.5 });
  const tipX = cx + bodyW * 0.48;
  g.moveTo(tipX, 0)
    .lineTo(tipX + half * 0.38, -bodyH * 0.95)
    .lineTo(tipX + half * 0.38, bodyH * 0.95)
    .closePath()
    .fill({ color: 0xffe066 })
    .stroke({ color: 0xffffff, alpha: 0.22, width: 1 });
  const tx = cx - bodyW * 0.42;
  g.moveTo(tx, -bodyH * 0.42)
    .lineTo(tx - half * 0.2, -half * 0.38)
    .lineTo(tx, -bodyH * 0.08)
    .closePath()
    .fill({ color: 0x4a2f7a });
  g.moveTo(tx, bodyH * 0.42)
    .lineTo(tx - half * 0.2, half * 0.38)
    .lineTo(tx, bodyH * 0.08)
    .closePath()
    .fill({ color: 0x4a2f7a });
}

/** Ракета вертикальная — чистит столбец (Homescapes: горизонтальный матч 4). */
function drawLineRocketVertical(g: Graphics, cellSize: number): void {
  const half = cellSize / 2;
  const bodyW = half * 0.3;
  const bodyH = half * 1.05;
  const cy = bodyH * 0.18;
  g.roundRect(-bodyW * 0.5, cy - bodyH * 0.48, bodyW, bodyH * 0.88, bodyW * 0.5)
    .fill({ color: 0x6d4aae })
    .stroke({ color: 0xffffff, alpha: 0.28, width: 1.5 });
  const tipY = cy - bodyH * 0.52;
  g.moveTo(0, tipY)
    .lineTo(-bodyW * 1.05, tipY - half * 0.36)
    .lineTo(bodyW * 1.05, tipY - half * 0.36)
    .closePath()
    .fill({ color: 0xffe066 })
    .stroke({ color: 0xffffff, alpha: 0.22, width: 1 });
  const by = cy + bodyH * 0.38;
  g.moveTo(-bodyW * 0.42, by)
    .lineTo(-half * 0.38, by + half * 0.2)
    .lineTo(-bodyW * 0.08, by)
    .closePath()
    .fill({ color: 0x4a2f7a });
  g.moveTo(bodyW * 0.42, by)
    .lineTo(half * 0.38, by + half * 0.2)
    .lineTo(bodyW * 0.08, by)
    .closePath()
    .fill({ color: 0x4a2f7a });
}

/** Самолётик из квадрата 2×2: сложенный бумажный самолёт, фиолет + жёлтый. */
function drawPaperPlaneBooster(g: Graphics, cellSize: number): void {
  const h = cellSize * 0.34;
  const w = cellSize * 0.36;
  g.moveTo(0, -h)
    .lineTo(w * 1.05, h * 0.9)
    .lineTo(w * 0.12, h * 0.12)
    .closePath()
    .fill({ color: 0x6c5ce7 })
    .stroke({ color: 0xffffff, alpha: 0.35, width: 1.5 });
  g.moveTo(0, -h)
    .lineTo(-w, h * 0.82)
    .lineTo(0, h * 0.1)
    .closePath()
    .fill({ color: 0xffe066 })
    .stroke({ color: 0xffffff, alpha: 0.25, width: 1 });
  g.moveTo(0, -h).lineTo(0, h * 0.22).stroke({ color: 0x2f1b5c, alpha: 0.45, width: 2 });
}

/** Линия из 5 — «диско»: шар с разноцветными гранями. */
function drawDiscoBallBooster(g: Graphics, cellSize: number): void {
  const half = cellSize / 2;
  const r = half * 0.48;
  g.circle(0, 0, r)
    .fill({ color: 0x2f3640 })
    .stroke({ color: 0xffffff, alpha: 0.45, width: 2 });
  const facets = [
    0xe74c3c, 0x2ecc71, 0x3498db, 0xf1c40f, 0x9b59b6, 0xe67e22, 0x1abc9c, 0xff6b9d,
  ] as const;
  const sq = r * 0.2;
  const pts: [number, number][] = [
    [-r * 0.42, -r * 0.38],
    [0, -r * 0.48],
    [r * 0.42, -r * 0.38],
    [-r * 0.52, 0],
    [0, 0],
    [r * 0.52, 0],
    [-r * 0.38, r * 0.4],
    [0, r * 0.46],
    [r * 0.38, r * 0.4],
  ];
  let i = 0;
  for (const [px, py] of pts) {
    g.roundRect(px - sq * 0.5, py - sq * 0.5, sq, sq, 2).fill({ color: facets[i % facets.length]! });
    i++;
  }
  g.circle(-r * 0.28, -r * 0.32, r * 0.11).fill({ color: 0xffffff, alpha: 0.75 });
}
