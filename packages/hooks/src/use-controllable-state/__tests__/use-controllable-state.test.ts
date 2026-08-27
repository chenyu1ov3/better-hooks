// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useControllableState, type UseControllableStateOptions } from '../index.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useControllableState', () => {
  it('manages uncontrolled state and notifies changes', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }));
    act(() => result.current[1]((value) => (value ?? 0) + 1));
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('composes consecutive functional updates and ignores Object.is-equal values', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }));

    act(() => {
      result.current[1]((value) => value + 1);
      result.current[1]((value) => value + 1);
    });
    expect(result.current[0]).toBe(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 2);
    expect(onChange).toHaveBeenNthCalledWith(2, 3);

    act(() => result.current[1](3));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('evaluates a lazy uncontrolled default on initialization', () => {
    const initialize = vi.fn(() => ({ count: 1 }));
    const { result, rerender } = renderHook(() =>
      useControllableState({ defaultValue: initialize }),
    );

    expect(result.current[0]).toEqual({ count: 1 });
    expect(initialize).toHaveBeenCalledTimes(1);
    rerender();
    expect(initialize).toHaveBeenCalledTimes(1);
  });

  it('does not evaluate a lazy default in controlled mode', () => {
    const initialize = vi.fn(() => 2);
    const { result } = renderHook(
      () => useControllableState({ defaultValue: initialize, value: 1 }),
      { wrapper: StrictMode },
    );

    expect(result.current[0]).toBe(1);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('does not mutate controlled value locally', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, onChange }),
      { initialProps: { value: 1 } },
    );
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(2);
    rerender({ value: 2 });
    expect(result.current[0]).toBe(2);
  });

  it('treats an explicitly undefined value property as controlled', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useControllableState<number | undefined>({ value: undefined, onChange }),
    );

    act(() => result.current[1]((value) => (value ?? 0) + 1));

    expect(result.current[0]).toBeUndefined();
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('keeps an initially uncontrolled instance uncontrolled and warns once', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const initialProps: { options: UseControllableStateOptions<number> } = {
      options: { defaultValue: 1, onChange },
    };
    const { result, rerender } = renderHook(({ options }) => useControllableState(options), {
      initialProps,
      wrapper: StrictMode,
    });

    rerender({ options: { value: 10, onChange } });
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](2));
    expect(result.current[0]).toBe(2);

    rerender({ options: { value: 20, onChange } });
    expect(result.current[0]).toBe(2);
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('warns about mode changes when process is unavailable', () => {
    vi.stubGlobal('process', undefined);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const initialProps: { options: UseControllableStateOptions<number> } = {
      options: { defaultValue: 1 },
    };
    const { rerender } = renderHook(({ options }) => useControllableState(options), {
      initialProps,
    });

    rerender({ options: { value: 2 } });

    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('retains the last controlled commit when the value property disappears', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const initialProps: { options: UseControllableStateOptions<number> } = {
      options: { value: 1, onChange },
    };
    const { result, rerender } = renderHook(({ options }) => useControllableState(options), {
      initialProps,
      wrapper: StrictMode,
    });

    rerender({ options: { onChange } });
    expect(result.current[0]).toBe(1);
    act(() => result.current[1]((value) => (value ?? 0) + 1));
    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledWith(2);

    rerender({ options: { value: 3, onChange } });
    expect(result.current[0]).toBe(3);
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('uses the latest committed value and callback in later layout effects', () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();
    let layoutUpdate = false;
    const { result, rerender } = renderHook(
      ({ onChange, value }) => {
        const state = useControllableState({ value, onChange });
        const setValue = state[1];
        useLayoutEffect(() => {
          if (layoutUpdate) setValue((current) => (current ?? 0) + 1);
        }, [onChange, setValue, value]);
        return state;
      },
      { initialProps: { onChange: firstOnChange, value: 1 } },
    );
    const setter = result.current[1];

    layoutUpdate = true;
    rerender({ onChange: secondOnChange, value: 4 });

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledWith(5);
    expect(result.current[1]).toBe(setter);
  });
});
