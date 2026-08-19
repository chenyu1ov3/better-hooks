import { defineConfig, devices } from '@playwright/test';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = dirname(fileURLToPath(import.meta.url));
const requestedPort = Number(process.env.PLAYWRIGHT_PORT ?? '4173');
const port =
  Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65_535
    ? requestedPort
    : 4173;

function normalizeBasePath(value: string) {
  const segments = value.trim().split('/').filter(Boolean);

  if (!segments.length) return '';
  if (segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment) || segment === '..')) {
    throw new Error(`Invalid PLAYWRIGHT_BASE_PATH: ${value}`);
  }

  return `/${segments.join('/')}`;
}

function withTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

const basePath = normalizeBasePath(process.env.PLAYWRIGHT_BASE_PATH ?? '/better-hooks');
const serverOrigin = `http://127.0.0.1:${port}`;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = withTrailingSlash(externalBaseUrl || `${serverOrigin}${basePath}`);
const staticRoot = resolve(tmpdir(), 'better-hooks-playwright-static');
const serveRoot = staticRoot.replaceAll('\\', '/');

export default defineConfig({
  testDir: './e2e',
  outputDir: resolve(tmpdir(), 'better-hooks-playwright-results'),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    colorScheme: 'light',
    permissions: ['clipboard-read', 'clipboard-write'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `pnpm -w docs:build && node e2e/prepare-static.mjs && pnpm exec serve "${serveRoot}" -l tcp://127.0.0.1:${port} --no-clipboard --no-port-switching`,
        cwd: docsRoot,
        env: {
          NEXT_PUBLIC_BASE_PATH: basePath,
          PLAYWRIGHT_STATIC_ROOT: staticRoot,
          PLAYWRIGHT_BASE_PATH: basePath,
        },
        url: baseURL,
        timeout: 240_000,
        reuseExistingServer: false,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
