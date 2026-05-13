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

export async function startGame(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Начать игру' }).click();
}

export function hud(page: Page) {
  // Каждая панель HUD содержит маленький подпись (small) и крупное значение (strong).
  // Возвращаем "ярлыки" этих значений — это устойчиво к локализации/перестановке.
  const panel = (label: string) => page.locator('.panel').filter({ hasText: label });
  return {
    score: panel('Очки').locator('strong'),
    target: panel('Цель').locator('strong'),
    moves: panel('Ходов').locator('strong'),
  };
}

/**
 * Удобный селектор canvas-а. Pixi монтирует один канвас на страницу.
 */
export function gameCanvas(page: Page) {
  return page.locator('canvas');
}
