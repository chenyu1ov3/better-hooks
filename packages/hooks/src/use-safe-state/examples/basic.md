# use-safe-state

`useSafeState` provides React state whose setter quietly ignores updates after the component has unmounted.

## Example

```tsx
'use client';

import { useSafeState } from 'better-hooks/use-safe-state';

export function SafeCounter() {
  const [count, setCount] = useSafeState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
```

## Behavior

The setter has stable identity and supports value or functional updates. Calls made after unmount are no-ops, and functional updaters are not evaluated.
