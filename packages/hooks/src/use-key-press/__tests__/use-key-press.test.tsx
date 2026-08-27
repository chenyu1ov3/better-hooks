import { act, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyPress } from '../index.js';

function keyEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  init: KeyboardEventInit = {},
): KeyboardEvent {
  return new KeyboardEvent(type, { bubbles: true, ...init });
}

function legacyKeyEvent(keyCode: number, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = keyEvent('keydown', { key: '', code: '', ...init });
  Object.defineProperty(event, 'keyCode', { configurable: true, value: keyCode });
  Object.defineProperty(event, 'which', { configurable: true, value: keyCode });
  return event;
}

describe('useKeyPress', () => {
  it('matches strings, numeric codes, arrays, and predicates', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyPress(['a', 'b'], callback));
    act(() => window.dispatchEvent(keyEvent('keydown', { key: 'b' })));
    expect(callback).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'b');
    unmount();

    const numeric = vi.fn();
    const numericHook = renderHook(() => useKeyPress(13, numeric));
    const enter = keyEvent('keydown', { key: 'Enter' });
    Object.defineProperty(enter, 'keyCode', { configurable: true, value: 13 });
    act(() => window.dispatchEvent(enter));
    expect(numeric).toHaveBeenCalledWith(expect.any(KeyboardEvent), 13);
    numericHook.unmount();

    const predicate = vi.fn((event: KeyboardEvent) => event.key === 'x');
    const predicateHandler = vi.fn();
    const predicateHook = renderHook(() => useKeyPress(predicate, predicateHandler));
    act(() => window.dispatchEvent(keyEvent('keydown', { key: 'x' })));
    expect(predicateHandler).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'x');
    predicateHook.unmount();
  });

  it('supports modifier combinations and exact matching', () => {
    const loose = vi.fn();
    const looseHook = renderHook(() => useKeyPress('ctrl+s', loose));
    act(() =>
      window.dispatchEvent(keyEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true })),
    );
    expect(loose).toHaveBeenCalledTimes(1);
    looseHook.unmount();

    const exact = vi.fn();
    const exactHook = renderHook(() => useKeyPress('ctrl.s', exact, { exactMatch: true }));
    act(() =>
      window.dispatchEvent(keyEvent('keydown', { key: 's', ctrlKey: true, shiftKey: true })),
    );
    expect(exact).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(keyEvent('keydown', { key: 's', ctrlKey: true })));
    expect(exact).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'ctrl.s');
    exactHook.unmount();
  });

  it('treats arrays as alternatives instead of modifier combinations', () => {
    const target = new EventTarget();
    const callback = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyPress(['ctrl', 's'], callback, { exactMatch: true, target }),
    );

    act(() => target.dispatchEvent(keyEvent('keydown', { key: 's', ctrlKey: true })));
    expect(callback).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), 'ctrl');

    act(() => target.dispatchEvent(keyEvent('keydown', { key: 's' })));
    expect(callback).toHaveBeenLastCalledWith(expect.any(KeyboardEvent), 's');
    expect(callback).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('matches a standalone Ctrl key with exact matching', () => {
    const target = new EventTarget();
    const callback = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyPress('ctrl', callback, { exactMatch: true, target }),
    );

    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'Control', ctrlKey: true })));
    expect(callback).toHaveBeenCalledWith(expect.any(KeyboardEvent), 'ctrl');
    unmount();
  });

  it('supports event lists, capture, enabled, and a ref that moves targets', () => {
    const first = new EventTarget();
    const second = new EventTarget();
    const ref: { current: EventTarget | null } = { current: first };
    const callback = vi.fn();
    const add = vi.spyOn(first, 'addEventListener');
    const remove = vi.spyOn(first, 'removeEventListener');
    const hook = renderHook(
      ({ enabled }) =>
        useKeyPress('Enter', callback, {
          ref,
          events: ['keydown', 'keyup'],
          capture: true,
          enabled,
        }),
      { initialProps: { enabled: true } },
    );
    expect(add.mock.calls.find(([type]) => type === 'keydown')?.[2]).toBe(true);
    act(() => first.dispatchEvent(keyEvent('keyup', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(1);
    ref.current = second;
    hook.rerender({ enabled: true });
    act(() => first.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    act(() => second.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1);
    hook.rerender({ enabled: false });
    act(() => second.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(2);
    hook.unmount();
  });

  it('rebinds when the configured event type changes', () => {
    const target = new EventTarget();
    const callback = vi.fn();
    const hook = renderHook(
      ({ event }: { event: 'keydown' | 'keyup' }) =>
        useKeyPress('Enter', callback, { target, events: event }),
      { initialProps: { event: 'keydown' as 'keydown' | 'keyup' } },
    );

    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(1);

    hook.rerender({ event: 'keyup' });
    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(1);
    act(() => target.dispatchEvent(keyEvent('keyup', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledTimes(2);
    hook.unmount();
  });

  it('resolves a ref after its first commit assigns the target', () => {
    const target = new EventTarget();
    const ref: { current: EventTarget | null } = { current: null };
    const callback = vi.fn();
    renderHook(() => {
      useKeyPress('Enter', callback, { ref });
      useLayoutEffect(() => {
        ref.current = target;
      }, []);
    });

    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'Enter' })));
    expect(callback).toHaveBeenCalledOnce();
  });

  it('preserves handler errors when the error observer also throws', () => {
    const target = new EventTarget();
    const failure = new Error('key failed');
    const observerFailure = new Error('observer failed');
    const queuedMicrotasks: VoidFunction[] = [];
    const queueMicrotaskSpy = vi
      .spyOn(globalThis, 'queueMicrotask')
      .mockImplementation((callback) => queuedMicrotasks.push(callback));
    const onError = vi.fn(() => {
      throw observerFailure;
    });
    const handler = vi.fn(() => {
      throw failure;
    });

    try {
      const add = vi.spyOn(target, 'addEventListener');
      const { unmount } = renderHook(() => useKeyPress('x', handler, { target, onError }));
      const listener = add.mock.calls.find(([type]) => type === 'keydown')?.[1] as EventListener;
      let thrown: unknown;
      try {
        listener(keyEvent('keydown', { key: 'x' }));
      } catch (error) {
        thrown = error;
      }
      expect(thrown).toBe(failure);
      expect(onError).toHaveBeenCalledWith(failure);
      expect(queuedMicrotasks).toHaveLength(1);
      let reported: unknown;
      try {
        queuedMicrotasks[0]?.();
      } catch (error) {
        reported = error;
      }
      expect(reported).toBe(observerFailure);
      unmount();
    } finally {
      queueMicrotaskSpy.mockRestore();
    }
  });

  it('keeps the latest callback and survives StrictMode replay', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(({ callback }) => useKeyPress('a', callback, { target }), {
      initialProps: { callback: first },
      wrapper: StrictMode,
    });
    hook.rerender({ callback: second });
    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'a' })));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(2);
    hook.unmount();
  });

  it('supports legacy aliases, code prefixes, spaces, and unmatched filters', () => {
    const target = new EventTarget();
    const callback = vi.fn();
    const aliases = [
      ['a', 65],
      ['5', 53],
      ['f2', 113],
      ['numpad3', 99],
      ['semicolon', 186],
    ] as const;
    const hook = renderHook(() =>
      useKeyPress(
        aliases.map(([key]) => key),
        callback,
        { target },
      ),
    );

    for (const [, keyCode] of aliases) {
      act(() => target.dispatchEvent(legacyKeyEvent(keyCode)));
    }
    expect(callback).toHaveBeenCalledTimes(aliases.length);
    hook.unmount();

    const metaCallback = vi.fn();
    const metaHook = renderHook(() => useKeyPress('meta', metaCallback, { target }));
    act(() => target.dispatchEvent(legacyKeyEvent(91)));
    expect(metaCallback).toHaveBeenCalledOnce();
    metaHook.unmount();

    const codeCallback = vi.fn();
    const codeHook = renderHook(() => useKeyPress('a', codeCallback, { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: '', code: 'KeyA' })));
    expect(codeCallback).toHaveBeenCalledOnce();
    codeHook.unmount();

    const digitCallback = vi.fn();
    const digitHook = renderHook(() => useKeyPress('5', digitCallback, { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: '', code: 'Digit5' })));
    expect(digitCallback).toHaveBeenCalledOnce();
    digitHook.unmount();

    const spaceCallback = vi.fn();
    const spaceHook = renderHook(() => useKeyPress('space', spaceCallback, { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: ' ' })));
    expect(spaceCallback).toHaveBeenCalledOnce();
    spaceHook.unmount();

    const unmatched = vi.fn();
    const unmatchedHook = renderHook(() =>
      useKeyPress(['missing', 'still-missing'], unmatched, { target }),
    );
    act(() => target.dispatchEvent(legacyKeyEvent(0)));
    expect(unmatched).not.toHaveBeenCalled();
    unmatchedHook.unmount();

    const predicate = vi.fn(() => false);
    const predicateHook = renderHook(() => useKeyPress(predicate, vi.fn(), { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'x' })));
    expect(predicate).toHaveBeenCalledOnce();
    predicateHook.unmount();
  });

  it('supports alt and meta modifier combinations', () => {
    const target = new EventTarget();
    const alt = vi.fn();
    const altHook = renderHook(() => useKeyPress('alt+a', alt, { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'a', altKey: true })));
    expect(alt).toHaveBeenCalledOnce();
    altHook.unmount();

    const meta = vi.fn();
    const metaHook = renderHook(() => useKeyPress('meta+a', meta, { target }));
    act(() => target.dispatchEvent(keyEvent('keydown', { key: 'a', metaKey: true })));
    expect(meta).toHaveBeenCalledOnce();
    metaHook.unmount();
  });

  it('handles lazy targets and cleans partial registration failures', () => {
    const unavailable = renderHook(() =>
      useKeyPress('x', vi.fn(), {
        target: () => ({}) as unknown as EventTarget,
      }),
    );
    unavailable.unmount();

    const throwing = renderHook(() =>
      useKeyPress('x', vi.fn(), {
        target: () => {
          throw new Error('key target unavailable');
        },
      }),
    );
    throwing.unmount();

    const calls: string[] = [];
    const failure = new Error('key registration failed');
    const target = {
      addEventListener(type: string) {
        if (type === 'keyup') throw failure;
        calls.push(`add:${type}`);
      },
      removeEventListener(type: string) {
        calls.push(`remove:${type}`);
      },
    } as unknown as EventTarget;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      renderHook(() =>
        useKeyPress('x', vi.fn(), {
          target,
          events: ['keydown', 'keyup'],
          onError,
        }),
      ),
    ).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(calls).toEqual(['add:keydown', 'remove:keydown']);
    consoleError.mockRestore();
  });
});
