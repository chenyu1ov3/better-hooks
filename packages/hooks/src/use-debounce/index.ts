'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeDelay } from '../utils/timing.js';

/** @public */
export interface DebounceOptions {
  readonly delay: number;
  readonly leading?: boolean;
  readonly trailing?: boolean;
  readonly maxWait?: number;
}

interface TimingOptions {
  readonly delay: number;
  readonly leading: boolean;
  readonly trailing: boolean;
  readonly maxWait: number | undefined;
}

function getTiming(options: DebounceOptions): TimingOptions {
  return {
    delay: normalizeDelay(options.delay),
    leading: options.leading ?? false,
    trailing: options.trailing ?? true,
    maxWait: options.maxWait === undefined ? undefined : normalizeDelay(options.maxWait),
  };
}

/**
 * Returns a value after updates have settled for `delay` milliseconds.
 * Leading, trailing, and maximum-wait publication can be configured per cycle.
 * @public
 */
export function useDebounce<T>(value: T, options: DebounceOptions): T {
  const timing = getTiming(options);
  const [debounced, setDebounced] = useState(value);
  const valueRef = useRef(value);
  const optionsRef = useRef(timing);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    const previous = optionsRef.current;
    const optionsChanged =
      !Object.is(previous.delay, timing.delay) ||
      previous.leading !== timing.leading ||
      previous.trailing !== timing.trailing ||
      !Object.is(previous.maxWait, timing.maxWait);
    const valueChanged = !Object.is(valueRef.current, value);
    if (!optionsChanged && !valueChanged) return;

    const clearTimers = (): void => {
      if (waitTimerRef.current !== undefined) clearTimeout(waitTimerRef.current);
      if (maxTimerRef.current !== undefined) clearTimeout(maxTimerRef.current);
      waitTimerRef.current = undefined;
      maxTimerRef.current = undefined;
    };
    const finish = (): void => {
      clearTimers();
      activeRef.current = false;
      if (!pendingRef.current) return;
      pendingRef.current = false;
      setDebounced(valueRef.current);
    };

    optionsRef.current = {
      delay: timing.delay,
      leading: timing.leading,
      maxWait: timing.maxWait,
      trailing: timing.trailing,
    };
    let restartMaxWait = false;
    if (optionsChanged && activeRef.current) {
      clearTimers();
      if (!timing.trailing) pendingRef.current = false;
      restartMaxWait = true;
    }

    if (valueChanged) {
      valueRef.current = value;
      if (!activeRef.current) {
        activeRef.current = true;
        restartMaxWait = true;
        if (timing.leading) setDebounced(value);
        pendingRef.current = !timing.leading && timing.trailing;
      } else {
        pendingRef.current = timing.trailing;
      }
    }

    if (!activeRef.current) return;
    if (waitTimerRef.current !== undefined) clearTimeout(waitTimerRef.current);
    waitTimerRef.current = setTimeout(finish, timing.delay);
    if (restartMaxWait && timing.maxWait !== undefined) {
      maxTimerRef.current = setTimeout(finish, timing.maxWait);
    }
  }, [timing.delay, timing.leading, timing.maxWait, timing.trailing, value]);

  useEffect(
    () => () => {
      if (waitTimerRef.current !== undefined) clearTimeout(waitTimerRef.current);
      if (maxTimerRef.current !== undefined) clearTimeout(maxTimerRef.current);
      activeRef.current = false;
      pendingRef.current = false;
    },
    [],
  );

  return debounced;
}
