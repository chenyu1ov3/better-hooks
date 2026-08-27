# use-latest

`useLatest` returns a stable ref containing the latest committed value. Delayed callbacks can read it instead of retaining the value from the render that scheduled them.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useLatest } from 'better-hooks/use-latest';

export function DelayedCountReport() {
  const [count, setCount] = useState(0);
  const [report, setReport] = useState('No report scheduled');
  const latestCount = useLatest(count);

  const reportLater = () => {
    setReport('Waiting for one second...');
    window.setTimeout(() => {
      setReport(`Latest committed count: ${latestCount.current}`);
    }, 1000);
  };

  return (
    <div>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </button>
      <button type="button" onClick={reportLater}>
        Report later
      </button>
      <output aria-live="polite">{report}</output>
    </div>
  );
}
```

## Behavior

The ref object never changes. Its `current` value is published after a successful commit and before later layout effects, preventing abandoned concurrent renders from leaking speculative values.
