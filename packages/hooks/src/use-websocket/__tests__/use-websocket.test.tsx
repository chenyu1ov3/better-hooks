import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket, type UseWebSocketOptions } from '../index.js';

type SocketHandler<T> = ((event: T) => void) | null;

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: FakeWebSocket[] = [];
  static constructError: unknown;
  static handlerError: unknown;

  readonly url: string;
  readonly protocols: string | string[] | undefined;
  readyState = FakeWebSocket.CONNECTING;
  send = vi.fn((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (this.readyState !== FakeWebSocket.OPEN) throw new Error('native send failed');
    this.sent.push(data);
  });
  close = vi.fn((_code?: number, _reason?: string) => {
    this.readyState = FakeWebSocket.CLOSING;
  });
  readonly sent: unknown[] = [];
  onopen: SocketHandler<Event> = null;
  onmessage: SocketHandler<MessageEvent> = null;
  onerror: SocketHandler<Event> = null;
  onclose: SocketHandler<CloseEvent> = null;

  constructor(url: string, protocols?: string | string[]) {
    if (FakeWebSocket.constructError !== undefined) throw FakeWebSocket.constructError;
    this.url = url;
    this.protocols = protocols;
    if (FakeWebSocket.handlerError !== undefined) {
      const failure = FakeWebSocket.handlerError;
      Object.defineProperty(this, 'onmessage', {
        configurable: true,
        get: () => null,
        set: () => {
          throw failure;
        },
      });
    }
    FakeWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  message(data: MessageEvent['data']): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  error(error?: unknown): void {
    const event = new Event('error') as Event & { error?: unknown };
    event.error = error;
    this.onerror?.(event);
  }

  closeEvent(code = 1000, reason = ''): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason, wasClean: code === 1000 }));
  }
}

function socketAt(index = 0): FakeWebSocket {
  const socket = FakeWebSocket.instances[index];
  if (!socket) throw new Error(`Missing fake socket ${index}`);
  return socket;
}

describe('useWebSocket', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    FakeWebSocket.constructError = undefined;
    FakeWebSocket.handlerError = undefined;
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('connects with URL objects and protocols and exposes raw message data', () => {
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket(new URL('wss://example.test/socket'), {
        protocols: ['json', 'v1'],
        onOpen,
        onMessage,
        onClose,
      }),
    );
    const socket = socketAt();

    expect(socket.url).toBe('wss://example.test/socket');
    expect(socket.protocols).toEqual(['json', 'v1']);
    expect(result.current.status).toBe('connecting');
    act(() => socket.open());
    expect(result.current.status).toBe('open');
    const payload = { id: 1 };
    act(() => socket.message(payload));
    expect(result.current.data).toBe(payload);
    expect(onOpen).toHaveBeenCalledWith(expect.any(Event));
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: payload }));
    act(() => socket.closeEvent(1000, 'done'));
    expect(result.current.status).toBe('closed');
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ code: 1000 }));
  });

  it('keeps actions stable and reads the latest committed callbacks', () => {
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(
      ({ callback, url }: { callback: (event: MessageEvent) => void; url: string }) =>
        useWebSocket(url, { onMessage: callback }),
      { initialProps: { callback: first, url: 'ws://example.test' }, wrapper: StrictMode },
    );
    const socket = socketAt(1);
    const actions = {
      send: hook.result.current.send,
      close: hook.result.current.close,
      reconnect: hook.result.current.reconnect,
    };
    hook.rerender({ callback: second, url: 'ws://example-next.test' });
    const replacement = socketAt(2);
    act(() => {
      socket.open();
      socket.message('latest');
      replacement.open();
      replacement.message('latest replacement');
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
    expect(hook.result.current.send).toBe(actions.send);
    expect(hook.result.current.close).toBe(actions.close);
    expect(hook.result.current.reconnect).toBe(actions.reconnect);
  });

  it('ignores events from a socket replaced by URL or protocol changes', () => {
    const onMessage = vi.fn();
    const hook = renderHook(
      ({ url, protocols }: { url: string; protocols?: string }) =>
        useWebSocket(url, {
          ...(protocols === undefined ? {} : { protocols }),
          onMessage,
        }),
      { initialProps: { url: 'ws://first.test', protocols: 'a' } },
    );
    const first = socketAt();
    act(() => first.open());
    hook.rerender({ url: 'ws://second.test', protocols: 'b' });
    const second = socketAt(1);
    expect(first.close).toHaveBeenCalledOnce();
    expect(second.url).toBe('ws://second.test');
    act(() => {
      first.message('stale');
      second.open();
      second.message('fresh');
    });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: 'fresh' }));
  });

  it('stays closed when disabled, null, or when WebSocket is unavailable', () => {
    const disabled = renderHook(() => useWebSocket('ws://disabled.test', { enabled: false }));
    expect(disabled.result.current.status).toBe('closed');
    expect(FakeWebSocket.instances).toHaveLength(0);
    disabled.unmount();

    const unavailable = globalThis.WebSocket;
    vi.stubGlobal('WebSocket', undefined);
    const hook = renderHook(() => useWebSocket(null));
    expect(hook.result.current).toMatchObject({
      status: 'closed',
      data: undefined,
      error: undefined,
    });
    expect(() => hook.result.current.send('not-connected')).toThrow('WebSocket is not open.');
    expect(() => hook.result.current.close()).not.toThrow();
    expect(() => hook.result.current.reconnect()).not.toThrow();
    hook.unmount();
    vi.stubGlobal('WebSocket', unavailable);
  });

  it('sends through an open socket and preserves native send failures', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSocket('ws://send.test', { onError }));
    const socket = socketAt();
    expect(() => result.current.send('before-open')).toThrow('WebSocket is not open.');
    expect(socket.send).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ name: 'InvalidStateError' }));
    act(() => socket.open());
    act(() => result.current.send('hello'));
    expect(socket.send).toHaveBeenLastCalledWith('hello');
    socket.readyState = FakeWebSocket.OPEN;
    const nativeError = new Error('send exploded');
    socket.send.mockImplementation(() => {
      throw nativeError;
    });
    expect(() => result.current.send('bad')).toThrow(nativeError);
    expect(onError).toHaveBeenLastCalledWith(nativeError);
  });

  it('rejects sends while closing or closed with InvalidStateError', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSocket('ws://send-state.test', { onError }));
    const socket = socketAt();
    act(() => socket.open());

    const expectNotOpen = (data: string): void => {
      let thrown: unknown;
      act(() => {
        try {
          result.current.send(data);
        } catch (error) {
          thrown = error;
        }
      });
      expect(thrown).toMatchObject({
        name: 'InvalidStateError',
        message: 'WebSocket is not open.',
      });
      expect(result.current.error).toBe(thrown);
      expect(onError).toHaveBeenLastCalledWith(thrown);
    };

    socket.readyState = FakeWebSocket.CLOSING;
    expectNotOpen('while-closing');
    socket.readyState = FakeWebSocket.CLOSED;
    expectNotOpen('after-close');
    expect(socket.send).not.toHaveBeenCalled();
  });

  it('records native error events without replacing their original value', () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useWebSocket('ws://error.test', { onError }));
    const socket = socketAt();
    act(() => socket.open());
    const nativeError = new Error('socket failed');
    act(() => socket.error(nativeError));
    expect(result.current.error).toBe(nativeError);
    expect(onError).toHaveBeenCalledWith(nativeError);
  });

  it('closes manually, reports close failures, and suppresses reconnects', () => {
    vi.useFakeTimers();
    const onError = vi.fn();
    const hook = renderHook(() =>
      useWebSocket('ws://manual-close.test', {
        reconnect: { maxAttempts: 2, initialDelay: 10 },
        onError,
      }),
    );
    const socket = socketAt();
    act(() => socket.open());
    act(() => hook.result.current.close(1001, 'going away'));
    expect(socket.close).toHaveBeenCalledWith(1001, 'going away');
    expect(hook.result.current.status).toBe('closing');
    act(() => socket.closeEvent(1001, 'going away'));
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(1);

    act(() => hook.result.current.reconnect());
    const replacement = socketAt(1);
    const closeError = new Error('close failed');
    replacement.close.mockImplementation(() => {
      throw closeError;
    });
    expect(() => hook.result.current.close()).toThrow(closeError);
    expect(onError).toHaveBeenCalledWith(closeError);
  });

  it('reconnects after a clean server-initiated close when enabled', () => {
    vi.useFakeTimers();
    const hook = renderHook(() =>
      useWebSocket('ws://clean-close.test', { reconnect: { initialDelay: 10 } }),
    );
    act(() => socketAt().open());
    act(() => socketAt().closeEvent(1000, 'server done'));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(10));
    expect(FakeWebSocket.instances).toHaveLength(2);
    hook.unmount();
  });

  it('reconnects with bounded exponential delays and stops at the limit', () => {
    vi.useFakeTimers();
    const hook = renderHook(() =>
      useWebSocket('ws://retry.test', {
        reconnect: { maxAttempts: 3, initialDelay: 10, factor: 2, maxDelay: 15 },
      }),
    );
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => socketAt(0).closeEvent(1006));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(9));
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(FakeWebSocket.instances).toHaveLength(2);
    act(() => socketAt(1).closeEvent(1006));
    act(() => vi.advanceTimersByTime(15));
    expect(FakeWebSocket.instances).toHaveLength(3);
    act(() => socketAt(2).closeEvent(1006));
    act(() => vi.advanceTimersByTime(15));
    expect(FakeWebSocket.instances).toHaveLength(4);
    act(() => socketAt(3).closeEvent(1006));
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(4);
    expect(hook.result.current.status).toBe('closed');
  });

  it('allows an explicit reconnect and cancels a pending retry', () => {
    vi.useFakeTimers();
    const hook = renderHook(() =>
      useWebSocket('ws://explicit.test', { reconnect: { initialDelay: 100 } }),
    );
    const first = socketAt();
    act(() => first.closeEvent(1006));
    expect(vi.getTimerCount()).toBe(1);
    act(() => hook.result.current.reconnect());
    expect(FakeWebSocket.instances).toHaveLength(2);
    act(() => vi.advanceTimersByTime(1000));
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('updates reconnect policy without replacing the active socket', () => {
    vi.useFakeTimers();
    const hook = renderHook(
      ({ reconnect }: { reconnect: UseWebSocketOptions['reconnect'] }) =>
        useWebSocket('ws://policy-update.test', reconnect === undefined ? {} : { reconnect }),
      {
        initialProps: {
          reconnect: { initialDelay: 10 },
        } as { reconnect: UseWebSocketOptions['reconnect'] },
      },
    );
    const first = socketAt();
    hook.rerender({ reconnect: { initialDelay: 20, maxAttempts: 2 } });
    expect(FakeWebSocket.instances).toHaveLength(1);
    act(() => first.closeEvent(1006));
    expect(vi.getTimerCount()).toBe(1);
    hook.rerender({ reconnect: false });
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(1);
    hook.unmount();
  });

  it('closes the active socket before an explicit reconnect', () => {
    const hook = renderHook(() => useWebSocket('ws://active-reconnect.test'));
    const first = socketAt();
    act(() => first.open());
    act(() => hook.result.current.reconnect());
    expect(first.close).toHaveBeenCalledWith();
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('reports callback errors while preserving the original throw', () => {
    const callbackError = new Error('message callback failed');
    const observerError = new Error('observer failed');
    const queued: VoidFunction[] = [];
    const queueSpy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
      queued.push(callback);
    });
    const onError = vi.fn(() => {
      throw observerError;
    });
    const onMessage = vi.fn(() => {
      throw callbackError;
    });
    renderHook(() => useWebSocket('ws://callback-error.test', { onError, onMessage }));
    const socket = socketAt();
    act(() => socket.open());
    let thrown: unknown;
    try {
      act(() => socket.message('bad'));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(callbackError);
    expect(onError).toHaveBeenCalledWith(callbackError);
    expect(queued).toHaveLength(1);
    let reported: unknown;
    try {
      queued[0]?.();
    } catch (error) {
      reported = error;
    }
    expect(reported).toBe(observerError);
    queueSpy.mockRestore();
  });

  it('reports constructor failures and keeps the original error', () => {
    const failure = new Error('constructor failed');
    const onError = vi.fn();
    FakeWebSocket.constructError = failure;
    expect(() => renderHook(() => useWebSocket('ws://invalid.test', { onError }))).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it('does not leak a retry timer when the initial constructor fails', () => {
    vi.useFakeTimers();
    const failure = new Error('initial constructor failed');
    FakeWebSocket.constructError = failure;
    const onError = vi.fn();
    expect(() =>
      renderHook(() =>
        useWebSocket('ws://initial-failure.test', {
          reconnect: { initialDelay: 5 },
          onError,
        }),
      ),
    ).toThrow(failure);
    expect(vi.getTimerCount()).toBe(0);
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it('continues bounded retries when a later constructor fails', () => {
    vi.useFakeTimers();
    const failure = new Error('retry constructor failed');
    const onError = vi.fn();
    const hook = renderHook(() =>
      useWebSocket('ws://retry-constructor.test', {
        reconnect: { maxAttempts: 2, initialDelay: 5 },
        onError,
      }),
    );
    FakeWebSocket.constructError = failure;
    act(() => socketAt().closeEvent(1006));
    act(() => vi.advanceTimersByTime(10));
    expect(onError).toHaveBeenCalledWith(failure);
    expect(FakeWebSocket.instances).toHaveLength(1);
    FakeWebSocket.constructError = undefined;
    act(() => vi.advanceTimersByTime(5));
    expect(FakeWebSocket.instances).toHaveLength(2);
    hook.unmount();
  });

  it('reports close callback errors and cancels reconnect work', () => {
    vi.useFakeTimers();
    const callbackError = new Error('close callback failed');
    const onClose = vi.fn(() => {
      throw callbackError;
    });
    const hook = renderHook(() =>
      useWebSocket('ws://close-callback-error.test', {
        reconnect: { initialDelay: 5 },
        onClose,
      }),
    );
    let thrown: unknown;
    try {
      act(() => socketAt().closeEvent(1006));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBe(callbackError);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5));
    expect(FakeWebSocket.instances).toHaveLength(1);
    hook.unmount();
  });

  it('clears a pending retry when manually closed', () => {
    vi.useFakeTimers();
    const hook = renderHook(() =>
      useWebSocket('ws://manual-timer-close.test', {
        reconnect: { initialDelay: 25 },
      }),
    );
    act(() => socketAt().closeEvent(1006));
    expect(vi.getTimerCount()).toBe(1);
    act(() => hook.result.current.close());
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(1);
    hook.unmount();
  });

  it('stops and reports message callback failures before rethrowing', () => {
    const callbackError = new Error('message callback failed');
    const onError = vi.fn();
    const onMessage = vi.fn(() => {
      throw callbackError;
    });
    const hook = renderHook(() =>
      useWebSocket('ws://message-failure.test', { onMessage, onError }),
    );
    const socket = socketAt();
    act(() => socket.open());
    expect(() => act(() => socket.message('bad'))).toThrow(callbackError);
    expect(socket.close).toHaveBeenCalledWith();
    hook.rerender();
    expect(hook.result.current.status).toBe('closed');
    expect(hook.result.current.error).toBe(callbackError);
    expect(onError).toHaveBeenCalledWith(callbackError);
    hook.unmount();
  });

  it('preserves native error events when the error observer throws', () => {
    const nativeError = new Error('native socket failure');
    const observerError = new Error('native observer failure');
    const queued: VoidFunction[] = [];
    const queueSpy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
      queued.push(callback);
    });
    const onError = vi.fn(() => {
      throw observerError;
    });
    const hook = renderHook(() => useWebSocket('ws://native-error-observer.test', { onError }));
    const socket = socketAt();
    act(() => socket.error(nativeError));
    expect(hook.result.current.error).toBe(nativeError);
    expect(onError).toHaveBeenCalledWith(nativeError);
    expect(queued).toHaveLength(1);
    expect(() => queued[0]?.()).toThrow(observerError);
    queueSpy.mockRestore();
    hook.unmount();
  });

  it('observes hostile native error objects and cleanup failures', () => {
    const onError = vi.fn();
    const hook = renderHook(() => useWebSocket('ws://hostile-error.test', { onError }));
    const socket = socketAt();
    const hostile = {} as { readonly error: unknown };
    Object.defineProperty(hostile, 'error', {
      configurable: true,
      get: () => {
        throw new Error('error getter failed');
      },
    });
    act(() => socket.onerror?.(hostile as unknown as Event));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBe(hostile);
    const cleanupError = new Error('cleanup failed');
    socket.close.mockImplementation(() => {
      throw cleanupError;
    });
    expect(() => hook.unmount()).toThrow(cleanupError);
    expect(onError).toHaveBeenCalledWith(cleanupError);
  });

  it('preserves handler installation errors and cleans the socket', () => {
    const failure = new Error('handler installation failed');
    const onError = vi.fn();
    FakeWebSocket.handlerError = failure;
    expect(() => renderHook(() => useWebSocket('ws://handler-install.test', { onError }))).toThrow(
      failure,
    );
    expect(onError).toHaveBeenCalledWith(failure);
    expect(socketAt().close).toHaveBeenCalledWith();
  });

  it('cleans sockets and retry timers on unmount and survives StrictMode replay', () => {
    vi.useFakeTimers();
    const hook = renderHook(
      () => useWebSocket('ws://strict.test', { reconnect: { initialDelay: 10 } }),
      { wrapper: StrictMode },
    );
    expect(FakeWebSocket.instances).toHaveLength(2);
    const current = socketAt(1);
    act(() => current.closeEvent(1006));
    expect(vi.getTimerCount()).toBe(1);
    hook.unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it('supports all close argument combinations', () => {
    const hook = renderHook(() => useWebSocket('ws://close-args.test'));
    const socket = socketAt();
    act(() => hook.result.current.close());
    expect(socket.close).toHaveBeenCalledWith();
    act(() => socket.closeEvent());
    hook.rerender();
    act(() => hook.result.current.reconnect());
    const second = socketAt(1);
    expect(socket.close).toHaveBeenCalledWith();
    act(() => hook.result.current.close());
    expect(second.close).toHaveBeenCalledWith();
  });

  it('accepts reconnect aliases and normalizes invalid policy values', () => {
    vi.useFakeTimers();
    const hook = renderHook(() =>
      useWebSocket('ws://aliases.test', {
        reconnect: {
          retries: 1,
          delay: 5,
          backoffFactor: 1,
          maxDelay: 1,
        },
      }),
    );
    act(() => socketAt().closeEvent(1006));
    act(() => vi.advanceTimersByTime(5));
    expect(FakeWebSocket.instances).toHaveLength(2);
    act(() => socketAt(1).closeEvent(1006));
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(2);
    hook.unmount();
  });

  it('does not reconnect after a stale close event', () => {
    vi.useFakeTimers();
    const hook = renderHook(
      ({ url }: { url: string }) => useWebSocket(url, { reconnect: { initialDelay: 10 } }),
      { initialProps: { url: 'ws://stale-one.test' } },
    );
    const first = socketAt();
    hook.rerender({ url: 'ws://stale-two.test' });
    const second = socketAt(1);
    act(() => {
      first.closeEvent(1006);
      second.open();
    });
    act(() => vi.advanceTimersByTime(100));
    expect(FakeWebSocket.instances).toHaveLength(2);
    hook.unmount();
  });

  it('keeps a deterministic closed result during SSR', () => {
    // The dedicated .ssr test runs this same assertion without a WebSocket global.
    const options: UseWebSocketOptions = { enabled: false };
    const { result } = renderHook(() => useWebSocket(null, options));
    expect(result.current.status).toBe('closed');
  });
});
