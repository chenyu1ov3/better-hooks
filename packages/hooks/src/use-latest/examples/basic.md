# use-latest

`useLatest` returns a stable ref containing the latest committed value. It is useful inside delayed callbacks that should not capture an older render.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useLatest } from 'better-hooks/use-latest';

export function LatestCounter() {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  const reportLater = () => {
    setTimeout(() => window.alert(`Latest count: ${latestCount.current}`), 1000);
  };

  return (
    <div>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        {count}
      </button>
      <button type="button" onClick={reportLater}>
        Report later
      </button>
    </div>
  );
}
```

## Behavior

The ref identity never changes. Its value updates after a successful commit and before later layout effects, so abandoned concurrent renders cannot leak speculative values.
