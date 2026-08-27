# use-intersection-observer

`useIntersectionObserver` tracks an element relative to the viewport or a configured root. This example uses its own scroll container so the target can enter and leave predictably.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIntersectionObserver } from 'better-hooks/use-intersection-observer';

export function ScrollTarget() {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const observation = useIntersectionObserver(targetRef, { root, threshold: 0.75 });

  return (
    <div>
      <output aria-live="polite">
        Target: {observation.isIntersecting ? 'Intersecting' : 'Outside'}
      </output>
      <div
        ref={setRoot}
        style={{ height: 150, width: '100%', overflowY: 'auto', border: '1px solid currentColor' }}
      >
        <div style={{ height: 170, padding: 12 }}>Content before the target</div>
        <div ref={targetRef} style={{ minHeight: 80, padding: 12, background: 'ButtonFace' }}>
          Observed target
        </div>
        <div style={{ height: 170, padding: 12 }}>Content after the target</div>
      </div>
      {observation.error === undefined ? null : <output>Observer setup failed</output>}
    </div>
  );
}
```

## Behavior

The observer follows a ref's current element and rebuilds only when the target, root, margin, threshold contents, or enabled state changes. Disabling restores an empty snapshot. SSR and browsers without `IntersectionObserver` return `entry: null` and `isIntersecting: false` without throwing.
