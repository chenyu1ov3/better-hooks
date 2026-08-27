'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';

/** Controls the deterministic value used when matchMedia is unavailable. @public */
export interface MediaQueryOptions {
  /** The value returned during SSR or when matchMedia is unavailable. */
  readonly defaultMatches?: boolean;
  /** Observes browser API failures after the client subscription is attempted. */
  readonly onError?: HookErrorHandler;
}

interface QueryEntry {
  readonly list: MediaQueryList;
  readonly listeners: Set<() => void>;
  readonly notify: () => void;
  listening: boolean;
}

interface QueryBinding {
  readonly owner: Window | undefined;
  readonly query: string;
  readonly list: MediaQueryList | undefined;
  entry: QueryEntry | undefined;
}

const entriesByWindow = new WeakMap<Window, Map<string, QueryEntry>>();

function createBinding(query: string): QueryBinding {
  const owner = typeof window === 'undefined' ? undefined : window;
  let list: MediaQueryList | undefined;
  try {
    list = typeof owner?.matchMedia === 'function' ? owner.matchMedia(query) : undefined;
  } catch {
    list = undefined;
  }
  return { owner, query, list, entry: undefined };
}

function getEntries(targetWindow: Window): Map<string, QueryEntry> {
  let entries = entriesByWindow.get(targetWindow);
  if (!entries) {
    entries = new Map<string, QueryEntry>();
    entriesByWindow.set(targetWindow, entries);
  }
  return entries;
}

function addMediaListener(list: MediaQueryList, notify: () => void): boolean {
  if (typeof list.addEventListener === 'function') {
    list.addEventListener('change', notify);
    return true;
  }
  if (typeof list.addListener === 'function') {
    list.addListener(notify);
    return true;
  }
  return false;
}

function removeMediaListener(list: MediaQueryList, notify: () => void): void {
  if (typeof list.removeEventListener === 'function') list.removeEventListener('change', notify);
  else if (typeof list.removeListener === 'function') list.removeListener(notify);
}

function createEntry(list: MediaQueryList): QueryEntry {
  const listeners = new Set<() => void>();
  return {
    list,
    listeners,
    notify: () => [...listeners].forEach((subscriber) => subscriber()),
    listening: false,
  };
}

function subscribeToQuery(
  binding: QueryBinding,
  listener: () => void,
  onError: HookErrorHandler | undefined,
): () => void {
  const owner = binding.owner;
  if (!owner || typeof owner.matchMedia !== 'function') return () => undefined;

  const entries = getEntries(owner);
  let entry = entries.get(binding.query);
  if (!entry) {
    let list = binding.list;
    if (!list) {
      try {
        list = owner.matchMedia(binding.query);
      } catch (error) {
        notifyHookError(error, onError);
        return () => undefined;
      }
    }
    entry = createEntry(list);
    entries.set(binding.query, entry);
  }

  binding.entry = entry;
  const firstSubscriber = entry.listeners.size === 0;
  entry.listeners.add(listener);
  if (firstSubscriber && !entry.listening) {
    try {
      entry.listening = addMediaListener(entry.list, entry.notify);
    } catch (error) {
      entry.listeners.delete(listener);
      binding.entry = undefined;
      entries.delete(binding.query);

      let cleanupError: unknown;
      try {
        removeMediaListener(entry.list, entry.notify);
      } catch (caught) {
        cleanupError = caught;
      }
      notifyHookError(error, onError);
      if (cleanupError !== undefined) notifyHookError(cleanupError, onError);
      throw error;
    }
  }

  return () => {
    const current = entries.get(binding.query);
    if (!current) return;
    current.listeners.delete(listener);
    binding.entry = undefined;
    if (current.listeners.size > 0) return;

    let cleanupError: unknown;
    try {
      if (current.listening) removeMediaListener(current.list, current.notify);
    } catch (error) {
      cleanupError = error;
    } finally {
      current.listening = false;
      entries.delete(binding.query);
    }
    if (cleanupError !== undefined) {
      notifyHookError(cleanupError, onError);
      throw cleanupError;
    }
  };
}

/**
 * Subscribes to a CSS media query, sharing one native listener per query and
 * browser realm. `defaultMatches` is used when rendering without matchMedia.
 * @public
 */
export function useMediaQuery(query: string, options: MediaQueryOptions = {}): boolean {
  const binding = useMemo(() => createBinding(query), [query]);
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToQuery(binding, onChange, options.onError),
    [binding, options.onError],
  );
  const getSnapshot = useCallback(() => {
    try {
      return (
        binding.entry?.list.matches ?? binding.list?.matches ?? options.defaultMatches ?? false
      );
    } catch {
      return options.defaultMatches ?? false;
    }
  }, [binding, options.defaultMatches]);
  const getServerSnapshot = useCallback(
    () => options.defaultMatches ?? false,
    [options.defaultMatches],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
