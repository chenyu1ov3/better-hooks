import { describe, expect, it } from 'vitest';
import {
  evaluateChangesetPolicy,
  isPublishablePackagePath,
  parseNameStatus,
  resolveBaseArgument,
} from '../check-changeset.mjs';

describe('Changeset policy', () => {
  it('resolves explicit and pull-request base revisions', () => {
    expect(resolveBaseArgument(['--', 'origin/main'], 'ignored')).toBe('origin/main');
    expect(resolveBaseArgument([], 'main')).toBe('origin/main');
    expect(resolveBaseArgument(['--'], undefined)).toBeUndefined();
  });

  it.each([
    'packages/hooks/src/use-toggle/index.ts',
    'packages/hooks/src/jsx.d.ts',
    'packages/hooks/package.json',
    'packages/hooks/README.md',
    'packages/hooks/README.zh-CN.md',
    'packages/hooks/CHANGELOG.md',
    'packages/hooks/assets/better-hooks-mark.svg',
    'packages/hooks/tsdown.config.ts',
    'packages/hooks/tsconfig.build.json',
  ])('treats %s as publishable', (filename) => {
    expect(isPublishablePackagePath(filename)).toBe(true);
  });

  it.each([
    'README.md',
    'apps/docs/content/en/hooks/use-toggle.mdx',
    'packages/hooks/src/use-toggle/__tests__/use-toggle.test.ts',
    'packages/hooks/src/use-toggle/examples/basic.md',
    'packages/hooks/tsconfig.test.json',
    'scripts/check-package.mjs',
  ])('does not require a release for %s', (filename) => {
    expect(isPublishablePackagePath(filename)).toBe(false);
  });

  it('requires a Changeset for added, modified, deleted, or renamed package files', () => {
    const entries = parseNameStatus(
      [
        'M\tpackages/hooks/src/use-toggle/index.ts',
        'D\tpackages/hooks/src/use-boolean/index.ts',
        'R100\tpackages/hooks/src/old.ts\tpackages/hooks/src/new.ts',
      ].join('\n'),
    );

    expect(evaluateChangesetPolicy(entries)).toMatchObject({
      required: true,
      satisfied: false,
      publishableFiles: [
        'packages/hooks/src/new.ts',
        'packages/hooks/src/old.ts',
        'packages/hooks/src/use-boolean/index.ts',
        'packages/hooks/src/use-toggle/index.ts',
      ],
    });
  });

  it('accepts an added or updated Changeset', () => {
    const result = evaluateChangesetPolicy(
      parseNameStatus(
        ['M\tpackages/hooks/src/use-toggle/index.ts', 'A\t.changeset/calm-buttons-smile.md'].join(
          '\n',
        ),
      ),
    );

    expect(result).toMatchObject({
      required: true,
      satisfied: true,
      changesets: ['.changeset/calm-buttons-smile.md'],
    });
  });

  it('does not accept a deleted Changeset as a release plan', () => {
    const result = evaluateChangesetPolicy(
      parseNameStatus(
        ['M\tpackages/hooks/src/use-toggle/index.ts', 'D\t.changeset/consumed-plan.md'].join('\n'),
      ),
    );

    expect(result).toMatchObject({ required: true, satisfied: false, changesets: [] });
  });

  it('passes repository-only changes without a Changeset', () => {
    const result = evaluateChangesetPolicy(
      parseNameStatus('M\t.github/workflows/ci.yml\nM\tscripts/check-package.mjs'),
    );

    expect(result).toMatchObject({ required: false, satisfied: true });
  });
});
