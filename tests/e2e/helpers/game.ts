import type { Page } from '@playwright/test';

/**
 * Хелперы поверх Playwright Page для типовых сценариев match-3.
 * Держим их в одном месте, чтобы тесты оставались декларативными:
 * каждый тест читается как сценарий пользователя, а не как набор селекторов.
 */

export async function gotoApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

export async function startGoalsGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'С целью' }).click();
}

export async function startZenGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Дзен' }).click();
}

/** Режим с целью и лимитом ходов (классический HUD для существующих сценариев). */
export async function startGame(page: Page): Promise<void> {
  await startGoalsGame(page);
}

export function hud(page: Page) {
  // Каждая панель HUD содержит маленький подпись (small) и крупное значение (strong).
  // Возвращаем "ярлыки" этих значений — это устойчиво к локализации/перестановке.
  const panel = (label: string) => page.locator('.panel').filter({ hasText: label });
  return {
    score: panel('Очки').locator('strong'),
    target: panel('Цель').locator('strong'),
    mode: panel('Режим').locator('strong'),
    moves: panel('Ходов').locator('strong'),
  };
}

/**
 * Удобный селектор canvas-а. Pixi монтирует один канвас на страницу.
 */
export function gameCanvas(page: Page) {
  return page.locator('canvas');
}

/** Горизонтальный свайп по канвасу (CSS px), для match-3 ввода. */
export async function swipeCanvasHorizontal(
  page: Page,
  box: { x: number; y: number; width: number; height: number },
  opts?: { delta?: number },
): Promise<void> {
  const delta = opts?.delta ?? 100;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + delta, cy, { steps: 10 });
  await page.mouse.up();
}
