'use client';

import { useRef, type RefObject } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/**
 * Returns a stable ref that becomes `true` after the component unmounts.
 *
 * The initial value is `false`, including during server rendering. The effect
 * setup explicitly restores `false` so React StrictMode's development-only
 * cleanup and re-setup cycle does not leave a live component marked unmounted.
 *
 * @returns A stable ref whose current value indicates unmount status.
 * @public
 */
export function useUnmountedRef(): RefObject<boolean> {
  const unmountedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  return unmountedRef;
}
