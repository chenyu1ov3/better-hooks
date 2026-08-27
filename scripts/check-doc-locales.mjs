import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = path.resolve(process.argv[2] ?? '.');
const contentRoot = path.join(workspaceRoot, 'apps', 'docs', 'content');
const architectureRoot = path.join(workspaceRoot, 'docs', 'architecture');
const localeRoots = {
  en: path.join(contentRoot, 'en'),
  'zh-CN': path.join(contentRoot, 'zh-CN'),
};
const failures = [];
const documents = Object.fromEntries(
  await Promise.all(
    Object.entries(localeRoots).map(async ([locale, root]) => {
      const standard = await collect(root);
      const architecture = await collectArchitecture(locale);
      for (const [relativePath, source] of architecture) {
        if (standard.has(relativePath)) {
          failures.push(`${relativePath}: duplicate documentation source`);
        } else {
          standard.set(relativePath, source);
        }
      }
      return [locale, standard];
    }),
  ),
);
const paths = new Set([...documents.en.keys(), ...documents['zh-CN'].keys()]);

for (const relativePath of [...paths].sort()) {
  const english = documents.en.get(relativePath);
  const chinese = documents['zh-CN'].get(relativePath);

  if (!english) failures.push(`${relativePath}: missing English document`);
  if (!chinese) failures.push(`${relativePath}: missing Simplified Chinese document`);
  if (!english || !chinese) continue;

  const englishOrder = frontmatterValue(english, 'order');
  const chineseOrder = frontmatterValue(chinese, 'order');
  if (englishOrder !== chineseOrder) {
    failures.push(
      `${relativePath}: frontmatter order differs (${englishOrder ?? 'unset'} / ${chineseOrder ?? 'unset'})`,
    );
  }
}

if (failures.length > 0) {
  console.error(
    ['Documentation locale checks failed:', ...failures.map((item) => `- ${item}`)].join('\n'),
  );
  process.exitCode = 1;
} else {
  console.log(`Validated ${paths.size} paired English and Simplified Chinese documents.`);
}

async function collect(root) {
  const files = new Map();
  await walk(root, root, files);
  return files;
}

async function collectArchitecture(locale) {
  const files = new Map();
  const localeSuffix = locale === 'zh-CN' ? '.zh-CN' : '';
  const readme = path.join(architectureRoot, `README${localeSuffix}.md`);
  const readmeSource = await readUtf8(readme).catch((error) => {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  });
  if (readmeSource) files.set('docs/architecture/index.mdx', readmeSource);
  await walkArchitecture(architectureRoot, architectureRoot, files, locale);
  return files;
}

async function walk(root, directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(root, absolutePath, files);
      continue;
    }
    if (!entry.name.endsWith('.mdx')) continue;

    files.set(
      path.relative(root, absolutePath).replaceAll(path.sep, '/'),
      await readUtf8(absolutePath),
    );
  }
}

async function walkArchitecture(root, directory, files, locale) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walkArchitecture(root, absolutePath, files, locale);
      continue;
    }

    const suffix = locale === 'zh-CN' ? '.zh-CN.mdx' : '.mdx';
    if (!entry.name.endsWith(suffix)) continue;
    if (locale === 'en' && entry.name.endsWith('.zh-CN.mdx')) continue;
    const relativeDirectory = path.dirname(path.relative(root, absolutePath));
    const name = entry.name.slice(0, -suffix.length);
    const canonical = path
      .join('docs', 'architecture', relativeDirectory, `${name}.mdx`)
      .replaceAll(path.sep, '/');
    files.set(canonical, await readUtf8(absolutePath));
  }
}

async function readUtf8(file) {
  const bytes = await readFile(file);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function frontmatterValue(source, key) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
  if (!frontmatter) return undefined;
  const line = frontmatter.split(/\r?\n/).find((candidate) => candidate.startsWith(`${key}:`));
  return line?.slice(key.length + 1).trim() || undefined;
}
