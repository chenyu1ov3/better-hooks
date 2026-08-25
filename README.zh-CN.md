<p align="center">
  <img src="apps/docs/public/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks 标志" />
</p>

<h1 align="center">Better Hooks</h1>

<p align="center">
  面向 React 19 的类型安全 Hooks，具备可预测的资源清理和明确的 SSR 边界。
</p>

<p align="center">
  <a href="README.md">English</a> | 简体中文
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/better-hooks"><img src="https://img.shields.io/npm/v/better-hooks?color=0f766e&amp;label=npm" alt="npm 版本" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e" alt="MIT 许可证" /></a>
</p>

```sh
pnpm add better-hooks
```

## 包含的 Hooks

公开 API 包含 30 个 Hook。

| 分类       | Hooks                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态       | `useBoolean`, `useToggle`, `useInput`, `useControllableState`, `usePrevious`, `useLatest`, `useSafeState`, `useResetState`, `useMemoizedFn` |
| 调度       | `useDebounce`, `useDebounceFn`, `useThrottle`, `useThrottleFn`, `useTimeout`, `useInterval`                                                 |
| 异步与事件 | `useAsync`, `useLockFn`, `useEventListener`, `useClickOutside`                                                                              |
| 浏览器状态 | `useMediaQuery`, `useWindowSize`, `useOnline`, `useDocumentVisibility`, `useKeyPress`, `useHover`                                           |
| 生命周期   | `useIsMounted`, `useIsomorphicLayoutEffect`, `useUnmountedRef`                                                                              |
| 存储       | `useLocalStorage`, `useSessionStorage`                                                                                                      |

API 说明和在线示例请查看 [Hook 参考文档](https://chenyu1ov3.github.io/better-hooks/zh/hooks/)。

## 相关链接

- [文档](https://chenyu1ov3.github.io/better-hooks/zh/)
- [Hook 参考文档](https://chenyu1ov3.github.io/better-hooks/zh/hooks/)
- [npm 包](https://www.npmjs.com/package/better-hooks)
- [更新日志](packages/hooks/CHANGELOG.md)
- [贡献指南](.github/CONTRIBUTING.md)
- [安全策略](.github/SECURITY.md)
- [许可证](LICENSE)
