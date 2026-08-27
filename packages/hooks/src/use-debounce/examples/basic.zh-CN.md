# use-debounce

`useDebounce` 只会在更新停止并经过指定延迟后发布变化中的值。同时渲染原始值与防抖值，可以直接观察延迟发布过程。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useDebounce } from 'better-hooks/use-debounce';

export function SearchPreview() {
  const [query, setQuery] = useState('hooks');
  const settledQuery = useDebounce(query, { delay: 400, maxWait: 1600 });
  const waiting = query !== settledQuery;

  return (
    <div>
      <label>
        搜索
        <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
      </label>
      <output>输入值：{query || '空'}</output>
      <output aria-live="polite">防抖值：{settledQuery || '空'}</output>
      <span role="status">{waiting ? '等待输入停止' : '值已发布'}</span>
    </div>
  );
}
```

## 行为说明

默认启用尾沿发布。每次变更都会重新计算静默延迟，`maxWait` 则限制连续推迟的最长时间。`leading` 可以在一轮开始时立即发布首个值；无效或负数延迟会被安全归一化。
