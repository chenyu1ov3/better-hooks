# use-hover

`useHover` reports whether a target is between native `mouseenter` and `mouseleave` events, and can observe each transition through fresh callbacks.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useHover } from 'better-hooks/use-hover';

export function HoverTarget() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [transitions, setTransitions] = useState(0);
  const hovering = useHover(targetRef, {
    onChange: () => setTransitions((value) => value + 1),
  });

  return (
    <div>
      <div
        ref={targetRef}
        style={{
          minHeight: 120,
          minWidth: 220,
          border: '1px solid currentColor',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {hovering ? 'Pointer is inside' : 'Pointer is outside'}
      </div>
      <output aria-live="polite">Hover transitions: {transitions}</output>
    </div>
  );
}
```

## Behavior

The Hook follows a ref when its current target changes, removing listeners from the old target and resetting state to false. `enabled: false` pauses observation. `onEnter`, `onLeave`, and `onChange` always use their latest committed implementations.
