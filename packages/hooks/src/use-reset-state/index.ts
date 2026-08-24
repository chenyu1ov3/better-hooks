'use client';

import { useRef, type Dispatch, type SetStateAction } from 'react';
import { useMemoizedFn } from '../use-memoized-fn/index.js';
import { useSafeState } from '../use-safe-state/index.js';

/** State, setter, and reset action returned by {@link useResetState}. @public */
export type UseResetStateResult<S> = readonly [
  state: S,
  setState: Dispatch<SetStateAction<S>>,
  resetState: () => void,
];

/**
 * Manages state with a stable action that restores its first resolved value.
 *
 * The snapshot is taken from the first state initialization and is not changed
 * when a later render receives a different initializer. The setter is safe to
 * call from delayed work after unmount.
 *
 * @param initialState - Initial state or a lazy initializer.
 * @returns State, a state setter, and a stable reset action.
 * @public
 */
export function useResetState<S>(initialState: S | (() => S)): UseResetStateResult<S> {
  const [state, setState] = useSafeState(initialState);
  // useRef keeps the first resolved state even when initialState changes later.
  const initialStateRef = useRef(state);
  const resetState = useMemoizedFn(() => {
    // Wrap the snapshot so function-valued state is restored as a value.
    setState(() => initialStateRef.current);
  });

  return [state, setState, resetState];
}
