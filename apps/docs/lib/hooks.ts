import type { Locale } from './i18n';

export const hookCategories = [
  'state',
  'async',
  'browser-dom',
  'forms',
  'storage',
  'lifecycle',
] as const;

export type HookCategory = (typeof hookCategories)[number];

export type LocalizedText = Readonly<Record<Locale, string>>;

type ApiEntryBase = {
  readonly slug: `use-${string}`;
  readonly name: string;
  readonly importPath: `better-hooks/use-${string}`;
  readonly importStatement: string;
  readonly signature: string;
  readonly category: HookCategory;
  readonly description: LocalizedText;
  readonly reactRange: '>=19.0.0 <20.0.0';
  readonly clientBoundary: true;
  readonly ssrBehavior: LocalizedText;
  readonly sourceUrl: `https://github.com/chenyu1ov3/better-hooks/blob/main/packages/hooks/src/use-${string}/index.ts`;
  readonly demoId: `${HookCategory}:use-${string}`;
};

export type HookDefinition = ApiEntryBase & {
  readonly kind: 'hook';
  readonly name: `use${string}`;
};

export type ApiEntryDefinition = HookDefinition;

const repository = 'https://github.com/chenyu1ov3/better-hooks';

function defineHook(
  definition: Omit<
    HookDefinition,
    'kind' | 'importStatement' | 'reactRange' | 'clientBoundary' | 'sourceUrl' | 'demoId'
  >,
): HookDefinition {
  return {
    ...definition,
    kind: 'hook',
    importStatement: `import { ${definition.name} } from '${definition.importPath}'`,
    reactRange: '>=19.0.0 <20.0.0',
    clientBoundary: true,
    sourceUrl: `${repository}/blob/main/packages/hooks/src/${definition.slug}/index.ts`,
    demoId: `${definition.category}:${definition.slug}`,
  } as HookDefinition;
}

export const hooks = [
  defineHook({
    slug: 'use-toggle',
    name: 'useToggle',
    importPath: 'better-hooks/use-toggle',
    signature:
      'useToggle(initialValue?: boolean): readonly [boolean, (next?: ToggleUpdater) => void]',
    category: 'state',
    description: {
      en: 'Boolean state with a stable action for toggling or setting an explicit value.',
      'zh-CN': '管理布尔状态，并提供稳定的操作函数来切换或直接设置状态。',
    },
    ssrBehavior: {
      en: 'Uses only React state; the initial value is deterministic during server rendering.',
      'zh-CN': '只使用 React 状态，服务端渲染会稳定输出传入的初始值。',
    },
  }),
  defineHook({
    slug: 'use-boolean',
    name: 'useBoolean',
    importPath: 'better-hooks/use-boolean',
    signature: 'useBoolean(initialValue?: boolean): UseBooleanResult',
    category: 'state',
    description: {
      en: 'Boolean state with named setTrue, setFalse, and toggle actions.',
      'zh-CN': '管理布尔状态，并提供 setTrue、setFalse 和 toggle 三个明确的操作函数。',
    },
    ssrBehavior: {
      en: 'Uses only React state and produces the configured initial value on the server.',
      'zh-CN': '只使用 React 状态，服务端会返回配置的初始值。',
    },
  }),
  defineHook({
    slug: 'use-controllable-state',
    name: 'useControllableState',
    importPath: 'better-hooks/use-controllable-state',
    signature:
      'useControllableState<T>(options?: UseControllableStateOptions<T>): readonly [T | undefined, SetValue<T>]',
    category: 'state',
    description: {
      en: 'A controlled/uncontrolled state primitive with one stable setter contract.',
      'zh-CN': '用同一个稳定的 setter 同时支持受控和非受控状态。',
    },
    ssrBehavior: {
      en: 'Does not access browser APIs; provide a deterministic value or defaultValue for SSR.',
      'zh-CN': '不会访问浏览器 API；SSR 时请提供稳定的 value 或 defaultValue。',
    },
  }),
  defineHook({
    slug: 'use-previous',
    name: 'usePrevious',
    importPath: 'better-hooks/use-previous',
    signature: 'usePrevious<T, U = undefined>(value: T, initialValue?: U): T | U | undefined',
    category: 'state',
    description: {
      en: 'Reads the value from the previous committed render.',
      'zh-CN': '读取上一次完成提交时的值。',
    },
    ssrBehavior: {
      en: 'Returns initialValue, or undefined, before the first client commit.',
      'zh-CN': '首次客户端提交前返回 initialValue；没有传入时返回 undefined。',
    },
  }),
  defineHook({
    slug: 'use-latest',
    name: 'useLatest',
    importPath: 'better-hooks/use-latest',
    signature: 'useLatest<T>(value: T): RefObject<T>',
    category: 'state',
    description: {
      en: 'A stable ref that follows the latest committed value.',
      'zh-CN': '返回一个稳定的 ref，始终指向最近一次完成提交的值。',
    },
    ssrBehavior: {
      en: 'The ref starts with the render value and updates only after a client commit.',
      'zh-CN': 'ref 初始保存当前渲染值，之后只在客户端完成提交后更新。',
    },
  }),
  defineHook({
    slug: 'use-memoized-fn',
    name: 'useMemoizedFn',
    importPath: 'better-hooks/use-memoized-fn',
    signature: 'useMemoizedFn<T extends (...args: never[]) => unknown>(fn: T): T',
    category: 'state',
    description: {
      en: 'Keeps a stable callback identity while invoking the latest committed implementation.',
      'zh-CN': '保持回调引用稳定，同时调用最近一次提交的实现。',
    },
    ssrBehavior: {
      en: 'Creates a stable wrapper without invoking the callback during server rendering.',
      'zh-CN': '服务端渲染时只创建稳定包装函数，不会执行回调。',
    },
  }),
  defineHook({
    slug: 'use-safe-state',
    name: 'useSafeState',
    importPath: 'better-hooks/use-safe-state',
    signature: 'useSafeState<S>(initialState: S | (() => S)): UseSafeStateResult<S>',
    category: 'state',
    description: {
      en: 'Provides state whose setter ignores updates after the component unmounts.',
      'zh-CN': '提供在组件卸载后会忽略更新的 React 状态。',
    },
    ssrBehavior: {
      en: 'Uses deterministic React state on the server; the setter becomes active after commit.',
      'zh-CN': '服务端使用确定性的 React 状态，提交完成后 setter 才会生效。',
    },
  }),
  defineHook({
    slug: 'use-reset-state',
    name: 'useResetState',
    importPath: 'better-hooks/use-reset-state',
    signature: 'useResetState<S>(initialState: S | (() => S)): UseResetStateResult<S>',
    category: 'state',
    description: {
      en: 'Adds a stable reset action that restores the first resolved state value.',
      'zh-CN': '增加稳定的 reset 操作，将状态恢复为首次解析得到的初始值。',
    },
    ssrBehavior: {
      en: 'Captures the initial React state during SSR without accessing browser APIs.',
      'zh-CN': 'SSR 期间捕获初始 React 状态，不会访问浏览器 API。',
    },
  }),
  defineHook({
    slug: 'use-debounce',
    name: 'useDebounce',
    importPath: 'better-hooks/use-debounce',
    signature: 'useDebounce<T>(value: T, options: DebounceOptions): T',
    category: 'async',
    description: {
      en: 'Publishes a value after it remains unchanged for the configured delay.',
      'zh-CN': '输入停止变化并经过指定延迟后，再更新输出值。',
    },
    ssrBehavior: {
      en: 'Returns the input value during SSR; timers start only after commit.',
      'zh-CN': 'SSR 时直接返回输入值；定时器只会在客户端提交后启动。',
    },
  }),
  defineHook({
    slug: 'use-throttle',
    name: 'useThrottle',
    importPath: 'better-hooks/use-throttle',
    signature: 'useThrottle<T>(value: T, options: ThrottleOptions): T',
    category: 'async',
    description: {
      en: 'Limits value publication to at most once per delay window.',
      'zh-CN': '限制输出值的更新频率，每个时间窗口最多更新一次。',
    },
    ssrBehavior: {
      en: 'Returns the input value during SSR; scheduling begins after commit.',
      'zh-CN': 'SSR 时直接返回输入值；调度只会在客户端提交后开始。',
    },
  }),
  defineHook({
    slug: 'use-debounce-fn',
    name: 'useDebounceFn',
    importPath: 'better-hooks/use-debounce-fn',
    signature:
      'useDebounceFn<Args, Result>(fn: (...args: Args) => Result, options: DebounceFnOptions): DebouncedFunction<Args, Result>',
    category: 'async',
    description: {
      en: 'Debounces function calls with cancel, flush, and pending controls.',
      'zh-CN': '为函数调用添加防抖，并提供 cancel、flush 和 pending 状态。',
    },
    ssrBehavior: {
      en: 'Creates no timer during render; calls schedule work only in the browser.',
      'zh-CN': '渲染期间不会创建定时器；实际调用后才会安排任务。',
    },
  }),
  defineHook({
    slug: 'use-throttle-fn',
    name: 'useThrottleFn',
    importPath: 'better-hooks/use-throttle-fn',
    signature:
      'useThrottleFn<Args, Result>(fn: (...args: Args) => Result, options: ThrottleFnOptions): ThrottledFunction<Args, Result>',
    category: 'async',
    description: {
      en: 'Throttles function calls while preserving the latest committed callback.',
      'zh-CN': '限制函数调用频率，并始终执行最近一次完成提交的回调。',
    },
    ssrBehavior: {
      en: 'Creates no timer during render; calls schedule work only after interaction.',
      'zh-CN': '渲染期间不会创建定时器；实际调用后才会安排任务。',
    },
  }),
  defineHook({
    slug: 'use-timeout',
    name: 'useTimeout',
    importPath: 'better-hooks/use-timeout',
    signature:
      'useTimeout(callback: () => void, delay: number | null, options?: UseTimeoutOptions): { cancel: () => void; pending: boolean }',
    category: 'async',
    description: {
      en: 'Runs the latest callback once after a delay, with cancellation state.',
      'zh-CN': '延迟一段时间后执行一次最新回调，并支持取消和读取等待状态。',
    },
    ssrBehavior: {
      en: 'No timeout is created on the server; pending reflects whether delay is enabled.',
      'zh-CN': '服务端不会创建定时器；pending 会反映 delay 是否已启用。',
    },
  }),
  defineHook({
    slug: 'use-interval',
    name: 'useInterval',
    importPath: 'better-hooks/use-interval',
    signature:
      'useInterval(callback: () => void, delay: number | null, options?: UseIntervalOptions): void',
    category: 'async',
    description: {
      en: 'Runs the latest callback on a declarative interval.',
      'zh-CN': '以声明式方式按固定间隔执行最新回调。',
    },
    ssrBehavior: {
      en: 'No interval is created on the server; null keeps the interval paused.',
      'zh-CN': '服务端不会创建 interval；传入 null 时保持暂停。',
    },
  }),
  defineHook({
    slug: 'use-async',
    name: 'useAsync',
    importPath: 'better-hooks/use-async',
    signature: 'useAsync<T>(task: AsyncTask<T>, options?: UseAsyncOptions): UseAsyncResult<T>',
    category: 'async',
    description: {
      en: 'Runs abortable asynchronous work with stale-result protection.',
      'zh-CN': '运行可中止的异步任务，避免旧结果覆盖较新的状态。',
    },
    ssrBehavior: {
      en: 'Starts idle during SSR; immediate tasks begin only after the client commits.',
      'zh-CN': 'SSR 时保持 idle；即使启用 immediate，任务也只会在客户端提交后启动。',
    },
  }),
  defineHook({
    slug: 'use-lock-fn',
    name: 'useLockFn',
    importPath: 'better-hooks/use-lock-fn',
    signature:
      'useLockFn<Args extends readonly unknown[], Result>(fn: (...args: Args) => Result | PromiseLike<Result>, options?: UseLockFnOptions): LockFn<Args, Awaited<Result>>',
    category: 'async',
    description: {
      en: 'Prevents overlapping calls to an async or synchronous action.',
      'zh-CN': '防止异步或同步操作并发执行。',
    },
    ssrBehavior: {
      en: 'Creates a stable wrapper during SSR without invoking the action.',
      'zh-CN': 'SSR 期间只创建稳定包装函数，不会执行操作。',
    },
  }),
  defineHook({
    slug: 'use-event-listener',
    name: 'useEventListener',
    importPath: 'better-hooks/use-event-listener',
    signature:
      'useEventListener(target?, type, listener, options?: UseEventListenerOptions | boolean): void',
    category: 'browser-dom',
    description: {
      en: 'Subscribes to an EventTarget with typed window events and automatic cleanup.',
      'zh-CN': '订阅 EventTarget，自动推断 Window 事件类型并在需要时清理监听器。',
    },
    ssrBehavior: {
      en: 'Skips subscription when window or the target is unavailable.',
      'zh-CN': 'window 或事件目标不可用时不会建立订阅。',
    },
  }),
  defineHook({
    slug: 'use-click-outside',
    name: 'useClickOutside',
    importPath: 'better-hooks/use-click-outside',
    signature:
      'useClickOutside<T extends HTMLElement>(ref: RefTarget<T>, onOutside: (event: PointerEvent) => void, enabledOrOptions?: boolean | UseClickOutsideOptions): void',
    category: 'browser-dom',
    description: {
      en: 'Calls a handler for pointer presses outside a referenced element.',
      'zh-CN': '当用户在目标元素之外按下指针时调用处理函数。',
    },
    ssrBehavior: {
      en: 'Does nothing when document is unavailable and subscribes after commit.',
      'zh-CN': 'document 不可用时不会执行任何操作，并且只在客户端提交后订阅。',
    },
  }),
  defineHook({
    slug: 'use-media-query',
    name: 'useMediaQuery',
    importPath: 'better-hooks/use-media-query',
    signature: 'useMediaQuery(query: string, options?: MediaQueryOptions): boolean',
    category: 'browser-dom',
    description: {
      en: 'Subscribes to a media query through a shared external store.',
      'zh-CN': '通过共享的外部状态源订阅媒体查询结果。',
    },
    ssrBehavior: {
      en: 'Returns defaultMatches, or false, for the server snapshot.',
      'zh-CN': '服务端快照返回 defaultMatches；没有配置时返回 false。',
    },
  }),
  defineHook({
    slug: 'use-window-size',
    name: 'useWindowSize',
    importPath: 'better-hooks/use-window-size',
    signature: 'useWindowSize(): Readonly<{ width: number; height: number }>',
    category: 'browser-dom',
    description: {
      en: 'Tracks viewport dimensions with one shared resize subscription.',
      'zh-CN': '通过共享的 resize 监听器跟踪视口尺寸。',
    },
    ssrBehavior: {
      en: 'Returns { width: 0, height: 0 } for the server snapshot.',
      'zh-CN': '服务端快照固定返回 { width: 0, height: 0 }。',
    },
  }),
  defineHook({
    slug: 'use-online',
    name: 'useOnline',
    importPath: 'better-hooks/use-online',
    signature: 'useOnline(): boolean',
    category: 'browser-dom',
    description: {
      en: 'Tracks navigator connectivity with one listener pair per browser realm.',
      'zh-CN': '每个浏览器上下文只用一对监听器跟踪 navigator 的联网状态。',
    },
    ssrBehavior: {
      en: 'Returns true for the server snapshot to keep markup deterministic.',
      'zh-CN': '服务端快照固定返回 true，保证服务端输出稳定。',
    },
  }),
  defineHook({
    slug: 'use-document-visibility',
    name: 'useDocumentVisibility',
    importPath: 'better-hooks/use-document-visibility',
    signature: 'useDocumentVisibility(options?: UseDocumentVisibilityOptions): VisibilityState',
    category: 'browser-dom',
    description: {
      en: 'Tracks document visibility through a shared external-store subscription.',
      'zh-CN': '通过共享的外部状态订阅跟踪文档可见性。',
    },
    ssrBehavior: {
      en: 'Returns visible on the server and subscribes only when a document is available.',
      'zh-CN': '服务端返回 visible，只有存在 document 时才会建立订阅。',
    },
  }),
  defineHook({
    slug: 'use-key-press',
    name: 'useKeyPress',
    importPath: 'better-hooks/use-key-press',
    signature:
      'useKeyPress(keyFilter: KeyFilter, handler: KeyPressHandler, options?: UseKeyPressOptions): void',
    category: 'browser-dom',
    description: {
      en: 'Matches key alternatives, predicates, and string chords such as ctrl+s.',
      'zh-CN': '匹配按键候选、谓词，以及 ctrl+s 形式的字符串组合键。',
    },
    ssrBehavior: {
      en: 'Skips native subscription when window or the configured target is unavailable.',
      'zh-CN': 'window 或配置的目标不可用时不会建立原生订阅。',
    },
  }),
  defineHook({
    slug: 'use-hover',
    name: 'useHover',
    importPath: 'better-hooks/use-hover',
    signature: 'useHover(target?: HoverTarget, options?: UseHoverOptions): boolean',
    category: 'browser-dom',
    description: {
      en: 'Tracks mouseenter and mouseleave state for a target and follows ref changes.',
      'zh-CN': '跟踪目标的鼠标进入与离开状态，并跟随 ref 目标变化。',
    },
    ssrBehavior: {
      en: 'Returns false during SSR and attaches native listeners after the client commits.',
      'zh-CN': 'SSR 期间返回 false，并在客户端提交后添加原生监听器。',
    },
  }),
  defineHook({
    slug: 'use-input',
    name: 'useInput',
    importPath: 'better-hooks/use-input',
    signature: 'useInput(options?: UseInputOptions): UseInputResult',
    category: 'forms',
    description: {
      en: 'Connects text inputs to controlled or uncontrolled string state.',
      'zh-CN': '用统一的 API 管理受控或非受控文本输入。',
    },
    ssrBehavior: {
      en: 'Uses deterministic React state and does not access the DOM during render.',
      'zh-CN': '使用稳定的 React 初始状态，渲染期间不会访问 DOM。',
    },
  }),
  defineHook({
    slug: 'use-local-storage',
    name: 'useLocalStorage',
    importPath: 'better-hooks/use-local-storage',
    signature:
      'useLocalStorage<T>(key: string, initialValue: T | (() => T), options?: StorageOptions<T>): UseStorageResult<T>',
    category: 'storage',
    description: {
      en: 'Synchronizes typed state with localStorage and reports serialization errors.',
      'zh-CN': '将类型安全的状态同步到 localStorage，并返回序列化错误。',
    },
    ssrBehavior: {
      en: 'Uses initialValue on the server and reads storage only when a browser is available.',
      'zh-CN': '服务端使用 initialValue，只会在浏览器环境中读取存储。',
    },
  }),
  defineHook({
    slug: 'use-session-storage',
    name: 'useSessionStorage',
    importPath: 'better-hooks/use-session-storage',
    signature:
      'useSessionStorage<T>(key: string, initialValue: T | (() => T), options?: StorageOptions<T>): UseStorageResult<T>',
    category: 'storage',
    description: {
      en: 'Synchronizes typed state with sessionStorage for the current tab session.',
      'zh-CN': '将类型安全的状态同步到当前标签页的 sessionStorage。',
    },
    ssrBehavior: {
      en: 'Uses initialValue on the server and reads storage only when a browser is available.',
      'zh-CN': '服务端使用 initialValue，只会在浏览器环境中读取存储。',
    },
  }),
  defineHook({
    slug: 'use-is-mounted',
    name: 'useIsMounted',
    importPath: 'better-hooks/use-is-mounted',
    signature: 'useIsMounted(): () => boolean',
    category: 'lifecycle',
    description: {
      en: 'Returns a stable function that reports committed mount state.',
      'zh-CN': '返回一个稳定函数，用来判断组件是否已经完成挂载。',
    },
    ssrBehavior: {
      en: 'The returned function reports false until the first client effect commits.',
      'zh-CN': '首次客户端 effect 执行前，该函数会返回 false。',
    },
  }),
  defineHook({
    slug: 'use-isomorphic-layout-effect',
    name: 'useIsomorphicLayoutEffect',
    importPath: 'better-hooks/use-isomorphic-layout-effect',
    signature: 'useIsomorphicLayoutEffect: typeof React.useEffect',
    category: 'lifecycle',
    description: {
      en: 'Uses useLayoutEffect in the browser and useEffect during SSR.',
      'zh-CN': '在浏览器中使用 useLayoutEffect，在 SSR 环境中改用 useEffect。',
    },
    ssrBehavior: {
      en: 'Selects useEffect when window is unavailable, avoiding a server layout-effect warning.',
      'zh-CN': 'window 不可用时使用 useEffect，避免服务端出现 layout effect 警告。',
    },
  }),
  defineHook({
    slug: 'use-unmounted-ref',
    name: 'useUnmountedRef',
    importPath: 'better-hooks/use-unmounted-ref',
    signature: 'useUnmountedRef(): RefObject<boolean>',
    category: 'lifecycle',
    description: {
      en: 'Exposes a stable ref that becomes true during unmount cleanup.',
      'zh-CN': '提供稳定的 ref，在卸载清理阶段变为 true。',
    },
    ssrBehavior: {
      en: 'Starts as false during SSR and remains false until a mounted component is cleaned up.',
      'zh-CN': 'SSR 期间初始为 false，组件挂载并清理前都保持为 false。',
    },
  }),
] as const satisfies readonly HookDefinition[];

export const apiEntries = hooks as readonly ApiEntryDefinition[];

export const hookCategoryCounts = {
  state: 8,
  async: 8,
  'browser-dom': 8,
  forms: 1,
  storage: 2,
  lifecycle: 3,
} as const satisfies Record<HookCategory, number>;

export function getHookBySlug(slug: string): HookDefinition | undefined {
  return hooks.find((hook) => hook.slug === slug);
}

export function getApiEntryBySlug(slug: string): ApiEntryDefinition | undefined {
  return apiEntries.find((entry) => entry.slug === slug);
}

export function hooksForCategory(category: HookCategory): readonly HookDefinition[] {
  return hooks.filter((hook) => hook.category === category);
}

for (const category of hookCategories) {
  if (hooksForCategory(category).length !== hookCategoryCounts[category]) {
    throw new Error(`Hook registry count mismatch for ${category}.`);
  }
}
