# use-unmounted-ref

`useUnmountedRef` 提供一个稳定的 ref，用于保护可能在组件卸载后完成的异步任务。

## 示例

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useUnmountedRef } from 'better-hook/use-unmounted-ref';

export function AsyncStatus() {
  const [ready, setReady] = useState(false);
  const unmountedRef = useUnmountedRef();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!unmountedRef.current) setReady(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [unmountedRef]);

  return <output>{ready ? '完成' : '等待中'}</output>;
}
```

## 行为说明

ref 初始为 `false`，在多次渲染之间保持稳定，并在卸载清理期间变为 `true`。服务器渲染期间始终为 `false`。
