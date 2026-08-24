'use client';

import { useCallback, useSyncExternalStore } from 'react';
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

const entriesByWindow = new WeakMap<Window, Map<string, QueryEntry>>();

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

function getQueryEntry(targetWindow: Window, query: string): QueryEntry {
  const entries = getEntries(targetWindow);
  const existing = entries.get(query);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  const entry: QueryEntry = {
    list: targetWindow.matchMedia(query),
    listeners,
    notify: () => [...listeners].forEach((subscriber) => subscriber()),
    listening: false,
  };
  entries.set(query, entry);
  return entry;
}

function subscribeToQuery(
  query: string,
  listener: () => void,
  onError: HookErrorHandler | undefined,
): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined;
  }

  let entries: Map<string, QueryEntry>;
  let entry: QueryEntry;
  try {
    entries = getEntries(window);
    entry = getQueryEntry(window, query);
  } catch (error) {
    notifyHookError(error, onError);
    return () => undefined;
  }
  if (entry.listeners.size === 0 && !entry.listening) {
    entry.listening = addMediaListener(entry.list, entry.notify);
  }
  entry.listeners.add(listener);

  return () => {
    const current = entries.get(query);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      if (current.listening) removeMediaListener(current.list, current.notify);
      current.listening = false;
      entries.delete(query);
    }
  };
}

/**
 * Subscribes to a CSS media query, sharing one native listener per query and
 * browser realm. `defaultMatches` is used when rendering without matchMedia.
 * @public
 */
export function useMediaQuery(query: string, options: MediaQueryOptions = {}): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToQuery(query, onChange, options.onError),
    [options.onError, query],
  );
  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return options.defaultMatches ?? false;
    try {
      return getQueryEntry(window, query).list.matches;
    } catch {
      return options.defaultMatches ?? false;
    }
  }, [options.defaultMatches, query]);
  const getServerSnapshot = useCallback(
    () => options.defaultMatches ?? false,
    [options.defaultMatches],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
