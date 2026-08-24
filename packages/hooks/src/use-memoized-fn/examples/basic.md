# use-memoized-fn

`useMemoizedFn` keeps a callback reference stable while making each call use the latest committed implementation.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useMemoizedFn } from 'better-hooks/use-memoized-fn';

export function MemoizedGreeting() {
  const [name, setName] = useState('Ada');
  const greet = useMemoizedFn(() => window.alert(`Hello, ${name}`));

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" onClick={greet}>
        Greet
      </button>
    </div>
  );
}
```

## Behavior

The returned function keeps the same identity across renders. Its callback is replaced after commit, so abandoned concurrent renders cannot change what it invokes.
