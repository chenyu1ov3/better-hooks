# use-previous

`usePrevious` 会返回上一次成功提交时的值，适合做比较、展示转换标签或在渲染中检测变化。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { usePrevious } from 'better-hooks/use-previous';

export function CountHistory() {
  const [count, setCount] = useState(0);
  const previous = usePrevious(count, count);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      从 {previous} 变为 {count}
    </button>
  );
}
```

## 行为说明

未提供初始值时，第一次渲染返回 `undefined`。值在提交后更新，因此被放弃的并发渲染不会成为“上一次”的值。
