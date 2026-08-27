# use-event-listener

`useEventListener` subscribes to a native `EventTarget` while keeping the callback fresh without reinstalling the listener. A ref target keeps this demo contained inside its preview.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useEventListener } from 'better-hooks/use-event-listener';

export function NativeClickCounter() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [clicks, setClicks] = useState(0);

  useEventListener(buttonRef, 'click', () => {
    setClicks((value) => value + 1);
  });

  return (
    <div>
      <button ref={buttonRef} type="button">
        Native event target
      </button>
      <output aria-live="polite">Native clicks: {clicks}</output>
    </div>
  );
}
```

## Behavior

The Hook resolves direct targets and ref-like targets after each commit. Callback changes are published without rebinding; target, event type, capture, passive, once, or signal changes install a matching native listener. Unmounting always removes the active binding.
