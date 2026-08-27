# use-isomorphic-layout-effect

`useIsomorphicLayoutEffect` 在浏览器中使用布局 Effect 时机，在 SSR 中使用普通 Effect 时机。只有已提交布局必须在绘制前测量时才需要它。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from 'better-hooks/use-isomorphic-layout-effect';

export function MeasuredLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [short, setShort] = useState(false);
  const [width, setWidth] = useState(0);
  const label = short ? '短标签' : '一个用于测量的较长标签';

  useIsomorphicLayoutEffect(() => {
    setWidth(labelRef.current?.getBoundingClientRect().width ?? 0);
  }, [label]);

  return (
    <div>
      <button type="button" onClick={() => setShort((value) => !value)}>
        切换标签
      </button>
      <span ref={labelRef}>{label}</span>
      <output aria-live="polite">测量宽度：{Math.round(width)}px</output>
    </div>
  );
}
```

## 行为说明

浏览器导出别名为 `useLayoutEffect`，服务端导出别名为 `useEffect`，从而避免服务端布局 Effect 警告，也不会在 Effect 内读取浏览器全局对象。不需要绘制前布局时机时应使用普通 Effect。
