'use client';

import { useEffect, useRef, useState } from 'react';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** A ref-like or direct event target observed by {@link useHover}. @public */
export type HoverTarget =
  | EventTarget
  | { readonly current: EventTarget | null }
  | (() => EventTarget | null | undefined)
  | null
  | undefined;

/** Options for {@link useHover}. @public */
export interface UseHoverOptions {
  /** Optional target when using the object-form overload. */
  readonly target?: HoverTarget;
  /** Alias for `target`, useful when passing a React ref. */
  readonly ref?: HoverTarget;
  /** Disables listeners and forces the returned state to `false`. */
  readonly enabled?: boolean;
  /** Whether mouseenter/mouseleave listeners use capture. */
  readonly capture?: boolean;
  /** Called after the target becomes hovered. */
  readonly onEnter?: (event: MouseEvent) => void;
  /** Called after the target is no longer hovered. */
  readonly onLeave?: (event: MouseEvent) => void;
  /** Called after each hover transition. */
  readonly onChange?: (isHovering: boolean, event: MouseEvent) => void;
  /** Observes callback failures before the original error is rethrown. */
  readonly onError?: HookErrorHandler;
}

interface HoverBinding {
  readonly target: EventTarget;
  readonly capture: boolean;
  readonly onEnter: EventListener;
  readonly onLeave: EventListener;
}

function isEventTarget(value: unknown): value is EventTarget {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return (
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  );
}

function isRefTarget(value: unknown): value is { readonly current: EventTarget | null } {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return 'current' in value;
}

function isOptions(value: unknown): value is UseHoverOptions {
  return (
    typeof value === 'object' && value !== null && !isEventTarget(value) && !isRefTarget(value)
  );
}

function resolveTarget(target: HoverTarget): EventTarget | undefined {
  if (!target) return undefined;
  if (typeof target === 'function') {
    try {
      return resolveTarget(target());
    } catch {
      return undefined;
    }
  }
  if (isEventTarget(target)) return target;
  if (isRefTarget(target)) return resolveTarget(target.current);
  return undefined;
}

/**
 * Tracks whether a target is between `mouseenter` and `mouseleave` events.
 * The subscription follows the current value of a ref on each committed
 * render, and every native listener is removed when its target changes or the
 * component unmounts.
 *
 * @public
 */
export function useHover(options?: UseHoverOptions): boolean;
/** @public */
export function useHover(
  target: HoverTarget,
  options?: Omit<UseHoverOptions, 'target' | 'ref'>,
): boolean;
export function useHover(
  targetOrOptions?: HoverTarget | UseHoverOptions,
  extraOptions?: Omit<UseHoverOptions, 'target' | 'ref'>,
): boolean {
  const optionObject = isOptions(targetOrOptions) ? targetOrOptions : undefined;
  const options = optionObject ?? extraOptions ?? {};
  const requestedTarget = optionObject
    ? (optionObject.target ?? optionObject.ref)
    : (targetOrOptions as HoverTarget | undefined);
  const resolvedTarget = resolveTarget(requestedTarget);
  const enabled = options.enabled !== false;
  const capture = options.capture ?? false;

  const [hovering, setHovering] = useState(false);
  const hoveringRef = useRef(false);
  const mountedRef = useRef(false);
  const enterRef = useRef(options.onEnter);
  const leaveRef = useRef(options.onLeave);
  const changeRef = useRef(options.onChange);
  const errorRef = useRef(options.onError);
  const bindingRef = useRef<HoverBinding | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    enterRef.current = options.onEnter;
    leaveRef.current = options.onLeave;
    changeRef.current = options.onChange;
    errorRef.current = options.onError;
  }, [options.onChange, options.onEnter, options.onError, options.onLeave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const target = resolveTarget(requestedTarget);
    const current = bindingRef.current;
    // A target change cannot carry hover state across elements. Reset before
    // installing the next pair of listeners so stale targets cannot affect it.
    if (!current || current.target !== target || current.capture !== capture || !enabled) {
      hoveringRef.current = false;
      if (mountedRef.current) setHovering(false);
    }
    if (current && current.target === target && current.capture === capture && enabled) return;

    if (current) {
      current.target.removeEventListener('mouseenter', current.onEnter, current.capture);
      current.target.removeEventListener('mouseleave', current.onLeave, current.capture);
      bindingRef.current = undefined;
    }
    if (!enabled || !target) return;

    const transition = (next: boolean, event: MouseEvent): void => {
      hoveringRef.current = next;
      if (mountedRef.current) setHovering(next);

      try {
        if (next) enterRef.current?.(event);
        else leaveRef.current?.(event);
        changeRef.current?.(next, event);
      } catch (error) {
        notifyHookError(error, errorRef.current);
        throw error;
      }
    };
    const onEnter = (event: Event) => transition(true, event as MouseEvent);
    const onLeave = (event: Event) => transition(false, event as MouseEvent);
    let enterAdded = false;
    let leaveAdded = false;
    try {
      target.addEventListener('mouseenter', onEnter, capture);
      enterAdded = true;
      target.addEventListener('mouseleave', onLeave, capture);
      leaveAdded = true;
    } catch (error) {
      if (enterAdded) {
        try {
          target.removeEventListener('mouseenter', onEnter, capture);
        } catch {
          // Preserve the registration error while still attempting the second cleanup.
        }
      }
      if (leaveAdded) {
        try {
          target.removeEventListener('mouseleave', onLeave, capture);
        } catch {
          // Cleanup is best effort for hostile custom EventTarget implementations.
        }
      }
      notifyHookError(error, errorRef.current);
      throw error;
    }

    bindingRef.current = { target, capture, onEnter, onLeave };
  }, [capture, enabled, requestedTarget, resolvedTarget]);

  useEffect(
    () => () => {
      const binding = bindingRef.current;
      if (!binding) return;
      binding.target.removeEventListener('mouseenter', binding.onEnter, binding.capture);
      binding.target.removeEventListener('mouseleave', binding.onLeave, binding.capture);
      bindingRef.current = undefined;
    },
    [],
  );

  return hovering;
}
