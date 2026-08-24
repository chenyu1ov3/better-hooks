import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from '../index.js';

const MAX_TIMER_DELAY = 2_147_483_647;

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('runs repeatedly and stops when disabled', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 10 as number | null },
    });

    act(() => vi.advanceTimersByTime(30));
    expect(callback).toHaveBeenCalledTimes(3);
    rerender({ delay: null });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(30));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('uses the latest callback without restarting the interval', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ callback }) => useInterval(callback, 100), {
      initialProps: { callback: first },
    });

    act(() => vi.advanceTimersByTime(75));
    rerender({ callback: second });
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(25));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('replaces the timer when delay changes', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 100 },
    });

    act(() => vi.advanceTimersByTime(50));
    rerender({ delay: 20 });
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(19));
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledOnce();
  });

  it.each([
    [-10, 0],
    [Number.NaN, 0],
    [Number.NEGATIVE_INFINITY, 0],
    [Number.POSITIVE_INFINITY, MAX_TIMER_DELAY],
    [Number.MAX_SAFE_INTEGER, MAX_TIMER_DELAY],
  ])('normalizes a %s delay to %s', (delay, expected) => {
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');
    const { unmount } = renderHook(() => useInterval(vi.fn(), delay));

    expect(intervalSpy.mock.calls.some((call) => call[1] === expected)).toBe(true);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps one timer in Strict Mode and cleans it up on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 10), {
      reactStrictMode: true,
    });

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports a callback error and stops the interval before rethrowing', () => {
    const error = new Error('observed');
    const onError = vi.fn();
    const callback = vi.fn(() => {
      throw error;
    });
    renderHook(() => useInterval(callback, 10, { onError }));

    expect(() => act(() => vi.advanceTimersByTime(10))).toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(30));
    expect(callback).toHaveBeenCalledOnce();
  });
});
