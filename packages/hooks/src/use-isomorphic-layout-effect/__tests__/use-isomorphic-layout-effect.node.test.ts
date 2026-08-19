// @vitest-environment node

import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { useIsomorphicLayoutEffect } from '../index.js';

describe('useIsomorphicLayoutEffect on the server', () => {
  it('falls back to useEffect when window is unavailable', () => {
    expect(typeof window).toBe('undefined');
    expect(useIsomorphicLayoutEffect).toBe(useEffect);
  });
});
