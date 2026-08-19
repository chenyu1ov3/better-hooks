# use-is-mounted

`useIsMounted` returns a stable function that reports whether its component is currently committed. It can guard delayed work that is not otherwise cancellable.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useIsMounted } from 'better-hook/use-is-mounted';

export function DelayedStatus() {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState('idle');

  const load = async () => {
    setStatus('loading');
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    if (isMounted()) setStatus('ready');
  };

  return (
    <button type="button" onClick={() => void load()}>
      {status}
    </button>
  );
}
```

## Behavior

The returned function keeps the same identity. It is true after the browser commit, including from later layout effects, and false after cleanup.
