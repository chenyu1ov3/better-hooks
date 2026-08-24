// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useSafeState } from '../index.js';

describe('useSafeState', () => {
  it('updates state and keeps the safe setter stable', () => {
    const { result, rerender } = renderHook(() => useSafeState(0), { wrapper: StrictMode });
    const setState = result.current[1];

    act(() => {
      setState((value) => value + 1);
      setState((value) => value + 1);
    });

    expect(result.current[0]).toBe(2);
    rerender();
    expect(result.current[1]).toBe(setState);
  });

  it('does not evaluate an updater after unmount', () => {
    const { result, unmount } = renderHook(() => useSafeState(0));
    const updater = vi.fn((value: number) => value + 1);
    const setState = result.current[1];

    unmount();
    act(() => setState(updater));

    expect(updater).not.toHaveBeenCalled();
  });

  it('supports lazy initialization', () => {
    const initializer = vi.fn(() => ({ ready: true }));
    const { result } = renderHook(() => useSafeState(initializer));

    expect(result.current[0]).toEqual({ ready: true });
    expect(initializer).toHaveBeenCalledOnce();
  });
});
