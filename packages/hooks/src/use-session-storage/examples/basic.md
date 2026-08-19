# use-session-storage

`useSessionStorage` synchronizes a typed value with storage scoped to the current browser tab. It is useful for drafts and temporary workflow state.

## Example

```tsx
'use client';

import { useSessionStorage } from 'better-hook/use-session-storage';

export function DraftField() {
  const draft = useSessionStorage('draft:v1', '');

  return (
    <div>
      <textarea
        value={draft.value}
        onChange={(event) => draft.setValue(event.currentTarget.value)}
      />
      <button type="button" onClick={draft.remove}>
        Discard
      </button>
      {draft.error ? <output>Draft could not be saved</output> : null}
    </div>
  );
}
```

## Behavior

The API matches `useLocalStorage`, but data is isolated to sessionStorage. Removing a key restores the initial value, and server rendering uses that initial snapshot.
