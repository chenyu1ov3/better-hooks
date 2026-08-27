# use-is-mounted

`useIsMounted` returns a stable function that reports whether its component is currently committed. The child below checks it before updating after non-cancellable work.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useIsMounted } from 'better-hooks/use-is-mounted';

function DelayedTask({ onResult }: { onResult: (message: string) => void }) {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState('Idle');

  const start = () => {
    setStatus('Waiting...');
    window.setTimeout(() => {
      if (!isMounted()) {
        onResult('Child was removed; state update skipped');
        return;
      }
      setStatus('Finished');
      onResult('Task finished while child was mounted');
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function MountedTaskGuard() {
  const [showChild, setShowChild] = useState(true);
  const [result, setResult] = useState('No task started');

  return (
    <div>
      {showChild ? <DelayedTask onResult={setResult} /> : <span>Child removed</span>}
      <button type="button" onClick={() => setShowChild((value) => !value)}>
        {showChild ? 'Remove child' : 'Mount child'}
      </button>
      <output aria-live="polite">{result}</output>
    </div>
  );
}
```

## Behavior

The returned function keeps a stable identity, reads `true` after the component commits, and reads `false` during and after unmount cleanup. Prefer cancelling asynchronous work when possible; use the guard when a callback cannot be cancelled or still needs explicit branching.
