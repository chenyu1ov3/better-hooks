import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useResizeObserver, type ResizeObserverState } from '../index.js';

interface FakeResizeInstance {
  readonly callback: ResizeObserverCallback;
  readonly observed: Element[];
  readonly observe: ReturnType<typeof vi.fn>;
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly options: ResizeObserverOptions | undefined;
  trigger(entry: ResizeObserverEntry): void;
}

type ResizeInstances = FakeResizeInstance[] & {
  0: FakeResizeInstance;
  1: FakeResizeInstance;
  2: FakeResizeInstance;
};

function emptyInstances(): ResizeInstances {
  return [] as unknown as ResizeInstances;
}

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
let instances = emptyInstances();
let constructorFailure: Error | undefined;
let observeFailure: Error | undefined;

class FakeResizeObserver implements ResizeObserver {
  readonly observed: Element[] = [];
  readonly observe = vi.fn((target: Element, options?: ResizeObserverOptions) => {
    this.observed.push(target);
    this.options = options;
    if (observeFailure) throw observeFailure;
  });
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly callback: ResizeObserverCallback;
  options: ResizeObserverOptions | undefined;

  constructor(callback: ResizeObserverCallback) {
    if (constructorFailure) throw constructorFailure;
    this.callback = callback;
    instances.push(this);
  }

  trigger(entry: ResizeObserverEntry): void {
    this.callback([entry], this);
  }
}

function installObserver(): void {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: FakeResizeObserver,
  });
}

function restoreObserver(): void {
  instances = emptyInstances();
  constructorFailure = undefined;
  observeFailure = undefined;
  if (originalDescriptor) {
    Object.defineProperty(globalThis, 'ResizeObserver', originalDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'ResizeObserver');
  }
}

function entry(target: Element, width: number, height: number): ResizeObserverEntry {
  return {
    target,
    contentRect: { width, height } as DOMRectReadOnly,
    borderBoxSize: [],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  };
}

afterEach(() => {
  restoreObserver();
  vi.restoreAllMocks();
});

describe('useResizeObserver', () => {
  it('returns an empty snapshot and updates dimensions from native entries', () => {
    installObserver();
    const target = document.createElement('div');
    const onChange = vi.fn();
    const hook = renderHook(() => useResizeObserver(target, { onChange }));

    expect(hook.result.current).toEqual({ rect: null, width: 0, height: 0, error: undefined });
    const next = entry(target, 320, 180);
    act(() => instances[0].trigger(next));
    expect(hook.result.current.rect).toBe(next.contentRect);
    expect(hook.result.current.width).toBe(320);
    expect(hook.result.current.height).toBe(180);
    expect(onChange).toHaveBeenCalledWith(next);
    hook.unmount();
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('follows a moving ref and passes the selected box option', () => {
    installObserver();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const ref: { current: Element | null } = { current: first };
    const hook = renderHook(({ box }) => useResizeObserver(ref, { box }), {
      initialProps: { box: 'border-box' as ResizeObserverOptions['box'] },
    });
    const firstObserver = instances[0];
    expect(firstObserver.observed).toEqual([first]);
    expect(firstObserver.options).toEqual({ box: 'border-box' });

    ref.current = second;
    hook.rerender({ box: 'border-box' });
    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(instances[1].observed).toEqual([second]);

    hook.rerender({ box: 'content-box' });
    expect(instances[1].disconnect).toHaveBeenCalledTimes(1);
    expect(instances[2].options).toEqual({ box: 'content-box' });
    hook.unmount();
  });

  it('uses the latest committed callback without rebuilding the observer', () => {
    installObserver();
    const target = document.createElement('div');
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(({ onChange }) => useResizeObserver(target, { onChange }), {
      initialProps: { onChange: first },
    });
    hook.rerender({ onChange: second });
    const next = entry(target, 10, 20);
    act(() => instances[0].trigger(next));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(next);
    expect(instances).toHaveLength(1);
    hook.unmount();
  });

  it('disables and re-enables observation with a clean snapshot', () => {
    installObserver();
    const target = document.createElement('div');
    const hook = renderHook(({ enabled }) => useResizeObserver(target, { enabled }), {
      initialProps: { enabled: true },
    });
    act(() => instances[0].trigger(entry(target, 100, 50)));
    expect(hook.result.current.width).toBe(100);
    hook.rerender({ enabled: false });
    expect(hook.result.current).toEqual({ rect: null, width: 0, height: 0, error: undefined });
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    hook.rerender({ enabled: true });
    expect(instances).toHaveLength(2);
    hook.unmount();
  });

  it('ignores entries from an obsolete observer after a target change', () => {
    installObserver();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const hook = renderHook(({ target }) => useResizeObserver(target), {
      initialProps: { target: first },
    });
    const oldObserver = instances[0];
    hook.rerender({ target: second });
    const stale = entry(first, 99, 99);
    act(() => oldObserver.trigger(stale));
    expect(hook.result.current.rect).toBeNull();
    hook.unmount();
  });

  it('normalizes invalid dimensions while preserving the native rectangle', () => {
    installObserver();
    const target = document.createElement('div');
    const hook = renderHook(() => useResizeObserver(target));
    const next = entry(target, Number.NaN, -1);
    act(() => instances[0].trigger(next));
    expect(hook.result.current.rect).toBe(next.contentRect);
    expect(hook.result.current.width).toBe(0);
    expect(hook.result.current.height).toBe(0);
    hook.unmount();
  });

  it('returns an empty snapshot when the API is unavailable', () => {
    restoreObserver();
    const target = document.createElement('div');
    const onError = vi.fn();
    const hook = renderHook(() => useResizeObserver(target, { onError }));
    expect(hook.result.current).toEqual({ rect: null, width: 0, height: 0, error: undefined });
    expect(onError).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('reports constructor failures and preserves the original throw', () => {
    installObserver();
    const failure = new Error('resize constructor failed');
    constructorFailure = failure;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => useResizeObserver(document.createElement('div'), { onError })),
    ).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    consoleError.mockRestore();
  });

  it('reports observe failures and disconnects a partially-created observer', () => {
    installObserver();
    const failure = new Error('resize observe failed');
    observeFailure = failure;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => useResizeObserver(document.createElement('div'), { onError })),
    ).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('reports callback failures and preserves the original throw', () => {
    installObserver();
    const target = document.createElement('div');
    const failure = new Error('resize callback failed');
    const onError = vi.fn();
    const onChange = vi.fn(() => {
      throw failure;
    });
    const hook = renderHook(() => useResizeObserver(target, { onChange, onError }));
    const next = entry(target, 20, 10);

    expect(() => instances[0].trigger(next)).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    hook.rerender();
    expect(hook.result.current.error).toBe(failure);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(() => instances[0].trigger(entry(target, 1, 1))).not.toThrow();
    expect(onChange).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps an onError throw in a microtask without replacing the original error', () => {
    installObserver();
    const target = document.createElement('div');
    const failure = new Error('resize callback failed');
    const observerFailure = new Error('resize error observer failed');
    const onError = vi.fn(() => {
      throw observerFailure;
    });
    let queued: (() => void) | undefined;
    vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
      queued = callback;
    });
    const hook = renderHook(() =>
      useResizeObserver(target, {
        onChange: () => {
          throw failure;
        },
        onError,
      }),
    );

    expect(() => instances[0].trigger(entry(target, 20, 10))).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(queued).toBeTypeOf('function');
    expect(() => queued?.()).toThrow(observerFailure);
    hook.unmount();
  });

  it('keeps the original callback error when the error observer throws', () => {
    installObserver();
    const target = document.createElement('div');
    const callbackError = new Error('resize callback failed');
    const observerError = new Error('resize observer failed');
    const queued: VoidFunction[] = [];
    const queueSpy = vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
      queued.push(callback);
    });
    const onChange = vi.fn(() => {
      throw callbackError;
    });
    const onError = vi.fn(() => {
      throw observerError;
    });
    const hook = renderHook(() => useResizeObserver(target, { onChange, onError }));

    try {
      expect(() => instances[0].trigger(entry(target, 20, 10))).toThrow(callbackError);
      expect(onError).toHaveBeenCalledWith(callbackError);
      expect(queued).toHaveLength(1);
      let reported: unknown;
      try {
        queued[0]?.();
      } catch (error) {
        reported = error;
      }
      expect(reported).toBe(observerError);
    } finally {
      queueSpy.mockRestore();
      hook.unmount();
    }
  });

  it('cleans observers through StrictMode effect replay', () => {
    installObserver();
    const target = document.createElement('div');
    const hook = renderHook(() => useResizeObserver(target), { wrapper: StrictMode });
    expect(instances).toHaveLength(2);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(instances[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('supports object-form targets and ignores empty refs', () => {
    installObserver();
    const target = document.createElement('div');
    const ref: { current: Element | null } = { current: target };
    const objectForm = renderHook(() => useResizeObserver({ ref }));
    expect(instances[0].observed).toEqual([target]);
    objectForm.unmount();

    const emptyRef: { current: Element | null } = { current: null };
    const empty = renderHook(() => useResizeObserver(emptyRef));
    expect(empty.result.current).toEqual({
      rect: null,
      width: 0,
      height: 0,
      error: undefined,
    } satisfies ResizeObserverState);
    empty.unmount();
  });

  it('honors an explicit object-form target over the ref alias', () => {
    installObserver();
    const refTarget = document.createElement('div');
    const ref: { current: Element | null } = { current: refTarget };
    const hook = renderHook(() => useResizeObserver({ target: null, ref }));

    expect(instances).toHaveLength(0);
    expect(hook.result.current).toEqual({
      rect: null,
      width: 0,
      height: 0,
      error: undefined,
    });
    hook.unmount();
  });
});
