# use-toggle

`useToggle` is a compact boolean state primitive with a stable action. The action can invert the value, set it explicitly, or apply a functional update.

## Example

```tsx
'use client';

import { useToggle } from 'better-hooks/use-toggle';

export function Disclosure() {
  const [open, toggle] = useToggle(false);

  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => toggle()}>
        {open ? 'Hide details' : 'Show details'}
      </button>
      {open ? <p>Additional details</p> : null}
    </div>
  );
}
```

## Behavior

The action identity stays stable across renders. Multiple functional updates in one React batch are applied in order against the latest queued value.
