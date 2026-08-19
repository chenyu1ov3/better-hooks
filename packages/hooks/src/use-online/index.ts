'use client';

import { useSyncExternalStore } from 'react';

interface OnlineStore {
  snapshot: boolean;
  readonly listeners: Set<() => void>;
  readonly notify: () => void;
}

const stores = new WeakMap<Window, OnlineStore>();

function getServerSnapshot(): boolean {
  return true;
}

function readOnline(targetWindow: Window): boolean {
  try {
    return targetWindow.navigator.onLine !== false;
  } catch {
    return true;
  }
}

function getStore(targetWindow: Window): OnlineStore {
  const existing = stores.get(targetWindow);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  const store: OnlineStore = {
    snapshot: readOnline(targetWindow),
    listeners,
    notify: () => {
      const next = readOnline(targetWindow);
      if (next === store.snapshot) return;
      store.snapshot = next;
      [...listeners].forEach((listener) => listener());
    },
  };
  stores.set(targetWindow, store);
  return store;
}

function subscribe(listener: () => void): () => void {
  if (typeof window === 'undefined') return getServerSnapshot;
  const targetWindow = window;
  const store = getStore(targetWindow);
  if (store.listeners.size === 0) {
    targetWindow.addEventListener('online', store.notify);
    targetWindow.addEventListener('offline', store.notify);
  }
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
    if (store.listeners.size > 0) return;
    targetWindow.removeEventListener('online', store.notify);
    targetWindow.removeEventListener('offline', store.notify);
    stores.delete(targetWindow);
  };
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return true;
  const store = getStore(window);
  store.snapshot = readOnline(window);
  return store.snapshot;
}

/**
 * Tracks browser connectivity with one native online/offline listener pair per
 * browser realm. SSR and inaccessible navigator objects default to online.
 * @public
 */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
