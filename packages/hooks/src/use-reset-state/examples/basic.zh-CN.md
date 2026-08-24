# use-reset-state

`useResetState` 增加一个稳定的 reset action，将状态恢复为首次初始化时捕获的值。

## 示例

```tsx
'use client';

import { useResetState } from 'better-hooks/use-reset-state';

export function ResettableCounter() {
  const [count, setCount, resetCount] = useResetState(0);

  return (
    <div>
      <output>{count}</output>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        增加
      </button>
      <button type="button" onClick={resetCount}>
        重置
      </button>
    </div>
  );
}
```

## 行为说明

`resetCount` 引用稳定，并恢复首次解析出的初始值，即使后续渲染传入了不同的 initializer 也不会改变 reset 目标。
