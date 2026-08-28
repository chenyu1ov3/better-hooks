# use-counter

`useCounter` manages a bounded number and exposes stable actions for common counter updates.

## Example

```tsx
'use client';

import { useCounter } from 'better-hooks/use-counter';

export function CounterExample() {
  const counter = useCounter(2, { min: 0, max: 5 });

  return (
    <div>
      <output>Count: {counter.count}</output>
      <button type="button" onClick={() => counter.decrement()}>
        -
      </button>
      <button type="button" onClick={() => counter.increment()}>
        +
      </button>
      <button type="button" onClick={counter.reset}>
        Reset
      </button>
    </div>
  );
}
```

## Behavior

The initial count is captured once and clamped to the optional inclusive bounds. Functional updates compose when several actions run in one batch, and values outside the bounds are clamped.
