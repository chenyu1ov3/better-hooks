# use-document-visibility

`useDocumentVisibility` 通过共享原生订阅跟踪当前 document 的可见性。页面隐藏时，下面的可见时长计数会暂停。

## 示例

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useDocumentVisibility } from 'better-hooks/use-document-visibility';

export function VisibilityTimer() {
  const visibility = useDocumentVisibility();
  const [activeSeconds, setActiveSeconds] = useState(0);

  useEffect(() => {
    if (visibility !== 'visible') return;
    const timer = window.setInterval(() => setActiveSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [visibility]);

  return (
    <div>
      <output aria-live="polite">文档状态：{visibility}</output>
      <output>可见时长：{activeSeconds} 秒</output>
    </div>
  );
}
```

## 行为说明

默认目标是浏览器 document，同时也支持直接、惰性和 ref 形式的 document 目标。订阅按 document 与捕获模式共享。禁用、目标不可用和服务端渲染时都会确定地返回 `visible`。
