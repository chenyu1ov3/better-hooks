'use client';

import { useSyncExternalStore } from 'react';

/** A viewport-size snapshot in CSS pixels. @public */
export interface WindowSize {
  readonly width: number;
  readonly height: number;
}

const serverSnapshot: WindowSize = { width: 0, height: 0 };
interface WindowSizeStore {
  snapshot: WindowSize;
  readonly listeners: Set<() => void>;
  readonly onResize: () => void;
}

const stores = new WeakMap<Window, WindowSizeStore>();

function getServerSnapshot(): WindowSize {
  return serverSnapshot;
}

function readSize(targetWindow: Window): WindowSize {
  try {
    const width = targetWindow.innerWidth;
    const height = targetWindow.innerHeight;
    return {
      width: Number.isFinite(width) && width >= 0 ? width : 0,
      height: Number.isFinite(height) && height >= 0 ? height : 0,
    };
  } catch {
    return serverSnapshot;
  }
}

function updateSnapshot(store: WindowSizeStore, targetWindow: Window): boolean {
  const next = readSize(targetWindow);
  if (next.width === store.snapshot.width && next.height === store.snapshot.height) return false;
  store.snapshot = next;
  return true;
}

function getStore(targetWindow: Window): WindowSizeStore {
  const existing = stores.get(targetWindow);
  if (existing) return existing;

  const listeners = new Set<() => void>();
  const store: WindowSizeStore = {
    snapshot: readSize(targetWindow),
    listeners,
    onResize: () => {
      if (!updateSnapshot(store, targetWindow)) return;
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
  updateSnapshot(store, targetWindow);
  if (store.listeners.size === 0) targetWindow.addEventListener('resize', store.onResize);
  store.listeners.add(listener);

  return () => {
    store.listeners.delete(listener);
    if (store.listeners.size === 0) targetWindow.removeEventListener('resize', store.onResize);
  };
}

function getSnapshot(): WindowSize {
  if (typeof window === 'undefined') return serverSnapshot;
  const store = getStore(window);
  updateSnapshot(store, window);
  return store.snapshot;
}

/**
 * Returns a referentially stable viewport-size snapshot and shares one resize
 * listener between subscribers in the same browser realm.
 * @public
 */
export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
