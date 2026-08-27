# use-async

`useAsync` 运行可感知中止信号的任务，并提供状态、保留数据、错误和稳定控制。下面使用本地延迟任务，因此不依赖应用后端接口。

## 示例

```tsx
'use client';

import { useAsync } from 'better-hooks/use-async';

function loadProfile(signal: AbortSignal) {
  return new Promise<{ name: string; role: string }>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('资料加载已取消', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve({ name: '艾达·洛芙莱斯', role: '数学家' });
    }, 1200);

    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

export function ProfileLoader() {
  const request = useAsync(loadProfile);

  const run = () => {
    void request.run().catch(() => undefined);
  };

  return (
    <div>
      <button type="button" onClick={run}>
        {request.status === 'pending' ? '重新加载' : '加载资料'}
      </button>
      <button type="button" disabled={request.status !== 'pending'} onClick={request.cancel}>
        取消
      </button>
      <button
        type="button"
        disabled={request.status === 'idle' && !request.data}
        onClick={request.reset}
      >
        重置
      </button>
      <output aria-live="polite">状态：{request.status}</output>
      <output>
        {request.data
          ? `${request.data.name} · ${request.data.role}`
          : request.error instanceof Error
            ? request.error.message
            : '尚未加载资料'}
      </output>
    </div>
  );
}
```

## 行为说明

每次 `run` 都会中止前一个控制器并忽略过期状态更新，同时保留返回 Promise 原本的结果或拒绝。`cancel` 保留已有数据并回到 idle；`reset` 还会清除数据与错误。预期内的取消错误不会通过 `onError` 上报。
