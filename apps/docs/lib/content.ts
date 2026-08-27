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
  sourcePath: string;
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
const architectureRoot = path.join(workspaceRoot, 'docs', 'architecture');
const architecturePrefix = ['docs', 'architecture'] as const;

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

type DocumentSource = { file: string; sourcePath: string };

function isInside(root: string, file: string) {
  const relative = path.relative(root, file);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function documentSource(file: string): DocumentSource {
  return {
    file,
    sourcePath: path.relative(workspaceRoot, file).replaceAll(path.sep, '/'),
  };
}

function contentSourceFor(locale: Locale, slug: string[]) {
  const root = path.resolve(localeDirectory(locale));
  const candidates = slug.length
    ? [`${path.join(...slug)}.mdx`, path.join(...slug, 'index.mdx')]
    : ['index.mdx'];

  for (const relative of candidates) {
    const file = path.resolve(root, relative);
    if (!isInside(root, file)) continue;
    if (fs.existsSync(file)) return documentSource(file);
  }
  return null;
}

function architectureSourceFor(locale: Locale, slug: string[]) {
  if (slug[0] !== architecturePrefix[0] || slug[1] !== architecturePrefix[1]) return null;

  const relativeSlug = slug.slice(architecturePrefix.length);
  const localeSuffix = locale === 'zh-CN' ? '.zh-CN' : '';
  const relative = relativeSlug.length
    ? path.join(...relativeSlug.slice(0, -1), `${relativeSlug.at(-1)}${localeSuffix}.mdx`)
    : `README${localeSuffix}.md`;
  const root = path.resolve(architectureRoot);
  const file = path.resolve(root, relative);
  if (!isInside(root, file)) return null;
  return fs.existsSync(file) ? documentSource(file) : null;
}

function sourceFor(locale: Locale, slug: string[]) {
  return contentSourceFor(locale, slug) ?? architectureSourceFor(locale, slug);
}

export function readDocument(locale: Locale, slug: string[]): DocumentRecord | null {
  const source = sourceFor(locale, slug);
  if (!source) return null;
  const parsed = matter(fs.readFileSync(source.file, 'utf8'));
  const result = documentMetaSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new Error(`Invalid frontmatter in ${source.sourcePath}: ${result.error.message}`);
  }
  return {
    ...result.data,
    locale,
    slug,
    source: parsed.content,
    sourcePath: source.sourcePath,
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

function architectureSlugs(locale: Locale) {
  const localeSuffix = locale === 'zh-CN' ? '.zh-CN' : '';
  const slugs: string[][] = [];
  if (fs.existsSync(path.join(architectureRoot, `README${localeSuffix}.md`))) {
    slugs.push([...architecturePrefix]);
  }

  function collect(directory: string, prefix: string[] = []) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collect(full, [...prefix, entry.name]);
        continue;
      }

      const suffix = locale === 'zh-CN' ? '.zh-CN.mdx' : '.mdx';
      if (!entry.name.endsWith(suffix)) continue;
      if (locale === 'en' && entry.name.endsWith('.zh-CN.mdx')) continue;
      const name = entry.name.slice(0, -suffix.length);
      slugs.push([...architecturePrefix, ...prefix, ...(name === 'index' ? [] : [name])]);
    }
  }

  collect(architectureRoot);
  return slugs;
}

export function listDocuments(locale?: Locale) {
  const localeList: Locale[] = locale ? [locale] : ['en', 'zh-CN'];
  return localeList
    .flatMap((current) => {
      const slugs = [...walk(localeDirectory(current)), ...architectureSlugs(current)];
      const uniqueSlugs = new Map(slugs.map((slug) => [slug.join('/'), slug]));
      return [...uniqueSlugs.values()].map((slug) => readDocument(current, slug));
    })
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
