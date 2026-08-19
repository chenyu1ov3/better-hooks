import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const docsRoot = resolve(import.meta.dirname, '..');
const source = resolve(docsRoot, 'out');
const tempRoot = resolve(tmpdir());
const staticRoot = resolve(
  process.env.PLAYWRIGHT_STATIC_ROOT ?? resolve(tempRoot, 'better-hooks-playwright-static'),
);
const basePath = process.env.PLAYWRIGHT_BASE_PATH ?? '/better-hooks';
const segments = basePath.split('/').filter(Boolean);
const relativeToTemp = relative(tempRoot, staticRoot);

if (
  !existsSync(source) ||
  !isAbsolute(staticRoot) ||
  !relativeToTemp ||
  relativeToTemp === '..' ||
  relativeToTemp.startsWith(`..${sep}`)
) {
  throw new Error(
    'Playwright static staging must use an existing export and a directory in OS temp.',
  );
}

if (segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment) || segment === '..')) {
  throw new Error(`Invalid PLAYWRIGHT_BASE_PATH: ${basePath}`);
}

rmSync(staticRoot, { force: true, recursive: true });
const mountDirectory = resolve(staticRoot, ...segments);
mkdirSync(mountDirectory, { recursive: true });
cpSync(source, mountDirectory, { recursive: true });
