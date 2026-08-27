# use-input

`useInput` provides value, change, clear, and reset behavior for text inputs and textareas. It accepts both native change events and direct string updates.

## Example

```tsx
'use client';

import { useInput } from 'better-hooks/use-input';

export function DisplayNameField() {
  const name = useInput({ initialValue: 'Ada Lovelace' });

  return (
    <div>
      <label>
        Display name
        <input value={name.value} onChange={name.onChange} />
      </label>
      <button type="button" onClick={() => name.onChange('Grace Hopper')}>
        Use example
      </button>
      <button type="button" disabled={!name.value} onClick={name.clear}>
        Clear
      </button>
      <button type="button" onClick={name.reset}>
        Reset
      </button>
      <output aria-live="polite">{name.value.length} characters</output>
    </div>
  );
}
```

## Behavior

The initial value and controlled/uncontrolled mode are captured on the first render. In uncontrolled mode the Hook updates its own value; in controlled mode every action requests a change through `onChange`. Switching modes produces a development warning.
