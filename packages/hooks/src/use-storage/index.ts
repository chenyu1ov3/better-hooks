'use client';

import { useCallback, useMemo, useState, useSyncExternalStore, type SetStateAction } from 'react';

type StorageKind = 'local' | 'session';

/** Serialization controls for a browser-storage value. @public */
export interface StorageOptions<T> {
  /** Converts a value into the string written to Storage. */
  readonly serialize?: (value: T) => string;
  /** Converts a stored string back into a value. */
  readonly deserialize?: (value: string) => T;
}

/** The current value and the most recent storage or codec failure. @public */
export interface StorageState<T> {
  readonly value: T;
  readonly error: unknown;
}

/** State and stable actions returned by a storage Hook. @public */
export interface UseStorageResult<T> extends StorageState<T> {
  readonly setValue: (next: SetStateAction<T>) => void;
  readonly remove: () => void;
}

interface StorageConfig<T> {
  readonly initial: T;
  readonly deserialize: (value: string) => T;
}

interface Store<T> {
  readonly id: string;
  readonly kind: StorageKind;
  readonly key: string;
  readonly owner: Window | undefined;
  state: StorageState<T>;
  raw: string | null;
  decoder: ((value: string) => T) | false | undefined;
  readonly listeners: Map<() => void, StorageConfig<T>>;
  stop: (() => void) | undefined;
}

const registries = new WeakMap<Window, Map<string, Store<unknown>>>();

function stringify<T>(value: T): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new TypeError('The storage value is not JSON serializable.');
  }
  return serialized;
}

function parseJSON<T>(value: string): T {
  return JSON.parse(value) as T;
}

function createStore<T>(kind: StorageKind, key: string, initial: T, owner?: Window): Store<T> {
  return {
    id: `${kind}:${key}`,
    kind,
    key,
    owner,
    state: { value: initial, error: undefined },
    raw: null,
    decoder: undefined,
    listeners: new Map(),
    stop: undefined,
  };
}

function getStore<T>(kind: StorageKind, key: string, initial: T): Store<T> {
  if (typeof window === 'undefined') return createStore(kind, key, initial);

  let registry = registries.get(window);
  if (!registry) {
    registry = new Map();
    registries.set(window, registry);
  }

  const id = `${kind}:${key}`;
  const existing = registry.get(id);
  if (existing) return existing as Store<T>;

  const created = createStore(kind, key, initial, window);
  registry.set(id, created as Store<unknown>);
  return created;
}

function getStorage(store: Store<unknown>): Storage | undefined {
  const target = store.owner;
  if (!target) return undefined;
  return store.kind === 'local' ? target.localStorage : target.sessionStorage;
}

function sameError(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  return (
    left instanceof Error &&
    right instanceof Error &&
    left.name === right.name &&
    left.message === right.message
  );
}

function update<T>(store: Store<T>, value: T, error: unknown): boolean {
  if (Object.is(store.state.value, value) && sameError(store.state.error, error)) return false;
  store.state = { value, error };
  return true;
}

function read<T>(store: Store<T>, config: StorageConfig<T>, retryDecode = false): boolean {
  let storage: Storage | undefined;
  let raw: string | null;
  try {
    storage = getStorage(store);
    raw = storage ? storage.getItem(store.key) : null;
  } catch (error) {
    store.decoder = false;
    return update(store, store.state.value, error);
  }

  if (!storage) {
    store.decoder = config.deserialize;
    return update(store, store.state.value, undefined);
  }
  if (raw === store.raw && !retryDecode) {
    if (store.decoder === config.deserialize) return false;
    // A fresh inline decoder is semantically unchanged after a successful
    // decode. Retry identity changes only while recovering from an error.
    if (store.state.error === undefined) {
      store.decoder = config.deserialize;
      return false;
    }
  }

  store.raw = raw;
  store.decoder = config.deserialize;
  if (raw === null) return update(store, config.initial, undefined);

  try {
    return update(store, config.deserialize(raw), undefined);
  } catch (error) {
    return update(store, store.state.value, error);
  }
}

function emit<T>(store: Store<T>, except?: () => void): void {
  for (const listener of store.listeners.keys()) if (listener !== except) listener();
}

function active<T>(store: Store<T>): StorageConfig<T> | undefined {
  return store.listeners.values().next().value;
}

function fail<T>(store: Store<T>, error: unknown): void {
  if (update(store, store.state.value, error)) emit(store);
}

function listen<T>(store: Store<T>): void {
  const owner = store.owner;
  if (!owner || store.stop) return;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== store.key) return;
    const config = active(store);
    if (!config) return;

    if (event.storageArea !== null) {
      try {
        if (event.storageArea !== getStorage(store)) return;
      } catch (error) {
        fail(store, error);
        return;
      }
    }

    if (read(store, config, true)) emit(store);
  };

  owner.addEventListener('storage', onStorage);
  store.stop = () => owner.removeEventListener('storage', onStorage);
}

function write<T>(store: Store<T>, raw: string | null): boolean {
  try {
    const storage = getStorage(store);
    if (raw === null) storage?.removeItem(store.key);
    else storage?.setItem(store.key, raw);
    return true;
  } catch (error) {
    fail(store, error);
    return false;
  }
}

function useStorage<T>(
  kind: StorageKind,
  key: string,
  initialValue: T | (() => T),
  options: StorageOptions<T> = {},
): UseStorageResult<T> {
  const [initial] = useState<T>(() =>
    typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue,
  );
  const serialize = options.serialize ?? stringify;
  const deserialize = options.deserialize ?? parseJSON;
  const config = useMemo<StorageConfig<T>>(
    () => ({ initial, deserialize }),
    [deserialize, initial],
  );
  const store = useMemo(() => getStore(kind, key, initial), [initial, key, kind]);

  // Undefined means unread; false records an access failure without confusing
  // it with a valid `null` storage result.
  if (store.decoder === undefined) read(store, config);

  const subscribe = useCallback(
    (listener: () => void) => {
      // Strict Mode replays subscriptions after cleanup. Restore the same store
      // so actions created during the committed render keep a single owner.
      const registry = store.owner && registries.get(store.owner);
      registry?.set(store.id, store as Store<unknown>);
      store.listeners.set(listener, config);
      listen(store);
      if (read(store, config)) emit(store, listener);

      return () => {
        store.listeners.delete(listener);
        const remaining = active(store);
        if (remaining) {
          if (read(store, remaining)) emit(store);
          return;
        }

        store.stop?.();
        store.stop = undefined;
        if (registry?.get(store.id) === store) registry.delete(store.id);
      };
    },
    [config, store],
  );

  const serverSnapshot = useMemo<StorageState<T>>(
    () => ({ value: initial, error: undefined }),
    [initial],
  );
  const state = useSyncExternalStore(
    subscribe,
    () => store.state,
    () => serverSnapshot,
  );

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      const resolved =
        typeof next === 'function' ? (next as (value: T) => T)(store.state.value) : next;
      let raw: string;
      try {
        raw = serialize(resolved);
      } catch (error) {
        fail(store, error);
        return;
      }
      if (!write(store, raw)) return;

      store.raw = raw;
      store.decoder = config.deserialize;
      update(store, resolved, undefined);
      emit(store);
    },
    [config, serialize, store],
  );

  const remove = useCallback(() => {
    if (!write(store, null)) return;

    store.raw = null;
    store.decoder = config.deserialize;
    update(store, config.initial, undefined);
    emit(store);
  }, [config, store]);

  return { value: state.value, error: state.error, setValue, remove } as const;
}

/** Syncs a value with localStorage. @public */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: StorageOptions<T>,
): UseStorageResult<T> {
  return useStorage('local', key, initialValue, options);
}

/** Syncs a value with sessionStorage. @public */
export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: StorageOptions<T>,
): UseStorageResult<T> {
  return useStorage('session', key, initialValue, options);
}
