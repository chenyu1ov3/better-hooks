# use-event-listener

`useEventListener` subscribes to a native EventTarget with a callback that stays fresh without reinstalling the listener. It supports the window shorthand, explicit targets, and refs.

## Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useEventListener } from 'better-hook/use-event-listener';

export function ViewportWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => setWidth(window.innerWidth), []);
  useEventListener('resize', () => setWidth(window.innerWidth), { passive: true });
  return <output>{width}px</output>;
}
```

## Behavior

Changing a callback does not reinstall the listener. Changing the target, event type, capture, passive, once, or signal option rebinds it, and unmounting always removes it.
