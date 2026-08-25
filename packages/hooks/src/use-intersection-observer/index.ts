'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** A ref-like object whose current value is an element. @public */
export type IntersectionObserverRefTarget = { readonly current: Element | null };

/** A direct element, ref-like target, or an empty target. @public */
export type IntersectionObserverTarget = Element | IntersectionObserverRefTarget | null | undefined;

/** A native threshold value or an immutable threshold list. @public */
export type IntersectionObserverThreshold = number | readonly number[];

/** Options for {@link useIntersectionObserver}. @public */
export interface UseIntersectionObserverOptions {
  /** Optional target when using the object-form overload. */
  readonly target?: IntersectionObserverTarget;
  /** Alias for `target`, useful when passing a React ref. */
  readonly ref?: IntersectionObserverTarget;
  /** The root element or document used by the native observer. */
  readonly root?: IntersectionObserverInit['root'];
  /** Margin around the root's bounding box. */
  readonly rootMargin?: string;
  /** One threshold or a list of thresholds. */
  readonly threshold?: IntersectionObserverThreshold;
  /** Disables observation and restores the empty snapshot. */
  readonly enabled?: boolean;
  /** Called with the latest native intersection entry. */
  readonly onChange?: (entry: IntersectionObserverEntry) => void;
  /** Observes setup and callback failures before the original error escapes. */
  readonly onError?: HookErrorHandler;
}

/** State returned by {@link useIntersectionObserver}. @public */
export interface IntersectionObserverState {
  /** The most recent entry, or `null` before the first notification. */
  readonly entry: IntersectionObserverEntry | null;
  /** Whether the most recent entry intersects the root. */
  readonly isIntersecting: boolean;
  /** The most recent setup or callback error, if any. */
  readonly error: unknown;
}

interface IntersectionBinding {
  readonly target: Element;
  readonly observer: IntersectionObserver;
  readonly root: IntersectionObserverInit['root'];
  readonly rootMargin: string | undefined;
  readonly threshold: IntersectionObserverInit['threshold'];
  readonly generation: number;
}

const EMPTY_STATE: IntersectionObserverState = {
  entry: null,
  isIntersecting: false,
  error: undefined,
};

function isElement(value: unknown): value is Element {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  // `instanceof Element` does not work across iframe realms. The nodeType
  // check keeps direct targets useful in those realms and in lightweight test
  // doubles without reading a browser global during module evaluation.
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

function isRefTarget(value: unknown): value is IntersectionObserverRefTarget {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  try {
    return 'current' in value;
  } catch {
    return false;
  }
}

function isOptions(value: unknown): value is UseIntersectionObserverOptions {
  return typeof value === 'object' && value !== null && !isElement(value) && !isRefTarget(value);
}

function resolveTarget(target: IntersectionObserverTarget): Element | undefined {
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

function thresholdEqual(
  first: IntersectionObserverThreshold | undefined,
  second: IntersectionObserverThreshold | undefined,
): boolean {
  if (first === second && !Array.isArray(first)) return true;
  if (!Array.isArray(first) || !Array.isArray(second) || first.length !== second.length)
    return first === second;
  return first.every((value, index) => value === second[index]);
}

function cloneThreshold(
  value: IntersectionObserverThreshold | undefined,
): IntersectionObserverInit['threshold'] {
  if (value === undefined || typeof value === 'number') return value;
  return Array.from(value);
}

function useThresholdSnapshot(
  value: IntersectionObserverThreshold | undefined,
): IntersectionObserverInit['threshold'] {
  const snapshotRef = useRef<IntersectionObserverInit['threshold']>(cloneThreshold(value));
  if (!thresholdEqual(snapshotRef.current, value)) {
    snapshotRef.current = cloneThreshold(value);
  }
  return snapshotRef.current;
}

function sameBinding(
  binding: IntersectionBinding,
  target: Element | undefined,
  root: IntersectionObserverInit['root'],
  rootMargin: string | undefined,
  threshold: IntersectionObserverThreshold | undefined,
): boolean {
  return (
    binding.target === target &&
    binding.root === root &&
    binding.rootMargin === rootMargin &&
    thresholdEqual(binding.threshold, threshold)
  );
}

function getObserverConstructor():
  | (new (
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) => IntersectionObserver)
  | undefined {
  try {
    const candidate = (globalThis as { readonly IntersectionObserver?: unknown })
      .IntersectionObserver;
    return typeof candidate === 'function'
      ? (candidate as new (
          callback: IntersectionObserverCallback,
          options?: IntersectionObserverInit,
        ) => IntersectionObserver)
      : undefined;
  } catch {
    return undefined;
  }
}

function disconnect(binding: IntersectionBinding): void {
  try {
    binding.observer.disconnect();
  } catch {
    // Cleanup is best effort. A hostile observer must not replace the error
    // that caused a target change or unmount.
  }
}

/**
 * Observes one element with the browser IntersectionObserver API. The hook
 * follows ref targets across committed renders, keeps the latest callback,
 * and returns a deterministic empty snapshot during SSR or when the API is
 * unavailable.
 *
 * @public
 */
export function useIntersectionObserver(
  options?: UseIntersectionObserverOptions,
): IntersectionObserverState;
/** @public */
export function useIntersectionObserver(
  target: IntersectionObserverTarget,
  options?: Omit<UseIntersectionObserverOptions, 'target' | 'ref'>,
): IntersectionObserverState;
export function useIntersectionObserver(
  targetOrOptions?: IntersectionObserverTarget | UseIntersectionObserverOptions,
  extraOptions?: Omit<UseIntersectionObserverOptions, 'target' | 'ref'>,
): IntersectionObserverState {
  const optionObject = isOptions(targetOrOptions) ? targetOrOptions : undefined;
  const options = optionObject ?? extraOptions ?? {};
  const requestedTarget = optionObject
    ? optionObject.target !== undefined
      ? optionObject.target
      : optionObject.ref
    : (targetOrOptions as IntersectionObserverTarget | undefined);
  const root = options.root;
  const rootMargin = options.rootMargin;
  // Keep an immutable render snapshot so mutating a caller-owned threshold
  // array is detected on the next commit instead of being hidden by the same
  // array reference in the active binding.
  const threshold = useThresholdSnapshot(options.threshold);
  const enabled = options.enabled !== false;
  const resolvedTarget = resolveTarget(requestedTarget);
  const [state, setState] = useState<IntersectionObserverState>(EMPTY_STATE);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const callbackRef = useRef(options.onChange);
  const errorRef = useRef(options.onError);
  const bindingRef = useRef<IntersectionBinding | undefined>(undefined);

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

    if (current && sameBinding(current, target, root, rootMargin, threshold) && enabled) return;

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
    let observer: IntersectionObserver | undefined;
    const callback: IntersectionObserverCallback = (entries) => {
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
        const isIntersecting = Boolean(entry.isIntersecting);
        if (mountedRef.current) {
          setState({ entry, isIntersecting, error: undefined });
        }
        callbackRef.current?.(entry);
      } catch (error) {
        callbackThrew = true;
        const binding = bindingRef.current;
        if (binding && binding.observer === observer) {
          bindingRef.current = undefined;
          generationRef.current += 1;
          disconnect(binding);
        }
        if (mountedRef.current) {
          setState((previous) => ({ ...previous, error }));
        }
        notifyHookError(error, errorRef.current);
        throw error;
      }
    };

    const observerOptions: IntersectionObserverInit = {};
    if (root !== undefined) observerOptions.root = root;
    if (rootMargin !== undefined) observerOptions.rootMargin = rootMargin;
    if (threshold !== undefined) observerOptions.threshold = threshold;

    try {
      observer = new Observer(callback, observerOptions);
      const binding: IntersectionBinding = {
        target,
        observer,
        root,
        rootMargin,
        threshold: Array.isArray(threshold) ? [...threshold] : threshold,
        generation,
      };
      bindingRef.current = binding;
      try {
        observer.observe(target);
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
      // A synchronous test double may notify from `observe`. Keep that entry
      // rather than replacing it with the empty setup snapshot.
      if (!callbackReceived && mountedRef.current) setState(EMPTY_STATE);
    } catch (error) {
      // Constructor failures arrive here. Observe failures have already been
      // reported by the nested catch, so they are not reported twice.
      if (!callbackThrew && !setupErrorReported) {
        if (mountedRef.current) setState((previous) => ({ ...previous, error }));
        notifyHookError(error, errorRef.current);
      }
      throw error;
    }
  }, [enabled, requestedTarget, resolvedTarget, root, rootMargin, threshold]);

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
