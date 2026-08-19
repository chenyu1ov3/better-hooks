# use-storage

The `use-storage` entry exports both persistent and tab-scoped storage Hooks. Import it when one module needs `useLocalStorage` and `useSessionStorage` together.

## Example

```tsx
'use client';

import { useLocalStorage, useSessionStorage } from 'better-hook/use-storage';

export function StorageSummary() {
  const visits = useLocalStorage('visits:v1', 0);
  const step = useSessionStorage('checkout-step:v1', 1);

  return (
    <div>
      <button type="button" onClick={() => visits.setValue((value) => value + 1)}>
        Visits: {visits.value}
      </button>
      <button type="button" onClick={() => step.setValue((value) => value + 1)}>
        Step: {step.value}
      </button>
    </div>
  );
}
```

## Behavior

There is no separate `useStorage` function. Both exports share the same error, codec, synchronization, removal, and SSR contracts while using different browser stores.
