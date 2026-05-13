import { test, expect } from '@playwright/test';
import { gotoApp, startGame, hud, gameCanvas } from './helpers/game';

test.describe('Стартовое меню', () => {
  test('меню отображается с заголовком и кнопкой "Начать игру"', async ({ page }) => {
    await gotoApp(page);

    await expect(page.getByRole('heading', { name: 'Match-3 Pixi v8' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Начать игру' })).toBeVisible();
  });

  test('после нажатия "Начать игру" появляется HUD и Pixi-канвас', async ({ page }) => {
    await gotoApp(page);
    await startGame(page);

    const { score, target, moves } = hud(page);
    await expect(score).toHaveText('0');
    await expect(target).toHaveText('1200');
    await expect(moves).toHaveText('25');

    await expect(gameCanvas(page)).toBeVisible();
  });
});
