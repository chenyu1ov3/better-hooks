// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { createElement, StrictMode, Suspense, useState, type PropsWithChildren } from 'react';
import { describe, expect, it } from 'vitest';
import { usePrevious } from '../index.js';

describe('usePrevious', () => {
  it('returns the previous committed value', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ value: 2 });
    expect(result.current).toBe(1);
  });

  it('returns the initial fallback only before the first commit', () => {
    const { result, rerender } = renderHook(({ initial, value }) => usePrevious(value, initial), {
      initialProps: { initial: 'fallback', value: 'first' },
    });

    expect(result.current).toBe('fallback');
    rerender({ initial: 'changed', value: 'second' });
    expect(result.current).toBe('first');
  });

  it('tracks only committed batched state', () => {
    const { result } = renderHook(
      () => {
        const [value, setValue] = useState(1);
        return { previous: usePrevious(value), setValue };
      },
      { wrapper: StrictMode },
    );

    act(() => {
      result.current.setValue(2);
      result.current.setValue(3);
    });
    expect(result.current.previous).toBe(1);

    act(() => result.current.setValue(4));
    expect(result.current.previous).toBe(3);
  });

  it('does not retain a value from a suspended render', () => {
    const pending = new Promise<never>(() => undefined);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(Suspense, { fallback: null }, children);
    const { result, rerender } = renderHook(
      ({ suspend, value }) => {
        const previous = usePrevious(value);
        if (suspend) throw pending;
        return previous;
      },
      { initialProps: { suspend: false, value: 1 }, wrapper },
    );

    rerender({ suspend: true, value: 2 });
    rerender({ suspend: false, value: 3 });

    expect(result.current).toBe(1);
  });
});
