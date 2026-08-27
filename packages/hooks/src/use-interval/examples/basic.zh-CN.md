# use-interval

`useInterval` 会按指定间隔重复调用最新回调。传入 `null` 可以暂停定时任务，同时保持 Hook 调用顺序不变。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useInterval } from 'better-hooks/use-interval';

export function CounterClock() {
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  useInterval(() => setCount((value) => value + 1), paused ? null : 1000);

  return (
    <button type="button" onClick={() => setPaused((value) => !value)}>
      {paused ? '继续' : `在 ${count} 时暂停`}
    </button>
  );
}
```

## 行为说明

间隔变化会重启唯一的定时任务，仅回调变化不会打断当前节奏。零值和非法间隔会按统一规则规范化。
