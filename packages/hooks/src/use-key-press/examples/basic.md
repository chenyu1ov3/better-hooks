# use-key-press

`useKeyPress` observes keyboard events and accepts key names, legacy numeric
key codes, arrays of alternatives, predicates, and string modifier combinations.

## Example

```tsx
'use client';

import { useKeyPress } from 'better-hooks/use-key-press';

export function Shortcuts() {
  useKeyPress(['Escape', 'Enter'], (_event, key) => {
    console.log(`pressed ${key}`);
  });

  useKeyPress('ctrl+s', (event) => {
    event.preventDefault();
    console.log('save');
  });
  return null;
}
```

Use `target` or `ref` for a scoped listener, `enabled` to pause it, and
`capture` when the event must be observed during capture. Handler failures are
reported to `onError` and then rethrown.

Arrays always describe independent alternatives. Express a modifier combination
as one string, such as `ctrl+s` or `ctrl.s`; `['ctrl', 's']` does not form a chord.

## Behavior

Filters are evaluated against the latest committed event and handler. Native
listeners are removed when the target, event list, or capture mode changes.
