'use client';

import { useEffect, useRef } from 'react';

/**
 * Returns the last committed value. It is undefined on the first render.
 *
 * @param value - The value stored after the current commit.
 * @public
 */
export function usePrevious<T>(value: T): T | undefined;
/**
 * Returns the last committed value, or initialValue before the first commit.
 *
 * @param value - The value stored after the current commit.
 * @param initialValue - The value returned before the first commit.
 * @public
 */
export function usePrevious<T, U>(value: T, initialValue: U): T | U;
export function usePrevious<T, U>(value: T, initialValue?: U): T | U | undefined {
  const ref = useRef<T | U | undefined>(initialValue);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
