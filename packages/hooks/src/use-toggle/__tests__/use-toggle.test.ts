// @vitest-environment jsdom

import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useToggle } from '../index.js';

describe('useToggle', () => {
  it('toggles and supports explicit and functional values', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]((value) => !value));
    expect(result.current[0]).toBe(true);
  });

  it('composes batched updates from the latest queued value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1]();
      result.current[1]();
      result.current[1]((value) => !value);
    });

    expect(result.current[0]).toBe(true);
  });

  it('captures the initial value only on the first render', () => {
    const { result, rerender } = renderHook(({ initial }) => useToggle(initial), {
      initialProps: { initial: false },
    });

    rerender({ initial: true });
    expect(result.current[0]).toBe(false);
  });

  it('keeps the action stable under StrictMode', () => {
    const { result, rerender } = renderHook(() => useToggle(), { wrapper: StrictMode });
    const action = result.current[1];
    rerender();
    expect(result.current[1]).toBe(action);
  });
});
