'use client';

import { useCallback, useRef, useState, type SetStateAction } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** Options for {@link useControllableState}. @public */
export interface UseControllableStateOptions<T> {
  /** Controlled value. Presence on the first render enables controlled mode. */
  readonly value?: T;
  /** Initial value or lazy initializer for uncontrolled mode. */
  readonly defaultValue?: T | (() => T);
  /** Called when the stable setter resolves to a changed value. */
  readonly onChange?: (value: T) => void;
}

/** @public */
export type UseControllableStateResult<T> = readonly [
  value: T,
  setValue: (next: SetStateAction<T>) => void,
];

/**
 * Controlled/uncontrolled state primitive. The setter remains referentially
 * stable and invokes onChange for both controlled and uncontrolled updates.
 * The ownership mode is fixed on the first render.
 *
 * @param options - Controlled value, uncontrolled default, and change handler.
 * @returns The current value and a stable setter.
 * @public
 */
export function useControllableState<T>(
  options: UseControllableStateOptions<T> & { readonly defaultValue: T | (() => T) },
): UseControllableStateResult<T>;
/** @public */
export function useControllableState<T>(
  options?: UseControllableStateOptions<T>,
): UseControllableStateResult<T | undefined>;
export function useControllableState<T>(
  options: UseControllableStateOptions<T> = {},
): UseControllableStateResult<T | undefined> {
  const { value: controlledValue, defaultValue, onChange } = options;
  const hasControlledValue = Object.prototype.hasOwnProperty.call(options, 'value');
  const isControlledRef = useRef(hasControlledValue);
  const isControlled = isControlledRef.current;
  const warnedRef = useRef(false);
  const [uncontrolledValue, setUncontrolledValue] = useState<T | undefined>(() => {
    if (isControlled) return undefined;
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });
  const controlledValueRef = useRef<T | undefined>(controlledValue);
  const value = isControlled
    ? hasControlledValue
      ? controlledValue
      : controlledValueRef.current
    : uncontrolledValue;
  const valueRef = useRef<T | undefined>(value);
  const onChangeRef = useRef(onChange);

  useIsomorphicLayoutEffect(() => {
    if (isControlled && hasControlledValue) controlledValueRef.current = controlledValue;
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [controlledValue, hasControlledValue, isControlled, onChange, value]);

  useIsomorphicLayoutEffect(() => {
    if (
      isControlled !== hasControlledValue &&
      !warnedRef.current &&
      (typeof process === 'undefined' || process.env.NODE_ENV !== 'production')
    ) {
      warnedRef.current = true;
      console.warn(
        `useControllableState cannot switch from ${isControlled ? 'controlled' : 'uncontrolled'} to ${hasControlledValue ? 'controlled' : 'uncontrolled'} mode. The mode from the first render is preserved.`,
      );
    }
  }, [hasControlledValue, isControlled]);

  const setValue = useCallback((next: SetStateAction<T | undefined>) => {
    const previous = valueRef.current;
    const resolved =
      typeof next === 'function'
        ? (next as (previous: T | undefined) => T | undefined)(previous)
        : next;
    if (Object.is(previous, resolved)) return;

    // Mirror queued uncontrolled updates immediately so functional setters in
    // the same event compose before React commits the next state.
    if (!isControlledRef.current) {
      valueRef.current = resolved;
      setUncontrolledValue(resolved);
    }
    onChangeRef.current?.(resolved as T);
  }, []);

  return [value, setValue] as const;
}
