import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useClickOutside } from '../index.js';

describe('useClickOutside', () => {
  it('only calls back for pointer events outside the referenced element', () => {
    const panel = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    panel.append(inside);
    document.body.append(panel, outside);
    const callback = vi.fn();
    const ref = { current: panel };
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useClickOutside(ref, callback, enabled),
      { initialProps: { enabled: true } },
    );

    act(() => inside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).not.toHaveBeenCalled();
    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(1);
    rerender({ enabled: false });
    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
    panel.remove();
    outside.remove();
  });

  it('uses capture so stopped bubbling cannot hide an outside press', () => {
    const panel = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(panel, outside);
    outside.addEventListener('pointerdown', (event) => event.stopPropagation());
    const callback = vi.fn();
    const { unmount } = renderHook(() => useClickOutside({ current: panel }, callback));

    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
    panel.remove();
    outside.remove();
  });

  it('uses the element ownerDocument and follows it across documents', () => {
    const localPanel = document.createElement('div');
    const localOutside = document.createElement('button');
    document.body.append(localPanel, localOutside);
    const foreignDocument = document.implementation.createHTMLDocument('foreign');
    const foreignPanel = foreignDocument.createElement('div');
    const foreignOutside = foreignDocument.createElement('button');
    foreignDocument.body.append(foreignPanel, foreignOutside);
    const ref: { current: HTMLDivElement | null } = { current: localPanel };
    const callback = vi.fn();
    const hook = renderHook(() => useClickOutside(ref, callback));

    ref.current = foreignPanel;
    hook.rerender();
    act(() => localOutside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).not.toHaveBeenCalled();
    act(() => foreignOutside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(1);
    hook.unmount();
    localPanel.remove();
    localOutside.remove();
  });

  it('treats composed shadow-root events as inside the referenced element', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    shadow.append(inside);
    document.body.append(host, outside);
    const callback = vi.fn();
    const { unmount } = renderHook(() => useClickOutside({ current: inside }, callback));

    act(() => inside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })));
    expect(callback).not.toHaveBeenCalled();
    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
    host.remove();
    outside.remove();
  });

  it('distinguishes targets hidden by a closed shadow root', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const panel = document.createElement('div');
    const inside = document.createElement('button');
    const shadowOutside = document.createElement('button');
    const outside = document.createElement('button');
    panel.append(inside);
    shadow.append(panel, shadowOutside);
    document.body.append(host, outside);
    const callback = vi.fn();
    const hook = renderHook(() => useClickOutside({ current: panel }, callback));

    await act(async () => {
      inside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
      await Promise.resolve();
    });
    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      shadowOutside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
      await Promise.resolve();
    });
    expect(callback).toHaveBeenCalledTimes(1);

    await act(async () => {
      host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
      await Promise.resolve();
    });
    expect(callback).toHaveBeenCalledTimes(2);

    act(() =>
      shadowOutside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: false })),
    );
    expect(callback).toHaveBeenCalledTimes(3);

    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(callback).toHaveBeenCalledTimes(4);

    act(() => {
      shadowOutside.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
      hook.unmount();
    });
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(4);
    host.remove();
    outside.remove();
  });

  it('uses the latest committed callback', () => {
    const panel = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(panel, outside);
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(({ callback }) => useClickOutside({ current: panel }, callback), {
      initialProps: { callback: first },
    });

    hook.rerender({ callback: second });
    act(() => outside.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    hook.unmount();
    panel.remove();
    outside.remove();
  });

  it('observes outside callback errors while keeping the binding cleanable', () => {
    const panel = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(panel, outside);
    const error = new Error('outside failed');
    const onError = vi.fn();
    const add = vi.spyOn(document, 'addEventListener');
    const hook = renderHook(() =>
      useClickOutside(
        { current: panel },
        () => {
          throw error;
        },
        { onError },
      ),
    );
    const listener = add.mock.calls.find(([type]) => type === 'pointerdown')?.[1] as EventListener;

    expect(() => listener(new Event('pointerdown'))).toThrow(error);
    expect(onError).toHaveBeenCalledWith(error);
    hook.unmount();
    add.mockRestore();
    panel.remove();
    outside.remove();
  });

  it('cleans the document listener when shadow-root registration fails', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const panel = document.createElement('div');
    shadow.append(panel);
    document.body.append(host);
    const failure = new Error('shadow registration failed');
    const onError = vi.fn();
    const rootAdd = vi.spyOn(shadow, 'addEventListener').mockImplementation(() => {
      throw failure;
    });
    const documentRemove = vi.spyOn(document, 'removeEventListener');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => useClickOutside({ current: panel }, vi.fn(), { onError })),
    ).toThrow(failure);
    expect(rootAdd).toHaveBeenCalledWith('pointerdown', expect.any(Function), true);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(
      documentRemove.mock.calls.some(
        ([type, , capture]) => type === 'pointerdown' && capture === true,
      ),
    ).toBe(true);

    consoleError.mockRestore();
    documentRemove.mockRestore();
    rootAdd.mockRestore();
    host.remove();
  });

  it('supports pointer events without composedPath', () => {
    const panel = document.createElement('div');
    const outside = document.createElement('button');
    document.body.append(panel, outside);
    const callback = vi.fn();
    const add = vi.spyOn(document, 'addEventListener');
    const { unmount } = renderHook(() => useClickOutside({ current: panel }, callback));
    const listener = add.mock.calls.find(([type]) => type === 'pointerdown')?.[1] as EventListener;

    listener({ target: outside, composedPath: undefined } as unknown as PointerEvent);
    expect(callback).toHaveBeenCalledOnce();
    unmount();
    add.mockRestore();
    panel.remove();
    outside.remove();
  });
});
