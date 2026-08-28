'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

/** An initial Map value or a lazy iterable initializer. @public */
export type MapInitializer<K, V> = Iterable<readonly [K, V]> | (() => Iterable<readonly [K, V]>);

/** Stable actions returned by {@link useMap}. @public */
export interface UseMapActions<K, V> {
  /** Sets one key to a value. */
  readonly set: (key: K, value: V) => void;
  /** Replaces all entries with a new iterable. */
  readonly setAll: (entries: Iterable<readonly [K, V]>) => void;
  /** Removes one key when it exists. */
  readonly remove: (key: K) => void;
  /** Removes every entry. */
  readonly clear: () => void;
  /** Restores the first captured entries. */
  readonly reset: () => void;
}

/** A readonly Map snapshot and stable actions returned by {@link useMap}. @public */
export type UseMapResult<K, V> = readonly [ReadonlyMap<K, V>, UseMapActions<K, V>];

function resolveInitialMap<K, V>(initialValue: MapInitializer<K, V> | undefined): Map<K, V> {
  const source = typeof initialValue === 'function' ? initialValue() : initialValue;
  return source === undefined ? new Map<K, V>() : new Map(source);
}

function sameMap<K, V>(left: ReadonlyMap<K, V>, right: ReadonlyMap<K, V>): boolean {
  if (left.size !== right.size) return false;
  const rightEntries = [...right.entries()];
  let index = 0;
  for (const [key, value] of left) {
    const entry = rightEntries[index];
    if (!entry || !Object.is(entry[0], key) || !Object.is(entry[1], value)) return false;
    index += 1;
  }
  return true;
}

/**
 * Manages an immutable Map snapshot with stable mutation actions.
 *
 * @param initialValue - Entries or a lazy entries initializer captured once.
 * @returns A readonly Map and stable actions.
 * @public
 */
export function useMap<K, V>(initialValue?: MapInitializer<K, V>): UseMapResult<K, V> {
  const initialMapRef = useRef<Map<K, V> | null>(null);
  if (initialMapRef.current === null) initialMapRef.current = resolveInitialMap(initialValue);
  const initialMap = initialMapRef.current;
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialMap));

  const set = useCallback((key: K, value: V) => {
    setMap((previous) => {
      if (previous.has(key) && Object.is(previous.get(key), value)) return previous;
      const next = new Map(previous);
      next.set(key, value);
      return next;
    });
  }, []);

  const setAll = useCallback((entries: Iterable<readonly [K, V]>) => {
    const next = new Map(entries);
    setMap((previous) => (sameMap(previous, next) ? previous : next));
  }, []);

  const remove = useCallback((key: K) => {
    setMap((previous) => {
      if (!previous.has(key)) return previous;
      const next = new Map(previous);
      next.delete(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setMap((previous) => (previous.size === 0 ? previous : new Map()));
  }, []);

  const reset = useCallback(() => {
    const captured = initialMapRef.current;
    if (captured === null) return;
    setMap((previous) => (sameMap(previous, captured) ? previous : new Map(captured)));
  }, []);

  const actions = useMemo<UseMapActions<K, V>>(
    () => ({ clear, remove, reset, set, setAll }),
    [clear, remove, reset, set, setAll],
  );

  return [map, actions];
}
