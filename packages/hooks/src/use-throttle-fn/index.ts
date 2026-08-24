'use client';

import { useCallback, useRef, useState } from 'react';
import { normalizeDelay } from '../utils/timing.js';
import type { DebouncedFunction } from '../use-debounce-fn/index.js';
import type { ThrottleOptions } from '../use-throttle/index.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Controls a throttled function invocation. @public */
export type ThrottledFunction<Args extends unknown[], Result> = DebouncedFunction<Args, Result>;

/** Options for {@link useThrottleFn}. @public */
export interface ThrottleFnOptions extends ThrottleOptions {
  /** Observes callback failures before they are rethrown. */
  readonly onError?: HookErrorHandler;
}

interface ThrottleState<Args extends unknown[], Result> {
  timer?: ReturnType<typeof setInterval>;
  args?: Args;
  value?: Result;
  open: boolean;
  live: boolean;
  order: number;
}

/** Throttles calls to the latest function. @public */
export function useThrottleFn<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: ThrottleFnOptions,
): ThrottledFunction<Args, Result> {
  const delay = normalizeDelay(options.delay);
  const leading = options.leading ?? true;
  const trailing = options.trailing ?? true;
  const fnRef = useRef(fn);
  const onErrorRef = useRef(options.onError);
  const timingRef = useRef({ delay, leading, trailing });
  const state = useRef<ThrottleState<Args, Result>>({
    open: false,
    live: false,
    order: 0,
  }).current;
  const [, refresh] = useState(false);

  const drop = useCallback(() => {
    delete state.args;
    if (state.live) refresh(false);
  }, [state]);

  const cancel = useCallback(() => {
    if (state.timer !== undefined) clearInterval(state.timer);
    delete state.timer;
    state.open = false;
    drop();
  }, [drop, state]);

  const call = useCallback(
    (args: Args) => {
      const order = ++state.order;
      const value = fnRef.current(...args);
      if (order === state.order) state.value = value;
      return state.value;
    },
    [state],
  );

  const invoke = useCallback(
    (args: Args) => {
      try {
        return call(args);
      } catch (error) {
        cancel();
        notifyHookError(error, onErrorRef.current);
        throw error;
      }
    },
    [call, cancel],
  );

  const tick = useCallback(() => {
    const args = state.args;
    if (args === undefined) {
      cancel();
      return state.value;
    }
    drop();
    return invoke(args);
  }, [cancel, drop, invoke, state]);

  const flush = useCallback(() => {
    const args = state.args;
    if (args === undefined) {
      cancel();
      return state.value;
    }
    if (state.timer !== undefined) clearInterval(state.timer);
    state.timer = setInterval(tick, timingRef.current.delay);
    drop();
    return invoke(args);
  }, [cancel, drop, invoke, state, tick]);

  const run = useCallback(
    (...args: Args) => {
      if (!state.live) return;
      const current = timingRef.current;
      if (!state.open) {
        state.open = true;
        state.timer = setInterval(tick, current.delay);
        if (current.leading) {
          invoke(args);
          return;
        }
      }

      if (current.trailing) {
        state.args = args;
        refresh(true);
      } else {
        drop();
      }
    },
    [drop, invoke, state, tick],
  );

  useIsomorphicLayoutEffect(() => {
    state.live = true;
    return () => {
      state.live = false;
      cancel();
    };
  }, [cancel, state]);

  useIsomorphicLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  useIsomorphicLayoutEffect(() => {
    const old = timingRef.current;
    const changed =
      !Object.is(old.delay, delay) || old.leading !== leading || old.trailing !== trailing;
    timingRef.current = { delay, leading, trailing };
    if (!changed || !state.live || !state.open) return;

    if (state.timer !== undefined) clearInterval(state.timer);
    if (!trailing) drop();
    state.timer = setInterval(tick, delay);
  }, [delay, drop, leading, state, tick, trailing]);

  return {
    run,
    cancel,
    flush,
    get pending() {
      return state.args !== undefined;
    },
  };
}
