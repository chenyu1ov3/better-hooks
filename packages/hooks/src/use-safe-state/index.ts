'use client';

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** State and an update action that is ignored after unmount. @public */
export type UseSafeStateResult<S> = readonly [state: S, setState: Dispatch<SetStateAction<S>>];

/**
 * React state whose setter becomes a no-op once the component unmounts.
 *
 * Functional updaters are not evaluated after unmount, which makes delayed
 * callbacks safe to invoke without retaining work or producing React warnings.
 *
 * @param initialState - Initial state or a lazy initializer.
 * @returns The state value and a stable, unmount-aware setter.
 * @public
 */
export function useSafeState<S>(initialState: S | (() => S)): UseSafeStateResult<S> {
  const [state, setState] = useState(initialState);
  const mountedRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((next: SetStateAction<S>) => {
    if (!mountedRef.current) return;
    setState(next);
  }, []);

  return [state, safeSetState];
}
