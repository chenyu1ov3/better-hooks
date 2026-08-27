// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { useIsomorphicLayoutEffect } from '../index.js';

describe('useIsomorphicLayoutEffect', () => {
  it('runs an effect in the test environment', () => {
    let called = false;
    renderHook(() => {
      useIsomorphicLayoutEffect(() => {
        called = true;
      }, []);
    });
    expect(called).toBe(true);
  });

  it('uses layout ordering in a browser environment', () => {
    const calls: string[] = [];
    const { unmount } = renderHook(() => {
      useEffect(() => {
        calls.push('passive');
        return () => {
          calls.push('passive cleanup');
        };
      }, []);
      useIsomorphicLayoutEffect(() => {
        calls.push('layout');
        return () => {
          calls.push('layout cleanup');
        };
      }, []);
    });

    expect(calls).toEqual(['layout', 'passive']);
    unmount();
    expect(calls).toEqual(['layout', 'passive', 'layout cleanup', 'passive cleanup']);
  });
});
