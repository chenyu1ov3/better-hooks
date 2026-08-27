# use-previous

`usePrevious` returns the value from the preceding successful commit. It is useful for rendering comparisons without introducing duplicate state.

## Example

```tsx
'use client';

import { useState } from 'react';
import { usePrevious } from 'better-hooks/use-previous';

export function PriceChange() {
  const [price, setPrice] = useState(24);
  const previousPrice = usePrevious(price);
  const direction =
    previousPrice === undefined ? 'No previous value' : `${previousPrice} to ${price}`;

  return (
    <div>
      <button type="button" onClick={() => setPrice((value) => value - 1)}>
        Decrease
      </button>
      <button type="button" onClick={() => setPrice((value) => value + 1)}>
        Increase
      </button>
      <output aria-live="polite">{direction}</output>
    </div>
  );
}
```

## Behavior

Without an initial fallback, the first render returns `undefined`. The ref is updated only after a successful commit, so an abandoned concurrent render never becomes the previous value.
