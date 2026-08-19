// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import {
  createElement,
  StrictMode,
  Suspense,
  useLayoutEffect,
  type PropsWithChildren,
} from 'react';
import { describe, expect, it } from 'vitest';
import { useLatest } from '../index.js';

describe('useLatest', () => {
  it('updates after commit', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 'a' },
    });
    expect(result.current.current).toBe('a');
    rerender({ value: 'b' });
    expect(result.current.current).toBe('b');
  });

  it('publishes the committed value before later layout effects', () => {
    let observed = '';
    const { result, rerender } = renderHook(
      ({ value }) => {
        const latest = useLatest(value);
        useLayoutEffect(() => {
          observed = latest.current;
        }, [latest, value]);
        return latest;
      },
      { initialProps: { value: 'first' }, wrapper: StrictMode },
    );
    const latest = result.current;

    rerender({ value: 'second' });

    expect(observed).toBe('second');
    expect(result.current).toBe(latest);
  });

  it('does not publish a value from a suspended render', () => {
    const pending = new Promise<never>(() => undefined);
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(Suspense, { fallback: null }, children);
    const { result, rerender } = renderHook(
      ({ suspend, value }) => {
        const latest = useLatest(value);
        if (suspend) throw pending;
        return latest;
      },
      { initialProps: { suspend: false, value: 'committed' }, wrapper },
    );

    rerender({ suspend: true, value: 'abandoned' });
    expect(result.current.current).toBe('committed');

    rerender({ suspend: false, value: 'next commit' });
    expect(result.current.current).toBe('next commit');
  });
});
