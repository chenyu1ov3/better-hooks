# use-controllable-state

`useControllableState` implements a value that may be owned by a parent or managed internally. It is useful for reusable components that support both controlled and uncontrolled usage.

## Example

```tsx
'use client';

import { useControllableState } from 'better-hooks/use-controllable-state';

export function UncontrolledCounter() {
  const [count, setCount] = useControllableState({
    defaultValue: 0,
    onChange: (value) => console.info('count', value),
  });

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {count}
    </button>
  );
}
```

## Behavior

Omit `value` for uncontrolled state. When `value` is supplied, the stable setter requests changes through `onChange`; choose one mode for the component's lifetime.
