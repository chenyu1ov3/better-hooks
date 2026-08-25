'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** A ref-like object whose current value is an element. @public */
export type ResizeObserverRefTarget = { readonly current: Element | null };

/** A direct element, ref-like target, or an empty target. @public */
export type ResizeObserverTarget = Element | ResizeObserverRefTarget | null | undefined;

/** Options for {@link useResizeObserver}. @public */
export interface UseResizeObserverOptions {
  /** Optional target when using the object-form overload. */
  readonly target?: ResizeObserverTarget;
  /** Alias for `target`, useful when passing a React ref. */
  readonly ref?: ResizeObserverTarget;
  /** Which box the native observer measures. */
  readonly box?: ResizeObserverOptions['box'];
  /** Disables observation and restores the empty snapshot. */
  readonly enabled?: boolean;
  /** Called with the latest native resize entry. */
  readonly onChange?: (entry: ResizeObserverEntry) => void;
  /** Observes setup and callback failures before the original error escapes. */
  readonly onError?: HookErrorHandler;
}

/** State returned by {@link useResizeObserver}. @public */
export interface ResizeObserverState {
  /** The latest content rectangle, or `null` before the first notification. */
  readonly rect: DOMRectReadOnly | null;
  /** Width of the latest rectangle in CSS pixels. */
  readonly width: number;
  /** Height of the latest rectangle in CSS pixels. */
  readonly height: number;
  /** The most recent setup or callback error, if any. */
  readonly error: unknown;
}

interface ResizeBinding {
  readonly target: Element;
  readonly observer: ResizeObserver;
  readonly box: ResizeObserverOptions['box'];
  readonly generation: number;
}

const EMPTY_STATE: ResizeObserverState = {
  rect: null,
  width: 0,
  height: 0,
  error: undefined,
};

function isElement(value: unknown): value is Element {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  try {
    if (typeof Element !== 'undefined' && value instanceof Element) return true;
    return (
      'nodeType' in value &&
      (value as { readonly nodeType?: unknown }).nodeType === 1 &&
      'addEventListener' in value &&
      typeof (value as { addEventListener?: unknown }).addEventListener === 'function'
    );
  } catch {
    return false;
  }
}

function isRefTarget(value: unknown): value is ResizeObserverRefTarget {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  try {
    return 'current' in value;
  } catch {
    return false;
  }
}

function isOptions(value: unknown): value is UseResizeObserverOptions {
  return typeof value === 'object' && value !== null && !isElement(value) && !isRefTarget(value);
}

function resolveTarget(target: ResizeObserverTarget): Element | undefined {
  if (target === null || target === undefined) return undefined;
  if (isElement(target)) return target;
  if (isRefTarget(target)) {
    try {
      const current = target.current;
      return isElement(current) ? current : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function getObserverConstructor():
  | (new (callback: ResizeObserverCallback) => ResizeObserver)
  | undefined {
  try {
    const candidate = (globalThis as { readonly ResizeObserver?: unknown }).ResizeObserver;
    return typeof candidate === 'function'
      ? (candidate as new (callback: ResizeObserverCallback) => ResizeObserver)
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeDimension(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function disconnect(binding: ResizeBinding): void {
  try {
    binding.observer.disconnect();
  } catch {
    // Cleanup is best effort and must not replace an earlier setup/callback
    // error during target changes or unmount.
  }
}

/**
 * Observes one element with the browser ResizeObserver API. The hook follows
 * ref targets across committed renders, keeps the latest callback, and
 * returns a deterministic empty snapshot during SSR or when the API is
 * unavailable.
 *
 * @public
 */
export function useResizeObserver(options?: UseResizeObserverOptions): ResizeObserverState;
/** @public */
export function useResizeObserver(
  target: ResizeObserverTarget,
  options?: Omit<UseResizeObserverOptions, 'target' | 'ref'>,
): ResizeObserverState;
export function useResizeObserver(
  targetOrOptions?: ResizeObserverTarget | UseResizeObserverOptions,
  extraOptions?: Omit<UseResizeObserverOptions, 'target' | 'ref'>,
): ResizeObserverState {
  const optionObject = isOptions(targetOrOptions) ? targetOrOptions : undefined;
  const options = optionObject ?? extraOptions ?? {};
  const requestedTarget = optionObject
    ? optionObject.target !== undefined
      ? optionObject.target
      : optionObject.ref
    : (targetOrOptions as ResizeObserverTarget | undefined);
  const box = options.box;
  const enabled = options.enabled !== false;
  const resolvedTarget = resolveTarget(requestedTarget);
  const [state, setState] = useState<ResizeObserverState>(EMPTY_STATE);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const callbackRef = useRef(options.onChange);
  const errorRef = useRef(options.onError);
  const bindingRef = useRef<ResizeBinding | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    callbackRef.current = options.onChange;
    errorRef.current = options.onError;
  }, [options.onChange, options.onError]);

  useIsomorphicLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    const target = resolveTarget(requestedTarget);
    const current = bindingRef.current;

    if (current && current.target === target && current.box === box && enabled) return;

    if (current) {
      generationRef.current += 1;
      disconnect(current);
      bindingRef.current = undefined;
    }

    if (!enabled || !target) {
      if (mountedRef.current) setState(EMPTY_STATE);
      return;
    }

    if (mountedRef.current) setState(EMPTY_STATE);

    const Observer = getObserverConstructor();
    if (!Observer) {
      if (mountedRef.current) setState(EMPTY_STATE);
      return;
    }

    const generation = ++generationRef.current;
    let callbackThrew = false;
    let setupErrorReported = false;
    let callbackReceived = false;
    let observer: ResizeObserver | undefined;
    const callback: ResizeObserverCallback = (entries) => {
      if (
        !observer ||
        generation !== generationRef.current ||
        bindingRef.current?.observer !== observer
      )
        return;
      try {
        const entry = entries[0];
        if (!entry) return;
        callbackReceived = true;
        const rect = entry.contentRect ?? null;
        const width = normalizeDimension(rect?.width);
        const height = normalizeDimension(rect?.height);
        if (mountedRef.current) setState({ rect, width, height, error: undefined });
        callbackRef.current?.(entry);
      } catch (error) {
        callbackThrew = true;
        const binding = bindingRef.current;
        if (binding && binding.observer === observer) {
          bindingRef.current = undefined;
          generationRef.current += 1;
          disconnect(binding);
        }
        if (mountedRef.current) setState((previous) => ({ ...previous, error }));
        notifyHookError(error, errorRef.current);
        throw error;
      }
    };

    try {
      observer = new Observer(callback);
      const binding: ResizeBinding = { target, observer, box, generation };
      bindingRef.current = binding;
      try {
        if (box === undefined) observer.observe(target);
        else observer.observe(target, { box });
      } catch (error) {
        if (bindingRef.current === binding) {
          bindingRef.current = undefined;
          disconnect(binding);
        }
        if (!callbackThrew) {
          setupErrorReported = true;
          if (mountedRef.current) setState((previous) => ({ ...previous, error }));
          notifyHookError(error, errorRef.current);
        }
        throw error;
      }
      // Keep an entry delivered synchronously by a test double instead of
      // replacing it with the empty setup snapshot.
      if (!callbackReceived && mountedRef.current) setState(EMPTY_STATE);
    } catch (error) {
      if (!callbackThrew && !setupErrorReported) {
        if (mountedRef.current) setState((previous) => ({ ...previous, error }));
        notifyHookError(error, errorRef.current);
      }
      throw error;
    }
  }, [box, enabled, requestedTarget, resolvedTarget]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      const binding = bindingRef.current;
      bindingRef.current = undefined;
      if (binding) disconnect(binding);
    },
    [],
  );

  return state;
}
