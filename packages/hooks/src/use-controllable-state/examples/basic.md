# use-controllable-state

`useControllableState` lets a reusable component support parent-owned and internally managed state through one API. The example renders both modes side by side.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useControllableState } from 'better-hooks/use-controllable-state';

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange?: (value: number) => void;
}) {
  const [count, setCount] = useControllableState({
    defaultValue: 1,
    ...(value === undefined ? {} : { value }),
    ...(onChange === undefined ? {} : { onChange }),
  });

  return (
    <div>
      <span>{label}</span>
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => setCount((n) => n - 1)}>
        -
      </button>
      <output>{count}</output>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => setCount((n) => n + 1)}>
        +
      </button>
    </div>
  );
}

export function CounterModes() {
  const [controlled, setControlled] = useState(1);

  return (
    <div>
      <Counter label="Uncontrolled" />
      <Counter label="Controlled" value={controlled} onChange={setControlled} />
      <button type="button" onClick={() => setControlled(1)}>
        Reset parent value
      </button>
    </div>
  );
}
```

## Behavior

Omitting the `value` property creates uncontrolled state from `defaultValue`. Supplying `value` makes the parent authoritative, so the stable setter reports requests through `onChange`. Ownership mode is fixed for each component instance.
