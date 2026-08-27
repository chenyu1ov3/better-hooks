# use-local-storage

`useLocalStorage` keeps a typed value synchronized with a localStorage key and exposes recoverable storage or codec failures without accessing browser storage during SSR.

## Example

```tsx
'use client';

import { useLocalStorage } from 'better-hooks/use-local-storage';

type ThemePreference = 'system' | 'light' | 'dark';

export function ThemePreferencePicker() {
  const theme = useLocalStorage<ThemePreference>('better-hooks:theme-example', 'system');

  return (
    <div>
      <button
        type="button"
        aria-pressed={theme.value === 'light'}
        onClick={() => theme.setValue('light')}
      >
        Light
      </button>
      <button
        type="button"
        aria-pressed={theme.value === 'dark'}
        onClick={() => theme.setValue('dark')}
      >
        Dark
      </button>
      <button type="button" aria-pressed={theme.value === 'system'} onClick={theme.remove}>
        System
      </button>
      <output aria-live="polite">
        {theme.error === undefined ? `Stored preference: ${theme.value}` : 'Storage unavailable'}
      </output>
    </div>
  );
}
```

## Behavior

The initial value is captured once and used for SSR and after removal. Same-key Hook instances share an in-memory snapshot, while browser `storage` events synchronize other documents. Functional updates use the latest shared value; a successful operation clears a recoverable error.
