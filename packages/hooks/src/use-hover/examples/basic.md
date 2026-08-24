# use-hover

`useHover` returns whether a target is currently hovered and follows a ref if
its `current` element changes.

## Example

```tsx
'use client';

import { useRef } from 'react';
import { useHover } from 'better-hooks/use-hover';

export function HoverCard() {
  const ref = useRef<HTMLDivElement>(null);
  const hovering = useHover(ref, { onChange: (value) => console.log(value) });
  return <div ref={ref}>{hovering ? 'Hovered' : 'Move here'}</div>;
}
```

Set `enabled` to `false` to pause observation. Callback errors can be observed
with `onError` and are still rethrown.

## Behavior

Listeners follow a ref when its current target changes. A target change resets
the hover state and removes listeners from the previous target.
