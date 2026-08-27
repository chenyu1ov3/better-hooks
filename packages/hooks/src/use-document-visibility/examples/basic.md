# use-document-visibility

`useDocumentVisibility` tracks the current document visibility through a shared native subscription. The active-time counter pauses whenever the page becomes hidden.

## Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useDocumentVisibility } from 'better-hooks/use-document-visibility';

export function VisibilityTimer() {
  const visibility = useDocumentVisibility();
  const [activeSeconds, setActiveSeconds] = useState(0);

  useEffect(() => {
    if (visibility !== 'visible') return;
    const timer = window.setInterval(() => setActiveSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [visibility]);

  return (
    <div>
      <output aria-live="polite">Document: {visibility}</output>
      <output>Visible time: {activeSeconds}s</output>
    </div>
  );
}
```

## Behavior

The browser document is the default target, while direct, lazy, and ref-like document targets are also supported. Subscriptions are shared per document and capture mode. Disabled, unavailable, and server-rendered states return `visible` deterministically.
