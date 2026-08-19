import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEventListener } from '../index.js';

describe('useEventListener', () => {
  it('keeps one listener while callback changes', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ callback }) => useEventListener('click', callback),
      {
        initialProps: { callback: first },
      },
    );
    rerender({ callback: second });
    act(() => window.dispatchEvent(new Event('click')));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeSpy).toHaveBeenCalledTimes(1);
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('supports explicit targets, refs, and option shapes', () => {
    const target = document.createElement('div');
    const targetRef = { current: target };
    const callback = vi.fn();
    const { unmount } = renderHook(() => {
      useEventListener(target, 'click', callback, { passive: true });
      useEventListener(targetRef, 'keydown', callback, true);
    });
    act(() => target.dispatchEvent(new Event('click')));
    act(() => target.dispatchEvent(new Event('keydown')));
    expect(callback).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('follows the current value of a stable ref after each commit', () => {
    const first = new EventTarget();
    const second = new EventTarget();
    const targetRef: { current: EventTarget | null } = { current: null };
    const callback = vi.fn();
    const hook = renderHook(() => useEventListener(targetRef, 'change', callback));

    targetRef.current = first;
    hook.rerender();
    act(() => first.dispatchEvent(new Event('change')));
    expect(callback).toHaveBeenCalledTimes(1);

    targetRef.current = second;
    hook.rerender();
    act(() => first.dispatchEvent(new Event('change')));
    act(() => second.dispatchEvent(new Event('change')));
    expect(callback).toHaveBeenCalledTimes(2);

    targetRef.current = null;
    hook.rerender();
    act(() => second.dispatchEvent(new Event('change')));
    expect(callback).toHaveBeenCalledTimes(2);
    hook.unmount();
  });

  it('does not confuse an EventTarget current property with a ref', () => {
    const target = Object.assign(new EventTarget(), { current: new EventTarget() });
    const callback = vi.fn();
    const { unmount } = renderHook(() => useEventListener(target, 'custom', callback));

    act(() => target.dispatchEvent(new Event('custom')));
    act(() => target.current.dispatchEvent(new Event('custom')));
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('reconciles once and signal options without rebinding equivalent options', () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, 'addEventListener');
    const remove = vi.spyOn(target, 'removeEventListener');
    const callback = vi.fn();
    const controller = new AbortController();
    const hook = renderHook(
      ({ once }) =>
        useEventListener(target, 'custom', callback, {
          once,
          passive: true,
          signal: controller.signal,
        }),
      { initialProps: { once: false } },
    );

    hook.rerender({ once: false });
    expect(add).toHaveBeenCalledTimes(1);
    hook.rerender({ once: true });
    expect(add).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(1);

    act(() => target.dispatchEvent(new Event('custom')));
    act(() => target.dispatchEvent(new Event('custom')));
    expect(callback).toHaveBeenCalledTimes(1);
    controller.abort();
    hook.unmount();
  });
});
