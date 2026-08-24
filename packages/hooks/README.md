# better-hooks

React 19-first, concurrent-safe Hooks primitives with near-zero runtime dependencies.

The package is ESM-only and exposes the root and individual Hook entry points:

```ts
import { useToggle } from 'better-hooks';
import { useDebounce } from 'better-hooks/use-debounce';
```

React is a peer dependency. Every runtime Hook entry is a Client Component
boundary and preserves the `"use client"` directive. Server Components may
pass serializable values to components that use these Hooks, and may import the
package's public types with `import type`.

Direct Hook entries are the preferred choice for the smallest initial module graph.
The package is ESM-only and supports Node.js 22.18+ tooling and React
`>=19.0.0 <20.0.0`.

## Hook examples

The repository maintains a complete English and Chinese Markdown example for
every direct entry. Examples are linked to GitHub and are not included in the
published runtime package.

| Entry                          | English                                                                                                                           | 中文                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `use-async`                    | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-async/examples/basic.md)                    | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-async/examples/basic.zh-CN.md)                    |
| `use-boolean`                  | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-boolean/examples/basic.md)                  | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-boolean/examples/basic.zh-CN.md)                  |
| `use-click-outside`            | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-click-outside/examples/basic.md)            | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-click-outside/examples/basic.zh-CN.md)            |
| `use-controllable-state`       | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-controllable-state/examples/basic.md)       | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-controllable-state/examples/basic.zh-CN.md)       |
| `use-debounce`                 | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-debounce/examples/basic.md)                 | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-debounce/examples/basic.zh-CN.md)                 |
| `use-debounce-fn`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-debounce-fn/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-debounce-fn/examples/basic.zh-CN.md)              |
| `use-document-visibility`      | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-document-visibility/examples/basic.md)      | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-document-visibility/examples/basic.zh-CN.md)      |
| `use-event-listener`           | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-event-listener/examples/basic.md)           | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-event-listener/examples/basic.zh-CN.md)           |
| `use-hover`                    | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-hover/examples/basic.md)                    | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-hover/examples/basic.zh-CN.md)                    |
| `use-input`                    | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-input/examples/basic.md)                    | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-input/examples/basic.zh-CN.md)                    |
| `use-interval`                 | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-interval/examples/basic.md)                 | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-interval/examples/basic.zh-CN.md)                 |
| `use-is-mounted`               | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-is-mounted/examples/basic.md)               | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-is-mounted/examples/basic.zh-CN.md)               |
| `use-isomorphic-layout-effect` | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-isomorphic-layout-effect/examples/basic.md) | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-isomorphic-layout-effect/examples/basic.zh-CN.md) |
| `use-key-press`                | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-key-press/examples/basic.md)                | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-key-press/examples/basic.zh-CN.md)                |
| `use-latest`                   | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-latest/examples/basic.md)                   | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-latest/examples/basic.zh-CN.md)                   |
| `use-local-storage`            | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-local-storage/examples/basic.md)            | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-local-storage/examples/basic.zh-CN.md)            |
| `use-lock-fn`                  | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-lock-fn/examples/basic.md)                  | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-lock-fn/examples/basic.zh-CN.md)                  |
| `use-memoized-fn`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-memoized-fn/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-memoized-fn/examples/basic.zh-CN.md)              |
| `use-media-query`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-media-query/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-media-query/examples/basic.zh-CN.md)              |
| `use-online`                   | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-online/examples/basic.md)                   | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-online/examples/basic.zh-CN.md)                   |
| `use-previous`                 | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-previous/examples/basic.md)                 | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-previous/examples/basic.zh-CN.md)                 |
| `use-reset-state`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-reset-state/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-reset-state/examples/basic.zh-CN.md)              |
| `use-safe-state`               | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-safe-state/examples/basic.md)               | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-safe-state/examples/basic.zh-CN.md)               |
| `use-session-storage`          | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-session-storage/examples/basic.md)          | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-session-storage/examples/basic.zh-CN.md)          |
| `use-storage`                  | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-storage/examples/basic.md)                  | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-storage/examples/basic.zh-CN.md)                  |
| `use-throttle`                 | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-throttle/examples/basic.md)                 | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-throttle/examples/basic.zh-CN.md)                 |
| `use-throttle-fn`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-throttle-fn/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-throttle-fn/examples/basic.zh-CN.md)              |
| `use-timeout`                  | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-timeout/examples/basic.md)                  | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-timeout/examples/basic.zh-CN.md)                  |
| `use-toggle`                   | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-toggle/examples/basic.md)                   | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-toggle/examples/basic.zh-CN.md)                   |
| `use-window-size`              | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-window-size/examples/basic.md)              | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-window-size/examples/basic.zh-CN.md)              |
| `use-unmounted-ref`            | [Example](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-unmounted-ref/examples/basic.md)            | [示例](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-unmounted-ref/examples/basic.zh-CN.md)            |
