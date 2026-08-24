# use-debounce

`useDebounce` 会在变化停止一段时间后更新结果，适用于搜索词、校验以及其他需要等待输入暂停的工作。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useDebounce } from 'better-hooks/use-debounce';

export function SearchPreview() {
  const [query, setQuery] = useState('');
  const settledQuery = useDebounce(query, { delay: 300, maxWait: 1200 });

  return (
    <label>
      搜索
      <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
      <output>{settledQuery}</output>
    </label>
  );
}
```

## 行为说明

负数和非法延迟会被安全归一化。调度选项变化时，等待中的任务会使用最新值重新计时，`maxWait` 用于限制持续推迟。
