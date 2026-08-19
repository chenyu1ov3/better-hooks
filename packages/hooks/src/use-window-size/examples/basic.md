# use-window-size

`useWindowSize` returns a shared snapshot of the current viewport width and height. It is useful when rendering logic genuinely depends on viewport dimensions.

## Example

```tsx
'use client';

import { useWindowSize } from 'better-hook/use-window-size';

export function ViewportDimensions() {
  const { width, height } = useWindowSize();
  return (
    <output>
      {width} x {height}
    </output>
  );
}
```

## Behavior

Subscribers in one window share a single resize listener. Equal dimensions preserve the snapshot reference, the last unmount removes the listener, and SSR returns `{ width: 0, height: 0 }`.
