import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from '../index.js';

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'clipboard',
);

function mockClipboard(writeText: (text: string) => Promise<void> | void) {
  Object.defineProperty(Navigator.prototype, 'clipboard', {
    configurable: true,
    get: () => ({ writeText }),
  });
}

afterEach(() => {
  if (originalClipboardDescriptor) {
    Object.defineProperty(Navigator.prototype, 'clipboard', originalClipboardDescriptor);
  } else {
    Reflect.deleteProperty(Navigator.prototype, 'clipboard');
  }
  vi.restoreAllMocks();
});

describe('useCopyToClipboard', () => {
  it('reports pending and success state for a completed write', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());

    let copy!: Promise<void>;
    act(() => {
      copy = result.current.copy('hello');
    });
    expect(result.current.status).toBe('pending');
    await act(async () => {
      await copy;
    });

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current).toMatchObject({
      copiedText: 'hello',
      error: undefined,
      status: 'success',
    });
  });

  it('exposes failures, observes them, and preserves the rejection', async () => {
    const error = new Error('clipboard denied');
    const onError = vi.fn();
    mockClipboard(vi.fn().mockRejectedValue(error));
    const { result } = renderHook(() => useCopyToClipboard({ onError }));

    await act(async () => {
      await expect(result.current.copy('secret')).rejects.toBe(error);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('ignores stale state from an earlier write', async () => {
    let resolveFirst!: () => void;
    let rejectFirst!: (error: unknown) => void;
    let resolveSecond!: () => void;
    const first = new Promise<void>((resolve, reject) => {
      resolveFirst = resolve;
      rejectFirst = reject;
    });
    const second = new Promise<void>((resolve) => {
      resolveSecond = resolve;
    });
    const writeText = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const onError = vi.fn();
    mockClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard({ onError }));

    let firstCopy!: Promise<void>;
    let secondCopy!: Promise<void>;
    act(() => {
      firstCopy = result.current.copy('first');
      secondCopy = result.current.copy('second');
    });
    await act(async () => {
      resolveSecond();
      await secondCopy;
    });
    expect(result.current.copiedText).toBe('second');

    const staleError = new Error('stale failure');
    await act(async () => {
      rejectFirst(staleError);
      await expect(firstCopy).rejects.toBe(staleError);
    });
    expect(result.current.copiedText).toBe('second');
    expect(result.current.status).toBe('success');
    expect(onError).not.toHaveBeenCalled();
    resolveFirst();
  });

  it('resets state and invalidates a pending write', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });
    mockClipboard(vi.fn().mockReturnValue(pending));
    const { result } = renderHook(() => useCopyToClipboard());

    let copy!: Promise<void>;
    act(() => {
      copy = result.current.copy('later');
      result.current.reset();
    });
    expect(result.current).toMatchObject({
      copiedText: undefined,
      error: undefined,
      status: 'idle',
    });

    await act(async () => {
      resolve();
      await copy;
    });
    expect(result.current.status).toBe('idle');
  });

  it('rejects a retained action after unmount without touching the Clipboard API', async () => {
    const writeText = vi.fn();
    mockClipboard(writeText);
    const { result, unmount } = renderHook(() => useCopyToClipboard());
    const copy = result.current.copy;

    unmount();

    await expect(copy('late')).rejects.toMatchObject({ name: 'AbortError' });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('reports an unavailable Clipboard API as a named error', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useCopyToClipboard({ onError }));

    await act(async () => {
      await expect(result.current.copy('hello')).rejects.toMatchObject({
        name: 'NotSupportedError',
      });
    });

    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledOnce();
  });
});
