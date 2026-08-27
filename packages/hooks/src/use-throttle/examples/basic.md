# use-throttle

`useThrottle` limits how often a rapidly changing value is published. The raw range value stays immediate while the throttled value advances at most once per window.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useThrottle } from 'better-hooks/use-throttle';

export function ThrottledRange() {
  const [value, setValue] = useState(40);
  const published = useThrottle(value, { delay: 250 });

  return (
    <div>
      <label>
        Volume
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) => setValue(event.currentTarget.valueAsNumber)}
        />
      </label>
      <output>Input: {value}</output>
      <output aria-live="polite">Throttled: {published}</output>
    </div>
  );
}
```

## Behavior

Leading and trailing publication are enabled by default: the first change is immediate and the latest change within the window is retained. Disabling `trailing` drops the queued tail value; changing `delay` restarts an active window.
