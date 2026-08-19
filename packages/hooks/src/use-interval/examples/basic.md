# use-interval

`useInterval` repeatedly invokes the latest callback at a chosen delay. Passing `null` pauses the interval without changing Hook order.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useInterval } from 'better-hook/use-interval';

export function CounterClock() {
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  useInterval(() => setCount((value) => value + 1), paused ? null : 1000);

  return (
    <button type="button" onClick={() => setPaused((value) => !value)}>
      {paused ? 'Resume' : `Pause at ${count}`}
    </button>
  );
}
```

## Behavior

Changing the delay restarts one interval, while changing only the callback keeps its current phase. Zero and invalid numeric delays are normalized consistently.
