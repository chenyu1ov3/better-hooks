#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  appendFile,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { canonicalJson, readTarGzip, sha256, sri } from './package-artifact.mjs';

const packageName = 'better-hooks';
const officialRepository = 'chenyu1ov3/better-hooks';
const releaseWorkflow = '.github/workflows/release.yml';
const releaseEnvironment = 'npm-release';
const requiredNpmVersion = '11.19.0';
const firstStableVersion = '1.0.0';
const firstReleaseRcPattern = /^1\.0\.0-rc\.\d+$/;
const registryUrl = `https://registry.npmjs.org/${packageName}`;
const packageDirectory = path.resolve('packages/hooks');
const manifest = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'));
const expectedKeywords = [
  'debounce',
  'esm',
  'hooks',
  'react',
  'react-19',
  'react-hooks',
  'react-server-components',
  'ssr',
  'state',
  'storage',
  'throttle',
  'typescript',
];
const logoUrl = 'https://chenyu1ov3.github.io/better-hooks/better-hooks-mark.svg';

export async function runCommand(command = process.argv[2] ?? 'status') {
  validateManifest();
  if (command === 'status') await reportStatus();
  else if (command === 'validate') await validateReleaseCandidate();
  else if (command === 'pack') await createReleaseArtifact();
  else if (command === 'publish') await publishOrReconcile();
  else {
    throw new Error(
      `Unknown command ${JSON.stringify(command)}. Use status, validate, pack, or publish.`,
    );
  }
}

if (isMainModule()) {
  try {
    await runCommand();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function reportStatus() {
  const channel = await resolveReleaseChannel({ allowInput: false });
  const pendingChangesets = await hasPendingChangesets();
  const registry = await readRegistry();
  const versionRecord = registry.versions?.[manifest.version];
  const tombstoned = !versionRecord && Boolean(registry.time?.[manifest.version]);

  if (tombstoned) {
    await writeOutputs({
      version: manifest.version,
      tag: releaseTag(),
      'dist-tag': channel,
      state: 'tombstoned',
      action: 'manual-dispatch-only',
      'pending-changesets': pendingChangesets,
      'registry-version': false,
      'git-tag': false,
      'github-release': false,
    });
    throw new Error(
      `${packageName}@${manifest.version} appears in registry time metadata but not versions. npm versions cannot be reused after deletion.`,
    );
  }

  const state = versionRecord ? 'published' : 'unpublished';
  const githubState = versionRecord ? await readGitHubState() : undefined;

  const outputs = {
    version: manifest.version,
    tag: releaseTag(),
    'dist-tag': channel,
    state,
    action: 'manual-dispatch-only',
    'pending-changesets': pendingChangesets,
    'registry-version': Boolean(versionRecord),
    'git-tag': githubState ? Boolean(githubState.tagSha) : 'unknown',
    'github-release': githubState ? Boolean(githubState.release) : 'unknown',
  };
  await writeOutputs(outputs);
  console.log(JSON.stringify(outputs, null, 2));
}

async function createReleaseArtifact() {
  assertReleaseContext();
  const { channel, sha } = await validateReleaseCandidate();
  assertPinnedNpm();

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'better-hooks-pack-'));
  try {
    const packedArtifact = await packLocalArtifact(tempDirectory);
    await writeReleaseAssets(packedArtifact);
    const persistedArtifact = await readReleaseArtifact();
    if (persistedArtifact.integrity !== packedArtifact.integrity) {
      throw new Error('Persisted release artifact integrity changed after packing.');
    }
    const outputs = {
      version: manifest.version,
      tag: releaseTag(),
      'dist-tag': channel,
      state: 'packed',
      commit: sha,
      artifact: persistedArtifact.path,
      integrity: persistedArtifact.integrity,
    };
    await writeOutputs(outputs);
    console.log(JSON.stringify(outputs, null, 2));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function publishOrReconcile() {
  assertReleaseContext();
  const { channel, sha } = await validateReleaseCandidate();
  assertPinnedNpm();
  const localArtifact = await readReleaseArtifact();

  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'better-hooks-release-'));
  try {
    assertReleaseRecordsCompatible(await readGitHubState(), sha, channel);
    const registry = await readRegistry();
    let versionRecord = registry.versions?.[manifest.version];
    if (!versionRecord && registry.time?.[manifest.version]) {
      throw new Error(
        `${packageName}@${manifest.version} is a deleted registry version and cannot be reused.`,
      );
    }

    let publishedNow = false;
    if (versionRecord) {
      if (versionRecord.gitHead && versionRecord.gitHead !== sha) {
        throw new Error(
          `${packageName}@${manifest.version} was published from ${versionRecord.gitHead}, not ${sha}.`,
        );
      }
      if (versionRecord.dist?.integrity !== localArtifact.integrity) {
        throw new Error(
          `${packageName}@${manifest.version} exists, but its integrity does not match the current artifact.`,
        );
      }
      console.log(
        `${packageName}@${manifest.version} is already published; reconciling release state.`,
      );
    } else {
      console.log(`Publishing ${packageName}@${manifest.version} with dist-tag ${channel}...`);
      runNpm([
        'publish',
        localArtifact.path,
        '--access',
        'public',
        '--provenance',
        '--tag',
        channel,
      ]);
      publishedNow = true;
      versionRecord = await waitForPublishedVersion(localArtifact.integrity);
    }

    await waitForDistTag(channel);
    const remoteArtifact = await verifyPublishedPackage(versionRecord, localArtifact.integrity);
    await verifyCleanImports(remoteArtifact, tempDirectory);
    await reconcileGitHubRelease(sha, channel);

    const outputs = {
      version: manifest.version,
      tag: releaseTag(),
      'dist-tag': channel,
      state: 'complete',
      action: publishedNow ? 'published' : 'reconciled',
      'pending-changesets': false,
      'registry-version': true,
      'git-tag': true,
      'github-release': true,
    };
    await writeOutputs(outputs);
    console.log(JSON.stringify(outputs, null, 2));
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

function assertPinnedNpm() {
  const npmVersion = runNpm(['--version'], { encoding: 'utf8' }).trim();
  if (npmVersion !== requiredNpmVersion) {
    throw new Error(`Publishing requires npm ${requiredNpmVersion}; received ${npmVersion}.`);
  }
}

function validateManifest() {
  if (manifest.name !== packageName) throw new Error(`Expected package name ${packageName}.`);
  if (Object.hasOwn(manifest.exports ?? {}, './use-storage')) {
    throw new Error('The removed ./use-storage aggregate export must not be published.');
  }
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(manifest.version)) {
    throw new Error(`Unsupported package version ${JSON.stringify(manifest.version)}.`);
  }
  if (JSON.stringify(manifest.keywords) !== JSON.stringify(expectedKeywords)) {
    throw new Error('Package keywords do not match the frozen release metadata.');
  }
  if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
    throw new Error('publishConfig.registry must be the public npm registry.');
  }
  if (manifest.publishConfig?.access !== 'public') {
    throw new Error('publishConfig.access must be public.');
  }
}

async function resolveReleaseChannel({ allowInput = true } = {}) {
  const requestedChannel = allowInput ? process.env.BETTER_HOOKS_RELEASE_CHANNEL : undefined;
  if (requestedChannel) {
    if (requestedChannel !== 'next' && requestedChannel !== 'latest') {
      throw new Error('Release channel must be next or latest.');
    }
    return requestedChannel;
  }
  if (!manifest.version.includes('-')) return 'latest';

  const preState = await readPrereleaseState();
  if (preState?.mode !== 'pre' || preState.tag !== 'rc') {
    throw new Error('Prerelease versions require Changesets pre mode with the rc tag.');
  }
  return 'next';
}

async function readPrereleaseState() {
  try {
    return JSON.parse(await readFile(path.resolve('.changeset/pre.json'), 'utf8'));
  } catch {
    return undefined;
  }
}

async function validateReleaseCandidate() {
  const expectedSha = process.env.BETTER_HOOKS_RELEASE_COMMIT?.trim();
  const expectedVersion = process.env.BETTER_HOOKS_RELEASE_VERSION?.trim();
  if (!expectedSha || !/^[0-9a-f]{40}$/i.test(expectedSha)) {
    throw new Error('A full 40-character candidate commit SHA is required.');
  }
  const sha = currentCommit();
  if (sha.toLowerCase() !== expectedSha.toLowerCase()) {
    throw new Error(`Checked out ${sha}, but the release candidate is ${expectedSha}.`);
  }
  const workflowSha = process.env.GITHUB_SHA?.trim();
  if (
    process.env.GITHUB_ACTIONS === 'true' &&
    (!workflowSha || workflowSha.toLowerCase() !== expectedSha.toLowerCase())
  ) {
    throw new Error(
      `The candidate SHA must equal the workflow GITHUB_SHA (${workflowSha ?? 'missing'}); dispatch a new release only from the candidate commit and re-run the same workflow for retries.`,
    );
  }
  if (!expectedVersion) throw new Error('An exact release version is required.');
  if (manifest.version !== expectedVersion) {
    throw new Error(
      `Candidate package version is ${manifest.version}; requested release version is ${expectedVersion}.`,
    );
  }

  const channel = await resolveReleaseChannel();
  const isPrerelease = manifest.version.includes('-');
  if ((channel === 'next') !== isPrerelease) {
    throw new Error(
      `Release channel ${channel} does not match package version ${manifest.version}.`,
    );
  }
  if (isPrerelease) {
    if (!/-rc\.[0-9]+$/.test(manifest.version)) {
      throw new Error('Only rc prerelease versions may be published through the next channel.');
    }
    const preState = await readPrereleaseState();
    if (preState?.mode !== 'pre' || preState.tag !== 'rc') {
      throw new Error('The candidate must be produced while Changesets is in rc prerelease mode.');
    }
  } else {
    const preState = await readPrereleaseState();
    if (preState?.mode === 'pre') {
      throw new Error('Exit Changesets prerelease mode before publishing a stable version.');
    }
  }

  await validateFirstReleaseVersion(isPrerelease);

  const pendingChangesets = await hasPendingChangesets();
  if (pendingChangesets) {
    throw new Error('Pending Changesets must be consumed by the Version PR before publishing.');
  }
  const result = { version: manifest.version, channel, sha, 'pending-changesets': false };
  await writeOutputs(result);
  console.log(JSON.stringify(result, null, 2));
  return { channel, sha };
}

async function validateFirstReleaseVersion(isPrerelease) {
  const registry = await readRegistry();
  const firstStablePublished = Boolean(registry.versions?.[firstStableVersion]);
  if (firstStablePublished) return;
  if (registry.time?.[firstStableVersion]) {
    throw new Error(
      `${packageName}@${firstStableVersion} is recorded as deleted on npm and cannot be reused; choose a new release line.`,
    );
  }

  if (isPrerelease) {
    if (!firstReleaseRcPattern.test(manifest.version)) {
      throw new Error(
        `Before ${packageName}@${firstStableVersion} is published, prereleases must be ${firstStableVersion}-rc.N; received ${manifest.version}.`,
      );
    }
    return;
  }

  if (manifest.version !== firstStableVersion) {
    throw new Error(
      `The first stable release must be ${packageName}@${firstStableVersion}; received ${packageName}@${manifest.version}.`,
    );
  }
}

async function hasPendingChangesets() {
  const entries = await readdir(path.resolve('.changeset'), { withFileTypes: true });
  return entries.some(
    (entry) =>
      entry.isFile() && entry.name.endsWith('.md') && entry.name.toLowerCase() !== 'readme.md',
  );
}

function assertReleaseContext() {
  const repository = process.env.GITHUB_REPOSITORY?.toLowerCase();
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Publishing is only allowed from GitHub Actions.');
  }
  if (repository !== officialRepository) {
    throw new Error(`Publishing is only allowed from ${officialRepository}.`);
  }
  if (
    process.env.GITHUB_EVENT_NAME !== 'workflow_dispatch' ||
    process.env.GITHUB_REF !== 'refs/heads/main'
  ) {
    throw new Error('Publishing requires an explicit workflow_dispatch run from main.');
  }
  if (process.env.BETTER_HOOKS_RELEASE_ENVIRONMENT !== releaseEnvironment) {
    throw new Error(`Publishing requires the protected ${releaseEnvironment} environment.`);
  }
  if (!process.env.GITHUB_WORKFLOW_REF?.includes(`${releaseWorkflow}@refs/heads/main`)) {
    throw new Error(`Publishing must run from ${releaseWorkflow} defined on main.`);
  }
  const candidateSha = process.env.BETTER_HOOKS_RELEASE_COMMIT?.trim();
  const workflowSha = process.env.GITHUB_SHA?.trim();
  if (!candidateSha || !workflowSha || workflowSha.toLowerCase() !== candidateSha.toLowerCase()) {
    throw new Error(
      `The candidate SHA must equal the workflow GITHUB_SHA (${workflowSha ?? 'missing'}); re-run the original workflow instead of dispatching an old commit.`,
    );
  }
  if (!process.env.ACTIONS_ID_TOKEN_REQUEST_URL || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    throw new Error('GitHub OIDC variables are missing; npm Trusted Publishing cannot be used.');
  }
  if (process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN) {
    throw new Error(
      'Long-lived npm tokens are forbidden; use npm Trusted Publishing through OIDC.',
    );
  }
  if (!releaseToken()) throw new Error('GITHUB_TOKEN is required to reconcile tags and releases.');
}

async function packLocalArtifact(tempDirectory) {
  const output = runNpm(
    ['pack', packageDirectory, '--pack-destination', tempDirectory, '--ignore-scripts', '--json'],
    { encoding: 'utf8' },
  );
  const records = JSON.parse(output);
  if (!Array.isArray(records) || records.length !== 1 || !records[0]?.filename) {
    throw new Error('npm pack did not return exactly one artifact.');
  }
  const tarballPath = path.join(tempDirectory, records[0].filename);
  const tarball = await readFile(tarballPath);
  return { path: tarballPath, bytes: tarball, integrity: sri(tarball) };
}

function releaseArtifactPaths() {
  const configuredDirectory = process.env.BETTER_HOOKS_RELEASE_ARTIFACT_DIR?.trim();
  if (!configuredDirectory) {
    throw new Error('BETTER_HOOKS_RELEASE_ARTIFACT_DIR is required for packing and publishing.');
  }
  const directory = path.resolve(configuredDirectory);
  const filename = `${packageName}-${manifest.version}.tgz`;
  return {
    directory,
    filename,
    tarball: path.join(directory, filename),
    checksum: path.join(directory, `${filename}.sha256`),
    metadata: path.join(directory, 'release-metadata.json'),
  };
}

async function writeReleaseAssets(localArtifact) {
  const paths = releaseArtifactPaths();
  await mkdir(paths.directory, { recursive: true });
  await copyFile(localArtifact.path, paths.tarball);
  await writeFile(paths.checksum, `${sha256(localArtifact.bytes)}  ${paths.filename}\n`, 'utf8');
  await writeFile(
    paths.metadata,
    `${JSON.stringify(
      {
        name: packageName,
        version: manifest.version,
        commit: releaseCommit(),
        integrity: localArtifact.integrity,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

export async function readReleaseArtifact() {
  const paths = releaseArtifactPaths();
  const expectedFiles = new Set([
    paths.filename,
    path.basename(paths.checksum),
    path.basename(paths.metadata),
  ]);
  const entries = await readdir(paths.directory, { withFileTypes: true });
  const unexpected = entries
    .filter((entry) => !entry.isFile() || !expectedFiles.has(entry.name))
    .map((entry) => entry.name);
  if (unexpected.length > 0) {
    throw new Error(
      `Release artifact directory contains unexpected entries: ${unexpected.join(', ')}.`,
    );
  }

  const [bytes, checksum, metadataSource] = await Promise.all([
    readFile(paths.tarball),
    readFile(paths.checksum, 'utf8'),
    readFile(paths.metadata, 'utf8'),
  ]);
  const integrity = sri(bytes);
  const expectedChecksum = `${sha256(bytes)}  ${paths.filename}\n`;
  if (checksum !== expectedChecksum) throw new Error('Release artifact SHA-256 does not match.');

  const metadata = JSON.parse(metadataSource);
  assertReleaseArtifactMetadata(metadata, {
    name: packageName,
    version: manifest.version,
    commit: releaseCommit(),
    integrity,
  });

  const files = readTarGzip(bytes);
  const packedManifestSource = files.get('package/package.json');
  if (!packedManifestSource) throw new Error('Release artifact is missing package/package.json.');
  const packedManifest = JSON.parse(packedManifestSource.toString('utf8'));
  if (packedManifest.name !== packageName || packedManifest.version !== manifest.version) {
    throw new Error('Release artifact package identity does not match the candidate.');
  }

  return { path: paths.tarball, bytes, integrity };
}

export function assertReleaseArtifactMetadata(metadata, expected) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Release artifact metadata must be an object.');
  }
  for (const key of ['name', 'version', 'commit', 'integrity']) {
    if (metadata[key] !== expected[key]) {
      throw new Error(
        `Release artifact metadata ${key}=${JSON.stringify(metadata[key])}; expected ${JSON.stringify(expected[key])}.`,
      );
    }
  }
}

async function readRegistry() {
  const response = await fetch(registryUrl, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 404) return { versions: {}, time: {} };
  if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}.`);
  return response.json();
}

async function waitForPublishedVersion(integrity) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const registry = await readRegistry();
    const record = registry.versions?.[manifest.version];
    if (record?.dist?.integrity === integrity && record.dist?.attestations?.url) return record;
    if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(
    `${packageName}@${manifest.version} did not become visible with matching integrity and provenance.`,
  );
}

async function waitForDistTag(channel) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const registry = await readRegistry();
    if (registry['dist-tags']?.[channel] === manifest.version) return;
    if (attempt < 12) await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  throw new Error(`npm dist-tag ${channel} does not point to ${packageName}@${manifest.version}.`);
}

async function verifyPublishedPackage(record, expectedIntegrity) {
  if (!record || record.name !== packageName || record.version !== manifest.version) {
    throw new Error('Registry metadata does not match the release candidate.');
  }
  if (record.description !== manifest.description)
    throw new Error('Published description is incorrect.');
  if (JSON.stringify(record.keywords) !== JSON.stringify(expectedKeywords)) {
    throw new Error('Published keywords are incorrect.');
  }
  if (canonicalJson(record.exports) !== canonicalJson(manifest.exports)) {
    throw new Error('Published exports differ from the local package contract.');
  }
  if (record.dist?.integrity !== expectedIntegrity) {
    throw new Error('Published artifact integrity differs from the verified local tarball.');
  }

  await verifyProvenance(record.dist?.attestations);
  const response = await fetch(record.dist.tarball, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Published tarball returned HTTP ${response.status}.`);
  const tarball = Buffer.from(await response.arrayBuffer());
  if (sri(tarball) !== record.dist.integrity)
    throw new Error('Published tarball failed integrity verification.');

  const files = readTarGzip(tarball);
  const requiredFiles = [
    'package/package.json',
    'package/README.md',
    'package/README.zh-CN.md',
    'package/LICENSE',
    'package/CHANGELOG.md',
    'package/assets/better-hooks-mark.svg',
    'package/dist/index.js',
    'package/dist/index.d.ts',
  ];
  for (const filename of requiredFiles) {
    if (!files.has(filename)) throw new Error(`Published tarball is missing ${filename}.`);
  }
  for (const filename of files.keys()) {
    if (
      filename.startsWith('package/src/') ||
      filename.startsWith('package/dist/use-storage') ||
      filename.endsWith('.map') ||
      /(?:^|\/)(?:__tests__|examples|node_modules)(?:\/|$)/.test(filename) ||
      /(?:^|\/)(?:tsconfig|tsdown\.config|vitest\.config)/.test(filename)
    ) {
      throw new Error(`Published tarball contains forbidden file ${filename}.`);
    }
  }

  const packedManifest = JSON.parse(files.get('package/package.json').toString('utf8'));
  if (JSON.stringify(packedManifest.keywords) !== JSON.stringify(expectedKeywords)) {
    throw new Error('Packed package.json is missing the expected keywords.');
  }
  const englishReadme = files.get('package/README.md').toString('utf8');
  const chineseReadme = files.get('package/README.zh-CN.md').toString('utf8');
  if (/\buse-storage\b/i.test(`${englishReadme}\n${chineseReadme}`)) {
    throw new Error('Published README files mention the removed use-storage entry.');
  }
  if (!englishReadme.includes(logoUrl) || !englishReadme.includes('README.zh-CN.md')) {
    throw new Error('Published English README is missing its logo or Chinese language link.');
  }
  if (!chineseReadme.includes(logoUrl) || !chineseReadme.includes('packages/hooks/README.md')) {
    throw new Error('Published Chinese README is missing its logo or English language link.');
  }
  return tarball;
}

const retryableAttestationStatuses = new Set([404, 408, 425, 429, 500, 502, 503, 504]);

export async function readProvenanceDocument(
  url,
  {
    fetchImpl = fetch,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    maxAttempts = 12,
    retryDelayMs = 5_000,
  } = {},
) {
  if (typeof url !== 'string' || url.length === 0) {
    throw new Error('npm attestation URL is missing.');
  }
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('npm attestation attempts must be a positive integer.');
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchImpl(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return response.json();
    if (!retryableAttestationStatuses.has(response.status) || attempt === maxAttempts) {
      throw new Error(`npm attestations returned HTTP ${response.status}.`);
    }
    await sleep(retryDelayMs);
  }

  throw new Error('npm attestation retry loop completed unexpectedly.');
}

async function verifyProvenance(attestations) {
  if (
    !attestations?.url ||
    !String(attestations.provenance?.predicateType).includes('slsa.dev/provenance')
  ) {
    throw new Error('Published package is missing npm provenance metadata.');
  }
  const document = await readProvenanceDocument(attestations.url);
  const searchable = [JSON.stringify(document), ...decodeDssePayloads(document)].join('\n');
  if (
    !searchable.toLowerCase().includes(releaseCommit()) ||
    !searchable.toLowerCase().includes(officialRepository)
  ) {
    throw new Error('npm provenance does not identify the current commit and official repository.');
  }
}

function decodeDssePayloads(value, decoded = []) {
  if (Array.isArray(value)) {
    for (const entry of value) decodeDssePayloads(entry, decoded);
  } else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'payload' && typeof entry === 'string') {
        try {
          decoded.push(Buffer.from(entry, 'base64').toString('utf8'));
        } catch {
          // The surrounding attestation shape is still inspected below.
        }
      } else decodeDssePayloads(entry, decoded);
    }
  }
  return decoded;
}

async function verifyCleanImports(tarball, tempDirectory) {
  await writeFile(path.join(tempDirectory, 'published.tgz'), tarball);
  await writeFile(
    path.join(tempDirectory, 'package.json'),
    `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
  );
  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      'react@19.1.1',
      '@types/react@19.1.10',
      './published.tgz',
    ],
    { cwd: tempDirectory },
  );
  await writeFile(
    path.join(tempDirectory, 'verify-imports.mjs'),
    [
      "import { readFile } from 'node:fs/promises';",
      "const manifest = JSON.parse(await readFile(new URL('./node_modules/better-hooks/package.json', import.meta.url), 'utf8'));",
      'for (const subpath of Object.keys(manifest.exports)) {',
      "  if (subpath === './package.json') continue;",
      "  await import(subpath === '.' ? 'better-hooks' : `better-hooks${subpath.slice(1)}`);",
      '}',
      "try { await import('better-hooks/use-storage'); throw new Error('the removed use-storage entry is still importable'); }",
      "catch (error) { if (error?.message?.includes('the removed use-storage entry')) throw error; if (error?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error; }",
    ].join('\n'),
  );
  runNode(['verify-imports.mjs'], { cwd: tempDirectory });

  await writeFile(
    path.join(tempDirectory, 'consumer.ts'),
    [
      "import { useToggle } from 'better-hooks';",
      "import { useDebounce } from 'better-hooks/use-debounce';",
      'const rootEntry: typeof useToggle = useToggle;',
      'const directEntry: typeof useDebounce = useDebounce;',
      'void rootEntry;',
      'void directEntry;',
    ].join('\n'),
  );
  await writeFile(
    path.join(tempDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          noEmit: true,
          skipLibCheck: false,
          types: ['react'],
        },
        include: ['consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );
  runNode([path.resolve('node_modules/typescript/bin/tsc'), '--project', 'tsconfig.json'], {
    cwd: tempDirectory,
  });
}

async function reconcileGitHubRelease(sha, channel) {
  let state = await readGitHubState();
  assertReleaseRecordsCompatible(state, sha, channel);
  if (!state.tagSha) {
    await githubRequest('/git/refs', {
      method: 'POST',
      body: { ref: `refs/tags/${releaseTag()}`, sha },
      // A second dispatch can create the ref between the read above and this
      // request. Re-read and verify the ref instead of treating that race as
      // a failed release.
      allowStatuses: [422],
    });
    state = await waitForGitHubState(
      (nextState) => Boolean(nextState.tagSha),
      `Unable to verify GitHub tag ${releaseTag()} after creation.`,
    );
    if (state.tagSha !== sha)
      throw new Error(`Unable to verify newly created tag ${releaseTag()}.`);
  }
  if (!state.release) {
    await githubRequest('/releases', {
      method: 'POST',
      body: {
        tag_name: releaseTag(),
        target_commitish: sha,
        name: `${packageName} ${manifest.version}`,
        draft: false,
        prerelease: channel === 'next',
        generate_release_notes: true,
      },
      // GitHub returns 422 when another run creates the release first. The
      // subsequent state check is authoritative and still rejects mismatched
      // tag, draft, or prerelease records.
      allowStatuses: [422],
    });
    state = await waitForGitHubState(
      (nextState) => Boolean(nextState.release),
      `Unable to verify GitHub Release ${releaseTag()} after creation.`,
    );
  }
  assertReleaseRecordsCompatible(state, sha, channel);
}

async function waitForGitHubState(predicate, message) {
  let state = await readGitHubState();
  for (let attempt = 1; !predicate(state) && attempt <= 5; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    state = await readGitHubState();
  }
  if (!predicate(state)) throw new Error(message);
  return state;
}

export function assertReleaseRecordsCompatible(
  state,
  sha,
  channel = manifest.version.includes('-') ? 'next' : 'latest',
) {
  if (state.tagSha && state.tagSha !== sha) {
    throw new Error(`${releaseTag()} resolves to ${state.tagSha}; expected ${sha}.`);
  }
  if (state.release && !state.tagSha) {
    throw new Error(`${releaseTag()} has a GitHub Release without a resolvable tag.`);
  }
  if (!state.release) return;
  if (state.release.tag_name !== releaseTag()) {
    throw new Error(`GitHub Release tag ${state.release.tag_name} does not match ${releaseTag()}.`);
  }
  // GitHub may report the default branch (for example, "main") in
  // target_commitish when a release was created against an existing tag.
  // The resolved tag SHA above is the authoritative candidate binding. Only
  // reject an explicit 40-character SHA when it disagrees with that binding.
  if (
    typeof state.release.target_commitish === 'string' &&
    /^[0-9a-f]{40}$/i.test(state.release.target_commitish) &&
    state.release.target_commitish !== sha
  ) {
    throw new Error(
      `GitHub Release ${releaseTag()} targets ${state.release.target_commitish}; expected ${sha}.`,
    );
  }
  if (state.release.draft !== false) {
    throw new Error(`GitHub Release ${releaseTag()} must be published, not a draft.`);
  }
  if (state.release.prerelease !== (channel === 'next')) {
    throw new Error(
      `GitHub Release ${releaseTag()} prerelease=${state.release.prerelease} does not match channel ${channel}.`,
    );
  }
}

async function readGitHubState() {
  const encodedTag = encodeURIComponent(releaseTag());
  const ref = await githubRequest(`/git/ref/tags/${encodedTag}`, { allowStatuses: [404, 422] });
  let tagSha = ref?.object?.sha;
  if (ref?.object?.type === 'tag' && tagSha) {
    const annotated = await githubRequest(`/git/tags/${encodeURIComponent(tagSha)}`, {
      allowStatuses: [404],
    });
    tagSha = annotated?.object?.sha ?? tagSha;
  }
  const release = await githubRequest(`/releases/tags/${encodedTag}`, { allowStatuses: [404] });
  return { tagSha, release };
}

async function githubRequest(endpoint, options = {}) {
  const headers = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };
  if (releaseToken()) headers.authorization = `Bearer ${releaseToken()}`;
  if (options.body) headers['content-type'] = 'application/json';
  const response = await fetch(`https://api.github.com/repos/${officialRepository}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (options.allowStatuses?.includes(response.status)) return undefined;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API ${endpoint} returned HTTP ${response.status}: ${detail}`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

function releaseTag() {
  return `${packageName}@${manifest.version}`;
}

function currentCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function releaseCommit() {
  return (process.env.BETTER_HOOKS_RELEASE_COMMIT?.trim() || currentCommit()).toLowerCase();
}

function releaseToken() {
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
}

async function writeOutputs(outputs) {
  if (!process.env.GITHUB_OUTPUT) return;
  const lines = Object.entries(outputs)
    .map(([key, value]) => `${key}=${String(value)}\n`)
    .join('');
  await appendFile(process.env.GITHUB_OUTPUT, lines, 'utf8');
}

function runNpm(args, options = {}) {
  const executable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return execFileSync(executable, args, {
    stdio: options.encoding ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    ...options,
  });
}

function runNode(args, options = {}) {
  return execFileSync(process.execPath, args, { stdio: 'inherit', ...options });
}
