#!/usr/bin/env node

import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const packageName = 'better-hooks';
const defaultTitle = 'Version Packages';
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

export function createVersionPrTitle(plan, targetPackage = packageName) {
  if (!plan || !Array.isArray(plan.releases)) {
    throw new Error('Changesets status must contain a releases array.');
  }

  const releases = plan.releases.filter(
    (release) => release?.name === targetPackage && release.type !== 'none',
  );
  if (releases.length === 0) return defaultTitle;
  if (releases.length !== 1) {
    throw new Error(`Changesets status contains multiple releases for ${targetPackage}.`);
  }

  const version = releases[0].newVersion;
  if (typeof version !== 'string' || !versionPattern.test(version)) {
    throw new Error(`Changesets produced an invalid ${targetPackage} version.`);
  }
  return `chore: release ${targetPackage} v${version}`;
}

async function main() {
  const filename = process.argv[2]?.trim();
  if (!filename) throw new Error('Pass the Changesets status JSON path.');
  const plan = JSON.parse(await readFile(path.resolve(filename), 'utf8'));
  const title = createVersionPrTitle(plan);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `title=${title}\n`, 'utf8');
  }
  console.log(title);
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
