# use-debounce

`useDebounce` delays publishing a changing value until it has remained quiet. It is useful for search terms, validation, and other work that should wait for typing to pause.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useDebounce } from 'better-hook/use-debounce';

export function SearchPreview() {
  const [query, setQuery] = useState('');
  const settledQuery = useDebounce(query, { delay: 300, maxWait: 1200 });

  return (
    <label>
      Search
      <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
      <output>{settledQuery}</output>
    </label>
  );
}
```

## Behavior

Negative and invalid delays are normalized safely. Changing scheduling options restarts pending work with the latest value, and `maxWait` limits continuous postponement.
