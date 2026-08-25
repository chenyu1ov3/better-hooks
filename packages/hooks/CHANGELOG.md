# Changelog

## 1.0.0

### Major Changes

- b3dbdd4: Freeze the 1.0 public API around 30 direct Hook entries. The aggregate
  `better-hooks/use-storage` export is removed; import `useLocalStorage` from
  `better-hooks/use-local-storage` and `useSessionStorage` from
  `better-hooks/use-session-storage` instead. Keyboard filter arrays now
  represent alternatives only; use strings such as `ctrl+s` for chords. Error
  observers can no longer replace the original thrown error or rejected promise
  when the observer itself fails.

## 0.2.0

### Minor Changes

- 2272ed9: Add eight hook primitives: memoized callbacks, safe and resettable state, unmount tracking, document visibility, keyboard shortcuts, hover tracking, and locked async actions. Extend existing scheduling and browser Hooks with observable error handling and cleanup-before-propagation semantics.

### Patch Changes

- 2abc6ec: Harden Hook behavior across async cancellation, controlled state, scheduling, DOM, browser state, and storage edge cases. Add broader runtime, SSR, type, and per-file coverage checks, and publish bilingual Markdown examples for every Hook entry.

All notable changes are documented by Changesets before release.
