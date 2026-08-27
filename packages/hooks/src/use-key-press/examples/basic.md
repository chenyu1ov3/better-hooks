# use-key-press

`useKeyPress` matches keys, alternative lists, predicates, legacy key codes, and modifier combinations. Scoping the listeners to a ref keeps shortcuts local to the draft field.

## Example

```tsx
'use client';

import { useRef, useState } from 'react';
import { useKeyPress } from 'better-hooks/use-key-press';

export function DraftShortcuts() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('Quarterly update');
  const [action, setAction] = useState('No shortcut used');

  useKeyPress(
    ['ctrl+s', 'meta+s'],
    (event) => {
      event.preventDefault();
      setAction(`Saved: ${draft || 'Empty draft'}`);
    },
    { ref: inputRef, exactMatch: true },
  );

  useKeyPress(
    'Escape',
    () => {
      setDraft('');
      setAction('Draft cleared');
    },
    { ref: inputRef },
  );

  return (
    <div>
      <label>
        Draft with Ctrl/Cmd+S and Escape shortcuts
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
        />
      </label>
      <output aria-live="polite">{action}</output>
    </div>
  );
}
```

## Behavior

Arrays represent independent alternatives, so modifier chords must be one string such as `ctrl+s`. Filters and handlers use their latest committed values. Target, event list, exact matching, capture, or enabled changes reconcile the native listeners, and unmounting removes them.
