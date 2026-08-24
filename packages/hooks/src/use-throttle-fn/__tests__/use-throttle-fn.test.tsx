import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThrottleFn } from '../index.js';

describe('useThrottleFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('invokes once at the leading edge and once with the latest trailing arguments', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 100 }));

    act(() => result.current.run('first'));
    expect(callback).toHaveBeenCalledWith('first');
    expect(result.current.pending).toBe(false);
    act(() => result.current.run('second'));
    act(() => result.current.run('third'));
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('third');
    expect(result.current.pending).toBe(false);
  });

  it('supports trailing-only invocation', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 100, leading: false }));

    act(() => result.current.run('value'));
    expect(callback).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(callback).toHaveBeenCalledWith('value');
  });

  it('does not retain trailing work when trailing is disabled', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 100, trailing: false }));

    act(() => result.current.run('first'));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.run('second'));
    expect(result.current.pending).toBe(false);
    act(() => vi.advanceTimersByTime(50));
    expect(callback).toHaveBeenCalledOnce();
    act(() => result.current.run('third'));
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('third');
  });

  it('never invokes when both edges are disabled', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useThrottleFn(callback, { delay: 10, leading: false, trailing: false }),
    );

    act(() => result.current.run('value'));
    expect(result.current.pending).toBe(false);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });

  it('reschedules pending arguments when delay changes', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(({ delay }) => useThrottleFn(callback, { delay }), {
      initialProps: { delay: 100 },
    });

    act(() => result.current.run('first'));
    act(() => result.current.run('second'));
    act(() => vi.advanceTimersByTime(50));
    rerender({ delay: 20 });
    act(() => vi.advanceTimersByTime(19));
    expect(callback).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenLastCalledWith('second');
  });

  it('drops pending arguments when trailing is turned off', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ trailing }) => useThrottleFn(callback, { delay: 20, trailing }),
      { initialProps: { trailing: true } },
    );

    act(() => result.current.run('first'));
    act(() => result.current.run('second'));
    expect(result.current.pending).toBe(true);
    rerender({ trailing: false });
    expect(result.current.pending).toBe(false);
    act(() => vi.runAllTimers());
    expect(callback).toHaveBeenCalledOnce();
  });

  it('flushes, cancels, and preserves the latest result', () => {
    const callback = vi.fn((value: number) => value * 2);
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 50 }));

    act(() => result.current.run(2));
    expect(result.current.flush()).toBe(4);
    act(() => result.current.run(3));
    act(() => result.current.run(4));
    let flushed: number | undefined;
    act(() => {
      flushed = result.current.flush();
    });
    expect(flushed).toBe(8);
    act(() => result.current.cancel());
    act(() => result.current.run(5));
    act(() => result.current.run(6));
    act(() => result.current.cancel());
    expect(result.current.pending).toBe(false);
    expect(result.current.flush()).toBe(10);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('keeps a full window between a trailing call and a reentrant run', () => {
    let run: (value: string) => void = () => undefined;
    const callback = vi.fn((value: string) => {
      if (value === 'trailing') run('reentrant');
      return value;
    });
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 100 }));
    run = result.current.run;

    act(() => run('leading'));
    act(() => run('trailing'));
    act(() => vi.advanceTimersByTime(100));
    expect(callback).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(99));
    expect(callback).toHaveBeenCalledTimes(2);
    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenLastCalledWith('reentrant');
  });

  it('keeps the inner result when a trailing callback flushes reentrant work', () => {
    let controls: ReturnType<typeof useThrottleFn<[string], string>>;
    const callback = vi.fn((value: string) => {
      if (value === 'outer') {
        controls.run('inner');
        controls.flush();
      }
      return `${value}-result`;
    });
    const hook = renderHook(() => useThrottleFn(callback, { delay: 100 }));
    controls = hook.result.current;

    act(() => controls.run('leading'));
    act(() => controls.run('outer'));
    act(() => vi.advanceTimersByTime(100));
    expect(controls.flush()).toBe('inner-result');
  });

  it('uses the latest callback while keeping controls stable', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useThrottleFn(callback, { delay: 20 }),
      { initialProps: { callback: first } },
    );
    const controls = result.current;

    act(() => controls.run('leading'));
    act(() => controls.run('trailing'));
    rerender({ callback: second });
    expect(result.current.run).toBe(controls.run);
    expect(result.current.cancel).toBe(controls.cancel);
    expect(result.current.flush).toBe(controls.flush);
    act(() => vi.advanceTimersByTime(20));
    expect(first).toHaveBeenCalledWith('leading');
    expect(second).toHaveBeenCalledWith('trailing');
  });

  it('recovers from a synchronous leading callback error', () => {
    const callback = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockReturnValue('ok');
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 10, trailing: false }));

    expect(() => act(() => result.current.run())).toThrow('boom');
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.run());
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('reports callback errors and resets the throttle window', () => {
    const error = new Error('observed');
    const onError = vi.fn();
    const callback = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnValue('ok');
    const { result } = renderHook(() => useThrottleFn(callback, { delay: 10, onError }));

    expect(() => act(() => result.current.run())).toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.run());
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('makes retained controls inert after unmount', () => {
    const callback = vi.fn((value: string) => value);
    const { result, unmount } = renderHook(() => useThrottleFn(callback, { delay: 10 }));
    const controls = result.current;

    act(() => controls.run('leading'));
    act(() => controls.run('trailing'));
    unmount();
    controls.run('after');
    expect(controls.flush()).toBe('leading');
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.runAllTimers());
    expect(callback).toHaveBeenCalledOnce();
  });

  it('normalizes invalid delays and remains Strict Mode safe', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useThrottleFn(callback, { delay: Number.NaN }), {
      reactStrictMode: true,
    });

    act(() => result.current.run('first'));
    act(() => result.current.run('second'));
    act(() => vi.advanceTimersByTime(0));
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('second');
  });
});
