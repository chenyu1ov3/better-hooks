import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWindowSize } from '../index.js';

describe('useWindowSize', () => {
  it('keeps a cached snapshot and updates on resize', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 600,
    });
    const { result, unmount } = renderHook(() => useWindowSize());
    const initial = result.current;
    expect(initial).toEqual({ width: 800, height: 600 });
    expect(result.current).toBe(initial);

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });
    act(() => window.dispatchEvent(new Event('resize')));
    expect(result.current).toEqual({ width: 1024, height: 600 });
    unmount();
  });

  it('retains the snapshot reference when a resize keeps the same dimensions', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 640 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 480 });
    const { result, unmount } = renderHook(() => useWindowSize());
    const snapshot = result.current;

    act(() => window.dispatchEvent(new Event('resize')));
    expect(result.current).toBe(snapshot);
    unmount();
  });

  it('shares one resize listener and removes it after the last subscriber', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const first = renderHook(() => useWindowSize());
    const second = renderHook(() => useWindowSize());

    expect(add.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
    first.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0);
    second.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(1);
    add.mockRestore();
    remove.mockRestore();
  });

  it('normalizes invalid dimensions and recovers from viewport getter errors', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      get: () => -1,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: () => Number.NaN,
    });
    const invalid = renderHook(() => useWindowSize());
    expect(invalid.result.current).toEqual({ width: 0, height: 0 });
    invalid.unmount();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      get: () => {
        throw new Error('viewport unavailable');
      },
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      get: () => 720,
    });
    const inaccessible = renderHook(() => useWindowSize());
    expect(inaccessible.result.current).toEqual({ width: 0, height: 0 });
    inaccessible.unmount();
  });
});
