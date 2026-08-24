type LiveCodeModule = object;
type LiveCodeModuleLoader = () => Promise<LiveCodeModule>;

const moduleLoaders = {
  'better-hook': () => import(/* webpackChunkName: "better-hook-all" */ 'better-hook'),
  'better-hook/use-async': () =>
    import(/* webpackChunkName: "better-hook-use-async" */ 'better-hook/use-async'),
  'better-hook/use-boolean': () =>
    import(/* webpackChunkName: "better-hook-use-boolean" */ 'better-hook/use-boolean'),
  'better-hook/use-click-outside': () =>
    import(/* webpackChunkName: "better-hook-use-click-outside" */ 'better-hook/use-click-outside'),
  'better-hook/use-controllable-state': () =>
    import(
      /* webpackChunkName: "better-hook-use-controllable-state" */ 'better-hook/use-controllable-state'
    ),
  'better-hook/use-debounce': () =>
    import(/* webpackChunkName: "better-hook-use-debounce" */ 'better-hook/use-debounce'),
  'better-hook/use-debounce-fn': () =>
    import(/* webpackChunkName: "better-hook-use-debounce-fn" */ 'better-hook/use-debounce-fn'),
  'better-hook/use-document-visibility': () =>
    import(
      /* webpackChunkName: "better-hook-use-document-visibility" */ 'better-hook/use-document-visibility'
    ),
  'better-hook/use-event-listener': () =>
    import(
      /* webpackChunkName: "better-hook-use-event-listener" */ 'better-hook/use-event-listener'
    ),
  'better-hook/use-hover': () =>
    import(/* webpackChunkName: "better-hook-use-hover" */ 'better-hook/use-hover'),
  'better-hook/use-input': () =>
    import(/* webpackChunkName: "better-hook-use-input" */ 'better-hook/use-input'),
  'better-hook/use-interval': () =>
    import(/* webpackChunkName: "better-hook-use-interval" */ 'better-hook/use-interval'),
  'better-hook/use-is-mounted': () =>
    import(/* webpackChunkName: "better-hook-use-is-mounted" */ 'better-hook/use-is-mounted'),
  'better-hook/use-isomorphic-layout-effect': () =>
    import(
      /* webpackChunkName: "better-hook-use-isomorphic-layout-effect" */ 'better-hook/use-isomorphic-layout-effect'
    ),
  'better-hook/use-key-press': () =>
    import(/* webpackChunkName: "better-hook-use-key-press" */ 'better-hook/use-key-press'),
  'better-hook/use-latest': () =>
    import(/* webpackChunkName: "better-hook-use-latest" */ 'better-hook/use-latest'),
  'better-hook/use-local-storage': () =>
    import(/* webpackChunkName: "better-hook-use-local-storage" */ 'better-hook/use-local-storage'),
  'better-hook/use-lock-fn': () =>
    import(/* webpackChunkName: "better-hook-use-lock-fn" */ 'better-hook/use-lock-fn'),
  'better-hook/use-media-query': () =>
    import(/* webpackChunkName: "better-hook-use-media-query" */ 'better-hook/use-media-query'),
  'better-hook/use-memoized-fn': () =>
    import(/* webpackChunkName: "better-hook-use-memoized-fn" */ 'better-hook/use-memoized-fn'),
  'better-hook/use-online': () =>
    import(/* webpackChunkName: "better-hook-use-online" */ 'better-hook/use-online'),
  'better-hook/use-previous': () =>
    import(/* webpackChunkName: "better-hook-use-previous" */ 'better-hook/use-previous'),
  'better-hook/use-reset-state': () =>
    import(/* webpackChunkName: "better-hook-use-reset-state" */ 'better-hook/use-reset-state'),
  'better-hook/use-safe-state': () =>
    import(/* webpackChunkName: "better-hook-use-safe-state" */ 'better-hook/use-safe-state'),
  'better-hook/use-session-storage': () =>
    import(
      /* webpackChunkName: "better-hook-use-session-storage" */ 'better-hook/use-session-storage'
    ),
  'better-hook/use-storage': () =>
    import(/* webpackChunkName: "better-hook-use-storage" */ 'better-hook/use-storage'),
  'better-hook/use-throttle': () =>
    import(/* webpackChunkName: "better-hook-use-throttle" */ 'better-hook/use-throttle'),
  'better-hook/use-throttle-fn': () =>
    import(/* webpackChunkName: "better-hook-use-throttle-fn" */ 'better-hook/use-throttle-fn'),
  'better-hook/use-timeout': () =>
    import(/* webpackChunkName: "better-hook-use-timeout" */ 'better-hook/use-timeout'),
  'better-hook/use-toggle': () =>
    import(/* webpackChunkName: "better-hook-use-toggle" */ 'better-hook/use-toggle'),
  'better-hook/use-unmounted-ref': () =>
    import(/* webpackChunkName: "better-hook-use-unmounted-ref" */ 'better-hook/use-unmounted-ref'),
  'better-hook/use-window-size': () =>
    import(/* webpackChunkName: "better-hook-use-window-size" */ 'better-hook/use-window-size'),
} satisfies Record<string, LiveCodeModuleLoader>;

export type LazyLiveCodeModuleSpecifier = keyof typeof moduleLoaders;

const moduleRequests = new Map<LazyLiveCodeModuleSpecifier, Promise<LiveCodeModule>>();

export function isLazyLiveCodeModule(specifier: string): specifier is LazyLiveCodeModuleSpecifier {
  return Object.hasOwn(moduleLoaders, specifier);
}

export function lazyLiveCodeModuleSpecifiers(): readonly LazyLiveCodeModuleSpecifier[] {
  return Object.keys(moduleLoaders) as LazyLiveCodeModuleSpecifier[];
}

export async function loadLiveCodeModule(
  specifier: LazyLiveCodeModuleSpecifier,
): Promise<LiveCodeModule> {
  const existing = moduleRequests.get(specifier);
  if (existing) return existing;

  const request = moduleLoaders[specifier]().catch((error: unknown) => {
    moduleRequests.delete(specifier);
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to load module "${specifier}": ${reason}`, { cause: error });
  });
  moduleRequests.set(specifier, request);
  return request;
}
