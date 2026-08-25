# Contributing

## Setup

Install Node.js 22.18 or newer and pnpm 10.15.0, then install the locked
workspace dependencies:

```sh
pnpm install --frozen-lockfile
```

Use a focused branch and keep each change scoped to one behavior or concern.

## Validation

Run the complete local quality gate before opening a pull request:

```sh
pnpm check
```

For documentation UI or interaction changes, also run:

```sh
pnpm test:e2e
```

## Project conventions

Keep each Hook, its tests, and examples together under its Hook directory. Use
Oxlint and Oxfmt for static analysis and formatting; do not introduce ESLint or
Prettier configuration. Keep the published `better-hooks` package ESM-only with
explicit exports and no import-time browser or React side effects.

Public package changes must include a Changeset unless they are
documentation-only changes. Create one with:

```sh
pnpm changeset
```

Use patch Changesets for compatible fixes, minor Changesets for backward-compatible
features, and major Changesets for breaking public API changes.

## Release and deployment

The `CI` workflow runs quality, compatibility, and type checks. On a successful
push to `main`, Changesets creates or updates the `Version Packages` pull
request. CI never publishes npm, including for documentation-only commits.

The `Documentation` workflow builds the static site, runs Playwright E2E, and
deploys GitHub Pages on pushes to `main`. It has no npm credentials or release
permissions, so website changes cannot publish a package.

Publishing is an explicit, protected operation in `.github/workflows/release.yml`.
Run it manually with the exact candidate commit SHA, package version, and npm
channel (`next` for `1.0.0-rc.0`, `latest` for stable `1.0.0`). The workflow
checks out that SHA, validates the package and Changesets state, publishes to
the public npm registry with npm Trusted Publishing/provenance, creates or
reconciles the `better-hooks@<version>` tag and GitHub Release, and uploads the
tarball plus its SHA-256 file. The candidate SHA must equal the `github.sha` of
the dispatch run so npm provenance identifies the same commit as the artifact.
For a failure, use GitHub's **Re-run jobs** on that workflow run; a new dispatch
must target the current `main` tip. An already matching npm version is verified
rather than published twice.

The release script enforces the first-release gate against the npm registry:
before `1.0.0` exists, only `1.0.0-rc.N` prereleases and then `1.0.0` are
accepted. Do not dispatch a `0.x` version as the first formal release.

Before the first release, configure npm Trusted Publishing for owner
`chenyu1ov3`, repository `better-hooks`, workflow `release.yml`, and the
`npm-release` environment. Create that protected GitHub environment with at
least one reviewer, set Pages **Source** to **GitHub Actions**, and protect
`main` with these required checks: `Quality`, `Node 22.18.0 compatibility`,
`Node 24 compatibility`, `Type contract`, `Type contract (Windows)`, and
`Build and test documentation`. Also block force pushes and tag deletion.
Long-lived `NPM_TOKEN` and `NODE_AUTH_TOKEN` secrets are intentionally not
supported.

GitHub Packages is not configured as a second npm registry: the unscoped
`better-hooks` name is published only to npm. GitHub Release assets and Actions
artifacts provide a traceable copy of each published tarball.

For the 1.0 release candidate, run `pnpm changeset pre enter rc`, let the
Version PR produce `1.0.0-rc.0`, and dispatch the release workflow with channel
`next`. After verification, run `pnpm changeset pre exit`, merge the stable
Version PR, and dispatch channel `latest` for `1.0.0`. Deleted historical
versions `1.1.0` and `1.2.0` cannot be reused; the first post-1.0 minor release
must be `1.3.0` or newer.
