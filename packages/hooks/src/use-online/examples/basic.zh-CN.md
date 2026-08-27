# use-online

`useOnline` 报告浏览器当前的网络连接提示，并响应原生 online 和 offline 事件。它适合展示界面状态，但不能证明应用服务器确实可达。

## 示例

```tsx
'use client';

import { useOnline } from 'better-hooks/use-online';

export function ConnectionStatus() {
  const online = useOnline();

  return (
    <div>
      <output role="status" aria-live="polite">
        连接状态：{online ? '在线' : '离线'}
      </output>
      <span>{online ? '可以尝试网络请求' : '可以先在本地保存变更'}</span>
    </div>
  );
}
```

## 行为说明

同一 window 中的 Hook 实例共享一对 online/offline 监听器。客户端快照跟随 `navigator.onLine`；无法读取 navigator 或 SSR 时默认返回 `true`。值未变化的重复事件不会通知 React。
