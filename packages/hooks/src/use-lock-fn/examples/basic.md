# use-lock-fn

`useLockFn` keeps an async action from running concurrently. Calls made while
the first action is pending resolve to `undefined`; failures remain rejected.

## Example

```tsx
'use client';

import { useLockFn } from 'better-hooks/use-lock-fn';

export function SaveButton() {
  const save = useLockFn(async () => {
    await fetch('/api/save', { method: 'POST' });
  });
  return <button onClick={() => void save()}>Save</button>;
}
```

The lock is always released in `finally`, including when the action throws.

## Behavior

Calls received while the lock is held resolve to `undefined`. A rejected
action remains a rejected promise and can be observed with `onError`.
