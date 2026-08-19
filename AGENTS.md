# Repository instructions

- Use UTF-8 encoding for all files.
- Use pnpm for dependency and workspace commands.
- The published package is `better-hook`, and it is ESM-only with explicit
  package exports and `sideEffects: false`.
- Do not add import-time browser or React side effects.
- Keep each hook, its tests, and examples together under the hook directory.
- Use Oxlint and Oxfmt for static analysis and formatting; do not add ESLint or
  Prettier configuration.
- Run `pnpm check` before submitting changes when dependencies are installed.
- Run `pnpm test:e2e` for documentation UI changes.
