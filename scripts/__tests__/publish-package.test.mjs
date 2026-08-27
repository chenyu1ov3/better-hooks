import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { sha256, sri } from '../package-artifact.mjs';
import {
  assertReleaseArtifactMetadata,
  assertReleaseRecordsCompatible,
  readReleaseArtifact,
} from '../publish-package.mjs';

const manifest = JSON.parse(await readFile('packages/hooks/package.json', 'utf8'));
const tag = `better-hooks@${manifest.version}`;
const sha = 'a'.repeat(40);

function release(overrides = {}) {
  return {
    tag_name: tag,
    target_commitish: sha,
    draft: false,
    prerelease: false,
    ...overrides,
  };
}

function packageTarball() {
  const body = Buffer.from(JSON.stringify({ name: 'better-hooks', version: manifest.version }));
  const header = Buffer.alloc(512);
  header.write('package/package.json', 0, 100, 'utf8');
  header.write(`${body.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'ascii');
  header[156] = '0'.codePointAt(0);
  return gzipSync(
    Buffer.concat([
      header,
      body,
      Buffer.alloc((512 - (body.length % 512)) % 512),
      Buffer.alloc(1024),
    ]),
  );
}

describe('release recovery guards', () => {
  it('accepts an empty state and a compatible published release', () => {
    expect(() => assertReleaseRecordsCompatible({}, sha, 'latest')).not.toThrow();
    expect(() =>
      assertReleaseRecordsCompatible({ tagSha: sha, release: release() }, sha, 'latest'),
    ).not.toThrow();
  });

  it('rejects an existing tag bound to another commit', () => {
    expect(() => assertReleaseRecordsCompatible({ tagSha: 'b'.repeat(40) }, sha, 'latest')).toThrow(
      'expected',
    );
  });

  it('rejects a release without a resolvable tag', () => {
    expect(() => assertReleaseRecordsCompatible({ release: release() }, sha, 'latest')).toThrow(
      'without a resolvable tag',
    );
  });

  it.each([
    [{ draft: true }, 'must be published'],
    [{ prerelease: true }, 'does not match channel latest'],
    [{ target_commitish: 'b'.repeat(40) }, 'expected'],
    [{ tag_name: 'better-hooks@0.0.0' }, 'does not match'],
  ])('rejects incompatible GitHub release records', (overrides, message) => {
    expect(() =>
      assertReleaseRecordsCompatible({ tagSha: sha, release: release(overrides) }, sha, 'latest'),
    ).toThrow(message);
  });

  it('allows GitHub to report the default branch as target_commitish', () => {
    expect(() =>
      assertReleaseRecordsCompatible(
        { tagSha: sha, release: release({ target_commitish: 'main' }) },
        sha,
        'latest',
      ),
    ).not.toThrow();
  });
});

describe('immutable release artifact', () => {
  it('loads the exact tarball bound by checksum and release metadata', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'better-hooks-artifact-test-'));
    const previousDirectory = process.env.BETTER_HOOKS_RELEASE_ARTIFACT_DIR;
    const previousCommit = process.env.BETTER_HOOKS_RELEASE_COMMIT;
    const filename = `better-hooks-${manifest.version}.tgz`;
    const tarball = packageTarball();

    try {
      process.env.BETTER_HOOKS_RELEASE_ARTIFACT_DIR = directory;
      process.env.BETTER_HOOKS_RELEASE_COMMIT = sha;
      await Promise.all([
        writeFile(path.join(directory, filename), tarball),
        writeFile(path.join(directory, `${filename}.sha256`), `${sha256(tarball)}  ${filename}\n`),
        writeFile(
          path.join(directory, 'release-metadata.json'),
          `${JSON.stringify({
            name: 'better-hooks',
            version: manifest.version,
            commit: sha,
            integrity: sri(tarball),
          })}\n`,
        ),
      ]);

      await expect(readReleaseArtifact()).resolves.toMatchObject({
        path: path.join(directory, filename),
        integrity: sri(tarball),
      });

      await writeFile(path.join(directory, `${filename}.sha256`), `invalid  ${filename}\n`);
      await expect(readReleaseArtifact()).rejects.toThrow('SHA-256 does not match');
    } finally {
      if (previousDirectory === undefined) delete process.env.BETTER_HOOKS_RELEASE_ARTIFACT_DIR;
      else process.env.BETTER_HOOKS_RELEASE_ARTIFACT_DIR = previousDirectory;
      if (previousCommit === undefined) delete process.env.BETTER_HOOKS_RELEASE_COMMIT;
      else process.env.BETTER_HOOKS_RELEASE_COMMIT = previousCommit;
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('release artifact metadata', () => {
  const expected = {
    name: 'better-hooks',
    version: manifest.version,
    commit: sha,
    integrity: 'sha512-example',
  };

  it('accepts metadata bound to the candidate artifact', () => {
    expect(() => assertReleaseArtifactMetadata({ ...expected }, expected)).not.toThrow();
  });

  it.each(['name', 'version', 'commit', 'integrity'])('rejects a mismatched %s', (key) => {
    expect(() =>
      assertReleaseArtifactMetadata({ ...expected, [key]: 'unexpected' }, expected),
    ).toThrow(`metadata ${key}`);
  });

  it('rejects non-object metadata', () => {
    expect(() => assertReleaseArtifactMetadata(null, expected)).toThrow('must be an object');
  });
});
