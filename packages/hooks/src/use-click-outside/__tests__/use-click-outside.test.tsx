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
});
