# use-click-outside

`useClickOutside` invokes a callback when a pointer is pressed outside a referenced element. It is intended for popovers, menus, and dismissible panels.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useClickOutside } from 'better-hook/use-click-outside';

export function DismissiblePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  useClickOutside(panelRef, () => setOpen(false), open);

  return open ? (
    <div ref={panelRef}>
      <p>Account settings</p>
      <button type="button" onClick={() => setOpen(false)}>
        Close
      </button>
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)}>
      Open panel
    </button>
  );
}
```

## Behavior

The listener uses the element's document and capture phase, so stopped bubbling does not hide outside presses. Events inside Shadow DOM are checked through their composed path.
