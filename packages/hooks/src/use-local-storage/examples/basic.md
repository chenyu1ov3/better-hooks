# use-local-storage

`useLocalStorage` keeps a typed value synchronized with a localStorage key. It exposes persistence errors without making storage access unsafe during SSR.

## Example

```tsx
'use client';

import { useLocalStorage } from 'better-hook/use-local-storage';

export function ThemePreference() {
  const theme = useLocalStorage('theme:v1', 'system');

  return (
    <div>
      <button type="button" onClick={() => theme.setValue('light')}>
        Light
      </button>
      <button type="button" onClick={() => theme.setValue('dark')}>
        Dark
      </button>
      <button type="button" onClick={theme.remove}>
        System
      </button>
      <output>{theme.error ? 'Storage unavailable' : theme.value}</output>
    </div>
  );
}
```

## Behavior

Functional updates and same-key Hook instances share one in-memory snapshot. Removing the key restores the captured initial value, and recoverable storage errors clear after a successful operation.
