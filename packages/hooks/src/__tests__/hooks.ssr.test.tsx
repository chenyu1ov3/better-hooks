import { renderToString } from 'react-dom/server';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useAsync,
  useBoolean,
  useClickOutside,
  useControllableState,
  useDebounce,
  useDebounceFn,
  useDocumentVisibility,
  useEventListener,
  useHover,
  useInput,
  useInterval,
  useIsMounted,
  useIsomorphicLayoutEffect,
  useKeyPress,
  useLatest,
  useLocalStorage,
  useLockFn,
  useMemoizedFn,
  useMediaQuery,
  useOnline,
  usePrevious,
  useResetState,
  useSafeState,
  useSessionStorage,
  useThrottle,
  useThrottleFn,
  useTimeout,
  useToggle,
  useUnmountedRef,
  useWindowSize,
} from '../index.js';

function ServerHarness(): JSX.Element {
  const elementRef = useRef<HTMLDivElement>(null);
  const [toggle] = useToggle(true);
  const boolean = useBoolean(true);
  const previous = usePrevious('current', 'initial');
  const latest = useLatest('latest');
  const [controlled] = useControllableState({ defaultValue: 'state' });
  const memoized = useMemoizedFn(() => 'memoized');
  const [safe] = useSafeState('safe');
  const [resettable] = useResetState('resettable');
  const unmountedRef = useUnmountedRef();
  const mounted = useIsMounted();
  const request = useAsync(async () => 'data');
  const debounced = useDebounce('debounced', { delay: 10 });
  const throttled = useThrottle('throttled', { delay: 10 });
  const debouncedAction = useDebounceFn((value: string) => value, { delay: 10 });
  const throttledAction = useThrottleFn((value: string) => value, { delay: 10 });
  const timeout = useTimeout(() => undefined, null);
  const input = useInput({ initialValue: 'input' });
  const local = useLocalStorage('ssr-local', 1);
  const session = useSessionStorage('ssr-session', 2);
  const media = useMediaQuery('(min-width: 1px)', { defaultMatches: true });
  const size = useWindowSize();
  const online = useOnline();
  const visibility = useDocumentVisibility();
  useKeyPress('Enter', () => undefined);
  const hovering = useHover(null);
  useLockFn(async () => 'locked');

  useIsomorphicLayoutEffect(() => undefined, []);
  useInterval(() => undefined, null);
  useEventListener('resize', () => undefined);
  useClickOutside(elementRef, () => undefined);

  return (
    <output
      data-actions={String(debouncedAction.pending || throttledAction.pending)}
      data-async={request.status}
      data-controlled={controlled}
      data-height={size.height}
      data-input={input.value}
      data-visibility={visibility}
      data-hovering={String(hovering)}
      data-unmounted={String(unmountedRef.current)}
      data-new-state={`${memoized()}:${safe}:${resettable}`}
      data-latest={latest.current}
      data-local={local.value}
      data-media={String(media)}
      data-mounted={String(mounted())}
      data-online={String(online)}
      data-previous={previous}
      data-session={session.value}
      data-timeout={String(timeout.pending)}
      data-values={`${toggle}:${boolean.value}:${debounced}:${throttled}`}
      data-width={size.width}
    />
  );
}

describe('server rendering', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders every public Hook without browser globals or layout warnings', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const html = renderToString(<ServerHarness />);

    expect(html).toContain('data-async="idle"');
    expect(html).toContain('data-media="true"');
    expect(html).toContain('data-online="true"');
    expect(html).toContain('data-width="0"');
    expect(html).toContain('data-height="0"');
    expect(html).toContain('data-mounted="false"');
    expect(html).toContain('data-visibility="visible"');
    expect(html).toContain('data-hovering="false"');
    expect(html).toContain('data-unmounted="false"');
    expect(html).toContain('data-new-state="memoized:safe:resettable"');
    expect(error).not.toHaveBeenCalled();
  });
});
