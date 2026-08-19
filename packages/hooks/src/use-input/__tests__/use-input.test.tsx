import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInput, type UseInputOptions } from '../index.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function InputHarness({
  element,
  onChange,
}: {
  readonly element: 'input' | 'textarea';
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const input = useInput({ initialValue: 'hello', onChange });
  return element === 'input' ? (
    <input aria-label="field" value={input.value} onChange={input.onChange} />
  ) : (
    <textarea aria-label="field" value={input.value} onChange={input.onChange} />
  );
}

describe('useInput', () => {
  it('supports value updates, clear and reset', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useInput({ initialValue: 'hello', onChange }));
    act(() => result.current.onChange('world'));
    expect(result.current.value).toBe('world');
    act(() => result.current.clear());
    expect(result.current.value).toBe('');
    act(() => result.current.reset());
    expect(result.current.value).toBe('hello');
    expect(onChange).toHaveBeenCalledWith('world');
  });

  it('handles real input and textarea change events', () => {
    const onChange = vi.fn();
    const view = render(<InputHarness element="input" onChange={onChange} />);

    fireEvent.change(view.getByLabelText('field'), { target: { value: 'input value' } });
    expect(view.getByLabelText('field')).toHaveValue('input value');

    view.rerender(<InputHarness element="textarea" onChange={onChange} />);
    fireEvent.change(view.getByLabelText('field'), { target: { value: 'textarea value' } });
    expect(view.getByLabelText('field')).toHaveValue('textarea value');
    expect(onChange).toHaveBeenNthCalledWith(1, 'input value');
    expect(onChange).toHaveBeenNthCalledWith(2, 'textarea value');
  });

  it('captures the initial value and keeps all actions stable', () => {
    const initialProps: { options: UseInputOptions } = { options: { initialValue: 'first' } };
    const { result, rerender } = renderHook(({ options }) => useInput(options), {
      initialProps,
    });
    const actions = {
      clear: result.current.clear,
      onChange: result.current.onChange,
      reset: result.current.reset,
    };

    act(() => result.current.onChange('changed'));
    rerender({ options: { initialValue: 'later' } });
    act(() => result.current.reset());

    expect(result.current.value).toBe('first');
    expect(result.current.clear).toBe(actions.clear);
    expect(result.current.onChange).toBe(actions.onChange);
    expect(result.current.reset).toBe(actions.reset);
  });

  it('keeps an initially uncontrolled input uncontrolled and warns once', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const initialProps: { options: UseInputOptions } = {
      options: { initialValue: 'local', onChange },
    };
    const { result, rerender } = renderHook(({ options }) => useInput(options), {
      initialProps,
      wrapper: StrictMode,
    });

    rerender({ options: { value: 'external', onChange } });
    expect(result.current.value).toBe('local');
    act(() => result.current.onChange('next'));
    expect(result.current.value).toBe('next');

    rerender({ options: { value: 'another', onChange } });
    expect(result.current.value).toBe('next');
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('warns about mode changes when process is unavailable', () => {
    vi.stubGlobal('process', undefined);
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const initialProps: { options: UseInputOptions } = {
      options: { initialValue: 'local' },
    };
    const { rerender } = renderHook(({ options }) => useInput(options), { initialProps });

    rerender({ options: { value: 'external' } });

    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('retains the last controlled value when a defined value disappears', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const initialProps: { options: UseInputOptions } = {
      options: { value: 'owned', onChange },
    };
    const { result, rerender } = renderHook(({ options }) => useInput(options), {
      initialProps,
      wrapper: StrictMode,
    });

    rerender({ options: { onChange } });
    expect(result.current.value).toBe('owned');
    act(() => result.current.clear());
    expect(result.current.value).toBe('owned');
    expect(onChange).toHaveBeenCalledWith('');

    rerender({ options: { value: 'returned', onChange } });
    expect(result.current.value).toBe('returned');
    expect(warning).toHaveBeenCalledTimes(1);
  });

  it('uses the latest change callback in a later layout effect', () => {
    const firstOnChange = vi.fn();
    const secondOnChange = vi.fn();
    let updateInLayout = false;
    const { result, rerender } = renderHook(
      ({ onChange }) => {
        const input = useInput({ onChange });
        const change = input.onChange;
        useLayoutEffect(() => {
          if (updateInLayout) change('layout');
        }, [change, onChange]);
        return input;
      },
      { initialProps: { onChange: firstOnChange } },
    );
    const onChange = result.current.onChange;

    updateInLayout = true;
    rerender({ onChange: secondOnChange });

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledWith('layout');
    expect(result.current.onChange).toBe(onChange);
  });
});
