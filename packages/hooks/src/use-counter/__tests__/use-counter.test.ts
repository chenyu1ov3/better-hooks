// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useCounter } from '../index.js';

describe('useCounter', () => {
  it('clamps the initial value and supports numeric actions', () => {
    const { result } = renderHook(() => useCounter(10, { min: 0, max: 5 }));

    expect(result.current.count).toBe(5);
    act(() => result.current.decrement(2));
    expect(result.current.count).toBe(3);
    act(() => result.current.increment());
    expect(result.current.count).toBe(4);
    act(() => result.current.set((previous) => previous + 10));
    expect(result.current.count).toBe(5);
    act(() => result.current.reset());
    expect(result.current.count).toBe(5);
  });

  it('composes queued functional actions without reading a stale count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.decrement();
      result.current.set((previous) => previous + 3);
    });

    expect(result.current.count).toBe(4);
  });

  it('captures the initial count and keeps actions stable', () => {
    const { result, rerender } = renderHook(
      ({ initial, min }: { initial: number; min: number }) => useCounter(initial, { min }),
      { initialProps: { initial: 2, min: 0 } },
    );
    const actions = {
      decrement: result.current.decrement,
      increment: result.current.increment,
      reset: result.current.reset,
      set: result.current.set,
    };

    rerender({ initial: 4, min: 3 });
    expect(result.current.count).toBe(2);
    expect(result.current.increment).toBe(actions.increment);
    expect(result.current.decrement).toBe(actions.decrement);
    expect(result.current.set).toBe(actions.set);
    expect(result.current.reset).toBe(actions.reset);

    act(() => result.current.reset());
    expect(result.current.count).toBe(3);
  });

  it('rejects inverted bounds', () => {
    expect(() => renderHook(() => useCounter(0, { min: 2, max: 1 }))).toThrow(
      'useCounter requires min to be less than or equal to max.',
    );
  });

  it('retains stable actions through StrictMode', () => {
    const { result, rerender } = renderHook(() => useCounter(1), { wrapper: StrictMode });
    const actions = result.current;

    rerender();

    expect(result.current.increment).toBe(actions.increment);
    expect(result.current.decrement).toBe(actions.decrement);
    expect(result.current.set).toBe(actions.set);
    expect(result.current.reset).toBe(actions.reset);
  });
});
