# use-document-visibility

`useDocumentVisibility` 跟踪文档是否可见，并在最后一个组件卸载后移除原生监听器。

## 示例

```tsx
'use client';

import { useDocumentVisibility } from 'better-hooks/use-document-visibility';

export function VisibilityStatus() {
  const visibility = useDocumentVisibility();
  return <output>{visibility}</output>;
}
```

## 行为说明

同一文档和捕获模式会共享订阅；最后一个消费者卸载或禁用 Hook 后，原生监听器会被移除。

服务端始终返回 `visible`。可以传入 `{ enabled: false }` 暂停更新，或传入
`{ target: documentRef }` 观察其他文档。
