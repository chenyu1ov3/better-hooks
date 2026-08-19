# better-hook

React 19-first, concurrent-safe Hooks primitives with near-zero runtime dependencies.

The package is ESM-only and exposes the root and individual Hook entry points:

```ts
import { useToggle } from 'better-hook';
import { useDebounce } from 'better-hook/use-debounce';
```

React is a peer dependency. Every runtime Hook entry is a Client Component
boundary and preserves the `"use client"` directive. Server Components may
pass serializable values to components that use these Hooks, and may import the
package's public types with `import type`.

Direct Hook entries are the preferred choice for the smallest initial module graph.
The package is ESM-only and supports Node.js 22+ tooling and React
`>=19.0.0 <20.0.0`.

## Hook examples

Every direct entry includes a complete English and Chinese Markdown example.

| Entry                          | English                                                       | 中文                                                             |
| ------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `use-async`                    | [Example](src/use-async/examples/basic.md)                    | [示例](src/use-async/examples/basic.zh-CN.md)                    |
| `use-boolean`                  | [Example](src/use-boolean/examples/basic.md)                  | [示例](src/use-boolean/examples/basic.zh-CN.md)                  |
| `use-click-outside`            | [Example](src/use-click-outside/examples/basic.md)            | [示例](src/use-click-outside/examples/basic.zh-CN.md)            |
| `use-controllable-state`       | [Example](src/use-controllable-state/examples/basic.md)       | [示例](src/use-controllable-state/examples/basic.zh-CN.md)       |
| `use-debounce`                 | [Example](src/use-debounce/examples/basic.md)                 | [示例](src/use-debounce/examples/basic.zh-CN.md)                 |
| `use-debounce-fn`              | [Example](src/use-debounce-fn/examples/basic.md)              | [示例](src/use-debounce-fn/examples/basic.zh-CN.md)              |
| `use-event-listener`           | [Example](src/use-event-listener/examples/basic.md)           | [示例](src/use-event-listener/examples/basic.zh-CN.md)           |
| `use-input`                    | [Example](src/use-input/examples/basic.md)                    | [示例](src/use-input/examples/basic.zh-CN.md)                    |
| `use-interval`                 | [Example](src/use-interval/examples/basic.md)                 | [示例](src/use-interval/examples/basic.zh-CN.md)                 |
| `use-is-mounted`               | [Example](src/use-is-mounted/examples/basic.md)               | [示例](src/use-is-mounted/examples/basic.zh-CN.md)               |
| `use-isomorphic-layout-effect` | [Example](src/use-isomorphic-layout-effect/examples/basic.md) | [示例](src/use-isomorphic-layout-effect/examples/basic.zh-CN.md) |
| `use-latest`                   | [Example](src/use-latest/examples/basic.md)                   | [示例](src/use-latest/examples/basic.zh-CN.md)                   |
| `use-local-storage`            | [Example](src/use-local-storage/examples/basic.md)            | [示例](src/use-local-storage/examples/basic.zh-CN.md)            |
| `use-media-query`              | [Example](src/use-media-query/examples/basic.md)              | [示例](src/use-media-query/examples/basic.zh-CN.md)              |
| `use-online`                   | [Example](src/use-online/examples/basic.md)                   | [示例](src/use-online/examples/basic.zh-CN.md)                   |
| `use-previous`                 | [Example](src/use-previous/examples/basic.md)                 | [示例](src/use-previous/examples/basic.zh-CN.md)                 |
| `use-session-storage`          | [Example](src/use-session-storage/examples/basic.md)          | [示例](src/use-session-storage/examples/basic.zh-CN.md)          |
| `use-storage`                  | [Example](src/use-storage/examples/basic.md)                  | [示例](src/use-storage/examples/basic.zh-CN.md)                  |
| `use-throttle`                 | [Example](src/use-throttle/examples/basic.md)                 | [示例](src/use-throttle/examples/basic.zh-CN.md)                 |
| `use-throttle-fn`              | [Example](src/use-throttle-fn/examples/basic.md)              | [示例](src/use-throttle-fn/examples/basic.zh-CN.md)              |
| `use-timeout`                  | [Example](src/use-timeout/examples/basic.md)                  | [示例](src/use-timeout/examples/basic.zh-CN.md)                  |
| `use-toggle`                   | [Example](src/use-toggle/examples/basic.md)                   | [示例](src/use-toggle/examples/basic.zh-CN.md)                   |
| `use-window-size`              | [Example](src/use-window-size/examples/basic.md)              | [示例](src/use-window-size/examples/basic.zh-CN.md)              |
