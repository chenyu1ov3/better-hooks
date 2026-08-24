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

Every push to `main` runs the quality, compatibility, and documentation E2E
jobs, then deploys the static documentation to GitHub Pages. A pending Changeset
also creates or updates the `Version Packages` pull request.

Merging that pull request publishes `better-hooks` through the release job. The
repository must have an Actions secret named `NPM_TOKEN` with publish access
before merging it; documentation deployment does not depend on that secret.
