import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounceFn } from '../index.js';

describe('useDebounceFn', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('invokes the latest arguments after a quiet delay', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceFn(callback, { delay: 100 }));

    act(() => result.current.run('first'));
    act(() => vi.advanceTimersByTime(75));
    act(() => result.current.run('second'));
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(99));
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('second');
    expect(result.current.pending).toBe(false);
  });

  it('only marks a real trailing invocation as pending', () => {
    const callback = vi.fn((value: number) => value * 2);
    const { result } = renderHook(() =>
      useDebounceFn(callback, { delay: 100, leading: true, trailing: true }),
    );

    act(() => result.current.run(2));
    expect(callback).toHaveBeenLastCalledWith(2);
    expect(result.current.pending).toBe(false);
    expect(result.current.flush()).toBe(4);

    act(() => result.current.run(3));
    expect(result.current.pending).toBe(false);
    act(() => result.current.run(4));
    expect(result.current.pending).toBe(true);
    let flushed: number | undefined;
    act(() => {
      flushed = result.current.flush();
    });
    expect(flushed).toBe(8);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(result.current.pending).toBe(false);
  });

  it('does not invoke at maxWait when trailing is disabled', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebounceFn(callback, {
        delay: 100,
        leading: true,
        trailing: false,
        maxWait: 25,
      }),
    );

    act(() => result.current.run('first'));
    act(() => result.current.run('second'));
    expect(result.current.pending).toBe(false);
    act(() => vi.advanceTimersByTime(25));
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('first');
  });

  it('never invokes when both edges are disabled', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebounceFn(callback, { delay: 10, leading: false, trailing: false }),
    );

    act(() => result.current.run('value'));
    expect(result.current.pending).toBe(false);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
    expect(result.current.flush()).toBeUndefined();
  });

  it('honors maxWait during repeated trailing calls', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounceFn(callback, { delay: 100, maxWait: 120 }));

    act(() => result.current.run('a'));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.run('b'));
    act(() => vi.advanceTimersByTime(50));
    act(() => result.current.run('c'));
    act(() => vi.advanceTimersByTime(20));
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith('c');
  });

  it('reschedules with changed options without creating a leading call', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay, leading }) => useDebounceFn(callback, { delay, leading }),
      { initialProps: { delay: 100, leading: false } },
    );

    act(() => result.current.run('value'));
    act(() => vi.advanceTimersByTime(50));
    rerender({ delay: 20, leading: true });
    expect(callback).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(20));
    expect(callback).toHaveBeenCalledWith('value');
  });

  it('drops pending arguments when trailing is turned off', () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ trailing }) => useDebounceFn(callback, { delay: 20, trailing }),
      { initialProps: { trailing: true } },
    );

    act(() => result.current.run('value'));
    rerender({ trailing: false });
    expect(result.current.pending).toBe(false);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });

  it('uses the latest callback while keeping controls stable', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(
      ({ callback }) => useDebounceFn(callback, { delay: 20 }),
      { initialProps: { callback: first } },
    );
    const controls = result.current;

    act(() => result.current.run('value'));
    rerender({ callback: second });
    expect(result.current.run).toBe(controls.run);
    expect(result.current.cancel).toBe(controls.cancel);
    expect(result.current.flush).toBe(controls.flush);
    act(() => vi.advanceTimersByTime(20));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('value');
  });

  it('cancels pending work and preserves the most recent result', () => {
    const callback = vi.fn((value: number) => value * 2);
    const { result } = renderHook(() => useDebounceFn(callback, { delay: 50, leading: true }));

    act(() => result.current.run(2));
    act(() => result.current.run(3));
    act(() => result.current.cancel());
    expect(result.current.pending).toBe(false);
    expect(result.current.flush()).toBe(4);
    act(() => vi.runAllTimers());
    expect(callback).toHaveBeenCalledOnce();
  });

  it('keeps the inner result when a trailing callback invokes leading work', () => {
    let run: (value: string) => void = () => undefined;
    const callback = vi.fn((value: string) => {
      if (value === 'outer') run('inner');
      return `${value}-result`;
    });
    const { result } = renderHook(() =>
      useDebounceFn(callback, { delay: 100, leading: true, trailing: true }),
    );
    run = result.current.run;

    act(() => run('leading'));
    act(() => run('outer'));
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.flush()).toBe('inner-result');
  });

  it('recovers from a synchronous leading callback error', () => {
    const callback = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw new Error('boom');
      })
      .mockReturnValue('ok');
    const { result } = renderHook(() =>
      useDebounceFn(callback, { delay: 10, leading: true, trailing: false }),
    );

    expect(() => act(() => result.current.run())).toThrow('boom');
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.run());
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('clears pending state before a trailing callback error escapes', () => {
    const callback = vi.fn(() => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useDebounceFn(callback, { delay: 10 }));

    act(() => result.current.run());
    expect(() => act(() => vi.advanceTimersByTime(10))).toThrow('boom');
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports callback errors and allows a later cycle to recover', () => {
    const error = new Error('observed');
    const onError = vi.fn();
    const callback = vi
      .fn<() => string>()
      .mockImplementationOnce(() => {
        throw error;
      })
      .mockReturnValue('ok');
    const { result } = renderHook(() => useDebounceFn(callback, { delay: 10, onError }));

    act(() => result.current.run());
    expect(() => act(() => vi.advanceTimersByTime(10))).toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.pending).toBe(false);
    expect(vi.getTimerCount()).toBe(0);

    act(() => result.current.run());
    act(() => vi.advanceTimersByTime(10));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('makes retained controls inert after unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebounceFn(callback, { delay: 10 }));
    const controls = result.current;

    act(() => controls.run('before'));
    unmount();
    controls.run('after');
    expect(controls.flush()).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.runAllTimers());
    expect(callback).not.toHaveBeenCalled();
  });

  it('does not duplicate a leading call in Strict Mode', () => {
    const callback = vi.fn();
    const { result } = renderHook(
      () => useDebounceFn(callback, { delay: 50, leading: true, trailing: false }),
      { reactStrictMode: true },
    );

    act(() => result.current.run('value'));
    expect(callback).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(50));
    expect(callback).toHaveBeenCalledOnce();
  });
});
