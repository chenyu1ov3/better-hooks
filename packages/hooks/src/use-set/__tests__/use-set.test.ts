// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSet } from '../index.js';

describe('useSet', () => {
  it('adds, removes, toggles, and clears values', () => {
    const { result } = renderHook(() => useSet(['one']));

    act(() => {
      result.current[1].add('two');
      result.current[1].toggle('one');
      result.current[1].toggle('three');
    });

    expect([...result.current[0]]).toEqual(['two', 'three']);
    act(() => result.current[1].remove('two'));
    expect([...result.current[0]]).toEqual(['three']);
    act(() => result.current[1].clear());
    expect(result.current[0].size).toBe(0);
  });

  it('composes queued toggles from the latest set', () => {
    const { result } = renderHook(() => useSet<string>());

    act(() => {
      result.current[1].toggle('one');
      result.current[1].toggle('two');
      result.current[1].toggle('one');
    });

    expect([...result.current[0]]).toEqual(['two']);
  });

  it('captures a lazy initial set and restores it on reset', () => {
    const initializer = vi.fn(() => ['initial']);
    const { result } = renderHook(() => useSet(initializer));

    expect(initializer).toHaveBeenCalledOnce();
    act(() => result.current[1].add('temporary'));
    act(() => result.current[1].reset());

    expect([...result.current[0]]).toEqual(['initial']);
  });

  it('preserves the snapshot and action references for no-op updates', () => {
    const { result, rerender } = renderHook(() => useSet(['one']));
    const initialSnapshot = result.current[0];
    const actions = result.current[1];

    act(() => {
      actions.add('one');
      actions.remove('missing');
      actions.reset();
    });

    expect(result.current[0]).toBe(initialSnapshot);
    expect(result.current[1]).toBe(actions);
    rerender();
    expect(result.current[0]).toBe(initialSnapshot);
    expect(result.current[1]).toBe(actions);
  });
});
