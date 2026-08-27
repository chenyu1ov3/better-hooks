# use-reset-state

`useResetState` returns ordinary state plus a stable action that restores the value resolved during the first initialization.

## Example

```tsx
'use client';

import { useResetState } from 'better-hooks/use-reset-state';

export function ResettableDraft() {
  const [draft, setDraft, resetDraft] = useResetState({ title: 'Release notes', priority: 1 });

  return (
    <div>
      <label>
        Title
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft((value) => ({ ...value, title: event.currentTarget.value }))
          }
        />
      </label>
      <label>
        Priority
        <input
          type="range"
          min="1"
          max="5"
          value={draft.priority}
          onChange={(event) =>
            setDraft((value) => ({ ...value, priority: event.currentTarget.valueAsNumber }))
          }
        />
      </label>
      <button type="button" onClick={resetDraft}>
        Reset draft
      </button>
      <output>
        {draft.title || 'Untitled'} · P{draft.priority}
      </output>
    </div>
  );
}
```

## Behavior

The initializer is resolved once, and reset restores that first snapshot even if a later render receives another initializer. The reset action and guarded state setter remain stable across renders.
