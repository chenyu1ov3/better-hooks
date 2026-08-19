'use client';

import { useEffect, useRef } from 'react';
import { normalizeDelay } from '../utils/timing.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/**
 * Repeatedly runs the latest callback at `delay` millisecond intervals.
 * Pass `null` to stop the interval.
 * @public
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback);
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const timer = setInterval(() => callbackRef.current(), normalizeDelay(delay));
    return () => clearInterval(timer);
  }, [delay]);
}
