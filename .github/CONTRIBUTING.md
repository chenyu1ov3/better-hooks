# Contributing

Install Node.js 22.12 or newer and pnpm 10.15.0, then run:

```sh
pnpm install
pnpm check
```

For documentation UI changes, also run:

```sh
pnpm test:e2e
```

Keep each Hook, its tests, and examples together under its Hook directory. Use
Oxlint and Oxfmt for static analysis and formatting. Public package changes
must include a Changeset unless they are documentation-only changes.
