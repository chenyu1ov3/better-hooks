#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const versionBranch = 'changeset-release/main';
const baseBranch = 'main';
const botLogin = 'github-actions[bot]';
const requiredWorkflows = ['ci.yml', 'docs.yml'];
const shaPattern = /^[0-9a-f]{40}$/u;
const repositoryPattern = /^[0-9A-Za-z_.-]+\/[0-9A-Za-z_.-]+$/u;

function encodeRepository(repository) {
  if (!repositoryPattern.test(repository)) {
    throw new Error('GITHUB_REPOSITORY must use the owner/repository format.');
  }
  return repository.split('/').map(encodeURIComponent).join('/');
}

function parsePullRequestNumber(value) {
  if (!/^\d+$/u.test(value ?? '')) throw new Error('Pass a valid Version PR number.');
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error('Pass a valid Version PR number.');
  }
  return number;
}

export function validateVersionPullRequest(pullRequest, repository, expectedNumber) {
  if (!pullRequest || typeof pullRequest !== 'object') {
    throw new Error('GitHub returned an invalid pull request.');
  }

  const checks = [
    [pullRequest.number === expectedNumber, `PR #${expectedNumber} was not returned by GitHub.`],
    [pullRequest.state === 'open', `PR #${expectedNumber} is not open.`],
    [pullRequest.user?.login === botLogin, `PR #${expectedNumber} was not opened by ${botLogin}.`],
    [pullRequest.user?.type === 'Bot', `PR #${expectedNumber} does not have a bot author.`],
    [
      pullRequest.head?.repo?.full_name === repository,
      `PR #${expectedNumber} does not originate from ${repository}.`,
    ],
    [
      pullRequest.head?.ref === versionBranch,
      `PR #${expectedNumber} does not use ${versionBranch}.`,
    ],
    [
      pullRequest.base?.repo?.full_name === repository,
      `PR #${expectedNumber} does not target ${repository}.`,
    ],
    [pullRequest.base?.ref === baseBranch, `PR #${expectedNumber} does not target ${baseBranch}.`],
    [
      shaPattern.test(pullRequest.head?.sha ?? ''),
      `PR #${expectedNumber} has an invalid head SHA.`,
    ],
  ];

  const failed = checks.find(([condition]) => !condition);
  if (failed) throw new Error(failed[1]);

  return {
    headBranch: pullRequest.head.ref,
    headSha: pullRequest.head.sha,
  };
}

export function findPullRequestRun(payload, { headBranch, headSha }) {
  if (!payload || !Array.isArray(payload.workflow_runs)) {
    throw new Error('GitHub returned an invalid workflow run list.');
  }

  return payload.workflow_runs
    .filter(
      (run) =>
        run?.event === 'pull_request' &&
        run.head_branch === headBranch &&
        run.head_sha === headSha &&
        run.actor?.login === botLogin,
    )
    .sort((left, right) => Number(right.id) - Number(left.id))[0];
}

export function createGitHubRequest({ token, apiUrl = 'https://api.github.com' }) {
  if (!token) throw new Error('GH_TOKEN is required to approve Version PR runs.');

  return async function githubRequest(pathname, { method = 'GET' } = {}) {
    const response = await fetch(`${apiUrl.replace(/\/$/u, '')}${pathname}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(
        `GitHub API ${method} ${pathname} failed (${response.status}): ${body || response.statusText}`,
      );
    }
    return body ? JSON.parse(body) : undefined;
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForPullRequestRun({
  request,
  repositoryPath,
  workflow,
  identity,
  maxAttempts,
  pollIntervalMs,
  sleep,
}) {
  const query = new URLSearchParams({
    event: 'pull_request',
    branch: identity.headBranch,
    per_page: '20',
  });
  const pathname = `/repos/${repositoryPath}/actions/workflows/${encodeURIComponent(workflow)}/runs?${query}`;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const run = findPullRequestRun(await request(pathname), identity);
    if (run) return run;
    if (attempt < maxAttempts) await sleep(pollIntervalMs);
  }

  throw new Error(
    `${workflow} did not create a pull_request run for ${identity.headSha} within the approval window.`,
  );
}

export async function approveVersionPrRuns({
  repository,
  pullRequestNumber,
  token,
  apiUrl,
  request,
  workflows = requiredWorkflows,
  maxAttempts = 30,
  pollIntervalMs = 2_000,
  sleep = delay,
}) {
  const repositoryPath = encodeRepository(repository);
  const number = parsePullRequestNumber(String(pullRequestNumber));
  const callGitHub = request ?? createGitHubRequest({ token, apiUrl });
  const pullRequest = await callGitHub(`/repos/${repositoryPath}/pulls/${number}`);
  const identity = validateVersionPullRequest(pullRequest, repository, number);

  return Promise.all(
    workflows.map(async (workflow) => {
      const run = await waitForPullRequestRun({
        request: callGitHub,
        repositoryPath,
        workflow,
        identity,
        maxAttempts,
        pollIntervalMs,
        sleep,
      });

      if (run.conclusion !== 'action_required') {
        return { workflow, runId: run.id, action: 'already-approved' };
      }

      await callGitHub(`/repos/${repositoryPath}/actions/runs/${run.id}/approve`, {
        method: 'POST',
      });
      return { workflow, runId: run.id, action: 'approved' };
    }),
  );
}

async function main() {
  const results = await approveVersionPrRuns({
    repository: process.env.GITHUB_REPOSITORY ?? '',
    pullRequestNumber: process.argv[2] ?? '',
    token: process.env.GH_TOKEN,
    apiUrl: process.env.GITHUB_API_URL,
  });

  for (const result of results) {
    console.log(`${result.workflow}: ${result.action} run ${result.runId}`);
  }
}

function isMainModule() {
  if (!process.argv[1]) return false;
  return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
}

if (isMainModule()) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
