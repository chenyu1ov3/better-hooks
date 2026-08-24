// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useUnmountedRef } from '../index.js';

describe('useUnmountedRef', () => {
  it('starts false, becomes true on unmount, and stays stable', () => {
    const { result, rerender, unmount } = renderHook(() => useUnmountedRef(), {
      wrapper: StrictMode,
    });
    const unmountedRef = result.current;

    expect(unmountedRef.current).toBe(false);
    rerender();
    expect(result.current).toBe(unmountedRef);
    expect(result.current.current).toBe(false);

    unmount();
    expect(unmountedRef.current).toBe(true);
  });
});
