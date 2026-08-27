# use-timeout

`useTimeout` invokes the latest callback once after a delay and exposes cancellation and pending state. Passing `null` keeps the timer disabled.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useTimeout } from 'better-hooks/use-timeout';

export function ExpiringNotice() {
  const [visible, setVisible] = useState(true);
  const timeout = useTimeout(() => setVisible(false), 5000);

  return visible ? (
    <div>
      <span>Saved successfully</span>
      <button type="button" disabled={!timeout.pending} onClick={timeout.cancel}>
        Keep visible
      </button>
    </div>
  ) : null;
}
```

## Behavior

Changing the delay replaces the timer, while changing only the callback does not restart it. Cancellation is idempotent and remains effective even during the initial commit.
