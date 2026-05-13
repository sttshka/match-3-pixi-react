import { test, expect } from '@playwright/test';
import { gotoApp, startGame, hud, gameCanvas, swipeCanvasHorizontal } from './helpers/game';

test.describe('Игровая сцена', () => {
  test('канвас рендерится непустым (ненулевые размеры)', async ({ page }) => {
    await gotoApp(page);
    await startGame(page);

    const canvas = gameCanvas(page);
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);
  });

  test('консоль не содержит ошибок после загрузки', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await gotoApp(page);
    await startGame(page);
    await page.waitForTimeout(1500);

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('свайп по доске не ломает HUD (счёт остаётся валидным числом)', async ({ page }) => {
    await gotoApp(page);
    await startGame(page);

    const canvas = gameCanvas(page);
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Результат свопа недетерминирован (seed), проверяем инвариант HUD.
    await swipeCanvasHorizontal(page, box!);

    const { score, moves } = hud(page);
    await expect(score).toHaveText(/^\d+$/, { timeout: 10_000 });
    await expect(moves).toHaveText(/^\d+$/, { timeout: 10_000 });
  });
});
