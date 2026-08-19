'use client';

import { useCallback, useRef, useState } from 'react';
import { normalizeDelay } from '../utils/timing.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/**
 * Runs the latest callback once after `delay` milliseconds.
 * Pass `null` to disable the timeout; `cancel` remains effective until `delay` changes.
 * @public
 */
export function useTimeout(
  callback: () => void,
  delay: number | null,
): { readonly cancel: () => void; readonly pending: boolean } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(false);
  const cancelledRef = useRef(false);
  const pendingRef = useRef(delay !== null);
  const [, setPendingState] = useState(delay !== null);
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);
  const setPending = useCallback((nextPending: boolean) => {
    pendingRef.current = nextPending;
    if (mountedRef.current) setPendingState(nextPending);
  }, []);
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    setPending(false);
  }, [clearTimer, setPending]);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      pendingRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  useIsomorphicLayoutEffect(() => {
    cancelledRef.current = false;
    clearTimer();
    if (delay === null) {
      setPending(false);
      return clearTimer;
    }
    setPending(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      if (!mountedRef.current || cancelledRef.current) return;
      setPending(false);
      callbackRef.current();
    }, normalizeDelay(delay));
    return clearTimer;
  }, [clearTimer, delay, setPending]);
  return {
    cancel,
    get pending() {
      return pendingRef.current;
    },
  };
}
