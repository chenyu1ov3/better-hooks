import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { canonicalJson, readTarGzip } from './package-artifact.mjs';
import { measureDirectEntries } from './package-size.mjs';

const packageDirectory = path.resolve(process.argv[2] ?? 'packages/hooks');
const manifestPath = path.join(packageDirectory, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const packageExports = manifest.exports;
const failures = [];
const expectedDescription =
  'Type-safe, SSR-aware React 19 Hooks with stable callbacks and direct ESM entry points.';
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
const repositoryFileUrl = 'https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks';

if (manifest.name !== 'better-hooks') {
  failures.push(`package name must be better-hooks, received ${JSON.stringify(manifest.name)}`);
}

await checkPublishedMetadata();

if (!packageExports || typeof packageExports !== 'object' || Array.isArray(packageExports)) {
  throw new TypeError(`${path.relative(process.cwd(), manifestPath)} must define package exports.`);
}

const directExports = Object.keys(packageExports).filter((subpath) => subpath.startsWith('./use-'));
if (Object.hasOwn(packageExports, './use-storage')) {
  failures.push('the removed ./use-storage aggregate export must not be published');
}
if (directExports.length !== 37) {
  failures.push(
    `public API must contain exactly 37 direct Hook entries; received ${directExports.length}`,
  );
}

let importCount = 0;
let clientEntryCount = 0;

for (const [subpath, descriptor] of Object.entries(packageExports)) {
  if (typeof descriptor === 'string') {
    const readable = await checkFile(subpath, 'default', descriptor);
    if (subpath !== './package.json' && descriptor.endsWith('.js') && readable) {
      await checkClientDirective(subpath, descriptor);
      clientEntryCount += 1;
    }
    continue;
  }

  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    failures.push(`${subpath} must map to a string or a conditional export object`);
    continue;
  }

  const typesTarget = descriptor.types;
  const importTarget = descriptor.import;
  if (typeof typesTarget !== 'string') failures.push(`${subpath} is missing a types target`);
  else await checkFile(subpath, 'types', typesTarget);

  if (typeof importTarget !== 'string') {
    failures.push(`${subpath} is missing an import target`);
    continue;
  }

  const importReadable = await checkFile(subpath, 'import', importTarget);
  if (!importReadable) continue;

  try {
    await import(pathToFileURL(path.resolve(packageDirectory, importTarget)).href);
    importCount += 1;
  } catch (error) {
    failures.push(`${subpath} cannot be imported: ${formatError(error)}`);
  }

  if (subpath !== './package.json' && importTarget.endsWith('.js')) {
    await checkClientDirective(subpath, importTarget);
    clientEntryCount += 1;
  }
}

exitOnFailures('Package export checks failed');
console.log(
  `Validated ${Object.keys(packageExports).length} exports, ${importCount} ESM imports, and ${clientEntryCount} client entries.`,
);

const { defaultGzipLimit: gzipLimit, rows } = await measureDirectEntries({
  packageDirectory,
  packageExports,
  configuredRawLimit: process.env.BETTER_HOOKS_MAX_ENTRY_BYTES,
  configuredGzipLimit: process.env.BETTER_HOOKS_MAX_ENTRY_GZIP_BYTES,
});

for (const row of rows) {
  if (row.bytes > row.rawLimit || row.gzip > row.gzipLimit) {
    failures.push(
      `${row.entry}: ${row.bytes}/${row.rawLimit} raw bytes, ${row.gzip}/${row.gzipLimit} gzip bytes`,
    );
  }
}

console.table(rows);
exitOnFailures(`Direct entries exceed a size budget (default gzip limit: ${gzipLimit} bytes)`);
console.log(`Validated size budgets for ${rows.length} direct entries.`);

const configuredArtifact = process.env.BETTER_HOOKS_PACKAGE_ARTIFACT?.trim();
const tempDirectory = configuredArtifact
  ? undefined
  : await mkdtemp(path.join(os.tmpdir(), 'better-hooks-pack-'));
const tarball = configuredArtifact
  ? path.resolve(configuredArtifact)
  : path.join(tempDirectory, 'better-hooks.tgz');

try {
  if (configuredArtifact) {
    console.log(
      `Validating the existing package artifact ${path.relative(process.cwd(), tarball)}...`,
    );
  } else {
    console.log('Packing the published artifact...');
    runPnpm(['pack', '--out', tarball], { cwd: packageDirectory });
  }
  await access(tarball, constants.R_OK);
  const artifactFiles = readTarGzip(await readFile(tarball));
  const entries = [...artifactFiles.keys()];
  for (const [filename, contents] of artifactFiles) {
    if (!filename.startsWith('package/')) {
      failures.push(`Published artifact contains a file outside package/: ${filename}`);
      continue;
    }
    const relativePath = filename.slice('package/'.length);
    try {
      const candidateContents = await readFile(path.join(packageDirectory, relativePath));
      const matchesCandidate =
        relativePath === 'package.json'
          ? canonicalJson(JSON.parse(contents.toString('utf8'))) ===
            canonicalJson(JSON.parse(candidateContents.toString('utf8')))
          : contents.equals(candidateContents);
      if (!matchesCandidate) {
        failures.push(`Published artifact ${filename} differs from the built release candidate`);
      }
    } catch (error) {
      failures.push(
        `Published artifact ${filename} has no candidate source: ${formatError(error)}`,
      );
    }
  }
  const forbiddenEntries = entries.filter(
    (entry) =>
      entry.startsWith('package/src/') ||
      entry.startsWith('package/dist/use-storage') ||
      entry.endsWith('.map') ||
      /(?:^|\/)(?:__tests__|examples|node_modules)(?:\/|$)/.test(entry) ||
      /(?:^|\/)(?:tsconfig|tsdown\.config|vitest\.config)/.test(entry),
  );
  if (forbiddenEntries.length > 0) {
    failures.push(
      `Published artifact contains forbidden source or map files: ${forbiddenEntries.join(', ')}`,
    );
  }
  const requiredEntries = [
    'package/package.json',
    'package/README.md',
    'package/README.zh-CN.md',
    'package/LICENSE',
    'package/CHANGELOG.md',
    'package/assets/better-hooks-mark.svg',
    'package/dist/index.js',
    'package/dist/index.d.ts',
  ];
  const missingEntries = requiredEntries.filter((entry) => !entries.includes(entry));
  if (missingEntries.length > 0) {
    failures.push(`Published artifact is missing required files: ${missingEntries.join(', ')}`);
  }
  exitOnFailures('Published artifact content checks failed');

  console.log('Running publint against the packed artifact...');
  runPnpm(['exec', 'publint', tarball]);

  console.log('Running Are The Types Wrong against the packed artifact...');
  runPnpm(['exec', 'attw', '--profile', 'esm-only', tarball]);

  console.log('Package artifact validation passed.');
} finally {
  if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
}

async function checkPublishedMetadata() {
  if (manifest.description !== expectedDescription) {
    failures.push(`package description must be ${JSON.stringify(expectedDescription)}`);
  }
  if (JSON.stringify(manifest.keywords) !== JSON.stringify(expectedKeywords)) {
    failures.push(`package keywords must exactly match: ${expectedKeywords.join(', ')}`);
  }
  if (manifest.type !== 'module' || manifest.sideEffects !== false) {
    failures.push('published package must remain ESM-only with sideEffects set to false');
  }
  if (manifest.peerDependencies?.react !== '>=19.0.0 <20.0.0') {
    failures.push('React peer dependency must remain >=19.0.0 <20.0.0');
  }
  if (manifest.engines?.node !== '>=22.18.0') {
    failures.push('Node.js engine must remain >=22.18.0');
  }

  const publishedFiles = Array.isArray(manifest.files) ? manifest.files : [];
  for (const requiredFile of [
    'dist',
    'README.md',
    'README.zh-CN.md',
    'assets',
    'LICENSE',
    'CHANGELOG.md',
  ]) {
    if (!publishedFiles.includes(requiredFile)) {
      failures.push(`package files must include ${requiredFile}`);
    }
  }

  const englishReadme = await readRequiredText('README.md');
  const chineseReadme = await readRequiredText('README.zh-CN.md');
  const logo = await readRequiredText('assets/better-hooks-mark.svg');
  if (
    logo &&
    (!logo.includes('<svg') || !logo.includes('<title id="title">Better Hooks</title>'))
  ) {
    failures.push('assets/better-hooks-mark.svg must contain the Better Hooks SVG mark');
  }

  checkReadme(englishReadme, 'README.md', [
    logoUrl,
    `English | <a href="${repositoryFileUrl}/README.zh-CN.md">简体中文</a>`,
    '## Installation',
    '## Features',
    '**Commit-safe lifecycle work.**',
    '**Shared native work with isolated instance semantics.**',
    '## Imports',
    '## Supported environments',
    '## SSR and React Server Components',
    '## API',
    '37 Hooks',
    "from 'better-hooks'",
    "from 'better-hooks/use-debounce'",
    'https://chenyu1ov3.github.io/better-hooks/',
    'https://www.npmjs.com/package/better-hooks',
    `${repositoryFileUrl}/CHANGELOG.md`,
    `${repositoryFileUrl}/LICENSE`,
  ]);
  if (/\[English\]\(/.test(englishReadme)) {
    failures.push('README.md must render its current English language as plain text');
  }

  checkReadme(chineseReadme, 'README.zh-CN.md', [
    logoUrl,
    `<a href="${repositoryFileUrl}/README.md">English</a> | 简体中文`,
    '## 安装',
    '## 特性',
    '**提交安全的生命周期工作。**',
    '**共享原生工作，同时隔离实例语义。**',
    '## 导入',
    '## 支持环境',
    '## SSR 与 React Server Components',
    '## API',
    '37 个 Hook',
    "from 'better-hooks'",
    "from 'better-hooks/use-debounce'",
    'https://chenyu1ov3.github.io/better-hooks/zh/',
    'https://www.npmjs.com/package/better-hooks',
    `${repositoryFileUrl}/CHANGELOG.md`,
    `${repositoryFileUrl}/LICENSE`,
  ]);
  if (/\[简体中文\]\(/.test(chineseReadme)) {
    failures.push('README.zh-CN.md must render its current Chinese language as plain text');
  }

  for (const readme of [englishReadme, chineseReadme]) {
    if (/\uFFFD/.test(readme))
      failures.push('published README files must not contain replacement characters');
    if (/\buse-storage\b/i.test(readme)) {
      failures.push(
        `${readme === englishReadme ? 'README.md' : 'README.zh-CN.md'} must not mention the removed use-storage entry`,
      );
    }
    for (const subpath of Object.keys(manifest.exports ?? {}).filter((entry) =>
      entry.startsWith('./use-'),
    )) {
      if (!readme.includes(`\`${subpath.slice(2)}\``)) {
        failures.push(
          `${readme === englishReadme ? 'README.md' : 'README.zh-CN.md'} is missing ${subpath}`,
        );
      }
    }
  }
}

async function readRequiredText(relativePath) {
  try {
    return await readFile(path.join(packageDirectory, relativePath), 'utf8');
  } catch (error) {
    failures.push(`${relativePath} cannot be read: ${formatError(error)}`);
    return '';
  }
}

function checkReadme(readme, filename, requiredFragments) {
  for (const fragment of requiredFragments) {
    if (!readme.includes(fragment))
      failures.push(`${filename} is missing ${JSON.stringify(fragment)}`);
  }
}

async function checkFile(subpath, condition, target) {
  const file = path.resolve(packageDirectory, target);
  try {
    await access(file, constants.R_OK);
    return true;
  } catch {
    failures.push(`${subpath} (${condition}) is missing ${path.relative(packageDirectory, file)}`);
    return false;
  }
}

async function checkClientDirective(subpath, target) {
  const source = await readFile(path.resolve(packageDirectory, target), 'utf8');
  const withoutLeadingComments = source
    .replace(/^\uFEFF/, '')
    .replace(/^(?:\s|\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '');
  if (!/^(?:'use client'|"use client");?/.test(withoutLeadingComments)) {
    failures.push(`${subpath} -> ${target} is missing a preserved "use client" directive`);
  }
}

function runPnpm(args, options = {}) {
  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'pnpm.cmd', ...args], {
      stdio: 'inherit',
      ...options,
    });
    return;
  }

  execFileSync('pnpm', args, { stdio: 'inherit', ...options });
}

function exitOnFailures(heading) {
  if (failures.length === 0) return;
  console.error([`${heading}:`, ...failures.map((failure) => `- ${failure}`)].join('\n'));
  process.exit(1);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
