# use-boolean

`useBoolean` manages boolean state with named, stable actions. It is useful when `setTrue` and `setFalse` communicate intent more clearly than a generic setter.

## Example

```tsx
'use client';

import { useBoolean } from 'better-hooks/use-boolean';

export function NotificationSetting() {
  const notifications = useBoolean(true);

  return (
    <div>
      <button
        type="button"
        aria-pressed={notifications.value}
        onClick={() => notifications.toggle()}
      >
        {notifications.value ? 'Notifications on' : 'Notifications off'}
      </button>
      <button type="button" disabled={notifications.value} onClick={notifications.setTrue}>
        Enable
      </button>
      <button type="button" disabled={!notifications.value} onClick={notifications.setFalse}>
        Disable
      </button>
      <output aria-live="polite">Current value: {String(notifications.boolean)}</output>
    </div>
  );
}
```

## Behavior

`value` and `boolean` expose the same state. `setTrue`, `setFalse`, and `toggle` keep stable identities; call `toggle()` with no argument to invert the latest value, or pass an explicit boolean or functional updater.
