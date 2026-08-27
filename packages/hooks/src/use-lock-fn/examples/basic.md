# use-lock-fn

`useLockFn` prevents an async action from running concurrently. Calls received while the lock is held resolve to `undefined`, making duplicate submissions easy to identify.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useLockFn } from 'better-hooks/use-lock-fn';

export function DraftSaveButton() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Ready to save');
  const save = useLockFn(async () => {
    setSaving(true);
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      return new Date().toLocaleTimeString();
    } finally {
      setSaving(false);
    }
  });

  const handleSave = () => {
    void save().then((savedAt) => {
      setMessage(savedAt === undefined ? 'A save is already running' : `Saved at ${savedAt}`);
    });
  };

  return (
    <div>
      <button type="button" onClick={handleSave}>
        {saving ? 'Saving...' : 'Save draft'}
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
```

## Behavior

The first call acquires the lock before invoking the latest committed function. Overlapping calls resolve to `undefined` without invoking it. The lock is released in `finally` after success or failure; failures remain rejected and can also be observed with `onError`.
