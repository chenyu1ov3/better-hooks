import { describe, expect, it, vi } from 'vitest';
import {
  approveVersionPrRuns,
  findPullRequestRun,
  validateVersionPullRequest,
} from '../approve-version-pr-runs.mjs';

const repository = 'chenyu1ov3/better-hooks';
const headSha = '6b30c3ae907a46c56093cdbb0f6162435e58292e';

function createPullRequest() {
  return {
    number: 24,
    state: 'open',
    user: { login: 'github-actions[bot]', type: 'Bot' },
    head: {
      ref: 'changeset-release/main',
      sha: headSha,
      repo: { full_name: repository },
    },
    base: {
      ref: 'main',
      repo: { full_name: repository },
    },
  };
}

function createRun(overrides = {}) {
  return {
    id: 100,
    event: 'pull_request',
    status: 'completed',
    conclusion: 'action_required',
    head_branch: 'changeset-release/main',
    head_sha: headSha,
    actor: { login: 'github-actions[bot]' },
    ...overrides,
  };
}

describe('Version PR workflow approval', () => {
  it('accepts only the expected same-repository bot Version PR', () => {
    expect(validateVersionPullRequest(createPullRequest(), repository, 24)).toEqual({
      headBranch: 'changeset-release/main',
      headSha,
    });
  });

  it.each([
    ['author', (pullRequest) => (pullRequest.user.login = 'someone-else'), 'not opened by'],
    ['author type', (pullRequest) => (pullRequest.user.type = 'User'), 'bot author'],
    [
      'head repository',
      (pullRequest) => (pullRequest.head.repo.full_name = 'fork/repo'),
      'originate',
    ],
    ['head branch', (pullRequest) => (pullRequest.head.ref = 'release'), 'does not use'],
    ['base branch', (pullRequest) => (pullRequest.base.ref = 'develop'), 'target main'],
    ['head SHA', (pullRequest) => (pullRequest.head.sha = 'invalid'), 'invalid head SHA'],
  ])('rejects an unexpected %s', (_name, mutate, message) => {
    const pullRequest = createPullRequest();
    mutate(pullRequest);
    expect(() => validateVersionPullRequest(pullRequest, repository, 24)).toThrow(message);
  });

  it('selects the newest native bot run for the exact Version PR head', () => {
    const run = findPullRequestRun(
      {
        workflow_runs: [
          createRun({ id: 101, event: 'workflow_dispatch' }),
          createRun({ id: 102, head_sha: 'a'.repeat(40) }),
          createRun({ id: 103, actor: { login: 'someone-else' } }),
          createRun({ id: 104 }),
          createRun({ id: 105 }),
        ],
      },
      { headBranch: 'changeset-release/main', headSha },
    );

    expect(run.id).toBe(105);
  });

  it('polls for and approves both required action_required runs', async () => {
    const calls = [];
    const listAttempts = new Map();
    const request = vi.fn(async (pathname, options = {}) => {
      calls.push([pathname, options]);
      if (pathname.endsWith('/pulls/24')) return createPullRequest();
      if (pathname.includes('/actions/workflows/')) {
        const workflow = pathname.includes('ci.yml') ? 'ci.yml' : 'docs.yml';
        const attempt = (listAttempts.get(workflow) ?? 0) + 1;
        listAttempts.set(workflow, attempt);
        return {
          workflow_runs:
            attempt === 1 ? [] : [createRun({ id: workflow === 'ci.yml' ? 201 : 202 })],
        };
      }
      if (pathname.endsWith('/approve')) return {};
      throw new Error(`Unexpected request: ${pathname}`);
    });
    const sleep = vi.fn(async () => {});

    await expect(
      approveVersionPrRuns({
        repository,
        pullRequestNumber: 24,
        request,
        maxAttempts: 2,
        pollIntervalMs: 1,
        sleep,
      }),
    ).resolves.toEqual([
      { workflow: 'ci.yml', runId: 201, action: 'approved' },
      { workflow: 'docs.yml', runId: 202, action: 'approved' },
    ]);

    expect(sleep).toHaveBeenCalledTimes(2);
    expect(
      calls.filter(([, options]) => options.method === 'POST').map(([pathname]) => pathname),
    ).toEqual([
      '/repos/chenyu1ov3/better-hooks/actions/runs/201/approve',
      '/repos/chenyu1ov3/better-hooks/actions/runs/202/approve',
    ]);
  });

  it('does not reapprove native runs that have already started', async () => {
    const request = vi.fn(async (pathname) => {
      if (pathname.endsWith('/pulls/24')) return createPullRequest();
      if (pathname.includes('/actions/workflows/')) {
        return { workflow_runs: [createRun({ status: 'in_progress', conclusion: null })] };
      }
      throw new Error(`Unexpected request: ${pathname}`);
    });

    await expect(
      approveVersionPrRuns({ repository, pullRequestNumber: 24, request }),
    ).resolves.toEqual([
      { workflow: 'ci.yml', runId: 100, action: 'already-approved' },
      { workflow: 'docs.yml', runId: 100, action: 'already-approved' },
    ]);
    expect(request).toHaveBeenCalledTimes(3);
  });
});
