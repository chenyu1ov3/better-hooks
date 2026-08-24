'use client';

import { useEffect, useRef } from 'react';
import { normalizeDelay } from '../utils/timing.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Options for {@link useInterval}. @public */
export interface UseIntervalOptions {
  /** Observes callback failures before they are rethrown. */
  readonly onError?: HookErrorHandler;
}

/**
 * Repeatedly runs the latest callback at `delay` millisecond intervals.
 * Pass `null` to stop the interval.
 * @public
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: UseIntervalOptions = {},
): void {
  const callbackRef = useRef(callback);
  const onErrorRef = useRef(options.onError);
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);
  useEffect(() => {
    if (delay === null) return;
    let timer: ReturnType<typeof setInterval>;
    const tick = () => {
      try {
        callbackRef.current();
      } catch (error) {
        clearInterval(timer);
        notifyHookError(error, onErrorRef.current);
        throw error;
      }
    };
    timer = setInterval(tick, normalizeDelay(delay));
    return () => clearInterval(timer);
  }, [delay]);
}
