import { act, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useAsync, type AsyncTask } from '../index.js';

interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T) => void;
  readonly reject: (error: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

describe('useAsync', () => {
  it('ignores a stale run when a newer run resolves first', async () => {
    const deferred: Deferred<string>[] = [];
    const signals: AbortSignal[] = [];
    const task = vi.fn((signal: AbortSignal) => {
      const current = createDeferred<string>();
      deferred.push(current);
      signals.push(signal);
      return current.promise;
    });
    const { result } = renderHook(() => useAsync(task));
    let first!: Promise<string>;
    let second!: Promise<string>;

    await act(async () => {
      first = result.current.run();
      await Promise.resolve();
    });
    await act(async () => {
      second = result.current.run();
      await Promise.resolve();
    });

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    await act(async () => {
      deferred[1]?.resolve('second');
      await second;
    });
    expect(result.current.data).toBe('second');
    const staleError = new Error('stale');
    deferred[0]?.reject(staleError);
    await expect(first).rejects.toBe(staleError);
    expect(result.current.data).toBe('second');
    expect(result.current.error).toBeUndefined();
  });

  it('keeps the current controller when a stale run settles', async () => {
    const deferred: Deferred<string>[] = [];
    const signals: AbortSignal[] = [];
    const task = vi.fn((signal: AbortSignal) => {
      const current = createDeferred<string>();
      deferred.push(current);
      signals.push(signal);
      return current.promise;
    });
    const { result } = renderHook(() => useAsync(task));
    let first!: Promise<string>;
    let second!: Promise<string>;

    await act(async () => {
      first = result.current.run();
      await Promise.resolve();
    });
    await act(async () => {
      second = result.current.run();
      await Promise.resolve();
    });
    deferred[0]?.resolve('stale');
    await expect(first).resolves.toBe('stale');
    expect(result.current.status).toBe('pending');

    act(() => result.current.cancel());
    expect(signals[1]?.aborted).toBe(true);

    deferred[1]?.resolve('cancelled');
    await expect(second).resolves.toBe('cancelled');
    expect(result.current.status).toBe('idle');
  });

  it('aborts and returns to idle when cancelled', async () => {
    let signal: AbortSignal | undefined;
    const task = vi.fn((nextSignal: AbortSignal) => {
      signal = nextSignal;
      return new Promise<string>(() => undefined);
    });
    const { result } = renderHook(() => useAsync(task));

    await act(async () => {
      void result.current.run();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('pending');
    act(() => result.current.cancel());

    expect(signal?.aborted).toBe(true);
    expect(result.current.status).toBe('idle');
  });

  it('does not invoke a run cancelled in the same tick', async () => {
    const task = vi.fn(async () => 'late');
    const { result } = renderHook(() => useAsync(task));
    let promise!: Promise<string>;

    await act(async () => {
      promise = result.current.run();
      result.current.cancel();
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });

    expect(task).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('does not invoke a run when unmounted in the same tick', async () => {
    const task = vi.fn(async () => 'late');
    const { result, unmount } = renderHook(() => useAsync(task));
    let promise!: Promise<string>;

    await act(async () => {
      promise = result.current.run();
      unmount();
      await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });

    expect(task).not.toHaveBeenCalled();
  });

  it('rejects a retained run after unmount without invoking the task', async () => {
    const task = vi.fn(async () => 'late');
    const { result, unmount } = renderHook(() => useAsync(task));
    const run = result.current.run;

    unmount();

    await expect(run()).rejects.toMatchObject({ name: 'AbortError' });
    expect(task).not.toHaveBeenCalled();
  });

  it('retains a run started reentrantly by an abort handler', async () => {
    const signals: AbortSignal[] = [];
    let reentrantRun: Promise<string> | undefined;
    let run!: () => Promise<string>;
    const task = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      if (signals.length === 1) {
        signal.addEventListener('abort', () => {
          reentrantRun = run();
        });
      }
      return new Promise<string>(() => undefined);
    });
    const { result } = renderHook(() => useAsync(task));
    run = result.current.run;

    await act(async () => {
      void run();
      await Promise.resolve();
    });
    await act(async () => {
      result.current.cancel();
      await Promise.resolve();
    });

    expect(task).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    expect(result.current.status).toBe('pending');

    act(() => result.current.cancel());

    expect(signals[1]?.aborted).toBe(true);
    expect(result.current.status).toBe('idle');
    expect(reentrantRun).toBeDefined();
  });

  it('clears a settled controller instead of aborting completed work', async () => {
    let signal: AbortSignal | undefined;
    const task = vi.fn(async (nextSignal: AbortSignal) => {
      signal = nextSignal;
      return 'ready';
    });
    const { result } = renderHook(() => useAsync(task));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.status).toBe('success');

    act(() => result.current.cancel());
    expect(signal?.aborted).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBe('ready');
  });

  it('aborts active work and clears all state when reset', async () => {
    let activeSignal: AbortSignal | undefined;
    const task = vi
      .fn<AsyncTask<string>>()
      .mockResolvedValueOnce('cached')
      .mockImplementationOnce((signal) => {
        activeSignal = signal;
        return new Promise<string>(() => undefined);
      });
    const { result } = renderHook(() => useAsync(task));

    await act(async () => {
      await result.current.run();
    });
    await act(async () => {
      void result.current.run();
      await Promise.resolve();
    });
    expect(result.current.data).toBe('cached');

    act(() => result.current.reset());
    expect(activeSignal?.aborted).toBe(true);
    expect(result.current).toMatchObject({
      data: undefined,
      error: undefined,
      status: 'idle',
    });
  });

  it('remains mounted after React StrictMode effect replay', async () => {
    const task = vi.fn(async () => 'ready');
    const { result } = renderHook(() => useAsync(task, { immediate: true }), {
      wrapper: StrictMode,
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(task).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe('ready');
  });

  it('uses the latest task in a layout effect after an update', async () => {
    const firstTask = vi.fn(async () => 'first');
    const secondTask = vi.fn(async () => 'second');
    let layoutRun: Promise<string> | undefined;
    const initialProps: { runInLayout: boolean; task: AsyncTask<string> } = {
      runInLayout: false,
      task: firstTask,
    };
    const { result, rerender } = renderHook(
      ({ runInLayout, task }) => {
        const request = useAsync(task);
        const run = request.run;
        useLayoutEffect(() => {
          if (runInLayout) layoutRun = run();
        }, [run, runInLayout]);
        return request;
      },
      { initialProps },
    );
    const actions = {
      cancel: result.current.cancel,
      reset: result.current.reset,
      run: result.current.run,
    };

    rerender({ runInLayout: true, task: secondTask });
    await act(async () => {
      await layoutRun;
    });

    expect(firstTask).not.toHaveBeenCalled();
    expect(secondTask).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('second');
    expect(result.current.cancel).toBe(actions.cancel);
    expect(result.current.reset).toBe(actions.reset);
    expect(result.current.run).toBe(actions.run);
  });

  it('aborts active work on unmount and ignores its later completion', async () => {
    const pending = createDeferred<string>();
    let signal: AbortSignal | undefined;
    const task = vi.fn((nextSignal: AbortSignal) => {
      signal = nextSignal;
      return pending.promise;
    });
    const { result, unmount } = renderHook(() => useAsync(task));
    let promise!: Promise<string>;

    await act(async () => {
      promise = result.current.run();
      await Promise.resolve();
    });
    unmount();
    expect(signal?.aborted).toBe(true);

    pending.resolve('late');
    await expect(promise).resolves.toBe('late');
  });

  it('exposes task errors and supports reset', async () => {
    const error = new Error('failed');
    let signal: AbortSignal | undefined;
    const { result } = renderHook(() =>
      useAsync((nextSignal) => {
        signal = nextSignal;
        throw error;
      }),
    );

    await act(async () => {
      await expect(result.current.run()).rejects.toBe(error);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
    act(() => result.current.reset());
    expect(signal?.aborted).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('observes the latest task error without changing the rejected promise', async () => {
    const error = new Error('observed');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsync(
        () => {
          throw error;
        },
        { onError },
      ),
    );

    await act(async () => {
      await expect(result.current.run()).rejects.toBe(error);
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
  });

  it('does not report an expected cancellation as a task error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsync(
        (signal) =>
          new Promise<string>((_resolve, reject) => {
            signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
        { onError },
      ),
    );

    let pending!: Promise<string>;
    await act(async () => {
      pending = result.current.run();
      void pending.catch(() => undefined);
      await Promise.resolve();
      result.current.cancel();
    });
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(onError).not.toHaveBeenCalled();
  });
});
