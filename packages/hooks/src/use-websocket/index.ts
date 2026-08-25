'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** The lifecycle state of the current WebSocket connection. @public */
export type WebSocketStatus = 'closed' | 'connecting' | 'open' | 'closing';

/** Controls optional reconnect attempts after a server-initiated close, including clean closes. @public */
export interface WebSocketReconnectOptions {
  /** Maximum number of attempts after the initial connection (default: 3). */
  readonly maxAttempts?: number;
  /** Alias for `maxAttempts`. */
  readonly retries?: number;
  /** Delay before the first reconnect attempt in milliseconds (default: 1000). */
  readonly initialDelay?: number;
  /** Alias for `initialDelay`. */
  readonly delay?: number;
  /** Exponential delay multiplier (default: 2). */
  readonly factor?: number;
  /** Alias for `factor`. */
  readonly backoffFactor?: number;
  /** Maximum reconnect delay in milliseconds (default: 30000). */
  readonly maxDelay?: number;
}

/** Options accepted by {@link useWebSocket}. @public */
export interface UseWebSocketOptions {
  /** Protocol name or names passed to the native WebSocket constructor. */
  readonly protocols?: string | readonly string[];
  /** Disables connection management while false. Defaults to true. */
  readonly enabled?: boolean;
  /** Enables reconnecting after server-initiated closes, including clean closes, or supplies its policy. */
  readonly reconnect?: boolean | WebSocketReconnectOptions;
  /** Called when the socket opens. */
  readonly onOpen?: (event: Event) => void;
  /** Called for each message. The native event is passed unchanged. */
  readonly onMessage?: (event: MessageEvent) => void;
  /** Called when the socket closes. */
  readonly onClose?: (event: CloseEvent) => void;
  /** Observes native and callback failures. */
  readonly onError?: HookErrorHandler;
}

/** State and stable actions returned by {@link useWebSocket}. @public */
export interface UseWebSocketResult {
  /** Current socket lifecycle state. */
  readonly status: WebSocketStatus;
  /** Most recent raw `MessageEvent.data` value. */
  readonly data: MessageEvent['data'] | undefined;
  /** Most recent native, callback, or connection-management error. */
  readonly error: unknown;
  /** Sends data through the currently open socket; throws InvalidStateError otherwise. */
  readonly send: (data: Parameters<WebSocket['send']>[0]) => void;
  /** Closes the current socket and suppresses automatic reconnects. */
  readonly close: (code?: number, reason?: string) => void;
  /** Closes the current socket and starts a fresh connection immediately. */
  readonly reconnect: () => void;
}

interface NormalizedReconnectOptions {
  readonly enabled: boolean;
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly factor: number;
  readonly maxDelay: number;
}

interface CallbackRefs {
  onOpen: UseWebSocketOptions['onOpen'];
  onMessage: UseWebSocketOptions['onMessage'];
  onClose: UseWebSocketOptions['onClose'];
  onError: UseWebSocketOptions['onError'];
}

interface SocketManager {
  active: boolean;
  closedByUser: boolean;
  token: number;
  attempt: number;
  socket: WebSocket | undefined;
  timer: ReturnType<typeof setTimeout> | undefined;
  connect?: (attempt: number) => void;
}

const DEFAULT_RECONNECT: Required<
  Pick<WebSocketReconnectOptions, 'maxAttempts' | 'initialDelay' | 'factor' | 'maxDelay'>
> = {
  maxAttempts: 3,
  initialDelay: 1000,
  factor: 2,
  maxDelay: 30_000,
};

// WebSocket readyState constants are part of the platform contract and are
// available even when the constructor is absent during SSR.
const WEBSOCKET_OPEN = 1;
const WEBSOCKET_CLOSED = 3;

function finiteAtLeast(value: number | undefined, fallback: number, minimum: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum ? value : fallback;
}

function normalizeReconnect(value: UseWebSocketOptions['reconnect']): NormalizedReconnectOptions {
  if (!value) {
    return {
      enabled: false,
      maxAttempts: DEFAULT_RECONNECT.maxAttempts,
      initialDelay: DEFAULT_RECONNECT.initialDelay,
      factor: DEFAULT_RECONNECT.factor,
      maxDelay: DEFAULT_RECONNECT.maxDelay,
    };
  }

  const options = typeof value === 'object' ? value : {};
  const maxAttempts = Math.floor(
    finiteAtLeast(options.maxAttempts ?? options.retries, DEFAULT_RECONNECT.maxAttempts, 0),
  );
  const initialDelay = finiteAtLeast(
    options.initialDelay ?? options.delay,
    DEFAULT_RECONNECT.initialDelay,
    0,
  );
  const factor = finiteAtLeast(
    options.factor ?? options.backoffFactor,
    DEFAULT_RECONNECT.factor,
    1,
  );
  const maxDelay = finiteAtLeast(options.maxDelay, DEFAULT_RECONNECT.maxDelay, 0);
  return { enabled: true, maxAttempts, initialDelay, factor, maxDelay };
}

function normalizeProtocols(protocols: UseWebSocketOptions['protocols']): {
  readonly value: string | string[] | undefined;
  readonly key: string;
} {
  if (protocols === undefined) return { value: undefined, key: 'undefined' };
  if (typeof protocols === 'string') return { value: protocols, key: `string:${protocols}` };
  const value = [...protocols];
  return { value, key: `array:${JSON.stringify(value)}` };
}

function getSocketError(event: unknown): unknown {
  if (event && (typeof event === 'object' || typeof event === 'function')) {
    try {
      const error = (event as { readonly error?: unknown }).error;
      if (error !== undefined && error !== null) return error;
    } catch {
      // A hostile event object should still be observable as the original event.
    }
  }
  return event;
}

function createNotOpenError(): Error {
  if (typeof DOMException === 'function') {
    try {
      return new DOMException('WebSocket is not open.', 'InvalidStateError');
    } catch {
      // Fall back to an Error for runtimes with an incomplete DOM shim.
    }
  }
  const error = new Error('WebSocket is not open.');
  error.name = 'InvalidStateError';
  return error;
}

function invokeCallback<T>(
  callback: ((value: T) => void) | undefined,
  value: T,
  onError: HookErrorHandler | undefined,
  onFailure?: (error: unknown) => void,
): void {
  if (!callback) return;
  try {
    callback(value);
  } catch (error) {
    onFailure?.(error);
    notifyHookError(error, onError);
    throw error;
  }
}

function isClosed(socket: WebSocket): boolean {
  try {
    return socket.readyState === WEBSOCKET_CLOSED;
  } catch {
    // A custom WebSocket-like object may expose a hostile readyState getter.
    // Treat it as open so callers can still observe a close/send failure.
    return false;
  }
}

/**
 * Manages a browser WebSocket connection with stable actions, SSR-safe
 * initialization, and optional bounded exponential reconnects after
 * server-initiated closes.
 * @public
 */
export function useWebSocket(
  url: string | URL | null,
  options: UseWebSocketOptions = {},
): UseWebSocketResult {
  const normalizedUrl = url === null ? null : String(url);
  const normalizedProtocols = normalizeProtocols(options.protocols);
  const protocolsValueRef = useRef<string | string[] | undefined>(normalizedProtocols.value);
  const reconnectOptions = normalizeReconnect(options.reconnect);
  const reconnectOptionsRef = useRef(reconnectOptions);
  const enabled = options.enabled !== false;
  const connectionConfigRef = useRef({ enabled, url: normalizedUrl });
  const callbacksRef = useRef<CallbackRefs>({
    onOpen: options.onOpen,
    onMessage: options.onMessage,
    onClose: options.onClose,
    onError: options.onError,
  });
  const mountedRef = useRef(false);
  const managerRef = useRef<SocketManager | undefined>(undefined);
  const socketRef = useRef<WebSocket | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    protocolsValueRef.current = normalizedProtocols.value;
  }, [normalizedProtocols.key]);

  useIsomorphicLayoutEffect(() => {
    const previous = reconnectOptionsRef.current;
    reconnectOptionsRef.current = reconnectOptions;
    if (previous.enabled && !reconnectOptions.enabled) {
      const manager = managerRef.current;
      if (manager?.timer !== undefined) {
        clearTimeout(manager.timer);
        manager.timer = undefined;
      }
    }
  }, [
    reconnectOptions.enabled,
    reconnectOptions.factor,
    reconnectOptions.initialDelay,
    reconnectOptions.maxAttempts,
    reconnectOptions.maxDelay,
  ]);

  useIsomorphicLayoutEffect(() => {
    connectionConfigRef.current = { enabled, url: normalizedUrl };
  }, [enabled, normalizedUrl]);

  useIsomorphicLayoutEffect(() => {
    callbacksRef.current = {
      onOpen: options.onOpen,
      onMessage: options.onMessage,
      onClose: options.onClose,
      onError: options.onError,
    };
  }, [options.onClose, options.onError, options.onMessage, options.onOpen]);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const send = useCallback<UseWebSocketResult['send']>((data) => {
    const socket = socketRef.current;
    if (!socket) {
      const error = createNotOpenError();
      if (mountedRef.current) setState((previous) => ({ ...previous, error }));
      notifyHookError(error, callbacksRef.current.onError);
      throw error;
    }
    try {
      // Native WebSocket implementations silently discard data while closing
      // or closed. The Hook exposes one deterministic contract for every
      // non-open state and leaves the native send method untouched otherwise.
      if (socket.readyState !== WEBSOCKET_OPEN) {
        throw createNotOpenError();
      }
      socket.send(data);
    } catch (error) {
      if (mountedRef.current) setState((previous) => ({ ...previous, error }));
      notifyHookError(error, callbacksRef.current.onError);
      throw error;
    }
  }, []);

  const close = useCallback<UseWebSocketResult['close']>((code, reason) => {
    const manager = managerRef.current;
    if (!manager || !manager.active) return;
    manager.closedByUser = true;
    if (manager.timer !== undefined) {
      clearTimeout(manager.timer);
      manager.timer = undefined;
    }
    const socket = manager.socket;
    if (!socket || isClosed(socket)) {
      manager.socket = undefined;
      if (socketRef.current === socket) socketRef.current = undefined;
      if (mountedRef.current) setState((previous) => ({ ...previous, status: 'closed' }));
      return;
    }
    if (mountedRef.current) setState((previous) => ({ ...previous, status: 'closing' }));
    try {
      if (code === undefined && reason === undefined) socket.close();
      else if (reason === undefined) socket.close(code);
      else if (code === undefined) socket.close(undefined, reason);
      else socket.close(code, reason);
    } catch (error) {
      if (mountedRef.current) setState((previous) => ({ ...previous, error }));
      notifyHookError(error, callbacksRef.current.onError);
      throw error;
    }
  }, []);

  const reconnect = useCallback<UseWebSocketResult['reconnect']>(() => {
    const manager = managerRef.current;
    const config = connectionConfigRef.current;
    if (
      !manager ||
      !manager.active ||
      !config.enabled ||
      config.url === null ||
      typeof WebSocket === 'undefined'
    ) {
      return;
    }
    manager.closedByUser = true;
    if (manager.timer !== undefined) {
      clearTimeout(manager.timer);
      manager.timer = undefined;
    }
    const previous = manager.socket;
    manager.socket = undefined;
    manager.token += 1;
    if (socketRef.current === previous) socketRef.current = undefined;
    if (previous && !isClosed(previous)) {
      try {
        previous.close();
      } catch (error) {
        if (mountedRef.current) setState((previous) => ({ ...previous, error }));
        notifyHookError(error, callbacksRef.current.onError);
        throw error;
      }
    }
    manager.closedByUser = false;
    manager.connect?.(0);
  }, []);

  const [state, setState] = useState<UseWebSocketResult>({
    status: 'closed',
    data: undefined,
    error: undefined,
    send,
    close,
    reconnect,
  });

  useEffect(() => {
    const manager: SocketManager = {
      active: true,
      closedByUser: false,
      token: 0,
      attempt: 0,
      socket: undefined,
      timer: undefined,
    };
    managerRef.current = manager;

    const isCurrentManager = (): boolean =>
      manager.active && managerRef.current === manager && mountedRef.current;
    const clearReconnectTimer = (): void => {
      if (manager.timer !== undefined) {
        clearTimeout(manager.timer);
        manager.timer = undefined;
      }
    };
    const updateState = (
      next: Partial<Pick<UseWebSocketResult, 'status' | 'data' | 'error'>>,
    ): void => {
      if (!isCurrentManager()) return;
      setState((previous) => ({ ...previous, ...next }));
    };
    const scheduleReconnect = (attempt: number): void => {
      const policy = reconnectOptionsRef.current;
      if (
        !isCurrentManager() ||
        manager.closedByUser ||
        !policy.enabled ||
        attempt >= policy.maxAttempts
      ) {
        return;
      }
      const delay = Math.min(policy.maxDelay, policy.initialDelay * policy.factor ** attempt);
      clearReconnectTimer();
      manager.timer = setTimeout(() => {
        manager.timer = undefined;
        const currentPolicy = reconnectOptionsRef.current;
        if (!currentPolicy.enabled || attempt >= currentPolicy.maxAttempts) return;
        try {
          manager.connect?.(attempt + 1);
        } catch {
          // A retry runs outside the caller's stack. The original failure was
          // already reported through onError; keep future retries alive.
        }
      }, delay);
    };

    const connect = (attempt: number): void => {
      if (
        !isCurrentManager() ||
        manager.closedByUser ||
        !enabled ||
        normalizedUrl === null ||
        typeof WebSocket === 'undefined'
      ) {
        return;
      }
      clearReconnectTimer();
      manager.attempt = attempt;
      const token = ++manager.token;
      const previous = manager.socket;
      manager.socket = undefined;
      if (socketRef.current === previous) socketRef.current = undefined;
      if (previous && !isClosed(previous)) {
        try {
          previous.close();
        } catch (error) {
          updateState({ error });
          notifyHookError(error, callbacksRef.current.onError);
          if (attempt === 0) throw error;
        }
      }
      updateState({ status: 'connecting', error: undefined });

      let socket: WebSocket;
      try {
        socket =
          protocolsValueRef.current === undefined
            ? new WebSocket(normalizedUrl)
            : new WebSocket(normalizedUrl, protocolsValueRef.current);
      } catch (error) {
        updateState({ status: 'closed', error });
        notifyHookError(error, callbacksRef.current.onError);
        if (attempt === 0) {
          // A synchronous setup error escapes the effect. Do not leave a retry
          // timer behind because React cannot register this effect's cleanup
          // after the throw.
          clearReconnectTimer();
          throw error;
        }
        scheduleReconnect(attempt);
        return;
      }

      if (!isCurrentManager() || token !== manager.token || manager.closedByUser) {
        try {
          socket.close();
        } catch {
          // The connection became stale before it could be bound.
        }
        return;
      }

      manager.socket = socket;
      socketRef.current = socket;
      const isCurrentSocket = (): boolean =>
        isCurrentManager() && manager.socket === socket && token === manager.token;
      const stopAfterCallbackFailure = (error: unknown): void => {
        manager.closedByUser = true;
        manager.attempt = 0;
        clearReconnectTimer();
        if (manager.socket === socket) manager.socket = undefined;
        if (socketRef.current === socket) socketRef.current = undefined;
        updateState({ status: 'closed', error });
        if (!isClosed(socket)) {
          try {
            socket.close();
          } catch (cleanupError) {
            notifyHookError(cleanupError, callbacksRef.current.onError);
          }
        }
      };
      const stopRetryAfterCloseCallbackFailure = (error: unknown): void => {
        manager.closedByUser = true;
        manager.attempt = 0;
        clearReconnectTimer();
        updateState({ error });
      };

      try {
        socket.onopen = (event: Event) => {
          if (!isCurrentSocket()) return;
          manager.attempt = 0;
          updateState({ status: 'open', error: undefined });
          invokeCallback(
            callbacksRef.current.onOpen,
            event,
            callbacksRef.current.onError,
            stopAfterCallbackFailure,
          );
        };
        socket.onmessage = (event: MessageEvent) => {
          if (!isCurrentSocket()) return;
          updateState({ status: 'open', data: event.data });
          invokeCallback(
            callbacksRef.current.onMessage,
            event,
            callbacksRef.current.onError,
            stopAfterCallbackFailure,
          );
        };
        socket.onerror = (event: Event) => {
          if (!isCurrentSocket()) return;
          const error = getSocketError(event);
          updateState({ error });
          notifyHookError(error, callbacksRef.current.onError);
        };
        socket.onclose = (event: CloseEvent) => {
          if (!isCurrentSocket()) return;
          const closeToken = manager.token;
          manager.socket = undefined;
          if (socketRef.current === socket) socketRef.current = undefined;
          updateState({ status: 'closed' });
          invokeCallback(
            callbacksRef.current.onClose,
            event,
            callbacksRef.current.onError,
            stopRetryAfterCloseCallbackFailure,
          );
          if (manager.token === closeToken && manager.socket === undefined) {
            scheduleReconnect(manager.attempt);
          }
        };
      } catch (error) {
        if (manager.socket === socket) manager.socket = undefined;
        if (socketRef.current === socket) socketRef.current = undefined;
        try {
          socket.close();
        } catch {
          // Preserve the handler-installation error.
        }
        updateState({ status: 'closed', error });
        notifyHookError(error, callbacksRef.current.onError);
        if (attempt === 0) {
          clearReconnectTimer();
          throw error;
        }
        scheduleReconnect(attempt);
      }
    };
    manager.connect = connect;

    if (!enabled || normalizedUrl === null || typeof WebSocket === 'undefined') {
      setState({
        status: 'closed',
        data: undefined,
        error: undefined,
        send,
        close,
        reconnect,
      });
    } else {
      setState((previous) => ({
        ...previous,
        status: 'connecting',
        data: undefined,
        error: undefined,
        send,
        close,
        reconnect,
      }));
      connect(0);
    }

    return () => {
      manager.active = false;
      manager.closedByUser = true;
      clearReconnectTimer();
      const socket = manager.socket;
      manager.socket = undefined;
      manager.token += 1;
      if (socketRef.current === socket) socketRef.current = undefined;
      if (managerRef.current === manager) managerRef.current = undefined;
      if (socket && !isClosed(socket)) {
        try {
          socket.close();
        } catch (error) {
          notifyHookError(error, callbacksRef.current.onError);
          throw error;
        }
      }
    };
  }, [close, enabled, normalizedProtocols.key, normalizedUrl, reconnect, send]);

  return { ...state, send, close, reconnect };
}
