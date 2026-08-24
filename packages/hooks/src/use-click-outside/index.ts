'use client';

import { useEffect, useRef } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

interface OutsideBinding {
  readonly document: Document;
  readonly root: ShadowRoot | undefined;
  readonly listener: (event: PointerEvent) => void;
  readonly rootListener: EventListener | undefined;
}

/** Options for {@link useClickOutside}. @public */
export interface UseClickOutsideOptions {
  /** Whether the outside listener is active. */
  readonly enabled?: boolean;
  /** Observes callback failures before they are rethrown. */
  readonly onError?: HookErrorHandler;
}

function eventOccurredInside(event: PointerEvent, element: HTMLElement): boolean {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  if (path.includes(element)) return true;

  const target = event.target;
  const NodeConstructor = element.ownerDocument.defaultView?.Node;
  const isNode = NodeConstructor
    ? target instanceof NodeConstructor
    : Boolean(target && typeof (target as Node).nodeType === 'number');
  return isNode && element.contains(target as Node);
}

/**
 * Calls `onOutside` for captured pointer presses outside the referenced element.
 * The listener follows the element to its owner document and supports composed
 * events crossing a shadow root.
 * @public
 */
export function useClickOutside<T extends HTMLElement>(
  ref: { readonly current: T | null },
  onOutside: (event: PointerEvent) => void,
  enabledOrOptions: boolean | UseClickOutsideOptions = true,
): void {
  const enabled =
    typeof enabledOrOptions === 'boolean' ? enabledOrOptions : (enabledOrOptions.enabled ?? true);
  const onError = typeof enabledOrOptions === 'boolean' ? undefined : enabledOrOptions.onError;
  const callbackRef = useRef(onOutside);
  const onErrorRef = useRef(onError);
  const targetRef = useRef(ref);
  const bindingRef = useRef<OutsideBinding | undefined>(undefined);
  useIsomorphicLayoutEffect(() => {
    callbackRef.current = onOutside;
    targetRef.current = ref;
  }, [onOutside, ref]);
  useIsomorphicLayoutEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const element = enabled ? ref.current : null;
    const targetDocument = element?.ownerDocument;
    const nodeRoot = element?.getRootNode();
    const targetRoot =
      nodeRoot?.nodeType === 11 && 'host' in nodeRoot ? (nodeRoot as ShadowRoot) : undefined;
    const current = bindingRef.current;
    if (current?.document === targetDocument && current?.root === targetRoot) return;

    if (current) {
      current.document.removeEventListener('pointerdown', current.listener, true);
      current.root?.removeEventListener('pointerdown', current.rootListener!, true);
    }
    bindingRef.current = undefined;
    if (!targetDocument) return;

    const shadowResults = new WeakMap<Event, boolean>();
    const invokeOutside = (event: PointerEvent) => {
      try {
        callbackRef.current(event);
      } catch (error) {
        notifyHookError(error, onErrorRef.current);
        throw error;
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      const currentElement = targetRef.current.current;
      if (
        !currentElement ||
        currentElement.ownerDocument !== targetDocument ||
        eventOccurredInside(event, currentElement)
      ) {
        return;
      }

      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (targetRoot && path.includes(targetRoot.host)) {
        // A closed shadow root hides its internal path from document listeners.
        // Wait until the root listener records whether the real target was inside.
        queueMicrotask(() => {
          if (
            bindingRef.current?.listener === handlePointerDown &&
            shadowResults.get(event) !== true
          ) {
            invokeOutside(event);
          }
        });
      } else {
        invokeOutside(event);
      }
    };
    const handleRootPointerDown: EventListener | undefined = targetRoot
      ? (event) => {
          const pointerEvent = event as PointerEvent;
          const currentElement = targetRef.current.current;
          const inside = Boolean(
            currentElement && eventOccurredInside(pointerEvent, currentElement),
          );
          shadowResults.set(event, inside);
          if (!event.composed && !inside) invokeOutside(pointerEvent);
        }
      : undefined;
    let documentAdded = false;
    let rootAdded = false;
    try {
      targetDocument.addEventListener('pointerdown', handlePointerDown, true);
      documentAdded = true;
      if (targetRoot) {
        targetRoot.addEventListener('pointerdown', handleRootPointerDown!, true);
        rootAdded = true;
      }
    } catch (error) {
      if (rootAdded) {
        try {
          targetRoot?.removeEventListener('pointerdown', handleRootPointerDown!, true);
        } catch {
          // Preserve the registration error while still attempting document cleanup.
        }
      }
      if (documentAdded) {
        try {
          targetDocument.removeEventListener('pointerdown', handlePointerDown, true);
        } catch {
          // Cleanup is best effort for hostile custom EventTarget implementations.
        }
      }
      notifyHookError(error, onErrorRef.current);
      throw error;
    }
    bindingRef.current = {
      document: targetDocument,
      root: targetRoot,
      listener: handlePointerDown,
      rootListener: handleRootPointerDown,
    };
  });

  useEffect(
    () => () => {
      const binding = bindingRef.current;
      if (binding) {
        binding.document.removeEventListener('pointerdown', binding.listener, true);
        binding.root?.removeEventListener('pointerdown', binding.rootListener!, true);
      }
      bindingRef.current = undefined;
    },
    [],
  );
}
