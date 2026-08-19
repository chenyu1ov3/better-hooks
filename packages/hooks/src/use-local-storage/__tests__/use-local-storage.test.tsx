import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from '../index.js';

afterEach(() => localStorage.clear());

describe('useLocalStorage entry', () => {
  it('reads and writes through the direct entry', () => {
    localStorage.setItem('direct-local', '1');
    const hook = renderHook(() => useLocalStorage('direct-local', 0));
    expect(hook.result.current.value).toBe(1);
    act(() => hook.result.current.setValue(2));
    expect(localStorage.getItem('direct-local')).toBe('2');
    hook.unmount();
  });
});
