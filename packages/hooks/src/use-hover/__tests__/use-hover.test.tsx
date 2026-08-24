import { act, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useHover } from '../index.js';

describe('useHover', () => {
  it('tracks mouseenter and mouseleave and calls transition callbacks', () => {
    const target = new EventTarget();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const onChange = vi.fn();
    const { result, unmount } = renderHook(() => useHover(target, { onEnter, onLeave, onChange }));

    act(() => target.dispatchEvent(new Event('mouseenter')));
    expect(result.current).toBe(true);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true, expect.any(Event));

    act(() => target.dispatchEvent(new Event('mouseleave')));
    expect(result.current).toBe(false);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(false, expect.any(Event));
    unmount();
  });

  it('follows a stable ref when its current target changes', () => {
    const first = new EventTarget();
    const second = new EventTarget();
    const ref: { current: EventTarget | null } = { current: first };
    const { result, rerender, unmount } = renderHook(() => useHover(ref));

    act(() => first.dispatchEvent(new Event('mouseenter')));
    expect(result.current).toBe(true);
    ref.current = second;
    rerender();
    expect(result.current).toBe(false);
    act(() => first.dispatchEvent(new Event('mouseleave')));
    expect(result.current).toBe(false);
    act(() => second.dispatchEvent(new Event('mouseenter')));
    expect(result.current).toBe(true);
    unmount();
  });

  it('resolves a ref after its first commit assigns the target', () => {
    const target = new EventTarget();
    const ref: { current: EventTarget | null } = { current: null };
    const { result } = renderHook(() => {
      const hovering = useHover(ref);
      useLayoutEffect(() => {
        ref.current = target;
      }, []);
      return hovering;
    });

    act(() => target.dispatchEvent(new Event('mouseenter')));
    expect(result.current).toBe(true);
  });

  it('respects enabled and capture and removes listeners on unmount', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const remove = vi.spyOn(target, 'removeEventListener');
    const hook = renderHook(({ enabled }) => useHover(target, { enabled, capture: true }), {
      initialProps: { enabled: true },
    });
    expect(add.mock.calls.filter(([type]) => type === 'mouseenter')).toHaveLength(1);
    expect(add.mock.calls.find(([type]) => type === 'mouseenter')?.[2]).toBe(true);
    hook.rerender({ enabled: false });
    expect(remove.mock.calls.filter(([type]) => type === 'mouseenter')).toHaveLength(1);
    hook.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'mouseleave')).toHaveLength(1);
  });

  it('reports callback errors and preserves the original throw', () => {
    const target = new EventTarget();
    const failure = new Error('hover failed');
    const onError = vi.fn();
    const onEnter = vi.fn(() => {
      throw failure;
    });
    const add = vi.spyOn(target, 'addEventListener');
    const { unmount } = renderHook(() => useHover(target, { onEnter, onError }));
    const listener = add.mock.calls.find(([type]) => type === 'mouseenter')?.[1] as EventListener;

    expect(() => listener(new Event('mouseenter'))).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    unmount();
  });

  it('survives StrictMode listener replay', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const remove = vi.spyOn(target, 'removeEventListener');
    const hook = renderHook(() => useHover(target), { wrapper: StrictMode });
    expect(add.mock.calls.filter(([type]) => type === 'mouseenter')).toHaveLength(2);
    hook.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'mouseenter')).toHaveLength(2);
  });

  it('handles lazy, ref-like, and invalid targets defensively', () => {
    const invalidTarget = () => ({}) as unknown as EventTarget;
    const invalid = renderHook(() => useHover(invalidTarget));
    expect(invalid.result.current).toBe(false);
    invalid.unmount();

    const throwingTarget = () => {
      throw new Error('hover target unavailable');
    };
    const throwing = renderHook(() => useHover(throwingTarget));
    expect(throwing.result.current).toBe(false);
    throwing.unmount();

    const emptyRef: { current: EventTarget | null } = { current: null };
    const empty = renderHook(() => useHover(emptyRef));
    expect(empty.result.current).toBe(false);
    empty.unmount();
  });

  it('cleans a partially registered target when setup fails', () => {
    const failure = new Error('hover registration failed');
    const calls: string[] = [];
    const target = {
      addEventListener(type: string) {
        calls.push(`add:${type}`);
        if (type === 'mouseleave') throw failure;
      },
      removeEventListener(type: string) {
        calls.push(`remove:${type}`);
      },
    } as unknown as EventTarget;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useHover(target, { onError }))).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(calls).toEqual(['add:mouseenter', 'add:mouseleave', 'remove:mouseenter']);
    consoleError.mockRestore();
  });
});
