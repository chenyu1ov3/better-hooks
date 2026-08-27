import { act, render, renderHook } from '@testing-library/react';
import { Suspense } from 'react';
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
    expect(window.matchMedia).toHaveBeenCalledTimes(2);
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

  it('does not reuse a query created by a render abandoned by Suspense', () => {
    const pending = new Promise<never>(() => undefined);
    const matchMedia = vi
      .fn<(query: string) => MediaQueryList>()
      .mockReturnValueOnce({ matches: false } as MediaQueryList)
      .mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as MediaQueryList);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
    });

    function AbandonedQuery(): never {
      useMediaQuery('(abandoned)');
      throw pending;
    }

    const abandoned = render(
      <Suspense fallback={null}>
        <AbandonedQuery />
      </Suspense>,
    );
    const abandonedCalls = matchMedia.mock.calls.length;
    expect(abandonedCalls).toBeGreaterThan(0);
    abandoned.unmount();

    const committed = renderHook(() => useMediaQuery('(abandoned)'));
    expect(committed.result.current).toBe(true);
    expect(matchMedia.mock.calls.length).toBeGreaterThan(abandonedCalls);
    committed.unmount();
  });

  it('reports listener registration failures without replacing the error', () => {
    const failure = new Error('listener registration failed');
    const onError = vi.fn();
    const list = {
      matches: false,
      addEventListener: vi.fn(() => {
        throw failure;
      }),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => list),
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      expect(() => renderHook(() => useMediaQuery('(registration-error)', { onError }))).toThrow(
        failure,
      );
      expect(onError).toHaveBeenCalledWith(failure);
      expect(list.removeEventListener).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it('reports listener cleanup failures without leaking the shared entry', () => {
    const failure = new Error('listener cleanup failed');
    const onError = vi.fn();
    const firstList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(() => {
        throw failure;
      }),
    } as unknown as MediaQueryList;
    const secondList = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    const matchMedia = vi
      .fn<(query: string) => MediaQueryList>()
      .mockReturnValueOnce(firstList)
      .mockReturnValue(secondList);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: matchMedia,
    });

    const first = renderHook(() => useMediaQuery('(cleanup-error)', { onError }));
    expect(() => first.unmount()).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);

    const second = renderHook(() => useMediaQuery('(cleanup-error)'));
    expect(second.result.current).toBe(true);
    second.unmount();
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
