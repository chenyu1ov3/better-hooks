'use client';

import { useRef, type RefObject } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/**
 * Returns a stable ref containing the latest committed value.
 *
 * The ref updates during the layout phase rather than during render. This
 * keeps abandoned concurrent renders private while making the committed value
 * available to layout effects declared after this Hook.
 *
 * @param value - The value to publish after the current render commits.
 * @returns A stable ref whose current value follows the latest commit.
 * @public
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
