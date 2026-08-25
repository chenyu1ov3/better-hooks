import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from '../index.js';
import { useSessionStorage } from '../../use-session-storage/index.js';

const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

afterEach(() => {
  if (localStorageDescriptor) Object.defineProperty(window, 'localStorage', localStorageDescriptor);
  else Reflect.deleteProperty(window, 'localStorage');
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

describe('useLocalStorage', () => {
  it('persists updates and receives storage events', () => {
    localStorage.clear();
    const first = renderHook(() => useLocalStorage('count', 1));
    act(() => first.result.current.setValue((value) => value + 1));
    expect(first.result.current.value).toBe(2);
    localStorage.setItem('count', '3');
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'count', storageArea: localStorage, newValue: '3' }),
      ),
    );
    expect(first.result.current.value).toBe(3);
    first.unmount();
    localStorage.clear();
  });

  it('exposes deserialization errors', () => {
    localStorage.setItem('broken', '{');
    const { result, unmount } = renderHook(() => useLocalStorage('broken', { ok: false }));
    expect(result.current.value).toEqual({ ok: false });
    expect(result.current.error).toBeInstanceOf(Error);
    localStorage.setItem('broken', JSON.stringify({ ok: true }));
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'broken',
          storageArea: localStorage,
          newValue: JSON.stringify({ ok: true }),
        }),
      ),
    );
    expect(result.current.value).toEqual({ ok: true });
    unmount();
    localStorage.clear();
  });

  it('responds to a storage clear event', () => {
    localStorage.setItem('clearable', '2');
    const { result, unmount } = renderHook(() => useLocalStorage('clearable', 1));
    expect(result.current.value).toBe(2);
    localStorage.clear();
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage })),
    );
    expect(result.current.value).toBe(1);
    unmount();
  });

  it('evaluates a lazy initial value once across rerenders', () => {
    const initial = vi.fn(() => 1);
    const { rerender, unmount } = renderHook(() => useLocalStorage('lazy', initial));
    rerender();
    expect(initial).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('shares one native storage listener for the same key', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const first = renderHook(() => useLocalStorage('shared', 1));
    const second = renderHook(() => useLocalStorage('shared', 1));
    expect(add.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
    first.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(0);
    second.unmount();
    expect(remove.mock.calls.filter(([type]) => type === 'storage')).toHaveLength(1);
  });

  it('supports session storage and custom codecs', () => {
    sessionStorage.clear();
    const { result, unmount } = renderHook(() =>
      useSessionStorage('encoded', 1, {
        serialize: (value) => 'value:' + value,
        deserialize: (value) => Number(value.slice('value:'.length)),
      }),
    );
    act(() => result.current.setValue(2));
    expect(sessionStorage.getItem('encoded')).toBe('value:2');
    expect(result.current.value).toBe(2);
    unmount();
    sessionStorage.clear();
  });

  it('surfaces serialization failures without replacing the value', () => {
    const custom = renderHook(() =>
      useLocalStorage(
        'cyclic',
        {},
        {
          serialize: () => {
            throw new Error('serialize failed');
          },
        },
      ),
    );
    act(() => custom.result.current.setValue({}));
    expect(custom.result.current.error).toBeInstanceOf(Error);
    expect(custom.result.current.value).toEqual({});
    custom.unmount();
    localStorage.clear();
  });

  it('rejects values that the default JSON serializer cannot represent', () => {
    const hook = renderHook(() => useLocalStorage<undefined>('undefined', undefined));
    act(() => hook.result.current.setValue(undefined));
    expect(hook.result.current.value).toBeUndefined();
    expect(hook.result.current.error).toBeInstanceOf(TypeError);
    expect(localStorage.getItem('undefined')).toBeNull();
    hook.unmount();
  });

  it('applies consecutive functional updates to the latest shared value', () => {
    const first = renderHook(() => useLocalStorage('functional', 0));
    const second = renderHook(() => useLocalStorage('functional', 0));

    act(() => {
      first.result.current.setValue((value) => value + 1);
      first.result.current.setValue((value) => value + 1);
    });
    expect(first.result.current.value).toBe(2);
    expect(second.result.current.value).toBe(2);
    expect(localStorage.getItem('functional')).toBe('2');
    first.unmount();
    second.unmount();
  });

  it('switches stores when the key changes', () => {
    localStorage.setItem('first-key', '1');
    localStorage.setItem('second-key', '2');
    const hook = renderHook(({ storageKey }) => useLocalStorage(storageKey, 0), {
      initialProps: { storageKey: 'first-key' },
    });
    expect(hook.result.current.value).toBe(1);

    hook.rerender({ storageKey: 'second-key' });
    expect(hook.result.current.value).toBe(2);
    act(() => hook.result.current.setValue(3));
    expect(localStorage.getItem('first-key')).toBe('1');
    expect(localStorage.getItem('second-key')).toBe('3');
    hook.unmount();
  });

  it('keeps local and session stores isolated for an identical key', () => {
    const local = renderHook(() => useLocalStorage('isolated', 0));
    const session = renderHook(() => useSessionStorage('isolated', 0));

    act(() => local.result.current.setValue(1));
    expect(local.result.current.value).toBe(1);
    expect(session.result.current.value).toBe(0);
    expect(localStorage.getItem('isolated')).toBe('1');
    expect(sessionStorage.getItem('isolated')).toBeNull();

    act(() => session.result.current.setValue(2));
    expect(local.result.current.value).toBe(1);
    expect(session.result.current.value).toBe(2);
    local.unmount();
    session.unmount();
  });

  it('retries the same raw value after the decoder changes', () => {
    localStorage.setItem('decoder-change', 'value:4');
    const failing = () => {
      throw new Error('unsupported codec');
    };
    const working = (raw: string) => Number(raw.slice('value:'.length));
    const hook = renderHook(
      ({ deserialize }) => useLocalStorage('decoder-change', 0, { deserialize }),
      { initialProps: { deserialize: failing } },
    );
    expect(hook.result.current.value).toBe(0);
    expect(hook.result.current.error).toBeInstanceOf(Error);

    hook.rerender({ deserialize: working });
    expect(hook.result.current.value).toBe(4);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('does not loop when an inline decoder returns an object after a rerender', () => {
    localStorage.setItem('inline-decoder', '{"count":1}');
    let renders = 0;
    const hook = renderHook(() => {
      renders += 1;
      return useLocalStorage(
        'inline-decoder',
        { count: 0 },
        { deserialize: (raw) => JSON.parse(raw) as { count: number } },
      );
    });

    hook.rerender();

    expect(hook.result.current.value).toEqual({ count: 1 });
    expect(renders).toBe(2);
    hook.unmount();
  });

  it('does not loop with an inline object decoder during StrictMode replay', () => {
    localStorage.setItem('strict-inline-decoder', '{"ready":true}');
    let renders = 0;
    const hook = renderHook(
      () => {
        renders += 1;
        return useLocalStorage(
          'strict-inline-decoder',
          { ready: false },
          { deserialize: (raw) => JSON.parse(raw) as { ready: boolean } },
        );
      },
      { wrapper: StrictMode },
    );

    expect(hook.result.current.value).toEqual({ ready: true });
    expect(renders).toBeLessThan(10);
    hook.unmount();
  });

  it('retries a failed decoder on a later storage event with the same raw value', () => {
    localStorage.setItem('decoder-retry', '5');
    let shouldFail = true;
    const deserialize = (raw: string) => {
      if (shouldFail) throw new Error('temporarily unavailable');
      return Number(raw);
    };
    const hook = renderHook(() => useLocalStorage('decoder-retry', 0, { deserialize }));
    expect(hook.result.current.error).toBeInstanceOf(Error);

    shouldFail = false;
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'decoder-retry',
          storageArea: localStorage,
          newValue: '5',
        }),
      ),
    );
    expect(hook.result.current.value).toBe(5);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('uses the configuration of a remaining subscriber after cleanup', () => {
    localStorage.setItem('active-codec', '1');
    const firstDecoder = vi.fn((raw: string) => Number(raw));
    const secondDecoder = vi.fn((raw: string) => Number(raw));
    const first = renderHook(() =>
      useLocalStorage('active-codec', 0, { deserialize: firstDecoder }),
    );
    const second = renderHook(() =>
      useLocalStorage('active-codec', 0, { deserialize: secondDecoder }),
    );
    first.unmount();
    firstDecoder.mockClear();
    secondDecoder.mockClear();

    localStorage.setItem('active-codec', '2');
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'active-codec',
          storageArea: localStorage,
          newValue: '2',
        }),
      ),
    );
    expect(firstDecoder).not.toHaveBeenCalled();
    expect(secondDecoder).toHaveBeenCalledWith('2');
    expect(second.result.current.value).toBe(2);
    second.unmount();
  });

  it('surfaces storage getter failures and clears them after recovery', () => {
    const storage = window.localStorage;
    storage.setItem('getter-error', '2');
    const failure = new Error('storage getter failed');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => {
        throw failure;
      },
    });
    const hook = renderHook(() => useLocalStorage('getter-error', 0));
    expect(hook.result.current.error).toBe(failure);

    if (localStorageDescriptor)
      Object.defineProperty(window, 'localStorage', localStorageDescriptor);
    act(() =>
      window.dispatchEvent(new StorageEvent('storage', { key: 'getter-error', storageArea: null })),
    );
    expect(hook.result.current.value).toBe(2);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('surfaces storage getter failures from set and remove actions', () => {
    const storage = window.localStorage;
    storage.setItem('action-getter-error', '1');
    const hook = renderHook(() => useLocalStorage('action-getter-error', 0));
    const failure = new Error('storage getter failed');
    const failStorageAccess = () => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => {
          throw failure;
        },
      });
    };
    const restoreStorageAccess = () => {
      if (localStorageDescriptor)
        Object.defineProperty(window, 'localStorage', localStorageDescriptor);
      else Reflect.deleteProperty(window, 'localStorage');
    };

    failStorageAccess();
    act(() => hook.result.current.setValue(2));
    expect(hook.result.current.value).toBe(1);
    expect(hook.result.current.error).toBe(failure);

    restoreStorageAccess();
    act(() => hook.result.current.setValue(2));
    failStorageAccess();
    act(() => hook.result.current.remove());
    expect(hook.result.current.value).toBe(2);
    expect(hook.result.current.error).toBe(failure);

    restoreStorageAccess();
    act(() => hook.result.current.remove());
    expect(hook.result.current.value).toBe(0);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('ignores storage events for other keys and storage areas', () => {
    localStorage.setItem('filtered', '1');
    const hook = renderHook(() => useLocalStorage('filtered', 0));
    localStorage.setItem('filtered', '2');

    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other-key',
          storageArea: localStorage,
          newValue: '2',
        }),
      ),
    );
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'filtered',
          storageArea: sessionStorage,
          newValue: '2',
        }),
      ),
    );
    expect(hook.result.current.value).toBe(1);
    hook.unmount();
  });

  it('surfaces getItem failures and recovers on a later event', () => {
    localStorage.setItem('get-error', '3');
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('get failed');
    });
    const hook = renderHook(() => useLocalStorage('get-error', 0));
    expect(hook.result.current.error).toBeInstanceOf(Error);

    getItem.mockRestore();
    act(() =>
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'get-error',
          storageArea: localStorage,
          newValue: '3',
        }),
      ),
    );
    expect(hook.result.current.value).toBe(3);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('retains the value on setItem failure and clears the error after a successful set', () => {
    const hook = renderHook(() => useLocalStorage('set-error', 1));
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('set failed');
    });
    act(() => hook.result.current.setValue(2));
    expect(hook.result.current.value).toBe(1);
    expect(hook.result.current.error).toBeInstanceOf(Error);

    setItem.mockRestore();
    act(() => hook.result.current.setValue(2));
    expect(hook.result.current.value).toBe(2);
    expect(hook.result.current.error).toBeUndefined();
    hook.unmount();
  });

  it('retains the value on removeItem failure and resets after recovery', () => {
    localStorage.setItem('remove-error', '2');
    const hook = renderHook(() => useLocalStorage('remove-error', 1));
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove failed');
    });
    act(() => hook.result.current.remove());
    expect(hook.result.current.value).toBe(2);
    expect(hook.result.current.error).toBeInstanceOf(Error);

    removeItem.mockRestore();
    act(() => hook.result.current.remove());
    expect(hook.result.current.value).toBe(1);
    expect(hook.result.current.error).toBeUndefined();
    expect(localStorage.getItem('remove-error')).toBeNull();
    hook.unmount();
  });
});
