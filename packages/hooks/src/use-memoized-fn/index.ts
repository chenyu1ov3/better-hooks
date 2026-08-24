'use client';

import { useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/**
 * Returns a function whose identity remains stable while it invokes the
 * latest committed callback.
 *
 * The callback reference is published from a layout effect. A callback from a
 * render that is abandoned by Suspense or concurrent rendering is therefore
 * never observable through the returned function.
 *
 * @param fn - Callback to invoke when the returned function is called.
 * @returns A stable function with the same parameter and return types as `fn`.
 * @public
 */
export function useMemoizedFn<T extends (...args: never[]) => unknown>(fn: T): T {
  const fnRef = useRef(fn);

  useIsomorphicLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const memoizedFnRef = useRef<T | undefined>(undefined);
  if (memoizedFnRef.current === undefined) {
    memoizedFnRef.current = function memoizedFn(
      this: unknown,
      ...args: Parameters<T>
    ): ReturnType<T> {
      return Reflect.apply(fnRef.current, this, args) as ReturnType<T>;
    } as T;
  }

  return memoizedFnRef.current;
}
