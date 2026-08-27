import { Buffer } from 'node:buffer';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_GZIP_LIMIT,
  DEFAULT_RAW_LIMIT,
  measureDirectEntries,
  measureExport,
} from '../package-size.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture() {
  const packageDirectory = await mkdtemp(path.join(os.tmpdir(), 'better-hooks-size-'));
  temporaryDirectories.push(packageDirectory);
  const dist = path.join(packageDirectory, 'dist');
  await mkdir(dist, { recursive: true });
  const entry = "export { value } from './shared.js';\nimport './shared.js';\n";
  const shared = 'export const value = 42;\n';
  await writeFile(path.join(dist, 'entry.js'), entry);
  await writeFile(path.join(dist, 'shared.js'), shared);
  return { packageDirectory, entry, shared };
}

describe('package size analysis', () => {
  it('measures each reachable module once and applies the package budgets', async () => {
    const { packageDirectory, entry, shared } = await fixture();
    const descriptor = { import: './dist/entry.js' };
    const result = await measureDirectEntries({
      packageDirectory,
      packageExports: { './use-example': descriptor },
    });

    expect(result.defaultRawLimit).toBe(DEFAULT_RAW_LIMIT);
    expect(result.defaultGzipLimit).toBe(DEFAULT_GZIP_LIMIT);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      entry: './use-example',
      modules: 2,
      bytes: Buffer.byteLength(entry) + Buffer.byteLength(shared) + 2,
      rawLimit: DEFAULT_RAW_LIMIT,
      gzipLimit: DEFAULT_GZIP_LIMIT,
    });
    expect(result.rows[0].gzip).toBeGreaterThan(0);
    expect(result.rows[0].brotli).toBeGreaterThan(0);

    await expect(measureExport({ packageDirectory, descriptor })).resolves.toMatchObject({
      modules: 2,
      bytes: Buffer.byteLength(entry) + Buffer.byteLength(shared) + 2,
    });
  });

  it('rejects invalid configured budgets', async () => {
    const { packageDirectory } = await fixture();
    await expect(
      measureDirectEntries({
        packageDirectory,
        packageExports: {},
        configuredRawLimit: '0',
      }),
    ).rejects.toThrow('raw byte limit');
  });
});
