# use-throttle-fn

`useThrottleFn` 将函数限制为每个时间窗口一次首沿调用，同时保留最新的尾沿参数。指针移动可以直观展示两个边沿。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useThrottleFn } from 'better-hooks/use-throttle-fn';

export function PointerPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const update = useThrottleFn((x: number, y: number) => setPosition({ x, y }), { delay: 150 });

  return (
    <div>
      <div
        style={{
          minHeight: 120,
          width: '100%',
          border: '1px dashed currentColor',
          touchAction: 'none',
        }}
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          update.run(
            Math.round(event.clientX - bounds.left),
            Math.round(event.clientY - bounds.top),
          );
        }}
      >
        指针跟踪区域
      </div>
      <button type="button" disabled={!update.pending} onClick={update.flush}>
        立即处理最新位置
      </button>
      <button type="button" disabled={!update.pending} onClick={update.cancel}>
        取消尾沿更新
      </button>
      <output aria-live="polite">
        x：{position.x}，y：{position.y} {update.pending ? '（尾沿更新已排队）' : ''}
      </output>
    </div>
  );
}
```

## 行为说明

默认同时启用首沿和尾沿调用。窗口开启期间的新调用会替换排队参数；`flush` 立即使用最新参数执行，`cancel` 则丢弃参数并关闭窗口。回调变化不会替换引用稳定的控制函数。
