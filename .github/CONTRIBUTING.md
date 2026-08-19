# Contributing

## Setup

Install Node.js 22.12 or newer and pnpm 10.15.0, then install the locked
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
Prettier configuration. Keep the published `better-hook` package ESM-only with
explicit exports and no import-time browser or React side effects.

Public package changes must include a Changeset unless they are
documentation-only changes. Create one with:

```sh
pnpm changeset
```

Use patch Changesets for compatible fixes, minor Changesets for backward-compatible
features, and major Changesets for breaking public API changes.
