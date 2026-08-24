'use client';

import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** A ref-like object whose current value is an event target. @public */
export type EventListenerRefTarget = { readonly current: EventTarget | null };
/** A direct event target, a ref-like target, or an empty target. @public */
export type EventListenerTarget = EventTarget | null | undefined | EventListenerRefTarget;
/** The callback accepted by the untyped event-listener overloads. @public */
export type EventListenerCallback = (event: Event) => void;

/** Native listener options plus an optional error observer. @public */
export interface UseEventListenerOptions extends AddEventListenerOptions {
  /** Observes callback failures before they are rethrown. */
  readonly onError?: HookErrorHandler;
}

type EventListenerOptions = boolean | UseEventListenerOptions;

function isEventTarget(value: object): value is EventTarget {
  return (
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  );
}

function resolveTarget(target: EventListenerTarget): EventTarget | undefined {
  if (!target) return undefined;
  // Check the EventTarget contract first: user-defined targets may also expose
  // a property named `current` and must not be mistaken for React refs.
  if (isEventTarget(target)) return target;
  if (typeof target === 'object' && 'current' in target) {
    const current = target.current;
    return current && isEventTarget(current) ? current : undefined;
  }
  return undefined;
}

interface ListenerBinding {
  readonly target: EventTarget;
  readonly type: string;
  readonly listener: EventListenerCallback;
  readonly capture: boolean;
  readonly passive: boolean | undefined;
  readonly once: boolean | undefined;
  readonly signal: AbortSignal | undefined;
}

function removeBinding(binding: ListenerBinding): void {
  binding.target.removeEventListener(binding.type, binding.listener, binding.capture);
}

/**
 * Subscribes to a Window event while always invoking the latest committed
 * callback. The target overload also accepts ref-like targets.
 * @public
 */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: EventListenerOptions,
): void;
/** @public */
export function useEventListener<K extends keyof GlobalEventHandlersEventMap>(
  target: EventListenerTarget,
  type: K,
  listener: (event: GlobalEventHandlersEventMap[K]) => void,
  options?: EventListenerOptions,
): void;
/** @public */
export function useEventListener(
  type: string,
  listener: EventListenerCallback,
  options?: EventListenerOptions,
): void;
/** @public */
export function useEventListener(
  target: EventListenerTarget,
  type: string,
  listener: EventListenerCallback,
  options?: EventListenerOptions,
): void;
export function useEventListener(
  targetOrType: EventListenerTarget | string,
  typeOrListener: string | EventListenerCallback,
  listenerOrOptions?: EventListenerCallback | EventListenerOptions,
  options?: EventListenerOptions,
): void {
  const hasExplicitTarget = typeof targetOrType !== 'string';
  const target = hasExplicitTarget
    ? targetOrType
    : typeof window === 'undefined'
      ? undefined
      : window;
  const type = (hasExplicitTarget ? typeOrListener : targetOrType) as string;
  const listener = (
    hasExplicitTarget ? listenerOrOptions : typeOrListener
  ) as EventListenerCallback;
  const eventOptions = hasExplicitTarget
    ? options
    : (listenerOrOptions as EventListenerOptions | undefined);
  const capture =
    typeof eventOptions === 'boolean' ? eventOptions : (eventOptions?.capture ?? false);
  const optionsKind =
    eventOptions === undefined
      ? 'undefined'
      : typeof eventOptions === 'boolean'
        ? 'boolean'
        : 'object';
  const passive = typeof eventOptions === 'boolean' ? undefined : eventOptions?.passive;
  const once = typeof eventOptions === 'boolean' ? undefined : eventOptions?.once;
  const signal = typeof eventOptions === 'boolean' ? undefined : eventOptions?.signal;
  const onError = typeof eventOptions === 'boolean' ? undefined : eventOptions?.onError;
  const listenerRef = useRef(listener);
  const onErrorRef = useRef(onError);
  const bindingRef = useRef<ListenerBinding | undefined>(undefined);
  useIsomorphicLayoutEffect(() => {
    listenerRef.current = listener;
  }, [listener]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Reconcile after every commit so a stable ref object can move between
  // targets without forcing callers to manufacture a new ref identity.
  useEffect(() => {
    const resolved = resolveTarget(target);
    const current = bindingRef.current;
    if (
      current &&
      current.target === resolved &&
      current.type === type &&
      current.capture === capture &&
      current.passive === passive &&
      current.once === once &&
      current.signal === signal
    ) {
      return;
    }

    if (current) removeBinding(current);
    bindingRef.current = undefined;
    if (!resolved) return;

    const stableListener: EventListenerCallback = (event) => {
      try {
        listenerRef.current(event);
      } catch (error) {
        notifyHookError(error, onErrorRef.current);
        throw error;
      }
    };
    const listenerOptions =
      optionsKind === 'boolean'
        ? capture
        : optionsKind === 'undefined'
          ? undefined
          : {
              capture,
              ...(passive === undefined ? {} : { passive }),
              ...(once === undefined ? {} : { once }),
              ...(signal === undefined ? {} : { signal }),
            };
    resolved.addEventListener(type, stableListener, listenerOptions);
    bindingRef.current = {
      target: resolved,
      type,
      listener: stableListener,
      capture,
      passive,
      once,
      signal,
    };
  });

  useEffect(
    () => () => {
      if (bindingRef.current) removeBinding(bindingRef.current);
      bindingRef.current = undefined;
    },
    [],
  );
}
