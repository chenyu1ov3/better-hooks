'use client';

import { useCallback, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** @public */
export type IsMounted = () => boolean;

/**
 * Returns a stable function that reports whether the component has committed.
 *
 * The flag becomes available during the layout phase and is cleared before
 * unmount cleanup completes. It remains false during server rendering.
 *
 * @returns A stable function that reads the current mounted state.
 * @public
 */
export function useIsMounted(): IsMounted {
  const mountedRef = useRef(false);
  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return useCallback(() => mountedRef.current, []);
}
