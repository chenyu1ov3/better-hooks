'use client';

import { useCallback, useRef, useState } from 'react';
import { normalizeDelay } from '../utils/timing.js';
import type { DebounceOptions } from '../use-debounce/index.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Controls a debounced function invocation. @public */
export interface DebouncedFunction<Args extends unknown[], Result> {
  readonly run: (...args: Args) => void;
  readonly cancel: () => void;
  readonly flush: () => Result | undefined;
  readonly pending: boolean;
}

interface TimingOptions {
  readonly delay: number;
  readonly leading: boolean;
  readonly trailing: boolean;
  readonly maxWait: number | undefined;
}

/** Options for {@link useDebounceFn}. @public */
export interface DebounceFnOptions extends DebounceOptions {
  /** Observes callback failures before they are rethrown. */
  readonly onError?: HookErrorHandler;
}

interface SchedulerState<Args extends unknown[], Result> {
  wait?: ReturnType<typeof setTimeout>;
  max?: ReturnType<typeof setTimeout>;
  args?: Args;
  value?: Result;
  open: boolean;
  live: boolean;
  order: number;
}

/** Debounces calls to the latest function. @public */
export function useDebounceFn<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options: DebounceFnOptions,
): DebouncedFunction<Args, Result> {
  const timing: TimingOptions = {
    delay: normalizeDelay(options.delay),
    leading: options.leading ?? false,
    trailing: options.trailing ?? true,
    maxWait: options.maxWait === undefined ? undefined : normalizeDelay(options.maxWait),
  };
  const fnRef = useRef(fn);
  const onErrorRef = useRef(options.onError);
  const timingRef = useRef(timing);
  const state = useRef<SchedulerState<Args, Result>>({
    open: false,
    live: false,
    order: 0,
  }).current;
  const [, refresh] = useState(false);

  const clear = useCallback(() => {
    if (state.wait !== undefined) clearTimeout(state.wait);
    if (state.max !== undefined) clearTimeout(state.max);
    delete state.wait;
    delete state.max;
  }, [state]);

  const drop = useCallback(() => {
    delete state.args;
    if (state.live) refresh(false);
  }, [state]);

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
        clear();
        state.open = false;
        drop();
        notifyHookError(error, onErrorRef.current);
        throw error;
      }
    },
    [call, clear, drop, state],
  );

  const flush = useCallback(() => {
    clear();
    state.open = false;
    const args = state.args;
    if (args === undefined) return state.value;
    drop();
    return invoke(args);
  }, [clear, drop, invoke, state]);

  const start = useCallback(() => {
    const current = timingRef.current;
    state.wait = setTimeout(flush, current.delay);
    if (current.maxWait !== undefined) state.max = setTimeout(flush, current.maxWait);
  }, [flush, state]);

  const cancel = useCallback(() => {
    clear();
    state.open = false;
    drop();
  }, [clear, drop, state]);

  const run = useCallback(
    (...args: Args) => {
      if (!state.live) return;
      const current = timingRef.current;
      if (!state.open) {
        state.open = true;
        start();
        if (current.leading) {
          invoke(args);
          return;
        }
      } else {
        if (state.wait !== undefined) clearTimeout(state.wait);
        state.wait = setTimeout(flush, current.delay);
      }

      if (current.trailing) {
        state.args = args;
        refresh(true);
      } else {
        drop();
      }
    },
    [drop, flush, invoke, start, state],
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
      !Object.is(old.delay, timing.delay) ||
      old.leading !== timing.leading ||
      old.trailing !== timing.trailing ||
      !Object.is(old.maxWait, timing.maxWait);
    timingRef.current = timing;
    if (!changed || !state.live || !state.open) return;

    clear();
    if (!timing.trailing) drop();
    start();
  }, [clear, drop, start, state, timing.delay, timing.leading, timing.maxWait, timing.trailing]);

  return {
    run,
    cancel,
    flush,
    get pending() {
      return state.args !== undefined;
    },
  };
}
