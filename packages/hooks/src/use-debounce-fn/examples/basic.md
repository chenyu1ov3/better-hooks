# use-debounce-fn

`useDebounceFn` queues the latest function call until activity has stopped. Its controls expose whether real trailing work is pending and let the caller flush or discard it.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useDebounceFn } from 'better-hooks/use-debounce-fn';

export function DraftSaver() {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState('Nothing saved');
  const save = useDebounceFn((value: string) => setSaved(value || 'Empty draft'), { delay: 800 });

  const updateDraft = (value: string) => {
    setDraft(value);
    save.run(value);
  };

  return (
    <div>
      <label>
        Draft
        <textarea value={draft} onChange={(event) => updateDraft(event.currentTarget.value)} />
      </label>
      <button type="button" disabled={!save.pending} onClick={save.flush}>
        Save now
      </button>
      <button type="button" disabled={!save.pending} onClick={save.cancel}>
        Cancel queued save
      </button>
      <output aria-live="polite">{save.pending ? 'Save queued' : `Saved: ${saved}`}</output>
    </div>
  );
}
```

## Behavior

`run` retains only the latest arguments. `pending` is true only when a trailing invocation is queued; `flush` runs it immediately and returns the callback result, while `cancel` discards it. Option changes reschedule active work, and unmounting clears every timer.
