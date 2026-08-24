'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** A ref-like document target accepted by {@link useDocumentVisibility}. @public */
export type DocumentVisibilityRef = { readonly current: Document | null };

/** A document, ref-like target, lazy target, or an empty target. @public */
export type DocumentVisibilityTarget =
  | Document
  | DocumentVisibilityRef
  | (() => Document | null | undefined)
  | null
  | undefined;

/** The visibility values exposed by the browser (plus the legacy prerender value). @public */
export type VisibilityState = DocumentVisibilityState | 'prerender';

/** Options for {@link useDocumentVisibility}. @public */
export interface UseDocumentVisibilityOptions {
  /** The document to observe. Defaults to the ambient document in a browser. */
  readonly target?: DocumentVisibilityTarget;
  /** Alias for `target`, useful when passing a React ref. */
  readonly ref?: DocumentVisibilityTarget;
  /** Disables the subscription and returns `visible` while false. */
  readonly enabled?: boolean;
  /** Whether the native visibility listener is registered during capture. */
  readonly capture?: boolean;
}

interface VisibilityStore {
  snapshot: VisibilityState;
  readonly listeners: Set<() => void>;
  readonly notify: () => void;
  listening: boolean;
}

const serverSnapshot: VisibilityState = 'visible';
const stores = new WeakMap<Document, Map<boolean, VisibilityStore>>();

function isEventTarget(value: unknown): value is Document {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return (
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  );
}

function isRefTarget(value: unknown): value is DocumentVisibilityRef {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return 'current' in value;
}

function isOptions(value: unknown): value is UseDocumentVisibilityOptions {
  return (
    typeof value === 'object' && value !== null && !isEventTarget(value) && !isRefTarget(value)
  );
}

function resolveDocument(target: DocumentVisibilityTarget): Document | undefined {
  if (target === undefined) {
    return typeof document === 'undefined' ? undefined : document;
  }
  if (target === null) return undefined;
  if (typeof target === 'function') {
    try {
      return resolveDocument(target());
    } catch {
      return undefined;
    }
  }
  if (isEventTarget(target)) return target;
  if (isRefTarget(target)) return resolveDocument(target.current);
  return undefined;
}

function readVisibility(target: Document): VisibilityState {
  try {
    const value = (target as Document & { readonly visibilityState?: unknown }).visibilityState;
    return value === 'hidden' || value === 'visible' || value === 'prerender'
      ? value
      : serverSnapshot;
  } catch {
    return serverSnapshot;
  }
}

function getStore(target: Document, capture: boolean): VisibilityStore {
  let byCapture = stores.get(target);
  if (!byCapture) {
    byCapture = new Map<boolean, VisibilityStore>();
    stores.set(target, byCapture);
  }
  const existing = byCapture.get(capture);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  const store: VisibilityStore = {
    snapshot: readVisibility(target),
    listeners,
    listening: false,
    notify: () => {
      const next = readVisibility(target);
      if (next === store.snapshot) return;
      store.snapshot = next;
      [...listeners].forEach((listener) => listener());
    },
  };
  byCapture.set(capture, store);
  return store;
}

function subscribeToVisibility(
  target: Document | undefined,
  capture: boolean,
  listener: () => void,
): () => void {
  if (!target) return () => undefined;

  const store = getStore(target, capture);
  if (store.listeners.size === 0 && !store.listening) {
    try {
      target.addEventListener('visibilitychange', store.notify, capture);
      store.listening = true;
    } catch {
      // A hostile or partially mocked document should behave like SSR.
      return () => undefined;
    }
  }
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
    if (store.listeners.size > 0) return;
    if (store.listening) {
      try {
        target.removeEventListener('visibilitychange', store.notify, capture);
      } catch {
        // Cleanup must remain best-effort for custom EventTarget implementations.
      }
    }
    store.listening = false;
    const byCapture = stores.get(target);
    if (byCapture?.get(capture) === store) {
      byCapture.delete(capture);
      if (byCapture.size === 0) stores.delete(target);
    }
  };
}

/**
 * Returns the current document visibility and shares one native subscription
 * for each document/capture pair. Server rendering and unavailable documents
 * deterministically return `visible`.
 *
 * @public
 */
export function useDocumentVisibility(): VisibilityState;
/** @public */
export function useDocumentVisibility(options: UseDocumentVisibilityOptions): VisibilityState;
/** @public */
export function useDocumentVisibility(
  target: DocumentVisibilityTarget,
  options?: Omit<UseDocumentVisibilityOptions, 'target' | 'ref'>,
): VisibilityState;
export function useDocumentVisibility(
  targetOrOptions?: DocumentVisibilityTarget | UseDocumentVisibilityOptions,
  extraOptions?: Omit<UseDocumentVisibilityOptions, 'target' | 'ref'>,
): VisibilityState {
  const optionObject = isOptions(targetOrOptions) ? targetOrOptions : undefined;
  const options = optionObject ?? extraOptions ?? {};
  const requestedTarget = optionObject
    ? (optionObject.target ?? optionObject.ref)
    : (targetOrOptions as DocumentVisibilityTarget | undefined);
  // Resolve once for subscription identity; callbacks resolve again after
  // commit so a ref that starts null can attach to its mounted document.
  const resolvedTarget = resolveDocument(requestedTarget);
  const enabled = options.enabled !== false;
  const capture = options.capture ?? false;

  const subscribe = useCallback(
    (listener: () => void) =>
      enabled
        ? subscribeToVisibility(
            resolvedTarget ?? resolveDocument(requestedTarget),
            capture,
            listener,
          )
        : () => undefined,
    [capture, enabled, requestedTarget, resolvedTarget],
  );
  const getSnapshot = useCallback(() => {
    const target = resolvedTarget ?? resolveDocument(requestedTarget);
    if (!enabled || !target) return serverSnapshot;
    const store = getStore(target, capture);
    const next = readVisibility(target);
    if (next !== store.snapshot) store.snapshot = next;
    return store.snapshot;
  }, [capture, enabled, requestedTarget, resolvedTarget]);

  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}
