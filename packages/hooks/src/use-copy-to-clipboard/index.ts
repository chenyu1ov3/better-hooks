'use client';

import { useCallback, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Lifecycle status of the latest clipboard write. @public */
export type ClipboardStatus = 'idle' | 'pending' | 'success' | 'error';

/** Options for {@link useCopyToClipboard}. @public */
export interface UseCopyToClipboardOptions {
  /** Observes a failed clipboard write before its Promise rejects. */
  readonly onError?: HookErrorHandler;
}

/** Clipboard state exposed by {@link useCopyToClipboard}. @public */
export interface CopyToClipboardState {
  /** Status of the latest active or completed write. */
  readonly status: ClipboardStatus;
  /** The most recently copied text, retained while a later write is pending. */
  readonly copiedText: string | undefined;
  /** The most recent active write error, if any. */
  readonly error: unknown;
}

/** Clipboard state and stable actions returned by {@link useCopyToClipboard}. @public */
export interface UseCopyToClipboardResult extends CopyToClipboardState {
  /** Writes text through the browser Clipboard API. */
  readonly copy: (text: string) => Promise<void>;
  /** Invalidates active work and restores the idle state. */
  readonly reset: () => void;
}

const idleState: CopyToClipboardState = {
  copiedText: undefined,
  error: undefined,
  status: 'idle',
};

function createNamedError(name: string, message: string): Error {
  const error = new Error(message);
  error.name = name;
  return error;
}

function getClipboard(): Clipboard | undefined {
  const host = globalThis as typeof globalThis & { readonly navigator?: Navigator };
  const clipboard = host.navigator?.clipboard;
  return clipboard && typeof clipboard.writeText === 'function' ? clipboard : undefined;
}

/**
 * Copies text through `navigator.clipboard.writeText` with observable state and
 * stale-result protection.
 *
 * @param options - Optional error observer.
 * @returns Clipboard state plus stable copy and reset actions.
 * @public
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardResult {
  const [state, setState] = useState<CopyToClipboardState>(idleState);
  const mountedRef = useRef(false);
  const sequenceRef = useRef(0);
  const onErrorRef = useRef(options.onError);

  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sequenceRef.current += 1;
    };
  }, []);

  const copy = useCallback((text: string): Promise<void> => {
    const sequence = ++sequenceRef.current;
    if (!mountedRef.current) {
      return Promise.reject(
        createNamedError(
          'AbortError',
          'The clipboard action was called before the component mounted.',
        ),
      );
    }

    setState((previous) => ({ ...previous, error: undefined, status: 'pending' }));

    const reportError = (error: unknown) => {
      if (!mountedRef.current || sequence !== sequenceRef.current) return;
      setState((previous) => ({ ...previous, error, status: 'error' }));
      notifyHookError(error, onErrorRef.current);
    };

    let write: Promise<void>;
    try {
      const clipboard = getClipboard();
      if (!clipboard) {
        throw createNamedError(
          'NotSupportedError',
          'The Clipboard API is unavailable in this environment.',
        );
      }
      write = clipboard.writeText(text);
    } catch (error) {
      reportError(error);
      return Promise.reject(error);
    }

    return Promise.resolve(write).then(
      () => {
        if (mountedRef.current && sequence === sequenceRef.current) {
          setState({ copiedText: text, error: undefined, status: 'success' });
        }
      },
      (error) => {
        reportError(error);
        throw error;
      },
    );
  }, []);

  const reset = useCallback(() => {
    sequenceRef.current += 1;
    if (mountedRef.current) setState(idleState);
  }, []);

  return { ...state, copy, reset };
}
