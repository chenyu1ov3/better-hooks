# use-reset-state

`useResetState` adds a stable reset action that restores the state captured during the first initialization.

## Example

```tsx
'use client';

import { useResetState } from 'better-hooks/use-reset-state';

export function ResettableCounter() {
  const [count, setCount, resetCount] = useResetState(0);

  return (
    <div>
      <output>{count}</output>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Increment
      </button>
      <button type="button" onClick={resetCount}>
        Reset
      </button>
    </div>
  );
}
```

## Behavior

`resetCount` keeps a stable identity and restores the first resolved initial value, even when a later render receives a different initializer.
