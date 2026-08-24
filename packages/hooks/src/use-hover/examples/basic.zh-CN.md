# use-hover

`useHover` 返回目标当前是否处于悬停状态；当 ref 的 `current` 元素变化时，
监听也会跟随迁移。

## 示例

```tsx
'use client';

import { useRef } from 'react';
import { useHover } from 'better-hook/use-hover';

export function HoverCard() {
  const ref = useRef<HTMLDivElement>(null);
  const hovering = useHover(ref, { onChange: (value) => console.log(value) });
  return <div ref={ref}>{hovering ? '悬停中' : '移到这里'}</div>;
}
```

## 行为说明

当 ref 的 `current` 目标变化时，监听器会迁移到新目标，并将悬停状态重置为 `false`。

将 `enabled` 设为 `false` 可以暂停监听。通过 `onError` 观察回调异常时，
原始异常仍会继续抛出。
