# use-async

`useAsync` 用于执行同步或异步任务，并提供状态、结果和错误信息。下面的本地模拟任务无需依赖接口，也能演示取消与过期结果保护。

## 示例

```tsx
'use client';

import { useAsync } from 'better-hooks/use-async';

function loadProfile(signal: AbortSignal) {
  return new Promise<{ name: string }>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve({ name: 'Ada Lovelace' });
    }, 900);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new Error('已取消加载个人资料'));
    };

    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function ProfileLoader() {
  const request = useAsync(loadProfile);
  const handleLoad = () => {
    void request.run().catch(() => undefined);
  };

  return (
    <div>
      <button type="button" disabled={request.status === 'pending'} onClick={handleLoad}>
        加载
      </button>
      <button type="button" disabled={request.status !== 'pending'} onClick={request.cancel}>
        取消
      </button>
      <output>
        {request.data?.name ?? (request.status === 'pending' ? '加载中…' : '准备就绪')}
      </output>
    </div>
  );
}
```

## 行为说明

开始新任务时会中止上一个任务，过期结果不会覆盖较新的状态。`cancel` 会回到空闲状态并保留现有数据，`reset` 还会清除数据和错误。
