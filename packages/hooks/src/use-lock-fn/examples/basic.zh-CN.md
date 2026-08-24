# use-lock-fn

`useLockFn` 防止异步操作并发执行。第一次调用未完成时，后续调用会解析为
`undefined`；原始错误仍会以 rejected promise 的形式返回。

## 示例

```tsx
'use client';

import { useLockFn } from 'better-hook/use-lock-fn';

export function SaveButton() {
  const save = useLockFn(async () => {
    await fetch('/api/save', { method: 'POST' });
  });
  return <button onClick={() => void save()}>保存</button>;
}
```

## 行为说明

锁持有期间收到的调用会解析为 `undefined`；操作 reject 时仍返回 rejected promise，并可通过 `onError` 观察。

即使操作抛出异常，锁也会在 `finally` 中释放。
