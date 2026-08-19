import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSessionStorage } from '../index.js';

afterEach(() => sessionStorage.clear());

describe('useSessionStorage entry', () => {
  it('reads and writes through the direct entry', () => {
    sessionStorage.setItem('direct-session', '1');
    const hook = renderHook(() => useSessionStorage('direct-session', 0));
    expect(hook.result.current.value).toBe(1);
    act(() => hook.result.current.setValue(2));
    expect(sessionStorage.getItem('direct-session')).toBe('2');
    hook.unmount();
  });
});
