import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { constants } from 'node:fs';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import ts from 'typescript';

const packageDirectory = path.resolve(process.argv[2] ?? 'packages/hooks');
const manifestPath = path.join(packageDirectory, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const packageExports = manifest.exports;

if (!packageExports || typeof packageExports !== 'object' || Array.isArray(packageExports)) {
  throw new TypeError(`${path.relative(process.cwd(), manifestPath)} must define package exports.`);
}

const failures = [];
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

const configuredRawLimit = process.env.BETTER_HOOKS_MAX_ENTRY_BYTES;
const defaultRawLimit = readPositiveNumber(configuredRawLimit ?? '4096', 'raw byte limit');
const gzipLimit = readPositiveNumber(
  process.env.BETTER_HOOKS_MAX_ENTRY_GZIP_BYTES ?? '2048',
  'gzip byte limit',
);
const rawLimitOverrides = new Map([
  ['./use-local-storage', 6144],
  ['./use-session-storage', 6144],
  ['./use-storage', 6144],
  // Error observers and cleanup guards add a small, intentional amount of
  // runtime code to these callback-oriented entries.
  ['./use-async', 5120],
  ['./use-click-outside', 5120],
  ['./use-debounce-fn', 5120],
  ['./use-hover', 6144],
  ['./use-key-press', 9216],
  ['./use-throttle-fn', 5120],
]);
const gzipLimitOverrides = new Map([['./use-key-press', 3072]]);
const rows = [];

for (const [subpath, descriptor] of Object.entries(packageExports)) {
  if (!subpath.startsWith('./use-')) continue;
  const target = typeof descriptor === 'string' ? descriptor : descriptor?.import;
  if (typeof target !== 'string') continue;

  const graph = await readModuleGraph(path.resolve(packageDirectory, target));
  const rawLimit = configuredRawLimit
    ? defaultRawLimit
    : (rawLimitOverrides.get(subpath) ?? defaultRawLimit);
  const entryGzipLimit = configuredRawLimit
    ? gzipLimit
    : (gzipLimitOverrides.get(subpath) ?? gzipLimit);
  const row = {
    entry: subpath,
    modules: graph.modules,
    bytes: graph.contents.byteLength,
    gzip: gzipSync(graph.contents).byteLength,
    brotli: brotliCompressSync(graph.contents).byteLength,
    rawLimit,
    gzipLimit: entryGzipLimit,
  };
  rows.push(row);
  if (row.bytes > rawLimit || row.gzip > entryGzipLimit) {
    failures.push(
      `${subpath}: ${row.bytes}/${rawLimit} raw bytes, ${row.gzip}/${entryGzipLimit} gzip bytes`,
    );
  }
}

console.table(rows);
exitOnFailures(`Direct entries exceed a size budget (default gzip limit: ${gzipLimit} bytes)`);
console.log(`Validated size budgets for ${rows.length} direct entries.`);

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'better-hooks-pack-'));
const tarball = path.join(tempDirectory, 'better-hook.tgz');

try {
  console.log('Packing the published artifact...');
  runPnpm(['pack', '--out', tarball], { cwd: packageDirectory });
  await access(tarball, constants.R_OK);

  console.log('Running publint against the packed artifact...');
  runPnpm(['exec', 'publint', tarball]);

  console.log('Running Are The Types Wrong against the packed artifact...');
  runPnpm(['exec', 'attw', '--profile', 'esm-only', tarball]);

  console.log('Package artifact validation passed.');
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
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

async function readModuleGraph(entry) {
  const visited = new Set();
  const chunks = [];

  async function visit(file) {
    const resolved = path.resolve(file);
    if (visited.has(resolved)) return;
    visited.add(resolved);

    const contents = await readFile(resolved);
    chunks.push(contents, Buffer.from('\n'));
    const source = ts.createSourceFile(
      resolved,
      contents.toString('utf8'),
      ts.ScriptTarget.Latest,
      false,
      ts.ScriptKind.JS,
    );
    const dependencies = [];
    for (const statement of source.statements) {
      if (
        (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier &&
        ts.isStringLiteral(statement.moduleSpecifier) &&
        statement.moduleSpecifier.text.startsWith('.')
      ) {
        dependencies.push(path.resolve(path.dirname(resolved), statement.moduleSpecifier.text));
      }
    }
    for (const dependency of dependencies) await visit(dependency);
  }

  await visit(entry);
  return { contents: Buffer.concat(chunks), modules: visited.size };
}

function readPositiveNumber(value, label) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new TypeError(`The ${label} must be a positive number.`);
  }
  return parsed;
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
