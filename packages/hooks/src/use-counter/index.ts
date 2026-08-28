'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** Options for {@link useCounter}. @public */
export interface UseCounterOptions {
  /** Inclusive lower bound applied to the initial value and future updates. */
  readonly min?: number;
  /** Inclusive upper bound applied to the initial value and future updates. */
  readonly max?: number;
}

/** A number or an updater based on the current count. @public */
export type CounterUpdater = number | ((previous: number) => number);

/** Stable actions returned by {@link useCounter}. @public */
export interface UseCounterActions {
  /** Increases the count by delta, which defaults to one. */
  readonly increment: (delta?: number) => void;
  /** Decreases the count by delta, which defaults to one. */
  readonly decrement: (delta?: number) => void;
  /** Sets the count directly or derives it from the current count. */
  readonly set: (next: CounterUpdater) => void;
  /** Restores the first resolved count, clamped to the current bounds. */
  readonly reset: () => void;
}

/** Count and stable actions returned by {@link useCounter}. @public */
export interface UseCounterResult extends UseCounterActions {
  /** The current bounded count. */
  readonly count: number;
}

function normalizeBound(value: number | undefined): number | undefined {
  return value !== undefined && Number.isFinite(value) ? value : undefined;
}

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  let next = value;
  if (max !== undefined) next = Math.min(next, max);
  if (min !== undefined) next = Math.max(next, min);
  return next;
}

/**
 * Manages a bounded numeric value with stable increment, decrement, set, and
 * reset actions.
 *
 * @param initialValue - The initial count captured on the first render.
 * @param options - Optional inclusive numeric bounds.
 * @returns The current count and stable actions.
 * @public
 */
export function useCounter(initialValue = 0, options: UseCounterOptions = {}): UseCounterResult {
  const min = normalizeBound(options.min);
  const max = normalizeBound(options.max);
  if (min !== undefined && max !== undefined && min > max) {
    throw new RangeError('useCounter requires min to be less than or equal to max.');
  }

  const [count, setCount] = useState(() => clamp(initialValue, min, max));
  const initialCountRef = useRef(count);
  const boundsRef = useRef({ min, max });

  useIsomorphicLayoutEffect(() => {
    boundsRef.current = { min, max };
  }, [max, min]);

  const set = useCallback((next: CounterUpdater) => {
    setCount((previous) => {
      const resolved = typeof next === 'function' ? next(previous) : next;
      const { min: currentMin, max: currentMax } = boundsRef.current;
      return clamp(resolved, currentMin, currentMax);
    });
  }, []);

  const increment = useCallback(
    (delta = 1) => {
      set((previous) => previous + delta);
    },
    [set],
  );

  const decrement = useCallback(
    (delta = 1) => {
      set((previous) => previous - delta);
    },
    [set],
  );

  const reset = useCallback(() => {
    setCount((previous) => {
      const { min: currentMin, max: currentMax } = boundsRef.current;
      const next = clamp(initialCountRef.current, currentMin, currentMax);
      return Object.is(previous, next) ? previous : next;
    });
  }, []);

  const actions = useMemo<UseCounterActions>(
    () => ({ decrement, increment, reset, set }),
    [decrement, increment, reset, set],
  );

  return useMemo(() => ({ count, ...actions }), [actions, count]);
}
