import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useLockFn } from '../index.js';

function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (error: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

describe('useLockFn', () => {
  it('allows one pending call and releases the lock in finally', async () => {
    const pending = deferred<string>();
    const fn = vi.fn(() => pending.promise);
    const { result } = renderHook(() => useLockFn(fn));

    const first = result.current();
    const second = result.current();
    await expect(second).resolves.toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);

    pending.resolve('done');
    await expect(first).resolves.toBe('done');
    await expect(result.current()).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('reports and rethrows failures, then permits a later call', async () => {
    const failure = new Error('failed');
    const onError = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce('recovered');
    const { result } = renderHook(() => useLockFn(fn, { onError }));

    await expect(result.current()).rejects.toBe(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    await expect(result.current()).resolves.toBe('recovered');
  });

  it('turns synchronous throws into rejected promises and uses the latest function', async () => {
    const first = vi.fn(() => 'first');
    const second = vi.fn(() => {
      throw new Error('sync');
    });
    const hook = renderHook(({ fn }) => useLockFn(fn), {
      initialProps: { fn: first },
    });
    const stable = hook.result.current;
    await expect(stable()).resolves.toBe('first');

    hook.rerender({ fn: second });
    expect(hook.result.current).toBe(stable);
    await expect(stable()).rejects.toThrow('sync');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not lose the lock during StrictMode effect replay', async () => {
    const fn = vi.fn(async () => 'ok');
    const { result } = renderHook(() => useLockFn(fn), { wrapper: StrictMode });
    await act(async () => {
      await expect(result.current()).resolves.toBe('ok');
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
