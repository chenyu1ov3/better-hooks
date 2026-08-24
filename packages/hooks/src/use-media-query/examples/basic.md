# use-media-query

`useMediaQuery` subscribes to a CSS media query through a shared external store. A server default keeps rendering deterministic before the browser query is available.

## Example

```tsx
'use client';

import { useMediaQuery } from 'better-hooks/use-media-query';

export function ResponsiveMode() {
  const compact = useMediaQuery('(max-width: 48rem)', { defaultMatches: false });
  return <output>{compact ? 'Compact navigation' : 'Full navigation'}</output>;
}
```

## Behavior

Subscribers to the same query share one native listener, which is removed after the last subscriber. Browsers with only the legacy `addListener` API remain supported.
