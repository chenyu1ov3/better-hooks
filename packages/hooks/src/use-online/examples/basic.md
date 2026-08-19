# use-online

`useOnline` reports the browser's current connectivity hint and updates for online and offline events. It is suitable for UI messaging, not for proving that a server is reachable.

## Example

```tsx
'use client';

import { useOnline } from 'better-hook/use-online';

export function ConnectionStatus() {
  const online = useOnline();
  return <output aria-live="polite">{online ? 'Online' : 'Offline'}</output>;
}
```

## Behavior

All Hook instances in one window share a single online/offline listener pair. The server snapshot is `true`, and repeated events with no value change preserve the current result.
