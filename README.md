<p align="center">
  <img src="apps/docs/public/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks logo" />
</p>

<h1 align="center">Better Hooks</h1>

<p align="center">
  Small, type-safe React Hooks with predictable lifecycle behavior.
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e" alt="MIT license" /></a>
</p>

> [!IMPORTANT]
> Better Hooks is in preview, and `better-hooks@0.2.0` is available on npm.

```sh
pnpm add better-hooks
```

## Included Hooks

| Area             | Hooks                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| State            | `useBoolean`, `useToggle`, `useInput`, `useControllableState`, `usePrevious`, `useLatest`, `useSafeState`, `useResetState`, `useMemoizedFn` |
| Scheduling       | `useDebounce`, `useDebounceFn`, `useThrottle`, `useThrottleFn`, `useTimeout`, `useInterval`                                                 |
| Async and events | `useAsync`, `useLockFn`, `useEventListener`, `useClickOutside`                                                                              |
| Browser state    | `useMediaQuery`, `useWindowSize`, `useOnline`, `useDocumentVisibility`, `useKeyPress`, `useHover`                                           |
| Lifecycle        | `useIsMounted`, `useIsomorphicLayoutEffect`, `useUnmountedRef`                                                                              |
| Storage          | `useStorage`, `useLocalStorage`, `useSessionStorage`                                                                                        |

See the [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/) for API details and live examples.

## Links

- [Documentation](https://chenyu1ov3.github.io/better-hooks/)
- [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/)
- [Contributing](.github/CONTRIBUTING.md)
- [Security](.github/SECURITY.md)
- [License](LICENSE)
