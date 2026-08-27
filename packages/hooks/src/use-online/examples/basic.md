# use-online

`useOnline` reports the browser's current connectivity hint and reacts to native online and offline events. It is suitable for UI status, not for proving that an application server is reachable.

## Example

```tsx
'use client';

import { useOnline } from 'better-hooks/use-online';

export function ConnectionStatus() {
  const online = useOnline();

  return (
    <div>
      <output role="status" aria-live="polite">
        Connection: {online ? 'Online' : 'Offline'}
      </output>
      <span>{online ? 'Network requests may proceed' : 'Changes can be queued locally'}</span>
    </div>
  );
}
```

## Behavior

Hook instances in one window share one online/offline listener pair. The client snapshot follows `navigator.onLine`; inaccessible navigator state and SSR default to `true`. Repeated events that do not change the value do not notify React.
