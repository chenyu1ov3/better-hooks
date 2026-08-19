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
  <a href="https://github.com/chenyu1ov3/better-hooks/actions/workflows/ci.yml"><img src="https://github.com/chenyu1ov3/better-hooks/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-0f766e" alt="MIT license" /></a>
  <img src="https://img.shields.io/badge/React-19-087ea4" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6" alt="Strict TypeScript" />
</p>

> [!IMPORTANT]
> Better Hooks is in preview. The `better-hook` package has not been published
> to npm yet; verified installation instructions will arrive with the first release.

## Guarantees

- React 19 and strict TypeScript
- ESM-only, explicit exports, and `sideEffects: false`
- No runtime dependencies beyond the React peer dependency
- SSR-safe imports with explicit Client Component boundaries
- Focused direct-entry imports for every Hook
- Bilingual documentation and runnable examples

## Included Hooks

| Area             | Hooks                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------- |
| State            | `useBoolean`, `useToggle`, `useInput`, `useControllableState`, `usePrevious`, `useLatest`   |
| Scheduling       | `useDebounce`, `useDebounceFn`, `useThrottle`, `useThrottleFn`, `useTimeout`, `useInterval` |
| Async and events | `useAsync`, `useEventListener`, `useClickOutside`                                           |
| Browser state    | `useMediaQuery`, `useWindowSize`, `useOnline`, `useIsMounted`, `useIsomorphicLayoutEffect`  |
| Storage          | `useStorage`, `useLocalStorage`, `useSessionStorage`                                        |

See the [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/) for API details and live examples.

## Development

Requirements: Node.js 22.18 or newer and pnpm 10.15.0.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:e2e
```

Run `pnpm docs:dev` to work on the documentation site. The publishable package
lives in `packages/hooks`, while the Next.js documentation site lives in
`apps/docs`.

## Links

- [Documentation](https://chenyu1ov3.github.io/better-hooks/)
- [Hook reference](https://chenyu1ov3.github.io/better-hooks/hooks/)
- [Contributing](.github/CONTRIBUTING.md)
- [Security](.github/SECURITY.md)
- [License](LICENSE)
