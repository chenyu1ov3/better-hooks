# use-throttle-fn

`useThrottleFn` limits a function to at most one invocation per time window while retaining the latest callback. It exposes the same run, cancel, flush, and pending controls as `useDebounceFn`.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useThrottleFn } from 'better-hooks/use-throttle-fn';

export function PointerPosition() {
  const [x, setX] = useState(0);
  const update = useThrottleFn((nextX: number) => setX(nextX), { delay: 100 });

  return (
    <div onPointerMove={(event) => update.run(event.clientX)}>
      Move the pointer here. <output>{x}px</output>
    </div>
  );
}
```

## Behavior

Leading and trailing calls default to enabled. Disabling trailing drops queued tail work, and callback errors or unmounting still leave the scheduler fully cleaned up.
