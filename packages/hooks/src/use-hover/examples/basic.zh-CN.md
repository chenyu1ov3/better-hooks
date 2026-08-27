# use-hover

`useHover` 根据原生 `mouseenter` 和 `mouseleave` 事件报告目标是否处于悬停状态，并可通过最新回调观察每次状态转换。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useHover } from 'better-hooks/use-hover';

export function HoverTarget() {
  const targetRef = useRef<HTMLDivElement>(null);
  const [transitions, setTransitions] = useState(0);
  const hovering = useHover(targetRef, {
    onChange: () => setTransitions((value) => value + 1),
  });

  return (
    <div>
      <div
        ref={targetRef}
        style={{
          minHeight: 120,
          minWidth: 220,
          border: '1px solid currentColor',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {hovering ? '指针位于内部' : '指针位于外部'}
      </div>
      <output aria-live="polite">悬停状态变化：{transitions}</output>
    </div>
  );
}
```

## 行为说明

ref 当前目标变化时，Hook 会跟随新目标、移除旧目标监听器，并将状态重置为 `false`。`enabled: false` 会暂停观察；`onEnter`、`onLeave` 和 `onChange` 始终使用最近提交的实现。
