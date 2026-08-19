import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../index.js';

const MAX_TIMER_DELAY = 2_147_483_647;

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('publishes the latest value after a quiet delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, { delay: 100 }), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(75));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(99));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('c');
  });

  it('publishes once at the leading edge and once for a later trailing value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 100, leading: true }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(10));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('c');

    rerender({ value: 'd' });
    expect(result.current).toBe('d');
    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('d');
  });

  it('never publishes a trailing value when trailing is disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) =>
        useDebounce(value, {
          delay: 100,
          leading: true,
          trailing: false,
          maxWait: 50,
        }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    expect(result.current).toBe('b');
    act(() => vi.advanceTimersByTime(50));
    expect(result.current).toBe('b');

    rerender({ value: 'd' });
    expect(result.current).toBe('d');
  });

  it('never publishes when both leading and trailing are disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 10, leading: false, trailing: false }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    rerender({ value: 'c' });
    act(() => vi.runAllTimers());
    expect(result.current).toBe('a');
  });

  it('uses maxWait to publish during a continuous trailing cycle', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, { delay: 100, maxWait: 120 }),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ value: 'd' });
    act(() => vi.advanceTimersByTime(19));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('d');
  });

  it('reschedules pending work from the moment options change', () => {
    const { result, rerender } = renderHook(
      ({ delay, leading, value }) => useDebounce(value, { delay, leading }),
      { initialProps: { delay: 100, leading: false, value: 'a' } },
    );

    rerender({ delay: 100, leading: false, value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ delay: 20, leading: true, value: 'b' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(19));
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });

  it('drops pending work when trailing is turned off', () => {
    const { result, rerender } = renderHook(
      ({ trailing, value }) => useDebounce(value, { delay: 20, trailing }),
      { initialProps: { trailing: true, value: 'a' } },
    );

    rerender({ trailing: true, value: 'b' });
    expect(result.current).toBe('a');
    rerender({ trailing: false, value: 'b' });
    act(() => vi.runAllTimers());
    expect(result.current).toBe('a');
  });

  it.each([-10, Number.NaN, Number.NEGATIVE_INFINITY])('normalizes a %s delay to zero', (delay) => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, { delay }), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(0));
    expect(result.current).toBe('b');
  });

  it('normalizes invalid maxWait and clamps oversized delays', () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    const { rerender, unmount } = renderHook(
      ({ delay, maxWait, value }) => useDebounce(value, { delay, maxWait }),
      {
        initialProps: {
          delay: Number.POSITIVE_INFINITY,
          maxWait: Number.POSITIVE_INFINITY,
          value: 'a',
        },
      },
    );

    rerender({
      delay: Number.POSITIVE_INFINITY,
      maxWait: Number.POSITIVE_INFINITY,
      value: 'b',
    });
    expect(timeoutSpy.mock.calls.filter((call) => call[1] === MAX_TIMER_DELAY)).toHaveLength(2);
    unmount();

    const invalidMaxWait = renderHook(
      ({ value }) => useDebounce(value, { delay: 100, maxWait: Number.NaN }),
      { initialProps: { value: 'a' } },
    );
    invalidMaxWait.rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(0));
    expect(invalidMaxWait.result.current).toBe('b');
  });

  it('clears scheduled publication on unmount, including Strict Mode cleanup', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, { delay: 100 }), {
      initialProps: { value: 'a' },
      reactStrictMode: true,
    });

    rerender({ value: 'b' });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
