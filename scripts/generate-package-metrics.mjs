import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { measureDirectEntries, measureExport } from './package-size.mjs';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDirectory = path.join(workspaceRoot, 'packages', 'hooks');
const outputPath = path.join(workspaceRoot, 'apps', 'docs', 'generated', 'package-metrics.json');
const manifest = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'));
const { defaultRawLimit, defaultGzipLimit, rows } = await measureDirectEntries({
  packageDirectory,
  packageExports: manifest.exports,
});
const root = await measureExport({
  packageDirectory,
  descriptor: manifest.exports['.'],
});

const entries = rows
  .map((row) => ({
    entry: `${manifest.name}/${row.entry.slice(2)}`,
    modules: row.modules,
    rawBytes: row.bytes,
    gzipBytes: row.gzip,
    brotliBytes: row.brotli,
    rawBudgetBytes: row.rawLimit,
    gzipBudgetBytes: row.gzipLimit,
  }))
  .sort((left, right) => left.entry.localeCompare(right.entry));
const gzipValues = entries.map((entry) => entry.gzipBytes).sort((left, right) => left - right);
const fingerprint = createHash('sha256')
  .update(JSON.stringify({ root, entries }))
  .digest('hex')
  .slice(0, 12);
const metrics = {
  schemaVersion: 1,
  package: manifest.name,
  version: manifest.version,
  buildFingerprint: fingerprint,
  measurement: {
    format: 'ESM',
    target: 'ES2022',
    minified: false,
    externals: 'react, react-dom',
    graph: 'Unique reachable built JavaScript modules per export',
    gzip: 'Node.js zlib default gzip settings',
    brotli: 'Node.js zlib default Brotli settings',
  },
  budgets: {
    defaultRawBytes: defaultRawLimit,
    defaultGzipBytes: defaultGzipLimit,
  },
  summary: {
    directEntries: entries.length,
    withinBudget: entries.filter(
      (entry) => entry.rawBytes <= entry.rawBudgetBytes && entry.gzipBytes <= entry.gzipBudgetBytes,
    ).length,
    medianGzipBytes: gzipValues[Math.floor(gzipValues.length / 2)] ?? 0,
    p90GzipBytes: gzipValues[Math.max(0, Math.ceil(gzipValues.length * 0.9) - 1)] ?? 0,
  },
  root: {
    entry: manifest.name,
    modules: root.modules,
    rawBytes: root.bytes,
    gzipBytes: root.gzip,
    brotliBytes: root.brotli,
  },
  entries,
};
const output = `${JSON.stringify(metrics, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = await readFile(outputPath, 'utf8').catch(() => '');
  if (current !== output) {
    console.error(
      `Package metrics are stale. Run: node ${path.relative(workspaceRoot, fileURLToPath(import.meta.url))}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `Validated package metrics for ${metrics.version} (${metrics.summary.directEntries} direct entries).`,
    );
  }
} else {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');
  console.log(
    `Generated ${path.relative(workspaceRoot, outputPath)} for ${metrics.version} (${metrics.summary.directEntries} direct entries).`,
  );
}
