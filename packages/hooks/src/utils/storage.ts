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

interface RawStorageSnapshot {
  readonly raw: string | null;
  readonly error: unknown;
  readonly revision: number;
}

interface StorageAddress {
  readonly id: string;
  readonly kind: StorageKind;
  readonly key: string;
  readonly owner: Window | undefined;
}

interface StorageChannel extends StorageAddress {
  snapshot: RawStorageSnapshot;
  readonly listeners: Set<() => void>;
  stop: (() => void) | undefined;
}

interface StorageBinding<T> extends StorageAddress {
  readonly initialSnapshot: RawStorageSnapshot;
  channel: StorageChannel | undefined;
  state: StorageState<T>;
  projectedSnapshot: RawStorageSnapshot | undefined;
  decoder: ((value: string) => T) | undefined;
  decodeFailed: boolean;
  listener: (() => void) | undefined;
}

const registries = new WeakMap<Window, Map<string, StorageChannel>>();

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

function getStorage(address: StorageAddress): Storage | undefined {
  const target = address.owner;
  if (!target) return undefined;
  return address.kind === 'local' ? target.localStorage : target.sessionStorage;
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

function readInitialSnapshot(address: StorageAddress): RawStorageSnapshot {
  try {
    return {
      raw: getStorage(address)?.getItem(address.key) ?? null,
      error: undefined,
      revision: 0,
    };
  } catch (error) {
    return { raw: null, error, revision: 0 };
  }
}

function createBinding<T>(kind: StorageKind, key: string, initial: T): StorageBinding<T> {
  const owner = typeof window === 'undefined' ? undefined : window;
  const address: StorageAddress = { id: `${kind}:${key}`, kind, key, owner };
  const initialSnapshot = readInitialSnapshot(address);
  return {
    ...address,
    initialSnapshot,
    channel: undefined,
    state: { value: initial, error: initialSnapshot.error },
    projectedSnapshot: undefined,
    decoder: undefined,
    decodeFailed: false,
    listener: undefined,
  };
}

function createChannel<T>(binding: StorageBinding<T>): StorageChannel {
  return {
    id: binding.id,
    kind: binding.kind,
    key: binding.key,
    owner: binding.owner,
    snapshot: binding.initialSnapshot,
    listeners: new Set(),
    stop: undefined,
  };
}

function updateChannel(
  channel: StorageChannel,
  raw: string | null,
  error: unknown,
  force = false,
): boolean {
  const current = channel.snapshot;
  if (!force && current.raw === raw && sameError(current.error, error)) return false;
  channel.snapshot = { raw, error, revision: current.revision + 1 };
  return true;
}

function emit(channel: StorageChannel, except?: () => void): void {
  for (const listener of channel.listeners) if (listener !== except) listener();
}

function failChannel(channel: StorageChannel, error: unknown): void {
  if (updateChannel(channel, channel.snapshot.raw, error)) emit(channel);
}

function readChannel(channel: StorageChannel, force = false): boolean {
  try {
    const raw = getStorage(channel)?.getItem(channel.key) ?? null;
    return updateChannel(channel, raw, undefined, force);
  } catch (error) {
    return updateChannel(channel, channel.snapshot.raw, error);
  }
}

function listen(channel: StorageChannel): boolean {
  const owner = channel.owner;
  if (!owner || channel.stop) return true;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== channel.key) return;

    if (event.storageArea !== null) {
      try {
        if (event.storageArea !== getStorage(channel)) return;
      } catch (error) {
        failChannel(channel, error);
        return;
      }
    }

    if (readChannel(channel, true)) emit(channel);
  };

  try {
    owner.addEventListener('storage', onStorage);
    channel.stop = () => owner.removeEventListener('storage', onStorage);
    return true;
  } catch (error) {
    failChannel(channel, error);
    return false;
  }
}

function acquireChannel<T>(binding: StorageBinding<T>): StorageChannel {
  const owner = binding.owner;
  if (!owner) {
    const channel = binding.channel ?? createChannel(binding);
    binding.channel = channel;
    return channel;
  }

  let registry = registries.get(owner);
  if (!registry) {
    registry = new Map();
    registries.set(owner, registry);
  }

  const registered = registry.get(binding.id);
  if (registered) {
    binding.channel = registered;
    return registered;
  }

  const channel = binding.channel ?? createChannel(binding);
  readChannel(channel);
  registry.set(binding.id, channel);
  binding.channel = channel;
  return channel;
}

function releaseChannel(channel: StorageChannel): void {
  if (channel.listeners.size > 0) return;

  const stop = channel.stop;
  channel.stop = undefined;
  try {
    stop?.();
  } finally {
    const registry = channel.owner && registries.get(channel.owner);
    if (registry?.get(channel.id) === channel) registry.delete(channel.id);
  }
}

function currentChannel<T>(binding: StorageBinding<T>): StorageChannel {
  const registered = binding.owner && registries.get(binding.owner)?.get(binding.id);
  if (registered) binding.channel = registered;
  if (binding.channel) return binding.channel;

  const channel = createChannel(binding);
  binding.channel = channel;
  return channel;
}

function updateBinding<T>(binding: StorageBinding<T>, value: T, error: unknown): boolean {
  if (Object.is(binding.state.value, value) && sameError(binding.state.error, error)) return false;
  binding.state = { value, error };
  return true;
}

function project<T>(binding: StorageBinding<T>, config: StorageConfig<T>): StorageState<T> {
  const snapshot = binding.channel?.snapshot ?? binding.initialSnapshot;
  const decoderChanged = binding.decoder !== config.deserialize;
  if (binding.projectedSnapshot === snapshot) {
    if (!decoderChanged || !binding.decodeFailed) {
      if (decoderChanged) binding.decoder = config.deserialize;
      return binding.state;
    }
  }

  binding.projectedSnapshot = snapshot;
  binding.decoder = config.deserialize;
  binding.decodeFailed = false;

  if (snapshot.error !== undefined) {
    updateBinding(binding, binding.state.value, snapshot.error);
    return binding.state;
  }
  if (snapshot.raw === null) {
    updateBinding(binding, config.initial, undefined);
    return binding.state;
  }

  try {
    updateBinding(binding, config.deserialize(snapshot.raw), undefined);
  } catch (error) {
    binding.decodeFailed = true;
    updateBinding(binding, binding.state.value, error);
  }
  return binding.state;
}

function setProjectedValue<T>(
  binding: StorageBinding<T>,
  channel: StorageChannel,
  config: StorageConfig<T>,
  value: T,
): void {
  binding.projectedSnapshot = channel.snapshot;
  binding.decoder = config.deserialize;
  binding.decodeFailed = false;
  updateBinding(binding, value, undefined);
}

function setBindingError<T>(binding: StorageBinding<T>, error: unknown): void {
  binding.projectedSnapshot = binding.channel?.snapshot ?? binding.initialSnapshot;
  binding.decodeFailed = false;
  if (updateBinding(binding, binding.state.value, error)) binding.listener?.();
}

function writeChannel(channel: StorageChannel, raw: string | null): boolean {
  try {
    const storage = getStorage(channel);
    if (raw === null) storage?.removeItem(channel.key);
    else storage?.setItem(channel.key, raw);
  } catch (error) {
    failChannel(channel, error);
    return false;
  }

  updateChannel(channel, raw, undefined, true);
  return true;
}

function useBrowserStorage<T>(
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
  const binding = useMemo(() => createBinding(kind, key, initial), [initial, key, kind]);

  const subscribe = useCallback(
    (listener: () => void) => {
      const channel = acquireChannel(binding);
      binding.listener = listener;
      channel.listeners.add(listener);
      if (listen(channel) && readChannel(channel)) emit(channel, listener);

      return () => {
        if (binding.listener === listener) binding.listener = undefined;
        channel.listeners.delete(listener);
        releaseChannel(channel);
      };
    },
    [binding],
  );

  const getSnapshot = useCallback(() => project(binding, config), [binding, config]);
  const serverSnapshot = useMemo<StorageState<T>>(
    () => ({ value: initial, error: undefined }),
    [initial],
  );
  const state = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  const setValue = useCallback(
    (next: SetStateAction<T>) => {
      const channel = currentChannel(binding);
      const current = project(binding, config);
      const resolved = typeof next === 'function' ? (next as (value: T) => T)(current.value) : next;
      let raw: string;
      try {
        raw = serialize(resolved);
      } catch (error) {
        setBindingError(binding, error);
        return;
      }
      if (!writeChannel(channel, raw)) return;

      setProjectedValue(binding, channel, config, resolved);
      emit(channel);
    },
    [binding, config, serialize],
  );

  const remove = useCallback(() => {
    const channel = currentChannel(binding);
    if (!writeChannel(channel, null)) return;

    setProjectedValue(binding, channel, config, config.initial);
    emit(channel);
  }, [binding, config]);

  return { value: state.value, error: state.error, setValue, remove } as const;
}

/** Syncs a value with localStorage. @public */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: StorageOptions<T>,
): UseStorageResult<T> {
  return useBrowserStorage('local', key, initialValue, options);
}

/** Syncs a value with sessionStorage. @public */
export function useSessionStorage<T>(
  key: string,
  initialValue: T | (() => T),
  options?: StorageOptions<T>,
): UseStorageResult<T> {
  return useBrowserStorage('session', key, initialValue, options);
}
