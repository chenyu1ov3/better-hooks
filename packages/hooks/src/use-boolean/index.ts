'use client';

import { useCallback, useMemo } from 'react';
import { useToggle, type ToggleUpdater } from '../use-toggle/index.js';

/** @public */
export interface UseBooleanActions {
  /** Sets the value to true. */
  readonly setTrue: () => void;
  /** Sets the value to false. */
  readonly setFalse: () => void;
  /** Toggles the value or applies an explicit/functional update. */
  readonly toggle: (next?: ToggleUpdater) => void;
}

/** @public */
export interface UseBooleanResult extends UseBooleanActions {
  /** The current boolean value. */
  readonly value: boolean;
  /** Alias for value for callers that prefer an explicit boolean name. */
  readonly boolean: boolean;
}

/**
 * Boolean state with explicit true/false actions.
 *
 * @param initialValue - The value captured on the first render.
 * @returns The current value and stable boolean actions.
 * @public
 */
export function useBoolean(initialValue = false): UseBooleanResult {
  const [value, toggle] = useToggle(initialValue);
  const setTrue = useCallback(() => toggle(true), [toggle]);
  const setFalse = useCallback(() => toggle(false), [toggle]);

  return useMemo(
    () => ({ value, boolean: value, setTrue, setFalse, toggle }),
    [value, setTrue, setFalse, toggle],
  );
}
