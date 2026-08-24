# use-safe-state

`useSafeState` 提供一个安全的 React state：组件卸载后调用 setter 会静默忽略。

## 示例

```tsx
'use client';

import { useSafeState } from 'better-hooks/use-safe-state';

export function SafeCounter() {
  const [count, setCount] = useSafeState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      计数：{count}
    </button>
  );
}
```

## 行为说明

setter 引用稳定，支持直接值和函数式更新。组件卸载后调用 setter 不会产生任何更新，函数式 updater 也不会被执行。
