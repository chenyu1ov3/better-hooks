# use-event-listener

`useEventListener` 使用最新回调订阅原生 `EventTarget`，不会仅因回调变化就重复安装监听器。它支持省略 `window` 的简写形式、显式目标和 ref。

## 示例

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useEventListener } from 'better-hooks/use-event-listener';

export function ViewportWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => setWidth(window.innerWidth), []);
  useEventListener('resize', () => setWidth(window.innerWidth), { passive: true });
  return <output>{width}px</output>;
}
```

## 行为说明

回调变化不会重新安装监听器；目标、事件类型或 `capture`、`passive`、`once`、`signal` 选项变化时才会重新绑定，并在卸载时清理。
