import { test, expect } from '@playwright/test';
import { gotoApp, startGame, hud, gameCanvas } from './helpers/game';

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

  test('два соседних клика по доске не ломают HUD (счёт остаётся валидным числом)', async ({
    page,
  }) => {
    await gotoApp(page);
    await startGame(page);

    const canvas = gameCanvas(page);
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    // Кликаем по центру и сразу по соседней клетке справа.
    // Конкретный результат свопа недетерминирован (зависит от seed'а),
    // поэтому проверяем только корректность HUD после взаимодействия.
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    await page.mouse.click(cx, cy);
    await page.mouse.click(cx + 60, cy);
    await page.waitForTimeout(800);

    const { score, moves } = hud(page);
    await expect(score).toHaveText(/^\d+$/);
    await expect(moves).toHaveText(/^\d+$/);
  });
});
