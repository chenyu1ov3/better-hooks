// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useBoolean } from '../index.js';

describe('useBoolean', () => {
  it('exposes explicit actions', () => {
    const { result } = renderHook(() => useBoolean());
    act(() => result.current.setTrue());
    expect(result.current.value).toBe(true);
    act(() => result.current.setFalse());
    expect(result.current.boolean).toBe(false);
  });

  it('composes queued actions and keeps action references stable', () => {
    const { result } = renderHook(() => useBoolean(false), { wrapper: StrictMode });
    const { setTrue, setFalse, toggle } = result.current;

    act(() => {
      result.current.setTrue();
      result.current.toggle();
      result.current.toggle((value) => !value);
    });

    expect(result.current.value).toBe(true);
    expect(result.current.setTrue).toBe(setTrue);
    expect(result.current.setFalse).toBe(setFalse);
    expect(result.current.toggle).toBe(toggle);
  });
});
