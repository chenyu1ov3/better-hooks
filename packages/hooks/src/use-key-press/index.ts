'use client';

import { useEffect, useRef } from 'react';
import { notifyHookError, type HookErrorHandler } from '../utils/errors.js';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect/index.js';

/** A scalar key value accepted by {@link useKeyPress}. @public */
export type KeyType = string | number;

/** A key predicate may return a truthy key to expose to the handler. @public */
export type KeyPredicate = (event: KeyboardEvent) => KeyType | boolean | undefined;

/** A key, key-code, list of alternatives, or custom predicate. @public */
export type KeyFilter = KeyType | readonly KeyType[] | KeyPredicate;

/** Native keyboard events supported by {@link useKeyPress}. @public */
export type KeyEvent = 'keydown' | 'keyup' | 'keypress';

/** A direct target, ref-like target, lazy target, or an empty target. @public */
export type KeyPressTarget =
  | EventTarget
  | { readonly current: EventTarget | null }
  | (() => EventTarget | null | undefined)
  | null
  | undefined;

/** The callback invoked for a matching keyboard event. @public */
export type KeyPressHandler = (event: KeyboardEvent, key: KeyType) => void;

/** Options for {@link useKeyPress}. @public */
export interface UseKeyPressOptions {
  /** Native event(s) to observe. Defaults to `keydown`. */
  readonly events?: KeyEvent | readonly KeyEvent[];
  /** Event target; defaults to `window` in a browser. */
  readonly target?: KeyPressTarget;
  /** Alias for `target`, useful when passing a React ref. */
  readonly ref?: KeyPressTarget;
  /** Requires no unlisted modifier keys when true. */
  readonly exactMatch?: boolean;
  /** Whether native listeners use capture. */
  readonly capture?: boolean;
  /** Alias for `capture` when matching an existing event-listener option shape. */
  readonly useCapture?: boolean;
  /** Disables the subscription while false. */
  readonly enabled?: boolean;
  /** Observes predicate or handler failures before the original error escapes. */
  readonly onError?: HookErrorHandler;
}

const modifierAliases: Readonly<Record<string, 'ctrl' | 'shift' | 'alt' | 'meta'>> = {
  alt: 'alt',
  option: 'alt',
  ctrl: 'ctrl',
  control: 'ctrl',
  command: 'meta',
  cmd: 'meta',
  meta: 'meta',
  win: 'meta',
  windows: 'meta',
  shift: 'shift',
};

const keyCodeAliases: Readonly<Record<string, number>> = {
  backspace: 8,
  tab: 9,
  enter: 13,
  return: 13,
  shift: 16,
  ctrl: 17,
  control: 17,
  alt: 18,
  pause: 19,
  pausebreak: 19,
  capslock: 20,
  esc: 27,
  escape: 27,
  space: 32,
  spacebar: 32,
  pageup: 33,
  pagedown: 34,
  end: 35,
  home: 36,
  left: 37,
  leftarrow: 37,
  arrowleft: 37,
  up: 38,
  uparrow: 38,
  arrowup: 38,
  right: 39,
  rightarrow: 39,
  arrowright: 39,
  down: 40,
  downarrow: 40,
  arrowdown: 40,
  insert: 45,
  delete: 46,
  leftwindowkey: 91,
  rightwindowkey: 92,
  contextmenu: 93,
  multiply: 106,
  add: 107,
  subtract: 109,
  decimalpoint: 110,
  divide: 111,
  numlock: 144,
  scrolllock: 145,
  semicolon: 186,
  equalsign: 187,
  comma: 188,
  dash: 189,
  period: 190,
  forwardslash: 191,
  graveaccent: 192,
  openbracket: 219,
  backslash: 220,
  closebracket: 221,
  singlequote: 222,
};

const metaKeyCodes = [91, 92, 93] as const;

function legacyCodeForKey(value: string): number | readonly number[] | undefined {
  const normalized = normalizeKey(value);
  if (/^[a-z]$/u.test(normalized)) return normalized.charCodeAt(0) - 32;
  if (/^\d$/u.test(normalized)) return 48 + Number(normalized);
  const functionMatch = /^f([1-9]|1[0-2])$/u.exec(normalized);
  if (functionMatch) return 111 + Number(functionMatch[1]);
  const numpadMatch = /^numpad([0-9])$/u.exec(normalized);
  if (numpadMatch) return 96 + Number(numpadMatch[1]);
  if (normalized === 'meta' || normalized === 'command' || normalized === 'cmd') {
    return metaKeyCodes;
  }
  return keyCodeAliases[normalized];
}

function isEventTarget(value: unknown): value is EventTarget {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return (
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  );
}

function isRefTarget(value: unknown): value is { readonly current: EventTarget | null } {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) return false;
  return 'current' in value;
}

function resolveTarget(target: KeyPressTarget): EventTarget | undefined {
  if (!target) return undefined;
  if (typeof target === 'function') {
    try {
      return resolveTarget(target());
    } catch {
      return undefined;
    }
  }
  if (isEventTarget(target)) return target;
  if (isRefTarget(target)) return resolveTarget(target.current);
  return undefined;
}

function normalizeEvents(events: UseKeyPressOptions['events']): readonly KeyEvent[] {
  if (events === undefined) return ['keydown'];
  const values = Array.isArray(events) ? events : [events];
  return values.length > 0 ? values : ['keydown'];
}

function eventCode(event: KeyboardEvent): number {
  const keyCode = event.keyCode || event.which;
  return typeof keyCode === 'number' ? keyCode : 0;
}

function normalizeKey(value: string): string {
  return value.toLowerCase();
}

function modifierFor(value: string): 'ctrl' | 'shift' | 'alt' | 'meta' | undefined {
  return modifierAliases[normalizeKey(value)];
}

function modifierIsActive(
  event: KeyboardEvent,
  modifier: 'ctrl' | 'shift' | 'alt' | 'meta',
): boolean {
  if (modifier === 'ctrl') return event.ctrlKey || eventCode(event) === 17;
  if (modifier === 'shift') return event.shiftKey || eventCode(event) === 16;
  if (modifier === 'alt') return event.altKey || eventCode(event) === 18;
  return event.metaKey || [91, 92, 93].includes(eventCode(event));
}

function eventKeyMatches(event: KeyboardEvent, token: string): boolean {
  const normalized = normalizeKey(token);
  const key = normalizeKey(event.key || '');
  const code = normalizeKey(event.code || '');
  const legacyCode = eventCode(event);
  if (key === normalized || code === normalized) return true;

  if (code.startsWith('key') && code.slice(3) === normalized) return true;
  if (code.startsWith('digit') && code.slice(5) === normalized) return true;
  if (normalized === 'space' || normalized === 'spacebar') {
    if (key === ' ' || key === 'space') return true;
  }
  const alias = legacyCodeForKey(normalized);
  if (typeof alias === 'number') return legacyCode === alias;
  return alias?.includes(legacyCode) ?? false;
}

function splitCombo(value: string): readonly string[] {
  return value
    .trim()
    .split(/[.+\s]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isModifierToken(value: string): boolean {
  return modifierFor(value) !== undefined;
}

function countActiveModifiers(event: KeyboardEvent): number {
  return (['ctrl', 'shift', 'alt', 'meta'] as const).reduce(
    (count, modifier) => count + (modifierIsActive(event, modifier) ? 1 : 0),
    0,
  );
}

function matchesString(event: KeyboardEvent, value: string, exactMatch: boolean): boolean {
  const tokens = splitCombo(value);
  if (tokens.length === 0) return false;
  let matched = 0;
  let requestedModifiers = 0;
  for (const token of tokens) {
    const modifier = modifierFor(token);
    if (modifier) {
      requestedModifiers += 1;
      if (modifierIsActive(event, modifier)) matched += 1;
    } else if (eventKeyMatches(event, token)) {
      matched += 1;
    }
  }
  if (matched !== tokens.length) return false;
  if (exactMatch && countActiveModifiers(event) !== requestedModifiers) return false;
  return true;
}

function matchesFilter(
  event: KeyboardEvent,
  filter: KeyFilter,
  exactMatch: boolean,
): KeyType | false {
  if (typeof filter === 'function') {
    const result = filter(event);
    if (result === true) return event.key || event.code || false;
    return result || false;
  }
  if (typeof filter === 'number') return eventCode(event) === filter ? filter : false;
  if (typeof filter === 'string') return matchesString(event, filter, exactMatch) ? filter : false;
  if (Array.isArray(filter)) {
    // Arrays are alternatives. Keep the compact modifier-array spelling as a
    // fallback so `['ctrl', 's']` remains useful without stealing matches from
    // arrays that happen to contain `meta`.
    for (const item of filter) {
      const matched = matchesFilter(event, item, exactMatch);
      if (matched !== false) return matched;
    }
    if (
      filter.length > 1 &&
      filter.every((item): item is string => typeof item === 'string') &&
      filter.some(isModifierToken) &&
      filter.some((item) => !isModifierToken(item))
    ) {
      const combo = filter.join('.');
      return matchesString(event, combo, exactMatch) ? combo : false;
    }
  }
  return false;
}

/**
 * Runs a callback for matching keyboard events. Filters support key strings,
 * legacy numeric key codes, arrays of alternatives, predicates, and modifier
 * combinations such as `ctrl.s`, `ctrl+s`, or `['ctrl', 's']`.
 *
 * @public
 */
export function useKeyPress(
  keyFilter: KeyFilter,
  handler: KeyPressHandler,
  options?: UseKeyPressOptions,
): void;
export function useKeyPress(
  keyFilter: KeyFilter,
  handler: (event: KeyboardEvent, key: KeyType) => void,
  options?: UseKeyPressOptions,
): void {
  const targetOption = options?.target ?? options?.ref;
  const events = normalizeEvents(options?.events);
  const eventsKey = events.join('|');
  const enabled = options?.enabled !== false;
  const capture = options?.capture ?? options?.useCapture ?? false;
  const exactMatch = options?.exactMatch ?? false;
  const eventsRef = useRef(events);
  const filterRef = useRef(keyFilter);
  const handlerRef = useRef(handler);
  const errorRef = useRef(options?.onError);
  const bindingRef = useRef<
    | {
        readonly target: EventTarget;
        readonly eventsKey: string;
        readonly exactMatch: boolean;
        readonly capture: boolean;
        readonly callback: EventListener;
        readonly events: readonly KeyEvent[];
      }
    | undefined
  >(undefined);

  useIsomorphicLayoutEffect(() => {
    eventsRef.current = events;
    filterRef.current = keyFilter;
    handlerRef.current = handler;
    errorRef.current = options?.onError;
  }, [handler, keyFilter, options?.onError]);

  useEffect(() => {
    const target = resolveTarget(
      targetOption === undefined && typeof window !== 'undefined' ? window : targetOption,
    );
    const current = bindingRef.current;
    if (
      current &&
      current.target === target &&
      current.eventsKey === eventsKey &&
      current.exactMatch === exactMatch &&
      current.capture === capture &&
      enabled
    ) {
      return;
    }
    if (current) {
      for (const eventName of current.events) {
        current.target.removeEventListener(eventName, current.callback, current.capture);
      }
      bindingRef.current = undefined;
    }
    if (!enabled || !target) return;

    const callback = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      try {
        const matched = matchesFilter(keyboardEvent, filterRef.current, exactMatch);
        if (matched === false) return;
        handlerRef.current(keyboardEvent, matched);
      } catch (error) {
        notifyHookError(error, errorRef.current);
        throw error;
      }
    };
    const added: KeyEvent[] = [];
    try {
      for (const eventName of eventsRef.current) {
        target.addEventListener(eventName, callback, capture);
        added.push(eventName);
      }
    } catch (error) {
      for (const eventName of added) {
        try {
          target.removeEventListener(eventName, callback, capture);
        } catch {
          // Preserve the registration error while still attempting all cleanup.
        }
      }
      notifyHookError(error, errorRef.current);
      throw error;
    }

    bindingRef.current = {
      target,
      eventsKey,
      exactMatch,
      capture,
      callback,
      events: added,
    };
  });

  useEffect(
    () => () => {
      const binding = bindingRef.current;
      if (!binding) return;
      for (const eventName of binding.events) {
        binding.target.removeEventListener(eventName, binding.callback, binding.capture);
      }
      bindingRef.current = undefined;
    },
    [],
  );
}
