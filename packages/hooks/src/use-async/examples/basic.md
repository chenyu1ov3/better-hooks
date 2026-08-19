# use-async

`useAsync` runs synchronous or asynchronous work while exposing status, result, and error state. This self-contained task also demonstrates cancellation without relying on an external API.

## Example

```tsx
'use client';

import { useAsync } from 'better-hook/use-async';

function loadProfile(signal: AbortSignal) {
  return new Promise<{ name: string }>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve({ name: 'Ada Lovelace' });
    }, 900);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new Error('The profile load was cancelled'));
    };

    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function ProfileLoader() {
  const request = useAsync(loadProfile);
  const handleLoad = () => {
    void request.run().catch(() => undefined);
  };

  return (
    <div>
      <button type="button" disabled={request.status === 'pending'} onClick={handleLoad}>
        Load
      </button>
      <button type="button" disabled={request.status !== 'pending'} onClick={request.cancel}>
        Cancel
      </button>
      <output>{request.data?.name ?? (request.status === 'pending' ? 'Loading…' : 'Ready')}</output>
    </div>
  );
}
```

## Behavior

Starting a run aborts the previous run, and stale results cannot replace newer state. `cancel` keeps existing data while returning to idle; `reset` also clears data and errors.
