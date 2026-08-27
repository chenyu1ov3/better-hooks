# use-throttle-fn

`useThrottleFn` limits a function to one leading call per time window while retaining the latest trailing arguments. Pointer movement makes both edges easy to observe.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useThrottleFn } from 'better-hooks/use-throttle-fn';

export function PointerPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const update = useThrottleFn((x: number, y: number) => setPosition({ x, y }), { delay: 150 });

  return (
    <div>
      <div
        style={{
          minHeight: 120,
          width: '100%',
          border: '1px dashed currentColor',
          touchAction: 'none',
        }}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          update.run(
            Math.round(event.clientX - bounds.left),
            Math.round(event.clientY - bounds.top),
          );
        }}
      >
        Pointer tracking area
      </div>
      <button type="button" disabled={!update.pending} onClick={update.flush}>
        Flush latest move
      </button>
      <button type="button" disabled={!update.pending} onClick={update.cancel}>
        Cancel trailing move
      </button>
      <output aria-live="polite">
        x: {position.x}, y: {position.y} {update.pending ? '(trailing move queued)' : ''}
      </output>
    </div>
  );
}
```

## Behavior

Leading and trailing calls default to enabled. Calls inside an open window replace the queued arguments; `flush` invokes the latest pair immediately, while `cancel` drops it and closes the window. Callback changes do not replace the stable controls.
