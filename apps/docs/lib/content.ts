import fs from 'node:fs';
import path from 'node:path';
import GithubSlugger from 'github-slugger';
import matter from 'gray-matter';
import { z } from 'zod';
import type { Locale } from './i18n';
import { hrefFor } from './paths';

export { hrefFor, oppositeLocale } from './paths';

const documentMetaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.coerce.number().optional(),
  section: z.string().optional(),
  kind: z.enum(['docs', 'hook', 'page']).optional(),
});

export type DocumentMeta = z.infer<typeof documentMetaSchema>;

export type Heading = {
  id: string;
  text: string;
  level: 2 | 3;
};

export type DocumentRecord = DocumentMeta & {
  locale: Locale;
  slug: string[];
  source: string;
  headings: Heading[];
};

export type SearchEntry = {
  locale: Locale;
  title: string;
  description: string;
  href: string;
  section?: string;
  headings: string[];
};

const workspaceRoot = fs.existsSync(path.join(process.cwd(), 'apps', 'docs'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..', '..');
const contentRoot = path.join(workspaceRoot, 'apps', 'docs', 'content');

function localeDirectory(locale: Locale) {
  return path.join(contentRoot, locale);
}

function plainHeading(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim();
}

export function extractHeadings(source: string): Heading[] {
  const slugger = new GithubSlugger();
  const headings: Heading[] = [];
  for (const line of source.split(/\r?\n/)) {
    const match = /^(##|###)\s+(.+?)\s*#*$/.exec(line);
    if (!match) continue;
    const text = plainHeading(match[2]);
    if (!text) continue;
    headings.push({
      id: slugger.slug(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }
  return headings;
}

function fileFor(locale: Locale, slug: string[]) {
  const root = path.resolve(localeDirectory(locale));
  const candidates = slug.length
    ? [`${path.join(...slug)}.mdx`, path.join(...slug, 'index.mdx')]
    : ['index.mdx'];

  for (const relative of candidates) {
    const file = path.resolve(root, relative);
    const fromRoot = path.relative(root, file);
    if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) continue;
    if (fs.existsSync(file)) return file;
  }
  return null;
}

export function readDocument(locale: Locale, slug: string[]): DocumentRecord | null {
  const file = fileFor(locale, slug);
  if (!file) return null;
  const parsed = matter(fs.readFileSync(file, 'utf8'));
  const result = documentMetaSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(
      `Invalid frontmatter in ${path.relative(workspaceRoot, file)}: ${result.error.message}`,
    );
  }
  return {
    ...result.data,
    locale,
    slug,
    source: parsed.content,
    headings: extractHeadings(parsed.content),
  };
}

function walk(directory: string, prefix: string[] = []): string[][] {
  if (!fs.existsSync(directory)) return [];
  const slugs: string[][] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      slugs.push(...walk(full, [...prefix, entry.name]));
    } else if (entry.name.endsWith('.mdx')) {
      const name = entry.name.slice(0, -4);
      slugs.push(name === 'index' ? prefix : [...prefix, name]);
    }
  }
  return slugs;
}

export function listDocuments(locale?: Locale) {
  const localeList: Locale[] = locale ? [locale] : ['en', 'zh-CN'];
  return localeList
    .flatMap((current) => walk(localeDirectory(current)).map((slug) => readDocument(current, slug)))
    .filter((document): document is DocumentRecord => document !== null)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title));
}

export function searchIndex(locale: Locale): SearchEntry[] {
  return listDocuments(locale).map((document) => ({
    locale,
    title: document.title,
    description: document.description,
    href: hrefFor(locale, document.slug),
    ...(document.section ? { section: document.section } : {}),
    headings: document.headings.map((heading) => heading.text),
  }));
}
