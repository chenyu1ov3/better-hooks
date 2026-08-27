# use-media-query

`useMediaQuery` turns a CSS media query into a reactive boolean through a shared external store. Resize the preview or browser to see the current mode update.

## Example

```tsx
'use client';

import { useMediaQuery } from 'better-hooks/use-media-query';

export function ResponsiveMode() {
  const compact = useMediaQuery('(max-width: 40rem)', { defaultMatches: false });

  return (
    <div>
      <output aria-live="polite">Viewport mode: {compact ? 'Compact' : 'Wide'}</output>
      <span>{compact ? 'One-column controls' : 'Multi-column controls'}</span>
    </div>
  );
}
```

## Behavior

`defaultMatches` supplies the deterministic server and unsupported-browser value. Subscribers to the same query share one native listener per window, and the final unmount removes it. Query changes move the subscription, with legacy `addListener` browsers still supported.
