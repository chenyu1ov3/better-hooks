# use-debounce-fn

`useDebounceFn` schedules a function after calls stop for a configured delay. It also exposes explicit cancellation, flushing, and pending state.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useDebounceFn } from 'better-hooks/use-debounce-fn';

export function DraftSaver() {
  const [saved, setSaved] = useState('');
  const save = useDebounceFn((value: string) => setSaved(value), { delay: 500 });

  return (
    <div>
      <input aria-label="Draft" onChange={(event) => save.run(event.currentTarget.value)} />
      <button type="button" onClick={save.flush}>
        Save now
      </button>
      <button type="button" onClick={save.cancel}>
        Cancel
      </button>
      <output>{save.pending ? 'Waiting' : saved}</output>
    </div>
  );
}
```

## Behavior

`pending` means an invocation is actually queued. `flush` runs that invocation immediately, `cancel` discards it, and unmounting clears all timers.
