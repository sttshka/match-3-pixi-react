import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { Board } from '@game/board/Board';
import { applyBoosterClearAndGravity, nextCascadeStep } from '@game/board/cascade';
import { getBoosterSwapClear, swapIsHorizontal } from '@game/board/boosterActivation';
import {
  isBombType,
  isColorBoosterType,
  isLineColType,
  isLineRowType,
  isPlaneType,
} from '@game/board/boosterTypes';
import { collectMatchGroups } from '@game/board/matchFinder';
import { createGameMachine } from '@game/state/gameMachine';
import { CommandQueue } from '@game/commands/CommandQueue';
import { ANIM, BOARD_COLS, BOARD_ROWS, TILE_COLORS, TILE_SIZE } from '@core/constants';
import { bus } from '@core/eventBus';
import { isAdjacent } from '@utils/math';
import { tweenAll, tweenTo } from '@utils/tween';
import type { CascadeStep, TileModel, TilePosition } from '@core/types';
import { useAppStore } from '@game/state/store';
import { type IHitArea } from 'pixi.js';

// BoardController владеет визуальной частью доски: создаёт Pixi-объекты,
// обрабатывает ввод, запускает анимации и применяет результаты игровой
// логики (Board / matchFinder / cascade). React в этом слое не участвует
// — это сознательный выбор: реконсиляция React не вмешивается в анимации.

interface TileSprite {
  id: number;
  view: Graphics;
}

export class BoardController {
  private readonly board: Board;
  private machine = createGameMachine();
  private queue = new CommandQueue();

  private root: Container;
  private gridLayer = new Container();
  private tilesLayer = new Container();
  private overlayLayer = new Container();
  private sprites = new Map<number, TileSprite>();

  private readonly cellSize: number;
  private readonly boardWidth: number;
  private readonly boardHeight: number;

  private selected: TilePosition | null = null;
  private destroyed = false;

  constructor(root: Container, opts?: { cellSize?: number }) {
    this.root = root;
    this.cellSize = opts?.cellSize ?? TILE_SIZE;
    this.boardWidth = BOARD_COLS * this.cellSize;
    this.boardHeight = BOARD_ROWS * this.cellSize;

    this.gridLayer.label = 'grid';
    this.tilesLayer.label = 'tiles';
    this.overlayLayer.label = 'overlay';
    this.root.addChild(this.gridLayer, this.tilesLayer, this.overlayLayer);

    this.root.eventMode = 'static';
    this.root.hitArea = { contains: () => true } as IHitArea;
    this.root.on('pointerdown', this.onPointerDown);

    this.board = new Board();
    this.board.generateInitial();
    this.drawGrid();
    this.spawnInitialSprites();
    bus.emit('board:ready');
  }

  destroy(): void {
    this.destroyed = true;
    this.root.off('pointerdown', this.onPointerDown);
    this.queue.clear();
    this.root.removeChildren();
    this.sprites.clear();
  }

  // --- РЕНДЕР ---

  private drawGrid(): void {
    const g = new Graphics();
    g.rect(0, 0, this.boardWidth, this.boardHeight)
      .fill({ color: 0x0d1330, alpha: 0.6 })
      .stroke({ color: 0xffffff, alpha: 0.06, width: 1 });
    for (let c = 1; c < BOARD_COLS; c++) {
      g.moveTo(c * this.cellSize, 0)
        .lineTo(c * this.cellSize, this.boardHeight)
        .stroke({ color: 0xffffff, alpha: 0.04, width: 1 });
    }
    for (let r = 1; r < BOARD_ROWS; r++) {
      g.moveTo(0, r * this.cellSize)
        .lineTo(this.boardWidth, r * this.cellSize)
        .stroke({ color: 0xffffff, alpha: 0.04, width: 1 });
    }
    this.gridLayer.addChild(g);
  }

  private spawnInitialSprites(): void {
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const tile = this.board.get(c, r);
        if (!tile) continue;
        const view = this.createTileGraphics(tile.type);
        const { x, y } = this.cellToPixel(c, r);
        view.position.set(x, y);
        view.alpha = 0;
        this.tilesLayer.addChild(view);
        this.sprites.set(tile.id, { id: tile.id, view });
        void tweenTo(view, { alpha: 1, duration: ANIM.spawn, delay: (r + c) * 0.012 });
      }
    }
  }

  private createTileGraphics(type: number): Graphics {
    const g = new Graphics();
    const half = this.cellSize / 2;
    const pad = this.cellSize * 0.12;
    const color = TILE_COLORS[type % TILE_COLORS.length]!;

    if (isBombType(type)) {
      g.circle(0, 0, half - pad * 0.6)
        .fill({ color })
        .stroke({ color: 0xffffff, alpha: 0.55, width: 3 });
      g.circle(-half * 0.35, -half * 0.35, this.cellSize * 0.1).fill({ color: 0xffffee, alpha: 0.95 });
    } else if (isLineRowType(type)) {
      g.roundRect(-half + pad, -half + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, 12)
        .fill({ color })
        .stroke({ color: 0xffffff, alpha: 0.22, width: 2 });
      g.roundRect(-half + pad * 2, -this.cellSize * 0.08, this.cellSize - pad * 4, this.cellSize * 0.16, 4)
        .fill({ color: 0xffffff, alpha: 0.85 });
    } else if (isLineColType(type)) {
      g.roundRect(-half + pad, -half + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, 12)
        .fill({ color })
        .stroke({ color: 0xffffff, alpha: 0.22, width: 2 });
      g.roundRect(-this.cellSize * 0.08, -half + pad * 2, this.cellSize * 0.16, this.cellSize - pad * 4, 4)
        .fill({ color: 0xffffff, alpha: 0.85 });
    } else if (isPlaneType(type)) {
      g.roundRect(-half + pad, -half + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, 12)
        .fill({ color })
        .stroke({ color: 0xffffff, alpha: 0.25, width: 2 });
      g.moveTo(-half * 0.55, 0)
        .lineTo(0, -half * 0.35)
        .lineTo(half * 0.55, 0)
        .stroke({ color: 0xffffff, alpha: 0.85, width: 2.5 });
      g.circle(half * 0.25, half * 0.15, this.cellSize * 0.12).fill({ color: 0xffffff, alpha: 0.35 });
    } else if (isColorBoosterType(type)) {
      g.circle(0, 0, half - pad * 0.8)
        .fill({ color: 0x2f3542 })
        .stroke({ color, alpha: 0.9, width: 5 });
      g.circle(0, 0, half * 0.35).fill({ color, alpha: 0.5 });
    } else {
      g.roundRect(-half + pad, -half + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, 12)
        .fill({ color })
        .stroke({ color: 0xffffff, alpha: 0.18, width: 2 });
      g.circle(-half / 2 + 4, -half / 2 + 4, this.cellSize * 0.12).fill({
        color: 0xffffff,
        alpha: 0.25,
      });
    }

    g.eventMode = 'static';
    g.cursor = 'pointer';
    return g;
  }

  private cellToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.cellSize + this.cellSize / 2,
      y: row * this.cellSize + this.cellSize / 2,
    };
  }

  private pixelToCell(localX: number, localY: number): TilePosition | null {
    const col = Math.floor(localX / this.cellSize);
    const row = Math.floor(localY / this.cellSize);
    if (col < 0 || row < 0 || col >= BOARD_COLS || row >= BOARD_ROWS) return null;
    return { col, row };
  }

  // --- INPUT ---

  private onPointerDown = (e: FederatedPointerEvent): void => {
    if (this.queue.isBusy) return;
    const local = this.tilesLayer.toLocal(e.global);
    const pos = this.pixelToCell(local.x, local.y);
    if (!pos) return;
    bus.emit('tile:tap', pos);

    if (!this.selected) {
      this.selected = pos;
      this.highlight(pos, true);
      return;
    }
    if (this.selected.col === pos.col && this.selected.row === pos.row) {
      this.highlight(pos, false);
      this.selected = null;
      return;
    }
    if (isAdjacent(this.selected, pos)) {
      const a = this.selected;
      const b = pos;
      this.highlight(a, false);
      this.selected = null;
      this.attemptSwap(a, b);
      return;
    }
    this.highlight(this.selected, false);
    this.selected = pos;
    this.highlight(pos, true);
  };

  private highlight(pos: TilePosition, on: boolean): void {
    const tile = this.board.get(pos.col, pos.row);
    if (!tile) return;
    const s = this.sprites.get(tile.id);
    if (!s) return;
    void tweenTo(s.view, { scale: on ? 1.08 : 1, duration: 0.12 });
  }

  // --- ИГРОВЫЕ ХОДЫ ---

  private attemptSwap(a: TilePosition, b: TilePosition): void {
    if (!this.machine.transition('input')) return;
    this.machine.transition('swap');

    this.queue.push(async () => {
      bus.emit('swap:start', { a, b });
      this.board.swap(a, b);
      await this.animateSwap(a, b);

      this.machine.transition('resolve');
      const boosterClear = getBoosterSwapClear(a, b, this.board, swapIsHorizontal(a, b));
      const matches = collectMatchGroups(this.board);
      if (boosterClear === null && matches.length === 0) {
        bus.emit('swap:invalid', { a, b });
        this.board.swap(a, b);
        await this.animateSwap(a, b);
        this.machine.transition('idle');
        return;
      }

      useAppStore.getState().decrementMove();
      this.machine.transition('cascade');
      if (boosterClear !== null) {
        const boosterStep = applyBoosterClearAndGravity(this.board, boosterClear);
        await this.runCascadeStep(boosterStep);
      }
      await this.resolveCascades(b);
      this.machine.transition('idle');
    });
  }

  private async animateSwap(a: TilePosition, b: TilePosition): Promise<void> {
    // На этом этапе модель уже свапнута, поэтому "то, что лежит в a"
    // — это спрайт, который раньше лежал в b. Берём по id.
    const ta = this.board.get(a.col, a.row);
    const tb = this.board.get(b.col, b.row);
    if (!ta || !tb) return;
    const sa = this.sprites.get(ta.id)?.view;
    const sb = this.sprites.get(tb.id)?.view;
    if (!sa || !sb) return;
    const pa = this.cellToPixel(a.col, a.row);
    const pb = this.cellToPixel(b.col, b.row);
    await tweenAll([
      { target: sa, props: { x: pa.x, y: pa.y, duration: ANIM.swap, ease: 'power2.inOut' } },
      { target: sb, props: { x: pb.x, y: pb.y, duration: ANIM.swap, ease: 'power2.inOut' } },
    ]);
  }

  private async resolveCascades(moveTargetForFirstStep?: TilePosition): Promise<void> {
    let safety = 24;
    let first = true;
    while (safety-- > 0) {
      const step = nextCascadeStep(
        this.board,
        first && moveTargetForFirstStep ? { moveTarget: moveTargetForFirstStep } : undefined,
      );
      first = false;
      if (!step) break;
      if (this.destroyed) return;
      await this.runCascadeStep(step);
    }
  }

  private async runCascadeStep(step: CascadeStep): Promise<void> {
    useAppStore.getState().addScore(step.resolved.scoreGained);
    bus.emit('matches:found', step.resolved);
    bus.emit('cascade:step', step);

    await this.animatePops(step.resolved.removed);
    this.refreshTilesAtBoosterUpgrades(step.resolved.upgradedToBooster);

    await this.animateMoves(step.moves);
    await this.animateSpawned(step.spawned);
  }

  private refreshTilesAtBoosterUpgrades(upgrades?: Array<{ id: number; type: number }>): void {
    if (!upgrades?.length) return;
    for (const u of upgrades) {
      let tile: TileModel | null = null;
      for (let r = 0; r < this.board.rows; r++) {
        for (let c = 0; c < this.board.cols; c++) {
          const t = this.board.get(c, r);
          if (t?.id === u.id) {
            tile = t;
            break;
          }
        }
        if (tile) break;
      }
      if (!tile) continue;
      const entry = this.sprites.get(tile.id);
      if (!entry) continue;
      const old = entry.view;
      old.parent?.removeChild(old);
      old.destroy();
      const view = this.createTileGraphics(tile.type);
      const p = this.cellToPixel(tile.col, tile.row);
      view.position.set(p.x, p.y);
      this.tilesLayer.addChild(view);
      this.sprites.set(tile.id, { id: tile.id, view });
    }
  }

  private async animatePops(positions: TilePosition[]): Promise<void> {
    const tweens = positions
      .map(({ col, row }) => {
        // К этому моменту матчи уже удалены из модели — поэтому ищем по id из sprites.
        // Сопоставляем по координатам через бывшие позиции — для попа берём ближайшие.
        const sprite = this.findSpriteAt(col, row);
        return sprite;
      })
      .filter((s): s is TileSprite => !!s)
      .map((s) => ({
        target: s.view,
        props: { alpha: 0, scale: 1.35, duration: ANIM.pop, ease: 'back.in(1.6)' },
      }));

    await tweenAll(tweens);
    for (const t of tweens) {
      const g = t.target as Graphics;
      g.parent?.removeChild(g);
      g.destroy();
    }
    for (const [id, s] of this.sprites) {
      if (!s.view.parent) this.sprites.delete(id);
    }
  }

  private findSpriteAt(col: number, row: number): TileSprite | null {
    const { x, y } = this.cellToPixel(col, row);
    for (const s of this.sprites.values()) {
      if (Math.abs(s.view.x - x) < 1 && Math.abs(s.view.y - y) < 1) return s;
    }
    return null;
  }

  private async animateMoves(
    moves: Array<{ id: number; from: TilePosition; to: TilePosition }>,
  ): Promise<void> {
    const tweens = moves.flatMap(({ id, to }) => {
      const s = this.sprites.get(id);
      if (!s) return [];
      const p = this.cellToPixel(to.col, to.row);
      return [
        {
          target: s.view,
          props: { x: p.x, y: p.y, duration: ANIM.collapse, ease: 'power1.in' },
        },
      ];
    });
    await tweenAll(tweens);
  }

  private async animateSpawned(spawned: TileModel[]): Promise<void> {
    const tweens = spawned.map((tile) => {
      const view = this.createTileGraphics(tile.type);
      const target = this.cellToPixel(tile.col, tile.row);
      view.position.set(target.x, -this.cellSize);
      view.alpha = 1;
      this.tilesLayer.addChild(view);
      this.sprites.set(tile.id, { id: tile.id, view });
      return {
        target: view,
        props: { y: target.y, duration: ANIM.spawn, ease: 'bounce.out' },
      };
    });
    await tweenAll(tweens);
  }

  // Полезно для авто-ресайза снаружи.
  getSize(): { width: number; height: number } {
    return { width: this.boardWidth, height: this.boardHeight };
  }
}
