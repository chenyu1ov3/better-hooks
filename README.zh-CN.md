<p align="center">
  <img src="apps/docs/public/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks 标志" />
</p>

<h1 align="center">Better Hooks</h1>

<p align="center">
  小巧、类型安全，并具备可预测生命周期行为的 React Hooks。
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="https://github.com/chenyu1ov3/better-hooks/actions/workflows/ci.yml"><img src="https://github.com/chenyu1ov3/better-hooks/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI 状态" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e" alt="MIT 许可证" /></a>
  <img src="https://img.shields.io/badge/React-19-087ea4" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="严格 TypeScript" />
</p>

> [!IMPORTANT]
> Better Hooks 目前处于预览阶段，`better-hook` 尚未发布到 npm；经过验证的安装说明将在首次发布时补充。

## 包含的 Hooks

| 分类       | Hooks                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------- |
| 状态       | `useBoolean`, `useToggle`, `useInput`, `useControllableState`, `usePrevious`, `useLatest`   |
| 调度       | `useDebounce`, `useDebounceFn`, `useThrottle`, `useThrottleFn`, `useTimeout`, `useInterval` |
| 异步与事件 | `useAsync`, `useEventListener`, `useClickOutside`                                           |
| 浏览器状态 | `useMediaQuery`, `useWindowSize`, `useOnline`, `useIsMounted`, `useIsomorphicLayoutEffect`  |
| 存储       | `useStorage`, `useLocalStorage`, `useSessionStorage`                                        |

API 说明和在线示例请查看 [Hook 参考文档](https://chenyu1ov3.github.io/better-hooks/zh/hooks/)。

## 相关链接

- [文档](https://chenyu1ov3.github.io/better-hooks/zh/)
- [Hook 参考文档](https://chenyu1ov3.github.io/better-hooks/zh/hooks/)
- [贡献指南](.github/CONTRIBUTING.md)
- [安全策略](.github/SECURITY.md)
- [许可证](LICENSE)
