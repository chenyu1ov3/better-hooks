'use client';

import { useCallback, useRef } from 'react';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** Options for {@link useLockFn}. @public */
export interface UseLockFnOptions {
  /** Observes a rejected invocation before the original error is rethrown. */
  readonly onError?: HookErrorHandler;
}

/** The stable function returned by {@link useLockFn}. @public */
export type LockFn<Args extends readonly unknown[], Result> = (
  ...args: Args
) => Promise<Result | undefined>;

/**
 * Prevents overlapping calls to an async or sync function.
 *
 * Calls made while another invocation is pending resolve to `undefined`. The
 * lock is released in `finally`, including when the function throws or
 * rejects, and the original failure remains a rejected promise.
 *
 * @public
 */
export function useLockFn<Args extends readonly unknown[], Result>(
  fn: (...args: Args) => Result | PromiseLike<Result>,
  options: UseLockFnOptions = {},
): LockFn<Args, Awaited<Result>> {
  const fnRef = useRef(fn);
  const onErrorRef = useRef(options.onError);
  const lockRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  return useCallback(async (...args: Args): Promise<Awaited<Result> | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    try {
      return await fnRef.current(...args);
    } catch (error) {
      notifyHookError(error, onErrorRef.current);
      throw error;
    } finally {
      lockRef.current = false;
    }
  }, []);
}
