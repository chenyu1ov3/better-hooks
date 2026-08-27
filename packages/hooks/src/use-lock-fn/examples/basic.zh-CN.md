# use-lock-fn

`useLockFn` 防止异步操作并发执行。持锁期间收到的调用会解析为 `undefined`，因此可以明确识别重复提交。

## 示例

```tsx
'use client';

import { useState } from 'react';
import { useLockFn } from 'better-hooks/use-lock-fn';

export function DraftSaveButton() {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('可以保存');
  const save = useLockFn(async () => {
    setSaving(true);
    try {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
      return new Date().toLocaleTimeString();
    } finally {
      setSaving(false);
    }
  });

  const handleSave = () => {
    void save().then((savedAt) => {
      setMessage(savedAt === undefined ? '已有保存任务正在运行' : `保存时间：${savedAt}`);
    });
  };

  return (
    <div>
      <button type="button" onClick={handleSave}>
        {saving ? '保存中...' : '保存草稿'}
      </button>
      <output aria-live="polite">{message}</output>
    </div>
  );
}
```

## 行为说明

第一次调用会在执行最近提交的函数前取得锁。重叠调用会直接解析为 `undefined`，不会再次执行函数。无论成功还是失败，锁都会在 `finally` 中释放；失败仍保持为 Promise 拒绝，也可以通过 `onError` 观察。
