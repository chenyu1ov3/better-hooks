import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIntersectionObserver, type IntersectionObserverState } from '../index.js';

interface FakeIntersectionInstance {
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit | undefined;
  readonly observed: Element[];
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly observe: ReturnType<typeof vi.fn>;
  trigger(entry: IntersectionObserverEntry): void;
}

type IntersectionInstances = FakeIntersectionInstance[] & {
  0: FakeIntersectionInstance;
  1: FakeIntersectionInstance;
  2: FakeIntersectionInstance;
};

function emptyInstances(): IntersectionInstances {
  return [] as unknown as IntersectionInstances;
}

const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver');
let instances = emptyInstances();

class FakeIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds: readonly number[] = [];
  readonly observed: Element[] = [];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn((target: Element) => {
    this.observed.push(target);
    if (observeFailure) throw observeFailure;
  });
  readonly unobserve = vi.fn();
  readonly takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit | undefined;

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    if (constructorFailure) throw constructorFailure;
    this.callback = callback;
    this.options = options;
    instances.push(this);
  }

  trigger(entry: IntersectionObserverEntry): void {
    this.callback([entry], this);
  }
}

let constructorFailure: Error | undefined;
let observeFailure: Error | undefined;

function installObserver(): void {
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    configurable: true,
    writable: true,
    value: FakeIntersectionObserver,
  });
}

function restoreObserver(): void {
  instances = emptyInstances();
  constructorFailure = undefined;
  observeFailure = undefined;
  if (originalDescriptor) {
    Object.defineProperty(globalThis, 'IntersectionObserver', originalDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'IntersectionObserver');
  }
}

function entry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  return {
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: {} as DOMRectReadOnly,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

afterEach(() => {
  restoreObserver();
  vi.restoreAllMocks();
});

describe('useIntersectionObserver', () => {
  it('returns an empty snapshot and updates from native entries', () => {
    installObserver();
    const target = document.createElement('div');
    const onChange = vi.fn();
    const hook = renderHook(() => useIntersectionObserver(target, { onChange }));

    expect(hook.result.current).toEqual({
      entry: null,
      isIntersecting: false,
      error: undefined,
    });
    const next = entry(target, true);
    act(() => instances[0].trigger(next));
    expect(hook.result.current.entry).toBe(next);
    expect(hook.result.current.isIntersecting).toBe(true);
    expect(onChange).toHaveBeenCalledWith(next);
    hook.unmount();
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('follows a moving ref and rebuilds when native options change', () => {
    installObserver();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const ref: { current: Element | null } = { current: first };
    const hook = renderHook(
      ({ margin }) => useIntersectionObserver(ref, { rootMargin: margin, threshold: [0, 0.5] }),
      { initialProps: { margin: '1px' } },
    );
    const firstObserver = instances[0];
    expect(firstObserver.observed).toEqual([first]);

    ref.current = second;
    hook.rerender({ margin: '1px' });
    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(2);
    expect(instances[1].observed).toEqual([second]);

    hook.rerender({ margin: '2px' });
    expect(instances[1].disconnect).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(3);
    expect(instances[2].options).toEqual({ rootMargin: '2px', threshold: [0, 0.5] });
    hook.unmount();
  });

  it('detects an in-place threshold array mutation', () => {
    installObserver();
    const target = document.createElement('div');
    const threshold = [0, 0.5];
    const hook = renderHook(() => useIntersectionObserver(target, { threshold }));
    const firstObserver = instances[0];

    threshold[1] = 1;
    hook.rerender();
    expect(firstObserver.disconnect).toHaveBeenCalledTimes(1);
    expect(instances[1].options?.threshold).toEqual([0, 1]);
    hook.unmount();
  });

  it('passes an explicit root through to the native constructor', () => {
    installObserver();
    const target = document.createElement('div');
    const root = document.createElement('section');
    const hook = renderHook(() => useIntersectionObserver(target, { root }));
    expect(instances[0].options?.root).toBe(root);
    hook.unmount();
  });

  it('uses the latest committed callback without rebuilding the observer', () => {
    installObserver();
    const target = document.createElement('div');
    const first = vi.fn();
    const second = vi.fn();
    const hook = renderHook(({ onChange }) => useIntersectionObserver(target, { onChange }), {
      initialProps: { onChange: first },
    });
    hook.rerender({ onChange: second });
    const next = entry(target, false);
    act(() => instances[0].trigger(next));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(next);
    expect(instances).toHaveLength(1);
    hook.unmount();
  });

  it('disables and re-enables observation with a clean snapshot', () => {
    installObserver();
    const target = document.createElement('div');
    const hook = renderHook(({ enabled }) => useIntersectionObserver(target, { enabled }), {
      initialProps: { enabled: true },
    });
    act(() => instances[0].trigger(entry(target, true)));
    expect(hook.result.current.isIntersecting).toBe(true);
    hook.rerender({ enabled: false });
    expect(hook.result.current).toEqual({
      entry: null,
      isIntersecting: false,
      error: undefined,
    });
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    hook.rerender({ enabled: true });
    expect(instances).toHaveLength(2);
    hook.unmount();
  });

  it('ignores entries from an obsolete observer after a target change', () => {
    installObserver();
    const first = document.createElement('div');
    const second = document.createElement('div');
    const hook = renderHook(({ target }) => useIntersectionObserver(target), {
      initialProps: { target: first },
    });
    const oldObserver = instances[0];
    hook.rerender({ target: second });
    const stale = entry(first, true);
    act(() => oldObserver.trigger(stale));
    expect(hook.result.current.entry).toBeNull();
    hook.unmount();
  });

  it('returns an empty snapshot when the API is unavailable', () => {
    restoreObserver();
    const target = document.createElement('div');
    const onError = vi.fn();
    const hook = renderHook(() => useIntersectionObserver(target, { onError }));
    expect(hook.result.current).toEqual({
      entry: null,
      isIntersecting: false,
      error: undefined,
    });
    expect(onError).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('reports constructor failures, preserves the original throw, and keeps cleanup safe', () => {
    installObserver();
    const failure = new Error('intersection constructor failed');
    constructorFailure = failure;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => useIntersectionObserver(document.createElement('div'), { onError })),
    ).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    consoleError.mockRestore();
  });

  it('reports observe failures and disconnects a partially-created observer', () => {
    installObserver();
    const failure = new Error('intersection observe failed');
    observeFailure = failure;
    const onError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      renderHook(() => useIntersectionObserver(document.createElement('div'), { onError })),
    ).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  it('reports callback failures and preserves the original throw', () => {
    installObserver();
    const target = document.createElement('div');
    const failure = new Error('intersection callback failed');
    const onError = vi.fn();
    const onChange = vi.fn(() => {
      throw failure;
    });
    const hook = renderHook(() => useIntersectionObserver(target, { onChange, onError }));
    const next = entry(target, true);

    expect(() => instances[0].trigger(next)).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    hook.rerender();
    expect(hook.result.current.error).toBe(failure);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    expect(() => instances[0].trigger(entry(target, false))).not.toThrow();
    expect(onChange).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps the original callback error when the error observer throws', () => {
    installObserver();
    const target = document.createElement('div');
    const callbackError = new Error('intersection callback failed');
    const observerError = new Error('intersection observer failed');
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
    const hook = renderHook(() => useIntersectionObserver(target, { onChange, onError }));

    try {
      expect(() => instances[0].trigger(entry(target, true))).toThrow(callbackError);
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

  it('keeps an onError throw in a microtask without replacing the original error', () => {
    installObserver();
    const target = document.createElement('div');
    const failure = new Error('intersection callback failed');
    const observerFailure = new Error('intersection error observer failed');
    const onError = vi.fn(() => {
      throw observerFailure;
    });
    let queued: (() => void) | undefined;
    vi.spyOn(globalThis, 'queueMicrotask').mockImplementation((callback) => {
      queued = callback;
    });
    const hook = renderHook(() =>
      useIntersectionObserver(target, {
        onChange: () => {
          throw failure;
        },
        onError,
      }),
    );

    expect(() => instances[0].trigger(entry(target, true))).toThrow(failure);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(queued).toBeTypeOf('function');
    expect(() => queued?.()).toThrow(observerFailure);
    hook.unmount();
  });

  it('cleans observers through StrictMode effect replay', () => {
    installObserver();
    const target = document.createElement('div');
    const hook = renderHook(() => useIntersectionObserver(target), { wrapper: StrictMode });
    expect(instances).toHaveLength(2);
    expect(instances[0].disconnect).toHaveBeenCalledTimes(1);
    hook.unmount();
    expect(instances[1].disconnect).toHaveBeenCalledTimes(1);
  });

  it('supports the object-form target and ignores invalid or empty refs', () => {
    installObserver();
    const target = document.createElement('div');
    const ref: { current: Element | null } = { current: target };
    const objectForm = renderHook(() => useIntersectionObserver({ ref }));
    expect(instances[0].observed).toEqual([target]);
    objectForm.unmount();

    const emptyRef: { current: Element | null } = { current: null };
    const empty = renderHook(() => useIntersectionObserver(emptyRef));
    expect(empty.result.current).toEqual({
      entry: null,
      isIntersecting: false,
      error: undefined,
    } satisfies IntersectionObserverState);
    empty.unmount();
  });

  it('honors an explicit object-form target over the ref alias', () => {
    installObserver();
    const refTarget = document.createElement('div');
    const ref: { current: Element | null } = { current: refTarget };
    const hook = renderHook(() => useIntersectionObserver({ target: null, ref }));

    expect(instances).toHaveLength(0);
    expect(hook.result.current).toEqual({
      entry: null,
      isIntersecting: false,
      error: undefined,
    });
    hook.unmount();
  });
});
