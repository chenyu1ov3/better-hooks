# use-resize-observer

`useResizeObserver` tracks an element's content rectangle and exposes its
current width and height.

## Example

```tsx
'use client';

import { useRef } from 'react';
import { useResizeObserver } from 'better-hooks/use-resize-observer';

export function MeasuredPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(ref, { box: 'border-box' });

  return (
    <div ref={ref}>
      {Math.round(width)} x {Math.round(height)}
    </div>
  );
}
```

## Behavior

The observer follows ref targets and is rebuilt when the target or `box` option
changes. SSR and browsers without `ResizeObserver` return
`{ rect: null, width: 0, height: 0 }`. Callback failures disconnect the
observer before `onError` observes and the original error is rethrown. Setup
failures follow the same propagation rule.
