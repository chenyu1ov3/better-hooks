<p align="center">
  <img src="apps/docs/public/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks logo" />
</p>

<h1 align="center">Better Hooks</h1>

<p align="center">
  Type-safe React 19 Hooks with predictable cleanup and explicit SSR boundaries.
</p>

<p align="center">
  English | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/better-hooks"><img src="https://img.shields.io/npm/v/better-hooks?color=0f766e&amp;label=npm" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e" alt="MIT license" /></a>
</p>

```sh
pnpm add better-hooks
```

## Included Hooks

The public surface contains 30 Hooks.

| Area             | Hooks                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| State            | `useBoolean`, `useToggle`, `useInput`, `useControllableState`, `usePrevious`, `useLatest`, `useSafeState`, `useResetState`, `useMemoizedFn` |
| Scheduling       | `useDebounce`, `useDebounceFn`, `useThrottle`, `useThrottleFn`, `useTimeout`, `useInterval`                                                 |
| Async and events | `useAsync`, `useLockFn`, `useEventListener`, `useClickOutside`                                                                              |
| Browser state    | `useMediaQuery`, `useWindowSize`, `useOnline`, `useDocumentVisibility`, `useKeyPress`, `useHover`                                           |
| Lifecycle        | `useIsMounted`, `useIsomorphicLayoutEffect`, `useUnmountedRef`                                                                              |
| Storage          | `useLocalStorage`, `useSessionStorage`                                                                                                      |

See the [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/) for API details and live examples.

## Links

- [Documentation](https://chenyu1ov3.github.io/better-hooks/)
- [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/)
- [npm package](https://www.npmjs.com/package/better-hooks)
- [Changelog](packages/hooks/CHANGELOG.md)
- [Security](.github/SECURITY.md)
- [License](LICENSE)
