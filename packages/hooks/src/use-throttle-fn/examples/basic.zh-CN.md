# use-throttle-fn

`useThrottleFn` 会把函数限制为每个时间窗口最多调用一次，同时始终使用最新回调。它提供与 `useDebounceFn` 相同的 `run`、`cancel`、`flush` 和 `pending` 控制。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useThrottleFn } from 'better-hooks/use-throttle-fn';

export function PointerPosition() {
  const [x, setX] = useState(0);
  const update = useThrottleFn((nextX: number) => setX(nextX), { delay: 100 });

  return (
    <div onPointerMove={(event) => update.run(event.clientX)}>
      在此处移动指针。<output>{x}px</output>
    </div>
  );
}
```

## 行为说明

`leading` 与 `trailing` 默认启用。关闭 `trailing` 会丢弃等待中的尾调用；回调抛错或组件卸载后，调度器也会完整清理。
