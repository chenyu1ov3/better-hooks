<p align="center">
  <img src="https://chenyu1ov3.github.io/better-hooks/better-hooks-mark.svg" width="96" height="96" alt="Better Hooks 标志" />
</p>

<h1 align="center">better-hooks</h1>

<p align="center">面向 React 19 的类型安全、兼容 SSR 的 Hooks，提供稳定回调和独立 ESM 入口。</p>

<p align="center">
  <a href="https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/README.md">English</a> | 简体中文
</p>

## 安装

```bash
pnpm add better-hooks
```

`react` 是 peer dependency，请在使用方项目中安装 React 19。

## 特性

- **提交安全的生命周期工作。** 订阅、计时器和异步任务只在 commit 后启动并对称清理，可承受 React Strict Mode 重放；被放弃的 render 不会占用共享外部状态注册表。
- **最新已提交回调与稳定操作。** 长期任务始终调用最近一次 commit 的处理函数，无需重建原生订阅；在 API 契约允许时，返回操作会保持引用稳定。
- **确定性的 SSR 与明确的 RSC 边界。** 运行时入口保留 `"use client"`，导入阶段没有浏览器副作用，依赖浏览器状态的 Hook 提供稳定的服务端快照。
- **共享原生工作，同时隔离实例语义。** 相同的浏览器查询和存储键可以复用原生通道，但存储初始值、编解码器、解码结果和错误仍归各订阅者所有。
- **可观察的错误与明确的取消规则。** `onError` 不会吞掉原始失败；过期或已取消异步任务是否被抑制，由各 Hook 的公开契约明确规定。
- **可审计的 ESM 分发。** 37 个 Hook 均提供带类型的根入口和独立入口，声明 `sideEffects: false`，受包体积预算约束，除 React peer 外没有运行时依赖。

## 导入

同时使用多个 Hook 时，可以通过根入口导入：

```tsx
import { useDebounce, useToggle } from 'better-hooks';
```

需要最小初始模块图时，可以使用独立入口：

```tsx
import { useDebounce } from 'better-hooks/use-debounce';
```

两种方式提供相同的类型化 API。独立入口均为显式 package exports；`better-hooks/dist/*` 不属于公共 API。

## 支持环境

| 范围           | 支持情况                                       |
| -------------- | ---------------------------------------------- |
| React          | `>=19.0.0 <20.0.0`                             |
| Node.js 工具链 | `>=22.18.0`                                    |
| 模块格式       | 仅 ESM                                         |
| 类型           | 内置 TypeScript 声明                           |
| 渲染方式       | 客户端组件、SSR 和 React Server Component 边界 |

依赖浏览器能力的 Hook 会在 hydration 后使用相应 API；其文档化的初始值可保证服务端渲染结果稳定。

## SSR 与 React Server Components

每个运行时 Hook 入口都会保留 `"use client"` 指令。Hook 应在客户端组件中调用；服务端组件可以向这些组件传递可序列化的 props，也可以通过 `import type` 导入公共类型。

导入包本身不会访问 `window`、注册监听器，也不会产生其他浏览器或 React 副作用。浏览器监听器和计时器只会在 Hook effect 中创建，并随组件生命周期清理。每个 Hook 页都会说明准确的 SSR 回退值和错误行为。

## API

包内包含 37 个 Hook，以及重新导出 Hook API 的根入口。

| 分类               | Hooks                                                                                                                                                                                                          | 独立入口                                                                                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 状态（11）         | `useToggle`、`useBoolean`、`useControllableState`、`usePrevious`、`useLatest`、`useMemoizedFn`、`useSafeState`、`useResetState`、`useCounter`、`useMap`、`useSet`                                              | `use-toggle`、`use-boolean`、`use-controllable-state`、`use-previous`、`use-latest`、`use-memoized-fn`、`use-safe-state`、`use-reset-state`、`use-counter`、`use-map`、`use-set`                                                    |
| 异步与计时（9）    | `useDebounce`、`useThrottle`、`useDebounceFn`、`useThrottleFn`、`useTimeout`、`useInterval`、`useAsync`、`useLockFn`、`useWebSocket`                                                                           | `use-debounce`、`use-throttle`、`use-debounce-fn`、`use-throttle-fn`、`use-timeout`、`use-interval`、`use-async`、`use-lock-fn`、`use-websocket`                                                                                    |
| 浏览器与 DOM（11） | `useEventListener`、`useClickOutside`、`useMediaQuery`、`useWindowSize`、`useOnline`、`useDocumentVisibility`、`useKeyPress`、`useHover`、`useIntersectionObserver`、`useResizeObserver`、`useCopyToClipboard` | `use-event-listener`、`use-click-outside`、`use-media-query`、`use-window-size`、`use-online`、`use-document-visibility`、`use-key-press`、`use-hover`、`use-intersection-observer`、`use-resize-observer`、`use-copy-to-clipboard` |
| 表单（1）          | `useInput`                                                                                                                                                                                                     | `use-input`                                                                                                                                                                                                                         |
| 存储（2）          | `useLocalStorage`、`useSessionStorage`                                                                                                                                                                         | `use-local-storage`、`use-session-storage`                                                                                                                                                                                          |
| 生命周期（3）      | `useIsMounted`、`useIsomorphicLayoutEffect`、`useUnmountedRef`                                                                                                                                                 | `use-is-mounted`、`use-isomorphic-layout-effect`、`use-unmounted-ref`                                                                                                                                                               |

完整的函数签名、行为契约、示例和 SSR 说明请查看[官方文档](https://chenyu1ov3.github.io/better-hooks/zh/)。

## 链接

- [官方文档](https://chenyu1ov3.github.io/better-hooks/zh/)
- [npm](https://www.npmjs.com/package/better-hooks)
- [更新日志](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/CHANGELOG.md)
- [许可证](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/LICENSE)
- [GitHub](https://github.com/chenyu1ov3/better-hooks)

## 许可证

[MIT](https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/LICENSE)
