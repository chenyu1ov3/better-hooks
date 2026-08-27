# use-timeout

`useTimeout` invokes the latest callback once after a delay and exposes cancellation and pending state. Remounting the notice below starts a fresh timer.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useTimeout } from 'better-hooks/use-timeout';

function Notice({ onDismiss }: { onDismiss: () => void }) {
  const timeout = useTimeout(onDismiss, 3000);

  return (
    <div role="status">
      <span>Settings saved</span>
      <button type="button" disabled={!timeout.pending} onClick={timeout.cancel}>
        Keep visible
      </button>
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>
      <output>{timeout.pending ? 'Closes in three seconds' : 'Auto-close cancelled'}</output>
    </div>
  );
}

export function ExpiringNotice() {
  const [visible, setVisible] = useState(true);

  return visible ? (
    <Notice onDismiss={() => setVisible(false)} />
  ) : (
    <button type="button" onClick={() => setVisible(true)}>
      Show notice again
    </button>
  );
}
```

## Behavior

Passing `null` disables scheduling. Changing `delay` replaces the timer, while changing only the callback keeps its original deadline and invokes the latest callback. `cancel` is stable, idempotent, and clears `pending`; unmounting always clears the timer.
