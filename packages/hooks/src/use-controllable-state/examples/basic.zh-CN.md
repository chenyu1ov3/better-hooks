# use-controllable-state

`useControllableState` 让可复用组件通过同一套 API 同时支持父组件持有状态和内部管理状态。下面并列展示两种模式。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useControllableState } from 'better-hooks/use-controllable-state';

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange?: (value: number) => void;
}) {
  const [count, setCount] = useControllableState({
    defaultValue: 1,
    ...(value === undefined ? {} : { value }),
    ...(onChange === undefined ? {} : { onChange }),
  });

  return (
    <div>
      <span>{label}</span>
      <button type="button" aria-label={`${label}减一`} onClick={() => setCount((n) => n - 1)}>
        -
      </button>
      <output>{count}</output>
      <button type="button" aria-label={`${label}加一`} onClick={() => setCount((n) => n + 1)}>
        +
      </button>
    </div>
  );
}

export function CounterModes() {
  const [controlled, setControlled] = useState(1);

  return (
    <div>
      <Counter label="非受控" />
      <Counter label="受控" value={controlled} onChange={setControlled} />
      <button type="button" onClick={() => setControlled(1)}>
        重置父组件值
      </button>
    </div>
  );
}
```

## 行为说明

省略 `value` 属性时，状态会根据 `defaultValue` 在内部管理；提供 `value` 后则以父组件为准，引用稳定的 setter 会通过 `onChange` 发出更新请求。每个组件实例的所有权模式在首次渲染后保持不变。
