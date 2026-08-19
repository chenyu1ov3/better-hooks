# use-window-size

`useWindowSize` 返回当前视口宽度与高度的共享快照，适用于渲染逻辑确实依赖视口尺寸的场景。

## 示例

```tsx
'use client';

import { useWindowSize } from 'better-hook/use-window-size';

export function ViewportDimensions() {
  const { width, height } = useWindowSize();
  return (
    <output>
      {width} × {height}
    </output>
  );
}
```

## 行为说明

同一浏览器上下文中的订阅者共享一个 `resize` 监听器。尺寸未变化时会复用快照，最后一个实例卸载后移除监听器；SSR 返回 `{ width: 0, height: 0 }`。
