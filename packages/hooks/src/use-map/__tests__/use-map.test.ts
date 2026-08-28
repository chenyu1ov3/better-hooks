// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMap } from '../index.js';

describe('useMap', () => {
  it('initializes entries and applies immutable actions', () => {
    const { result } = renderHook(() => useMap<string, number>([['one', 1]]));
    const initialMap = result.current[0];

    act(() => {
      result.current[1].set('two', 2);
      result.current[1].set('one', 3);
    });

    expect([...result.current[0].entries()]).toEqual([
      ['one', 3],
      ['two', 2],
    ]);
    expect(result.current[0]).not.toBe(initialMap);

    act(() => result.current[1].remove('one'));
    expect([...result.current[0].entries()]).toEqual([['two', 2]]);
    act(() => result.current[1].clear());
    expect(result.current[0].size).toBe(0);
  });

  it('supports replacement, reset, and lazy initializers', () => {
    const initializer = vi.fn(() => [['initial', 1] as const]);
    const { result } = renderHook(() => useMap<string, number>(initializer));

    expect(initializer).toHaveBeenCalledOnce();
    act(() => result.current[1].setAll([['replacement', 2]]));
    expect([...result.current[0].entries()]).toEqual([['replacement', 2]]);
    act(() => result.current[1].reset());
    expect([...result.current[0].entries()]).toEqual([['initial', 1]]);
  });

  it('preserves the snapshot and action references for no-op updates', () => {
    const { result, rerender } = renderHook(() => useMap<string, number>([['one', 1]]));
    const initialSnapshot = result.current[0];
    const actions = result.current[1];

    act(() => {
      actions.set('one', 1);
      actions.remove('missing');
    });

    expect(result.current[0]).toBe(initialSnapshot);
    expect(result.current[1]).toBe(actions);
    rerender();
    expect(result.current[0]).toBe(initialSnapshot);
    expect(result.current[1]).toBe(actions);
  });

  it('captures an independent reset snapshot', () => {
    const initial = new Map([['one', 1]]);
    const { result } = renderHook(() => useMap(initial));
    initial.set('one', 99);

    act(() => result.current[1].set('one', 2));
    act(() => result.current[1].reset());

    expect(result.current[0].get('one')).toBe(1);
  });
});
