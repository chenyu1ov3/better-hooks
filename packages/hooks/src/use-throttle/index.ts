'use client';

import { useDebounce, type DebounceOptions } from '../use-debounce/index.js';

/** @public */
export type ThrottleOptions = Omit<DebounceOptions, 'maxWait'> & { readonly delay: number };

/**
 * Returns at most one updated value for each `delay` millisecond window.
 * Leading and trailing publication are enabled by default.
 * @public
 */
export function useThrottle<T>(value: T, options: ThrottleOptions): T {
  return useDebounce(value, {
    ...options,
    leading: options.leading ?? true,
    trailing: options.trailing ?? true,
    maxWait: options.delay,
  });
}
