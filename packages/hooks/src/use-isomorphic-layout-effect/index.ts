'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * Uses `useLayoutEffect` in a browser and `useEffect` during server rendering.
 *
 * @remarks Selects the implementation at module evaluation time and never
 * reads browser globals while an effect is running.
 * @public
 */
export const useIsomorphicLayoutEffect: typeof useEffect =
  /* v8 ignore next -- both module-time choices have environment-specific tests. */
  typeof window === 'undefined' ? useEffect : useLayoutEffect;
