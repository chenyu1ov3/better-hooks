# use-toggle

`useToggle` is a compact boolean state primitive whose stable action can invert the current value, set it explicitly, or apply a functional update.

## Example

```tsx
'use client';

import { useToggle } from 'better-hooks/use-toggle';

export function ShippingDisclosure() {
  const [open, toggle] = useToggle(false);

  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => toggle()}>
        {open ? 'Hide shipping details' : 'Show shipping details'}
      </button>
      {open ? (
        <div>
          <p>Orders usually leave the warehouse in two business days.</p>
          <button type="button" onClick={() => toggle(false)}>
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

## Behavior

The action identity stays stable across renders. Calling it without an argument inverts the latest state, while an explicit boolean sets the state directly. Functional updates compose in order within the same React batch.
