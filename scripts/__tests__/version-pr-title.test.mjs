import { describe, expect, it } from 'vitest';
import { createVersionPrTitle } from '../version-pr-title.mjs';

describe('Version PR title', () => {
  it('includes the planned better-hooks version', () => {
    expect(
      createVersionPrTitle({
        releases: [
          { name: '@better-hooks/docs', type: 'none', newVersion: '0.0.1' },
          { name: 'better-hooks', type: 'patch', newVersion: '1.2.4' },
        ],
      }),
    ).toBe('chore: release better-hooks v1.2.4');
  });

  it('supports prerelease versions', () => {
    expect(
      createVersionPrTitle({
        releases: [{ name: 'better-hooks', type: 'minor', newVersion: '2.0.0-rc.3' }],
      }),
    ).toBe('chore: release better-hooks v2.0.0-rc.3');
  });

  it('keeps the Changesets fallback when no package release is pending', () => {
    expect(
      createVersionPrTitle({
        releases: [{ name: '@better-hooks/docs', type: 'none', newVersion: '0.0.1' }],
      }),
    ).toBe('Version Packages');
  });

  it('rejects malformed or ambiguous release plans', () => {
    expect(() => createVersionPrTitle({})).toThrow('releases array');
    expect(() =>
      createVersionPrTitle({
        releases: [
          { name: 'better-hooks', type: 'patch', newVersion: '1.2.4' },
          { name: 'better-hooks', type: 'minor', newVersion: '1.3.0' },
        ],
      }),
    ).toThrow('multiple releases');
    expect(() =>
      createVersionPrTitle({
        releases: [{ name: 'better-hooks', type: 'patch', newVersion: 'next' }],
      }),
    ).toThrow('invalid better-hooks version');
  });
});
