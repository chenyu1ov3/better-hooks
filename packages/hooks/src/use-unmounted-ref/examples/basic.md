# use-unmounted-ref

`useUnmountedRef` exposes a stable ref whose value becomes true during unmount cleanup. It is convenient in callback APIs that expect a mutable guard rather than a function.

## Example

```tsx
'use client';

import { useState } from 'react';
import { useUnmountedRef } from 'better-hooks/use-unmounted-ref';

function UploadTask({ onResult }: { onResult: (message: string) => void }) {
  const unmounted = useUnmountedRef();
  const [status, setStatus] = useState('Idle');

  const start = () => {
    setStatus('Uploading...');
    window.setTimeout(() => {
      if (unmounted.current) {
        onResult('Upload callback arrived after unmount');
        return;
      }
      setStatus('Uploaded');
      onResult('Upload completed while mounted');
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function UnmountedUploadGuard() {
  const [showUpload, setShowUpload] = useState(true);
  const [result, setResult] = useState('No upload started');

  return (
    <div>
      {showUpload ? <UploadTask onResult={setResult} /> : <span>Uploader removed</span>}
      <button type="button" onClick={() => setShowUpload((value) => !value)}>
        {showUpload ? 'Remove uploader' : 'Mount uploader'}
      </button>
      <output aria-live="polite">{result}</output>
    </div>
  );
}
```

## Behavior

The ref starts at `false`, remains the same object across renders, and becomes `true` in unmount cleanup. Strict Mode effect replay restores it to `false` for the live component. It also stays `false` during server rendering.
