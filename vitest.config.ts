import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          include: [
            'packages/**/__tests__/**/*.node.test.{ts,tsx}',
            'packages/**/__tests__/**/*.ssr.test.{ts,tsx}',
            'scripts/__tests__/**/*.test.mjs',
          ],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['packages/**/src/**/__tests__/**/*.test.{ts,tsx}'],
          exclude: [
            'packages/**/src/**/__tests__/**/*.node.test.{ts,tsx}',
            'packages/**/src/**/__tests__/**/*.ssr.test.{ts,tsx}',
            'packages/**/src/**/__tests__/**/*.test-d.ts',
          ],
          environment: 'jsdom',
          setupFiles: ['./packages/hooks/src/__tests__/setup.ts'],
        },
      },
    ],
    globals: true,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'node_modules/.cache/vitest/coverage',
      include: ['packages/hooks/src/use-*/index.ts', 'packages/hooks/src/utils/*.ts'],
      thresholds: { statements: 90, functions: 90, lines: 90, branches: 85, perFile: true },
    },
  },
});
