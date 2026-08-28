# Changelog

## 1.2.0

### Minor Changes

- fa16955: Add `useCounter`, `useMap`, `useSet`, and `useCopyToClipboard` with stable actions, SSR-safe boundaries, and observable clipboard errors.

## 1.1.2

### Patch Changes

- 77fcdc4: Clarify the package feature contract around committed lifecycle work, SSR snapshots, shared browser channels, per-subscriber storage semantics, error observability, and ESM distribution.
- f5f0cbc: Keep storage and media-query registries free of abandoned render state, rebind `useKeyPress` when its event list changes, and report media listener setup and cleanup failures through `onError`.

## 1.1.1

### Patch Changes

- 81c1bf3: Publish the WebSocket and observer hooks under a reusable npm version because 1.1.0 is tombstoned in the registry.

## 1.1.0

### Minor Changes

- f5d7bda: Add `useWebSocket`, `useIntersectionObserver`, and `useResizeObserver` with SSR-safe snapshots, stable actions, and observable error handling.

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
