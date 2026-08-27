# use-click-outside

`useClickOutside` 处理引用元素之外捕获到的指针按下事件。下面分别提供内部和外部控件，使边界清晰可见。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useClickOutside } from 'better-hooks/use-click-outside';

export function DismissiblePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  const [insideActions, setInsideActions] = useState(0);
  const [dismissals, setDismissals] = useState(0);

  useClickOutside(
    panelRef,
    () => {
      setOpen(false);
      setDismissals((value) => value + 1);
    },
    { enabled: open },
  );

  return (
    <div>
      {open ? (
        <div ref={panelRef}>
          <span>账户面板</span>
          <button type="button" onClick={() => setInsideActions((value) => value + 1)}>
            内部操作
          </button>
        </div>
      ) : (
        <span>面板已关闭</span>
      )}
      <button type="button" disabled={open} onClick={() => setOpen(true)}>
        打开面板
      </button>
      <button type="button">外部目标</button>
      <output>
        内部操作：{insideActions}；外部关闭：{dismissals}
      </output>
    </div>
  );
}
```

## 行为说明

监听器使用元素所属 document 和捕获阶段，因此停止冒泡也无法隐藏外部按下事件。每个事件都会检查 ref 的当前目标；禁用模式会移除绑定，组合路径则保证跨 Shadow DOM 时仍能正确判断内外部。
