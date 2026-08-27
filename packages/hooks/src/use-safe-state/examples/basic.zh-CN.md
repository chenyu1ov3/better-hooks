# use-safe-state

`useSafeState` 在组件挂载期间与 React state 一样工作，卸载后则让 setter 变为无操作。下面故意不清理延迟回调，以便先移除子组件再观察结果。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useSafeState } from 'better-hooks/use-safe-state';

function DelayedTask({ onFinish }: { onFinish: () => void }) {
  const [status, setStatus] = useSafeState('空闲');

  const start = () => {
    setStatus('等待中...');
    window.setTimeout(() => {
      setStatus('已完成');
      onFinish();
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function SafeDelayedState() {
  const [mounted, setMounted] = useState(true);
  const [completed, setCompleted] = useState(0);

  return (
    <div>
      {mounted ? (
        <DelayedTask onFinish={() => setCompleted((value) => value + 1)} />
      ) : (
        <span>子组件已移除</span>
      )}
      <button type="button" onClick={() => setMounted((value) => !value)}>
        {mounted ? '移除子组件' : '挂载子组件'}
      </button>
      <output aria-live="polite">已完成的延迟回调：{completed}</output>
    </div>
  );
}
```

## 行为说明

组件挂载期间，setter 引用稳定并支持直接更新和函数式更新；卸载后所有调用都会被忽略，函数式更新器也不会执行。能够取消的任务仍应优先取消，本 Hook 适合保护无法可靠取消的回调。
