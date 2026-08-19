import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const workspaceRoot = path.resolve(process.argv[2] ?? '.');
const contentRoot = path.join(workspaceRoot, 'apps', 'docs', 'content');
const localeRoots = {
  en: path.join(contentRoot, 'en'),
  'zh-CN': path.join(contentRoot, 'zh-CN'),
};

const documents = Object.fromEntries(
  await Promise.all(
    Object.entries(localeRoots).map(async ([locale, root]) => [locale, await collect(root)]),
  ),
);
const failures = [];
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

async function walk(root, directory, files) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(root, absolutePath, files);
      continue;
    }
    if (!entry.name.endsWith('.mdx')) continue;

    const bytes = await readFile(absolutePath);
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    files.set(path.relative(root, absolutePath).replaceAll(path.sep, '/'), source);
  }
}

function frontmatterValue(source, key) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1];
  if (!frontmatter) return undefined;
  const line = frontmatter.split(/\r?\n/).find((candidate) => candidate.startsWith(`${key}:`));
  return line?.slice(key.length + 1).trim() || undefined;
}
