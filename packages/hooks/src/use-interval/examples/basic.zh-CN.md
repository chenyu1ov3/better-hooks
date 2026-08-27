# use-interval

`useInterval` 按指定延迟重复调用最新回调。传入 `null` 可以暂停调度，而无需改变 Hook 调用顺序或清除业务状态。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useInterval } from 'better-hooks/use-interval';

export function ElapsedTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useInterval(() => setSeconds((value) => value + 1), running ? 1000 : null);

  return (
    <div>
      <button type="button" aria-pressed={!running} onClick={() => setRunning((value) => !value)}>
        {running ? '暂停' : '继续'}
      </button>
      <button type="button" onClick={() => setSeconds(0)}>
        重置
      </button>
      <output aria-live="polite">已用时：{seconds} 秒</output>
    </div>
  );
}
```

## 行为说明

修改 `delay` 会替换 interval；只修改回调则保留当前节奏，并在触发时使用最近提交的实现。`null` 会停止调度；回调异常会在重新抛出前停止调度，组件卸载也会移除原生计时器。
