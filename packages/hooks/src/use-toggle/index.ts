'use client';

import { useCallback, useState } from 'react';

/** @public */
export type ToggleUpdater = boolean | ((previous: boolean) => boolean);

/** @public */
export type UseToggleResult = readonly [value: boolean, toggle: (next?: ToggleUpdater) => void];

/**
 * A small boolean state primitive with a stable update function.
 *
 * Calling the action without an argument inverts the latest state. Passing a
 * boolean sets it explicitly, while a function receives the latest queued
 * value so batched updates compose correctly.
 *
 * @param initialValue - The value captured on the first render.
 * @returns The current value and a stable update action.
 * @public
 */
export function useToggle(initialValue = false): UseToggleResult {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback((next?: ToggleUpdater) => {
    setValue((previous) => {
      if (next === undefined) return !previous;
      return typeof next === 'function' ? next(previous) : next;
    });
  }, []);

  return [value, toggle] as const;
}
