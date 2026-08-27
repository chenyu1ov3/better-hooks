# use-safe-state

`useSafeState` behaves like React state while mounted, then turns its setter into a no-op after unmount. The delayed callback below is intentionally left running so the child can be removed first.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useSafeState } from 'better-hooks/use-safe-state';

function DelayedTask({ onFinish }: { onFinish: () => void }) {
  const [status, setStatus] = useSafeState('Idle');

  const start = () => {
    setStatus('Waiting...');
    window.setTimeout(() => {
      setStatus('Finished');
      onFinish();
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function SafeDelayedState() {
  const [mounted, setMounted] = useState(true);
  const [completed, setCompleted] = useState(0);

  return (
    <div>
      {mounted ? (
        <DelayedTask onFinish={() => setCompleted((value) => value + 1)} />
      ) : (
        <span>Child removed</span>
      )}
      <button type="button" onClick={() => setMounted((value) => !value)}>
        {mounted ? 'Remove child' : 'Mount child'}
      </button>
      <output aria-live="polite">Delayed callbacks completed: {completed}</output>
    </div>
  );
}
```

## Behavior

While mounted, the setter supports direct and functional updates with a stable identity. After unmount it ignores calls entirely, including functional updater evaluation. Cancel work when possible; use this guard for callbacks that cannot be cancelled reliably.
