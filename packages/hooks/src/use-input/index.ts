'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** Options for {@link useInput}. @public */
export interface UseInputOptions {
  /** Initial value for an uncontrolled input. Captured on the first render. */
  readonly initialValue?: string;
  /** Controlled value. A defined first value enables controlled mode. */
  readonly value?: string;
  /** Called whenever an action requests a value change. */
  readonly onChange?: (value: string) => void;
}

/** Value and stable actions returned by {@link useInput}. @public */
export interface UseInputResult {
  /** Current controlled or uncontrolled value. */
  readonly value: string;
  /** Accepts a React text-input event or a plain string. */
  readonly onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => void;
  /** Requests the initially captured value. */
  readonly reset: () => void;
  /** Requests an empty string. */
  readonly clear: () => void;
}

/**
 * Manages a text input in either controlled or uncontrolled mode.
 *
 * The mode is fixed by the first render. Later mode changes are ignored and
 * produce one development warning, matching React's input ownership model.
 *
 * @param options - Initial, controlled, and change-notification options.
 * @returns The current string and input-compatible stable actions.
 * @public
 */
export function useInput(options: UseInputOptions = {}): UseInputResult {
  const initialRef = useRef(options.initialValue ?? '');
  const isControlledRef = useRef(options.value !== undefined);
  const isControlled = isControlledRef.current;
  const isControlledProp = options.value !== undefined;
  const warnedRef = useRef(false);
  const [internal, setInternal] = useState(initialRef.current);
  const controlledValueRef = useRef(options.value ?? initialRef.current);
  const onChangeRef = useRef(options.onChange);

  const value = isControlled
    ? isControlledProp
      ? options.value
      : controlledValueRef.current
    : internal;

  useIsomorphicLayoutEffect(() => {
    if (isControlled && isControlledProp) controlledValueRef.current = options.value;
    onChangeRef.current = options.onChange;
  }, [isControlled, isControlledProp, options.onChange, options.value]);

  useIsomorphicLayoutEffect(() => {
    if (
      isControlled !== isControlledProp &&
      !warnedRef.current &&
      (typeof process === 'undefined' || process.env.NODE_ENV !== 'production')
    ) {
      warnedRef.current = true;
      console.warn(
        `useInput cannot switch from ${isControlled ? 'controlled' : 'uncontrolled'} to ${isControlledProp ? 'controlled' : 'uncontrolled'} mode. The mode from the first render is preserved.`,
      );
    }
  }, [isControlled, isControlledProp]);

  const setValue = useCallback((next: string) => {
    if (!isControlledRef.current) setInternal(next);
    onChangeRef.current?.(next);
  }, []);
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      setValue(typeof event === 'string' ? event : event.target.value);
    },
    [setValue],
  );
  const reset = useCallback(() => setValue(initialRef.current), [setValue]);
  const clear = useCallback(() => setValue(''), [setValue]);
  return { value, onChange, reset, clear };
}
