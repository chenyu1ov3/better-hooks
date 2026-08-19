import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOnline } from '../index.js';

describe('useOnline', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine');

  afterEach(() => {
    if (originalDescriptor) {
      Object.defineProperty(Navigator.prototype, 'onLine', originalDescriptor);
    } else {
      Reflect.deleteProperty(Navigator.prototype, 'onLine');
    }
    vi.restoreAllMocks();
  });

  it('tracks online and offline events', () => {
    let online = true;
    Object.defineProperty(Navigator.prototype, 'onLine', {
      configurable: true,
      get: () => online,
    });
    const { result, unmount } = renderHook(() => useOnline());
    online = false;
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current).toBe(false);
    online = true;
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current).toBe(true);
    unmount();
  });

  it('uses an offline navigator value for the initial client snapshot', () => {
    Object.defineProperty(Navigator.prototype, 'onLine', {
      configurable: true,
      get: () => false,
    });
    const { result, unmount } = renderHook(() => useOnline());
    expect(result.current).toBe(false);
    unmount();
  });

  it('defaults to online when reading navigator throws', () => {
    Object.defineProperty(Navigator.prototype, 'onLine', {
      configurable: true,
      get: () => {
        throw new Error('navigator unavailable');
      },
    });
    const { result, unmount } = renderHook(() => useOnline());
    expect(result.current).toBe(true);
    unmount();
  });

  it('does not notify React when an event keeps the same online state', () => {
    Object.defineProperty(Navigator.prototype, 'onLine', {
      configurable: true,
      get: () => true,
    });
    let renders = 0;
    const { unmount } = renderHook(() => {
      renders += 1;
      return useOnline();
    });
    const initialRenders = renders;
    act(() => window.dispatchEvent(new Event('online')));
    expect(renders).toBe(initialRenders);
    unmount();
  });

  it('shares native listeners between Hook instances', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const first = renderHook(() => useOnline());
    const second = renderHook(() => useOnline());

    expect(add.mock.calls.filter(([type]) => type === 'online')).toHaveLength(1);
    expect(add.mock.calls.filter(([type]) => type === 'offline')).toHaveLength(1);

    first.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'online')).toHaveLength(0);
    second.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'online')).toHaveLength(1);
  });
});
