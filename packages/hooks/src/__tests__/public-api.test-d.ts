import { expectTypeOf, test } from 'vitest';
import * as root from '../index.js';
import * as asyncEntry from 'better-hooks/use-async';
import * as booleanEntry from 'better-hooks/use-boolean';
import * as clickOutsideEntry from 'better-hooks/use-click-outside';
import * as controllableEntry from 'better-hooks/use-controllable-state';
import * as debounceEntry from 'better-hooks/use-debounce';
import * as debounceFnEntry from 'better-hooks/use-debounce-fn';
import * as documentVisibilityEntry from 'better-hooks/use-document-visibility';
import * as eventListenerEntry from 'better-hooks/use-event-listener';
import * as hoverEntry from 'better-hooks/use-hover';
import * as inputEntry from 'better-hooks/use-input';
import * as intervalEntry from 'better-hooks/use-interval';
import * as isMountedEntry from 'better-hooks/use-is-mounted';
import * as isomorphicEntry from 'better-hooks/use-isomorphic-layout-effect';
import * as keyPressEntry from 'better-hooks/use-key-press';
import * as latestEntry from 'better-hooks/use-latest';
import * as localStorageEntry from 'better-hooks/use-local-storage';
import * as lockFnEntry from 'better-hooks/use-lock-fn';
import * as memoizedFnEntry from 'better-hooks/use-memoized-fn';
import * as mediaQueryEntry from 'better-hooks/use-media-query';
import * as onlineEntry from 'better-hooks/use-online';
import * as previousEntry from 'better-hooks/use-previous';
import * as resetStateEntry from 'better-hooks/use-reset-state';
import * as safeStateEntry from 'better-hooks/use-safe-state';
import * as sessionStorageEntry from 'better-hooks/use-session-storage';
import * as storageEntry from 'better-hooks/use-storage';
import * as throttleEntry from 'better-hooks/use-throttle';
import * as throttleFnEntry from 'better-hooks/use-throttle-fn';
import * as timeoutEntry from 'better-hooks/use-timeout';
import * as toggleEntry from 'better-hooks/use-toggle';
import * as unmountedRefEntry from 'better-hooks/use-unmounted-ref';
import * as windowSizeEntry from 'better-hooks/use-window-size';

test('direct entries match the root API', () => {
  expectTypeOf(asyncEntry.useAsync).toEqualTypeOf<typeof root.useAsync>();
  expectTypeOf(booleanEntry.useBoolean).toEqualTypeOf<typeof root.useBoolean>();
  expectTypeOf(clickOutsideEntry.useClickOutside).toEqualTypeOf<typeof root.useClickOutside>();
  expectTypeOf(controllableEntry.useControllableState).toEqualTypeOf<
    typeof root.useControllableState
  >();
  expectTypeOf(debounceEntry.useDebounce).toEqualTypeOf<typeof root.useDebounce>();
  expectTypeOf(debounceFnEntry.useDebounceFn).toEqualTypeOf<typeof root.useDebounceFn>();
  expectTypeOf(documentVisibilityEntry.useDocumentVisibility).toEqualTypeOf<
    typeof root.useDocumentVisibility
  >();
  expectTypeOf(eventListenerEntry.useEventListener).toEqualTypeOf<typeof root.useEventListener>();
  expectTypeOf(hoverEntry.useHover).toEqualTypeOf<typeof root.useHover>();
  expectTypeOf(inputEntry.useInput).toEqualTypeOf<typeof root.useInput>();
  expectTypeOf(intervalEntry.useInterval).toEqualTypeOf<typeof root.useInterval>();
  expectTypeOf(isMountedEntry.useIsMounted).toEqualTypeOf<typeof root.useIsMounted>();
  expectTypeOf(isomorphicEntry.useIsomorphicLayoutEffect).toEqualTypeOf<
    typeof root.useIsomorphicLayoutEffect
  >();
  expectTypeOf(keyPressEntry.useKeyPress).toEqualTypeOf<typeof root.useKeyPress>();
  expectTypeOf(latestEntry.useLatest).toEqualTypeOf<typeof root.useLatest>();
  expectTypeOf(localStorageEntry.useLocalStorage).toEqualTypeOf<typeof root.useLocalStorage>();
  expectTypeOf(lockFnEntry.useLockFn).toEqualTypeOf<typeof root.useLockFn>();
  expectTypeOf(memoizedFnEntry.useMemoizedFn).toEqualTypeOf<typeof root.useMemoizedFn>();
  expectTypeOf(mediaQueryEntry.useMediaQuery).toEqualTypeOf<typeof root.useMediaQuery>();
  expectTypeOf(onlineEntry.useOnline).toEqualTypeOf<typeof root.useOnline>();
  expectTypeOf(previousEntry.usePrevious).toEqualTypeOf<typeof root.usePrevious>();
  expectTypeOf(resetStateEntry.useResetState).toEqualTypeOf<typeof root.useResetState>();
  expectTypeOf(safeStateEntry.useSafeState).toEqualTypeOf<typeof root.useSafeState>();
  expectTypeOf(sessionStorageEntry.useSessionStorage).toEqualTypeOf<
    typeof root.useSessionStorage
  >();
  expectTypeOf(storageEntry.useLocalStorage).toEqualTypeOf<typeof root.useLocalStorage>();
  expectTypeOf(storageEntry.useSessionStorage).toEqualTypeOf<typeof root.useSessionStorage>();
  expectTypeOf(throttleEntry.useThrottle).toEqualTypeOf<typeof root.useThrottle>();
  expectTypeOf(throttleFnEntry.useThrottleFn).toEqualTypeOf<typeof root.useThrottleFn>();
  expectTypeOf(timeoutEntry.useTimeout).toEqualTypeOf<typeof root.useTimeout>();
  expectTypeOf(toggleEntry.useToggle).toEqualTypeOf<typeof root.useToggle>();
  expectTypeOf(unmountedRefEntry.useUnmountedRef).toEqualTypeOf<typeof root.useUnmountedRef>();
  expectTypeOf(windowSizeEntry.useWindowSize).toEqualTypeOf<typeof root.useWindowSize>();
});

test('generic Hooks preserve useful inference', () => {
  const [toggleValue, toggle] = root.useToggle(true);
  expectTypeOf(toggleValue).toBeBoolean();
  expectTypeOf(toggle).parameter(0).toEqualTypeOf<root.ToggleUpdater | undefined>();

  const request = root.useAsync(async () => ({ id: 1 }));
  expectTypeOf(request.data).toEqualTypeOf<{ id: number } | undefined>();
  expectTypeOf(request.run).returns.toEqualTypeOf<Promise<{ id: number }>>();

  const debounced = root.useDebounce('value', { delay: 100 });
  const throttled = root.useThrottle(1, { delay: 100 });
  expectTypeOf(debounced).toBeString();
  expectTypeOf(throttled).toBeNumber();

  const action = root.useDebounceFn((value: string, count: number) => value.repeat(count), {
    delay: 100,
  });
  expectTypeOf(action.run).parameters.toEqualTypeOf<[string, number]>();
  expectTypeOf(action.flush).returns.toEqualTypeOf<string | undefined>();

  const [controlled, setControlled] = root.useControllableState({ defaultValue: 'ready' });
  expectTypeOf(controlled).toBeString();
  expectTypeOf(setControlled).parameter(0).toEqualTypeOf<string | ((previous: string) => string)>();

  const previous = root.usePrevious(1, 'initial');
  expectTypeOf(previous).toEqualTypeOf<number | string>();

  const stored = root.useLocalStorage('count', 0);
  expectTypeOf(stored.value).toBeNumber();
  expectTypeOf(stored.setValue)
    .parameter(0)
    .toEqualTypeOf<number | ((previous: number) => number)>();

  const memoized = root.useMemoizedFn((value: number, suffix: string) => `${value}:${suffix}`);
  expectTypeOf(memoized).parameters.toEqualTypeOf<[value: number, suffix: string]>();
  expectTypeOf(memoized).returns.toBeString();

  const [safeState, setSafeState] = root.useSafeState({ ready: false });
  expectTypeOf(safeState).toEqualTypeOf<{ ready: boolean }>();
  expectTypeOf(setSafeState)
    .parameter(0)
    .toEqualTypeOf<{ ready: boolean } | ((previous: { ready: boolean }) => { ready: boolean })>();

  const [resetState, setResetState, resetStateValue] = root.useResetState(0);
  expectTypeOf(resetState).toBeNumber();
  expectTypeOf(setResetState).parameter(0).toEqualTypeOf<number | ((previous: number) => number)>();
  expectTypeOf(resetStateValue).returns.toBeVoid();

  const unmountedRef = root.useUnmountedRef();
  expectTypeOf(unmountedRef.current).toBeBoolean();

  const visibility = root.useDocumentVisibility({ enabled: true, capture: true });
  expectTypeOf(visibility).toEqualTypeOf<root.VisibilityState>();
  const hovering = root.useHover({ enabled: true });
  expectTypeOf(hovering).toBeBoolean();

  const keyPressHandler = (event: KeyboardEvent, key: root.KeyType): void => {
    expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
    expectTypeOf(key).toEqualTypeOf<root.KeyType>();
  };
  root.useKeyPress(['ctrl', 's'], keyPressHandler, { exactMatch: true });

  const locked = root.useLockFn(async (value: number) => value.toString());
  expectTypeOf(locked).parameters.toEqualTypeOf<[value: number]>();
  expectTypeOf(locked).returns.toEqualTypeOf<Promise<string | undefined>>();
});

test('event overloads infer native events', () => {
  root.useEventListener('resize', (event) => {
    expectTypeOf(event).toEqualTypeOf<UIEvent>();
  });
  root.useEventListener(document, 'pointerdown', (event) => {
    expectTypeOf(event).toEqualTypeOf<PointerEvent>();
  });
});

test('error observers accept unknown errors across callback hooks', () => {
  const onError: root.HookErrorHandler = (error) => {
    expectTypeOf(error).toBeUnknown();
  };

  root.useAsync(async () => undefined, { onError });
  root.useTimeout(() => undefined, null, { onError });
  root.useInterval(() => undefined, null, { onError });
  root.useDebounceFn(() => undefined, { delay: 10, onError });
  root.useThrottleFn(() => undefined, { delay: 10, onError });
  root.useEventListener('click', () => undefined, { onError });
  root.useClickOutside({ current: null }, () => undefined, { onError });
  root.useMediaQuery('(min-width: 1px)', { onError });
  root.useKeyPress('Enter', () => undefined, { onError });
  root.useHover({ onError });
  root.useLockFn(() => undefined, { onError });
});

test('invalid calls are rejected', () => {
  // @ts-expect-error A debounce delay is required.
  root.useDebounce('value', {});
  // @ts-expect-error maxWait is controlled internally by throttle.
  root.useThrottle('value', { delay: 10, maxWait: 20 });
  // @ts-expect-error Input values are strings.
  root.useInput({ value: 1 });
  // @ts-expect-error Storage codecs must return the stored value type.
  root.useLocalStorage('value', 1, { deserialize: () => 'wrong' });
});
