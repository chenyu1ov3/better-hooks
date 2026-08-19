# use-isomorphic-layout-effect

`useIsomorphicLayoutEffect` behaves like `useLayoutEffect` in a browser and `useEffect` during server rendering. Use it only when committed layout must be read before paint.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'better-hook/use-isomorphic-layout-effect';

export function MeasuredLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    setWidth(labelRef.current?.getBoundingClientRect().width ?? 0);
  }, []);

  return <span ref={labelRef}>Measured width: {Math.round(width)}px</span>;
}
```

## Behavior

The server branch avoids layout-effect warnings and does not access browser globals at import time. Prefer ordinary effects when layout timing is unnecessary.
