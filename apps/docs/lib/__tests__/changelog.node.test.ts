import { describe, expect, it } from 'vitest';
import { changelogFor, parseChangelog } from '../changelog';

const fixture = `# Changelog

## 2.0.0-rc.1

### Minor Changes

- abc1234: Add \`useThing\`.

## 1.0.0

### Major Changes

- def5678: Freeze the public API across
  multiple source lines.

All notable changes are documented by Changesets before release.
`;

describe('changelog history', () => {
  it('parses every release and preserves Changeset Markdown in source order', () => {
    expect(parseChangelog(fixture)).toEqual([
      {
        version: '2.0.0-rc.1',
        sections: [{ title: 'Minor Changes', source: '- abc1234: Add `useThing`.' }],
      },
      {
        version: '1.0.0',
        sections: [
          {
            title: 'Major Changes',
            source: '- def5678: Freeze the public API across\n  multiple source lines.',
          },
        ],
      },
    ]);
  });

  it('rejects malformed releases instead of silently dropping change content', () => {
    expect(() => parseChangelog(`# Changelog\n\n## next\n\n### Changes\n\n- not-semver`)).toThrow(
      'Invalid CHANGELOG release heading',
    );
    expect(() =>
      parseChangelog(`# Changelog\n\n## 1.0.0\n\n### Changes\n\nA list is required.`),
    ).toThrow('Unsupported CHANGELOG content');
    expect(() => parseChangelog(`# Changelog\n\n## 1.0.0\n\n## 1.0.0`)).toThrow(
      'has no change sections',
    );
  });

  it('loads the complete package history and localizes structural labels', () => {
    const english = changelogFor('en');
    const chinese = changelogFor('zh-CN');

    const versions = english.releases.map(({ version }) => version);
    const historicalEnglish = english.releases.find(({ version }) => version === '1.1.1');
    const historicalChinese = chinese.releases.find(({ version }) => version === '1.1.1');

    expect(versions[0]).toBe(english.currentVersion);
    expect(versions).toEqual(expect.arrayContaining(['1.1.1', '1.1.0', '1.0.0', '0.2.0']));
    expect(new Set(versions).size).toBe(versions.length);
    expect(historicalEnglish?.sections[0]?.source).toContain('tombstoned in the registry');
    expect(historicalChinese?.sections[0]?.title).toBe('补丁更新');
    expect(historicalChinese?.sections[0]?.source).toBe(historicalEnglish?.sections[0]?.source);
  });
});
