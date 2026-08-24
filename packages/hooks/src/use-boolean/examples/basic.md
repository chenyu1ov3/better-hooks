# use-boolean

`useBoolean` provides named actions for boolean state. Use it when `setTrue` and `setFalse` make intent clearer than a tuple setter.

## Example

```tsx
'use client';

import { useBoolean } from 'better-hooks/use-boolean';

export function DetailsToggle() {
  const details = useBoolean();

  return (
    <div>
      <button type="button" onClick={details.setTrue}>
        Show
      </button>
      <button type="button" onClick={details.setFalse}>
        Hide
      </button>
      <button type="button" onClick={() => details.toggle()}>
        Toggle
      </button>
      <output>{details.value ? 'Visible' : 'Hidden'}</output>
    </div>
  );
}
```

## Behavior

All actions are stable across renders. `boolean` is an alias of `value`, and `toggle` accepts an explicit boolean or functional updater.
