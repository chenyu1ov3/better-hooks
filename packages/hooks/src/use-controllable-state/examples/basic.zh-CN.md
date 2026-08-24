# use-controllable-state

`useControllableState` 可以让状态由父组件控制，也可以在组件内部管理，适合同时支持受控和非受控用法的可复用组件。

## 示例

```tsx
'use client';

import { useControllableState } from 'better-hooks/use-controllable-state';

export function UncontrolledCounter() {
  const [count, setCount] = useControllableState({
    defaultValue: 0,
    onChange: (value) => console.info('计数', value),
  });

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      {count}
    </button>
  );
}
```

## 行为说明

省略 `value` 时由组件内部管理状态；提供 `value` 后，稳定的更新函数会通过 `onChange` 请求变更。组件在整个生命周期内应保持同一种模式。
