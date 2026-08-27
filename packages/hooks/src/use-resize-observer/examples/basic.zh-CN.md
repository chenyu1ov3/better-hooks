# use-resize-observer

`useResizeObserver` 用于跟踪元素的内容矩形，并提供当前宽度和高度。

## 示例

```tsx
'use client';

import { useRef } from 'react';
import { useResizeObserver } from 'better-hooks/use-resize-observer';

export function MeasuredPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useResizeObserver(ref, { box: 'border-box' });

  return (
    <div ref={ref}>
      {Math.round(width)} x {Math.round(height)}
    </div>
  );
}
```

## 行为说明

观察器会跟随 ref 目标，并在目标或 `box` 选项变化时重建。SSR 或浏览器不支持
`ResizeObserver` 时返回 `{ rect: null, width: 0, height: 0 }`。
回调失败会先断开观察器，再由 `onError` 观察并重新抛出原始错误；初始化失败遵循相同的传播规则。
