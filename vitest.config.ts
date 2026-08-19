import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: false,
        test: {
          name: 'node',
          include: [
            'packages/**/__tests__/**/*.node.test.{ts,tsx}',
            'packages/**/__tests__/**/*.ssr.test.{ts,tsx}',
          ],
          environment: 'node',
        },
      },
      {
        extends: false,
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
      {
        extends: false,
        test: {
          name: 'types',
          include: ['packages/hooks/src/**/__tests__/**/*.test-d.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
            only: true,
            checker: 'tsc',
            include: ['packages/hooks/src/**/__tests__/**/*.test-d.ts'],
            tsconfig: './packages/hooks/tsconfig.type-tests.json',
          },
        },
      },
    ],
    globals: true,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'node_modules/.cache/vitest/coverage',
      include: ['packages/hooks/src/use-*/index.ts'],
      thresholds: { statements: 90, functions: 90, lines: 90, branches: 85, perFile: true },
    },
  },
});
