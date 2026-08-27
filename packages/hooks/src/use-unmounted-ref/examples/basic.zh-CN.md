# use-unmounted-ref

`useUnmountedRef` 暴露一个引用稳定的 ref，其值会在卸载清理期间变为 `true`。当回调 API 更适合读取可变守卫而非调用函数时，它很方便。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useUnmountedRef } from 'better-hooks/use-unmounted-ref';

function UploadTask({ onResult }: { onResult: (message: string) => void }) {
  const unmounted = useUnmountedRef();
  const [status, setStatus] = useState('空闲');

  const start = () => {
    setStatus('上传中...');
    window.setTimeout(() => {
      if (unmounted.current) {
        onResult('上传回调在卸载后到达');
        return;
      }
      setStatus('已上传');
      onResult('上传在组件挂载期间完成');
    }, 1200);
  };

  return (
    <button type="button" onClick={start}>
      {status}
    </button>
  );
}

export function UnmountedUploadGuard() {
  const [showUpload, setShowUpload] = useState(true);
  const [result, setResult] = useState('尚未开始上传');

  return (
    <div>
      {showUpload ? <UploadTask onResult={setResult} /> : <span>上传组件已移除</span>}
      <button type="button" onClick={() => setShowUpload((value) => !value)}>
        {showUpload ? '移除上传组件' : '挂载上传组件'}
      </button>
      <output aria-live="polite">{result}</output>
    </div>
  );
}
```

## 行为说明

ref 初始为 `false`，并在渲染之间保持同一对象，卸载清理时变为 `true`。Strict Mode 重放 Effect 后，会为仍存活的组件恢复为 `false`；服务端渲染期间也始终为 `false`。
