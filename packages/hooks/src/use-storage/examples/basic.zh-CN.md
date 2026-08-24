# use-storage

`use-storage` 入口同时导出持久化存储和标签页级存储 Hook。当一个模块同时需要 `useLocalStorage` 与 `useSessionStorage` 时可以使用该入口。

## 示例

```tsx
'use client';

import { useLocalStorage, useSessionStorage } from 'better-hooks/use-storage';

export function StorageSummary() {
  const visits = useLocalStorage('visits:v1', 0);
  const step = useSessionStorage('checkout-step:v1', 1);

  return (
    <div>
      <button type="button" onClick={() => visits.setValue((value) => value + 1)}>
        访问次数：{visits.value}
      </button>
      <button type="button" onClick={() => step.setValue((value) => value + 1)}>
        当前步骤：{step.value}
      </button>
    </div>
  );
}
```

## 行为说明

这里没有单独的 `useStorage` 函数。两个导出使用不同的浏览器存储，但共享错误处理、编解码、同步、删除和 SSR 契约。
