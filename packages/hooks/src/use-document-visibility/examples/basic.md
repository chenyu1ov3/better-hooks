# use-document-visibility

`useDocumentVisibility` tracks whether a document is visible and removes its
native subscription when the last consumer unmounts.

## Example

```tsx
'use client';

import { useDocumentVisibility } from 'better-hook/use-document-visibility';

export function VisibilityStatus() {
  const visibility = useDocumentVisibility();
  return <output>{visibility}</output>;
}
```

The server value is always `visible`. Pass `{ enabled: false }` to pause
updates, or `{ target: documentRef }` to observe another document.

## Behavior

The subscription is shared per document and capture mode. It is removed after
the last consumer unmounts or disables the Hook.
