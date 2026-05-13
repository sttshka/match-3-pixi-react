import { test, expect } from '@playwright/test';
import { gotoApp, startGame, startZenGame, hud, gameCanvas } from './helpers/game';

test.describe('Стартовое меню', () => {
  test('меню отображается с заголовком и выбором режима', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('heading', { name: 'Match-3 Pixi v8' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Дзен' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'С целью' })).toBeVisible();
  });

  test('после «С целью» появляется HUD с целью и лимитом ходов', async ({ page }) => {
    await gotoApp(page);
    await startGame(page);

    const { score, target, moves } = hud(page);
    await expect(score).toHaveText('0');
    await expect(target).toHaveText('1200');
    await expect(moves).toHaveText('25');

    await expect(gameCanvas(page)).toBeVisible();
  });

  test('после «Дзен» в HUD режим и бесконечные ходы', async ({ page }) => {
    await gotoApp(page);
    await startZenGame(page);

    const { score, mode, moves } = hud(page);
    await expect(score).toHaveText('0');
    await expect(mode).toHaveText('Дзен');
    await expect(moves).toHaveText('∞');

    await expect(gameCanvas(page)).toBeVisible();
  });
});
