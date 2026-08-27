# use-throttle

`useThrottle` limits how often a rapidly changing value is published. It is suitable for pointer positions, scroll-derived values, and frequently updated measurements.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useThrottle } from 'better-hooks/use-throttle';

export function ThrottledRange() {
  const [value, setValue] = useState(0);
  const visibleValue = useThrottle(value, { delay: 100 });

  return (
    <label>
      Value
      <input
        type="range"
        value={value}
        onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
      />
      <output>{visibleValue}</output>
    </label>
  );
}
```

## Behavior

Leading and trailing updates default to enabled. Setting `trailing: false` suppresses the end-of-window value instead of allowing `maxWait` to publish it.
