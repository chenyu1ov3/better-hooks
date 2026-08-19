# use-previous

`usePrevious` exposes the value from the preceding successful commit. It is useful for comparisons, transition labels, and change detection that belongs in rendering.

## Example

```tsx
'use client';

import { useState } from 'react';
import { usePrevious } from 'better-hook/use-previous';

export function CountHistory() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count, count);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {previous} to {count}
    </button>
  );
}
```

## Behavior

Without an initial value, the first render returns `undefined`. Updates happen after commit, so abandoned concurrent renders never become the previous value.
