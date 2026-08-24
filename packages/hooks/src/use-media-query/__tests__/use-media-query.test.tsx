import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../index.js';

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });

  it('uses the server default when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: undefined });
    const { result } = renderHook(() =>
      useMediaQuery('(min-width: 1px)', { defaultMatches: true }),
    );
    expect(result.current).toBe(true);
  });

  it('updates from a media query change event', () => {
    let handler: (() => void) | undefined;
    const list = {
      matches: false,
      addEventListener: vi.fn((_type: string, cb: () => void) => {
        handler = cb;
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => list) });
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1px)'));
    Object.defineProperty(list, 'matches', { configurable: true, value: true });
    act(() => handler?.());
    expect(result.current).toBe(true);
    unmount();
  });

  it('shares one native listener for multiple subscribers of the same query', () => {
    const list = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => list),
    });
    const { unmount } = renderHook(() => [
      useMediaQuery('(min-width: 1px)'),
      useMediaQuery('(min-width: 1px)'),
    ]);

    expect(list.addEventListener).toHaveBeenCalledTimes(1);
    expect(window.matchMedia).toHaveBeenCalledTimes(1);
    unmount();
    expect(list.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('supports legacy MediaQueryList listeners and cleans up the last subscriber', () => {
    let handler: (() => void) | undefined;
    const list = {
      matches: false,
      addListener: vi.fn((callback: () => void) => {
        handler = callback;
      }),
      removeListener: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => list),
    });
    const first = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));
    const second = renderHook(() => useMediaQuery('(prefers-reduced-motion: reduce)'));

    expect(list.addListener).toHaveBeenCalledTimes(1);
    Object.defineProperty(list, 'matches', { configurable: true, value: true });
    act(() => handler?.());
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    first.unmount();
    expect(list.removeListener).not.toHaveBeenCalled();
    second.unmount();
    expect(list.removeListener).toHaveBeenCalledTimes(1);
  });

  it('moves the shared subscription when the query changes', () => {
    const firstList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const secondList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => (query === '(first)' ? firstList : secondList)),
    });
    const hook = renderHook(({ query }) => useMediaQuery(query), {
      initialProps: { query: '(first)' },
    });
    expect(hook.result.current).toBe(false);

    hook.rerender({ query: '(second)' });
    expect(hook.result.current).toBe(true);
    expect(firstList.removeEventListener).toHaveBeenCalledTimes(1);
    expect(secondList.addEventListener).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(secondList.removeEventListener).toHaveBeenCalledTimes(1);
  });

  it('works when a MediaQueryList exposes no listener API', () => {
    const list = { matches: true } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => list),
    });
    const { result, unmount } = renderHook(() => useMediaQuery('(unsupported-listener-api)'));
    expect(result.current).toBe(true);
    expect(() => unmount()).not.toThrow();
  });

  it('falls back and reports when matchMedia itself throws', () => {
    const error = new Error('invalid media query');
    const onError = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => {
        throw error;
      }),
    });

    const { result, unmount } = renderHook(() =>
      useMediaQuery('(invalid)', { defaultMatches: true, onError }),
    );
    expect(result.current).toBe(true);
    expect(onError).toHaveBeenCalledWith(error);
    unmount();
  });
});
