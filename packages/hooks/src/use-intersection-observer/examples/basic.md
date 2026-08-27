# use-intersection-observer

`useIntersectionObserver` tracks whether an element intersects the viewport or
another configured root.

## Example

```tsx
'use client';

import { useRef } from 'react';
import { useIntersectionObserver } from 'better-hooks/use-intersection-observer';

export function LazyPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(ref, {
    threshold: 0.25,
  });

  return <div ref={ref}>{isIntersecting ? 'Visible' : 'Waiting'}</div>;
}
```

## Behavior

The observer follows the current value of a ref and is rebuilt when the target
or native observer options change. SSR and browsers without
`IntersectionObserver` return `{ entry: null, isIntersecting: false }`.
Callback failures disconnect the observer before `onError` observes and the
original error is rethrown. Setup failures follow the same propagation rule.
