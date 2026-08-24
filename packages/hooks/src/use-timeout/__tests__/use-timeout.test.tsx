import { useLayoutEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeout } from '../index.js';

const MAX_TIMER_DELAY = 2_147_483_647;

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('supports disabled, pending, and completed states', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(({ delay }) => useTimeout(callback, delay), {
      initialProps: { delay: null as number | null },
    });

    expect(result.current.pending).toBe(false);
    rerender({ delay: 10 });
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(9));
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(false);
  });

  it('can be cancelled by a consumer layout effect in the same commit', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => {
      const timeout = useTimeout(callback, 10);
      const { cancel } = timeout;
      useLayoutEffect(() => cancel(), [cancel]);
      return timeout;
    });

    expect(result.current.pending).toBe(false);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps cancellation until delay changes', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay }: { delay: number; marker: number }) => useTimeout(callback, delay),
      { initialProps: { delay: 100, marker: 0 } },
    );

    act(() => result.current.cancel());
    rerender({ delay: 100, marker: 1 });
    act(() => vi.advanceTimersByTime(100));
    expect(callback).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(false);

    rerender({ delay: 20, marker: 1 });
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(20));
    expect(callback).toHaveBeenCalledOnce();
  });

  it('uses the latest callback without restarting the timeout', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ callback }) => useTimeout(callback, 100), {
      initialProps: { callback: first },
    });
    const cancel = result.current.cancel;

    act(() => vi.advanceTimersByTime(75));
    rerender({ callback: second });
    expect(result.current.cancel).toBe(cancel);
    act(() => vi.advanceTimersByTime(25));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it.each([-10, Number.NaN, Number.NEGATIVE_INFINITY])('normalizes a %s delay to zero', (delay) => {
    const callback = vi.fn();
    const { result } = renderHook(() => useTimeout(callback, delay));

    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(0));
    expect(callback).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(false);
  });

  it('clamps positive infinity and oversized delays', () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const first = renderHook(() => useTimeout(vi.fn(), Number.POSITIVE_INFINITY));
    expect(timeoutSpy.mock.calls.some((call) => call[1] === MAX_TIMER_DELAY)).toBe(true);
    first.unmount();

    timeoutSpy.mockClear();
    const second = renderHook(() => useTimeout(vi.fn(), Number.MAX_SAFE_INTEGER));
    expect(timeoutSpy.mock.calls.some((call) => call[1] === MAX_TIMER_DELAY)).toBe(true);
    second.unmount();
  });

  it('clears pending state before a callback error escapes', () => {
    const callback = vi.fn(() => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useTimeout(callback, 10));

    expect(() => act(() => vi.advanceTimersByTime(10))).toThrow('boom');
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports callback errors and still preserves the throw/cleanup contract', () => {
    const error = new Error('observed');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useTimeout(
        () => {
          throw error;
        },
        10,
        { onError },
      ),
    );

    expect(() => act(() => vi.advanceTimersByTime(10))).toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps a single timer in Strict Mode and cleans up on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useTimeout(callback, 100), {
      reactStrictMode: true,
    });

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });
});
