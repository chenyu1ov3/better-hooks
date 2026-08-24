// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import {
  createElement,
  StrictMode,
  Suspense,
  useLayoutEffect,
  type PropsWithChildren,
} from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useMemoizedFn } from '../index.js';

describe('useMemoizedFn', () => {
  it('keeps a stable identity and invokes the latest committed callback', () => {
    const first = vi.fn((value: number) => value + 1);
    const second = vi.fn((value: number) => value + 2);
    const { result, rerender } = renderHook(({ callback }) => useMemoizedFn(callback), {
      initialProps: { callback: first },
      wrapper: StrictMode,
    });
    const memoized = result.current;

    expect(memoized(1)).toBe(2);
    rerender({ callback: second });

    expect(result.current).toBe(memoized);
    expect(result.current(1)).toBe(3);
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('publishes the callback before later layout effects', () => {
    let observed = '';
    const { rerender } = renderHook(
      ({ value }) => {
        const memoized = useMemoizedFn(() => value);
        useLayoutEffect(() => {
          observed = memoized();
        }, [memoized, value]);
        return memoized;
      },
      { initialProps: { value: 'first' } },
    );

    rerender({ value: 'second' });
    expect(observed).toBe('second');
  });

  it('does not publish a callback from a suspended render', () => {
    const pending = new Promise<never>(() => undefined);
    const committed = vi.fn(() => 'committed');
    const abandoned = vi.fn(() => 'abandoned');
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(Suspense, { fallback: null }, children);
    const { result, rerender } = renderHook(
      ({ callback, suspend }) => {
        const memoized = useMemoizedFn(callback);
        if (suspend) throw pending;
        return memoized;
      },
      { initialProps: { callback: committed, suspend: false }, wrapper },
    );

    rerender({ callback: abandoned, suspend: true });
    expect(result.current()).toBe('committed');
    expect(committed).toHaveBeenCalledOnce();
    expect(abandoned).not.toHaveBeenCalled();

    rerender({ callback: abandoned, suspend: false });
    act(() => result.current());
    expect(abandoned).toHaveBeenCalledOnce();
  });
});
