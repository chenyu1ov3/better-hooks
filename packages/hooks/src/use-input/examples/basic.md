# use-input

`useInput` supplies value, change, clear, and reset behavior for text inputs and textareas. It can manage its own string value or request updates from a controlled owner.

## Example

```tsx
'use client';

import { useInput } from 'better-hooks/use-input';

export function NameField() {
  const name = useInput({ initialValue: 'Ada' });

  return (
    <div>
      <label>
        Name <input value={name.value} onChange={name.onChange} />
      </label>
      <button type="button" onClick={name.clear}>
        Clear
      </button>
      <button type="button" onClick={name.reset}>
        Reset
      </button>
      <output>{name.value}</output>
    </div>
  );
}
```

## Behavior

The initial value is captured once. Controlled or uncontrolled mode is fixed by the first render, and changing modes produces a development warning.
