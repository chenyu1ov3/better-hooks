# use-resize-observer

`useResizeObserver` 报告元素最近的内容矩形。测量结果渲染在被观察区域之外，因此不会反过来改变目标自身尺寸。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useResizeObserver } from 'better-hooks/use-resize-observer';

export function ResizablePanel() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(60);
  const measurement = useResizeObserver(targetRef);

  return (
    <div>
      <label>
        面板宽度
        <input
          type="range"
          min="30"
          max="100"
          value={size}
          onChange={(event) => setSize(event.currentTarget.valueAsNumber)}
        />
      </label>
      <div
        ref={targetRef}
        style={{
          boxSizing: 'border-box',
          width: `${size}%`,
          height: 72,
          border: '1px solid currentColor',
        }}
      >
        被观察的面板
      </div>
      <output aria-live="polite">
        {measurement.rect
          ? `${Math.round(measurement.width)} x ${Math.round(measurement.height)}`
          : '等待首次测量'}
      </output>
      {measurement.error === undefined ? null : <output>观察器初始化失败</output>}
    </div>
  );
}
```

## 行为说明

观察器会跟随 ref 目标，并在目标、`box` 或启用状态变化时重建。宽高从原生 `contentRect` 归一化得出；禁用、SSR 和不支持的浏览器会返回尺寸为零的空快照。初始化与回调异常会写入 `error`，并通过 `onError` 暴露。
