import { expectTypeOf, test } from 'vitest';
import * as root from '../index.js';
import * as asyncEntry from 'better-hook/use-async';
import * as booleanEntry from 'better-hook/use-boolean';
import * as clickOutsideEntry from 'better-hook/use-click-outside';
import * as controllableEntry from 'better-hook/use-controllable-state';
import * as debounceEntry from 'better-hook/use-debounce';
import * as debounceFnEntry from 'better-hook/use-debounce-fn';
import * as eventListenerEntry from 'better-hook/use-event-listener';
import * as inputEntry from 'better-hook/use-input';
import * as intervalEntry from 'better-hook/use-interval';
import * as isMountedEntry from 'better-hook/use-is-mounted';
import * as isomorphicEntry from 'better-hook/use-isomorphic-layout-effect';
import * as latestEntry from 'better-hook/use-latest';
import * as localStorageEntry from 'better-hook/use-local-storage';
import * as mediaQueryEntry from 'better-hook/use-media-query';
import * as onlineEntry from 'better-hook/use-online';
import * as previousEntry from 'better-hook/use-previous';
import * as sessionStorageEntry from 'better-hook/use-session-storage';
import * as storageEntry from 'better-hook/use-storage';
import * as throttleEntry from 'better-hook/use-throttle';
import * as throttleFnEntry from 'better-hook/use-throttle-fn';
import * as timeoutEntry from 'better-hook/use-timeout';
import * as toggleEntry from 'better-hook/use-toggle';
import * as windowSizeEntry from 'better-hook/use-window-size';

test('direct entries match the root API', () => {
  expectTypeOf(asyncEntry.useAsync).toEqualTypeOf<typeof root.useAsync>();
  expectTypeOf(booleanEntry.useBoolean).toEqualTypeOf<typeof root.useBoolean>();
  expectTypeOf(clickOutsideEntry.useClickOutside).toEqualTypeOf<typeof root.useClickOutside>();
  expectTypeOf(controllableEntry.useControllableState).toEqualTypeOf<
    typeof root.useControllableState
  >();
  expectTypeOf(debounceEntry.useDebounce).toEqualTypeOf<typeof root.useDebounce>();
  expectTypeOf(debounceFnEntry.useDebounceFn).toEqualTypeOf<typeof root.useDebounceFn>();
  expectTypeOf(eventListenerEntry.useEventListener).toEqualTypeOf<typeof root.useEventListener>();
  expectTypeOf(inputEntry.useInput).toEqualTypeOf<typeof root.useInput>();
  expectTypeOf(intervalEntry.useInterval).toEqualTypeOf<typeof root.useInterval>();
  expectTypeOf(isMountedEntry.useIsMounted).toEqualTypeOf<typeof root.useIsMounted>();
  expectTypeOf(isomorphicEntry.useIsomorphicLayoutEffect).toEqualTypeOf<
    typeof root.useIsomorphicLayoutEffect
  >();
  expectTypeOf(latestEntry.useLatest).toEqualTypeOf<typeof root.useLatest>();
  expectTypeOf(localStorageEntry.useLocalStorage).toEqualTypeOf<typeof root.useLocalStorage>();
  expectTypeOf(mediaQueryEntry.useMediaQuery).toEqualTypeOf<typeof root.useMediaQuery>();
  expectTypeOf(onlineEntry.useOnline).toEqualTypeOf<typeof root.useOnline>();
  expectTypeOf(previousEntry.usePrevious).toEqualTypeOf<typeof root.usePrevious>();
  expectTypeOf(sessionStorageEntry.useSessionStorage).toEqualTypeOf<
    typeof root.useSessionStorage
  >();
  expectTypeOf(storageEntry.useLocalStorage).toEqualTypeOf<typeof root.useLocalStorage>();
  expectTypeOf(storageEntry.useSessionStorage).toEqualTypeOf<typeof root.useSessionStorage>();
  expectTypeOf(throttleEntry.useThrottle).toEqualTypeOf<typeof root.useThrottle>();
  expectTypeOf(throttleFnEntry.useThrottleFn).toEqualTypeOf<typeof root.useThrottleFn>();
  expectTypeOf(timeoutEntry.useTimeout).toEqualTypeOf<typeof root.useTimeout>();
  expectTypeOf(toggleEntry.useToggle).toEqualTypeOf<typeof root.useToggle>();
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
});

test('event overloads infer native events', () => {
  root.useEventListener('resize', (event) => {
    expectTypeOf(event).toEqualTypeOf<UIEvent>();
  });
  root.useEventListener(document, 'pointerdown', (event) => {
    expectTypeOf(event).toEqualTypeOf<PointerEvent>();
  });
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
