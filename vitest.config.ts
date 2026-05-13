import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Vitest наследует резолв-алиасы и плагины из vite.config.ts, чтобы
// импорты вида `@game/board/Board` работали и в тестах. Запуск:
//   npm run test       — Vitest (unit)
//   npm run test:e2e   — Playwright (E2E)
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['tests/unit/**/*.test.ts'],
      exclude: ['tests/e2e/**', 'node_modules', 'dist'],
      reporters: process.env.CI ? ['default', 'github-actions'] : ['default'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.ts'],
        exclude: ['src/**/*.tsx', 'src/main.tsx', 'src/App.tsx'],
      },
    },
  }),
);
