<p align="center">
  <img src="https://chenyu1ov3.github.io/better-hooks/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks logo" />
</p>

<h1 align="center">better-hooks</h1>

<p align="center">Type-safe, SSR-aware React 19 Hooks with stable callbacks and direct ESM entry points.</p>

<p align="center">
  English | <a href="https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/README.zh-CN.md">简体中文</a>
</p>

## Installation

```bash
pnpm add better-hooks
```

`react` is a peer dependency. Install React 19 in the consuming application.

## Features

- **Commit-safe lifecycle work.** Subscriptions, timers, and asynchronous tasks start after commit, clean up symmetrically, and tolerate React Strict Mode replay. Abandoned renders do not claim shared external-store registries.
- **Latest committed callbacks with stable actions.** Long-lived work calls the latest committed handler without rebuilding native subscriptions; returned actions keep their identity wherever the API contract permits it.
- **Deterministic SSR and explicit RSC boundaries.** Runtime entries preserve `"use client"`, imports have no browser side effects, and browser-facing Hooks define stable server snapshots.
- **Shared native work with isolated instance semantics.** Equal browser queries and storage keys can share native channels, while storage initial values, codecs, decoded values, and errors remain scoped to each subscriber.
- **Observable errors and explicit cancellation.** `onError` observers do not swallow the original failure, and stale or cancelled asynchronous work follows each Hook's documented suppression rules.
- **Auditable ESM distribution.** All 37 Hooks ship typed root and direct exports with `sideEffects: false`, package-level size budgets, and no runtime dependency beyond the React peer.

## Imports

Use the root entry when several Hooks are needed together:

```tsx
import { useDebounce, useToggle } from 'better-hooks';
```

Use a direct entry when you want the smallest initial module graph:

```tsx
import { useDebounce } from 'better-hooks/use-debounce';
```

Both styles expose the same typed APIs. Direct entries are explicit package exports; imports from `better-hooks/dist/*` are not public API.

## Supported environments

| Area            | Support                                                       |
| --------------- | ------------------------------------------------------------- |
| React           | `>=19.0.0 <20.0.0`                                            |
| Node.js tooling | `>=22.18.0`                                                   |
| Module format   | ESM only                                                      |
| Types           | Bundled TypeScript declarations                               |
| Rendering       | Client Components, SSR, and React Server Component boundaries |

Browser-facing Hooks require the corresponding browser API after hydration. Their documented initial values keep server rendering deterministic.

## SSR and React Server Components

Every runtime Hook entry preserves a `"use client"` directive. Call Hooks from Client Components; Server Components may pass serializable props to those components and may import public types with `import type`.

Importing the package does not access `window`, register listeners, or perform other browser or React side effects. Browser listeners and timers are created by Hook effects and cleaned up with the component lifecycle. See each Hook page for its exact SSR fallback and error behavior.

## API

The package contains 37 Hooks and a root entry that re-exports the Hook APIs.

| Category             | Hooks                                                                                                                                                                                                          | Direct entries                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State (11)           | `useToggle`, `useBoolean`, `useControllableState`, `usePrevious`, `useLatest`, `useMemoizedFn`, `useSafeState`, `useResetState`, `useCounter`, `useMap`, `useSet`                                              | `use-toggle`, `use-boolean`, `use-controllable-state`, `use-previous`, `use-latest`, `use-memoized-fn`, `use-safe-state`, `use-reset-state`, `use-counter`, `use-map`, `use-set`                                                    |
| Async and timing (9) | `useDebounce`, `useThrottle`, `useDebounceFn`, `useThrottleFn`, `useTimeout`, `useInterval`, `useAsync`, `useLockFn`, `useWebSocket`                                                                           | `use-debounce`, `use-throttle`, `use-debounce-fn`, `use-throttle-fn`, `use-timeout`, `use-interval`, `use-async`, `use-lock-fn`, `use-websocket`                                                                                    |
| Browser and DOM (11) | `useEventListener`, `useClickOutside`, `useMediaQuery`, `useWindowSize`, `useOnline`, `useDocumentVisibility`, `useKeyPress`, `useHover`, `useIntersectionObserver`, `useResizeObserver`, `useCopyToClipboard` | `use-event-listener`, `use-click-outside`, `use-media-query`, `use-window-size`, `use-online`, `use-document-visibility`, `use-key-press`, `use-hover`, `use-intersection-observer`, `use-resize-observer`, `use-copy-to-clipboard` |
| Forms (1)            | `useInput`                                                                                                                                                                                                     | `use-input`                                                                                                                                                                                                                         |
| Storage (2)          | `useLocalStorage`, `useSessionStorage`                                                                                                                                                                         | `use-local-storage`, `use-session-storage`                                                                                                                                                                                          |
| Lifecycle (3)        | `useIsMounted`, `useIsomorphicLayoutEffect`, `useUnmountedRef`                                                                                                                                                 | `use-is-mounted`, `use-isomorphic-layout-effect`, `use-unmounted-ref`                                                                                                                                                               |

The complete signatures, behavior contracts, examples, and SSR notes are available in the [documentation](https://chenyu1ov3.github.io/better-hooks/).

## Links

- [Documentation](https://chenyu1ov3.github.io/better-hooks/)
- [npm](https://www.npmjs.com/package/better-hooks)
- [Changelog](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/CHANGELOG.md)
- [License](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/LICENSE)
- [GitHub](https://github.com/chenyu1ov3/better-hooks)

## License

[MIT](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/LICENSE)
