// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { useIsMounted } from '../index.js';

describe('useIsMounted', () => {
  it('reports mount and unmount with a stable function', () => {
    let mountedDuringLayout = false;
    const { result, rerender, unmount } = renderHook(
      () => {
        const isMounted = useIsMounted();
        useLayoutEffect(() => {
          mountedDuringLayout = isMounted();
        }, [isMounted]);
        return isMounted;
      },
      { wrapper: StrictMode },
    );
    const isMounted = result.current;
    expect(mountedDuringLayout).toBe(true);
    expect(isMounted()).toBe(true);
    rerender();
    expect(result.current).toBe(isMounted);
    unmount();
    expect(isMounted()).toBe(false);
  });
});
