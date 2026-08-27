# use-click-outside

`useClickOutside` handles captured pointer presses outside a referenced element. The separate inside and outside controls below make the boundary explicit.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useClickOutside } from 'better-hooks/use-click-outside';

export function DismissiblePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [insideActions, setInsideActions] = useState(0);
  const [dismissals, setDismissals] = useState(0);

  useClickOutside(
    panelRef,
    () => {
      setOpen(false);
      setDismissals((value) => value + 1);
    },
    { enabled: open },
  );

  return (
    <div>
      {open ? (
        <div ref={panelRef}>
          <span>Account panel</span>
          <button type="button" onClick={() => setInsideActions((value) => value + 1)}>
            Inside action
          </button>
        </div>
      ) : (
        <span>Panel dismissed</span>
      )}
      <button type="button" disabled={open} onClick={() => setOpen(true)}>
        Open panel
      </button>
      <button type="button">Outside target</button>
      <output>
        Inside actions: {insideActions}; outside dismissals: {dismissals}
      </output>
    </div>
  );
}
```

## Behavior

The listener uses the element's owner document and capture phase, so stopped bubbling cannot hide outside presses. The current ref target is checked for every event, disabled mode removes the binding, and composed paths preserve correct behavior across Shadow DOM.
