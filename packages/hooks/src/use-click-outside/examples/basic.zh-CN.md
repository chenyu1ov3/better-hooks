# use-click-outside

`useClickOutside` 会在指针按到目标元素外部时调用回调，适用于弹出层、菜单和可关闭面板。

## 示例

```tsx
'use client';

import { useRef, useState } from 'react';
import { useClickOutside } from 'better-hook/use-click-outside';

export function DismissiblePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);
  useClickOutside(panelRef, () => setOpen(false), open);

  return open ? (
    <div ref={panelRef}>
      <p>账户设置</p>
      <button type="button" onClick={() => setOpen(false)}>
        关闭
      </button>
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)}>
      打开面板
    </button>
  );
}
```

## 行为说明

监听器挂载到元素所属的 `document`，并在捕获阶段运行，因此事件即使停止冒泡也不会漏掉外部点击。Shadow DOM 内的事件则通过 composed path 判断。
