# use-counter

`useCounter` 管理一个有边界的数字，并提供用于常见计数操作的稳定函数。

## 示例

```tsx
'use client';

import { useCounter } from 'better-hooks/use-counter';

export function CounterExample() {
  const counter = useCounter(2, { min: 0, max: 5 });

  return (
    <div>
      <output>计数：{counter.count}</output>
      <button type="button" onClick={() => counter.decrement()}>
        减少
      </button>
      <button type="button" onClick={() => counter.increment()}>
        增加
      </button>
      <button type="button" onClick={counter.reset}>
        重置
      </button>
    </div>
  );
}
```

## 行为说明

初始计数只捕获一次，并会限制在可选的闭区间内。一次批量更新中的多个函数式操作会按最新值连续计算，超出边界的值会被限制到边界上。
