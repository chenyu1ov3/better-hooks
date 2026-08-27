# use-window-size

`useWindowSize` returns a shared snapshot of the browser viewport in CSS pixels. It is intended for rendering decisions that cannot be expressed with CSS alone.

## Example

```tsx
'use client';

import { useWindowSize } from 'better-hooks/use-window-size';

export function ViewportDimensions() {
  const { width, height } = useWindowSize();
  const orientation = width >= height ? 'Landscape' : 'Portrait';

  return (
    <div>
      <output aria-live="polite">
        {width} x {height}
      </output>
      <span>{orientation}</span>
    </div>
  );
}
```

## Behavior

All Hook instances in one window share a single resize listener. Equal dimensions preserve the snapshot reference, invalid measurements normalize to zero, and the final subscriber removes the listener. SSR deterministically returns `{ width: 0, height: 0 }`.
