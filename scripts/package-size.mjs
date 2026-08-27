import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import ts from 'typescript';

export const DEFAULT_RAW_LIMIT = 4096;
export const DEFAULT_GZIP_LIMIT = 2048;

const RAW_LIMIT_OVERRIDES = new Map([
  // Per-subscriber projections keep initial values and codecs isolated while
  // sharing one commit-owned raw storage channel and native listener.
  ['./use-local-storage', 9216],
  ['./use-session-storage', 9216],
  // Error observers and cleanup guards add a small, intentional amount of
  // runtime code to these callback-oriented entries.
  ['./use-async', 5120],
  ['./use-click-outside', 5120],
  ['./use-debounce-fn', 5120],
  ['./use-hover', 6144],
  // Browser observer setup, stale-generation guards, and error propagation
  // intentionally keep these entries self-contained.
  ['./use-intersection-observer', 8192],
  ['./use-key-press', 9216],
  // Commit-owned query entries and symmetric listener error cleanup keep
  // abandoned renders out of the shared registry.
  ['./use-media-query', 5120],
  ['./use-resize-observer', 7168],
  ['./use-throttle-fn', 5120],
  // Stable actions, bounded reconnect cleanup, and callback error isolation
  // intentionally keep this transport entry self-contained.
  ['./use-websocket', 14336],
]);

const GZIP_LIMIT_OVERRIDES = new Map([
  ['./use-local-storage', 3072],
  ['./use-session-storage', 3072],
  ['./use-key-press', 3072],
  ['./use-websocket', 3072],
]);

export async function measureDirectEntries({
  packageDirectory,
  packageExports,
  configuredRawLimit,
  configuredGzipLimit,
}) {
  const defaultRawLimit = readPositiveNumber(
    configuredRawLimit ?? String(DEFAULT_RAW_LIMIT),
    'raw byte limit',
  );
  const defaultGzipLimit = readPositiveNumber(
    configuredGzipLimit ?? String(DEFAULT_GZIP_LIMIT),
    'gzip byte limit',
  );
  const rows = [];

  for (const [subpath, descriptor] of Object.entries(packageExports)) {
    if (!subpath.startsWith('./use-')) continue;
    const target = typeof descriptor === 'string' ? descriptor : descriptor?.import;
    if (typeof target !== 'string') continue;

    const graph = await readModuleGraph(path.resolve(packageDirectory, target));
    const rawLimit = configuredRawLimit
      ? defaultRawLimit
      : (RAW_LIMIT_OVERRIDES.get(subpath) ?? defaultRawLimit);
    // Preserve the package check's existing override behavior when only the
    // gzip environment limit is customized.
    const gzipLimit = configuredRawLimit
      ? defaultGzipLimit
      : (GZIP_LIMIT_OVERRIDES.get(subpath) ?? defaultGzipLimit);

    rows.push({
      entry: subpath,
      modules: graph.modules,
      bytes: graph.contents.byteLength,
      gzip: gzipSync(graph.contents).byteLength,
      brotli: brotliCompressSync(graph.contents).byteLength,
      rawLimit,
      gzipLimit,
    });
  }

  return { defaultRawLimit, defaultGzipLimit, rows };
}

export async function measureExport({ packageDirectory, descriptor }) {
  const target = typeof descriptor === 'string' ? descriptor : descriptor?.import;
  if (typeof target !== 'string') {
    throw new TypeError('The package export is missing an import target.');
  }

  const graph = await readModuleGraph(path.resolve(packageDirectory, target));
  return {
    modules: graph.modules,
    bytes: graph.contents.byteLength,
    gzip: gzipSync(graph.contents).byteLength,
    brotli: brotliCompressSync(graph.contents).byteLength,
  };
}

export async function readModuleGraph(entry) {
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
