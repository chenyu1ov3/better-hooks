# use-latest

`useLatest` 返回一个稳定的 ref，其中保存最近一次已提交的值，适合在延迟回调中避免捕获过时的渲染值。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useLatest } from 'better-hook/use-latest';

export function LatestCounter() {
  const [count, setCount] = useState(0);
  const latestCount = useLatest(count);

  const reportLater = () => {
    setTimeout(() => window.alert(`最新计数：${latestCount.current}`), 1000);
  };

  return (
    <div>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        {count}
      </button>
      <button type="button" onClick={reportLater}>
        稍后报告
      </button>
    </div>
  );
}
```

## 行为说明

ref 引用不会变化。值会在成功提交后、后续 layout effect 前更新，因此被放弃的并发渲染不会泄露未提交的值。
