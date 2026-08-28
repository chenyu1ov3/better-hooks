type LiveCodeModule = object;
type LiveCodeModuleLoader = () => Promise<LiveCodeModule>;

const moduleLoaders = {
  'better-hooks': () => import(/* webpackChunkName: "better-hooks-all" */ 'better-hooks'),
  'better-hooks/use-async': () =>
    import(/* webpackChunkName: "better-hooks-use-async" */ 'better-hooks/use-async'),
  'better-hooks/use-boolean': () =>
    import(/* webpackChunkName: "better-hooks-use-boolean" */ 'better-hooks/use-boolean'),
  'better-hooks/use-click-outside': () =>
    import(
      /* webpackChunkName: "better-hooks-use-click-outside" */ 'better-hooks/use-click-outside'
    ),
  'better-hooks/use-controllable-state': () =>
    import(
      /* webpackChunkName: "better-hooks-use-controllable-state" */ 'better-hooks/use-controllable-state'
    ),
  'better-hooks/use-copy-to-clipboard': () =>
    import(
      /* webpackChunkName: "better-hooks-use-copy-to-clipboard" */ 'better-hooks/use-copy-to-clipboard'
    ),
  'better-hooks/use-counter': () =>
    import(/* webpackChunkName: "better-hooks-use-counter" */ 'better-hooks/use-counter'),
  'better-hooks/use-debounce': () =>
    import(/* webpackChunkName: "better-hooks-use-debounce" */ 'better-hooks/use-debounce'),
  'better-hooks/use-debounce-fn': () =>
    import(/* webpackChunkName: "better-hooks-use-debounce-fn" */ 'better-hooks/use-debounce-fn'),
  'better-hooks/use-document-visibility': () =>
    import(
      /* webpackChunkName: "better-hooks-use-document-visibility" */ 'better-hooks/use-document-visibility'
    ),
  'better-hooks/use-event-listener': () =>
    import(
      /* webpackChunkName: "better-hooks-use-event-listener" */ 'better-hooks/use-event-listener'
    ),
  'better-hooks/use-hover': () =>
    import(/* webpackChunkName: "better-hooks-use-hover" */ 'better-hooks/use-hover'),
  'better-hooks/use-intersection-observer': () =>
    import(
      /* webpackChunkName: "better-hooks-use-intersection-observer" */ 'better-hooks/use-intersection-observer'
    ),
  'better-hooks/use-input': () =>
    import(/* webpackChunkName: "better-hooks-use-input" */ 'better-hooks/use-input'),
  'better-hooks/use-interval': () =>
    import(/* webpackChunkName: "better-hooks-use-interval" */ 'better-hooks/use-interval'),
  'better-hooks/use-is-mounted': () =>
    import(/* webpackChunkName: "better-hooks-use-is-mounted" */ 'better-hooks/use-is-mounted'),
  'better-hooks/use-isomorphic-layout-effect': () =>
    import(
      /* webpackChunkName: "better-hooks-use-isomorphic-layout-effect" */ 'better-hooks/use-isomorphic-layout-effect'
    ),
  'better-hooks/use-key-press': () =>
    import(/* webpackChunkName: "better-hooks-use-key-press" */ 'better-hooks/use-key-press'),
  'better-hooks/use-latest': () =>
    import(/* webpackChunkName: "better-hooks-use-latest" */ 'better-hooks/use-latest'),
  'better-hooks/use-local-storage': () =>
    import(
      /* webpackChunkName: "better-hooks-use-local-storage" */ 'better-hooks/use-local-storage'
    ),
  'better-hooks/use-lock-fn': () =>
    import(/* webpackChunkName: "better-hooks-use-lock-fn" */ 'better-hooks/use-lock-fn'),
  'better-hooks/use-map': () =>
    import(/* webpackChunkName: "better-hooks-use-map" */ 'better-hooks/use-map'),
  'better-hooks/use-media-query': () =>
    import(/* webpackChunkName: "better-hooks-use-media-query" */ 'better-hooks/use-media-query'),
  'better-hooks/use-memoized-fn': () =>
    import(/* webpackChunkName: "better-hooks-use-memoized-fn" */ 'better-hooks/use-memoized-fn'),
  'better-hooks/use-online': () =>
    import(/* webpackChunkName: "better-hooks-use-online" */ 'better-hooks/use-online'),
  'better-hooks/use-previous': () =>
    import(/* webpackChunkName: "better-hooks-use-previous" */ 'better-hooks/use-previous'),
  'better-hooks/use-reset-state': () =>
    import(/* webpackChunkName: "better-hooks-use-reset-state" */ 'better-hooks/use-reset-state'),
  'better-hooks/use-resize-observer': () =>
    import(
      /* webpackChunkName: "better-hooks-use-resize-observer" */ 'better-hooks/use-resize-observer'
    ),
  'better-hooks/use-safe-state': () =>
    import(/* webpackChunkName: "better-hooks-use-safe-state" */ 'better-hooks/use-safe-state'),
  'better-hooks/use-set': () =>
    import(/* webpackChunkName: "better-hooks-use-set" */ 'better-hooks/use-set'),
  'better-hooks/use-session-storage': () =>
    import(
      /* webpackChunkName: "better-hooks-use-session-storage" */ 'better-hooks/use-session-storage'
    ),
  'better-hooks/use-throttle': () =>
    import(/* webpackChunkName: "better-hooks-use-throttle" */ 'better-hooks/use-throttle'),
  'better-hooks/use-throttle-fn': () =>
    import(/* webpackChunkName: "better-hooks-use-throttle-fn" */ 'better-hooks/use-throttle-fn'),
  'better-hooks/use-timeout': () =>
    import(/* webpackChunkName: "better-hooks-use-timeout" */ 'better-hooks/use-timeout'),
  'better-hooks/use-toggle': () =>
    import(/* webpackChunkName: "better-hooks-use-toggle" */ 'better-hooks/use-toggle'),
  'better-hooks/use-unmounted-ref': () =>
    import(
      /* webpackChunkName: "better-hooks-use-unmounted-ref" */ 'better-hooks/use-unmounted-ref'
    ),
  'better-hooks/use-websocket': () =>
    import(/* webpackChunkName: "better-hooks-use-websocket" */ 'better-hooks/use-websocket'),
  'better-hooks/use-window-size': () =>
    import(/* webpackChunkName: "better-hooks-use-window-size" */ 'better-hooks/use-window-size'),
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
