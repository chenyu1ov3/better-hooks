# use-intersection-observer

`useIntersectionObserver` 跟踪元素相对于视口或指定根元素的相交状态。此示例使用独立滚动容器，让目标可以确定地进入和离开观察区域。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useIntersectionObserver } from 'better-hooks/use-intersection-observer';

export function ScrollTarget() {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const observation = useIntersectionObserver(targetRef, { root, threshold: 0.75 });

  return (
    <div>
      <output aria-live="polite">
        目标：{observation.isIntersecting ? '正在相交' : '位于区域外'}
      </output>
      <div
        ref={setRoot}
        style={{ height: 150, width: '100%', overflowY: 'auto', border: '1px solid currentColor' }}
      >
        <div style={{ height: 170, padding: 12 }}>目标之前的内容</div>
        <div ref={targetRef} style={{ minHeight: 80, padding: 12, background: 'ButtonFace' }}>
          被观察的目标
        </div>
        <div style={{ height: 170, padding: 12 }}>目标之后的内容</div>
      </div>
      {observation.error === undefined ? null : <output>观察器初始化失败</output>}
    </div>
  );
}
```

## 行为说明

观察器会跟随 ref 的当前元素，并只在目标、根元素、边距、阈值内容或启用状态变化时重建。禁用后恢复空快照。SSR 和缺少 `IntersectionObserver` 的浏览器会返回 `entry: null`、`isIntersecting: false`，而不会抛出异常。
