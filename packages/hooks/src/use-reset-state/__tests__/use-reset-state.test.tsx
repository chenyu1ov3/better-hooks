// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useResetState } from '../index.js';

describe('useResetState', () => {
  it('restores the first resolved state and keeps reset stable', () => {
    const { result, rerender } = renderHook(() => useResetState({ count: 0 }));
    const resetState = result.current[2];

    act(() => result.current[1]({ count: 5 }));
    expect(result.current[0]).toEqual({ count: 5 });
    act(() => result.current[2]());

    expect(result.current[0]).toEqual({ count: 0 });
    rerender();
    expect(result.current[2]).toBe(resetState);
  });

  it('captures a lazy initializer once even when later input changes', () => {
    const initializer = vi.fn((value: number) => ({ value }));
    const { result, rerender } = renderHook(
      ({ value }) => useResetState(() => initializer(value)),
      {
        initialProps: { value: 1 },
      },
    );

    expect(result.current[0]).toEqual({ value: 1 });
    rerender({ value: 2 });
    act(() => result.current[1]({ value: 9 }));
    act(() => result.current[2]());

    expect(result.current[0]).toEqual({ value: 1 });
    expect(initializer).toHaveBeenCalledOnce();
  });

  it('composes functional updates before reset', () => {
    const { result } = renderHook(() => useResetState(1));

    act(() => {
      result.current[1]((value) => value + 1);
      result.current[1]((value) => value + 1);
    });
    expect(result.current[0]).toBe(3);

    act(() => result.current[2]());
    expect(result.current[0]).toBe(1);
  });
});
