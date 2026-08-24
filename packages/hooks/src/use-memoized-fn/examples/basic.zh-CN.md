# use-memoized-fn

`useMemoizedFn` 保持回调引用稳定，同时让每次调用都使用最近一次已提交的实现。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useMemoizedFn } from 'better-hook/use-memoized-fn';

export function MemoizedGreeting() {
  const [name, setName] = useState('Ada');
  const greet = useMemoizedFn(() => window.alert(`你好，${name}`));

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button type="button" onClick={greet}>
        打招呼
      </button>
    </div>
  );
}
```

## 行为说明

返回的函数在多次渲染之间保持同一引用。回调会在提交后替换，因此被放弃的并发渲染不会改变它实际调用的函数。
