import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { Board } from '@game/board/Board';
import {
  applyBoosterClearAndGravity,
  applyRainbowDuoClearAndGravity,
  nextCascadeStep,
} from '@game/board/cascade';
import { getBoosterSwapClear, getBoosterTapClear, swapIsHorizontal } from '@game/board/boosterActivation';
import { isColorBoosterType, isTapActivatedBoosterType } from '@game/board/boosterTypes';
import { drawBoosterTile } from '@rendering/boosterGraphics';
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

  /** Порог (px): меньше — «тап» (активация бустера). */
  private readonly tapBoostThresholdPx = 14;
  /** Минимальная длина свайпа в CSS px. */
  private readonly swipeMinPx = 26;
  /** Доминантная ось: |dx| должен превосходить |dy| не меньше чем в ratio раз (и наоборот). */
  private readonly swipeAxisRatio = 1.2;

  private gestureFrom: TilePosition | null = null;
  private gesturePointerId: number | null = null;
  private gestureStartClientX = 0;
  private gestureStartClientY = 0;
  private gestureMaxDistance = 0;
  private gesturePressedSprite: Graphics | null = null;
  private gestureSurface: HTMLElement | null = null;
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
    this.tilesLayer.sortableChildren = true;

    this.board = new Board();
    this.board.generateInitial();
    this.drawGrid();
    this.spawnInitialSprites();
    bus.emit('board:ready');
  }

  destroy(): void {
    this.destroyed = true;
    this.cancelActiveGesture();
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

    if (drawBoosterTile(g, type, this.cellSize)) {
      g.eventMode = 'static';
      g.cursor = 'pointer';
      return g;
    }

    g.roundRect(-half + pad, -half + pad, this.cellSize - pad * 2, this.cellSize - pad * 2, 12)
      .fill({ color })
      .stroke({ color: 0xffffff, alpha: 0.18, width: 2 });
    g.circle(-half / 2 + 4, -half / 2 + 4, this.cellSize * 0.12).fill({
      color: 0xffffff,
      alpha: 0.25,
    });

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

  private findCanvasSurface(start: EventTarget | null): HTMLCanvasElement | null {
    let n: Node | null = start as Node | null;
    while (n) {
      if (n instanceof HTMLCanvasElement) return n;
      if (n instanceof HTMLElement) n = n.parentElement;
      else n = n.parentNode;
    }
    return null;
  }

  private cancelActiveGesture(): void {
    this.detachGestureSurfaceListeners();
    if (this.gestureFrom !== null) {
      const from = this.gestureFrom;
      this.gestureFrom = null;
      this.gesturePointerId = null;
      if (this.gesturePressedSprite) {
        const p = this.cellToPixel(from.col, from.row);
        this.gesturePressedSprite.position.set(p.x, p.y);
        this.gesturePressedSprite.scale.set(1);
        this.gesturePressedSprite.zIndex = 0;
        this.gesturePressedSprite = null;
      }
    }
    this.gestureSurface = null;
  }

  /** Соседняя клетка по направлению свайпа (экранные координаты, ось Y вниз). */
  private neighborFromSwipe(
    from: TilePosition,
    dxClient: number,
    dyClient: number,
  ): TilePosition | null {
    const adx = Math.abs(dxClient);
    const ady = Math.abs(dyClient);
    const min = this.swipeMinPx;
    const r = this.swipeAxisRatio;

    if (adx >= ady * r && adx >= min) {
      const col = from.col + (dxClient > 0 ? 1 : -1);
      const row = from.row;
      if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null;
      return { col, row };
    }
    if (ady >= adx * r && ady >= min) {
      const col = from.col;
      const row = from.row + (dyClient > 0 ? 1 : -1);
      if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null;
      return { col, row };
    }
    return null;
  }

  // --- INPUT (свайп к соседу; короткий тап по бустеру — активация) ---

  private onPointerDown = (e: FederatedPointerEvent): void => {
    if (this.queue.isBusy) return;
    if (this.gestureFrom !== null) return;
    const local = this.tilesLayer.toLocal(e.global);
    const pos = this.pixelToCell(local.x, local.y);
    if (!pos) return;

    const tile = this.board.get(pos.col, pos.row);
    if (!tile) return;

    this.gestureFrom = pos;
    this.gesturePointerId = e.pointerId;
    const ne = e.nativeEvent;
    this.gestureStartClientX = ne.clientX;
    this.gestureStartClientY = ne.clientY;
    this.gestureMaxDistance = 0;
    this.gestureSurface = this.findCanvasSurface(ne.target);

    const entry = this.sprites.get(tile.id);
    if (entry) {
      this.gesturePressedSprite = entry.view;
      entry.view.zIndex = 1000;
      void tweenTo(entry.view, { scale: 1.06, duration: 0.08 });
    } else {
      this.gesturePressedSprite = null;
    }

    if (!this.gestureSurface) {
      this.gestureFrom = null;
      this.gesturePointerId = null;
      this.gesturePressedSprite = null;
      return;
    }

    if (this.gestureSurface.setPointerCapture) {
      try {
        this.gestureSurface.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    this.attachGestureSurfaceListeners();
  };

  private attachGestureSurfaceListeners(): void {
    const el = this.gestureSurface;
    if (el) {
      el.addEventListener('pointermove', this.onGestureSurfacePointerMove);
      el.addEventListener('pointerup', this.onGestureSurfacePointerUp);
      el.addEventListener('pointercancel', this.onGestureSurfacePointerUp);
    } else {
      window.addEventListener('pointermove', this.onGestureSurfacePointerMove, true);
      window.addEventListener('pointerup', this.onGestureSurfacePointerUp, true);
      window.addEventListener('pointercancel', this.onGestureSurfacePointerUp, true);
    }
  }

  private detachGestureSurfaceListeners(): void {
    const el = this.gestureSurface;
    const pid = this.gesturePointerId;
    if (el) {
      el.removeEventListener('pointermove', this.onGestureSurfacePointerMove);
      el.removeEventListener('pointerup', this.onGestureSurfacePointerUp);
      el.removeEventListener('pointercancel', this.onGestureSurfacePointerUp);
    } else {
      window.removeEventListener('pointermove', this.onGestureSurfacePointerMove, true);
      window.removeEventListener('pointerup', this.onGestureSurfacePointerUp, true);
      window.removeEventListener('pointercancel', this.onGestureSurfacePointerUp, true);
    }
    if (el && pid !== null && 'releasePointerCapture' in el) {
      try {
        el.releasePointerCapture(pid);
      } catch {
        /* ignore */
      }
    }
  }

  private onGestureSurfacePointerMove = (e: PointerEvent): void => {
    if (this.gesturePointerId !== null && e.pointerId !== this.gesturePointerId) return;
    if (this.gestureFrom === null) return;
    const dx = e.clientX - this.gestureStartClientX;
    const dy = e.clientY - this.gestureStartClientY;
    const d = Math.hypot(dx, dy);
    if (d > this.gestureMaxDistance) this.gestureMaxDistance = d;
  };

  private onGestureSurfacePointerUp = (e: PointerEvent): void => {
    if (this.gesturePointerId !== null && e.pointerId !== this.gesturePointerId) return;
    if (this.gestureFrom === null) return;

    const from = this.gestureFrom;
    const maxD = this.gestureMaxDistance;
    const dx = e.clientX - this.gestureStartClientX;
    const dy = e.clientY - this.gestureStartClientY;

    this.detachGestureSurfaceListeners();
    this.gestureFrom = null;
    this.gesturePointerId = null;
    this.gestureSurface = null;

    const tile = this.board.get(from.col, from.row);

    const restorePressedVisual = (): void => {
      if (this.gesturePressedSprite) {
        const p = this.cellToPixel(from.col, from.row);
        void tweenAll([
          {
            target: this.gesturePressedSprite,
            props: {
              x: p.x,
              y: p.y,
              scale: 1,
              duration: 0.18,
              ease: 'power2.out',
            },
          },
        ]);
        this.gesturePressedSprite.zIndex = 0;
        this.gesturePressedSprite = null;
      }
    };

    if (!tile) {
      restorePressedVisual();
      return;
    }

    const isTapBoost =
      maxD < this.tapBoostThresholdPx && isTapActivatedBoosterType(tile.type);

    if (isTapBoost) {
      bus.emit('tile:tap', from);
      restorePressedVisual();
      this.attemptTapBooster(from);
      return;
    }

    const to = this.neighborFromSwipe(from, dx, dy);
    if (to !== null && isAdjacent(from, to)) {
      bus.emit('tile:tap', from);
      if (this.gesturePressedSprite) {
        const p = this.cellToPixel(from.col, from.row);
        this.gesturePressedSprite.position.set(p.x, p.y);
        this.gesturePressedSprite.scale.set(1);
        this.gesturePressedSprite.zIndex = 0;
        this.gesturePressedSprite = null;
      }
      this.attemptSwap(from, to);
      return;
    }

    restorePressedVisual();
  };

  // --- ИГРОВЫЕ ХОДЫ ---

  private attemptSwap(a: TilePosition, b: TilePosition): void {
    if (!this.machine.transition('input')) return;
    this.machine.transition('swap');

    this.queue.push(async () => {
      bus.emit('swap:start', { a, b });
      this.board.swap(a, b);
      const taSnap = this.board.get(a.col, a.row);
      const tbSnap = this.board.get(b.col, b.row);
      if (taSnap && tbSnap) {
        const sa = this.sprites.get(taSnap.id)?.view;
        const sb = this.sprites.get(tbSnap.id)?.view;
        if (sa && sb) {
          const pa = this.cellToPixel(a.col, a.row);
          const pb = this.cellToPixel(b.col, b.row);
          sa.position.set(pb.x, pb.y);
          sb.position.set(pa.x, pa.y);
        }
      }
      await this.animateSwap(a, b);

      this.machine.transition('resolve');
      const ta = this.board.get(a.col, a.row);
      const tb = this.board.get(b.col, b.row);
      const doubleRainbow =
        ta !== null &&
        tb !== null &&
        isColorBoosterType(ta.type) &&
        isColorBoosterType(tb.type);

      const boosterClear = doubleRainbow
        ? null
        : getBoosterSwapClear(a, b, this.board, swapIsHorizontal(a, b));
      const matches = collectMatchGroups(this.board);
      if (!doubleRainbow && boosterClear === null && matches.length === 0) {
        bus.emit('swap:invalid', { a, b });
        this.board.swap(a, b);
        await this.animateSwap(a, b);
        this.machine.transition('idle');
        return;
      }

      useAppStore.getState().decrementMove();
      this.machine.transition('cascade');
      if (doubleRainbow) {
        const duoStep = applyRainbowDuoClearAndGravity(this.board);
        await this.runCascadeStep(duoStep);
      } else if (boosterClear !== null) {
        const boosterStep = applyBoosterClearAndGravity(this.board, boosterClear);
        await this.runCascadeStep(boosterStep);
      }
      await this.resolveCascades(b);
      this.machine.transition('idle');
    });
  }

  private attemptTapBooster(pos: TilePosition): void {
    if (!this.machine.transition('input')) return;
    const clear = getBoosterTapClear(this.board, pos);
    if (clear === null || clear.length === 0) {
      this.machine.transition('idle');
      return;
    }
    this.machine.transition('swap');
    this.queue.push(async () => {
      bus.emit('booster:tap', pos);
      this.machine.transition('resolve');
      useAppStore.getState().decrementMove();
      this.machine.transition('cascade');
      const step = applyBoosterClearAndGravity(this.board, clear);
      await this.runCascadeStep(step);
      await this.resolveCascades(pos);
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
    this.refreshTilesAtBoosterUpgrades(step.resolved.upgradedToBooster, step.moves);

    await this.animateMoves(step.moves);
    await this.animateSpawned(step.spawned);
  }

  private refreshTilesAtBoosterUpgrades(
    upgrades?: Array<{ id: number; type: number }>,
    moves?: Array<{ id: number; from: TilePosition; to: TilePosition }>,
  ): void {
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
      const move = moves?.find((m) => m.id === tile.id);
      const start = move?.from ?? { col: tile.col, row: tile.row };
      const p = this.cellToPixel(start.col, start.row);
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
