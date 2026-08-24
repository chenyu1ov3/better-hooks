import { act, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentVisibility } from '../index.js';

describe('useDocumentVisibility', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');

  afterEach(() => {
    if (originalDescriptor) Object.defineProperty(document, 'visibilityState', originalDescriptor);
    else Reflect.deleteProperty(document, 'visibilityState');
    vi.restoreAllMocks();
  });

  it('reads and updates the document visibility state', () => {
    let state: 'visible' | 'hidden' = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    });
    const { result, unmount } = renderHook(() => useDocumentVisibility());
    expect(result.current).toBe('visible');

    state = 'hidden';
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBe('hidden');
    unmount();
  });

  it('shares and cleans one native subscription per document', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const first = renderHook(() => useDocumentVisibility());
    const second = renderHook(() => useDocumentVisibility());

    expect(add.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
    first.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(0);
    second.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);
  });

  it('supports capture, disabled mode, and a ref that moves documents', () => {
    const firstDocument = document.implementation.createHTMLDocument('first');
    const secondDocument = document.implementation.createHTMLDocument('second');
    Object.defineProperty(firstDocument, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    Object.defineProperty(secondDocument, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    const ref: { current: Document | null } = { current: firstDocument };
    const firstAdd = vi.spyOn(firstDocument, 'addEventListener');
    const firstRemove = vi.spyOn(firstDocument, 'removeEventListener');
    const { result, rerender, unmount } = renderHook(
      ({ enabled }) => useDocumentVisibility({ ref, enabled, capture: true }),
      { initialProps: { enabled: true } },
    );

    expect(result.current).toBe('hidden');
    expect(firstAdd.mock.calls.at(-1)?.[2]).toBe(true);
    ref.current = secondDocument;
    rerender({ enabled: true });
    expect(result.current).toBe('visible');
    expect(firstRemove.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(1);

    rerender({ enabled: false });
    expect(result.current).toBe('visible');
    unmount();
  });

  it('resolves a ref after its first commit assigns the document', () => {
    const target = document.implementation.createHTMLDocument('mounted');
    Object.defineProperty(target, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    const ref: { current: Document | null } = { current: null };
    const { result } = renderHook(() => {
      const visibility = useDocumentVisibility({ ref });
      useLayoutEffect(() => {
        ref.current = target;
      }, []);
      return visibility;
    });

    expect(result.current).toBe('hidden');
  });

  it('survives StrictMode effect replay and inaccessible visibility properties', () => {
    const target = new EventTarget() as Document;
    Object.defineProperty(target, 'visibilityState', {
      configurable: true,
      get: () => {
        throw new Error('unavailable');
      },
    });
    const add = vi.spyOn(target, 'addEventListener');
    const { result, unmount } = renderHook(() => useDocumentVisibility({ target }), {
      wrapper: StrictMode,
    });
    expect(result.current).toBe('visible');
    expect(add.mock.calls.filter(([type]) => type === 'visibilitychange')).toHaveLength(2);
    unmount();
  });

  it('normalizes invalid visibility values and lazy or empty targets', () => {
    const target = new EventTarget() as Document;
    Object.defineProperty(target, 'visibilityState', {
      configurable: true,
      value: 'unknown',
    });
    const { result, unmount } = renderHook(() => useDocumentVisibility(target));
    expect(result.current).toBe('visible');
    act(() => target.dispatchEvent(new Event('visibilitychange')));
    expect(result.current).toBe('visible');
    unmount();

    const throwing = renderHook(() =>
      useDocumentVisibility(() => {
        throw new Error('target unavailable');
      }),
    );
    expect(throwing.result.current).toBe('visible');
    throwing.unmount();

    const empty = renderHook(() => useDocumentVisibility(null));
    expect(empty.result.current).toBe('visible');
    empty.unmount();
  });

  it('treats hostile native registration and cleanup as SSR-like', () => {
    const registrationFailure = new Error('visibility registration failed');
    const registrationTarget = new EventTarget() as Document;
    const add = vi.spyOn(registrationTarget, 'addEventListener').mockImplementation(() => {
      throw registrationFailure;
    });
    const failed = renderHook(() => useDocumentVisibility({ target: registrationTarget }));
    expect(failed.result.current).toBe('visible');
    expect(add).toHaveBeenCalledWith('visibilitychange', expect.any(Function), false);
    failed.unmount();

    const cleanupTarget = new EventTarget() as Document;
    const remove = vi.spyOn(cleanupTarget, 'removeEventListener').mockImplementation(() => {
      throw new Error('visibility cleanup failed');
    });
    const cleanup = renderHook(() => useDocumentVisibility(cleanupTarget));
    cleanup.unmount();
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function), false);
  });
});
