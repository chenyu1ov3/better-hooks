'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

/** An initial Set value or a lazy iterable initializer. @public */
export type SetInitializer<T> = Iterable<T> | (() => Iterable<T>);

/** Stable actions returned by {@link useSet}. @public */
export interface UseSetActions<T> {
  /** Adds a value when it is not already present. */
  readonly add: (value: T) => void;
  /** Removes a value when it is present. */
  readonly remove: (value: T) => void;
  /** Adds a value or removes it when it is already present. */
  readonly toggle: (value: T) => void;
  /** Removes every value. */
  readonly clear: () => void;
  /** Restores the first captured values. */
  readonly reset: () => void;
}

/** A readonly Set snapshot and stable actions returned by {@link useSet}. @public */
export type UseSetResult<T> = readonly [ReadonlySet<T>, UseSetActions<T>];

function resolveInitialSet<T>(initialValue: SetInitializer<T> | undefined): Set<T> {
  const source = typeof initialValue === 'function' ? initialValue() : initialValue;
  return source === undefined ? new Set<T>() : new Set(source);
}

function sameSet<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  if (left.size !== right.size) return false;
  const rightValues = [...right.values()];
  let index = 0;
  for (const value of left) {
    if (!Object.is(rightValues[index], value)) return false;
    index += 1;
  }
  return true;
}

/**
 * Manages an immutable Set snapshot with stable mutation actions.
 *
 * @param initialValue - Values or a lazy values initializer captured once.
 * @returns A readonly Set and stable actions.
 * @public
 */
export function useSet<T>(initialValue?: SetInitializer<T>): UseSetResult<T> {
  const initialSetRef = useRef<Set<T> | null>(null);
  if (initialSetRef.current === null) initialSetRef.current = resolveInitialSet(initialValue);
  const initialSet = initialSetRef.current;
  const [set, setSet] = useState<Set<T>>(() => new Set(initialSet));

  const add = useCallback((value: T) => {
    setSet((previous) => {
      if (previous.has(value)) return previous;
      const next = new Set(previous);
      next.add(value);
      return next;
    });
  }, []);

  const remove = useCallback((value: T) => {
    setSet((previous) => {
      if (!previous.has(value)) return previous;
      const next = new Set(previous);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSet((previous) => (previous.size === 0 ? previous : new Set()));
  }, []);

  const reset = useCallback(() => {
    const captured = initialSetRef.current;
    if (captured === null) return;
    setSet((previous) => (sameSet(previous, captured) ? previous : new Set(captured)));
  }, []);

  const actions = useMemo<UseSetActions<T>>(
    () => ({ add, clear, remove, reset, toggle }),
    [add, clear, remove, reset, toggle],
  );

  return [set, actions];
}
