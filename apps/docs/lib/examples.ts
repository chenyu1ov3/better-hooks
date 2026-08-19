import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { apiEntries } from './hooks';
import type { Locale } from './i18n';

const workspaceRoot = fs.existsSync(path.join(process.cwd(), 'apps', 'docs'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..', '..');

const repository = 'https://github.com/chenyu1ov3/better-hooks';

type Fence = {
  marker: '`' | '~';
  length: number;
  language: string;
};

export type ExampleSource = {
  code: string;
  filename: string;
  sourceUrl: string;
};

function openingFence(line: string): Fence | null {
  let start = 0;
  while (start < line.length && line[start] === ' ' && start < 4) start += 1;
  if (start > 3) return null;

  const marker = line[start];
  if (marker !== '`' && marker !== '~') return null;

  let end = start;
  while (line[end] === marker) end += 1;
  const length = end - start;
  if (length < 3) return null;

  const info = line.slice(end).trim();
  if (marker === '`' && info.includes('`')) return null;
  const language = info.split(/\s+/, 1)[0]?.toLowerCase() ?? '';
  return { marker, length, language };
}

function closesFence(line: string, fence: Fence): boolean {
  let start = 0;
  while (start < line.length && line[start] === ' ' && start < 4) start += 1;
  if (start > 3 || line[start] !== fence.marker) return false;

  let end = start;
  while (line[end] === fence.marker) end += 1;
  return end - start >= fence.length && line.slice(end).trim() === '';
}

export function extractExampleCode(markdown: string): string | null {
  let fence: Fence | null = null;
  let capture = false;
  let code: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    if (!fence) {
      fence = openingFence(line);
      if (!fence) continue;
      capture = fence.language === 'tsx' || fence.language === 'jsx';
      code = [];
      continue;
    }

    if (closesFence(line, fence)) {
      if (capture) return code.join('\n');
      fence = null;
      capture = false;
      code = [];
      continue;
    }

    if (capture) code.push(line);
  }

  return null;
}

export function readExampleSource(slug: string, locale: Locale): ExampleSource | null {
  if (!apiEntries.some((entry) => entry.slug === slug)) return null;
  const basename = locale === 'zh-CN' ? 'basic.zh-CN.md' : 'basic.md';
  const relativePath = path.posix.join('packages', 'hooks', 'src', slug, 'examples', basename);
  const file = path.join(workspaceRoot, ...relativePath.split('/'));
  if (!fs.existsSync(file)) return null;

  const code = extractExampleCode(fs.readFileSync(file, 'utf8'));
  if (code === null) return null;

  return {
    code,
    filename: relativePath,
    sourceUrl: `${repository}/blob/main/${relativePath}`,
  };
}
