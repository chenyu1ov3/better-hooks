# use-set

`useSet` keeps a readonly Set snapshot with stable add, remove, toggle, clear, and reset actions.

## Example

```tsx
'use client';

import { useSet } from 'better-hooks/use-set';

export function SetExample() {
  const [selected, actions] = useSet<string>(['selected']);

  return (
    <div>
      <output>{selected.has('selected') ? 'Selected' : 'Empty'}</output>
      <button type="button" onClick={() => actions.toggle('selected')}>
        Toggle
      </button>
      <button type="button" onClick={actions.reset}>
        Reset
      </button>
    </div>
  );
}
```

## Behavior

The initial values are copied once. Adding an existing value or removing a missing value preserves the current snapshot reference. `toggle` composes from the latest queued Set state.
