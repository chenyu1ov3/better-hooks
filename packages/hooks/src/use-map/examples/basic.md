# use-map

`useMap` keeps a readonly Map snapshot while providing stable actions for immutable updates.

## Example

```tsx
'use client';

import { useMap } from 'better-hooks/use-map';

export function MapExample() {
  const [map, actions] = useMap<string, string>([['status', 'ready']]);

  return (
    <div>
      <output>{map.get('status')}</output>
      <button type="button" onClick={() => actions.set('status', 'saved')}>
        Save
      </button>
      <button type="button" onClick={actions.reset}>
        Reset
      </button>
    </div>
  );
}
```

## Behavior

The initial entries are copied once. Every meaningful update creates a new Map snapshot; no-op updates preserve the current snapshot reference. `reset` restores the captured entries and `clear` removes all entries.
