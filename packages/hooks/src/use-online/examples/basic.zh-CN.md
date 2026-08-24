# use-online

`useOnline` 会报告浏览器提供的网络连接状态，并响应 `online` 与 `offline` 事件。它适合显示界面提示，但不能证明某台服务器确实可访问。

## 示例

```tsx
'use client';

import { useOnline } from 'better-hooks/use-online';

export function ConnectionStatus() {
  const online = useOnline();
  return <output aria-live="polite">{online ? '在线' : '离线'}</output>;
}
```

## 行为说明

同一浏览器上下文中的所有 Hook 实例共享一对 `online` / `offline` 监听器。服务端快照为 `true`；重复事件未改变状态时会复用当前结果。
