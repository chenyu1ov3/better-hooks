# use-is-mounted

`useIsMounted` 返回一个引用稳定的函数，用于报告组件当前是否已提交。下面的子组件会在不可取消的任务结束后先检查挂载状态再更新。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useIsMounted } from 'better-hooks/use-is-mounted';

function DelayedTask({ onResult }: { onResult: (message: string) => void }) {
  const isMounted = useIsMounted();
  const [status, setStatus] = useState('空闲');

  const start = () => {
    setStatus('等待中...');
    window.setTimeout(() => {
      if (!isMounted()) {
        onResult('子组件已移除，已跳过状态更新');
        return;
      }
      setStatus('已完成');
      onResult('任务在子组件挂载期间完成');
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function MountedTaskGuard() {
  const [showChild, setShowChild] = useState(true);
  const [result, setResult] = useState('尚未开始任务');

  return (
    <div>
      {showChild ? <DelayedTask onResult={setResult} /> : <span>子组件已移除</span>}
      <button type="button" onClick={() => setShowChild((value) => !value)}>
        {showChild ? '移除子组件' : '挂载子组件'}
      </button>
      <output aria-live="polite">{result}</output>
    </div>
  );
}
```

## 行为说明

返回函数的引用保持稳定；组件提交后读取为 `true`，在卸载清理期间及之后读取为 `false`。异步任务能够取消时应优先取消；无法取消或回调仍需显式分支时再使用此守卫。
