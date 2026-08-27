# use-memoized-fn

`useMemoizedFn` keeps a function reference stable while each call uses the latest committed implementation. This lets long-lived subscriptions observe fresh state without being reinstalled.

## Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useMemoizedFn } from 'better-hooks/use-memoized-fn';

export function StableGreetingSubscription() {
  const [name, setName] = useState('Ada');
  const [message, setMessage] = useState('No greeting yet');
  const [events] = useState(() => new EventTarget());
  const greet = useMemoizedFn(() => setMessage(`Hello, ${name}`));

  useEffect(() => {
    events.addEventListener('greet', greet);
    return () => events.removeEventListener('greet', greet);
  }, [events, greet]);

  return (
    <div>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <button type="button" onClick={() => events.dispatchEvent(new Event('greet'))}>
        Dispatch greeting
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
```

## Behavior

The returned function keeps the same identity, so the effect above subscribes once. Its implementation is replaced after each successful commit, ensuring the event always reads the latest name without exposing callbacks from abandoned renders.
