'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Status of the latest active or completed async run. @public */
export type AsyncStatus = 'idle' | 'pending' | 'success' | 'error';

/** State exposed by {@link useAsync}. @public */
export interface AsyncState<T> {
  /** Lifecycle status of the latest run. */
  readonly status: AsyncStatus;
  /** Most recently resolved data, retained while a later run is pending. */
  readonly data: T | undefined;
  /** Most recent task error, cleared when a new run starts or reset is called. */
  readonly error: unknown;
}

/** Options for {@link useAsync}. @public */
export interface UseAsyncOptions {
  /** Starts the task in an effect after commit when true. */
  readonly immediate?: boolean;
  /** Observes the latest run's task error before the returned promise rejects. */
  readonly onError?: HookErrorHandler;
}

/** State and stable actions returned by {@link useAsync}. @public */
export interface UseAsyncResult<T> extends AsyncState<T> {
  /** Aborts the prior run, if any, and starts the latest committed task. */
  readonly run: () => Promise<T>;
  /** Aborts the active run and returns the status to idle. */
  readonly cancel: () => void;
  /** Aborts the active run and restores the complete initial state. */
  readonly reset: () => void;
}

/** An abort-aware task accepted by {@link useAsync}. @public */
export type AsyncTask<T> = (signal: AbortSignal) => Promise<T> | T;

function createAbortError(): Error {
  const error = new Error('The async run was aborted before its task started.');
  error.name = 'AbortError';
  return error;
}

/**
 * Runs an abortable task while ignoring stale state updates.
 *
 * @param task - The latest committed task invoked by run.
 * @param options - Controls whether a run starts automatically after commit.
 * @returns Async state plus stable run, cancel, and reset actions.
 * @public
 */
export function useAsync<T>(task: AsyncTask<T>, options: UseAsyncOptions = {}): UseAsyncResult<T> {
  const taskRef = useRef(task);
  const onErrorRef = useRef(options.onError);
  const mountedRef = useRef(false);
  const sequenceRef = useRef(0);
  const controllerRef = useRef<AbortController | undefined>(undefined);
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: undefined,
    error: undefined,
  });

  useIsomorphicLayoutEffect(() => {
    taskRef.current = task;
  }, [task]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);
  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sequenceRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = undefined;
    };
  }, []);

  const cancel = useCallback(() => {
    const sequence = ++sequenceRef.current;
    const controller = controllerRef.current;
    controllerRef.current = undefined;
    controller?.abort();
    if (mountedRef.current && sequence === sequenceRef.current)
      setState((previous) => ({ ...previous, status: 'idle' }));
  }, []);

  const run = useCallback(() => {
    if (!mountedRef.current) return Promise.reject<T>(createAbortError());

    const sequence = ++sequenceRef.current;
    const previousController = controllerRef.current;
    // Detach before abort so an abort handler can start and retain a new run.
    controllerRef.current = undefined;
    previousController?.abort();
    if (!mountedRef.current || sequence !== sequenceRef.current)
      return Promise.reject<T>(createAbortError());

    const controller = new AbortController();
    controllerRef.current = controller;
    const currentTask = taskRef.current;
    setState((previous) => ({ ...previous, status: 'pending', error: undefined }));
    return Promise.resolve()
      .then(() => {
        if (!mountedRef.current || sequence !== sequenceRef.current || controller.signal.aborted) {
          throw createAbortError();
        }
        return currentTask(controller.signal);
      })
      .then((value) => {
        if (mountedRef.current && sequence === sequenceRef.current && !controller.signal.aborted) {
          setState({ status: 'success', data: value, error: undefined });
        }
        return value;
      })
      .catch((error) => {
        if (mountedRef.current && sequence === sequenceRef.current && !controller.signal.aborted) {
          setState((previous) => ({ ...previous, status: 'error', error }));
          notifyHookError(error, onErrorRef.current);
        }
        throw error;
      })
      .finally(() => {
        if (controllerRef.current === controller) controllerRef.current = undefined;
      });
  }, []);

  const reset = useCallback(() => {
    const sequence = ++sequenceRef.current;
    const controller = controllerRef.current;
    controllerRef.current = undefined;
    controller?.abort();
    if (mountedRef.current && sequence === sequenceRef.current)
      setState({ status: 'idle', data: undefined, error: undefined });
  }, []);

  useEffect(() => {
    if (options.immediate) void run().catch(() => undefined);
  }, [options.immediate, run]);

  return { ...state, run, cancel, reset };
}
