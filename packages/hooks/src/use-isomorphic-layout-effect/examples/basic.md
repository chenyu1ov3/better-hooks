# use-isomorphic-layout-effect

`useIsomorphicLayoutEffect` uses layout-effect timing in a browser and ordinary effect timing during SSR. It is appropriate when committed layout must be measured before paint.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'better-hooks/use-isomorphic-layout-effect';

export function MeasuredLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [short, setShort] = useState(false);
  const [width, setWidth] = useState(0);
  const label = short ? 'Short label' : 'A longer label to measure';

  useIsomorphicLayoutEffect(() => {
    setWidth(labelRef.current?.getBoundingClientRect().width ?? 0);
  }, [label]);

  return (
    <div>
      <button type="button" onClick={() => setShort((value) => !value)}>
        Change label
      </button>
      <span ref={labelRef}>{label}</span>
      <output aria-live="polite">Measured width: {Math.round(width)}px</output>
    </div>
  );
}
```

## Behavior

The browser export aliases `useLayoutEffect`; the server export aliases `useEffect`, avoiding server layout-effect warnings without reading browser globals inside an effect. Use ordinary effects when pre-paint layout timing is unnecessary.
