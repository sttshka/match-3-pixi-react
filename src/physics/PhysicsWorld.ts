import Matter from 'matter-js';

// Тонкая обёртка над Matter.js: создаём движок, мир, и шаг физики
// синхронизирован с Pixi Ticker (передаём deltaMS извне).
// Используется для эффектов "обломков" при разрушении тайлов и любой
// физической надстройки match-3.
export class PhysicsWorld {
  readonly engine: Matter.Engine;
  readonly world: Matter.World;

  constructor(opts: { gravityY?: number; gravityScale?: number } = {}) {
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: opts.gravityY ?? 1 },
    });
    if (opts.gravityScale != null) {
      this.engine.gravity.scale = opts.gravityScale;
    }
    this.world = this.engine.world;
  }

  // Делаем фиксированный шаг (Matter ожидает миллисекунды). Принимаем deltaMs из Pixi Ticker.
  step(deltaMs: number): void {
    // Matter рекомендует шаг <= 16.667 мс для стабильности.
    const dt = Math.min(deltaMs, 16);
    Matter.Engine.update(this.engine, dt);
  }

  add(body: Matter.Body | Matter.Body[]): void {
    Matter.Composite.add(this.world, body);
  }

  remove(body: Matter.Body | Matter.Body[]): void {
    if (Array.isArray(body)) {
      for (const b of body) Matter.Composite.remove(this.world, b);
    } else {
      Matter.Composite.remove(this.world, body);
    }
  }

  clear(): void {
    Matter.Composite.clear(this.world, false);
  }

  destroy(): void {
    this.clear();
    Matter.Engine.clear(this.engine);
  }
}

// Создаёт круг-«осколок» с малым радиусом и случайной скоростью.
// Полезно для эффектов взрыва тайла.
export function createDebrisBody(x: number, y: number, radius: number, speed = 8): Matter.Body {
  const angle = Math.random() * Math.PI * 2;
  const body = Matter.Bodies.circle(x, y, radius, {
    restitution: 0.6,
    frictionAir: 0.02,
    density: 0.001,
  });
  Matter.Body.setVelocity(body, {
    x: Math.cos(angle) * speed,
    y: -Math.abs(Math.sin(angle) * speed) - 2,
  });
  Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.4);
  return body;
}
