import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThrottle } from '../index.js';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('publishes a leading value and the latest trailing value by default', () => {
    const { result, rerender } = renderHook(({ value }) => useThrottle(value, { delay: 100 }), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(50));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(49));
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('c');
  });

  it('supports a trailing-only throttle window', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, { delay: 100, leading: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('b');
  });

  it('suppresses trailing values and opens the next window at the throttle limit', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, { delay: 100, trailing: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('b');
    rerender({ value: 'd' });
    expect(result.current).toBe('d');
  });

  it('never publishes when both edges are disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, { delay: 10, leading: false, trailing: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => vi.runAllTimers());
    expect(result.current).toBe('a');
  });

  it('restarts a pending window when delay changes', () => {
    const { result, rerender } = renderHook(({ delay, value }) => useThrottle(value, { delay }), {
      initialProps: { delay: 100, value: 'a' },
    });

    rerender({ delay: 100, value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ delay: 100, value: 'c' });
    rerender({ delay: 20, value: 'c' });
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(19));
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('c');
  });

  it.each([-1, Number.NaN, Number.NEGATIVE_INFINITY])(
    'normalizes a %s delay to a zero-length window',
    (delay) => {
      const { result, rerender } = renderHook(({ value }) => useThrottle(value, { delay }), {
        initialProps: { value: 'a' },
      });

      rerender({ value: 'b' });
      rerender({ value: 'c' });
      act(() => vi.advanceTimersByTime(0));
      expect(result.current).toBe('c');
    },
  );
});
