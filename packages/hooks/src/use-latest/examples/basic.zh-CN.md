# use-latest

`useLatest` 返回一个引用稳定、始终包含最近已提交值的 ref。延迟回调可以读取它，而不必保留安排任务时那次渲染中的旧值。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useLatest } from 'better-hooks/use-latest';

export function DelayedCountReport() {
  const [count, setCount] = useState(0);
  const [report, setReport] = useState('尚未安排报告');
  const latestCount = useLatest(count);

  const reportLater = () => {
    setReport('等待一秒...');
    window.setTimeout(() => {
      setReport(`最近提交的计数：${latestCount.current}`);
    }, 1000);
  };

  return (
    <div>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        计数：{count}
      </button>
      <button type="button" onClick={reportLater}>
        稍后报告
      </button>
      <output aria-live="polite">{report}</output>
    </div>
  );
}
```

## 行为说明

ref 对象本身始终不变。它的 `current` 会在成功提交后、后续布局 Effect 之前发布新值，因此被放弃的并发渲染不会泄漏尚未提交的值。
