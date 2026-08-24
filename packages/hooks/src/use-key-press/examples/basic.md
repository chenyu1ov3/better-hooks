# use-key-press

`useKeyPress` observes keyboard events and accepts key names, legacy numeric
key codes, alternative arrays, predicates, and modifier combinations.

## Example

```tsx
'use client';

import { useKeyPress } from 'better-hooks/use-key-press';

export function Shortcuts() {
  useKeyPress('ctrl.s', (event) => {
    event.preventDefault();
    console.log('save');
  });
  return null;
}
```

Use `target` or `ref` for a scoped listener, `enabled` to pause it, and
`capture` when the event must be observed during capture. Handler failures are
reported to `onError` and then rethrown.

## Behavior

Filters are evaluated against the latest committed event and handler. Native
listeners are removed when the target, event list, or capture mode changes.
