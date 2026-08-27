# use-intersection-observer

`useIntersectionObserver` 用于跟踪元素是否进入视口或指定的根元素。

## 示例

```tsx
'use client';

import { useRef } from 'react';
import { useIntersectionObserver } from 'better-hooks/use-intersection-observer';

export function LazyPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(ref, {
    threshold: 0.25,
  });

  return <div ref={ref}>{isIntersecting ? '已显示' : '等待进入视口'}</div>;
}
```

## 行为说明

观察器会跟随 ref 当前指向的元素，并在目标或原生观察器选项变化时重建。
SSR 或浏览器不支持 `IntersectionObserver` 时返回
`{ entry: null, isIntersecting: false }`。回调失败会先断开观察器，再由
`onError` 观察并重新抛出原始错误；初始化失败遵循相同的传播规则。
