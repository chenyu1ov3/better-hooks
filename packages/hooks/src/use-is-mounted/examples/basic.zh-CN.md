# use-is-mounted

`useIsMounted` 返回一个稳定函数，用于判断组件当前是否已提交。它可以保护那些无法通过其他方式取消的延迟任务。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useIsMounted } from 'better-hook/use-is-mounted';

export function DelayedStatus() {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState('空闲');

  const load = async () => {
    setStatus('加载中');
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    if (isMounted()) setStatus('已完成');
  };

  return (
    <button type="button" onClick={() => void load()}>
      {status}
    </button>
  );
}
```

## 行为说明

返回函数的引用始终稳定。客户端提交后（包括后续 layout effect 中）返回 `true`，清理完成后返回 `false`。
