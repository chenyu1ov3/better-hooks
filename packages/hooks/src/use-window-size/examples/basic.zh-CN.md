# use-window-size

`useWindowSize` 返回以 CSS 像素表示的共享浏览器视口快照，适用于无法只用 CSS 表达的渲染判断。

## 示例

```tsx
'use client';

import { useWindowSize } from 'better-hooks/use-window-size';

export function ViewportDimensions() {
  const { width, height } = useWindowSize();
  const orientation = width >= height ? '横向' : '纵向';

  return (
    <div>
      <output aria-live="polite">
        {width} x {height}
      </output>
      <span>{orientation}</span>
    </div>
  );
}
```

## 行为说明

同一 window 中的所有 Hook 实例共享一个 resize 监听器。尺寸相等时会保留快照引用，无效尺寸会归一化为零，最后一个订阅者卸载后才移除监听器。SSR 固定返回 `{ width: 0, height: 0 }`。
