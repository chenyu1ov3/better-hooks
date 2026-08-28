# use-copy-to-clipboard

`useCopyToClipboard` writes text through the browser Clipboard API and exposes its current status.

## Example

```tsx
'use client';

import { useCopyToClipboard } from 'better-hooks/use-copy-to-clipboard';

export function CopyToClipboardExample() {
  const clipboard = useCopyToClipboard();
  const handleCopy = () => {
    void clipboard.copy('Better Hooks').catch(() => undefined);
  };

  return (
    <div>
      <button type="button" onClick={handleCopy}>
        Copy
      </button>
      <output>{clipboard.status === 'success' ? clipboard.copiedText : 'Ready'}</output>
    </div>
  );
}
```

## Behavior

The Clipboard API is called only after a client component has committed. A successful write stores the copied text, while a failed write updates `error`, calls `onError` when provided, and keeps the original Promise rejection. A newer write cannot be replaced by an older result.
