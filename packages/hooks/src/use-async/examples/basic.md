# use-async

`useAsync` runs abort-aware work while exposing status, retained data, errors, and stable controls. This example uses a local delayed task so it works without an application API.

## Example

```tsx
'use client';

import { useAsync } from 'better-hooks/use-async';

function loadProfile(signal: AbortSignal) {
  return new Promise<{ name: string; role: string }>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Profile load cancelled', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve({ name: 'Ada Lovelace', role: 'Mathematician' });
    }, 1200);

    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function ProfileLoader() {
  const request = useAsync(loadProfile);

  const run = () => {
    void request.run().catch(() => undefined);
  };

  return (
    <div>
      <button type="button" onClick={run}>
        {request.status === 'pending' ? 'Restart load' : 'Load profile'}
      </button>
      <button type="button" disabled={request.status !== 'pending'} onClick={request.cancel}>
        Cancel
      </button>
      <button
        type="button"
        disabled={request.status === 'idle' && !request.data}
        onClick={request.reset}
      >
        Reset
      </button>
      <output aria-live="polite">Status: {request.status}</output>
      <output>
        {request.data
          ? `${request.data.name} · ${request.data.role}`
          : request.error instanceof Error
            ? request.error.message
            : 'No profile loaded'}
      </output>
    </div>
  );
}
```

## Behavior

Each `run` aborts the previous controller and ignores stale state updates while preserving the returned promise's result or rejection. `cancel` keeps existing data and returns to idle; `reset` also clears data and errors. Expected cancellation errors are not reported through `onError`.
