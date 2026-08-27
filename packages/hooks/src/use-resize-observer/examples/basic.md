# use-resize-observer

`useResizeObserver` reports an element's latest content rectangle. The measurement is rendered outside the observed box so the result cannot resize its own target.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useResizeObserver } from 'better-hooks/use-resize-observer';

export function ResizablePanel() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(60);
  const measurement = useResizeObserver(targetRef);

  return (
    <div>
      <label>
        Panel width
        <input
          type="range"
          min="30"
          max="100"
          value={size}
          onChange={(event) => setSize(event.currentTarget.valueAsNumber)}
        />
      </label>
      <div
        ref={targetRef}
        style={{
          boxSizing: 'border-box',
          width: `${size}%`,
          height: 72,
          border: '1px solid currentColor',
        }}
      >
        Observed panel
      </div>
      <output aria-live="polite">
        {measurement.rect
          ? `${Math.round(measurement.width)} x ${Math.round(measurement.height)}`
          : 'Waiting for first measurement'}
      </output>
      {measurement.error === undefined ? null : <output>Observer setup failed</output>}
    </div>
  );
}
```

## Behavior

The observer follows ref targets and rebuilds when the target, `box`, or enabled state changes. Width and height are normalized from the native `contentRect`; disabling, SSR, and unsupported browsers return an empty zero-sized snapshot. Setup and callback failures are exposed in `error` and through `onError`.
