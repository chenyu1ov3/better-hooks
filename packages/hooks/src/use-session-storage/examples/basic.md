# use-session-storage

`useSessionStorage` keeps a typed value in storage scoped to the current browser tab. It is suited to temporary drafts and workflow state that should not survive a new session.

## Example

```tsx
'use client';

import { useSessionStorage } from 'better-hooks/use-session-storage';

export function SessionDraft() {
  const draft = useSessionStorage('better-hooks:draft-example', '');

  return (
    <div>
      <label>
        Session draft
        <textarea
          value={draft.value}
          onChange={(event) => draft.setValue(event.currentTarget.value)}
        />
      </label>
      <button type="button" disabled={!draft.value} onClick={draft.remove}>
        Discard draft
      </button>
      <output aria-live="polite">
        {draft.error === undefined
          ? `${draft.value.length} characters stored in this tab`
          : 'Draft could not be stored'}
      </output>
    </div>
  );
}
```

## Behavior

The API matches `useLocalStorage`, including functional updates, custom codecs, same-key synchronization, and recoverable errors. The difference is browser scope: sessionStorage is isolated to the current tab. SSR and removal return the captured initial value.
