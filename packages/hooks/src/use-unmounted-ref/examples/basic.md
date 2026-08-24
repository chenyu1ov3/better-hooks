# use-unmounted-ref

`useUnmountedRef` exposes a stable ref for guarding asynchronous work that may finish after a component unmounts.

## Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useUnmountedRef } from 'better-hook/use-unmounted-ref';

export function AsyncStatus() {
  const [ready, setReady] = useState(false);
  const unmountedRef = useUnmountedRef();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!unmountedRef.current) setReady(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [unmountedRef]);

  return <output>{ready ? 'Ready' : 'Waiting'}</output>;
}
```

## Behavior

The ref starts as `false`, remains stable across renders, and becomes `true` during unmount cleanup. It stays `false` during server rendering.
