import fs from 'node:fs';
import path from 'node:path';
import { toString } from 'mdast-util-to-string';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import packageManifest from 'better-hooks/package.json';
import type { Locale } from './i18n';

export type ChangelogSection = {
  readonly title: string;
  readonly source: string;
};

export type ChangelogRelease = {
  readonly version: string;
  readonly sections: readonly ChangelogSection[];
};

type ChangelogCopy = {
  readonly eyebrow: string;
  readonly description: string;
  readonly latestRelease: string;
  readonly previousRelease: string;
  readonly viewNpm: string;
  readonly history: string;
};

type ChangelogPageData = ChangelogCopy & {
  readonly currentVersion: string;
  readonly releases: readonly ChangelogRelease[];
};

type PositionedNode = {
  readonly position?: {
    readonly start: { readonly offset?: number };
    readonly end: { readonly offset?: number };
  };
};

type ReleaseDraft = {
  version: string;
  sections: ChangelogSection[];
};

type SectionDraft = {
  title: string;
  sources: string[];
};

const semverPattern =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const changelogFooter = 'All notable changes are documented by Changesets before release.';

const workspaceRoot = fs.existsSync(path.join(process.cwd(), 'packages', 'hooks'))
  ? process.cwd()
  : path.resolve(process.cwd(), '..', '..');
const changelogPath = path.join(workspaceRoot, 'packages', 'hooks', 'CHANGELOG.md');

const copy: Record<Locale, ChangelogCopy> = {
  en: {
    eyebrow: 'Package history',
    description:
      'Every published better-hooks version and its user-facing Changeset notes, newest first.',
    latestRelease: 'Latest release',
    previousRelease: 'Previous release',
    viewNpm: 'View this version on npm',
    history: 'GitHub Release',
  },
  'zh-CN': {
    eyebrow: '版本历史',
    description: '按时间倒序展示 better-hooks 的全部已发布版本及其 Changeset 变更内容。',
    latestRelease: '最新版本',
    previousRelease: '历史版本',
    viewNpm: '在 npm 查看此版本',
    history: 'GitHub Release',
  },
};

const chineseSectionTitles: Readonly<Record<string, string>> = {
  'Major Changes': '主版本更新',
  'Minor Changes': '次版本更新',
  'Patch Changes': '补丁更新',
};

function sourceForNode(source: string, node: PositionedNode): string {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (start === undefined || end === undefined) {
    throw new Error('CHANGELOG nodes must include source offsets.');
  }
  return source.slice(start, end);
}

export function parseChangelog(source: string): ChangelogRelease[] {
  const tree = unified().use(remarkParse).parse(source);
  const releases: ChangelogRelease[] = [];
  const seenVersions = new Set<string>();
  let release: ReleaseDraft | undefined;
  let section: SectionDraft | undefined;

  const finishSection = () => {
    if (!section) return;
    if (!release) throw new Error(`CHANGELOG section "${section.title}" has no release.`);
    if (!section.sources.length) {
      throw new Error(
        `CHANGELOG section "${section.title}" for ${release.version} has no change list.`,
      );
    }
    release.sections.push({
      title: section.title,
      source: section.sources.join('\n\n'),
    });
    section = undefined;
  };

  const finishRelease = () => {
    finishSection();
    if (!release) return;
    if (!release.sections.length) {
      throw new Error(`CHANGELOG release ${release.version} has no change sections.`);
    }
    releases.push({ version: release.version, sections: release.sections });
    release = undefined;
  };

  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 2) {
      finishRelease();
      const version = toString(node).trim();
      if (!semverPattern.test(version)) {
        throw new Error(`Invalid CHANGELOG release heading: "${version}".`);
      }
      if (seenVersions.has(version)) {
        throw new Error(`Duplicate CHANGELOG release heading: ${version}.`);
      }
      seenVersions.add(version);
      release = { version, sections: [] };
      continue;
    }

    if (node.type === 'heading' && node.depth === 3) {
      finishSection();
      if (!release) {
        throw new Error(`CHANGELOG section "${toString(node).trim()}" has no release.`);
      }
      const title = toString(node).trim();
      if (!title)
        throw new Error(`CHANGELOG release ${release.version} has an empty section title.`);
      section = { title, sources: [] };
      continue;
    }

    if (node.type === 'list') {
      if (!release || !section) {
        throw new Error(
          'CHANGELOG change lists must be nested under release and section headings.',
        );
      }
      section.sources.push(sourceForNode(source, node));
      continue;
    }

    if (section) {
      const text = toString(node).trim();
      if (text && text !== changelogFooter) {
        throw new Error(
          `Unsupported CHANGELOG content in ${release?.version ?? 'an unknown release'} / ${section.title}: "${text}".`,
        );
      }
    }
  }

  finishRelease();
  if (!releases.length) throw new Error('CHANGELOG must contain at least one release.');
  return releases;
}

export function readChangelog(): ChangelogRelease[] {
  return parseChangelog(fs.readFileSync(changelogPath, 'utf8'));
}

export function changelogFor(locale: Locale): ChangelogPageData {
  const releases = readChangelog();
  const currentVersion = packageManifest.version;
  if (releases[0]?.version !== currentVersion) {
    throw new Error(
      `Package version ${currentVersion} must be the first release in packages/hooks/CHANGELOG.md.`,
    );
  }
  return {
    ...copy[locale],
    currentVersion,
    releases: releases.map((release) => ({
      ...release,
      sections: release.sections.map((section) => ({
        ...section,
        title:
          locale === 'zh-CN'
            ? (chineseSectionTitles[section.title] ?? section.title)
            : section.title,
      })),
    })),
  };
}
