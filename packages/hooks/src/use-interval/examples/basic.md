# use-interval

`useInterval` repeatedly invokes the latest callback at a selected delay. Passing `null` pauses the schedule without changing Hook order or clearing application state.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useInterval } from 'better-hooks/use-interval';

export function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useInterval(() => setSeconds((value) => value + 1), running ? 1000 : null);

  return (
    <div>
      <button type="button" aria-pressed={!running} onClick={() => setRunning((value) => !value)}>
        {running ? 'Pause' : 'Resume'}
      </button>
      <button type="button" onClick={() => setSeconds(0)}>
        Reset
      </button>
      <output aria-live="polite">Elapsed: {seconds}s</output>
    </div>
  );
}
```

## Behavior

Changing `delay` replaces the interval, but changing only the callback preserves its phase and uses the latest committed implementation. `null` stops it, callback failures stop it before rethrowing, and unmounting removes the native timer.
