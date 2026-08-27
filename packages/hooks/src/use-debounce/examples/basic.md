# use-debounce

`useDebounce` publishes a changing value only after updates have stayed quiet for the configured delay. Rendering both values makes the deferred publication visible.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useDebounce } from 'better-hooks/use-debounce';

export function SearchPreview() {
  const [query, setQuery] = useState('hooks');
  const settledQuery = useDebounce(query, { delay: 400, maxWait: 1600 });
  const waiting = query !== settledQuery;

  return (
    <div>
      <label>
        Search
        <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
      </label>
      <output>Input: {query || 'Empty'}</output>
      <output aria-live="polite">Debounced: {settledQuery || 'Empty'}</output>
      <span role="status">{waiting ? 'Waiting for typing to stop' : 'Value published'}</span>
    </div>
  );
}
```

## Behavior

Trailing publication is enabled by default. Each change restarts the quiet delay, while `maxWait` bounds continuous postponement. `leading` can publish the first value in a cycle, and invalid or negative delays are normalized safely.
