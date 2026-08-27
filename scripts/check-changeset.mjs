#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const changesetPattern = /^\.changeset\/(?!readme\.md$).+\.md$/i;

export function parseNameStatus(output) {
  return output
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => {
      const [status = '', ...paths] = line.split('\t');
      return { status, paths: paths.map(normalizePath) };
    });
}

export function isPublishablePackagePath(filename) {
  const normalized = normalizePath(filename);
  if (!normalized.startsWith('packages/hooks/')) return false;

  const relative = normalized.slice('packages/hooks/'.length);
  if (
    relative === 'package.json' ||
    relative === 'README.md' ||
    relative === 'README.zh-CN.md' ||
    relative === 'LICENSE' ||
    relative === 'CHANGELOG.md' ||
    relative === 'tsdown.config.ts' ||
    relative === 'tsconfig.build.json' ||
    relative.startsWith('assets/')
  ) {
    return true;
  }
  if (!relative.startsWith('src/')) return false;
  if (relative.includes('/__tests__/') || relative.includes('/examples/')) return false;
  return !/(?:^|\/)\S+\.(?:test|spec)(?:-d)?\.[cm]?[jt]sx?$/u.test(relative);
}

export function evaluateChangesetPolicy(entries) {
  const publishableFiles = [
    ...new Set(entries.flatMap((entry) => entry.paths).filter(isPublishablePackagePath)),
  ].sort();
  const changesets = entries
    .filter((entry) => !entry.status.startsWith('D'))
    .flatMap((entry) => entry.paths)
    .filter((filename) => changesetPattern.test(filename));

  return {
    required: publishableFiles.length > 0,
    satisfied: publishableFiles.length === 0 || changesets.length > 0,
    publishableFiles,
    changesets: [...new Set(changesets)].sort(),
  };
}

export function readChanges(base) {
  const output = execFileSync(
    'git',
    ['diff', '--name-status', '--find-renames', `${base}...HEAD`],
    { encoding: 'utf8' },
  );
  return parseNameStatus(output);
}

export function resolveBaseArgument(arguments_, baseRef) {
  const explicit = arguments_.find((argument) => argument !== '--' && argument.trim())?.trim();
  if (explicit) return explicit;
  const normalizedBaseRef = baseRef?.trim();
  return normalizedBaseRef ? `origin/${normalizedBaseRef}` : undefined;
}

export function checkChangeset(base) {
  if (!base) {
    throw new Error(
      'A base revision is required. Pass one explicitly or set GITHUB_BASE_REF in a pull request.',
    );
  }

  const result = evaluateChangesetPolicy(readChanges(base));
  if (!result.required) {
    console.log('No publishable better-hooks files changed; no Changeset is required.');
    return result;
  }
  if (result.satisfied) {
    console.log(`Changeset found for publishable changes: ${result.changesets.join(', ')}`);
    return result;
  }

  throw new Error(
    [
      'Publishable better-hooks files changed without an added or updated Changeset:',
      ...result.publishableFiles.map((filename) => `- ${filename}`),
      '',
      'Run `pnpm changeset` and commit the generated Markdown file.',
    ].join('\n'),
  );
}

function normalizePath(filename) {
  return filename.split(path.sep).join('/').replaceAll('\\', '/');
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  try {
    checkChangeset(resolveBaseArgument(process.argv.slice(2), process.env.GITHUB_BASE_REF));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
