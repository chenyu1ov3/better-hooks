# use-isomorphic-layout-effect

`useIsomorphicLayoutEffect` 在浏览器中等同于 `useLayoutEffect`，在服务端渲染时使用 `useEffect`。仅在首帧绘制前必须读取已提交布局时使用它。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'better-hook/use-isomorphic-layout-effect';

export function MeasuredLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    setWidth(labelRef.current?.getBoundingClientRect().width ?? 0);
  }, []);

  return <span ref={labelRef}>测得宽度：{Math.round(width)}px</span>;
}
```

## 行为说明

服务端分支不会产生 layout effect 警告，也不会在导入时访问浏览器全局对象。不依赖布局时序时，应优先使用普通 Effect。
